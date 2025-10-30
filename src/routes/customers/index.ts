/**
 * Customers API Routes
 * Cloudflare Workers - Hono Framework
 */

import { Hono } from 'hono'
import { Env } from '../../types'
import { CustomerService_CustomerDirectorytsx } from '../../services/CustomerService-CustomerDirectorytsx'

const app = new Hono<{ Bindings: Env }>()

/**
 * GET /api/customers
 * List all customers with pagination
 */
app.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limitParam = parseInt(c.req.query('limit') || '20')
  const includeAll = (c.req.query('include_all') || '').toLowerCase() === 'true'
  const limit = includeAll ? 5000 : limitParam
  const search = (c.req.query('search') || '').trim()

  // When include_all=true, bypass tenant filters and return ALL customers from D1
  if (includeAll) {
    const offset = (page - 1) * limit
    const whereParts: string[] = []
    const params: any[] = []
    if (search) {
      whereParts.push('(name LIKE ? OR email LIKE ? OR phone LIKE ?)')
      const term = `%${search}%`
      params.push(term, term, term)
    }
    const whereSql = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : ''

    const rows = await c.env.DB.prepare(
      `SELECT * FROM customers ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all()

    const countRow = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM customers ${whereSql}`
    ).bind(...params).first()

    const total = (countRow as any)?.total || 0
    return c.json({
      success: true,
      customers: rows.results || [],
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  }

  // Default path: use service (tenant-aware)
  const service = new CustomerService_CustomerDirectorytsx(c.env)
  const result = await service.getCustomers({ search, page, limit })
  return c.json({ success: true, customers: result.data || [], pagination: result.pagination })
})

/**
 * GET /api/customers/all
 * Return ALL customers from D1 (no tenant filter)
 */
app.get('/all', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '5000')
  const offset = (page - 1) * limit
  const search = (c.req.query('search') || '').trim()

  const whereParts: string[] = []
  const params: any[] = []
  if (search) {
    whereParts.push('(name LIKE ? OR email LIKE ? OR phone LIKE ?)')
    const term = `%${search}%`
    params.push(term, term, term)
  }
  const whereSql = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : ''

  const rows = await c.env.DB.prepare(
    `SELECT * FROM customers ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all()

  const countRow = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM customers ${whereSql}`
  ).bind(...params).first()

  const total = (countRow as any)?.total || 0
  return c.json({ success: true, customers: rows.results || [], pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
})

/**
 * GET /api/customers/debug/tenant-counts
 * Debug endpoint: count customers grouped by tenant_id (including NULL)
 */
app.get('/debug/tenant-counts', async (c) => {
  const rows = await c.env.DB.prepare(`
    SELECT COALESCE(tenant_id, 'NULL') as tenant_id, COUNT(*) as total
    FROM customers
    GROUP BY COALESCE(tenant_id, 'NULL')
    ORDER BY total DESC
  `).all()

  return c.json({ success: true, data: rows.results || [] })
})

/**
 * GET /api/customers/debug/force-tenant-default?confirm=true
 * Force-set tenant_id='default' for all customers where tenant_id is NULL or not 'default'
 */
app.get('/debug/force-tenant-default', async (c) => {
  const confirm = (c.req.query('confirm') || '').toLowerCase() === 'true'
  if (!confirm) {
    return c.json({ success: false, error: "Add '?confirm=true' to execute" }, 400)
  }
  const res = await c.env.DB.prepare(`
    UPDATE customers
    SET tenant_id = 'default'
    WHERE COALESCE(tenant_id, 'default') <> 'default'
  `).run()
  const counts = await c.env.DB.prepare(`
    SELECT COALESCE(tenant_id, 'NULL') as tenant_id, COUNT(*) as total
    FROM customers GROUP BY COALESCE(tenant_id, 'NULL')
  `).all()
  return c.json({ success: true, updated: (res as any)?.changes || 0, distribution: counts.results || [] })
})

/**
 * GET /api/customers/:id
 * Get single customer by ID
 */
app.get('/:id', async (c) => {
  const id = c.req.param('id')

  const query = `
    SELECT * FROM customers
    WHERE id = ? AND tenant_id = ?
  `

  const customer = await c.env.DB
    .prepare(query)
    .bind(id, 'default')
    .first()

  if (!customer) {
    return c.json({
      success: false,
      error: 'Customer not found'
    }, 404)
  }

  return c.json({
    success: true,
    data: customer
  })
})

