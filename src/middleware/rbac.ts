/**
 * ROLE-BASED ACCESS CONTROL (RBAC) MIDDLEWARE
 * Implements granular permission checking for resources and actions
 */

import { Context, Next } from 'hono';
import { Env } from '../types';

export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface UserPermission {
  id: number;
  user_id: number;
  resource: string;
  action: string;
  conditions?: string; // JSON string
  granted_by: number;
  granted_at: string;
}

export interface RolePermission {
  role: string;
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
}

/**
 * Default role-based permissions
 */
const DEFAULT_ROLE_PERMISSIONS: RolePermission[] = [
  // Admin permissions - full access
  {
    role: 'admin',
    resource: '*',
    actions: ['create', 'read', 'update', 'delete', 'manage']
  },
  
  // Manager permissions
  {
    role: 'manager',
    resource: 'products',
    actions: ['create', 'read', 'update', 'delete']
  },
  {
    role: 'manager',
    resource: 'categories',
    actions: ['create', 'read', 'update', 'delete']
  },
  {
    role: 'manager',
    resource: 'customers',
    actions: ['create', 'read', 'update', 'delete']
  },
  {
    role: 'manager',
    resource: 'sales',
    actions: ['create', 'read', 'update']
  },
  {
    role: 'manager',
    resource: 'inventory',
    actions: ['create', 'read', 'update']
  },
  {
    role: 'manager',
    resource: 'reports',
    actions: ['read']
  },
  {
    role: 'manager',
    resource: 'users',
    actions: ['read'],
    conditions: { same_store: true }
  },
  
  // Cashier permissions
  {
    role: 'cashier',
    resource: 'products',
    actions: ['read']
  },
  {
    role: 'cashier',
    resource: 'customers',
    actions: ['create', 'read', 'update']
  },
  {
    role: 'cashier',
    resource: 'sales',
    actions: ['create', 'read']
  },
  {
    role: 'cashier',
    resource: 'inventory',
    actions: ['read']
  },
  
  // Inventory staff permissions
  {
    role: 'inventory',
    resource: 'products',
    actions: ['create', 'read', 'update']
  },
  {
    role: 'inventory',
    resource: 'categories',
    actions: ['read']
  },
  {
    role: 'inventory',
    resource: 'suppliers',
    actions: ['create', 'read', 'update']
  },
  {
    role: 'inventory',
    resource: 'inventory',
    actions: ['create', 'read', 'update']
  },
  {
    role: 'inventory',
    resource: 'serial_numbers',
    actions: ['create', 'read', 'update']
  },
  
  // Sales agent permissions
  {
    role: 'sales_agent',
    resource: 'products',
    actions: ['read']
  },
  {
    role: 'sales_agent',
    resource: 'customers',
    actions: ['create', 'read', 'update']
  },
  {
    role: 'sales_agent',
    resource: 'sales',
    actions: ['create', 'read']
  }
];

/**
 * Permission checker class
 */
export class PermissionChecker {
  
  /**
   * Check if user has permission for a specific action on a resource
   */
  static async checkPermission(
    env: Env,
    user: any,
    permission: Permission
  ): Promise<boolean> {
    try {
      // Admin has all permissions
      if (user.role === 'admin') {
        return true;
      }

      // Check role-based permissions first
      const hasRolePermission = this.checkRolePermission(user.role, permission);
      if (hasRolePermission) {
        // Check conditions if any
        return this.checkConditions(user, permission);
      }

      // Check user-specific permissions from database
      const userPermissions = await this.getUserPermissions(env, user.id);
      const hasUserPermission = userPermissions.some(up => 
        up.resource === permission.resource && 
        up.action === permission.action
      );

      if (hasUserPermission) {
        return this.checkConditions(user, permission);
      }

      return false;
    } catch (error) {
      console.error('Permission check error:', error);
      return false; // Deny on error
    }
  }

  /**
   * Check role-based permissions
   */
  private static checkRolePermission(role: string, permission: Permission): boolean {
    const rolePermissions = DEFAULT_ROLE_PERMISSIONS.filter(rp => rp.role === role);
    
    return rolePermissions.some(rp => 
      (rp.resource === '*' || rp.resource === permission.resource) &&
      rp.actions.includes(permission.action)
    );
  }

  /**
   * Check permission conditions
   */
  private static checkConditions(user: any, permission: Permission): boolean {
    if (!permission.conditions) {
      return true;
    }

    // Check same_store condition
    if (permission.conditions.same_store && permission.conditions.store_id) {
      return user.store_id === permission.conditions.store_id;
    }

    // Check owner condition
    if (permission.conditions.owner && permission.conditions.user_id) {
      return user.id === permission.conditions.user_id;
    }

    return true;
  }

  /**
   * Get user-specific permissions from database
   */
  private static async getUserPermissions(env: Env, userId: number): Promise<UserPermission[]> {
    try {
      const result = await env.DB.prepare(`
        SELECT * FROM user_permissions 
        WHERE user_id = ? AND is_active = 1
      `).bind(userId).all();

      return result.results as UserPermission[] || [];
    } catch (error) {
      console.error('Failed to get user permissions:', error);
      return [];
    }
  }

  /**
   * Grant permission to user
   */
  static async grantPermission(
    env: Env,
    userId: number,
    permission: Permission,
    grantedBy: number
  ): Promise<boolean> {
    try {
      await env.DB.prepare(`
        INSERT INTO user_permissions (
          user_id, resource, action, conditions, granted_by, granted_at, is_active
        ) VALUES (?, ?, ?, ?, ?, datetime('now'), 1)
      `).bind(
        userId,
        permission.resource,
        permission.action,
        permission.conditions ? JSON.stringify(permission.conditions) : null,
        grantedBy
      ).run();

      return true;
    } catch (error) {
      console.error('Failed to grant permission:', error);
      return false;
    }
  }

