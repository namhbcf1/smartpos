// ==========================================
// COMPUTERPOS PRO - WARRANTY SYNC DURABLE OBJECT
// Real-time warranty status synchronization and notifications
// ==========================================

import { Env } from '../types';

export interface WarrantyEvent {
  type: 'warranty_registered' | 'warranty_expiring' | 'warranty_expired' | 'claim_created' | 'claim_updated';
  warrantyId: number;
  serialNumberId: number;
  customerId: number;
  productId: number;
  data: any;
  timestamp: string;
}

export interface WarrantyNotificationSchedule {
  warrantyId: number;
  notificationType: 'expiry_warning' | 'expired';
  scheduledDate: string;
  customerId: number;
  customerEmail?: string;
  customerPhone?: string;
  productName: string;
  serialNumber: string;
  warrantyEndDate: string;
}

export class WarrantySyncObject {
  private state: DurableObjectState;
  private env: Env;
  private sessions: Set<WebSocket> = new Set();
  private notificationSchedule: Map<string, WarrantyNotificationSchedule> = new Map();

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    
    // Initialize notification schedule from storage
    this.initializeNotificationSchedule();
    
    // Set up periodic warranty expiry checks (every hour)
    this.state.blockConcurrencyWhile(async () => {
      const alarm = await this.state.storage.getAlarm();
      if (alarm === null) {
        // Set alarm for next hour
        await this.state.storage.setAlarm(Date.now() + 60 * 60 * 1000);
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/websocket') {
      return this.handleWebSocket(request);
    }
    
    if (url.pathname === '/warranty-event' && request.method === 'POST') {
      return this.handleWarrantyEvent(request);
    }
    
    if (url.pathname === '/schedule-notification' && request.method === 'POST') {
      return this.handleScheduleNotification(request);
    }
    
    if (url.pathname === '/check-expiring' && request.method === 'POST') {
      return this.handleCheckExpiringWarranties(request);
    }

    return new Response('Not found', { status: 404 });
  }

  async alarm(): Promise<void> {
    try {
      console.log('WarrantySyncObject: Running periodic warranty expiry check');
      
      // Check for expiring warranties
      await this.checkExpiringWarranties();
      
      // Process scheduled notifications
      await this.processScheduledNotifications();
      
      // Schedule next alarm
      await this.state.storage.setAlarm(Date.now() + 60 * 60 * 1000);
      
    } catch (error) {
      console.error('WarrantySyncObject alarm error:', error);
      // Reschedule alarm even if there's an error
      await this.state.storage.setAlarm(Date.now() + 60 * 60 * 1000);
    }
  }

  private async handleWebSocket(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected websocket', { status: 400 });
    }

    const [client, server] = Object.values(new WebSocketPair());
    
    this.sessions.add(server);
    
    server.addEventListener('close', () => {
      this.sessions.delete(server);
    });

    server.addEventListener('error', () => {
      this.sessions.delete(server);
    });

    server.accept();
    
    // Send initial connection confirmation
    server.send(JSON.stringify({
      type: 'connection_established',
      timestamp: new Date().toISOString(),
      message: 'Warranty sync connected'
    }));

    return new Response(null, { status: 101, webSocket: client });
  }

  private async handleWarrantyEvent(request: Request): Promise<Response> {
    try {
      const event: WarrantyEvent = await request.json();
      
      // Validate event
      if (!event.type || !event.warrantyId || !event.timestamp) {
        return new Response('Invalid event data', { status: 400 });
      }

      // Store event for audit trail
      await this.state.storage.put(`event:${Date.now()}:${event.warrantyId}`, event);

      // Broadcast to all connected clients
      await this.broadcastEvent(event);

      // Handle specific event types
      switch (event.type) {
        case 'warranty_registered':
          await this.handleWarrantyRegistered(event);
          break;
        case 'warranty_expiring':
          await this.handleWarrantyExpiring(event);
          break;
        case 'warranty_expired':
          await this.handleWarrantyExpired(event);
          break;
        case 'claim_created':
        case 'claim_updated':
          await this.handleClaimEvent(event);
          break;
      }

      return new Response('Event processed', { status: 200 });

    } catch (error) {
      console.error('Error handling warranty event:', error);
      return new Response('Internal error', { status: 500 });
    }
  }

