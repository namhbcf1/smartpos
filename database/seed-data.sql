-- Seed Data for Smart POS System
-- Created: 2025-09-30

-- Insert Categories
INSERT INTO categories (id, name, description, is_active, createdAt, updatedAt) VALUES
('cat-001', 'Laptop', 'Máy tính xách tay các loại', 1, datetime('now'), datetime('now')),
('cat-002', 'PC Desktop', 'Máy tính để bàn', 1, datetime('now'), datetime('now')),
('cat-003', 'Linh kiện', 'Linh kiện máy tính', 1, datetime('now'), datetime('now')),
('cat-004', 'Phụ kiện', 'Phụ kiện máy tính', 1, datetime('now'), datetime('now')),
('cat-005', 'Gaming Gear', 'Thiết bị gaming', 1, datetime('now'), datetime('now'));

-- Insert Brands
INSERT INTO brands (id, name, description, is_active, tenant_id, created_at, updated_at) VALUES
('brand-001', 'Dell', 'Dell Computer Corporation', 1, 'default', datetime('now'), datetime('now')),
('brand-002', 'HP', 'Hewlett-Packard', 1, 'default', datetime('now'), datetime('now')),
('brand-003', 'Lenovo', 'Lenovo Group Limited', 1, 'default', datetime('now'), datetime('now')),
('brand-004', 'ASUS', 'ASUSTeK Computer Inc.', 1, 'default', datetime('now'), datetime('now')),
('brand-005', 'Acer', 'Acer Inc.', 1, 'default', datetime('now'), datetime('now'));

-- Insert Products
INSERT INTO products (id, name, sku, barcode, category_id, brand_id, description, price, cost, stock, min_stock, max_stock, is_active, tenant_id, created_at, updated_at) VALUES
('prod-001', 'Dell Latitude 5420', 'DELL-LAT-5420', '8720100001', 'cat-001', 'brand-001', 'Intel Core i5-1135G7, 8GB RAM, 256GB SSD, 14" FHD', 18500000, 16000000, 15, 5, 50, 1, 'default', datetime('now'), datetime('now')),
('prod-002', 'HP ProBook 450 G8', 'HP-PB-450G8', '8720100002', 'cat-001', 'brand-002', 'Intel Core i5-1135G7, 8GB RAM, 512GB SSD, 15.6" FHD', 19500000, 17000000, 12, 5, 50, 1, 'default', datetime('now'), datetime('now')),
('prod-003', 'Lenovo ThinkPad E14', 'LEN-TP-E14', '8720100003', 'cat-001', 'brand-003', 'Intel Core i5-1135G7, 8GB RAM, 256GB SSD, 14" FHD', 17500000, 15500000, 20, 5, 50, 1, 'default', datetime('now'), datetime('now')),
('prod-004', 'ASUS VivoBook 15', 'ASUS-VB-15', '8720100004', 'cat-001', 'brand-004', 'Intel Core i5-1135G7, 8GB RAM, 512GB SSD, 15.6" FHD', 16500000, 14500000, 18, 5, 50, 1, 'default', datetime('now'), datetime('now')),
('prod-005', 'Acer Aspire 5', 'ACER-AS5', '8720100005', 'cat-001', 'brand-005', 'Intel Core i5-1135G7, 8GB RAM, 512GB SSD, 15.6" FHD', 15500000, 13500000, 25, 5, 50, 1, 'default', datetime('now'), datetime('now')),
('prod-006', 'Dell OptiPlex 7090', 'DELL-OP-7090', '8720100006', 'cat-002', 'brand-001', 'Intel Core i5-11500, 8GB RAM, 256GB SSD', 16000000, 14000000, 10, 3, 30, 1, 'default', datetime('now'), datetime('now')),
('prod-007', 'HP EliteDesk 800 G6', 'HP-ED-800G6', '8720100007', 'cat-002', 'brand-002', 'Intel Core i5-10500, 8GB RAM, 512GB SSD', 17000000, 15000000, 8, 3, 30, 1, 'default', datetime('now'), datetime('now')),
('prod-008', 'Chuột Logitech G502', 'LOG-G502', '8720100008', 'cat-005', 'brand-004', 'Gaming Mouse RGB, 16000 DPI', 950000, 750000, 50, 10, 100, 1, 'default', datetime('now'), datetime('now')),
('prod-009', 'Bàn phím Corsair K70', 'COR-K70', '8720100009', 'cat-005', 'brand-004', 'Mechanical Gaming Keyboard RGB', 2500000, 2000000, 30, 10, 80, 1, 'default', datetime('now'), datetime('now')),
('prod-010', 'Tai nghe HyperX Cloud II', 'HYP-CL2', '8720100010', 'cat-005', 'brand-004', '7.1 Surround Sound Gaming Headset', 1800000, 1400000, 40, 10, 80, 1, 'default', datetime('now'), datetime('now')),
('prod-011', 'RAM Kingston 8GB DDR4', 'KING-8GB-DDR4', '8720100011', 'cat-003', 'brand-003', '8GB DDR4 2666MHz Desktop Memory', 850000, 700000, 60, 20, 150, 1, 'default', datetime('now'), datetime('now')),
('prod-012', 'SSD Samsung 500GB', 'SAM-500GB-SSD', '8720100012', 'cat-003', 'brand-003', '500GB SATA 2.5" Internal SSD', 1500000, 1200000, 45, 15, 120, 1, 'default', datetime('now'), datetime('now')),
('prod-013', 'Màn hình Dell 24"', 'DELL-MON-24', '8720100013', 'cat-004', 'brand-001', '24" FHD IPS Monitor, 75Hz', 3200000, 2800000, 20, 5, 50, 1, 'default', datetime('now'), datetime('now')),
('prod-014', 'Webcam Logitech C920', 'LOG-C920', '8720100014', 'cat-004', 'brand-004', '1080p HD Webcam', 1200000, 950000, 35, 10, 70, 1, 'default', datetime('now'), datetime('now')),
('prod-015', 'USB Hub Anker 7-Port', 'ANK-USB7', '8720100015', 'cat-004', 'brand-004', '7-Port USB 3.0 Hub', 450000, 350000, 55, 15, 100, 1, 'default', datetime('now'), datetime('now'));

