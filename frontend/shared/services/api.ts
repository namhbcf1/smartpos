// Shared API service for SmartPOS applications

import { ApiResponse, Product, CartItem, Order, Customer, Category, Supplier, StockTransaction, ProductFilters, InventoryFilters } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://smartpos-api-bangachieu2.bangachieu2.workers.dev/api/v1';

// Generic API fetch function
export const fetchAPI = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    };

    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// Product API functions
export const getProducts = async (filters?: ProductFilters): Promise<ApiResponse<Product[]>> => {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
  }

  return fetchAPI<Product[]>(`/products?${params.toString()}`);
};

export const getProduct = async (id: number): Promise<ApiResponse<Product>> => {
  return fetchAPI<Product>(`/products/${id}`);
};

export const createProduct = async (product: Partial<Product>): Promise<ApiResponse<Product>> => {
  return fetchAPI<Product>('/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
};

export const updateProduct = async (id: number, product: Partial<Product>): Promise<ApiResponse<Product>> => {
  return fetchAPI<Product>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  });
};

export const deleteProduct = async (id: number): Promise<ApiResponse<void>> => {
  return fetchAPI<void>(`/products/${id}`, {
    method: 'DELETE',
  });
};

// Order API functions
export const createOrder = async (order: Partial<Order>): Promise<ApiResponse<Order>> => {
  return fetchAPI<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  });
};

export const getOrders = async (page = 1, limit = 20): Promise<ApiResponse<Order[]>> => {
  return fetchAPI<Order[]>(`/orders?page=${page}&limit=${limit}`);
};

export const getOrder = async (id: number): Promise<ApiResponse<Order>> => {
  return fetchAPI<Order>(`/orders/${id}`);
};

// Customer API functions
export const getCustomers = async (page = 1, limit = 20): Promise<ApiResponse<Customer[]>> => {
  return fetchAPI<Customer[]>(`/customers?page=${page}&limit=${limit}`);
};

export const getCustomer = async (id: number): Promise<ApiResponse<Customer>> => {
  return fetchAPI<Customer>(`/customers/${id}`);
};

export const createCustomer = async (customer: Partial<Customer>): Promise<ApiResponse<Customer>> => {
  return fetchAPI<Customer>('/customers', {
    method: 'POST',
    body: JSON.stringify(customer),
  });
};

// Category API functions
export const getCategories = async (): Promise<ApiResponse<Category[]>> => {
  return fetchAPI<Category[]>('/categories');
};

export const createCategory = async (category: Partial<Category>): Promise<ApiResponse<Category>> => {
  return fetchAPI<Category>('/categories', {
    method: 'POST',
    body: JSON.stringify(category),
  });
};

// Supplier API functions
export const getSuppliers = async (page = 1, limit = 20): Promise<ApiResponse<Supplier[]>> => {
  return fetchAPI<Supplier[]>(`/suppliers?page=${page}&limit=${limit}`);
};

export const createSupplier = async (supplier: Partial<Supplier>): Promise<ApiResponse<Supplier>> => {
  return fetchAPI<Supplier>('/suppliers', {
    method: 'POST',
    body: JSON.stringify(supplier),
  });
};

// Inventory API functions
export const getStockTransactions = async (filters?: InventoryFilters): Promise<ApiResponse<StockTransaction[]>> => {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
  }

  return fetchAPI<StockTransaction[]>(`/inventory/transactions?${params.toString()}`);
};

export const createStockTransaction = async (transaction: Partial<StockTransaction>): Promise<ApiResponse<StockTransaction>> => {
  return fetchAPI<StockTransaction>('/inventory/transactions', {
    method: 'POST',
    body: JSON.stringify(transaction),
  });
};

// Auth API functions
export const login = async (username: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> => {
  return fetchAPI<{ token: string; user: any }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
};

export const logout = async (): Promise<ApiResponse<void>> => {
  return fetchAPI<void>('/auth/logout', {
    method: 'POST',
  });
};

export const getCurrentUser = async (): Promise<ApiResponse<any>> => {
  return fetchAPI<any>('/auth/me');
};

// Utility functions
export const searchProducts = async (query: string): Promise<ApiResponse<Product[]>> => {
  return fetchAPI<Product[]>(`/products?search=${encodeURIComponent(query)}&limit=10`);
};

export const getLowStockProducts = async (): Promise<ApiResponse<Product[]>> => {
  return fetchAPI<Product[]>('/products?low_stock_only=true');
};

export const getProductAnalytics = async (productId: number): Promise<ApiResponse<any>> => {
  return fetchAPI<any>(`/analytics/products/${productId}`);
};
