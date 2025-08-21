import { EmployeeFormData } from '../services/employeeApi';

// Vietnamese-specific validation patterns
export const VALIDATION_PATTERNS = {
  // Vietnamese phone numbers: 0 + (3-9) + 8 digits or +84 + (3-9) + 8 digits
  PHONE: /^(0|\+84)[3-9]\d{8}$/,
  
  // Email pattern
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Vietnamese name pattern (allows Vietnamese characters)
  NAME: /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/,
  
  // Employee code pattern
  EMPLOYEE_CODE: /^EMP\d{6}$/
};

// Validation error messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'Trường này là bắt buộc',
  INVALID_EMAIL: 'Email không hợp lệ',
  INVALID_PHONE: 'Số điện thoại không hợp lệ (VD: 0901234567 hoặc +84901234567)',
  INVALID_NAME: 'Tên chỉ được chứa chữ cái và khoảng trắng',
  NAME_TOO_SHORT: 'Tên phải có ít nhất 2 ký tự',
  NAME_TOO_LONG: 'Tên không được quá 100 ký tự',
  INVALID_COMMISSION: 'Tỷ lệ hoa hồng phải từ 0% đến 100%',
  INVALID_SALARY: 'Lương cơ bản không được âm',
  EMAIL_EXISTS: 'Email này đã được sử dụng',
  PHONE_EXISTS: 'Số điện thoại này đã được sử dụng'
};

// Business rules
export const BUSINESS_RULES = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MIN_COMMISSION_RATE: 0,
  MAX_COMMISSION_RATE: 100,
  MIN_BASE_SALARY: 0,
  MAX_BASE_SALARY: 1000000000, // 1 billion VND
  MAX_NOTES_LENGTH: 1000
};

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

// Field validation functions
export const validateFullName = (name: string): string | null => {
  if (!name || !name.trim()) {
    return VALIDATION_MESSAGES.REQUIRED;
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < BUSINESS_RULES.MIN_NAME_LENGTH) {
    return VALIDATION_MESSAGES.NAME_TOO_SHORT;
  }
  
  if (trimmedName.length > BUSINESS_RULES.MAX_NAME_LENGTH) {
    return VALIDATION_MESSAGES.NAME_TOO_LONG;
  }
  
  if (!VALIDATION_PATTERNS.NAME.test(trimmedName)) {
    return VALIDATION_MESSAGES.INVALID_NAME;
  }
  
  return null;
};

export const validateEmail = (email: string): string | null => {
  if (!email || !email.trim()) {
    return null; // Email is optional
  }
  
  const trimmedEmail = email.trim().toLowerCase();
  
  if (!VALIDATION_PATTERNS.EMAIL.test(trimmedEmail)) {
    return VALIDATION_MESSAGES.INVALID_EMAIL;
  }
  
  return null;
};

export const validatePhone = (phone: string): string | null => {
  if (!phone || !phone.trim()) {
    return null; // Phone is optional
  }
  
  // Clean phone number (remove spaces, dashes)
  const cleanPhone = phone.replace(/[\s\-]/g, '');
  
  if (!VALIDATION_PATTERNS.PHONE.test(cleanPhone)) {
    return VALIDATION_MESSAGES.INVALID_PHONE;
  }
  
  return null;
};

export const validateCommissionRate = (rate: number): string | null => {
  if (rate < BUSINESS_RULES.MIN_COMMISSION_RATE || rate > BUSINESS_RULES.MAX_COMMISSION_RATE) {
    return VALIDATION_MESSAGES.INVALID_COMMISSION;
  }
  
  return null;
};

export const validateBaseSalary = (salary: number): string | null => {
  if (salary < BUSINESS_RULES.MIN_BASE_SALARY) {
    return VALIDATION_MESSAGES.INVALID_SALARY;
  }
  
  if (salary > BUSINESS_RULES.MAX_BASE_SALARY) {
    return `Lương cơ bản không được vượt quá ${BUSINESS_RULES.MAX_BASE_SALARY.toLocaleString('vi-VN')} VND`;
  }
  
  return null;
};

export const validateNotes = (notes: string): string | null => {
  if (notes && notes.length > BUSINESS_RULES.MAX_NOTES_LENGTH) {
    return `Ghi chú không được quá ${BUSINESS_RULES.MAX_NOTES_LENGTH} ký tự`;
  }
  
  return null;
};

