import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

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
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Check authentication
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
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="alert alert-error max-w-md mb-4">
            <div>
              <h3 className="font-bold">Không có quyền truy cập</h3>
              <div className="text-xs">
                Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ quản trị viên để được cấp quyền.
              </div>
              <div className="text-sm mt-2">
                Vai trò hiện tại: {user.role} | Vai trò yêu cầu: {requiredRoles.join(', ')}
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // If authenticated and has required role, render the protected content
  console.log('ProtectedRoute: Authenticated with sufficient permissions, rendering children');
  return <>{children}</>;
};

export default ProtectedRoute; 
