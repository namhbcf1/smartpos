# 📊 DANH SÁCH ĐẦY ĐỦ CÁC BẢNG DATABASE SMARTPOS - CHI TIẾT

## 🔐 **1. USERS & AUTHENTICATION**

### 👤 **users** - Tài khoản người dùng
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | TEXT PK | Primary key |
| username | TEXT UNIQUE NOT NULL | Tên đăng nhập |
| email | TEXT UNIQUE NOT NULL | Email đăng nhập |
| password_hash | TEXT NOT NULL | Mật khẩu đã hash |
| full_name | TEXT NOT NULL | Họ tên đầy đủ |
| role | TEXT NOT NULL DEFAULT 'employee' | admin/manager/cashier/employee |
| is_active | INTEGER DEFAULT 1 | 0=vô hiệu, 1=hoạt động |
| last_login | TEXT | Lần đăng nhập cuối (ISO 8601) |
| created_at | TEXT DEFAULT (datetime('now')) | Ngày tạo |
| updated_at | TEXT DEFAULT (datetime('now')) | Ngày cập nhật |

### 🎭 **roles** - Vai trò hệ thống (Optional)
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | TEXT PK | Primary key |
| name | TEXT UNIQUE NOT NULL | Tên role |
| description | TEXT | Mô tả role |
| permissions | TEXT | JSON array permissions |
| is_active | INTEGER DEFAULT 1 | 0=vô hiệu, 1=hoạt động |
| created_at | TEXT DEFAULT (datetime('now')) | Ngày tạo |

### 🔗 **user_roles** - Mapping user-role
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| user_id | TEXT NOT NULL | FK → users.id |
| role_id | TEXT NOT NULL | FK → roles.id |
| assigned_at | TEXT DEFAULT (datetime('now')) | Ngày gán role |
| PRIMARY KEY | (user_id, role_id) | Composite key |

---

## 🏪 **2. STORES & BUSINESS**

### 🏢 **stores** - Thông tin cửa hàng
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | TEXT PK | Primary key |
| name | TEXT NOT NULL | Tên cửa hàng |
| address | TEXT NOT NULL | Địa chỉ |
| phone | TEXT NOT NULL | Số điện thoại |
| email | TEXT NOT NULL | Email liên hệ |
| tax_number | TEXT | Mã số thuế |
| business_license | TEXT | Giấy phép kinh doanh |
| logo_url | TEXT | URL logo (R2 storage) |
| timezone | TEXT DEFAULT 'Asia/Ho_Chi_Minh' | Múi giờ |
| currency | TEXT DEFAULT 'VND' | Đơn vị tiền tệ |
| is_active | INTEGER DEFAULT 1 | 0=vô hiệu, 1=hoạt động |
| created_at | TEXT DEFAULT (datetime('now')) | Ngày tạo |
| updated_at | TEXT DEFAULT (datetime('now')) | Ngày cập nhật |

---

## 📦 **3. PRODUCT MANAGEMENT**

### 📂 **categories** - Danh mục sản phẩm
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | TEXT PK | Primary key |
| name | TEXT NOT NULL | Tên danh mục |
| description | TEXT | Mô tả danh mục |
| parent_id | TEXT | FK → categories.id (nếu phân cấp) |
| image_url | TEXT | URL hình ảnh (R2 storage) |
| sort_order | INTEGER DEFAULT 0 | Thứ tự sắp xếp |
| is_active | INTEGER DEFAULT 1 | 0=vô hiệu, 1=hoạt động |
| created_at | TEXT DEFAULT (datetime('now')) | Ngày tạo |
| updated_at | TEXT DEFAULT (datetime('now')) | Ngày cập nhật |

### 🏷️ **brands** - Thương hiệu
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | TEXT PK | Primary key |
| name | TEXT NOT NULL | Tên thương hiệu |
| description | TEXT | Mô tả thương hiệu |
| website | TEXT | Website chính thức |
| logo_url | TEXT | URL logo (R2 storage) |
| is_active | INTEGER DEFAULT 1 | 0=vô hiệu, 1=hoạt động |
| created_at | TEXT DEFAULT (datetime('now')) | Ngày tạo |
| updated_at | TEXT DEFAULT (datetime('now')) | Ngày cập nhật |

