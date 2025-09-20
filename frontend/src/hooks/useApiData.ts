import { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import apiService from '../services/api/client';

// Hook for paginated data
export const usePaginatedQuery = <T>(
  endpoint: string,
  params: Record<string, any> = {}
) => {
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Clean params to remove undefined values
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== undefined)
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Add pagination params
        const allParams = {
          ...cleanParams,
          page: page.toString(),
          limit: limit.toString()
        };

        const queryString = new URLSearchParams(allParams).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;

        // AUTHENTICATION FIX: Use authenticated API service instead of raw axios
        const response = await apiService.get(url);

        // Handle API response format: response is already the data from apiService.get
        if (response && typeof response === 'object') {
          const responseData = response as any; // Type assertion for API response

          // Debug logging for employees endpoint (development only)
          if (process.env.NODE_ENV === 'development' && endpoint.includes('employees')) {
            console.log('🐛 usePaginatedQuery employees response:', responseData);
            console.log('🐛 responseData.data:', responseData.data);
            console.log('🐛 responseData.data.data:', responseData.data?.data);
          }

          // Check for API response structure: { data: { success: true, data: { data: [...], pagination: {...} } } }
          if (responseData.data && responseData.data.success && responseData.data.data && responseData.data.data.data && Array.isArray(responseData.data.data.data)) {
            // API format: { data: { success: true, data: { data: [...], pagination: {...} } } }
            if (process.env.NODE_ENV === 'development') {
              console.log('🐛 Using API format, data length:', responseData.data.data.data.length);
            }
            setData(responseData.data.data.data || []);
            setPagination(responseData.data.data.pagination || null);
          } else if (responseData.data && responseData.data.data && Array.isArray(responseData.data.data)) {
            // Nested format: { data: { data: [...], pagination: {...} } }
            if (process.env.NODE_ENV === 'development') {
              if (process.env.NODE_ENV === 'development') {
              console.log('🐛 Using nested format, data length:', responseData.data.data.length);
            }
            }
            setData(responseData.data.data || []);
            setPagination(responseData.data.pagination || null);
          } else if (responseData.data && Array.isArray(responseData.data)) {
            // Simple nested format: { data: [...] }
            console.log('🐛 Using simple nested format, data length:', responseData.data.length);
            setData(responseData.data || []);
            setPagination(responseData.pagination || null);
          } else if (Array.isArray(response)) {
            // Old format: direct array
            console.log('🐛 Using direct array format, data length:', response.length);
            setData(response || []);
            setPagination(null);
          } else {
            // Fallback: empty array
            console.log('🐛 Using fallback empty array');
            setData([]);
            setPagination(null);
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('🐛 Response is not object, using empty array');
          }
          setData([]);
          setPagination(null);
        }
      } catch (err) {
        // IMPROVED ERROR HANDLING: Distinguish between auth and data errors
        if (err instanceof AxiosError) {
          if (err.response?.status === 401) {
            setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          } else if (err.response?.status === 403) {
            setError('Bạn không có quyền truy cập dữ liệu này.');
          } else if (err.response?.status >= 500) {
            setError('Lỗi máy chủ. Vui lòng thử lại sau.');
          } else {
            setError('Không thể tải dữ liệu. Vui lòng thử lại.');
          }
        } else {
          setError('Không thể tải dữ liệu. Vui lòng kiểm tra kết nối mạng.');
        }

        setData([]);
        setPagination(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [endpoint, JSON.stringify(cleanParams), page, limit]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
  };

  const refetch = () => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const allParams = {
          ...cleanParams,
          page: page.toString(),
          limit: limit.toString()
        };

        const queryString = new URLSearchParams(allParams).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;

        // AUTHENTICATION FIX: Use authenticated API service instead of raw axios
        const response = await apiService.get(url);

        // Handle API response format: response is already the data from apiService.get
        if (response && typeof response === 'object') {
          const responseData = response as any; // Type assertion for API response

          // Check for API response structure: { data: { success: true, data: { data: [...], pagination: {...} } } }
          if (responseData.data && responseData.data.success && responseData.data.data && responseData.data.data.data && Array.isArray(responseData.data.data.data)) {
            // API format: { data: { success: true, data: { data: [...], pagination: {...} } } }
            setData(responseData.data.data.data || []);
            setPagination(responseData.data.data.pagination || null);
          } else if (responseData.data && responseData.data.data && Array.isArray(responseData.data.data)) {
            // Nested format: { data: { data: [...], pagination: {...} } }
            setData(responseData.data.data || []);
            setPagination(responseData.data.pagination || null);
          } else if (responseData.data && Array.isArray(responseData.data)) {
            // Simple nested format: { data: [...] }
            setData(responseData.data || []);
            setPagination(responseData.pagination || null);
          } else if (Array.isArray(response)) {
            // Old format: direct array
            setData(response || []);
            setPagination(null);
          } else {
            // Fallback: empty array
            setData([]);
            setPagination(null);
          }
        } else {
          setData([]);
          setPagination(null);
        }
      } catch (err) {

        // IMPROVED ERROR HANDLING: Distinguish between auth and data errors
        if (err instanceof AxiosError) {
          if (err.response?.status === 401) {
            setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          } else if (err.response?.status === 403) {
            setError('Bạn không có quyền truy cập dữ liệu này.');
          } else if (err.response?.status >= 500) {
            setError('Lỗi máy chủ. Vui lòng thử lại sau.');
          } else {
            setError('Không thể tải dữ liệu. Vui lòng thử lại.');
          }
        } else {
          setError('Không thể tải dữ liệu. Vui lòng kiểm tra kết nối mạng.');
        }

        setData([]);
        setPagination(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  };

  return {
    data,
    pagination,
    isLoading,
    error,
    refetch,
    handlePageChange,
    handleLimitChange,
    page,
    limit
  };
};

