import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import apiClient from '../../services/api/client';
import { PageWrapper, Section, Grid, StatsCard } from '../../components/layout/MainLayout';
// Removed UI component imports - using DaisyUI instead
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
// Using simple icons to avoid import issues
const DollarIcon = () => <span className="text-2xl">💰</span>;
const CartIcon = () => <span className="text-2xl">🛒</span>;
const PackageIcon = () => <span className="text-2xl">📦</span>;
const UsersIcon = () => <span className="text-2xl">👥</span>;
const ChartIcon = () => <span className="text-2xl">📊</span>;
const StoreIcon = () => <span className="text-2xl">🏪</span>;
const StarIcon = () => <span className="text-2xl">⭐</span>;
import { formatCurrency } from '../../lib/utils';

// Simple Button component using DaisyUI classes
const Button = ({ children, onClick, variant = 'primary', size = 'md', className = '', ...props }: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  [key: string]: any;
}) => {
  const baseClasses = 'btn transition-all duration-200 ease-in-out';
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    glass: 'btn-glass'
  };
  const sizeClasses = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
    xl: 'btn-lg px-8 py-4 text-lg'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

// Simple Card component using DaisyUI classes
const Card = ({ children, className = '', onClick, ...props }: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  [key: string]: any;
}) => {
  return (
    <div
      className={`card bg-base-100 shadow-xl ${onClick ? 'cursor-pointer hover:shadow-2xl' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      <div className="card-body">
        {children}
      </div>
    </div>
  );
};

export function Dashboard() {
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();
  const [apiStatus, setApiStatus] = useState<string>('checking');
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0
  });

  // Define product table columns
  const productColumns = [
    {
      key: 'id',
      title: 'ID',
      sortable: true,
      width: '80px',
    },
    {
      key: 'name',
      title: 'Tên sản phẩm',
      sortable: true,
      render: (value: string) => (
        <div className="font-medium text-gray-900 dark:text-white">{value}</div>
      ),
    },
    {
      key: 'category_name',
      title: 'Danh mục',
      sortable: true,
      render: (value: string) => (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
          {value}
        </span>
      ),
    },
    {
      key: 'price',
      title: 'Giá',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => (
        <span className="font-bold text-green-600 dark:text-green-400">
          {formatCurrency(value)}
        </span>
      ),
    },
  ];

  useEffect(() => {
    // Test API connection
    const testAPI = async () => {
      try {
        await apiClient.get('/health');
        setApiStatus('connected');

        // Fetch products
        const productsResponse = await apiClient.get('/products');
        const productsData = productsResponse.data.data || [];
        setProducts(productsData);

        // Calculate stats
        setStats({
          totalSales: 15420000,
          totalOrders: 156,
          totalProducts: productsData.length,
          totalCustomers: 89
        });
      } catch (error) {
        setApiStatus('error');
        console.error('API connection failed:', error);
      }
    };

    if (isOnline) {
      testAPI();
    }
  }, [isOnline]);

  return (
    <div data-testid="app-container" className="p-6 space-y-6">
      {/* Enhanced Hero Section */}
      <div data-testid="hero-section" className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-5xl font-bold mb-4">
              ComputerPOS Pro
            </h1>
            <p className="text-xl mb-8 max-w-2xl">
              Hệ thống quản lý bán hàng thông minh với công nghệ đám mây,
              AI và analytics tiên tiến
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                variant="glass"
                size="xl"
                className="hover-glow"
                onClick={() => {
                  console.log('🔗 Navigating to POS...');
                  navigate('/pos');
                }}
              >
                <CartIcon />
                Bắt đầu bán hàng
                <StarIcon />
              </Button>
              <Button
                variant="outline"
                size="xl"
                className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                onClick={() => {
                  console.log('🔗 Navigating to Analytics...');
                  navigate('/analytics');
                }}
              >
                <ChartIcon />
                Analytics Dashboard
              </Button>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="w-48 h-48 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm">
              <div className="text-6xl"><StoreIcon /></div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Tổng quan hôm nay</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Dữ liệu thời gian thực được cập nhật mỗi phút</p>
        <div data-testid="stats-section" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Doanh thu</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalSales)}</p>
                <p className="text-sm text-green-600">+12.5%</p>
              </div>
              <DollarIcon />
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Đơn hàng</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalOrders}</p>
                <p className="text-sm text-green-600">+8.2%</p>
              </div>
              <CartIcon />
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sản phẩm</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalProducts}</p>
                <p className="text-sm text-green-600">+3.1%</p>
              </div>
              <PackageIcon />
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Khách hàng</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCustomers}</p>
                <p className="text-sm text-green-600">+15.3%</p>
              </div>
              <UsersIcon />
            </div>
          </Card>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
            <p className="text-gray-600 dark:text-gray-400">Phân tích chi tiết và xu hướng kinh doanh</p>
          </div>
          <Button
            variant="gradient"
            size="lg"
            onClick={() => {
              console.log('🔗 Navigating to Reports...');
              navigate('/reports');
            }}
          >
            <ChartIcon />
            Báo cáo chi tiết
          </Button>
        </div>
        <div data-testid="charts-section" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Xu hướng doanh thu</h3>
            <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <ChartIcon />
              <span className="ml-2">Chart Placeholder</span>
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Phân bố sản phẩm</h3>
            <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <ChartIcon />
              <span className="ml-2">Chart Placeholder</span>
            </div>
          </Card>
        </div>
      </div>

      {/* System Status */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Trạng thái hệ thống</h2>
        <div data-testid="system-status" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <StoreIcon />
              <h3 className="text-lg font-semibold">Cloudflare Workers</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">API Backend trên edge network</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <p className={`font-semibold ${
                  apiStatus === 'connected'
                    ? 'text-green-600'
                    : apiStatus === 'error'
                    ? 'text-red-600'
                    : 'text-yellow-600'
                }`}>
                  {apiStatus === 'connected' ? '✅ Connected' :
                   apiStatus === 'error' ? '❌ Error' : '🔄 Checking...'}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                apiStatus === 'connected' ? 'bg-green-400' :
                apiStatus === 'error' ? 'bg-red-400' : 'bg-yellow-400'
              }`}></div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <PackageIcon />
              <h3 className="text-lg font-semibold">Cloudflare D1</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Database SQLite trên edge</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sản phẩm</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{products.length}</p>
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <StoreIcon />
              <h3 className="text-lg font-semibold">Kết nối mạng</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Trạng thái kết nối internet</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <p className="text-2xl font-bold text-green-600">Online</p>
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </Card>
        </div>
      </div>

      {/* Products Preview */}
      {products.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Sản phẩm nổi bật</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.slice(0, 6).map((product: any, index: number) => (
              <Card key={product.id} className="p-6 hover:shadow-lg transition-shadow" data-testid="product-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <PackageIcon />
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full font-medium">
                    {product.category_name}
                  </span>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">
                  {product.name}
                </h4>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4">
                  {formatCurrency(product.price)}
                </p>
                <Button size="sm" className="w-full">
                  <CartIcon />
                  Thêm vào giỏ
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Thao tác nhanh</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            className="p-8 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
              console.log('🔗 Quick Action: Navigating to POS...');
              navigate('/pos');
            }}
          >
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                <CartIcon />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Tạo đơn hàng mới</h3>
                <p className="text-gray-600 dark:text-gray-400">Bắt đầu quy trình bán hàng</p>
              </div>
            </div>
          </Card>

          <Card
            className="p-8 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
              console.log('🔗 Quick Action: Navigating to Analytics...');
              navigate('/analytics');
            }}
          >
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                <ChartIcon />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Analytics Dashboard</h3>
                <p className="text-gray-600 dark:text-gray-400">Phân tích doanh thu và insights</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}


