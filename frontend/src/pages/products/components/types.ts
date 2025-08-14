// Product Management Types
export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  short_description?: string;
  category_id: number;
  category_name?: string;
  category_path?: string;
  brand?: string;
  model?: string;
  price: number;
  cost_price?: number;
  wholesale_price?: number;
  retail_price?: number;
  stock_quantity: number;
  min_stock_level: number;
  max_stock_level?: number;
  reorder_point?: number;
  unit: string;
  weight?: number;
  dimensions?: string;
  color?: string;
  size?: string;
  material?: string;
  warranty_period?: number;
  warranty_type?: string;
  supplier_id?: number;
  supplier_name?: string;
  supplier_sku?: string;
  tax_rate?: number;
  discount_eligible: boolean;
  is_active: boolean;
  is_featured: boolean;
  is_digital: boolean;
  track_inventory: boolean;
  allow_backorder: boolean;
  image_url?: string;
  images?: string[];
  tags?: string[];
  attributes?: ProductAttribute[];
  variants?: ProductVariant[];
  created_at: string;
  updated_at: string;
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

export interface ProductAttribute {
  id: number;
  name: string;
  value: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect';
  is_required: boolean;
  is_variant: boolean;
  sort_order: number;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  name: string;
  price: number;
  cost_price?: number;
  stock_quantity: number;
  attributes: Record<string, string>;
  image_url?: string;
  is_active: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  parent_name?: string;
  level: number;
  path: string;
  image_url?: string;
  is_active: boolean;
  product_count: number;
  sort_order: number;
  children?: Category[];
}

export interface Supplier {
  id: number;
  name: string;
  company_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  tax_code?: string;
  payment_terms?: string;
  credit_limit?: number;
  is_active: boolean;
  product_count: number;
  total_orders: number;
  total_amount: number;
}

export interface ProductFilters {
  search: string;
  category_id?: number;
  supplier_id?: number;
  brand?: string;
  price_range: {
    min: number;
    max: number;
  };
  stock_status: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  status: 'all' | 'active' | 'inactive';
  is_featured?: boolean;
  tags?: string[];
  sort_by: 'name' | 'price' | 'stock' | 'created_at' | 'updated_at' | 'total_sold';
  sort_order: 'asc' | 'desc';
}

export interface ProductFormData {
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  short_description?: string;
  category_id: number;
  brand?: string;
  model?: string;
  price: number;
  cost_price?: number;
  wholesale_price?: number;
  retail_price?: number;
  stock_quantity: number;
  min_stock_level: number;
  max_stock_level?: number;
  reorder_point?: number;
  unit: string;
  weight?: number;
  dimensions?: string;
  color?: string;
  size?: string;
  material?: string;
  warranty_period?: number;
  warranty_type?: string;
  supplier_id?: number;
  supplier_sku?: string;
  tax_rate?: number;
  discount_eligible: boolean;
  is_active: boolean;
  is_featured: boolean;
  is_digital: boolean;
  track_inventory: boolean;
  allow_backorder: boolean;
  image_url?: string;
  images?: string[];
  tags?: string[];
  attributes?: Omit<ProductAttribute, 'id'>[];
  variants?: Omit<ProductVariant, 'id' | 'product_id'>[];
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
  top_categories: Array<{
    category_id: number;
    category_name: string;
    product_count: number;
    total_value: number;
  }>;
  top_brands: Array<{
    brand: string;
    product_count: number;
    total_value: number;
  }>;
  top_suppliers: Array<{
    supplier_id: number;
    supplier_name: string;
    product_count: number;
    total_value: number;
  }>;
  recent_products: Product[];
  best_sellers: Array<{
    product_id: number;
    product_name: string;
    total_sold: number;
    revenue: number;
  }>;
}

export interface ProductAnalytics {
  sales_performance: Array<{
    product_id: number;
    product_name: string;
    quantity_sold: number;
    revenue: number;
    profit: number;
    growth_rate: number;
  }>;
  inventory_turnover: Array<{
    product_id: number;
    product_name: string;
    turnover_rate: number;
    days_in_stock: number;
    reorder_frequency: number;
  }>;
  price_optimization: Array<{
    product_id: number;
    product_name: string;
    current_price: number;
    suggested_price: number;
    potential_revenue_increase: number;
  }>;
  category_performance: Array<{
    category_id: number;
    category_name: string;
    product_count: number;
    total_revenue: number;
    average_margin: number;
    growth_rate: number;
  }>;
}

export interface BulkOperation {
  type: 'update_price' | 'update_stock' | 'update_category' | 'update_status' | 'delete';
  product_ids: number[];
  data: Record<string, any>;
}

export interface ImportResult {
  total_rows: number;
  successful_imports: number;
  failed_imports: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  warnings: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

export interface ProductExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  fields: string[];
  filters: ProductFilters;
  include_variants: boolean;
  include_attributes: boolean;
  include_images: boolean;
  include_analytics: boolean;
}
