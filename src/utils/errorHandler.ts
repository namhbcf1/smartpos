import { Context } from 'hono';
import { Env } from '../types';

/**
 * Standardized error handling utilities for SmartPOS API
 * Provides consistent error responses across all endpoints
 */

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
  requestId?: string;
}

export interface StandardErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
    stack?: string; // Only in development
  };
  meta?: {
    method: string;
    path: string;
    userAgent?: string;
    ip?: string;
  };
}

export interface StandardSuccessResponse<T = any> {
  success: true;
  data: any;
  message?: string;
  timestamp: string;
  requestId?: string;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    performance?: {
      duration: number;
      dbQueries?: number;
    };
  };
}

/**
 * Standard error codes used throughout the application
 */
export const ERROR_CODES = {
  // Authentication & Authorization
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  AUTHORIZATION_DENIED: 'AUTHORIZATION_DENIED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Resources
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  
  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',
  QUERY_FAILED: 'QUERY_FAILED',
  
  // Business Logic
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  INVALID_OPERATION: 'INVALID_OPERATION',
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  
  // System
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Network & External
  CORS_POLICY_VIOLATION: 'CORS_POLICY_VIOLATION',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
} as const;

/**
 * Create a standardized API error
 */
export function createApiError(
  message: string,
  code: string = ERROR_CODES.INTERNAL_SERVER_ERROR,
  statusCode: number = 500,
  details?: any
): ApiError {
  const error = new Error(message) as ApiError;
  error.code = code;
  error.statusCode = statusCode;
  error.details = details;
  error.requestId = generateRequestId();
  return error;
}

/**
 * Generate a unique request ID for tracking
 */
