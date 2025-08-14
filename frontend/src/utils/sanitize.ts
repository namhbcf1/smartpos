/**
 * INPUT SANITIZATION AND XSS PROTECTION UTILITIES
 * Provides comprehensive input sanitization for React components
 */

/**
 * HTML entity encoding map
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export const sanitizeHtml = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input.replace(/[&<>"'`=\/]/g, (match) => HTML_ENTITIES[match] || match);
};

/**
 * Sanitize user input for safe display
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove any script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove any iframe tags and their content
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  
  // Remove any object tags and their content
  sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  
  // Remove any embed tags
  sanitized = sanitized.replace(/<embed\b[^<]*>/gi, '');
  
  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove on* event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^>]*/gi, '');
  
  // Encode remaining HTML entities
  return sanitizeHtml(sanitized);
};

/**
 * Sanitize text for safe display in React components
 */
export const sanitizeText = (text: string): string => {
  if (typeof text !== 'string') {
    return '';
  }
  
  // Basic HTML encoding for safe display
  return sanitizeHtml(text.trim());
};

/**
 * Sanitize and validate email addresses
 */
export const sanitizeEmail = (email: string): string => {
  if (typeof email !== 'string') {
    return '';
  }
  
  // Remove any HTML tags and encode entities
  const sanitized = sanitizeInput(email);
  
  // Basic email validation pattern
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  return emailPattern.test(sanitized) ? sanitized : '';
};

/**
 * Sanitize phone numbers
 */
export const sanitizePhone = (phone: string): string => {
  if (typeof phone !== 'string') {
    return '';
  }
  
  // Remove all non-digit characters except + and spaces
  const sanitized = phone.replace(/[^\d+\s-()]/g, '');
  
  return sanitized.trim();
};

/**
 * Sanitize numeric input
 */
export const sanitizeNumber = (input: string | number): number => {
  if (typeof input === 'number') {
    return isNaN(input) || !isFinite(input) ? 0 : input;
  }
  
  if (typeof input !== 'string') {
    return 0;
  }
  
  // Remove any non-numeric characters except decimal point and minus sign
  const sanitized = input.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(sanitized);
  
  return isNaN(parsed) || !isFinite(parsed) ? 0 : parsed;
};

/**
 * Sanitize URL input
 */
export const sanitizeUrl = (url: string): string => {
  if (typeof url !== 'string') {
    return '';
  }
  
  // Remove any HTML tags
  let sanitized = sanitizeInput(url);
  
  // Only allow http, https, and mailto protocols
  const allowedProtocols = /^(https?|mailto):/i;
  
  // If no protocol, assume https
  if (!sanitized.includes('://') && !sanitized.startsWith('mailto:')) {
    sanitized = 'https://' + sanitized;
  }
  
  // Validate protocol
  if (!allowedProtocols.test(sanitized)) {
    return '';
  }
  
  return sanitized;
};

/**
 * Sanitize file names
 */
export const sanitizeFileName = (fileName: string): string => {
  if (typeof fileName !== 'string') {
    return '';
  }
  
  // Remove path traversal attempts and dangerous characters
  let sanitized = fileName.replace(/[<>:"/\\|?*\x00-\x1f]/g, '');
  
  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');
  
  // Limit length
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255);
  }
  
  return sanitized;
};

/**
 * Validate and sanitize form data
 */
export interface FormValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  sanitizer?: (value: string) => string;
}

export interface FormValidationResult {
  isValid: boolean;
  sanitizedValue: string;
  errors: string[];
}

export const validateAndSanitizeField = (
  value: string,
  rules: FormValidationRule
): FormValidationResult => {
  const errors: string[] = [];
  let sanitizedValue = typeof value === 'string' ? value : '';
  
  // Apply custom sanitizer if provided
  if (rules.sanitizer) {
    sanitizedValue = rules.sanitizer(sanitizedValue);
  } else {
    // Default sanitization
    sanitizedValue = sanitizeInput(sanitizedValue);
  }
  
  // Required validation
  if (rules.required && !sanitizedValue.trim()) {
    errors.push('This field is required');
  }
  
  // Length validations
  if (rules.minLength && sanitizedValue.length < rules.minLength) {
    errors.push(`Minimum length is ${rules.minLength} characters`);
  }
  
  if (rules.maxLength && sanitizedValue.length > rules.maxLength) {
    errors.push(`Maximum length is ${rules.maxLength} characters`);
    sanitizedValue = sanitizedValue.substring(0, rules.maxLength);
  }
  
  // Pattern validation
  if (rules.pattern && sanitizedValue && !rules.pattern.test(sanitizedValue)) {
    errors.push('Invalid format');
  }
  
  return {
    isValid: errors.length === 0,
    sanitizedValue,
    errors
  };
};

/**
 * Sanitize object properties recursively
 */
export const sanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * Create a safe React component prop sanitizer
 */
export const createPropSanitizer = (allowedProps: string[]) => {
  return (props: Record<string, any>): Record<string, any> => {
    const sanitized: Record<string, any> = {};
    
    for (const prop of allowedProps) {
      if (props.hasOwnProperty(prop)) {
        sanitized[prop] = sanitizeObject(props[prop]);
      }
    }
    
    return sanitized;
  };
};

/**
 * Safe JSON parsing with sanitization
 */
export const safeJsonParse = (jsonString: string): any => {
  try {
    const parsed = JSON.parse(jsonString);
    return sanitizeObject(parsed);
  } catch (error) {
    console.warn('Failed to parse JSON:', error);
    return null;
  }
};

/**
 * Content Security Policy helpers
 */
export const generateNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Validate content against CSP rules
 */
export const validateContent = (content: string): boolean => {
  // Check for inline scripts
  if (/<script[^>]*>.*?<\/script>/gi.test(content)) {
    return false;
  }
  
  // Check for inline event handlers
  if (/\s*on\w+\s*=/gi.test(content)) {
    return false;
  }
  
  // Check for javascript: URLs
  if (/javascript:/gi.test(content)) {
    return false;
  }
  
  return true;
};
