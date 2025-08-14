/**
 * COMPREHENSIVE AUDIT LOGGING SYSTEM
 * Tracks all critical business operations for compliance and security
 */

import { Env } from '../types';

export interface AuditLogEntry {
  id?: number;
  user_id: number;
  username: string;
  role: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: string; // JSON
  new_values?: string; // JSON
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  success: boolean;
  error_message?: string;
  metadata?: string; // JSON
  created_at: string;
}

export enum AuditAction {
  // Authentication actions
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_CHANGE = 'password_change',
  
  // CRUD operations
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  
  // Business operations
  SALE_CREATE = 'sale_create',
  SALE_CANCEL = 'sale_cancel',
  SALE_REFUND = 'sale_refund',
  INVENTORY_ADJUST = 'inventory_adjust',
  INVENTORY_TRANSFER = 'inventory_transfer',
  PRICE_CHANGE = 'price_change',
  
  // Administrative actions
  USER_CREATE = 'user_create',
  USER_UPDATE = 'user_update',
  USER_DELETE = 'user_delete',
  PERMISSION_GRANT = 'permission_grant',
  PERMISSION_REVOKE = 'permission_revoke',
  
  // System actions
  BACKUP_CREATE = 'backup_create',
  BACKUP_RESTORE = 'backup_restore',
  SYSTEM_CONFIG_CHANGE = 'system_config_change',
  
  // Security events
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  PERMISSION_DENIED = 'permission_denied',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity'
}

export enum ResourceType {
  USER = 'user',
  PRODUCT = 'product',
  CATEGORY = 'category',
  CUSTOMER = 'customer',
  SUPPLIER = 'supplier',
  SALE = 'sale',
  INVENTORY = 'inventory',
  SERIAL_NUMBER = 'serial_number',
  WARRANTY = 'warranty',
  STORE = 'store',
  SYSTEM = 'system'
}

/**
 * Audit logger class
 */
export class AuditLogger {
  
