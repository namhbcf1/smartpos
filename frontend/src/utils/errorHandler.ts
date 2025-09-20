/**
 * Centralized Error Handling Utilities
 * Provides consistent error handling across the application
 */

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export interface ErrorHandlerOptions {
  showNotification?: boolean;
  fallbackMessage?: string;
  retryCallback?: () => void;
  retryDelay?: number;
  maxRetries?: number;
}

/**
 * Extract error message from various error types
 */
export function extractErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.data?.message) {
    return error.data.message;
  }

  return 'Đã xảy ra lỗi không xác định';
}

/**
 * Create standardized API error object
 */
export function createApiError(error: any): ApiError {
  return {
    message: extractErrorMessage(error),
    code: error?.response?.data?.code || error?.code,
    status: error?.response?.status || error?.status,
    details: error?.response?.data || error?.data
  };
}

/**
 * Handle API errors with consistent behavior
 */
export function handleApiError(
  error: any,
  options: ErrorHandlerOptions = {}
): ApiError {
  const {
    fallbackMessage = 'Đã xảy ra lỗi khi kết nối với máy chủ',
    retryCallback,
    retryDelay = 3000,
    // maxRetries = 3
  } = options;

  const apiError = createApiError(error);
  
  // Log error for debugging
  console.error('API Error:', {
    message: apiError.message,
    status: apiError.status,
    code: apiError.code,
    details: apiError.details
  });

  // Handle specific error types
  if (apiError.status === 401) {
    // Authentication error - redirect to login
    console.warn('Authentication error - user needs to login');
    // Could trigger logout here
  } else if (apiError.status === 403) {
    // Authorization error
    console.warn('Authorization error - insufficient permissions');
  } else if (apiError.status === 404) {
    // Not found error
    console.warn('Resource not found');
  } else if (apiError.status && apiError.status >= 500) {
    // Server error - might want to retry
    console.error('Server error - considering retry');
    if (retryCallback && retryDelay > 0) {
      setTimeout(retryCallback, retryDelay);
    }
  }

  // Use fallback message if error message is too technical
  if (apiError.message.includes('fetch') || 
      apiError.message.includes('network') ||
      apiError.message.includes('ECONNREFUSED')) {
    apiError.message = fallbackMessage;
  }

  return apiError;
}

/**
 * Retry wrapper for async operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt}/${maxRetries} failed:`, extractErrorMessage(error));
      
      if (attempt < maxRetries) {
        // Exponential backoff delay for real API retry (not simulation)
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError;
}

/**
 * Validation error handler
 */
export function handleValidationError(error: any): string[] {
  if (error?.response?.data?.errors) {
    return error.response.data.errors.map((err: any) => err.message || err);
  }

  if (error?.errors && Array.isArray(error.errors)) {
    return error.errors.map((err: any) => err.message || err);
  }

  return [extractErrorMessage(error)];
}

/**
 * Network error detector
 */
export function isNetworkError(error: any): boolean {
  return (
    !error.response ||
    error.code === 'NETWORK_ERROR' ||
    error.message?.includes('Network Error') ||
    error.message?.includes('fetch')
  );
}

/**
 * Authentication error detector
 */
export function isAuthError(error: any): boolean {
  return error?.response?.status === 401 || error?.status === 401;
}

/**
 * Server error detector
 */
export function isServerError(error: any): boolean {
  const status = error?.response?.status || error?.status;
  return status >= 500;
}

/**
 * Error boundary helper
 */
export function createErrorBoundaryHandler(componentName: string) {
  return (error: Error, errorInfo: any) => {
    console.error(`Error in ${componentName}:`, error);
    console.error('Error info:', errorInfo);
    
    // Could send to error reporting service here
    // reportError(error, { component: componentName, ...errorInfo });
  };
}

/**
 * Form validation error formatter
 */
export function formatValidationErrors(errors: any): Record<string, string> {
  const formatted: Record<string, string> = {};

  if (Array.isArray(errors)) {
    errors.forEach((error, index) => {
      if (error.path) {
        formatted[error.path] = error.message;
      } else {
        formatted[`error_${index}`] = error.message || error;
      }
    });
  } else if (typeof errors === 'object') {
    Object.keys(errors).forEach(key => {
      formatted[key] = errors[key].message || errors[key];
    });
  }

  return formatted;
}

/**
 * Safe async operation wrapper
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  fallback: T,
  errorHandler?: (error: any) => void
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (errorHandler) {
      errorHandler(error);
    } else {
      console.error('Safe async operation failed:', extractErrorMessage(error));
    }
    return fallback;
  }
}
