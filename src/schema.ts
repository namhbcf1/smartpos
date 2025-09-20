export const schema = `-- ===================================================================
-- SMART POS - D1 OPTIMIZED DATABASE SCHEMA
-- Version: 3.0.0 - D1 Production Optimized
-- Date: 2025-09-19
-- Fully optimized for Cloudflare D1 serverless architecture
-- Backend TypeScript Export
-- ===================================================================

-- ===================================================================
-- D1 OPTIMIZATION SETTINGS
-- ===================================================================
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;

-- ===================================================================
-- 1. USERS & AUTHENTICATION
-- ===================================================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'cashier', 'employee')),
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    last_login TEXT, -- ISO 8601 format: '2025-09-19T10:30:00Z'
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

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
-- 2. STORES & BUSINESS INFORMATION
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
    timezone TEXT DEFAULT 'Asia/Ho_Chi_Minh', -- Múi giờ (detailed schema)
    currency TEXT DEFAULT 'VND', -- Đơn vị tiền tệ (detailed schema)
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ===================================================================
-- 3. PRODUCT MANAGEMENT
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

CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    tax_number TEXT,
    payment_terms TEXT,
    credit_limit_cents INTEGER DEFAULT 0 CHECK (credit_limit_cents >= 0), -- VND x 100
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- D1 Optimized Products with denormalized fields and precision pricing
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    barcode TEXT UNIQUE,
    description TEXT,

    -- D1 OPTIMIZED: Use INTEGER cents for precision (VND x 100)
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0), -- VND x 100
    cost_price_cents INTEGER NOT NULL CHECK (cost_price_cents >= 0), -- VND x 100

    -- Inventory
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    min_stock INTEGER DEFAULT 0 CHECK (min_stock >= 0),
    max_stock INTEGER DEFAULT 1000 CHECK (max_stock >= min_stock),
    unit TEXT DEFAULT 'piece',

    -- Physical attributes
    weight_grams INTEGER, -- Weight in grams (detailed schema standard)
    dimensions TEXT, -- JSON: {"length": 10, "width": 5, "height": 2}

    -- Categories and relationships
    category_id TEXT,
    brand_id TEXT,
    supplier_id TEXT,
    store_id TEXT DEFAULT 'store-1', -- FK → stores.id (detailed schema)

    -- Media
    image_url TEXT,
    images TEXT, -- JSON array of image URLs

    -- Status and features
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    is_serialized INTEGER DEFAULT 0 CHECK (is_serialized IN (0, 1)),

    -- D1 DENORMALIZED: Performance optimization per detailed schema
    category_name TEXT, -- Denormalized from categories.name
    brand_name TEXT, -- Denormalized from brands.name

    -- Timestamps
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),

    -- Foreign keys
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (brand_id) REFERENCES brands(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (store_id) REFERENCES stores(id)
);

CREATE TABLE IF NOT EXISTS product_variants (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    variant_name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,

    -- D1 OPTIMIZED: Use INTEGER cents for precision
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0), -- VND x 100
    cost_price_cents INTEGER NOT NULL CHECK (cost_price_cents >= 0), -- VND x 100

    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    attributes TEXT, -- JSON: {"color": "red", "size": "L"}
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

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
-- 4. CUSTOMERS & LOYALTY
-- ===================================================================
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    date_of_birth TEXT,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    customer_type TEXT DEFAULT 'regular' CHECK (customer_type IN ('regular', 'vip', 'wholesale')),
    loyalty_points INTEGER DEFAULT 0 CHECK (loyalty_points >= 0),

    -- D1 OPTIMIZED: Use INTEGER cents for precision
    total_spent_cents INTEGER DEFAULT 0 CHECK (total_spent_cents >= 0), -- VND x 100

    visit_count INTEGER DEFAULT 0 CHECK (visit_count >= 0),
    last_visit TEXT, -- Lần mua cuối (ISO 8601) - detailed schema
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS loyalty_points_history (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    points INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earned', 'redeemed', 'expired', 'adjustment')),
    reference_id TEXT, -- order_id, etc.
    reference_type TEXT, -- 'order', 'manual', etc.
    description TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- ===================================================================
-- 5. ORDERS & SALES MANAGEMENT
-- ===================================================================

CREATE TABLE IF NOT EXISTS payment_methods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    fee_percentage REAL DEFAULT 0, -- Phí xử lý (%) - detailed schema
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now'))
);

-- D1 Optimized Orders with denormalized fields
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    customer_id TEXT,
    user_id TEXT NOT NULL,
    store_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'completed', 'cancelled', 'refunded')),

    -- D1 OPTIMIZED: Use INTEGER cents for precision
    subtotal_cents INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0), -- VND x 100
    discount_cents INTEGER DEFAULT 0 CHECK (discount_cents >= 0), -- VND x 100
    tax_cents INTEGER DEFAULT 0 CHECK (tax_cents >= 0), -- VND x 100
    total_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_cents >= 0), -- VND x 100

    notes TEXT,
    receipt_printed INTEGER DEFAULT 0 CHECK (receipt_printed IN (0, 1)),

    -- D1 DENORMALIZED: Performance optimization
    customer_name TEXT, -- Denormalized from customers.name
    customer_phone TEXT, -- Denormalized từ customers.phone - detailed schema
    user_name TEXT, -- Denormalized from users.full_name

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (store_id) REFERENCES stores(id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    variant_id TEXT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),

    -- D1 OPTIMIZED: Use INTEGER cents for precision
    unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0), -- VND x 100
    total_price_cents INTEGER NOT NULL CHECK (total_price_cents >= 0), -- VND x 100
    discount_cents INTEGER DEFAULT 0 CHECK (discount_cents >= 0), -- VND x 100

    -- D1 DENORMALIZED: Performance optimization
    product_name TEXT NOT NULL, -- Denormalized from products.name
    product_sku TEXT NOT NULL, -- Denormalized from products.sku

    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id)
);

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    payment_method_id TEXT NOT NULL,

    -- D1 OPTIMIZED: Use INTEGER cents for precision
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0), -- VND x 100

    reference TEXT, -- Transaction ID from payment gateway
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    processed_at TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
);

-- ===================================================================
-- 6. INVENTORY MANAGEMENT
-- ===================================================================

CREATE TABLE IF NOT EXISTS inventory_movements (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    variant_id TEXT,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('in', 'out', 'adjustment', 'transfer')),
    quantity INTEGER NOT NULL,

    -- D1 OPTIMIZED: Use INTEGER cents for precision
    unit_cost_cents INTEGER, -- VND x 100

    reference_id TEXT, -- order_id, purchase_order_id, etc.
    reference_type TEXT, -- 'order', 'purchase', 'adjustment', etc.
    reason TEXT,
    notes TEXT,
    user_id TEXT,
    store_id TEXT,

    -- D1 DENORMALIZED: Performance optimization
    product_name TEXT, -- Denormalized from products.name
    product_sku TEXT, -- Denormalized from products.sku

    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (store_id) REFERENCES stores(id)
);

CREATE TABLE IF NOT EXISTS stock_check_sessions (
    id TEXT PRIMARY KEY,
    session_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
    store_id TEXT,
    started_at TEXT DEFAULT (datetime('now')),
    ended_at TEXT,
    items_count INTEGER DEFAULT 0,
    items_checked INTEGER DEFAULT 0,
    discrepancies_found INTEGER DEFAULT 0,
    created_by TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS stock_check_items (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    variant_id TEXT,
    expected_quantity INTEGER NOT NULL DEFAULT 0,
    actual_quantity INTEGER,
    discrepancy INTEGER DEFAULT 0,
    notes TEXT,
    checked_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES stock_check_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id)
);

-- ===================================================================
-- 7. PROMOTIONS & DISCOUNTS
-- ===================================================================

CREATE TABLE IF NOT EXISTS promotions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'buy_x_get_y')),

    -- D1 OPTIMIZED: Use INTEGER cents for fixed_amount type
    value_cents INTEGER NOT NULL CHECK (value_cents >= 0), -- VND x 100 for fixed_amount type
    value_percentage REAL, -- Giá trị % (0-100 cho percentage) - detailed schema
    min_amount_cents INTEGER DEFAULT 0 CHECK (min_amount_cents >= 0), -- VND x 100
    max_discount_cents INTEGER, -- VND x 100

    start_date TEXT,
    end_date TEXT,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    applicable_to TEXT DEFAULT 'all' CHECK (applicable_to IN ('all', 'categories', 'products', 'customers')),
    conditions TEXT, -- JSON conditions
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS promotion_usage (
    id TEXT PRIMARY KEY,
    promotion_id TEXT NOT NULL,
    order_id TEXT NOT NULL,
    customer_id TEXT,

    -- D1 OPTIMIZED: Use INTEGER cents for precision
    discount_cents INTEGER NOT NULL CHECK (discount_cents >= 0), -- VND x 100

    used_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (promotion_id) REFERENCES promotions(id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- ===================================================================
-- 8. TAX & FINANCE
-- ===================================================================

CREATE TABLE IF NOT EXISTS tax_rates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    rate_percentage REAL NOT NULL CHECK (rate_percentage >= 0 AND rate_percentage <= 100), -- Percentage: 10.0 = 10% (detailed schema)
    description TEXT,
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ===================================================================
-- 9. SYSTEM SETTINGS & CONFIGURATION
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

CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT UNIQUE NOT NULL,
    device_info TEXT,
    ip_address TEXT,
    expires_at TEXT NOT NULL,
    last_activity TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===================================================================
-- 10. AUDIT & LOGGING
-- ===================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id TEXT,
    old_values TEXT, -- JSON
    new_values TEXT, -- JSON
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ===================================================================
-- D1 OPTIMIZED INDEXES
-- ===================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Products indexes (D1 optimized)
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_price_cents ON products(price_cents);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);

-- Orders indexes (D1 optimized)
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_total_cents ON orders(total_cents);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_customer_type ON customers(customer_type);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ===================================================================
-- D1 OPTIMIZED TRIGGERS
-- ===================================================================

-- Update denormalized fields when category name changes
CREATE TRIGGER IF NOT EXISTS update_products_category_name
AFTER UPDATE OF name ON categories
FOR EACH ROW
BEGIN
    UPDATE products
    SET category_name = NEW.name, updated_at = datetime('now')
    WHERE category_id = NEW.id;
END;

-- Update denormalized fields when supplier name changes
CREATE TRIGGER IF NOT EXISTS update_products_supplier_name
AFTER UPDATE OF name ON suppliers
FOR EACH ROW
BEGIN
    UPDATE products
    SET supplier_name = NEW.name, updated_at = datetime('now')
    WHERE supplier_id = NEW.id;
END;

-- Auto-update inventory on order completion
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

    -- Update variant stock if applicable
    UPDATE product_variants
    SET stock = CASE
        WHEN NEW.transaction_type = 'in' THEN stock + NEW.quantity
        WHEN NEW.transaction_type = 'out' THEN stock - NEW.quantity
        WHEN NEW.transaction_type = 'adjustment' THEN NEW.quantity
        ELSE stock
    END,
    updated_at = datetime('now')
    WHERE id = NEW.variant_id AND NEW.variant_id IS NOT NULL;
END;

-- Update customer statistics when order is completed
CREATE TRIGGER IF NOT EXISTS update_customer_stats_on_order
AFTER UPDATE ON orders
FOR EACH ROW
WHEN NEW.status = 'completed' AND OLD.status != 'completed'
BEGIN
    UPDATE customers
    SET total_spent_cents = total_spent_cents + NEW.total_cents,
        visit_count = visit_count + 1,
        last_visit = NEW.created_at, -- Update last visit time - detailed schema
        updated_at = datetime('now')
    WHERE id = NEW.customer_id AND NEW.customer_id IS NOT NULL;
END;

-- Auto-generate order numbers
CREATE TRIGGER IF NOT EXISTS generate_order_number
AFTER INSERT ON orders
FOR EACH ROW
WHEN NEW.order_number IS NULL OR NEW.order_number = ''
BEGIN
    UPDATE orders
    SET order_number = 'ORD-' || strftime('%Y%m%d', NEW.created_at) || '-' ||
                       printf('%06d', (SELECT COUNT(*) FROM orders WHERE date(created_at) = date(NEW.created_at)))
    WHERE id = NEW.id;
END;

-- ===================================================================
-- D1 VIEWS FOR ANALYTICS (Optional)
-- ===================================================================

-- Product performance view
CREATE VIEW IF NOT EXISTS view_product_performance AS
SELECT
    p.id,
    p.name,
    p.sku,
    p.price_cents,
    p.cost_price_cents,
    p.stock,
    p.category_name,
    COALESCE(SUM(oi.quantity), 0) as total_sold,
    COALESCE(SUM(oi.total_price_cents), 0) as total_revenue_cents,
    COALESCE(COUNT(DISTINCT oi.order_id), 0) as order_count
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'completed'
GROUP BY p.id, p.name, p.sku, p.price_cents, p.cost_price_cents, p.stock, p.category_name;

-- Daily sales summary view
CREATE VIEW IF NOT EXISTS view_daily_sales AS
SELECT
    date(created_at) as sale_date,
    COUNT(*) as order_count,
    SUM(total_cents) as total_revenue_cents,
    SUM(tax_cents) as total_tax_cents,
    AVG(total_cents) as avg_order_value_cents
FROM orders
WHERE status = 'completed'
GROUP BY date(created_at)
ORDER BY sale_date DESC;

-- Views từ detailed schema specification
CREATE VIEW IF NOT EXISTS v_products_summary AS
SELECT
    id,
    name,
    sku,
    barcode,
    price_cents,
    cost_price_cents,
    stock,
    min_stock,
    category_name,
    brand_name,
    is_active,
    category_name as category_full_name,
    brand_name as brand_full_name,
    supplier_name
FROM products;

CREATE VIEW IF NOT EXISTS v_orders_summary AS
SELECT
    id,
    order_number,
    customer_name,
    customer_phone,
    total_cents,
    status,
    created_at,
    user_name as cashier_name,
    'Smart POS Store' as store_name
FROM orders;

-- ===================================================================
-- PRODUCTION DATA INITIALIZATION
-- ===================================================================

-- Insert default store
INSERT OR IGNORE INTO stores (id, name, address, phone, email, tax_number)
VALUES ('store-1', 'Smart POS Store', '123 Business Street', '+84901234567', 'store@smartpos.com', 'TAX123456789');

-- Insert default payment methods
INSERT OR IGNORE INTO payment_methods (id, name, code) VALUES
('pm-cash', 'Tiền mặt', 'cash'),
('pm-card', 'Thẻ', 'card'),
('pm-transfer', 'Chuyển khoản', 'transfer'),
('pm-momo', 'MoMo', 'momo'),
('pm-vnpay', 'VNPay', 'vnpay');

-- Insert default tax rate
INSERT OR IGNORE INTO tax_rates (id, name, rate, description)
VALUES ('tax-vat', 'VAT', 10.0, 'Value Added Tax');

-- Insert default categories
INSERT OR IGNORE INTO categories (id, name, description) VALUES
('cat-electronics', 'Điện tử', 'Thiết bị điện tử và phụ kiện'),
('cat-clothing', 'Thời trang', 'Quần áo và phụ kiện thời trang'),
('cat-food', 'Thực phẩm', 'Thực phẩm và đồ uống'),
('cat-books', 'Sách', 'Sách và tài liệu học tập'),
('cat-home', 'Gia dụng', 'Đồ gia dụng và nội thất');

-- Insert default admin user (password: admin123)
INSERT OR IGNORE INTO users (id, username, email, password_hash, full_name, role)
VALUES ('user-admin', 'admin', 'admin@smartpos.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'admin');

-- Insert essential settings
INSERT OR IGNORE INTO settings (key, value, description, category) VALUES
('pos_name', 'Smart POS', 'Tên hệ thống POS', 'general'),
('currency', 'VND', 'Đơn vị tiền tệ', 'general'),
('tax_rate', '10', 'Thuế VAT mặc định (%)', 'finance'),
('receipt_footer', 'Cảm ơn quý khách!', 'Footer cho hóa đơn', 'receipt'),
('low_stock_threshold', '10', 'Ngưỡng cảnh báo hết hàng', 'inventory');

-- ===================================================================
-- SCHEMA COMPLETE
-- ===================================================================
`;