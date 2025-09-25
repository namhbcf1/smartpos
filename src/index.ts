import { Hono } from 'hono';
import { corsMiddleware, accessLogger, validateEnvironment } from './middleware/security';
import { errorHandler } from './middleware/errorHandler';
import { RateLimits } from './middleware/rateLimiting-unified';
import { authenticate } from './middleware/auth';
import { Env } from './types';
import { checkAndRunMigrations } from './db/migrations';

// Import Durable Objects
import { NotificationObject } from './durable_objects/NotificationObject';
import { InventorySyncObject } from './durable_objects/InventorySyncObject';
import { POSSyncObject } from './durable_objects/POSSyncObject';
import { WarrantySyncObject } from './durable_objects/WarrantySyncObject';
import { InventoryState } from './durable_objects/InventoryState';
import { SessionManager } from './durable_objects/SessionManager';
import { NotificationBroadcaster } from './services/NotificationBroadcaster';

// Import consolidated routes
import routes from './routes';

const app = new Hono<{ Bindings: Env }>();

// ===== MIDDLEWARE SETUP =====
// Error handling middleware (must be first)
app.use('*', errorHandler);

// CORS middleware
app.use('*', corsMiddleware);

// Security middleware
app.use('*', accessLogger);
app.use('*', validateEnvironment);

// Rate limiting
app.use('/api/auth/*', RateLimits.auth);
app.use('/api/*', RateLimits.api);

// ===== DATABASE INITIALIZATION =====
// Temporarily disable migrations for testing
// app.use('*', async (c, next) => {
//   try {
//     await checkAndRunMigrations(c.env);
//   } catch (error) {
//     console.error('Migration check failed:', error);
//   }
//   await next();
// });

// ===== ROUTE MOUNTING =====
// Mount main API routes (non-versioned)
app.route('/api', routes.api);

// Mount system routes (non-versioned)
app.route('/api/health', routes.system.health);
app.route('/api/openapi', routes.system.openapi);
app.route('/api/diagnostics', routes.system.diagnostics);

// Mount feature routes under /api
app.route('/api/alerts', routes.alerts);
app.route('/api/financial', routes.financial);
app.route('/api/payments', routes.payments);
app.route('/api/shipping', routes.shipping);
app.route('/api/suppliers', routes.suppliers);
// Alias for enhanced suppliers used by frontend
app.route('/api/suppliers-enhanced/suppliers', routes.suppliers);
app.route('/api/users', routes.users);
app.route('/api/returns', routes.returns);

// ===== ROOT ENDPOINTS =====
app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'SmartPOS API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      api: '/api',
      health: '/api/health',
      documentation: '/api/openapi'
    }
  });
});

// Realtime placeholder endpoint for WS gateway
app.get('/realtime', (c) => {
  return c.json({ success: false, error: 'WEBSOCKET_NOT_IMPLEMENTED', message: 'Realtime WS gateway not enabled on this worker.' }, 501);
});

// Real health check that tests actual resources
app.get('/health', async (c: any) => {
  try {
    const checks = [];

    // Test D1 Database
    const dbStart = Date.now();
    await c.env.DB.prepare('SELECT 1 as test').first();
    const dbLatency = Date.now() - dbStart;
    checks.push({
      service: 'D1 Database',
      status: dbLatency < 5000 ? 'ok' : 'degraded',
      latency_ms: dbLatency
    });

    // Test KV if available
    if (c.env.KV || c.env.KV_CACHE) {
      const kvStart = Date.now();
      const testKey = `health_${Date.now()}`;
      const kv = c.env.KV || c.env.KV_CACHE;
      await kv.put(testKey, 'test', { expirationTtl: 60 });
      const kvValue = await kv.get(testKey);
      await kv.delete(testKey);
      const kvLatency = Date.now() - kvStart;

      checks.push({
        service: 'KV Storage',
        status: kvValue === 'test' && kvLatency < 3000 ? 'ok' : 'degraded',
        latency_ms: kvLatency
      });
    }

    const allOk = checks.every(c => c.status === 'ok');
    const hasDegrade = checks.some(c => c.status === 'degraded');

    return c.json({
      success: allOk,
      status: allOk ? 'healthy' : (hasDegrade ? 'degraded' : 'unhealthy'),
      timestamp: new Date().toISOString(),
      services: checks,
      summary: {
        total: checks.length,
        healthy: checks.filter(c => c.status === 'ok').length,
        degraded: checks.filter(c => c.status === 'degraded').length
      }
    }, allOk ? 200 : 503);
  } catch (error) {
    return c.json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 503);
  }
});

// ===== 404 HANDLER =====
app.notFound((c) => {
  return c.json({
    success: false,
    message: 'Endpoint not found',
    suggestion: 'Check /api for available endpoints'
  }, 404);
});

// Export Durable Objects
export {
  NotificationObject,
  InventorySyncObject,
  POSSyncObject,
  WarrantySyncObject,
  InventoryState,
  SessionManager,
  NotificationBroadcaster
};

export default app;