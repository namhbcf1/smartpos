#!/usr/bin/env node

/**
 * Authentication Middleware Cleanup Script for SmartPOS
 * 
 * This script cleans up duplicate authentication middleware files
 * and standardizes the authentication system.
 */

const fs = require('fs');
const path = require('path');

console.log('🔐 SmartPOS Authentication Middleware Cleanup');
console.log('=============================================\n');

// Configuration
const BACKUP_DIR = 'backups/auth-middleware';
const MIDDLEWARE_DIR = 'src/middleware';

// Files to backup and potentially remove
const DUPLICATE_AUTH_FILES = [
  'src/middleware/auth-standardized.ts',
  'src/middleware/security-enhanced.ts',
  'src/middleware/security-production.ts'
];

// Main auth file to keep
const MAIN_AUTH_FILE = 'src/middleware/auth.ts';

// Utility functions
function createBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📁 Created backup directory: ${BACKUP_DIR}`);
  }
}

function backupFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ File not found: ${filePath}`);
    return false;
  }
  
  const fileName = path.basename(filePath);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `${fileName}-${timestamp}`);
  
  try {
    fs.copyFileSync(filePath, backupPath);
    console.log(`✅ Backed up: ${filePath} → ${backupPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to backup ${filePath}:`, error.message);
    return false;
  }
}

function analyzeAuthFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  return {
    path: filePath,
    lines: content.split('\n').length,
    hasJWTValidation: content.includes('verify') && content.includes('JWT'),
    hasRoleCheck: content.includes('role') || content.includes('Role'),
    hasErrorHandling: content.includes('try') && content.includes('catch'),
    hasSecurityLogging: content.includes('console.log') || content.includes('console.error'),
    hasTokenCleanup: content.includes('Set-Cookie') && content.includes('Max-Age=0'),
    exports: extractExports(content)
  };
}

function extractExports(content) {
  const exports = [];
  const exportRegex = /export\s+(const|function|class)\s+(\w+)/g;
  let match;
  
  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[2]);
  }
  
  return exports;
}

function generateReport() {
  console.log('📊 Authentication Middleware Analysis Report');
  console.log('===========================================\n');
  
  const allAuthFiles = [
    MAIN_AUTH_FILE,
    ...DUPLICATE_AUTH_FILES
  ];
  
  const analyses = allAuthFiles.map(analyzeAuthFile).filter(Boolean);
  
  console.log('📋 File Analysis:');
  analyses.forEach(analysis => {
    console.log(`\n📄 ${analysis.path}`);
    console.log(`   Lines: ${analysis.lines}`);
    console.log(`   JWT Validation: ${analysis.hasJWTValidation ? '✅' : '❌'}`);
    console.log(`   Role Check: ${analysis.hasRoleCheck ? '✅' : '❌'}`);
    console.log(`   Error Handling: ${analysis.hasErrorHandling ? '✅' : '❌'}`);
    console.log(`   Security Logging: ${analysis.hasSecurityLogging ? '✅' : '❌'}`);
    console.log(`   Token Cleanup: ${analysis.hasTokenCleanup ? '✅' : '❌'}`);
    console.log(`   Exports: ${analysis.exports.join(', ')}`);
  });
  
  console.log('\n🎯 Recommendations:');
  console.log(`✅ Keep: ${MAIN_AUTH_FILE} (main authentication middleware)`);
  
  DUPLICATE_AUTH_FILES.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`🗑️ Remove: ${file} (duplicate functionality)`);
    }
  });
}

