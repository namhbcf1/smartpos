// API Types - Following rules.md standards
// NO MOCK DATA - Real API responses only

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationInfo;
  timestamp: string;
  requestId: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

// User Management Types - Following detailed schema
export interface User {
  id: string; // TEXT PK according to detailed schema
  username: string;
  email: string;
  password_hash?: string; // For admin management only
  full_name: string;
  role: UserRole;
  permissions?: Permission[]; // Optional - computed from role
  is_active: boolean;
  last_login?: string; // ISO 8601 format
  created_at: string;
  updated_at: string;
}

export type UserRole = 'admin' | 'manager' | 'cashier' | 'inventory' | 'viewer';

export interface Role {
  id: string; // TEXT PK according to detailed schema
  name: string;
  description?: string;
  permissions: string[]; // JSON array per detailed schema
  is_active: boolean;
  created_at: string;
}

// Product Management Types
export interface Product {
  id: number | string;
  name: string;
  sku: string;
  description?: string;
  price_cents: number; // VND x 100 for D1 precision
  cost_price_cents: number; // VND x 100 for D1 precision
  stock: number;
  min_stock: number;
  max_stock?: number;
  category_id: number | string;
  category_name: string;
  supplier_id?: number | string;
  supplier_name?: string;
  barcode?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  warranty_period_months?: number;
  serial_tracking_enabled: boolean;
  variants?: ProductVariant[];
  // Helper properties for UI (computed from cents)
  price?: number; // Computed: price_cents / 100
  cost_price?: number; // Computed: cost_price_cents / 100
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
  // Helper properties for UI
  price?: number; // Computed: price_cents / 100
  cost_price?: number; // Computed: cost_price_cents / 100
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  level: number;
  path: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product_count: number;
}

// Inventory Management Types
export interface StockTransaction {
  id: string; // TEXT PK per detailed schema
  product_id: string; // TEXT NOT NULL FK → products.id
  variant_id?: string; // TEXT FK → product_variants.id
  transaction_type: StockTransactionType; // TEXT NOT NULL
  quantity: number; // INTEGER NOT NULL (số lượng +/-)
  unit_cost_cents?: number; // INTEGER (Giá nhập/xuất per unit VND x 100)
  reference_id?: string; // TEXT (order_id, purchase_id, etc.)
  reference_type?: string; // TEXT (order/purchase/adjustment/transfer)
  reason?: string; // TEXT (Lý do)
  notes?: string; // TEXT (Ghi chú)
  user_id?: string; // TEXT FK → users.id
  store_id?: string; // TEXT FK → stores.id
  product_name?: string; // TEXT Denormalized từ products.name
  product_sku?: string; // TEXT Denormalized từ products.sku
  created_at: string; // TEXT DEFAULT (datetime('now'))

  // Legacy compatibility fields
  previous_quantity?: number; // For UI compatibility
  new_quantity?: number; // For UI compatibility
  reference?: string; // Legacy: use reference_id instead
  created_by?: string; // Legacy: use user_id instead
  created_by_name?: string; // For UI compatibility
  related_order_id?: string; // Legacy: use reference_id instead
  related_sale_id?: string; // Legacy: use reference_id instead
  total_cost_cents?: number; // Computed: unit_cost_cents * quantity

  // Helper properties for UI
  unit_cost?: number; // Computed: unit_cost_cents / 100
  total_cost?: number; // Computed: total_cost_cents / 100
}

export type StockTransactionType = 'in' | 'out' | 'adjustment' | 'transfer' | 'return' | 'damage';

export interface StockLevel {
  product_id: number;
  product_name: string;
  current_quantity: number;
  min_stock: number;
  max_stock?: number;
  // reorder_point removed - not in detailed schema
  last_updated: string;
  status: 'normal' | 'low' | 'out' | 'overstock';
}

// Sales Management Types
export interface Sale {
  id: number;
  customer_id?: number;
  customer_name?: string;
  items: SaleItem[];
  subtotal_cents: number; // VND x 100 for D1 precision
  tax_cents: number; // VND x 100 for D1 precision
  discount_cents: number; // VND x 100 for D1 precision
  total_cents: number; // VND x 100 for D1 precision
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  status: SaleStatus;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  reference?: string;
  // Helper properties for UI
  subtotal?: number; // Computed: subtotal_cents / 100
  tax_amount?: number; // Computed: tax_cents / 100
  discount_amount?: number; // Computed: discount_cents / 100
  total_amount?: number; // Computed: total_cents / 100
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price_cents: number; // VND x 100 for D1 precision
  total_price_cents: number; // VND x 100 for D1 precision
  discount_cents: number; // VND x 100 for D1 precision
  cost_price_cents: number; // VND x 100 for D1 precision
  profit_cents: number; // VND x 100 for D1 precision
  serial_numbers?: string[];
  // Helper properties for UI
  unit_price?: number; // Computed: unit_price_cents / 100
  total_price?: number; // Computed: total_price_cents / 100
  discount_amount?: number; // Computed: discount_cents / 100
  cost_price?: number; // Computed: cost_price_cents / 100
  profit?: number; // Computed: profit_cents / 100
}

