// Customer Management Types - DB Schema Compliant
export interface Customer {
  id: string; // TEXT PK per DB schema
  name: string;
  email?: string; // Optional per DB schema
  phone?: string; // Optional per DB schema
  address?: string;
  date_of_birth?: string; // ISO 8601: '1990-05-15'
  gender?: 'male' | 'female' | 'other';
  customer_type: 'regular' | 'vip' | 'wholesale'; // per DB schema
  loyalty_points: number; // CHECK (loyalty_points >= 0)
  total_spent_cents: number; // VND x 100, CHECK (total_spent_cents >= 0)
  visit_count: number; // CHECK (visit_count >= 0)
  last_visit?: string; // ISO 8601
  is_active: boolean; // 0=inactive, 1=active
  created_at: string;
  updated_at: string;
}

export interface CustomerFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string; // ISO 8601: '1990-05-15'
  gender?: 'male' | 'female' | 'other';
  customer_type: 'regular' | 'vip' | 'wholesale'; // per DB schema
}

export interface CustomerFilters {
  search: string;
  customer_type: 'all' | 'regular' | 'vip' | 'wholesale'; // per DB schema
  is_active: 'all' | 'active' | 'inactive';
  loyalty_tier: 'all' | 'bronze' | 'silver' | 'gold' | 'platinum';
  date_range: {
    start?: string;
    end?: string;
  };
}

export interface CustomerStats {
  total_customers: number;
  active_customers: number;
  new_customers_this_month: number;
  total_loyalty_points: number;
  average_order_value: number;
  top_customers: Customer[];
  customer_growth_rate: number;
  retention_rate: number;
}

export interface CustomerActivity {
  id: number;
  customer_id: number;
  activity_type: 'order' | 'payment' | 'return' | 'contact' | 'loyalty';
  description: string;
  amount?: number;
  points_earned?: number;
  points_used?: number;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface LoyaltyProgram {
  id: number;
  name: string;
  description: string;
  points_per_dollar: number;
  min_points_to_redeem: number;
  redemption_value: number; // VND per point
  tier_thresholds: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
  benefits: {
    tier: string;
    discount_percentage: number;
    special_offers: string[];
  }[];
  status: 'active' | 'inactive';
}

export interface CustomerImportData {
  name: string;
  email: string;
  phone: string;
  address?: string;
  customer_type: 'individual' | 'business';
  company_name?: string;
  notes?: string;
}

export interface CustomerExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  fields: string[];
  filters: CustomerFilters;
  include_activity: boolean;
  include_orders: boolean;
}
