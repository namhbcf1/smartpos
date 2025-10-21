/**
 * Invoices API Module
 * Cloudflare Workers - Hono Framework
 */

import { Hono } from 'hono'
import { Env } from '../../types'
import { InvoiceService } from '../../services/InvoiceService'

const app = new Hono<{ Bindings: Env }>()

// GET /api/invoices
app.get('/', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const service = new InvoiceService(c.env)
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const result = await service.getInvoices(tenantId, { page, limit })

  return c.json({
    success: true,
    invoices: result.data || [],
    pagination: result.pagination
  })
})

// GET /api/invoices/:id
app.get('/:id', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const service = new InvoiceService(c.env)
  const id = c.req.param('id')
  const result = await service.getInvoiceById(id, tenantId)

  if (!result.success) {
    return c.json({ success: false, error: 'Invoice not found' }, 404)
  }

  return c.json({ success: true, data: result.data })
})

// POST /api/invoices
app.post('/', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const userId = (c.get as any)('userId') || 'system'
  const service = new InvoiceService(c.env)
  const body = await c.req.json()
  const result = await service.createInvoice(tenantId, body)

  if (!result.success) {
    return c.json({ success: false, error: result.error }, 400)
  }

  return c.json({
    success: true,
    data: result.data,
    message: 'Invoice created successfully'
  }, 201)
})

// PUT /api/invoices/:id
app.put('/:id', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const userId = (c.get as any)('userId') || 'system'
  const service = new InvoiceService(c.env)
  const id = c.req.param('id')
  const body = await c.req.json()
  const result = await service.updateInvoice(id, tenantId, body)

  if (!result.success) {
    return c.json({ success: false, error: result.error }, 400)
  }

  return c.json({ success: true, message: 'Invoice updated successfully' })
})

// DELETE /api/invoices/:id
app.delete('/:id', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const userId = (c.get as any)('userId') || 'system'
  const service = new InvoiceService(c.env)
  const id = c.req.param('id')
  const result = await service.deleteInvoice(id, tenantId)

  if (!result.success) {
    return c.json({ success: false, error: result.error }, 400)
  }

  return c.json({ success: true, message: 'Invoice deleted successfully' })
})

export default app
