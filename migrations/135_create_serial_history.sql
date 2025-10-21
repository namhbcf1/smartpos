-- Serial number history and indexes
CREATE TABLE IF NOT EXISTS serial_number_history (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  serial_id TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  event_type TEXT NOT NULL, -- created, updated, sold, warranty, returned, moved
  event_data TEXT DEFAULT '{}',
  reference_id TEXT, -- order_id, warranty_id, movement_id
  reference_type TEXT, -- order, warranty, inventory_movement
  created_at TEXT NOT NULL DEFAULT datetime('now')
);

CREATE INDEX IF NOT EXISTS idx_snh_serial ON serial_number_history(serial_id);
CREATE INDEX IF NOT EXISTS idx_snh_tenant ON serial_number_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_snh_event ON serial_number_history(event_type);
