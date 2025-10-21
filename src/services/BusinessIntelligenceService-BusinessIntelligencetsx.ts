import { Env } from '../types';

export class BusinessIntelligenceService_BusinessIntelligencetsx {
  constructor(private env: Env) {}

  async getKpis() {
    const revenue = await this.env.DB.prepare(`SELECT SUM(total_cents) as total FROM orders`).first<any>();
    const customers = await this.env.DB.prepare(`SELECT COUNT(*) as total FROM customers`).first<any>();
    const products = await this.env.DB.prepare(`SELECT COUNT(*) as total FROM products`).first<any>();
    return {
      totalRevenueCents: Number(revenue?.total || 0),
      totalCustomers: Number(customers?.total || 0),
      totalProducts: Number(products?.total || 0),
    };
  }

  async topProducts(limit: number = 10) {
    const res = await this.env.DB.prepare(`
      SELECT p.id, p.name, p.sku, SUM(oi.quantity) as qty, SUM(oi.total_price_cents) as revenue_cents
      FROM order_items oi JOIN products p ON p.id = oi.product_id
      GROUP BY p.id, p.name, p.sku
      ORDER BY revenue_cents DESC
      LIMIT ?
    `).bind(limit).all<any>();
    return res.results || [];
  }

  async salesTrend(days: number = 14) {
    const res = await this.env.DB.prepare(`
      SELECT date(created_at) as day, COUNT(*) as orders, SUM(total_cents) as revenue_cents
      FROM orders WHERE date(created_at) >= date('now', ?)
      GROUP BY day ORDER BY day ASC
    `).bind(`-${days - 1} days`).all<any>();
    return res.results || [];
  }
}

export default BusinessIntelligenceService_BusinessIntelligencetsx;

