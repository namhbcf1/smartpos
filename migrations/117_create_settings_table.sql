-- Migration: Create settings table for storing application settings
-- Created: 2025-01-05

-- Check if table exists before creating
DROP TABLE IF EXISTS settings;

-- Create settings table
CREATE TABLE settings (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  category TEXT DEFAULT 'general',
  description TEXT,
  tenant_id TEXT DEFAULT 'default',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Create indexes for faster lookups
CREATE INDEX idx_settings_key ON settings(key);
CREATE INDEX idx_settings_category ON settings(category);
CREATE INDEX idx_settings_tenant ON settings(tenant_id);

-- Insert default store settings
INSERT INTO settings (id, key, value, category, description, tenant_id) VALUES
  ('setting_001', 'store_name', 'SMART POS SYSTEM', 'store', 'Tên cửa hàng/công ty', 'default'),
  ('setting_002', 'store_address', '123 Đường ABC, Quận 1, TP.HCM', 'store', 'Địa chỉ cửa hàng', 'default'),
  ('setting_003', 'store_phone', '0901 234 567', 'store', 'Số điện thoại', 'default'),
  ('setting_004', 'store_email', 'info@smartpos.vn', 'store', 'Email liên hệ', 'default'),
  ('setting_005', 'store_tax_number', '', 'store', 'Mã số thuế', 'default'),
  ('setting_006', 'store_business_license', '', 'store', 'Giấy phép kinh doanh', 'default'),
  ('setting_007', 'store_logo_url', '', 'store', 'URL logo công ty', 'default'),
  ('setting_008', 'store_timezone', 'Asia/Ho_Chi_Minh', 'store', 'Múi giờ', 'default'),
  ('setting_009', 'store_currency', 'VND', 'store', 'Đơn vị tiền tệ', 'default');
