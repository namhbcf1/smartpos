/**
 * Warranty Management System
 * Handles warranty registrations, claims, and repair tracking
 */

import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
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
// import type { Warranty, WarrantyClaim, RepairOrder } from '../../types/api-standard';

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

const warrantyRegistrationSchema = z.object({
  customer_id: z.string().min(1, 'Customer ID is required'),
  product_id: z.string().min(1, 'Product ID is required'),
  variant_id: z.string().optional(),
  serial_number: z.string().min(1, 'Serial number is required'),
  purchase_date: z.string().min(1, 'Purchase date is required'),
  purchase_invoice: z.string().optional(),
  warranty_months: z.number().min(1).max(120),
  purchase_price: z.number().min(0).default(0),
  dealer_name: z.string().optional(),
  dealer_contact: z.string().optional(),
  notes: z.string().optional(),
  attachments: z.array(z.string()).default([])
});

const warrantyClaimSchema = z.object({
  warranty_id: z.string().min(1, 'Warranty ID is required'),
  issue_description: z.string().min(1, 'Issue description is required'),
  issue_category: z.enum(['hardware', 'software', 'performance', 'cosmetic', 'other']),
  reported_by: z.string().optional(), // Customer name or contact
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional(),
  preferred_resolution: z.enum(['repair', 'replacement', 'refund']).default('repair'),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  attachments: z.array(z.string()).default([]), // Photos, documents
  symptoms: z.array(z.string()).default([]),
  steps_to_reproduce: z.string().optional()
});

const updateClaimStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled']),
  resolution_type: z.enum(['repair', 'replacement', 'refund', 'no_action']).optional(),
  resolution_notes: z.string().optional(),
  technician_notes: z.string().optional(),
  estimated_cost: z.number().min(0).optional(),
  estimated_completion: z.string().optional()
});

const repairOrderSchema = z.object({
  warranty_claim_id: z.string().min(1, 'Warranty claim ID is required'),
  technician_id: z.string().optional(),
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  repair_type: z.enum(['warranty', 'paid', 'goodwill']).default('warranty'),
  estimated_hours: z.number().min(0).default(0),
  hourly_rate: z.number().min(0).default(0),
  parts_cost: z.number().min(0).default(0),
  labor_cost: z.number().min(0).default(0),
  total_cost: z.number().min(0).default(0),
  parts_needed: z.array(z.object({
    product_id: z.string(),
    quantity: z.number().positive(),
    unit_cost: z.number().min(0).default(0)
  })).default([]),
  repair_notes: z.string().optional(),
  customer_approval_required: z.boolean().default(false),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium')
});

const updateRepairStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'waiting_parts', 'customer_approval', 'completed', 'cancelled']),
  progress_notes: z.string().optional(),
  actual_hours: z.number().min(0).optional(),
  actual_parts_cost: z.number().min(0).optional(),
  completion_date: z.string().optional(),
  quality_check_passed: z.boolean().optional(),
  customer_satisfaction: z.number().min(1).max(5).optional()
});

// =============================================================================
// WARRANTY REGISTRATION
// =============================================================================