// Moved to PaymentMethodCode above for backward compatibility
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type SaleStatus = 'pending' | 'completed' | 'cancelled' | 'refunded';

// Customer Management Types
export interface Customer {
  id: string; // TEXT PK per detailed schema
  name: string; // TEXT NOT NULL
  email?: string; // TEXT
  phone?: string; // TEXT
  address?: string; // TEXT
  date_of_birth?: string; // TEXT (ISO 8601: '1990-05-15')
  gender?: 'male' | 'female' | 'other'; // TEXT
  customer_type: 'regular' | 'vip' | 'wholesale'; // TEXT DEFAULT 'regular'
  loyalty_points: number; // INTEGER DEFAULT 0 CHECK (loyalty_points >= 0)
  total_spent_cents: number; // INTEGER DEFAULT 0 CHECK (total_spent_cents >= 0)
  visit_count: number; // INTEGER DEFAULT 0 CHECK (visit_count >= 0)
  last_visit?: string; // TEXT (ISO 8601)
  is_active: boolean; // INTEGER DEFAULT 1
  created_at: string; // TEXT DEFAULT (datetime('now'))
  updated_at: string; // TEXT DEFAULT (datetime('now'))

  // Legacy compatibility fields
  city?: string; // For backward compatibility
  postal_code?: string; // For backward compatibility
  country?: string; // For backward compatibility
  total_purchases?: number; // Legacy: use visit_count instead
  last_purchase_date?: string; // Legacy: use last_visit instead
  notes?: string; // Legacy field

  // Helper property for UI
  total_spent?: number; // Computed: total_spent_cents / 100
}

// Loyalty Management Types
export interface LoyaltyPointsHistory {
  id: string; // TEXT PK per detailed schema
  customer_id: string; // TEXT NOT NULL FK → customers.id
  points: number; // INTEGER NOT NULL (số điểm +/-)
  type: 'earned' | 'redeemed' | 'expired' | 'adjustment'; // TEXT NOT NULL
  reference_id?: string; // TEXT (order_id hoặc transaction_id)
  reference_type?: string; // TEXT (Loại reference)
  description?: string; // TEXT (Mô tả giao dịch)
  created_at: string; // TEXT DEFAULT (datetime('now'))
}

// Payment Management Types
export interface PaymentMethod {
  id: string; // TEXT PK per detailed schema
  name: string; // TEXT NOT NULL
  code: string; // TEXT UNIQUE NOT NULL
  description?: string; // TEXT
  fee_percentage: number; // REAL DEFAULT 0 (Phí xử lý %)
  is_active: boolean; // INTEGER DEFAULT 1
  created_at: string; // TEXT DEFAULT (datetime('now'))
}

// Legacy Payment Type for backward compatibility
export type PaymentMethodCode = 'cash' | 'card' | 'bank_transfer' | 'vnpay' | 'momo' | 'zalopay';

// Order Management Types (matching detailed schema)
export interface Order {
  id: string; // TEXT PK per detailed schema
  order_number: string; // TEXT UNIQUE NOT NULL
  customer_id?: string; // TEXT FK → customers.id
  user_id: string; // TEXT NOT NULL FK → users.id (cashier)
  store_id: string; // TEXT NOT NULL FK → stores.id
  status: 'draft' | 'pending' | 'completed' | 'cancelled' | 'refunded'; // TEXT NOT NULL DEFAULT 'pending'
  subtotal_cents: number; // INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0)
  discount_cents: number; // INTEGER DEFAULT 0 CHECK (discount_cents >= 0)
  tax_cents: number; // INTEGER DEFAULT 0 CHECK (tax_cents >= 0)
  total_cents: number; // INTEGER NOT NULL DEFAULT 0 CHECK (total_cents >= 0)
  notes?: string; // TEXT
  receipt_printed: boolean; // INTEGER DEFAULT 0 (0=chưa in, 1=đã in)
  customer_name?: string; // TEXT Denormalized từ customers.name
  customer_phone?: string; // TEXT Denormalized từ customers.phone
  user_name?: string; // TEXT Denormalized từ users.full_name
  created_at: string; // TEXT DEFAULT (datetime('now'))
  updated_at: string; // TEXT DEFAULT (datetime('now'))

  // Helper properties for UI
  subtotal?: number; // Computed: subtotal_cents / 100
  discount_amount?: number; // Computed: discount_cents / 100
  tax_amount?: number; // Computed: tax_cents / 100
  total_amount?: number; // Computed: total_cents / 100
}

