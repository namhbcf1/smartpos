/**
 * RBAC Initialization Service
 * Populates the database with default resources, actions, permissions, and role templates
 */

import { Env } from '../types';

export class RBACInitializationService {
  constructor(private env: Env) {}

  /**
   * Initialize the complete RBAC system
   */
  async initializeRBAC(): Promise<void> {
    try {
      console.log('🔐 Initializing Enhanced RBAC System...');
      
      await this.initializeTables();
      await this.initializeSystemResources();
      await this.initializeSystemActions();
      await this.initializePermissions();
      await this.initializeRoleTemplates();
      
      console.log('✅ Enhanced RBAC System initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing RBAC system:', error);
      throw error;
    }
  }

  /**
   * Create RBAC tables
   */
  private async initializeTables(): Promise<void> {
    const schemaSQL = `
      -- System resources (menu items, database tables, features)
      CREATE TABLE IF NOT EXISTS system_resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        resource_type TEXT NOT NULL CHECK (resource_type IN ('menu', 'database', 'feature')),
        parent_resource TEXT,
        description TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS system_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        description TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        resource_id INTEGER NOT NULL,
        action_id INTEGER NOT NULL,
        permission_key TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        description TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (resource_id) REFERENCES system_resources(id) ON DELETE CASCADE,
        FOREIGN KEY (action_id) REFERENCES system_actions(id) ON DELETE CASCADE,
        UNIQUE(resource_id, action_id)
      );

      CREATE TABLE IF NOT EXISTS employee_roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        role_id INTEGER NOT NULL,
        assigned_by INTEGER NOT NULL,
        assigned_at DATETIME NOT NULL DEFAULT (datetime('now')),
        is_active INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE RESTRICT,
        UNIQUE(employee_id, role_id)
      );

      CREATE TABLE IF NOT EXISTS employee_permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        permission_id INTEGER NOT NULL,
        granted INTEGER NOT NULL,
        granted_by INTEGER NOT NULL,
        granted_at DATETIME NOT NULL DEFAULT (datetime('now')),
        expires_at DATETIME,
        reason TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
        FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE RESTRICT,
        UNIQUE(employee_id, permission_id)
      );

      CREATE TABLE IF NOT EXISTS role_permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role_id INTEGER NOT NULL,
        permission_id INTEGER NOT NULL,
        granted INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
        UNIQUE(role_id, permission_id)
      );

      CREATE TABLE IF NOT EXISTS permission_audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        permission_key TEXT NOT NULL,
        action TEXT NOT NULL,
        old_value INTEGER,
        new_value INTEGER,
        changed_by INTEGER NOT NULL,
        reason TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE RESTRICT
      );
    `;

    await this.env.DB.exec(schemaSQL);
    console.log('📋 RBAC tables created successfully');
  }

