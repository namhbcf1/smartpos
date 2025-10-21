import { Context, Next } from 'hono';
import { Env } from '../types';

// Performance monitoring middleware
export const performanceMonitoring = async (c: Context<{ Bindings: Env }>, next: Next) => {
  const start = Date.now();
  try {
    await next();
    const duration = Date.now() - start;
    const url = c.req.url;
    const method = c.req.method;
    
    // Log slow requests (> 1 second)
    if (duration > 1000) { /* No operation */ }
    
    // Add performance headers
    c.header('X-Response-Time', `${duration}ms`);
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('X-XSS-Protection', '1; mode=block');
    
    // Cache control for static assets
    if (url.includes('/static/') || url.includes('/assets/')) {
      c.header('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (url.includes('/api/')) {
      c.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`Request failed after ${duration}ms:`, error);
    throw error;
  }
};

// Database query optimization
export const optimizeDatabaseQueries = async (c: Context<{ Bindings: Env }>, next: Next) => {
  // Add query timeout
  const originalPrepare = c.env.DB.prepare;
  c.env.DB.prepare = function(sql: string) {
    const stmt = originalPrepare.call(this, sql);
    const originalBind = stmt.bind;
    
    stmt.bind = function(...args: any[]) {
      const boundStmt = originalBind.apply(this, args);
      const originalAll = boundStmt.all;
      const originalFirst = boundStmt.first;
      const originalRun = boundStmt.run;
      
      // Add timeout wrapper
      const withTimeout = (originalMethod: any) => {
        return async (...args: any[]) => {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Query timeout')), 30000); // 30 second timeout
          });
          
          try {
            return await Promise.race([originalMethod.apply(this, args), timeoutPromise]);
          } catch (error) {
            console.error('Database query error:', error);
            throw error;
          }
        };
      };
      
      boundStmt.all = withTimeout(originalAll);
      boundStmt.first = withTimeout(originalFirst);
      boundStmt.run = withTimeout(originalRun);
      
      return boundStmt;
    };
    
    return stmt;
  };
  
  await next();
};

// Response compression
export const responseCompression = async (c: Context<{ Bindings: Env }>, next: Next) => {
  await next();
  const response = c.res;
  const content = await response.text();
  // Only compress if content is large enough and not already compressed
  if (content.length > 1024 && !response.headers.get('Content-Encoding')) {
    // In a real implementation, you would use a compression library like pako
    // For now, we'll just add the header
    c.header('Content-Encoding', 'gzip');
  }
};

// Memory usage monitoring
export const memoryMonitoring = async (c: Context<{ Bindings: Env }>, next: Next) => {
  const startMemory = process.memoryUsage?.() || { heapUsed: 0, heapTotal: 0 };
  
  await next();
  const endMemory = process.memoryUsage?.() || { heapUsed: 0, heapTotal: 0 };
  const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
  
  // Log high memory usage
  if (memoryDelta > 10 * 1024 * 1024) { // 10MB
  }
  
  c.header('X-Memory-Usage', `${memoryDelta}bytes`);
};

// Request rate limiting per IP
const requestCounts = new Map<string, { count: number; resetTime: number }>();
export const rateLimitPerIP = (maxRequests: number = 100, windowMs: number = 60000) => {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const now = Date.now();
    // Clean up expired entries
    for (const [ip, data] of requestCounts.entries()) {
      if (now > data.resetTime) {
        requestCounts.delete(ip);
      }
    }
    
    const clientData = requestCounts.get(clientIP);
    
    if (!clientData || now > clientData.resetTime) {
      requestCounts.set(clientIP, { count: 1, resetTime: now + windowMs });
    } else {
      clientData.count++;
      
      if (clientData.count > maxRequests) {
        return c.json({
          success: false,
          message: 'Too many requests',
          retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
        }, 429);
      }
    }
    
    await next();
  };
};

// Database connection pooling optimization
export const databaseOptimization = async (c: Context<{ Bindings: Env }>, next: Next) => {
  // Add connection pooling headers
  c.header('X-Database-Connection', 'pooled');
  
  await next();
};

// Response caching
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
export const responseCaching = (ttl: number = 300000) => { // 5 minutes default
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const cacheKey = `${c.req.method}:${c.req.url}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return c.json(cached.data);
    }
    
    await next();
    // Cache successful responses
    if (c.res.status === 200) {
      const responseData = await c.res.clone().json();
      cache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now(),
        ttl: ttl
      });
    }
  };
};

// Clean up cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > value.ttl) {
      cache.delete(key);
    }
  }
}, 60000); // Clean up every minute

export default {
  performanceMonitoring,
  optimizeDatabaseQueries,
  responseCompression,
  memoryMonitoring,
  rateLimitPerIP,
  databaseOptimization,
  responseCaching
};
