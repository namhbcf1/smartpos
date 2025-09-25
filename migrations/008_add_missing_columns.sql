-- ===================================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- Version: 008
-- Date: 2025-09-22
-- Description: Add columns that are currently being added via ALTER TABLE in routes
-- ===================================================================

PRAGMA foreign_keys = ON;

-- ===================================================================
-- ADD MISSING COLUMNS TO ORDERS TABLE
-- ===================================================================

-- Add missing columns to orders table (from orders.ts routes)
ALTER TABLE orders ADD COLUMN order_code TEXT;

-- Update indexes for new columns
CREATE INDEX IF NOT EXISTS idx_orders_order_code ON orders(order_code);

-- ===================================================================
-- ADD MISSING COLUMNS TO PRODUCTS TABLE
-- ===================================================================

-- Add missing columns to products table (from products.ts routes)
-- Note: These columns have different naming conventions than the existing schema
-- We need to support both for backward compatibility

-- Cents-based pricing columns (new standard)
ALTER TABLE products ADD COLUMN price_cents INTEGER DEFAULT 0 CHECK (price_cents >= 0);
ALTER TABLE products ADD COLUMN cost_price_cents INTEGER DEFAULT 0 CHECK (cost_price_cents >= 0);

-- Unified column names (standardize on snake_case)
ALTER TABLE products ADD COLUMN category_id TEXT;
ALTER TABLE products ADD COLUMN supplier_id TEXT;
ALTER TABLE products ADD COLUMN brand_id TEXT;
ALTER TABLE products ADD COLUMN is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1));
ALTER TABLE products ADD COLUMN created_at TEXT DEFAULT (datetime('now'));
ALTER TABLE products ADD COLUMN updated_at TEXT DEFAULT (datetime('now'));

-- Stock management columns
ALTER TABLE products ADD COLUMN min_stock_level INTEGER;
ALTER TABLE products ADD COLUMN max_stock_level INTEGER;

-- Create indexes for new product columns
CREATE INDEX IF NOT EXISTS idx_products_category_id_new ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id_new ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id_new ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_price_cents ON products(price_cents);

-- ===================================================================
-- ADD MISSING COLUMNS TO CUSTOMERS TABLE
-- ===================================================================

-- Add missing columns to customers table (from customers.ts routes)
ALTER TABLE customers ADD COLUMN total_spent_cents INTEGER DEFAULT 0 CHECK (total_spent_cents >= 0);
ALTER TABLE customers ADD COLUMN visit_count INTEGER DEFAULT 0 CHECK (visit_count >= 0);
ALTER TABLE customers ADD COLUMN customer_type TEXT DEFAULT 'regular';
ALTER TABLE customers ADD COLUMN last_visit TEXT;

-- Create indexes for new customer columns
CREATE INDEX IF NOT EXISTS idx_customers_customer_type ON customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_last_visit ON customers(last_visit);
CREATE INDEX IF NOT EXISTS idx_customers_total_spent_cents ON customers(total_spent_cents);

-- ===================================================================
-- ADD MISSING COLUMNS TO TASKS TABLE
-- ===================================================================

-- Add missing columns to tasks table (from tasks.ts routes)
ALTER TABLE tasks ADD COLUMN assignees_json TEXT;
ALTER TABLE tasks ADD COLUMN watchers_json TEXT;
ALTER TABLE tasks ADD COLUMN order_index INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN estimated_hours REAL;
ALTER TABLE tasks ADD COLUMN actual_hours REAL;
ALTER TABLE tasks ADD COLUMN progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);
ALTER TABLE tasks ADD COLUMN notes TEXT;

-- Update task checklist table
ALTER TABLE task_checklist ADD COLUMN updated_at TEXT DEFAULT (datetime('now'));

-- Create indexes for task columns
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_order_index ON tasks(order_index);

-- ===================================================================
-- DATA MIGRATION AND COMPATIBILITY
-- ===================================================================

-- Migrate existing price data to cents (multiply by 100)
UPDATE products SET price_cents = CAST(price * 100 AS INTEGER) WHERE price_cents = 0 AND price IS NOT NULL AND price > 0;
UPDATE products SET cost_price_cents = CAST(cost_price * 100 AS INTEGER) WHERE cost_price_cents = 0 AND cost_price IS NOT NULL AND cost_price > 0;

-- Copy data from old column names to new standardized names (backward compatibility)
UPDATE products SET category_id = categoryId WHERE category_id IS NULL AND categoryId IS NOT NULL;
UPDATE products SET supplier_id = supplierId WHERE supplier_id IS NULL AND supplierId IS NOT NULL;
UPDATE products SET brand_id = brandId WHERE brand_id IS NULL AND brandId IS NOT NULL;
UPDATE products SET is_active = isActive WHERE is_active = 1 AND isActive IS NOT NULL;
UPDATE products SET created_at = createdAt WHERE created_at IS NULL AND createdAt IS NOT NULL;
UPDATE products SET updated_at = updatedAt WHERE updated_at IS NULL AND updatedAt IS NOT NULL;

-- Set min/max stock from existing columns
UPDATE products SET min_stock_level = min_stock WHERE min_stock_level IS NULL AND min_stock IS NOT NULL;
UPDATE products SET max_stock_level = max_stock WHERE max_stock_level IS NULL AND max_stock IS NOT NULL;

-- Migrate customer spending data to cents
UPDATE customers SET total_spent_cents = CAST(total_spent * 100 AS INTEGER) WHERE total_spent_cents = 0 AND total_spent IS NOT NULL AND total_spent > 0;

-- ===================================================================
-- SCHEMA VALIDATION
-- ===================================================================

-- Ensure all tables have the expected columns after migration
-- This can be used for validation by applications

-- Add schema version tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TEXT DEFAULT (datetime('now')),
    description TEXT
);

INSERT OR REPLACE INTO schema_migrations (version, applied_at, description)
VALUES (
    '008',
    datetime('now'),
    'Added missing columns to orders, products, customers, and tasks tables'
);

-- ===================================================================
-- IDEMPOTENCY SUPPORT
-- ===================================================================

-- Create idempotency cache table for duplicate request prevention
CREATE TABLE IF NOT EXISTS idempotency_cache (
  key TEXT PRIMARY KEY,
  response_data TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

-- Index for cleanup operations
CREATE INDEX IF NOT EXISTS idx_idempotency_expires_at ON idempotency_cache(expires_at);

-- ===================================================================
-- PERFORMANCE INDEXES FOR DATE FILTERING
-- ===================================================================

-- Critical indexes for date range queries (avoiding function calls like DATE())
CREATE INDEX IF NOT EXISTS idx_orders_created_at_status ON orders(created_at, status);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders(status, created_at);

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at);

-- Index for financial date range queries
CREATE INDEX IF NOT EXISTS idx_orders_created_at_total_cents ON orders(created_at, total_cents) WHERE status = 'completed';

-- ===================================================================
-- CLEANUP AND OPTIMIZATION
-- ===================================================================

-- Update table statistics
ANALYZE;

-- Rebuild indexes for optimal performance
REINDEX;