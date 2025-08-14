// Inventory Module Types
export interface InventoryItem {
  id: number;
  product_id: number;
  location_id?: number;
  batch_number?: string;
  serial_number?: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  cost_price: number;
  selling_price: number;
  expiry_date?: string;
  manufacture_date?: string;
  supplier_id?: number;
  purchase_order_id?: number;
  status: 'active' | 'damaged' | 'expired' | 'returned';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by?: number;
  
  // Joined fields
  product_name?: string;
  product_sku?: string;
  product_category?: string;
  location_name?: string;
  supplier_name?: string;
}

export interface StockMovement {
  id: number;
  product_id: number;
  movement_type: 'in' | 'out' | 'adjustment' | 'transfer' | 'return' | 'damage';
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  cost_price?: number;
  reference_type?: 'sale' | 'purchase' | 'adjustment' | 'transfer' | 'return';
  reference_id?: number;
  location_id?: number;
  batch_number?: string;
  reason?: string;
  notes?: string;
  created_at: string;
  created_by: number;
  
  // Joined fields
  product_name?: string;
  product_sku?: string;
  user_name?: string;
  location_name?: string;
}

export interface StockAdjustment {
  id: number;
  adjustment_number: string;
  description: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  total_items: number;
  total_value_change: number;
  reason: string;
  notes?: string;
  created_at: string;
  created_by: number;
  approved_at?: string;
  approved_by?: number;
  
  // Joined fields
  created_by_name?: string;
  approved_by_name?: string;
  items?: StockAdjustmentItem[];
}

export interface StockAdjustmentItem {
  id: number;
  adjustment_id: number;
  product_id: number;
  current_quantity: number;
  adjusted_quantity: number;
  quantity_change: number;
  cost_price: number;
  value_change: number;
  reason?: string;
  notes?: string;
  
  // Joined fields
  product_name?: string;
  product_sku?: string;
}

export interface StockTransfer {
  id: number;
  transfer_number: string;
  from_location_id: number;
  to_location_id: number;
  status: 'draft' | 'pending' | 'in_transit' | 'completed' | 'cancelled';
  total_items: number;
  notes?: string;
  created_at: string;
  created_by: number;
  shipped_at?: string;
  shipped_by?: number;
  received_at?: string;
  received_by?: number;
  
  // Joined fields
  from_location_name?: string;
  to_location_name?: string;
  created_by_name?: string;
  shipped_by_name?: string;
  received_by_name?: string;
  items?: StockTransferItem[];
}

export interface StockTransferItem {
  id: number;
  transfer_id: number;
  product_id: number;
  quantity_requested: number;
  quantity_shipped: number;
  quantity_received: number;
  batch_number?: string;
  notes?: string;
  
  // Joined fields
  product_name?: string;
  product_sku?: string;
}

export interface Location {
  id: number;
  name: string;
  code: string;
  type: 'warehouse' | 'store' | 'section' | 'shelf' | 'bin';
  parent_id?: number;
  address?: string;
  description?: string;
  is_active: boolean;
  capacity?: number;
  current_utilization?: number;
  manager_id?: number;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  parent_name?: string;
  manager_name?: string;
  children?: Location[];
  inventory_items?: InventoryItem[];
}

export interface Supplier {
  id: number;
  name: string;
  code: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  tax_number?: string;
  payment_terms?: string;
  credit_limit?: number;
  current_balance?: number;
  rating?: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by?: number;
  
  // Joined fields
  total_orders?: number;
  total_value?: number;
  last_order_date?: string;
  products?: Product[];
}

export interface PurchaseOrder {
  id: number;
  order_number: string;
  supplier_id: number;
  status: 'draft' | 'sent' | 'confirmed' | 'partial' | 'completed' | 'cancelled';
  order_date: string;
  expected_date?: string;
  received_date?: string;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_status: 'pending' | 'partial' | 'paid';
  notes?: string;
  created_at: string;
  created_by: number;
  updated_at: string;
  updated_by?: number;
  
  // Joined fields
  supplier_name?: string;
  created_by_name?: string;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  total_cost: number;
  notes?: string;
  
  // Joined fields
  product_name?: string;
  product_sku?: string;
}

export interface LowStockAlert {
  id: number;
  product_id: number;
  current_stock: number;
  min_stock_level: number;
  reorder_level: number;
  suggested_order_quantity: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: string;
  acknowledged_at?: string;
  acknowledged_by?: number;
  resolved_at?: string;
  resolved_by?: number;
  
  // Joined fields
  product_name?: string;
  product_sku?: string;
  product_category?: string;
  supplier_name?: string;
  acknowledged_by_name?: string;
  resolved_by_name?: string;
}

export interface InventoryStats {
  total_products: number;
  total_stock_value: number;
  total_items_in_stock: number;
  low_stock_items: number;
  out_of_stock_items: number;
  overstocked_items: number;
  total_locations: number;
  active_suppliers: number;
  pending_orders: number;
  recent_movements: number;
  inventory_turnover: number;
  average_stock_age: number;
  top_moving_products: TopMovingProduct[];
  stock_by_category: StockByCategory[];
  stock_by_location: StockByLocation[];
  movement_trends: MovementTrend[];
}

export interface TopMovingProduct {
  product_id: number;
  product_name: string;
  product_sku: string;
  total_movements: number;
  total_quantity_moved: number;
  movement_value: number;
  turnover_rate: number;
}

export interface StockByCategory {
  category_id: number;
  category_name: string;
  total_products: number;
  total_stock: number;
  total_value: number;
  percentage: number;
}

export interface StockByLocation {
  location_id: number;
  location_name: string;
  total_products: number;
  total_stock: number;
  total_value: number;
  utilization_percentage: number;
}

export interface MovementTrend {
  date: string;
  movements_in: number;
  movements_out: number;
  net_movement: number;
  value_in: number;
  value_out: number;
  net_value: number;
}

export interface InventoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  product_id?: number;
  location_id?: number;
  supplier_id?: number;
  status?: string;
  movement_type?: string;
  date_from?: string;
  date_to?: string;
  low_stock_only?: boolean;
  out_of_stock_only?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface InventoryCreateData {
  product_id: number;
  location_id?: number;
  quantity: number;
  cost_price: number;
  selling_price?: number;
  batch_number?: string;
  serial_number?: string;
  expiry_date?: string;
  manufacture_date?: string;
  supplier_id?: number;
  notes?: string;
}

export interface InventoryUpdateData {
  location_id?: number;
  quantity?: number;
  cost_price?: number;
  selling_price?: number;
  batch_number?: string;
  serial_number?: string;
  expiry_date?: string;
  manufacture_date?: string;
  status?: 'active' | 'damaged' | 'expired' | 'returned';
  notes?: string;
}

export interface StockAdjustmentCreateData {
  description: string;
  reason: string;
  items: StockAdjustmentItemCreateData[];
  notes?: string;
}

export interface StockAdjustmentItemCreateData {
  product_id: number;
  adjusted_quantity: number;
  reason?: string;
  notes?: string;
}

export interface StockTransferCreateData {
  from_location_id: number;
  to_location_id: number;
  items: StockTransferItemCreateData[];
  notes?: string;
}

export interface StockTransferItemCreateData {
  product_id: number;
  quantity: number;
  batch_number?: string;
  notes?: string;
}

export interface InventoryResponse {
  success: boolean;
  data?: InventoryItem | InventoryItem[] | StockMovement | StockMovement[] | InventoryStats | any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats?: InventoryStats;
  message?: string;
}
