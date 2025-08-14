import { sign, verify } from 'hono/jwt';
import { Env } from '../../types';
import { JwtPayload, User, AuthSession } from './types';

// Session and JWT constants
export const SESSION_TTL = 24 * 60 * 60; // 24 hours for better UX
export const JWT_EXPIRY = 24 * 60 * 60; // 24 hours for better UX
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION = 15; // minutes

// Generate JWT token
export async function generateJWT(
  user: User, 
  sessionId: string, 
  jwtSecret: string
): Promise<string> {
  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    sessionId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY
  };

  return await sign(payload, jwtSecret);
}

// Verify JWT token
export async function verifyJWT(
  token: string, 
  jwtSecret: string
): Promise<JwtPayload | null> {
  try {
    const payload = await verify(token, jwtSecret) as JwtPayload;
    
    // Check if token is expired
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}

// Generate session ID
export function generateSessionId(): string {
  return crypto.randomUUID();
}

// Hash password using Web Crypto API
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Create auth session
export async function createSession(
  db: any,
  userId: number,
  ipAddress?: string,
  userAgent?: string
): Promise<AuthSession> {
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_TTL * 1000).toISOString();
  
  const session: AuthSession = {
    id: sessionId,
    user_id: userId,
    token: sessionId, // Will be replaced with JWT
    expires_at: expiresAt,
    created_at: new Date().toISOString(),
    ip_address: ipAddress,
    user_agent: userAgent,
    is_active: true
  };

  await db.prepare(`
    INSERT INTO auth_sessions (id, user_id, token, expires_at, created_at, ip_address, user_agent, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    session.id,
    session.user_id,
    session.token,
    session.expires_at,
    session.created_at,
    session.ip_address,
    session.user_agent,
    session.is_active ? 1 : 0
  ).run();

  return session;
}

// Validate session
export async function validateSession(
  db: any,
  sessionId: string
): Promise<AuthSession | null> {
  const result = await db.prepare(`
    SELECT * FROM auth_sessions 
    WHERE id = ? AND is_active = 1 AND expires_at > datetime('now')
  `).bind(sessionId).first();

  if (!result) {
    return null;
  }

  return {
    id: result.id,
    user_id: result.user_id,
    token: result.token,
    expires_at: result.expires_at,
    created_at: result.created_at,
    ip_address: result.ip_address,
    user_agent: result.user_agent,
    is_active: Boolean(result.is_active)
  };
}

// Invalidate session
export async function invalidateSession(
  db: any,
  sessionId: string
): Promise<void> {
  await db.prepare(`
    UPDATE auth_sessions 
    SET is_active = 0 
    WHERE id = ?
  `).bind(sessionId).run();
}

// Clean expired sessions
export async function cleanExpiredSessions(db: any): Promise<void> {
  await db.prepare(`
    DELETE FROM auth_sessions 
    WHERE expires_at < datetime('now')
  `).run();
}

// Record login attempt
export async function recordLoginAttempt(
  db: any,
  username: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string,
  failureReason?: string
): Promise<void> {
  await db.prepare(`
    INSERT INTO login_attempts (username, ip_address, user_agent, success, attempted_at, failure_reason)
    VALUES (?, ?, ?, ?, datetime('now'), ?)
  `).bind(
    username,
    ipAddress,
    userAgent,
    success ? 1 : 0,
    failureReason
  ).run();
}

// Check if user is locked out
export async function isUserLockedOut(
  db: any,
  username: string,
  ipAddress?: string
): Promise<boolean> {
  const lockoutTime = new Date(Date.now() - LOCKOUT_DURATION * 60 * 1000).toISOString();
  
  const result = await db.prepare(`
    SELECT COUNT(*) as attempt_count
    FROM login_attempts 
    WHERE username = ? 
      AND success = 0 
      AND attempted_at > ?
      ${ipAddress ? 'AND ip_address = ?' : ''}
  `).bind(
    username,
    lockoutTime,
    ...(ipAddress ? [ipAddress] : [])
  ).first();

  return result.attempt_count >= MAX_LOGIN_ATTEMPTS;
}

// Get user by username or email
export async function getUserByCredential(
  db: any,
  credential: string
): Promise<User | null> {
  const result = await db.prepare(`
    SELECT * FROM users 
    WHERE (username = ? OR email = ?) AND is_active = 1
  `).bind(credential, credential).first();

  if (!result) {
    return null;
  }

  return {
    id: result.id,
    username: result.username,
    email: result.email,
    full_name: result.full_name,
    role: result.role,
    is_active: Boolean(result.is_active),
    created_at: result.created_at,
    updated_at: result.updated_at,
    last_login: result.last_login,
    avatar_url: result.avatar_url,
    phone: result.phone,
    address: result.address
  };
}

// Update user last login
export async function updateUserLastLogin(
  db: any,
  userId: number
): Promise<void> {
  await db.prepare(`
    UPDATE users 
    SET last_login = datetime('now') 
    WHERE id = ?
  `).bind(userId).run();
}

// Validate password strength (very relaxed - user can set any password they want)
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Only require minimum length - user can set any password they want
  if (password.length < 4) {
    errors.push('Mật khẩu phải có ít nhất 4 ký tự');
  }

  // No other requirements - user freedom to set any password
  // Removed all character type requirements for maximum flexibility

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Generate secure random string
export function generateSecureRandom(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
