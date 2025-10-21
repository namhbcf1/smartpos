# SmartPOS API Documentation
## 100% Cloudflare Workers + Hono.js Framework

**Base URL**: `https://namhbcf-api.bangachieu2.workers.dev/api`
**Version**: 2.0.0
**Last Updated**: 2025-10-01

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Response Format Standards](#response-format-standards)
3. [Core Endpoints](#core-endpoints)
4. [Products API](#products-api)
5. [Categories API](#categories-api)
6. [Customers API](#customers-api)
7. [Sales API](#sales-api)
8. [Orders API](#orders-api)
9. [Inventory API](#inventory-api)
10. [Dashboard API](#dashboard-api)
11. [Reports API](#reports-api)
12. [Error Handling](#error-handling)
13. [Rate Limiting](#rate-limiting)
14. [Best Practices](#best-practices)

---

## Authentication

### Simple Authentication (Current Implementation)
**NO JWT TOKENS REQUIRED** - Authentication is handled on frontend with localStorage.

All API endpoints bypass authentication middleware in current implementation.

```javascript
// No Authorization header needed
const response = await fetch('https://namhbcf-api.bangachieu2.workers.dev/api/products', {
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### Multi-Tenancy Support
Optional tenant ID can be passed via header:

```javascript
headers: {
  'X-Tenant-ID': 'tenant-uuid' // Optional, defaults to 'default'
}
```

---

## Response Format Standards

### Successful Response Format

#### Single Item Response
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Product Name",
    "price": 100000
  },
  "message": "Optional success message"
}
```

#### List Response with Pagination
```json
{
  "success": true,
  "products": [
    {
      "id": "uuid",
      "name": "Product 1"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```

### HTTP Status Codes
- `200 OK` - Successful GET/PUT/DELETE
- `201 Created` - Successful POST
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error
- `501 Not Implemented` - Feature not yet implemented

---

## Core Endpoints

### Health Check
**GET** `/api/health`

Check API server status.

**Response:**
```json
{
  "success": true,
  "message": "SmartPOS API is healthy",
  "timestamp": "2025-10-01T10:00:00.000Z",
  "database": "connected",
  "version": "2.0.0"
}
```

### API Information
**GET** `/api/info`

Get API metadata and available endpoints.

**Response:**
```json
{
  "success": true,
  "message": "SmartPOS API is running",
  "timestamp": "2025-10-01T10:00:00.000Z",
  "version": "2.0.0",
  "features": {
    "authentication": true,
    "rateLimit": true,
    "multiTenant": true
  },
  "endpoints": {
    "products": "/api/products",
    "orders": "/api/orders",
    "sales": "/api/sales",
    "customers": "/api/customers"
  }
}
```

---

## Products API

### List Products
**GET** `/api/products`

Get paginated list of products.

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20) - Items per page
- `search` (string, optional) - Search query for name/SKU

**Example Request:**
```bash
GET /api/products?page=1&limit=20&search=laptop
```

**Response:**
```json
{
  "success": true,
  "products": [
    {
      "id": "prod-uuid",
      "sku": "LAPTOP001",
      "name": "Dell Laptop XPS 13",
      "price": 25000000,
      "stock": 10,
      "categoryId": "cat-uuid",
      "isActive": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### Get Product by ID
**GET** `/api/products/:id`

Get detailed product information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "prod-uuid",
    "sku": "LAPTOP001",
    "name": "Dell Laptop XPS 13",
    "description": "High performance laptop",
    "price": 25000000,
    "stock": 10,
    "categoryId": "cat-uuid",
    "barcode": "123456789",
    "isActive": 1,
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

### Search Products
**GET** `/api/products/search?q=laptop&limit=20`

Search products by name or SKU.

**Query Parameters:**
- `q` (string, required) - Search query
- `limit` (integer, default: 20) - Max results

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod-uuid",
      "name": "Dell Laptop XPS 13",
      "sku": "LAPTOP001",
      "price": 25000000
    }
  ]
}
```

### Search by Barcode
**GET** `/api/products/search/barcode/:barcode`

Find product by barcode.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "prod-uuid",
    "name": "Dell Laptop XPS 13",
    "barcode": "123456789",
    "price": 25000000,
    "stock": 10
  }
}
```

### Get Product Statistics
**GET** `/api/products/stats`

Get product statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_products": 45,
    "active_products": 42,
    "low_stock_products": 5,
    "out_of_stock_products": 3
  }
}
```

### Get Top Products
**GET** `/api/products/top?limit=10`

Get top selling products.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod-uuid",
      "name": "Dell Laptop XPS 13",
      "sku": "LAPTOP001",
      "price": 25000000,
      "stock": 10
    }
  ]
}
```

### Create Product
**POST** `/api/products`

Create a new product.

**Request Body:**
```json
{
  "sku": "LAPTOP001",
  "name": "Dell Laptop XPS 13",
  "description": "High performance laptop",
  "price": 25000000,
  "stock": 10,
  "categoryId": "cat-uuid",
  "barcode": "123456789",
  "isActive": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-prod-uuid"
  },
  "message": "Product created successfully"
}
```

### Update Product
**PUT** `/api/products/:id`

Update existing product.

**Request Body:**
```json
{
  "name": "Dell Laptop XPS 13 Updated",
  "price": 26000000,
  "stock": 15
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product updated successfully"
}
```

### Delete Product
**DELETE** `/api/products/:id`

Delete a product.

**Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

### Adjust Product Stock
**POST** `/api/products/:id/stock`

Adjust product stock level.

**Request Body:**
```json
{
  "adjustment_type": "in",
  "quantity": 10,
  "reason": "Restocking"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Stock adjusted successfully"
}
```

---

## Categories API

### List Categories
**GET** `/api/categories`

Get all product categories.

**Query Parameters:**
- `page` (integer, default: 1)
- `limit` (integer, default: 100)

**Response:**
```json
{
  "success": true,
  "categories": [
    {
      "id": "cat-uuid",
      "name": "Laptops",
      "description": "Laptop computers",
      "parent_id": null,
      "is_active": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 17,
    "totalPages": 1
  }
}
```

### Get Category by ID
**GET** `/api/categories/:id`

Get single category details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cat-uuid",
    "name": "Laptops",
    "description": "Laptop computers",
    "parent_id": null,
    "is_active": 1
  }
}
```

### Create Category
**POST** `/api/categories`

Create new category.

**Request Body:**
```json
{
  "name": "Gaming Laptops",
  "description": "High-performance gaming laptops",
  "parent_id": "cat-uuid",
  "is_active": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-cat-uuid"
  },
  "message": "Category created successfully"
}
```

### Update Category
**PUT** `/api/categories/:id`

Update category.

**Request Body:**
```json
{
  "name": "Gaming Laptops Updated",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Category updated successfully"
}
```

### Delete Category
**DELETE** `/api/categories/:id`

Delete category.

**Response:**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

### Get Category Products
**GET** `/api/categories/:id/products`

Get all products in category.

**Query Parameters:**
- `page` (integer, default: 1)
- `limit` (integer, default: 50)
- `search` (string, optional)
- `sort_by` (string, default: 'name')
- `sort_order` (string, default: 'asc')

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod-uuid",
      "name": "Dell Laptop XPS 13",
      "price": 25000000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 12,
    "totalPages": 1
  }
}
```

---

## Customers API

### List Customers
**GET** `/api/customers`

Get paginated customer list.

**Query Parameters:**
- `page` (integer, default: 1)
- `limit` (integer, default: 20)
- `search` (string, optional)

**Response:**
```json
{
  "success": true,
  "customers": [
    {
      "id": "cust-uuid",
      "name": "Nguyen Van A",
      "email": "nguyenvana@example.com",
      "phone": "0901234567",
      "customer_type": "retail",
      "is_active": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 17,
    "totalPages": 1
  }
}
```

### Get Customer by ID
**GET** `/api/customers/:id`

Get customer details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cust-uuid",
    "name": "Nguyen Van A",
    "email": "nguyenvana@example.com",
    "phone": "0901234567",
    "address": "123 Street, District, City",
    "customer_type": "retail",
    "total_spent": 5000000,
    "is_active": 1
  }
}
```

### Search Customers
**GET** `/api/customers/search?q=nguyen&limit=20`

Search customers by name/email/phone.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cust-uuid",
      "name": "Nguyen Van A",
      "email": "nguyenvana@example.com",
      "phone": "0901234567"
    }
  ]
}
```

### Get Customer Statistics
**GET** `/api/customers/stats`

Get customer statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_customers": 17,
    "active_customers": 15,
    "wholesale_customers": 5,
    "retail_customers": 12
  }
}
```

### Create Customer
**POST** `/api/customers`

Create new customer.

**Request Body:**
```json
{
  "name": "Nguyen Van B",
  "email": "nguyenvanb@example.com",
  "phone": "0907654321",
  "address": "456 Street, District, City",
  "customer_type": "retail"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-cust-uuid"
  },
  "message": "Customer created successfully"
}
```

### Update Customer
**PUT** `/api/customers/:id`

Update customer information.

**Request Body:**
```json
{
  "name": "Nguyen Van B Updated",
  "phone": "0907654322"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Customer updated successfully"
}
```

### Delete Customer
**DELETE** `/api/customers/:id`

Delete customer.

**Response:**
```json
{
  "success": true,
  "message": "Customer deleted successfully"
}
```

### Get Customer Purchases
**GET** `/api/customers/:id/purchases`

Get customer purchase history.

**Query Parameters:**
- `page` (integer, default: 1)
- `limit` (integer, default: 20)

**Response:**
```json
{
  "success": true,
  "purchases": [
    {
      "id": "sale-uuid",
      "total_amount": 500000,
      "payment_method": "cash",
      "created_at": "2025-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

### Get Customer Tier Information
**GET** `/api/customers/:id/tier`

Get customer loyalty tier and benefits.

**Response:**
```json
{
  "success": true,
  "data": {
    "customer_id": "cust-uuid",
    "current_tier": {
      "tier": "gold",
      "label": "Vàng",
      "color": "text-yellow-600",
      "benefits": ["Giảm giá 10%", "Miễn phí vận chuyển"],
      "total_spent": 5000000
    },
    "next_tier": {
      "tier": "platinum",
      "label": "Bạch kim",
      "required_amount": 10000000,
      "remaining_amount": 5000000
    },
    "tier_progress": 50
  }
}
```

---

## Sales API

### List Sales
**GET** `/api/sales`

Get sales transactions.

**Query Parameters:**
- `page` (integer, default: 1)
- `limit` (integer, default: 20)
- `search` (string, optional)

**Response:**
```json
{
  "success": true,
  "sales": [
    {
      "id": "sale-uuid",
      "customer_id": "cust-uuid",
      "total_amount": 500000,
      "payment_method": "cash",
      "status": "completed",
      "created_at": "2025-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Get Sale by ID
**GET** `/api/sales/:id`

Get sale details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "sale-uuid",
    "customer_id": "cust-uuid",
    "customer_name": "Nguyen Van A",
    "total_amount": 500000,
    "payment_method": "cash",
    "status": "completed",
    "created_at": "2025-01-15T10:00:00.000Z"
  }
}
```

### Get Sales Statistics
**GET** `/api/sales/stats`

Get sales statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_sales": 150,
    "total_revenue": 75000000,
    "avg_sale_value": 500000,
    "sales_today": 10,
    "revenue_today": 5000000
  }
}
```

### Get Today's Sales Summary
**GET** `/api/sales/today/summary`

Get detailed summary for today.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_sales": 10,
    "total_revenue": 5000000,
    "cash_sales": 3000000,
    "card_sales": 2000000,
    "avg_sale_value": 500000,
    "sales": [
      {
        "id": "sale-uuid",
        "total_amount": 500000,
        "payment_method": "cash"
      }
    ]
  }
}
```

### Get Sales by Customer
**GET** `/api/sales/customer/:customer_id`

Get all sales for specific customer.

**Query Parameters:**
- `page` (integer, default: 1)
- `limit` (integer, default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "sale-uuid",
        "total_amount": 500000,
        "payment_method": "cash",
        "created_at": "2025-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

### Calculate Tax
**POST** `/api/sales/calculate-tax`

Calculate VAT for subtotal.

**Request Body:**
```json
{
  "subtotal": 1000000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subtotal": 1000000,
    "vat_rate": 0.1,
    "vat_amount": 100000,
    "total": 1100000,
    "tax_breakdown": {
      "base_amount": 1000000,
      "vat": 100000
    }
  }
}
```

### Calculate Cart
**POST** `/api/sales/calculate-cart`

Calculate cart totals with tax and discounts.

**Request Body:**
```json
{
  "items": [
    {
      "product_id": "prod-uuid",
      "quantity": 2,
      "price": 500000,
      "discount": 50000
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subtotal": 1000000,
    "vat_amount": 100000,
    "discount_amount": 50000,
    "total": 1050000,
    "item_count": 1,
    "items": [
      {
        "product_id": "prod-uuid",
        "quantity": 2,
        "price": 500000,
        "discount": 50000,
        "total": 1000000
      }
    ]
  }
}
```

### End of Day Report
**GET** `/api/sales/reports/end-of-day?date=2025-01-15`

Generate end of day sales report.

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2025-01-15",
    "total_sales": 10,
    "total_revenue": 5000000,
    "cash_sales": 3000000,
    "card_sales": 2000000,
    "transfer_sales": 0,
    "refunds": 0,
    "payment_methods": {
      "cash": 3000000,
      "card": 2000000
    }
  }
}
```

---

## Orders API

### List Orders
**GET** `/api/orders`

Get all orders.

**Query Parameters:**
- `page` (integer, default: 1)
- `limit` (integer, default: 20)
- `status` (string, optional) - Filter by status

**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "id": "order-uuid",
      "customer_id": "cust-uuid",
      "total_amount": 1000000,
      "status": "pending",
      "created_at": "2025-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

### Get Order by ID
**GET** `/api/orders/:id`

Get order details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "customer_id": "cust-uuid",
    "customer_name": "Nguyen Van A",
    "total_amount": 1000000,
    "status": "pending",
    "items": [
      {
        "product_id": "prod-uuid",
        "product_name": "Dell Laptop XPS 13",
        "quantity": 1,
        "price": 1000000
      }
    ],
    "created_at": "2025-01-15T10:00:00.000Z"
  }
}
```

### Create Order
**POST** `/api/orders`

Create new order.

**Request Body:**
```json
{
  "customer_id": "cust-uuid",
  "items": [
    {
      "product_id": "prod-uuid",
      "quantity": 1,
      "price": 1000000
    }
  ],
  "payment_method": "cash",
  "status": "pending"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-order-uuid"
  },
  "message": "Order created successfully"
}
```

### Update Order Status
**PUT** `/api/orders/:id/status`

Update order status.

**Request Body:**
```json
{
  "status": "completed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order status updated successfully"
}
```

---

## Dashboard API

### Get Dashboard Statistics
**GET** `/api/dashboard/stats`

Get comprehensive dashboard statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "revenue": {
      "today": 5000000,
      "yesterday": 4500000,
      "this_week": 30000000,
      "this_month": 120000000,
      "growth_rate": {
        "daily": 11.11,
        "weekly": 5.2,
        "monthly": 8.5
      }
    },
    "sales": {
      "total_today": 10,
      "total_this_week": 75,
      "total_this_month": 300,
      "avg_sale_value": 500000
    },
    "products": {
      "total": 45,
      "low_stock": 5,
      "out_of_stock": 3
    },
    "customers": {
      "total": 17,
      "active": 15,
      "new_this_month": 3
    }
  }
}
```

