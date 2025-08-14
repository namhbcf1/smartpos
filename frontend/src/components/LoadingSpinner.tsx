// Loading Spinner Component - Following rules.md standards
// Proper loading states for all async operations

import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  LinearProgress,
  Skeleton,
  Card,
  CardContent,
  Stack,
  Fade,
  Backdrop
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

export interface LoadingSpinnerProps {
  loading?: boolean;
  error?: string | null;
  success?: boolean;
  message?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'spinner' | 'linear' | 'skeleton' | 'backdrop';
  fullScreen?: boolean;
  onRetry?: () => void;
  children?: React.ReactNode;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  loading = false,
  error = null,
  success = false,
  message = 'Đang tải...',
  size = 'medium',
  variant = 'spinner',
  fullScreen = false,
  onRetry,
  children
}) => {
  // Size configurations
  const sizeConfig = {
    small: { spinner: 24, text: 'body2' },
    medium: { spinner: 40, text: 'body1' },
    large: { spinner: 60, text: 'h6' }
  };

  const currentSize = sizeConfig[size];

  // Error state
  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          minHeight: fullScreen ? '100vh' : 'auto',
          textAlign: 'center'
        }}
      >
        <ErrorIcon sx={{ fontSize: currentSize.spinner, color: 'error.main', mb: 2 }} />
        <Typography variant={currentSize.text as any} color="error.main" gutterBottom>
          {error}
        </Typography>
        {onRetry && (
          <Box sx={{ mt: 2 }}>
            <RefreshIcon 
              sx={{ 
                cursor: 'pointer', 
                fontSize: 24, 
                color: 'primary.main',
                '&:hover': { color: 'primary.dark' }
              }}
              onClick={onRetry}
            />
          </Box>
        )}
      </Box>
    );
  }

  // Success state
  if (success) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          minHeight: fullScreen ? '100vh' : 'auto',
          textAlign: 'center'
        }}
      >
        <CheckCircleIcon sx={{ fontSize: currentSize.spinner, color: 'success.main', mb: 2 }} />
        <Typography variant={currentSize.text as any} color="success.main">
          {message || 'Hoàn thành!'}
        </Typography>
      </Box>
    );
  }

  // Loading state
  if (loading) {
    switch (variant) {
      case 'backdrop':
        return (
          <Backdrop
            sx={{
              color: '#fff',
              zIndex: (theme) => theme.zIndex.drawer + 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
            open={true}
          >
            <CircularProgress color="inherit" size={currentSize.spinner} />
            {message && (
              <Typography variant={currentSize.text as any} color="inherit">
                {message}
              </Typography>
            )}
          </Backdrop>
        );

      case 'linear':
        return (
          <Box sx={{ width: '100%' }}>
            <LinearProgress />
            {message && (
              <Typography 
                variant={currentSize.text as any} 
                sx={{ mt: 1, textAlign: 'center' }}
              >
                {message}
              </Typography>
            )}
          </Box>
        );

      case 'skeleton':
        return (
          <Box sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Skeleton variant="rectangular" height={60} />
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="rectangular" height={120} />
            </Stack>
          </Box>
        );

      default: // spinner
        return (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 3,
              minHeight: fullScreen ? '100vh' : 'auto',
              textAlign: 'center'
            }}
          >
            <CircularProgress size={currentSize.spinner} />
            {message && (
              <Typography 
                variant={currentSize.text as any} 
                sx={{ mt: 2, color: 'text.secondary' }}
              >
                {message}
              </Typography>
            )}
          </Box>
        );
    }
  }

  // Default state - render children
  return <>{children}</>;
};

// Specialized loading components
export const PageLoading: React.FC<{ message?: string }> = ({ message }) => (
  <LoadingSpinner
    loading={true}
    message={message || 'Đang tải trang...'}
    size="large"
    variant="spinner"
    fullScreen={true}
  />
);

export const TableLoading: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <Box sx={{ p: 2 }}>
    <Stack spacing={1}>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} variant="rectangular" height={56} />
      ))}
    </Stack>
  </Box>
);

export const CardLoading: React.FC = () => (
  <Card>
    <CardContent>
      <Stack spacing={2}>
        <Skeleton variant="text" width="60%" height={32} />
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="rectangular" height={100} />
      </Stack>
    </CardContent>
  </Card>
);

export const ButtonLoading: React.FC<{ size?: 'small' | 'medium' | 'large' }> = ({ size = 'medium' }) => (
  <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
    <CircularProgress size={size === 'small' ? 16 : size === 'large' ? 24 : 20} />
  </Box>
);

// Loading wrapper for async operations
export const withLoading = <P extends object>(
  Component: React.ComponentType<P>,
  loadingProps?: Partial<LoadingSpinnerProps>
) => {
  const WrappedComponent = (props: P & LoadingSpinnerProps) => {
    const { loading, error, success, message, ...componentProps } = props;
    
    return (
      <LoadingSpinner
        loading={loading}
        error={error}
        success={success}
        message={message}
        {...loadingProps}
      >
        <Component {...(componentProps as P)} />
      </LoadingSpinner>
    );
  };

  WrappedComponent.displayName = `withLoading(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook for loading state management
export const useLoading = (initialState = false) => {
  const [loading, setLoading] = React.useState(initialState);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const startLoading = () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
  };

  const stopLoading = () => {
    setLoading(false);
  };

  const setErrorState = (errorMessage: string) => {
    setLoading(false);
    setError(errorMessage);
    setSuccess(false);
  };

  const setSuccessState = () => {
    setLoading(false);
    setError(null);
    setSuccess(true);
  };

  const reset = () => {
    setLoading(false);
    setError(null);
    setSuccess(false);
  };

  return {
    loading,
    error,
    success,
    startLoading,
    stopLoading,
    setErrorState,
    setSuccessState,
    reset
  };
};

export default LoadingSpinner;
