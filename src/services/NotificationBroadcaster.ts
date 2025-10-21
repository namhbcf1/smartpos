import { Env } from '../types';

export class NotificationBroadcaster {
  constructor(private env: Env) {}

  async broadcast(tenantId: string, notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }) {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await this.env.DB.prepare(`
        INSERT INTO notifications (id, tenant_id, type, category, title, message, data_json, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).bind(
        id,
        tenantId,
        notification.type || 'info',
        'system',
        notification.title,
        notification.message,
        JSON.stringify(notification.data || {}),
        now
      ).run();

      // Broadcast to all connected clients via Durable Object if available
      if (this.env.NOTIFICATION_OBJECT) {
        const notifObj = this.env.NOTIFICATION_OBJECT.get(
          this.env.NOTIFICATION_OBJECT.idFromName(tenantId)
        );
        await notifObj.fetch(new Request('https://internal/broadcast', {
          method: 'POST',
          body: JSON.stringify({ id, ...notification })
        }));
      }

      return { success: true, id };
    } catch (error: any) {
      console.error('Notification broadcast error:', error);
      return { success: false, error: error.message };
    }
  }
}
