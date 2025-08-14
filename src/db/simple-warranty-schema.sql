-- Simple Warranty Schema for SmartPOS
-- Creates basic warranty tables

-- Serial Numbers table
CREATE TABLE IF NOT EXISTS serial_numbers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  serial_number TEXT NOT NULL UNIQUE,
  product_id INTEGER NOT NULL,
  sale_id INTEGER,
  status TEXT NOT NULL DEFAULT 'available',
  warranty_start_date TEXT,
  warranty_end_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (sale_id) REFERENCES sales(id)
);

-- Warranty Registrations table
CREATE TABLE IF NOT EXISTS warranty_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  warranty_number TEXT NOT NULL UNIQUE,
  serial_number_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  customer_id INTEGER,
  sale_id INTEGER,
  warranty_type TEXT NOT NULL DEFAULT 'manufacturer',
  warranty_period_months INTEGER NOT NULL DEFAULT 12,
  warranty_start_date TEXT NOT NULL,
  warranty_end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  terms_accepted INTEGER NOT NULL DEFAULT 0,
  terms_accepted_date TEXT,
  terms_version TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  contact_address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (serial_number_id) REFERENCES serial_numbers(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (sale_id) REFERENCES sales(id)
);

-- Insert sample serial numbers
INSERT OR IGNORE INTO serial_numbers (id, serial_number, product_id, sale_id, status, warranty_start_date, warranty_end_date, created_by) VALUES
(1, 'SN001-CPU-I5-13400F', 1, 1, 'sold', datetime('now', '-7 days'), datetime('now', '+358 days'), 1),
(2, 'SN002-RAM-KF-16GB', 2, 3, 'sold', datetime('now', '-3 days'), datetime('now', '+362 days'), 1),
(3, 'SN003-SSD-SS-980', 3, 4, 'sold', datetime('now', '-2 days'), datetime('now', '+363 days'), 1),
(4, 'SN004-VGA-RTX-4060TI', 4, 2, 'sold', datetime('now', '-5 days'), datetime('now', '+360 days'), 1),
(5, 'SN005-MB-ASUS-B550M', 5, 5, 'sold', datetime('now', '-1 days'), datetime('now', '+364 days'), 1),
(6, 'SN006-CPU-R7-7800X3D', 6, NULL, 'available', NULL, NULL, 1),
(7, 'SN007-PSU-CORSAIR-RM750X', 7, NULL, 'available', NULL, NULL, 1),
(8, 'SN008-TEST-PRODUCT', 8, NULL, 'available', NULL, NULL, 1);

-- Insert sample warranty registrations
INSERT OR IGNORE INTO warranty_registrations (id, warranty_number, serial_number_id, product_id, customer_id, sale_id, warranty_type, warranty_period_months, warranty_start_date, warranty_end_date, status, terms_accepted, contact_phone, contact_email, contact_address, created_by) VALUES
(1, 'WR20250104-001', 1, 1, 1, 1, 'manufacturer', 12, datetime('now', '-7 days'), datetime('now', '+358 days'), 'active', 1, '0901234567', 'nguyenvananh@gmail.com', '123 Nguyễn Huệ, Q1, TP.HCM', 1),
(2, 'WR20250104-002', 2, 2, 3, 3, 'manufacturer', 12, datetime('now', '-3 days'), datetime('now', '+362 days'), 'active', 1, '0923456789', 'leminhcuong@outlook.com', '789 Hai Bà Trưng, Q1, TP.HCM', 1),
(3, 'WR20250104-003', 3, 3, 4, 4, 'manufacturer', 12, datetime('now', '-2 days'), datetime('now', '+363 days'), 'active', 1, '0934567890', 'phamthidung@gmail.com', '321 Võ Văn Tần, Q3, TP.HCM', 1),
(4, 'WR20250104-004', 4, 4, 2, 2, 'extended', 24, datetime('now', '-5 days'), datetime('now', '+725 days'), 'active', 1, '0912345678', 'tranthibinh@yahoo.com', '456 Lê Lợi, Q3, TP.HCM', 1),
(5, 'WR20250104-005', 5, 5, 5, 5, 'manufacturer', 12, datetime('now', '-1 days'), datetime('now', '+364 days'), 'active', 1, '0945678901', 'hoangvanem@gmail.com', '654 Nguyễn Thị Minh Khai, Q1, TP.HCM', 1);

-- Insert sample warranty claims (update existing table)
INSERT OR IGNORE INTO warranty_claims (id, claim_number, warranty_registration_id, customer_id, claim_type, reported_issue, status, priority, estimated_cost, actual_cost, reported_date, created_by) VALUES
(1, 'WC20250104-001', 1, 1, 'repair', 'CPU chạy quá nóng, nhiệt độ lên tới 85°C khi chơi game', 'in_progress', 'high', 500000, 0, datetime('now', '-2 days'), 1),
(2, 'WC20250104-002', 4, 2, 'replacement', 'VGA bị lỗi màn hình xanh khi chạy game nặng', 'submitted', 'urgent', 12990000, 0, datetime('now', '-1 days'), 1);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_warranty_registrations_status ON warranty_registrations(status);
CREATE INDEX IF NOT EXISTS idx_warranty_registrations_end_date ON warranty_registrations(warranty_end_date);
CREATE INDEX IF NOT EXISTS idx_warranty_registrations_customer ON warranty_registrations(customer_id);
CREATE INDEX IF NOT EXISTS idx_warranty_registrations_product ON warranty_registrations(product_id);

CREATE INDEX IF NOT EXISTS idx_serial_numbers_status ON serial_numbers(status);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_product ON serial_numbers(product_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_serial ON serial_numbers(serial_number);

-- Verify data
SELECT 'Warranty Registrations: ' || COUNT(*) FROM warranty_registrations;
SELECT 'Serial Numbers: ' || COUNT(*) FROM serial_numbers;
SELECT 'Warranty Claims: ' || COUNT(*) FROM warranty_claims;