  private async handleScheduleNotification(request: Request): Promise<Response> {
    try {
      const schedule: WarrantyNotificationSchedule = await request.json();
      
      // Store notification schedule
      const key = `notification:${schedule.warrantyId}:${schedule.notificationType}`;
      this.notificationSchedule.set(key, schedule);
      await this.state.storage.put(key, schedule);

      return new Response('Notification scheduled', { status: 200 });

    } catch (error) {
      console.error('Error scheduling notification:', error);
      return new Response('Internal error', { status: 500 });
    }
  }

  private async handleCheckExpiringWarranties(request: Request): Promise<Response> {
    try {
      await this.checkExpiringWarranties();
      return new Response('Expiring warranties checked', { status: 200 });
    } catch (error) {
      console.error('Error checking expiring warranties:', error);
      return new Response('Internal error', { status: 500 });
    }
  }

  private async broadcastEvent(event: WarrantyEvent): Promise<void> {
    const message = JSON.stringify({
      type: 'warranty_event',
      event,
      timestamp: new Date().toISOString()
    });

    // Broadcast to all connected sessions
    const promises = Array.from(this.sessions).map(async (session) => {
      try {
        session.send(message);
      } catch (error) {
        console.error('Error broadcasting to session:', error);
        this.sessions.delete(session);
      }
    });

    await Promise.allSettled(promises);
  }

  private async handleWarrantyRegistered(event: WarrantyEvent): Promise<void> {
    try {
      // Schedule expiry warning notification (30 days before expiry)
      const warrantyData = event.data;
      if (warrantyData.warranty_end_date) {
        const endDate = new Date(warrantyData.warranty_end_date);
        const warningDate = new Date(endDate);
        warningDate.setDate(warningDate.getDate() - 30);

        if (warningDate > new Date()) {
          const schedule: WarrantyNotificationSchedule = {
            warrantyId: event.warrantyId,
            notificationType: 'expiry_warning',
            scheduledDate: warningDate.toISOString(),
            customerId: event.customerId,
            customerEmail: warrantyData.customer_email,
            customerPhone: warrantyData.customer_phone,
            productName: warrantyData.product_name,
            serialNumber: warrantyData.serial_number,
            warrantyEndDate: warrantyData.warranty_end_date,
          };

          const key = `notification:${event.warrantyId}:expiry_warning`;
          this.notificationSchedule.set(key, schedule);
          await this.state.storage.put(key, schedule);
        }
      }

      // Send confirmation notification
      await this.sendNotificationToDatabase({
        warranty_registration_id: event.warrantyId,
        notification_type: 'registration_confirmation',
        notification_method: 'email',
        scheduled_date: new Date().toISOString(),
        subject: 'Xác nhận đăng ký bảo hành',
        message: `Bảo hành cho sản phẩm ${event.data.product_name} đã được đăng ký thành công.`,
      });

    } catch (error) {
      console.error('Error handling warranty registered:', error);
    }
  }

  private async handleWarrantyExpiring(event: WarrantyEvent): Promise<void> {
    try {
      await this.sendNotificationToDatabase({
        warranty_registration_id: event.warrantyId,
        notification_type: 'expiry_warning',
        notification_method: 'email',
        scheduled_date: new Date().toISOString(),
        subject: 'Cảnh báo bảo hành sắp hết hạn',
        message: `Bảo hành cho sản phẩm ${event.data.product_name} sẽ hết hạn vào ${event.data.warranty_end_date}.`,
      });
    } catch (error) {
      console.error('Error handling warranty expiring:', error);
    }
  }

  private async handleWarrantyExpired(event: WarrantyEvent): Promise<void> {
    try {
      await this.sendNotificationToDatabase({
        warranty_registration_id: event.warrantyId,
        notification_type: 'expired',
        notification_method: 'email',
        scheduled_date: new Date().toISOString(),
        subject: 'Bảo hành đã hết hạn',
        message: `Bảo hành cho sản phẩm ${event.data.product_name} đã hết hạn.`,
      });
    } catch (error) {
      console.error('Error handling warranty expired:', error);
    }
  }

