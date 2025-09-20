/**
 * Enhanced Error Handling Service
 * Provides comprehensive error handling for API responses and validation
 * Rules.md compliant - handles real backend error responses
 */

import { AxiosError } from 'axios';
import { enhancedRealtimeService } from './enhancedRealtimeService';

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  errors?: Record<string, string[]>;
  validation_errors?: ValidationError[];
  code?: string;
  details?: Record<string, any>;
}

export interface ErrorContext {
  endpoint: string;
  method: string;
  requestId?: string;
  userId?: number;
  timestamp: string;
}

export interface ErrorNotification {
  id: string;
  type: 'error' | 'warning' | 'validation';
  title: string;
  message: string;
  context?: ErrorContext;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
  autoHide?: boolean;
  duration?: number;
}

class ErrorHandlingService {
  private errorListeners: Array<(error: ErrorNotification) => void> = [];
  private errorHistory: ErrorNotification[] = [];
  private maxHistorySize = 100;

  constructor() {
    this.setupGlobalErrorHandlers();
  }

  /**
   * Handle API errors from Axios responses
   */
  handleApiError(error: AxiosError, context?: Partial<ErrorContext>): ErrorNotification {
    const errorResponse = error.response?.data as ErrorResponse;
    const status = error.response?.status;
    // Request ID tracking removed to prevent CORS issues
    const requestId = undefined;

    const errorContext: ErrorContext = {
      endpoint: error.config?.url || 'unknown',
      method: error.config?.method?.toUpperCase() || 'unknown',
      requestId,
      timestamp: new Date().toISOString(),
      ...context
    };

    let notification: ErrorNotification;

    switch (status) {
      case 400:
        notification = this.handleBadRequestError(errorResponse, errorContext);
        break;
      case 401:
        notification = this.handleUnauthorizedError(errorResponse, errorContext);
        break;
      case 403:
        notification = this.handleForbiddenError(errorResponse, errorContext);
        break;
      case 404:
        notification = this.handleNotFoundError(errorResponse, errorContext);
        break;
      case 422:
        notification = this.handleValidationError(errorResponse, errorContext);
        break;
      case 429:
        notification = this.handleRateLimitError(errorResponse, errorContext);
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        notification = this.handleServerError(errorResponse, errorContext, status);
        break;
      default:
        notification = this.handleGenericError(error, errorContext);
    }

    this.notifyError(notification);
    this.logError(notification);

    return notification;
  }

  /**
   * Handle validation errors (400/422)
   */
  private handleValidationError(errorResponse: ErrorResponse, context: ErrorContext): ErrorNotification {
    const validationErrors = errorResponse.validation_errors || [];
    const fieldErrors = errorResponse.errors || {};

    let message = 'Dữ liệu không hợp lệ:';
    
    // Process Zod validation errors
    if (validationErrors.length > 0) {
      message += '\n' + validationErrors.map(err => `• ${err.field}: ${err.message}`).join('\n');
    }
    
    // Process field errors
    if (Object.keys(fieldErrors).length > 0) {
      message += '\n' + Object.entries(fieldErrors)
        .map(([field, errors]) => `• ${field}: ${errors.join(', ')}`)
        .join('\n');
    }

    return {
      id: this.generateErrorId(),
      type: 'validation',
      title: 'Lỗi xác thực dữ liệu',
      message: message || errorResponse.message || 'Dữ liệu không hợp lệ',
      context,
      autoHide: false,
      actions: [
        {
          label: 'Đóng',
          action: () => this.dismissError(this.generateErrorId())
        }
      ]
    };
  }

  /**
   * Handle bad request errors (400)
   */
  private handleBadRequestError(errorResponse: ErrorResponse, context: ErrorContext): ErrorNotification {
    return {
      id: this.generateErrorId(),
      type: 'error',
      title: 'Yêu cầu không hợp lệ',
      message: errorResponse.message || 'Yêu cầu không thể được xử lý',
      context,
      autoHide: true,
      duration: 5000
    };
  }

  /**
   * Handle unauthorized errors (401)
   */
  private handleUnauthorizedError(_errorResponse: ErrorResponse, context: ErrorContext): ErrorNotification {
    return {
      id: this.generateErrorId(),
      type: 'error',
      title: 'Phiên đăng nhập hết hạn',
      message: 'Vui lòng đăng nhập lại để tiếp tục',
      context,
      autoHide: false,
      actions: [
        {
          label: 'Đăng nhập lại',
          action: () => {
            window.location.href = '/login';
          }
        }
      ]
    };
  }

