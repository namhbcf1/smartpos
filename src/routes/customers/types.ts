// Customer Module Types
export interface Customer {
  id: number;
  customer_code: string;
  full_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  city?: string;
  district?: string;
  ward?: string;
  postal_code?: string;
  country?: string;
  customer_type: 'individual' | 'business';
  company_name?: string;
  tax_number?: string;
  is_vip: boolean;
  vip_level?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  credit_limit?: number;
  current_balance?: number;
  loyalty_points: number;
  total_spent: number;
  total_orders: number;
  average_order_value: number;
  last_order_date?: string;
  registration_date: string;
  is_active: boolean;
  notes?: string;
  preferences?: string; // JSON string
  marketing_consent: boolean;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by?: number;
  
  // Joined fields
  created_by_name?: string;
  recent_orders?: CustomerOrder[];
  loyalty_transactions?: LoyaltyTransaction[];
}

export interface CustomerOrder {
  id: number;
  sale_id: number;
  order_number: string;
  order_date: string;
  total_amount: number;
  status: string;
  items_count: number;
}

export interface LoyaltyTransaction {
  id: number;
  customer_id: number;
  transaction_type: 'earn' | 'redeem' | 'expire' | 'adjust';
  points: number;
  balance_before: number;
  balance_after: number;
  reference_type?: 'sale' | 'promotion' | 'manual' | 'birthday' | 'referral';
  reference_id?: number;
  description: string;
  expiry_date?: string;
  created_at: string;
  created_by: number;
  
  // Joined fields
  created_by_name?: string;
}

export interface CustomerGroup {
  id: number;
  name: string;
  description?: string;
  discount_percentage?: number;
  special_pricing?: boolean;
  min_order_value?: number;
  max_credit_limit?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  customer_count?: number;
  total_sales?: number;
}

export interface CustomerAddress {
  id: number;
  customer_id: number;
  type: 'home' | 'work' | 'billing' | 'shipping' | 'other';
  label?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  district?: string;
  ward?: string;
  postal_code?: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerContact {
  id: number;
  customer_id: number;
  type: 'phone' | 'email' | 'fax' | 'website' | 'social';
  label?: string;
  value: string;
  is_primary: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerNote {
  id: number;
  customer_id: number;
  note: string;
  type: 'general' | 'complaint' | 'compliment' | 'follow_up' | 'reminder';
  priority: 'low' | 'medium' | 'high';
  is_private: boolean;
  created_at: string;
  created_by: number;
  
  // Joined fields
  created_by_name?: string;
}

export interface CustomerSegment {
  id: number;
  name: string;
  description?: string;
  criteria: string; // JSON string with segmentation rules
  customer_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  customers?: Customer[];
}

export interface LoyaltyProgram {
  id: number;
  name: string;
  description?: string;
  points_per_currency: number; // Points earned per currency unit spent
  currency_per_point: number; // Currency value per point when redeeming
  min_points_to_redeem: number;
  max_points_per_transaction?: number;
  expiry_months?: number; // Points expiry in months
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  terms_and_conditions?: string;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  total_members?: number;
  total_points_issued?: number;
  total_points_redeemed?: number;
}

export interface CustomerStats {
  total_customers: number;
  active_customers: number;
  vip_customers: number;
  new_customers_today: number;
  new_customers_this_week: number;
  new_customers_this_month: number;
  total_loyalty_points: number;
  average_order_value: number;
  customer_lifetime_value: number;
  repeat_customer_rate: number;
  customer_acquisition_cost: number;
  customer_retention_rate: number;
  top_customers: TopCustomer[];
  customer_segments: CustomerSegmentStats[];
  loyalty_program_stats: LoyaltyProgramStats;
  geographic_distribution: GeographicDistribution[];
  age_distribution: AgeDistribution[];
  gender_distribution: GenderDistribution[];
}

export interface TopCustomer {
  customer_id: number;
  customer_name: string;
  customer_phone?: string;
  total_spent: number;
  total_orders: number;
  average_order_value: number;
  last_order_date: string;
  loyalty_points: number;
  vip_level?: string;
}

export interface CustomerSegmentStats {
  segment_id: number;
  segment_name: string;
  customer_count: number;
  total_sales: number;
  average_order_value: number;
  percentage: number;
}

export interface LoyaltyProgramStats {
  total_members: number;
  active_members: number;
  points_issued_today: number;
  points_redeemed_today: number;
  points_balance: number;
  redemption_rate: number;
}

export interface GeographicDistribution {
  city: string;
  customer_count: number;
  total_sales: number;
  percentage: number;
}

export interface AgeDistribution {
  age_group: string;
  customer_count: number;
  percentage: number;
}

export interface GenderDistribution {
  gender: string;
  customer_count: number;
  percentage: number;
}

export interface CustomerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  customer_type?: 'individual' | 'business';
  is_vip?: boolean;
  vip_level?: string;
  city?: string;
  is_active?: boolean;
  registration_date_from?: string;
  registration_date_to?: string;
  last_order_date_from?: string;
  last_order_date_to?: string;
  min_total_spent?: number;
  max_total_spent?: number;
  min_orders?: number;
  max_orders?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface CustomerCreateData {
  full_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  city?: string;
  district?: string;
  ward?: string;
  postal_code?: string;
  country?: string;
  customer_type: 'individual' | 'business';
  company_name?: string;
  tax_number?: string;
  credit_limit?: number;
  notes?: string;
  preferences?: Record<string, any>;
  marketing_consent?: boolean;
  addresses?: CustomerAddressCreateData[];
  contacts?: CustomerContactCreateData[];
}

export interface CustomerUpdateData {
  full_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  city?: string;
  district?: string;
  ward?: string;
  postal_code?: string;
  country?: string;
  customer_type?: 'individual' | 'business';
  company_name?: string;
  tax_number?: string;
  is_vip?: boolean;
  vip_level?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  credit_limit?: number;
  is_active?: boolean;
  notes?: string;
  preferences?: Record<string, any>;
  marketing_consent?: boolean;
}

export interface CustomerAddressCreateData {
  type: 'home' | 'work' | 'billing' | 'shipping' | 'other';
  label?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  district?: string;
  ward?: string;
  postal_code?: string;
  country: string;
  is_default?: boolean;
}

export interface CustomerContactCreateData {
  type: 'phone' | 'email' | 'fax' | 'website' | 'social';
  label?: string;
  value: string;
  is_primary?: boolean;
}

export interface LoyaltyTransactionCreateData {
  customer_id: number;
  transaction_type: 'earn' | 'redeem' | 'expire' | 'adjust';
  points: number;
  reference_type?: 'sale' | 'promotion' | 'manual' | 'birthday' | 'referral';
  reference_id?: number;
  description: string;
  expiry_date?: string;
}

export interface CustomerResponse {
  success: boolean;
  data?: Customer | Customer[] | CustomerStats | LoyaltyTransaction | LoyaltyTransaction[] | any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats?: CustomerStats;
  message?: string;
}
