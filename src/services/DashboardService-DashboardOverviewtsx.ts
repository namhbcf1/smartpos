import { BaseService } from './BaseService';
import { AlertsService_AlertsManagementtsx } from './AlertsService-AlertsManagementtsx';

export interface DashboardMetric {
  id: string;
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: string;
  color: string;
  trend?: number[];
  unit?: string;
  format?: 'currency' | 'number' | 'percentage';
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'list' | 'alert' | 'gauge' | 'progress';
  title: string;
  description?: string;
  data: any;
  position: { x: number; y: number; w: number; h: number };
  config: {
    chartType?: 'line' | 'bar' | 'pie' | 'area' | 'doughnut';
    colors?: string[];
    showLegend?: boolean;
    showGrid?: boolean;
    responsive?: boolean;
  };
  refreshInterval?: number;
  lastUpdated?: string;
}

export interface DashboardActivity {
  id: string;
  type: 'order' | 'payment' | 'inventory' | 'customer' | 'system' | 'user';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
  user?: string;
  metadata?: Record<string, any>;
}

export interface DashboardAlert {
  id: string;
  title: string;
  message: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  type: 'system' | 'business' | 'security';
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
  actions?: Array<{
    label: string;
    action: string;
    color?: string;
  }>;
}

export interface DashboardConfig {
  layout: 'grid' | 'list' | 'custom';
  theme: 'light' | 'dark' | 'auto';
  refreshInterval: number;
  widgets: DashboardWidget[];
  permissions: {
    canEdit: boolean;
    canAdd: boolean;
    canDelete: boolean;
    canShare: boolean;
  };
}

export class DashboardService_DashboardOverviewtsx extends BaseService {
  constructor(env?: any) {
    super(env, 'dashboard', 'id');
  }

