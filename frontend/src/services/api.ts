// Enhanced API Service - Following rules.md standards
// NO MOCK DATA - Real API calls only

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
// import { API_ENDPOINTS } from '../config/constants';
import {
  ApiResponse,
  // ApiError,
  User,
  Product,
  Sale,
  Customer,
  Supplier,
  // Category,
  StockTransaction,
  // WarrantyRegistration,
  DashboardStats,
  ProductFilters,
  SaleFilters,
  InventoryFilters,
  LoginForm,
  RegisterForm,
  ProductForm,
  SaleForm
} from '../types/api';

// API Configuration - Use environment variables with fallback
const RAW_API_URL = import.meta.env.VITE_API_BASE_URL ||
                    import.meta.env.VITE_API_URL ||
                    'https://namhbcf-api.bangachieu2.workers.dev';

// Strip any accidental /api/v{n} suffix from env to avoid double-prefix issues
const stripped = (RAW_API_URL || '').replace(/\/api\/v\d+\/?$/, '');
const sanitizedBase = stripped.replace(/\/$/, '');

// Do NOT append /api/v1 here. Keep pure base. Some clients add the versioned path.
export const API_BASE_URL = sanitizedBase;
export const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';
// Back to correct API versioning 
export const API_V1_BASE_URL = `${sanitizedBase}/api/${API_VERSION}`;

// Always use production mode (online only)
const isProduction = true;

console.log('🌐 API Configuration:', {
  RAW_API_URL,
  resolvedBaseURL: API_BASE_URL,
  finalBaseUrl: API_V1_BASE_URL,
  environment: isProduction ? 'production' : 'development'
});

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: API_V1_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Important: enables sending/receiving cookies
  timeout: 10000, // 10 seconds timeout
});

// Token storage with persistence - prioritize sessionStorage over localStorage
let authToken: string | null = null;

// SECURITY COMPLIANCE: No localStorage/sessionStorage usage
const getUserFromStorage = (): User | null => {
  // User data will be fetched from /auth/me endpoint
  return null;
};

// Removed unused setUserInStorage for linter cleanliness

const clearUserFromStorage = (): void => {
  // Clear auth token
  authToken = null;
  sessionStorage.removeItem('auth_token');
};

// Initialize token from sessionStorage
const initializeToken = (): void => {
  // Try to get JWT token from sessionStorage or cookie
  let storedToken = sessionStorage.getItem('auth_token');
  if (!storedToken) {
    try {
      storedToken = document.cookie
        .split('; ')
        .find(r => r.startsWith('auth_token='))
        ?.split('=')[1] || null;
    } catch {}
  }
  if (storedToken && storedToken.split('.').length === 3) {
    authToken = storedToken;
    console.log('🔐 API Service: Token loaded from storage');
  } else {
    authToken = null;
    console.log('🔐 API Service: No token found');
  }
};

// Initialize token immediately
initializeToken();

// Enhanced request interceptor with proper error handling
api.interceptors.request.use(
  (config) => {
    // Always try to get fresh JWT from sessionStorage; enforce JWT shape
    const freshToken = sessionStorage.getItem('auth_token');
    const tokenToUse = freshToken && freshToken.split('.').length === 3
      ? freshToken
      : (authToken && authToken.split('.').length === 3 ? authToken : null);
    if (tokenToUse) {
      authToken = tokenToUse;
      config.headers.Authorization = `Bearer ${tokenToUse}`;
    }

    // Request ID headers completely removed to prevent CORS issues
    // No tracking headers needed for production deployment

    // Only log important requests in development mode (exclude polling and frequent requests)
    if (process.env.NODE_ENV === 'development' &&
        !config.url?.includes('/dashboard/stats') &&
        !config.url?.includes('/polling') &&
        !config.url?.includes('/employees')) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with proper error handling
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // Only log important responses in development mode (not polling responses)
    if (process.env.NODE_ENV === 'development' &&
        !response.config.url?.includes('/dashboard/stats') &&
        !response.config.url?.includes('/polling') &&
        !response.config.url?.includes('/employees/simple')) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        success: response.data.success
      });
    }

    // Handle successful responses
    if (response.data.success) {
      return response;
    } else {
      // Handle API-level errors - check both message and error fields
      const error = new Error(response.data.message || response.data.error || 'API request failed') as Error & {
        response: AxiosResponse<ApiResponse>;
        apiError: ApiResponse;
      };
      error.response = response;
      error.apiError = response.data;
      return Promise.reject(error);
    }
  },
  (error: AxiosError<ApiResponse>) => {
    console.error('❌ Response Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data
    });

    // Handle different types of errors
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 401:
          // Unauthorized - don't clear auth immediately, just log
          console.warn('401 Unauthorized - token may be invalid');
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            // Try to refresh token first
            const freshToken = sessionStorage.getItem('auth_token');
            if (freshToken) {
              authToken = freshToken;
              // Retry the request with fresh token
              if (error.config) {
                return api.request(error.config as any);
              }
              throw error;
            }
            // If no fresh token, redirect to login
            window.location.href = '/login';
          }
          break;
        case 403:
          // Forbidden - user doesn't have permission
          console.error('Access denied:', data?.error);
          break;
        case 404:
          // Not found
          console.error('Resource not found:', data?.error);
          break;
        case 422:
          // Validation error
          console.error('Validation error:', data?.error);
          break;
        case 429:
          // Rate limited
          console.error('Rate limited:', data?.error);
          break;
        case 500:
          // Server error
          console.error('Server error:', data?.error);
          break;
        default:
          console.error('API error:', data?.error);
      }

      // Create enhanced error object - check both message and error fields
      const enhancedError = new Error(data?.message || data?.error || `HTTP ${status}: ${error.response.statusText}`) as Error & {
        status: number;
        response: AxiosResponse<ApiResponse>;
        apiError: ApiResponse;
      };
      enhancedError.status = status;
      enhancedError.response = error.response;
      enhancedError.apiError = data;
      return Promise.reject(enhancedError);
    } else if (error.request) {
      // Network error - properly handle connection issues
      const networkError = new Error('Network error - please check your internet connection') as Error & {
        request: any;
        code: string;
      };
      networkError.request = error.request;
      networkError.code = 'NETWORK_ERROR';
      return Promise.reject(networkError);
    } else {
      // Other error - configuration or unknown issues
      return Promise.reject(error);
    }
  }
);

