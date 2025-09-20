// Vietnamese Computer Hardware POS Order Management
// ComputerPOS Pro - Advanced Order Management System

import { useState, useMemo, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
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
  Divider,
  Badge,
  Avatar,
  FormControlLabel,
  Skeleton
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  CheckCircle as PaidIcon,
  Schedule as PendingIcon,
  Cancel as CancelledIcon,
  Assignment as OrderIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  ExpandMore as ExpandMoreIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as ShoppingCartIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Payment as PaymentIcon,
  LocalShipping as ShippingIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { usePaginatedQuery } from '../../hooks/useApiData';
import { useSnackbar } from 'notistack';
import { formatCurrency } from '../config/constants';
import toast from 'react-hot-toast';

// Enhanced Types
interface Order {
  id: number;
  order_code: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  payment_method: 'cash' | 'card' | 'transfer' | 'qr';
  payment_status: 'paid' | 'pending' | 'cancelled' | 'refunded' | 'partial';
  order_status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipping_method: 'pickup' | 'delivery' | 'express';
  shipping_address: string | null;
  notes: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  items: OrderItem[];
  customer_id?: number;
  store_id: number;
  employee_id: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tags: string[];
  is_favorite: boolean;
  estimated_delivery: string | null;
  actual_delivery: string | null;
}

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_percent: number;
  serial_numbers: string[];
  warranty_info: {
    warranty_type: string;
    warranty_period: number;
    warranty_start_date: string;
  };
}

interface OrderStats {
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  average_order_value: number;
  top_customers: Array<{
    customer_name: string;
    order_count: number;
    total_spent: number;
  }>;
  payment_methods: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
  daily_stats: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
}

interface OrderFilter {
  search: string;
  status: string;
  payment_status: string;
  payment_method: string;
  date_from: string;
  date_to: string;
  customer_id: number | null;
  employee_id: number | null;
  store_id: number | null;
  priority: string;
  tags: string[];
  amount_min: number | null;
  amount_max: number | null;
}