### 🚛 **suppliers** - Nhà cung cấp
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | TEXT PK | Primary key |
| name | TEXT NOT NULL | Tên nhà cung cấp |
| contact_person | TEXT | Người liên hệ |
| email | TEXT | Email liên hệ |
| phone | TEXT | Số điện thoại |
| address | TEXT | Địa chỉ |
| tax_number | TEXT | Mã số thuế |
| payment_terms | TEXT | Điều kiện thanh toán |
| credit_limit_cents | INTEGER DEFAULT 0 | Hạn mức tín dụng (VND cents) |
| is_active | INTEGER DEFAULT 1 | 0=vô hiệu, 1=hoạt động |
| created_at | TEXT DEFAULT (datetime('now')) | Ngày tạo |
| updated_at | TEXT DEFAULT (datetime('now')) | Ngày cập nhật |

### 📦 **products** - Sản phẩm chính
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | TEXT PK | Primary key |
| name | TEXT NOT NULL | Tên sản phẩm |
| sku | TEXT UNIQUE NOT NULL | Mã SKU |
| barcode | TEXT UNIQUE | Mã vạch |
| description | TEXT | Mô tả sản phẩm |
| price_cents | INTEGER NOT NULL CHECK (price_cents >= 0) | Giá bán (VND x 100) |
| cost_price_cents | INTEGER NOT NULL CHECK (cost_price_cents >= 0) | Giá nhập (VND x 100) |
| stock | INTEGER DEFAULT 0 CHECK (stock >= 0) | Tồn kho hiện tại |
| min_stock | INTEGER DEFAULT 0 CHECK (min_stock >= 0) | Tồn kho tối thiểu |
| max_stock | INTEGER DEFAULT 1000 CHECK (max_stock >= min_stock) | Tồn kho tối đa |
| unit | TEXT DEFAULT 'piece' | Đơn vị tính |
| weight_grams | INTEGER | Trọng lượng (gram) |
| dimensions | TEXT | Kích thước JSON {"length":100,"width":50,"height":20} |
| category_id | TEXT | FK → categories.id |
| brand_id | TEXT | FK → brands.id |
| supplier_id | TEXT | FK → suppliers.id |
| store_id | TEXT DEFAULT 'store-1' | FK → stores.id |
| image_url | TEXT | URL hình chính (R2 storage) |
| images | TEXT | JSON array URLs hình phụ |
| is_active | INTEGER DEFAULT 1 | 0=vô hiệu, 1=hoạt động |
| is_serialized | INTEGER DEFAULT 0 | 0=không, 1=có serial number |
| category_name | TEXT | Denormalized từ categories.name |
| brand_name | TEXT | Denormalized từ brands.name |
| created_at | TEXT DEFAULT (datetime('now')) | Ngày tạo |
| updated_at | TEXT DEFAULT (datetime('now')) | Ngày cập nhật |

### 🎨 **product_variants** - Biến thể sản phẩm
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | TEXT PK | Primary key |
| product_id | TEXT NOT NULL | FK → products.id |
| variant_name | TEXT NOT NULL | Tên biến thể |
| sku | TEXT UNIQUE NOT NULL | Mã SKU riêng |
| price_cents | INTEGER NOT NULL CHECK (price_cents >= 0) | Giá bán (VND x 100) |
| cost_price_cents | INTEGER NOT NULL CHECK (cost_price_cents >= 0) | Giá nhập (VND x 100) |
| stock | INTEGER DEFAULT 0 CHECK (stock >= 0) | Tồn kho |
| attributes | TEXT | JSON {"color":"red","size":"L"} |
| is_active | INTEGER DEFAULT 1 | 0=vô hiệu, 1=hoạt động |
| created_at | TEXT DEFAULT (datetime('now')) | Ngày tạo |
| updated_at | TEXT DEFAULT (datetime('now')) | Ngày cập nhật |