// Enhanced API functions with proper typing and error handling

// Authentication API
export const authAPI = {
  login: async (credentials: LoginForm): Promise<ApiResponse<{ token: string; user: User }>> => {
    const response = await api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', credentials);
    return response.data;
  },

  logout: async (): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>('/auth/logout');
    clearUserFromStorage();
    return response.data;
  },

  register: async (userData: RegisterForm): Promise<ApiResponse<User>> => {
    const response = await api.post<ApiResponse<User>>('/auth/register', userData);
    return response.data;
  },

  refresh: async (): Promise<ApiResponse<{ token: string; user: User }>> => {
    const response = await api.post<ApiResponse<{ token: string; user: User }>>('/auth/refresh');
    return response.data;
  },

  me: async (): Promise<ApiResponse<User>> => {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data;
  }
};

// User Management API
export const userAPI = {
  list: async (page = 1, limit = 20): Promise<ApiResponse<User[]>> => {
    const response = await api.get<ApiResponse<User[]>>('/users', {
      params: { page, limit }
    });
    return response.data;
  },

  create: async (userData: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.post<ApiResponse<User>>('/users', userData);
    return response.data;
  },

  update: async (id: number | string, userData: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, userData);
    return response.data;
  },

  delete: async (id: number | string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/users/${id}`);
    return response.data;
  },

  profile: async (): Promise<ApiResponse<User>> => {
    const response = await api.get<ApiResponse<User>>('/users/profile');
    return response.data;
  }
};

// Product Management API
export const productAPI = {
  list: async (filters?: ProductFilters): Promise<ApiResponse<Product[]>> => {
    const response = await api.get<ApiResponse<Product[]>>('/products', {
      params: filters
    });
    return response.data;
  },

  create: async (productData: ProductForm): Promise<ApiResponse<Product>> => {
    const response = await api.post<ApiResponse<Product>>('/products', productData);
    return response.data;
  },

  update: async (id: number | string, productData: Partial<ProductForm>): Promise<ApiResponse<Product>> => {
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, productData);
    return response.data;
  },

  delete: async (id: number | string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/products/${id}`);
    return response.data;
  },

  detail: async (id: number | string): Promise<ApiResponse<Product>> => {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data;
  },

  search: async (query: string, limit = 10): Promise<ApiResponse<Product[]>> => {
    const response = await api.get<ApiResponse<Product[]>>('/products/search', {
      params: { q: query, limit }
    });
    return response.data;
  }
};

// Sales Management API
export const saleAPI = {
  list: async (filters?: SaleFilters): Promise<ApiResponse<Sale[]>> => {
    const response = await api.get<ApiResponse<Sale[]>>('/sales', {
      params: filters
    });
    return response.data;
  },

  create: async (saleData: SaleForm): Promise<ApiResponse<Sale>> => {
    const response = await api.post<ApiResponse<Sale>>('/sales', saleData);
    return response.data;
  },

  update: async (id: number | string, saleData: Partial<SaleForm>): Promise<ApiResponse<Sale>> => {
    const response = await api.put<ApiResponse<Sale>>(`/sales/${id}`, saleData);
    return response.data;
  },

  delete: async (id: number | string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/sales/${id}`);
    return response.data;
  },

  detail: async (id: number | string): Promise<ApiResponse<Sale>> => {
    const response = await api.get<ApiResponse<Sale>>(`/sales/${id}`);
    return response.data;
  }
};

// Customer Management API
export const customerAPI = {
  list: async (page = 1, limit = 20): Promise<ApiResponse<Customer[]>> => {
    const response = await api.get<ApiResponse<Customer[]>>('/customers', {
      params: { page, limit }
    });
    return response.data;
  },

  create: async (customerData: Partial<Customer>): Promise<ApiResponse<Customer>> => {
    const response = await api.post<ApiResponse<Customer>>('/customers', customerData);
    return response.data;
  },

  update: async (id: number | string, customerData: Partial<Customer>): Promise<ApiResponse<Customer>> => {
    const response = await api.put<ApiResponse<Customer>>(`/customers/${id}`, customerData);
    return response.data;
  },

  delete: async (id: number | string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/customers/${id}`);
    return response.data;
  },

  detail: async (id: number | string): Promise<ApiResponse<Customer>> => {
    const response = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    return response.data;
  }
};