// Get all warranty registrations
app.get('/warranties',
  jwt({ secret: 'prod-c3629b31f81d4c0a23826b97cb634e9681f97688e0d8d312ca94664d793faa10-smart' }),
  requirePermissions(['warranty.read']),
  async (c: Context) => {
    try {
      const tenantId = c.get('tenantId');
      const { page, limit } = validatePaginationParams(
        c.req.query('page'),
        c.req.query('limit')
      );

      // Build filters
      const filters: string[] = ['w.tenant_id = ?'];
      const params: any[] = [tenantId];

      if (c.req.query('customer_id')) {
        filters.push('w.customer_id = ?');
        params.push(c.req.query('customer_id'));
      }

      if (c.req.query('product_id')) {
        filters.push('w.product_id = ?');
        params.push(c.req.query('product_id'));
      }

      if (c.req.query('status')) {
        filters.push('w.status = ?');
        params.push(c.req.query('status'));
      }

      if (c.req.query('search')) {
        filters.push('(w.serial_number LIKE ? OR c.name LIKE ? OR p.name LIKE ?)');
        const searchTerm = `%${c.req.query('search')}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (c.req.query('expired')) {
        const isExpired = c.req.query('expired') === 'true';
        if (isExpired) {
          filters.push('w.expiry_date < date("now")');
        } else {
          filters.push('w.expiry_date >= date("now")');
        }
      }

      if (c.req.query('expiring_soon')) {
        filters.push('w.expiry_date BETWEEN date("now") AND date("now", "+30 days")');
      }

      const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as count
        FROM warranties w
        LEFT JOIN customers c ON w.customer_id = c.id
        LEFT JOIN products p ON w.product_id = p.id
        ${whereClause}
      `;

      const totalResult = await c.env.DB.prepare(countQuery)
        .bind(tenantId, ...params)
        .first();

      const total = totalResult?.count || 0;

      // Get warranties
      const warrantiesQuery = `
        SELECT 
          w.*,
          c.name as customer_name,
          c.phone as customer_phone,
          c.email as customer_email,
          p.name as product_name,
          p.sku as product_sku,
          pv.name as variant_name,
          CASE 
            WHEN w.expiry_date < date('now') THEN 'expired'
            WHEN w.expiry_date BETWEEN date('now') AND date('now', '+30 days') THEN 'expiring'
            ELSE 'active'
          END as warranty_status,
          COALESCE(claims.claim_count, 0) as total_claims,
          COALESCE(claims.active_claims, 0) as active_claims
        FROM warranties w
        LEFT JOIN customers c ON w.customer_id = c.id
        LEFT JOIN products p ON w.product_id = p.id
        LEFT JOIN product_variants pv ON w.variant_id = pv.id
        LEFT JOIN (
          SELECT 
            warranty_id,
            COUNT(*) as claim_count,
            SUM(CASE WHEN status IN ('pending', 'approved', 'in_progress') THEN 1 ELSE 0 END) as active_claims
          FROM warranty_claims
          WHERE tenant_id = ?
          GROUP BY warranty_id
        ) claims ON w.id = claims.warranty_id
        ${whereClause}
        ORDER BY w.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const warranties = await c.env.DB.prepare(warrantiesQuery)
        .bind(tenantId, tenantId, ...params, limit, (page - 1) * limit)
        .all();

      const pagination = createPaginationInfo(page, limit, total);

      return c.json(createPaginatedResponse(
        warranties.results || [],
        pagination,
        SUCCESS_MESSAGES.RETRIEVED
      ));
    } catch (error) {
      console.error('Get warranties error:', error);
      return c.json(createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR), 500);
    }
  }
);

// Register new warranty
app.post('/warranties',
  jwt({ secret: 'prod-c3629b31f81d4c0a23826b97cb634e9681f97688e0d8d312ca94664d793faa10-smart' }),
  requirePermissions(['warranty.write']),
  zValidator('json', warrantyRegistrationSchema),
  async (c: Context) => {
    try {
      const userId = c.get('userId');
      const tenantId = c.get('tenantId');
      const data = await c.req.json() as any;

      // Verify customer exists
      const customer = await c.env.DB.prepare(`
        SELECT id, name FROM customers WHERE id = ? AND tenant_id = ?
      `).bind(data.customer_id, tenantId).first();

      if (!customer) {
        return c.json(createErrorResponse(ERROR_MESSAGES.CUSTOMER_NOT_FOUND), 404);
      }

      // Verify product exists
      const product = await c.env.DB.prepare(`
        SELECT id, name, warranty_months FROM products WHERE id = ? AND tenant_id = ?
      `).bind(data.product_id, tenantId).first();

      if (!product) {
        return c.json(createErrorResponse(ERROR_MESSAGES.PRODUCT_NOT_FOUND), 404);
      }

      // Check if serial number already exists
      const existingSerial = await c.env.DB.prepare(`
        SELECT id FROM warranties WHERE serial_number = ? AND tenant_id = ?
      `).bind(data.serial_number, tenantId).first();

      if (existingSerial) {
        return c.json(createValidationErrorResponse([
          createApiError(ERROR_CODES.RESOURCE_CONFLICT, 'Serial number already registered', 'serial_number')
        ]));
      }

      // Calculate warranty expiry date
      const purchaseDate = new Date(data.purchase_date);
      const expiryDate = new Date(purchaseDate);
      expiryDate.setMonth(expiryDate.getMonth() + data.warranty_months);

      // Generate warranty number
      const warrantyNumber = await generateWarrantyNumber(c.env.DB, tenantId);
      const warrantyId = crypto.randomUUID();

      const warranty = await c.env.DB.prepare(`
        INSERT INTO warranties (
          id, tenant_id, warranty_number, customer_id, product_id, variant_id,
          serial_number, purchase_date, purchase_invoice, warranty_months,
          expiry_date, purchase_price, dealer_name, dealer_contact, notes,
          attachments, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
        RETURNING *
      `).bind(
        warrantyId, tenantId, warrantyNumber, data.customer_id, data.product_id,
        data.variant_id || null, data.serial_number, data.purchase_date,
        data.purchase_invoice || null, data.warranty_months,
        expiryDate.toISOString().split('T')[0], data.purchase_price,
        data.dealer_name || null, data.dealer_contact || null,
        data.notes || null, JSON.stringify(data.attachments), userId
      ).first();

      // Create audit log
      await c.env.DB.prepare(`
        INSERT INTO audit_logs (
          id, tenant_id, user_id, entity_type, entity_id, action, description
        ) VALUES (?, ?, ?, 'warranty', ?, 'create', ?)
      `).bind(
        crypto.randomUUID(), tenantId, userId, warrantyId,
        `Registered warranty ${warrantyNumber} for ${customer.name} - ${product.name} (S/N: ${data.serial_number})`
      ).run();

      return c.json(createSuccessResponse({
        ...warranty,
        warranty_number: warrantyNumber,
        expiry_date: expiryDate.toISOString().split('T')[0]
      }, SUCCESS_MESSAGES.WARRANTY_CREATED), 201);
    } catch (error) {
      console.error('Register warranty error:', error);
      return c.json(createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR), 500);
    }
  }
);

// Get single warranty
app.get('/warranties/:id',
  jwt({ secret: 'prod-c3629b31f81d4c0a23826b97cb634e9681f97688e0d8d312ca94664d793faa10-smart' }),
  requirePermissions(['warranty.read']),
  async (c: Context) => {
    try {
      const tenantId = c.get('tenantId');
      const warrantyId = c.req.param('id');

      const warranty = await c.env.DB.prepare(`
        SELECT 
          w.*,
          c.name as customer_name,
          c.phone as customer_phone,
          c.email as customer_email,
          c.address as customer_address,
          p.name as product_name,
          p.sku as product_sku,
          p.brand as product_brand,
          pv.name as variant_name,
          u1.full_name as created_by_name,
          u2.full_name as updated_by_name,
          CASE 
            WHEN w.expiry_date < date('now') THEN 'expired'
            WHEN w.expiry_date BETWEEN date('now') AND date('now', '+30 days') THEN 'expiring'
            ELSE 'active'
          END as warranty_status
        FROM warranties w
        LEFT JOIN customers c ON w.customer_id = c.id
        LEFT JOIN products p ON w.product_id = p.id
        LEFT JOIN product_variants pv ON w.variant_id = pv.id
        LEFT JOIN users u1 ON w.created_by = u1.id
        LEFT JOIN users u2 ON w.updated_by = u2.id
        WHERE w.id = ? AND w.tenant_id = ?
      `).bind(warrantyId, tenantId).first();

      if (!warranty) {
        return c.json(createErrorResponse('Warranty not found'), 404);
      }

      // Get warranty claims
      const claims = await c.env.DB.prepare(`
        SELECT 
          wc.*,
          u.full_name as processed_by_name
        FROM warranty_claims wc
        LEFT JOIN users u ON wc.processed_by = u.id
        WHERE wc.warranty_id = ? AND wc.tenant_id = ?
        ORDER BY wc.created_at DESC
      `).bind(warrantyId, tenantId).all();

      const warrantyDetails = {
        ...warranty,
        claims: claims.results || []
      };

      return c.json(createSuccessResponse(warrantyDetails, SUCCESS_MESSAGES.RETRIEVED));
    } catch (error) {
      console.error('Get warranty error:', error);
      return c.json(createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR), 500);
    }
  }
);

// =============================================================================
// WARRANTY CLAIMS
// =============================================================================

// Get all warranty claims
app.get('/warranty-claims',
  jwt({ secret: 'prod-c3629b31f81d4c0a23826b97cb634e9681f97688e0d8d312ca94664d793faa10-smart' }),
  requirePermissions(['warranty.read']),
  async (c: Context) => {
    try {
      const tenantId = c.get('tenantId');
      const { page, limit } = validatePaginationParams(
        c.req.query('page'),
        c.req.query('limit')
      );

      // Build filters
      const filters: string[] = ['wc.tenant_id = ?'];
      const params: any[] = [tenantId];

      if (c.req.query('status')) {
        filters.push('wc.status = ?');
        params.push(c.req.query('status'));
      }

      if (c.req.query('urgency')) {
        filters.push('wc.urgency = ?');
        params.push(c.req.query('urgency'));
      }

      if (c.req.query('issue_category')) {
        filters.push('wc.issue_category = ?');
        params.push(c.req.query('issue_category'));
      }

      if (c.req.query('search')) {
        filters.push('(wc.claim_number LIKE ? OR c.name LIKE ? OR p.name LIKE ?)');
        const searchTerm = `%${c.req.query('search')}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as count
        FROM warranty_claims wc
        LEFT JOIN warranties w ON wc.warranty_id = w.id
        LEFT JOIN customers c ON w.customer_id = c.id
        LEFT JOIN products p ON w.product_id = p.id
        ${whereClause}
      `;

      const totalResult = await c.env.DB.prepare(countQuery)
        .bind(tenantId, ...params)
        .first();

      const total = totalResult?.count || 0;

      // Get warranty claims
      const claimsQuery = `
        SELECT 
          wc.*,
          w.warranty_number,
          w.serial_number,
          w.expiry_date,
          c.name as customer_name,
          c.phone as customer_phone,
          p.name as product_name,
          p.sku as product_sku,
          u1.full_name as created_by_name,
          u2.full_name as processed_by_name,
          CASE 
            WHEN w.expiry_date < date('now') THEN 'expired'
            ELSE 'valid'
          END as warranty_validity
        FROM warranty_claims wc
        LEFT JOIN warranties w ON wc.warranty_id = w.id
        LEFT JOIN customers c ON w.customer_id = c.id
        LEFT JOIN products p ON w.product_id = p.id
        LEFT JOIN users u1 ON wc.created_by = u1.id
        LEFT JOIN users u2 ON wc.processed_by = u2.id
        ${whereClause}
        ORDER BY wc.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const claims = await c.env.DB.prepare(claimsQuery)
        .bind(tenantId, ...params, limit, (page - 1) * limit)
        .all();

      const pagination = createPaginationInfo(page, limit, total);

      return c.json(createPaginatedResponse(
        claims.results || [],
        pagination,
        SUCCESS_MESSAGES.RETRIEVED
      ));
    } catch (error) {
      console.error('Get warranty claims error:', error);
      return c.json(createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR), 500);
    }
  }
);

// Submit warranty claim
app.post('/warranty-claims',
  jwt({ secret: 'prod-c3629b31f81d4c0a23826b97cb634e9681f97688e0d8d312ca94664d793faa10-smart' }),
  requirePermissions(['warranty.claim']),
  zValidator('json', warrantyClaimSchema),
  async (c: Context) => {
    try {
      const userId = c.get('userId');
      const tenantId = c.get('tenantId');
      const data = await c.req.json() as any;

      // Verify warranty exists and is valid
      const warranty = await c.env.DB.prepare(`
        SELECT 
          w.*,
          c.name as customer_name,
          p.name as product_name,
          CASE 
            WHEN w.expiry_date >= date('now') THEN 1
            ELSE 0
          END as is_valid
        FROM warranties w
        LEFT JOIN customers c ON w.customer_id = c.id
        LEFT JOIN products p ON w.product_id = p.id
        WHERE w.id = ? AND w.tenant_id = ? AND w.status = 'active'
      `).bind(data.warranty_id, tenantId).first();

      if (!warranty) {
        return c.json(createErrorResponse('Warranty not found or inactive'), 404);
      }

      // Generate claim number
      const claimNumber = await generateClaimNumber(c.env.DB, tenantId);
      const claimId = crypto.randomUUID();

      const claim = await c.env.DB.prepare(`
        INSERT INTO warranty_claims (
          id, tenant_id, claim_number, warranty_id, issue_description, issue_category,
          reported_by, contact_phone, contact_email, preferred_resolution, urgency,
          attachments, symptoms, steps_to_reproduce, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
        RETURNING *
      `).bind(
        claimId, tenantId, claimNumber, data.warranty_id, data.issue_description,
        data.issue_category, data.reported_by || warranty.customer_name,
        data.contact_phone || null, data.contact_email || null,
        data.preferred_resolution, data.urgency, JSON.stringify(data.attachments),
        JSON.stringify(data.symptoms), data.steps_to_reproduce || null, userId
      ).first();

      // Create audit log
      await c.env.DB.prepare(`
        INSERT INTO audit_logs (
          id, tenant_id, user_id, entity_type, entity_id, action, description
        ) VALUES (?, ?, ?, 'warranty_claim', ?, 'create', ?)
      `).bind(
        crypto.randomUUID(), tenantId, userId, claimId,
        `Submitted claim ${claimNumber} for ${warranty.product_name} - ${data.issue_category}: ${data.issue_description.substring(0, 100)}`
      ).run();

      return c.json(createSuccessResponse({
        ...claim,
        claim_number: claimNumber,
        warranty_validity: warranty.is_valid ? 'valid' : 'expired'
      }, SUCCESS_MESSAGES.CLAIM_SUBMITTED), 201);
    } catch (error) {
      console.error('Submit warranty claim error:', error);
      return c.json(createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR), 500);
    }
  }
);

