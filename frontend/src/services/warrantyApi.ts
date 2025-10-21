import api from './api';

export const warrantyAPI = {
  // Get warranties list
  getWarranties: async (page: number = 1, limit: number = 12, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search) {
      params.append('search', search);
    }
    
    return api.get(`/warranties?${params.toString()}`);
  },

  // Get warranty by ID
  getWarrantyById: async (id: string) => {
    return api.get(`/warranties/${id}`);
  },

  // Create new warranty
  createWarranty: async (data: any) => {
    return api.post('/warranties', data);
  },

  // Update warranty
  updateWarranty: async (id: string, data: any) => {
    return api.put(`/warranties/${id}`, data);
  },

  // Delete warranty
  deleteWarranty: async (id: string) => {
    return api.delete(`/warranties/${id}`);
  },

  // Get warranty analytics
  getWarrantyAnalytics: async () => {
    return api.get('/warranties/analytics');
  },

  // Search warranties
  searchWarranties: async (query: string) => {
    return api.get(`/warranties/search?q=${encodeURIComponent(query)}`);
  },

  // Validate warranty code
  validateWarrantyCode: async (code: string) => {
    return api.get(`/warranties/validate/${code}`);
  },
};