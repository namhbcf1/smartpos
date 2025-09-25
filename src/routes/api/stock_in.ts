import { Hono } from 'hono';
import { authenticate } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import { z } from 'zod';

const app = new Hono();

// Apply authentication middleware
app.use('*', authenticate);

// Validation schemas
const StockInItemSchema = z.object({
  product_id: z.number().positive(),
  quantity: z.number().positive(),
  cost_price: z.number().min(0),
  serial_numbers: z.array(z.string()).optional().default([])
});

const CreateStockInSchema = z.object({
  supplier_id: z.number().positive(),
  reference_number: z.string().min(1),
  notes: z.string().optional(),
  expected_date: z.string().optional(),
  items: z.array(StockInItemSchema).min(1)
});

const DraftStockInSchema = z.object({
  supplier_id: z.number().positive().optional(),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
  expected_date: z.string().optional(),
  items: z.array(StockInItemSchema).optional().default([])
});

// POST /api/inventory/stock-in/drafts - Save draft
app.post('/drafts', validateRequest({ body: DraftStockInSchema }), async (c: any) => {
  try {
    const body = await c.req.json() as any;
    const user = c.get('jwtPayload') as any;
    
    // Generate reference number if not provided
    const reference_number = body.reference_number || `DRAFT-${Date.now()}`;
    
    // Insert draft into stock_ins table with status 'draft'
    const result = await c.env.DB.prepare(`
      INSERT INTO stock_ins (
        reference_number, supplier_id, user_id, store_id, 
        total_amount, payment_status, payment_amount, payment_method,
        notes, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      reference_number,
      body.supplier_id || null,
      user.id,
      1, // Default store_id
      0, // total_amount
      'pending',
      0, // payment_amount
      'cash',
      body.notes || null,
      'draft'
    ).run();

    const stockInId = result.meta.last_row_id;

    // Insert items if provided
    if (body.items && body.items.length > 0) {
      for (const item of body.items) {
        await (c.env as any).DB.prepare(`
          INSERT INTO stock_in_items (
            stock_in_id, product_id, quantity, cost_price, 
            total_amount, created_at
          ) VALUES (?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          stockInId,
          item.product_id,
          item.quantity,
          item.cost_price,
          item.quantity * item.cost_price
        ).run();

        // Insert serial numbers if provided
        if (item.serial_numbers && item.serial_numbers.length > 0) {
          for (const serial of item.serial_numbers) {
            await (c.env as any).DB.prepare(`
              INSERT INTO serial_numbers (
                product_id, serial_number, status, created_at
              ) VALUES (?, ?, ?, datetime('now'))
            `).bind(item.product_id, serial, 'available').run();
          }
        }
      }
    }

    return c.json({
      success: true,
      data: {
        id: stockInId,
        reference_number,
        status: 'draft'
      }
    });
  } catch (error) {
    console.error('Error saving draft:', error);
    return c.json({
      success: false,
      error: 'Failed to save draft'
    }, 500);
  }
});

