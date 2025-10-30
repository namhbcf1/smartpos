import { D1Database } from '@cloudflare/workers-types';

export interface SalesByProduct {
  product_id: string;
  product_name: string;
  sku: string;
  category_name?: string;
  brand_name?: string;
  quantity_sold: number;
  total_revenue_cents: number;
  total_cost_cents: number;
  profit_cents: number;
  profit_margin_percent: number;
  order_count: number;
}

export interface SalesByCategory {
  category_id: string;
  category_name: string;
  product_count: number;
  quantity_sold: number;
  total_revenue_cents: number;
  total_cost_cents: number;
  profit_cents: number;
  profit_margin_percent: number;
  order_count: number;
}

export interface SalesByTime {
  period: string;
  order_count: number;
  total_revenue_cents: number;
  total_cost_cents: number;
  profit_cents: number;
  profit_margin_percent: number;
  average_order_value_cents: number;
  customer_count: number;
}

export interface ProfitMarginAnalysis {
  overall: {
    total_revenue_cents: number;
    total_cost_cents: number;
    gross_profit_cents: number;
    profit_margin_percent: number;
  };
  by_category: Array<{
    category_name: string;
    revenue_cents: number;
    cost_cents: number;
    profit_cents: number;
    margin_percent: number;
  }>;
  top_profitable_products: Array<{
    product_name: string;
    sku: string;
    profit_cents: number;
    margin_percent: number;
  }>;
  low_margin_products: Array<{
    product_name: string;
    sku: string;
    profit_cents: number;
    margin_percent: number;
  }>;
}

export interface TopPerformers {
  products: Array<{
    rank: number;
    product_id: string;
    product_name: string;
    sku: string;
    revenue_cents: number;
    quantity_sold: number;
    order_count: number;
  }>;
  categories: Array<{
    rank: number;
    category_name: string;
    revenue_cents: number;
    product_count: number;
    order_count: number;
  }>;
  customers: Array<{
    rank: number;
    customer_id: string;
    customer_name: string;
    total_spent_cents: number;
    order_count: number;
    avg_order_value_cents: number;
  }>;
}

export class AdvancedReportsService {
  constructor(private db: D1Database) {}

  async getSalesByProduct(
    tenantId: string = 'default',
    startDate?: string,
    endDate?: string,
    categoryId?: string
  ): Promise<SalesByProduct[]> {
    let query = `
      SELECT
        p.id as product_id,
        p.name as product_name,
        p.sku,
        c.name as category_name,
        b.name as brand_name,
        SUM(oi.quantity) as quantity_sold,
        SUM(oi.subtotal_cents) as total_revenue_cents,
        SUM(oi.quantity * COALESCE(p.cost_price_cents, 0)) as total_cost_cents,
        SUM(oi.subtotal_cents - (oi.quantity * COALESCE(p.cost_price_cents, 0))) as profit_cents,
        CASE
          WHEN SUM(oi.subtotal_cents) > 0
          THEN ROUND((SUM(oi.subtotal_cents - (oi.quantity * COALESCE(p.cost_price_cents, 0))) * 100.0 / SUM(oi.subtotal_cents)), 2)
          ELSE 0
        END as profit_margin_percent,
        COUNT(DISTINCT o.id) as order_count
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id AND o.tenant_id = oi.tenant_id
      INNER JOIN products p ON p.id = oi.product_id AND p.tenant_id = oi.tenant_id
      LEFT JOIN categories c ON c.id = p.category_id AND c.tenant_id = p.tenant_id
      LEFT JOIN brands b ON b.id = p.brand_id AND b.tenant_id = p.tenant_id
      WHERE oi.tenant_id = ? AND o.status NOT IN ('cancelled', 'refunded')
    `;

    const bindings: any[] = [tenantId];

    if (startDate) {
      query += ` AND o.created_at >= ?`;
      bindings.push(startDate);
    }

    if (endDate) {
      query += ` AND o.created_at <= ?`;
      bindings.push(endDate);
    }

    if (categoryId) {
      query += ` AND p.category_id = ?`;
      bindings.push(categoryId);
    }

    query += `
      GROUP BY p.id
      ORDER BY total_revenue_cents DESC
    `;

    const result = await this.db.prepare(query).bind(...bindings).all();
    return result.results as SalesByProduct[];
  }

