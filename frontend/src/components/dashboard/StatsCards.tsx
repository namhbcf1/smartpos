import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
  Avatar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  AttachMoney,
  BarChart,
  Inventory,
  People,
  ArrowForward,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  todaySales: number;
  weekSales: number;
  productCount: number;
  customerCount: number;
  trendPercent: number;
}

interface StatsCardsProps {
  stats: DashboardStats | null;
  formatCurrency: (amount: number) => string;
  formatPercentage: (value: number) => string;
  getTrendColor: (value: number) => string;
}

const StatsCards: React.FC<StatsCardsProps> = ({
  stats,
  formatCurrency,
  formatPercentage,
  getTrendColor,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const cardData = [
    {
      title: 'Doanh thu hôm nay',
      value: stats ? formatCurrency(stats.todaySales) : '0 ₫',
      trend: stats?.trendPercent || 0,
      icon: AttachMoney,
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      shadowColor: 'rgba(14, 165, 233, 0.3)',
      action: () => navigate('/sales'),
      actionText: 'Chi tiết',
      testId: 'revenue-card'
    },
    {
      title: 'Doanh thu tuần',
      value: stats ? formatCurrency(stats.weekSales) : '0 ₫',
      trend: 0,
      icon: BarChart,
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      shadowColor: 'rgba(168, 85, 247, 0.15)',
      action: () => navigate('/reports/revenue'),
      actionText: 'Xem báo cáo',
      testId: 'sales-card'
    },
    {
      title: 'Sản phẩm',
      value: stats?.productCount || 0,
      trend: 0,
      icon: Inventory,
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      shadowColor: 'rgba(34, 197, 94, 0.15)',
      action: () => navigate('/products'),
      actionText: 'Quản lý',
      testId: 'products-card'
    },
    {
      title: 'Khách hàng',
      value: stats?.customerCount || 0,
      trend: 0,
      icon: People,
      color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      shadowColor: 'rgba(6, 182, 212, 0.15)',
      action: () => navigate('/customers'),
      actionText: 'Xem tất cả',
      testId: 'customers-card'
    }
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {cardData.map((card, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card
            raised
            data-testid={card.testId}
            sx={{
              background: card.color,
              color: 'white',
              borderRadius: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 20px 25px -5px ${card.shadowColor}, 0 10px 10px -5px ${card.shadowColor}`
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="h5" sx={{ my: 0.5, fontWeight: 700 }}>
                    {card.value}
                  </Typography>
                  {card.trend !== 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {card.trend > 0 ? (
                        <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} />
                      ) : (
                        <TrendingDown sx={{ fontSize: 16, mr: 0.5 }} />
                      )}
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {formatPercentage(card.trend)}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Avatar
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    width: 56,
                    height: 56,
                    backdropFilter: 'blur(10px)',
                    boxShadow: `0 10px 15px -3px ${card.shadowColor}`
                  }}
                >
                  <card.icon />
                </Avatar>
              </Box>
            </CardContent>
            <CardActions sx={{ px: 2, pb: 2 }}>
              <Button
                size="small"
                endIcon={<ArrowForward fontSize="small" />}
                onClick={card.action}
                sx={{ 
                  fontWeight: 600,
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                {card.actionText}
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default StatsCards;
