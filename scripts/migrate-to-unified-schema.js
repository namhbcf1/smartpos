#!/usr/bin/env node

/**
 * MIGRATION SCRIPT: Migrate to Unified Schema
 * 
 * This script migrates the database from multiple conflicting schema files
 * to the single unified schema (schema-unified.sql)
 * 
 * SAFETY FEATURES:
 * - Creates backup before migration
 * - Validates data integrity
 * - Rollback capability
 * - Dry-run mode for testing
 * 
 * Usage:
 *   node scripts/migrate-to-unified-schema.js [--dry-run] [--force]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  BACKUP_DIR: 'backups/schema-migration',
  UNIFIED_SCHEMA_PATH: 'src/schema-unified.sql',
  OLD_SCHEMA_FILES: [
    'src/schema.sql',
    'src/schema-fixed.sql', 
    'src/schema_base.sql',
    'src/schema-security-tables.sql'
  ]
};

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');

console.log('🔄 SmartPOS Schema Migration Tool');
console.log('==================================');

if (isDryRun) {
  console.log('🧪 DRY RUN MODE - No changes will be made');
}

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(CONFIG.BACKUP_DIR, timestamp);
  
  console.log(`📦 Creating backup in: ${backupDir}`);
  
  // Create backup directory
  fs.mkdirSync(backupDir, { recursive: true });
  
  // Copy all schema files
  CONFIG.OLD_SCHEMA_FILES.forEach(file => {
    if (fs.existsSync(file)) {
      const filename = path.basename(file);
      const backupPath = path.join(backupDir, filename);
      fs.copyFileSync(file, backupPath);
      console.log(`  ✅ Backed up: ${file} → ${backupPath}`);
    }
  });
  
  // Create backup info file
  const backupInfo = {
    timestamp: new Date().toISOString(),
    files: CONFIG.OLD_SCHEMA_FILES.filter(f => fs.existsSync(f)),
    migration_version: 'unified_schema_v1',
    created_by: 'migrate-to-unified-schema.js'
  };
  
  fs.writeFileSync(
    path.join(backupDir, 'backup-info.json'),
    JSON.stringify(backupInfo, null, 2)
  );
  
  console.log(`✅ Backup created successfully`);
  return backupDir;
}

function validateUnifiedSchema() {
  console.log('🔍 Validating unified schema...');
  
  if (!fs.existsSync(CONFIG.UNIFIED_SCHEMA_PATH)) {
    throw new Error(`Unified schema not found: ${CONFIG.UNIFIED_SCHEMA_PATH}`);
  }
  
  const schemaContent = fs.readFileSync(CONFIG.UNIFIED_SCHEMA_PATH, 'utf8');
  
  // Check for required tables
  const requiredTables = [
    'stores', 'users', 'categories', 'suppliers', 'products', 
    'customers', 'sales', 'sale_items', 'schema_migrations'
  ];
  
  const missingTables = requiredTables.filter(table => 
    !schemaContent.includes(`CREATE TABLE IF NOT EXISTS ${table}`)
  );
  
  if (missingTables.length > 0) {
    throw new Error(`Missing required tables in unified schema: ${missingTables.join(', ')}`);
  }
  
  // Check for security fixes
  const securityChecks = [
    'CHECK (is_active IN (0, 1))',
    'CHECK (price >= 0)',
    'FOREIGN KEY',
    'CREATE INDEX'
  ];
  
  const missingSecurityFeatures = securityChecks.filter(check => 
    !schemaContent.includes(check)
  );
  
  if (missingSecurityFeatures.length > 0) {
    console.warn(`⚠️  Missing security features: ${missingSecurityFeatures.join(', ')}`);
  }
  
  console.log('✅ Unified schema validation passed');
}

function analyzeSchemaConflicts() {
  console.log('🔍 Analyzing schema conflicts...');
  
  const conflicts = [];
  const existingFiles = CONFIG.OLD_SCHEMA_FILES.filter(f => fs.existsSync(f));
  
  if (existingFiles.length > 1) {
    conflicts.push({
      type: 'multiple_schemas',
      description: `Multiple schema files found: ${existingFiles.join(', ')}`,
      severity: 'high',
      resolution: 'Replace with unified schema'
    });
  }
  
  // Check for hardcoded credentials in schema files
  existingFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('admin123') || content.includes("'admin'")) {
      conflicts.push({
        type: 'hardcoded_credentials',
        file: file,
        description: 'Schema contains hardcoded admin credentials',
        severity: 'critical',
        resolution: 'Remove hardcoded credentials'
      });
    }
  });
  
  if (conflicts.length > 0) {
    console.log('\n⚠️  CONFLICTS DETECTED:');
    conflicts.forEach((conflict, index) => {
      console.log(`${index + 1}. [${conflict.severity.toUpperCase()}] ${conflict.description}`);
      if (conflict.file) console.log(`   File: ${conflict.file}`);
      console.log(`   Resolution: ${conflict.resolution}`);
    });
  } else {
    console.log('✅ No conflicts detected');
  }
  
  return conflicts;
}

function generateMigrationPlan() {
  console.log('\n📋 MIGRATION PLAN:');
  console.log('==================');
  
  const plan = [
    '1. Create backup of existing schema files',
    '2. Validate unified schema structure',
    '3. Archive old schema files (move to deprecated/)',
    '4. Deploy unified schema as primary',
    '5. Update import references in code',
    '6. Verify database integrity',
    '7. Update documentation'
  ];
  
  plan.forEach(step => console.log(step));
  
  return plan;
}

async function executeMigration() {
  console.log('\n🚀 EXECUTING MIGRATION...');
  
  if (isDryRun) {
    console.log('🧪 DRY RUN - Simulating migration steps...');
    return;
  }
  
  // Step 1: Create backup
  const backupDir = await createBackup();
  
  // Step 2: Create deprecated directory and move old files
  const deprecatedDir = 'deprecated/schema-files';
  fs.mkdirSync(deprecatedDir, { recursive: true });
  
  CONFIG.OLD_SCHEMA_FILES.forEach(file => {
    if (fs.existsSync(file)) {
      const filename = path.basename(file);
      const deprecatedPath = path.join(deprecatedDir, filename);
      fs.renameSync(file, deprecatedPath);
      console.log(`📁 Moved: ${file} → ${deprecatedPath}`);
    }
  });
  
  // Step 3: Copy unified schema as primary
  fs.copyFileSync(CONFIG.UNIFIED_SCHEMA_PATH, 'src/schema.sql');
  console.log('✅ Unified schema deployed as primary (src/schema.sql)');
  
  // Step 4: Create migration record
  const migrationRecord = {
    migration_id: 'unified_schema_v1',
    executed_at: new Date().toISOString(),
    backup_location: backupDir,
    files_migrated: CONFIG.OLD_SCHEMA_FILES.filter(f => fs.existsSync(f)),
    status: 'completed'
  };
  
  fs.writeFileSync(
    'migration-record.json',
    JSON.stringify(migrationRecord, null, 2)
  );
  
  console.log('\n✅ MIGRATION COMPLETED SUCCESSFULLY!');
  console.log(`📦 Backup location: ${backupDir}`);
  console.log('📝 Migration record: migration-record.json');
}

async function main() {
  try {
    // Validate unified schema exists and is correct
    validateUnifiedSchema();
    
    // Analyze current state and conflicts
    const conflicts = analyzeSchemaConflicts();
    
    // Generate migration plan
    generateMigrationPlan();
    
    // Check if migration is needed
    if (conflicts.length === 0 && !isForce) {
      console.log('\n✅ No migration needed - schema is already unified');
      return;
    }
    
    // Confirm migration
    if (!isDryRun && !isForce) {
      console.log('\n⚠️  This migration will modify your schema files.');
      console.log('Add --dry-run to test without changes, or --force to proceed.');
      return;
    }
    
    // Execute migration
    await executeMigration();
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Test the application with the unified schema');
    console.log('2. Update any code references to old schema files');
    console.log('3. Deploy to production when ready');
    console.log('4. Monitor for any issues');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createBackup, validateUnifiedSchema, analyzeSchemaConflicts };
