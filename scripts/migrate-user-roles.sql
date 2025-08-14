-- Migration script to update user roles and database schema
-- This script fixes the role constraints and updates existing data

-- Step 1: Create a backup of current users table
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;

-- Step 2: Drop the old constraint and recreate the users table with new roles
-- First, create the new table with updated schema
CREATE TABLE IF NOT EXISTS users_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  address TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cashier', 'inventory', 'sales_agent', 'affiliate')),
  store_id INTEGER NOT NULL DEFAULT 1,
  avatar_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (store_id) REFERENCES stores(id)
);

-- Step 3: Copy data from old table to new table
INSERT INTO users_new (
  id, username, password_hash, password_salt, full_name, email, phone, address,
  role, store_id, avatar_url, is_active, last_login, created_at, updated_at
)
SELECT 
  id, username, password_hash, password_salt, full_name, email, phone, address,
  role, COALESCE(store_id, 1), avatar_url, is_active, last_login, created_at, updated_at
FROM users;

-- Step 4: Drop old table and rename new table
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

-- Step 5: Recreate indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_store ON users(store_id);

-- Step 6: Update specific user roles based on employee data
-- Update Lê Thị Hoa to affiliate role
UPDATE users SET role = 'affiliate' WHERE username = 'lthhoa' OR email = 'lthhoa@smartpos.vn';

-- Step 7: Insert missing demo users with proper roles if they don't exist
INSERT OR IGNORE INTO users (
  username, password_hash, password_salt, full_name, email, role, store_id, is_active
) VALUES 
-- Affiliate user (Lê Thị Hoa)
('lthhoa', 
 '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: 123456
 'salt123',
 'Lê Thị Hoa', 
 'lthhoa@smartpos.vn', 
 'affiliate', 
 1, 
 1),
-- Sales agent user
('sales01',
 '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: 123456
 'salt123',
 'Nguyễn Văn Sales',
 'sales01@smartpos.vn',
 'sales_agent',
 1,
 1),
-- Inventory user
('inventory01',
 '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: 123456
 'salt123',
 'Trần Thị Kho',
 'inventory01@smartpos.vn',
 'inventory',
 1,
 1),
-- Cashier user
('cashier01',
 '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: 123456
 'salt123',
 'Phạm Văn Thu',
 'cashier01@smartpos.vn',
 'cashier',
 1,
 1);

-- Step 8: Create authentication sessions table if not exists
CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  token TEXT,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  is_active INTEGER NOT NULL DEFAULT 1,
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON auth_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_active ON auth_sessions(is_active);

-- Step 9: Create login attempts table for security
CREATE TABLE IF NOT EXISTS login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  success INTEGER NOT NULL DEFAULT 0,
  ip_address TEXT,
  user_agent TEXT,
  failure_reason TEXT,
  created_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_username ON login_attempts(username);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created ON login_attempts(created_at);

-- Step 10: Verify the migration
SELECT 'Migration completed. Current users:' as status;
SELECT id, username, full_name, email, role, is_active FROM users ORDER BY id;
