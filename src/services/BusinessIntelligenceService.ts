/**
 * BUSINESS INTELLIGENCE SERVICE
 * 
 * Advanced analytics and reporting engine for SmartPOS system.
 * Provides comprehensive business insights, profit analysis, trend forecasting,
 * and custom report generation capabilities.
 * 
 * Features:
 * - Profit margin analysis
 * - Sales trend analysis and forecasting
 * - Customer behavior analytics
 * - Product performance insights
 * - Custom report builder
 * - Export to external systems
 * - Real-time business metrics
 */

import { Env } from '../types';
import { DatabaseExecutor } from '../utils/database';
import { log } from '../utils/logger';

// Business Intelligence Interfaces
export interface ProfitAnalysis {
  productId: number;
  productName: string;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
  unitsSold: number;
  averageSellingPrice: number;
  averageCostPrice: number;
  profitPerUnit: number;
  period: string;
}

export interface SalesTrend {
  period: string;
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  uniqueCustomers: number;
  growthRate: number;
  seasonalityIndex: number;
  forecastedSales?: number;
}

export interface CustomerAnalytics {
  customerId: number;
  customerName: string;
  totalSpent: number;
  orderCount: number;
  averageOrderValue: number;
  lastPurchaseDate: string;
  customerLifetimeValue: number;
  loyaltyScore: number;
  customerSegment: 'new' | 'regular' | 'vip' | 'at_risk' | 'churned';
  preferredCategories: string[];
}

export interface ProductPerformance {
  productId: number;
  productName: string;
  categoryName: string;
  totalSales: number;
  revenue: number;
  profitMargin: number;
  inventoryTurnover: number;
  daysInStock: number;
  performanceScore: number;
  recommendation: 'promote' | 'maintain' | 'review' | 'discontinue';
}

export interface BusinessMetrics {
  totalRevenue: number;
  totalProfit: number;
  averageOrderValue: number;
  customerAcquisitionCost: number;
  customerLifetimeValue: number;
  inventoryTurnover: number;
  grossMargin: number;
  netMargin: number;
  salesGrowthRate: number;
  customerRetentionRate: number;
}

export interface CustomReportConfig {
  reportName: string;
  reportType: 'sales' | 'inventory' | 'customer' | 'financial' | 'custom';
  dateRange: {
    startDate: string;
    endDate: string;
  };
  groupBy: 'day' | 'week' | 'month' | 'quarter' | 'year';
  filters: {
    storeIds?: number[];
    categoryIds?: number[];
    productIds?: number[];
    customerIds?: number[];
    userIds?: number[];
  };
  metrics: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  limit?: number;
}

export class BusinessIntelligenceService {
  private executor: DatabaseExecutor;

  constructor(private env: Env) {
    this.executor = new DatabaseExecutor(env);
  }

  /**
   * Analyze profit margins for products
   */
  async analyzeProfitMargins(
    startDate?: string,
    endDate?: string,
    categoryId?: number
  ): Promise<ProfitAnalysis[]> {
    const dateFilter = startDate && endDate ? 
      `AND s.created_at BETWEEN ? AND ?` : '';
    const categoryFilter = categoryId ? 
      `AND p.category_id = ?` : '';
    
    const params: any[] = [];
    if (startDate && endDate) {
      params.push(startDate, endDate);
    }
    if (categoryId) {
      params.push(categoryId);
    }

    const query = `
      SELECT 
        p.id as product_id,
        p.name as product_name,
        SUM(si.total_amount) as total_revenue,
        SUM(si.quantity * p.cost_price) as total_cost,
        SUM(si.total_amount) - SUM(si.quantity * p.cost_price) as gross_profit,
        CASE 
          WHEN SUM(si.total_amount) > 0 
          THEN ((SUM(si.total_amount) - SUM(si.quantity * p.cost_price)) / SUM(si.total_amount)) * 100
          ELSE 0 
        END as profit_margin,
        SUM(si.quantity) as units_sold,
        AVG(si.unit_price) as average_selling_price,
        AVG(p.cost_price) as average_cost_price,
        (SUM(si.total_amount) - SUM(si.quantity * p.cost_price)) / SUM(si.quantity) as profit_per_unit
      FROM products p
      JOIN sale_items si ON p.id = si.product_id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.status = 'completed' ${dateFilter} ${categoryFilter}
      GROUP BY p.id, p.name
      HAVING SUM(si.quantity) > 0
      ORDER BY gross_profit DESC
    `;

    const result = await this.executor.execute(query, params);
    if (!result.success || !result.data) {
      throw new Error('Failed to analyze profit margins');
    }

    return result.data.map(row => ({
      productId: row.product_id,
      productName: row.product_name,
      totalRevenue: row.total_revenue || 0,
      totalCost: row.total_cost || 0,
      grossProfit: row.gross_profit || 0,
      profitMargin: row.profit_margin || 0,
      unitsSold: row.units_sold || 0,
      averageSellingPrice: row.average_selling_price || 0,
      averageCostPrice: row.average_cost_price || 0,
      profitPerUnit: row.profit_per_unit || 0,
      period: `${startDate || 'All time'} - ${endDate || 'Present'}`
    }));
  }

