-- Seed shipping methods data
INSERT OR IGNORE INTO shipping_methods (id, name, description, carrier, service_type, is_active, settings, created_at, updated_at) VALUES
('ghtk-standard', 'Giao Hàng Tiết Kiệm - Tiêu chuẩn', 'Dịch vụ giao hàng tiêu chuẩn của GHTK với thời gian giao hàng 2-3 ngày', 'ghtk', 'standard', 1, '{"api_key": "your_ghtk_api_key", "api_url": "https://services.giaohangtietkiem.vn", "pickup_address_id": "default"}', datetime('now'), datetime('now')),
('ghtk-fast', 'Giao Hàng Tiết Kiệm - Nhanh', 'Dịch vụ giao hàng nhanh của GHTK với thời gian giao hàng 1-2 ngày', 'ghtk', 'fast', 1, '{"api_key": "your_ghtk_api_key", "api_url": "https://services.giaohangtietkiem.vn", "pickup_address_id": "default"}', datetime('now'), datetime('now')),
('ghtk-express', 'Giao Hàng Tiết Kiệm - Siêu tốc', 'Dịch vụ giao hàng siêu tốc của GHTK với thời gian giao hàng trong ngày', 'ghtk', 'express', 1, '{"api_key": "your_ghtk_api_key", "api_url": "https://services.giaohangtietkiem.vn", "pickup_address_id": "default"}', datetime('now'), datetime('now'));

-- Seed some sample provinces (major cities)
INSERT OR IGNORE INTO ghtk_provinces (code, name, name_en, region) VALUES
('01', 'Hà Nội', 'Ha Noi', 'Miền Bắc'),
('02', 'Hồ Chí Minh', 'Ho Chi Minh', 'Miền Nam'),
('03', 'Đà Nẵng', 'Da Nang', 'Miền Trung'),
('04', 'Hải Phòng', 'Hai Phong', 'Miền Bắc'),
('05', 'Cần Thơ', 'Can Tho', 'Miền Nam'),
('06', 'An Giang', 'An Giang', 'Miền Nam'),
('07', 'Bà Rịa - Vũng Tàu', 'Ba Ria - Vung Tau', 'Miền Nam'),
('08', 'Bắc Giang', 'Bac Giang', 'Miền Bắc'),
('09', 'Bắc Kạn', 'Bac Kan', 'Miền Bắc'),
('10', 'Bạc Liêu', 'Bac Lieu', 'Miền Nam'),
('11', 'Bắc Ninh', 'Bac Ninh', 'Miền Bắc'),
('12', 'Bến Tre', 'Ben Tre', 'Miền Nam'),
('13', 'Bình Định', 'Binh Dinh', 'Miền Trung'),
('14', 'Bình Dương', 'Binh Duong', 'Miền Nam'),
('15', 'Bình Phước', 'Binh Phuoc', 'Miền Nam'),
('16', 'Bình Thuận', 'Binh Thuan', 'Miền Nam'),
('17', 'Cà Mau', 'Ca Mau', 'Miền Nam'),
('18', 'Cao Bằng', 'Cao Bang', 'Miền Bắc'),
('19', 'Đắk Lắk', 'Dak Lak', 'Miền Trung'),
('20', 'Đắk Nông', 'Dak Nong', 'Miền Trung');

-- Seed some sample districts for major cities
INSERT OR IGNORE INTO ghtk_districts (code, name, name_en, province_code) VALUES
-- Hà Nội districts
('001', 'Quận Ba Đình', 'Ba Dinh District', '01'),
('002', 'Quận Hoàn Kiếm', 'Hoan Kiem District', '01'),
('003', 'Quận Tây Hồ', 'Tay Ho District', '01'),
('004', 'Quận Long Biên', 'Long Bien District', '01'),
('005', 'Quận Cầu Giấy', 'Cau Giay District', '01'),
('006', 'Quận Đống Đa', 'Dong Da District', '01'),
('007', 'Quận Hai Bà Trưng', 'Hai Ba Trung District', '01'),
('008', 'Quận Hoàng Mai', 'Hoang Mai District', '01'),
('009', 'Quận Thanh Xuân', 'Thanh Xuan District', '01'),
('010', 'Quận Hà Đông', 'Ha Dong District', '01'),
-- Hồ Chí Minh districts
('011', 'Quận 1', 'District 1', '02'),
('012', 'Quận 2', 'District 2', '02'),
('013', 'Quận 3', 'District 3', '02'),
('014', 'Quận 4', 'District 4', '02'),
('015', 'Quận 5', 'District 5', '02'),
('016', 'Quận 6', 'District 6', '02'),
('017', 'Quận 7', 'District 7', '02'),
('018', 'Quận 8', 'District 8', '02'),
('019', 'Quận 9', 'District 9', '02'),
('020', 'Quận 10', 'District 10', '02'),
('021', 'Quận 11', 'District 11', '02'),
('022', 'Quận 12', 'District 12', '02'),
('023', 'Quận Thủ Đức', 'Thu Duc District', '02'),
('024', 'Quận Gò Vấp', 'Go Vap District', '02'),
('025', 'Quận Bình Thạnh', 'Binh Thanh District', '02'),
('026', 'Quận Tân Bình', 'Tan Binh District', '02'),
('027', 'Quận Tân Phú', 'Tan Phu District', '02'),
('028', 'Quận Phú Nhuận', 'Phu Nhuan District', '02'),
('029', 'Quận Bình Tân', 'Binh Tan District', '02'),
('030', 'Huyện Hóc Môn', 'Hoc Mon District', '02'),
('031', 'Huyện Củ Chi', 'Cu Chi District', '02'),
('032', 'Huyện Bình Chánh', 'Binh Chanh District', '02'),
('033', 'Huyện Nhà Bè', 'Nha Be District', '02'),
('034', 'Huyện Cần Giờ', 'Can Gio District', '02');
