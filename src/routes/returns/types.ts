// Returns Module Types
export interface Return {
  id: number;
  original_sale_id: number;
  return_number: string;
  return_amount: number;
  return_reason: string;
  return_status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  refund_method: 'cash' | 'card' | 'transfer' | 'store_credit' | 'exchange';
  refund_amount: number;
  store_credit_amount: number;
  processing_fee: number;
  restocking_fee: number;
  reference_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  approved_at?: string;
  approved_by?: number;
  completed_at?: string;
  completed_by?: number;
  
  // Joined fields
  original_sale_number?: string;
  customer_name?: string;
  customer_phone?: string;
  created_by_name?: string;
  approved_by_name?: string;
  completed_by_name?: string;
  items?: ReturnItem[];
  refund_transactions?: RefundTransaction[];
}

export interface ReturnItem {
  id: number;
  return_id: number;
  sale_item_id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity_returned: number;
  quantity_original: number;
  unit_price: number;
  total_amount: number;
  return_reason?: string;
  condition: 'new' | 'used' | 'damaged' | 'defective';
  restockable: boolean;
  notes?: string;
  created_at: string;
  
  // Joined fields
  product_image_url?: string;
  product_category?: string;
  current_stock?: number;
}

export interface RefundTransaction {
  id: number;
  return_id: number;
  transaction_type: 'refund' | 'store_credit' | 'exchange';
  amount: number;
  payment_method: 'cash' | 'card' | 'transfer' | 'store_credit';
  reference_number?: string;
  transaction_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  notes?: string;
  created_at: string;
  created_by: number;
  
  // Joined fields
  created_by_name?: string;
}

export interface ReturnPolicy {
  id: number;
  name: string;
  description: string;
  return_period_days: number;
  restocking_fee_percentage: number;
  processing_fee_amount: number;
  conditions: string; // JSON string
  applicable_categories: string; // JSON array of category IDs
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReturnReason {
  id: number;
  code: string;
  name: string;
  description?: string;
  category: 'defective' | 'wrong_item' | 'not_as_described' | 'customer_change' | 'damaged' | 'other';
  requires_approval: boolean;
  auto_restock: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReturnStats {
  total_returns: number;
  total_return_amount: number;
  pending_returns: number;
  approved_returns: number;
  completed_returns: number;
  rejected_returns: number;
  returns_today: number;
  return_amount_today: number;
  returns_this_week: number;
  return_amount_this_week: number;
  returns_this_month: number;
  return_amount_this_month: number;
  average_return_amount: number;
  return_rate_percentage: number;
  top_return_reasons: TopReturnReason[];
  return_trends: ReturnTrend[];
  product_return_analysis: ProductReturnAnalysis[];
  refund_method_breakdown: RefundMethodBreakdown[];
}

export interface TopReturnReason {
  reason_code: string;
  reason_name: string;
  return_count: number;
  total_amount: number;
  percentage: number;
}

export interface ReturnTrend {
  date: string;
  return_count: number;
  return_amount: number;
  refund_amount: number;
  store_credit_amount: number;
}

export interface ProductReturnAnalysis {
  product_id: number;
  product_name: string;
  product_sku: string;
  total_sold: number;
  total_returned: number;
  return_rate: number;
  return_amount: number;
  main_return_reason: string;
}

export interface RefundMethodBreakdown {
  refund_method: string;
  return_count: number;
  total_amount: number;
  percentage: number;
}

export interface ReturnQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  return_status?: string;
  refund_method?: string;
  return_reason?: string;
  customer_id?: number;
  product_id?: number;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
  created_by?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ReturnCreateData {
  original_sale_id: number;
  return_reason: string;
  refund_method: 'cash' | 'card' | 'transfer' | 'store_credit' | 'exchange';
  items: ReturnItemCreateData[];
  notes?: string;
  processing_fee?: number;
  restocking_fee?: number;
}

export interface ReturnItemCreateData {
  sale_item_id: number;
  product_id: number;
  quantity_returned: number;
  return_reason?: string;
  condition: 'new' | 'used' | 'damaged' | 'defective';
  restockable?: boolean;
  notes?: string;
}

export interface ReturnUpdateData {
  return_status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  refund_method?: 'cash' | 'card' | 'transfer' | 'store_credit' | 'exchange';
  refund_amount?: number;
  store_credit_amount?: number;
  processing_fee?: number;
  restocking_fee?: number;
  notes?: string;
}

export interface ReturnApprovalData {
  approved: boolean;
  refund_amount: number;
  store_credit_amount?: number;
  processing_fee?: number;
  restocking_fee?: number;
  approval_notes?: string;
}

export interface ExchangeRequest {
  id: number;
  return_id: number;
  original_product_id: number;
  new_product_id: number;
  quantity: number;
  price_difference: number;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  created_by: number;
  
  // Joined fields
  original_product_name?: string;
  new_product_name?: string;
  created_by_name?: string;
}

export interface StoreCredit {
  id: number;
  customer_id: number;
  return_id?: number;
  credit_number: string;
  amount: number;
  balance: number;
  expiry_date?: string;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  notes?: string;
  created_at: string;
  created_by: number;
  
  // Joined fields
  customer_name?: string;
  customer_phone?: string;
  created_by_name?: string;
  transactions?: StoreCreditTransaction[];
}

export interface StoreCreditTransaction {
  id: number;
  store_credit_id: number;
  transaction_type: 'issue' | 'use' | 'adjust' | 'expire';
  amount: number;
  balance_before: number;
  balance_after: number;
  reference_type?: 'return' | 'sale' | 'manual';
  reference_id?: number;
  description: string;
  created_at: string;
  created_by: number;
  
  // Joined fields
  created_by_name?: string;
}

export interface ReturnResponse {
  success: boolean;
  data?: Return | Return[] | ReturnStats | StoreCredit | StoreCredit[] | any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats?: ReturnStats;
  message?: string;
}
