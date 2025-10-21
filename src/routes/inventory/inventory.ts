import { Hono } from 'hono'
import { Env } from '../../types'
import { authenticate } from '../../middleware/auth'
import { InventoryService } from '../../services/InventoryService'

const app = new Hono<{ Bindings: Env }>()
app.use('*', authenticate)

// GET /inventory - overall inventory status
app.get('/', async (c: any) => {
  const svc = new InventoryService(c.env)
  const res = await svc.getInventoryStatus()
  return c.json({ success: true, data: res })
})

// GET /inventory/low-stock - list low stock products
app.get('/low-stock', async (c: any) => {
  const svc = new InventoryService(c.env)
  const limit = parseInt(c.req.query('limit') || '50')
  const res = await svc.getLowStockProducts(limit)
  return c.json({ success: true, data: res })
})

// GET /inventory/movements - paginated movements
app.get('/movements', async (c: any) => {
  const svc = new InventoryService(c.env)
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '50')
  const product_id = c.req.query('product_id')
  const warehouse_id = c.req.query('warehouse_id')
  const res = await svc.getMovements(page, limit, { product_id, warehouse_id })
  return c.json({ success: true, movements: res.movements, pagination: res.pagination })
})

export default app


