/**
 * STANDARDIZED AUTHENTICATION MIDDLEWARE
 *
 * This is the main authentication middleware for SmartPOS.
 * Features:
 * - Cookie and Bearer token support
 * - Proper JWT validation with no fallbacks
 * - Security logging and monitoring
 * - Token cleanup on failure
 * - Session management
 */

import { Context, MiddlewareHandler, Next } from 'hono';
import { verify } from 'hono/jwt';
import { ApiResponse, JwtPayload, UserRole, Env } from '../types';

// Security constants
const SESSION_TTL = 24 * 60 * 60; // 24 hours
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Main authentication middleware
export const authenticate: MiddlewareHandler<{
  Bindings: Env;
  Variables: {
    user?: any;
    userId?: string;
    tenantId?: string;
    jwtPayload?: any;
  };
}> = async (c, next) => {
  try {
    // Get token from cookie or Authorization header
    let token = c.req.header('Cookie')?.split('auth_token=')[1]?.split(';')[0];
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

    // Verify JWT token
    try {
      const payload = await verify(token, jwtSecret) as any;
      console.log('✅ JWT token verified successfully');

      // Validate token expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        throw new Error('Token expired');
      }

      // Store user and multi-tenant context
      const userId = String(payload.sub || payload.userId || '1');
      const tenantId = (payload as any).tenantId || 'default';
      c.set('user', {
        id: userId,
        username: (payload as any).username,
        role: (payload as any).role,
        storeId: (payload as any).store || (payload as any).storeId || 1
      });
      c.set('userId', userId);
      c.set('tenantId', tenantId);
      // Store JWT payload for logout and session management
      c.set('jwtPayload', payload);

      // Log successful authentication
      console.log(`✅ User authenticated: ${payload.username} (${payload.role})`);

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

    // Clear cookie on any error
    c.header('Set-Cookie', [
      'auth_token=',
      'HttpOnly',
      'Path=/',
      'SameSite=Strict',
      'Secure',
      'Max-Age=0'
    ].join('; '));

    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      message: 'Authentication failed',
      error: 'AUTH_ERROR'
    }, 500);
  }
};

// Helper function to check if user has required role
export const requireRole = (requiredRole: UserRole): MiddlewareHandler<{
  Bindings: Env;
  Variables: {
    user?: any;
  };
}> => {
  return async (c, next) => {
    const user = c.get('user');

    if (!user) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Authentication required',
        error: 'NO_USER'
      }, 401);
    }

    // Role hierarchy: admin > manager > cashier > inventory > sales_agent
    const roleHierarchy = {
      'admin': 5,
      'manager': 4,
      'cashier': 3,
      'inventory': 2,
      'sales_agent': 1,
      'affiliate': 0
    };

    const userLevel = roleHierarchy[(user?.role || '').toLowerCase() as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    if (userLevel < requiredLevel) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Insufficient permissions',
        error: 'INSUFFICIENT_PERMISSIONS'
      }, 403);
    }

    await next();
  };
};

// Middleware để kiểm tra vai trò người dùng
export const authorize = (roles: UserRole[]): MiddlewareHandler => {
  return async (c, next) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Chưa đăng nhập'
      }, 401);
    }
    
    if (!roles.includes(user.role)) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Không có quyền thực hiện thao tác này'
      }, 403);
    }
    
    await next();
  };
};

// Middleware kiểm tra truy cập chỉ cho cửa hàng của user (hoặc admin/manager)
export const storeAccess: MiddlewareHandler = async (c, next) => {
  const user = c.get('user');
  
  if (!user) {
    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      message: 'Chưa đăng nhập'
    }, 401);
  }
  
  // Admin và manager có thể truy cập tất cả cửa hàng
  if (user.role === 'admin' || user.role === 'manager') {
    await next();
    return;
  }
  
  // Lấy store_id từ request
  const storeId = c.req.param('storeId') || c.req.query('store_id');
  
  // Nếu không có storeId, sử dụng store của user
  if (!storeId) {
    c.set('storeId', user.storeId);
    await next();
    return;
  }
  
  // Kiểm tra storeId có khớp với store của user không
  if (parseInt(storeId) !== user.storeId) {
    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      message: 'Không có quyền truy cập cửa hàng này'
    }, 403);
  }
  
  await next();
};

// Helper để lấy thông tin user từ context
export function getUser(c: Context) {
  return c.get('user');
} 