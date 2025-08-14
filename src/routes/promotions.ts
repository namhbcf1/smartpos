/**
 * Promotions Management Routes
 */

import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { Env, ApiResponse } from '../types';

const app = new Hono<{ Bindings: Env }>();

// Initialize promotions tables if they don't exist
async function initializePromotionsTables(env: Env) {
  try {
    // Check if promotions table exists
    const tableInfo = await env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='promotions'
    `).first();

    if (!tableInfo) {
      console.log('Creating promotions tables...');
      
      // Create promotions table
      await env.DB.prepare(`
        CREATE TABLE promotions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          promotion_type TEXT NOT NULL CHECK (promotion_type IN ('percentage', 'fixed_amount', 'buy_x_get_y', 'free_shipping')),
          discount_value REAL NOT NULL DEFAULT 0,
          minimum_amount REAL DEFAULT 0,
          maximum_discount REAL DEFAULT 0,
          start_date DATETIME NOT NULL,
          end_date DATETIME NOT NULL,
          usage_limit INTEGER DEFAULT 0,
          usage_count INTEGER NOT NULL DEFAULT 0,
          is_active INTEGER NOT NULL DEFAULT 1,
          applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'categories', 'products', 'customers')),
          conditions TEXT,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
        )
      `).run();

      // Create promotion_products table
      await env.DB.prepare(`
        CREATE TABLE promotion_products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          promotion_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          UNIQUE(promotion_id, product_id)
        )
      `).run();

      // Create promotion_categories table
      await env.DB.prepare(`
        CREATE TABLE promotion_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          promotion_id INTEGER NOT NULL,
          category_id INTEGER NOT NULL,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
          UNIQUE(promotion_id, category_id)
        )
      `).run();

      // Create promotion_usage table
      await env.DB.prepare(`
        CREATE TABLE promotion_usage (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          promotion_id INTEGER NOT NULL,
          sale_id INTEGER NOT NULL,
          discount_amount REAL NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
          FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
        )
      `).run();

      // Promotions ready for real data entry through API

      console.log('Promotions tables created');
    }

    console.log('Promotions tables checked/initialized successfully');
  } catch (error) {
    console.log('Promotions tables initialization error:', error);
    throw error;
  }
}

// Public endpoint to initialize promotions tables
app.get('/init-tables', async (c) => {
  try {
    await initializePromotionsTables(c.env);

    return c.json({
      success: true,
      data: null,
      message: 'Promotions tables initialized'
    });
  } catch (error) {
    console.error('Init promotions tables error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Init error: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});

// Test endpoint without auth
app.get('/test', async (c) => {
  try {
    await initializePromotionsTables(c.env);

    const promotions = await c.env.DB.prepare(`
      SELECT id, name, description, promotion_type, discount_value, 
             minimum_amount, is_active, start_date, end_date, usage_count, usage_limit
      FROM promotions
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    return c.json({
      success: true,
      data: promotions.results,
      message: 'Test promotions query successful'
    });
  } catch (error) {
    console.error('Test promotions error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Test error: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});

// GET /promotions - Get all promotions with pagination and filters
app.get('/', async (c) => {
  try {
    await initializePromotionsTables(c.env);

    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const search = c.req.query('search') || '';
    const status = c.req.query('status') || '';
    const type = c.req.query('type') || '';

    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(name LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status === 'active') {
      conditions.push('is_active = 1 AND start_date <= datetime("now") AND end_date >= datetime("now")');
    } else if (status === 'inactive') {
      conditions.push('is_active = 0');
    } else if (status === 'expired') {
      conditions.push('end_date < datetime("now")');
    } else if (status === 'upcoming') {
      conditions.push('start_date > datetime("now")');
    }

    if (type) {
      conditions.push('promotion_type = ?');
      params.push(type);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM promotions ${whereClause}`;
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first<{ total: number }>();
    const total = countResult?.total || 0;

    // Get promotions data
    const promotionsQuery = `
      SELECT
        id, name, description, promotion_type, discount_value,
        minimum_amount, maximum_discount, start_date, end_date,
        usage_limit, usage_count, is_active, applies_to,
        created_at, updated_at
      FROM promotions
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const promotionsResult = await c.env.DB.prepare(promotionsQuery)
      .bind(...params, limit, offset)
      .all();

    return c.json<ApiResponse<{
      data: any[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>>({
      success: true,
      data: {
        data: promotionsResult.results || [],
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      },
      message: 'Lấy danh sách khuyến mãi thành công'
    });
  } catch (error) {
    console.error('Get promotions error:', error);
    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      message: 'Lỗi khi lấy danh sách khuyến mãi'
    }, 500);
  }
});

// POST /promotions - Create new promotion
app.post('/', async (c) => {
  try {
    const data = await c.req.json();

    // Validate required fields
    if (!data.name || !data.promotion_type || !data.start_date || !data.end_date) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Thiếu thông tin bắt buộc'
      }, 400);
    }

    // Validate dates
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);

    if (startDate >= endDate) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Ngày kết thúc phải sau ngày bắt đầu'
      }, 400);
    }

    await initializePromotionsTables(c.env);

    // Insert promotion
    const result = await c.env.DB.prepare(`
      INSERT INTO promotions (
        name, description, promotion_type, discount_value,
        minimum_amount, maximum_discount, start_date, end_date,
        usage_limit, is_active, applies_to, conditions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.name,
      data.description || null,
      data.promotion_type,
      data.discount_value || 0,
      data.minimum_amount || 0,
      data.maximum_discount || 0,
      data.start_date,
      data.end_date,
      data.usage_limit || 0,
      data.is_active !== undefined ? data.is_active : 1,
      data.applies_to || 'all',
      data.conditions ? JSON.stringify(data.conditions) : null
    ).run();

    const promotionId = result.meta.last_row_id as number;

    // Handle product associations
    if (data.applies_to === 'products' && data.product_ids && Array.isArray(data.product_ids)) {
      for (const productId of data.product_ids) {
        await c.env.DB.prepare(`
          INSERT INTO promotion_products (promotion_id, product_id)
          VALUES (?, ?)
        `).bind(promotionId, productId).run();
      }
    }

    // Handle category associations
    if (data.applies_to === 'categories' && data.category_ids && Array.isArray(data.category_ids)) {
      for (const categoryId of data.category_ids) {
        await c.env.DB.prepare(`
          INSERT INTO promotion_categories (promotion_id, category_id)
          VALUES (?, ?)
        `).bind(promotionId, categoryId).run();
      }
    }

    return c.json<ApiResponse<{ id: number }>>({
      success: true,
      data: { id: promotionId },
      message: 'Tạo khuyến mãi thành công'
    });
  } catch (error) {
    console.error('Create promotion error:', error);
    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      message: 'Lỗi khi tạo khuyến mãi'
    }, 500);
  }
});

// GET /promotions/:id - Get promotion details
app.get('/:id', async (c) => {
  try {
    const promotionId = parseInt(c.req.param('id'));

    if (isNaN(promotionId)) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'ID khuyến mãi không hợp lệ'
      }, 400);
    }

    await initializePromotionsTables(c.env);

    // Get promotion details
    const promotion = await c.env.DB.prepare(`
      SELECT * FROM promotions WHERE id = ?
    `).bind(promotionId).first();

    if (!promotion) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Không tìm thấy khuyến mãi'
      }, 404);
    }

    // Get associated products if applicable
    let products = [];
    if (promotion.applies_to === 'products') {
      const productResult = await c.env.DB.prepare(`
        SELECT p.id, p.name, p.sku, p.price
        FROM promotion_products pp
        JOIN products p ON pp.product_id = p.id
        WHERE pp.promotion_id = ?
      `).bind(promotionId).all();
      products = productResult.results || [];
    }

    // Get associated categories if applicable
    let categories = [];
    if (promotion.applies_to === 'categories') {
      const categoryResult = await c.env.DB.prepare(`
        SELECT c.id, c.name
        FROM promotion_categories pc
        JOIN categories c ON pc.category_id = c.id
        WHERE pc.promotion_id = ?
      `).bind(promotionId).all();
      categories = categoryResult.results || [];
    }

    return c.json<ApiResponse<any>>({
      success: true,
      data: {
        ...promotion,
        products,
        categories,
        conditions: promotion.conditions ? JSON.parse(promotion.conditions) : null
      },
      message: 'Lấy chi tiết khuyến mãi thành công'
    });
  } catch (error) {
    console.error('Get promotion details error:', error);
    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      message: 'Lỗi khi lấy chi tiết khuyến mãi'
    }, 500);
  }
});

// PUT /promotions/:id - Update promotion
app.put('/:id', async (c) => {
  try {
    const promotionId = parseInt(c.req.param('id'));
    const data = await c.req.json();

    if (isNaN(promotionId)) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'ID khuyến mãi không hợp lệ'
      }, 400);
    }

    await initializePromotionsTables(c.env);

    // Check if promotion exists
    const existingPromotion = await c.env.DB.prepare(
      'SELECT id FROM promotions WHERE id = ?'
    ).bind(promotionId).first();

    if (!existingPromotion) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Không tìm thấy khuyến mãi'
      }, 404);
    }

    // Validate dates if provided
    if (data.start_date && data.end_date) {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);

      if (startDate >= endDate) {
        return c.json<ApiResponse<null>>({
          success: false,
          data: null,
          message: 'Ngày kết thúc phải sau ngày bắt đầu'
        }, 400);
      }
    }

    // Update promotion
    await c.env.DB.prepare(`
      UPDATE promotions SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        promotion_type = COALESCE(?, promotion_type),
        discount_value = COALESCE(?, discount_value),
        minimum_amount = COALESCE(?, minimum_amount),
        maximum_discount = COALESCE(?, maximum_discount),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        usage_limit = COALESCE(?, usage_limit),
        is_active = COALESCE(?, is_active),
        applies_to = COALESCE(?, applies_to),
        conditions = COALESCE(?, conditions),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      data.name || null,
      data.description || null,
      data.promotion_type || null,
      data.discount_value !== undefined ? data.discount_value : null,
      data.minimum_amount !== undefined ? data.minimum_amount : null,
      data.maximum_discount !== undefined ? data.maximum_discount : null,
      data.start_date || null,
      data.end_date || null,
      data.usage_limit !== undefined ? data.usage_limit : null,
      data.is_active !== undefined ? data.is_active : null,
      data.applies_to || null,
      data.conditions ? JSON.stringify(data.conditions) : null,
      promotionId
    ).run();

    // Update product associations if provided
    if (data.product_ids !== undefined) {
      // Remove existing associations
      await c.env.DB.prepare(
        'DELETE FROM promotion_products WHERE promotion_id = ?'
      ).bind(promotionId).run();

      // Add new associations
      if (Array.isArray(data.product_ids)) {
        for (const productId of data.product_ids) {
          await c.env.DB.prepare(`
            INSERT INTO promotion_products (promotion_id, product_id)
            VALUES (?, ?)
          `).bind(promotionId, productId).run();
        }
      }
    }

    // Update category associations if provided
    if (data.category_ids !== undefined) {
      // Remove existing associations
      await c.env.DB.prepare(
        'DELETE FROM promotion_categories WHERE promotion_id = ?'
      ).bind(promotionId).run();

      // Add new associations
      if (Array.isArray(data.category_ids)) {
        for (const categoryId of data.category_ids) {
          await c.env.DB.prepare(`
            INSERT INTO promotion_categories (promotion_id, category_id)
            VALUES (?, ?)
          `).bind(promotionId, categoryId).run();
        }
      }
    }

    return c.json<ApiResponse<null>>({
      success: true,
      data: null,
      message: 'Cập nhật khuyến mãi thành công'
    });
  } catch (error) {
    console.error('Update promotion error:', error);
    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      message: 'Lỗi khi cập nhật khuyến mãi'
    }, 500);
  }
});

