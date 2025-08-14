-- ============================================================================
-- SMARTPOS PERFORMANCE OPTIMIZATION - DATABASE INDEXES
-- ============================================================================
-- This script adds critical database indexes to improve query performance
-- Run this after the main schema is deployed
-- 
-- PERFORMANCE IMPACT:
-- - Faster product searches and filtering
-- - Improved sales reporting queries
-- - Better user authentication performance
-- - Optimized inventory tracking
-- ============================================================================

-- Enable query planning for better optimization
PRAGMA optimize;

-- ============================================================================
-- CRITICAL PERFORMANCE INDEXES
-- ============================================================================

-- Users table indexes (Authentication & Authorization)
CREATE INDEX IF NOT EXISTS idx_users_username_active ON users(username, is_active);
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, is_active) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role_store ON users(role, store_id);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login DESC);
CREATE INDEX IF NOT EXISTS idx_users_login_attempts ON users(login_attempts) WHERE login_attempts > 0;

-- Products table indexes (Catalog & Inventory)
CREATE INDEX IF NOT EXISTS idx_products_name_active ON products(name, is_active);
CREATE INDEX IF NOT EXISTS idx_products_sku_active ON products(sku, is_active);
CREATE INDEX IF NOT EXISTS idx_products_barcode_active ON products(barcode, is_active) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_category_status ON products(category_id, status, is_active);
CREATE INDEX IF NOT EXISTS idx_products_supplier_active ON products(supplier_id, is_active) WHERE supplier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_price_range ON products(price, is_active);
CREATE INDEX IF NOT EXISTS idx_products_stock_alert ON products(stock_quantity, stock_alert_threshold, is_active);
CREATE INDEX IF NOT EXISTS idx_products_brand_model ON products(brand, model) WHERE brand IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_created_date ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_updated_date ON products(updated_at DESC);

