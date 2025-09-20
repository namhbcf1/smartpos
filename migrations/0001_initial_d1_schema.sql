-- ===================================================================
-- CLOUDFLARE D1 INITIAL MIGRATION
-- Version: 1.0.0 - D1 Optimized Schema
-- Date: 2025-09-19
-- Description: Initial D1 database setup with optimized schema
-- ===================================================================

-- Enable D1 optimizations
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;

-- ===================================================================
-- 1. STORES (Create first due to dependencies)
-- ===================================================================
CREATE TABLE IF NOT EXISTS stores (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    tax_number TEXT,
    business_license TEXT,
    logo_url TEXT,
    timezone TEXT DEFAULT 'Asia/Ho_Chi_Minh', -- Required per detailed schema
    currency TEXT DEFAULT 'VND', -- Required per detailed schema
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ===================================================================
-- 2. USERS & AUTHENTICATION
-- ===================================================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'cashier', 'employee')),
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    last_login TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ===================================================================
-- 3. ROLES & PERMISSIONS (Optional system)
-- ===================================================================
CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    permissions TEXT, -- JSON array: ["read_products", "write_orders"]
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    assigned_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- ===================================================================
-- 4. PRODUCT CATEGORIES
-- ===================================================================
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    parent_id TEXT,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);

-- ===================================================================
-- 5. BRANDS
-- ===================================================================
CREATE TABLE IF NOT EXISTS brands (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    website TEXT,
    logo_url TEXT,
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ===================================================================
-- 6. SUPPLIERS
-- ===================================================================
CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    tax_number TEXT,
    payment_terms TEXT,
    credit_limit_cents INTEGER DEFAULT 0 CHECK (credit_limit_cents >= 0),
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ===================================================================
-- 7. PRODUCTS (D1 Optimized with cents pricing)
-- ===================================================================
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    barcode TEXT UNIQUE,
    description TEXT,

    -- D1 OPTIMIZED: INTEGER cents pricing (VND x 100)
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    cost_price_cents INTEGER NOT NULL CHECK (cost_price_cents >= 0),

    -- Inventory
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    min_stock INTEGER DEFAULT 0 CHECK (min_stock >= 0),
    max_stock INTEGER DEFAULT 1000 CHECK (max_stock >= min_stock),
    unit TEXT DEFAULT 'piece',

    -- Physical attributes
    weight_grams INTEGER CHECK (weight_grams >= 0),
    dimensions TEXT, -- JSON: {"length": 10, "width": 5, "height": 2}

    -- Foreign keys
    category_id TEXT,
    brand_id TEXT,
    supplier_id TEXT,
    store_id TEXT DEFAULT 'store-1',

    -- Media
    image_url TEXT,
    images TEXT, -- JSON array of URLs

    -- D1 DENORMALIZED: Performance optimization per detailed schema
    category_name TEXT, -- Denormalized from categories.name
    brand_name TEXT, -- Denormalized from brands.name

    -- Status
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    is_serialized INTEGER DEFAULT 0 CHECK (is_serialized IN (0, 1)),

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (brand_id) REFERENCES brands(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (store_id) REFERENCES stores(id)
);

-- ===================================================================
-- 7A. PRODUCT VARIANTS
-- ===================================================================
CREATE TABLE IF NOT EXISTS product_variants (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    variant_name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,

    -- D1 OPTIMIZED: INTEGER cents pricing (VND x 100)
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    cost_price_cents INTEGER NOT NULL CHECK (cost_price_cents >= 0),

    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    attributes TEXT, -- JSON: {"color": "red", "size": "L"}
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ===================================================================
-- 7B. SERIAL NUMBERS
-- ===================================================================
CREATE TABLE IF NOT EXISTS serial_numbers (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    variant_id TEXT,
    serial_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'sold', 'returned', 'defective')),
    batch_number TEXT,
    purchase_date TEXT,
    sale_date TEXT,
    customer_id TEXT,
    warranty_start_date TEXT,
    warranty_end_date TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- ===================================================================
-- 8. CUSTOMERS
-- ===================================================================
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    date_of_birth TEXT, -- Ngày sinh (ISO 8601: '1990-05-15')
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    customer_type TEXT DEFAULT 'regular' CHECK (customer_type IN ('regular', 'vip', 'wholesale')),
    loyalty_points INTEGER DEFAULT 0 CHECK (loyalty_points >= 0),
    total_spent_cents INTEGER DEFAULT 0 CHECK (total_spent_cents >= 0),
    visit_count INTEGER DEFAULT 0 CHECK (visit_count >= 0),
    last_visit TEXT, -- Lần mua cuối (ISO 8601)
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ===================================================================
-- 8A. LOYALTY POINTS HISTORY
-- ===================================================================
CREATE TABLE IF NOT EXISTS loyalty_points_history (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    points INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earned', 'redeemed', 'expired', 'adjustment')),
    reference_id TEXT, -- order_id hoặc transaction_id
    reference_type TEXT, -- Loại reference
    description TEXT, -- Mô tả giao dịch
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- ===================================================================
-- 9. PAYMENT METHODS
-- ===================================================================
CREATE TABLE IF NOT EXISTS payment_methods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    fee_percentage REAL DEFAULT 0, -- Phí xử lý (%)
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now'))
);

-- ===================================================================
-- 10. ORDERS (D1 Optimized with cents pricing)
-- ===================================================================
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    customer_id TEXT,
    user_id TEXT NOT NULL,
    store_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'completed', 'cancelled', 'refunded')),
    subtotal_cents INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0),
    discount_cents INTEGER DEFAULT 0 CHECK (discount_cents >= 0),
    tax_cents INTEGER DEFAULT 0 CHECK (tax_cents >= 0),
    total_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
    notes TEXT,
    receipt_printed INTEGER DEFAULT 0 CHECK (receipt_printed IN (0, 1)), -- 0=chưa in, 1=đã in
    customer_name TEXT, -- Denormalized từ customers.name
    customer_phone TEXT, -- Denormalized từ customers.phone
    user_name TEXT, -- Denormalized từ users.full_name
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (store_id) REFERENCES stores(id)
);

