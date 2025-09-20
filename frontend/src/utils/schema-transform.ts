// Schema Transformation Utilities - Frontend to API
// Handles conversion between frontend types and DB schema

import { formatVND, parseVND } from './currency';

/**
 * Transform product data from frontend form to API format
 */
export function transformProductToAPI(formData: any) {
  return {
    name: formData.name,
    sku: formData.sku,
    barcode: formData.barcode,
    description: formData.description,
    price_cents: formData.price ? Math.round(formData.price * 100) : 0,
    cost_price_cents: formData.cost_price ? Math.round(formData.cost_price * 100) : 0,
    stock: formData.stock || 0,
    min_stock: formData.min_stock || 0,
    max_stock: formData.max_stock || 100,
    unit: formData.unit || 'piece',
    weight_grams: formData.weight,
    dimensions: formData.dimensions,
    category_id: formData.category_id,
    brand_id: formData.brand_id,
    supplier_id: formData.supplier_id,
    store_id: formData.store_id || 'store-1',
    image_url: formData.image_url,
    images: formData.images ? JSON.stringify(formData.images) : null,
    is_serialized: formData.track_inventory ? 1 : 0
  };
}

/**
 * Transform product data from API to frontend display format
 */
export function transformProductFromAPI(apiData: any) {
  return {
    ...apiData,
    price: apiData.price_cents ? apiData.price_cents / 100 : 0,
    cost_price: apiData.cost_price_cents ? apiData.cost_price_cents / 100 : 0,
    weight: apiData.weight_grams,
    track_inventory: !!apiData.is_serialized,
    images: apiData.images ? JSON.parse(apiData.images) : []
  };
}

/**
 * Transform customer data from frontend form to API format
 */
export function transformCustomerToAPI(formData: any) {
  return {
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    address: formData.address,
    date_of_birth: formData.date_of_birth,
    gender: formData.gender,
    customer_type: formData.customer_type || 'regular'
  };
}

/**
 * Transform customer data from API to frontend display format
 */
export function transformCustomerFromAPI(apiData: any) {
  return {
    ...apiData,
    total_spent: apiData.total_spent_cents ? apiData.total_spent_cents / 100 : 0
  };
}

/**
 * Transform sale/order data from frontend to API format
 */
export function transformSaleToAPI(formData: any) {
  return {
    customer_id: formData.customer_id,
    user_id: formData.user_id || formData.cashier_id,
    store_id: formData.store_id || 'store-1',
    status: formData.status || 'pending',
    subtotal_cents: formData.subtotal_cents || (formData.subtotal ? Math.round(formData.subtotal * 100) : 0),
    discount_cents: formData.discount_cents || (formData.discount_amount ? Math.round(formData.discount_amount * 100) : 0),
    tax_cents: formData.tax_cents || (formData.tax_amount ? Math.round(formData.tax_amount * 100) : 0),
    total_cents: formData.total_cents || (formData.total_amount ? Math.round(formData.total_amount * 100) : 0),
    notes: formData.notes,
    customer_name: formData.customer_name,
    customer_phone: formData.customer_phone
  };
}

/**
 * Transform sale/order data from API to frontend display format
 */
export function transformSaleFromAPI(apiData: any) {
  return {
    ...apiData,
    subtotal: apiData.subtotal_cents ? apiData.subtotal_cents / 100 : 0,
    discount_amount: apiData.discount_cents ? apiData.discount_cents / 100 : 0,
    tax_amount: apiData.tax_cents ? apiData.tax_cents / 100 : 0,
    total_amount: apiData.total_cents ? apiData.total_cents / 100 : 0,
    cashier_id: apiData.user_id,
    receipt_number: apiData.order_number
  };
}

/**
 * Transform cart item from frontend to API format
 */
export function transformCartItemToAPI(item: any) {
  return {
    product_id: item.product_id,
    variant_id: item.variant_id,
    quantity: item.quantity,
    unit_price_cents: item.unit_price_cents || (item.unit_price ? Math.round(item.unit_price * 100) : 0),
    total_price_cents: item.total_price_cents || (item.total_amount ? Math.round(item.total_amount * 100) : 0),
    discount_cents: item.discount_cents || (item.discount_amount ? Math.round(item.discount_amount * 100) : 0),
    product_name: item.product_name || item.name,
    product_sku: item.product_sku || item.sku
  };
}

/**
 * Transform cart item from API to frontend display format
 */
export function transformCartItemFromAPI(apiData: any) {
  return {
    ...apiData,
    unit_price: apiData.unit_price_cents ? apiData.unit_price_cents / 100 : 0,
    total_amount: apiData.total_price_cents ? apiData.total_price_cents / 100 : 0,
    discount_amount: apiData.discount_cents ? apiData.discount_cents / 100 : 0,
    name: apiData.product_name,
    sku: apiData.product_sku
  };
}

/**
 * Transform payment data from frontend to API format
 */
export function transformPaymentToAPI(formData: any) {
  return {
    order_id: formData.order_id || formData.sale_id,
    payment_method_id: formData.payment_method_id || formData.method_id,
    amount_cents: formData.amount_cents || (formData.amount ? Math.round(formData.amount * 100) : 0),
    reference: formData.reference,
    status: formData.status || 'pending'
  };
}

/**
 * Transform payment data from API to frontend display format
 */
export function transformPaymentFromAPI(apiData: any) {
  return {
    ...apiData,
    amount: apiData.amount_cents ? apiData.amount_cents / 100 : 0,
    sale_id: apiData.order_id,
    method_id: apiData.payment_method_id
  };
}

/**
 * Generic function to convert any cents field to VND for display
 */
export function convertCentsFields(obj: any, centsFields: string[]) {
  const result = { ...obj };

  centsFields.forEach(field => {
    const centsField = `${field}_cents`;
    if (result[centsField] !== undefined) {
      result[field] = result[centsField] / 100;
    }
  });

  return result;
}

/**
 * Generic function to convert VND fields to cents for API
 */
export function convertVNDFields(obj: any, vndFields: string[]) {
  const result = { ...obj };

  vndFields.forEach(field => {
    if (result[field] !== undefined) {
      result[`${field}_cents`] = Math.round(result[field] * 100);
      delete result[field]; // Remove the VND field
    }
  });

  return result;
}

/**
 * Format display values for UI components
 */
export function formatDisplayValue(value: any, type: 'currency' | 'text' | 'number' | 'date') {
  if (value === null || value === undefined) return '';

  switch (type) {
    case 'currency':
      return formatVND(typeof value === 'number' ? value : parseFloat(value));
    case 'number':
      return value.toLocaleString('vi-VN');
    case 'date':
      return new Date(value).toLocaleDateString('vi-VN');
    default:
      return String(value);
  }
}

/**
 * Common field mappings between frontend and API
 */
export const FIELD_MAPPINGS = {
  // Product fields
  price: 'price_cents',
  cost_price: 'cost_price_cents',
  weight: 'weight_grams',

  // Customer fields
  total_spent: 'total_spent_cents',

  // Order/Sale fields
  subtotal: 'subtotal_cents',
  discount_amount: 'discount_cents',
  tax_amount: 'tax_cents',
  total_amount: 'total_cents',
  receipt_number: 'order_number',
  cashier_id: 'user_id',

  // Order item fields
  unit_price: 'unit_price_cents',
  total_price: 'total_price_cents',

  // Payment fields
  amount: 'amount_cents',
  sale_id: 'order_id',
  method_id: 'payment_method_id'
} as const;