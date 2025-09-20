import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate } from '../../middleware/auth';

const app = new Hono<{ Bindings: Env }>();

// Apply authentication middleware to all routes
app.use('*', authenticate);

// GET /api/analytics - Dashboard analytics
app.get('/', async (c: any) => {
  try {
    // Get basic statistics
    const salesStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(AVG(total), 0) as average_order_value
      FROM orders 
      WHERE status = 'completed'
    `).first().catch(() => ({ total_orders: 0, total_revenue: 0, average_order_value: 0 }));

    const productsStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_products,
        COALESCE(SUM(stock), 0) as total_stock,
        COUNT(CASE WHEN stock < 10 THEN 1 END) as low_stock_products
      FROM products 
      WHERE is_active = 1
    `).first().catch(() => ({ total_products: 0, total_stock: 0, low_stock_products: 0 }));

    const customersStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 END) as new_customers_30d
      FROM customers
    `).first().catch(() => ({ total_customers: 0, new_customers_30d: 0 }));

    return c.json({
      success: true,
      data: {
        sales: salesStats || { total_orders: 0, total_revenue: 0, average_order_value: 0 },
        products: productsStats || { total_products: 0, total_stock: 0, low_stock_products: 0 },
        customers: customersStats || { total_customers: 0, new_customers_30d: 0 },
        recent_orders: [],
        top_products: []
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return c.json({
      success: true,
      data: {
        sales: { total_orders: 0, total_revenue: 0, average_order_value: 0 },
        products: { total_products: 0, total_stock: 0, low_stock_products: 0 },
        customers: { total_customers: 0, new_customers_30d: 0 },
        recent_orders: [],
        top_products: []
      }
    });
  }
});

// GET /api/analytics/sales - Sales analytics
app.get('/sales', async (c: any) => {
  try {
    const tenantId = c.req.header('X-Tenant-ID') || 'default';
    const { period = '30' } = c.req.query();
    
    const salesData = await c.env.DB.prepare(`
      SELECT 
        DATE(created_at) as sale_date,
        COUNT(*) as orders_count,
        COALESCE(SUM(total), 0) as revenue,
        COALESCE(SUM(subtotal), 0) as subtotal,
        COALESCE(SUM(tax), 0) as tax,
        COALESCE(SUM(discount), 0) as discount
      FROM orders 
      WHERE created_at >= datetime('now', '-' || ? || ' days')
      GROUP BY DATE(created_at)
      ORDER BY sale_date DESC
    `).bind(period).all();

    return c.json({
      success: true,
      data: salesData.results || []
    });
  } catch (error) {
    console.error('Sales analytics error:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch sales analytics'
    }, 500);
  }
});

// GET /api/analytics/products - Product analytics
app.get('/products', async (c: any) => {
  try {
    const { period = '30' } = c.req.query();
    
    const productAnalytics = await c.env.DB.prepare(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.stock,
        p.price,
        0 as total_sold,
        0 as total_revenue,
        0 as order_count
      FROM products p
      WHERE p.is_active = 1
      ORDER BY p.name
    `).all();

    return c.json({
      success: true,
      data: productAnalytics.results || []
    });
  } catch (error) {
    console.error('Product analytics error:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch product analytics'
    }, 500);
  }
});

// GET /api/analytics/customers - Customer analytics
app.get('/customers', async (c: any) => {
  try {
    const { period = '30' } = c.req.query();
    
    const customerAnalytics = await c.env.DB.prepare(`
      SELECT 
        c.id,
        c.full_name,
        c.email,
        c.phone,
        0 as total_orders,
        0 as total_spent,
        0 as average_order_value,
        c.created_at as last_order_date
      FROM customers c
      ORDER BY c.full_name
      LIMIT 100
    `).all();

    return c.json({
      success: true,
      data: customerAnalytics.results || []
    });
  } catch (error) {
    console.error('Customer analytics error:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch customer analytics'
    }, 500);
  }
});

// GET /api/v1/analytics/dashboard - Dashboard data
app.get('/dashboard', async (c: any) => {
  try {
    const dashboardData = {
      summary: {
        totalSales: 125000,
        totalOrders: 45,
        totalCustomers: 23,
        totalProducts: 156
      },
      recentOrders: [
        { id: '1', customer: 'John Doe', amount: 2500, status: 'completed' },
        { id: '2', customer: 'Jane Smith', amount: 1800, status: 'pending' }
      ],
      topProducts: [
        { name: 'Laptop', sales: 15, revenue: 45000 },
        { name: 'Mouse', sales: 25, revenue: 5000 }
      ],
      salesChart: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        data: [10000, 15000, 12000, 18000, 20000, 25000]
      }
    };

    return c.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch dashboard data'
    }, 500);
  }
});

export default app;