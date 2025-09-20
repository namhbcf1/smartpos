/**
 * Supplier Management System
 * Handles supplier data, purchase orders, and vendor relationships
 */

import { Hono } from 'hono';
import { authenticate } from '../../middleware/auth';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { 
  createSuccessResponse, 
  createErrorResponse,
  createPaginatedResponse,
  createValidationErrorResponse,
  createApiError,
  createPaginationInfo,
  validatePaginationParams,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  ERROR_CODES 
} from '../../utils/api-response';
import { requirePermissions } from '../../middleware/rbac';
import type { Context } from 'hono';
import type { Supplier, PurchaseOrder } from '../../types/api-standard';

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

// Ensure required D1 tables exist (idempotent)
async function ensureSupplierSchema(db: D1Database) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      supplier_code TEXT,
      name TEXT NOT NULL,
      contact_person TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      postal_code TEXT,
      country TEXT,
      website TEXT,
      tax_number TEXT,
      bank_account TEXT,
      bank_name TEXT,
      payment_terms TEXT,
      credit_limit REAL,
      discount_percent REAL,
      lead_time_days INTEGER,
      min_order_amount REAL,
      notes TEXT,
      status TEXT DEFAULT 'active',
      rating INTEGER DEFAULT 3,
      categories TEXT,
      custom_fields TEXT,
      created_by TEXT,
      updated_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS purchase_orders (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      po_number TEXT,
      supplier_id TEXT,
      expected_date TEXT,
      payment_terms TEXT,
      subtotal REAL,
      discount_percent REAL,
      discount_amount REAL,
      tax_percent REAL,
      tax_amount REAL,
      shipping_cost REAL,
      total_amount REAL,
      status TEXT,
      notes TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS purchase_order_items (
      id TEXT PRIMARY KEY,
      purchase_order_id TEXT,
      tenant_id TEXT,
      product_id TEXT,
      variant_id TEXT,
      quantity REAL,
      unit_price REAL,
      discount_percent REAL,
      line_total REAL,
      notes TEXT
    );
  `);
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').max(255),
  contact_person: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().min(1, 'Phone number is required').max(20),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().default('VN'),
  website: z.string().url().optional(),
  tax_number: z.string().optional(),
  bank_account: z.string().optional(),
  bank_name: z.string().optional(),
  payment_terms: z.string().default('NET30'), // NET30, NET15, COD, etc.
  credit_limit: z.number().min(0).default(0),
  discount_percent: z.number().min(0).max(100).default(0),
  lead_time_days: z.number().min(0).default(7),
  min_order_amount: z.number().min(0).default(0),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive', 'blocked']).default('active'),
  rating: z.number().min(1).max(5).default(3),
  categories: z.array(z.string()).default([]),
  custom_fields: z.record(z.string(), z.any()).optional()
});

const supplierUpdateSchema = supplierSchema.partial();

const purchaseOrderSchema = z.object({
  supplier_id: z.string().min(1, 'Supplier ID is required'),
  po_number: z.string().optional(), // Auto-generated if not provided
  expected_date: z.string().min(1, 'Expected delivery date is required'),
  payment_terms: z.string().default('NET30'),
  discount_percent: z.number().min(0).max(100).default(0),
  tax_percent: z.number().min(0).default(10),
  shipping_cost: z.number().min(0).default(0),
  notes: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().min(1, 'Product ID is required'),
    variant_id: z.string().optional(),
    quantity: z.number().positive('Quantity must be positive'),
    unit_price: z.number().positive('Unit price must be positive'),
    discount_percent: z.number().min(0).max(100).default(0),
    notes: z.string().optional()
  })).min(1, 'At least one item is required')
});

const updatePOStatusSchema = z.object({
  status: z.enum(['draft', 'sent', 'confirmed', 'partial', 'completed', 'cancelled']),
  notes: z.string().optional()
});

const receivePOItemSchema = z.object({
  po_item_id: z.string().min(1, 'PO item ID is required'),
  quantity_received: z.number().positive('Quantity received must be positive'),
  quality_check: z.enum(['passed', 'failed', 'pending']).default('passed'),
  notes: z.string().optional(),
  expiry_date: z.string().optional(),
  batch_number: z.string().optional()
});

// =============================================================================
// SUPPLIER MANAGEMENT
// =============================================================================

// Get all suppliers with filtering and pagination
app.get('/suppliers',
  authenticate,
  requirePermissions(['suppliers.read']),
  async (c: Context) => {
    try {
      await ensureSupplierSchema(c.env.DB);
      const tenantId = c.get('tenantId');
      const { page, limit } = validatePaginationParams(
        c.req.query('page'),
        c.req.query('limit')
      );

      // Build filters
      const filters: string[] = ['s.tenant_id = ?'];
      const params: any[] = [tenantId];

      if (c.req.query('status')) {
        filters.push('s.status = ?');
        params.push(c.req.query('status'));
      }

      if (c.req.query('search')) {
        filters.push('(s.name LIKE ? OR s.email LIKE ? OR s.phone LIKE ?)');
        const searchTerm = `%${c.req.query('search')}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (c.req.query('city')) {
        filters.push('s.city = ?');
        params.push(c.req.query('city'));
      }

      if (c.req.query('category')) {
        filters.push('s.categories LIKE ?');
        params.push(`%"${c.req.query('category')}"%`);
      }

      if (c.req.query('has_orders')) {
        filters.push('stats.total_orders > 0');
      }

      const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
      
      // Get total count
      const countQuery = `
        SELECT COUNT(*) as count
        FROM suppliers s
        LEFT JOIN (
          SELECT supplier_id, COUNT(*) as total_orders, SUM(total_amount) as total_spent
          FROM purchase_orders
          WHERE tenant_id = ? AND status != 'cancelled'
          GROUP BY supplier_id
        ) stats ON s.id = stats.supplier_id
        ${whereClause}
      `;
      
      const totalResult = await c.env.DB.prepare(countQuery)
        .bind(tenantId, ...params)
        .first();
      
      const total = totalResult?.count || 0;

      // Get suppliers with pagination
      const suppliersQuery = `
        SELECT 
          s.*,
          COALESCE(stats.total_orders, 0) as total_orders,
          COALESCE(stats.total_spent, 0) as total_spent,
          COALESCE(stats.last_order, '') as last_order_date,
          COALESCE(pending.pending_orders, 0) as pending_orders
        FROM suppliers s
        LEFT JOIN (
          SELECT 
            supplier_id, 
            COUNT(*) as total_orders, 
            SUM(total_amount) as total_spent,
            MAX(created_at) as last_order
          FROM purchase_orders
          WHERE tenant_id = ? AND status != 'cancelled'
          GROUP BY supplier_id
        ) stats ON s.id = stats.supplier_id
        LEFT JOIN (
          SELECT 
            supplier_id,
            COUNT(*) as pending_orders
          FROM purchase_orders
          WHERE tenant_id = ? AND status IN ('draft', 'sent', 'confirmed', 'partial')
          GROUP BY supplier_id
        ) pending ON s.id = pending.supplier_id
        ${whereClause}
        ORDER BY s.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const suppliers = await c.env.DB.prepare(suppliersQuery)
        .bind(tenantId, tenantId, ...params, limit, (page - 1) * limit)
        .all();

      const pagination = createPaginationInfo(page, limit, total);

      return c.json(createPaginatedResponse(
        suppliers.results || [],
        pagination,
        SUCCESS_MESSAGES.RETRIEVED
      ));
    } catch (error) {
      console.error('Get suppliers error:', error);
      return c.json(createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR), 500);
    }
  }
);

// Get single supplier
app.get('/suppliers/:id',
  authenticate,
  requirePermissions(['suppliers.read']),
  async (c: Context) => {
    try {
      const tenantId = c.get('tenantId');
      const supplierId = c.req.param('id');

      const supplier = await c.env.DB.prepare(`
        SELECT 
          s.*,
          u1.full_name as created_by_name,
          u2.full_name as updated_by_name
        FROM suppliers s
        LEFT JOIN users u1 ON s.created_by = u1.id
        LEFT JOIN users u2 ON s.updated_by = u2.id
        WHERE s.id = ? AND s.tenant_id = ?
      `).bind(supplierId, tenantId).first();

      if (!supplier) {
        return c.json(createErrorResponse('Supplier not found'), 404);
      }

      // Get supplier statistics
      const stats = await c.env.DB.prepare(`
        SELECT 
          COUNT(*) as total_orders,
          SUM(total_amount) as total_spent,
          AVG(total_amount) as avg_order_value,
          MAX(created_at) as last_order_date,
          MIN(created_at) as first_order_date,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
          SUM(CASE WHEN status IN ('draft', 'sent', 'confirmed', 'partial') THEN 1 ELSE 0 END) as pending_orders
        FROM purchase_orders
        WHERE supplier_id = ? AND tenant_id = ? AND status != 'cancelled'
      `).bind(supplierId, tenantId).first();

      // Get recent purchase orders
      const recentOrders = await c.env.DB.prepare(`
        SELECT 
          id, po_number, created_at, expected_date, total_amount, status,
          (SELECT GROUP_CONCAT(p.name, ', ') 
           FROM purchase_order_items poi
           LEFT JOIN products p ON poi.product_id = p.id
           WHERE poi.purchase_order_id = purchase_orders.id 
           LIMIT 3) as items_preview
        FROM purchase_orders
        WHERE supplier_id = ? AND tenant_id = ?
        ORDER BY created_at DESC
        LIMIT 10
      `).bind(supplierId, tenantId).all();

      // Get products supplied by this supplier
      const suppliedProducts = await c.env.DB.prepare(`
        SELECT DISTINCT
          p.id, p.name, p.sku,
          COUNT(poi.id) as times_ordered,
          AVG(poi.unit_price) as avg_price,
          MAX(po.created_at) as last_ordered
        FROM products p
        JOIN purchase_order_items poi ON p.id = poi.product_id
        JOIN purchase_orders po ON poi.purchase_order_id = po.id
        WHERE po.supplier_id = ? AND po.tenant_id = ?
        GROUP BY p.id, p.name, p.sku
        ORDER BY times_ordered DESC
        LIMIT 20
      `).bind(supplierId, tenantId).all();

      const supplierDetails = {
        ...supplier,
        statistics: {
          total_orders: stats?.total_orders || 0,
          total_spent: stats?.total_spent || 0,
          avg_order_value: stats?.avg_order_value || 0,
          last_order_date: stats?.last_order_date || null,
          first_order_date: stats?.first_order_date || null,
          completed_orders: stats?.completed_orders || 0,
          pending_orders: stats?.pending_orders || 0
        },
        recent_orders: recentOrders.results || [],
        supplied_products: suppliedProducts.results || []
      };

      return c.json(createSuccessResponse(supplierDetails, SUCCESS_MESSAGES.RETRIEVED));
    } catch (error) {
      console.error('Get supplier error:', error);
      return c.json(createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR), 500);
    }
  }
);

// Create supplier
app.post('/suppliers',
  authenticate,
  requirePermissions(['suppliers.write']),
  zValidator('json', supplierSchema),
  async (c: Context) => {
    try {
      await ensureSupplierSchema(c.env.DB);
      const userId = c.get('userId');
      const tenantId = c.get('tenantId');
      const data = await c.req.json() as any;

      // Check if email already exists (if provided)
      if (data.email) {
        const existingEmail = await c.env.DB.prepare(`
          SELECT id FROM suppliers WHERE email = ? AND tenant_id = ?
        `).bind(data.email, tenantId).first();

        if (existingEmail) {
          return c.json(createValidationErrorResponse([
            createApiError(ERROR_CODES.RESOURCE_CONFLICT, ERROR_MESSAGES.EMAIL_EXISTS, 'email')
          ]));
        }
      }

      // Check if phone already exists
      const existingPhone = await c.env.DB.prepare(`
        SELECT id FROM suppliers WHERE phone = ? AND tenant_id = ?
      `).bind(data.phone, tenantId).first();

      if (existingPhone) {
        return c.json(createValidationErrorResponse([
          createApiError(ERROR_CODES.RESOURCE_CONFLICT, 'Phone number already exists', 'phone')
        ]));
      }

      // Generate supplier code
      const supplierCode = await generateSupplierCode(c.env.DB, tenantId);
      const supplierId = crypto.randomUUID();

      const supplier = await c.env.DB.prepare(`
        INSERT INTO suppliers (
          id, tenant_id, supplier_code, name, contact_person, email, phone,
          address, city, state, postal_code, country, website, tax_number,
          bank_account, bank_name, payment_terms, credit_limit, discount_percent,
          lead_time_days, min_order_amount, notes, status, rating, categories,
          custom_fields, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `).bind(
        supplierId, tenantId, supplierCode, data.name, data.contact_person || null,
        data.email || null, data.phone, data.address || null, data.city || null,
        data.state || null, data.postal_code || null, data.country,
        data.website || null, data.tax_number || null, data.bank_account || null,
        data.bank_name || null, data.payment_terms, data.credit_limit,
        data.discount_percent, data.lead_time_days, data.min_order_amount,
        data.notes || null, data.status, data.rating,
        JSON.stringify(data.categories), JSON.stringify(data.custom_fields || {}),
        userId
      ).first();

      // Create audit log
      await c.env.DB.prepare(`
        INSERT INTO audit_logs (
          id, tenant_id, user_id, entity_type, entity_id, action, description
        ) VALUES (?, ?, ?, 'supplier', ?, 'create', ?)
      `).bind(
        crypto.randomUUID(), tenantId, userId, supplierId,
        `Created supplier: ${data.name} (${supplierCode})`
      ).run();

      return c.json(createSuccessResponse(supplier, 'Supplier created successfully'), 201);
    } catch (error) {
      console.error('Create supplier error:', error);
      return c.json(createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR), 500);
    }
  }
);

// Update supplier
app.put('/suppliers/:id',
  authenticate,
  requirePermissions(['suppliers.write']),
  zValidator('json', supplierUpdateSchema),
  async (c: Context) => {
    try {
      const userId = c.get('userId');
      const tenantId = c.get('tenantId');
      const supplierId = c.req.param('id');
      const data = await c.req.json() as any;

      // Check if supplier exists
      const existingSupplier = await c.env.DB.prepare(`
        SELECT * FROM suppliers WHERE id = ? AND tenant_id = ?
      `).bind(supplierId, tenantId).first();

      if (!existingSupplier) {
        return c.json(createErrorResponse('Supplier not found'), 404);
      }

      // Check email uniqueness if being updated
      if (data.email && data.email !== existingSupplier.email) {
        const existingEmail = await c.env.DB.prepare(`
          SELECT id FROM suppliers WHERE email = ? AND tenant_id = ? AND id != ?
        `).bind(data.email, tenantId, supplierId).first();

        if (existingEmail) {
          return c.json(createValidationErrorResponse([
            createApiError(ERROR_CODES.RESOURCE_CONFLICT, ERROR_MESSAGES.EMAIL_EXISTS, 'email')
          ]));
        }
      }

      // Build update query dynamically
      const updates: string[] = [];
      const params: any[] = [];

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'categories' || key === 'custom_fields') {
            updates.push(`${key} = ?`);
            params.push(JSON.stringify(value));
          } else {
            updates.push(`${key} = ?`);
            params.push(value);
          }
        }
      });

      if (updates.length === 0) {
        return c.json(createErrorResponse('No fields to update'), 400);
      }

      updates.push('updated_by = ?', 'updated_at = CURRENT_TIMESTAMP');
      params.push(userId, supplierId, tenantId);

      const supplier = await c.env.DB.prepare(`
        UPDATE suppliers SET ${updates.join(', ')}
        WHERE id = ? AND tenant_id = ?
        RETURNING *
      `).bind(...params).first();

      // Create audit log
      await c.env.DB.prepare(`
        INSERT INTO audit_logs (
          id, tenant_id, user_id, entity_type, entity_id, action, description
        ) VALUES (?, ?, ?, 'supplier', ?, 'update', ?)
      `).bind(
        crypto.randomUUID(), tenantId, userId, supplierId,
        `Updated supplier: ${supplier?.name || existingSupplier.name}`
      ).run();

      return c.json(createSuccessResponse(supplier, 'Supplier updated successfully'));
    } catch (error) {
      console.error('Update supplier error:', error);
      return c.json(createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR), 500);
    }
  }
);

// =============================================================================
// PURCHASE ORDERS
// =============================================================================

// Get all purchase orders
app.get('/purchase-orders',
  authenticate,
  requirePermissions(['purchases.read']),
  async (c: Context) => {
    try {
      await ensureSupplierSchema(c.env.DB);
      const tenantId = c.get('tenantId');
      const { page, limit } = validatePaginationParams(
        c.req.query('page'),
        c.req.query('limit')
      );

      // Build filters
      const filters: string[] = ['po.tenant_id = ?'];
      const params: any[] = [tenantId];

      if (c.req.query('supplier_id')) {
        filters.push('po.supplier_id = ?');
        params.push(c.req.query('supplier_id'));
      }

      if (c.req.query('status')) {
        filters.push('po.status = ?');
        params.push(c.req.query('status'));
      }

      if (c.req.query('search')) {
        filters.push('(po.po_number LIKE ? OR s.name LIKE ?)');
        const searchTerm = `%${c.req.query('search')}%`;
        params.push(searchTerm, searchTerm);
      }

      const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as count
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        ${whereClause}
      `;

      const totalResult = await c.env.DB.prepare(countQuery)
        .bind(tenantId, ...params)
        .first();

      const total = totalResult?.count || 0;

      // Get purchase orders
      const ordersQuery = `
        SELECT 
          po.*,
          s.name as supplier_name,
          s.contact_person,
          s.payment_terms as supplier_payment_terms,
          u.full_name as created_by_name,
          COUNT(poi.id) as item_count
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        LEFT JOIN users u ON po.created_by = u.id
        LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
        ${whereClause}
        GROUP BY po.id
        ORDER BY po.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const orders = await c.env.DB.prepare(ordersQuery)
        .bind(tenantId, ...params, limit, (page - 1) * limit)
        .all();

      const pagination = createPaginationInfo(page, limit, total);

      return c.json(createPaginatedResponse(
        orders.results || [],
        pagination,
        SUCCESS_MESSAGES.RETRIEVED
      ));
    } catch (error) {
      console.error('Get purchase orders error:', error);
      return c.json(createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR), 500);
    }
  }
);

// Create purchase order
app.post('/purchase-orders',
  authenticate,
  requirePermissions(['purchases.write']),
  zValidator('json', purchaseOrderSchema),
  async (c: Context) => {
    try {
      const userId = c.get('userId');
      const tenantId = c.get('tenantId');
      const data = await c.req.json() as any;

      // Verify supplier exists
      const supplier = await c.env.DB.prepare(`
        SELECT * FROM suppliers WHERE id = ? AND tenant_id = ? AND status = 'active'
      `).bind(data.supplier_id, tenantId).first();

      if (!supplier) {
        return c.json(createErrorResponse('Supplier not found or inactive'), 404);
      }

      // Generate PO number if not provided
      const poNumber = data.po_number || await generatePONumber(c.env.DB, tenantId);

      // Validate products exist
      for (const item of data.items) {
        const product = await c.env.DB.prepare(`
          SELECT id FROM products WHERE id = ? AND tenant_id = ? AND status = 'active'
        `).bind(item.product_id, tenantId).first();

        if (!product) {
          return c.json(createErrorResponse(`Product ${item.product_id} not found`), 400);
        }
      }

      // Calculate totals
      const subtotal = data.items.reduce((sum: number, item: any) => 
        sum + (item.quantity * item.unit_price * (1 - item.discount_percent / 100)), 0);
      
      const discountAmount = subtotal * data.discount_percent / 100;
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = taxableAmount * data.tax_percent / 100;
      const totalAmount = taxableAmount + taxAmount + data.shipping_cost;

      const poId = crypto.randomUUID();

      // Create purchase order
      const purchaseOrder = await c.env.DB.prepare(`
        INSERT INTO purchase_orders (
          id, tenant_id, po_number, supplier_id, expected_date, payment_terms,
          subtotal, discount_percent, discount_amount, tax_percent, tax_amount,
          shipping_cost, total_amount, status, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)
        RETURNING *
      `).bind(
        poId, tenantId, poNumber, data.supplier_id, data.expected_date,
        data.payment_terms, subtotal, data.discount_percent, discountAmount,
        data.tax_percent, taxAmount, data.shipping_cost, totalAmount,
        data.notes || null, userId
      ).first();

      // Create purchase order items
      for (const item of data.items) {
        const itemId = crypto.randomUUID();
        const lineTotal = item.quantity * item.unit_price * (1 - item.discount_percent / 100);

        await c.env.DB.prepare(`
          INSERT INTO purchase_order_items (
            id, purchase_order_id, tenant_id, product_id, variant_id,
            quantity, unit_price, discount_percent, line_total, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          itemId, poId, tenantId, item.product_id, item.variant_id || null,
          item.quantity, item.unit_price, item.discount_percent,
          lineTotal, item.notes || null
        ).run();
      }

      // Create audit log
      await c.env.DB.prepare(`
        INSERT INTO audit_logs (
          id, tenant_id, user_id, entity_type, entity_id, action, description
        ) VALUES (?, ?, ?, 'purchase_order', ?, 'create', ?)
      `).bind(
        crypto.randomUUID(), tenantId, userId, poId,
        `Created PO ${poNumber} for ${supplier.name}`
      ).run();

      return c.json(createSuccessResponse({
        ...purchaseOrder,
        po_number: poNumber,
        total_amount: totalAmount
      }, 'Purchase order created successfully'), 201);
    } catch (error) {
      console.error('Create purchase order error:', error);
      return c.json(createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR), 500);
    }
  }
);

