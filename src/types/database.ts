/**
 * Database Schema Types - SmartPOS
 * Matches D1_SCHEMA_STANDARDIZATION.md exactly
 */

// =============================================================================
// CORE ENTITY TYPES
// =============================================================================

export interface Product {
  id: string; // TEXT PRIMARY KEY
  name: string; // TEXT NOT NULL
  sku: string; // TEXT UNIQUE NOT NULL
  barcode?: string; // TEXT UNIQUE
  description?: string; // TEXT
  category_id?: string; // TEXT FK → categories.id
  brand_id?: string; // TEXT FK → brands.id
  supplier_id?: string; // TEXT FK → suppliers.id
  store_id: string; // TEXT NOT NULL DEFAULT 'store-1'
  price_cents: number; // INTEGER NOT NULL CHECK (price_cents >= 0)
  cost_price_cents: number; // INTEGER NOT NULL CHECK (cost_price_cents >= 0)
  stock: number; // INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0)
  min_stock: number; // INTEGER NOT NULL DEFAULT 0
  max_stock: number; // INTEGER NOT NULL DEFAULT 1000
  unit: string; // TEXT NOT NULL DEFAULT 'piece'
  weight_grams?: number; // INTEGER CHECK (weight_grams >= 0)
  dimensions?: string; // TEXT (JSON format)
  image_url?: string; // TEXT
  images?: string; // TEXT (JSON array)
  is_active: number; // INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
  is_serialized: number; // INTEGER NOT NULL DEFAULT 0 CHECK (is_serialized IN (0, 1))
  category_name?: string; // TEXT (denormalized)
  brand_name?: string; // TEXT (denormalized)
  supplier_name?: string; // TEXT (denormalized)
  created_at: string; // TEXT DEFAULT (datetime('now'))
  updated_at: string; // TEXT DEFAULT (datetime('now'))
}

export interface Category {
  id: string; // TEXT PRIMARY KEY
  name: string; // TEXT UNIQUE NOT NULL
  description?: string; // TEXT
  color?: string; // TEXT
  icon?: string; // TEXT
  parent_id?: string; // TEXT FK → categories.id
  sort_order: number; // INTEGER DEFAULT 0
  is_active: number; // INTEGER DEFAULT 1 CHECK (is_active IN (0, 1))
  created_at: string; // TEXT DEFAULT (datetime('now'))
  updated_at: string; // TEXT DEFAULT (datetime('now'))
}

export interface Brand {
  id: string; // TEXT PRIMARY KEY
  name: string; // TEXT NOT NULL UNIQUE
  description?: string; // TEXT
  logo_url?: string; // TEXT
  website?: string; // TEXT
  contact_email?: string; // TEXT
  contact_phone?: string; // TEXT
  is_active: number; // INTEGER DEFAULT 1 CHECK (is_active IN (0, 1))
  created_at: string; // TEXT DEFAULT (datetime('now'))
  updated_at: string; // TEXT DEFAULT (datetime('now'))
}

export interface Supplier {
  id: string; // TEXT PRIMARY KEY
  code: string; // TEXT NOT NULL UNIQUE
  name: string; // TEXT NOT NULL
  contact_person?: string; // TEXT
  email?: string; // TEXT
  phone?: string; // TEXT
  address?: string; // TEXT
  tax_number?: string; // TEXT
  payment_terms?: string; // TEXT
  credit_limit_cents: number; // INTEGER DEFAULT 0 CHECK (credit_limit_cents >= 0)
  is_active: number; // INTEGER DEFAULT 1 CHECK (is_active IN (0, 1))
  created_at: string; // TEXT DEFAULT (datetime('now'))
  updated_at: string; // TEXT DEFAULT (datetime('now'))
}

export interface Customer {
  id: string; // TEXT PRIMARY KEY
  name: string; // TEXT NOT NULL
  email?: string; // TEXT
  phone?: string; // TEXT
  address?: string; // TEXT
  date_of_birth?: string; // TEXT (ISO 8601: '1990-05-15')
  gender?: string; // TEXT CHECK (gender IN ('male', 'female', 'other'))
  customer_type: string; // TEXT DEFAULT 'regular' CHECK (customer_type IN ('regular', 'vip', 'wholesale'))
  company_name?: string; // TEXT
  tax_number?: string; // TEXT
  
  // Loyalty & Statistics
  loyalty_points: number; // INTEGER DEFAULT 0 CHECK (loyalty_points >= 0)
  total_spent_cents: number; // INTEGER DEFAULT 0 CHECK (total_spent_cents >= 0)
  visit_count: number; // INTEGER DEFAULT 0 CHECK (visit_count >= 0)
  last_visit?: string; // TEXT
  
  // Credit management
  credit_limit_cents: number; // INTEGER DEFAULT 0 CHECK (credit_limit_cents >= 0)
  current_balance_cents: number; // INTEGER DEFAULT 0
  
  // Preferences
  preferences?: string; // TEXT (JSON)
  tags?: string; // TEXT (JSON array)
  
  is_active: number; // INTEGER DEFAULT 1 CHECK (is_active IN (0, 1))
  created_at: string; // TEXT DEFAULT (datetime('now'))
  updated_at: string; // TEXT DEFAULT (datetime('now'))
}

