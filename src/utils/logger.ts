/**
 * PRODUCTION-SAFE LOGGING UTILITY
 * 
 * Replaces console.log statements with proper logging that:
 * - Respects environment settings
 * - Provides structured logging
 * - Includes performance monitoring
 * - Supports different log levels
 * - Can be disabled in production
 */

import { Env } from '../types';

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

// Log entry interface
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: any;
  requestId?: string;
  userId?: string;
  endpoint?: string;
  duration?: number;
}

// Logger configuration
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableKV: boolean;
  enableMetrics: boolean;
  maxEntries: number;
}

/**
 * Production-safe logger class
 */
export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private env?: Env;

  private constructor(config: LoggerConfig) {
    this.config = config;
  }

  static getInstance(config?: LoggerConfig): Logger {
    if (!Logger.instance) {
      const defaultConfig: LoggerConfig = {
        level: LogLevel.WARN,
        enableConsole: false,
        enableKV: true,
        enableMetrics: true,
        maxEntries: 1000
      };
      Logger.instance = new Logger(config || defaultConfig);
    }
    return Logger.instance;
  }

  setEnv(env: Env): void {
    this.env = env;
  }

  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Debug logging (development only)
   */
  debug(message: string, context?: any): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Info logging
   */
  info(message: string, context?: any): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Warning logging
   */
  warn(message: string, context?: any): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Error logging
   */
  error(message: string, error?: Error, context?: any): void {
    const errorContext = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...context
    } : context;
    
    this.log(LogLevel.ERROR, message, errorContext);
  }

  /**
   * Critical error logging
   */
  critical(message: string, error?: Error, context?: any): void {
    const errorContext = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...context
    } : context;
    
    this.log(LogLevel.CRITICAL, message, errorContext);
  }

  /**
   * Performance logging
   */
  performance(operation: string, duration: number, context?: any): void {
    this.log(LogLevel.INFO, `Performance: ${operation}`, {
      duration,
      operation,
      ...context
    });
  }

  /**
   * Security event logging
   */
  security(event: string, context?: any): void {
    this.log(LogLevel.WARN, `Security: ${event}`, {
      event,
      security: true,
      ...context
    });
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: any): void {
    // Check if logging is enabled for this level
    if (level < this.config.level) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    };

    // Console logging (development/debugging)
    if (this.config.enableConsole) {
      this.logToConsole(logEntry);
    }

    // KV storage logging (production monitoring)
    if (this.config.enableKV && this.env?.CACHE) {
      this.logToKV(logEntry).catch(err => {
        // Fallback to console if KV fails
        console.error('Failed to log to KV:', err);
      });
    }

    // Metrics collection
    if (this.config.enableMetrics) {
      this.recordMetrics(logEntry);
    }
  }

  /**
   * Console logging with proper formatting
   */
  private logToConsole(entry: LogEntry): void {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'];
    const levelEmojis = ['🔍', 'ℹ️', '⚠️', '❌', '🚨'];
    
    const prefix = `${levelEmojis[entry.level]} [${levelNames[entry.level]}] ${entry.timestamp}`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.context || '');
        break;
      case LogLevel.INFO:
        console.info(message, entry.context || '');
        break;
      case LogLevel.WARN:
        console.warn(message, entry.context || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(message, entry.context || '');
        break;
    }
  }

  /**
   * KV storage logging for production monitoring
   */
  private async logToKV(entry: LogEntry): Promise<void> {
    if (!this.env?.CACHE) return;

    try {
      const key = `log:${entry.timestamp}:${Math.random().toString(36).substr(2, 9)}`;
      const value = JSON.stringify(entry);
      
      // Store with TTL based on log level
      const ttl = this.getTTL(entry.level);
      await this.env.CACHE.put(key, value);
    } catch (error) {
      // Silent fail for logging to prevent infinite loops
    }
  }

  /**
   * Get TTL based on log level
   */
  private getTTL(level: LogLevel): number {
    switch (level) {
      case LogLevel.DEBUG:
        return 60 * 60; // 1 hour
      case LogLevel.INFO:
        return 24 * 60 * 60; // 1 day
      case LogLevel.WARN:
        return 7 * 24 * 60 * 60; // 7 days
      case LogLevel.ERROR:
        return 30 * 24 * 60 * 60; // 30 days
      case LogLevel.CRITICAL:
        return 90 * 24 * 60 * 60; // 90 days
      default:
        return 24 * 60 * 60; // 1 day
    }
  }

  /**
   * Record metrics for monitoring
   */
  private recordMetrics(entry: LogEntry): void {
    // Push basic timing metrics for slow query tracking if present
    try {
      if (entry.message?.startsWith('Performance:')) {
        const duration = (entry.context && (entry.context.duration as number)) || 0;
        const operation = (entry.context && (entry.context.operation as string)) || '';
        if (duration >= 0 && operation) {
          // No-op placeholder for future aggregation
        }
      }
    } catch (_e) {
      // swallow
    }
  }

  /**
   * Get recent logs (for debugging/monitoring)
   */
  async getRecentLogs(level?: LogLevel, limit: number = 100): Promise<LogEntry[]> {
    if (!this.env?.CACHE) return [];

    try {
      // This is a simplified implementation
      // In a real scenario, you'd want to implement proper log querying
      return [];
    } catch (error) {
      return [];
    }
  }
}

/**
 * Convenience functions for easy migration from console.log
 */
export const logger = Logger.getInstance();

// Migration helpers - these replace console.log statements
export const log = {
  debug: (message: string, ...args: any[]) => logger.debug(message, args.length > 0 ? args : undefined),
  info: (message: string, ...args: any[]) => logger.info(message, args.length > 0 ? args : undefined),
  warn: (message: string, ...args: any[]) => logger.warn(message, args.length > 0 ? args : undefined),
  error: (message: string, error?: Error, ...args: any[]) => logger.error(message, error, args.length > 0 ? args : undefined),
  critical: (message: string, error?: Error, ...args: any[]) => logger.critical(message, error, args.length > 0 ? args : undefined)
};

/**
 * Performance measurement utility
 */
export class PerformanceLogger {
  private static timers = new Map<string, number>();

  static start(operation: string): void {
    PerformanceLogger.timers.set(operation, Date.now());
  }

  static end(operation: string, context?: any): number {
    const startTime = PerformanceLogger.timers.get(operation);
    if (!startTime) {
      logger.warn(`Performance timer not found for operation: ${operation}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    PerformanceLogger.timers.delete(operation);
    
    logger.performance(operation, duration, context);
    return duration;
  }

  static measure<T>(operation: string, fn: () => T | Promise<T>, context?: any): T | Promise<T> {
    PerformanceLogger.start(operation);
    
    try {
      const result = fn();
      
      if (result instanceof Promise) {
        return result.finally(() => {
          PerformanceLogger.end(operation, context);
        });
      } else {
        PerformanceLogger.end(operation, context);
        return result;
      }
    } catch (error) {
      PerformanceLogger.end(operation, { ...context, error: true });
      throw error;
    }
  }
}

/**
 * Request logging middleware helper
 */
export function createRequestLogger(env: Env) {
  logger.setEnv(env);
  
  return (c: any, next: any) => {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    
    logger.info('Request started', {
      requestId,
      method: c.req.method,
      url: c.req.url,
      userAgent: c.req.header('User-Agent'),
      ip: c.req.header('CF-Connecting-IP')
    });

    return next().finally(() => {
      const duration = Date.now() - startTime;
      logger.info('Request completed', {
        requestId,
        method: c.req.method,
        url: c.req.url,
        duration,
        status: c.res?.status
      });
    });
  };
}
