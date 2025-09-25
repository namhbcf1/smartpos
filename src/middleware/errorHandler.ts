/**
 * Standardized Error Handling Middleware
 *
 * Provides consistent error responses and logging across all API endpoints
 * with proper status codes and secure error messages.
 */

import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import { createValidationError, ErrorResponse } from '../types/api';

// Standard error codes
export const ErrorCodes = {
  // Authentication & Authorization
  NO_TOKEN: 'NO_TOKEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Business Logic
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',

  // System
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Generic
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
} as const;

export interface StandardErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
  timestamp: string;
  path: string;
  request_id?: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Predefined error creators
export const createError = {
  badRequest: (message: string, details?: any) =>
    new AppError(message, 400, ErrorCodes.BAD_REQUEST, details),

  unauthorized: (message = 'Authentication required') =>
    new AppError(message, 401, ErrorCodes.NO_TOKEN),

  forbidden: (message = 'Insufficient permissions') =>
    new AppError(message, 403, ErrorCodes.INSUFFICIENT_PERMISSIONS),

  notFound: (resource = 'Resource') =>
    new AppError(`${resource} not found`, 404, ErrorCodes.RESOURCE_NOT_FOUND),

  conflict: (message: string) =>
    new AppError(message, 409, ErrorCodes.RESOURCE_CONFLICT),

  validation: (message: string, details?: any) =>
    new AppError(message, 422, ErrorCodes.VALIDATION_ERROR, details),

  tooManyRequests: (message = 'Rate limit exceeded') =>
    new AppError(message, 429, ErrorCodes.RATE_LIMIT_EXCEEDED),

  internal: (message = 'Internal server error') =>
    new AppError(message, 500, ErrorCodes.INTERNAL_ERROR),

  database: (message = 'Database operation failed') =>
    new AppError(message, 500, ErrorCodes.DATABASE_ERROR),
};

// Main error handling middleware
export const errorHandler = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    return handleError(error, c);
  }
};

// Central error handling function
export const handleError = (error: any, c: Context): Response => {
  const requestId = c.get('requestId') || generateRequestId();
  const isProduction = c.env?.NODE_ENV === 'production';

  // Log error with context
  logError(error, {
    requestId,
    path: c.req.url,
    method: c.req.method,
    userAgent: c.req.header('user-agent'),
    ip: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for'),
  });

  let statusCode = 500;
  let message = 'Internal Server Error';
  let code: string | undefined;
  let details: any = undefined;

  // Handle different error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
    details = error.details;
  } else if (error instanceof HTTPException) {
    statusCode = error.status;
    message = error.message;
  } else if (error instanceof ZodError) {
    return c.json(createValidationError(error), 422);
  } else if (error.name === 'ValidationError' || error.name === 'ZodError') {
    statusCode = 422;
    message = 'Validation failed';
    code = ErrorCodes.VALIDATION_ERROR;
    details = error.details || error.issues;
  } else if (error.code === 'SQLITE_CONSTRAINT') {
    statusCode = 409;
    message = 'Data constraint violation';
    code = ErrorCodes.DATABASE_ERROR;
  } else if (error.code === 'SQLITE_BUSY') {
    statusCode = 503;
    message = 'Database is busy, please try again';
    code = ErrorCodes.DATABASE_ERROR;
  } else if (error.code === 'D1_ERROR') {
    statusCode = 500;
    message = isProduction ? 'Database error' : error.message;
    code = ErrorCodes.DATABASE_ERROR;
  }

  // Security: Don't expose internal details in production
  if (isProduction && statusCode === 500) {
    message = 'Internal server error';
    details = undefined;
  }

  const errorResponse: StandardErrorResponse = {
    success: false,
    error: message,
    code,
    details,
    timestamp: new Date().toISOString(),
    path: c.req.url,
    request_id: requestId,
  };

  return c.json(errorResponse, statusCode as any);
};

// Utility functions
const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2)}`;
};

const logError = (error: any, context: any) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const logLevel = process.env.LOG_LEVEL || 'info';

  if (logLevel === 'error' || !isProduction) {
    console.error('API Error:', {
      error: {
        name: error.name,
        message: error.message,
        stack: isProduction ? undefined : error.stack,
        code: error.code,
        statusCode: error.statusCode,
      },
      context,
      timestamp: new Date().toISOString(),
    });
  }
};

const getErrorName = (statusCode: number): string => {
  switch (statusCode) {
    case 400: return 'Bad Request';
    case 401: return 'Unauthorized';
    case 403: return 'Forbidden';
    case 404: return 'Not Found';
    case 409: return 'Conflict';
    case 422: return 'Unprocessable Entity';
    case 429: return 'Too Many Requests';
    case 500: return 'Internal Server Error';
    case 502: return 'Bad Gateway';
    case 503: return 'Service Unavailable';
    case 504: return 'Gateway Timeout';
    default: return 'Unknown Error';
  }
};

// Utility functions for throwing common errors
export const throwBadRequest = (message: string, code?: string) => {
  throw new AppError(message, 400, code);
};

export const throwUnauthorized = (message: string = 'Unauthorized', code?: string) => {
  throw new AppError(message, 401, code);
};

export const throwForbidden = (message: string = 'Forbidden', code?: string) => {
  throw new AppError(message, 403, code);
};

export const throwNotFound = (message: string = 'Not Found', code?: string) => {
  throw new AppError(message, 404, code);
};

export const throwConflict = (message: string, code?: string) => {
  throw new AppError(message, 409, code);
};

export const throwValidationError = (message: string, details?: any) => {
  const error = new AppError(message, 422, 'VALIDATION_ERROR');
  (error as any).details = details;
  throw error;
};

export const throwInternalError = (message: string = 'Internal Server Error', code?: string) => {
  throw new AppError(message, 500, code);
};
