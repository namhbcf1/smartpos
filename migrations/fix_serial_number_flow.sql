-- ==========================================
-- FIX SERIAL NUMBER FLOW - NHẬP HÀNG ĐẾN BẢO HÀNH
-- ==========================================

-- 1. Thêm trường serial_numbers vào stock_in_items
ALTER TABLE stock_in_items ADD COLUMN serial_numbers TEXT; -- JSON array of serial numbers

-- 2. Thêm trường stock_in_id vào serial_numbers để track nguồn gốc
ALTER TABLE serial_numbers ADD COLUMN stock_in_id INTEGER;
ALTER TABLE serial_numbers ADD FOREIGN KEY (stock_in_id) REFERENCES stock_ins(id);

-- 3. Thêm trigger tự động tạo serial numbers khi nhập hàng
CREATE TRIGGER auto_create_serial_numbers
AFTER INSERT ON stock_in_items
WHEN NEW.serial_numbers IS NOT NULL
BEGIN
  -- Tạo serial numbers từ JSON array
  INSERT INTO serial_numbers (
    serial_number, 
    product_id, 
    supplier_id, 
    stock_in_id,
    status,
    received_date,
    created_by,
    created_at
  )
  SELECT 
    value as serial_number,
    NEW.product_id,
    (SELECT supplier_id FROM stock_ins WHERE id = NEW.stock_in_id),
    NEW.stock_in_id,
    'in_stock',
    datetime('now'),
    (SELECT user_id FROM stock_ins WHERE id = NEW.stock_in_id),
    datetime('now')
  FROM json_each(NEW.serial_numbers);
END;

-- 4. Trigger tự động update warranty khi bán hàng
CREATE TRIGGER auto_update_warranty_on_sale
AFTER UPDATE ON serial_numbers
WHEN NEW.status = 'sold' AND OLD.status != 'sold'
BEGIN
  -- Tự động tính warranty dates dựa trên product warranty period
  UPDATE serial_numbers 
  SET 
    warranty_start_date = datetime('now'),
    warranty_end_date = datetime('now', '+' || (
      SELECT warranty_period_months FROM products WHERE id = NEW.product_id
    ) || ' months'),
    sold_date = datetime('now')
  WHERE id = NEW.id;
END;

-- 5. View để track complete serial number flow
CREATE VIEW v_serial_number_flow AS
SELECT 
  sn.id,
  sn.serial_number,
  sn.status,
  sn.received_date,
  sn.sold_date,
  sn.warranty_start_date,
  sn.warranty_end_date,
  
  -- Product info
  p.name as product_name,
  p.sku as product_sku,
  p.warranty_period_months,
  
  -- Stock in info
  si.reference_number as stock_in_reference,
  si.created_at as stock_in_date,
  sup.name as supplier_name,
  
  -- Sale info
  s.receipt_number,
  s.created_at as sale_date,
  c.full_name as customer_name,
  
  -- Warranty info
  wr.warranty_number,
  wr.warranty_type,
  
  -- Warranty claims
  COUNT(wc.id) as claim_count,
  MAX(wc.status) as latest_claim_status
  
FROM serial_numbers sn
LEFT JOIN products p ON sn.product_id = p.id
LEFT JOIN stock_ins si ON sn.stock_in_id = si.id
LEFT JOIN suppliers sup ON si.supplier_id = sup.id
LEFT JOIN sales s ON sn.sale_id = s.id
LEFT JOIN customers c ON s.customer_id = c.id
LEFT JOIN warranty_registrations wr ON sn.id = wr.serial_number_id
LEFT JOIN warranty_claims wc ON wr.id = wc.warranty_registration_id
GROUP BY sn.id;

-- 6. Indexes for performance
CREATE INDEX idx_serial_numbers_stock_in ON serial_numbers(stock_in_id);
CREATE INDEX idx_serial_numbers_status_received ON serial_numbers(status, received_date);
CREATE INDEX idx_serial_numbers_warranty_dates ON serial_numbers(warranty_start_date, warranty_end_date);
