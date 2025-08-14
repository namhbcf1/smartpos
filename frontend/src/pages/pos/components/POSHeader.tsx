import React from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Card,
  CardContent
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Receipt as ReceiptIcon,
  Refresh as RefreshIcon,
  QrCodeScanner as BarcodeIcon,
  History as HistoryIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { formatCurrency } from '../../../config/constants';
import { Customer, SalesSummary } from './types';

interface POSHeaderProps {
  customer?: Customer;
  cartItemsCount: number;
  cartTotal: number;
  salesSummary?: SalesSummary;
  onCustomerSelect: () => void;
  onBarcodeScanner: () => void;
  onSettings: () => void;
  onSalesHistory: () => void;
  onDashboard: () => void;
  onRefresh: () => void;
  cashierName: string;
  storeName: string;
}

export const POSHeader: React.FC<POSHeaderProps> = ({
  customer,
  cartItemsCount,
  cartTotal,
  salesSummary,
  onCustomerSelect,
  onBarcodeScanner,
  onSettings,
  onSalesHistory,
  onDashboard,
  onRefresh,
  cashierName,
  storeName
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ mb: 3 }}>
      {/* Main Header */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: 2 }}>
          <Stack
            direction={isMobile ? 'column' : 'row'}
            justifyContent="space-between"
            alignItems={isMobile ? 'stretch' : 'center'}
            spacing={2}
          >
            {/* Left Section - Store Info */}
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                <CartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Điểm bán hàng
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Cửa hàng: <strong>{storeName}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Thu ngân: <strong>{cashierName}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date().toLocaleDateString('vi-VN')}
                </Typography>
              </Stack>
            </Box>

            {/* Right Section - Actions */}
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Tooltip title="Quét mã vạch">
                <IconButton
                  onClick={onBarcodeScanner}
                  color="primary"
                  sx={{ 
                    bgcolor: 'primary.light',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.main' }
                  }}
                >
                  <BarcodeIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Lịch sử bán hàng">
                <IconButton
                  onClick={onSalesHistory}
                  color="info"
                  sx={{ 
                    bgcolor: 'info.light',
                    color: 'white',
                    '&:hover': { bgcolor: 'info.main' }
                  }}
                >
                  <HistoryIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Dashboard">
                <IconButton
                  onClick={onDashboard}
                  color="success"
                  sx={{ 
                    bgcolor: 'success.light',
                    color: 'white',
                    '&:hover': { bgcolor: 'success.main' }
                  }}
                >
                  <DashboardIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Cài đặt">
                <IconButton
                  onClick={onSettings}
                  color="secondary"
                  sx={{ 
                    bgcolor: 'secondary.light',
                    color: 'white',
                    '&:hover': { bgcolor: 'secondary.main' }
                  }}
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Làm mới">
                <IconButton
                  onClick={onRefresh}
                  color="default"
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Customer & Cart Info */}
      <Stack
        direction={isMobile ? 'column' : 'row'}
        spacing={2}
        alignItems={isMobile ? 'stretch' : 'center'}
      >
        {/* Customer Section */}
        <Card sx={{ flexGrow: 1 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: customer ? 'success.main' : 'grey.400' }}>
                <PersonIcon />
              </Avatar>
              
              <Box sx={{ flexGrow: 1 }}>
                {customer ? (
                  <>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {customer.name}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        {customer.phone}
                      </Typography>
                      {customer.is_vip && (
                        <Chip label="VIP" size="small" color="warning" />
                      )}
                      <Typography variant="body2" color="primary">
                        {customer.loyalty_points} điểm
                      </Typography>
                    </Stack>
                  </>
                ) : (
                  <Typography variant="body1" color="text.secondary">
                    Chưa chọn khách hàng
                  </Typography>
                )}
              </Box>
              
              <Button
                variant={customer ? "outlined" : "contained"}
                onClick={onCustomerSelect}
                size="small"
              >
                {customer ? "Đổi KH" : "Chọn KH"}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Cart Summary */}
        <Card>
          <CardContent sx={{ py: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <CartIcon />
              </Avatar>
              
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {cartItemsCount} sản phẩm
                </Typography>
                <Typography variant="h6" color="primary" fontWeight="bold">
                  {formatCurrency(cartTotal)}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Today's Sales Summary */}
        {salesSummary && (
          <Card>
            <CardContent sx={{ py: 1.5 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <ReceiptIcon />
                </Avatar>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Hôm nay
                  </Typography>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {salesSummary.total_sales} đơn
                  </Typography>
                  <Typography variant="body2" color="success.main" fontWeight="bold">
                    {formatCurrency(salesSummary.total_amount)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
};
