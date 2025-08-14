import { Env } from '../types';

/**
 * Security utilities for handling sensitive data and environment variables
 */

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

/**
 * Safely get environment variable with validation
 */
export function getEnvVar(env: Env, key: string, required: boolean = true): string {
  const value = env[key as keyof Env] as string;
  
  if (required && (!value || value.trim() === '')) {
    throw new SecurityError(`Required environment variable ${key} is not set`);
  }
  
  return value || '';
}

/**
 * Validate JWT secret strength
 */
export function validateJWTSecret(secret: string): boolean {
  if (!secret || secret.length < 32) {
    throw new SecurityError('JWT secret must be at least 32 characters long');
  }
  
  // Check for common weak patterns
  const weakPatterns = [
    /^(secret|password|key|token)/i,
    /^(123|abc|test|dev)/i,
    /^(.)\1{10,}$/, // Repeated characters
  ];
  
  for (const pattern of weakPatterns) {
    if (pattern.test(secret)) {
      throw new SecurityError('JWT secret appears to be weak or predictable');
    }
  }
  
  return true;
}

/**
 * Validate encryption key
 */
export function validateEncryptionKey(key: string): boolean {
  if (!key || key.length !== 32) {
    throw new SecurityError('Encryption key must be exactly 32 characters long');
  }
  
  return true;
}

/**
 * Generate secure random string
 */
export function generateSecureKey(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Sanitize sensitive data for logging
 */
export function sanitizeForLogging(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sensitiveKeys = [
    'password', 'secret', 'token', 'key', 'auth', 'credential',
    'jwt', 'session', 'cookie', 'hash', 'salt'
  ];
  
  const sanitized = { ...data };
  
  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  }
  
  return sanitized;
}

/**
 * Rate limiting with exponential backoff
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number; backoffUntil: number }> = new Map();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000, // 15 minutes
    private backoffMultiplier: number = 2
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);
    
    if (!record) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now, backoffUntil: 0 });
      return true;
    }
    
    // Check if still in backoff period
    if (now < record.backoffUntil) {
      return false;
    }
    
    // Reset if window has passed
    if (now - record.lastAttempt > this.windowMs) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now, backoffUntil: 0 });
      return true;
    }
    
    // Increment attempts
    record.count++;
    record.lastAttempt = now;
    
    if (record.count > this.maxAttempts) {
      // Calculate exponential backoff
      const backoffMs = this.windowMs * Math.pow(this.backoffMultiplier, record.count - this.maxAttempts);
      record.backoffUntil = now + backoffMs;
      return false;
    }
    
    return true;
  }
  
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

/**
 * Input validation and sanitization
 */
export class InputValidator {
  static sanitizeString(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') {
      throw new SecurityError('Input must be a string');
    }
    
    // Remove null bytes and control characters
    let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
  }
  
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }
  
  static validatePhone(phone: string): boolean {
    // Vietnamese phone number format
    const phoneRegex = /^(\+84|84|0)[1-9][0-9]{8,9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }
  
  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Secure headers configuration
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "font-src 'self' fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' *.workers.dev *.pages.dev wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
} as const;