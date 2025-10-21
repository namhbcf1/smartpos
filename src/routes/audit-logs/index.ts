import { Hono } from 'hono';
import { AuditLogService } from '../../services/AuditLogService';
import type { Env } from '../../types';

const app = new Hono<{ Bindings: Env }>();

// Get audit logs with pagination and filters
app.get('/', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');

    const filters = {
      actor_id: c.req.query('actor_id'),
      entity: c.req.query('entity'),
      entity_id: c.req.query('entity_id'),
      action: c.req.query('action'),
      from_date: c.req.query('from_date'),
      to_date: c.req.query('to_date'),
    };

    const service = new AuditLogService(c.env as any);
    const result = await service.getLogs(page, limit, filters, tenantId);

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 500);
    }

    return c.json({ success: true, data: result.data });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Get history for a specific entity
app.get('/entity/:entity/:id', async (c) => {
  try {
    const tenantId = (c.get as any)('tenantId') || 'default';
    const entity = c.req.param('entity');
    const entity_id = c.req.param('id');

    const service = new AuditLogService(c.env as any);
    const result = await service.getEntityHistory(entity, entity_id, tenantId);

    if (!result.success) {
      return c.json({ success: false, error: result.error }, 500);
    }

    return c.json({ success: true, data: result.data });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

export default app;
