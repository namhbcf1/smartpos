-- ===================================================================
-- CONSOLIDATED MIGRATION - Remove DDL from routes
-- Version: 006
-- Date: 2025-09-22
-- Description: Consolidate all table creation from routes into migrations
-- ===================================================================

-- Enable optimizations
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;

-- ===================================================================
-- CORE TABLES (if not exist from previous migrations)
-- ===================================================================

-- Users table (from auth.ts)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'cashier', 'employee')),
  is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
  last_login TEXT,
  store_id TEXT DEFAULT 'store-1',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Stores table (from auth.ts)
CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  tax_number TEXT,
  business_license TEXT,
  logo_url TEXT,
  timezone TEXT DEFAULT 'Asia/Ho_Chi_Minh',
  currency TEXT DEFAULT 'VND',
  is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Products table (from products.ts)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT UNIQUE,
  description TEXT,
  price REAL NOT NULL DEFAULT 0 CHECK (price >= 0),
  cost_price REAL DEFAULT 0 CHECK (cost_price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_stock INTEGER DEFAULT 0 CHECK (min_stock >= 0),
  max_stock INTEGER DEFAULT 1000 CHECK (max_stock >= 0),
  categoryId TEXT,
  supplierId TEXT,
  brandId TEXT,
  image_url TEXT,
  weight REAL DEFAULT 0 CHECK (weight >= 0),
  dimensions TEXT,
  isActive INTEGER DEFAULT 1 CHECK (isActive IN (0, 1)),
  featured INTEGER DEFAULT 0 CHECK (featured IN (0, 1)),
  taxable INTEGER DEFAULT 1 CHECK (taxable IN (0, 1)),
  track_inventory INTEGER DEFAULT 1 CHECK (track_inventory IN (0, 1)),
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

-- Categories table (from products.ts)
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

-- Brands table (from products.ts)
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

-- Suppliers table (from products.ts)
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  website TEXT,
  tax_number TEXT,
  payment_terms TEXT,
  is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Customers table (from customers.ts)
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  date_of_birth TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  total_purchases REAL DEFAULT 0 CHECK (total_purchases >= 0),
  total_spent REAL DEFAULT 0 CHECK (total_spent >= 0),
  loyalty_points INTEGER DEFAULT 0 CHECK (loyalty_points >= 0),
  tier_id TEXT,
  is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ===================================================================
-- ORDER SYSTEM (UNIFIED) - Remove pos_orders vs orders confusion
-- ===================================================================

-- Main orders table (unified from sales.ts)
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_id TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  user_id TEXT NOT NULL,
  store_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'completed', 'cancelled', 'refunded')),
  subtotal_cents INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0),
  discount_cents INTEGER DEFAULT 0 CHECK (discount_cents >= 0),
  tax_cents INTEGER DEFAULT 0 CHECK (tax_cents >= 0),
  total_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  payment_method TEXT DEFAULT 'cash',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  notes TEXT,
  receipt_printed INTEGER DEFAULT 0 CHECK (receipt_printed IN (0, 1)),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (store_id) REFERENCES stores(id)
);

-- Order items table (from sales.ts)
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  total_price_cents INTEGER NOT NULL CHECK (total_price_cents >= 0),
  discount_cents INTEGER DEFAULT 0 CHECK (discount_cents >= 0),
  product_name TEXT,
  product_sku TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ===================================================================
-- POS SPECIFIC TABLES (from pos.ts)
-- ===================================================================

-- POS sessions table
CREATE TABLE IF NOT EXISTS pos_sessions (
  id TEXT PRIMARY KEY,
  cashier_id TEXT NOT NULL,
  cashier_name TEXT,
  register_id TEXT DEFAULT '1',
  opening_balance REAL DEFAULT 0,
  closing_balance REAL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  opened_at TEXT DEFAULT (datetime('now')),
  closed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (cashier_id) REFERENCES users(id)
);

