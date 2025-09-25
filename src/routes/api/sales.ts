import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate } from '../../middleware/auth';
import { withValidation } from '../../middleware/validation';
import { IdempotencyMiddleware } from '../../middleware/idempotency';

const app = new Hono<{ Bindings: Env }>();

// Apply authentication middleware to all routes
app.use('*', authenticate);

// GET /api/sales - List sales transactions from orders
app.get('/', withValidation.list, async (c: any) => {
  try {
    // Tables should be created via migrations, not in routes

    const { page = '1', limit = '50', from, to, status } = c.req.query();
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause for filtering (optimized for index usage)
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (from) {
      whereClause += ' AND created_at >= ?';
      params.push(from + ' 00:00:00');
    }

    if (to) {
      whereClause += ' AND created_at <= ?';
      params.push(to + ' 23:59:59');
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    // Query orders table for sales data (unified schema)
    const query = `
      SELECT
        id,
        order_number as transaction_code,
        customer_id,
        customer_name,
        customer_phone,
        subtotal_cents / 100.0 as subtotal,
        discount_cents / 100.0 as discount,
        tax_cents / 100.0 as tax,
        total_cents / 100.0 as final_amount,
        'cash' as payment_method,
        'completed' as payment_status,
        status,
        notes,
        created_at,
        updated_at
      FROM orders
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders
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

// GET /api/sales/summary - Sales summary for dashboard (must come before /:id)
app.get('/summary', async (c: any) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);

    // Today's sales
    const todaySales = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as order_count,
        COALESCE(SUM(total_cents), 0) / 100.0 as revenue,
        COALESCE(AVG(total_cents), 0) / 100.0 as avg_order_value
      FROM orders
      WHERE created_at >= ? AND created_at < ? AND status = 'completed'
    `).bind(today + ' 00:00:00', today + ' 23:59:59').first();

    // This month's sales
    const monthSales = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as order_count,
        COALESCE(SUM(total_cents), 0) / 100.0 as revenue,
        COALESCE(AVG(total_cents), 0) / 100.0 as avg_order_value
      FROM orders
      WHERE created_at >= ? AND created_at < ? AND status = 'completed'
    `).bind(thisMonth + '-01 00:00:00', new Date(new Date(thisMonth + '-01').getFullYear(), new Date(thisMonth + '-01').getMonth() + 1, 1).toISOString().slice(0, 19)).first();

    // Yesterday's sales for comparison
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const yesterdaySales = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as order_count,
        COALESCE(SUM(total_cents), 0) / 100.0 as revenue
      FROM orders
      WHERE created_at >= ? AND created_at < ? AND status = 'completed'
    `).bind(yesterdayStr + ' 00:00:00', yesterdayStr + ' 23:59:59').first();

    // Last month for comparison
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStr = lastMonth.toISOString().slice(0, 7);

    const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1).toISOString().slice(0, 19);
    const lastMonthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 1).toISOString().slice(0, 19);
    const lastMonthSales = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as order_count,
        COALESCE(SUM(total_cents), 0) / 100.0 as revenue
      FROM orders
      WHERE created_at >= ? AND created_at < ? AND status = 'completed'
    `).bind(lastMonthStart, lastMonthEnd).first();

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

// GET /api/sales/:id - Get single sale
app.get('/:id', async (c: any) => {
  try {
    const id = c.req.param('id');

    const sale = await c.env.DB.prepare(`
      SELECT
        id,
        order_number as transaction_code,
        customer_id,
        customer_name,
        customer_phone,
        subtotal_cents / 100.0 as subtotal,
        discount_cents / 100.0 as discount,
        tax_cents / 100.0 as tax,
        total_cents / 100.0 as final_amount,
        'cash' as payment_method,
        'completed' as payment_status,
        status,
        notes,
        created_at,
        updated_at
      FROM orders
      WHERE id = ?
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
        id,
        product_id,
        product_name,
        product_sku,
        quantity,
        unit_price_cents / 100.0 as unit_price,
        total_price_cents / 100.0 as total_price,
        discount_cents / 100.0 as discount_amount
      FROM order_items
      WHERE order_id = ?
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

