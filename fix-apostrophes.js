/**
 * Fix apostrophes in district and ward names that break TypeScript strings
 */

const fs = require('fs');

const content = fs.readFileSync('src/routes/shipping/geo.ts', 'utf8');

// Replace single quotes inside names with escaped quotes
// Pattern: name: 'text with ' in middle'
const fixed = content.replace(
  /name: '([^']*)'([^']*)'([^']*)'/g,
  (match, p1, p2, p3) => {
    // Escape the apostrophe
    return `name: '${p1}\\'${p2}\\'${p3}'`;
  }
);

fs.writeFileSync('src/routes/shipping/geo.ts', fixed, 'utf8');

console.log('✅ Fixed apostrophes in geo.ts');

// Count how many fixes
const fixes = (fixed.match(/\\'/g) || []).length;
console.log(`   Escaped ${fixes} apostrophes`);
