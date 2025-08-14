import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Alert,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as CartIcon,
  LocalShipping as ShippingIcon,
  Refresh as RefreshIcon,
  Fullscreen as FullscreenIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { formatCurrency } from '../config/constants';
import api from '../services/api';

interface DashboardData {
  summary: {
    total_products: number;
    total_value: number;
    low_stock_count: number;
    out_of_stock_count: number;
    pending_orders: number;
    monthly_revenue: number;
    monthly_growth: number;
  };
  stock_levels: {
    category: string;
    in_stock: number;
    low_stock: number;
    out_of_stock: number;
    total_value: number;
  }[];
  recent_activities: {
    id: number;
    type: 'stock_in' | 'stock_out' | 'adjustment';
    product_name: string;
    quantity: number;
    timestamp: string;
    user_name: string;
  }[];
  top_products: {
    product_name: string;
    category: string;
    quantity_sold: number;
    revenue: number;
    growth_rate: number;
  }[];
  alerts: {
    id: number;
    type: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiring';
    message: string;
    product_name: string;
    severity: 'high' | 'medium' | 'low';
    created_at: string;
  }[];
}

interface InventoryDashboardProps {
  refreshInterval?: number;
  compactMode?: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const InventoryDashboard: React.FC<InventoryDashboardProps> = ({
  refreshInterval = 30000, // 30 seconds
  compactMode = false
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadDashboardData();
    
    const interval = setInterval(() => {
      loadDashboardData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const loadDashboardData = async () => {
    try {
      const response = await api.get<{ data: DashboardData }>('/analytics/dashboard');
      setData(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Mock data for demonstration
      setData({
        summary: {
          total_products: 1247,
          total_value: 2850000000,
          low_stock_count: 23,
          out_of_stock_count: 5,
          pending_orders: 12,
          monthly_revenue: 450000000,
          monthly_growth: 12.5
        },
        stock_levels: [
          { category: 'CPU', in_stock: 145, low_stock: 8, out_of_stock: 2, total_value: 850000000 },
          { category: 'GPU', in_stock: 89, low_stock: 5, out_of_stock: 1, total_value: 1200000000 },
          { category: 'RAM', in_stock: 234, low_stock: 6, out_of_stock: 1, total_value: 320000000 },
          { category: 'Storage', in_stock: 178, low_stock: 4, out_of_stock: 1, total_value: 480000000 }
        ],
        recent_activities: [
          {
            id: 1,
            type: 'stock_in',
            product_name: 'CPU Intel Core i7-13700K',
            quantity: 10,
            timestamp: '2024-01-15T10:30:00Z',
            user_name: 'Nguyễn Văn A'
          },
          {
            id: 2,
            type: 'stock_out',
            product_name: 'GPU RTX 4070',
            quantity: 2,
            timestamp: '2024-01-15T09:15:00Z',
            user_name: 'Trần Thị B'
          }
        ],
        top_products: [
          {
            product_name: 'CPU Intel Core i5-13400F',
            category: 'CPU',
            quantity_sold: 45,
            revenue: 189000000,
            growth_rate: 15.2
          },
          {
            product_name: 'RAM Corsair 16GB DDR4',
            category: 'RAM',
            quantity_sold: 78,
            revenue: 156000000,
            growth_rate: 8.7
          }
        ],
        alerts: [
          {
            id: 1,
            type: 'low_stock',
            message: 'Sắp hết hàng',
            product_name: 'CPU Intel Core i9-13900K',
            severity: 'high',
            created_at: '2024-01-15T08:00:00Z'
          },
          {
            id: 2,
            type: 'out_of_stock',
            message: 'Hết hàng',
            product_name: 'GPU RTX 4090',
            severity: 'high',
            created_at: '2024-01-15T07:30:00Z'
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'stock_in':
        return <TrendingUpIcon color="success" />;
      case 'stock_out':
        return <TrendingDownIcon color="error" />;
      default:
        return <InventoryIcon color="action" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'out_of_stock':
        return <WarningIcon color="error" />;
      case 'low_stock':
        return <WarningIcon color="warning" />;
      default:
        return <CheckIcon color="success" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Vừa xong';
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} giờ trước`;
    return `${Math.floor(diffMinutes / 1440)} ngày trước`;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Đang tải dashboard...
        </Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Alert severity="error">
        Không thể tải dữ liệu dashboard
      </Alert>
    );
  }

  return (
    <Box sx={{ p: compactMode ? 1 : 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DashboardIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight="bold">
            Dashboard Tồn Kho
          </Typography>
          <Chip label="Real-time" color="success" size="small" />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Cập nhật: {lastUpdated.toLocaleTimeString('vi-VN')}
          </Typography>
          <Tooltip title="Làm mới">
            <IconButton onClick={loadDashboardData} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.50' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <InventoryIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {data.summary.total_products.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng sản phẩm
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    {formatCurrency(data.summary.total_value)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.50' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <WarningIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {data.summary.low_stock_count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sắp hết hàng
                  </Typography>
                  <Typography variant="caption" color="error.main">
                    {data.summary.out_of_stock_count} hết hàng
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.50' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <ShippingIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {data.summary.pending_orders}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Đơn chờ xử lý
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.50' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <MoneyIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {formatCurrency(data.summary.monthly_revenue)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Doanh thu tháng
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUpIcon color="success" fontSize="small" />
                    <Typography variant="caption" color="success.main">
                      +{data.summary.monthly_growth}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Stock Levels Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tình trạng tồn kho theo danh mục
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.stock_levels}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="in_stock" stackId="a" fill="#4caf50" name="Còn hàng" />
                  <Bar dataKey="low_stock" stackId="a" fill="#ff9800" name="Sắp hết" />
                  <Bar dataKey="out_of_stock" stackId="a" fill="#f44336" name="Hết hàng" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Alerts */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cảnh báo
              </Typography>
              <List dense>
                {data.alerts.slice(0, 5).map((alert) => (
                  <ListItem key={alert.id} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {getAlertIcon(alert.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={alert.product_name}
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {alert.message} • {formatTimeAgo(alert.created_at)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
              {data.alerts.length === 0 && (
                <Alert severity="success" sx={{ mt: 1 }}>
                  Không có cảnh báo nào
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Hoạt động gần đây
              </Typography>
              <List dense>
                {data.recent_activities.slice(0, 5).map((activity) => (
                  <ListItem key={activity.id} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {getActivityIcon(activity.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">
                            {activity.product_name}
                          </Typography>
                          <Chip
                            label={`${activity.quantity > 0 ? '+' : ''}${activity.quantity}`}
                            size="small"
                            color={activity.quantity > 0 ? 'success' : 'error'}
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {activity.user_name} • {formatTimeAgo(activity.timestamp)}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Products */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sản phẩm bán chạy
              </Typography>
              <List dense>
                {data.top_products.slice(0, 5).map((product, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={product.product_name}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="caption">
                            {product.quantity_sold} bán
                          </Typography>
                          <Typography variant="caption" color="success.main">
                            {formatCurrency(product.revenue)}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <TrendingUpIcon color="success" sx={{ fontSize: 12 }} />
                            <Typography variant="caption" color="success.main">
                              +{product.growth_rate}%
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InventoryDashboard;
