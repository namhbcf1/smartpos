-- ===================================================================
-- ORDERS SYSTEM CONSOLIDATION
-- Version: 007
-- Date: 2025-09-22
-- Description: Consolidate pos_orders into unified orders system
-- ===================================================================

-- Enable optimizations
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;

-- ===================================================================
-- DATA MIGRATION: pos_orders -> orders
-- ===================================================================

-- Step 1: Migrate pos_orders data to orders table (if pos_orders exists)
INSERT OR IGNORE INTO orders (
  id,
  order_number,
  customer_id,
  customer_name,
  customer_phone,
  user_id,
  store_id,
  status,
  subtotal_cents,
  discount_cents,
  tax_cents,
  total_cents,
  payment_method,
  payment_status,
  notes,
  created_at,
  updated_at
)
SELECT
  'migrated_' || id as id,  -- Prefix to avoid conflicts
  order_number,
  customer_id,
  customer_name,
  customer_phone,
  user_id,
  COALESCE(store_id, 'store-1') as store_id,
  CASE
    WHEN status = 'completed' THEN 'completed'
    WHEN status = 'cancelled' THEN 'cancelled'
    WHEN status = 'pending' THEN 'pending'
    ELSE 'pending'
  END as status,
  CAST(COALESCE(subtotal, 0) * 100 AS INTEGER) as subtotal_cents,
  CAST(COALESCE(discount, 0) * 100 AS INTEGER) as discount_cents,
  CAST(COALESCE(tax, 0) * 100 AS INTEGER) as tax_cents,
  CAST(COALESCE(total, 0) * 100 AS INTEGER) as total_cents,
  COALESCE(payment_method, 'cash') as payment_method,
  CASE
    WHEN payment_status = 'completed' THEN 'completed'
    WHEN payment_status = 'failed' THEN 'failed'
    ELSE 'pending'
  END as payment_status,
  notes,
  created_at,
  COALESCE(updated_at, created_at) as updated_at
FROM pos_orders
WHERE EXISTS (
  SELECT 1 FROM sqlite_master
  WHERE type='table' AND name='pos_orders'
);

-- Step 2: Migrate pos_order_items to order_items (if pos_order_items exists)
INSERT OR IGNORE INTO order_items (
  id,
  order_id,
  product_id,
  quantity,
  unit_price_cents,
  total_price_cents,
  discount_cents,
  product_name,
  product_sku,
  created_at
)
SELECT
  'migrated_' || id as id,
  'migrated_' || order_id as order_id,  -- Match migrated order IDs
  product_id,
  quantity,
  CAST(COALESCE(unit_price, 0) * 100 AS INTEGER) as unit_price_cents,
  CAST(COALESCE(total_price, 0) * 100 AS INTEGER) as total_price_cents,
  CAST(COALESCE(discount, 0) * 100 AS INTEGER) as discount_cents,
  product_name,
  sku as product_sku,
  created_at
FROM pos_order_items
WHERE EXISTS (
  SELECT 1 FROM sqlite_master
  WHERE type='table' AND name='pos_order_items'
)
AND order_id IN (
  SELECT id FROM pos_orders
  WHERE EXISTS (
    SELECT 1 FROM sqlite_master
    WHERE type='table' AND name='pos_orders'
  )
);

-- ===================================================================
-- CLEANUP: Archive old tables (Comment out to keep for safety)
-- ===================================================================

-- Create backup tables before dropping (optional)
CREATE TABLE IF NOT EXISTS pos_orders_backup AS
SELECT * FROM pos_orders
WHERE EXISTS (
  SELECT 1 FROM sqlite_master
  WHERE type='table' AND name='pos_orders'
);

CREATE TABLE IF NOT EXISTS pos_order_items_backup AS
SELECT * FROM pos_order_items
WHERE EXISTS (
  SELECT 1 FROM sqlite_master
  WHERE type='table' AND name='pos_order_items'
);

-- ===================================================================
-- VERIFICATION QUERIES
-- ===================================================================

-- Log migration statistics
-- Note: These are for verification, not actual execution

-- Count migrated records
-- SELECT 'Orders migrated:', COUNT(*) FROM orders WHERE id LIKE 'migrated_%';
-- SELECT 'Order items migrated:', COUNT(*) FROM order_items WHERE id LIKE 'migrated_%';

-- Verify data integrity
-- SELECT 'Original pos_orders count:', COUNT(*) FROM pos_orders WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='pos_orders');
-- SELECT 'Original pos_order_items count:', COUNT(*) FROM pos_order_items WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='pos_order_items');

-- ===================================================================
-- POST-MIGRATION OPTIMIZATIONS
-- ===================================================================

-- Ensure all indexes exist on unified orders table
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- ===================================================================
-- UPDATE APPLICATIONS TO USE UNIFIED SYSTEM
-- ===================================================================

-- Note: After this migration:
-- 1. All new orders should go to 'orders' table
-- 2. All queries should use 'orders' and 'order_items' tables
-- 3. Remove references to pos_orders/pos_order_items in code
-- 4. Consider dropping old tables after verification

-- ===================================================================
-- OPTIONAL: DROP OLD TABLES (Uncomment after verification)
-- ===================================================================

-- After verifying migration success, uncomment these lines:
-- DROP TABLE IF EXISTS pos_orders;
-- DROP TABLE IF EXISTS pos_order_items;

-- ===================================================================
-- MIGRATION COMPLETION LOG
-- ===================================================================

INSERT OR IGNORE INTO schema_migrations (version, applied_at, description)
VALUES (
  '007',
  datetime('now'),
  'Consolidated pos_orders system into unified orders system'
);