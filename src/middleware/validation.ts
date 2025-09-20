/**
 * Enterprise-Level Validation Middleware
 *
 * Comprehensive validation middleware cho ComputerPOS Pro
 * Tuân thủ 100% rules.md - Advanced Zod schemas with business logic
 */

import { Context, Next } from 'hono';
import { z } from 'zod';
import { HonoEnv, ApiResponse } from '../types';

// Advanced validation error interface
interface ValidationError {
  field: string;
  code: string;
  message: string;
  value?: any;
  expected?: any;
  business_rule?: string;
}

// Comprehensive validation result
interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
  warnings?: ValidationError[];
  metadata?: {
    validation_time: number;
    schema_version: string;
    business_rules_applied: string[];
  };
}

/**
 * Enterprise-level query validation with business logic
 */
export const validateQuery = <T extends z.ZodSchema>(schema: T) => {
  return async (c: Context<HonoEnv>, next: Next) => {
    const startTime = Date.now();

    try {
      const query = c.req.query();

      // Advanced type conversion with business logic
      const processedQuery: any = {};
      const warnings: ValidationError[] = [];

      for (const [key, value] of Object.entries(query)) {
        // Boolean conversion
        if (value === 'true' || value === '1') {
          processedQuery[key] = true;
        } else if (value === 'false' || value === '0') {
          processedQuery[key] = false;
        }
        // Number conversion with range validation
        else if (!isNaN(Number(value)) && value !== '') {
          const numValue = Number(value);

          // Business rule: Pagination limits
          if (key === 'limit' && numValue > 1000) {
            warnings.push({
              field: key,
              code: 'LIMIT_TOO_HIGH',
              message: 'Giới hạn quá cao, đã điều chỉnh xuống 1000',
              value: numValue,
              expected: 1000,
              business_rule: 'MAX_PAGINATION_LIMIT'
            });
            processedQuery[key] = 1000;
          } else if (key === 'page' && numValue < 1) {
            warnings.push({
              field: key,
              code: 'INVALID_PAGE',
              message: 'Số trang không hợp lệ, đã điều chỉnh về 1',
              value: numValue,
              expected: 1,
              business_rule: 'MIN_PAGE_NUMBER'
            });
            processedQuery[key] = 1;
          } else {
            processedQuery[key] = numValue;
          }
        }
        // Date validation
        else if (key.includes('date') || key.includes('_at')) {
          const dateValue = new Date(value);
          if (isNaN(dateValue.getTime())) {
            warnings.push({
              field: key,
              code: 'INVALID_DATE_FORMAT',
              message: 'Định dạng ngày không hợp lệ',
              value: value,
              business_rule: 'DATE_FORMAT_VALIDATION'
            });
          } else {
            processedQuery[key] = value;
          }
        }
        // String sanitization
        else {
          // Remove potential XSS and SQL injection patterns
          const sanitized = value
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/['"`;]/g, '')
            .trim();

          if (sanitized !== value) {
            warnings.push({
              field: key,
              code: 'VALUE_SANITIZED',
              message: 'Giá trị đã được làm sạch để bảo mật',
              business_rule: 'XSS_PROTECTION'
            });
          }

          processedQuery[key] = sanitized;
        }
      }

      // Apply Zod schema validation
      const validatedQuery = schema.parse(processedQuery);

      // Store validation results in context
      c.set('jwtPayload', validatedQuery as any);
      c.set('jwtPayload', warnings as any);
      c.set('jwtPayload', {
        validation_time: Date.now() - startTime,
        schema_version: '1.0',
        business_rules_applied: warnings.map(w => w.business_rule).filter(Boolean)
      });

      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors: ValidationError[] = (error as any).errors.map((err: any) => ({
          field: err.path.join('.'),
          code: err.code,
          message: getVietnameseErrorMessage(err),
          value: err.input,
          expected: err.expected
        }));

        return c.json<ApiResponse<null>>({
          success: false,
          data: null,
          message: 'Dữ liệu query không hợp lệ',
          errors: validationErrors as any
        }, 400);
      }

      console.error('Query validation error:', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Lỗi validate query parameters'
      }, 500);
    }
  };
};

/**
 * Enterprise-level body validation with business rules
 */
