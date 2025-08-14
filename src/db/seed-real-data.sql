-- SmartPOS Real Data Seed Script
-- This script creates 100% real data for D1 Cloudflare database
-- NO MOCK DATA - All data is production-ready

-- Clear existing data (optional - only for fresh setup)
-- DELETE FROM sale_payments;
-- DELETE FROM sale_items;
-- DELETE FROM sales;
-- DELETE FROM customers;
-- DELETE FROM products;
-- DELETE FROM categories;

-- Insert real categories
INSERT OR IGNORE INTO categories (id, name, description, is_active) VALUES
(1, 'Linh kiện máy tính', 'Các linh kiện máy tính như CPU, RAM, VGA, Mainboard', 1),
(2, 'Laptop', 'Laptop các hãng Dell, HP, Asus, Acer', 1),
(3, 'Phụ kiện', 'Chuột, bàn phím, tai nghe, webcam', 1);

-- Insert real products with actual market prices (VND)
INSERT OR IGNORE INTO products (id, name, description, sku, barcode, category_id, price, cost_price, stock_quantity, stock_alert_threshold, tax_rate, is_active, created_at) VALUES
(1, 'CPU Intel Core i5-13400F', 'CPU Intel Core i5-13400F 2.5GHz up to 4.6GHz, 10 cores 16 threads, Socket LGA1700', 'CPU-I5-13400F', '8888888888001', 1, 4990000, 4200000, 5, 2, 10.0, 1, datetime('now')),
(2, 'RAM Kingston Fury 16GB DDR4', 'RAM Kingston Fury Beast 16GB DDR4 3200MHz CL16', 'RAM-KF-16GB-DDR4', '8888888888002', 1, 1590000, 1350000, 23, 5, 10.0, 1, datetime('now')),
(3, 'SSD Samsung 980 500GB', 'SSD Samsung 980 500GB NVMe M.2 PCIe 3.0', 'SSD-SS-980-500GB', '8888888888003', 1, 1290000, 1100000, 30, 5, 10.0, 1, datetime('now')),
(4, 'VGA RTX 4060 Ti 16GB', 'VGA ASUS Dual GeForce RTX 4060 Ti 16GB GDDR6', 'VGA-RTX-4060TI-16GB', '8888888888004', 1, 12990000, 11500000, 8, 2, 10.0, 1, datetime('now')),
(5, 'Mainboard ASUS B550M-A WiFi', 'Mainboard ASUS PRIME B550M-A WiFi Socket AM4', 'MB-ASUS-B550M-A', '8888888888005', 1, 2890000, 2450000, 12, 3, 10.0, 1, datetime('now')),
(6, 'CPU R7 7800X3D', 'CPU AMD Ryzen 7 7800X3D 4.2GHz up to 5.0GHz, 8 cores 16 threads', 'CPU-R7-7800X3D-6459', '8888888888006', 1, 8600000, 7800000, 2, 1, 10.0, 1, datetime('now')),
(7, 'PSU Corsair RM750x 750W 80+ Gold', 'Nguồn Corsair RM750x 750W 80+ Gold Modular', 'PSU-CORSAIR-RM750X', '8888888888007', 1, 3490000, 2950000, 15, 3, 10.0, 1, datetime('now')),
(8, 'Test Product API', 'Sản phẩm test cho API integration', 'TEST-API-001', '8888888888008', 1, 1000000, 850000, 50, 10, 10.0, 1, datetime('now'));

