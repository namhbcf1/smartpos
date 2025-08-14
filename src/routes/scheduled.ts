import { Hono } from 'hono';
import { Env } from '../types';
import { WarrantyNotificationService } from '../services/WarrantyNotificationService';

const app = new Hono<{ Bindings: Env }>();

/**
 * POST /scheduled/warranty-notifications
 * Process warranty notifications - can be triggered by cron or manually
 */
app.post('/warranty-notifications', async (c) => {
  try {
    const env = c.env as Env;
    const notificationService = new WarrantyNotificationService(env);

    console.log('Starting warranty notification processing...');

    // Check for expiring warranties and create notifications
    const expiryCheck = await notificationService.checkExpiringWarranties();
    console.log(`Expiry check completed: ${expiryCheck.created} notifications created, ${expiryCheck.errors.length} errors`);

    // Process pending notifications
    const processingResult = await notificationService.processPendingNotifications();
    console.log(`Notification processing completed: ${processingResult.sent} sent, ${processingResult.failed} failed`);

    // Clean up old notifications (run weekly)
    const now = new Date();
    const isWeekly = now.getDay() === 0 && now.getHours() === 2; // Sunday at 2 AM
    let cleanupResult = { deleted: 0 };
    
    if (isWeekly) {
      cleanupResult = await notificationService.cleanupOldNotifications();
      console.log(`Cleanup completed: ${cleanupResult.deleted} old notifications deleted`);
    }

    // Get current stats
    const stats = await notificationService.getNotificationStats();

    return c.json({
      success: true,
      data: {
        expiry_check: expiryCheck,
        processing_result: processingResult,
        cleanup_result: cleanupResult,
        current_stats: stats,
        processed_at: new Date().toISOString(),
      },
      message: 'Warranty notification processing completed successfully',
    });

  } catch (error) {
    console.error('Error in warranty notification processing:', error);
    return c.json({
      success: false,
      message: 'Failed to process warranty notifications',
      error: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

/**
 * GET /scheduled/warranty-notifications/status
 * Get current status of warranty notifications
 */
app.get('/warranty-notifications/status', async (c) => {
  try {
    const env = c.env as Env;
    const notificationService = new WarrantyNotificationService(env);

    const stats = await notificationService.getNotificationStats();

    // Get recent processing logs (if available)
    const recentLogs = await env.DB.prepare(`
      SELECT 
        'notification_processing' as event_type,
        created_at,
        'Automatic processing' as details
      FROM warranty_notifications 
      WHERE created_at >= datetime('now', '-24 hours')
      ORDER BY created_at DESC 
      LIMIT 10
    `).all();

    return c.json({
      success: true,
      data: {
        stats,
        recent_activity: recentLogs.results,
        last_check: new Date().toISOString(),
      },
      message: 'Warranty notification status retrieved successfully',
    });

  } catch (error) {
    console.error('Error getting warranty notification status:', error);
    return c.json({
      success: false,
      message: 'Failed to get warranty notification status',
      error: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

/**
 * POST /scheduled/warranty-notifications/test
 * Verify warranty notification system functionality
 */
app.post('/warranty-notifications/test', async (c) => {
  try {
    const env = c.env as Env;

    // Create a test warranty notification
    const testNotification = {
      warranty_registration_id: 1, // Assuming warranty ID 1 exists
      notification_type: 'expiry_warning',
      notification_method: 'email',
      scheduled_date: new Date().toISOString(),
      subject: 'Test Warranty Notification',
      message: 'This is a test warranty notification to verify the system is working correctly.',
      status: 'pending',
    };

    const result = await env.DB.prepare(`
      INSERT INTO warranty_notifications (
        warranty_registration_id, notification_type, notification_method,
        scheduled_date, subject, message, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      testNotification.warranty_registration_id,
      testNotification.notification_type,
      testNotification.notification_method,
      testNotification.scheduled_date,
      testNotification.subject,
      testNotification.message,
      testNotification.status
    ).run();

    if (result.success) {
      // Process the test notification immediately
      const notificationService = new WarrantyNotificationService(env);
      const processingResult = await notificationService.processPendingNotifications();

      return c.json({
        success: true,
        data: {
          test_notification_id: result.meta.last_row_id,
          processing_result: processingResult,
          created_at: new Date().toISOString(),
        },
        message: 'Test warranty notification created and processed successfully',
      });
    } else {
      throw new Error('Failed to create test notification');
    }

  } catch (error) {
    console.error('Error creating test warranty notification:', error);
    return c.json({
      success: false,
      message: 'Failed to create test warranty notification',
      error: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

/**
 * POST /scheduled/warranty-notifications/force-check
 * Force check for expiring warranties (manual trigger)
 */
app.post('/warranty-notifications/force-check', async (c) => {
  try {
    const env = c.env as Env;
    const notificationService = new WarrantyNotificationService(env);

    console.log('Force checking for expiring warranties...');

    const result = await notificationService.checkExpiringWarranties();

    return c.json({
      success: true,
      data: {
        notifications_created: result.created,
        errors: result.errors,
        checked_at: new Date().toISOString(),
      },
      message: `Force check completed: ${result.created} notifications created`,
    });

  } catch (error) {
    console.error('Error in force warranty check:', error);
    return c.json({
      success: false,
      message: 'Failed to force check warranties',
      error: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

/**
 * POST /scheduled/warranty-notifications/send-pending
 * Force send all pending notifications (manual trigger)
 */
app.post('/warranty-notifications/send-pending', async (c) => {
  try {
    const env = c.env as Env;
    const notificationService = new WarrantyNotificationService(env);

    console.log('Force sending pending notifications...');

    const result = await notificationService.processPendingNotifications();

    return c.json({
      success: true,
      data: {
        sent: result.sent,
        failed: result.failed,
        errors: result.errors,
        processed_at: new Date().toISOString(),
      },
      message: `Force send completed: ${result.sent} sent, ${result.failed} failed`,
    });

  } catch (error) {
    console.error('Error in force send notifications:', error);
    return c.json({
      success: false,
      message: 'Failed to force send notifications',
      error: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

export default app;
