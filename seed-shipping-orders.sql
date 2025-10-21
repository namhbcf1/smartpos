-- Seed shipping orders data for testing
-- Insert sample GHTK orders into shipping_orders table

INSERT INTO shipping_orders (
  id, tenant_id, order_id, carrier, carrier_order_code, status,
  fee_amount, service, payload, response, created_by, created_at, updated_at
) VALUES
-- Order 1: Pending
(
  'ship-001', 'default', 'ORD-20250114001', 'ghtk', 'S12345678.A01', 'pending',
  35000, 'road',
  json('{"order": {"id": "ORD-20250114001", "name": "Nguyễn Văn A", "tel": "0912345678", "address": "123 Nguyễn Huệ", "province": "Hà Nội", "district": "Hai Bà Trưng", "ward": "Bạch Đằng", "pick_name": "nam", "pick_tel": "0836768597", "pick_address": "415 Trần Hưng Đạo", "pick_province": "Hòa Bình", "pick_district": "Hòa Bình", "value": 1500000, "weight": 1200, "transport": "road"}}'),
  json('{"order": {"label": "S12345678.A01", "partner_id": "ORD-20250114001", "status": 1, "status_text": "Chờ lấy hàng", "created": "2025-01-14T08:00:00Z"}}'),
  'admin', datetime('now', '-3 days'), datetime('now', '-3 days')
),

-- Order 2: In Transit
(
  'ship-002', 'default', 'ORD-20250114002', 'ghtk', 'S12345679.A02', 'in_transit',
  42000, 'road',
  json('{"order": {"id": "ORD-20250114002", "name": "Trần Thị B", "tel": "0923456789", "address": "456 Lê Lợi", "province": "Hồ Chí Minh", "district": "Quận 1", "ward": "Bến Nghé", "pick_name": "nam", "pick_tel": "0836768597", "pick_address": "415 Trần Hưng Đạo", "pick_province": "Hòa Bình", "pick_district": "Hòa Bình", "value": 2500000, "weight": 1500, "transport": "road"}}'),
  json('{"order": {"label": "S12345679.A02", "partner_id": "ORD-20250114002", "status": 3, "status_text": "Đang giao", "created": "2025-01-14T09:30:00Z"}}'),
  'admin', datetime('now', '-2 days'), datetime('now', '-1 hour')
),

-- Order 3: Delivered
(
  'ship-003', 'default', 'ORD-20250114003', 'ghtk', 'S12345680.A03', 'delivered',
  38000, 'road',
  json('{"order": {"id": "ORD-20250114003", "name": "Lê Văn C", "tel": "0934567890", "address": "789 Trần Phú", "province": "Đà Nẵng", "district": "Hải Châu", "ward": "Hải Châu 1", "pick_name": "nam", "pick_tel": "0836768597", "pick_address": "415 Trần Hưng Đạo", "pick_province": "Hòa Bình", "pick_district": "Hòa Bình", "value": 1800000, "weight": 1000, "transport": "road"}}'),
  json('{"order": {"label": "S12345680.A03", "partner_id": "ORD-20250114003", "status": 5, "status_text": "Đã giao", "created": "2025-01-14T07:00:00Z", "deliver_date": "2025-01-15T14:30:00Z"}}'),
  'admin', datetime('now', '-5 days'), datetime('now', '-2 days')
),

-- Order 4: Picking
(
  'ship-004', 'default', 'ORD-20250114004', 'ghtk', 'S12345681.A04', 'picking',
  45000, 'road',
  json('{"order": {"id": "ORD-20250114004", "name": "Phạm Thị D", "tel": "0945678901", "address": "321 Võ Văn Tần", "province": "Hồ Chí Minh", "district": "Quận 3", "ward": "Võ Thị Sáu", "pick_name": "nam", "pick_tel": "0836768597", "pick_address": "415 Trần Hưng Đạo", "pick_province": "Hòa Bình", "pick_district": "Hòa Bình", "value": 3200000, "weight": 2000, "transport": "road"}}'),
  json('{"order": {"label": "S12345681.A04", "partner_id": "ORD-20250114004", "status": 2, "status_text": "Đang lấy hàng", "created": "2025-01-14T10:00:00Z"}}'),
  'admin', datetime('now', '-1 day'), datetime('now', '-3 hours')
),

