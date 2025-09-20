import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface UserRole {
  id: string; // TEXT PK according to detailed schema
  name: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
}

export interface PermissionCheck {
  hasPermission: boolean;
  reason?: string;
  missingPermissions?: string[];
}

/**
 * Enhanced permissions hook with RBAC support
 */
export const usePermissions = () => {
  const { user, isAuthenticated } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [allPermissions, setAllPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Extract permissions from user object
  useEffect(() => {
    if (user && isAuthenticated) {
      try {
        // Extract roles and permissions from user object
        const roles: UserRole[] = user.roles || [];
        const permissions = new Set<string>();

        // Collect all permissions from all roles
        roles.forEach(role => {
          if (role.permissions && Array.isArray(role.permissions)) {
            role.permissions.forEach(perm => permissions.add(perm));
          }
        });

        // Add direct user permissions if any
        if (user.permissions && Array.isArray(user.permissions)) {
          user.permissions.forEach(perm => permissions.add(perm));
        }

        // Admin gets all permissions (case-insensitive)
        if (user.role?.toLowerCase() === 'admin' || roles.some(r => r.name?.toLowerCase() === 'admin')) {
          permissions.add('*');
        }

        // Legacy role-based permissions for backward compatibility
        const rolePermissions: Record<string, string[]> = {
          admin: ['*'],
          manager: [
            'products.*', 'sales.*', 'customers.*', 'inventory.*',
            'returns.*', 'warranty.*', 'reports.*', 'purchases.*',
            'serial_numbers.*', 'users.read'
          ],
          cashier: [
            'products.read', 'products.update',
            'sales.*', 'customers.*', 'returns.*',
            'pos.*', 'inventory.read'
          ],
          sales_agent: [
            'products.read', 'sales.*', 'customers.*',
            'returns.*', 'warranty.*', 'pos.*'
          ],
          affiliate: [
            'products.read', 'sales.*', 'customers.*',
            'returns.*', 'warranty.*'
          ],
          inventory: [
            'products.*', 'categories.*', 'inventory.*',
            'serial_numbers.*', 'purchases.*', 'suppliers.*'
          ]
        };

        // Add legacy permissions based on user role (case-insensitive)
        const userRoleKey = user.role?.toLowerCase() || '';
        const legacyPerms = rolePermissions[userRoleKey] || [];
        legacyPerms.forEach(perm => permissions.add(perm));

        setUserRoles(roles);
        setAllPermissions(Array.from(permissions));
      } catch (error) {
        // Log error using existing error handler pattern
        console.error('Error processing user permissions:', error);
        setAllPermissions([]);
        setUserRoles([]);
      }
    } else {
      setAllPermissions([]);
      setUserRoles([]);
    }
  }, [user, isAuthenticated]);

  /**
   * Check if user has a specific permission
   */
  const hasPermission = useCallback((permission: string): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }

    // Super admin has all permissions
    if (allPermissions.includes('*')) {
      return true;
    }

    // Direct permission match
    if (allPermissions.includes(permission)) {
      return true;
    }

    // Wildcard permission match (e.g., 'products.*' matches 'products.read')
    return allPermissions.some(userPerm => {
      if (userPerm.endsWith('.*')) {
        const prefix = userPerm.slice(0, -2);
        return permission.startsWith(prefix + '.');
      }
      if (userPerm.endsWith('*') && !userPerm.endsWith('.*')) {
        const prefix = userPerm.slice(0, -1);
        return permission.startsWith(prefix);
      }
      return false;
    });
  }, [isAuthenticated, user, allPermissions]);

  /**
   * Check multiple permissions (user must have ALL)
   */
  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    return permissions.every(perm => hasPermission(perm));
  }, [hasPermission]);

  /**
   * Check multiple permissions (user must have ANY)
   */
  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return permissions.some(perm => hasPermission(perm));
  }, [hasPermission]);

  /**
   * Detailed permission check with reasoning
   */
  const checkPermission = useCallback((permission: string): PermissionCheck => {
    if (!isAuthenticated || !user) {
      return {
        hasPermission: false,
        reason: 'User not authenticated'
      };
    }

    if (allPermissions.includes('*')) {
      return {
        hasPermission: true,
        reason: 'Super admin access'
      };
    }

    if (allPermissions.includes(permission)) {
      return {
        hasPermission: true,
        reason: 'Direct permission match'
      };
    }

    // Check wildcard permissions
    const matchingWildcard = allPermissions.find(userPerm => {
      if (userPerm.endsWith('.*')) {
        const prefix = userPerm.slice(0, -2);
        return permission.startsWith(prefix + '.');
      }
      if (userPerm.endsWith('*') && !userPerm.endsWith('.*')) {
        const prefix = userPerm.slice(0, -1);
        return permission.startsWith(prefix);
      }
      return false;
    });

    if (matchingWildcard) {
      return {
        hasPermission: true,
        reason: `Wildcard permission match: ${matchingWildcard}`
      };
    }

    return {
      hasPermission: false,
      reason: 'Permission not granted',
      missingPermissions: [permission]
    };
  }, [isAuthenticated, user, allPermissions]);

  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback((roleName: string): boolean => {
    return userRoles.some(role => role.name === roleName && role.isActive);
  }, [userRoles]);

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = useCallback((roleNames: string[]): boolean => {
    return roleNames.some(roleName => hasRole(roleName));
  }, [hasRole]);

  /**
   * Get user's active role names
   */
  const getActiveRoles = useCallback((): string[] => {
    return userRoles.filter(role => role.isActive).map(role => role.name);
  }, [userRoles]);

  // Legacy function compatibility
  const canEditProducts = useCallback((): boolean => {
    return hasPermission('products.update');
  }, [hasPermission]);

  const canCreateProducts = useCallback((): boolean => {
    return hasPermission('products.create');
  }, [hasPermission]);

  const canDeleteProducts = useCallback((): boolean => {
    return hasPermission('products.delete');
  }, [hasPermission]);

  const canAccessSales = useCallback((): boolean => {
    return hasPermission('sales.view') || hasPermission('sales.read');
  }, [hasPermission]);

  const canCreateSales = useCallback((): boolean => {
    return hasPermission('sales.create');
  }, [hasPermission]);

  const canAccessReturns = useCallback((): boolean => {
    return hasPermission('returns.view') || hasPermission('returns.read');
  }, [hasPermission]);

  const canAccessWarranty = useCallback((): boolean => {
    return hasPermission('warranty.view') || hasPermission('warranty.read');
  }, [hasPermission]);

  const canAccessCustomers = useCallback((): boolean => {
    return hasPermission('customers.view') || hasPermission('customers.read');
  }, [hasPermission]);

  const canEditCustomers = useCallback((): boolean => {
    return hasPermission('customers.update');
  }, [hasPermission]);

  const canAccessReports = useCallback((): boolean => {
    return hasPermission('reports.view') || hasPermission('reports.read');
  }, [hasPermission]);

  const canAccessAdmin = useCallback((): boolean => {
    return hasPermission('*') || hasRole('admin') || hasRole('manager');
  }, [hasPermission, hasRole]);

  const isProductsReadOnly = useCallback((): boolean => {
    return !hasAnyPermission(['products.create', 'products.update', 'products.delete']);
  }, [hasAnyPermission]);

  /**
   * Resource-specific permission helpers
   */
  const canManageProducts = useCallback((): boolean => {
    return hasAnyPermission(['products.*', 'products.manage', 'products.create', 'products.update', 'products.delete']);
  }, [hasAnyPermission]);

  const canViewProducts = useCallback((): boolean => {
    return hasAnyPermission(['products.*', 'products.read', 'products.view']);
  }, [hasAnyPermission]);

  const canManageInventory = useCallback((): boolean => {
    return hasAnyPermission(['inventory.*', 'inventory.manage', 'inventory.update']);
  }, [hasAnyPermission]);

  const canViewInventory = useCallback((): boolean => {
    return hasAnyPermission(['inventory.*', 'inventory.read', 'inventory.view']);
  }, [hasAnyPermission]);

  const canManageUsers = useCallback((): boolean => {
    return hasAnyPermission(['users.*', 'users.manage', 'users.create', 'users.update', 'users.delete', '*']);
  }, [hasAnyPermission]);

  const canViewUsers = useCallback((): boolean => {
    return hasAnyPermission(['users.*', 'users.read', 'users.view', '*']);
  }, [hasAnyPermission]);

  const canManageSettings = useCallback((): boolean => {
    return hasAnyPermission(['settings.*', 'settings.manage', '*']);
  }, [hasAnyPermission]);

  const canAccessPOS = useCallback((): boolean => {
    return hasAnyPermission(['pos.*', 'pos.access', 'sales.create']);
  }, [hasAnyPermission]);

  const canManageWarranty = useCallback((): boolean => {
    return hasAnyPermission(['warranty.*', 'warranty.manage', 'warranty.create', 'warranty.update']);
  }, [hasAnyPermission]);

  const canManageSerialNumbers = useCallback((): boolean => {
    return hasAnyPermission(['serial_numbers.*', 'serial_numbers.manage', 'serial_numbers.create', 'serial_numbers.update']);
  }, [hasAnyPermission]);

  const canViewSerialNumbers = useCallback((): boolean => {
    return hasAnyPermission(['serial_numbers.*', 'serial_numbers.read', 'serial_numbers.view']);
  }, [hasAnyPermission]);

  return {
    // Permission checking functions
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    checkPermission,

    // Role checking functions
    hasRole,
    hasAnyRole,
    getActiveRoles,

    // Legacy compatibility functions
    canEditProducts,
    canCreateProducts,
    canDeleteProducts,
    canAccessSales,
    canCreateSales,
    canAccessReturns,
    canAccessWarranty,
    canAccessCustomers,
    canEditCustomers,
    canAccessReports,
    canAccessAdmin,
    isProductsReadOnly,

    // Enhanced resource-specific helpers
    canManageProducts,
    canViewProducts,
    canManageInventory,
    canViewInventory,
    canManageUsers,
    canViewUsers,
    canManageSettings,
    canAccessPOS,
    canManageWarranty,
    canManageSerialNumbers,
    canViewSerialNumbers,

    // State
    userRoles,
    allPermissions,
    isLoading,

    // Helper data
    isAdmin: hasRole('admin') || hasPermission('*'),
    isCashier: hasRole('cashier') || hasPermission('pos.access'),
    isManager: hasRole('manager'),
    isSalesAgent: hasRole('sales_agent'),
    isInventoryStaff: hasRole('inventory'),
    userRole: user?.role
  };
};
