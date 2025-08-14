/**
 * ADVANCED INVENTORY FORECASTING SERVICE
 * 
 * Implements automated reorder points, demand forecasting, and intelligent
 * inventory management for SmartPOS system.
 * 
 * Features:
 * - Automated reorder point calculation
 * - Demand forecasting algorithms
 * - Supplier performance analytics
 * - Purchase order generation
 * - Inventory optimization recommendations
 */

import { Env } from '../types';
import { DatabaseExecutor } from '../utils/database';

// Interfaces for inventory forecasting
export interface ReorderPoint {
  productId: number;
  currentStock: number;
  reorderLevel: number;
  reorderQuantity: number;
  leadTimeDays: number;
  averageDailyUsage: number;
  safetyStock: number;
  lastCalculated: string;
}

export interface DemandForecast {
  productId: number;
  forecastPeriodDays: number;
  predictedDemand: number;
  confidence: number;
  seasonalityFactor: number;
  trendFactor: number;
  historicalAccuracy: number;
}

export interface SupplierPerformance {
  supplierId: number;
  supplierName: string;
  averageLeadTime: number;
  onTimeDeliveryRate: number;
  qualityScore: number;
  priceCompetitiveness: number;
  totalOrders: number;
  lastOrderDate: string;
  recommendationScore: number;
}

export interface PurchaseOrderRecommendation {
  productId: number;
  productName: string;
  currentStock: number;
  reorderLevel: number;
  recommendedQuantity: number;
  preferredSupplierId: number;
  estimatedCost: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  reasonCode: string;
  expectedDeliveryDate: string;
}

export interface InventoryOptimization {
  productId: number;
  currentValue: number;
  optimizedValue: number;
  potentialSavings: number;
  recommendationType: 'reduce_stock' | 'increase_stock' | 'change_supplier' | 'discontinue';
  confidence: number;
  implementationPriority: number;
}

export class InventoryForecastingService {
  private executor: DatabaseExecutor;

  constructor(private env: Env) {
    this.executor = new DatabaseExecutor(env);
  }

  /**
   * Calculate automated reorder points for all products
   */
  async calculateReorderPoints(): Promise<ReorderPoint[]> {
    const query = `
      SELECT 
        p.id as product_id,
        p.name,
        p.stock_quantity as current_stock,
        p.min_stock_level,
        p.reorder_point as current_reorder_point,
        s.name as supplier_name,
        COALESCE(sp.average_lead_time, 7) as lead_time_days,
        COALESCE(usage.avg_daily_usage, 0) as avg_daily_usage,
        COALESCE(usage.usage_variance, 0) as usage_variance
      FROM products p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN supplier_performance sp ON s.id = sp.supplier_id
      LEFT JOIN (
        SELECT 
          si.product_id,
          AVG(si.quantity) as avg_daily_usage,
          VARIANCE(si.quantity) as usage_variance
        FROM sale_items si
        JOIN sales sa ON si.sale_id = sa.id
        WHERE sa.created_at >= datetime('now', '-90 days')
        GROUP BY si.product_id
      ) usage ON p.id = usage.product_id
      WHERE p.is_active = 1
    `;

    const result = await this.executor.execute(query);
    if (!result.success || !result.data) {
      throw new Error('Failed to fetch product data for reorder calculation');
    }

    const reorderPoints: ReorderPoint[] = [];

    for (const product of result.data) {
      const reorderPoint = this.calculateProductReorderPoint(product);
      reorderPoints.push(reorderPoint);

      // Update the product's reorder point in database
      await this.updateProductReorderPoint(product.product_id, reorderPoint);
    }

    return reorderPoints;
  }

