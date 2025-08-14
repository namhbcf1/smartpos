import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Divider,
  Alert,
  Skeleton
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Receipt as ReceiptIcon,
  Print as PrintIcon,
  CheckCircle as PaidIcon,
  Schedule as PendingIcon,
  Cancel as CancelledIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  TrendingUp as ProfitIcon,
  Inventory as StockIcon,
  Category as CategoryIcon,
  QrCode as BarcodeIcon,
  AttachMoney as MoneyIcon,
  Percent as PercentIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { formatCurrency } from '../config/constants';
import api from '../services/api';

// Types
interface SaleDetail {
  id: number;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  payment_method: string;
  payment_status: string;
  notes: string | null;
  cashier_id: number;
  sales_agent_id: number;
  cashier_name: string;
  cashier_username: string;
  cashier_email: string;
  cashier_role: string;
  created_at: string;
  updated_at: string;
}

interface SaleItem {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  barcode: string;
  product_description: string;
  current_price: number;
  cost_price: number;
  stock_quantity: number;
  tax_rate: number;
  category_name: string;
  category_description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  profit_amount: number;
  profit_margin_percent: number;
}

const SaleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch sale details
  useEffect(() => {
    const fetchSaleDetails = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await api.get<{
          success: boolean;
          data: {
            order: SaleDetail;
            items: SaleItem[];
          };
          message: string;
        }>(`/sales/${id}`);

        console.log('SaleDetail API response:', response);

        if (response.success && response.data) {
          setSale(response.data.order);
          setItems(response.data.items);
        } else {
          setError(response.message || 'Không tìm thấy đơn hàng');
        }
      } catch (error) {
        console.error('Fetch sale details error:', error);
        setError('Lỗi khi tải chi tiết đơn hàng');
        enqueueSnackbar('Lỗi khi tải chi tiết đơn hàng', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchSaleDetails();
  }, [id, enqueueSnackbar]);

  // Helper functions
  const getPaymentStatusChip = (status: string) => {
    const statusConfig = {
      paid: { label: 'Đã thanh toán', color: 'success' as const, icon: <PaidIcon /> },
      pending: { label: 'Chờ thanh toán', color: 'warning' as const, icon: <PendingIcon /> },
      cancelled: { label: 'Đã hủy', color: 'error' as const, icon: <CancelledIcon /> }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Chip
        label={config.label}
        color={config.color}
        icon={config.icon}
        size="small"
      />
    );
  };

  const getPaymentMethodText = (method: string) => {
    const methods = {
      cash: 'Tiền mặt',
      card: 'Thẻ',
      transfer: 'Chuyển khoản',
      qr: 'QR Code'
    };
    return methods[method as keyof typeof methods] || method;
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Skeleton variant="text" width={300} height={40} />
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={200} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={200} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error || !sale) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="error">
          {error || 'Không tìm thấy đơn hàng'}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate('/sales')}
          sx={{ mt: 2 }}
        >
          Quay lại
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptIcon />
          Chi tiết đơn hàng #{sale.id}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={() => navigate('/sales')}
          >
            Quay lại
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            In hóa đơn
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Sale Information */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Thông tin đơn hàng
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Mã đơn hàng
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  #{sale.id}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Trạng thái
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  {getPaymentStatusChip(sale.payment_status)}
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Phương thức thanh toán
                </Typography>
                <Typography variant="body1">
                  {getPaymentMethodText(sale.payment_method)}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Ngày tạo
                </Typography>
                <Typography variant="body1">
                  {new Date(sale.created_at).toLocaleString('vi-VN')}
                </Typography>
              </Box>

              {sale.notes && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Ghi chú
                  </Typography>
                  <Typography variant="body1">
                    {sale.notes}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Customer Information */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Thông tin khách hàng
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Tên khách hàng
                  </Typography>
                  <Typography variant="body1">
                    {sale.customer_name || 'Khách vãng lai'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Số điện thoại
                  </Typography>
                  <Typography variant="body1">
                    {sale.customer_phone || '-'}
                  </Typography>
                </Grid>

                {sale.customer_email && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {sale.customer_email}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Cashier Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BadgeIcon color="primary" />
                Thông tin người bán
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Tên nhân viên
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {sale.cashier_name || 'Không xác định'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <BadgeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Username
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    @{sale.cashier_username || 'unknown'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {sale.cashier_email || '-'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <BadgeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Vai trò
                    </Typography>
                  </Box>
                  <Chip
                    label={sale.cashier_role === 'admin' ? 'Quản trị viên' :
                          sale.cashier_role === 'manager' ? 'Quản lý' :
                          sale.cashier_role === 'cashier' ? 'Thu ngân' :
                          sale.cashier_role === 'inventory' ? 'Kho' : sale.cashier_role}
                    size="small"
                    color={sale.cashier_role === 'admin' ? 'error' :
                           sale.cashier_role === 'manager' ? 'warning' : 'primary'}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tóm tắt đơn hàng
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Tạm tính
                  </Typography>
                  <Typography variant="body1">
                    {formatCurrency(sale.total_amount - sale.tax_amount)}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Thuế VAT
                  </Typography>
                  <Typography variant="body1">
                    {formatCurrency(sale.tax_amount)}
                  </Typography>
                </Grid>

                {sale.discount_amount > 0 && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Giảm giá
                    </Typography>
                    <Typography variant="body1" color="error">
                      -{formatCurrency(sale.discount_amount)}
                    </Typography>
                  </Grid>
                )}

                {/* Profit Information */}
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ProfitIcon sx={{ fontSize: 16 }} />
                    Tổng lợi nhuận
                  </Typography>
                  <Typography variant="body1" color="success.main" fontWeight={600}>
                    {formatCurrency(items.reduce((sum, item) => sum + item.profit_amount, 0))}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PercentIcon sx={{ fontSize: 16 }} />
                    Tỷ suất lợi nhuận
                  </Typography>
                  <Typography variant="body1" color="success.main" fontWeight={600}>
                    {items.length > 0 ?
                      ((items.reduce((sum, item) => sum + item.profit_amount, 0) /
                        items.reduce((sum, item) => sum + (item.cost_price * item.quantity), 0)) * 100).toFixed(2)
                      : 0}%
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                      Tổng cộng
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(sale.total_amount)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Order Items */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Chi tiết sản phẩm
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Sản phẩm</TableCell>
                      <TableCell align="center">Số lượng</TableCell>
                      <TableCell align="right">Đơn giá</TableCell>
                      <TableCell align="right">Thành tiền</TableCell>
                      <TableCell align="right">Lợi nhuận</TableCell>
                      <TableCell align="center">Tồn kho</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight={500} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CategoryIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                              {item.product_name}
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <BarcodeIcon sx={{ fontSize: 12 }} />
                                SKU: {item.product_sku}
                              </Typography>
                              {item.barcode && (
                                <Typography variant="caption" color="text.secondary">
                                  Barcode: {item.barcode}
                                </Typography>
                              )}
                            </Box>

                            {item.category_name && (
                              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                                📂 {item.category_name}
                              </Typography>
                            )}

                            {item.product_description && (
                              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                                {item.product_description}
                              </Typography>
                            )}

                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                              <Chip
                                label={`Giá hiện tại: ${formatCurrency(item.current_price)}`}
                                size="small"
                                variant="outlined"
                                color="info"
                              />
                              <Chip
                                label={`Giá vốn: ${formatCurrency(item.cost_price)}`}
                                size="small"
                                variant="outlined"
                                color="warning"
                              />
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell align="center">
                          <Chip
                            label={item.quantity}
                            size="small"
                            color="primary"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>

                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            {formatCurrency(item.unit_price)}
                          </Typography>
                          {item.unit_price !== item.current_price && (
                            <Typography variant="caption" color="text.secondary">
                              (Hiện tại: {formatCurrency(item.current_price)})
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600} color="primary.main">
                            {formatCurrency(item.total_price)}
                          </Typography>
                        </TableCell>

                        <TableCell align="right">
                          <Box>
                            <Typography variant="body2" fontWeight={600} color="success.main" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                              <ProfitIcon sx={{ fontSize: 16 }} />
                              {formatCurrency(item.profit_amount)}
                            </Typography>
                            <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                              <PercentIcon sx={{ fontSize: 12 }} />
                              {item.profit_margin_percent}%
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell align="center">
                          <Chip
                            label={item.stock_quantity}
                            size="small"
                            color={item.stock_quantity > 10 ? 'success' : item.stock_quantity > 0 ? 'warning' : 'error'}
                            icon={<StockIcon />}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SaleDetail;