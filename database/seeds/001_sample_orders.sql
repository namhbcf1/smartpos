-- Sample Orders Data for Testing
-- This creates real orders data in D1 database

-- Insert sample orders (status: pending, completed, cancelled)
INSERT INTO orders (id, order_number, customer_id, user_id, store_id, status, subtotal_cents, discount_cents, tax_cents, total_cents, payment_method, payment_status, notes, customer_name, customer_phone, tenant_id, created_at, updated_at) VALUES
('ord-001', 'ORD-2025-001', (SELECT id FROM customers LIMIT 1), (SELECT id FROM users LIMIT 1), 'default-store', 'pending', 500000, 0, 50000, 550000, 'cash', 'pending', 'Đơn hàng mới chờ xử lý', 'Nguyễn Văn A', '0901234567', 'default', datetime('now', '-2 hours'), datetime('now', '-2 hours')),
('ord-002', 'ORD-2025-002', (SELECT id FROM customers LIMIT 1 OFFSET 1), (SELECT id FROM users LIMIT 1), 'default-store', 'completed', 1200000, 100000, 110000, 1210000, 'card', 'paid', 'Đơn hàng đã hoàn thành', 'Trần Thị B', '0987654321', 'default', datetime('now', '-1 day'), datetime('now', '-1 day')),
('ord-003', 'ORD-2025-003', (SELECT id FROM customers LIMIT 1 OFFSET 2), (SELECT id FROM users LIMIT 1), 'default-store', 'cancelled', 800000, 0, 80000, 880000, 'bank_transfer', 'refunded', 'Cancelled: Khách hàng hủy đơn', 'Lê Văn C', '0912345678', 'default', datetime('now', '-3 hours'), datetime('now', '-1 hour')),
('ord-004', 'ORD-2025-004', (SELECT id FROM customers LIMIT 1), (SELECT id FROM users LIMIT 1), 'default-store', 'pending', 300000, 50000, 25000, 275000, 'momo', 'pending', NULL, 'Phạm Thị D', '0923456789', 'default', datetime('now', '-30 minutes'), datetime('now', '-30 minutes')),
('ord-005', 'ORD-2025-005', (SELECT id FROM customers LIMIT 1 OFFSET 1), (SELECT id FROM users LIMIT 1), 'default-store', 'completed', 2500000, 200000, 230000, 2530000, 'vnpay', 'paid', 'Đơn hàng lớn - VIP', 'Hoàng Văn E', '0934567890', 'default', datetime('now', '-2 days'), datetime('now', '-2 days')),
('ord-006', 'ORD-2025-006', (SELECT id FROM customers LIMIT 1 OFFSET 2), (SELECT id FROM users LIMIT 1), 'default-store', 'completed', 650000, 0, 65000, 715000, 'cash', 'paid', NULL, 'Vũ Thị F', '0945678901', 'default', datetime('now', '-5 hours'), datetime('now', '-5 hours')),
('ord-007', 'ORD-2025-007', (SELECT id FROM customers LIMIT 1), (SELECT id FROM users LIMIT 1), 'default-store', 'cancelled', 450000, 0, 45000, 495000, 'zalopay', 'cancelled', 'Cancelled: Hết hàng', 'Đặng Văn G', '0956789012', 'default', datetime('now', '-1 day'), datetime('now', '-6 hours')),
('ord-008', 'ORD-2025-008', (SELECT id FROM customers LIMIT 1 OFFSET 1), (SELECT id FROM users LIMIT 1), 'default-store', 'pending', 920000, 120000, 80000, 880000, 'card', 'pending', 'Khách VIP - ưu tiên', 'Bùi Thị H', '0967890123', 'default', datetime('now', '-10 minutes'), datetime('now', '-10 minutes')),
('ord-009', 'ORD-2025-009', (SELECT id FROM customers LIMIT 1 OFFSET 2), (SELECT id FROM users LIMIT 1), 'default-store', 'completed', 1800000, 300000, 150000, 1650000, 'bank_transfer', 'paid', 'Đơn online đã giao', 'Ngô Văn I', '0978901234', 'default', datetime('now', '-1 day'), datetime('now', '-12 hours')),
('ord-010', 'ORD-2025-010', (SELECT id FROM customers LIMIT 1), (SELECT id FROM users LIMIT 1), 'default-store', 'pending', 580000, 80000, 50000, 550000, 'cash', 'pending', NULL, 'Trương Thị K', '0989012345', 'default', datetime('now', '-45 minutes'), datetime('now', '-45 minutes'));

