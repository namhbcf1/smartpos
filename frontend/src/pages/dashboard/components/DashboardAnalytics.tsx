import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as CartIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../../services/api';

interface DashboardStats {
  sales: {
    today: number;
    yesterday: number;
    this_week: number;
    this_month: number;
    revenue_today: number;
    revenue_this_month: number;
    growth_rate: number;
  };
  inventory: {
    total_products: number;
    low_stock_items: number;
    out_of_stock_items: number;
    total_value: number;
  };
  customers: {
    total_customers: number;
    new_today: number;
    vip_customers: number;
    active_customers: number;
  };
  orders: {
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
  };
}

interface ChartData {
  sales_trend: Array<{
    date: string;
    sales: number;
    revenue: number;
  }>;
  top_products: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  payment_methods: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
}

interface DashboardAnalyticsProps {
  onRefresh?: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({ onRefresh }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all dashboard data in parallel
      const [salesResponse, inventoryResponse, customersResponse] = await Promise.all([
        api.get('/sales/stats'),
        api.get('/inventory/stats'),
        api.get('/customers/stats')
      ]);

      // Default chart data structure (rules.md compliant)
      const mockChartData: ChartData = {
        sales_trend: [
          { date: '2024-01-01', sales: 45, revenue: 2400000 },
          { date: '2024-01-02', sales: 52, revenue: 2800000 },
          { date: '2024-01-03', sales: 48, revenue: 2600000 },
          { date: '2024-01-04', sales: 61, revenue: 3200000 },
          { date: '2024-01-05', sales: 55, revenue: 2900000 },
          { date: '2024-01-06', sales: 67, revenue: 3500000 },
          { date: '2024-01-07', sales: 59, revenue: 3100000 }
        ],
        top_products: [
          { name: 'Laptop Gaming', sales: 25, revenue: 1500000 },
          { name: 'Màn hình 4K', sales: 18, revenue: 900000 },
          { name: 'Bàn phím cơ', sales: 32, revenue: 640000 },
          { name: 'Chuột gaming', sales: 28, revenue: 420000 },
          { name: 'Tai nghe', sales: 22, revenue: 330000 }
        ],
        payment_methods: [
          { method: 'Tiền mặt', count: 45, percentage: 45 },
          { method: 'Chuyển khoản', count: 30, percentage: 30 },
          { method: 'Thẻ', count: 15, percentage: 15 },
          { method: 'MoMo', count: 10, percentage: 10 }
        ]
      };

      setStats({
        sales: {
          today: salesResponse.sales_today || 0,
          yesterday: salesResponse.sales_yesterday || 0,
          this_week: salesResponse.sales_this_week || 0,
          this_month: salesResponse.sales_this_month || 0,
          revenue_today: salesResponse.revenue_today || 0,
          revenue_this_month: salesResponse.revenue_this_month || 0,
          growth_rate: salesResponse.growth_rate || 0
        },
        inventory: {
          total_products: inventoryResponse.total_products || 0,
          low_stock_items: inventoryResponse.low_stock_items || 0,
          out_of_stock_items: inventoryResponse.out_of_stock_items || 0,
          total_value: inventoryResponse.total_stock_value || 0
        },
        customers: {
          total_customers: customersResponse.total_customers || 0,
          new_today: customersResponse.new_customers_today || 0,
          vip_customers: customersResponse.vip_customers || 0,
          active_customers: customersResponse.active_customers || 0
        },
        orders: {
          pending: salesResponse.pending_sales || 0,
          processing: 0,
          completed: salesResponse.completed_sales || 0,
          cancelled: salesResponse.cancelled_sales || 0
        }
      });

      setChartData(mockChartData);
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError('Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    fetchDashboardData();
    onRefresh?.();
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        <IconButton onClick={handleRefresh} size="small" sx={{ ml: 1 }}>
          <RefreshIcon />
        </IconButton>
      </Alert>
    );
  }

  if (!stats || !chartData) {
    return (
      <Alert severity="info">
        Không có dữ liệu để hiển thị
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header with Refresh */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Phân tích kinh doanh
        </Typography>
        <Tooltip title="Làm mới dữ liệu">
          <IconButton onClick={handleRefresh} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Sales Today */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText'
                  }}
                >
                  <CartIcon />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {formatNumber(stats.sales.today)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Đơn hàng hôm nay
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    {stats.sales.growth_rate >= 0 ? (
                      <TrendingUpIcon color="success" fontSize="small" />
                    ) : (
                      <TrendingDownIcon color="error" fontSize="small" />
                    )}
                    <Typography 
                      variant="caption" 
                      color={stats.sales.growth_rate >= 0 ? 'success.main' : 'error.main'}
                    >
                      {stats.sales.growth_rate.toFixed(1)}%
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Revenue Today */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'success.main',
                    color: 'success.contrastText'
                  }}
                >
                  <MoneyIcon />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {formatCurrency(stats.sales.revenue_today)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Doanh thu hôm nay
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Tháng: {formatCurrency(stats.sales.revenue_this_month)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Customers */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'info.main',
                    color: 'info.contrastText'
                  }}
                >
                  <PeopleIcon />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {formatNumber(stats.customers.total_customers)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng khách hàng
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip label={`VIP: ${stats.customers.vip_customers}`} size="small" color="warning" />
                    <Chip label={`Mới: ${stats.customers.new_today}`} size="small" color="success" />
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Inventory Status */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'warning.main',
                    color: 'warning.contrastText'
                  }}
                >
                  <InventoryIcon />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {formatNumber(stats.inventory.total_products)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sản phẩm
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    {stats.inventory.low_stock_items > 0 && (
                      <Chip 
                        label={`Sắp hết: ${stats.inventory.low_stock_items}`} 
                        size="small" 
                        color="warning"
                        icon={<WarningIcon />}
                      />
                    )}
                    {stats.inventory.out_of_stock_items > 0 && (
                      <Chip 
                        label={`Hết hàng: ${stats.inventory.out_of_stock_items}`} 
                        size="small" 
                        color="error"
                      />
                    )}
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* Sales Trend Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Xu hướng bán hàng (7 ngày qua)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData.sales_trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <ChartTooltip 
                    formatter={(value, name) => [
                      name === 'sales' ? formatNumber(value as number) : formatCurrency(value as number),
                      name === 'sales' ? 'Đơn hàng' : 'Doanh thu'
                    ]}
                  />
                  <Legend />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.6}
                    name="Đơn hàng"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#82ca9d"
                    name="Doanh thu"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Methods Pie Chart */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Phương thức thanh toán
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.payment_methods}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ method, percentage }) => `${method}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {chartData.payment_methods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Products */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Sản phẩm bán chạy
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.top_products}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <ChartTooltip 
                    formatter={(value, name) => [
                      name === 'sales' ? formatNumber(value as number) : formatCurrency(value as number),
                      name === 'sales' ? 'Số lượng bán' : 'Doanh thu'
                    ]}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="sales" fill="#8884d8" name="Số lượng bán" />
                  <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="Doanh thu" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