---

## Reports API

### Get Basic Reports
**GET** `/api/reports`

Get available report types and data.

**Response:**
```json
{
  "success": true,
  "data": {
    "available_reports": [
      "sales_summary",
      "product_performance",
      "customer_analysis",
      "inventory_status"
    ]
  }
}
```

---

## Inventory API

### Get Inventory Status
**GET** `/api/inventory`

Get current inventory status.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_products": 45,
    "low_stock_products": 5,
    "out_of_stock_products": 3,
    "total_value": 125000000
  }
}
```

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request data",
  "message": "Missing required field: name"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": "Product not found",
  "message": "No product exists with ID: prod-uuid"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to get products",
  "message": "Database connection error"
}
```

#### 501 Not Implemented
```json
{
  "success": false,
  "error": "POS transaction not implemented yet"
}
```

---

## Rate Limiting

**Current Status**: DISABLED

Rate limiting middleware is present but disabled:
```javascript
// app.use('*', RateLimits.api); // DISABLED
```

When enabled:
- **API Endpoints**: 100 requests per minute per IP
- **Authentication**: 10 requests per minute per IP

---

## Best Practices

### 1. Always Check Response Success
```javascript
const response = await fetch('/api/products');
const data = await response.json();

if (data.success) {
  // Handle successful response
  console.log(data.products);
} else {
  // Handle error
  console.error(data.error);
}
```

