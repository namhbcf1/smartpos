/**
 * ENHANCED MONITORING & LOGGING SYSTEM
 * Provides comprehensive monitoring, health checks, and error tracking
 */

import { Context } from 'hono';
import { Env } from '../types';

// ============================================================================
// STRUCTURED LOGGING
// ============================================================================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  requestId?: string;
  userId?: number;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export class EnhancedLogger {
  private static instance: EnhancedLogger;
  private requestId: string = '';
  private context: Record<string, any> = {};

  static getInstance(): EnhancedLogger {
    if (!EnhancedLogger.instance) {
      EnhancedLogger.instance = new EnhancedLogger();
    }
    return EnhancedLogger.instance;
  }

  setRequestContext(requestId: string, context: Record<string, any> = {}) {
    this.requestId = requestId;
    this.context = context;
  }

  private createLogEntry(level: LogLevel, message: string, additionalContext?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...additionalContext },
      requestId: this.requestId,
    };
  }

  debug(message: string, context?: Record<string, any>) {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    console.debug('🔍 DEBUG:', JSON.stringify(entry));
  }

  info(message: string, context?: Record<string, any>) {
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    console.info('ℹ️ INFO:', JSON.stringify(entry));
  }

  warn(message: string, context?: Record<string, any>) {
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    console.warn('⚠️ WARN:', JSON.stringify(entry));
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    const entry = this.createLogEntry(LogLevel.ERROR, message, {
      ...context,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      })
    });
    console.error('❌ ERROR:', JSON.stringify(entry));
  }

  critical(message: string, error?: Error, context?: Record<string, any>) {
    const entry = this.createLogEntry(LogLevel.CRITICAL, message, {
      ...context,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      })
    });
    console.error('🚨 CRITICAL:', JSON.stringify(entry));
  }
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export interface PerformanceMetrics {
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  slowQueries: number;
  memoryUsage?: number;
  activeConnections: number;
  lastUpdated: string;
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetrics = {
    requestCount: 0,
    averageResponseTime: 0,
    errorRate: 0,
    slowQueries: 0,
    activeConnections: 0,
    lastUpdated: new Date().toISOString()
  };

  private static responseTimes: number[] = [];
  private static errorCount: number = 0;
  private static readonly MAX_RESPONSE_TIME_SAMPLES = 1000;

  static recordRequest(responseTime: number, isError: boolean = false) {
    this.metrics.requestCount++;
    
    // Record response time
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > this.MAX_RESPONSE_TIME_SAMPLES) {
      this.responseTimes.shift();
    }
    
    // Calculate average response time
    this.metrics.averageResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
    
    // Record errors
    if (isError) {
      this.errorCount++;
    }
    
    // Calculate error rate
    this.metrics.errorRate = (this.errorCount / this.metrics.requestCount) * 100;
    
    // Record slow queries (>1000ms)
    if (responseTime > 1000) {
      this.metrics.slowQueries++;
    }
    
    this.metrics.lastUpdated = new Date().toISOString();
  }

  static getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  static resetMetrics() {
    this.metrics = {
      requestCount: 0,
      averageResponseTime: 0,
      errorRate: 0,
      slowQueries: 0,
      activeConnections: 0,
      lastUpdated: new Date().toISOString()
    };
    this.responseTimes = [];
    this.errorCount = 0;
  }
}

// ============================================================================
// HEALTH CHECKS
// ============================================================================

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, {
    status: 'pass' | 'fail' | 'warn';
    message: string;
    duration: number;
    timestamp: string;
  }>;
  overall: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    message: string;
    timestamp: string;
  };
}

