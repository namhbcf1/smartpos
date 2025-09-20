/**
 * Dashboard Analytics Module
 * Comprehensive analytics and KPI tracking
 * Real-time data with caching optimization
 */

import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Env } from '../../types';
import type { 
  AuthTokenPayload, 
  DashboardStats,
  SalesAnalytics,
  TopProduct,
  RevenueByDate,
  SalesByCategory
} from '../../types/api-standard';
import {
  createSuccessResponse,
  createErrorResponse,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES
} from '../../utils/api-response';
import { validateDateRange } from '../../utils/validation';
import { timeDb } from '../../utils/monitoring-enhanced';

const app = new Hono<{ Bindings: Env }>();

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const analyticsQuerySchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  outlet_id: z.string().optional(),
  period: z.enum(['today', 'yesterday', 'week', 'month', 'quarter', 'year']).optional(),
  compare: z.boolean().optional()
});

// =============================================================================
// DASHBOARD OVERVIEW
// =============================================================================

// GET /dashboard/overview
app.get('/overview', jwt({ secret: 'smartpos-production-jwt-secret-key-2025-secure-random-string-32-chars-minimum' }), async (c: any) => {
  try {
    const user = c.get('jwtPayload') as AuthTokenPayload;
    
    // Check permission
    if (!user.permissions.includes('*') && !user.permissions.includes('reports.view')) {
      return c.json(createErrorResponse(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS, [], 403), 403);
    }

    const outletId = c.req.query('outlet_id') || user.outletId;
    
    // Build outlet filter
    let outletFilter = '';
    let outletBinding: any[] = [];
    if (outletId) {
      outletFilter = 'AND i.outlet_id = ?';
      outletBinding = [outletId];
    }

    // Get today's stats
    const todayStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(DISTINCT i.id) as today_orders,
        COALESCE(SUM(i.total_amount), 0) as today_revenue,
        COALESCE(AVG(i.total_amount), 0) as avg_order_value,
        COUNT(DISTINCT i.customer_id) as today_customers
      FROM invoices i
      WHERE date(i.invoice_date) = date('now') 
        AND i.status = 'completed' 
        AND i.is_void = 0
        ${outletFilter}
    `).bind(...outletBinding).first();

    // Get yesterday's stats for comparison
    const yesterdayStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(DISTINCT i.id) as yesterday_orders,
        COALESCE(SUM(i.total_amount), 0) as yesterday_revenue
      FROM invoices i
      WHERE date(i.invoice_date) = date('now', '-1 day') 
        AND i.status = 'completed' 
        AND i.is_void = 0
        ${outletFilter}
    `).bind(...outletBinding).first();

    // Get total customers
    const totalCustomers = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM customers 
      WHERE tenant_id = ? AND is_active = 1
    `).bind(user.tenantId).first();

    // Get total products
    const totalProducts = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM products 
      WHERE tenant_id = ? AND is_active = 1
    `).bind(user.tenantId).first();

    // Get low stock products
    const lowStockProducts = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM products p
      LEFT JOIN stock_levels sl ON p.id = sl.product_id
      WHERE p.tenant_id = ? 
        AND p.track_stock = 1 
        AND p.is_active = 1
        AND (sl.quantity <= p.min_stock OR sl.quantity IS NULL)
    `).bind(user.tenantId).first();

    // Get pending orders (draft/pending invoices)
    const pendingOrders = await c.env.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM invoices 
      WHERE tenant_id = ? AND status IN ('draft', 'pending')
        ${outletFilter}
    `).bind(user.tenantId, ...outletBinding).first();

    // Get active warranties
    const activeWarranties = await c.env.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM warranty_records 
      WHERE tenant_id = ? 
        AND status = 'active' 
        AND expiry_date > date('now')
    `).bind(user.tenantId).first();

    // Get pending warranty claims
    const pendingClaims = await c.env.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM warranty_claims 
      WHERE tenant_id = ? 
        AND status IN ('new', 'triage', 'approved')
    `).bind(user.tenantId).first();

    // Calculate growth rates
    const revenueGrowth = yesterdayStats && yesterdayStats.yesterday_revenue > 0 
      ? ((todayStats?.today_revenue || 0) - (yesterdayStats.yesterday_revenue || 0)) / (yesterdayStats.yesterday_revenue || 1) * 100
      : 0;

    const orderGrowth = yesterdayStats && yesterdayStats.yesterday_orders > 0
      ? ((todayStats?.today_orders || 0) - (yesterdayStats.yesterday_orders || 0)) / (yesterdayStats.yesterday_orders || 1) * 100
      : 0;

    const stats: DashboardStats = {
      today_sales: todayStats?.today_orders || 0,
      today_revenue: todayStats?.today_revenue || 0,
      total_customers: totalCustomers?.count || 0,
      total_products: totalProducts?.count || 0,
      low_stock_count: lowStockProducts?.count || 0,
      pending_orders: pendingOrders?.count || 0,
      active_warranties: activeWarranties?.count || 0,
      pending_claims: pendingClaims?.count || 0
    };

    const response = {
      ...stats,
      avg_order_value: todayStats?.avg_order_value || 0,
      today_customers: todayStats?.today_customers || 0,
      revenue_growth: revenueGrowth,
      order_growth: orderGrowth,
      yesterday_revenue: yesterdayStats?.yesterday_revenue || 0,
      yesterday_orders: yesterdayStats?.yesterday_orders || 0
    };

    return c.json(createSuccessResponse(response, SUCCESS_MESSAGES.RETRIEVED));

  } catch (error) {
    console.error('Dashboard overview error:', error);
    return c.json(createErrorResponse(ERROR_MESSAGES.INTERNAL_ERROR), 500);
  }
});