export function generateRequestId(): string {
  // Use crypto.randomUUID if available (most modern environments)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback: generate a random ID
  const chars = '0123456789abcdef';
  let id = '';
  for (let i = 0; i < 16; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return `req-${id}`;
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse(
  data: any,
  message?: string,
  meta?: StandardSuccessResponse['meta']
): StandardSuccessResponse {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    requestId: generateRequestId(),
    meta,
  };
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: ApiError | Error,
  c: Context,
  isDevelopment: boolean = false
): StandardErrorResponse {
  const apiError = error as ApiError;
  const requestId = apiError.requestId || generateRequestId();
  // Get client information
  const ip = c.req.header('CF-Connecting-IP') || 
            c.req.header('X-Forwarded-For') || 
            c.req.header('X-Real-IP') || 
            'unknown';
            
  const userAgent = c.req.header('User-Agent');
  
  return {
    success: false,
    error: {
      code: apiError.code || ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: error.message,
      details: apiError.details,
      timestamp: new Date().toISOString(),
      requestId,
      ...(isDevelopment && { stack: error.stack }),
    },
    meta: {
      method: c.req.method,
      path: c.req.path,
      userAgent,
      ip,
    },
  };
}

/**
 * Handle and format API errors consistently
 */
export function handleApiError(
  error: ApiError | Error,
  c: Context<{ Bindings: Env }>
) {
  const env = c.env;
  const isDevelopment = env?.ENVIRONMENT === 'development';
  const apiError = error as ApiError;
  
  // Determine status code
  const statusCode = apiError.statusCode || getStatusCodeFromError(error);
  
  // Log error for monitoring
  logError(error, c);
  
  // Create standardized error response
  const errorResponse = createErrorResponse(error, c, isDevelopment);
  
  return c.json(errorResponse, statusCode as any);
}

/**
 * Determine appropriate HTTP status code from error
 */
function getStatusCodeFromError(error: Error): number {
  const message = error.message.toLowerCase();
  if (message.includes('unauthorized') || message.includes('authentication')) {
    return 401;
  }
  if (message.includes('forbidden') || message.includes('authorization')) {
    return 403;
  }
  if (message.includes('not found')) {
    return 404;
  }
  if (message.includes('conflict') || message.includes('already exists')) {
    return 409;
  }
  if (message.includes('validation') || message.includes('invalid')) {
    return 400;
  }
  if (message.includes('rate limit')) {
    return 429;
  }
  if (message.includes('service unavailable')) {
    return 503;
  }
  
  return 500;
}

/**
 * Log errors for monitoring and debugging
 */
function logError(error: Error, c: Context): void {
  const apiError = error as ApiError;
  
  const errorLog = {
    timestamp: new Date().toISOString(),
    requestId: apiError.requestId || 'unknown',
    error: {
      name: error.name,
      message: error.message,
      code: apiError.code,
      statusCode: apiError.statusCode,
      stack: error.stack,
    },
    request: {
      method: c.req.method,
      url: c.req.url,
      path: c.req.path,
      userAgent: c.req.header('User-Agent'),
      ip: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
      referer: c.req.header('Referer'),
    },
    user: {
      // Add user context if available
      userId: c.get('user')?.id,
      role: c.get('user')?.role,
    },
  };
  
  // Use appropriate log level based on error severity
  if (apiError.statusCode && apiError.statusCode < 500) { /* No operation */ } else {
    console.error('Server error:', errorLog);
  }
}

/**
 * Middleware for handling uncaught errors
 */
export function errorHandlingMiddleware() {
  return async (c: Context<{ Bindings: Env }>, next: () => Promise<void>) => {
    try {
      await next();
    } catch (error) {
      return handleApiError(error as Error, c);
    }
  };
}

/**
 * Database error handler
 */
export function handleDatabaseError(error: Error): ApiError {
  const message = error.message.toLowerCase();
  if (message.includes('unique constraint')) {
    return createApiError(
      'Resource already exists',
      ERROR_CODES.RESOURCE_ALREADY_EXISTS,
      409,
      { originalError: error.message }
    );
  }
  
  if (message.includes('foreign key constraint')) {
    return createApiError(
      'Invalid reference to related resource',
      ERROR_CODES.VALIDATION_ERROR,
      400,
      { originalError: error.message }
    );
  }
  
  if (message.includes('not null constraint')) {
    return createApiError(
      'Required field is missing',
      ERROR_CODES.MISSING_REQUIRED_FIELD,
      400,
      { originalError: error.message }
    );
  }
  
  if (message.includes('no such table') || message.includes('no such column')) {
    return createApiError(
      'Database schema error',
      ERROR_CODES.DATABASE_ERROR,
      500,
      { originalError: error.message }
    );
  }
  
  // Generic database error
  return createApiError(
    'Database operation failed',
    ERROR_CODES.DATABASE_ERROR,
    500,
    { originalError: error.message }
  );
}

/**
 * Validation error handler
 */
export function handleValidationError(field: string, message: string): ApiError {
  return createApiError(
    `Validation failed for field '${field}': ${message}`,
    ERROR_CODES.VALIDATION_ERROR,
    400,
    { field, validationMessage: message }
  );
}

/**
 * Authentication error handler
 */
export function handleAuthError(message: string = 'Authentication failed'): ApiError {
  return createApiError(
    message,
    ERROR_CODES.AUTHENTICATION_FAILED,
    401
  );
}

/**
 * Authorization error handler
 */
export function handleAuthorizationError(
  message: string = 'Insufficient permissions'
): ApiError {
  return createApiError(
    message,
    ERROR_CODES.AUTHORIZATION_DENIED,
    403
  );
}

/**
 * Not found error handler
 */
export function handleNotFoundError(
  resource: string = 'Resource'
): ApiError {
  return createApiError(
    `${resource} not found`,
    ERROR_CODES.RESOURCE_NOT_FOUND,
    404
  );
}

/**
 * Business logic error handler
 */
export function handleBusinessError(
  message: string,
  details?: any
): ApiError {
  return createApiError(
    message,
    ERROR_CODES.BUSINESS_RULE_VIOLATION,
    400,
    details
  );
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler<T extends any[], R>(
  fn: (...args: any) => Promise<R>
) {
  return (...args: any): Promise<R> => {
    const [c] = args as unknown as [any, ...any[]];
    return Promise.resolve(fn(...args)).catch((error) => {
      throw error; // Let the error handling middleware catch it
    });
  };
}

/**
 * Utility to safely parse JSON and handle errors
 */
export async function safeJsonParse(
  c: Context,
  validator?: (data: any) => data is T
): Promise {
  try {
    const data = await c.req.json();
    if (validator && !validator(data)) {
      throw createApiError(
        'Invalid JSON structure',
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }
    
    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw createApiError(
        'Invalid JSON format',
        ERROR_CODES.INVALID_INPUT,
        400
      );
    }
    throw error;
  }
}