  /**
   * Analyze sales trends with forecasting
   */
  async analyzeSalesTrends(
    groupBy: 'day' | 'week' | 'month' = 'month',
    periods: number = 12
  ): Promise<SalesTrend[]> {
    const dateFormat = {
      day: '%Y-%m-%d',
      week: '%Y-W%W',
      month: '%Y-%m',
    }[groupBy];

    const query = `
      WITH sales_by_period AS (
        SELECT 
          strftime('${dateFormat}', s.created_at) as period,
          COUNT(s.id) as total_sales,
          SUM(s.total_amount) as total_revenue,
          AVG(s.total_amount) as average_order_value,
          COUNT(DISTINCT s.customer_id) as unique_customers
        FROM sales s
        WHERE s.status = 'completed'
          AND s.created_at >= datetime('now', '-${periods} ${groupBy}s')
        GROUP BY strftime('${dateFormat}', s.created_at)
        ORDER BY period
      ),
      trends AS (
        SELECT 
          *,
          LAG(total_revenue) OVER (ORDER BY period) as prev_revenue,
          AVG(total_revenue) OVER (
            ORDER BY period 
            ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
          ) as moving_avg
        FROM sales_by_period
      )
      SELECT 
        *,
        CASE 
          WHEN prev_revenue > 0 
          THEN ((total_revenue - prev_revenue) / prev_revenue) * 100
          ELSE 0 
        END as growth_rate,
        CASE 
          WHEN moving_avg > 0 
          THEN total_revenue / moving_avg
          ELSE 1.0 
        END as seasonality_index
      FROM trends
    `;

    const result = await this.executor.execute(query);
    if (!result.success || !result.data) {
      throw new Error('Failed to analyze sales trends');
    }

    // Simple forecasting using linear regression on the last 6 periods
    const trends = result.data as any[];
    const forecastedTrends = this.forecastSalesTrends(trends);

    return forecastedTrends;
  }

  /**
   * Simple sales forecasting using linear regression
   */
  private forecastSalesTrends(historicalData: any[]): SalesTrend[] {
    const trends: SalesTrend[] = historicalData.map(row => ({
      period: row.period,
      totalSales: row.total_sales || 0,
      totalRevenue: row.total_revenue || 0,
      averageOrderValue: row.average_order_value || 0,
      uniqueCustomers: row.unique_customers || 0,
      growthRate: row.growth_rate || 0,
      seasonalityIndex: row.seasonality_index || 1.0
    }));

    // Simple linear regression for next period forecast
    if (trends.length >= 3) {
      const recentTrends = trends.slice(-6); // Use last 6 periods
      const avgGrowthRate = recentTrends.reduce((sum, t) => sum + t.growthRate, 0) / recentTrends.length;
      const lastRevenue = trends[trends.length - 1].totalRevenue;
      const forecastedRevenue = lastRevenue * (1 + avgGrowthRate / 100);

      // Add forecast for next period
      const nextPeriod = this.getNextPeriod(trends[trends.length - 1].period);
      trends.push({
        period: nextPeriod,
        totalSales: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        uniqueCustomers: 0,
        growthRate: avgGrowthRate,
        seasonalityIndex: 1.0,
        forecastedSales: forecastedRevenue
      });
    }

    return trends;
  }

  /**
   * Get next period string for forecasting
   */
  private getNextPeriod(currentPeriod: string): string {
    // Simple implementation - in production, use proper date library
    if (currentPeriod.includes('-')) {
      const [year, month] = currentPeriod.split('-').map(Number);
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      return `${nextYear}-${nextMonth.toString().padStart(2, '0')}`;
    }
    return currentPeriod + '_forecast';
  }

