import { Env } from '../../types';
import { User, UserCreateData, UserUpdateData, UserQueryParams, UserStats } from './types';
import { UserDatabase } from './database';
import { CacheManager, CacheKeys } from '../../utils/cache';

export class UserService {
  private db: UserDatabase;
  private cache: CacheManager;

  constructor(private env: Env) {
    this.db = new UserDatabase(env);
    this.cache = new CacheManager(env);
  }

  // Initialize service
  async initialize(): Promise<void> {
    await this.db.initializeTables();
    await this.db.createDefaultData();
  }

  // Get all users with filtering and pagination
  async getUsers(params: UserQueryParams): Promise<{ users: User[]; total: number; stats?: UserStats }> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        role,
        store_id,
        is_active,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = params;

      const offset = (page - 1) * limit;

      // Build WHERE clause
      const conditions: string[] = [];
      const bindings: any[] = [];

      if (search) {
        conditions.push('(u.username LIKE ? OR u.email LIKE ? OR u.full_name LIKE ? OR u.phone LIKE ?)');
        const searchTerm = `%${search}%`;
        bindings.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (role) {
        conditions.push('u.role = ?');
        bindings.push(role);
      }

      if (store_id) {
        conditions.push('u.store_id = ?');
        bindings.push(store_id);
      }

      if (is_active !== undefined) {
        conditions.push('u.is_active = ?');
        bindings.push(is_active ? 1 : 0);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Build ORDER BY clause
      const validSortFields = ['username', 'email', 'full_name', 'role', 'created_at', 'last_login'];
      const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
      const sortDirection = sort_order === 'asc' ? 'ASC' : 'DESC';

      // Get users with store information
      const query = `
        SELECT 
          u.*,
          s.name as store_name
        FROM users u
        LEFT JOIN stores s ON u.store_id = s.id
        ${whereClause}
        ORDER BY u.${sortField} ${sortDirection}
        LIMIT ? OFFSET ?
      `;

      const users = await this.env.DB.prepare(query)
        .bind(...bindings, limit, offset)
        .all<User>();

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM users u
        ${whereClause}
      `;

      const countResult = await this.env.DB.prepare(countQuery)
        .bind(...bindings)
        .first<{ total: number }>();

      const total = countResult?.total || 0;

      // Get stats if requested (first page only)
      let stats: UserStats | undefined;
      if (page === 1) {
        stats = await this.db.getStats();
      }

      return {
        users: users.results || [],
        total,
        stats
      };
    } catch (error) {
      console.error('Error getting users:', error);
      throw new Error('Failed to get users');
    }
  }

  // Get user by ID
  async getUserById(id: number): Promise<User | null> {
    try {
      const cacheKey = CacheKeys.user(id);
      const cached = await this.cache.get<User>(cacheKey);
      if (cached) return cached;

      const user = await this.env.DB.prepare(`
        SELECT 
          u.*,
          s.name as store_name
        FROM users u
        LEFT JOIN stores s ON u.store_id = s.id
        WHERE u.id = ?
      `).bind(id).first<User>();

      if (user) {
        // Remove password hash from response
        delete (user as any).password_hash;
        await this.cache.set(cacheKey, user, 300); // Cache for 5 minutes
      }

      return user || null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw new Error('Failed to get user');
    }
  }

  // Get user by username
  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const user = await this.env.DB.prepare(`
        SELECT 
          u.*,
          s.name as store_name
        FROM users u
        LEFT JOIN stores s ON u.store_id = s.id
        WHERE u.username = ?
      `).bind(username).first<User>();

      if (user) {
        // Remove password hash from response
        delete (user as any).password_hash;
      }

      return user || null;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw new Error('Failed to get user');
    }
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.env.DB.prepare(`
        SELECT 
          u.*,
          s.name as store_name
        FROM users u
        LEFT JOIN stores s ON u.store_id = s.id
        WHERE u.email = ?
      `).bind(email).first<User>();

      if (user) {
        // Remove password hash from response
        delete (user as any).password_hash;
      }

      return user || null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw new Error('Failed to get user');
    }
  }

  // Get user by employee ID (using email to match)
  async getUserByEmployeeId(employeeId: number): Promise<User | null> {
    try {
      // First get employee email
      const employee = await this.env.DB.prepare(`
        SELECT email FROM employees WHERE id = ?
      `).bind(employeeId).first();

      if (!employee || !employee.email) {
        return null;
      }

      // Then find user by email
      const user = await this.env.DB.prepare(`
        SELECT
          u.*,
          s.name as store_name
        FROM users u
        LEFT JOIN stores s ON u.store_id = s.id
        WHERE u.email = ?
      `).bind(employee.email).first<User>();

      if (user) {
        // Remove password hash from response
        delete (user as any).password_hash;
      }

      return user || null;
    } catch (error) {
      console.error('Error getting user by employee ID:', error);
      throw new Error('Failed to get user');
    }
  }

  // Create new user
  async createUser(data: UserCreateData, createdBy: number): Promise<User> {
    try {
      // Check if username already exists
      const existingUsername = await this.getUserByUsername(data.username);
      if (existingUsername) {
        throw new Error('Username already exists');
      }

      // Check if email already exists
      const existingEmail = await this.getUserByEmail(data.email);
      if (existingEmail) {
        throw new Error('Email already exists');
      }

      // Validate store exists if provided
      if (data.store_id) {
        const store = await this.env.DB.prepare('SELECT id FROM stores WHERE id = ?')
          .bind(data.store_id).first<{ id: number }>();
        
        if (!store) {
          throw new Error('Store not found');
        }
      }

      // Hash password
      const passwordHash = await this.hashPassword(data.password);

      const result = await this.env.DB.prepare(`
        INSERT INTO users (
          username, email, password_hash, full_name, phone, role, store_id,
          is_active, avatar_url, permissions, settings, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        data.username,
        data.email,
        passwordHash,
        data.full_name,
        data.phone,
        data.role,
        data.store_id,
        data.is_active !== false ? 1 : 0,
        data.avatar_url,
        data.permissions ? JSON.stringify(data.permissions) : null,
        data.settings ? JSON.stringify(data.settings) : null,
        createdBy
      ).run();

      const userId = result.meta.last_row_id as number;

      // Create user profile
      await this.env.DB.prepare(`
        INSERT INTO user_profiles (user_id)
        VALUES (?)
      `).bind(userId).run();

      // Clear cache
      await this.cache.delete(CacheKeys.usersList());

      const newUser = await this.getUserById(userId);
      if (!newUser) {
        throw new Error('Failed to retrieve created user');
      }

      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user
  async updateUser(id: number, data: UserUpdateData, updatedBy: number): Promise<User> {
    try {
      const existingUser = await this.getUserById(id);
      if (!existingUser) {
        throw new Error('User not found');
      }

      // Check username uniqueness if changed
      if (data.username && data.username !== existingUser.username) {
        const existingUsername = await this.getUserByUsername(data.username);
        if (existingUsername) {
          throw new Error('Username already exists');
        }
      }

      // Check email uniqueness if changed
      if (data.email && data.email !== existingUser.email) {
        const existingEmail = await this.getUserByEmail(data.email);
        if (existingEmail) {
          throw new Error('Email already exists');
        }
      }

      // Build update query dynamically
      const updateFields: string[] = [];
      const bindings: any[] = [];

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && key !== 'updated_by') {
          if (key === 'password') {
            updateFields.push('password_hash = ?');
            bindings.push(this.hashPassword(value as string));
          } else if (key === 'permissions' || key === 'settings') {
            updateFields.push(`${key} = ?`);
            bindings.push(value ? JSON.stringify(value) : null);
          } else if (typeof value === 'boolean') {
            updateFields.push(`${key} = ?`);
            bindings.push(value ? 1 : 0);
          } else {
            updateFields.push(`${key} = ?`);
            bindings.push(value);
          }
        }
      });

      updateFields.push('updated_by = ?', 'updated_at = datetime(\'now\')');
      bindings.push(updatedBy, id);

      await this.env.DB.prepare(`
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `).bind(...bindings).run();

      // Clear cache
      await this.cache.delete(CacheKeys.user(id));
      await this.cache.delete(CacheKeys.usersList());

      const updatedUser = await this.getUserById(id);
      if (!updatedUser) {
        throw new Error('Failed to retrieve updated user');
      }

      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user (deactivate)
  async deleteUser(id: number, deletedBy: number): Promise<void> {
    try {
      const user = await this.getUserById(id);
      if (!user) {
        throw new Error('User not found');
      }

      // Don't allow deleting the last admin
      if (user.role === 'admin') {
        const adminCount = await this.env.DB.prepare(`
          SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND is_active = 1
        `).first<{ count: number }>();

        if (adminCount && adminCount.count <= 1) {
          throw new Error('Cannot delete the last admin user');
        }
      }

      await this.env.DB.prepare(`
        UPDATE users 
        SET is_active = 0, updated_by = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(deletedBy, id).run();

      // Clear cache
      await this.cache.delete(CacheKeys.user(id));
      await this.cache.delete(CacheKeys.usersList());
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Hash password (simplified - in production use proper bcrypt)
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'smartpos_salt'); // Add salt
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Verify password
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await this.hashPassword(password);
    return passwordHash === hash;
  }

  // Update last login
  async updateLastLogin(userId: number): Promise<void> {
    try {
      await this.env.DB.prepare(`
        UPDATE users 
        SET last_login = datetime('now'), login_count = login_count + 1
        WHERE id = ?
      `).bind(userId).run();

      // Clear cache
      await this.cache.delete(CacheKeys.user(userId));
    } catch (error) {
      console.error('Error updating last login:', error);
      throw error;
    }
  }

  // Get user statistics
  async getStats(): Promise<UserStats> {
    return await this.db.getStats();
  }
}
