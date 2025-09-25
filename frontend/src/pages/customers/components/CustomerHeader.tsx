import React from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  useTheme,
  useMediaQuery,
  Chip,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  FileDownload as ExportIcon,
  FileUpload as ImportIcon,
  Refresh as RefreshIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { CustomerStats } from './types';
import { formatCurrency } from '../../../config/constants';

interface CustomerHeaderProps {
  stats: CustomerStats | null;
  onAddCustomer: () => void;
  onImport: () => void;
  onExport: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export const CustomerHeader: React.FC<CustomerHeaderProps> = ({
  stats,
  onAddCustomer,
  onImport,
  onExport,
  onRefresh,
  loading
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const statsCards = [
    {
      title: 'Tổng khách hàng',
      value: stats?.total_customers || 0,
      icon: <PeopleIcon />,
      color: 'primary'
    },
    {
      title: 'Khách hàng hoạt động',
      value: stats?.active_customers || 0,
      icon: <TrendingUpIcon />,
      color: 'success'
    },
    {
      title: 'Khách hàng mới (tháng)',
      value: stats?.new_customers_this_month || 0,
      icon: <StarIcon />,
      color: 'info'
    },
    {
      title: 'Giá trị đơn hàng TB',
      value: formatCurrency(stats?.average_order_value || 0),
      icon: <MoneyIcon />,
      color: 'warning'
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
            <PeopleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Quản lý khách hàng
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quản lý thông tin và theo dõi hoạt động của khách hàng
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
            startIcon={<ImportIcon />}
            onClick={onImport}
            variant="outlined"
            disabled={loading}
            size={isMobile ? 'small' : 'medium'}
          >
            Nhập Excel
          </Button>
          
          <Button
            startIcon={<ExportIcon />}
            onClick={onExport}
            variant="outlined"
            disabled={loading}
            size={isMobile ? 'small' : 'medium'}
          >
            Xuất dữ liệu
          </Button>
          
          <Button
            startIcon={<AddIcon />}
            onClick={onAddCustomer}
            variant="contained"
            disabled={loading}
            size={isMobile ? 'small' : 'medium'}
          >
            Thêm khách hàng
          </Button>
        </Stack>
      </Stack>

      {/* Stats Cards */}
      <Grid container spacing={2}>
        {statsCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index} component="div">
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
                      {card.value}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Additional Stats */}
      {stats && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Stack direction="row" spacing={4} flexWrap="wrap">
            <Box>
              <Typography variant="body2" color="text.secondary">
                Tỷ lệ tăng trưởng
              </Typography>
              <Chip
                label={`${stats.customer_growth_rate > 0 ? '+' : ''}${stats.customer_growth_rate.toFixed(1)}%`}
                color={stats.customer_growth_rate > 0 ? 'success' : 'error'}
                size="small"
              />
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">
                Tỷ lệ giữ chân
              </Typography>
              <Chip
                label={`${stats.retention_rate.toFixed(1)}%`}
                color={stats.retention_rate > 70 ? 'success' : stats.retention_rate > 50 ? 'warning' : 'error'}
                size="small"
              />
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">
                Tổng điểm thưởng
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {stats.total_loyalty_points.toLocaleString()} điểm
              </Typography>
            </Box>
          </Stack>
        </Box>
      )}
    </Box>
  );
};
