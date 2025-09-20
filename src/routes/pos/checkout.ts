/**
 * POS Checkout System
 * Handles cart management, payment processing, and invoice generation
 */

import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const AddToCartSchema = z.object({
  product_id: z.string(),
  variant_id: z.string().optional(),
  quantity: z.number().min(1),
  unit_price: z.number().min(0),
  discount_percent: z.number().min(0).max(100).optional(),
  notes: z.string().optional()
});

const UpdateCartItemSchema = z.object({
  quantity: z.number().min(0).optional(),
  unit_price: z.number().min(0).optional(),
  discount_percent: z.number().min(0).max(100).optional(),
  notes: z.string().optional()
});

const CheckoutSchema = z.object({
  discount_amount: z.number().min(0).optional(),
  discount_percent: z.number().min(0).max(100).optional(),
  tax_percent: z.number().min(0).max(100).optional(),
  payments: z.array(z.object({
    payment_method: z.string(),
    amount: z.number().min(0)
  })),
  customer_info: z.object({
    customer_id: z.string().optional(),
    name: z.string(),
    phone: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
    customer_name: z.string().optional()
  }),
  invoice_date: z.string().optional(),
  notes: z.string().optional()
});

const VoidInvoiceSchema = z.object({
  reason: z.string(),
  notes: z.string().optional()
});
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createValidationErrorResponse,
  createApiError,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  ERROR_CODES 
} from '../../utils/api-response';
import { requirePermissions } from '../../middleware/rbac';
import { RealtimeEventBroadcaster } from '../../services/RealtimeEventBroadcaster';
import { NotificationService } from '../../services/NotificationService';
import type { Context } from 'hono';
import type { CartItem, Invoice, Payment, CustomerInfo } from '../../types/api-standard';

const app = new Hono<{
  Bindings: {
    DB: D1Database;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
    tenantId: string;
  };
}>();

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const addToCartSchema = z.object({
  product_id: z.string().min(1, 'Product ID is required'),
  variant_id: z.string().optional(),
  quantity: z.number().positive('Quantity must be positive'),
  unit_price: z.number().positive('Unit price must be positive'),
  discount_percent: z.number().min(0).max(100).default(0),
  notes: z.string().optional()
});

const updateCartItemSchema = z.object({
  quantity: z.number().positive('Quantity must be positive').optional(),
  unit_price: z.number().positive('Unit price must be positive').optional(),
  discount_percent: z.number().min(0).max(100).optional(),
  notes: z.string().optional()
});

const checkoutSchema = z.object({
  customer_info: z.object({
    customer_id: z.string().optional(),
    name: z.string().min(1, 'Customer name is required'),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().optional()
  }),
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'e_wallet', 'split']),
  payments: z.array(z.object({
    method: z.enum(['cash', 'card', 'bank_transfer', 'e_wallet']),
    amount: z.number().positive('Payment amount must be positive'),
    reference: z.string().optional(),
    notes: z.string().optional()
  })).min(1, 'At least one payment method is required'),
  discount_percent: z.number().min(0).max(100).default(0),
  discount_amount: z.number().min(0).default(0),
  tax_percent: z.number().min(0).default(10),
  notes: z.string().optional(),
  invoice_date: z.string().optional()
});

const voidInvoiceSchema = z.object({
  reason: z.string().min(1, 'Void reason is required'),
  notes: z.string().optional()
});

// =============================================================================
// CART MANAGEMENT
// =============================================================================

