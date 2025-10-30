/**
 * Inventory Module Aggregator
 * Inventory management and stock tracking
 */

import { Hono } from 'hono'
import { Env } from '../../types'
import { InventoryService } from '../../services/InventoryService'
import { auditLog } from '../../services/AuditLogService'
import forecastRouter from './forecast'

const app = new Hono<{ Bindings: Env }>()

// Mount forecast routes
app.route('/forecast', forecastRouter)

// GET /api/inventory
app.get('/', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const service = new InventoryService(c.env)
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const result = await service.getProducts(tenantId, { page, limit })

  return c.json({
    success: true,
    items: result.data || [],
    pagination: result.pagination
  })
})

// GET /api/inventory/low-stock
app.get('/low-stock', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const service = new InventoryService(c.env)
  const result = await service.getLowStockProducts(tenantId)

  return c.json({
    success: true,
    items: result.data || []
  })
})

// POST /api/inventory/adjust
app.post('/adjust', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const service = new InventoryService(c.env)
  const body = await c.req.json()

  const result = await service.adjustStock(
    body.product_id,
    tenantId,
    body.quantity,
    body.notes || body.reason || 'Stock adjustment'
  )

  if (!result.success) {
    return c.json({ success: false, error: result.error || 'Failed to adjust stock' }, 400)
  }

  return c.json({
    success: true,
    message: 'Inventory adjusted successfully'
  })
})

// GET /api/warehouses
app.get('/warehouses', async (c) => {
  try {
    // Simple test endpoint - just return empty array for now
    return c.json({
      success: true,
      warehouses: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0
      }
    })
  } catch (error) {
    console.error('Warehouses list error:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch warehouses'
    }, 500)
  }
})

// GET /api/inventory/:id
app.get('/:id', async (c) => {
  const service = new InventoryService(c.env)
  const id = c.req.param('id')
  const result = await service.getProductById(id)

  if (!result) {
    return c.json({ success: false, error: 'Item not found' }, 404)
  }

  return c.json({ success: true, data: result })
})

export default app

// =====================
// SERIAL INVENTORY APIs
// =====================

// GET /api/inventory/serials - list serials with filters
app.get('/serials', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const productId = c.req.query('product_id') || ''
  const status = c.req.query('status') || ''
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '50')
  const offset = (page - 1) * limit

  try {
    let query = `
      SELECT sn.*, p.name AS product_name, p.sku AS product_sku
      FROM serial_numbers sn
      LEFT JOIN products p ON p.id = sn.product_id
      WHERE COALESCE(sn.tenant_id, 'default') = ?
    `
    const params: any[] = [tenantId]
    if (productId) { query += ` AND sn.product_id = ?`; params.push(productId) }
    if (status) { query += ` AND sn.status = ?`; params.push(status) }
    query += ` ORDER BY sn.updated_at DESC NULLS LAST, sn.created_at DESC LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const rows = await c.env.DB.prepare(query).bind(...params).all()
    const countRes = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM serial_numbers sn
      WHERE COALESCE(sn.tenant_id, 'default') = ?
        ${productId ? ' AND sn.product_id = ?' : ''}
        ${status ? ' AND sn.status = ?' : ''}
    `).bind(...([tenantId].concat(productId ? [productId] : []).concat(status ? [status] : []))).first()

    return c.json({
      success: true,
      items: rows.results || [],
      pagination: { page, limit, total: (countRes as any)?.count || 0 }
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message || 'Failed to load serials' }, 500)
  }
})

// GET /api/inventory/summary - counts by status (optional per product)
app.get('/summary', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const productId = c.req.query('product_id') || ''
  try {
    const rows = await c.env.DB.prepare(`
      SELECT status, COUNT(*) as count
      FROM serial_numbers
      WHERE COALESCE(tenant_id, 'default') = ?
        ${productId ? ' AND product_id = ?' : ''}
      GROUP BY status
    `).bind(...([tenantId].concat(productId ? [productId] : []))).all()

    // Also include product-level stock if product specified
    let product: any = null
    if (productId) {
      product = await c.env.DB.prepare(`SELECT id, name, sku, stock FROM products WHERE id = ?`).bind(productId).first()
    }

    return c.json({ success: true, summary: rows.results || [], product })
  } catch (e: any) {
    return c.json({ success: false, error: e.message || 'Failed to load summary' }, 500)
  }
})

