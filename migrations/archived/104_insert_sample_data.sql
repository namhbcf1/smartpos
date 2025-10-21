-- ============================================================================
-- Migration 104: Insert sample data for testing
-- Adds sample products, categories, and customers
-- ============================================================================

-- Insert sample categories
INSERT OR IGNORE INTO categories (id, name, description, is_active, tenant_id, created_at, updated_at) VALUES
('cat_001', 'Điện thoại', 'Điện thoại di động và smartphone', 1, 'default', datetime('now'), datetime('now')),
('cat_002', 'Laptop', 'Máy tính xách tay', 1, 'default', datetime('now'), datetime('now')),
('cat_003', 'Tablet', 'Máy tính bảng', 1, 'default', datetime('now'), datetime('now')),
('cat_004', 'Phụ kiện', 'Phụ kiện điện thoại, laptop', 1, 'default', datetime('now'), datetime('now')),
('cat_005', 'Tai nghe', 'Tai nghe có dây và không dây', 1, 'default', datetime('now'), datetime('now'));

-- Insert sample products with price_cents (INTEGER)
INSERT OR IGNORE INTO products (
  id, name, sku, barcode, description,
  price_cents, cost_price_cents, stock, min_stock, max_stock, unit,
  category_id, category_name, is_active, tenant_id,
  created_at, updated_at
) VALUES
-- Điện thoại
('prod_001', 'iPhone 15 Pro Max 256GB', 'IP15PM256', '8934567890123', 'iPhone 15 Pro Max màu Titan Tự Nhiên 256GB',
 2999000000, 2500000000, 15, 5, 50, 'chiếc',
 'cat_001', 'Điện thoại', 1, 'default', datetime('now'), datetime('now')),

('prod_002', 'Samsung Galaxy S24 Ultra', 'SGS24U512', '8934567890124', 'Samsung Galaxy S24 Ultra 512GB',
 2699000000, 2200000000, 20, 5, 50, 'chiếc',
 'cat_001', 'Điện thoại', 1, 'default', datetime('now'), datetime('now')),

('prod_003', 'iPhone 14 Pro 128GB', 'IP14P128', '8934567890125', 'iPhone 14 Pro màu Đen 128GB',
 2199000000, 1800000000, 12, 5, 40, 'chiếc',
 'cat_001', 'Điện thoại', 1, 'default', datetime('now'), datetime('now')),

-- Laptop
('prod_004', 'MacBook Pro 14" M3', 'MBP14M3', '8934567890126', 'MacBook Pro 14 inch M3 8GB 512GB',
 3899000000, 3300000000, 8, 3, 20, 'chiếc',
 'cat_002', 'Laptop', 1, 'default', datetime('now'), datetime('now')),

('prod_005', 'Dell XPS 13', 'DELLXPS13', '8934567890127', 'Dell XPS 13 i7 16GB 512GB',
 2499000000, 2100000000, 10, 3, 25, 'chiếc',
 'cat_002', 'Laptop', 1, 'default', datetime('now'), datetime('now')),

('prod_006', 'Lenovo ThinkPad X1', 'TPX1C10', '8934567890128', 'ThinkPad X1 Carbon Gen 10',
 2799000000, 2300000000, 6, 3, 20, 'chiếc',
 'cat_002', 'Laptop', 1, 'default', datetime('now'), datetime('now')),

-- Tablet
('prod_007', 'iPad Pro 11" M2', 'IPADP11M2', '8934567890129', 'iPad Pro 11 inch M2 128GB WiFi',
 1899000000, 1600000000, 15, 5, 30, 'chiếc',
 'cat_003', 'Tablet', 1, 'default', datetime('now'), datetime('now')),

('prod_008', 'Samsung Galaxy Tab S9', 'SGTS9', '8934567890130', 'Galaxy Tab S9 11 inch 128GB',
 1599000000, 1300000000, 18, 5, 35, 'chiếc',
 'cat_003', 'Tablet', 1, 'default', datetime('now'), datetime('now')),