// Hook for single item query
export const useQuery = <T>(endpoint: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // AUTHENTICATION FIX: Use authenticated API service instead of raw axios
        const response = await apiService.get<T>(endpoint);
        setData(response);
      } catch (err) {
        console.error('❌ useQuery: Error fetching data:', err);

        // IMPROVED ERROR HANDLING: Distinguish between auth and data errors
        if (err instanceof AxiosError) {
          if (err.response?.status === 401) {
            setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          } else if (err.response?.status === 403) {
            setError('Bạn không có quyền truy cập dữ liệu này.');
          } else if (err.response?.status >= 500) {
            setError('Lỗi máy chủ. Vui lòng thử lại sau.');
          } else {
            setError('Không thể tải dữ liệu. Vui lòng thử lại.');
          }
        } else {
          setError('Không thể tải dữ liệu. Vui lòng kiểm tra kết nối mạng.');
        }

        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint]);

  return { data, loading, error };
};

// Hook for mutations (create, update, delete)
export const useMutation = <T, R = any>() => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (data: T, method: 'post' | 'put' | 'patch' | 'delete' = 'post', endpoint?: string): Promise<R | null> => {
    try {
      setLoading(true);
      setError(null);

      const { API_V1_BASE_URL } = await import('../services/api');
      const fullUrl = `${API_V1_BASE_URL}${endpoint || ''}`;

      let response: any;
      switch (method) {
        case 'post':
          response = await axios.post(fullUrl, data, {
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            withCredentials: true,
          });
          break;
        case 'put':
          response = await axios.put(fullUrl, data, {
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            withCredentials: true,
          });
          break;
        case 'patch':
          response = await axios.patch(fullUrl, data, {
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            withCredentials: true,
          });
          break;
        case 'delete':
          response = await axios.delete(fullUrl, {
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            withCredentials: true,
          });
          break;
        default:
          throw new Error('Invalid method');
      }

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Request failed');
      }
    } catch (err) {
      setError('Có lỗi xảy ra');
      console.error('Error in mutation:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
};

// Hook for delete mutation
export const useDeleteMutation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteItem = async (endpoint: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Use authenticated API client instead of raw axios
      const apiClient = (await import('../services/api/client')).default;
      const response = await apiClient.delete(endpoint);

      if (response.data.success) {
        return true;
      } else {
        throw new Error(response.data.message || 'Delete failed');
      }
    } catch (err) {
      setError('Không thể xóa dữ liệu');
      console.error('Error deleting item:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { deleteItem, loading, error };
};

// Hook for create mutation
export const useCreateMutation = <T, R = any>() => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (endpoint: string, data: T): Promise<R | null> => {
    try {
      setLoading(true);
      setError(null);

      // Use authenticated API client instead of raw axios
      const apiClient = (await import('../services/api/client')).default;
      const response = await apiClient.post(endpoint, data);

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Create failed');
      }
    } catch (err) {
      setError('Không thể tạo dữ liệu');
      console.error('Error creating item:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
};

// Hook for update mutation
export const useUpdateMutation = <T, R = any>() => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async (endpoint: string, data: T): Promise<R | null> => {
    try {
      setLoading(true);
      setError(null);

      // Use authenticated API client instead of raw axios
      const apiClient = (await import('../services/api/client')).default;
      const response = await apiClient.put(endpoint, data);

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
    } catch (err) {
      setError('Không thể cập nhật dữ liệu');
      console.error('Error updating item:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { update, loading, error };
};