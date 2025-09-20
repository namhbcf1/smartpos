/**
 * Enhanced database migration system for SmartPOS
 */

import { Env } from '../types';
import { DatabaseExecutor, DatabaseMonitor } from '../utils/database';

export interface Migration {
  id: string;
  name: string;
  version: number;
  up: string[];
  down: string[];
  dependencies?: string[];
}

export interface MigrationRecord {
  id: string;
  name: string;
  version: number;
  executed_at: string;
  execution_time_ms: number;
  checksum: string;
}

/**
 * Migration manager with rollback support and dependency tracking
 */
export class MigrationManager {
  private executor: DatabaseExecutor;
  private migrations: Migration[] = [];

  constructor(private env: Env) {
    this.executor = new DatabaseExecutor(env);
  }

  /**
   * Register a migration
   */
  addMigration(migration: Migration): void {
    this.migrations.push(migration);
    this.migrations.sort((a, b) => a.version - b.version);
  }

  /**
   * Initialize migration tracking table
   */
  async initializeMigrationTable(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        version INTEGER NOT NULL,
        executed_at DATETIME NOT NULL DEFAULT (datetime('now')),
        execution_time_ms INTEGER NOT NULL,
        checksum TEXT NOT NULL,
        UNIQUE(version)
      )
    `;

    await this.executor.execute(createTableQuery);
  }

  /**
   * Get executed migrations
   */
  async getExecutedMigrations(): Promise<MigrationRecord[]> {
    const result = await this.executor.execute<MigrationRecord[]>(
      'SELECT * FROM schema_migrations ORDER BY version ASC'
    );
    return result.data || [];
  }

  /**
   * Calculate migration checksum
   */
  private calculateChecksum(migration: Migration): string {
    const content = JSON.stringify({
      id: migration.id,
      name: migration.name,
      up: migration.up,
      down: migration.down
    });
    
    // Simple hash function (in production, use crypto.subtle.digest)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Check if migration has been executed
   */
  async isMigrationExecuted(migrationId: string): Promise<boolean> {
    const result = await this.executor.execute<{ count: number }[]>(
      'SELECT COUNT(*) as count FROM schema_migrations WHERE id = ?',
      [migrationId]
    );
    return (result.data?.[0]?.count || 0) > 0;
  }

  /**
   * Execute a single migration
   */
  async executeMigration(migration: Migration): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`Executing migration: ${migration.name} (v${migration.version})`);
      
      // Execute all UP statements
      for (const statement of migration.up) {
        if (statement.trim()) {
          await this.executor.execute(statement);
        }
      }
      
      const executionTime = Date.now() - startTime;
      const checksum = this.calculateChecksum(migration);
      
      // Record migration execution
      await this.executor.execute(
        `INSERT INTO schema_migrations (id, name, version, execution_time_ms, checksum) 
         VALUES (?, ?, ?, ?, ?)`,
        [migration.id, migration.name, migration.version, executionTime, checksum]
      );
      
      console.log(`Migration ${migration.name} completed in ${executionTime}ms`);
    } catch (error) {
      console.error(`Migration ${migration.name} failed:`, error);
      throw error;
    }
  }

  /**
   * Rollback a migration
   */
  async rollbackMigration(migration: Migration): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`Rolling back migration: ${migration.name} (v${migration.version})`);
      
      // Execute all DOWN statements in reverse order
      for (const statement of migration.down.reverse()) {
        if (statement.trim()) {
          await this.executor.execute(statement);
        }
      }
      
      // Remove migration record
      await this.executor.execute(
        'DELETE FROM schema_migrations WHERE id = ?',
        [migration.id]
      );
      
      const executionTime = Date.now() - startTime;
      console.log(`Migration ${migration.name} rolled back in ${executionTime}ms`);
    } catch (error) {
      console.error(`Rollback of ${migration.name} failed:`, error);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<void> {
    await this.initializeMigrationTable();
    
    const executedMigrations = await this.getExecutedMigrations();
    const executedIds = new Set(executedMigrations.map(m => m.id));
    
    const pendingMigrations = this.migrations.filter(m => !executedIds.has(m.id));

    if (pendingMigrations.length === 0) {
      console.log('No pending migrations');
      return;
    }

    console.log(`Found ${pendingMigrations.length} pending migrations`);

    for (const migration of pendingMigrations) {
      // Check dependencies
      if (migration.dependencies) {
        for (const depId of migration.dependencies) {
          if (!executedIds.has(depId)) {
            throw new Error(`Migration ${migration.id} depends on ${depId} which has not been executed`);
          }
        }
      }
      
      await this.executeMigration(migration);
      executedIds.add(migration.id);
    }
  }

  /**
   * Rollback to a specific version
   */
  async rollbackToVersion(targetVersion: number): Promise<void> {
    const executedMigrations = await this.getExecutedMigrations();
    const migrationsToRollback = executedMigrations
      .filter(m => m.version > targetVersion)
      .sort((a, b) => b.version - a.version); // Rollback in reverse order
    
    for (const migrationRecord of migrationsToRollback) {
      const migration = this.migrations.find(m => m.id === migrationRecord.id);
      if (migration) {
        await this.rollbackMigration(migration);
      }
  }
}

/**
   * Get migration status
   */
  async getMigrationStatus(): Promise<{
    total: number;
    executed: number;
    pending: number;
    migrations: Array<{
      id: string;
      name: string;
      version: number;
      status: 'executed' | 'pending';
      executedAt?: string;
      executionTime?: number;
    }>;
  }> {
    const executedMigrations = await this.getExecutedMigrations();
    const executedMap = new Map(executedMigrations.map(m => [m.id, m]));
    
    const migrations = this.migrations.map(m => {
      const executed = executedMap.get(m.id);
      return {
        id: m.id,
        name: m.name,
        version: m.version,
        status: executed ? 'executed' as const : 'pending' as const,
        executedAt: executed?.executed_at,
        executionTime: executed?.execution_time_ms
      };
    });
    
    return {
      total: this.migrations.length,
      executed: executedMigrations.length,
      pending: this.migrations.length - executedMigrations.length,
      migrations
    };
  }
}

// Define migrations
const migrations: Migration[] = [
  {
    id: 'initial_schema',
    name: 'Initial database schema',
    version: 1,
    up: [
      // ==========================================
      // CORE TABLES - PRODUCTION SCHEMA
      // ==========================================

      // Stores table
      `CREATE TABLE IF NOT EXISTS stores (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        tax_number TEXT,
        business_license TEXT,
        website TEXT,
        logo_url TEXT,
        manager_id TEXT,
        timezone TEXT NOT NULL DEFAULT 'UTC',
        currency TEXT NOT NULL DEFAULT 'VND',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,

      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT,
        avatar_url TEXT,
        role TEXT NOT NULL DEFAULT 'staff',
        store_id TEXT NOT NULL DEFAULT 'store-1',
        is_active INTEGER NOT NULL DEFAULT 1,
        email_verified INTEGER NOT NULL DEFAULT 0,
        phone_verified INTEGER NOT NULL DEFAULT 0,
        last_login_at TEXT,
        failed_login_attempts INTEGER NOT NULL DEFAULT 0,
        locked_until TEXT,
        password_reset_token TEXT,
        password_reset_expires TEXT,
        two_factor_secret TEXT,
        two_factor_enabled INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (store_id) REFERENCES stores(id)
      )`,

      // Categories table
      `CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        parent_id TEXT,
        image_url TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (parent_id) REFERENCES categories(id)
      )`,

      // Brands table
      `CREATE TABLE IF NOT EXISTS brands (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        website TEXT,
        logo_url TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,

      // Suppliers table
      `CREATE TABLE IF NOT EXISTS suppliers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        tax_number TEXT,
        payment_terms_days INTEGER NOT NULL DEFAULT 30,
        lead_time_days INTEGER NOT NULL DEFAULT 7,
        default_currency TEXT NOT NULL DEFAULT 'VND',
        rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
        notes TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,

      // Products table - SCHEMA COMPLIANT
      `CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        sku TEXT UNIQUE NOT NULL,
        barcode TEXT UNIQUE,
        description TEXT,
        category_id TEXT,
        brand_id TEXT,
        supplier_id TEXT,
        store_id TEXT NOT NULL DEFAULT 'store-1',
        price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
        cost_price_cents INTEGER NOT NULL CHECK (cost_price_cents >= 0),
        stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
        min_stock INTEGER NOT NULL DEFAULT 0,
        max_stock INTEGER NOT NULL DEFAULT 100,
        unit TEXT NOT NULL DEFAULT 'piece',
        weight_grams INTEGER CHECK (weight_grams > 0),
        dimensions TEXT,
        image_url TEXT,
        images TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        is_serialized INTEGER NOT NULL DEFAULT 0,
        category_name TEXT,
        brand_name TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (brand_id) REFERENCES brands(id),
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
        FOREIGN KEY (store_id) REFERENCES stores(id)
      )`,

      // Customers table - SCHEMA COMPLIANT
      `CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        address TEXT,
        date_of_birth TEXT,
        gender TEXT,
        customer_type TEXT NOT NULL DEFAULT 'regular' CHECK (customer_type IN ('regular', 'vip', 'wholesale')),
        loyalty_points INTEGER NOT NULL DEFAULT 0 CHECK (loyalty_points >= 0),
        total_spent_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_spent_cents >= 0),
        visit_count INTEGER NOT NULL DEFAULT 0 CHECK (visit_count >= 0),
        last_visit TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,

      // Orders table - SCHEMA COMPLIANT
      `CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        order_number TEXT UNIQUE NOT NULL,
        customer_id TEXT,
        user_id TEXT NOT NULL,
        store_id TEXT NOT NULL DEFAULT 'store-1',
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')),
        subtotal_cents INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0),
        discount_cents INTEGER NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
        tax_cents INTEGER NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
        total_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
        notes TEXT,
        receipt_printed INTEGER NOT NULL DEFAULT 0,
        customer_name TEXT,
        customer_phone TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (store_id) REFERENCES stores(id)
      )`,

      // Order items table - SCHEMA COMPLIANT
      `CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        variant_id TEXT,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
        total_price_cents INTEGER NOT NULL CHECK (total_price_cents >= 0),
        discount_cents INTEGER NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
        product_name TEXT NOT NULL,
        product_sku TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )`,

      // Insert default store
      `INSERT OR IGNORE INTO stores (id, name, address, phone, email)
       VALUES ('store-1', 'SmartPOS Store', '123 Main Street', '+84123456789', 'store@smartpos.com')`,

      // Insert default admin user (using plain text password for development)
      `INSERT OR IGNORE INTO users (id, email, username, password_hash, full_name, role)
       VALUES ('admin', 'admin@smartpos.com', 'admin', 'admin123', 'Administrator', 'admin')`
    ],
    down: [
      'DROP TABLE IF EXISTS activity_logs',
      'DROP TABLE IF EXISTS settings',
      'DROP TABLE IF EXISTS accounts_receivable',
      'DROP TABLE IF EXISTS financial_transactions',
      'DROP TABLE IF EXISTS inventory_transactions',
      'DROP TABLE IF EXISTS stock_in_items',
      'DROP TABLE IF EXISTS stock_ins',
      'DROP TABLE IF EXISTS suppliers',
      'DROP TABLE IF EXISTS refunds',
      'DROP TABLE IF EXISTS sale_items',
      'DROP TABLE IF EXISTS sales',
      'DROP TABLE IF EXISTS products',
      'DROP TABLE IF EXISTS categories',
      'DROP TABLE IF EXISTS customers',
      'DROP TABLE IF EXISTS users',
      'DROP TABLE IF EXISTS stores'
    ]
  },
  {
    id: 'performance_indexes',
    name: 'Add performance optimization indexes',
    version: 2,
    up: [
      'CREATE INDEX IF NOT EXISTS idx_sales_store_date ON sales(store_id, created_at)',
      'CREATE INDEX IF NOT EXISTS idx_sales_user_date ON sales(user_id, created_at)',
      'CREATE INDEX IF NOT EXISTS idx_sales_customer_date ON sales(customer_id, created_at)',
      'CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category_id, is_active)',
      'CREATE INDEX IF NOT EXISTS idx_products_stock_alert ON products(stock, min_stock)',
      'CREATE INDEX IF NOT EXISTS idx_inventory_product_date ON inventory_transactions(product_id, created_at)',
      'CREATE INDEX IF NOT EXISTS idx_customers_group_active ON customers(customer_group, deleted_at)',
      'CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date ON activity_logs(user_id, created_at)'
    ],
    down: [
      'DROP INDEX IF EXISTS idx_sales_store_date',
      'DROP INDEX IF EXISTS idx_sales_user_date',
      'DROP INDEX IF EXISTS idx_sales_customer_date',
      'DROP INDEX IF EXISTS idx_products_category_active',
      'DROP INDEX IF EXISTS idx_products_stock_alert',
      'DROP INDEX IF EXISTS idx_inventory_product_date',
      'DROP INDEX IF EXISTS idx_customers_group_active',
      'DROP INDEX IF EXISTS idx_activity_logs_user_date'
    ],
    dependencies: ['initial_schema']
  },
  {
    id: 'performance_views',
    name: 'Add performance monitoring views',
    version: 3,
    up: [
      `CREATE VIEW IF NOT EXISTS v_sales_performance AS
       SELECT 
         DATE(created_at) as sale_date,
         store_id,
         COUNT(*) as total_sales,
         SUM(final_amount) as total_revenue,
         AVG(final_amount) as avg_order_value,
         COUNT(DISTINCT customer_id) as unique_customers
       FROM sales 
       WHERE sale_status = 'completed'
       GROUP BY DATE(created_at), store_id`,
      
      `CREATE VIEW IF NOT EXISTS v_inventory_status AS
       SELECT 
         p.id,
         p.name,
         p.sku,
         p.stock,
         p.min_stock,
         c.name as category_name,
         CASE 
           WHEN p.stock = 0 THEN 'out_of_stock'
           WHEN p.stock <= p.min_stock THEN 'low_stock'
           ELSE 'in_stock'
         END as stock_status
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = 1`
    ],
    down: [
      'DROP VIEW IF EXISTS v_sales_performance',
      'DROP VIEW IF EXISTS v_inventory_status'
    ],
    dependencies: ['performance_indexes']
  },
  {
    id: 'warranty_system',
    name: 'Add warranty and serial number management system',
    version: 4,
    up: [
      // Serial Numbers Table
      `CREATE TABLE IF NOT EXISTS serial_numbers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        serial_number TEXT NOT NULL UNIQUE,
        product_id INTEGER NOT NULL,
        supplier_id INTEGER,
        status TEXT NOT NULL DEFAULT 'in_stock' CHECK (
          status IN ('in_stock', 'sold', 'returned', 'defective', 'warranty_claim', 'disposed')
        ),
        received_date DATETIME NOT NULL DEFAULT (datetime('now')),
        sold_date DATETIME,
        warranty_start_date DATETIME,
        warranty_end_date DATETIME,
        sale_id INTEGER,
        customer_id INTEGER,
        location TEXT,
        condition_notes TEXT,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
        created_by INTEGER NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
      )`,

      // Warranty Registrations Table
      `CREATE TABLE IF NOT EXISTS warranty_registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        warranty_number TEXT NOT NULL UNIQUE,
        serial_number_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        customer_id INTEGER NOT NULL,
        sale_id INTEGER NOT NULL,
        warranty_type TEXT NOT NULL CHECK (
          warranty_type IN ('manufacturer', 'store', 'extended', 'premium')
        ),
        warranty_period_months INTEGER NOT NULL DEFAULT 12,
        warranty_start_date DATETIME NOT NULL,
        warranty_end_date DATETIME NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK (
          status IN ('active', 'expired', 'voided', 'claimed', 'transferred')
        ),
        terms_accepted INTEGER NOT NULL DEFAULT 0,
        terms_accepted_date DATETIME,
        terms_version TEXT,
        contact_phone TEXT,
        contact_email TEXT,
        contact_address TEXT,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
        created_by INTEGER NOT NULL,
        FOREIGN KEY (serial_number_id) REFERENCES serial_numbers(id) ON DELETE RESTRICT,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE RESTRICT,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
      )`,

      // Warranty Claims Table
      `CREATE TABLE IF NOT EXISTS warranty_claims (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        claim_number TEXT NOT NULL UNIQUE,
        warranty_registration_id INTEGER NOT NULL,
        serial_number_id INTEGER NOT NULL,
        claim_type TEXT NOT NULL CHECK (
          claim_type IN ('repair', 'replacement', 'refund', 'diagnostic')
        ),
        issue_description TEXT NOT NULL,
        reported_date DATETIME NOT NULL DEFAULT (datetime('now')),
        status TEXT NOT NULL DEFAULT 'submitted' CHECK (
          status IN ('submitted', 'approved', 'in_progress', 'completed', 'rejected', 'cancelled')
        ),
        resolution_type TEXT CHECK (
          resolution_type IN ('repaired', 'replaced', 'refunded', 'no_fault_found', 'out_of_warranty')
        ),
        resolution_description TEXT,
        resolution_date DATETIME,
        estimated_cost DECIMAL(10,2) DEFAULT 0,
        actual_cost DECIMAL(10,2) DEFAULT 0,
        covered_by_warranty INTEGER NOT NULL DEFAULT 1,
        customer_charge DECIMAL(10,2) DEFAULT 0,
        technician_id INTEGER,
        service_provider TEXT,
        external_reference TEXT,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
        created_by INTEGER NOT NULL,
        FOREIGN KEY (warranty_registration_id) REFERENCES warranty_registrations(id) ON DELETE RESTRICT,
        FOREIGN KEY (serial_number_id) REFERENCES serial_numbers(id) ON DELETE RESTRICT,
        FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
      )`,

      // Warranty Notifications Table
      `CREATE TABLE IF NOT EXISTS warranty_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        warranty_registration_id INTEGER NOT NULL,
        notification_type TEXT NOT NULL CHECK (
          notification_type IN ('expiry_warning', 'expired', 'claim_update', 'registration_confirmation')
        ),
        notification_method TEXT NOT NULL CHECK (
          notification_method IN ('email', 'sms', 'push', 'in_app')
        ),
        scheduled_date DATETIME NOT NULL,
        sent_date DATETIME,
        subject TEXT,
        message TEXT NOT NULL,
        template_id TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (
          status IN ('pending', 'sent', 'failed', 'cancelled')
        ),
        delivery_status TEXT CHECK (
          delivery_status IN ('delivered', 'bounced', 'opened', 'clicked')
        ),
        error_message TEXT,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (warranty_registration_id) REFERENCES warranty_registrations(id) ON DELETE CASCADE
      )`,

      // Product Warranty Configurations Table
      `CREATE TABLE IF NOT EXISTS product_warranty_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        category_id INTEGER,
        default_warranty_months INTEGER NOT NULL DEFAULT 12,
        max_warranty_months INTEGER NOT NULL DEFAULT 36,
        warranty_type TEXT NOT NULL DEFAULT 'manufacturer',
        warning_days_before_expiry INTEGER NOT NULL DEFAULT 30,
        enable_auto_notifications INTEGER NOT NULL DEFAULT 1,
        warranty_terms TEXT,
        exclusions TEXT,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
        created_by INTEGER NOT NULL,
        CHECK (product_id IS NOT NULL OR category_id IS NOT NULL),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
      )`,

      // Indexes for performance optimization
      'CREATE INDEX IF NOT EXISTS idx_serial_numbers_serial ON serial_numbers(serial_number)',
      'CREATE INDEX IF NOT EXISTS idx_serial_numbers_product ON serial_numbers(product_id)',
      'CREATE INDEX IF NOT EXISTS idx_serial_numbers_status ON serial_numbers(status)',
      'CREATE INDEX IF NOT EXISTS idx_serial_numbers_sale ON serial_numbers(sale_id)',
      'CREATE INDEX IF NOT EXISTS idx_serial_numbers_customer ON serial_numbers(customer_id)',
      'CREATE INDEX IF NOT EXISTS idx_serial_numbers_dates ON serial_numbers(received_date, sold_date)',

      'CREATE INDEX IF NOT EXISTS idx_warranty_reg_number ON warranty_registrations(warranty_number)',
      'CREATE INDEX IF NOT EXISTS idx_warranty_reg_serial ON warranty_registrations(serial_number_id)',
      'CREATE INDEX IF NOT EXISTS idx_warranty_reg_customer ON warranty_registrations(customer_id)',
      'CREATE INDEX IF NOT EXISTS idx_warranty_reg_status ON warranty_registrations(status)',
      'CREATE INDEX IF NOT EXISTS idx_warranty_reg_dates ON warranty_registrations(warranty_start_date, warranty_end_date)',
      'CREATE INDEX IF NOT EXISTS idx_warranty_reg_expiry ON warranty_registrations(warranty_end_date) WHERE status = "active"',

      'CREATE INDEX IF NOT EXISTS idx_warranty_claims_number ON warranty_claims(claim_number)',
      'CREATE INDEX IF NOT EXISTS idx_warranty_claims_warranty ON warranty_claims(warranty_registration_id)',
      'CREATE INDEX IF NOT EXISTS idx_warranty_claims_status ON warranty_claims(status)',
      'CREATE INDEX IF NOT EXISTS idx_warranty_claims_dates ON warranty_claims(reported_date, resolution_date)',

      'CREATE INDEX IF NOT EXISTS idx_warranty_notif_warranty ON warranty_notifications(warranty_registration_id)',
      'CREATE INDEX IF NOT EXISTS idx_warranty_notif_scheduled ON warranty_notifications(scheduled_date) WHERE status = "pending"',
      'CREATE INDEX IF NOT EXISTS idx_warranty_notif_type ON warranty_notifications(notification_type)',

      'CREATE INDEX IF NOT EXISTS idx_warranty_config_product ON product_warranty_configs(product_id)',
      'CREATE INDEX IF NOT EXISTS idx_warranty_config_category ON product_warranty_configs(category_id)',

      // Triggers for data integrity
      `CREATE TRIGGER IF NOT EXISTS update_warranty_end_date
        AFTER UPDATE OF warranty_period_months, warranty_start_date ON warranty_registrations
        FOR EACH ROW
      BEGIN
        UPDATE warranty_registrations
        SET warranty_end_date = datetime(NEW.warranty_start_date, '+' || NEW.warranty_period_months || ' months'),
            updated_at = datetime('now')
        WHERE id = NEW.id;
      END`,

      `CREATE TRIGGER IF NOT EXISTS update_serial_status_on_sale
        AFTER UPDATE OF sale_id ON serial_numbers
        FOR EACH ROW
        WHEN NEW.sale_id IS NOT NULL AND OLD.sale_id IS NULL
      BEGIN
        UPDATE serial_numbers
        SET status = 'sold',
            sold_date = datetime('now'),
            updated_at = datetime('now')
        WHERE id = NEW.id;
      END`,

      `CREATE TRIGGER IF NOT EXISTS auto_create_warranty_registration
        AFTER UPDATE OF status ON serial_numbers
        FOR EACH ROW
        WHEN NEW.status = 'sold' AND OLD.status != 'sold' AND NEW.sale_id IS NOT NULL
      BEGIN
        INSERT INTO warranty_registrations (
          warranty_number,
          serial_number_id,
          product_id,
          customer_id,
          sale_id,
          warranty_start_date,
          warranty_end_date,
          warranty_period_months,
          created_by
        )
        SELECT
          'WR' || strftime('%Y%m%d', 'now') || '-' || printf('%06d', NEW.id),
          NEW.id,
          NEW.product_id,
          NEW.customer_id,
          NEW.sale_id,
          datetime('now'),
          datetime('now', '+12 months'),
          12,
          NEW.created_by
        WHERE EXISTS (
          SELECT 1 FROM products p
          WHERE p.id = NEW.product_id
          AND p.category_id IN (
            SELECT id FROM categories
            WHERE name LIKE '%máy tính%' OR name LIKE '%laptop%' OR name LIKE '%PC%'
          )
        );
      END`
    ],
    down: [
      'DROP TRIGGER IF EXISTS auto_create_warranty_registration',
      'DROP TRIGGER IF EXISTS update_serial_status_on_sale',
      'DROP TRIGGER IF EXISTS update_warranty_end_date',
      'DROP INDEX IF EXISTS idx_warranty_config_category',
      'DROP INDEX IF EXISTS idx_warranty_config_product',
      'DROP INDEX IF EXISTS idx_warranty_notif_type',
      'DROP INDEX IF EXISTS idx_warranty_notif_scheduled',
      'DROP INDEX IF EXISTS idx_warranty_notif_warranty',
      'DROP INDEX IF EXISTS idx_warranty_claims_dates',
      'DROP INDEX IF EXISTS idx_warranty_claims_status',
      'DROP INDEX IF EXISTS idx_warranty_claims_warranty',
      'DROP INDEX IF EXISTS idx_warranty_claims_number',
      'DROP INDEX IF EXISTS idx_warranty_reg_expiry',
      'DROP INDEX IF EXISTS idx_warranty_reg_dates',
      'DROP INDEX IF EXISTS idx_warranty_reg_status',
      'DROP INDEX IF EXISTS idx_warranty_reg_customer',
      'DROP INDEX IF EXISTS idx_warranty_reg_serial',
      'DROP INDEX IF EXISTS idx_warranty_reg_number',
      'DROP INDEX IF EXISTS idx_serial_numbers_dates',
      'DROP INDEX IF EXISTS idx_serial_numbers_customer',
      'DROP INDEX IF EXISTS idx_serial_numbers_sale',
      'DROP INDEX IF EXISTS idx_serial_numbers_status',
      'DROP INDEX IF EXISTS idx_serial_numbers_product',
      'DROP INDEX IF EXISTS idx_serial_numbers_serial',
      'DROP TABLE IF EXISTS warranty_notifications',
      'DROP TABLE IF EXISTS warranty_claims',
      'DROP TABLE IF EXISTS warranty_registrations',
      'DROP TABLE IF EXISTS serial_numbers',
      'DROP TABLE IF EXISTS product_warranty_configs'
    ],
    dependencies: ['performance_views']
  }
  ,
  {
    id: 'expenses_table',
    name: 'Add expenses table for financial tracking',
    version: 5,
    up: [
      `CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expense_type TEXT NOT NULL,
        expense_date DATE NOT NULL,
        amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        notes TEXT,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
        created_by INTEGER
      )`,
      'CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date)',
      'CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(expense_type)',
      // Optional: mirror into financial_transactions for unified reporting
      `CREATE TRIGGER IF NOT EXISTS trg_expenses_insert_financial
        AFTER INSERT ON expenses
        BEGIN
          INSERT INTO financial_transactions (
            date, transaction_type, category, amount, payment_method, reference_number, reference_id, reference_type, notes
          ) VALUES (
            NEW.expense_date, 'expense', NEW.expense_type, NEW.amount, 'cash', NULL, NEW.id, 'expense', NEW.notes
          );
        END`,
      `CREATE TRIGGER IF NOT EXISTS trg_expenses_update_financial
        AFTER UPDATE ON expenses
        BEGIN
          UPDATE financial_transactions
          SET date = NEW.expense_date,
              category = NEW.expense_type,
              amount = NEW.amount,
              notes = NEW.notes,
              updated_at = datetime('now')
          WHERE reference_type = 'expense' AND reference_id = NEW.id;
        END`,
      `CREATE TRIGGER IF NOT EXISTS trg_expenses_delete_financial
        AFTER DELETE ON expenses
        BEGIN
          DELETE FROM financial_transactions
          WHERE reference_type = 'expense' AND reference_id = OLD.id;
        END`
    ],
    down: [
      'DROP TRIGGER IF EXISTS trg_expenses_delete_financial',
      'DROP TRIGGER IF EXISTS trg_expenses_update_financial',
      'DROP TRIGGER IF EXISTS trg_expenses_insert_financial',
      'DROP INDEX IF EXISTS idx_expenses_type',
      'DROP INDEX IF EXISTS idx_expenses_date',
      'DROP TABLE IF EXISTS expenses'
    ],
    dependencies: ['warranty_system']
  }
  ,
  {
    id: 'cycle_count_v1',
    name: 'Add cycle count sessions and items tables',
    version: 6,
    up: [
      `CREATE TABLE IF NOT EXISTS cycle_count_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER,
        created_by INTEGER,
        status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','finalized','cancelled')),
        notes TEXT,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        finalized_at DATETIME
      )`,
      `CREATE TABLE IF NOT EXISTS cycle_count_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        expected_quantity INTEGER NOT NULL,
        counted_quantity INTEGER NOT NULL,
        difference INTEGER GENERATED ALWAYS AS (counted_quantity - expected_quantity) STORED,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (session_id) REFERENCES cycle_count_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )`,
      'CREATE INDEX IF NOT EXISTS idx_cycle_items_session ON cycle_count_items(session_id)',
      'CREATE INDEX IF NOT EXISTS idx_cycle_items_product ON cycle_count_items(product_id)'
    ],
    down: [
      'DROP INDEX IF EXISTS idx_cycle_items_product',
      'DROP INDEX IF EXISTS idx_cycle_items_session',
      'DROP TABLE IF EXISTS cycle_count_items',
      'DROP TABLE IF EXISTS cycle_count_sessions'
    ],
    dependencies: ['expenses_table']
  },
  {
    id: 'advanced_tables',
    name: 'Add advanced tables for file uploads, purchases, serials, warranty, payments',
    version: 7,
    up: [
      // File uploads table
      `CREATE TABLE IF NOT EXISTS file_uploads (
        id TEXT PRIMARY KEY,
        original_name TEXT NOT NULL,
        filename TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        category TEXT NOT NULL DEFAULT 'general',
        description TEXT,
        uploaded_by TEXT NOT NULL,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'archived'))
      )`,
      // Payment transactions table
      `CREATE TABLE IF NOT EXISTS payment_transactions (
        id TEXT PRIMARY KEY,
        transaction_id TEXT NOT NULL UNIQUE,
        order_id TEXT,
        amount DECIMAL(10,2) NOT NULL,
        currency TEXT DEFAULT 'VND',
        payment_method TEXT NOT NULL,
        gateway TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
        gateway_transaction_id TEXT,
        gateway_response TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      // Payment refunds table
      `CREATE TABLE IF NOT EXISTS payment_refunds (
        id TEXT PRIMARY KEY,
        payment_transaction_id TEXT NOT NULL,
        refund_amount DECIMAL(10,2) NOT NULL,
        reason TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
        gateway_refund_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (payment_transaction_id) REFERENCES payment_transactions(id)
      )`,
      // Purchase orders table
      `CREATE TABLE IF NOT EXISTS purchase_orders (
        id TEXT PRIMARY KEY,
        supplier_id TEXT NOT NULL,
        order_number TEXT NOT NULL UNIQUE,
        order_date DATETIME NOT NULL,
        expected_delivery_date DATETIME,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'ordered', 'received', 'cancelled')),
        subtotal REAL NOT NULL DEFAULT 0,
        tax_amount REAL NOT NULL DEFAULT 0,
        total_amount REAL NOT NULL DEFAULT 0,
        notes TEXT,
        created_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      // Indexes
      'CREATE INDEX IF NOT EXISTS idx_file_uploads_category ON file_uploads(category)',
      'CREATE INDEX IF NOT EXISTS idx_file_uploads_status ON file_uploads(status)',
      'CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status)',
      'CREATE INDEX IF NOT EXISTS idx_payment_transactions_method ON payment_transactions(payment_method)',
      'CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id)',
      'CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status)'
    ],
    down: [
      'DROP INDEX IF EXISTS idx_purchase_orders_status',
      'DROP INDEX IF EXISTS idx_purchase_orders_supplier',
      'DROP INDEX IF EXISTS idx_payment_transactions_method',
      'DROP INDEX IF EXISTS idx_payment_transactions_status',
      'DROP INDEX IF EXISTS idx_file_uploads_status',
      'DROP INDEX IF EXISTS idx_file_uploads_category',
      'DROP TABLE IF EXISTS purchase_orders',
      'DROP TABLE IF EXISTS payment_refunds',
      'DROP TABLE IF EXISTS payment_transactions',
      'DROP TABLE IF EXISTS file_uploads'
    ],
    dependencies: []
  }
];

/**
 * Main migration function
 */
export async function checkAndRunMigrations(env: Env): Promise<void> {
  try {
    const manager = new MigrationManager(env);
    
    // Register all migrations
    migrations.forEach(migration => manager.addMigration(migration));
    
    // Run migrations
    await manager.runMigrations();
    
    // Log performance stats
    const stats = DatabaseMonitor.getStats();
    if (stats.totalQueries > 0) {
      console.log('Migration performance stats:', stats);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

/**
 * Get migration status (for admin dashboard)
 */
export async function getMigrationStatus(env: Env) {
  const manager = new MigrationManager(env);
  migrations.forEach(migration => manager.addMigration(migration));
  return await manager.getMigrationStatus();
}

/**
 * Rollback migrations (for emergency use)
 */
export async function rollbackToVersion(env: Env, version: number) {
  const manager = new MigrationManager(env);
  migrations.forEach(migration => manager.addMigration(migration));
  await manager.rollbackToVersion(version);
}