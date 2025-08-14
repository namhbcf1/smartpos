// ==========================================
// ENHANCED SALES API WITH SERIAL NUMBER INTEGRATION
// Tự động update serial numbers khi bán hàng và tạo warranty
// ==========================================

import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate, authorize, getUser } from '../../middleware/auth';
import { FinancialCalculator, DecimalMath } from '../../utils/decimal-math';
import { validate } from '../../middleware/validate';
import { auditLogger } from '../../middleware/security';
import { z } from 'zod';

const app = new Hono<{ Bindings: Env }>();

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const saleCreateSchema = z.object({
  customer_id: z.number().int().positive().optional(),
  items: z.array(z.object({
    product_id: z.number().int().positive(),
    quantity: z.number().positive(),
    unit_price: z.number().positive(),
    serial_numbers: z.array(z.string()).optional(), // 🔥 SERIAL NUMBERS FOR SALE
    discount_amount: z.number().min(0).default(0),
  })).min(1),
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'mobile_payment', 'credit']),
  payment_status: z.enum(['paid', 'unpaid', 'partial']).default('paid'),
  discount_amount: z.number().min(0).default(0),
  tax_amount: z.number().min(0).default(0),
  notes: z.string().optional(),
  auto_create_warranty: z.boolean().default(true), // 🔥 TỰ ĐỘNG TẠO BẢO HÀNH
});

// ==========================================
// ENHANCED SALES ENDPOINTS
// ==========================================

