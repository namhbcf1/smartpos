-- ==========================================
-- COMPUTERPOS PRO - WARRANTY & SERIAL NUMBER MANAGEMENT
-- Database Schema for Phase 1 Implementation
-- ==========================================

-- Serial Numbers Table
-- Tracks individual product serial numbers throughout their lifecycle
CREATE TABLE IF NOT EXISTS serial_numbers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  serial_number TEXT NOT NULL UNIQUE,
  product_id INTEGER NOT NULL,
  supplier_id INTEGER,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'in_stock' CHECK (
    status IN ('in_stock', 'sold', 'returned', 'defective', 'warranty_claim', 'disposed')
  ),
  
  -- Lifecycle timestamps
  received_date DATETIME NOT NULL DEFAULT (datetime('now')),
  sold_date DATETIME,
  warranty_start_date DATETIME,
  warranty_end_date DATETIME,
  
  -- Sales information
  sale_id INTEGER,
  customer_id INTEGER,
  
  -- Physical location
  location TEXT, -- Shelf/bin location in store
  condition_notes TEXT,
  
  -- Metadata
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  created_by INTEGER NOT NULL,
  
  -- Foreign key constraints
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Warranty Registrations Table
-- Manages warranty information for sold products
CREATE TABLE IF NOT EXISTS warranty_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  warranty_number TEXT NOT NULL UNIQUE,
  serial_number_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  sale_id INTEGER NOT NULL,
  
  -- Warranty details
  warranty_type TEXT NOT NULL CHECK (
    warranty_type IN ('manufacturer', 'store', 'extended', 'premium')
  ),
  warranty_period_months INTEGER NOT NULL DEFAULT 12,
  warranty_start_date DATETIME NOT NULL,
  warranty_end_date DATETIME NOT NULL,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'expired', 'voided', 'claimed', 'transferred')
  ),
  
  -- Terms and conditions
  terms_accepted INTEGER NOT NULL DEFAULT 0,
  terms_accepted_date DATETIME,
  terms_version TEXT,
  
  -- Contact information
  contact_phone TEXT,
  contact_email TEXT,
  contact_address TEXT,
  
  -- Metadata
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  created_by INTEGER NOT NULL,
  
  -- Foreign key constraints
  FOREIGN KEY (serial_number_id) REFERENCES serial_numbers(id) ON DELETE RESTRICT,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Warranty Claims Table
-- Tracks warranty service requests and repairs
CREATE TABLE IF NOT EXISTS warranty_claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  claim_number TEXT NOT NULL UNIQUE,
  warranty_registration_id INTEGER NOT NULL,
  serial_number_id INTEGER NOT NULL,
  
  -- Claim details
  claim_type TEXT NOT NULL CHECK (
    claim_type IN ('repair', 'replacement', 'refund', 'diagnostic')
  ),
  issue_description TEXT NOT NULL,
  reported_date DATETIME NOT NULL DEFAULT (datetime('now')),
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (
    status IN ('submitted', 'approved', 'in_progress', 'completed', 'rejected', 'cancelled')
  ),
  
  -- Resolution details
  resolution_type TEXT CHECK (
    resolution_type IN ('repaired', 'replaced', 'refunded', 'no_fault_found', 'out_of_warranty')
  ),
  resolution_description TEXT,
  resolution_date DATETIME,
  
  -- Cost tracking
  estimated_cost DECIMAL(10,2) DEFAULT 0,
  actual_cost DECIMAL(10,2) DEFAULT 0,
  covered_by_warranty INTEGER NOT NULL DEFAULT 1,
  customer_charge DECIMAL(10,2) DEFAULT 0,
  
  -- Service provider
  technician_id INTEGER,
  service_provider TEXT,
  external_reference TEXT,
  
  -- Metadata
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  created_by INTEGER NOT NULL,
  
  -- Foreign key constraints
  FOREIGN KEY (warranty_registration_id) REFERENCES warranty_registrations(id) ON DELETE RESTRICT,
  FOREIGN KEY (serial_number_id) REFERENCES serial_numbers(id) ON DELETE RESTRICT,
  FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Warranty Notifications Table
-- Manages automated notifications for warranty events
CREATE TABLE IF NOT EXISTS warranty_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  warranty_registration_id INTEGER NOT NULL,
  
  -- Notification details
  notification_type TEXT NOT NULL CHECK (
    notification_type IN ('expiry_warning', 'expired', 'claim_update', 'registration_confirmation')
  ),
  notification_method TEXT NOT NULL CHECK (
    notification_method IN ('email', 'sms', 'push', 'in_app')
  ),
  
  -- Scheduling
  scheduled_date DATETIME NOT NULL,
  sent_date DATETIME,
  
  -- Content
  subject TEXT,
  message TEXT NOT NULL,
  template_id TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'sent', 'failed', 'cancelled')
  ),
  
  -- Delivery tracking
  delivery_status TEXT CHECK (
    delivery_status IN ('delivered', 'bounced', 'opened', 'clicked')
  ),
  error_message TEXT,
  
  -- Metadata
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  
  -- Foreign key constraints
  FOREIGN KEY (warranty_registration_id) REFERENCES warranty_registrations(id) ON DELETE CASCADE
);

