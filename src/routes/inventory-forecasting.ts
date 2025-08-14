/**
 * INVENTORY FORECASTING API ROUTES
 * 
 * Advanced inventory management endpoints including automated reorder points,
 * demand forecasting, supplier performance analytics, and purchase order
 * recommendations.
 */

import { Hono } from 'hono';
import { Env, ApiResponse } from '../types';
import { standardAuthenticate, standardAuthorize } from '../middleware/auth-standardized';
import { InventoryForecastingService } from '../services/InventoryForecastingService';
import { log } from '../utils/logger';

const app = new Hono<{ Bindings: Env }>();

// Apply authentication to all routes
app.use('*', standardAuthenticate);

// ============================================================================
// REORDER POINTS MANAGEMENT
// ============================================================================

/**
 * Calculate reorder points for all products
 * POST /api/v1/inventory/reorder-points/calculate
 */
app.post('/reorder-points/calculate', 
  standardAuthorize(['admin', 'manager', 'inventory']),
  async (c) => {
    try {
      const service = new InventoryForecastingService(c.env);
      const reorderPoints = await service.calculateReorderPoints();

      log.info('Reorder points calculated', {
        count: reorderPoints.length,
        userId: c.get('user')?.id
      });

      return c.json<ApiResponse<typeof reorderPoints>>({
        success: true,
        data: reorderPoints,
        message: `Calculated reorder points for ${reorderPoints.length} products`
      });
    } catch (error) {
      log.error('Failed to calculate reorder points', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Failed to calculate reorder points',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

/**
 * Get reorder recommendations
 * GET /api/v1/inventory/reorder-points/recommendations
 */
app.get('/reorder-points/recommendations',
  standardAuthorize(['admin', 'manager', 'inventory']),
  async (c) => {
    try {
      const service = new InventoryForecastingService(c.env);
      const recommendations = await service.generatePurchaseOrderRecommendations();

      return c.json<ApiResponse<typeof recommendations>>({
        success: true,
        data: recommendations,
        message: `Found ${recommendations.length} reorder recommendations`
      });
    } catch (error) {
      log.error('Failed to get reorder recommendations', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Failed to get reorder recommendations',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

// ============================================================================
// DEMAND FORECASTING
// ============================================================================

/**
 * Generate demand forecast
 * POST /api/v1/inventory/demand-forecast
 */
app.post('/demand-forecast',
  standardAuthorize(['admin', 'manager', 'inventory']),
  async (c) => {
    try {
      const body = await c.req.json();
      const { productId, forecastDays = 30 } = body;

      const service = new InventoryForecastingService(c.env);
      const forecasts = await service.generateDemandForecast(productId, forecastDays);

      log.info('Demand forecast generated', {
        productId,
        forecastDays,
        count: forecasts.length,
        userId: c.get('user')?.id
      });

      return c.json<ApiResponse<typeof forecasts>>({
        success: true,
        data: forecasts,
        message: `Generated demand forecast for ${forecasts.length} products`
      });
    } catch (error) {
      log.error('Failed to generate demand forecast', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Failed to generate demand forecast',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

/**
 * Get demand forecast for specific product
 * GET /api/v1/inventory/demand-forecast/:productId
 */
app.get('/demand-forecast/:productId',
  standardAuthorize(['admin', 'manager', 'inventory', 'sales_agent']),
  async (c) => {
    try {
      const productId = parseInt(c.req.param('productId'));
      const forecastDays = parseInt(c.req.query('days') || '30');

      if (isNaN(productId)) {
        return c.json<ApiResponse<null>>({
          success: false,
          data: null,
          message: 'Invalid product ID',
          error: 'INVALID_PRODUCT_ID'
        }, 400);
      }

      const service = new InventoryForecastingService(c.env);
      const forecasts = await service.generateDemandForecast(productId, forecastDays);

      return c.json<ApiResponse<typeof forecasts>>({
        success: true,
        data: forecasts,
        message: 'Demand forecast retrieved successfully'
      });
    } catch (error) {
      log.error('Failed to get demand forecast', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Failed to get demand forecast',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

// ============================================================================
// SUPPLIER PERFORMANCE ANALYTICS
// ============================================================================

/**
 * Analyze supplier performance
 * POST /api/v1/inventory/supplier-performance/analyze
 */
app.post('/supplier-performance/analyze',
  standardAuthorize(['admin', 'manager']),
  async (c) => {
    try {
      const service = new InventoryForecastingService(c.env);
      const performance = await service.analyzeSupplierPerformance();

      log.info('Supplier performance analyzed', {
        count: performance.length,
        userId: c.get('user')?.id
      });

      return c.json<ApiResponse<typeof performance>>({
        success: true,
        data: performance,
        message: `Analyzed performance for ${performance.length} suppliers`
      });
    } catch (error) {
      log.error('Failed to analyze supplier performance', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Failed to analyze supplier performance',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

/**
 * Get supplier performance summary
 * GET /api/v1/inventory/supplier-performance
 */
app.get('/supplier-performance',
  standardAuthorize(['admin', 'manager', 'inventory']),
  async (c) => {
    try {
      const service = new InventoryForecastingService(c.env);
      const performance = await service.analyzeSupplierPerformance();

      return c.json<ApiResponse<typeof performance>>({
        success: true,
        data: performance,
        message: 'Supplier performance retrieved successfully'
      });
    } catch (error) {
      log.error('Failed to get supplier performance', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Failed to get supplier performance',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

// ============================================================================
// INVENTORY ANALYTICS
// ============================================================================

/**
 * Get inventory status overview
 * GET /api/v1/inventory/status
 */
app.get('/status',
  standardAuthorize(['admin', 'manager', 'inventory', 'sales_agent']),
  async (c) => {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_products,
          SUM(CASE WHEN stock_quantity <= 0 THEN 1 ELSE 0 END) as out_of_stock,
          SUM(CASE WHEN stock_quantity <= reorder_point AND stock_quantity > 0 THEN 1 ELSE 0 END) as reorder_needed,
          SUM(CASE WHEN stock_quantity <= safety_stock AND stock_quantity > reorder_point THEN 1 ELSE 0 END) as low_stock,
          SUM(stock_quantity * cost_price) as total_inventory_value,
          AVG(stock_quantity) as avg_stock_level
        FROM products 
        WHERE is_active = 1
      `;

      const result = await c.env.DB.prepare(query).first();

      return c.json<ApiResponse<typeof result>>({
        success: true,
        data: result,
        message: 'Inventory status retrieved successfully'
      });
    } catch (error) {
      log.error('Failed to get inventory status', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Failed to get inventory status',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

/**
 * Get inventory movements history
 * GET /api/v1/inventory/movements
 */
app.get('/movements',
  standardAuthorize(['admin', 'manager', 'inventory']),
  async (c) => {
    try {
      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '50');
      const productId = c.req.query('productId');
      const movementType = c.req.query('type');
      const offset = (page - 1) * limit;

      let whereConditions = ['1=1'];
      const bindings: any[] = [];

      if (productId) {
        whereConditions.push('im.product_id = ?');
        bindings.push(parseInt(productId));
      }

      if (movementType) {
        whereConditions.push('im.movement_type = ?');
        bindings.push(movementType);
      }

      const whereClause = whereConditions.join(' AND ');

      const query = `
        SELECT 
          im.*,
          p.name as product_name,
          p.sku,
          u.full_name as user_name,
          s.name as store_name
        FROM inventory_movements im
        LEFT JOIN products p ON im.product_id = p.id
        LEFT JOIN users u ON im.user_id = u.id
        LEFT JOIN stores s ON im.store_id = s.id
        WHERE ${whereClause}
        ORDER BY im.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM inventory_movements im
        WHERE ${whereClause}
      `;

      const [movements, countResult] = await Promise.all([
        c.env.DB.prepare(query).bind(...bindings, limit, offset).all(),
        c.env.DB.prepare(countQuery).bind(...bindings).first()
      ]);

      const total = (countResult as any)?.total || 0;
      const totalPages = Math.ceil(total / limit);

      return c.json<ApiResponse<any>>({
        success: true,
        data: {
          movements: movements.results,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        },
        message: 'Inventory movements retrieved successfully'
      });
    } catch (error) {
      log.error('Failed to get inventory movements', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Failed to get inventory movements',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

/**
 * Record inventory adjustment
 * POST /api/v1/inventory/adjustment
 */
app.post('/adjustment',
  standardAuthorize(['admin', 'manager', 'inventory']),
  async (c) => {
    try {
      const body = await c.req.json();
      const { productId, quantityChange, reason, location } = body;
      const user = c.get('user');

      if (!productId || quantityChange === undefined || !reason) {
        return c.json<ApiResponse<null>>({
          success: false,
          data: null,
          message: 'Missing required fields: productId, quantityChange, reason',
          error: 'MISSING_REQUIRED_FIELDS'
        }, 400);
      }

      // Get current product stock
      const productQuery = `SELECT stock_quantity FROM products WHERE id = ? AND is_active = 1`;
      const product = await c.env.DB.prepare(productQuery).bind(productId).first() as any;

      if (!product) {
        return c.json<ApiResponse<null>>({
          success: false,
          data: null,
          message: 'Product not found',
          error: 'PRODUCT_NOT_FOUND'
        }, 404);
      }

      const quantityBefore = product.stock_quantity;
      const quantityAfter = quantityBefore + quantityChange;

      if (quantityAfter < 0) {
        return c.json<ApiResponse<null>>({
          success: false,
          data: null,
          message: 'Adjustment would result in negative stock',
          error: 'NEGATIVE_STOCK_NOT_ALLOWED'
        }, 400);
      }

      // Record inventory movement
      const movementQuery = `
        INSERT INTO inventory_movements 
        (product_id, movement_type, quantity_change, quantity_before, quantity_after, 
         reason, location, user_id, store_id, created_at)
        VALUES (?, 'adjustment', ?, ?, ?, ?, ?, ?, 1, datetime('now'))
      `;

      await c.env.DB.prepare(movementQuery).bind(
        productId,
        quantityChange,
        quantityBefore,
        quantityAfter,
        reason,
        location || '',
        user.id
      ).run();

      // Update product stock (trigger will handle this automatically)
      const updateQuery = `
        UPDATE products 
        SET stock_quantity = ?, updated_at = datetime('now')
        WHERE id = ?
      `;

      await c.env.DB.prepare(updateQuery).bind(quantityAfter, productId).run();

      log.info('Inventory adjustment recorded', {
        productId,
        quantityChange,
        quantityBefore,
        quantityAfter,
        reason,
        userId: user.id
      });

      return c.json<ApiResponse<any>>({
        success: true,
        data: {
          productId,
          quantityBefore,
          quantityAfter,
          quantityChange,
          reason
        },
        message: 'Inventory adjustment recorded successfully'
      });
    } catch (error) {
      log.error('Failed to record inventory adjustment', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Failed to record inventory adjustment',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

export default app;
