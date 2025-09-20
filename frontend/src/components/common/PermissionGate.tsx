import React, { ReactNode } from 'react';
import { Box, Alert, Typography } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import { usePermissions } from '../../hooks/usePermissions';

interface PermissionGateProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean; // If true, user must have ALL permissions. If false, user needs ANY permission
  role?: string;
  roles?: string[];
  fallback?: ReactNode;
  showError?: boolean;
  errorMessage?: string;
  invisible?: boolean; // If true, renders nothing when permission is denied
}

/**
 * Permission-based conditional rendering component
 * Wraps content and only renders if user has required permissions
 */
const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permission,
  permissions = [],
  requireAll = false,
  role,
  roles = [],
  fallback,
  showError = false,
  errorMessage,
  invisible = false
}) => {
  const {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    hasRole,
    hasAnyRole,
    isAdmin
  } = usePermissions();

  // Build permission checks
  const permissionsToCheck = [];
  if (permission) permissionsToCheck.push(permission);
  if (permissions.length > 0) permissionsToCheck.push(...permissions);

  // Build role checks
  const rolesToCheck = [];
  if (role) rolesToCheck.push(role);
  if (roles.length > 0) rolesToCheck.push(...roles);

  // Check permissions
  let hasRequiredPermissions = true;
  
  if (permissionsToCheck.length > 0) {
    if (requireAll) {
      hasRequiredPermissions = hasAllPermissions(permissionsToCheck);
    } else {
      hasRequiredPermissions = hasAnyPermission(permissionsToCheck);
    }
  }

  // Check roles
  let hasRequiredRoles = true;
  
  if (rolesToCheck.length > 0) {
    hasRequiredRoles = hasAnyRole(rolesToCheck);
  }

  // Admin bypass
  const canAccess = isAdmin || (hasRequiredPermissions && hasRequiredRoles);

  // Render logic
  if (canAccess) {
    return <>{children}</>;
  }

  // Permission denied - return appropriate fallback
  if (invisible) {
    return null;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert 
          severity="warning" 
          icon={<LockIcon />}
          sx={{ 
            maxWidth: 400,
            '& .MuiAlert-message': {
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }
          }}
        >
          <Typography variant="body2">
            {errorMessage || 'Bạn không có quyền truy cập chức năng này'}
          </Typography>
        </Alert>
      </Box>
    );
  }

  return null;
};

/**
 * Higher-order component for permission-based rendering
 */
export const withPermission = (
  permission: string | string[],
  options?: {
    requireAll?: boolean;
    fallback?: ReactNode;
    showError?: boolean;
    invisible?: boolean;
  }
) => {
  return <P extends {}>(Component: React.ComponentType<P>) => {
    const PermissionWrappedComponent: React.FC<P> = (props) => {
      const permissions = Array.isArray(permission) ? permission : [permission];
      
      return (
        <PermissionGate
          permissions={permissions}
          requireAll={options?.requireAll}
          fallback={options?.fallback}
          showError={options?.showError}
          invisible={options?.invisible}
        >
          <Component {...props} />
        </PermissionGate>
      );
    };

    PermissionWrappedComponent.displayName = `withPermission(${Component.displayName || Component.name})`;
    
    return PermissionWrappedComponent;
  };
};

/**
 * Hook for conditional rendering based on permissions
 */
export const usePermissionGate = () => {
  const permissions = usePermissions();
  
  const canRender = (
    permission?: string,
    permissionList?: string[],
    requireAll: boolean = false
  ): boolean => {
    if (permissions.isAdmin) return true;
    
    const toCheck = [];
    if (permission) toCheck.push(permission);
    if (permissionList) toCheck.push(...permissionList);
    
    if (toCheck.length === 0) return true;
    
    return requireAll 
      ? permissions.hasAllPermissions(toCheck)
      : permissions.hasAnyPermission(toCheck);
  };
  
  return {
    ...permissions,
    canRender
  };
};

export default PermissionGate;
