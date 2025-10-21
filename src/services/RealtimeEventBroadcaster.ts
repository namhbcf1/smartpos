import { Env } from '../types';

export class RealtimeEventBroadcaster {
  constructor(private env: Env) {}

  async broadcast(tenantId: string, event: any) {
    try {
      await this.env.DB.prepare(`
        INSERT INTO broadcast_messages (id, tenant_id, type, data_json, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        tenantId,
        event.type || 'message',
        JSON.stringify(event),
        new Date().toISOString()
      ).run();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async broadcastProductUpdate(env: Env, tenantId: string, product: any) {
    const broadcaster = new RealtimeEventBroadcaster(env);
    return broadcaster.broadcast(tenantId, {
      type: 'product_update',
      data: product
    });
  }

  static async broadcastSaleUpdate(env: Env, tenantId: string, sale: any) {
    const broadcaster = new RealtimeEventBroadcaster(env);
    return broadcaster.broadcast(tenantId, {
      type: 'sale_update',
      data: sale
    });
  }

  static async broadcastInventoryUpdate(env: Env, tenantId: string, inventory: any) {
    const broadcaster = new RealtimeEventBroadcaster(env);
    return broadcaster.broadcast(tenantId, {
      type: 'inventory_update',
      data: inventory
    });
  }
}
