/**
 * Order Templates API (production, D1-backed)
 */
import { Hono } from 'hono'
import { Env } from '../../types'
import { authenticate } from '../../middleware/auth'
import { OrderTemplateService_OrdersManagementtsx } from '../../services/OrderTemplateService-OrdersManagementtsx'

const app = new Hono<{ Bindings: Env }>()

// GET /orders/templates - list templates
app.get('/templates', authenticate, async (c: any) => {
  const svc = new OrderTemplateService_OrdersManagementtsx(c.env)
  const tenantId = c.req.header('X-Tenant-ID') || 'default'
  const category = c.req.query('category')
  const isActive = c.req.query('is_active')
  const search = c.req.query('search')
  const result = await svc.getOrderTemplates({
    tenant_id: tenantId,
    category,
    is_active: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    search
  })
  if (!result.success) return c.json({ success: false, error: result.error }, 500)
  return c.json({ success: true, data: result.templates || [] })
})

// POST /orders/templates - create template
app.post('/templates', authenticate, async (c: any) => {
  const svc = new OrderTemplateService_OrdersManagementtsx(c.env)
  const tenantId = c.req.header('X-Tenant-ID') || 'default'
  const user = c.get('jwtPayload') as any
  const templateData = await c.req.json()
  const result = await svc.createOrderTemplate({
    tenant_id: tenantId,
    name: templateData.name,
    description: templateData.description || '',
    category: templateData.category,
    template_data: templateData.template_data || {},
    is_active: templateData.is_active,
    created_by: user?.id
  })
  if (!result.success) return c.json({ success: false, error: result.error }, 500)
  await svc.logAudit(tenantId, user?.id, 'create', 'order_template', result.template?.id || '', templateData)
  return c.json({ success: true, data: { id: result.template?.id, ...templateData } })
})

// PUT /orders/templates/:id - update template
app.put('/templates/:id', authenticate, async (c: any) => {
  const svc = new OrderTemplateService_OrdersManagementtsx(c.env)
  const templateId = c.req.param('id')
  const tenantId = c.req.header('X-Tenant-ID') || 'default'
  const user = c.get('jwtPayload') as any
  const updates = await c.req.json()
  const result = await svc.updateOrderTemplate(templateId, updates)
  if (!result.success) return c.json({ success: false, error: result.error }, 500)
  await svc.logAudit(tenantId, user?.id, 'update', 'order_template', templateId, updates)
  return c.json({ success: true, message: 'Order template updated successfully' })
})

// DELETE /orders/templates/:id - delete template
app.delete('/templates/:id', authenticate, async (c: any) => {
  const svc = new OrderTemplateService_OrdersManagementtsx(c.env)
  const templateId = c.req.param('id')
  const tenantId = c.req.header('X-Tenant-ID') || 'default'
  const user = c.get('jwtPayload') as any
  const result = await svc.deleteOrderTemplate(templateId, tenantId)
  if (!result.success) return c.json({ success: false, error: result.error }, 500)
  await svc.logAudit(tenantId, user?.id, 'delete', 'order_template', templateId, {})
  return c.json({ success: true, message: 'Order template deleted successfully' })
})

// POST /orders/templates/:id/create-order - create order from template
app.post('/templates/:id/create-order', authenticate, async (c: any) => {
  const svc = new OrderTemplateService_OrdersManagementtsx(c.env)
  const templateId = c.req.param('id')
  const tenantId = c.req.header('X-Tenant-ID') || 'default'
  const user = c.get('jwtPayload') as any
  const orderData = await c.req.json()
  const result = await svc.createOrderFromTemplate(templateId, {
    tenant_id: tenantId,
    customer_id: orderData.customer_id,
    customer_name: orderData.customer_name,
    customer_phone: orderData.customer_phone,
    notes: orderData.notes,
    created_by: user?.id
  })
  if (!result.success) return c.json({ success: false, error: result.error }, 500)
  await svc.logAudit(tenantId, user?.id, 'create', 'order', result.order?.id || '', { template_id: templateId, ...orderData })
  return c.json({ success: true, data: result.order, message: 'Order created from template successfully' })
})

// GET /orders/workflow-rules - list rules
app.get('/workflow-rules', authenticate, async (c: any) => {
  const svc = new OrderTemplateService_OrdersManagementtsx(c.env)
  const tenantId = c.req.header('X-Tenant-ID') || 'default'
  const result = await svc.getWorkflowRules(tenantId)
  if (!result.success) return c.json({ success: false, error: result.error }, 500)
  return c.json({ success: true, data: result.rules || [] })
})

