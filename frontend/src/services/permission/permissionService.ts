/**
 * Permission Service
 * Handles permission checking and management on the frontend
 */

import apiClient from '../api';

export interface Permission {
  permission_key: string;
  permission_display_name: string;
  resource_name: string;
  resource_display_name: string;
  action_name: string;
  action_display_name: string;
  has_permission: boolean;
  permission_source?: 'role' | 'individual';
}

export interface UserPermissions {
  [key: string]: boolean;
}

class PermissionService {
  private permissions: UserPermissions = {};
  private permissionsLoaded = false;
  private currentUserId: number | null = null;

  /**
   * Load user permissions from the API
   */
  async loadUserPermissions(userId: number): Promise<void> {
    try {
      if (this.currentUserId === userId && this.permissionsLoaded) {
        return; // Already loaded for this user
      }

      // Use the new /permissions/me endpoint for current user's permissions
      const response = await apiClient.get('/permissions/me');

      if (response.data && response.data.success && response.data.data) {
        this.permissions = {};

        // Normalize and parse permissions from API response
        const apiPerms = response.data.data.permissions;
        if (Array.isArray(apiPerms)) {
          apiPerms.forEach((permission: any) => {
            // Support both string and object formats
            // - String examples: 'inventory:read', 'products.create', 'reports-export'
            // - Object example: { name: 'inventory.update' }
            let key: string | undefined;
            if (typeof permission === 'string') {
              key = permission;
            } else if (permission && typeof permission.name === 'string') {
              key = permission.name;
            }

            if (!key) return;

            // Normalize separators to dot notation: resource.action
            // Accept ':', '-', '/' as separators too
            const normalized = key
              .trim()
              .replace(/[:\-\/]+/g, '.')
              .replace(/\.+/g, '.') // collapse multiple dots
              .toLowerCase();

            if (normalized) {
              this.permissions[normalized] = true;
            }
          });
        }

        this.permissionsLoaded = true;
        this.currentUserId = userId;
      }
    } catch (error) {
      console.error('Error loading user permissions:', error);
      this.permissions = {};
      this.permissionsLoaded = false;
    }
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(permissionKey: string): boolean {
    if (!this.permissionsLoaded) {
      return false;
    }

    return this.permissions[permissionKey] === true;
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissionKeys: string[]): boolean {
    return permissionKeys.some(key => this.hasPermission(key));
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(permissionKeys: string[]): boolean {
    return permissionKeys.every(key => this.hasPermission(key));
  }

  /**
   * Get all user permissions
   */
  getAllPermissions(): UserPermissions {
    return { ...this.permissions };
  }

  /**
   * Check if user can access a menu item
   */
  canAccessMenu(menuKey: string): boolean {
    return this.hasPermission(`${menuKey}.access`);
  }

  /**
   * Check if user can perform an action on a resource
   */
  canPerformAction(resource: string, action: string): boolean {
    return this.hasPermission(`${resource}.${action}`);
  }

  /**
   * Check database table permissions
   */
  canAccessTable(tableName: string, action: 'view' | 'create' | 'update' | 'delete'): boolean {
    return this.hasPermission(`${tableName}_table.${action}`);
  }

  /**
   * Check feature permissions
   */
  canUseFeature(featureName: string, action: string = 'view'): boolean {
    return this.hasPermission(`${featureName}.${action}`);
  }

  /**
   * Clear permissions (for logout)
   */
  clearPermissions(): void {
    this.permissions = {};
    this.permissionsLoaded = false;
    this.currentUserId = null;
  }

  /**
   * Refresh permissions from server
   */
  async refreshPermissions(): Promise<void> {
    if (this.currentUserId) {
      this.permissionsLoaded = false;
      await this.loadUserPermissions(this.currentUserId);
    }
  }

  /**
   * Get permission status for debugging
   */
  getPermissionStatus(): {
    loaded: boolean;
    userId: number | null;
    permissionCount: number;
    permissions: UserPermissions;
  } {
    return {
      loaded: this.permissionsLoaded,
      userId: this.currentUserId,
      permissionCount: Object.keys(this.permissions).length,
      permissions: this.getAllPermissions()
    };
  }
}

// Create singleton instance
export const permissionService = new PermissionService();

/**
 * React hook for permission checking
 */
export const usePermissions = () => {
  return {
    hasPermission: (permissionKey: string) => permissionService.hasPermission(permissionKey),
    hasAnyPermission: (permissionKeys: string[]) => permissionService.hasAnyPermission(permissionKeys),
    hasAllPermissions: (permissionKeys: string[]) => permissionService.hasAllPermissions(permissionKeys),
    canAccessMenu: (menuKey: string) => permissionService.canAccessMenu(menuKey),
    canPerformAction: (resource: string, action: string) => permissionService.canPerformAction(resource, action),
    canAccessTable: (tableName: string, action: 'view' | 'create' | 'update' | 'delete') => 
      permissionService.canAccessTable(tableName, action),
    canUseFeature: (featureName: string, action?: string) => permissionService.canUseFeature(featureName, action),
    getAllPermissions: () => permissionService.getAllPermissions(),
    refreshPermissions: () => permissionService.refreshPermissions(),
    getPermissionStatus: () => permissionService.getPermissionStatus()
  };
};

// Export PermissionGuard from separate component file
export { default as PermissionGuard } from '../../components/common/PermissionGate';

export default permissionService;
