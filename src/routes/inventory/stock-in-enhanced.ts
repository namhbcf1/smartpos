// ==========================================
// ENHANCED STOCK IN API WITH SERIAL NUMBER INTEGRATION
// Tự động tạo serial numbers khi nhập hàng
// ==========================================

import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate, authorize, getUser } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { auditLogger } from '../../middleware/security';
import { z } from 'zod';

const app = new Hono<{ Bindings: Env }>();

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const stockInCreateSchema = z.object({
  supplier_id: z.number().int().positive(),
  reference_number: z.string().min(1).max(50),
  items: z.array(z.object({
    product_id: z.number().int().positive(),
    quantity: z.number().positive(),
    cost_price: z.number().positive(),
    serial_numbers: z.array(z.string()).optional(), // 🔥 SERIAL NUMBERS ARRAY
    expiry_date: z.string().optional(),
  })).min(1),
  notes: z.string().optional(),
  payment_status: z.enum(['paid', 'unpaid', 'partial']).default('unpaid'),
  payment_amount: z.number().min(0).default(0),
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'mobile_payment', 'credit']).optional(),
});

// ==========================================
// ENHANCED STOCK IN ENDPOINTS
// ==========================================

// POST /inventory/stock-in - Create stock in with automatic serial number creation
app.post('/stock-in', 
  authenticate, 
  authorize(['admin', 'manager', 'inventory']), 
  validate(stockInCreateSchema), 
  auditLogger,
  async (c) => {
    try {
      const env = c.env as Env;
      const user = getUser(c);
      const data = c.get('validatedData');

      console.log('🔄 Creating stock in with serial numbers:', data);

      // Start transaction
      const statements = [];

      // 1. Create stock_ins record
      const stockInId = Date.now(); // Temporary ID for batch
      const stockInQuery = `
        INSERT INTO stock_ins (
          reference_number, supplier_id, store_id, user_id, 
          total_amount, payment_status, payment_amount, payment_method, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const totalAmount = data.items.reduce((sum, item) => 
        sum + (item.quantity * item.cost_price), 0
      );

      statements.push(
        env.DB.prepare(stockInQuery).bind(
          data.reference_number,
          data.supplier_id,
          1, // Default store_id
          user.sub,
          totalAmount,
          data.payment_status,
          data.payment_amount,
          data.payment_method || null,
          data.notes || null
        )
      );

      // 2. Create stock_in_items and serial_numbers
      for (const item of data.items) {
        // Create stock_in_item
        const stockInItemQuery = `
          INSERT INTO stock_in_items (
            stock_in_id, product_id, quantity, cost_price, 
            expiry_date, total_amount, serial_numbers
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const itemTotal = item.quantity * item.cost_price;
        const serialNumbersJson = item.serial_numbers ? JSON.stringify(item.serial_numbers) : null;

        statements.push(
          env.DB.prepare(stockInItemQuery).bind(
            stockInId,
            item.product_id,
            item.quantity,
            item.cost_price,
            item.expiry_date || null,
            itemTotal,
            serialNumbersJson
          )
        );

        // 3. Create individual serial numbers if provided
        if (item.serial_numbers && item.serial_numbers.length > 0) {
          for (const serialNumber of item.serial_numbers) {
            const serialQuery = `
              INSERT INTO serial_numbers (
                serial_number, product_id, supplier_id, stock_in_id,
                status, received_date, created_by
              ) VALUES (?, ?, ?, ?, 'in_stock', datetime('now'), ?)
            `;

            statements.push(
              env.DB.prepare(serialQuery).bind(
                serialNumber,
                item.product_id,
                data.supplier_id,
                stockInId,
                user.sub
              )
            );
          }
        }

        // 4. Update product stock quantity
        const updateStockQuery = `
          UPDATE products 
          SET stock_quantity = stock_quantity + ?, updated_at = datetime('now')
          WHERE id = ?
        `;

        statements.push(
          env.DB.prepare(updateStockQuery).bind(item.quantity, item.product_id)
        );

        // 5. Create inventory transaction record
        const inventoryTransactionQuery = `
          INSERT INTO inventory_transactions (
            product_id, store_id, user_id, transaction_type, 
            quantity, reference_id, reference_type, notes
          ) VALUES (?, ?, ?, 'stock_in', ?, ?, 'stock_in', ?)
        `;

        statements.push(
          env.DB.prepare(inventoryTransactionQuery).bind(
            item.product_id,
            1, // Default store_id
            user.sub,
            item.quantity,
            stockInId,
            `Stock in: ${data.reference_number}`
          )
        );
      }

      // Execute all statements in batch
      console.log('🔄 Executing batch transaction with', statements.length, 'statements');
      const results = await env.DB.batch(statements);

      // Check if all statements succeeded
      const failedStatements = results.filter(r => !r.success);
      if (failedStatements.length > 0) {
        console.error('❌ Some statements failed:', failedStatements);
        throw new Error(`${failedStatements.length} statements failed in batch`);
      }

      console.log('✅ Stock in created successfully with serial numbers');

      // Get the created stock in with details
      const stockInResult = await env.DB.prepare(`
        SELECT 
          si.*,
          s.name as supplier_name,
          COUNT(sii.id) as items_count,
          COUNT(sn.id) as serial_numbers_count
        FROM stock_ins si
        LEFT JOIN suppliers s ON si.supplier_id = s.id
        LEFT JOIN stock_in_items sii ON si.id = sii.stock_in_id
        LEFT JOIN serial_numbers sn ON si.id = sn.stock_in_id
        WHERE si.reference_number = ?
        GROUP BY si.id
      `).bind(data.reference_number).first();

      return c.json({
        success: true,
        data: stockInResult,
        message: `Nhập kho thành công với ${data.items.length} sản phẩm và ${data.items.reduce((sum, item) => sum + (item.serial_numbers?.length || 0), 0)} serial numbers`,
      }, 201);

    } catch (error) {
      console.error('❌ Error creating stock in:', error);
      return c.json({
        success: false,
        message: 'Lỗi khi tạo phiếu nhập kho: ' + (error instanceof Error ? error.message : 'Unknown error'),
        data: null
      }, 500);
    }
  }
);

