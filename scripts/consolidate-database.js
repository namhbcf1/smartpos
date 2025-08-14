#!/usr/bin/env node

/**
 * Database Schema Consolidation Script for SmartPOS
 * 
 * This script consolidates multiple schema files into a single
 * unified database structure and runs necessary migrations.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🗄️ SmartPOS Database Consolidation Script');
console.log('==========================================\n');

// Configuration
const SCHEMA_FILE = 'src/schema-consolidated.sql';
const BACKUP_DIR = 'backups';
const WRANGLER_DB_NAME = 'smartpos-db';

// Utility functions
function checkFile(filePath) {
  return fs.existsSync(filePath);
}

function createBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📁 Created backup directory: ${BACKUP_DIR}`);
  }
}

function backupCurrentSchema() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `schema-backup-${timestamp}.sql`);
    
    console.log('💾 Creating database backup...');
    
    // Export current database schema
    const exportCommand = `wrangler d1 execute ${WRANGLER_DB_NAME} --command=".schema" > ${backupFile}`;
    execSync(exportCommand, { stdio: 'inherit' });
    
    console.log(`✅ Database schema backed up to: ${backupFile}`);
    return backupFile;
  } catch (error) {
    console.warn('⚠️ Could not create backup:', error.message);
    return null;
  }
}

function validateSchema() {
  if (!checkFile(SCHEMA_FILE)) {
    console.error(`❌ Schema file not found: ${SCHEMA_FILE}`);
    return false;
  }
  
  const schemaContent = fs.readFileSync(SCHEMA_FILE, 'utf8');
  
  // Basic validation
  const requiredTables = [
    'stores', 'users', 'customers', 'categories', 'suppliers',
    'products', 'serial_numbers', 'sales', 'sale_items',
    'inventory_movements', 'warranty_claims', 'returns',
    'return_items', 'error_tracking', 'audit_logs'
  ];
  
  for (const table of requiredTables) {
    if (!schemaContent.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
      console.error(`❌ Missing required table: ${table}`);
      return false;
    }
  }
  
  console.log('✅ Schema validation passed');
  return true;
}

function applyConsolidatedSchema() {
  try {
    console.log('🔄 Applying consolidated schema...');
    
    const command = `wrangler d1 execute ${WRANGLER_DB_NAME} --file=${SCHEMA_FILE}`;
    execSync(command, { stdio: 'inherit' });
    
    console.log('✅ Consolidated schema applied successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to apply schema:', error.message);
    return false;
  }
}

function seedInitialData() {
  try {
    console.log('🌱 Seeding initial data...');
    
    // Create default store
    const seedStore = `
      INSERT OR IGNORE INTO stores (id, name, address, phone, is_main) 
      VALUES (1, 'Main Store', '123 Main Street', '+84123456789', 1);
    `;
    
    // Create default admin user
    const seedAdmin = `
      INSERT OR IGNORE INTO users (id, username, password_hash, password_salt, full_name, role, store_id) 
      VALUES (1, 'admin', 'admin', 'salt', 'Administrator', 'admin', 1);
    `;
    
    // Create default categories
    const seedCategories = `
      INSERT OR IGNORE INTO categories (id, name, description) VALUES 
      (1, 'CPU', 'Processors'),
      (2, 'RAM', 'Memory'),
      (3, 'GPU', 'Graphics Cards'),
      (4, 'Motherboard', 'Motherboards'),
      (5, 'Storage', 'Hard Drives and SSDs'),
      (6, 'PSU', 'Power Supply Units'),
      (7, 'Case', 'Computer Cases'),
      (8, 'Cooling', 'Cooling Solutions');
    `;
    
    const seedSQL = seedStore + seedAdmin + seedCategories;
    
    // Write seed data to temporary file
    const seedFile = 'temp-seed.sql';
    fs.writeFileSync(seedFile, seedSQL);
    
    // Apply seed data
    const command = `wrangler d1 execute ${WRANGLER_DB_NAME} --file=${seedFile}`;
    execSync(command, { stdio: 'inherit' });
    
    // Clean up temporary file
    fs.unlinkSync(seedFile);
    
    console.log('✅ Initial data seeded successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to seed initial data:', error.message);
    return false;
  }
}

function verifyDatabase() {
  try {
    console.log('🔍 Verifying database structure...');
    
    // Check if tables exist
    const checkCommand = `wrangler d1 execute ${WRANGLER_DB_NAME} --command="SELECT name FROM sqlite_master WHERE type='table';"`;
    const result = execSync(checkCommand, { encoding: 'utf8' });
    
    console.log('📋 Database tables:');
    console.log(result);
    
    // Check if admin user exists
    const checkAdmin = `wrangler d1 execute ${WRANGLER_DB_NAME} --command="SELECT username, role FROM users WHERE username='admin';"`;
    const adminResult = execSync(checkAdmin, { encoding: 'utf8' });
    
    if (adminResult.includes('admin')) {
      console.log('✅ Default admin user verified');
    } else {
      console.warn('⚠️ Default admin user not found');
    }
    
    console.log('✅ Database verification completed');
    return true;
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
    return false;
  }
}

function cleanupOldSchemas() {
  const oldSchemaFiles = [
    'src/schema.sql',
    'src/schema-unified.sql',
    'src/schema-advanced-features-migration.sql',
    'src/schema-monitoring-extensions.sql',
    'src/schema-security-tables.sql'
  ];
  
  console.log('🧹 Cleaning up old schema files...');
  
  for (const file of oldSchemaFiles) {
    if (checkFile(file)) {
      const backupName = `${BACKUP_DIR}/${path.basename(file)}-backup`;
      try {
        fs.copyFileSync(file, backupName);
        console.log(`📦 Backed up ${file} to ${backupName}`);
      } catch (error) {
        console.warn(`⚠️ Could not backup ${file}:`, error.message);
      }
    }
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting database consolidation...\n');
    
    // Step 1: Validate prerequisites
    if (!validateSchema()) {
      process.exit(1);
    }
    
    // Step 2: Create backup directory
    createBackupDir();
    
    // Step 3: Backup current database
    backupCurrentSchema();
    
    // Step 4: Apply consolidated schema
    if (!applyConsolidatedSchema()) {
      console.error('❌ Schema application failed');
      process.exit(1);
    }
    
    // Step 5: Seed initial data
    if (!seedInitialData()) {
      console.warn('⚠️ Initial data seeding failed, but continuing...');
    }
    
    // Step 6: Verify database
    if (!verifyDatabase()) {
      console.warn('⚠️ Database verification failed, but schema was applied');
    }
    
    // Step 7: Cleanup old schemas
    cleanupOldSchemas();
    
    console.log('\n🎉 Database consolidation completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Test your application with the new schema');
    console.log('2. Deploy your worker: wrangler deploy');
    console.log('3. Verify all functionality works correctly');
    console.log('4. Remove old schema files if everything works');
    
  } catch (error) {
    console.error('❌ Consolidation failed:', error.message);
    process.exit(1);
  }
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('❌ Unexpected error:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error.message);
  process.exit(1);
});

// Run the script
main().catch(console.error);