// POST /api/inventory/default-serials - ensure default serials def1,def3,def6,def12,def24,def36 exist per product
app.post('/default-serials', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const now = new Date().toISOString()
  const months = [1,3,6,12,24,36]
  try {
    const products = await c.env.DB.prepare(`SELECT id, name, sku FROM products WHERE COALESCE(tenant_id,'default') = ?`).bind(tenantId).all()
    const rows = (products.results || []) as any[]
    let created = 0
    for (const p of rows) {
      const productKey = (p.sku && String(p.sku).trim()) || p.id
      for (const m of months) {
        const base = `def${m}`
        const serial = `${base}-${productKey}` // ensure global uniqueness
        // If a global serial with same text exists, skip insert; otherwise create
        const existGlobal = await c.env.DB.prepare(`
          SELECT 1 FROM serial_numbers WHERE serial_number = ?
        `).bind(serial).first()
        if (!existGlobal) {
          await c.env.DB.prepare(`
            INSERT INTO serial_numbers (
              id, product_id, serial_number, status, warranty_months, notes, created_at, updated_at, tenant_id
            ) VALUES (?, ?, ?, 'available', ?, ?, ?, ?, ?)
          `).bind(crypto.randomUUID(), p.id, serial, m, `DEFAULT_SN:${base}`, now, now, tenantId).run()
          created++
        }
      }
    }
    return c.json({ success: true, created, products: rows.length })
  } catch (e: any) {
    return c.json({ success: false, error: e.message || 'Failed to generate default serials' }, 500)
  }
})

// POST /api/inventory/reconcile - compare physical vs system serials and optionally apply
// Body: { product_id, observed_serials: string[], apply?: boolean, reason?: string }
app.post('/reconcile', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const userId = (c.get as any)('userId') || 'system'
  const body = await c.req.json()
  const { product_id, observed_serials = [], apply = false, reason = 'cycle_count' } = body || {}
  if (!product_id || !Array.isArray(observed_serials)) {
    return c.json({ success: false, error: 'product_id and observed_serials[] required' }, 400)
  }

  try {
    // Current system serials for product considered present in stock
    const sysRows = await c.env.DB.prepare(`
      SELECT serial_number, status FROM serial_numbers
      WHERE product_id = ?
        AND COALESCE(tenant_id, 'default') = ?
        AND status IN ('in_stock','available','reserved')
    `).bind(product_id, tenantId).all()

    const systemSet = new Set((sysRows.results || []).map((r: any) => String(r.serial_number)))
    const physicalSet = new Set((observed_serials as string[]).map(s => String(s).trim()).filter(Boolean))

    const missing = [...systemSet].filter(s => !physicalSet.has(s))
    const extra = [...physicalSet].filter(s => !systemSet.has(s))

    // Apply adjustments if requested: mark missing as 'lost' and add extras as found/in_stock
    if (apply) {
      const now = new Date().toISOString()
      // Mark missing as lost (movement + status)
      for (const s of missing) {
        await c.env.DB.prepare(`
          UPDATE serial_numbers
          SET status = 'damaged', updated_at = ?
          WHERE product_id = ? AND serial_number = ? AND COALESCE(tenant_id, 'default') = ?
        `).bind(now, product_id, s, tenantId).run()
        await c.env.DB.prepare(`
          INSERT INTO inventory_movements (
            id, tenant_id, product_id, transaction_type, quantity, reason, user_id, created_at
          ) VALUES (?, ?, ?, 'adjustment_out', 1, ?, ?, ?)
        `).bind(crypto.randomUUID(), tenantId, product_id, `${reason}: missing ${s}`, userId, now).run()
      }
      // Insert extras as new serials in_stock
      for (const s of extra) {
        // If serial exists as sold or other state, skip creating new to avoid conflicts
        const exists = await c.env.DB.prepare(`
          SELECT 1 FROM serial_numbers WHERE product_id = ? AND serial_number = ?
        `).bind(product_id, s).first()
        if (!exists) {
          await c.env.DB.prepare(`
            INSERT INTO serial_numbers (id, product_id, serial_number, status, created_at, updated_at, tenant_id)
            VALUES (?, ?, ?, 'in_stock', ?, ?, ?)
          `).bind(crypto.randomUUID(), product_id, s, now, now, tenantId).run()
          await c.env.DB.prepare(`
            INSERT INTO inventory_movements (
              id, tenant_id, product_id, transaction_type, quantity, reason, user_id, created_at
            ) VALUES (?, ?, ?, 'adjustment_in', 1, ?, ?, ?)
          `).bind(crypto.randomUUID(), tenantId, product_id, `${reason}: extra ${s}`, userId, now).run()
        }
      }

      await auditLog(c, 'reconcile_apply', 'inventory', product_id, {
        missing_count: missing.length,
        extra_count: extra.length,
        reason
      })
    } else {
      await auditLog(c, 'reconcile_preview', 'inventory', product_id, {
        missing_preview: missing.length,
        extra_preview: extra.length
      })
    }

    return c.json({
      success: true,
      data: {
        missing,
        extra,
        counts: {
          system: systemSet.size,
          physical: physicalSet.size
        },
        applied: !!apply
      }
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message || 'Reconciliation failed' }, 500)
  }
})
