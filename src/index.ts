import { Hono } from 'hono';
import { corsMiddleware, accessLogger, validateEnvironment } from './middleware/security';
import { errorHandler } from './middleware/errorHandler';
import { RateLimits } from './middleware/rateLimiting-unified';
import { authenticate } from './middleware/auth';
import { Env } from './types';
import { checkAndRunMigrations } from './db/migrations';
import type { ExportedHandlerScheduledHandler } from '@cloudflare/workers-types';

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

// Force tenant context to 'default' for all requests
app.use('*', async (c, next) => {
  try {
    (c as any).set && (c as any).set('tenantId', 'default');
  } catch {}
  await next();
});

// Security middleware - DISABLED for speed
// app.use('*', accessLogger);
// app.use('*', validateEnvironment);

// Rate limiting - DISABLED for speed (enable in production if needed)
// app.use('/api/auth/*', RateLimits.auth);
// app.use('/api/*', RateLimits.api);

// ===== DATABASE INITIALIZATION =====
// Run migrations at startup instead of on every request
let migrationsInitialized = false;
let migrationPromise: Promise<void> | null = null;

// Initialize migrations immediately on first request (non-blocking)
// Disabled by default in production unless explicitly enabled via ENABLE_MIGRATIONS="true"
app.use('*', async (c, next) => {
  const isProduction = (c.env.ENVIRONMENT || c.env.NODE_ENV) === 'production';
  const explicitlyEnabled = c.env.ENABLE_MIGRATIONS === 'true';
  const shouldRunMigrations = !isProduction || explicitlyEnabled;

  if (shouldRunMigrations && !migrationsInitialized && !migrationPromise) {
    migrationPromise = checkAndRunMigrations(c.env)
      .then(() => {
        migrationsInitialized = true;
        console.log('✅ Migrations initialized');
      })
      .catch((error) => {
        console.error('❌ Migration check failed:', error);
      });
  }
  await next();
});

// ===== ROUTE MOUNTING =====
// Mount main API routes aggregator only once to avoid conflicts
app.route('/api', routes.api);

// Mount system routes (these are already included in routes.api)
// app.route('/api/health', routes.system.health);
// app.route('/api/openapi', routes.system.openapi);
// app.route('/api/diagnostics', routes.system.diagnostics);

// ===== ROOT ENDPOINTS =====
app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'Truong Phat PC API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      api: '/api',
      health: '/api/health',
      documentation: '/api/openapi'
    }
  });
});

// Realtime WebSocket gateway
app.route('/realtime', routes.realtime);

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

// ===== CRON HANDLER =====
// Scheduled handler for auto-releasing expired serial reservations and data integrity checks
import { checkDataIntegrity } from './routes/cron/data-integrity';
import { NotificationService } from './services/notifications';

export const scheduled: ExportedHandlerScheduledHandler<Env> = async (event, env, ctx) => {
  try {
    console.log('Running scheduled jobs...');
    const notificationService = new NotificationService(env);

    // 1. Release expired serial reservations
    console.log('[CRON] Releasing expired serial reservations...');
    const now = new Date().toISOString();
    const expiredResult = await env.DB.prepare(`
      SELECT id, serial_number, reserved_by FROM serial_numbers
      WHERE reserved_until IS NOT NULL
        AND reserved_until < ?
        AND COALESCE(tenant_id, 'default') = 'default'
    `).bind(now).all();

    const expired = expiredResult.results || [];

    if (expired.length > 0) {
      await env.DB.prepare(`
        UPDATE serial_numbers
        SET reserved_at = NULL,
            reserved_by = NULL,
            reserved_until = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE reserved_until IS NOT NULL
          AND reserved_until < ?
          AND COALESCE(tenant_id, 'default') = 'default'
      `).bind(now).run();

      console.log(`[CRON] Released ${expired.length} expired serial reservations`);

      // Send notification
      await notificationService.sendExpiredReservationAlert(expired.length);
    }

    // 2. Run data integrity checks (every execution)
    console.log('[CRON] Running data integrity checks...');
    const integrityResult = await checkDataIntegrity(env);

    if (integrityResult.success) {
      console.log(`[CRON] Data integrity check completed:`);
      console.log(`  - Total checks: ${integrityResult.summary.total_checks}`);
      console.log(`  - Issues found: ${integrityResult.summary.issues_found}`);
      console.log(`  - Critical issues: ${integrityResult.summary.critical_issues}`);
      console.log(`  - Auto-fixed: ${integrityResult.summary.auto_fixed}`);

      if (integrityResult.summary.critical_issues > 0) {
        console.error('[CRON] ⚠️ CRITICAL DATA INTEGRITY ISSUES FOUND!');
        const criticalIssues = integrityResult.issues.filter(i => i.severity === 'critical');

        criticalIssues.forEach(issue => {
          console.error(`  - ${issue.type}: ${issue.description} (count: ${issue.count}, auto-fixed: ${issue.auto_fixed || false})`);
        });

        // Send critical alert
        await notificationService.sendDataIntegrityAlert(criticalIssues);
      }
    } else {
      console.error('[CRON] Data integrity check failed:', integrityResult.issues);

      // Send failure alert
      await notificationService.sendToAdmins({
        type: 'critical',
        title: 'Data Integrity Check Failed',
        message: 'The scheduled data integrity check encountered an error.',
        data: integrityResult.issues
      });
    }

    console.log('[CRON] All scheduled jobs completed');
  } catch (error) {
    console.error('[CRON] Scheduled job error:', error);
  }
};

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