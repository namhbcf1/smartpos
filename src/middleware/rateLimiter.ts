/**
 * Rate Limiter Middleware for Cloudflare Workers
 *
 * Implements sliding window rate limiting to prevent API abuse
 * and protect against brute force attacks.
 *
 * Features:
 * - Sliding window algorithm
 * - Per-IP rate limiting
 * - Custom limits for different endpoints
 * - Cloudflare KV storage for distributed rate limiting
 */

import { Context, Next } from 'hono';

export interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  keyPrefix?: string;  // Optional prefix for storage keys
  skipFailedRequests?: boolean;  // Skip counting failed requests
  skipSuccessfulRequests?: boolean;  // Skip counting successful requests
}

// Default rate limit configurations
export const RATE_LIMITS = {
  // Authentication endpoints - strict limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 login attempts per 15 minutes
    keyPrefix: 'rl:auth:'
  },

  // General API endpoints - moderate limits
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    keyPrefix: 'rl:api:'
  },

  // Public endpoints - relaxed limits
  public: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
    keyPrefix: 'rl:public:'
  },

  // Heavy operations (exports, reports) - strict limits
  heavy: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 requests per minute
    keyPrefix: 'rl:heavy:'
  }
};

/**
 * Get client IP address from request
 */
function getClientIP(c: Context): string {
  // Cloudflare provides the actual client IP in the CF object
  const cfIP = (c.req.raw as any).cf?.ip;
  if (cfIP) return cfIP;

  // Fallback to headers
  return (
    c.req.header('CF-Connecting-IP') ||
    c.req.header('X-Forwarded-For')?.split(',')[0].trim() ||
    c.req.header('X-Real-IP') ||
    'unknown'
  );
}

/**
 * Create rate limiter middleware
 */
export function rateLimiter(config: RateLimitConfig) {
  return async (c: Context, next: Next) => {
    const KV = c.env.RATE_LIMIT_KV || c.env.CACHE_KV;

    // Skip if no KV available (development mode)
    if (!KV) {
      console.warn('⚠️ Rate limiting disabled: No KV namespace configured');
      return next();
    }

    const ip = getClientIP(c);
    const key = `${config.keyPrefix || 'rl:'}${ip}`;
    const now = Date.now();

    try {
      // Get current rate limit data
      const dataStr = await KV.get(key);
      const data = dataStr ? JSON.parse(dataStr) : { requests: [], windowStart: now };

      // Remove requests outside the current window
      const windowStart = now - config.windowMs;
      data.requests = data.requests.filter((timestamp: number) => timestamp > windowStart);

      // Check if rate limit exceeded
      if (data.requests.length >= config.maxRequests) {
        const oldestRequest = Math.min(...data.requests);
        const retryAfter = Math.ceil((oldestRequest + config.windowMs - now) / 1000);

        return c.json({
          success: false,
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${retryAfter} seconds.`,
          retryAfter
        }, 429, {
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(oldestRequest + config.windowMs).toISOString(),
          'Retry-After': retryAfter.toString()
        });
      }

      // Add current request
      data.requests.push(now);

      // Store updated data (TTL = window + 1 minute for safety)
      const ttl = Math.ceil(config.windowMs / 1000) + 60;
      await KV.put(key, JSON.stringify(data), { expirationTtl: ttl });

      // Add rate limit headers
      c.header('X-RateLimit-Limit', config.maxRequests.toString());
      c.header('X-RateLimit-Remaining', (config.maxRequests - data.requests.length).toString());
      c.header('X-RateLimit-Reset', new Date(now + config.windowMs).toISOString());

      await next();

    } catch (error) {
      console.error('❌ Rate limiter error:', error);
      // Continue on error (fail open)
      await next();
    }
  };
}

/**
 * Predefined rate limiters for common scenarios
 */
export const authRateLimiter = () => rateLimiter(RATE_LIMITS.auth);
export const apiRateLimiter = () => rateLimiter(RATE_LIMITS.api);
export const publicRateLimiter = () => rateLimiter(RATE_LIMITS.public);
export const heavyRateLimiter = () => rateLimiter(RATE_LIMITS.heavy);

/**
 * Adaptive rate limiter that adjusts based on user role
 */
export function adaptiveRateLimiter() {
  return async (c: Context, next: Next) => {
    const user = c.get('user');

    // Higher limits for authenticated admins
    if (user?.role === 'admin') {
      return rateLimiter({
        windowMs: 60 * 1000,
        maxRequests: 300, // 300 req/min for admins
        keyPrefix: 'rl:admin:'
      })(c, next);
    }

    // Higher limits for authenticated staff
    if (user?.role === 'staff' || user?.role === 'manager') {
      return rateLimiter({
        windowMs: 60 * 1000,
        maxRequests: 200, // 200 req/min for staff
        keyPrefix: 'rl:staff:'
      })(c, next);
    }

    // Default limits for everyone else
    return apiRateLimiter()(c, next);
  };
}

/**
 * Smart rate limiter for specific endpoints
 */
export function smartRateLimiter(endpoint: string) {
  const endpointLimits: Record<string, RateLimitConfig> = {
    '/auth/login': RATE_LIMITS.auth,
    '/auth/register': RATE_LIMITS.auth,
    '/api/customers/export': RATE_LIMITS.heavy,
    '/api/reports/generate': RATE_LIMITS.heavy,
    '/api/invoices/pdf': RATE_LIMITS.heavy,
    '/public/warranty/check': RATE_LIMITS.public
  };

  const config = endpointLimits[endpoint] || RATE_LIMITS.api;
  return rateLimiter(config);
}