-- ===================================================================
-- 11. ORDER ITEMS
-- ===================================================================
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    variant_id TEXT, -- FK → product_variants.id
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0), -- Đơn giá (VND x 100)
    total_price_cents INTEGER NOT NULL CHECK (total_price_cents >= 0), -- Thành tiền (VND x 100)
    discount_cents INTEGER DEFAULT 0 CHECK (discount_cents >= 0), -- Giảm giá (VND x 100)
    product_name TEXT NOT NULL, -- Denormalized từ products.name
    product_sku TEXT NOT NULL, -- Denormalized từ products.sku
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id)
);

-- ===================================================================
-- 11A. PAYMENTS
-- ===================================================================
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    payment_method_id TEXT NOT NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0), -- Số tiền (VND x 100)
    reference TEXT, -- Mã giao dịch từ gateway
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    processed_at TEXT DEFAULT (datetime('now')), -- Thời gian xử lý
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
);

-- ===================================================================
-- 12. INVENTORY MOVEMENTS
-- ===================================================================
CREATE TABLE IF NOT EXISTS inventory_movements (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    variant_id TEXT, -- FK → product_variants.id
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('in', 'out', 'adjustment', 'transfer')),
    quantity INTEGER NOT NULL, -- Số lượng (+/-)
    unit_cost_cents INTEGER, -- Giá nhập/xuất per unit (VND x 100)
    reference_id TEXT, -- order_id, purchase_id, etc.
    reference_type TEXT, -- order/purchase/adjustment/transfer
    reason TEXT, -- Lý do
    notes TEXT, -- Ghi chú
    user_id TEXT, -- FK → users.id
    store_id TEXT, -- FK → stores.id
    product_name TEXT, -- Denormalized từ products.name
    product_sku TEXT, -- Denormalized từ products.sku
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (store_id) REFERENCES stores(id)
);

-- ===================================================================
-- 13. SETTINGS
-- ===================================================================
CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    data_type TEXT DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    is_public INTEGER DEFAULT 0 CHECK (is_public IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ===================================================================
-- D1 OPTIMIZED INDEXES
-- ===================================================================

-- Core indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_price_cents ON products(price_cents);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- ===================================================================
-- ESSENTIAL D1 TRIGGERS
-- ===================================================================

-- Update inventory on movements
CREATE TRIGGER IF NOT EXISTS update_stock_on_inventory_movement
AFTER INSERT ON inventory_movements
FOR EACH ROW
BEGIN
    UPDATE products
    SET stock = CASE
        WHEN NEW.transaction_type = 'in' THEN stock + NEW.quantity
        WHEN NEW.transaction_type = 'out' THEN stock - NEW.quantity
        WHEN NEW.transaction_type = 'adjustment' THEN NEW.quantity
        ELSE stock
    END,
    updated_at = datetime('now')
    WHERE id = NEW.product_id;
END;

-- Update customer stats on order completion
CREATE TRIGGER IF NOT EXISTS update_customer_stats_on_order
AFTER UPDATE ON orders
FOR EACH ROW
WHEN NEW.status = 'completed' AND OLD.status != 'completed'
BEGIN
    UPDATE customers
    SET total_spent_cents = total_spent_cents + NEW.total_cents,
        visit_count = visit_count + 1,
        updated_at = datetime('now')
    WHERE id = NEW.customer_id AND NEW.customer_id IS NOT NULL;
END;

-- ===================================================================
-- INITIAL DATA
-- ===================================================================

-- Default store
INSERT OR IGNORE INTO stores (id, name, address, phone, email, tax_number)
VALUES ('store-1', 'Smart POS Store', '123 Business Street', '+84901234567', 'store@smartpos.com', 'TAX123456789');

-- Default payment methods
INSERT OR IGNORE INTO payment_methods (id, name, code) VALUES
('pm-cash', 'Tiền mặt', 'cash'),
('pm-card', 'Thẻ', 'card'),
('pm-transfer', 'Chuyển khoản', 'transfer'),
('pm-momo', 'MoMo', 'momo'),
('pm-vnpay', 'VNPay', 'vnpay');

-- Default categories
INSERT OR IGNORE INTO categories (id, name, description) VALUES
('cat-electronics', 'Điện tử', 'Thiết bị điện tử và phụ kiện'),
('cat-clothing', 'Thời trang', 'Quần áo và phụ kiện thời trang'),
('cat-food', 'Thực phẩm', 'Thực phẩm và đồ uống'),
('cat-books', 'Sách', 'Sách và tài liệu học tập'),
('cat-home', 'Gia dụng', 'Đồ gia dụng và nội thất');

-- Default admin user (password: admin123)
INSERT OR IGNORE INTO users (id, username, email, password_hash, full_name, role)
VALUES ('user-admin', 'admin', 'admin@smartpos.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'admin');

-- Essential settings
INSERT OR IGNORE INTO settings (key, value, description, category) VALUES
('pos_name', 'Smart POS', 'Tên hệ thống POS', 'general'),
('currency', 'VND', 'Đơn vị tiền tệ', 'general'),
('tax_rate', '10', 'Thuế VAT mặc định (%)', 'finance'),
('receipt_footer', 'Cảm ơn quý khách!', 'Footer cho hóa đơn', 'receipt'),
('low_stock_threshold', '10', 'Ngưỡng cảnh báo hết hàng', 'inventory');