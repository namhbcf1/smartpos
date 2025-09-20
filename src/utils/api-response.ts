/**
 * Standardized API Response Utilities
 * Consistent response formatting for all API endpoints
 */

import type { ApiResponse, ApiError, ApiMeta, PaginatedResponse, PaginationInfo } from '../types/api-standard';

// =============================================================================
// SUCCESS RESPONSE BUILDERS
// =============================================================================

export function createSuccessResponse<T>(
  data: T, 
  message: string = 'Operation completed successfully',
  meta?: ApiMeta
): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    meta
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  pagination: PaginationInfo,
  message: string = 'Data retrieved successfully',
  meta?: ApiMeta
): ApiResponse<PaginatedResponse<T>> {
  return {
    success: true,
    data: {
      data,
      pagination
    },
    message,
    timestamp: new Date().toISOString(),
    meta
  };
}

// =============================================================================
// ERROR RESPONSE BUILDERS
// =============================================================================

export function createErrorResponse(
  message: string,
  errors: ApiError[] = [],
  statusCode: number = 500,
  meta?: ApiMeta
): ApiResponse<null> {
  return {
    success: false,
    data: null,
    message,
    timestamp: new Date().toISOString(),
    errors,
    meta: {
      ...meta,
      statusCode
    }
  };
}

export function createValidationErrorResponse(
  errors: ApiError[],
  message: string = 'Validation failed'
): ApiResponse<null> {
  return createErrorResponse(message, errors, 400);
}

export function createNotFoundResponse(
  resource: string = 'Resource',
  id?: string
): ApiResponse<null> {
  const message = id 
    ? `${resource} with ID '${id}' not found`
    : `${resource} not found`;
  
  return createErrorResponse(message, [], 404);
}

export function createUnauthorizedResponse(
  message: string = 'Authentication required'
): ApiResponse<null> {
  return createErrorResponse(message, [], 401);
}

export function createForbiddenResponse(
  message: string = 'Access denied'
): ApiResponse<null> {
  return createErrorResponse(message, [], 403);
}

// =============================================================================
// ERROR BUILDERS
// =============================================================================

export function createApiError(
  code: string,
  message: string,
  field?: string,
  details?: any
): ApiError {
  return {
    code,
    message,
    field,
    details
  };
}

export function createValidationError(
  field: string,
  message: string,
  value?: any
): ApiError {
  return createApiError('VALIDATION_ERROR', message, field, { value });
}

export function createDatabaseError(
  message: string,
  query?: string
): ApiError {
  return createApiError('DATABASE_ERROR', message, undefined, { query });
}

// =============================================================================
// PAGINATION HELPERS
// =============================================================================

export function createPaginationInfo(
  page: number,
  limit: number,
  total: number
): PaginationInfo {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}

export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

export function validatePaginationParams(
  page?: number | string,
  limit?: number | string
): { page: number; limit: number } {
  const defaultPage = 1;
  const defaultLimit = 10;
  const maxLimit = 100;

  let validPage = defaultPage;
  let validLimit = defaultLimit;

  // Validate page
  if (page !== undefined) {
    const parsedPage = typeof page === 'string' ? parseInt(page) : page;
    if (!isNaN(parsedPage) && parsedPage > 0) {
      validPage = parsedPage;
    }
  }

  // Validate limit
  if (limit !== undefined) {
    const parsedLimit = typeof limit === 'string' ? parseInt(limit) : limit;
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      validLimit = Math.min(parsedLimit, maxLimit);
    }
  }

  return { page: validPage, limit: validLimit };
}

// =============================================================================
// RESPONSE MIDDLEWARE FOR HONO
// =============================================================================

import type { Context, Next } from 'hono';

export function responseMiddleware() {
  return async (c: Context, next: Next) => {
    // Add response helpers to context
    c.set('success', <T>(data: T, message?: string, meta?: ApiMeta) => 
      createSuccessResponse(data, message, meta)
    );
    
    c.set('paginated', <T>(data: T[], pagination: PaginationInfo, message?: string, meta?: ApiMeta) =>
      createPaginatedResponse(data, pagination, message, meta)
    );
    
    c.set('error', (message: string, errors?: ApiError[], statusCode?: number, meta?: ApiMeta) =>
      createErrorResponse(message, errors, statusCode, meta)
    );
    
    c.set('notFound', (resource?: string, id?: string) =>
      createNotFoundResponse(resource, id)
    );
    
    c.set('unauthorized', (message?: string) =>
      createUnauthorizedResponse(message)
    );
    
    c.set('forbidden', (message?: string) =>
      createForbiddenResponse(message)
    );
    
    c.set('validation', (errors: ApiError[], message?: string) =>
      createValidationErrorResponse(errors, message)
    );

    await next();
  };
}

