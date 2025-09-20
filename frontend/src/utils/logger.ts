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

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

// Environment configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Logger configuration
interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemoteLogging: boolean;
  maxEntries: number;
  rateLimitMs: number;
}

// Default configuration based on environment
const defaultConfig: LoggerConfig = {
  level: isDevelopment ? LogLevel.DEBUG : LogLevel.WARN,
  enableConsole: isDevelopment,
  enableRemoteLogging: isProduction,
  maxEntries: 1000,
  rateLimitMs: 1000 // 1 second rate limit
};

// Rate limiting for logs
class LogRateLimiter {
  private lastLogTime = new Map<string, number>();

  shouldLog(key: string, rateLimitMs: number = 1000): boolean {
    const now = Date.now();
    const lastTime = this.lastLogTime.get(key) || 0;
    
    if (now - lastTime >= rateLimitMs) {
      this.lastLogTime.set(key, now);
      return true;
    }
    
    return false;
  }
}

// Production-safe logger
class ProductionLogger {
  private config: LoggerConfig;
  private rateLimiter = new LogRateLimiter();

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Debug logging (development only)
   */
  debug(message: string, context?: any): void {
    if (this.config.level <= LogLevel.DEBUG && this.config.enableConsole) {
      console.debug('🔍 DEBUG:', message, context);
    }
  }

  /**
   * Info logging
   */
  info(message: string, context?: any): void {
    if (this.config.level <= LogLevel.INFO && this.config.enableConsole) {
      console.info('ℹ️ INFO:', message, context);
    }
  }

  /**
   * Warning logging
   */
  warn(message: string, context?: any): void {
    if (this.config.level <= LogLevel.WARN) {
      if (this.config.enableConsole) {
        console.warn('⚠️ WARN:', message, context);
      }
      if (this.config.enableRemoteLogging) {
        this.sendToRemote('warn', message, context);
      }
    }
  }

  /**
   * Error logging
   */
  error(message: string, error?: Error, context?: any): void {
    if (this.config.level <= LogLevel.ERROR) {
      const errorContext = error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...context
      } : context;

      if (this.config.enableConsole) {
        console.error('❌ ERROR:', message, errorContext);
      }
      if (this.config.enableRemoteLogging) {
        this.sendToRemote('error', message, errorContext);
      }
    }
  }

  /**
   * Critical logging (always logged)
   */
  critical(message: string, error?: Error, context?: any): void {
    const errorContext = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...context
    } : context;

    console.error('🚨 CRITICAL:', message, errorContext);
    if (this.config.enableRemoteLogging) {
      this.sendToRemote('critical', message, errorContext);
    }
  }

  /**
   * Rate-limited logging for frequent events
   */
  rateLimited(level: LogLevel, key: string, message: string, context?: any): void {
    if (this.rateLimiter.shouldLog(key, this.config.rateLimitMs)) {
      switch (level) {
        case LogLevel.DEBUG:
          this.debug(message, context);
          break;
        case LogLevel.INFO:
          this.info(message, context);
          break;
        case LogLevel.WARN:
          this.warn(message, context);
          break;
        case LogLevel.ERROR:
          this.error(message, undefined, context);
          break;
        case LogLevel.CRITICAL:
          this.critical(message, undefined, context);
          break;
      }
    }
  }

  /**
   * API request logging
   */
  apiRequest(method: string, url: string, status?: number, duration?: number): void {
    if (!this.config.enableConsole) return;

    const key = `api-${method}-${url}`;
    if (this.rateLimiter.shouldLog(key, 5000)) { // 5 second rate limit for API logs
      const message = `${method} ${url}`;
      const context = { status, duration };

      if (status && status >= 400) {
        this.warn(`API Error: ${message}`, context);
      } else if (isDevelopment) {
        this.debug(`API Request: ${message}`, context);
      }
    }
  }

  /**
   * WebSocket event logging
   */
  websocket(event: string, data?: any): void {
    if (!this.config.enableConsole) return;

    const key = `ws-${event}`;
    if (this.rateLimiter.shouldLog(key, 10000)) { // 10 second rate limit for WebSocket logs
      if (isDevelopment) {
        this.debug(`WebSocket ${event}`, data);
      }
    }
  }

  /**
   * Real-time polling logging
   */
  polling(message: string, data?: any): void {
    if (!this.config.enableConsole) return;

    const key = 'polling-update';
    if (this.rateLimiter.shouldLog(key, 30000)) { // 30 second rate limit for polling logs
      if (isDevelopment) {
        this.debug(`Polling: ${message}`, data);
      }
    }
  }

  /**
   * Send logs to remote monitoring service
   */
  private sendToRemote(level: string, message: string, context?: any): void {
    // Only send important logs to remote service
    if (level === 'error' || level === 'critical') {
      try {
        // Send to monitoring service (implement based on your monitoring solution)
        fetch('/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level,
            message,
            context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
          })
        }).catch(() => {
          // Silently fail if remote logging is unavailable
        });
      } catch (error) {
        // Silently fail if remote logging is unavailable
      }
    }
  }
}

// Create singleton logger instance
export const logger = new ProductionLogger();

// Convenience exports for common logging patterns
export const logApi = logger.apiRequest.bind(logger);
export const logWebSocket = logger.websocket.bind(logger);
export const logPolling = logger.polling.bind(logger);
export const logError = logger.error.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logDebug = logger.debug.bind(logger);

// Export for advanced usage
export { ProductionLogger };
