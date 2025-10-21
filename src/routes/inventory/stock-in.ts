import { Hono } from 'hono'
import { Env } from '../../types'
import { authenticate, getUser } from '../../middleware/auth'
import { StockInService_InventoryManagementtsx as StockInService } from '../../services/StockInService-InventoryManagementtsx'

const app = new Hono<{ Bindings: Env }>()
app.use('*', authenticate)

// POST /inventory/stock-in - receive stock
app.post('/', async (c: any) => {
  const svc = new StockInService(c.env)
  const user = getUser(c)
  const body = await c.req.json()
  const res = await svc.receiveStock({ ...body, received_by: user?.id })
  if (!res.success) return c.json({ success: false, error: res.error || 'Stock-in failed' }, 400)
  return c.json({ success: true, data: res.receipt, message: 'Stock received' })
})

export default app


