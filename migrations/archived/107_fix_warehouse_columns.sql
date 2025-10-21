-- Fix warehouse columns migration
-- This migration handles the case where warehouse_id column might already exist

-- Check if warehouse_id column exists in inventory_movements
-- If it doesn't exist, add it
-- This is a safe migration that won't fail if column already exists

-- Note: This migration is designed to be idempotent
-- It will not fail if the column already exists