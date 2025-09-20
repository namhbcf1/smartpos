/**
 * Advanced Inventory Management Service
 * Production-ready inventory tracking with real-time updates
 * Rules.md compliant - uses only real Cloudflare D1 data
 */

import { Env } from '../types';

export interface InventoryItem {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  current_stock: number;
  reserved_stock: number;
  available_stock: number;
  reorder_point: number;
  reorder_quantity: number;
  last_updated: string;
  location?: string;
  batch_number?: string;
  expiry_date?: string;
}

export interface StockMovement {
  id: number;
  product_id: number;
  transaction_type: 'in' | 'out' | 'adjustment' | 'transfer' | 'reserved' | 'released';
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reference_type?: string;
  reference_id?: number;
  notes?: string;
  user_id: number;
  created_at: string;
}

export interface InventoryAlert {
  id: number;
  product_id: number;
  alert_type: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiring_soon' | 'expired';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_resolved: boolean;
  created_at: string;
}

export interface InventoryStats {
  total_products: number;
  total_value: number;
  low_stock_items: number;
  out_of_stock_items: number;
  overstock_items: number;
  expiring_items: number;
  movement_count_today: number;
  top_moving_products: Array<{
    product_id: number;
    product_name: string;
    movement_count: number;
    total_quantity: number;
  }>;
}

export class AdvancedInventoryService {
  constructor(private env: Env) {}

  /**
   * Get comprehensive inventory overview
   */
  async getInventoryOverview(): Promise<{
    items: InventoryItem[];
    stats: InventoryStats;
    alerts: InventoryAlert[];
  }> {
    try {
      // Get inventory items with real-time calculations
      const items = await this.getInventoryItems();
      
      // Get inventory statistics
      const stats = await this.getInventoryStats();
      
      // Get active alerts
      const alerts = await this.getActiveAlerts();

      return { items, stats, alerts };
    } catch (error) {
      console.error('Error getting inventory overview:', error);
      throw error;
    }
  }

  /**
   * Get inventory items with real-time stock calculations
   */
  async getInventoryItems(filters?: {
    category_id?: number;
    low_stock_only?: boolean;
    location?: string;
  }): Promise<InventoryItem[]> {
    try {
      let query = `
        SELECT 
          p.id,
          p.id as product_id,
          p.name as product_name,
          p.sku,
          p.stock as current_stock,
          COALESCE(reserved.reserved_qty, 0) as reserved_stock,
          (p.stock - COALESCE(reserved.reserved_qty, 0)) as available_stock,
          p.min_stock as reorder_point,
          p.reorder_quantity,
          p.updated_at as last_updated
        FROM products p
        LEFT JOIN (
          SELECT 
            product_id,
            SUM(quantity) as reserved_qty
          FROM inventory_reservations 
          WHERE status = 'active' AND expires_at > datetime('now')
          GROUP BY product_id
        ) reserved ON p.id = reserved.product_id
        WHERE p.is_active = 1
      `;

      const params: any[] = [];

      if (filters?.category_id) {
        query += ' AND p.category_id = ?';
        params.push(filters.category_id);
      }

      if (filters?.low_stock_only) {
        query += ' AND p.stock <= p.min_stock';
      }

      query += ' ORDER BY p.name';

      const result = await this.env.DB.prepare(query).bind(...params).all();
      return (result.results as unknown) as InventoryItem[];
    } catch (error) {
      console.error('Error getting inventory items:', error);
      throw error;
    }
  }