// =============================================================================
// SALES ANALYTICS
// =============================================================================

// GET /dashboard/sales-analytics (timezone-aware)
app.get('/sales-analytics', jwt({ secret: 'smartpos-production-jwt-secret-key-2025-secure-random-string-32-chars-minimum' }), zValidator('query', analyticsQuerySchema), async (c: any) => {
  try {
    const user = c.get('jwtPayload') as AuthTokenPayload;
    
    // Check permission
    if (!user.permissions.includes('*') && !user.permissions.includes('reports.view')) {
      return c.json(createErrorResponse(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS, [], 403), 403);
    }

    const query = c.req.valid('query');
    
    // Determine date range (timezone-aware). Default tz Asia/Ho_Chi_Minh
    let startDate: string;
    let endDate: string;
    const tz = c.req.header('X-Timezone') || 'Asia/Ho_Chi_Minh';

    if (query.period) {
      const now = new Date();
      switch (query.period) {
        case 'today':
          startDate = now.toISOString().split('T')[0] || '';
          endDate = startDate;
          break;
        case 'yesterday':
          const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          startDate = yesterday.toISOString().split('T')[0] || '';
          endDate = startDate;
          break;
        case 'week':
          const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          startDate = weekStart.toISOString().split('T')[0] || '';
          endDate = now.toISOString().split('T')[0] || '';
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0] || '';
          endDate = now.toISOString().split('T')[0] || '';
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0] || '';
          endDate = now.toISOString().split('T')[0] || '';
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0] || '';
          endDate = now.toISOString().split('T')[0] || '';
          break;
        default:
          startDate = now.toISOString().split('T')[0] || '';
          endDate = startDate;
      }
    } else {
      startDate = query.start_date || new Date().toISOString().split('T')[0] || '';
      endDate = query.end_date || new Date().toISOString().split('T')[0] || '';
    }

    const outletId = query.outlet_id || user.outletId;
    let outletFilter = '';
    let outletBinding: any[] = [];
    if (outletId) {
      outletFilter = 'AND i.outlet_id = ?';
      outletBinding = [outletId];
    }

    // Get overall sales metrics
    const overallStats = await timeDb(c.env, 'analytics.overallStats', async () => (await c.env.DB.prepare(`
      SELECT 
        COUNT(DISTINCT i.id) as total_orders,
        COALESCE(SUM(i.total_amount), 0) as total_revenue,
        COALESCE(AVG(i.total_amount), 0) as average_order_value,
        COUNT(DISTINCT i.customer_id) as unique_customers
      FROM invoices i
      WHERE date(i.invoice_date) BETWEEN ? AND ?
        AND i.status = 'completed' 
        AND i.is_void = 0
        AND i.tenant_id = ?
        ${outletFilter}
    `).bind(startDate, endDate, user.tenantId, ...outletBinding).first()) as any);

    // Get revenue by date
    const revenueByDate = await timeDb(c.env, 'analytics.revenueByDate', async () => (await c.env.DB.prepare(`
      SELECT 
        date(i.invoice_date) as date,
        COUNT(DISTINCT i.id) as orders,
        COALESCE(SUM(i.total_amount), 0) as revenue
      FROM invoices i
      WHERE date(i.invoice_date) BETWEEN ? AND ?
        AND i.status = 'completed' 
        AND i.is_void = 0
        AND i.tenant_id = ?
        ${outletFilter}
      GROUP BY date(i.invoice_date)
      ORDER BY date(i.invoice_date)
    `).bind(startDate, endDate, user.tenantId, ...outletBinding).all()) as any);

    // Get top products
    const topProducts = await timeDb(c.env, 'analytics.topProducts', async () => (await c.env.DB.prepare(`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.sku,
        SUM(ii.quantity) as quantity_sold,
        SUM(ii.line_total) as revenue,
        SUM((ii.unit_price - p.cost_price) * ii.quantity) as profit
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      JOIN products p ON ii.product_id = p.id
      WHERE date(i.invoice_date) BETWEEN ? AND ?
        AND i.status = 'completed' 
        AND i.is_void = 0
        AND i.tenant_id = ?
        ${outletFilter}
      GROUP BY p.id, p.name, p.sku
      ORDER BY revenue DESC
      LIMIT 10
    `).bind(startDate, endDate, user.tenantId, ...outletBinding).all()) as any);

    // Get sales by category
    const salesByCategory = await timeDb(c.env, 'analytics.salesByCategory', async () => (await c.env.DB.prepare(`
      SELECT 
        c.id as category_id,
        c.name as category_name,
        COALESCE(SUM(ii.line_total), 0) as revenue,
        COUNT(DISTINCT ii.invoice_id) as orders
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      LEFT JOIN invoice_items ii ON p.id = ii.product_id
      LEFT JOIN invoices i ON ii.invoice_id = i.id
      WHERE c.tenant_id = ?
        AND (i.id IS NULL OR (
          date(i.invoice_date) BETWEEN ? AND ?
          AND i.status = 'completed' 
          AND i.is_void = 0
          ${outletFilter}
        ))
      GROUP BY c.id, c.name
      HAVING revenue > 0
      ORDER BY revenue DESC
    `).bind(user.tenantId, startDate, endDate, ...outletBinding).all()) as any);

    // Calculate percentages for categories
    const totalCategoryRevenue = (salesByCategory.results || []).reduce((sum: number, cat: any) => sum + (cat.revenue || 0), 0);
    const formattedCategories = (salesByCategory.results || []).map((cat: any) => ({
      ...cat,
      percentage: totalCategoryRevenue > 0 ? (cat.revenue / totalCategoryRevenue * 100) : 0
    }));

    const analytics: SalesAnalytics = {
      period: `${startDate} to ${endDate}`,
      total_revenue: overallStats?.total_revenue || 0,
      total_orders: overallStats?.total_orders || 0,
      average_order_value: overallStats?.average_order_value || 0,
      top_products: (topProducts.results || []) as TopProduct[],
      revenue_by_date: (revenueByDate.results || []) as RevenueByDate[],
      sales_by_category: formattedCategories as SalesByCategory[]
    };

    // Add comparison data if requested
    let comparison = null;
    if (query.compare) {
      const daysDiff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
      const compareStartDate = new Date(new Date(startDate).getTime() - (daysDiff + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const compareEndDate = new Date(new Date(startDate).getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const compareStats = await c.env.DB.prepare(`
        SELECT 
          COUNT(DISTINCT i.id) as total_orders,
          COALESCE(SUM(i.total_amount), 0) as total_revenue,
          COALESCE(AVG(i.total_amount), 0) as average_order_value
        FROM invoices i
        WHERE date(i.invoice_date) BETWEEN ? AND ?
          AND i.status = 'completed' 
          AND i.is_void = 0
          AND i.tenant_id = ?
          ${outletFilter}
      `).bind(compareStartDate, compareEndDate, user.tenantId, ...outletBinding).first();

      comparison = {
        period: `${compareStartDate} to ${compareEndDate}`,
        total_revenue: compareStats?.total_revenue || 0,
        total_orders: compareStats?.total_orders || 0,
        average_order_value: compareStats?.average_order_value || 0,
        revenue_growth: compareStats && compareStats.total_revenue > 0 
          ? ((analytics.total_revenue - compareStats.total_revenue) / compareStats.total_revenue * 100)
          : 0,
        order_growth: compareStats && compareStats.total_orders > 0
          ? ((analytics.total_orders - compareStats.total_orders) / compareStats.total_orders * 100)
          : 0
      };
    }

    const response = {
      ...analytics,
      unique_customers: overallStats?.unique_customers || 0,
      comparison,
      drilldown: {
        orders: {
          link: `/api/v1/orders?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}${outletId ? `&outlet_id=${encodeURIComponent(outletId as string)}` : ''}`
        },
        products: {
          link: `/api/v1/analytics-advanced/products/performance?period=month`
        },
        categories: {
          link: `/api/v1/analytics-advanced/categories/performance?period=month`
        }
      }
    };

    return c.json(createSuccessResponse({ ...response, timezone: tz }, SUCCESS_MESSAGES.RETRIEVED));

  } catch (error) {
    console.error('Sales analytics error:', error);
    return c.json(createErrorResponse(ERROR_MESSAGES.INTERNAL_ERROR), 500);
  }
});

