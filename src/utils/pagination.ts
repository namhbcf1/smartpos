/**
 * PAGINATION UTILITIES
 * 
 * Provides consistent pagination across all API endpoints
 * to improve performance and user experience.
 * 
 * FEATURES:
 * - Consistent pagination parameters
 * - Performance optimized queries
 * - Metadata for frontend pagination
 * - Input validation and sanitization
 */

import { Context } from 'hono';
import { Env } from '../types';

// Pagination constants
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1
};

// Simple pagination response formatter
export function formatPaginationResponse(page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}

// Pagination parameters interface
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Pagination result interface
export interface PaginationResult<T> {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextPage: number | null;
    prevPage: number | null;
  };
}

/**
 * Extract and validate pagination parameters from request
 */
export function getPaginationParams(c: Context): PaginationParams {
  const query = c.req.query();
  // Parse and validate page
  let page = parseInt(query.page || '1');
  if (isNaN(page) || page < 1) {
    page = PAGINATION_DEFAULTS.PAGE;
  }
  
  // Parse and validate limit
  let limit = parseInt(query.limit || PAGINATION_DEFAULTS.LIMIT.toString());
  if (isNaN(limit) || limit < PAGINATION_DEFAULTS.MIN_LIMIT) {
    limit = PAGINATION_DEFAULTS.LIMIT;
  }
  if (limit > PAGINATION_DEFAULTS.MAX_LIMIT) {
    limit = PAGINATION_DEFAULTS.MAX_LIMIT;
  }
  
  // Calculate offset
  const offset = (page - 1) * limit;
  
  // Parse search
  const search = query.search?.trim() || undefined;
  
  // Parse sorting
  const sortBy = query.sortBy?.trim() || undefined;
  const sortOrder = (query.sortOrder?.toLowerCase() === 'desc') ? 'desc' : 'asc';
  
  return {
    page,
    limit,
    offset,
    search,
    sortBy,
    sortOrder
  };
}

/**
 * Build pagination metadata
 */
export function buildPaginationResult<T>(
  data: any[],
  total: number,
  params: PaginationParams
): PaginationResult<T> {
  const totalPages = Math.ceil(total / params.limit);
  const hasNext = params.page < totalPages;
  const hasPrev = params.page > 1;
  
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
      nextPage: hasNext ? params.page + 1 : null,
      prevPage: hasPrev ? params.page - 1 : null
    }
  };
}

/**
 * Build SQL LIMIT and OFFSET clause
 */
export function buildLimitClause(params: PaginationParams): string {
  return `LIMIT ${params.limit} OFFSET ${params.offset}`;
}

/**
 * Build SQL ORDER BY clause with validation
 */
export function buildOrderClause(
  params: PaginationParams,
  allowedSortFields: string[],
  defaultSort: string = 'created_at'
): string {
  let sortField = defaultSort;
  
  if (params.sortBy && allowedSortFields.includes(params.sortBy)) {
    sortField = params.sortBy;
  }
  
  return `ORDER BY ${sortField} ${(params.sortOrder || 'ASC').toUpperCase()}`;
}

/**
 * Build SQL WHERE clause for search
 */
export function buildSearchClause(
  params: PaginationParams,
  searchFields: string[]
): { clause: string; bindings: string[] } {
  if (!params.search || searchFields.length === 0) {
    return { clause: '', bindings: [] };
  }
  
  const searchTerm = `%${params.search}%`;
  const conditions = searchFields.map(field => `${field} LIKE ?`);
  const clause = `AND (${conditions.join(' OR ')})`;
  const bindings = new Array(searchFields.length).fill(searchTerm);
  
  return { clause, bindings };
}

/**
 * Generic paginated query executor
 */
export async function executePaginatedQuery(
  env: Env,
  baseQuery: string,
  countQuery: string,
  params: PaginationParams,
  bindings: any[] = []
): Promise<PaginationResult<any>> {
  try {
    // Execute count query
    const countResult = await env.DB.prepare(countQuery).bind(...bindings).first<{ count: number }>();
    const total = countResult?.count || 0;
    
    // Execute data query with pagination
    const dataQuery = `${baseQuery} ${buildLimitClause(params)}`;
    const dataResult = await env.DB.prepare(dataQuery).bind(...bindings).all();
    return buildPaginationResult(
      dataResult.results as unknown as any[],
      total,
      params
    );
  } catch (error) {
    console.error('Paginated query error:', error);
    throw error;
  }
}

/**
 * Products pagination helper
 */