  async getSalesByCategory(
    tenantId: string = 'default',
    startDate?: string,
    endDate?: string
  ): Promise<SalesByCategory[]> {
    let query = `
      SELECT
        c.id as category_id,
        c.name as category_name,
        COUNT(DISTINCT p.id) as product_count,
        SUM(oi.quantity) as quantity_sold,
        SUM(oi.subtotal_cents) as total_revenue_cents,
        SUM(oi.quantity * COALESCE(p.cost_price_cents, 0)) as total_cost_cents,
        SUM(oi.subtotal_cents - (oi.quantity * COALESCE(p.cost_price_cents, 0))) as profit_cents,
        CASE
          WHEN SUM(oi.subtotal_cents) > 0
          THEN ROUND((SUM(oi.subtotal_cents - (oi.quantity * COALESCE(p.cost_price_cents, 0))) * 100.0 / SUM(oi.subtotal_cents)), 2)
          ELSE 0
        END as profit_margin_percent,
        COUNT(DISTINCT o.id) as order_count
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id AND o.tenant_id = oi.tenant_id
      INNER JOIN products p ON p.id = oi.product_id AND p.tenant_id = oi.tenant_id
      LEFT JOIN categories c ON c.id = p.category_id AND c.tenant_id = p.tenant_id
      WHERE oi.tenant_id = ? AND o.status NOT IN ('cancelled', 'refunded')
    `;

    const bindings: any[] = [tenantId];

    if (startDate) {
      query += ` AND o.created_at >= ?`;
      bindings.push(startDate);
    }

    if (endDate) {
      query += ` AND o.created_at <= ?`;
      bindings.push(endDate);
    }

    query += `
      GROUP BY c.id
      ORDER BY total_revenue_cents DESC
    `;

    const result = await this.db.prepare(query).bind(...bindings).all();
    return result.results as SalesByCategory[];
  }

  async getSalesByTime(
    tenantId: string = 'default',
    groupBy: 'day' | 'week' | 'month' | 'year' = 'day',
    startDate?: string,
    endDate?: string
  ): Promise<SalesByTime[]> {
    let dateFormat: string;
    switch (groupBy) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-W%W';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      case 'year':
        dateFormat = '%Y';
        break;
    }

    let query = `
      SELECT
        strftime('${dateFormat}', o.created_at) as period,
        COUNT(DISTINCT o.id) as order_count,
        SUM(o.total_cents) as total_revenue_cents,
        SUM(oi.quantity * COALESCE(p.cost_price_cents, 0)) as total_cost_cents,
        SUM(o.total_cents - (oi.quantity * COALESCE(p.cost_price_cents, 0))) as profit_cents,
        CASE
          WHEN SUM(o.total_cents) > 0
          THEN ROUND((SUM(o.total_cents - (oi.quantity * COALESCE(p.cost_price_cents, 0))) * 100.0 / SUM(o.total_cents)), 2)
          ELSE 0
        END as profit_margin_percent,
        ROUND(AVG(o.total_cents), 0) as average_order_value_cents,
        COUNT(DISTINCT o.customer_id) as customer_count
      FROM orders o
      INNER JOIN order_items oi ON oi.order_id = o.id AND oi.tenant_id = o.tenant_id
      INNER JOIN products p ON p.id = oi.product_id AND p.tenant_id = oi.tenant_id
      WHERE o.tenant_id = ? AND o.status NOT IN ('cancelled', 'refunded')
    `;

    const bindings: any[] = [tenantId];

    if (startDate) {
      query += ` AND o.created_at >= ?`;
      bindings.push(startDate);
    }

    if (endDate) {
      query += ` AND o.created_at <= ?`;
      bindings.push(endDate);
    }

    query += `
      GROUP BY period
      ORDER BY period ASC
    `;

