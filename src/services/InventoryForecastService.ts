import { D1Database } from '@cloudflare/workers-types';

export interface ForecastResult {
  product_id: string;
  product_name: string;
  sku: string;
  current_stock: number;
  forecast_demand: number;
  recommended_order_quantity: number;
  days_until_stockout: number;
  confidence: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  seasonality_factor: number;
}

export interface StockoutRisk {
  product_id: string;
  product_name: string;
  sku: string;
  current_stock: number;
  daily_avg_sales: number;
  days_until_stockout: number;
  risk_level: 'critical' | 'high' | 'medium' | 'low';
  recommended_action: string;
}

export interface ReorderRecommendation {
  product_id: string;
  product_name: string;
  sku: string;
  current_stock: number;
  reorder_point: number;
  recommended_quantity: number;
  estimated_cost_cents: number;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  reason: string;
}

export class InventoryForecastService {
  constructor(private db: D1Database) {}

  /**
   * Calculate moving average for demand forecasting
   */
  private calculateMovingAverage(values: number[], window: number): number {
    if (values.length === 0) return 0;
    const slice = values.slice(-window);
    return slice.reduce((sum, val) => sum + val, 0) / slice.length;
  }

  /**
   * Calculate exponential smoothing for trend analysis
   */
  private exponentialSmoothing(values: number[], alpha: number = 0.3): number {
    if (values.length === 0) return 0;
    if (values.length === 1) return values[0];

    let forecast = values[0];
    for (let i = 1; i < values.length; i++) {
      forecast = alpha * values[i] + (1 - alpha) * forecast;
    }
    return forecast;
  }

  /**
   * Analyze historical sales data and forecast future demand
   */
  async forecastDemand(
    productId: string,
    tenantId: string = 'default',
    forecastDays: number = 30
  ): Promise<ForecastResult | null> {
    // Get product info
    const product = await this.db.prepare(`
      SELECT
        p.id as product_id,
        p.name as product_name,
        p.sku,
        p.cost_price_cents,
        p.low_stock_threshold,
        COALESCE(SUM(i.quantity), 0) as current_stock
      FROM products p
      LEFT JOIN inventory i ON i.product_id = p.id AND i.tenant_id = p.tenant_id
      WHERE p.id = ? AND p.tenant_id = ?
      GROUP BY p.id
    `).bind(productId, tenantId).first();

    if (!product) return null;

    // Get sales history (last 90 days)
    const salesHistory = await this.db.prepare(`
      SELECT
        DATE(o.created_at) as sale_date,
        SUM(oi.quantity) as quantity_sold
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id AND o.tenant_id = oi.tenant_id
      WHERE oi.product_id = ? AND oi.tenant_id = ?
        AND o.created_at >= datetime('now', '-90 days')
        AND o.status NOT IN ('cancelled', 'refunded')
      GROUP BY DATE(o.created_at)
      ORDER BY sale_date ASC
    `).bind(productId, tenantId).all();

    const dailySales = (salesHistory.results as any[]).map(r => r.quantity_sold || 0);

    if (dailySales.length === 0) {
      return {
        ...(product as any),
        forecast_demand: 0,
        recommended_order_quantity: (product as any).low_stock_threshold || 10,
        days_until_stockout: 999,
        confidence: 0,
        trend: 'stable',
        seasonality_factor: 1.0
      };
    }

    // Calculate statistics
    const avgDailySales = this.calculateMovingAverage(dailySales, 30);
    const recentAvg = this.calculateMovingAverage(dailySales, 7);
    const smoothedForecast = this.exponentialSmoothing(dailySales);

    // Determine trend
    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (recentAvg > avgDailySales * 1.2) trend = 'increasing';
    else if (recentAvg < avgDailySales * 0.8) trend = 'decreasing';

    // Calculate seasonality (compare recent to historical average)
    const seasonalityFactor = avgDailySales > 0 ? recentAvg / avgDailySales : 1.0;

    // Forecast future demand
    const forecastDemand = Math.ceil(smoothedForecast * seasonalityFactor * forecastDays);

    // Calculate days until stockout
    const currentStock = (product as any).current_stock;
    const daysUntilStockout = avgDailySales > 0
      ? Math.floor(currentStock / avgDailySales)
      : 999;

    // Calculate recommended order quantity
    // Safety stock = (max daily sales - avg daily sales) * lead time
    const maxDailySales = Math.max(...dailySales);
    const leadTimeDays = 7; // Assume 7-day lead time
    const safetyStock = Math.ceil((maxDailySales - avgDailySales) * leadTimeDays);
    const reorderPoint = Math.ceil(avgDailySales * leadTimeDays);
    const recommendedOrderQuantity = Math.max(
      0,
      reorderPoint + safetyStock - currentStock
    );

    // Confidence based on data consistency
    const variance = dailySales.reduce((sum, val) => sum + Math.pow(val - avgDailySales, 2), 0) / dailySales.length;
    const stdDev = Math.sqrt(variance);
    const cv = avgDailySales > 0 ? stdDev / avgDailySales : 1;
    const confidence = Math.max(0, Math.min(100, Math.round((1 - cv) * 100)));

    return {
      ...(product as any),
      forecast_demand: forecastDemand,
      recommended_order_quantity: recommendedOrderQuantity,
      days_until_stockout: daysUntilStockout,
      confidence,
      trend,
      seasonality_factor: Math.round(seasonalityFactor * 100) / 100
    };
  }

