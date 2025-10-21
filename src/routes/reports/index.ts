import { Hono } from 'hono';
import { z } from 'zod';
import { ReportService } from '../../services/ReportService';

const reportsRouter = new Hono();

// Validation schemas
const CreateReportSchema = z.object({
  name: z.string().min(1, 'Tên báo cáo là bắt buộc'),
  type: z.enum(['sales', 'inventory', 'financial', 'customer', 'product', 'custom']),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive', 'draft']).default('active'),
  parameters: z.record(z.any()).default({}),
  schedule: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
    time: z.string(),
    enabled: z.boolean().default(false)
  }).optional(),
  chart_config: z.object({
    type: z.enum(['line', 'bar', 'pie', 'area', 'table']),
    x_axis: z.string(),
    y_axis: z.string(),
    colors: z.array(z.string())
  }).optional()
});

const UpdateReportSchema = CreateReportSchema.partial();

const ReportFiltersSchema = z.object({
  search: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  created_by: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
});

const RunReportSchema = z.object({
  parameters: z.record(z.any()).optional()
});

const ScheduleReportSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
  time: z.string(),
  enabled: z.boolean()
});

const ShareReportSchema = z.object({
  users: z.array(z.string()).optional(),
  roles: z.array(z.string()).optional(),
  public: z.boolean().default(false),
  expires_at: z.string().optional()
});

const CommentSchema = z.object({
  content: z.string().min(1, 'Nội dung comment là bắt buộc'),
  is_internal: z.boolean().default(false)
});

const AlertSchema = z.object({
  condition: z.string().min(1, 'Điều kiện là bắt buộc'),
  threshold: z.number().min(0, 'Ngưỡng phải >= 0'),
  message: z.string().min(1, 'Thông báo là bắt buộc'),
  enabled: z.boolean().default(true)
});

// GET /reports - Get all reports with filtering and pagination
reportsRouter.get('/', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    
    const query = c.req.query();
    const filters = ReportFiltersSchema.parse(query);
    
    const reportService = new ReportService(c.env as any);
    const result = await reportService.getReports(tenantId, userId, filters);
    
    return c.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      filters: result.filters
    });
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi tải danh sách báo cáo'
    }, 500);
  }
});

// GET /reports/:id - Get single report by ID
reportsRouter.get('/:id', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const reportId = c.req.param('id');
    
    const reportService = new ReportService(c.env as any);
    const result = await reportService.getReport(tenantId, userId, reportId);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: result.error
      }, 404);
    }
    
    return c.json({
      success: true,
      data: result.data
    });
  } catch (error: any) {
    console.error('Error fetching report:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi tải báo cáo'
    }, 500);
  }
});

// POST /reports - Create new report
reportsRouter.post('/', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    
    const body = await c.req.json();
    const data = CreateReportSchema.parse(body);
    
    const reportService = new ReportService(c.env as any);
    const result = await reportService.createReport(tenantId, userId, data);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: result.error
      }, 400);
    }
    
    return c.json({
      success: true,
      data: result.data
    }, 201);
  } catch (error: any) {
    console.error('Error creating report:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi tạo báo cáo'
    }, 500);
  }
});

// PUT /reports/:id - Update existing report
reportsRouter.put('/:id', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const reportId = c.req.param('id');
    
    const body = await c.req.json();
    const data = UpdateReportSchema.parse(body);
    
    const reportService = new ReportService(c.env as any);
    const result = await reportService.updateReport(tenantId, userId, reportId, data);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: result.error
      }, 400);
    }
    
    return c.json({
      success: true,
      data: result.data
    });
  } catch (error: any) {
    console.error('Error updating report:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi cập nhật báo cáo'
    }, 500);
  }
});

// DELETE /reports/:id - Delete report
reportsRouter.delete('/:id', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const reportId = c.req.param('id');
    
    const reportService = new ReportService(c.env as any);
    const result = await reportService.deleteReport(tenantId, userId, reportId);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: result.error
      }, 400);
    }
    
    return c.json({
      success: true,
      message: 'Xóa báo cáo thành công'
    });
  } catch (error: any) {
    console.error('Error deleting report:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi xóa báo cáo'
    }, 500);
  }
});

// POST /reports/:id/run - Run report and get data
reportsRouter.post('/:id/run', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const reportId = c.req.param('id');
    
    const body = await c.req.json();
    const { parameters } = RunReportSchema.parse(body);
    
    const reportService = new ReportService(c.env as any);
    const result = await reportService.runReport(tenantId, userId, reportId, parameters);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: result.error
      }, 400);
    }
    
    return c.json({
      success: true,
      data: result.data,
      execution_time: result.execution_time,
      record_count: result.record_count
    });
  } catch (error: any) {
    console.error('Error running report:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi chạy báo cáo'
    }, 500);
  }
});

// GET /reports/analytics - Get report analytics
reportsRouter.get('/analytics', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    
    const reportService = new ReportService(c.env as any);
    const result = await reportService.getAnalytics(tenantId, userId);
    
    return c.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error fetching report analytics:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi tải thống kê báo cáo'
    }, 500);
  }
});

