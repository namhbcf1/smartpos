import { Context, MiddlewareHandler } from 'hono';
import { ZodSchema } from 'zod';
import { ApiResponse } from '../types';

// Type cho validation errors
interface ValidationErrors {
  [key: string]: string[];
}

// Middleware cho validate request body dựa trên Zod schema
export const validate = (schema: ZodSchema): MiddlewareHandler => {
  return async (c, next) => {
    try {
      // Lấy content-type từ request
      const contentType = c.req.header('content-type') || '';
      
      // Parse request body tùy theo content-type
      let requestData: unknown;
      
      if (contentType.includes('application/json')) {
        requestData = await c.req.json();
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await c.req.formData();
        requestData = Object.fromEntries((formData as any).entries());
      } else if (contentType.includes('multipart/form-data')) {
        const formData = await c.req.formData();
        requestData = Object.fromEntries((formData as any).entries());
      } else {
        // Default to JSON if content-type is not specified
        try {
          requestData = await c.req.json();
        } catch (e) {
          requestData = { /* No operation */ }
        }
      }
      
      // Validate dữ liệu với schema
      const result = schema.safeParse(requestData);
      
      if (!result.success) {
        const errors: ValidationErrors = { /* No operation */ }
        // Format lỗi validation
        (result.error as any).errors.forEach((err: any) => {
          const path = err.path.join('.');
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
        });
        
        // Trả về response lỗi validation
        return c.json<ApiResponse<null>>({
          success: false,
          data: null,
          message: 'Dữ liệu không hợp lệ',
          errors
        }, 422);
      }
      
      // Lưu dữ liệu đã validate vào context để sử dụng ở handler
      c.set('validated', result.data);
      
      await next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      
      // Trả về lỗi nếu có exception
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Lỗi xử lý dữ liệu',
      }, 400);
    }
  };
};

// Middleware cho validate query params
export const validateQuery = (schema: ZodSchema): MiddlewareHandler => {
  return async (c, next) => {
    try {
      const queryParams = c.req.query();
      // Validate query params
      const result = schema.safeParse(queryParams);
      
      if (!result.success) {
        const errors: ValidationErrors = { /* No operation */ }
        // Format lỗi validation
        (result.error as any).errors.forEach((err: any) => {
          const path = err.path.join('.');
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
        });
        
        // Trả về response lỗi validation
        return c.json<ApiResponse<null>>({
          success: false,
          data: null,
          message: 'Tham số tìm kiếm không hợp lệ',
          errors
        }, 422);
      }
      
      // Lưu query params đã validate vào context
      c.set('validatedQuery', result.data);
      
      await next();
    } catch (error) {
      console.error('Query validation middleware error:', error);
      
      // Trả về lỗi nếu có exception
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Lỗi xử lý tham số tìm kiếm',
      }, 400);
    }
  };
};

// Helper để truy cập dữ liệu đã validate
export function getValidated(c: Context): T {
  return c.get('validated') as T;
}

// Helper để truy cập query params đã validate
export function getValidatedQuery(c: Context): T {
  return c.get('validatedQuery') as T;
} 