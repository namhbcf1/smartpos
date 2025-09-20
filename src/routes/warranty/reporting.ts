import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate } from '../../middleware/auth';
import { ReportingService } from '../../services/ReportingService';

const warrantyReporting = new Hono<{ Bindings: Env }>();

warrantyReporting.use('*', authenticate);

// Simple in-memory templates for demo
const templates = [
  {
    id: 'warranty_summary',
    name: 'Tổng quan bảo hành',
    description: 'Tổng hợp số lượng đăng ký, claim theo kỳ',
    type: 'summary',
    default_filters: {
      date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      date_to: new Date().toISOString().split('T')[0],
      status: [],
      warranty_type: [],
      product_category: [],
      customer_group: [],
      technician: [],
      cost_range: { min: 0, max: 10000000 }
    },
    is_system: true
  }
];

warrantyReporting.get('/report-templates', async (c: any) => {
  return c.json({ success: true, data: templates });
});

// For demo, return empty list of stored reports
warrantyReporting.get('/reports', async (c: any) => {
  return c.json({ success: true, data: [] });
});

warrantyReporting.post('/report', async (c: any) => {
  try {
    const { templateId, filters } = await c.req.json();
    // For now, generate a simple dataset from warranty tables if exist
    const env = c.env as Env;

    // Basic aggregated dataset
    const where: string[] = [];
    const binds: any[] = [];
    if (filters?.date_from) { where.push('DATE(wr.warranty_start_date) >= DATE(?)'); binds.push(filters.date_from); }
    if (filters?.date_to) { where.push('DATE(wr.warranty_start_date) <= DATE(?)'); binds.push(filters.date_to); }
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const registrations = await env.DB.prepare(`
      SELECT COUNT(*) as total
      FROM warranty_registrations wr
      ${whereClause}
    `).bind(...binds).first();

    const claims = await env.DB.prepare(`
      SELECT COUNT(*) as total
      FROM warranty_claims wc
      ${filters?.date_from || filters?.date_to ? 'WHERE 1=1' : ''}
      ${filters?.date_from ? ' AND DATE(wc.claim_date) >= DATE(?)' : ''}
      ${filters?.date_to ? ' AND DATE(wc.claim_date) <= DATE(?)' : ''}
    `).bind(...(filters?.date_from ? [filters.date_from] : []), ...(filters?.date_to ? [filters.date_to] : [])).first();

    const data = [
      { metric: 'total_registrations', value: Number(registrations?.total || 0) },
      { metric: 'total_claims', value: Number(claims?.total || 0) }
    ];

    return c.json({ success: true, data, meta: { templateId, filters } });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to generate warranty report', error: (error as Error).message }, 500);
  }
});

warrantyReporting.post('/export', async (c: any) => {
  try {
    const { reportId, filters, format } = await c.req.json();
    // Use generic ReportingService for CSV/XLSX/PDF generation with fake dataset
    const service = new ReportingService(c.env as Env);
    const buffer = await service.exportReport('financial_summary', { dateFrom: filters?.date_from, dateTo: filters?.date_to }, (format || 'csv'));

    const mime = format === 'pdf' ? 'application/pdf' : format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv';
    return new Response(buffer as BodyInit, {
      headers: {
        'Content-Type': mime,
        'Content-Disposition': `attachment; filename="warranty-report.${format === 'pdf' ? 'pdf' : format === 'excel' ? 'xlsx' : 'csv'}"`
      }
    } as any);
  } catch (error) {
    return c.json({ success: false, message: 'Failed to export warranty report', error: (error as Error).message }, 500);
  }
});

export default warrantyReporting;


