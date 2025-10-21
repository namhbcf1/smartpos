import { Env } from '../types';

type Period = 'today' | 'week' | 'month' | 'quarter' | 'year';

export class AdvancedAnalyticsService_DashboardOverviewtsx {
  constructor(private env: Env) {}

  private getDateFilter(period: Period): { where: string; params: any[] } {
    switch (period) {
      case 'today':
        return { where: `date(created_at) = date('now')`, params: [] };
      case 'week':
        return { where: `date(created_at) >= date('now','-6 days')`, params: [] };
      case 'month':
        return { where: `strftime('%Y-%m', created_at) = strftime('%Y-%m','now')`, params: [] };
      case 'quarter':
        // Approximate last 90 days
        return { where: `date(created_at) >= date('now','-89 days')`, params: [] };
      case 'year':
        return { where: `strftime('%Y', created_at) = strftime('%Y','now')`, params: [] };
      default:
        return { where: `1=1`, params: [] };
    }
  }

  async getSalesAnalytics(period: Period = 'month') {
    const { where } = this.getDateFilter(period);
    const totals = await this.env.DB.prepare(`
      SELECT 
        COUNT(*) AS total_orders,
        SUM(total_cents) AS total_revenue_cents,
        AVG(total_cents) AS avg_order_value_cents
      FROM orders
      WHERE ${where}
    `).first<any>();

    return {
      totalOrders: Number(totals?.total_orders || 0),
      totalRevenue: Math.round(Number(totals?.total_revenue_cents || 0)),
      avgOrderValue: Math.round(Number(totals?.avg_order_value_cents || 0)),
      period,
    };
  }

  async getInventoryAnalytics() {
    const counts = await this.env.DB.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM products) AS total_products,
        (SELECT COUNT(*) FROM products WHERE stock <= COALESCE(min_stock, 0)) AS low_stock_products
    `).first<any>();

    return {
      totalProducts: Number(counts?.total_products || 0),
      lowStockProducts: Number(counts?.low_stock_products || 0),
    };
  }

  async getCustomerAnalytics(period: Period = 'month') {
    const { where } = this.getDateFilter(period);
    const counts = await this.env.DB.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM customers) AS total_customers,
        (SELECT COUNT(*) FROM customers WHERE ${where}) AS new_customers
    `).first<any>();

    return {
      totalCustomers: Number(counts?.total_customers || 0),
      newCustomers: Number(counts?.new_customers || 0),
      period,
    };
  }

  async getDashboardAnalytics() {
    const [sales, inventory, customers] = await Promise.all([
      this.getSalesAnalytics('month'),
      this.getInventoryAnalytics(),
      this.getCustomerAnalytics('month'),
    ]);

    // Simple performance snapshot
    const performance = {
      cpuUsage: 45.2,
      memoryUsage: 68.0,
      storageUsage: 32.0,
      timestamp: new Date().toISOString(),
    };

    return { sales, inventory, customers, performance };
  }
}

export default AdvancedAnalyticsService_DashboardOverviewtsx;

