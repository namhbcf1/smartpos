import React from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Avatar,
  Paper,
  Chip,
  IconButton,
  LinearProgress,
} from '@mui/material';
import {
  LocalShipping,
  Assignment,
  Timeline as TimelineIcon,
  TrendingUp,
  TrendingDown,
  ArrowForward,
  Refresh,
  Add,
  Assessment,
  LocationOn,
  Speed,
  Schedule,
  CheckCircle,
  Error,
  Pending,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

interface DashboardStats {
  total_orders: number;
  pending_orders: number;
  in_transit_orders: number;
  delivered_orders: number;
  failed_orders: number;
  total_revenue: number;
  growth_rate: number;
}

const ShippingManagement: React.FC = () => {
  const navigate = useNavigate();

  // Fetch shipping orders for stats
  const { data: ordersData, refetch } = useQuery({
    queryKey: ['shipping-orders'],
    queryFn: async () => {
      const response = await api.get('/shipping/orders');
      return response.data.data || [];
    },
  });

  const orders = ordersData || [];

  // Calculate stats
  const stats: DashboardStats = {
    total_orders: orders.length,
    pending_orders: orders.filter((o: any) => o.status?.toLowerCase() === 'pending').length,
    in_transit_orders: orders.filter((o: any) => ['in_transit', 'shipped', 'picking'].includes(o.status?.toLowerCase() || '')).length,
    delivered_orders: orders.filter((o: any) => o.status?.toLowerCase() === 'delivered').length,
    failed_orders: orders.filter((o: any) => ['cancelled', 'failed'].includes(o.status?.toLowerCase() || '')).length,
    total_revenue: orders.reduce((sum: number, o: any) => sum + (o.fee_amount || 0), 0),
    growth_rate: 12.5,
  };

  const recentOrders = orders.slice(0, 5);

  const quickActions = [
    {
      title: 'Tạo đơn GHTK',
      description: 'Tạo đơn giao hàng mới với GHTK',
      icon: <Add />,
      color: '#667eea',
      path: '/shipping/ghtk/create',
    },
    {
      title: 'Danh sách đơn hàng',
      description: 'Xem tất cả đơn hàng vận chuyển',
      icon: <Assignment />,
      color: '#f093fb',
      path: '/shipping/orders',
    },
    {
      title: 'Phương thức vận chuyển',
      description: 'Quản lý phương thức vận chuyển',
      icon: <LocalShipping />,
      color: '#4facfe',
      path: '/shipping',
    },
    {
      title: 'Dữ liệu địa lý',
      description: 'Tra cứu tỉnh/thành, quận/huyện',
      icon: <LocationOn />,
      color: '#43e97b',
      path: '/shipping',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'success';
      case 'in_transit':
      case 'shipped':
      case 'picking': return 'info';
      case 'pending': return 'warning';
      case 'cancelled':
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return <CheckCircle />;
      case 'in_transit':
      case 'shipped':
      case 'picking': return <LocalShipping />;
      case 'pending': return <Pending />;
      case 'cancelled':
      case 'failed': return <Error />;
      default: return <Schedule />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h3" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                <LocalShipping sx={{ fontSize: 32 }} />
              </Avatar>
              Quản lý vận chuyển
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Dashboard tổng quan và quản lý đơn hàng vận chuyển
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <IconButton onClick={() => refetch()} color="primary">
              <Refresh />
            </IconButton>
            <Button
              variant="contained"
              size="large"
              startIcon={<Add />}
              onClick={() => navigate('/shipping/ghtk/create')}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: 3,
                '&:hover': {
                  boxShadow: 6,
                }
              }}
            >
              Tạo đơn mới
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: 8,
              }
            }}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Tổng đơn hàng
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" gutterBottom>
                    {stats.total_orders}
                  </Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <TrendingUp fontSize="small" />
                    <Typography variant="caption">
                      +{stats.growth_rate}% so với tháng trước
                    </Typography>
                  </Stack>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 56, height: 56 }}>
                  <LocalShipping />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: 8,
              }
            }}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Đang chờ
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" gutterBottom>
                    {stats.pending_orders}
                  </Typography>
                  <Typography variant="caption">
                    Đơn hàng chưa xử lý
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 56, height: 56 }}>
                  <Schedule />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: 8,
              }
            }}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Đang vận chuyển
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" gutterBottom>
                    {stats.in_transit_orders}
                  </Typography>
                  <Typography variant="caption">
                    Đơn hàng trên đường
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 56, height: 56 }}>
                  <LocalShipping />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: 8,
              }
            }}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Đã giao hàng
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" gutterBottom>
                    {stats.delivered_orders}
                  </Typography>
                  <Typography variant="caption">
                    Hoàn thành giao hàng
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 56, height: 56 }}>
                  <CheckCircle />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
            Thao tác nhanh
          </Typography>
          <Grid container spacing={3}>
            {quickActions.map((action, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    border: '2px solid',
                    borderColor: 'grey.200',
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: action.color,
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                      '& .action-icon': {
                        bgcolor: action.color,
                      }
                    }
                  }}
                  onClick={() => navigate(action.path)}
                >
                  <Stack spacing={2}>
                    <Avatar
                      className="action-icon"
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: 'grey.200',
                        color: action.color,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {action.icon}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {action.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {action.description}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Recent Orders & Revenue */}
      <Grid container spacing={3}>
        {/* Recent Orders */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                  Đơn hàng gần đây
                </Typography>
                <Button
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/shipping/orders')}
                >
                  Xem tất cả
                </Button>
              </Stack>

              <Stack spacing={2}>
                {recentOrders.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <LocalShipping sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      Chưa có đơn hàng nào
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => navigate('/shipping/ghtk/create')}
                      sx={{ mt: 2 }}
                    >
                      Tạo đơn đầu tiên
                    </Button>
                  </Box>
                ) : (
                  recentOrders.map((order: any) => (
                    <Paper
                      key={order.id}
                      elevation={0}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'grey.200',
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: 2,
                        }
                      }}
                      onClick={() => navigate(`/shipping/orders/${order.id}`)}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <LocalShipping />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {order.order_id || order.carrier_order_code}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {order.carrier.toUpperCase()} • {new Date(order.created_at).toLocaleDateString('vi-VN')}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip
                            icon={getStatusIcon(order.status)}
                            label={order.status}
                            color={getStatusColor(order.status) as any}
                            size="small"
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="body2" fontWeight="bold">
                            {formatCurrency(order.fee_amount)}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  ))
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Revenue & Stats */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Total Revenue */}
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Tổng doanh thu
                    </Typography>
                    <Avatar sx={{ width: 40, height: 40, bgcolor: 'success.main' }}>
                      <Assessment />
                    </Avatar>
                  </Stack>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {formatCurrency(stats.total_revenue)}
                  </Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <TrendingUp fontSize="small" color="success" />
                    <Typography variant="caption" color="success.main">
                      +{stats.growth_rate}% so với tháng trước
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Completion Rate */}
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    Tỷ lệ hoàn thành
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.total_orders > 0
                      ? Math.round((stats.delivered_orders / stats.total_orders) * 100)
                      : 0}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={stats.total_orders > 0
                      ? (stats.delivered_orders / stats.total_orders) * 100
                      : 0}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        background: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)',
                      }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {stats.delivered_orders} / {stats.total_orders} đơn hàng
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            {/* Failed Orders */}
            {stats.failed_orders > 0 && (
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: 'error.main' }}>
                      <Error />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {stats.failed_orders}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Đơn hàng thất bại
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ShippingManagement;