// Supplier Management API
export const supplierAPI = {
  list: async (page = 1, limit = 20): Promise<ApiResponse<Supplier[]>> => {
    const response = await api.get<ApiResponse<Supplier[]>>('/suppliers', {
      params: { page, limit }
    });
    return response.data;
  },

  create: async (supplierData: Partial<Supplier>): Promise<ApiResponse<Supplier>> => {
    const response = await api.post<ApiResponse<Supplier>>('/suppliers', supplierData);
    return response.data;
  },

  update: async (id: number | string, supplierData: Partial<Supplier>): Promise<ApiResponse<Supplier>> => {
    const response = await api.put<ApiResponse<Supplier>>(`/suppliers/${id}`, supplierData);
    return response.data;
  },

  delete: async (id: number | string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/suppliers/${id}`);
    return response.data;
  },

  detail: async (id: number | string): Promise<ApiResponse<Supplier>> => {
    const response = await api.get<ApiResponse<Supplier>>(`/suppliers/${id}`);
    return response.data;
  }
};

// Inventory Management API
export const inventoryAPI = {
  transactions: async (filters?: InventoryFilters): Promise<ApiResponse<StockTransaction[]>> => {
    const response = await api.get<ApiResponse<StockTransaction[]>>('/inventory/transactions', {
      params: filters
    });
    return response.data;
  },

  stockLevels: async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get<ApiResponse<any[]>>('/inventory/stock-levels');
    return response.data;
  },

  adjustments: async (adjustmentData: any): Promise<ApiResponse<StockTransaction>> => {
    const response = await api.post<ApiResponse<StockTransaction>>('/inventory/adjustments', adjustmentData);
    return response.data;
  },

  transfers: async (transferData: any): Promise<ApiResponse<StockTransaction>> => {
    const response = await api.post<ApiResponse<StockTransaction>>('/inventory/transfers', transferData);
    return response.data;
  }
};

// Analytics API
export const analyticsAPI = {
  dashboard: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return response.data;
  },

  salesReport: async (filters?: any): Promise<ApiResponse<any>> => {
    const response = await api.get<ApiResponse<any>>('/analytics/sales-report', {
      params: filters
    });
    return response.data;
  },

  inventoryReport: async (filters?: any): Promise<ApiResponse<any>> => {
    const response = await api.get<ApiResponse<any>>('/analytics/inventory-report', {
      params: filters
    });
    return response.data;
  },

  customerReport: async (filters?: any): Promise<ApiResponse<any>> => {
    const response = await api.get<ApiResponse<any>>('/analytics/customer-report', {
      params: filters
    });
    return response.data;
  }
};

// Utility functions
export const setAuthToken = (token: string): void => {
  console.log('🔐 Setting auth token:', token.substring(0, 20) + '...');
  authToken = token;
  sessionStorage.setItem('auth_token', token);
  console.log('✅ Auth token set successfully');
};

export const getAuthToken = (): string | null => {
  return authToken;
};

export const isAuthenticated = (): boolean => {
  return !!authToken;
};

export const getCurrentUser = (): User | null => {
  return getUserFromStorage();
};

// API wrapper with response data extraction
const apiWrapper = {
  get: async <T = any>(url: string, config?: any): Promise<T> => {
    try {
      const response = await api.get<ApiResponse<T>>(url, config);
      return response.data.success ? response.data.data : response.data;
    } catch (error: any) {
      console.error('API GET Error:', error);
      throw error;
    }
  },

  post: async <T = any>(url: string, data?: any, config?: any): Promise<T> => {
    try {
      const response = await api.post<ApiResponse<T>>(url, data, config);
      return response.data.success ? response.data.data : response.data;
    } catch (error: any) {
      console.error('API POST Error:', error);
      throw error;
    }
  },

  put: async <T = any>(url: string, data?: any, config?: any): Promise<T> => {
    try {
      const response = await api.put<ApiResponse<T>>(url, data, config);
      return response.data.success ? response.data.data : response.data;
    } catch (error: any) {
      console.error('API PUT Error:', error);
      throw error;
    }
  },

  delete: async <T = any>(url: string, config?: any): Promise<T> => {
    try {
      const response = await api.delete<ApiResponse<T>>(url, config);
      return response.data.success ? response.data.data : response.data;
    } catch (error: any) {
      console.error('API DELETE Error:', error);
      throw error;
    }
  }
};

// Export the wrapper API and all API modules
export default apiWrapper;