### 🏷️ **serial_numbers** - Số serial bảo hành
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | TEXT PK | Primary key |
| product_id | TEXT NOT NULL | FK → products.id |
| variant_id | TEXT | FK → product_variants.id |
| serial_number | TEXT UNIQUE NOT NULL | Số serial |
| status | TEXT DEFAULT 'available' | available/sold/returned/defective |
| batch_number | TEXT | Số lô |
| purchase_date | TEXT | Ngày nhập (ISO 8601) |
| sale_date | TEXT | Ngày bán (ISO 8601) |
| customer_id | TEXT | FK → customers.id |
| warranty_start_date | TEXT | Ngày bắt đầu bảo hành |
| warranty_end_date | TEXT | Ngày kết thúc bảo hành |
| notes | TEXT | Ghi chú |
| created_at | TEXT DEFAULT (datetime('now')) | Ngày tạo |
| updated_at | TEXT DEFAULT (datetime('now')) | Ngày cập nhật |

---

## 👥 **4. CUSTOMERS & LOYALTY**

### 👤 **customers** - Khách hàng
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | TEXT PK | Primary key |
| name | TEXT NOT NULL | Họ tên khách hàng |
| email | TEXT | Email |
| phone | TEXT | Số điện thoại |
| address | TEXT | Địa chỉ |
| date_of_birth | TEXT | Ngày sinh (ISO 8601: '1990-05-15') |
| gender | TEXT | male/female/other |
| customer_type | TEXT DEFAULT 'regular' | regular/vip/wholesale |
| loyalty_points | INTEGER DEFAULT 0 CHECK (loyalty_points >= 0) | Điểm tích lũy |
| total_spent_cents | INTEGER DEFAULT 0 CHECK (total_spent_cents >= 0) | Tổng chi tiêu (VND x 100) |
| visit_count | INTEGER DEFAULT 0 CHECK (visit_count >= 0) | Số lần mua |
| last_visit | TEXT | Lần mua cuối (ISO 8601) |
| is_active | INTEGER DEFAULT 1 | 0=vô hiệu, 1=hoạt động |
| created_at | TEXT DEFAULT (datetime('now')) | Ngày tạo |
| updated_at | TEXT DEFAULT (datetime('now')) | Ngày cập nhật |

### 🎁 **loyalty_points_history** - Lịch sử điểm thưởng
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | TEXT PK | Primary key |
| customer_id | TEXT NOT NULL | FK → customers.id |
| points | INTEGER NOT NULL | Số điểm (+/-) |
| type | TEXT NOT NULL | earned/redeemed/expired/adjustment |
| reference_id | TEXT | order_id hoặc transaction_id |
| reference_type | TEXT | Loại reference |
| description | TEXT | Mô tả giao dịch |
| created_at | TEXT DEFAULT (datetime('now')) | Ngày tạo |

---

## 🛒 **5. ORDERS & SALES**

### 💳 **payment_methods** - Phương thức thanh toán
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | TEXT PK | Primary key |
| name | TEXT NOT NULL | Tên phương thức |
| code | TEXT UNIQUE NOT NULL | Mã code |
| description | TEXT | Mô tả |
| fee_percentage | REAL DEFAULT 0 | Phí xử lý (%) |
| is_active | INTEGER DEFAULT 1 | 0=vô hiệu, 1=hoạt động |
| created_at | TEXT DEFAULT (datetime('now')) | Ngày tạo |

### 🛒 **orders** - Đơn hàng/Hóa đơn
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | TEXT PK | Primary key |
| order_number | TEXT UNIQUE NOT NULL | Số đơn hàng |
| customer_id | TEXT | FK → customers.id |
| user_id | TEXT NOT NULL | FK → users.id (cashier) |
| store_id | TEXT NOT NULL | FK → stores.id |
| status | TEXT NOT NULL DEFAULT 'pending' | draft/pending/completed/cancelled/refunded |
| subtotal_cents | INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0) | Tạm tính (VND x 100) |
| discount_cents | INTEGER DEFAULT 0 CHECK (discount_cents >= 0) | Giảm giá (VND x 100) |
| tax_cents | INTEGER DEFAULT 0 CHECK (tax_cents >= 0) | Thuế (VND x 100) |
| total_cents | INTEGER NOT NULL DEFAULT 0 CHECK (total_cents >= 0) | Tổng cộng (VND x 100) |
| notes | TEXT | Ghi chú |
| receipt_printed | INTEGER DEFAULT 0 | 0=chưa in, 1=đã in |
| customer_name | TEXT | Denormalized từ customers.name |
| customer_phone | TEXT | Denormalized từ customers.phone |
| created_at | TEXT DEFAULT (datetime('now')) | Ngày tạo |
| updated_at | TEXT DEFAULT (datetime('now')) | Ngày cập nhật |

