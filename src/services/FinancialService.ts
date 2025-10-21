import { Env } from '../types';

export class FinancialService {
  constructor(private env: Env) {}

  async getFinancialReport(tenantId: string, startDate: string, endDate: string) {
    return await this.getOverview(tenantId, startDate, endDate);
  }

  async getRevenueAnalytics(tenantId: string, startDate: string, endDate: string) {
    const result = await this.env.DB.prepare(`
      SELECT DATE(created_at) as date, COALESCE(SUM(total_cents), 0) as revenue
      FROM orders WHERE tenant_id = ? AND DATE(created_at) BETWEEN ? AND ?
      GROUP BY DATE(created_at) ORDER BY date ASC
    `).bind(tenantId, startDate, endDate).all();
    return { success: true, data: result.results || [] };
  }

  async getExpenses(tenantId: string, startDate: string, endDate: string) {
    const result = await this.env.DB.prepare(`
      SELECT * FROM expenses WHERE DATE(expense_date) BETWEEN ? AND ? ORDER BY expense_date DESC
    `).bind(startDate, endDate).all();
    return { success: true, data: result.results || [] };
  }

  async getOverview(tenantId: string, startDate: string, endDate: string) {
    const revenueResult = await this.env.DB.prepare(`
      SELECT COALESCE(SUM(total_cents), 0) as total_revenue, COUNT(*) as total_orders
      FROM orders WHERE tenant_id = ? AND DATE(created_at) BETWEEN ? AND ?
    `).bind(tenantId, startDate, endDate).first();

    const expensesResult = await this.env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total_expenses
      FROM expenses WHERE DATE(expense_date) BETWEEN ? AND ?
    `).bind(startDate, endDate).first();

    const totalRevenue = Number(revenueResult?.total_revenue || 0);
    const totalExpenses = Number(expensesResult?.total_expenses || 0);

    return {
      success: true,
      data: {
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        net_profit: totalRevenue - totalExpenses,
        total_orders: Number(revenueResult?.total_orders || 0)
      }
    };
  }
}
