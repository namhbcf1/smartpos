import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate } from '../../middleware/auth';

const app = new Hono<{ Bindings: Env }>();

// Apply authentication middleware to all routes
app.use('*', authenticate);

// GET /api/promotions - List promotions
app.get('/', async (c: any) => {
  try {
    const { page = '1', limit = '50', active_only = 'true' } = c.req.query();
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT
        id, name, description, type, value_cents, value_percentage,
        min_amount_cents, max_discount_cents, start_date, end_date,
        usage_limit, usage_count, applicable_to, conditions, is_active,
        created_at, updated_at
      FROM promotions
      WHERE 1=1
    `;
    const params: any[] = [];

    if (active_only === 'true') {
      query += ` AND is_active = 1`;
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const result = await c.env.DB.prepare(query).bind(...params).all();

    let countQuery = `SELECT COUNT(*) as total FROM promotions WHERE 1=1`;
    const countParams: any[] = [];

    if (active_only === 'true') {
      countQuery += ` AND is_active = 1`;
    }

    const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first();

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
    console.error('Promotions list error:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch promotions'
    }, 500);
  }
});

// GET /api/promotions/:id - Get promotion by ID
app.get('/:id', async (c: any) => {
  try {
    const id = c.req.param('id');

    const promotion = await c.env.DB.prepare(`
      SELECT * FROM promotions WHERE id = ?
    `).bind(id).first();

    if (!promotion) {
      return c.json({
        success: false,
        message: 'Promotion not found'
      }, 404);
    }

    return c.json({
      success: true,
      data: promotion
    });
  } catch (error) {
    console.error('Promotion detail error:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch promotion'
    }, 500);
  }
});

// POST /api/promotions - Create new promotion
app.post('/', async (c: any) => {
  try {
    const data = await c.req.json();

    const {
      name, description, type, value_cents, value_percentage,
      min_amount_cents = 0, max_discount_cents, start_date, end_date,
      usage_limit, applicable_to = 'all', conditions
    } = data;

    if (!name || !type) {
      return c.json({
        success: false,
        message: 'Name and type are required'
      }, 400);
    }

    // Validate promotion type
    const validTypes = ['percentage', 'fixed_amount', 'buy_x_get_y'];
    if (!validTypes.includes(type)) {
      return c.json({
        success: false,
        message: 'Invalid promotion type. Must be: percentage, fixed_amount, or buy_x_get_y'
      }, 400);
    }

    // Generate promotion ID
    const promotionId = `promo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Insert promotion
    await c.env.DB.prepare(`
      INSERT INTO promotions (
        id, name, description, type, value_cents, value_percentage,
        min_amount_cents, max_discount_cents, start_date, end_date,
        usage_limit, usage_count, applicable_to, conditions, is_active,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 1, datetime('now'), datetime('now'))
    `).bind(
      promotionId, name, description || null, type, value_cents || null, value_percentage || null,
      min_amount_cents, max_discount_cents || null, start_date || null, end_date || null,
      usage_limit || null, applicable_to, conditions ? JSON.stringify(conditions) : null
    ).run();

    // Get the created promotion
    const createdPromotion = await c.env.DB.prepare(`
      SELECT * FROM promotions WHERE id = ?
    `).bind(promotionId).first();

    return c.json({
      success: true,
      data: createdPromotion,
      message: 'Promotion created successfully'
    }, 201);
  } catch (error) {
    console.error('Promotion creation error:', error);
    return c.json({
      success: false,
      message: 'Failed to create promotion'
    }, 500);
  }
});

// PUT /api/promotions/:id - Update promotion
app.put('/:id', async (c: any) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();

    // Check if promotion exists
    const existingPromotion = await c.env.DB.prepare(`
      SELECT id FROM promotions WHERE id = ?
    `).bind(id).first();

    if (!existingPromotion) {
      return c.json({
        success: false,
        message: 'Promotion not found'
      }, 404);
    }

    const {
      name, description, value_cents, value_percentage, min_amount_cents,
      max_discount_cents, start_date, end_date, usage_limit, applicable_to,
      conditions, is_active
    } = data;

    // Update promotion
    await c.env.DB.prepare(`
      UPDATE promotions
      SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        value_cents = COALESCE(?, value_cents),
        value_percentage = COALESCE(?, value_percentage),
        min_amount_cents = COALESCE(?, min_amount_cents),
        max_discount_cents = COALESCE(?, max_discount_cents),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        usage_limit = COALESCE(?, usage_limit),
        applicable_to = COALESCE(?, applicable_to),
        conditions = COALESCE(?, conditions),
        is_active = COALESCE(?, is_active),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      name, description, value_cents, value_percentage, min_amount_cents,
      max_discount_cents, start_date, end_date, usage_limit, applicable_to,
      conditions ? JSON.stringify(conditions) : null, is_active, id
    ).run();

    // Get updated promotion
    const updatedPromotion = await c.env.DB.prepare(`
      SELECT * FROM promotions WHERE id = ?
    `).bind(id).first();

    return c.json({
      success: true,
      data: updatedPromotion,
      message: 'Promotion updated successfully'
    });
  } catch (error) {
    console.error('Promotion update error:', error);
    return c.json({
      success: false,
      message: 'Failed to update promotion'
    }, 500);
  }
});

export default app;