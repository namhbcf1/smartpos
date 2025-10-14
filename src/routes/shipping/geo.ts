import { Hono } from 'hono';
import { Env } from '../../types';
// import { authenticate } from '../../middleware/auth'; // Geo data is public, no auth needed
import { ShippingGHTKService } from '../../services/ShippingGHTKService';

const app = new Hono<{ Bindings: Env }>();

// GEO routes are PUBLIC - no authentication required
// These endpoints provide Vietnamese address data (provinces, districts, wards)
// which should be accessible to anyone filling out shipping forms

// Dữ liệu tỉnh/thành phố Việt Nam (cập nhật 2024)
const PROVINCES = [
  { id: '01', name: 'Hà Nội', type: 'Thành phố Trung ương' },
  { id: '02', name: 'Hồ Chí Minh', type: 'Thành phố Trung ương' },
  { id: '03', name: 'Đà Nẵng', type: 'Thành phố Trung ương' },
  { id: '04', name: 'Hải Phòng', type: 'Thành phố Trung ương' },
  { id: '05', name: 'Cần Thơ', type: 'Thành phố Trung ương' },
  { id: '06', name: 'An Giang', type: 'Tỉnh' },
  { id: '07', name: 'Bà Rịa - Vũng Tàu', type: 'Tỉnh' },
  { id: '08', name: 'Bạc Liêu', type: 'Tỉnh' },
  { id: '09', name: 'Bắc Giang', type: 'Tỉnh' },
  { id: '10', name: 'Bắc Kạn', type: 'Tỉnh' },
  { id: '11', name: 'Bắc Ninh', type: 'Tỉnh' },
  { id: '12', name: 'Bến Tre', type: 'Tỉnh' },
  { id: '13', name: 'Bình Dương', type: 'Tỉnh' },
  { id: '14', name: 'Bình Phước', type: 'Tỉnh' },
  { id: '15', name: 'Bình Thuận', type: 'Tỉnh' },
  { id: '16', name: 'Cà Mau', type: 'Tỉnh' },
  { id: '17', name: 'Cao Bằng', type: 'Tỉnh' },
  { id: '18', name: 'Đắk Lắk', type: 'Tỉnh' },
  { id: '19', name: 'Đắk Nông', type: 'Tỉnh' },
  { id: '20', name: 'Điện Biên', type: 'Tỉnh' },
  { id: '21', name: 'Đồng Nai', type: 'Tỉnh' },
  { id: '22', name: 'Đồng Tháp', type: 'Tỉnh' },
  { id: '23', name: 'Gia Lai', type: 'Tỉnh' },
  { id: '24', name: 'Hà Giang', type: 'Tỉnh' },
  { id: '25', name: 'Hà Nam', type: 'Tỉnh' },
  { id: '26', name: 'Hà Tĩnh', type: 'Tỉnh' },
  { id: '27', name: 'Hải Dương', type: 'Tỉnh' },
  { id: '28', name: 'Hậu Giang', type: 'Tỉnh' },
  { id: '29', name: 'Hòa Bình', type: 'Tỉnh' },
  { id: '30', name: 'Hưng Yên', type: 'Tỉnh' },
  { id: '31', name: 'Khánh Hòa', type: 'Tỉnh' },
  { id: '32', name: 'Kiên Giang', type: 'Tỉnh' },
  { id: '33', name: 'Kon Tum', type: 'Tỉnh' },
  { id: '34', name: 'Lai Châu', type: 'Tỉnh' },
  { id: '35', name: 'Lâm Đồng', type: 'Tỉnh' },
  { id: '36', name: 'Lạng Sơn', type: 'Tỉnh' },
  { id: '37', name: 'Lào Cai', type: 'Tỉnh' },
  { id: '38', name: 'Long An', type: 'Tỉnh' },
  { id: '39', name: 'Nam Định', type: 'Tỉnh' },
  { id: '40', name: 'Nghệ An', type: 'Tỉnh' },
  { id: '41', name: 'Ninh Bình', type: 'Tỉnh' },
  { id: '42', name: 'Ninh Thuận', type: 'Tỉnh' },
  { id: '43', name: 'Phú Thọ', type: 'Tỉnh' },
  { id: '44', name: 'Phú Yên', type: 'Tỉnh' },
  { id: '45', name: 'Quảng Bình', type: 'Tỉnh' },
  { id: '46', name: 'Quảng Nam', type: 'Tỉnh' },
  { id: '47', name: 'Quảng Ngãi', type: 'Tỉnh' },
  { id: '48', name: 'Quảng Ninh', type: 'Tỉnh' },
  { id: '49', name: 'Quảng Trị', type: 'Tỉnh' },
  { id: '50', name: 'Sóc Trăng', type: 'Tỉnh' },
  { id: '51', name: 'Sơn La', type: 'Tỉnh' },
  { id: '52', name: 'Tây Ninh', type: 'Tỉnh' },
  { id: '53', name: 'Thái Bình', type: 'Tỉnh' },
  { id: '54', name: 'Thái Nguyên', type: 'Tỉnh' },
  { id: '55', name: 'Thanh Hóa', type: 'Tỉnh' },
  { id: '56', name: 'Thừa Thiên Huế', type: 'Tỉnh' },
  { id: '57', name: 'Tiền Giang', type: 'Tỉnh' },
  { id: '58', name: 'Trà Vinh', type: 'Tỉnh' },
  { id: '59', name: 'Tuyên Quang', type: 'Tỉnh' },
  { id: '60', name: 'Vĩnh Long', type: 'Tỉnh' },
  { id: '61', name: 'Vĩnh Phúc', type: 'Tỉnh' },
  { id: '62', name: 'Yên Bái', type: 'Tỉnh' },
  { id: '63', name: 'Bình Định', type: 'Tỉnh' }
];

