/**
 * Standardized API Types cho SmartPOS System
 * 100% Consistent API Response Format
 * Tuân thủ REST API Best Practices
 */

// =============================================================================
// BASE API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
  errors?: ApiError[];
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

export interface ApiMeta {
  requestId?: string;
  version?: string;
  duration?: number;
  [key: string]: any;
}

// =============================================================================
// PAGINATION TYPES
// =============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filter?: Record<string, any>;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: PaginationInfo;
  filters?: Record<string, any>;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
}

// =============================================================================
// COMMON QUERY PARAMETERS
// =============================================================================

export interface BaseQueryParams {
  tenant_id?: string;
  outlet_id?: string;
  include?: string[]; // Related data to include
  fields?: string[]; // Specific fields to return
}

export interface DateRangeQuery {
  start_date?: string;
  end_date?: string;
  date_field?: string; // Which date field to filter on
}

export interface SearchQuery {
  q?: string; // General search query
  search_fields?: string[]; // Fields to search in
}

// =============================================================================
// AUTHENTICATION & AUTHORIZATION
// =============================================================================

export interface AuthTokenPayload {
  userId: string;
  email: string;
  username?: string;
  fullName: string;
  role: string;
  permissions: string[];
  tenantId: string;
  outletId?: string;
  sessionId: string;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
}

export interface LoginRequest {
  identifier: string; // username or email
  password: string;
  remember?: boolean;
  device_info?: {
    browser?: string;
    os?: string;
    device?: string;
  };
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    username?: string;
    fullName: string;
    role: string;
    permissions: string[];
    avatarUrl?: string;
  };
  token: string;
  refreshToken?: string;
  expiresIn: string;
  expiresAt: number;
}

// =============================================================================
// CRUD OPERATION TYPES
// =============================================================================

export interface CreateRequest<T = any> {
  data: Omit<T, 'id' | 'created_at' | 'updated_at'>;
  options?: {
    return_created?: boolean;
    validate_only?: boolean;
  };
}

export interface UpdateRequest<T = any> {
  data: Partial<Omit<T, 'id' | 'created_at'>>;
  options?: {
    return_updated?: boolean;
    validate_only?: boolean;
  };
}

export interface BulkOperation<T = any> {
  items: T[];
  options?: {
    continue_on_error?: boolean;
    return_results?: boolean;
  };
}

// =============================================================================
// BUSINESS ENTITY TYPES
// =============================================================================

