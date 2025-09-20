import { Env } from '../types';

export class RealtimeEventBroadcaster {
  static async broadcastProductUpdate(env: Env, productId: string, data: any): Promise<void> {
    try {
      // Broadcast to WebSocket connections
      console.log(`Broadcasting product update for ${productId}:`, data);
      
      // Store in KV for persistence
      const eventKey = `product_update_${productId}_${Date.now()}`;
      await env.CACHE.put(eventKey, JSON.stringify({
        type: 'product_update',
        productId,
        data,
        timestamp: new Date().toISOString()
      }));
      
    } catch (error) {
      console.error('Failed to broadcast product update:', error);
    }
  }

  static async broadcastSaleUpdate(env: Env, data: any): Promise<void> {
    try {
      console.log('Broadcasting sale update:', data);
      
      // Store in KV for persistence
      const eventKey = `sale_update_${Date.now()}`;
      await env.CACHE.put(eventKey, JSON.stringify({
        type: 'sale_update',
        data,
        timestamp: new Date().toISOString()
      }));
      
    } catch (error) {
      console.error('Failed to broadcast sale update:', error);
    }
  }

  static async broadcastInventoryUpdate(env: Env, data: any): Promise<void> {
    try {
      console.log('Broadcasting inventory update:', data);
      
      // Store in KV for persistence
      const eventKey = `inventory_update_${data.product_id}_${Date.now()}`;
      await env.CACHE.put(eventKey, JSON.stringify({
        type: 'inventory_update',
        data,
        timestamp: new Date().toISOString()
      }));
      
    } catch (error) {
      console.error('Failed to broadcast inventory update:', error);
    }
  }
}