// POST /sales/enhanced - Create sale with automatic serial number and warranty handling
app.post('/enhanced', 
  authenticate, 
  authorize(['admin', 'manager', 'cashier']), 
  validate(saleCreateSchema), 
  auditLogger,
  async (c) => {
    try {
      const env = c.env as Env;
      const user = getUser(c);
      const data = c.get('validatedData');

      console.log('🔄 Creating enhanced sale with serial numbers:', data);

      // Generate receipt number
      const receiptNumber = `RC${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(Date.now()).slice(-6)}`;

      // SECURITY FIXED: Use decimal arithmetic for precise financial calculations
      const calculationResult = FinancialCalculator.calculateSaleTotal(
        data.items.map(item => ({
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount: item.discount_amount || 0,
          tax_rate: 0 // Item-level tax rate if needed
        })),
        0, // Global tax rate (use data.tax_amount instead)
        data.discount_amount || 0
      );

      // Add any additional tax amount from the request
      const totalTaxAmount = DecimalMath.add(calculationResult.tax_amount, data.tax_amount || 0);
      const subtotal = calculationResult.subtotal;
      const finalAmount = DecimalMath.add(
        DecimalMath.subtract(calculationResult.subtotal, calculationResult.discount_amount),
        totalTaxAmount
      );

      // Start transaction
      const statements = [];

      // 1. Create sales record
      const saleId = Date.now(); // Temporary ID for batch
      const saleQuery = `
        INSERT INTO sales (
          receipt_number, store_id, customer_id, user_id,
          subtotal, tax_amount, discount_amount, final_amount,
          payment_method, payment_status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      statements.push(
        env.DB.prepare(saleQuery).bind(
          receiptNumber,
          1, // Default store_id
          data.customer_id || null,
          user.sub,
          subtotal,
          data.tax_amount,
          data.discount_amount,
          finalAmount,
          data.payment_method,
          data.payment_status,
          data.notes || null
        )
      );

      // 2. Process each sale item
      for (const item of data.items) {
        // Create sale_items record
        const saleItemQuery = `
          INSERT INTO sale_items (
            sale_id, product_id, quantity, unit_price, 
            discount_amount, subtotal
          ) VALUES (?, ?, ?, ?, ?, ?)
        `;

        const itemSubtotal = (item.quantity * item.unit_price) - item.discount_amount;

        statements.push(
          env.DB.prepare(saleItemQuery).bind(
            saleId,
            item.product_id,
            item.quantity,
            item.unit_price,
            item.discount_amount,
            itemSubtotal
          )
        );

        // 3. Update product stock
        const updateStockQuery = `
          UPDATE products 
          SET stock_quantity = stock_quantity - ?, updated_at = datetime('now')
          WHERE id = ? AND stock_quantity >= ?
        `;

        statements.push(
          env.DB.prepare(updateStockQuery).bind(
            item.quantity, 
            item.product_id, 
            item.quantity
          )
        );

        // 4. Handle serial numbers if provided
        if (item.serial_numbers && item.serial_numbers.length > 0) {
          for (const serialNumber of item.serial_numbers) {
            // Update serial number status to 'sold'
            const updateSerialQuery = `
              UPDATE serial_numbers 
              SET 
                status = 'sold',
                sale_id = ?,
                customer_id = ?,
                sold_date = datetime('now'),
                warranty_start_date = datetime('now'),
                warranty_end_date = datetime('now', '+' || (
                  SELECT warranty_period_months FROM products WHERE id = ?
                ) || ' months'),
                updated_at = datetime('now')
              WHERE serial_number = ? AND status = 'in_stock'
            `;

            statements.push(
              env.DB.prepare(updateSerialQuery).bind(
                saleId,
                data.customer_id || null,
                item.product_id,
                serialNumber
              )
            );

            // 5. Auto-create warranty registration if enabled
            if (data.auto_create_warranty && data.customer_id) {
              const warrantyNumber = `WR${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(Date.now()).slice(-6)}`;
              
              const warrantyQuery = `
                INSERT INTO warranty_registrations (
                  warranty_number, serial_number_id, product_id, customer_id, sale_id,
                  warranty_type, warranty_period_months, warranty_start_date, warranty_end_date,
                  status, terms_accepted, created_by
                ) 
                SELECT 
                  ?, sn.id, ?, ?, ?,
                  'manufacturer', p.warranty_period_months, datetime('now'), 
                  datetime('now', '+' || p.warranty_period_months || ' months'),
                  'active', 1, ?
                FROM serial_numbers sn
                JOIN products p ON sn.product_id = p.id
                WHERE sn.serial_number = ?
              `;

              statements.push(
                env.DB.prepare(warrantyQuery).bind(
                  warrantyNumber,
                  item.product_id,
                  data.customer_id,
                  saleId,
                  user.sub,
                  serialNumber
                )
              );
            }
          }
        }

        // 6. Create inventory transaction
        const inventoryTransactionQuery = `
          INSERT INTO inventory_transactions (
            product_id, store_id, user_id, transaction_type, 
            quantity, reference_id, reference_type, notes
          ) VALUES (?, ?, ?, 'sale', ?, ?, 'sale', ?)
        `;

        statements.push(
          env.DB.prepare(inventoryTransactionQuery).bind(
            item.product_id,
            1, // Default store_id
            user.sub,
            -item.quantity, // Negative for sale
            saleId,
            `Sale: ${receiptNumber}`
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

      console.log('✅ Enhanced sale created successfully with serial numbers and warranties');

      // Get the created sale with details
      const saleResult = await env.DB.prepare(`
        SELECT 
          s.*,
          c.full_name as customer_name,
          c.phone as customer_phone,
          COUNT(DISTINCT si.id) as items_count,
          COUNT(DISTINCT sn.id) as serial_numbers_count,
          COUNT(DISTINCT wr.id) as warranties_created
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN sale_items si ON s.id = si.sale_id
        LEFT JOIN serial_numbers sn ON s.id = sn.sale_id
        LEFT JOIN warranty_registrations wr ON s.id = wr.sale_id
        WHERE s.receipt_number = ?
        GROUP BY s.id
      `).bind(receiptNumber).first();

      return c.json({
        success: true,
        data: saleResult,
        message: `Bán hàng thành công với ${data.items.length} sản phẩm, ${data.items.reduce((sum, item) => sum + (item.serial_numbers?.length || 0), 0)} serial numbers và ${data.auto_create_warranty ? 'tự động tạo bảo hành' : 'không tạo bảo hành'}`,
      }, 201);

    } catch (error) {
      console.error('❌ Error creating enhanced sale:', error);
      return c.json({
        success: false,
        message: 'Lỗi khi tạo đơn bán hàng: ' + (error instanceof Error ? error.message : 'Unknown error'),
        data: null
      }, 500);
    }
  }
);

// GET /sales/with-serial-numbers - Get sales with serial number details
app.get('/with-serial-numbers', authenticate, async (c) => {
  try {
    const env = c.env as Env;
    const page = parseInt(c.req.query('page') || '1');
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
    const offset = (page - 1) * limit;

    const sales = await env.DB.prepare(`
      SELECT 
        s.*,
        c.full_name as customer_name,
        c.phone as customer_phone,
        COUNT(DISTINCT si.id) as items_count,
        COUNT(DISTINCT sn.id) as serial_numbers_count,
        COUNT(DISTINCT wr.id) as warranties_count,
        GROUP_CONCAT(DISTINCT sn.serial_number) as serial_numbers_list
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN serial_numbers sn ON s.id = sn.sale_id
      LEFT JOIN warranty_registrations wr ON s.id = wr.sale_id
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    const totalCount = await env.DB.prepare(`
      SELECT COUNT(*) as total FROM sales
    `).first();

    return c.json({
      success: true,
      data: {
        data: sales.results || [],
        pagination: {
          page,
          limit,
          total: totalCount?.total || 0,
          totalPages: Math.ceil((totalCount?.total || 0) / limit),
        }
      },
      message: 'Lấy danh sách bán hàng với serial numbers thành công'
    });

  } catch (error) {
    console.error('❌ Error fetching sales with serial numbers:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi lấy danh sách bán hàng',
      data: null
    }, 500);
  }
});