### 📋 **order_items** - Chi tiết đơn hàng
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | TEXT PK | Primary key |
| order_id | TEXT NOT NULL | FK → orders.id |
| product_id | TEXT NOT NULL | FK → products.id |
| variant_id | TEXT | FK → product_variants.id |
| quantity | INTEGER NOT NULL CHECK (quantity > 0) | Số lượng |
| unit_price_cents | INTEGER NOT NULL CHECK (unit_price_cents >= 0) | Đơn giá (VND x 100) |
| total_price_cents | INTEGER NOT NULL CHECK (total_price_cents >= 0) | Thành tiền (VND x 100) |
| discount_cents | INTEGER DEFAULT 0 CHECK (discount_cents >= 0) | Giảm giá (VND x 100) |
| product_name | TEXT | Denormalized từ products.name |
| product_sku | TEXT | Denormalized từ products.sku |
| created_at | TEXT DEFAULT (datetime('now')) | Ngày tạo |

### 💰 **payments** - Thanh toán
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | TEXT PK | Primary key |
| order_id | TEXT NOT NULL | FK → orders.id |
| payment_method_id | TEXT NOT NULL | FK → payment_methods.id |
| amount_cents | INTEGER NOT NULL CHECK (amount_cents > 0) | Số tiền (VND x 100) |
| reference | TEXT | Mã giao dịch từ gateway |
| status | TEXT NOT NULL DEFAULT 'completed' | pending/completed/failed/refunded |
| processed_at | TEXT DEFAULT (datetime('now')) | Thời gian xử lý |
| created_at | TEXT DEFAULT (datetime('now')) | Ngày tạo |

---

## 📊 **6. INVENTORY MANAGEMENT**

### 📦 **inventory_movements** - Xuất nhập kho
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | TEXT PK | Primary key |
| product_id | TEXT NOT NULL | FK → products.id |
| variant_id | TEXT | FK → product_variants.id |
| transaction_type | TEXT NOT NULL | in/out/adjustment/transfer |
| quantity | INTEGER NOT NULL | Số lượng (+/-) |
| unit_cost_cents | INTEGER | Giá nhập/xuất per unit (VND x 100) |
| reference_id | TEXT | order_id, purchase_id, etc. |
| reference_type | TEXT | order/purchase/adjustment/transfer |
| reason | TEXT | Lý do |
| notes | TEXT | Ghi chú |
| user_id | TEXT | FK → users.id |
| store_id | TEXT | FK → stores.id |
| product_name | TEXT | Denormalized từ products.name |
| product_sku | TEXT | Denormalized từ products.sku |
| created_at | TEXT DEFAULT (datetime('now')) | Ngày tạo |

### 📋 **stock_check_sessions** - Phiên kiểm kê
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | TEXT PK | Primary key |
| session_name | TEXT NOT NULL | Tên phiên kiểm kê |
| status | TEXT NOT NULL DEFAULT 'in_progress' | in_progress/completed/cancelled |
| store_id | TEXT | FK → stores.id |
| started_at | TEXT DEFAULT (datetime('now')) | Thời gian bắt đầu |
| ended_at | TEXT | Thời gian kết thúc |
| items_count | INTEGER DEFAULT 0 | Tổng số items |
| items_checked | INTEGER DEFAULT 0 | Số items đã kiểm |
| discrepancies_found | INTEGER DEFAULT 0 | Số chênh lệch tìm thấy |
| created_by | TEXT | FK → users.id |
| notes | TEXT | Ghi chú |
| created_at | TEXT DEFAULT (datetime('now')) | Ngày tạo |
| updated_at | TEXT DEFAULT (datetime('now')) | Ngày cập nhật |

### 📝 **stock_check_items** - Chi tiết kiểm kê
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | TEXT PK | Primary key |
| session_id | TEXT NOT NULL | FK → stock_check_sessions.id |
| product_id | TEXT NOT NULL | FK → products.id |
| variant_id | TEXT | FK → product_variants.id |
| expected_quantity | INTEGER NOT NULL DEFAULT 0 | Số lượng dự kiến |
| actual_quantity | INTEGER | Số lượng thực tế |
| discrepancy | INTEGER DEFAULT 0 | Chênh lệch |
| notes | TEXT | Ghi chú |
| checked_at | TEXT | Thời gian kiểm tra |
| created_at | TEXT DEFAULT (datetime('now')) | Ngày tạo |
| updated_at | TEXT DEFAULT (datetime('now')) | Ngày cập nhật |

