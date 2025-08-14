import { useState, useEffect } from 'react';
import api from '../../../services/api';

export interface Sale {
  id: number;
  sale_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  total_amount: number;
  final_amount: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  payment_method: string;
  payment_status: string;
  sale_status: string;
  notes: string;
  cashier_name: string;
  sale_date: string;
  user_id: number;
  cashier_id: number;
  items_count: number;
}

interface UseSalesParams {
  page?: number;
  limit?: number;
  search?: string;
  payment_status?: string;
  payment_method?: string;
  sale_status?: string;
  user_id?: number;
  store_id?: number;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
  sort_by?: string;
  sort_order?: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UseSalesResult {
  data: Sale[];
  loading: boolean;
  error: string | null;
  pagination: Pagination | null;
  refetch: () => void;
}

/**
 * Dedicated hook for Sales page
 * Handles new API response format: { success: true, data: { data: [...], pagination: {...} } }
 */
export const useSales = (params: UseSalesParams = {}): UseSalesResult => {
  const [data, setData] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const fetchSales = async () => {
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

      console.log('Fetching sales with params:', cleanParams);

      const response = await api.get('/sales', {
        params: cleanParams,
        withCredentials: true,
      });

      console.log('Sales API response:', response.data);

      if (response.data.success) {
        // Sales API uses new format: { success: true, data: { data: [...], pagination: {...} } }
        if (response.data.data && response.data.data.data && Array.isArray(response.data.data.data)) {
          setData(response.data.data.data);
          setPagination(response.data.data.pagination || null);
        } else {
          // Fallback for unexpected format
          setData([]);
          setPagination(null);
        }
      } else {
        throw new Error(response.data.message || 'Failed to fetch sales');
      }
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError('Không thể tải danh sách đơn hàng');
      setData([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [JSON.stringify(params)]);

  return {
    data,
    loading,
    error,
    pagination,
    refetch: fetchSales,
  };
};
