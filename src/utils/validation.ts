/**
 * Validation Utilities for SmartPOS System
 * Consistent validation logic across all modules
 */

import type { ApiError } from '../types/api-standard';
import { createValidationError, ERROR_CODES } from './api-response';

// =============================================================================
// VALIDATION RESULT TYPE
// =============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: ApiError[];
}

export function createValidationResult(errors: ApiError[] = []): ValidationResult {
  return {
    isValid: errors.length === 0,
    errors
  };
}

// =============================================================================
// BASIC VALIDATORS
// =============================================================================

export function validateRequired(value: any, fieldName: string): ApiError | null {
  if (value === null || value === undefined || value === '') {
    return createValidationError(fieldName, `${fieldName} là bắt buộc`);
  }
  return null;
}

export function validateEmail(email: string, fieldName: string = 'email'): ApiError | null {
  if (!email) return null; // Optional field
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return createValidationError(fieldName, 'Email không đúng định dạng');
  }
  return null;
}

export function validatePhone(phone: string, fieldName: string = 'phone'): ApiError | null {
  if (!phone) return null; // Optional field
  
  // Vietnamese phone number regex
  const phoneRegex = /^(0|\+84)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-6|8|9]|9[0-9])[0-9]{7}$/;
  if (!phoneRegex.test(phone)) {
    return createValidationError(fieldName, 'Số điện thoại không đúng định dạng');
  }
  return null;
}

export function validateLength(
  value: string, 
  min: number, 
  max: number, 
  fieldName: string
): ApiError | null {
  if (!value) return null; // Optional field
  
  if (value.length < min) {
    return createValidationError(fieldName, `${fieldName} phải có ít nhất ${min} ký tự`);
  }
  if (value.length > max) {
    return createValidationError(fieldName, `${fieldName} không được vượt quá ${max} ký tự`);
  }
  return null;
}

export function validateNumericRange(
  value: number, 
  min: number, 
  max: number, 
  fieldName: string
): ApiError | null {
  if (value === null || value === undefined) return null; // Optional field
  
  if (value < min) {
    return createValidationError(fieldName, `${fieldName} phải lớn hơn hoặc bằng ${min}`);
  }
  if (value > max) {
    return createValidationError(fieldName, `${fieldName} phải nhỏ hơn hoặc bằng ${max}`);
  }
  return null;
}

export function validatePositiveNumber(value: number, fieldName: string): ApiError | null {
  if (value === null || value === undefined) return null; // Optional field
  
  if (value < 0) {
    return createValidationError(fieldName, `${fieldName} phải là số dương`);
  }
  return null;
}

export function validateDate(dateString: string, fieldName: string): ApiError | null {
  if (!dateString) return null; // Optional field
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return createValidationError(fieldName, `${fieldName} không đúng định dạng ngày`);
  }
  return null;
}

export function validateEnum<T extends string>(
  value: string, 
  allowedValues: any[], 
  fieldName: string
): ApiError | null {
  if (!value) return null; // Optional field
  
  if (!allowedValues.includes(value as T)) {
    return createValidationError(
      fieldName, 
      `${fieldName} phải là một trong các giá trị: ${allowedValues.join(', ')}`
    );
  }
  return null;
}

// =============================================================================
// BUSINESS ENTITY VALIDATORS
// =============================================================================

// User Validation
export function validateUserData(data: any): ValidationResult {
  const errors: ApiError[] = [];

  // Required fields
  const requiredError = validateRequired(data.full_name, 'full_name');
  if (requiredError) errors.push(requiredError);

  const emailRequiredError = validateRequired(data.email, 'email');
  if (emailRequiredError) errors.push(emailRequiredError);

  // Email format
  const emailError = validateEmail(data.email, 'email');
  if (emailError) errors.push(emailError);

  // Phone format (if provided)
  const phoneError = validatePhone(data.phone, 'phone');
  if (phoneError) errors.push(phoneError);

  // Name length
  const nameError = validateLength(data.full_name, 2, 100, 'full_name');
  if (nameError) errors.push(nameError);

  // Username length (if provided)
  if (data.username) {
    const usernameError = validateLength(data.username, 3, 50, 'username');
    if (usernameError) errors.push(usernameError);
  }

  return createValidationResult(errors);
}

