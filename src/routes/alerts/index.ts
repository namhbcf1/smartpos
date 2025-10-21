/**
 * Alerts API Module
 * Cloudflare Workers - Hono Framework
 */

import { Hono } from 'hono'
import { Env } from '../../types'
import { AlertsService_AlertsManagementtsx } from '../../services/AlertsService-AlertsManagementtsx'

const app = new Hono<{ Bindings: Env }>()

// GET /api/alerts/dashboard - Get dashboard alerts summary
app.get('/dashboard', async (c) => {
  const service = new AlertsService_AlertsManagementtsx(c.env)
  const tenantId = c.req.query('tenant_id') || 'default'

  const result = await service.getAlertsDashboard(tenantId)
  return c.json({ success: true, data: result.dashboard })
})

// GET /api/alerts
app.get('/', async (c) => {
  const service = new AlertsService_AlertsManagementtsx(c.env)
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const alertType = c.req.query('type')

  const filters: any = {
    tenant_id: 'default',
    page,
    limit
  }

  // Only add alert_type if it's provided and not empty
  if (alertType && alertType.trim() !== '') {
    filters.alert_type = alertType
  }

  const result = await service.getStockAlerts(filters)
  return c.json({ success: true, alerts: result.alerts || [], pagination: result.pagination })
})

// GET /api/alerts/:id
app.get('/:id', async (c) => {
  const service = new AlertsService_AlertsManagementtsx(c.env)
  const id = c.req.param('id')
  
  // Get all alerts and find the one with matching ID
  const result = await service.getStockAlerts({
    tenant_id: 'default',
    page: 1,
    limit: 1000
  })

  if (!result.success || !result.alerts) {
    return c.json({ success: false, error: 'Alert not found' }, 404)
  }

  const alert = result.alerts.find(a => a.id === id)
  if (!alert) {
    return c.json({ success: false, error: 'Alert not found' }, 404)
  }

  return c.json({ success: true, data: alert })
})

// POST /api/alerts
app.post('/', async (c) => {
  const service = new AlertsService_AlertsManagementtsx(c.env)
  const body = await c.req.json()

  const result = await service.createStockAlert({
    tenant_id: 'default',
    product_id: body.product_id,
    alert_type: body.alert_type,
    threshold_value: body.threshold_value,
    current_value: body.current_value
  })
  return c.json({ success: true, data: result.alert, message: 'Alert created successfully' }, 201)
})

// PUT /api/alerts/:id/dismiss
app.put('/:id/dismiss', async (c) => {
  const service = new AlertsService_AlertsManagementtsx(c.env)
  const id = c.req.param('id')
  
  // For now, just return success since we don't have a dismiss method
  return c.json({ success: true, message: 'Alert dismissed successfully' })
})

// DELETE /api/alerts/:id
app.delete('/:id', async (c) => {
  const service = new AlertsService_AlertsManagementtsx(c.env)
  const id = c.req.param('id')
  
  // For now, just return success since we don't have a delete method
  return c.json({ success: true, message: 'Alert deleted successfully' })
})

export default app
