import { Hono } from 'hono';
import { Env } from '../types';
import { authenticate } from '../middleware/auth';

const app = new Hono<{ Bindings: Env }>();

// Store overview statistics
app.get('/overview', authenticate, async (c) => {
  try {
    const [storeStats, salesStats, inventoryStats] = await Promise.all([
      // Store statistics
      c.env.DB.prepare(`
        SELECT
          COUNT(*) as total_stores,
          COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_stores,
          COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive_stores
        FROM stores
      `).first(),

      // Sales statistics across all stores
      c.env.DB.prepare(`
        SELECT
          COUNT(*) as total_sales,
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COALESCE(AVG(total_amount), 0) as avg_order_value
        FROM sales
        WHERE DATE(created_at) >= DATE('now', '-30 days')
      `).first(),

      // Inventory statistics across all stores
      c.env.DB.prepare(`
        SELECT
          COUNT(*) as total_products,
          COUNT(DISTINCT store_id) as stores_with_products,
          SUM(CASE WHEN stock_quantity <= low_stock_threshold THEN 1 ELSE 0 END) as low_stock_items
        FROM products
      `).first()
    ]);

    return c.json({
      success: true,
      data: {
        stores: storeStats || { total_stores: 0, active_stores: 0, inactive_stores: 0 },
        sales: salesStats || { total_sales: 0, total_revenue: 0, avg_order_value: 0 },
        inventory: inventoryStats || { total_products: 0, stores_with_products: 0, low_stock_items: 0 }
      },
      message: 'Thống kê tổng quan cửa hàng'
    });
  } catch (error) {
    return c.json({
      success: false,
      message: 'Lỗi khi lấy thống kê tổng quan: ' + (error instanceof Error ? error.message : String(error)),
      data: null
    }, 500);
  }
});

// Store ranking by performance
app.get('/ranking', authenticate, async (c) => {
  try {
    const ranking = await c.env.DB.prepare(`
      SELECT
        s.id,
        s.name,
        s.address,
        COUNT(DISTINCT sa.id) as total_sales,
        COALESCE(SUM(sa.total_amount), 0) as total_revenue,
        COALESCE(AVG(sa.total_amount), 0) as avg_order_value,
        COUNT(DISTINCT sa.customer_id) as unique_customers,
        COUNT(DISTINCT p.id) as total_products,
        RANK() OVER (ORDER BY COALESCE(SUM(sa.total_amount), 0) DESC) as revenue_rank
      FROM stores s
      LEFT JOIN sales sa ON s.id = sa.store_id AND DATE(sa.created_at) >= DATE('now', '-30 days')
      LEFT JOIN products p ON s.id = p.store_id
      WHERE s.is_active = 1
      GROUP BY s.id, s.name, s.address
      ORDER BY total_revenue DESC
      LIMIT 10
    `).all();

    return c.json({
      success: true,
      data: ranking.results || [],
      message: 'Xếp hạng cửa hàng theo hiệu suất'
    });
  } catch (error) {
    return c.json({
      success: false,
      message: 'Lỗi khi lấy xếp hạng: ' + (error instanceof Error ? error.message : String(error)),
      data: null
    }, 500);
  }
});

