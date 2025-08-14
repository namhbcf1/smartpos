/**
 * Simple SmartPOS API - Minimal version for testing WebSocket
 */

import { Hono } from 'hono';
import { NotificationObject } from './durable_objects/NotificationObject';
import { InventorySyncObject } from './durable_objects/InventorySyncObject';
import { POSSyncObject } from './durable_objects/POSSyncObject';
import { WarrantySyncObject } from './durable_objects/WarrantySyncObject';

// Environment interface
interface Env {
  NOTIFICATIONS: DurableObjectNamespace;
  INVENTORY_SYNC: DurableObjectNamespace;
  POS_SYNC: DurableObjectNamespace;
  WARRANTY_SYNC: DurableObjectNamespace;
  DB: D1Database;
  CACHE: KVNamespace;
  SESSIONS: KVNamespace;
  SMARTPOS_DATA: KVNamespace;
  JWT_SECRET?: string;
  ENVIRONMENT?: string;
}

const app = new Hono<{ Bindings: Env }>();

// Root route
app.get('/', (c) => c.text('SmartPOS API - SIMPLE VERSION WORKING - v2'));

// Test route
app.get('/test', (c) => {
  return c.json({
    success: true,
    message: 'Simple test route working',
    timestamp: new Date().toISOString()
  });
});

// WebSocket health check
app.get('/ws/health', (c) => {
  return c.json({
    success: true,
    message: 'WebSocket service is running',
    timestamp: new Date().toISOString(),
    service: 'realtime-notifications'
  });
});

// WebSocket endpoint
app.get('/ws', async (c) => {
  const upgradeHeader = c.req.header('Upgrade');
  
  if (upgradeHeader !== 'websocket') {
    return c.json({
      success: false,
      message: 'Expected WebSocket upgrade request',
      received_headers: {
        upgrade: upgradeHeader,
        connection: c.req.header('Connection')
      }
    }, 400);
  }

  try {
    console.log('🔗 WebSocket upgrade request received');
    
    // Get or create Durable Object instance for notifications
    const id = c.env.NOTIFICATIONS.idFromName('global-notifications');
    const obj = c.env.NOTIFICATIONS.get(id);
    
    console.log('📡 Forwarding WebSocket request to Durable Object');
    
    // Create a new request with the /connect path
    const connectUrl = new URL(c.req.url);
    connectUrl.pathname = '/connect';
    
    const connectRequest = new Request(connectUrl.toString(), {
      method: 'GET',
      headers: c.req.raw.headers,
    });
    
    // Forward the WebSocket upgrade request to the Durable Object
    return obj.fetch(connectRequest);
  } catch (error) {
    console.error('❌ WebSocket connection error:', error);
    return c.json({
      success: false,
      message: 'Failed to establish WebSocket connection',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Dashboard stats endpoint
app.get('/api/v1/dashboard/stats', async (c) => {
  try {
    return c.json({
      success: true,
      data: {
        todaySales: 0,
        todayRevenue: 0,
        totalCustomers: 6,
        totalProducts: 8,
        lowStockProducts: 0,
        pendingOrders: 0,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Health check
app.get('/api/v1/health', (c) => {
  return c.json({
    success: true,
    message: 'SmartPOS API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default app;
export { NotificationObject, InventorySyncObject, POSSyncObject, WarrantySyncObject };
