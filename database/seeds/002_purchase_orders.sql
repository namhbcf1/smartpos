-- Purchase Orders Tables
CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  supplier_id TEXT NOT NULL,
  supplier_name TEXT,
  order_date TEXT NOT NULL DEFAULT (datetime('now')),
  expected_delivery_date TEXT,
  actual_delivery_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'received', 'cancelled', 'partial')),
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  store_id TEXT,
  deleted_at TEXT,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id TEXT PRIMARY KEY,
  purchase_order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  quantity_ordered INTEGER NOT NULL,
  quantity_received INTEGER NOT NULL DEFAULT 0,
  unit_price_cents INTEGER NOT NULL,
  total_price_cents INTEGER NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON purchase_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant ON purchase_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product ON purchase_order_items(product_id);

-- Sample data
INSERT OR IGNORE INTO purchase_orders (id, order_number, supplier_id, supplier_name, order_date, status, subtotal_cents, tax_cents, total_cents, created_by, tenant_id)
VALUES
('po-001', 'PO-2025-001', 'sup_001', 'Apple Vietnam', '2025-10-01', 'received', 10000000000, 1000000000, 11000000000, 'admin', 'default'),
('po-002', 'PO-2025-002', 'sup_002', 'Samsung Vietnam', '2025-10-01', 'approved', 5000000000, 500000000, 5500000000, 'admin', 'default'),
('po-003', 'PO-2025-003', 'sup_001', 'Apple Vietnam', '2025-09-28', 'pending', 8000000000, 800000000, 8800000000, 'admin', 'default');

INSERT OR IGNORE INTO purchase_order_items (id, purchase_order_id, product_id, product_name, product_sku, quantity_ordered, quantity_received, unit_price_cents, total_price_cents)
VALUES
('poi-001', 'po-001', 'prod_001', 'iPhone 15 Pro Max 256GB', 'IP15PM256', 5, 5, 2500000000, 12500000000),
('poi-002', 'po-002', 'prod_002', 'Samsung Galaxy S24 Ultra', 'SGS24U512', 3, 0, 2200000000, 6600000000),
('poi-003', 'po-003', 'prod_004', 'MacBook Pro 14" M3', 'MBP14M3', 2, 0, 3300000000, 6600000000);
