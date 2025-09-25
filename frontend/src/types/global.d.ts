// Global type definitions for SmartPOS

declare global {
  interface Window {
    SMARTPOS_TOKEN?: string;
    SMARTPOS_CONFIG?: {
      apiUrl: string;
      environment: 'development' | 'production';
    };
  }

  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      VITE_API_BASE_URL: string;
      VITE_API_URL: string;
      VITE_API_VERSION: string;
      VITE_FRONTEND_URL: string;
      VITE_CLOUDFLARE_WS_URL: string;
      VITE_R2_UPLOAD_URL: string;
      VITE_ENABLE_REAL_TIME: string;
    }
  }
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Common Entity Types
export interface BaseEntity {
  id: string | number;
  created_at: string;
  updated_at: string;
}

export interface User extends BaseEntity {
  username: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'CASHIER';
  permissions?: string[];
  is_active: boolean;
}

export interface Product extends BaseEntity {
  name: string;
  sku: string;
  price: number;
  cost: number;
  stock: number;
  category_id: number;
  description?: string;
  image_url?: string;
  is_active: boolean;
}

export interface Order extends BaseEntity {
  order_number: string;
  customer_id?: number;
  total_amount: number;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  payment_method: string;
  items: OrderItem[];
}

export interface OrderItem {
  product_id: number;
  quantity: number;
  price: number;
  total: number;
}

// Error Types
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Form Types
export interface FormState<T> {
  data: T;
  errors: Record<keyof T, string>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Component Props Types
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface PageProps extends ComponentProps {
  title?: string;
  description?: string;
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Required<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export {};
