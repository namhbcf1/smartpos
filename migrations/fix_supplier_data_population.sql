-- ==========================================
-- FIX SUPPLIER DATA POPULATION FOR SERIAL NUMBERS
-- Populate missing supplier_id for existing serial numbers
-- ==========================================

-- 1. Update serial numbers that have stock_in_id but missing supplier_id
UPDATE serial_numbers 
SET supplier_id = (
  SELECT si.supplier_id 
  FROM stock_ins si 
  WHERE si.id = serial_numbers.stock_in_id
)
WHERE stock_in_id IS NOT NULL 
  AND supplier_id IS NULL;

-- 2. For serial numbers without stock_in_id, try to match by product and date
-- This is a best-effort approach for legacy data
UPDATE serial_numbers 
SET supplier_id = (
  SELECT si.supplier_id 
  FROM stock_ins si
  JOIN stock_in_items sii ON si.id = sii.stock_in_id
  WHERE sii.product_id = serial_numbers.product_id
    AND date(si.created_at) = date(serial_numbers.received_date)
  ORDER BY si.created_at DESC
  LIMIT 1
)
WHERE supplier_id IS NULL 
  AND received_date IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM stock_ins si
    JOIN stock_in_items sii ON si.id = sii.stock_in_id
    WHERE sii.product_id = serial_numbers.product_id
      AND date(si.created_at) = date(serial_numbers.received_date)
  );

-- 3. Create a view for better supplier data tracking
CREATE VIEW IF NOT EXISTS v_serial_numbers_with_supplier AS
SELECT 
  sn.id,
  sn.serial_number,
  sn.product_id,
  sn.supplier_id,
  sn.status,
  sn.received_date,
  sn.sold_date,
  sn.warranty_start_date,
  sn.warranty_end_date,
  
  -- Product information
  p.name as product_name,
  p.sku as product_sku,
  
  -- Supplier information with fallback
  COALESCE(sup.name, 'Chưa xác định') as supplier_name,
  sup.code as supplier_code,
  sup.contact_person as supplier_contact,
  
  -- Customer information
  c.full_name as customer_name,
  c.phone as customer_phone,
  
  -- Stock in information
  si.reference_number as stock_in_reference,
  si.created_at as stock_in_date
  
FROM serial_numbers sn
LEFT JOIN products p ON sn.product_id = p.id
LEFT JOIN suppliers sup ON sn.supplier_id = sup.id
LEFT JOIN customers c ON sn.customer_id = c.id
LEFT JOIN stock_ins si ON sn.stock_in_id = si.id
WHERE (sn.deleted_at IS NULL OR sn.deleted_at = '');

-- 4. Add index for better performance on supplier queries
CREATE INDEX IF NOT EXISTS idx_serial_numbers_supplier_id ON serial_numbers(supplier_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_stock_in_id ON serial_numbers(stock_in_id);

-- 5. Add trigger to ensure supplier_id is populated for new serial numbers
CREATE TRIGGER IF NOT EXISTS ensure_supplier_id_on_insert
AFTER INSERT ON serial_numbers
WHEN NEW.supplier_id IS NULL AND NEW.stock_in_id IS NOT NULL
BEGIN
  UPDATE serial_numbers 
  SET supplier_id = (
    SELECT supplier_id 
    FROM stock_ins 
    WHERE id = NEW.stock_in_id
  )
  WHERE id = NEW.id;
END;

-- 6. Add trigger to update supplier_id when stock_in_id is updated
CREATE TRIGGER IF NOT EXISTS ensure_supplier_id_on_update
AFTER UPDATE OF stock_in_id ON serial_numbers
WHEN NEW.supplier_id IS NULL AND NEW.stock_in_id IS NOT NULL
BEGIN
  UPDATE serial_numbers 
  SET supplier_id = (
    SELECT supplier_id 
    FROM stock_ins 
    WHERE id = NEW.stock_in_id
  )
  WHERE id = NEW.id;
END;

-- 7. Create a function to manually fix supplier data for specific serial numbers
-- This can be called from the admin interface if needed
-- Example usage: SELECT fix_serial_supplier_data('SN001-CPU-I5-13400F');

-- Note: SQLite doesn't support stored procedures, so this would be implemented
-- as an API endpoint instead. The logic would be:
-- 1. Find the serial number
-- 2. Look for matching stock_in records by product and date
-- 3. Update the supplier_id based on the best match
-- 4. Log the change for audit purposes

-- 8. Add validation to prevent future supplier data issues
-- This ensures that when creating serial numbers through stock-in,
-- the supplier_id is always populated

-- The trigger in step 5 and 6 should handle this automatically,
-- but we can also add application-level validation in the API endpoints.
