import { Context, Next, MiddlewareHandler } from 'hono';
import { Env } from '../types';
import { cors } from 'hono/cors';
import { 
  getEnvVar, 
  validateJWTSecret, 
  validateEncryptionKey, 
  RateLimiter, 
  InputValidator, 
  SECURITY_HEADERS,
  sanitizeForLogging 
} from '../utils/security';

// Rate limiting middleware with different tiers
const RATE_LIMITS: Record<string, { limit: number, window: number }> = {
  'default': { limit: 1000, window: 60 }, // 1000 requests per minute
  'auth': { limit: 100, window: 60 }, // 100 auth requests per minute
  'critical': { limit: 500, window: 60 } // 500 requests per minute for critical operations
};

export const rateLimit = (tier: keyof typeof RATE_LIMITS = 'default'): MiddlewareHandler => {
  const { limit, window } = RATE_LIMITS[tier] || RATE_LIMITS.default;

  return async (c: Context, next: Next) => {
    // Skip rate limiting if KV is not available (fail-open for availability)
    if (!c.env || !c.env.SESSIONS) {
      console.warn('⚠️ Rate limiting KV binding missing - continuing without rate limit');
      return next();
    }

    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const route = c.req.path;
    const key = `ratelimit:${tier}:${ip}:${route}`;

    try {
      let counter = await c.env.SESSIONS.get(key);
      let count = counter ? parseInt(counter, 10) + 1 : 1;

      if (count > limit) {
        return c.json({
          success: false,
          message: 'Rate limit exceeded. Please try again later.',
          error: 'RATE_LIMIT_EXCEEDED'
        }, 429);
      }

      // Optimize KV writes: only update every 5 requests to reduce KV operations
      if (count % 5 === 1 || count <= 5) {
        try {
          await c.env.SESSIONS.put(key, count.toString(), { expirationTtl: window });
        } catch (kvError) {
          console.warn('⚠️ KV put failed - continuing with degraded rate limiting:', kvError);
          // FAIL-OPEN: Continue request even if KV write fails
        }
      }

      // Add rate limit headers
      c.header('X-RateLimit-Limit', limit.toString());
      c.header('X-RateLimit-Remaining', (limit - count).toString());

      return next();
    } catch (error) {
      console.warn('Rate limiting error, continuing without rate limit:', error);
      return next();
    }
  };
};

// Security headers middleware
export const securityHeaders: MiddlewareHandler = async (c, next) => {
  // Set all security headers from the security utils
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    c.header(key, value);
  });
  
  await next();
};

// CORS middleware - Proper implementation for credentials
export const corsSecurity: MiddlewareHandler = async (c, next) => {
  const origin = c.req.header('Origin');
  
  // Get allowed origins from environment variable
  const corsOrigins = c.env.CORS_ORIGINS || 'https://smartpos-web.pages.dev';
  const allowedOrigins = corsOrigins.split(',').map(url => url.trim());
  
  console.log('🔍 CORS: Checking origin:', origin);
  console.log('📋 CORS: Allowed origins from env:', allowedOrigins);
  
  // SECURITY FIXED: Strict CORS policy - exact origin matching only
  if (origin && allowedOrigins.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin);
    console.log('✅ CORS: Origin allowed:', origin);
  } else {
    // SECURITY FIXED: Deny unknown origins completely
    console.log('🚨 CORS: Origin denied:', origin);
    console.log('📋 CORS: Allowed origins:', allowedOrigins);
    c.header('Access-Control-Allow-Origin', 'null');
  }
  
  // Required headers for credentials
  c.header('Access-Control-Allow-Credentials', 'true');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, X-Client-Version, Origin, X-Request-ID, X-Timestamp');
  c.header('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (c.req.method === 'OPTIONS') {
    console.log('CORS: Handling preflight request for origin:', origin);
    return c.text('', 204);
  }

  await next();
};

// SQL injection protection middleware
export const sqlInjectionProtection: MiddlewareHandler = async (c, next) => {
  const url = c.req.url;
  const body = await c.req.text();
  c.req.raw = new Request(c.req.url, {
    method: c.req.method,
    headers: c.req.header(),
    body: body ? body : undefined
  });
  
  // Simple patterns to detect SQL injection attempts
  const sqlPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))union/i
  ];
  
  // Check URL and body for SQL injection patterns
  for (const pattern of sqlPatterns) {
    if (pattern.test(url) || (body && pattern.test(body))) {
      console.error('Possible SQL injection attempt detected:', { url, body: body.substring(0, 100) });
      return c.json({
        success: false,
        message: 'Possible SQL injection detected',
        error: 'SECURITY_VIOLATION'
      }, 403);
    }
  }
  
  await next();
};

// Request logging middleware with sanitization
export const accessLogger: MiddlewareHandler = async (c, next) => {
  const start = Date.now();
  const { method, url } = c.req;
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
  const userAgent = c.req.header('User-Agent') || 'unknown';
  
  // Sanitize URL for logging (remove sensitive query params)
  const sanitizedUrl = url.replace(/([?&])(password|token|secret|key)=[^&]*/gi, '$1$2=[REDACTED]');
  
  await next();
  
  const end = Date.now();
  const responseTime = end - start;
  
  // Log the request with sanitized data
  console.log(`[${new Date().toISOString()}] ${method} ${sanitizedUrl} ${c.res.status} ${responseTime}ms - ${ip} ${InputValidator.sanitizeString(userAgent, 200)}`);
};

// Environment validation middleware
export const validateEnvironment: MiddlewareHandler = async (c, next) => {
  try {
    // Validate JWT secret if present
    const jwtSecret = getEnvVar(c.env, 'JWT_SECRET', false);
    if (jwtSecret) {
      validateJWTSecret(jwtSecret);
    }
    
    // Validate encryption key if present
    const encryptionKey = getEnvVar(c.env, 'ENCRYPTION_KEY', false);
    if (encryptionKey) {
      validateEncryptionKey(encryptionKey);
    }
    
    await next();
  } catch (error) {
    console.error('Environment validation failed:', error);
    return c.json({
      success: false,
      message: 'Server configuration error',
      error: 'CONFIGURATION_ERROR'
    }, 500);
  }
};

// Audit logging for important actions with sanitization
export const auditLogger = async (c: Context, action: string, details: Record<string, any> = {}) => {
  if (!c.env || !c.env.DB) {
    console.error('Audit logging failed: DB binding missing');
    return;
  }
  
  try {
    const timestamp = new Date().toISOString();
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const userAgent = c.req.header('User-Agent') || 'unknown';
    const user = c.get('jwtPayload')?.sub || 'anonymous';
    
    // Sanitize details before logging
    const sanitizedDetails = sanitizeForLogging(details);
    
    // Insert audit log into database
    await c.env.DB.prepare(`
      INSERT INTO activity_logs 
      (user_id, action, ip_address, user_agent, details, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `)
    .bind(
      user,
      action,
      InputValidator.sanitizeString(ip, 45), // Max IPv6 length
      InputValidator.sanitizeString(userAgent, 500),
      JSON.stringify(sanitizedDetails)
    )
    .run();
  } catch (error) {
    console.error('Error writing audit log:', sanitizeForLogging(error));
  }
}; 