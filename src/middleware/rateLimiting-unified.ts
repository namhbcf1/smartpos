/**
 * UNIFIED RATE LIMITING MIDDLEWARE
 *
 * Consolidates all rate limiting functionality with configurable storage
 * backend (KV store or in-memory fallback) and environment-based config.
 */

import { Context, Next } from 'hono';
import { Env } from '../types';

// Rate limiting strategies
export enum RateLimitStrategy {
  FIXED_WINDOW = 'fixed_window',
  SLIDING_WINDOW = 'sliding_window',
  TOKEN_BUCKET = 'token_bucket'
}

// Rate limit configuration interface
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  strategy?: RateLimitStrategy;
  keyGenerator?: (c: Context) => string;
  skipIf?: (c: Context) => boolean;
  message?: string;
  statusCode?: number;
  headers?: boolean;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// Rate limit state interface
interface RateLimitState {
  count: number;
  resetTime: number;
  tokens?: number;
  lastRefill?: number;
  requests?: Array<{ timestamp: number; count: number }>;
}

// In-memory fallback store
const memoryStore = new Map<string, RateLimitState>();

/**
 * Clean up expired entries from memory store (called on demand)
 */
function cleanExpiredEntries() {
  const now = Date.now();
  for (const [key, state] of memoryStore.entries()) {
    if (now > state.resetTime) {
      memoryStore.delete(key);
    }
  }
}

/**
 * Default key generator using IP address and user ID if available
 */
function getDefaultKey(c: Context): string {
  const user = c.get('user');
  const userId = user?.id || user?.sub;

  if (userId) {
    return `user:${userId}`;
  }

  const ip = c.req.header('cf-connecting-ip') ||
             c.req.header('x-forwarded-for') ||
             c.req.header('x-real-ip') ||
             'unknown';

  return `ip:${ip}`;
}

/**
 * Get rate limit state from KV store or memory fallback
 */
async function getRateLimitState(env: Env, key: string): Promise<RateLimitState> {
  try {
    // Try KV store first
    if (env.RATE_LIMIT_KV || env.KV_CACHE) {
      const kvStore = env.RATE_LIMIT_KV || env.KV_CACHE;
      const stored = await kvStore.get(`ratelimit:${key}`);
      if (stored) {
        return JSON.parse(stored);
      }
    }
  } catch (error) {
    console.warn('KV rate limit storage failed, falling back to memory:', error);
  }

  // Fallback to memory store
  // Occasionally clean expired entries
  if (Math.random() < 0.01) { // 1% chance to clean
    cleanExpiredEntries();
  }

  return memoryStore.get(key) || {
    count: 0,
    resetTime: 0
  };
}

/**
 * Update rate limit state in storage
 */
async function updateRateLimitState(
  env: Env,
  key: string,
  state: RateLimitState,
  ttlSeconds: number
): Promise<void> {
  try {
    // Try KV store first
    if (env.RATE_LIMIT_KV || env.KV_CACHE) {
      const kvStore = env.RATE_LIMIT_KV || env.KV_CACHE;
      await kvStore.put(
        `ratelimit:${key}`,
        JSON.stringify(state),
        { expirationTtl: Math.max(60, ttlSeconds) }
      );
      return;
    }
  } catch (error) {
    console.warn('KV rate limit update failed, using memory:', error);
  }

  // Fallback to memory store
  memoryStore.set(key, state);
}

/**
 * Check rate limit using fixed window strategy
 */
function checkFixedWindow(
  config: RateLimitConfig,
  state: RateLimitState,
  now: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
  const resetTime = windowStart + config.windowMs;

  // Reset if we're in a new window
  if (state.resetTime !== resetTime) {
    state.count = 0;
    state.resetTime = resetTime;
  }

  const allowed = state.count < config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - state.count - (allowed ? 1 : 0));

  return { allowed, remaining, resetTime };
}

/**
 * Create unified rate limiting middleware
 */