// GET /sales/:id/serial-numbers - Get serial numbers for a specific sale
app.get('/:id/serial-numbers', authenticate, async (c) => {
  try {
    const env = c.env as Env;
    const saleId = parseInt(c.req.param('id'));

    if (isNaN(saleId)) {
      return c.json({
        success: false,
        message: 'Sale ID không hợp lệ',
        data: null
      }, 400);
    }

    const serialNumbers = await env.DB.prepare(`
      SELECT 
        sn.*,
        p.name as product_name,
        p.sku as product_sku,
        p.warranty_period_months,
        wr.warranty_number,
        wr.warranty_type,
        wr.status as warranty_status
      FROM serial_numbers sn
      LEFT JOIN products p ON sn.product_id = p.id
      LEFT JOIN warranty_registrations wr ON sn.id = wr.serial_number_id
      WHERE sn.sale_id = ?
      ORDER BY sn.created_at DESC
    `).bind(saleId).all();

    return c.json({
      success: true,
      data: serialNumbers.results || [],
      message: 'Lấy danh sách serial numbers cho đơn hàng thành công'
    });

  } catch (error) {
    console.error('❌ Error fetching serial numbers for sale:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi lấy danh sách serial numbers',
      data: null
    }, 500);
  }
});

// GET /sales/:id/warranties - Get warranties created for a specific sale
app.get('/:id/warranties', authenticate, async (c) => {
  try {
    const env = c.env as Env;
    const saleId = parseInt(c.req.param('id'));

    if (isNaN(saleId)) {
      return c.json({
        success: false,
        message: 'Sale ID không hợp lệ',
        data: null
      }, 400);
    }

    const warranties = await env.DB.prepare(`
      SELECT 
        wr.*,
        sn.serial_number,
        p.name as product_name,
        p.sku as product_sku,
        c.full_name as customer_name,
        c.phone as customer_phone
      FROM warranty_registrations wr
      LEFT JOIN serial_numbers sn ON wr.serial_number_id = sn.id
      LEFT JOIN products p ON wr.product_id = p.id
      LEFT JOIN customers c ON wr.customer_id = c.id
      WHERE wr.sale_id = ?
      ORDER BY wr.created_at DESC
    `).bind(saleId).all();

    return c.json({
      success: true,
      data: warranties.results || [],
      message: 'Lấy danh sách bảo hành cho đơn hàng thành công'
    });

  } catch (error) {
    console.error('❌ Error fetching warranties for sale:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi lấy danh sách bảo hành',
      data: null
    }, 500);
  }
});

export default app;
