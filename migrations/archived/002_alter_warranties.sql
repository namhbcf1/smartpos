-- Migration: Alter warranties table to add order_id and serial_number_id
-- Purpose: Link warranties directly to orders (not legacy sales) and serial numbers
-- Date: 2025-10-03

-- Add new columns
ALTER TABLE warranties ADD COLUMN order_id TEXT;
ALTER TABLE warranties ADD COLUMN serial_number_id TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_warranties_order ON warranties(order_id);
CREATE INDEX IF NOT EXISTS idx_warranties_serial ON warranties(serial_number_id);

-- Optional: Migrate data from sale_id to order_id if you have a mapping table
-- Uncomment and adjust if you have order_sales_mapping table:
/*
UPDATE warranties
SET order_id = (
  SELECT order_id
  FROM order_sales_mapping
  WHERE sale_id = warranties.sale_id
)
WHERE sale_id IS NOT NULL;
*/

-- Note: sale_id is kept for backward compatibility
-- New warranties should use order_id instead of sale_id
