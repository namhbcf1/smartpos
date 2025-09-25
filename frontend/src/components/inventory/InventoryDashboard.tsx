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
  Divider,
  ListItemIcon
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
import api from '../../services/api';

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

  // Fetch inventory data from D1 Cloudflare
  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/inventory/dashboard');
        
        if (response.data.success) {
          setData(response.data.data || null);
          console.log('📦 Inventory data loaded from D1:', response.data.data?.length || 0);
        } else {
          console.log('No inventory data found in D1 database');
          setData(null);
        }
      } catch (error) {
        console.error('Error fetching inventory data from D1:', error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryData();
  }, []);

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
            <IconButton onClick={() => {}} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Stock Levels */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3, mb: 4, flexWrap: 'wrap' }}>
        {data?.stock_levels?.map((category, index) => (
          <Box key={index} sx={{ flex: { xs: '1 1 100%', sm: '1 1 50%', md: '1 1 25%' }, minWidth: 0 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  {category.category}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Trong kho:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {category.in_stock}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Sắp hết:
                  </Typography>
                  <Typography variant="body1" color="warning.main">
                    {category.low_stock}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Hết hàng:
                  </Typography>
                  <Typography variant="body1" color="error.main">
                    {category.out_of_stock}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Giá trị: {formatCurrency(category.total_value)}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Recent Activities & Top Products */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 4 }}>
        <Box sx={{ flex: { md: 1 }, minWidth: 0 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Hoạt động gần đây
              </Typography>
              <List dense>
                {data?.recent_activities?.slice(0, 5).map((activity) => (
                  <ListItem key={activity.id} sx={{ px: 0 }}>
                    <ListItemIcon>
                      {getActivityIcon(activity.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.product_name}
                      secondary={`${activity.quantity} - ${activity.user_name} - ${formatTimeAgo(activity.timestamp)}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: { md: 1 }, minWidth: 0 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top sản phẩm bán chạy
              </Typography>
              <List dense>
                {data?.top_products?.slice(0, 5).map((product, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <TrendingUpIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={product.product_name}
                      secondary={`${product.quantity_sold} bán - ${formatCurrency(product.revenue)} - +${product.growth_rate}%`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Alerts */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        <Box sx={{ flex: { md: 2 }, minWidth: 0 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cảnh báo kho
              </Typography>
              <List dense>
                {data?.alerts?.map((alert) => (
                  <ListItem key={alert.id} sx={{ px: 0 }}>
                    <ListItemIcon>
                      {getAlertIcon(alert.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={alert.message}
                      secondary={`${alert.product_name} - ${formatTimeAgo(alert.created_at)}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: { md: 1 }, minWidth: 0 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tổng quan
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Tổng sản phẩm
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {data?.summary?.total_products?.toLocaleString() || 0}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Giá trị tồn kho
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    {formatCurrency(data?.summary?.total_value || 0)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Đơn hàng chờ
                  </Typography>
                  <Typography variant="h5" color="warning.main">
                    {data?.summary?.pending_orders || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default InventoryDashboard;
