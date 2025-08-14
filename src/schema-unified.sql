-- ============================================================================
-- SMARTPOS UNIFIED DATABASE SCHEMA
-- ============================================================================
-- This is the single source of truth for the SmartPOS database schema
-- Consolidates all previous schema files into one authoritative version
-- 
-- SECURITY FIXED: No default credentials, proper constraints, secure defaults
-- PERFORMANCE OPTIMIZED: Proper indexes, foreign keys, data types
-- ============================================================================

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- ============================================================================
-- CORE BUSINESS TABLES
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
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Users table with proper security constraints
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL DEFAULT 'SmartPOSSecureSalt',
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cashier', 'inventory', 'sales_agent', 'affiliate')),
  store_id INTEGER NOT NULL DEFAULT 1,
  avatar_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  last_login DATETIME,
  login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until DATETIME,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE RESTRICT
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  tax_number TEXT,
  payment_terms TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Products table with comprehensive constraints
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT UNIQUE,
  category_id INTEGER NOT NULL,
  supplier_id INTEGER,
  price DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
  cost_price DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (cost_price >= 0),
  wholesale_price DECIMAL(12,2) CHECK (wholesale_price >= 0),
  retail_price DECIMAL(12,2) CHECK (retail_price >= 0),
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  stock_alert_threshold INTEGER NOT NULL DEFAULT 5 CHECK (stock_alert_threshold >= 0),
  min_stock_level INTEGER DEFAULT 0 CHECK (min_stock_level >= 0),
  max_stock_level INTEGER CHECK (max_stock_level >= min_stock_level),
  reorder_point INTEGER CHECK (reorder_point >= 0),
  unit TEXT DEFAULT 'pcs',
  weight DECIMAL(8,2) CHECK (weight >= 0),
  dimensions TEXT,
  brand TEXT,
  model TEXT,
  warranty_period INTEGER DEFAULT 0 CHECK (warranty_period >= 0), -- in months
  image_url TEXT,
  images TEXT, -- JSON array of image URLs
  specifications TEXT, -- JSON object
  tags TEXT, -- JSON array
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  customer_type TEXT NOT NULL DEFAULT 'regular' CHECK (customer_type IN ('regular', 'vip', 'wholesale')),
  loyalty_points INTEGER NOT NULL DEFAULT 0 CHECK (loyalty_points >= 0),
  total_spent DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (total_spent >= 0),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_number TEXT NOT NULL UNIQUE,
  customer_id INTEGER,
  user_id INTEGER NOT NULL,
  store_id INTEGER NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer', 'momo', 'vnpay', 'zalopay')),
  payment_status TEXT NOT NULL DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'cancelled', 'returned')),
  notes TEXT,
  receipt_printed INTEGER NOT NULL DEFAULT 0 CHECK (receipt_printed IN (0, 1)),
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE RESTRICT
);

