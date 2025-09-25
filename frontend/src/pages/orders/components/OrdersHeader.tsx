import React from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Grid,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  FileDownload as ExportIcon,
  Refresh as RefreshIcon,
  Assignment as OrderIcon,
  Schedule as PendingIcon,
  CheckCircle as CompletedIcon,
  Cancel as CancelledIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { formatCurrency } from '../../../config/constants';
import { OrderSummary } from './types';

interface OrdersHeaderProps {
  summary: OrderSummary | null;
  onNewOrder: () => void;
  onExport: () => void;
  onRefresh: () => void;
  onAnalytics: () => void;
  loading: boolean;
}

export const OrdersHeader: React.FC<OrdersHeaderProps> = ({
  summary,
  onNewOrder,
  onExport,
  onRefresh,
  onAnalytics,
  loading
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const statsCards = [
    {
      title: 'Hôm nay',
      orders: summary?.today.orders_count || 0,
      amount: summary?.today.total_amount || 0,
      completion: summary?.today.completion_rate || 0,
      growth: summary?.growth_rates.daily || 0,
      icon: <OrderIcon />,
      color: 'primary'
    },
    {
      title: 'Tuần này',
      orders: summary?.this_week.orders_count || 0,
      amount: summary?.this_week.total_amount || 0,
      completion: summary?.this_week.completion_rate || 0,
      growth: summary?.growth_rates.weekly || 0,
      icon: <CompletedIcon />,
      color: 'success'
    },
    {
      title: 'Tháng này',
      orders: summary?.this_month.orders_count || 0,
      amount: summary?.this_month.total_amount || 0,
      completion: summary?.this_month.completion_rate || 0,
      growth: summary?.growth_rates.monthly || 0,
      icon: <AnalyticsIcon />,
      color: 'info'
    }
  ];

  return (
    <Box sx={{ mb: 3 }}>
      {/* Header with actions */}
      <Stack
        direction={isMobile ? 'column' : 'row'}
        justifyContent="space-between"
        alignItems={isMobile ? 'stretch' : 'center'}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            <OrderIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Quản lý đơn hàng
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Theo dõi và quản lý toàn bộ đơn hàng từ tạo đến hoàn thành
          </Typography>
        </Box>

        <Stack direction={isMobile ? 'column' : 'row'} spacing={1}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            variant="outlined"
            disabled={loading}
            size={isMobile ? 'small' : 'medium'}
          >
            Làm mới
          </Button>
          
          <Button
            startIcon={<AnalyticsIcon />}
            onClick={onAnalytics}
            variant="outlined"
            disabled={loading}
            size={isMobile ? 'small' : 'medium'}
          >
            Phân tích
          </Button>
          
          <Button
            startIcon={<ExportIcon />}
            onClick={onExport}
            variant="outlined"
            disabled={loading}
            size={isMobile ? 'small' : 'medium'}
          >
            Xuất báo cáo
          </Button>
          
          <Button
            startIcon={<AddIcon />}
            onClick={onNewOrder}
            variant="contained"
            disabled={loading}
            size={isMobile ? 'small' : 'medium'}
          >
            Tạo đơn hàng
          </Button>
        </Stack>
      </Stack>

      {/* Stats Cards */}
      <Grid container spacing={2}>
        {statsCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index} component="div">
            <Card 
              sx={{ 
                background: `linear-gradient(135deg, ${theme.palette[card.color as keyof typeof theme.palette].light}, ${theme.palette[card.color as keyof typeof theme.palette].main})`,
                color: 'white',
                height: '100%'
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {card.icon}
                  </Box>
                  
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {card.title}
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {card.orders} đơn
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {formatCurrency(card.amount)}
                    </Typography>
                  </Box>
                </Stack>

                <Box sx={{ mt: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Hoàn thành: {card.completion.toFixed(1)}%
                    </Typography>
                    
                    <Chip
                      icon={<TrendingUpIcon />}
                      label={`${card.growth > 0 ? '+' : ''}${card.growth.toFixed(1)}%`}
                      size="small"
                      sx={{
                        bgcolor: card.growth > 0 ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Stats */}
      {summary && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Stack direction="row" spacing={4} flexWrap="wrap">
            <Box>
              <Typography variant="body2" color="text.secondary">
                So với hôm qua
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body1" fontWeight="medium">
                  {summary.today.orders_count} vs {summary.yesterday.orders_count}
                </Typography>
                <Chip
                  label={`${summary.growth_rates.daily > 0 ? '+' : ''}${summary.growth_rates.daily.toFixed(1)}%`}
                  color={summary.growth_rates.daily > 0 ? 'success' : 'error'}
                  size="small"
                />
              </Stack>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">
                Đơn hàng TB hôm qua
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatCurrency(summary.yesterday.average_order)}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">
                Tỷ lệ hoàn thành hôm qua
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {summary.yesterday.completion_rate.toFixed(1)}%
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">
                Đơn hàng TB/ngày (tuần)
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {Math.round(summary.this_week.orders_count / 7)} đơn
              </Typography>
            </Box>
          </Stack>
        </Box>
      )}
    </Box>
  );
};
