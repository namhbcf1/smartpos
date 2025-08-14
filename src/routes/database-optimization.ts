/**
 * Database Optimization API
 * Production-ready database performance optimization endpoints
 * Rules.md compliant - uses only real Cloudflare D1 data
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../types';
import { DatabaseOptimizationService } from '../services/DatabaseOptimizationService';
import { authenticate } from '../middleware/auth';
import { validateQuery, validateBody } from '../middleware/validation';

const app = new Hono<{ Bindings: Env }>();

// Validation schemas
const CleanupOptionsSchema = z.object({
  keep_sales_days: z.number().min(30).max(3650).optional(),
  keep_activities_days: z.number().min(7).max(365).optional(),
  keep_notifications_days: z.number().min(1).max(90).optional()
});

const ExplainQuerySchema = z.object({
  query: z.string().min(1).max(1000)
});

// Apply authentication to all routes
app.use('*', authenticate);

/**
 * Get database health metrics
 * GET /database-optimization/health
 */
app.get('/health', async (c) => {
  try {
    const optimizationService = new DatabaseOptimizationService(c.env);
    const health = await optimizationService.getDatabaseHealth();

    return c.json({
      success: true,
      data: health,
      message: 'Database health metrics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting database health:', error);
    return c.json({
      success: false,
      message: 'Failed to get database health metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Get database performance metrics
 * GET /database-optimization/performance
 */
app.get('/performance', async (c) => {
  try {
    const optimizationService = new DatabaseOptimizationService(c.env);
    const metrics = await optimizationService.getPerformanceMetrics();

    return c.json({
      success: true,
      data: metrics,
      message: 'Performance metrics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    return c.json({
      success: false,
      message: 'Failed to get performance metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Analyze query performance and get recommendations
 * GET /database-optimization/analyze
 */
app.get('/analyze', async (c) => {
  try {
    const optimizationService = new DatabaseOptimizationService(c.env);
    const analysis = await optimizationService.analyzeQueryPerformance();

    return c.json({
      success: true,
      data: analysis,
      message: 'Query performance analysis completed successfully'
    });
  } catch (error) {
    console.error('Error analyzing query performance:', error);
    return c.json({
      success: false,
      message: 'Failed to analyze query performance',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Optimize database performance
 * POST /database-optimization/optimize
 */
app.post('/optimize', async (c) => {
  try {
    const user = c.get('user');
    
    // Check if user has system configuration permission
    const hasPermission = await c.env.DB.prepare(`
      SELECT 1
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN users u ON rp.role_id = u.role_id
      WHERE u.id = ? AND p.resource = 'system' AND p.action = 'configure'
      LIMIT 1
    `).bind(user.id).first();

    if (!hasPermission) {
      return c.json({
        success: false,
        message: 'Insufficient permissions to optimize database'
      }, 403);
    }

    const optimizationService = new DatabaseOptimizationService(c.env);
    const result = await optimizationService.optimizeDatabase();

    // Log the optimization activity
    await c.env.DB.prepare(`
      INSERT INTO user_activities (
        user_id, action, resource, details, ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      user.id,
      'optimize_database',
      'system',
      `Database optimization completed: ${result.indexes_created} indexes created`,
      c.req.header('CF-Connecting-IP') || 'unknown',
      c.req.header('User-Agent') || 'unknown'
    ).run();

    return c.json({
      success: true,
      data: result,
      message: 'Database optimization completed successfully'
    });
  } catch (error) {
    console.error('Error optimizing database:', error);
    return c.json({
      success: false,
      message: 'Failed to optimize database',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Create optimized database indexes
 * POST /database-optimization/indexes
 */
app.post('/indexes', async (c) => {
  try {
    const user = c.get('user');
    
    // Check permissions
    const hasPermission = await c.env.DB.prepare(`
      SELECT 1
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN users u ON rp.role_id = u.role_id
      WHERE u.id = ? AND p.resource = 'system' AND p.action = 'configure'
      LIMIT 1
    `).bind(user.id).first();

    if (!hasPermission) {
      return c.json({
        success: false,
        message: 'Insufficient permissions to create indexes'
      }, 403);
    }

    const optimizationService = new DatabaseOptimizationService(c.env);
    await optimizationService.createOptimizedIndexes();

    return c.json({
      success: true,
      message: 'Database indexes created successfully'
    });
  } catch (error) {
    console.error('Error creating indexes:', error);
    return c.json({
      success: false,
      message: 'Failed to create database indexes',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Clean up old data
 * POST /database-optimization/cleanup
 */
app.post('/cleanup', validateBody(CleanupOptionsSchema), async (c) => {
  try {
    const options = c.req.valid('json');
    const user = c.get('user');
    
    // Check permissions
    const hasPermission = await c.env.DB.prepare(`
      SELECT 1
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN users u ON rp.role_id = u.role_id
      WHERE u.id = ? AND p.resource = 'system' AND p.action = 'configure'
      LIMIT 1
    `).bind(user.id).first();

    if (!hasPermission) {
      return c.json({
        success: false,
        message: 'Insufficient permissions to cleanup data'
      }, 403);
    }

    const optimizationService = new DatabaseOptimizationService(c.env);
    const result = await optimizationService.cleanupOldData(options);

    // Log the cleanup activity
    await c.env.DB.prepare(`
      INSERT INTO user_activities (
        user_id, action, resource, details, ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      user.id,
      'cleanup_data',
      'system',
      `Data cleanup completed: ${result.activities_cleaned} activities, ${result.notifications_cleaned} notifications cleaned`,
      c.req.header('CF-Connecting-IP') || 'unknown',
      c.req.header('User-Agent') || 'unknown'
    ).run();

    return c.json({
      success: true,
      data: result,
      message: 'Data cleanup completed successfully'
    });
  } catch (error) {
    console.error('Error cleaning up data:', error);
    return c.json({
      success: false,
      message: 'Failed to cleanup data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Explain query execution plan
 * POST /database-optimization/explain
 */
app.post('/explain', validateBody(ExplainQuerySchema), async (c) => {
  try {
    const { query } = c.req.valid('json');
    const user = c.get('user');
    
    // Check permissions
    const hasPermission = await c.env.DB.prepare(`
      SELECT 1
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN users u ON rp.role_id = u.role_id
      WHERE u.id = ? AND p.resource = 'system' AND p.action = 'configure'
      LIMIT 1
    `).bind(user.id).first();

    if (!hasPermission) {
      return c.json({
        success: false,
        message: 'Insufficient permissions to explain queries'
      }, 403);
    }

    // Basic security check - only allow SELECT queries
    if (!query.trim().toLowerCase().startsWith('select')) {
      return c.json({
        success: false,
        message: 'Only SELECT queries are allowed for explanation'
      }, 400);
    }

    const optimizationService = new DatabaseOptimizationService(c.env);
    const plan = await optimizationService.explainQuery(query);

    return c.json({
      success: true,
      data: {
        query,
        execution_plan: plan
      },
      message: 'Query execution plan retrieved successfully'
    });
  } catch (error) {
    console.error('Error explaining query:', error);
    return c.json({
      success: false,
      message: 'Failed to explain query',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Vacuum database
 * POST /database-optimization/vacuum
 */
app.post('/vacuum', async (c) => {
  try {
    const user = c.get('user');
    
    // Check permissions
    const hasPermission = await c.env.DB.prepare(`
      SELECT 1
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN users u ON rp.role_id = u.role_id
      WHERE u.id = ? AND p.resource = 'system' AND p.action = 'configure'
      LIMIT 1
    `).bind(user.id).first();

    if (!hasPermission) {
      return c.json({
        success: false,
        message: 'Insufficient permissions to vacuum database'
      }, 403);
    }

    const optimizationService = new DatabaseOptimizationService(c.env);
    await optimizationService.vacuumDatabase();

    return c.json({
      success: true,
      message: 'Database vacuum completed successfully'
    });
  } catch (error) {
    console.error('Error vacuuming database:', error);
    return c.json({
      success: false,
      message: 'Failed to vacuum database',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Get database statistics
 * GET /database-optimization/stats
 */
app.get('/stats', async (c) => {
  try {
    // Get table statistics
    const tables = await c.env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all();

    const tableStats = [];
    
    for (const table of tables.results as any[]) {
      try {
        const count = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).first<{ count: number }>();
        tableStats.push({
          table: table.name,
          record_count: count?.count || 0
        });
      } catch (error) {
        console.warn(`Could not get stats for table ${table.name}`);
      }
    }

    // Get index information
    const indexes = await c.env.DB.prepare(`
      SELECT name, tbl_name, sql 
      FROM sqlite_master 
      WHERE type='index' AND name NOT LIKE 'sqlite_%'
    `).all();

    return c.json({
      success: true,
      data: {
        tables: tableStats,
        indexes: indexes.results,
        total_tables: tables.results?.length || 0,
        total_indexes: indexes.results?.length || 0
      },
      message: 'Database statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting database statistics:', error);
    return c.json({
      success: false,
      message: 'Failed to get database statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;
