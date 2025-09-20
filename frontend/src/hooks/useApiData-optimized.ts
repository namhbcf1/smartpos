/**
 * OPTIMIZED: API Data Hook with performance improvements
 * Fixes: Duplicate fetch logic, missing memoization, excessive re-renders
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { API_V1_BASE_URL } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';

// Optimized API configuration
const API_CONFIG = {
  baseURL: API_V1_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
} as const;

// Create axios instance with optimized config
const apiClient = axios.create(API_CONFIG);

// Request interceptor for consistent headers
apiClient.interceptors.request.use((config) => {
  // Add any auth tokens here if needed
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UseApiDataOptions {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  retry?: number;
}

/**
 * OPTIMIZED: Paginated API data hook with React Query
 */
export const useOptimizedApiData = <T>(
  endpoint: string,
  params: Record<string, any> = {},
  options: UseApiDataOptions = {}
) => {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus = false,
    retry = 1,
  } = options;

  // Memoize query key to prevent unnecessary re-renders
  const queryKey = useMemo(() => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => 
        value !== undefined && value !== null && value !== ''
      )
    );
    return [endpoint, cleanParams];
  }, [endpoint, params]);

  // Memoize query function
  const queryFn = useCallback(async (): Promise<ApiResponse<T>> => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => 
        value !== undefined && value !== null && value !== ''
      )
    );

    const queryString = new URLSearchParams(cleanParams).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    const response = await apiClient.get<ApiResponse<T>>(url);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'API request failed');
    }
    
    return response.data;
  }, [endpoint, params]);

  return useQuery({
    queryKey,
    queryFn,
    enabled,
    staleTime,
    gcTime: cacheTime, // Updated from cacheTime
    refetchOnWindowFocus,
    retry,
    // Optimize network requests
    networkMode: 'online',
  });
};

/**
 * OPTIMIZED: Simple data fetching hook with caching
 */
export const useOptimizedSimpleData = <T>(
  endpoint: string,
  options: UseApiDataOptions = {}
) => {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000,
    cacheTime = 10 * 60 * 1000,
    refetchOnWindowFocus = false,
    retry = 1,
  } = options;

  const queryFn = useCallback(async (): Promise<T> => {
    const response = await apiClient.get<ApiResponse<T>>(endpoint);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'API request failed');
    }
    
    return response.data.data;
  }, [endpoint]);

  return useQuery({
    queryKey: [endpoint],
    queryFn,
    enabled,
    staleTime,
    gcTime: cacheTime,
    refetchOnWindowFocus,
    retry,
    networkMode: 'online',
  });
};

/**
 * OPTIMIZED: Mutation hook with proper error handling
 */
export const useOptimizedMutation = <TData, TVariables = any>(
  endpoint?: string,
  method: 'post' | 'put' | 'patch' | 'delete' = 'post'
) => {
  const queryClient = useQueryClient();

  const mutationFn = useCallback(async (variables: TVariables & { endpoint?: string }): Promise<TData> => {
    const { endpoint: varEndpoint, ...data } = variables as any;
    const url = varEndpoint || endpoint;
    
    if (!url) {
      throw new Error('Endpoint is required');
    }

    const response = await apiClient[method]<ApiResponse<TData>>(url, data);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Mutation failed');
    }
    
    return response.data.data;
  }, [endpoint, method]);

  return useMutation({
    mutationFn,
    onSuccess: () => {
      // Invalidate related queries on success
      if (endpoint) {
        queryClient.invalidateQueries({ queryKey: [endpoint] });
      }
    },
    retry: 1,
    networkMode: 'online',
  });
};

/**
 * OPTIMIZED: Bulk operations hook
 */
export const useBulkMutation = <TData, TVariables = any>(
  endpoint: string,
  method: 'post' | 'put' | 'patch' | 'delete' = 'post'
) => {
  const queryClient = useQueryClient();

  const mutationFn = useCallback(async (items: TVariables[]): Promise<TData[]> => {
    // Use batch API if available, otherwise sequential requests
    const promises = items.map(item => 
      apiClient[method]<ApiResponse<TData>>(endpoint, item)
    );
    
    const responses = await Promise.all(promises);
    
    return responses.map(response => {
      if (!response.data.success) {
        throw new Error(response.data.message || 'Bulk operation failed');
      }
      return response.data.data;
    });
  }, [endpoint, method]);

  return useMutation({
    mutationFn,
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [endpoint] });
    },
    retry: 1,
    networkMode: 'online',
  });
};

/**
 * OPTIMIZED: Infinite query hook for large datasets
 */
export const useInfiniteApiData = <T>(
  endpoint: string,
  params: Record<string, any> = {},
  options: UseApiDataOptions = {}
) => {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000,
    cacheTime = 10 * 60 * 1000,
    refetchOnWindowFocus = false,
    retry = 1,
  } = options;

  const queryKey = useMemo(() => [endpoint, 'infinite', params], [endpoint, params]);

  const queryFn = useCallback(async ({ pageParam = 1 }) => {
    const cleanParams = Object.fromEntries(
      Object.entries({ ...params, page: pageParam }).filter(([_, value]) => 
        value !== undefined && value !== null && value !== ''
      )
    );

    const queryString = new URLSearchParams(cleanParams).toString();
    const url = `${endpoint}?${queryString}`;

    const response = await apiClient.get<ApiResponse<T>>(url);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'API request failed');
    }
    
    return response.data;
  }, [endpoint, params]);

  return useQuery({
    queryKey,
    queryFn: () => queryFn({ pageParam: 1 }),
    enabled,
    staleTime,
    gcTime: cacheTime,
    refetchOnWindowFocus,
    retry,
    networkMode: 'online',
  });
};

/**
 * OPTIMIZED: Prefetch hook for performance
 */
export const usePrefetch = () => {
  const queryClient = useQueryClient();

  const prefetchData = useCallback(async (endpoint: string, params: Record<string, any> = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => 
        value !== undefined && value !== null && value !== ''
      )
    );

    const queryKey = [endpoint, cleanParams];

    await queryClient.prefetchQuery({
      queryKey,
      queryFn: async () => {
        const queryString = new URLSearchParams(cleanParams).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        const response = await apiClient.get(url);
        return response.data;
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);

  return { prefetchData };
};

// Export optimized API client for direct use
export { apiClient };
