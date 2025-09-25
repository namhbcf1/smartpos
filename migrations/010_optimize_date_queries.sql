-- ===================================================================
-- OPTIMIZE DATE RANGE QUERIES
-- Version: 010
-- Date: 2025-09-22
-- Description: Add indexes to support optimized date range queries
-- ===================================================================

PRAGMA foreign_keys = ON;

-- ===================================================================
-- PERFORMANCE INDEXES FOR DATE RANGE QUERIES
-- ===================================================================

-- Orders table - primary date filtering indexes
CREATE INDEX IF NOT EXISTS idx_orders_created_at_status_perf ON orders(created_at, status);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at_perf ON orders(status, created_at);

-- pos_orders table (if still exists) - for POS queries
CREATE INDEX IF NOT EXISTS idx_pos_orders_created_at_status ON pos_orders(created_at, status);
CREATE INDEX IF NOT EXISTS idx_pos_orders_created_by_created_at ON pos_orders(created_by, created_at);

-- Customers table - for acquisition trend reports
CREATE INDEX IF NOT EXISTS idx_customers_created_at_perf ON customers(created_at);

-- Products table - for inventory and product analytics
CREATE INDEX IF NOT EXISTS idx_products_created_at_perf ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_updated_at_perf ON products(updated_at);

-- ===================================================================
-- COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- ===================================================================

-- Revenue by date range for completed orders
CREATE INDEX IF NOT EXISTS idx_orders_completed_created_at_total ON orders(created_at, total_cents)
WHERE status = 'completed';

-- Customer acquisition analytics
CREATE INDEX IF NOT EXISTS idx_customers_created_at_active ON customers(created_at, is_active)
WHERE is_active = 1;

-- Daily sales performance
CREATE INDEX IF NOT EXISTS idx_orders_daily_sales ON orders(created_at, status, total_cents);

-- POS daily performance (if pos_orders table exists)
CREATE INDEX IF NOT EXISTS idx_pos_orders_daily_perf ON pos_orders(created_at, status, total)
WHERE status = 'completed';

-- ===================================================================
-- VERIFICATION QUERIES (for manual testing)
-- ===================================================================

-- Test date range performance:
-- EXPLAIN QUERY PLAN SELECT COUNT(*), SUM(total_cents) FROM orders
-- WHERE created_at >= '2024-01-01 00:00:00' AND created_at <= '2024-01-31 23:59:59' AND status = 'completed';

-- EXPLAIN QUERY PLAN SELECT DATE(created_at) as date, COUNT(*), SUM(total_cents) FROM orders
-- WHERE created_at >= '2024-01-01 00:00:00' AND created_at <= '2024-12-31 23:59:59'
-- GROUP BY DATE(created_at) ORDER BY date;

-- ===================================================================
-- SCHEMA VERSION TRACKING
-- ===================================================================

INSERT OR REPLACE INTO schema_migrations (version, applied_at, description)
VALUES (
    '010',
    datetime('now'),
    'Optimized date range queries with proper indexes for production performance'
);

-- ===================================================================
-- PERFORMANCE ANALYSIS
-- ===================================================================

-- Update table statistics for optimal query planning
ANALYZE orders;
ANALYZE customers;
ANALYZE products;

-- Update statistics for pos_orders if it exists
ANALYZE pos_orders;