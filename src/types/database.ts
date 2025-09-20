/**
 * Database Schema Types - SmartPOS
 * Matches COMPLETE_DATABASE_SCHEMA_DETAILED.md exactly
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
  max_stock: number; // INTEGER NOT NULL DEFAULT 100
  unit: string; // TEXT NOT NULL DEFAULT 'piece'
  weight_grams?: number; // INTEGER CHECK (weight_grams > 0)
  dimensions?: string; // TEXT (JSON format)
  image_url?: string; // TEXT
  images?: string; // TEXT (JSON array)
  is_active: number; // INTEGER NOT NULL DEFAULT 1
  is_serialized: number; // INTEGER NOT NULL DEFAULT 0
  category_name?: string; // TEXT (denormalized)
  brand_name?: string; // TEXT (denormalized)
  created_at: string; // TEXT DEFAULT (datetime('now'))
  updated_at: string; // TEXT DEFAULT (datetime('now'))
}

export interface Category {
  id: string;
  tenant_id: string;
  parent_id?: string;
  name: string;
  code?: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  name_vi?: string;
  description?: string;
  website?: string;
  logo_url?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_number?: string;
  payment_terms_days: number;
  lead_time_days: number;
  default_currency: string;
  rating: number;
  notes?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string; // TEXT PRIMARY KEY
  name: string; // TEXT NOT NULL
  email?: string; // TEXT UNIQUE
  phone?: string; // TEXT
  address?: string; // TEXT
  date_of_birth?: string; // TEXT (ISO 8601)
  gender?: string; // TEXT
  customer_type: string; // TEXT NOT NULL DEFAULT 'regular' CHECK (customer_type IN ('regular', 'vip', 'wholesale'))
  loyalty_points: number; // INTEGER NOT NULL DEFAULT 0 CHECK (loyalty_points >= 0)
  total_spent_cents: number; // INTEGER NOT NULL DEFAULT 0 CHECK (total_spent_cents >= 0)
  visit_count: number; // INTEGER NOT NULL DEFAULT 0 CHECK (visit_count >= 0)
  last_visit?: string; // TEXT (ISO 8601)
  is_active: number; // INTEGER NOT NULL DEFAULT 1
  created_at: string; // TEXT DEFAULT (datetime('now'))
  updated_at: string; // TEXT DEFAULT (datetime('now'))
}

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  username?: string;
  password_hash: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  is_active: number;
  email_verified: number;
  phone_verified: number;
  last_login_at?: string;
  failed_login_attempts: number;
  locked_until?: string;
  password_reset_token?: string;
  password_reset_expires?: string;
  two_factor_secret?: string;
  two_factor_enabled: number;
  created_at: string;
  updated_at: string;
  role: string;
  store_id: string;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  tax_number?: string;
  business_license?: string;
  website?: string;
  logo_url?: string;
  manager_id?: string;
  timezone: string;
  currency: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// INVENTORY TYPES
// =============================================================================

export interface InventoryMovement {
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
  id: string;
  tenant_id: string;
  order_code: string;
  customer_id?: string;
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  created_at: string;
  updated_at: string;
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

export interface POSOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount: number;
  tax_amount: number;
  notes?: string;
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