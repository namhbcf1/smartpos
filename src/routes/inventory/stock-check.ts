import { Hono } from 'hono'
import { Env } from '../../types'
import { authenticate, getUser } from '../../middleware/auth'
import { InventoryService } from '../../services/InventoryService'

const app = new Hono<{ Bindings: Env }>()
app.use('*', authenticate)

// POST /inventory/stock-check - perform cycle count
app.post('/', async (c: any) => {
  const svc = new InventoryService(c.env)
  const user = getUser(c)
  const body = await c.req.json()
  const res = await svc.performStockCheck({ ...body, checked_by: user?.id })
  if (!res.success) return c.json({ success: false, error: res.error || 'Stock-check failed' }, 400)
  return c.json({ success: true, data: res.result, message: 'Stock check completed' })
})

// GET /inventory/stock-check/history - list last checks
app.get('/history', async (c: any) => {
  const svc = new InventoryService(c.env)
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const res = await svc.getStockCheckHistory(page, limit)
  return c.json({ success: true, history: res.history, pagination: res.pagination })
})

export default app


