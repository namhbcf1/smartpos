import axios, { type AxiosInstance, type AxiosResponse } from 'axios';

// API Configuration - Use environment variable or fallback
// Ensure base URL always points to the /api aggregator
function sanitizeApiBaseUrl(raw: string | undefined): string {
  const fallback = 'https://namhbcf-api.bangachieu2.workers.dev';

  // If no value provided, use fallback
  if (!raw) {
    console.warn('⚠️ VITE_API_BASE_URL not set, using fallback:', fallback);
    return fallback;
  }

  // Guard against literal placeholders or invalid values coming from build envs
  const looksLikePlaceholder = /\$\{[^}]+\}/.test(raw) || raw.trim() === '' || raw.startsWith('$');
  const invalidScheme = !/^https?:\/\//i.test(raw);

  if (looksLikePlaceholder) {
    console.warn('⚠️ VITE_API_BASE_URL contains placeholder, using fallback:', fallback);
    return fallback;
  }

  if (invalidScheme) {
    console.warn('⚠️ VITE_API_BASE_URL has invalid scheme, using fallback:', fallback);
    return fallback;
  }

  // Remove /api suffix if present (we'll add it separately)
  const resolved = raw.replace(/\/api\/?$/, '');
  return resolved;
}

const API_BASE_URL = sanitizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

console.log('🔧 API Configuration:', {
  envVar: import.meta.env.VITE_API_BASE_URL,
  resolvedBaseURL: API_BASE_URL
});

// Create axios instance with /api suffix
const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000, // Increase to 10 seconds to avoid timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      timeout: config.timeout
    });
    
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add tenant ID
    config.headers['X-Tenant-ID'] = 'default';
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      code: error.code,
      timeout: error.code === 'ECONNABORTED'
    });
    
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  products?: T[];
  categories?: T[];
  customers?: T[];
  orders?: T[];
  sales?: T[];
  users?: T[];
  roles?: T[];
  suppliers?: T[];
  promotions?: T[];
  warehouses?: T[];
  warranties?: T[];
  debts?: T[];
  purchaseOrders?: T[];
  invoices?: T[];
  payments?: T[];
  devices?: T[];
  serialNumbers?: T[];
  tickets?: T[];
  taxes?: T[];
  shipping?: T[];
  returns?: T[];
  alerts?: T[];
  discounts?: T[];
  files?: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Products API
export const productsAPI = {
  // Get products with pagination
  getProducts: (page: number = 1, limit: number = 20, search?: string) =>
    api.get<PaginatedResponse>('/products', {
      params: { page, limit, search }
    }),

  // Get product by ID
  getProduct: (id: string) =>
    api.get<ApiResponse>(`/products/${id}`),

  // Search products
  searchProducts: (query: string, limit: number = 20) =>
    api.get<ApiResponse>('/products/search', {
      params: { q: query, limit }
    }),

  // Search by barcode
  searchByBarcode: (barcode: string) =>
    api.get<ApiResponse>(`/products/search/barcode/${barcode}`),

  // Get product statistics
  getStats: () =>
    api.get<ApiResponse>('/products/stats'),

  // Get top products
  getTopProducts: (limit: number = 10) =>
    api.get<ApiResponse>('/products/top', {
      params: { limit }
    }),

  // Create product
  createProduct: (data: any) =>
    api.post<ApiResponse>('/products', data),

  // Update product
  updateProduct: (id: string, data: any) =>
    api.put<ApiResponse>(`/products/${id}`, data),

  // Delete product
  deleteProduct: (id: string) =>
    api.delete<ApiResponse>(`/products/${id}`),

  // Adjust stock
  adjustStock: (id: string, data: any) =>
    api.post<ApiResponse>(`/products/${id}/stock`, data),
};

