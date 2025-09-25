// Robust Categories Service - Direct fetch implementation
export interface Category {
  id: string;
  name: string;
  description: string | null;
  is_active?: number;
  created_at?: string;
}

export interface CategoriesResponse {
  success: boolean;
  data: Category[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

const API_BASE_URL = 'https://namhbcf-api.bangachieu2.workers.dev/api';

export const categoriesService = {
  async getCategories(): Promise<CategoriesResponse> {
    try {
      console.log('🔍 CategoriesService: Fetching categories...');

      // Get auth token
      const token = sessionStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('🔐 CategoriesService: Token found');

      const { default: apiClient } = await import('./api/client');
      const res = await apiClient.get('/categories');
      return res?.data?.data || [];

    } catch (error) {
      console.error('💥 CategoriesService: Error:', error);
      throw error;
    }
  }
};