// Get current cart
app.get('/cart', 
  jwt({ secret: 'smartpos-production-jwt-secret-key-2025-secure-random-string-32-chars-minimum' }),
  requirePermissions(['pos.read']),
  async (c: any) => {
    try {
      const userId = c.get('userId');
      const tenantId = c.get('tenantId');

      const cartItems = await c.env.DB.prepare(`
        SELECT 
          ci.*,
          p.name as product_name,
          p.sku,
          p.barcode,
          pv.name as variant_name,
          pv.sku as variant_sku,
          pc.name as category_name,
          (ci.quantity * ci.unit_price * (1 - ci.discount_percent / 100)) as line_total
        FROM cart_items ci
        LEFT JOIN products p ON ci.product_id = p.id
        LEFT JOIN product_variants pv ON ci.variant_id = pv.id
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        WHERE ci.user_id = ? AND ci.tenant_id = ? AND ci.status = 'active'
        ORDER BY ci.created_at DESC
      `).bind(userId, tenantId).all();

      const subtotal = cartItems.results?.reduce((sum: number, item: any) => 
        sum + (item.line_total || 0), 0) || 0;

      const cartSummary = {
        items: cartItems.results || [],
        summary: {
          item_count: cartItems.results?.length || 0,
          total_quantity: cartItems.results?.reduce((sum: number, item: any) => 
            sum + (item.quantity || 0), 0) || 0,
          subtotal,
          discount_amount: 0,
          tax_amount: subtotal * 0.1, // 10% default tax
          total: subtotal * 1.1
        }
      };

      return c.json(createSuccessResponse(cartSummary, 'Cart retrieved successfully'));
    } catch (error) {
      console.error('Get cart error:', error);
      return c.json(createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR), 500);
    }
  }
);

// Add item to cart
app.post('/cart/items',
  jwt({ secret: 'smartpos-production-jwt-secret-key-2025-secure-random-string-32-chars-minimum' }),
  requirePermissions(['pos.write']),
  zValidator('json', AddToCartSchema),
  async (c: any) => {
    try {
      const userId = c.get('userId');
      const tenantId = c.get('tenantId');
      const data = c.req.valid('json');

      // Check if product exists and has sufficient stock
      const productCheck = await c.env.DB.prepare(`
        SELECT p.*, 
               COALESCE(SUM(il.quantity), 0) as total_stock,
               pv.name as variant_name,
               pv.sku as variant_sku
        FROM products p
        LEFT JOIN inventory_levels il ON p.id = il.product_id 
          ${data.variant_id ? 'AND il.variant_id = ?' : 'AND il.variant_id IS NULL'}
        LEFT JOIN product_variants pv ON ? = pv.id
        WHERE p.id = ? AND p.tenant_id = ? AND p.status = 'active'
        GROUP BY p.id
      `).bind(
        data.variant_id || null,
        data.variant_id || null,
        data.product_id, 
        tenantId
      ).first();

      if (!productCheck) {
        return c.json(createErrorResponse(ERROR_MESSAGES.PRODUCT_NOT_FOUND), 404);
      }

      if (productCheck.total_stock < data.quantity) {
        return c.json(createErrorResponse(ERROR_MESSAGES.INSUFFICIENT_STOCK), 400);
      }

      // Check if item already exists in cart
      const existingItem = await c.env.DB.prepare(`
        SELECT * FROM cart_items 
        WHERE user_id = ? AND tenant_id = ? AND product_id = ? 
          AND COALESCE(variant_id, '') = COALESCE(?, '')
          AND status = 'active'
      `).bind(userId, tenantId, data.product_id, data.variant_id || '').first();

      let cartItem;
      if (existingItem) {
        // Update existing item
        const newQuantity = existingItem.quantity + data.quantity;
        
        cartItem = await c.env.DB.prepare(`
          UPDATE cart_items SET
            quantity = ?,
            unit_price = ?,
            discount_percent = ?,
            notes = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
          RETURNING *
        `).bind(
          newQuantity,
          data.unit_price,
          data.discount_percent,
          data.notes || null,
          existingItem.id
        ).first();
      } else {
        // Create new cart item
        const cartItemId = crypto.randomUUID();
        
        cartItem = await c.env.DB.prepare(`
          INSERT INTO cart_items (
            id, user_id, tenant_id, product_id, variant_id,
            quantity, unit_price, discount_percent, notes, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
          RETURNING *
        `).bind(
          cartItemId,
          userId,
          tenantId,
          data.product_id,
          data.variant_id || null,
          data.quantity,
          data.unit_price,
          data.discount_percent,
          data.notes || null
        ).first();
      }

      // 🔴 REAL-TIME: Broadcast cart update
      try {
        await RealtimeEventBroadcaster.broadcastProductUpdate(c.env, data.product_id, {
          type: 'cart_item_added',
          product_id: data.product_id,
          variant_id: data.variant_id,
          quantity: data.quantity,
          user_id: userId,
          product_name: 'Product',
          unit_price: data.unit_price
        });
        console.log('✅ Cart update broadcasted');
      } catch (broadcastError) {
        console.error('⚠️ Cart broadcast failed:', broadcastError);
      }

      return c.json(createSuccessResponse(cartItem, SUCCESS_MESSAGES.UPDATED));
    } catch (error) {
      console.error('Add to cart error:', error);
      return c.json(createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR), 500);
    }
  }
);