const OrderManagement = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  // Enhanced State Management
  const [viewMode, setViewMode] = useState<'table' | 'card' | 'timeline'>('table');
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy] = useState('created_at');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Enhanced Filters
  const [filters, setFilters] = useState<OrderFilter>({
    search: '',
    status: '',
    payment_status: '',
    payment_method: '',
    date_from: '',
    date_to: '',
    customer_id: null,
    employee_id: null,
    store_id: null,
    priority: '',
    tags: [],
    amount_min: null,
    amount_max: null
  });

  // State for modals
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

  const [orderDetailDialog, setOrderDetailDialog] = useState<{
    open: boolean;
    order: Order | null;
  }>({
    open: false,
    order: null
  });


  const [exportDialog, setExportDialog] = useState<{
    open: boolean;
    format: string;
    dateRange: string;
  }>({
    open: false,
    format: 'excel',
    dateRange: 'all'
  });

  // Enhanced query params
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {};
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== '' && value !== undefined) {
        if (Array.isArray(value) && value.length > 0) {
          params[key] = value.join(',');
        } else if (!Array.isArray(value)) {
          params[key] = value;
        }
      }
    });
    
    params.sort_by = sortBy;
    params.sort_order = sortOrder;
    
    return params;
  }, [filters, sortBy, sortOrder]);

  // Load order statistics
  useEffect(() => {
    loadOrderStats();
  }, []);

  const loadOrderStats = async () => {
    try {
      const response = await api.get('/orders/stats');
      if (response.data.success) {
        setOrderStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load order stats:', error);
    }
  };

  // Helper Functions
  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'processing': return 'primary';
      case 'shipped': return 'secondary';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <PendingIcon />;
      case 'confirmed': return <CheckIcon />;
      case 'processing': return <InventoryIcon />;
      case 'shipped': return <ShippingIcon />;
      case 'delivered': return <PaidIcon />;
      case 'cancelled': return <CancelIcon />;
      default: return <OrderIcon />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      case 'refunded': return 'info';
      case 'partial': return 'secondary';
      default: return 'default';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <PaidIcon />;
      case 'pending': return <PendingIcon />;
      case 'cancelled': return <CancelledIcon />;
      case 'refunded': return <MoneyIcon />;
      case 'partial': return <PaymentIcon />;
      default: return <PaymentIcon />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'normal': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const formatOrderCode = (id: number) => {
    return `#${id.toString().padStart(6, '0')}`;
  };

  const calculateOrderAge = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Vừa tạo';
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} ngày trước`;
  };

  const handleFilterChange = (key: keyof OrderFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: '',
      payment_status: '',
      payment_method: '',
      date_from: '',
      date_to: '',
      customer_id: null,
      employee_id: null,
      store_id: null,
      priority: '',
      tags: [],
      amount_min: null,
      amount_max: null
    });
  };

  const handleSelectOrder = (orderId: number) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAllOrders = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(order => order.id));
    }
  };

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
      const response = await api.delete(`/sales/${orderId}`);

      if (response.data.success) {
        enqueueSnackbar('Hủy đơn hàng thành công', { variant: 'success' });
        refetch();
      } else {
        throw new Error(response.data.message || 'Lỗi khi hủy đơn hàng');
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
      const response = await api.put(`/sales/${statusDialog.order.id}/status`, {
        payment_status: statusDialog.newStatus,
        notes: statusDialog.notes
      });

      if (response.data.success) {
        enqueueSnackbar('Cập nhật trạng thái thành công', { variant: 'success' });
        setStatusDialog({ open: false, order: null, newStatus: '', notes: '' });
        refetch();
      } else {
        throw new Error(response.data.message || 'Lỗi khi cập nhật trạng thái');
      }

      enqueueSnackbar('Cập nhật trạng thái thành công', { variant: 'success' });
      setStatusDialog({ open: false, order: null, newStatus: '', notes: '' });
      refetch();
    } catch (error) {
      console.error('Update status error:', error);
      enqueueSnackbar(error instanceof Error ? error.message : 'Lỗi khi cập nhật trạng thái', { variant: 'error' });
    }
  };


  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 3 }}>
      <Container maxWidth="xl">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <OrderIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      Quản lý đơn hàng
                    </Typography>
                    <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                      Theo dõi và quản lý tất cả đơn hàng hệ thống
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                    onClick={() => setExportDialog({ open: true, format: 'excel', dateRange: 'all' })}
                  >
                    Xuất Excel
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                  >
                    In báo cáo
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    component={RouterLink}
                    to="/pos"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                  >
                    Tạo đơn hàng mới
                  </Button>
                </Box>
              </Box>

              {/* Order Statistics */}
              {orderStats && (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight="bold">
                      {orderStats.total_orders.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Tổng đơn hàng
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight="bold">
                      {formatCurrency(orderStats.total_revenue)}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Tổng doanh thu
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight="bold" color="warning.main">
                      {orderStats.pending_orders}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Đang chờ xử lý
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight="bold" color="success.main">
                      {orderStats.completed_orders}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Đã hoàn thành
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SettingsIcon />
                Thao tác nhanh
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ShoppingCartIcon />}
                  onClick={() => navigate('/pos')}
                  sx={{ height: 60 }}
                >
                  Tạo đơn hàng mới
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AssessmentIcon />}
                  onClick={() => navigate('/reports')}
                  sx={{ height: 60 }}
                >
                  Báo cáo doanh thu
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<InventoryIcon />}
                  onClick={() => navigate('/inventory')}
                  sx={{ height: 60 }}
                >
                  Kiểm tra tồn kho
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PersonIcon />}
                  onClick={() => navigate('/customers')}
                  sx={{ height: 60 }}
                >
                  Quản lý khách hàng
                </Button>
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FilterIcon />
                  Bộ lọc và tìm kiếm
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<ExpandMoreIcon />}
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    {showAdvancedFilters ? 'Thu gọn' : 'Mở rộng'}
                  </Button>
                  <Button
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={refetch}
                  >
                    Làm mới
                  </Button>
                  <Button
                    size="small"
                    startIcon={<CloseIcon />}
                    onClick={handleClearFilters}
                  >
                    Xóa bộ lọc
                  </Button>
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                {/* Search */}
                <TextField
                  fullWidth
                  label="Tìm kiếm"
                  placeholder="Mã đơn hàng, tên khách hàng, SĐT..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Order Status */}
                <FormControl fullWidth>
                  <InputLabel>Trạng thái đơn hàng</InputLabel>
                  <Select
                    value={filters.status}
                    label="Trạng thái đơn hàng"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    <MenuItem value="pending">Chờ xử lý</MenuItem>
                    <MenuItem value="confirmed">Đã xác nhận</MenuItem>
                    <MenuItem value="processing">Đang xử lý</MenuItem>
                    <MenuItem value="shipped">Đã giao</MenuItem>
                    <MenuItem value="delivered">Đã nhận</MenuItem>
                    <MenuItem value="cancelled">Đã hủy</MenuItem>
                  </Select>
                </FormControl>

                {/* Payment Status */}
                <FormControl fullWidth>
                  <InputLabel>Trạng thái thanh toán</InputLabel>
                  <Select
                    value={filters.payment_status}
                    label="Trạng thái thanh toán"
                    onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    <MenuItem value="paid">Đã thanh toán</MenuItem>
                    <MenuItem value="pending">Chờ thanh toán</MenuItem>
                    <MenuItem value="cancelled">Đã hủy</MenuItem>
                    <MenuItem value="refunded">Đã hoàn tiền</MenuItem>
                    <MenuItem value="partial">Thanh toán một phần</MenuItem>
                  </Select>
                </FormControl>

                {/* Payment Method */}
                <FormControl fullWidth>
                  <InputLabel>Phương thức thanh toán</InputLabel>
                  <Select
                    value={filters.payment_method}
                    label="Phương thức thanh toán"
                    onChange={(e) => handleFilterChange('payment_method', e.target.value)}
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    <MenuItem value="cash">Tiền mặt</MenuItem>
                    <MenuItem value="card">Thẻ</MenuItem>
                    <MenuItem value="transfer">Chuyển khoản</MenuItem>
                    <MenuItem value="qr">QR Code</MenuItem>
                  </Select>
                </FormControl>

                {/* Priority */}
                <FormControl fullWidth>
                  <InputLabel>Độ ưu tiên</InputLabel>
                  <Select
                    value={filters.priority}
                    label="Độ ưu tiên"
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    <MenuItem value="urgent">Khẩn cấp</MenuItem>
                    <MenuItem value="high">Cao</MenuItem>
                    <MenuItem value="normal">Bình thường</MenuItem>
                    <MenuItem value="low">Thấp</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Advanced Filters */}
              <AnimatePresence>
                {showAdvancedFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Từ ngày"
                        value={filters.date_from}
                        onChange={(e) => handleFilterChange('date_from', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        fullWidth
                        type="date"
                        label="Đến ngày"
                        value={filters.date_to}
                        onChange={(e) => handleFilterChange('date_to', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        fullWidth
                        type="number"
                        label="Số tiền tối thiểu"
                        value={filters.amount_min || ''}
                        onChange={(e) => handleFilterChange('amount_min', e.target.value ? Number(e.target.value) : null)}
                      />
                      <TextField
                        fullWidth
                        type="number"
                        label="Số tiền tối đa"
                        value={filters.amount_max || ''}
                        onChange={(e) => handleFilterChange('amount_max', e.target.value ? Number(e.target.value) : null)}
                      />
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* View Mode Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h6">Danh sách đơn hàng</Typography>
                  <Badge badgeContent={orders.length} color="primary">
                    <OrderIcon />
                  </Badge>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant={viewMode === 'table' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setViewMode('table')}
                  >
                    Bảng
                  </Button>
                  <Button
                    variant={viewMode === 'card' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setViewMode('card')}
                  >
                    Thẻ
                  </Button>
                  <Button
                    variant={viewMode === 'timeline' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setViewMode('timeline')}
                  >
                    Dòng thời gian
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Enhanced Orders Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                  <TableCell padding="checkbox">
                    <FormControlLabel
                      control={
                        <input
                          type="checkbox"
                          checked={selectedOrders.length === orders.length && orders.length > 0}
                          onChange={handleSelectAllOrders}
                        />
                      }
                      label=""
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Mã đơn hàng</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Khách hàng</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Liên hệ</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Tổng tiền</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Trạng thái đơn</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Thanh toán</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Độ ưu tiên</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ngày tạo</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  // Enhanced loading skeletons
                  Array.from({ length: limit }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell padding="checkbox">
                        <Skeleton variant="rectangular" width={20} height={20} />
                      </TableCell>
                      <TableCell><Skeleton variant="text" width={80} /></TableCell>
                      <TableCell><Skeleton variant="text" width={120} /></TableCell>
                      <TableCell><Skeleton variant="text" width={100} /></TableCell>
                      <TableCell><Skeleton variant="text" width={80} /></TableCell>
                      <TableCell><Skeleton variant="rectangular" width={80} height={24} /></TableCell>
                      <TableCell><Skeleton variant="rectangular" width={80} height={24} /></TableCell>
                      <TableCell><Skeleton variant="rectangular" width={60} height={24} /></TableCell>
                      <TableCell><Skeleton variant="text" width={100} /></TableCell>
                      <TableCell><Skeleton variant="rectangular" width={120} height={32} /></TableCell>
                    </TableRow>
                  ))
                ) : orders.length > 0 ? (
                  orders.map((order) => (
                    <TableRow 
                      key={order.id} 
                      hover 
                      sx={{ 
                        '&:hover': { bgcolor: 'action.hover' },
                        bgcolor: selectedOrders.includes(order.id) ? 'action.selected' : 'inherit'
                      }}
                    >
                      <TableCell padding="checkbox">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => handleSelectOrder(order.id)}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight={600} color="primary">
                            {formatOrderCode(order.id)}
                          </Typography>
                          {order.is_favorite && (
                            <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {calculateOrderAge(order.created_at)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            <PersonIcon sx={{ fontSize: 16 }} />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {order.customer_name || 'Khách vãng lai'}
                            </Typography>
                            {order.customer_email && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <EmailIcon sx={{ fontSize: 12 }} />
                                {order.customer_email}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {order.customer_phone || '-'}
                          </Typography>
                        </Box>
                        {order.customer_address && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationIcon sx={{ fontSize: 12 }} />
                            {order.customer_address}
                          </Typography>
                        )}
                      </TableCell>
                      
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600} color="primary.main">
                          {formatCurrency(order.total_amount)}
                        </Typography>
                        {order.discount_amount > 0 && (
                          <Typography variant="caption" color="success.main">
                            Giảm: {formatCurrency(order.discount_amount)}
                          </Typography>
                        )}
                        {order.tax_amount > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            Thuế: {formatCurrency(order.tax_amount)}
                          </Typography>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          icon={getOrderStatusIcon(order.order_status)}
                          label={order.order_status === 'pending' ? 'Chờ xử lý' :
                                 order.order_status === 'confirmed' ? 'Đã xác nhận' :
                                 order.order_status === 'processing' ? 'Đang xử lý' :
                                 order.order_status === 'shipped' ? 'Đã giao' :
                                 order.order_status === 'delivered' ? 'Đã nhận' :
                                 order.order_status === 'cancelled' ? 'Đã hủy' : order.order_status}
                          color={getOrderStatusColor(order.order_status)}
                          size="small"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          icon={getPaymentStatusIcon(order.payment_status)}
                          label={order.payment_status === 'paid' ? 'Đã thanh toán' :
                                 order.payment_status === 'pending' ? 'Chờ thanh toán' :
                                 order.payment_status === 'cancelled' ? 'Đã hủy' :
                                 order.payment_status === 'refunded' ? 'Đã hoàn tiền' :
                                 order.payment_status === 'partial' ? 'Thanh toán một phần' : order.payment_status}
                          color={getPaymentStatusColor(order.payment_status)}
                          size="small"
                        />
                        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                          {order.payment_method === 'cash' ? 'Tiền mặt' :
                           order.payment_method === 'card' ? 'Thẻ' :
                           order.payment_method === 'transfer' ? 'Chuyển khoản' :
                           order.payment_method === 'qr' ? 'QR Code' : order.payment_method}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          label={order.priority === 'urgent' ? 'Khẩn cấp' :
                                 order.priority === 'high' ? 'Cao' :
                                 order.priority === 'normal' ? 'Bình thường' :
                                 order.priority === 'low' ? 'Thấp' : order.priority}
                          color={getPriorityColor(order.priority)}
                          size="small"
                        />
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
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="Xem chi tiết">
                            <IconButton
                              size="small"
                              onClick={() => setOrderDetailDialog({ open: true, order })}
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
                          <Tooltip title="Thêm vào yêu thích">
                            <IconButton
                              size="small"
                              onClick={() => toast.success('Đã thêm vào yêu thích')}
                            >
                              {order.is_favorite ? <StarIcon /> : <StarBorderIcon />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <OrderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          Không tìm thấy đơn hàng nào
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          Hãy thử điều chỉnh bộ lọc hoặc tạo đơn hàng mới
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
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Enhanced Pagination */}
            {pagination && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2" color="text.secondary">
                  Hiển thị {((page - 1) * limit) + 1} đến {Math.min(page * limit, pagination.total)} trong tổng số {pagination.total} đơn hàng
                </Typography>
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
              </Box>
            )}
          </TableContainer>
        </motion.div>

        {/* Enhanced Status Update Dialog */}
        <Dialog 
          open={statusDialog.open} 
          onClose={() => setStatusDialog({ open: false, order: null, newStatus: '', notes: '' })} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon />
            Cập nhật trạng thái đơn hàng
          </DialogTitle>
          <DialogContent>
            {statusDialog.order && (
              <Box sx={{ mt: 2 }}>
                <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Thông tin đơn hàng</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                      <Typography variant="body2"><strong>Mã đơn hàng:</strong> {formatOrderCode(statusDialog.order.id)}</Typography>
                      <Typography variant="body2"><strong>Khách hàng:</strong> {statusDialog.order.customer_name || 'Khách vãng lai'}</Typography>
                      <Typography variant="body2"><strong>Tổng tiền:</strong> {formatCurrency(statusDialog.order.total_amount)}</Typography>
                      <Typography variant="body2"><strong>Trạng thái hiện tại:</strong> 
                        <Chip 
                          label={statusDialog.order.payment_status === 'paid' ? 'Đã thanh toán' :
                                 statusDialog.order.payment_status === 'pending' ? 'Chờ thanh toán' :
                                 statusDialog.order.payment_status === 'cancelled' ? 'Đã hủy' : statusDialog.order.payment_status}
                          color={getPaymentStatusColor(statusDialog.order.payment_status)}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
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
                      <MenuItem value="refunded">Đã hoàn tiền</MenuItem>
                      <MenuItem value="partial">Thanh toán một phần</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Trạng thái đơn hàng</InputLabel>
                    <Select
                      value={statusDialog.order.order_status}
                      label="Trạng thái đơn hàng"
                      disabled
                    >
                      <MenuItem value="pending">Chờ xử lý</MenuItem>
                      <MenuItem value="confirmed">Đã xác nhận</MenuItem>
                      <MenuItem value="processing">Đang xử lý</MenuItem>
                      <MenuItem value="shipped">Đã giao</MenuItem>
                      <MenuItem value="delivered">Đã nhận</MenuItem>
                      <MenuItem value="cancelled">Đã hủy</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
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
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setStatusDialog({ open: false, order: null, newStatus: '', notes: '' })}>
              Hủy
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSubmitStatusUpdate}
              disabled={!statusDialog.newStatus}
              startIcon={<CheckIcon />}
            >
              Cập nhật
            </Button>
          </DialogActions>
        </Dialog>

        {/* Order Detail Dialog */}
        <Dialog 
          open={orderDetailDialog.open} 
          onClose={() => setOrderDetailDialog({ open: false, order: null })} 
          maxWidth="lg" 
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ViewIcon />
            Chi tiết đơn hàng
          </DialogTitle>
          <DialogContent>
            {orderDetailDialog.order && (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Thông tin khách hàng</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6">{orderDetailDialog.order.customer_name || 'Khách vãng lai'}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {orderDetailDialog.order.customer_email || 'Không có email'}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <PhoneIcon sx={{ fontSize: 16 }} />
                        {orderDetailDialog.order.customer_phone || 'Không có số điện thoại'}
                      </Typography>
                      {orderDetailDialog.order.customer_address && (
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationIcon sx={{ fontSize: 16 }} />
                          {orderDetailDialog.order.customer_address}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Thông tin đơn hàng</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Mã đơn hàng:</Typography>
                        <Typography variant="body2" fontWeight={600}>{formatOrderCode(orderDetailDialog.order.id)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Ngày tạo:</Typography>
                        <Typography variant="body2">{new Date(orderDetailDialog.order.created_at).toLocaleString('vi-VN')}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Tổng tiền:</Typography>
                        <Typography variant="body2" fontWeight={600} color="primary">
                          {formatCurrency(orderDetailDialog.order.total_amount)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Trạng thái:</Typography>
                        <Chip 
                          label={orderDetailDialog.order.order_status === 'pending' ? 'Chờ xử lý' :
                                 orderDetailDialog.order.order_status === 'confirmed' ? 'Đã xác nhận' :
                                 orderDetailDialog.order.order_status === 'processing' ? 'Đang xử lý' :
                                 orderDetailDialog.order.order_status === 'shipped' ? 'Đã giao' :
                                 orderDetailDialog.order.order_status === 'delivered' ? 'Đã nhận' :
                                 orderDetailDialog.order.order_status === 'cancelled' ? 'Đã hủy' : orderDetailDialog.order.order_status}
                          color={getOrderStatusColor(orderDetailDialog.order.order_status)}
                          size="small"
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Thanh toán:</Typography>
                        <Chip 
                          label={orderDetailDialog.order.payment_status === 'paid' ? 'Đã thanh toán' :
                                 orderDetailDialog.order.payment_status === 'pending' ? 'Chờ thanh toán' :
                                 orderDetailDialog.order.payment_status === 'cancelled' ? 'Đã hủy' :
                                 orderDetailDialog.order.payment_status === 'refunded' ? 'Đã hoàn tiền' :
                                 orderDetailDialog.order.payment_status === 'partial' ? 'Thanh toán một phần' : orderDetailDialog.order.payment_status}
                          color={getPaymentStatusColor(orderDetailDialog.order.payment_status)}
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
                
                {orderDetailDialog.order.items && orderDetailDialog.order.items.length > 0 && (
                  <Card sx={{ mt: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Chi tiết sản phẩm</Typography>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Sản phẩm</TableCell>
                            <TableCell>Số lượng</TableCell>
                            <TableCell>Đơn giá</TableCell>
                            <TableCell align="right">Thành tiền</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {orderDetailDialog.order.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Typography variant="body2" fontWeight={500}>{item.product_name}</Typography>
                                <Typography variant="caption" color="text.secondary">{item.product_sku}</Typography>
                              </TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                              <TableCell align="right">{formatCurrency(item.total_price)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOrderDetailDialog({ open: false, order: null })}>
              Đóng
            </Button>
            <Button variant="outlined" startIcon={<PrintIcon />}>
              In hóa đơn
            </Button>
            <Button variant="contained" startIcon={<EditIcon />}>
              Chỉnh sửa
            </Button>
          </DialogActions>
        </Dialog>

        {/* Export Dialog */}
        <Dialog 
          open={exportDialog.open} 
          onClose={() => setExportDialog({ open: false, format: 'excel', dateRange: 'all' })} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DownloadIcon />
            Xuất dữ liệu đơn hàng
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Định dạng file</InputLabel>
                <Select
                  value={exportDialog.format}
                  label="Định dạng file"
                  onChange={(e) => setExportDialog(prev => ({ ...prev, format: e.target.value }))}
                >
                  <MenuItem value="excel">Excel (.xlsx)</MenuItem>
                  <MenuItem value="csv">CSV (.csv)</MenuItem>
                  <MenuItem value="pdf">PDF (.pdf)</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Khoảng thời gian</InputLabel>
                <Select
                  value={exportDialog.dateRange}
                  label="Khoảng thời gian"
                  onChange={(e) => setExportDialog(prev => ({ ...prev, dateRange: e.target.value }))}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="today">Hôm nay</MenuItem>
                  <MenuItem value="week">7 ngày qua</MenuItem>
                  <MenuItem value="month">30 ngày qua</MenuItem>
                  <MenuItem value="quarter">3 tháng qua</MenuItem>
                  <MenuItem value="year">Năm nay</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setExportDialog({ open: false, format: 'excel', dateRange: 'all' })}>
              Hủy
            </Button>
            <Button 
              variant="contained" 
              startIcon={<DownloadIcon />}
              onClick={() => {
                toast.success('Đang xuất dữ liệu...');
                setExportDialog({ open: false, format: 'excel', dateRange: 'all' });
              }}
            >
              Xuất file
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default OrderManagement;
