-- Migration: Add performance indexes for customers table
-- This improves query performance for common customer operations
-- SQLite compatible version

-- Index for phone number lookups (used in search and GHTK orders)
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Index for email lookups (used in search and authentication)
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Index for customer type filtering (VIP, Premium, Regular)
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(customer_type);

-- Index for date-based queries (recency analysis, birthday campaigns)
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- Index for last visit tracking (customer activity analysis)
CREATE INDEX IF NOT EXISTS idx_customers_last_visit ON customers(last_visit);

-- Index for active status filtering
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);

-- Composite index for tenant + active customers (multi-tenant support)
CREATE INDEX IF NOT EXISTS idx_customers_tenant_active ON customers(tenant_id, is_active);

-- Index for loyalty points sorting
CREATE INDEX IF NOT EXISTS idx_customers_loyalty_points ON customers(loyalty_points DESC);

-- Composite index for total spent (for VIP/Premium segmentation)
CREATE INDEX IF NOT EXISTS idx_customers_total_spent ON customers(total_spent_cents DESC);

-- Composite index for total orders (for frequency analysis)
CREATE INDEX IF NOT EXISTS idx_customers_total_orders ON customers(total_orders DESC);

-- Index for date of birth (birthday campaigns)
CREATE INDEX IF NOT EXISTS idx_customers_dob ON customers(date_of_birth);
