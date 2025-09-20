// Unified Types for POS System - DB Schema Compliant

// Product Interface - DB Schema Compliant
export interface Product {
  id: string; // TEXT PK per DB schema
  name: string;
  sku: string;
  barcode?: string;
  price_cents: number; // INTEGER NOT NULL CHECK (price_cents >= 0)
  cost_price_cents: number; // INTEGER NOT NULL CHECK (cost_price_cents >= 0)
  stock: number;
  min_stock: number;
  max_stock: number;
  unit: string;
  weight_grams?: number; // INTEGER per DB schema
  dimensions?: string; // JSON: {"length": 10, "width": 5, "height": 2}
  category_id?: string; // TEXT FK → categories.id
  brand_id?: string; // TEXT FK → brands.id
  supplier_id?: string; // TEXT FK → suppliers.id
  store_id: string; // TEXT DEFAULT 'store-1' FK → stores.id
  category_name?: string; // Denormalized
  brand_name?: string; // Denormalized
  image_url?: string;
  images?: string; // JSON array of URLs
  is_active: boolean;
  is_serialized: boolean;
  created_at: string;
  updated_at: string;
}

// Customer Interface - DB Schema Compliant
export interface Customer {
  id: string; // TEXT PK per DB schema
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string; // ISO 8601: '1990-05-15'
  gender?: 'male' | 'female' | 'other';
  customer_type: 'regular' | 'vip' | 'wholesale'; // per DB schema
  loyalty_points: number; // CHECK (loyalty_points >= 0)
  total_spent_cents: number; // VND x 100, CHECK (total_spent_cents >= 0)
  visit_count: number; // CHECK (visit_count >= 0)
  last_visit?: string; // ISO 8601
  is_active: boolean; // 0=inactive, 1=active
  created_at: string;
  updated_at: string;
}

// Cart Item Interface - DB Schema Compliant (Order Items)
export interface CartItem {
  id: string; // TEXT PK per DB schema
  order_id?: string; // TEXT FK → orders.id (when saved)
  product_id: string; // TEXT NOT NULL FK → products.id
  variant_id?: string; // TEXT FK → product_variants.id
  quantity: number; // INTEGER NOT NULL CHECK (quantity > 0)
  unit_price_cents: number; // INTEGER NOT NULL CHECK (unit_price_cents >= 0)
  total_price_cents: number; // INTEGER NOT NULL CHECK (total_price_cents >= 0)
  discount_cents: number; // INTEGER DEFAULT 0 CHECK (discount_cents >= 0)
  product_name: string; // Denormalized from products.name
  product_sku: string; // Denormalized from products.sku
  product?: Product; // Optional full product object
  created_at?: string;
}

// Sale Interface - DB Schema Compliant (Orders Table)
export interface Sale {
  id?: string; // TEXT PK per DB schema
  order_number: string; // TEXT UNIQUE NOT NULL
  customer_id?: string; // TEXT FK → customers.id
  user_id: string; // TEXT NOT NULL FK → users.id (cashier)
  store_id: string; // TEXT NOT NULL FK → stores.id
  status: 'draft' | 'pending' | 'completed' | 'cancelled' | 'refunded'; // per DB schema
  subtotal_cents: number; // INTEGER CHECK (subtotal_cents >= 0)
  discount_cents: number; // INTEGER DEFAULT 0 CHECK (discount_cents >= 0)
  tax_cents: number; // INTEGER DEFAULT 0 CHECK (tax_cents >= 0)
  total_cents: number; // INTEGER CHECK (total_cents >= 0)
  notes?: string;
  receipt_printed: boolean; // INTEGER DEFAULT 0
  customer_name?: string; // Denormalized from customers.name
  customer_phone?: string; // Denormalized from customers.phone
  customer?: Customer;
  items: CartItem[];
  payments?: any[];
  created_at: string;
  updated_at: string;
}

// Category Interface - DB Schema Compliant
export interface Category {
  id: string; // TEXT PK per DB schema
  name: string;
  description?: string;
  parent_id?: string; // TEXT FK → categories.id (hierarchical)
  image_url?: string; // R2 storage URL
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// POS State Interface
export interface POSState {
  cart: CartItem[];
  customer?: Customer;
  payments: any[];
  discount: {
    type: 'none' | 'percentage' | 'fixed';
    value: number;
    amount: number;
  };
  tax: {
    rate: number;
    amount: number;
  };
  subtotal: number;
  total: number;
  paid_amount: number;
  change_amount: number;
  receipt_number: string;
  notes: string;
  status: 'draft' | 'completed' | 'cancelled';
}

// POS Filters Interface
export interface POSFilters {
  search: string;
  category_id: number | null;
  in_stock_only: boolean;
  price_range: {
    min: number;
    max: number;
  };
  sort_by: 'name' | 'price' | 'stock' | 'popularity';
  sort_order: 'asc' | 'desc';
}

// Sales Summary Interface
export interface SalesSummary {
  total_sales: number;
  total_revenue: number;
  total_amount: number; // Add total_amount property that POSHeader expects
  total_items: number;
  average_order_value: number;
  top_products: Array<{
    product_id: number; // Changed to number to match Product.id
    name: string;
    quantity: number;
    revenue: number;
  }>;
  sales_by_hour: Array<{
    hour: number;
    sales: number;
    revenue: number;
  }>;
}

// Inventory Forecast Interface
export interface ForecastData {
  date: string;
  predicted_demand: number;
  actual_demand: number;
  stock_level: number;
  // reorder_point removed - not in detailed schema
}

export interface ProductForecast {
  id: number; // Changed to number to match Product.id
  name: string;
  current_stock: number;
  predicted_demand: number;
  days_until_stockout: number;
  recommended_order: number;
  forecast_accuracy: number;
}

// System Monitoring Interface
export interface SystemMetrics {
  timestamp: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_throughput: number;
  active_users: number;
  database_connections: number;
  response_time: number;
}

export interface AlertItem {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface PerformanceMetrics {
  avg_response_time: number;
  requests_per_second: number;
  error_rate: number;
  uptime_percentage: number;
}

// API Response Interface
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Pagination Interface
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// Paginated Response Interface
export interface PaginatedResponse<T> extends ApiResponse<{
  data: T[];
  pagination: Pagination;
}> {}

// Export all types - removed to avoid conflicts
