     -- SmartPOS Database Schema
-- Các bảng được thiết kế với tối ưu hiệu năng và ràng buộc toàn vẹn dữ liệu

-- Bảng người dùng
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cashier', 'inventory', 'sales_agent', 'affiliate')),
  store_id INTEGER NOT NULL,
  avatar_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (store_id) REFERENCES stores(id)
);

-- Bảng cửa hàng
CREATE TABLE IF NOT EXISTS stores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  tax_number TEXT,
  is_main INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Bảng khách hàng
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  birthday DATE,
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  customer_group TEXT NOT NULL DEFAULT 'regular' CHECK (customer_group IN ('regular', 'vip', 'wholesale', 'business')),
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  deleted_at DATETIME
);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_group ON customers(customer_group);

-- Bảng danh mục sản phẩm
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  parent_id INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  deleted_at DATETIME,
  FOREIGN KEY (parent_id) REFERENCES categories(id)
);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);

-- Bảng sản phẩm (Enhanced with comprehensive fields)
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT UNIQUE,
  category_id INTEGER NOT NULL,

  -- Pricing information
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  discount_eligible INTEGER NOT NULL DEFAULT 1,

  -- Inventory management
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  stock_alert_threshold INTEGER NOT NULL DEFAULT 5,
  min_stock_level INTEGER NOT NULL DEFAULT 0,
  max_stock_level INTEGER DEFAULT NULL,
  reorder_point INTEGER DEFAULT NULL,
  reorder_quantity INTEGER DEFAULT NULL,

  -- Product details
  brand TEXT,
  model TEXT,
  unit TEXT DEFAULT 'piece',
  weight DECIMAL(8,3) DEFAULT NULL,
  dimensions TEXT,
  color TEXT,
  size TEXT,

  -- Supplier information
  supplier_id INTEGER,
  supplier_sku TEXT,
  supplier_price DECIMAL(10,2),

  -- Warranty information
  warranty_period_months INTEGER DEFAULT 12,
  warranty_type TEXT DEFAULT 'manufacturer',
  warranty_terms TEXT,

  -- Media
  image_url TEXT,
  image_urls TEXT, -- JSON array of multiple images
  video_url TEXT,

  -- SEO and marketing
  meta_title TEXT,
  meta_description TEXT,
  tags TEXT, -- JSON array of tags

  -- Status and flags
  is_active INTEGER NOT NULL DEFAULT 1,
  is_featured INTEGER NOT NULL DEFAULT 0,
  is_digital INTEGER NOT NULL DEFAULT 0,
  requires_shipping INTEGER NOT NULL DEFAULT 1,
  track_quantity INTEGER NOT NULL DEFAULT 1,

  -- Timestamps and audit
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  deleted_at DATETIME,
  created_by INTEGER,
  updated_by INTEGER,

  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at);
-- Product Specifications Table (for flexible attributes)
CREATE TABLE IF NOT EXISTS product_specifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  spec_name TEXT NOT NULL,
  spec_value TEXT NOT NULL,
  spec_type TEXT DEFAULT 'text' CHECK (spec_type IN ('text', 'number', 'boolean', 'date', 'url')),
  display_order INTEGER DEFAULT 0,
  is_searchable INTEGER DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_product_specs_product ON product_specifications(product_id);
CREATE INDEX IF NOT EXISTS idx_product_specs_name ON product_specifications(spec_name);

-- Product Images Table (for multiple images)
CREATE TABLE IF NOT EXISTS product_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  is_primary INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);

-- Product Price History Table (for tracking price changes)
CREATE TABLE IF NOT EXISTS product_price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2) NOT NULL,
  old_cost_price DECIMAL(10,2),
  new_cost_price DECIMAL(10,2),
  change_reason TEXT,
  changed_by INTEGER,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_price_history_product ON product_price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON product_price_history(created_at);

-- Product Stock History Table (for tracking stock changes)
CREATE TABLE IF NOT EXISTS product_stock_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('in', 'out', 'adjustment', 'sale', 'return', 'damage', 'transfer')),
  quantity_before INTEGER NOT NULL,
  quantity_change INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reference_type TEXT, -- 'sale', 'purchase', 'adjustment', etc.
  reference_id INTEGER, -- ID of the related record
  notes TEXT,
  changed_by INTEGER,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_stock_history_product ON product_stock_history(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_date ON product_stock_history(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_history_type ON product_stock_history(change_type);

-- Suppliers Table (for supplier management)
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Vietnam',
  tax_number TEXT,
  payment_terms TEXT,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  deleted_at DATETIME
);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);

