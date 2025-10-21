import { Env } from '../types';

export interface StockAlert {
  id: string;
  product_id: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'overstock';
  threshold_value: number;
  current_value: number;
  status: string;
  created_at: string;
  updated_at: string;
  product_name?: string;
  sku?: string;
}

export interface WarrantyAlert {
  id: string;
  warranty_id: string;
  alert_type: 'expiring' | 'expired';
  days_before_expiry: number;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
  product_name?: string;
  warranty_end_date?: string;
}

export interface CustomerNotification {
  id: string;
  customer_id: string;
  notification_type: 'order_update' | 'warranty_expiry' | 'promotion' | 'general';
  title: string;
  content: string;
  status: string;
  sent_at: string;
  created_at: string;
  customer_name?: string;
  customer_email?: string;
}

export class AlertsService_AlertsManagementtsx {
  constructor(private env: Env) {}

  async getStockAlerts(filters: { tenant_id: string; alert_type?: string; page: number; limit: number; }) {
    const { tenant_id, alert_type, page, limit } = filters;
    const offset = (page - 1) * limit;
    let query = `
      SELECT sa.*, p.name as product_name, p.sku
      FROM stock_alerts sa
      LEFT JOIN products p ON sa.product_id = p.id
      WHERE sa.status = 'active' AND p.tenant_id = ?
    `;
    const params: any[] = [tenant_id];
    if (alert_type) { query += ` AND sa.alert_type = ?`; params.push(alert_type); }
    query += ` ORDER BY sa.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    const result = await this.env.DB.prepare(query).bind(...params).all<any>();
    let countQuery = `
      SELECT COUNT(*) as total FROM stock_alerts sa
      LEFT JOIN products p ON sa.product_id = p.id
      WHERE sa.status = 'active' AND p.tenant_id = ?
    `;
    const countParams: any[] = [tenant_id];
    if (alert_type) { countQuery += ` AND sa.alert_type = ?`; countParams.push(alert_type); }
    const totalResult = await this.env.DB.prepare(countQuery).bind(...countParams).first<any>();
    return { success: true, alerts: result.results || [], pagination: { page, limit, total: Number(totalResult?.total || 0), pages: Math.ceil(Number(totalResult?.total || 0) / limit) } };
  }

  async createStockAlert(data: { tenant_id: string; product_id: string; alert_type: 'low_stock' | 'out_of_stock' | 'overstock'; threshold_value: number; current_value: number; }) {
    const alertId = crypto.randomUUID();
    await this.env.DB.prepare(`
      INSERT INTO stock_alerts (id, product_id, alert_type, threshold_value, current_value, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))
    `).bind(alertId, data.product_id, data.alert_type, data.threshold_value, data.current_value).run();
    const alert = await this.env.DB.prepare(`
      SELECT sa.*, p.name as product_name, p.sku
      FROM stock_alerts sa LEFT JOIN products p ON sa.product_id = p.id
      WHERE sa.id = ?
    `).bind(alertId).first<any>();
    return { success: true, alert };
  }

  async getAlertsDashboard(tenantId: string) {
    const stockStats = await this.env.DB.prepare(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN sa.alert_type = 'low_stock' THEN 1 ELSE 0 END) as low_stock,
             SUM(CASE WHEN sa.alert_type = 'out_of_stock' THEN 1 ELSE 0 END) as out_of_stock,
             SUM(CASE WHEN sa.alert_type = 'overstock' THEN 1 ELSE 0 END) as overstock
      FROM stock_alerts sa JOIN products p ON sa.product_id = p.id
      WHERE sa.status = 'active' AND p.tenant_id = ?
    `).bind(tenantId).first<any>();
    const warrantyStats = await this.env.DB.prepare(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN wa.alert_type = 'expiring' THEN 1 ELSE 0 END) as expiring,
             SUM(CASE WHEN wa.alert_type = 'expired' THEN 1 ELSE 0 END) as expired
      FROM warranty_alerts wa JOIN warranties w ON wa.warranty_id = w.id
      WHERE wa.status = 'active' AND w.tenant_id = ?
    `).bind(tenantId).first<any>();
    const notificationStats = await this.env.DB.prepare(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN cn.status = 'unread' THEN 1 ELSE 0 END) as unread
      FROM customer_notifications cn JOIN customers c ON cn.customer_id = c.id
      WHERE c.tenant_id = ?
    `).bind(tenantId).first<any>();
    const lowStockProducts = await this.env.DB.prepare(`
      SELECT p.id, p.name, p.sku, p.stock, p.min_stock
      FROM products p WHERE p.tenant_id = ? AND p.stock <= p.min_stock
      ORDER BY p.stock ASC LIMIT 5
    `).bind(tenantId).all<any>();
    const expiringWarranties = await this.env.DB.prepare(`
      SELECT w.id, p.name as product_name, w.end_date as warranty_end_date
      FROM warranties w LEFT JOIN products p ON w.product_id = p.id
      WHERE w.tenant_id = ? AND w.status = 'active' AND w.end_date <= DATE('now','+30 days')
      ORDER BY w.end_date ASC LIMIT 5
    `).bind(tenantId).all<any>();
    return { success: true, dashboard: { stock_alerts: stockStats, warranty_alerts: warrantyStats, notifications: notificationStats, low_stock_products: lowStockProducts.results || [], expiring_warranties: expiringWarranties.results || [] } };
  }
}

export default AlertsService_AlertsManagementtsx;