-- POS daily closings table
CREATE TABLE IF NOT EXISTS pos_daily_closings (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  total_orders INTEGER DEFAULT 0,
  total_sales REAL DEFAULT 0,
  cash_sales REAL DEFAULT 0,
  card_sales REAL DEFAULT 0,
  other_sales REAL DEFAULT 0,
  opening_balance REAL DEFAULT 0,
  closing_balance REAL DEFAULT 0,
  variance REAL DEFAULT 0,
  notes TEXT,
  closed_by TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Parked carts table
CREATE TABLE IF NOT EXISTS parked_carts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  user_id TEXT NOT NULL,
  cart_data TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ===================================================================
-- PAYMENT SYSTEM
-- ===================================================================

-- Payment methods table (from payment-methods.ts)
CREATE TABLE IF NOT EXISTS payment_methods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  fee_percentage REAL DEFAULT 0 CHECK (fee_percentage >= 0),
  fee_fixed REAL DEFAULT 0 CHECK (fee_fixed >= 0),
  is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
  supports_refund INTEGER DEFAULT 1 CHECK (supports_refund IN (0, 1)),
  requires_auth INTEGER DEFAULT 0 CHECK (requires_auth IN (0, 1)),
  config_json TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Payments table (unified)
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  order_id TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'cash',
  amount REAL NOT NULL DEFAULT 0 CHECK (amount >= 0),
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  reference TEXT,
  gateway_response TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- ===================================================================
-- ALERTS AND NOTIFICATIONS
-- ===================================================================

-- Stock alerts table (from alerts.ts)
CREATE TABLE IF NOT EXISTS stock_alerts (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  threshold_value INTEGER,
  current_value INTEGER,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Warranty alerts table (from alerts.ts)
CREATE TABLE IF NOT EXISTS warranty_alerts (
  id TEXT PRIMARY KEY,
  warranty_id TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  days_before_expiry INTEGER,
  message TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Customer notifications table (from alerts.ts)
CREATE TABLE IF NOT EXISTS customer_notifications (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT,
  content TEXT,
  status TEXT DEFAULT 'unread',
  sent_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- ===================================================================
-- TASK MANAGEMENT
-- ===================================================================

-- Tasks table (from tasks.ts)
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category_id INTEGER,
  assigned_to INTEGER,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  due_date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Task comments table (from tasks.ts)
CREATE TABLE IF NOT EXISTS task_comments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  author_id INTEGER,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Task checklist table (from tasks.ts)
CREATE TABLE IF NOT EXISTS task_checklist (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  title TEXT NOT NULL,
  is_done INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- ===================================================================
-- FILE UPLOADS
-- ===================================================================

-- File uploads table (from file-upload.ts)
CREATE TABLE IF NOT EXISTS file_uploads (
  id TEXT PRIMARY KEY,
  original_name TEXT NOT NULL,
  filename TEXT NOT NULL UNIQUE,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_path TEXT,
  uploaded_by TEXT,
  entity_type TEXT,
  entity_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- ===================================================================
-- AUTHENTICATION TABLES
-- ===================================================================

-- Auth sessions table (for session management)
CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Login attempts table (for security logging)
CREATE TABLE IF NOT EXISTS login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  success INTEGER DEFAULT 0 CHECK (success IN (0, 1)),
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ===================================================================
-- INDEXES (Performance)
-- ===================================================================

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(categoryId);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplierId);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brandId);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(isActive);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Auth sessions indexes
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_active ON auth_sessions(is_active);

-- Login attempts indexes
CREATE INDEX IF NOT EXISTS idx_login_attempts_username ON login_attempts(username);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);

-- Stock alerts indexes
CREATE INDEX IF NOT EXISTS idx_stock_alerts_product_id ON stock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_status ON stock_alerts(status);

-- ===================================================================
-- DATA MIGRATION (if pos_orders exists, migrate to orders)
-- ===================================================================

-- Only run if pos_orders table exists and has data
-- This safely migrates pos_orders to unified orders table

-- Insert into orders from pos_orders (if exists)
INSERT OR IGNORE INTO orders (
  id, order_number, customer_id, customer_name, customer_phone, user_id, store_id,
  status, subtotal_cents, discount_cents, tax_cents, total_cents,
  payment_method, payment_status, notes, created_at, updated_at
)
SELECT
  id,
  order_number,
  customer_id,
  customer_name,
  customer_phone,
  user_id,
  'store-1' as store_id,
  CASE
    WHEN status = 'completed' THEN 'completed'
    WHEN status = 'cancelled' THEN 'cancelled'
    ELSE 'pending'
  END as status,
  CAST(subtotal * 100 AS INTEGER) as subtotal_cents,
  CAST(COALESCE(discount, 0) * 100 AS INTEGER) as discount_cents,
  CAST(COALESCE(tax, 0) * 100 AS INTEGER) as tax_cents,
  CAST(total * 100 AS INTEGER) as total_cents,
  payment_method,
  CASE
    WHEN payment_status = 'completed' THEN 'completed'
    WHEN payment_status = 'failed' THEN 'failed'
    ELSE 'pending'
  END as payment_status,
  notes,
  created_at,
  updated_at
FROM pos_orders
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='pos_orders');

-- Insert into order_items from pos_order_items (if exists)
INSERT OR IGNORE INTO order_items (
  id, order_id, product_id, quantity, unit_price_cents, total_price_cents,
  discount_cents, product_name, product_sku, created_at
)
SELECT
  id,
  order_id,
  product_id,
  quantity,
  CAST(unit_price * 100 AS INTEGER) as unit_price_cents,
  CAST(total_price * 100 AS INTEGER) as total_price_cents,
  CAST(COALESCE(discount, 0) * 100 AS INTEGER) as discount_cents,
  product_name,
  sku,
  created_at
FROM pos_order_items
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='pos_order_items');

-- ===================================================================
-- CLEANUP (Optional - Comment out if you want to keep old tables)
-- ===================================================================

-- After successful migration, these old tables can be dropped
-- Uncomment only after verifying data migration was successful

-- DROP TABLE IF EXISTS pos_orders;
-- DROP TABLE IF EXISTS pos_order_items;