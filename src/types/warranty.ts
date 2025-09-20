// ==========================================
// COMPUTERPOS PRO - WARRANTY SYSTEM TYPES
// TypeScript interfaces for warranty management
// ==========================================

import { z } from 'zod';

// ==========================================
// ENUMS AND CONSTANTS
// ==========================================

export const SerialNumberStatus = {
  IN_STOCK: 'in_stock',
  SOLD: 'sold',
  RETURNED: 'returned',
  DEFECTIVE: 'defective',
  WARRANTY_CLAIM: 'warranty_claim',
  DISPOSED: 'disposed'
} as const;

export const WarrantyType = {
  MANUFACTURER: 'manufacturer',
  STORE: 'store',
  EXTENDED: 'extended',
  PREMIUM: 'premium'
} as const;

export const WarrantyStatus = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  VOIDED: 'voided',
  CLAIMED: 'claimed',
  TRANSFERRED: 'transferred'
} as const;

export const ClaimType = {
  REPAIR: 'repair',
  REPLACEMENT: 'replacement',
  REFUND: 'refund',
  DIAGNOSTIC: 'diagnostic'
} as const;

export const ClaimStatus = {
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
} as const;

export const ResolutionType = {
  REPAIRED: 'repaired',
  REPLACED: 'replaced',
  REFUNDED: 'refunded',
  NO_FAULT_FOUND: 'no_fault_found',
  OUT_OF_WARRANTY: 'out_of_warranty'
} as const;

export const NotificationType = {
  EXPIRY_WARNING: 'expiry_warning',
  EXPIRED: 'expired',
  CLAIM_UPDATE: 'claim_update',
  REGISTRATION_CONFIRMATION: 'registration_confirmation'
} as const;

export const NotificationMethod = {
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  IN_APP: 'in_app'
} as const;

export const NotificationStatus = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
} as const;

// ==========================================
// CORE INTERFACES
// ==========================================

export interface SerialNumber {
  id: string; // TEXT PK per detailed schema
  product_id: string; // TEXT NOT NULL FK → products.id
  variant_id?: string; // TEXT FK → product_variants.id
  serial_number: string; // TEXT UNIQUE NOT NULL
  status: 'available' | 'sold' | 'returned' | 'defective'; // TEXT DEFAULT 'available' per detailed schema
  batch_number?: string; // TEXT per detailed schema
  purchase_date?: string; // TEXT (ISO 8601) per detailed schema
  sale_date?: string; // TEXT (ISO 8601) per detailed schema
  customer_id?: string; // TEXT FK → customers.id
  warranty_start_date?: string; // TEXT per detailed schema
  warranty_end_date?: string; // TEXT per detailed schema
  notes?: string; // TEXT per detailed schema
  created_at: string; // TEXT DEFAULT (datetime('now'))
  updated_at: string; // TEXT DEFAULT (datetime('now'))

  // Legacy compatibility fields
  supplier_id?: string; // For backward compatibility
  received_date?: string; // Legacy field
  sale_id?: string; // Legacy field
  location?: string; // Legacy field
  condition_notes?: string; // Legacy field
  created_by?: string; // Legacy field
  
  // Joined data
  product?: {
    id: string; // TEXT PK per detailed schema
    name: string;
    sku: string;
    category_name?: string;
  };
  customer?: {
    id: string; // TEXT PK per detailed schema
    full_name: string;
    phone?: string;
    email?: string;
  };
  supplier?: {
    id: string; // TEXT PK per detailed schema
    name: string;
  };
}

export interface WarrantyRegistration {
  id: number;
  warranty_number: string;
  serial_number_id: number;
  product_id: number;
  customer_id: number;
  sale_id: number;
  warranty_type: keyof typeof WarrantyType;
  warranty_period_months: number;
  warranty_start_date: string;
  warranty_end_date: string;
  status: keyof typeof WarrantyStatus;
  terms_accepted: boolean;
  terms_accepted_date?: string;
  terms_version?: string;
  contact_phone?: string;
  contact_email?: string;
  contact_address?: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  
  // Joined data
  serial_number?: SerialNumber;
  product?: {
    id: number;
    name: string;
    sku: string;
    category_name?: string;
  };
  customer?: {
    id: number;
    full_name: string;
    phone?: string;
    email?: string;
  };
  sale?: {
    id: number;
    receipt_number: string;
    final_amount: number;
  };
}

export interface WarrantyClaim {
  id: number;
  claim_number: string;
  warranty_registration_id: number;
  serial_number_id: number;
  claim_type: keyof typeof ClaimType;
  issue_description: string;
  reported_date: string;
  status: keyof typeof ClaimStatus;
  resolution_type?: keyof typeof ResolutionType;
  resolution_description?: string;
  resolution_date?: string;
  estimated_cost: number;
  actual_cost: number;
  covered_by_warranty: boolean;
  customer_charge: number;
  technician_id?: number;
  service_provider?: string;
  external_reference?: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  
  // Joined data
  warranty_registration?: WarrantyRegistration;
  serial_number?: SerialNumber;
  technician?: {
    id: number;
    full_name: string;
    username: string;
  };
}

export interface WarrantyNotification {
  id: number;
  warranty_registration_id: number;
  notification_type: keyof typeof NotificationType;
  notification_method: keyof typeof NotificationMethod;
  scheduled_date: string;
  sent_date?: string;
  subject?: string;
  message: string;
  template_id?: string;
  status: keyof typeof NotificationStatus;
  delivery_status?: 'delivered' | 'bounced' | 'opened' | 'clicked';
  error_message?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  warranty_registration?: WarrantyRegistration;
}

