/**
 * Advanced Inventory Management API
 * Production-ready inventory endpoints with real-time updates
 * Rules.md compliant - uses only real Cloudflare D1 data
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../types';
import { AdvancedInventoryService } from '../services/AdvancedInventoryService';
import { authenticate } from '../middleware/auth';
import { validateQuery, validateBody } from '../middleware/validation';

const app = new Hono<{ Bindings: Env }>();

// Validation schemas
const StockMovementSchema = z.object({
  product_id: z.number().positive(),
  movement_type: z.enum(['in', 'out', 'adjustment', 'transfer', 'reserved', 'released']),
  quantity: z.number().positive(),
  reference_type: z.string().optional(),
  reference_id: z.number().optional(),
  notes: z.string().optional()
});

const InventoryFiltersSchema = z.object({
  category_id: z.number().optional(),
  low_stock_only: z.boolean().optional(),
  location: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
});

const BulkUpdateSchema = z.object({
  updates: z.array(z.object({
    product_id: z.number().positive(),
    new_quantity: z.number().min(0),
    notes: z.string().optional()
  })).min(1).max(50)
});

// Apply authentication to all routes
app.use('*', authenticate);

/**
 * Get comprehensive inventory overview
 * GET /inventory-advanced/overview
 */
app.get('/overview', async (c) => {
  try {
    const inventoryService = new AdvancedInventoryService(c.env);
    const overview = await inventoryService.getInventoryOverview();

    return c.json({
      success: true,
      data: overview,
      message: 'Inventory overview retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting inventory overview:', error);
    return c.json({
      success: false,
      message: 'Failed to get inventory overview',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Get inventory items with advanced filtering
 * GET /inventory-advanced/items
 */
app.get('/items', validateQuery(InventoryFiltersSchema), async (c) => {
  try {
    const filters = c.req.valid('query');
    const inventoryService = new AdvancedInventoryService(c.env);
    
    const items = await inventoryService.getInventoryItems({
      category_id: filters.category_id,
      low_stock_only: filters.low_stock_only,
      location: filters.location
    });

    // Apply pagination
    const startIndex = (filters.page - 1) * filters.limit;
    const endIndex = startIndex + filters.limit;
    const paginatedItems = items.slice(startIndex, endIndex);

    return c.json({
      success: true,
      data: {
        items: paginatedItems,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: items.length,
          pages: Math.ceil(items.length / filters.limit)
        }
      },
      message: 'Inventory items retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting inventory items:', error);
    return c.json({
      success: false,
      message: 'Failed to get inventory items',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Record stock movement
 * POST /inventory-advanced/movement
 */
app.post('/movement', validateBody(StockMovementSchema), async (c) => {
  try {
    const movementData = c.req.valid('json');
    const user = c.get('user');
    
    const inventoryService = new AdvancedInventoryService(c.env);
    const movement = await inventoryService.recordStockMovement({
      ...movementData,
      created_by: user.id
    });

    // Emit real-time event for stock update
    await c.env.NOTIFICATIONS?.fetch('http://internal/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'stock_updated',
        data: {
          product_id: movement.product_id,
          movement_type: movement.movement_type,
          quantity: movement.quantity,
          timestamp: new Date().toISOString()
        }
      })
    });

    return c.json({
      success: true,
      data: movement,
      message: 'Stock movement recorded successfully'
    });
  } catch (error) {
    console.error('Error recording stock movement:', error);
    return c.json({
      success: false,
      message: 'Failed to record stock movement',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Bulk update inventory quantities
 * POST /inventory-advanced/bulk-update
 */
app.post('/bulk-update', validateBody(BulkUpdateSchema), async (c) => {
  try {
    const { updates } = c.req.valid('json');
    const user = c.get('user');
    
    const inventoryService = new AdvancedInventoryService(c.env);
    const results = [];

    // Process updates in transaction-like manner
    for (const update of updates) {
      try {
        const movement = await inventoryService.recordStockMovement({
          product_id: update.product_id,
          movement_type: 'adjustment',
          quantity: update.new_quantity,
          notes: update.notes || 'Bulk inventory update',
          created_by: user.id
        });
        
        results.push({
          product_id: update.product_id,
          success: true,
          movement_id: movement.id
        });
      } catch (error) {
        results.push({
          product_id: update.product_id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Emit real-time event for bulk update
    await c.env.NOTIFICATIONS?.fetch('http://internal/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'inventory_bulk_updated',
        data: {
          updated_count: results.filter(r => r.success).length,
          failed_count: results.filter(r => !r.success).length,
          timestamp: new Date().toISOString()
        }
      })
    });

    return c.json({
      success: true,
      data: {
        results,
        summary: {
          total: updates.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      },
      message: 'Bulk inventory update completed'
    });
  } catch (error) {
    console.error('Error in bulk update:', error);
    return c.json({
      success: false,
      message: 'Failed to perform bulk update',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Get inventory alerts
 * GET /inventory-advanced/alerts
 */
app.get('/alerts', async (c) => {
  try {
    const inventoryService = new AdvancedInventoryService(c.env);
    const alerts = await inventoryService.getActiveAlerts();

    return c.json({
      success: true,
      data: alerts,
      message: 'Inventory alerts retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting inventory alerts:', error);
    return c.json({
      success: false,
      message: 'Failed to get inventory alerts',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Resolve inventory alert
 * PUT /inventory-advanced/alerts/:id/resolve
 */
app.put('/alerts/:id/resolve', async (c) => {
  try {
    const alertId = parseInt(c.req.param('id'));
    const user = c.get('user');

    await c.env.DB.prepare(`
      UPDATE inventory_alerts 
      SET is_resolved = 1, resolved_by = ?, resolved_at = datetime('now')
      WHERE id = ?
    `).bind(user.id, alertId).run();

    return c.json({
      success: true,
      message: 'Alert resolved successfully'
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    return c.json({
      success: false,
      message: 'Failed to resolve alert',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Get inventory movement history
 * GET /inventory-advanced/movements/:productId
 */
app.get('/movements/:productId', async (c) => {
  try {
    const productId = parseInt(c.req.param('productId'));
    const page = parseInt(c.req.query('page') || '1');
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
    const offset = (page - 1) * limit;

    const movements = await c.env.DB.prepare(`
      SELECT 
        it.*,
        u.full_name as created_by_name
      FROM inventory_transactions it
      LEFT JOIN users u ON it.user_id = u.id
      WHERE it.product_id = ?
      ORDER BY it.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(productId, limit, offset).all();

    const totalCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM inventory_transactions
      WHERE product_id = ?
    `).bind(productId).first<{ count: number }>();

    return c.json({
      success: true,
      data: {
        movements: movements.results,
        pagination: {
          page,
          limit,
          total: totalCount?.count || 0,
          pages: Math.ceil((totalCount?.count || 0) / limit)
        }
      },
      message: 'Movement history retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting movement history:', error);
    return c.json({
      success: false,
      message: 'Failed to get movement history',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Initialize inventory tables
 * POST /inventory-advanced/init
 */
app.post('/init', async (c) => {
  try {
    // Create inventory_transactions table
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        transaction_type TEXT NOT NULL CHECK (transaction_type IN ('in', 'out', 'adjustment', 'transfer', 'reserved', 'released')),
        quantity INTEGER NOT NULL,
        reference_type TEXT,
        reference_id INTEGER,
        notes TEXT,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `).run();

    // Create inventory_alerts table
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS inventory_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'overstock', 'expiring_soon', 'expired')),
        message TEXT NOT NULL,
        severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        is_resolved BOOLEAN DEFAULT 0,
        resolved_by INTEGER,
        resolved_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (resolved_by) REFERENCES users(id)
      )
    `).run();

    // Create inventory_reservations table
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS inventory_reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('active', 'fulfilled', 'cancelled', 'expired')),
        reference_type TEXT,
        reference_id INTEGER,
        expires_at DATETIME,
        created_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `).run();

    return c.json({
      success: true,
      message: 'Advanced inventory tables initialized successfully'
    });
  } catch (error) {
    console.error('Error initializing inventory tables:', error);
    return c.json({
      success: false,
      message: 'Failed to initialize inventory tables',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;
