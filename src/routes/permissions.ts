/**
 * Permission Management API Routes
 * Handles all permission-related API endpoints
 */

import { Hono } from 'hono';
import { Env } from '../types';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { PermissionManagementService } from '../services/PermissionManagementService';

const app = new Hono<{ Bindings: Env }>();

// Apply authentication to all routes
app.use('*', authenticate);

/**
 * GET /permissions/me - Get current user's permissions (no special permission required)
 */
app.get('/me', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({
        success: false,
        data: null,
        message: 'Authentication required'
      }, 401);
    }

    const permissionService = new PermissionManagementService(c.env);
    const permissions = await permissionService.getEmployeePermissions(user.id);

    return c.json({
      success: true,
      data: permissions,
      message: 'User permissions retrieved successfully'
    });
  } catch (error) {
    console.error('Get user permissions error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Failed to retrieve user permissions'
    }, 500);
  }
});

/**
 * GET /permissions/employees/:id - Get employee permissions (requires admin permission)
 */
app.get('/employees/:id', requirePermission('administration.employees', 'view'), async (c) => {
  try {
    const employeeId = parseInt(c.req.param('id'));
    const permissionService = new PermissionManagementService(c.env);

    const permissions = await permissionService.getEmployeePermissions(employeeId);

    return c.json({
      success: true,
      data: permissions,
      message: 'Employee permissions retrieved successfully'
    });
  } catch (error) {
    console.error('Get employee permissions error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Failed to retrieve employee permissions'
    }, 500);
  }
});

/**
 * GET /permissions/employees/:id/matrix - Get employee permission matrix
 */
app.get('/employees/:id/matrix', requirePermission('administration.employees', 'view'), async (c) => {
  try {
    const employeeId = parseInt(c.req.param('id'));
    const permissionService = new PermissionManagementService(c.env);

    const matrix = await permissionService.getEmployeePermissionMatrix(employeeId);

    return c.json({
      success: true,
      data: matrix,
      message: 'Employee permission matrix retrieved successfully'
    });
  } catch (error) {
    console.error('Get employee permission matrix error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Failed to retrieve employee permission matrix'
    }, 500);
  }
});

/**
 * PUT /permissions/employees/:id - Update employee permission
 */
app.put('/employees/:id', requirePermission('administration.employees', 'manage'), async (c) => {
  try {
    const employeeId = parseInt(c.req.param('id'));
    const currentUser = c.get('user');
    const { permission_key, granted, reason } = await c.req.json();

    if (!permission_key || typeof granted !== 'boolean') {
      return c.json({
        success: false,
        data: null,
        message: 'Permission key and granted status are required'
      }, 400);
    }

    const permissionService = new PermissionManagementService(c.env);
    await permissionService.updateEmployeePermission(
      employeeId,
      permission_key,
      granted,
      currentUser.id,
      reason
    );

    return c.json({
      success: true,
      data: null,
      message: 'Employee permission updated successfully'
    });
  } catch (error) {
    console.error('Update employee permission error:', error);
    return c.json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'Failed to update employee permission'
    }, 500);
  }
});

/**
 * PUT /permissions/employees/:id/bulk - Bulk update employee permissions
 */
app.put('/employees/:id/bulk', requirePermission('administration.employees', 'manage'), async (c) => {
  try {
    const employeeId = parseInt(c.req.param('id'));
    const currentUser = c.get('user');
    const { permissions, reason } = await c.req.json();

    if (!Array.isArray(permissions)) {
      return c.json({
        success: false,
        data: null,
        message: 'Permissions array is required'
      }, 400);
    }

    const permissionService = new PermissionManagementService(c.env);
    await permissionService.bulkUpdateEmployeePermissions(
      employeeId,
      permissions,
      currentUser.id,
      reason
    );

    return c.json({
      success: true,
      data: null,
      message: 'Employee permissions updated successfully'
    });
  } catch (error) {
    console.error('Bulk update employee permissions error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Failed to update employee permissions'
    }, 500);
  }
});

/**
 * GET /permissions/roles/templates - Get all role templates
 */
app.get('/roles/templates', requirePermission('administration.employees', 'view'), async (c) => {
  try {
    const permissionService = new PermissionManagementService(c.env);
    const templates = await permissionService.getRoleTemplates();

    return c.json({
      success: true,
      data: templates,
      message: 'Role templates retrieved successfully'
    });
  } catch (error) {
    console.error('Get role templates error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Failed to retrieve role templates'
    }, 500);
  }
});