  /**
   * Analyze customer behavior and segmentation
   */
  async analyzeCustomerBehavior(): Promise<CustomerAnalytics[]> {
    const query = `
      WITH customer_stats AS (
        SELECT 
          c.id as customer_id,
          c.name as customer_name,
          COUNT(s.id) as order_count,
          SUM(s.total_amount) as total_spent,
          AVG(s.total_amount) as average_order_value,
          MAX(s.created_at) as last_purchase_date,
          MIN(s.created_at) as first_purchase_date,
          julianday('now') - julianday(MAX(s.created_at)) as days_since_last_purchase,
          julianday(MAX(s.created_at)) - julianday(MIN(s.created_at)) as customer_lifespan_days
        FROM customers c
        LEFT JOIN sales s ON c.id = s.customer_id AND s.status = 'completed'
        WHERE c.is_active = 1
        GROUP BY c.id, c.name
      ),
      customer_categories AS (
        SELECT 
          cs.customer_id,
          GROUP_CONCAT(DISTINCT cat.name) as preferred_categories
        FROM customer_stats cs
        JOIN sales s ON cs.customer_id = s.customer_id
        JOIN sale_items si ON s.id = si.sale_id
        JOIN products p ON si.product_id = p.id
        JOIN categories cat ON p.category_id = cat.id
        WHERE s.status = 'completed'
        GROUP BY cs.customer_id
      )
      SELECT 
        cs.*,
        COALESCE(cc.preferred_categories, '') as preferred_categories,
        -- Customer Lifetime Value calculation
        CASE 
          WHEN cs.customer_lifespan_days > 0 
          THEN (cs.total_spent / cs.customer_lifespan_days) * 365
          ELSE cs.total_spent 
        END as customer_lifetime_value,
        -- Loyalty Score (0-100)
        CASE 
          WHEN cs.order_count >= 10 AND cs.days_since_last_purchase <= 30 THEN 90
          WHEN cs.order_count >= 5 AND cs.days_since_last_purchase <= 60 THEN 70
          WHEN cs.order_count >= 2 AND cs.days_since_last_purchase <= 90 THEN 50
          WHEN cs.order_count >= 1 AND cs.days_since_last_purchase <= 180 THEN 30
          ELSE 10
        END as loyalty_score,
        -- Customer Segment
        CASE 
          WHEN cs.days_since_last_purchase <= 30 AND cs.order_count >= 5 THEN 'vip'
          WHEN cs.days_since_last_purchase <= 60 AND cs.order_count >= 2 THEN 'regular'
          WHEN cs.days_since_last_purchase <= 90 AND cs.order_count >= 1 THEN 'new'
          WHEN cs.days_since_last_purchase <= 180 THEN 'at_risk'
          ELSE 'churned'
        END as customer_segment
      FROM customer_stats cs
      LEFT JOIN customer_categories cc ON cs.customer_id = cc.customer_id
      ORDER BY cs.total_spent DESC
    `;

    const result = await this.executor.execute(query);
    if (!result.success || !result.data) {
      throw new Error('Failed to analyze customer behavior');
    }

    return result.data.map(row => ({
      customerId: row.customer_id,
      customerName: row.customer_name || 'Unknown',
      totalSpent: row.total_spent || 0,
      orderCount: row.order_count || 0,
      averageOrderValue: row.average_order_value || 0,
      lastPurchaseDate: row.last_purchase_date || '',
      customerLifetimeValue: row.customer_lifetime_value || 0,
      loyaltyScore: row.loyalty_score || 0,
      customerSegment: row.customer_segment || 'new',
      preferredCategories: row.preferred_categories ? row.preferred_categories.split(',') : []
    }));
  }

