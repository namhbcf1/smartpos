/**
 * PRODUCTION SECURITY MIDDLEWARE
 * Comprehensive security configuration for production deployment
 */

import { Context, Next } from 'hono';
import { Env } from '../types';

/**
 * COMPREHENSIVE SECURITY HEADERS
 * Implements OWASP security header recommendations
 */
export const productionSecurityHeaders = async (c: Context, next: Next) => {
  await next();

  // OWASP Security Headers
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  
  // HSTS for HTTPS
  if (c.req.url.startsWith('https://')) {
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Needed for React
    "style-src 'self' 'unsafe-inline'", // Needed for CSS
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://smartpos-api.bangachieu2.workers.dev",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  c.header('Content-Security-Policy', csp);

  // Additional security headers
  c.header('Cross-Origin-Embedder-Policy', 'require-corp');
  c.header('Cross-Origin-Opener-Policy', 'same-origin');
  c.header('Cross-Origin-Resource-Policy', 'same-origin');
};

/**
 * PRODUCTION CORS CONFIGURATION
 * Strict CORS policy for production
 */
export const productionCORS = async (c: Context, next: Next) => {
  const origin = c.req.header('Origin');
  const allowedOrigins = [
    'https://smartpos-web.bangachieu2.pages.dev',
    'https://smartpos.bangachieu2.com', // If custom domain
    'https://smartpos-web.pages.dev' // Production frontend
    // NO localhost URLs - violates rules.md
  ];

  // Check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin);
  } else {
    c.header('Access-Control-Allow-Origin', 'null'); // Deny unknown origins
  }

  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  c.header('Access-Control-Allow-Credentials', 'true');
  c.header('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight requests
  if (c.req.method === 'OPTIONS') {
    return c.text('', 204 as any);
  }

  await next();
};

/**
 * PRODUCTION ENVIRONMENT VALIDATION
 * Ensures all required environment variables are set
 */
export const productionEnvironmentValidation = async (c: Context<{ Bindings: Env }>, next: Next) => {
  const requiredEnvVars = [
    'JWT_SECRET',
    'DB',
    'CACHE'
  ];

  const missingVars = requiredEnvVars.filter(varName => !c.env[varName as keyof Env]);

  if (missingVars.length > 0) {
    console.error('🚨 CRITICAL: Missing required environment variables:', missingVars);
    return c.json({
      success: false,
      message: 'Server configuration error',
      error: 'CONFIGURATION_ERROR'
    }, 500);
  }

  // Validate JWT secret strength
  const jwtSecret = c.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret === 'default-secret-key-for-development' || jwtSecret.length < 32) {
    console.error('🚨 CRITICAL: Weak or default JWT secret detected');
    return c.json({
      success: false,
      message: 'Server security configuration error',
      error: 'SECURITY_CONFIGURATION_ERROR'
    }, 500);
  }

  await next();
};

/**
 * PRODUCTION ACCESS LOGGING
 * Comprehensive request logging for security monitoring
 */
export const productionAccessLogger = async (c: Context, next: Next) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  const logData = {
    requestId,
    timestamp: new Date().toISOString(),
    method: c.req.method,
    url: c.req.url,
    userAgent: c.req.header('User-Agent'),
    ip: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
    referer: c.req.header('Referer'),
    origin: c.req.header('Origin')
  };

  // Add request ID to response headers
  c.header('X-Request-ID', requestId);

  try {
    await next();
    
    const duration = Date.now() - startTime;
    const responseLog = {
      ...logData,
      status: c.res.status,
      duration,
      success: c.res.status < 400
    };

    // Log successful requests (info level)
    if (c.res.status < 400) {
      console.log('✅ REQUEST:', JSON.stringify(responseLog));
    } else {
      // Log errors (warn/error level)
      console.warn('⚠️ REQUEST_ERROR:', JSON.stringify(responseLog));
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorLog = {
      ...logData,
      status: 500,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    };

    console.error('❌ REQUEST_FAILED:', JSON.stringify(errorLog));
    throw error;
  }
};

/**
 * PRODUCTION RATE LIMITING
 * Enhanced rate limiting with different tiers
 */
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}

const productionRateLimitConfigs: Record<string, RateLimitConfig> = {
  auth: { 
    windowMs: 15 * 60 * 1000, 
    maxRequests: 5,
    message: 'Too many authentication attempts'
  },
  api: { 
    windowMs: 60 * 1000, 
    maxRequests: 60,
    skipSuccessfulRequests: true
  },
  critical: { 
    windowMs: 60 * 1000, 
    maxRequests: 10,
    message: 'Rate limit exceeded for critical operations'
  },
  default: { 
    windowMs: 60 * 1000, 
    maxRequests: 100 
  }
};

export const productionRateLimit = (type: keyof typeof productionRateLimitConfigs = 'default') => {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    try {
      const config = productionRateLimitConfigs[type];
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
        console.warn(`🚨 RATE_LIMIT_EXCEEDED: ${clientIp} on ${type} endpoint (${requests.length}/${config?.maxRequests || 100})`);
        
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

      await next();

      // Remove successful requests if configured
      if ((config?.skipSuccessfulRequests || false) && c.res.status < 400) {
        requests.pop(); // Remove the request we just added
        await c.env.CACHE.put(key, JSON.stringify(requests));
      }

    } catch (error) {
      console.error('Rate limiting error:', error);
      // Continue on error to avoid blocking legitimate requests
      await next();
    }
  };
};

/**
 * PRODUCTION ERROR HANDLER
 * Secure error handling that doesn't expose internal details
 */
export const productionErrorHandler = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    console.error('🚨 PRODUCTION_ERROR:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      url: c.req.url,
      method: c.req.method,
      timestamp: new Date().toISOString()
    });

    // Return generic error message to prevent information disclosure
    return c.json({
      success: false,
      message: 'An internal server error occurred',
      error: 'INTERNAL_SERVER_ERROR'
    }, 500);
  }
};

/**
 * PRODUCTION HEALTH CHECK
 * Secure health check endpoint
 */
export const productionHealthCheck = async (c: Context<{ Bindings: Env }>) => {
  try {
    // Basic health checks without exposing sensitive information
    const checks = {
      database: false,
      cache: false,
      timestamp: new Date().toISOString()
    };

    // Test database connection
    try {
      await c.env.DB.prepare('SELECT 1').first();
      checks.database = true;
    } catch (error) {
      console.error('Health check - Database failed:', error);
    }

    // Test cache connection
    try {
      await c.env.CACHE.put('health_check', 'ok');
      const result = await c.env.CACHE.get('health_check');
      checks.cache = result === 'ok';
    } catch (error) {
      console.error('Health check - Cache failed:', error);
    }

    const isHealthy = checks.database && checks.cache;

    return c.json({
      success: true,
      status: isHealthy ? 'healthy' : 'degraded',
      checks: {
        database: checks.database ? 'pass' : 'fail',
        cache: checks.cache ? 'pass' : 'fail'
      },
      timestamp: checks.timestamp
    }, isHealthy ? 200 : 503);

  } catch (error) {
    console.error('Health check failed:', error);
    return c.json({
      success: false,
      status: 'unhealthy',
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    }, 503);
  }
};