-- Order 5: Cancelled
(
  'ship-005', 'default', 'ORD-20250114005', 'ghtk', 'S12345682.A05', 'cancelled',
  40000, 'road',
  json('{"order": {"id": "ORD-20250114005", "name": "Hoàng Văn E", "tel": "0956789012", "address": "654 Lý Thường Kiệt", "province": "Hà Nội", "district": "Đống Đa", "ward": "Ô Chợ Dừa", "pick_name": "nam", "pick_tel": "0836768597", "pick_address": "415 Trần Hưng Đạo", "pick_province": "Hòa Bình", "pick_district": "Hòa Bình", "value": 2000000, "weight": 1300, "transport": "road"}}'),
  json('{"order": {"label": "S12345682.A05", "partner_id": "ORD-20250114005", "status": -1, "status_text": "Đã hủy", "created": "2025-01-14T11:00:00Z", "cancel_reason": "Khách hàng yêu cầu hủy"}}'),
  'admin', datetime('now', '-4 days'), datetime('now', '-3 days')
),

-- Order 6: Pending
(
  'ship-006', 'default', 'ORD-20250114006', 'ghtk', 'S12345683.A06', 'pending',
  36000, 'road',
  json('{"order": {"id": "ORD-20250114006", "name": "Đỗ Thị F", "tel": "0967890123", "address": "147 Pasteur", "province": "Hồ Chí Minh", "district": "Quận 3", "ward": "Phường 6", "pick_name": "nam", "pick_tel": "0836768597", "pick_address": "415 Trần Hưng Đạo", "pick_province": "Hòa Bình", "pick_district": "Hòa Bình", "value": 1200000, "weight": 800, "transport": "road"}}'),
  json('{"order": {"label": "S12345683.A06", "partner_id": "ORD-20250114006", "status": 1, "status_text": "Chờ lấy hàng", "created": "2025-01-14T12:00:00Z"}}'),
  'admin', datetime('now', '-1 day'), datetime('now', '-1 day')
),

-- Order 7: In Transit
(
  'ship-007', 'default', 'ORD-20250114007', 'ghtk', 'S12345684.A07', 'in_transit',
  50000, 'fly',
  json('{"order": {"id": "ORD-20250114007", "name": "Vũ Văn G", "tel": "0978901234", "address": "258 Trường Chinh", "province": "Hà Nội", "district": "Thanh Xuân", "ward": "Khương Thượng", "pick_name": "nam", "pick_tel": "0836768597", "pick_address": "415 Trần Hưng Đạo", "pick_province": "Hòa Bình", "pick_district": "Hòa Bình", "value": 4500000, "weight": 2500, "transport": "fly"}}'),
  json('{"order": {"label": "S12345684.A07", "partner_id": "ORD-20250114007", "status": 3, "status_text": "Đang giao", "created": "2025-01-14T13:00:00Z"}}'),
  'admin', datetime('now', '-2 hours'), datetime('now', '-30 minutes')
),

-- Order 8: Delivered
(
  'ship-008', 'default', 'ORD-20250114008', 'ghtk', 'S12345685.A08', 'delivered',
  37000, 'road',
  json('{"order": {"id": "ORD-20250114008", "name": "Bùi Thị H", "tel": "0989012345", "address": "369 Cầu Giấy", "province": "Hà Nội", "district": "Cầu Giấy", "ward": "Dịch Vọng", "pick_name": "nam", "pick_tel": "0836768597", "pick_address": "415 Trần Hưng Đạo", "pick_province": "Hòa Bình", "pick_district": "Hòa Bình", "value": 1600000, "weight": 900, "transport": "road"}}'),
  json('{"order": {"label": "S12345685.A08", "partner_id": "ORD-20250114008", "status": 5, "status_text": "Đã giao", "created": "2025-01-14T06:00:00Z", "deliver_date": "2025-01-15T10:00:00Z"}}'),
  'admin', datetime('now', '-6 days'), datetime('now', '-4 days')
),

