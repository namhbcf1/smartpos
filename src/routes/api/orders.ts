import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate, getUser } from '../../middleware/auth';

const app = new Hono<{ Bindings: Env }>();

// Apply authentication middleware to all routes
app.use('*', authenticate);

// GET /api/orders - List orders with filtering
app.get('/', async (c: any) => {
  try {
    const { from, to, status, q, page = '1', limit = '50' } = c.req.query();

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT
        o.id,
        o.order_number,
        o.customer_id,
        o.customer_name,
        o.customer_phone,
        o.customer_email,
        o.status,
        o.subtotal,
        o.discount,
        o.tax,
        o.total,
        o.payment_method,
        o.payment_status,
        o.notes,
        o.created_at,
        o.updated_at
      FROM pos_orders o
      WHERE 1=1
    `;
    const params = [];

    if (from) {
      query += ` AND DATE(o.created_at) >= ?`;
      params.push(from);
    }

    if (to) {
      query += ` AND DATE(o.created_at) <= ?`;
      params.push(to);
    }

    if (status) {
      query += ` AND o.status = ?`;
      params.push(status);
    }

    if (q) {
      query += ` AND (o.order_number LIKE ? OR o.customer_name LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`);
    }

    query += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset.toString());

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total FROM pos_orders o
      WHERE 1=1
    `;
    const countParams = [];

    if (from) {
      countQuery += ` AND DATE(o.created_at) >= ?`;
      countParams.push(from);
    }

    if (to) {
      countQuery += ` AND DATE(o.created_at) <= ?`;
      countParams.push(to);
    }

    if (status) {
      countQuery += ` AND o.status = ?`;
      countParams.push(status);
    }

    if (q) {
      countQuery += ` AND (o.order_number LIKE ? OR o.customer_name LIKE ?)`;
      countParams.push(`%${q}%`, `%${q}%`);
    }

    const [result, countResult] = await Promise.all([
      c.env.DB.prepare(query).bind(...params).all(),
      c.env.DB.prepare(countQuery).bind(...countParams).first()
    ]);

    const total = countResult?.total || 0;
    const totalPages = Math.ceil(total / parseInt(limit));

    return c.json({
      success: true,
      data: result.results || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Orders list error:', error);
    return c.json({ success: false, error: 'Failed to fetch orders' }, 500);
  }
});

// GET /api/orders/:id - Get order details
app.get('/:id', async (c: any) => {
  try {
    const { id } = c.req.param();
    const order = await c.env.DB.prepare(`
      SELECT
        o.id,
        o.order_number,
        o.customer_id,
        o.customer_name,
        o.customer_phone,
        o.customer_email,
        o.status,
        o.subtotal,
        o.discount,
        o.tax,
        o.total,
        o.payment_method,
        o.payment_status,
        o.notes,
        o.created_at,
        o.updated_at
      FROM pos_orders o
      WHERE o.id = ? OR o.order_number = ?
    `).bind(id, id).first();

    if (!order) {
      return c.json({ success: false, message: 'Order not found' }, 404);
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
        ...order,
        items: items.results || []
      }
    });
  } catch (error) {
    console.error('Order get error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch order: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});

// POST /api/orders - Create order
app.post('/', async (c: any) => {
  try {
    const body = await c.req.json();
    const user = getUser(c);

    console.log('Order creation request:', JSON.stringify(body, null, 2));

    // Generate IDs
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const orderNumber = `ORD-${Date.now()}`;

    // Insert order with schema-compliant columns
    const insertSql = `
      INSERT INTO orders (
        id, order_number, customer_id, user_id, store_id, status,
        subtotal_cents, discount_cents, tax_cents, total_cents, notes,
        receipt_printed, customer_name, customer_phone,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `;

    const bindValues = [
      orderId,
      orderNumber,
      body.customer_id || null,
      user?.id || body.user_id || 'admin',
      body.store_id || 'store-1',
      body.status || 'pending',
      body.subtotal_cents || 0,
      body.discount_cents || 0,
      body.tax_cents || 0,
      body.total_cents || 0,
      body.notes || null,
      0, // receipt_printed default
      body.customer_name || null,
      body.customer_phone || null
    ];

    await c.env.DB.prepare(insertSql).bind(...bindValues).run();

    // Insert order items if provided
    if (body.items && Array.isArray(body.items)) {
      for (const item of body.items) {
        const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        await c.env.DB.prepare(`
          INSERT INTO order_items (
            id, order_id, product_id, variant_id, quantity,
            unit_price_cents, total_price_cents, discount_cents,
            product_name, product_sku, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          itemId,
          orderId,
          item.product_id,
          item.variant_id || null,
          item.quantity || 1,
          item.unit_price_cents || 0,
          item.total_price_cents || 0,
          item.discount_cents || 0,
          item.product_name || '',
          item.product_sku || ''
        ).run();
      }
    }

    // Get the created order with items
    const orderData = await c.env.DB.prepare(`
      SELECT
        o.id,
        o.order_number,
        o.customer_id,
        o.user_id,
        o.store_id,
        o.status,
        o.subtotal_cents,
        o.discount_cents,
        o.tax_cents,
        o.total_cents,
        o.notes,
        o.receipt_printed,
        o.customer_name,
        o.customer_phone,
        o.created_at,
        o.updated_at
      FROM orders o WHERE o.id = ?
    `).bind(orderId).first();

    console.log('Order created successfully:', orderId);

    return c.json({
      success: true,
      data: orderData,
      message: 'Order created successfully'
    }, 201);

  } catch (error) {
    console.error('Order create error:', error);
    return c.json({
      success: false,
      error: `Failed to create order: ${error instanceof Error ? error.message : String(error)}`
    }, 500);
  }
});

// PUT /api/orders/:id - Update order
app.put('/:id', async (c: any) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    // Check if order exists
    const existingOrder = await c.env.DB.prepare(`
      SELECT id FROM orders WHERE id = ?
    `).bind(id).first();

    if (!existingOrder) {
      return c.json({
        success: false,
        message: 'Order not found'
      }, 404);
    }

    // Update order
    await c.env.DB.prepare(`
      UPDATE orders
      SET
        customer_id = COALESCE(?, customer_id),
        status = COALESCE(?, status),
        subtotal_cents = COALESCE(?, subtotal_cents),
        discount_cents = COALESCE(?, discount_cents),
        tax_cents = COALESCE(?, tax_cents),
        total_cents = COALESCE(?, total_cents),
        notes = COALESCE(?, notes),
        customer_name = COALESCE(?, customer_name),
        customer_phone = COALESCE(?, customer_phone),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      body.customer_id,
      body.status,
      body.subtotal_cents,
      body.discount_cents,
      body.tax_cents,
      body.total_cents,
      body.notes,
      body.customer_name,
      body.customer_phone,
      id
    ).run();

    return c.json({
      success: true,
      message: 'Order updated successfully'
    });
  } catch (error) {
    console.error('Order update error:', error);
    return c.json({
      success: false,
      message: 'Failed to update order'
    }, 500);
  }
});

// POST /api/orders/:id/fulfill - Fulfill order
app.post('/:id/fulfill', async (c: any) => {
  try {
    const id = c.req.param('id');

    const updated = await c.env.DB.prepare(`
      UPDATE orders SET status = 'fulfilled', updated_at = datetime('now')
      WHERE id = ?
    `).bind(id).run();

    if (!updated.success) {
      return c.json({ success: false, message: 'Failed to fulfill order' }, 500);
    }

    const order = await c.env.DB.prepare(`
      SELECT * FROM orders WHERE id = ?
    `).bind(id).first();

    if (!order) {
      return c.json({ success: false, message: 'Order not found' }, 404);
    }

    return c.json({
      success: true,
      data: order,
      message: 'Order fulfilled successfully'
    });
  } catch (error) {
    console.error('Order fulfill error:', error);
    return c.json({ success: false, error: 'Failed to fulfill order' }, 500);
  }
});

// POST /api/orders/:id/print - Generate receipt
app.post('/:id/print', async (c: any) => {
  try {
    const { id } = c.req.param();

    const order = await c.env.DB.prepare(`
      SELECT id, order_number, total_cents FROM orders WHERE id = ?
    `).bind(id).first();

    if (!order) {
      return c.json({ success: false, message: 'Order not found' }, 404);
    }

    // Mark as printed
    await c.env.DB.prepare(`
      UPDATE orders SET receipt_printed = 1, updated_at = datetime('now') WHERE id = ?
    `).bind(id).run();

    const receiptUrl = `https://pos-frontend-bangachieu2.pages.dev/receipts/${id}.pdf`;

    return c.json({
      success: true,
      data: {
        receipt_url: receiptUrl,
        order_number: order.order_number,
        total_cents: order.total_cents
      }
    });
  } catch (error) {
    console.error('Order print error:', error);
    return c.json({ success: false, error: 'Failed to generate receipt' }, 500);
  }
});

export default app;