### 2. Use Pagination for Large Lists
```javascript
// Good: Use pagination
GET /api/products?page=1&limit=20

// Bad: Loading all records
GET /api/products?limit=10000
```

### 3. Handle Different Response Formats
Some endpoints return data in `data` key, others in specific keys:

```javascript
// Categories endpoint
{
  "success": true,
  "categories": [...],  // Note: uses 'categories' key
  "pagination": {...}
}

// Products endpoint
{
  "success": true,
  "products": [...],    // Note: uses 'products' key
  "pagination": {...}
}

// Single item endpoint
{
  "success": true,
  "data": {...}         // Note: uses 'data' key
}
```

### 4. Error Handling
```javascript
try {
  const response = await fetch('/api/products');
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Unknown error');
  }

  return data;
} catch (error) {
  console.error('API Error:', error);
  throw error;
}
```

### 5. Search and Filter
```javascript
// Search products
GET /api/products/search?q=laptop&limit=20

// Filter by category
GET /api/categories/:id/products?page=1&limit=50

// Search customers
GET /api/customers/search?q=nguyen&limit=20
```

### 6. Use Specific Endpoints
```javascript
// Good: Use specific search endpoint
GET /api/products/search/barcode/123456789

// Bad: Load all products and filter client-side
GET /api/products?limit=1000
// then filter in JavaScript
```