export interface OrderItem {
  id: string; // TEXT PK per detailed schema
  order_id: string; // TEXT NOT NULL FK → orders.id
  product_id: string; // TEXT NOT NULL FK → products.id
  variant_id?: string; // TEXT FK → product_variants.id
  quantity: number; // INTEGER NOT NULL CHECK (quantity > 0)
  unit_price_cents: number; // INTEGER NOT NULL CHECK (unit_price_cents >= 0)
  total_price_cents: number; // INTEGER NOT NULL CHECK (total_price_cents >= 0)
  discount_cents: number; // INTEGER DEFAULT 0 CHECK (discount_cents >= 0)
  product_name: string; // TEXT Denormalized từ products.name
  product_sku: string; // TEXT Denormalized từ products.sku
  created_at: string; // TEXT DEFAULT (datetime('now'))

  // Helper properties for UI
  unit_price?: number; // Computed: unit_price_cents / 100
  total_price?: number; // Computed: total_price_cents / 100
  discount_amount?: number; // Computed: discount_cents / 100
}

export interface Payment {
  id: string; // TEXT PK per detailed schema
  order_id: string; // TEXT NOT NULL FK → orders.id
  payment_method_id: string; // TEXT NOT NULL FK → payment_methods.id
  amount_cents: number; // INTEGER NOT NULL CHECK (amount_cents > 0)
  reference?: string; // TEXT (Mã giao dịch từ gateway)
  status: 'pending' | 'completed' | 'failed' | 'refunded'; // TEXT NOT NULL DEFAULT 'completed'
  processed_at: string; // TEXT DEFAULT (datetime('now'))
  created_at: string; // TEXT DEFAULT (datetime('now'))

  // Helper property for UI
  amount?: number; // Computed: amount_cents / 100
}

// Supplier Management Types
export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country: string;
  is_active: boolean;
  payment_terms?: string;
  credit_limit_cents?: number; // VND x 100 for D1 precision
  current_balance_cents: number; // VND x 100 for D1 precision
  created_at: string;
  updated_at: string;
  notes?: string;
  performance_rating?: number;
  // Helper properties for UI
  credit_limit?: number; // Computed: credit_limit_cents / 100
  current_balance?: number; // Computed: current_balance_cents / 100
}

// Warranty Management Types
export interface WarrantyRegistration {
  id: number;
  product_id: number;
  product_name: string;
  customer_id: number;
  customer_name: string;
  serial_number: string;
  purchase_date: string;
  warranty_start_date: string;
  warranty_end_date: string;
  warranty_period_months: number;
  status: WarrantyStatus;
  terms_conditions?: string;
  created_at: string;
  updated_at: string;
}

export interface WarrantyClaim {
  id: number;
  warranty_id: number;
  customer_id: number;
  customer_name: string;
  product_name: string;
  serial_number: string;
  issue_description: string;
  claim_date: string;
  status: ClaimStatus;
  resolution?: string;
  resolved_date?: string;
  cost?: number;
  created_at: string;
  updated_at: string;
}

export type WarrantyStatus = 'active' | 'expired' | 'claimed' | 'completed';
export type ClaimStatus = 'pending' | 'in_progress' | 'resolved' | 'rejected';

// Store Management Types - Following detailed schema
export interface Store {
  id: string; // TEXT PK according to detailed schema
  name: string;
  address: string;
  phone: string;
  email: string;
  tax_number?: string;
  business_license?: string;
  logo_url?: string;
  timezone?: string; // DEFAULT 'Asia/Ho_Chi_Minh'
  currency?: string; // DEFAULT 'VND'
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreSettings {
  currency: string;
  timezone: string;
  business_hours: BusinessHours;
  tax_rate: number;
  receipt_template?: string;
  logo_url?: string;
}

export interface BusinessHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  open: boolean;
  open_time?: string;
  close_time?: string;
}

// Analytics & Reporting Types
export interface DashboardStats {
  total_sales: number;
  total_orders: number;
  total_customers: number;
  total_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
  today_sales: number;
  today_orders: number;
  monthly_sales: number;
  monthly_orders: number;
  top_selling_products: TopProduct[];
  recent_transactions: RecentTransaction[];
  sales_chart_data: ChartDataPoint[];
  inventory_alerts: InventoryAlert[];
}

export interface TopProduct {
  product_id: number;
  product_name: string;
  total_quantity: number;
  total_revenue_cents: number; // VND x 100 for D1 precision
  profit_margin_cents: number; // VND x 100 for D1 precision
  // Helper properties for UI
  total_revenue?: number; // Computed: total_revenue_cents / 100
  profit_margin?: number; // Computed: profit_margin_cents / 100
}

export interface RecentTransaction {
  id: number;
  type: 'sale' | 'purchase' | 'return';
  amount_cents: number; // VND x 100 for D1 precision
  customer_name?: string;
  created_at: string;
  // Helper property for UI
  amount?: number; // Computed: amount_cents / 100
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label: string;
}