-- Bảng đơn hàng
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_number TEXT NOT NULL UNIQUE,
  store_id INTEGER NOT NULL,
  customer_id INTEGER,
  user_id INTEGER NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  final_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'mobile_payment', 'credit')),
  payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'unpaid', 'partial')),
  sale_status TEXT NOT NULL DEFAULT 'completed' CHECK (sale_status IN ('completed', 'returned', 'cancelled')),
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  deleted_at DATETIME,
  FOREIGN KEY (store_id) REFERENCES stores(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_sales_store ON sales(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(sale_status);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status);

-- Bảng chi tiết đơn hàng
CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);

-- Bảng hoàn trả
CREATE TABLE IF NOT EXISTS refunds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'mobile_payment', 'credit')),
  reason TEXT,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (sale_id) REFERENCES sales(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_refunds_sale ON refunds(sale_id);
CREATE INDEX IF NOT EXISTS idx_refunds_user ON refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_refunds_date ON refunds(created_at);

-- Bảng nhà cung cấp đã được định nghĩa ở trên (dòng 217-235)

-- Bảng phiếu nhập kho
CREATE TABLE IF NOT EXISTS stock_ins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference_number TEXT NOT NULL UNIQUE,
  supplier_id INTEGER NOT NULL,
  store_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'unpaid', 'partial')),
  payment_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'mobile_payment', 'credit')),
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (store_id) REFERENCES stores(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_stock_ins_supplier ON stock_ins(supplier_id);
CREATE INDEX IF NOT EXISTS idx_stock_ins_store ON stock_ins(store_id);
CREATE INDEX IF NOT EXISTS idx_stock_ins_user ON stock_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_ins_date ON stock_ins(created_at);

-- Bảng chi tiết phiếu nhập kho
CREATE TABLE IF NOT EXISTS stock_in_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stock_in_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  expiry_date DATE,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (stock_in_id) REFERENCES stock_ins(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
CREATE INDEX IF NOT EXISTS idx_stock_in_items_stock ON stock_in_items(stock_in_id);
CREATE INDEX IF NOT EXISTS idx_stock_in_items_product ON stock_in_items(product_id);

-- Bảng giao dịch tồn kho (theo dõi mọi thay đổi tồn kho)
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  store_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('stock_in', 'stock_out', 'adjustment', 'transfer_in', 'transfer_out', 'sale', 'return')),
  quantity INTEGER NOT NULL,
  reference_id INTEGER,
  reference_type TEXT CHECK (reference_type IN ('sale', 'purchase', 'adjustment', 'transfer', 'return')),
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (store_id) REFERENCES stores(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_store ON inventory_transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_reference ON inventory_transactions(reference_id, reference_type);

-- Bảng giao dịch tài chính
CREATE TABLE IF NOT EXISTS financial_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'mobile_payment', 'credit')),
  reference_number TEXT,
  reference_id INTEGER,
  reference_type TEXT CHECK (reference_type IN ('sale', 'purchase', 'expense', 'other')),
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_category ON financial_transactions(category);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_reference ON financial_transactions(reference_id, reference_type);

-- Bảng công nợ
CREATE TABLE IF NOT EXISTS accounts_receivable (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
  reference_id INTEGER,
  reference_type TEXT CHECK (reference_type IN ('sale', 'other')),
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_customer ON accounts_receivable(customer_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_due_date ON accounts_receivable(due_date);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_status ON accounts_receivable(status);

-- Bảng cài đặt
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  store_id INTEGER,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (store_id) REFERENCES stores(id)
);
CREATE INDEX IF NOT EXISTS idx_settings_store ON settings(store_id);

-- Bảng log hoạt động
CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  details TEXT,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_date ON activity_logs(created_at);

-- Essential system data (not demo data)

-- Insert default store
INSERT OR IGNORE INTO stores (id, name, address, phone, email, tax_number, is_main)
VALUES (1, 'Cửa hàng chính', 'Hồ Chí Minh', '0987654321', 'contact@smartpos.com', '0123456789', 1);

-- Insert admin user (password: admin123)
INSERT OR IGNORE INTO users (id, username, password_hash, password_salt, full_name, email, role, store_id, is_active)
VALUES (
  1, 
  'admin', 
  '5b722b307fce6c944905d132691d5e4a2214b7fe92b738920eb3fce3a90420a19511c3010a0e7712b054daef5b57bad59ecbd93b3280f210578f547f4aed4d25', -- hashed 'admin123'
  'SmartPOSDefaultSalt',
  'Administrator',
  'admin@smartpos.com',
  'admin',
  1,
  1
);

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value) VALUES ('company_name', 'SmartPOS');
INSERT OR IGNORE INTO settings (key, value) VALUES ('company_address', 'Hồ Chí Minh, Việt Nam');
INSERT OR IGNORE INTO settings (key, value) VALUES ('company_phone', '0987654321');
INSERT OR IGNORE INTO settings (key, value) VALUES ('company_email', 'contact@smartpos.com');
INSERT OR IGNORE INTO settings (key, value) VALUES ('tax_rate', '0.1');
INSERT OR IGNORE INTO settings (key, value) VALUES ('currency', 'VND');
INSERT OR IGNORE INTO settings (key, value) VALUES ('currency_symbol', '₫');
INSERT OR IGNORE INTO settings (key, value) VALUES ('receipt_footer', 'Cảm ơn quý khách đã mua hàng!');
INSERT OR IGNORE INTO settings (key, value) VALUES ('enable_loyalty', 'true');
INSERT OR IGNORE INTO settings (key, value) VALUES ('loyalty_rate', '0.01');

