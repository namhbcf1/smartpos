import { Hono } from 'hono'
import { z } from 'zod'
import { SerialNumberService_SerialNumbersManagementtsx } from '../../services/SerialNumberService-SerialNumbersManagementtsx'
import { auditLog } from '../../services/AuditLogService'

const SerialNumberService = SerialNumberService_SerialNumbersManagementtsx

const app = new Hono()

// Schemas
const createSchema = z.object({
  serial_number: z.string().min(1),
  product_id: z.string().min(1),
  status: z.enum(['in_stock', 'sold', 'warranty', 'returned', 'scrapped']).optional(),
  notes: z.string().optional(),
  manufacturing_date: z.string().optional(),
  import_date: z.string().optional(),
  import_batch: z.string().optional(),
  warehouse_id: z.string().optional(),
  location: z.string().optional(),
  warranty_start_date: z.string().optional(),
  warranty_end_date: z.string().optional(),
  warranty_months: z.number().optional(),
})

const updateSchema = createSchema.partial().extend({
  order_id: z.string().nullable().optional(),
  order_item_id: z.string().nullable().optional(),
  warranty_id: z.string().nullable().optional(),
  sold_date: z.string().nullable().optional(),
  sold_to_customer_id: z.string().nullable().optional(),
})

app.get('/', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default'
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '20')
    const search = c.req.query('search') || undefined
    const status = c.req.query('status') || undefined
    const product_id = c.req.query('product_id') || undefined
    const customer_id = c.req.query('customer_id') || undefined
    const warehouse_id = c.req.query('warehouse_id') || undefined

    const service = new SerialNumberService(c.env as any)

    const result = await service.getSerialNumbers({
      search: search || undefined,
      status: status || undefined,
      product_id: product_id || undefined,
      sold_to_customer_id: customer_id || undefined,
      warehouse_id: warehouse_id || undefined,
    }, { limit, offset: (page - 1) * limit }, tenantId)

    if (!result.success) {
      // Graceful fallback: return empty list with 200 to avoid breaking UI
      return c.json({ success: true, data: [], pagination: { page, limit, total: 0, pages: 0 }, warning: result.error || 'No data' })
    }

    // Get total count
    const countResult = await service.getStats(tenantId)
    const total = countResult.success && countResult.data ? Number((countResult.data as any).total || 0) : 0

    return c.json({
      success: true,
      data: result.data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message || 'Không thể lấy serial numbers' }, 500)
  }
})

app.get('/stats', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const service = new SerialNumberService(c.env as any)
  const result = await service.getStats(tenantId)
  if (!result.success) return c.json({ success: false, error: result.error }, 400)
  return c.json({ success: true, data: result.data })
})

app.get('/search', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const q = c.req.query('q') || ''
  const service = new SerialNumberService(c.env as any)
  const result = await service.getSerialNumbers({ search: q }, { limit: 20, offset: 0 }, tenantId)
  return c.json({ success: true, data: result.data })
})

app.get('/:id', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const id = c.req.param('id')
  const service = new SerialNumberService(c.env as any)
  const result = await service.findById(id, tenantId)
  if (!result.success || !result.data) return c.json({ success: false, error: 'Không tìm thấy serial' }, 404)
  return c.json({ success: true, data: result.data })
})

app.get('/:id/track', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const id = c.req.param('id')
  const service = new SerialNumberService(c.env as any)
  // Simple tracking: return serial with joined details
  const serial = await service.findById(id, tenantId)
  if (!serial.success || !serial.data) return c.json({ success: false, error: 'Không tìm thấy serial' }, 404)
  const details = await service.getBySerialNumber(serial.data.serial_number, tenantId)
  return c.json({ success: true, data: details.success ? details.data : serial.data })
})

app.post('/', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default'
    const body = await c.req.json()

    // Validate input
    const validationResult = createSchema.safeParse(body)
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      console.error('Validation error:', errors, 'Body:', body)
      return c.json({ success: false, error: `Validation error: ${errors}` }, 400)
    }

    const data = validationResult.data
    // Normalize inputs
    const payload = {
      serial_number: String(data.serial_number).trim(),
      product_id: String(data.product_id).trim(),
      status: data.status || 'in_stock',
      notes: data.notes || undefined,
      manufacturing_date: data.manufacturing_date || undefined,
      import_date: data.import_date || new Date().toISOString(),
      import_batch: data.import_batch || undefined,
      warehouse_id: data.warehouse_id || undefined,
      location: data.location || undefined,
      warranty_start_date: data.warranty_start_date || undefined,
      warranty_end_date: data.warranty_end_date || undefined,
      warranty_months: data.warranty_months || 36,
    }
    const service = new SerialNumberService(c.env as any)
    const result = await service.createSerialNumber(payload, tenantId)
    if (!result.success) return c.json({ success: false, error: result.error || 'Cannot create serial' }, 400)

    // Audit log
    await auditLog(c, 'create', 'serial_number', result.data?.id, { serial_number: payload.serial_number, product_id: payload.product_id, status: payload.status })

    return c.json({ success: true, data: result.data }, 201)
  } catch (e: any) {
    console.error('Error creating serial number:', e.message, e.stack)
    return c.json({ success: false, error: e.message || 'Không thể tạo serial' }, 400)
  }
})