---

## 🎯 **7. PROMOTIONS & MARKETING**

### 🏷️ **promotions** - Khuyến mãi
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | TEXT PK | Primary key |
| name | TEXT NOT NULL | Tên chương trình |
| description | TEXT | Mô tả |
| type | TEXT NOT NULL | percentage/fixed_amount/buy_x_get_y |
| value_cents | INTEGER NOT NULL CHECK (value_cents >= 0) | Giá trị (VND x 100 cho fixed_amount) |
| value_percentage | REAL | Giá trị % (0-100 cho percentage) |
| min_amount_cents | INTEGER DEFAULT 0 CHECK (min_amount_cents >= 0) | Giá trị tối thiểu (VND x 100) |
| max_discount_cents | INTEGER | Giảm tối đa (VND x 100) |
| start_date | TEXT | Ngày bắt đầu (ISO 8601) |
| end_date | TEXT | Ngày kết thúc (ISO 8601) |
| usage_limit | INTEGER | Giới hạn sử dụng |
| usage_count | INTEGER DEFAULT 0 | Số lần đã dùng |
| applicable_to | TEXT DEFAULT 'all' | all/categories/products/customers |
| conditions | TEXT | JSON điều kiện phức tạp |
| is_active | INTEGER DEFAULT 1 | 0=vô hiệu, 1=hoạt động |
| created_at | TEXT DEFAULT (datetime('now')) | Ngày tạo |
| updated_at | TEXT DEFAULT (datetime('now')) | Ngày cập nhật |

### 📊 **promotion_usage** - Lịch sử sử dụng khuyến mãi
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | TEXT PK | Primary key |
| promotion_id | TEXT NOT NULL | FK → promotions.id |
| order_id | TEXT NOT NULL | FK → orders.id |
| customer_id | TEXT | FK → customers.id |
| discount_cents | INTEGER NOT NULL CHECK (discount_cents >= 0) | Số tiền giảm (VND x 100) |
| used_at | TEXT DEFAULT (datetime('now')) | Thời gian sử dụng |

---

## 💰 **8. TAX & FINANCE**

### 🧾 **tax_rates** - Thuế
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | TEXT PK | Primary key |
| name | TEXT NOT NULL | Tên loại thuế |
| rate_percentage | REAL NOT NULL CHECK (rate_percentage >= 0 AND rate_percentage <= 100) | Thuế suất (%) |
| description | TEXT | Mô tả |
| is_active | INTEGER DEFAULT 1 | 0=vô hiệu, 1=hoạt động |
| created_at | TEXT DEFAULT (datetime('now')) | Ngày tạo |
| updated_at | TEXT DEFAULT (datetime('now')) | Ngày cập nhật |

---

## ⚙️ **9. SYSTEM & CONFIGURATION**

### 🔧 **settings** - Cài đặt hệ thống
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | TEXT PK | Primary key |
| key | TEXT UNIQUE NOT NULL | Khóa setting |
| value | TEXT NOT NULL | Giá trị |
| description | TEXT | Mô tả |
| category | TEXT DEFAULT 'general' | Nhóm setting |
| data_type | TEXT DEFAULT 'string' | string/number/boolean/json |
| is_public | INTEGER DEFAULT 0 | 0=admin only, 1=public |
| created_at | TEXT DEFAULT (datetime('now')) | Ngày tạo |
| updated_at | TEXT DEFAULT (datetime('now')) | Ngày cập nhật |

### 🔐 **user_sessions** - Phiên đăng nhập
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | TEXT PK | Primary key |
| user_id | TEXT NOT NULL | FK → users.id |
| token_hash | TEXT UNIQUE NOT NULL | Hash của token |
| device_info | TEXT | JSON thông tin device |
| ip_address | TEXT | Địa chỉ IP |
| expires_at | TEXT NOT NULL | Thời gian hết hạn (ISO 8601) |
| last_activity | TEXT DEFAULT (datetime('now')) | Hoạt động cuối |
| created_at | TEXT DEFAULT (datetime('now')) | Ngày tạo |

---

