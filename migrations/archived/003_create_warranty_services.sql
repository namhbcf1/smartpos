-- Migration: Create warranty_services table
-- Purpose: Track warranty service history (repairs, replacements, etc.)
-- Date: 2025-10-03

CREATE TABLE IF NOT EXISTS warranty_services (
  -- Primary key
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT DEFAULT 'default',

  -- Linkage
  warranty_id TEXT NOT NULL,
  serial_number_id TEXT,
  product_id TEXT,
  customer_id TEXT,

  -- Service tracking
  service_number TEXT UNIQUE NOT NULL, -- Số phiếu sửa chữa: WS-2025-00001
  issue_description TEXT NOT NULL,     -- Mô tả lỗi
  service_type TEXT DEFAULT 'repair',  -- repair, replace, refund, inspection

  -- Dates
  reported_at TEXT DEFAULT (datetime('now')),
  received_at TEXT,        -- Ngày nhận máy
  started_at TEXT,         -- Ngày bắt đầu sửa
  completed_at TEXT,       -- Ngày hoàn thành
  returned_at TEXT,        -- Ngày trả khách

  -- Status
  status TEXT DEFAULT 'pending', -- pending, received, in_progress, completed, cancelled, waiting_parts

  -- Cost tracking (in cents)
  estimated_cost_cents INTEGER DEFAULT 0,
  actual_cost_cents INTEGER DEFAULT 0,
  customer_charge_cents INTEGER DEFAULT 0,
  covered_by_warranty INTEGER DEFAULT 1, -- 1 = yes, 0 = no

  -- Technician & service details
  technician_id TEXT,
  service_center TEXT,
  service_notes TEXT,
  parts_replaced TEXT,     -- JSON array: ["Battery", "Screen"]
  diagnostic_notes TEXT,

  -- Quality control
  qc_checked INTEGER DEFAULT 0,
  qc_passed INTEGER DEFAULT 0,
  qc_notes TEXT,

  -- Customer feedback
  customer_rating INTEGER, -- 1-5 stars
  customer_feedback TEXT,

  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  created_by TEXT,

  -- Foreign keys
  FOREIGN KEY (warranty_id) REFERENCES warranties(id) ON DELETE CASCADE,
  FOREIGN KEY (serial_number_id) REFERENCES serial_numbers(id) ON DELETE SET NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_warranty_services_warranty ON warranty_services(warranty_id, tenant_id);
CREATE INDEX idx_warranty_services_serial ON warranty_services(serial_number_id);
CREATE INDEX idx_warranty_services_customer ON warranty_services(customer_id);
CREATE INDEX idx_warranty_services_status ON warranty_services(status, tenant_id);
CREATE INDEX idx_warranty_services_technician ON warranty_services(technician_id);
CREATE INDEX idx_warranty_services_service_number ON warranty_services(service_number);
CREATE INDEX idx_warranty_services_dates ON warranty_services(reported_at, tenant_id);

-- Trigger to update updated_at
CREATE TRIGGER IF NOT EXISTS update_warranty_services_timestamp
AFTER UPDATE ON warranty_services
BEGIN
  UPDATE warranty_services SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Auto-generate service_number trigger
CREATE TRIGGER IF NOT EXISTS generate_warranty_service_number
AFTER INSERT ON warranty_services
WHEN NEW.service_number IS NULL
BEGIN
  UPDATE warranty_services
  SET service_number = 'WS-' || strftime('%Y%m%d', 'now') || '-' || substr('00000' || NEW.rowid, -5)
  WHERE id = NEW.id;
END;

-- Comment
-- This table tracks all warranty service requests and their progress
