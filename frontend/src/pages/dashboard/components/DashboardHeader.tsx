import React from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Fullscreen as FullscreenIcon,
  Dashboard as DashboardIcon,
  CalendarToday as CalendarIcon,
  Store as StoreIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { DashboardFilters, DashboardStats } from './types';

interface DashboardHeaderProps {
  stats: DashboardStats | null;
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  onRefresh: () => void;
  onSettings: () => void;
  onFullscreen: () => void;
  loading: boolean;
  lastUpdated?: string;
  userName: string;
  storeName: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  stats,
  filters,
  onFiltersChange,
  onRefresh,
  onSettings,
  onFullscreen,
  loading,
  lastUpdated,
  userName,
  storeName
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDateRangeChange = (preset: string) => {
    const today = new Date();
    let start: string, end: string;

    switch (preset) {
      case 'today':
        start = end = today.toISOString().split('T')[0];
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        start = end = yesterday.toISOString().split('T')[0];
        break;
      case 'this_week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        start = startOfWeek.toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
        break;
      case 'this_month':
        start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
        break;
      default:
        return;
    }

    onFiltersChange({
      ...filters,
      date_range: { start, end, preset: preset as any }
    });
  };

  const getDateRangeLabel = () => {
    switch (filters.date_range.preset) {
      case 'today': return 'Hôm nay';
      case 'yesterday': return 'Hôm qua';
      case 'this_week': return 'Tuần này';
      case 'this_month': return 'Tháng này';
      default: return 'Tùy chỉnh';
    }
  };

  const getGrowthColor = (rate: number) => {
    if (rate > 0) return 'success';
    if (rate < 0) return 'error';
    return 'default';
  };

  return (
    <Box sx={{ mb: 3 }}>
      {/* Main Header */}
      <Stack
        direction={isMobile ? 'column' : 'row'}
        justifyContent="space-between"
        alignItems={isMobile ? 'stretch' : 'center'}
        spacing={2}
        sx={{ mb: 3 }}
      >
        {/* Left Section - Title and Info */}
        <Box>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <DashboardIcon />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold">
                Dashboard
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Xin chào, <strong>{userName}</strong>
                </Typography>
                <Chip
                  icon={<StoreIcon />}
                  label={storeName}
                  size="small"
                  variant="outlined"
                />
                {lastUpdated && (
                  <Typography variant="caption" color="text.secondary">
                    Cập nhật: {new Date(lastUpdated).toLocaleTimeString('vi-VN')}
                  </Typography>
                )}
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* Right Section - Controls */}
        <Stack direction={isMobile ? 'column' : 'row'} spacing={1}>
          {/* Date Range Selector */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Thời gian</InputLabel>
            <Select
              value={filters.date_range.preset || 'today'}
              onChange={(e) => handleDateRangeChange(e.target.value)}
              label="Thời gian"
              startAdornment={<CalendarIcon sx={{ mr: 1 }} />}
            >
              <MenuItem value="today">Hôm nay</MenuItem>
              <MenuItem value="yesterday">Hôm qua</MenuItem>
              <MenuItem value="this_week">Tuần này</MenuItem>
              <MenuItem value="this_month">Tháng này</MenuItem>
            </Select>
          </FormControl>

          {/* Action Buttons */}
          <Stack direction="row" spacing={1}>
            <Tooltip title="Làm mới dữ liệu">
              <IconButton
                onClick={onRefresh}
                disabled={loading}
                color="primary"
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Cài đặt dashboard">
              <IconButton
                onClick={onSettings}
                color="default"
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Toàn màn hình">
              <IconButton
                onClick={onFullscreen}
                color="default"
              >
                <FullscreenIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Stack>

      {/* Quick Stats Summary */}
      {stats && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ py: 2 }}>
            <Stack
              direction={isMobile ? 'column' : 'row'}
              spacing={3}
              divider={!isMobile && <Box sx={{ width: 1, bgcolor: 'divider' }} />}
            >
              {/* Sales Summary */}
              <Box sx={{ textAlign: 'center', flexGrow: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Doanh số {getDateRangeLabel().toLowerCase()}
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {stats.sales.today.toLocaleString('vi-VN')} đơn
                </Typography>
                <Chip
                  icon={<TrendingUpIcon />}
                  label={`${stats.sales.growth_rate > 0 ? '+' : ''}${stats.sales.growth_rate.toFixed(1)}%`}
                  color={getGrowthColor(stats.sales.growth_rate) as any}
                  size="small"
                />
              </Box>

              {/* Revenue Summary */}
              <Box sx={{ textAlign: 'center', flexGrow: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Doanh thu {getDateRangeLabel().toLowerCase()}
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="success.main">
                  {stats.revenue.today.toLocaleString('vi-VN')} ₫
                </Typography>
                <Chip
                  icon={<TrendingUpIcon />}
                  label={`${stats.revenue.growth_rate > 0 ? '+' : ''}${stats.revenue.growth_rate.toFixed(1)}%`}
                  color={getGrowthColor(stats.revenue.growth_rate) as any}
                  size="small"
                />
              </Box>

              {/* Orders Summary */}
              <Box sx={{ textAlign: 'center', flexGrow: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Đơn hàng
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="info.main">
                  {stats.orders.total.toLocaleString('vi-VN')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Hoàn thành: {stats.orders.completion_rate.toFixed(1)}%
                </Typography>
              </Box>

              {/* Customers Summary */}
              <Box sx={{ textAlign: 'center', flexGrow: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Khách hàng
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="warning.main">
                  {stats.customers.total.toLocaleString('vi-VN')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Mới: +{stats.customers.new_today}
                </Typography>
              </Box>

              {/* Alerts Summary */}
              <Box sx={{ textAlign: 'center', flexGrow: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Cảnh báo tồn kho
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="error.main">
                  {stats.products.low_stock + stats.products.out_of_stock}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Hết hàng: {stats.products.out_of_stock}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
