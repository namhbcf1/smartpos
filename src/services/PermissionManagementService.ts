/**
 * Permission Management Service
 * Handles all permission-related operations for the RBAC system
 */

import { Env } from '../types';
import { RBACInitializationService } from './RBACInitializationService';

export interface EmployeePermission {
  employee_id: number;
  employee_name: string;
  permission_key: string;
  permission_display_name: string;
  resource_name: string;
  resource_display_name: string;
  action_name: string;
  action_display_name: string;
  has_permission: boolean;
  permission_source: 'role' | 'individual';
}

export interface RoleTemplate {
  id: number;
  name: string;
  display_name: string;
  description: string;
  is_template: boolean;
  is_system: boolean;
  permission_count: number;
}

export interface PermissionMatrix {
  resources: Array<{
    id: number;
    name: string;
    display_name: string;
    resource_type: string;
    actions: Array<{
      id: number;
      name: string;
      display_name: string;
      permission_key: string;
      has_permission: boolean;
      permission_source?: 'role' | 'individual';
    }>;
  }>;
}

export class PermissionManagementService {
  constructor(private env: Env) {}

  /**
   * Initialize RBAC system if not already done
   */
  async ensureRBACInitialized(): Promise<void> {
    try {
      // Check if RBAC tables exist
      const tableCheck = await this.env.DB.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name IN ('system_resources', 'roles', 'permissions')
      `).all();

      if (tableCheck.results && tableCheck.results.length < 3) {
        console.log('🔧 RBAC tables missing, initializing...');
        const rbacService = new RBACInitializationService(this.env);
        await rbacService.initializeRBAC();
        return;
      }

      // Check if system is already initialized with data
      const resourceCount = await this.env.DB.prepare('SELECT COUNT(*) as count FROM system_resources').first();

      if (!resourceCount || resourceCount.count === 0) {
        console.log('🔧 RBAC tables empty, populating with default data...');
        const rbacService = new RBACInitializationService(this.env);
        await rbacService.initializeRBAC();
      }
    } catch (error) {
      console.error('❌ Error ensuring RBAC initialization:', error);
      // Initialize from scratch if there's any error
      const rbacService = new RBACInitializationService(this.env);
      await rbacService.initializeRBAC();
    }
  }

  /**
   * Get all effective permissions for an employee
   */
  async getEmployeePermissions(employeeId: number): Promise<EmployeePermission[]> {
    await this.ensureRBACInitialized();

    const permissions = await this.env.DB.prepare(`
      SELECT DISTINCT
        e.id as employee_id,
        e.full_name as employee_name,
        p.permission_key,
        p.display_name as permission_display_name,
        sr.name as resource_name,
        sr.display_name as resource_display_name,
        sa.name as action_name,
        sa.display_name as action_display_name,
        CASE 
          WHEN ep.granted IS NOT NULL THEN ep.granted
          ELSE COALESCE(MAX(rp.granted), 0)
        END as has_permission,
        CASE 
          WHEN ep.granted IS NOT NULL THEN 'individual'
          ELSE 'role'
        END as permission_source
      FROM employees e
      LEFT JOIN employee_roles er ON e.id = er.employee_id AND er.is_active = 1
      LEFT JOIN role_permissions rp ON er.role_id = rp.role_id AND rp.granted = 1
      LEFT JOIN permissions p ON (rp.permission_id = p.id OR p.id IN (
        SELECT ep2.permission_id FROM employee_permissions ep2 
        WHERE ep2.employee_id = e.id AND ep2.is_active = 1
      ))
      LEFT JOIN employee_permissions ep ON e.id = ep.employee_id AND p.id = ep.permission_id AND ep.is_active = 1
      LEFT JOIN system_resources sr ON p.resource_id = sr.id
      LEFT JOIN system_actions sa ON p.action_id = sa.id
      WHERE e.id = ? AND e.status = 'active' AND p.is_active = 1
      GROUP BY e.id, p.id
      ORDER BY sr.display_name, sa.display_name
    `).bind(employeeId).all();

    return permissions.results as EmployeePermission[];
  }

  /**
   * Get permission matrix for an employee (organized by resource and action)
   */
  async getEmployeePermissionMatrix(employeeId: number): Promise<PermissionMatrix> {
    await this.ensureRBACInitialized();

    // Get all resources
    const resources = await this.env.DB.prepare(`
      SELECT id, name, display_name, resource_type 
      FROM system_resources 
      WHERE is_active = 1 
      ORDER BY resource_type, display_name
    `).all();

    // Get all permissions for this employee
    const employeePermissions = await this.getEmployeePermissions(employeeId);
    const permissionMap = new Map(
      employeePermissions.map(p => [p.permission_key, p])
    );

    // Build matrix
    const matrix: PermissionMatrix = { resources: [] };

    for (const resource of resources.results || []) {
      // Get actions for this resource
      const actions = await this.env.DB.prepare(`
        SELECT DISTINCT sa.id, sa.name, sa.display_name, p.permission_key
        FROM system_actions sa
        JOIN permissions p ON sa.id = p.action_id
        WHERE p.resource_id = ? AND p.is_active = 1 AND sa.is_active = 1
        ORDER BY sa.display_name
      `).bind(resource.id).all();

      const resourceActions = actions.results?.map((action: any) => {
        const permission = permissionMap.get(action.permission_key);
        return {
          id: action.id,
          name: action.name,
          display_name: action.display_name,
          permission_key: action.permission_key,
          has_permission: permission?.has_permission || false,
          permission_source: permission?.permission_source
        };
      });

      matrix.resources.push({
        id: resource.id,
        name: resource.name,
        display_name: resource.display_name,
        resource_type: resource.resource_type,
        actions: resourceActions
      });
    }

    return matrix;
  }

  /**
   * Update individual employee permission
   */
  async updateEmployeePermission(
    employeeId: number,
    permissionKey: string,
    granted: boolean,
    grantedBy: number,
    reason?: string
  ): Promise<void> {
    await this.ensureRBACInitialized();

    // Get permission ID
    const permission = await this.env.DB.prepare(`
      SELECT id FROM permissions WHERE permission_key = ? AND is_active = 1
    `).bind(permissionKey).first();

    if (!permission) {
      throw new Error(`Permission not found: ${permissionKey}`);
    }

    // Get current permission state for audit
    const currentPermission = await this.env.DB.prepare(`
      SELECT granted FROM employee_permissions 
      WHERE employee_id = ? AND permission_id = ? AND is_active = 1
    `).bind(employeeId, permission.id).first();

    // Update or insert permission
    await this.env.DB.prepare(`
      INSERT OR REPLACE INTO employee_permissions 
      (employee_id, permission_id, granted, granted_by, granted_at, reason, is_active)
      VALUES (?, ?, ?, ?, datetime('now'), ?, 1)
    `).bind(employeeId, permission.id, granted ? 1 : 0, grantedBy, reason || null).run();

    // Log audit trail
    await this.env.DB.prepare(`
      INSERT INTO permission_audit_log 
      (employee_id, permission_key, action, old_value, new_value, changed_by, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      employeeId,
      permissionKey,
      granted ? 'granted' : 'denied',
      currentPermission?.granted || 0,
      granted ? 1 : 0,
      grantedBy,
      reason || null
    ).run();
  }

  /**
   * Bulk update employee permissions
   */
  async bulkUpdateEmployeePermissions(
    employeeId: number,
    permissions: Array<{ permission_key: string; granted: boolean }>,
    grantedBy: number,
    reason?: string
  ): Promise<void> {
    await this.ensureRBACInitialized();

    // Start transaction
    await this.env.DB.prepare('BEGIN TRANSACTION').run();

    try {
      for (const perm of permissions) {
        await this.updateEmployeePermission(
          employeeId,
          perm.permission_key,
          perm.granted,
          grantedBy,
          reason
        );
      }

      await this.env.DB.prepare('COMMIT').run();
    } catch (error) {
      await this.env.DB.prepare('ROLLBACK').run();
      throw error;
    }
  }

  /**
   * Assign role template to employee
   */
  async assignRoleTemplate(
    employeeId: number,
    roleId: number,
    assignedBy: number
  ): Promise<void> {
    await this.ensureRBACInitialized();

    // Check if role exists and is a template
    const role = await this.env.DB.prepare(`
      SELECT id, name FROM roles WHERE id = ? AND is_active = 1
    `).bind(roleId).first();

    if (!role) {
      throw new Error('Role template not found');
    }

    // Assign role to employee
    await this.env.DB.prepare(`
      INSERT OR REPLACE INTO employee_roles 
      (employee_id, role_id, assigned_by, assigned_at, is_active)
      VALUES (?, ?, ?, datetime('now'), 1)
    `).bind(employeeId, roleId, assignedBy).run();

    // Log audit trail
    await this.env.DB.prepare(`
      INSERT INTO permission_audit_log 
      (employee_id, permission_key, action, old_value, new_value, changed_by, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      employeeId,
      `role.${role.name}`,
      'role_assigned',
      0,
      1,
      assignedBy,
      `Assigned role: ${role.name}`
    ).run();
  }

  /**
   * Remove role from employee
   */
  async removeEmployeeRole(
    employeeId: number,
    roleId: number,
    removedBy: number
  ): Promise<void> {
    await this.ensureRBACInitialized();

    // Get role name for audit
    const role = await this.env.DB.prepare(`
      SELECT name FROM roles WHERE id = ?
    `).bind(roleId).first();

    // Remove role assignment
    await this.env.DB.prepare(`
      UPDATE employee_roles 
      SET is_active = 0 
      WHERE employee_id = ? AND role_id = ?
    `).bind(employeeId, roleId).run();

    // Log audit trail
    if (role) {
      await this.env.DB.prepare(`
        INSERT INTO permission_audit_log 
        (employee_id, permission_key, action, old_value, new_value, changed_by, reason, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        employeeId,
        `role.${role.name}`,
        'role_removed',
        1,
        0,
        removedBy,
        `Removed role: ${role.name}`
      ).run();
    }
  }

  /**
   * Get all role templates
   */
  async getRoleTemplates(): Promise<RoleTemplate[]> {
    await this.ensureRBACInitialized();

    const templates = await this.env.DB.prepare(`
      SELECT 
        r.id,
        r.name,
        r.display_name,
        r.description,
        r.is_template,
        r.is_system,
        COUNT(rp.permission_id) as permission_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id AND rp.granted = 1
      WHERE r.is_active = 1
      GROUP BY r.id
      ORDER BY r.is_system DESC, r.display_name
    `).all();

    return (templates as any).results as RoleTemplate[];
  }

  /**
   * Get employee roles
   */
  async getEmployeeRoles(employeeId: number): Promise<RoleTemplate[]> {
    await this.ensureRBACInitialized();

    const roles = await this.env.DB.prepare(`
      SELECT 
        r.id,
        r.name,
        r.display_name,
        r.description,
        r.is_template,
        r.is_system,
        COUNT(rp.permission_id) as permission_count
      FROM roles r
      JOIN employee_roles er ON r.id = er.role_id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id AND rp.granted = 1
      WHERE er.employee_id = ? AND er.is_active = 1 AND r.is_active = 1
      GROUP BY r.id
      ORDER BY r.display_name
    `).bind(employeeId).all();

    return (roles as any).results as RoleTemplate[];
  }

  /**
   * Check if employee has specific permission
   */
  async hasPermission(employeeId: number, permissionKey: string): Promise<boolean> {
    await this.ensureRBACInitialized();

    const result = await this.env.DB.prepare(`
      SELECT 1
      FROM employee_effective_permissions
      WHERE employee_id = ? AND permission_key = ? AND has_permission = 1
      LIMIT 1
    `).bind(employeeId, permissionKey).first();

    return !!result;
  }

  /**
   * Get permission audit log for employee
   */
  async getPermissionAuditLog(employeeId: number, limit: number = 50): Promise<any[]> {
    const auditLog = await this.env.DB.prepare(`
      SELECT 
        pal.*,
        u.full_name as changed_by_name
      FROM permission_audit_log pal
      LEFT JOIN users u ON pal.changed_by = u.id
      WHERE pal.employee_id = ?
      ORDER BY pal.created_at DESC
      LIMIT ?
    `).bind(employeeId, limit).all();

    return (auditLog as any).results as any[];
  }
}
