-- ==========================================
-- COMPUTERPOS PRO - UPDATE FULL_NAME DATA
-- Update existing full_name columns with proper data
-- ==========================================

-- Update full_name with combined first_name and last_name for users where full_name is empty
UPDATE users 
SET full_name = TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
WHERE full_name IS NULL OR full_name = '' OR full_name = ' ';

-- Update full_name with combined first_name and last_name for customers where full_name is empty
UPDATE customers 
SET full_name = TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
WHERE full_name IS NULL OR full_name = '' OR full_name = ' ';

-- Set default full_name for users with no name data
UPDATE users 
SET full_name = 'Unknown User'
WHERE full_name IS NULL OR full_name = '' OR full_name = ' ';

-- Set default full_name for customers with no name data
UPDATE customers 
SET full_name = 'Unknown Customer'
WHERE full_name IS NULL OR full_name = '' OR full_name = ' ';
