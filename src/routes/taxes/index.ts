/**
 * Tax API Module
 * Cloudflare Workers - Hono Framework
 */

import { Hono } from 'hono'
import { Env } from '../../types'
import { TaxService_TaxManagementtsx } from '../../services/TaxService-TaxManagementtsx'

const app = new Hono<{ Bindings: Env }>()

// POST /api/taxes/calculate
app.post('/calculate', async (c) => {
  const body = await c.req.json()
  const service = new TaxService_TaxManagementtsx(c.env)
  const tenantId = (c.get as any)('tenantId') || 'default'
  const baseAmount = Number(body?.base_amount) || Number(body?.subtotal) || 0
  const result = await service.calculateTax(baseAmount, tenantId)

  return c.json({
    success: true,
    data: result
  })
})

// GET /api/taxes/rates (Get tax settings)
app.get('/rates', async (c) => {
  const service = new TaxService_TaxManagementtsx(c.env)
  const tenantId = (c.get as any)('tenantId') || 'default'
  const result = await service.getTaxRules(tenantId)

  return c.json({
    success: true,
    data: (result as any).data || (result as any).results || []
  })
})

export default app
