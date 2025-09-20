// Product Management Types - Following detailed schema exactly
export interface Product {
  id: string; // TEXT PK per detailed schema
  name: string;
  sku: string;
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
  tax_number?: string; // tax_number per detailed schema
  payment_terms?: string;
  credit_limit_cents?: number; // INTEGER DEFAULT 0 (VND cents)
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductFilters {
  search: string;
  category_id?: string; // TEXT FK → categories.id per detailed schema
  supplier_id?: string; // TEXT FK → suppliers.id per detailed schema
  brand_id?: string; // TEXT FK → brands.id per detailed schema
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
  category_id: string; // TEXT FK → categories.id per detailed schema
  brand_id?: string; // TEXT FK → brands.id per detailed schema
  model?: string;
  price: number;
  cost_price?: number;
  wholesale_price?: number;
  retail_price?: number;
  stock: number;
  min_stock: number;
  max_stock?: number;
  // reorder_point removed - not in detailed schema
  unit: string;
  weight?: number;
  dimensions?: string;
  color?: string;
  size?: string;
  material?: string;
  // warranty_period removed - not in detailed schema
  warranty_type?: string;
  supplier_id?: string; // TEXT FK → suppliers.id per detailed schema
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