// Update claim status
app.put('/warranty-claims/:id/status',
  jwt({ secret: 'prod-c3629b31f81d4c0a23826b97cb634e9681f97688e0d8d312ca94664d793faa10-smart' }),
  requirePermissions(['warranty.process']),
  zValidator('json', updateClaimStatusSchema),
  async (c: Context) => {
    try {
      const userId = c.get('userId');
      const tenantId = c.get('tenantId');
      const claimId = c.req.param('id');
      const data = await c.req.json() as any;

      // Check if claim exists
      const existingClaim = await c.env.DB.prepare(`
        SELECT * FROM warranty_claims WHERE id = ? AND tenant_id = ?
      `).bind(claimId, tenantId).first();

      if (!existingClaim) {
        return c.json(createErrorResponse('Warranty claim not found'), 404);
      }

      // Update claim
      const claim = await c.env.DB.prepare(`
        UPDATE warranty_claims SET
          status = ?,
          resolution_type = COALESCE(?, resolution_type),
          resolution_notes = COALESCE(?, resolution_notes),
          technician_notes = COALESCE(?, technician_notes),
          estimated_cost = COALESCE(?, estimated_cost),
          estimated_completion = COALESCE(?, estimated_completion),
          processed_by = ?,
          processed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND tenant_id = ?
        RETURNING *
      `).bind(
        data.status, data.resolution_type || null, data.resolution_notes || null,
        data.technician_notes || null, data.estimated_cost || null,
        data.estimated_completion || null, userId, claimId, tenantId
      ).first();

      // Create audit log
      await c.env.DB.prepare(`
        INSERT INTO audit_logs (
          id, tenant_id, user_id, entity_type, entity_id, action, description
        ) VALUES (?, ?, ?, 'warranty_claim', ?, 'status_update', ?)
      `).bind(
        crypto.randomUUID(), tenantId, userId, claimId,
        `Updated claim ${existingClaim.claim_number} status: ${existingClaim.status} → ${data.status}`
      ).run();

      return c.json(createSuccessResponse(claim, 'Claim status updated successfully'));
    } catch (error) {
      console.error('Update claim status error:', error);
      return c.json(createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR), 500);
    }
  }
);

