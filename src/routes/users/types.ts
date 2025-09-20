// User Management Types for Backend - Following detailed schema
export interface User {
  id: string; // TEXT PK according to detailed schema
  username: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'admin' | 'manager' | 'cashier' | 'employee'; // Default 'employee' per detailed schema
  is_active: boolean;
  last_login?: string; // ISO 8601 format
  created_at: string;
  updated_at: string;
}

export interface UserCreateData {
  username: string;
  email: string;
  password: string; // Will be hashed to password_hash
  full_name: string;
  role: 'admin' | 'manager' | 'cashier' | 'employee';
  is_active?: boolean;
}

export interface UserUpdateData {
  username?: string;
  email?: string;
  password?: string; // Will be hashed to password_hash
  full_name?: string;
  role?: 'admin' | 'manager' | 'cashier' | 'employee';
  is_active?: boolean;
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'admin' | 'manager' | 'cashier' | 'employee';
  is_active?: boolean;
  sort_by?: 'username' | 'email' | 'full_name' | 'role' | 'created_at' | 'last_login';
  sort_order?: 'asc' | 'desc';
}

export interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  admin_count: number;
  manager_count: number;
  cashier_count: number;
  employee_count: number; // Changed from staff_count
  recent_logins: number;
}

export interface UserSession {
  id: string;
  user_id: string; // TEXT according to detailed schema
  token: string;
  refresh_token?: string;
  expires_at: string;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
  created_at: string;
  last_activity: string;
}

export interface UserActivity {
  id: number;
  user_id: number;
  action: string;
  resource_type?: string;
  resource_id?: number;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface UserPermission {
  id: number;
  name: string;
  description?: string;
  resource: string;
  action: string;
  is_active: boolean;
  created_at: string;
}

export interface Role {
  id: string; // TEXT PK according to detailed schema
  name: string;
  description?: string;
  permissions: string[]; // JSON array per detailed schema
  is_active: boolean;
  created_at: string;
}

export interface UserProfile {
  id: number;
  user_id: number;
  bio?: string;
  address?: string;
  city?: string;
  country?: string;
  timezone?: string;
  language?: string;
  date_format?: string;
  time_format?: string;
  currency?: string;
  notifications?: Record<string, boolean>;
  preferences?: Record<string, any>;
  updated_at: string;
}

export interface PasswordReset {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  is_used: boolean;
  created_at: string;
  used_at?: string;
}

export interface LoginAttempt {
  id: number;
  username: string;
  ip_address: string;
  user_agent?: string;
  success: boolean;
  failure_reason?: string;
  created_at: string;
}

export interface UserResponse {
  success: boolean;
  data?: User | User[];
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats?: UserStats;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
    refresh_token?: string;
    expires_at: string;
  };
  message?: string;
}

export interface PermissionCheck {
  user_id: number;
  permission: string;
  resource_type?: string;
  resource_id?: number;
}

export interface BulkUserOperation {
  user_ids: number[];
  operation: 'activate' | 'deactivate' | 'delete' | 'change_role' | 'assign_store';
  data?: {
    role?: string;
    store_id?: number;
    is_active?: boolean;
  };
}

export interface UserImportData {
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  store_name?: string;
  is_active?: boolean;
}

export interface ImportResult {
  total_rows: number;
  successful_imports: number;
  failed_imports: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
    data?: any;
  }>;
  warnings: Array<{
    row: number;
    field: string;
    message: string;
    data?: any;
  }>;
}

export interface UserAnalytics {
  login_trends: Array<{
    date: string;
    login_count: number;
    unique_users: number;
  }>;
  role_distribution: Array<{
    role: string;
    count: number;
    percentage: number;
  }>;
  activity_summary: Array<{
    user_id: number;
    username: string;
    full_name: string;
    last_login: string;
    login_count: number;
    activity_score: number;
  }>;
  store_distribution: Array<{
    store_id: number;
    store_name: string;
    user_count: number;
    active_users: number;
  }>;
}

export interface SecuritySettings {
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_lowercase: boolean;
  password_require_numbers: boolean;
  password_require_symbols: boolean;
  password_expiry_days: number;
  max_login_attempts: number;
  lockout_duration_minutes: number;
  session_timeout_minutes: number;
  require_2fa: boolean;
  allowed_ip_ranges?: string[];
}

export interface TwoFactorAuth {
  id: number;
  user_id: number;
  secret: string;
  backup_codes: string[];
  is_enabled: boolean;
  verified_at?: string;
  created_at: string;
}

export interface ApiKey {
  id: number;
  user_id: number;
  name: string;
  key_hash: string;
  permissions: string[];
  expires_at?: string;
  last_used?: string;
  is_active: boolean;
  created_at: string;
}
