import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Box,
  Typography,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Stack,
  Button,
  Avatar
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Receipt as ReceiptIcon,
  Undo as RefundIcon,
  MoreVert as MoreVertIcon,
  AttachMoney as CashIcon,
  CreditCard as CardIcon,
  AccountBalance as TransferIcon,
  QrCode as QrIcon,
  CheckCircle as PaidIcon,
  Schedule as PendingIcon,
  Cancel as CancelledIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { formatCurrency, formatDate, formatDateShort } from '../../../config/constants';
import { Sale } from './types';

interface SalesTableProps {
  sales: Sale[];
  onViewDetails: (sale: Sale) => void;
  onPrintReceipt: (sale: Sale) => void;
  onRefund: (sale: Sale) => void;
  loading: boolean;
}

export const SalesTable: React.FC<SalesTableProps> = ({
  sales,
  onViewDetails,
  onPrintReceipt,
  onRefund,
  loading: _loading
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedSale, setSelectedSale] = React.useState<Sale | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, sale: Sale) => {
    setAnchorEl(event.currentTarget);
    setSelectedSale(sale);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSale(null);
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'partial': return 'info';
      case 'refunded': return 'secondary';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Đã thanh toán';
      case 'pending': return 'Chờ thanh toán';
      case 'partial': return 'Thanh toán một phần';
      case 'refunded': return 'Đã hoàn tiền';
      case 'cancelled': return 'Đã hủy';
      default: return 'Không xác định';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <PaidIcon />;
      case 'pending': return <PendingIcon />;
      case 'partial': return <PendingIcon />;
      case 'refunded': return <RefundIcon />;
      case 'cancelled': return <CancelledIcon />;
      default: return <PendingIcon />;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <CashIcon />;
      case 'card': return <CardIcon />;
      case 'bank_transfer': return <TransferIcon />;
      case 'e_wallet': return <QrIcon />;
      case 'qr': return <QrIcon />;
      default: return <CashIcon />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Tiền mặt';
      case 'card': return 'Thẻ';
      case 'bank_transfer': return 'Chuyển khoản';
      case 'e_wallet': return 'Ví điện tử';
      case 'qr': return 'QR Code';
      case 'multiple': return 'Nhiều phương thức';
      default: return 'Không xác định';
    }
  };

  if (isMobile) {
    // Mobile card layout
    return (
      <Box>
        {Array.isArray(sales) ? sales.map((sale) => (
          <Card key={sale.id} sx={{ mb: 2 }}>
            <CardContent>
              <Stack spacing={2}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      #{sale.order_number}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(sale.created_at)}
                    </Typography>
                  </Box>
                  
                  <IconButton
                    onClick={(e) => handleMenuOpen(e, sale)}
                    size="small"
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                {/* Customer & Cashier */}
                <Stack direction="row" spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24 }}>
                      <PersonIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {sale.customer_name || 'Khách lẻ'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Thu ngân: {sale.user_id || 'Chưa có thông tin'}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>

                {/* Amount & Items */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Tổng tiền
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      {formatCurrency(sale.total_cents / 100)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Số sản phẩm
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {sale.items?.length || 0} sản phẩm
                    </Typography>
                  </Box>
                </Box>

                {/* Payment Status & Method */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    icon={getPaymentStatusIcon(sale.status)}
                    label={getPaymentStatusLabel(sale.status)}
                    color={getPaymentStatusColor(sale.status) as any}
                    size="small"
                  />
                  
                  <Chip
                    icon={getPaymentMethodIcon(sale.payments?.[0]?.payment_method_id || 'cash')}
                    label={getPaymentMethodLabel(sale.payments?.[0]?.payment_method_id || 'cash')}
                    variant="outlined"
                    size="small"
                  />
                </Box>

                {/* Actions */}
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onViewDetails(sale)}
                    fullWidth
                  >
                    Xem chi tiết
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => onPrintReceipt(sale)}
                    fullWidth
                  >
                    In hóa đơn
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        )) : (
          <Card>
            <CardContent>
              <Typography align="center" color="text.secondary">
                Không có dữ liệu bán hàng
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  }

  // Desktop table layout
  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Mã đơn hàng</TableCell>
              <TableCell>Khách hàng</TableCell>
              <TableCell>Thu ngân</TableCell>
              <TableCell align="right">Tổng tiền</TableCell>
              <TableCell align="center">Sản phẩm</TableCell>
              <TableCell align="center">Thanh toán</TableCell>
              <TableCell align="center">Phương thức</TableCell>
              <TableCell>Thời gian</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(sales) && sales.length > 0 ? sales.map((sale) => (
              <TableRow key={sale.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    #{sale.order_number}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {sale.customer_name || 'Khách lẻ'}
                    </Typography>
                    {sale.customer_phone && (
                      <Typography variant="caption" color="text.secondary">
                        {sale.customer_phone}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {sale.user_id || 'Chưa có thông tin'}
                  </Typography>
                </TableCell>
                
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    {formatCurrency(sale.total_cents / 100)}
                  </Typography>
                  {(sale.discount_cents / 100) > 0 && (
                    <Typography variant="caption" color="secondary">
                      Giảm: {formatCurrency(sale.discount_cents / 100)}
                    </Typography>
                  )}
                </TableCell>
                
                <TableCell align="center">
                  <Typography variant="body2">
                    {sale.items?.length || 0}
                  </Typography>
                </TableCell>
                
                <TableCell align="center">
                  <Chip
                    icon={getPaymentStatusIcon(sale.status)}
                    label={getPaymentStatusLabel(sale.status)}
                    color={getPaymentStatusColor(sale.status) as any}
                    size="small"
                  />
                </TableCell>
                
                <TableCell align="center">
                  <Chip
                    icon={getPaymentMethodIcon(sale.payments?.[0]?.payment_method_id || 'cash')}
                    label={getPaymentMethodLabel(sale.payments?.[0]?.payment_method_id || 'cash')}
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      {formatDateShort(sale.created_at)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(sale.created_at).split(' ').slice(-1)[0]} {/* Extract time part */}
                    </Typography>
                  </Box>
                </TableCell>
                
                <TableCell align="center">
                  <IconButton
                    onClick={(e) => handleMenuOpen(e, sale)}
                    size="small"
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="text.secondary">
                    Không có dữ liệu bán hàng
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedSale) onViewDetails(selectedSale);
          handleMenuClose();
        }}>
          <ViewIcon sx={{ mr: 1 }} />
          Xem chi tiết
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedSale) onPrintReceipt(selectedSale);
          handleMenuClose();
        }}>
          <ReceiptIcon sx={{ mr: 1 }} />
          In hóa đơn
        </MenuItem>
        {selectedSale?.status === 'completed' && (
          <MenuItem 
            onClick={() => {
              if (selectedSale) onRefund(selectedSale);
              handleMenuClose();
            }}
            sx={{ color: 'warning.main' }}
          >
            <RefundIcon sx={{ mr: 1 }} />
            Hoàn tiền
          </MenuItem>
        )}
      </Menu>
    </>
  );
};
