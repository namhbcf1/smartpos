/**
 * Script để generate dữ liệu geo đầy đủ cho 34 tỉnh thành mới
 * Đọc dữ liệu từ provinces-data.json (63 tỉnh cũ)
 * Map sang 34 tỉnh mới theo sáp nhập
 * Generate TypeScript code cho DISTRICTS và WARDS arrays
 */

const fs = require('fs');

// Map 34 tỉnh mới (code mới -> tên tỉnh mới)
const NEW_PROVINCES_MAP = {
  '01': 'Hà Nội',
  '02': 'Hồ Chí Minh',
  '03': 'Đà Nẵng',
  '04': 'Hải Phòng',
  '05': 'Cần Thơ',
  '16': 'Huế',
  '06': 'An Giang',
  '11': 'Bắc Ninh',
  '16b': 'Cà Mau',
  '17': 'Cao Bằng',
  '18': 'Đắk Lắk',
  '20': 'Điện Biên',
  '21': 'Đồng Nai',
  '22': 'Đồng Tháp',
  '23': 'Gia Lai',
  '26': 'Hà Tĩnh',
  '30': 'Hưng Yên',
  '31': 'Khánh Hòa',
  '34': 'Lai Châu',
  '35': 'Lâm Đồng',
  '36': 'Lạng Sơn',
  '37': 'Lào Cai',
  '40': 'Nghệ An',
  '41': 'Ninh Bình',
  '43': 'Phú Thọ',
  '47': 'Quảng Ngãi',
  '48': 'Quảng Ninh',
  '49': 'Quảng Trị',
  '51': 'Sơn La',
  '52': 'Tây Ninh',
  '54': 'Thái Nguyên',
  '55': 'Thanh Hóa',
  '59': 'Tuyên Quang',
  '60': 'Vĩnh Long'
};