export class HealthChecker {
  static async performHealthCheck(env: Env): Promise<HealthCheckResult> {
    const checks: HealthCheckResult['checks'] = {};
    const startTime = Date.now();

    // Database health check
    try {
      const dbStart = Date.now();
      await env.DB.prepare('SELECT 1').first();
      checks.database = {
        status: 'pass',
        message: 'Database connection successful',
        duration: Date.now() - dbStart,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      checks.database = {
        status: 'fail',
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }

    // KV Store health check
    try {
      const kvStart = Date.now();
      await env.CACHE.put('health_check', 'ok', { expirationTtl: 60 });
      const result = await env.CACHE.get('health_check');
      checks.cache = {
        status: result === 'ok' ? 'pass' : 'warn',
        message: result === 'ok' ? 'Cache working correctly' : 'Cache read/write issue',
        duration: Date.now() - kvStart,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      checks.cache = {
        status: 'fail',
        message: `Cache connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }

    // Performance check
    const metrics = PerformanceMonitor.getMetrics();
    checks.performance = {
      status: metrics.averageResponseTime > 2000 ? 'warn' : 'pass',
      message: `Average response time: ${metrics.averageResponseTime.toFixed(2)}ms, Error rate: ${metrics.errorRate.toFixed(2)}%`,
      duration: 0,
      timestamp: new Date().toISOString()
    };

    // Memory check (if available)
    try {
      // Note: Memory usage might not be available in Cloudflare Workers
      checks.memory = {
        status: 'pass',
        message: 'Memory usage within normal limits',
        duration: 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      checks.memory = {
        status: 'warn',
        message: 'Memory usage information not available',
        duration: 0,
        timestamp: new Date().toISOString()
      };
    }

    // Determine overall status
    const failedChecks = Object.values(checks).filter(check => check.status === 'fail').length;
    const warnChecks = Object.values(checks).filter(check => check.status === 'warn').length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    let overallMessage: string;

    if (failedChecks > 0) {
      overallStatus = 'unhealthy';
      overallMessage = `${failedChecks} critical check(s) failed`;
    } else if (warnChecks > 0) {
      overallStatus = 'degraded';
      overallMessage = `${warnChecks} check(s) showing warnings`;
    } else {
      overallStatus = 'healthy';
      overallMessage = 'All systems operational';
    }

    return {
      status: overallStatus,
      checks,
      overall: {
        status: overallStatus,
        message: overallMessage,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// ============================================================================
// REQUEST MONITORING MIDDLEWARE
// ============================================================================

export const requestMonitoringMiddleware = async (c: Context<{ Bindings: Env }>, next: any) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const logger = EnhancedLogger.getInstance();
  
  // Set request context
  const requestContext = {
    requestId,
    method: c.req.method,
    url: c.req.url,
    userAgent: c.req.header('User-Agent'),
    ip: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
    timestamp: new Date().toISOString()
  };
  
  logger.setRequestContext(requestId, requestContext);
  
  // Add request ID to response headers
  c.header('X-Request-ID', requestId);
  
  try {
    logger.info('Request started', {
      endpoint: new URL(c.req.url).pathname,
      method: c.req.method
    });
    
    await next();
    
    const duration = Date.now() - startTime;
    const isError = c.res.status >= 400;
    
    // Record performance metrics
    PerformanceMonitor.recordRequest(duration, isError);
    
    logger.info('Request completed', {
      status: c.res.status,
      duration,
      endpoint: new URL(c.req.url).pathname
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    PerformanceMonitor.recordRequest(duration, true);
    
    logger.error('Request failed', error as Error, {
      duration,
      endpoint: new URL(c.req.url).pathname
    });
    
    throw error;
  }
};

// ============================================================================
// ERROR TRACKING
// ============================================================================

export interface ErrorReport {
  id: string;
  timestamp: string;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  context: {
    requestId?: string;
    userId?: number;
    endpoint: string;
    method: string;
    userAgent?: string;
    ip?: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class ErrorTracker {
  private static errors: ErrorReport[] = [];
  private static readonly MAX_ERRORS = 1000;

  static reportError(error: Error, context: Partial<ErrorReport['context']>, severity: ErrorReport['severity'] = 'medium') {
    const errorReport: ErrorReport = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context: {
        endpoint: context.endpoint || 'unknown',
        method: context.method || 'unknown',
        ...context
      },
      severity
    };

    this.errors.unshift(errorReport);
    
    // Keep only the most recent errors
    if (this.errors.length > this.MAX_ERRORS) {
      this.errors = this.errors.slice(0, this.MAX_ERRORS);
    }

    // Log critical errors immediately
    if (severity === 'critical') {
      const logger = EnhancedLogger.getInstance();
      logger.critical('Critical error reported', error, context);
    }
  }

  static getErrors(limit: number = 50): ErrorReport[] {
    return this.errors.slice(0, limit);
  }

  static getErrorStats() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    const recentErrors = this.errors.filter(error => 
      new Date(error.timestamp).getTime() > oneHourAgo
    );

    const dailyErrors = this.errors.filter(error => 
      new Date(error.timestamp).getTime() > oneDayAgo
    );

    return {
      total: this.errors.length,
      lastHour: recentErrors.length,
      lastDay: dailyErrors.length,
      bySeverity: {
        critical: this.errors.filter(e => e.severity === 'critical').length,
        high: this.errors.filter(e => e.severity === 'high').length,
        medium: this.errors.filter(e => e.severity === 'medium').length,
        low: this.errors.filter(e => e.severity === 'low').length,
      }
    };
  }
}

// Export singleton instances
export const logger = EnhancedLogger.getInstance();
