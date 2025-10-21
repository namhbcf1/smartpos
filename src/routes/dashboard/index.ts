import { Hono } from 'hono';
import { z } from 'zod';
import { DashboardService_DashboardOverviewtsx } from '../../services/DashboardService-DashboardOverviewtsx';

const dashboardRouter = new Hono();

// Validation schemas
const DashboardWidgetSchema = z.object({
  type: z.enum(['chart', 'metric', 'table', 'list', 'alert', 'gauge', 'progress']),
  title: z.string().min(1, 'Tiêu đề widget là bắt buộc'),
  description: z.string().optional(),
  data: z.any().optional(),
  position: z.object({
    x: z.number().min(0),
    y: z.number().min(0),
    w: z.number().min(1),
    h: z.number().min(1)
  }),
  config: z.object({
    chartType: z.enum(['line', 'bar', 'pie', 'area', 'doughnut']).optional(),
    colors: z.array(z.string()).optional(),
    showLegend: z.boolean().optional(),
    showGrid: z.boolean().optional(),
    responsive: z.boolean().optional()
  }).optional(),
  refreshInterval: z.number().optional()
});

const DashboardConfigSchema = z.object({
  layout: z.enum(['grid', 'list', 'custom']).default('grid'),
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  refreshInterval: z.number().min(1000).default(30000),
  widgets: z.array(DashboardWidgetSchema).default([]),
  permissions: z.object({
    canEdit: z.boolean().default(true),
    canAdd: z.boolean().default(true),
    canDelete: z.boolean().default(true),
    canShare: z.boolean().default(false)
  }).optional()
});

const CommentSchema = z.object({
  content: z.string().min(1, 'Nội dung comment là bắt buộc'),
  widgetId: z.string().optional(),
  isInternal: z.boolean().default(false)
});

const FeedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(1, 'Bình luận là bắt buộc'),
  category: z.string().min(1, 'Danh mục là bắt buộc')
});

// GET /dashboard/overview - Get dashboard overview data
dashboardRouter.get('/overview', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId') || 'public';
    const period = c.req.query('period') || 'today';
    
    const dashboardService = new DashboardService_DashboardOverviewtsx(c.env);
    const result = await dashboardService.getOverview(tenantId, userId, period);
    
    return c.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error fetching dashboard overview:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi tải tổng quan dashboard'
    }, 500);
  }
});

// GET /dashboard/metrics - Get dashboard metrics
dashboardRouter.get('/metrics', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const metricIds = c.req.query('ids')?.split(',') || [];
    
    const dashboardService = new DashboardService_DashboardOverviewtsx(c.env);
    const result = await dashboardService.getMetrics(tenantId, userId, metricIds);
    
    return c.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error fetching dashboard metrics:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi tải metrics dashboard'
    }, 500);
  }
});

// GET /dashboard/widgets - Get dashboard widgets
dashboardRouter.get('/widgets', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    
    const dashboardService = new DashboardService_DashboardOverviewtsx(c.env);
    const result = await dashboardService.getWidgets(tenantId, userId);
    
    return c.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error fetching dashboard widgets:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi tải widgets dashboard'
    }, 500);
  }
});

// POST /dashboard/widgets - Create new widget
dashboardRouter.post('/widgets', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    
    const body = await c.req.json();
    const widget = DashboardWidgetSchema.parse(body);
    
    const dashboardService = new DashboardService_DashboardOverviewtsx(c.env);
    const result = await dashboardService.createWidget(tenantId, userId, widget);
    
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
    console.error('Error creating dashboard widget:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi tạo widget dashboard'
    }, 500);
  }
});

// PUT /dashboard/widgets/:id - Update widget
dashboardRouter.put('/widgets/:id', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const widgetId = c.req.param('id');
    
    const body = await c.req.json();
    const widget = DashboardWidgetSchema.partial().parse(body);
    
    const dashboardService = new DashboardService_DashboardOverviewtsx(c.env);
    const result = await dashboardService.updateWidget(tenantId, userId, widgetId, widget);
    
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
    console.error('Error updating dashboard widget:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi cập nhật widget dashboard'
    }, 500);
  }
});

