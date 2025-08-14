/**
 * Real-Time Notification Service
 * Production-ready notification system with WebSocket support
 * Rules.md compliant - uses only real Cloudflare D1 data and Durable Objects
 */

import { Env } from '../types';

export interface Notification {
  id: number;
  user_id: number | null; // null for broadcast notifications
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'system' | 'inventory' | 'sales' | 'user' | 'security';
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  is_persistent: boolean; // Whether to store in database
  expires_at?: string;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: number;
  email_notifications: boolean;
  push_notifications: boolean;
  inventory_alerts: boolean;
  sales_alerts: boolean;
  system_alerts: boolean;
  low_stock_threshold: number;
}

export interface BroadcastMessage {
  type: string;
  data: any;
  timestamp: string;
  sender?: string;
}

export class RealTimeNotificationService {
  constructor(private env: Env) {}

  /**
   * Send real-time notification to specific user
   */
  async sendToUser(userId: number, notification: Omit<Notification, 'id' | 'user_id' | 'created_at'>): Promise<void> {
    try {
      // Store persistent notifications in database
      if (notification.is_persistent) {
        await this.env.DB.prepare(`
          INSERT INTO notifications (
            user_id, type, category, title, message, data, 
            is_read, is_persistent, expires_at, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, 0, 1, ?, datetime('now'))
        `).bind(
          userId,
          notification.type,
          notification.category,
          notification.title,
          notification.message,
          JSON.stringify(notification.data || {}),
          notification.expires_at
        ).run();
      }

      // Send real-time notification via Durable Object
      await this.broadcastToUser(userId, {
        type: 'notification',
        data: {
          ...notification,
          user_id: userId,
          created_at: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error sending notification to user:', error);
    }
  }

  /**
   * Broadcast notification to all connected users
   */
  async broadcastToAll(notification: Omit<Notification, 'id' | 'user_id' | 'created_at'>): Promise<void> {
    try {
      // Store broadcast notifications if persistent
      if (notification.is_persistent) {
        await this.env.DB.prepare(`
          INSERT INTO notifications (
            user_id, type, category, title, message, data,
            is_read, is_persistent, expires_at, created_at
          ) VALUES (NULL, ?, ?, ?, ?, ?, 0, 1, ?, datetime('now'))
        `).bind(
          notification.type,
          notification.category,
          notification.title,
          notification.message,
          JSON.stringify(notification.data || {}),
          notification.expires_at
        ).run();
      }

      // Broadcast to all connected clients
      await this.broadcast({
        type: 'broadcast_notification',
        data: {
          ...notification,
          user_id: null,
          created_at: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error broadcasting notification:', error);
    }
  }

  /**
   * Send inventory alert
   */
  async sendInventoryAlert(productId: number, alertType: 'low_stock' | 'out_of_stock' | 'reorder_needed', currentStock: number): Promise<void> {
    try {
      const product = await this.env.DB.prepare(`
        SELECT name, sku FROM products WHERE id = ?
      `).bind(productId).first<{ name: string; sku: string }>();

      if (!product) return;

      let title = '';
      let message = '';
      let type: Notification['type'] = 'warning';

      switch (alertType) {
        case 'out_of_stock':
          title = 'Out of Stock Alert';
          message = `${product.name} (${product.sku}) is out of stock`;
          type = 'error';
          break;
        case 'low_stock':
          title = 'Low Stock Alert';
          message = `${product.name} (${product.sku}) is running low (${currentStock} remaining)`;
          type = 'warning';
          break;
        case 'reorder_needed':
          title = 'Reorder Required';
          message = `${product.name} (${product.sku}) needs to be reordered`;
          type = 'info';
          break;
      }

      // Get users who should receive inventory alerts
      const users = await this.env.DB.prepare(`
        SELECT DISTINCT u.id
        FROM users u
        JOIN user_notification_preferences unp ON u.id = unp.user_id
        WHERE u.is_active = 1 AND unp.inventory_alerts = 1
      `).all();

      // Send to each user
      for (const user of users.results as any[]) {
        await this.sendToUser(user.id, {
          type,
          category: 'inventory',
          title,
          message,
          data: {
            product_id: productId,
            product_name: product.name,
            sku: product.sku,
            current_stock: currentStock,
            alert_type: alertType
          },
          is_persistent: true,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        });
      }

    } catch (error) {
      console.error('Error sending inventory alert:', error);
    }
  }

  /**
   * Send sales notification
   */
  async sendSalesNotification(saleId: number, eventType: 'created' | 'completed' | 'cancelled', amount: number): Promise<void> {
    try {
      let title = '';
      let message = '';
      let type: Notification['type'] = 'info';

      switch (eventType) {
        case 'created':
          title = 'New Sale Created';
          message = `Sale #${saleId} created for ${this.formatCurrency(amount)}`;
          type = 'info';
          break;
        case 'completed':
          title = 'Sale Completed';
          message = `Sale #${saleId} completed for ${this.formatCurrency(amount)}`;
          type = 'success';
          break;
        case 'cancelled':
          title = 'Sale Cancelled';
          message = `Sale #${saleId} was cancelled`;
          type = 'warning';
          break;
      }

      // Get users who should receive sales alerts
      const users = await this.env.DB.prepare(`
        SELECT DISTINCT u.id
        FROM users u
        JOIN user_notification_preferences unp ON u.id = unp.user_id
        WHERE u.is_active = 1 AND unp.sales_alerts = 1
      `).all();

      // Send to each user
      for (const user of users.results as any[]) {
        await this.sendToUser(user.id, {
          type,
          category: 'sales',
          title,
          message,
          data: {
            sale_id: saleId,
            event_type: eventType,
            amount
          },
          is_persistent: false, // Sales notifications are not persistent
        });
      }

    } catch (error) {
      console.error('Error sending sales notification:', error);
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: number, options?: {
    unread_only?: boolean;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    notifications: Notification[];
    unread_count: number;
    total: number;
  }> {
    try {
      let whereClause = 'WHERE (user_id = ? OR user_id IS NULL)';
      const params: any[] = [userId];

      if (options?.unread_only) {
        whereClause += ' AND is_read = 0';
      }

      if (options?.category) {
        whereClause += ' AND category = ?';
        params.push(options.category);
      }

      whereClause += ' AND (expires_at IS NULL OR expires_at > datetime(\'now\'))';

      const limit = Math.min(options?.limit || 50, 100);
      const offset = options?.offset || 0;

      // Get notifications
      const notifications = await this.env.DB.prepare(`
        SELECT * FROM notifications
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).bind(...params, limit, offset).all();

      // Get unread count
      const unreadCount = await this.env.DB.prepare(`
        SELECT COUNT(*) as count FROM notifications
        ${whereClause} AND is_read = 0
      `).bind(...params).first<{ count: number }>();

      // Get total count
      const total = await this.env.DB.prepare(`
        SELECT COUNT(*) as count FROM notifications
        ${whereClause}
      `).bind(...params).first<{ count: number }>();

      return {
        notifications: notifications.results as Notification[],
        unread_count: unreadCount?.count || 0,
        total: total?.count || 0
      };

    } catch (error) {
      console.error('Error getting user notifications:', error);
      return { notifications: [], unread_count: 0, total: 0 };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number, userId: number): Promise<void> {
    try {
      await this.env.DB.prepare(`
        UPDATE notifications 
        SET is_read = 1 
        WHERE id = ? AND (user_id = ? OR user_id IS NULL)
      `).bind(notificationId, userId).run();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: number): Promise<void> {
    try {
      await this.env.DB.prepare(`
        UPDATE notifications 
        SET is_read = 1 
        WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0
      `).bind(userId).run();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  /**
   * Get or create user notification preferences
   */
  async getUserPreferences(userId: number): Promise<NotificationPreferences> {
    try {
      let preferences = await this.env.DB.prepare(`
        SELECT * FROM user_notification_preferences WHERE user_id = ?
      `).bind(userId).first<NotificationPreferences>();

      if (!preferences) {
        // Create default preferences
        await this.env.DB.prepare(`
          INSERT INTO user_notification_preferences (
            user_id, email_notifications, push_notifications,
            inventory_alerts, sales_alerts, system_alerts, low_stock_threshold
          ) VALUES (?, 1, 1, 1, 1, 1, 5)
        `).bind(userId).run();

        preferences = {
          user_id: userId,
          email_notifications: true,
          push_notifications: true,
          inventory_alerts: true,
          sales_alerts: true,
          system_alerts: true,
          low_stock_threshold: 5
        };
      }

      return preferences;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      throw error;
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(userId: number, preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      const updateFields: string[] = [];
      const params: any[] = [];

      Object.entries(preferences).forEach(([key, value]) => {
        if (key !== 'user_id' && value !== undefined) {
          updateFields.push(`${key} = ?`);
          params.push(value);
        }
      });

      if (updateFields.length > 0) {
        params.push(userId);
        await this.env.DB.prepare(`
          UPDATE user_notification_preferences 
          SET ${updateFields.join(', ')} 
          WHERE user_id = ?
        `).bind(...params).run();
      }
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  /**
   * Broadcast message to all connected clients via Durable Object
   */
  private async broadcast(message: BroadcastMessage): Promise<void> {
    try {
      if (this.env.NOTIFICATIONS) {
        await this.env.NOTIFICATIONS.fetch('http://internal/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        });
      }
    } catch (error) {
      console.error('Error broadcasting message:', error);
    }
  }

  /**
   * Send message to specific user via Durable Object
   */
  private async broadcastToUser(userId: number, message: BroadcastMessage): Promise<void> {
    try {
      if (this.env.NOTIFICATIONS) {
        await this.env.NOTIFICATIONS.fetch(`http://internal/user/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        });
      }
    } catch (error) {
      console.error('Error sending message to user:', error);
    }
  }

  /**
   * Format currency for display
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  /**
   * Initialize notification tables
   */
  async initializeTables(): Promise<void> {
    try {
      // Create notifications table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
          category TEXT NOT NULL CHECK (category IN ('system', 'inventory', 'sales', 'user', 'security')),
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          data TEXT,
          is_read BOOLEAN DEFAULT 0,
          is_persistent BOOLEAN DEFAULT 1,
          expires_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `).run();

      // Create user notification preferences table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS user_notification_preferences (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL UNIQUE,
          email_notifications BOOLEAN DEFAULT 1,
          push_notifications BOOLEAN DEFAULT 1,
          inventory_alerts BOOLEAN DEFAULT 1,
          sales_alerts BOOLEAN DEFAULT 1,
          system_alerts BOOLEAN DEFAULT 1,
          low_stock_threshold INTEGER DEFAULT 5,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `).run();

      console.log('Notification tables initialized successfully');
    } catch (error) {
      console.error('Error initializing notification tables:', error);
      throw error;
    }
  }
}