  /**
   * Log an audit event
   */
  static async log(
    env: Env,
    entry: Omit<AuditLogEntry, 'id' | 'created_at'>
  ): Promise<boolean> {
    try {
      await env.DB.prepare(`
        INSERT INTO audit_log (
          user_id, username, role, action, resource_type, resource_id,
          old_values, new_values, ip_address, user_agent, session_id,
          success, error_message, metadata, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        entry.user_id,
        entry.username,
        entry.role,
        entry.action,
        entry.resource_type,
        entry.resource_id || null,
        entry.old_values || null,
        entry.new_values || null,
        entry.ip_address || null,
        entry.user_agent || null,
        entry.session_id || null,
        entry.success ? 1 : 0,
        entry.error_message || null,
        entry.metadata || null
      ).run();

      return true;
    } catch (error) {
      console.error('Failed to write audit log:', error);
      return false;
    }
  }

  /**
   * Log authentication event
   */
  static async logAuth(
    env: Env,
    action: AuditAction,
    username: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    errorMessage?: string,
    userId?: number
  ): Promise<void> {
    await this.log(env, {
      user_id: userId || 0,
      username,
      role: 'unknown',
      action,
      resource_type: ResourceType.USER,
      success,
      error_message: errorMessage,
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  /**
   * Log CRUD operation
   */
  static async logCrud(
    env: Env,
    user: any,
    action: AuditAction,
    resourceType: ResourceType,
    resourceId?: string,
    oldValues?: any,
    newValues?: any,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    await this.log(env, {
      user_id: user.id,
      username: user.username,
      role: user.role,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      old_values: oldValues ? JSON.stringify(oldValues) : null,
      new_values: newValues ? JSON.stringify(newValues) : null,
      success,
      error_message: errorMessage
    });
  }

  /**
   * Log business operation
   */
  static async logBusiness(
    env: Env,
    user: any,
    action: AuditAction,
    resourceType: ResourceType,
    resourceId: string,
    metadata: any,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    await this.log(env, {
      user_id: user.id,
      username: user.username,
      role: user.role,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata: JSON.stringify(metadata),
      success,
      error_message: errorMessage
    });
  }

  /**
   * Log security event
   */
  static async logSecurity(
    env: Env,
    action: AuditAction,
    resourceType: ResourceType,
    details: any,
    ipAddress?: string,
    userAgent?: string,
    userId?: number,
    username?: string
  ): Promise<void> {
    await this.log(env, {
      user_id: userId || 0,
      username: username || 'unknown',
      role: 'unknown',
      action,
      resource_type: resourceType,
      success: false,
      metadata: JSON.stringify(details),
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  /**
   * Get audit logs with filtering
   */
  static async getLogs(
    env: Env,
    filters: {
      user_id?: number;
      action?: string;
      resource_type?: string;
      start_date?: string;
      end_date?: string;
      success?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<AuditLogEntry[]> {
    try {
      let query = 'SELECT * FROM audit_log WHERE 1=1';
      const params: any[] = [];

      if (filters.user_id) {
        query += ' AND user_id = ?';
        params.push(filters.user_id);
      }

      if (filters.action) {
        query += ' AND action = ?';
        params.push(filters.action);
      }

      if (filters.resource_type) {
        query += ' AND resource_type = ?';
        params.push(filters.resource_type);
      }

      if (filters.start_date) {
        query += ' AND created_at >= ?';
        params.push(filters.start_date);
      }

      if (filters.end_date) {
        query += ' AND created_at <= ?';
        params.push(filters.end_date);
      }

      if (filters.success !== undefined) {
        query += ' AND success = ?';
        params.push(filters.success ? 1 : 0);
      }

      query += ' ORDER BY created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }

      const result = await env.DB.prepare(query).bind(...params).all();
      return result.results as AuditLogEntry[] || [];
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return [];
    }
  }

  /**
   * Get audit statistics
   */
  static async getStats(
    env: Env,
    startDate?: string,
    endDate?: string
  ): Promise<{
    total_events: number;
    successful_events: number;
    failed_events: number;
    unique_users: number;
    top_actions: Array<{ action: string; count: number }>;
    security_events: number;
  }> {
    try {
      let dateFilter = '';
      const params: any[] = [];

      if (startDate) {
        dateFilter += ' AND created_at >= ?';
        params.push(startDate);
      }

      if (endDate) {
        dateFilter += ' AND created_at <= ?';
        params.push(endDate);
      }

      // Total events
      const totalResult = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM audit_log WHERE 1=1${dateFilter}`
      ).bind(...params).first();

      // Successful events
      const successResult = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM audit_log WHERE success = 1${dateFilter}`
      ).bind(...params).first();

      // Failed events
      const failedResult = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM audit_log WHERE success = 0${dateFilter}`
      ).bind(...params).first();

      // Unique users
      const usersResult = await env.DB.prepare(
        `SELECT COUNT(DISTINCT user_id) as count FROM audit_log WHERE user_id > 0${dateFilter}`
      ).bind(...params).first();

      // Top actions
      const actionsResult = await env.DB.prepare(
        `SELECT action, COUNT(*) as count FROM audit_log WHERE 1=1${dateFilter} GROUP BY action ORDER BY count DESC LIMIT 10`
      ).bind(...params).all();

      // Security events
      const securityResult = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM audit_log WHERE action IN ('unauthorized_access', 'permission_denied', 'suspicious_activity', 'login_failed')${dateFilter}`
      ).bind(...params).first();

      return {
        total_events: totalResult?.count || 0,
        successful_events: successResult?.count || 0,
        failed_events: failedResult?.count || 0,
        unique_users: usersResult?.count || 0,
        top_actions: actionsResult.results as Array<{ action: string; count: number }> || [],
        security_events: securityResult?.count || 0
      };
    } catch (error) {
      console.error('Failed to get audit stats:', error);
      return {
        total_events: 0,
        successful_events: 0,
        failed_events: 0,
        unique_users: 0,
        top_actions: [],
        security_events: 0
      };
    }
  }

  /**
   * Clean old audit logs (for compliance with data retention policies)
   */
  static async cleanOldLogs(
    env: Env,
    retentionDays: number = 365
  ): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      const result = await env.DB.prepare(
        'DELETE FROM audit_log WHERE created_at < ?'
      ).bind(cutoffDate.toISOString()).run();

      console.log(`Cleaned ${result.changes} old audit log entries`);
      return result.changes || 0;
    } catch (error) {
      console.error('Failed to clean old audit logs:', error);
      return 0;
    }
  }
}

/**
 * Middleware for automatic audit logging
 */
export const auditMiddleware = (action: AuditAction, resourceType: ResourceType) => {
  return async (c: any, next: any) => {
    const startTime = Date.now();
    const user = c.get('user');
    const resourceId = c.req.param('id');
    
    try {
      await next();
      
      // Log successful operation
      if (user) {
        await AuditLogger.logCrud(
          c.env,
          user,
          action,
          resourceType,
          resourceId,
          null, // old values would need to be captured before operation
          null, // new values would need to be captured after operation
          true
        );
      }
    } catch (error) {
      // Log failed operation
      if (user) {
        await AuditLogger.logCrud(
          c.env,
          user,
          action,
          resourceType,
          resourceId,
          null,
          null,
          false,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
      throw error;
    }
  };
};
