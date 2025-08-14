// Stock Check Types
export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  current_stock: number;
  unit_price: number;
}

export interface StockCheckItem {
  product_id: number;
  product_name: string;
  product_sku: string;
  expected_quantity: number;
  actual_quantity: number;
  discrepancy: number;
  notes?: string;
}

export interface StockCheckSession {
  id?: number;
  session_name: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  created_at?: string;
  completed_at?: string;
  items: StockCheckItem[];
  total_items: number;
  items_checked: number;
  discrepancies_found: number;
}

export interface StockCheckFilters {
  search: string;
  category: string;
  status: 'all' | 'accurate' | 'discrepancy' | 'unchecked';
}