// Categories API
export const categoriesAPI = {
  // Get categories
  getCategories: (page: number = 1, limit: number = 100) =>
    api.get<PaginatedResponse>('/categories', {
      params: { page, limit }
    }),

  // Get category by ID
  getCategory: (id: string) =>
    api.get<ApiResponse>(`/categories/${id}`),

  // Create category
  createCategory: (data: any) =>
    api.post<ApiResponse>('/categories', data),

  // Update category
  updateCategory: (id: string, data: any) =>
    api.put<ApiResponse>(`/categories/${id}`, data),

  // Delete category
  deleteCategory: (id: string) =>
    api.delete<ApiResponse>(`/categories/${id}`),

  // Get category products
  getCategoryProducts: (id: string, page: number = 1, limit: number = 50) =>
    api.get<PaginatedResponse>(`/categories/${id}/products`, {
      params: { page, limit }
    }),
};

// Brands API
export const brandsAPI = {
  // Get brands
  getBrands: (page: number = 1, limit: number = 20, search?: string) =>
    api.get<PaginatedResponse>('/brands', {
      params: { page, limit, search }
    }),

  // Get brand by ID
  getBrand: (id: string) =>
    api.get<ApiResponse>(`/brands/${id}`),

  // Create brand
  createBrand: (data: any) =>
    api.post<ApiResponse>('/brands', data),

  // Update brand
  updateBrand: (id: string, data: any) =>
    api.put<ApiResponse>(`/brands/${id}`, data),

  // Delete brand
  deleteBrand: (id: string) =>
    api.delete<ApiResponse>(`/brands/${id}`),
};

// Customers API
export const customersAPI = {
  // Get customers
  getCustomers: (page: number = 1, limit: number = 20, search?: string) =>
    api.get<PaginatedResponse>('/customers', {
      params: { page, limit, search }
    }),

  // Get all customers by paginating until all records are fetched
  getAllCustomers: async (limitPerPage: number = 500): Promise<any[]> => {
    let page = 1;
    const all: any[] = [];
    // Safety guard to prevent infinite loops
    const MAX_PAGES = 200;
    // Keep requesting until we gathered everything (based on returned counts)
    // Works with multiple response shapes
    while (page <= MAX_PAGES) {
      const res = await api.get<PaginatedResponse>('/customers', { params: { page, limit: limitPerPage, include_all: true } });
      const payload: any = res?.data;
      const list = (payload?.customers || payload?.items || payload?.data?.customers || payload?.data?.items || payload?.data || []) as any[];
      if (!Array.isArray(list) || list.length === 0) break;
      all.push(...list);
      const pagination = payload?.pagination || payload?.data?.pagination;
      if (pagination?.total && pagination?.page && pagination?.limit) {
        const totalPages = pagination.totalPages || Math.ceil(pagination.total / pagination.limit);
        if (page >= totalPages) break;
      } else if (list.length < limitPerPage) {
        // No pagination meta; stop when page smaller than requested size
        break;
      }
      page += 1;
    }
    return all;
  },

  // Get customer by ID
  getCustomer: (id: string) =>
    api.get<ApiResponse>(`/customers/${id}`),

  // Search customers
  searchCustomers: (query: string, limit: number = 20) =>
    api.get<ApiResponse>('/customers/search', {
      params: { q: query, limit }
    }),

  // Get customer statistics
  getStats: () =>
    api.get<ApiResponse>('/customers/stats'),

  // Create customer
  createCustomer: (data: any) =>
    api.post<ApiResponse>('/customers', data),

  // Update customer
  updateCustomer: (id: string, data: any) =>
    api.put<ApiResponse>(`/customers/${id}`, data),

  // Delete customer
  deleteCustomer: (id: string) =>
    api.delete<ApiResponse>(`/customers/${id}`),

  // Get customer purchases
  getCustomerPurchases: (id: string, page: number = 1, limit: number = 20) =>
    api.get<PaginatedResponse>(`/customers/${id}/purchases`, {
      params: { page, limit }
    }),

  // Get customer tier
  getCustomerTier: (id: string) =>
    api.get<ApiResponse>(`/customers/${id}/tier`),

  getPurchasesDetailed: (id: string) => api.get<ApiResponse>(`/customers/${id}/purchases-detailed`),
  getWarranties: (id: string, page: number = 1, limit: number = 20) =>
    api.get<PaginatedResponse>(`/customers/${id}/warranties`, { params: { page, limit } }),
};

