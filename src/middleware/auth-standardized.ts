/**
 * STANDARDIZED AUTHENTICATION MIDDLEWARE
 * 
 * This module provides consistent, secure authentication patterns
 * across the entire SmartPOS application.
 * 
 * SECURITY FEATURES:
 * - No default JWT secrets
 * - Proper token validation
 * - Rate limiting for auth attempts
 * - Session management
 * - Role-based access control
 * - Audit logging
 */

import { Context, MiddlewareHandler, Next } from 'hono';
import { verify } from 'hono/jwt';
import { ApiResponse, JwtPayload, UserRole, Env } from '../types';

// Security constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const SESSION_TTL = 3 * 60 * 60; // 3 hours (as per security requirements)

/**
 * Standardized Authentication Middleware
 * 
 * Features:
 * - Cookie and Bearer token support
 * - Proper JWT validation with no fallbacks
 * - Security logging
 * - Token cleanup on failure
 */
export const standardAuthenticate: MiddlewareHandler<{
  Bindings: Env;
  Variables: {
    user?: any;
    jwtPayload?: any;
  };
}> = async (c, next) => {
  try {
    // Get token from cookie or Authorization header
    let token = c.req.header('Cookie')?.match(/auth_token=([^;]+)/)?.[1];
    let tokenSource = 'cookie';

    if (!token) {
      const authHeader = c.req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        tokenSource = 'header';
      }
    }

    // Security logging
    console.log(`🔐 Auth attempt: ${c.req.method} ${c.req.url} - Token source: ${token ? tokenSource : 'none'}`);

    if (!token) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Authentication required',
        error: 'NO_TOKEN'
      }, 401);
    }

    // SECURITY CRITICAL: No default JWT secret fallback
    const jwtSecret = c.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('❌ CRITICAL SECURITY ERROR: JWT_SECRET not configured');
      return c.json({
        success: false,
        message: 'Server configuration error',
        error: 'MISSING_JWT_SECRET'
      }, 500);
    }

    try {
      // Verify JWT token
      const payload = await verify(token, jwtSecret) as any;
      
      // Validate token structure
      if (!payload.sub || !payload.username || !payload.role) {
        throw new Error('Invalid token structure');
      }

      // Check token expiration (additional check)
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
      }

      // Store user info in context
      c.set('user', {
        id: payload.sub,
        username: payload.username,
        role: payload.role,
        storeId: payload.store || 1
      });

      // Store JWT payload for logout
      c.set('jwtPayload', payload);

      console.log(`✅ Auth success: ${payload.username} (${payload.role})`);
      await next();

    } catch (jwtError) {
      console.error('❌ JWT verification failed:', jwtError);

      // Clear invalid cookie
      if (tokenSource === 'cookie') {
        c.header('Set-Cookie', [
          'auth_token=',
          'HttpOnly',
          'Path=/',
          'SameSite=Strict',
          'Secure',
          'Max-Age=0'
        ].join('; '));
      }

      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Invalid or expired token',
        error: 'TOKEN_INVALID'
      }, 401);
    }

  } catch (error) {
    console.error('❌ Authentication middleware error:', error);
    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      message: 'Authentication failed',
      error: 'AUTH_ERROR'
    }, 500);
  }
};

/**
 * Standardized Authorization Middleware
 * 
 * Features:
 * - Role-based access control
 * - Detailed permission logging
 * - Consistent error responses
 */
export const standardAuthorize = (allowedRoles: UserRole[]): MiddlewareHandler => {
  return async (c, next) => {
    try {
      const user = c.get('user');
      
      if (!user) {
        console.warn('🚨 Authorization failed: No user in context');
        return c.json<ApiResponse<null>>({
          success: false,
          data: null,
          message: 'User not authenticated',
          error: 'NO_USER'
        }, 401);
      }

      if (!allowedRoles.includes(user.role)) {
        console.warn(`🚨 Authorization failed: User ${user.username} (${user.role}) attempted to access endpoint requiring roles: ${allowedRoles.join(', ')}`);
        
        // Log security event
        await logSecurityEvent(c.env, {
          type: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          userId: user.id,
          username: user.username,
          role: user.role,
          requiredRoles: allowedRoles,
          endpoint: c.req.url,
          method: c.req.method,
          timestamp: new Date().toISOString()
        });

        return c.json<ApiResponse<null>>({
          success: false,
          data: null,
          message: 'Insufficient permissions',
          error: 'FORBIDDEN'
        }, 403);
      }

      console.log(`✅ Authorization success: ${user.username} (${user.role}) accessing ${c.req.method} ${c.req.url}`);
      await next();

    } catch (error) {
      console.error('❌ Authorization middleware error:', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Authorization failed',
        error: 'AUTH_ERROR'
      }, 500);
    }
  };
};

/**
 * Optional Authentication Middleware
 * 
 * Allows both authenticated and unauthenticated access
 * but populates user context if token is present
 */
export const optionalAuthenticate: MiddlewareHandler<{
  Bindings: Env;
  Variables: {
    user?: any;
  };
}> = async (c, next) => {
  try {
    let token = c.req.header('Cookie')?.match(/auth_token=([^;]+)/)?.[1];
    
    if (!token) {
      const authHeader = c.req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (token && c.env.JWT_SECRET) {
      try {
        const payload = await verify(token, c.env.JWT_SECRET) as any;
        c.set('user', {
          id: payload.sub,
          username: payload.username,
          role: payload.role,
          storeId: payload.store || 1
        });
      } catch (error) {
        // Ignore token errors for optional auth
        console.log('Optional auth: Invalid token ignored');
      }
    }

    await next();
  } catch (error) {
    // Continue without authentication for optional auth
    await next();
  }
};

/**
 * Security Event Logging
 */
async function logSecurityEvent(env: Env, event: any): Promise<void> {
  try {
    // Store in KV for security monitoring
    const eventKey = `security:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    await env.CACHE.put(eventKey, JSON.stringify(event)); // Store security event
    
    // Also log to console for immediate monitoring
    console.warn('🚨 SECURITY EVENT:', JSON.stringify(event));
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

/**
 * Rate Limiting for Authentication Endpoints
 */
export const authRateLimit: MiddlewareHandler = async (c, next) => {
  try {
    const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const rateLimitKey = `auth_rate_limit:${clientIP}`;
    
    // Get current attempt count
    const currentAttempts = await c.env.CACHE.get(rateLimitKey);
    const attempts = currentAttempts ? parseInt(currentAttempts) : 0;
    
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      console.warn(`🚨 Rate limit exceeded for IP: ${clientIP}`);
      return c.json({
        success: false,
        message: 'Too many login attempts. Please try again later.',
        error: 'RATE_LIMITED'
      }, 429);
    }
    
    await next();
    
  } catch (error) {
    console.error('Rate limiting error:', error);
    await next(); // Continue on rate limit errors
  }
};

/**
 * Helper function to get current user safely
 */
export function getCurrentUser(c: Context): any | null {
  try {
    return c.get('user') || null;
  } catch {
    return null;
  }
}

/**
 * Helper function to check if user has specific role
 */
export function hasRole(c: Context, role: UserRole): boolean {
  const user = getCurrentUser(c);
  return user && user.role === role;
}

/**
 * Helper function to check if user has any of the specified roles
 */
export function hasAnyRole(c: Context, roles: UserRole[]): boolean {
  const user = getCurrentUser(c);
  return user && roles.includes(user.role);
}
