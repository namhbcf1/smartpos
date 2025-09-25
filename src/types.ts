// Import Cloudflare types

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

  // Payment Gateway Configuration
  VNPAY_TMN_CODE?: string;
  VNPAY_HASH_SECRET?: string;
  VNPAY_URL?: string;
  MOMO_PARTNER_CODE?: string;
  MOMO_ACCESS_KEY?: string;
  MOMO_SECRET_KEY?: string;
  MOMO_ENDPOINT?: string;
  ZALOPAY_APP_ID?: string;
  ZALOPAY_KEY1?: string;
  ZALOPAY_KEY2?: string;
  ZALOPAY_ENDPOINT?: string;

  // Cloudflare R2 Storage
  CLOUDFLARE_R2_ACCESS_KEY_ID?: string;
  CLOUDFLARE_R2_SECRET_ACCESS_KEY?: string;
  CLOUDFLARE_R2_BUCKET_UPLOADS?: string;
  CLOUDFLARE_R2_ENDPOINT?: string;

  [key: string]: any; // Index signature for Hono compatibility
}

// Enhanced Hono environment with comprehensive context variables
export interface HonoEnv {
  Bindings: Env;
  Variables: {
    // Authentication context
    user?: {
      id: string; // TEXT PK per detailed schema
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
  id: string; // TEXT PK according to detailed schema
  username: string;
  password_hash: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  last_login: string | null; // ISO 8601 format
  created_at: string;
  updated_at: string;
}

export type UserRole = 'admin' | 'manager' | 'cashier' | 'employee'; // Default 'employee' per detailed schema

export interface UserResponse {
  id: string; // TEXT PK according to detailed schema
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  lastLogin: string | null; // ISO 8601 format
  createdAt: string;
  updatedAt: string;
}

// Product related interfaces - Following detailed schema
export interface Product {
  id: string; // TEXT PK per detailed schema
  name: string;
  sku: string;
  barcode: string | null;
  description: string | null;

  // D1 OPTIMIZED: INTEGER cents pricing (VND x 100)
  price_cents: number; // INTEGER NOT NULL CHECK (price_cents >= 0)
  cost_price_cents: number; // INTEGER NOT NULL CHECK (cost_price_cents >= 0)

  // Inventory
  stock: number;
  min_stock: number;
  max_stock: number;
  unit: string;

  // Physical attributes
  weight_grams: number | null; // INTEGER per detailed schema
  dimensions: string | null; // JSON: {"length": 10, "width": 5, "height": 2}

  // Foreign keys
  category_id: string | null; // TEXT FK → categories.id
  brand_id: string | null; // TEXT FK → brands.id
  supplier_id: string | null; // TEXT FK → suppliers.id
  store_id: string; // TEXT DEFAULT 'store-1' FK → stores.id

  // Media
  image_url: string | null;
  images: string | null; // JSON array of URLs

  // Denormalized fields for performance
  category_name: string | null;
  brand_name: string | null;

  // Status
  is_active: boolean;
  is_serialized: boolean;

  created_at: string;
  updated_at: string;
}

export interface ProductResponse {
  id: string; // TEXT PK per detailed schema
  name: string;
  sku: string;
  barcode: string | null;
  description: string | null;

  // D1 OPTIMIZED: INTEGER cents pricing (VND x 100)
  price_cents: number;
  cost_price_cents: number;

  category_id: string | null;
  categoryName: string | null;
  brand_id: string | null;
  brandName: string | null;
  stock: number;
  min_stock: number;
  is_active: boolean;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// Category related interfaces - Following detailed schema
export interface Category {
  id: string; // TEXT PK according to detailed schema
  name: string;
  description: string | null;
  parent_id: string | null; // TEXT FK → categories.id
  image_url: string | null; // R2 storage URL
  sort_order: number; // INTEGER DEFAULT 0
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryResponse {
  id: string; // TEXT PK according to detailed schema
  name: string;
  description: string | null;
  parent_id: string | null;
  parentName: string | null;
  is_active: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

// Sale related interfaces
export interface Sale {
  id: string; // TEXT PK per detailed schema
  receipt_number: string;
  store_id: string; // TEXT FK → stores.id per detailed schema
  customer_id: string | null; // TEXT FK → customers.id per detailed schema
  user_id: string; // TEXT FK → users.id per detailed schema
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
  id: string; // TEXT PK per detailed schema
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
  id: string; // TEXT PK per detailed schema
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
  id: string; // TEXT PK per detailed schema
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
  id: string; // TEXT PK per detailed schema
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
  id: string; // TEXT PK per detailed schema
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

// Store related interfaces - Following detailed schema
export interface Store {
  id: string; // TEXT PK according to detailed schema
  name: string;
  address: string;
  phone: string;
  email: string;
  tax_number: string | null;
  business_license: string | null;
  logo_url: string | null;
  timezone: string; // DEFAULT 'Asia/Ho_Chi_Minh'
  currency: string; // DEFAULT 'VND'
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreResponse {
  id: string; // TEXT PK according to detailed schema
  name: string;
  address: string;
  phone: string;
  email: string;
  taxNumber: string | null;
  businessLicense: string | null;
  logoUrl: string | null;
  timezone: string;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Inventory related interfaces
export interface InventoryTransaction {
  id: string; // TEXT PK per detailed schema
  product_id: string; // TEXT FK → products.id per detailed schema
  store_id: string; // TEXT FK → stores.id per detailed schema
  user_id: string; // TEXT FK → users.id per detailed schema
  transaction_type: InventoryTransactionType;
  quantity: number;
  reference_id: string | null; // TEXT reference per detailed schema
  reference_type: ReferenceType | null;
  notes: string | null;
  created_at: string;
}

export type InventoryTransactionType = 'stock_in' | 'stock_out' | 'adjustment' | 'transfer_in' | 'transfer_out' | 'sale' | 'return';
export type ReferenceType = 'sale' | 'purchase' | 'adjustment' | 'transfer' | 'return';

export interface StockIn {
  id: string; // TEXT PK per detailed schema
  reference_number: string;
  supplier_id: string; // TEXT FK → suppliers.id per detailed schema
  store_id: string; // TEXT FK → stores.id per detailed schema
  user_id: string; // TEXT FK → users.id per detailed schema
  total_amount: number;
  payment_status: PaymentStatus;
  payment_amount: number;
  payment_method: PaymentMethod;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockInItem {
  id: string; // TEXT PK per detailed schema
  stock_in_id: number;
  product_id: number;
  quantity: number;
  cost_price: number;
  expiry_date: string | null;
  total_amount: number;
  created_at: string;
}

export interface StockInResponse {
  id: string; // TEXT PK per detailed schema
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
  id: string; // TEXT PK per detailed schema
  productId: number;
  productName: string;
  quantity: number;
  costPrice: number;
  expiryDate: string | null;
  totalAmount: number;
}

// Supplier related interfaces - Following detailed schema
export interface Supplier {
  id: string; // TEXT PK per detailed schema
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_number: string | null;
  payment_terms: string | null;
  credit_limit_cents: number; // INTEGER DEFAULT 0 (VND cents)
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierResponse {
  id: string; // TEXT PK per detailed schema
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
  id: string; // TEXT PK per detailed schema
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
  id: string; // TEXT PK per detailed schema
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
  store_id: string | null; // TEXT FK → stores.id per detailed schema
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
    id: string; // TEXT PK per detailed schema
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
  error?: string;
  errors?: Record<string, string[]>;
  timestamp?: string;
  details?: any;
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
  customer_id?: string; // TEXT FK → customers.id per detailed schema
  store_id?: string; // TEXT FK → stores.id per detailed schema
  user_id?: string; // TEXT FK → users.id per detailed schema
}

// Re-export warranty types
export * from './types/warranty';