// Product Management Types for Backend
export interface Product {
  id: number;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  category_id: number;
  category_name?: string;
  price: number;
  cost_price: number;
  tax_rate: number;
  stock_quantity: number;
  stock_alert_threshold: number;
  min_stock_level?: number;
  max_stock_level?: number;
  reorder_point?: number;
  unit?: string;
  weight?: number;
  dimensions?: string;
  brand?: string;
  model?: string;
  supplier_id?: number;
  supplier_name?: string;
  warranty_period?: number;
  warranty_type?: string;
  is_active: boolean;
  is_featured?: boolean;
  is_digital?: boolean;
  track_inventory?: boolean;
  allow_backorder?: boolean;
  image_url?: string;
  images?: string[];
  tags?: string[];
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  created_by?: number;
  updated_by?: number;
  total_sold?: number;
  revenue_generated?: number;
  profit_margin?: number;
  last_sold_date?: string;
  last_restocked_date?: string;
  average_rating?: number;
  review_count?: number;
}

export interface ProductCreateData {
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  category_id: number;
  price: number;
  cost_price: number;
  tax_rate?: number;
  stock_quantity: number;
  stock_alert_threshold: number;
  min_stock_level?: number;
  max_stock_level?: number;
  reorder_point?: number;
  unit?: string;
  weight?: number;
  dimensions?: string;
  brand?: string;
  model?: string;
  supplier_id?: number;
  warranty_period?: number;
  warranty_type?: string;
  is_active?: boolean;
  is_featured?: boolean;
  is_digital?: boolean;
  track_inventory?: boolean;
  allow_backorder?: boolean;
  image_url?: string;
  images?: string[];
  tags?: string[];
}

export interface ProductUpdateData extends Partial<ProductCreateData> {
  updated_by?: number;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: number;
  supplier_id?: number;
  brand?: string;
  is_active?: boolean;
  is_featured?: boolean;
  in_stock_only?: boolean;
  low_stock_only?: boolean;
  price_min?: number;
  price_max?: number;
  sort_by?: 'name' | 'price' | 'stock_quantity' | 'created_at' | 'updated_at' | 'total_sold';
  sort_order?: 'asc' | 'desc';
  tags?: string[];
}

export interface ProductStats {
  total_products: number;
  active_products: number;
  inactive_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
  featured_products: number;
  total_value: number;
  average_price: number;
  categories_count: number;
  brands_count: number;
  suppliers_count: number;
}

export interface ProductAnalytics {
  best_sellers: Array<{
    product_id: number;
    product_name: string;
    total_sold: number;
    revenue: number;
    profit: number;
  }>;
  low_performers: Array<{
    product_id: number;
    product_name: string;
    total_sold: number;
    days_since_last_sale: number;
  }>;
  inventory_turnover: Array<{
    product_id: number;
    product_name: string;
    turnover_rate: number;
    days_in_stock: number;
  }>;
  price_optimization: Array<{
    product_id: number;
    product_name: string;
    current_price: number;
    suggested_price: number;
    potential_increase: number;
  }>;
}

export interface BulkUpdateData {
  product_ids: number[];
  updates: Partial<ProductUpdateData>;
}

export interface ImportResult {
  total_rows: number;
  successful_imports: number;
  failed_imports: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
    data?: any;
  }>;
  warnings: Array<{
    row: number;
    field: string;
    message: string;
    data?: any;
  }>;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  name: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  attributes: Record<string, string>;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductAttribute {
  id: number;
  product_id: number;
  name: string;
  value: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect';
  is_required: boolean;
  is_variant: boolean;
  sort_order: number;
}

export interface ProductImage {
  id: number;
  product_id: number;
  url: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface ProductTag {
  id: number;
  name: string;
  color?: string;
  description?: string;
  is_active: boolean;
  product_count: number;
  created_at: string;
}

export interface ProductReview {
  id: number;
  product_id: number;
  customer_id?: number;
  customer_name?: string;
  rating: number;
  title?: string;
  comment?: string;
  is_verified: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: number;
  product_id: number;
  movement_type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  reference_type?: 'sale' | 'purchase' | 'return' | 'adjustment' | 'transfer';
  reference_id?: number;
  notes?: string;
  created_by: number;
  created_at: string;
}

export interface ProductResponse {
  success: boolean;
  data?: Product | Product[];
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats?: ProductStats;
  analytics?: ProductAnalytics;
}
