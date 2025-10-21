/**
 * Script để update file geo.ts với dữ liệu DISTRICTS và WARDS mới
 * Giữ nguyên PROVINCES và routes logic
 */

const fs = require('fs');

// Read original geo.ts
const geoFileContent = fs.readFileSync('src/routes/shipping/geo.ts', 'utf8');

// Read generated data
const generatedData = fs.readFileSync('geo-data-generated.ts', 'utf8');

// Extract DISTRICTS and WARDS from generated data
const districtsMatch = generatedData.match(/const DISTRICTS = \[([\s\S]*?)\];/);
const wardsMatch = generatedData.match(/const WARDS = \[([\s\S]*?)\];/);

if (!districtsMatch || !wardsMatch) {
  console.error('❌ Không thể extract DISTRICTS hoặc WARDS từ file generated');
  process.exit(1);
}

const districtsArray = districtsMatch[0];
const wardsArray = wardsMatch[0];

console.log('✅ Đã extract DISTRICTS và WARDS từ file generated');
console.log(`   - DISTRICTS: ${districtsArray.split('\n').length} dòng`);
console.log(`   - WARDS: ${wardsArray.split('\n').length} dòng`);

// Find the position to replace in geo.ts
// We need to replace everything from "const DISTRICTS = [" to "const WARDS = [...];"

// Find start of DISTRICTS
const districtsStartIndex = geoFileContent.indexOf('const DISTRICTS = [');
if (districtsStartIndex === -1) {
  console.error('❌ Không tìm thấy "const DISTRICTS = [" trong geo.ts');
  process.exit(1);
}

// Find end of WARDS (the semicolon after the closing bracket)
const wardsEndPattern = /const WARDS = \[[\s\S]*?\];/;
const wardsEndMatch = geoFileContent.match(wardsEndPattern);
if (!wardsEndMatch) {
  console.error('❌ Không tìm thấy WARDS array trong geo.ts');
  process.exit(1);
}

const wardsEndIndex = geoFileContent.indexOf(wardsEndMatch[0]) + wardsEndMatch[0].length;

// Build new content
const beforeDistricts = geoFileContent.substring(0, districtsStartIndex);
const afterWards = geoFileContent.substring(wardsEndIndex);

const newContent = beforeDistricts +
  `${districtsArray}\n\n` +
  `${wardsArray}` +
  afterWards;

// Write to file
fs.writeFileSync('src/routes/shipping/geo.ts', newContent, 'utf8');

console.log('\n✅ Đã update file geo.ts thành công!');
console.log(`   Tổng số dòng mới: ${newContent.split('\n').length}`);

// Verify
const districts = require('./districts-generated.json');
const wards = require('./wards-generated.json');

console.log('\n📊 Thống kê dữ liệu mới:');
Object.entries(districts.reduce((acc, d) => {
  acc[d.province_id] = (acc[d.province_id] || 0) + 1;
  return acc;
}, {})).forEach(([provinceId, count]) => {
  const provinceDistricts = districts.filter(d => d.province_id === provinceId);
  const provinceWards = wards.filter(w =>
    provinceDistricts.some(d => d.id === w.district_id)
  );
  console.log(`   Province ${provinceId}: ${count} districts, ${provinceWards.length} wards`);
});
