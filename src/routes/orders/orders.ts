import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate, getUser } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import { IdempotencyMiddleware } from '../../middleware/idempotency';
import { OrderService_OrdersManagementtsx } from '../../services/OrderService-OrdersManagementtsx';

const app = new Hono<{ Bindings: Env }>();
app.use('*', authenticate);

app.get('/stats', async (c: any) => {
  const tenantId = c.req.header('X-Tenant-ID') || 'default';
  const orderService = new OrderService_OrdersManagementtsx(c.env);
  const stats = await orderService.getOrderStats(tenantId);
  return c.json({ success: true, data: stats });
});

app.get('/recent', async (c: any) => {
  const tenantId = c.req.header('X-Tenant-ID') || 'default';
  const status = c.req.query('status') || 'all';
  const limit = parseInt(c.req.query('limit') || '10');
  let query = `
    SELECT o.id, o.order_number, o.customer_id, o.total_cents as total,
           o.payment_method, o.payment_status, o.status, o.created_at,
           c.name as customer_name
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE o.tenant_id = ?
  `;
  const params: any[] = [tenantId];
  if (status !== 'all') { query += ` AND o.status = ?`; params.push(status); }
  query += ` ORDER BY o.created_at DESC LIMIT ?`;
  params.push(limit);
  const result = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({ success: true, data: result.results || [] });
});

app.get('/', async (c: any) => {
  const tenantId = c.req.header('X-Tenant-ID') || 'default';
  const orderService = new OrderService_OrdersManagementtsx(c.env);
  const filters = {
    page: parseInt(c.req.query('page') || '1'),
    limit: parseInt(c.req.query('limit') || '50'),
    from_date: c.req.query('from'),
    to_date: c.req.query('to'),
    status: c.req.query('status'),
    search: c.req.query('q')
  };
  const result = await orderService.getOrders(tenantId, filters);
  return c.json({ success: true, orders: result.data || [], pagination: result.pagination || { page: filters.page, limit: filters.limit, total: 0 } });
});

app.get('/:id', async (c: any) => {
  const tenantId = c.req.header('X-Tenant-ID') || 'default';
  const orderService = new OrderService_OrdersManagementtsx(c.env);
  const id = c.req.param('id');
  const result = await orderService.getOrderById(id, tenantId);
  if (!result.success) return c.json({ success: false, error: 'Order not found' }, 404);
  return c.json({ success: true, data: result.data });
});

app.post('/', IdempotencyMiddleware.orders, async (c: any) => {
  const tenantId = c.req.header('X-Tenant-ID') || 'default';
  const orderService = new OrderService_OrdersManagementtsx(c.env);
  const body = await c.req.json();
  const user = getUser(c);
  const result = await orderService.createOrder(tenantId, { ...body, cashier_id: user?.id || 'system' });
  if (!result.success) return c.json({ success: false, error: 'Failed to create order' }, 400);
  return c.json({ success: true, data: { id: (result.data as any)?.id }, message: 'Order created successfully' }, 201);
});

app.put('/:id', async (c: any) => {
  const tenantId = c.req.header('X-Tenant-ID') || 'default';
  const orderService = new OrderService_OrdersManagementtsx(c.env);
  const id = c.req.param('id');
  const body = await c.req.json();
  const result = await orderService.updateOrder(id, tenantId, body);
  if (!result.success) return c.json({ success: false, error: 'Failed to update order' }, 400);
  return c.json({ success: true, message: 'Order updated successfully' });
});

app.post('/:id/fulfill', async (c: any) => {
  const tenantId = c.req.header('X-Tenant-ID') || 'default';
  const orderService = new OrderService_OrdersManagementtsx(c.env);
  const id = c.req.param('id');
  const result = await orderService.fulfillOrder(id, tenantId);
  if (!result.success) return c.json({ success: false, error: result.error || 'Failed to fulfill order' }, 400);
  return c.json({ success: true, data: result.order, message: 'Order fulfilled successfully' });
});

app.post('/:id/cancel', async (c: any) => {
  const tenantId = c.req.header('X-Tenant-ID') || 'default';
  const orderService = new OrderService_OrdersManagementtsx(c.env);
  const id = c.req.param('id');
  const { reason } = await c.req.json();
  const result = await orderService.cancelOrder(id, tenantId);
  if (!result.success) return c.json({ success: false, error: 'Failed to cancel order' }, 400);
  return c.json({ success: true, message: 'Order cancelled successfully' });
});

app.put('/:id/ship', async (c: any) => {
  const tenantId = c.req.header('X-Tenant-ID') || 'default';
  const orderService = new OrderService_OrdersManagementtsx(c.env);
  const id = c.req.param('id');
  const { tracking_number, carrier } = await c.req.json();
  const result = await orderService.shipOrder(id, tenantId, { tracking_number, carrier });
  if (!result.success) return c.json({ success: false, error: 'Failed to ship order' }, 400);
  return c.json({ success: true, message: 'Order marked as shipped' });
});

app.get('/:id/items', async (c: any) => {
  const tenantId = c.req.header('X-Tenant-ID') || 'default';
  const orderService = new OrderService_OrdersManagementtsx(c.env);
  const id = c.req.param('id');
  const result = await orderService.getOrderItems(id, tenantId);
  if (!result.success) return c.json({ success: false, error: 'Order items not found' }, 404);
  return c.json({ success: true, data: result.data });
});

app.get('/:id/payments', async (c: any) => {
  const tenantId = c.req.header('X-Tenant-ID') || 'default';
  const orderService = new OrderService_OrdersManagementtsx(c.env);
  const id = c.req.param('id');
  // Simple implementation - just return empty array for now
  return c.json({ success: true, data: [] });
});

app.get('/:id/activities', async (c: any) => {
  const tenantId = c.req.header('X-Tenant-ID') || 'default';
  const orderService = new OrderService_OrdersManagementtsx(c.env);
  const id = c.req.param('id');
  // Simple implementation - just return empty array for now
  return c.json({ success: true, data: [] });
});

app.get('/:id/receipt', async (c: any) => {
  const tenantId = c.req.header('X-Tenant-ID') || 'default';
  const orderService = new OrderService_OrdersManagementtsx(c.env);
  const id = c.req.param('id');
  const result = await orderService.getOrderById(id, tenantId);
  if (!result.success) return c.json({ success: false, error: 'Order not found' }, 404);
  return c.json({ success: true, data: result.data || (result as any).order });
});

export default app;
