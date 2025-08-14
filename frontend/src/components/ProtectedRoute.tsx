import React from 'react';
import { Navigate } from 'react-router-dom';
import { CircularProgress, Box, Alert, Typography } from '@mui/material';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  fallbackPath = '/dashboard'
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  console.log('ProtectedRoute: isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'user:', user, 'requiredRoles:', requiredRoles);

  // Show loading spinner while checking authentication
  if (isLoading) {
    console.log('ProtectedRoute: Showing loading spinner');
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('ProtectedRoute: Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (requiredRoles.length > 0 && user?.role) {
    const hasRequiredRole = requiredRoles.includes(user.role);

    if (!hasRequiredRole) {
      console.log('ProtectedRoute: Insufficient permissions', {
        userRole: user.role,
        requiredRoles
      });

      return (
        <Box p={3}>
          <Alert severity="error">
            <Typography variant="h6" gutterBottom>
              Không có quyền truy cập
            </Typography>
            <Typography>
              Bạn không có quyền truy cập vào trang này.
              Vui lòng liên hệ quản trị viên để được cấp quyền.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Quyền yêu cầu: {requiredRoles.join(', ')}
            </Typography>
            <Typography variant="body2">
              Quyền hiện tại: {user.role}
            </Typography>
          </Alert>
        </Box>
      );
    }
  }

  // If authenticated and has required role, render the protected content
  console.log('ProtectedRoute: Authenticated with sufficient permissions, rendering children');
  return <>{children}</>;
};

export default ProtectedRoute; 