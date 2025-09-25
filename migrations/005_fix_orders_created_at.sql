-- Fix orders table to ensure created_at column exists
-- This migration adds created_at column if it doesn't exist

-- Check if created_at column exists, if not add it
-- Note: SQLite doesn't support IF NOT EXISTS for columns, so we use a different approach

-- First, let's ensure the orders table has the correct structure
CREATE TABLE IF NOT EXISTS orders_new (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    customer_id TEXT,
    user_id TEXT NOT NULL,
    store_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'completed', 'cancelled', 'refunded')),
    subtotal_cents INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0),
    discount_cents INTEGER DEFAULT 0 CHECK (discount_cents >= 0),
    tax_cents INTEGER DEFAULT 0 CHECK (tax_cents >= 0),
    total_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
    notes TEXT,
    receipt_printed INTEGER DEFAULT 0 CHECK (receipt_printed IN (0, 1)),
    customer_name TEXT,
    customer_phone TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Copy data from old table if it exists
INSERT OR IGNORE INTO orders_new 
SELECT 
    id,
    order_number,
    customer_id,
    user_id,
    store_id,
    status,
    subtotal_cents,
    discount_cents,
    tax_cents,
    total_cents,
    notes,
    receipt_printed,
    customer_name,
    customer_phone,
    COALESCE(created_at, datetime('now')) as created_at,
    COALESCE(updated_at, datetime('now')) as updated_at
FROM orders;

-- Drop old table and rename new one
DROP TABLE IF EXISTS orders;
ALTER TABLE orders_new RENAME TO orders;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
