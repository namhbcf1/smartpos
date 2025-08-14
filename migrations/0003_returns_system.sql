-- SmartPOS Returns System Migration
-- Creates all tables and data needed for the returns management system
-- Compatible with Cloudflare D1 SQLite

-- =====================================================
-- RETURNS CORE TABLES
-- =====================================================

-- Returns table - Main returns records
CREATE TABLE IF NOT EXISTS returns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  original_sale_id INTEGER NOT NULL,
  return_number TEXT NOT NULL UNIQUE,
  return_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  return_reason TEXT NOT NULL,
  return_status TEXT NOT NULL DEFAULT 'pending',
  refund_method TEXT NOT NULL DEFAULT 'cash',
  refund_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  store_credit_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  processing_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  restocking_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  reference_number TEXT,
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  created_by INTEGER NOT NULL,
  approved_at DATETIME,
  approved_by INTEGER,
  completed_at DATETIME,
  completed_by INTEGER,
  FOREIGN KEY (original_sale_id) REFERENCES sales (id),
  FOREIGN KEY (created_by) REFERENCES users (id),
  FOREIGN KEY (approved_by) REFERENCES users (id),
  FOREIGN KEY (completed_by) REFERENCES users (id)
);

-- Return items table - Individual items being returned
CREATE TABLE IF NOT EXISTS return_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  return_id INTEGER NOT NULL,
  sale_item_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  quantity_returned INTEGER NOT NULL,
  quantity_original INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  return_reason TEXT,
  condition TEXT NOT NULL DEFAULT 'used',
  restockable INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (return_id) REFERENCES returns (id) ON DELETE CASCADE,
  FOREIGN KEY (sale_item_id) REFERENCES sale_items (id),
  FOREIGN KEY (product_id) REFERENCES products (id)
);

-- Refund transactions table - Financial transactions for refunds
CREATE TABLE IF NOT EXISTS refund_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  return_id INTEGER NOT NULL,
  transaction_type TEXT NOT NULL DEFAULT 'refund',
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  reference_number TEXT,
  transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  created_by INTEGER NOT NULL,
  FOREIGN KEY (return_id) REFERENCES returns (id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users (id)
);

-- Return policies table - Configurable return policies
CREATE TABLE IF NOT EXISTS return_policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  return_period_days INTEGER NOT NULL DEFAULT 30,
  restocking_fee_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  processing_fee_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  conditions TEXT,
  applicable_categories TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Return reasons table - Predefined return reasons
CREATE TABLE IF NOT EXISTS return_reasons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reason TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  requires_approval INTEGER NOT NULL DEFAULT 0,
  restocking_fee_applicable INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Returns table indexes
CREATE INDEX IF NOT EXISTS idx_returns_original_sale_id ON returns (original_sale_id);
CREATE INDEX IF NOT EXISTS idx_returns_return_number ON returns (return_number);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns (return_status);
CREATE INDEX IF NOT EXISTS idx_returns_created_at ON returns (created_at);
CREATE INDEX IF NOT EXISTS idx_returns_created_by ON returns (created_by);

-- Return items table indexes
CREATE INDEX IF NOT EXISTS idx_return_items_return_id ON return_items (return_id);
CREATE INDEX IF NOT EXISTS idx_return_items_product_id ON return_items (product_id);
CREATE INDEX IF NOT EXISTS idx_return_items_sale_item_id ON return_items (sale_item_id);

-- Refund transactions table indexes
CREATE INDEX IF NOT EXISTS idx_refund_transactions_return_id ON refund_transactions (return_id);
CREATE INDEX IF NOT EXISTS idx_refund_transactions_status ON refund_transactions (status);
CREATE INDEX IF NOT EXISTS idx_refund_transactions_created_at ON refund_transactions (created_at);

-- =====================================================
-- DEFAULT DATA
-- =====================================================

-- Insert default return policies
INSERT OR IGNORE INTO return_policies (name, description, return_period_days, restocking_fee_percentage, processing_fee_amount, conditions, applicable_categories) VALUES
('Standard Return Policy', 'Standard 30-day return policy for most items', 30, 0.00, 0.00, 'Items must be in original condition with receipt', 'general,electronics,clothing'),
('Electronics Return Policy', 'Extended return policy for electronics', 14, 15.00, 5000.00, 'Items must be unopened and in original packaging', 'electronics'),
('Final Sale Policy', 'No returns allowed for final sale items', 0, 0.00, 0.00, 'All sales final - no returns or exchanges', 'clearance,final_sale'),
('Premium Return Policy', 'Extended return policy for premium customers', 60, 0.00, 0.00, 'Extended return period for VIP customers', 'all');

