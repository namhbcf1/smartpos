/**
 * Inventory Management Routes - Simplified
 * 
 * Quản lý kho hàng cho ComputerPOS Pro
 * Tuân thủ 100% rules.md - Real D1 database integration
 */

import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { Env, ApiResponse } from '../types';

// Inventory Management Routes
const app = new Hono<{ Bindings: Env }>();

// Debug endpoint
app.get('/debug', authenticate, async (c) => {
  try {
    const transactions = await c.env.DB.prepare(`
      SELECT 
        it.id, it.product_id, it.transaction_type, it.quantity, it.cost_price,
        it.reference_number, it.supplier_name, it.notes, it.created_at,
        p.name as product_name, p.sku as product_sku
      FROM inventory_transactions it
      LEFT JOIN products p ON it.product_id = p.id
      ORDER BY it.created_at DESC
      LIMIT 10
    `).all();

    return c.json({
      success: true,
      data: transactions.results,
      message: 'Debug inventory transactions'
    });
  } catch (error) {
    console.error('Debug inventory error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Debug error: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});

// GET /inventory/transactions - Inventory transaction history
app.get('/transactions', authenticate, async (c) => {
  try {
    // Parse query params manually
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const search = c.req.query('search') || '';
    const transaction_type = c.req.query('transaction_type') || '';
    const product_id = c.req.query('product_id') || '';
    const date_from = c.req.query('date_from') || '';
    const date_to = c.req.query('date_to') || '';
    
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions: string[] = [];
    const params: any[] = [];

    if (search && search.trim()) {
      conditions.push('(p.name LIKE ? OR p.sku LIKE ? OR it.reference_number LIKE ? OR it.supplier_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (transaction_type && transaction_type.trim()) {
      conditions.push('it.transaction_type = ?');
      params.push(transaction_type);
    }

    if (product_id && product_id.trim()) {
      conditions.push('it.product_id = ?');
      params.push(parseInt(product_id));
    }

    if (date_from && date_from.trim()) {
      conditions.push('DATE(it.created_at) >= ?');
      params.push(date_from);
    }

    if (date_to && date_to.trim()) {
      conditions.push('DATE(it.created_at) <= ?');
      params.push(date_to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM inventory_transactions it
      LEFT JOIN products p ON it.product_id = p.id
      ${whereClause}
    `;
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first<{ total: number }>();
    const total = countResult?.total || 0;

    // Get transactions
    const transactionsQuery = `
      SELECT 
        it.id, it.product_id, it.transaction_type, it.quantity, it.cost_price,
        it.reference_number, it.supplier_name, it.from_store_id, it.to_store_id,
        it.notes, it.created_at,
        p.name as product_name, p.sku as product_sku, p.stock_quantity,
        c.name as category_name
      FROM inventory_transactions it
      LEFT JOIN products p ON it.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY it.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const transactionsResult = await c.env.DB.prepare(transactionsQuery)
      .bind(...params, limit, offset)
      .all();

    const totalPages = Math.ceil(total / limit);

    return c.json({
      success: true,
      data: {
        data: transactionsResult.results,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      },
      message: 'Lấy lịch sử giao dịch kho thành công'
    });
  } catch (error) {
    console.error('Get inventory transactions error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Lỗi khi lấy lịch sử giao dịch kho'
    }, 500);
  }
});

// POST /inventory/stock-in-test - Test endpoint
app.post('/stock-in-test', async (c) => {
  try {
    const data = await c.req.json();
    return c.json({
      success: true,
      data: data,
      message: 'Test successful'
    });
  } catch (error) {
    return c.json({
      success: false,
      data: null,
      message: 'Test error: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});

// POST /inventory/stock-in - Stock In (Nhập kho) - With better error handling
app.post('/stock-in', authenticate, async (c) => {
  try {
    const data = await c.req.json();
    const user = c.get('user');

    console.log('Stock-in request data:', JSON.stringify(data));
    console.log('User:', JSON.stringify(user));

    // Convert and validate data types
    const productId = parseInt(data.product_id);
    const quantity = parseInt(data.quantity);
    const costPrice = data.cost_price ? parseFloat(data.cost_price) : null;

    console.log('Converted data:', { productId, quantity, costPrice });

    // Validate required fields
    if (!productId || !quantity || quantity <= 0) {
      console.log('Validation failed:', { productId, quantity });
      return c.json({
        success: false,
        data: null,
        message: 'Thiếu thông tin sản phẩm hoặc số lượng không hợp lệ'
      }, 400);
    }

    console.log('Starting database operations...');

    try {
      // Check if product exists
      console.log('Checking if product exists...');
      const product = await c.env.DB.prepare(
        'SELECT id, name, sku, stock_quantity, cost_price FROM products WHERE id = ? AND is_active = 1'
      ).bind(productId).first<{
        id: number;
        name: string;
        sku: string;
        stock_quantity: number;
        cost_price: number;
      }>();

      console.log('Product query result:', product);

      if (!product) {
        console.log('Product not found');
        return c.json({
          success: false,
          data: null,
          message: 'Sản phẩm không tồn tại hoặc đã bị vô hiệu hóa'
        }, 400);
      }

      // Update product stock quantity directly (simplified approach)
      const newStockQuantity = product.stock_quantity + quantity;
      console.log('Updating stock quantity:', {
        oldStock: product.stock_quantity,
        addedQuantity: quantity,
        newStock: newStockQuantity
      });

      const updateResult = await c.env.DB.prepare(`
        UPDATE products
        SET stock_quantity = ?,
            cost_price = COALESCE(?, cost_price),
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(newStockQuantity, costPrice, productId).run();

      console.log('Update result:', updateResult);

      return c.json({
        success: true,
        data: {
          product: {
            id: product.id,
            name: product.name,
            sku: product.sku
          },
          previous_stock: product.stock_quantity,
          quantity_added: quantity,
          new_stock_quantity: newStockQuantity
        },
        message: 'Nhập kho thành công'
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Stock in error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Lỗi khi nhập kho: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});

// POST /inventory/stock-transfer - Stock Transfer (Chuyển kho)
app.post('/stock-transfer', authenticate, async (c) => {
  try {
    const data = await c.req.json();
    const user = c.get('user');

    // Validate required fields
    if (!data.product_id || !data.quantity || data.quantity <= 0 || !data.from_store_id || !data.to_store_id) {
      return c.json({
        success: false,
        data: null,
        message: 'Thiếu thông tin bắt buộc cho chuyển kho'
      }, 400);
    }

    if (data.from_store_id === data.to_store_id) {
      return c.json({
        success: false,
        data: null,
        message: 'Không thể chuyển kho trong cùng một chi nhánh'
      }, 400);
    }

    // SECURITY FIXED: Use atomic transaction to prevent race conditions
    // First get product info for validation
    const product = await c.env.DB.prepare(
      'SELECT id, name, sku, stock_quantity FROM products WHERE id = ? AND is_active = 1'
    ).bind(data.product_id).first<{
      id: number;
      name: string;
      sku: string;
      stock_quantity: number;
    }>();

    if (!product) {
      return c.json({
        success: false,
        data: null,
        message: 'Sản phẩm không tồn tại hoặc đã bị vô hiệu hóa'
      }, 400);
    }

    // Initial stock check (will be re-checked atomically in transaction)
    if (product.stock_quantity < data.quantity) {
      return c.json({
        success: false,
        data: null,
        message: `Không đủ tồn kho. Còn lại: ${product.stock_quantity}`
      }, 400);
    }

    // Generate reference number
    const referenceNumber = data.reference_number ||
      `ST-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    try {
      // SECURITY FIXED: Atomic transaction with stock validation
      const statements = [
        // Update product stock with atomic check to prevent race conditions
        c.env.DB.prepare(`
          UPDATE products
          SET stock_quantity = stock_quantity - ?, updated_at = datetime('now')
          WHERE id = ? AND stock_quantity >= ? AND is_active = 1
        `).bind(data.quantity, data.product_id, data.quantity),

        // Insert transfer out transaction
        c.env.DB.prepare(`
          INSERT INTO inventory_transactions (
            product_id, transaction_type, quantity,
            reference_number, from_store_id, to_store_id, notes, created_at
          ) VALUES (?, 'transfer_out', ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          data.product_id,
          -data.quantity, // Negative for outbound transfer
          referenceNumber,
          data.from_store_id,
          data.to_store_id,
          data.notes || null
        ),

        // Insert transfer in transaction
        c.env.DB.prepare(`
          INSERT INTO inventory_transactions (
            product_id, transaction_type, quantity,
            reference_number, from_store_id, to_store_id, notes, created_at
          ) VALUES (?, 'transfer_in', ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          data.product_id,
          data.quantity, // Positive for inbound transfer
          referenceNumber,
          data.from_store_id,
          data.to_store_id,
          data.notes || null
        )
      ];

      // Execute all statements in batch for atomicity
      const results = await c.env.DB.batch(statements);

      // SECURITY FIXED: Check if stock update actually happened
      if (results[0].changes === 0) {
        throw new Error('Insufficient stock or concurrent modification detected');
      }

      return c.json({
        success: true,
        data: {
          product: {
            id: product.id,
            name: product.name,
            sku: product.sku
          },
          quantity_transferred: data.quantity,
          from_store_id: data.from_store_id,
          to_store_id: data.to_store_id,
          reference_number: referenceNumber
        },
        message: 'Chuyển kho thành công'
      });
    } catch (error) {
      console.error('Batch operation error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Stock transfer error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Lỗi khi chuyển kho: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});

// GET /inventory/stock-check - Stock Check Page (Trang kiểm kê)
app.get('/stock-check', authenticate, async (c) => {
  try {
    // Get products for stock checking
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const search = c.req.query('search') || '';

    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      conditions.push('(p.name LIKE ? OR p.sku LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get products with stock info
    const productsQuery = `
      SELECT
        p.id, p.name, p.sku, p.stock_quantity, p.cost_price, p.selling_price,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.name ASC
      LIMIT ? OFFSET ?
    `;

    const products = await c.env.DB.prepare(productsQuery)
      .bind(...params, limit, offset)
      .all();

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
    `;

    const countResult = await c.env.DB.prepare(countQuery)
      .bind(...params)
      .first();

    const total = (countResult as any)?.total || 0;

    return c.json({
      success: true,
      data: {
        products: products.results,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      },
      message: 'Danh sách sản phẩm để kiểm kê'
    });
  } catch (error) {
    console.error('Stock check page error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Lỗi khi tải trang kiểm kê: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});

// POST /inventory/stock-count - Stock Count (Kiểm kê)
app.post('/stock-count', authenticate, async (c) => {
  try {
    const data = await c.req.json();
    const user = c.get('user');

    // Validate required fields
    if (!data.product_id || data.counted_quantity === undefined || data.counted_quantity < 0) {
      return c.json({
        success: false,
        data: null,
        message: 'Thiếu thông tin sản phẩm hoặc số lượng kiểm kê không hợp lệ'
      }, 400);
    }

    // Begin transaction
    await c.env.DB.prepare('BEGIN TRANSACTION').run();

    try {
      // Check if product exists
      const product = await c.env.DB.prepare(
        'SELECT id, name, sku, stock_quantity FROM products WHERE id = ? AND is_active = 1'
      ).bind(data.product_id).first<{
        id: number;
        name: string;
        sku: string;
        stock_quantity: number;
      }>();

      if (!product) {
        await c.env.DB.prepare('ROLLBACK').run();
        return c.json({
          success: false,
          data: null,
          message: 'Sản phẩm không tồn tại hoặc đã bị vô hiệu hóa'
        }, 400);
      }

      const difference = data.counted_quantity - product.stock_quantity;

      if (difference !== 0) {
        // Generate reference number
        const referenceNumber = data.reference_number ||
          `SC-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

        // Insert adjustment transaction
        await c.env.DB.prepare(`
          INSERT INTO inventory_transactions (
            product_id, transaction_type, quantity,
            reference_number, notes, created_at
          ) VALUES (?, 'adjustment', ?, ?, ?, datetime('now'))
        `).bind(
          data.product_id,
          difference,
          referenceNumber,
          `Kiểm kê: ${product.stock_quantity} → ${data.counted_quantity}. ${data.notes || ''}`
        ).run();

        // Update product stock quantity
        await c.env.DB.prepare(`
          UPDATE products
          SET stock_quantity = ?, updated_at = datetime('now')
          WHERE id = ?
        `).bind(data.counted_quantity, data.product_id).run();
      }

      await c.env.DB.prepare('COMMIT').run();

      return c.json({
        success: true,
        data: {
          product: {
            id: product.id,
            name: product.name,
            sku: product.sku
          },
          system_quantity: product.stock_quantity,
          counted_quantity: data.counted_quantity,
          difference: difference,
          adjustment_made: difference !== 0
        },
        message: difference === 0 ? 'Kiểm kê chính xác' : 'Kiểm kê và điều chỉnh thành công'
      });
    } catch (error) {
      await c.env.DB.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error('Stock count error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Lỗi khi kiểm kê: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});

export default app;