// Orders API
export const ordersAPI = {
  // Get orders
  getOrders: (page: number = 1, limit: number = 20, status?: string) =>
    api.get<PaginatedResponse>('/orders', {
      params: { page, limit, status }
    }),

  // Get order by ID
  getOrder: (id: string) =>
    api.get<ApiResponse>(`/orders/${id}`),

  // Create order (supports optional headers like Idempotency-Key)
  createOrder: (data: any, options?: { idempotencyKey?: string }) =>
    api.post<ApiResponse>('/orders', data, {
      headers: options?.idempotencyKey ? { 'Idempotency-Key': options.idempotencyKey } : undefined,
    }),

  // Update order
  updateOrder: (id: string, data: any) =>
    api.put<ApiResponse>(`/orders/${id}`, data),

  // Update order status
  updateOrderStatus: (id: string, status: string) =>
    api.put<ApiResponse>(`/orders/${id}/status`, { status }),

  // Fulfill order
  fulfillOrder: (id: string) =>
    api.post<ApiResponse>(`/orders/${id}/fulfill`, {}),

  // Cancel order
  cancelOrder: (id: string, reason?: string) =>
    api.post<ApiResponse>(`/orders/${id}/cancel`, { reason }),

  // Delete order (if supported by backend)
  deleteOrder: (id: string) =>
    api.delete<ApiResponse>(`/orders/${id}`),
};

// Dashboard API - removed inline definition, using import from dashboardApi.ts

// Sales API (legacy - now using orders)
export const salesAPI = {
  // Get sales
  getSales: (page: number = 1, limit: number = 20, search?: string) =>
    api.get<PaginatedResponse>('/sales', {
      params: { page, limit, search }
    }),

  // Get sale by ID
  getSale: (id: string) =>
    api.get<ApiResponse>(`/sales/${id}`),

  // Get sales statistics
  getStats: () =>
    api.get<ApiResponse>('/sales/stats'),

  // Get today's sales summary
  getTodaySummary: () =>
    api.get<ApiResponse>('/sales/today/summary'),

  // Calculate tax
  calculateTax: (subtotal: number) =>
    api.post<ApiResponse>('/sales/calculate-tax', { subtotal }),

  // Calculate cart
  calculateCart: (items: any[]) =>
    api.post<ApiResponse>('/sales/calculate-cart', { items }),

  // End of day report
  getEndOfDayReport: (date: string) =>
    api.get<ApiResponse>('/sales/reports/end-of-day', {
      params: { date }
    }),
};

// Reports API - removed inline definition, using import from reportsApi.ts

// Inventory API
export const inventoryAPI = {
  // Get inventory status
  getStatus: () =>
    api.get<ApiResponse>('/inventory'),
};

// Health check
export const healthAPI = {
  // Check API health
  check: () =>
    api.get<ApiResponse>('/health'),

  // Get API info
  getInfo: () =>
    api.get<ApiResponse>('/info'),
};

// Users API (for employee management)
export const usersAPI = {
  // Get users
  getUsers: (page: number = 1, limit: number = 20, search?: string) =>
    api.get<PaginatedResponse>('/users', {
      params: { page, limit, search }
    }),

  // Get user by ID
  getUser: (id: string) =>
    api.get<ApiResponse>(`/users/${id}`),

  // Create user
  createUser: (data: any) =>
    api.post<ApiResponse>('/users', data),

  // Update user
  updateUser: (id: string, data: any) =>
    api.put<ApiResponse>(`/users/${id}`, data),

  // Delete user
  deleteUser: (id: string) =>
    api.delete<ApiResponse>(`/users/${id}`),

  // Reset password
  resetPassword: (id: string) =>
    api.post<ApiResponse>(`/users/${id}/reset-password`),
};

// Roles API
export const rolesAPI = {
  // Get roles
  getRoles: (page: number = 1, limit: number = 20, search?: string) =>
    api.get<PaginatedResponse>('/roles', {
      params: { page, limit, search }
    }),

  // Get role by ID
  getRole: (id: string) =>
    api.get<ApiResponse>(`/roles/${id}`),

  // Create role
  createRole: (data: any) =>
    api.post<ApiResponse>('/roles', data),

  // Update role
  updateRole: (id: string, data: any) =>
    api.put<ApiResponse>(`/roles/${id}`, data),

  // Delete role
  deleteRole: (id: string) =>
    api.delete<ApiResponse>(`/roles/${id}`),

  // Get role permissions
  getRolePermissions: (id: string) =>
    api.get<ApiResponse>(`/roles/${id}/permissions`),

  // Update role permissions
  updateRolePermissions: (id: string, permissions: string[]) =>
    api.put<ApiResponse>(`/roles/${id}/permissions`, { permissions }),
};

