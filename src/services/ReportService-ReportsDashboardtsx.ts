import { Env } from '../types';

export interface ReportDefinition {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  category: string;
  query: string;
  columns_json: string;
  filters_json: string;
  chart_type?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export class ReportService_ReportsDashboardtsx {
  constructor(private env: Env) {}

  async getReports(tenantId: string, category?: string) {
    try {
      let query = `SELECT * FROM report_definitions WHERE tenant_id = ? AND is_active = 1`;
      const params: any[] = [tenantId];

      if (category) {
        query += ` AND category = ?`;
        params.push(category);
      }

      query += ` ORDER BY created_at DESC`;

      const reports = await this.env.DB.prepare(query).bind(...params).all();

      return {
        success: true,
        reports: reports.results || []
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi tải báo cáo' };
    }
  }

  async getReportById(id: string, tenantId: string) {
    try {
      const report = await this.env.DB.prepare(`
        SELECT * FROM report_definitions WHERE id = ? AND tenant_id = ?
      `).bind(id, tenantId).first();

      if (!report) {
        return { success: false, error: 'Không tìm thấy báo cáo' };
      }

      return { success: true, report };
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi tải báo cáo' };
    }
  }

  async executeReport(id: string, tenantId: string, userId: string, parameters: any = {}) {
    try {
      const reportResult = await this.getReportById(id, tenantId);
      if (!reportResult.success) return reportResult;

      const report = reportResult.report as any;

      // Execute the report query (simple version - in production would need parameter binding)
      const startTime = Date.now();
      const result = await this.env.DB.prepare(report.query).all();
      const executionTime = Date.now() - startTime;

      // Save execution record
      const executionId = crypto.randomUUID();
      const now = new Date().toISOString();

      await this.env.DB.prepare(`
        INSERT INTO report_executions (
          id, tenant_id, report_id, executed_by, status,
          parameters_json, result_json, execution_time_ms, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        executionId,
        tenantId,
        id,
        userId,
        'completed',
        JSON.stringify(parameters),
        JSON.stringify(result.results?.slice(0, 1000) || []), // Limit stored results
        executionTime,
        now
      ).run();

      return {
        success: true,
        data: result.results || [],
        columns: JSON.parse(report.columns_json || '[]'),
        execution_time_ms: executionTime,
        execution_id: executionId
      };
    } catch (error: any) {
      console.error('Report execution error:', error);
      return { success: false, error: error.message || 'Lỗi khi chạy báo cáo' };
    }
  }

  async createReport(tenantId: string, userId: string, data: Partial<ReportDefinition>) {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await this.env.DB.prepare(`
        INSERT INTO report_definitions (
          id, tenant_id, name, description, category, query,
          columns_json, filters_json, chart_type, is_active,
          created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        tenantId,
        data.name,
        data.description || null,
        data.category || 'custom',
        data.query,
        data.columns_json || '[]',
        data.filters_json || '{}',
        data.chart_type || null,
        1,
        userId,
        now,
        now
      ).run();

      return this.getReportById(id, tenantId);
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi tạo báo cáo' };
    }
  }

  async deleteReport(id: string, tenantId: string) {
    try {
      const result = await this.env.DB.prepare(`
        UPDATE report_definitions SET is_active = 0, updated_at = ?
        WHERE id = ? AND tenant_id = ?
      `).bind(new Date().toISOString(), id, tenantId).run();

      if (result.changes === 0) {
        return { success: false, error: 'Không tìm thấy báo cáo' };
      }

      return { success: true, message: 'Đã xóa báo cáo' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi xóa báo cáo' };
    }
  }

  async getReportExecutions(reportId: string, tenantId: string, page: number = 1, limit: number = 20) {
    try {
      const offset = (page - 1) * limit;

      const executions = await this.env.DB.prepare(`
        SELECT * FROM report_executions
        WHERE tenant_id = ? AND report_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).bind(tenantId, reportId, limit, offset).all();

      const countResult = await this.env.DB.prepare(`
        SELECT COUNT(*) as total FROM report_executions
        WHERE tenant_id = ? AND report_id = ?
      `).bind(tenantId, reportId).first();

      return {
        success: true,
        executions: executions.results || [],
        pagination: {
          page,
          limit,
          total: countResult?.total || 0,
          pages: Math.ceil((countResult?.total || 0) / limit)
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi tải lịch sử chạy báo cáo' };
    }
  }
}
