import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

interface SalesData {
  name: string;
  value: number;
}

interface CategoryData {
  name: string;
  value: number;
}

interface DashboardStats {
  todaySales: number;
  weekSales: number;
  todayOrders: number;
  weekOrders: number;
  lowStockCount: number;
  productCount: number;
  categoryCount: number;
  salesChart: SalesData[];
  trendPercent: number;
  pendingOrders: number;
  customerCount: number;
  topProducts: TopProductData[];
  salesByCategory: CategoryData[];
}

interface TopProductData {
  id: number;
  name: string;
  quantity: number;
  total: number;
  image?: string;
}

interface RecentSale {
  id: number;
  receipt_number: string;
  final_amount: number;
  payment_method: string;
  customer_name?: string;
  created_at: string;
  items_count: number;
}

interface LowStockProduct {
  id: number;
  name: string;
  stock: number;
  min_stock: number;
  category_name?: string;
}

interface UseDashboardDataReturn {
  stats: DashboardStats | null;
  recentSales: RecentSale[];
  lowStockProducts: LowStockProduct[];
  aiInsights: string[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useDashboardData = (timePeriod: string = 'week'): UseDashboardDataReturn => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AI-Powered Insights Generator
  const generateAIInsights = useCallback((data: DashboardStats): string[] => {
    const insights: string[] = [];
    
    if (data.trendPercent > 20) {
      insights.push(`🚀 Doanh thu tăng ${data.trendPercent.toFixed(1)}% - xu hướng tích cực!`);
    } else if (data.trendPercent < -10) {
      insights.push(`⚠️ Doanh thu giảm ${Math.abs(data.trendPercent).toFixed(1)}% - cần xem xét chiến lược`);
    }
    
    if (data.lowStockCount > 0) {
      insights.push(`📦 Có ${data.lowStockCount} sản phẩm sắp hết hàng - cần nhập thêm`);
    }
    
    if (data.pendingOrders > 5) {
      insights.push(`⏰ Có ${data.pendingOrders} đơn hàng đang chờ xử lý`);
    }
    
    // Analyze top products
    if (data.topProducts.length > 0) {
      const topProduct = data.topProducts[0];
      insights.push(`🏆 Sản phẩm bán chạy nhất: ${topProduct.name} (${topProduct.quantity} đã bán)`);
    }
    
    // Analyze sales by category
    if (data.salesByCategory.length > 0) {
      const topCategory = data.salesByCategory.reduce((prev, current) => 
        prev.value > current.value ? prev : current
      );
      insights.push(`📊 Danh mục bán chạy nhất: ${topCategory.name}`);
    }
    
    return insights;
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard stats
      const statsResponse = await api.get<DashboardStats>(`/dashboard/stats?period=${timePeriod}`);
      
      if (statsResponse) {
        setStats(statsResponse);
        setAiInsights(generateAIInsights(statsResponse));
      }

      // Fetch recent sales
      const salesResponse = await api.get<RecentSale[]>('/sales?limit=10&sort=created_at:desc');
      if (salesResponse) {
        setRecentSales(Array.isArray(salesResponse) ? salesResponse : []);
      }

      // Fetch low stock products
      const lowStockResponse = await api.get<LowStockProduct[]>('/products/low-stock?limit=10');
      if (lowStockResponse) {
        setLowStockProducts(Array.isArray(lowStockResponse) ? lowStockResponse : []);
      }

    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError('Không thể tải dữ liệu dashboard');
      
      // Set fallback data to prevent UI blocking
      setStats(null);
      setRecentSales([]);
      setLowStockProducts([]);
      setAiInsights(['Đang kết nối tới cơ sở dữ liệu...']);
    } finally {
      setLoading(false);
    }
  }, [timePeriod, generateAIInsights]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    stats,
    recentSales,
    lowStockProducts,
    aiInsights,
    loading,
    error,
    refetch: fetchDashboardData,
  };
};