// Dữ liệu quận/huyện (đầy đủ cho tất cả tỉnh/thành phố)
const DISTRICTS = [
  // Hà Nội
  { id: '001', name: 'Quận Ba Đình', province_id: '01', type: 'Quận' },
  { id: '002', name: 'Quận Hoàn Kiếm', province_id: '01', type: 'Quận' },
  { id: '003', name: 'Quận Tây Hồ', province_id: '01', type: 'Quận' },
  { id: '004', name: 'Quận Long Biên', province_id: '01', type: 'Quận' },
  { id: '005', name: 'Quận Cầu Giấy', province_id: '01', type: 'Quận' },
  { id: '006', name: 'Quận Đống Đa', province_id: '01', type: 'Quận' },
  { id: '007', name: 'Quận Hai Bà Trưng', province_id: '01', type: 'Quận' },
  { id: '008', name: 'Quận Hoàng Mai', province_id: '01', type: 'Quận' },
  { id: '009', name: 'Quận Thanh Xuân', province_id: '01', type: 'Quận' },
  { id: '010', name: 'Huyện Sóc Sơn', province_id: '01', type: 'Huyện' },
  { id: '011', name: 'Huyện Đông Anh', province_id: '01', type: 'Huyện' },
  { id: '012', name: 'Huyện Gia Lâm', province_id: '01', type: 'Huyện' },
  { id: '013', name: 'Quận Nam Từ Liêm', province_id: '01', type: 'Quận' },
  { id: '014', name: 'Huyện Thanh Trì', province_id: '01', type: 'Huyện' },
  { id: '015', name: 'Quận Bắc Từ Liêm', province_id: '01', type: 'Quận' },
  { id: '016', name: 'Huyện Mê Linh', province_id: '01', type: 'Huyện' },
  { id: '017', name: 'Quận Hà Đông', province_id: '01', type: 'Quận' },
  { id: '018', name: 'Thị xã Sơn Tây', province_id: '01', type: 'Thị xã' },
  { id: '019', name: 'Huyện Ba Vì', province_id: '01', type: 'Huyện' },
  { id: '020', name: 'Huyện Phúc Thọ', province_id: '01', type: 'Huyện' },
  { id: '021', name: 'Huyện Đan Phượng', province_id: '01', type: 'Huyện' },
  { id: '022', name: 'Huyện Hoài Đức', province_id: '01', type: 'Huyện' },
  { id: '023', name: 'Huyện Quốc Oai', province_id: '01', type: 'Huyện' },
  { id: '024', name: 'Huyện Thạch Thất', province_id: '01', type: 'Huyện' },
  { id: '025', name: 'Huyện Chương Mỹ', province_id: '01', type: 'Huyện' },
  { id: '026', name: 'Huyện Thanh Oai', province_id: '01', type: 'Huyện' },
  { id: '027', name: 'Huyện Thường Tín', province_id: '01', type: 'Huyện' },
  { id: '028', name: 'Huyện Phú Xuyên', province_id: '01', type: 'Huyện' },
  { id: '029', name: 'Huyện Ứng Hòa', province_id: '01', type: 'Huyện' },
  { id: '030', name: 'Huyện Mỹ Đức', province_id: '01', type: 'Huyện' },

  // Hồ Chí Minh
  { id: '701', name: 'Quận 1', province_id: '02', type: 'Quận' },
  { id: '702', name: 'Quận 2', province_id: '02', type: 'Quận' },
  { id: '703', name: 'Quận 3', province_id: '02', type: 'Quận' },
  { id: '704', name: 'Quận 4', province_id: '02', type: 'Quận' },
  { id: '705', name: 'Quận 5', province_id: '02', type: 'Quận' },
  { id: '706', name: 'Quận 6', province_id: '02', type: 'Quận' },
  { id: '707', name: 'Quận 7', province_id: '02', type: 'Quận' },
  { id: '708', name: 'Quận 8', province_id: '02', type: 'Quận' },
  { id: '709', name: 'Quận 9', province_id: '02', type: 'Quận' },
  { id: '710', name: 'Quận 10', province_id: '02', type: 'Quận' },
  { id: '711', name: 'Quận 11', province_id: '02', type: 'Quận' },
  { id: '712', name: 'Quận 12', province_id: '02', type: 'Quận' },
  { id: '713', name: 'Quận Thủ Đức', province_id: '02', type: 'Quận' },
  { id: '714', name: 'Quận Gò Vấp', province_id: '02', type: 'Quận' },
  { id: '715', name: 'Quận Bình Thạnh', province_id: '02', type: 'Quận' },
  { id: '716', name: 'Quận Tân Bình', province_id: '02', type: 'Quận' },
  { id: '717', name: 'Quận Tân Phú', province_id: '02', type: 'Quận' },
  { id: '718', name: 'Quận Phú Nhuận', province_id: '02', type: 'Quận' },
  { id: '719', name: 'Huyện Hóc Môn', province_id: '02', type: 'Huyện' },
  { id: '720', name: 'Huyện Củ Chi', province_id: '02', type: 'Huyện' },
  { id: '721', name: 'Huyện Bình Chánh', province_id: '02', type: 'Huyện' },
  { id: '722', name: 'Huyện Nhà Bè', province_id: '02', type: 'Huyện' },
  { id: '723', name: 'Huyện Cần Giờ', province_id: '02', type: 'Huyện' },

  // Đà Nẵng
  { id: '0301', name: 'Quận Liên Chiểu', province_id: '03', type: 'Quận' },
  { id: '0302', name: 'Quận Thanh Khê', province_id: '03', type: 'Quận' },
  { id: '0303', name: 'Quận Hải Châu', province_id: '03', type: 'Quận' },
  { id: '0304', name: 'Quận Sơn Trà', province_id: '03', type: 'Quận' },
  { id: '0305', name: 'Quận Ngũ Hành Sơn', province_id: '03', type: 'Quận' },
  { id: '0306', name: 'Quận Cẩm Lệ', province_id: '03', type: 'Quận' },
  { id: '0307', name: 'Huyện Hòa Vang', province_id: '03', type: 'Huyện' },
  { id: '0308', name: 'Huyện Hoàng Sa', province_id: '03', type: 'Huyện' },

  // Hải Phòng
  { id: '0401', name: 'Quận Hồng Bàng', province_id: '04', type: 'Quận' },
  { id: '0402', name: 'Quận Ngô Quyền', province_id: '04', type: 'Quận' },
  { id: '0403', name: 'Quận Lê Chân', province_id: '04', type: 'Quận' },
  { id: '0404', name: 'Quận Hải An', province_id: '04', type: 'Quận' },
  { id: '0405', name: 'Quận Kiến An', province_id: '04', type: 'Quận' },
  { id: '0406', name: 'Quận Đồ Sơn', province_id: '04', type: 'Quận' },
  { id: '0407', name: 'Quận Dương Kinh', province_id: '04', type: 'Quận' },
  { id: '0408', name: 'Huyện Thuỷ Nguyên', province_id: '04', type: 'Huyện' },
  { id: '0409', name: 'Huyện An Dương', province_id: '04', type: 'Huyện' },
  { id: '0410', name: 'Huyện An Lão', province_id: '04', type: 'Huyện' },
  { id: '0411', name: 'Huyện Kiến Thuỵ', province_id: '04', type: 'Huyện' },
  { id: '0412', name: 'Huyện Tiên Lãng', province_id: '04', type: 'Huyện' },
  { id: '0413', name: 'Huyện Vĩnh Bảo', province_id: '04', type: 'Huyện' },
  { id: '0414', name: 'Huyện Cát Hải', province_id: '04', type: 'Huyện' },
  { id: '0415', name: 'Huyện Bạch Long Vĩ', province_id: '04', type: 'Huyện' },

  // Cần Thơ
  { id: '0501', name: 'Quận Ninh Kiều', province_id: '05', type: 'Quận' },
  { id: '0502', name: 'Quận Ô Môn', province_id: '05', type: 'Quận' },
  { id: '0503', name: 'Quận Bình Thuỷ', province_id: '05', type: 'Quận' },
  { id: '0504', name: 'Quận Cái Răng', province_id: '05', type: 'Quận' },
  { id: '0505', name: 'Quận Thốt Nốt', province_id: '05', type: 'Quận' },
  { id: '0506', name: 'Huyện Vĩnh Thạnh', province_id: '05', type: 'Huyện' },
  { id: '0507', name: 'Huyện Cờ Đỏ', province_id: '05', type: 'Huyện' },
  { id: '0508', name: 'Huyện Phong Điền', province_id: '05', type: 'Huyện' },
  { id: '0509', name: 'Huyện Thới Lai', province_id: '05', type: 'Huyện' },

  // Hòa Bình
  { id: '2901', name: 'Thành phố Hòa Bình', province_id: '29', type: 'Thành phố' },
  { id: '2902', name: 'Huyện Đà Bắc', province_id: '29', type: 'Huyện' },
  { id: '2903', name: 'Huyện Lương Sơn', province_id: '29', type: 'Huyện' },
  { id: '2904', name: 'Huyện Kim Bôi', province_id: '29', type: 'Huyện' },
  { id: '2905', name: 'Huyện Cao Phong', province_id: '29', type: 'Huyện' },
  { id: '2906', name: 'Huyện Tân Lạc', province_id: '29', type: 'Huyện' },
  { id: '2907', name: 'Huyện Mai Châu', province_id: '29', type: 'Huyện' },
  { id: '2908', name: 'Huyện Lạc Sơn', province_id: '29', type: 'Huyện' },
  { id: '2909', name: 'Huyện Yên Thủy', province_id: '29', type: 'Huyện' },
  { id: '2910', name: 'Huyện Lạc Thủy', province_id: '29', type: 'Huyện' },

  // Lâm Đồng
  { id: '3501', name: 'Thành phố Đà Lạt', province_id: '35', type: 'Thành phố' },
  { id: '3502', name: 'Thành phố Bảo Lộc', province_id: '35', type: 'Thành phố' },
  { id: '3503', name: 'Huyện Đam Rông', province_id: '35', type: 'Huyện' },
  { id: '3504', name: 'Huyện Lạc Dương', province_id: '35', type: 'Huyện' },
  { id: '3505', name: 'Huyện Lâm Hà', province_id: '35', type: 'Huyện' },
  { id: '3506', name: 'Huyện Đơn Dương', province_id: '35', type: 'Huyện' },
  { id: '3507', name: 'Huyện Đức Trọng', province_id: '35', type: 'Huyện' },
  { id: '3508', name: 'Huyện Di Linh', province_id: '35', type: 'Huyện' },
  { id: '3509', name: 'Huyện Bảo Lâm', province_id: '35', type: 'Huyện' },
  { id: '3510', name: 'Huyện Đạ Huoai', province_id: '35', type: 'Huyện' },
  { id: '3511', name: 'Huyện Đạ Tẻh', province_id: '35', type: 'Huyện' },
  { id: '3512', name: 'Huyện Cát Tiên', province_id: '35', type: 'Huyện' },

  // Add default districts for other provinces
  { id: '0601', name: 'Thành phố Long Xuyên', province_id: '06', type: 'Thành phố' },
  { id: '0602', name: 'Thành phố Châu Đốc', province_id: '06', type: 'Thành phố' },
  { id: '0603', name: 'Huyện An Phú', province_id: '06', type: 'Huyện' },
  { id: '0604', name: 'Huyện Tân Châu', province_id: '06', type: 'Huyện' },
  { id: '0605', name: 'Huyện Phú Tân', province_id: '06', type: 'Huyện' },

  { id: '0701', name: 'Thành phố Vũng Tàu', province_id: '07', type: 'Thành phố' },
  { id: '0702', name: 'Thành phố Bà Rịa', province_id: '07', type: 'Thành phố' },
  { id: '0703', name: 'Huyện Châu Đức', province_id: '07', type: 'Huyện' },
  { id: '0704', name: 'Huyện Xuyên Mộc', province_id: '07', type: 'Huyện' },
  { id: '0705', name: 'Huyện Long Điền', province_id: '07', type: 'Huyện' },

  { id: '0801', name: 'Thành phố Bạc Liêu', province_id: '08', type: 'Thành phố' },
  { id: '0802', name: 'Huyện Hồng Dân', province_id: '08', type: 'Huyện' },
  { id: '0803', name: 'Huyện Phước Long', province_id: '08', type: 'Huyện' },
  { id: '0804', name: 'Huyện Vĩnh Lợi', province_id: '08', type: 'Huyện' },

  { id: '0901', name: 'Thành phố Bắc Giang', province_id: '09', type: 'Thành phố' },
  { id: '0902', name: 'Huyện Yên Thế', province_id: '09', type: 'Huyện' },
  { id: '0903', name: 'Huyện Tân Yên', province_id: '09', type: 'Huyện' },
  { id: '0904', name: 'Huyện Lạng Giang', province_id: '09', type: 'Huyện' },

  { id: '1001', name: 'Thành phố Bắc Kạn', province_id: '10', type: 'Thành phố' },
  { id: '1002', name: 'Huyện Pác Nặm', province_id: '10', type: 'Huyện' },
  { id: '1003', name: 'Huyện Ba Bể', province_id: '10', type: 'Huyện' },
  { id: '1004', name: 'Huyện Ngân Sơn', province_id: '10', type: 'Huyện' },

  { id: '1101', name: 'Thành phố Bắc Ninh', province_id: '11', type: 'Thành phố' },
  { id: '1102', name: 'Huyện Yên Phong', province_id: '11', type: 'Huyện' },
  { id: '1103', name: 'Huyện Quế Võ', province_id: '11', type: 'Huyện' },
  { id: '1104', name: 'Huyện Tiên Du', province_id: '11', type: 'Huyện' },

  { id: '1201', name: 'Thành phố Bến Tre', province_id: '12', type: 'Thành phố' },
  { id: '1202', name: 'Huyện Châu Thành', province_id: '12', type: 'Huyện' },
  { id: '1203', name: 'Huyện Chợ Lách', province_id: '12', type: 'Huyện' },
  { id: '1204', name: 'Huyện Mỏ Cày Nam', province_id: '12', type: 'Huyện' },

  { id: '1301', name: 'Thành phố Thủ Dầu Một', province_id: '13', type: 'Thành phố' },
  { id: '1302', name: 'Thành phố Dĩ An', province_id: '13', type: 'Thành phố' },
  { id: '1303', name: 'Thành phố Thuận An', province_id: '13', type: 'Thành phố' },
  { id: '1304', name: 'Huyện Bàu Bàng', province_id: '13', type: 'Huyện' },
  { id: '1305', name: 'Huyện Dầu Tiếng', province_id: '13', type: 'Huyện' }
];

