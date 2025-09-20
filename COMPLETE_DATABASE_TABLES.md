# 📊 DANH SÁCH ĐẦY ĐỦ CÁC BẢNG DATABASE SMARTPOS

## 🗄️ Tổng quan: **20 bảng chính** + **2 views** + **4 triggers**

---

## 🔐 **1. USERS & AUTHENTICATION (3 bảng)**

### 👤 **users** - Tài khoản người dùng
```sql
CREATE TABLE users (
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
```

### 🎭 **roles** - Vai trò hệ thống (Optional)
```sql
CREATE TABLE roles (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    permissions TEXT, -- JSON array: ["read_products", "write_orders"]
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now'))
);
```

### 🔗 **user_roles** - Mapping user-role (Optional)
```sql
CREATE TABLE user_roles (
    user_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    assigned_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);
```

---

## 🏪 **2. STORES & BUSINESS (1 bảng)**

### 🏢 **stores** - Thông tin cửa hàng
```sql
CREATE TABLE stores (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    tax_number TEXT,
    business_license TEXT,
    logo_url TEXT, -- R2 storage URL
    timezone TEXT DEFAULT 'Asia/Ho_Chi_Minh',
    currency TEXT DEFAULT 'VND',
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
```

---

## 📦 **3. PRODUCT MANAGEMENT (6 bảng)**

### 📂 **categories** - Danh mục sản phẩm
```sql
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    parent_id TEXT, -- Hỗ trợ cây danh mục
    image_url TEXT, -- R2 storage URL
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);
```

### 🏷️ **brands** - Thương hiệu
```sql
CREATE TABLE brands (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    website TEXT,
    logo_url TEXT, -- R2 storage URL
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
```

### 🚛 **suppliers** - Nhà cung cấp
```sql
CREATE TABLE suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    tax_number TEXT,
    payment_terms TEXT,
    credit_limit_cents INTEGER DEFAULT 0, -- Hạn mức tín dụng (VND cents)
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
```

### 📦 **products** - Sản phẩm chính (D1 Optimized)
```sql
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    barcode TEXT UNIQUE,
    description TEXT,

    -- 💰 D1 OPTIMIZED: Giá bằng INTEGER cents
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0), -- VND x 100
    cost_price_cents INTEGER NOT NULL CHECK (cost_price_cents >= 0), -- VND x 100

    -- 📊 Kho hàng
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    min_stock INTEGER DEFAULT 0 CHECK (min_stock >= 0),
    max_stock INTEGER DEFAULT 1000 CHECK (max_stock >= min_stock),

    -- 📏 Chi tiết sản phẩm
    unit TEXT DEFAULT 'piece',
    weight_grams INTEGER, -- Trọng lượng (gram)
    dimensions TEXT, -- JSON: {"length": 100, "width": 50, "height": 20} (mm)

    -- 🔗 Liên kết
    category_id TEXT,
    brand_id TEXT,
    supplier_id TEXT,
    store_id TEXT DEFAULT 'store-1',

    -- 🖼️ Media & Status
    image_url TEXT, -- Primary image R2 URL
    images TEXT, -- JSON array of additional image URLs
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    is_serialized INTEGER DEFAULT 0 CHECK (is_serialized IN (0, 1)),

    -- ⚡ Denormalized fields cho performance
    category_name TEXT, -- Từ categories.name
    brand_name TEXT,    -- Từ brands.name

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (brand_id) REFERENCES brands(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (store_id) REFERENCES stores(id)
);
```

### 🎨 **product_variants** - Biến thể sản phẩm
```sql
CREATE TABLE product_variants (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    variant_name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    cost_price_cents INTEGER NOT NULL CHECK (cost_price_cents >= 0),
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    attributes TEXT, -- JSON: {"color": "red", "size": "L"}
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

### 🏷️ **serial_numbers** - Số serial (bảo hành)
```sql
CREATE TABLE serial_numbers (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    variant_id TEXT,
    serial_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'sold', 'returned', 'defective')),
    batch_number TEXT,
    purchase_date TEXT, -- ISO 8601 format
    sale_date TEXT,     -- ISO 8601 format
    customer_id TEXT,
    warranty_start_date TEXT, -- ISO 8601 format
    warranty_end_date TEXT,   -- ISO 8601 format
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

---

## 👥 **4. CUSTOMERS & LOYALTY (2 bảng)**

