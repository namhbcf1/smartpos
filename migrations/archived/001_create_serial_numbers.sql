-- Migration: Create serial_numbers table
-- Purpose: Track individual product serial numbers for warranty and inventory management
-- Date: 2025-10-03

CREATE TABLE IF NOT EXISTS serial_numbers (
  -- Primary key
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT DEFAULT 'default',

  -- Serial number info
  serial_number TEXT UNIQUE NOT NULL,
  product_id TEXT NOT NULL,

  -- Order linkage
  order_id TEXT,
  order_item_id TEXT,

  -- Status tracking
  status TEXT DEFAULT 'in_stock', -- in_stock, sold, warranty, returned, scrapped

  -- Sales info
  sold_at TEXT,
  sold_to_customer_id TEXT,
  sold_price_cents INTEGER,
  sold_by_user_id TEXT,

  -- Manufacturing & import
  manufacturing_date TEXT,
  import_date TEXT,
  import_batch TEXT,

  -- Additional metadata
  notes TEXT,
  warehouse_id TEXT,
  location TEXT,

  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  -- Foreign keys
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  FOREIGN KEY (sold_to_customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (sold_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_serial_numbers_serial ON serial_numbers(serial_number);
CREATE INDEX idx_serial_numbers_product ON serial_numbers(product_id, tenant_id);
CREATE INDEX idx_serial_numbers_order ON serial_numbers(order_id);
CREATE INDEX idx_serial_numbers_customer ON serial_numbers(sold_to_customer_id);
CREATE INDEX idx_serial_numbers_status ON serial_numbers(status, tenant_id);
CREATE INDEX idx_serial_numbers_tenant ON serial_numbers(tenant_id);

-- Trigger to update updated_at
CREATE TRIGGER IF NOT EXISTS update_serial_numbers_timestamp
AFTER UPDATE ON serial_numbers
BEGIN
  UPDATE serial_numbers SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Comment
-- This table enables tracking of individual serialized products from purchase to sale to warranty
