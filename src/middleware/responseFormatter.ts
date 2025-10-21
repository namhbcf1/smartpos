import { Context, Next } from 'hono';

export interface StandardResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
  requestId?: string;
}

export const responseFormatter = async (c: Context, next: Next) => {
  // Generate request ID for tracing
  const requestId = crypto.randomUUID();
  c.set('requestId', requestId);

  // Override json method to standardize responses
  const originalJson = c.json;

  c.json = function(data: any, init?: any) {
    const status = typeof init === 'number' ? init : init?.status || 200;
    const timestamp = new Date().toISOString();

    // If data is already in standard format, use it as-is
    if (data && typeof data === 'object' && 'success' in data) {
      return originalJson.call(this, {
        ...data,
        timestamp,
        requestId
      }, init);
    }

    // For successful responses
    if (!status || (status >= 200 && status < 300)) {
      const response: StandardResponse = {
        success: true,
        data,
        timestamp,
        requestId
      };
      return originalJson.call(this, response, init || status || 200);
    }

    // For error responses
    const response: StandardResponse = {
      success: false,
      error: typeof data === 'string' ? data : data?.error || 'An error occurred',
      code: data?.code || getErrorCode(status || 500),
      timestamp,
      requestId
    };

    return originalJson.call(this, response, init || status);
  };

  await next();
};

function getErrorCode(status: number): string {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'VALIDATION_ERROR';
    case 429:
      return 'RATE_LIMITED';
    case 500:
      return 'INTERNAL_ERROR';
    case 502:
      return 'BAD_GATEWAY';
    case 503:
      return 'SERVICE_UNAVAILABLE';
    case 504:
      return 'GATEWAY_TIMEOUT';
    default:
      return 'UNKNOWN_ERROR';
  }
}

// Helper functions for consistent error responses
export const createErrorResponse = (message: string, code?: string, status: number = 500): StandardResponse => {
  return {
    success: false,
    error: message,
    code: code || getErrorCode(status),
    timestamp: new Date().toISOString()
  };
};

export const createSuccessResponse = <T>(data: T, message?: string): StandardResponse<T> => {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
};

export const createPaginatedResponse = <T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  message?: string
): StandardResponse<T[]> => {
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return {
    success: true,
    data,
    message,
    pagination: {
      ...pagination,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1
    },
    timestamp: new Date().toISOString()
  };
};