/**
 * Employees API Module
 * Cloudflare Workers - Hono Framework
 */

import { Hono } from 'hono'
import { Env } from '../../types'
import { EmployeeManagementService_EmployeesManagementtsx } from '../../services/EmployeeManagementService-EmployeesManagementtsx'
import { EmployeeManagementService } from '../../services/EmployeeManagementService'

const app = new Hono<{ Bindings: Env }>()

// GET /api/employees
app.get('/', async (c) => {
  try {
    const service = new EmployeeManagementService_EmployeesManagementtsx(c.env)
    const tenantId = (c.get as any)('tenantId') || 'default'
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '20')
    const search = c.req.query('search')
    const status = c.req.query('status')
    const branchId = c.req.query('branchId')
    const department = c.req.query('department')
    const result = await service.getEmployees(tenantId, { page, limit, search, status, branchId, department })

    return c.json({
      success: true,
      employees: result.data || [],
      pagination: result.pagination
    })
  } catch (error: any) {
    console.error('Employees API Error:', error)
    return c.json({
      success: false,
      error: error.message || 'Failed to get employees',
      stack: error.stack
    }, 500)
  }
})

// GET /api/employees/:id
app.get('/:id', async (c) => {
  const service = new EmployeeManagementService_EmployeesManagementtsx(c.env)
  const tenantId = (c.get as any)('tenantId') || 'default'
  const id = c.req.param('id')
  const result = await service.getEmployeeById(tenantId, id)

  if (!result.success || !result.data) {
    return c.json({ success: false, error: result.error || 'Employee not found' }, 404)
  }

  return c.json({ success: true, data: result.data })
})

// POST /api/employees
app.post('/', async (c) => {
  try {
    const service = new EmployeeManagementService_EmployeesManagementtsx(c.env)
    const tenantId = (c.get as any)('tenantId') || 'default'
    const userId = (c.get as any)('userId')
    const body = await c.req.json()

    console.log('Creating employee:', { tenantId, userId, body })

    const result = await service.createEmployee(tenantId, body)

    if (!result.success) {
      console.error('Employee creation failed:', result.error)
      return c.json({ success: false, error: result.error }, 400)
    }

    return c.json({
      success: true,
      data: result.data,
      message: 'Employee created successfully'
    }, 201)
  } catch (error: any) {
    console.error('Employee API Error:', error)
    return c.json({
      success: false,
      error: error.message || 'Failed to create employee',
      stack: error.stack
    }, 500)
  }
})

// PUT /api/employees/:id
app.put('/:id', async (c) => {
  const service = new EmployeeManagementService_EmployeesManagementtsx(c.env)
  const tenantId = (c.get as any)('tenantId') || 'default'
  const userId = (c.get as any)('userId')
  const id = c.req.param('id')
  const body = await c.req.json()
  const result = await service.updateEmployee(tenantId, id, body)

  if (!result.success) {
    return c.json({ success: false, error: result.error }, 400)
  }

  return c.json({ success: true, message: 'Employee updated successfully' })
})

// DELETE /api/employees/:id
app.delete('/:id', async (c) => {
  const service = new EmployeeManagementService(c.env)
  const tenantId = (c.get as any)('tenantId') || 'default'
  const userId = (c.get as any)('userId')
  const id = c.req.param('id')
  const result = await service.deleteEmployee(tenantId, id, userId)

  if (!result.success) {
    return c.json({ success: false, error: result.error }, 400)
  }

  return c.json({ success: true, message: 'Employee deleted successfully' })
})

// POST /api/employees/:id/create-account
app.post('/:id/create-account', async (c) => {
  try {
    const service = new EmployeeManagementService_EmployeesManagementtsx(c.env)
    const tenantId = (c.get as any)('tenantId') || 'default'
    const id = c.req.param('id')
    const body = await c.req.json()

    if (!body.username || !body.password || !body.role) {
      return c.json({
        success: false,
        error: 'Username, password, and role are required'
      }, 400)
    }

    const result = await service.createEmployeeAccount(tenantId, id, {
      username: body.username,
      password: body.password,
      role: body.role
    })

    if (!result.success) {
      return c.json({ success: false, error: 'Failed to create employee account' }, 400)
    }

    return c.json({
      success: true,
      data: { userId: result.user_id },
      message: 'Employee account created successfully'
    }, 201)
  } catch (error: any) {
    console.error('Create employee account error:', error)
    return c.json({
      success: false,
      error: error.message || 'Failed to create employee account'
    }, 500)
  }
})

// GET /api/employees/:id/with-user
app.get('/:id/with-user', async (c) => {
  const service = new EmployeeManagementService_EmployeesManagementtsx(c.env)
  const tenantId = (c.get as any)('tenantId') || 'default'
  const id = c.req.param('id')
  const result = await service.getEmployeeWithUser(tenantId, id)

  if (!result.success) {
    return c.json({ success: false, error: result.error }, 404)
  }

  return c.json({ success: true, data: result.data })
})

export default app
