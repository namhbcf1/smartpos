import { Env } from '../../types';
import { User, UserCreateData, UserUpdateData, UserQueryParams, UserStats } from './types';

export class UserDatabase {
  constructor(private env: Env) {}

  // Initialize database tables
  async initializeTables(): Promise<void> {
    try {
      // Create users table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          full_name TEXT NOT NULL,
          phone TEXT,
          role TEXT NOT NULL DEFAULT 'staff',
          store_id INTEGER,
          is_active INTEGER NOT NULL DEFAULT 1,
          avatar_url TEXT,
          last_login DATETIME,
          login_count INTEGER NOT NULL DEFAULT 0,
          permissions TEXT, -- JSON array of permissions
          settings TEXT, -- JSON object of user settings
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
          created_by INTEGER,
          updated_by INTEGER,
          FOREIGN KEY (store_id) REFERENCES stores(id),
          FOREIGN KEY (created_by) REFERENCES users(id),
          FOREIGN KEY (updated_by) REFERENCES users(id)
        )
      `).run();

      // Create user sessions table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          token TEXT NOT NULL UNIQUE,
          refresh_token TEXT UNIQUE,
          expires_at DATETIME NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          last_activity DATETIME NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `).run();

      // Create user activities table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS user_activities (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          action TEXT NOT NULL,
          resource_type TEXT,
          resource_id INTEGER,
          details TEXT, -- JSON object
          ip_address TEXT,
          user_agent TEXT,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `).run();

      // Create user permissions table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS user_permissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          resource TEXT NOT NULL,
          action TEXT NOT NULL,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL DEFAULT (datetime('now'))
        )
      `).run();

      // Create roles table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS roles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          permissions TEXT, -- JSON array of permission names
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
        )
      `).run();

      // Create user profiles table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL UNIQUE,
          bio TEXT,
          address TEXT,
          city TEXT,
          country TEXT,
          timezone TEXT DEFAULT 'UTC',
          language TEXT DEFAULT 'vi',
          date_format TEXT DEFAULT 'DD/MM/YYYY',
          time_format TEXT DEFAULT '24h',
          currency TEXT DEFAULT 'VND',
          notifications TEXT, -- JSON object
          preferences TEXT, -- JSON object
          updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `).run();

      // Create password resets table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS password_resets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token TEXT NOT NULL UNIQUE,
          expires_at DATETIME NOT NULL,
          is_used INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          used_at DATETIME,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `).run();

      // Create login attempts table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS login_attempts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL,
          ip_address TEXT NOT NULL,
          user_agent TEXT,
          success INTEGER NOT NULL,
          failure_reason TEXT,
          created_at DATETIME NOT NULL DEFAULT (datetime('now'))
        )
      `).run();

      // Create two factor auth table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS two_factor_auth (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL UNIQUE,
          secret TEXT NOT NULL,
          backup_codes TEXT, -- JSON array
          is_enabled INTEGER NOT NULL DEFAULT 0,
          verified_at DATETIME,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `).run();

      // Create API keys table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS api_keys (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          key_hash TEXT NOT NULL UNIQUE,
          permissions TEXT, -- JSON array
          expires_at DATETIME,
          last_used DATETIME,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `).run();

      // Create indexes for better performance
      await this.env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`).run();
      await this.env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`).run();
      await this.env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`).run();
      await this.env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_users_store ON users(store_id)`).run();
      await this.env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)`).run();
      await this.env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id)`).run();
      await this.env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token)`).run();
      await this.env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_activities_user ON user_activities(user_id)`).run();
      await this.env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_login_attempts_username ON login_attempts(username)`).run();
      await this.env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address)`).run();

      console.log('User database tables initialized successfully');
    } catch (error) {
      console.error('Error initializing user database tables:', error);
      throw error;
    }
  }

  // Create default permissions and roles
  async createDefaultData(): Promise<void> {
    try {
      // Check if permissions exist
      const permissionCount = await this.env.DB.prepare('SELECT COUNT(*) as count FROM user_permissions').first<{ count: number }>();

      if (!permissionCount || permissionCount.count === 0) {
        console.log('Creating default permissions...');

        const permissions = [
          // Product permissions
          { name: 'products.view', description: 'View products', resource: 'products', action: 'view' },
          { name: 'products.create', description: 'Create products', resource: 'products', action: 'create' },
          { name: 'products.update', description: 'Update products', resource: 'products', action: 'update' },
          { name: 'products.delete', description: 'Delete products', resource: 'products', action: 'delete' },
          
          // Sales permissions
          { name: 'sales.view', description: 'View sales', resource: 'sales', action: 'view' },
          { name: 'sales.create', description: 'Create sales', resource: 'sales', action: 'create' },
          { name: 'sales.update', description: 'Update sales', resource: 'sales', action: 'update' },
          { name: 'sales.delete', description: 'Delete sales', resource: 'sales', action: 'delete' },
          
          // Customer permissions
          { name: 'customers.view', description: 'View customers', resource: 'customers', action: 'view' },
          { name: 'customers.create', description: 'Create customers', resource: 'customers', action: 'create' },
          { name: 'customers.update', description: 'Update customers', resource: 'customers', action: 'update' },
          { name: 'customers.delete', description: 'Delete customers', resource: 'customers', action: 'delete' },

          // Returns permissions
          { name: 'returns.view', description: 'View returns', resource: 'returns', action: 'view' },
          { name: 'returns.create', description: 'Create returns', resource: 'returns', action: 'create' },
          { name: 'returns.update', description: 'Update returns', resource: 'returns', action: 'update' },
          { name: 'returns.delete', description: 'Delete returns', resource: 'returns', action: 'delete' },

          // Warranty permissions
          { name: 'warranty.view', description: 'View warranty', resource: 'warranty', action: 'view' },
          { name: 'warranty.create', description: 'Create warranty', resource: 'warranty', action: 'create' },
          { name: 'warranty.update', description: 'Update warranty', resource: 'warranty', action: 'update' },
          { name: 'warranty.delete', description: 'Delete warranty', resource: 'warranty', action: 'delete' },

          // User permissions
          { name: 'users.view', description: 'View users', resource: 'users', action: 'view' },
          { name: 'users.create', description: 'Create users', resource: 'users', action: 'create' },
          { name: 'users.update', description: 'Update users', resource: 'users', action: 'update' },
          { name: 'users.delete', description: 'Delete users', resource: 'users', action: 'delete' },

          // Report permissions
          { name: 'reports.view', description: 'View reports', resource: 'reports', action: 'view' },
          { name: 'reports.export', description: 'Export reports', resource: 'reports', action: 'export' },

          // Settings permissions
          { name: 'settings.view', description: 'View settings', resource: 'settings', action: 'view' },
          { name: 'settings.update', description: 'Update settings', resource: 'settings', action: 'update' }
        ];

        for (const permission of permissions) {
          await this.env.DB.prepare(`
            INSERT INTO user_permissions (name, description, resource, action)
            VALUES (?, ?, ?, ?)
          `).bind(permission.name, permission.description, permission.resource, permission.action).run();
        }
      }

      // Check if roles exist
      const roleCount = await this.env.DB.prepare('SELECT COUNT(*) as count FROM roles').first<{ count: number }>();

      if (!roleCount || roleCount.count === 0) {
        console.log('Creating default roles...');

        const roles = [
          {
            name: 'admin',
            description: 'System administrator with full access',
            permissions: [
              'products.view', 'products.create', 'products.update', 'products.delete',
              'sales.view', 'sales.create', 'sales.update', 'sales.delete',
              'customers.view', 'customers.create', 'customers.update', 'customers.delete',
              'users.view', 'users.create', 'users.update', 'users.delete',
              'reports.view', 'reports.export',
              'settings.view', 'settings.update'
            ]
          },
          {
            name: 'manager',
            description: 'Store manager with management access',
            permissions: [
              'products.view', 'products.create', 'products.update',
              'sales.view', 'sales.create', 'sales.update',
              'customers.view', 'customers.create', 'customers.update',
              'users.view',
              'reports.view', 'reports.export'
            ]
          },
          {
            name: 'cashier',
            description: 'Cashier with sales and product management access',
            permissions: [
              'products.view', 'products.update',  // Thu ngân có thể sửa đổi sản phẩm
              'sales.view', 'sales.create', 'sales.update',
              'returns.view', 'returns.create',
              'customers.view', 'customers.create', 'customers.update'
            ]
          },
          {
            name: 'sales_agent',
            description: 'Sales agent with sales and customer access',
            permissions: [
              'products.view',  // Chỉ xem sản phẩm, không sửa đổi
              'sales.view', 'sales.create', 'sales.update',
              'returns.view', 'returns.create',
              'warranty.view', 'warranty.create', 'warranty.update',
              'customers.view', 'customers.create', 'customers.update'
            ]
          },
          {
            name: 'affiliate',
            description: 'Affiliate with sales and customer access',
            permissions: [
              'products.view',  // Chỉ xem sản phẩm, không sửa đổi
              'sales.view', 'sales.create', 'sales.update',
              'returns.view', 'returns.create',
              'warranty.view', 'warranty.create', 'warranty.update',
              'customers.view', 'customers.create', 'customers.update'
            ]
          },
          {
            name: 'staff',
            description: 'General staff with limited access',
            permissions: [
              'products.view',
              'sales.view',
              'customers.view'
            ]
          }
        ];

        for (const role of roles) {
          await this.env.DB.prepare(`
            INSERT INTO roles (name, description, permissions)
            VALUES (?, ?, ?)
          `).bind(role.name, role.description, JSON.stringify(role.permissions)).run();
        }
      }

      // Check if admin user exists
      const adminUser = await this.env.DB.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').bind('admin').first<{ id: number }>();

      if (!adminUser) {
        console.log('Creating default admin user...');
        
        // Create default admin user
        const passwordHash = await this.hashPassword('admin123'); // Default password
        
        await this.env.DB.prepare(`
          INSERT INTO users (username, email, password_hash, full_name, role, is_active)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind('admin', 'admin@smartpos.com', passwordHash, 'System Administrator', 'admin', 1).run();
      }

      console.log('Default user data created successfully');
    } catch (error) {
      console.error('Error creating default user data:', error);
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

  // Get user statistics
  async getStats(): Promise<UserStats> {
    try {
      const stats = await this.env.DB.prepare(`
        SELECT 
          COUNT(*) as total_users,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users,
          SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_users,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count,
          SUM(CASE WHEN role = 'manager' THEN 1 ELSE 0 END) as manager_count,
          SUM(CASE WHEN role = 'cashier' THEN 1 ELSE 0 END) as cashier_count,
          SUM(CASE WHEN role = 'staff' THEN 1 ELSE 0 END) as staff_count,
          SUM(CASE WHEN last_login >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as recent_logins
        FROM users
      `).first<any>();

      const storesCount = await this.env.DB.prepare(`
        SELECT COUNT(DISTINCT store_id) as count 
        FROM users 
        WHERE store_id IS NOT NULL
      `).first<{ count: number }>();

      return {
        total_users: stats?.total_users || 0,
        active_users: stats?.active_users || 0,
        inactive_users: stats?.inactive_users || 0,
        admin_count: stats?.admin_count || 0,
        manager_count: stats?.manager_count || 0,
        cashier_count: stats?.cashier_count || 0,
        employee_count: stats?.staff_count || 0,
        recent_logins: stats?.recent_logins || 0
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }
}
