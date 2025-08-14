-- SmartPOS Database Schema - FIXED VERSION
-- Resolves duplicate tables, data type inconsistencies, and missing constraints

-- ============================================================================
-- CORE TABLES WITH PROPER CONSTRAINTS
-- ============================================================================

-- Stores table (must be created first due to foreign key dependencies)
CREATE TABLE IF NOT EXISTS stores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  tax_number TEXT,
  is_main INTEGER NOT NULL DEFAULT 0 CHECK (is_main IN (0, 1)),
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Users table with proper foreign key constraints
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
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  last_login DATETIME,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE RESTRICT
);

-- Categories table with self-referencing foreign key
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  parent_id INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  deleted_at DATETIME,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- FIXED: Single suppliers table with proper constraints
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
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  deleted_at DATETIME
);

-- Customers table with proper constraints
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  birthday DATE,
  loyalty_points INTEGER NOT NULL DEFAULT 0 CHECK (loyalty_points >= 0),
  customer_group TEXT NOT NULL DEFAULT 'regular' CHECK (customer_group IN ('regular', 'vip', 'wholesale', 'business')),
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  deleted_at DATETIME
);

-- FIXED: Products table with consistent DECIMAL types for monetary fields
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT UNIQUE,
  category_id INTEGER NOT NULL,
  
  -- FIXED: Consistent DECIMAL types for all monetary fields
  price DECIMAL(15,2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
  cost_price DECIMAL(15,2) NOT NULL DEFAULT 0.00 CHECK (cost_price >= 0),
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  discount_eligible INTEGER NOT NULL DEFAULT 1 CHECK (discount_eligible IN (0, 1)),
  
  -- Inventory management with proper constraints
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  min_stock_level INTEGER NOT NULL DEFAULT 0 CHECK (min_stock_level >= 0),
  max_stock_level INTEGER DEFAULT NULL CHECK (max_stock_level IS NULL OR max_stock_level >= min_stock_level),
  reorder_point INTEGER DEFAULT NULL CHECK (reorder_point IS NULL OR reorder_point >= 0),
  reorder_quantity INTEGER DEFAULT NULL CHECK (reorder_quantity IS NULL OR reorder_quantity > 0),
  
  -- Product details
  brand TEXT,
  model TEXT,
  unit TEXT DEFAULT 'piece',
  weight DECIMAL(8,3) DEFAULT NULL CHECK (weight IS NULL OR weight > 0),
  dimensions TEXT,
  color TEXT,
  size TEXT,
  
  -- Supplier information with proper foreign key
  supplier_id INTEGER,
  supplier_sku TEXT,
  supplier_price DECIMAL(15,2) CHECK (supplier_price IS NULL OR supplier_price >= 0),
  
  -- Warranty information
  warranty_period_months INTEGER DEFAULT 12 CHECK (warranty_period_months >= 0),
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
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  is_featured INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0, 1)),
  is_digital INTEGER NOT NULL DEFAULT 0 CHECK (is_digital IN (0, 1)),
  requires_shipping INTEGER NOT NULL DEFAULT 1 CHECK (requires_shipping IN (0, 1)),
  track_quantity INTEGER NOT NULL DEFAULT 1 CHECK (track_quantity IN (0, 1)),
  
  -- Timestamps and audit
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  deleted_at DATETIME,
  created_by INTEGER,
  updated_by INTEGER,
  
  -- FIXED: Proper foreign key constraints
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- FIXED: Sales table with consistent DECIMAL types
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_number TEXT NOT NULL UNIQUE,
  store_id INTEGER NOT NULL,
  customer_id INTEGER,
  user_id INTEGER NOT NULL,
  
  -- FIXED: Consistent DECIMAL types for all monetary fields
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
  tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
  discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
  final_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 CHECK (final_amount >= 0),
  
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'mobile_payment', 'credit')),
  payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'unpaid', 'partial')),
  sale_status TEXT NOT NULL DEFAULT 'completed' CHECK (sale_status IN ('completed', 'returned', 'cancelled')),
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  deleted_at DATETIME,
  
  -- FIXED: Proper foreign key constraints
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE RESTRICT,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- FIXED: Sale items table with consistent DECIMAL types
CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  
  -- FIXED: Consistent DECIMAL types
  quantity DECIMAL(10,3) NOT NULL DEFAULT 0.000 CHECK (quantity > 0),
  unit_price DECIMAL(15,2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
  
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  
  -- FIXED: Proper foreign key constraints with CASCADE delete
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- ============================================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- ============================================================================

-- Primary indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_sales_store_id ON sales(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

-- Search and filter indexes
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(sale_status);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category_id, is_active);
CREATE INDEX IF NOT EXISTS idx_sales_store_date ON sales(store_id, created_at);
CREATE INDEX IF NOT EXISTS idx_products_supplier_active ON products(supplier_id, is_active);

-- ============================================================================
-- ESSENTIAL SYSTEM DATA
-- ============================================================================

-- Insert default store
INSERT OR IGNORE INTO stores (id, name, address, phone, email, tax_number, is_main)
VALUES (1, 'Cửa hàng chính', 'Hồ Chí Minh', '0987654321', 'contact@smartpos.com', '0123456789', 1);

-- Insert admin user (password: admin123)
INSERT OR IGNORE INTO users (id, username, password_hash, password_salt, full_name, email, role, store_id, is_active)
VALUES (
  1, 
  'admin', 
  '5b722b307fce6c944905d132691d5e4a2214b7fe92b738920eb3fce3a90420a19511c3010a0e7712b054daef5b57bad59ecbd93b3280f210578f547f4aed4d25',
  'SmartPOSDefaultSalt',
  'Administrator',
  'admin@smartpos.com',
  'admin',
  1,
  1
);

-- ============================================================================
-- MIGRATION TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version INTEGER NOT NULL UNIQUE,
  executed_at DATETIME NOT NULL DEFAULT (datetime('now')),
  execution_time_ms INTEGER NOT NULL,
  checksum TEXT NOT NULL
);

-- Record this schema as migration version 1
INSERT OR IGNORE INTO schema_migrations (id, name, version, execution_time_ms, checksum)
VALUES ('fixed_schema_v1', 'Fixed database schema with proper constraints', 1, 0, 'fixed_schema_checksum_v1');
