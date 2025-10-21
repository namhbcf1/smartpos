/**
 * Products API Routes
 * Cloudflare Workers - Hono Framework
 */

import { Hono } from 'hono'
import { Env } from '../../types'
import { ProductService_ProductListtsx } from '../../services/ProductService-ProductListtsx'

const app = new Hono<{ Bindings: Env }>()

/**
 * GET /api/products
 * List all products with pagination
 */
app.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const search = c.req.query('search')

  const service = new ProductService_ProductListtsx(c.env)
  const result = await service.getProducts({
    page,
    limit,
    search
  })

  return c.json({
    success: true,
    products: result.data || [],
    pagination: result.pagination
  })
})

/**
 * GET /api/products/:id
 * Get single product by ID
 */
app.get('/:id', async (c) => {
  const id = c.req.param('id')

  const query = `
    SELECT * FROM products
    WHERE id = ? AND tenant_id = ?
  `

  const product = await c.env.DB
    .prepare(query)
    .bind(id, 'default')
    .first()

  if (!product) {
    return c.json({
      success: false,
      error: 'Product not found'
    }, 404)
  }

  return c.json({
    success: true,
    data: product
  })
})

/**
 * GET /api/products/search
 * Search products by name or SKU
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

  const service = new ProductService_ProductListtsx(c.env)
  const result = await service.getProducts({ page: 1, limit, search: q })

  return c.json({
    success: true,
    data: result.products
  })
})

/**
 * GET /api/products/search/barcode/:barcode
 * Search product by barcode
 */
app.get('/search/barcode/:barcode', async (c) => {
  const barcode = c.req.param('barcode')

  const query = `
    SELECT * FROM products
    WHERE barcode = ? AND tenant_id = ?
    LIMIT 1
  `

  const product = await c.env.DB
    .prepare(query)
    .bind(barcode, 'default')
    .first()

  if (!product) {
    return c.json({
      success: false,
      error: 'Product not found'
    }, 404)
  }

  return c.json({
    success: true,
    data: product
  })
})

/**
 * GET /api/products/stats
 * Get product statistics
 */
app.get('/stats', async (c) => {
  const service = new ProductService_ProductListtsx(c.env)
  const result = await service.getProductStats()

  if (!result.success) {
    return c.json({
      success: false,
      error: result.error
    }, 400)
  }

  return c.json({
    success: true,
    data: result.stats
  })
})

/**
 * GET /api/products/top
 * Get top selling products
 */
app.get('/top', async (c) => {
  const limit = parseInt(c.req.query('limit') || '10')

  const query = `
    SELECT
      p.id, p.name, p.sku, p.price_cents, p.stock,
      COUNT(oi.id) as times_sold,
      SUM(oi.quantity) as total_quantity
    FROM products p
    LEFT JOIN order_items oi ON oi.product_id = p.id
    WHERE p.is_active = 1 AND p.tenant_id = ?
    GROUP BY p.id
    ORDER BY total_quantity DESC
    LIMIT ?
  `

  const result = await c.env.DB
    .prepare(query)
    .bind('default', limit)
    .all()

  return c.json({
    success: true,
    data: result.results || []
  })
})

/**
 * POST /api/products
 * Create new product
 */
app.post('/', async (c) => {
  const body = await c.req.json()

  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  const query = `
    INSERT INTO products (
      id, sku, name, description, price_cents, cost_price_cents,
      stock, min_stock, category_id, brand_id, barcode,
      is_active, tenant_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `

  await c.env.DB.prepare(query).bind(
    id,
    body.sku,
    body.name,
    body.description || null,
    body.price_cents || 0,
    body.cost_price_cents || 0,
    body.stock || 0,
    body.min_stock || 0,
    body.category_id || null,
    body.brand_id || null,
    body.barcode || null,
    body.is_active !== undefined ? body.is_active : 1,
    'default',
    now,
    now
  ).run()

  // Fetch the created product to return a complete object
  const created = await c.env.DB
    .prepare(`SELECT * FROM products WHERE id = ? AND tenant_id = ?`)
    .bind(id, 'default')
    .first()

  return c.json({
    success: true,
    data: created || { id },
    message: 'Product created successfully'
  }, 201)
})

/**
 * PUT /api/products/:id
 * Update product
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
  if (body.sku !== undefined) {
    updates.push('sku = ?')
    values.push(body.sku)
  }
  if (body.price_cents !== undefined) {
    updates.push('price_cents = ?')
    values.push(body.price_cents)
  }
  if (body.stock !== undefined) {
    updates.push('stock = ?')
    values.push(body.stock)
  }
  if (body.description !== undefined) {
    updates.push('description = ?')
    values.push(body.description)
  }
  if (body.category_id !== undefined) {
    updates.push('category_id = ?')
    values.push(body.category_id)
  }
  if (body.is_active !== undefined) {
    updates.push('is_active = ?')
    values.push(body.is_active)
  }

  updates.push('updated_at = ?')
  values.push(new Date().toISOString())

  values.push(id, 'default')

  const query = `
    UPDATE products
    SET ${updates.join(', ')}
    WHERE id = ? AND tenant_id = ?
  `

  await c.env.DB.prepare(query).bind(...values).run()

  return c.json({
    success: true,
    message: 'Product updated successfully'
  })
})

/**
 * DELETE /api/products/:id
 * Delete product
 */
app.delete('/:id', async (c) => {
  const id = c.req.param('id')

  const query = `
    DELETE FROM products
    WHERE id = ? AND tenant_id = ?
  `

  await c.env.DB
    .prepare(query)
    .bind(id, 'default')
    .run()

  return c.json({
    success: true,
    message: 'Product deleted successfully'
  })
})

/**
 * POST /api/products/:id/stock
 * Adjust product stock
 */
app.post('/:id/stock', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()

  const { adjustment_type, quantity, reason } = body

  if (!adjustment_type || !quantity) {
    return c.json({
      success: false,
      error: 'Missing adjustment_type or quantity'
    }, 400)
  }

  // Update stock
  const stockChange = adjustment_type === 'in' ? quantity : -quantity

  const updateQuery = `
    UPDATE products
    SET stock = stock + ?, updated_at = ?
    WHERE id = ? AND tenant_id = ?
  `

  await c.env.DB.prepare(updateQuery).bind(
    stockChange,
    new Date().toISOString(),
    id,
    'default'
  ).run()

  // Record inventory movement
  const movementId = crypto.randomUUID()
  const movementQuery = `
    INSERT INTO inventory_movements (
      id, product_id, transaction_type, quantity,
      reason, created_at, tenant_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `

  await c.env.DB.prepare(movementQuery).bind(
    movementId,
    id,
    adjustment_type,
    quantity,
    reason || null,
    new Date().toISOString(),
    'default'
  ).run()

  return c.json({
    success: true,
    message: 'Stock adjusted successfully'
  })
})

export default app
