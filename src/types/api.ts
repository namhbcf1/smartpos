/**
 * API Contract Types - Single source of truth for all API interfaces
 *
 * These types ensure type safety between backend and frontend
 * and prevent schema mismatches.
 */

import { z } from 'zod';

// ===================================================================
// COMMON TYPES
// ===================================================================

export const StatusSchema = z.enum(['active', 'inactive', 'pending', 'completed', 'cancelled', 'refunded', 'draft']);
export const RoleSchema = z.enum(['admin', 'manager', 'cashier', 'employee']);
export const PaymentStatusSchema = z.enum(['pending', 'completed', 'failed', 'refunded']);

// Base response wrapper
export const BaseResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
});

export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

// ===================================================================
// USER & AUTHENTICATION
// ===================================================================

export const UserSchema = z.object({
  id: z.string(),
  username: z.string().min(3).max(50),
  email: z.string().email(),
  full_name: z.string().min(1).max(100),
  role: RoleSchema,
  is_active: z.number().int().min(0).max(1),
  last_login: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const LoginRequestSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
});

export const LoginResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    token: z.string(),
    user: UserSchema,
    expires_at: z.string(),
  }).nullable(),
});

// ===================================================================
// PRODUCTS
// ===================================================================

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200),
  sku: z.string().min(1).max(50),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  isActive: z.number().int().min(0).max(1),
  categoryId: z.string().nullable(),
  supplierId: z.string().nullable(),
  description: z.string().nullable(),
  image_url: z.string().url().nullable(),
  cost_price: z.number().nonnegative().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateProductSchema = ProductSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const ProductsResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    products: z.array(ProductSchema),
    pagination: PaginationSchema,
  }).nullable(),
});

// ===================================================================
// CATEGORIES
// ===================================================================

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().nullable(),
  parent_id: z.string().nullable(),
  image_url: z.string().url().nullable(),
  sort_order: z.number().int().nonnegative().default(0),
  is_active: z.number().int().min(0).max(1).default(1),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateCategorySchema = CategorySchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// ===================================================================
// CUSTOMERS
// ===================================================================

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  email: z.string().email().nullable(),
  phone: z.string().min(10).max(20).nullable(),
  address: z.string().max(500).nullable(),
  date_of_birth: z.string().nullable(),
  gender: z.enum(['male', 'female', 'other']).nullable(),
  total_purchases: z.number().nonnegative().default(0),
  total_spent: z.number().nonnegative().default(0),
  loyalty_points: z.number().int().nonnegative().default(0),
  tier_id: z.string().nullable(),
  is_active: z.number().int().min(0).max(1).default(1),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateCustomerSchema = CustomerSchema.omit({
  id: true,
  total_purchases: true,
  total_spent: true,
  loyalty_points: true,
  created_at: true,
  updated_at: true,
});

// ===================================================================
// ORDERS & SALES
// ===================================================================

export const OrderItemSchema = z.object({
  id: z.string(),
  order_id: z.string(),
  product_id: z.string(),
  product_name: z.string(),
  product_sku: z.string().nullable(),
  quantity: z.number().int().positive(),
  unit_price_cents: z.number().int().nonnegative(),
  total_price_cents: z.number().int().nonnegative(),
  discount_cents: z.number().int().nonnegative().default(0),
  created_at: z.string(),
});

export const OrderSchema = z.object({
  id: z.string(),
  order_number: z.string(),
  customer_id: z.string().nullable(),
  customer_name: z.string().nullable(),
  customer_phone: z.string().nullable(),
  user_id: z.string(),
  store_id: z.string(),
  status: z.enum(['draft', 'pending', 'completed', 'cancelled', 'refunded']),
  subtotal_cents: z.number().int().nonnegative(),
  discount_cents: z.number().int().nonnegative().default(0),
  tax_cents: z.number().int().nonnegative().default(0),
  total_cents: z.number().int().nonnegative(),
  payment_method: z.string().nullable(),
  payment_status: PaymentStatusSchema.default('pending'),
  notes: z.string().nullable(),
  receipt_printed: z.number().int().min(0).max(1).default(0),
  created_at: z.string(),
  updated_at: z.string(),
  items: z.array(OrderItemSchema).optional(),
});

