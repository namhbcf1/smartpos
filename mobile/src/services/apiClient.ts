/**
 * API Client for Smart POS Mobile
 * Handles all API communications with the backend
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = __DEV__
      ? 'http://localhost:8787' // Development server
      : 'https://namhbcf-api.bangachieu2.workers.dev'; // Production server

    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      this.authToken = token;
    } catch (error) {
      console.error('Failed to load auth token:', error);
    }
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!this.authToken) {
      try {
        this.authToken = await AsyncStorage.getItem('authToken');
      } catch (error) {
        console.error('Failed to get auth token:', error);
      }
    }

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  private async checkConnectivity(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected ?? false;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      if (response.status === 401) {
        // Unauthorized - clear token and redirect to login
        await this.clearAuth();
        throw new Error('Authentication required');
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  }

  async setAuthToken(token: string) {
    this.authToken = token;
    try {
      await AsyncStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Failed to save auth token:', error);
    }
  }

  async clearAuth() {
    this.authToken = null;
    try {
      await AsyncStorage.multiRemove(['authToken', 'user']);
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Check connectivity
    const isConnected = await this.checkConnectivity();
    if (!isConnected) {
      throw new Error('No internet connection');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getAuthHeaders();

    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    try {
      console.log(`🌐 API Request: ${config.method || 'GET'} ${url}`);

      const response = await fetch(url, config);
      const result = await this.handleResponse<T>(response);

      console.log(`✅ API Success: ${endpoint}`);
      return result;
    } catch (error) {
      console.error(`❌ API Error: ${endpoint}`, error);
      throw error;
    }
  }

  // Convenience methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Upload files
  async upload<T>(
    endpoint: string,
    formData: FormData
  ): Promise<ApiResponse<T>> {
    const isConnected = await this.checkConnectivity();
    if (!isConnected) {
      throw new Error('No internet connection');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {};

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      console.error(`❌ Upload Error: ${endpoint}`, error);
      throw error;
    }
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();

// Auth API
export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    apiClient.post<{ token: string; user: any }>('/api/auth/login', credentials),

  logout: () =>
    apiClient.post('/api/auth/logout'),

  refreshToken: () =>
    apiClient.post<{ token: string }>('/api/auth/refresh'),

  getProfile: () =>
    apiClient.get<any>('/api/auth/profile'),
};

// Products API
export const productsApi = {
  getProducts: (params?: { search?: string; category?: string; page?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.page) searchParams.append('page', params.page.toString());

    return apiClient.get<{ products: any[]; pagination: any }>(`/api/products?${searchParams}`);
  },

  getProduct: (productId: number) =>
    apiClient.get<any>(`/api/products/${productId}`),

  getProductByBarcode: (barcode: string) =>
    apiClient.get<any>(`/api/products/barcode/${barcode}`),

  getRecentProducts: () =>
    apiClient.get<any[]>('/api/products/recent'),

  updateStock: (productId: number, quantity: number) =>
    apiClient.put(`/api/products/${productId}/stock`, { quantity }),
};

// Customers API
export const customersApi = {
  getCustomers: (params?: { search?: string; page?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', params.page.toString());

    return apiClient.get<{ customers: any[]; pagination: any }>(`/api/customers?${searchParams}`);
  },

  getCustomer: (customerId: number) =>
    apiClient.get<any>(`/api/customers/${customerId}`),

  createCustomer: (customerData: any) =>
    apiClient.post<any>('/api/customers', customerData),

  updateCustomer: (customerId: number, customerData: any) =>
    apiClient.put<any>(`/api/customers/${customerId}`, customerData),
};

// Sales/POS API
export const salesApi = {
  getSales: (params?: { page?: number; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.status) searchParams.append('status', params.status);

    return apiClient.get<{ sales: any[]; pagination: any }>(`/api/sales?${searchParams}`);
  },

  getSale: (saleId: string) =>
    apiClient.get<any>(`/api/sales/${saleId}`),

  createSale: (saleData: any) =>
    apiClient.post<any>('/api/sales', saleData),

  processPayment: (saleId: string, paymentData: any) =>
    apiClient.post<any>(`/api/sales/${saleId}/payment`, paymentData),

  printReceipt: (saleId: string) =>
    apiClient.post<any>(`/api/sales/${saleId}/print`),
};

// Dashboard API
export const dashboardApi = {
  getStats: () =>
    apiClient.get<any>('/api/dashboard/stats'),

  getRecentSales: () =>
    apiClient.get<any[]>('/api/dashboard/recent-sales'),

  getLowStockProducts: () =>
    apiClient.get<any[]>('/api/dashboard/low-stock'),
};

// Reports API
export const reportsApi = {
  getSalesReport: (params: { start_date: string; end_date: string }) =>
    apiClient.get<any>(`/api/reports/sales?start_date=${params.start_date}&end_date=${params.end_date}`),

  getInventoryReport: () =>
    apiClient.get<any>('/api/reports/inventory'),

  getCustomerReport: () =>
    apiClient.get<any>('/api/reports/customers'),
};

export default apiClient;