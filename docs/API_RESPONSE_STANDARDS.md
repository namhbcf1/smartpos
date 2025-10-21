# API Response Format Standards
## SmartPOS Backend API - Cloudflare Workers

**Last Updated**: 2025-10-01

---

## 📋 Overview

This document defines the **standard response formats** for all SmartPOS API endpoints to ensure consistency across the entire API.

---

## ✅ Standard Response Formats

### 1. List Response (with Pagination)

**Format:**
```typescript
{
  success: boolean,
  [entityName]: Array<T>,  // e.g., 'products', 'customers', 'sales'
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

**Examples:**

#### Products List
```json
{
  "success": true,
  "products": [
    {"id": "prod-1", "name": "Laptop", "price": 1000000},
    {"id": "prod-2", "name": "Mouse", "price": 50000}
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Categories List
```json
{
  "success": true,
  "categories": [
    {"id": "cat-1", "name": "Electronics"},
    {"id": "cat-2", "name": "Accessories"}
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 17,
    "totalPages": 1
  }
}
```

#### Customers List
```json
{
  "success": true,
  "customers": [
    {"id": "cust-1", "name": "Nguyen Van A"},
    {"id": "cust-2", "name": "Tran Thi B"}
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 17,
    "totalPages": 1
  }
}
```

### 2. Single Item Response

**Format:**
```typescript
{
  success: boolean,
  data: T,  // Single object
  message?: string  // Optional success message
}
```

**Examples:**

#### Get Product by ID
```json
{
  "success": true,
  "data": {
    "id": "prod-1",
    "name": "Dell Laptop XPS 13",
    "sku": "LAPTOP001",
    "price": 25000000,
    "stock": 10
  }
}
```

#### Get Customer by ID
```json
{
  "success": true,
  "data": {
    "id": "cust-1",
    "name": "Nguyen Van A",
    "email": "nguyenvana@example.com",
    "phone": "0901234567"
  }
}
```

### 3. Create Response (POST)

**Format:**
```typescript
{
  success: boolean,
  data: {
    id: string  // ID of created resource
  },
  message: string  // Success message
}
```

**Example:**
```json
{
  "success": true,
  "data": {
    "id": "prod-new-uuid"
  },
  "message": "Product created successfully"
}
```

### 4. Update Response (PUT/PATCH)

**Format:**
```typescript
{
  success: boolean,
  message: string  // Success message
}
```

**Example:**
```json
{
  "success": true,
  "message": "Product updated successfully"
}
```

### 5. Delete Response (DELETE)

**Format:**
```typescript
{
  success: boolean,
  message: string  // Success message
}
```

**Example:**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

### 6. Statistics Response

**Format:**
```typescript
{
  success: boolean,
  data: {
    [key: string]: number | string | object
  }
}
```

**Example:**
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

### 7. Error Response

**Format:**
```typescript
{
  success: false,
  error: string,  // Error message
  message?: string  // Optional detailed message
}
```

**Examples:**

#### 404 Not Found
```json
{
  "success": false,
  "error": "Product not found",
  "message": "No product exists with ID: prod-uuid"
}
```

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request data",
  "message": "Missing required field: name"
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

---

## 🔧 Implementation Guidelines

### TypeScript Interfaces

```typescript
// Base response
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// List response
interface ListResponse<T> {
  success: boolean
  [key: string]: T[] | Pagination | boolean  // Dynamic key for entity name
  pagination: Pagination
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Examples
interface ProductsListResponse {
  success: boolean
  products: Product[]
  pagination: Pagination
}

interface CategoriesListResponse {
  success: boolean
  categories: Category[]
  pagination: Pagination
}
```

### Hono Response Helpers

```typescript
// Success with data
return c.json({
  success: true,
  data: product
})

// Success with list
return c.json({
  success: true,
  products: result.products,
  pagination: result.pagination
})

// Success with message
return c.json({
  success: true,
  message: 'Product created successfully'
}, 201)

// Error response
return c.json({
  success: false,
  error: 'Product not found'
}, 404)
```

---

## 🚨 Current Issues and Fixes

### Issue 1: Inconsistent List Response Keys

**Problem:** Some endpoints return `data` while others return entity-specific keys.

**Wrong:**
```json
{
  "success": true,
  "data": [...]  // ❌ Generic key
}
```

**Correct:**
```json
{
  "success": true,
  "products": [...]  // ✅ Entity-specific key
}
```

**Affected Endpoints:**
- ✅ `/api/products` - Uses `products` key (CORRECT)
- ✅ `/api/categories` - Uses `categories` key (CORRECT)
- ✅ `/api/customers` - Uses `customers` key (CORRECT)
- ✅ `/api/sales` - Uses `sales` key (CORRECT)

### Issue 2: Missing Pagination

**Problem:** Some list endpoints don't include pagination.

**Fix:** Always include pagination for list responses:

```typescript
{
  success: true,
  products: [...],
  pagination: {
    page: 1,
    limit: 20,
    total: 45,
    totalPages: 3
  }
}
```

### Issue 3: Nested Data in Single Item Response

**Problem:** Some endpoints wrap single items unnecessarily.

**Wrong:**
```json
{
  "success": true,
  "data": {
    "data": {  // ❌ Double nesting
      "id": "prod-1"
    }
  }
}
```

**Correct:**
```json
{
  "success": true,
  "data": {  // ✅ Single level
    "id": "prod-1"
  }
}
```

---

## 📝 Entity-Specific Key Names

Use these exact key names for consistency:

| Entity | List Key | Single Key |
|--------|----------|------------|
| Products | `products` | `data` |
| Categories | `categories` | `data` |
| Customers | `customers` | `data` |
| Sales | `sales` | `data` |
| Orders | `orders` | `data` |
| Employees | `employees` | `data` |
| Branches | `branches` | `data` |
| Devices | `devices` | `data` |
| Users | `users` | `data` |
| Roles | `roles` | `data` |
| Tasks | `tasks` | `data` |
| Suppliers | `suppliers` | `data` |
| Warranties | `warranties` | `data` |

---

## 🎯 Frontend Usage Examples

### React Hook Example

```typescript
// useProducts.ts
interface ProductsResponse {
  success: boolean
  products: Product[]
  pagination: Pagination
}

const useProducts = (page: number, limit: number) => {
  const [data, setData] = useState<ProductsResponse | null>(null)

  useEffect(() => {
    fetch(`/api/products?page=${page}&limit=${limit}`)
      .then(res => res.json())
      .then((response: ProductsResponse) => {
        if (response.success) {
          setData(response)
        }
      })
  }, [page, limit])

  return data
}
```

### Axios Example

```typescript
import axios from 'axios'

// Get products list
const getProducts = async (page = 1, limit = 20) => {
  const response = await axios.get('/api/products', {
    params: { page, limit }
  })

  if (response.data.success) {
    return {
      products: response.data.products,
      pagination: response.data.pagination
    }
  }

  throw new Error(response.data.error)
}

// Get single product
const getProduct = async (id: string) => {
  const response = await axios.get(`/api/products/${id}`)

  if (response.data.success) {
    return response.data.data
  }

  throw new Error(response.data.error)
}
```

### Generic API Client

```typescript
class ApiClient {
  async getList<T>(endpoint: string, entityKey: string, params?: any) {
    const response = await fetch(`/api/${endpoint}?${new URLSearchParams(params)}`)
    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error)
    }

    return {
      items: data[entityKey],
      pagination: data.pagination
    }
  }

  async getOne<T>(endpoint: string, id: string) {
    const response = await fetch(`/api/${endpoint}/${id}`)
    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error)
    }

    return data.data
  }
}

// Usage
const api = new ApiClient()
const { items, pagination } = await api.getList('products', 'products', { page: 1, limit: 20 })
const product = await api.getOne('products', 'prod-1')
```

---

## ✅ Checklist for New Endpoints

When creating a new API endpoint:

- [ ] Use consistent response format
- [ ] Include `success` boolean in all responses
- [ ] Use entity-specific key for list responses (e.g., `products`, not `data`)
- [ ] Include pagination for list endpoints
- [ ] Use `data` key for single item responses
- [ ] Return appropriate HTTP status codes
- [ ] Include error messages in error responses
- [ ] Add TypeScript interfaces for responses
- [ ] Document in API_DOCUMENTATION.md
- [ ] Test with frontend integration

---

## 🔄 Migration Guide

### Before (Old Format)
```json
{
  "success": true,
  "data": [...]  // ❌ Generic
}
```

### After (New Format)
```json
{
  "success": true,
  "products": [...],  // ✅ Specific
  "pagination": {...}
}
```

### Code Change

```typescript
// Before
return c.json({
  success: true,
  data: result.categories
})

// After
return c.json({
  success: true,
  categories: result.categories,
  pagination: result.pagination
})
```

---

## 📚 Reference

See also:
- `API_DOCUMENTATION.md` - Complete API endpoint documentation
- `D1_DATABASE_SCHEMA.md` - Database schema and queries
- Frontend API client: `frontend/src/lib/api.ts`

---

## Support

For questions about API response formats, see the main API documentation or raise an issue in the repository.
