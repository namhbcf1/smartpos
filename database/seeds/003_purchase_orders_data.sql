-- Insert sample purchase orders (matching existing schema: po_number, total_amount)
INSERT OR IGNORE INTO purchase_orders (id, tenant_id, po_number, supplier_id, store_id, total_amount, status, order_date, expected_date, notes)
VALUES
('po-001', 'default', 'PO-2025-001', 'sup_001', 'store-1', 110000000, 'received', '2025-10-01', '2025-10-05', 'Order 5 iPhone units'),
('po-002', 'default', 'PO-2025-002', 'sup_002', 'store-1', 55000000, 'approved', '2025-10-01', '2025-10-07', 'Order 3 Samsung units'),
('po-003', 'default', 'PO-2025-003', 'sup_001', 'store-1', 88000000, 'pending', '2025-09-28', '2025-10-03', 'Order 2 MacBook units');

-- Check if purchase_order_items table exists and create if needed
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  purchase_order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT,
  product_sku TEXT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE
);

-- Insert purchase order items
INSERT OR IGNORE INTO purchase_order_items (id, purchase_order_id, product_id, product_name, product_sku, quantity, unit_price, total_price)
VALUES
('poi-001', 'po-001', 'prod_001', 'iPhone 15 Pro Max 256GB', 'IP15PM256', 5, 25000000, 125000000),
('poi-002', 'po-002', 'prod_002', 'Samsung Galaxy S24 Ultra', 'SGS24U512', 3, 22000000, 66000000),
('poi-003', 'po-003', 'prod_004', 'MacBook Pro 14" M3', 'MBP14M3', 2, 33000000, 66000000);
