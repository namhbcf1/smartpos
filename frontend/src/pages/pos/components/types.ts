// Point of Sale Types
export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  cost_price?: number;
  category_id: number;
  category_name?: string;
  stock_quantity: number;
  min_stock_level?: number;
  description?: string;
  image_url?: string;
  is_active: boolean;
  tax_rate?: number;
  discount_eligible: boolean;
  unit: string;
  weight?: number;
  dimensions?: string;
  brand?: string;
  supplier_id?: number;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string; // Unique cart item ID
  product_id: number;
  product: Product;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  discount_percentage: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
}

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  customer_type: 'individual' | 'business';
  tax_code?: string;
  company_name?: string;
  loyalty_points: number;
  total_spent: number;
  discount_percentage?: number;
  is_vip: boolean;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'bank_transfer' | 'e_wallet' | 'loyalty_points' | 'voucher';
  icon: string;
  is_active: boolean;
  requires_reference?: boolean;
  fee_percentage?: number;
  fee_fixed?: number;
}

export interface Payment {
  id: string;
  method_id: string;
  method_name: string;
  amount: number;
  reference?: string;
  status: 'pending' | 'completed' | 'failed';
  fee_amount?: number;
  received_amount?: number;
  change_amount?: number;
}

export interface Sale {
  id?: number;
  receipt_number: string;
  customer_id?: number;
  customer?: Customer;
  items: CartItem[];
  subtotal: number;
  discount_amount: number;
  discount_percentage: number;
  tax_amount: number;
  total_amount: number;
  payments: Payment[];
  paid_amount: number;
  change_amount: number;
  status: 'draft' | 'completed' | 'cancelled' | 'refunded';
  notes?: string;
  cashier_id: number;
  cashier_name?: string;
  store_id: number;
  store_name?: string;
  sale_date: string;
  created_at: string;
  updated_at?: string;
}

export interface Discount {
  id: number;
  name: string;
  type: 'percentage' | 'fixed' | 'buy_x_get_y';
  value: number;
  min_amount?: number;
  max_discount?: number;
  applicable_to: 'all' | 'category' | 'product';
  applicable_ids?: number[];
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  usage_limit?: number;
  used_count: number;
}

export interface Tax {
  id: number;
  name: string;
  rate: number;
  type: 'inclusive' | 'exclusive';
  applicable_to: 'all' | 'category' | 'product';
  applicable_ids?: number[];
  is_active: boolean;
}

export interface POSSettings {
  store_id: number;
  store_name: string;
  receipt_header: string;
  receipt_footer: string;
  auto_print_receipt: boolean;
  default_payment_method: string;
  allow_negative_stock: boolean;
  require_customer_for_sale: boolean;
  default_tax_rate: number;
  currency_symbol: string;
  decimal_places: number;
  barcode_scanner_enabled: boolean;
  quick_sale_enabled: boolean;
  loyalty_program_enabled: boolean;
  discount_requires_manager: boolean;
  max_discount_percentage: number;
}

export interface BarcodeResult {
  code: string;
  format: string;
  product?: Product;
}

export interface QuickSaleItem {
  id: number;
  name: string;
  price: number;
  color: string;
  icon: string;
  category: string;
  is_active: boolean;
  sort_order: number;
}

export interface SalesSummary {
  total_sales: number;
  total_amount: number;
  total_items: number;
  average_sale: number;
  cash_sales: number;
  card_sales: number;
  top_products: Array<{
    product_id: number;
    product_name: string;
    quantity_sold: number;
    total_amount: number;
  }>;
  hourly_sales: Array<{
    hour: number;
    sales_count: number;
    total_amount: number;
  }>;
}

export interface POSState {
  cart: CartItem[];
  customer?: Customer;
  payments: Payment[];
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
  status: 'draft' | 'processing' | 'completed';
}

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