// Update cart item
app.put('/cart/items/:id',
  jwt({ secret: 'smartpos-production-jwt-secret-key-2025-secure-random-string-32-chars-minimum' }),
  requirePermissions(['pos.write']),
  zValidator('json', updateCartItemSchema),
  async (c: any) => {
    try {
      const userId = c.get('userId');
      const tenantId = c.get('tenantId');
      const itemId = c.req.param('id');
      const data = c.req.valid('json');

      const cartItem = await c.env.DB.prepare(`
        UPDATE cart_items SET
          quantity = COALESCE(?, quantity),
          unit_price = COALESCE(?, unit_price),
          discount_percent = COALESCE(?, discount_percent),
          notes = COALESCE(?, notes),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ? AND tenant_id = ? AND status = 'active'
        RETURNING *
      `).bind(
        data.quantity || null,
        data.unit_price || null,
        data.discount_percent || null,
        data.notes || null,
        itemId,
        userId,
        tenantId
      ).first();

      if (!cartItem) {
        return c.json(createErrorResponse('Cart item not found'), 404);
      }

      return c.json(createSuccessResponse(cartItem, SUCCESS_MESSAGES.UPDATED));
    } catch (error) {
      console.error('Update cart item error:', error);
      return c.json(createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR), 500);
    }
  }
);

// Remove item from cart
app.delete('/cart/items/:id',
  jwt({ secret: 'smartpos-production-jwt-secret-key-2025-secure-random-string-32-chars-minimum' }),
  requirePermissions(['pos.write']),
  async (c: any) => {
    try {
      const userId = c.get('userId');
      const tenantId = c.get('tenantId');
      const itemId = c.req.param('id');

      const result = await c.env.DB.prepare(`
        DELETE FROM cart_items 
        WHERE id = ? AND user_id = ? AND tenant_id = ? AND status = 'active'
      `).bind(itemId, userId, tenantId).run();

      if ((result as any).changes === 0) {
        return c.json(createErrorResponse('Cart item not found'), 404);
      }

      return c.json(createSuccessResponse(null, SUCCESS_MESSAGES.DELETED));
    } catch (error) {
      console.error('Remove cart item error:', error);
      return c.json(createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR), 500);
    }
  }
);

// Clear cart
app.delete('/cart',
  jwt({ secret: 'smartpos-production-jwt-secret-key-2025-secure-random-string-32-chars-minimum' }),
  requirePermissions(['pos.write']),
  async (c: any) => {
    try {
      const userId = c.get('userId');
      const tenantId = c.get('tenantId');

      await c.env.DB.prepare(`
        DELETE FROM cart_items 
        WHERE user_id = ? AND tenant_id = ? AND status = 'active'
      `).bind(userId, tenantId).run();

      return c.json(createSuccessResponse(null, 'Cart cleared successfully'));
    } catch (error) {
      console.error('Clear cart error:', error);
      return c.json(createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR), 500);
    }
  }
);

// =============================================================================
// CHECKOUT PROCESS
// =============================================================================