-- Product Warranty Configurations Table
-- Defines warranty terms for different products/categories
CREATE TABLE IF NOT EXISTS product_warranty_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  category_id INTEGER,
  
  -- Warranty terms
  default_warranty_months INTEGER NOT NULL DEFAULT 12,
  max_warranty_months INTEGER NOT NULL DEFAULT 36,
  warranty_type TEXT NOT NULL DEFAULT 'manufacturer',
  
  -- Notification settings
  warning_days_before_expiry INTEGER NOT NULL DEFAULT 30,
  enable_auto_notifications INTEGER NOT NULL DEFAULT 1,
  
  -- Terms and conditions
  warranty_terms TEXT,
  exclusions TEXT,
  
  -- Metadata
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  created_by INTEGER NOT NULL,
  
  -- Constraints
  CHECK (product_id IS NOT NULL OR category_id IS NOT NULL),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- ==========================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ==========================================

-- Serial Numbers indexes
CREATE INDEX IF NOT EXISTS idx_serial_numbers_serial ON serial_numbers(serial_number);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_product ON serial_numbers(product_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_status ON serial_numbers(status);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_sale ON serial_numbers(sale_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_customer ON serial_numbers(customer_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_dates ON serial_numbers(received_date, sold_date);

-- Warranty Registrations indexes
CREATE INDEX IF NOT EXISTS idx_warranty_reg_number ON warranty_registrations(warranty_number);
CREATE INDEX IF NOT EXISTS idx_warranty_reg_serial ON warranty_registrations(serial_number_id);
CREATE INDEX IF NOT EXISTS idx_warranty_reg_customer ON warranty_registrations(customer_id);
CREATE INDEX IF NOT EXISTS idx_warranty_reg_status ON warranty_registrations(status);
CREATE INDEX IF NOT EXISTS idx_warranty_reg_dates ON warranty_registrations(warranty_start_date, warranty_end_date);
CREATE INDEX IF NOT EXISTS idx_warranty_reg_expiry ON warranty_registrations(warranty_end_date) WHERE status = 'active';

-- Warranty Claims indexes
CREATE INDEX IF NOT EXISTS idx_warranty_claims_number ON warranty_claims(claim_number);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_warranty ON warranty_claims(warranty_registration_id);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_status ON warranty_claims(status);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_dates ON warranty_claims(reported_date, resolution_date);

-- Warranty Notifications indexes
CREATE INDEX IF NOT EXISTS idx_warranty_notif_warranty ON warranty_notifications(warranty_registration_id);
CREATE INDEX IF NOT EXISTS idx_warranty_notif_scheduled ON warranty_notifications(scheduled_date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_warranty_notif_type ON warranty_notifications(notification_type);

-- Product Warranty Configs indexes
CREATE INDEX IF NOT EXISTS idx_warranty_config_product ON product_warranty_configs(product_id);
CREATE INDEX IF NOT EXISTS idx_warranty_config_category ON product_warranty_configs(category_id);

-- ==========================================
-- TRIGGERS FOR DATA INTEGRITY
-- ==========================================

-- Update warranty end date when warranty period changes
CREATE TRIGGER IF NOT EXISTS update_warranty_end_date
  AFTER UPDATE OF warranty_period_months, warranty_start_date ON warranty_registrations
  FOR EACH ROW
BEGIN
  UPDATE warranty_registrations 
  SET warranty_end_date = datetime(NEW.warranty_start_date, '+' || NEW.warranty_period_months || ' months'),
      updated_at = datetime('now')
  WHERE id = NEW.id;
END;

-- Update serial number status when sold
CREATE TRIGGER IF NOT EXISTS update_serial_status_on_sale
  AFTER UPDATE OF sale_id ON serial_numbers
  FOR EACH ROW
  WHEN NEW.sale_id IS NOT NULL AND OLD.sale_id IS NULL
BEGIN
  UPDATE serial_numbers 
  SET status = 'sold',
      sold_date = datetime('now'),
      updated_at = datetime('now')
  WHERE id = NEW.id;
END;

-- Auto-create warranty registration for eligible products
CREATE TRIGGER IF NOT EXISTS auto_create_warranty_registration
  AFTER UPDATE OF status ON serial_numbers
  FOR EACH ROW
  WHEN NEW.status = 'sold' AND OLD.status != 'sold' AND NEW.sale_id IS NOT NULL
BEGIN
  INSERT INTO warranty_registrations (
    warranty_number,
    serial_number_id,
    product_id,
    customer_id,
    sale_id,
    warranty_start_date,
    warranty_end_date,
    warranty_period_months,
    created_by
  )
  SELECT 
    'WR' || strftime('%Y%m%d', 'now') || '-' || printf('%06d', NEW.id),
    NEW.id,
    NEW.product_id,
    NEW.customer_id,
    NEW.sale_id,
    datetime('now'),
    datetime('now', '+12 months'),
    12,
    NEW.created_by
  WHERE EXISTS (
    SELECT 1 FROM products p 
    WHERE p.id = NEW.product_id 
    AND p.category_id IN (
      SELECT id FROM categories 
      WHERE name LIKE '%máy tính%' OR name LIKE '%laptop%' OR name LIKE '%PC%'
    )
  );
END;