-- Insert default return reasons
INSERT OR IGNORE INTO return_reasons (reason, description, category, requires_approval, restocking_fee_applicable, sort_order) VALUES
('Defective Product', 'Product is damaged or not working properly', 'quality', 0, 0, 1),
('Wrong Item Received', 'Customer received incorrect product', 'shipping', 0, 0, 2),
('Changed Mind', 'Customer no longer wants the product', 'customer', 0, 1, 3),
('Size/Fit Issues', 'Product does not fit properly', 'sizing', 0, 0, 4),
('Better Price Found', 'Customer found better price elsewhere', 'pricing', 1, 1, 5),
('Product Not as Described', 'Product differs from description', 'description', 0, 0, 6),
('Duplicate Order', 'Customer accidentally ordered multiple times', 'ordering', 0, 0, 7),
('Gift Return', 'Returning unwanted gift', 'gift', 0, 1, 8),
('Warranty Claim', 'Product covered under warranty', 'warranty', 1, 0, 9),
('Store Credit Request', 'Customer prefers store credit', 'preference', 0, 0, 10);

-- =====================================================
-- TRIGGERS FOR DATA INTEGRITY
-- =====================================================

-- Update returns.updated_at when record is modified
CREATE TRIGGER IF NOT EXISTS update_returns_timestamp 
AFTER UPDATE ON returns
BEGIN
  UPDATE returns SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Update return policies.updated_at when record is modified
CREATE TRIGGER IF NOT EXISTS update_return_policies_timestamp 
AFTER UPDATE ON return_policies
BEGIN
  UPDATE return_policies SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Validate return status transitions
CREATE TRIGGER IF NOT EXISTS validate_return_status_transition
BEFORE UPDATE OF return_status ON returns
WHEN OLD.return_status != NEW.return_status
BEGIN
  SELECT CASE
    -- Pending can go to approved, rejected, or cancelled
    WHEN OLD.return_status = 'pending' AND NEW.return_status NOT IN ('approved', 'rejected', 'cancelled') THEN
      RAISE(ABORT, 'Invalid status transition from pending')
    -- Approved can go to completed or cancelled
    WHEN OLD.return_status = 'approved' AND NEW.return_status NOT IN ('completed', 'cancelled') THEN
      RAISE(ABORT, 'Invalid status transition from approved')
    -- Rejected and completed are final states
    WHEN OLD.return_status IN ('rejected', 'completed', 'cancelled') THEN
      RAISE(ABORT, 'Cannot change status from final state')
  END;
END;

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- Returns summary view
CREATE VIEW IF NOT EXISTS returns_summary AS
SELECT 
  r.id,
  r.return_number,
  r.original_sale_id,
  s.sale_number,
  s.customer_name,
  r.return_amount,
  r.return_reason,
  r.return_status,
  r.refund_method,
  r.created_at,
  r.updated_at,
  u1.username as created_by_username,
  u2.username as approved_by_username,
  COUNT(ri.id) as items_count
FROM returns r
LEFT JOIN sales s ON r.original_sale_id = s.id
LEFT JOIN users u1 ON r.created_by = u1.id
LEFT JOIN users u2 ON r.approved_by = u2.id
LEFT JOIN return_items ri ON r.id = ri.return_id
GROUP BY r.id;

-- Returns statistics view
CREATE VIEW IF NOT EXISTS returns_stats AS
SELECT 
  COUNT(*) as total_returns,
  COUNT(CASE WHEN return_status = 'pending' THEN 1 END) as pending_returns,
  COUNT(CASE WHEN return_status = 'approved' THEN 1 END) as approved_returns,
  COUNT(CASE WHEN return_status = 'rejected' THEN 1 END) as rejected_returns,
  COUNT(CASE WHEN return_status = 'completed' THEN 1 END) as completed_returns,
  SUM(return_amount) as total_return_amount,
  AVG(return_amount) as average_return_amount,
  COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as today_returns,
  COUNT(CASE WHEN DATE(created_at) >= DATE('now', '-7 days') THEN 1 END) as week_returns,
  COUNT(CASE WHEN DATE(created_at) >= DATE('now', '-30 days') THEN 1 END) as month_returns
FROM returns;
