/**
 * IDEMPOTENCY MIDDLEWARE
 *
 * Handles Idempotency-Key headers to prevent duplicate operations
 * for critical POST endpoints like orders, payments, and transactions.
 */

import { Context, Next } from 'hono';
import { Env } from '../types';

interface IdempotentResponse {
  statusCode: number;
  body: any;
  headers: Record<string, string>;
  timestamp: string;
}

/**
 * Create idempotency middleware for safe operations
 */
export function withIdempotency(options?: {
  keyHeader?: string;
  ttlSeconds?: number;
  skipIf?: (c: Context) => boolean;
}) {
  const {
    keyHeader = 'Idempotency-Key',
    ttlSeconds = 24 * 60 * 60, // 24 hours default
    skipIf
  } = options || { /* No operation */ }
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    try {
      // Skip if condition is met
      if (skipIf && skipIf(c)) {
        await next();
        return;
      }

      // Only apply to POST, PUT, PATCH methods
      const method = c.req.method;
      if (!['POST', 'PUT', 'PATCH'].includes(method)) {
        await next();
        return;
      }

      // Get idempotency key from header
      const idempotencyKey = c.req.header(keyHeader);
      if (!idempotencyKey) {
        // No idempotency key provided, proceed normally
        await next();
        return;
      }

      // Validate idempotency key format (UUID or similar)
      if (!isValidIdempotencyKey(idempotencyKey)) {
        return c.json({
          success: false,
          error: 'INVALID_IDEMPOTENCY_KEY',
          message: 'Idempotency-Key must be a valid UUID or similar unique identifier'
        }, { status: 400 });
      }

      // Create storage key
      const user = (c.get as any)('user') || (c.get as any)('jwtPayload');
      const userId = user?.id || user?.sub || 'anonymous';
      const storageKey = `idempotency:${userId}:${idempotencyKey}`;

      // Check if we've seen this key before
      const existingResponse = await getIdempotentResponse(c.env, storageKey);
      if (existingResponse) {
        // Return the cached response

        // Set original headers
        const cached = existingResponse as IdempotentResponse;
        Object.entries(cached.headers).forEach(([key, value]) => {
          c.header(key, value);
        });

        // Add idempotency header
        c.header('Idempotency-Replay', 'true');

        return c.json(cached.body, { status: cached.statusCode as any });
      }

      // Store original response methods
      const originalJson = c.json.bind(c);
      let capturedResponse: IdempotentResponse | null = null;

      // Override json method to capture response
      c.json = (body: any, init?: any) => {
        const status = (init && (init.status as number)) || 200;
        const headers: Record<string, string> = { /* No operation */ }
        // Capture relevant headers (exclude some internal headers)
        const responseHeaders = c.res.headers as any;
        if (typeof responseHeaders?.forEach === 'function') {
          responseHeaders.forEach((value: string, key: string) => {
            if (!['content-length', 'date', 'server'].includes(key.toLowerCase())) {
              headers[key] = value as any;
            }
          });
        }

        capturedResponse = {
          statusCode: status,
          body,
          headers,
          timestamp: new Date().toISOString()
        };

        return originalJson(body, init);
      };

      // Process the request
      await next();
      // Store the response for future idempotency checks
      if (capturedResponse) {
        // Only cache successful operations (2xx status codes)
        if ((capturedResponse as IdempotentResponse).statusCode >= 200 && (capturedResponse as IdempotentResponse).statusCode < 300) {
          await storeIdempotentResponse(c.env, storageKey, capturedResponse, ttlSeconds);
        }
      }

    } catch (error) {
      console.error('Idempotency middleware error:', error);
      // Continue without idempotency on error (fail open)
      await next();
    }
  };
}

/**
 * Validate idempotency key format
 */
function isValidIdempotencyKey(key: string): boolean {
  // Check if it's a valid UUID v4 or similar format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const simpleKeyRegex = /^[a-zA-Z0-9_-]{8,64}$/; // Allow simple alphanumeric keys

  return uuidRegex.test(key) || simpleKeyRegex.test(key);
}

