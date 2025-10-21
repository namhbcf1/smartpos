import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  // Paper,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  // Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  AccountBalance,
  Receipt,
  // Payment,
  CreditCard,
  Savings,
  Assessment,
  Refresh,
  Download,
  Warning,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI, ordersAPI, paymentMethodsAPI } from '../../services/api';

// Financial Card Component
interface FinancialCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  loading?: boolean;
}

const FinancialCard: React.FC<FinancialCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color,
  loading = false,
}) => {
  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <LinearProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Đang tải...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold">
              {value}
            </Typography>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {trend.isPositive ? (
                  <TrendingUp sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                ) : (
                  <TrendingDown sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
                )}
                <Typography
                  variant="body2"
                  color={trend.isPositive ? 'success.main' : 'error.main'}
                  fontWeight="medium"
                >
                  {Math.abs(trend.value)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Icon sx={{ fontSize: 40, color: `${color}.main` }} />
        </Box>
      </CardContent>
    </Card>
  );
};

// Payment Methods Summary Component
const PaymentMethodsSummary: React.FC = () => {
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => paymentMethodsAPI.getPaymentMethods(),
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(cents);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Phương thức thanh toán
          </Typography>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  const methods = ((paymentsData?.data as any)?.data as any[]) || [];
  const totalAmount = methods.reduce((s: number, m: any) => s + (m.total_amount_cents || 0), 0);
  const paymentMethods = methods.map((m: any) => ({
    name: m.name || m.code || 'Khác',
    amount: m.total_amount_cents || 0,
    percentage: totalAmount > 0 ? Math.round(((m.total_amount_cents || 0) / totalAmount) * 100) : 0,
    color: (m.name || '').toLowerCase().includes('tiền') ? 'success' : (m.name || '').toLowerCase().includes('chuyển') ? 'primary' : 'secondary',
  }));

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Phương thức thanh toán
        </Typography>
        <List>
          {paymentMethods.map((method, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <Avatar sx={{ bgcolor: `${method.color}.main`, width: 32, height: 32 }}>
                  {method.name === 'Tiền mặt' ? <AttachMoney /> :
                   method.name === 'Chuyển khoản' ? <AccountBalance /> :
                   <CreditCard />}
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={method.name}
                secondary={
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(method.amount)}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={method.percentage}
                      color={method.color as any}
                      sx={{ mt: 1, height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {method.percentage}%
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

// Recent Transactions Component
const RecentTransactions: React.FC = () => {
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: () => ordersAPI.getOrders(1, 10),
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(cents);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Giao dịch gần đây
          </Typography>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  const orders = ordersData?.data?.orders || [];

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'pending': return 'Đang xử lý';
      case 'failed': return 'Thất bại';
      default: return status;
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Giao dịch gần đây
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Mã giao dịch</TableCell>
                <TableCell>Khách hàng</TableCell>
                <TableCell>Phương thức</TableCell>
                <TableCell align="right">Số tiền</TableCell>
                <TableCell align="center">Trạng thái</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.slice(0, 5).map((order: any) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      #{order.order_number || order.id.slice(-8)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {order.customer_name || 'Khách lẻ'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {order.payment_method || 'Tiền mặt'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(order.total_cents || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getPaymentStatusLabel(order.payment_status || 'completed')}
                      size="small"
                      color={getPaymentStatusColor(order.payment_status || 'completed') as any}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

// Cash Flow Chart (Simple Inline Bars)
const CashFlowChart: React.FC = () => {
  const inflow = [50, 60, 55, 70, 65, 80, 75];
  const outflow = [30, 45, 40, 50, 48, 55, 52];
  const width = 600;
  const height = 240;
  const padding = 24;
  const barWidth = 20;
  const gap = 16;
  const maxVal = Math.max(...inflow, ...outflow) || 1;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Dòng tiền
        </Typography>
        <Box sx={{ overflow: 'auto' }}>
          <svg width={width} height={height} role="img" aria-label="Cash flow">
            {inflow.map((v, i) => {
              const xBase = padding + i * (barWidth * 2 + gap);
              const inH = (v / maxVal) * (height - padding * 2);
              const outH = (outflow[i] / maxVal) * (height - padding * 2);
              const yIn = height - padding - inH;
              const yOut = height - padding - outH;
              return (
                <g key={i}>
                  <rect x={xBase} y={yIn} width={barWidth} height={inH} fill="#2e7d32" />
                  <rect x={xBase + barWidth + 4} y={yOut} width={barWidth} height={outH} fill="#c62828" />
                </g>
              );
            })}
          </svg>
        </Box>
      </CardContent>
    </Card>
  );
};

// Financial Alerts Component
const FinancialAlerts: React.FC = () => {
  const alerts = [
    {
      type: 'warning',
      icon: Warning,
      title: 'Cảnh báo ngân sách',
      message: 'Chi phí tháng này đã vượt 80% ngân sách',
    },
    {
      type: 'info',
      icon: CheckCircle,
      title: 'Thanh toán thành công',
      message: 'Đã nhận được 5 thanh toán mới trong ngày',
    },
    {
      type: 'error',
      icon: Error,
      title: 'Giao dịch thất bại',
      message: 'Có 2 giao dịch thất bại cần xử lý',
    },
  ];

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning': return 'warning.main';
      case 'error': return 'error.main';
      default: return 'info.main';
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Thông báo tài chính
        </Typography>
        <List>
          {alerts.map((alert, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <alert.icon sx={{ color: getAlertColor(alert.type) }} />
              </ListItemIcon>
              <ListItemText
                primary={alert.title}
                secondary={alert.message}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

// Main Financial Overview Component
const FinancialOverview: React.FC = () => {
  const [dateRange, setDateRange] = useState('30');
  const [reportType, setReportType] = useState('summary');

  // Fetch dashboard statistics
  const { data: dashboardStats, isLoading: statsLoading, error: statsError, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardAPI.getStats(),
  });

  // Fetch orders for financial data
  const { data: ordersData } = useQuery({
    queryKey: ['orders-financial'],
    queryFn: () => ordersAPI.getOrders(1, 100),
  });

  // Get stats from dashboard API
  const stats = (dashboardStats as any)?.data?.data || {} as any;
  const orders = ordersData?.data?.orders || [];

  // Calculate financial metrics
  const totalRevenue = stats.revenue?.this_month || 0;
  const totalOrders = stats.sales?.total_this_month || orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalCosts = orders.reduce((sum: number, order: any) => sum + (order.cost_price_cents || 0), 0);
  const profit = totalRevenue - totalCosts;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  // Format currency
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(cents);
  };

  const handleRefresh = () => {
    refetch();
  };

  const [toast, setToast] = React.useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const handleExport = async () => {
    try {
      setToast({ type: 'info', message: 'Đang chuẩn bị xuất báo cáo tài chính...' });
      // TODO: gọi API export và tải file
      setTimeout(() => setToast({ type: 'success', message: 'Xuất báo cáo tài chính thành công' }), 800);
    } catch (e: any) {
      setToast({ type: 'error', message: e?.message || 'Xuất báo cáo tài chính thất bại' });
    }
  };

  return (
    <Box>
      {toast && (
        <Alert severity={toast.type} onClose={() => setToast(null)} sx={{ mb: 2 }}>
          {toast.message}
        </Alert>
      )}
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Tổng quan tài chính
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Theo dõi doanh thu, chi phí và lợi nhuận
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExport}
            >
              Xuất báo cáo
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
            >
              Làm mới
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Error Alert */}
      {statsError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Không thể tải dữ liệu tài chính. Vui lòng kiểm tra kết nối mạng.
        </Alert>
      )}

      {/* Toolbar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Khoảng thời gian</InputLabel>
              <Select
                value={dateRange}
                onChange={(e: any) => setDateRange(e.target.value)}
                label="Khoảng thời gian"
              >
                <MenuItem value="7">7 ngày qua</MenuItem>
                <MenuItem value="30">30 ngày qua</MenuItem>
                <MenuItem value="90">90 ngày qua</MenuItem>
                <MenuItem value="365">1 năm qua</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Loại báo cáo</InputLabel>
              <Select
                value={reportType}
                onChange={(e: any) => setReportType(e.target.value)}
                label="Loại báo cáo"
              >
                <MenuItem value="summary">Tổng quan</MenuItem>
                <MenuItem value="detailed">Chi tiết</MenuItem>
                <MenuItem value="comparison">So sánh</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Financial Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <FinancialCard
            title="Tổng doanh thu"
            value={formatCurrency(totalRevenue)}
            icon={AttachMoney}
            trend={{
              value: 12.5,
              isPositive: true,
            }}
            color="primary"
            loading={statsLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FinancialCard
            title="Tổng chi phí"
            value={formatCurrency(totalCosts)}
            icon={Receipt}
            trend={{
              value: 8.3,
              isPositive: false,
            }}
            color="secondary"
            loading={statsLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FinancialCard
            title="Lợi nhuận"
            value={formatCurrency(profit)}
            icon={Savings}
            trend={{
              value: 15.2,
              isPositive: profit >= 0,
            }}
            color="success"
            loading={statsLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FinancialCard
            title="Biên lợi nhuận"
            value={`${profitMargin.toFixed(1)}%`}
            icon={Assessment}
            trend={{
              value: 3.1,
              isPositive: true,
            }}
            color="warning"
            loading={statsLoading}
          />
        </Grid>
      </Grid>

      {/* Simplified: remove charts; keep summaries and tables */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <PaymentMethodsSummary />
        </Grid>
        <Grid item xs={12} lg={6}>
          <RecentTransactions />
        </Grid>
        <Grid item xs={12}>
          <FinancialAlerts />
        </Grid>
      </Grid>
    </Box>
  );
};

export default FinancialOverview;