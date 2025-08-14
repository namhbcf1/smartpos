#!/usr/bin/env node

/**
 * CONSOLE.LOG REPLACEMENT SCRIPT
 * 
 * This script finds and replaces console.log statements with proper logging
 * using the production-safe logger utility.
 * 
 * FEATURES:
 * - Finds all console.log, console.warn, console.error statements
 * - Replaces with appropriate logger calls
 * - Preserves legitimate error logging
 * - Creates backup before modification
 * - Supports dry-run mode
 * 
 * Usage:
 *   node scripts/replace-console-logs.js [--dry-run] [--backup]
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const CONFIG = {
  SOURCE_DIRS: ['src/**/*.ts', 'src/**/*.js'],
  EXCLUDE_PATTERNS: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/*.test.*',
    '**/*.spec.*',
    '**/logger.ts', // Don't modify the logger itself
    '**/errors.ts'  // Keep error logging as is
  ],
  BACKUP_DIR: 'backups/console-log-replacement'
};

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const createBackup = args.includes('--backup') || !isDryRun;

console.log('🧹 Console.log Replacement Tool');
console.log('================================');

if (isDryRun) {
  console.log('🧪 DRY RUN MODE - No files will be modified');
}

/**
 * Find all source files to process
 */
function findSourceFiles() {
  const files = [];
  
  CONFIG.SOURCE_DIRS.forEach(pattern => {
    const matches = glob.sync(pattern, {
      ignore: CONFIG.EXCLUDE_PATTERNS
    });
    files.push(...matches);
  });
  
  return [...new Set(files)]; // Remove duplicates
}

/**
 * Analyze console statements in a file
 */
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const consoleStatements = [];
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Skip comments
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine.startsWith('/*')) {
      return;
    }
    
    // Find console statements
    const consoleRegex = /console\.(log|info|warn|error|debug)\s*\(/g;
    let match;
    
    while ((match = consoleRegex.exec(line)) !== null) {
      consoleStatements.push({
        lineNumber: index + 1,
        line: line,
        method: match[1],
        position: match.index
      });
    }
  });
  
  return consoleStatements;
}

/**
 * Replace console statements with logger calls
 */