/**
 * GET /api/customers/search
 * Search customers by name, email, or phone
 */
app.get('/search', async (c) => {
  const q = c.req.query('q')
  const limit = parseInt(c.req.query('limit') || '20')

  if (!q) {
    return c.json({
      success: false,
      error: 'Search query is required'
    }, 400)
  }

  const query = `
    SELECT * FROM customers
    WHERE (name LIKE ? OR email LIKE ? OR phone LIKE ?)
      AND tenant_id = ?
    LIMIT ?
  `

  const searchTerm = `%${q}%`
  const result = await c.env.DB
    .prepare(query)
    .bind(searchTerm, searchTerm, searchTerm, 'default', limit)
    .all()

  return c.json({
    success: true,
    data: result.results || []
  })
})

/**
 * GET /api/customers/stats
 * Get customer statistics
 */
app.get('/stats', async (c) => {
  const query = `
    SELECT
      COUNT(*) as total_customers,
      SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_customers,
      SUM(CASE WHEN customer_type = 'wholesale' THEN 1 ELSE 0 END) as wholesale_customers,
      SUM(CASE WHEN customer_type = 'retail' THEN 1 ELSE 0 END) as retail_customers
    FROM customers
    WHERE tenant_id = ?
  `

  const stats = await c.env.DB
    .prepare(query)
    .bind('default')
    .first()

  return c.json({
    success: true,
    data: stats
  })
})

/**
 * GET /api/customers/:id/purchases
 * Get customer purchase history
 */
app.get('/:id/purchases', async (c) => {
  const id = c.req.param('id')
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const offset = (page - 1) * limit

  const query = `
    SELECT * FROM orders
    WHERE customer_id = ? AND tenant_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `

  const countQuery = `
    SELECT COUNT(*) as total FROM orders
    WHERE customer_id = ? AND tenant_id = ?
  `

  const [result, countResult] = await Promise.all([
    c.env.DB.prepare(query).bind(id, 'default', limit, offset).all(),
    c.env.DB.prepare(countQuery).bind(id, 'default').first()
  ])

  const total = (countResult as any)?.total || 0

  return c.json({
    success: true,
    purchases: result.results || [],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  })
})

/**
 * GET /api/customers/:id/purchases-detailed
 * Get customer purchase history with detailed items and serial numbers
 */
app.get('/:id/purchases-detailed', async (c) => {
  const id = c.req.param('id')
  const tenantId = (c.get as any)('tenantId') || 'default'
  try {
    const rows = await c.env.DB.prepare(`
      SELECT 
        o.id as order_id,
        o.order_number,
        o.created_at as order_date,
        o.total_cents,
        oi.id as order_item_id,
        oi.quantity,
        oi.unit_price_cents,
        p.id as product_id,
        p.name as product_name,
        p.sku as product_sku,
        sn.id as serial_id,
        sn.serial_number,
        sn.status as serial_status,
        sn.warranty_months,
        sn.warranty_start_date,
        sn.warranty_end_date
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      LEFT JOIN serial_numbers sn ON sn.order_item_id = oi.id
      WHERE o.customer_id = ? AND COALESCE(o.tenant_id, 'default') = ?
      ORDER BY o.created_at DESC, oi.id ASC
    `).bind(id, tenantId).all()

    const results = (rows.results || []) as any[]

    // Group by order
    const orders: any[] = []
    const byOrder: Record<string, any> = {}
    for (const r of results) {
      const oid = r.order_id
      if (!byOrder[oid]) {
        byOrder[oid] = {
          order_id: oid,
          order_number: r.order_number,
          order_date: r.order_date,
          total_cents: r.total_cents || 0,
          items: [] as any[]
        }
        orders.push(byOrder[oid])
      }
      // push item with serial if present
      byOrder[oid].items.push({
        order_item_id: r.order_item_id,
        product_id: r.product_id,
        product_name: r.product_name,
        product_sku: r.product_sku,
        quantity: r.quantity,
        unit_price_cents: r.unit_price_cents,
        serial_id: r.serial_id,
        serial_number: r.serial_number,
        serial_status: r.serial_status,
        warranty_months: r.warranty_months,
        warranty_start_date: r.warranty_start_date,
        warranty_end_date: r.warranty_end_date,
      })
    }

    return c.json({ success: true, data: orders })
  } catch (e: any) {
    return c.json({ success: false, error: e.message || 'Cannot load purchases' }, 500)
  }
})

