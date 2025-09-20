/**
 * ENHANCED SECURITY MIDDLEWARE
 * Fixes: Input validation, SQL injection, XSS, authentication bypass
 */

import { Context, Next } from 'hono';
import { z } from 'zod';
import { Env } from '../types';

// ============================================================================
// INPUT VALIDATION & SANITIZATION
// ============================================================================

/**
 * SQL Injection Protection - Enhanced
 */
export const enhancedSqlInjectionProtection = async (c: Context, next: Next) => {
  const url = c.req.url;
  const method = c.req.method;
  
  // Skip for safe methods and specific endpoints
  if (method === 'GET' && !url.includes('search') && !url.includes('filter')) {
    return next();
  }

  // SQL injection patterns (enhanced)
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(--|\/\*|\*\/|;|'|"|`)/g,
    /(\bOR\b|\bAND\b).*?[=<>]/gi,
    /(\bUNION\b.*?\bSELECT\b)/gi,
    /(\bINSERT\b.*?\bINTO\b)/gi,
    /(\bDROP\b.*?\bTABLE\b)/gi,
    /(\bEXEC\b|\bEXECUTE\b)/gi,
    /(\bSCRIPT\b.*?[<>])/gi,
  ];

  try {
    // Check URL parameters
    const url = new URL(c.req.url);
    for (const [key, value] of url.searchParams.entries()) {
      for (const pattern of sqlPatterns) {
        if (pattern.test(value)) {
          console.warn(`🚨 SQL injection attempt detected in URL param ${key}: ${value}`);
          return c.json({
            success: false,
            message: 'Invalid input detected',
            error: 'SECURITY_VIOLATION'
          }, 400);
        }
      }
    }

    // Check request body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const body = await c.req.json();
        const bodyStr = JSON.stringify(body);
        
        for (const pattern of sqlPatterns) {
          if (pattern.test(bodyStr)) {
            console.warn(`🚨 SQL injection attempt detected in request body: ${bodyStr.substring(0, 100)}`);
            return c.json({
              success: false,
              message: 'Invalid input detected',
              error: 'SECURITY_VIOLATION'
            }, 400);
          }
        }
      } catch (error) {
        // Invalid JSON - let other middleware handle it
      }
    }

    return next();
  } catch (error) {
    console.error('SQL injection protection error:', error);
    return next();
  }
};

/**
 * XSS Protection - Enhanced
 */
export const enhancedXssProtection = async (c: Context, next: Next) => {
  const method = c.req.method;
  
  if (!['POST', 'PUT', 'PATCH'].includes(method)) {
    return next();
  }

  // XSS patterns
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]+src[^>]*>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  ];

  try {
    const body = await c.req.json();
    const bodyStr = JSON.stringify(body);
    
    for (const pattern of xssPatterns) {
      if (pattern.test(bodyStr)) {
        console.warn(`🚨 XSS attempt detected: ${bodyStr.substring(0, 100)}`);
        return c.json({
          success: false,
          message: 'Invalid content detected',
          error: 'SECURITY_VIOLATION'
        }, 400);
      }
    }

    return next();
  } catch (error) {
    // Invalid JSON or other error - continue
    return next();
  }
};

/**
 * Enhanced Input Validation Middleware
 */
export const validateInput = (schema: z.ZodSchema) => {
  return async (c: Context, next: Next) => {
    try {
      const method = c.req.method;
      let data: any;

      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        data = await c.req.json();
      } else {
        // For GET requests, validate query parameters
        const url = new URL(c.req.url);
        data = Object.fromEntries(url.searchParams.entries());
      }

      // Validate and sanitize data
      const validatedData = schema.parse(data);
      
      // Store validated data in context
      c.set('validatedData', validatedData);
      
      return next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.warn('🚨 Input validation failed:', (error as any).errors);
        return c.json({
          success: false,
          message: 'Invalid input data',
          errors: (error as any).errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          })),
          error: 'VALIDATION_ERROR'
        }, 400);
      }
      
      console.error('Input validation error:', error);
      return c.json({
        success: false,
        message: 'Invalid request format',
        error: 'INVALID_REQUEST'
      }, 400);
    }
  };
};

// ============================================================================
// ENHANCED AUTHENTICATION & AUTHORIZATION
// ============================================================================

/**
 * Enhanced Authentication Middleware
 */
