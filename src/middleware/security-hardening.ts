import { Context, Next } from 'hono';
import { Env } from '../types';

// Security headers middleware
export const securityHeaders = async (c: Context<{ Bindings: Env }>, next: Next) => {
  // Security headers
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  c.header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';");
  
  await next();
};

// Input validation and sanitization
export const inputValidation = async (c: Context<{ Bindings: Env }>, next: Next) => {
  const url = c.req.url;
  const method = c.req.method;
  
  // Check for SQL injection patterns
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(\b(OR|AND)\s+['"].*?=.*?['"])/i,
    /(\b(OR|AND)\s+['"].*?LIKE.*?['"])/i,
    /(\b(OR|AND)\s+['"].*?IN\s*\()/i,
    /(\b(OR|AND)\s+['"].*?BETWEEN\s+)/i,
    /(\b(OR|AND)\s+['"].*?IS\s+NULL)/i,
    /(\b(OR|AND)\s+['"].*?IS\s+NOT\s+NULL)/i,
    /(\b(OR|AND)\s+['"].*?EXISTS\s*\()/i,
    /(\b(OR|AND)\s+['"].*?NOT\s+EXISTS\s*\()/i
  ];
  
  // Check URL for SQL injection
  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(url)) {
      console.warn(`SQL injection attempt detected in URL: ${url}`);
      return c.json({
        success: false,
        message: 'Invalid request'
      }, 400);
    }
  }
  
  // Check query parameters
  const queryParams = new URL(url).searchParams;
  for (const [key, value] of queryParams.entries()) {
    for (const pattern of sqlInjectionPatterns) {
      if (pattern.test(value)) {
        console.warn(`SQL injection attempt detected in query param ${key}: ${value}`);
        return c.json({
          success: false,
          message: 'Invalid request'
        }, 400);
      }
    }
  }
  
  // Check request body for POST/PUT requests
  if (method === 'POST' || method === 'PUT') {
    try {
      const body = await c.req.json();
      const bodyString = JSON.stringify(body);
      
      for (const pattern of sqlInjectionPatterns) {
        if (pattern.test(bodyString)) {
          console.warn(`SQL injection attempt detected in request body: ${bodyString.substring(0, 100)}...`);
          return c.json({
            success: false,
            message: 'Invalid request'
          }, 400);
        }
      }
    } catch (error) {
      // Ignore JSON parsing errors for now
    }
  }
  
  await next();
};

// XSS protection
export const xssProtection = async (c: Context<{ Bindings: Env }>, next: Next) => {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>.*?<\/embed>/gi,
    /<link[^>]*>.*?<\/link>/gi,
    /<meta[^>]*>.*?<\/meta>/gi,
    /<style[^>]*>.*?<\/style>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload/gi,
    /onerror/gi,
    /onclick/gi,
    /onmouseover/gi,
    /onfocus/gi,
    /onblur/gi,
    /onchange/gi,
    /onsubmit/gi,
    /onreset/gi,
    /onselect/gi,
    /onkeydown/gi,
    /onkeyup/gi,
    /onkeypress/gi
  ];
  
  const url = c.req.url;
  
  for (const pattern of xssPatterns) {
    if (pattern.test(url)) {
      console.warn(`XSS attempt detected in URL: ${url}`);
      return c.json({
        success: false,
        message: 'Invalid request'
      }, 400);
    }
  }
  
  await next();
};

// CSRF protection
export const csrfProtection = async (c: Context<{ Bindings: Env }>, next: Next) => {
  const method = c.req.method;
  
  if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
    const origin = c.req.header('Origin');
    const referer = c.req.header('Referer');
    const csrfToken = c.req.header('X-CSRF-Token');
    
    // Check if request is from same origin
    if (origin && referer) {
      const originHost = new URL(origin).hostname;
      const refererHost = new URL(referer).hostname;
      
      if (originHost !== refererHost) {
        console.warn(`CSRF attempt detected: origin=${origin}, referer=${referer}`);
        return c.json({
          success: false,
          message: 'Invalid request origin'
        }, 403);
      }
    }
    
    // Check CSRF token for state-changing operations
    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
      if (!csrfToken) {
        console.warn(`CSRF token missing for ${method} request`);
        return c.json({
          success: false,
          message: 'CSRF token required'
        }, 403);
      }
      
      // In a real implementation, you would validate the CSRF token
      // For now, we'll just check if it exists
      if (csrfToken.length < 32) {
        console.warn(`Invalid CSRF token format: ${csrfToken}`);
        return c.json({
          success: false,
          message: 'Invalid CSRF token'
        }, 403);
      }
    }
  }
  
  await next();
};

// Rate limiting with IP-based tracking
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (maxRequests: number = 100, windowMs: number = 60000) => {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const now = Date.now();
    
    // Clean up expired entries
    for (const [ip, data] of rateLimitStore.entries()) {
      if (now > data.resetTime) {
        rateLimitStore.delete(ip);
      }
    }
    
    const clientData = rateLimitStore.get(clientIP);
    
    if (!clientData || now > clientData.resetTime) {
      rateLimitStore.set(clientIP, { count: 1, resetTime: now + windowMs });
    } else {
      clientData.count++;
      
      if (clientData.count > maxRequests) {
        console.warn(`Rate limit exceeded for IP ${clientIP}: ${clientData.count} requests in ${windowMs}ms`);
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

// Request size limiting
export const requestSizeLimit = (maxSize: number = 10 * 1024 * 1024) => { // 10MB default
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const contentLength = c.req.header('Content-Length');
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      console.warn(`Request size limit exceeded: ${contentLength} bytes`);
      return c.json({
        success: false,
        message: 'Request too large'
      }, 413);
    }
    
    await next();
  };
};

// IP whitelist/blacklist
const blacklistedIPs = new Set<string>();
const whitelistedIPs = new Set<string>();

export const ipFiltering = async (c: Context<{ Bindings: Env }>, next: Next) => {
  const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
  
  // Check blacklist
  if (blacklistedIPs.has(clientIP)) {
    console.warn(`Blocked request from blacklisted IP: ${clientIP}`);
    return c.json({
      success: false,
      message: 'Access denied'
    }, 403);
  }
  
  // Check whitelist (if not empty)
  if (whitelistedIPs.size > 0 && !whitelistedIPs.has(clientIP)) {
    console.warn(`Blocked request from non-whitelisted IP: ${clientIP}`);
    return c.json({
      success: false,
      message: 'Access denied'
    }, 403);
  }
  
  await next();
};

// User-Agent filtering
const suspiciousUserAgents = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /curl/i,
  /wget/i,
  /python/i,
  /php/i,
  /java/i,
  /perl/i,
  /ruby/i,
  /go-http/i,
  /okhttp/i,
  /apache/i,
  /nginx/i
];

export const userAgentFiltering = async (c: Context<{ Bindings: Env }>, next: Next) => {
  const userAgent = c.req.header('User-Agent') || '';
  
  for (const pattern of suspiciousUserAgents) {
    if (pattern.test(userAgent)) {
      console.warn(`Suspicious User-Agent detected: ${userAgent}`);
      return c.json({
        success: false,
        message: 'Access denied'
      }, 403);
    }
  }
  
  await next();
};

// Request logging for security monitoring
export const securityLogging = async (c: Context<{ Bindings: Env }>, next: Next) => {
  const start = Date.now();
  const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
  const userAgent = c.req.header('User-Agent') || '';
  const method = c.req.method;
  const url = c.req.url;
  
  try {
    await next();
    
    const duration = Date.now() - start;
    const status = c.res.status;
    
    // Log all requests for security monitoring
    console.log(`[SECURITY] ${method} ${url} - ${status} - ${duration}ms - IP: ${clientIP} - UA: ${userAgent.substring(0, 100)}`);
    
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`[SECURITY ERROR] ${method} ${url} - ERROR - ${duration}ms - IP: ${clientIP} - UA: ${userAgent.substring(0, 100)} - Error: ${error}`);
    throw error;
  }
};

// Session security
export const sessionSecurity = async (c: Context<{ Bindings: Env }>, next: Next) => {
  const sessionId = c.req.header('X-Session-ID');
  const authToken = c.req.header('Authorization');
  
  if (authToken && !sessionId) {
    console.warn('Request with auth token but no session ID');
    return c.json({
      success: false,
      message: 'Session required'
    }, 401);
  }
  
  await next();
};

// API key validation
export const apiKeyValidation = async (c: Context<{ Bindings: Env }>, next: Next) => {
  const apiKey = c.req.header('X-API-Key');
  const path = c.req.path;
  
  // Only require API key for certain endpoints
  if (path.startsWith('/api/admin/') || path.startsWith('/api/system/')) {
    if (!apiKey) {
      return c.json({
        success: false,
        message: 'API key required'
      }, 401);
    }
    
    // In a real implementation, you would validate the API key
    if (apiKey.length < 32) {
      return c.json({
        success: false,
        message: 'Invalid API key'
      }, 401);
    }
  }
  
  await next();
};

export default {
  securityHeaders,
  inputValidation,
  xssProtection,
  csrfProtection,
  rateLimit,
  requestSizeLimit,
  ipFiltering,
  userAgentFiltering,
  securityLogging,
  sessionSecurity,
  apiKeyValidation
};
