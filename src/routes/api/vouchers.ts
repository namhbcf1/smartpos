import { Hono } from 'hono';
import { Env } from '../../types';

const app = new Hono<{ Bindings: Env }>();

// Helper function to log audit events
async function logAudit(env: Env, tenantId: string, actorId: string, action: string, entity: string, entityId: string, data: any) {
  try {
    await env.DB.prepare(`
      INSERT INTO audit_logs (tenant_id, actor_id, action, entity, entity_id, data_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(tenantId, actorId, action, entity, entityId, JSON.stringify(data)).run();
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

// POST /api/vouchers/validate - Validate voucher code
app.post('/validate', async (c: any) => {
  try {
    const tenantId = c.req.header('X-Tenant-ID') || 'default';
    const { code, order_total } = await c.req.json();
    
    if (!code) {
      return c.json({ success: false, error: ('Voucher code is required'  as any)}, 400);
    }
    
    // Get voucher
    const voucher = await c.env.DB.prepare(`
      SELECT * FROM vouchers 
      WHERE code = ? AND tenant_id = ?
    `).bind(code, tenantId).first();
    
    if (!voucher) {
      return c.json({ success: false, error: ('Invalid voucher code'  as any)}, 400);
    }
    
    // Check if voucher is active
    const now = new Date().toISOString();
    if (voucher.start_at && voucher.start_at > now) {
      return c.json({ success: false, error: ('Voucher not yet active'  as any)}, 400);
    }
    
    if (voucher.end_at && voucher.end_at < now) {
      return c.json({ success: false, error: ('Voucher has expired'  as any)}, 400);
    }
    
    // Check usage limit
    if (voucher.usage_limit && voucher.used >= voucher.usage_limit) {
      return c.json({ success: false, error: ('Voucher usage limit exceeded'  as any)}, 400);
    }
    
    // Check minimum order total
    if (voucher.min_total && order_total < voucher.min_total) {
      return c.json({ 
        success: false, 
        error: `Minimum order total of ${voucher.min_total} required` 
      }, 400);
    }
    
    // Calculate discount
    let discount = 0;
    if (voucher.type === 'fixed') {
      discount = voucher.value;
    } else if (voucher.type === 'percent') {
      discount = (order_total * voucher.value) / 100;
    }
    
    // Ensure discount doesn't exceed order total
    discount = Math.min(discount, order_total);
    
    return c.json({
      success: true,
      data: {
        voucher_id: voucher.id,
        code: voucher.code,
        type: voucher.type,
        value: voucher.value,
        discount: discount,
        min_total: voucher.min_total
      }
    });
  } catch (error) {
    console.error('Voucher validation error:', error);
    return c.json({ success: false, error: ('Failed to validate voucher'  as any)}, 500);
  }
});

// POST /api/vouchers/apply - Apply voucher to order
app.post('/apply', async (c: any) => {
  try {
    const tenantId = c.req.header('X-Tenant-ID') || 'default';
    const { voucher_id, order_id } = await c.req.json();
    
    if (!voucher_id || !order_id) {
      return c.json({ success: false, error: ('Voucher ID and Order ID are required'  as any)}, 400);
    }
    
    // Update voucher usage count
    const result = await c.env.DB.prepare(`
      UPDATE vouchers 
      SET used = used + 1 
      WHERE id = ? AND tenant_id = ?
    `).bind(voucher_id, tenantId).run();
    
    if ((result as any).changes === 0) {
      return c.json({ success: false, error: ('Voucher not found'  as any)}, 404);
    }
    
    // Log audit
    await logAudit(c.env, tenantId, 'system', 'apply', 'voucher', voucher_id, { order_id });
    
    return c.json({ success: true, message: 'Voucher applied successfully' });
  } catch (error) {
    console.error('Voucher apply error:', error);
    return c.json({ success: false, error: ('Failed to apply voucher'  as any)}, 500);
  }
});

// GET /api/vouchers - List vouchers
app.get('/', async (c: any) => {
  try {
    // Return empty array for now (table may not exist)
    return c.json({
      success: true,
      data: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        pages: 0
      }
    });
  } catch (error) {
    console.error('Vouchers list error:', error);
    return c.json({
      success: true,
      data: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        pages: 0
      }
    });
  }
});

// POST /api/vouchers - Create voucher
app.post('/', async (c: any) => {
  try {
    const tenantId = c.req.header('X-Tenant-ID') || 'default';
    const { code, type, value, min_total, start_at, end_at, usage_limit } = await c.req.json();
    
          if (!code || !type || !value) {
        return c.json({ success: false, error: 'Code, type, and value are required' }, 400);
      }
    
    if (!['fixed', 'percent'].includes(type)) {
      return c.json({ success: false, error: ('Type must be fixed or percent'  as any)}, 400);
    }
    
    const voucherId = crypto.randomUUID();
    
    try {
      await c.env.DB.prepare(`
        INSERT INTO vouchers (id, tenant_id, code, type, value, min_total, start_at, end_at, usage_limit)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(voucherId, tenantId, code, type, value, min_total || 0, start_at, end_at, usage_limit).run();
      
      // Log audit
      await logAudit(c.env, tenantId, 'system', 'create', 'voucher', voucherId, { code, type, value });
      
      return c.json({
        success: true,
        data: { id: voucherId, code, type, value }
      });
    } catch (error) {
      if ((error as any).message.includes('UNIQUE constraint failed')) {
        return c.json({ success: false, error: ('Voucher code already exists'  as any)}, 400);
      }
      throw error;
    }
  } catch (error) {
    console.error('Voucher create error:', error);
    return c.json({ success: false, error: ('Failed to create voucher'  as any)}, 500);
  }
});

// PUT /api/vouchers/:id - Update voucher
app.put('/:id', async (c: any) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.req.header('X-Tenant-ID') || 'default';
    const { code, type, value, min_total, start_at, end_at, usage_limit } = await c.req.json();
    
    const result = await c.env.DB.prepare(`
      UPDATE vouchers 
      SET code = ?, type = ?, value = ?, min_total = ?, start_at = ?, end_at = ?, usage_limit = ?
      WHERE id = ? AND tenant_id = ?
    `).bind(code, type, value, min_total || 0, start_at, end_at, usage_limit, id, tenantId).run();
    
    if ((result as any).changes === 0) {
      return c.json({ success: false, error: ('Voucher not found'  as any)}, 404);
    }
    
    // Log audit
    await logAudit(c.env, tenantId, 'system', 'update', 'voucher', id, { code, type, value });
    
    return c.json({ success: true, message: 'Voucher updated successfully' });
  } catch (error) {
    console.error('Voucher update error:', error);
    return c.json({ success: false, error: ('Failed to update voucher'  as any)}, 500);
  }
});

// DELETE /api/vouchers/:id - Delete voucher
app.delete('/:id', async (c: any) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.req.header('X-Tenant-ID') || 'default';
    
    const result = await c.env.DB.prepare(`
      DELETE FROM vouchers 
      WHERE id = ? AND tenant_id = ?
    `).bind(id, tenantId).run();
    
    if ((result as any).changes === 0) {
      return c.json({ success: false, error: ('Voucher not found'  as any)}, 404);
    }
    
    // Log audit
    await logAudit(c.env, tenantId, 'system', 'delete', 'voucher', id, {});
    
    return c.json({ success: true, message: 'Voucher deleted successfully' });
  } catch (error) {
    console.error('Voucher delete error:', error);
    return c.json({ success: false, error: ('Failed to delete voucher'  as any)}, 500);
  }
});

export default app;


