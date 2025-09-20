import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate } from '../../middleware/auth';

const app = new Hono<{ Bindings: Env }>();

// Apply authentication middleware to all routes
app.use('*', authenticate);

// GET /api/sales - List sales transactions from pos_orders
app.get('/', async (c: any) => {
  try {
    const { page = '1', limit = '50', from, to, status } = c.req.query();
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause for filtering
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (from) {
      whereClause += ' AND DATE(created_at) >= ?';
      params.push(from);
    }

    if (to) {
      whereClause += ' AND DATE(created_at) <= ?';
      params.push(to);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    // Query pos_orders table for sales data
    const query = `
      SELECT
        id,
        order_number as transaction_code,
        customer_id,
        customer_name,
        customer_phone,
        customer_email,
        subtotal,
        discount,
        tax,
        total as final_amount,
        payment_method,
        payment_status,
        status,
        notes,
        created_at,
        updated_at
      FROM pos_orders
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM pos_orders
      ${whereClause}
    `;

    const [result, countResult] = await Promise.all([
      c.env.DB.prepare(query).bind(...params, parseInt(limit), offset).all(),
      c.env.DB.prepare(countQuery).bind(...params).first()
    ]);

    const total = (countResult as any)?.total || 0;
    const totalPages = Math.ceil(total / parseInt(limit));

    return c.json({
      success: true,
      data: result.results || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Sales list error:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch sales data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/sales/:id - Get single sale
app.get('/:id', async (c: any) => {
  try {
    const id = c.req.param('id');

    const sale = await c.env.DB.prepare(`
      SELECT
        p.id,
        p.order_number as transaction_code,
        p.customer_id,
        p.customer_name,
        p.customer_phone,
        p.customer_email,
        p.subtotal,
        p.discount,
        p.tax,
        p.total as final_amount,
        p.payment_method,
        p.payment_status,
        p.amount_paid,
        p.change_given,
        p.reference_number,
        p.status,
        p.notes,
        p.created_at,
        p.updated_at
      FROM pos_orders p
      WHERE p.id = ?
    `).bind(id).first();

    if (!sale) {
      return c.json({
        success: false,
        message: 'Sale not found'
      }, 404);
    }

    // Get order items
    const items = await c.env.DB.prepare(`
      SELECT
        poi.id,
        poi.product_id,
        poi.product_name,
        poi.product_sku,
        poi.quantity,
        poi.unit_price,
        poi.total_price,
        poi.discount_amount,
        poi.tax_amount
      FROM pos_order_items poi
      WHERE poi.order_id = ?
    `).bind(id).all();

    return c.json({
      success: true,
      data: {
        ...sale,
        items: items.results || []
      }
    });
  } catch (error) {
    console.error('Sale detail error:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch sale details',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// POST /api/sales - Create new sale (via pos_orders)
app.post('/', async (c: any) => {
  try {
    const data = await c.req.json();
    const {
      customer_id,
      customer_name,
      customer_phone,
      customer_email,
      items,
      payment_method = 'cash',
      notes
    } = data;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return c.json({
        success: false,
        message: 'Items are required'
      }, 400);
    }

    // Calculate totals
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    for (const item of items) {
      subtotal += item.quantity * item.unit_price;
      totalDiscount += item.discount_amount || 0;
      totalTax += item.tax_amount || 0;
    }

    const total = subtotal - totalDiscount + totalTax;
    const orderId = `pos_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-6)}`;

    // Create pos_order
    await c.env.DB.prepare(`
      INSERT INTO pos_orders (
        id, order_number, tenant_id, customer_id, customer_name, customer_phone, customer_email,
        subtotal, discount, tax, total, payment_method, payment_status, status, notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      orderId, orderNumber, 'default', customer_id, customer_name, customer_phone, customer_email,
      subtotal, totalDiscount, totalTax, total, payment_method, 'completed', 'completed', notes
    ).run();

    // Create order items
    for (const item of items) {
      const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      await c.env.DB.prepare(`
        INSERT INTO pos_order_items (
          id, order_id, product_id, product_name, product_sku, quantity,
          unit_price, total_price, discount_amount, tax_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        itemId, orderId, item.product_id, item.product_name, item.product_sku,
        item.quantity, item.unit_price, item.quantity * item.unit_price,
        item.discount_amount || 0, item.tax_amount || 0
      ).run();
    }

    return c.json({
      success: true,
      data: {
        id: orderId,
        order_number: orderNumber,
        total,
        status: 'completed'
      },
      message: 'Sale created successfully'
    });
  } catch (error) {
    console.error('Create sale error:', error);
    return c.json({
      success: false,
      message: 'Failed to create sale',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/sales/summary - Sales summary for dashboard
app.get('/summary', async (c: any) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);

    // Today's sales
    const todaySales = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as order_count,
        COALESCE(SUM(total), 0) as revenue,
        COALESCE(AVG(total), 0) as avg_order_value
      FROM pos_orders
      WHERE DATE(created_at) = ? AND status = 'completed'
    `).bind(today).first();

    // This month's sales
    const monthSales = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as order_count,
        COALESCE(SUM(total), 0) as revenue,
        COALESCE(AVG(total), 0) as avg_order_value
      FROM pos_orders
      WHERE strftime('%Y-%m', created_at) = ? AND status = 'completed'
    `).bind(thisMonth).first();

    // Yesterday's sales for comparison
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const yesterdaySales = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as order_count,
        COALESCE(SUM(total), 0) as revenue
      FROM pos_orders
      WHERE DATE(created_at) = ? AND status = 'completed'
    `).bind(yesterdayStr).first();

    // Last month for comparison
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStr = lastMonth.toISOString().slice(0, 7);

    const lastMonthSales = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as order_count,
        COALESCE(SUM(total), 0) as revenue
      FROM pos_orders
      WHERE strftime('%Y-%m', created_at) = ? AND status = 'completed'
    `).bind(lastMonthStr).first();

    // Calculate growth rates
    const todayGrowth = yesterdaySales?.revenue > 0
      ? ((todaySales?.revenue - yesterdaySales?.revenue) / yesterdaySales?.revenue * 100)
      : 0;

    const monthGrowth = lastMonthSales?.revenue > 0
      ? ((monthSales?.revenue - lastMonthSales?.revenue) / lastMonthSales?.revenue * 100)
      : 0;

    return c.json({
      success: true,
      data: {
        today: {
          orders: todaySales?.order_count || 0,
          revenue: todaySales?.revenue || 0,
          avg_order_value: todaySales?.avg_order_value || 0,
          growth: Math.round(todayGrowth * 100) / 100
        },
        month: {
          orders: monthSales?.order_count || 0,
          revenue: monthSales?.revenue || 0,
          avg_order_value: monthSales?.avg_order_value || 0,
          growth: Math.round(monthGrowth * 100) / 100
        }
      }
    });
  } catch (error) {
    console.error('Sales summary error:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch sales summary',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/sales/stats - Sales statistics
app.get('/stats', async (c: any) => {
  try {
    const { from, to } = c.req.query();

    let whereClause = 'WHERE status = ?';
    const params = ['completed'];

    if (from) {
      whereClause += ' AND DATE(created_at) >= ?';
      params.push(from);
    }

    if (to) {
      whereClause += ' AND DATE(created_at) <= ?';
      params.push(to);
    }

    const stats = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as total_orders,
        SUM(total) as total_revenue,
        AVG(total) as avg_order_value,
        SUM(total - subtotal + discount) as total_profit
      FROM pos_orders
      ${whereClause}
    `).bind(...params).first();

    const topProducts = await c.env.DB.prepare(`
      SELECT
        poi.product_name,
        poi.product_sku,
        SUM(poi.quantity) as total_quantity,
        SUM(poi.total_price) as total_revenue
      FROM pos_order_items poi
      JOIN pos_orders po ON poi.order_id = po.id
      ${whereClause.replace('WHERE', 'WHERE po.')}
      GROUP BY poi.product_id, poi.product_name, poi.product_sku
      ORDER BY total_quantity DESC
      LIMIT 10
    `).bind(...params).all();

    return c.json({
      success: true,
      data: {
        overview: stats,
        topProducts: topProducts.results || []
      }
    });
  } catch (error) {
    console.error('Sales stats error:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch sales statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;