// Suppliers API - moved to suppliersApi.ts

// Promotions API - moved to promotionsApi.ts

// Warehouses API - moved to warehousesApi.ts

// Warranties API
export const warrantiesAPI = {
  // Get warranties
  getWarranties: (page: number = 1, limit: number = 20, search?: string) =>
    api.get<PaginatedResponse>('/warranties', {
      params: { page, limit, search }
    }),

  // Get warranty by ID
  getWarranty: (id: string) =>
    api.get<ApiResponse>(`/warranties/${id}`),

  // Create warranty
  createWarranty: (data: any) =>
    api.post<ApiResponse>('/warranties', data),

  // Update warranty
  updateWarranty: (id: string, data: any) =>
    api.put<ApiResponse>(`/warranties/${id}`, data),

  // Delete warranty
  deleteWarranty: (id: string) =>
    api.delete<ApiResponse>(`/warranties/${id}`),

  // Get warranty claims
  getClaims: (page: number = 1, limit: number = 20, status?: string) =>
    api.get<PaginatedResponse>('/warranties/claims', {
      params: { page, limit, status }
    }),

  // Get warranty claim by ID
  getClaim: (id: string) =>
    api.get<ApiResponse>(`/warranties/claims/${id}`),

  // Create warranty claim
  createClaim: (data: any) =>
    api.post<ApiResponse>('/warranties/claims', data),

  // Update warranty claim status
  updateClaimStatus: (id: string, status: string, notes?: string) =>
    api.put<ApiResponse>(`/warranties/claims/${id}/status`, { status, notes }),

  // Approve claim
  approveClaim: (id: string, resolution_type?: string, resolution_description?: string) =>
    api.put<ApiResponse>(`/warranties/claims/${id}/approve`, { resolution_type, resolution_description }),

  // Reject claim
  rejectClaim: (id: string, reason?: string) =>
    api.put<ApiResponse>(`/warranties/claims/${id}/reject`, { reason }),

  // Check warranty by serial number
  checkBySerialLegacy: (serialNumber: string) =>
    api.get<ApiResponse>(`/warranties/check/${encodeURIComponent(serialNumber)}`),

  // Check warranty (public endpoint - by warranty_code, serial_number, or phone)
  checkWarranty: (data: { warranty_code?: string; serial_number?: string; phone?: string }) =>
    api.post<ApiResponse>('/warranties/check', data).then(res => res.data),

  // Check warranty complete (enhanced endpoint with full customer integration)
  checkWarrantyComplete: (data: { warranty_code?: string; serial_number?: string; phone?: string }) =>
    api.post<ApiResponse>('/warranties/check-complete', data).then(res => res.data),

  // Enhanced warranty check with new service (recommended)
  checkWarrantyEnhanced: (data: { warranty_code?: string; serial_number?: string; phone?: string }) =>
    api.post<ApiResponse>('/warranties/check-enhanced', data).then(res => res.data),

  // Direct service usage (without adapter)
  checkWarrantyDirect: (data: { warranty_code?: string; serial_number?: string; phone?: string }) =>
    api.post<ApiResponse>('/warranties/check-direct', data).then(res => res.data),

  // Direct lookup endpoints
  checkByPhone: (phone: string) =>
    api.get<ApiResponse>(`/warranties/check-by-phone/${encodeURIComponent(phone)}`),

  checkByCode: (code: string) =>
    api.get<ApiResponse>(`/warranties/check-by-code/${encodeURIComponent(code)}`),

  checkBySerial: (serial: string) =>
    api.get<ApiResponse>(`/warranties/check-by-serial/${encodeURIComponent(serial)}`),

  // Warranty status and statistics
  getWarrantyStatus: (warrantyId: string) =>
    api.get<ApiResponse>(`/warranties/status/${warrantyId}`),

  getWarrantyStatistics: () =>
    api.get<ApiResponse>('/warranties/statistics'),
};

