import { Hono } from 'hono';
import { authenticate } from '../../middleware/auth';

const app = new Hono();

app.use('*', authenticate);

// GET /api/v1/inventory/stock-check/active
app.get('/active', async (c: any) => {
  try {
    // Check if table exists first
    const tableCheck = await (c.env as any).DB.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='stock_check_sessions'
    `).first();

    if (!tableCheck) {
      return c.json({ 
        success: true, 
        data: null, 
        message: 'Stock check tables not initialized yet' 
      });
    }

    const active = await (c.env as any).DB.prepare(`
      SELECT * FROM stock_check_sessions
      WHERE status = 'in_progress'
      ORDER BY started_at DESC
      LIMIT 1
    `).first();

    return c.json({ success: true, data: active || null });
  } catch (e) {
    console.error('Stock check active error:', e);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch active session: ' + (e as Error).message 
    }, 500);
  }
});

// POST /api/v1/inventory/stock-check
app.post('/', async (c: any) => {
  try {
    const body = await c.req.json();
    const user = c.get('jwtPayload') as any;

    const result = await (c.env as any).DB.prepare(`
      INSERT INTO stock_check_sessions (
        session_name, status, started_at, created_by, created_at, updated_at
      ) VALUES (?, 'in_progress', datetime('now'), ?, datetime('now'), datetime('now'))
    `).bind(body.session_name || `Stock Check ${Date.now()}`, user?.id || null).run();

    const id = result.meta.last_row_id;

    return c.json({ success: true, data: { id, session_name: body.session_name, status: 'in_progress' } });
  } catch (e) {
    return c.json({ success: false, error: 'Failed to create session' }, 500);
  }
});

// GET /api/v1/inventory/stock-check/:id/items
app.get('/:id/items', async (c: any) => {
  try {
    const sessionId = c.req.param('id');

    const items = await (c.env as any).DB.prepare(`
      SELECT
        sci.*,
        p.name as product_name,
        p.sku as product_sku
      FROM stock_check_items sci
      LEFT JOIN products p ON p.id = sci.product_id
      WHERE sci.session_id = ?
      ORDER BY p.name
    `).bind(sessionId).all();

    return c.json({
      success: true,
      data: items.results || []
    });
  } catch (e) {
    console.error('Stock check items fetch error:', e);
    return c.json({
      success: false,
      error: 'Failed to fetch session items: ' + (e as Error).message
    }, 500);
  }
});

// PUT /api/v1/inventory/stock-check/:id
app.put('/:id', async (c: any) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    await (c.env as any).DB.prepare(`
      UPDATE stock_check_sessions
      SET
        status = COALESCE(?, status),
        items_count = COALESCE(?, items_count),
        items_checked = COALESCE(?, items_checked),
        discrepancies_found = COALESCE(?, discrepancies_found),
        ended_at = CASE WHEN ? = 'completed' THEN datetime('now') ELSE ended_at END,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      body.status,
      body.items_count,
      body.items_checked,
      body.discrepancies_found,
      body.status,
      id
    ).run();

    if (Array.isArray(body.items)) {
      for (const it of body.items) {
        const existing = await (c.env as any).DB.prepare(`
          SELECT id FROM stock_check_items WHERE session_id = ? AND product_id = ?
        `).bind(id, it.product_id).first();

        if (existing) {
          await (c.env as any).DB.prepare(`
            UPDATE stock_check_items
            SET actual_quantity = ?, discrepancy = ?, notes = COALESCE(?, notes), updated_at = datetime('now')
            WHERE id = ?
          `).bind(it.actual_quantity, it.discrepancy, it.notes, (existing as any).id).run();
        } else {
          await (c.env as any).DB.prepare(`
            INSERT INTO stock_check_items (
              session_id, product_id, expected_quantity, actual_quantity, discrepancy, notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `).bind(id, it.product_id, it.expected_quantity || 0, it.actual_quantity || 0, it.discrepancy || 0, it.notes || null).run();
        }
      }
    }

    return c.json({ success: true, data: { id: Number(id) } });
  } catch (e) {
    return c.json({ success: false, error: 'Failed to update session' }, 500);
  }
});

export default app;