// =============================================================================
// COMMON SUCCESS MESSAGES (Vietnamese)
// =============================================================================

export const SUCCESS_MESSAGES = {
  // CRUD Operations
  CREATED: 'Tạo mới thành công',
  UPDATED: 'Cập nhật thành công', 
  DELETED: 'Xóa thành công',
  RETRIEVED: 'Lấy dữ liệu thành công',
  
  // Auth
  LOGIN_SUCCESS: 'Đăng nhập thành công',
  LOGOUT_SUCCESS: 'Đăng xuất thành công',
  PASSWORD_CHANGED: 'Đổi mật khẩu thành công',
  PASSWORD_RESET: 'Đặt lại mật khẩu thành công',
  
  // Products
  PRODUCT_CREATED: 'Tạo sản phẩm thành công',
  PRODUCT_UPDATED: 'Cập nhật sản phẩm thành công',
  PRODUCT_DELETED: 'Xóa sản phẩm thành công',
  
  // Customers
  CUSTOMER_CREATED: 'Tạo khách hàng thành công',
  CUSTOMER_UPDATED: 'Cập nhật khách hàng thành công',
  
  // Sales
  INVOICE_CREATED: 'Tạo hóa đơn thành công',
  PAYMENT_PROCESSED: 'Thanh toán thành công',
  
  // Inventory
  STOCK_UPDATED: 'Cập nhật tồn kho thành công',
  STOCK_TRANSFERRED: 'Chuyển kho thành công',
  
  // Warranty
  WARRANTY_CREATED: 'Tạo bảo hành thành công',
  CLAIM_SUBMITTED: 'Gửi yêu cầu bảo hành thành công'
} as const;

// =============================================================================
// COMMON ERROR MESSAGES (Vietnamese)
// =============================================================================

export const ERROR_MESSAGES = {
  // General
  INTERNAL_ERROR: 'Lỗi hệ thống',
  INVALID_REQUEST: 'Yêu cầu không hợp lệ',
  VALIDATION_FAILED: 'Dữ liệu không hợp lệ',
  
  // Auth
  INVALID_CREDENTIALS: 'Tài khoản hoặc mật khẩu không đúng',
  TOKEN_EXPIRED: 'Phiên đăng nhập đã hết hạn',
  TOKEN_INVALID: 'Token không hợp lệ',
  ACCOUNT_LOCKED: 'Tài khoản đã bị khóa',
  INSUFFICIENT_PERMISSIONS: 'Không đủ quyền truy cập',
  
  // Not Found
  USER_NOT_FOUND: 'Không tìm thấy người dùng',
  PRODUCT_NOT_FOUND: 'Không tìm thấy sản phẩm',
  CUSTOMER_NOT_FOUND: 'Không tìm thấy khách hàng',
  INVOICE_NOT_FOUND: 'Không tìm thấy hóa đơn',
  
  // Duplicates
  EMAIL_EXISTS: 'Email đã tồn tại',
  USERNAME_EXISTS: 'Tên đăng nhập đã tồn tại',
  SKU_EXISTS: 'Mã SKU đã tồn tại',
  BARCODE_EXISTS: 'Mã vạch đã tồn tại',
  
  // Business Logic
  INSUFFICIENT_STOCK: 'Không đủ hàng trong kho',
  INVALID_PRICE: 'Giá không hợp lệ',
  INVALID_DISCOUNT: 'Giảm giá không hợp lệ',
  PAYMENT_FAILED: 'Thanh toán thất bại',
  
  // Database
  DATABASE_ERROR: 'Lỗi cơ sở dữ liệu',
  CONNECTION_ERROR: 'Lỗi kết nối cơ sở dữ liệu'
} as const;

// =============================================================================
// ERROR CODES
// =============================================================================

export const ERROR_CODES = {
  // Validation
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_LENGTH: 'INVALID_LENGTH',
  INVALID_VALUE: 'INVALID_VALUE',
  
  // Authentication
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  
  // Authorization
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ACCESS_DENIED: 'ACCESS_DENIED',
  
  // Resources
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  RESOURCE_GONE: 'RESOURCE_GONE',
  
  // Business Logic
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  INVALID_OPERATION: 'INVALID_OPERATION',
  
  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR'
} as const;