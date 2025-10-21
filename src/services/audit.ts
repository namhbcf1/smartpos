/**
 * Audit Service
 * Handles audit logging for system activities
 */

import type { Env } from '../types';

export interface AuditLogEntry {
  id?: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
}

export async function auditLog(
  env: Env,
  entry: AuditLogEntry
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO audit_logs (
        id, user_id, action, resource_type, resource_id, 
        details, ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      entry.user_id || null,
      entry.action,
      entry.resource_type,
      entry.resource_id || null,
      entry.details ? JSON.stringify(entry.details) : null,
      entry.ip_address || null,
      entry.user_agent || null,
      timestamp
    ).run();

    return { success: true, id };
  } catch (error: any) {
    console.error('Audit log failed:', error);
    return { success: false, error: error.message };
  }
}

export async function getAuditLogs(
  env: Env,
  filters: {
    user_id?: string;
    action?: string;
    resource_type?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<{
  success: boolean;
  data?: AuditLogEntry[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  error?: string;
}> {
  try {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    let whereConditions: string[] = [];
    let bindings: any[] = [];

    if (filters.user_id) {
      whereConditions.push('user_id = ?');
      bindings.push(filters.user_id);
    }

    if (filters.action) {
      whereConditions.push('action = ?');
      bindings.push(filters.action);
    }

    if (filters.resource_type) {
      whereConditions.push('resource_type = ?');
      bindings.push(filters.resource_type);
    }

    if (filters.start_date) {
      whereConditions.push('created_at >= ?');
      bindings.push(filters.start_date);
    }

    if (filters.end_date) {
      whereConditions.push('created_at <= ?');
      bindings.push(filters.end_date);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const countResult = await env.DB.prepare(`
      SELECT COUNT(*) as total FROM audit_logs ${whereClause}
    `).bind(...bindings).first();

    const total = (countResult as any)?.total || 0;

    // Get logs
    const logs = await env.DB.prepare(`
      SELECT * FROM audit_logs 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).bind(...bindings, limit, offset).all();

    return {
      success: true,
      data: logs.results as AuditLogEntry[],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error: any) {
    console.error('Get audit logs failed:', error);
    return { success: false, error: error.message };
  }
}
