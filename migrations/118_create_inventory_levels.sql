-- Create inventory_levels table for stock tracking
CREATE TABLE IF NOT EXISTS inventory_levels (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
  tenant_id TEXT DEFAULT 'default',
  warehouse_id TEXT,
  created_at TEXT DEFAULT datetime('now'),
  updated_at TEXT DEFAULT datetime('now')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_levels_product ON inventory_levels(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_levels_variant ON inventory_levels(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_levels_tenant ON inventory_levels(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_levels_warehouse ON inventory_levels(warehouse_id);