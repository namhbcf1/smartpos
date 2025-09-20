# SmartPOS API Documentation

## Tổng quan
SmartPOS là hệ thống quản lý bán hàng toàn diện với API RESTful được xây dựng trên Cloudflare Workers và D1 Database.

**Base URL:** `https://namhbcf-api.bangachieu2.workers.dev/api/v1`

## Authentication
Tất cả API endpoints (trừ login) yêu cầu JWT token trong header:
```
Authorization: Bearer <jwt_token>
```

## 1. AUTHENTICATION API

### 1.1 Login
**POST** `/auth/login`
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1",
      "username": "admin",
      "email": "admin@smartpos.vn",
      "full_name": "Administrator",
      "role": "admin",
      "store_id": 1
    },
    "token": "jwt_token_here",
    "session_id": "sess_123456"
  },
  "message": "Login successful"
}
```

### 1.2 Logout
**POST** `/auth/logout`

### 1.3 Get Current User
**GET** `/auth/me`

### 1.4 Register User (Admin only)
**POST** `/auth/register`
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "full_name": "New User",
  "role": "staff",
  "store_id": 1
}
```

## 2. PRODUCTS API

### 2.1 List Products
**GET** `/products`
**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 50)
- `search` - Tìm kiếm theo tên, SKU, barcode
- `category_id` - Lọc theo danh mục
- `brand_id` - Lọc theo thương hiệu
- `status` - active/inactive
- `low_stock` - true/false
- `sort_by` - name, sku, price_cents, stock, created_at
- `sort_order` - asc/desc

### 2.2 Create Product
**POST** `/products`
```json
{
  "name": "iPhone 15 Pro",
  "description": "Latest iPhone model",
  "sku": "IP15P-256",
  "barcode": "1234567890123",
  "category_id": "cat-001",
  "brand_id": "brand-001",
  "price_cents": 25000000,
  "cost_price_cents": 20000000,
  "stock": 50,
  "min_stock": 10,
  "max_stock": 100,
  "unit": "piece",
  "weight_grams": 200,
  "is_serialized": false
}
```

### 2.3 Get Product Detail
**GET** `/products/:id`

### 2.4 Update Product
**PUT** `/products/:id`

### 2.5 Delete Product
**DELETE** `/products/:id`

## 3. CUSTOMERS API

### 3.1 List Customers
**GET** `/customers`
**Query Parameters:**
- `q` - Tìm kiếm theo tên, phone, email
- `page` (default: 1)
- `limit` (default: 50)

### 3.2 Create Customer
**POST** `/customers`
```json
{
  "name": "Nguyễn Văn A",
  "email": "nguyenvana@email.com",
  "phone": "0901234567",
  "address": "123 Nguyễn Huệ, Q1, TP.HCM",
  "date_of_birth": "1990-01-15",
  "gender": "male",
  "customer_type": "regular"
}
```

### 3.3 Get Customer Detail
**GET** `/customers/:id`

### 3.4 Update Customer
**PUT** `/customers/:id`

### 3.5 Delete Customer
**DELETE** `/customers/:id`

### 3.6 Customer Tiers
**GET** `/customers/tiers`

### 3.7 Customer Interactions
**GET** `/customers/interactions`
**POST** `/customers/interactions`

### 3.8 Customer Points
**POST** `/customers/:id/points/earn`
**POST** `/customers/:id/points/redeem`

## 4. SALES API

### 4.1 List Sales
**GET** `/sales`
**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 50)
- `from` - Ngày bắt đầu (YYYY-MM-DD)
- `to` - Ngày kết thúc (YYYY-MM-DD)
- `status` - Trạng thái đơn hàng

### 4.2 Sales Summary
**GET** `/sales/summary`

### 4.3 Get Sale Detail
**GET** `/sales/:id`

### 4.4 Create Sale
**POST** `/sales`
```json
{
  "customer_id": "cust-001",
  "customer_name": "Nguyễn Văn A",
  "customer_phone": "0901234567",
  "items": [
    {
      "product_id": "prod-001",
      "product_name": "iPhone 15 Pro",
      "quantity": 1,
      "unit_price": 25000000,
      "discount_amount": 0,
      "tax_amount": 2500000
    }
  ],
  "payment_method": "cash",
  "notes": "Giao hàng tận nơi"
}
```

### 4.5 Sales Statistics
**GET** `/sales/stats`

## 5. POS (Point of Sale) API

### 5.1 POS Dashboard
**GET** `/pos/dashboard`

