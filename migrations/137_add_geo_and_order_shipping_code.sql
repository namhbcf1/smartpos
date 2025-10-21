-- Add GHTK geographic reference tables and optional shipping_order_code to orders

CREATE TABLE IF NOT EXISTS ghtk_provinces (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  region TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ghtk_districts (
  code TEXT PRIMARY KEY,
  province_code TEXT NOT NULL,
  name TEXT NOT NULL,
  name_en TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (province_code) REFERENCES ghtk_provinces(code)
);

CREATE INDEX IF NOT EXISTS idx_ghtk_districts_province ON ghtk_districts(province_code);

-- Optional fast lookup for linked shipping code on orders
ALTER TABLE orders ADD COLUMN shipping_order_code TEXT;