-- Insert Customers
INSERT INTO customers (id, name, email, phone, address, customer_type, loyalty_points, is_active, tenant_id, created_at, updated_at) VALUES
('cust-001', 'Nguyễn Văn An', 'nguyenvanan@email.com', '0901234567', '123 Nguyễn Huệ, Q1, TP.HCM', 'retail', 1250, 1, 'default', datetime('now'), datetime('now')),
('cust-002', 'Trần Thị Bình', 'tranthibinh@email.com', '0902345678', '456 Lê Lợi, Q1, TP.HCM', 'retail', 850, 1, 'default', datetime('now'), datetime('now')),
('cust-003', 'Lê Hoàng Cường', 'lehoangcuong@email.com', '0903456789', '789 Hai Bà Trưng, Q3, TP.HCM', 'retail', 2100, 1, 'default', datetime('now'), datetime('now')),
('cust-004', 'Phạm Thị Dung', 'phamthidung@email.com', '0904567890', '321 Võ Văn Tần, Q3, TP.HCM', 'retail', 450, 1, 'default', datetime('now'), datetime('now')),
('cust-005', 'Hoàng Văn Em', 'hoangvanem@email.com', '0905678901', '654 Điện Biên Phủ, Q3, TP.HCM', 'wholesale', 3500, 1, 'default', datetime('now'), datetime('now')),
('cust-006', 'Vũ Thị Phương', 'vuthiphuong@email.com', '0906789012', '987 Cách Mạng Tháng 8, Q10, TP.HCM', 'retail', 670, 1, 'default', datetime('now'), datetime('now')),
('cust-007', 'Đỗ Văn Giang', 'dovangiang@email.com', '0907890123', '147 Lý Thường Kiệt, Q10, TP.HCM', 'retail', 920, 1, 'default', datetime('now'), datetime('now')),
('cust-008', 'Công ty TNHH ABC', 'contact@abc.com.vn', '0908901234', '258 Nguyễn Văn Cừ, Q5, TP.HCM', 'wholesale', 15000, 1, 'default', datetime('now'), datetime('now')),
('cust-009', 'Bùi Thị Hương', 'buithihuong@email.com', '0909012345', '369 Trần Hưng Đạo, Q5, TP.HCM', 'retail', 1100, 1, 'default', datetime('now'), datetime('now')),
('cust-010', 'Ngô Văn Khoa', 'ngovankhoa@email.com', '0900123456', '741 Lạc Long Quân, Q11, TP.HCM', 'retail', 780, 1, 'default', datetime('now'), datetime('now'));