// =============================================================================
// UTILITIES
// =============================================================================

async function generateWarrantyNumber(db: D1Database, tenantId: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0]?.replace(/-/g, '') || '';
  
  const lastWarranty = await db.prepare(`
    SELECT warranty_number FROM warranties 
    WHERE tenant_id = ? AND warranty_number LIKE ? 
    ORDER BY created_at DESC LIMIT 1
  `).bind(tenantId, `WR${today}%`).first();

  let sequence = 1;
  if (lastWarranty) {
    const lastSequence = parseInt((lastWarranty.warranty_number as string)?.slice(-4) || '0');
    sequence = lastSequence + 1;
  }

  return `WR${today}${sequence.toString().padStart(4, '0')}`;
}

async function generateClaimNumber(db: D1Database, tenantId: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0]?.replace(/-/g, '') || '';
  
  const lastClaim = await db.prepare(`
    SELECT claim_number FROM warranty_claims 
    WHERE tenant_id = ? AND claim_number LIKE ? 
    ORDER BY created_at DESC LIMIT 1
  `).bind(tenantId, `CL${today}%`).first();

  let sequence = 1;
  if (lastClaim) {
    const lastSequence = parseInt((lastClaim.claim_number as string)?.slice(-4) || '0');
    sequence = lastSequence + 1;
  }

  return `CL${today}${sequence.toString().padStart(4, '0')}`;
}

export default app;