app.post('/bulk-import', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default'
    const body = await c.req.json()
    const serials = z.array(createSchema).parse(body)
    const service = new SerialNumberService(c.env as any)
    const result = await service.bulkImport(serials, tenantId)
    if (!result.success) return c.json({ success: false, error: result.error }, 400)
    return c.json({ success: true, data: result.data })
  } catch (e: any) {
    return c.json({ success: false, error: e.message || 'Không thể import serials' }, 400)
  }
})

app.put('/:id', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default'
    const id = c.req.param('id')
    const body = await c.req.json()
    const updates = updateSchema.parse(body)
    const service = new SerialNumberService(c.env as any)

    // Get old value for audit
    const oldSerial = await service.findById(id, tenantId)

    const result = await service.update(id, updates as any, {}, tenantId)
    if (!result.success) return c.json({ success: false, error: result.error }, 400)

    // Audit log
    await auditLog(c, 'update', 'serial_number', id, { old: oldSerial.data, new: updates })

    return c.json({ success: true, data: result.data })
  } catch (e: any) {
    return c.json({ success: false, error: e.message || 'Không thể cập nhật serial' }, 400)
  }
})

app.delete('/:id', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const id = c.req.param('id')
  const service = new SerialNumberService(c.env as any)

  // Get serial before deleting for audit
  const oldSerial = await service.findById(id, tenantId)

  const result = await service.delete(id, tenantId)
  if (!result.success) return c.json({ success: false, error: result.error }, 400)

  // Audit log
  await auditLog(c, 'delete', 'serial_number', id, { deleted_serial: oldSerial.data })

  return c.json({ success: true, message: 'Đã xóa serial' })
})

// Sync stock from serial numbers - cập nhật stock = số serial in_stock
app.post('/sync-stock', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default'

    // Get all products and count their in_stock serials
    const result = await (c.env.DB as any).prepare(`
      SELECT
        p.id,
        p.name,
        p.stock as current_stock,
        COUNT(CASE WHEN s.status = 'in_stock' THEN 1 END) as serial_in_stock,
        COUNT(s.id) as total_serials
      FROM products p
      LEFT JOIN serial_numbers s ON s.product_id = p.id AND COALESCE(s.tenant_id, 'default') = ?
      WHERE COALESCE(p.tenant_id, 'default') = ?
      GROUP BY p.id, p.name, p.stock
    `).bind(tenantId, tenantId).all()

    const updates = []
    for (const row of result.results || []) {
      const productId = (row as any).id
      const serialInStock = Number((row as any).serial_in_stock || 0)
      const currentStock = Number((row as any).current_stock || 0)

      if (currentStock !== serialInStock) {
        // Update product stock to match serial count
        await (c.env.DB as any).prepare(`
          UPDATE products
          SET stock = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND COALESCE(tenant_id, 'default') = ?
        `).bind(serialInStock, productId, tenantId).run()

        updates.push({
          product_id: productId,
          product_name: (row as any).name,
          old_stock: currentStock,
          new_stock: serialInStock,
          total_serials: Number((row as any).total_serials || 0)
        })
      }
    }

    return c.json({
      success: true,
      message: `Đã đồng bộ ${updates.length} sản phẩm`,
      updates
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message || 'Không thể đồng bộ stock' }, 500)
  }
})