function updateImports() {
  console.log('\n🔄 Updating import statements...');
  
  // Files that might import the old auth middleware
  const filesToUpdate = [
    'src/index.ts',
    'src/routes/auth.ts',
    'src/routes/auth/handlers.ts'
  ];
  
  filesToUpdate.forEach(file => {
    if (!fs.existsSync(file)) {
      return;
    }
    
    try {
      let content = fs.readFileSync(file, 'utf8');
      let updated = false;
      
      // Replace imports from duplicate files
      const oldImports = [
        "from './middleware/auth-standardized'",
        "from './middleware/security-enhanced'",
        "from './middleware/security-production'",
        "from '../middleware/auth-standardized'",
        "from '../middleware/security-enhanced'",
        "from '../middleware/security-production'"
      ];
      
      oldImports.forEach(oldImport => {
        if (content.includes(oldImport)) {
          content = content.replace(oldImport, "from './middleware/auth'");
          updated = true;
        }
      });
      
      // Replace function names if needed
      if (content.includes('standardAuthenticate')) {
        content = content.replace(/standardAuthenticate/g, 'authenticate');
        updated = true;
      }
      
      if (content.includes('enhancedAuthenticate')) {
        content = content.replace(/enhancedAuthenticate/g, 'authenticate');
        updated = true;
      }
      
      if (updated) {
        fs.writeFileSync(file, content);
        console.log(`✅ Updated imports in: ${file}`);
      }
    } catch (error) {
      console.warn(`⚠️ Could not update ${file}:`, error.message);
    }
  });
}

function cleanupDuplicates() {
  console.log('\n🧹 Cleaning up duplicate files...');
  
  DUPLICATE_AUTH_FILES.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        // Move to backup instead of deleting
        const fileName = path.basename(file);
        const backupPath = path.join(BACKUP_DIR, `${fileName}-removed`);
        fs.renameSync(file, backupPath);
        console.log(`🗑️ Moved to backup: ${file} → ${backupPath}`);
      } catch (error) {
        console.warn(`⚠️ Could not remove ${file}:`, error.message);
      }
    }
  });
}

function verifyMainAuth() {
  console.log('\n🔍 Verifying main authentication middleware...');
  
  if (!fs.existsSync(MAIN_AUTH_FILE)) {
    console.error(`❌ Main auth file not found: ${MAIN_AUTH_FILE}`);
    return false;
  }
  
  const analysis = analyzeAuthFile(MAIN_AUTH_FILE);
  
  const requiredFeatures = [
    { name: 'JWT Validation', check: analysis.hasJWTValidation },
    { name: 'Error Handling', check: analysis.hasErrorHandling },
    { name: 'Security Logging', check: analysis.hasSecurityLogging }
  ];
  
  let allGood = true;
  requiredFeatures.forEach(feature => {
    if (feature.check) {
      console.log(`✅ ${feature.name}: Present`);
    } else {
      console.log(`❌ ${feature.name}: Missing`);
      allGood = false;
    }
  });
  
  if (allGood) {
    console.log('✅ Main authentication middleware is complete');
  } else {
    console.warn('⚠️ Main authentication middleware may need updates');
  }
  
  return allGood;
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting authentication middleware cleanup...\n');
    
    // Step 1: Create backup directory
    createBackupDir();
    
    // Step 2: Backup all auth files
    console.log('💾 Backing up authentication files...');
    [MAIN_AUTH_FILE, ...DUPLICATE_AUTH_FILES].forEach(backupFile);
    
    // Step 3: Generate analysis report
    generateReport();
    
    // Step 4: Update import statements
    updateImports();
    
    // Step 5: Verify main auth file
    if (!verifyMainAuth()) {
      console.warn('⚠️ Please review the main auth file before proceeding');
    }
    
    // Step 6: Clean up duplicates (optional)
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('\n❓ Remove duplicate auth files? (y/N): ', (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        cleanupDuplicates();
        console.log('\n🎉 Authentication middleware cleanup completed!');
      } else {
        console.log('\n📋 Cleanup skipped. Duplicate files preserved.');
      }
      
      console.log('\n📋 Next steps:');
      console.log('1. Test authentication functionality');
      console.log('2. Deploy and verify all endpoints work');
      console.log('3. Remove backup files if everything works correctly');
      
      readline.close();
    });
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('❌ Unexpected error:', error.message);
  process.exit(1);
});

// Run the script
main().catch(console.error);
