/**
 * Warranty Type Definitions
 * Based on database schema from docs/D1_DATABASE_SCHEMA.md
 */

export interface Warranty {
  id: string
  tenant_id: string
  warranty_code: string
  product_id: string
  customer_id: string | null
  order_id: string | null
  warranty_type: 'standard' | 'extended' | 'premium'
  start_date: string // ISO date string
  end_date: string // ISO date string
  status: 'active' | 'expired' | 'claimed' | 'cancelled'
  notes: string | null
  created_at: string
  updated_at: string

  // Denormalized fields for display
  product_name?: string
  customer_name?: string
  customer_phone?: string
  days_remaining?: number
}

export interface WarrantyRegistration {
  id: number
  warranty_number: string
  serial_number_id: number
  product_id: number
  customer_id: number
  sale_id: number
  warranty_type: string
  warranty_period_months: number
  warranty_start_date: string
  warranty_end_date: string
  status: 'active' | 'expired' | 'cancelled'
  terms_accepted: number
  terms_accepted_date: string | null
  terms_version: string | null
  contact_phone: string | null
  contact_email: string | null
  contact_address: string | null
  created_at: string
  updated_at: string
  created_by: number
}

export interface WarrantyClaim {
  id: number
  claim_number: string
  warranty_registration_id: number
  serial_number_id: number
  claim_type: 'repair' | 'replacement' | 'refund'
  issue_description: string
  reported_date: string
  status: 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'completed'
  resolution_type: string | null
  resolution_description: string | null
  resolution_date: string | null
  estimated_cost: number
  actual_cost: number
  covered_by_warranty: number
  customer_charge: number
  technician_id: number | null
  service_provider: string | null
  external_reference: string | null
  created_at: string
  updated_at: string
  created_by: number
}

export interface SerialNumber {
  id: string
  tenant_id: string
  serial_number: string
  product_id: string
  status: 'available' | 'sold' | 'in_warranty' | 'warranty_expired' | 'defective'
  order_id: string | null
  warranty_id: string | null
  notes: string | null
  created_at: string
  updated_at: string

  // Denormalized
  product_name?: string
  product_sku?: string
}

export interface WarrantyAlert {
  id: string
  warranty_id: string
  alert_type: 'expiring_soon' | 'expired' | 'claim_due'
  days_before_expiry: number | null
  message: string | null
  status: 'active' | 'sent' | 'dismissed'
  created_at: string
  updated_at: string
}

// API Response types
export interface WarrantyListResponse {
  success: boolean
  warranties: Warranty[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface WarrantyDetailResponse {
  success: boolean
  data: Warranty
}

export interface WarrantyStats {
  total_warranties: number
  active_warranties: number
  expiring_soon: number // within 30 days
  expired_warranties: number
  total_claims: number
  pending_claims: number
}

// Form types
export interface WarrantyFormData {
  warranty_code: string
  product_id: string
  customer_id: string | null
  order_id: string | null
  warranty_type: 'standard' | 'extended' | 'premium'
  start_date: string
  end_date: string
  notes: string
}

export interface ClaimFormData {
  warranty_id: string
  claim_type: 'repair' | 'replacement' | 'refund'
  issue_description: string
  estimated_cost: number
}