// POST /api/sales - Create new sale (via unified orders table)
app.post('/', IdempotencyMiddleware.orders, withValidation.createOrder, async (c: any) => {
  try {
    // Tables should be created via migrations, not runtime DDL
    // Migration 006 handles all table creation

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

    // Ensure no undefined values for D1 compatibility
    const cleanCustomerId = customer_id || null;
    const cleanCustomerName = customer_name || null;
    const cleanCustomerPhone = customer_phone || null;
    const cleanCustomerEmail = customer_email || null;
    const cleanNotes = notes || null;

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
      const itemPrice = item.unit_price_cents ? item.unit_price_cents / 100 : (item.unit_price || 0);
      subtotal += item.quantity * itemPrice;
      totalDiscount += (item.discount_amount || 0);
      totalTax += (item.tax_amount || 0);
    }

    const total = subtotal - totalDiscount + totalTax;
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-6)}`;

    // Create order in unified orders table (only insert required columns)
    await c.env.DB.prepare(`
      INSERT INTO orders (
        id, order_number, customer_id, customer_name, customer_phone, user_id, store_id,
        subtotal_cents, discount_cents, tax_cents, total_cents, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      orderId, orderNumber, cleanCustomerId, cleanCustomerName, cleanCustomerPhone, 'user-admin', 'store-1',
      Math.round(subtotal * 100), Math.round(totalDiscount * 100), Math.round(totalTax * 100), Math.round(total * 100), 'completed', cleanNotes
    ).run();

    // Create order items
    for (const item of items) {
      const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      // Ensure no undefined values for D1 compatibility
      const cleanProductId = item.product_id || null;
      const cleanProductName = item.product_name || null;
      const cleanProductSku = item.product_sku || null;
      const cleanQuantity = item.quantity || 0;
      const cleanUnitPrice = item.unit_price || 0;
      const cleanDiscountAmount = item.discount_amount || 0;
      const cleanTaxAmount = item.tax_amount || 0;

      await c.env.DB.prepare(`
        INSERT INTO order_items (
          id, order_id, product_id, product_name, product_sku, quantity,
          unit_price_cents, total_price_cents, discount_cents
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        itemId, orderId, cleanProductId, cleanProductName, cleanProductSku,
        cleanQuantity, Math.round(cleanUnitPrice * 100), Math.round(cleanQuantity * cleanUnitPrice * 100),
        Math.round(cleanDiscountAmount * 100)
      ).run();
    }

    return c.json({
      success: true,
      data: {
        id: orderId,
        order_number: orderNumber,
        total: Math.round(total),
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


// GET /api/sales/stats - Sales statistics
app.get('/stats', async (c: any) => {
  try {
    const { from, to } = c.req.query();

    let whereClause = 'WHERE status = ?';
    const params = ['completed'];

    if (from) {
      whereClause += ' AND created_at >= ?';
      params.push(from + ' 00:00:00');
    }

    if (to) {
      whereClause += ' AND created_at <= ?';
      params.push(to + ' 23:59:59');
    }

    const stats = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as total_orders,
        SUM(total_cents) / 100.0 as total_revenue,
        AVG(total_cents) / 100.0 as avg_order_value,
        SUM(total_cents - subtotal_cents + discount_cents) / 100.0 as total_profit
      FROM orders
      ${whereClause}
    `).bind(...params).first();

    const topProducts = await c.env.DB.prepare(`
      SELECT
        oi.product_name,
        oi.product_sku,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.total_price_cents) / 100.0 as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      ${whereClause.replace('WHERE', 'WHERE o.')}
      GROUP BY oi.product_id, oi.product_name, oi.product_sku
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