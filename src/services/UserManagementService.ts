/**
 * Advanced User Management and Permissions Service
 * Production-ready user management with role-based access control
 * Rules.md compliant - uses only real Cloudflare D1 data
 */

import { Env } from '../types';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role_id: number;
  role_name: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  permissions: Permission[];
}

export interface Role {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  permissions: Permission[];
  user_count: number;
}

export interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description: string;
}

export interface UserActivity {
  id: number;
  user_id: number;
  action: string;
  resource: string;
  details: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface UserSession {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: string;
  is_active: boolean;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export class UserManagementService {
  constructor(private env: Env) {}

  /**
   * Hash password using Web Crypto API
   */
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verify password using Web Crypto API
   */
  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    const hashedInput = await this.hashPassword(password);
    return hashedInput === hashedPassword;
  }

  /**
   * Get all users with their roles and permissions
   */
  async getUsers(filters?: {
    role_id?: number;
    is_active?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const page = filters?.page || 1;
      const limit = Math.min(filters?.limit || 20, 100);
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      const params: any[] = [];

      if (filters?.role_id) {
        whereClause += ' AND u.role_id = ?';
        params.push(filters.role_id);
      }

      if (filters?.is_active !== undefined) {
        whereClause += ' AND u.is_active = ?';
        params.push(filters.is_active ? 1 : 0);
      }

      if (filters?.search) {
        whereClause += ' AND (u.username LIKE ? OR u.email LIKE ? OR u.full_name LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      // Get users with roles
      const usersQuery = `
        SELECT 
          u.id, u.username, u.email, u.full_name, u.role_id, 
          r.name as role_name, u.is_active, u.last_login, 
          u.created_at, u.updated_at
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        ${whereClause}
        ORDER BY u.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const users = await this.env.DB.prepare(usersQuery)
        .bind(...params, limit, offset)
        .all();

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM users u
        ${whereClause}
      `;

      const totalResult = await this.env.DB.prepare(countQuery)
        .bind(...params)
        .first<{ total: number }>();

      // Get permissions for each user
      const usersWithPermissions = await Promise.all(
        (users.results as any[]).map(async (user) => {
          const permissions = await this.getUserPermissions(user.id);
          return { ...user, permissions };
        })
      );

      return {
        users: usersWithPermissions,
        pagination: {
          page,
          limit,
          total: totalResult?.total || 0,
          pages: Math.ceil((totalResult?.total || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    full_name: string;
    role_id: number;
  }): Promise<User> {
    try {
      // Check if username or email already exists
      const existingUser = await this.env.DB.prepare(`
        SELECT id FROM users WHERE username = ? OR email = ?
      `).bind(userData.username, userData.email).first();

      if (existingUser) {
        throw new Error('Username or email already exists');
      }

      // Hash password using Web Crypto API
      const hashedPassword = await this.hashPassword(userData.password);

      // Create user
      const result = await this.env.DB.prepare(`
        INSERT INTO users (
          username, email, password_hash, full_name, role_id, 
          is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
      `).bind(
        userData.username,
        userData.email,
        hashedPassword,
        userData.full_name,
        userData.role_id
      ).run();

      const userId = result.meta.last_row_id as number;

      // Get the created user with role and permissions
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('Failed to retrieve created user');
      }

      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user information
   */
  async updateUser(userId: number, updates: {
    username?: string;
    email?: string;
    full_name?: string;
    role_id?: number;
    is_active?: boolean;
  }): Promise<User> {
    try {
      const updateFields: string[] = [];
      const params: any[] = [];

      if (updates.username) {
        updateFields.push('username = ?');
        params.push(updates.username);
      }

      if (updates.email) {
        updateFields.push('email = ?');
        params.push(updates.email);
      }

      if (updates.full_name) {
        updateFields.push('full_name = ?');
        params.push(updates.full_name);
      }

      if (updates.role_id) {
        updateFields.push('role_id = ?');
        params.push(updates.role_id);
      }

      if (updates.is_active !== undefined) {
        updateFields.push('is_active = ?');
        params.push(updates.is_active ? 1 : 0);
      }

      updateFields.push('updated_at = datetime(\'now\')');
      params.push(userId);

      await this.env.DB.prepare(`
        UPDATE users SET ${updateFields.join(', ')} WHERE id = ?
      `).bind(...params).run();

      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found after update');
      }

      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Get user by ID with role and permissions
   */
  async getUserById(userId: number): Promise<User | null> {
    try {
      const user = await this.env.DB.prepare(`
        SELECT 
          u.id, u.username, u.email, u.full_name, u.role_id,
          r.name as role_name, u.is_active, u.last_login,
          u.created_at, u.updated_at
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = ?
      `).bind(userId).first<any>();

      if (!user) {
        return null;
      }

      const permissions = await this.getUserPermissions(userId);
      return { ...user, permissions };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(userId: number): Promise<Permission[]> {
    try {
      const permissions = await this.env.DB.prepare(`
        SELECT DISTINCT p.id, p.name, p.resource, p.action, p.description
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN users u ON rp.role_id = u.role_id
        WHERE u.id = ? AND u.is_active = 1
        ORDER BY p.resource, p.action
      `).bind(userId).all();

      return permissions.results as Permission[];
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(userId: number, resource: string, action: string): Promise<boolean> {
    try {
      const permission = await this.env.DB.prepare(`
        SELECT 1
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN users u ON rp.role_id = u.role_id
        WHERE u.id = ? AND p.resource = ? AND p.action = ? AND u.is_active = 1
        LIMIT 1
      `).bind(userId, resource, action).first();

      return !!permission;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Get all roles with permissions
   */
  async getRoles(): Promise<Role[]> {
    try {
      const roles = await this.env.DB.prepare(`
        SELECT 
          r.id, r.name, r.description, r.is_active,
          COUNT(u.id) as user_count
        FROM roles r
        LEFT JOIN users u ON r.id = u.role_id AND u.is_active = 1
        WHERE r.is_active = 1
        GROUP BY r.id, r.name, r.description, r.is_active
        ORDER BY r.name
      `).all();

      // Get permissions for each role
      const rolesWithPermissions = await Promise.all(
        (roles.results as any[]).map(async (role) => {
          const permissions = await this.env.DB.prepare(`
            SELECT p.id, p.name, p.resource, p.action, p.description
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role_id = ?
            ORDER BY p.resource, p.action
          `).bind(role.id).all();

          return {
            ...role,
            permissions: permissions.results as Permission[]
          };
        })
      );

      return rolesWithPermissions;
    } catch (error) {
      console.error('Error getting roles:', error);
      throw error;
    }
  }

  /**
   * Log user activity
   */
  async logActivity(activity: {
    user_id: number;
    action: string;
    resource: string;
    details: string;
    ip_address: string;
    user_agent: string;
  }): Promise<void> {
    try {
      await this.env.DB.prepare(`
        INSERT INTO user_activities (
          user_id, action, resource, details, ip_address, user_agent, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        activity.user_id,
        activity.action,
        activity.resource,
        activity.details,
        activity.ip_address,
        activity.user_agent
      ).run();
    } catch (error) {
      console.error('Error logging user activity:', error);
    }
  }

  /**
   * Get user activity history
   */
  async getUserActivity(userId: number, limit: number = 50): Promise<UserActivity[]> {
    try {
      const activities = await this.env.DB.prepare(`
        SELECT *
        FROM user_activities
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `).bind(userId, limit).all();

      return activities.results as UserActivity[];
    } catch (error) {
      console.error('Error getting user activity:', error);
      return [];
    }
  }

  /**
   * Initialize user management tables
   */
  async initializeTables(): Promise<void> {
    try {
      // Create roles table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS roles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      // Create permissions table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS permissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          resource TEXT NOT NULL,
          action TEXT NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(resource, action)
        )
      `).run();

      // Create role_permissions table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS role_permissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          role_id INTEGER NOT NULL,
          permission_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (role_id) REFERENCES roles(id),
          FOREIGN KEY (permission_id) REFERENCES permissions(id),
          UNIQUE(role_id, permission_id)
        )
      `).run();

      // Create user_activities table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS user_activities (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          action TEXT NOT NULL,
          resource TEXT NOT NULL,
          details TEXT,
          ip_address TEXT,
          user_agent TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `).run();

      // Create user_sessions table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token_hash TEXT NOT NULL,
          expires_at DATETIME NOT NULL,
          is_active BOOLEAN DEFAULT 1,
          ip_address TEXT,
          user_agent TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `).run();

      // Insert default roles if they don't exist
      await this.createDefaultRoles();

      console.log('User management tables initialized successfully');
    } catch (error) {
      console.error('Error initializing user management tables:', error);
      throw error;
    }
  }

  /**
   * Create default roles and permissions
   */
  private async createDefaultRoles(): Promise<void> {
    try {
      // Check if roles already exist
      const existingRoles = await this.env.DB.prepare('SELECT COUNT(*) as count FROM roles').first<{ count: number }>();

      if (existingRoles && existingRoles.count > 0) {
        return; // Roles already exist
      }

      // Create default permissions
      const permissions = [
        { name: 'View Products', resource: 'products', action: 'read' },
        { name: 'Create Products', resource: 'products', action: 'create' },
        { name: 'Update Products', resource: 'products', action: 'update' },
        { name: 'Delete Products', resource: 'products', action: 'delete' },
        { name: 'View Sales', resource: 'sales', action: 'read' },
        { name: 'Create Sales', resource: 'sales', action: 'create' },
        { name: 'Update Sales', resource: 'sales', action: 'update' },
        { name: 'View Reports', resource: 'reports', action: 'read' },
        { name: 'Manage Users', resource: 'users', action: 'manage' },
        { name: 'System Settings', resource: 'system', action: 'configure' }
      ];

      for (const perm of permissions) {
        await this.env.DB.prepare(`
          INSERT OR IGNORE INTO permissions (name, resource, action, description)
          VALUES (?, ?, ?, ?)
        `).bind(perm.name, perm.resource, perm.action, perm.name).run();
      }

      // Create default roles
      const adminRole = await this.env.DB.prepare(`
        INSERT INTO roles (name, description) VALUES ('Admin', 'Full system access')
      `).run();

      const managerRole = await this.env.DB.prepare(`
        INSERT INTO roles (name, description) VALUES ('Manager', 'Management access')
      `).run();

      const cashierRole = await this.env.DB.prepare(`
        INSERT INTO roles (name, description) VALUES ('Cashier', 'Sales and basic operations')
      `).run();

      // Assign permissions to roles
      const allPermissions = await this.env.DB.prepare('SELECT id FROM permissions').all();

      // Admin gets all permissions
      for (const perm of allPermissions.results as any[]) {
        await this.env.DB.prepare(`
          INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)
        `).bind(adminRole.meta.last_row_id, perm.id).run();
      }

      console.log('Default roles and permissions created');
    } catch (error) {
      console.error('Error creating default roles:', error);
    }
  }
}