-- Insert Suppliers
INSERT INTO suppliers (id, name, contact_person, email, phone, address, is_active, tenant_id, created_at, updated_at) VALUES
('sup-001', 'Dell Vietnam', 'Nguyễn Minh', 'sales@dell.vn', '0281234567', 'Tòa nhà Bitexco, Q1, TP.HCM', 1, 'default', datetime('now'), datetime('now')),
('sup-002', 'HP Vietnam', 'Trần Hùng', 'contact@hp.vn', '0282345678', 'Viettel Tower, Q10, TP.HCM', 1, 'default', datetime('now'), datetime('now')),
('sup-003', 'Lenovo Vietnam', 'Lê Thu', 'info@lenovo.vn', '0283456789', 'Saigon Center, Q1, TP.HCM', 1, 'default', datetime('now'), datetime('now')),
('sup-004', 'ASUS Vietnam', 'Phạm Long', 'sales@asus.vn', '0284567890', 'Diamond Plaza, Q1, TP.HCM', 1, 'default', datetime('now'), datetime('now')),
('sup-005', 'Acer Vietnam', 'Hoàng Mai', 'contact@acer.vn', '0285678901', 'Vincom Center, Q1, TP.HCM', 1, 'default', datetime('now'), datetime('now'));

-- Insert some sales transactions
INSERT INTO sales (id, sale_number, customer_id, total_amount, discount_amount, tax_amount, paid_amount, payment_method, payment_status, status, notes, tenant_id, store_id, created_by, created_at, updated_at) VALUES
('sale-001', 'POS-2025-0001', 'cust-001', 19450000, 0, 1950000, 19450000, 'cash', 'paid', 'completed', 'Bán lẻ laptop Dell', 'default', 'default', 'admin', datetime('now', '-5 days'), datetime('now', '-5 days')),
('sale-002', 'POS-2025-0002', 'cust-002', 16500000, 500000, 1650000, 16500000, 'credit_card', 'paid', 'completed', 'Bán laptop ASUS', 'default', 'default', 'admin', datetime('now', '-4 days'), datetime('now', '-4 days')),
('sale-003', 'POS-2025-0003', 'cust-003', 3750000, 0, 375000, 3750000, 'bank_transfer', 'paid', 'completed', 'Bán phụ kiện gaming', 'default', 'default', 'admin', datetime('now', '-3 days'), datetime('now', '-3 days')),
('sale-004', 'POS-2025-0004', 'cust-008', 85000000, 5000000, 8500000, 85000000, 'bank_transfer', 'paid', 'completed', 'Bán buôn cho công ty ABC', 'default', 'default', 'admin', datetime('now', '-2 days'), datetime('now', '-2 days')),
('sale-005', 'POS-2025-0005', 'cust-005', 34000000, 1000000, 3400000, 34000000, 'bank_transfer', 'paid', 'completed', 'Bán laptop cho khách sỉ', 'default', 'default', 'admin', datetime('now', '-1 day'), datetime('now', '-1 day'));