// Get serials by product_id
app.get('/by-product/:productId', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default'
    const productId = c.req.param('productId')
    const status = c.req.query('status') || undefined

    const service = new SerialNumberService(c.env as any)
    const result = await service.getSerialNumbers({
      product_id: productId,
      status
    }, { limit: 1000, offset: 0 }, tenantId)

    return c.json({
      success: true,
      data: result.data || [],
      count: (result.data || []).length
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// Sync sold status for old orders (before auto-update was deployed)
app.post('/sync-sold-status', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default'

    // Find all orders with items that have products
    const ordersResult = await (c.env.DB as any).prepare(`
      SELECT
        o.id as order_id,
        o.created_at as sold_date,
        oi.id as order_item_id,
        oi.product_id,
        oi.quantity,
        oi.product_name
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE o.status IN ('completed', 'active')
        AND COALESCE(o.tenant_id, 'default') = ?
      ORDER BY o.created_at ASC
    `).bind(tenantId).all()

    const orders = ordersResult.results || []
    const updated = []
    const skipped = []

    for (const order of orders) {
      const productId = (order as any).product_id
      const quantity = Number((order as any).quantity || 1)
      const orderId = (order as any).order_id
      const orderItemId = (order as any).order_item_id
      const soldDate = (order as any).sold_date

      // Find in_stock serials for this product (these should have been sold)
      const serialsResult = await (c.env.DB as any).prepare(`
        SELECT id, serial_number FROM serial_numbers
        WHERE product_id = ?
          AND status = 'in_stock'
          AND COALESCE(tenant_id, 'default') = ?
          AND order_id IS NULL
        ORDER BY created_at ASC
        LIMIT ?
      `).bind(productId, tenantId, quantity).all()

      const serials = serialsResult.results || []

      if (serials.length > 0) {
        // Update these serials to sold
        for (const serial of serials) {
          await (c.env.DB as any).prepare(`
            UPDATE serial_numbers
            SET status = 'sold',
                sold_date = ?,
                order_id = ?,
                order_item_id = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND COALESCE(tenant_id, 'default') = ?
          `).bind(soldDate, orderId, orderItemId, (serial as any).id, tenantId).run()

          updated.push({
            serial_number: (serial as any).serial_number,
            product_name: (order as any).product_name,
            order_id: orderId,
            sold_date: soldDate
          })
        }
      } else {
        skipped.push({
          product_name: (order as any).product_name,
          order_id: orderId,
          reason: 'No available in_stock serials'
        })
      }
    }

    return c.json({
      success: true,
      message: `Synced ${updated.length} serials, skipped ${skipped.length} orders`,
      updated,
      skipped
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message || 'Sync failed' }, 500)
  }
})

// Auto-generate serials for products without serials
app.post('/auto-generate', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default'
    const { product_id, force } = await c.req.json()

    let products = []
    if (product_id) {
      // Generate for specific product
      const product = await (c.env.DB as any).prepare(`
        SELECT * FROM products WHERE id = ? AND COALESCE(tenant_id, 'default') = ?
      `).bind(product_id, tenantId).first()

      if (!product) {
        return c.json({ success: false, error: 'Product not found' }, 404)
      }
      products = [product]
    } else {
      // Generate for all products with stock > 0 but no serials
      const result = await (c.env.DB as any).prepare(`
        SELECT p.* FROM products p
        LEFT JOIN (
          SELECT product_id, COUNT(*) as serial_count
          FROM serial_numbers
          WHERE COALESCE(tenant_id, 'default') = ?
          GROUP BY product_id
        ) s ON s.product_id = p.id
        WHERE COALESCE(p.tenant_id, 'default') = ?
          AND p.stock > 0
          AND (s.serial_count IS NULL OR s.serial_count = 0 OR ? = true)
      `).bind(tenantId, tenantId, force || false).all()

      products = result.results || []
    }

    const created = []
    const service = new SerialNumberService(c.env as any)

    for (const product of products) {
      const stock = Number((product as any).stock || 0)
      const productId = (product as any).id
      const productName = (product as any).name || 'Unknown'
      const sku = (product as any).sku || ''

      // Count existing serials
      const existingCount = await (c.env.DB as any).prepare(`
        SELECT COUNT(*) as count FROM serial_numbers
        WHERE product_id = ? AND COALESCE(tenant_id, 'default') = ?
      `).bind(productId, tenantId).first()

      const existing = Number((existingCount as any)?.count || 0)
      const needToCreate = stock - existing

      if (needToCreate > 0) {
        for (let i = 0; i < needToCreate; i++) {
          const serialNumber = `${sku || productId}-${Date.now()}-${i + 1}`
          const result = await service.createSerialNumber({
            serial_number: serialNumber,
            product_id: productId,
            status: 'in_stock',
            import_date: new Date().toISOString(),
            notes: `Auto-generated for existing stock`
          }, tenantId)

          if (result.success && result.data) {
            created.push({
              product_id: productId,
              product_name: productName,
              serial_number: serialNumber
            })
          }
        }
      }
    }

    return c.json({
      success: true,
      message: `Đã tạo ${created.length} serial numbers`,
      created,
      products_processed: products.length
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message || 'Không thể tạo serials' }, 500)
  }
})