// Invoices API
export const invoicesAPI = {
  // Get invoices
  getInvoices: (page: number = 1, limit: number = 20, search?: string) =>
    api.get<PaginatedResponse>('/invoices', {
      params: { page, limit, search }
    }),

  // Get invoice by ID
  getInvoice: (id: string) =>
    api.get<ApiResponse>(`/invoices/${id}`),

  // Create invoice
  createInvoice: (data: any) =>
    api.post<ApiResponse>('/invoices', data),

  // Update invoice
  updateInvoice: (id: string, data: any) =>
    api.put<ApiResponse>(`/invoices/${id}`, data),

  // Delete invoice
  deleteInvoice: (id: string) =>
    api.delete<ApiResponse>(`/invoices/${id}`),

  // Send invoice
  sendInvoice: (id: string) =>
    api.post<ApiResponse>(`/invoices/${id}/send`),

  // Download invoice PDF
  downloadInvoice: (id: string) =>
    api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),

  // Record payment
  recordPayment: (id: string, data: any) =>
    api.post<ApiResponse>(`/invoices/${id}/payment`, data),
};

// Payments API
export const paymentsAPI = {
  // Get payments
  getPayments: (page: number = 1, limit: number = 20, search?: string) =>
    api.get<PaginatedResponse>('/payments', {
      params: { page, limit, search }
    }),

  // Get payment by ID
  getPayment: (id: string) =>
    api.get<ApiResponse>(`/payments/${id}`),

  // Create payment
  createPayment: (data: any) =>
    api.post<ApiResponse>('/payments', data),

  // Update payment
  updatePayment: (id: string, data: any) =>
    api.put<ApiResponse>(`/payments/${id}`, data),

  // Delete payment
  deletePayment: (id: string) =>
    api.delete<ApiResponse>(`/payments/${id}`),

  // Process payment
  processPayment: (id: string) =>
    api.post<ApiResponse>(`/payments/${id}/process`),

  // Refund payment
  refundPayment: (id: string, data: any) =>
    api.post<ApiResponse>(`/payments/${id}/refund`, data),

  // Get payment methods summary
  getPaymentMethods: () =>
    api.get<ApiResponse>('/payments/methods/summary'),
};

// Payment Methods API (financials)
export const paymentMethodsAPI = {
  getPaymentMethods: () => api.get<ApiResponse>('/financials/payment-methods'),
};

// Debts API - moved to debtsApi.ts


// Authentication API
export const authAPI = {
  // Login with real API - Using fetch for better compatibility
  login: async (username: string, password: string) => {
    try {
      const loginUrl = `${API_BASE_URL}/api/auth/login`;
      console.log('Attempting login:', { username, apiUrl: loginUrl });

      const startTime = Date.now();
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': 'default'
        },
        body: JSON.stringify({ username, password })
      });
      
      const endTime = Date.now();
      console.log(`Login request completed in ${endTime - startTime}ms`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Login response:', data);

      if (data.success && data.data) {
        const { token, user } = data.data;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(user));
        console.log('Login successful, token saved');
        return data;
      }

      console.error('Login failed - unexpected response:', data);
      throw new Error(data.message || data.error || 'Login failed');
    } catch (error: any) {
      console.error('Login error caught:', error);
      throw new Error(error.message || 'Login failed');
    }
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
    return Promise.resolve({ success: true });
  },

  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Get current user from API
  me: () => api.get<ApiResponse>('/auth/me'),

  // Change password
  changePassword: (oldPassword: string, newPassword: string) =>
    api.post<ApiResponse>('/auth/change-password', { old_password: oldPassword, new_password: newPassword }),

  // Register new user (if backend supports it)
  register: (data: { username: string; email?: string; password: string }) =>
    api.post<ApiResponse>('/auth/register', data),

  // Request password reset (forgot password)
  forgotPassword: (data: { username?: string; email?: string }) =>
    api.post<ApiResponse>('/auth/forgot-password', data),
};

