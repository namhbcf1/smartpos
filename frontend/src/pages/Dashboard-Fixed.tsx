import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  IconButton,
  Tooltip,
  Chip,
  LinearProgress,
  Stack,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Inventory,
  People,
  AttachMoney,
  Refresh,
  Warning,
  CheckCircle,
  Error,
  Visibility,
  Add
} from '@mui/icons-material';
import api from '../services/api';

interface DashboardData {
  todaySales: number;
  todayRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockProducts: number;
  pendingOrders: number;
  timestamp: string;
  testParam?: string;
}

const DashboardFixed: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the correct API endpoint that exists in backend
      const response = await api.get('/dashboard/stats');
      
      if (response.success && response.data) {
        setDashboardData(response.data);
      } else {
        throw new Error('Không thể tải dữ liệu dashboard');
      }

    } catch (err) {
      console.error('Dashboard fetch error:', err);
      // Fix the instanceof Error issue by using a safer approach
      const errorMessage = err && typeof err === 'object' && 'message' in err 
        ? String(err.message) 
        : 'Lỗi không xác định';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Đang tải dashboard...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Thử lại
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Không có dữ liệu dashboard
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Đang tải...' : 'Làm mới'}
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachMoney sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {formatCurrency(dashboardData.todayRevenue)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Doanh thu hôm nay
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Inventory sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {formatNumber(dashboardData.totalProducts)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng sản phẩm
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ShoppingCart sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {formatNumber(dashboardData.todaySales)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Đơn hàng hôm nay
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <People sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {formatNumber(dashboardData.totalCustomers)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng khách hàng
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Thống kê bổ sung
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip 
                  label={`Sắp hết hàng: ${dashboardData.lowStockProducts}`} 
                  color="warning" 
                  size="medium" 
                />
                <Chip 
                  label={`Đơn hàng chờ: ${dashboardData.pendingOrders}`} 
                  color="info" 
                  size="medium" 
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Cập nhật lúc: {new Date(dashboardData.timestamp).toLocaleString('vi-VN')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Trạng thái hệ thống
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip 
                  label="API hoạt động" 
                  color="success" 
                  size="medium" 
                  icon={<CheckCircle />}
                />
                <Chip 
                  label="Database kết nối" 
                  color="success" 
                  size="medium" 
                  icon={<CheckCircle />}
                />
                <Chip 
                  label="CORS đã sửa" 
                  color="success" 
                  size="medium" 
                  icon={<CheckCircle />}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardFixed;