  /**
   * Initialize system resources (menu items, database tables, features)
   */
  private async initializeSystemResources(): Promise<void> {
    const resources = [
      // Menu Resources
      { name: 'dashboard', display_name: 'Dashboard', resource_type: 'menu', description: 'Trang tổng quan hệ thống' },
      { name: 'sales', display_name: 'Bán hàng', resource_type: 'menu', description: 'Quản lý bán hàng và đơn hàng' },
      { name: 'sales.pos', display_name: 'Điểm bán hàng', resource_type: 'menu', parent_resource: 'sales', description: 'Giao diện bán hàng trực tiếp' },
      { name: 'sales.history', display_name: 'Lịch sử bán hàng', resource_type: 'menu', parent_resource: 'sales', description: 'Xem lịch sử các đơn hàng' },
      { name: 'sales.orders', display_name: 'Đơn hàng', resource_type: 'menu', parent_resource: 'sales', description: 'Quản lý đơn hàng' },
      { name: 'sales.returns', display_name: 'Trả hàng', resource_type: 'menu', parent_resource: 'sales', description: 'Xử lý trả hàng' },
      
      { name: 'inventory', display_name: 'Kho hàng', resource_type: 'menu', description: 'Quản lý kho hàng và sản phẩm' },
      { name: 'inventory.products', display_name: 'Sản phẩm', resource_type: 'menu', parent_resource: 'inventory', description: 'Quản lý sản phẩm' },
      { name: 'inventory.categories', display_name: 'Danh mục', resource_type: 'menu', parent_resource: 'inventory', description: 'Quản lý danh mục sản phẩm' },
      { name: 'inventory.stock', display_name: 'Nhập kho', resource_type: 'menu', parent_resource: 'inventory', description: 'Quản lý nhập kho' },
      { name: 'inventory.suppliers', display_name: 'Nhà cung cấp', resource_type: 'menu', parent_resource: 'inventory', description: 'Quản lý nhà cung cấp' },
      { name: 'inventory.serial', display_name: 'Serial Numbers', resource_type: 'menu', parent_resource: 'inventory', description: 'Quản lý số serial' },
      { name: 'inventory.pcbuilder', display_name: 'PC Builder', resource_type: 'menu', parent_resource: 'inventory', description: 'Công cụ build PC' },
      { name: 'inventory.warranty', display_name: 'Bảo hành', resource_type: 'menu', parent_resource: 'inventory', description: 'Quản lý bảo hành' },
      
      { name: 'customers', display_name: 'Khách hàng', resource_type: 'menu', description: 'Quản lý thông tin khách hàng' },
      
      { name: 'reports', display_name: 'Báo cáo', resource_type: 'menu', description: 'Báo cáo và thống kê' },
      { name: 'reports.overview', display_name: 'Tổng quan', resource_type: 'menu', parent_resource: 'reports', description: 'Báo cáo tổng quan' },
      { name: 'reports.revenue', display_name: 'Doanh thu', resource_type: 'menu', parent_resource: 'reports', description: 'Báo cáo doanh thu' },
      { name: 'reports.finance', display_name: 'Tài chính', resource_type: 'menu', parent_resource: 'reports', description: 'Báo cáo tài chính' },
      
      { name: 'administration', display_name: 'Quản trị', resource_type: 'menu', description: 'Quản trị hệ thống' },
      { name: 'administration.employees', display_name: 'Nhân viên', resource_type: 'menu', parent_resource: 'administration', description: 'Quản lý nhân viên' },
      { name: 'administration.settings', display_name: 'Cài đặt', resource_type: 'menu', parent_resource: 'administration', description: 'Cài đặt hệ thống' },

      // Database Resources
      { name: 'products_table', display_name: 'Bảng sản phẩm', resource_type: 'database', description: 'Truy cập bảng products' },
      { name: 'sales_table', display_name: 'Bảng bán hàng', resource_type: 'database', description: 'Truy cập bảng sales' },
      { name: 'customers_table', display_name: 'Bảng khách hàng', resource_type: 'database', description: 'Truy cập bảng customers' },
      { name: 'employees_table', display_name: 'Bảng nhân viên', resource_type: 'database', description: 'Truy cập bảng employees' },
      { name: 'categories_table', display_name: 'Bảng danh mục', resource_type: 'database', description: 'Truy cập bảng categories' },
      { name: 'suppliers_table', display_name: 'Bảng nhà cung cấp', resource_type: 'database', description: 'Truy cập bảng suppliers' },
      { name: 'inventory_table', display_name: 'Bảng kho hàng', resource_type: 'database', description: 'Truy cập bảng inventory' },
      { name: 'returns_table', display_name: 'Bảng trả hàng', resource_type: 'database', description: 'Truy cập bảng returns' },
      { name: 'warranty_table', display_name: 'Bảng bảo hành', resource_type: 'database', description: 'Truy cập bảng warranty' },

      // Feature Resources
      { name: 'export_data', display_name: 'Xuất dữ liệu', resource_type: 'feature', description: 'Xuất dữ liệu ra file' },
      { name: 'import_data', display_name: 'Nhập dữ liệu', resource_type: 'feature', description: 'Nhập dữ liệu từ file' },
      { name: 'bulk_operations', display_name: 'Thao tác hàng loạt', resource_type: 'feature', description: 'Thực hiện thao tác hàng loạt' },
      { name: 'advanced_reports', display_name: 'Báo cáo nâng cao', resource_type: 'feature', description: 'Tạo báo cáo nâng cao' },
      { name: 'system_backup', display_name: 'Sao lưu hệ thống', resource_type: 'feature', description: 'Sao lưu và khôi phục dữ liệu' }
    ];

    for (const resource of resources) {
      await this.env.DB.prepare(`
        INSERT OR IGNORE INTO system_resources (name, display_name, resource_type, parent_resource, description)
        VALUES (?, ?, ?, ?, ?)
      `).bind(resource.name, resource.display_name, resource.resource_type, resource.parent_resource || null, resource.description).run();
    }

    console.log('📁 System resources initialized');
  }