// Product Validation
export function validateProductData(data: any): ValidationResult {
  const errors: ApiError[] = [];

  // Required fields
  const nameError = validateRequired(data.name, 'name');
  if (nameError) errors.push(nameError);

  const skuError = validateRequired(data.sku, 'sku');
  if (skuError) errors.push(skuError);

  const priceError = validateRequired(data.selling_price, 'selling_price');
  if (priceError) errors.push(priceError);

  // Price validation
  const sellingPriceError = validatePositiveNumber(data.selling_price, 'selling_price');
  if (sellingPriceError) errors.push(sellingPriceError);

  const costPriceError = validatePositiveNumber(data.cost_price, 'cost_price');
  if (costPriceError) errors.push(costPriceError);

  // SKU format (alphanumeric, max 20 chars)
  if (data.sku && !/^[A-Za-z0-9-_]+$/.test(data.sku)) {
    errors.push(createValidationError('sku', 'SKU chỉ được chứa chữ cái, số, dấu gạch ngang và gạch dưới'));
  }

  const skuLengthError = validateLength(data.sku, 2, 20, 'sku');
  if (skuLengthError) errors.push(skuLengthError);

  // Name length
  const nameLengthError = validateLength(data.name, 2, 200, 'name');
  if (nameLengthError) errors.push(nameLengthError);

  // Warranty type validation
  if (data.warranty_type) {
    const warrantyTypeError = validateEnum(
      data.warranty_type, 
      ['none', 'store', 'manufacturer'], 
      'warranty_type'
    );
    if (warrantyTypeError) errors.push(warrantyTypeError);
  }

  // Unit type validation
  if (data.unit_type) {
    const unitTypeError = validateEnum(
      data.unit_type, 
      ['piece', 'kg', 'liter', 'meter', 'box', 'pack'], 
      'unit_type'
    );
    if (unitTypeError) errors.push(unitTypeError);
  }

  return createValidationResult(errors);
}

// Customer Validation
export function validateCustomerData(data: any): ValidationResult {
  const errors: ApiError[] = [];

  // Required fields
  const nameError = validateRequired(data.full_name, 'full_name');
  if (nameError) errors.push(nameError);

  // Name length
  const nameLengthError = validateLength(data.full_name, 2, 100, 'full_name');
  if (nameLengthError) errors.push(nameLengthError);

  // Email format (if provided)
  const emailError = validateEmail(data.email, 'email');
  if (emailError) errors.push(emailError);

  // Phone format (if provided)
  const phoneError = validatePhone(data.phone, 'phone');
  if (phoneError) errors.push(phoneError);

  // Customer type validation
  if (data.customer_type) {
    const typeError = validateEnum(
      data.customer_type, 
      ['individual', 'business'], 
      'customer_type'
    );
    if (typeError) errors.push(typeError);
  }

  // Gender validation
  if (data.gender) {
    const genderError = validateEnum(
      data.gender, 
      ['male', 'female', 'other'], 
      'gender'
    );
    if (genderError) errors.push(genderError);
  }

  // Loyalty tier validation
  if (data.loyalty_tier) {
    const tierError = validateEnum(
      data.loyalty_tier, 
      ['bronze', 'silver', 'gold', 'platinum'], 
      'loyalty_tier'
    );
    if (tierError) errors.push(tierError);
  }

  // Date of birth validation
  if (data.date_of_birth) {
    const dobError = validateDate(data.date_of_birth, 'date_of_birth');
    if (dobError) errors.push(dobError);

    // Age validation (must be at least 16)
    const birthDate = new Date(data.date_of_birth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 16) {
      errors.push(createValidationError('date_of_birth', 'Khách hàng phải từ 16 tuổi trở lên'));
    }
  }

  return createValidationResult(errors);
}

// Invoice Validation
export function validateInvoiceData(data: any): ValidationResult {
  const errors: ApiError[] = [];

  // Required fields
  const outletError = validateRequired(data.outlet_id, 'outlet_id');
  if (outletError) errors.push(outletError);

  const cashierError = validateRequired(data.cashier_id, 'cashier_id');
  if (cashierError) errors.push(cashierError);

  const itemsError = validateRequired(data.items, 'items');
  if (itemsError) errors.push(itemsError);

  // Items validation
  if (Array.isArray(data.items)) {
    if (data.items.length === 0) {
      errors.push(createValidationError('items', 'Hóa đơn phải có ít nhất 1 sản phẩm'));
    }

    data.items.forEach((item: any, index: number) => {
      const productError = validateRequired(item.product_id, `items[${index}].product_id`);
      if (productError) errors.push(productError);

      const quantityError = validateRequired(item.quantity, `items[${index}].quantity`);
      if (quantityError) errors.push(quantityError);

      const priceError = validateRequired(item.unit_price, `items[${index}].unit_price`);
      if (priceError) errors.push(priceError);

      // Positive numbers
      if (item.quantity && item.quantity <= 0) {
        errors.push(createValidationError(`items[${index}].quantity`, 'Số lượng phải lớn hơn 0'));
      }

      if (item.unit_price && item.unit_price <= 0) {
        errors.push(createValidationError(`items[${index}].unit_price`, 'Giá phải lớn hơn 0'));
      }
    });
  }

  // Status validation
  if (data.status) {
    const statusError = validateEnum(
      data.status,
      ['draft', 'pending', 'completed', 'cancelled', 'refunded'],
      'status'
    );
    if (statusError) errors.push(statusError);
  }

  // Payment status validation
  if (data.payment_status) {
    const paymentStatusError = validateEnum(
      data.payment_status,
      ['unpaid', 'partially_paid', 'paid', 'overpaid'],
      'payment_status'
    );
    if (paymentStatusError) errors.push(paymentStatusError);
  }

  return createValidationResult(errors);
}

