/**
 * Payments API Module
 * Cloudflare Workers - Hono Framework
 */

import { Hono } from 'hono'
import { Env } from '../../types'
import { PaymentService_PaymentsManagementtsx } from '../../services/PaymentService-PaymentsManagementtsx'
import vnpayRouter from './vnpay'

const app = new Hono<{ Bindings: Env }>()

// Mount VNPay routes
app.route('/vnpay', vnpayRouter)

// GET /api/payments
app.get('/', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const service = new PaymentService_PaymentsManagementtsx(c.env)
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const provider = c.req.query('provider')
  const status = c.req.query('status')

  const result = await service.getPayments(tenantId, page, limit)

  return c.json({
    success: true,
    payments: result.payments || result.data || [],
    pagination: result.pagination
  })
})

// GET /api/payments/:id
app.get('/:id', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const service = new PaymentService_PaymentsManagementtsx(c.env)
  const id = c.req.param('id')
  const result = await service.getPaymentById(id, tenantId)

  if (!result.success) {
    return c.json({ success: false, error: 'Payment not found' }, 404)
  }

  return c.json({ success: true, data: result.payment || result.data })
})

// POST /api/payments
app.post('/', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const userId = (c.get as any)('userId') || 'system'
  const service = new PaymentService_PaymentsManagementtsx(c.env)
  const body = await c.req.json()

  // Determine which payment method to use based on body.provider
  let result
  if (body.provider === 'momo') {
    result = await service.createMoMoPayment(tenantId, body.order_id, userId, body)
  } else {
    result = await service.createVNPayPayment(tenantId, body.order_id, userId, body)
  }

  if (!result.success) {
    return c.json({ success: false, error: result.error }, 400)
  }

  return c.json({
    success: true,
    data: result.data,
    message: 'Payment created successfully'
  }, 201)
})

// PUT /api/payments/:id
app.put('/:id', async (c) => {
  const service = new PaymentService_PaymentsManagementtsx(c.env)
  const id = c.req.param('id')
  const body = await c.req.json()

  // Determine which payment method to use based on body.provider
  let result
  if (body.provider === 'momo') {
    result = await service.updateMoMoPayment(id, body)
  } else {
    result = await service.updateVNPayPayment(id, body)
  }

  if (!result.success) {
    return c.json({ success: false, error: result.error }, 400)
  }

  return c.json({ success: true, message: 'Payment updated successfully' })
})

// POST /api/payments/:id/refund
app.post('/:id/refund', async (c) => {
  const tenantId = (c.get as any)('tenantId') || 'default'
  const userId = (c.get as any)('userId') || 'system'
  const service = new PaymentService_PaymentsManagementtsx(c.env)
  const id = c.req.param('id')
  const body = await c.req.json()
  const result = await service.createRefund(tenantId, userId, {
    provider: body.provider || 'vnpay',
    transaction_id: id,
    amount: body.amount,
    reason: body.reason
  })

  if (!result.success) {
    return c.json({ success: false, error: result.error }, 400)
  }

  return c.json({ success: true, message: 'Payment refunded successfully' })
})

export default app
