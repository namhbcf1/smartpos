-- ==========================================
-- COMPUTERPOS PRO - ADD FULL_NAME COLUMNS
-- Replace first_name/last_name with full_name
-- ==========================================

-- Add full_name column to users table if not exists
ALTER TABLE users ADD COLUMN full_name TEXT;

-- Update full_name with combined first_name and last_name for users
UPDATE users 
SET full_name = COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')
WHERE full_name IS NULL;

-- Clean up extra spaces in users
UPDATE users 
SET full_name = TRIM(full_name)
WHERE full_name IS NOT NULL;

-- Add full_name column to customers table if not exists
ALTER TABLE customers ADD COLUMN full_name TEXT;

-- Update full_name with combined first_name and last_name for customers
UPDATE customers 
SET full_name = COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')
WHERE full_name IS NULL;

-- Clean up extra spaces in customers
UPDATE customers 
SET full_name = TRIM(full_name)
WHERE full_name IS NOT NULL;

-- Set default full_name for empty records
UPDATE users 
SET full_name = 'Unknown User'
WHERE full_name IS NULL OR full_name = '' OR full_name = ' ';

UPDATE customers 
SET full_name = 'Unknown Customer'
WHERE full_name IS NULL OR full_name = '' OR full_name = ' ';
