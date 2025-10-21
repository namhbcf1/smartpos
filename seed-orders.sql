-- Seed customers (id is INTEGER AUTO INCREMENT)
INSERT INTO customers (full_name, phone, email, customer_group, loyalty_points, is_active)
VALUES ('Nguyễn Văn A', '0901234567', 'nguyenvana@email.com', 'regular', 0, 1);

INSERT INTO customers (full_name, phone, email, customer_group, loyalty_points, is_active)
VALUES ('Trần Thị B', '0907654321', 'tranthib@email.com', 'vip', 100, 1);

INSERT INTO customers (full_name, phone, email, customer_group, loyalty_points, is_active)
VALUES ('Lê Văn C', '0909876543', 'levanc@email.com', 'regular', 0, 1);

INSERT INTO customers (full_name, phone, email, customer_group, loyalty_points, is_active)
VALUES ('Phạm Thị D', '0912345678', 'phamthid@email.com', 'vip', 250, 1);

INSERT INTO customers (full_name, phone, email, customer_group, loyalty_points, is_active)
VALUES ('Hoàng Văn E', '0987654321', 'hoangvane@email.com', 'regular', 50, 1);

-- Seed orders (customer_id is INTEGER, user_id is TEXT)
INSERT INTO orders (id, order_number, customer_id, user_id, subtotal, tax_amount, discount_amount, total_amount, payment_method, payment_status, order_status, created_at)
VALUES ('ord-001', 'ORD-001', 7, 'user-admin-001', 1500000, 150000, 0, 1650000, 'cash', 'completed', 'completed', datetime('now', '-5 days'));

INSERT INTO orders (id, order_number, customer_id, user_id, subtotal, tax_amount, discount_amount, total_amount, payment_method, payment_status, order_status, created_at)
VALUES ('ord-002', 'ORD-002', 8, 'user-admin-001', 2300000, 230000, 0, 2530000, 'bank_transfer', 'pending', 'pending', datetime('now', '-3 days'));

INSERT INTO orders (id, order_number, customer_id, user_id, subtotal, tax_amount, discount_amount, total_amount, payment_method, payment_status, order_status, created_at)
VALUES ('ord-003', 'ORD-003', 9, 'user-admin-001', 800000, 80000, 0, 880000, 'cash', 'completed', 'completed', datetime('now', '-2 days'));

INSERT INTO orders (id, order_number, customer_id, user_id, subtotal, tax_amount, discount_amount, total_amount, payment_method, payment_status, order_status, created_at)
VALUES ('ord-004', 'ORD-004', 10, 'user-admin-001', 5600000, 560000, 500000, 5660000, 'qr_code', 'pending', 'pending', datetime('now', '-1 days'));

INSERT INTO orders (id, order_number, customer_id, user_id, subtotal, tax_amount, discount_amount, total_amount, payment_method, payment_status, order_status, created_at)
VALUES ('ord-005', 'ORD-005', 11, 'user-admin-001', 3200000, 320000, 200000, 3320000, 'card', 'completed', 'completed', datetime('now'));

-- Seed categories
INSERT OR IGNORE INTO categories (id, name, description, created_at)
VALUES ('cat-001', 'Điện thoại', 'Smartphone các loại', datetime('now'));

INSERT OR IGNORE INTO categories (id, name, description, created_at)
VALUES ('cat-002', 'Laptop', 'Laptop và máy tính xách tay', datetime('now'));

INSERT OR IGNORE INTO categories (id, name, description, created_at)
VALUES ('cat-003', 'Phụ kiện', 'Tai nghe, sạc, bao da', datetime('now'));

INSERT OR IGNORE INTO categories (id, name, description, created_at)
VALUES ('cat-004', 'Tablet', 'Máy tính bảng', datetime('now'));

-- Seed products
INSERT OR IGNORE INTO products (id, name, sku, price_cents, stock, category_id, created_at)
VALUES ('prod-001', 'iPhone 15 Pro Max', 'IP15PM-256', 2999000, 15, 'cat-001', datetime('now'));

INSERT OR IGNORE INTO products (id, name, sku, price_cents, stock, category_id, created_at)
VALUES ('prod-002', 'Samsung Galaxy S24 Ultra', 'SGS24U-512', 2799000, 8, 'cat-001', datetime('now'));

INSERT OR IGNORE INTO products (id, name, sku, price_cents, stock, category_id, created_at)
VALUES ('prod-003', 'MacBook Air M3', 'MBA-M3-256', 2999000, 5, 'cat-002', datetime('now'));

INSERT OR IGNORE INTO products (id, name, sku, price_cents, stock, category_id, created_at)
VALUES ('prod-004', 'AirPods Pro 2', 'APP2-USB-C', 549000, 25, 'cat-003', datetime('now'));

INSERT OR IGNORE INTO products (id, name, sku, price_cents, stock, category_id, created_at)
VALUES ('prod-005', 'iPad Pro 11" M4', 'IPP11-M4-256', 2199000, 12, 'cat-004', datetime('now'));

INSERT OR IGNORE INTO products (id, name, sku, price_cents, stock, category_id, created_at)
VALUES ('prod-006', 'Dell XPS 13', 'DELL-XPS13', 1899000, 7, 'cat-002', datetime('now'));

INSERT OR IGNORE INTO products (id, name, sku, price_cents, stock, category_id, created_at)
VALUES ('prod-007', 'Sony WH-1000XM5', 'SONY-WH1000XM5', 799000, 20, 'cat-003', datetime('now'));

INSERT OR IGNORE INTO products (id, name, sku, price_cents, stock, category_id, created_at)
VALUES ('prod-008', 'Xiaomi 14 Pro', 'XM14PRO', 1699000, 18, 'cat-001', datetime('now'));
