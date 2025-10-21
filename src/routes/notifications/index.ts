/**
 * Notifications API
 * View and manage system notifications
 */

import { Hono } from 'hono';
import type { Env } from '../../types';

const app = new Hono<{ Bindings: Env }>();

// Get all notifications (admin only)
app.get('/', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    const unreadOnly = c.req.query('unread') === 'true';

    let query = `
      SELECT id, type, category, title, message, data_json, created_at, is_read
      FROM notifications
      WHERE category = 'system'
    `;

    if (unreadOnly) {
      query += ` AND is_read = 0`;
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;

    const result = await c.env.DB.prepare(query).bind(limit, offset).all();

    const notifications = (result.results || []).map((n: any) => {
      let data = null;
      try {
        data = n.data_json && n.data_json.trim() !== '' ? JSON.parse(n.data_json) : null;
      } catch (e) {
        console.error('Failed to parse notification data_json:', e);
      }
      return {
        ...n,
        data,
        read: n.is_read === 1
      };
    });

    // Get unread count
    const unreadCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM notifications
      WHERE category = 'system' AND is_read = 0
    `).first();

    return c.json({
      success: true,
      data: {
        notifications,
        unread_count: (unreadCount as any)?.count || 0,
        total: notifications.length,
        limit,
        offset
      }
    });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Mark notification as read
app.put('/:id/read', async (c) => {
  try {
    const id = c.req.param('id');

    await c.env.DB.prepare(`
      UPDATE notifications SET is_read = 1 WHERE id = ?
    `).bind(id).run();

    return c.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Mark all notifications as read
app.put('/read-all', async (c) => {
  try {
    await c.env.DB.prepare(`
      UPDATE notifications SET is_read = 1 WHERE category = 'system' AND is_read = 0
    `).run();

    return c.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Delete notification
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    await c.env.DB.prepare(`
      DELETE FROM notifications WHERE id = ?
    `).bind(id).run();

    return c.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

export default app;
