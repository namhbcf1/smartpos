import React, { useState, useMemo } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Typography,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Alert,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Receipt as ReceiptIcon,
  CheckCircle as PaidIcon,
  Schedule as PendingIcon,
  Cancel as CancelledIcon,
  Assignment as OrderIcon
} from '@mui/icons-material';
import { usePaginatedQuery } from '../hooks/useApiData';
import { useSnackbar } from 'notistack';
import { formatCurrency } from '../config/constants';

// Types
interface Order {
  id: number;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  payment_method: 'cash' | 'card' | 'transfer' | 'qr';
  payment_status: 'paid' | 'pending' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const OrderManagement = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  // State for status update dialog
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    order: Order | null;
    newStatus: string;
    notes: string;
  }>({
    open: false,
    order: null,
    newStatus: '',
    notes: ''
  });

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
    
    if (dateFromFilter) {
      params.date_from = dateFromFilter;
    }
    
    if (dateToFilter) {
      params.date_to = dateToFilter;
    }
    
    return params;
  }, [searchTerm, paymentMethodFilter, paymentStatusFilter, dateFromFilter, dateToFilter]);

  // Fetch orders
  const {
    data: orders,
    pagination,
    isLoading,
    error,
    refetch,
    handlePageChange,
    handleLimitChange,
    page,
    limit
  } = usePaginatedQuery<Order>('/sales', queryParams);

  // Payment status icons and colors
  const getPaymentStatusChip = (status: string) => {
    switch (status) {
      case 'paid':
        return <Chip icon={<PaidIcon />} label="Đã thanh toán" color="success" size="small" />;
      case 'pending':
        return <Chip icon={<PendingIcon />} label="Chờ thanh toán" color="warning" size="small" />;
      case 'cancelled':
        return <Chip icon={<CancelledIcon />} label="Đã hủy" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  // Handle view order details
  const handleViewOrder = (orderId: number) => {
    navigate(`/orders/${orderId}`);
  };

  // Handle update order status
  const handleUpdateStatus = (order: Order) => {
    setStatusDialog({
      open: true,
      order,
      newStatus: order.payment_status,
      notes: order.notes || ''
    });
  };

  // Handle cancel order
  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/sales/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Lỗi khi hủy đơn hàng');
      }

      enqueueSnackbar('Hủy đơn hàng thành công', { variant: 'success' });
      refetch();
    } catch (error) {
      console.error('Cancel order error:', error);
      enqueueSnackbar(error instanceof Error ? error.message : 'Lỗi khi hủy đơn hàng', { variant: 'error' });
    }
  };

  // Handle submit status update
  const handleSubmitStatusUpdate = async () => {
    if (!statusDialog.order) return;

    try {
      const response = await fetch(`/api/v1/sales/${statusDialog.order.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          payment_status: statusDialog.newStatus,
          notes: statusDialog.notes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Lỗi khi cập nhật trạng thái');
      }

      enqueueSnackbar('Cập nhật trạng thái thành công', { variant: 'success' });
      setStatusDialog({ open: false, order: null, newStatus: '', notes: '' });
      refetch();
    } catch (error) {
      console.error('Update status error:', error);
      enqueueSnackbar(error instanceof Error ? error.message : 'Lỗi khi cập nhật trạng thái', { variant: 'error' });
    }
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setPaymentMethodFilter('');
    setPaymentStatusFilter('');
    setDateFromFilter('');
    setDateToFilter('');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <OrderIcon />
        Quản lý đơn hàng
      </Typography>

      {/* Header Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" color="text.secondary">
          Theo dõi và quản lý tất cả đơn hàng
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={RouterLink}
          to="/pos"
        >
          Tạo đơn hàng mới
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            {/* Search */}
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Tìm kiếm"
                placeholder="Tên khách hàng, SĐT, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Payment Method Filter */}
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Phương thức thanh toán</InputLabel>
                <Select
                  value={paymentMethodFilter}
                  label="Phương thức thanh toán"
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="cash">Tiền mặt</MenuItem>
                  <MenuItem value="card">Thẻ</MenuItem>
                  <MenuItem value="transfer">Chuyển khoản</MenuItem>
                  <MenuItem value="qr">QR Code</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Payment Status Filter */}
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái thanh toán</InputLabel>
                <Select
                  value={paymentStatusFilter}
                  label="Trạng thái thanh toán"
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="paid">Đã thanh toán</MenuItem>
                  <MenuItem value="pending">Chờ thanh toán</MenuItem>
                  <MenuItem value="cancelled">Đã hủy</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Date From */}
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="date"
                label="Từ ngày"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Date To */}
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="date"
                label="Đến ngày"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12} md={1}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Làm mới">
                  <IconButton onClick={refetch}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Xóa bộ lọc">
                  <IconButton onClick={handleClearFilters}>
                    <FilterIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Orders Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Khách hàng</TableCell>
              <TableCell>Số điện thoại</TableCell>
              <TableCell align="right">Tổng tiền</TableCell>
              <TableCell>Phương thức TT</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Ngày tạo</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: limit }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={8}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: '100%', height: 40, bgcolor: 'grey.200', borderRadius: 1 }} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : orders.length > 0 ? (
              orders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>#{order.id}</TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {order.customer_name || 'Khách vãng lai'}
                      </Typography>
                      {order.customer_email && (
                        <Typography variant="caption" color="text.secondary">
                          {order.customer_email}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{order.customer_phone || '-'}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600} color="primary.main">
                      {formatCurrency(order.total_amount)}
                    </Typography>
                    {order.discount_amount > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        Giảm: {formatCurrency(order.discount_amount)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {order.payment_method === 'cash' ? 'Tiền mặt' :
                       order.payment_method === 'card' ? 'Thẻ' :
                       order.payment_method === 'transfer' ? 'Chuyển khoản' :
                       order.payment_method === 'qr' ? 'QR Code' : order.payment_method}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getPaymentStatusChip(order.payment_status)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(order.created_at).toLocaleDateString('vi-VN')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(order.created_at).toLocaleTimeString('vi-VN')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Xem chi tiết">
                        <IconButton
                          size="small"
                          onClick={() => handleViewOrder(order.id)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      {order.payment_status !== 'cancelled' && (
                        <Tooltip title="Cập nhật trạng thái">
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateStatus(order)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {order.payment_status === 'pending' && (
                        <Tooltip title="Hủy đơn hàng">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleCancelOrder(order.id)}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Alert severity="info" sx={{ border: 'none' }}>
                    <Typography>Không tìm thấy đơn hàng nào.</Typography>
                  </Alert>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pagination && (
          <TablePagination
            component="div"
            count={pagination.total}
            page={page - 1}
            onPageChange={(_, newPage) => handlePageChange(newPage + 1)}
            rowsPerPage={limit}
            onRowsPerPageChange={(e) => handleLimitChange(parseInt(e.target.value))}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Số dòng mỗi trang:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} của ${count !== -1 ? count : `hơn ${to}`}`
            }
          />
        )}
      </TableContainer>

      {/* Status Update Dialog */}
      <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ open: false, order: null, newStatus: '', notes: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>Cập nhật trạng thái đơn hàng</DialogTitle>
        <DialogContent>
          {statusDialog.order && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Đơn hàng:</strong> #{statusDialog.order.id}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Khách hàng:</strong> {statusDialog.order.customer_name || 'Khách vãng lai'}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Tổng tiền:</strong> {formatCurrency(statusDialog.order.total_amount)}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Trạng thái thanh toán</InputLabel>
                <Select
                  value={statusDialog.newStatus}
                  label="Trạng thái thanh toán"
                  onChange={(e) => setStatusDialog(prev => ({ ...prev, newStatus: e.target.value }))}
                >
                  <MenuItem value="pending">Chờ thanh toán</MenuItem>
                  <MenuItem value="paid">Đã thanh toán</MenuItem>
                  <MenuItem value="cancelled">Đã hủy</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label="Ghi chú"
                value={statusDialog.notes}
                onChange={(e) => setStatusDialog(prev => ({ ...prev, notes: e.target.value }))}
                margin="normal"
                multiline
                rows={3}
                placeholder="Ghi chú về việc cập nhật trạng thái..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ open: false, order: null, newStatus: '', notes: '' })}>
            Hủy
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitStatusUpdate}
            disabled={!statusDialog.newStatus}
          >
            Cập nhật
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OrderManagement;
