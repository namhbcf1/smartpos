import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  ShoppingCart as ShoppingCartIcon,
  AccountBalanceWallet as WalletIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../config/constants';

interface Customer {
  id: number;
  full_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  customer_type: 'individual' | 'business';
  company_name?: string;
  tax_number?: string;
  loyalty_points: number;
  total_spent: number;
  total_orders: number;
  last_order_date?: string;
  created_at: string;
  notes?: string;
  is_vip?: boolean;
  vip_level?: string;
}

interface CustomerOrder {
  id: number;
  receipt_number: string;
  total_amount: number;
  payment_status: string;
  created_at: string;
  items_count: number;
}

const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchCustomerDetails();
    }
  }, [id]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch customer details
      const customerData = await api.get<Customer>(`/customers/${id}`);
      setCustomer(customerData);

      // Fetch customer orders
      const ordersData = await api.get<CustomerOrder[]>(`/customers/${id}/orders`);
      setOrders(ordersData || []);

    } catch (err) {
      console.error('Error fetching customer details:', err);
      setError('Không thể tải thông tin khách hàng');
      enqueueSnackbar('Lỗi khi tải thông tin khách hàng', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getLoyaltyTier = (totalSpent: number) => {
    if (totalSpent >= 100000000) return { tier: 'Kim cương', color: '#E1F5FE' };
    if (totalSpent >= 50000000) return { tier: 'Bạch kim', color: '#F3E5F5' };
    if (totalSpent >= 20000000) return { tier: 'Vàng', color: '#FFF8E1' };
    if (totalSpent >= 5000000) return { tier: 'Bạc', color: '#FAFAFA' };
    return { tier: 'Đồng', color: '#EFEBE9' };
  };

  const handleEdit = () => {
    navigate(`/customers/${id}/edit`);
  };

  const handleBack = () => {
    navigate('/customers');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !customer) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Không tìm thấy thông tin khách hàng'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          variant="outlined"
        >
          Quay lại danh sách
        </Button>
      </Box>
    );
  }

  const loyaltyTier = getLoyaltyTier(customer.total_spent);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={handleBack}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight="bold">
            Chi tiết khách hàng
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={handleEdit}
        >
          Chỉnh sửa
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Customer Info Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mb: 2,
                    bgcolor: customer.customer_type === 'business' ? 'primary.main' : 'secondary.main'
                  }}
                >
                  {customer.customer_type === 'business' ? <BusinessIcon /> : <PersonIcon />}
                </Avatar>
                <Typography variant="h5" fontWeight="bold" textAlign="center">
                  {customer.full_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  {customer.customer_type === 'business' ? 'Doanh nghiệp' : 'Cá nhân'}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Contact Info */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Thông tin liên hệ
                </Typography>

                {customer.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2">{customer.phone}</Typography>
                  </Box>
                )}

                {customer.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2">{customer.email}</Typography>
                  </Box>
                )}

                {customer.address && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                    <LocationIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {customer.address}
                      {customer.city && `, ${customer.city}`}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Business Info */}
              {customer.customer_type === 'business' && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Thông tin doanh nghiệp
                  </Typography>
                  {customer.company_name && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Tên công ty:</strong> {customer.company_name}
                    </Typography>
                  )}
                  {customer.tax_number && (
                    <Typography variant="body2">
                      <strong>Mã số thuế:</strong> {customer.tax_number}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Loyalty Info */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Thông tin thành viên
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2">Hạng thành viên:</Typography>
                  <Chip
                    icon={<StarIcon />}
                    label={loyaltyTier.tier}
                    size="small"
                    sx={{ bgcolor: loyaltyTier.color }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2">Điểm tích lũy:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {customer.loyalty_points.toLocaleString('vi-VN')} điểm
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Ngày tham gia:</Typography>
                  <Typography variant="body2">
                    {formatDate(customer.created_at)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Stats and Orders */}
        <Grid item xs={12} md={8}>
          {/* Stats Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <ShoppingCartIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {customer.total_orders}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng đơn hàng
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <WalletIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(customer.total_spent)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng chi tiêu
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <CalendarIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6" fontWeight="bold">
                    {customer.last_order_date ? formatDate(customer.last_order_date) : 'Chưa có'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Đơn hàng cuối
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Recent Orders */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Đơn hàng gần đây
              </Typography>

              {orders.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Mã đơn</TableCell>
                        <TableCell align="right">Tổng tiền</TableCell>
                        <TableCell align="center">Trạng thái</TableCell>
                        <TableCell align="center">Ngày tạo</TableCell>
                        <TableCell align="center">Sản phẩm</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orders.slice(0, 10).map((order) => (
                        <TableRow key={order.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              #{order.receipt_number}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold">
                              {formatCurrency(order.total_amount)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={
                                order.payment_status === 'paid' ? 'Đã thanh toán' :
                                order.payment_status === 'pending' ? 'Chờ thanh toán' :
                                'Đã hủy'
                              }
                              color={
                                order.payment_status === 'paid' ? 'success' :
                                order.payment_status === 'pending' ? 'warning' :
                                'error'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {formatDate(order.created_at)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {order.items_count} sản phẩm
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  Khách hàng chưa có đơn hàng nào
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {customer.notes && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Ghi chú
                </Typography>
                <Typography variant="body2">
                  {customer.notes}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default CustomerDetail;
