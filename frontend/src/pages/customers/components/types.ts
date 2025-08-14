// Customer Management Types
export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  district?: string;
  ward?: string;
  postal_code?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  customer_type: 'individual' | 'business';
  tax_code?: string;
  company_name?: string;
  loyalty_points: number;
  total_spent: number;
  total_orders: number;
  last_order_date?: string;
  status: 'active' | 'inactive' | 'blocked';
  notes?: string;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  preferred_contact_method?: 'email' | 'phone' | 'sms';
  tags?: string[];
}

export interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  district?: string;
  ward?: string;
  postal_code?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  customer_type: 'individual' | 'business';
  tax_code?: string;
  company_name?: string;
  notes?: string;
  preferred_contact_method?: 'email' | 'phone' | 'sms';
  tags?: string[];
}

export interface CustomerFilters {
  search: string;
  customer_type: 'all' | 'individual' | 'business';
  status: 'all' | 'active' | 'inactive' | 'blocked';
  city: string;
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
