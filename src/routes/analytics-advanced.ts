/**
 * Advanced Analytics API
 * Production-ready analytics endpoints with comprehensive reporting
 * Rules.md compliant - uses only real Cloudflare D1 data
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../types';
import { AdvancedAnalyticsService } from '../services/AdvancedAnalyticsService';
import { authenticate } from '../middleware/auth';
import { validateQuery, validateBody } from '../middleware/validation';

const app = new Hono<{ Bindings: Env }>();

// Validation schemas
const AnalyticsPeriodSchema = z.object({
  period: z.enum(['today', 'week', 'month', 'quarter', 'year']).default('month')
});

const DateRangeSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

// Apply authentication to all routes
app.use('*', authenticate);

/**
 * Get comprehensive dashboard analytics
 * GET /analytics-advanced/dashboard
 */
app.get('/dashboard', async (c) => {
  try {
    const analyticsService = new AdvancedAnalyticsService(c.env);
    const dashboardData = await analyticsService.getDashboardAnalytics();

    return c.json({
      success: true,
      data: dashboardData,
      message: 'Dashboard analytics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting dashboard analytics:', error);
    return c.json({
      success: false,
      message: 'Failed to get dashboard analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Get sales analytics
 * GET /analytics-advanced/sales
 */
app.get('/sales', validateQuery(AnalyticsPeriodSchema), async (c) => {
  try {
    const { period } = c.req.valid('query');
    const analyticsService = new AdvancedAnalyticsService(c.env);
    const salesAnalytics = await analyticsService.getSalesAnalytics(period);

    return c.json({
      success: true,
      data: salesAnalytics,
      message: 'Sales analytics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting sales analytics:', error);
    return c.json({
      success: false,
      message: 'Failed to get sales analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Get inventory analytics
 * GET /analytics-advanced/inventory
 */
app.get('/inventory', async (c) => {
  try {
    const analyticsService = new AdvancedAnalyticsService(c.env);
    const inventoryAnalytics = await analyticsService.getInventoryAnalytics();

    return c.json({
      success: true,
      data: inventoryAnalytics,
      message: 'Inventory analytics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting inventory analytics:', error);
    return c.json({
      success: false,
      message: 'Failed to get inventory analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Get customer analytics
 * GET /analytics-advanced/customers
 */
app.get('/customers', validateQuery(AnalyticsPeriodSchema), async (c) => {
  try {
    const { period } = c.req.valid('query');
    const analyticsService = new AdvancedAnalyticsService(c.env);
    const customerAnalytics = await analyticsService.getCustomerAnalytics(period as any);

    return c.json({
      success: true,
      data: customerAnalytics,
      message: 'Customer analytics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting customer analytics:', error);
    return c.json({
      success: false,
      message: 'Failed to get customer analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Get performance metrics
 * GET /analytics-advanced/performance
 */
app.get('/performance', async (c) => {
  try {
    const analyticsService = new AdvancedAnalyticsService(c.env);
    const performanceMetrics = await analyticsService.getPerformanceMetrics();

    return c.json({
      success: true,
      data: performanceMetrics,
      message: 'Performance metrics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    return c.json({
      success: false,
      message: 'Failed to get performance metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Get sales trends with custom date range
 * POST /analytics-advanced/sales/trends
 */
app.post('/sales/trends', validateBody(DateRangeSchema), async (c) => {
  try {
    const { start_date, end_date } = c.req.valid('json');
    
    // Get sales trends for custom date range
    const trends = await c.env.DB.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as transaction_count,
        SUM(final_amount) as total_revenue,
        AVG(final_amount) as average_transaction,
        SUM(final_amount - (
          SELECT SUM(si.quantity * p.cost_price)
          FROM sale_items si
          JOIN products p ON si.product_id = p.id
          WHERE si.sale_id = s.id
        )) as total_profit
      FROM sales s
      WHERE DATE(created_at) BETWEEN ? AND ? 
      AND sale_status = 'completed'
      GROUP BY DATE(created_at)
      ORDER BY date
    `).bind(start_date, end_date).all();

    return c.json({
      success: true,
      data: {
        trends: trends.results,
        period: { start_date, end_date }
      },
      message: 'Sales trends retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting sales trends:', error);
    return c.json({
      success: false,
      message: 'Failed to get sales trends',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Get product performance analytics
 * GET /analytics-advanced/products/performance
 */
app.get('/products/performance', async (c) => {
  try {
    const period = c.req.query('period') || 'month';
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);

    let dateFilter = "date('now', '-30 days')";
    switch (period) {
      case 'week':
        dateFilter = "date('now', '-7 days')";
        break;
      case 'quarter':
        dateFilter = "date('now', '-90 days')";
        break;
      case 'year':
        dateFilter = "date('now', '-365 days')";
        break;
    }

    const productPerformance = await c.env.DB.prepare(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.category_id,
        c.name as category_name,
        SUM(si.quantity) as total_sold,
        SUM(si.total_amount) as total_revenue,
        SUM(si.quantity * p.cost_price) as total_cost,
        SUM(si.total_amount - (si.quantity * p.cost_price)) as total_profit,
        AVG(si.unit_price) as average_price,
        COUNT(DISTINCT s.id) as transaction_count,
        p.stock_quantity as current_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN sale_items si ON p.id = si.product_id
      LEFT JOIN sales s ON si.sale_id = s.id AND s.created_at >= ${dateFilter} AND s.sale_status = 'completed'
      WHERE p.is_active = 1
      GROUP BY p.id, p.name, p.sku, p.category_id, c.name, p.stock_quantity
      ORDER BY total_revenue DESC NULLS LAST
      LIMIT ?
    `).bind(limit).all();

    return c.json({
      success: true,
      data: {
        products: productPerformance.results,
        period,
        limit
      },
      message: 'Product performance analytics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting product performance:', error);
    return c.json({
      success: false,
      message: 'Failed to get product performance',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Get category performance analytics
 * GET /analytics-advanced/categories/performance
 */
app.get('/categories/performance', async (c) => {
  try {
    const period = c.req.query('period') || 'month';

    let dateFilter = "date('now', '-30 days')";
    switch (period) {
      case 'week':
        dateFilter = "date('now', '-7 days')";
        break;
      case 'quarter':
        dateFilter = "date('now', '-90 days')";
        break;
      case 'year':
        dateFilter = "date('now', '-365 days')";
        break;
    }

    const categoryPerformance = await c.env.DB.prepare(`
      SELECT 
        c.id,
        c.name,
        c.description,
        COUNT(DISTINCT p.id) as product_count,
        SUM(p.stock_quantity) as total_stock,
        SUM(p.stock_quantity * p.cost_price) as inventory_value,
        COALESCE(SUM(si.quantity), 0) as total_sold,
        COALESCE(SUM(si.total_amount), 0) as total_revenue,
        COALESCE(COUNT(DISTINCT s.id), 0) as transaction_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
      LEFT JOIN sale_items si ON p.id = si.product_id
      LEFT JOIN sales s ON si.sale_id = s.id AND s.created_at >= ${dateFilter} AND s.sale_status = 'completed'
      WHERE c.is_active = 1
      GROUP BY c.id, c.name, c.description
      ORDER BY total_revenue DESC
    `).all();

    return c.json({
      success: true,
      data: {
        categories: categoryPerformance.results,
        period
      },
      message: 'Category performance analytics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting category performance:', error);
    return c.json({
      success: false,
      message: 'Failed to get category performance',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Get real-time business metrics
 * GET /analytics-advanced/realtime
 */
app.get('/realtime', async (c) => {
  try {
    // Get today's metrics
    const todayMetrics = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as sales_today,
        SUM(final_amount) as revenue_today,
        AVG(final_amount) as avg_transaction_today
      FROM sales
      WHERE DATE(created_at) = DATE('now') AND sale_status = 'completed'
    `).first();

    // Get current hour metrics
    const currentHourMetrics = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as sales_this_hour,
        SUM(final_amount) as revenue_this_hour
      FROM sales
      WHERE datetime(created_at) >= datetime('now', 'start of day', '+' || CAST(strftime('%H', 'now') AS INTEGER) || ' hours')
      AND datetime(created_at) < datetime('now', 'start of day', '+' || CAST(strftime('%H', 'now') AS INTEGER) + 1 || ' hours')
      AND sale_status = 'completed'
    `).first();

    // Get inventory alerts
    const inventoryAlerts = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as low_stock_count,
        SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_count
      FROM products
      WHERE is_active = 1 AND stock_quantity <= stock_alert_threshold
    `).first();

    // Get active users (based on recent activity)
    const activeUsers = await c.env.DB.prepare(`
      SELECT COUNT(DISTINCT user_id) as active_users
      FROM user_activities
      WHERE created_at >= datetime('now', '-1 hour')
    `).first();

    return c.json({
      success: true,
      data: {
        sales: {
          today: todayMetrics?.sales_today || 0,
          this_hour: currentHourMetrics?.sales_this_hour || 0
        },
        revenue: {
          today: todayMetrics?.revenue_today || 0,
          this_hour: currentHourMetrics?.revenue_this_hour || 0,
          avg_transaction_today: todayMetrics?.avg_transaction_today || 0
        },
        inventory: {
          low_stock_alerts: inventoryAlerts?.low_stock_count || 0,
          out_of_stock_alerts: inventoryAlerts?.out_of_stock_count || 0
        },
        system: {
          active_users: activeUsers?.active_users || 0,
          timestamp: new Date().toISOString()
        }
      },
      message: 'Real-time metrics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting real-time metrics:', error);
    return c.json({
      success: false,
      message: 'Failed to get real-time metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;