export const enhancedAuthenticate = async (c: Context<{ Bindings: Env }>, next: Next) => {
  try {
    // Skip authentication for public endpoints
    const publicEndpoints = [
      '/health',
      '/debug', // Remove in production
      '/test',  // Remove in production
    ];
    
    const path = new URL(c.req.url).pathname;
    if (publicEndpoints.some(endpoint => path.includes(endpoint))) {
      return next();
    }

    // Check for Authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({
        success: false,
        message: 'Authentication required',
        error: 'UNAUTHORIZED'
      }, 401);
    }

    const token = authHeader.substring(7);
    
    // SECURITY FIXED: Implement proper JWT validation
    if (!token || token.length < 10) {
      return c.json({
        success: false,
        message: 'Invalid authentication token',
        error: 'INVALID_TOKEN'
      }, 401);
    }

    // Proper JWT validation with secret - SECURITY FIXED: No default fallback
    try {
      const { verify } = await import('hono/jwt');
      const jwtSecret = c.env.JWT_SECRET;
      if (!jwtSecret) {
        return c.json({
          success: false,
          message: 'Server configuration error',
          error: 'MISSING_JWT_SECRET'
        }, 500);
      }
      const payload = await verify(token, jwtSecret);

      // Store actual user info from JWT payload
      c.set('jwtPayload', {
        id: payload.sub,
        username: payload.username,
        role: payload.role,
        store_id: payload.store || 1
      });
    } catch (jwtError) {
      return c.json({
        success: false,
        message: 'Invalid or expired token',
        error: 'TOKEN_VERIFICATION_FAILED'
      }, 401);
    }

    return next();
  } catch (error) {
    console.error('Authentication error:', error);
    return c.json({
      success: false,
      message: 'Authentication failed',
      error: 'AUTH_ERROR'
    }, 401);
  }
};

/**
 * Enhanced Authorization Middleware
 */
export const enhancedAuthorize = (allowedRoles: string[]) => {
  return async (c: Context, next: Next) => {
    try {
      const user = c.get('user');
      
      if (!user) {
        return c.json({
          success: false,
          message: 'User not authenticated',
          error: 'UNAUTHORIZED'
        }, 401);
      }

      if (!allowedRoles.includes(user.role)) {
        console.warn(`🚨 Authorization failed: User ${user.username} (${user.role}) attempted to access endpoint requiring roles: ${allowedRoles.join(', ')}`);
        return c.json({
          success: false,
          message: 'Insufficient permissions',
          error: 'FORBIDDEN'
        }, 403);
      }

      return next();
    } catch (error) {
      console.error('Authorization error:', error);
      return c.json({
        success: false,
        message: 'Authorization failed',
        error: 'AUTH_ERROR'
      }, 403);
    }
  };
};

// ============================================================================
// ENHANCED RATE LIMITING
// ============================================================================

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

const rateLimitConfigs: Record<string, RateLimitConfig> = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 requests per 15 minutes
  api: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
  upload: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 uploads per minute
  search: { windowMs: 60 * 1000, maxRequests: 50 }, // 50 searches per minute
};

/**
 * Enhanced Rate Limiting
 */
export const enhancedRateLimit = (type: keyof typeof rateLimitConfigs = 'api') => {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    try {
      const config = rateLimitConfigs[type];
      const clientIp = c.req.header('CF-Connecting-IP') || 
                      c.req.header('X-Forwarded-For') || 
                      c.req.header('X-Real-IP') || 
                      'unknown';
      
      const key = `rate_limit:${type}:${clientIp}`;
      const now = Date.now();
      const windowStart = now - (config?.windowMs || 60000);

      // Get current request count from KV store
      const currentData = await c.env.CACHE.get(key);
      let requests: number[] = currentData ? JSON.parse(currentData) : [];

      // Remove old requests outside the window
      requests = requests.filter(timestamp => timestamp > windowStart);

      // Check if limit exceeded
      if (requests.length >= (config?.maxRequests || 100)) {
        console.warn(`🚨 Rate limit exceeded for ${clientIp} on ${type} endpoint`);
        return c.json({
          success: false,
          message: (config?.message || 'Rate limit exceeded'),
          error: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((config?.windowMs || 60000) / 1000)
        }, 429);
      }

      // Add current request
      requests.push(now);

      // Store updated requests
      await c.env.CACHE.put(key, JSON.stringify(requests));

      // Add rate limit headers
      c.header('X-RateLimit-Limit', (config?.maxRequests || 100).toString());
      c.header('X-RateLimit-Remaining', ((config?.maxRequests || 100) - requests.length).toString());
      c.header('X-RateLimit-Reset', Math.ceil((now + (config?.windowMs || 60000)) / 1000).toString());

      return next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Continue on error to avoid blocking legitimate requests
      return next();
    }
  };
};

// ============================================================================
// SECURITY HEADERS
// ============================================================================

/**
 * Enhanced Security Headers
 */
export const enhancedSecurityHeaders = async (c: Context, next: Next) => {
  await next();

  // Security headers
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // HSTS (only for HTTPS)
  if (c.req.url.startsWith('https://')) {
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // CSP for API responses
  c.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none';");
};

// ============================================================================
// COMMON VALIDATION SCHEMAS
// ============================================================================

export const commonSchemas = {
  id: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a positive integer').transform(Number)
  }),
  
  pagination: z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('20').transform(Number),
    search: z.string().optional().default('').transform(s => s.trim())
  }),
  
  product: z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    sku: z.string().min(1).max(100),
    price: z.number().min(0),
    cost_price: z.number().min(0),
    category_id: z.number().int().positive(),
    stock: z.number().int().min(0),
  }),
  
  customer: z.object({
    full_name: z.string().min(1).max(255),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
  }),
  
  sale: z.object({
    customer_id: z.number().int().positive().optional(),
    items: z.array(z.object({
      product_id: z.number().int().positive(),
      quantity: z.number().positive(),
      unit_price: z.number().min(0)
    })).min(1),
    payment_method: z.enum(['cash', 'card', 'bank_transfer', 'mobile_payment', 'credit'])
  })
};
