import { Env } from '../types';

export class NotificationService {
  static async notifySaleCompleted(env: Env, tenantId: string, data: any): Promise<void> {
    try {
      console.log('Creating sale completion notification:', data);
      
      // Store notification in database
      await env.DB.prepare(`
        INSERT INTO notifications (
          tenant_id, type, title, message, data, 
          created_at, is_read, priority
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        tenantId,
        'sale_completed',
        'Bán hàng hoàn thành',
        `Đơn hàng ${data.invoice_number} đã được hoàn thành với tổng tiền ${data.total_amount?.toLocaleString('vi-VN')} VND`,
        JSON.stringify(data),
        new Date().toISOString(),
        0,
        'medium'
      ).run();
      
      // Store in KV for real-time access
      const notificationKey = `notification_${tenantId}_${Date.now()}`;
      await env.CACHE.put(notificationKey, JSON.stringify({
        type: 'sale_completed',
        tenantId,
        data,
        timestamp: new Date().toISOString()
      }));
      
    } catch (error) {
      console.error('Failed to create sale completion notification:', error);
    }
  }

  static async notifyLowStock(env: Env, tenantId: string, productData: any): Promise<void> {
    try {
      console.log('Creating low stock notification:', productData);
      
      await env.DB.prepare(`
        INSERT INTO notifications (
          tenant_id, type, title, message, data, 
          created_at, is_read, priority
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        tenantId,
        'low_stock',
        'Cảnh báo tồn kho thấp',
        `Sản phẩm ${productData.name} chỉ còn ${productData.stock} sản phẩm`,
        JSON.stringify(productData),
        new Date().toISOString(),
        0,
        'high'
      ).run();
      
    } catch (error) {
      console.error('Failed to create low stock notification:', error);
    }
  }

  static async notifySystemAlert(env: Env, tenantId: string, alertData: any): Promise<void> {
    try {
      console.log('Creating system alert:', alertData);
      
      await env.DB.prepare(`
        INSERT INTO notifications (
          tenant_id, type, title, message, data, 
          created_at, is_read, priority
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        tenantId,
        'system_alert',
        alertData.title || 'Cảnh báo hệ thống',
        alertData.message || 'Có cảnh báo từ hệ thống',
        JSON.stringify(alertData),
        new Date().toISOString(),
        0,
        alertData.priority || 'medium'
      ).run();
      
    } catch (error) {
      console.error('Failed to create system alert:', error);
    }
  }
}