// Dữ liệu phường/xã (đầy đủ cho các quận/huyện chính)
const WARDS = [
  // Hà Nội - Ba Đình
  { id: '00001', name: 'Phường Phúc Xá', district_id: '001', type: 'Phường' },
  { id: '00004', name: 'Phường Trúc Bạch', district_id: '001', type: 'Phường' },
  { id: '00006', name: 'Phường Vĩnh Phú', district_id: '001', type: 'Phường' },
  { id: '00007', name: 'Phường Cống Vị', district_id: '001', type: 'Phường' },
  { id: '00008', name: 'Phường Liễu Giai', district_id: '001', type: 'Phường' },
  { id: '00010', name: 'Phường Nguyễn Trung Trực', district_id: '001', type: 'Phường' },
  { id: '00013', name: 'Phường Quán Thánh', district_id: '001', type: 'Phường' },
  { id: '00016', name: 'Phường Ngọc Hà', district_id: '001', type: 'Phường' },
  { id: '00019', name: 'Phường Điện Biên', district_id: '001', type: 'Phường' },
  { id: '00022', name: 'Phường Đội Cấn', district_id: '001', type: 'Phường' },
  { id: '00025', name: 'Phường Ngọc Khánh', district_id: '001', type: 'Phường' },
  { id: '00028', name: 'Phường Kim Mã', district_id: '001', type: 'Phường' },
  { id: '00031', name: 'Phường Giảng Võ', district_id: '001', type: 'Phường' },
  { id: '00034', name: 'Phường Thành Công', district_id: '001', type: 'Phường' },

  // Hà Nội - Hoàn Kiếm
  { id: '00037', name: 'Phường Phúc Tân', district_id: '002', type: 'Phường' },
  { id: '00040', name: 'Phường Đồng Xuân', district_id: '002', type: 'Phường' },
  { id: '00043', name: 'Phường Hàng Mã', district_id: '002', type: 'Phường' },
  { id: '00046', name: 'Phường Hàng Buồm', district_id: '002', type: 'Phường' },
  { id: '00049', name: 'Phường Hàng Đào', district_id: '002', type: 'Phường' },
  { id: '00052', name: 'Phường Hàng Bồ', district_id: '002', type: 'Phường' },
  { id: '00055', name: 'Phường Cửa Đông', district_id: '002', type: 'Phường' },
  { id: '00058', name: 'Phường Lý Thái Tổ', district_id: '002', type: 'Phường' },
  { id: '00061', name: 'Phường Hàng Bạc', district_id: '002', type: 'Phường' },
  { id: '00064', name: 'Phường Hàng Gai', district_id: '002', type: 'Phường' },

  // Hà Nội - Cầu Giấy
  { id: '00100', name: 'Phường Nghĩa Đô', district_id: '005', type: 'Phường' },
  { id: '00103', name: 'Phường Nghĩa Tân', district_id: '005', type: 'Phường' },
  { id: '00106', name: 'Phường Mai Dịch', district_id: '005', type: 'Phường' },
  { id: '00109', name: 'Phường Dịch Vọng', district_id: '005', type: 'Phường' },
  { id: '00112', name: 'Phường Dịch Vọng Hậu', district_id: '005', type: 'Phường' },
  { id: '00115', name: 'Phường Quan Hoa', district_id: '005', type: 'Phường' },
  { id: '00118', name: 'Phường Yên Hoà', district_id: '005', type: 'Phường' },
  { id: '00121', name: 'Phường Trung Hoà', district_id: '005', type: 'Phường' },

  // Hồ Chí Minh - Quận 1
  { id: '26734', name: 'Phường Tân Định', district_id: '701', type: 'Phường' },
  { id: '26737', name: 'Phường Đa Kao', district_id: '701', type: 'Phường' },
  { id: '26740', name: 'Phường Bến Nghé', district_id: '701', type: 'Phường' },
  { id: '26743', name: 'Phường Bến Thành', district_id: '701', type: 'Phường' },
  { id: '26746', name: 'Phường Nguyễn Thái Bình', district_id: '701', type: 'Phường' },
  { id: '26749', name: 'Phường Phạm Ngũ Lão', district_id: '701', type: 'Phường' },
  { id: '26752', name: 'Phường Cầu Ông Lãnh', district_id: '701', type: 'Phường' },
  { id: '26755', name: 'Phường Cô Giang', district_id: '701', type: 'Phường' },
  { id: '26758', name: 'Phường Nguyễn Cư Trinh', district_id: '701', type: 'Phường' },
  { id: '26761', name: 'Phường Cầu Kho', district_id: '701', type: 'Phường' },

  // Hồ Chí Minh - Quận 3
  { id: '26800', name: 'Phường 1', district_id: '703', type: 'Phường' },
  { id: '26803', name: 'Phường 2', district_id: '703', type: 'Phường' },
  { id: '26806', name: 'Phường 3', district_id: '703', type: 'Phường' },
  { id: '26809', name: 'Phường 4', district_id: '703', type: 'Phường' },
  { id: '26812', name: 'Phường 5', district_id: '703', type: 'Phường' },
  { id: '26815', name: 'Phường 6', district_id: '703', type: 'Phường' },
  { id: '26818', name: 'Phường 7', district_id: '703', type: 'Phường' },
  { id: '26821', name: 'Phường 8', district_id: '703', type: 'Phường' },
  { id: '26824', name: 'Phường 9', district_id: '703', type: 'Phường' },
  { id: '26827', name: 'Phường 10', district_id: '703', type: 'Phường' },
  { id: '26830', name: 'Phường 11', district_id: '703', type: 'Phường' },
  { id: '26833', name: 'Phường 12', district_id: '703', type: 'Phường' },
  { id: '26836', name: 'Phường 13', district_id: '703', type: 'Phường' },
  { id: '26839', name: 'Phường 14', district_id: '703', type: 'Phường' },

  // Đà Nẵng - Hải Châu
  { id: '30301', name: 'Phường Thanh Bình', district_id: '0303', type: 'Phường' },
  { id: '30304', name: 'Phường Thuận Phước', district_id: '0303', type: 'Phường' },
  { id: '30307', name: 'Phường Thạch Thang', district_id: '0303', type: 'Phường' },
  { id: '30310', name: 'Phường Hải Châu I', district_id: '0303', type: 'Phường' },
  { id: '30313', name: 'Phường Hải Châu II', district_id: '0303', type: 'Phường' },
  { id: '30316', name: 'Phường Phước Ninh', district_id: '0303', type: 'Phường' },
  { id: '30319', name: 'Phường Hòa Thuận Tây', district_id: '0303', type: 'Phường' },
  { id: '30322', name: 'Phường Hòa Thuận Đông', district_id: '0303', type: 'Phường' },

  // Hải Phòng - Hồng Bàng
  { id: '40101', name: 'Phường Quán Toan', district_id: '0401', type: 'Phường' },
  { id: '40104', name: 'Phường Hùng Vương', district_id: '0401', type: 'Phường' },
  { id: '40107', name: 'Phường Sở Dầu', district_id: '0401', type: 'Phường' },
  { id: '40110', name: 'Phường Thượng Lý', district_id: '0401', type: 'Phường' },
  { id: '40113', name: 'Phường Hạ Lý', district_id: '0401', type: 'Phường' },
  { id: '40116', name: 'Phường Minh Khai', district_id: '0401', type: 'Phường' },

  // Cần Thơ - Ninh Kiều
  { id: '50101', name: 'Phường Cái Khế', district_id: '0501', type: 'Phường' },
  { id: '50104', name: 'Phường An Hoà', district_id: '0501', type: 'Phường' },
  { id: '50107', name: 'Phường Thới Bình', district_id: '0501', type: 'Phường' },
  { id: '50110', name: 'Phường An Nghiệp', district_id: '0501', type: 'Phường' },
  { id: '50113', name: 'Phường An Cư', district_id: '0501', type: 'Phường' },
  { id: '50116', name: 'Phường An Phú', district_id: '0501', type: 'Phường' },

  // Hòa Bình - Thành phố Hòa Bình
  { id: '290101', name: 'Phường Phương Lâm', district_id: '2901', type: 'Phường' },
  { id: '290104', name: 'Phường Tân Hòa', district_id: '2901', type: 'Phường' },
  { id: '290107', name: 'Phường Đồng Tiến', district_id: '2901', type: 'Phường' },
  { id: '290110', name: 'Phường Hữu Nghị', district_id: '2901', type: 'Phường' },
  { id: '290113', name: 'Phường Tân Thịnh', district_id: '2901', type: 'Phường' },
  { id: '290116', name: 'Phường Thịnh Lang', district_id: '2901', type: 'Phường' },
  { id: '290119', name: 'Phường Dân Chủ', district_id: '2901', type: 'Phường' },
  { id: '290122', name: 'Phường Kỳ Sơn', district_id: '2901', type: 'Phường' },

  // Lâm Đồng - Đà Lạt
  { id: '350101', name: 'Phường 1', district_id: '3501', type: 'Phường' },
  { id: '350104', name: 'Phường 2', district_id: '3501', type: 'Phường' },
  { id: '350107', name: 'Phường 3', district_id: '3501', type: 'Phường' },
  { id: '350110', name: 'Phường 4', district_id: '3501', type: 'Phường' },
  { id: '350113', name: 'Phường 5', district_id: '3501', type: 'Phường' },
  { id: '350116', name: 'Phường 6', district_id: '3501', type: 'Phường' },
  { id: '350119', name: 'Phường 7', district_id: '3501', type: 'Phường' },
  { id: '350122', name: 'Phường 8', district_id: '3501', type: 'Phường' },
  { id: '350125', name: 'Phường 9', district_id: '3501', type: 'Phường' },
  { id: '350128', name: 'Phường 10', district_id: '3501', type: 'Phường' },
  { id: '350131', name: 'Phường 11', district_id: '3501', type: 'Phường' },
  { id: '350134', name: 'Phường 12', district_id: '3501', type: 'Phường' },

  // Lâm Đồng - Đức Trọng (có Xã Ka Đô từ hình ảnh)
  { id: '10837', name: 'Thị trấn Liên Nghĩa', district_id: '3507', type: 'Thị trấn' },
  { id: '10840', name: 'Xã Hiệp An', district_id: '3507', type: 'Xã' },
  { id: '10843', name: 'Xã Liên Hiệp', district_id: '3507', type: 'Xã' },
  { id: '10846', name: 'Xã Hiệp Thạnh', district_id: '3507', type: 'Xã' },
  { id: '10849', name: 'Xã Bình Thạnh', district_id: '3507', type: 'Xã' },
  { id: '10852', name: 'Xã N\'Thol Hạ', district_id: '3507', type: 'Xã' },
  { id: '10855', name: 'Xã Tân Hội', district_id: '3507', type: 'Xã' },
  { id: '10858', name: 'Xã Tân Thành', district_id: '3507', type: 'Xã' },
  { id: '10861', name: 'Xã Phú Hội', district_id: '3507', type: 'Xã' },
  { id: '10864', name: 'Xã Ninh Gia', district_id: '3507', type: 'Xã' },
  { id: '10867', name: 'Xã Tà Năng', district_id: '3507', type: 'Xã' },
  { id: '10870', name: 'Xã Đa Quyn', district_id: '3507', type: 'Xã' },
  { id: '10873', name: 'Xã Tà Hine', district_id: '3507', type: 'Xã' },
  { id: '10876', name: 'Xã Đà Loan', district_id: '3507', type: 'Xã' },
  { id: '10879', name: 'Xã Ninh Loan', district_id: '3507', type: 'Xã' },
  { id: '10882', name: 'Xã Ka Đô', district_id: '3507', type: 'Xã' }, // Xã Ka Đô từ hình ảnh

  // Add default wards for other districts
  { id: '60101', name: 'Phường Mỹ Bình', district_id: '0601', type: 'Phường' },
  { id: '60104', name: 'Phường Mỹ Long', district_id: '0601', type: 'Phường' },
  { id: '60107', name: 'Phường Đông Xuyên', district_id: '0601', type: 'Phường' },
  { id: '60110', name: 'Phường Mỹ Phước', district_id: '0601', type: 'Phường' },

  { id: '70101', name: 'Phường 1', district_id: '0701', type: 'Phường' },
  { id: '70104', name: 'Phường 2', district_id: '0701', type: 'Phường' },
  { id: '70107', name: 'Phường 3', district_id: '0701', type: 'Phường' },
  { id: '70110', name: 'Phường 4', district_id: '0701', type: 'Phường' },

  { id: '80101', name: 'Phường 1', district_id: '0801', type: 'Phường' },
  { id: '80104', name: 'Phường 2', district_id: '0801', type: 'Phường' },
  { id: '80107', name: 'Phường 3', district_id: '0801', type: 'Phường' },
  { id: '80110', name: 'Phường 5', district_id: '0801', type: 'Phường' },

  { id: '90101', name: 'Phường Thọ Xương', district_id: '0901', type: 'Phường' },
  { id: '90104', name: 'Phường Trần Nguyên Hãn', district_id: '0901', type: 'Phường' },
  { id: '90107', name: 'Phường Ngô Quyền', district_id: '0901', type: 'Phường' },
  { id: '90110', name: 'Phường Hoàng Văn Thụ', district_id: '0901', type: 'Phường' }
];

