/**
 * Cron Management API
 * Manual triggers for scheduled jobs and integrity checks
 */

import { Hono } from 'hono';
import type { Env } from '../../types';
import { checkDataIntegrity } from './data-integrity';

const app = new Hono<{ Bindings: Env }>();

// Manually trigger data integrity check
app.post('/integrity-check', async (c) => {
  try {
    console.log('Manual data integrity check triggered');

    const result = await checkDataIntegrity(c.env);

    if (result.success) {
      return c.json({
        success: true,
        message: 'Data integrity check completed',
        data: result
      });
    } else {
      return c.json({
        success: false,
        message: 'Data integrity check failed',
        data: result
      }, 500);
    }
  } catch (e: any) {
    return c.json({
      success: false,
      error: e.message
    }, 500);
  }
});

// Get integrity check status (read-only, no fixes)
app.get('/integrity-status', async (c) => {
  try {
    const result = await checkDataIntegrity(c.env);

    return c.json({
      success: true,
      status: result.summary.critical_issues === 0 ? 'healthy' : 'issues_detected',
      data: {
        summary: result.summary,
        issues: result.issues
      }
    });
  } catch (e: any) {
    return c.json({
      success: false,
      error: e.message
    }, 500);
  }
});

// Manually release expired serial reservations
app.post('/release-expired-reservations', async (c) => {
  try {
    const now = new Date().toISOString();
    const expiredResult = await c.env.DB.prepare(`
      SELECT id, serial_number, reserved_by FROM serial_numbers
      WHERE reserved_until IS NOT NULL
        AND reserved_until < ?
        AND COALESCE(tenant_id, 'default') = 'default'
    `).bind(now).all();

    const expired = expiredResult.results || [];

    if (expired.length > 0) {
      await c.env.DB.prepare(`
        UPDATE serial_numbers
        SET reserved_at = NULL,
            reserved_by = NULL,
            reserved_until = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE reserved_until IS NOT NULL
          AND reserved_until < ?
          AND COALESCE(tenant_id, 'default') = 'default'
      `).bind(now).run();
    }

    return c.json({
      success: true,
      message: 'Released expired reservations',
      data: {
        released_count: expired.length,
        released_serials: expired.map((s: any) => ({
          id: s.id,
          serial_number: s.serial_number,
          reserved_by: s.reserved_by
        }))
      }
    });
  } catch (e: any) {
    return c.json({
      success: false,
      error: e.message
    }, 500);
  }
});

export default app;
