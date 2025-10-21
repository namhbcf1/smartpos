-- Extend serial_numbers table with comprehensive fields
-- Migration: Add all detailed fields for serial number management
-- Date: 2025-10-17

-- Add import information fields
ALTER TABLE serial_numbers ADD COLUMN import_invoice TEXT;
ALTER TABLE serial_numbers ADD COLUMN supplier_id TEXT;
ALTER TABLE serial_numbers ADD COLUMN imported_by TEXT;
ALTER TABLE serial_numbers ADD COLUMN cost_price INTEGER; -- in cents

-- Add sale information fields
ALTER TABLE serial_numbers ADD COLUMN sale_date TEXT;
ALTER TABLE serial_numbers ADD COLUMN customer_name TEXT;
ALTER TABLE serial_numbers ADD COLUMN customer_phone TEXT;
ALTER TABLE serial_numbers ADD COLUMN sale_price INTEGER; -- in cents
ALTER TABLE serial_numbers ADD COLUMN sold_by TEXT;
ALTER TABLE serial_numbers ADD COLUMN sales_channel TEXT;
ALTER TABLE serial_numbers ADD COLUMN order_status TEXT;

-- Add warranty information fields
ALTER TABLE serial_numbers ADD COLUMN warranty_type TEXT;
ALTER TABLE serial_numbers ADD COLUMN warranty_start_date TEXT;
ALTER TABLE serial_numbers ADD COLUMN warranty_end_date TEXT;
ALTER TABLE serial_numbers ADD COLUMN warranty_months INTEGER DEFAULT 36;
ALTER TABLE serial_numbers ADD COLUMN warranty_ticket TEXT;
ALTER TABLE serial_numbers ADD COLUMN warranty_provider TEXT;
ALTER TABLE serial_numbers ADD COLUMN warranty_status TEXT;
ALTER TABLE serial_numbers ADD COLUMN warranty_last_service TEXT;

-- Add internal management fields
ALTER TABLE serial_numbers ADD COLUMN internal_id TEXT;
ALTER TABLE serial_numbers ADD COLUMN source TEXT;
ALTER TABLE serial_numbers ADD COLUMN cycle_count INTEGER DEFAULT 0;
ALTER TABLE serial_numbers ADD COLUMN cycle_status TEXT;
ALTER TABLE serial_numbers ADD COLUMN risk_level TEXT;
ALTER TABLE serial_numbers ADD COLUMN internal_notes TEXT;

-- Add system information fields
ALTER TABLE serial_numbers ADD COLUMN data_source TEXT;
ALTER TABLE serial_numbers ADD COLUMN sync_status TEXT;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_serial_numbers_supplier ON serial_numbers(supplier_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_warranty ON serial_numbers(warranty_status, warranty_end_date);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_internal ON serial_numbers(internal_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_source ON serial_numbers(source);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_cycle ON serial_numbers(cycle_status);
