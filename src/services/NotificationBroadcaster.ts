/**
 * Unified Notification Broadcaster
 * Handles all realtime event broadcasting for Phase 1 requirements
 */

import { Env } from '../types';

export interface NotificationEvent {
  type: string;
  topic: 'sales' | 'inventory' | 'system' | 'warranty';
  category?: string;
  data: {
    title: string;
    message: string;
    severity?: 'error' | 'warning' | 'info' | 'success';
    [key: string]: any;
  };
  timestamp: number;
  user_id?: string;
}

export class NotificationBroadcaster {
  
  /**
   * Generic broadcast method - all notifications go through here
   */
  static async broadcast(env: Env, event: NotificationEvent): Promise<boolean> {
    try {
      const doId = (env.NOTIFICATIONS as any)?.idFromName('global-notifications');
      if (!doId) {
        console.warn('Notifications DO not available');
        return false;
      }

      const obj = env.NOTIFICATIONS.get(doId);
      const response = await obj.fetch(new Request('https://do.local/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      }));

      if (!response.ok) {
        console.error('Broadcast failed:', response.status);
        return false;
      }

      console.log(`📡 Broadcasted ${event.type} notification`);
      return true;
    } catch (error) {
      console.error('Broadcast error:', error);
      return false;
    }
  }

  /**
   * Sales Events
   */
  static async broadcastSaleCreated(env: Env, saleData: any, userId?: string): Promise<void> {
    await this.broadcast(env, {
      type: 'sale_completed',
      topic: 'sales',
      category: 'sales',
      data: {
        title: 'Đơn hàng mới',
        message: `Đơn hàng #${saleData.sale_number} trị giá ${new Intl.NumberFormat('vi-VN').format(saleData.total_amount)} VNĐ`,
        severity: 'success',
        sale_id: saleData.id,
        sale_number: saleData.sale_number,
        total_amount: saleData.total_amount,
        customer_name: saleData.customer_name
      },
      timestamp: Date.now(),
      user_id: userId
    });
  }

  static async broadcastSaleUpdated(env: Env, saleData: any, userId?: string): Promise<void> {
    await this.broadcast(env, {
      type: 'sale_updated',
      topic: 'sales',
      category: 'sales',
      data: {
        title: 'Đơn hàng cập nhật',
        message: `Đơn hàng #${saleData.sale_number} đã được cập nhật`,
        severity: 'info',
        sale_id: saleData.id,
        sale_number: saleData.sale_number
      },
      timestamp: Date.now(),
      user_id: userId
    });
  }

  /**
   * Inventory Events
   */
  static async broadcastStockUpdated(env: Env, inventoryData: any, userId?: string): Promise<void> {
    await this.broadcast(env, {
      type: 'stock_updated',
      topic: 'inventory',
      category: 'inventory',
      data: {
        title: `Điều chỉnh kho: ${inventoryData.product_name}`,
        message: `${inventoryData.change > 0 ? 'Tăng' : 'Giảm'} ${Math.abs(inventoryData.change)} sản phẩm`,
        severity: inventoryData.new_quantity <= 5 ? 'warning' : 'info',
        product_id: inventoryData.product_id,
        product_name: inventoryData.product_name,
        previous_quantity: inventoryData.previous_quantity,
        new_quantity: inventoryData.new_quantity,
        change: inventoryData.change,
        location_id: inventoryData.location_id
      },
      timestamp: Date.now(),
      user_id: userId
    });
  }

  static async broadcastLowStock(env: Env, productData: any): Promise<void> {
    await this.broadcast(env, {
      type: 'low_stock',
      topic: 'inventory',
      category: 'inventory',
      data: {
        title: 'Sản phẩm sắp hết hàng',
        message: `${productData.product_name} chỉ còn ${productData.current_stock} sản phẩm trong kho`,
        severity: 'warning',
        product_id: productData.product_id,
        product_name: productData.product_name,
        current_stock: productData.current_stock,
        location_id: productData.location_id,
        threshold: productData.threshold || 5
      },
      timestamp: Date.now()
    });
  }

  static async broadcastStockOut(env: Env, productData: any): Promise<void> {
    await this.broadcast(env, {
      type: 'stock_out',
      topic: 'inventory',
      category: 'inventory',
      data: {
        title: 'Sản phẩm hết hàng',
        message: `${productData.product_name} đã hết hàng tại ${productData.location_name || productData.location_id}`,
        severity: 'error',
        product_id: productData.product_id,
        product_name: productData.product_name,
        location_id: productData.location_id
      },
      timestamp: Date.now()
    });
  }

  /**
   * System Events
   */
  static async broadcastSystemAlert(env: Env, alertData: any, userId?: string): Promise<void> {
    await this.broadcast(env, {
      type: 'system_alert',
      topic: 'system',
      category: 'system',
      data: {
        title: alertData.title || 'Cảnh báo hệ thống',
        message: alertData.message,
        severity: alertData.severity || 'warning',
        alert_type: alertData.alert_type,
        details: alertData.details
      },
      timestamp: Date.now(),
      user_id: userId
    });
  }

  static async broadcastUserLogin(env: Env, userData: any): Promise<void> {
    await this.broadcast(env, {
      type: 'user_login',
      topic: 'system',
      category: 'system',
      data: {
        title: 'Người dùng đăng nhập',
        message: `${userData.username || userData.email} đã đăng nhập vào hệ thống`,
        severity: 'info',
        user_id: userData.id,
        username: userData.username,
        login_time: new Date().toISOString()
      },
      timestamp: Date.now(),
      user_id: userData.id
    });
  }

  /**
   * Warranty Events
   */
  static async broadcastWarrantyExpiring(env: Env, warrantyData: any): Promise<void> {
    await this.broadcast(env, {
      type: 'warranty_expiring',
      topic: 'warranty',
      category: 'warranty',
      data: {
        title: 'Bảo hành sắp hết hạn',
        message: `Sản phẩm ${warrantyData.product_name} (SN: ${warrantyData.serial_number}) sẽ hết bảo hành vào ${new Date(warrantyData.warranty_end_date).toLocaleDateString('vi-VN')}`,
        severity: 'warning',
        product_name: warrantyData.product_name,
        serial_number: warrantyData.serial_number,
        warranty_end_date: warrantyData.warranty_end_date,
        customer_name: warrantyData.customer_name
      },
      timestamp: Date.now()
    });
  }

  static async broadcastWarrantyClaimCreated(env: Env, claimData: any): Promise<void> {
    await this.broadcast(env, {
      type: 'warranty_claim_created',
      topic: 'warranty',
      category: 'warranty',
      data: {
        title: 'Yêu cầu bảo hành mới',
        message: `Khách hàng ${claimData.customer_name} tạo yêu cầu bảo hành cho sản phẩm ${claimData.product_name}`,
        severity: 'info',
        claim_id: claimData.id,
        product_name: claimData.product_name,
        customer_name: claimData.customer_name,
        reported_date: claimData.reported_date
      },
      timestamp: Date.now()
    });
  }

  /**
   * Utility method to broadcast multiple events at once
   */
  static async broadcastBatch(env: Env, events: NotificationEvent[]): Promise<boolean[]> {
    return Promise.all(events.map(event => this.broadcast(env, event)));
  }
}