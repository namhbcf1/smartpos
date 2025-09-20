/**
 * Response Normalizer Utility
 * Chuẩn hóa tất cả API responses theo format nhất quán
 */

export interface StandardResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  timestamp: string;
  requestId?: string;
}

export interface ErrorDetails {
  field?: string;
  code?: string;
  message: string;
}

export interface ValidationErrorResponse extends StandardResponse {
  errors?: ErrorDetails[];
}

export class ResponseNormalizer {
  /**
   * Success response
   */
  static success<T>(data?: T, message?: string, requestId?: string): StandardResponse<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
      requestId
    };
  }

  /**
   * Error response
   */
  static error(
    message: string,
    error?: string,
    code?: string,
    requestId?: string
  ): StandardResponse {
    return {
      success: false,
      message,
      error,
      code,
      timestamp: new Date().toISOString(),
      requestId
    };
  }

  /**
   * Validation error response
   */
  static validationError(
    errors: ErrorDetails[],
    message = 'Validation failed',
    requestId?: string
  ): ValidationErrorResponse {
    return {
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
      requestId
    };
  }

  /**
   * Not found error
   */
  static notFound(resource = 'Resource', requestId?: string): StandardResponse {
    return {
      success: false,
      message: `${resource} not found`,
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString(),
      requestId
    };
  }

  /**
   * Unauthorized error
   */
  static unauthorized(message = 'Unauthorized access', requestId?: string): StandardResponse {
    return {
      success: false,
      message,
      code: 'UNAUTHORIZED',
      timestamp: new Date().toISOString(),
      requestId
    };
  }

  /**
   * Forbidden error
   */
  static forbidden(message = 'Access forbidden', requestId?: string): StandardResponse {
    return {
      success: false,
      message,
      code: 'FORBIDDEN',
      timestamp: new Date().toISOString(),
      requestId
    };
  }

  /**
   * Internal server error
   */
  static internalError(message = 'Internal server error', requestId?: string): StandardResponse {
    return {
      success: false,
      message,
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
      requestId
    };
  }

  /**
   * Bad request error
   */
  static badRequest(message = 'Bad request', requestId?: string): StandardResponse {
    return {
      success: false,
      message,
      code: 'BAD_REQUEST',
      timestamp: new Date().toISOString(),
      requestId
    };
  }

  /**
   * Convert any response to normalized format
   */
  static normalize(response: any, requestId?: string): StandardResponse {
    if (response && typeof response === 'object') {
      // If already normalized
      if ('success' in response && 'timestamp' in response) {
        return { ...response, requestId: requestId || response.requestId };
      }

      // If has error property
      if ('error' in response) {
        return this.error(
          response.message || 'Request failed',
          response.error,
          response.code,
          requestId
        );
      }

      // If has data property
      if ('data' in response) {
        return this.success(response.data, response.message, requestId);
      }

      // Default success with data
      return this.success(response, undefined, requestId);
    }

    // Primitive response
    return this.success(response, undefined, requestId);
  }

  /**
   * Paginated response
   */
  static paginated<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
    requestId?: string
  ): StandardResponse<{
    items: T[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const pages = Math.ceil(total / limit);

    return this.success({
      items,
      pagination: {
        total,
        page,
        limit,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1
      }
    }, undefined, requestId);
  }
}

/**
 * Response middleware for Hono
 */
export function responseMiddleware() {
  return async (c: any, next: any) => {
    // Add request ID to context
    const requestId = c.req.header('X-Request-ID') || crypto.randomUUID();
    c.set('requestId', requestId);
    c.header('X-Request-ID', requestId);

    await next();

    // Normalize response if not already done
    const response = c.res.body;
    if (response && typeof response === 'string') {
      try {
        const parsed = JSON.parse(response);
        if (!parsed.timestamp) {
          const normalized = ResponseNormalizer.normalize(parsed, requestId);
          c.res = new Response(JSON.stringify(normalized), {
            status: c.res.status,
            headers: c.res.headers
          });
        }
      } catch (e) {
        // Not JSON, leave as is
      }
    }
  };
}