export interface User {
  id: string; // TEXT PRIMARY KEY
  username: string; // TEXT UNIQUE NOT NULL
  email: string; // TEXT UNIQUE NOT NULL
  password_hash: string; // TEXT NOT NULL
  full_name: string; // TEXT NOT NULL
  phone?: string; // TEXT
  avatar_url?: string; // TEXT
  role: string; // TEXT NOT NULL DEFAULT 'cashier' CHECK (role IN ('admin', 'manager', 'cashier', 'employee'))
  tenant_id: string; // TEXT DEFAULT 'default'
  store_id?: string; // TEXT FK → stores.id
  is_active: number; // INTEGER DEFAULT 1 CHECK (is_active IN (0, 1))
  email_verified: number; // INTEGER DEFAULT 0 CHECK (email_verified IN (0, 1))
  last_login_at?: string; // TEXT
  created_at: string; // TEXT DEFAULT (datetime('now'))
  updated_at: string; // TEXT DEFAULT (datetime('now'))
}

export interface Store {
  id: string; // TEXT PRIMARY KEY
  name: string; // TEXT NOT NULL
  code?: string; // TEXT UNIQUE
  address?: string; // TEXT
  phone?: string; // TEXT
  email?: string; // TEXT
  tax_number?: string; // TEXT
  currency: string; // TEXT DEFAULT 'VND'
  timezone: string; // TEXT DEFAULT 'Asia/Ho_Chi_Minh'
  is_active: number; // INTEGER DEFAULT 1 CHECK (is_active IN (0, 1))
  settings?: string; // TEXT (JSON configuration)
  created_at: string; // TEXT DEFAULT (datetime('now'))
  updated_at: string; // TEXT DEFAULT (datetime('now'))
}

// =============================================================================
// INVENTORY TYPES
// =============================================================================

