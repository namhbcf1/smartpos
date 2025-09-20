import { useState, useMemo, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  Divider,
  Stack,
  Tabs,
  Tab,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Skeleton
} from '@mui/material';
import {
  Assignment as OrderIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  GetApp as ExportIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  AttachMoney as AttachMoneyIcon,
  ShoppingCart as ShoppingCartIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  LocalShipping as LocalShippingIcon,
  MonetizationOn as MonetizationOnIcon,
  Timeline as TimelineIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Sort as SortIcon,
  FilterAlt as FilterAltIcon,
  Clear as ClearIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Done as DoneIcon,
  Schedule as ScheduleIcon,
  Update as UpdateIcon,
  Note as NoteIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../config/constants';

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
  payment_method: string;
  payment_status: string;
  order_status: string;
  shipping_method: string;
  shipping_address: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  is_favorite: boolean;
  notes: string | null;
  cashier_name: string | null;
  cashier_username: string | null;
  store_name: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  estimated_delivery: string | null;
  tracking_number: string | null;
  refund_amount: number;
  refund_reason: string | null;
  refund_date: string | null;
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

interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  todayOrders: number;
  thisWeekOrders: number;
  thisMonthOrders: number;
  refundedOrders: number;
  totalRefundAmount: number;
}

interface OrderFilter {
  search: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  priority: string;
  dateRange: string;
  store: string;
  cashier: string;
  minAmount: number;
  maxAmount: number;
  tags: string[];
}

