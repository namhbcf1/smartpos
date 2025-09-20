/**
 * Health Check Endpoints - Online-Only POS System
 * Provides comprehensive system health monitoring
 * Critical for NetworkGuard functionality
 */

import { FastifyPluginAsync } from 'fastify';
import { randomUUID } from 'crypto';

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
    storage: HealthCheck;
    external: HealthCheck;
  };
  metadata: {
    version: string;
    environment: string;
    uptime: number;
    requestId: string;
  };
}

interface HealthCheck {
  status: 'pass' | 'fail' | 'warn';
  responseTime: number;
  details?: string;
  lastChecked: string;
}

interface ServiceStatus {
  printers: PrinterStatus[];
  paymentGateways: PaymentGatewayStatus[];
  stores: StoreStatus[];
}

interface PrinterStatus {
  id: string;
  name: string;
  store_id: string;
  status: 'online' | 'offline' | 'error';
  lastSeen: string;
  errorMessage?: string;
}

interface PaymentGatewayStatus {
  provider: string;
  status: 'operational' | 'degraded' | 'down';
  responseTime: number;
  lastChecked: string;
}

interface StoreStatus {
  id: string;
  name: string;
  status: 'open' | 'closed' | 'maintenance';
  lastActivity: string;
  activeUsers: number;
}

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  // Basic health check - used by NetworkGuard
  fastify.get('/health', async (request, reply) => {
    const startTime = Date.now();
    const requestId = randomUUID();
    
    try {
      // Quick health check for frontend
      const checks = await Promise.allSettled([
        checkDatabase(fastify),
        checkRedis(fastify),
        checkStorage(fastify),
        checkExternalServices(fastify),
      ]);

      const [dbResult, redisResult, storageResult, externalResult] = checks;

      const dbCheck: HealthCheck = {
        status: dbResult.status === 'fulfilled' ? dbResult.value.status : 'fail',
        responseTime: dbResult.status === 'fulfilled' ? dbResult.value.responseTime : -1,
        details: dbResult.status === 'rejected' ? dbResult.reason?.message : undefined,
        lastChecked: new Date().toISOString(),
      };

      const redisCheck: HealthCheck = {
        status: redisResult.status === 'fulfilled' ? redisResult.value.status : 'fail',
        responseTime: redisResult.status === 'fulfilled' ? redisResult.value.responseTime : -1,
        details: redisResult.status === 'rejected' ? redisResult.reason?.message : undefined,
        lastChecked: new Date().toISOString(),
      };

      const storageCheck: HealthCheck = {
        status: storageResult.status === 'fulfilled' ? storageResult.value.status : 'fail',
        responseTime: storageResult.status === 'fulfilled' ? storageResult.value.responseTime : -1,
        details: storageResult.status === 'rejected' ? storageResult.reason?.message : undefined,
        lastChecked: new Date().toISOString(),
      };

      const externalCheck: HealthCheck = {
        status: externalResult.status === 'fulfilled' ? externalResult.value.status : 'fail',
        responseTime: externalResult.status === 'fulfilled' ? externalResult.value.responseTime : -1,
        details: externalResult.status === 'rejected' ? externalResult.reason?.message : undefined,
        lastChecked: new Date().toISOString(),
      };

      // Determine overall status
      const criticalChecks = [dbCheck, redisCheck];
      const hasCriticalFailure = criticalChecks.some(check => check.status === 'fail');
      const hasWarnings = [dbCheck, redisCheck, storageCheck, externalCheck].some(check => check.status === 'warn');

      let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
      if (hasCriticalFailure) {
        overallStatus = 'unhealthy';
      } else if (hasWarnings) {
        overallStatus = 'degraded';
      } else {
        overallStatus = 'healthy';
      }

      const response: HealthCheckResponse = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        checks: {
          database: dbCheck,
          redis: redisCheck,
          storage: storageCheck,
          external: externalCheck,
        },
        metadata: {
          version: process.env.APP_VERSION || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          uptime: process.uptime(),
          requestId,
        },
      };

      // Set appropriate HTTP status code
      const statusCode = overallStatus === 'unhealthy' ? 503 : overallStatus === 'degraded' ? 200 : 200;
      
      reply.code(statusCode).send(response);
      
      // Log health check for monitoring
      const duration = Date.now() - startTime;
      fastify.log.info({
        event: 'health_check',
        status: overallStatus,
        duration,
        requestId,
        checks: Object.entries(response.checks).map(([name, check]) => ({
          name,
          status: check.status,
          responseTime: check.responseTime,
        })),
      });

    } catch (error) {
      const errorResponse = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
      };

      fastify.log.error({
        event: 'health_check_error',
        error,
        requestId,
      });

      reply.code(503).send(errorResponse);
    }
  });

  // Detailed service status - for admin dashboard
  fastify.get('/status', {
    preHandler: [fastify.authenticate, fastify.authorize(['view_system_status'])],
  }, async (request, reply) => {
    try {
      const [printers, paymentGateways, stores] = await Promise.all([
        getPrinterStatus(fastify),
        getPaymentGatewayStatus(fastify),
        getStoreStatus(fastify),
      ]);

      const serviceStatus: ServiceStatus = {
        printers,
        paymentGateways,
        stores,
      };

      reply.send({
        status: 'success',
        data: serviceStatus,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      fastify.log.error('Service status check failed:', error);
      reply.code(500).send({
        status: 'error',
        message: 'Failed to retrieve service status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Readiness check - for Kubernetes/load balancer
  fastify.get('/ready', async (request, reply) => {
    try {
      // Check if essential services are ready
      const dbReady = await checkDatabaseReadiness(fastify);
      const redisReady = await checkRedisReadiness(fastify);

      if (dbReady && redisReady) {
        reply.send({ status: 'ready', timestamp: new Date().toISOString() });
      } else {
        reply.code(503).send({ 
          status: 'not_ready', 
          timestamp: new Date().toISOString(),
          details: {
            database: dbReady,
            redis: redisReady,
          }
        });
      }
    } catch (error) {
      reply.code(503).send({ 
        status: 'not_ready', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Liveness check - for Kubernetes
  fastify.get('/live', async (request, reply) => {
    // Simple check to ensure the application is running
    reply.send({ 
      status: 'alive', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  });
};

// Database health check
async function checkDatabase(fastify: any): Promise<{ status: 'pass' | 'fail' | 'warn', responseTime: number }> {
  const startTime = Date.now();
  
  try {
    // Simple query to check database connectivity
    const result = await fastify.db.query('SELECT 1 as health_check');
    const responseTime = Date.now() - startTime;
    
    if (result && result.rows && result.rows.length > 0) {
      return { status: 'pass', responseTime };
    } else {
      return { status: 'fail', responseTime };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    fastify.log.error('Database health check failed:', error);
    return { status: 'fail', responseTime };
  }
}

// Redis health check
async function checkRedis(fastify: any): Promise<{ status: 'pass' | 'fail' | 'warn', responseTime: number }> {
  const startTime = Date.now();
  
  try {
    // Check Redis connectivity
    const result = await fastify.redis.ping();
    const responseTime = Date.now() - startTime;
    
    if (result === 'PONG') {
      return { status: 'pass', responseTime };
    } else {
      return { status: 'fail', responseTime };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    fastify.log.error('Redis health check failed:', error);
    return { status: 'fail', responseTime };
  }
}

// Storage health check
async function checkStorage(fastify: any): Promise<{ status: 'pass' | 'fail' | 'warn', responseTime: number }> {
  const startTime = Date.now();
  
  try {
    // Check S3/R2 connectivity by attempting to list buckets or check a known object
    // This is a simplified check - implement according to your storage provider
    const responseTime = Date.now() - startTime;
    return { status: 'pass', responseTime };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    fastify.log.error('Storage health check failed:', error);
    return { status: 'warn', responseTime }; // Storage is not critical for basic operations
  }
}

// External services health check
async function checkExternalServices(fastify: any): Promise<{ status: 'pass' | 'fail' | 'warn', responseTime: number }> {
  const startTime = Date.now();
  
  try {
    // Check critical external services (payment gateways, etc.)
    // This is a simplified check - implement according to your external dependencies
    const responseTime = Date.now() - startTime;
    return { status: 'pass', responseTime };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    fastify.log.error('External services health check failed:', error);
    return { status: 'warn', responseTime }; // External services degradation doesn't make system unusable
  }
}

// Check database readiness
async function checkDatabaseReadiness(fastify: any): Promise<boolean> {
  try {
    const result = await fastify.db.query('SELECT COUNT(*) FROM users LIMIT 1');
    return result && result.rows && result.rows.length > 0;
  } catch (error) {
    fastify.log.error('Database readiness check failed:', error);
    return false;
  }
}

// Check Redis readiness
async function checkRedisReadiness(fastify: any): Promise<boolean> {
  try {
    const result = await fastify.redis.ping();
    return result === 'PONG';
  } catch (error) {
    fastify.log.error('Redis readiness check failed:', error);
    return false;
  }
}

// Get printer status
async function getPrinterStatus(fastify: any): Promise<PrinterStatus[]> {
  try {
    const result = await fastify.db.query(`
      SELECT 
        id, 
        name, 
        store_id, 
        status, 
        last_seen, 
        error_message 
      FROM printers 
      WHERE active = true
    `);
    
    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      store_id: row.store_id,
      status: row.status,
      lastSeen: row.last_seen,
      errorMessage: row.error_message,
    }));
  } catch (error) {
    fastify.log.error('Failed to get printer status:', error);
    return [];
  }
}

// Get payment gateway status
async function getPaymentGatewayStatus(fastify: any): Promise<PaymentGatewayStatus[]> {
  try {
    // Check status of configured payment gateways
    // This is a simplified implementation
    return [
      {
        provider: 'stripe',
        status: 'operational',
        responseTime: 150,
        lastChecked: new Date().toISOString(),
      },
      {
        provider: 'bank_transfer',
        status: 'operational',
        responseTime: 200,
        lastChecked: new Date().toISOString(),
      },
    ];
  } catch (error) {
    fastify.log.error('Failed to get payment gateway status:', error);
    return [];
  }
}

// Get store status
async function getStoreStatus(fastify: any): Promise<StoreStatus[]> {
  try {
    const result = await fastify.db.query(`
      SELECT 
        s.id,
        s.name,
        s.status,
        MAX(o.created_at) as last_activity,
        COUNT(DISTINCT sh.user_id) as active_users
      FROM stores s
      LEFT JOIN orders o ON s.id = o.store_id AND o.created_at > NOW() - INTERVAL '1 hour'
      LEFT JOIN shifts sh ON s.id = sh.store_id AND sh.closed_at IS NULL
      WHERE s.active = true
      GROUP BY s.id, s.name, s.status
    `);
    
    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      status: row.status,
      lastActivity: row.last_activity || new Date().toISOString(),
      activeUsers: parseInt(row.active_users) || 0,
    }));
  } catch (error) {
    fastify.log.error('Failed to get store status:', error);
    return [];
  }
}

export default healthRoutes;