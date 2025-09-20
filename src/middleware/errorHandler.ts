import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';

export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: any;
  timestamp: string;
  path: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    return handleError(error, c);
  }
};

export const handleError = (error: any, c: Context): Response => {
  console.error('Error occurred:', error);

  let statusCode = 500;
  let message = 'Internal Server Error';
  let code: string | undefined;
  let details: any = undefined;

  // Handle different types of errors
  if (error instanceof HTTPException) {
    statusCode = error.status;
    message = error.message;
  } else if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    details = error.details || error.message;
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Not Found';
  } else if (error.code === 'SQLITE_CONSTRAINT') {
    statusCode = 409;
    message = 'Data conflict';
    code = 'CONSTRAINT_VIOLATION';
  } else if (error.code === 'SQLITE_BUSY') {
    statusCode = 503;
    message = 'Service temporarily unavailable';
    code = 'DATABASE_BUSY';
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal Server Error';
    details = undefined;
  }

  const errorResponse: ErrorResponse = {
    error: getErrorName(statusCode),
    message,
    code,
    details,
    timestamp: new Date().toISOString(),
    path: c?.req?.url || 'unknown',
  };

  return c.json(errorResponse, statusCode as any);
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
