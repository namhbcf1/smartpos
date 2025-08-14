/**
 * Sales Management Routes - Simplified
 */

import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { Env, ApiResponse } from '../types';
import { RealtimeEventBroadcaster } from './websocket';

const app = new Hono<{ Bindings: Env }>();

// Initialize sales tables if they don't exist
async function initializeSalesTables(env: Env) {
  try {
    // Check if sales table exists and has correct schema
    const tableInfo = await env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='sales'
    `).first();

    if (!tableInfo) {
      console.log('Creating sales table...');
      // Create sales table with simplified schema
      await env.DB.prepare(`
        CREATE TABLE sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_name TEXT,
          customer_phone TEXT,
          customer_email TEXT,
          total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          payment_method TEXT NOT NULL DEFAULT 'cash',
          payment_status TEXT NOT NULL DEFAULT 'paid',
          notes TEXT,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
        )
      `).run();
    }

    // Check if sale_items table exists
    const itemsTableInfo = await env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='sale_items'
    `).first();

    if (!itemsTableInfo) {
      console.log('Creating sale_items table...');
      // Create sale_items table
      await env.DB.prepare(`
        CREATE TABLE sale_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sale_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
          total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (sale_id) REFERENCES sales(id),
          FOREIGN KEY (product_id) REFERENCES products(id)
        )
      `).run();
    }

    // Check if inventory_transactions table exists
    const inventoryTableInfo = await env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='inventory_transactions'
    `).first();

    if (!inventoryTableInfo) {
      console.log('Creating inventory_transactions table...');
      // Create inventory_transactions table
      await env.DB.prepare(`
        CREATE TABLE inventory_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL,
          transaction_type TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          reference_number TEXT,
          notes TEXT,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (product_id) REFERENCES products(id)
        )
      `).run();
    }

    // Add employee columns to sales table if they don't exist
    try {
      await env.DB.prepare(`
        ALTER TABLE sales ADD COLUMN cashier_id INTEGER
      `).run();
      console.log('Added cashier_id column to sales table');
    } catch (error) {
      // Column might already exist
      console.log('cashier_id column already exists or error:', error);
    }

    try {
      await env.DB.prepare(`
        ALTER TABLE sales ADD COLUMN sales_agent_id INTEGER
      `).run();
      console.log('Added sales_agent_id column to sales table');
    } catch (error) {
      // Column might already exist
      console.log('sales_agent_id column already exists or error:', error);
    }

    try {
      await env.DB.prepare(`
        ALTER TABLE sales ADD COLUMN commission_amount DECIMAL(10,2) DEFAULT 0
      `).run();
      console.log('Added commission_amount column to sales table');
    } catch (error) {
      // Column might already exist
      console.log('commission_amount column already exists or error:', error);
    }

    console.log('Sales tables checked/initialized successfully');
  } catch (error) {
    console.log('Sales tables initialization error:', error);
    throw error;
  }
}

// Public endpoint to initialize sales tables
app.get('/init-tables', async (c) => {
  try {
    await initializeSalesTables(c.env);

    return c.json({
      success: true,
      data: null,
      message: 'Sales tables initialized'
    });
  } catch (error) {
    console.error('Init sales tables error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Init error: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});

// Public endpoint to initialize sales tables - production ready
app.get('/init-tables', async (c) => {
  try {
    await initializeSalesTables(c.env);

    console.log('Sales tables initialized - ready for real data entry');

    return c.json({
      success: true,
      data: null,
      message: 'Sales tables initialized - ready for real data entry'
    });
  } catch (error) {
    console.error('Init sample sales error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Init error: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});

// Check tables endpoint
app.get('/check-tables', async (c) => {
  try {
    const tables = await c.env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name IN ('sales', 'sale_items')
    `).all();

    // Check sales table schema
    const salesSchema = await c.env.DB.prepare(`
      PRAGMA table_info(sales)
    `).all();

    return c.json({
      success: true,
      data: {
        tables: tables.results,
        salesSchema: salesSchema.results
      },
      message: 'Tables check'
    });
  } catch (error) {
    console.error('Check tables error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Check error: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});

// Simple debug endpoint (no auth)
app.get('/debug', async (c) => {
  try {
    const sales = await c.env.DB.prepare(`
      SELECT id, customer_name, customer_phone, total_amount, payment_method, payment_status, created_at
      FROM sales
      ORDER BY created_at DESC
      LIMIT 10
    `).all();

    return c.json({
      success: true,
      data: sales.results,
      message: 'Debug sales'
    });
  } catch (error) {
    console.error('Debug sales error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Debug error: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});

// Test endpoint without auth
app.get('/test', async (c) => {
  try {
    // Initialize tables first
    try {
      await initializeSalesTables(c.env);
    } catch (initError) {
      console.error('Failed to initialize sales tables:', initError);
      return c.json({
        success: false,
        data: null,
        message: 'Lỗi khởi tạo bảng dữ liệu: ' + (initError instanceof Error ? initError.message : String(initError))
      }, 500);
    }

    // Simple query
    const sales = await c.env.DB.prepare(`
      SELECT id, customer_name, customer_phone, total_amount, payment_method, payment_status, created_at
      FROM sales
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    return c.json({
      success: true,
      data: sales.results,
      message: 'Test sales query successful'
    });
  } catch (error) {
    console.error('Test sales error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Test error: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});



// GET /sales - Simplified sales management (temporarily without auth for debugging)
app.get('/', async (c) => {
  try {
    // Initialize tables first
    try {
      await initializeSalesTables(c.env);
    } catch (initError) {
      console.error('Failed to initialize sales tables:', initError);
      return c.json({
        success: false,
        data: null,
        message: 'Lỗi khởi tạo bảng dữ liệu: ' + (initError instanceof Error ? initError.message : String(initError))
      }, 500);
    }

    // Parse query params manually
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const search = c.req.query('search') || '';
    const payment_method = c.req.query('payment_method') || '';
    const payment_status = c.req.query('payment_status') || '';
    const date_from = c.req.query('date_from') || '';
    const date_to = c.req.query('date_to') || '';

    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions: string[] = [];
    const params: any[] = [];

    if (search && search.trim()) {
      conditions.push('(customer_name LIKE ? OR customer_phone LIKE ? OR customer_email LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (payment_method && payment_method.trim()) {
      conditions.push('payment_method = ?');
      params.push(payment_method);
    }

    if (payment_status && payment_status.trim()) {
      conditions.push('payment_status = ?');
      params.push(payment_status);
    }

    if (date_from && date_from.trim()) {
      conditions.push('DATE(created_at) >= ?');
      params.push(date_from);
    }

    if (date_to && date_to.trim()) {
      conditions.push('DATE(created_at) <= ?');
      params.push(date_to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM sales ${whereClause}`;
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first<{ total: number }>();
    const total = countResult?.total || 0;

    // Get sales data
    const salesQuery = `
      SELECT
        id, customer_name, customer_phone, customer_email,
        total_amount, tax_amount, discount_amount,
        payment_method, payment_status, notes,
        created_at, updated_at
      FROM sales
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const salesResult = await c.env.DB.prepare(salesQuery)
      .bind(...params, limit, offset)
      .all();

    const totalPages = Math.ceil(total / limit);

    return c.json({
      success: true,
      data: {
        data: salesResult.results,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      },
      message: 'Lấy danh sách đơn hàng thành công'
    });
  } catch (error) {
    console.error('Get sales error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Lỗi khi lấy danh sách đơn hàng'
    }, 500);
  }
});

// POST /sales - Simplified sale creation (temporarily without auth for debugging)
app.post('/', authenticate, async (c) => {
  try {
    const data = await c.req.json();
    const user = c.get('jwtPayload');



    // Validate required fields
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Thiếu thông tin sản phẩm trong đơn hàng'
      }, 400);
    }

    // Use D1 batch for transaction-like behavior
    const statements = [];

    try {
      // Validate products and stock
      for (const item of data.items) {
        console.log('Processing item:', JSON.stringify(item, null, 2));

        // Validate item structure
        if (!item.product_id || !item.quantity || !item.unit_price) {
          return c.json<ApiResponse<null>>({
            success: false,
            data: null,
            message: `Thông tin sản phẩm không đầy đủ: ${JSON.stringify(item)}`
          }, 400);
        }

        const product = await c.env.DB.prepare(
          'SELECT id, stock_quantity, price FROM products WHERE id = ? AND is_active = 1'
        ).bind(item.product_id).first<{ id: number; stock_quantity: number; price: number }>();

        console.log('Product found:', product);

        if (!product) {
          return c.json<ApiResponse<null>>({
            success: false,
            data: null,
            message: `Sản phẩm ID ${item.product_id} không tồn tại hoặc không hoạt động`
          }, 400);
        }

        if (product.stock_quantity < item.quantity) {
          return c.json<ApiResponse<null>>({
            success: false,
            data: null,
            message: `Sản phẩm ID ${item.product_id} không đủ hàng tồn kho`
          }, 400);
        }
      }

      // Create sale record first to get ID
      const saleResult = await c.env.DB.prepare(`
        INSERT INTO sales (
          customer_name, customer_phone, customer_email,
          total_amount, tax_amount, discount_amount,
          payment_method, payment_status, notes,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', ?, datetime('now'), datetime('now'))
      `).bind(
        data.customer_name || null,
        data.customer_phone || null,
        data.customer_email || null,
        data.total_amount,
        data.tax_amount,
        data.discount_amount,
        data.payment_method,
        data.notes || null
      ).run();

      const saleId = saleResult.meta.last_row_id as number;

      // Prepare batch statements for sale items, stock updates, and inventory transactions
      const batchStatements = [];

      // Create batch statements for sale items, stock updates, and inventory transactions
      for (const item of data.items) {
        // Sale item statement
        batchStatements.push(
          c.env.DB.prepare(`
            INSERT INTO sale_items (
              sale_id, product_id, quantity, unit_price, total_price, created_at
            ) VALUES (?, ?, ?, ?, ?, datetime('now'))
          `).bind(saleId, item.product_id, item.quantity, item.unit_price, item.total_price)
        );

        // Stock update statement
        batchStatements.push(
          c.env.DB.prepare(
            'UPDATE products SET stock_quantity = stock_quantity - ?, updated_at = datetime(\'now\') WHERE id = ?'
          ).bind(item.quantity, item.product_id)
        );

        // Inventory transaction statement
        batchStatements.push(
          c.env.DB.prepare(`
            INSERT INTO inventory_transactions (
              product_id, transaction_type, quantity, reference_number, notes, created_at
            ) VALUES (?, 'stock_out', ?, ?, ?, datetime('now'))
          `).bind(item.product_id, item.quantity, `SALE-${saleId}`, `Bán hàng - Đơn ${saleId}`)
        );
      }

      // Execute all statements in batch
      await c.env.DB.batch(batchStatements);

      // Broadcast real-time sale event
      try {
        await RealtimeEventBroadcaster.broadcastSaleUpdate(c.env, {
          id: saleId,
          sale_number: `SALE-${saleId}`,
          total_amount: data.total_amount || 0,
          customer_name: data.customer_name || 'Khách lẻ',
          status: 'completed'
        });
        console.log('📡 Broadcasted sale creation event');
      } catch (broadcastError) {
        console.error('❌ Failed to broadcast sale event:', broadcastError);
        // Don't fail the sale creation if broadcasting fails
      }

      return c.json({
        success: true,
        data: { id: saleId, sale_id: saleId },
        message: 'Tạo đơn hàng thành công'
      });
    } catch (error) {
      console.error('Transaction error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Create sale error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return c.json({
      success: false,
      data: null,
      message: `Lỗi khi tạo đơn hàng: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, 500);
  }
});

// GET /sales/:id - Get order details
app.get('/:id', authenticate, async (c) => {
  try {
    const orderId = parseInt(c.req.param('id'));

    if (isNaN(orderId)) {
      return c.json({
        success: false,
        data: null,
        message: 'ID đơn hàng không hợp lệ'
      }, 400);
    }

    // Get order details
    const orderResult = await c.env.DB.prepare(`
      SELECT
        s.id, s.customer_name, s.customer_phone, s.customer_email,
        s.total_amount, s.tax_amount, s.discount_amount,
        s.payment_method, s.payment_status, s.notes,
        s.created_at, s.updated_at
      FROM sales s
      WHERE s.id = ?
    `).bind(orderId).first();

    if (!orderResult) {
      return c.json({
        success: false,
        data: null,
        message: 'Không tìm thấy đơn hàng'
      }, 404);
    }

    // Get order items
    const itemsResult = await c.env.DB.prepare(`
      SELECT
        si.id, si.product_id, si.quantity, si.unit_price, si.total_price,
        p.name as product_name, p.sku as product_sku, p.barcode,
        c.name as category_name
      FROM sale_items si
      LEFT JOIN products p ON si.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE si.sale_id = ?
      ORDER BY si.id
    `).bind(orderId).all();

    return c.json({
      success: true,
      data: {
        order: orderResult,
        items: itemsResult.results
      },
      message: 'Lấy chi tiết đơn hàng thành công'
    });
  } catch (error) {
    console.error('Get order details error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Lỗi khi lấy chi tiết đơn hàng'
    }, 500);
  }
});

// PUT /sales/:id/status - Update order status
app.put('/:id/status', authenticate, async (c) => {
  try {
    const orderId = parseInt(c.req.param('id'));
    const data = await c.req.json();

    if (isNaN(orderId)) {
      return c.json({
        success: false,
        data: null,
        message: 'ID đơn hàng không hợp lệ'
      }, 400);
    }

    const { payment_status, notes } = data;

    if (!payment_status || !['paid', 'pending', 'cancelled'].includes(payment_status)) {
      return c.json({
        success: false,
        data: null,
        message: 'Trạng thái thanh toán không hợp lệ'
      }, 400);
    }

    // Check if order exists
    const existingOrder = await c.env.DB.prepare(
      'SELECT id, payment_status FROM sales WHERE id = ?'
    ).bind(orderId).first();

    if (!existingOrder) {
      return c.json({
        success: false,
        data: null,
        message: 'Không tìm thấy đơn hàng'
      }, 404);
    }

    // Update order status
    await c.env.DB.prepare(`
      UPDATE sales
      SET payment_status = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(payment_status, notes || null, orderId).run();

    return c.json({
      success: true,
      data: {
        id: orderId,
        old_status: existingOrder.payment_status,
        new_status: payment_status
      },
      message: 'Cập nhật trạng thái đơn hàng thành công'
    });
  } catch (error) {
    console.error('Update order status error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Lỗi khi cập nhật trạng thái đơn hàng'
    }, 500);
  }
});

// DELETE /sales/:id - Cancel order
app.delete('/:id', authenticate, async (c) => {
  try {
    const orderId = parseInt(c.req.param('id'));

    if (isNaN(orderId)) {
      return c.json({
        success: false,
        data: null,
        message: 'ID đơn hàng không hợp lệ'
      }, 400);
    }

    // Begin transaction
    await c.env.DB.prepare('BEGIN TRANSACTION').run();

    try {
      // Check if order exists and can be cancelled
      const existingOrder = await c.env.DB.prepare(
        'SELECT id, payment_status FROM sales WHERE id = ?'
      ).bind(orderId).first<{ id: number; payment_status: string }>();

      if (!existingOrder) {
        await c.env.DB.prepare('ROLLBACK').run();
        return c.json({
          success: false,
          data: null,
          message: 'Không tìm thấy đơn hàng'
        }, 404);
      }

      if (existingOrder.payment_status === 'paid') {
        await c.env.DB.prepare('ROLLBACK').run();
        return c.json({
          success: false,
          data: null,
          message: 'Không thể hủy đơn hàng đã thanh toán'
        }, 400);
      }

      // Get order items to restore stock
      const orderItems = await c.env.DB.prepare(`
        SELECT product_id, quantity FROM sale_items WHERE sale_id = ?
      `).bind(orderId).all();

      // Restore stock for each item
      for (const item of orderItems.results as any[]) {
        await c.env.DB.prepare(`
          UPDATE products
          SET stock_quantity = stock_quantity + ?, updated_at = datetime('now')
          WHERE id = ?
        `).bind(item.quantity, item.product_id).run();

        // Create inventory transaction for stock restoration
        await c.env.DB.prepare(`
          INSERT INTO inventory_transactions (
            product_id, transaction_type, quantity, reference_number, notes, created_at
          ) VALUES (?, 'stock_in', ?, ?, ?, datetime('now'))
        `).bind(
          item.product_id,
          item.quantity,
          `CANCEL-${orderId}`,
          `Hủy đơn hàng ${orderId} - Hoàn kho`
        ).run();
      }

      // Update order status to cancelled
      await c.env.DB.prepare(`
        UPDATE sales
        SET payment_status = 'cancelled', updated_at = datetime('now')
        WHERE id = ?
      `).bind(orderId).run();

      await c.env.DB.prepare('COMMIT').run();

      return c.json({
        success: true,
        data: { id: orderId },
        message: 'Hủy đơn hàng thành công'
      });
    } catch (error) {
      await c.env.DB.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error('Cancel order error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Lỗi khi hủy đơn hàng'
    }, 500);
  }
});

// Test endpoint removed - use proper API endpoints

export default app;