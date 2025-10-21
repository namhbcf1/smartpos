import { Hono } from 'hono';
import { PermissionChecker } from '../../middleware/rbac';
import type { Env } from '../../types';

const app = new Hono<{ Bindings: Env }>();

// Get all available roles and their permissions
app.get('/roles', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT
        id, name, description, permissions, created_at
      FROM roles
      WHERE is_active = 1
      ORDER BY name
    `).all();

    const roles = (result.results || []).map((role: any) => ({
      ...role,
      permissions: role.permissions ? JSON.parse(role.permissions) : []
    }));

    return c.json({ success: true, data: roles });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Get user's roles and permissions
app.get('/users/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');

    // Get user roles
    const rolesResult = await c.env.DB.prepare(`
      SELECT
        r.id, r.name, r.description, r.permissions
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ? AND r.is_active = 1
    `).bind(userId).all();

    const roles = (rolesResult.results || []).map((role: any) => ({
      ...role,
      permissions: role.permissions ? JSON.parse(role.permissions) : []
    }));

    // Collect all unique permissions
    const allPermissions = new Set<string>();
    roles.forEach((role: any) => {
      if (Array.isArray(role.permissions)) {
        role.permissions.forEach((p: string) => allPermissions.add(p));
      }
    });

    return c.json({
      success: true,
      data: {
        user_id: userId,
        roles: roles.map((r: any) => ({ id: r.id, name: r.name, description: r.description })),
        permissions: Array.from(allPermissions)
      }
    });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Assign role to user
app.post('/users/:userId/roles', async (c) => {
  try {
    const currentUserId = (c.get as any)('userId') || 'system';
    const userId = c.req.param('userId');
    const { role_id } = await c.req.json();

    if (!role_id) {
      return c.json({ success: false, error: 'role_id is required' }, 400);
    }

    // Check if role exists
    const roleExists = await c.env.DB.prepare(`
      SELECT id FROM roles WHERE id = ? AND is_active = 1
    `).bind(role_id).first();

    if (!roleExists) {
      return c.json({ success: false, error: 'Role not found' }, 404);
    }

    // Assign role to user
    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO user_roles (id, user_id, role_id, assigned_by, assigned_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(id, userId, role_id, currentUserId).run();

    return c.json({
      success: true,
      message: 'Role assigned successfully',
      data: { id, user_id: userId, role_id }
    });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Remove role from user
app.delete('/users/:userId/roles/:roleId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const roleId = c.req.param('roleId');

    await c.env.DB.prepare(`
      DELETE FROM user_roles
      WHERE user_id = ? AND role_id = ?
    `).bind(userId, roleId).run();

    return c.json({
      success: true,
      message: 'Role removed successfully'
    });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Create new role
app.post('/roles', async (c) => {
  try {
    const { name, description, permissions } = await c.req.json();

    if (!name || !permissions || !Array.isArray(permissions)) {
      return c.json({
        success: false,
        error: 'name and permissions (array) are required'
      }, 400);
    }

    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO roles (id, name, description, permissions, is_active, created_at)
      VALUES (?, ?, ?, ?, 1, datetime('now'))
    `).bind(id, name, description || null, JSON.stringify(permissions)).run();

    return c.json({
      success: true,
      message: 'Role created successfully',
      data: { id, name, description, permissions }
    }, 201);
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Update role
app.put('/roles/:roleId', async (c) => {
  try {
    const roleId = c.req.param('roleId');
    const { name, description, permissions } = await c.req.json();

    // Check if role exists
    const role = await c.env.DB.prepare(`
      SELECT id FROM roles WHERE id = ?
    `).bind(roleId).first();

    if (!role) {
      return c.json({ success: false, error: 'Role not found' }, 404);
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (permissions && Array.isArray(permissions)) {
      updates.push('permissions = ?');
      values.push(JSON.stringify(permissions));
    }

    if (updates.length === 0) {
      return c.json({ success: false, error: 'No fields to update' }, 400);
    }

    values.push(roleId);

    await c.env.DB.prepare(`
      UPDATE roles SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();

    return c.json({
      success: true,
      message: 'Role updated successfully'
    });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Delete role
app.delete('/roles/:roleId', async (c) => {
  try {
    const roleId = c.req.param('roleId');

    // Check if role exists
    const role = await c.env.DB.prepare(`
      SELECT id FROM roles WHERE id = ?
    `).bind(roleId).first();

    if (!role) {
      return c.json({ success: false, error: 'Role not found' }, 404);
    }

    // Remove all user role assignments
    await c.env.DB.prepare(`
      DELETE FROM user_roles WHERE role_id = ?
    `).bind(roleId).run();

    // Delete role
    await c.env.DB.prepare(`
      DELETE FROM roles WHERE id = ?
    `).bind(roleId).run();

    return c.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// List available permissions (predefined)
app.get('/available', (c) => {
  const availablePermissions = [
    // Products
    'products.read', 'products.create', 'products.update', 'products.delete',
    'products.*',

    // Categories
    'categories.read', 'categories.create', 'categories.update', 'categories.delete',
    'categories.*',

    // Customers
    'customers.read', 'customers.create', 'customers.update', 'customers.delete',
    'customers.*',

    // Sales & Orders
    'sales.read', 'sales.create', 'sales.update', 'sales.delete',
    'orders.read', 'orders.create', 'orders.update', 'orders.delete',
    'sales.*', 'orders.*',

    // Inventory
    'inventory.read', 'inventory.create', 'inventory.update', 'inventory.delete',
    'inventory.*',

    // Serial Numbers
    'serial_numbers.read', 'serial_numbers.create', 'serial_numbers.update', 'serial_numbers.delete',
    'serial_numbers.*',

    // Reports & Analytics
    'reports.read', 'analytics.read', 'dashboard.read',
    'reports.*', 'analytics.*',

    // Users & Roles
    'users.read', 'users.create', 'users.update', 'users.delete',
    'roles.read', 'roles.create', 'roles.update', 'roles.delete',
    'permissions.manage',
    'users.*', 'roles.*',

    // Settings
    'settings.read', 'settings.update',

    // Super admin
    '*'
  ];

  return c.json({
    success: true,
    data: availablePermissions.map(p => ({
      key: p,
      description: p.replace(/\./g, ' ').replace(/\*/g, 'all')
    }))
  });
});

export default app;
