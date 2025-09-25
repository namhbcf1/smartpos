import { useState, useEffect } from 'react';
import { categoriesService, Category as ServiceCategory } from '../../../services/categoriesService';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  is_active?: number;
  product_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface UseCategoriesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort_by?: string;
  sort_order?: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UseCategoriesResult {
  data: Category[];
  loading: boolean;
  error: string | null;
  pagination: Pagination | null;
  refetch: () => void;
}

/**
 * Dedicated hook for Categories page
 * Handles new API response format: { success: true, data: { data: [...], pagination: {...} } }
 */
export const useCategories = (params: UseCategoriesParams = {}): UseCategoriesResult => {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 UseCategories: Starting fetch with params:', params);

      // Use the robust categories service
      const response = await categoriesService.getCategories();

      console.log('✅ UseCategories: Service response:', response);

      if (response.success && Array.isArray(response.data)) {
        console.log('✅ UseCategories: Setting', response.data.length, 'categories');
        setData(response.data);
        setPagination(response.pagination || null);
      } else {
        console.error('❌ UseCategories: Invalid response format');
        setData([]);
        setPagination(null);
        setError('Invalid response format from server');
      }
    } catch (err: any) {
      console.error('💥 UseCategories: Error:', err);
      setError(`Không thể tải danh sách danh mục: ${err.message || err}`);
      setData([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [JSON.stringify(params)]);

  return {
    data,
    loading,
    error,
    pagination,
    refetch: fetchCategories,
  };
};
