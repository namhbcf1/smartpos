// ==========================================
// RETURNS MANAGEMENT API
// Complete returns processing with real-time updates
// ==========================================

import { Hono } from 'hono';
import { Env } from '../types';
import { authenticate, authorize, getUser } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const app = new Hono<{ Bindings: Env }>();

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const createReturnSchema = z.object({
  sale_id: z.number().int().positive(),
  items: z.array(z.object({
    product_id: z.number().int().positive(),
    serial_number: z.string().optional(),
    quantity: z.number().int().positive(),
    reason: z.enum(['defective', 'wrong_item', 'customer_change_mind', 'damaged', 'warranty_claim', 'other']),
    condition: z.enum(['new', 'used', 'damaged', 'defective']),
    notes: z.string().optional()
  })).min(1),
  return_reason: z.string().min(5),
  customer_notes: z.string().optional(),
  refund_method: z.enum(['cash', 'card', 'store_credit', 'exchange']),
  refund_amount: z.number().min(0).optional(),
  processing_fee: z.number().min(0).default(0),
  restocking_fee: z.number().min(0).default(0)
});

const updateReturnSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'processing', 'completed', 'cancelled']).optional(),
  admin_notes: z.string().optional(),
  refund_amount: z.number().min(0).optional(),
  processing_fee: z.number().min(0).optional(),
  restocking_fee: z.number().min(0).optional(),
  processed_by: z.string().optional()
});

// ==========================================
// RETURNS ENDPOINTS
// ==========================================