### 5.2 Park Cart
**POST** `/pos/park`
```json
{
  "cart_data": {
    "items": [...],
    "customer": {...},
    "totals": {...}
  }
}
```

### 5.3 Resume Cart
**POST** `/pos/resume`
```json
{
  "cart_id": "cart-123"
}
```

### 5.4 List Parked Carts
**GET** `/pos/parked-carts`

### 5.5 Delete Parked Cart
**DELETE** `/pos/parked-carts/:id`

### 5.6 Quick Sale
**POST** `/pos/quick-sale`
```json
{
  "items": [
    {
      "product_id": "prod-001",
      "product_name": "iPhone 15 Pro",
      "quantity": 1,
      "unit_price": 25000000
    }
  ],
  "payment": {
    "method": "cash",
    "amount": 25000000
  },
  "discount": 0,
  "tax": 0
}
```

### 5.7 POS Orders
**GET** `/pos/orders`
**POST** `/pos/orders`
**GET** `/pos/orders/:id`
**PUT** `/pos/orders/:id/hold`
**PUT** `/pos/orders/:id/resume`
**POST** `/pos/orders/:id/payment`

### 5.8 POS Sessions
**POST** `/pos/sessions/open`
**POST** `/pos/sessions/close`
**POST** `/pos/end-of-day`

## 6. INVENTORY API

### 6.1 Inventory Overview
**GET** `/inventory`
**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 50)
- `low_stock` - true/false

### 6.2 Inventory Statistics
**GET** `/inventory/stats`

### 6.3 Inventory Summary
**GET** `/inventory/summary`

### 6.4 Stock Levels
**GET** `/inventory/stock`

### 6.5 Low Stock Products
**GET** `/inventory/low-stock`

### 6.6 Inventory Movements
**GET** `/inventory/movements`
**GET** `/inventory/:productId/movements`

### 6.7 Adjust Inventory
**POST** `/inventory/:productId/adjust`
```json
{
  "quantity": 10,
  "type": "in",
  "notes": "Nhập hàng từ nhà cung cấp"
}
```

### 6.8 Inventory Alerts
**GET** `/inventory/alerts`
**POST** `/inventory/alerts`
**PUT** `/inventory/alerts/:id`
**DELETE** `/inventory/alerts/:id`

### 6.9 Warehouse Locations
**GET** `/inventory/locations`
**POST** `/inventory/locations`
**PUT** `/inventory/locations/:id`
**DELETE** `/inventory/locations/:id`

### 6.10 Inventory Transfers
**POST** `/inventory/transfers`
**GET** `/inventory/transfers`
**GET** `/inventory/transfers/:id`

### 6.11 Cycle Counting
**POST** `/inventory/cycle-counting/start`
**POST** `/inventory/cycle-counting/record`
**POST** `/inventory/cycle-counting/commit`

### 6.12 Inventory Audit
**GET** `/inventory/audit`

### 6.13 Bulk Update
**POST** `/inventory/bulk-update`

### 6.14 Export/Import
**GET** `/inventory/export/csv`
**POST** `/inventory/import/csv`

## 7. ANALYTICS API

### 7.1 Dashboard Analytics
**GET** `/analytics`

### 7.2 Sales Analytics
**GET** `/analytics/sales`
**Query Parameters:**
- `period` (default: 30) - Số ngày

### 7.3 Product Analytics
**GET** `/analytics/products`

### 7.4 Customer Analytics
**GET** `/analytics/customers`

### 7.5 Dashboard Data
**GET** `/analytics/dashboard`

## 8. REPORTS API

### 8.1 Basic Reports
**GET** `/reports/basic`

### 8.2 Sales Summary Report
**GET** `/reports/sales-summary`
**Query Parameters:**
- `from` - Ngày bắt đầu
- `to` - Ngày kết thúc
- `groupBy` - day/week/month

### 8.3 Top Products Report
**GET** `/reports/top-products`
**Query Parameters:**
- `from`, `to`, `limit` (default: 20)
- `metric` - quantity/revenue/orders

### 8.4 Customer Analysis Report
**GET** `/reports/customer-analysis`

### 8.5 Dashboard Report
**GET** `/reports/dashboard`

### 8.6 Inventory Report
**GET** `/reports/inventory`

### 8.7 Performance Report
**GET** `/reports/performance`

### 8.8 Sales Report
**GET** `/reports/sales`

### 8.9 Customers Report
**GET** `/reports/customers`

### 8.10 Financial Report
**GET** `/reports/financial`

