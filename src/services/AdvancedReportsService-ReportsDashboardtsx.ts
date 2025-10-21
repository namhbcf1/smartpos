import { Env } from '../types';

export class AdvancedReportsService_ReportsDashboardtsx {
  constructor(private env: Env) {}

  async getTopProducts(limit: number = 10) {
    const res = await this.env.DB.prepare(`
      SELECT p.id, p.name, p.sku, SUM(oi.quantity) AS qty, SUM(oi.total_price_cents) AS revenue_cents
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      GROUP BY p.id, p.name, p.sku
      ORDER BY revenue_cents DESC
      LIMIT ?
    `).bind(limit).all<any>();
    return res.results || [];
  }

  async getRevenueByDay(days: number = 7) {
    const res = await this.env.DB.prepare(`
      SELECT date(o.created_at) AS day, SUM(o.total_cents) AS revenue_cents, COUNT(*) AS orders
      FROM orders o
      WHERE date(o.created_at) >= date('now', ?)
      GROUP BY day
      ORDER BY day ASC
    `).bind(`-${days - 1} days`).all<any>();
    return res.results || [];
  }
}

export default AdvancedReportsService_ReportsDashboardtsx;

