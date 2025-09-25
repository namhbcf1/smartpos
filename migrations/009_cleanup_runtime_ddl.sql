-- ===================================================================
-- CLEANUP RUNTIME DDL - Final Migration
-- Version: 009
-- Date: 2025-09-22
-- Description: Add any remaining columns that were being added via runtime DDL
-- ===================================================================

PRAGMA foreign_keys = ON;

-- ===================================================================
-- POS SESSIONS TABLE UPDATES
-- ===================================================================

-- Ensure pos_sessions has tenant_id column (from pos.ts runtime DDL)
ALTER TABLE pos_sessions ADD COLUMN tenant_id TEXT DEFAULT 'default';

-- ===================================================================
-- AUDIT LOGS TABLE (referenced in pos.ts but may not exist)
-- ===================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  data_json TEXT,
  created_at TEXT DEFAULT (datetime('now')),

  -- Indexes for common queries
  FOREIGN KEY (actor_id) REFERENCES users(id)
);

-- Indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_actor ON audit_logs(tenant_id, actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ===================================================================
-- ENSURE ALL CRITICAL TABLES EXIST WITH PROPER SCHEMAS
-- ===================================================================

-- Make sure parked_carts has all needed columns
CREATE TABLE IF NOT EXISTS parked_carts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  user_id TEXT NOT NULL,
  cart_data TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Add tenant_id to parked_carts if it doesn't exist
ALTER TABLE parked_carts ADD COLUMN tenant_id TEXT DEFAULT 'default';

-- ===================================================================
-- FINAL SCHEMA CONSISTENCY CHECKS
-- ===================================================================

-- Ensure orders table has all the columns we expect
ALTER TABLE orders ADD COLUMN order_code TEXT;
ALTER TABLE orders ADD COLUMN receipt_printed INTEGER DEFAULT 0 CHECK (receipt_printed IN (0, 1));

-- Ensure products table has the cent-based pricing
ALTER TABLE products ADD COLUMN price_cents INTEGER DEFAULT 0 CHECK (price_cents >= 0);
ALTER TABLE products ADD COLUMN cost_price_cents INTEGER DEFAULT 0 CHECK (cost_price_cents >= 0);

-- Ensure customers table has loyalty and tracking columns
ALTER TABLE customers ADD COLUMN loyalty_points INTEGER DEFAULT 0 CHECK (loyalty_points >= 0);
ALTER TABLE customers ADD COLUMN total_spent_cents INTEGER DEFAULT 0 CHECK (total_spent_cents >= 0);
ALTER TABLE customers ADD COLUMN visit_count INTEGER DEFAULT 0 CHECK (visit_count >= 0);
ALTER TABLE customers ADD COLUMN customer_type TEXT DEFAULT 'regular';
ALTER TABLE customers ADD COLUMN last_visit TEXT;

-- Ensure tasks table has all workflow columns
ALTER TABLE tasks ADD COLUMN assignees_json TEXT;
ALTER TABLE tasks ADD COLUMN watchers_json TEXT;
ALTER TABLE tasks ADD COLUMN order_index INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN estimated_hours REAL;
ALTER TABLE tasks ADD COLUMN actual_hours REAL;
ALTER TABLE tasks ADD COLUMN progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);
ALTER TABLE tasks ADD COLUMN notes TEXT;

-- ===================================================================
-- PERFORMANCE INDEXES (Critical for Production)
-- ===================================================================

-- POS specific indexes
CREATE INDEX IF NOT EXISTS idx_pos_sessions_tenant_user ON pos_sessions(tenant_id, cashier_id);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_status ON pos_sessions(status);
CREATE INDEX IF NOT EXISTS idx_parked_carts_tenant_user ON parked_carts(tenant_id, user_id);

-- Date range query optimization indexes
CREATE INDEX IF NOT EXISTS idx_orders_created_at_range ON orders(created_at) WHERE status = 'completed';
CREATE INDEX IF NOT EXISTS idx_orders_status_date ON orders(status, created_at);

-- Customer analytics indexes
CREATE INDEX IF NOT EXISTS idx_customers_type_active ON customers(customer_type, is_active);
CREATE INDEX IF NOT EXISTS idx_customers_last_visit ON customers(last_visit);

-- Product management indexes
CREATE INDEX IF NOT EXISTS idx_products_pricing ON products(price_cents) WHERE is_active = 1;
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON products(stock, min_stock) WHERE is_active = 1;

-- Task management indexes
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status ON tasks(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_tasks_order_status ON tasks(order_index, status);

-- ===================================================================
-- DATA MIGRATION AND CLEANUP
-- ===================================================================

-- Migrate old price data to cents if needed
UPDATE products SET price_cents = CAST(COALESCE(price, 0) * 100 AS INTEGER)
WHERE price_cents = 0 AND price IS NOT NULL AND price > 0;

UPDATE products SET cost_price_cents = CAST(COALESCE(cost_price, 0) * 100 AS INTEGER)
WHERE cost_price_cents = 0 AND cost_price IS NOT NULL AND cost_price > 0;

-- Migrate customer spending to cents
UPDATE customers SET total_spent_cents = CAST(COALESCE(total_spent, 0) * 100 AS INTEGER)
WHERE total_spent_cents = 0 AND total_spent IS NOT NULL AND total_spent > 0;

-- Ensure order numbers are properly formatted
UPDATE orders SET order_code = order_number WHERE order_code IS NULL AND order_number IS NOT NULL;

-- Set default values where needed
UPDATE customers SET customer_type = 'regular' WHERE customer_type IS NULL;
UPDATE customers SET is_active = 1 WHERE is_active IS NULL;
UPDATE products SET is_active = 1 WHERE is_active IS NULL AND isActive IS NULL;
UPDATE tasks SET progress = 0 WHERE progress IS NULL;

-- ===================================================================
-- FINAL VERIFICATION
-- ===================================================================

-- Update statistics for optimal query planning
ANALYZE;

-- Log completion
INSERT OR REPLACE INTO schema_migrations (version, applied_at, description)
VALUES (
    '009',
    datetime('now'),
    'Final cleanup of runtime DDL - all schema changes now in migrations'
);

-- ===================================================================
-- VERIFICATION QUERIES (for manual checking)
-- ===================================================================

-- These can be run manually to verify migration success:
-- SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
-- SELECT name FROM sqlite_master WHERE type='index' ORDER BY name;
-- PRAGMA table_info(orders);
-- PRAGMA table_info(products);
-- PRAGMA table_info(customers);
-- PRAGMA table_info(tasks);
-- PRAGMA table_info(pos_sessions);
-- PRAGMA table_info(parked_carts);
-- PRAGMA table_info(audit_logs);