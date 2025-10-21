import api from './api';

export const promotionsAPI = {
  // Get promotions list
  getPromotions: async (page: number = 1, limit: number = 12, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search) {
      params.append('search', search);
    }
    
    return api.get(`/promotions?${params.toString()}`);
  },

  // Get promotion by ID
  getPromotionById: async (id: string) => {
    return api.get(`/promotions/${id}`);
  },

  // Create new promotion
  createPromotion: async (data: any) => {
    return api.post('/promotions', data);
  },

  // Update promotion
  updatePromotion: async (id: string, data: any) => {
    return api.put(`/promotions/${id}`, data);
  },

  // Delete promotion
  deletePromotion: async (id: string) => {
    return api.delete(`/promotions/${id}`);
  },

  // Get promotion analytics
  getPromotionAnalytics: async () => {
    return api.get('/promotions/analytics');
  },

  // Search promotions
  searchPromotions: async (query: string) => {
    return api.get(`/promotions/search?q=${encodeURIComponent(query)}`);
  },

  // Validate promotion code
  validatePromotionCode: async (code: string) => {
    return api.get(`/promotions/validate/${code}`);
  },
};