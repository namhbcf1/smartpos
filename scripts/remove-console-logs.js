#!/usr/bin/env node

/**
 * Remove Console.log Statements from Production Build
 * Removes all console.log, console.warn, console.error statements
 * while preserving console.error for critical errors
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const CONFIG = {
  // Directories to process
  directories: [
    'frontend/src',
    'src'
  ],
  
  // File patterns to include
  patterns: [
    '**/*.ts',
    '**/*.tsx',
    '**/*.js',
    '**/*.jsx'
  ],
  
  // Console methods to remove (keep console.error for critical errors)
  removeMethods: [
    'console.log',
    'console.warn',
    'console.info',
    'console.debug',
    'console.trace'
  ],
  
  // Keep these console statements (for critical errors)
  keepPatterns: [
    /console\.error\(['"`]CRITICAL/,
    /console\.error\(['"`]FATAL/,
    /console\.error\(['"`]SECURITY/
  ]
};

class ConsoleLogRemover {
  constructor() {
    this.stats = {
      filesProcessed: 0,
      consoleLogsRemoved: 0,
      filesModified: 0,
      errors: []
    };
  }

  /**
   * Check if console statement should be kept
   */
  shouldKeepConsoleStatement(line) {
    return CONFIG.keepPatterns.some(pattern => pattern.test(line));
  }

  /**
   * Remove console statements from file content
   */
  removeConsoleStatements(content) {
    const lines = content.split('\n');
    const processedLines = [];
    let removedCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let shouldRemove = false;

      // Check if line contains console statements to remove
      for (const method of CONFIG.removeMethods) {
        if (line.includes(method)) {
          // Check if this console statement should be kept
          if (!this.shouldKeepConsoleStatement(line)) {
            shouldRemove = true;
            removedCount++;
            break;
          }
        }
      }

      if (!shouldRemove) {
        processedLines.push(line);
      }
    }

    return {
      content: processedLines.join('\n'),
      removedCount
    };
  }

  /**
   * Process a single file
   */
  processFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const result = this.removeConsoleStatements(content);
      
      if (result.removedCount > 0) {
        fs.writeFileSync(filePath, result.content, 'utf8');
        this.stats.filesModified++;
        this.stats.consoleLogsRemoved += result.removedCount;
        console.log(`✅ ${filePath}: Removed ${result.removedCount} console statements`);
      }
      
      this.stats.filesProcessed++;
    } catch (error) {
      this.stats.errors.push({ file: filePath, error: error.message });
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }

  /**
   * Find all files matching patterns
   */
  findFiles() {
    const files = [];
    
    for (const dir of CONFIG.directories) {
      if (!fs.existsSync(dir)) {
        console.warn(`⚠️  Directory ${dir} does not exist, skipping...`);
        continue;
      }

      for (const pattern of CONFIG.patterns) {
        const globPattern = path.join(dir, pattern);
        const matches = glob.sync(globPattern, { 
          ignore: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/*.d.ts'
          ]
        });
        files.push(...matches);
      }
    }

    return [...new Set(files)]; // Remove duplicates
  }

  /**
   * Main execution
   */
  async run() {
    console.log('🚀 Starting console.log removal process...\n');
    
    const files = this.findFiles();
    console.log(`📁 Found ${files.length} files to process\n`);

    for (const file of files) {
      this.processFile(file);
    }

    // Print summary
    console.log('\n📊 SUMMARY:');
    console.log(`   Files processed: ${this.stats.filesProcessed}`);
    console.log(`   Files modified: ${this.stats.filesModified}`);
    console.log(`   Console statements removed: ${this.stats.consoleLogsRemoved}`);
    
    if (this.stats.errors.length > 0) {
      console.log(`   Errors: ${this.stats.errors.length}`);
      this.stats.errors.forEach(err => {
        console.log(`     - ${err.file}: ${err.error}`);
      });
    }

    console.log('\n✅ Console.log removal completed!');
  }
}

// Run if called directly
if (require.main === module) {
  const remover = new ConsoleLogRemover();
  remover.run().catch(console.error);
}

module.exports = ConsoleLogRemover;
