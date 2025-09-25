import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate } from '../../middleware/auth';

const app = new Hono<{ Bindings: Env }>();

// Apply authentication middleware to all routes
app.use('*', authenticate);

// GET /api/dashboard/stats - Dashboard statistics
app.get('/stats', async (c: any) => {
  try {
    console.log('Dashboard stats request received');

    // Get comprehensive dashboard statistics
    const [salesStats, productsStats, customersStats, ordersStats, recentOrders] = await Promise.all([
      // Sales statistics
      c.env.DB.prepare(`
        SELECT
          COUNT(*) as total_sales,
          COALESCE(SUM(total_cents), 0) / 100.0 as total_revenue,
          COALESCE(AVG(total_cents), 0) / 100.0 as average_sale_value,
          COALESCE(SUM(CASE WHEN DATE(created_at) = DATE('now') THEN total_cents ELSE 0 END), 0) / 100.0 as today_revenue,
          COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as today_sales
        FROM orders
        WHERE status = 'completed'
      `).first().catch(() => ({
        total_sales: 0,
        total_revenue: 0,
        average_sale_value: 0,
        today_revenue: 0,
        today_sales: 0
      })),

      // Products statistics
      c.env.DB.prepare(`
        SELECT
          COUNT(*) as total_products,
          COALESCE(SUM(stock), 0) as total_stock_units,
          COUNT(CASE WHEN stock <= 10 THEN 1 END) as low_stock_products,
          COUNT(CASE WHEN stock = 0 THEN 1 END) as out_of_stock_products,
          COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_products
        FROM products
      `).first().catch(() => ({
        total_products: 0,
        total_stock_units: 0,
        low_stock_products: 0,
        out_of_stock_products: 0,
        active_products: 0
      })),

      // Customers statistics
      c.env.DB.prepare(`
        SELECT
          COUNT(*) as total_customers,
          COUNT(CASE WHEN DATE(created_at) >= DATE('now', '-30 days') THEN 1 END) as new_customers_30d,
          COUNT(CASE WHEN DATE(created_at) >= DATE('now', '-7 days') THEN 1 END) as new_customers_7d,
          COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as new_customers_today
        FROM customers
      `).first().catch(() => ({
        total_customers: 0,
        new_customers_30d: 0,
        new_customers_7d: 0,
        new_customers_today: 0
      })),

      // Orders statistics
      c.env.DB.prepare(`
        SELECT
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
          COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as today_orders
        FROM orders
      `).first().catch(() => ({
        total_orders: 0,
        completed_orders: 0,
        pending_orders: 0,
        cancelled_orders: 0,
        today_orders: 0
      })),

      // Recent orders
      c.env.DB.prepare(`
        SELECT
          id,
          order_number,
          customer_name,
          customer_phone,
          total_cents / 100.0 as total,
          status,
          created_at
        FROM orders
        ORDER BY created_at DESC
        LIMIT 5
      `).all().catch(() => ({ results: [] }))
    ]);

    // Get top selling products
    const topProducts = await c.env.DB.prepare(`
      SELECT
        oi.product_name,
        oi.product_sku,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * oi.unit_price_cents) / 100.0 as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'completed'
        AND o.created_at >= DATE('now', '-30 days')
      GROUP BY oi.product_name, oi.product_sku
      ORDER BY total_sold DESC
      LIMIT 5
    `).all().catch(() => ({ results: [] }));

    // Get sales trend (last 7 days)
    const salesTrend = await c.env.DB.prepare(`
      SELECT
        DATE(created_at) as sale_date,
        COUNT(*) as orders_count,
        SUM(total_cents) / 100.0 as revenue
      FROM orders
      WHERE status = 'completed'
        AND created_at >= DATE('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY sale_date ASC
    `).all().catch(() => ({ results: [] }));

    const dashboardData = {
      overview: {
        sales: salesStats || {
          total_sales: 0,
          total_revenue: 0,
          average_sale_value: 0,
          today_revenue: 0,
          today_sales: 0
        },
        products: productsStats || {
          total_products: 0,
          total_stock_units: 0,
          low_stock_products: 0,
          out_of_stock_products: 0,
          active_products: 0
        },
        customers: customersStats || {
          total_customers: 0,
          new_customers_30d: 0,
          new_customers_7d: 0,
          new_customers_today: 0
        },
        orders: ordersStats || {
          total_orders: 0,
          completed_orders: 0,
          pending_orders: 0,
          cancelled_orders: 0,
          today_orders: 0
        }
      },
      recent_orders: recentOrders?.results || [],
      top_products: topProducts?.results || [],
      sales_trend: salesTrend?.results || [],
      generated_at: new Date().toISOString(),
      period: 'last_30_days'
    };

    console.log('Dashboard stats generated successfully');

    return c.json({
      success: true,
      data: dashboardData,
      message: 'Dashboard statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch dashboard statistics: ' + (error as Error).message,
      data: {
        overview: {
          sales: { total_sales: 0, total_revenue: 0, average_sale_value: 0, today_revenue: 0, today_sales: 0 },
          products: { total_products: 0, total_stock_units: 0, low_stock_products: 0, out_of_stock_products: 0, active_products: 0 },
          customers: { total_customers: 0, new_customers_30d: 0, new_customers_7d: 0, new_customers_today: 0 },
          orders: { total_orders: 0, completed_orders: 0, pending_orders: 0, cancelled_orders: 0, today_orders: 0 }
        },
        recent_orders: [],
        top_products: [],
        sales_trend: [],
        generated_at: new Date().toISOString(),
        period: 'error_fallback'
      }
    }, 500);
  }
});

export default app;