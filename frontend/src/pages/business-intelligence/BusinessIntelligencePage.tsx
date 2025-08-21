import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Users, 
  ShoppingCart,
  BarChart3,
  PieChart,
  Activity,
  Target
} from 'lucide-react';

interface BusinessMetrics {
  revenue: {
    current: number;
    previous: number;
    growth: number;
  };
  orders: {
    current: number;
    previous: number;
    growth: number;
  };
  customers: {
    current: number;
    previous: number;
    growth: number;
  };
  products: {
    current: number;
    previous: number;
    growth: number;
  };
}

const BusinessIntelligencePage: React.FC = () => {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBusinessMetrics();
  }, []);

  const fetchBusinessMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data for now - replace with actual API call
      const mockData: BusinessMetrics = {
        revenue: { current: 125000000, previous: 98000000, growth: 27.6 },
        orders: { current: 1250, previous: 980, growth: 27.6 },
        customers: { current: 450, previous: 380, growth: 18.4 },
        products: { current: 2800, previous: 2650, growth: 5.7 }
      };
      
      setMetrics(mockData);
    } catch (err) {
      setError('Không thể tải dữ liệu phân tích kinh doanh');
      console.error('Error fetching business metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const MetricCard = ({ 
    title, 
    value, 
    previousValue, 
    growth, 
    icon, 
    formatter = formatNumber 
  }: {
    title: string;
    value: number;
    previousValue: number;
    growth: number;
    icon: React.ReactNode;
    formatter?: (val: number) => string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatter(value)}</div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          {growth > 0 ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span className={growth > 0 ? 'text-green-500' : 'text-red-500'}>
            {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
          </span>
          <span>so với tháng trước</span>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Phân tích kinh doanh</h1>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <Activity className="w-4 h-4 mr-1" />
            Pro Analytics
          </Badge>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu phân tích...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Phân tích kinh doanh</h1>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <Activity className="w-4 h-4 mr-1" />
            Pro Analytics
          </Badge>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-red-500 mb-4">⚠️</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchBusinessMetrics}>Thử lại</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Phân tích kinh doanh</h1>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <Activity className="w-4 h-4 mr-1" />
            Pro Analytics
          </Badge>
          <Button onClick={fetchBusinessMetrics} variant="outline">
            Làm mới dữ liệu
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Doanh thu"
            value={metrics.revenue.current}
            previousValue={metrics.revenue.previous}
            growth={metrics.revenue.growth}
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            formatter={formatCurrency}
          />
          <MetricCard
            title="Đơn hàng"
            value={metrics.orders.current}
            previousValue={metrics.orders.previous}
            growth={metrics.orders.growth}
            icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
          />
          <MetricCard
            title="Khách hàng"
            value={metrics.customers.current}
            previousValue={metrics.customers.previous}
            growth={metrics.customers.growth}
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
          />
          <MetricCard
            title="Sản phẩm"
            value={metrics.products.current}
            previousValue={metrics.products.previous}
            growth={metrics.products.growth}
            icon={<Package className="h-4 w-4 text-muted-foreground" />}
          />
        </div>
      )}

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Xu hướng doanh thu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Biểu đồ doanh thu sẽ hiển thị ở đây</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="w-5 h-5 mr-2" />
              Phân tích sản phẩm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <PieChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Biểu đồ phân tích sản phẩm sẽ hiển thị ở đây</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Thông tin chi tiết
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">📈 Tăng trưởng tốt</h3>
              <p className="text-sm text-green-700">
                Doanh thu tăng {metrics?.revenue.growth.toFixed(1)}% so với tháng trước
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">👥 Khách hàng mới</h3>
              <p className="text-sm text-blue-700">
                Có {metrics?.customers.current} khách hàng đang hoạt động
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">📦 Sản phẩm</h3>
              <p className="text-sm text-purple-700">
                Quản lý {metrics?.products.current} sản phẩm trong kho
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessIntelligencePage;