-- Demo data removed - use proper data entry or migration system

-- ============================================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- ============================================================================

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_sales_store_date ON sales(store_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sales_user_date ON sales(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sales_customer_date ON sales(customer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sales_status_date ON sales(sale_status, created_at);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status_date ON sales(payment_status, created_at);

-- Product search and filtering indexes
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_name_active ON products(name, is_active);
CREATE INDEX IF NOT EXISTS idx_products_price_active ON products(price, is_active);
CREATE INDEX IF NOT EXISTS idx_products_stock_alert ON products(stock_quantity, stock_alert_threshold);

-- Inventory transaction indexes for reporting
CREATE INDEX IF NOT EXISTS idx_inventory_product_date ON inventory_transactions(product_id, created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_store_date ON inventory_transactions(store_id, created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_type_date ON inventory_transactions(transaction_type, created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_reference ON inventory_transactions(reference_type, reference_id);

-- Financial transaction indexes
CREATE INDEX IF NOT EXISTS idx_financial_date_type ON financial_transactions(date, transaction_type);
CREATE INDEX IF NOT EXISTS idx_financial_category_date ON financial_transactions(category, date);
CREATE INDEX IF NOT EXISTS idx_financial_reference ON financial_transactions(reference_type, reference_id);

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customers_group_active ON customers(customer_group, deleted_at);
CREATE INDEX IF NOT EXISTS idx_customers_points ON customers(loyalty_points);

-- Stock management indexes
CREATE INDEX IF NOT EXISTS idx_stock_ins_supplier_date ON stock_ins(supplier_id, created_at);
CREATE INDEX IF NOT EXISTS idx_stock_ins_store_date ON stock_ins(store_id, created_at);
CREATE INDEX IF NOT EXISTS idx_stock_in_items_product ON stock_in_items(product_id, created_at);

-- Activity logs indexes for audit trails
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date ON activity_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_date ON activity_logs(action, created_at);

-- Accounts receivable indexes
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_due_status ON accounts_receivable(due_date, status);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_customer_status ON accounts_receivable(customer_id, status);

-- Settings indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_settings_store_key ON settings(store_id, key);

-- Full-text search indexes (if supported)
-- Note: SQLite FTS is not available in Cloudflare D1, but we can create regular indexes for LIKE searches
CREATE INDEX IF NOT EXISTS idx_products_name_search ON products(name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_customers_name_search ON customers(full_name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_suppliers_name_search ON suppliers(name COLLATE NOCASE);

-- Covering indexes for common SELECT queries
CREATE INDEX IF NOT EXISTS idx_sales_summary ON sales(store_id, created_at, final_amount, sale_status);
CREATE INDEX IF NOT EXISTS idx_products_summary ON products(category_id, is_active, name, price, stock_quantity);
CREATE INDEX IF NOT EXISTS idx_sale_items_summary ON sale_items(sale_id, product_id, quantity, subtotal);

-- ============================================================================
-- PERFORMANCE MONITORING VIEWS
-- ============================================================================

-- View for sales performance monitoring
CREATE VIEW IF NOT EXISTS v_sales_performance AS
SELECT 
  DATE(created_at) as sale_date,
  store_id,
  COUNT(*) as total_sales,
  SUM(final_amount) as total_revenue,
  AVG(final_amount) as avg_order_value,
  COUNT(DISTINCT customer_id) as unique_customers
FROM sales 
WHERE sale_status = 'completed'
GROUP BY DATE(created_at), store_id;

-- View for inventory status
CREATE VIEW IF NOT EXISTS v_inventory_status AS
SELECT 
  p.id,
  p.name,
  p.sku,
  p.stock_quantity,
  p.stock_alert_threshold,
  c.name as category_name,
  CASE 
    WHEN p.stock_quantity = 0 THEN 'out_of_stock'
    WHEN p.stock_quantity <= p.stock_alert_threshold THEN 'low_stock'
    ELSE 'in_stock'
  END as stock_status
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_active = 1;

-- View for top selling products
CREATE VIEW IF NOT EXISTS v_top_products AS
SELECT 
  p.id,
  p.name,
  p.sku,
  SUM(si.quantity) as total_sold,
  SUM(si.subtotal) as total_revenue,
  COUNT(DISTINCT si.sale_id) as order_count
FROM products p
JOIN sale_items si ON p.id = si.product_id
JOIN sales s ON si.sale_id = s.id
WHERE s.sale_status = 'completed'
  AND s.created_at >= date('now', '-30 days')
GROUP BY p.id, p.name, p.sku
ORDER BY total_sold DESC;

-- View for customer analytics
CREATE VIEW IF NOT EXISTS v_customer_analytics AS
SELECT 
  c.id,
  c.full_name,
  c.customer_group,
  c.loyalty_points,
  COUNT(s.id) as total_orders,
  SUM(s.final_amount) as total_spent,
  AVG(s.final_amount) as avg_order_value,
  MAX(s.created_at) as last_order_date
FROM customers c
LEFT JOIN sales s ON c.id = s.customer_id AND s.sale_status = 'completed'
GROUP BY c.id, c.full_name, c.customer_group, c.loyalty_points;

-- ============================================================================
-- PHASE 1: ENHANCED DATABASE SCHEMA FOR NEW MODULES
-- ============================================================================

-- ============================================================================
-- WARRANTY & SERIAL NUMBER MANAGEMENT TABLES
-- ============================================================================

-- Serial Numbers tracking table
CREATE TABLE IF NOT EXISTS serial_numbers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    serial_number TEXT NOT NULL UNIQUE,
    product_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'sold', 'returned', 'defective', 'warranty_claim')),
    purchase_date DATETIME,
    sale_date DATETIME,
    customer_id INTEGER,
    sale_id INTEGER,
    warranty_start_date DATETIME,
    warranty_end_date DATETIME,
    warranty_period_months INTEGER DEFAULT 12,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Warranty claims tracking
CREATE TABLE IF NOT EXISTS warranty_claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    claim_number TEXT NOT NULL UNIQUE,
    serial_number_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    claim_type TEXT NOT NULL CHECK (claim_type IN ('repair', 'replacement', 'refund')),
    issue_description TEXT NOT NULL,
    claim_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in_progress', 'completed', 'rejected', 'cancelled')),
    resolution_description TEXT,
    resolution_date DATETIME,
    cost DECIMAL(15,2) DEFAULT 0,
    technician_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    FOREIGN KEY (serial_number_id) REFERENCES serial_numbers(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Warranty notifications
CREATE TABLE IF NOT EXISTS warranty_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    serial_number_id INTEGER NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('expiring_soon', 'expired', 'claim_update')),
    message TEXT NOT NULL,
    sent_date DATETIME,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    recipient_email TEXT,
    recipient_phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (serial_number_id) REFERENCES serial_numbers(id) ON DELETE CASCADE
);

-- ============================================================================
-- EMPLOYEE MANAGEMENT & PERMISSIONS TABLES
-- ============================================================================

-- Enhanced users table with employee details
CREATE TABLE IF NOT EXISTS employee_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    employee_code TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    hire_date DATE NOT NULL,
    position TEXT NOT NULL,
    department TEXT,
    salary DECIMAL(15,2),
    commission_rate DECIMAL(5,2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    bank_account TEXT,
    tax_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Role-based permissions
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions TEXT NOT NULL, -- JSON array of permissions
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User role assignments
CREATE TABLE IF NOT EXISTS user_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(user_id, role_id)
);

-- Employee performance tracking
CREATE TABLE IF NOT EXISTS employee_performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    sales_count INTEGER DEFAULT 0,
    sales_amount DECIMAL(15,2) DEFAULT 0,
    commission_earned DECIMAL(15,2) DEFAULT 0,
    customer_satisfaction_score DECIMAL(3,2),
    performance_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee_profiles(id) ON DELETE CASCADE
);

-- Attendance tracking
CREATE TABLE IF NOT EXISTS employee_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    date DATE NOT NULL,
    check_in_time DATETIME,
    check_out_time DATETIME,
    break_duration_minutes INTEGER DEFAULT 0,
    total_hours DECIMAL(4,2),
    status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day', 'overtime')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee_profiles(id) ON DELETE CASCADE,
    UNIQUE(employee_id, date)
);

-- ============================================================================
-- DEBT MANAGEMENT SYSTEM TABLES
-- ============================================================================

-- Customer credit limits
CREATE TABLE IF NOT EXISTS customer_credit_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL UNIQUE,
    credit_limit DECIMAL(15,2) NOT NULL DEFAULT 0,
    current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    available_credit DECIMAL(15,2) GENERATED ALWAYS AS (credit_limit - current_balance) STORED,
    last_review_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Enhanced accounts receivable with aging
CREATE TABLE IF NOT EXISTS debt_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('debt', 'payment', 'adjustment')),
    amount DECIMAL(15,2) NOT NULL,
    balance_after DECIMAL(15,2) NOT NULL,
    due_date DATE,
    reference_id INTEGER,
    reference_type TEXT CHECK (reference_type IN ('sale', 'payment', 'adjustment')),
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'written_off')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Payment reminders and notifications
CREATE TABLE IF NOT EXISTS payment_reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    debt_transaction_id INTEGER NOT NULL,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('email', 'sms', 'call', 'letter')),
    scheduled_date DATE NOT NULL,
    sent_date DATETIME,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (debt_transaction_id) REFERENCES debt_transactions(id) ON DELETE CASCADE
);