  /**
   * Initialize system actions
   */
  private async initializeSystemActions(): Promise<void> {
    const actions = [
      { name: 'view', display_name: 'Xem', description: 'Quyền xem/đọc dữ liệu' },
      { name: 'create', display_name: 'Tạo mới', description: 'Quyền tạo mới dữ liệu' },
      { name: 'update', display_name: 'Cập nhật', description: 'Quyền cập nhật dữ liệu' },
      { name: 'delete', display_name: 'Xóa', description: 'Quyền xóa dữ liệu' },
      { name: 'export', display_name: 'Xuất', description: 'Quyền xuất dữ liệu' },
      { name: 'import', display_name: 'Nhập', description: 'Quyền nhập dữ liệu' },
      { name: 'manage', display_name: 'Quản lý', description: 'Quyền quản lý toàn bộ' },
      { name: 'approve', display_name: 'Phê duyệt', description: 'Quyền phê duyệt' },
      { name: 'access', display_name: 'Truy cập', description: 'Quyền truy cập menu/tính năng' }
    ];

    for (const action of actions) {
      await this.env.DB.prepare(`
        INSERT OR IGNORE INTO system_actions (name, display_name, description)
        VALUES (?, ?, ?)
      `).bind(action.name, action.display_name, action.description).run();
    }

    console.log('⚡ System actions initialized');
  }

  /**
   * Initialize permissions (resource + action combinations)
   */
  private async initializePermissions(): Promise<void> {
    // Get all resources and actions
    const resources = await this.env.DB.prepare('SELECT * FROM system_resources WHERE is_active = 1').all();
    const actions = await this.env.DB.prepare('SELECT * FROM system_actions WHERE is_active = 1').all();

    const permissionMappings = [
      // Menu permissions (access only)
      { resourceTypes: ['menu'], actions: ['access'] },
      // Database permissions (CRUD operations)
      { resourceTypes: ['database'], actions: ['view', 'create', 'update', 'delete'] },
      // Feature permissions (various actions)
      { resourceTypes: ['feature'], actions: ['view', 'create', 'update', 'delete', 'export', 'import', 'manage'] }
    ];

    for (const mapping of permissionMappings) {
      const filteredResources = resources.results?.filter((r: any) => mapping.resourceTypes.includes(r.resource_type)) || [];
      const filteredActions = actions.results?.filter((a: any) => mapping.actions.includes(a.name)) || [];

      for (const resource of filteredResources) {
        for (const action of filteredActions) {
          const permissionKey = `${resource.name}.${action.name}`;
          const displayName = `${action.display_name} ${resource.display_name}`;

          await this.env.DB.prepare(`
            INSERT OR IGNORE INTO permissions (resource_id, action_id, permission_key, display_name, description)
            VALUES (?, ?, ?, ?, ?)
          `).bind(
            resource.id,
            action.id,
            permissionKey,
            displayName,
            `${action.description} cho ${resource.display_name}`
          ).run();
        }
      }
    }

    console.log('🔑 Permissions initialized');
  }