// Map tỉnh cũ -> tỉnh mới (theo sáp nhập)
const OLD_TO_NEW_PROVINCE_MAP = {
  'Thành phố Hà Nội': { id: '01', name: 'Hà Nội' },
  'Thành phố Hồ Chí Minh': { id: '02', name: 'Hồ Chí Minh' },
  'Thành phố Đà Nẵng': { id: '03', name: 'Đà Nẵng' },
  'Thành phố Hải Phòng': { id: '04', name: 'Hải Phòng' },
  'Thành phố Cần Thơ': { id: '05', name: 'Cần Thơ' },
  'Tỉnh Thừa Thiên Huế': { id: '16', name: 'Huế' },
  'Tỉnh An Giang': { id: '06', name: 'An Giang' },
  'Tỉnh Bắc Ninh': { id: '11', name: 'Bắc Ninh' },
  'Tỉnh Cà Mau': { id: '16b', name: 'Cà Mau' },
  'Tỉnh Cao Bằng': { id: '17', name: 'Cao Bằng' },
  'Tỉnh Đắk Lắk': { id: '18', name: 'Đắk Lắk' },
  'Tỉnh Điện Biên': { id: '20', name: 'Điện Biên' },
  'Tỉnh Đồng Nai': { id: '21', name: 'Đồng Nai' },
  'Tỉnh Đồng Tháp': { id: '22', name: 'Đồng Tháp' },
  'Tỉnh Gia Lai': { id: '23', name: 'Gia Lai' },
  'Tỉnh Hà Tĩnh': { id: '26', name: 'Hà Tĩnh' },
  'Tỉnh Hưng Yên': { id: '30', name: 'Hưng Yên' },
  'Tỉnh Khánh Hòa': { id: '31', name: 'Khánh Hòa' },
  'Tỉnh Lai Châu': { id: '34', name: 'Lai Châu' },
  'Tỉnh Lâm Đồng': { id: '35', name: 'Lâm Đồng' },
  'Tỉnh Lạng Sơn': { id: '36', name: 'Lạng Sơn' },
  'Tỉnh Lào Cai': { id: '37', name: 'Lào Cai' },
  'Tỉnh Nghệ An': { id: '40', name: 'Nghệ An' },
  'Tỉnh Ninh Bình': { id: '41', name: 'Ninh Bình' },
  'Tỉnh Phú Thọ': { id: '43', name: 'Phú Thọ' },
  'Tỉnh Quảng Ngãi': { id: '47', name: 'Quảng Ngãi' },
  'Tỉnh Quảng Ninh': { id: '48', name: 'Quảng Ninh' },
  'Tỉnh Quảng Trị': { id: '49', name: 'Quảng Trị' },
  'Tỉnh Sơn La': { id: '51', name: 'Sơn La' },
  'Tỉnh Tây Ninh': { id: '52', name: 'Tây Ninh' },
  'Tỉnh Thái Nguyên': { id: '54', name: 'Thái Nguyên' },
  'Tỉnh Thanh Hóa': { id: '55', name: 'Thanh Hóa' },
  'Tỉnh Tuyên Quang': { id: '59', name: 'Tuyên Quang' },
  'Tỉnh Vĩnh Long': { id: '60', name: 'Vĩnh Long' },

  // Các tỉnh bị sáp nhập
  'Tỉnh Hà Giang': { id: '59', name: 'Tuyên Quang' },
  'Tỉnh Yên Bái': { id: '37', name: 'Lào Cai' },
  'Tỉnh Bắc Kạn': { id: '54', name: 'Thái Nguyên' },
  'Tỉnh Hòa Bình': { id: '43', name: 'Phú Thọ' },
  'Tỉnh Hoà Bình': { id: '43', name: 'Phú Thọ' }, // Variant spelling
  'Tỉnh Vĩnh Phúc': { id: '43', name: 'Phú Thọ' },
  'Tỉnh Bắc Giang': { id: '11', name: 'Bắc Ninh' },
  'Tỉnh Hải Dương': { id: '04', name: 'Hải Phòng' },
  'Thành phố Huế': { id: '16', name: 'Huế' }, // Alternative name
  'Tỉnh Phú Yên': { id: '31', name: 'Khánh Hòa' },
  'Tỉnh Bình Định': { id: '47', name: 'Quảng Ngãi' },
  'Tỉnh Kon Tum': { id: '23', name: 'Gia Lai' },
  'Tỉnh Đắk Nông': { id: '18', name: 'Đắk Lắk' },
  'Tỉnh Quảng Bình': { id: '26', name: 'Hà Tĩnh' },
  'Tỉnh Quảng Nam': { id: '03', name: 'Đà Nẵng' },
  'Tỉnh Nam Định': { id: '41', name: 'Ninh Bình' },
  'Tỉnh Thái Bình': { id: '04', name: 'Hải Phòng' },
  'Tỉnh Hà Nam': { id: '01', name: 'Hà Nội' },
  'Tỉnh Ninh Thuận': { id: '31', name: 'Khánh Hòa' },
  'Tỉnh Bình Thuận': { id: '35', name: 'Lâm Đồng' },
  'Tỉnh Bình Phước': { id: '21', name: 'Đồng Nai' },
  'Tỉnh Long An': { id: '02', name: 'Hồ Chí Minh' },
  'Tỉnh Tiền Giang': { id: '22', name: 'Đồng Tháp' },
  'Tỉnh Bến Tre': { id: '60', name: 'Vĩnh Long' },
  'Tỉnh Trà Vinh': { id: '60', name: 'Vĩnh Long' },
  'Tỉnh Vũng Tàu': { id: '21', name: 'Đồng Nai' },
  'Tỉnh Bà Rịa - Vũng Tàu': { id: '21', name: 'Đồng Nai' },
  'Tỉnh Bình Dương': { id: '02', name: 'Hồ Chí Minh' },
  'Tỉnh Sóc Trăng': { id: '05', name: 'Cần Thơ' },
  'Tỉnh Bạc Liêu': { id: '16b', name: 'Cà Mau' },
  'Tỉnh Kiên Giang': { id: '06', name: 'An Giang' },
  'Tỉnh Hậu Giang': { id: '05', name: 'Cần Thơ' }
};

