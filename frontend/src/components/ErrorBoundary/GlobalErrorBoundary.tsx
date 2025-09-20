import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home, Bug, Mail } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  resetOnPropsChange?: any;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string | null;
}

/**
 * Enhanced Error Boundary with comprehensive error handling
 * Provides graceful degradation and error reporting capabilities
 */
class GlobalErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error details for debugging
    console.error('🚨 Error Boundary Caught:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Report error to monitoring service
    this.reportError(error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    const { resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset error boundary when resetOnPropsChange prop changes
    if (hasError && prevProps.resetOnPropsChange !== resetOnPropsChange) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    // In production, send error to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error monitoring service
      // errorMonitoringService.captureException(error, { extra: errorInfo });
    }

    // Log to browser console for development
    console.group('🔍 Error Boundary Details');
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();
  };

  private resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  private handleRetry = () => {
    this.resetErrorBoundary();
    
    // Attempt to reload the current page data
    window.location.reload();
  };

  private handleGoHome = () => {
    this.resetErrorBoundary();
    window.location.href = '/';
  };

  private copyErrorDetails = () => {
    const { error, errorInfo, errorId } = this.state;
    
    const errorDetails = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
    
    // Show feedback (you could replace with a toast notification)
    alert('Error details copied to clipboard!');
  };

  private getErrorType = (error: Error): string => {
    if (error.message.includes('ChunkLoadError')) return 'CHUNK_LOAD_ERROR';
    if (error.message.includes('Network Error')) return 'NETWORK_ERROR';
    if (error.message.includes('Permission denied')) return 'PERMISSION_ERROR';
    if (error.name === 'TypeError') return 'TYPE_ERROR';
    return 'UNKNOWN_ERROR';
  };

  private getErrorMessage = (error: Error): { title: string; description: string } => {
    const errorType = this.getErrorType(error);
    
    switch (errorType) {
      case 'CHUNK_LOAD_ERROR':
        return {
          title: 'Cập nhật ứng dụng',
          description: 'Ứng dụng đã được cập nhật. Vui lòng tải lại trang để sử dụng phiên bản mới nhất.',
        };
      case 'NETWORK_ERROR':
        return {
          title: 'Lỗi kết nối',
          description: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet và thử lại.',
        };
      case 'PERMISSION_ERROR':
        return {
          title: 'Không đủ quyền truy cập',
          description: 'Bạn không có quyền truy cập tính năng này. Vui lòng liên hệ quản trị viên.',
        };
      default:
        return {
          title: 'Đã xảy ra lỗi',
          description: 'Một lỗi không mong muốn đã xảy ra. Chúng tôi đã ghi nhận và sẽ khắc phục sớm nhất có thể.',
        };
    }
  };

  render() {
    const { hasError, error, errorId } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Render custom fallback if provided
      if (fallback) {
        return fallback;
      }

      const { title, description } = this.getErrorMessage(error!);
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100  flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            {/* Error Card */}
            <div className="bg-white  rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-8 text-white">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-full">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">{title}</h1>
                    <p className="text-red-100 mt-1">Error ID: {errorId}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <p className="text-gray-600 leading-relaxed">
                  {description}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={this.handleRetry}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    <RefreshCcw className="w-5 h-5 mr-2" />
                    Thử lại
                  </button>

                  <button
                    onClick={this.handleGoHome}
                    className="inline-flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    <Home className="w-5 h-5 mr-2" />
                    Về trang chủ
                  </button>

                  {isDevelopment && (
                    <button
                      onClick={this.copyErrorDetails}
                      className="inline-flex items-center px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors duration-200"
                    >
                      <Bug className="w-5 h-5 mr-2" />
                      Copy lỗi chi tiết
                    </button>
                  )}

                  <a
                    href="mailto:support@smartpos.com?subject=Error Report"
                    className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    Báo cáo lỗi
                  </a>
                </div>

                {/* Development Error Details */}
                {isDevelopment && error && (
                  <details className="mt-6">
                    <summary className="cursor-pointer text-gray-700 font-medium mb-2">
                      Chi tiết lỗi (Development)
                    </summary>
                    <div className="bg-gray-100 rounded-lg p-4 text-sm font-mono overflow-auto">
                      <div className="space-y-2">
                        <div>
                          <span className="text-red-600 font-bold">Message:</span>
                          <div className="text-gray-800 ml-2">{error.message}</div>
                        </div>
                        {error.stack && (
                          <div>
                            <span className="text-red-600 font-bold">Stack:</span>
                            <pre className="text-gray-600 ml-2 whitespace-pre-wrap text-xs">
                              {error.stack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </details>
                )}

                {/* Tips */}
                <div className="bg-blue-50  border border-blue-200 rounded-lg p-4">
                  <h3 className="text-blue-800 font-medium mb-2">Gợi ý khắc phục:</h3>
                  <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
                    <li>Thử tải lại trang (Ctrl+F5 hoặc Cmd+Shift+R)</li>
                    <li>Xóa cache và cookies của trình duyệt</li>
                    <li>Kiểm tra kết nối internet</li>
                    <li>Thử sử dụng chế độ ẩn danh/incognito</li>
                    {isDevelopment && <li>Kiểm tra Console để xem thêm chi tiết lỗi</li>}
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-6 text-gray-500 text-sm">
              SmartPOS v3.0.0 • Nếu lỗi tiếp tục xảy ra, vui lòng liên hệ hỗ trợ
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default GlobalErrorBoundary;
