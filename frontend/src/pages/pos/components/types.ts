// Point of Sale Types - Now using unified types
export { 
  Product,
  Customer, 
  CartItem,
  Sale,
  Category,
  POSState,
  POSFilters,
  SalesSummary
} from '../../../types/unified';

// Additional POS-specific types - DB Schema Compliant
export interface PaymentMethod {
  id: string; // TEXT PK per DB schema
  name: string; // TEXT NOT NULL
  code: string; // TEXT UNIQUE NOT NULL
  description?: string;
  fee_percentage: number; // REAL DEFAULT 0
  is_active: boolean; // INTEGER DEFAULT 1
  created_at: string;
}

export interface Payment {
  id: string; // TEXT PK per DB schema
  order_id: string; // TEXT NOT NULL FK → orders.id
  payment_method_id: string; // TEXT NOT NULL FK → payment_methods.id
  amount_cents: number; // INTEGER NOT NULL CHECK (amount_cents > 0)
  reference?: string; // Mã giao dịch từ gateway
  status: 'pending' | 'completed' | 'failed' | 'refunded'; // per DB schema
  processed_at: string; // TEXT DEFAULT (datetime('now'))
  created_at: string;
}