  /**
   * Analyze product performance and recommendations
   */
  async analyzeProductPerformance(): Promise<ProductPerformance[]> {
    const query = `
      WITH product_sales AS (
        SELECT 
          p.id as product_id,
          p.name as product_name,
          c.name as category_name,
          SUM(si.quantity) as total_sales,
          SUM(si.total_amount) as revenue,
          AVG((si.unit_price - p.cost_price) / si.unit_price * 100) as profit_margin,
          COUNT(DISTINCT s.created_at) as sales_days,
          julianday('now') - julianday(MIN(s.created_at)) as days_in_stock
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN sale_items si ON p.id = si.product_id
        LEFT JOIN sales s ON si.sale_id = s.id AND s.status = 'completed'
        WHERE p.is_active = 1
        GROUP BY p.id, p.name, c.name
      )
      SELECT 
        *,
        CASE 
          WHEN days_in_stock > 0 
          THEN (total_sales * 365.0) / days_in_stock
          ELSE 0 
        END as inventory_turnover,
        -- Performance Score (0-100)
        CASE 
          WHEN total_sales >= 100 AND profit_margin >= 20 THEN 90
          WHEN total_sales >= 50 AND profit_margin >= 15 THEN 70
          WHEN total_sales >= 20 AND profit_margin >= 10 THEN 50
          WHEN total_sales >= 5 AND profit_margin >= 5 THEN 30
          ELSE 10
        END as performance_score,
        -- Recommendation
        CASE 
          WHEN total_sales >= 50 AND profit_margin >= 20 THEN 'promote'
          WHEN total_sales >= 20 AND profit_margin >= 10 THEN 'maintain'
          WHEN total_sales >= 5 OR profit_margin >= 5 THEN 'review'
          ELSE 'discontinue'
        END as recommendation
      FROM product_sales
      ORDER BY performance_score DESC, revenue DESC
    `;

    const result = await this.executor.execute(query);
    if (!result.success || !result.data) {
      throw new Error('Failed to analyze product performance');
    }

    return result.data.map(row => ({
      productId: row.product_id,
      productName: row.product_name || 'Unknown',
      categoryName: row.category_name || 'Uncategorized',
      totalSales: row.total_sales || 0,
      revenue: row.revenue || 0,
      profitMargin: row.profit_margin || 0,
      inventoryTurnover: row.inventory_turnover || 0,
      daysInStock: row.days_in_stock || 0,
      performanceScore: row.performance_score || 0,
      recommendation: row.recommendation || 'review'
    }));
  }

  /**
   * Calculate comprehensive business metrics
   */
  async calculateBusinessMetrics(
    startDate?: string,
    endDate?: string
  ): Promise<BusinessMetrics> {
    const dateFilter = startDate && endDate ? 
      `AND created_at BETWEEN ? AND ?` : '';
    const params = startDate && endDate ? [startDate, endDate] : [];

    const queries = {
      revenue: `
        SELECT 
          SUM(total_amount) as total_revenue,
          SUM(total_amount - tax_amount) as net_revenue,
          COUNT(*) as total_orders,
          AVG(total_amount) as average_order_value
        FROM sales 
        WHERE status = 'completed' ${dateFilter}
      `,
      costs: `
        SELECT 
          SUM(si.quantity * p.cost_price) as total_cost
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE s.status = 'completed' ${dateFilter}
      `,
      customers: `
        SELECT 
          COUNT(DISTINCT customer_id) as unique_customers,
          COUNT(DISTINCT CASE WHEN created_at >= datetime('now', '-30 days') THEN customer_id END) as active_customers
        FROM sales 
        WHERE status = 'completed' ${dateFilter}
      `,
      inventory: `
        SELECT 
          SUM(stock_quantity * cost_price) as inventory_value,
          AVG(stock_quantity) as avg_stock_level
        FROM products 
        WHERE is_active = 1
      `
    };

    const [revenueResult, costsResult, customersResult, inventoryResult] = await Promise.all([
      this.executor.execute(queries.revenue, params),
      this.executor.execute(queries.costs, params),
      this.executor.execute(queries.customers, params),
      this.executor.execute(queries.inventory)
    ]);

    const revenue = revenueResult.data?.[0] || {};
    const costs = costsResult.data?.[0] || {};
    const customers = customersResult.data?.[0] || {};
    const inventory = inventoryResult.data?.[0] || {};

    const totalRevenue = revenue.total_revenue || 0;
    const totalCost = costs.total_cost || 0;
    const totalProfit = totalRevenue - totalCost;
    const inventoryValue = inventory.inventory_value || 1;

    return {
      totalRevenue,
      totalProfit,
      averageOrderValue: revenue.average_order_value || 0,
      customerAcquisitionCost: totalRevenue > 0 ? totalCost / (customers.unique_customers || 1) : 0,
      customerLifetimeValue: customers.unique_customers > 0 ? totalRevenue / customers.unique_customers : 0,
      inventoryTurnover: inventoryValue > 0 ? totalCost / inventoryValue : 0,
      grossMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      netMargin: totalRevenue > 0 ? ((totalProfit - (totalRevenue * 0.1)) / totalRevenue) * 100 : 0, // Assuming 10% operating expenses
      salesGrowthRate: 0, // Would need historical comparison
      customerRetentionRate: customers.unique_customers > 0 ? (customers.active_customers / customers.unique_customers) * 100 : 0
    };
  }

