import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate } from '../../middleware/auth';

const app = new Hono<{ Bindings: Env }>();

// Apply authentication middleware to all routes
app.use('*', authenticate);

// GET /api/payment-methods - List payment methods
app.get('/', async (c: any) => {
  try {
    const { page = '1', limit = '50' } = c.req.query();
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const query = `
      SELECT
        id, name, code, description, fee_percentage, is_active, created_at
      FROM payment_methods
      WHERE is_active = 1
      ORDER BY name
      LIMIT ? OFFSET ?
    `;

    const result = await c.env.DB.prepare(query).bind(parseInt(limit), offset).all();

    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM payment_methods WHERE is_active = 1
    `).first();

    return c.json({
      success: true,
      data: result.results || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult?.total || 0,
        pages: Math.ceil((countResult?.total || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Payment methods list error:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch payment methods'
    }, 500);
  }
});

// POST /api/payment-methods - Create new payment method
app.post('/', async (c: any) => {
  try {
    const data = await c.req.json();

    const {
      name, code, description, fee_percentage = 0
    } = data;

    if (!name || !code) {
      return c.json({
        success: false,
        message: 'Name and code are required'
      }, 400);
    }

    // Check if code already exists
    const existingCode = await c.env.DB.prepare(`
      SELECT id FROM payment_methods WHERE code = ?
    `).bind(code).first();

    if (existingCode) {
      return c.json({
        success: false,
        message: 'Payment method with this code already exists'
      }, 400);
    }

    // Generate payment method ID
    const paymentMethodId = `pm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Insert payment method
    await c.env.DB.prepare(`
      INSERT INTO payment_methods (
        id, name, code, description, fee_percentage, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, 1, datetime('now'))
    `).bind(
      paymentMethodId, name, code, description || null, fee_percentage
    ).run();

    // Get the created payment method
    const createdPaymentMethod = await c.env.DB.prepare(`
      SELECT * FROM payment_methods WHERE id = ?
    `).bind(paymentMethodId).first();

    return c.json({
      success: true,
      data: createdPaymentMethod,
      message: 'Payment method created successfully'
    }, 201);
  } catch (error) {
    console.error('Payment method creation error:', error);
    return c.json({
      success: false,
      message: 'Failed to create payment method'
    }, 500);
  }
});

// PUT /api/payment-methods/:id - Update payment method
app.put('/:id', async (c: any) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();

    // Check if payment method exists
    const existingPaymentMethod = await c.env.DB.prepare(`
      SELECT id FROM payment_methods WHERE id = ?
    `).bind(id).first();

    if (!existingPaymentMethod) {
      return c.json({
        success: false,
        message: 'Payment method not found'
      }, 404);
    }

    const { name, description, fee_percentage, is_active } = data;

    // Update payment method
    await c.env.DB.prepare(`
      UPDATE payment_methods
      SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        fee_percentage = COALESCE(?, fee_percentage),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).bind(name, description, fee_percentage, is_active, id).run();

    // Get updated payment method
    const updatedPaymentMethod = await c.env.DB.prepare(`
      SELECT * FROM payment_methods WHERE id = ?
    `).bind(id).first();

    return c.json({
      success: true,
      data: updatedPaymentMethod,
      message: 'Payment method updated successfully'
    });
  } catch (error) {
    console.error('Payment method update error:', error);
    return c.json({
      success: false,
      message: 'Failed to update payment method'
    }, 500);
  }
});

export default app;