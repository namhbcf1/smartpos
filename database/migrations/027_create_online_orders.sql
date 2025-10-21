-- Migration 027: Create online_orders and online_order_items tables
-- Created: 2025-09-30

-- Create online_orders table
CREATE TABLE IF NOT EXISTS online_orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  order_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT CHECK(payment_method IN ('online_banking', 'credit_card', 'e_wallet', 'cod')),
  total_amount REAL NOT NULL DEFAULT 0,
  shipping_fee REAL NOT NULL DEFAULT 0,
  discount_amount REAL NOT NULL DEFAULT 0,
  tax_amount REAL NOT NULL DEFAULT 0,
  items_json TEXT,
  shipping_address TEXT NOT NULL,
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'website' CHECK(source IN ('website', 'app', 'social_media', 'marketplace')),
  tracking_number TEXT,
  estimated_delivery TEXT,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
  tags TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at TEXT,
  shipped_at TEXT,
  delivered_at TEXT,
  deleted_at TEXT,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  store_id TEXT NOT NULL DEFAULT 'default',
  created_by TEXT,
  assigned_to TEXT,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Create online_order_items table
CREATE TABLE IF NOT EXISTS online_order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  variant_id TEXT,
  variant_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  total_price REAL NOT NULL DEFAULT 0,
  discount_amount REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  FOREIGN KEY (order_id) REFERENCES online_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- Create indexes for online_orders
CREATE INDEX IF NOT EXISTS idx_online_orders_order_number ON online_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_online_orders_customer_id ON online_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_online_orders_status ON online_orders(status);
CREATE INDEX IF NOT EXISTS idx_online_orders_payment_status ON online_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_online_orders_payment_method ON online_orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_online_orders_source ON online_orders(source);
CREATE INDEX IF NOT EXISTS idx_online_orders_priority ON online_orders(priority);
CREATE INDEX IF NOT EXISTS idx_online_orders_created_at ON online_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_online_orders_tenant_store ON online_orders(tenant_id, store_id);
CREATE INDEX IF NOT EXISTS idx_online_orders_assigned_to ON online_orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_online_orders_deleted_at ON online_orders(deleted_at);
CREATE INDEX IF NOT EXISTS idx_online_orders_customer_name ON online_orders(customer_name);
CREATE INDEX IF NOT EXISTS idx_online_orders_customer_email ON online_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_online_orders_customer_phone ON online_orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_online_orders_status_created ON online_orders(status, created_at);

-- Create indexes for online_order_items
CREATE INDEX IF NOT EXISTS idx_online_order_items_order_id ON online_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_online_order_items_product_id ON online_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_online_order_items_deleted_at ON online_order_items(deleted_at);

-- Inserted migration: 027_create_online_orders.sql
