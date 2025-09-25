/**
 * Real Health Check API - Tests actual connectivity to D1/KV/R2
 *
 * This endpoint performs actual checks against CloudFlare services
 * to verify system health and availability.
 */

import { Hono } from 'hono';
import { Env } from '../../types';

const app = new Hono<{ Bindings: Env }>();

interface HealthCheckResult {
  service: string;
  status: 'ok' | 'degraded' | 'fail';
  latency_ms?: number;
  error?: string;
  details?: any;
}

interface HealthResponse {
  success: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: HealthCheckResult[];
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    failed: number;
  };
}

// GET /api/health - Comprehensive health check
app.get('/', async (c: any) => {
  const startTime = Date.now();
  const checks: HealthCheckResult[] = [];

  // D1 Database Health Check
  const d1Check = await checkD1Health(c.env.DB);
  checks.push(d1Check);

  // KV Storage Health Check (if available)
  if (c.env.KV) {
    const kvCheck = await checkKVHealth(c.env.KV);
    checks.push(kvCheck);
  }

  // R2 Storage Health Check (if available)
  if (c.env.R2) {
    const r2Check = await checkR2Health(c.env.R2);
    checks.push(r2Check);
  }

  // Calculate overall status
  const summary = {
    total: checks.length,
    healthy: checks.filter(c => c.status === 'ok').length,
    degraded: checks.filter(c => c.status === 'degraded').length,
    failed: checks.filter(c => c.status === 'fail').length,
  };

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  if (summary.failed > 0) {
    overallStatus = 'unhealthy';
  } else if (summary.degraded > 0) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'healthy';
  }

  const response: HealthResponse = {
    success: overallStatus !== 'unhealthy',
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: checks,
    summary,
  };

  const statusCode = overallStatus === 'unhealthy' ? 503 : 200;

  return c.json(response, statusCode);
});

// GET /api/health/db - Database-specific health check
app.get('/db', async (c: any) => {
  const result = await checkD1Health(c.env.DB);

  return c.json({
    success: result.status === 'ok',
    ...result,
    timestamp: new Date().toISOString(),
  }, result.status === 'fail' ? 503 : 200);
});

// GET /api/health/quick - Quick health check (minimal)
app.get('/quick', async (c: any) => {
  try {
    // Just check if we can connect to D1
    const start = Date.now();
    await c.env.DB.prepare('SELECT 1 as test').first();
    const latency = Date.now() - start;

    return c.json({
      success: true,
      status: 'healthy',
      latency_ms: latency,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json({
      success: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, 503);
  }
});

/**
 * Check D1 Database Health
 */
async function checkD1Health(db: any): Promise<HealthCheckResult> {
  const start = Date.now();

  try {
    // Test basic connectivity
    const testResult = await db.prepare('SELECT 1 as test').first();

    if (!testResult || testResult.test !== 1) {
      return {
        service: 'D1 Database',
        status: 'fail',
        latency_ms: Date.now() - start,
        error: 'Query returned unexpected result',
      };
    }

    // Test table existence (critical tables)
    const tableChecks = await Promise.allSettled([
      db.prepare('SELECT COUNT(*) as count FROM users LIMIT 1').first(),
      db.prepare('SELECT COUNT(*) as count FROM products LIMIT 1').first(),
      db.prepare('SELECT COUNT(*) as count FROM orders LIMIT 1').first(),
    ]);

    const failedTables = tableChecks.filter(result => result.status === 'rejected').length;
    const latency = Date.now() - start;

    if (failedTables > 0) {
      return {
        service: 'D1 Database',
        status: 'degraded',
        latency_ms: latency,
        error: `${failedTables} critical tables missing or inaccessible`,
        details: {
          missing_tables: failedTables,
          total_checked: tableChecks.length,
        },
      };
    }

    // Check if latency is acceptable
    const status = latency > 5000 ? 'degraded' : 'ok';

    return {
      service: 'D1 Database',
      status,
      latency_ms: latency,
      details: {
        tables_accessible: tableChecks.length,
        query_successful: true,
      },
    };

  } catch (error) {
    return {
      service: 'D1 Database',
      status: 'fail',
      latency_ms: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check KV Storage Health
 */
async function checkKVHealth(kv: any): Promise<HealthCheckResult> {
  const start = Date.now();

  try {
    const testKey = `health_check_${Date.now()}`;
    const testValue = 'test';

    // Test write
    await kv.put(testKey, testValue, { expirationTtl: 60 });

    // Test read
    const readValue = await kv.get(testKey);

    // Cleanup
    await kv.delete(testKey);

    const latency = Date.now() - start;

    if (readValue !== testValue) {
      return {
        service: 'KV Storage',
        status: 'fail',
        latency_ms: latency,
        error: 'Write/read test failed',
      };
    }

    const status = latency > 3000 ? 'degraded' : 'ok';

    return {
      service: 'KV Storage',
      status,
      latency_ms: latency,
      details: {
        write_read_test: 'passed',
      },
    };

  } catch (error) {
    return {
      service: 'KV Storage',
      status: 'fail',
      latency_ms: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check R2 Storage Health
 */
async function checkR2Health(r2: any): Promise<HealthCheckResult> {
  const start = Date.now();

  try {
    // Test bucket accessibility by listing (limited)
    const listResult = await r2.list({ limit: 1 });

    const latency = Date.now() - start;

    if (!listResult) {
      return {
        service: 'R2 Storage',
        status: 'fail',
        latency_ms: latency,
        error: 'Unable to list bucket contents',
      };
    }

    const status = latency > 5000 ? 'degraded' : 'ok';

    return {
      service: 'R2 Storage',
      status,
      latency_ms: latency,
      details: {
        bucket_accessible: true,
        object_count: listResult.objects?.length || 0,
      },
    };

  } catch (error) {
    return {
      service: 'R2 Storage',
      status: 'fail',
      latency_ms: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default app;