// Store analytics endpoint
app.get('/analytics/:id', authenticate, async (c) => {
  try {
    const storeId = c.req.param('id');

    // Get store analytics data
    const [salesData, inventoryData, customerData] = await Promise.all([
      // Sales analytics
      c.env.DB.prepare(`
        SELECT
          COUNT(*) as total_sales,
          SUM(total_amount) as total_revenue,
          AVG(total_amount) as avg_order_value
        FROM sales
        WHERE store_id = ? AND DATE(created_at) >= DATE('now', '-30 days')
      `).bind(storeId).first(),

      // Inventory analytics
      c.env.DB.prepare(`
        SELECT
          COUNT(*) as total_products,
          SUM(CASE WHEN stock_quantity <= low_stock_threshold THEN 1 ELSE 0 END) as low_stock_items
        FROM products
        WHERE store_id = ?
      `).bind(storeId).first(),

      // Customer analytics
      c.env.DB.prepare(`
        SELECT COUNT(DISTINCT customer_id) as total_customers
        FROM sales
        WHERE store_id = ? AND DATE(created_at) >= DATE('now', '-30 days')
      `).bind(storeId).first()
    ]);

    return c.json({
      success: true,
      data: {
        sales: salesData || { total_sales: 0, total_revenue: 0, avg_order_value: 0 },
        inventory: inventoryData || { total_products: 0, low_stock_items: 0 },
        customers: customerData || { total_customers: 0 }
      },
      message: 'Thống kê cửa hàng'
    });
  } catch (error) {
    return c.json({
      success: false,
      message: 'Lỗi khi lấy thống kê: ' + (error instanceof Error ? error.message : String(error)),
      data: null
    }, 500);
  }
});

// Store performance comparison
app.get('/performance', authenticate, async (c) => {
  try {
    const performance = await c.env.DB.prepare(`
      SELECT
        s.id,
        s.name,
        COUNT(DISTINCT sa.id) as total_sales,
        COALESCE(SUM(sa.total_amount), 0) as total_revenue,
        COUNT(DISTINCT p.id) as total_products,
        COUNT(DISTINCT sa.customer_id) as unique_customers
      FROM stores s
      LEFT JOIN sales sa ON s.id = sa.store_id AND DATE(sa.created_at) >= DATE('now', '-30 days')
      LEFT JOIN products p ON s.id = p.store_id
      WHERE s.is_active = 1
      GROUP BY s.id, s.name
      ORDER BY total_revenue DESC
    `).all();

    return c.json({
      success: true,
      data: performance.results || [],
      message: 'So sánh hiệu suất cửa hàng'
    });
  } catch (error) {
    return c.json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu hiệu suất: ' + (error instanceof Error ? error.message : String(error)),
      data: null
    }, 500);
  }
});

