import React, { useState, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tooltip,
  CircularProgress,
  Divider,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Assignment as OrderIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  GetApp as ExportIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { formatCurrency } from '../config/constants';
import { usePaginatedQuery } from '../hooks/useApiData';
import api from '../services/api';

// Types
interface Order {
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
  quantity: number;
  unit_price: number;
  total_price: number;
  category_name: string;
}

interface OrderDetails {
  order: Order;
  items: OrderItem[];
}

const Orders = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {};

    if (searchTerm.trim()) {
      params.search = searchTerm.trim();
    }

    if (paymentMethodFilter) {
      params.payment_method = paymentMethodFilter;
    }

    if (paymentStatusFilter) {
      params.payment_status = paymentStatusFilter;
    }

    return params;
  }, [searchTerm, paymentMethodFilter, paymentStatusFilter]);

  // Fetch orders data using the same hook as Sales page
  const {
    data: orders,
    pagination,
    isLoading: loading,
    error,
    refetch,
    handlePageChange,
    handleLimitChange,
    page: currentPage,
    limit: currentLimit
  } = usePaginatedQuery<Order>('/sales', queryParams);

  // Calculate statistics from current orders
  const stats = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        completedOrders: 0
      };
    }

    return {
      totalOrders: pagination?.total || 0,
      totalRevenue: orders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
      pendingOrders: orders.filter(order => order.payment_status === 'pending').length,
      completedOrders: orders.filter(order => order.payment_status === 'paid').length
    };
  }, [orders, pagination]);



  // Fetch order details
  const fetchOrderDetails = async (orderId: number) => {
    try {
      const response = await api.get<OrderDetails>(`/sales/${orderId}`);
      if (response.success) {
        setSelectedOrder(response.data);
        setOpenDetailsDialog(true);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      enqueueSnackbar('Lỗi khi tải chi tiết đơn hàng', { variant: 'error' });
    }
  };

  // Update order status
  const updateOrderStatus = async () => {
    if (!selectedOrder) return;

    try {
      setUpdateLoading(true);
      const response = await api.put(`/sales/${selectedOrder.order.id}/status`, {
        payment_status: newStatus,
        notes: statusNotes
      });

      if (response.success) {
        enqueueSnackbar('Cập nhật trạng thái đơn hàng thành công', { variant: 'success' });
        setOpenStatusDialog(false);
        setNewStatus('');
        setStatusNotes('');
        refetch();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      enqueueSnackbar('Lỗi khi cập nhật trạng thái đơn hàng', { variant: 'error' });
    } finally {
      setUpdateLoading(false);
    }
  };

  // Delete order
  const deleteOrder = async (orderId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;

    try {
      const response = await api.delete(`/sales/${orderId}`);
      if (response.success) {
        enqueueSnackbar('Hủy đơn hàng thành công', { variant: 'success' });
        refetch();
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      enqueueSnackbar('Lỗi khi hủy đơn hàng', { variant: 'error' });
    }
  };



  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Đã thanh toán';
      case 'pending': return 'Chờ thanh toán';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash': return 'Tiền mặt';
      case 'card': return 'Thẻ';
      case 'bank_transfer': return 'Chuyển khoản';
      default: return method;
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPaymentStatusFilter('');
    setPaymentMethodFilter('');
  };

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: { xs: 1, sm: 2 },
        px: { xs: 1, sm: 2, md: 3 },
        minHeight: '100vh',
        bgcolor: 'grey.50'
      }}
    >
      {/* Header */}
      <Paper
        elevation={1}
        sx={{
          p: { xs: 2, sm: 3 },
          mb: 3,
          borderRadius: 2,
          bgcolor: 'white'
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                fontWeight: 600,
                color: 'primary.main',
                mb: 1
              }}
            >
              <OrderIcon sx={{ fontSize: 'inherit' }} />
              Quản lý đơn hàng
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Theo dõi và quản lý tất cả đơn hàng
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refetch}
              disabled={loading}
            >
              Làm mới
            </Button>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
            >
              Xuất dữ liệu
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Tổng đơn hàng
                  </Typography>
                  <Typography variant="h5" component="div">
                    {stats.totalOrders}
                  </Typography>
                </Box>
                <OrderIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Tổng doanh thu
                  </Typography>
                  <Typography variant="h5" component="div">
                    {formatCurrency(stats.totalRevenue)}
                  </Typography>
                </Box>
                <PaymentIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Chờ thanh toán
                  </Typography>
                  <Typography variant="h5" component="div">
                    {stats.pendingOrders}
                  </Typography>
                </Box>
                <CalendarIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Đã hoàn thành
                  </Typography>
                  <Typography variant="h5" component="div">
                    {stats.completedOrders}
                  </Typography>
                </Box>
                <OrderIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper
        elevation={1}
        sx={{
          p: { xs: 2, sm: 3 },
          mb: 3,
          borderRadius: 2
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Tìm kiếm theo tên khách hàng, số điện thoại..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={paymentStatusFilter}
                label="Trạng thái"
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="paid">Đã thanh toán</MenuItem>
                <MenuItem value="pending">Chờ thanh toán</MenuItem>
                <MenuItem value="cancelled">Đã hủy</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Phương thức TT</InputLabel>
              <Select
                value={paymentMethodFilter}
                label="Phương thức TT"
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="cash">Tiền mặt</MenuItem>
                <MenuItem value="card">Thẻ</MenuItem>
                <MenuItem value="bank_transfer">Chuyển khoản</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={clearFilters}
              >
                Xóa bộ lọc
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Orders Table */}
      <Paper
        elevation={1}
        sx={{
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Khách hàng</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Số điện thoại</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tổng tiền</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Phương thức TT</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Người bán</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Ngày tạo</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      Không tìm thấy đơn hàng nào
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>#{order.id}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        {order.customer_name || 'Khách vãng lai'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        {order.customer_phone || '-'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(order.total_amount)}
                      </Typography>
                      {order.discount_amount > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          (Giảm: {formatCurrency(order.discount_amount)})
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getPaymentMethodText(order.payment_method)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(order.payment_status)}
                        size="small"
                        color={getStatusColor(order.payment_status) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {(order as any).cashier_name || 'Không xác định'}
                      </Typography>
                      {(order as any).cashier_username && (
                        <Typography variant="caption" color="text.secondary">
                          @{(order as any).cashier_username}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        {new Date(order.created_at).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(order.created_at).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Xem chi tiết">
                          <IconButton
                            size="small"
                            onClick={() => fetchOrderDetails(order.id)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cập nhật trạng thái">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedOrder({ order, items: [] });
                              setNewStatus(order.payment_status);
                              setOpenStatusDialog(true);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Hủy đơn hàng">
                          <IconButton
                            size="small"
                            onClick={() => deleteOrder(order.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={pagination?.total || 0}
          page={currentPage - 1}
          onPageChange={(_, newPage) => handlePageChange(newPage + 1)}
          rowsPerPage={currentLimit}
          onRowsPerPageChange={(e) => handleLimitChange(parseInt(e.target.value, 10))}
          labelRowsPerPage="Số hàng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} của ${count !== -1 ? count : `hơn ${to}`}`
          }
        />
      </Paper>

      {/* Order Details Dialog */}
      <Dialog
        open={openDetailsDialog}
        onClose={() => setOpenDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ViewIcon />
            Chi tiết đơn hàng #{selectedOrder?.order.id}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              {/* Order Info */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Thông tin khách hàng
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    <Typography variant="body2">
                      <strong>Tên:</strong> {selectedOrder.order.customer_name || 'Khách vãng lai'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Số điện thoại:</strong> {selectedOrder.order.customer_phone || '-'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Email:</strong> {selectedOrder.order.customer_email || '-'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Thông tin thanh toán
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    <Typography variant="body2">
                      <strong>Phương thức:</strong> {getPaymentMethodText(selectedOrder.order.payment_method)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Trạng thái:</strong>
                      <Chip
                        label={getStatusText(selectedOrder.order.payment_status)}
                        size="small"
                        color={getStatusColor(selectedOrder.order.payment_status) as any}
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                    <Typography variant="body2">
                      <strong>Ngày tạo:</strong> {new Date(selectedOrder.order.created_at).toLocaleString('vi-VN')}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Order Items */}
              <Typography variant="subtitle2" gutterBottom>
                Sản phẩm trong đơn hàng
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Sản phẩm</TableCell>
                      <TableCell>SKU</TableCell>
                      <TableCell align="right">Số lượng</TableCell>
                      <TableCell align="right">Đơn giá</TableCell>
                      <TableCell align="right">Thành tiền</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {item.product_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.category_name}
                          </Typography>
                        </TableCell>
                        <TableCell>{item.product_sku}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.total_price)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider sx={{ my: 2 }} />

              {/* Order Summary */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Box sx={{ minWidth: 200 }}>
                  <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tạm tính:</span>
                    <span>{formatCurrency(selectedOrder.order.total_amount - selectedOrder.order.tax_amount + selectedOrder.order.discount_amount)}</span>
                  </Typography>
                  {selectedOrder.order.discount_amount > 0 && (
                    <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', color: 'error.main' }}>
                      <span>Giảm giá:</span>
                      <span>-{formatCurrency(selectedOrder.order.discount_amount)}</span>
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Thuế VAT:</span>
                    <span>{formatCurrency(selectedOrder.order.tax_amount)}</span>
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="h6" sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                    <span>Tổng cộng:</span>
                    <span>{formatCurrency(selectedOrder.order.total_amount)}</span>
                  </Typography>
                </Box>
              </Box>

              {selectedOrder.order.notes && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Ghi chú
                  </Typography>
                  <Typography variant="body2" sx={{ pl: 2 }}>
                    {selectedOrder.order.notes}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog
        open={openStatusDialog}
        onClose={() => setOpenStatusDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon />
            Cập nhật trạng thái đơn hàng #{selectedOrder?.order.id}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Trạng thái thanh toán</InputLabel>
              <Select
                value={newStatus}
                label="Trạng thái thanh toán"
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <MenuItem value="paid">Đã thanh toán</MenuItem>
                <MenuItem value="pending">Chờ thanh toán</MenuItem>
                <MenuItem value="cancelled">Đã hủy</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Ghi chú (tùy chọn)"
              multiline
              rows={3}
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder="Nhập ghi chú về việc cập nhật trạng thái..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStatusDialog(false)}>
            Hủy
          </Button>
          <Button
            onClick={updateOrderStatus}
            variant="contained"
            disabled={updateLoading || !newStatus}
            startIcon={updateLoading ? <CircularProgress size={16} /> : null}
          >
            Cập nhật
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Orders;