## 📝 **10. AUDIT & LOGGING**

### 📋 **audit_logs** - Log audit
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | TEXT PK | Primary key |
| user_id | TEXT | FK → users.id |
| action | TEXT NOT NULL | Hành động |
| table_name | TEXT | Tên bảng |
| record_id | TEXT | ID bản ghi |
| old_values | TEXT | Giá trị cũ (JSON) |
| new_values | TEXT | Giá trị mới (JSON) |
| ip_address | TEXT | Địa chỉ IP |
| user_agent | TEXT | User agent |
| created_at | TEXT DEFAULT (datetime('now')) | Ngày tạo |

---

## 👁️ **11. PERFORMANCE VIEWS**

### 📊 **v_products_summary** - Tổng hợp sản phẩm
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | TEXT | Product ID |
| name | TEXT | Tên sản phẩm |
| sku | TEXT | Mã SKU |
| barcode | TEXT | Mã vạch |
| price_cents | INTEGER | Giá bán (VND x 100) |
| cost_price_cents | INTEGER | Giá nhập (VND x 100) |
| stock | INTEGER | Tồn kho |
| min_stock | INTEGER | Tồn kho tối thiểu |
| category_name | TEXT | Tên danh mục (denormalized) |
| brand_name | TEXT | Tên thương hiệu (denormalized) |
| is_active | INTEGER | Trạng thái |
| category_full_name | TEXT | Tên danh mục đầy đủ |
| brand_full_name | TEXT | Tên thương hiệu đầy đủ |
| supplier_name | TEXT | Tên nhà cung cấp |

### 🧾 **v_orders_summary** - Tổng hợp đơn hàng
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | TEXT | Order ID |
| order_number | TEXT | Số đơn hàng |
| customer_name | TEXT | Tên khách hàng (denormalized) |
| customer_phone | TEXT | SĐT khách hàng (denormalized) |
| total_cents | INTEGER | Tổng tiền (VND x 100) |
| status | TEXT | Trạng thái đơn hàng |
| created_at | TEXT | Ngày tạo |
| cashier_name | TEXT | Tên thu ngân |
| store_name | TEXT | Tên cửa hàng |

---

## ⚡ **12. DATABASE TRIGGERS**

### 🔄 **update_stock_on_inventory_movement**
- **Trigger**: AFTER INSERT ON inventory_movements
- **Chức năng**: Tự động cập nhật stock trong bảng products và product_variants

### 👤 **update_customer_stats_on_order**
- **Trigger**: AFTER UPDATE ON orders
- **Chức năng**: Cập nhật total_spent_cents, visit_count, last_visit khi đơn hàng completed

### 🔢 **generate_order_number**
- **Trigger**: AFTER INSERT ON orders
- **Chức năng**: Tự động tạo order_number theo format 'ORD-YYYYMMDD-XXXXXX'

### ⚡ **update_product_denormalized_fields**
- **Trigger**: AFTER UPDATE ON products
- **Chức năng**: Cập nhật category_name, brand_name khi category_id hoặc brand_id thay đổi

---

## 📊 **TỔNG KẾT**

### 📈 **Thống kê cơ sở dữ liệu:**
- **20 bảng chính** với đầy đủ chức năng POS
- **2 performance views** cho báo cáo nhanh
- **4 triggers** tự động xử lý dữ liệu
- **30+ indexes** tối ưu hiệu năng
- **Foreign keys** đầy đủ đảm bảo tính toàn vẹn
- **CHECK constraints** validate dữ liệu

### 💰 **Chiến lược giá cả:**
- **Tất cả giá tiền** lưu bằng **INTEGER cents**
- **50,000 VND** = **5,000,000 cents**
- **Độ chính xác 100%**, không mất precision

### ⚡ **Tối ưu hiệu năng:**
- **Denormalized fields** giảm JOIN queries
- **Strategic indexes** cho các truy vấn thường xuyên
- **Composite indexes** cho queries phức tạp
- **Views** sẵn sàng cho reporting

### 🚀 **D1 Ready:**
- **SQLite syntax** 100% tương thích
- **Serverless optimized** cho Cloudflare D1
- **Global replication** ready
- **Production deployment** sẵn sàng

**✅ Cơ sở dữ liệu hoàn chỉnh, chi tiết, production-ready cho SmartPOS!**