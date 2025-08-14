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
  Edit as EditIcon,
  CheckCircle as PaidIcon,
  Schedule as PendingIcon,
  Cancel as CancelledIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { formatCurrency } from '../config/constants';

// Types
interface OrderDetail {
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
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  category_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/v1/sales/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Lỗi khi tải chi tiết đơn hàng');
        }

        const result = await response.json();
        setOrder(result.data.order);
        setItems(result.data.items);
      } catch (error) {
        console.error('Fetch order details error:', error);
        setError(error instanceof Error ? error.message : 'Lỗi khi tải chi tiết đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id]);

  // Payment status chip
  const getPaymentStatusChip = (status: string) => {
    switch (status) {
      case 'paid':
        return <Chip icon={<PaidIcon />} label="Đã thanh toán" color="success" />;
      case 'pending':
        return <Chip icon={<PendingIcon />} label="Chờ thanh toán" color="warning" />;
      case 'cancelled':
        return <Chip icon={<CancelledIcon />} label="Đã hủy" color="error" />;
      default:
        return <Chip label={status} />;
    }
  };

  // Handle print receipt
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Skeleton variant="rectangular" width="100%" height={400} />
      </Container>
    );
  }

  if (error || !order) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="error">
          {error || 'Không tìm thấy đơn hàng'}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate('/orders')}
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
          Chi tiết đơn hàng #{order.id}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={() => navigate('/orders')}
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
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/orders/${order.id}/edit`)}
            disabled={order.payment_status === 'cancelled'}
          >
            Chỉnh sửa
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Order Information */}
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
                  #{order.id}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Trạng thái
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  {getPaymentStatusChip(order.payment_status)}
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Phương thức thanh toán
                </Typography>
                <Typography variant="body1">
                  {order.payment_method === 'cash' ? 'Tiền mặt' :
                   order.payment_method === 'card' ? 'Thẻ' :
                   order.payment_method === 'transfer' ? 'Chuyển khoản' :
                   order.payment_method === 'qr' ? 'QR Code' : order.payment_method}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Ngày tạo
                </Typography>
                <Typography variant="body1">
                  {new Date(order.created_at).toLocaleString('vi-VN')}
                </Typography>
              </Box>

              {order.updated_at !== order.created_at && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Cập nhật lần cuối
                  </Typography>
                  <Typography variant="body1">
                    {new Date(order.updated_at).toLocaleString('vi-VN')}
                  </Typography>
                </Box>
              )}

              {order.notes && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Ghi chú
                  </Typography>
                  <Typography variant="body1">
                    {order.notes}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Customer Information */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Thông tin khách hàng
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Tên khách hàng
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {order.customer_name || 'Khách vãng lai'}
                </Typography>
              </Box>

              {order.customer_phone && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Số điện thoại
                  </Typography>
                  <Typography variant="body1">
                    {order.customer_phone}
                  </Typography>
                </Box>
              )}

              {order.customer_email && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">
                    {order.customer_email}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Order Summary */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tổng kết đơn hàng
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">
                  Tạm tính:
                </Typography>
                <Typography variant="body2">
                  {formatCurrency(order.total_amount - order.tax_amount + order.discount_amount)}
                </Typography>
              </Box>

              {order.discount_amount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="error.main">
                    Giảm giá:
                  </Typography>
                  <Typography variant="body2" color="error.main">
                    -{formatCurrency(order.discount_amount)}
                  </Typography>
                </Box>
              )}

              {order.tax_amount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    Thuế:
                  </Typography>
                  <Typography variant="body2">
                    {formatCurrency(order.tax_amount)}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 1 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" fontWeight={600}>
                  Tổng cộng:
                </Typography>
                <Typography variant="h6" fontWeight={600} color="primary.main">
                  {formatCurrency(order.total_amount)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Order Items */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Chi tiết sản phẩm ({items.length} sản phẩm)
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Sản phẩm</TableCell>
                      <TableCell align="right">Số lượng</TableCell>
                      <TableCell align="right">Đơn giá</TableCell>
                      <TableCell align="right">Thành tiền</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {item.product_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              SKU: {item.product_sku}
                            </Typography>
                            {item.category_name && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                Danh mục: {item.category_name}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            {item.quantity}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {formatCurrency(item.unit_price)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600} color="primary.main">
                            {formatCurrency(item.total_price)}
                          </Typography>
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

export default OrderDetail;
