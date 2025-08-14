// Auth module types
export interface LoginRequest {
  username: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  avatar_url?: string;
  phone?: string;
  address?: string;
  permissions?: string[];
}

export interface AuthSession {
  id: string;
  user_id: number;
  token: string;
  expires_at: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
}

export interface JwtPayload {
  userId: number;
  username: string;
  role: string;
  sessionId: string;
  iat: number;
  exp: number;
}

export interface AuthResponse {
  user: User;
  token: string;
  expires_at: string;
  session_id: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface UserProfile {
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
}

export interface Permission {
  id: number;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: Permission[];
  is_system: boolean;
}

export interface LoginAttempt {
  id: number;
  username: string;
  ip_address: string;
  user_agent: string;
  success: boolean;
  attempted_at: string;
  failure_reason?: string;
}

export interface SecuritySettings {
  max_login_attempts: number;
  lockout_duration: number; // minutes
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_lowercase: boolean;
  password_require_numbers: boolean;
  password_require_symbols: boolean;
  session_timeout: number; // minutes
  require_2fa: boolean;
}

export interface TwoFactorAuth {
  id: number;
  user_id: number;
  secret: string;
  backup_codes: string[];
  is_enabled: boolean;
  created_at: string;
}

export interface ApiKey {
  id: number;
  user_id: number;
  name: string;
  key_hash: string;
  permissions: string[];
  expires_at?: string;
  last_used_at?: string;
  is_active: boolean;
  created_at: string;
}
