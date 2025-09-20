import { Env } from '../types';

/**
 * Security configuration management
 * Centralizes all security-related configurations and validations
 */

export interface SecurityConfig {
  jwt: {
    secret: string;
    issuer: string;
    audience: string;
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
  };
  cors: {
    origins: string[];
    methods: string[];
    allowedHeaders: string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  encryption: {
    algorithm: string;
    keyLength: number;
  };
}

/**
 * Validates required environment variables for security
 */
export function validateSecurityEnvironment(env: Env): void {
  const required = [
    'JWT_SECRET',
    'JWT_ISSUER', 
    'JWT_AUDIENCE',
    'CORS_ORIGINS'
  ];

  const missing = required.filter(key => !env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required security environment variables: ${missing.join(', ')}`);
  }

  // Validate JWT secret strength
  if (env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  // Validate JWT secret is not the default/example value
  const defaultSecrets = [
    'c3629b31f81d4c0a23826b97cb634e9681f97688e0d8d312ca94664d793faa10',
    'your-jwt-secret-here',
    'changeme',
    'default-secret'
  ];

  if (defaultSecrets.includes(env.JWT_SECRET)) {
    throw new Error('JWT_SECRET cannot use default/example values in production');
  }
}

/**
 * Creates security configuration from environment variables
 */
export function createSecurityConfig(env: Env): SecurityConfig {
  // Validate environment first
  validateSecurityEnvironment(env);

  // Parse CORS origins
  const corsOrigins = env.CORS_ORIGINS
    ? env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000'];

  return {
    jwt: {
      secret: env.JWT_SECRET,
      issuer: env.JWT_ISSUER || 'smartpos-api',
      audience: env.JWT_AUDIENCE || 'smartpos-clients',
      accessTokenExpiry: env.JWT_EXPIRES_IN || '15m',
      refreshTokenExpiry: env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    cors: {
      origins: corsOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'X-Api-Key',
        'X-Client-Version'
      ],
      credentials: true,
    },
    rateLimit: {
      windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      maxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS || '100'),
    },
    encryption: {
      algorithm: 'AES-256-GCM',
      keyLength: 32,
    },
  };
}

/**
 * Validates CORS origin against configured allowed origins
 */
export function isValidCorsOrigin(origin: string | null, config: SecurityConfig): boolean {
  if (!origin) return true; // Allow requests without origin (like mobile apps)

  return config.cors.origins.some(allowedOrigin => {
    if (allowedOrigin === '*') return true;
    if (allowedOrigin === origin) return true;
    
    // Support wildcard subdomains
    if (allowedOrigin.startsWith('*.')) {
      const domain = allowedOrigin.slice(2);
      return origin.endsWith(domain);
    }
    
    return false;
  });
}

/**
 * Generates a secure random string for secrets
 */
export function generateSecureSecret(length: number = 64): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  // Use crypto.getRandomValues if available (browser/worker environment)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i]! % chars.length];
    }
  } else {
    // Fallback for other environments
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
}

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  // Prevent XSS attacks
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  
  // HTTPS enforcement
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "media-src 'self'",
    "object-src 'none'",
    "frame-src 'none'",
  ].join('; '),
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy
  'Permissions-Policy': [
    'geolocation=()',
    'microphone=()',
    'camera=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'accelerometer=()',
    'gyroscope=()',
  ].join(', '),
};

/**
 * Environment-specific security configurations
 */
export function getEnvironmentSpecificConfig(environment: string): Partial<SecurityConfig> {
  switch (environment) {
    case 'development':
      return {
        cors: {
          origins: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'],
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
          allowedHeaders: ['*'],
          credentials: true,
        },
        rateLimit: {
          windowMs: 60000, // 1 minute
          maxRequests: 1000, // More lenient for development
        },
      };
      
    case 'staging':
      return {
        cors: {
          origins: ['https://staging.namhbcf.uk'],
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
          credentials: true,
        },
        rateLimit: {
          windowMs: 300000, // 5 minutes
          maxRequests: 500,
        },
      };
      
    case 'production':
    default:
      return {
        rateLimit: {
          windowMs: 900000, // 15 minutes
          maxRequests: 100,
        },
      };
  }
}