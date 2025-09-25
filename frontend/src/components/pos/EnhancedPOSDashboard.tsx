import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Avatar,
  Chip,
  LinearProgress,
  Alert,
  Fade,
  Zoom,
  useTheme,
  alpha,
  Stack,
  Divider,
  Badge,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Store as StoreIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  LocalOffer as OfferIcon,
  Receipt as ReceiptIcon,
  Print as PrintIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Analytics as AnalyticsIcon,
  Today as TodayIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { keyframes } from '@mui/system';

// Animation keyframes
const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  todayCustomers: number;
  lowStockItems: number;
  totalRevenue: number;
  averageOrderValue: number;
  topSellingProducts: Array<{
    id: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  recentTransactions: Array<{
    id: string;
    customerName: string;
    amount: number;
    time: string;
    status: 'completed' | 'pending' | 'cancelled';
  }>;
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    time: string;
  }>;
}

interface EnhancedPOSDashboardProps {
  onNavigate?: (route: string) => void;
  stats?: DashboardStats;
}

const defaultStats: DashboardStats = {
  todaySales: 15420000,
  todayOrders: 47,
  todayCustomers: 32,
  lowStockItems: 5,
  totalRevenue: 125000000,
  averageOrderValue: 328000,
  topSellingProducts: [
    { id: '1', name: 'Laptop Dell Inspiron 15', quantity: 8, revenue: 120000000 },
    { id: '2', name: 'Mouse Logitech MX Master', quantity: 15, revenue: 37500000 },
    { id: '3', name: 'Keyboard Mechanical RGB', quantity: 12, revenue: 21600000 }
  ],
  recentTransactions: [
    { id: '1', customerName: 'Nguyễn Văn A', amount: 750000, time: '10:30', status: 'completed' },
    { id: '2', customerName: 'Trần Thị B', amount: 1200000, time: '10:15', status: 'completed' },
    { id: '3', customerName: 'Lê Văn C', amount: 450000, time: '09:45', status: 'pending' }
  ],
  alerts: [
    { id: '1', type: 'warning', message: '5 sản phẩm sắp hết hàng', time: '2 phút trước' },
    { id: '2', type: 'info', message: 'Đã có 47 đơn hàng hôm nay', time: '5 phút trước' }
  ]
};

