// Environment variables interface with index signature for Hono compatibility
export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  SESSIONS: KVNamespace;
  SMARTPOS_DATA: KVNamespace;
  NOTIFICATIONS: DurableObjectNamespace;
  INVENTORY_SYNC: DurableObjectNamespace;
  POS_SYNC: DurableObjectNamespace;
  WARRANTY_SYNC: DurableObjectNamespace;
  ENVIRONMENT: string;
  API_VERSION: string;
  JWT_SECRET: string;
  ENCRYPTION_KEY: string;
  CORS_ORIGINS: string;
  WORKER_API_URL: string;
  DEFAULT_LANGUAGE: string;
  DEFAULT_TIMEZONE: string;
  DEFAULT_CURRENCY: string;
  BUSINESS_COUNTRY: string;
  TAX_RATE: string;
  CURRENCY_SYMBOL: string;
  BUSINESS_HOURS_START: string;
  BUSINESS_HOURS_END: string;
  [key: string]: any; // Index signature for Hono compatibility
}

// Enhanced Hono environment with comprehensive context variables
export interface HonoEnv {
  Bindings: Env;
  Variables: {
    // Authentication context
    user?: {
      id: number;
      username: string;
      email: string;
      role: string;
      store_id: number;
      permissions: string[];
      last_login: string;
      is_active: boolean;
    };

    // JWT payload
    jwtPayload?: JwtPayload;

    // Store context
    store_id?: number;
    store_name?: string;
    store_permissions?: string[];

    // Validation results - TYPESCRIPT FIXED: Proper types instead of any
    validated?: Record<string, unknown>;
    validatedQuery?: Record<string, string | string[]>;
    validatedBody?: Record<string, unknown>;
    validatedParams?: Record<string, string>;

    // Request context
    request_id?: string;
    start_time?: number;
    client_ip?: string;
    user_agent?: string;

    // Rate limiting
    rate_limit_key?: string;
    rate_limit_remaining?: number;

    // Cache context
    cache_key?: string;
    cache_ttl?: number;

    // Transaction context
    transaction_id?: string;
    transaction_type?: string;

    // Audit context
    audit_action?: string;
    audit_resource?: string;
    audit_resource_id?: number;

    // Business context
    business_date?: string;
    fiscal_year?: number;
    tax_rate?: number;
    currency?: string;
    timezone?: string;

    // Performance monitoring
    db_query_count?: number;
    cache_hit_count?: number;
    cache_miss_count?: number;

    // Error context - TYPESCRIPT FIXED: Proper error details type
    error_code?: string;
    error_details?: {
      message?: string;
      stack?: string;
      code?: string;
      statusCode?: number;
      [key: string]: unknown;
    };

    // Security context
    security_level?: 'low' | 'medium' | 'high' | 'critical';
    access_level?: 'read' | 'write' | 'admin';

    // Feature flags
    features?: Record<string, boolean>;

    // Localization
    language?: string;
    locale?: string;

    // Session context - TYPESCRIPT FIXED: Proper session data type
    session_id?: string;
    session_data?: {
      user_preferences?: Record<string, unknown>;
      cart_items?: unknown[];
      last_activity?: string;
      [key: string]: unknown;
    };
  };
}

