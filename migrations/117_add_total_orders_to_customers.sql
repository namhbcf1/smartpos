-- Add total_orders column to customers table (if not exists)
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we need to check manually
-- This migration will fail silently if the column already exists
-- Since this is a duplicate migration, we can safely skip it by making it a no-op
SELECT 1 WHERE 0;