  /**
   * Identify products at risk of stockout
   */
  async getStockoutRisks(
    tenantId: string = 'default',
    daysThreshold: number = 7
  ): Promise<StockoutRisk[]> {
    const products = await this.db.prepare(`
      SELECT
        p.id as product_id,
        p.name as product_name,
        p.sku,
        COALESCE(SUM(i.quantity), 0) as current_stock
      FROM products p
      LEFT JOIN inventory i ON i.product_id = p.id AND i.tenant_id = p.tenant_id
      WHERE p.tenant_id = ? AND p.is_active = 1
      GROUP BY p.id
      HAVING current_stock < 100
    `).bind(tenantId).all();

    const risks: StockoutRisk[] = [];

    for (const product of products.results as any[]) {
      // Calculate daily average sales (last 30 days)
      const salesData = await this.db.prepare(`
        SELECT
          COALESCE(AVG(daily_quantity), 0) as daily_avg_sales,
          COALESCE(MAX(daily_quantity), 0) as max_daily_sales
        FROM (
          SELECT
            DATE(o.created_at) as sale_date,
            SUM(oi.quantity) as daily_quantity
          FROM order_items oi
          INNER JOIN orders o ON o.id = oi.order_id AND o.tenant_id = oi.tenant_id
          WHERE oi.product_id = ? AND oi.tenant_id = ?
            AND o.created_at >= datetime('now', '-30 days')
            AND o.status NOT IN ('cancelled', 'refunded')
          GROUP BY DATE(o.created_at)
        )
      `).bind(product.product_id, tenantId).first();

      const dailyAvgSales = (salesData as any)?.daily_avg_sales || 0;

      if (dailyAvgSales === 0) continue;

      const daysUntilStockout = Math.floor(product.current_stock / dailyAvgSales);

      if (daysUntilStockout <= daysThreshold) {
        let riskLevel: 'critical' | 'high' | 'medium' | 'low' = 'low';
        let recommendedAction = '';

        if (daysUntilStockout <= 2) {
          riskLevel = 'critical';
          recommendedAction = 'Urgent: Order immediately with expedited shipping';
        } else if (daysUntilStockout <= 5) {
          riskLevel = 'high';
          recommendedAction = 'Order within 24 hours';
        } else if (daysUntilStockout <= 7) {
          riskLevel = 'medium';
          recommendedAction = 'Plan to order within this week';
        }

        risks.push({
          product_id: product.product_id,
          product_name: product.product_name,
          sku: product.sku,
          current_stock: product.current_stock,
          daily_avg_sales: Math.round(dailyAvgSales * 100) / 100,
          days_until_stockout: daysUntilStockout,
          risk_level: riskLevel,
          recommended_action: recommendedAction
        });
      }
    }

    return risks.sort((a, b) => a.days_until_stockout - b.days_until_stockout);
  }