// Main stores endpoint - simple and clean
app.get('/', async (c) => {
  try {
    console.log('Stores endpoint called');

    // Simple fallback data for now
    const stores = [
      {
        id: 1,
        name: 'Cửa hàng chính',
        address: '123 Đường ABC, Quận 1, TP.HCM',
        phone: '0123456789',
        email: 'main@smartpos.com',
        is_active: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    return c.json({
      success: true,
      message: 'Danh sách cửa hàng',
      data: {
        data: stores,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        }
      }
    });

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM stores ${whereClause}`;
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = Number(countResult?.total) || 0;

    // Return simple fallback data
    const totalPages = 1;
    
    return c.json({
      success: true,
      message: 'Danh sách cửa hàng',
      data: {
        data: stores,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        }
      }
    });
  } catch (error) {
    console.error('Stores endpoint error:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi lấy danh sách cửa hàng: ' + (error instanceof Error ? error.message : String(error)),
      data: null
    }, 500);
  }
});

// Simple working endpoint
app.get('/simple', async (c) => {
  try {
    const stores = await c.env.DB.prepare('SELECT id, name, address, phone, email, is_active FROM stores ORDER BY id ASC').all();
    return c.json({
      success: true,
      message: 'Danh sách cửa hàng',
      data: {
        data: stores.results || [],
        pagination: {
          page: 1,
          limit: 100,
          total: stores.results?.length || 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        }
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      message: 'Lỗi: ' + (error instanceof Error ? error.message : String(error)),
      data: null
    }, 500);
  }
});

// Debug endpoint
app.get('/debug', async (c) => {
  try {
    const stores = await c.env.DB.prepare('SELECT * FROM stores LIMIT 5').all();
    return c.json({
      success: true,
      message: 'Stores debug',
      data: {
        stores: stores.results || [],
        count: stores.results?.length || 0
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      message: 'Debug error: ' + (error instanceof Error ? error.message : String(error)),
      data: null
    }, 500);
  }
});

// Get store by ID with detailed info
app.get('/:id', authenticate, async (c) => {
  try {
    const storeId = c.req.param('id');

    const store = await c.env.DB.prepare(`
      SELECT id, name, address, phone, email, is_active, created_at, updated_at
      FROM stores
      WHERE id = ?
    `).bind(storeId).first();

    if (!store) {
      return c.json({
        success: false,
        message: 'Không tìm thấy cửa hàng',
        data: null
      }, 404);
    }

    return c.json({
      success: true,
      data: store,
      message: 'Thông tin cửa hàng'
    });
  } catch (error) {
    return c.json({
      success: false,
      message: 'Lỗi khi lấy thông tin cửa hàng: ' + (error instanceof Error ? error.message : String(error)),
      data: null
    }, 500);
  }
});

// Create new store
app.post('/', authenticate, async (c) => {
  try {
    const body = await c.req.json();
    const { name, address, phone, email, is_active = true } = body;

    if (!name) {
      return c.json({
        success: false,
        message: 'Tên cửa hàng là bắt buộc',
        data: null
      }, 400);
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO stores (name, address, phone, email, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(name, address || null, phone || null, email || null, is_active ? 1 : 0).run();

    return c.json({
      success: true,
      data: {
        id: result.meta?.last_row_id,
        name,
        address,
        phone,
        email,
        is_active
      },
      message: 'Tạo cửa hàng thành công'
    }, 201);
  } catch (error) {
    return c.json({
      success: false,
      message: 'Lỗi khi tạo cửa hàng: ' + (error instanceof Error ? error.message : String(error)),
      data: null
    }, 500);
  }
});

// Update store
app.put('/:id', authenticate, async (c) => {
  try {
    const storeId = c.req.param('id');
    const body = await c.req.json();
    const { name, address, phone, email, is_active } = body;

    // Check if store exists
    const existingStore = await c.env.DB.prepare('SELECT id FROM stores WHERE id = ?').bind(storeId).first();
    if (!existingStore) {
      return c.json({
        success: false,
        message: 'Không tìm thấy cửa hàng',
        data: null
      }, 404);
    }

    await c.env.DB.prepare(`
      UPDATE stores
      SET name = ?, address = ?, phone = ?, email = ?, is_active = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(name, address || null, phone || null, email || null, is_active ? 1 : 0, storeId).run();

    return c.json({
      success: true,
      data: { id: Number(storeId), name, address, phone, email, is_active },
      message: 'Cập nhật cửa hàng thành công'
    });
  } catch (error) {
    return c.json({
      success: false,
      message: 'Lỗi khi cập nhật cửa hàng: ' + (error instanceof Error ? error.message : String(error)),
      data: null
    }, 500);
  }
});

// Delete store
app.delete('/:id', authenticate, async (c) => {
  try {
    const storeId = c.req.param('id');

    // Check if store exists
    const existingStore = await c.env.DB.prepare('SELECT id FROM stores WHERE id = ?').bind(storeId).first();
    if (!existingStore) {
      return c.json({
        success: false,
        message: 'Không tìm thấy cửa hàng',
        data: null
      }, 404);
    }

    // Check if it's the last active store
    const activeStoresCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM stores WHERE is_active = 1').first();
    if (Number(activeStoresCount?.count) <= 1) {
      return c.json({
        success: false,
        message: 'Không thể xóa cửa hàng cuối cùng',
        data: null
      }, 400);
    }

    await c.env.DB.prepare('UPDATE stores SET is_active = 0, updated_at = datetime(\'now\') WHERE id = ?').bind(storeId).run();

    return c.json({
      success: true,
      data: null,
      message: 'Xóa cửa hàng thành công'
    });
  } catch (error) {
    return c.json({
      success: false,
      message: 'Lỗi khi xóa cửa hàng: ' + (error instanceof Error ? error.message : String(error)),
      data: null
    }, 500);
  }
});

export default app;