// DELETE /dashboard/widgets/:id - Delete widget
dashboardRouter.delete('/widgets/:id', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const widgetId = c.req.param('id');
    
    const dashboardService = new DashboardService_DashboardOverviewtsx(c.env);
    const result = await dashboardService.deleteWidget(tenantId, userId, widgetId);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: result.error
      }, 400);
    }
    
    return c.json({
      success: true,
      message: 'Xóa widget thành công'
    });
  } catch (error: any) {
    console.error('Error deleting dashboard widget:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi xóa widget dashboard'
    }, 500);
  }
});

// GET /dashboard/widgets/:id/data - Get widget data
dashboardRouter.get('/widgets/:id/data', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const widgetId = c.req.param('id');
    const queryParams = c.req.query();
    const params = Object.fromEntries(Object.entries(queryParams));
    
    const dashboardService = new DashboardService_DashboardOverviewtsx(c.env);
    const result = await dashboardService.getWidgetData(tenantId, userId, widgetId, params);
    
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
    console.error('Error fetching widget data:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi tải dữ liệu widget'
    }, 500);
  }
});

// POST /dashboard/widgets/:id/refresh - Refresh widget data
dashboardRouter.post('/widgets/:id/refresh', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const widgetId = c.req.param('id');
    
    const dashboardService = new DashboardService_DashboardOverviewtsx(c.env);
    const result = await dashboardService.refreshWidget(tenantId, userId, widgetId);
    
    return c.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error refreshing widget:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi làm mới widget'
    }, 500);
  }
});

// GET /dashboard/activities - Get recent activities
dashboardRouter.get('/activities', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const limit = parseInt(c.req.query('limit') || '10');
    const type = c.req.query('type');
    
    const dashboardService = new DashboardService_DashboardOverviewtsx(c.env);
    const result = await dashboardService.getActivities(tenantId, userId, limit, type);
    
    return c.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error fetching dashboard activities:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi tải hoạt động dashboard'
    }, 500);
  }
});

// GET /dashboard/alerts - Get system alerts
dashboardRouter.get('/alerts', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const severity = c.req.query('severity');
    const isRead = c.req.query('isRead');
    
    const dashboardService = new DashboardService_DashboardOverviewtsx(c.env);
    const result = await dashboardService.getAlerts(tenantId, userId, {
      severity,
      isRead: isRead ? isRead === 'true' : undefined
    });
    
    return c.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error fetching dashboard alerts:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi tải cảnh báo dashboard'
    }, 500);
  }
});

// POST /dashboard/alerts/:id/read - Mark alert as read
dashboardRouter.post('/alerts/:id/read', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const alertId = c.req.param('id');
    
    const dashboardService = new DashboardService_DashboardOverviewtsx(c.env);
    const result = await dashboardService.markAlertAsRead(tenantId, userId, alertId);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: result.error
      }, 400);
    }
    
    return c.json({
      success: true,
      message: 'Đã đánh dấu cảnh báo là đã đọc'
    });
  } catch (error: any) {
    console.error('Error marking alert as read:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi đánh dấu cảnh báo'
    }, 500);
  }
});

// DELETE /dashboard/alerts/:id - Dismiss alert
dashboardRouter.delete('/alerts/:id', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const alertId = c.req.param('id');
    
  const dashboardService = new DashboardService_DashboardOverviewtsx(c.env);
    const result = await dashboardService.dismissAlert(tenantId, userId, alertId);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: result.error
      }, 400);
    }
    
    return c.json({
      success: true,
      message: 'Đã bỏ qua cảnh báo'
    });
  } catch (error: any) {
    console.error('Error dismissing alert:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi bỏ qua cảnh báo'
    }, 500);
  }
});