-- Insert order items for each order
-- Order 1 items
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price_cents, total_price_cents, discount_cents, product_name, product_sku, created_at) VALUES
('item-001-1', 'ord-001', (SELECT id FROM products LIMIT 1), 2, 250000, 500000, 0, 'Laptop Dell XPS 13', 'LAPTOP-001', datetime('now', '-2 hours')),
('item-001-2', 'ord-001', (SELECT id FROM products LIMIT 1 OFFSET 1), 1, 50000, 50000, 0, 'Chuột không dây', 'MOUSE-001', datetime('now', '-2 hours'));

-- Order 2 items
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price_cents, total_price_cents, discount_cents, product_name, product_sku, created_at) VALUES
('item-002-1', 'ord-002', (SELECT id FROM products LIMIT 1 OFFSET 2), 3, 400000, 1200000, 100000, 'iPhone 15 Pro', 'PHONE-001', datetime('now', '-1 day'));

-- Order 3 items
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price_cents, total_price_cents, discount_cents, product_name, product_sku, created_at) VALUES
('item-003-1', 'ord-003', (SELECT id FROM products LIMIT 1 OFFSET 3), 2, 400000, 800000, 0, 'Samsung Galaxy S24', 'PHONE-002', datetime('now', '-3 hours'));

-- Order 4 items
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price_cents, total_price_cents, discount_cents, product_name, product_sku, created_at) VALUES
('item-004-1', 'ord-004', (SELECT id FROM products LIMIT 1 OFFSET 4), 1, 300000, 300000, 50000, 'Tai nghe AirPods', 'AUDIO-001', datetime('now', '-30 minutes'));

-- Order 5 items
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price_cents, total_price_cents, discount_cents, product_name, product_sku, created_at) VALUES
('item-005-1', 'ord-005', (SELECT id FROM products LIMIT 1), 5, 500000, 2500000, 200000, 'MacBook Pro M3', 'LAPTOP-002', datetime('now', '-2 days'));

-- Order 6 items
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price_cents, total_price_cents, discount_cents, product_name, product_sku, created_at) VALUES
('item-006-1', 'ord-006', (SELECT id FROM products LIMIT 1 OFFSET 1), 3, 200000, 600000, 0, 'Bàn phím cơ', 'KB-001', datetime('now', '-5 hours')),
('item-006-2', 'ord-006', (SELECT id FROM products LIMIT 1 OFFSET 2), 1, 50000, 50000, 0, 'USB Hub', 'ACC-001', datetime('now', '-5 hours'));

-- Order 7 items
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price_cents, total_price_cents, discount_cents, product_name, product_sku, created_at) VALUES
('item-007-1', 'ord-007', (SELECT id FROM products LIMIT 1 OFFSET 3), 1, 450000, 450000, 0, 'iPad Air', 'TABLET-001', datetime('now', '-1 day'));

-- Order 8 items
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price_cents, total_price_cents, discount_cents, product_name, product_sku, created_at) VALUES
('item-008-1', 'ord-008', (SELECT id FROM products LIMIT 1 OFFSET 5), 2, 460000, 920000, 120000, 'Monitor 4K', 'MON-001', datetime('now', '-10 minutes'));

-- Order 9 items
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price_cents, total_price_cents, discount_cents, product_name, product_sku, created_at) VALUES
('item-009-1', 'ord-009', (SELECT id FROM products LIMIT 1), 3, 600000, 1800000, 300000, 'Sony WH-1000XM5', 'AUDIO-002', datetime('now', '-1 day'));

-- Order 10 items
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price_cents, total_price_cents, discount_cents, product_name, product_sku, created_at) VALUES
('item-010-1', 'ord-010', (SELECT id FROM products LIMIT 1 OFFSET 1), 2, 290000, 580000, 80000, 'Webcam Logitech', 'CAM-001', datetime('now', '-45 minutes'));