// GET /reports/:id/export - Export report data
reportsRouter.get('/:id/export', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const reportId = c.req.param('id');
    const format = c.req.query('format') || 'csv';
    
    const reportService = new ReportService(c.env as any);
    const result = await reportService.exportReport(tenantId, userId, reportId, format as any);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: result.error
      }, 400);
    }
    
    const contentType = format === 'csv' ? 'text/csv' : 
                      format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                      'application/pdf';
    
    return new Response(result.data, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="report-${reportId}.${format}"`
      }
    });
  } catch (error: any) {
    console.error('Error exporting report:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi xuất báo cáo'
    }, 500);
  }
});

// POST /reports/:id/schedule - Schedule report
reportsRouter.post('/:id/schedule', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const reportId = c.req.param('id');
    
    const body = await c.req.json();
    const schedule = ScheduleReportSchema.parse(body);
    
    const reportService = new ReportService(c.env as any);
    const result = await reportService.scheduleReport(tenantId, userId, reportId, schedule);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: result.error
      }, 400);
    }
    
    return c.json({
      success: true,
      data: result.data
    });
  } catch (error: any) {
    console.error('Error scheduling report:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi lên lịch báo cáo'
    }, 500);
  }
});

// DELETE /reports/:id/schedule - Unschedule report
reportsRouter.delete('/:id/schedule', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const reportId = c.req.param('id');
    
    const reportService = new ReportService(c.env as any);
    const result = await reportService.unscheduleReport(tenantId, userId, reportId);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: result.error
      }, 400);
    }
    
    return c.json({
      success: true,
      message: 'Hủy lịch báo cáo thành công'
    });
  } catch (error: any) {
    console.error('Error unscheduling report:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi hủy lịch báo cáo'
    }, 500);
  }
});

// GET /reports/templates - Get report templates
reportsRouter.get('/templates', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    
    const reportService = new ReportService(c.env as any);
    const result = await reportService.getTemplates(tenantId, userId);
    
    return c.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error fetching report templates:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi tải mẫu báo cáo'
    }, 500);
  }
});

// POST /reports/templates/:id/create - Create report from template
reportsRouter.post('/templates/:id/create', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const templateId = c.req.param('id');
    
    const body = await c.req.json();
    const data = UpdateReportSchema.parse(body);
    
    const reportService = new ReportService(c.env as any);
    const result = await reportService.createFromTemplate(tenantId, userId, templateId, data);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: result.error
      }, 400);
    }
    
    return c.json({
      success: true,
      data: result.data
    }, 201);
  } catch (error: any) {
    console.error('Error creating report from template:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi tạo báo cáo từ mẫu'
    }, 500);
  }
});

// POST /reports/:id/duplicate - Duplicate report
reportsRouter.post('/:id/duplicate', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const reportId = c.req.param('id');
    
    const body = await c.req.json();
    const { name } = z.object({ name: z.string().min(1) }).parse(body);
    
    const reportService = new ReportService(c.env as any);
    const result = await reportService.duplicateReport(tenantId, userId, reportId, name);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: result.error
      }, 400);
    }
    
    return c.json({
      success: true,
      data: result.data
    }, 201);
  } catch (error: any) {
    console.error('Error duplicating report:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi sao chép báo cáo'
    }, 500);
  }
});

// POST /reports/bulk/delete - Bulk delete reports
reportsRouter.post('/bulk/delete', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    
    const body = await c.req.json();
    const { ids } = z.object({ ids: z.array(z.string()) }).parse(body);
    
    const reportService = new ReportService(c.env as any);
    const result = await reportService.bulkDelete(tenantId, userId, ids);
    
    return c.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error bulk deleting reports:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi xóa hàng loạt báo cáo'
    }, 500);
  }
});

// POST /reports/bulk/update - Bulk update reports
reportsRouter.post('/bulk/update', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    
    const body = await c.req.json();
    const { ids, data } = z.object({ 
      ids: z.array(z.string()),
      data: UpdateReportSchema
    }).parse(body);
    
    const reportService = new ReportService(c.env as any);
    const result = await reportService.bulkUpdate(tenantId, userId, ids, data);
    
    return c.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error bulk updating reports:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi cập nhật hàng loạt báo cáo'
    }, 500);
  }
});

// GET /reports/:id/comments - Get report comments
reportsRouter.get('/:id/comments', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const reportId = c.req.param('id');
    
    const reportService = new ReportService(c.env as any);
    const result = await reportService.getComments(tenantId, userId, reportId);
    
    return c.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error fetching report comments:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi tải comment báo cáo'
    }, 500);
  }
});

// POST /reports/:id/comments - Add comment to report
reportsRouter.post('/:id/comments', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const reportId = c.req.param('id');
    
    const body = await c.req.json();
    const comment = CommentSchema.parse(body);
    
    const reportService = new ReportService(c.env as any);
    const result = await reportService.addComment(tenantId, userId, reportId, comment.content || '');
    
    if (!result.success) {
      return c.json({
        success: false,
        error: result.error
      }, 400);
    }
    
    return c.json({
      success: true,
      data: result.data
    }, 201);
  } catch (error: any) {
    console.error('Error adding comment to report:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi thêm comment báo cáo'
    }, 500);
  }
});

// GET /reports/dashboard - Get report dashboard
reportsRouter.get('/dashboard', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    
    const reportService = new ReportService(c.env as any);
    const result = await reportService.getDashboard(tenantId, userId);
    
    return c.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error fetching report dashboard:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi tải dashboard báo cáo'
    }, 500);
  }
});

export default reportsRouter;