### 8.11 VAT Report
**GET** `/reports/vat`

### 8.12 Profit Report
**GET** `/reports/profit`

### 8.13 Export Reports
**GET** `/reports/export`
**Query Parameters:**
- `type` - csv/pdf
- `report` - sales/products
- `from`, `to`

## 9. SETTINGS API

### 9.1 Store Settings
**GET** `/settings/store`
**PUT** `/settings/store`

### 9.2 Payment Methods
**GET** `/settings/payment-methods`
**PUT** `/settings/payment-methods`

### 9.3 Tax Settings
**GET** `/settings/tax`
**PUT** `/settings/tax`

### 9.4 Inventory Settings
**GET** `/settings/inventory`
**PUT** `/settings/inventory`

### 9.5 POS Settings
**GET** `/settings/pos`
**PUT** `/settings/pos`

### 9.6 Backup Settings
**GET** `/settings/backup`
**PUT** `/settings/backup`
**POST** `/settings/backup/create`

### 9.7 All Settings
**GET** `/settings/all`

## 10. USERS API

### 10.1 List Users (Admin only)
**GET** `/users`

### 10.2 Update User Role (Admin only)
**PUT** `/users/:id/role`

### 10.3 Deactivate User (Admin only)
**PUT** `/users/:id/deactivate`

## 11. PAYMENT METHODS API

### 11.1 List Payment Methods
**GET** `/payment-methods`

### 11.2 Create Payment Method
**POST** `/payment-methods`
```json
{
  "name": "Tiền mặt",
  "code": "CASH",
  "description": "Thanh toán bằng tiền mặt",
  "fee_percentage": 0,
  "is_active": true
}
```

### 11.3 Update Payment Method
**PUT** `/payment-methods/:id`

### 11.4 Delete Payment Method
**DELETE** `/payment-methods/:id`

## 12. CATEGORIES API

### 12.1 List Categories
**GET** `/categories`

### 12.2 Create Category
**POST** `/categories`

### 12.3 Update Category
**PUT** `/categories/:id`

### 12.4 Delete Category
**DELETE** `/categories/:id`

## 13. BRANDS API

### 13.1 List Brands
**GET** `/brands`

### 13.2 Create Brand
**POST** `/brands`

### 13.3 Update Brand
**PUT** `/brands/:id`

### 13.4 Delete Brand
**DELETE** `/brands/:id`

## 14. SUPPLIERS API

### 14.1 List Suppliers
**GET** `/suppliers`

### 14.2 Create Supplier
**POST** `/suppliers`

### 14.3 Update Supplier
**PUT** `/suppliers/:id`

### 14.4 Delete Supplier
**DELETE** `/suppliers/:id`

## 15. ORDERS API

### 15.1 List Orders
**GET** `/orders`

### 15.2 Create Order
**POST** `/orders`

### 15.3 Get Order Detail
**GET** `/orders/:id`

### 15.4 Update Order
**PUT** `/orders/:id`

### 15.5 Cancel Order
**DELETE** `/orders/:id`

## 16. PAYMENTS API

### 16.1 List Payments
**GET** `/payments`

### 16.2 Create Payment
**POST** `/payments`

### 16.3 Get Payment Detail
**GET** `/payments/:id`

### 16.4 Update Payment
**PUT** `/payments/:id`

## 17. SHIPPING API

### 17.1 List Shipping Methods
**GET** `/shipping/methods`

### 17.2 Calculate Shipping
**POST** `/shipping/calculate`

### 17.3 Create Shipment
**POST** `/shipping/shipments`

## 18. FINANCIAL API

### 18.1 Financial Overview
**GET** `/financial/overview`

### 18.2 Revenue Report
**GET** `/financial/revenue`

### 18.3 Expense Report
**GET** `/financial/expenses`

### 18.4 Profit & Loss
**GET** `/financial/profit-loss`

## 19. NOTIFICATIONS API

### 19.1 List Notifications
**GET** `/notifications`

### 19.2 Mark as Read
**PUT** `/notifications/:id/read`

### 19.3 Mark All as Read
**PUT** `/notifications/read-all`

## 20. TASKS API

### 20.1 List Tasks
**GET** `/tasks`

### 20.2 Create Task
**POST** `/tasks`

### 20.3 Update Task
**PUT** `/tasks/:id`

### 20.4 Complete Task
**PUT** `/tasks/:id/complete`

## 21. VOUCHERS API

### 21.1 List Vouchers
**GET** `/vouchers`

### 21.2 Create Voucher
**POST** `/vouchers`