// Process checkout
app.post('/checkout',
  jwt({ secret: 'smartpos-production-jwt-secret-key-2025-secure-random-string-32-chars-minimum' }),
  requirePermissions(['pos.checkout']),
  zValidator('json', CheckoutSchema),
  async (c: any) => {
    try {
      const userId = c.get('userId');
      const tenantId = c.get('tenantId');
      const data = c.req.valid('json');

      // Get cart items
      const cartItems = await c.env.DB.prepare(`
        SELECT ci.*, p.name as product_name, p.sku, pv.name as variant_name
        FROM cart_items ci
        LEFT JOIN products p ON ci.product_id = p.id
        LEFT JOIN product_variants pv ON ci.variant_id = pv.id
        WHERE ci.user_id = ? AND ci.tenant_id = ? AND ci.status = 'active'
      `).bind(userId, tenantId).all();

      if (!cartItems.results || cartItems.results.length === 0) {
        return c.json(createErrorResponse('Cart is empty'), 400);
      }

      // Calculate totals
      const subtotal = cartItems.results.reduce((sum: number, item: any) => 
        sum + (item.quantity * item.unit_price * (1 - item.discount_percent / 100)), 0);
      
      const discountAmount = data.discount_amount || (subtotal * (data.discount_percent || 0) / 100);
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = taxableAmount * (data.tax_percent || 0) / 100;
      const totalAmount = taxableAmount + taxAmount;

      // Validate payment amounts
      const totalPaid = data.payments.reduce((sum, payment) => sum + payment.amount, 0);
      if (Math.abs(totalPaid - totalAmount) > 0.01) {
        return c.json(createErrorResponse('Payment amount does not match total'), 400);
      }

      // Generate invoice number
      const invoiceNumber = await generateInvoiceNumber(c.env.DB, tenantId);

      // Begin transaction
      const invoiceId = crypto.randomUUID();
      const customerId = data.customer_info.customer_id || null;

      // Create invoice
      const invoice = await c.env.DB.prepare(`
        INSERT INTO invoices (
          id, tenant_id, invoice_number, customer_id, customer_name, customer_phone,
          customer_email, customer_address, user_id, subtotal, discount_percent,
          discount_amount, tax_percent, tax_amount, total_amount, status,
          invoice_date, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?)
        RETURNING *
      `).bind(
        invoiceId, tenantId, invoiceNumber, customerId,
        data.customer_info.name, data.customer_info.phone || null,
        data.customer_info.email || null, data.customer_info.address || null,
        userId, subtotal, data.discount_percent, discountAmount,
        data.tax_percent, taxAmount, totalAmount,
        data.invoice_date || new Date().toISOString().split('T')[0],
        data.notes || null, userId
      ).first();

      // Create invoice items
      for (const item of cartItems.results) {
        const itemId = crypto.randomUUID();
        await c.env.DB.prepare(`
          INSERT INTO invoice_items (
            id, invoice_id, tenant_id, product_id, variant_id, product_name,
            variant_name, sku, quantity, unit_price, discount_percent, line_total
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          itemId, invoiceId, tenantId, item.product_id, item.variant_id,
          item.product_name, item.variant_name, item.sku || item.variant_sku,
          item.quantity, item.unit_price, item.discount_percent,
          item.quantity * item.unit_price * (1 - item.discount_percent / 100)
        ).run();

        // Update inventory
        await c.env.DB.prepare(`
          UPDATE inventory_levels 
          SET quantity = quantity - ?
          WHERE product_id = ? AND COALESCE(variant_id, '') = COALESCE(?, '')
            AND tenant_id = ?
        `).bind(
          item.quantity, item.product_id, item.variant_id || '', tenantId
        ).run();
      }

      // Create payments
      for (const payment of data.payments) {
        const paymentId = crypto.randomUUID();
        await c.env.DB.prepare(`
          INSERT INTO payments (
            id, tenant_id, invoice_id, method, amount, reference_number,
            status, notes, processed_by, processed_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?, CURRENT_TIMESTAMP)
        `).bind(
          paymentId, tenantId, invoiceId, payment.payment_method, payment.amount,
          null, null, userId
        ).run();
      }

      // Clear cart
      await c.env.DB.prepare(`
        DELETE FROM cart_items 
        WHERE user_id = ? AND tenant_id = ? AND status = 'active'
      `).bind(userId, tenantId).run();

      // Create audit log
      await c.env.DB.prepare(`
        INSERT INTO audit_logs (
          id, tenant_id, user_id, entity_type, entity_id, action, description
        ) VALUES (?, ?, ?, 'invoice', ?, 'create', ?)
      `).bind(
        crypto.randomUUID(), tenantId, userId, invoiceId,
        `Created invoice ${invoiceNumber} for ${data.customer_info.name}`
      ).run();

      // 🔴 REAL-TIME: Broadcast sale completion
      try {
        await RealtimeEventBroadcaster.broadcastSaleUpdate(c.env, {
          type: 'checkout_completed',
          invoice_id: invoiceId,
          invoice_number: invoiceNumber,
          total_amount: totalAmount,
          customer_name: data.customer_info.customer_name,
          items_count: cartItems.results.length,
          payment_methods: data.payments.map(p => p.payment_method),
          cashier: userId,
          timestamp: new Date().toISOString()
        });

        // 🔴 REAL-TIME: Broadcast inventory updates for each item
        for (const item of cartItems.results) {
          await RealtimeEventBroadcaster.broadcastInventoryUpdate(c.env, {
            type: 'stock_reduced',
            product_id: item.product_id,
            variant_id: item.variant_id,
            quantity_sold: item.quantity,
            remaining_stock: item.current_stock - item.quantity,
            product_name: item.product_name
          });
        }

        console.log('✅ Real-time checkout notifications sent');
      } catch (broadcastError) {
        console.error('⚠️ Real-time broadcast failed:', broadcastError);
        // Don't fail the checkout if broadcast fails
      }

      // 🔔 Create system notification for sale completion
      try {
        await NotificationService.notifySaleCompleted(c.env, tenantId, {
          invoice_id: invoiceId,
          invoice_number: invoiceNumber,
          total_amount: totalAmount,
          customer_name: data.customer_info.customer_name,
          cashier: userId
        });
      } catch (notificationError) {
        console.error('⚠️ Sale notification failed:', notificationError);
      }

      return c.json(createSuccessResponse({
        invoice,
        invoice_number: invoiceNumber,
        total_amount: totalAmount,
        payments: data.payments
      }, SUCCESS_MESSAGES.INVOICE_CREATED));
    } catch (error) {
      console.error('Checkout error:', error);
      return c.json(createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR), 500);
    }
  }
);

// =============================================================================
// INVOICE MANAGEMENT  
// =============================================================================

// Get invoice details
app.get('/invoices/:id',
  jwt({ secret: 'smartpos-production-jwt-secret-key-2025-secure-random-string-32-chars-minimum' }),
  requirePermissions(['pos.read']),
  async (c: any) => {
    try {
      const tenantId = c.get('tenantId');
      const invoiceId = c.req.param('id');

      const invoice = await c.env.DB.prepare(`
        SELECT i.*, u.full_name as cashier_name
        FROM invoices i
        LEFT JOIN users u ON i.user_id = u.id
        WHERE i.id = ? AND i.tenant_id = ?
      `).bind(invoiceId, tenantId).first();

      if (!invoice) {
        return c.json(createErrorResponse(ERROR_MESSAGES.INVOICE_NOT_FOUND), 404);
      }

      // Get invoice items
      const items = await c.env.DB.prepare(`
        SELECT * FROM invoice_items 
        WHERE invoice_id = ? AND tenant_id = ?
        ORDER BY created_at
      `).bind(invoiceId, tenantId).all();

      // Get payments
      const payments = await c.env.DB.prepare(`
        SELECT * FROM payments 
        WHERE invoice_id = ? AND tenant_id = ?
        ORDER BY processed_at
      `).bind(invoiceId, tenantId).all();

      const invoiceDetails = {
        ...invoice,
        items: items.results || [],
        payments: payments.results || []
      };

      return c.json(createSuccessResponse(invoiceDetails, SUCCESS_MESSAGES.RETRIEVED));
    } catch (error) {
      console.error('Get invoice error:', error);
      return c.json(createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR), 500);
    }
  }
);

// Void invoice
app.post('/invoices/:id/void',
  jwt({ secret: 'smartpos-production-jwt-secret-key-2025-secure-random-string-32-chars-minimum' }),
  requirePermissions(['pos.void']),
  zValidator('json', VoidInvoiceSchema),
  async (c: any) => {
    try {
      const userId = c.get('userId');
      const tenantId = c.get('tenantId');
      const invoiceId = c.req.param('id');
      const data = c.req.valid('json');

      // Check if invoice exists and can be voided
      const invoice = await c.env.DB.prepare(`
        SELECT * FROM invoices 
        WHERE id = ? AND tenant_id = ? AND status = 'completed'
      `).bind(invoiceId, tenantId).first();

      if (!invoice) {
        return c.json(createErrorResponse('Invoice not found or cannot be voided'), 404);
      }

      // Update invoice status
      await c.env.DB.prepare(`
        UPDATE invoices SET 
          status = 'voided',
          void_reason = ?,
          voided_by = ?,
          voided_at = CURRENT_TIMESTAMP,
          notes = COALESCE(notes || ' | ', '') || ?
        WHERE id = ? AND tenant_id = ?
      `).bind(data.reason, userId, data.notes || '', invoiceId, tenantId).run();

      // Restore inventory
      const items = await c.env.DB.prepare(`
        SELECT * FROM invoice_items WHERE invoice_id = ? AND tenant_id = ?
      `).bind(invoiceId, tenantId).all();

      for (const item of items.results || []) {
        await c.env.DB.prepare(`
          UPDATE inventory_levels 
          SET quantity = quantity + ?
          WHERE product_id = ? AND COALESCE(variant_id, '') = COALESCE(?, '')
            AND tenant_id = ?
        `).bind(
          item.quantity, item.product_id, item.variant_id || '', tenantId
        ).run();
      }

      // Update payment status
      await c.env.DB.prepare(`
        UPDATE payments SET status = 'voided' 
        WHERE invoice_id = ? AND tenant_id = ?
      `).bind(invoiceId, tenantId).run();

      // Create audit log
      await c.env.DB.prepare(`
        INSERT INTO audit_logs (
          id, tenant_id, user_id, entity_type, entity_id, action, description
        ) VALUES (?, ?, ?, 'invoice', ?, 'void', ?)
      `).bind(
        crypto.randomUUID(), tenantId, userId, invoiceId,
        `Voided invoice ${invoice.invoice_number}: ${data.reason}`
      ).run();

      return c.json(createSuccessResponse(null, 'Invoice voided successfully'));
    } catch (error) {
      console.error('Void invoice error:', error);
      return c.json(createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR), 500);
    }
  }
);

// =============================================================================
// UTILITIES
// =============================================================================

async function generateInvoiceNumber(db: any, tenantId: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0]?.replace(/-/g, '') || '';
  
  const lastInvoice = await db.prepare(`
    SELECT invoice_number FROM invoices 
    WHERE tenant_id = ? AND invoice_number LIKE ? 
    ORDER BY created_at DESC LIMIT 1
  `).bind(tenantId, `INV${today}%`).first();

  let sequence = 1;
  if (lastInvoice) {
    const lastSequence = parseInt(lastInvoice.invoice_number.slice(-4));
    sequence = lastSequence + 1;
  }

  return `INV${today}${sequence.toString().padStart(4, '0')}`;
}

export default app;