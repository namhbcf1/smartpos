/**
 * OPTIMIZED API Data Hooks
 * Refactored from 400 lines to ~200 lines with proper TypeScript types
 * Removed console.log statements and improved error handling
 */

import { useState, useEffect, useCallback } from 'react';
import { AxiosError } from 'axios';
import apiService from '../services/api';

// Proper TypeScript interfaces
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UsePaginatedQueryReturn<T> {
  data: T[];
  pagination: PaginatedResponse<T>['pagination'] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  handlePageChange: (page: number) => void;
  handleLimitChange: (limit: number) => void;
  page: number;
  limit: number;
}

interface UseQueryReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseMutationReturn<T, R> {
  mutate: (data: T, method?: 'post' | 'put' | 'patch' | 'delete', endpoint?: string) => Promise<R | null>;
  loading: boolean;
  error: string | null;
}

// Helper function to handle API errors
const handleApiError = (err: unknown): string => {
  if (err instanceof AxiosError) {
    const status = err.response?.status;
    if (status === 401) {
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    } else if (status === 403) {
      return 'Bạn không có quyền truy cập dữ liệu này.';
    } else if (status && status >= 500) {
      return 'Lỗi máy chủ. Vui lòng thử lại sau.';
    }
  }
  return 'Không thể tải dữ liệu. Vui lòng thử lại.';
};

// Hook for paginated data with proper typing
export const usePaginatedQuery = <T>(
  endpoint: string,
  params: Record<string, string | number | boolean> = {}
): UsePaginatedQueryReturn<T> => {
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<T>['pagination'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const allParams = { ...params, page, limit };
      const cleanParams = Object.entries(allParams).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string | number | boolean>);

      const queryString = new URLSearchParams(
        Object.entries(cleanParams).map(([key, value]) => [key, String(value)])
      ).toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;

      const response = await apiService.get<ApiResponse<PaginatedResponse<T> | T[]>>(url);

      if (response && typeof response === 'object') {
        const responseData = response as ApiResponse<PaginatedResponse<T> | T[]>;
        
        if (Array.isArray(responseData.data)) {
          // Old format: direct array
          setData(responseData.data);
          setPagination(null);
        } else if (responseData.data && 'data' in responseData.data) {
          // New format: paginated response
          const paginatedData = responseData.data as PaginatedResponse<T>;
          setData(paginatedData.data || []);
          setPagination(paginatedData.pagination || null);
        } else {
          setData([]);
          setPagination(null);
        }
      } else {
        setData([]);
        setPagination(null);
      }
    } catch (err) {
      setError(handleApiError(err));
      setData([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, params, page, limit]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    pagination,
    isLoading,
    error,
    refetch: fetchData,
    handlePageChange,
    handleLimitChange,
    page,
    limit,
  };
};

// Hook for single data queries
export const useQuery = <T>(endpoint: string): UseQueryReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.get<ApiResponse<T>>(endpoint);
      
      if (response && typeof response === 'object') {
        const responseData = response as ApiResponse<T>;
        setData(responseData.data || null);
      } else {
        setData(null);
      }
    } catch (err) {
      setError(handleApiError(err));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
};

// Hook for mutations (create, update, delete)
export const useMutation = <T, R = T>(): UseMutationReturn<T, R> => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (
    data: T,
    method: 'post' | 'put' | 'patch' | 'delete' = 'post',
    endpoint?: string
  ): Promise<R | null> => {
    try {
      setLoading(true);
      setError(null);

      if (!endpoint) {
        throw new Error('Endpoint is required for mutation');
      }

      let response: ApiResponse<R>;

      switch (method) {
        case 'post':
          response = await apiService.post<ApiResponse<R>>(endpoint, data);
          break;
        case 'put':
          response = await apiService.put<ApiResponse<R>>(endpoint, data);
          break;
        case 'patch':
          response = await apiService.patch<ApiResponse<R>>(endpoint, data);
          break;
        case 'delete':
          response = await apiService.delete<ApiResponse<R>>(endpoint);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      if (response && typeof response === 'object') {
        const responseData = response as ApiResponse<R>;
        return responseData.data || null;
      }
      
      return null;
    } catch (err) {
      setError(handleApiError(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
};

// Specialized hooks for common operations
export const useCreate = <T, R = T>() => {
  const { mutate, loading, error } = useMutation<T, R>();
  
  const create = useCallback(async (endpoint: string, data: T): Promise<R | null> => {
    return mutate(data, 'post', endpoint);
  }, [mutate]);

  return { create, loading, error };
};

export const useUpdate = <T, R = T>() => {
  const { mutate, loading, error } = useMutation<T, R>();
  
  const update = useCallback(async (endpoint: string, data: T): Promise<R | null> => {
    return mutate(data, 'put', endpoint);
  }, [mutate]);

  return { update, loading, error };
};

export const useDelete = () => {
  const { mutate, loading, error } = useMutation<never, boolean>();
  
  const deleteItem = useCallback(async (endpoint: string): Promise<boolean> => {
    const result = await mutate(undefined as never, 'delete', endpoint);
    return result !== null;
  }, [mutate]);

  return { delete: deleteItem, loading, error };
};