### 👤 **customers** - Khách hàng (D1 Optimized)
```sql
CREATE TABLE customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    date_of_birth TEXT, -- ISO 8601: '1990-05-15'
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    customer_type TEXT DEFAULT 'regular' CHECK (customer_type IN ('regular', 'vip', 'wholesale')),

    -- 💰 D1 OPTIMIZED: Monetary values as INTEGER cents
    loyalty_points INTEGER DEFAULT 0 CHECK (loyalty_points >= 0),
    total_spent_cents INTEGER DEFAULT 0 CHECK (total_spent_cents >= 0),

    visit_count INTEGER DEFAULT 0 CHECK (visit_count >= 0),
    last_visit TEXT, -- ISO 8601 format
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
```

### 🎁 **loyalty_points_history** - Lịch sử điểm thưởng
```sql
CREATE TABLE loyalty_points_history (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    points INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earned', 'redeemed', 'expired', 'adjustment')),
    reference_id TEXT, -- order_id hoặc transaction_id
    reference_type TEXT,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);
```

---

## 🧾 **5. ORDERS & SALES (4 bảng)**

### 💳 **payment_methods** - Phương thức thanh toán
```sql
CREATE TABLE payment_methods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    fee_percentage REAL DEFAULT 0, -- Phí xử lý %
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now'))
);
```

### 🛒 **orders** - Đơn hàng/Hóa đơn (D1 Optimized)
```sql
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    customer_id TEXT,
    user_id TEXT NOT NULL,
    store_id TEXT NOT NULL,

    -- 📊 Trạng thái đơn hàng
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'completed', 'cancelled', 'refunded')),

    -- 💰 D1 OPTIMIZED: Tất cả giá tiền bằng INTEGER cents
    subtotal_cents INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0),
    discount_cents INTEGER DEFAULT 0 CHECK (discount_cents >= 0),
    tax_cents INTEGER DEFAULT 0 CHECK (tax_cents >= 0),
    total_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_cents >= 0),

    notes TEXT,
    receipt_printed INTEGER DEFAULT 0 CHECK (receipt_printed IN (0, 1)),

    -- ⚡ Denormalized customer info cho fast queries
    customer_name TEXT,
    customer_phone TEXT,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (store_id) REFERENCES stores(id)
);
```

### 📋 **order_items** - Chi tiết đơn hàng
```sql
CREATE TABLE order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    variant_id TEXT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),

    -- 💰 D1 OPTIMIZED: Giá bằng cents
    unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
    total_price_cents INTEGER NOT NULL CHECK (total_price_cents >= 0),
    discount_cents INTEGER DEFAULT 0 CHECK (discount_cents >= 0),

    -- ⚡ Denormalized product info
    product_name TEXT,
    product_sku TEXT,

    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id)
);
```

### 💰 **payments** - Thanh toán
```sql
CREATE TABLE payments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    payment_method_id TEXT NOT NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0), -- Số tiền cents
    reference TEXT, -- Transaction reference từ payment gateway
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    processed_at TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
);
```

---

## 📊 **6. INVENTORY MANAGEMENT (3 bảng)**

### 📦 **inventory_movements** - Xuất nhập kho
```sql
CREATE TABLE inventory_movements (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    variant_id TEXT,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('in', 'out', 'adjustment', 'transfer')),
    quantity INTEGER NOT NULL,
    unit_cost_cents INTEGER, -- Giá nhập/xuất per unit (cents)
    reference_id TEXT, -- order_id, purchase_order_id, etc.
    reference_type TEXT, -- 'order', 'purchase', 'adjustment', 'transfer'
    reason TEXT,
    notes TEXT,
    user_id TEXT,
    store_id TEXT,

    -- ⚡ Denormalized product info cho báo cáo
    product_name TEXT,
    product_sku TEXT,

    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (store_id) REFERENCES stores(id)
);
```

### 📋 **stock_check_sessions** - Phiên kiểm kê
```sql
CREATE TABLE stock_check_sessions (
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
```

### 📝 **stock_check_items** - Chi tiết kiểm kê
```sql
CREATE TABLE stock_check_items (
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
```

---

## 🎯 **7. PROMOTIONS & MARKETING (2 bảng)**

### 🏷️ **promotions** - Khuyến mãi
```sql
CREATE TABLE promotions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'buy_x_get_y')),
    value_cents INTEGER NOT NULL CHECK (value_cents >= 0), -- Cho fixed_amount, lưu bằng cents
    value_percentage REAL, -- Cho percentage discounts (0-100)
    min_amount_cents INTEGER DEFAULT 0 CHECK (min_amount_cents >= 0),
    max_discount_cents INTEGER,
    start_date TEXT, -- ISO 8601 format
    end_date TEXT,   -- ISO 8601 format
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    applicable_to TEXT DEFAULT 'all' CHECK (applicable_to IN ('all', 'categories', 'products', 'customers')),
    conditions TEXT, -- JSON cho điều kiện phức tạp
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
```

