import { Env } from '../types';

export class MigrationService {
  constructor(private env: Env) {}

  async runCompleteMigration(): Promise<void> {
    console.log('🔄 Running complete POS schema migration...');
    
    try {
      // Enable foreign keys
      await this.env.DB.prepare('PRAGMA foreign_keys = ON').run();

      // Check if products table exists and add missing columns
      await this.ensureProductsTable();

      // Categories table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          tenant_id TEXT NOT NULL DEFAULT 'default',
          name TEXT NOT NULL,
          parent_id TEXT,
          sort INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (parent_id) REFERENCES categories(id)
        )
      `).run();

      // Inventory logs table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS inventory_logs (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          tenant_id TEXT NOT NULL DEFAULT 'default',
          product_id TEXT NOT NULL,
          delta INTEGER NOT NULL,
          reason TEXT NOT NULL,
          ref_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id)
        )
      `).run();

      // Customers table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          tenant_id TEXT NOT NULL DEFAULT 'default',
          name TEXT NOT NULL,
          phone TEXT,
          email TEXT,
          tier TEXT DEFAULT 'regular',
          points INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      // Orders table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          tenant_id TEXT NOT NULL DEFAULT 'default',
          code TEXT UNIQUE NOT NULL,
          customer_id TEXT,
          status TEXT DEFAULT 'pending',
          subtotal DECIMAL(10,2) NOT NULL,
          discount DECIMAL(10,2) DEFAULT 0,
          tax DECIMAL(10,2) DEFAULT 0,
          total DECIMAL(10,2) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES customers(id)
        )
      `).run();

      // Order items table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS order_items (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          tenant_id TEXT NOT NULL DEFAULT 'default',
          order_id TEXT NOT NULL,
          product_id TEXT NOT NULL,
          qty INTEGER NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          discount DECIMAL(10,2) DEFAULT 0,
          total DECIMAL(10,2) NOT NULL,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id)
        )
      `).run();

      // Payments table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS payments (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          tenant_id TEXT NOT NULL DEFAULT 'default',
          order_id TEXT NOT NULL,
          method TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          reference TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (order_id) REFERENCES orders(id)
        )
      `).run();

      // Returns table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS returns (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          tenant_id TEXT NOT NULL DEFAULT 'default',
          order_id TEXT NOT NULL,
          items_json TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          reason TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (order_id) REFERENCES orders(id)
        )
      `).run();

      // Vouchers table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS vouchers (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          tenant_id TEXT NOT NULL DEFAULT 'default',
          code TEXT UNIQUE NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('fixed', 'percent')),
          value DECIMAL(10,2) NOT NULL,
          min_total DECIMAL(10,2) DEFAULT 0,
          start_at DATETIME,
          end_at DATETIME,
          usage_limit INTEGER,
          used INTEGER DEFAULT 0
        )
      `).run();

      // Users table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          tenant_id TEXT NOT NULL DEFAULT 'default',
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cashier', 'viewer')),
          active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      // Audit logs table
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          tenant_id TEXT NOT NULL DEFAULT 'default',
          actor_id TEXT,
          action TEXT NOT NULL,
          entity TEXT NOT NULL,
          entity_id TEXT,
          data_json TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      // Create indexes
      await this.createIndexes();

      // Ensure product_batches table/columns for expiry tracking (light migration)
      await this.ensureProductBatches();

      console.log('✅ Complete POS schema migration completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  private async createIndexes(): Promise<void> {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id)',
      'CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)',
      'CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)',
      'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)',
      'CREATE INDEX IF NOT EXISTS idx_categories_tenant ON categories(tenant_id)',
      'CREATE INDEX IF NOT EXISTS idx_inventory_logs_tenant ON inventory_logs(tenant_id)',
      'CREATE INDEX IF NOT EXISTS idx_inventory_logs_product ON inventory_logs(product_id)',
      'CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id)',
      'CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)',
      'CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)',
      'CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id)',
      'CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
      'CREATE INDEX IF NOT EXISTS idx_order_items_tenant ON order_items(tenant_id)',
      'CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)',
      'CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id)',
      'CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id)',
      'CREATE INDEX IF NOT EXISTS idx_returns_tenant ON returns(tenant_id)',
      'CREATE INDEX IF NOT EXISTS idx_vouchers_tenant ON vouchers(tenant_id)',
      'CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code)',
      'CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id)',
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id)',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id)'
    ];

    for (const indexSql of indexes) {
      await this.env.DB.prepare(indexSql).run();
    }
  }

  private async ensureProductsTable(): Promise<void> {
    // Check if products table exists
    const tableExists = await this.env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='products'
    `).first();

    if (!tableExists) {
      // Create new products table
      await this.env.DB.prepare(`
        CREATE TABLE products (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          tenant_id TEXT NOT NULL DEFAULT 'default',
          name TEXT NOT NULL,
          sku TEXT UNIQUE NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          cost DECIMAL(10,2),
          stock INTEGER DEFAULT 0,
          category_id TEXT,
          active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
    } else {
      // Add missing columns to existing table
      try {
        await this.env.DB.prepare(`ALTER TABLE products ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default'`).run();
      } catch (e) {
        // Column might already exist
      }

      try {
        await this.env.DB.prepare(`ALTER TABLE products ADD COLUMN cost DECIMAL(10,2)`).run();
      } catch (e) {
        // Column might already exist
      }
    }
  }

  private async ensureProductBatches(): Promise<void> {
    // Create table if not exists (modern structure)
    await this.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS product_batches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        batch_number TEXT NOT NULL,
        supplier_id INTEGER,
        purchase_order_id INTEGER,
        quantity_received INTEGER NOT NULL,
        quantity_remaining INTEGER NOT NULL,
        unit_cost DECIMAL(12,2) NOT NULL,
        manufacturing_date DATE,
        expiration_date DATE,
        status TEXT NOT NULL DEFAULT 'active',
        notes TEXT,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // Add expiration_date if missing (older installs might use expiry_date)
    try {
      await this.env.DB.prepare(`SELECT expiration_date FROM product_batches LIMIT 1`).all();
    } catch (_e) {
      try {
        await this.env.DB.prepare(`ALTER TABLE product_batches ADD COLUMN expiration_date DATE`).run();
      } catch (_e2) {
        // ignore if cannot add
      }
    }

    // Add status column if missing
    try {
      await this.env.DB.prepare(`SELECT status FROM product_batches LIMIT 1`).all();
    } catch (_e) {
      try {
        await this.env.DB.prepare(`ALTER TABLE product_batches ADD COLUMN status TEXT NOT NULL DEFAULT 'active'`).run();
      } catch (_e2) {
        // ignore
      }
    }

    // Helpful index for expiry queries
    await this.env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_product_batches_expiration ON product_batches(expiration_date)
    `).run();
  }

  async checkSchemaHealth(): Promise<any> {
    const tables = [
      'products', 'categories', 'inventory_logs', 'customers',
      'orders', 'order_items', 'payments', 'returns',
      'vouchers', 'users', 'audit_logs'
    ];

    const health = {};

    for (const table of tables) {
      try {
        const result = await this.env.DB.prepare(`SELECT COUNT(*) as count FROM ${table}`).first();
        (health as any)[table] = { exists: true, count: result?.count || 0 };
      } catch (error) {
                  (health as any)[table] = { exists: false, error: ((error as any)?.message  as any)};
      }
    }

    return health;
  }
}


