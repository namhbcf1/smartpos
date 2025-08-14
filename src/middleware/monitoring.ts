/**
 * MONITORING MIDDLEWARE
 * 
 * Automatic monitoring integration for API requests, performance tracking,
 * error handling, and metrics collection.
 */

import { Context, Next } from 'hono';
import { Env } from '../types';
import { MonitoringService, MetricType } from '../services/MonitoringService';
import { ErrorHandlingService, ErrorType } from '../services/ErrorHandlingService';
import { log } from '../utils/logger';

// Global monitoring service instances
let monitoringService: MonitoringService | null = null;
let errorHandlingService: ErrorHandlingService | null = null;

/**
 * Initialize monitoring services
 */
function initializeServices(env: Env): void {
  if (!monitoringService) {
    monitoringService = new MonitoringService(env);
  }
  if (!errorHandlingService) {
    errorHandlingService = new ErrorHandlingService(env);
  }
}

/**
 * Performance monitoring middleware
 * Tracks API response times and request counts
 */
export const performanceMonitoring = async (c: Context<{ Bindings: Env }>, next: Next) => {
  const startTime = Date.now();
  const path = c.req.path;
  const method = c.req.method;
  
  initializeServices(c.env);

  try {
    // Record request start
    monitoringService!.incrementCounter('api.requests.total', 1, {
      method,
      path: sanitizePath(path)
    });

    await next();

    // Record successful request
    const duration = Date.now() - startTime;
    const status = c.res.status;

    monitoringService!.recordTimer('api.response_time', duration, {
      method,
      path: sanitizePath(path),
      status: status.toString()
    });

    // Record status code metrics
    if (status >= 200 && status < 300) {
      monitoringService!.incrementCounter('api.requests.success', 1, {
        method,
        path: sanitizePath(path)
      });
    } else if (status >= 400) {
      monitoringService!.incrementCounter('api.requests.error', 1, {
        method,
        path: sanitizePath(path),
        status: status.toString()
      });
    }

    // Log slow requests
    if (duration > 2000) { // 2 seconds
      log.warn('Slow API request detected', {
        method,
        path,
        duration,
        status
      });
    }

  } catch (error) {
    // Record error metrics
    const duration = Date.now() - startTime;
    
    monitoringService!.incrementCounter('api.requests.error', 1, {
      method,
      path: sanitizePath(path),
      error: 'true'
    });

    monitoringService!.recordTimer('api.response_time', duration, {
      method,
      path: sanitizePath(path),
      error: 'true'
    });

    // Log error
    log.error('API request error', {
      method,
      path,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    throw error;
  }
};

/**
 * Error handling middleware with circuit breaker
 */
export const errorHandlingWithCircuitBreaker = async (c: Context<{ Bindings: Env }>, next: Next) => {
  const operationName = `${c.req.method}_${sanitizePath(c.req.path)}`;
  
  initializeServices(c.env);

  try {
    // Execute with circuit breaker protection
    await errorHandlingService!.executeWithCircuitBreaker(
      operationName,
      async () => {
        await next();
        
        // Check if response indicates an error
        if (c.res.status >= 500) {
          throw new Error(`Server error: ${c.res.status}`);
        }
      }
    );

  } catch (error) {
    // Determine error type
    const errorType = classifyError(error);
    
    // Try to handle with recovery strategy
    try {
      const recoveryResult = await errorHandlingService!.handleErrorWithRecovery(
        error instanceof Error ? error : new Error('Unknown error'),
        errorType
      );

      // Return degraded response if recovery succeeded
      if (recoveryResult) {
        return c.json({
          success: false,
          data: recoveryResult,
          message: 'Service temporarily degraded',
          degraded: true
        }, 503);
      }
    } catch (recoveryError) {
      // Recovery failed, continue with original error
    }

    // Record error in tracking system
    await recordError(c, error, errorType);

    throw error;
  }
};

/**
 * Database monitoring middleware
 */
export const databaseMonitoring = async (c: Context<{ Bindings: Env }>, next: Next) => {
  initializeServices(c.env);

  // Wrap database operations with monitoring
  const originalDB = c.env.DB;
  
  c.env.DB = new Proxy(originalDB, {
    get(target, prop) {
      if (prop === 'prepare') {
        return function(query: string) {
          const stmt = target.prepare(query);
          
          // Wrap statement methods with monitoring
          return new Proxy(stmt, {
            get(stmtTarget, stmtProp) {
              if (['first', 'all', 'run'].includes(stmtProp as string)) {
                return async function(...args: any[]) {
                  const startTime = Date.now();
                  
                  try {
                    const result = await (stmtTarget as any)[stmtProp](...args);
                    const duration = Date.now() - startTime;
                    
                    // Record successful query
                    monitoringService!.recordTimer('database.query_time', duration, {
                      operation: stmtProp as string,
                      success: 'true'
                    });
                    
                    monitoringService!.incrementCounter('database.queries.total', 1, {
                      operation: stmtProp as string
                    });

                    // Log slow queries
                    if (duration > 1000) { // 1 second
                      log.warn('Slow database query detected', {
                        query: query.substring(0, 100),
                        duration,
                        operation: stmtProp
                      });
                      
                      monitoringService!.incrementCounter('database.queries.slow', 1, {
                        operation: stmtProp as string
                      });
                    }
                    
                    return result;
                  } catch (error) {
                    const duration = Date.now() - startTime;
                    
                    // Record failed query
                    monitoringService!.recordTimer('database.query_time', duration, {
                      operation: stmtProp as string,
                      error: 'true'
                    });
                    
                    monitoringService!.incrementCounter('database.queries.error', 1, {
                      operation: stmtProp as string
                    });

                    log.error('Database query error', {
                      query: query.substring(0, 100),
                      duration,
                      operation: stmtProp,
                      error: error instanceof Error ? error.message : 'Unknown error'
                    });
                    
                    throw error;
                  }
                };
              }
              
              return (stmtTarget as any)[stmtProp];
            }
          });
        };
      }
      
      return (target as any)[prop];
    }
  });

  await next();
};

/**
 * Cache monitoring middleware
 */
export const cacheMonitoring = async (c: Context<{ Bindings: Env }>, next: Next) => {
  initializeServices(c.env);

  // Monitor cache operations if KV is available
  if (c.env.CACHE_KV) {
    const originalKV = c.env.CACHE_KV;
    
    c.env.CACHE_KV = new Proxy(originalKV, {
      get(target, prop) {
        if (['get', 'put', 'delete'].includes(prop as string)) {
          return async function(...args: any[]) {
            const startTime = Date.now();
            
            try {
              const result = await (target as any)[prop](...args);
              const duration = Date.now() - startTime;
              
              // Record cache operation
              monitoringService!.recordTimer(`cache.${prop as string}_time`, duration);
              monitoringService!.incrementCounter(`cache.${prop as string}.total`, 1);
              
              // Record cache hit/miss for get operations
              if (prop === 'get') {
                if (result !== null) {
                  monitoringService!.incrementCounter('cache.hits', 1);
                } else {
                  monitoringService!.incrementCounter('cache.misses', 1);
                }
              }
              
              return result;
            } catch (error) {
              const duration = Date.now() - startTime;
              
              monitoringService!.recordTimer(`cache.${prop as string}_time`, duration, {
                error: 'true'
              });
              monitoringService!.incrementCounter(`cache.${prop as string}.error`, 1);
              
              throw error;
            }
          };
        }
        
        return (target as any)[prop];
      }
    });
  }

  await next();
};

/**
 * Business metrics middleware
 */
export const businessMetricsTracking = async (c: Context<{ Bindings: Env }>, next: Next) => {
  initializeServices(c.env);

  await next();

  // Track business-specific metrics based on the endpoint
  const path = c.req.path;
  const method = c.req.method;
  const status = c.res.status;

  if (status >= 200 && status < 300) {
    // Track successful business operations
    if (path.includes('/sales') && method === 'POST') {
      monitoringService!.incrementCounter('business.sales.created', 1);
    } else if (path.includes('/products') && method === 'POST') {
      monitoringService!.incrementCounter('business.products.created', 1);
    } else if (path.includes('/customers') && method === 'POST') {
      monitoringService!.incrementCounter('business.customers.created', 1);
    } else if (path.includes('/inventory') && method === 'POST') {
      monitoringService!.incrementCounter('business.inventory.updated', 1);
    }
  }
};

/**
 * Sanitize path for metrics (remove IDs and sensitive data)
 */
function sanitizePath(path: string): string {
  return path
    .replace(/\/\d+/g, '/:id') // Replace numeric IDs
    .replace(/\/[a-f0-9-]{36}/g, '/:uuid') // Replace UUIDs
    .replace(/\/[a-zA-Z0-9]{20,}/g, '/:token'); // Replace long tokens
}

/**
 * Classify error type for recovery strategies
 */
function classifyError(error: any): ErrorType {
  if (!error) return ErrorType.VALIDATION_ERROR;
  
  const message = error.message || error.toString();
  
  if (message.includes('database') || message.includes('SQL')) {
    return ErrorType.DATABASE_ERROR;
  } else if (message.includes('network') || message.includes('fetch')) {
    return ErrorType.NETWORK_ERROR;
  } else if (message.includes('timeout')) {
    return ErrorType.TIMEOUT_ERROR;
  } else if (message.includes('unauthorized') || message.includes('authentication')) {
    return ErrorType.AUTHENTICATION_ERROR;
  } else if (message.includes('forbidden') || message.includes('permission')) {
    return ErrorType.AUTHORIZATION_ERROR;
  } else if (message.includes('rate limit')) {
    return ErrorType.RATE_LIMIT_ERROR;
  } else if (message.includes('external') || message.includes('service')) {
    return ErrorType.EXTERNAL_SERVICE_ERROR;
  } else {
    return ErrorType.VALIDATION_ERROR;
  }
}

/**
 * Record error in tracking system
 */
async function recordError(c: Context<{ Bindings: Env }>, error: any, errorType: ErrorType): Promise<void> {
  try {
    const user = c.get('user');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const stackTrace = error instanceof Error ? error.stack : null;
    
    await c.env.DB.prepare(`
      INSERT INTO error_tracking 
      (error_type, error_message, stack_trace, request_path, request_method, 
       user_id, user_agent, ip_address, severity, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      errorType,
      errorMessage,
      stackTrace,
      c.req.path,
      c.req.method,
      user?.id || null,
      c.req.header('User-Agent') || null,
      c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || null,
      determineSeverity(errorType)
    ).run();
  } catch (dbError) {
    log.error('Failed to record error in tracking system', {
      originalError: error instanceof Error ? error.message : 'Unknown error',
      dbError: dbError instanceof Error ? dbError.message : 'Unknown error'
    });
  }
}

/**
 * Determine error severity based on type
 */
function determineSeverity(errorType: ErrorType): string {
  switch (errorType) {
    case ErrorType.DATABASE_ERROR:
    case ErrorType.EXTERNAL_SERVICE_ERROR:
      return 'critical';
    case ErrorType.NETWORK_ERROR:
    case ErrorType.TIMEOUT_ERROR:
      return 'high';
    case ErrorType.AUTHENTICATION_ERROR:
    case ErrorType.AUTHORIZATION_ERROR:
      return 'medium';
    default:
      return 'low';
  }
}