// User related interfaces
export interface User {
  id: number;
  username: string;
  password_hash: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  store_id: number;
  avatar_url: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'admin' | 'manager' | 'cashier' | 'inventory';

export interface UserResponse {
  id: number;
  username: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  storeId: number;
  avatarUrl: string | null;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

// Product related interfaces
export interface Product {
  id: number;
  name: string;
  description: string | null;
  sku: string;
  barcode: string | null;
  category_id: number;
  price: number;
  cost_price: number;
  tax_rate: number;
  stock_quantity: number;
  stock_alert_threshold: number;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProductResponse {
  id: number;
  name: string;
  description: string | null;
  sku: string;
  barcode: string | null;
  categoryId: number;
  categoryName: string;
  price: number;
  costPrice: number;
  taxRate: number;
  stockQuantity: number;
  stockAlertThreshold: number;
  isActive: boolean;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// Category related interfaces
export interface Category {
  id: number;
  name: string;
  description: string | null;
  parent_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CategoryResponse {
  id: number;
  name: string;
  description: string | null;
  parentId: number | null;
  parentName: string | null;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

// Sale related interfaces
export interface Sale {
  id: number;
  receipt_number: string;
  store_id: number;
  customer_id: number | null;
  user_id: number;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  sale_status: SaleStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'mobile_payment' | 'credit';
export type PaymentStatus = 'paid' | 'unpaid' | 'partial';
export type SaleStatus = 'completed' | 'returned' | 'cancelled';

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_amount: number;
  subtotal: number;
  created_at: string;
}

export interface SaleResponse {
  id: number;
  receiptNumber: string;
  storeId: number;
  storeName: string;
  customerId: number | null;
  customerName: string | null;
  userId: number;
  userName: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  saleStatus: SaleStatus;
  notes: string | null;
  items: SaleItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface SaleItemResponse {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountAmount: number;
  subtotal: number;
}

// Customer related interfaces - Updated to match customers module
export interface Customer {
  id: number;
  customer_code: string;
  full_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  city?: string;
  district?: string;
  ward?: string;
  postal_code?: string;
  country?: string;
  customer_type: 'individual' | 'business';
  company_name?: string;
  tax_number?: string;
  is_vip: boolean;
  vip_level?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  credit_limit?: number;
  current_balance?: number;
  loyalty_points: number;
  total_spent: number;
  total_orders: number;
  average_order_value: number;
  last_order_date?: string;
  registration_date: string;
  is_active: boolean;
  notes?: string;
  preferences?: string; // JSON string
  tags?: string; // JSON string
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export type CustomerGroup = 'regular' | 'vip' | 'wholesale' | 'business';

export interface CustomerResponse {
  id: number;
  fullName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  birthday: string | null;
  loyaltyPoints: number;
  customerGroup: CustomerGroup;
  totalOrders: number;
  totalSpent: number;
  lastPurchase: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// Store related interfaces
export interface Store {
  id: number;
  name: string;
  address: string;
  phone: string | null;
  email: string | null;
  tax_number: string | null;
  is_main: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreResponse {
  id: number;
  name: string;
  address: string;
  phone: string | null;
  email: string | null;
  taxNumber: string | null;
  isMain: boolean;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

// Inventory related interfaces
export interface InventoryTransaction {
  id: number;
  product_id: number;
  store_id: number;
  user_id: number;
  transaction_type: InventoryTransactionType;
  quantity: number;
  reference_id: number | null;
  reference_type: ReferenceType | null;
  notes: string | null;
  created_at: string;
}

export type InventoryTransactionType = 'stock_in' | 'stock_out' | 'adjustment' | 'transfer_in' | 'transfer_out' | 'sale' | 'return';
export type ReferenceType = 'sale' | 'purchase' | 'adjustment' | 'transfer' | 'return';

export interface StockIn {
  id: number;
  reference_number: string;
  supplier_id: number;
  store_id: number;
  user_id: number;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_amount: number;
  payment_method: PaymentMethod;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockInItem {
  id: number;
  stock_in_id: number;
  product_id: number;
  quantity: number;
  cost_price: number;
  expiry_date: string | null;
  total_amount: number;
  created_at: string;
}

export interface StockInResponse {
  id: number;
  referenceNumber: string;
  supplierId: number;
  supplierName: string;
  storeId: number;
  storeName: string;
  userId: number;
  userName: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentAmount: number;
  paymentMethod: PaymentMethod;
  notes: string | null;
  items: StockInItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface StockInItemResponse {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  costPrice: number;
  expiryDate: string | null;
  totalAmount: number;
}

// Supplier related interfaces
export interface Supplier {
  id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_number: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SupplierResponse {
  id: number;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxNumber: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// Financial related interfaces
export interface FinancialTransaction {
  id: number;
  date: string;
  transaction_type: 'income' | 'expense';
  category: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number: string | null;
  reference_id: number | null;
  reference_type: FinanceReferenceType | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type FinanceReferenceType = 'sale' | 'purchase' | 'expense' | 'other';

export interface FinancialTransactionResponse {
  id: number;
  date: string;
  transactionType: 'income' | 'expense';
  category: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  referenceId: number | null;
  referenceType: FinanceReferenceType | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// Settings related interfaces
export interface Setting {
  key: string;
  value: string;
  store_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface SettingsResponse {
  [key: string]: string | number | boolean | null;
}

// Report related interfaces
export interface DashboardStats {
  todaySales: number;
  weekSales: number;
  todayOrders: number;
  weekOrders: number;
  lowStockCount: number;
  productCount: number;
  categoryCount: number;
  salesChart: {
    day: string;
    sales: number;
  }[];
  trendPercent: number;
  pendingOrders: number;
  customerCount: number;
  topProducts: {
    id: number;
    name: string;
    quantity: number;
    total: number;
    image?: string;
  }[];
  salesByCategory: {
    name: string;
    value: number;
  }[];
}

// API response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Auth related interfaces
export interface LoginRequest {
  username: string;
  password: string;
}

export interface JwtPayload {
  sub: number; // User ID
  username: string;
  role: UserRole;
  store: number;
  exp: number; // Expiry timestamp
  iat: number; // Issued at timestamp
}

// Request related types
export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  status?: string;
  category_id?: number;
  is_active?: boolean;
  low_stock?: boolean;
  from_date?: string;
  to_date?: string;
  payment_method?: PaymentMethod;
  payment_status?: PaymentStatus;
  sale_status?: SaleStatus;
  customer_id?: number;
  store_id?: number;
  user_id?: number;
}

// Re-export warranty types
export * from './types/warranty';