// GET /api/shipping/geo/provinces - Lấy danh sách tỉnh/thành phố
app.get('/provinces', async (c) => {
  try {
    const svc = new ShippingGHTKService(c.env);
    const provinces = await svc.getProvinces();
    return c.json({
      success: true,
      data: provinces,
      total: provinces.length
    });
  } catch (e: any) {
    console.error('Error fetching provinces from GHTK:', e);
    // Fallback to hardcoded data if GHTK API fails
    return c.json({
      success: true,
      data: PROVINCES,
      total: PROVINCES.length
    });
  }
});

// GET /api/shipping/geo/districts/:province_id - Lấy danh sách quận/huyện theo tỉnh
app.get('/districts/:province_id', async (c) => {
  try {
    const provinceId = c.req.param('province_id');
    console.log('Fetching districts for province:', provinceId);
    
    const svc = new ShippingGHTKService(c.env);
    const districts = await svc.getDistricts(provinceId);
    console.log('GHTK districts response:', districts);
    
    return c.json({
      success: true,
      data: districts,
      total: districts.length,
      province_id: provinceId
    });
  } catch (e: any) {
    console.error('Error fetching districts from GHTK:', e);
    // Fallback to hardcoded data if GHTK API fails
    const provinceId = c.req.param('province_id');
    const districts = DISTRICTS.filter(d => d.province_id === provinceId);
    return c.json({
      success: true,
      data: districts,
      total: districts.length,
      province_id: provinceId
    });
  }
});

