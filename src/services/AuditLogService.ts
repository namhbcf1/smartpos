/**
 * Audit Log Service
 * Tracks all important actions in the system for security and compliance
 */

export interface AuditLogEntry {
  id?: string;
  tenant_id: string;
  actor_id: string;
  action: string;
  entity: string;
  entity_id: string;
  data_json?: any;
  created_at?: string;
}

export class AuditLogService {
  constructor(private env: any) {}

  /**
   * Log an action
   */
  async log(entry: AuditLogEntry): Promise<{ success: boolean; error?: string }> {
    try {
      const id = crypto.randomUUID();
      const tenant_id = entry.tenant_id || 'default';

      await this.env.DB.prepare(`
        INSERT INTO audit_logs (
          id, tenant_id, actor_id, action, entity, entity_id,
          data_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        id,
        tenant_id,
        entry.actor_id,
        entry.action,
        entry.entity,
        entry.entity_id || null,
        entry.data_json ? JSON.stringify(entry.data_json) : null
      ).run();

      return { success: true };
    } catch (e: any) {
      console.error('Audit log error:', e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Get audit logs with pagination and filters
   */
  async getLogs(
    page: number = 1,
    limit: number = 50,
    filters: {
      actor_id?: string;
      entity?: string;
      entity_id?: string;
      action?: string;
      from_date?: string;
      to_date?: string;
    } = {},
    tenant_id: string = 'default'
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const where: string[] = ['COALESCE(tenant_id, \'default\') = ?'];
      const params: any[] = [tenant_id];

      if (filters.actor_id) {
        where.push('actor_id = ?');
        params.push(filters.actor_id);
      }

      if (filters.entity) {
        where.push('entity = ?');
        params.push(filters.entity);
      }

      if (filters.entity_id) {
        where.push('entity_id = ?');
        params.push(filters.entity_id);
      }

      if (filters.action) {
        where.push('action = ?');
        params.push(filters.action);
      }

      if (filters.from_date) {
        where.push('created_at >= ?');
        params.push(filters.from_date);
      }

      if (filters.to_date) {
        where.push('created_at <= ?');
        params.push(filters.to_date);
      }

      const offset = (page - 1) * limit;

      const result = await this.env.DB.prepare(`
        SELECT * FROM audit_logs
        WHERE ${where.join(' AND ')}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).bind(...params, limit, offset).all();

      // Get total count
      const countResult = await this.env.DB.prepare(`
        SELECT COUNT(*) as total FROM audit_logs
        WHERE ${where.join(' AND ')}
      `).bind(...params).first();

      return {
        success: true,
        data: {
          logs: result.results || [],
          pagination: {
            page,
            limit,
            total: (countResult as any)?.total || 0,
            pages: Math.ceil(((countResult as any)?.total || 0) / limit)
          }
        }
      };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Get logs for a specific entity
   */
  async getEntityHistory(
    entity: string,
    entity_id: string,
    tenant_id: string = 'default'
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT * FROM audit_logs
        WHERE entity = ?
          AND entity_id = ?
          AND COALESCE(tenant_id, 'default') = ?
        ORDER BY created_at DESC
        LIMIT 100
      `).bind(entity, entity_id, tenant_id).all();

      return {
        success: true,
        data: result.results || []
      };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}

// Helper function to create audit log from context
export async function auditLog(
  c: any,
  action: string,
  entity: string,
  entity_id?: string,
  data_json?: any
) {
  try {
    const service = new AuditLogService(c.env);
    const actor_id = (c.get as any)('userId') || 'system';
    const tenant_id = (c.get as any)('tenantId') || 'default';

    await service.log({
      tenant_id,
      actor_id,
      action,
      entity,
      entity_id,
      data_json
    });
  } catch (e) {
    // Don't throw - audit logging should never break the main flow
    console.error('Failed to create audit log:', e);
  }
}
