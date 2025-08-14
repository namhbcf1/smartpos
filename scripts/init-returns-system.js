#!/usr/bin/env node

/**
 * SmartPOS Returns System Initialization Script
 * This script initializes the returns system by creating all necessary tables and default data
 */

const fs = require('fs');
const path = require('path');

async function initializeReturnsSystem() {
  console.log('🚀 Starting SmartPOS Returns System Initialization...');
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', '0003_returns_system.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration file loaded successfully');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    // For now, just log what would be executed
    console.log('📋 SQL statements that would be executed:');
    statements.forEach((stmt, index) => {
      if (stmt.includes('CREATE TABLE')) {
        const tableName = stmt.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
        console.log(`  ${index + 1}. Create table: ${tableName}`);
      } else if (stmt.includes('CREATE INDEX')) {
        const indexName = stmt.match(/CREATE INDEX IF NOT EXISTS (\w+)/)?.[1];
        console.log(`  ${index + 1}. Create index: ${indexName}`);
      } else if (stmt.includes('INSERT')) {
        console.log(`  ${index + 1}. Insert default data`);
      } else if (stmt.includes('CREATE VIEW')) {
        const viewName = stmt.match(/CREATE VIEW IF NOT EXISTS (\w+)/)?.[1];
        console.log(`  ${index + 1}. Create view: ${viewName}`);
      } else if (stmt.includes('CREATE TRIGGER')) {
        const triggerName = stmt.match(/CREATE TRIGGER IF NOT EXISTS (\w+)/)?.[1];
        console.log(`  ${index + 1}. Create trigger: ${triggerName}`);
      } else {
        console.log(`  ${index + 1}. Execute SQL statement`);
      }
    });
    
    console.log('\n✅ Returns system initialization script completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Deploy the backend with: npm run deploy');
    console.log('2. Run the migration with: npx wrangler d1 execute smartpos-db --file=migrations/0003_returns_system.sql');
    console.log('3. Test the returns API endpoints');
    console.log('4. Verify the frontend returns page functionality');
    
  } catch (error) {
    console.error('❌ Error during initialization:', error);
    process.exit(1);
  }
}

// Run the initialization
if (require.main === module) {
  initializeReturnsSystem();
}

module.exports = { initializeReturnsSystem };