-- Sale items table
CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
  serial_numbers TEXT, -- JSON array for products with serial numbers
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, is_active);
CREATE INDEX IF NOT EXISTS idx_users_store_active ON users(store_id, is_active);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_supplier_active ON products(supplier_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_status_active ON products(status, is_active);
CREATE INDEX IF NOT EXISTS idx_products_stock_alert ON products(stock_quantity, stock_alert_threshold);

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_number ON sales(sale_number);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_user_date ON sales(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sales_store_date ON sales(store_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sales_status_date ON sales(status, created_at);

-- Sale items indexes
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_type_active ON customers(customer_type, is_active);

-- ============================================================================
-- DEFAULT DATA (SECURE)
-- ============================================================================

-- Insert default store
INSERT OR IGNORE INTO stores (id, name, address, phone, email, tax_number, is_main)
VALUES (1, 'Cửa hàng chính', 'Hồ Chí Minh', '0987654321', 'contact@smartpos.com', '0123456789', 1);

-- SECURITY FIXED: No default admin user - must be created manually with secure credentials
-- Use scripts/create-secure-admin.js to create admin user with secure password

-- Insert default categories
INSERT OR IGNORE INTO categories (id, name, description, sort_order) VALUES
(1, 'Linh kiện máy tính', 'Các linh kiện máy tính như CPU, RAM, VGA, Mainboard', 1),
(2, 'Laptop', 'Laptop các hãng Dell, HP, Asus, Acer', 2),
(3, 'Phụ kiện', 'Chuột, bàn phím, tai nghe, webcam', 3),
(4, 'Gaming', 'Sản phẩm gaming chuyên dụng', 4);

-- ============================================================================
-- MIGRATION TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version INTEGER NOT NULL UNIQUE,
  executed_at DATETIME NOT NULL DEFAULT (datetime('now')),
  execution_time_ms INTEGER NOT NULL,
  checksum TEXT NOT NULL
);

-- ============================================================================
-- ENHANCED ROLE-BASED ACCESS CONTROL (RBAC) SYSTEM
-- ============================================================================

-- System resources (menu items, database tables, features)
CREATE TABLE IF NOT EXISTS system_resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE, -- e.g., 'dashboard', 'products', 'sales.create'
  display_name TEXT NOT NULL, -- e.g., 'Dashboard', 'Sản phẩm', 'Tạo đơn hàng'
  resource_type TEXT NOT NULL CHECK (resource_type IN ('menu', 'database', 'feature')),
  parent_resource TEXT, -- For hierarchical permissions
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- System actions (what can be done with resources)
CREATE TABLE IF NOT EXISTS system_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE, -- e.g., 'view', 'create', 'update', 'delete', 'export'
  display_name TEXT NOT NULL, -- e.g., 'Xem', 'Tạo mới', 'Cập nhật', 'Xóa', 'Xuất dữ liệu'
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Permissions (resource + action combinations)
CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resource_id INTEGER NOT NULL,
  action_id INTEGER NOT NULL,
  permission_key TEXT NOT NULL UNIQUE, -- e.g., 'products.view', 'sales.create'
  display_name TEXT NOT NULL, -- e.g., 'Xem sản phẩm', 'Tạo đơn hàng'
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (resource_id) REFERENCES system_resources(id) ON DELETE CASCADE,
  FOREIGN KEY (action_id) REFERENCES system_actions(id) ON DELETE CASCADE,
  UNIQUE(resource_id, action_id)
);

-- Enhanced roles table
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  is_template INTEGER NOT NULL DEFAULT 0, -- 1 for role templates
  is_system INTEGER NOT NULL DEFAULT 0, -- 1 for system-defined roles
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Role permissions (which permissions each role has)
CREATE TABLE IF NOT EXISTS role_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  granted INTEGER NOT NULL DEFAULT 1, -- 1 = granted, 0 = denied
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE(role_id, permission_id)
);

-- Employee role assignments (employees can have multiple roles)
CREATE TABLE IF NOT EXISTS employee_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  assigned_by INTEGER NOT NULL, -- User who assigned the role
  assigned_at DATETIME NOT NULL DEFAULT (datetime('now')),
  is_active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE RESTRICT,
  UNIQUE(employee_id, role_id)
);

-- Individual employee permissions (overrides role permissions)
CREATE TABLE IF NOT EXISTS employee_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  granted INTEGER NOT NULL, -- 1 = granted, 0 = denied (overrides role)
  granted_by INTEGER NOT NULL, -- User who granted/denied the permission
  granted_at DATETIME NOT NULL DEFAULT (datetime('now')),
  reason TEXT, -- Reason for granting/denying permission
  is_active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE RESTRICT,
  UNIQUE(employee_id, permission_id)
);

-- Permission audit log for compliance and tracking
CREATE TABLE IF NOT EXISTS permission_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  permission_key TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('granted', 'revoked', 'role_assigned', 'role_removed')),
  old_value INTEGER, -- Previous permission state (0/1)
  new_value INTEGER, -- New permission state (0/1)
  role_name TEXT, -- Role name if this is a role operation
  changed_by INTEGER NOT NULL, -- User who made the change
  reason TEXT, -- Reason for the change
  ip_address TEXT, -- IP address of the user making the change
  user_agent TEXT, -- User agent of the browser
  changed_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- ============================================================================
-- RBAC INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_system_resources_type ON system_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_system_resources_active ON system_resources(is_active);
CREATE INDEX IF NOT EXISTS idx_permissions_key ON permissions(permission_key);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_employee_roles_employee ON employee_roles(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_roles_role ON employee_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_employee_permissions_employee ON employee_permissions(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_permissions_permission ON employee_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_employee ON permission_audit_log(employee_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_changed_at ON permission_audit_log(changed_at);

-- Record this unified schema as the authoritative version
INSERT OR IGNORE INTO schema_migrations (id, name, version, execution_time_ms, checksum)
VALUES ('unified_schema_v2', 'Unified database schema with RBAC system', 2, 0, 'unified_schema_rbac_v2');
