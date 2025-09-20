import { Hono } from 'hono';
import { corsMiddleware, accessLogger, validateEnvironment } from './middleware/security';
import { errorHandler } from './middleware/errorHandler';
import { apiRateLimit, authRateLimit } from './middleware/rateLimit';
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
app.use('/api/auth/*', authRateLimit);
app.use('/api/*', apiRateLimit);

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
// Mount main API routes
app.route('/api/v1', routes.api);

// Mount system routes
app.route('/api/v1/health', routes.system.health);
app.route('/api/v1/openapi', routes.system.openapi);
app.route('/api/v1/diagnostics', routes.system.diagnostics);

// Mount feature routes
app.route('/api/v1/alerts', routes.alerts);
app.route('/api/v1/financial', routes.financial);
app.route('/api/v1/payments', routes.payments);
app.route('/api/v1/shipping', routes.shipping);
app.route('/api/v1/suppliers', routes.suppliers);
app.route('/api/v1/users', routes.users);
app.route('/api/v1/returns', routes.returns);

// ===== ROOT ENDPOINTS =====
app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'SmartPOS API v1.0',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      api: '/api/v1',
      health: '/api/v1/health',
      documentation: '/api/v1/openapi'
    }
  });
});

app.get('/health', (c) => {
  return c.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// ===== 404 HANDLER =====
app.notFound((c) => {
  return c.json({
    success: false,
    message: 'Endpoint not found',
    suggestion: 'Check /api/v1 for available endpoints'
  }, 404);
});

// Export Durable Objects
export {
  NotificationObject,
  InventorySyncObject,
  POSSyncObject,
  WarrantySyncObject,
  InventoryState,
  SessionManager
};

export default app;