---

## Database Integration

All API endpoints use **Cloudflare D1 SQLite Database**.

See `D1_DATABASE_SCHEMA.md` for complete database documentation.

### Common Query Pattern
```javascript
// Pagination query
const query = `
  SELECT * FROM products
  WHERE isActive = 1
  ORDER BY created_at DESC
  LIMIT ? OFFSET ?
`;

const result = await c.env.DB.prepare(query)
  .bind(limit, offset)
  .all();
```

---

## CORS Configuration

**Allowed Origins:**
- `https://namhbcf.uk`
- `https://namhbcf-uk.pages.dev`
- `http://localhost:5173` (development)

**Allowed Methods:**
- GET, POST, PUT, DELETE, OPTIONS

**Allowed Headers:**
- Content-Type, Authorization, X-Tenant-ID

---

## Changelog

### Version 2.0.0 (2025-10-01)
- ✅ Removed JWT authentication (simple localStorage auth)
- ✅ Fixed categories API response format
- ✅ Standardized response formats across endpoints
- ✅ Added comprehensive error handling
- ✅ Updated dashboard statistics
- ✅ Added customer tier calculation
- ✅ Simplified sales API

### Version 1.0.0 (2025-01-15)
- Initial API release
- Core CRUD operations for all entities
- Multi-tenancy support
- Rate limiting

---

## Support

**Base URL**: https://namhbcf-api.bangachieu2.workers.dev/api
**Frontend**: https://namhbcf-uk.pages.dev
**Database**: Cloudflare D1 (smartpos-free)

For issues and questions, see repository documentation.
