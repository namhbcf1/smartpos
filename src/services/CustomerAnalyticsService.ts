import { D1Database } from '@cloudflare/workers-types';

export interface CLVMetrics {
  customerId: string;
  customerName: string;
  averageOrderValue: number;
  purchaseFrequency: number;
  customerLifespanDays: number;
  totalRevenue: number;
  clv: number;
  predictedClv: number;
  profitability: 'high' | 'medium' | 'low';
}

export interface CohortData {
  cohort: string;
  period: number;
  customers: number;
  retentionRate: number;
  revenue: number;
  churnRate: number;
}

export interface RevenueMetrics {
  date: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  newCustomers: number;
  returningCustomers: number;
}

export class CustomerAnalyticsService {
  constructor(private db: D1Database) {}

  async calculateCLV(tenantId: string = 'default'): Promise<CLVMetrics[]> {
    const query = `
      SELECT
        c.id,
        c.name,
        c.email,
        c.created_at,
        c.last_visit,
        c.total_orders,
        c.total_spent_cents,
        JULIANDAY(COALESCE(c.last_visit, 'now')) - JULIANDAY(c.created_at) as lifespan_days,
        COUNT(DISTINCT o.id) as actual_orders,
        SUM(o.total_cents) as actual_revenue,
        AVG(o.total_cents) as avg_order_value
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id AND o.tenant_id = c.tenant_id
      WHERE c.tenant_id = ? AND c.is_active = 1
      GROUP BY c.id
      HAVING actual_orders > 0
    `;

    const result = await this.db.prepare(query).bind(tenantId).all();
    const customers = result.results as any[];

    return customers.map(c => {
      const lifespanDays = Math.max(c.lifespan_days || 30, 30);
      const avgOrderValue = c.avg_order_value || 0;
      const totalOrders = c.actual_orders || 0;
      const purchaseFrequency = totalOrders / (lifespanDays / 365);
      const totalRevenue = c.actual_revenue || 0;

      const avgLifespan = 365 * 3;
      const clv = avgOrderValue * purchaseFrequency * avgLifespan;
      const predictedClv = clv * 1.15;

      let profitability: 'high' | 'medium' | 'low' = 'low';
      if (clv > 10000000) profitability = 'high';
      else if (clv > 3000000) profitability = 'medium';

      return {
        customerId: c.id,
        customerName: c.name,
        averageOrderValue: avgOrderValue,
        purchaseFrequency,
        customerLifespanDays: lifespanDays,
        totalRevenue,
        clv,
        predictedClv,
        profitability
      };
    });
  }

  async getCohortAnalysis(tenantId: string = 'default', months: number = 12): Promise<CohortData[]> {
    const query = `
      WITH cohorts AS (
        SELECT
          c.id as customer_id,
          DATE(c.created_at, 'start of month') as cohort_month,
          o.id as order_id,
          o.total_cents,
          o.created_at as order_date,
          CAST((JULIANDAY(DATE(o.created_at, 'start of month')) - JULIANDAY(DATE(c.created_at, 'start of month'))) / 30 AS INTEGER) as months_since_signup
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.id AND o.tenant_id = c.tenant_id
        WHERE c.tenant_id = ?
          AND c.created_at >= DATE('now', '-' || ? || ' months')
      )
      SELECT
        cohort_month as cohort,
        months_since_signup as period,
        COUNT(DISTINCT customer_id) as customers,
        SUM(total_cents) as revenue
      FROM cohorts
      WHERE months_since_signup IS NOT NULL
      GROUP BY cohort_month, months_since_signup
      ORDER BY cohort_month, months_since_signup
    `;

    const result = await this.db.prepare(query).bind(tenantId, months).all();
    const data = result.results as any[];

    const cohortMap = new Map<string, { period0: number }>();

    data.forEach(row => {
      if (row.period === 0) {
        cohortMap.set(row.cohort, { period0: row.customers });
      }
    });

    return data.map(row => {
      const cohortData = cohortMap.get(row.cohort);
      const period0Count = cohortData?.period0 || 1;
      const retentionRate = (row.customers / period0Count) * 100;
      const churnRate = 100 - retentionRate;

      return {
        cohort: row.cohort,
        period: row.period,
        customers: row.customers,
        retentionRate,
        revenue: row.revenue || 0,
        churnRate
      };
    });
  }

  async getRevenueMetrics(tenantId: string = 'default', days: number = 30): Promise<RevenueMetrics[]> {
    const query = `
      SELECT
        DATE(o.created_at) as date,
        SUM(o.total_cents) as revenue,
        COUNT(o.id) as orders,
        AVG(o.total_cents) as avg_order_value,
        COUNT(DISTINCT CASE
          WHEN c.created_at >= DATE(o.created_at, '-7 days')
          THEN o.customer_id
        END) as new_customers,
        COUNT(DISTINCT CASE
          WHEN c.created_at < DATE(o.created_at, '-7 days')
          THEN o.customer_id
        END) as returning_customers
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id AND c.tenant_id = o.tenant_id
      WHERE o.tenant_id = ?
        AND o.created_at >= DATE('now', '-' || ? || ' days')
        AND o.status != 'cancelled'
      GROUP BY DATE(o.created_at)
      ORDER BY date DESC
    `;

    const result = await this.db.prepare(query).bind(tenantId, days).all();

    return (result.results as any[]).map(row => ({
      date: row.date,
      revenue: row.revenue || 0,
      orders: row.orders || 0,
      averageOrderValue: row.avg_order_value || 0,
      newCustomers: row.new_customers || 0,
      returningCustomers: row.returning_customers || 0
    }));
  }

  async getTopCustomersByValue(tenantId: string = 'default', limit: number = 20): Promise<any[]> {
    const clvData = await this.calculateCLV(tenantId);
    return clvData
      .sort((a, b) => b.clv - a.clv)
      .slice(0, limit);
  }

  async getChurnPrediction(tenantId: string = 'default'): Promise<any[]> {
    const query = `
      SELECT
        c.id,
        c.name,
        c.email,
        c.last_visit,
        c.total_orders,
        c.total_spent_cents,
        JULIANDAY('now') - JULIANDAY(c.last_visit) as days_since_last_order
      FROM customers c
      WHERE c.tenant_id = ?
        AND c.is_active = 1
        AND c.total_orders > 0
        AND c.last_visit IS NOT NULL
      ORDER BY days_since_last_order DESC
    `;

    const result = await this.db.prepare(query).bind(tenantId).all();
    const customers = result.results as any[];

    return customers.map(c => {
      const daysSinceLast = c.days_since_last_order || 0;
      let churnRisk: 'high' | 'medium' | 'low' = 'low';
      let churnProbability = 0;

      if (daysSinceLast > 180) {
        churnRisk = 'high';
        churnProbability = 85;
      } else if (daysSinceLast > 90) {
        churnRisk = 'medium';
        churnProbability = 50;
      } else if (daysSinceLast > 60) {
        churnProbability = 25;
      }

      return {
        customerId: c.id,
        customerName: c.name,
        email: c.email,
        lastVisit: c.last_visit,
        daysSinceLastOrder: daysSinceLast,
        totalOrders: c.total_orders,
        totalSpent: c.total_spent_cents,
        churnRisk,
        churnProbability
      };
    });
  }
}