// Đọc dữ liệu từ file
const rawData = fs.readFileSync('provinces-data.json', 'utf8');
const oldProvinces = JSON.parse(rawData);

console.log(`Đã đọc ${oldProvinces.length} tỉnh từ dữ liệu cũ`);

// Map districts và wards
const districtsList = [];
const wardsList = [];

oldProvinces.forEach((oldProvince) => {
  const mapping = OLD_TO_NEW_PROVINCE_MAP[oldProvince.name];

  if (!mapping) {
    console.warn(`⚠️  Không tìm thấy mapping cho: ${oldProvince.name}`);
    return;
  }

  const newProvinceId = mapping.id;
  const newProvinceName = mapping.name;

  console.log(`Mapping: ${oldProvince.name} -> ${newProvinceName} (${newProvinceId})`);

  // Process districts
  if (oldProvince.districts && oldProvince.districts.length > 0) {
    oldProvince.districts.forEach((district) => {
      const districtId = `${newProvinceId}_${district.code}`;

      districtsList.push({
        id: districtId,
        name: district.name,
        province_id: newProvinceId,
        type: district.division_type === 'huyện' ?
          (district.name.includes('Quận') ? 'Quận' :
           district.name.includes('Thành phố') ? 'Thành phố' :
           district.name.includes('Thị xã') ? 'Thị xã' : 'Huyện') :
          'Huyện'
      });

      // Process wards
      if (district.wards && district.wards.length > 0) {
        district.wards.forEach((ward) => {
          const wardId = `${districtId}_${ward.code}`;

          wardsList.push({
            id: wardId,
            name: ward.name,
            district_id: districtId,
            type: ward.division_type === 'xã' ?
              (ward.name.includes('Phường') ? 'Phường' :
               ward.name.includes('Thị trấn') ? 'Thị trấn' : 'Xã') :
              'Xã'
          });
        });
      }
    });
  }
});

console.log(`\n✅ Đã map:`);
console.log(`   - ${districtsList.length} quận/huyện`);
console.log(`   - ${wardsList.length} phường/xã`);

// Generate TypeScript code
let tsCode = '';

// Generate DISTRICTS
tsCode += '// Dữ liệu quận/huyện (đầy đủ cho 34 tỉnh thành mới)\n';
tsCode += 'const DISTRICTS = [\n';
districtsList.forEach((district, index) => {
  const comma = index < districtsList.length - 1 ? ',' : '';
  tsCode += `  { id: '${district.id}', name: '${district.name}', province_id: '${district.province_id}', type: '${district.type}' }${comma}\n`;
});
tsCode += '];\n\n';

// Generate WARDS (sample only, full would be too large)
tsCode += '// Dữ liệu phường/xã (đầy đủ cho tất cả quận/huyện)\n';
tsCode += 'const WARDS = [\n';
wardsList.forEach((ward, index) => {
  const comma = index < wardsList.length - 1 ? ',' : '';
  tsCode += `  { id: '${ward.id}', name: '${ward.name}', district_id: '${ward.district_id}', type: '${ward.type}' }${comma}\n`;
});
tsCode += '];\n';

// Write to file
fs.writeFileSync('geo-data-generated.ts', tsCode, 'utf8');
console.log('\n✅ Đã generate TypeScript code vào file: geo-data-generated.ts');
console.log(`   Tổng số dòng: ${tsCode.split('\n').length}`);

// Also save JSON for debugging
fs.writeFileSync('districts-generated.json', JSON.stringify(districtsList, null, 2));
fs.writeFileSync('wards-generated.json', JSON.stringify(wardsList, null, 2));
console.log('✅ Đã lưu JSON debug files');