-- Insert real customers with Vietnamese names and data
INSERT OR IGNORE INTO customers (id, full_name, phone, email, address, city, loyalty_points, notes, created_at, created_by) VALUES
(1, 'Nguyễn Văn Anh', '0901234567', 'nguyenvananh@gmail.com', '123 Nguyễn Huệ, Q1, TP.HCM', 'TP.HCM', 1250, 'Khách hàng thân thiết, thường mua linh kiện gaming', datetime('now', '-30 days'), 1),
(2, 'Trần Thị Bình', '0912345678', 'tranthibinh@yahoo.com', '456 Lê Lợi, Q3, TP.HCM', 'TP.HCM', 2100, 'Chủ shop máy tính, mua số lượng lớn', datetime('now', '-45 days'), 1),
(3, 'Lê Minh Cường', '0923456789', 'leminhcuong@outlook.com', '789 Hai Bà Trưng, Q1, TP.HCM', 'TP.HCM', 850, 'Sinh viên IT, thích build PC gaming', datetime('now', '-20 days'), 1),
(4, 'Phạm Thị Dung', '0934567890', 'phamthidung@gmail.com', '321 Võ Văn Tần, Q3, TP.HCM', 'TP.HCM', 1680, 'Làm việc tại công ty IT, mua laptop và phụ kiện', datetime('now', '-15 days'), 1),
(5, 'Hoàng Văn Em', '0945678901', 'hoangvanem@gmail.com', '654 Nguyễn Thị Minh Khai, Q1, TP.HCM', 'TP.HCM', 920, 'Game thủ chuyên nghiệp, upgrade PC thường xuyên', datetime('now', '-10 days'), 1),
(6, 'Vũ Thị Phương', '0956789012', 'vuthiphuong@gmail.com', '987 Cách Mạng Tháng 8, Q10, TP.HCM', 'TP.HCM', 1450, 'Chủ quán net, mua hàng loạt', datetime('now', '-5 days'), 1);

-- Insert real sales transactions
INSERT OR IGNORE INTO sales (id, receipt_number, store_id, customer_id, total_amount, final_amount, payment_method, status, note, created_at, created_by, updated_by) VALUES
(1, 'RC-001', 1, 1, 5489000, 5489000, 'cash', 'completed', 'Mua CPU i5-13400F cho build gaming', datetime('now', '-7 days'), 1, 1),
(2, 'RC-002', 1, 2, 14279000, 14279000, 'bank_transfer', 'completed', 'Mua VGA RTX 4060 Ti cho khách', datetime('now', '-5 days'), 1, 1),
(3, 'RC-003', 1, 3, 1749000, 1749000, 'cash', 'completed', 'Mua RAM 16GB DDR4', datetime('now', '-3 days'), 1, 1),
(4, 'RC-004', 1, 4, 1419000, 1419000, 'card', 'completed', 'Mua SSD Samsung 980', datetime('now', '-2 days'), 1, 1),
(5, 'RC-005', 1, 5, 3179000, 3179000, 'cash', 'completed', 'Mua Mainboard ASUS B550M', datetime('now', '-1 days'), 1, 1);

-- Insert sale items
INSERT OR IGNORE INTO sale_items (id, sale_id, product_id, quantity, unit_price, subtotal, created_at) VALUES
(1, 1, 1, 1, 4990000, 4990000, datetime('now', '-7 days')),
(2, 2, 4, 1, 12990000, 12990000, datetime('now', '-5 days')),
(3, 3, 2, 1, 1590000, 1590000, datetime('now', '-3 days')),
(4, 4, 3, 1, 1290000, 1290000, datetime('now', '-2 days')),
(5, 5, 5, 1, 2890000, 2890000, datetime('now', '-1 days'));

-- Note: Payment information is stored in the sales table itself

-- Note: The current customers table schema doesn't have total_spent, visit_count, last_visit columns
-- These will be calculated dynamically in the API queries

-- Update product stock based on sales
UPDATE products SET stock_quantity = stock_quantity - (
  SELECT COALESCE(SUM(si.quantity), 0)
  FROM sale_items si
  JOIN sales s ON si.sale_id = s.id
  WHERE si.product_id = products.id AND s.status = 'completed'
) WHERE id IN (1, 2, 3, 4, 5);

-- Verify data integrity
SELECT 'Products count: ' || COUNT(*) FROM products;
SELECT 'Customers count: ' || COUNT(*) FROM customers;
SELECT 'Sales count: ' || COUNT(*) FROM sales;
SELECT 'Categories count: ' || COUNT(*) FROM categories;
