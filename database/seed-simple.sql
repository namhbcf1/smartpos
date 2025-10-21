-- Simple Seed Data for Smart POS System
-- Only insert into known tables with verified schema

-- Insert Categories (use snake_case column names)
INSERT OR IGNORE INTO categories (id, name, description, is_active, created_at, updated_at) VALUES
('cat-001', 'Laptop', 'Máy tính xách tay', 1, datetime('now'), datetime('now')),
('cat-002', 'PC Desktop', 'Máy tính để bàn', 1, datetime('now'), datetime('now')),
('cat-003', 'Linh kiện', 'Linh kiện PC', 1, datetime('now'), datetime('now')),
('cat-004', 'Phụ kiện', 'Phụ kiện máy tính', 1, datetime('now'), datetime('now')),
('cat-005', 'Gaming', 'Gaming Gear', 1, datetime('now'), datetime('now'));

-- Insert Products (simplified)
INSERT OR IGNORE INTO products (id, name, sku, barcode, price_cents, cost_price_cents, stock, is_active, created_at, updated_at, category_id, tenant_id) VALUES
('prod-001', 'Dell Latitude 5420', 'DELL-LAT-5420', '8720100001', 18500000, 16000000, 15, 1, datetime('now'), datetime('now'), 'cat-001', 'default'),
('prod-002', 'HP ProBook 450 G8', 'HP-PB-450G8', '8720100002', 19500000, 17000000, 12, 1, datetime('now'), datetime('now'), 'cat-001', 'default'),
('prod-003', 'Lenovo ThinkPad E14', 'LEN-TP-E14', '8720100003', 17500000, 15500000, 20, 1, datetime('now'), datetime('now'), 'cat-001', 'default'),
('prod-004', 'ASUS VivoBook 15', 'ASUS-VB-15', '8720100004', 16500000, 14500000, 18, 1, datetime('now'), datetime('now'), 'cat-001', 'default'),
('prod-005', 'Acer Aspire 5', 'ACER-AS5', '8720100005', 15500000, 13500000, 25, 1, datetime('now'), datetime('now'), 'cat-001', 'default'),
('prod-006', 'Dell OptiPlex 7090', 'DELL-OP-7090', '8720100006', 16000000, 14000000, 10, 1, datetime('now'), datetime('now'), 'cat-002', 'default'),
('prod-007', 'HP EliteDesk 800 G6', 'HP-ED-800G6', '8720100007', 17000000, 15000000, 8, 1, datetime('now'), datetime('now'), 'cat-002', 'default'),
('prod-008', 'Chuột Logitech G502', 'LOG-G502', '8720100008', 950000, 750000, 50, 1, datetime('now'), datetime('now'), 'cat-005', 'default'),
('prod-009', 'Bàn phím Corsair K70', 'COR-K70', '8720100009', 2500000, 2000000, 30, 1, datetime('now'), datetime('now'), 'cat-005', 'default'),
('prod-010', 'Tai nghe HyperX Cloud II', 'HYP-CL2', '8720100010', 1800000, 1400000, 40, 1, datetime('now'), datetime('now'), 'cat-005', 'default'),
('prod-011', 'RAM Kingston 8GB DDR4', 'KING-8GB-DDR4', '8720100011', 850000, 700000, 60, 1, datetime('now'), datetime('now'), 'cat-003', 'default'),
('prod-012', 'SSD Samsung 500GB', 'SAM-500GB-SSD', '8720100012', 1500000, 1200000, 45, 1, datetime('now'), datetime('now'), 'cat-003', 'default'),
('prod-013', 'Màn hình Dell 24"', 'DELL-MON-24', '8720100013', 3200000, 2800000, 20, 1, datetime('now'), datetime('now'), 'cat-004', 'default'),
('prod-014', 'Webcam Logitech C920', 'LOG-C920', '8720100014', 1200000, 950000, 35, 1, datetime('now'), datetime('now'), 'cat-004', 'default'),
('prod-015', 'USB Hub Anker 7-Port', 'ANK-USB7', '8720100015', 450000, 350000, 55, 1, datetime('now'), datetime('now'), 'cat-004', 'default');

-- Insert Customers (simplified)
INSERT OR IGNORE INTO customers (id, name, email, phone, address, customer_type, is_active, created_at, updated_at, tenant_id) VALUES
('cust-001', 'Nguyễn Văn An', 'nguyenvanan@email.com', '0901234567', '123 Nguyễn Huệ, Q1, TP.HCM', 'retail', 1, datetime('now'), datetime('now'), 'default'),
('cust-002', 'Trần Thị Bình', 'tranthibinh@email.com', '0902345678', '456 Lê Lợi, Q1, TP.HCM', 'retail', 1, datetime('now'), datetime('now'), 'default'),
('cust-003', 'Lê Hoàng Cường', 'lehoangcuong@email.com', '0903456789', '789 Hai Bà Trưng, Q3, TP.HCM', 'retail', 1, datetime('now'), datetime('now'), 'default'),
('cust-004', 'Phạm Thị Dung', 'phamthidung@email.com', '0904567890', '321 Võ Văn Tần, Q3, TP.HCM', 'retail', 1, datetime('now'), datetime('now'), 'default'),
('cust-005', 'Hoàng Văn Em', 'hoangvanem@email.com', '0905678901', '654 Điện Biên Phủ, Q3, TP.HCM', 'wholesale', 1, datetime('now'), datetime('now'), 'default'),
('cust-006', 'Vũ Thị Phương', 'vuthiphuong@email.com', '0906789012', '987 Cách Mạng Tháng 8, Q10, TP.HCM', 'retail', 1, datetime('now'), datetime('now'), 'default'),
('cust-007', 'Đỗ Văn Giang', 'dovangiang@email.com', '0907890123', '147 Lý Thường Kiệt, Q10, TP.HCM', 'retail', 1, datetime('now'), datetime('now'), 'default'),
('cust-008', 'Công ty TNHH ABC', 'contact@abc.com.vn', '0908901234', '258 Nguyễn Văn Cừ, Q5, TP.HCM', 'wholesale', 1, datetime('now'), datetime('now'), 'default'),
('cust-009', 'Bùi Thị Hương', 'buithihuong@email.com', '0909012345', '369 Trần Hưng Đạo, Q5, TP.HCM', 'retail', 1, datetime('now'), datetime('now'), 'default'),
('cust-010', 'Ngô Văn Khoa', 'ngovankhoa@email.com', '0900123456', '741 Lạc Long Quân, Q11, TP.HCM', 'retail', 1, datetime('now'), datetime('now'), 'default');

-- Analyze for optimization
ANALYZE;
