/**
 * FIXED: Database migration system for SmartPOS
 * Resolves conflicts and implements proper migration management
 */

import { Env } from '../types';

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
 * FIXED: Simplified and reliable migration manager
 */
export class FixedMigrationManager {
  constructor(private env: Env) {}

  /**
   * Initialize migration tracking table
   */
  async initializeMigrationTable(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        version INTEGER NOT NULL UNIQUE,
        executed_at DATETIME NOT NULL DEFAULT (datetime('now')),
        execution_time_ms INTEGER NOT NULL,
        checksum TEXT NOT NULL
      )
    `;

    await this.env.DB.prepare(createTableQuery).run();
  }

  /**
   * Get executed migrations
   */
  async getExecutedMigrations(): Promise<MigrationRecord[]> {
    const result = await this.env.DB.prepare(
      'SELECT * FROM schema_migrations ORDER BY version ASC'
    ).all();
    return result.results as MigrationRecord[] || [];
  }

  /**
   * Check if migration has been executed
   */
  async isMigrationExecuted(migrationId: string): Promise<boolean> {
    const result = await this.env.DB.prepare(
      'SELECT COUNT(*) as count FROM schema_migrations WHERE id = ?'
    ).bind(migrationId).first();
    return (result?.count as number || 0) > 0;
  }

  /**
   * Execute a single migration
   */
  async executeMigration(migration: Migration): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Executing migration: ${migration.name} (v${migration.version})`);
      
      // Execute all UP statements in a transaction
      await this.env.DB.batch(
        migration.up.filter(stmt => stmt.trim()).map(stmt => 
          this.env.DB.prepare(stmt)
        )
      );
      
      const executionTime = Date.now() - startTime;
      const checksum = this.calculateChecksum(migration);
      
      // Record migration execution
      await this.env.DB.prepare(
        `INSERT INTO schema_migrations (id, name, version, execution_time_ms, checksum) 
         VALUES (?, ?, ?, ?, ?)`
      ).bind(migration.id, migration.name, migration.version, executionTime, checksum).run();
      
      console.log(`✅ Migration ${migration.name} completed in ${executionTime}ms`);
    } catch (error) {
      console.error(`❌ Migration ${migration.name} failed:`, error);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(migrations: Migration[]): Promise<void> {
    await this.initializeMigrationTable();
    
    const executedMigrations = await this.getExecutedMigrations();
    const executedIds = new Set(executedMigrations.map(m => m.id));
    
    // Sort migrations by version
    const sortedMigrations = migrations.sort((a, b) => a.version - b.version);
    const pendingMigrations = sortedMigrations.filter(m => !executedIds.has(m.id));

    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }

    console.log(`🔄 Found ${pendingMigrations.length} pending migrations`);

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

    console.log('🎉 All migrations completed successfully');
  }

  /**
   * Calculate migration checksum
   */
  private calculateChecksum(migration: Migration): string {
    const content = JSON.stringify({
      id: migration.id,
      version: migration.version,
      up: migration.up,
      down: migration.down
    });
    
    // Simple hash function for checksum
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(migrations: Migration[]) {
    const executedMigrations = await this.getExecutedMigrations();
    const executedIds = new Set(executedMigrations.map(m => m.id));
    
    const migrationStatus = migrations.map(migration => ({
      ...migration,
      executed: executedIds.has(migration.id),
      executed_at: executedMigrations.find(m => m.id === migration.id)?.executed_at
    }));
    
    return {
      total: migrations.length,
      executed: executedMigrations.length,
      pending: migrations.length - executedMigrations.length,
      migrations: migrationStatus
    };
  }
}

// FIXED: Define migrations with proper schema fixes
const fixedMigrations: Migration[] = [
  {
    id: 'fix_schema_v1',
    name: 'Fix database schema issues',
    version: 1,
    up: [
      // Drop duplicate suppliers table if exists
      `DROP TABLE IF EXISTS suppliers_duplicate`,
      
      // Create fixed schema tables
      `CREATE TABLE IF NOT EXISTS stores_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        tax_number TEXT,
        is_main INTEGER NOT NULL DEFAULT 0 CHECK (is_main IN (0, 1)),
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
      )`,
      
      // Migrate data if needed
      `INSERT OR IGNORE INTO stores_new SELECT * FROM stores`,
      
      // Add missing indexes
      `CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category_id, is_active)`,
      `CREATE INDEX IF NOT EXISTS idx_orders_store_date ON orders(store_id, created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_products_supplier_active ON products(supplier_id, is_active)`,

      // Add constraints validation
      `UPDATE products SET price_cents = 0 WHERE price_cents < 0`,
      `UPDATE products SET cost_price_cents = 0 WHERE cost_price_cents < 0`,
      `UPDATE products SET stock = 0 WHERE stock < 0`
    ],
    down: [
      `DROP INDEX IF EXISTS idx_products_category_active`,
      `DROP INDEX IF EXISTS idx_orders_store_date`,
      `DROP INDEX IF EXISTS idx_products_supplier_active`
    ]
  },
  
  {
    id: 'add_performance_indexes_v2',
    name: 'Add performance optimization indexes',
    version: 2,
    up: [
      // Search optimization indexes
      `CREATE INDEX IF NOT EXISTS idx_products_name_search ON products(name COLLATE NOCASE)`,
      `CREATE INDEX IF NOT EXISTS idx_customers_name_search ON customers(name COLLATE NOCASE)`,
      `CREATE INDEX IF NOT EXISTS idx_suppliers_name_search ON suppliers(name COLLATE NOCASE)`,

      // Performance indexes for reports
      `CREATE INDEX IF NOT EXISTS idx_orders_summary ON orders(store_id, created_at, total_cents, status)`,
      `CREATE INDEX IF NOT EXISTS idx_products_summary ON products(category_id, is_active, name, price_cents, stock)`,
      `CREATE INDEX IF NOT EXISTS idx_order_items_summary ON order_items(order_id, product_id, quantity, total_price_cents)`,

      // Inventory management indexes
      `CREATE INDEX IF NOT EXISTS idx_products_stock_alert ON products(stock, min_stock)`
    ],
    down: [
      `DROP INDEX IF EXISTS idx_products_name_search`,
      `DROP INDEX IF EXISTS idx_customers_name_search`,
      `DROP INDEX IF EXISTS idx_suppliers_name_search`,
      `DROP INDEX IF EXISTS idx_orders_summary`,
      `DROP INDEX IF EXISTS idx_products_summary`,
      `DROP INDEX IF EXISTS idx_order_items_summary`,
      `DROP INDEX IF EXISTS idx_products_stock_alert`,
      `DROP INDEX IF EXISTS idx_products_reorder`
    ],
    dependencies: ['fix_schema_v1']
  }
];

/**
 * Main migration function - FIXED VERSION
 */
export async function runFixedMigrations(env: Env): Promise<void> {
  try {
    const manager = new FixedMigrationManager(env);
    await manager.runMigrations(fixedMigrations);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Get migration status (for admin dashboard)
 */
export async function getFixedMigrationStatus(env: Env) {
  const manager = new FixedMigrationManager(env);
  return await manager.getMigrationStatus(fixedMigrations);
}

export { fixedMigrations };
