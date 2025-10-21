import { BaseService } from './BaseService';
import { Env } from '../types';

export class ReportService extends BaseService {
  constructor(env: Env) {
    super(env, 'report_definitions', 'id');
  }

  async getReports(tenantId: string, userId: string, filters: any): Promise<{ success: boolean; data?: any[]; pagination?: any; filters?: any; error?: string }> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 50;
      const offset = (page - 1) * limit;

      let query = `SELECT * FROM report_definitions WHERE tenant_id = ?`;
      const params: any[] = [tenantId];

      if (filters?.category) {
        query += ` AND category = ?`;
        params.push(filters.category);
      }

      if (filters?.is_active !== undefined) {
        query += ` AND is_active = ?`;
        params.push(filters.is_active ? 1 : 0);
      }

      query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const result = await this.env.DB.prepare(query).bind(...params).all();

      const countQuery = `SELECT COUNT(*) as total FROM report_definitions WHERE tenant_id = ?`;
      const countResult = await this.env.DB.prepare(countQuery).bind(tenantId).first();
      const total = countResult?.total || 0;

      return {
        success: true,
        data: result.results || [],
        pagination: {
          page,
          limit,
          total: Number(total) || 0,
          pages: Math.ceil(Number(total) / limit)
        },
        filters
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getReport(tenantId: string, userId: string, reportId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const report = await this.env.DB.prepare(`
        SELECT * FROM report_definitions WHERE id = ? AND tenant_id = ?
      `).bind(reportId, tenantId).first();

      if (!report) {
        return { success: false, error: 'Report not found' };
      }

      return { success: true, data: report };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async createReport(tenantId: string, userId: string, data: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await this.env.DB.prepare(`
        INSERT INTO report_definitions (
          id, tenant_id, name, description, category, query_template,
          parameters, is_active, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        tenantId,
        data.name,
        data.description || null,
        data.category || 'general',
        data.query_template || '',
        JSON.stringify(data.parameters || {}),
        data.is_active ? 1 : 0,
        userId,
        now,
        now
      ).run();

      const report = await this.env.DB.prepare(`
        SELECT * FROM report_definitions WHERE id = ?
      `).bind(id).first();

      return { success: true, data: report };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateReport(tenantId: string, userId: string, reportId: string, data: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const now = new Date().toISOString();

      await this.env.DB.prepare(`
        UPDATE report_definitions
        SET name = ?, description = ?, category = ?, query_template = ?,
            parameters = ?, is_active = ?, updated_at = ?
        WHERE id = ? AND tenant_id = ?
      `).bind(
        data.name,
        data.description || null,
        data.category || 'general',
        data.query_template || '',
        JSON.stringify(data.parameters || {}),
        data.is_active ? 1 : 0,
        now,
        reportId,
        tenantId
      ).run();

      const report = await this.env.DB.prepare(`
        SELECT * FROM report_definitions WHERE id = ? AND tenant_id = ?
      `).bind(reportId, tenantId).first();

      return { success: true, data: report };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteReport(tenantId: string, userId: string, reportId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.env.DB.prepare(`
        DELETE FROM report_definitions WHERE id = ? AND tenant_id = ?
      `).bind(reportId, tenantId).run();

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async runReport(tenantId: string, userId: string, reportId: string, parameters: any): Promise<{ success: boolean; data?: any[]; execution_time?: number; record_count?: number; error?: string }> {
    try {
      const startTime = Date.now();

      const report = await this.env.DB.prepare(`
        SELECT * FROM report_definitions WHERE id = ? AND tenant_id = ?
      `).bind(reportId, tenantId).first();

      if (!report) {
        return { success: false, error: 'Report not found' };
      }

      // For now, return mock data - in production, execute query_template with parameters
      const result = await this.env.DB.prepare(`
        SELECT * FROM sales WHERE tenant_id = ? LIMIT 100
      `).bind(tenantId).all();

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: result.results || [],
        execution_time: executionTime,
        record_count: result.results?.length || 0
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getAnalytics(tenantId: string, userId: string): Promise<any> {
    try {
      const totalReports = await this.env.DB.prepare(`
        SELECT COUNT(*) as count FROM report_definitions WHERE tenant_id = ?
      `).bind(tenantId).first();

      const activeReports = await this.env.DB.prepare(`
        SELECT COUNT(*) as count FROM report_definitions WHERE tenant_id = ? AND is_active = 1
      `).bind(tenantId).first();

      return {
        total_reports: Number((totalReports as any)?.count) || 0,
        active_reports: Number((activeReports as any)?.count) || 0,
        inactive_reports: (Number((totalReports as any)?.count) || 0) - (Number((activeReports as any)?.count) || 0)
      };
    } catch (error: any) {
      return { total_reports: 0, active_reports: 0, inactive_reports: 0 };
    }
  }

  async exportReport(tenantId: string, userId: string, reportId: string, format: 'csv' | 'excel' | 'pdf'): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const reportData = await this.runReport(tenantId, userId, reportId, {});
      if (!reportData.success) {
        return { success: false, error: reportData.error };
      }

      if (format === 'csv') {
        // Generate CSV
        const headers = Object.keys(reportData.data?.[0] || {}).join(',') + '\n';
        const rows = (reportData.data || []).map((row: any) =>
          Object.values(row).map(v => `"${v}"`).join(',')
        ).join('\n');
        return { success: true, data: headers + rows };
      }

      return { success: true, data: 'Export format not implemented' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async scheduleReport(tenantId: string, userId: string, reportId: string, schedule: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await this.env.DB.prepare(`
        INSERT INTO report_schedules (
          id, tenant_id, report_id, schedule_type, schedule_config,
          recipients, is_active, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        tenantId,
        reportId,
        schedule.schedule_type || 'daily',
        JSON.stringify(schedule.schedule_config || {}),
        JSON.stringify(schedule.recipients || []),
        1,
        userId,
        now,
        now
      ).run();

      return { success: true, data: { id, schedule_type: schedule.schedule_type } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async unscheduleReport(tenantId: string, userId: string, reportId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.env.DB.prepare(`
        DELETE FROM report_schedules WHERE report_id = ? AND tenant_id = ?
      `).bind(reportId, tenantId).run();

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getTemplates(tenantId: string, userId: string): Promise<any[]> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT * FROM report_definitions WHERE tenant_id = ? AND is_template = 1 ORDER BY name ASC
      `).bind(tenantId).all();
      return result.results || [];
    } catch (error: any) {
      return [];
    }
  }

  async createFromTemplate(tenantId: string, userId: string, templateId: string, data: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const template = await this.env.DB.prepare(`
        SELECT * FROM report_definitions WHERE id = ? AND tenant_id = ?
      `).bind(templateId, tenantId).first();

      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await this.env.DB.prepare(`
        INSERT INTO report_definitions (
          id, tenant_id, name, description, category, query_template,
          parameters, is_active, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        tenantId,
        data.name,
        data.description || template.description,
        data.category || template.category,
        template.query_template,
        template.parameters,
        data.is_active ? 1 : 0,
        userId,
        now,
        now
      ).run();

      const newReport = await this.env.DB.prepare(`
        SELECT * FROM report_definitions WHERE id = ?
      `).bind(id).first();

      return { success: true, data: newReport };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async duplicateReport(tenantId: string, userId: string, reportId: string, name: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const original = await this.env.DB.prepare(`
        SELECT * FROM report_definitions WHERE id = ? AND tenant_id = ?
      `).bind(reportId, tenantId).first();

      if (!original) {
        return { success: false, error: 'Report not found' };
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await this.env.DB.prepare(`
        INSERT INTO report_definitions (
          id, tenant_id, name, description, category, query_template,
          parameters, is_active, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        tenantId,
        name,
        original.description,
        original.category,
        original.query_template,
        original.parameters,
        0,
        userId,
        now,
        now
      ).run();

      const duplicate = await this.env.DB.prepare(`
        SELECT * FROM report_definitions WHERE id = ?
      `).bind(id).first();

      return { success: true, data: duplicate };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async bulkDelete(tenantId: string, userId: string, ids: string[]): Promise<{ deleted_count: number }> {
    try {
      let deletedCount = 0;
      for (const id of ids) {
        await this.env.DB.prepare(`
          DELETE FROM report_definitions WHERE id = ? AND tenant_id = ?
        `).bind(id, tenantId).run();
        deletedCount++;
      }
      return { deleted_count: deletedCount };
    } catch (error: any) {
      return { deleted_count: 0 };
    }
  }

  async bulkUpdate(tenantId: string, userId: string, ids: string[], data: any): Promise<{ updated_count: number }> {
    try {
      let updatedCount = 0;
      const now = new Date().toISOString();
      for (const id of ids) {
        await this.env.DB.prepare(`
          UPDATE report_definitions
          SET is_active = ?, updated_at = ?
          WHERE id = ? AND tenant_id = ?
        `).bind(data.is_active ? 1 : 0, now, id, tenantId).run();
        updatedCount++;
      }
      return { updated_count: updatedCount };
    } catch (error: any) {
      return { updated_count: 0 };
    }
  }

  async getComments(tenantId: string, userId: string, reportId: string): Promise<any[]> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT * FROM report_comments WHERE report_id = ? AND tenant_id = ? ORDER BY created_at DESC
      `).bind(reportId, tenantId).all();
      return result.results || [];
    } catch (error: any) {
      return [];
    }
  }

  async addComment(tenantId: string, userId: string, reportId: string, comment: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await this.env.DB.prepare(`
        INSERT INTO report_comments (id, tenant_id, report_id, user_id, comment, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(id, tenantId, reportId, userId, comment, now).run();

      const newComment = await this.env.DB.prepare(`
        SELECT * FROM report_comments WHERE id = ?
      `).bind(id).first();

      return { success: true, data: newComment };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getDashboard(tenantId: string, userId: string): Promise<any> {
    try {
      const totalReports = await this.env.DB.prepare(`
        SELECT COUNT(*) as count FROM report_definitions WHERE tenant_id = ?
      `).bind(tenantId).first();

      const activeReports = await this.env.DB.prepare(`
        SELECT COUNT(*) as count FROM report_definitions WHERE tenant_id = ? AND is_active = 1
      `).bind(tenantId).first();

      const recentReports = await this.env.DB.prepare(`
        SELECT * FROM report_definitions WHERE tenant_id = ? ORDER BY updated_at DESC LIMIT 5
      `).bind(tenantId).all();

      return {
        total_reports: totalReports?.count || 0,
        active_reports: activeReports?.count || 0,
        recent_reports: recentReports.results || []
      };
    } catch (error: any) {
      return {
        total_reports: 0,
        active_reports: 0,
        recent_reports: []
      };
    }
  }
}