  /**
   * Handle forbidden errors (403)
   */
  private handleForbiddenError(errorResponse: ErrorResponse, context: ErrorContext): ErrorNotification {
    return {
      id: this.generateErrorId(),
      type: 'error',
      title: 'Không có quyền truy cập',
      message: errorResponse.message || 'Bạn không có quyền thực hiện thao tác này',
      context,
      autoHide: true,
      duration: 5000
    };
  }

  /**
   * Handle not found errors (404)
   */
  private handleNotFoundError(errorResponse: ErrorResponse, context: ErrorContext): ErrorNotification {
    return {
      id: this.generateErrorId(),
      type: 'error',
      title: 'Không tìm thấy',
      message: errorResponse.message || 'Tài nguyên không tồn tại',
      context,
      autoHide: true,
      duration: 4000
    };
  }

  /**
   * Handle rate limit errors (429)
   */
  private handleRateLimitError(_errorResponse: ErrorResponse, context: ErrorContext): ErrorNotification {
    return {
      id: this.generateErrorId(),
      type: 'warning',
      title: 'Quá nhiều yêu cầu',
      message: 'Vui lòng chờ một chút trước khi thử lại',
      context,
      autoHide: true,
      duration: 6000
    };
  }

  /**
   * Handle server errors (5xx)
   */
  private handleServerError(errorResponse: ErrorResponse, context: ErrorContext, status?: number): ErrorNotification {
    let title = 'Lỗi máy chủ';
    let message = 'Đã xảy ra lỗi trên máy chủ. Vui lòng thử lại sau.';

    switch (status) {
      case 502:
        title = 'Lỗi kết nối';
        message = 'Không thể kết nối đến máy chủ';
        break;
      case 503:
        title = 'Dịch vụ không khả dụng';
        message = 'Hệ thống đang bảo trì. Vui lòng thử lại sau.';
        break;
      case 504:
        title = 'Hết thời gian chờ';
        message = 'Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.';
        break;
    }

    return {
      id: this.generateErrorId(),
      type: 'error',
      title,
      message: errorResponse?.message || message,
      context,
      autoHide: true,
      duration: 8000,
      actions: [
        {
          label: 'Thử lại',
          action: () => {
            window.location.reload();
          }
        }
      ]
    };
  }

  /**
   * Handle generic errors
   */
  private handleGenericError(error: AxiosError, context: ErrorContext): ErrorNotification {
    let message = 'Đã xảy ra lỗi không xác định';

    if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      message = 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.';
    } else if (error.code === 'TIMEOUT') {
      message = 'Yêu cầu hết thời gian chờ. Vui lòng thử lại.';
    }

    return {
      id: this.generateErrorId(),
      type: 'error',
      title: 'Lỗi hệ thống',
      message,
      context,
      autoHide: true,
      duration: 6000
    };
  }

  /**
   * Subscribe to error notifications
   */
  onError(listener: (error: ErrorNotification) => void): () => void {
    this.errorListeners.push(listener);
    
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of an error
   */
  private notifyError(error: ErrorNotification): void {
    this.errorHistory.unshift(error);
    
    // Limit history size
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }

    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (err) {
        console.error('Error in error listener:', err);
      }
    });
  }

  /**
   * Dismiss an error notification
   */
  dismissError(errorId: string): void {
    // Implementation depends on UI framework
    console.log('Dismissing error:', errorId);
  }

  /**
   * Get error history
   */
  getErrorHistory(): ErrorNotification[] {
    return [...this.errorHistory];
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
  }

  /**
   * Log error for debugging
   */
  private logError(error: ErrorNotification): void {
    console.group(`🚨 ${error.type.toUpperCase()}: ${error.title}`);
    console.error('Message:', error.message);
    console.error('Context:', error.context);
    console.error('Timestamp:', error.context?.timestamp);
    console.groupEnd();

    // Send to real-time monitoring if available
    if (enhancedRealtimeService) {
      enhancedRealtimeService.emit('error_logged', {
        error,
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    }
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      const error: ErrorNotification = {
        id: this.generateErrorId(),
        type: 'error',
        title: 'Lỗi không xử lý',
        message: 'Đã xảy ra lỗi không mong muốn',
        context: {
          endpoint: 'unknown',
          method: 'unknown',
          timestamp: new Date().toISOString()
        },
        autoHide: true,
        duration: 5000
      };

      this.notifyError(error);
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      console.error('JavaScript error:', event.error);
      
      const error: ErrorNotification = {
        id: this.generateErrorId(),
        type: 'error',
        title: 'Lỗi JavaScript',
        message: 'Đã xảy ra lỗi trong ứng dụng',
        context: {
          endpoint: event.filename || 'unknown',
          method: 'unknown',
          timestamp: new Date().toISOString()
        },
        autoHide: true,
        duration: 5000
      };

      this.notifyError(error);
    });
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

export const errorHandlingService = new ErrorHandlingService();