// Supplier Validation
export function validateSupplierData(data: any): ValidationResult {
  const errors: ApiError[] = [];

  // Required fields
  const nameError = validateRequired(data.name, 'name');
  if (nameError) errors.push(nameError);

  const codeError = validateRequired(data.code, 'code');
  if (codeError) errors.push(codeError);

  // Name length
  const nameLengthError = validateLength(data.name, 2, 100, 'name');
  if (nameLengthError) errors.push(nameLengthError);

  // Code format
  const codeLengthError = validateLength(data.code, 2, 20, 'code');
  if (codeLengthError) errors.push(codeLengthError);

  // Email format (if provided)
  const emailError = validateEmail(data.email, 'email');
  if (emailError) errors.push(emailError);

  // Phone format (if provided)
  const phoneError = validatePhone(data.phone, 'phone');
  if (phoneError) errors.push(phoneError);

  // Payment terms validation
  if (data.payment_terms_days !== undefined) {
    const paymentTermsError = validateNumericRange(data.payment_terms_days, 0, 365, 'payment_terms_days');
    if (paymentTermsError) errors.push(paymentTermsError);
  }

  // Lead time validation
  if (data.lead_time_days !== undefined) {
    const leadTimeError = validateNumericRange(data.lead_time_days, 1, 90, 'lead_time_days');
    if (leadTimeError) errors.push(leadTimeError);
  }

  // Rating validation
  if (data.rating !== undefined) {
    const ratingError = validateNumericRange(data.rating, 1, 5, 'rating');
    if (ratingError) errors.push(ratingError);
  }

  return createValidationResult(errors);
}

// Warranty Claim Validation
export function validateWarrantyClaimData(data: any): ValidationResult {
  const errors: ApiError[] = [];

  // Required fields
  const warrantyIdError = validateRequired(data.warranty_record_id, 'warranty_record_id');
  if (warrantyIdError) errors.push(warrantyIdError);

  const customerIdError = validateRequired(data.customer_id, 'customer_id');
  if (customerIdError) errors.push(customerIdError);

  const claimTypeError = validateRequired(data.claim_type, 'claim_type');
  if (claimTypeError) errors.push(claimTypeError);

  const descriptionError = validateRequired(data.problem_description, 'problem_description');
  if (descriptionError) errors.push(descriptionError);

  // Claim type validation
  if (data.claim_type) {
    const typeError = validateEnum(
      data.claim_type,
      ['repair', 'replace', 'refund'],
      'claim_type'
    );
    if (typeError) errors.push(typeError);
  }

  // Urgency validation
  if (data.urgency) {
    const urgencyError = validateEnum(
      data.urgency,
      ['low', 'normal', 'high', 'critical'],
      'urgency'
    );
    if (urgencyError) errors.push(urgencyError);
  }

  // Description length
  const descLengthError = validateLength(data.problem_description, 10, 1000, 'problem_description');
  if (descLengthError) errors.push(descLengthError);

  // Cost validation
  if (data.estimated_cost !== undefined) {
    const costError = validatePositiveNumber(data.estimated_cost, 'estimated_cost');
    if (costError) errors.push(costError);
  }

  return createValidationResult(errors);
}

// =============================================================================
// PAGINATION & QUERY PARAMETER VALIDATORS
// =============================================================================

export function validatePaginationParams(query: any): ValidationResult {
  const errors: ApiError[] = [];

  if (query.page !== undefined) {
    const page = parseInt(query.page);
    if (isNaN(page) || page < 1) {
      errors.push(createValidationError('page', 'Số trang phải là số nguyên dương'));
    }
  }

  if (query.limit !== undefined) {
    const limit = parseInt(query.limit);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      errors.push(createValidationError('limit', 'Giới hạn phải là số từ 1 đến 100'));
    }
  }

  if (query.sort && typeof query.sort !== 'string') {
    errors.push(createValidationError('sort', 'Tham số sắp xếp phải là chuỗi'));
  }

  if (query.order) {
    const orderError = validateEnum(query.order, ['asc', 'desc'], 'order');
    if (orderError) errors.push(orderError);
  }

  return createValidationResult(errors);
}

export function validateDateRange(query: any): ValidationResult {
  const errors: ApiError[] = [];

  if (query.start_date) {
    const startDateError = validateDate(query.start_date, 'start_date');
    if (startDateError) errors.push(startDateError);
  }

  if (query.end_date) {
    const endDateError = validateDate(query.end_date, 'end_date');
    if (endDateError) errors.push(endDateError);
  }

  // Start date must be before end date
  if (query.start_date && query.end_date) {
    const startDate = new Date(query.start_date);
    const endDate = new Date(query.end_date);
    
    if (startDate > endDate) {
      errors.push(createValidationError('date_range', 'Ngày bắt đầu phải trước ngày kết thúc'));
    }
  }

  return createValidationResult(errors);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function combineValidationResults(...results: ValidationResult[]): ValidationResult {
  const allErrors: ApiError[] = [];
  
  results.forEach(result => {
    allErrors.push(...result.errors);
  });

  return createValidationResult(allErrors);
}

export function validateRequiredFields(data: any, requiredFields: string[]): ValidationResult {
  const errors: ApiError[] = [];

  requiredFields.forEach(field => {
    const error = validateRequired(data[field], field);
    if (error) errors.push(error);
  });

  return createValidationResult(errors);
}