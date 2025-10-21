import { Context, Next } from 'hono';
import { cors } from 'hono/cors';

interface CorsConfig {
  origin?: string | string[] | ((origin: string, c: Context) => string | null | undefined | Promise<string | null | undefined>);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

export const createCorsMiddleware = (config: CorsConfig = {}) => {
  const {
    origin = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'https://namhbcf-uk.pages.dev'],
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders = [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
      'X-Tenant-ID',
      'X-Store-ID',
      'X-Device-ID',
      'X-Session-ID'
    ],
    exposedHeaders = ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    credentials = true,
    maxAge = 86400 // 24 hours
  } = config;

  return cors({
    origin: typeof origin === 'function' ? (origin as any) : (Array.isArray(origin) ? origin : typeof origin === 'string' ? [origin] : ['*']),
    allowMethods: methods,
    allowHeaders: allowedHeaders,
    exposeHeaders: exposedHeaders,
    credentials,
    maxAge
  });
};

// Predefined CORS configurations
export const productionCors = createCorsMiddleware({
  origin: (origin: string) => {
    const allowedOrigins = [
      'https://namhbcf.uk',
      'https://namhbcf-uk.pages.dev',
      'https://www.namhbcf.uk'
    ];
    // Allow any subdomain of namhbcf-uk.pages.dev
    const isPagesDomain = /^https:\/\/[a-z0-9-]+\.namhbcf-uk\.pages\.dev$/.test(origin);
    return (allowedOrigins.includes(origin) || isPagesDomain) ? origin : null;
  },
  credentials: true
});

export const developmentCors = createCorsMiddleware({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
  ],
  credentials: true
});

export const publicCors = createCorsMiddleware({
  origin: '*',
  credentials: false
});

// Default CORS middleware that adapts based on environment
export const adaptiveCors = (c: Context, next: Next) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const corsMiddleware = isProduction ? productionCors : developmentCors;
  
  return corsMiddleware(c, next);
};
