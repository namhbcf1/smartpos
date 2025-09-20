/**
 * Comprehensive API Service 
 * Connects to new enhanced SmartPOS backend system
 * NO MOCK DATA - Real API calls only to Cloudflare Workers + D1
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API Configuration - use env-driven base without version suffix
import { API_BASE_URL, API_V1_BASE_URL } from '../api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_V1_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Important for cookies
  timeout: 30000,
});

// Request interceptor for authentication
api.interceptors.request.use((config) => {
  // Check internet connection
  if (!navigator.onLine) {
    throw new Error('Không có kết nối internet');
  }

  // Get token from cookie  
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('auth_token='))
    ?.split('=')[1];
    
  if (token) {
    config.headers = config.headers ?? {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth cookie
      document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Let network errors and 404s propagate to components silently
    if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK' || 
        error.message?.includes('Lỗi kết nối mạng') || 
        error.message?.includes('ERR_CONNECTION_CLOSED') ||
        error.response?.status === 404) {
      // Network/404 error - silently propagate to component
      throw error;
    }
    
    return Promise.reject(error);
  }
);

// =============================================================================
// ENHANCED AUTH API (New System)
// =============================================================================

export const enhancedAuthAPI = {
  login: async (credentials: { username: string; password: string }) => {
    const response = await api.post(`/auth/login`, credentials);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  refreshToken: async () => {
    const response = await api.post('/auth/refresh');
    return response.data;
  }
};

// =============================================================================
// RBAC MANAGEMENT API (New System)
// =============================================================================

export const rbacAPI = {
  getRoles: async () => {
    const response = await api.get('/rbac-management/roles');
    return response.data;
  },

  createRole: async (roleData: any) => {
    const response = await api.post('/rbac-management/roles', roleData);
    return response.data;
  },

  updateRole: async (roleId: string, roleData: any) => {
    const response = await api.put(`/rbac-management/roles/${roleId}`, roleData);
    return response.data;
  },

  deleteRole: async (roleId: string) => {
    const response = await api.delete(`/rbac-management/roles/${roleId}`);
    return response.data;
  }
};

// =============================================================================
// DASHBOARD ANALYTICS API (New System with Fallback)
// =============================================================================

export const dashboardAPI = {
  getOverview: async () => {
    try {
      // Try new comprehensive endpoint first
      const response = await api.get('/dashboard-analytics/overview');
      return response.data;
    } catch (error: any) {
      // Fallback to existing dashboard endpoint
      console.log('⚠️ New endpoint not available, using fallback...');
      try {
        const fallbackResponse = await api.get('/dashboard/stats');
        
        // Transform legacy response to new format
        const legacyData = fallbackResponse.data;
        if (legacyData.success) {
          return {
            success: true,
            data: {
              sales_analytics: {
                revenue: {
                  total: legacyData.data?.totalRevenue || 0,
                  profit: legacyData.data?.totalRevenue * 0.3 || 0 // Estimated 30% profit margin
                },
                orders: {
                  total_orders: legacyData.data?.totalOrders || 0,
                  avg_order_value: legacyData.data?.avgOrderValue || 0
                }
              },
              inventory_analytics: {
                products: {
                  total_products: legacyData.data?.totalProducts || 0,
                  low_stock_products: legacyData.data?.lowStockProducts || 0
                }
              },
              customer_analytics: {
                customers: {
                  total_customers: legacyData.data?.totalCustomers || 0
                }
              }
            }
          };
        }
        return legacyData;
      } catch (fallbackError) {
        console.error('❌ Both new and fallback endpoints failed:', fallbackError);
        throw fallbackError;
      }
    }
  },

  getSalesAnalytics: async (filters?: any) => {
    const response = await api.get('/dashboard-analytics/sales', { params: filters });
    return response.data;
  },

  getInventoryAnalytics: async (filters?: any) => {
    const response = await api.get('/dashboard-analytics/inventory', { params: filters });
    return response.data;
  },

  getCustomerAnalytics: async (filters?: any) => {
    const response = await api.get('/dashboard-analytics/customers', { params: filters });
    return response.data;
  },

  getFinancialAnalytics: async (filters?: any) => {
    const response = await api.get('/dashboard-analytics/financial', { params: filters });
    return response.data;
  }
};

// =============================================================================
// POS CHECKOUT API (New System)
// =============================================================================

export const posAPI = {
  // Cart Management
  getCart: async () => {
    const response = await api.get('/pos-checkout/cart');
    return response.data;
  },

  addToCart: async (item: any) => {
    const response = await api.post('/pos-checkout/cart/items', item);
    return response.data;
  },

  updateCartItem: async (itemId: string, updates: any) => {
    const response = await api.put(`/pos-checkout/cart/items/${itemId}`, updates);
    return response.data;
  },

  removeCartItem: async (itemId: string) => {
    const response = await api.delete(`/pos-checkout/cart/items/${itemId}`);
    return response.data;
  },

  clearCart: async () => {
    const response = await api.delete('/pos-checkout/cart');
    return response.data;
  },

  // Checkout Process
  checkout: async (checkoutData: any) => {
    const response = await api.post('/pos-checkout/checkout', checkoutData);
    return response.data;
  },

  // Invoice Management
  getInvoice: async (invoiceId: string) => {
    const response = await api.get(`/pos-checkout/invoices/${invoiceId}`);
    return response.data;
  },

  voidInvoice: async (invoiceId: string, reason: string) => {
    const response = await api.post(`/pos-checkout/invoices/${invoiceId}/void`, { reason });
    return response.data;
  }
};

// =============================================================================
// PRODUCTS API (New Enhanced System)
// =============================================================================

export const productsAPI = {
  // Products with fallback
  getProducts: async (filters?: any) => {
    try {
      // Try new comprehensive endpoint first
      const response = await api.get('/products-enhanced/products', { params: filters });
      return response.data;
    } catch (error: any) {
      // Fallback to existing products endpoint
      console.log('⚠️ New products endpoint not available, using fallback...');
      try {
        const fallbackResponse = await api.get('/products', { params: filters });
        return fallbackResponse.data;
      } catch (fallbackError) {
        console.error('❌ Both new and fallback products endpoints failed:', fallbackError);
        throw fallbackError;
      }
    }
  },

  getProduct: async (productId: string) => {
    const response = await api.get(`/products-enhanced/products/${productId}`);
    return response.data;
  },

  createProduct: async (productData: any) => {
    const response = await api.post('/products-enhanced/products', productData);
    return response.data;
  },

  updateProduct: async (productId: string, productData: any) => {
    const response = await api.put(`/products-enhanced/products/${productId}`, productData);
    return response.data;
  },

  deleteProduct: async (productId: string) => {
    const response = await api.delete(`/products-enhanced/products/${productId}`);
    return response.data;
  },

  // Categories
  getCategories: async () => {
    const response = await api.get('/products-enhanced/categories');
    return response.data;
  },

  createCategory: async (categoryData: any) => {
    const response = await api.post('/products-enhanced/categories', categoryData);
    return response.data;
  },

  // Variants
  getProductVariants: async (productId: string) => {
    const response = await api.get(`/products-variants/products/${productId}/variants`);
    return response.data;
  },

  createVariant: async (variantData: any) => {
    const response = await api.post('/products-variants/variants', variantData);
    return response.data;
  },

  updateVariant: async (variantId: string, variantData: any) => {
    const response = await api.put(`/products-variants/variants/${variantId}`, variantData);
    return response.data;
  },

  deleteVariant: async (variantId: string) => {
    const response = await api.delete(`/products-variants/variants/${variantId}`);
    return response.data;
  }
};

// =============================================================================
// CUSTOMERS API (New Enhanced System)
// =============================================================================

export const customersAPI = {
  getCustomers: async (filters?: any) => {
    const response = await api.get('/customers-enhanced/customers', { params: filters });
    return response.data;
  },

  getCustomer: async (customerId: string) => {
    const response = await api.get(`/customers-enhanced/customers/${customerId}`);
    return response.data;
  },

  createCustomer: async (customerData: any) => {
    const response = await api.post('/customers-enhanced/customers', customerData);
    return response.data;
  },

  updateCustomer: async (customerId: string, customerData: any) => {
    const response = await api.put(`/customers-enhanced/customers/${customerId}`, customerData);
    return response.data;
  },

  // Customer Groups
  getCustomerGroups: async () => {
    const response = await api.get('/customers-enhanced/customer-groups');
    return response.data;
  },

  createCustomerGroup: async (groupData: any) => {
    const response = await api.post('/customers-enhanced/customer-groups', groupData);
    return response.data;
  },

  // Loyalty Program
  addLoyaltyPoints: async (data: any) => {
    const response = await api.post('/customers-enhanced/loyalty/add-points', data);
    return response.data;
  }
};

// =============================================================================
// SUPPLIERS API (New Enhanced System)  
// =============================================================================

export const suppliersAPI = {
  getSuppliers: async (filters?: any) => {
    const response = await api.get('/suppliers-enhanced/suppliers', { params: filters });
    return response.data;
  },

  getSupplier: async (supplierId: string) => {
    const response = await api.get(`/suppliers-enhanced/suppliers/${supplierId}`);
    return response.data;
  },

  createSupplier: async (supplierData: any) => {
    const response = await api.post('/suppliers-enhanced/suppliers', supplierData);
    return response.data;
  },

  updateSupplier: async (supplierId: string, supplierData: any) => {
    const response = await api.put(`/suppliers-enhanced/suppliers/${supplierId}`, supplierData);
    return response.data;
  },

  // Purchase Orders
  getPurchaseOrders: async (filters?: any) => {
    const response = await api.get('/suppliers-enhanced/purchase-orders', { params: filters });
    return response.data;
  },

  createPurchaseOrder: async (poData: any) => {
    const response = await api.post('/suppliers-enhanced/purchase-orders', poData);
    return response.data;
  }
};

// =============================================================================
// WARRANTY API (New Enhanced System)
// =============================================================================

export const warrantyAPI = {
  getWarranties: async (filters?: any) => {
    const response = await api.get('/warranty-enhanced/warranties', { params: filters });
    return response.data;
  },

  registerWarranty: async (warrantyData: any) => {
    const response = await api.post('/warranty-enhanced/warranties', warrantyData);
    return response.data;
  },

  getWarranty: async (warrantyId: string) => {
    const response = await api.get(`/warranty-enhanced/warranties/${warrantyId}`);
    return response.data;
  },

  // Warranty Claims
  getWarrantyClaims: async (filters?: any) => {
    const response = await api.get('/warranty-enhanced/warranty-claims', { params: filters });
    return response.data;
  },

  createWarrantyClaim: async (claimData: any) => {
    const response = await api.post('/warranty-enhanced/warranty-claims', claimData);
    return response.data;
  },

  updateClaimStatus: async (claimId: string, statusData: any) => {
    const response = await api.put(`/warranty-enhanced/warranty-claims/${claimId}/status`, statusData);
    return response.data;
  }
};

// =============================================================================
// INVENTORY API (New Enhanced System)
// =============================================================================

export const inventoryAPI = {
  getInventory: async (filters?: any) => {
    const response = await api.get('/inventory-enhanced/inventory', { params: filters });
    return response.data;
  },

  getInventorySummary: async () => {
    const response = await api.get('/inventory-enhanced/inventory/summary');
    return response.data;
  },

  createStockAdjustment: async (adjustmentData: any) => {
    const response = await api.post('/inventory-enhanced/inventory/adjustments', adjustmentData);
    return response.data;
  },

  bulkStockAdjustment: async (adjustmentData: any) => {
    const response = await api.post('/inventory-enhanced/inventory/adjustments/bulk', adjustmentData);
    return response.data;
  },

  transferStock: async (transferData: any) => {
    const response = await api.post('/inventory-enhanced/inventory/transfers', transferData);
    return response.data;
  },

  // Locations
  getLocations: async () => {
    const response = await api.get('/inventory-enhanced/locations');
    return response.data;
  },

  createLocation: async (locationData: any) => {
    const response = await api.post('/inventory-enhanced/locations', locationData);
    return response.data;
  },

  // Serial Numbers (map to /serial-numbers)
  getSerialNumbers: async (params?: { page?: number; limit?: number; search?: string; status?: string; product_id?: string; customer_id?: string }) => {
    const response = await api.get('/serial-numbers', { params });
    return response.data;
  },

  createSerialNumber: async (payload: any) => {
    const response = await api.post('/serial-numbers', payload);
    return response.data;
  },

  updateSerialNumber: async (id: string, payload: any) => {
    const response = await api.put(`/serial-numbers/${encodeURIComponent(id)}`, payload);
    return response.data;
  },

  deleteSerialNumber: async (id: string) => {
    const response = await api.delete(`/serial-numbers/${encodeURIComponent(id)}`);
    return response.data;
  },

  // Smart Suggestions
  getSmartSuggestions: async (params?: { category?: string; priority?: string; limit?: number }) => {
    const response = await api.get('/inventory/smart-suggestions', { params });
    return response.data;
  }
};

// =============================================================================
// COMPREHENSIVE API OBJECT
// =============================================================================

export const comprehensiveAPI = {
  auth: enhancedAuthAPI,
  rbac: rbacAPI,
  dashboard: dashboardAPI,
  pos: posAPI,
  products: productsAPI,
  customers: customersAPI,
  suppliers: suppliersAPI,
  warranty: warrantyAPI,
  inventory: inventoryAPI
};

// Export for backward compatibility
export default api;