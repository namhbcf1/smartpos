import api from './api';

export const suppliersAPI = {
  // Get suppliers list
  getSuppliers: async (page: number = 1, limit: number = 12, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search) {
      params.append('search', search);
    }
    
    return api.get(`/suppliers?${params.toString()}`);
  },

  // Get supplier by ID
  getSupplierById: async (id: string) => {
    return api.get(`/suppliers/${id}`);
  },

  // Create new supplier
  createSupplier: async (data: any) => {
    return api.post('/suppliers', data);
  },

  // Update supplier
  updateSupplier: async (id: string, data: any) => {
    return api.put(`/suppliers/${id}`, data);
  },

  // Delete supplier
  deleteSupplier: async (id: string) => {
    return api.delete(`/suppliers/${id}`);
  },

  // Get supplier analytics
  getSupplierAnalytics: async () => {
    return api.get('/suppliers/analytics');
  },

  // Search suppliers
  searchSuppliers: async (query: string) => {
    return api.get(`/suppliers/search?q=${encodeURIComponent(query)}`);
  },
};