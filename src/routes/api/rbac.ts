import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate, getUser } from '../../middleware/auth';

const app = new Hono<{ Bindings: Env }>();

// Get current user permissions
app.get('/me', authenticate, async (c: any) => {
  try {
    const user = getUser(c);

    // For admin users, return all permissions
    if (user.role === 'admin' || user.role === 'ADMIN') {
      const permissions = [
        'dashboard.view', 'products.view', 'products.create', 'products.update', 'products.delete',
        'categories.view', 'categories.create', 'categories.update', 'categories.delete',
        'customers.view', 'customers.create', 'customers.update', 'customers.delete',
        'sales.view', 'sales.create', 'sales.update', 'sales.delete',
        'inventory.view', 'inventory.update', 'inventory.import', 'inventory.export',
        'financial.view', 'financial.expenses', 'financial.reports',
        'settings.view', 'settings.update',
        'users.view', 'users.create', 'users.update', 'users.delete',
        'roles.view', 'roles.create', 'roles.update', 'roles.delete',
        'reports.view', 'reports.export'
      ];

      return c.json({
        success: true,
        data: permissions
      });
    }

    // For other users, get permissions from roles
    const result = await c.env.DB.prepare(`
      SELECT
        r.permissions
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ?
    `).bind(user.id).all();

    // Combine all permissions from user's roles
    const allPermissions = new Set<string>();

    for (const role of result.results || []) {
      const permissions = JSON.parse(role.permissions || '[]');
      permissions.forEach((permission: string) => allPermissions.add(permission));
    }

    // Default permissions for non-admin users based on role
    const defaultPermissions: Record<string, string[]> = {
      manager: ['dashboard.view', 'products.view', 'sales.view', 'inventory.view', 'reports.view'],
      cashier: ['dashboard.view', 'sales.view', 'sales.create', 'customers.view'],
      sales_agent: ['dashboard.view', 'sales.view', 'sales.create', 'customers.view', 'customers.create'],
      inventory: ['dashboard.view', 'inventory.view', 'inventory.update', 'inventory.import', 'inventory.export', 'products.view'],
      staff: ['dashboard.view', 'sales.view']
    };

    // Add default permissions based on user role
    const rolePermissions = defaultPermissions[user.role] || ['dashboard.view'];
    rolePermissions.forEach(permission => allPermissions.add(permission));

    return c.json({
      success: true,
      data: Array.from(allPermissions)
    });
  } catch (error) {
    console.error('Get user permissions error:', error);
    return c.json({ success: false, error: 'Failed to fetch user permissions' }, 500);
  }
});

