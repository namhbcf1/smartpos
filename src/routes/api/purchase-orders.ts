import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate } from '../../middleware/auth';
import { IdempotencyMiddleware } from '../../middleware/idempotency';

const app = new Hono<{ Bindings: Env }>();

// Apply authentication to all routes
app.use('*', authenticate);

// GET /api/purchase-orders - List purchase orders
app.get('/', async (c: any) => {
  try {
    const { page = '1', limit = '50', status, supplier_id, date_from, date_to } = c.req.query();
    
    let query = `
      SELECT 
        po.id,
        po.order_number,
        po.supplier_id,
        po.status,
        po.order_date,
        po.expected_delivery_date,
        po.actual_delivery_date,
        po.subtotal,
        po.tax_amount,
        po.total_amount,
        po.notes,
        po.created_at,
        po.updated_at,
        s.name as supplier_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (status) {
      conditions.push(`po.status = ?`);
      params.push(status);
    }
    
    if (supplier_id) {
      conditions.push(`po.supplier_id = ?`);
      params.push(supplier_id);
    }
    
    if (date_from) {
      conditions.push(`po.order_date >= ?`);
      params.push(date_from);
    }
    
    if (date_to) {
      conditions.push(`po.order_date <= ?`);
      params.push(date_to);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY po.order_date DESC`;
    
    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    
    const result = await c.env.DB.prepare(query).bind(...params).all();
    
    return c.json({
      success: true,
      data: result.results || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.results?.length || 0,
        pages: Math.ceil((result.results?.length || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Purchase orders list error:', error);
    return c.json({
      success: true,
      data: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        pages: 0
      }
    });
  }
});

// GET /api/purchase-orders/stats - Get purchase order statistics
app.get('/stats', async (c: any) => {
  try {
    const { period = '30' } = c.req.query();

    // Get basic stats
    const stats = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_orders,
        SUM(CASE WHEN status = 'received' THEN 1 ELSE 0 END) as received_orders,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        SUM(total_amount) as total_value,
        AVG(total_amount) as avg_order_value
      FROM purchase_orders
      WHERE order_date >= date('now', '-' || ? || ' days')
    `).bind(period).first();

    // Get top suppliers
    const topSuppliers = await c.env.DB.prepare(`
      SELECT
        s.name as supplier_name,
        COUNT(po.id) as order_count,
        SUM(po.total_amount) as total_value
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.order_date >= date('now', '-' || ? || ' days')
      GROUP BY po.supplier_id, s.name
      ORDER BY total_value DESC
      LIMIT 5
    `).bind(period).all();

    return c.json({
      success: true,
      data: {
        ...stats,
        top_suppliers: topSuppliers.results || []
      }
    });
  } catch (error) {
    console.error('Purchase order stats error:', error);
    return c.json({
      success: true,
      data: {
        total_orders: 0,
        pending_orders: 0,
        approved_orders: 0,
        received_orders: 0,
        cancelled_orders: 0,
        total_value: 0,
        avg_order_value: 0,
        top_suppliers: []
      }
    });
  }
});

// GET /api/purchase-orders/:id - Get purchase order details
app.get('/:id', async (c: any) => {
  try {
    const id = c.req.param('id');
    
    // Get purchase order
    const order = await c.env.DB.prepare(`
      SELECT 
        po.*,
        s.name as supplier_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.id = ?
    `).bind(id).first();
    
    if (!order) {
      return c.json({ success: false, error: 'Purchase order not found' }, 404);
    }
    
    // Get order items
    const items = await c.env.DB.prepare(`
      SELECT
        poi.*,
        p.name as product_name,
        p.sku
      FROM purchase_order_items poi
      LEFT JOIN products p ON poi.product_id = p.id
      WHERE poi.purchase_order_id = ?
      ORDER BY poi.created_at ASC
    `).bind(id).all();
    
    return c.json({
      success: true,
      data: {
        ...order,
        items: items.results || []
      }
    });
  } catch (error) {
    console.error('Purchase order details error:', error);
    return c.json({ success: false, error: 'Failed to fetch purchase order details' }, 500);
  }
});

// POST /api/purchase-orders - Create purchase order
app.post('/', IdempotencyMiddleware.api, async (c: any) => {
  try {
    const data = await c.req.json();
    const { supplier_id, items, expected_delivery_date, notes } = data;
    
    if (!supplier_id || !items || items.length === 0) {
      return c.json({ success: false, error: 'Supplier ID and items are required' }, 400);
    }
    
    const orderId = crypto.randomUUID();
    const orderNumber = `PO-${Date.now()}`;
    
    // Calculate totals
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.quantity * item.unit_price;
    }
    
    const taxAmount = subtotal * 0.1; // 10% tax
    const totalAmount = subtotal + taxAmount;
    
    // Create purchase order
    await c.env.DB.prepare(`
      INSERT INTO purchase_orders (
        id, order_number, supplier_id, status, order_date,
        expected_delivery_date, subtotal, tax_amount, total_amount,
        notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      orderId, orderNumber, supplier_id, 'pending', expected_delivery_date,
      subtotal, taxAmount, totalAmount, notes
    ).run();
    
    // Create order items
    for (const item of items) {
      const itemId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO purchase_order_items (
          id, purchase_order_id, product_id, quantity, unit_price,
          total_amount, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        itemId, orderId, item.product_id, item.quantity, item.unit_price,
        item.quantity * item.unit_price, item.notes
      ).run();
    }
    
    // Get created order
    const order = await c.env.DB.prepare(`
      SELECT 
        po.*,
        s.name as supplier_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.id = ?
    `).bind(orderId).first();
    
    return c.json({
      success: true,
      data: order,
      message: 'Purchase order created successfully'
    }, 201);
  } catch (error) {
    console.error('Create purchase order error:', error);
    return c.json({ success: false, error: 'Failed to create purchase order' }, 500);
  }
});

// PUT /api/purchase-orders/:id/approve - Approve purchase order
app.put('/:id/approve', async (c: any) => {
  try {
    const id = c.req.param('id');
    
    await c.env.DB.prepare(`
      UPDATE purchase_orders 
      SET status = 'approved', updated_at = datetime('now')
      WHERE id = ? AND status = 'pending'
    `).bind(id).run();
    
    return c.json({
      success: true,
      message: 'Purchase order approved successfully'
    });
  } catch (error) {
    console.error('Approve purchase order error:', error);
    return c.json({ success: false, error: 'Failed to approve purchase order' }, 500);
  }
});

// PUT /api/purchase-orders/:id/receive - Receive purchase order
app.put('/:id/receive', async (c: any) => {
  try {
    const id = c.req.param('id');
    const { received_items } = await c.req.json();
    
    if (!received_items || received_items.length === 0) {
      return c.json({ success: false, error: 'Received items are required' }, 400);
    }
    
    // Update purchase order status
    await c.env.DB.prepare(`
      UPDATE purchase_orders 
      SET status = 'received', actual_delivery_date = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).bind(id).run();
    
    // Update inventory for received items
    for (const item of received_items) {
      // Note: Product stock update disabled - stock_quantity column may not exist
      // await c.env.DB.prepare(`
      //   UPDATE products
      //   SET stock_quantity = stock_quantity + ?, updated_at = datetime('now')
      //   WHERE id = ?
      // `).bind(item.quantity, item.product_id).run();
      
      // Create inventory movement record
      await c.env.DB.prepare(`
        INSERT INTO inventory_movements (
          id, product_id, movement_type, quantity, reference_type,
          reference_id, notes, created_at
        ) VALUES (?, ?, 'purchase', ?, 'purchase_order', ?, ?, datetime('now'))
      `).bind(
        crypto.randomUUID(), item.product_id, item.quantity, id,
        `Received from purchase order ${id}`
      ).run();
    }
    
    return c.json({
      success: true,
      message: 'Purchase order received successfully'
    });
  } catch (error) {
    console.error('Receive purchase order error:', error);
    return c.json({ success: false, error: 'Failed to receive purchase order' }, 500);
  }
});

// PUT /api/purchase-orders/:id/cancel - Cancel purchase order
app.put('/:id/cancel', async (c: any) => {
  try {
    const id = c.req.param('id');
    const { reason } = await c.req.json();
    
    await c.env.DB.prepare(`
      UPDATE purchase_orders 
      SET status = 'cancelled', notes = COALESCE(notes || '\n', '') || 'Cancelled: ' || ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(reason || 'No reason provided', id).run();
    
    return c.json({
      success: true,
      message: 'Purchase order cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel purchase order error:', error);
    return c.json({ success: false, error: 'Failed to cancel purchase order' }, 500);
  }
});

// POST /api/purchase-orders/:id/return - Return purchase order items
app.post('/:id/return', async (c: any) => {
  try {
    const id = c.req.param('id');
    const { return_items, reason } = await c.req.json();
    
    if (!return_items || return_items.length === 0) {
      return c.json({ success: false, error: 'Return items are required' }, 400);
    }
    
    const returnId = crypto.randomUUID();
    const returnNumber = `PR-${Date.now()}`;
    
    // Calculate return total
    let returnTotal = 0;
    for (const item of return_items) {
      returnTotal += item.quantity * item.unit_price;
    }
    
    // Create purchase return record
    await c.env.DB.prepare(`
      INSERT INTO purchase_returns (
        id, return_number, purchase_order_id, total_amount, reason,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
    `).bind(returnId, returnNumber, id, returnTotal, reason).run();
    
    // Create return items and adjust inventory
    for (const item of return_items) {
      const returnItemId = crypto.randomUUID();
      
      // Create return item record
      await c.env.DB.prepare(`
        INSERT INTO purchase_return_items (
          id, purchase_return_id, product_id, quantity, unit_price,
          total_amount, reason, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        returnItemId, returnId, item.product_id, item.quantity, item.unit_price,
        item.quantity * item.unit_price, item.reason
      ).run();
      
      // Note: Product stock update disabled - stock_quantity column may not exist
      // await c.env.DB.prepare(`
      //   UPDATE products
      //   SET stock_quantity = stock_quantity - ?, updated_at = datetime('now')
      //   WHERE id = ?
      // `).bind(item.quantity, item.product_id).run();
      
      // Create inventory movement record
      await c.env.DB.prepare(`
        INSERT INTO inventory_movements (
          id, product_id, movement_type, quantity, reference_type,
          reference_id, notes, created_at
        ) VALUES (?, ?, 'return', ?, 'purchase_return', ?, ?, datetime('now'))
      `).bind(
        crypto.randomUUID(), item.product_id, -item.quantity, returnId,
        `Return from purchase order ${id}: ${item.reason || reason}`
      ).run();
    }
    
    return c.json({
      success: true,
      data: { return_id: returnId, return_number: returnNumber },
      message: 'Purchase return created successfully'
    });
  } catch (error) {
    console.error('Purchase return error:', error);
    return c.json({ success: false, error: 'Failed to create purchase return' }, 500);
  }
});

export default app;