export interface InventoryMovementBase {
  id: string;
  tenant_id: string;
  product_id: string;
  variant_id?: string;
  transaction_type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  reason?: string;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  store_id?: string;
  user_id?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_name: string;
  variant_value: string;
  sku?: string;
  barcode?: string;
  price_adjustment: number;
  cost_adjustment: number;
  stock: number;
  min_stock: number;
  max_stock: number;
  weight?: number;
  dimensions?: string;
  image_url?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// SALES/ORDERS TYPES
// =============================================================================

export interface Order {
  id: string; // TEXT PRIMARY KEY
  order_number: string; // TEXT UNIQUE NOT NULL
  customer_id?: string; // TEXT FK → customers.id
  user_id: string; // TEXT NOT NULL FK → users.id
  store_id: string; // TEXT NOT NULL FK → stores.id
  status: string; // TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'completed', 'cancelled', 'refunded'))
  subtotal_cents: number; // INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0)
  discount_cents: number; // INTEGER DEFAULT 0 CHECK (discount_cents >= 0)
  tax_cents: number; // INTEGER DEFAULT 0 CHECK (tax_cents >= 0)
  total_cents: number; // INTEGER NOT NULL DEFAULT 0 CHECK (total_cents >= 0)
  notes?: string; // TEXT
  receipt_printed: number; // INTEGER DEFAULT 0 CHECK (receipt_printed IN (0, 1))
  customer_name?: string; // TEXT (denormalized)
  customer_phone?: string; // TEXT (denormalized)
  user_name?: string; // TEXT (denormalized)
  created_at: string; // TEXT DEFAULT (datetime('now'))
  updated_at: string; // TEXT DEFAULT (datetime('now'))
}

export interface POSOrder {
  id: string;
  order_number: string;
  tenant_id: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: string;
  payment_status: string;
  amount_paid: number;
  change_given: number;
  reference_number?: string;
  status: string;
  notes?: string;
  created_by?: string;
  updated_by?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string; // TEXT PRIMARY KEY
  order_id: string; // TEXT NOT NULL FK → orders.id
  product_id: string; // TEXT NOT NULL FK → products.id
  variant_id?: string; // TEXT FK → product_variants.id
  quantity: number; // INTEGER NOT NULL CHECK (quantity > 0)
  unit_price_cents: number; // INTEGER NOT NULL CHECK (unit_price_cents >= 0)
  total_price_cents: number; // INTEGER NOT NULL CHECK (total_price_cents >= 0)
  discount_cents: number; // INTEGER DEFAULT 0 CHECK (discount_cents >= 0)
  product_name: string; // TEXT NOT NULL (denormalized)
  product_sku: string; // TEXT NOT NULL (denormalized)
  created_at: string; // TEXT DEFAULT (datetime('now'))
}

export interface PaymentMethod {
  id: string; // TEXT PRIMARY KEY
  name: string; // TEXT NOT NULL
  code: string; // TEXT UNIQUE NOT NULL
  description?: string; // TEXT
  fee_percentage: number; // REAL DEFAULT 0
  is_active: number; // INTEGER DEFAULT 1 CHECK (is_active IN (0, 1))
  is_default: number; // INTEGER DEFAULT 0 CHECK (is_default IN (0, 1))
  sort_order: number; // INTEGER DEFAULT 0
  configuration?: string; // TEXT (JSON configuration)
  created_at: string; // TEXT DEFAULT (datetime('now'))
  updated_at: string; // TEXT DEFAULT (datetime('now'))
}

export interface Payment {
  id: string; // TEXT PRIMARY KEY
  order_id: string; // TEXT NOT NULL FK → orders.id
  payment_method_id: string; // TEXT NOT NULL FK → payment_methods.id
  amount_cents: number; // INTEGER NOT NULL CHECK (amount_cents > 0)
  reference?: string; // TEXT (Transaction reference from gateway)
  status: string; // TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
  processed_at: string; // TEXT DEFAULT (datetime('now'))
  created_at: string; // TEXT DEFAULT (datetime('now'))
}

export interface InventoryMovement {
  id: string; // TEXT PRIMARY KEY
  product_id: string; // TEXT NOT NULL FK → products.id
  variant_id?: string; // TEXT FK → product_variants.id
  transaction_type: 'in' | 'out' | 'adjustment' | 'transfer'; // TEXT NOT NULL CHECK
  quantity: number; // INTEGER NOT NULL (Positive/negative quantity)
  unit_cost_cents?: number; // INTEGER (Cost per unit in cents)
  reference_id?: string; // TEXT (order_id, purchase_id, etc.)
  reference_type?: string; // TEXT (order/purchase/adjustment/transfer)
  reason?: string; // TEXT
  notes?: string; // TEXT
  user_id?: string; // TEXT FK → users.id
  store_id?: string; // TEXT FK → stores.id
  product_name?: string; // TEXT (denormalized)
  product_sku?: string; // TEXT (denormalized)
  created_at: string; // TEXT DEFAULT (datetime('now'))
}

export interface Role {
  id: string; // TEXT PRIMARY KEY
  tenant_id: string; // TEXT NOT NULL DEFAULT 'default'
  name: string; // TEXT NOT NULL
  display_name: string; // TEXT NOT NULL
  description?: string; // TEXT
  permissions?: string; // TEXT (JSON array of permissions)
  is_system_role: number; // INTEGER DEFAULT 0 CHECK (is_system_role IN (0, 1))
  created_at: string; // TEXT DEFAULT (datetime('now'))
  updated_at: string; // TEXT DEFAULT (datetime('now'))
}

export interface UserRole {
  id: string; // TEXT PRIMARY KEY
  user_id: string; // TEXT NOT NULL FK → users.id
  role_id: string; // TEXT NOT NULL FK → roles.id
  outlet_id?: string; // TEXT
  assigned_at: string; // TEXT DEFAULT (datetime('now'))
  assigned_by?: string; // TEXT FK → users.id
}

export interface Setting {
  id: string; // TEXT PRIMARY KEY
  key: string; // TEXT NOT NULL UNIQUE
  value?: string; // TEXT
  type: string; // TEXT DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json'))
  category: string; // TEXT DEFAULT 'general'
  description?: string; // TEXT
  is_public: number; // INTEGER DEFAULT 0 CHECK (is_public IN (0, 1))
  is_editable: number; // INTEGER DEFAULT 1 CHECK (is_editable IN (0, 1))
  sort_order: number; // INTEGER DEFAULT 0
  created_at: string; // TEXT DEFAULT (datetime('now'))
  updated_at: string; // TEXT DEFAULT (datetime('now'))
}

// =============================================================================
// PERFORMANCE VIEWS TYPES
// =============================================================================

export interface ProductSummaryView {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  price_cents: number;
  cost_price_cents: number;
  stock: number;
  min_stock: number;
  category_name: string;
  is_active: number;
  category_full_name: string;
  brand_name: string;
  brand_full_name: string;
  supplier_name: string;
}

export interface OrderSummaryView {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  total_cents: number;
  status: string;
  created_at: string;
  cashier_name: string;
  store_name: string;
}

// =============================================================================
// AUDIT & LOGGING TYPES
// =============================================================================

export interface AuditLog {
  id: string;
  tenant_id: string;
  actor_id: string;
  action: string;
  entity: string;
  entity_id: string;
  table_name?: string;
  record_id?: string;
  data_json?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface UserSession {
  id: string;
  tenant_id: string;
  user_id: string;
  session_token: string;
  device_info?: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: string;
  created_at: string;
}

// =============================================================================
// SYSTEM TYPES
// =============================================================================

export interface Setting {
  id: string;
  tenant_id: string;
  category: string;
  key: string;
  value: string;
  data_type: string;
  is_public: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface TaxRate {
  id: string;
  tenant_id: string;
  name: string;
  rate_percentage: number;
  description?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// PROMOTIONS TYPES
// =============================================================================

export interface Promotion {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  type: string;
  discount_type: string;
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  usage_limit_per_customer?: number;
  applicable_products?: string;
  applicable_categories?: string;
  start_date: string;
  end_date: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface PromotionUsage {
  id: string;
  tenant_id: string;
  promotion_id: string;
  customer_id?: string;
  order_id: string;
  usage_count: number;
  created_at: string;
}