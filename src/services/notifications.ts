/**
 * Notification Service
 * Handles sending notifications via multiple channels
 */

import type { Env } from '../types';

export interface Notification {
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  data?: any;
  recipients?: string[]; // email addresses or user IDs
}

export class NotificationService {
  constructor(private env: Env) {}

  /**
   * Send notification to admins
   * Currently stores in database, can be extended to send emails via SendGrid/Mailgun
   */
  async sendToAdmins(notification: Notification): Promise<boolean> {
    try {
      // Store notification in database
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await this.env.DB.prepare(`
        INSERT INTO notifications (
          id, type, category, title, message, data_json, is_read
        ) VALUES (?, ?, ?, ?, ?, ?, 0)
      `).bind(
        id,
        notification.type,
        'system',
        notification.title,
        notification.message,
        notification.data ? JSON.stringify(notification.data) : null
      ).run();

      // TODO: Integrate with email service (SendGrid, Mailgun, etc.)
      // Example:
      // if (this.env.SENDGRID_API_KEY) {
      //   await this.sendEmail(notification);
      // }

      console.log(`[NOTIFICATION] ${notification.type.toUpperCase()}: ${notification.title}`);

      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  /**
   * Send email notification (requires SendGrid/Mailgun API key)
   * Placeholder for future implementation
   */
  private async sendEmail(notification: Notification): Promise<void> {
    // Example SendGrid implementation:
    // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.env.SENDGRID_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     personalizations: [{
    //       to: notification.recipients?.map(email => ({ email })) || [{ email: 'admin@example.com' }]
    //     }],
    //     from: { email: 'noreply@smartpos.com', name: 'SmartPOS System' },
    //     subject: `[${notification.type.toUpperCase()}] ${notification.title}`,
    //     content: [{
    //       type: 'text/html',
    //       value: this.formatEmailBody(notification)
    //     }]
    //   })
    // });

    throw new Error('Email service not configured. Please set SENDGRID_API_KEY or MAILGUN_API_KEY in environment variables.');
  }

  /**
   * Format notification as HTML email body
   */
  private formatEmailBody(notification: Notification): string {
    const severityColor = {
      critical: '#dc2626',
      warning: '#f59e0b',
      info: '#3b82f6'
    }[notification.type];

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${severityColor}; color: white; padding: 15px; border-radius: 5px; }
          .content { padding: 20px; background: #f9f9f9; margin-top: 20px; border-radius: 5px; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>[${notification.type.toUpperCase()}] ${notification.title}</h2>
          </div>
          <div class="content">
            <p>${notification.message}</p>
            ${notification.data ? `<pre>${JSON.stringify(notification.data, null, 2)}</pre>` : ''}
          </div>
          <div class="footer">
            <p>This is an automated notification from SmartPOS System.</p>
            <p>Time: ${new Date().toISOString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send critical data integrity alert
   */
  async sendDataIntegrityAlert(issues: any[]): Promise<void> {
    await this.sendToAdmins({
      type: 'critical',
      title: 'Data Integrity Issues Detected',
      message: `Found ${issues.length} data integrity issues that require attention.`,
      data: issues
    });
  }

  /**
   * Send low stock alert
   */
  async sendLowStockAlert(products: any[]): Promise<void> {
    await this.sendToAdmins({
      type: 'warning',
      title: 'Low Stock Alert',
      message: `${products.length} products are running low on stock.`,
      data: products
    });
  }

  /**
   * Send expired reservation alert
   */
  async sendExpiredReservationAlert(count: number): Promise<void> {
    if (count > 0) {
      await this.sendToAdmins({
        type: 'info',
        title: 'Expired Serial Reservations Released',
        message: `${count} expired serial number reservations have been automatically released.`
      });
    }
  }
}