// GET /dashboard/config - Get dashboard configuration
dashboardRouter.get('/config', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    
  const dashboardService = new DashboardService_DashboardOverviewtsx(c.env);
    const result = await dashboardService.getConfig(tenantId, userId);
    
    return c.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error fetching dashboard config:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi tải cấu hình dashboard'
    }, 500);
  }
});

// PUT /dashboard/config - Update dashboard configuration
dashboardRouter.put('/config', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    
    const body = await c.req.json();
    const config = DashboardConfigSchema.parse(body);
    
  const dashboardService = new DashboardService_DashboardOverviewtsx(c.env);
    const result = await dashboardService.updateConfig(tenantId, userId, config);
    
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
    console.error('Error updating dashboard config:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi cập nhật cấu hình dashboard'
    }, 500);
  }
});

// GET /dashboard/analytics - Get dashboard analytics
dashboardRouter.get('/analytics', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const period = c.req.query('period') || 'week';
    
  const dashboardService = new DashboardService_DashboardOverviewtsx(c.env);
    const result = await dashboardService.getAnalytics(tenantId, userId, period);
    
    return c.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error fetching dashboard analytics:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi tải phân tích dashboard'
    }, 500);
  }
});

// GET /dashboard/export - Export dashboard data
dashboardRouter.get('/export', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const format = c.req.query('format') || 'pdf';
    
  const dashboardService = new DashboardService_DashboardOverviewtsx(c.env);
    const result = await dashboardService.exportDashboard(tenantId, userId, format as any);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: result.error
      }, 400);
    }
    
    const contentType = format === 'pdf' ? 'application/pdf' : 
                      format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                      'text/csv';
    
    return new Response(result.data, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="dashboard-export.${format}"`
      }
    });
  } catch (error: any) {
    console.error('Error exporting dashboard:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi xuất dashboard'
    }, 500);
  }
});

// POST /dashboard/comments - Add dashboard comment
dashboardRouter.post('/comments', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    
    const body = await c.req.json();
    const comment = CommentSchema.parse(body);
    
  const dashboardService = new DashboardService_DashboardOverviewtsx(c.env);
    const result = await dashboardService.addComment(tenantId, userId, comment);
    
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
    console.error('Error adding dashboard comment:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi thêm comment dashboard'
    }, 500);
  }
});

// GET /dashboard/comments - Get dashboard comments
dashboardRouter.get('/comments', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    const widgetId = c.req.query('widgetId');
    
    const dashboardService = new DashboardService_DashboardOverviewtsx(c.env);
    const result = await dashboardService.getComments(tenantId, userId, widgetId);
    
    return c.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error fetching dashboard comments:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi tải comment dashboard'
    }, 500);
  }
});

// POST /dashboard/feedback - Submit dashboard feedback
dashboardRouter.post('/feedback', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const userId = (c.get as any)('userId');
    
    const body = await c.req.json();
    const feedback = FeedbackSchema.parse(body);
    
    const dashboardService = new DashboardService_DashboardOverviewtsx(c.env);
    const result = await dashboardService.submitFeedback(tenantId, userId, feedback);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: result.error
      }, 400);
    }
    
    return c.json({
      success: true,
      message: 'Cảm ơn bạn đã gửi phản hồi!'
    });
  } catch (error: any) {
    console.error('Error submitting dashboard feedback:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi gửi phản hồi dashboard'
    }, 500);
  }
});

// GET /dashboard/health - Get system health status
dashboardRouter.get('/health', async (c) => {
  try {
    const dashboardService = new DashboardService_DashboardOverviewtsx(c.env);
    const result = await dashboardService.getSystemHealth();
    
    return c.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error fetching system health:', error);
    return c.json({
      success: false,
      error: error.message || 'Lỗi khi kiểm tra sức khỏe hệ thống'
    }, 500);
  }
});

export default dashboardRouter;