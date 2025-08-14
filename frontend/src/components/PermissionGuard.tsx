import React from 'react';
import { usePermissions } from '../services/permissionService';

export interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  menu?: string;
  resource?: string;
  action?: string;
  table?: string;
  tableAction?: 'view' | 'create' | 'update' | 'delete';
  feature?: string;
  featureAction?: string;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  menu,
  resource,
  action,
  table,
  tableAction,
  feature,
  featureAction
}) => {
  const permissionHooks = usePermissions();

  let hasAccess = false;

  if (permission) {
    hasAccess = permissionHooks.hasPermission(permission);
  } else if (permissions) {
    hasAccess = requireAll 
      ? permissionHooks.hasAllPermissions(permissions)
      : permissionHooks.hasAnyPermission(permissions);
  } else if (menu) {
    hasAccess = permissionHooks.canAccessMenu(menu);
  } else if (resource && action) {
    hasAccess = permissionHooks.canPerformAction(resource, action);
  } else if (table && tableAction) {
    hasAccess = permissionHooks.canAccessTable(table, tableAction);
  } else if (feature) {
    hasAccess = permissionHooks.canUseFeature(feature, featureAction);
  } else {
    // No permission specified, allow access
    hasAccess = true;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};