  async getOverview(tenantId: string, userId: string, period: string = 'today') {
    try {
      const metrics = await this.getMetrics(tenantId, userId, []);
      const activities = await this.getActivities(tenantId, userId, 10);
      const alerts = await this.getAlerts(tenantId, userId, { isRead: false });
      const health = await this.getSystemHealth();
      return {
        metrics: (metrics as any).data || [],
        activities: (activities as any).data || [],
        alerts: (alerts as any).data || [],
        health,
        period,
        lastUpdated: new Date().toISOString()
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi tải tổng quan dashboard' };
    }
  }

  async getMetrics(tenantId: string, userId: string, metricIds: string[] = []) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      // Revenue today from orders
      const revenueToday = await (this as any).env.DB.prepare(`
        SELECT COALESCE(SUM(total_amount), 0) as total FROM orders
        WHERE tenant_id = ? AND DATE(created_at) = ?
      `).bind(tenantId, today).first();
      const revenueYesterday = await (this as any).env.DB.prepare(`
        SELECT COALESCE(SUM(total_amount), 0) as total FROM orders
        WHERE tenant_id = ? AND DATE(created_at) = ?
      `).bind(tenantId, yesterday).first();
      const revChange = revenueYesterday?.total > 0
        ? ((revenueToday?.total - revenueYesterday?.total) / revenueYesterday?.total) * 100
        : 0;

      // Orders today
      const ordersToday = await (this as any).env.DB.prepare(`
        SELECT COUNT(*) as count FROM orders
        WHERE tenant_id = ? AND DATE(created_at) = ?
      `).bind(tenantId, today).first();
      const ordersYesterday = await (this as any).env.DB.prepare(`
        SELECT COUNT(*) as count FROM orders
        WHERE tenant_id = ? AND DATE(created_at) = ?
      `).bind(tenantId, yesterday).first();
      const ordersChange = ordersYesterday?.count > 0
        ? ((ordersToday?.count - ordersYesterday?.count) / ordersYesterday?.count) * 100
        : 0;

      // New customers today
      const customersToday = await (this as any).env.DB.prepare(`
        SELECT COUNT(*) as count FROM customers
        WHERE tenant_id = ? AND DATE(created_at) = ?
      `).bind(tenantId, today).first();
      const customersYesterday = await (this as any).env.DB.prepare(`
        SELECT COUNT(*) as count FROM customers
        WHERE tenant_id = ? AND DATE(created_at) = ?
      `).bind(tenantId, yesterday).first();
      const customersChange = customersYesterday?.count > 0
        ? ((customersToday?.count - customersYesterday?.count) / customersYesterday?.count) * 100
        : 0;

      // Low stock products
      const lowStock = await (this as any).env.DB.prepare(`
        SELECT COUNT(*) as count FROM products
        WHERE tenant_id = ? AND stock <= min_stock
      `).bind(tenantId).first();

      const metrics: DashboardMetric[] = [
        {
          id: 'revenue_today',
          title: 'Doanh thu hôm nay',
          value: Math.round(revenueToday?.total || 0),
          change: Math.round(revChange * 10) / 10,
          changeType: revChange > 0 ? 'increase' : revChange < 0 ? 'decrease' : 'neutral',
          icon: 'AttachMoney',
          color: '#2e7d32',
          unit: 'VND',
          format: 'currency'
        },
        {
          id: 'orders_today',
          title: 'Đơn hàng hôm nay',
          value: ordersToday?.count || 0,
          change: Math.round(ordersChange * 10) / 10,
          changeType: ordersChange > 0 ? 'increase' : ordersChange < 0 ? 'decrease' : 'neutral',
          icon: 'ShoppingCart',
          color: '#1976d2',
          unit: 'đơn',
          format: 'number'
        },
        {
          id: 'customers_today',
          title: 'Khách hàng mới',
          value: customersToday?.count || 0,
          change: Math.round(customersChange * 10) / 10,
          changeType: customersChange > 0 ? 'increase' : customersChange < 0 ? 'decrease' : 'neutral',
          icon: 'People',
          color: '#9c27b0',
          unit: 'người',
          format: 'number'
        },
        {
          id: 'low_stock',
          title: 'Sản phẩm sắp hết',
          value: lowStock?.count || 0,
          change: 0,
          changeType: 'neutral',
          icon: 'Inventory',
          color: '#ff9800',
          unit: 'sản phẩm',
          format: 'number'
        }
      ];

      const filtered = metricIds.length ? metrics.filter(m => metricIds.includes(m.id)) : metrics;
      return { success: true, data: filtered };
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi tải metrics dashboard' };
    }
  }

  async getWidgets(tenantId: string, userId: string) {
    try {
      const query = `
        SELECT * FROM dashboard_widgets 
        WHERE tenant_id = ? AND (user_id = ? OR is_public = 1)
        ORDER BY position_y, position_x
      `;
      const result = await (this as any).env.DB.prepare(query).bind(tenantId, userId).all();
      const widgets = (result.results || []).map((widget: any) => ({
        ...widget,
        data: JSON.parse(widget.data || '{}'),
        position: JSON.parse(widget.position || '{"x":0,"y":0,"w":4,"h":3}'),
        config: JSON.parse(widget.config || '{}')
      }));
      return { success: true, data: widgets };
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi tải widgets dashboard' };
    }
  }

  async getWidgetData(tenantId: string, userId: string, widgetId: string, params: Record<string, any> = {}) {
    try {
      const widgetResult = await (this as any).env.DB.prepare(`
        SELECT * FROM dashboard_widgets 
        WHERE id = ? AND tenant_id = ? AND (user_id = ? OR is_public = 1)
      `).bind(widgetId, tenantId, userId).first();
      if (!widgetResult) return { success: false, error: 'Không tìm thấy widget' };
      const widget = { ...widgetResult, data: JSON.parse(widgetResult.data || '{}'), config: JSON.parse(widgetResult.config || '{}') };
      let data: any = {};
      switch (widget.type) {
        case 'chart':
          data = { labels: ['T2','T3','T4','T5','T6','T7','CN'], datasets: [{ label: 'Doanh thu', data: [12000,19000,3000,5000,2000,3000,15000] }] };
          break;
        case 'metric':
          data = { value: Math.floor(Math.random()*1000000), change: (Math.random()-0.5)*20 };
          break;
        case 'table':
          data = { columns: ['Tên','Giá','Số lượng','Tổng'], rows: [['iPhone 15 Pro','25,000,000','2','50,000,000']] };
          break;
        case 'list':
          data = { items: [{ id:'1', title:'Đơn hàng mới', description:'Khách hàng A đặt hàng', timestamp:new Date().toISOString() }] };
          break;
      }
      await (this as any).env.DB.prepare(`UPDATE dashboard_widgets SET last_updated = ? WHERE id = ?`).bind(new Date().toISOString(), widgetId).run();
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi tải dữ liệu widget' };
    }
  }

  async getActivities(tenantId: string, userId: string, limit: number = 10, type?: string) {
    try {
      const items: DashboardActivity[] = [
        { id:'1', type:'order', title:'Đơn hàng mới #ORD-001', description:'Khách hàng A đặt hàng', timestamp:new Date().toISOString(), status:'success', user:'admin' }
      ];
      const filtered = type ? items.filter(a => a.type === type) : items;
      return { success: true, data: filtered.slice(0, limit) };
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi tải hoạt động dashboard' };
    }
  }

  async getAlerts(tenantId: string, userId: string, filters: { severity?: string; isRead?: boolean } = {}) {
    try {
      const alertsService = new AlertsService_AlertsManagementtsx((this as any).env as any);
      const res = await alertsService.getAlertsDashboard(tenantId || 'default');
      const list: DashboardAlert[] = [];
      const lowStock = (res.dashboard?.low_stock_products || []) as any[];
      for (const p of lowStock) {
        const stockLevel = p.stock || 0;
        const isOutOfStock = stockLevel === 0;
        list.push({ id:`low_${p.id}`, title: isOutOfStock ? 'Hết hàng' : 'Sắp hết hàng', message: isOutOfStock ? `${p.name} đã hết hàng (min: ${p.min_stock})` : `${p.name} chỉ còn ${p.stock} sản phẩm (min: ${p.min_stock})`, severity: isOutOfStock ? 'error' : 'warning', type:'business', isRead:false, createdAt:new Date().toISOString() });
      }
      let filtered = list;
      if (filters.severity) filtered = filtered.filter(a => a.severity === filters.severity);
      if (filters.isRead !== undefined) filtered = filtered.filter(a => a.isRead === filters.isRead);
      return { success: true, data: filtered };
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi tải cảnh báo dashboard' };
    }
  }

  async getConfig(tenantId: string, userId: string) {
    try {
      const result = await (this as any).env.DB.prepare(`SELECT * FROM dashboard_configs WHERE tenant_id = ? AND user_id = ?`).bind(tenantId, userId).first();
      if (result) {
        return { ...result, widgets: JSON.parse(result.widgets || '[]'), permissions: JSON.parse(result.permissions || '{}') };
      }
      return { layout:'grid', theme:'auto', refreshInterval:30000, widgets:[], permissions:{ canEdit:true, canAdd:true, canDelete:true, canShare:false } };
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi tải cấu hình dashboard' };
    }
  }

  async updateConfig(tenantId: string, userId: string, config: any) {
    try {
      const now = new Date().toISOString();
      const configData = { tenant_id: tenantId, user_id: userId, layout: config.layout || 'grid', theme: config.theme || 'auto', refresh_interval: config.refreshInterval || 30000, widgets: JSON.stringify(config.widgets || []), permissions: JSON.stringify(config.permissions || {}), updated_at: now };
      const existing = await (this as any).env.DB.prepare(`SELECT id FROM dashboard_configs WHERE tenant_id = ? AND user_id = ?`).bind(tenantId, userId).first();
      if (existing) {
        await (this as any).env.DB.prepare(`UPDATE dashboard_configs SET layout = ?, theme = ?, refresh_interval = ?, widgets = ?, permissions = ?, updated_at = ? WHERE tenant_id = ? AND user_id = ?`).bind(configData.layout, configData.theme, configData.refresh_interval, configData.widgets, configData.permissions, configData.updated_at, tenantId, userId).run();
      } else {
        const id = crypto.randomUUID();
        await (this as any).env.DB.prepare(`INSERT INTO dashboard_configs (id, tenant_id, user_id, layout, theme, refresh_interval, widgets, permissions, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, configData.tenant_id, configData.user_id, configData.layout, configData.theme, configData.refresh_interval, configData.widgets, configData.permissions, now, configData.updated_at).run();
      }
      return { success: true, data: configData };
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi cập nhật cấu hình dashboard' };
    }
  }

  async getAnalytics(tenantId: string, userId: string, period: string = 'week') {
    try {
      return { totalViews: 1250, uniqueUsers: 45, avgSessionTime: 8.5, popularWidgets: ['revenue_chart','orders_table','customers_list'], lastActivity: new Date().toISOString(), period };
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi tải phân tích dashboard' };
    }
  }

  async exportDashboard(tenantId: string, userId: string, format: 'pdf' | 'excel' | 'csv') {
    try {
      const content = format === 'csv' ? 'Metric,Value,Change\nRevenue,12450000,15.2\nOrders,24,8.5' : format === 'excel' ? 'Mock Excel content' : 'Mock PDF content';
      const mimeType = format === 'csv' ? 'text/csv' : format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf';
      return { success: true, data: content, mimeType };
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi xuất dashboard' };
    }
  }

  async addComment(tenantId: string, userId: string, comment: any) {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await (this as any).env.DB.prepare(`INSERT INTO dashboard_comments (id, tenant_id, user_id, widget_id, content, is_internal, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(id, tenantId, userId, comment.widgetId || null, comment.content, !!comment.isInternal, now).run();
      return { success: true, data: { id } };
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi thêm comment dashboard' };
    }
  }

  async getComments(tenantId: string, userId: string, widgetId?: string) {
    try {
      let query = `SELECT * FROM dashboard_comments WHERE tenant_id = ?`;
      const params: any[] = [tenantId];
      if (widgetId) { query += ` AND widget_id = ?`; params.push(widgetId); }
      query += ` ORDER BY created_at DESC`;
      const result = await (this as any).env.DB.prepare(query).bind(...params).all();
      return { success: true, data: result.results || [] };
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi tải comment dashboard' };
    }
  }

  async submitFeedback(tenantId: string, userId: string, feedback: any) {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await (this as any).env.DB.prepare(`INSERT INTO dashboard_feedback (id, tenant_id, user_id, rating, comment, category, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(id, tenantId, userId, feedback.rating, feedback.comment, feedback.category, now).run();
      return { success: true, message: 'Cảm ơn bạn đã gửi phản hồi!' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi gửi phản hồi dashboard' };
    }
  }

  async getSystemHealth() {
    try {
      return {
        status: 'healthy',
        cpu_usage: 45.2,
        memory_usage: 68.0,
        storage_usage: 32.0,
        lastChecked: new Date().toISOString()
      } as any;
    } catch (error: any) {
      return { status: 'error', error: error.message || 'Lỗi khi kiểm tra sức khỏe hệ thống' } as any;
    }
  }

  async createWidget(tenantId: string, userId: string, widget: any): Promise<{ success: boolean; id?: string; data?: { id: string }; error?: string }> {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await (this as any).env.DB.prepare(`
        INSERT INTO dashboard_widgets (id, tenant_id, user_id, title, type, config_json, position, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(id, tenantId, userId, widget.title, widget.type, JSON.stringify(widget.config || {}), widget.position || 0, now, now).run();
      return { success: true, id, data: { id } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateWidget(tenantId: string, userId: string, id: string, data: any): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
    try {
      const now = new Date().toISOString();
      await (this as any).env.DB.prepare(`
        UPDATE dashboard_widgets
        SET title = ?, config_json = ?, position = ?, updated_at = ?
        WHERE id = ? AND tenant_id = ?
      `).bind(data.title, JSON.stringify(data.config || {}), data.position, now, id, tenantId).run();
      return { success: true, data: { id } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteWidget(tenantId: string, userId: string, id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await (this as any).env.DB.prepare(`
        DELETE FROM dashboard_widgets WHERE id = ? AND tenant_id = ?
      `).bind(id, tenantId).run();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async refreshWidget(tenantId: string, userId: string, id: string): Promise<{ success: boolean; widget?: any; error?: string }> {
    try {
      const widget = await (this as any).env.DB.prepare(`
        SELECT * FROM dashboard_widgets WHERE id = ? AND tenant_id = ?
      `).bind(id, tenantId).first();

      if (!widget) {
        return { success: false, error: 'Widget not found' };
      }

      return { success: true, widget };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async markAlertAsRead(tenantId: string, userId: string, id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const now = new Date().toISOString();
      await (this as any).env.DB.prepare(`
        UPDATE alerts SET is_read = 1, read_at = ? WHERE id = ? AND tenant_id = ?
      `).bind(now, id, tenantId).run();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async dismissAlert(tenantId: string, userId: string, id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await (this as any).env.DB.prepare(`
        DELETE FROM alerts WHERE id = ? AND tenant_id = ?
      `).bind(id, tenantId).run();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export default DashboardService_DashboardOverviewtsx;

