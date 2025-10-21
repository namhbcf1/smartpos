-- POS Tables Migration
-- Based on POSService.ts requirements

-- POS orders table
CREATE TABLE IF NOT EXISTS pos_orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    customer_id TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    subtotal REAL NOT NULL DEFAULT 0,
    discount REAL NOT NULL DEFAULT 0,
    tax REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    payment_status TEXT NOT NULL DEFAULT 'pending',
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- POS order items table
CREATE TABLE IF NOT EXISTS pos_order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT,
    product_name TEXT NOT NULL,
    sku TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL DEFAULT 0,
    total_price REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- POS payments table
CREATE TABLE IF NOT EXISTS pos_payments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    payment_method TEXT NOT NULL,
    amount REAL NOT NULL,
    transaction_id TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pos_orders_tenant ON pos_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pos_orders_customer ON pos_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_pos_orders_status ON pos_orders(status);
CREATE INDEX IF NOT EXISTS idx_pos_orders_created ON pos_orders(created_at);

CREATE INDEX IF NOT EXISTS idx_pos_order_items_order ON pos_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_pos_order_items_product ON pos_order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_pos_payments_order ON pos_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_pos_payments_tenant ON pos_payments(tenant_id);