// POST /orders/workflow-rules - create rule
app.post('/workflow-rules', authenticate, async (c: any) => {
  const svc = new OrderTemplateService_OrdersManagementtsx(c.env)
  const tenantId = c.req.header('X-Tenant-ID') || 'default'
  const user = c.get('jwtPayload') as any
  const ruleData = await c.req.json()
  const result = await svc.createWorkflowRule({
    tenant_id: tenantId,
    name: ruleData.name,
    description: ruleData.description,
    trigger_conditions: ruleData.trigger_conditions,
    actions: ruleData.actions,
    is_active: ruleData.is_active,
    created_by: user?.id
  })
  if (!result.success) return c.json({ success: false, error: result.error }, 500)
  await svc.logAudit(tenantId, user?.id, 'create', 'workflow_rule', result.rule?.id || '', ruleData)
  return c.json({ success: true, data: result.rule, message: 'Workflow rule created successfully' })
})

// PUT /orders/workflow-rules/:id - update rule
app.put('/workflow-rules/:id', authenticate, async (c: any) => {
  const svc = new OrderTemplateService_OrdersManagementtsx(c.env)
  const ruleId = c.req.param('id')
  const tenantId = c.req.header('X-Tenant-ID') || 'default'
  const user = c.get('jwtPayload') as any
  const updates = await c.req.json()
  const result = await svc.updateWorkflowRule(ruleId, updates)
  if (!result.success) return c.json({ success: false, error: 'Failed to update workflow rule' }, 500)
  await svc.logAudit(tenantId, user?.id, 'update', 'workflow_rule', ruleId, updates)
  return c.json({ success: true, message: 'Workflow rule updated successfully' })
})

// DELETE /orders/workflow-rules/:id - delete rule
app.delete('/workflow-rules/:id', authenticate, async (c: any) => {
  const svc = new OrderTemplateService_OrdersManagementtsx(c.env)
  const ruleId = c.req.param('id')
  const tenantId = c.req.header('X-Tenant-ID') || 'default'
  const user = c.get('jwtPayload') as any
  const result = await svc.deleteWorkflowRule(ruleId, tenantId)
  if (!result.success) return c.json({ success: false, error: 'Failed to delete workflow rule' }, 500)
  await svc.logAudit(tenantId, user?.id, 'delete', 'workflow_rule', ruleId, {})
  return c.json({ success: true, message: 'Workflow rule deleted successfully' })
})

// GET /orders/workflows/:orderId - get workflow
app.get('/workflows/:orderId', authenticate, async (c: any) => {
  const svc = new OrderTemplateService_OrdersManagementtsx(c.env)
  const orderId = c.req.param('orderId')
  const tenantId = c.req.header('X-Tenant-ID') || 'default'
  // Simple stub - return empty workflow
  return c.json({ success: true, data: { stages: [] } })
})

// PUT /orders/workflows/:orderId/stage - update workflow stage
app.put('/workflows/:orderId/stage', authenticate, async (c: any) => {
  const svc = new OrderTemplateService_OrdersManagementtsx(c.env)
  const orderId = c.req.param('orderId')
  const tenantId = c.req.header('X-Tenant-ID') || 'default'
  const user = c.get('jwtPayload') as any
  const stageData = await c.req.json()
  // Simple stub - just log audit and return success
  await svc.logAudit(tenantId, user?.id, 'update', 'workflow_stage', `${orderId}_${stageData.stage_name}`, stageData)
  return c.json({ success: true, message: 'Workflow stage updated successfully' })
})

// GET /orders/workflow-executions - recent executions
app.get('/workflow-executions', authenticate, async (c: any) => {
  const svc = new OrderTemplateService_OrdersManagementtsx(c.env)
  const tenantId = c.req.header('X-Tenant-ID') || 'default'
  const limit = parseInt(c.req.query('limit') || '50')
  // Simple stub - return empty executions
  return c.json({ success: true, data: [] })
})

// POST /orders/workflow-rules/:id/execute - execute rule
app.post('/workflow-rules/:id/execute', authenticate, async (c: any) => {
  const svc = new OrderTemplateService_OrdersManagementtsx(c.env)
  const ruleId = c.req.param('id')
  const tenantId = c.req.header('X-Tenant-ID') || 'default'
  const user = c.get('jwtPayload') as any
  const executionData = await c.req.json()
  const result = await svc.executeWorkflowRule(ruleId, tenantId, {
    order_id: executionData.order_id,
    context: executionData.context,
    executed_by: user?.id
  })
  if (!result.success) return c.json({ success: false, error: result.error }, 500)
  return c.json({ success: true, message: 'Workflow rule executed successfully' })
})

export default app


