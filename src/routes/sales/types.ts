// Sales Module Types
export interface Sale {
  id: number;
  customer_id?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  store_id?: number;
  user_id: number;
  sale_number: string;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: 'cash' | 'card' | 'transfer' | 'momo' | 'zalopay' | 'vnpay';
  payment_status: 'pending' | 'paid' | 'partial' | 'refunded' | 'cancelled';
  sale_status: 'draft' | 'completed' | 'cancelled' | 'returned';
  notes?: string;
  receipt_printed: boolean;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by?: number;
  
  // Joined fields
  user_name?: string;
  store_name?: string;
  customer_full_name?: string;
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
  tax_amount: number;
  total_amount: number;
  notes?: string;
  created_at: string;
  
  // Joined fields
  product_image_url?: string;
  product_category?: string;
  current_stock?: number;
}

export interface SalePayment {
  id: number;
  sale_id: number;
  payment_method: 'cash' | 'card' | 'transfer' | 'momo' | 'zalopay' | 'vnpay';
  amount: number;
  reference_number?: string;
  transaction_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  notes?: string;
  created_at: string;
  created_by: number;
}

export interface SaleCreateData {
  customer_id?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  items: SaleItemCreateData[];
  payments: SalePaymentCreateData[];
  discount_amount?: number;
  tax_rate?: number;
  notes?: string;
  receipt_printed?: boolean;
}

export interface SaleItemCreateData {
  product_id: number;
  quantity: number;
  unit_price?: number; // If not provided, will use product price
  discount_amount?: number;
  notes?: string;
}

export interface SalePaymentCreateData {
  payment_method: 'cash' | 'card' | 'transfer' | 'momo' | 'zalopay' | 'vnpay';
  amount: number;
  reference_number?: string;
  transaction_id?: string;
  notes?: string;
}

export interface SaleUpdateData {
  customer_id?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  payment_status?: 'pending' | 'paid' | 'partial' | 'refunded' | 'cancelled';
  sale_status?: 'draft' | 'completed' | 'cancelled' | 'returned';
  notes?: string;
  receipt_printed?: boolean;
}

export interface SaleQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  customer_id?: number;
  user_id?: number;
  store_id?: number;
  payment_method?: string;
  payment_status?: string;
  sale_status?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
  sort_by?: 'created_at' | 'total_amount' | 'customer_name' | 'sale_number';
  sort_order?: 'asc' | 'desc';
}

export interface SaleStats {
  total_sales: number;
  total_revenue: number;
  total_tax: number;
  total_discount: number;
  average_sale_amount: number;
  sales_today: number;
  revenue_today: number;
  sales_this_week: number;
  revenue_this_week: number;
  sales_this_month: number;
  revenue_this_month: number;
  top_payment_method: string;
  completed_sales: number;
  pending_sales: number;
  cancelled_sales: number;
  returned_sales: number;
  growth_rate: number;
  best_selling_products: TopSellingProduct[];
  sales_by_hour: SalesByHour[];
  sales_by_day: SalesByDay[];
  payment_methods_breakdown: PaymentMethodBreakdown[];
}

export interface TopSellingProduct {
  product_id: number;
  product_name: string;
  product_sku: string;
  total_quantity: number;
  total_revenue: number;
  sale_count: number;
}

export interface SalesByHour {
  hour: number;
  sales_count: number;
  total_revenue: number;
}

export interface SalesByDay {
  date: string;
  sales_count: number;
  total_revenue: number;
  average_sale_amount: number;
}

export interface PaymentMethodBreakdown {
  payment_method: string;
  sales_count: number;
  total_amount: number;
  percentage: number;
}

export interface SaleReturn {
  id: number;
  sale_id: number;
  return_number: string;
  total_amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  notes?: string;
  created_at: string;
  created_by: number;
  approved_at?: string;
  approved_by?: number;
  
  // Joined fields
  sale_number?: string;
  customer_name?: string;
  user_name?: string;
  items?: SaleReturnItem[];
}

export interface SaleReturnItem {
  id: number;
  return_id: number;
  sale_item_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  reason?: string;
  condition: 'new' | 'used' | 'damaged';
  created_at: string;
}

export interface SaleReturnCreateData {
  sale_id: number;
  items: SaleReturnItemCreateData[];
  reason: string;
  notes?: string;
}

export interface SaleReturnItemCreateData {
  sale_item_id: number;
  quantity: number;
  reason?: string;
  condition: 'new' | 'used' | 'damaged';
}

export interface Receipt {
  id: number;
  sale_id: number;
  receipt_number: string;
  template: 'standard' | 'thermal' | 'a4';
  content: string;
  printed_at?: string;
  printed_by?: number;
  email_sent?: boolean;
  email_sent_at?: string;
  created_at: string;
}

export interface ReceiptTemplate {
  id: number;
  name: string;
  type: 'standard' | 'thermal' | 'a4';
  template: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface SaleResponse {
  success: boolean;
  data?: Sale | Sale[] | SaleStats | SaleReturn | SaleReturn[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats?: SaleStats;
  message?: string;
}

export interface POSSession {
  id: number;
  user_id: number;
  store_id?: number;
  session_number: string;
  opening_cash: number;
  closing_cash?: number;
  total_sales: number;
  total_cash_sales: number;
  total_card_sales: number;
  total_other_sales: number;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at?: string;
  notes?: string;
  
  // Joined fields
  user_name?: string;
  store_name?: string;
  sales?: Sale[];
}

export interface POSSessionCreateData {
  opening_cash: number;
  notes?: string;
}

export interface POSSessionCloseData {
  closing_cash: number;
  notes?: string;
}

export interface QuickSaleData {
  items: {
    product_id: number;
    quantity: number;
  }[];
  customer_phone?: string;
  payment_method: 'cash' | 'card' | 'transfer';
  amount_paid: number;
  discount_amount?: number;
}

export interface SaleAnalytics {
  period: 'today' | 'week' | 'month' | 'year';
  total_sales: number;
  total_revenue: number;
  average_sale_amount: number;
  growth_rate: number;
  top_products: TopSellingProduct[];
  sales_trend: SalesTrendData[];
  payment_methods: PaymentMethodBreakdown[];
  hourly_sales: SalesByHour[];
  customer_analytics: CustomerSalesAnalytics[];
}

export interface SalesTrendData {
  date: string;
  sales_count: number;
  revenue: number;
  average_amount: number;
}

export interface CustomerSalesAnalytics {
  customer_id?: number;
  customer_name: string;
  customer_phone?: string;
  total_sales: number;
  total_spent: number;
  average_sale_amount: number;
  last_sale_date: string;
  is_vip: boolean;
}