export const CreateOrderItemSchema = z.object({
  product_id: z.string(),
  quantity: z.number().int().positive(),
  unit_price_cents: z.number().int().nonnegative(),
  discount_cents: z.number().int().nonnegative().default(0),
});

export const CreateOrderSchema = z.object({
  customer_id: z.string().nullable(),
  customer_name: z.string().nullable(),
  customer_phone: z.string().nullable(),
  payment_method: z.string().default('cash'),
  discount_cents: z.number().int().nonnegative().default(0),
  tax_cents: z.number().int().nonnegative().default(0),
  notes: z.string().nullable(),
  items: z.array(CreateOrderItemSchema).min(1),
});

export const OrdersResponseSchema = BaseResponseSchema.extend({
  data: z.object({
    orders: z.array(OrderSchema),
    pagination: PaginationSchema,
  }).nullable(),
});

// ===================================================================
// SALES ANALYTICS
// ===================================================================

export const SalesStatsSchema = z.object({
  orders: z.number().int().nonnegative(),
  revenue: z.number().nonnegative(),
  avg_order_value: z.number().nonnegative(),
  profit: z.number(),
});

export const SalesAnalyticsSchema = z.object({
  today: SalesStatsSchema,
  month: SalesStatsSchema,
  comparison: z.object({
    yesterday: SalesStatsSchema,
    last_month: SalesStatsSchema,
  }),
});

// ===================================================================
// INVENTORY
// ===================================================================

export const InventoryMovementSchema = z.object({
  id: z.string(),
  product_id: z.string(),
  type: z.enum(['in', 'out', 'adjustment', 'transfer']),
  quantity: z.number().int(),
  previous_stock: z.number().int().nonnegative(),
  new_stock: z.number().int().nonnegative(),
  reason: z.string().nullable(),
  reference_id: z.string().nullable(),
  user_id: z.string(),
  created_at: z.string(),
});

// ===================================================================
// ERROR RESPONSES
// ===================================================================

export const ErrorResponseSchema = BaseResponseSchema.extend({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
  details: z.record(z.string(), z.any()).optional(),
});

export const ValidationErrorSchema = ErrorResponseSchema.extend({
  code: z.literal('VALIDATION_ERROR'),
  details: z.record(z.string(), z.array(z.string())).optional(),
});

// ===================================================================
// EXPORTED TYPES
// ===================================================================

export type User = z.infer<typeof UserSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export type Product = z.infer<typeof ProductSchema>;
export type CreateProduct = z.infer<typeof CreateProductSchema>;
export type UpdateProduct = z.infer<typeof UpdateProductSchema>;
export type ProductsResponse = z.infer<typeof ProductsResponseSchema>;

export type Category = z.infer<typeof CategorySchema>;
export type CreateCategory = z.infer<typeof CreateCategorySchema>;

export type Customer = z.infer<typeof CustomerSchema>;
export type CreateCustomer = z.infer<typeof CreateCustomerSchema>;

export type Order = z.infer<typeof OrderSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type CreateOrder = z.infer<typeof CreateOrderSchema>;
export type CreateOrderItem = z.infer<typeof CreateOrderItemSchema>;
export type OrdersResponse = z.infer<typeof OrdersResponseSchema>;

export type SalesStats = z.infer<typeof SalesStatsSchema>;
export type SalesAnalytics = z.infer<typeof SalesAnalyticsSchema>;

export type InventoryMovement = z.infer<typeof InventoryMovementSchema>;

export type BaseResponse = z.infer<typeof BaseResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;

// ===================================================================
// VALIDATION HELPERS
// ===================================================================

export const validateRequest = <T>(schema: z.ZodSchema<T>, data: unknown, _ctx?: any): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.message}`);
  }
  return result.data;
};

export const createValidationError = (errors: z.ZodError): ValidationError => ({
  success: false,
  error: 'Validation failed',
  code: 'VALIDATION_ERROR',
  details: errors.issues.reduce((acc, issue) => {
    const path = issue.path.join('.');
    if (!acc[path]) acc[path] = [] as string[];
    (acc[path] as string[]).push(issue.message);
    return acc;
  }, {} as Record<string, string[]>),
});

// ===================================================================
// LEGACY COMPATIBILITY (for existing code)
// ===================================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors?: any[];
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}