-- Phụ kiện
('prod_009', 'Ốp lưng iPhone 15 Pro', 'OPIP15P', '8934567890131', 'Ốp lưng silicone iPhone 15 Pro',
 49900000, 30000000, 100, 20, 200, 'chiếc',
 'cat_004', 'Phụ kiện', 1, 'default', datetime('now'), datetime('now')),

('prod_010', 'Cáp sạc USB-C', 'CABUSC', '8934567890132', 'Cáp sạc USB-C to USB-C 1m',
 29900000, 15000000, 150, 30, 300, 'chiếc',
 'cat_004', 'Phụ kiện', 1, 'default', datetime('now'), datetime('now')),

('prod_011', 'Sạc nhanh 20W', 'SAC20W', '8934567890133', 'Bộ sạc nhanh 20W USB-C',
 39900000, 20000000, 80, 20, 150, 'chiếc',
 'cat_004', 'Phụ kiện', 1, 'default', datetime('now'), datetime('now')),

-- Tai nghe
('prod_012', 'AirPods Pro 2', 'APP2', '8934567890134', 'AirPods Pro thế hệ 2 USB-C',
 599000000, 500000000, 25, 10, 50, 'chiếc',
 'cat_005', 'Tai nghe', 1, 'default', datetime('now'), datetime('now')),

('prod_013', 'Sony WH-1000XM5', 'SONYWH5', '8934567890135', 'Tai nghe chống ồn Sony WH-1000XM5',
 899000000, 750000000, 12, 5, 30, 'chiếc',
 'cat_005', 'Tai nghe', 1, 'default', datetime('now'), datetime('now')),

('prod_014', 'Samsung Galaxy Buds Pro', 'SGBP', '8934567890136', 'Samsung Galaxy Buds Pro',
 399000000, 330000000, 30, 10, 60, 'chiếc',
 'cat_005', 'Tai nghe', 1, 'default', datetime('now'), datetime('now')),

('prod_015', 'JBL Tune 510BT', 'JBL510', '8934567890137', 'Tai nghe Bluetooth JBL Tune 510BT',
 99000000, 70000000, 50, 15, 100, 'chiếc',
 'cat_005', 'Tai nghe', 1, 'default', datetime('now'), datetime('now'));

-- Insert sample customers
INSERT OR IGNORE INTO customers (
  id, name, email, phone, address,
  customer_type, loyalty_points, total_spent_cents, visit_count,
  is_active, tenant_id, created_at, updated_at
) VALUES
('cust_001', 'Nguyễn Văn An', 'nguyenvanan@email.com', '0901234567', '123 Nguyễn Huệ, Q1, TP.HCM',
 'vip', 5000, 5000000000, 12, 1, 'default', datetime('now'), datetime('now')),

('cust_002', 'Trần Thị Bình', 'tranthibinh@email.com', '0912345678', '456 Lê Lợi, Q1, TP.HCM',
 'regular', 2000, 2000000000, 8, 1, 'default', datetime('now'), datetime('now')),

('cust_003', 'Lê Văn Cường', 'levancuong@email.com', '0923456789', '789 Trần Hưng Đạo, Q5, TP.HCM',
 'regular', 1500, 1500000000, 5, 1, 'default', datetime('now'), datetime('now')),

('cust_004', 'Phạm Thị Dung', 'phamthidung@email.com', '0934567890', '321 Võ Văn Tần, Q3, TP.HCM',
 'new', 500, 500000000, 2, 1, 'default', datetime('now'), datetime('now')),

('cust_005', 'Hoàng Văn Em', 'hoangvanem@email.com', '0945678901', '654 Nguyễn Thái Học, Q1, TP.HCM',
 'vip', 8000, 8000000000, 20, 1, 'default', datetime('now'), datetime('now'));

-- Note: price_cents format:
-- 2999000000 = 29,990,000 VND (29.99 million VND)
-- Format: price in VND * 100 = cents
-- Example: 29,990,000 VND * 100 = 2,999,000,000 cents