-- Insert sale items for the sales
INSERT INTO sale_items (id, sale_id, product_id, product_name, quantity, unit_price, total_price, discount_amount, tenant_id, created_at, updated_at) VALUES
-- Sale 1: Dell Latitude
('si-001', 'sale-001', 'prod-001', 'Dell Latitude 5420', 1, 18500000, 18500000, 0, 'default', datetime('now', '-5 days'), datetime('now', '-5 days')),
('si-002', 'sale-001', 'prod-008', 'Chuột Logitech G502', 1, 950000, 950000, 0, 'default', datetime('now', '-5 days'), datetime('now', '-5 days')),

-- Sale 2: ASUS VivoBook
('si-003', 'sale-002', 'prod-004', 'ASUS VivoBook 15', 1, 16500000, 16500000, 500000, 'default', datetime('now', '-4 days'), datetime('now', '-4 days')),

-- Sale 3: Gaming accessories
('si-004', 'sale-003', 'prod-009', 'Bàn phím Corsair K70', 1, 2500000, 2500000, 0, 'default', datetime('now', '-3 days'), datetime('now', '-3 days')),
('si-005', 'sale-003', 'prod-010', 'Tai nghe HyperX Cloud II', 1, 1800000, 1800000, 0, 'default', datetime('now', '-3 days'), datetime('now', '-3 days')),

-- Sale 4: Bulk sale (5 laptops)
('si-006', 'sale-004', 'prod-001', 'Dell Latitude 5420', 2, 18500000, 37000000, 2000000, 'default', datetime('now', '-2 days'), datetime('now', '-2 days')),
('si-007', 'sale-004', 'prod-002', 'HP ProBook 450 G8', 2, 19500000, 39000000, 2000000, 'default', datetime('now', '-2 days'), datetime('now', '-2 days')),
('si-008', 'sale-004', 'prod-003', 'Lenovo ThinkPad E14', 1, 17500000, 17500000, 1000000, 'default', datetime('now', '-2 days'), datetime('now', '-2 days')),

-- Sale 5: Wholesale laptops
('si-009', 'sale-005', 'prod-003', 'Lenovo ThinkPad E14', 2, 17500000, 35000000, 1000000, 'default', datetime('now', '-1 day'), datetime('now', '-1 day'));

-- Update stock quantities after sales
UPDATE products SET stock = stock - 1 WHERE id = 'prod-001'; -- Sold 1 in sale-001
UPDATE products SET stock = stock - 1 WHERE id = 'prod-008'; -- Sold 1 in sale-001
UPDATE products SET stock = stock - 1 WHERE id = 'prod-004'; -- Sold 1 in sale-002
UPDATE products SET stock = stock - 1 WHERE id = 'prod-009'; -- Sold 1 in sale-003
UPDATE products SET stock = stock - 1 WHERE id = 'prod-010'; -- Sold 1 in sale-003
UPDATE products SET stock = stock - 2 WHERE id = 'prod-001'; -- Sold 2 more in sale-004
UPDATE products SET stock = stock - 2 WHERE id = 'prod-002'; -- Sold 2 in sale-004
UPDATE products SET stock = stock - 1 WHERE id = 'prod-003'; -- Sold 1 in sale-004
UPDATE products SET stock = stock - 2 WHERE id = 'prod-003'; -- Sold 2 more in sale-005