  /**
   * Generate reorder recommendations
   */
  async getReorderRecommendations(
    tenantId: string = 'default'
  ): Promise<ReorderRecommendation[]> {
    const products = await this.db.prepare(`
      SELECT
        p.id as product_id,
        p.name as product_name,
        p.sku,
        p.cost_price_cents,
        p.low_stock_threshold,
        COALESCE(SUM(i.quantity), 0) as current_stock
      FROM products p
      LEFT JOIN inventory i ON i.product_id = p.id AND i.tenant_id = p.tenant_id
      WHERE p.tenant_id = ? AND p.is_active = 1
      GROUP BY p.id
    `).bind(tenantId).all();

    const recommendations: ReorderRecommendation[] = [];

    for (const product of products.results as any[]) {
      // Get average daily sales
      const salesData = await this.db.prepare(`
        SELECT
          COALESCE(AVG(daily_quantity), 0) as daily_avg_sales
        FROM (
          SELECT
            DATE(o.created_at) as sale_date,
            SUM(oi.quantity) as daily_quantity
          FROM order_items oi
          INNER JOIN orders o ON o.id = oi.order_id AND o.tenant_id = oi.tenant_id
          WHERE oi.product_id = ? AND oi.tenant_id = ?
            AND o.created_at >= datetime('now', '-30 days')
            AND o.status NOT IN ('cancelled', 'refunded')
          GROUP BY DATE(o.created_at)
        )
      `).bind(product.product_id, tenantId).first();

      const dailyAvgSales = (salesData as any)?.daily_avg_sales || 0;

      if (dailyAvgSales === 0) continue;

      // Calculate reorder point and recommended quantity
      const leadTimeDays = 7;
      const safetyStockDays = 3;
      const reorderPoint = Math.ceil(dailyAvgSales * (leadTimeDays + safetyStockDays));

      // Check if below reorder point or low stock threshold
      const belowReorderPoint = product.current_stock < reorderPoint;
      const belowThreshold = product.current_stock < (product.low_stock_threshold || 0);

      if (belowReorderPoint || belowThreshold) {
        const targetStock = Math.ceil(dailyAvgSales * 30); // 30-day supply
        const recommendedQuantity = Math.max(0, targetStock - product.current_stock);
        const daysUntilStockout = Math.floor(product.current_stock / dailyAvgSales);

        let priority: 'urgent' | 'high' | 'medium' | 'low' = 'low';
        let reason = '';

        if (daysUntilStockout <= 3) {
          priority = 'urgent';
          reason = `Critical: Only ${daysUntilStockout} days of stock remaining`;
        } else if (daysUntilStockout <= 7) {
          priority = 'high';
          reason = `${daysUntilStockout} days of stock remaining`;
        } else if (belowThreshold) {
          priority = 'medium';
          reason = 'Below low stock threshold';
        } else {
          priority = 'medium';
          reason = 'Below reorder point';
        }

        recommendations.push({
          product_id: product.product_id,
          product_name: product.product_name,
          sku: product.sku,
          current_stock: product.current_stock,
          reorder_point: reorderPoint,
          recommended_quantity: recommendedQuantity,
          estimated_cost_cents: recommendedQuantity * (product.cost_price_cents || 0),
          priority,
          reason
        });
      }
    }

    // Sort by priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  /**
   * Get inventory health overview
   */
  async getInventoryHealth(
    tenantId: string = 'default'
  ): Promise<{
    total_products: number;
    in_stock: number;
    low_stock: number;
    out_of_stock: number;
    overstocked: number;
    healthy_stock: number;
    total_value_cents: number;
    stockout_risk_count: number;
    reorder_needed_count: number;
  }> {
    const stats = await this.db.prepare(`
      SELECT
        COUNT(DISTINCT p.id) as total_products,
        COUNT(DISTINCT CASE WHEN COALESCE(SUM(i.quantity), 0) > 0 THEN p.id END) as in_stock,
        COUNT(DISTINCT CASE WHEN COALESCE(SUM(i.quantity), 0) <= p.low_stock_threshold AND COALESCE(SUM(i.quantity), 0) > 0 THEN p.id END) as low_stock,
        COUNT(DISTINCT CASE WHEN COALESCE(SUM(i.quantity), 0) = 0 THEN p.id END) as out_of_stock,
        SUM(COALESCE(i.quantity, 0) * COALESCE(p.cost_price_cents, 0)) as total_value_cents
      FROM products p
      LEFT JOIN inventory i ON i.product_id = p.id AND i.tenant_id = p.tenant_id
      WHERE p.tenant_id = ? AND p.is_active = 1
    `).bind(tenantId).first();

    const stockoutRisks = await this.getStockoutRisks(tenantId, 7);
    const reorderRecs = await this.getReorderRecommendations(tenantId);

    return {
      ...(stats as any),
      overstocked: 0, // TODO: Implement overstocked logic
      healthy_stock: (stats as any).in_stock - (stats as any).low_stock,
      stockout_risk_count: stockoutRisks.length,
      reorder_needed_count: reorderRecs.length
    };
  }
}
