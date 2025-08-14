import { Env } from '../../types';
import { InventoryItem, StockMovement, InventoryStats, Location, Supplier } from './types';

export class InventoryDatabase {
  constructor(private env: Env) {}

  // Initialize all inventory-related tables
  async initializeTables(): Promise<void> {
    try {
      // Locations table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS locations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          code TEXT NOT NULL UNIQUE,
          type TEXT NOT NULL DEFAULT 'warehouse',
          parent_id INTEGER,
          address TEXT,
          description TEXT,
          is_active INTEGER NOT NULL DEFAULT 1,
          capacity INTEGER,
          current_utilization INTEGER DEFAULT 0,
          manager_id INTEGER,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (parent_id) REFERENCES locations (id),
          FOREIGN KEY (manager_id) REFERENCES users (id)
        )
      `).run();

      // Suppliers table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS suppliers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          code TEXT NOT NULL UNIQUE,
          contact_person TEXT,
          email TEXT,
          phone TEXT,
          address TEXT,
          city TEXT,
          country TEXT,
          tax_number TEXT,
          payment_terms TEXT,
          credit_limit DECIMAL(10,2),
          current_balance DECIMAL(10,2) DEFAULT 0,
          rating INTEGER DEFAULT 5,
          is_active INTEGER NOT NULL DEFAULT 1,
          notes TEXT,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
          created_by INTEGER NOT NULL,
          updated_by INTEGER,
          FOREIGN KEY (created_by) REFERENCES users (id),
          FOREIGN KEY (updated_by) REFERENCES users (id)
        )
      `).run();