### 21.3 Validate Voucher
**POST** `/vouchers/validate`

### 21.4 Use Voucher
**POST** `/vouchers/:id/use`

## 22. WARRANTIES API

### 22.1 List Warranties
**GET** `/warranties`

### 22.2 Create Warranty
**POST** `/warranties`

### 22.3 Update Warranty
**PUT** `/warranties/:id`

### 22.4 Claim Warranty
**POST** `/warranties/:id/claim`

## 23. SERIAL NUMBERS API

### 23.1 List Serial Numbers
**GET** `/serial-numbers`

### 23.2 Create Serial Number
**POST** `/serial-numbers`

### 23.3 Update Serial Number
**PUT** `/serial-numbers/:id`

### 23.4 Track Serial Number
**GET** `/serial-numbers/:id/track`

## 24. FILE UPLOAD API

### 24.1 Upload File
**POST** `/file-upload`

### 24.2 Get File
**GET** `/file-upload/:id`

### 24.3 Delete File
**DELETE** `/file-upload/:id`

## 25. RBAC (Role-Based Access Control) API

### 25.1 List Roles
**GET** `/rbac/roles`

### 25.2 Create Role
**POST** `/rbac/roles`

### 25.3 Update Role
**PUT** `/rbac/roles/:id`

### 25.4 Delete Role
**DELETE** `/rbac/roles/:id`

### 25.5 List Permissions
**GET** `/rbac/permissions`

### 25.6 Assign Permissions
**POST** `/rbac/roles/:id/permissions`

## 26. ALERTS API

### 26.1 List Alerts
**GET** `/alerts`

### 26.2 Create Alert
**POST** `/alerts`

### 26.3 Update Alert
**PUT** `/alerts/:id`

### 26.4 Dismiss Alert
**PUT** `/alerts/:id/dismiss`

## 27. ADVANCED REPORTS API

### 27.1 Custom Reports
**GET** `/advanced-reports`

### 27.2 Create Report
**POST** `/advanced-reports`

### 27.3 Schedule Report
**POST** `/advanced-reports/:id/schedule`

## 28. STORES API

### 28.1 List Stores
**GET** `/stores`

### 28.2 Create Store
**POST** `/stores`

### 28.3 Update Store
**PUT** `/stores/:id`

### 28.4 Delete Store
**DELETE** `/stores/:id`

## 29. PROMOTIONS API

### 29.1 List Promotions
**GET** `/promotions`

### 29.2 Create Promotion
**POST** `/promotions`

### 29.3 Update Promotion
**PUT** `/promotions/:id`

### 29.4 Activate Promotion
**PUT** `/promotions/:id/activate`

## 30. PURCHASE ORDERS API

### 30.1 List Purchase Orders
**GET** `/purchase-orders`

### 30.2 Create Purchase Order
**POST** `/purchase-orders`

### 30.3 Update Purchase Order
**PUT** `/purchase-orders/:id`

### 30.4 Approve Purchase Order
**PUT** `/purchase-orders/:id/approve`

## 31. EMPLOYEE MANAGEMENT API

### 31.1 List Employees
**GET** `/employee-management/employees`

### 31.2 Create Employee
**POST** `/employee-management/employees`

### 31.3 Update Employee
**PUT** `/employee-management/employees/:id`

### 31.4 Deactivate Employee
**PUT** `/employee-management/employees/:id/deactivate`

## 32. SYSTEM HEALTH API

### 32.1 Health Check
**GET** `/health`

### 32.2 System Status
**GET** `/system/status`

### 32.3 Database Health
**GET** `/system/database-health`

## Response Format

Tất cả API responses đều tuân theo format chuẩn:

```json
{
  "success": true|false,
  "data": {...},
  "message": "Success message",
  "error": "Error message (if any)",
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

## Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## Rate Limiting

- General API: 100 requests/minute
- Authentication: 5 requests/15 minutes
- File Upload: 10 requests/minute

## CORS

API hỗ trợ CORS cho các domain:
- `https://namhbcf.uk`
- `https://namhbcf-uk.pages.dev`

## WebSocket

Real-time notifications qua WebSocket:
- URL: `wss://namhbcf-api.bangachieu2.workers.dev/realtime`
- Events: order_updates, inventory_alerts, system_notifications

## Changelog

### v1.0.0 (2025-01-15)
- Initial API release
- Complete CRUD operations for all modules
- Authentication & authorization
- Real-time notifications
- Comprehensive reporting
- Multi-tenant support