// Reserve serials for a user (with timeout)
app.post('/reserve', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default'
    const userId = (c.get as any)('userId') || 'system'
    const { product_id, quantity, timeout_minutes = 15, serial_numbers } = await c.req.json()

    if (!product_id || !quantity) {
      return c.json({ success: false, error: 'product_id and quantity required' }, 400)
    }

    const now = new Date().toISOString()
    const reservedUntil = new Date(Date.now() + timeout_minutes * 60 * 1000).toISOString()
    const reservedIds: Array<{ id: string; serial_number: string }> = []

    if (Array.isArray(serial_numbers) && serial_numbers.length > 0) {
      for (const s of serial_numbers as string[]) {
        const row = await c.env.DB.prepare(`
          SELECT id, serial_number, status, reserved_until
          FROM serial_numbers
          WHERE product_id = ? AND serial_number = ?
            AND COALESCE(tenant_id, 'default') = ?
        `).bind(product_id, String(s).trim(), tenantId).first()
        if (!row) return c.json({ success: false, error: `Serial not found: ${s}` }, 400)
        const status = (row as any).status
        const ru = (row as any).reserved_until as string | null
        if (status !== 'in_stock' && status !== 'available' && status !== 'reserved') {
          return c.json({ success: false, error: `Serial ${s} is not available (status=${status})` }, 400)
        }
        if (ru && new Date(ru).getTime() > Date.now()) {
          return c.json({ success: false, error: `Serial ${s} is already reserved` }, 409)
        }
        const upd = await c.env.DB.prepare(`
          UPDATE serial_numbers
          SET reserved_at = ?, reserved_by = ?, reserved_until = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND COALESCE(tenant_id, 'default') = ?
        `).bind(now, userId, reservedUntil, (row as any).id, tenantId).run()
        if ((upd as any).meta?.changes > 0) {
          reservedIds.push({ id: (row as any).id, serial_number: (row as any).serial_number })
        }
      }
    } else {
      // Reserve any available by quantity
      const serialsResult = await c.env.DB.prepare(`
        SELECT id, serial_number FROM serial_numbers
        WHERE product_id = ?
          AND status = 'in_stock'
          AND COALESCE(tenant_id, 'default') = ?
          AND (reserved_until IS NULL OR reserved_until < ?)
        ORDER BY created_at ASC
        LIMIT ?
      `).bind(product_id, tenantId, now, quantity).all()
      const serials = serialsResult.results || []
      if (serials.length < quantity) {
        return c.json({ success: false, error: `Not enough available serials. Need ${quantity}, found ${serials.length}`, available: serials.length }, 400)
      }
      for (const serial of serials) {
        await c.env.DB.prepare(`
          UPDATE serial_numbers
          SET reserved_at = ?, reserved_by = ?, reserved_until = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND COALESCE(tenant_id, 'default') = ?
        `).bind(now, userId, reservedUntil, (serial as any).id, tenantId).run()
        reservedIds.push({ id: (serial as any).id, serial_number: (serial as any).serial_number })
      }
    }

    // Audit log
    await auditLog(c, 'reserve', 'serial_number', null, {
      product_id,
      quantity,
      reserved_serials: reservedIds,
      reserved_until: reservedUntil
    })

    return c.json({
      success: true,
      data: {
        reserved_serials: reservedIds,
        reserved_until: reservedUntil,
        timeout_minutes
      }
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// Release reserved serials
app.post('/release', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default'
    const userId = (c.get as any)('userId') || 'system'
    const { serial_ids } = await c.req.json()

    if (!serial_ids || !Array.isArray(serial_ids)) {
      return c.json({ success: false, error: 'serial_ids array required' }, 400)
    }

    const released = []
    for (const serialId of serial_ids) {
      const result = await c.env.DB.prepare(`
        UPDATE serial_numbers
        SET reserved_at = NULL,
            reserved_by = NULL,
            reserved_until = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
          AND COALESCE(tenant_id, 'default') = ?
          AND reserved_by = ?
      `).bind(serialId, tenantId, userId).run()

      if (result.meta.changes > 0) {
        released.push(serialId)
      }
    }

    // Audit log
    await auditLog(c, 'release', 'serial_number', null, {
      released_serials: released,
      requested: serial_ids.length,
      released: released.length
    })

    return c.json({
      success: true,
      data: {
        released_count: released.length,
        released_serial_ids: released
      }
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// Auto-release expired reservations (called by cron)
app.post('/release-expired', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default'
    const now = new Date().toISOString()

    // Find expired reservations
    const expiredResult = await c.env.DB.prepare(`
      SELECT id, serial_number, reserved_by FROM serial_numbers
      WHERE reserved_until IS NOT NULL
        AND reserved_until < ?
        AND COALESCE(tenant_id, 'default') = ?
    `).bind(now, tenantId).all()

    const expired = expiredResult.results || []

    // Release them
    await c.env.DB.prepare(`
      UPDATE serial_numbers
      SET reserved_at = NULL,
          reserved_by = NULL,
          reserved_until = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE reserved_until IS NOT NULL
        AND reserved_until < ?
        AND COALESCE(tenant_id, 'default') = ?
    `).bind(now, tenantId).run()

    // Audit log
    if (expired.length > 0) {
      await auditLog(c, 'auto_release', 'serial_number', null, {
        expired_count: expired.length,
        expired_serials: expired.map((s: any) => ({ id: s.id, serial_number: s.serial_number, reserved_by: s.reserved_by }))
      })
    }

    return c.json({
      success: true,
      data: {
        released_count: expired.length,
        released_serials: expired
      }
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// Generate QR code for serial number (returns SVG)
app.get('/:id/qrcode', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default'
    const id = c.req.param('id')

    const service = new SerialNumberService(c.env as any)
    const result = await service.findById(id, tenantId)

    if (!result.success || !result.data) {
      return c.json({ success: false, error: 'Serial not found' }, 404)
    }

    const serial = result.data

    // Generate warranty check URL
    const warrantyCheckUrl = `${c.env.FRONTEND_URL}/warranty-check?serial=${encodeURIComponent(serial.serial_number)}`

    // Simple QR code data (for external QR generation service)
    return c.json({
      success: true,
      data: {
        serial_number: serial.serial_number,
        product_name: (serial as any).product_name,
        warranty_check_url: warrantyCheckUrl,
        qr_data: warrantyCheckUrl,
        // QR code image URLs from free services
        qr_image_urls: {
          google_charts: `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(warrantyCheckUrl)}`,
          qr_server: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(warrantyCheckUrl)}`,
          quickchart: `https://quickchart.io/qr?text=${encodeURIComponent(warrantyCheckUrl)}&size=300`
        }
      }
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// Sync warranty dates for old sold serials
app.post('/sync-warranty-dates', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default'

    // Find all sold serials without warranty dates
    const serialsResult = await c.env.DB.prepare(`
      SELECT id, serial_number, sold_date, order_id, warranty_months
      FROM serial_numbers
      WHERE status = 'sold'
        AND warranty_start_date IS NULL
        AND COALESCE(tenant_id, 'default') = ?
    `).bind(tenantId).all()

    const serials = serialsResult.results || []
    const updated = []

    for (const serial of serials) {
      const serialId = (serial as any).id
      const soldDate = (serial as any).sold_date
      const orderId = (serial as any).order_id
      const warrantyMonths = Number((serial as any).warranty_months || 36)

      // Determine warranty start date
      let warrantyStartDate = soldDate

      // If no sold_date but has order_id, use order created_at
      if (!warrantyStartDate && orderId) {
        const orderResult = await c.env.DB.prepare(`
          SELECT created_at FROM orders WHERE id = ?
        `).bind(orderId).first()

        if (orderResult) {
          warrantyStartDate = (orderResult as any).created_at
        }
      }

      // If still no date, use created_at of serial
      if (!warrantyStartDate) {
        const serialInfoResult = await c.env.DB.prepare(`
          SELECT created_at FROM serial_numbers WHERE id = ?
        `).bind(serialId).first()

        if (serialInfoResult) {
          warrantyStartDate = (serialInfoResult as any).created_at
        }
      }

      if (warrantyStartDate) {
        // Calculate warranty end date
        const startDate = new Date(warrantyStartDate)
        const endDate = new Date(startDate)
        endDate.setMonth(endDate.getMonth() + warrantyMonths)
        const warrantyEndDate = endDate.toISOString()

        // Update serial with warranty dates
        await c.env.DB.prepare(`
          UPDATE serial_numbers
          SET warranty_start_date = ?,
              warranty_end_date = ?,
              sold_date = COALESCE(sold_date, ?),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND COALESCE(tenant_id, 'default') = ?
        `).bind(warrantyStartDate, warrantyEndDate, warrantyStartDate, serialId, tenantId).run()

        updated.push({
          serial_number: (serial as any).serial_number,
          warranty_start: warrantyStartDate,
          warranty_end: warrantyEndDate,
          warranty_months: warrantyMonths
        })
      }
    }

    return c.json({
      success: true,
      message: `Đã sync ${updated.length} warranty dates`,
      updated
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message || 'Sync failed' }, 500)
  }
})

export default app
