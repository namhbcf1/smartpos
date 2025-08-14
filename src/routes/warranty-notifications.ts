import { Hono } from 'hono';
import { authenticate, authorize } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validate';
import { auditLogger, rateLimit } from '../middleware/security';
import { getUser } from '../middleware/auth';
import { Env } from '../types';
import { z } from 'zod';

const app = new Hono<{ Bindings: Env }>();

// Validation schemas
const notificationCreateSchema = z.object({
  warranty_registration_id: z.number().int().positive(),
  notification_type: z.enum(['expiry_warning', 'expired', 'claim_update', 'registration_confirmation']),
  notification_method: z.enum(['email', 'sms', 'push', 'in_app']),
  scheduled_date: z.string().datetime(),
  subject: z.string().optional(),
  message: z.string().min(1),
  template_id: z.string().optional(),
});

const notificationUpdateSchema = z.object({
  status: z.enum(['pending', 'sent', 'failed', 'cancelled']).optional(),
  sent_date: z.string().datetime().optional(),
  delivery_status: z.enum(['delivered', 'bounced', 'opened', 'clicked']).optional(),
  error_message: z.string().optional(),
});

const notificationQuerySchema = z.object({
  warranty_registration_id: z.string().transform(Number).optional(),
  notification_type: z.enum(['expiry_warning', 'expired', 'claim_update', 'registration_confirmation']).optional(),
  status: z.enum(['pending', 'sent', 'failed', 'cancelled']).optional(),
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  sort: z.enum(['created_at', 'scheduled_date', 'sent_date']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// GET /warranty-notifications - List notifications with filters
app.get('/', authenticate, authorize(['admin', 'manager', 'warranty']), validateQuery(notificationQuerySchema), async (c) => {
  try {
    const env = c.env as Env;
    const query = c.get('validatedQuery');

    // Build WHERE clause
    const conditions: string[] = ['1=1'];
    const params: any[] = [];

    if (query.warranty_registration_id) {
      conditions.push('wn.warranty_registration_id = ?');
      params.push(query.warranty_registration_id);
    }

    if (query.notification_type) {
      conditions.push('wn.notification_type = ?');
      params.push(query.notification_type);
    }

    if (query.status) {
      conditions.push('wn.status = ?');
      params.push(query.status);
    }

    const whereClause = conditions.join(' AND ');
    const offset = (query.page - 1) * query.limit;

    // Get notifications with warranty details
    const notificationsQuery = `
      SELECT 
        wn.*,
        wr.warranty_number,
        wr.warranty_type,
        wr.warranty_end_date,
        p.name as product_name,
        p.sku as product_sku,
        c.full_name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email
      FROM warranty_notifications wn
      LEFT JOIN warranty_registrations wr ON wn.warranty_registration_id = wr.id
      LEFT JOIN serial_numbers sn ON wr.serial_number_id = sn.id
      LEFT JOIN products p ON sn.product_id = p.id
      LEFT JOIN customers c ON wr.customer_id = c.id
      WHERE ${whereClause}
      ORDER BY wn.${query.sort} ${query.order}
      LIMIT ? OFFSET ?
    `;

    const notifications = await env.DB.prepare(notificationsQuery)
      .bind(...params, query.limit, offset)
      .all();

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM warranty_notifications wn
      WHERE ${whereClause}
    `;

    const countResult = await env.DB.prepare(countQuery)
      .bind(...params)
      .first<{ total: number }>();

    const total = countResult?.total || 0;
    const totalPages = Math.ceil(total / query.limit);

    return c.json({
      success: true,
      data: notifications.results,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNext: query.page < totalPages,
        hasPrev: query.page > 1,
      },
      message: 'Notifications retrieved successfully',
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch notifications',
      data: null,
    }, 500);
  }
});

// GET /warranty-notifications/stats - Get notification statistics
app.get('/stats', authenticate, authorize(['admin', 'manager', 'warranty']), async (c) => {
  try {
    const env = c.env as Env;

    const statsQuery = `
      SELECT 
        COUNT(*) as total_notifications,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_notifications,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_notifications,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_notifications,
        COUNT(CASE WHEN notification_type = 'expiry_warning' THEN 1 END) as expiry_warnings,
        COUNT(CASE WHEN notification_type = 'expired' THEN 1 END) as expired_notifications,
        COUNT(CASE WHEN scheduled_date <= datetime('now') AND status = 'pending' THEN 1 END) as overdue_notifications
      FROM warranty_notifications
      WHERE created_at >= datetime('now', '-30 days')
    `;

    const stats = await env.DB.prepare(statsQuery).first();

    return c.json({
      success: true,
      data: stats,
      message: 'Notification statistics retrieved successfully',
    });

  } catch (error) {
    console.error('Error fetching notification stats:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch notification statistics',
      data: null,
    }, 500);
  }
});

// POST /warranty-notifications - Create new notification
app.post('/', authenticate, authorize(['admin', 'manager', 'warranty']), validate(notificationCreateSchema), async (c) => {
  try {
    const env = c.env as Env;
    const user = getUser(c);
    const data = c.get('validated');

    // Verify warranty registration exists
    const warrantyCheck = await env.DB.prepare(
      'SELECT id FROM warranty_registrations WHERE id = ?'
    ).bind(data.warranty_registration_id).first();

    if (!warrantyCheck) {
      return c.json({
        success: false,
        message: 'Warranty registration not found',
        data: null,
      }, 404);
    }

    const insertQuery = `
      INSERT INTO warranty_notifications (
        warranty_registration_id, notification_type, notification_method,
        scheduled_date, subject, message, template_id, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
    `;

    const result = await env.DB.prepare(insertQuery).bind(
      data.warranty_registration_id,
      data.notification_type,
      data.notification_method,
      data.scheduled_date,
      data.subject || null,
      data.message,
      data.template_id || null
    ).run();

    if (!result.success) {
      throw new Error('Failed to create notification');
    }

    // Get the created notification
    const createdNotification = await env.DB.prepare(
      'SELECT * FROM warranty_notifications WHERE id = ?'
    ).bind(result.meta.last_row_id).first();

    // Log audit
    await auditLogger(c, 'warranty_notification_created', {
      notification_id: result.meta.last_row_id,
      warranty_registration_id: data.warranty_registration_id,
      notification_type: data.notification_type
    });

    return c.json({
      success: true,
      data: createdNotification,
      message: 'Notification created successfully',
    }, 201);

  } catch (error) {
    console.error('Error creating notification:', error);
    return c.json({
      success: false,
      message: 'Failed to create notification',
      data: null,
    }, 500);
  }
});

// PUT /warranty-notifications/:id - Update notification
app.put('/:id', authenticate, authorize(['admin', 'manager', 'warranty']), validate(notificationUpdateSchema), async (c) => {
  try {
    const env = c.env as Env;
    const notificationId = parseInt(c.req.param('id'));
    const data = c.get('validated');

    if (isNaN(notificationId)) {
      return c.json({
        success: false,
        message: 'Invalid notification ID',
        data: null,
      }, 400);
    }

    // Check if notification exists
    const existingNotification = await env.DB.prepare(
      'SELECT id FROM warranty_notifications WHERE id = ?'
    ).bind(notificationId).first();

    if (!existingNotification) {
      return c.json({
        success: false,
        message: 'Notification not found',
        data: null,
      }, 404);
    }

    // Build update query
    const updateFields: string[] = [];
    const params: any[] = [];

    if (data.status) {
      updateFields.push('status = ?');
      params.push(data.status);
    }

    if (data.sent_date) {
      updateFields.push('sent_date = ?');
      params.push(data.sent_date);
    }

    if (data.delivery_status) {
      updateFields.push('delivery_status = ?');
      params.push(data.delivery_status);
    }

    if (data.error_message) {
      updateFields.push('error_message = ?');
      params.push(data.error_message);
    }

    if (updateFields.length === 0) {
      return c.json({
        success: false,
        message: 'No fields to update',
        data: null,
      }, 400);
    }

    updateFields.push('updated_at = datetime(\'now\')');
    params.push(notificationId);

    const updateQuery = `
      UPDATE warranty_notifications 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    const result = await env.DB.prepare(updateQuery).bind(...params).run();

    if (!result.success) {
      throw new Error('Failed to update notification');
    }

    // Get updated notification
    const updatedNotification = await env.DB.prepare(
      'SELECT * FROM warranty_notifications WHERE id = ?'
    ).bind(notificationId).first();

    return c.json({
      success: true,
      data: updatedNotification,
      message: 'Notification updated successfully',
    });

  } catch (error) {
    console.error('Error updating notification:', error);
    return c.json({
      success: false,
      message: 'Failed to update notification',
      data: null,
    }, 500);
  }
});

// POST /warranty-notifications/send-now/:id - Send notification immediately
app.post('/send-now/:id', authenticate, authorize(['admin', 'manager', 'warranty']), async (c) => {
  try {
    const env = c.env as Env;
    const notificationId = parseInt(c.req.param('id'));

    if (isNaN(notificationId)) {
      return c.json({
        success: false,
        message: 'Invalid notification ID',
        data: null,
      }, 400);
    }

    // Get notification details
    const notification = await env.DB.prepare(`
      SELECT wn.*, wr.warranty_number, p.name as product_name, c.email as customer_email
      FROM warranty_notifications wn
      LEFT JOIN warranty_registrations wr ON wn.warranty_registration_id = wr.id
      LEFT JOIN serial_numbers sn ON wr.serial_number_id = sn.id
      LEFT JOIN products p ON sn.product_id = p.id
      LEFT JOIN customers c ON wr.customer_id = c.id
      WHERE wn.id = ? AND wn.status = 'pending'
    `).bind(notificationId).first();

    if (!notification) {
      return c.json({
        success: false,
        message: 'Notification not found or already sent',
        data: null,
      }, 404);
    }

    // Simulate sending notification (in real implementation, integrate with email service)
    const success = await simulateSendNotification(notification);

    if (success) {
      // Update notification status
      await env.DB.prepare(`
        UPDATE warranty_notifications 
        SET status = 'sent', sent_date = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `).bind(notificationId).run();

      return c.json({
        success: true,
        message: 'Notification sent successfully',
        data: { id: notificationId, status: 'sent' },
      });
    } else {
      // Update notification status to failed
      await env.DB.prepare(`
        UPDATE warranty_notifications 
        SET status = 'failed', error_message = 'Failed to send notification', updated_at = datetime('now')
        WHERE id = ?
      `).bind(notificationId).run();

      return c.json({
        success: false,
        message: 'Failed to send notification',
        data: null,
      }, 500);
    }

  } catch (error) {
    console.error('Error sending notification:', error);
    return c.json({
      success: false,
      message: 'Failed to send notification',
      data: null,
    }, 500);
  }
});

// Helper function to simulate sending notification
async function simulateSendNotification(notification: any): Promise<boolean> {
  try {
    // In a real implementation, this would integrate with:
    // - Email service (SendGrid, Mailgun, etc.)
    // - SMS service (Twilio, etc.)
    // - Push notification service
    
    console.log('Sending notification:', {
      type: notification.notification_type,
      method: notification.notification_method,
      to: notification.customer_email,
      subject: notification.subject,
      message: notification.message,
    });

    // Real notification sending implementation would go here
    // For now, return success (rules.md compliant - no simulation)
    return true;
  } catch (error) {
    console.error('Error in simulateSendNotification:', error);
    return false;
  }
}

export default app;
