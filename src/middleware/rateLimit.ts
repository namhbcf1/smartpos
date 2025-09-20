import { Context, Next } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (c: Context) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

export const rateLimit = (config: RateLimitConfig) => {
  const {
    windowMs = 60000, // 1 minute
    maxRequests = 100,
    keyGenerator = (c: Context) => c.req.header('cf-connecting-ip') || 'unknown',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    message = 'Too many requests'
  } = config;

  return async (c: Context, next: Next) => {
    const key = `rate_limit_${keyGenerator(c)}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      // Get existing rate limit data from KV or cookie
      let rateLimitInfo: RateLimitInfo | null = null;
      
      try {
        const stored = await c.env?.KV_CACHE?.get(key);
        if (stored) {
          rateLimitInfo = JSON.parse(stored);
        }
      } catch (error) {
        console.warn('Failed to get rate limit data from KV:', error);
      }

      // If no data or window has expired, reset
      if (!rateLimitInfo || rateLimitInfo.resetTime < now) {
        rateLimitInfo = {
          count: 0,
          resetTime: now + windowMs
        };
      }

      // Check if limit exceeded
      if (rateLimitInfo.count >= maxRequests) {
        const retryAfter = Math.ceil((rateLimitInfo.resetTime - now) / 1000);
        
        return c.json({
          error: 'Too Many Requests',
          message,
          retryAfter,
          limit: maxRequests,
          remaining: 0,
          resetTime: new Date(rateLimitInfo.resetTime).toISOString()
        }, 429, {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitInfo.resetTime.toString()
        });
      }

      // Increment counter
      rateLimitInfo.count++;

      // Store updated data
      try {
        await c.env?.KV_CACHE?.put(key, JSON.stringify(rateLimitInfo), {
          expirationTtl: Math.ceil(windowMs / 1000)
        });
      } catch (error) {
        console.warn('Failed to store rate limit data in KV:', error);
      }

      // Add rate limit headers
      c.header('X-RateLimit-Limit', maxRequests.toString());
      c.header('X-RateLimit-Remaining', (maxRequests - rateLimitInfo.count).toString());
      c.header('X-RateLimit-Reset', rateLimitInfo.resetTime.toString());

      await next();

      // Optionally skip successful requests from counting
      if (skipSuccessfulRequests && c.res.status < 400) {
        rateLimitInfo.count = Math.max(0, rateLimitInfo.count - 1);
        try {
          await c.env?.KV_CACHE?.put(key, JSON.stringify(rateLimitInfo), {
            expirationTtl: Math.ceil(windowMs / 1000)
          });
        } catch (error) {
          console.warn('Failed to update rate limit data:', error);
        }
      }

    } catch (error) {
      console.error('Rate limiting error:', error);
      // Continue without rate limiting if there's an error
      await next();
    }
  };
};

// Predefined rate limiters
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyGenerator: (c: Context) => {
    const ip = c.req.header('cf-connecting-ip') || 'unknown';
    const userAgent = c.req.header('user-agent') || '';
    return `auth_${ip}_${userAgent.slice(0, 50)}`;
  },
  message: 'Too many authentication attempts'
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  message: 'API rate limit exceeded'
});

export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  message: 'Rate limit exceeded'
});