// Devices API
export const devicesAPI = {
  getDevices: (page: number = 1, limit: number = 20, search?: string) =>
    api.get<PaginatedResponse>('/devices', { params: { page, limit, search } }),
  getDevice: (id: string) => api.get<ApiResponse>(`/devices/${id}`),
  createDevice: (data: any) => api.post<ApiResponse>('/devices', data),
  updateDevice: (id: string, data: any) => api.put<ApiResponse>(`/devices/${id}`, data),
  deleteDevice: (id: string) => api.delete<ApiResponse>(`/devices/${id}`),
  testDevice: (id: string) => api.post<ApiResponse>(`/devices/${id}/test`),
};

// Serial Numbers API
export const serialNumbersAPI = {
  getSerialNumbers: (page: number = 1, limit: number = 20, search?: string, status?: string, product_id?: string) =>
    api.get<PaginatedResponse>('/serial-numbers', { params: { page, limit, search, status, product_id } }),
  searchSerials: (q: string) => api.get<ApiResponse>('/serial-numbers/search', { params: { q } }),
  getStats: () => api.get<ApiResponse>('/serial-numbers/stats'),
  getSerialNumber: (id: string) => api.get<ApiResponse>(`/serial-numbers/${id}`),
  createSerialNumber: (data: any) => api.post<ApiResponse>('/serial-numbers', data),
  updateSerialNumber: (id: string, data: any) => api.put<ApiResponse>(`/serial-numbers/${id}`, data),
  deleteSerialNumber: (id: string) => api.delete<ApiResponse>(`/serial-numbers/${id}`),
  trackSerialNumber: (id: string) => api.get<ApiResponse>(`/serial-numbers/${id}/track`),
  bulkImport: (rows: any[]) => api.post<ApiResponse>('/serial-numbers/bulk-import', rows),
  // NEW: Sync and auto-generate endpoints
  syncStock: () => api.post<ApiResponse>('/serial-numbers/sync-stock'),
  autoGenerate: (productId?: string, force?: boolean) =>
    api.post<ApiResponse>('/serial-numbers/auto-generate', { product_id: productId, force }),
  getByProduct: (productId: string, status?: string) =>
    api.get<ApiResponse>(`/serial-numbers/by-product/${productId}`, { params: { status } }),
};

// Support API - removed inline definition, using import from supportApi.ts

// Export reports API
export { reportsAPI } from './reportsApi';

// Export dashboard API
export { dashboardAPI } from './dashboardApi';

// Tax Management API
export const taxesAPI = {
  getTaxes: (page: number = 1, limit: number = 20, search?: string) =>
    api.get<PaginatedResponse>('/taxes', { params: { page, limit, search } }),
  getTax: (id: string) => api.get<ApiResponse>(`/taxes/${id}`),
  createTax: (data: any) => api.post<ApiResponse>('/taxes', data),
  updateTax: (id: string, data: any) => api.put<ApiResponse>(`/taxes/${id}`, data),
  deleteTax: (id: string) => api.delete<ApiResponse>(`/taxes/${id}`),
};

// Shipping API
export const shippingAPI = {
  getShippingMethods: (page: number = 1, limit: number = 20, search?: string) =>
    api.get<PaginatedResponse>('/shipping', { params: { page, limit, search } }),
  getShippingMethod: (id: string) => api.get<ApiResponse>(`/shipping/${id}`),
  createShippingMethod: (data: any) => api.post<ApiResponse>('/shipping', data),
  updateShippingMethod: (id: string, data: any) => api.put<ApiResponse>(`/shipping/${id}`, data),
  deleteShippingMethod: (id: string) => api.delete<ApiResponse>(`/shipping/${id}`),
  calculateShipping: (data: any) => api.post<ApiResponse>('/shipping/calculate', data),
  track: (tracking_number: string) => api.get<ApiResponse>(`/shipping/track/${encodeURIComponent(tracking_number)}`),
  ghtk: {
    calculateFee: (payload: any) => api.post<ApiResponse>('/shipping/ghtk/fee', payload),
    createOrder: (payload: any) => api.post<ApiResponse>('/shipping/ghtk/order', payload),
    track: (order_code: string) => api.get<ApiResponse>(`/shipping/ghtk/track/${encodeURIComponent(order_code)}`),
    label: (order_code: string) => api.get<ApiResponse>(`/shipping/ghtk/label/${encodeURIComponent(order_code)}`),
    cancel: (order_code: string, reason?: string) => api.post<ApiResponse>(`/shipping/ghtk/cancel/${encodeURIComponent(order_code)}`, { reason }),
    fromOrder: (orderId: string) => api.post<ApiResponse>(`/shipping/ghtk/from-order/${encodeURIComponent(orderId)}`, {}),
  },
  geo: {
    getProvinces: () => api.get<ApiResponse>('/shipping/geo/provinces'),
    getDistricts: (province_id: string) =>
      api.get<ApiResponse>(`/shipping/geo/districts/${encodeURIComponent(province_id)}`),
    getWards: (district_id: string) =>
      api.get<ApiResponse>(`/shipping/geo/wards/${encodeURIComponent(district_id)}`),
  }
};

