/**
 * ERROR HANDLING & RECOVERY SERVICE
 * 
 * Implements circuit breaker pattern, retry mechanisms, and graceful degradation
 * for robust system operation and automatic error recovery.
 */

import { Env } from '../types';
import { log } from '../utils/logger';

// Circuit Breaker States
export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

// Error Types
export enum ErrorType {
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR'
}

// Circuit Breaker Configuration
interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  halfOpenMaxCalls: number;
}

// Retry Configuration
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: ErrorType[];
}

// Circuit Breaker State
interface CircuitBreakerState {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
  halfOpenCalls: number;
}

// Error Recovery Strategy
interface RecoveryStrategy {
  errorType: ErrorType;
  fallbackAction: () => Promise<any>;
  recoveryAction?: () => Promise<void>;
  alertThreshold: number;
}

export class ErrorHandlingService {
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private recoveryStrategies: Map<ErrorType, RecoveryStrategy> = new Map();
  
  private defaultCircuitConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    recoveryTimeout: 60000, // 1 minute
    monitoringPeriod: 300000, // 5 minutes
    halfOpenMaxCalls: 3
  };

  private defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryableErrors: [
      ErrorType.DATABASE_ERROR,
      ErrorType.NETWORK_ERROR,
      ErrorType.TIMEOUT_ERROR,
      ErrorType.EXTERNAL_SERVICE_ERROR
    ]
  };

  constructor(private env: Env) {
    this.initializeRecoveryStrategies();
  }

  /**
   * Initialize recovery strategies for different error types
   */
  private initializeRecoveryStrategies(): void {
    // Database error recovery
    this.recoveryStrategies.set(ErrorType.DATABASE_ERROR, {
      errorType: ErrorType.DATABASE_ERROR,
      fallbackAction: async () => {
        log.warn('Database fallback: Using cached data');
        return this.getCachedData();
      },
      recoveryAction: async () => {
        log.info('Database recovery: Attempting reconnection');
        await this.testDatabaseConnection();
      },
      alertThreshold: 3
    });

    // Network error recovery
    this.recoveryStrategies.set(ErrorType.NETWORK_ERROR, {
      errorType: ErrorType.NETWORK_ERROR,
      fallbackAction: async () => {
        log.warn('Network fallback: Using offline mode');
        return { offline: true, message: 'Operating in offline mode' };
      },
      alertThreshold: 5
    });

    // External service error recovery
    this.recoveryStrategies.set(ErrorType.EXTERNAL_SERVICE_ERROR, {
      errorType: ErrorType.EXTERNAL_SERVICE_ERROR,
      fallbackAction: async () => {
        log.warn('External service fallback: Using alternative service');
        return this.getAlternativeServiceResponse();
      },
      alertThreshold: 2
    });
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async executeWithCircuitBreaker<T>(
    operationName: string,
    operation: () => Promise<T>,
    config?: Partial<CircuitBreakerConfig>
  ): Promise<T> {
    const circuitConfig = { ...this.defaultCircuitConfig, ...config };
    const circuitState = this.getCircuitState(operationName);

    // Check circuit state
    if (circuitState.state === CircuitState.OPEN) {
      if (Date.now() - circuitState.lastFailureTime < circuitConfig.recoveryTimeout) {
        throw new Error(`Circuit breaker OPEN for ${operationName}`);
      } else {
        // Transition to HALF_OPEN
        circuitState.state = CircuitState.HALF_OPEN;
        circuitState.halfOpenCalls = 0;
        log.info(`Circuit breaker transitioning to HALF_OPEN for ${operationName}`);
      }
    }

    if (circuitState.state === CircuitState.HALF_OPEN) {
      if (circuitState.halfOpenCalls >= circuitConfig.halfOpenMaxCalls) {
        throw new Error(`Circuit breaker HALF_OPEN limit exceeded for ${operationName}`);
      }
      circuitState.halfOpenCalls++;
    }

    try {
      const result = await operation();
      
      // Success - reset circuit breaker
      if (circuitState.state === CircuitState.HALF_OPEN) {
        circuitState.state = CircuitState.CLOSED;
        circuitState.failureCount = 0;
        log.info(`Circuit breaker CLOSED for ${operationName}`);
      }
      
      return result;
    } catch (error) {
      // Failure - update circuit breaker
      circuitState.failureCount++;
      circuitState.lastFailureTime = Date.now();

      if (circuitState.failureCount >= circuitConfig.failureThreshold) {
        circuitState.state = CircuitState.OPEN;
        log.error(`Circuit breaker OPEN for ${operationName}`, error instanceof Error ? error : new Error(error instanceof Error ? error.message : 'Unknown error'));
      }

      throw error;
    }
  }

  /**
   * Execute operation with retry logic and exponential backoff
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    errorType: ErrorType,
    config?: Partial<RetryConfig>
  ): Promise<T> {
    const retryConfig = { ...this.defaultRetryConfig, ...config };
    let lastError: Error;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Check if error is retryable
        if (!retryConfig.retryableErrors.includes(errorType)) {
          throw lastError;
        }

        // Don't retry on last attempt
        if (attempt === retryConfig.maxAttempts) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt - 1),
          retryConfig.maxDelay
        );

        log.warn(`Retry attempt ${attempt}/${retryConfig.maxAttempts} for ${errorType}`, {
          delay,
          error: lastError.message
        });

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Handle error with recovery strategy
   */
  async handleErrorWithRecovery(error: Error, errorType: ErrorType): Promise<any> {
    const strategy = this.recoveryStrategies.get(errorType);
    
    if (!strategy) {
      log.error(`No recovery strategy for error type: ${errorType}`, error);
      throw error;
    }

    try {
      log.info(`Executing recovery strategy for ${errorType}`);
      
      // Execute fallback action
      const fallbackResult = await strategy.fallbackAction();
      
      // Execute recovery action if available
      if (strategy.recoveryAction) {
        try {
          await strategy.recoveryAction();
        } catch (recoveryError) {
          log.error(`Recovery action failed for ${errorType}`, recoveryError instanceof Error ? recoveryError : new Error(recoveryError instanceof Error ? recoveryError.message : 'Unknown error'));
        }
      }

      return fallbackResult;
    } catch (fallbackError) {
      log.error(`Fallback action failed for ${errorType}`, error instanceof Error ? error : new Error('Unknown error'));
      throw error; // Throw original error if fallback fails
    }
  }

  /**
   * Graceful degradation for service failures
   */
  async degradeGracefully(serviceName: string, operation: () => Promise<any>): Promise<any> {
    try {
      return await this.executeWithCircuitBreaker(serviceName, operation);
    } catch (error) {
      log.warn(`Service degradation for ${serviceName}`, { 
        message: error instanceof Error ? error.message : 'Unknown error'
      });

      // Return degraded response based on service
      switch (serviceName) {
        case 'analytics':
          return {
            success: true,
            data: null,
            message: 'Analytics temporarily unavailable',
            degraded: true
          };
        
        case 'inventory':
          return {
            success: true,
            data: await this.getBasicInventoryData(),
            message: 'Using basic inventory data',
            degraded: true
          };
        
        case 'reporting':
          return {
            success: true,
            data: [],
            message: 'Reporting temporarily unavailable',
            degraded: true
          };
        
        default:
          return {
            success: false,
            data: null,
            message: `Service ${serviceName} temporarily unavailable`,
            degraded: true
          };
      }
    }
  }

  /**
   * Get circuit breaker state for operation
   */
  private getCircuitState(operationName: string): CircuitBreakerState {
    if (!this.circuitBreakers.has(operationName)) {
      this.circuitBreakers.set(operationName, {
        state: CircuitState.CLOSED,
        failureCount: 0,
        lastFailureTime: 0,
        halfOpenCalls: 0
      });
    }
    return this.circuitBreakers.get(operationName)!;
  }

  /**
   * Get cached data for fallback
   */
  private async getCachedData(): Promise<any> {
    try {
      // In a real implementation, this would fetch from cache (Redis, KV, etc.)
      return {
        cached: true,
        timestamp: new Date().toISOString(),
        data: 'Cached fallback data'
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Test database connection
   */
  private async testDatabaseConnection(): Promise<void> {
    try {
      await this.env.DB.prepare('SELECT 1').first();
      log.info('Database connection test successful');
    } catch (error) {
      log.error('Database connection test failed', error instanceof Error ? error : new Error(error instanceof Error ? error.message : 'Unknown error'));
      throw error;
    }
  }

  /**
   * Get alternative service response
   */
  private async getAlternativeServiceResponse(): Promise<any> {
    return {
      alternative: true,
      message: 'Using alternative service provider',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get basic inventory data for degraded mode
   */
  private async getBasicInventoryData(): Promise<any> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT COUNT(*) as total_products,
               SUM(CASE WHEN stock <= 0 THEN 1 ELSE 0 END) as out_of_stock
        FROM products WHERE is_active = 1
      `).first();
      
      return result;
    } catch (error) {
      return {
        total_products: 0,
        out_of_stock: 0,
        error: 'Unable to fetch inventory data'
      };
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get circuit breaker status for monitoring
   */
  getCircuitBreakerStatus(): Record<string, CircuitBreakerState> {
    const status: Record<string, CircuitBreakerState> = {};
    this.circuitBreakers.forEach((state, name) => {
      status[name] = { ...state };
    });
    return status;
  }

  /**
   * Reset circuit breaker for specific operation
   */
  resetCircuitBreaker(operationName: string): void {
    if (this.circuitBreakers.has(operationName)) {
      const state = this.circuitBreakers.get(operationName)!;
      state.state = CircuitState.CLOSED;
      state.failureCount = 0;
      state.lastFailureTime = 0;
      state.halfOpenCalls = 0;
      
      log.info(`Circuit breaker reset for ${operationName}`);
    }
  }
}
