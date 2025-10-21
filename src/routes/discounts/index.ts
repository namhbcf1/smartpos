/**
 * Discounts API Module
 * Cloudflare Workers - Hono Framework
 */

import { Hono } from 'hono'
import { Env } from '../../types'
import { DiscountService_DiscountsManagementtsx } from '../../services/DiscountService-DiscountsManagementtsx'

const app = new Hono<{ Bindings: Env }>()

// GET /api/discounts
app.get('/', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const service = new DiscountService_DiscountsManagementtsx(c.env)
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const result = await service.getDiscountRules(tenantId, { page, limit })

  return c.json({
    success: true,
    discounts: (result as any).data || [],
    pagination: (result as any).pagination
  })
})

// GET /api/discounts/:id
app.get('/:id', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const service = new DiscountService_DiscountsManagementtsx(c.env)
  const id = c.req.param('id')

  // Get single discount rule from the list
  const result = await service.getDiscountRules(tenantId, { page: 1, limit: 100 })
  const discount = ((result as any).data || []).find((r: any) => r.id === id)

  if (!discount) {
    return c.json({ success: false, error: 'Discount not found' }, 404)
  }

  return c.json({ success: true, data: discount })
})

// POST /api/discounts
app.post('/', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const userId = (c.get as any)('userId') || 'system'
  const service = new DiscountService_DiscountsManagementtsx(c.env)
  const body = await c.req.json()
  const result = await service.createDiscountRule(tenantId, { ...body, created_by: userId })

  if (!result.success) {
    return c.json({ success: false, error: result.error }, 400)
  }

  return c.json({
    success: true,
    data: result.data,
    message: 'Discount created successfully'
  }, 201)
})

// PUT /api/discounts/:id
app.put('/:id', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const userId = (c.get as any)('userId') || 'system'
  const service = new DiscountService_DiscountsManagementtsx(c.env)
  const id = c.req.param('id')
  const body = await c.req.json()
  const result = await service.updateDiscountRule(id, tenantId, { ...body, updated_by: userId })

  if (!result.success) {
    return c.json({ success: false, error: result.error }, 400)
  }

  return c.json({ success: true, message: 'Discount updated successfully' })
})

// DELETE /api/discounts/:id
app.delete('/:id', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const service = new DiscountService_DiscountsManagementtsx(c.env)
  const id = c.req.param('id')
  const result = await service.delete(id)

  if (!result.success) {
    return c.json({ success: false, error: result.error }, 400)
  }

  return c.json({ success: true, message: 'Discount deleted successfully' })
})

export default app