// Returns API
export const returnsAPI = {
  getReturns: (page: number = 1, limit: number = 20, search?: string) =>
    api.get<PaginatedResponse>('/returns', { params: { page, limit, search } }),
  getReturn: (id: string) => api.get<ApiResponse>(`/returns/${id}`),
  createReturn: (data: any) => api.post<ApiResponse>('/returns', data),
  updateReturn: (id: string, data: any) => api.put<ApiResponse>(`/returns/${id}`, data),
  deleteReturn: (id: string) => api.delete<ApiResponse>(`/returns/${id}`),
  approveReturn: (id: string) => api.post<ApiResponse>(`/returns/${id}/approve`),
  rejectReturn: (id: string, reason: string) => api.post<ApiResponse>(`/returns/${id}/reject`, { reason }),
};

// Alerts API
export const alertsAPI = {
  getAlerts: (page: number = 1, limit: number = 20, search?: string) =>
    api.get<PaginatedResponse>('/alerts', { params: { page, limit, search } }),
  getAlert: (id: string) => api.get<ApiResponse>(`/alerts/${id}`),
  createAlert: (data: any) => api.post<ApiResponse>('/alerts', data),
  updateAlert: (id: string, data: any) => api.put<ApiResponse>(`/alerts/${id}`, data),
  deleteAlert: (id: string) => api.delete<ApiResponse>(`/alerts/${id}`),
  markAsRead: (id: string) => api.post<ApiResponse>(`/alerts/${id}/read`),
  markAllAsRead: () => api.post<ApiResponse>('/alerts/read-all'),
};

// Discounts API
export const discountsAPI = {
  getDiscounts: (page: number = 1, limit: number = 20, search?: string) =>
    api.get<PaginatedResponse>('/discounts', { params: { page, limit, search } }),
  getDiscount: (id: string) => api.get<ApiResponse>(`/discounts/${id}`),
  createDiscount: (data: any) => api.post<ApiResponse>('/discounts', data),
  updateDiscount: (id: string, data: any) => api.put<ApiResponse>(`/discounts/${id}`, data),
  deleteDiscount: (id: string) => api.delete<ApiResponse>(`/discounts/${id}`),
  validateDiscount: (code: string) => api.post<ApiResponse>('/discounts/validate', { code }),
};

// System Health API
export const systemAPI = {
  getHealth: () => api.get<ApiResponse>('/health'),
  getDiagnostics: () => api.get<ApiResponse>('/diagnostics'),
  getSystemInfo: () => api.get<ApiResponse>('/system/info'),
  getDatabaseStatus: () => api.get<ApiResponse>('/system/database'),
  getPerformanceMetrics: () => api.get<ApiResponse>('/system/metrics'),
};

