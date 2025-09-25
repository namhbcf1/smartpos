import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Fade,
  Zoom
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShoppingCart as SalesIcon,
  Inventory as InventoryIcon,
  People as CustomersIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useSalesEvents, useInventoryEvents, useCustomerEvents } from '../../hooks/useRealtime';
import { formatCurrency, formatNumber } from '../../utils/format';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  loading?: boolean;
  animated?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  trend,
  trendValue,
  loading = false,
  animated = true
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const targetValue = typeof value === 'number' ? value : 0;

  // Animate number changes
  useEffect(() => {
    if (!animated || typeof value !== 'number') return;

    const duration = 1000; // 1 second
    const steps = 30;
    const stepValue = (targetValue - displayValue) / steps;
    const stepTime = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayValue(targetValue);
        clearInterval(timer);
      } else {
        setDisplayValue(prev => prev + stepValue);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [targetValue, animated]);

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUpIcon fontSize="small" />;
      case 'down': return <TrendingDownIcon fontSize="small" />;
      default: return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'success';
      case 'down': return 'error';
      default: return 'default';
    }
  };

  return (
    <Zoom in timeout={500}>
      <Card
        sx={{
          height: '100%',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 4
          }
        }}
      >
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {title}
              </Typography>
              
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: `${color}.main` }}>
                {animated && typeof value === 'number' 
                  ? formatNumber(Math.round(displayValue))
                  : value
                }
              </Typography>
              
              {subtitle && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {subtitle}
                </Typography>
              )}

              {trend && trendValue && (
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                  <Chip
                    icon={getTrendIcon()}
                    label={trendValue}
                    size="small"
                    color={getTrendColor() as any}
                    variant="outlined"
                  />
                </Stack>
              )}
            </Box>

            <Box sx={{ color: `${color}.main`, opacity: 0.8 }}>
              {icon}
            </Box>
          </Stack>

          {loading && (
            <LinearProgress 
              sx={{ mt: 2, borderRadius: 1 }} 
              color={color}
            />
          )}
        </CardContent>
      </Card>
    </Zoom>
  );
};

interface LiveStatsProps {
  refreshInterval?: number;
}

export const LiveStats: React.FC<LiveStatsProps> = ({
  refreshInterval = 30000 // 30 seconds
}) => {
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  
  // Get realtime data
  const { salesStats } = useSalesEvents();
  const { inventoryAlerts, lowStockCount } = useInventoryEvents();
  const { customerStats } = useCustomerEvents();

  // Auto refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(Date.now());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const handleManualRefresh = () => {
    setLastUpdate(Date.now());
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Thống kê trực tiếp
        </Typography>
        
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="caption" color="text.secondary">
            Cập nhật: {new Date(lastUpdate).toLocaleTimeString()}
          </Typography>
          <Tooltip title="Làm mới">
            <IconButton size="small" onClick={handleManualRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        {/* Sales Stats */}
        <Grid item xs={12} sm={6} md={3} component="div">
          <StatCard
            title="Doanh thu hôm nay"
            value={formatCurrency(salesStats.todayTotal)}
            subtitle={`${salesStats.todayCount} đơn hàng`}
            icon={<MoneyIcon sx={{ fontSize: 40 }} />}
            color="success"
            trend="up"
            trendValue="+12.5%"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3} component="div">
          <StatCard
            title="Đơn hàng hôm nay"
            value={salesStats.todayCount}
            subtitle="Đơn hàng mới"
            icon={<SalesIcon sx={{ fontSize: 40 }} />}
            color="primary"
            trend="up"
            trendValue="+8.2%"
          />
        </Grid>

        {/* Inventory Stats */}
        <Grid item xs={12} sm={6} md={3} component="div">
          <StatCard
            title="Cảnh báo tồn kho"
            value={lowStockCount}
            subtitle="Sản phẩm sắp hết"
            icon={<WarningIcon sx={{ fontSize: 40 }} />}
            color={lowStockCount > 0 ? "warning" : "success"}
            trend={lowStockCount > 0 ? "up" : "neutral"}
            trendValue={lowStockCount > 0 ? `+${lowStockCount}` : undefined}
          />
        </Grid>

        {/* Customer Stats */}
        <Grid item xs={12} sm={6} md={3} component="div">
          <StatCard
            title="Khách hàng mới"
            value={customerStats.newCustomersToday}
            subtitle="Hôm nay"
            icon={<CustomersIcon sx={{ fontSize: 40 }} />}
            color="info"
            trend="up"
            trendValue="+5.1%"
          />
        </Grid>

        {/* Additional Stats Row */}
        <Grid item xs={12} sm={6} md={3} component="div">
          <StatCard
            title="Điểm thưởng"
            value={formatNumber(customerStats.totalLoyaltyPoints)}
            subtitle="Tổng điểm tích lũy"
            icon={<MoneyIcon sx={{ fontSize: 40 }} />}
            color="secondary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3} component="div">
          <StatCard
            title="Khách VIP"
            value={customerStats.vipCustomers}
            subtitle="Khách hàng VIP"
            icon={<CustomersIcon sx={{ fontSize: 40 }} />}
            color="warning"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3} component="div">
          <StatCard
            title="Sản phẩm"
            value="1,234"
            subtitle="Tổng sản phẩm"
            icon={<InventoryIcon sx={{ fontSize: 40 }} />}
            color="info"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3} component="div">
          <StatCard
            title="Trung bình đơn hàng"
            value={formatCurrency(salesStats.todayCount > 0 ? salesStats.todayTotal / salesStats.todayCount : 0)}
            subtitle="Giá trị trung bình"
            icon={<MoneyIcon sx={{ fontSize: 40 }} />}
            color="primary"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default LiveStats;