export default function EnhancedPOSDashboard({
  onNavigate,
  stats = defaultStats
}: EnhancedPOSDashboardProps) {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000);

    // Update time every minute
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 60000);

    return () => {
      clearTimeout(timer);
      clearInterval(timeInterval);
    };
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const StatCard = ({
    title,
    value,
    icon,
    color = 'primary',
    trend,
    subtitle,
    delay = 0
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
    trend?: number;
    subtitle?: string;
    delay?: number;
  }) => (
    <Zoom in={!isLoading} style={{ transitionDelay: `${delay}ms` }}>
      <Card
        elevation={0}
        sx={{
          background: `linear-gradient(135deg, ${theme.palette[color].main}15, ${theme.palette[color].main}25)`,
          border: `1px solid ${theme.palette[color].main}30`,
          borderRadius: 3,
          height: '100%',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 25px ${alpha(theme.palette[color].main, 0.25)}`,
            animation: `${pulse} 2s infinite`
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {title}
              </Typography>
              <Typography variant="h4" fontWeight="bold" color={`${color}.main`}>
                {typeof value === 'number' ? formatCurrency(value) : value}
              </Typography>
              {subtitle && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {subtitle}
                </Typography>
              )}
              {trend && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TrendingUpIcon
                    sx={{
                      fontSize: 16,
                      color: trend > 0 ? 'success.main' : 'error.main',
                      mr: 0.5
                    }}
                  />
                  <Typography
                    variant="body2"
                    color={trend > 0 ? 'success.main' : 'error.main'}
                    fontWeight="medium"
                  >
                    {trend > 0 ? '+' : ''}{trend}% so với hôm qua
                  </Typography>
                </Box>
              )}
            </Box>
            <Avatar
              sx={{
                bgcolor: `${color}.main`,
                width: 56,
                height: 56,
                background: `linear-gradient(135deg, ${theme.palette[color].main}, ${theme.palette[color].dark})`
              }}
            >
              {icon}
            </Avatar>
          </Box>
        </CardContent>
      </Card>
    </Zoom>
  );

  const quickActions = [
    { icon: <CartIcon />, label: 'Bán hàng', action: () => onNavigate?.('/pos') },
    { icon: <ReceiptIcon />, label: 'Hóa đơn', action: () => onNavigate?.('/receipts') },
    { icon: <InventoryIcon />, label: 'Kho hàng', action: () => onNavigate?.('/inventory') },
    { icon: <AnalyticsIcon />, label: 'Báo cáo', action: () => onNavigate?.('/reports') },
    { icon: <SettingsIcon />, label: 'Cài đặt', action: () => onNavigate?.('/settings') }
  ];

  return (
    <Box sx={{ p: 3, maxWidth: '1400px', mx: 'auto' }}>
      {/* Header Section */}
      <Fade in={!isLoading} timeout={600}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2
          }}>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Dashboard POS
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Tổng quan hoạt động bán hàng hôm nay
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                icon={<TodayIcon />}
                label={currentTime.toLocaleDateString('vi-VN')}
                variant="outlined"
                color="primary"
              />
              <Chip
                icon={<ScheduleIcon />}
                label={currentTime.toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                color="primary"
              />
            </Box>
          </Box>
        </Box>
      </Fade>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3} component="div">
          <StatCard
            title="Doanh thu hôm nay"
            value={stats.todaySales}
            icon={<MoneyIcon />}
            color="success"
            trend={12.5}
            delay={100}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} component="div">
          <StatCard
            title="Số đơn hàng"
            value={stats.todayOrders}
            icon={<ReceiptIcon />}
            color="primary"
            trend={8.2}
            subtitle="đơn hàng hôm nay"
            delay={200}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} component="div">
          <StatCard
            title="Khách hàng"
            value={stats.todayCustomers}
            icon={<PeopleIcon />}
            color="info"
            trend={-2.1}
            subtitle="khách hàng mới"
            delay={300}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} component="div">
          <StatCard
            title="Cảnh báo kho"
            value={stats.lowStockItems}
            icon={<WarningIcon />}
            color="warning"
            subtitle="sản phẩm sắp hết"
            delay={400}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Transactions */}
        <Grid item xs={12} md={6} component="div">
          <Zoom in={!isLoading} style={{ transitionDelay: '500ms' }}>
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e0e0e0' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 32, height: 32 }}>
                    <ReceiptIcon fontSize="small" />
                  </Avatar>
                  <Typography variant="h6" fontWeight="600">
                    Giao dịch gần đây
                  </Typography>
                </Box>

                <Stack spacing={2}>
                  {stats.recentTransactions.map((transaction, index) => (
                    <Box key={transaction.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'grey.100', width: 32, height: 32 }}>
                            <PersonIcon color="action" fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="500">
                              {transaction.customerName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {transaction.time}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" fontWeight="600">
                            {formatCurrency(transaction.amount)}
                          </Typography>
                          <Chip
                            label={transaction.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý'}
                            size="small"
                            color={transaction.status === 'completed' ? 'success' : 'warning'}
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                      {index < stats.recentTransactions.length - 1 && <Divider sx={{ mt: 2 }} />}
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>

        {/* Top Selling Products */}
        <Grid item xs={12} md={6} component="div">
          <Zoom in={!isLoading} style={{ transitionDelay: '600ms' }}>
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e0e0e0' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.main', mr: 2, width: 32, height: 32 }}>
                    <TrendingUpIcon fontSize="small" />
                  </Avatar>
                  <Typography variant="h6" fontWeight="600">
                    Sản phẩm bán chạy
                  </Typography>
                </Box>

                <Stack spacing={2}>
                  {stats.topSellingProducts.map((product, index) => (
                    <Box key={product.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" fontWeight="500">
                          {product.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {product.quantity} bán
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={(product.quantity / Math.max(...stats.topSellingProducts.map(p => p.quantity))) * 100}
                          sx={{ flex: 1, height: 6, borderRadius: 3 }}
                          color="success"
                        />
                        <Typography variant="body2" fontWeight="600" color="success.main">
                          {formatCurrency(product.revenue)}
                        </Typography>
                      </Box>
                      {index < stats.topSellingProducts.length - 1 && <Divider sx={{ mt: 2 }} />}
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>

        {/* Alerts */}
        <Grid item xs={12} component="div">
          <Fade in={!isLoading} timeout={800}>
            <Box>
              <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
                Thông báo & Cảnh báo
              </Typography>
              <Stack spacing={2}>
                {stats.alerts.map((alert) => (
                  <Alert
                    key={alert.id}
                    severity={alert.type}
                    sx={{ borderRadius: 2 }}
                    action={
                      <Typography variant="caption" color="text.secondary">
                        {alert.time}
                      </Typography>
                    }
                  >
                    {alert.message}
                  </Alert>
                ))}
              </Stack>
            </Box>
          </Fade>
        </Grid>
      </Grid>

      {/* Floating Action Button with Speed Dial */}
      <SpeedDial
        ariaLabel="Quick Actions"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        icon={<SpeedDialIcon />}
        FabProps={{
          sx: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
            }
          }
        }}
      >
        {quickActions.map((action) => (
          <SpeedDialAction
            key={action.label}
            icon={action.icon}
            tooltipTitle={action.label}
            onClick={action.action}
            FabProps={{
              sx: {
                bgcolor: 'white',
                '&:hover': {
                  bgcolor: 'primary.main',
                  color: 'white'
                }
              }
            }}
          />
        ))}
      </SpeedDial>

      {/* Loading overlay */}
      {isLoading && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(255,255,255,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <LinearProgress sx={{ width: 200, mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Đang tải dashboard...
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
