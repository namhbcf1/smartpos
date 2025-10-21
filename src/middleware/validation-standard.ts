/**
 * Standard Validation Middleware - Clean and focused input validation
 *
 * This middleware provides standardized validation for all API endpoints
 * using Zod schemas with clear error messages.
 */

import { Context, Next } from 'hono';
import { z, ZodError } from 'zod';
import { createValidationError } from '../types/api';

// Create validation middleware factory
export const validateRequest = (schema: {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
}) => {
  return async (c: any, next: any) => {
    try {
      // Validate request body
      if (schema.body) {
        const body = await c.req.json().catch(() => ({}));
        const result = schema.body.safeParse(body);

        if (!result.success) {
          return c.json(createValidationError(result.error), 422);
        }

        // Attach validated data to context
        c.set('validatedBody', result.data);
      }

      // Validate query parameters
      if (schema.query) {
        const query = c.req.query();
        const result = schema.query.safeParse(query);

        if (!result.success) {
          return c.json(createValidationError(result.error), 422);
        }

        c.set('validatedQuery', result.data);
      }

      // Validate path parameters
      if (schema.params) {
        const params = c.req.param();
        const result = schema.params.safeParse(params);

        if (!result.success) {
          return c.json(createValidationError(result.error), 422);
        }

        c.set('validatedParams', result.data);
      }

      await next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      return c.json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR'
      }, 422);
    }
  };
};

// Common validation schemas for reuse
export const CommonSchemas = {
  // Pagination
  paginationQuery: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
  }),

  // ID parameter
  idParam: z.object({
    id: z.string().min(1, 'ID is required'),
  }),

  // Search and filters
  searchQuery: z.object({
    search: z.string().optional(),
    status: z.string().optional(),
    category: z.string().optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
  }),

  // Bulk operations
  bulkIds: z.object({
    ids: z.array(z.string().min(1)).min(1, 'At least one ID required'),
  }),
};

// Validation decorators for easy use
export const withValidation = {
  // Products
  createProduct: validateRequest({
    body: z.object({
      name: z.string().min(1, 'Product name is required').max(200),
      sku: z.string().min(1, 'SKU is required').max(50),
      price: z.number().nonnegative('Price must be non-negative'),
      stock: z.number().int().nonnegative('Stock must be non-negative integer'),
      categoryId: z.string().nullable(),
      supplierId: z.string().nullable(),
      description: z.string().nullable(),
      image_url: z.string().url().nullable(),
      cost_price: z.number().nonnegative().nullable(),
      isActive: z.number().int().min(0).max(1).default(1),
    }),
  }),

  updateProduct: validateRequest({
    params: CommonSchemas.idParam,
    body: z.object({
      name: z.string().min(1).max(200).optional(),
      sku: z.string().min(1).max(50).optional(),
      price: z.number().nonnegative().optional(),
      stock: z.number().int().nonnegative().optional(),
      categoryId: z.string().nullable().optional(),
      supplierId: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      image_url: z.string().url().nullable().optional(),
      cost_price: z.number().nonnegative().nullable().optional(),
      isActive: z.number().int().min(0).max(1).optional(),
    }),
  }),

  // Categories
  createCategory: validateRequest({
    body: z.object({
      name: z.string().min(1, 'Category name is required').max(100),
      description: z.string().nullable(),
      parent_id: z.string().nullable(),
      image_url: z.string().url().nullable(),
      sort_order: z.number().int().nonnegative().default(0),
      is_active: z.number().int().min(0).max(1).default(1),
    }),
  }),

  // Customers
  createCustomer: validateRequest({
    body: z.object({
      name: z.string().min(1, 'Customer name is required').max(100),
      email: z.string().email().nullable(),
      phone: z.string().min(10).max(20).nullable(),
      address: z.string().max(500).nullable(),
      date_of_birth: z.string().nullable(),
      gender: z.enum(['male', 'female', 'other']).nullable(),
    }),
  }),

  // Orders
  createOrder: validateRequest({
    body: z.object({
      customer_id: z.string().nullable(),
      customer_name: z.string().nullable(),
      customer_phone: z.string().nullable(),
      payment_method: z.string().default('cash'),
      discount_cents: z.number().int().nonnegative().default(0),
      tax_cents: z.number().int().nonnegative().default(0),
      notes: z.string().nullable(),
      items: z.array(z.object({
        product_id: z.string().min(1, 'Product ID is required'),
        quantity: z.number().int().positive('Quantity must be positive'),
        unit_price_cents: z.number().int().nonnegative('Unit price must be non-negative'),
        discount_cents: z.number().int().nonnegative().default(0),
      })).min(1, 'At least one item is required'),
    }),
  }),

  // Authentication
  login: validateRequest({
    body: z.object({
      username: z.string().min(3, 'Username must be at least 3 characters').max(50),
      password: z.string().min(6, 'Password must be at least 6 characters').max(100),
    }),
  }),

  // Inventory
  updateStock: validateRequest({
    params: CommonSchemas.idParam,
    body: z.object({
      quantity: z.number().int('Quantity must be an integer'),
      type: z.enum(['in', 'out', 'adjustment'], { message: 'Invalid movement type' }),
      reason: z.string().optional(),
    }),
  }),

  // Common patterns
  getById: validateRequest({
    params: CommonSchemas.idParam,
  }),

  list: validateRequest({
    query: CommonSchemas.paginationQuery.merge(CommonSchemas.searchQuery),
  }),

  bulkOperation: validateRequest({
    body: CommonSchemas.bulkIds,
  }),
};

// Type-safe request data getters
export const getValidatedData = {
  body: (c: any) => c.get('validatedBody'),
  query: (c: any) => c.get('validatedQuery'),
  params: (c: any) => c.get('validatedParams'),
};

// Custom validators
export const customValidators = {
  // SKU format validator
  sku: z.string().refine(
    (val) => /^[A-Z0-9-]+$/.test(val),
    { message: 'SKU must contain only uppercase letters, numbers, and hyphens' }
  ),

  // Phone number validator
  phone: z.string().refine(
    (val) => /^[0-9+\-\s()]+$/.test(val),
    { message: 'Invalid phone number format' }
  ),

  // Currency amount (in cents)
  currencyAmount: z.number()
    .int('Amount must be an integer')
    .nonnegative('Amount must be non-negative')
    .max(999999999, 'Amount too large'),

  // Date string validator
  dateString: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'Invalid date format' }
  ),

  // ID format validator
  id: z.string().min(1, 'ID cannot be empty').max(100, 'ID too long'),

  // Percentage validator
  percentage: z.number()
    .min(0, 'Percentage cannot be negative')
    .max(100, 'Percentage cannot exceed 100'),
};

export default validateRequest;