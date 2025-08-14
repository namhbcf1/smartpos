// ==========================================
// POS PAYMENT WITH SERIAL NUMBER SELECTION
// Enhanced payment processing for ComputerPOS Pro
// ==========================================

import { Hono } from 'hono';
import { z } from 'zod';
import { authenticate, authorize, validate, auditLogger } from '../middleware';
import { getUser } from '../utils/auth';
import type { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const cartItemSchema = z.object({
  product_id: z.number().int().positive(),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive(),
  selected_serials: z.array(z.string()).optional(), // User-selected serial numbers
  auto_assign_serials: z.boolean().default(false), // Auto-assign available serials
});

const paymentSchema = z.object({
  items: z.array(cartItemSchema).min(1),
  customer_id: z.number().int().positive().optional(),
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'mobile_payment']),
  payment_amount: z.number().positive(),
  discount_amount: z.number().min(0).default(0),
  notes: z.string().optional(),
  auto_create_warranty: z.boolean().default(true),
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

async function getAvailableSerials(env: Env, productId: number, quantity: number): Promise<string[]> {
  const query = `
    SELECT serial_number 
    FROM serial_numbers 
    WHERE product_id = ? 
      AND status = 'in_stock' 
      AND (deleted_at IS NULL OR deleted_at = '')
    ORDER BY received_date ASC
    LIMIT ?
  `;
  
  const result = await env.DB.prepare(query).bind(productId, quantity).all();
  return result.results.map((row: any) => row.serial_number);
}

async function validateSelectedSerials(env: Env, productId: number, serials: string[]): Promise<{ valid: string[], invalid: string[] }> {
  const valid: string[] = [];
  const invalid: string[] = [];
  
  for (const serial of serials) {
    const check = await env.DB.prepare(`
      SELECT id, status 
      FROM serial_numbers 
      WHERE serial_number = ? 
        AND product_id = ? 
        AND (deleted_at IS NULL OR deleted_at = '')
    `).bind(serial, productId).first();
    
    if (check && check.status === 'in_stock') {
      valid.push(serial);
    } else {
      invalid.push(serial);
    }
  }
  
  return { valid, invalid };
}

async function updateSerialStatus(env: Env, serials: string[], saleId: number, customerId?: number): Promise<void> {
  const updateQuery = `
    UPDATE serial_numbers 
    SET status = 'sold', 
        sale_id = ?, 
        customer_id = ?, 
        sold_date = datetime('now'),
        warranty_start_date = datetime('now'),
        warranty_end_date = datetime('now', '+12 months'),
        updated_at = datetime('now')
    WHERE serial_number = ?
  `;
  
  const statements = serials.map(serial => 
    env.DB.prepare(updateQuery).bind(saleId, customerId || null, serial)
  );
  
  await env.DB.batch(statements);
}

// ==========================================
// API ENDPOINTS
// ==========================================

// GET /pos-payment/available-serials/:productId - Get available serial numbers for a product
app.get('/available-serials/:productId', authenticate, async (c) => {
  try {
    const env = c.env as Env;
    const productId = parseInt(c.req.param('productId'));
    const quantity = parseInt(c.req.query('quantity') || '1');
    
    if (isNaN(productId) || isNaN(quantity)) {
      return c.json({
        success: false,
        message: 'Invalid product ID or quantity',
        data: null
      }, 400);
    }
    
    const availableSerials = await getAvailableSerials(env, productId, quantity * 2); // Get extra for selection
    
    // Get product info
    const product = await env.DB.prepare(`
      SELECT id, name, sku, track_quantity 
      FROM products 
      WHERE id = ? AND is_active = 1
    `).bind(productId).first();
    
    if (!product) {
      return c.json({
        success: false,
        message: 'Product not found',
        data: null
      }, 404);
    }
    
    return c.json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          track_quantity: product.track_quantity
        },
        available_serials: availableSerials,
        requested_quantity: quantity,
        available_count: availableSerials.length
      },
      message: `Found ${availableSerials.length} available serial numbers`
    });
    
  } catch (error) {
    console.error('Error fetching available serials:', error);
    return c.json({
      success: false,
      message: 'Error fetching available serial numbers',
      data: null,
      error: {
        type: 'SERIAL_FETCH_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }, 500);
  }
});

// POST /pos-payment/process - Process payment with serial number selection
app.post('/process', 
  authenticate, 
  authorize(['admin', 'manager', 'cashier']), 
  validate(paymentSchema), 
  auditLogger,
  async (c) => {
    try {
      const env = c.env as Env;
      const user = getUser(c);
      const data = c.get('validatedData');
      
      console.log('🔄 Processing POS payment with serial selection:', data);
      
      // Step 1: Validate all serial numbers and prepare assignments
      const serialAssignments: { [productId: number]: string[] } = {};
      const validationErrors: string[] = [];
      
      for (const item of data.items) {
        let assignedSerials: string[] = [];
        
        if (item.selected_serials && item.selected_serials.length > 0) {
          // User selected specific serials
          const validation = await validateSelectedSerials(env, item.product_id, item.selected_serials);
          
          if (validation.invalid.length > 0) {
            validationErrors.push(`Invalid serials for product ${item.product_id}: ${validation.invalid.join(', ')}`);
          }
          
          if (validation.valid.length < item.quantity) {
            validationErrors.push(`Not enough valid serials for product ${item.product_id}. Need ${item.quantity}, got ${validation.valid.length}`);
          }
          
          assignedSerials = validation.valid.slice(0, item.quantity);
          
        } else if (item.auto_assign_serials) {
          // Auto-assign available serials
          const availableSerials = await getAvailableSerials(env, item.product_id, item.quantity);
          
          if (availableSerials.length < item.quantity) {
            validationErrors.push(`Not enough available serials for product ${item.product_id}. Need ${item.quantity}, available ${availableSerials.length}`);
          }
          
          assignedSerials = availableSerials.slice(0, item.quantity);
        }
        
        if (assignedSerials.length > 0) {
          serialAssignments[item.product_id] = assignedSerials;
        }
      }
      
      if (validationErrors.length > 0) {
        return c.json({
          success: false,
          message: 'Serial number validation failed',
          data: null,
          errors: validationErrors
        }, 400);
      }
      
      // Step 2: Create the sale record
      const receiptNumber = `RC${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(Date.now()).slice(-6)}`;
      
      const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const taxAmount = (subtotal - data.discount_amount) * 0.1; // 10% tax
      const finalAmount = subtotal - data.discount_amount + taxAmount;
      
      const saleQuery = `
        INSERT INTO sales (
          receipt_number, customer_id, user_id, store_id,
          subtotal, discount_amount, tax_amount, final_amount,
          payment_method, payment_status, sale_status,
          notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', 'completed', ?, datetime('now'), datetime('now'))
      `;
      
      const saleResult = await env.DB.prepare(saleQuery).bind(
        receiptNumber,
        data.customer_id || null,
        user.sub,
        1, // Default store ID
        subtotal,
        data.discount_amount,
        taxAmount,
        finalAmount,
        data.payment_method,
        data.notes || null
      ).run();
      
      if (!saleResult.success) {
        throw new Error('Failed to create sale record');
      }
      
      const saleId = saleResult.meta.last_row_id as number;
      
      // Step 3: Create sale items and update serial numbers
      const statements = [];
      
      for (const item of data.items) {
        // Create sale item
        const saleItemQuery = `
          INSERT INTO sale_items (
            sale_id, product_id, quantity, unit_price, 
            discount_amount, subtotal, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `;
        
        const itemSubtotal = item.quantity * item.unit_price;
        statements.push(
          env.DB.prepare(saleItemQuery).bind(
            saleId,
            item.product_id,
            item.quantity,
            item.unit_price,
            0, // Item-level discount (can be enhanced later)
            itemSubtotal
          )
        );
        
        // Update product stock
        const stockUpdateQuery = `
          UPDATE products 
          SET stock_quantity = stock_quantity - ?, 
              updated_at = datetime('now')
          WHERE id = ?
        `;
        
        statements.push(
          env.DB.prepare(stockUpdateQuery).bind(item.quantity, item.product_id)
        );
      }
      
      // Execute all statements
      await env.DB.batch(statements);
      
      // Step 4: Update serial number statuses
      for (const [productId, serials] of Object.entries(serialAssignments)) {
        await updateSerialStatus(env, serials, saleId, data.customer_id);
      }
      
      // Step 5: Create warranty registrations if enabled
      if (data.auto_create_warranty) {
        const warrantyStatements = [];
        
        for (const [productId, serials] of Object.entries(serialAssignments)) {
          for (const serial of serials) {
            const warrantyQuery = `
              INSERT INTO warranty_registrations (
                serial_number_id, customer_id, warranty_type,
                warranty_start_date, warranty_end_date,
                status, created_at, updated_at
              ) 
              SELECT 
                sn.id, ?, 'manufacturer',
                datetime('now'), datetime('now', '+12 months'),
                'active', datetime('now'), datetime('now')
              FROM serial_numbers sn
              WHERE sn.serial_number = ?
            `;
            
            warrantyStatements.push(
              env.DB.prepare(warrantyQuery).bind(data.customer_id || null, serial)
            );
          }
        }
        
        if (warrantyStatements.length > 0) {
          await env.DB.batch(warrantyStatements);
        }
      }
      
      console.log('✅ POS payment processed successfully');
      
      // Step 6: Return comprehensive response
      return c.json({
        success: true,
        data: {
          sale_id: saleId,
          receipt_number: receiptNumber,
          subtotal,
          discount_amount: data.discount_amount,
          tax_amount: taxAmount,
          final_amount: finalAmount,
          payment_method: data.payment_method,
          serial_assignments: serialAssignments,
          warranty_created: data.auto_create_warranty,
          items_count: data.items.length,
          total_serials: Object.values(serialAssignments).flat().length
        },
        message: `Payment processed successfully. Receipt: ${receiptNumber}`
      }, 201);
      
    } catch (error) {
      console.error('❌ Error processing POS payment:', error);
      return c.json({
        success: false,
        message: 'Error processing payment',
        data: null,
        error: {
          type: 'PAYMENT_PROCESSING_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      }, 500);
    }
  }
);

export default app;