// File Upload/Storage API
export const storageAPI = {
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse>('/r2/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getFiles: (page: number = 1, limit: number = 20, search?: string) =>
    api.get<PaginatedResponse>('/r2/files', { params: { page, limit, search } }),
  deleteFile: (id: string) => api.delete<ApiResponse>(`/r2/files/${id}`),
  getFileUrl: (id: string) => api.get<ApiResponse>(`/r2/files/${id}/url`),
};

// Purchase Orders API
export const purchaseOrdersAPI = {
  getPurchaseOrders: (page: number = 1, limit: number = 20, search?: string, status?: string, supplier_id?: string) =>
    api.get<PaginatedResponse>('/purchase-orders', {
      params: { page, limit, search, status, supplier_id }
    }),
  getPurchaseOrder: (id: string) => api.get<ApiResponse>(`/purchase-orders/${id}`),
  createPurchaseOrder: (data: any) => api.post<ApiResponse>('/purchase-orders', data),
  updatePurchaseOrder: (id: string, data: any) => api.put<ApiResponse>(`/purchase-orders/${id}`, data),
  updateStatus: (id: string, status: string, notes?: string) =>
    api.post<ApiResponse>(`/purchase-orders/${id}/status`, { status, notes }),
  receiveItem: (data: { po_item_id: string; quantity_received: number; quality_check?: string; notes?: string; expiry_date?: string; batch_number?: string }) =>
    api.post<ApiResponse>('/purchase-orders/receive-item', data),
};

// POS Cart API
export const posCartAPI = {
  getCart: () => api.get<ApiResponse>('/pos/checkout/cart'),
  addItem: (data: { product_id: string; variant_id?: string; quantity: number; unit_price?: number; discount_percent?: number; notes?: string }) =>
    api.post<ApiResponse>('/pos/checkout/cart/items', data),
  updateItem: (id: string, data: { quantity?: number; unit_price?: number; discount_percent?: number; notes?: string }) =>
    api.put<ApiResponse>(`/pos/checkout/cart/items/${id}`, data),
  removeItem: (id: string) => api.delete<ApiResponse>(`/pos/checkout/cart/items/${id}`),
  clearCart: () => api.delete<ApiResponse>('/pos/checkout/cart'),
};

// Employees API
export const settingsAPI = {
  getAll: () => api.get('/settings'),
  getByCategory: (category: string) => api.get(`/settings/category/${category}`),
  getByKey: (key: string) => api.get(`/settings/key/${key}`),
  update: (key: string, data: any) => api.put(`/settings/key/${key}`, data),
  batchUpdate: (settings: Record<string, string>, category: string = 'store') =>
    api.post('/settings/batch', { settings, category }),
  delete: (key: string) => api.delete(`/settings/key/${key}`),
};

export const employeesAPI = {
  // Get employees
  getEmployees: (page: number = 1, limit: number = 20, search?: string) =>
    api.get<PaginatedResponse>('/employees', {
      params: { page, limit, search }
    }),

  // Get employee by ID
  getEmployee: (id: string) =>
    api.get<ApiResponse>(`/employees/${id}`),

  // Get employee with user info
  getEmployeeWithUser: (id: string) =>
    api.get<ApiResponse>(`/employees/${id}/with-user`),

  // Create employee
  createEmployee: (data: any) =>
    api.post<ApiResponse>('/employees', data),

  // Update employee
  updateEmployee: (id: string, data: any) =>
    api.put<ApiResponse>(`/employees/${id}`, data),

  // Delete employee
  deleteEmployee: (id: string) =>
    api.delete<ApiResponse>(`/employees/${id}`),

  // Create employee account
  createEmployeeAccount: (id: string, data: { username: string; password: string; role: string }) =>
    api.post<ApiResponse>(`/employees/${id}/create-account`, data),
};

// Export warehouses API
export { warehousesAPI } from './warehousesApi';

// Export debts API
export { debtsAPI } from './debtsApi';

// Export support API
export { supportAPI } from './supportApi';

// Inventory Serial APIs
export const inventorySerialAPI = {
  listSerials: (params: { product_id?: string; status?: string; page?: number; limit?: number } = {}) =>
    api.get<ApiResponse>(`/inventory/serials`, { params }),

  getSummary: (product_id?: string) =>
    api.get<ApiResponse>(`/inventory/summary`, { params: { product_id } }),

  reconcile: (body: { product_id: string; observed_serials: string[]; apply?: boolean; reason?: string }) =>
    api.post<ApiResponse>(`/inventory/reconcile`, body),
};

export { api };
export default api;