const Orders = () => {

  // Enhanced State Management
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStats>({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    averageOrderValue: 0,
    todayOrders: 0,
    thisWeekOrders: 0,
    thisMonthOrders: 0,
    refundedOrders: 0,
    totalRefundAmount: 0
  });
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'card' | 'timeline'>('table');
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Dialog states
  const [orderDetailDialog, setOrderDetailDialog] = useState(false);
  const [orderStatusDialog, setOrderStatusDialog] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);
  
  // Form states
  const [statusForm, setStatusForm] = useState({
    payment_status: '',
    order_status: '',
    notes: ''
  });
  
  // Filter states
  const [filters, setFilters] = useState<OrderFilter>({
    search: '',
    status: '',
    paymentStatus: '',
    paymentMethod: '',
    priority: '',
    dateRange: '',
    store: '',
    cashier: '',
    minAmount: 0,
    maxAmount: 0,
    tags: []
  });


  // Load order data from API
  const loadOrderData = async () => {
    setLoading(true);
    try {
      // API endpoint to fetch orders - needs proper backend implementation
      const apiUrl = process.env.REACT_APP_API_URL || window.location.origin;
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${apiUrl}/api/v1/orders?page=1&limit=20&search=${filters.search}&status=${filters.status}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': 'default'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load orders');
      }

      const data = await response.json();
      if (data.success) {
        // Map API data to component format
        const mappedOrders = data.data.orders.map((order: any, index: number) => ({
          id: order.id || index + 1,
          order_code: order.order_code,
          customer_name: order.customer_name || null,
          customer_phone: order.customer_phone || null,
          customer_email: order.customer_email || null,
          customer_address: order.customer_address || null,
          total_amount: order.total_amount || order.total || 0,
          tax_amount: order.tax_amount || order.tax || 0,
          discount_amount: order.discount_amount || order.discount || 0,
          payment_method: order.payment_method || 'unknown',
          payment_status: order.payment_status || (order.status === 'completed' ? 'paid' : 'pending'),
          order_status: order.order_status || order.status || 'pending',
          shipping_method: order.shipping_method || null,
          shipping_address: order.shipping_address || null,
          priority: order.priority || 'medium',
          tags: order.tags || [],
          is_favorite: order.is_favorite || false,
          notes: order.notes || null,
          cashier_name: order.cashier_name || null,
          cashier_username: order.cashier_username || null,
          store_name: order.store_name || null,
          created_at: order.created_at,
          updated_at: order.updated_at,
          completed_at: order.completed_at || null,
          estimated_delivery: order.estimated_delivery || null,
          tracking_number: order.tracking_number || null,
          refund_amount: order.refund_amount || 0,
          refund_reason: order.refund_reason || null,
          refund_date: order.refund_date || null
        }));

        setOrders(mappedOrders);
        
        // Calculate stats from API data
        const stats = {
          total_orders: data.data.pagination.total,
          pending_orders: mappedOrders.filter((o: any) => o.order_status === 'pending').length,
          completed_orders: mappedOrders.filter((o: any) => o.order_status === 'completed').length,
          cancelled_orders: mappedOrders.filter((o: any) => o.order_status === 'cancelled').length,
          processing_orders: mappedOrders.filter((o: any) => o.order_status === 'processing').length,
          total_revenue: mappedOrders.reduce((sum: number, o: any) => sum + o.total_amount, 0),
          avg_order_value: mappedOrders.length > 0 ? mappedOrders.reduce((sum: number, o: any) => sum + o.total_amount, 0) / mappedOrders.length : 0,
          orders_today: mappedOrders.filter((o: any) => {
            const today = new Date().toISOString().split('T')[0];
            return o.created_at?.startsWith(today);
          }).length
        };
        setOrderStats(stats);
      } else {
        throw new Error(data.error || 'Failed to load orders');
      }
    } catch (error) {
      console.error('Orders loading failed:', error);
      // No fallback data - show empty state
      setOrders([]);
      setOrderStats({
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        averageOrderValue: 0,
        todayOrders: 0,
        thisWeekOrders: 0,
        thisMonthOrders: 0,
        refundedOrders: 0,
        totalRefundAmount: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrderData();
  }, []);

  // Helper functions
  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'info';
      case 'shipped': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      case 'refunded': return 'warning';
      default: return 'default';
    }
  };

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon />;
      case 'processing': return <PendingIcon />;
      case 'shipped': return <LocalShippingIcon />;
      case 'delivered': return <DoneIcon />;
      case 'cancelled': return <CancelIcon />;
      case 'refunded': return <MonetizationOnIcon />;
      default: return <ScheduleIcon />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      case 'refunded': return 'info';
      default: return 'default';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircleIcon />;
      case 'pending': return <PendingIcon />;
      case 'cancelled': return <CancelIcon />;
      case 'refunded': return <MonetizationOnIcon />;
      default: return <PaymentIcon />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const formatOrderCode = (code: string) => {
    return code || 'N/A';
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
      paymentStatus: '',
      paymentMethod: '',
      priority: '',
      dateRange: '',
      store: '',
      cashier: '',
      minAmount: 0,
      maxAmount: 0,
      tags: []
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



  // Event handlers
  const handleViewOrder = async (order: Order) => {
    try {
      // Fetch order details from API
      const apiUrl = process.env.REACT_APP_API_URL || window.location.origin;
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${apiUrl}/api/v1/orders/${order.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': 'default'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSelectedOrder({ order, items: data.data.items || [] });
        } else {
          setSelectedOrder({ order, items: [] });
        }
      } else {
        setSelectedOrder({ order, items: [] });
      }
    } catch (error) {
      console.error('Failed to load order details:', error);
      setSelectedOrder({ order, items: [] });
    }
    setOrderDetailDialog(true);
  };

  const handleEditOrder = async (order: Order) => {
    try {
      // Fetch order details from API for editing
      const apiUrl = process.env.REACT_APP_API_URL || window.location.origin;
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${apiUrl}/api/v1/orders/${order.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': 'default'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSelectedOrder({ order, items: data.data.items || [] });
        } else {
          setSelectedOrder({ order, items: [] });
        }
      } else {
        setSelectedOrder({ order, items: [] });
      }
    } catch (error) {
      console.error('Failed to load order details:', error);
      setSelectedOrder({ order, items: [] });
    }
    setOrderDetailDialog(true);
  };

  const handleUpdateStatus = async (order: Order) => {
    try {
      // Fetch order details from API
      const apiUrl = process.env.REACT_APP_API_URL || window.location.origin;
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${apiUrl}/api/v1/orders/${order.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': 'default'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSelectedOrder({ order, items: data.data.items || [] });
        } else {
          setSelectedOrder({ order, items: [] });
        }
      } else {
        setSelectedOrder({ order, items: [] });
      }
    } catch (error) {
      console.error('Failed to load order details:', error);
      setSelectedOrder({ order, items: [] });
    }

    setStatusForm({
      payment_status: order.payment_status,
      order_status: order.order_status,
      notes: ''
    });
    setOrderStatusDialog(true);
  };

  const handleCreateOrder = () => {
    toast.success('Tính năng tạo đơn hàng mới đang được phát triển');
  };

  const handleExportOrders = () => {
    setExportDialog(true);
  };

  const handlePrintOrder = (order: Order) => {
    toast.success(`In đơn hàng ${order.order_code}`);
  };

  const handleShareOrder = (order: Order) => {
    if (navigator.share) {
      navigator.share({
        title: `Đơn hàng ${order.order_code}`,
        text: `Chi tiết đơn hàng ${order.order_code}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/orders/${order.id}`);
      toast.success('Đã copy link đơn hàng');
    }
  };

  const handleToggleFavorite = (order: Order) => {
    const updatedOrders = orders.map(o => 
      o.id === order.id ? { ...o, is_favorite: !o.is_favorite } : o
    );
    setOrders(updatedOrders);
    toast.success(order.is_favorite ? 'Đã bỏ yêu thích' : 'Đã thêm vào yêu thích');
  };




  // Filter orders based on current filters
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = !filters.search || 
        order.customer_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.customer_phone?.includes(filters.search) ||
        order.order_code?.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = !filters.status || order.order_status === filters.status;
      const matchesPaymentStatus = !filters.paymentStatus || order.payment_status === filters.paymentStatus;
      const matchesPaymentMethod = !filters.paymentMethod || order.payment_method === filters.paymentMethod;
      const matchesPriority = !filters.priority || order.priority === filters.priority;
      
      return matchesSearch && matchesStatus && matchesPaymentStatus && matchesPaymentMethod && matchesPriority;
    });
  }, [orders, filters]);

  // Tab configuration
  const tabs = [
    { label: 'Tất cả', value: 'all', count: orders.length },
    { label: 'Chờ xử lý', value: 'pending', count: orders.filter(o => o.order_status === 'pending').length },
    { label: 'Đang xử lý', value: 'processing', count: orders.filter(o => o.order_status === 'processing').length },
    { label: 'Đã hoàn thành', value: 'completed', count: orders.filter(o => o.order_status === 'completed').length },
    { label: 'Đã hủy', value: 'cancelled', count: orders.filter(o => o.order_status === 'cancelled').length },
    { label: 'Yêu thích', value: 'favorites', count: orders.filter(o => o.is_favorite).length }
  ];

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
      {/* Modern Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            mb: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 2 }}>
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
                    gap: 2,
                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                    fontWeight: 700,
                    mb: 1
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      width: { xs: 40, sm: 50 },
                      height: { xs: 40, sm: 50 }
                    }}
                  >
                    <OrderIcon sx={{ fontSize: { xs: 20, sm: 25 } }} />
                  </Avatar>
                  Quản lý đơn hàng
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    opacity: 0.9,
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    fontWeight: 400
                  }}
                >
                  Theo dõi và quản lý tất cả đơn hàng một cách hiệu quả
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={loadOrderData}
                  disabled={loading}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                  }}
                >
                  Làm mới
                </Button>
                <Button
                  variant="contained"
                  startIcon={<ExportIcon />}
                  onClick={handleExportOrders}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                  }}
                >
                  Xuất Excel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateOrder}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                  }}
                >
                  Tạo đơn hàng
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Paper>
      </motion.div>

      {/* Modern Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
          {/* Total Orders */}
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Tổng đơn hàng
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    {orderStats.totalOrders.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    +{orderStats.todayOrders} hôm nay
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 60, height: 60 }}>
                  <OrderIcon sx={{ fontSize: 30 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Tổng doanh thu
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    {formatCurrency(orderStats.totalRevenue)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    TB: {formatCurrency(orderStats.averageOrderValue)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 60, height: 60 }}>
                  <AttachMoneyIcon sx={{ fontSize: 30 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>

          {/* Pending Orders */}
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Chờ xử lý
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    {orderStats.pendingOrders}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Cần xử lý ngay
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 60, height: 60 }}>
                  <PendingIcon sx={{ fontSize: 30 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>

          {/* Completed Orders */}
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Đã hoàn thành
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    {orderStats.completedOrders}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    {Math.round((orderStats.completedOrders / orderStats.totalOrders) * 100)}% tỷ lệ
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 60, height: 60 }}>
                  <CheckCircleIcon sx={{ fontSize: 30 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </motion.div>

      {/* Modern Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card elevation={0} sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm theo mã đơn hàng, tên khách hàng..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              
              <FormControl fullWidth>
                <InputLabel>Trạng thái đơn hàng</InputLabel>
                <Select
                  value={filters.status}
                  label="Trạng thái đơn hàng"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="pending">Chờ xử lý</MenuItem>
                  <MenuItem value="processing">Đang xử lý</MenuItem>
                  <MenuItem value="shipped">Đã giao</MenuItem>
                  <MenuItem value="delivered">Đã nhận</MenuItem>
                  <MenuItem value="cancelled">Đã hủy</MenuItem>
                  <MenuItem value="refunded">Đã hoàn tiền</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Trạng thái thanh toán</InputLabel>
                <Select
                  value={filters.paymentStatus}
                  label="Trạng thái thanh toán"
                  onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="paid">Đã thanh toán</MenuItem>
                  <MenuItem value="pending">Chờ thanh toán</MenuItem>
                  <MenuItem value="cancelled">Đã hủy</MenuItem>
                  <MenuItem value="refunded">Đã hoàn tiền</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Phương thức thanh toán</InputLabel>
                <Select
                  value={filters.paymentMethod}
                  label="Phương thức thanh toán"
                  onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="cash">Tiền mặt</MenuItem>
                  <MenuItem value="card">Thẻ</MenuItem>
                  <MenuItem value="bank_transfer">Chuyển khoản</MenuItem>
                  <MenuItem value="momo">MoMo</MenuItem>
                  <MenuItem value="zalopay">ZaloPay</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<FilterAltIcon />}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                sx={{ borderRadius: 2 }}
              >
                Bộ lọc nâng cao
              </Button>
              
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilters}
                  sx={{ borderRadius: 2 }}
                >
                  Xóa bộ lọc
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SortIcon />}
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  sx={{ borderRadius: 2 }}
                >
                  Sắp xếp {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </Stack>
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
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel>Độ ưu tiên</InputLabel>
                      <Select
                        value={filters.priority}
                        label="Độ ưu tiên"
                        onChange={(e) => handleFilterChange('priority', e.target.value)}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="">Tất cả</MenuItem>
                        <MenuItem value="urgent">Khẩn cấp</MenuItem>
                        <MenuItem value="high">Cao</MenuItem>
                        <MenuItem value="medium">Trung bình</MenuItem>
                        <MenuItem value="low">Thấp</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel>Khoảng thời gian</InputLabel>
                      <Select
                        value={filters.dateRange}
                        label="Khoảng thời gian"
                        onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="">Tất cả</MenuItem>
                        <MenuItem value="today">Hôm nay</MenuItem>
                        <MenuItem value="week">Tuần này</MenuItem>
                        <MenuItem value="month">Tháng này</MenuItem>
                        <MenuItem value="quarter">Quý này</MenuItem>
                        <MenuItem value="year">Năm này</MenuItem>
                      </Select>
                    </FormControl>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        label="Từ (VNĐ)"
                        type="number"
                        value={filters.minAmount}
                        onChange={(e) => handleFilterChange('minAmount', Number(e.target.value))}
                        size="small"
                        sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                      <Typography>-</Typography>
                      <TextField
                        label="Đến (VNĐ)"
                        type="number"
                        value={filters.maxAmount}
                        onChange={(e) => handleFilterChange('maxAmount', Number(e.target.value))}
                        size="small"
                        sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Box>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card elevation={0} sx={{ borderRadius: 3, mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 60
              }
            }}
          >
            {tabs.map((tab) => (
              <Tab
                key={tab.value}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {tab.label}
                    <Badge badgeContent={tab.count} color="primary" />
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Card>
      </motion.div>

      {/* View Mode Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Danh sách đơn hàng ({filteredOrders.length})
          </Typography>
          
          <Stack direction="row" spacing={1}>
            <Button
              variant={viewMode === 'table' ? 'contained' : 'outlined'}
              startIcon={<ViewListIcon />}
              onClick={() => setViewMode('table')}
              size="small"
            >
              Bảng
            </Button>
            <Button
              variant={viewMode === 'card' ? 'contained' : 'outlined'}
              startIcon={<ViewModuleIcon />}
              onClick={() => setViewMode('card')}
              size="small"
            >
              Thẻ
            </Button>
            <Button
              variant={viewMode === 'timeline' ? 'contained' : 'outlined'}
              startIcon={<TimelineIcon />}
              onClick={() => setViewMode('timeline')}
              size="small"
            >
              Dòng thời gian
            </Button>
          </Stack>
        </Box>
      </motion.div>

      {/* Modern Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card elevation={0} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell padding="checkbox">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                      onChange={handleSelectAllOrders}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Mã đơn hàng</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Khách hàng</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Số tiền</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Trạng thái đơn hàng</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Trạng thái thanh toán</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Phương thức TT</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Độ ưu tiên</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Ngày tạo</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={10}>
                        <Skeleton variant="rectangular" height={60} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} sx={{ textAlign: 'center', py: 8 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <OrderIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />
                        <Typography variant="h6" color="text.secondary">
                          Không tìm thấy đơn hàng nào
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Thử thay đổi bộ lọc hoặc tạo đơn hàng mới
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id} hover sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                      <TableCell padding="checkbox">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => handleSelectOrder(order.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatOrderCode(order.order_code)}
                          </Typography>
                          {order.is_favorite && (
                            <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          #{order.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            <PersonIcon sx={{ fontSize: 16 }} />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {order.customer_name || 'Khách vãng lai'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {order.customer_phone || '-'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(order.total_amount)}
                        </Typography>
                        {order.discount_amount > 0 && (
                          <Typography variant="caption" color="success.main">
                            -{formatCurrency(order.discount_amount)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getOrderStatusIcon(order.order_status)}
                          label={order.order_status}
                          size="small"
                          color={getOrderStatusColor(order.order_status) as any}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getPaymentStatusIcon(order.payment_status)}
                          label={order.payment_status}
                          size="small"
                          color={getPaymentStatusColor(order.payment_status) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.payment_method}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.priority}
                          size="small"
                          color={getPriorityColor(order.priority) as any}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(order.created_at).toLocaleDateString('vi-VN')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {calculateOrderAge(order.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Xem chi tiết">
                            <IconButton
                              size="small"
                              onClick={() => handleViewOrder(order)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Chỉnh sửa">
                            <IconButton
                              size="small"
                              onClick={() => handleEditOrder(order)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cập nhật trạng thái">
                            <IconButton
                              size="small"
                              onClick={() => handleUpdateStatus(order)}
                            >
                              <UpdateIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={order.is_favorite ? 'Bỏ yêu thích' : 'Thêm yêu thích'}>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleFavorite(order)}
                            >
                              {order.is_favorite ? <StarIcon /> : <StarBorderIcon />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="In đơn hàng">
                            <IconButton
                              size="small"
                              onClick={() => handlePrintOrder(order)}
                            >
                              <PrintIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Chia sẻ">
                            <IconButton
                              size="small"
                              onClick={() => handleShareOrder(order)}
                            >
                              <ShareIcon />
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
        </Card>
      </motion.div>

      {/* Order Detail Dialog */}
      <Dialog
        open={orderDetailDialog}
        onClose={() => setOrderDetailDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ViewIcon />
              Chi tiết đơn hàng {selectedOrder?.order.order_code}
            </Typography>
            <IconButton onClick={() => setOrderDetailDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              {/* Order Header Info */}
              <Card elevation={0} sx={{ mb: 3, bgcolor: 'grey.50' }}>
                <CardContent>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom color="primary">
                        Thông tin khách hàng
                      </Typography>
                      <Box sx={{ pl: 2 }}>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <PersonIcon sx={{ fontSize: 16 }} />
                          <strong>Tên:</strong> {selectedOrder.order.customer_name || 'Khách vãng lai'}
                        </Typography>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <PhoneIcon sx={{ fontSize: 16 }} />
                          <strong>SĐT:</strong> {selectedOrder.order.customer_phone || '-'}
                        </Typography>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon sx={{ fontSize: 16 }} />
                          <strong>Email:</strong> {selectedOrder.order.customer_email || '-'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" gutterBottom color="primary">
                        Thông tin thanh toán
                      </Typography>
                      <Box sx={{ pl: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Phương thức:</strong> {selectedOrder.order.payment_method}
                        </Typography>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <strong>Trạng thái:</strong>
                          <Chip
                            icon={getPaymentStatusIcon(selectedOrder.order.payment_status)}
                            label={selectedOrder.order.payment_status}
                            size="small"
                            color={getPaymentStatusColor(selectedOrder.order.payment_status) as any}
                          />
                        </Typography>
                        <Typography variant="body2">
                          <strong>Ngày tạo:</strong> {new Date(selectedOrder.order.created_at).toLocaleString('vi-VN')}
                        </Typography>
                      </Box>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" gutterBottom color="primary">
                        Trạng thái đơn hàng
                      </Typography>
                      <Box sx={{ pl: 2 }}>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <strong>Trạng thái:</strong>
                          <Chip
                            icon={getOrderStatusIcon(selectedOrder.order.order_status)}
                            label={selectedOrder.order.order_status}
                            size="small"
                            color={getOrderStatusColor(selectedOrder.order.order_status) as any}
                            variant="outlined"
                          />
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Độ ưu tiên:</strong>
                          <Chip
                            label={selectedOrder.order.priority}
                            size="small"
                            color={getPriorityColor(selectedOrder.order.priority) as any}
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        </Typography>
                        <Typography variant="body2">
                          <strong>Phương thức giao hàng:</strong> {selectedOrder.order.shipping_method}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShoppingCartIcon />
                Sản phẩm trong đơn hàng
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table>
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
                    {selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item) => (
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
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                          <Typography color="text.secondary">
                            Không có sản phẩm nào
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Order Summary */}
              <Card elevation={0} sx={{ bgcolor: 'grey.50' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Tổng kết đơn hàng
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Box sx={{ minWidth: 300 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Tạm tính:</Typography>
                        <Typography variant="body2">
                          {formatCurrency(selectedOrder.order.total_amount - selectedOrder.order.tax_amount + selectedOrder.order.discount_amount)}
                        </Typography>
                      </Box>
                      {selectedOrder.order.discount_amount > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="success.main">Giảm giá:</Typography>
                          <Typography variant="body2" color="success.main">
                            -{formatCurrency(selectedOrder.order.discount_amount)}
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Thuế VAT:</Typography>
                        <Typography variant="body2">{formatCurrency(selectedOrder.order.tax_amount)}</Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>Tổng cộng:</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          {formatCurrency(selectedOrder.order.total_amount)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {selectedOrder.order.notes && (
                <Card elevation={0} sx={{ mt: 3, bgcolor: 'grey.50' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <NoteIcon />
                      Ghi chú
                    </Typography>
                    <Typography variant="body2" sx={{ pl: 2 }}>
                      {selectedOrder.order.notes}
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderDetailDialog(false)}>
            Đóng
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => selectedOrder && handlePrintOrder(selectedOrder.order)}
          >
            In đơn hàng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog
        open={orderStatusDialog}
        onClose={() => setOrderStatusDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <UpdateIcon />
              Cập nhật trạng thái đơn hàng {selectedOrder?.order.order_code}
            </Typography>
            <IconButton onClick={() => setOrderStatusDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              {/* Current Order Info */}
              <Card elevation={0} sx={{ mb: 3, bgcolor: 'grey.50' }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Thông tin đơn hàng hiện tại
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                    <Box>
                      <Typography variant="body2">
                        <strong>Mã đơn hàng:</strong> {selectedOrder.order.order_code}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Khách hàng:</strong> {selectedOrder.order.customer_name || 'Khách vãng lai'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Tổng tiền:</strong> {formatCurrency(selectedOrder.order.total_amount)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2">
                        <strong>Trạng thái đơn hàng:</strong>
                        <Chip
                          icon={getOrderStatusIcon(selectedOrder.order.order_status)}
                          label={selectedOrder.order.order_status}
                          size="small"
                          color={getOrderStatusColor(selectedOrder.order.order_status) as any}
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                      <Typography variant="body2">
                        <strong>Trạng thái thanh toán:</strong>
                        <Chip
                          icon={getPaymentStatusIcon(selectedOrder.order.payment_status)}
                          label={selectedOrder.order.payment_status}
                          size="small"
                          color={getPaymentStatusColor(selectedOrder.order.payment_status) as any}
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Status Update Form */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2, mb: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Trạng thái đơn hàng</InputLabel>
                  <Select
                    value={statusForm.order_status}
                    label="Trạng thái đơn hàng"
                    onChange={(e) => setStatusForm(prev => ({ ...prev, order_status: e.target.value }))}
                  >
                    <MenuItem value="pending">Chờ xử lý</MenuItem>
                    <MenuItem value="processing">Đang xử lý</MenuItem>
                    <MenuItem value="shipped">Đã giao</MenuItem>
                    <MenuItem value="delivered">Đã nhận</MenuItem>
                    <MenuItem value="cancelled">Đã hủy</MenuItem>
                    <MenuItem value="refunded">Đã hoàn tiền</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Trạng thái thanh toán</InputLabel>
                  <Select
                    value={statusForm.payment_status}
                    label="Trạng thái thanh toán"
                    onChange={(e) => setStatusForm(prev => ({ ...prev, payment_status: e.target.value }))}
                  >
                    <MenuItem value="paid">Đã thanh toán</MenuItem>
                    <MenuItem value="pending">Chờ thanh toán</MenuItem>
                    <MenuItem value="cancelled">Đã hủy</MenuItem>
                    <MenuItem value="refunded">Đã hoàn tiền</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <TextField
                fullWidth
                label="Ghi chú (tùy chọn)"
                multiline
                rows={4}
                value={statusForm.notes}
                onChange={(e) => setStatusForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Nhập ghi chú về việc cập nhật trạng thái..."
                sx={{ mb: 2 }}
              />

              {/* Status History */}
              <Card elevation={0} sx={{ bgcolor: 'grey.50' }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Lịch sử thay đổi trạng thái
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                          <UpdateIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Đơn hàng được tạo"
                        secondary={`${new Date(selectedOrder.order.created_at).toLocaleString('vi-VN')} - Trạng thái: ${selectedOrder.order.order_status}`}
                      />
                    </ListItem>
                    {selectedOrder.order.updated_at !== selectedOrder.order.created_at && (
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'info.main', width: 32, height: 32 }}>
                            <EditIcon sx={{ fontSize: 16 }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary="Cập nhật lần cuối"
                          secondary={`${new Date(selectedOrder.order.updated_at).toLocaleString('vi-VN')}`}
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderStatusDialog(false)}>
            Hủy
          </Button>
          <Button
            onClick={() => {
              toast.success('Cập nhật trạng thái thành công');
              setOrderStatusDialog(false);
            }}
            variant="contained"
            startIcon={<SaveIcon />}
          >
            Cập nhật trạng thái
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <Dialog
        open={exportDialog}
        onClose={() => setExportDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ExportIcon />
              Xuất dữ liệu đơn hàng
            </Typography>
            <IconButton onClick={() => setExportDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Định dạng file</InputLabel>
              <Select defaultValue="excel" label="Định dạng file">
                <MenuItem value="excel">Excel (.xlsx)</MenuItem>
                <MenuItem value="csv">CSV (.csv)</MenuItem>
                <MenuItem value="pdf">PDF (.pdf)</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Khoảng thời gian</InputLabel>
              <Select defaultValue="all" label="Khoảng thời gian">
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="today">Hôm nay</MenuItem>
                <MenuItem value="week">Tuần này</MenuItem>
                <MenuItem value="month">Tháng này</MenuItem>
                <MenuItem value="quarter">Quý này</MenuItem>
                <MenuItem value="year">Năm này</MenuItem>
                <MenuItem value="custom">Tùy chọn</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Trạng thái đơn hàng</InputLabel>
              <Select defaultValue="all" label="Trạng thái đơn hàng">
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="pending">Chờ xử lý</MenuItem>
                <MenuItem value="processing">Đang xử lý</MenuItem>
                <MenuItem value="completed">Đã hoàn thành</MenuItem>
                <MenuItem value="cancelled">Đã hủy</MenuItem>
              </Select>
            </FormControl>

            <Alert severity="info" sx={{ mb: 2 }}>
              Dữ liệu sẽ được xuất theo bộ lọc hiện tại. Tổng số đơn hàng: {filteredOrders.length}
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>
            Hủy
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => {
              toast.success('Đang xuất dữ liệu...');
              setExportDialog(false);
            }}
          >
            Xuất dữ liệu
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Orders;