-- Categories table indexes
CREATE INDEX IF NOT EXISTS idx_categories_parent_active ON categories(parent_id, is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_active ON categories(sort_order, is_active);
CREATE INDEX IF NOT EXISTS idx_categories_name_active ON categories(name, is_active);

-- Sales table indexes (Reporting & Analytics)
CREATE INDEX IF NOT EXISTS idx_sales_number_unique ON sales(sale_number);
CREATE INDEX IF NOT EXISTS idx_sales_customer_date ON sales(customer_id, created_at DESC) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sales_user_date ON sales(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_store_date ON sales(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_status_date ON sales(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(payment_method, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_total_amount ON sales(total_amount DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_date_range ON sales(created_at DESC);

-- Sale items table indexes
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_product ON sale_items(sale_id, product_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_date ON sale_items(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sale_items_quantity ON sale_items(quantity DESC);
CREATE INDEX IF NOT EXISTS idx_sale_items_total ON sale_items(total_amount DESC);

-- Customers table indexes (CRM)
CREATE INDEX IF NOT EXISTS idx_customers_name_active ON customers(name, is_active);
CREATE INDEX IF NOT EXISTS idx_customers_email_active ON customers(email, is_active) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_phone_active ON customers(phone, is_active) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_type_active ON customers(customer_type, is_active);
CREATE INDEX IF NOT EXISTS idx_customers_loyalty_points ON customers(loyalty_points DESC, is_active);
CREATE INDEX IF NOT EXISTS idx_customers_total_spent ON customers(total_spent DESC, is_active);
CREATE INDEX IF NOT EXISTS idx_customers_created_date ON customers(created_at DESC);

-- Suppliers table indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_name_active ON suppliers(name, is_active);
CREATE INDEX IF NOT EXISTS idx_suppliers_email_active ON suppliers(email, is_active) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_suppliers_phone_active ON suppliers(phone, is_active) WHERE phone IS NOT NULL;

-- Stores table indexes
CREATE INDEX IF NOT EXISTS idx_stores_name_active ON stores(name, is_active);
CREATE INDEX IF NOT EXISTS idx_stores_main_active ON stores(is_main, is_active);

-- ============================================================================
-- ADVANCED FEATURE INDEXES (if tables exist)
-- ============================================================================

-- Serial numbers table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_serial_numbers_number ON serial_numbers(serial_number);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_product_status ON serial_numbers(product_id, status);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_status_date ON serial_numbers(status, created_at DESC);

-- Warranty claims table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_warranty_claims_product ON warranty_claims(product_id);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_customer ON warranty_claims(customer_id);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_status_date ON warranty_claims(status, created_at DESC);

-- Inventory movements table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_date ON inventory_movements(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type_date ON inventory_movements(movement_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_user_date ON inventory_movements(user_id, created_at DESC);

-- Employees table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_employees_name_active ON employees(name, status);
CREATE INDEX IF NOT EXISTS idx_employees_email_active ON employees(email, status) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department, status);

-- Returns table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_returns_sale_date ON returns(sale_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_returns_customer_date ON returns(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_returns_status_date ON returns(status, created_at DESC);

-- ============================================================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ============================================================================

-- Product search and filtering
CREATE INDEX IF NOT EXISTS idx_products_search ON products(name, category_id, is_active, status);
CREATE INDEX IF NOT EXISTS idx_products_inventory ON products(stock_quantity, stock_alert_threshold, is_active);
CREATE INDEX IF NOT EXISTS idx_products_pricing ON products(price, cost_price, is_active);

-- Sales analytics
CREATE INDEX IF NOT EXISTS idx_sales_analytics ON sales(created_at DESC, status, total_amount);
CREATE INDEX IF NOT EXISTS idx_sales_store_analytics ON sales(store_id, created_at DESC, status);
CREATE INDEX IF NOT EXISTS idx_sales_user_analytics ON sales(user_id, created_at DESC, total_amount);

-- Customer analytics
CREATE INDEX IF NOT EXISTS idx_customers_analytics ON customers(customer_type, total_spent DESC, is_active);
CREATE INDEX IF NOT EXISTS idx_customers_loyalty ON customers(loyalty_points DESC, customer_type, is_active);

-- ============================================================================
-- FULL-TEXT SEARCH INDEXES (SQLite FTS5)
-- ============================================================================

-- Product search index
CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
  name, 
  description, 
  brand, 
  model, 
  tags,
  content='products',
  content_rowid='id'
);

-- Populate FTS index
INSERT OR REPLACE INTO products_fts(rowid, name, description, brand, model, tags)
SELECT id, name, description, brand, model, tags FROM products WHERE is_active = 1;

-- Customer search index
CREATE VIRTUAL TABLE IF NOT EXISTS customers_fts USING fts5(
  name,
  email,
  phone,
  address,
  content='customers',
  content_rowid='id'
);

-- Populate customer FTS index
INSERT OR REPLACE INTO customers_fts(rowid, name, email, phone, address)
SELECT id, name, email, phone, address FROM customers WHERE is_active = 1;

-- ============================================================================
-- MAINTENANCE COMMANDS
-- ============================================================================

-- Update statistics for query optimizer
ANALYZE;

-- Optimize database
PRAGMA optimize;

-- Vacuum to reclaim space (run periodically)
-- VACUUM;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check index usage (run these to verify indexes are being used)
-- EXPLAIN QUERY PLAN SELECT * FROM products WHERE category_id = 1 AND is_active = 1;
-- EXPLAIN QUERY PLAN SELECT * FROM sales WHERE created_at >= date('now', '-30 days');
-- EXPLAIN QUERY PLAN SELECT * FROM customers WHERE name LIKE 'John%' AND is_active = 1;

-- ============================================================================
-- PERFORMANCE MONITORING
-- ============================================================================

-- Create performance monitoring table
CREATE TABLE IF NOT EXISTS query_performance_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query_type TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  rows_affected INTEGER,
  created_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Index for performance monitoring
CREATE INDEX IF NOT EXISTS idx_query_performance_type_date ON query_performance_log(query_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_performance_time ON query_performance_log(execution_time_ms DESC);

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

-- Log successful index creation
INSERT OR IGNORE INTO schema_migrations (id, name, version, execution_time_ms, checksum)
VALUES ('performance_indexes_v1', 'Performance optimization indexes', 2, 0, 'performance_indexes_checksum_v1');
