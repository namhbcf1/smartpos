import { Hono } from 'hono'
import { Env } from '../../types'
import { authenticate, getUser } from '../../middleware/auth'
import { POSService_POSTsx } from '../../services/POSService-POSTsx'

const app = new Hono<{ Bindings: Env }>()
app.use('*', authenticate)

app.post('/orders', async (c: any) => {
  const user = getUser(c)
  const tenantId = c.req.header('X-Tenant-ID') || 'default'
  const { orderData, items } = await c.req.json()
  if (!orderData || !items || !Array.isArray(items)) return c.json({ success: false, message: 'Order data and items are required' }, 400)
  const posService = new POSService_POSTsx(c.env)
  const result = await posService.createOrder({
    tenant_id: tenantId,
    customer_id: orderData.customer_id,
    customer_name: orderData.customer_name,
    customer_phone: orderData.customer_phone,
    subtotal: orderData.subtotal || 0,
    discount: orderData.discount || 0,
    tax: orderData.tax || 0,
    total: orderData.total || 0,
    payment_method: orderData.payment_method || 'cash',
    status: orderData.status || 'active',
    notes: orderData.notes,
    created_by: user.id
  }, items)
  if (!result.success) return c.json({ success: false, message: result.error }, 400)
  await posService.logAudit(tenantId, user.id, 'create', 'pos_order', result.order?.id || '', { order_number: result.order?.order_number, total: result.order?.total })
  return c.json({ success: true, data: result.order, message: 'POS order created successfully' })
})

app.get('/orders', async (c: any) => {
  const tenantId = c.req.header('X-Tenant-ID') || 'default'
  const { page = '1', limit = '50', status, customer_id, date_from, date_to } = c.req.query()
  const posService = new POSService_POSTsx(c.env)
  const result = await posService.getOrders(tenantId, parseInt(page), parseInt(limit))
  if (!result.success) return c.json({ success: false, message: result.error }, 500)
  return c.json({ success: true, data: result.orders, pagination: result.pagination })
})

export default app


