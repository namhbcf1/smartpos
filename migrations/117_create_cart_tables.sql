-- Create cart_items table for POS system
CREATE TABLE IF NOT EXISTS cart_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT DEFAULT 'default',
  product_id TEXT NOT NULL,
  variant_id TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  discount_percent REAL DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT datetime('now'),
  updated_at TEXT DEFAULT datetime('now')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cart_items_user_tenant ON cart_items(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_status ON cart_items(status);
CREATE INDEX IF NOT EXISTS idx_cart_items_product ON cart_items(product_id);

-- Create cart_sessions table for tracking cart state
CREATE TABLE IF NOT EXISTS cart_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT DEFAULT 'default',
  session_data TEXT, -- JSON data for cart state
  expires_at TEXT,
  created_at TEXT DEFAULT datetime('now'),
  updated_at TEXT DEFAULT datetime('now')
);

CREATE INDEX IF NOT EXISTS idx_cart_sessions_user_tenant ON cart_sessions(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_cart_sessions_expires ON cart_sessions(expires_at);