-- ============================================================================
-- VIETNAMESE PAYMENT INTEGRATION TABLES
-- ============================================================================

-- Payment gateways configuration
CREATE TABLE IF NOT EXISTS payment_gateways (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL CHECK (provider IN ('vnpay', 'momo', 'zalopay', 'shopee_pay', 'vietqr')),
    is_active BOOLEAN DEFAULT TRUE,
    configuration TEXT NOT NULL, -- JSON configuration
    test_mode BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id TEXT NOT NULL UNIQUE,
    gateway_id INTEGER NOT NULL,
    sale_id INTEGER,
    amount DECIMAL(15,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'VND',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
    gateway_transaction_id TEXT,
    gateway_response TEXT, -- JSON response from gateway
    callback_data TEXT, -- JSON callback data
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gateway_id) REFERENCES payment_gateways(id) ON DELETE CASCADE,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL
);

-- QR Code payments
CREATE TABLE IF NOT EXISTS qr_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    qr_code TEXT NOT NULL UNIQUE,
    sale_id INTEGER,
    amount DECIMAL(15,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'VND',
    expires_at DATETIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'cancelled')),
    paid_at DATETIME,
    payment_method TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);

-- ============================================================================
-- PRE-ORDER MANAGEMENT TABLES
-- ============================================================================

