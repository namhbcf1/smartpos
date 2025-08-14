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

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

// User Management Types
export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  permissions: Permission[];
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  phone?: string;
  department?: string;
}

export type UserRole = 'admin' | 'manager' | 'cashier' | 'inventory' | 'viewer';

export interface Permission {
  id: number;
  resource: string;
  action: string;
  granted: boolean;
  created_at: string;
}

export interface Role {
  id: number;
  name: UserRole;
  description: string;
  permissions: Permission[];
  created_at: string;
  updated_at: string;
}

// Product Management Types
export interface Product {
  id: number;
  name: string;
  sku: string;
  description?: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  min_stock_level: number;
  max_stock_level?: number;
  category_id: number;
  category_name: string;
  supplier_id?: number;
  supplier_name?: string;
  barcode?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  warranty_period_months?: number;
  serial_tracking_enabled: boolean;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: number;
  product_id: number;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  attributes: Record<string, string>;
  created_at: string;
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
  id: number;
  product_id: number;
  product_name: string;
  transaction_type: StockTransactionType;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  unit_cost?: number;
  total_cost?: number;
  reference?: string;
  notes?: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  related_order_id?: number;
  related_sale_id?: number;
}

export type StockTransactionType = 'in' | 'out' | 'adjustment' | 'transfer' | 'return' | 'damage';

export interface StockLevel {
  product_id: number;
  product_name: string;
  current_quantity: number;
  min_stock_level: number;
  max_stock_level?: number;
  reorder_point: number;
  last_updated: string;
  status: 'normal' | 'low' | 'out' | 'overstock';
}

// Sales Management Types
export interface Sale {
  id: number;
  customer_id?: number;
  customer_name?: string;
  items: SaleItem[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  status: SaleStatus;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  reference?: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  cost_price: number;
  profit: number;
  serial_numbers?: string[];
}

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'vnpay' | 'momo' | 'zalopay';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type SaleStatus = 'pending' | 'completed' | 'cancelled' | 'refunded';

// Customer Management Types
export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country: string;
  is_active: boolean;
  total_purchases: number;
  total_spent: number;
  last_purchase_date?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  loyalty_points: number;
  customer_type: 'regular' | 'vip' | 'wholesale';
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
  credit_limit?: number;
  current_balance: number;
  created_at: string;
  updated_at: string;
  notes?: string;
  performance_rating?: number;
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

// Store Management Types
export interface Store {
  id: number;
  name: string;
  address: string;
  city: string;
  postal_code?: string;
  country: string;
  phone?: string;
  email?: string;
  manager_id?: number;
  manager_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  settings: StoreSettings;
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
  total_revenue: number;
  profit_margin: number;
}

export interface RecentTransaction {
  id: number;
  type: 'sale' | 'purchase' | 'return';
  amount: number;
  customer_name?: string;
  created_at: string;
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
  min_stock_level: number;
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
  price: number;
  cost_price: number;
  stock_quantity: number;
  min_stock_level: number;
  max_stock_level?: number;
  category_id: number;
  supplier_id?: number;
  barcode?: string;
  warranty_period_months?: number;
  serial_tracking_enabled: boolean;
  is_active: boolean;
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
  unit_price: number;
  serial_numbers?: string[];
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