// GET /returns - List all returns with filters
app.get('/', authenticate, async (c) => {
  try {
    const env = c.env as Env;
    const user = getUser(c);

    // Query parameters
    const page = parseInt(c.req.query('page') || '1');
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
    const offset = (page - 1) * limit;
    const search = c.req.query('search') || '';
    const status = c.req.query('status') || '';
    const dateFrom = c.req.query('date_from') || '';
    const dateTo = c.req.query('date_to') || '';
    const customerId = c.req.query('customer_id') || '';

    // Build WHERE clause
    let whereConditions = ['1=1'];
    const params: any[] = [];

    if (search) {
      whereConditions.push(`(
        r.return_number LIKE ? OR 
        s.receipt_number LIKE ? OR 
        c.full_name LIKE ? OR 
        c.phone LIKE ?
      )`);
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (status) {
      whereConditions.push('r.status = ?');
      params.push(status);
    }

    if (dateFrom) {
      whereConditions.push('DATE(r.created_at) >= ?');
      params.push(dateFrom);
    }

    if (dateTo) {
      whereConditions.push('DATE(r.created_at) <= ?');
      params.push(dateTo);
    }

    if (customerId) {
      whereConditions.push('r.customer_id = ?');
      params.push(parseInt(customerId));
    }

    const whereClause = whereConditions.join(' AND ');

    // Get returns with related data
    const returns = await env.DB.prepare(`
      SELECT 
        r.*,
        s.receipt_number,
        s.total_amount as original_amount,
        s.created_at as sale_date,
        c.full_name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        u.full_name as processed_by_name,
        COUNT(ri.id) as item_count,
        SUM(ri.quantity) as total_quantity
      FROM returns r
      LEFT JOIN sales s ON r.sale_id = s.id
      LEFT JOIN customers c ON r.customer_id = c.id
      LEFT JOIN users u ON r.processed_by = u.id
      LEFT JOIN return_items ri ON r.id = ri.return_id
      WHERE ${whereClause}
      GROUP BY r.id
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all();

    // Get total count
    const totalResult = await env.DB.prepare(`
      SELECT COUNT(DISTINCT r.id) as total
      FROM returns r
      LEFT JOIN sales s ON r.sale_id = s.id
      LEFT JOIN customers c ON r.customer_id = c.id
      WHERE ${whereClause}
    `).bind(...params).first();

    const total = totalResult?.total || 0;

    return c.json({
      success: true,
      data: returns.results || [],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'Returns retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching returns:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi tải danh sách trả hàng',
      data: null
    }, 500);
  }
});

// GET /returns/:id - Get return details
app.get('/:id', authenticate, async (c) => {
  try {
    const env = c.env as Env;
    const returnId = parseInt(c.req.param('id'));

    if (!returnId) {
      return c.json({
        success: false,
        message: 'ID trả hàng không hợp lệ',
        data: null
      }, 400);
    }

    // Get return details
    const returnData = await env.DB.prepare(`
      SELECT 
        r.*,
        s.receipt_number,
        s.total_amount as original_amount,
        s.created_at as sale_date,
        s.payment_method as original_payment_method,
        c.full_name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        c.address as customer_address,
        u.full_name as processed_by_name,
        creator.full_name as created_by_name
      FROM returns r
      LEFT JOIN sales s ON r.sale_id = s.id
      LEFT JOIN customers c ON r.customer_id = c.id
      LEFT JOIN users u ON r.processed_by = u.id
      LEFT JOIN users creator ON r.created_by = creator.id
      WHERE r.id = ?
    `).bind(returnId).first();

    if (!returnData) {
      return c.json({
        success: false,
        message: 'Không tìm thấy thông tin trả hàng',
        data: null
      }, 404);
    }

    // Get return items
    const returnItems = await env.DB.prepare(`
      SELECT 
        ri.*,
        p.name as product_name,
        p.sku as product_sku,
        p.price as product_price,
        si.unit_price as sale_price,
        sn.serial_number,
        sn.warranty_end_date
      FROM return_items ri
      LEFT JOIN products p ON ri.product_id = p.id
      LEFT JOIN sale_items si ON ri.sale_item_id = si.id
      LEFT JOIN serial_numbers sn ON ri.serial_number = sn.serial_number
      WHERE ri.return_id = ?
      ORDER BY ri.created_at ASC
    `).bind(returnId).all();

    // Get return history/logs
    const returnLogs = await env.DB.prepare(`
      SELECT 
        rl.*,
        u.full_name as user_name
      FROM return_logs rl
      LEFT JOIN users u ON rl.created_by = u.id
      WHERE rl.return_id = ?
      ORDER BY rl.created_at DESC
    `).bind(returnId).all();

    return c.json({
      success: true,
      data: {
        ...returnData,
        items: returnItems.results || [],
        logs: returnLogs.results || []
      },
      message: 'Return details retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching return details:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi tải chi tiết trả hàng',
      data: null
    }, 500);
  }
});

// POST /returns - Create new return
app.post('/', authenticate, validate(createReturnSchema), async (c) => {
  try {
    const env = c.env as Env;
    const user = getUser(c);
    const data = await c.req.json();

    // Validate sale exists and get details
    const sale = await env.DB.prepare(`
      SELECT s.*, c.id as customer_id, c.full_name as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.id = ?
    `).bind(data.sale_id).first();

    if (!sale) {
      return c.json({
        success: false,
        message: 'Không tìm thấy đơn hàng',
        data: null
      }, 404);
    }

    // Generate return number
    const returnNumber = `RET-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Calculate total refund amount
    let totalRefundAmount = 0;
    for (const item of data.items) {
      const saleItem = await env.DB.prepare(`
        SELECT unit_price FROM sale_items 
        WHERE sale_id = ? AND product_id = ?
      `).bind(data.sale_id, item.product_id).first();
      
      if (saleItem) {
        totalRefundAmount += saleItem.unit_price * item.quantity;
      }
    }

    // Apply fees
    const finalRefundAmount = Math.max(0, 
      (data.refund_amount || totalRefundAmount) - 
      (data.processing_fee || 0) - 
      (data.restocking_fee || 0)
    );

    // Start transaction
    const statements = [];

    // Insert return record
    const returnInsert = env.DB.prepare(`
      INSERT INTO returns (
        return_number, sale_id, customer_id, return_reason, customer_notes,
        refund_method, refund_amount, processing_fee, restocking_fee,
        status, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'))
    `).bind(
      returnNumber,
      data.sale_id,
      sale.customer_id,
      data.return_reason,
      data.customer_notes || null,
      data.refund_method,
      finalRefundAmount,
      data.processing_fee || 0,
      data.restocking_fee || 0,
      user.sub
    );

    statements.push(returnInsert);

    // We'll need the return ID, so let's execute this first
    const returnResult = await returnInsert.run();
    const returnId = returnResult.meta.last_row_id;

    // Insert return items
    for (const item of data.items) {
      const returnItemInsert = env.DB.prepare(`
        INSERT INTO return_items (
          return_id, product_id, serial_number, quantity, reason,
          condition, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        returnId,
        item.product_id,
        item.serial_number || null,
        item.quantity,
        item.reason,
        item.condition,
        item.notes || null
      );

      statements.push(returnItemInsert);

      // Update serial number status if applicable
      if (item.serial_number) {
        const serialUpdateStmt = env.DB.prepare(`
          UPDATE serial_numbers 
          SET status = 'returned', updated_at = datetime('now')
          WHERE serial_number = ?
        `).bind(item.serial_number);

        statements.push(serialUpdateStmt);
      }
    }

    // Create return log
    const logInsert = env.DB.prepare(`
      INSERT INTO return_logs (
        return_id, action, description, created_by, created_at
      ) VALUES (?, 'created', ?, ?, datetime('now'))
    `).bind(
      returnId,
      `Return created: ${data.return_reason}`,
      user.sub
    );

    statements.push(logInsert);

    // Execute remaining statements
    const results = await env.DB.batch(statements);
    const failedStatements = results.filter(r => !r.success);
    
    if (failedStatements.length > 0) {
      throw new Error(`${failedStatements.length} statements failed in return creation`);
    }

    return c.json({
      success: true,
      data: {
        id: returnId,
        return_number: returnNumber,
        refund_amount: finalRefundAmount,
        status: 'pending'
      },
      message: 'Return created successfully'
    }, 201);

  } catch (error) {
    console.error('❌ Error creating return:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi tạo yêu cầu trả hàng: ' + (error instanceof Error ? error.message : 'Unknown error'),
      data: null
    }, 500);
  }
});

// PUT /returns/:id - Update return
app.put('/:id', authenticate, authorize(['admin', 'manager']), validate(updateReturnSchema), async (c) => {
  try {
    const env = c.env as Env;
    const user = getUser(c);
    const returnId = parseInt(c.req.param('id'));
    const data = await c.req.json();

    if (!returnId) {
      return c.json({
        success: false,
        message: 'ID trả hàng không hợp lệ',
        data: null
      }, 400);
    }

    // Get current return data
    const currentReturn = await env.DB.prepare(`
      SELECT * FROM returns WHERE id = ?
    `).bind(returnId).first();

    if (!currentReturn) {
      return c.json({
        success: false,
        message: 'Không tìm thấy thông tin trả hàng',
        data: null
      }, 404);
    }

    // Build update query
    const updateFields = [];
    const params = [];

    if (data.status) {
      updateFields.push('status = ?');
      params.push(data.status);
    }

    if (data.admin_notes !== undefined) {
      updateFields.push('admin_notes = ?');
      params.push(data.admin_notes);
    }

    if (data.refund_amount !== undefined) {
      updateFields.push('refund_amount = ?');
      params.push(data.refund_amount);
    }

    if (data.processing_fee !== undefined) {
      updateFields.push('processing_fee = ?');
      params.push(data.processing_fee);
    }

    if (data.restocking_fee !== undefined) {
      updateFields.push('restocking_fee = ?');
      params.push(data.restocking_fee);
    }

    updateFields.push('processed_by = ?', 'updated_at = datetime(\'now\')');
    params.push(user.sub, returnId);

    // Update return
    await env.DB.prepare(`
      UPDATE returns 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `).bind(...params).run();

    // Log the update
    await env.DB.prepare(`
      INSERT INTO return_logs (
        return_id, action, description, created_by, created_at
      ) VALUES (?, 'updated', ?, ?, datetime('now'))
    `).bind(
      returnId,
      `Return updated: ${data.status ? `Status changed to ${data.status}` : 'Details updated'}`,
      user.sub
    ).run();

    // Handle status-specific actions
    if (data.status === 'approved') {
      // Update inventory if needed
      const returnItems = await env.DB.prepare(`
        SELECT ri.*, p.stock_quantity
        FROM return_items ri
        LEFT JOIN products p ON ri.product_id = p.id
        WHERE ri.return_id = ?
      `).bind(returnId).all();

      for (const item of returnItems.results || []) {
        if (item.condition === 'new' || item.condition === 'used') {
          // Add back to inventory
          await env.DB.prepare(`
            UPDATE products 
            SET stock_quantity = stock_quantity + ?
            WHERE id = ?
          `).bind(item.quantity, item.product_id).run();
        }
      }
    }

    return c.json({
      success: true,
      data: { id: returnId, status: data.status },
      message: 'Return updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating return:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi cập nhật trả hàng',
      data: null
    }, 500);
  }
});

// GET /returns/stats - Return statistics
app.get('/stats', authenticate, async (c) => {
  try {
    const env = c.env as Env;

    const stats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_returns,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_returns,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_returns,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_returns,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_returns,
        COUNT(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 END) as returns_this_month,
        COALESCE(SUM(refund_amount), 0) as total_refund_amount,
        COALESCE(AVG(refund_amount), 0) as avg_refund_amount,
        COUNT(CASE WHEN refund_method = 'cash' THEN 1 END) as cash_refunds,
        COUNT(CASE WHEN refund_method = 'card' THEN 1 END) as card_refunds,
        COUNT(CASE WHEN refund_method = 'store_credit' THEN 1 END) as store_credit_refunds
      FROM returns
    `).first();

    // Return reasons breakdown
    const reasonStats = await env.DB.prepare(`
      SELECT 
        ri.reason,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM return_items), 2) as percentage
      FROM return_items ri
      GROUP BY ri.reason
      ORDER BY count DESC
    `).all();

    // Monthly trends
    const monthlyTrends = await env.DB.prepare(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as return_count,
        SUM(refund_amount) as total_refunds
      FROM returns
      WHERE created_at >= datetime('now', '-12 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
    `).all();

    return c.json({
      success: true,
      data: {
        overview: stats,
        reason_breakdown: reasonStats.results || [],
        monthly_trends: monthlyTrends.results || []
      },
      message: 'Return statistics retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching return stats:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi tải thống kê trả hàng',
      data: null
    }, 500);
  }
});

export default app;