-- Pre-orders
CREATE TABLE IF NOT EXISTS pre_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL UNIQUE,
    customer_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    store_id INTEGER NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    deposit_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    remaining_amount DECIMAL(15,2) GENERATED ALWAYS AS (total_amount - deposit_amount) STORED,
    expected_arrival_date DATE,
    actual_arrival_date DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'arrived', 'completed', 'cancelled')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

-- Pre-order items
CREATE TABLE IF NOT EXISTS pre_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pre_order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    arrived_quantity DECIMAL(10,2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'arrived', 'cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pre_order_id) REFERENCES pre_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Pre-order notifications
CREATE TABLE IF NOT EXISTS pre_order_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pre_order_id INTEGER NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('arrival', 'ready_pickup', 'overdue')),
    message TEXT NOT NULL,
    sent_date DATETIME,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    recipient_email TEXT,
    recipient_phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pre_order_id) REFERENCES pre_orders(id) ON DELETE CASCADE
);

-- ============================================================================
-- ADVANCED PROMOTIONS & LOYALTY TABLES
-- ============================================================================

-- Promotions
CREATE TABLE IF NOT EXISTS promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'buy_x_get_y', 'combo')),
    value DECIMAL(10,2) NOT NULL DEFAULT 0,
    min_purchase_amount DECIMAL(15,2) DEFAULT 0,
    max_discount_amount DECIMAL(15,2),
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    conditions TEXT, -- JSON conditions
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Vouchers/Coupons
CREATE TABLE IF NOT EXISTS vouchers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    promotion_id INTEGER,
    customer_id INTEGER,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10,2) NOT NULL,
    min_purchase_amount DECIMAL(15,2) DEFAULT 0,
    max_discount_amount DECIMAL(15,2),
    usage_limit INTEGER DEFAULT 1,
    usage_count INTEGER DEFAULT 0,
    expires_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Loyalty program tiers
