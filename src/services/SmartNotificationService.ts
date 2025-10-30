import { D1Database } from '@cloudflare/workers-types';

export interface NotificationRule {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'order_shipped' | 'order_delivered' | 'payment_received' | 'high_value_order' | 'churn_risk' | 'birthday';
  enabled: boolean;
  threshold?: number;
  recipients: string[];
  template: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  relatedEntity?: { type: string; id: string };
  createdAt: string;
  read: boolean;
}

export class SmartNotificationService {
  constructor(private db: D1Database) {}

  async checkLowStockAlerts(tenantId: string = 'default'): Promise<Notification[]> {
    const lowStockProducts = await this.db.prepare(`
      SELECT p.id, p.name, p.sku, p.low_stock_threshold,
             COALESCE(SUM(i.quantity), 0) as total_stock
      FROM products p
      LEFT JOIN inventory i ON i.product_id = p.id AND i.tenant_id = p.tenant_id
      WHERE p.tenant_id = ? AND p.is_active = 1 AND p.low_stock_threshold > 0
      GROUP BY p.id
      HAVING total_stock <= p.low_stock_threshold
    `).bind(tenantId).all();

    const notifications: Notification[] = [];
    for (const product of lowStockProducts.results as any[]) {
      notifications.push({
        id: crypto.randomUUID(),
        type: product.total_stock === 0 ? 'out_of_stock' : 'low_stock',
        title: product.total_stock === 0 ? 'Out of Stock' : 'Low Stock Alert',
        message: `Product "${product.name}" (${product.sku}) has ${product.total_stock} units remaining (threshold: ${product.low_stock_threshold})`,
        severity: product.total_stock === 0 ? 'error' : 'warning',
        relatedEntity: { type: 'product', id: product.id },
        createdAt: new Date().toISOString(),
        read: false
      });
    }

    return notifications;
  }

  async checkHighValueOrders(tenantId: string = 'default', threshold: number = 10000000): Promise<Notification[]> {
    const highValueOrders = await this.db.prepare(`
      SELECT o.id, o.order_number, o.total_cents, c.name as customer_name
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
      WHERE o.tenant_id = ? AND o.created_at >= datetime('now', '-1 hour')
        AND o.total_cents >= ?
    `).bind(tenantId, threshold).all();

    return (highValueOrders.results as any[]).map(order => ({
      id: crypto.randomUUID(),
      type: 'high_value_order',
      title: 'High Value Order',
      message: `Order #${order.order_number} from ${order.customer_name}: ${(order.total_cents / 100).toLocaleString('vi-VN')} VND`,
      severity: 'success' as const,
      relatedEntity: { type: 'order', id: order.id },
      createdAt: new Date().toISOString(),
      read: false
    }));
  }

  async checkBirthdayReminders(tenantId: string = 'default'): Promise<Notification[]> {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    const birthdayCustomers = await this.db.prepare(`
      SELECT id, name, email, phone
      FROM customers
      WHERE tenant_id = ? AND is_active = 1
        AND CAST(strftime('%m', date_of_birth) AS INTEGER) = ?
        AND CAST(strftime('%d', date_of_birth) AS INTEGER) = ?
    `).bind(tenantId, month, day).all();

    return (birthdayCustomers.results as any[]).map(customer => ({
      id: crypto.randomUUID(),
      type: 'birthday',
      title: 'Birthday Today',
      message: `Customer ${customer.name} has a birthday today! Send them a special offer.`,
      severity: 'info' as const,
      relatedEntity: { type: 'customer', id: customer.id },
      createdAt: new Date().toISOString(),
      read: false
    }));
  }

  async checkChurnRiskCustomers(tenantId: string = 'default', daysSinceLastOrder: number = 90): Promise<Notification[]> {
    const atRiskCustomers = await this.db.prepare(`
      SELECT id, name, email, last_visit, total_spent_cents
      FROM customers
      WHERE tenant_id = ? AND is_active = 1
        AND last_visit IS NOT NULL
        AND JULIANDAY('now') - JULIANDAY(last_visit) > ?
        AND total_orders > 3
      ORDER BY total_spent_cents DESC
      LIMIT 10
    `).bind(tenantId, daysSinceLastOrder).all();

    return (atRiskCustomers.results as any[]).map(customer => ({
      id: crypto.randomUUID(),
      type: 'churn_risk',
      title: 'Churn Risk Alert',
      message: `High-value customer ${customer.name} hasn't ordered in ${Math.floor((Date.now() - new Date(customer.last_visit).getTime()) / (1000 * 60 * 60 * 24))} days. Consider a win-back campaign.`,
      severity: 'warning' as const,
      relatedEntity: { type: 'customer', id: customer.id },
      createdAt: new Date().toISOString(),
      read: false
    }));
  }

  async getAllAlerts(tenantId: string = 'default'): Promise<{
    lowStock: Notification[];
    highValueOrders: Notification[];
    birthdayReminders: Notification[];
    churnRisk: Notification[];
    total: number;
  }> {
    const [lowStock, highValueOrders, birthdayReminders, churnRisk] = await Promise.all([
      this.checkLowStockAlerts(tenantId),
      this.checkHighValueOrders(tenantId),
      this.checkBirthdayReminders(tenantId),
      this.checkChurnRiskCustomers(tenantId)
    ]);

    return {
      lowStock,
      highValueOrders,
      birthdayReminders,
      churnRisk,
      total: lowStock.length + highValueOrders.length + birthdayReminders.length + churnRisk.length
    };
  }
}
