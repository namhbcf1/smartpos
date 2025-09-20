// Sales Management Types - DB Schema Compliant (Orders Table)
export interface Sale {
  id: string; // TEXT PK per DB schema
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
  created_at: string;
  updated_at: string;
  items?: SaleItem[];
  payments?: SalePayment[];
}

export interface SaleItem {
  id: string; // TEXT PK per DB schema
  order_id: string; // TEXT NOT NULL FK → orders.id
  product_id: string; // TEXT NOT NULL FK → products.id
  variant_id?: string; // TEXT FK → product_variants.id
  quantity: number; // INTEGER NOT NULL CHECK (quantity > 0)
  unit_price_cents: number; // INTEGER NOT NULL CHECK (unit_price_cents >= 0)
  total_price_cents: number; // INTEGER NOT NULL CHECK (total_price_cents >= 0)
  discount_cents: number; // INTEGER DEFAULT 0 CHECK (discount_cents >= 0)
  product_name: string; // Denormalized from products.name
  product_sku: string; // Denormalized from products.sku
  created_at: string;
}

export interface SalePayment {
  id: string; // TEXT PK per DB schema
  order_id: string; // TEXT NOT NULL FK → orders.id
  payment_method_id: string; // TEXT NOT NULL FK → payment_methods.id
  amount_cents: number; // INTEGER NOT NULL CHECK (amount_cents > 0)
  reference?: string; // Mã giao dịch từ gateway
  status: 'pending' | 'completed' | 'failed' | 'refunded'; // per DB schema
  processed_at: string; // TEXT DEFAULT (datetime('now'))
  created_at: string;
}

export interface SalesFilters {
  search: string;
  date_range: {
    start?: string;
    end?: string;
  };
  payment_status: 'all' | 'pending' | 'paid' | 'partial' | 'refunded' | 'cancelled';
  payment_method: 'all' | 'cash' | 'card' | 'bank_transfer' | 'e_wallet' | 'multiple';
  status: 'all' | 'draft' | 'completed' | 'cancelled' | 'refunded';
  cashier_id?: number;
  store_id?: number;
  customer_id?: number;
  amount_range: {
    min: number;
    max: number;
  };
}

export interface SalesStats {
  total_sales: number;
  total_amount: number;
  total_items: number;
  average_sale: number;
  cash_sales: number;
  card_sales: number;
  pending_amount: number;
  refunded_amount: number;
  growth_rate: number;
  top_products: Array<{
    product_id: number;
    product_name: string;
    quantity_sold: number;
    total_amount: number;
  }>;
  top_customers: Array<{
    customer_id: number;
    customer_name: string;
    total_spent: number;
    orders_count: number;
  }>;
  hourly_sales: Array<{
    hour: number;
    sales_count: number;
    total_amount: number;
  }>;
  daily_sales: Array<{
    date: string;
    sales_count: number;
    total_amount: number;
  }>;
  payment_methods: Array<{
    method: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
}

export interface SalesSummary {
  today: {
    sales_count: number;
    total_amount: number;
    average_sale: number;
  };
  yesterday: {
    sales_count: number;
    total_amount: number;
    average_sale: number;
  };
  this_week: {
    sales_count: number;
    total_amount: number;
    average_sale: number;
  };
  this_month: {
    sales_count: number;
    total_amount: number;
    average_sale: number;
  };
  growth_rates: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface Cashier {
  id: number;
  name: string;
  username: string;
  sales_count: number;
  total_amount: number;
  is_active: boolean;
}

export interface Store {
  id: number;
  name: string;
  address: string;
  sales_count: number;
  total_amount: number;
  is_active: boolean;
}

export interface SalesExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  fields: string[];
  filters: SalesFilters;
  include_items: boolean;
  include_payments: boolean;
  include_customer_details: boolean;
}

export interface RefundRequest {
  sale_id: number;
  items: Array<{
    sale_item_id: number;
    quantity: number;
    reason: string;
  }>;
  refund_amount: number;
  refund_method: 'cash' | 'card' | 'store_credit';
  reason: string;
  notes?: string;
}

export interface SalesAnalytics {
  revenue_trend: Array<{
    period: string;
    revenue: number;
    orders: number;
    growth_rate: number;
  }>;
  product_performance: Array<{
    product_id: number;
    product_name: string;
    quantity_sold: number;
    revenue: number;
    profit_margin: number;
    growth_rate: number;
  }>;
  customer_segments: Array<{
    segment: string;
    customer_count: number;
    total_spent: number;
    average_order_value: number;
    frequency: number;
  }>;
  seasonal_trends: Array<{
    month: number;
    year: number;
    sales_count: number;
    revenue: number;
    comparison: number;
  }>;
  conversion_metrics: {
    total_visitors: number;
    total_sales: number;
    conversion_rate: number;
    average_items_per_sale: number;
    cart_abandonment_rate: number;
  };
}