      // Inventory items table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS inventory_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL,
          location_id INTEGER,
          batch_number TEXT,
          serial_number TEXT,
          quantity INTEGER NOT NULL DEFAULT 0,
          reserved_quantity INTEGER NOT NULL DEFAULT 0,
          available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
          cost_price DECIMAL(10,2) NOT NULL,
          selling_price DECIMAL(10,2),
          expiry_date DATE,
          manufacture_date DATE,
          supplier_id INTEGER,
          purchase_order_id INTEGER,
          status TEXT NOT NULL DEFAULT 'active',
          notes TEXT,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
          created_by INTEGER NOT NULL,
          updated_by INTEGER,
          FOREIGN KEY (product_id) REFERENCES products (id),
          FOREIGN KEY (location_id) REFERENCES locations (id),
          FOREIGN KEY (supplier_id) REFERENCES suppliers (id),
          FOREIGN KEY (created_by) REFERENCES users (id),
          FOREIGN KEY (updated_by) REFERENCES users (id)
        )
      `).run();

      // Stock movements table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS stock_movements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL,
          movement_type TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          previous_quantity INTEGER NOT NULL,
          new_quantity INTEGER NOT NULL,
          cost_price DECIMAL(10,2),
          reference_type TEXT,
          reference_id INTEGER,
          location_id INTEGER,
          batch_number TEXT,
          reason TEXT,
          notes TEXT,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          created_by INTEGER NOT NULL,
          FOREIGN KEY (product_id) REFERENCES products (id),
          FOREIGN KEY (location_id) REFERENCES locations (id),
          FOREIGN KEY (created_by) REFERENCES users (id)
        )
      `).run();

      // Stock adjustments table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS stock_adjustments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          adjustment_number TEXT NOT NULL UNIQUE,
          description TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'draft',
          total_items INTEGER NOT NULL DEFAULT 0,
          total_value_change DECIMAL(10,2) NOT NULL DEFAULT 0,
          reason TEXT NOT NULL,
          notes TEXT,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          created_by INTEGER NOT NULL,
          approved_at DATETIME,
          approved_by INTEGER,
          FOREIGN KEY (created_by) REFERENCES users (id),
          FOREIGN KEY (approved_by) REFERENCES users (id)
        )
      `).run();

      // Stock adjustment items table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS stock_adjustment_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          adjustment_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          current_quantity INTEGER NOT NULL,
          adjusted_quantity INTEGER NOT NULL,
          quantity_change INTEGER NOT NULL,
          cost_price DECIMAL(10,2) NOT NULL,
          value_change DECIMAL(10,2) NOT NULL,
          reason TEXT,
          notes TEXT,
          FOREIGN KEY (adjustment_id) REFERENCES stock_adjustments (id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products (id)
        )
      `).run();

      // Stock transfers table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS stock_transfers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          transfer_number TEXT NOT NULL UNIQUE,
          from_location_id INTEGER NOT NULL,
          to_location_id INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'draft',
          total_items INTEGER NOT NULL DEFAULT 0,
          notes TEXT,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          created_by INTEGER NOT NULL,
          shipped_at DATETIME,
          shipped_by INTEGER,
          received_at DATETIME,
          received_by INTEGER,
          FOREIGN KEY (from_location_id) REFERENCES locations (id),
          FOREIGN KEY (to_location_id) REFERENCES locations (id),
          FOREIGN KEY (created_by) REFERENCES users (id),
          FOREIGN KEY (shipped_by) REFERENCES users (id),
          FOREIGN KEY (received_by) REFERENCES users (id)
        )
      `).run();

      // Stock transfer items table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS stock_transfer_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          transfer_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity_requested INTEGER NOT NULL,
          quantity_shipped INTEGER NOT NULL DEFAULT 0,
          quantity_received INTEGER NOT NULL DEFAULT 0,
          batch_number TEXT,
          notes TEXT,
          FOREIGN KEY (transfer_id) REFERENCES stock_transfers (id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products (id)
        )
      `).run();

      // Purchase orders table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS purchase_orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_number TEXT NOT NULL UNIQUE,
          supplier_id INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'draft',
          order_date DATE NOT NULL,
          expected_date DATE,
          received_date DATE,
          total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          final_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          payment_status TEXT NOT NULL DEFAULT 'pending',
          notes TEXT,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          created_by INTEGER NOT NULL,
          updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
          updated_by INTEGER,
          FOREIGN KEY (supplier_id) REFERENCES suppliers (id),
          FOREIGN KEY (created_by) REFERENCES users (id),
          FOREIGN KEY (updated_by) REFERENCES users (id)
        )
      `).run();

      // Purchase order items table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS purchase_order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity_ordered INTEGER NOT NULL,
          quantity_received INTEGER NOT NULL DEFAULT 0,
          unit_cost DECIMAL(10,2) NOT NULL,
          total_cost DECIMAL(10,2) NOT NULL,
          notes TEXT,
          FOREIGN KEY (order_id) REFERENCES purchase_orders (id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products (id)
        )
      `).run();

      // Low stock alerts table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS low_stock_alerts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL,
          current_stock INTEGER NOT NULL,
          min_stock_level INTEGER NOT NULL,
          reorder_level INTEGER NOT NULL,
          suggested_order_quantity INTEGER NOT NULL,
          priority TEXT NOT NULL DEFAULT 'medium',
          status TEXT NOT NULL DEFAULT 'active',
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          acknowledged_at DATETIME,
          acknowledged_by INTEGER,
          resolved_at DATETIME,
          resolved_by INTEGER,
          FOREIGN KEY (product_id) REFERENCES products (id),
          FOREIGN KEY (acknowledged_by) REFERENCES users (id),
          FOREIGN KEY (resolved_by) REFERENCES users (id)
        )
      `).run();

      // Create indexes for better performance
      await this.createIndexes();

      console.log('Inventory tables initialized successfully');
    } catch (error) {
      console.error('Error initializing inventory tables:', error);
      throw error;
    }
  }

  // Create database indexes
  private async createIndexes(): Promise<void> {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory_items (product_id)',
      'CREATE INDEX IF NOT EXISTS idx_inventory_location_id ON inventory_items (location_id)',
      'CREATE INDEX IF NOT EXISTS idx_inventory_supplier_id ON inventory_items (supplier_id)',
      'CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory_items (status)',
      'CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements (product_id)',
      'CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements (created_at)',
      'CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements (movement_type)',
      'CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON suppliers (is_active)',
      'CREATE INDEX IF NOT EXISTS idx_locations_is_active ON locations (is_active)',
      'CREATE INDEX IF NOT EXISTS idx_locations_type ON locations (type)',
      'CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders (supplier_id)',
      'CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders (status)',
      'CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_product_id ON low_stock_alerts (product_id)',
      'CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_status ON low_stock_alerts (status)'
    ];

    for (const indexQuery of indexes) {
      await this.env.DB.prepare(indexQuery).run();
    }
  }

  // Create default data
  async createDefaultData(): Promise<void> {
    try {
      // Check if we have any locations
      const locationsCount = await this.env.DB.prepare(
        'SELECT COUNT(*) as count FROM locations'
      ).first<{ count: number }>();

      if (locationsCount && locationsCount.count === 0) {
        console.log('Creating default locations...');
        
        // Create default main warehouse
        await this.env.DB.prepare(`
          INSERT INTO locations (name, code, type, description, is_active)
          VALUES (?, ?, ?, ?, ?)
        `).bind(
          'Kho chính',
          'MAIN-WH',
          'warehouse',
          'Kho hàng chính của cửa hàng',
          1
        ).run();

        // Create default store location
        await this.env.DB.prepare(`
          INSERT INTO locations (name, code, type, description, is_active)
          VALUES (?, ?, ?, ?, ?)
        `).bind(
          'Cửa hàng',
          'STORE-01',
          'store',
          'Khu vực bán hàng chính',
          1
        ).run();

        console.log('Default locations created');
      }

      // Check if we have any suppliers
      const suppliersCount = await this.env.DB.prepare(
        'SELECT COUNT(*) as count FROM suppliers'
      ).first<{ count: number }>();

      if (suppliersCount && suppliersCount.count === 0) {
        console.log('Creating default suppliers...');
        
        // Create default supplier
        await this.env.DB.prepare(`
          INSERT INTO suppliers (
            name, code, contact_person, email, phone, 
            address, payment_terms, is_active, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          'Nhà cung cấp mặc định',
          'SUP-001',
          'Người liên hệ',
          'supplier@example.com',
          '0123456789',
          'Địa chỉ nhà cung cấp',
          'Thanh toán trong 30 ngày',
          1,
          1 // Assuming user ID 1 exists
        ).run();

        console.log('Default suppliers created');
      }
    } catch (error) {
      console.error('Error creating default inventory data:', error);
      // Don't throw error for default data creation
    }
  }

  // Get inventory statistics
  async getStats(): Promise<InventoryStats> {
    try {
      // Basic inventory stats
      const basicStats = await this.env.DB.prepare(`
        SELECT 
          COUNT(DISTINCT p.id) as total_products,
          COALESCE(SUM(p.stock_quantity * p.cost_price), 0) as total_stock_value,
          COALESCE(SUM(p.stock_quantity), 0) as total_items_in_stock,
          COUNT(CASE WHEN p.stock_quantity <= p.min_stock_level AND p.stock_quantity > 0 THEN 1 END) as low_stock_items,
          COUNT(CASE WHEN p.stock_quantity = 0 THEN 1 END) as out_of_stock_items,
          COUNT(CASE WHEN p.stock_quantity > p.max_stock_level THEN 1 END) as overstocked_items
        FROM products p
        WHERE p.is_active = 1
      `).first<any>();

      // Location stats
      const locationStats = await this.env.DB.prepare(`
        SELECT COUNT(*) as total_locations
        FROM locations
        WHERE is_active = 1
      `).first<{ total_locations: number }>();

      // Supplier stats
      const supplierStats = await this.env.DB.prepare(`
        SELECT COUNT(*) as active_suppliers
        FROM suppliers
        WHERE is_active = 1
      `).first<{ active_suppliers: number }>();

      // Purchase order stats
      const orderStats = await this.env.DB.prepare(`
        SELECT COUNT(*) as pending_orders
        FROM purchase_orders
        WHERE status IN ('draft', 'sent', 'confirmed')
      `).first<{ pending_orders: number }>();

      // Recent movements
      const movementStats = await this.env.DB.prepare(`
        SELECT COUNT(*) as recent_movements
        FROM stock_movements
        WHERE created_at >= datetime('now', '-7 days')
      `).first<{ recent_movements: number }>();

      return {
        total_products: basicStats?.total_products || 0,
        total_stock_value: basicStats?.total_stock_value || 0,
        total_items_in_stock: basicStats?.total_items_in_stock || 0,
        low_stock_items: basicStats?.low_stock_items || 0,
        out_of_stock_items: basicStats?.out_of_stock_items || 0,
        overstocked_items: basicStats?.overstocked_items || 0,
        total_locations: locationStats?.total_locations || 0,
        active_suppliers: supplierStats?.active_suppliers || 0,
        pending_orders: orderStats?.pending_orders || 0,
        recent_movements: movementStats?.recent_movements || 0,
        inventory_turnover: 0, // Calculate based on sales data
        average_stock_age: 0, // Calculate based on stock movements
        top_moving_products: [],
        stock_by_category: [],
        stock_by_location: [],
        movement_trends: []
      };
    } catch (error) {
      console.error('Error getting inventory stats:', error);
      throw new Error('Failed to get inventory statistics');
    }
  }

  // Generate unique adjustment number
  async generateAdjustmentNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    const count = await this.env.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM stock_adjustments 
      WHERE DATE(created_at) = DATE('now')
    `).first<{ count: number }>();

    const sequence = String((count?.count || 0) + 1).padStart(4, '0');
    return `ADJ-${dateStr}-${sequence}`;
  }

  // Generate unique transfer number
  async generateTransferNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    const count = await this.env.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM stock_transfers 
      WHERE DATE(created_at) = DATE('now')
    `).first<{ count: number }>();

    const sequence = String((count?.count || 0) + 1).padStart(4, '0');
    return `TRF-${dateStr}-${sequence}`;
  }

  // Generate unique purchase order number
  async generatePurchaseOrderNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    const count = await this.env.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM purchase_orders 
      WHERE DATE(created_at) = DATE('now')
    `).first<{ count: number }>();

    const sequence = String((count?.count || 0) + 1).padStart(4, '0');
    return `PO-${dateStr}-${sequence}`;
  }
}
