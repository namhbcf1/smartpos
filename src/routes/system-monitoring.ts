/**
 * SYSTEM MONITORING API ROUTES
 * 
 * Endpoints for system health, metrics, alerts, and performance monitoring.
 */

import { Hono } from 'hono';
import { Env, ApiResponse } from '../types';
import { standardAuthenticate, standardAuthorize } from '../middleware/auth-standardized';
import { MonitoringService } from '../services/MonitoringService';
import { ErrorHandlingService } from '../services/ErrorHandlingService';
import { CachingService } from '../services/CachingService';
import { log } from '../utils/logger';

const app = new Hono<{ Bindings: Env }>();

// Apply authentication to all routes
app.use('*', standardAuthenticate);

// Initialize services
let monitoringService: MonitoringService;
let errorHandlingService: ErrorHandlingService;
let cachingService: CachingService;

// ============================================================================
// HEALTH CHECKS
// ============================================================================

/**
 * System health check
 * GET /api/v1/system/health
 */
app.get('/health',
  standardAuthorize(['admin', 'manager']),
  async (c) => {
    try {
      if (!monitoringService) {
        monitoringService = new MonitoringService(c.env);
      }

      // Perform comprehensive health checks
      const healthChecks = await Promise.allSettled([
        monitoringService.performHealthCheck('database', async () => {
          await c.env.DB.prepare('SELECT 1').first();
          return { status: 'connected' };
        }),
        
        monitoringService.performHealthCheck('cache', async () => {
          if (c.env.CACHE_KV) {
            await c.env.CACHE_KV.get('health_check');
            return { status: 'available' };
          }
          return { status: 'not_configured' };
        }),
        
        monitoringService.performHealthCheck('api', async () => {
          return { 
            status: 'operational',
            timestamp: new Date().toISOString()
          };
        })
      ]);

      const results = healthChecks.map((result, index) => {
        const names = ['database', 'cache', 'api'];
        return {
          name: names[index],
          status: result.status === 'fulfilled' ? result.value.status : 'unhealthy',
          details: result.status === 'fulfilled' ? result.value : { error: 'Health check failed' }
        };
      });

      const overallStatus = results.every(r => r.status === 'healthy') ? 'healthy' : 'degraded';

      return c.json<ApiResponse<any>>({
        success: true,
        data: {
          status: overallStatus,
          timestamp: new Date().toISOString(),
          checks: results,
          uptime: process.uptime ? process.uptime() : 0
        },
        message: `System status: ${overallStatus}`
      });
    } catch (error) {
      log.error('Health check failed', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

/**
 * Detailed health status
 * GET /api/v1/system/health/detailed
 */
app.get('/health/detailed',
  standardAuthorize(['admin']),
  async (c) => {
    try {
      if (!monitoringService) {
        monitoringService = new MonitoringService(c.env);
      }

      const systemMetrics = await monitoringService.getSystemMetrics();
      const healthChecks = monitoringService.getAllHealthChecks();

      return c.json<ApiResponse<any>>({
        success: true,
        data: {
          health_checks: healthChecks,
          system_metrics: systemMetrics,
          timestamp: new Date().toISOString()
        },
        message: 'Detailed health status retrieved'
      });
    } catch (error) {
      log.error('Detailed health check failed', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Detailed health check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

// ============================================================================
// METRICS & MONITORING
// ============================================================================

/**
 * Get system metrics
 * GET /api/v1/system/metrics
 */
app.get('/metrics',
  standardAuthorize(['admin', 'manager']),
  async (c) => {
    try {
      if (!monitoringService) {
        monitoringService = new MonitoringService(c.env);
      }

      const metrics = await monitoringService.getSystemMetrics();

      return c.json<ApiResponse<typeof metrics>>({
        success: true,
        data: metrics,
        message: 'System metrics retrieved successfully'
      });
    } catch (error) {
      log.error('Failed to get system metrics', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Failed to get system metrics',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

/**
 * Record custom metric
 * POST /api/v1/system/metrics
 */
app.post('/metrics',
  standardAuthorize(['admin']),
  async (c) => {
    try {
      if (!monitoringService) {
        monitoringService = new MonitoringService(c.env);
      }

      const { name, type, value, tags, unit } = await c.req.json();

      if (!name || type === undefined || value === undefined) {
        return c.json<ApiResponse<null>>({
          success: false,
          data: null,
          message: 'Missing required fields: name, type, value',
          error: 'MISSING_REQUIRED_FIELDS'
        }, 400);
      }

      monitoringService.recordMetric(name, type, value, tags, unit);

      return c.json<ApiResponse<any>>({
        success: true,
        data: { name, type, value, tags, unit },
        message: 'Metric recorded successfully'
      });
    } catch (error) {
      log.error('Failed to record metric', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Failed to record metric',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

// ============================================================================
// CIRCUIT BREAKER STATUS
// ============================================================================

/**
 * Get circuit breaker status
 * GET /api/v1/system/circuit-breakers
 */
app.get('/circuit-breakers',
  standardAuthorize(['admin']),
  async (c) => {
    try {
      if (!errorHandlingService) {
        errorHandlingService = new ErrorHandlingService(c.env);
      }

      const status = errorHandlingService.getCircuitBreakerStatus();

      return c.json<ApiResponse<typeof status>>({
        success: true,
        data: status,
        message: 'Circuit breaker status retrieved'
      });
    } catch (error) {
      log.error('Failed to get circuit breaker status', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Failed to get circuit breaker status',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

/**
 * Reset circuit breaker
 * POST /api/v1/system/circuit-breakers/:name/reset
 */
app.post('/circuit-breakers/:name/reset',
  standardAuthorize(['admin']),
  async (c) => {
    try {
      if (!errorHandlingService) {
        errorHandlingService = new ErrorHandlingService(c.env);
      }

      const name = c.req.param('name');
      errorHandlingService.resetCircuitBreaker(name);

      return c.json<ApiResponse<any>>({
        success: true,
        data: { name, action: 'reset' },
        message: `Circuit breaker ${name} reset successfully`
      });
    } catch (error) {
      log.error('Failed to reset circuit breaker', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Failed to reset circuit breaker',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Get cache statistics
 * GET /api/v1/system/cache/stats
 */
app.get('/cache/stats',
  standardAuthorize(['admin', 'manager']),
  async (c) => {
    try {
      if (!cachingService) {
        cachingService = new CachingService(c.env);
      }

      const stats = cachingService.getStats();

      return c.json<ApiResponse<typeof stats>>({
        success: true,
        data: stats,
        message: 'Cache statistics retrieved'
      });
    } catch (error) {
      log.error('Failed to get cache stats', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Failed to get cache statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

/**
 * Clear cache
 * DELETE /api/v1/system/cache
 */
app.delete('/cache',
  standardAuthorize(['admin']),
  async (c) => {
    try {
      if (!cachingService) {
        cachingService = new CachingService(c.env);
      }

      await cachingService.clear();

      return c.json<ApiResponse<any>>({
        success: true,
        data: { action: 'cleared' },
        message: 'Cache cleared successfully'
      });
    } catch (error) {
      log.error('Failed to clear cache', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Failed to clear cache',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

/**
 * Invalidate cache by pattern
 * POST /api/v1/system/cache/invalidate
 */
app.post('/cache/invalidate',
  standardAuthorize(['admin']),
  async (c) => {
    try {
      if (!cachingService) {
        cachingService = new CachingService(c.env);
      }

      const { pattern, tags } = await c.req.json();

      if (pattern) {
        await cachingService.invalidatePattern(pattern);
      } else if (tags) {
        await cachingService.invalidateByTags(tags);
      } else {
        return c.json<ApiResponse<null>>({
          success: false,
          data: null,
          message: 'Either pattern or tags must be provided',
          error: 'MISSING_INVALIDATION_CRITERIA'
        }, 400);
      }

      return c.json<ApiResponse<any>>({
        success: true,
        data: { pattern, tags },
        message: 'Cache invalidated successfully'
      });
    } catch (error) {
      log.error('Failed to invalidate cache', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Failed to invalidate cache',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Get performance baselines
 * GET /api/v1/system/performance/baselines
 */
app.get('/performance/baselines',
  standardAuthorize(['admin']),
  async (c) => {
    try {
      // In a real implementation, this would fetch from monitoring service
      const baselines = {
        api_response_time: { baseline: 200, tolerance: 20, unit: 'ms' },
        database_query_time: { baseline: 50, tolerance: 30, unit: 'ms' },
        cache_hit_rate: { baseline: 85, tolerance: 10, unit: '%' },
        error_rate: { baseline: 1, tolerance: 50, unit: '%' }
      };

      return c.json<ApiResponse<typeof baselines>>({
        success: true,
        data: baselines,
        message: 'Performance baselines retrieved'
      });
    } catch (error) {
      log.error('Failed to get performance baselines', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Failed to get performance baselines',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

/**
 * Test system performance
 * POST /api/v1/system/performance/test
 */
app.post('/performance/test',
  standardAuthorize(['admin']),
  async (c) => {
    try {
      if (!monitoringService) {
        monitoringService = new MonitoringService(c.env);
      }

      const startTime = Date.now();

      // Test database performance
      const dbTest = await monitoringService.timeOperation('performance_test.database', async () => {
        return await c.env.DB.prepare('SELECT COUNT(*) as count FROM products').first();
      });

      // Test API performance
      const apiTest = await monitoringService.timeOperation('performance_test.api', async () => {
        return { status: 'ok', timestamp: new Date().toISOString() };
      });

      const totalTime = Date.now() - startTime;

      return c.json<ApiResponse<any>>({
        success: true,
        data: {
          total_time: totalTime,
          database_test: dbTest,
          api_test: apiTest,
          timestamp: new Date().toISOString()
        },
        message: 'Performance test completed'
      });
    } catch (error) {
      log.error('Performance test failed', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Performance test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

export default app;
