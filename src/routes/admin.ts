/**
 * Admin Routes
 * Special administrative endpoints for system management
 */

import { Hono } from 'hono';
import { Env } from '../types';
import { authenticate } from '../middleware/auth';
import { RBACInitializationService } from '../services/RBACInitializationService';

const app = new Hono<{ Bindings: Env }>();

// Apply authentication to all routes
app.use('*', authenticate);

/**
 * POST /admin/initialize-rbac - Initialize RBAC system (admin only)
 */
app.post('/initialize-rbac', async (c) => {
  try {
    const user = c.get('user');
    
    // Only allow admin users to initialize RBAC
    if (!user || user.role !== 'admin') {
      return c.json({
        success: false,
        message: 'Only admin users can initialize RBAC system',
        error: 'FORBIDDEN'
      }, 403);
    }

    console.log('🔐 Starting RBAC initialization by admin:', user.username);
    
    const rbacService = new RBACInitializationService(c.env);
    await rbacService.initializeRBAC();

    return c.json({
      success: true,
      message: 'RBAC system initialized successfully',
      data: {
        initialized_by: user.username,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('RBAC initialization error:', error);
    return c.json({
      success: false,
      message: 'Failed to initialize RBAC system',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /admin/rbac-status - Check RBAC system status
 */
app.get('/rbac-status', async (c) => {
  try {
    const user = c.get('user');
    
    if (!user || user.role !== 'admin') {
      return c.json({
        success: false,
        message: 'Only admin users can check RBAC status',
        error: 'FORBIDDEN'
      }, 403);
    }

    // Check if RBAC tables exist and have data
    const resourceCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM system_resources').first();
    const actionCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM system_actions').first();
    const permissionCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM permissions').first();
    const roleCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM roles WHERE is_template = 1').first();

    const isInitialized = resourceCount && resourceCount.count > 0;

    return c.json({
      success: true,
      message: 'RBAC status retrieved successfully',
      data: {
        is_initialized: isInitialized,
        statistics: {
          resources: resourceCount?.count || 0,
          actions: actionCount?.count || 0,
          permissions: permissionCount?.count || 0,
          role_templates: roleCount?.count || 0
        },
        checked_by: user.username,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('RBAC status check error:', error);
    return c.json({
      success: false,
      message: 'Failed to check RBAC status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /admin/reset-rbac - Reset and reinitialize RBAC system (admin only)
 */
app.post('/reset-rbac', async (c) => {
  try {
    const user = c.get('user');
    
    if (!user || user.role !== 'admin') {
      return c.json({
        success: false,
        message: 'Only admin users can reset RBAC system',
        error: 'FORBIDDEN'
      }, 403);
    }

    console.log('🔄 Starting RBAC reset by admin:', user.username);
    
    // Drop and recreate RBAC tables
    const dropTables = `
      DROP TABLE IF EXISTS permission_audit_log;
      DROP TABLE IF EXISTS employee_permissions;
      DROP TABLE IF EXISTS employee_roles;
      DROP TABLE IF EXISTS role_permissions;
      DROP TABLE IF EXISTS permissions;
      DROP TABLE IF EXISTS system_actions;
      DROP TABLE IF EXISTS system_resources;
    `;

    await c.env.DB.exec(dropTables);
    
    // Reinitialize
    const rbacService = new RBACInitializationService(c.env);
    await rbacService.initializeRBAC();

    return c.json({
      success: true,
      message: 'RBAC system reset and reinitialized successfully',
      data: {
        reset_by: user.username,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('RBAC reset error:', error);
    return c.json({
      success: false,
      message: 'Failed to reset RBAC system',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /admin/system-info - Get system information
 */
app.get('/system-info', async (c) => {
  try {
    const user = c.get('user');
    
    if (!user || user.role !== 'admin') {
      return c.json({
        success: false,
        message: 'Only admin users can view system information',
        error: 'FORBIDDEN'
      }, 403);
    }

    // Get database statistics
    const tables = [
      'users', 'employees', 'customers', 'products', 'sales', 'categories',
      'suppliers', 'system_resources', 'system_actions', 'permissions',
      'roles', 'employee_roles', 'employee_permissions'
    ];

    const statistics: Record<string, number> = {};
    
    for (const table of tables) {
      try {
        const result = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM ${table}`).first();
        statistics[table] = result?.count || 0;
      } catch (error) {
        statistics[table] = -1; // Table doesn't exist
      }
    }

    return c.json({
      success: true,
      message: 'System information retrieved successfully',
      data: {
        database_statistics: statistics,
        environment: 'production',
        api_version: '1.0.0',
        rbac_enabled: statistics.system_resources > 0,
        checked_by: user.username,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('System info error:', error);
    return c.json({
      success: false,
      message: 'Failed to retrieve system information',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;