// GET /inventory/stock-in - List stock ins with serial number info
app.get('/stock-in', authenticate, async (c) => {
  try {
    const env = c.env as Env;
    const page = parseInt(c.req.query('page') || '1');
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
    const offset = (page - 1) * limit;

    const stockIns = await env.DB.prepare(`
      SELECT 
        si.*,
        s.name as supplier_name,
        COUNT(DISTINCT sii.id) as items_count,
        COUNT(DISTINCT sn.id) as serial_numbers_count,
        SUM(sii.quantity) as total_quantity
      FROM stock_ins si
      LEFT JOIN suppliers s ON si.supplier_id = s.id
      LEFT JOIN stock_in_items sii ON si.id = sii.stock_in_id
      LEFT JOIN serial_numbers sn ON si.id = sn.stock_in_id
      GROUP BY si.id
      ORDER BY si.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    const totalCount = await env.DB.prepare(`
      SELECT COUNT(*) as total FROM stock_ins
    `).first();

    return c.json({
      success: true,
      data: {
        data: stockIns.results || [],
        pagination: {
          page,
          limit,
          total: totalCount?.total || 0,
          totalPages: Math.ceil((totalCount?.total || 0) / limit),
        }
      },
      message: 'Lấy danh sách phiếu nhập kho thành công'
    });

  } catch (error) {
    console.error('❌ Error fetching stock ins:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi lấy danh sách phiếu nhập kho',
      data: null
    }, 500);
  }
});

// GET /inventory/stock-in/:id - Get stock in details with serial numbers
app.get('/stock-in/:id', authenticate, async (c) => {
  try {
    const env = c.env as Env;
    const id = parseInt(c.req.param('id'));

    if (isNaN(id)) {
      return c.json({
        success: false,
        message: 'ID không hợp lệ',
        data: null
      }, 400);
    }

    // Get stock in details
    const stockIn = await env.DB.prepare(`
      SELECT 
        si.*,
        s.name as supplier_name,
        s.contact_person,
        s.phone as supplier_phone
      FROM stock_ins si
      LEFT JOIN suppliers s ON si.supplier_id = s.id
      WHERE si.id = ?
    `).bind(id).first();

    if (!stockIn) {
      return c.json({
        success: false,
        message: 'Không tìm thấy phiếu nhập kho',
        data: null
      }, 404);
    }

    // Get stock in items with serial numbers
    const items = await env.DB.prepare(`
      SELECT 
        sii.*,
        p.name as product_name,
        p.sku as product_sku,
        p.unit,
        GROUP_CONCAT(sn.serial_number) as serial_numbers_list,
        COUNT(sn.id) as serial_numbers_count
      FROM stock_in_items sii
      LEFT JOIN products p ON sii.product_id = p.id
      LEFT JOIN serial_numbers sn ON sii.stock_in_id = sn.stock_in_id AND sii.product_id = sn.product_id
      WHERE sii.stock_in_id = ?
      GROUP BY sii.id
    `).bind(id).all();

    return c.json({
      success: true,
      data: {
        ...stockIn,
        items: items.results || []
      },
      message: 'Lấy chi tiết phiếu nhập kho thành công'
    });

  } catch (error) {
    console.error('❌ Error fetching stock in details:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi lấy chi tiết phiếu nhập kho',
      data: null
    }, 500);
  }
});

// GET /inventory/serial-numbers/by-stock-in/:stockInId - Get serial numbers by stock in
app.get('/serial-numbers/by-stock-in/:stockInId', authenticate, async (c) => {
  try {
    const env = c.env as Env;
    const stockInId = parseInt(c.req.param('stockInId'));

    if (isNaN(stockInId)) {
      return c.json({
        success: false,
        message: 'Stock In ID không hợp lệ',
        data: null
      }, 400);
    }

    const serialNumbers = await env.DB.prepare(`
      SELECT 
        sn.*,
        p.name as product_name,
        p.sku as product_sku,
        si.reference_number as stock_in_reference
      FROM serial_numbers sn
      LEFT JOIN products p ON sn.product_id = p.id
      LEFT JOIN stock_ins si ON sn.stock_in_id = si.id
      WHERE sn.stock_in_id = ?
      ORDER BY sn.created_at DESC
    `).bind(stockInId).all();

    return c.json({
      success: true,
      data: serialNumbers.results || [],
      message: 'Lấy danh sách serial numbers thành công'
    });

  } catch (error) {
    console.error('❌ Error fetching serial numbers by stock in:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi lấy danh sách serial numbers',
      data: null
    }, 500);
  }
});

export default app;