  /**
   * Initialize role templates
   */
  private async initializeRoleTemplates(): Promise<void> {
    // Update roles table to support templates
    await this.env.DB.prepare(`
      ALTER TABLE roles ADD COLUMN display_name TEXT;
      ALTER TABLE roles ADD COLUMN is_template INTEGER DEFAULT 0;
      ALTER TABLE roles ADD COLUMN is_system INTEGER DEFAULT 0;
    `).run().catch(() => {}); // Ignore if columns already exist

    const roleTemplates = [
      {
        name: 'admin_template',
        display_name: '👑 Quản trị viên',
        description: 'Toàn quyền truy cập hệ thống',
        is_template: 1,
        is_system: 1,
        permissions: ['*'] // All permissions
      },
      {
        name: 'manager_template',
        display_name: '👔 Quản lý',
        description: 'Quyền quản lý cửa hàng và nhân viên',
        is_template: 1,
        is_system: 1,
        permissions: [
          'dashboard.access', 'sales.*', 'inventory.*', 'customers.*', 'reports.*', 'administration.employees.access'
        ]
      },
      {
        name: 'cashier_template',
        display_name: '💰 Thu ngân',
        description: 'Quyền bán hàng và quản lý khách hàng',
        is_template: 1,
        is_system: 1,
        permissions: [
          'dashboard.access', 'sales.pos.access', 'sales.history.access', 'sales.orders.access', 'sales.returns.access',
          'inventory.products.access', 'customers.access', 'products_table.view', 'sales_table.view', 'sales_table.create',
          'customers_table.view', 'customers_table.create', 'customers_table.update'
        ]
      },
      {
        name: 'sales_agent_template',
        display_name: '🤝 Nhân viên kinh doanh',
        description: 'Quyền bán hàng và chăm sóc khách hàng',
        is_template: 1,
        is_system: 1,
        permissions: [
          'dashboard.access', 'sales.*', 'customers.*', 'inventory.products.access', 'inventory.warranty.access',
          'products_table.view', 'sales_table.view', 'sales_table.create', 'customers_table.*', 'warranty_table.*'
        ]
      },
      {
        name: 'inventory_template',
        display_name: '📦 Nhân viên kho',
        description: 'Quyền quản lý kho hàng và sản phẩm',
        is_template: 1,
        is_system: 1,
        permissions: [
          'dashboard.access', 'inventory.*', 'products_table.*', 'categories_table.*', 'suppliers_table.*',
          'inventory_table.*', 'import_data.manage'
        ]
      },
      {
        name: 'affiliate_template',
        display_name: '🌟 Cộng tác viên',
        description: 'Quyền bán hàng cơ bản',
        is_template: 1,
        is_system: 1,
        permissions: [
          'dashboard.access', 'sales.pos.access', 'sales.history.access', 'customers.access',
          'inventory.products.access', 'products_table.view', 'sales_table.view', 'sales_table.create',
          'customers_table.view', 'customers_table.create'
        ]
      }
    ];

    for (const roleTemplate of roleTemplates) {
      // Insert role
      const result = await this.env.DB.prepare(`
        INSERT OR REPLACE INTO roles (name, display_name, description, is_template, is_system, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
      `).bind(
        roleTemplate.name,
        roleTemplate.display_name,
        roleTemplate.description,
        roleTemplate.is_template,
        roleTemplate.is_system
      ).run();

      const roleId = result.meta?.last_row_id;

      // Assign permissions to role
      if (roleTemplate.permissions.includes('*')) {
        // Grant all permissions
        const allPermissions = await this.env.DB.prepare('SELECT id FROM permissions WHERE is_active = 1').all();
        for (const permission of allPermissions.results || []) {
          await this.env.DB.prepare(`
            INSERT OR IGNORE INTO role_permissions (role_id, permission_id, granted)
            VALUES (?, ?, 1)
          `).bind(roleId, permission.id).run();
        }
      } else {
        // Grant specific permissions
        for (const permissionPattern of roleTemplate.permissions) {
          if (permissionPattern.endsWith('*')) {
            // Wildcard permission
            const prefix = permissionPattern.slice(0, -1);
            const permissions = await this.env.DB.prepare(`
              SELECT id FROM permissions WHERE permission_key LIKE ? AND is_active = 1
            `).bind(`${prefix}%`).all();

            for (const permission of permissions.results || []) {
              await this.env.DB.prepare(`
                INSERT OR IGNORE INTO role_permissions (role_id, permission_id, granted)
                VALUES (?, ?, 1)
              `).bind(roleId, permission.id).run();
            }
          } else {
            // Exact permission
            const permission = await this.env.DB.prepare(`
              SELECT id FROM permissions WHERE permission_key = ? AND is_active = 1
            `).bind(permissionPattern).first();

            if (permission) {
              await this.env.DB.prepare(`
                INSERT OR IGNORE INTO role_permissions (role_id, permission_id, granted)
                VALUES (?, ?, 1)
              `).bind(roleId, permission.id).run();
            }
          }
        }
      }
    }

    console.log('🎭 Role templates initialized');
  }
}