  private async handleClaimEvent(event: WarrantyEvent): Promise<void> {
    try {
      const messageMap = {
        claim_created: 'Yêu cầu bảo hành mới đã được tạo',
        claim_updated: 'Trạng thái yêu cầu bảo hành đã được cập nhật'
      };

      await this.sendNotificationToDatabase({
        warranty_registration_id: event.warrantyId,
        notification_type: 'claim_update',
        notification_method: 'email',
        scheduled_date: new Date().toISOString(),
        subject: 'Cập nhật yêu cầu bảo hành',
        message: messageMap[event.type as keyof typeof messageMap] || 'Cập nhật yêu cầu bảo hành',
      });
    } catch (error) {
      console.error('Error handling claim event:', error);
    }
  }

  private async checkExpiringWarranties(): Promise<void> {
    try {
      // Query database for warranties expiring in the next 30 days
      const query = `
        SELECT wr.*, p.name as product_name, sn.serial_number, c.full_name, c.email, c.phone
        FROM warranty_registrations wr
        JOIN products p ON wr.product_id = p.id
        JOIN serial_numbers sn ON wr.serial_number_id = sn.id
        JOIN customers c ON wr.customer_id = c.id
        WHERE wr.status = 'active' 
        AND wr.warranty_end_date <= datetime('now', '+30 days')
        AND wr.warranty_end_date > datetime('now')
      `;

      const results = await this.env.DB.prepare(query).all();

      for (const warranty of results.results) {
        const event: WarrantyEvent = {
          type: 'warranty_expiring',
          warrantyId: warranty.id as number,
          serialNumberId: warranty.serial_number_id as number,
          customerId: warranty.customer_id as number,
          productId: warranty.product_id as number,
          data: warranty,
          timestamp: new Date().toISOString(),
        };

        await this.broadcastEvent(event);
        await this.handleWarrantyExpiring(event);
      }

    } catch (error) {
      console.error('Error checking expiring warranties:', error);
    }
  }

  private async processScheduledNotifications(): Promise<void> {
    const now = new Date();
    
    for (const [key, schedule] of this.notificationSchedule.entries()) {
      const scheduledDate = new Date(schedule.scheduledDate);
      
      if (scheduledDate <= now) {
        try {
          // Send the notification
          await this.sendNotificationToDatabase({
            warranty_registration_id: schedule.warrantyId,
            notification_type: schedule.notificationType,
            notification_method: 'email',
            scheduled_date: schedule.scheduledDate,
            subject: schedule.notificationType === 'expiry_warning' ? 
              'Cảnh báo bảo hành sắp hết hạn' : 'Bảo hành đã hết hạn',
            message: `Bảo hành cho sản phẩm ${schedule.productName} (SN: ${schedule.serialNumber}) ${
              schedule.notificationType === 'expiry_warning' ? 
              'sẽ hết hạn vào' : 'đã hết hạn vào'
            } ${schedule.warrantyEndDate}.`,
          });

          // Remove from schedule
          this.notificationSchedule.delete(key);
          await this.state.storage.delete(key);

        } catch (error) {
          console.error('Error processing scheduled notification:', error);
        }
      }
    }
  }

  private async sendNotificationToDatabase(notification: any): Promise<void> {
    try {
      const insertQuery = `
        INSERT INTO warranty_notifications (
          warranty_registration_id, notification_type, notification_method,
          scheduled_date, subject, message, status
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending')
      `;

      await this.env.DB.prepare(insertQuery).bind(
        notification.warranty_registration_id,
        notification.notification_type,
        notification.notification_method,
        notification.scheduled_date,
        notification.subject,
        notification.message
      ).run();

    } catch (error) {
      console.error('Error saving notification to database:', error);
    }
  }

  private async initializeNotificationSchedule(): Promise<void> {
    try {
      const schedules = await this.state.storage.list({ prefix: 'notification:' });
      
      for (const [key, schedule] of schedules.entries()) {
        this.notificationSchedule.set(key, schedule as WarrantyNotificationSchedule);
      }

    } catch (error) {
      console.error('Error initializing notification schedule:', error);
    }
  }
}