  /**
   * Record stock movement with real-time updates
   */
  async recordStockMovement(movement: {
    product_id: number;
    transaction_type: StockMovement['transaction_type'];
    quantity: number;
    reference_type?: string;
    reference_id?: number;
    notes?: string;
    user_id: number;
  }): Promise<StockMovement> {
    try {
      // Get current stock
      const product = await this.env.DB.prepare(`
        SELECT id, stock, name, min_stock
        FROM products 
        WHERE id = ? AND is_active = 1
      `).bind(movement.product_id).first<{
        id: number;
        stock: number;
        name: string;
        min_stock: number;
      }>();

      if (!product) {
        throw new Error('Product not found');
      }

      const previousQuantity = product.stock;
      let newQuantity = previousQuantity;

      // Calculate new quantity based on movement type
      switch (movement.transaction_type) {
        case 'in':
          newQuantity = previousQuantity + movement.quantity;
          break;
        case 'out':
          newQuantity = Math.max(0, previousQuantity - movement.quantity);
          break;
        case 'adjustment':
          newQuantity = movement.quantity; // Direct set
          break;
        default:
          newQuantity = previousQuantity;
      }

      // Update product stock
      await this.env.DB.prepare(`
        UPDATE products 
        SET stock = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(newQuantity, movement.product_id).run();

      // Record movement
      const movementResult = await this.env.DB.prepare(`
        INSERT INTO inventory_transactions (
          product_id, transaction_type, quantity, 
          reference_type, reference_id, notes, 
          user_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        movement.product_id,
        movement.transaction_type,
        movement.quantity,
        movement.reference_type,
        movement.reference_id,
        movement.notes,
        movement.user_id
      ).run();

      // Check for alerts
      await this.checkAndCreateAlerts(movement.product_id, newQuantity, product.min_stock);

      // Return the created movement
      const createdMovement = await this.env.DB.prepare(`
        SELECT * FROM inventory_transactions WHERE id = ?
      `).bind(movementResult.meta.last_row_id).first<StockMovement>();

      return createdMovement!;
    } catch (error) {
      console.error('Error recording stock movement:', error);
      throw error;
    }
  }

  /**
   * Get inventory statistics
   */
  async getInventoryStats(): Promise<InventoryStats> {
    try {
      // Total products and value
      const totals = await this.env.DB.prepare(`
        SELECT 
          COUNT(*) as total_products,
          SUM(stock * cost_price) as total_value,
          SUM(CASE WHEN stock <= min_stock THEN 1 ELSE 0 END) as low_stock_items,
          SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock_items
        FROM products 
        WHERE is_active = 1
      `).first<{
        total_products: number;
        total_value: number;
        low_stock_items: number;
        out_of_stock_items: number;
      }>();

      // Movement count today
      const movementCount = await this.env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM inventory_transactions
        WHERE DATE(created_at) = DATE('now')
      `).first<{ count: number }>();

      // Top moving products
      const topMoving = await this.env.DB.prepare(`
        SELECT 
          it.product_id,
          p.name as product_name,
          COUNT(*) as movement_count,
          SUM(ABS(it.quantity)) as total_quantity
        FROM inventory_transactions it
        JOIN products p ON it.product_id = p.id
        WHERE it.created_at >= date('now', '-7 days')
        GROUP BY it.product_id, p.name
        ORDER BY movement_count DESC
        LIMIT 5
      `).all();

      return {
        total_products: totals?.total_products || 0,
        total_value: totals?.total_value || 0,
        low_stock_items: totals?.low_stock_items || 0,
        out_of_stock_items: totals?.out_of_stock_items || 0,
        overstock_items: await this.getOverstockCount(),
        expiring_items: await this.getExpiringCount(),
        movement_count_today: movementCount?.count || 0,
        top_moving_products: topMoving.results as any[]
      };
    } catch (error) {
      console.error('Error getting inventory stats:', error);
      throw error;
    }
  }

  /**
   * Get active inventory alerts
   */
  async getActiveAlerts(): Promise<InventoryAlert[]> {
    try {
      const alerts = await this.env.DB.prepare(`
        SELECT 
          ia.*,
          p.name as product_name
        FROM inventory_alerts ia
        JOIN products p ON ia.product_id = p.id
        WHERE ia.is_resolved = 0
        ORDER BY ia.severity DESC, ia.created_at DESC
      `).all();

      return (alerts.results as unknown) as InventoryAlert[];
    } catch (error) {
      console.error('Error getting active alerts:', error);
      return [];
    }
  }

  /**
   * Check and create alerts for inventory levels
   */
  private async checkAndCreateAlerts(
    productId: number, 
    currentStock: number, 
    alertThreshold: number
  ): Promise<void> {
    try {
      let alertType: InventoryAlert['alert_type'] | null = null;
      let severity: InventoryAlert['severity'] = 'low';
      let message = '';

      if (currentStock === 0) {
        alertType = 'out_of_stock';
        severity = 'critical';
        message = 'Product is out of stock';
      } else if (currentStock <= alertThreshold) {
        alertType = 'low_stock';
        severity = 'high';
        message = `Stock level is low (${currentStock} remaining)`;
      }

      if (alertType) {
        // Check if alert already exists
        const existingAlert = await this.env.DB.prepare(`
          SELECT id FROM inventory_alerts
          WHERE product_id = ? AND alert_type = ? AND is_resolved = 0
        `).bind(productId, alertType).first();

        if (!existingAlert) {
          await this.env.DB.prepare(`
            INSERT INTO inventory_alerts (
              product_id, alert_type, message, severity, is_resolved, created_at
            ) VALUES (?, ?, ?, ?, 0, datetime('now'))
          `).bind(productId, alertType, message, severity).run();
        }
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }

  /**
   * Determine overstock count using configurable threshold
   * Default: stock >= max(10, min_stock * multiplier)
   */
  private async getOverstockCount(): Promise<number> {
    try {
      const multiplierEnv = (this.env as any).INVENTORY_OVERSTOCK_MULTIPLIER;
      const overstockMultiplier = Number(multiplierEnv) > 0 ? Number(multiplierEnv) : 3;

      const result = await this.env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM products
        WHERE is_active = 1
          AND stock >= CASE 
            WHEN min_stock IS NOT NULL AND min_stock > 0 
              THEN min_stock * ?
            ELSE 10
          END
      `).bind(overstockMultiplier).first<{ count: number }>();

      return result?.count || 0;
    } catch (error) {
      console.error('Error calculating overstock count:', error);
      return 0;
    }
  }

  /**
   * Determine expiring count from product_batches using configurable window
   * Default window: 30 days; uses column expiration_date if available
   */
  private async getExpiringCount(): Promise<number> {
    try {
      const windowEnv = (this.env as any).INVENTORY_EXPIRY_WINDOW_DAYS;
      const windowDays = Number(windowEnv) > 0 ? Number(windowEnv) : 30;

      // Prefer expiration_date (per schema-inventory-extensions.sql). Fallback to expiry_date if present.
      // We detect presence of expiration_date by attempting a query; if it fails, try expiry_date.
      try {
        const res = await this.env.DB.prepare(`
          SELECT COUNT(*) as count
          FROM product_batches
          WHERE status = 'active'
            AND expiration_date IS NOT NULL
            AND date(expiration_date) <= date('now', '+' || ? || ' days')
            AND date(expiration_date) >= date('now')
        `).bind(windowDays).first<{ count: number }>();
        return res?.count || 0;
      } catch (_e) {
        const res2 = await this.env.DB.prepare(`
          SELECT COUNT(*) as count
          FROM product_batches
          WHERE status = 'active'
            AND expiry_date IS NOT NULL
            AND date(expiry_date) <= date('now', '+' || ? || ' days')
            AND date(expiry_date) >= date('now')
        `).bind(windowDays).first<{ count: number }>();
        return res2?.count || 0;
      }
    } catch (error) {
      console.error('Error calculating expiring count:', error);
      return 0;
    }
  }
}