export interface ProductWarrantyConfig {
  id: number;
  product_id?: number;
  category_id?: number;
  default_warranty_months: number;
  max_warranty_months: number;
  warranty_type: keyof typeof WarrantyType;
  warning_days_before_expiry: number;
  enable_auto_notifications: boolean;
  warranty_terms?: string;
  exclusions?: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  
  // Joined data
  product?: {
    id: number;
    name: string;
    sku: string;
  };
  category?: {
    id: number;
    name: string;
  };
}

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

export const serialNumberCreateSchema = z.object({
  serial_number: z.string().min(1).max(100),
  product_id: z.number().int().positive(),
  supplier_id: z.number().int().positive().optional(),
  location: z.string().max(100).optional(),
  condition_notes: z.string().max(500).optional(),
});

export const serialNumberUpdateSchema = z.object({
  status: z.enum(['in_stock', 'sold', 'returned', 'defective', 'warranty_claim', 'disposed']).optional(),
  location: z.string().max(100).optional(),
  condition_notes: z.string().max(500).optional(),
  sale_id: z.number().int().positive().optional(),
  customer_id: z.number().int().positive().optional(),
});

export const warrantyRegistrationCreateSchema = z.object({
  serial_number_id: z.number().int().positive(),
  warranty_type: z.enum(['manufacturer', 'store', 'extended', 'premium']).default('manufacturer'),
  warranty_period_months: z.number().int().min(1).max(120).default(12),
  terms_accepted: z.boolean().default(false),
  contact_phone: z.string().max(20).optional(),
  contact_email: z.string().email().optional(),
  contact_address: z.string().max(500).optional(),
});

export const warrantyClaimCreateSchema = z.object({
  warranty_registration_id: z.number().int().positive(),
  claim_type: z.enum(['repair', 'replacement', 'refund', 'diagnostic']),
  issue_description: z.string().min(10).max(2000),
  estimated_cost: z.number().min(0).default(0),
  technician_id: z.number().int().positive().optional(),
  service_provider: z.string().max(200).optional(),
  external_reference: z.string().max(100).optional(),
});

export const warrantyClaimUpdateSchema = z.object({
  status: z.enum(['submitted', 'approved', 'in_progress', 'completed', 'rejected', 'cancelled']).optional(),
  resolution_type: z.enum(['repaired', 'replaced', 'refunded', 'no_fault_found', 'out_of_warranty']).optional(),
  resolution_description: z.string().max(2000).optional(),
  actual_cost: z.number().min(0).optional(),
  covered_by_warranty: z.boolean().optional(),
  customer_charge: z.number().min(0).optional(),
  technician_id: z.number().int().positive().optional(),
});

export const productWarrantyConfigSchema = z.object({
  product_id: z.number().int().positive().optional(),
  category_id: z.number().int().positive().optional(),
  default_warranty_months: z.number().int().min(1).max(120).default(12),
  max_warranty_months: z.number().int().min(1).max(120).default(36),
  warranty_type: z.enum(['manufacturer', 'store', 'extended', 'premium']).default('manufacturer'),
  warning_days_before_expiry: z.number().int().min(1).max(365).default(30),
  enable_auto_notifications: z.boolean().default(true),
  warranty_terms: z.string().max(5000).optional(),
  exclusions: z.string().max(2000).optional(),
}).refine(data => data.product_id || data.category_id, {
  message: "Either product_id or category_id must be provided"
});

// ==========================================
// API RESPONSE TYPES
// ==========================================

export interface SerialNumberResponse {
  success: boolean;
  data: SerialNumber | SerialNumber[];
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface WarrantyRegistrationResponse {
  success: boolean;
  data: WarrantyRegistration | WarrantyRegistration[];
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface WarrantyClaimResponse {
  success: boolean;
  data: WarrantyClaim | WarrantyClaim[];
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ==========================================
// DASHBOARD & ANALYTICS TYPES
// ==========================================

export interface WarrantyDashboardStats {
  total_active_warranties: number;
  expiring_soon: number; // Within 30 days
  expired_this_month: number;
  pending_claims: number;
  completed_claims_this_month: number;
  warranty_cost_this_month: number;
  average_claim_resolution_days: number;
  warranty_claim_rate: number; // Percentage
}

export interface SerialNumberStats {
  total_serial_numbers: number;
  in_stock: number;
  sold: number;
  warranty_claims: number;
  defective: number;
  disposed: number;
}

export interface WarrantyTrend {
  date: string;
  registrations: number;
  claims: number;
  expirations: number;
  cost: number;
}

// ==========================================
// SEARCH & FILTER TYPES
// ==========================================

export interface SerialNumberFilters {
  status?: 'available' | 'sold' | 'returned' | 'defective'; // Updated to match detailed schema
  product_id?: string; // TEXT FK → products.id
  variant_id?: string; // TEXT FK → product_variants.id
  category_id?: string; // TEXT FK → categories.id
  supplier_id?: string; // TEXT FK → suppliers.id
  customer_id?: string; // TEXT FK → customers.id
  date_from?: string;
  date_to?: string;
  search?: string; // Search in serial number, product name, customer name
}

export interface WarrantyFilters {
  status?: keyof typeof WarrantyStatus;
  warranty_type?: keyof typeof WarrantyType;
  expiring_within_days?: number;
  customer_id?: number;
  product_id?: number;
  category_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface ClaimFilters {
  status?: keyof typeof ClaimStatus;
  claim_type?: keyof typeof ClaimType;
  technician_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
}
