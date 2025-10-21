-- Online Orders Schema for Cloudflare D1
-- Quản lý đơn hàng online với đầy đủ thông tin khách hàng và trạng thái

-- Main online orders table
CREATE TABLE IF NOT EXISTS online_orders (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    store_id TEXT NOT NULL,
    customer_id TEXT, -- Optional link to customers table
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    order_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')) DEFAULT 'pending',
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
    payment_method TEXT NOT NULL CHECK (payment_method IN ('online_banking', 'credit_card', 'e_wallet', 'cod')),
    total_amount REAL NOT NULL DEFAULT 0,
    shipping_fee REAL NOT NULL DEFAULT 0,
    discount_amount REAL NOT NULL DEFAULT 0,
    tax_amount REAL NOT NULL DEFAULT 0,
    items_json TEXT NOT NULL DEFAULT '[]', -- JSON string of order items
    shipping_address TEXT NOT NULL,
    notes TEXT,
    source TEXT NOT NULL CHECK (source IN ('website', 'app', 'social_media', 'marketplace')) DEFAULT 'website',
    tracking_number TEXT,
    estimated_delivery TEXT, -- ISO datetime string
    priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
    tags TEXT DEFAULT '[]', -- JSON array of tags
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    confirmed_at TEXT,
    shipped_at TEXT,
    delivered_at TEXT,
    deleted_at TEXT,
    created_by TEXT,
    assigned_to TEXT
);

-- Online order items table (separate for better querying)
CREATE TABLE IF NOT EXISTS online_order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_sku TEXT NOT NULL,
    variant_id TEXT,
    variant_name TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL DEFAULT 0,
    total_price REAL NOT NULL DEFAULT 0,
    discount_amount REAL NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    FOREIGN KEY (order_id) REFERENCES online_orders(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_online_orders_tenant_store ON online_orders(tenant_id, store_id);
CREATE INDEX IF NOT EXISTS idx_online_orders_status ON online_orders(status);
CREATE INDEX IF NOT EXISTS idx_online_orders_payment_status ON online_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_online_orders_source ON online_orders(source);
CREATE INDEX IF NOT EXISTS idx_online_orders_priority ON online_orders(priority);
CREATE INDEX IF NOT EXISTS idx_online_orders_created_at ON online_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_online_orders_customer_email ON online_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_online_orders_customer_phone ON online_orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_online_orders_order_number ON online_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_online_orders_assigned_to ON online_orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_online_orders_deleted_at ON online_orders(deleted_at);

CREATE INDEX IF NOT EXISTS idx_online_order_items_order_id ON online_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_online_order_items_product_id ON online_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_online_order_items_deleted_at ON online_order_items(deleted_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_online_orders_tenant_status ON online_orders(tenant_id, status, deleted_at);
CREATE INDEX IF NOT EXISTS idx_online_orders_tenant_created ON online_orders(tenant_id, created_at DESC, deleted_at);
CREATE INDEX IF NOT EXISTS idx_online_orders_customer_search ON online_orders(customer_name, customer_email, customer_phone);

-- Sample data for testing (can be removed in production)
INSERT OR IGNORE INTO online_orders (
    id, tenant_id, store_id, customer_name, customer_email, customer_phone,
    order_number, status, payment_status, payment_method, total_amount,
    shipping_fee, discount_amount, shipping_address, source, priority,
    items_json, created_at, updated_at
) VALUES
(
    'order-001', 'default', 'store-001', 'Nguyễn Văn A', 'nguyenvana@email.com', '0901234567',
    'ON240001', 'pending', 'pending', 'online_banking', 500000,
    30000, 50000, '123 Đường ABC, Quận 1, TP.HCM', 'website', 'normal',
    '[{"product_id":"prod-001","product_name":"Áo sơ mi","quantity":2,"unit_price":200000,"total_price":400000}]',
    datetime('now', '-2 hours'), datetime('now', '-2 hours')
),
(
    'order-002', 'default', 'store-001', 'Trần Thị B', 'tranthib@email.com', '0902345678',
    'ON240002', 'confirmed', 'paid', 'credit_card', 750000,
    50000, 0, '456 Đường XYZ, Quận 3, TP.HCM', 'app', 'high',
    '[{"product_id":"prod-002","product_name":"Quần jeans","quantity":1,"unit_price":700000,"total_price":700000}]',
    datetime('now', '-1 day'), datetime('now', '-1 day')
),
(
    'order-003', 'default', 'store-001', 'Lê Văn C', 'levanc@email.com', '0903456789',
    'ON240003', 'shipped', 'paid', 'e_wallet', 300000,
    25000, 25000, '789 Đường DEF, Quận 7, TP.HCM', 'social_media', 'urgent',
    '[{"product_id":"prod-003","product_name":"Giày sneaker","quantity":1,"unit_price":300000,"total_price":300000}]',
    datetime('now', '-3 days'), datetime('now', '-1 day')
),
(
    'order-004', 'default', 'store-001', 'Phạm Thị D', 'phamthid@email.com', '0904567890',
    'ON240004', 'delivered', 'paid', 'cod', 1200000,
    0, 100000, '321 Đường GHI, Quận 5, TP.HCM', 'marketplace', 'normal',
    '[{"product_id":"prod-004","product_name":"Laptop","quantity":1,"unit_price":1200000,"total_price":1200000}]',
    datetime('now', '-5 days'), datetime('now', '-2 days')
),
(
    'order-005', 'default', 'store-001', 'Hoàng Văn E', 'hoangvane@email.com', '0905678901',
    'ON240005', 'cancelled', 'refunded', 'online_banking', 450000,
    40000, 0, '654 Đường JKL, Quận 10, TP.HCM', 'website', 'low',
    '[{"product_id":"prod-005","product_name":"Điện thoại","quantity":1,"unit_price":450000,"total_price":450000}]',
    datetime('now', '-1 week'), datetime('now', '-5 days')
);

-- Insert corresponding order items
INSERT OR IGNORE INTO online_order_items (
    id, order_id, product_id, product_name, product_sku,
    quantity, unit_price, total_price, discount_amount
) VALUES
('item-001', 'order-001', 'prod-001', 'Áo sơ mi', 'ASM001', 2, 200000, 400000, 0),
('item-002', 'order-002', 'prod-002', 'Quần jeans', 'QJ002', 1, 700000, 700000, 0),
('item-003', 'order-003', 'prod-003', 'Giày sneaker', 'GS003', 1, 300000, 300000, 0),
('item-004', 'order-004', 'prod-004', 'Laptop', 'LT004', 1, 1200000, 1200000, 0),
('item-005', 'order-005', 'prod-005', 'Điện thoại', 'DT005', 1, 450000, 450000, 0);