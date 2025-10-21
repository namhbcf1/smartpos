import { Hono } from 'hono'
import { Env } from '../../types'
import { authenticate } from '../../middleware/auth'
import { PaymentService_PaymentsManagementtsx } from '../../services/PaymentService-PaymentsManagementtsx'

const app = new Hono<{ Bindings: Env }>()
app.use('*', authenticate)

// GET /payments - list payments
app.get('/', async (c: any) => {
  const svc = new PaymentService_PaymentsManagementtsx(c.env)
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const status = c.req.query('status')
  const search = c.req.query('q') || c.req.query('search')
  const method = c.req.query('method') || c.req.query('payment_method')
  const res = await svc.getPayments(page, limit, { status, search, method })
  return c.json({ success: true, payments: res.payments, pagination: res.pagination })
})

// GET /payments/:id - detail
app.get('/:id', async (c: any) => {
  const svc = new PaymentService_PaymentsManagementtsx(c.env)
  const id = c.req.param('id')
  const res = await svc.getPaymentById(id)
  if (!res.success) return c.json({ success: false, error: res.error || 'Payment not found' }, 404)
  return c.json({ success: true, data: res.payment })
})

// POST /payments/refunds - refund
app.post('/refunds', async (c: any) => {
  const svc = new PaymentService_PaymentsManagementtsx(c.env)
  const body = await c.req.json()
  const res = await svc.refund(body)
  if (!res.success) return c.json({ success: false, error: res.error || 'Refund failed' }, 400)
  return c.json({ success: true, message: 'Refund processed' })
})

export default app