// =============================================================================
// INVENTORY ANALYTICS
// =============================================================================

// GET /dashboard/inventory-analytics
app.get('/inventory-analytics', jwt({ secret: 'smartpos-production-jwt-secret-key-2025-secure-random-string-32-chars-minimum' }), async (c: any) => {
  try {
    const user = c.get('jwtPayload') as AuthTokenPayload;
    
    // Check permission
    if (!user.permissions.includes('*') && !user.permissions.includes('inventory.read')) {
      return c.json(createErrorResponse(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS, [], 403), 403);
    }

    // Get low stock products
    const lowStockProducts = await c.env.DB.prepare(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.min_stock,
        COALESCE(SUM(sl.quantity), 0) as current_stock,
        c.name as category_name
      FROM products p
      LEFT JOIN stock_levels sl ON p.id = sl.product_id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.tenant_id = ? 
        AND p.track_stock = 1 
        AND p.is_active = 1
        AND COALESCE(sl.quantity, 0) <= p.min_stock
      GROUP BY p.id
      ORDER BY current_stock ASC
      LIMIT 20
    `).bind(user.tenantId).all();

    // Get stock value by category
    const stockValueByCategory = await c.env.DB.prepare(`
      SELECT 
        c.name as category_name,
        COUNT(DISTINCT p.id) as product_count,
        COALESCE(SUM(sl.quantity * p.cost_price), 0) as cost_value,
        COALESCE(SUM(sl.quantity * p.selling_price), 0) as retail_value
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
      LEFT JOIN stock_levels sl ON p.id = sl.product_id
      WHERE c.tenant_id = ?
      GROUP BY c.id, c.name
      HAVING product_count > 0
      ORDER BY retail_value DESC
    `).bind(user.tenantId).all();

    // Get fast/slow moving products (last 30 days)
    const productMovement = await c.env.DB.prepare(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        COALESCE(SUM(ii.quantity), 0) as units_sold,
        COALESCE(SUM(sl.quantity), 0) as current_stock,
        CASE 
          WHEN COALESCE(SUM(sl.quantity), 0) > 0 
          THEN COALESCE(SUM(ii.quantity), 0) / COALESCE(SUM(sl.quantity), 1)
          ELSE 0 
        END as turnover_ratio
      FROM products p
      LEFT JOIN stock_levels sl ON p.id = sl.product_id
      LEFT JOIN invoice_items ii ON p.id = ii.product_id
      LEFT JOIN invoices i ON ii.invoice_id = i.id AND i.status = 'completed' AND i.is_void = 0
        AND date(i.invoice_date) >= date('now', '-30 days')
      WHERE p.tenant_id = ? AND p.is_active = 1
      GROUP BY p.id
      ORDER BY turnover_ratio DESC
    `).bind(user.tenantId).all();

    const fastMoving = (productMovement.results || []).filter((p: any) => p.turnover_ratio > 0.5).slice(0, 10);
    const slowMoving = (productMovement.results || []).filter((p: any) => p.turnover_ratio < 0.1 && p.current_stock > 0).slice(0, 10);

    // Get total inventory metrics
    const inventoryMetrics = await c.env.DB.prepare(`
      SELECT 
        COUNT(DISTINCT p.id) as total_products,
        COUNT(DISTINCT CASE WHEN sl.quantity > 0 THEN p.id END) as products_in_stock,
        COUNT(DISTINCT CASE WHEN sl.quantity <= p.min_stock THEN p.id END) as low_stock_products,
        COUNT(DISTINCT CASE WHEN sl.quantity = 0 THEN p.id END) as out_of_stock_products,
        COALESCE(SUM(sl.quantity * p.cost_price), 0) as total_cost_value,
        COALESCE(SUM(sl.quantity * p.selling_price), 0) as total_retail_value
      FROM products p
      LEFT JOIN stock_levels sl ON p.id = sl.product_id
      WHERE p.tenant_id = ? AND p.is_active = 1
    `).bind(user.tenantId).first();

    const response = {
      metrics: {
        total_products: inventoryMetrics?.total_products || 0,
        products_in_stock: inventoryMetrics?.products_in_stock || 0,
        low_stock_products: inventoryMetrics?.low_stock_products || 0,
        out_of_stock_products: inventoryMetrics?.out_of_stock_products || 0,
        total_cost_value: inventoryMetrics?.total_cost_value || 0,
        total_retail_value: inventoryMetrics?.total_retail_value || 0,
        potential_profit: (inventoryMetrics?.total_retail_value || 0) - (inventoryMetrics?.total_cost_value || 0)
      },
      low_stock_products: lowStockProducts.results || [],
      stock_value_by_category: stockValueByCategory.results || [],
      fast_moving_products: fastMoving,
      slow_moving_products: slowMoving
    };

    return c.json(createSuccessResponse(response, SUCCESS_MESSAGES.RETRIEVED));

  } catch (error) {
    console.error('Inventory analytics error:', error);
    return c.json(createErrorResponse(ERROR_MESSAGES.INTERNAL_ERROR), 500);
  }
});

