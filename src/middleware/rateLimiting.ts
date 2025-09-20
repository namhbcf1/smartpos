/**
 * RATE LIMITING MIDDLEWARE
 * 
 * Implements rate limiting with multiple strategies including token bucket,
 * sliding window, and fixed window algorithms for API protection.
 */

import { Context, Next } from 'hono';
import { Env } from '../types';
import { log } from '../utils/logger';

// Rate limiting strategies
export enum RateLimitStrategy {
  FIXED_WINDOW = 'fixed_window',
  SLIDING_WINDOW = 'sliding_window',
  TOKEN_BUCKET = 'token_bucket'
}

// Rate limit configuration
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  strategy: RateLimitStrategy;
  keyGenerator?: (c: Context) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
  statusCode?: number;
  headers?: boolean; // Include rate limit headers
}

// Rate limit state
interface RateLimitState {
  count: number;
  resetTime: number;
  tokens?: number; // For token bucket
  lastRefill?: number; // For token bucket
  requests?: Array<{ timestamp: number; count: number }>; // For sliding window
}

// Default configurations for different endpoints
const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  // Authentication endpoints - strict limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    strategy: RateLimitStrategy.FIXED_WINDOW,
    message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau.',
    statusCode: 429
  },

  // API endpoints - moderate limits
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    strategy: RateLimitStrategy.SLIDING_WINDOW,
    headers: true
  },

  // Search endpoints - higher limits but with burst protection
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200, // 200 searches per minute
    strategy: RateLimitStrategy.TOKEN_BUCKET,
    headers: true
  },

  // Upload endpoints - very strict limits
  upload: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 uploads per minute
    strategy: RateLimitStrategy.FIXED_WINDOW,
    message: 'Quá nhiều lần upload. Vui lòng thử lại sau.',
    headers: true
  },

  // Report generation - limited due to resource intensity
  reports: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 20, // 20 reports per 5 minutes
    strategy: RateLimitStrategy.SLIDING_WINDOW,
    headers: true
  }
};

/**
 * Create rate limiting middleware with specified configuration
 */
export function createRateLimit(config: RateLimitConfig) {
  const keyGenerator = config.keyGenerator || ((c: Context) => {
    // Use IP address or user ID if available
    const user = c.get('user');
    const ip = c.req.header('CF-Connecting-IP') || 
               c.req.header('X-Forwarded-For') || 
               c.req.header('X-Real-IP') || 
               'unknown';
    
    return user ? `user:${user.id}` : `ip:${ip}`;
  });

  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const key = keyGenerator(c);
    const now = Date.now();
    
    try {
      // Get current state
      const state = await getRateLimitState(c.env, key);
      
      // Check rate limit based on strategy
      const { allowed, remaining, resetTime } = checkRateLimit(config, state, now);
      
      if (!allowed) {
        // Update state for failed request if configured
        if (!config.skipFailedRequests) {
          await updateRateLimitState(c.env, key, state, now, false);
        }
        
        // Add rate limit headers
        if (config.headers) {
          c.res.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
          c.res.headers.set('X-RateLimit-Remaining', '0');
          c.res.headers.set('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
          c.res.headers.set('Retry-After', Math.ceil((resetTime - now) / 1000).toString());
        }
        
        // Log rate limit hit
        log.warn('Rate limit exceeded', {
          key,
          path: c.req.path,
          method: c.req.method,
          strategy: config.strategy
        });
        
        return c.json({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: config.message || 'Too many requests. Please try again later.',
          details: {
            limit: config.maxRequests,
            window: config.windowMs,
            resetTime: new Date(resetTime).toISOString()
          }
        }, (config.statusCode || 429) as any);
      }
      
      // Add rate limit headers for successful requests
      if (config.headers) {
        c.res.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
        c.res.headers.set('X-RateLimit-Remaining', remaining.toString());
        c.res.headers.set('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
      }
      
      // Continue to next middleware
      await next();
      
      // Update state after successful request if configured
      const isSuccess = c.res.status < 400;
      if (!(isSuccess && config.skipSuccessfulRequests)) {
        await updateRateLimitState(c.env, key, state, now, isSuccess);
      }
      
    } catch (error) {
      log.error('Rate limiting error', {
        key,
        path: c.req.path,
        error: error instanceof Error ? error.message : 'Unknown error'
      } as any);
      
      // Continue without rate limiting on error (fail open)
      await next();
    }
  };
}

/**
 * Check rate limit based on strategy
 */
function checkRateLimit(
  config: RateLimitConfig, 
  state: RateLimitState, 
  now: number
): { allowed: boolean; remaining: number; resetTime: number } {
  switch (config.strategy) {
    case RateLimitStrategy.FIXED_WINDOW:
      return checkFixedWindow(config, state, now);
    case RateLimitStrategy.SLIDING_WINDOW:
      return checkSlidingWindow(config, state, now);
    case RateLimitStrategy.TOKEN_BUCKET:
      return checkTokenBucket(config, state, now);
    default:
      return checkFixedWindow(config, state, now);
  }
}

/**
 * Fixed window rate limiting
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
 * Sliding window rate limiting
 */
function checkSlidingWindow(
  config: RateLimitConfig,
  state: RateLimitState,
  now: number
): { allowed: boolean; remaining: number; resetTime: number } {
  if (!state.requests) {
    state.requests = [];
  }
  
  // Remove old requests outside the window
  const windowStart = now - config.windowMs;
  state.requests = state.requests.filter(req => req.timestamp > windowStart);
  
  // Count requests in current window
  const currentCount = state.requests.reduce((sum, req) => sum + req.count, 0);
  
  const allowed = currentCount < config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - currentCount - (allowed ? 1 : 0));
  const resetTime = now + config.windowMs;
  
  return { allowed, remaining, resetTime };
}