// User Management
export interface User {
  id: string;
  tenant_id: string;
  email: string;
  username?: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  last_login_at?: string;
  failed_login_attempts: number;
  locked_until?: string;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  tenant_id: string;
  name: string;
  display_name: string;
  description?: string;
  permissions: string[];
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

// Business Structure
export interface Outlet {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  manager_id?: string;
  timezone: string;
  currency: string;
  tax_rate: number;
  is_active: boolean;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Customer Management
export interface Customer {
  id: string;
  tenant_id: string;
  customer_code?: string;
  full_name: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  city?: string;
  district?: string;
  ward?: string;
  postal_code?: string;
  customer_type: 'individual' | 'business';
  tax_number?: string;
  loyalty_tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  loyalty_points: number;
  total_spent: number;
  total_visits: number;
  last_visit_date?: string;
  notes?: string;
  tags?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Product Management
export interface Category {
  id: string;
  tenant_id: string;
  parent_id?: string;
  name: string;
  code?: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  children?: Category[];
  products_count?: number;
}

export interface Product {
  id: string;
  tenant_id: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  category_id?: string;
  unit_type: string;
  cost_price: number;
  selling_price: number;
  min_price?: number;
  tax_rate: number;
  has_variants: boolean;
  track_stock: boolean;
  track_serial: boolean;
  min_stock: number;
  warranty_period_days: number;
  warranty_type: 'none' | 'store' | 'manufacturer';
  images?: string[];
  attributes?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
  variants?: ProductVariant[];
  stock_levels?: StockLevel[];
}

export interface ProductVariant {
  id: string; // TEXT PK per detailed schema
  product_id: string; // TEXT NOT NULL FK → products.id
  variant_name: string; // TEXT NOT NULL per detailed schema
  sku: string; // TEXT UNIQUE NOT NULL
  price_cents: number; // INTEGER NOT NULL CHECK (price_cents >= 0)
  cost_price_cents: number; // INTEGER NOT NULL CHECK (cost_price_cents >= 0)
  stock: number; // INTEGER DEFAULT 0 CHECK (stock >= 0)
  attributes: string; // TEXT JSON {"color":"red","size":"L"}
  is_active: boolean; // INTEGER DEFAULT 1
  created_at: string;
  updated_at: string;
  // Helper properties for UI compatibility
  cost_price?: number; // Computed: cost_price_cents / 100
  selling_price?: number; // Computed: price_cents / 100
}

// Supplier Management
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
  is_active: boolean;
  created_at: string;
  updated_at: string;
  contacts?: SupplierContact[];
  products?: SupplierProduct[];
}

export interface SupplierContact {
  id: string;
  supplier_id: string;
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  is_primary: boolean;
}

export interface SupplierProduct {
  id: string;
  supplier_id: string;
  product_id: string;
  supplier_sku?: string;
  supplier_price?: number;
  currency: string;
  moq: number;
  pack_size: number;
  lead_time_override?: number;
  is_preferred: boolean;
  last_updated: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier_name: string;
  status: 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';
  order_date: string;
  expected_delivery: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  items: PurchaseOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  received_quantity?: number;
  notes?: string;
}

export interface CartItem {
  product_id: string;
  variant_id?: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  notes?: string;
}

export interface CustomerInfo {
  customer_id?: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  customer_name?: string;
}

// Inventory Management
export interface Warehouse {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  outlet_id?: string;
  address?: string;
  is_main: boolean;
  is_active: boolean;
  created_at: string;
}

export interface StockLevel {
  id: string;
  product_id: string;
  variant_id?: string;
  store_id: string;
  quantity: number;
  reserved_quantity: number;
  updated_at: string;
  product?: Product;
  variant?: ProductVariant;
  warehouse?: Warehouse;
}

export interface StockMovement {
  id: string;
  product_id: string;
  variant_id?: string;
  store_id: string;
  movement_type: 'sale' | 'purchase' | 'adjustment' | 'transfer_in' | 'transfer_out' | 'return';
  quantity: number;
  reference_type?: string;
  reference_id?: string;
  unit_cost?: number;
  notes?: string;
  created_by?: string;
  created_at: string;
}

// Sales & Invoicing
export interface Invoice {
  id: string;
  tenant_id: string;
  invoice_number: string;
  outlet_id: string;
  customer_id?: string;
  cashier_id: string;
  invoice_date: string;
  due_date?: string;
  status: 'draft' | 'pending' | 'completed' | 'cancelled' | 'refunded';
  payment_status: 'unpaid' | 'partially_paid' | 'paid' | 'overpaid';
  subtotal: number;
  discount_amount: number;
  discount_percentage: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  currency: string;
  notes?: string;
  printed_count: number;
  is_void: boolean;
  void_reason?: string;
  voided_by?: string;
  voided_at?: string;
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[];
  payments?: Payment[];
  customer?: Customer;
  cashier?: User;
  outlet?: Outlet;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
  serial_number?: string;
  product?: Product;
  variant?: ProductVariant;
}

export interface Payment {
  id: string;
  tenant_id: string;
  payment_number?: string;
  invoice_id: string;
  payment_method_id: string;
  amount: number;
  currency: string;
  exchange_rate: number;
  reference_number?: string;
  gateway_transaction_id?: string;
  gateway_response?: Record<string, any>;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  processed_at?: string;
  created_by: string;
  created_at: string;
  payment_method?: PaymentMethod;
}

export interface PaymentMethod {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  type: 'cash' | 'card' | 'e_wallet' | 'bank_transfer' | 'credit';
  is_active: boolean;
  settings?: Record<string, any>;
  created_at: string;
}

// Warranty Management
export interface WarrantyPolicy {
  id: string;
  tenant_id: string;
  name: string;
  applies_to: 'product' | 'category' | 'all';
  target_id?: string;
  period_days: number;
  warranty_type: 'store' | 'manufacturer' | 'extended';
  coverage_type: 'parts_only' | 'labor_only' | 'parts_labor';
  conditions?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WarrantyRecord {
  id: string;
  tenant_id: string;
  warranty_number: string;
  invoice_id: string;
  invoice_item_id: string;
  customer_id: string;
  product_id: string;
  variant_id?: string;
  serial_number?: string;
  imei?: string;
  policy_id: string;
  issue_date: string;
  expiry_date: string;
  status: 'active' | 'expired' | 'claimed' | 'void';
  warranty_card_printed: boolean;
  created_at: string;
  customer?: Customer;
  product?: Product;
  policy?: WarrantyPolicy;
  claims?: WarrantyClaim[];
}

export interface WarrantyClaim {
  id: string;
  tenant_id: string;
  claim_number: string;
  warranty_record_id: string;
  customer_id: string;
  claim_type: 'repair' | 'replace' | 'refund';
  problem_description: string;
  urgency: 'low' | 'normal' | 'high' | 'critical';
  status: 'new' | 'triage' | 'approved' | 'rejected' | 'in_service' | 'repaired' | 'completed' | 'cancelled';
  estimated_cost: number;
  final_cost: number;
  assigned_to?: string;
  service_center_id?: string;
  estimated_completion?: string;
  actual_completion?: string;
  resolution_notes?: string;
  customer_satisfaction?: number;
  attachments?: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  warranty_record?: WarrantyRecord;
  assignee?: User;
  actions?: WarrantyClaimAction[];
}

export interface WarrantyClaimAction {
  id: string;
  claim_id: string;
  action_type: 'status_change' | 'note_added' | 'assignment' | 'completion';
  old_status?: string;
  new_status?: string;
  notes?: string;
  attachments?: string[];
  created_by: string;
  created_at: string;
  user?: User;
}

// =============================================================================
// DASHBOARD & ANALYTICS TYPES
// =============================================================================

export interface DashboardStats {
  today_sales: number;
  today_revenue: number;
  total_customers: number;
  total_products: number;
  low_stock_count: number;
  pending_orders: number;
  active_warranties: number;
  pending_claims: number;
}

export interface SalesAnalytics {
  period: string;
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  top_products: TopProduct[];
  revenue_by_date: RevenueByDate[];
  sales_by_category: SalesByCategory[];
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  sku: string;
  quantity_sold: number;
  revenue: number;
  profit: number;
}

export interface RevenueByDate {
  date: string;
  revenue: number;
  orders: number;
}

export interface SalesByCategory {
  category_id: string;
  category_name: string;
  revenue: number;
  percentage: number;
}

// =============================================================================
// SYSTEM SETTINGS & CONFIGURATION
// =============================================================================

export interface SystemSetting {
  id: string;
  tenant_id: string;
  setting_key: string;
  setting_value: string;
  setting_type: 'string' | 'number' | 'boolean' | 'json';
  category: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplate {
  id: string;
  tenant_id: string;
  name: string;
  event_type: string;
  channel: 'email' | 'sms' | 'push' | 'webhook';
  subject_template?: string;
  body_template: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// AUDIT & ACTIVITY TYPES
// =============================================================================

export interface AuditLog {
  id: string;
  tenant_id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  outlet_id?: string;
  created_at: string;
  user?: User;
}

// =============================================================================
// EXPORT ALL TYPES
// =============================================================================

export * from './api'; // Re-export existing types for backwards compatibility