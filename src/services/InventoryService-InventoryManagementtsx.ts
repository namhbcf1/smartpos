import { Env } from '../types';

export interface InventoryMovement {
  id: string;
  tenant_id: string;
  product_id?: string;
  variant_id?: string;
  transaction_type: string;
  quantity: number;
  unit_cost_cents?: number;
  reference_id?: string;
  reference_type?: string;
  reason?: string;
  notes?: string;
  user_id?: string;
  store_id?: string;
  warehouse_id?: string;
  product_name?: string;
  product_sku?: string;
  created_at?: string;
}

export interface CreateMovementData {
  product_id: string;
  variant_id?: string;
  transaction_type: string;
  quantity: number;
  unit_cost_cents?: number;
  reference_id?: string;
  reference_type?: string;
  reason?: string;
  notes?: string;
  user_id?: string;
  store_id?: string;
  warehouse_id?: string;
}

export interface StockAlert {
  id: string;
  product_id: string;
  alert_type: string;
  threshold_value?: number;
  current_value?: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export class InventoryService_InventoryManagementtsx {
  constructor(private env: Env) {}

  async getInventoryMovements(
    tenantId: string,
    page: number = 1,
    limit: number = 50,
    productId?: string,
    transactionType?: string,
    startDate?: string,
    endDate?: string
  ) {
    try {
      const offset = (page - 1) * limit;
      let query = `
        SELECT
          im.*,
          p.name as product_name,
          p.sku as product_sku,
          u.full_name as user_name
        FROM inventory_movements im
        LEFT JOIN products p ON im.product_id = p.id
        LEFT JOIN users u ON im.user_id = u.id
        WHERE im.tenant_id = ?
      `;

      const params: any[] = [tenantId];

      if (productId) {
        query += ` AND im.product_id = ?`;
        params.push(productId);
      }

      if (transactionType) {
        query += ` AND im.transaction_type = ?`;
        params.push(transactionType);
      }

      if (startDate) {
        query += ` AND im.created_at >= ?`;
        params.push(startDate);
      }

      if (endDate) {
        query += ` AND im.created_at <= ?`;
        params.push(endDate);
      }

      query += ` ORDER BY im.created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const movements = await this.env.DB.prepare(query).bind(...params).all();

      // Count total
      let countQuery = `SELECT COUNT(*) as total FROM inventory_movements WHERE tenant_id = ?`;
      const countParams: any[] = [tenantId];

      if (productId) {
        countQuery += ` AND product_id = ?`;
        countParams.push(productId);
      }

      if (transactionType) {
        countQuery += ` AND transaction_type = ?`;
        countParams.push(transactionType);
      }

      if (startDate) {
        countQuery += ` AND created_at >= ?`;
        countParams.push(startDate);
      }

      if (endDate) {
        countQuery += ` AND created_at <= ?`;
        countParams.push(endDate);
      }

      const countResult = await this.env.DB.prepare(countQuery).bind(...countParams).first();

      return {
        success: true,
        movements: movements.results || [],
        pagination: {
          page,
          limit,
          total: countResult?.total || 0,
          pages: Math.ceil((countResult?.total || 0) / limit)
        }
      };
    } catch (error: any) {
      console.error('Get inventory movements error:', error);
      return { success: false, error: error.message || 'Lỗi khi tải lịch sử xuất nhập kho' };
    }
  }

  async createMovement(tenantId: string, data: CreateMovementData) {
    try {
      const movementId = `movement_${Date.now()}`;
      const now = new Date().toISOString();

      // Get product info
      const product = await this.env.DB.prepare(`
        SELECT * FROM products WHERE id = ? AND tenant_id = ?
      `).bind(data.product_id, tenantId).first();

      if (!product) {
        return { success: false, error: 'Không tìm thấy sản phẩm' };
      }

      // Create movement record
      await this.env.DB.prepare(`
        INSERT INTO inventory_movements (
          id, tenant_id, product_id, variant_id, transaction_type,
          quantity, unit_cost_cents, reference_id, reference_type,
          reason, notes, user_id, store_id, warehouse_id,
          product_name, product_sku, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        movementId,
        tenantId,
        data.product_id,
        data.variant_id || null,
        data.transaction_type,
        data.quantity,
        data.unit_cost_cents || null,
        data.reference_id || null,
        data.reference_type || null,
        data.reason || null,
        data.notes || null,
        data.user_id || null,
        data.store_id || null,
        data.warehouse_id || null,
        product.name,
        product.sku,
        now
      ).run();

      // Update product stock based on transaction type
      const stockChange = this.getStockChange(data.transaction_type, data.quantity);

      await this.env.DB.prepare(`
        UPDATE products
        SET stock = stock + ?, updated_at = ?
        WHERE id = ? AND tenant_id = ?
      `).bind(stockChange, now, data.product_id, tenantId).run();

      // Check if stock is low and create alert
      const updatedProduct = await this.env.DB.prepare(`
        SELECT * FROM products WHERE id = ? AND tenant_id = ?
      `).bind(data.product_id, tenantId).first();

      if (updatedProduct && updatedProduct.stock <= (updatedProduct.min_stock || 10)) {
        await this.createStockAlert(tenantId, data.product_id, 'low_stock', updatedProduct.stock);
      }

      return {
        success: true,
        movement_id: movementId,
        message: 'Tạo phiếu xuất nhập kho thành công'
      };
    } catch (error: any) {
      console.error('Create movement error:', error);
      return { success: false, error: error.message || 'Lỗi khi tạo phiếu xuất nhập kho' };
    }
  }

  private getStockChange(transactionType: string, quantity: number): number {
    // In transactions: purchase, adjustment_in, return_from_customer, transfer_in
    // Out transactions: sale, adjustment_out, return_to_supplier, transfer_out
    const inTypes = ['purchase', 'adjustment_in', 'return_from_customer', 'transfer_in', 'initial_stock'];
    const outTypes = ['sale', 'adjustment_out', 'return_to_supplier', 'transfer_out'];

    if (inTypes.includes(transactionType)) {
      return quantity;
    } else if (outTypes.includes(transactionType)) {
      return -quantity;
    }

    return 0;
  }

  async getStockAlerts(tenantId: string, status?: string) {
    try {
      let query = `
        SELECT
          sa.*,
          p.name as product_name,
          p.sku as product_sku,
          p.stock as current_stock,
          p.min_stock
        FROM stock_alerts sa
        LEFT JOIN products p ON sa.product_id = p.id
        WHERE p.tenant_id = ?
      `;

      const params: any[] = [tenantId];

      if (status) {
        query += ` AND sa.status = ?`;
        params.push(status);
      }

      query += ` ORDER BY sa.created_at DESC`;

      const alerts = await this.env.DB.prepare(query).bind(...params).all();

      return {
        success: true,
        alerts: alerts.results || []
      };
    } catch (error: any) {
      console.error('Get stock alerts error:', error);
      return { success: false, error: error.message || 'Lỗi khi tải cảnh báo tồn kho' };
    }
  }

  async createStockAlert(
    tenantId: string,
    productId: string,
    alertType: string,
    currentValue?: number
  ) {
    try {
      const alertId = `alert_${Date.now()}`;
      const now = new Date().toISOString();

      // Check if alert already exists
      const existingAlert = await this.env.DB.prepare(`
        SELECT * FROM stock_alerts
        WHERE product_id = ? AND alert_type = ? AND status = 'active'
      `).bind(productId, alertType).first();

      if (existingAlert) {
        // Update existing alert
        await this.env.DB.prepare(`
          UPDATE stock_alerts
          SET current_value = ?, updated_at = ?
          WHERE id = ?
        `).bind(currentValue || null, now, existingAlert.id).run();

        return {
          success: true,
          alert_id: existingAlert.id,
          message: 'Cập nhật cảnh báo thành công'
        };
      }

      // Create new alert
      await this.env.DB.prepare(`
        INSERT INTO stock_alerts (
          id, product_id, alert_type, current_value,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        alertId,
        productId,
        alertType,
        currentValue || null,
        'active',
        now,
        now
      ).run();

      return {
        success: true,
        alert_id: alertId,
        message: 'Tạo cảnh báo thành công'
      };
    } catch (error: any) {
      console.error('Create stock alert error:', error);
      return { success: false, error: error.message || 'Lỗi khi tạo cảnh báo' };
    }
  }

  async resolveStockAlert(alertId: string) {
    try {
      const now = new Date().toISOString();

      await this.env.DB.prepare(`
        UPDATE stock_alerts
        SET status = 'resolved', updated_at = ?
        WHERE id = ?
      `).bind(now, alertId).run();

      return {
        success: true,
        message: 'Đã giải quyết cảnh báo'
      };
    } catch (error: any) {
      console.error('Resolve stock alert error:', error);
      return { success: false, error: error.message || 'Lỗi khi giải quyết cảnh báo' };
    }
  }

  async getInventoryStats(tenantId: string) {
    try {
      // Total products and value
      const productStats = await this.env.DB.prepare(`
        SELECT
          COUNT(*) as total_products,
          SUM(stock) as total_stock,
          SUM(stock * cost_price_cents) as total_value_cents
        FROM products
        WHERE tenant_id = ? AND is_active = 1
      `).bind(tenantId).first();

      // Low stock products count
      const lowStockCount = await this.env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM products
        WHERE tenant_id = ? AND is_active = 1
          AND stock <= COALESCE(min_stock, 10)
      `).bind(tenantId).first();

      // Out of stock products count
      const outOfStockCount = await this.env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM products
        WHERE tenant_id = ? AND is_active = 1 AND stock = 0
      `).bind(tenantId).first();

      // Recent movements count (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentMovements = await this.env.DB.prepare(`
        SELECT
          transaction_type,
          COUNT(*) as count,
          SUM(quantity) as total_quantity
        FROM inventory_movements
        WHERE tenant_id = ? AND created_at >= ?
        GROUP BY transaction_type
      `).bind(tenantId, thirtyDaysAgo.toISOString()).all();

      return {
        success: true,
        stats: {
          total_products: productStats?.total_products || 0,
          total_stock: productStats?.total_stock || 0,
          total_value_cents: productStats?.total_value_cents || 0,
          low_stock_count: lowStockCount?.count || 0,
          out_of_stock_count: outOfStockCount?.count || 0,
          recent_movements: recentMovements.results || []
        }
      };
    } catch (error: any) {
      console.error('Get inventory stats error:', error);
      return { success: false, error: error.message || 'Lỗi khi tải thống kê tồn kho' };
    }
  }

  async transferStock(
    tenantId: string,
    productId: string,
    fromWarehouseId: string,
    toWarehouseId: string,
    quantity: number,
    userId?: string,
    notes?: string
  ) {
    try {
      const now = new Date().toISOString();
      const transferId = `transfer_${Date.now()}`;

      // Get product info
      const product = await this.env.DB.prepare(`
        SELECT * FROM products WHERE id = ? AND tenant_id = ?
      `).bind(productId, tenantId).first();

      if (!product) {
        return { success: false, error: 'Không tìm thấy sản phẩm' };
      }

      // Create outbound movement
      const outMovementId = `movement_${Date.now()}_out`;
      await this.env.DB.prepare(`
        INSERT INTO inventory_movements (
          id, tenant_id, product_id, transaction_type, quantity,
          warehouse_id, reference_id, reference_type, notes,
          user_id, product_name, product_sku, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        outMovementId,
        tenantId,
        productId,
        'transfer_out',
        quantity,
        fromWarehouseId,
        transferId,
        'stock_transfer',
        notes || null,
        userId || null,
        product.name,
        product.sku,
        now
      ).run();

      // Create inbound movement
      const inMovementId = `movement_${Date.now()}_in`;
      await this.env.DB.prepare(`
        INSERT INTO inventory_movements (
          id, tenant_id, product_id, transaction_type, quantity,
          warehouse_id, reference_id, reference_type, notes,
          user_id, product_name, product_sku, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        inMovementId,
        tenantId,
        productId,
        'transfer_in',
        quantity,
        toWarehouseId,
        transferId,
        'stock_transfer',
        notes || null,
        userId || null,
        product.name,
        product.sku,
        now
      ).run();

      return {
        success: true,
        transfer_id: transferId,
        message: 'Chuyển kho thành công'
      };
    } catch (error: any) {
      console.error('Transfer stock error:', error);
      return { success: false, error: error.message || 'Lỗi khi chuyển kho' };
    }
  }

  async getProductStockHistory(
    productId: string,
    tenantId: string,
    startDate?: string,
    endDate?: string
  ) {
    try {
      let query = `
        SELECT
          im.*,
          u.full_name as user_name,
          w.name as warehouse_name
        FROM inventory_movements im
        LEFT JOIN users u ON im.user_id = u.id
        LEFT JOIN warehouses w ON im.warehouse_id = w.id
        WHERE im.product_id = ? AND im.tenant_id = ?
      `;

      const params: any[] = [productId, tenantId];

      if (startDate) {
        query += ` AND im.created_at >= ?`;
        params.push(startDate);
      }

      if (endDate) {
        query += ` AND im.created_at <= ?`;
        params.push(endDate);
      }

      query += ` ORDER BY im.created_at DESC`;

      const history = await this.env.DB.prepare(query).bind(...params).all();

      return {
        success: true,
        history: history.results || []
      };
    } catch (error: any) {
      console.error('Get product stock history error:', error);
      return { success: false, error: error.message || 'Lỗi khi tải lịch sử tồn kho' };
    }
  }
}
