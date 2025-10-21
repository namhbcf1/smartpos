/**
 * Admin Routes
 * Special administrative endpoints for system management
 */

import { Hono } from 'hono';
import { Env } from '../types';
import { authenticate } from '../middleware/auth';

const app = new Hono<{ Bindings: Env }>();
// Apply authentication to all routes
app.use('*', authenticate);

/**
 * GET /admin/health - Admin health check
 */
app.get('/health', async (c: any) => {
  try {
    const user = c.get('jwtPayload') as any;
    
    if (!user || !user.roles || !user.roles.includes('admin')) {
      return c.json({
        success: false,
        message: 'Only admin users can access admin endpoints',
        error: 'FORBIDDEN'
      }, 403);
    }

    return c.json({
      success: true,
      message: 'Admin endpoints are healthy',
      data: {
        user: user.username,
        role: user.role,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Admin health check error:', error);
    return c.json({
      success: false,
      message: 'Admin health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;