function replaceConsoleStatements(content) {
  let modified = content;
  let hasChanges = false;
  
  // Add logger import if not present
  if (!modified.includes("import { log") && !modified.includes("import { logger")) {
    const importStatement = "import { log } from '../utils/logger';\n";
    
    // Find the best place to add the import
    const lines = modified.split('\n');
    let insertIndex = 0;
    
    // Find last import statement
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        insertIndex = i + 1;
      } else if (lines[i].trim() === '' && insertIndex > 0) {
        break;
      }
    }
    
    lines.splice(insertIndex, 0, importStatement);
    modified = lines.join('\n');
    hasChanges = true;
  }
  
  // Replace console statements
  const replacements = [
    {
      pattern: /console\.log\s*\(/g,
      replacement: 'log.info('
    },
    {
      pattern: /console\.info\s*\(/g,
      replacement: 'log.info('
    },
    {
      pattern: /console\.debug\s*\(/g,
      replacement: 'log.debug('
    },
    {
      pattern: /console\.warn\s*\(/g,
      replacement: 'log.warn('
    }
  ];
  
  replacements.forEach(({ pattern, replacement }) => {
    const originalModified = modified;
    modified = modified.replace(pattern, replacement);
    if (modified !== originalModified) {
      hasChanges = true;
    }
  });
  
  // Handle console.error more carefully (preserve legitimate error logging)
  const errorPattern = /console\.error\s*\(/g;
  let errorMatch;
  const errorReplacements = [];
  
  while ((errorMatch = errorPattern.exec(content)) !== null) {
    const beforeError = content.substring(0, errorMatch.index);
    const afterError = content.substring(errorMatch.index);
    
    // Check if this is in a catch block or error handler
    const isInCatchBlock = beforeError.includes('catch') && 
                          beforeError.lastIndexOf('catch') > beforeError.lastIndexOf('}');
    
    if (isInCatchBlock) {
      // Keep as console.error for legitimate error handling
      continue;
    } else {
      // Replace with logger
      errorReplacements.push({
        index: errorMatch.index,
        length: 'console.error'.length,
        replacement: 'log.error'
      });
    }
  }
  
  // Apply error replacements in reverse order to maintain indices
  errorReplacements.reverse().forEach(replacement => {
    modified = modified.substring(0, replacement.index) + 
               replacement.replacement + 
               modified.substring(replacement.index + replacement.length);
    hasChanges = true;
  });
  
  return { content: modified, hasChanges };
}

/**
 * Create backup of files
 */
function createBackupFiles(files) {
  if (!createBackup) return null;
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(CONFIG.BACKUP_DIR, timestamp);
  
  console.log(`📦 Creating backup in: ${backupDir}`);
  fs.mkdirSync(backupDir, { recursive: true });
  
  files.forEach(file => {
    const backupPath = path.join(backupDir, file);
    const backupDirPath = path.dirname(backupPath);
    
    fs.mkdirSync(backupDirPath, { recursive: true });
    fs.copyFileSync(file, backupPath);
  });
  
  // Create backup info
  const backupInfo = {
    timestamp: new Date().toISOString(),
    files: files,
    purpose: 'Console.log replacement backup',
    script: 'replace-console-logs.js'
  };
  
  fs.writeFileSync(
    path.join(backupDir, 'backup-info.json'),
    JSON.stringify(backupInfo, null, 2)
  );
  
  console.log(`✅ Backup created with ${files.length} files`);
  return backupDir;
}

/**
 * Process all files
 */
function processFiles() {
  const files = findSourceFiles();
  console.log(`📁 Found ${files.length} source files to analyze`);
  
  const results = {
    analyzed: 0,
    modified: 0,
    consoleStatements: 0,
    errors: []
  };
  
  // Analyze all files first
  const filesToModify = [];
  
  files.forEach(file => {
    try {
      const statements = analyzeFile(file);
      results.analyzed++;
      results.consoleStatements += statements.length;
      
      if (statements.length > 0) {
        filesToModify.push({
          path: file,
          statements: statements
        });
        
        console.log(`📄 ${file}: ${statements.length} console statements found`);
        
        if (isDryRun) {
          statements.forEach(stmt => {
            console.log(`  Line ${stmt.lineNumber}: console.${stmt.method}(...)`);
          });
        }
      }
    } catch (error) {
      results.errors.push({ file, error: error.message });
      console.error(`❌ Error analyzing ${file}:`, error.message);
    }
  });
  
  if (filesToModify.length === 0) {
    console.log('✅ No console statements found that need replacement');
    return results;
  }
  
  console.log(`\n🔄 ${filesToModify.length} files need modification`);
  
  if (isDryRun) {
    console.log('\n🧪 DRY RUN - Would modify these files:');
    filesToModify.forEach(({ path, statements }) => {
      console.log(`  ${path} (${statements.length} statements)`);
    });
    return results;
  }
  
  // Create backup
  const backupDir = createBackupFiles(filesToModify.map(f => f.path));
  
  // Process files
  filesToModify.forEach(({ path: filePath, statements }) => {
    try {
      const originalContent = fs.readFileSync(filePath, 'utf8');
      const { content: newContent, hasChanges } = replaceConsoleStatements(originalContent);
      
      if (hasChanges) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        results.modified++;
        console.log(`✅ Modified: ${filePath}`);
      }
    } catch (error) {
      results.errors.push({ file: filePath, error: error.message });
      console.error(`❌ Error modifying ${filePath}:`, error.message);
    }
  });
  
  return results;
}

/**
 * Generate summary report
 */
function generateReport(results) {
  console.log('\n📋 CONSOLE.LOG REPLACEMENT SUMMARY');
  console.log('==================================');
  console.log(`Files analyzed: ${results.analyzed}`);
  console.log(`Console statements found: ${results.consoleStatements}`);
  console.log(`Files modified: ${results.modified}`);
  console.log(`Errors: ${results.errors.length}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    results.errors.forEach(({ file, error }) => {
      console.log(`  ${file}: ${error}`);
    });
  }
  
  if (!isDryRun && results.modified > 0) {
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Test the application to ensure logging works correctly');
    console.log('2. Check that no functionality is broken');
    console.log('3. Commit the changes if everything works');
    console.log('4. Monitor logs in production');
  }
  
  if (isDryRun) {
    console.log('\n💡 To apply changes, run without --dry-run flag');
  }
}

/**
 * Main execution
 */
function main() {
  try {
    const results = processFiles();
    generateReport(results);
    
    if (results.errors.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