// DELETE /promotions/:id - Delete promotion
app.delete('/:id', async (c) => {
  try {
    const promotionId = parseInt(c.req.param('id'));

    if (isNaN(promotionId)) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'ID khuyến mãi không hợp lệ'
      }, 400);
    }

    await initializePromotionsTables(c.env);

    // Check if promotion exists
    const existingPromotion = await c.env.DB.prepare(
      'SELECT id, usage_count FROM promotions WHERE id = ?'
    ).bind(promotionId).first<{ id: number; usage_count: number }>();

    if (!existingPromotion) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Không tìm thấy khuyến mãi'
      }, 404);
    }

    // Check if promotion has been used
    if (existingPromotion.usage_count > 0) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Không thể xóa khuyến mãi đã được sử dụng'
      }, 400);
    }

    // Delete promotion (cascade will handle related tables)
    await c.env.DB.prepare('DELETE FROM promotions WHERE id = ?').bind(promotionId).run();

    return c.json<ApiResponse<null>>({
      success: true,
      data: null,
      message: 'Xóa khuyến mãi thành công'
    });
  } catch (error) {
    console.error('Delete promotion error:', error);
    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      message: 'Lỗi khi xóa khuyến mãi'
    }, 500);
  }
});

// PUT /promotions/:id/toggle - Toggle promotion active status
app.put('/:id/toggle', async (c) => {
  try {
    const promotionId = parseInt(c.req.param('id'));

    if (isNaN(promotionId)) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'ID khuyến mãi không hợp lệ'
      }, 400);
    }

    await initializePromotionsTables(c.env);

    // Toggle active status
    await c.env.DB.prepare(`
      UPDATE promotions
      SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(promotionId).run();

    return c.json<ApiResponse<null>>({
      success: true,
      data: null,
      message: 'Cập nhật trạng thái khuyến mãi thành công'
    });
  } catch (error) {
    console.error('Toggle promotion status error:', error);
    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      message: 'Lỗi khi cập nhật trạng thái khuyến mãi'
    }, 500);
  }
});

export default app;
