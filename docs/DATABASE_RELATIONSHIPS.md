# Database Relationships & Constraints
## SmartPOS - Cloudflare D1 Database

**Database**: `smartpos-free`
**ID**: `1f6dec6f-f953-4f00-9408-afd28a7f6650`
**Last Updated**: 2025-10-01

---

## 📋 Table of Contents

1. [Entity Relationship Diagram](#entity-relationship-diagram)
2. [Core Tables](#core-tables)
3. [Relationships](#relationships)
4. [Foreign Key Constraints](#foreign-key-constraints)
5. [Indexes](#indexes)
6. [Data Integrity Rules](#data-integrity-rules)

---

## Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  customers  │────────<│    sales     │>────────│  products   │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │                         │
      │                        │                         │
      ▼                        ▼                         ▼
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   orders    │         │  sale_items  │         │ categories  │
└─────────────┘         └──────────────┘         └─────────────┘
      │                                                  │
      │                                                  │
      ▼                                                  ▼
┌─────────────┐                                  ┌─────────────┐
│order_items  │                                  │   brands    │
└─────────────┘                                  └─────────────┘

┌─────────────┐         ┌──────────────┐
│  suppliers  │────────<│   products   │
└─────────────┘         └──────────────┘

┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   stores    │────────<│   sales      │         │    users    │
└─────────────┘         └──────────────┘         └─────────────┘
                               │
                               │
                               ▼
                        ┌──────────────┐
                        │  employees   │
                        └──────────────┘

┌─────────────┐         ┌──────────────┐
│ warehouses  │────────<│  inventory   │
└─────────────┘         │  movements   │
                        └──────────────┘
```

---

## Core Tables

### 1. Products (Central Entity)

**Table**: `products`

**Relationships:**
- Belongs to `categories` (category_id)
- Belongs to `brands` (brand_id)
- Belongs to `suppliers` (supplier_id)
- Has many `sale_items`
- Has many `order_items`
- Has many `inventory_movements`

**Key Columns:**
```sql
id TEXT PRIMARY KEY
category_id TEXT  -- FK to categories.id
brand_id TEXT     -- FK to brands.id
supplier_id TEXT  -- FK to suppliers.id
```

### 2. Categories (Hierarchical)

**Table**: `categories`

**Relationships:**
- Has many `products`
- Self-referential (parent_id)

**Key Columns:**
```sql
id TEXT PRIMARY KEY
parent_id TEXT    -- FK to categories.id (self-referential)
```

**Hierarchy Example:**
```
Electronics (parent_id: NULL)
├── Laptops (parent_id: electronics-id)
│   ├── Gaming Laptops (parent_id: laptops-id)
│   └── Business Laptops (parent_id: laptops-id)
└── Accessories (parent_id: electronics-id)
```

### 3. Customers

**Table**: `customers`

**Relationships:**
- Has many `sales`
- Has many `orders`
- Has many `loyalty_transactions`

**Key Columns:**
```sql
id TEXT PRIMARY KEY
customer_type TEXT  -- 'retail', 'wholesale', 'vip'
total_spent DECIMAL
loyalty_points INTEGER
```

### 4. Sales (Transactions)

**Table**: `sales`

**Relationships:**
- Belongs to `customers` (customer_id)
- Belongs to `users` (user_id - cashier)
- Belongs to `stores` (store_id)
- Has many `sale_items`

**Key Columns:**
```sql
id TEXT PRIMARY KEY
customer_id TEXT      -- FK to customers.id
user_id TEXT          -- FK to users.id
store_id TEXT         -- FK to stores.id
total_amount DECIMAL
status TEXT           -- 'completed', 'refunded', 'void'
payment_method TEXT   -- 'cash', 'card', 'transfer'
```

### 5. Orders

**Table**: `orders`

**Relationships:**
- Belongs to `customers` (customer_id)
- Has many `order_items`
- Belongs to `stores` (store_id)

**Key Columns:**
```sql
id TEXT PRIMARY KEY
customer_id TEXT     -- FK to customers.id
store_id TEXT        -- FK to stores.id
status TEXT          -- 'pending', 'processing', 'completed', 'cancelled'
total_amount DECIMAL
```

### 6. Suppliers

**Table**: `suppliers`

**Relationships:**
- Has many `products`
- Has many `purchase_orders`

**Key Columns:**
```sql
id TEXT PRIMARY KEY
name TEXT
contact_person TEXT
phone TEXT
email TEXT
```

### 7. Stores/Branches

**Table**: `stores`

**Relationships:**
- Has many `sales`
- Has many `orders`
- Has many `employees`
- Has many `inventory_movements`

**Key Columns:**
```sql
id TEXT PRIMARY KEY
name TEXT
address TEXT
is_active INTEGER
```

### 8. Users (Authentication)

**Table**: `users`

**Relationships:**
- Has many `sales` (as cashier)
- Belongs to `stores`
- Has one `employees` record

**Key Columns:**
```sql
id TEXT PRIMARY KEY
username TEXT UNIQUE
email TEXT UNIQUE
role TEXT            -- 'admin', 'manager', 'cashier', 'staff'
is_active INTEGER
```

### 9. Employees

**Table**: `employees`

**Relationships:**
- Belongs to `stores` (store_id)
- Belongs to `users` (user_id)

**Key Columns:**
```sql
id TEXT PRIMARY KEY
user_id TEXT         -- FK to users.id
store_id TEXT        -- FK to stores.id
position TEXT
```

### 10. Inventory Movements

**Table**: `inventory_movements`

**Relationships:**
- Belongs to `products` (product_id)
- Belongs to `warehouses` (warehouse_id)
- Belongs to `stores` (store_id)

**Key Columns:**
```sql
id TEXT PRIMARY KEY
product_id TEXT      -- FK to products.id
warehouse_id TEXT    -- FK to warehouses.id
movement_type TEXT   -- 'in', 'out', 'transfer', 'adjustment'
quantity INTEGER
```

---

## Relationships

### One-to-Many Relationships

#### 1. Categories → Products
```sql
-- One category has many products
SELECT p.* FROM products p
JOIN categories c ON p.category_id = c.id
WHERE c.id = ?;

-- Get category with product count
SELECT c.*, COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.id;
```

#### 2. Customers → Sales
```sql
-- Get all sales for a customer
SELECT s.* FROM sales s
WHERE s.customer_id = ?
ORDER BY s.created_at DESC;

-- Get customer with total spending
SELECT c.*,
  COUNT(s.id) as total_sales,
  SUM(s.total_amount) as total_spent
FROM customers c
LEFT JOIN sales s ON s.customer_id = c.id
GROUP BY c.id;
```

#### 3. Products → Sale Items
```sql
-- Get all sales of a product
SELECT si.*, s.created_at as sale_date
FROM sale_items si
JOIN sales s ON si.sale_id = s.id
WHERE si.product_id = ?
ORDER BY s.created_at DESC;
```

#### 4. Stores → Sales
```sql
-- Get all sales for a store
SELECT s.* FROM sales s
WHERE s.store_id = ?
AND DATE(s.created_at) = ?;

-- Store daily summary
SELECT
  store_id,
  DATE(created_at) as date,
  COUNT(*) as total_sales,
  SUM(total_amount) as revenue
FROM sales
WHERE store_id = ?
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Many-to-Many Relationships

#### Sales ↔ Products (via sale_items)
```sql
-- Products in a sale
SELECT p.*, si.quantity, si.unit_price
FROM products p
JOIN sale_items si ON si.product_id = p.id
WHERE si.sale_id = ?;

-- Sales containing a product
SELECT s.*, si.quantity
FROM sales s
JOIN sale_items si ON si.sale_id = s.id
WHERE si.product_id = ?;
```

#### Orders ↔ Products (via order_items)
```sql
-- Products in an order
SELECT p.*, oi.quantity, oi.unit_price
FROM products p
JOIN order_items oi ON oi.product_id = p.id
WHERE oi.order_id = ?;
```

### Self-Referential Relationships

#### Categories (Parent-Child)
```sql
-- Get subcategories
SELECT * FROM categories
WHERE parent_id = ?;

-- Get category with parent
SELECT
  c.*,
  p.name as parent_name
FROM categories c
LEFT JOIN categories p ON c.parent_id = p.id
WHERE c.id = ?;

-- Get full category path
WITH RECURSIVE category_path AS (
  SELECT id, name, parent_id, name as path, 0 as level
  FROM categories
  WHERE id = ?

  UNION ALL

  SELECT c.id, c.name, c.parent_id, c.name || ' > ' || cp.path, cp.level + 1
  FROM categories c
  JOIN category_path cp ON c.id = cp.parent_id
)
SELECT * FROM category_path
ORDER BY level DESC
LIMIT 1;
```

---

## Foreign Key Constraints

### Products Table
```sql
-- Foreign keys (enforced via application logic)
category_id → categories.id
brand_id → brands.id
supplier_id → suppliers.id

-- Check constraint example
CHECK (price >= 0)
CHECK (stock >= 0)
```

### Sales Table
```sql
-- Foreign keys
customer_id → customers.id
user_id → users.id
store_id → stores.id

-- Constraints
CHECK (total_amount >= 0)
CHECK (status IN ('pending', 'completed', 'refunded', 'void'))
CHECK (payment_method IN ('cash', 'card', 'transfer', 'momo', 'vnpay'))
```

### Orders Table
```sql
-- Foreign keys
customer_id → customers.id
store_id → stores.id

-- Constraints
CHECK (total_amount >= 0)
CHECK (status IN ('pending', 'processing', 'completed', 'cancelled'))
```

### Important Note on D1 Foreign Keys

**Cloudflare D1** (SQLite) supports foreign key constraints, but they must be enabled:

```sql
-- Enable foreign keys (must be run per connection)
PRAGMA foreign_keys = ON;
```

**Current Implementation**: Foreign keys are **NOT enforced** in D1. Application logic handles referential integrity.

---

## Indexes

### Products Table
```sql
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_stock ON products(stock);
```

### Sales Table
```sql
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_date ON sales(created_at);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_store ON sales(store_id);
```

### Customers Table
```sql
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_type ON customers(customer_type);
```

### Orders Table
```sql
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(created_at);
```

---

## Data Integrity Rules

### 1. Cascade Delete Rules

**Application-Level Implementation**:

```typescript
// Delete product → Delete related records
async deleteProduct(id: string) {
  // 1. Delete sale_items references
  await db.prepare('DELETE FROM sale_items WHERE product_id = ?').bind(id).run()

  // 2. Delete order_items references
  await db.prepare('DELETE FROM order_items WHERE product_id = ?').bind(id).run()

  // 3. Delete inventory movements
  await db.prepare('DELETE FROM inventory_movements WHERE product_id = ?').bind(id).run()

  // 4. Finally delete product
  await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run()
}
```

### 2. Referential Integrity Checks

```sql
-- Before inserting sale
-- Check if customer exists
SELECT id FROM customers WHERE id = ? LIMIT 1;

-- Check if products exist and have stock
SELECT id, stock FROM products WHERE id = ? AND stock >= ?;

-- Before deleting category
-- Check if products use this category
SELECT COUNT(*) FROM products WHERE category_id = ?;
```

### 3. Business Logic Constraints

#### Stock Management
```sql
-- Prevent negative stock
UPDATE products
SET stock = stock - ?
WHERE id = ?
AND stock >= ?;  -- Ensure sufficient stock
```

#### Sale Validation
```sql
-- Sale must have items
SELECT COUNT(*) FROM sale_items WHERE sale_id = ?;
-- Must be > 0

-- Sale total must match items
SELECT SUM(quantity * unit_price) FROM sale_items WHERE sale_id = ?;
-- Must equal sales.total_amount
```

#### Customer Tier Calculation
```sql
-- Update customer tier based on total spent
UPDATE customers
SET tier = CASE
  WHEN total_spent >= 10000000 THEN 'platinum'
  WHEN total_spent >= 5000000 THEN 'gold'
  WHEN total_spent >= 1000000 THEN 'silver'
  ELSE 'bronze'
END
WHERE id = ?;
```

---

## Complex Queries

### 1. Sales Report with Customer and Product Details
```sql
SELECT
  s.id as sale_id,
  s.created_at as sale_date,
  c.name as customer_name,
  c.phone as customer_phone,
  p.name as product_name,
  si.quantity,
  si.unit_price,
  (si.quantity * si.unit_price) as line_total,
  s.total_amount,
  s.payment_method
FROM sales s
JOIN customers c ON s.customer_id = c.id
JOIN sale_items si ON si.sale_id = s.id
JOIN products p ON si.product_id = p.id
WHERE DATE(s.created_at) = ?
ORDER BY s.created_at DESC;
```

### 2. Low Stock Products by Category
```sql
SELECT
  c.name as category,
  p.name as product,
  p.sku,
  p.stock,
  p.reorder_level,
  (p.reorder_level - p.stock) as need_to_order
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE p.stock <= p.reorder_level
AND p.is_active = 1
ORDER BY c.name, (p.reorder_level - p.stock) DESC;
```

### 3. Customer Purchase History
```sql
SELECT
  s.id as sale_id,
  s.created_at,
  s.total_amount,
  s.payment_method,
  COUNT(si.id) as items_count,
  GROUP_CONCAT(p.name, ', ') as products
FROM sales s
JOIN sale_items si ON si.sale_id = s.id
JOIN products p ON si.product_id = p.id
WHERE s.customer_id = ?
GROUP BY s.id
ORDER BY s.created_at DESC;
```

### 4. Top Selling Products
```sql
SELECT
  p.id,
  p.name,
  p.sku,
  COUNT(si.id) as times_sold,
  SUM(si.quantity) as total_quantity,
  SUM(si.quantity * si.unit_price) as total_revenue
FROM products p
JOIN sale_items si ON si.product_id = p.id
JOIN sales s ON si.sale_id = s.id
WHERE s.status = 'completed'
AND s.created_at >= DATE('now', '-30 days')
GROUP BY p.id
ORDER BY total_revenue DESC
LIMIT 10;
```

### 5. Store Performance Comparison
```sql
SELECT
  st.name as store,
  COUNT(s.id) as total_sales,
  SUM(s.total_amount) as revenue,
  AVG(s.total_amount) as avg_sale,
  COUNT(DISTINCT s.customer_id) as unique_customers
FROM stores st
LEFT JOIN sales s ON s.store_id = st.id
WHERE s.created_at >= DATE('now', '-7 days')
GROUP BY st.id
ORDER BY revenue DESC;
```

---

## Transaction Examples

### Create Sale with Items
```sql
BEGIN TRANSACTION;

-- 1. Insert sale
INSERT INTO sales (id, customer_id, total_amount, payment_method, status)
VALUES (?, ?, ?, ?, 'completed');

-- 2. Insert sale items
INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price)
VALUES (?, ?, ?, ?, ?);

-- 3. Update product stock
UPDATE products SET stock = stock - ? WHERE id = ?;

-- 4. Update customer total spent
UPDATE customers SET total_spent = total_spent + ? WHERE id = ?;

COMMIT;
```

### Transfer Stock Between Warehouses
```sql
BEGIN TRANSACTION;

-- 1. Create outbound movement
INSERT INTO inventory_movements
  (id, product_id, warehouse_id, movement_type, quantity, created_at)
VALUES (?, ?, ?, 'out', ?, CURRENT_TIMESTAMP);

-- 2. Create inbound movement
INSERT INTO inventory_movements
  (id, product_id, warehouse_id, movement_type, quantity, created_at)
VALUES (?, ?, ?, 'in', ?, CURRENT_TIMESTAMP);

-- 3. Update product stock if needed
UPDATE products SET stock = stock WHERE id = ?;

COMMIT;
```

---

## Best Practices

### 1. Always Use Transactions
```typescript
try {
  await db.batch([
    db.prepare('INSERT INTO sales ...'),
    db.prepare('INSERT INTO sale_items ...'),
    db.prepare('UPDATE products SET stock = stock - ? ...')
  ])
} catch (error) {
  // Rollback happens automatically
  console.error('Transaction failed:', error)
}
```

### 2. Check Existence Before Insert
```typescript
// Check if customer exists
const customer = await db.prepare('SELECT id FROM customers WHERE id = ?')
  .bind(customerId)
  .first()

if (!customer) {
  return { success: false, error: 'Customer not found' }
}
```

### 3. Use Prepared Statements
```typescript
// Good
const stmt = db.prepare('SELECT * FROM products WHERE id = ?')
const product = await stmt.bind(productId).first()

// Bad - SQL injection risk
const query = `SELECT * FROM products WHERE id = '${productId}'`
```

### 4. Handle Cascading Deletes
```typescript
// Delete order with items
async deleteOrder(orderId: string) {
  await db.batch([
    db.prepare('DELETE FROM order_items WHERE order_id = ?').bind(orderId),
    db.prepare('DELETE FROM orders WHERE id = ?').bind(orderId)
  ])
}
```

---

## See Also

- `D1_DATABASE_SCHEMA.md` - Complete database schema
- `API_DOCUMENTATION.md` - API endpoints documentation
- `API_RESPONSE_STANDARDS.md` - Response format standards

---

## Database Access

```bash
# List all tables
npx wrangler d1 execute smartpos-free --command "SELECT name FROM sqlite_master WHERE type='table'"

# Check relationships
npx wrangler d1 execute smartpos-free --command "PRAGMA foreign_key_list(products)"

# Check indexes
npx wrangler d1 execute smartpos-free --command "PRAGMA index_list(products)"
```
