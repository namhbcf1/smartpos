-- ============================================================================
-- Migration 101: Add warehouse_id column to inventory_movements
-- Fix for existing database
-- ============================================================================

-- Add warehouse_id column if not exists
-- Check if column exists first
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- This migration will be skipped if column already exists
