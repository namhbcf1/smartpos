import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  useTheme,
  LinearProgress,
  Avatar,
  Stack,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Inventory,
  ShoppingCart,
  People,
  Category,
  AttachMoney,
  Assessment,
} from '@mui/icons-material';
import { formatCurrency, formatNumber } from '../../config/constants';

interface DashboardStats {
  todaySales: number;
  weekSales: number;
  todayOrders: number;
  weekOrders: number;
  lowStockCount: number;
  productCount: number;
  categoryCount: number;
  trendPercent: number;
  pendingOrders: number;
  customerCount: number;
}

interface DashboardStatsProps {
  stats: DashboardStats | null;
  loading: boolean;
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  color?: string;
  subtitle?: string;
}> = React.memo(({ title, value, icon, trend, color = 'primary', subtitle }) => {
  const theme = useTheme();
  
  return (
    <Card 
      elevation={2} 
      sx={{ 
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          elevation: 4,
          transform: 'translateY(-2px)',
        }
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold">
              {typeof value === 'number' ? formatNumber(value) : value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar 
            sx={{ 
              bgcolor: `${color}.main`,
              width: 56,
              height: 56,
            }}
          >
            {icon}
          </Avatar>
        </Stack>
        
        {trend !== undefined && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
            {trend > 0 ? (
              <TrendingUp color="success" fontSize="small" />
            ) : (
              <TrendingDown color="error" fontSize="small" />
            )}
            <Typography 
              variant="body2" 
              color={trend > 0 ? 'success.main' : 'error.main'}
              sx={{ ml: 0.5 }}
            >
              {Math.abs(trend).toFixed(1)}%
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

StatCard.displayName = 'StatCard';

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, loading }) => {
  if (loading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={item} component="div">
            <Paper sx={{ p: 2, height: 120 }}>
              <LinearProgress />
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">Đang tải...</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (!stats) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Không có dữ liệu thống kê
        </Typography>
      </Paper>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={4} lg={2} component="div">
        <StatCard
          title="Doanh thu hôm nay"
          value={formatCurrency(stats.todaySales)}
          icon={<AttachMoney />}
          color="primary"
          trend={stats.trendPercent}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={4} lg={2} component="div">
        <StatCard
          title="Doanh thu tuần"
          value={formatCurrency(stats.weekSales)}
          icon={<Assessment />}
          color="secondary"
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={4} lg={2} component="div">
        <StatCard
          title="Đơn hàng hôm nay"
          value={stats.todayOrders}
          icon={<ShoppingCart />}
          color="success"
          subtitle={`${stats.pendingOrders} đang xử lý`}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={4} lg={2} component="div">
        <StatCard
          title="Sản phẩm"
          value={stats.productCount}
          icon={<Inventory />}
          color="warning"
          subtitle={`${stats.lowStockCount} sắp hết`}
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={4} lg={2} component="div">
        <StatCard
          title="Khách hàng"
          value={stats.customerCount}
          icon={<People />}
          color="info"
        />
      </Grid>
      
      <Grid item xs={12} sm={6} md={4} lg={2} component="div">
        <StatCard
          title="Danh mục"
          value={stats.categoryCount}
          icon={<Category />}
          color="error"
        />
      </Grid>
    </Grid>
  );
};

export default React.memo(DashboardStats);