/**
 * GET /api/customers/:id/tier
 * Get customer loyalty tier information
 */
app.get('/:id/tier', async (c) => {
  const id = c.req.param('id')

  const customer = await c.env.DB
    .prepare('SELECT id, name, total_spent_cents FROM customers WHERE id = ? AND tenant_id = ?')
    .bind(id, 'default')
    .first()

  if (!customer) {
    return c.json({
      success: false,
      error: 'Customer not found'
    }, 404)
  }

  const totalSpent = (customer as any).total_spent_cents || 0

  // Calculate tier
  let tier = 'bronze'
  let tierLabel = 'Đồng'
  let tierColor = 'text-orange-600'
  let nextTier = 'silver'
  let nextTierLabel = 'Bạc'
  let requiredAmount = 1000000

  if (totalSpent >= 10000000) {
    tier = 'platinum'
    tierLabel = 'Bạch kim'
    tierColor = 'text-purple-600'
    nextTier = null
    nextTierLabel = null
    requiredAmount = 0
  } else if (totalSpent >= 5000000) {
    tier = 'gold'
    tierLabel = 'Vàng'
    tierColor = 'text-yellow-600'
    nextTier = 'platinum'
    nextTierLabel = 'Bạch kim'
    requiredAmount = 10000000
  } else if (totalSpent >= 1000000) {
    tier = 'silver'
    tierLabel = 'Bạc'
    tierColor = 'text-gray-400'
    nextTier = 'gold'
    nextTierLabel = 'Vàng'
    requiredAmount = 5000000
  }

  const remainingAmount = nextTier ? requiredAmount - totalSpent : 0
  const tierProgress = nextTier ? Math.round((totalSpent / requiredAmount) * 100) : 100

  return c.json({
    success: true,
    data: {
      customer_id: id,
      current_tier: {
        tier,
        label: tierLabel,
        color: tierColor,
        total_spent: totalSpent
      },
      next_tier: nextTier ? {
        tier: nextTier,
        label: nextTierLabel,
        required_amount: requiredAmount,
        remaining_amount: remainingAmount
      } : null,
      tier_progress: tierProgress
    }
  })
})

/**
 * POST /api/customers/register
 * Public customer self-registration (no auth required)
 */