    const result = await this.db.prepare(query).bind(...bindings).all();
    return result.results as SalesByTime[];
  }

  async getProfitMarginAnalysis(
    tenantId: string = 'default',
    startDate?: string,
    endDate?: string
  ): Promise<ProfitMarginAnalysis> {
    let dateFilter = '';
    const bindings: any[] = [tenantId];

    if (startDate || endDate) {
      if (startDate) {
        dateFilter += ` AND o.created_at >= ?`;
        bindings.push(startDate);
      }
      if (endDate) {
        dateFilter += ` AND o.created_at <= ?`;
        bindings.push(endDate);
      }
    }

    // Overall metrics
    const overallQuery = `
      SELECT
        SUM(o.total_cents) as total_revenue_cents,
        SUM(oi.quantity * COALESCE(p.cost_price_cents, 0)) as total_cost_cents,
        SUM(o.total_cents - (oi.quantity * COALESCE(p.cost_price_cents, 0))) as gross_profit_cents,
        CASE
          WHEN SUM(o.total_cents) > 0
          THEN ROUND((SUM(o.total_cents - (oi.quantity * COALESCE(p.cost_price_cents, 0))) * 100.0 / SUM(o.total_cents)), 2)
          ELSE 0
        END as profit_margin_percent
      FROM orders o
      INNER JOIN order_items oi ON oi.order_id = o.id AND oi.tenant_id = o.tenant_id
      INNER JOIN products p ON p.id = oi.product_id AND p.tenant_id = oi.tenant_id
      WHERE o.tenant_id = ? AND o.status NOT IN ('cancelled', 'refunded')${dateFilter}
    `;

    const overallResult = await this.db.prepare(overallQuery).bind(...bindings).first();

    // By category
    const categoryQuery = `
      SELECT
        COALESCE(c.name, 'Uncategorized') as category_name,
        SUM(oi.subtotal_cents) as revenue_cents,
        SUM(oi.quantity * COALESCE(p.cost_price_cents, 0)) as cost_cents,
        SUM(oi.subtotal_cents - (oi.quantity * COALESCE(p.cost_price_cents, 0))) as profit_cents,
        CASE
          WHEN SUM(oi.subtotal_cents) > 0
          THEN ROUND((SUM(oi.subtotal_cents - (oi.quantity * COALESCE(p.cost_price_cents, 0))) * 100.0 / SUM(oi.subtotal_cents)), 2)
          ELSE 0
        END as margin_percent
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id AND o.tenant_id = oi.tenant_id
      INNER JOIN products p ON p.id = oi.product_id AND p.tenant_id = oi.tenant_id
      LEFT JOIN categories c ON c.id = p.category_id AND c.tenant_id = p.tenant_id
      WHERE oi.tenant_id = ? AND o.status NOT IN ('cancelled', 'refunded')${dateFilter}
      GROUP BY c.id
      ORDER BY profit_cents DESC
    `;

    const categoryResult = await this.db.prepare(categoryQuery).bind(...bindings).all();

    // Top profitable products
    const topProfitableQuery = `
      SELECT
        p.name as product_name,
        p.sku,
        SUM(oi.subtotal_cents - (oi.quantity * COALESCE(p.cost_price_cents, 0))) as profit_cents,
        CASE
          WHEN SUM(oi.subtotal_cents) > 0
          THEN ROUND((SUM(oi.subtotal_cents - (oi.quantity * COALESCE(p.cost_price_cents, 0))) * 100.0 / SUM(oi.subtotal_cents)), 2)
          ELSE 0
        END as margin_percent
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id AND o.tenant_id = oi.tenant_id
      INNER JOIN products p ON p.id = oi.product_id AND p.tenant_id = oi.tenant_id
      WHERE oi.tenant_id = ? AND o.status NOT IN ('cancelled', 'refunded')${dateFilter}
      GROUP BY p.id
      ORDER BY profit_cents DESC
      LIMIT 10
    `;

    const topProfitableResult = await this.db.prepare(topProfitableQuery).bind(...bindings).all();

    // Low margin products (warning)
    const lowMarginQuery = `
      SELECT
        p.name as product_name,
        p.sku,
        SUM(oi.subtotal_cents - (oi.quantity * COALESCE(p.cost_price_cents, 0))) as profit_cents,
        CASE
          WHEN SUM(oi.subtotal_cents) > 0
          THEN ROUND((SUM(oi.subtotal_cents - (oi.quantity * COALESCE(p.cost_price_cents, 0))) * 100.0 / SUM(oi.subtotal_cents)), 2)
          ELSE 0
        END as margin_percent
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id AND o.tenant_id = oi.tenant_id
      INNER JOIN products p ON p.id = oi.product_id AND p.tenant_id = oi.tenant_id
      WHERE oi.tenant_id = ? AND o.status NOT IN ('cancelled', 'refunded')${dateFilter}
      GROUP BY p.id
      HAVING margin_percent < 20
      ORDER BY margin_percent ASC
      LIMIT 10
    `;

    const lowMarginResult = await this.db.prepare(lowMarginQuery).bind(...bindings).all();

    return {
      overall: overallResult as any,
      by_category: categoryResult.results as any[],
      top_profitable_products: topProfitableResult.results as any[],
      low_margin_products: lowMarginResult.results as any[]
    };
  }

  async getTopPerformers(
    tenantId: string = 'default',
    startDate?: string,
    endDate?: string,
    limit: number = 10
  ): Promise<TopPerformers> {
    let dateFilter = '';
    const bindings: any[] = [tenantId];

    if (startDate) {
      dateFilter += ` AND o.created_at >= ?`;
      bindings.push(startDate);
    }

    if (endDate) {
      dateFilter += ` AND o.created_at <= ?`;
      bindings.push(endDate);
    }

    // Top products by revenue
    const productsQuery = `
      SELECT
        ROW_NUMBER() OVER (ORDER BY SUM(oi.subtotal_cents) DESC) as rank,
        p.id as product_id,
        p.name as product_name,
        p.sku,
        SUM(oi.subtotal_cents) as revenue_cents,
        SUM(oi.quantity) as quantity_sold,
        COUNT(DISTINCT o.id) as order_count
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id AND o.tenant_id = oi.tenant_id
      INNER JOIN products p ON p.id = oi.product_id AND p.tenant_id = oi.tenant_id
      WHERE oi.tenant_id = ? AND o.status NOT IN ('cancelled', 'refunded')${dateFilter}
      GROUP BY p.id
      ORDER BY revenue_cents DESC
      LIMIT ?
    `;

    const productsResult = await this.db.prepare(productsQuery).bind(...bindings, limit).all();

    // Top categories by revenue
    const categoriesQuery = `
      SELECT
        ROW_NUMBER() OVER (ORDER BY SUM(oi.subtotal_cents) DESC) as rank,
        COALESCE(c.name, 'Uncategorized') as category_name,
        SUM(oi.subtotal_cents) as revenue_cents,
        COUNT(DISTINCT p.id) as product_count,
        COUNT(DISTINCT o.id) as order_count
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id AND o.tenant_id = oi.tenant_id
      INNER JOIN products p ON p.id = oi.product_id AND p.tenant_id = oi.tenant_id
      LEFT JOIN categories c ON c.id = p.category_id AND c.tenant_id = p.tenant_id
      WHERE oi.tenant_id = ? AND o.status NOT IN ('cancelled', 'refunded')${dateFilter}
      GROUP BY c.id
      ORDER BY revenue_cents DESC
      LIMIT ?
    `;

    const categoriesResult = await this.db.prepare(categoriesQuery).bind(...bindings, limit).all();

    // Top customers by spending
    const customersQuery = `
      SELECT
        ROW_NUMBER() OVER (ORDER BY SUM(o.total_cents) DESC) as rank,
        c.id as customer_id,
        c.name as customer_name,
        SUM(o.total_cents) as total_spent_cents,
        COUNT(o.id) as order_count,
        ROUND(AVG(o.total_cents), 0) as avg_order_value_cents
      FROM orders o
      INNER JOIN customers c ON c.id = o.customer_id AND c.tenant_id = o.tenant_id
      WHERE o.tenant_id = ? AND o.status NOT IN ('cancelled', 'refunded')${dateFilter}
      GROUP BY c.id
      ORDER BY total_spent_cents DESC
      LIMIT ?
    `;

    const customersResult = await this.db.prepare(customersQuery).bind(...bindings, limit).all();

    return {
      products: productsResult.results as any[],
      categories: categoriesResult.results as any[],
      customers: customersResult.results as any[]
    };
  }

  async getComparativeAnalysis(
    tenantId: string = 'default',
    period1Start: string,
    period1End: string,
    period2Start: string,
    period2End: string
  ): Promise<{
    period1: { revenue_cents: number; orders: number; profit_cents: number };
    period2: { revenue_cents: number; orders: number; profit_cents: number };
    growth: { revenue_percent: number; orders_percent: number; profit_percent: number };
  }> {
    const query = `
      SELECT
        SUM(o.total_cents) as revenue_cents,
        COUNT(o.id) as orders,
        SUM(o.total_cents - (oi.quantity * COALESCE(p.cost_price_cents, 0))) as profit_cents
      FROM orders o
      INNER JOIN order_items oi ON oi.order_id = o.id AND oi.tenant_id = o.tenant_id
      INNER JOIN products p ON p.id = oi.product_id AND p.tenant_id = oi.tenant_id
      WHERE o.tenant_id = ? AND o.status NOT IN ('cancelled', 'refunded')
        AND o.created_at >= ? AND o.created_at <= ?
    `;

    const period1Result = await this.db.prepare(query).bind(tenantId, period1Start, period1End).first() as any;
    const period2Result = await this.db.prepare(query).bind(tenantId, period2Start, period2End).first() as any;

    const revenueGrowth = period1Result.revenue_cents > 0
      ? ((period2Result.revenue_cents - period1Result.revenue_cents) / period1Result.revenue_cents) * 100
      : 0;

    const ordersGrowth = period1Result.orders > 0
      ? ((period2Result.orders - period1Result.orders) / period1Result.orders) * 100
      : 0;

    const profitGrowth = period1Result.profit_cents > 0
      ? ((period2Result.profit_cents - period1Result.profit_cents) / period1Result.profit_cents) * 100
      : 0;

    return {
      period1: period1Result,
      period2: period2Result,
      growth: {
        revenue_percent: Math.round(revenueGrowth * 100) / 100,
        orders_percent: Math.round(ordersGrowth * 100) / 100,
        profit_percent: Math.round(profitGrowth * 100) / 100
      }
    };
  }
}
