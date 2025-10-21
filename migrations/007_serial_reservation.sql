-- Serial Number Reservation System
-- Add columns to support serial reservation with timeout

-- Add reservation columns to serial_numbers table
ALTER TABLE serial_numbers ADD COLUMN reserved_at TEXT;
ALTER TABLE serial_numbers ADD COLUMN reserved_by TEXT;
ALTER TABLE serial_numbers ADD COLUMN reserved_until TEXT;

-- Create index for fast reservation queries
CREATE INDEX IF NOT EXISTS idx_serial_reserved_until ON serial_numbers(reserved_until) WHERE reserved_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_serial_reserved_by ON serial_numbers(reserved_by) WHERE reserved_by IS NOT NULL;
