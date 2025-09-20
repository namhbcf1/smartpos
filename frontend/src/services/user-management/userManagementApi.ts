/**
 * User Management API Service
 * Handles all user management, roles, and permissions API calls
 * Rules.md compliant - uses only real Cloudflare D1 data
 */

import apiService from './api';
import { API_ENDPOINTS } from '../config/constants';
import {
  User,
  Role,
  Permission,
  UserActivity,
  UserSession,
  ApiResponse,
  PaginatedResponse
} from '../types/api';

export interface UserFilters {
  role_id?: number;
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role_id: number;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  full_name?: string;
  role_id?: number;
  is_active?: boolean;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  permission_ids: number[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permission_ids?: number[];
  is_active?: boolean;
}

export interface BulkUserAction {
  user_ids: number[];
  action: 'activate' | 'deactivate' | 'delete' | 'change_role';
  role_id?: number; // Required for change_role action
}

export interface ActivityFilters {
  user_id?: number;
  action?: string;
  resource?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface SessionFilters {
  user_id?: number;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  users_by_role: Array<{
    role_id: number;
    role_name: string;
    user_count: number;
  }>;
  recent_logins: number;
  failed_login_attempts: number;
  password_expiry_warnings: number;
}

class UserManagementApiService {
  /**
   * Get all users with filtering and pagination
   */
  async getUsers(filters?: UserFilters): Promise<{
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const url = `${API_ENDPOINTS.USER_MANAGEMENT.USERS}${params.toString() ? `?${params}` : ''}`;
    return apiService.get<{
      users: User[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(url);
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: number): Promise<User> {
    return apiService.get<User>(`${API_ENDPOINTS.USER_MANAGEMENT.USERS}/${userId}`);
  }

  /**
   * Create new user
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    return apiService.post<User>(API_ENDPOINTS.USER_MANAGEMENT.USERS, userData);
  }

  /**
   * Update user
   */
  async updateUser(userId: number, userData: UpdateUserRequest): Promise<User> {
    return apiService.put<User>(`${API_ENDPOINTS.USER_MANAGEMENT.USERS}/${userId}`, userData);
  }

  /**
   * Delete user
   */
  async deleteUser(userId: number): Promise<void> {
    return apiService.delete<void>(`${API_ENDPOINTS.USER_MANAGEMENT.USERS}/${userId}`);
  }

  /**
   * Change user password
   */
  async changePassword(userId: number, passwordData: PasswordChangeRequest): Promise<void> {
    return apiService.post<void>(`${API_ENDPOINTS.USER_MANAGEMENT.USERS}/${userId}/change-password`, passwordData);
  }

  /**
   * Reset user password (admin only)
   */
  async resetPassword(userId: number): Promise<{ temporary_password: string }> {
    return apiService.post<{ temporary_password: string }>(`${API_ENDPOINTS.USER_MANAGEMENT.USERS}/${userId}/reset-password`);
  }

  /**
   * Get all roles
   */
  async getRoles(): Promise<Role[]> {
    return apiService.get<Role[]>(API_ENDPOINTS.USER_MANAGEMENT.ROLES);
  }

  /**
   * Get role by ID
   */
  async getRoleById(roleId: number): Promise<Role> {
    return apiService.get<Role>(`${API_ENDPOINTS.USER_MANAGEMENT.ROLES}/${roleId}`);
  }

  /**
   * Create new role
   */
  async createRole(roleData: CreateRoleRequest): Promise<Role> {
    return apiService.post<Role>(API_ENDPOINTS.USER_MANAGEMENT.ROLES, roleData);
  }

  /**
   * Update role
   */
  async updateRole(roleId: number, roleData: UpdateRoleRequest): Promise<Role> {
    return apiService.put<Role>(`${API_ENDPOINTS.USER_MANAGEMENT.ROLES}/${roleId}`, roleData);
  }

  /**
   * Delete role
   */
  async deleteRole(roleId: number): Promise<void> {
    return apiService.delete<void>(`${API_ENDPOINTS.USER_MANAGEMENT.ROLES}/${roleId}`);
  }

  /**
   * Get all permissions
   */
  async getPermissions(): Promise<Permission[]> {
    return apiService.get<Permission[]>(API_ENDPOINTS.USER_MANAGEMENT.PERMISSIONS);
  }

  /**
   * Get user activities
   */
  async getUserActivities(filters?: ActivityFilters): Promise<PaginatedResponse<UserActivity>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const url = `${API_ENDPOINTS.USER_MANAGEMENT.ACTIVITIES}${params.toString() ? `?${params}` : ''}`;
    return apiService.get<PaginatedResponse<UserActivity>>(url);
  }

  /**
   * Get user sessions
   */
  async getUserSessions(filters?: SessionFilters): Promise<PaginatedResponse<UserSession>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const url = `${API_ENDPOINTS.USER_MANAGEMENT.SESSIONS}${params.toString() ? `?${params}` : ''}`;
    return apiService.get<PaginatedResponse<UserSession>>(url);
  }

  /**
   * Terminate user session
   */
  async terminateSession(sessionId: number): Promise<void> {
    return apiService.delete<void>(`${API_ENDPOINTS.USER_MANAGEMENT.SESSIONS}/${sessionId}`);
  }

  /**
   * Terminate all user sessions
   */
  async terminateAllUserSessions(userId: number): Promise<void> {
    return apiService.post<void>(`${API_ENDPOINTS.USER_MANAGEMENT.USERS}/${userId}/terminate-sessions`);
  }

  /**
   * Perform bulk actions on users
   */
  async bulkUserActions(action: BulkUserAction): Promise<{
    success_count: number;
    failed_count: number;
    errors: Array<{ user_id: number; error: string }>;
  }> {
    return apiService.post<{
      success_count: number;
      failed_count: number;
      errors: Array<{ user_id: number; error: string }>;
    }>(API_ENDPOINTS.USER_MANAGEMENT.BULK_ACTIONS, action);
  }

  /**
   * Get user management statistics
   */
  async getUserStats(): Promise<UserStats> {
    return apiService.get<UserStats>(`${API_ENDPOINTS.USER_MANAGEMENT.USERS}/stats`);
  }

  /**
   * Check if user has specific permission
   */
  async checkUserPermission(userId: number, resource: string, action: string): Promise<{ has_permission: boolean }> {
    return apiService.get<{ has_permission: boolean }>(
      `${API_ENDPOINTS.USER_MANAGEMENT.USERS}/${userId}/permissions/check?resource=${resource}&action=${action}`
    );
  }

  /**
   * Get current user permissions
   */
  async getCurrentUserPermissions(): Promise<Permission[]> {
    return apiService.get<Permission[]>(`${API_ENDPOINTS.USER_MANAGEMENT.USERS}/me/permissions`);
  }
}

export const userManagementApi = new UserManagementApiService();