-- Insert some online orders
INSERT INTO online_orders (id, customer_id, customer_name, customer_email, customer_phone, order_number, status, payment_status, payment_method, total_amount, shipping_fee, discount_amount, tax_amount, shipping_address, source, priority, tenant_id, store_id, created_at, updated_at) VALUES
('online-001', 'cust-006', 'Vũ Thị Phương', 'vuthiphuong@email.com', '0906789012', 'ONLINE-2025-0001', 'delivered', 'paid', 'credit_card', 16500000, 0, 0, 1650000, '987 Cách Mạng Tháng 8, Q10, TP.HCM', 'website', 'normal', 'default', 'default', datetime('now', '-7 days'), datetime('now', '-3 days')),
('online-002', 'cust-007', 'Đỗ Văn Giang', 'dovangiang@email.com', '0907890123', 'ONLINE-2025-0002', 'shipped', 'paid', 'e_wallet', 2500000, 50000, 0, 255000, '147 Lý Thường Kiệt, Q10, TP.HCM', 'app', 'high', 'default', 'default', datetime('now', '-2 days'), datetime('now', '-1 day')),
('online-003', 'cust-009', 'Bùi Thị Hương', 'buithihuong@email.com', '0909012345', 'ONLINE-2025-0003', 'processing', 'paid', 'online_banking', 3200000, 50000, 0, 325000, '369 Trần Hưng Đạo, Q5, TP.HCM', 'website', 'normal', 'default', 'default', datetime('now', '-1 day'), datetime('now', '-1 day')),
('online-004', 'cust-010', 'Ngô Văn Khoa', 'ngovankhoa@email.com', '0900123456', 'ONLINE-2025-0004', 'pending', 'pending', 'cod', 1800000, 30000, 0, 183000, '741 Lạc Long Quân, Q11, TP.HCM', 'social_media', 'urgent', 'default', 'default', datetime('now'), datetime('now'));

-- Insert online order items
INSERT INTO online_order_items (id, order_id, product_id, product_name, product_sku, quantity, unit_price, total_price, discount_amount, created_at, updated_at) VALUES
('oi-001', 'online-001', 'prod-004', 'ASUS VivoBook 15', 'ASUS-VB-15', 1, 16500000, 16500000, 0, datetime('now', '-7 days'), datetime('now', '-7 days')),
('oi-002', 'online-002', 'prod-009', 'Bàn phím Corsair K70', 'COR-K70', 1, 2500000, 2500000, 0, datetime('now', '-2 days'), datetime('now', '-2 days')),
('oi-003', 'online-003', 'prod-013', 'Màn hình Dell 24"', 'DELL-MON-24', 1, 3200000, 3200000, 0, datetime('now', '-1 day'), datetime('now', '-1 day')),
('oi-004', 'online-004', 'prod-010', 'Tai nghe HyperX Cloud II', 'HYP-CL2', 1, 1800000, 1800000, 0, datetime('now'), datetime('now'));

-- Update inventory movements for sales
INSERT INTO inventory_movements (id, product_id, movement_type, quantity, reference_type, reference_id, notes, tenant_id, created_at) VALUES
('im-001', 'prod-001', 'out', 1, 'sale', 'sale-001', 'Bán hàng POS', 'default', datetime('now', '-5 days')),
('im-002', 'prod-008', 'out', 1, 'sale', 'sale-001', 'Bán hàng POS', 'default', datetime('now', '-5 days')),
('im-003', 'prod-004', 'out', 1, 'sale', 'sale-002', 'Bán hàng POS', 'default', datetime('now', '-4 days')),
('im-004', 'prod-009', 'out', 1, 'sale', 'sale-003', 'Bán hàng POS', 'default', datetime('now', '-3 days')),
('im-005', 'prod-010', 'out', 1, 'sale', 'sale-003', 'Bán hàng POS', 'default', datetime('now', '-3 days')),
('im-006', 'prod-001', 'out', 2, 'sale', 'sale-004', 'Bán buôn', 'default', datetime('now', '-2 days')),
('im-007', 'prod-002', 'out', 2, 'sale', 'sale-004', 'Bán buôn', 'default', datetime('now', '-2 days')),
('im-008', 'prod-003', 'out', 1, 'sale', 'sale-004', 'Bán buôn', 'default', datetime('now', '-2 days')),
('im-009', 'prod-003', 'out', 2, 'sale', 'sale-005', 'Bán sỉ', 'default', datetime('now', '-1 day'));

-- Analyze tables for query optimization
ANALYZE;