/**
 * Get cached idempotent response
 */
async function getIdempotentResponse(env: Env, key: string): Promise<IdempotentResponse | null> {
  try {
    // Try KV store first
    if (env.IDEMPOTENCY_KV || env.KV_CACHE) {
      const kvStore = env.IDEMPOTENCY_KV || env.KV_CACHE;
      const stored = await kvStore.get(key);
      if (stored) {
        return JSON.parse(stored);
      }
    }

    // Try D1 database as fallback
    if (env.DB) {
      const result = await env.DB.prepare(`
        SELECT response_data, created_at
        FROM idempotency_cache
        WHERE key = ? AND expires_at > datetime('now')
      `).bind(key).first();
      if (result && result.response_data) {
        return JSON.parse(result.response_data as string);
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to get idempotent response:', error);
    return null;
  }
}

/**
 * Store idempotent response
 */
async function storeIdempotentResponse(
  env: Env,
  key: string,
  response: IdempotentResponse,
  ttlSeconds: number
): Promise<void> {
  try {
    const responseData = JSON.stringify(response);

    // Try KV store first
    if (env.IDEMPOTENCY_KV || env.KV_CACHE) {
      const kvStore = env.IDEMPOTENCY_KV || env.KV_CACHE;
      await kvStore.put(key, responseData, { expirationTtl: ttlSeconds });
      return;
    }

    // Fallback to D1 database
    if (env.DB) {
      // Ensure table exists (should be in migration)
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS idempotency_cache (
          key TEXT PRIMARY KEY,
          response_data TEXT NOT NULL,
          created_at TEXT DEFAULT (datetime('now')),
          expires_at TEXT NOT NULL
        )
      `).run();
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
      await env.DB.prepare(`
        INSERT OR REPLACE INTO idempotency_cache (key, response_data, expires_at)
        VALUES (?, ?, ?)
      `).bind(key, responseData, expiresAt).run();
      // Clean up expired entries occasionally
      if (Math.random() < 0.01) { // 1% chance
        await env.DB.prepare(`
          DELETE FROM idempotency_cache WHERE expires_at < datetime('now')
        `).run();
      }
    }
  } catch (error) {
    console.error('Failed to store idempotent response:', error);
    // Don't throw - idempotency is a best-effort feature
  }
}

/**
 * Middleware factory for specific endpoint types
 */
export const IdempotencyMiddleware = {
  // For order creation - 24 hour TTL
  orders: withIdempotency({
    ttlSeconds: 24 * 60 * 60,
    skipIf: (c: Context) => {
      // Skip for admin users or GET requests
      const user = c.get('user');
      return user?.role === 'admin' || c.req.method === 'GET';
    }
  }),

  // For payment processing - 48 hour TTL (longer for financial operations)
  payments: withIdempotency({
    ttlSeconds: 48 * 60 * 60,
    skipIf: (c: Context) => c.req.method === 'GET'
  }),

  // For general API operations - 1 hour TTL
  api: withIdempotency({
    ttlSeconds: 60 * 60,
    skipIf: (c: Context) => {
      const user = c.get('user');
      return user?.role === 'admin' || c.req.method === 'GET';
    }
  }),

  // For customer operations - 2 hour TTL
  customers: withIdempotency({
    ttlSeconds: 2 * 60 * 60,
    skipIf: (c: Context) => c.req.method === 'GET'
  })
};

/**
 * Clean up expired idempotency entries (for cron jobs)
 */
export async function cleanupExpiredIdempotencyEntries(env: Env): Promise<number> {
  try {
    if (env.DB) {
      const result = await env.DB.prepare(`
        DELETE FROM idempotency_cache WHERE expires_at < datetime('now')
      `).run();
      const changes = (result as any)?.meta?.changes ?? (result as any)?.changes ?? 0;
      return changes;
    }

    return 0;
  } catch (error) {
    console.error('Failed to clean up idempotency entries:', error);
    return 0;
  }
}

export default withIdempotency;