CREATE TABLE IF NOT EXISTS loyalty_tiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    min_points INTEGER NOT NULL DEFAULT 0,
    max_points INTEGER,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    benefits TEXT, -- JSON benefits
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Customer loyalty transactions
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'expire', 'adjustment')),
    points INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reference_id INTEGER,
    reference_type TEXT CHECK (reference_type IN ('sale', 'voucher', 'adjustment')),
    description TEXT,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- ============================================================================
-- ADVANCED ANALYTICS & REPORTS TABLES
-- ============================================================================

-- Business metrics snapshots
CREATE TABLE IF NOT EXISTS business_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_date DATE NOT NULL,
    store_id INTEGER NOT NULL,
    total_sales DECIMAL(15,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_customers INTEGER DEFAULT 0,
    avg_order_value DECIMAL(15,2) DEFAULT 0,
    total_profit DECIMAL(15,2) DEFAULT 0,
    inventory_value DECIMAL(15,2) DEFAULT 0,
    low_stock_items INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    UNIQUE(metric_date, store_id)
);

-- Product performance analytics
CREATE TABLE IF NOT EXISTS product_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    units_sold INTEGER DEFAULT 0,
    revenue DECIMAL(15,2) DEFAULT 0,
    profit DECIMAL(15,2) DEFAULT 0,
    return_count INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(product_id, period_start, period_end)
);

-- ============================================================================
-- ASSET MANAGEMENT TABLES
-- ============================================================================

-- Assets (equipment, furniture, etc.)
CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    purchase_date DATE,
    purchase_cost DECIMAL(15,2),
    current_value DECIMAL(15,2),
    depreciation_rate DECIMAL(5,2),
    location TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired', 'disposed')),
    warranty_expires_at DATE,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Asset maintenance records
CREATE TABLE IF NOT EXISTS asset_maintenance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,
    maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('preventive', 'corrective', 'emergency')),
    description TEXT NOT NULL,
    cost DECIMAL(15,2) DEFAULT 0,
    performed_by TEXT,
    performed_date DATE NOT NULL,
    next_maintenance_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

-- ============================================================================
-- INDEXES FOR NEW TABLES
-- ============================================================================

-- Serial numbers indexes
CREATE INDEX IF NOT EXISTS idx_serial_numbers_product ON serial_numbers(product_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_status ON serial_numbers(status);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_customer ON serial_numbers(customer_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_warranty ON serial_numbers(warranty_end_date);

-- Warranty claims indexes
CREATE INDEX IF NOT EXISTS idx_warranty_claims_serial ON warranty_claims(serial_number_id);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_customer ON warranty_claims(customer_id);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_status ON warranty_claims(status);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_date ON warranty_claims(claim_date);

-- Employee indexes
CREATE INDEX IF NOT EXISTS idx_employee_profiles_user ON employee_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_code ON employee_profiles(employee_code);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_status ON employee_profiles(status);

-- Debt management indexes
CREATE INDEX IF NOT EXISTS idx_debt_transactions_customer ON debt_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_debt_transactions_status ON debt_transactions(status);
CREATE INDEX IF NOT EXISTS idx_debt_transactions_due_date ON debt_transactions(due_date);

-- Payment indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_gateway ON payment_transactions(gateway_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_sale ON payment_transactions(sale_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

-- Pre-order indexes
CREATE INDEX IF NOT EXISTS idx_pre_orders_customer ON pre_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_pre_orders_status ON pre_orders(status);
CREATE INDEX IF NOT EXISTS idx_pre_orders_arrival_date ON pre_orders(expected_arrival_date);

-- Promotion indexes
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);
CREATE INDEX IF NOT EXISTS idx_vouchers_customer ON vouchers(customer_id);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_business_metrics_date_store ON business_metrics(metric_date, store_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_product_period ON product_analytics(product_id, period_start, period_end);

-- Asset indexes
CREATE INDEX IF NOT EXISTS idx_assets_code ON assets(asset_code);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_maintenance_date ON assets(next_maintenance_date);