-- Order 9: Pending
(
  'ship-009', 'default', 'ORD-20250114009', 'ghtk', 'S12345686.A09', 'pending',
  33000, 'road',
  json('{"order": {"id": "ORD-20250114009", "name": "Ngô Văn I", "tel": "0990123456", "address": "147 Đinh Tiên Hoàng", "province": "Hà Nội", "district": "Hoàn Kiếm", "ward": "Hàng Trống", "pick_name": "nam", "pick_tel": "0836768597", "pick_address": "415 Trần Hưng Đạo", "pick_province": "Hòa Bình", "pick_district": "Hòa Bình", "value": 980000, "weight": 600, "transport": "road"}}'),
  json('{"order": {"label": "S12345686.A09", "partner_id": "ORD-20250114009", "status": 1, "status_text": "Chờ lấy hàng", "created": "2025-01-14T14:00:00Z"}}'),
  'admin', datetime('now', '-6 hours'), datetime('now', '-6 hours')
),

-- Order 10: In Transit
(
  'ship-010', 'default', 'ORD-20250114010', 'ghtk', 'S12345687.A10', 'in_transit',
  48000, 'road',
  json('{"order": {"id": "ORD-20250114010", "name": "Phan Thị K", "tel": "0901234567", "address": "258 Nguyễn Thị Minh Khai", "province": "Hồ Chí Minh", "district": "Quận 1", "ward": "Bến Thành", "pick_name": "nam", "pick_tel": "0836768597", "pick_address": "415 Trần Hưng Đạo", "pick_province": "Hòa Bình", "pick_district": "Hòa Bình", "value": 3800000, "weight": 1800, "transport": "road"}}'),
  json('{"order": {"label": "S12345687.A10", "partner_id": "ORD-20250114010", "status": 3, "status_text": "Đang giao", "created": "2025-01-14T08:30:00Z"}}'),
  'admin', datetime('now', '-12 hours'), datetime('now', '-2 hours')
);

-- Insert shipping events for some orders
INSERT INTO shipping_events (
  id, tenant_id, shipping_order_id, carrier, carrier_order_code,
  event_type, event_time, raw_event, created_at
) VALUES
-- Events for Order 2 (In Transit)
('event-001', 'default', 'ship-002', 'ghtk', 'S12345679.A02',
 'picking', '2025-01-14T09:30:00Z',
 json('{"status": 2, "status_text": "Đang lấy hàng", "time": "2025-01-14T09:30:00Z"}'),
 datetime('now', '-2 days')),

('event-002', 'default', 'ship-002', 'ghtk', 'S12345679.A02',
 'picked', '2025-01-14T11:00:00Z',
 json('{"status": 2.5, "status_text": "Đã lấy hàng", "time": "2025-01-14T11:00:00Z"}'),
 datetime('now', '-2 days')),

('event-003', 'default', 'ship-002', 'ghtk', 'S12345679.A02',
 'in_transit', '2025-01-14T14:00:00Z',
 json('{"status": 3, "status_text": "Đang vận chuyển", "time": "2025-01-14T14:00:00Z", "location": "Bưu cục Hà Nội"}'),
 datetime('now', '-1 day')),

-- Events for Order 3 (Delivered)
('event-004', 'default', 'ship-003', 'ghtk', 'S12345680.A03',
 'delivered', '2025-01-15T14:30:00Z',
 json('{"status": 5, "status_text": "Giao hàng thành công", "time": "2025-01-15T14:30:00Z", "received_by": "Lê Văn C"}'),
 datetime('now', '-2 days'));