### 📊 **promotion_usage** - Lịch sử sử dụng khuyến mãi
```sql
CREATE TABLE promotion_usage (
    id TEXT PRIMARY KEY,
    promotion_id TEXT NOT NULL,
    order_id TEXT NOT NULL,
    customer_id TEXT,
    discount_cents INTEGER NOT NULL CHECK (discount_cents >= 0),
    used_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (promotion_id) REFERENCES promotions(id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

---

## 💰 **8. TAX & FINANCE (1 bảng)**

### 🧾 **tax_rates** - Thuế
```sql
CREATE TABLE tax_rates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    rate_percentage REAL NOT NULL CHECK (rate_percentage >= 0 AND rate_percentage <= 100),
    description TEXT,
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
```

---

## ⚙️ **9. SYSTEM & CONFIGURATION (2 bảng)**

### 🔧 **settings** - Cài đặt hệ thống
```sql
CREATE TABLE settings (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    data_type TEXT DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    is_public INTEGER DEFAULT 0 CHECK (is_public IN (0, 1)), -- 0 = admin only, 1 = public
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
```

### 🔐 **user_sessions** - Phiên đăng nhập
```sql
CREATE TABLE user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT UNIQUE NOT NULL,
    device_info TEXT, -- JSON với thông tin device
    ip_address TEXT,
    expires_at TEXT NOT NULL, -- ISO 8601 format
    last_activity TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 📝 **10. AUDIT & LOGGING (1 bảng)**

### 📋 **audit_logs** - Log audit
```sql
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id TEXT,
    old_values TEXT, -- JSON string
    new_values TEXT, -- JSON string
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 👁️ **11. PERFORMANCE VIEWS (2 views)**

### 📊 **v_products_summary** - Tổng hợp sản phẩm
```sql
CREATE VIEW v_products_summary AS
SELECT
    p.id, p.name, p.sku, p.barcode, p.price_cents, p.cost_price_cents,
    p.stock, p.min_stock, p.category_name, p.brand_name, p.is_active,
    c.name as category_full_name, b.name as brand_full_name, s.name as supplier_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN suppliers s ON p.supplier_id = s.id;
```

### 🧾 **v_orders_summary** - Tổng hợp đơn hàng
```sql
CREATE VIEW v_orders_summary AS
SELECT
    o.id, o.order_number, o.customer_name, o.customer_phone,
    o.total_cents, o.status, o.created_at,
    u.full_name as cashier_name, s.name as store_name
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN stores s ON o.store_id = s.id;
```

---

## ⚡ **12. DATABASE TRIGGERS (4 triggers)**

### 🔄 **update_stock_on_inventory_movement**
- Tự động cập nhật stock khi có inventory movement

### 👤 **update_customer_stats_on_order**
- Cập nhật thống kê khách hàng khi hoàn thành đơn hàng

### 🔢 **generate_order_number**
- Tự động tạo số đơn hàng

### ⚡ **update_product_denormalized_fields**
- Cập nhật các field denormalized khi thay đổi

---

## 📊 **TỔNG KẾT DATABASE**

### 📈 **Thống kê:**
- **20 bảng chính**
- **2 performance views**
- **4 triggers tự động**
- **30+ indexes** cho performance
- **Foreign keys** đầy đủ
- **CHECK constraints** cho data validation

### 💰 **Pricing Strategy:**
- **Tất cả giá tiền** lưu bằng **INTEGER cents**
- **VND**: 50,000 ₫ = 5,000,000 cents
- **Precision**: 100% chính xác, không mất độ chính xác

### ⚡ **Performance Features:**
- **Denormalized fields** cho fast queries
- **Strategic indexes** cho common operations
- **Composite indexes** cho complex queries
- **Views** cho reporting

### 🔒 **Security:**
- **Audit logging** đầy đủ
- **Session management**
- **Role-based access control**
- **Data validation** với CHECK constraints

### 🚀 **D1 Optimized:**
- **SQLite compatible** 100%
- **No explicit transactions**
- **Efficient data types**
- **Serverless ready**

---

**✅ Database hoàn chỉnh, production-ready cho SmartPOS trên Cloudflare D1!**