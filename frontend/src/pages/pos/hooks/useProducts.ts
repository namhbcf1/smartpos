import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Product } from '../../../types/unified';

interface UseProductsParams {
  search?: string;
  category_id?: number;
  in_stock_only?: boolean;
  sort_by?: string;
  sort_order?: string;
  limit?: number;
}

interface UseProductsResult {
  data: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Dedicated hook for POS/NewSaleSimple page
 * Handles both old and new API response formats
 */
export const useProducts = (params: UseProductsParams = {}): UseProductsResult => {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Clean params - remove undefined values
      const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string | number | boolean>);

      // Fetch products with cleaned parameters
      const response = await api.get<{
        success: boolean;
        data: Product[] | { data: Product[]; pagination?: any };
        message?: string;
      }>('/products', {
        params: cleanParams,
        withCredentials: true,
      });

      if (response.data.success) {
        let rawProducts: Product[] = [];

        // Handle both old and new API response formats
        if (response.data.data && typeof response.data.data === 'object') {
          if (Array.isArray(response.data.data)) {
            // Old format: { success: true, data: [...] }
            rawProducts = response.data.data;
          } else if (response.data.data.data && Array.isArray(response.data.data.data)) {
            // New format: { success: true, data: { data: [...], pagination: {...} } }
            rawProducts = response.data.data.data;
          } else {
            // Unexpected data format - set empty array
            rawProducts = [];
          }
        } else {
          // No data in response - set empty array
          rawProducts = [];
        }

        // Map API response fields to frontend interface
        const products: Product[] = rawProducts.map((item: Product) => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          barcode: item.barcode,
          price: item.price,
          cost_price: item.costPrice || item.cost_price || 0,
          stock: item.stockQuantity || item.stock_quantity || 0,
          min_stock: item.stockAlertThreshold || item.min_stock || 0,
          category_id: item.categoryId || item.category_id || 0,
          category_name: item.categoryName || item.category_name,
          image_url: item.imageUrl || item.image_url,
          is_active: item.isActive !== undefined ? item.isActive : (item.is_active !== undefined ? item.is_active : true),
          brand: item.brand,
          description: item.description,
          discount_eligible: item.discount_eligible || false
        }));

        // Ensure we always have an array
        setData(Array.isArray(products) ? products : []);
      } else {
        // API returned success: false - set empty array to avoid blocking UI
        setData([]);
      }
    } catch (err) {
      setError('Không thể tải danh sách sản phẩm');
      setData([]); // Ensure we always have an array
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [JSON.stringify(params)]);

  return {
    data,
    loading,
    error,
    refetch: fetchProducts,
  };
};
