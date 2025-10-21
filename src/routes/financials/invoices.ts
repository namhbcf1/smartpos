import { Hono } from 'hono'
import { Env } from '../../types'
import { authenticate } from '../../middleware/auth'
import { InvoiceService } from '../../services/InvoiceService'

const app = new Hono<{ Bindings: Env }>()
app.use('*', authenticate)

// GET /invoices - list
app.get('/', async (c: any) => {
  const svc = new InvoiceService(c.env)
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const status = c.req.query('status')
  const search = c.req.query('q') || c.req.query('search')
  const date_from = c.req.query('from')
  const date_to = c.req.query('to')
  const res = await svc.getInvoices(page, limit, { status, search, date_from, date_to })
  return c.json({ success: true, invoices: res.invoices, pagination: res.pagination })
})

// GET /invoices/:id - detail
app.get('/:id', async (c: any) => {
  const svc = new InvoiceService(c.env)
  const id = c.req.param('id')
  const res = await svc.getInvoiceById(id)
  if (!res.success) return c.json({ success: false, error: res.error || 'Invoice not found' }, 404)
  return c.json({ success: true, data: res.invoice })
})

// POST /invoices - create
app.post('/', async (c: any) => {
  const svc = new InvoiceService(c.env)
  const body = await c.req.json()
  const res = await svc.createInvoice(body)
  if (!res.success) return c.json({ success: false, error: res.error || 'Failed to create invoice' }, 400)
  return c.json({ success: true, data: { id: res.id } }, 201)
})

// PUT /invoices/:id - update
app.put('/:id', async (c: any) => {
  const svc = new InvoiceService(c.env)
  const id = c.req.param('id')
  const body = await c.req.json()
  const res = await svc.updateInvoice(id, body)
  if (!res.success) return c.json({ success: false, error: res.error || 'Failed to update invoice' }, 400)
  return c.json({ success: true, message: 'Invoice updated' })
})

// POST /invoices/:id/payment - record payment
app.post('/:id/payment', async (c: any) => {
  const svc = new InvoiceService(c.env)
  const id = c.req.param('id')
  const body = await c.req.json()
  const res = await svc.recordPayment(id, body)
  if (!res.success) return c.json({ success: false, error: res.error || 'Failed to record payment' }, 400)
  return c.json({ success: true, message: 'Payment recorded' })
})

// GET /invoices/:id/pdf - generate pdf (stream url)
app.get('/:id/pdf', async (c: any) => {
  const svc = new InvoiceService(c.env)
  const id = c.req.param('id')
  const res = await svc.generatePDF(id)
  if (!res.success) return c.json({ success: false, error: res.error || 'Failed to generate PDF' }, 400)
  return c.json({ success: true, data: { url: res.url } })
})

export default app


