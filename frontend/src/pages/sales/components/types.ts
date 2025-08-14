// Sales Management Types
export interface Sale {
  id: number;
  receipt_number: string;
  customer_id?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  subtotal: number;
  discount_amount: number;
  discount_percentage: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  payment_status: 'pending' | 'paid' | 'partial' | 'refunded' | 'cancelled';
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'e_wallet' | 'multiple';
  status: 'draft' | 'completed' | 'cancelled' | 'refunded';
  notes?: string;
  cashier_id: number;
  cashier_name: string;
  store_id: number;
  store_name: string;
  sale_date: string;
  created_at: string;
  updated_at: string;
  items_count: number;
  items?: SaleItem[];
  payments?: SalePayment[];
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  discount_percentage: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
}

export interface SalePayment {
  id: number;
  sale_id: number;
  payment_method: string;
  amount: number;
  reference?: string;
  status: 'pending' | 'completed' | 'failed';
  fee_amount?: number;
  processed_at?: string;
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
