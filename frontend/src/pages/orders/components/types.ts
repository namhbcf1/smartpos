// Order Management Types
export interface Order {
  id: number;
  order_number: string;
  customer_id?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  order_type: 'in_store' | 'online' | 'phone' | 'delivery';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'partial' | 'refunded' | 'cancelled';
  payment_method?: 'cash' | 'card' | 'bank_transfer' | 'e_wallet' | 'cod';
  subtotal: number;
  discount_amount: number;
  discount_percentage: number;
  tax_amount: number;
  shipping_fee: number;
  total_amount: number;
  paid_amount: number;
  notes?: string;
  internal_notes?: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  delivery_address?: string;
  delivery_phone?: string;
  delivery_notes?: string;
  cashier_id?: number;
  cashier_name?: string;
  store_id: number;
  store_name: string;
  order_date: string;
  created_at: string;
  updated_at: string;
  items_count: number;
  items?: OrderItem[];
  status_history?: OrderStatusHistory[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  discount_percentage: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
}

export interface OrderStatusHistory {
  id: number;
  order_id: number;
  status: string;
  notes?: string;
  changed_by: number;
  changed_by_name: string;
  changed_at: string;
}

export interface OrderFilters {
  search: string;
  date_range: {
    start?: string;
    end?: string;
  };
  status: 'all' | 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'refunded';
  payment_status: 'all' | 'pending' | 'paid' | 'partial' | 'refunded' | 'cancelled';
  order_type: 'all' | 'in_store' | 'online' | 'phone' | 'delivery';
  payment_method: 'all' | 'cash' | 'card' | 'bank_transfer' | 'e_wallet' | 'cod';
  cashier_id?: number;
  store_id?: number;
  customer_id?: number;
  amount_range: {
    min: number;
    max: number;
  };
}

export interface OrderStats {
  total_orders: number;
  total_amount: number;
  average_order: number;
  pending_orders: number;
  confirmed_orders: number;
  preparing_orders: number;
  ready_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  growth_rate: number;
  completion_rate: number;
  cancellation_rate: number;
  average_preparation_time: number;
  order_types: Array<{
    type: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
  top_products: Array<{
    product_id: number;
    product_name: string;
    quantity_ordered: number;
    total_amount: number;
  }>;
  hourly_orders: Array<{
    hour: number;
    orders_count: number;
    total_amount: number;
  }>;
}

export interface OrderFormData {
  customer_id?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  order_type: 'in_store' | 'online' | 'phone' | 'delivery';
  payment_method?: 'cash' | 'card' | 'bank_transfer' | 'e_wallet' | 'cod';
  estimated_delivery?: string;
  delivery_address?: string;
  delivery_phone?: string;
  delivery_notes?: string;
  notes?: string;
  internal_notes?: string;
  items: Array<{
    product_id: number;
    quantity: number;
    unit_price: number;
    discount_percentage?: number;
    notes?: string;
  }>;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  total_orders: number;
  total_spent: number;
  is_vip: boolean;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  category_name?: string;
  is_active: boolean;
}

export interface OrderSummary {
  today: {
    orders_count: number;
    total_amount: number;
    average_order: number;
    completion_rate: number;
  };
  yesterday: {
    orders_count: number;
    total_amount: number;
    average_order: number;
    completion_rate: number;
  };
  this_week: {
    orders_count: number;
    total_amount: number;
    average_order: number;
    completion_rate: number;
  };
  this_month: {
    orders_count: number;
    total_amount: number;
    average_order: number;
    completion_rate: number;
  };
  growth_rates: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface DeliveryInfo {
  delivery_method: 'pickup' | 'delivery' | 'shipping';
  delivery_address?: string;
  delivery_phone?: string;
  delivery_notes?: string;
  estimated_delivery?: string;
  delivery_fee: number;
  tracking_number?: string;
  delivery_status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
  delivery_person?: string;
  delivery_person_phone?: string;
}

export interface OrderExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  fields: string[];
  filters: OrderFilters;
  include_items: boolean;
  include_customer_details: boolean;
  include_status_history: boolean;
}

export interface OrderAnalytics {
  order_trends: Array<{
    period: string;
    orders_count: number;
    total_amount: number;
    completion_rate: number;
    cancellation_rate: number;
  }>;
  product_performance: Array<{
    product_id: number;
    product_name: string;
    quantity_ordered: number;
    revenue: number;
    order_frequency: number;
  }>;
  customer_behavior: Array<{
    customer_segment: string;
    orders_count: number;
    average_order_value: number;
    repeat_rate: number;
  }>;
  operational_metrics: {
    average_preparation_time: number;
    average_delivery_time: number;
    on_time_delivery_rate: number;
    order_accuracy_rate: number;
  };
}
