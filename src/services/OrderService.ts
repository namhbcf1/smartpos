import { BaseService } from './BaseService';
import { Env } from '../types';

export class OrderService extends BaseService {
  constructor(env: Env) {
    super(env, 'orders', 'id');
  }

  async getOrders(tenantId: string = 'default', filters?: any) {
    return await this.getAll(tenantId, filters?.page || 1, filters?.limit || 50);
  }

  async getOrderById(id: string, tenantId: string = 'default') {
    // Get order
    const orderResult = await this.getById(id, tenantId);
    if (!orderResult.success || !orderResult.data) {
      return orderResult;
    }

    // Get order items with serial numbers
    const itemsResult = await this.env.DB.prepare(`
      SELECT
        oi.*,
        p.name as product_name,
        p.sku as product_sku,
        GROUP_CONCAT(sn.serial_number) as serial_numbers
      FROM order_items oi
      LEFT JOIN products p ON p.id = oi.product_id
      LEFT JOIN serial_numbers sn ON sn.order_item_id = oi.id
      WHERE oi.order_id = ?
      GROUP BY oi.id
      ORDER BY oi.created_at
    `).bind(id).all();

    return {
      success: true,
      data: {
        ...orderResult.data,
        items: itemsResult.results || []
      }
    };
  }

  async createOrder(tenantId: string, data: any) {
    return await this.create(tenantId, data);
  }

  async updateOrder(id: string, tenantId: string, data: any) {
    return await this.update(id, tenantId, data);
  }

  async cancelOrder(id: string, tenantId: string) {
    const now = new Date().toISOString();
    await this.env.DB.prepare(`
      UPDATE orders SET status = 'cancelled', updated_at = ? WHERE id = ? AND tenant_id = ?
    `).bind(now, id, tenantId).run();
    return { success: true };
  }

  async updateOrderStatus(id: string, tenantId: string, status: string) {
    const now = new Date().toISOString();
    await this.env.DB.prepare(`
      UPDATE orders SET status = ?, updated_at = ? WHERE id = ? AND tenant_id = ?
    `).bind(status, now, id, tenantId).run();
    return { success: true };
  }

  async getOrderStats(tenantId: string = 'default') {
    const total = await this.env.DB.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE tenant_id = ?
    `).bind(tenantId).first();

    const pending = await this.env.DB.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE tenant_id = ? AND status = 'pending'
    `).bind(tenantId).first();

    const completed = await this.env.DB.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE tenant_id = ? AND status = 'completed'
    `).bind(tenantId).first();

    const revenue = await this.env.DB.prepare(`
      SELECT COALESCE(SUM(total_cents), 0) as total FROM orders WHERE tenant_id = ? AND status = 'completed'
    `).bind(tenantId).first();

    return {
      success: true,
      stats: {
        total: Number((total as any)?.count) || 0,
        pending: Number((pending as any)?.count) || 0,
        completed: Number((completed as any)?.count) || 0,
        revenue: (Number((revenue as any)?.total) || 0) / 100
      }
    };
  }

  async fulfillOrder(id: string, tenantId: string): Promise<{ success: boolean; order?: any; error?: string }> {
    try {
      const now = new Date().toISOString();
      await this.env.DB.prepare(`
        UPDATE orders SET status = 'fulfilled', updated_at = ? WHERE id = ? AND tenant_id = ?
      `).bind(now, id, tenantId).run();
      const order = await this.getById(id, tenantId);
      return { success: true, order: order.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async shipOrder(id: string, tenantId: string, trackingInfo: any) {
    const now = new Date().toISOString();
    await this.env.DB.prepare(`
      UPDATE orders SET status = 'shipped', updated_at = ? WHERE id = ? AND tenant_id = ?
    `).bind(now, id, tenantId).run();
    return { success: true };
  }

  async getOrderItems(id: string, tenantId: string = 'default') {
    const items = await this.env.DB.prepare(`
      SELECT * FROM order_items WHERE order_id = ?
    `).bind(id).all();
    return { success: true, data: items.results || [] };
  }
}