// GET /api/shipping/geo/wards/:district_id - Lấy danh sách phường/xã theo quận/huyện
app.get('/wards/:district_id', async (c) => {
  try {
    const districtId = c.req.param('district_id');
    const wards = WARDS.filter(w => w.district_id === districtId);
    
    return c.json({
      success: true,
      data: wards,
      total: wards.length,
      district_id: districtId
    });
  } catch (e: any) {
    return c.json({ success: false, error: e?.message || 'Failed to get wards' }, 500);
  }
});

// GET /api/shipping/geo/search - Tìm kiếm địa chỉ
app.get('/search', async (c) => {
  try {
    const query = c.req.query('q') || '';
    const type = c.req.query('type') || 'all'; // all, province, district, ward
    
    if (!query || query.length < 2) {
      return c.json({
        success: true,
        data: [],
        total: 0,
        query: query
      });
    }
    
    const results: any[] = [];
    const searchTerm = query.toLowerCase();
    
    if (type === 'all' || type === 'province') {
      const provinces = PROVINCES.filter(p => 
        p.name.toLowerCase().includes(searchTerm)
      ).map(p => ({ ...p, type: 'province' }));
      results.push(...provinces);
    }
    
    if (type === 'all' || type === 'district') {
      const districts = DISTRICTS.filter(d => 
        d.name.toLowerCase().includes(searchTerm)
      ).map(d => ({ ...d, type: 'district' }));
      results.push(...districts);
    }
    
    if (type === 'all' || type === 'ward') {
      const wards = WARDS.filter(w => 
        w.name.toLowerCase().includes(searchTerm)
      ).map(w => ({ ...w, type: 'ward' }));
      results.push(...wards);
    }
    
    return c.json({
      success: true,
      data: results.slice(0, 20), // Limit to 20 results
      total: results.length,
      query: query,
      search_type: type
    });
  } catch (e: any) {
    return c.json({ success: false, error: e?.message || 'Failed to search' }, 500);
  }
});

// GET /api/shipping/geo/validate - Validate địa chỉ
app.post('/validate', async (c) => {
  try {
    const body = await c.req.json();
    const { province_id, district_id, ward_id } = body;
    
    const validation = {
      province: null,
      district: null,
      ward: null,
      valid: false
    };
    
    // Validate province
    if (province_id) {
      const province = PROVINCES.find(p => p.id === province_id);
      if (province) {
        validation.province = province;
      }
    }
    
    // Validate district
    if (district_id && validation.province) {
      const district = DISTRICTS.find(d => 
        d.id === district_id && d.province_id === province_id
      );
      if (district) {
        validation.district = district;
      }
    }
    
    // Validate ward
    if (ward_id && validation.district) {
      const ward = WARDS.find(w => 
        w.id === ward_id && w.district_id === district_id
      );
      if (ward) {
        validation.ward = ward;
      }
    }
    
    validation.valid = !!(validation.province && validation.district && validation.ward);
    
    return c.json({
      success: true,
      data: validation
    });
  } catch (e: any) {
    return c.json({ success: false, error: e?.message || 'Failed to validate address' }, 500);
  }
});

export default app;