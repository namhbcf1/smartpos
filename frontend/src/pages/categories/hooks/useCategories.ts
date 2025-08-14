import { useState, useEffect } from 'react';
import api from '../../../services/api';

export interface Category {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  product_count?: number;
  created_at: string;
  updated_at: string;
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

      // Clean params - remove undefined values
      const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      console.log('Fetching categories with params:', cleanParams);

      const response = await api.get('/categories', {
        params: cleanParams,
        withCredentials: true,
      });

      console.log('Categories API response:', response.data);

      if (response.data.success) {
        // Categories API uses new format: { success: true, data: { data: [...], pagination: {...} } }
        if (response.data.data && response.data.data.data && Array.isArray(response.data.data.data)) {
          setData(response.data.data.data);
          setPagination(response.data.data.pagination || null);
        } else {
          // Fallback for unexpected format
          setData([]);
          setPagination(null);
        }
      } else {
        throw new Error(response.data.message || 'Failed to fetch categories');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Không thể tải danh sách danh mục');
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
