/**
 * STANDARDIZED MIDDLEWARE EXPORTS FOR SMARTPOS
 *
 * This module exports the standardized middleware functions
 * used throughout the SmartPOS application.
 */

import { Context, Next } from 'hono';

// Re-export the main authentication middleware
export { authenticate, requireRole } from './auth';

// Re-export security middleware
export {
  corsMiddleware,
  accessLogger,
  sqlInjectionProtection,
  validateEnvironment
} from './security';

// Re-export monitoring middleware
export {
  performanceMonitoring,
  errorHandlingWithCircuitBreaker,
  databaseMonitoring,
  cacheMonitoring,
  businessMetricsTracking
} from './monitoring';

// Authorization middleware
export const authorize = (roles: string[] = []) => {
  return async (c: Context, next: Next) => {
    try {
      // For now, allow all authenticated users
      // In production, implement proper role checking
      await next();
    } catch (error) {
      return c.json({ 
        success: false, 
        data: null, 
        message: 'Không có quyền truy cập' 
      }, 403);
    }
  };
};

// Validation middleware
export const validate = (schema: any) => {
  return async (c: Context, next: Next) => {
    try {
      // Basic validation - in production, use proper schema validation
      await next();
    } catch (error) {
      return c.json({ 
        success: false, 
        data: null, 
        message: 'Dữ liệu không hợp lệ' 
      }, 400);
    }
  };
};

// Audit logging middleware
export const auditLogger = async (c: Context, next: Next) => {
  try {
    const start = Date.now();
    await next();
    const duration = Date.now() - start;
    
    // Log audit information
    console.log(`[AUDIT] ${c.req.method} ${c.req.url} - ${duration}ms`);
  } catch (error) {
    console.error(`[AUDIT ERROR] ${c.req.method} ${c.req.url} - ${error}`);
    throw error;
  }
};

// CORS middleware
export const cors = async (c: Context, next: Next) => {
  await next();
  
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

// Error handling middleware
export const errorHandler = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    console.error('Error:', error);
    return c.json({ 
      success: false, 
      data: null, 
      message: 'Lỗi server nội bộ' 
    }, 500);
  }
};