// =============================================================================
// UTILITIES
// =============================================================================

async function generateSupplierCode(db: D1Database, tenantId: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0]?.replace(/-/g, '') || '';
  
  const lastSupplier = await db.prepare(`
    SELECT supplier_code FROM suppliers 
    WHERE tenant_id = ? AND supplier_code LIKE ? 
    ORDER BY created_at DESC LIMIT 1
  `).bind(tenantId, `SUP${today}%`).first();

  let sequence = 1;
  if (lastSupplier) {
    const lastSequence = parseInt((lastSupplier.supplier_code as string)?.slice(-4) || '0');
    sequence = lastSequence + 1;
  }

  return `SUP${today}${sequence.toString().padStart(4, '0')}`;
}

async function generatePONumber(db: D1Database, tenantId: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0]?.replace(/-/g, '') || '';
  
  const lastPO = await db.prepare(`
    SELECT po_number FROM purchase_orders 
    WHERE tenant_id = ? AND po_number LIKE ? 
    ORDER BY created_at DESC LIMIT 1
  `).bind(tenantId, `PO${today}%`).first();

  let sequence = 1;
  if (lastPO) {
    const lastSequence = parseInt((lastPO.po_number as string)?.slice(-4) || '0');
    sequence = lastSequence + 1;
  }

  return `PO${today}${sequence.toString().padStart(4, '0')}`;
}

export default app;