import { Hono } from 'hono'
import { Env } from '../../types'
import { authenticate } from '../../middleware/auth'
import { DeviceService_DevicesManagementtsx } from '../../services/DeviceService-DevicesManagementtsx'
import { DeviceService } from '../../services/DeviceService'

const app = new Hono<{ Bindings: Env }>()
app.use('*', authenticate)

// GET /devices - list
app.get('/', async (c: any) => {
  const svc = new DeviceService_DevicesManagementtsx(c.env)
  const tenantId = (c.get as any)('tenantId') || 'default'
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const type = c.req.query('type')
  const status = c.req.query('status')
  const search = c.req.query('search')
  const branchId = c.req.query('branchId')
  const res = await svc.getDevices(tenantId, { page, limit, type, status, search, branchId })
  return c.json({ success: true, devices: res.data || [], pagination: res.pagination })
})

// POST /devices - create
app.post('/', async (c: any) => {
  const svc = new DeviceService_DevicesManagementtsx(c.env)
  const tenantId = (c.get as any)('tenantId') || 'default'
  const userId = (c.get as any)('userId')
  const body = await c.req.json()
  const res = await svc.createDevice(tenantId, body)
  if (!res.success) return c.json({ success: false, error: res.error || 'Create failed' }, 400)
  return c.json({ success: true, data: res.data }, 201)
})

// PUT /devices/:id - update
app.put('/:id', async (c: any) => {
  const svc = new DeviceService_DevicesManagementtsx(c.env)
  const tenantId = (c.get as any)('tenantId') || 'default'
  const userId = (c.get as any)('userId')
  const id = c.req.param('id')
  const body = await c.req.json()
  const res = await svc.updateDevice(tenantId, id, body)
  if (!res.success) return c.json({ success: false, error: res.error || 'Update failed' }, 400)
  return c.json({ success: true, message: 'Device updated' })
})

// DELETE /devices/:id - delete
app.delete('/:id', async (c: any) => {
  const svc = new DeviceService(c.env)
  const tenantId = (c.get as any)('tenantId') || 'default'
  const id = c.req.param('id')
  const res = await svc.deleteDevice(id, tenantId)
  if (!res.success) return c.json({ success: false, error: res.error || 'Delete failed' }, 400)
  return c.json({ success: true, message: 'Device deleted' })
})

export default app
