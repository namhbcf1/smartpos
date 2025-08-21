// Shared types for SmartPOS applications

export interface Product {
  id: number;
  name: string;
  sku?: string;
  description?: string;
  price: number;
  cost_price?: number;
  stock_quantity: number;
  min_stock_level: number;
  category_id?: number;
  category_name?: string;
  created_at: string;
  updated_at: string;
  image_url?: string;
  barcode?: string;
  serial_numbers?: SerialNumber[];
  warranty_info?: WarrantyInfo;
}

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface SerialNumber {
  id: number;
  serial_number: string;
  product_id: number;
  status: 'available' | 'sold' | 'returned' | 'warranty';
  created_at: string;
  sold_at?: string;
  warranty_expires_at?: string;
}

export interface WarrantyInfo {
  id: number;
  product_id: number;
  warranty_period_months: number;
  warranty_terms?: string;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'cashier' | 'inventory';
  created_at: string;
  last_login?: string;
}

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  total_purchases?: number;
}

export interface Order {
  id: number;
  customer_id?: number;
  customer_name?: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  payment_method: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  created_by: number;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  created_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
}

export interface StockTransaction {
  id: number;
  product_id: number;
  product_name: string;
  transaction_type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reference?: string;
  notes?: string;
  created_at: string;
  created_by: number;
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
  category_id?: number;
  in_stock_only?: boolean;
  low_stock_only?: boolean;
  price_min?: number;
  price_max?: number;
}

export interface InventoryFilters extends PaginationParams {
  product_id?: number;
  transaction_type?: 'in' | 'out' | 'adjustment' | 'transfer';
  date_from?: string;
  date_to?: string;
}