/**
 * POST /permissions/employees/:id/roles - Assign role to employee
 */
app.post('/employees/:id/roles', requirePermission('administration.employees', 'manage'), async (c) => {
  try {
    const employeeId = parseInt(c.req.param('id'));
    const currentUser = c.get('user');
    const { role_id } = await c.req.json();

    if (!role_id) {
      return c.json({
        success: false,
        data: null,
        message: 'Role ID is required'
      }, 400);
    }

    const permissionService = new PermissionManagementService(c.env);
    await permissionService.assignRoleTemplate(employeeId, role_id, currentUser.id);

    return c.json({
      success: true,
      data: null,
      message: 'Role assigned to employee successfully'
    });
  } catch (error) {
    console.error('Assign role to employee error:', error);
    return c.json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'Failed to assign role to employee'
    }, 500);
  }
});

/**
 * DELETE /permissions/employees/:id/roles/:roleId - Remove role from employee
 */
app.delete('/employees/:id/roles/:roleId', requirePermission('administration.employees', 'manage'), async (c) => {
  try {
    const employeeId = parseInt(c.req.param('id'));
    const roleId = parseInt(c.req.param('roleId'));
    const currentUser = c.get('user');

    const permissionService = new PermissionManagementService(c.env);
    await permissionService.removeEmployeeRole(employeeId, roleId, currentUser.id);

    return c.json({
      success: true,
      data: null,
      message: 'Role removed from employee successfully'
    });
  } catch (error) {
    console.error('Remove role from employee error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Failed to remove role from employee'
    }, 500);
  }
});

/**
 * GET /permissions/employees/:id/roles - Get employee roles
 */
app.get('/employees/:id/roles', requirePermission('administration.employees', 'view'), async (c) => {
  try {
    const employeeId = parseInt(c.req.param('id'));
    const permissionService = new PermissionManagementService(c.env);

    const roles = await permissionService.getEmployeeRoles(employeeId);

    return c.json({
      success: true,
      data: roles,
      message: 'Employee roles retrieved successfully'
    });
  } catch (error) {
    console.error('Get employee roles error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Failed to retrieve employee roles'
    }, 500);
  }
});

/**
 * GET /permissions/employees/:id/check/:permissionKey - Check if employee has permission
 */
app.get('/employees/:id/check/:permissionKey', async (c) => {
  try {
    const employeeId = parseInt(c.req.param('id'));
    const permissionKey = c.req.param('permissionKey');
    const permissionService = new PermissionManagementService(c.env);

    const hasPermission = await permissionService.hasPermission(employeeId, permissionKey);

    return c.json({
      success: true,
      data: { has_permission: hasPermission },
      message: 'Permission check completed'
    });
  } catch (error) {
    console.error('Check employee permission error:', error);
    return c.json({
      success: false,
      data: { has_permission: false },
      message: 'Failed to check employee permission'
    }, 500);
  }
});

/**
 * GET /permissions/employees/:id/audit - Get permission audit log for employee
 */
app.get('/employees/:id/audit', requirePermission('administration.employees', 'view'), async (c) => {
  try {
    const employeeId = parseInt(c.req.param('id'));
    const limit = parseInt(c.req.query('limit') || '50');
    const permissionService = new PermissionManagementService(c.env);

    const auditLog = await permissionService.getPermissionAuditLog(employeeId, limit);

    return c.json({
      success: true,
      data: auditLog,
      message: 'Permission audit log retrieved successfully'
    });
  } catch (error) {
    console.error('Get permission audit log error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Failed to retrieve permission audit log'
    }, 500);
  }
});

/**
 * POST /permissions/initialize - Initialize RBAC system (admin only)
 */
app.post('/initialize', requirePermission('administration.settings', 'manage'), async (c) => {
  try {
    const permissionService = new PermissionManagementService(c.env);
    await permissionService.ensureRBACInitialized();

    return c.json({
      success: true,
      data: null,
      message: 'RBAC system initialized successfully'
    });
  } catch (error) {
    console.error('Initialize RBAC system error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Failed to initialize RBAC system'
    }, 500);
  }
});

export default app;
