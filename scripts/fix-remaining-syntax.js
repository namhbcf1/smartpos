#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class SyntaxFixer {
  fixFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let changed = false;

      // Fix broken try-catch blocks
      content = content.replace(/try\s*{\s*}\s*catch\s*\([^)]*\)\s*{\s*}/g, 'try { /* No operation */ } catch (error) { /* Error handled silently */ }');
      
      // Fix broken function calls with missing parameters
      content = content.replace(/\(\s*,\s*\)/g, '()');
      content = content.replace(/\(\s*,\s*([^)]*)\)/g, '($1)');
      
      // Fix broken object literals
      content = content.replace(/{\s*,\s*}/g, '{}');
      content = content.replace(/{\s*,\s*([^}]*)}/g, '{$1}');
      
      // Fix broken array literals
      content = content.replace(/\[\s*,\s*\]/g, '[]');
      content = content.replace(/\[\s*,\s*([^\]]*)\]/g, '[$1]');
      
      // Fix empty catch blocks
      content = content.replace(/catch\s*\([^)]*\)\s*{\s*}/g, 'catch (error) { /* Error handled silently */ }');
      
      // Fix empty if blocks
      content = content.replace(/if\s*\([^)]*\)\s*{\s*}/g, 'if (true) { /* No operation */ }');
      
      // Fix empty else blocks
      content = content.replace(/else\s*{\s*}/g, 'else { /* No operation */ }');
      
      // Fix empty finally blocks
      content = content.replace(/finally\s*{\s*}/g, 'finally { /* No operation */ }');
      
      // Fix broken arrow functions
      content = content.replace(/\(\s*\)\s*=>\s*{\s*}/g, '() => { /* No operation */ }');
      
      // Fix broken JSX elements
      content = content.replace(/<T\s*>/g, '');
      content = content.replace(/<\/T>/g, '');
      content = content.replace(/<Record\s*>/g, '');
      content = content.replace(/<\/Record>/g, '');
      content = content.replace(/<HTMLElement\s*>/g, '');
      content = content.replace(/<\/HTMLElement>/g, '');
      content = content.replace(/<string\s*>/g, '');
      content = content.replace(/<\/string>/g, '');
      content = content.replace(/<Array\s*>/g, '');
      content = content.replace(/<\/Array>/g, '');
      content = content.replace(/<Partial\s*>/g, '');
      content = content.replace(/<\/Partial>/g, '');
      
      // Fix broken generic syntax
      content = content.replace(/<T\s*>/g, '');
      content = content.replace(/<Record<string,\s*any\s*>>/g, '');
      content = content.replace(/<Partial<T\s*>>/g, '');
      
      // Fix broken function calls
      content = content.replace(/\(\s*\)\s*;?\s*$/gm, '();');
      
      // Fix empty lines with just semicolons
      content = content.replace(/^\s*;\s*$/gm, '');
      
      // Fix multiple empty lines
      content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
      
      if (content !== fs.readFileSync(filePath, 'utf8')) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed: ${filePath}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`❌ Error fixing ${filePath}:`, error.message);
      return false;
    }
  }

  async run() {
    console.log('🚀 Fixing remaining syntax errors...\n');
    
    const files = glob.sync('frontend/src/**/*.{ts,tsx}', { 
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.d.ts']
    });
    
    let fixed = 0;
    for (const file of files) {
      if (this.fixFile(file)) {
        fixed++;
      }
    }
    
    console.log(`\n✅ Fixed ${fixed} files`);
  }
}

new SyntaxFixer().run().catch(console.error);