// Roles CRUD
app.get('/roles', async (c: any) => {
  try {
    const { page = '1', limit = '50' } = c.req.query();
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const result = await c.env.DB.prepare(`
      SELECT 
        r.*,
        COUNT(ur.user_id) as user_count
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      GROUP BY r.id
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(parseInt(limit), offset).all();
    
    // Get total count
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM roles
    `).first();
    
    return c.json({
      success: true,
      data: result.results || [],
      pagination: {
        total: countResult?.total || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((countResult?.total || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Roles list error:', error);
    return c.json({ success: false, error: 'Failed to fetch roles' }, 500);
  }
});

app.post('/roles', async (c: any) => {
  try {
    const { name, description, permissions } = await c.req.json();
    
    if (!name || !permissions) {
      return c.json({ success: false, error: 'Name and permissions are required' }, 400);
    }
    
    const roleId = crypto.randomUUID();
    
    await c.env.DB.prepare(`
      INSERT INTO roles (id, name, description, permissions, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(roleId, name, description, JSON.stringify(permissions)).run();
    
    const role = await c.env.DB.prepare(`
      SELECT * FROM roles WHERE id = ?
    `).bind(roleId).first();
    
    return c.json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('Role create error:', error);
    return c.json({ success: false, error: 'Failed to create role' }, 500);
  }
});

app.put('/roles/:id', async (c: any) => {
  try {
    const { id } = c.req.param();
    const { name, description, permissions } = await c.req.json();
    
    const result = await c.env.DB.prepare(`
      UPDATE roles 
      SET name = ?, description = ?, permissions = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(name, description, JSON.stringify(permissions), id).run();
    
    if ((result as any).changes === 0) {
      return c.json({ success: false, error: 'Role not found' }, 404);
    }
    
    const role = await c.env.DB.prepare(`
      SELECT * FROM roles WHERE id = ?
    `).bind(id).first();
    
    return c.json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('Role update error:', error);
    return c.json({ success: false, error: 'Failed to update role' }, 500);
  }
});

app.delete('/roles/:id', async (c: any) => {
  try {
    const { id } = c.req.param();
    
    // Check if role is assigned to any users
    const userCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM user_roles WHERE role_id = ?
    `).bind(id).first();
    
    if (userCount?.count > 0) {
      return c.json({ 
        success: false, 
        error: 'Cannot delete role that is assigned to users' 
      }, 400);
    }
    
    const result = await c.env.DB.prepare(`
      DELETE FROM roles WHERE id = ?
    `).bind(id).run();
    
    if ((result as any).changes === 0) {
      return c.json({ success: false, error: 'Role not found' }, 404);
    }
    
    return c.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Role delete error:', error);
    return c.json({ success: false, error: 'Failed to delete role' }, 500);
  }
});

// User Roles Management
app.get('/users/:userId/roles', async (c: any) => {
  try {
    const { userId } = c.req.param();
    
    const result = await c.env.DB.prepare(`
      SELECT 
        r.*,
        ur.assigned_at
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ?
      ORDER BY ur.assigned_at DESC
    `).bind(userId).all();
    
    return c.json({
      success: true,
      data: result.results || []
    });
  } catch (error) {
    console.error('User roles list error:', error);
    return c.json({ success: false, error: 'Failed to fetch user roles' }, 500);
  }
});

app.post('/users/:userId/roles', async (c: any) => {
  try {
    const { userId } = c.req.param();
    const { role_id } = await c.req.json();
    
    if (!role_id) {
      return c.json({ success: false, error: 'Role ID is required' }, 400);
    }
    
    // Check if user already has this role
    const existingRole = await c.env.DB.prepare(`
      SELECT * FROM user_roles WHERE user_id = ? AND role_id = ?
    `).bind(userId, role_id).first();
    
    if (existingRole) {
      return c.json({ 
        success: false, 
        error: 'User already has this role' 
      }, 400);
    }
    
    await c.env.DB.prepare(`
      INSERT INTO user_roles (user_id, role_id, assigned_at)
      VALUES (?, ?, datetime('now'))
    `).bind(userId, role_id).run();
    
    return c.json({ success: true, message: 'Role assigned successfully' });
  } catch (error) {
    console.error('Assign role error:', error);
    return c.json({ success: false, error: 'Failed to assign role' }, 500);
  }
});

app.delete('/users/:userId/roles/:roleId', async (c: any) => {
  try {
    const { userId, roleId } = c.req.param();
    
    const result = await c.env.DB.prepare(`
      DELETE FROM user_roles 
      WHERE user_id = ? AND role_id = ?
    `).bind(userId, roleId).run();
    
    if ((result as any).changes === 0) {
      return c.json({ success: false, error: 'User role not found' }, 404);
    }
    
    return c.json({ success: true, message: 'Role removed successfully' });
  } catch (error) {
    console.error('Remove role error:', error);
    return c.json({ success: false, error: 'Failed to remove role' }, 500);
  }
});

// Permissions Management
app.get('/permissions', async (c: any) => {
  try {
    const permissions = [
      // Dashboard permissions
      { id: 'dashboard.view', name: 'Xem Dashboard', category: 'Dashboard', description: 'Xem trang tổng quan' },
      
      // Product permissions
      { id: 'products.view', name: 'Xem sản phẩm', category: 'Sản phẩm', description: 'Xem danh sách sản phẩm' },
      { id: 'products.create', name: 'Tạo sản phẩm', category: 'Sản phẩm', description: 'Thêm sản phẩm mới' },
      { id: 'products.update', name: 'Sửa sản phẩm', category: 'Sản phẩm', description: 'Chỉnh sửa thông tin sản phẩm' },
      { id: 'products.delete', name: 'Xóa sản phẩm', category: 'Sản phẩm', description: 'Xóa sản phẩm' },
      
      // Category permissions
      { id: 'categories.view', name: 'Xem danh mục', category: 'Danh mục', description: 'Xem danh sách danh mục' },
      { id: 'categories.create', name: 'Tạo danh mục', category: 'Danh mục', description: 'Thêm danh mục mới' },
      { id: 'categories.update', name: 'Sửa danh mục', category: 'Danh mục', description: 'Chỉnh sửa danh mục' },
      { id: 'categories.delete', name: 'Xóa danh mục', category: 'Danh mục', description: 'Xóa danh mục' },
      
      // Customer permissions
      { id: 'customers.view', name: 'Xem khách hàng', category: 'Khách hàng', description: 'Xem danh sách khách hàng' },
      { id: 'customers.create', name: 'Tạo khách hàng', category: 'Khách hàng', description: 'Thêm khách hàng mới' },
      { id: 'customers.update', name: 'Sửa khách hàng', category: 'Khách hàng', description: 'Chỉnh sửa thông tin khách hàng' },
      { id: 'customers.delete', name: 'Xóa khách hàng', category: 'Khách hàng', description: 'Xóa khách hàng' },
      
      // Sales permissions
      { id: 'sales.view', name: 'Xem bán hàng', category: 'Bán hàng', description: 'Xem danh sách giao dịch' },
      { id: 'sales.create', name: 'Tạo giao dịch', category: 'Bán hàng', description: 'Tạo giao dịch bán hàng' },
      { id: 'sales.update', name: 'Sửa giao dịch', category: 'Bán hàng', description: 'Chỉnh sửa giao dịch' },
      { id: 'sales.delete', name: 'Xóa giao dịch', category: 'Bán hàng', description: 'Xóa giao dịch' },
      
      // Inventory permissions
      { id: 'inventory.view', name: 'Xem kho', category: 'Kho hàng', description: 'Xem thông tin kho hàng' },
      { id: 'inventory.update', name: 'Cập nhật kho', category: 'Kho hàng', description: 'Cập nhật số lượng tồn kho' },
      { id: 'inventory.import', name: 'Nhập kho', category: 'Kho hàng', description: 'Thực hiện nhập kho' },
      { id: 'inventory.export', name: 'Xuất kho', category: 'Kho hàng', description: 'Thực hiện xuất kho' },
      
      // Financial permissions
      { id: 'financial.view', name: 'Xem tài chính', category: 'Tài chính', description: 'Xem báo cáo tài chính' },
      { id: 'financial.expenses', name: 'Quản lý chi phí', category: 'Tài chính', description: 'Thêm và quản lý chi phí' },
      { id: 'financial.reports', name: 'Xem báo cáo', category: 'Tài chính', description: 'Xem các báo cáo tài chính' },
      
      // Settings permissions
      { id: 'settings.view', name: 'Xem cài đặt', category: 'Cài đặt', description: 'Xem cài đặt hệ thống' },
      { id: 'settings.update', name: 'Cập nhật cài đặt', category: 'Cài đặt', description: 'Thay đổi cài đặt hệ thống' },
      
      // User management permissions
      { id: 'users.view', name: 'Xem người dùng', category: 'Người dùng', description: 'Xem danh sách người dùng' },
      { id: 'users.create', name: 'Tạo người dùng', category: 'Người dùng', description: 'Thêm người dùng mới' },
      { id: 'users.update', name: 'Sửa người dùng', category: 'Người dùng', description: 'Chỉnh sửa thông tin người dùng' },
      { id: 'users.delete', name: 'Xóa người dùng', category: 'Người dùng', description: 'Xóa người dùng' },
      
      // Role management permissions
      { id: 'roles.view', name: 'Xem vai trò', category: 'Vai trò', description: 'Xem danh sách vai trò' },
      { id: 'roles.create', name: 'Tạo vai trò', category: 'Vai trò', description: 'Thêm vai trò mới' },
      { id: 'roles.update', name: 'Sửa vai trò', category: 'Vai trò', description: 'Chỉnh sửa vai trò' },
      { id: 'roles.delete', name: 'Xóa vai trò', category: 'Vai trò', description: 'Xóa vai trò' },
      
      // Reports permissions
      { id: 'reports.view', name: 'Xem báo cáo', category: 'Báo cáo', description: 'Xem các báo cáo' },
      { id: 'reports.export', name: 'Xuất báo cáo', category: 'Báo cáo', description: 'Xuất báo cáo ra file' }
    ];
    
    return c.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    console.error('Permissions list error:', error);
    return c.json({ success: false, error: 'Failed to fetch permissions' }, 500);
  }
});

// Check user permissions
app.get('/users/:userId/permissions', async (c: any) => {
  try {
    const { userId } = c.req.param();
    
    const result = await c.env.DB.prepare(`
      SELECT 
        r.permissions
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ?
    `).bind(userId).all();
    
    // Combine all permissions from user's roles
    const allPermissions = new Set<string>();
    
    for (const role of result.results || []) {
      const permissions = JSON.parse(role.permissions || '[]');
      permissions.forEach((permission: string) => allPermissions.add(permission));
    }
    
    return c.json({
      success: true,
      data: Array.from(allPermissions)
    });
  } catch (error) {
    console.error('User permissions error:', error);
    return c.json({ success: false, error: 'Failed to fetch user permissions' }, 500);
  }
});

// Audit Logs
app.get('/audit-logs', async (c: any) => {
  try {
    const { 
      page = '1', 
      limit = '50', 
      user_id, 
      action, 
      resource,
      start_date,
      end_date
    } = c.req.query();
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = `
      SELECT 
        al.*,
        u.username,
        u.email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (user_id) {
      query += ` AND al.user_id = ?`;
      params.push(user_id);
    }
    
    if (action) {
      query += ` AND al.action = ?`;
      params.push(action);
    }
    
    if (resource) {
      query += ` AND al.resource = ?`;
      params.push(resource);
    }
    
    if (start_date) {
      query += ` AND al.timestamp >= ?`;
      params.push(start_date);
    }
    
    if (end_date) {
      query += ` AND al.timestamp <= ?`;
      params.push(end_date);
    }
    
    query += ` ORDER BY al.timestamp DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    
    const result = await c.env.DB.prepare(query).bind(...params).all();
    
    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM audit_logs al WHERE 1=1`;
    const countParams: any[] = [];
    
    if (user_id) {
      countQuery += ` AND al.user_id = ?`;
      countParams.push(user_id);
    }
    
    if (action) {
      countQuery += ` AND al.action = ?`;
      countParams.push(action);
    }
    
    if (resource) {
      countQuery += ` AND al.resource = ?`;
      countParams.push(resource);
    }
    
    if (start_date) {
      countQuery += ` AND al.timestamp >= ?`;
      countParams.push(start_date);
    }
    
    if (end_date) {
      countQuery += ` AND al.timestamp <= ?`;
      countParams.push(end_date);
    }
    
    const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first();
    
    return c.json({
      success: true,
      data: result.results || [],
      pagination: {
        total: countResult?.total || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil((countResult?.total || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Audit logs list error:', error);
    return c.json({ success: false, error: 'Failed to fetch audit logs' }, 500);
  }
});

// RBAC Statistics
app.get('/stats', async (c: any) => {
  try {
    // Get role statistics
    const roleStats = await c.env.DB.prepare(`
      SELECT 
        r.name,
        COUNT(ur.user_id) as user_count
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      GROUP BY r.id, r.name
      ORDER BY user_count DESC
    `).all();
    
    // Get permission usage statistics
    const permissionStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(DISTINCT r.id) as roles_with_permission,
        COUNT(DISTINCT ur.user_id) as users_with_permission
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      WHERE r.permissions IS NOT NULL
    `).first();
    
    // Get recent audit activity
    const recentActivity = await c.env.DB.prepare(`
      SELECT 
        action,
        COUNT(*) as count
      FROM audit_logs
      WHERE timestamp >= datetime('now', '-7 days')
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `).all();
    
    return c.json({
      success: true,
      data: {
        role_stats: roleStats.results || [],
        permission_stats: permissionStats,
        recent_activity: recentActivity.results || []
      }
    });
  } catch (error) {
    console.error('RBAC stats error:', error);
    return c.json({ success: false, error: 'Failed to fetch RBAC stats' }, 500);
  }
});

export default app;