export interface InventoryAlert {
  product_id: number;
  product_name: string;
  current_quantity: number;
  min_stock: number;
  alert_type: 'low_stock' | 'out_of_stock' | 'overstock';
  created_at: string;
}

// Real-time Types
export interface RealtimeEvent {
  id: string;
  type: RealtimeEventType;
  data: any;
  timestamp: string;
  user_id?: number;
  store_id?: number;
}

export type RealtimeEventType = 
  | 'sale_created'
  | 'sale_updated'
  | 'inventory_updated'
  | 'customer_created'
  | 'product_updated'
  | 'stock_alert'
  | 'user_login'
  | 'system_notification';

export interface RealtimeNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  data?: any;
  timestamp: string;
  read: boolean;
  action_url?: string;
}

// Form Types
export interface LoginForm {
  username: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  full_name: string;
  role?: UserRole;
}

export interface ProductForm {
  name: string;
  sku: string;
  description?: string;
  price_cents: number; // VND x 100 for D1 precision
  cost_price_cents: number; // VND x 100 for D1 precision
  stock: number;
  min_stock: number;
  max_stock?: number;
  category_id: number | string;
  supplier_id?: number | string;
  barcode?: string;
  warranty_period_months?: number;
  serial_tracking_enabled: boolean;
  is_active: boolean;
  // Helper properties for UI (optional)
  price?: number; // For form input: will be converted to price_cents
  cost_price?: number; // For form input: will be converted to cost_price_cents
}

export interface SaleForm {
  customer_id?: number;
  items: SaleItemForm[];
  payment_method: PaymentMethod;
  notes?: string;
}

export interface SaleItemForm {
  product_id: number;
  quantity: number;
  unit_price_cents: number; // VND x 100 for D1 precision
  serial_numbers?: string[];
  // Helper property for UI
  unit_price?: number; // For form input: will be converted to unit_price_cents
}

// Filter Types
export interface ProductFilters {
  search?: string;
  category_id?: number;
  supplier_id?: number;
  price_min?: number;
  price_max?: number;
  stock_status?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  is_active?: boolean;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface SaleFilters {
  customer_id?: number;
  payment_method?: PaymentMethod;
  payment_status?: PaymentStatus;
  status?: SaleStatus;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface InventoryFilters {
  product_id?: number;
  transaction_type?: StockTransactionType;
  date_from?: string;
  date_to?: string;
  created_by?: number;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// API Endpoint Types
export interface ApiEndpoints {
  auth: {
    login: string;
    logout: string;
    register: string;
    refresh: string;
    me: string;
  };
  users: {
    list: string;
    create: string;
    update: string;
    delete: string;
    profile: string;
  };
  products: {
    list: string;
    create: string;
    update: string;
    delete: string;
    detail: string;
    search: string;
  };
  sales: {
    list: string;
    create: string;
    update: string;
    delete: string;
    detail: string;
  };
  inventory: {
    transactions: string;
    stock_levels: string;
    adjustments: string;
    transfers: string;
  };
  customers: {
    list: string;
    create: string;
    update: string;
    delete: string;
    detail: string;
  };
  suppliers: {
    list: string;
    create: string;
    update: string;
    delete: string;
    detail: string;
  };
  warranty: {
    registrations: string;
    claims: string;
    create_claim: string;
    update_claim: string;
  };
  analytics: {
    dashboard: string;
    sales_report: string;
    inventory_report: string;
    customer_report: string;
  };
  realtime: {
    connect: string;
    subscribe: string;
    unsubscribe: string;
  };
}

// Additional types for missing interfaces
export interface DatabaseHealth {
  status: 'healthy' | 'warning' | 'critical';
  last_check: string;
  metrics: {
    connections: number;
    queries_per_second: number;
    average_response_time: number;
    error_rate: number;
  };
}

export interface DatabasePerformanceMetrics {
  query_performance: {
    average_duration: number;
    slow_queries: number;
    total_queries: number;
  };
  connection_metrics: {
    active_connections: number;
    max_connections: number;
    connection_utilization: number;
  };
  storage_metrics: {
    total_size_mb: number;
    available_space_mb: number;
    index_size_mb: number;
  };
}

export interface UserActivity {
  id: number;
  user_id: number;
  action: string;
  resource: string;
  details?: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface UserSession {
  id: string;
  user_id: number;
  ip_address: string;
  user_agent: string;
  created_at: string;
  last_activity: string;
  is_active: boolean;
}

export interface WebSocketMessage {
  type: string;
  event: string;
  data: any;
  timestamp: string;
  id: string;
}



export interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  users_by_role: Record<string, number>;
  recent_registrations: number;
  recent_logins: number;
  average_session_duration: number;
}