export function createRateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    strategy = RateLimitStrategy.FIXED_WINDOW,
    keyGenerator = getDefaultKey,
    skipIf,
    message = 'Too many requests, please try again later',
    statusCode = 429,
    headers = true,
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = config;

  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    try {
      // Skip if condition is met
      if (skipIf && skipIf(c)) {
        await next();
        return;
      }

      const key = keyGenerator(c);
      const now = Date.now();

      // Get current state
      const state = await getRateLimitState(c.env, key);

      // Check rate limit (currently only fixed window implemented)
      const { allowed, remaining, resetTime } = checkFixedWindow(
        { windowMs, maxRequests, strategy },
        state,
        now
      );

      if (!allowed) {
        // Update state for failed request if not skipping
        if (!skipFailedRequests) {
          state.count++;
          const ttlSeconds = Math.ceil((resetTime - now) / 1000);
          await updateRateLimitState(c.env, key, state, ttlSeconds);
        }

        // Set rate limit headers
        if (headers) {
          c.header('X-RateLimit-Limit', maxRequests.toString());
          c.header('X-RateLimit-Remaining', '0');
          c.header('X-RateLimit-Reset', resetTime.toString());
          c.header('Retry-After', Math.ceil((resetTime - now) / 1000).toString());
        }

        return c.json({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message,
          details: {
            limit: maxRequests,
            window: windowMs,
            resetTime: new Date(resetTime).toISOString()
          }
        }, { status: statusCode as any });
      }

      // Update state for allowed request
      state.count++;
      const ttlSeconds = Math.ceil((resetTime - now) / 1000);
      await updateRateLimitState(c.env, key, state, ttlSeconds);

      // Set rate limit headers
      if (headers) {
        c.header('X-RateLimit-Limit', maxRequests.toString());
        c.header('X-RateLimit-Remaining', remaining.toString());
        c.header('X-RateLimit-Reset', resetTime.toString());
      }

      await next();

      // Handle successful request skipping
      if (skipSuccessfulRequests && c.res.status < 400) {
        state.count = Math.max(0, state.count - 1);
        await updateRateLimitState(c.env, key, state, ttlSeconds);
      }

    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open - continue without rate limiting on errors
      await next();
    }
  };
}

/**
 * Environment-configurable rate limit factory
 */
export function createConfigurableRateLimit(
  type: 'auth' | 'api' | 'public' | 'upload',
  overrides?: Partial<RateLimitConfig>
) {
  // Default configurations
  const defaults: Record<string, RateLimitConfig> = {
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,            // 5 attempts per 15 minutes
      message: 'Too many authentication attempts, please try again later',
      keyGenerator: getDefaultKey
    },
    api: {
      windowMs: 1 * 60 * 1000,   // 1 minute
      maxRequests: 10000,        // Increased to 10,000 requests per minute
      keyGenerator: getDefaultKey,
      skipIf: (c: Context) => {
        const user = c.get('user');
        // Always skip for authenticated users
        return !!c.get('jwtPayload') || user?.role === 'admin';
      }
    },
    public: {
      windowMs: 1 * 60 * 1000,   // 1 minute
      maxRequests: 20,           // 20 requests per minute
      keyGenerator: getDefaultKey
    },
    upload: {
      windowMs: 5 * 60 * 1000,   // 5 minutes
      maxRequests: 10,           // 10 uploads per 5 minutes
      keyGenerator: getDefaultKey
    }
  };

  const baseConfig: RateLimitConfig = (defaults[type] || defaults.api) as RateLimitConfig;

  // Ensure required numeric fields are always set
  const finalConfig: RateLimitConfig = {
    windowMs: overrides?.windowMs ?? baseConfig.windowMs,
    maxRequests: overrides?.maxRequests ?? baseConfig.maxRequests,
    strategy: overrides?.strategy ?? baseConfig.strategy,
    keyGenerator: overrides?.keyGenerator ?? baseConfig.keyGenerator,
    skipIf: overrides?.skipIf ?? baseConfig.skipIf,
    message: overrides?.message ?? baseConfig.message,
    statusCode: overrides?.statusCode ?? baseConfig.statusCode,
    headers: overrides?.headers ?? baseConfig.headers,
    skipSuccessfulRequests: overrides?.skipSuccessfulRequests ?? baseConfig.skipSuccessfulRequests,
    skipFailedRequests: overrides?.skipFailedRequests ?? baseConfig.skipFailedRequests,
  };

  return createRateLimit(finalConfig);
}

/**
 * Predefined rate limiters for common use cases
 */
export const RateLimits = {
  // Authentication endpoints - strict limits
  auth: createConfigurableRateLimit('auth'),

  // API endpoints for authenticated users - moderate limits
  api: createConfigurableRateLimit('api'),

  // Public endpoints - generous limits
  public: createConfigurableRateLimit('public'),

  // File upload endpoints - tight limits
  upload: createConfigurableRateLimit('upload'),

  // Password reset - very strict
  passwordReset: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,            // 3 attempts per hour
    message: 'Too many password reset attempts, please try again in 1 hour',
    keyGenerator: getDefaultKey
  }),

  // Registration - moderate
  registration: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,            // 5 registrations per hour
    keyGenerator: getDefaultKey
  })
};

/**
 * Admin functions for rate limit management
 */
export async function resetRateLimit(env: Env, key: string): Promise<void> {
  try {
    // Remove from KV store
    if (env.RATE_LIMIT_KV || env.KV_CACHE) {
      const kvStore = env.RATE_LIMIT_KV || env.KV_CACHE;
      await kvStore.delete(`ratelimit:${key}`);
    }

    // Remove from memory store
    memoryStore.delete(key);

    console.log(`Rate limit reset for key: ${key}`);
  } catch (error) {
    console.error('Failed to reset rate limit:', error);
    throw error;
  }
}

export default createRateLimit;