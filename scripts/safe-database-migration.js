#!/usr/bin/env node

/**
 * Safe Database Migration Script for SmartPOS
 * 
 * This script safely migrates the database by checking existing schema
 * and only adding missing columns/tables.
 */

const { execSync } = require('child_process');

console.log('🗄️ SmartPOS Safe Database Migration');
console.log('===================================\n');

const WRANGLER_DB_NAME = 'smartpos-db';

// Check if table exists
async function checkTableExists(tableName) {
  try {
    const command = `wrangler d1 execute ${WRANGLER_DB_NAME} --command="SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}';"`;
    const result = execSync(command, { encoding: 'utf8' });
    return result.includes(tableName);
  } catch (error) {
    console.warn(`Could not check table ${tableName}:`, error.message);
    return false;
  }
}

// Check if column exists in table
async function checkColumnExists(tableName, columnName) {
  try {
    const command = `wrangler d1 execute ${WRANGLER_DB_NAME} --command="PRAGMA table_info(${tableName});"`;
    const result = execSync(command, { encoding: 'utf8' });
    return result.includes(columnName);
  } catch (error) {
    console.warn(`Could not check column ${columnName} in ${tableName}:`, error.message);
    return false;
  }
}

// Execute SQL command safely
function executeSQLSafely(sql, description) {
  try {
    console.log(`🔄 ${description}...`);
    const command = `wrangler d1 execute ${WRANGLER_DB_NAME} --command="${sql}"`;
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error) {
    console.warn(`⚠️ ${description} failed:`, error.message);
    return false;
  }
}

// Main migration function
async function runSafeMigration() {
  console.log('🚀 Starting safe database migration...\n');

  // Step 1: Ensure basic tables exist
  const basicTables = [
    {
      name: 'stores',
      sql: `CREATE TABLE IF NOT EXISTS stores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        tax_number TEXT,
        is_main INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
      );`
    },
    {
      name: 'users',
      sql: `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cashier', 'inventory', 'sales_agent', 'affiliate')),
        store_id INTEGER NOT NULL DEFAULT 1,
        avatar_url TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        last_login DATETIME,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
      );`
    },
    {
      name: 'categories',
      sql: `CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        parent_id INTEGER,
        is_active INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
      );`
    },
    {
      name: 'suppliers',
      sql: `CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        tax_number TEXT,
        payment_terms TEXT,
        notes TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
      );`
    },
    {
      name: 'products',
      sql: `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        sku TEXT UNIQUE NOT NULL,
        barcode TEXT UNIQUE,
        category_id INTEGER,
        cost_price DECIMAL(15,2) NOT NULL DEFAULT 0,
        selling_price DECIMAL(15,2) NOT NULL DEFAULT 0,
        stock_quantity INTEGER NOT NULL DEFAULT 0,
        min_stock_level INTEGER NOT NULL DEFAULT 0,
        max_stock_level INTEGER,
        unit TEXT NOT NULL DEFAULT 'piece',
        weight DECIMAL(10,3),
        dimensions TEXT,
        warranty_period INTEGER DEFAULT 0,
        has_serial_tracking INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        image_url TEXT,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
      );`
    },
    {
      name: 'customers',
      sql: `CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        birthday DATE,
        loyalty_points INTEGER NOT NULL DEFAULT 0,
        customer_group TEXT NOT NULL DEFAULT 'regular' CHECK (customer_group IN ('regular', 'vip', 'wholesale', 'business')),
        notes TEXT,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
      );`
    },
    {
      name: 'sales',
      sql: `CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_number TEXT NOT NULL UNIQUE,
        customer_id INTEGER,
        user_id INTEGER NOT NULL,
        store_id INTEGER NOT NULL DEFAULT 1,
        subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
        tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
        discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
        total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
        payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer', 'qr', 'mixed')),
        payment_status TEXT NOT NULL DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'refunded', 'partial')),
        notes TEXT,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
      );`
    },
    {
      name: 'sale_items',
      sql: `CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price DECIMAL(15,2) NOT NULL,
        discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
        total_price DECIMAL(15,2) NOT NULL,
        serial_numbers TEXT,
        created_at DATETIME NOT NULL DEFAULT (datetime('now'))
      );`
    }
  ];

  // Create basic tables
  for (const table of basicTables) {
    executeSQLSafely(table.sql, `Creating table ${table.name}`);
  }

  // Step 2: Add missing columns to products table
  console.log('\n🔄 Checking for missing columns...');
  
  // Add supplier_id column if it doesn't exist
  try {
    const hasSupplierColumn = await checkColumnExists('products', 'supplier_id');
    if (!hasSupplierColumn) {
      executeSQLSafely(
        'ALTER TABLE products ADD COLUMN supplier_id INTEGER;',
        'Adding supplier_id column to products'
      );
    } else {
      console.log('✅ supplier_id column already exists');
    }
  } catch (error) {
    console.warn('⚠️ Could not check/add supplier_id column');
  }

  // Step 3: Create indexes
  console.log('\n🔄 Creating indexes...');
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);',
    'CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);',
    'CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);',
    'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);'
  ];

  indexes.forEach((indexSQL, i) => {
    executeSQLSafely(indexSQL, `Creating index ${i + 1}`);
  });

  // Step 4: Seed basic data
  console.log('\n🌱 Seeding basic data...');
  
  const seedData = [
    "INSERT OR IGNORE INTO stores (id, name, address, phone, is_main) VALUES (1, 'Main Store', '123 Main Street', '+84123456789', 1);",
    "INSERT OR IGNORE INTO users (id, username, password_hash, password_salt, full_name, role, store_id) VALUES (1, 'admin', 'admin', 'salt', 'Administrator', 'admin', 1);",
    "INSERT OR IGNORE INTO categories (id, name, description) VALUES (1, 'CPU', 'Processors'), (2, 'RAM', 'Memory'), (3, 'GPU', 'Graphics Cards'), (4, 'Motherboard', 'Motherboards'), (5, 'Storage', 'Hard Drives and SSDs'), (6, 'PSU', 'Power Supply Units'), (7, 'Case', 'Computer Cases'), (8, 'Cooling', 'Cooling Solutions');"
  ];

  seedData.forEach((sql, i) => {
    executeSQLSafely(sql, `Seeding data ${i + 1}`);
  });

  console.log('\n🎉 Safe database migration completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Test the API endpoints');
  console.log('2. Verify authentication works');
  console.log('3. Check dashboard data');
}

// Run migration
runSafeMigration().catch(error => {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
});