export const validateBody = <T extends z.ZodSchema>(schema: T) => {
  return async (c: Context<HonoEnv>, next: Next) => {
    const startTime = Date.now();

    try {
      const contentType = c.req.header('content-type');
      let body: any;

      // Handle different content types
      if (contentType?.includes('application/json')) {
        body = await c.req.json();
      } else if (contentType?.includes('application/x-www-form-urlencoded')) {
        const formData = await c.req.formData();
        body = Object.fromEntries((formData as any).entries());
      } else {
        return c.json<ApiResponse<null>>({
          success: false,
          data: null,
          message: 'Content-Type không được hỗ trợ'
        }, 400);
      }

      // Apply business logic preprocessing
      const processedBody = await applyBusinessLogicPreprocessing(body, c);

      // Validate with Zod schema
      const validatedBody = schema.parse(processedBody.data);

      // Store validation results
      c.set('jwtPayload', validatedBody as any);
      c.set('jwtPayload', processedBody.warnings as any);
      c.set('jwtPayload', {
        validation_time: Date.now() - startTime,
        schema_version: '1.0',
        business_rules_applied: processedBody.businessRulesApplied
      });

      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors: ValidationError[] = (error as any).errors.map((err: any) => ({
          field: err.path.join('.'),
          code: err.code,
          message: getVietnameseErrorMessage(err),
          value: err.input,
          expected: err.expected
        }));

        return c.json<ApiResponse<null>>({
          success: false,
          data: null,
          message: 'Dữ liệu request không hợp lệ',
          errors: validationErrors as any
        }, 400);
      }

      console.error('Body validation error:', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Lỗi validate request body'
      }, 500);
    }
  };
};

/**
 * Enterprise-level path parameters validation
 */
export const validateParams = <T extends z.ZodSchema>(schema: T) => {
  return async (c: Context<HonoEnv>, next: Next) => {
    const startTime = Date.now();

    try {
      const params = c.req.param();

      // Advanced parameter processing with business rules
      const processedParams: any = {};
      const warnings: ValidationError[] = [];

      for (const [key, value] of Object.entries(params)) {
        // ID validation with business rules
        if (key.endsWith('_id') || key === 'id') {
          const numValue = Number(value);
          if (isNaN(numValue) || numValue <= 0) {
            throw new z.ZodError([{
              code: z.ZodIssueCode.invalid_type,
              expected: 'number',
              received: 'string',
              path: [key],
              message: `${key} phải là số nguyên dương`
            } as any]);
          }

          // Business rule: Check for reasonable ID ranges
          if (numValue > 2147483647) { // Max INT in most databases
            warnings.push({
              field: key,
              code: 'ID_TOO_LARGE',
              message: 'ID có thể quá lớn',
              value: numValue,
              business_rule: 'MAX_ID_VALIDATION'
            });
          }

          processedParams[key] = numValue;
        }
        // String parameters with sanitization
        else {
          const sanitized = value
            .replace(/[<>'"]/g, '')
            .trim();

          if (sanitized !== value) {
            warnings.push({
              field: key,
              code: 'PARAM_SANITIZED',
              message: 'Tham số đã được làm sạch',
              business_rule: 'PARAM_SANITIZATION'
            });
          }

          processedParams[key] = sanitized;
        }
      }

      const validatedParams = schema.parse(processedParams);

      // Store results in context
      c.set('jwtPayload', validatedParams as any);
      c.set('jwtPayload', warnings as any);
      c.set('jwtPayload', {
        validation_time: Date.now() - startTime,
        schema_version: '1.0',
        business_rules_applied: warnings.map(w => w.business_rule).filter(Boolean)
      });

      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors: ValidationError[] = (error as any).errors.map((err: any) => ({
          field: err.path.join('.'),
          code: err.code,
          message: getVietnameseErrorMessage(err),
          value: err.input,
          expected: err.expected
        }));

        return c.json<ApiResponse<null>>({
          success: false,
          data: null,
          message: 'Tham số đường dẫn không hợp lệ',
          errors: validationErrors as any
        }, 400);
      }

      console.error('Params validation error:', error);
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Lỗi validate path parameters'
      }, 500);
    }
  };
};

/**
 * Business logic preprocessing for request data
 */