  /**
   * Revoke permission from user
   */
  static async revokePermission(
    env: Env,
    userId: number,
    resource: string,
    action: string
  ): Promise<boolean> {
    try {
      await env.DB.prepare(`
        UPDATE user_permissions 
        SET is_active = 0, revoked_at = datetime('now')
        WHERE user_id = ? AND resource = ? AND action = ?
      `).bind(userId, resource, action).run();

      return true;
    } catch (error) {
      console.error('Failed to revoke permission:', error);
      return false;
    }
  }
}

/**
 * Enhanced middleware factory for granular permission checking
 */
export const requirePermission = (permissionKey: string, conditions?: Record<string, any>) => {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    try {
      const user = c.get('user');

      if (!user) {
        return c.json({
          success: false,
          message: 'Authentication required',
          error: 'UNAUTHORIZED'
        }, 401);
      }

      // Admin always has access
      if (user.role === 'admin') {
        return next();
      }

      // Check if user has the specific permission
      const hasPermission = await checkUserPermission(c.env, user.id, permissionKey);

      if (!hasPermission) {
        console.warn(`🚨 Permission denied: User ${user.username} (${user.role}) lacks permission: ${permissionKey}`);
        return c.json({
          success: false,
          message: `Insufficient permissions: ${permissionKey}`,
          error: 'FORBIDDEN'
        }, 403);
      }

      return next();
    } catch (error) {
      console.error('Permission check error:', error);
      return c.json({
        success: false,
        message: 'Permission check failed',
        error: 'PERMISSION_ERROR'
      }, 500);
    }
  };
};

/**
 * Check if user has a specific permission
 */
async function checkUserPermission(env: Env, userId: number, permissionKey: string): Promise<boolean> {
  try {
    // First, get the employee ID from the user
    const user = await env.DB.prepare(`
      SELECT id, role FROM users WHERE id = ?
    `).bind(userId).first();

    if (!user) {
      return false;
    }

    // For now, map user to employee by finding employee with same role
    // In a real system, you'd have a proper user-employee relationship
    const employee = await env.DB.prepare(`
      SELECT id FROM employees WHERE role = ? LIMIT 1
    `).bind(user.role).first();

    if (!employee) {
      return false;
    }

    // Check if employee has the permission through roles or individual permissions
    const permission = await env.DB.prepare(`
      SELECT 1
      FROM employee_effective_permissions
      WHERE employee_id = ? AND permission_key = ? AND has_permission = 1
      LIMIT 1
    `).bind(employee.id, permissionKey).first();

    return !!permission;
  } catch (error) {
    console.error('Error checking user permission:', error);
    return false;
  }
}

/**
 * Legacy middleware factory for backward compatibility
 */
export const requirePermissionLegacy = (resource: string, action: string, conditions?: Record<string, any>) => {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    try {
      const user = c.get('user');

      if (!user) {
        return c.json({
          success: false,
          message: 'Authentication required',
          error: 'UNAUTHORIZED'
        }, 401);
      }

      const permission: Permission = {
        resource,
        action,
        conditions
      };

      const hasPermission = await PermissionChecker.checkPermission(c.env, user, permission);

      if (!hasPermission) {
        console.warn(`🚨 RBAC: Permission denied for user ${user.username} (${user.role}) - ${action} on ${resource}`);
        return c.json({
          success: false,
          message: 'Insufficient permissions',
          error: 'FORBIDDEN',
          details: {
            required_permission: permission,
            user_role: user.role
          }
        }, 403);
      }

      // Store permission context for audit logging
      c.set('permission', permission);
      
      return next();
    } catch (error) {
      console.error('Permission middleware error:', error);
      return c.json({
        success: false,
        message: 'Permission check failed',
        error: 'PERMISSION_ERROR'
      }, 500);
    }
  };
};

/**
 * Middleware for resource ownership validation
 */
export const requireOwnership = (resourceIdParam: string = 'id') => {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    try {
      const user = c.get('user');
      const resourceId = c.req.param(resourceIdParam);
      
      if (!user || !resourceId) {
        return c.json({
          success: false,
          message: 'Invalid request',
          error: 'BAD_REQUEST'
        }, 400);
      }

      // For non-admin users, add ownership condition
      if (user.role !== 'admin') {
        c.set('ownershipCondition', {
          user_id: user.id,
          store_id: user.store_id
        });
      }

      return next();
    } catch (error) {
      console.error('Ownership middleware error:', error);
      return c.json({
        success: false,
        message: 'Ownership check failed',
        error: 'OWNERSHIP_ERROR'
      }, 500);
    }
  };
};

/**
 * Audit logging for permission usage
 */
export const auditPermission = async (
  env: Env,
  user: any,
  permission: Permission,
  success: boolean,
  details?: any
) => {
  try {
    await env.DB.prepare(`
      INSERT INTO permission_audit_log (
        user_id, username, role, resource, action, success, details, ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      user.id,
      user.username,
      user.role,
      permission.resource,
      permission.action,
      success ? 1 : 0,
      details ? JSON.stringify(details) : null,
      null, // IP address would be passed from context
      null  // User agent would be passed from context
    ).run();
  } catch (error) {
    console.error('Failed to audit permission:', error);
  }
};
