import { Context } from 'hono';
import { MiddlewareHandler } from 'hono';
import { getEnvVar, validateJWTSecret, validateEncryptionKey, InputValidator } from '../utils/security';

// Enhanced sanitization for logging
const sanitizeForLogging = (data: any): any => {
  if (!data) return data;
  
  if (typeof data === 'string') {
    return InputValidator.sanitizeString(data, 1000);
  }
  
  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip sensitive fields
      if (['password', 'token', 'secret', 'key', 'auth', 'hash', 'salt'].some(s => key.toLowerCase().includes(s))) {
        sanitized[key] = '[REDACTED]';
        continue;
      }
      
      if (typeof value === 'string') {
        sanitized[key] = InputValidator.sanitizeString(value, 500);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeForLogging(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  
  return data;
};

// CORS middleware - SIMPLIFIED for speed
export const corsMiddleware: MiddlewareHandler = async (c, next) => {
  const origin = c.req.header('Origin');
  const allowedOrigins = [
    'https://namhbcf-uk.pages.dev',
    'https://www.namhbcf.uk',
    'https://namhbcf.uk'
  ];

  // Allow Pages domain and its preview subdomains; otherwise fallback to '*'
  const isPagesPreview = origin ? /^https:\/\/[a-z0-9-]+\.namhbcf-uk\.pages\.dev$/.test(origin) : false;
  if (origin && (allowedOrigins.includes(origin) || isPagesPreview)) {
    c.header('Access-Control-Allow-Origin', origin);
  } else {
    c.header('Access-Control-Allow-Origin', '*');
  }

  c.header('Access-Control-Allow-Credentials', 'true');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, X-Client-Version, Origin, X-Request-ID, X-Timestamp, X-Timezone, X-Tenant-ID, X-Store-ID, X-Device-ID, X-Session-ID, x-ai-preset');
  c.header('Access-Control-Max-Age', '86400');

  // Handle preflight requests early
  if (c.req.method === 'OPTIONS') {
    return c.text('', 204 as any);
  }

  await next();
}

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
    /(\%27)|(\')|(\-\-)|(\%3B)|(;)/i,
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
}

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
}

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
}

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
}