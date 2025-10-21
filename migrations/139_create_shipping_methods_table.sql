-- Create shipping_methods table for shipping configuration

CREATE TABLE IF NOT EXISTS shipping_methods (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  description TEXT,
  carrier TEXT NOT NULL, -- e.g., 'ghtk', 'ghn', 'vnpost'
  service_type TEXT, -- e.g., 'road', 'air', 'express'
  is_active INTEGER DEFAULT 1,
  fee_calculation TEXT, -- JSON config for fee calculation
  settings TEXT, -- JSON config for carrier-specific settings
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_shipping_methods_tenant ON shipping_methods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shipping_methods_carrier ON shipping_methods(carrier);

-- Create shipping_tracking table for tracking events
CREATE TABLE IF NOT EXISTS shipping_tracking (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  tracking_number TEXT NOT NULL,
  carrier TEXT NOT NULL,
  status TEXT,
  location TEXT,
  description TEXT,
  event_time TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_shipping_tracking_number ON shipping_tracking(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipping_tracking_tenant ON shipping_tracking(tenant_id);

-- Create ghtk_provinces table for GHTK geo data
CREATE TABLE IF NOT EXISTS ghtk_provinces (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  region TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Create ghtk_districts table for GHTK geo data
CREATE TABLE IF NOT EXISTS ghtk_districts (
  code TEXT PRIMARY KEY,
  province_code TEXT NOT NULL,
  name TEXT NOT NULL,
  name_en TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (province_code) REFERENCES ghtk_provinces(code)
);

CREATE INDEX IF NOT EXISTS idx_ghtk_districts_province ON ghtk_districts(province_code);

-- Insert default shipping methods
INSERT OR IGNORE INTO shipping_methods (tenant_id, name, description, carrier, service_type, is_active) VALUES
('default', 'GHTK - Đường bộ', 'Giao hàng tiết kiệm bằng đường bộ', 'ghtk', 'road', 1),
('default', 'GHTK - Nhanh', 'Giao hàng nhanh', 'ghtk', 'express', 1),
('default', 'GHN - Tiêu chuẩn', 'Giao hàng nhanh tiêu chuẩn', 'ghn', 'standard', 1),
('default', 'VNPost - Bưu điện', 'Dịch vụ bưu điện Việt Nam', 'vnpost', 'standard', 1);
