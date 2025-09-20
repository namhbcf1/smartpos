// Shared types for SmartPOS applications

export interface Product {
  id: string; // TEXT PK per detailed schema
  name: string;
  sku: string; // Required field per detailed schema
  barcode?: string;
  description?: string;

  // D1 OPTIMIZED: INTEGER cents pricing (VND x 100)
  price_cents: number; // INTEGER NOT NULL CHECK (price_cents >= 0)
  cost_price_cents: number; // INTEGER NOT NULL CHECK (cost_price_cents >= 0)

  // Inventory
  stock: number;
  min_stock: number;
  max_stock: number;
  unit: string;

  // Physical attributes
  weight_grams?: number; // INTEGER per detailed schema
  dimensions?: string; // JSON: {"length": 10, "width": 5, "height": 2}

  // Foreign keys
  category_id?: string; // TEXT FK → categories.id
  brand_id?: string; // TEXT FK → brands.id
  supplier_id?: string; // TEXT FK → suppliers.id
  store_id: string; // TEXT DEFAULT 'store-1' FK → stores.id

  // Media
  image_url?: string;
  images?: string; // JSON array of URLs

  // Denormalized fields for performance
  category_name?: string;
  brand_name?: string;

  // Status
  is_active: boolean;
  is_serialized: boolean;

  created_at: string;
  updated_at: string;

  // Legacy compatibility fields
  serial_numbers?: SerialNumber[];
  warranty_info?: WarrantyInfo;
}

export interface CartItem {
  id: string; // TEXT PK per detailed schema
  product: Product;
  quantity: number;
  unit_price_cents: number; // INTEGER cents pricing (VND x 100)
  total_price_cents: number; // INTEGER cents pricing (VND x 100)
}

export interface SerialNumber {
  id: string; // TEXT PK per detailed schema
  product_id: string; // TEXT NOT NULL FK → products.id
  variant_id?: string; // TEXT FK → product_variants.id
  serial_number: string; // TEXT UNIQUE NOT NULL
  status: 'available' | 'sold' | 'returned' | 'defective'; // TEXT DEFAULT 'available'
  batch_number?: string; // TEXT
  purchase_date?: string; // TEXT (ISO 8601)
  sale_date?: string; // TEXT (ISO 8601)
  customer_id?: string; // TEXT FK → customers.id
  warranty_start_date?: string; // TEXT
  warranty_end_date?: string; // TEXT
  notes?: string; // TEXT
  created_at: string; // TEXT DEFAULT (datetime('now'))
  updated_at: string; // TEXT DEFAULT (datetime('now'))
}

export interface WarrantyInfo {
  id: string; // TEXT PK per detailed schema
  product_id: string; // TEXT FK → products.id
  warranty_period_months: number;
  warranty_terms?: string;
  created_at: string;
}

export interface User {
  id: string; // TEXT PK according to detailed schema
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'cashier' | 'employee'; // Default 'employee' per detailed schema
  is_active: boolean; // Required field per detailed schema
  last_login?: string; // ISO 8601 format
  created_at: string;
  updated_at: string; // Required field per detailed schema
}

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
}

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

export interface PaymentMethod {
  id: string; // TEXT PK per detailed schema
  name: string; // TEXT NOT NULL
  code: string; // TEXT UNIQUE NOT NULL
  description?: string; // TEXT
  fee_percentage: number; // REAL DEFAULT 0 (Phí xử lý %)
  is_active: boolean; // INTEGER DEFAULT 1
  created_at: string; // TEXT DEFAULT (datetime('now'))
}

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

  // UI helper fields
  items?: CartItem[]; // Not in database schema, populated by joins
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
}

export interface Category {
  id: string; // TEXT PK according to detailed schema
  name: string;
  description?: string;
  parent_id?: string; // TEXT FK → categories.id
  image_url?: string; // R2 storage URL
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string; // TEXT PK according to detailed schema
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_number?: string;
  payment_terms?: string;
  credit_limit_cents?: number; // INTEGER DEFAULT 0 (VND cents)
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockTransaction {
  id: string; // TEXT PK per detailed schema
  product_id: string; // TEXT NOT NULL FK → products.id
  variant_id?: string; // TEXT FK → product_variants.id
  transaction_type: 'in' | 'out' | 'adjustment' | 'transfer'; // TEXT NOT NULL
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
}

// App URLs for navigation between micro-apps
export const APP_URLS = {
  pos: 'https://pos-frontend-bangachieu2.pages.dev',
  inventory: 'https://pos-frontend-bangachieu2.pages.dev/inventory',
  reports: 'https://pos-frontend-bangachieu2.pages.dev/reports',
  admin: 'https://pos-frontend-bangachieu2.pages.dev/admin',
  customers: 'https://pos-frontend-bangachieu2.pages.dev/customers',
  settings: 'https://pos-frontend-bangachieu2.pages.dev/settings'
} as const;

export const MAIN_HUB_URL = 'https://pos-frontend-bangachieu2.pages.dev';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ProductFilters extends PaginationParams {
  search?: string;
  category_id?: string; // TEXT FK → categories.id
  in_stock_only?: boolean;
  low_stock_only?: boolean;
  price_min_cents?: number; // INTEGER cents pricing (VND x 100)
  price_max_cents?: number; // INTEGER cents pricing (VND x 100)
}

export interface InventoryFilters extends PaginationParams {
  product_id?: string; // TEXT FK → products.id
  transaction_type?: 'in' | 'out' | 'adjustment' | 'transfer';
  date_from?: string;
  date_to?: string;
}
