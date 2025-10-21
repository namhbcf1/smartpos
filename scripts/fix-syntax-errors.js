#!/usr/bin/env node

/**
 * Fix Syntax Errors from Console.log Removal
 * Fixes broken syntax caused by removing console.log statements
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const CONFIG = {
  directories: [
    'frontend/src',
    'src'
  ],
  
  patterns: [
    '**/*.ts',
    '**/*.tsx',
    '**/*.js',
    '**/*.jsx'
  ]
};

class SyntaxErrorFixer {
  constructor() {
    this.stats = {
      filesProcessed: 0,
      filesFixed: 0,
      errors: []
    };
  }

  /**
   * Fix common syntax errors
   */
  fixSyntaxErrors(content) {
    let fixed = content;
    let hasChanges = false;

    // Fix empty catch blocks
    fixed = fixed.replace(/catch\s*\(\s*[^)]*\s*\)\s*{\s*}/g, 'catch (error) { /* Error handled silently */ }');
    
    // Fix empty try blocks
    fixed = fixed.replace(/try\s*{\s*}\s*catch/g, 'try { /* No operation */ } catch');
    
    // Fix empty if blocks
    fixed = fixed.replace(/if\s*\([^)]*\)\s*{\s*}/g, (match) => {
      const condition = match.match(/if\s*\(([^)]*)\)/)[1];
      return `if (${condition}) { /* No operation */ }`;
    });
    
    // Fix empty else blocks
    fixed = fixed.replace(/else\s*{\s*}/g, 'else { /* No operation */ }');
    
    // Fix empty finally blocks
    fixed = fixed.replace(/finally\s*{\s*}/g, 'finally { /* No operation */ }');
    
    // Fix empty arrow functions
    fixed = fixed.replace(/\(\s*\)\s*=>\s*{\s*}/g, '() => { /* No operation */ }');
    
    // Fix empty function bodies
    fixed = fixed.replace(/{\s*}\s*;?\s*$/gm, '{ /* No operation */ }');
    
    // Fix empty object literals that should be comments
    fixed = fixed.replace(/{\s*}\s*;?\s*$/gm, '{ /* No operation */ }');
    
    // Fix broken JSX elements
    fixed = fixed.replace(/<T\s*>/g, '');
    fixed = fixed.replace(/<\/T>/g, '');
    fixed = fixed.replace(/<Record\s*>/g, '');
    fixed = fixed.replace(/<\/Record>/g, '');
    fixed = fixed.replace(/<HTMLElement\s*>/g, '');
    fixed = fixed.replace(/<\/HTMLElement>/g, '');
    fixed = fixed.replace(/<string\s*>/g, '');
    fixed = fixed.replace(/<\/string>/g, '');
    fixed = fixed.replace(/<Array\s*>/g, '');
    fixed = fixed.replace(/<\/Array>/g, '');
    fixed = fixed.replace(/<Partial\s*>/g, '');
    fixed = fixed.replace(/<\/Partial>/g, '');
    
    // Fix broken generic syntax
    fixed = fixed.replace(/<T\s*>/g, '');
    fixed = fixed.replace(/<Record<string,\s*any\s*>>/g, '');
    fixed = fixed.replace(/<Partial<T\s*>>/g, '');
    
    // Fix broken function calls
    fixed = fixed.replace(/\(\s*\)\s*;?\s*$/gm, '();');
    
    // Fix empty lines with just semicolons
    fixed = fixed.replace(/^\s*;\s*$/gm, '');
    
    // Fix multiple empty lines
    fixed = fixed.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    if (fixed !== content) {
      hasChanges = true;
    }

    return { content: fixed, hasChanges };
  }

  /**
   * Process a single file
   */
  processFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const result = this.fixSyntaxErrors(content);
      
      if (result.hasChanges) {
        fs.writeFileSync(filePath, result.content, 'utf8');
        this.stats.filesFixed++;
        console.log(`✅ ${filePath}: Fixed syntax errors`);
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
    console.log('🚀 Starting syntax error fix process...\n');
    
    const files = this.findFiles();
    console.log(`📁 Found ${files.length} files to process\n`);

    for (const file of files) {
      this.processFile(file);
    }

    // Print summary
    console.log('\n📊 SUMMARY:');
    console.log(`   Files processed: ${this.stats.filesProcessed}`);
    console.log(`   Files fixed: ${this.stats.filesFixed}`);
    
    if (this.stats.errors.length > 0) {
      console.log(`   Errors: ${this.stats.errors.length}`);
      this.stats.errors.forEach(err => {
        console.log(`     - ${err.file}: ${err.error}`);
      });
    }

    console.log('\n✅ Syntax error fix completed!');
  }
}

// Run if called directly
if (require.main === module) {
  const fixer = new SyntaxErrorFixer();
  fixer.run().catch(console.error);
}

module.exports = SyntaxErrorFixer;