app.post('/register', async (c) => {
  try {
    const body = await c.req.json()

    // Validate required fields
    if (!body.name || !body.phone || !body.email) {
      return c.json({
        success: false,
        error: 'Vui lòng điền đầy đủ họ tên, số điện thoại và email'
      }, 400)
    }

    // Check for existing customer by phone or email
    const existingQuery = `
      SELECT id FROM customers
      WHERE (phone = ? OR email = ?)
      AND tenant_id = ?
      LIMIT 1
    `
    const existing = await c.env.DB
      .prepare(existingQuery)
      .bind(body.phone, body.email, 'default')
      .first()

    if (existing) {
      return c.json({
        success: false,
        error: 'Số điện thoại hoặc email đã được đăng ký trước đó'
      }, 409)
    }

    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const customerId = 'KH' + Date.now().toString().slice(-8)

    const query = `
      INSERT INTO customers (
        id, name, email, phone, address, city, customer_type,
        date_of_birth, gender, source, referrer, notes,
        loyalty_points, total_spent_cents, visit_count,
        is_active, tenant_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    await c.env.DB.prepare(query).bind(
      id,
      body.name,
      body.email,
      body.phone,
      body.address || null,
      body.city || null,
      body.customer_type || 'regular',
      body.date_of_birth || null,
      body.gender || null,
      body.source || null,
      body.referrer || null,
      body.notes || null,
      0, // loyalty_points
      0, // total_spent_cents
      0, // visit_count
      1, // is_active
      'default',
      now,
      now
    ).run()

    return c.json({
      success: true,
      data: {
        id,
        customer_id: customerId,
        name: body.name,
        phone: body.phone,
        email: body.email
      },
      message: 'Đăng ký thành công! Cảm ơn bạn đã đăng ký thông tin.'
    }, 201)
  } catch (error: any) {
    console.error('Customer registration error:', error)
    return c.json({
      success: false,
      error: 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau.'
    }, 500)
  }
})

/**
 * POST /api/customers
 * Create new customer (Admin only - requires auth)
 */
app.post('/', async (c) => {
  const body = await c.req.json()

  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  const query = `
    INSERT INTO customers (
      id, name, email, phone, address, customer_type, date_of_birth, gender,
      is_active, tenant_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `

  await c.env.DB.prepare(query).bind(
    id,
    body.name,
    body.email || null,
    body.phone || null,
    body.address || null,
    body.customer_type || 'retail',
    body.date_of_birth || null,
    body.gender || null,
    body.is_active !== undefined ? body.is_active : 1,
    'default',
    now,
    now
  ).run()

  return c.json({
    success: true,
    data: { id },
    message: 'Customer created successfully'
  }, 201)
})

/**
 * PUT /api/customers/:id
 * Update customer
 */
app.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()

  const updates: string[] = []
  const values: any[] = []

  if (body.name !== undefined) {
    updates.push('name = ?')
    values.push(body.name)
  }
  if (body.email !== undefined) {
    updates.push('email = ?')
    values.push(body.email)
  }
  if (body.phone !== undefined) {
    updates.push('phone = ?')
    values.push(body.phone)
  }
  if (body.address !== undefined) {
    updates.push('address = ?')
    values.push(body.address)
  }
  if (body.customer_type !== undefined) {
    updates.push('customer_type = ?')
    values.push(body.customer_type)
  }
  if (body.date_of_birth !== undefined) {
    updates.push('date_of_birth = ?')
    values.push(body.date_of_birth)
  }
  if (body.gender !== undefined) {
    updates.push('gender = ?')
    values.push(body.gender)
  }
  if (body.is_active !== undefined) {
    updates.push('is_active = ?')
    values.push(body.is_active)
  }

  updates.push('updated_at = ?')
  values.push(new Date().toISOString())

  values.push(id, 'default')

  const query = `
    UPDATE customers
    SET ${updates.join(', ')}
    WHERE id = ? AND tenant_id = ?
  `

  await c.env.DB.prepare(query).bind(...values).run()

  return c.json({
    success: true,
    message: 'Customer updated successfully'
  })
})

/**
 * DELETE /api/customers/:id
 * Delete customer
 */
app.delete('/:id', async (c) => {
  const id = c.req.param('id')

  const query = `
    DELETE FROM customers
    WHERE id = ? AND tenant_id = ?
  `

  await c.env.DB
    .prepare(query)
    .bind(id, 'default')
    .run()

  return c.json({
    success: true,
    message: 'Customer deleted successfully'
  })
})

/**
 * GET /api/customers/:id/warranties
 * Get customer warranty history
 */
app.get('/:id/warranties', async (c) => {
  const id = c.req.param('id')
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const offset = (page - 1) * limit

  const query = `
    SELECT
      w.*,
      p.name as product_name,
      p.sku as product_sku,
      o.order_number as order_number
    FROM warranties w
    LEFT JOIN products p ON p.id = w.product_id
    LEFT JOIN orders o ON o.id = w.order_id
    WHERE w.customer_id = ? AND w.tenant_id = ?
    ORDER BY w.created_at DESC
    LIMIT ? OFFSET ?
  `

  const countQuery = `
    SELECT COUNT(*) as total FROM warranties
    WHERE customer_id = ? AND tenant_id = ?
  `

  const statsQuery = `
    SELECT
      COUNT(*) as total_warranties,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active_warranties,
      COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_warranties,
      COUNT(CASE WHEN status = 'claimed' THEN 1 END) as claimed_warranties
    FROM warranties
    WHERE customer_id = ? AND tenant_id = ?
  `

  const [result, countResult, statsResult] = await Promise.all([
    c.env.DB.prepare(query).bind(id, 'default', limit, offset).all(),
    c.env.DB.prepare(countQuery).bind(id, 'default').first(),
    c.env.DB.prepare(statsQuery).bind(id, 'default').first()
  ])

  const total = (countResult as any)?.total || 0

  return c.json({
    success: true,
    warranties: result.results || [],
    stats: statsResult || {
      total_warranties: 0,
      active_warranties: 0,
      expired_warranties: 0,
      claimed_warranties: 0
    },
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  })
})

// Import segmentation routes
import segmentationRoutes from './segmentation';
app.route('/segmentation', segmentationRoutes);

export default app
