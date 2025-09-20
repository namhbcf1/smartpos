import React, { Component, ReactNode } from 'react';
import GlobalErrorBoundary from './GlobalErrorBoundary';

// Re-export the main error boundary
export { default as GlobalErrorBoundary } from './GlobalErrorBoundary';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  resetOnPropsChange?: any;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Simple Error Boundary wrapper for component-level error handling
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, { hasError: boolean }> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component Error Boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);

    // If it's a router error, try to recover by redirecting to login
    if (error.message?.includes('router') || error.message?.includes('T_')) {
      console.warn('Router error detected, redirecting to login...');
      window.location.href = '/login';
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 text-red-600">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="font-medium">Something went wrong in this component</span>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

/**
 * Hook for functional components to handle errors
 */
export function useErrorHandler() {
  return (error: Error, errorInfo?: any) => {
    console.error('Hook Error Handler:', error, errorInfo);
    
    // In production, you would send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: errorReportingService.captureException(error, { extra: errorInfo });
    }
  };
}

/**
 * Async error boundary for handling promise rejections
 */
export class AsyncErrorBoundary extends Component<
  ErrorBoundaryProps & { onAsyncError?: (error: Error) => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: ErrorBoundaryProps & { onAsyncError?: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Async Error Boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  componentDidMount() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error('Unhandled Promise Rejection:', event.reason);
    this.props.onAsyncError?.(event.reason);
    
    // Prevent the default browser behavior
    event.preventDefault();
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              !
            </div>
            <div>
              <h3 className="font-medium text-red-800">An async error occurred</h3>
              <p className="text-red-600 text-sm mt-1">
                {this.state.error?.message || 'An unknown async error occurred'}
              </p>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="mt-3 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-sm rounded border border-red-300 transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Default export is the main GlobalErrorBoundary
export default GlobalErrorBoundary;
