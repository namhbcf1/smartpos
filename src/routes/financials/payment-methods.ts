import { Hono } from 'hono'
import { Env } from '../../types'
import { authenticate } from '../../middleware/auth'
import { PaymentMethodService_PaymentsManagementtsx } from '../../services/PaymentMethodService-PaymentsManagementtsx'

const app = new Hono<{ Bindings: Env }>()
app.use('*', authenticate)

// GET /payment-methods - list
app.get('/', async (c: any) => {
  const svc = new PaymentMethodService_PaymentsManagementtsx(c.env)
  const res = await svc.getPaymentMethods()
  if (!res.success) return c.json({ success: false, error: res.error || 'Failed to fetch methods' }, 500)
  return c.json({ success: true, data: res.methods })
})

// POST /payment-methods - create
app.post('/', async (c: any) => {
  const svc = new PaymentMethodService(c.env)
  const body = await c.req.json()
  const res = await svc.createPaymentMethod(body)
  if (!res.success) return c.json({ success: false, error: res.error || 'Create failed' }, 400)
  return c.json({ success: true, data: res.method }, 201)
})

// PUT /payment-methods/:id - update
app.put('/:id', async (c: any) => {
  const svc = new PaymentMethodService(c.env)
  const id = c.req.param('id')
  const body = await c.req.json()
  const res = await svc.updatePaymentMethod(id, body)
  if (!res.success) return c.json({ success: false, error: res.error || 'Update failed' }, 400)
  return c.json({ success: true, message: 'Payment method updated' })
})

// DELETE /payment-methods/:id - delete
app.delete('/:id', async (c: any) => {
  const svc = new PaymentMethodService(c.env)
  const id = c.req.param('id')
  const res = await svc.deletePaymentMethod(id)
  if (!res.success) return c.json({ success: false, error: res.error || 'Delete failed' }, 400)
  return c.json({ success: true, message: 'Payment method deleted' })
})

export default app