// Comprehensive form validation
export const validateEmployeeForm = (data: Partial<EmployeeFormData>): ValidationResult => {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};
  
  // Validate full name
  const nameError = validateFullName(data.full_name || '');
  if (nameError) errors.full_name = nameError;
  
  // Validate email
  const emailError = validateEmail(data.email || '');
  if (emailError) errors.email = emailError;
  
  // Validate phone
  const phoneError = validatePhone(data.phone || '');
  if (phoneError) errors.phone = phoneError;
  
  // Validate commission rate
  if (data.commission_rate !== undefined) {
    const commissionError = validateCommissionRate(data.commission_rate);
    if (commissionError) errors.commission_rate = commissionError;
    
    // Warning for high commission rates
    if (data.commission_rate > 50) {
      warnings.commission_rate = 'Tỷ lệ hoa hồng cao có thể ảnh hưởng đến lợi nhuận';
    }
  }
  
  // Validate base salary
  if (data.base_salary !== undefined) {
    const salaryError = validateBaseSalary(data.base_salary);
    if (salaryError) errors.base_salary = salaryError;
    
    // Warning for very low salaries
    if (data.base_salary > 0 && data.base_salary < 3000000) { // Less than 3M VND
      warnings.base_salary = 'Lương cơ bản thấp có thể không đáp ứng mức sống tối thiểu';
    }
  }
  
  // Validate notes
  const notesError = validateNotes(data.notes || '');
  if (notesError) errors.notes = notesError;
  
  // Role validation
  if (!data.role) {
    errors.role = 'Vai trò là bắt buộc';
  } else if (!['admin', 'cashier', 'sales_agent', 'affiliate'].includes(data.role)) {
    errors.role = 'Vai trò không hợp lệ';
  }
  
  // Status validation
  if (data.status && !['active', 'inactive'].includes(data.status)) {
    errors.status = 'Trạng thái không hợp lệ';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings
  };
};

// Data sanitization functions
export const sanitizeEmployeeData = (data: Partial<EmployeeFormData>): Partial<EmployeeFormData> => {
  const sanitized: Partial<EmployeeFormData> = {};
  
  // Sanitize full name
  if (data.full_name) {
    sanitized.full_name = data.full_name.trim().replace(/\s+/g, ' ');
  }
  
  // Sanitize email
  if (data.email) {
    sanitized.email = data.email.trim().toLowerCase();
  }
  
  // Sanitize phone
  if (data.phone) {
    let phone = data.phone.replace(/[\s\-]/g, '');
    // Convert +84 to 0
    if (phone.startsWith('+84')) {
      phone = '0' + phone.substring(3);
    }
    sanitized.phone = phone;
  }
  
  // Sanitize numeric values
  if (data.commission_rate !== undefined) {
    sanitized.commission_rate = Math.round(data.commission_rate * 100) / 100; // Round to 2 decimal places
  }
  
  if (data.base_salary !== undefined) {
    sanitized.base_salary = Math.round(data.base_salary);
  }
  
  // Sanitize notes
  if (data.notes) {
    sanitized.notes = data.notes.trim();
  }
  
  // Copy other fields as-is
  if (data.role) sanitized.role = data.role;
  if (data.status) sanitized.status = data.status;
  
  return sanitized;
};

// Real-time validation for form fields
export const createFieldValidator = (fieldName: keyof EmployeeFormData) => {
  return (value: any): string | null => {
    switch (fieldName) {
      case 'full_name':
        return validateFullName(value);
      case 'email':
        return validateEmail(value);
      case 'phone':
        return validatePhone(value);
      case 'commission_rate':
        return validateCommissionRate(value);
      case 'base_salary':
        return validateBaseSalary(value);
      case 'notes':
        return validateNotes(value);
      default:
        return null;
    }
  };
};

// Format helpers for display
export const formatPhoneForDisplay = (phone: string): string => {
  if (!phone) return '';
  
  // Format Vietnamese phone numbers: 0901 234 567
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  
  return phone;
};

export const formatSalaryForDisplay = (salary: number): string => {
  if (salary === 0) return '0 ₫';
  return `${salary.toLocaleString('vi-VN')} ₫`;
};

export const formatCommissionForDisplay = (rate: number): string => {
  return `${rate.toFixed(1)}%`;
};