// POST /api/inventory/stock-in - Create stock-in
app.post('/', validateRequest({ body: CreateStockInSchema }), async (c: any) => {
  try {
    const body = await c.req.json() as any;
    const user = c.get('jwtPayload') as any;
    
    // Calculate total amount
    const totalAmount = body.items.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.cost_price), 0
    );

    // Insert stock-in record
    const result = await c.env.DB.prepare(`
      INSERT INTO stock_ins (
        reference_number, supplier_id, user_id, store_id, 
        total_amount, payment_status, payment_amount, payment_method,
        notes, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      body.reference_number,
      body.supplier_id,
      user.id,
      1, // Default store_id
      totalAmount,
      'pending',
      totalAmount,
      'cash',
      body.notes || null,
      'completed'
    ).run();

    const stockInId = result.meta.last_row_id;

    // Insert items and update inventory
    for (const item of body.items) {
      const itemTotal = item.quantity * item.cost_price;
      
      // Insert stock-in item
      await (c.env as any).DB.prepare(`
        INSERT INTO stock_in_items (
          stock_in_id, product_id, quantity, cost_price, 
          total_amount, created_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        stockInId,
        item.product_id,
        item.quantity,
        item.cost_price,
        itemTotal
      ).run();

      // Update product stock
      await (c.env as any).DB.prepare(`
        UPDATE products 
        SET stock = stock + ?, cost_price = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(item.quantity, item.cost_price, item.product_id).run();

      // Insert inventory log
      await (c.env as any).DB.prepare(`
        INSERT INTO inventory_logs (
          product_id, delta, reason, reference_id, created_at
        ) VALUES (?, ?, ?, ?, datetime('now'))
      `).bind(
        item.product_id,
        item.quantity,
        'stock_in',
        stockInId
      ).run();

      // Insert serial numbers if provided
      if (item.serial_numbers && item.serial_numbers.length > 0) {
        for (const serial of item.serial_numbers) {
          await (c.env as any).DB.prepare(`
            INSERT INTO serial_numbers (
              product_id, serial_number, status, created_at
            ) VALUES (?, ?, ?, datetime('now'))
          `).bind(item.product_id, serial, 'available').run();
        }
      }
    }

    return c.json({
      success: true,
      data: {
        id: stockInId,
        reference_number: body.reference_number,
        total_amount: totalAmount,
        status: 'completed'
      }
    });
  } catch (error) {
    console.error('Error creating stock-in:', error);
    return c.json({
      success: false,
      error: 'Failed to create stock-in'
    }, 500);
  }
});

// GET /api/inventory/stock-in/:id - Get stock-in detail
app.get('/:id', async (c: any) => {
  try {
    const id = c.req.param('id');
    const user = c.get('jwtPayload') as any;

    // Get stock-in details
    const stockIn = await (c.env as any).DB.prepare(`
      SELECT 
        si.*,
        s.name as supplier_name,
        u.username as user_name
      FROM stock_ins si
      LEFT JOIN suppliers s ON si.supplier_id = s.id
      LEFT JOIN users u ON si.user_id = u.id
      WHERE si.id = ?
    `).bind(id).first();

    if (!stockIn) {
      return c.json({
        success: false,
        error: 'Stock-in not found'
      }, 404);
    }

    // Get stock-in items
    const items = await (c.env as any).DB.prepare(`
      SELECT 
        sii.*,
        p.name as product_name,
        p.sku as product_sku
      FROM stock_in_items sii
      LEFT JOIN products p ON sii.product_id = p.id
      WHERE sii.stock_in_id = ?
    `).bind(id).all();

    return c.json({
      success: true,
      data: {
        ...stockIn,
        items: items.results || []
      }
    });
  } catch (error) {
    console.error('Error fetching stock-in:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch stock-in'
    }, 500);
  }
});

// GET /api/inventory/stock-in - List stock-ins
app.get('/', async (c: any) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const status = c.req.query('status');
    const supplier_id = c.req.query('supplier_id');
    
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    const params: any[] = [];
    
    if (status) {
      whereClause += ' AND si.status = ?';
      params.push(status);
    }
    
    if (supplier_id) {
      whereClause += ' AND si.supplier_id = ?';
      params.push(supplier_id);
    }
    
    // Get stock-ins with pagination
    const stockIns = await (c.env as any).DB.prepare(`
      SELECT 
        si.*,
        s.name as supplier_name,
        u.username as user_name
      FROM stock_ins si
      LEFT JOIN suppliers s ON si.supplier_id = s.id
      LEFT JOIN users u ON si.user_id = u.id
      WHERE ${whereClause}
      ORDER BY si.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all();

    // Get total count
    const totalResult = await (c.env as any).DB.prepare(`
      SELECT COUNT(*) as total
      FROM stock_ins si
      WHERE ${whereClause}
    `).bind(...params).first();

    const total = totalResult?.total || 0;

    return c.json({
      success: true,
      data: {
        stock_ins: stockIns.results || [],
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching stock-ins:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch stock-ins'
    }, 500);
  }
});

// PUT /api/inventory/stock-in/:id - Update stock-in
app.put('/:id', async (c: any) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const user = c.get('jwtPayload') as any;

    // Check if stock-in exists and is editable
    const existing = await (c.env as any).DB.prepare(`
      SELECT status FROM stock_ins WHERE id = ?
    `).bind(id).first();

    if (!existing) {
      return c.json({
        success: false,
        error: 'Stock-in not found'
      }, 404);
    }

    if (existing.status === 'completed') {
      return c.json({
        success: false,
        error: 'Cannot update completed stock-in'
      }, 400);
    }

    // Update stock-in
    await (c.env as any).DB.prepare(`
      UPDATE stock_ins 
      SET 
        reference_number = COALESCE(?, reference_number),
        supplier_id = COALESCE(?, supplier_id),
        notes = COALESCE(?, notes),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      body.reference_number,
      body.supplier_id,
      body.notes,
      id
    ).run();

    return c.json({
      success: true,
      data: { id: parseInt(id) }
    });
  } catch (error) {
    console.error('Error updating stock-in:', error);
    return c.json({
      success: false,
      error: 'Failed to update stock-in'
    }, 500);
  }
});

// DELETE /api/inventory/stock-in/:id - Delete stock-in (only drafts)
app.delete('/:id', async (c: any) => {
  try {
    const id = c.req.param('id');
    const user = c.get('jwtPayload') as any;

    // Check if stock-in exists and is a draft
    const existing = await (c.env as any).DB.prepare(`
      SELECT status FROM stock_ins WHERE id = ?
    `).bind(id).first();

    if (!existing) {
      return c.json({
        success: false,
        error: 'Stock-in not found'
      }, 404);
    }

    if (existing.status !== 'draft') {
      return c.json({
        success: false,
        error: 'Can only delete draft stock-ins'
      }, 400);
    }

    // Delete stock-in items first
    await (c.env as any).DB.prepare(`
      DELETE FROM stock_in_items WHERE stock_in_id = ?
    `).bind(id).run();

    // Delete stock-in
    await (c.env as any).DB.prepare(`
      DELETE FROM stock_ins WHERE id = ?
    `).bind(id).run();

    return c.json({
      success: true,
      data: { id: parseInt(id) }
    });
  } catch (error) {
    console.error('Error deleting stock-in:', error);
    return c.json({
      success: false,
      error: 'Failed to delete stock-in'
    }, 500);
  }
});

export default app;