  /**
   * Calculate reorder point for a specific product
   */
  private calculateProductReorderPoint(productData: any): ReorderPoint {
    const leadTimeDays = productData.lead_time_days || 7;
    const avgDailyUsage = productData.avg_daily_usage || 0;
    const usageVariance = productData.usage_variance || 0;

    // Calculate safety stock using statistical approach
    // Safety Stock = Z-score × √(Lead Time × Usage Variance)
    const zScore = 1.65; // 95% service level
    const safetyStock = Math.ceil(zScore * Math.sqrt(leadTimeDays * usageVariance));

    // Reorder Level = (Average Daily Usage × Lead Time) + Safety Stock
    const reorderLevel = Math.ceil((avgDailyUsage * leadTimeDays) + safetyStock);

    // Economic Order Quantity (EOQ) calculation
    const annualDemand = avgDailyUsage * 365;
    const orderingCost = 50; // Estimated ordering cost
    const holdingCostRate = 0.25; // 25% annual holding cost
    const unitCost = productData.cost_price || 100;
    const holdingCost = unitCost * holdingCostRate;

    const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCost);
    const reorderQuantity = Math.max(Math.ceil(eoq), reorderLevel);

    return {
      productId: productData.product_id,
      currentStock: productData.current_stock,
      reorderLevel: Math.max(reorderLevel, productData.min_stock_level || 0),
      reorderQuantity,
      leadTimeDays,
      averageDailyUsage: avgDailyUsage,
      safetyStock,
      lastCalculated: new Date().toISOString()
    };
  }

  /**
   * Update product reorder point in database
   */
  private async updateProductReorderPoint(productId: number, reorderPoint: ReorderPoint): Promise<void> {
    const updateQuery = `
      UPDATE products 
      SET 
        reorder_point = ?,
        safety_stock = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `;

    await this.executor.execute(updateQuery, [
      reorderPoint.reorderLevel,
      reorderPoint.safetyStock,
      productId
    ]);

    // Log the reorder point calculation
    const logQuery = `
      INSERT INTO inventory_calculations 
      (product_id, calculation_type, calculated_value, parameters, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `;

    const parameters = JSON.stringify({
      reorderLevel: reorderPoint.reorderLevel,
      reorderQuantity: reorderPoint.reorderQuantity,
      safetyStock: reorderPoint.safetyStock,
      averageDailyUsage: reorderPoint.averageDailyUsage,
      leadTimeDays: reorderPoint.leadTimeDays
    });

    await this.executor.execute(logQuery, [
      productId,
      'reorder_point',
      reorderPoint.reorderLevel,
      parameters
    ]);
  }

  /**
   * Generate demand forecast for products
   */
  async generateDemandForecast(productId?: number, forecastDays: number = 30): Promise<DemandForecast[]> {
    const whereClause = productId ? 'AND p.id = ?' : '';
    const params = productId ? [forecastDays, productId] : [forecastDays];

    const query = `
      SELECT 
        p.id as product_id,
        p.name,
        historical.daily_sales,
        historical.trend_factor,
        historical.seasonality_factor,
        historical.variance
      FROM products p
      LEFT JOIN (
        SELECT 
          si.product_id,
          AVG(si.quantity) as daily_sales,
          -- Simple trend calculation (last 30 days vs previous 30 days)
          CASE 
            WHEN recent.avg_recent > 0 AND older.avg_older > 0 
            THEN recent.avg_recent / older.avg_older 
            ELSE 1.0 
          END as trend_factor,
          -- Seasonality factor (current month vs average)
          CASE 
            WHEN monthly.current_month > 0 AND monthly.avg_month > 0 
            THEN monthly.current_month / monthly.avg_month 
            ELSE 1.0 
          END as seasonality_factor,
          VARIANCE(si.quantity) as variance
        FROM sale_items si
        JOIN sales sa ON si.sale_id = sa.id
        LEFT JOIN (
          SELECT 
            si2.product_id,
            AVG(si2.quantity) as avg_recent
          FROM sale_items si2
          JOIN sales sa2 ON si2.sale_id = sa2.id
          WHERE sa2.created_at >= datetime('now', '-30 days')
          GROUP BY si2.product_id
        ) recent ON si.product_id = recent.product_id
        LEFT JOIN (
          SELECT 
            si3.product_id,
            AVG(si3.quantity) as avg_older
          FROM sale_items si3
          JOIN sales sa3 ON si3.sale_id = sa3.id
          WHERE sa3.created_at BETWEEN datetime('now', '-60 days') AND datetime('now', '-30 days')
          GROUP BY si3.product_id
        ) older ON si.product_id = older.product_id
        LEFT JOIN (
          SELECT 
            si4.product_id,
            AVG(CASE WHEN strftime('%m', sa4.created_at) = strftime('%m', 'now') THEN si4.quantity END) as current_month,
            AVG(si4.quantity) as avg_month
          FROM sale_items si4
          JOIN sales sa4 ON si4.sale_id = sa4.id
          WHERE sa4.created_at >= datetime('now', '-365 days')
          GROUP BY si4.product_id
        ) monthly ON si.product_id = monthly.product_id
        WHERE sa.created_at >= datetime('now', '-90 days')
        GROUP BY si.product_id
      ) historical ON p.id = historical.product_id
      WHERE p.is_active = 1 ${whereClause}
    `;

    const result = await this.executor.execute(query, params);
    if (!result.success || !result.data) {
      throw new Error('Failed to generate demand forecast');
    }

    const forecasts: DemandForecast[] = [];

    for (const product of result.data) {
      const forecast = this.calculateDemandForecast(product, forecastDays);
      forecasts.push(forecast);
    }

    return forecasts;
  }

  /**
   * Calculate demand forecast for a specific product
   */
  private calculateDemandForecast(productData: any, forecastDays: number): DemandForecast {
    const dailySales = productData.daily_sales || 0;
    const trendFactor = productData.trend_factor || 1.0;
    const seasonalityFactor = productData.seasonality_factor || 1.0;
    const variance = productData.variance || 0;

    // Simple forecasting model: Base Demand × Trend × Seasonality
    const baseDemand = dailySales * forecastDays;
    const predictedDemand = Math.round(baseDemand * trendFactor * seasonalityFactor);

    // Calculate confidence based on variance (lower variance = higher confidence)
    const confidence = Math.max(0.1, Math.min(0.95, 1 - (variance / (dailySales + 1))));

    return {
      productId: productData.product_id,
      forecastPeriodDays: forecastDays,
      predictedDemand: Math.max(0, predictedDemand),
      confidence,
      seasonalityFactor,
      trendFactor,
      historicalAccuracy: 0.85 // This would be calculated from historical forecast accuracy
    };
  }

  /**
   * Analyze supplier performance
   */
  async analyzeSupplierPerformance(): Promise<SupplierPerformance[]> {
    const query = `
      SELECT 
        s.id as supplier_id,
        s.name as supplier_name,
        COUNT(po.id) as total_orders,
        AVG(julianday(po.received_date) - julianday(po.order_date)) as avg_lead_time,
        AVG(CASE WHEN po.received_date <= po.expected_date THEN 1.0 ELSE 0.0 END) as on_time_rate,
        AVG(po.quality_score) as quality_score,
        MAX(po.order_date) as last_order_date,
        AVG(poi.unit_cost) as avg_unit_cost,
        MIN(poi.unit_cost) as min_unit_cost
      FROM suppliers s
      LEFT JOIN purchase_orders po ON s.id = po.supplier_id
      LEFT JOIN purchase_order_items poi ON po.id = poi.order_id
      WHERE s.is_active = 1
      GROUP BY s.id, s.name
      HAVING COUNT(po.id) > 0
    `;

    const result = await this.executor.execute(query);
    if (!result.success || !result.data) {
      throw new Error('Failed to analyze supplier performance');
    }

    const performances: SupplierPerformance[] = [];

    for (const supplier of result.data) {
      const performance = this.calculateSupplierScore(supplier);
      performances.push(performance);
    }

    return performances;
  }

  /**
   * Calculate supplier recommendation score
   */
  private calculateSupplierScore(supplierData: any): SupplierPerformance {
    const leadTimeScore = Math.max(0, 1 - (supplierData.avg_lead_time - 7) / 14); // Optimal: 7 days
    const onTimeScore = supplierData.on_time_rate || 0;
    const qualityScore = supplierData.quality_score || 0.8;
    
    // Price competitiveness (lower cost = higher score)
    const priceScore = supplierData.min_unit_cost > 0 ? 
      Math.min(1, supplierData.min_unit_cost / supplierData.avg_unit_cost) : 0.5;

    // Weighted recommendation score
    const recommendationScore = (
      leadTimeScore * 0.3 +
      onTimeScore * 0.3 +
      qualityScore * 0.25 +
      priceScore * 0.15
    );

    return {
      supplierId: supplierData.supplier_id,
      supplierName: supplierData.supplier_name,
      averageLeadTime: supplierData.avg_lead_time || 0,
      onTimeDeliveryRate: supplierData.on_time_rate || 0,
      qualityScore: qualityScore,
      priceCompetitiveness: priceScore,
      totalOrders: supplierData.total_orders || 0,
      lastOrderDate: supplierData.last_order_date || '',
      recommendationScore: Math.round(recommendationScore * 100) / 100
    };
  }

  /**
   * Generate purchase order recommendations
   */
  async generatePurchaseOrderRecommendations(): Promise<PurchaseOrderRecommendation[]> {
    const reorderPoints = await this.calculateReorderPoints();
    const supplierPerformance = await this.analyzeSupplierPerformance();

    const recommendations: PurchaseOrderRecommendation[] = [];

    for (const reorderPoint of reorderPoints) {
      if (reorderPoint.currentStock <= reorderPoint.reorderLevel) {
        const recommendation = await this.createPurchaseOrderRecommendation(
          reorderPoint, 
          supplierPerformance
        );
        recommendations.push(recommendation);
      }
    }

    // Sort by urgency level
    const urgencyOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    recommendations.sort((a, b) => urgencyOrder[b.urgencyLevel] - urgencyOrder[a.urgencyLevel]);

    return recommendations;
  }

  /**
   * Create purchase order recommendation for a product
   */
  private async createPurchaseOrderRecommendation(
    reorderPoint: ReorderPoint,
    supplierPerformance: SupplierPerformance[]
  ): Promise<PurchaseOrderRecommendation> {
    // Get product details
    const productQuery = `
      SELECT p.*, s.name as supplier_name, s.id as supplier_id
      FROM products p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
    `;

    const productResult = await this.executor.execute(productQuery, [reorderPoint.productId]);
    const product = productResult.data?.[0];

    if (!product) {
      throw new Error(`Product not found: ${reorderPoint.productId}`);
    }

    // Find best supplier
    const preferredSupplier = supplierPerformance
      .filter(sp => sp.supplierId === product.supplier_id)
      .sort((a, b) => b.recommendationScore - a.recommendationScore)[0];

    // Calculate urgency level
    const stockRatio = reorderPoint.currentStock / reorderPoint.reorderLevel;
    let urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    let reasonCode: string;

    if (stockRatio <= 0) {
      urgencyLevel = 'critical';
      reasonCode = 'OUT_OF_STOCK';
    } else if (stockRatio <= 0.5) {
      urgencyLevel = 'high';
      reasonCode = 'CRITICALLY_LOW_STOCK';
    } else if (stockRatio <= 0.8) {
      urgencyLevel = 'medium';
      reasonCode = 'LOW_STOCK';
    } else {
      urgencyLevel = 'low';
      reasonCode = 'APPROACHING_REORDER_POINT';
    }

    // Calculate expected delivery date
    const leadTimeDays = preferredSupplier?.averageLeadTime || 7;
    const expectedDeliveryDate = new Date();
    expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + leadTimeDays);

    return {
      productId: reorderPoint.productId,
      productName: product.name,
      currentStock: reorderPoint.currentStock,
      reorderLevel: reorderPoint.reorderLevel,
      recommendedQuantity: reorderPoint.reorderQuantity,
      preferredSupplierId: preferredSupplier?.supplierId || product.supplier_id,
      estimatedCost: reorderPoint.reorderQuantity * (product.cost_price || 0),
      urgencyLevel,
      reasonCode,
      expectedDeliveryDate: expectedDeliveryDate.toISOString()
    };
  }
}