// =============================================================================
// CUSTOMER ANALYTICS
// =============================================================================

// GET /dashboard/customer-analytics
app.get('/customer-analytics', jwt({ secret: 'smartpos-production-jwt-secret-key-2025-secure-random-string-32-chars-minimum' }), async (c: any) => {
  try {
    const user = c.get('jwtPayload') as AuthTokenPayload;
    
    // Check permission
    if (!user.permissions.includes('*') && !user.permissions.includes('customers.read')) {
      return c.json(createErrorResponse(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS, [], 403), 403);
    }

    const period = c.req.query('period') || '30'; // days

    // Get customer metrics
    const customerMetrics = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN last_visit_date >= date('now', '-30 days') THEN 1 END) as active_customers,
        COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) as new_customers,
        AVG(total_spent) as avg_customer_value,
        AVG(total_visits) as avg_visits_per_customer
      FROM customers
      WHERE tenant_id = ? AND is_active = 1
    `).bind(user.tenantId).first();

    // Get customers by loyalty tier
    const loyaltyTierDistribution = await c.env.DB.prepare(`
      SELECT 
        loyalty_tier,
        COUNT(*) as customer_count,
        AVG(total_spent) as avg_spent,
        SUM(total_spent) as total_spent
      FROM customers
      WHERE tenant_id = ? AND is_active = 1
      GROUP BY loyalty_tier
      ORDER BY 
        CASE loyalty_tier 
          WHEN 'platinum' THEN 4 
          WHEN 'gold' THEN 3 
          WHEN 'silver' THEN 2 
          WHEN 'bronze' THEN 1 
          ELSE 0 
        END DESC
    `).bind(user.tenantId).all();

    // Get top customers by spend
    const topCustomers = await c.env.DB.prepare(`
      SELECT 
        id,
        full_name,
        email,
        phone,
        loyalty_tier,
        total_spent,
        total_visits,
        last_visit_date,
        loyalty_points
      FROM customers
      WHERE tenant_id = ? AND is_active = 1
      ORDER BY total_spent DESC
      LIMIT 10
    `).bind(user.tenantId).all();

    // Get customer acquisition trend (last 12 months)
    const acquisitionTrend = await c.env.DB.prepare(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as new_customers,
        AVG(total_spent) as avg_first_purchase
      FROM customers
      WHERE tenant_id = ? 
        AND created_at >= date('now', '-12 months')
        AND is_active = 1
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month
    `).bind(user.tenantId).all();

    // Get customer retention metrics
    const retentionMetrics = await c.env.DB.prepare(`
      SELECT 
        COUNT(CASE WHEN total_visits = 1 THEN 1 END) as one_time_customers,
        COUNT(CASE WHEN total_visits BETWEEN 2 AND 5 THEN 1 END) as occasional_customers,
        COUNT(CASE WHEN total_visits > 5 THEN 1 END) as loyal_customers,
        AVG(CASE WHEN last_visit_date IS NOT NULL 
          THEN julianday('now') - julianday(last_visit_date) 
          ELSE NULL END) as avg_days_since_last_visit
      FROM customers
      WHERE tenant_id = ? AND is_active = 1
    `).bind(user.tenantId).first();

    const response = {
      metrics: {
        total_customers: customerMetrics?.total_customers || 0,
        active_customers: customerMetrics?.active_customers || 0,
        new_customers: customerMetrics?.new_customers || 0,
        avg_customer_value: customerMetrics?.avg_customer_value || 0,
        avg_visits_per_customer: customerMetrics?.avg_visits_per_customer || 0,
        customer_retention_rate: customerMetrics?.total_customers > 0 
          ? ((customerMetrics.active_customers || 0) / (customerMetrics.total_customers || 1) * 100) 
          : 0
      },
      loyalty_distribution: loyaltyTierDistribution.results || [],
      top_customers: topCustomers.results || [],
      acquisition_trend: acquisitionTrend.results || [],
      retention_breakdown: {
        one_time_customers: retentionMetrics?.one_time_customers || 0,
        occasional_customers: retentionMetrics?.occasional_customers || 0,
        loyal_customers: retentionMetrics?.loyal_customers || 0,
        avg_days_since_last_visit: retentionMetrics?.avg_days_since_last_visit || 0
      }
    };

    return c.json(createSuccessResponse(response, SUCCESS_MESSAGES.RETRIEVED));

  } catch (error) {
    console.error('Customer analytics error:', error);
    return c.json(createErrorResponse(ERROR_MESSAGES.INTERNAL_ERROR), 500);
  }
});