export async function paginateProducts(
  env: Env,
  params: PaginationParams,
  filters: {
    category_id?: number;
    supplierId?: number;
    status?: string;
    is_active?: boolean;
  } = { /* No operation */ }
): Promise<PaginationResult<any>> {
  const allowedSortFields = ['name', 'price', 'stock', 'created_at', 'updated_at'];
  
  // Build WHERE conditions
  const conditions = ['1=1'];
  const bindings: any[] = [];
  
  if ((filters as any).categoryId) {
    conditions.push('category_id = ?');
    bindings.push((filters as any).categoryId);
  } else if (filters.category_id) {
    conditions.push('category_id = ?');
    bindings.push(filters.category_id);
  }
  
  if (filters.supplierId) {
    conditions.push('supplier_id = ?');
    bindings.push(filters.supplierId);
  }
  
  if (filters.status) {
    conditions.push('status = ?');
    bindings.push(filters.status);
  }
  
  if ((filters as any).isActive !== undefined) {
    conditions.push('is_active = ?');
    bindings.push((filters as any).isActive ? 1 : 0);
  } else if (filters.is_active !== undefined) {
    conditions.push('is_active = ?');
    bindings.push(filters.is_active ? 1 : 0);
  }
  
  // Add search conditions
  const searchClause = buildSearchClause(params, ['name', 'description', 'sku', 'barcode']);
  if (searchClause.clause) {
    conditions.push(searchClause.clause.replace('AND ', ''));
    bindings.push(...searchClause.bindings);
  }
  
  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const orderClause = buildOrderClause(params, allowedSortFields);
  
  const baseQuery = `
    SELECT 
      p.*,
      c.name as category_name,
      s.name as supplier_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    ${whereClause}
    ${orderClause}
  `;
  
  const countQuery = `
    SELECT COUNT(*) as count
    FROM products p
    ${whereClause}
  `;
  
  return executePaginatedQuery(env, baseQuery, countQuery, params, bindings);
}

/**
 * Sales pagination helper
 */
export async function paginateSales(
  env: Env,
  params: PaginationParams,
  filters: {
    customerId?: number;
    userId?: number;
    storeId?: number;
    status?: string;
    paymentMethod?: string;
    dateFrom?: string;
    dateTo?: string;
  } = { /* No operation */ }
): Promise<PaginationResult<any>> {
  const allowedSortFields = ['sale_number', 'total_amount', 'created_at', 'updated_at'];
  
  // Build WHERE conditions
  const conditions = ['1=1'];
  const bindings: any[] = [];
  
  if (filters.customerId) {
    conditions.push('s.customer_id = ?');
    bindings.push(filters.customerId);
  }
  
  if (filters.userId) {
    conditions.push('s.user_id = ?');
    bindings.push(filters.userId);
  }
  
  if (filters.storeId) {
    conditions.push('s.store_id = ?');
    bindings.push(filters.storeId);
  }
  
  if (filters.status) {
    conditions.push('s.status = ?');
    bindings.push(filters.status);
  }
  
  if (filters.paymentMethod) {
    conditions.push('s.payment_method = ?');
    bindings.push(filters.paymentMethod);
  }
  
  if (filters.dateFrom) {
    conditions.push('s.created_at >= ?');
    bindings.push(filters.dateFrom);
  }
  
  if (filters.dateTo) {
    conditions.push('s.created_at <= ?');
    bindings.push(filters.dateTo);
  }
  
  // Add search conditions
  const searchClause = buildSearchClause(params, ['s.sale_number', 'c.name', 'u.full_name']);
  if (searchClause.clause) {
    conditions.push(searchClause.clause.replace('AND ', ''));
    bindings.push(...searchClause.bindings);
  }
  
  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const orderClause = buildOrderClause(params, allowedSortFields, 's.created_at');
  
  const baseQuery = `
    SELECT 
      s.*,
      c.name as customer_name,
      u.full_name as user_name,
      st.name as store_name
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN stores st ON s.store_id = st.id
    ${whereClause}
    ${orderClause}
  `;
  
  const countQuery = `
    SELECT COUNT(*) as count
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN stores st ON s.store_id = st.id
    ${whereClause}
  `;
  
  return executePaginatedQuery(env, baseQuery, countQuery, params, bindings);
}

/**
 * Customers pagination helper
 */
export async function paginateCustomers(
  env: Env,
  params: PaginationParams,
  filters: {
    customerType?: string;
    isActive?: boolean;
  } = { /* No operation */ }
): Promise<PaginationResult<any>> {
  const allowedSortFields = ['name', 'email', 'total_spent', 'loyalty_points', 'created_at'];
  
  // Build WHERE conditions
  const conditions = ['1=1'];
  const bindings: any[] = [];
  
  if (filters.customerType) {
    conditions.push('customer_type = ?');
    bindings.push(filters.customerType);
  }
  
  if (filters.isActive !== undefined) {
    conditions.push('is_active = ?');
    bindings.push(filters.isActive ? 1 : 0);
  }
  
  // Add search conditions
  const searchClause = buildSearchClause(params, ['name', 'email', 'phone', 'address']);
  if (searchClause.clause) {
    conditions.push(searchClause.clause.replace('AND ', ''));
    bindings.push(...searchClause.bindings);
  }
  
  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const orderClause = buildOrderClause(params, allowedSortFields);
  
  const baseQuery = `
    SELECT *
    FROM customers
    ${whereClause}
    ${orderClause}
  `;
  
  const countQuery = `
    SELECT COUNT(*) as count
    FROM customers
    ${whereClause}
  `;
  
  return executePaginatedQuery(env, baseQuery, countQuery, params, bindings);
}