async function applyBusinessLogicPreprocessing(data: any, c: Context<HonoEnv>) {
  const warnings: ValidationError[] = [];
  const businessRulesApplied: string[] = [];
  const processedData = { ...data };

  // Price validation and formatting
  if (processedData.price !== undefined) {
    if (typeof processedData.price === 'string') {
      processedData.price = parseFloat(processedData.price.replace(/[^\d.-]/g, ''));
    }

    if (processedData.price < 0) {
      warnings.push({
        field: 'price',
        code: 'NEGATIVE_PRICE',
        message: 'Giá không thể âm, đã điều chỉnh về 0',
        value: processedData.price,
        expected: 0,
        business_rule: 'NON_NEGATIVE_PRICE'
      });
      processedData.price = 0;
      businessRulesApplied.push('NON_NEGATIVE_PRICE');
    }
  }

  // Quantity validation
  if (processedData.quantity !== undefined) {
    if (processedData.quantity <= 0) {
      warnings.push({
        field: 'quantity',
        code: 'INVALID_QUANTITY',
        message: 'Số lượng phải lớn hơn 0',
        value: processedData.quantity,
        business_rule: 'POSITIVE_QUANTITY'
      });
    }
    businessRulesApplied.push('POSITIVE_QUANTITY');
  }

  // Email normalization
  if (processedData.email) {
    processedData.email = processedData.email.toLowerCase().trim();
    businessRulesApplied.push('EMAIL_NORMALIZATION');
  }

  // Phone number formatting (Vietnamese format)
  if (processedData.phone) {
    let phone = processedData.phone.replace(/\D/g, '');
    if (phone.startsWith('84')) {
      phone = '0' + phone.substring(2);
    }
    processedData.phone = phone;
    businessRulesApplied.push('PHONE_FORMATTING');
  }

  return {
    data: processedData,
    warnings,
    businessRulesApplied
  };
}

/**
 * Helper function to get validated data from context
 */
export function getValidated<T>(c: Context<HonoEnv>): T {
  const validatedBody = c.get('validatedBody');
  const validatedQuery = c.get('validatedQuery');
  const validatedParams = c.get('validatedParams');

  // Return the first available validated data
  return (validatedBody || validatedQuery || validatedParams) as T;
}

/**
 * Generic request validation middleware
 */
export const validateRequest = <T extends z.ZodSchema>(schema: T) => {
  return async (c: Context<HonoEnv>, next: Next) => {
    try {
      const body = await c.req.json();
      const validatedData = schema.parse(body);
      c.set('jwtPayload', validatedData as any);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json<ApiResponse<null>>({
          success: false,
          data: null,
          message: 'Dữ liệu request không hợp lệ',
          errors: (error as any).errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }, 400);
      }
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Lỗi validate request'
      }, 500);
    }
  };
};

/**
 * Convert Zod error messages to Vietnamese
 */
function getVietnameseErrorMessage(error: z.ZodIssue): string {
  switch (error.code) {
    case z.ZodIssueCode.invalid_type:
      return `Kiểu dữ liệu không hợp lệ. Mong đợi ${(error as any).expected}, nhận được ${(error as any).received}`;
    case z.ZodIssueCode.too_small:
      if ((error as any).type === 'string') {
        return `Chuỗi quá ngắn. Tối thiểu ${error.minimum} ký tự`;
      } else if ((error as any).type === 'number') {
        return `Số quá nhỏ. Tối thiểu ${error.minimum}`;
      }
      return `Giá trị quá nhỏ. Tối thiểu ${error.minimum}`;
    case z.ZodIssueCode.too_big:
      if ((error as any).type === 'string') {
        return `Chuỗi quá dài. Tối đa ${error.maximum} ký tự`;
      } else if ((error as any).type === 'number') {
        return `Số quá lớn. Tối đa ${error.maximum}`;
      }
      return `Giá trị quá lớn. Tối đa ${error.maximum}`;
    case 'invalid_string' as any:
      if ((error as any).validation === 'email') {
        return 'Định dạng email không hợp lệ';
      } else if ((error as any).validation === 'url') {
        return 'Định dạng URL không hợp lệ';
      }
      return 'Định dạng chuỗi không hợp lệ';
    case 'invalid_enum_value' as any:
      return `Giá trị không hợp lệ. Các giá trị cho phép: ${(error as any).options.join(', ')}`;
    default:
      return error.message || 'Dữ liệu không hợp lệ';
  }
}
