// Enhanced API Service - Following rules.md standards
// NO MOCK DATA - Real API calls only

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { 
  ApiResponse, 
  ApiError, 
  User, 
  Product, 
  Sale, 
  Customer, 
  Supplier,
  Category,
  StockTransaction,
  WarrantyRegistration,
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
                    'https://smartpos-api-bangachieu2.bangachieu2.workers.dev';

const sanitizedBase = (RAW_API_URL || '').replace(/\/$/, '');
// Check if URL already has /api/v1 suffix to avoid double prefix
const hasApiPrefix = /\/api\/v1$/.test(sanitizedBase);
const FULL_BASE_URL = hasApiPrefix ? sanitizedBase : `${sanitizedBase}/api/v1`;

// Export base URL for use in other components
export const API_BASE_URL = FULL_BASE_URL;

// Always use production mode (online only)
const isProduction = true;

console.log('🌐 API Configuration:', {
  RAW_API_URL,
  resolvedBaseURL: FULL_BASE_URL,
  environment: isProduction ? 'production' : 'development'
});

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: FULL_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Important: enables sending/receiving cookies
  timeout: 10000, // 10 seconds timeout
});

// Token storage with persistence - prioritize sessionStorage over localStorage
let authToken: string | null = null;

// Enhanced user storage and retrieval
const getUserFromStorage = (): User | null => {
  try {
    const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user from storage:', error);
    return null;
  }
};

const setUserInStorage = (user: User): void => {
  try {
    const userStr = JSON.stringify(user);
    sessionStorage.setItem('user', userStr);
    localStorage.setItem('user', userStr); // Backup in localStorage
  } catch (error) {
    console.error('Error storing user:', error);
  }
};

const clearUserFromStorage = (): void => {
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  localStorage.removeItem('auth_token');
  authToken = null;
};

// Initialize token from storage on module load (consistent with AuthContext)
const initializeToken = (): void => {
  // SECURITY FIX: Prioritize sessionStorage (current session) over localStorage (old session)
  const sessionToken = sessionStorage.getItem('auth_token');
  const localToken = localStorage.getItem('auth_token');

  if (sessionToken) {
    authToken = sessionToken;
    console.log('🔐 API Service: Using sessionStorage token');

    // Clean up old localStorage token if it exists and is different
    if (localToken && localToken !== sessionToken) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      console.log('🧹 API Service: Cleaned up old localStorage token');
    }
  } else if (localToken) {
    // Fallback to localStorage token but move it to sessionStorage
    authToken = localToken;
    sessionStorage.setItem('auth_token', localToken);
    console.log('🔄 API Service: Migrated localStorage token to sessionStorage');

    // Clean up localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }
};

// Initialize token immediately
initializeToken();

// Enhanced request interceptor with proper error handling
api.interceptors.request.use(
  (config) => {
    // Add auth token to all requests
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
      console.log('🔐 Adding auth token to request:', authToken.substring(0, 20) + '...');
    } else {
      console.log('⚠️ No auth token available for request');
    }

    // Add request ID for tracking
    config.headers['X-Request-ID'] = crypto.randomUUID();

    // Add timestamp for debugging
    config.headers['X-Timestamp'] = new Date().toISOString();

    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      data: config.data,
      params: config.params,
      hasAuthToken: !!authToken,
      headers: {
        Authorization: config.headers.Authorization ? 'Bearer ***' : 'None',
        'Content-Type': config.headers['Content-Type']
      }
    });

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
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      success: response.data.success,
      data: response.data.data
    });

    // Handle successful responses
    if (response.data.success) {
      return response;
    } else {
      // Handle API-level errors
      const error = new Error(response.data.error || 'API request failed');
      (error as any).response = response;
      (error as any).apiError = response.data;
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
          // Unauthorized - clear auth and redirect to login
          clearUserFromStorage();
          window.location.href = '/login';
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

      // Create enhanced error object
      const enhancedError = new Error(data?.error || `HTTP ${status}: ${error.response.statusText}`);
      (enhancedError as any).status = status;
      (enhancedError as any).response = error.response;
      (enhancedError as any).apiError = data;
      return Promise.reject(enhancedError);
    } else if (error.request) {
      // Network error
      const networkError = new Error('Network error - please check your connection');
      (networkError as any).request = error.request;
      return Promise.reject(networkError);
    } else {
      // Other error
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

  update: async (id: number, userData: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, userData);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
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

  update: async (id: number, productData: Partial<ProductForm>): Promise<ApiResponse<Product>> => {
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, productData);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/products/${id}`);
    return response.data;
  },

  detail: async (id: number): Promise<ApiResponse<Product>> => {
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

  update: async (id: number, saleData: Partial<SaleForm>): Promise<ApiResponse<Sale>> => {
    const response = await api.put<ApiResponse<Sale>>(`/sales/${id}`, saleData);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/sales/${id}`);
    return response.data;
  },

  detail: async (id: number): Promise<ApiResponse<Sale>> => {
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

  update: async (id: number, customerData: Partial<Customer>): Promise<ApiResponse<Customer>> => {
    const response = await api.put<ApiResponse<Customer>>(`/customers/${id}`, customerData);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/customers/${id}`);
    return response.data;
  },

  detail: async (id: number): Promise<ApiResponse<Customer>> => {
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

  update: async (id: number, supplierData: Partial<Supplier>): Promise<ApiResponse<Supplier>> => {
    const response = await api.put<ApiResponse<Supplier>>(`/suppliers/${id}`, supplierData);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/suppliers/${id}`);
    return response.data;
  },

  detail: async (id: number): Promise<ApiResponse<Supplier>> => {
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
    const response = await api.get<ApiResponse<DashboardStats>>('/analytics/dashboard');
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

// Export the main API instance and all API modules
export default api;