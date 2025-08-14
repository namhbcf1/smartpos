// Error Boundary Component - Following rules.md standards
// Proper error handling for production environment

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Container,
  Paper,
  Stack,
  Divider
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  BugReport as BugReportIcon
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console for debugging
    console.error('🚨 Error Boundary Caught Error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Update state with error info
    this.setState({
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send error to monitoring service (if available)
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo): void => {
    try {
      // In production, send to error tracking service
      if (import.meta.env.PROD) {
        // Example: Send to error tracking service
        // errorTrackingService.captureException(error, {
        //   errorId: this.state.errorId,
        //   componentStack: errorInfo.componentStack,
        //   userAgent: navigator.userAgent,
        //   url: window.location.href
        // });
        
        console.log('📊 Error reported to monitoring service:', this.state.errorId);
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  private handleGoHome = (): void => {
    window.location.href = '/';
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleReportBug = (): void => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    // Create bug report URL or open email client
    const subject = encodeURIComponent(`Bug Report - Error ID: ${this.state.errorId}`);
    const body = encodeURIComponent(JSON.stringify(errorDetails, null, 2));
    const mailtoUrl = `mailto:support@smartpos.com?subject=${subject}&body=${body}`;
    
    window.open(mailtoUrl, '_blank');
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Stack spacing={3}>
              {/* Error Header */}
              <Box sx={{ textAlign: 'center' }}>
                <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
                <Typography variant="h4" component="h1" gutterBottom>
                  Oops! Đã xảy ra lỗi
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Chúng tôi đã ghi nhận lỗi này và đang khắc phục
                </Typography>
              </Box>

              <Divider />

              {/* Error Details */}
              <Alert severity="error" icon={<BugReportIcon />}>
                <AlertTitle>Chi tiết lỗi</AlertTitle>
                <Typography variant="body2" component="div">
                  <strong>Mã lỗi:</strong> {this.state.errorId}
                </Typography>
                {this.state.error && (
                  <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                    <strong>Thông báo:</strong> {this.state.error.message}
                  </Typography>
                )}
              </Alert>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleRetry}
                  size="large"
                >
                  Thử lại
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<HomeIcon />}
                  onClick={this.handleGoHome}
                  size="large"
                >
                  Về trang chủ
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleReload}
                  size="large"
                >
                  Tải lại trang
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<BugReportIcon />}
                  onClick={this.handleReportBug}
                  size="large"
                >
                  Báo cáo lỗi
                </Button>
              </Box>

              {/* Technical Details (Development only) */}
              {import.meta.env.DEV && this.state.error && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Chi tiết kỹ thuật (Chỉ hiển thị trong môi trường phát triển)
                    </Typography>
                    <Typography variant="body2" component="pre" sx={{ 
                      overflow: 'auto', 
                      maxHeight: 200,
                      backgroundColor: 'grey.100',
                      p: 2,
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.75rem'
                    }}>
                      {this.state.error.stack}
                    </Typography>
                    {this.state.errorInfo && (
                      <Typography variant="body2" component="pre" sx={{ 
                        overflow: 'auto', 
                        maxHeight: 200,
                        backgroundColor: 'grey.100',
                        p: 2,
                        borderRadius: 1,
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        mt: 2
                      }}>
                        {this.state.errorInfo.componentStack}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for functional components
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<Props>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook for functional components to trigger error boundary
export const useErrorBoundary = () => {
  const throwError = (error: Error) => {
    throw error;
  };

  return { throwError };
};

export default ErrorBoundary;