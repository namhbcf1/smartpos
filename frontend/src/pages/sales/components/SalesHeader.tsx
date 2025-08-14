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
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as CartIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { formatCurrency } from '../../../config/constants';
import { SalesSummary } from './types';

interface SalesHeaderProps {
  summary: SalesSummary | null;
  onNewSale: () => void;
  onExport: () => void;
  onRefresh: () => void;
  onAnalytics: () => void;
  loading: boolean;
}

export const SalesHeader: React.FC<SalesHeaderProps> = ({
  summary,
  onNewSale,
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
      sales: summary?.today?.sales_count || 0,
      amount: summary?.today?.total_amount || 0,
      average: summary?.today?.average_sale || 0,
      growth: summary?.growth_rates?.daily || 0,
      icon: <ReceiptIcon />,
      color: 'primary'
    },
    {
      title: 'Tuần này',
      sales: summary?.this_week?.sales_count || 0,
      amount: summary?.this_week?.total_amount || 0,
      average: summary?.this_week?.average_sale || 0,
      growth: summary?.growth_rates?.weekly || 0,
      icon: <CartIcon />,
      color: 'success'
    },
    {
      title: 'Tháng này',
      sales: summary?.this_month?.sales_count || 0,
      amount: summary?.this_month?.total_amount || 0,
      average: summary?.this_month?.average_sale || 0,
      growth: summary?.growth_rates?.monthly || 0,
      icon: <MoneyIcon />,
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
            <ReceiptIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Lịch sử bán hàng
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Theo dõi và quản lý tất cả các giao dịch bán hàng
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
            onClick={onNewSale}
            variant="contained"
            disabled={loading}
            size={isMobile ? 'small' : 'medium'}
          >
            Bán hàng mới
          </Button>
        </Stack>
      </Stack>

      {/* Stats Cards */}
      <Grid container spacing={2}>
        {statsCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
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
                      {card.sales} đơn
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {formatCurrency(card.amount)}
                    </Typography>
                  </Box>
                </Stack>

                <Box sx={{ mt: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      TB: {formatCurrency(card.average)}
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
                  {summary?.today?.sales_count || 0} vs {summary?.yesterday?.sales_count || 0}
                </Typography>
                <Chip
                  label={`${(summary?.growth_rates?.daily || 0) > 0 ? '+' : ''}${(summary?.growth_rates?.daily || 0).toFixed(1)}%`}
                  color={(summary?.growth_rates?.daily || 0) > 0 ? 'success' : 'error'}
                  size="small"
                />
              </Stack>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">
                Doanh thu hôm qua
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatCurrency(summary?.yesterday?.total_amount || 0)}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">
                Đơn hàng TB/ngày (tuần)
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {Math.round((summary?.this_week?.sales_count || 0) / 7)} đơn
              </Typography>
            </Box>
          </Stack>
        </Box>
      )}
    </Box>
  );
};
