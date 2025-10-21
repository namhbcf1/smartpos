import { Context } from 'hono';
import { ApiResponse } from '../types';

/**
 * Standardized response helpers to ensure consistent API responses
 * All API endpoints should use these helpers instead of directly calling c.json();
 */

/**
 * Send a successful response
 */
export function sendSuccess(
  c: Context,
  data: any,
  message?: string,
  statusCode: number = 200
): Response {
  const response: ApiResponse = {
    success: true,
    data,
    message: message || 'Operation completed successfully',
    timestamp: new Date().toISOString(),
  };

  return c.json(response, statusCode as any);
}

/**
 * Send an error response
 */
export function sendError(
  c: Context,
  message: string,
  statusCode: number = 500,
  errorCode?: string,
  details?: any
): Response {
  const response: ApiResponse<null> = {
    success: false,
    data: null,
    message,
    error: errorCode,
    timestamp: new Date().toISOString(),
    ...(details && { details }),
  };

  return c.json(response, statusCode as any);
}

/**
 * Send a validation error response
 */
export function sendValidationError(
  c: Context,
  message: string,
  validationErrors?: Record<string, string[]>
): Response {
  return sendError(c, message, 400, 'VALIDATION_ERROR', validationErrors);
}

/**
 * Send a not found error response
 */
export function sendNotFound(
  c: Context,
  resource: string = 'Resource'
): Response {
  return sendError(c, `${resource} not found`, 404, 'NOT_FOUND');
}

/**
 * Send an unauthorized error response
 */
export function sendUnauthorized(
  c: Context,
  message: string = 'Authentication required'
): Response {
  return sendError(c, message, 401, 'UNAUTHORIZED');
}

/**
 * Send a forbidden error response
 */
export function sendForbidden(
  c: Context,
  message: string = 'Access forbidden'
): Response {
  return sendError(c, message, 403, 'FORBIDDEN');
}

/**
 * Send a paginated success response
 */
export function sendPaginatedSuccess(
  c: Context,
  data: any[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
  message?: string
): Response {
  const response: ApiResponse<{
    data: any[];
    pagination: anyypeof pagination;
  }> = {
    success: true,
    data: {
      data,
      pagination,
    },
    message: message || 'Data retrieved successfully',
    timestamp: new Date().toISOString(),
  };

  return c.json(response);
}

/**
 * Send a created resource response
 */
export function sendCreated(
  c: Context,
  data: any,
  message?: string
): Response {
  return sendSuccess(c, data, message || 'Resource created successfully', 201);
}

/**
 * Send an updated resource response
 */
export function sendUpdated(
  c: Context,
  data: any,
  message?: string
): Response {
  return sendSuccess(c, data, message || 'Resource updated successfully');
}

/**
 * Send a deleted resource response
 */
export function sendDeleted(
  c: Context,
  message?: string
): Response {
  return sendSuccess(c, null, message || 'Resource deleted successfully');
}

/**
 * Handle database errors and send appropriate response
 */
export function handleDatabaseError(
  c: Context,
  error: Error,
  operation: string = 'Database operation'
): Response {
  console.error(`${operation} error:`, error);

  // Check for specific database errors
  if (error.message.includes('UNIQUE constraint failed')) {
    return sendError(c, 'Resource already exists', 409, 'DUPLICATE_RESOURCE');
  }

  if (error.message.includes('FOREIGN KEY constraint failed')) {
    return sendError(c, 'Referenced resource not found', 400, 'INVALID_REFERENCE');
  }

  if (error.message.includes('NOT NULL constraint failed')) {
    return sendError(c, 'Required field is missing', 400, 'MISSING_REQUIRED_FIELD');
  }

  // Generic database error
  return sendError(c, `${operation} failed`, 500, 'DATABASE_ERROR');
}

/**
 * Handle async operations with proper error handling
 */
export async function handleAsyncOperation(
  c: Context,
  operation: () => Promise,
  successMessage?: string,
  errorMessage?: string
): Promise<Response> {
  try {
    const result = await operation();
    return sendSuccess(c, result, successMessage);
  } catch (error) {
    return handleDatabaseError(c, error as Error, errorMessage);
  }
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  c: Context,
  data: Record<string, any>,
  requiredFields: string[]
): Response | null {
  const missingFields = requiredFields.filter(field => 
    data[field] === undefined || data[field] === null || data[field] === ''
  );

  if (missingFields.length > 0) {
    return sendValidationError(
      c,
      'Missing required fields',
      { missingFields: [`Required fields: ${missingFields.join(', ')}`] }
    );
  }

  return null;
}

/**
 * Validate numeric ID parameter
 */
export function validateIdParam(c: Context, paramName: string = 'id'): number | Response {
  const id = parseInt(c.req.param(paramName));
  
  if (isNaN(id) || id <= 0) {
    return sendValidationError(c, `Invalid ${paramName} parameter`);
  }
  
  return id;
}