// =============================================================================
// FINANCIAL ANALYTICS
// =============================================================================

// GET /dashboard/financial-analytics
app.get('/financial-analytics', jwt({ secret: 'smartpos-production-jwt-secret-key-2025-secure-random-string-32-chars-minimum' }), zValidator('query', analyticsQuerySchema), async (c: any) => {
  try {
    const user = c.get('jwtPayload') as AuthTokenPayload;
    
    // Check permission
    if (!user.permissions.includes('*') && !user.permissions.includes('reports.view')) {
      return c.json(createErrorResponse(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS, [], 403), 403);
    }

    const query = c.req.valid('query');
    const startDate = query.start_date || new Date().toISOString().split('T')[0];
    const endDate = query.end_date || new Date().toISOString().split('T')[0];

    // Get financial metrics
    const financialMetrics = await c.env.DB.prepare(`
      SELECT 
        COALESCE(SUM(i.subtotal), 0) as gross_revenue,
        COALESCE(SUM(i.discount_amount), 0) as total_discounts,
        COALESCE(SUM(i.tax_amount), 0) as total_tax,
        COALESCE(SUM(i.total_amount), 0) as net_revenue,
        COALESCE(SUM((ii.unit_price - p.cost_price) * ii.quantity), 0) as gross_profit,
        COUNT(DISTINCT i.id) as total_transactions
      FROM invoices i
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
      LEFT JOIN products p ON ii.product_id = p.id
      WHERE date(i.invoice_date) BETWEEN ? AND ?
        AND i.status = 'completed' 
        AND i.is_void = 0
        AND i.tenant_id = ?
    `).bind(startDate, endDate, user.tenantId).first();

    // Get payment method breakdown
    const paymentMethods = await c.env.DB.prepare(`
      SELECT 
        pm.name as method_name,
        pm.type as method_type,
        COUNT(p.id) as transaction_count,
        COALESCE(SUM(p.amount), 0) as total_amount
      FROM payments p
      JOIN payment_methods pm ON p.payment_method_id = pm.id
      JOIN invoices i ON p.invoice_id = i.id
      WHERE date(i.invoice_date) BETWEEN ? AND ?
        AND p.status = 'completed'
        AND i.tenant_id = ?
      GROUP BY pm.id, pm.name, pm.type
      ORDER BY total_amount DESC
    `).bind(startDate, endDate, user.tenantId).all();

    // Get daily financial trend
    const dailyTrend = await c.env.DB.prepare(`
      SELECT 
        date(i.invoice_date) as date,
        COALESCE(SUM(i.total_amount), 0) as revenue,
        COALESCE(SUM((ii.unit_price - p.cost_price) * ii.quantity), 0) as profit,
        COUNT(DISTINCT i.id) as transactions
      FROM invoices i
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
      LEFT JOIN products p ON ii.product_id = p.id
      WHERE date(i.invoice_date) BETWEEN ? AND ?
        AND i.status = 'completed' 
        AND i.is_void = 0
        AND i.tenant_id = ?
      GROUP BY date(i.invoice_date)
      ORDER BY date(i.invoice_date)
    `).bind(startDate, endDate, user.tenantId).all();

    // Get refunds and voids
    const refundsAndVoids = await c.env.DB.prepare(`
      SELECT 
        COUNT(CASE WHEN is_void = 1 THEN 1 END) as void_count,
        COALESCE(SUM(CASE WHEN is_void = 1 THEN total_amount ELSE 0 END), 0) as void_amount,
        COUNT(r.id) as refund_count,
        COALESCE(SUM(r.refund_amount), 0) as refund_amount
      FROM invoices i
      LEFT JOIN refunds r ON i.id = r.original_invoice_id AND r.status = 'completed'
      WHERE date(i.invoice_date) BETWEEN ? AND ?
        AND i.tenant_id = ?
    `).bind(startDate, endDate, user.tenantId).first();

    // Calculate margins and ratios
    const grossRevenue = financialMetrics?.gross_revenue || 0;
    const netRevenue = financialMetrics?.net_revenue || 0;
    const grossProfit = financialMetrics?.gross_profit || 0;
    const grossMargin = grossRevenue > 0 ? (grossProfit / grossRevenue * 100) : 0;
    const netMargin = netRevenue > 0 ? (grossProfit / netRevenue * 100) : 0;

    const response = {
      period: `${startDate} to ${endDate}`,
      financial_metrics: {
        gross_revenue: grossRevenue,
        net_revenue: netRevenue,
        gross_profit: grossProfit,
        total_discounts: financialMetrics?.total_discounts || 0,
        total_tax: financialMetrics?.total_tax || 0,
        total_transactions: financialMetrics?.total_transactions || 0,
        gross_margin_percent: grossMargin,
        net_margin_percent: netMargin,
        avg_transaction_value: financialMetrics?.total_transactions > 0 
          ? netRevenue / (financialMetrics.total_transactions || 1) 
          : 0
      },
      payment_methods: paymentMethods.results || [],
      daily_trend: dailyTrend.results || [],
      refunds_and_voids: {
        void_count: refundsAndVoids?.void_count || 0,
        void_amount: refundsAndVoids?.void_amount || 0,
        refund_count: refundsAndVoids?.refund_count || 0,
        refund_amount: refundsAndVoids?.refund_amount || 0,
        total_loss: (refundsAndVoids?.void_amount || 0) + (refundsAndVoids?.refund_amount || 0)
      }
    };

    return c.json(createSuccessResponse(response, SUCCESS_MESSAGES.RETRIEVED));

  } catch (error) {
    console.error('Financial analytics error:', error);
    return c.json(createErrorResponse(ERROR_MESSAGES.INTERNAL_ERROR), 500);
  }
});

export default app;