/**
 * Regenerate geo-data-generated.ts with properly escaped apostrophes
 */

const fs = require('fs');

const districts = require('./districts-generated.json');
const wards = require('./wards-generated.json');

console.log(`Regenerating TypeScript code for ${districts.length} districts and ${wards.length} wards...`);

// Helper to escape single quotes in names
function escapeName(name) {
  return name.replace(/'/g, "\\'");
}

let tsCode = '';

// Generate DISTRICTS
tsCode += '// Dữ liệu quận/huyện (đầy đủ cho 34 tỉnh thành mới)\n';
tsCode += 'const DISTRICTS = [\n';
districts.forEach((district, index) => {
  const comma = index < districts.length - 1 ? ',' : '';
  const safeName = escapeName(district.name);
  tsCode += `  { id: '${district.id}', name: '${safeName}', province_id: '${district.province_id}', type: '${district.type}' }${comma}\n`;
});
tsCode += '];\n\n';

// Generate WARDS
tsCode += '// Dữ liệu phường/xã (đầy đủ cho tất cả quận/huyện)\n';
tsCode += 'const WARDS = [\n';
wards.forEach((ward, index) => {
  const comma = index < wards.length - 1 ? ',' : '';
  const safeName = escapeName(ward.name);
  tsCode += `  { id: '${ward.id}', name: '${safeName}', district_id: '${ward.district_id}', type: '${ward.type}' }${comma}\n`;
});
tsCode += '];\n';

// Write to file
fs.writeFileSync('geo-data-generated-fixed.ts', tsCode, 'utf8');

console.log('✅ Generated geo-data-generated-fixed.ts');
console.log(`   Total lines: ${tsCode.split('\n').length}`);

// Count escaped apostrophes
const escapedCount = (tsCode.match(/\\'/g) || []).length;
console.log(`   Escaped ${escapedCount} apostrophes`);

// Show some examples
const examplesWithApostrophes = districts
  .filter(d => d.name.includes("'"))
  .slice(0, 5);

if (examplesWithApostrophes.length > 0) {
  console.log('\n📝 Examples with apostrophes:');
  examplesWithApostrophes.forEach(d => {
    console.log(`   - ${d.name} -> ${escapeName(d.name)}`);
  });
}
