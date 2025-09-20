import axios from 'axios';

// Unified API client configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://namhbcf-api.bangachieu2.workers.dev';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Standardize response format
    return {
      data: response.data,
      success: true,
      status: response.status,
    };
  },
  (error) => {
    // Standardize error format
    const errorResponse = {
      data: null,
      success: false,
      error: error.response?.data?.message || error.message || 'An error occurred',
      status: error.response?.status || 500,
    };
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    
    return Promise.reject(errorResponse);
  }
);

// API methods
export const api = {
  // Products
  getProducts: (params?: any) => apiClient.get('/products', { params }),
  getProduct: (id: string) => apiClient.get(`/products/${id}`),
  createProduct: (data: any) => apiClient.post('/products', data),
  updateProduct: (id: string, data: any) => apiClient.put(`/products/${id}`, data),
  deleteProduct: (id: string) => apiClient.delete(`/products/${id}`),

  // Sales
  getSales: (params?: any) => apiClient.get('/sales', { params }),
  getSale: (id: string) => apiClient.get(`/sales/${id}`),
  createSale: (data: any) => apiClient.post('/sales/enhanced', data),
  updateSale: (id: string, data: any) => apiClient.put(`/sales/${id}`, data),

  // Dashboard
  getDashboardStats: () => apiClient.get('/dashboard/stats'),
  getNotifications: () => apiClient.get('/notifications'),

  // Customers
  getCustomers: (params?: any) => apiClient.get('/customers', { params }),
  getCustomer: (id: string) => apiClient.get(`/customers/${id}`),
  createCustomer: (data: any) => apiClient.post('/customers', data),
  updateCustomer: (id: string, data: any) => apiClient.put(`/customers/${id}`, data),

  // Inventory
  getInventory: (params?: any) => apiClient.get('/inventory', { params }),
  updateInventory: (id: string, data: any) => apiClient.put(`/inventory/${id}`, data),

  // Reports
  getReports: (params?: any) => apiClient.get('/reports', { params }),

  // Settings
  getSettings: () => apiClient.get('/settings'),
  updateSettings: (data: any) => apiClient.put('/settings', data),
};

export default apiClient;