/**
 * Token bucket rate limiting
 */
function checkTokenBucket(
  config: RateLimitConfig,
  state: RateLimitState,
  now: number
): { allowed: boolean; remaining: number; resetTime: number } {
  // Initialize token bucket
  if (state.tokens === undefined) {
    state.tokens = config.maxRequests;
    state.lastRefill = now;
  }
  
  // Refill tokens based on elapsed time
  const elapsedTime = now - (state.lastRefill || now);
  const tokensToAdd = Math.floor(elapsedTime / config.windowMs * config.maxRequests);
  
  if (tokensToAdd > 0) {
    state.tokens = Math.min(config.maxRequests, state.tokens + tokensToAdd);
    state.lastRefill = now;
  }
  
  const allowed = state.tokens > 0;
  const remaining = allowed ? state.tokens - 1 : state.tokens;
  const resetTime = now + ((config.maxRequests - state.tokens) / config.maxRequests) * config.windowMs;
  
  return { allowed, remaining, resetTime };
}

/**
 * Get rate limit state from storage
 */
async function getRateLimitState(env: Env, key: string): Promise<RateLimitState> {
  try {
    if (env.RATE_LIMIT_KV) {
      const stored = await env.RATE_LIMIT_KV.get(`ratelimit:${key}`);
      if (stored) {
        return JSON.parse(stored);
      }
    }
    
    // Fallback to in-memory (not persistent across requests)
    return {
      count: 0,
      resetTime: 0
    };
  } catch (error) {
    log.error('Failed to get rate limit state', {
      key,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as any);
    
    return {
      count: 0,
      resetTime: 0
    };
  }
}

/**
 * Update rate limit state in storage
 */
async function updateRateLimitState(
  env: Env, 
  key: string, 
  state: RateLimitState, 
  now: number,
  isSuccess: boolean
): Promise<void> {
  try {
    // Update count based on strategy
    if (state.requests) {
      // Sliding window - add request to history
      state.requests.push({ timestamp: now, count: 1 });
    } else if (state.tokens !== undefined) {
      // Token bucket - consume token if allowed
      if (state.tokens > 0) {
        state.tokens--;
      }
    } else {
      // Fixed window - increment count
      state.count++;
    }
    
    if (env.RATE_LIMIT_KV) {
      // Store with expiration
      const expirationTtl = Math.max(60, Math.floor((state.resetTime - now) / 1000) + 60);
      await env.RATE_LIMIT_KV.put(
        `ratelimit:${key}`, 
        JSON.stringify(state),
        { expirationTtl }
      );
    }
  } catch (error) {
    log.error('Failed to update rate limit state', {
      key,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as any);
  }
}

/**
 * Predefined rate limiting middleware for common use cases
 */
export const authRateLimit = createRateLimit(DEFAULT_CONFIGS.auth!);
export const apiRateLimit = createRateLimit(DEFAULT_CONFIGS.api!);
export const searchRateLimit = createRateLimit(DEFAULT_CONFIGS.search!);
export const uploadRateLimit = createRateLimit(DEFAULT_CONFIGS.upload!);
export const reportsRateLimit = createRateLimit(DEFAULT_CONFIGS.reports!);

/**
 * Smart rate limiting based on request path and method
 */
export const smartRateLimit = async (c: Context<{ Bindings: Env }>, next: Next) => {
  const path = c.req.path;
  const method = c.req.method;
  
  // Determine rate limit config based on path
  let config: RateLimitConfig;
  
  if (path.includes('/auth/login') || path.includes('/auth/register')) {
    config = DEFAULT_CONFIGS.auth!;
  } else if (path.includes('/upload') || method === 'POST' && path.includes('/import')) {
    config = DEFAULT_CONFIGS.upload!;
  } else if (path.includes('/search') || path.includes('/autocomplete')) {
    config = DEFAULT_CONFIGS.search!;
  } else if (path.includes('/reports') || path.includes('/analytics')) {
    config = DEFAULT_CONFIGS.reports!;
  } else {
    config = DEFAULT_CONFIGS.api!;
  }
  
  // Apply the determined rate limit
  const rateLimitMiddleware = createRateLimit(config);
  return rateLimitMiddleware(c, next);
};

/**
 * Role-based rate limiting
 */
export const roleBasedRateLimit = (roleConfigs: Record<string, RateLimitConfig>) => {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const user = (c as any).get('user') || {};
    const userRole = user?.role || 'guest';

    // Use role-specific config or default to guest
    const config = roleConfigs[userRole] || roleConfigs.guest || DEFAULT_CONFIGS.api!;

    // Apply rate limiting
    const rateLimitMiddleware = createRateLimit(config!);
    return rateLimitMiddleware(c, next);
  };
};

/**
 * Get rate limit status for monitoring
 */
export async function getRateLimitStatus(env: Env, key: string): Promise<{
  key: string;
  current: number;
  limit: number;
  remaining: number;
  resetTime: number;
}> {
  try {
    const state = await getRateLimitState(env, key);
    
    // This is simplified - in production you'd need to store the config with the state
    const config = DEFAULT_CONFIGS.api; // Default for monitoring
    const now = Date.now();
    const { remaining, resetTime } = checkRateLimit(config!, state, now);
    
    return {
      key,
      current: state.count || 0,
      limit: config!.maxRequests,
      remaining,
      resetTime
    };
  } catch (error) {
    throw new Error(`Failed to get rate limit status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Reset rate limit for a specific key (admin function)
 */
export async function resetRateLimit(env: Env, key: string): Promise<void> {
  try {
    if (env.RATE_LIMIT_KV) {
      await env.RATE_LIMIT_KV.delete(`ratelimit:${key}`);
    }
    
    log.info(`Rate limit reset for key: ${key}`);
  } catch (error) {
    log.error('Failed to reset rate limit', {
      key,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as any);
    throw error;
  }
}

/**
 * Get all active rate limits for monitoring (admin function)
 */
export async function getAllRateLimits(env: Env): Promise<Array<{
  key: string;
  current: number;
  limit: number;
  remaining: number;
  resetTime: number;
}>> {
  try {
    if (!env.RATE_LIMIT_KV) {
      return [];
    }
    
    // List all rate limit keys
    const { keys } = await env.RATE_LIMIT_KV.list({ prefix: 'ratelimit:' });
    
    const rateLimits = await Promise.all(
      keys.map(async (keyInfo: any) => {
        const fullKey = keyInfo.name;
        const shortKey = fullKey.replace('ratelimit:', '');
        
        try {
          return await getRateLimitStatus(env, shortKey);
        } catch (error) {
          return {
            key: shortKey,
            current: 0,
            limit: 0,
            remaining: 0,
            resetTime: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );
    
    return rateLimits;
  } catch (error) {
    log.error('Failed to get all rate limits', {
      error: error instanceof Error ? error.message : 'Unknown error'
    } as any);
    return [];
  }
}