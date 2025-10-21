/**
 * Comprehensive error handling utilities for SmartPOS
 */

export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Database
  DATABASE_ERROR = 'DATABASE_ERROR',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  
  // Business Logic
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  INVALID_OPERATION = 'INVALID_OPERATION',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  
  // System
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  
  // External Services
  PAYMENT_GATEWAY_ERROR = 'PAYMENT_GATEWAY_ERROR',
  EMAIL_SERVICE_ERROR = 'EMAIL_SERVICE_ERROR',
  SMS_SERVICE_ERROR = 'SMS_SERVICE_ERROR',
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: string;
  public readonly details?: any;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    this.details = details;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, ErrorCode.UNAUTHORIZED, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, ErrorCode.FORBIDDEN, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, ErrorCode.RECORD_NOT_FOUND, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, ErrorCode.DUPLICATE_ENTRY, 409);
  }
}

export class BusinessLogicError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ErrorCode.BUSINESS_RULE_VIOLATION, 422, true, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, ErrorCode.DATABASE_ERROR, 500, true, {
      originalError: originalError?.message,
      stack: originalError?.stack
    });
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, originalError?: Error) {
    super(`${service} service error: ${message}`, ErrorCode.SERVICE_UNAVAILABLE, 503, true, {
      service,
      originalError: originalError?.message
    });
  }
}

// Error response formatter
export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    timestamp: string;
    details?: any;
    requestId?: string;
  };
}

export function formatErrorResponse(
  error: AppError | Error,
  requestId?: string,
  includeStack: boolean = false
): ErrorResponse {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        timestamp: error.timestamp,
        details: error.details,
        requestId,
        ...(includeStack && { stack: error.stack })
      }
    };
  }

  // Handle unknown errors
  return {
    success: false,
    error: {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      requestId,
      ...(includeStack && { stack: error.stack })
    }
  };
}

// Error logger
export class ErrorLogger {
  static log(error: Error, context?: any): void {
    const logData = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context
    };

    if (error instanceof AppError) {
      (logData as any).code = (error as any).code;
      (logData as any).statusCode = (error as any).statusCode;
      (logData as any).isOperational = (error as any).isOperational;
      (logData as any).details = (error as any).details;
    }

    // Log based on severity
    if (error instanceof AppError && error.statusCode < 500) { /* No operation */ } else {
      console.error('Application Error:', JSON.stringify(logData, null, 2));
    }
  }

  static logWithSentry(error: Error, context?: any): void {
    // External error reporting integration point
    // This method provides a centralized place for future Sentry or similar service integration
    // For now, uses the standard logging mechanism
    this.log(error, context);
    
    // Future implementation example:
    // if (typeof Sentry !== 'undefined') {
    //   Sentry.captureException(error, { extra: context });
    // }
  }
}

// Error handler middleware factory
export function createErrorHandler(isDevelopment: boolean = false) {
  return (error: Error, c: any) => {
    // Generate request ID for tracking
    const requestId = crypto.randomUUID();
    // Log the error
    ErrorLogger.log(error, {
      requestId,
      method: c.req.method,
      url: c.req.url,
      userAgent: c.req.header('User-Agent'),
      ip: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For')
    });

    // Format error response
    const errorResponse = formatErrorResponse(
      error,
      requestId,
      isDevelopment // Include stack trace in development
    );

    // Determine status code
    let statusCode = 500;
    if (error instanceof AppError) {
      statusCode = error.statusCode;
    }

    return c.json(errorResponse, statusCode);
  };
}

// Async error wrapper
export function asyncHandler<T extends any[], R>(
  fn: (...args: any) => Promise<R>
) {
  return (...args: any): Promise<R> => {
    return Promise.resolve(fn(...args)).catch((error) => {
      throw error instanceof AppError ? error : new AppError(
        error.message || 'An unexpected error occurred',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500,
        false
      );
    });
  };
}

// Database error mapper
export function mapDatabaseError(error: any): AppError {
  const message = error.message || 'Database operation failed';
  
  // SQLite specific error mapping
  if (message.includes('UNIQUE constraint failed')) {
    return new ConflictError('Record already exists');
  }
  
  if (message.includes('FOREIGN KEY constraint failed')) {
    return new ValidationError('Invalid reference to related record');
  }
  
  if (message.includes('NOT NULL constraint failed')) {
    return new ValidationError('Required field is missing');
  }
  
  if (message.includes('no such table')) {
    return new AppError('Database schema error', ErrorCode.CONFIGURATION_ERROR, 500);
  }
  
  return new DatabaseError(message, error);
}

// Validation error helpers
export function createValidationError(field: string, message: string): ValidationError {
  return new ValidationError(`Validation failed for field '${field}': ${message}`, {
    field,
    message
  });
}

export function createMultipleValidationErrors(errors: Array<{ field: string; message: string }>): ValidationError {
  return new ValidationError('Multiple validation errors', { errors });
}