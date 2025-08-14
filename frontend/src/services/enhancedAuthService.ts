/**
 * Enhanced Authentication Service
 * Handles authentication with role-based permissions and JWT management
 * Rules.md compliant - uses only real Cloudflare D1 data
 */

import apiService from './api';
import { API_ENDPOINTS } from '../config/constants';
import { User, Permission, Role } from '../types/api';

export interface LoginRequest {
  username: string;
  password: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
  expires_at: string;
  permissions: Permission[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  permissions: Permission[];
  token: string | null;
  expiresAt: Date | null;
}

export interface PermissionCheck {
  resource: string;
  action: string;
}

class EnhancedAuthService {
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    permissions: [],
    token: null,
    expiresAt: null
  };

  private authStateListeners: Array<(state: AuthState) => void> = [];
  private tokenRefreshTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeFromStorage();
    this.setupTokenRefresh();
  }

  /**
   * Initialize auth state from storage
   */
  private initializeFromStorage(): void {
    try {
      const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
      const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
      const permissionsStr = sessionStorage.getItem('permissions') || localStorage.getItem('permissions');

      if (token && userStr) {
        const user = JSON.parse(userStr);
        const permissions = permissionsStr ? JSON.parse(permissionsStr) : [];
        
        this.authState = {
          isAuthenticated: true,
          user,
          permissions,
          token,
          expiresAt: null // Will be validated on next API call
        };

        this.notifyAuthStateChange();
      }
    } catch (error) {
      console.error('Error initializing auth from storage:', error);
      this.clearAuthState();
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiService.post<LoginResponse>(API_ENDPOINTS.LOGIN, credentials);
      
      this.setAuthState({
        isAuthenticated: true,
        user: response.user,
        permissions: response.permissions,
        token: response.token,
        expiresAt: new Date(response.expires_at)
      });

      this.storeAuthData(response);
      this.setupTokenRefresh();

      return response;
    } catch (error) {
      this.clearAuthState();
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiService.post(API_ENDPOINTS.LOGOUT);
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      this.clearAuthState();
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<boolean> {
    try {
      const response = await apiService.post<LoginResponse>(API_ENDPOINTS.REFRESH_TOKEN);
      
      this.setAuthState({
        isAuthenticated: true,
        user: response.user,
        permissions: response.permissions,
        token: response.token,
        expiresAt: new Date(response.expires_at)
      });

      this.storeAuthData(response);
      this.setupTokenRefresh();

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearAuthState();
      return false;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiService.get<User>(API_ENDPOINTS.USER);
    
    if (this.authState.user) {
      this.authState.user = response;
      this.notifyAuthStateChange();
    }

    return response;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(resource: string, action: string): boolean {
    if (!this.authState.isAuthenticated || !this.authState.permissions) {
      return false;
    }

    return this.authState.permissions.some(permission => 
      permission.resource === resource && permission.action === action
    );
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(checks: PermissionCheck[]): boolean {
    return checks.some(check => this.hasPermission(check.resource, check.action));
  }

  /**
   * Check if user has all specified permissions
   */
  hasAllPermissions(checks: PermissionCheck[]): boolean {
    return checks.every(check => this.hasPermission(check.resource, check.action));
  }

  /**
   * Check if user has specific role
   */
  hasRole(roleName: string): boolean {
    return this.authState.user?.role_name === roleName || this.authState.user?.role === roleName;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roleNames: string[]): boolean {
    if (!this.authState.user) return false;
    const userRole = this.authState.user.role_name || this.authState.user.role;
    return roleNames.includes(userRole);
  }

  /**
   * Get current auth state
   */
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(listener: (state: AuthState) => void): () => void {
    this.authStateListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(listener);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Set auth state and notify listeners
   */
  private setAuthState(newState: AuthState): void {
    this.authState = { ...newState };
    this.notifyAuthStateChange();
  }

  /**
   * Notify all listeners of auth state change
   */
  private notifyAuthStateChange(): void {
    this.authStateListeners.forEach(listener => {
      try {
        listener(this.authState);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  /**
   * Store authentication data
   */
  private storeAuthData(response: LoginResponse): void {
    try {
      sessionStorage.setItem('auth_token', response.token);
      sessionStorage.setItem('user', JSON.stringify(response.user));
      sessionStorage.setItem('permissions', JSON.stringify(response.permissions));
      
      // Also store in localStorage for persistence
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('permissions', JSON.stringify(response.permissions));
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  }

  /**
   * Clear authentication state
   */
  private clearAuthState(): void {
    this.authState = {
      isAuthenticated: false,
      user: null,
      permissions: [],
      token: null,
      expiresAt: null
    };

    // Clear storage
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('permissions');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');

    // Clear refresh timer
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }

    this.notifyAuthStateChange();
  }

  /**
   * Setup automatic token refresh
   */
  private setupTokenRefresh(): void {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }

    if (!this.authState.expiresAt) return;

    const now = new Date().getTime();
    const expiresAt = this.authState.expiresAt.getTime();
    const refreshTime = expiresAt - (5 * 60 * 1000); // Refresh 5 minutes before expiry

    if (refreshTime > now) {
      this.tokenRefreshTimer = setTimeout(() => {
        this.refreshToken();
      }, refreshTime - now);
    }
  }

  /**
   * Check if token is expired or about to expire
   */
  isTokenExpired(): boolean {
    if (!this.authState.expiresAt) return false;
    
    const now = new Date().getTime();
    const expiresAt = this.authState.expiresAt.getTime();
    const bufferTime = 2 * 60 * 1000; // 2 minutes buffer
    
    return (expiresAt - bufferTime) <= now;
  }

  /**
   * Get user permissions for a specific resource
   */
  getResourcePermissions(resource: string): Permission[] {
    if (!this.authState.permissions) return [];
    
    return this.authState.permissions.filter(permission => 
      permission.resource === resource
    );
  }

  /**
   * Get all user permissions grouped by resource
   */
  getPermissionsByResource(): Record<string, Permission[]> {
    if (!this.authState.permissions) return {};
    
    return this.authState.permissions.reduce((acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = [];
      }
      acc[permission.resource].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
  }
}

export const enhancedAuthService = new EnhancedAuthService();
