import { Hono } from 'hono';
import { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

// WebSocket connection handler using Durable Objects
app.get('/', async (c) => {
  try {
    const upgradeHeader = c.req.header('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return c.json({
        success: false,
        message: 'WebSocket upgrade required',
        error: 'WEBSOCKET_UPGRADE_REQUIRED'
      }, 426);
    }

    // Get Durable Object for notifications
    const id = c.env.NOTIFICATIONS.idFromName('global');
    const notificationObject = c.env.NOTIFICATIONS.get(id);

    // Forward the request to the Durable Object
    const url = new URL(c.req.url);
    url.pathname = '/connect';

    const response = await notificationObject.fetch(url.toString(), {
      headers: c.req.raw.headers,
    });

    return response;
  } catch (error) {
    console.error('❌ WebSocket connection error:', error);
    return c.json({
      success: false,
      message: 'Failed to establish WebSocket connection',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Health check for WebSocket service
app.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'WebSocket service is running',
    timestamp: new Date().toISOString(),
    service: 'realtime-notifications'
  });
});

// Test route to verify websocket router is working
app.get('/test', (c) => {
  return c.json({
    success: true,
    message: 'WebSocket router is working',
    timestamp: new Date().toISOString()
  });
});

// Real-time event broadcasting functions
export class RealtimeEventBroadcaster {
  static async broadcastProductUpdate(env: Env, productId: number, productData: any) {
    try {
      const id = env.NOTIFICATIONS.idFromName('global');
      const notificationObject = env.NOTIFICATIONS.get(id);

      await notificationObject.fetch('http://internal/broadcast', { // Internal Durable Object communication
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'product_updated',
          data: { productId, ...productData },
          timestamp: Date.now()
        })
      });

      console.log(`📡 Broadcasted product update for product ${productId}`);
    } catch (error) {
      console.error('❌ Error broadcasting product update:', error);
    }
  }

  static async broadcastInventoryUpdate(env: Env, inventoryData: any) {
    try {
      const id = env.NOTIFICATIONS.idFromName('global');
      const notificationObject = env.NOTIFICATIONS.get(id);

      await notificationObject.fetch('http://internal/broadcast', { // Internal Durable Object communication
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'inventory_updated',
          data: inventoryData,
          timestamp: Date.now()
        })
      });

      console.log('📦 Broadcasted inventory update');
    } catch (error) {
      console.error('❌ Error broadcasting inventory update:', error);
    }
  }

  static async broadcastSaleUpdate(env: Env, saleData: any) {
    try {
      const id = env.NOTIFICATIONS.idFromName('global');
      const notificationObject = env.NOTIFICATIONS.get(id);

      await notificationObject.fetch('http://internal/broadcast', { // Internal Durable Object communication
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sale_completed',
          data: saleData,
          timestamp: Date.now()
        })
      });

      console.log('💰 Broadcasted sale update');
    } catch (error) {
      console.error('❌ Error broadcasting sale update:', error);
    }
  }

  static async broadcastStockAlert(env: Env, alertData: any) {
    try {
      const id = env.NOTIFICATIONS.idFromName('global');
      const notificationObject = env.NOTIFICATIONS.get(id);

      await notificationObject.fetch('http://internal/broadcast', { // Internal Durable Object communication
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'stock_alert',
          data: alertData,
          timestamp: Date.now()
        })
      });

      console.log('⚠️ Broadcasted stock alert');
    } catch (error) {
      console.error('❌ Error broadcasting stock alert:', error);
    }
  }

  static async broadcastSerialNumberUpdate(env: Env, serialData: any) {
    try {
      const id = env.NOTIFICATIONS.idFromName('global');
      const notificationObject = env.NOTIFICATIONS.get(id);

      await notificationObject.fetch('http://internal/broadcast', { // Internal Durable Object communication
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'serial_number_updated',
          data: serialData,
          timestamp: Date.now()
        })
      });

      console.log('🔢 Broadcasted serial number update');
    } catch (error) {
      console.error('❌ Error broadcasting serial number update:', error);
    }
  }
}

export default app;
