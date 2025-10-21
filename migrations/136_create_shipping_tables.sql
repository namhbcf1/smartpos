-- Create shipping_orders and shipping_events tables for carrier integrations (e.g., GHTK)

CREATE TABLE IF NOT EXISTS shipping_orders (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  order_id TEXT, -- reference to orders.id
  carrier TEXT NOT NULL, -- e.g., 'ghtk'
  carrier_order_code TEXT, -- e.g., GHTK order_code
  status TEXT, -- carrier status
  fee_amount REAL, -- shipping fee if available
  service TEXT, -- service type/method
  payload TEXT, -- JSON request payload
  response TEXT, -- JSON last response
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_shipping_orders_order ON shipping_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_orders_carrier_code ON shipping_orders(carrier, carrier_order_code);

CREATE TABLE IF NOT EXISTS shipping_events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  shipping_order_id TEXT, -- reference to shipping_orders.id
  carrier TEXT NOT NULL,
  carrier_order_code TEXT,
  event_type TEXT,
  event_time TEXT,
  raw_event TEXT, -- JSON
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_shipping_events_order_code ON shipping_events(carrier, carrier_order_code);
CREATE INDEX IF NOT EXISTS idx_shipping_events_shipping_order ON shipping_events(shipping_order_id);


