import { Hono } from 'hono'
import { z } from 'zod'
import { Env } from '../../types'
import { authenticate, getUser } from '../../middleware/auth'
import { validateRequest } from '../../middleware/validation'
import { OrderService_OrdersManagementtsx } from '../../services/OrderService-OrdersManagementtsx'
import { logAudit } from '../../utils/audit'

const app = new Hono<{ Bindings: Env }>()
app.use('*', authenticate)

app.get('/', async (c: any) => {
  const tenantId = c.req.header('X-Tenant-ID') || 'default'
  const service = new OrderService_OrdersManagementtsx(c.env)
  const filters = {
    page: parseInt(c.req.query('page') || '1'),
    limit: parseInt(c.req.query('limit') || '20'),
    search: c.req.query('search') || c.req.query('q') || undefined,
    status: 'cancelled',
    payment_status: c.req.query('payment_status') || undefined,
    payment_method: c.req.query('payment_method') || undefined,
    from_date: c.req.query('from') || c.req.query('from_date') || undefined,
    to_date: c.req.query('to') || c.req.query('to_date') || undefined,
    sort_by: (c.req.query('sort') as any) || 'updated_at',
    sort_dir: (c.req.query('order') as any) || 'desc',
  }
  const result = await service.getOrders(tenantId, filters as any)
  return c.json({ success: true, data: result.data || [], pagination: result.pagination })
})

app.get('/:id', async (c: any) => {
  const tenantId = c.req.header('X-Tenant-ID') || 'default'
  const service = new OrderService_OrdersManagementtsx(c.env)
  const id = c.req.param('id')
  const result = await service.getOrderById(id, tenantId)
  if (!result.success || (result.data as any)?.status !== 'cancelled') return c.json({ success: false, error: 'Order not found' }, 404)
  return c.json({ success: true, data: result.data })
})

app.post('/', validateRequest({
  body: z.object({
    customer_id: z.string().optional(),
    items: z.array(z.object({ product_id: z.string().min(1), quantity: z.number().int().positive() })).min(1),
    payment_method: z.string().default('cash'),
    discount_amount: z.number().nonnegative().optional(),
    shipping_fee: z.number().nonnegative().optional(),
    cancel_reason: z.string().optional(),
    notes: z.string().optional(),
  })
}), async (c: any) => {
  const tenantId = c.req.header('X-Tenant-ID') || 'default'
  const user = getUser(c)
  const body = c.get('validatedBody')
  const service = new OrderService_OrdersManagementtsx(c.env)
  const createRes = await service.createOrder(tenantId, { ...body, cashier_id: user?.id || 'system' })
  if (!createRes.success) return c.json({ success: false, error: 'Failed to create order' }, 400)
  const orderId = (createRes.data as any)?.id
  const cancelRes = await service.cancelOrder(orderId, tenantId)
  if (!cancelRes.success) return c.json({ success: false, error: 'Failed to cancel order' }, 400)
  await logAudit(c.env.ANALYTICS || c.env.CACHE, tenantId, user?.id || 'system', 'CREATE', 'orders', orderId, body)
  return c.json({ success: true, data: { id: orderId } }, 201)
})

export default app