  /**
   * Generate custom report based on configuration
   */
  async generateCustomReport(config: CustomReportConfig): Promise<any[]> {
    log.info('Generating custom report', { reportName: config.reportName, reportType: config.reportType });

    // Build dynamic query based on configuration
    const query = this.buildCustomReportQuery(config);
    const result = await this.executor.execute(query.sql, query.params);

    if (!result.success || !result.data) {
      throw new Error(`Failed to generate custom report: ${config.reportName}`);
    }

    return result.data;
  }

  /**
   * Build dynamic SQL query for custom reports
   */
  private buildCustomReportQuery(config: CustomReportConfig): { sql: string; params: any[] } {
    const params: any[] = [];
    let baseQuery = '';
    let whereConditions: string[] = [];
    let groupByClause = '';
    let orderByClause = `ORDER BY ${config.sortBy} ${config.sortOrder.toUpperCase()}`;

    // Date range filter
    whereConditions.push('s.created_at BETWEEN ? AND ?');
    params.push(config.dateRange.startDate, config.dateRange.endDate);

    // Build base query based on report type
    switch (config.reportType) {
      case 'sales':
        baseQuery = `
          SELECT 
            ${this.buildDateGrouping(config.groupBy)} as period,
            COUNT(s.id) as total_sales,
            SUM(s.total_amount) as total_revenue,
            AVG(s.total_amount) as average_order_value,
            COUNT(DISTINCT s.customer_id) as unique_customers
          FROM sales s
        `;
        groupByClause = `GROUP BY ${this.buildDateGrouping(config.groupBy)}`;
        break;

      case 'inventory':
        baseQuery = `
          SELECT 
            p.name as product_name,
            c.name as category_name,
            p.stock_quantity,
            p.stock_quantity * p.cost_price as inventory_value,
            SUM(si.quantity) as units_sold
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          LEFT JOIN sale_items si ON p.id = si.product_id
          LEFT JOIN sales s ON si.sale_id = s.id
        `;
        groupByClause = 'GROUP BY p.id, p.name, c.name, p.stock_quantity, p.cost_price';
        break;

      case 'customer':
        baseQuery = `
          SELECT 
            c.name as customer_name,
            COUNT(s.id) as order_count,
            SUM(s.total_amount) as total_spent,
            AVG(s.total_amount) as average_order_value,
            MAX(s.created_at) as last_purchase_date
          FROM customers c
          LEFT JOIN sales s ON c.id = s.customer_id
        `;
        groupByClause = 'GROUP BY c.id, c.name';
        break;

      default:
        throw new Error(`Unsupported report type: ${config.reportType}`);
    }

    // Add filters
    if (config.filters.storeIds?.length) {
      whereConditions.push(`s.store_id IN (${config.filters.storeIds.map(() => '?').join(',')})`);
      params.push(...config.filters.storeIds);
    }

    if (config.filters.categoryIds?.length) {
      whereConditions.push(`p.category_id IN (${config.filters.categoryIds.map(() => '?').join(',')})`);
      params.push(...config.filters.categoryIds);
    }

    // Build final query
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const limitClause = config.limit ? `LIMIT ${config.limit}` : '';

    const sql = `${baseQuery} ${whereClause} ${groupByClause} ${orderByClause} ${limitClause}`;

    return { sql, params };
  }

  /**
   * Build date grouping expression for SQL
   */
  private buildDateGrouping(groupBy: string): string {
    switch (groupBy) {
      case 'day':
        return "strftime('%Y-%m-%d', s.created_at)";
      case 'week':
        return "strftime('%Y-W%W', s.created_at)";
      case 'month':
        return "strftime('%Y-%m', s.created_at)";
      case 'quarter':
        return "strftime('%Y-Q', s.created_at) || ((strftime('%m', s.created_at) - 1) / 3 + 1)";
      case 'year':
        return "strftime('%Y', s.created_at)";
      default:
        return "strftime('%Y-%m-%d', s.created_at)";
    }
  }

  /**
   * Export report data to various formats
   */
  async exportReport(data: any[], format: 'csv' | 'json' | 'excel'): Promise<string> {
    switch (format) {
      case 'csv':
        return this.exportToCSV(data);
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'excel':
        // In a real implementation, you'd use a library like xlsx
        return this.exportToCSV(data); // Fallback to CSV
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export data to CSV format
   */
  private exportToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  }
}
