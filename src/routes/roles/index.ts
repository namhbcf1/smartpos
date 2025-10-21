/**
 * Roles API Module
 * Cloudflare Workers - Hono Framework
 */

import { Hono } from 'hono'
import { Env } from '../../types'
import { RoleService } from '../../services/RoleService'

const app = new Hono<{ Bindings: Env }>()

// GET /api/roles
app.get('/', async (c) => {
  try {
    const service = new RoleService(c.env)
    const tenantId = (c.get as any)('tenantId') || 'default'
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '20')
    const result = await service.getRoles(tenantId, { page, limit })

    return c.json({
      success: true,
      roles: result.roles || [],
      pagination: result.pagination
    })
  } catch (error: any) {
    console.error('Roles API Error:', error)
    return c.json({
      success: false,
      error: error.message || 'Failed to get roles',
      stack: error.stack
    }, 500)
  }
})

// GET /api/roles/:id
app.get('/:id', async (c) => {
  const service = new RoleService(c.env)
  const tenantId = (c.get as any)('tenantId') || 'default'
  const id = c.req.param('id')
  const result = await service.getRoleById(tenantId, id)

  if (!result) {
    return c.json({ success: false, error: 'Role not found' }, 404)
  }

  return c.json({ success: true, data: result })
})

// POST /api/roles
app.post('/', async (c) => {
  const service = new RoleService(c.env)
  const tenantId = (c.get as any)('tenantId') || 'default'
  const userId = (c.get as any)('userId')
  const body = await c.req.json()
  const result = await service.createRole(tenantId, body, userId)

  if (!result.success) {
    return c.json({ success: false, error: result.error }, 400)
  }

  return c.json({
    success: true,
    data: { id: result.data?.id || (result as any).role?.id },
    message: 'Role created successfully'
  }, 201)
})

// PUT /api/roles/:id
app.put('/:id', async (c) => {
  const service = new RoleService(c.env)
  const tenantId = (c.get as any)('tenantId') || 'default'
  const userId = (c.get as any)('userId')
  const id = c.req.param('id')
  const body = await c.req.json()
  const result = await service.updateRole(tenantId, id, body, userId)

  if (!result.success) {
    return c.json({ success: false, error: result.error }, 400)
  }

  return c.json({ success: true, message: 'Role updated successfully' })
})

// DELETE /api/roles/:id
app.delete('/:id', async (c) => {
  const service = new RoleService(c.env)
  const tenantId = (c.get as any)('tenantId') || 'default'
  const userId = (c.get as any)('userId')
  const id = c.req.param('id')
  const result = await service.deleteRole(tenantId, id, userId)

  if (!result.success) {
    return c.json({ success: false, error: result.error }, 400)
  }

  return c.json({ success: true, message: 'Role deleted successfully' })
})

export default app
