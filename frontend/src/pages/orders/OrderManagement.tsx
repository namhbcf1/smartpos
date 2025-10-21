import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Grid,
  IconButton,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Skeleton,
  Zoom,
  Paper,
  Divider,
  Stack,
  Tooltip,
  Fade,
  Slide,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  LinearProgress,
  CircularProgress,
  Backdrop,
  Drawer,
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery,
  alpha,
  styled,
} from '@mui/material';
import {
  Search,
  Add,
  Refresh,
  Visibility,
  Edit,
  Print,
  ShoppingCart,
  CheckCircle,
  Cancel,
  Pending,
  Person,
  Phone,
  Email,
  LocationOn,
  Payment,
  Receipt,
  TrendingUp,
  MonetizationOn,
  Assessment,
  FilterList,
  Sort,
  Clear,
  Delete,
  MoreVert,
  Download,
  Upload,
  QrCode,
  Timeline,
  Analytics,
  Speed,
  Star,
  Favorite,
  Share,
  Notifications,
  Settings,
  Dashboard,
  Inventory,
  LocalShipping,
  AttachMoney,
  Schedule,
  Today,
  DateRange,
  FilterAlt,
  ViewList,
  ViewModule,
  ViewQuilt,
  AutoAwesome,
  Psychology,
  Lightbulb,
  Rocket,
  FlashOn,
  TrendingDown,
  TrendingFlat,
  Compare,
  Insights,
  BarChart,
  PieChart,
  ShowChart,
  TableChart,
  ViewInAr,
  Palette,
  Brush,
  DesignServices,
  Architecture,
  Engineering,
  Build,
  Construction,
  Precision,
  Tune,
  Adjust,
  TuneOutlined,
  TuneRounded,
  TuneSharp,
  TuneTwoTone,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersAPI, settingsAPI, shippingAPI } from '../../services/api';
import { formatVND } from '../../utils/money';
import { useAuth } from '../../hooks/useAuth';

// ===== STYLED COMPONENTS =====
const GradientCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  borderRadius: 16,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
  },
}));

const AnimatedCard = styled(Card)(({ theme }) => ({
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
  },
}));

const StatusChip = styled(Chip)(({ theme, status }: { theme: any; status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return theme.palette.success.main;
      case 'pending': return theme.palette.warning.main;
      case 'cancelled': return theme.palette.error.main;
      case 'draft': return theme.palette.grey[500];
      default: return theme.palette.grey[500];
    }
  };

  return {
    background: `linear-gradient(45deg, ${getStatusColor(status)} 30%, ${alpha(getStatusColor(status), 0.8)} 90%)`,
    color: 'white',
    fontWeight: 600,
    borderRadius: 20,
    '& .MuiChip-icon': {
      color: 'white',
    },
  };
});

// ===== ORDER STATUS COMPONENT =====
const OrderStatusChip: React.FC<{ status: string }> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { label: 'Hoàn thành', icon: CheckCircle, color: 'success' };
      case 'pending':
        return { label: 'Đang xử lý', icon: Pending, color: 'warning' };
      case 'cancelled':
        return { label: 'Đã hủy', icon: Cancel, color: 'error' };
      case 'draft':
        return { label: 'Nháp', icon: Edit, color: 'default' };
      default:
        return { label: status, icon: ShoppingCart, color: 'default' };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <StatusChip
      icon={<Icon />}
      label={config.label}
      status={status}
      size="small"
      variant="filled"
    />
  );
};

// ===== SMART STATS CARDS =====
const SmartStatsCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  loading?: boolean;
}> = ({ title, value, icon: Icon, trend, color, loading = false }) => {
  const theme = useTheme();

  if (loading) {
  return (
      <GradientCard sx={{ height: '100%' }}>
              <CardContent>
          <LinearProgress sx={{ mb: 2 }} />
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="40%" height={32} />
              </CardContent>
      </GradientCard>
    );
  }

  return (
    <GradientCard sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
              <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                              <Box>
            <Typography color="text.secondary" gutterBottom variant="body2" sx={{ fontWeight: 500 }}>
              {title}
                                </Typography>
            <Typography variant="h4" component="div" fontWeight="bold" sx={{ mb: 1 }}>
              {value}
                                </Typography>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {trend.isPositive ? (
                  <TrendingUp sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                ) : (
                  <TrendingDown sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
                )}
                <Typography
                  variant="body2"
                  color={trend.isPositive ? 'success.main' : 'error.main'}
                  fontWeight="medium"
                >
                  {Math.abs(trend.value)}%
                      </Typography>
                    </Box>
            )}
                  </Box>
          <Avatar
            sx={{
              bgcolor: `${color}.main`,
              width: 64,
              height: 64,
              boxShadow: 3,
              background: `linear-gradient(45deg, ${theme.palette[color].main} 30%, ${alpha(theme.palette[color].main, 0.8)} 90%)`,
            }}
          >
            <Icon sx={{ fontSize: 32 }} />
          </Avatar>
                </Box>
              </CardContent>
    </GradientCard>
  );
};

// ===== SMART ORDER CARD =====
const SmartOrderCard: React.FC<{
  order: any;
  onView: (order: any) => void;
  onEdit: (order: any) => void;
  onPrint: (order: any) => void;
  onCancel?: (order: any) => void;
  onFulfill?: (order: any) => void;
  onDelete?: (order: any) => void;
}> = ({ order, onView, onEdit, onPrint, onCancel, onFulfill, onDelete }) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(cents);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getPriorityColor = (status: string) => {
    switch (status) {
      case 'completed': return theme.palette.success.main;
      case 'pending': return theme.palette.warning.main;
      case 'cancelled': return theme.palette.error.main;
      case 'draft': return theme.palette.grey[500];
      default: return theme.palette.grey[500];
    }
  };

  return (
    <AnimatedCard
      sx={{
        mb: 2,
        border: `2px solid ${alpha(getPriorityColor(order.status), 0.2)}`,
        position: 'relative',
        overflow: 'visible',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
              #{order.order_number || order.id.slice(-8)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDate(order.created_at)} • {formatTime(order.created_at)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <OrderStatusChip status={order.status} />
            <IconButton size="small" onClick={() => onView(order)}>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Khách hàng
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {order.customer_name || 'Khách lẻ'}
            </Typography>
            {order.customer_phone && (
              <Typography variant="caption" color="text.secondary">
                {order.customer_phone}
              </Typography>
            )}
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h5" fontWeight="bold" color="primary.main">
            {formatCurrency(order.total_cents || 0)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
              {order.payment_method || 'Tiền mặt'}
          </Typography>
        </Box>
        </Box>

        <Fade in={isHovered} timeout={300}>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2 }}>
            <Tooltip title="Xem chi tiết">
              <IconButton size="small" onClick={() => onView(order)} color="primary">
                <Visibility />
              </IconButton>
            </Tooltip>
            <Tooltip title="Chỉnh sửa">
              <IconButton size="small" onClick={() => onEdit(order)} color="secondary">
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title="In hóa đơn">
              <IconButton size="small" onClick={() => onPrint(order)} color="info">
                <Print />
              </IconButton>
            </Tooltip>
          {order.status === 'pending' && onFulfill && (
              <Tooltip title="Hoàn thành">
                <IconButton size="small" onClick={() => onFulfill(order)} color="success">
                  <CheckCircle />
                </IconButton>
              </Tooltip>
            )}
            {order.status === 'pending' && onCancel && (
              <Tooltip title="Hủy đơn">
                <IconButton size="small" onClick={() => onCancel(order)} color="error">
                  <Cancel />
                </IconButton>
              </Tooltip>
          )}
        </Box>
        </Fade>
      </CardContent>
    </AnimatedCard>
  );
};

// ===== MAIN ORDER MANAGEMENT COMPONENT =====
const OrderManagement: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  // FETCH ORDERS FROM API
  const { data: ordersData, isLoading: ordersLoading, refetch } = useQuery({
    queryKey: ['orders', page, searchTerm, statusFilter, sortBy, sortOrder],
    queryFn: () => ordersAPI.getOrders(page, 50),
    staleTime: 30000,
  });

  const orders = ordersData?.data?.orders || [];

  // UPDATE ORDER MUTATION
  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => ordersAPI.updateOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  // DELETE ORDER MUTATION
  const deleteOrderMutation = useMutation({
    mutationFn: (id: string) => ordersAPI.deleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const filteredOrders = useMemo(() => {
    return orders.filter((order: any) => {
      const matchesSearch = !searchTerm ||
        (order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_phone?.includes(searchTerm));

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const handleViewOrder = useCallback(async (order: any) => {
    setSelectedOrder(order);
    setDetailOpen(true);

    // Fetch full order details with items
    try {
      const response = await ordersAPI.getOrder(order.id);
      // API returns nested structure: { success, data: { success, data: { actual order } } }
      if (response.data?.data?.data) {
        setSelectedOrder(response.data.data.data);
      } else if (response.data?.data) {
        setSelectedOrder(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  }, []);

  const handleEditOrder = useCallback((order: any) => {
    setSelectedOrder(order);
    setEditFormData({
      status: order.status || 'pending',
      payment_status: order.payment_status || 'pending',
      payment_method: order.payment_method || 'cash',
      customer_name: order.customer_name || '',
      customer_phone: order.customer_phone || '',
      notes: order.notes || '',
    });
    setEditOpen(true);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!selectedOrder) return;

    try {
      await updateOrderMutation.mutateAsync({
        id: selectedOrder.id,
        data: editFormData,
      });
      setEditOpen(false);
      alert('Đã cập nhật đơn hàng thành công!');
    } catch (error) {
      alert('Lỗi khi cập nhật đơn hàng');
    }
  }, [selectedOrder, editFormData, updateOrderMutation]);

  const handlePrintOrder = useCallback(async (order: any) => {
    // Fetch full order details with items
    let fullOrder = order;
    try {
      const response = await ordersAPI.getOrder(order.id);
      // API returns nested structure: { success, data: { success, data: { actual order } } }
      if (response.data?.data?.data) {
        fullOrder = response.data.data.data;
      } else if (response.data?.data) {
        fullOrder = response.data.data;
      }
    } catch (error) {
      console.error('Error fetching order for print:', error);
    }

    // Get store settings from localStorage
    let storeSettings = {
      name: 'SMART POS SYSTEM',
      address: '123 Đường ABC, Quận 1, TP.HCM',
      phone: '0901 234 567',
      email: 'info@smartpos.vn'
    };

    try {
      const savedSettings = localStorage.getItem('store_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        storeSettings = {
          name: parsed.name || storeSettings.name,
          address: parsed.address || storeSettings.address,
          phone: parsed.phone || storeSettings.phone,
          email: parsed.email || storeSettings.email
        };
      }
    } catch (e) {
      console.error('Failed to load store settings:', e);
    }

    const items = fullOrder.items || [];
    const itemsHtml = items.map((item: any, index: number) => `
      <tr>
        <td style="text-align: center; padding: 12px 8px; border-bottom: 1px solid #e0e0e0;">${index + 1}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e0e0e0;">
          <div style="font-weight: 600; color: #1a1a1a; margin-bottom: 4px;">${item.product_name || 'N/A'}</div>
          <div style="font-size: 12px; color: #666;">SKU: ${item.product_sku || 'N/A'}</div>
        </td>
        <td style="text-align: center; padding: 12px 8px; border-bottom: 1px solid #e0e0e0;">${item.quantity || 0}</td>
        <td style="text-align: right; padding: 12px 8px; border-bottom: 1px solid #e0e0e0;">${formatVND(item.unit_price_cents || 0)}</td>
        <td style="text-align: right; padding: 12px 8px; border-bottom: 1px solid #e0e0e0; font-weight: 600;">${formatVND(item.total_price_cents || 0)}</td>
      </tr>
    `).join('');

    const printContent = `
      <!DOCTYPE html>
      <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Hóa đơn #${fullOrder.order_number || fullOrder.id}</title>
          <style>
            @page {
              size: A4;
              margin: 10mm;
            }

            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            html, body {
              height: 100%;
              margin: 0;
              padding: 0;
            }

            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.3;
              color: #333;
              background: white;
              padding: 10px;
              font-size: 11px;
            }

            .invoice-wrapper {
              max-width: 100%;
              height: 100%;
              margin: 0 auto;
              background: white;
              display: flex;
              flex-direction: column;
            }

            /* Header */
            .invoice-header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 12px 15px;
              border-radius: 6px 6px 0 0;
              margin-bottom: 12px;
            }

            .company-info {
              margin-bottom: 8px;
            }

            .company-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 3px;
            }

            .company-details {
              font-size: 10px;
              opacity: 0.95;
            }

            .invoice-title {
              font-size: 22px;
              font-weight: bold;
              text-align: center;
              margin: 8px 0;
              letter-spacing: 1px;
            }

            .invoice-meta {
              display: flex;
              justify-content: space-between;
              background: rgba(255,255,255,0.15);
              padding: 8px 12px;
              border-radius: 4px;
            }

            .invoice-meta div {
              font-size: 10px;
            }

            .invoice-meta strong {
              font-weight: 600;
            }

            /* Customer Info */
            .customer-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-bottom: 12px;
            }

            .info-box {
              background: #f8f9fa;
              padding: 10px;
              border-radius: 4px;
              border-left: 3px solid #667eea;
            }

            .info-box h3 {
              color: #667eea;
              font-size: 11px;
              margin-bottom: 6px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
              border-bottom: 1px solid #e0e0e0;
            }

            .info-row:last-child {
              border-bottom: none;
            }

            .info-label {
              color: #666;
              font-size: 10px;
            }

            .info-value {
              font-weight: 600;
              color: #1a1a1a;
              font-size: 10px;
            }

            /* Items Table */
            .items-section {
              margin-bottom: 12px;
              flex: 1;
              overflow: hidden;
            }

            .items-section h3 {
              color: #1a1a1a;
              font-size: 12px;
              margin-bottom: 8px;
              padding-bottom: 5px;
              border-bottom: 2px solid #667eea;
            }

            .items-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
            }

            .items-table thead {
              background: #667eea;
              color: white;
            }

            .items-table th {
              padding: 6px 4px;
              text-align: left;
              font-weight: 600;
              font-size: 10px;
              text-transform: uppercase;
            }

            .items-table td {
              padding: 4px;
              font-size: 10px;
            }

            .items-table tbody tr {
              border-bottom: 1px solid #eee;
            }

            /* Summary */
            .summary-section {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 12px;
            }

            .summary-box {
              width: 300px;
              background: #f8f9fa;
              border-radius: 4px;
              overflow: hidden;
            }

            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 6px 12px;
              border-bottom: 1px solid #e0e0e0;
            }

            .summary-row:last-child {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border-bottom: none;
            }

            .summary-label {
              font-size: 10px;
              font-weight: 500;
            }

            .summary-value {
              font-size: 10px;
              font-weight: 600;
            }

            .summary-row:last-child .summary-label,
            .summary-row:last-child .summary-value {
              font-size: 12px;
              font-weight: bold;
            }

            /* Notes */
            .notes-section {
              background: #fff3cd;
              border-left: 3px solid #ffc107;
              padding: 8px;
              border-radius: 4px;
              margin-bottom: 12px;
            }

            .notes-section h4 {
              color: #856404;
              font-size: 11px;
              margin-bottom: 4px;
            }

            .notes-section p {
              color: #856404;
              font-size: 10px;
              line-height: 1.4;
            }

            /* Footer */
            .invoice-footer {
              border-top: 1px solid #e0e0e0;
              padding-top: 12px;
              margin-top: auto;
            }

            .signature-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 12px;
            }

            .signature-box {
              text-align: center;
            }

            .signature-box h4 {
              font-size: 10px;
              color: #666;
              margin-bottom: 30px;
            }

            .signature-line {
              border-top: 1px solid #333;
              padding-top: 5px;
              font-size: 9px;
              color: #666;
            }

            .thank-you {
              text-align: center;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 10px;
              border-radius: 4px;
            }

            .thank-you h3 {
              font-size: 13px;
              margin-bottom: 4px;
            }

            .thank-you p {
              font-size: 10px;
              opacity: 0.95;
            }

            /* Print styles */
            @media print {
              html, body {
                height: 100%;
                overflow: hidden;
              }

              body {
                padding: 0;
              }

              @page {
                margin: 10mm;
              }

              .invoice-wrapper {
                box-shadow: none;
                page-break-after: avoid;
                page-break-inside: avoid;
              }

              .items-table tbody tr:hover {
                background: transparent;
              }

              .invoice-footer {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-wrapper">
            <!-- Header -->
            <div class="invoice-header">
              <div class="company-info">
                <div>
                  <div class="company-name">${storeSettings.name}</div>
                  <div class="company-details">Hệ thống quản lý bán hàng thông minh</div>
                  <div class="company-details">📍 ${storeSettings.address}</div>
                  <div class="company-details">📞 ${storeSettings.phone} | 📧 ${storeSettings.email}</div>
                </div>
              </div>

              <div class="invoice-title">HÓA ĐƠN BÁN HÀNG</div>

              <div class="invoice-meta">
                <div><strong>Số hóa đơn:</strong> ${fullOrder.order_number || fullOrder.id}</div>
                <div><strong>Ngày:</strong> ${new Date(fullOrder.created_at).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</div>
              </div>
            </div>

            <!-- Customer Info -->
            <div class="customer-section">
              <div class="info-box">
                <h3>Thông Tin Khách Hàng</h3>
                <div class="info-row">
                  <span class="info-label">Họ và tên:</span>
                  <span class="info-value">${fullOrder.customer_name || 'Khách lẻ'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Số điện thoại:</span>
                  <span class="info-value">${fullOrder.customer_phone || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Mã khách hàng:</span>
                  <span class="info-value">${fullOrder.customer_id || 'N/A'}</span>
                </div>
              </div>

              <div class="info-box">
                <h3>Thông Tin Thanh Toán</h3>
                <div class="info-row">
                  <span class="info-label">Phương thức:</span>
                  <span class="info-value">${fullOrder.payment_method === 'cash' ? 'Tiền mặt' :
                    fullOrder.payment_method === 'card' ? 'Thẻ' :
                    fullOrder.payment_method === 'bank_transfer' ? 'Chuyển khoản' :
                    fullOrder.payment_method === 'momo' ? 'MoMo' :
                    fullOrder.payment_method === 'zalopay' ? 'ZaloPay' :
                    fullOrder.payment_method === 'vnpay' ? 'VNPay' :
                    fullOrder.payment_method || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Trạng thái:</span>
                  <span class="info-value">${fullOrder.payment_status === 'paid' ? '✅ Đã thanh toán' : '⏳ Chưa thanh toán'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Người bán:</span>
                  <span class="info-value">${fullOrder.user_id || 'N/A'}</span>
                </div>
              </div>
            </div>

            <!-- Items -->
            <div class="items-section">
              <h3>Chi Tiết Sản Phẩm</h3>
              <table class="items-table">
                <thead>
                  <tr>
                    <th style="width: 50px; text-align: center;">STT</th>
                    <th>Sản phẩm</th>
                    <th style="width: 100px; text-align: center;">Số lượng</th>
                    <th style="width: 120px; text-align: right;">Đơn giá</th>
                    <th style="width: 120px; text-align: right;">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml || '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #999;">Không có sản phẩm</td></tr>'}
                </tbody>
              </table>
            </div>

            <!-- Summary -->
            <div class="summary-section">
              <div class="summary-box">
                <div class="summary-row">
                  <span class="summary-label">Tạm tính:</span>
                  <span class="summary-value">${formatVND(fullOrder.subtotal_cents || 0)}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">Giảm giá:</span>
                  <span class="summary-value" style="color: #e53935;">-${formatVND(fullOrder.discount_cents || 0)}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">Thuế (VAT):</span>
                  <span class="summary-value">${formatVND(fullOrder.tax_cents || 0)}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">TỔNG CỘNG:</span>
                  <span class="summary-value">${formatVND(fullOrder.total_cents || 0)}</span>
                </div>
              </div>
            </div>

            <!-- Notes -->
            ${fullOrder.notes ? `
              <div class="notes-section">
                <h4>📝 Ghi chú:</h4>
                <p>${fullOrder.notes}</p>
              </div>
            ` : ''}

            <!-- Footer -->
            <div class="invoice-footer">
              <div class="signature-section">
                <div class="signature-box">
                  <h4>Người mua hàng</h4>
                  <div class="signature-line">(Ký và ghi rõ họ tên)</div>
                </div>
                <div class="signature-box">
                  <h4>Người bán hàng</h4>
                  <div class="signature-line">(Ký và ghi rõ họ tên)</div>
                </div>
              </div>

              <div class="thank-you">
                <h3>🎉 Cảm ơn quý khách đã mua hàng!</h3>
                <p>Hẹn gặp lại quý khách trong lần mua hàng tiếp theo</p>
              </div>

              <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                <p style="font-size: 11px; color: #999; margin-bottom: 4px;">
                  Hóa đơn được in bởi: <strong>${user?.full_name || user?.username || 'Admin'}</strong> (${user?.username || 'admin'})
                </p>
                <p style="font-size: 10px; color: #999;">
                  Thời gian in: ${new Date().toLocaleString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </p>
                <p style="font-size: 9px; color: #ccc; margin-top: 8px;">
                  Powered by ${storeSettings.name}
                </p>
              </div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  }, []);

  const handleCancelOrder = useCallback(async (order: any) => {
    if (window.confirm(`Bạn có chắc muốn hủy đơn hàng #${order.order_number}?`)) {
      try {
        await updateOrderMutation.mutateAsync({
          id: order.id,
          data: { status: 'cancelled' },
        });
        alert('Đã hủy đơn hàng thành công!');
      } catch (error) {
        alert('Lỗi khi hủy đơn hàng');
      }
    }
  }, [updateOrderMutation]);

  const handleFulfillOrder = useCallback(async (order: any) => {
    if (window.confirm(`Xác nhận hoàn thành đơn hàng #${order.order_number}?`)) {
      try {
        await updateOrderMutation.mutateAsync({
          id: order.id,
          data: { status: 'completed' },
        });
        alert('Đã hoàn thành đơn hàng!');
      } catch (error) {
        alert('Lỗi khi cập nhật đơn hàng');
      }
    }
  }, [updateOrderMutation]);

  const handleDeleteOrder = useCallback(async (order: any) => {
    if (window.confirm(`Bạn có chắc muốn XÓA đơn hàng #${order.order_number}? Hành động này không thể hoàn tác!`)) {
      try {
        await deleteOrderMutation.mutateAsync(order.id);
        alert('Đã xóa đơn hàng!');
      } catch (error) {
        alert('Lỗi khi xóa đơn hàng');
      }
    }
  }, [deleteOrderMutation]);

  // GHTK actions
  const sendToGhtk = useCallback(async () => {
    if (!selectedOrder) return;
    try {
      const res = await shippingAPI.ghtk.fromOrder(selectedOrder.id);
      const ok = res.data?.success;
      alert(ok ? 'Đã gửi đơn đến GHTK' : (res.data?.error || 'Gửi thất bại'));
    } catch (e: any) {
      alert(e?.message || 'Gửi thất bại');
    }
  }, [selectedOrder]);

  const printLabelGhtk = useCallback(async () => {
    if (!selectedOrder?.shipping_order_code) {
      alert('Chưa có mã vận đơn');
      return;
    }
    try {
      const res = await shippingAPI.ghtk.label(selectedOrder.shipping_order_code);
      alert(res.data?.success ? 'Đã lấy nhãn thành công' : (res.data?.error || 'Lấy nhãn thất bại'));
    } catch (e: any) {
      alert(e?.message || 'Lỗi lấy nhãn');
    }
  }, [selectedOrder]);

  const syncGhtk = useCallback(async () => {
    if (!selectedOrder?.shipping_order_code) {
      alert('Chưa có mã vận đơn');
      return;
    }
    try {
      const res = await shippingAPI.track(`/shipping/sync/ghtk/${encodeURIComponent(selectedOrder.shipping_order_code)}` as any);
      // Fallback: directly call label track endpoint for feedback
      alert('Đã yêu cầu đồng bộ');
    } catch {
      alert('Đã yêu cầu đồng bộ');
    }
  }, [selectedOrder]);

  const cancelGhtk = useCallback(async () => {
    if (!selectedOrder?.shipping_order_code) {
      alert('Chưa có mã vận đơn');
      return;
    }
    if (!window.confirm('Xác nhận hủy đơn GHTK?')) return;
    try {
      const res = await shippingAPI.ghtk.cancel(selectedOrder.shipping_order_code);
      alert(res.data?.success ? 'Đã hủy đơn GHTK' : (res.data?.error || 'Hủy thất bại'));
    } catch (e: any) {
      alert(e?.message || 'Hủy thất bại');
    }
  }, [selectedOrder]);

  const stats = useMemo(() => {
    const total = orders.length;
    const completed = orders.filter((o: any) => o.status === 'completed').length;
    const pending = orders.filter((o: any) => o.status === 'pending').length;
    const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.total_cents || 0), 0);

    return {
      total,
      completed,
      pending,
      totalRevenue,
    };
  }, [orders]);

    return (
    <Box sx={{ p: 3, bgcolor: 'grey.50', minHeight: '100vh' }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 1, background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`, backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Quản lý đơn hàng
        </Typography>
        <Typography variant="body1" color="text.secondary">
              Quản lý và theo dõi tất cả đơn hàng một cách thông minh
        </Typography>
      </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              sx={{ borderRadius: 3, px: 3, py: 1.5 }}
              onClick={() => window.location.href = '/pos'}
            >
              Tạo đơn hàng
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              sx={{ borderRadius: 3, px: 3, py: 1.5 }}
              onClick={() => refetch()}
              disabled={ordersLoading}
            >
              {ordersLoading ? 'Đang tải...' : 'Làm mới'}
        </Button>
      </Box>
              </Box>
        
        {/* Smart Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
            <SmartStatsCard
              title="Tổng đơn hàng"
              value={stats.total}
              icon={ShoppingCart}
              color="primary"
              trend={{ value: 12, isPositive: true }}
              loading={ordersLoading}
            />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
            <SmartStatsCard
              title="Đã hoàn thành"
              value={stats.completed}
              icon={CheckCircle}
              color="success"
              trend={{ value: 8, isPositive: true }}
              loading={ordersLoading}
            />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
            <SmartStatsCard
              title="Đang xử lý"
              value={stats.pending}
              icon={Pending}
              color="warning"
              trend={{ value: 5, isPositive: false }}
              loading={ordersLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <SmartStatsCard
              title="Tổng doanh thu"
              value={formatVND(stats.totalRevenue)}
              icon={AttachMoney}
              color="secondary"
              trend={{ value: 15, isPositive: true }}
              loading={ordersLoading}
            />
        </Grid>
      </Grid>

        {/* Search and Filter Section */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
            <TextField
                fullWidth
              placeholder="Tìm kiếm đơn hàng, khách hàng..."
              value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                }}
                sx={{ borderRadius: 3 }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Trạng thái"
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="completed">Hoàn thành</MenuItem>
                  <MenuItem value="pending">Đang xử lý</MenuItem>
                  <MenuItem value="cancelled">Đã hủy</MenuItem>
                  <MenuItem value="draft">Nháp</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Sắp xếp</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sắp xếp"
                >
                  <MenuItem value="created_at">Ngày tạo</MenuItem>
                  <MenuItem value="total_cents">Giá trị</MenuItem>
                  <MenuItem value="customer_name">Khách hàng</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Thứ tự</InputLabel>
                <Select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  label="Thứ tự"
                >
                  <MenuItem value="desc">Mới nhất</MenuItem>
                  <MenuItem value="asc">Cũ nhất</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  onClick={() => setViewMode('grid')}
                  color={viewMode === 'grid' ? 'primary' : 'default'}
                >
                  <ViewModule />
                </IconButton>
                <IconButton
                  onClick={() => setViewMode('list')}
                  color={viewMode === 'list' ? 'primary' : 'default'}
                >
                  <ViewList />
                </IconButton>
            </Box>
            </Grid>
        </Grid>
        </Paper>
      </Box>

      {/* Orders Content */}
      {viewMode === 'grid' ? (
        <Grid container spacing={3}>
          {filteredOrders.map((order) => (
            <Grid item xs={12} sm={6} md={4} key={order.id}>
              <SmartOrderCard
                    order={order}
                onView={handleViewOrder}
                onEdit={handleEditOrder}
                onPrint={handlePrintOrder}
                onCancel={handleCancelOrder}
                onFulfill={handleFulfillOrder}
                onDelete={handleDeleteOrder}
              />
              </Grid>
            ))}
          </Grid>
      ) : (
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell>Mã đơn hàng</TableCell>
                  <TableCell>Khách hàng</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="right">Tổng tiền</TableCell>
                  <TableCell>Ngày tạo</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        #{order.order_number}
        </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {order.customer_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.customer_phone}
        </Typography>
      </Box>
                    </TableCell>
                    <TableCell>
                      <OrderStatusChip status={order.status} />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatVND(order.total_cents)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(order.created_at).toLocaleDateString('vi-VN')}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Xem chi tiết">
                          <IconButton size="small" onClick={() => handleViewOrder(order)}>
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Chỉnh sửa">
                          <IconButton size="small" onClick={() => handleEditOrder(order)}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="In hóa đơn">
                          <IconButton size="small" onClick={() => handlePrintOrder(order)}>
                            <Print />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

          {/* Pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
          count={Math.ceil(filteredOrders.length / 10)}
                page={page}
          onChange={(_, value) => setPage(value)}
                color="primary"
                size="large"
              />
            </Box>

      {/* Order Detail Dialog */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: 24,
          }
        }}
      >
        <DialogTitle sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          pb: 3
          }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
              <Typography variant="h5" fontWeight="bold">
                Đơn hàng #{selectedOrder?.order_number}
                  </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                {selectedOrder?.created_at ? new Date(selectedOrder.created_at).toLocaleString('vi-VN') : ''}
                  </Typography>
                </Box>
            {selectedOrder && <OrderStatusChip status={selectedOrder.status} />}
              </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {selectedOrder && (
            <Grid container spacing={3}>
              {/* Customer Information */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person color="primary" />
                      Thông tin khách hàng
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Stack spacing={2}>
                <Box>
                        <Typography variant="body2" color="text.secondary">
                          Tên khách hàng
                  </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedOrder.customer_name || 'N/A'}
                  </Typography>
                </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Số điện thoại
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedOrder.customer_phone || 'N/A'}
                        </Typography>
              </Box>
                <Box>
                        <Typography variant="body2" color="text.secondary">
                          Mã khách hàng
                  </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedOrder.customer_id || 'N/A'}
                  </Typography>
                </Box>
                    </Stack>
            </CardContent>
          </Card>
        </Grid>
        
              {/* Payment Information */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Payment color="primary" />
                      Thông tin thanh toán
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Stack spacing={2}>
                <Box>
                        <Typography variant="body2" color="text.secondary">
                          Phương thức thanh toán
                  </Typography>
                        <Chip
                          label={selectedOrder.payment_method || 'cash'}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Trạng thái thanh toán
                  </Typography>
                        <Chip
                          label={selectedOrder.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                          size="small"
                          color={selectedOrder.payment_status === 'paid' ? 'success' : 'warning'}
                          sx={{ mt: 0.5 }}
                        />
                </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          In hóa đơn
                        </Typography>
                        <Chip
                          label={selectedOrder.receipt_printed ? 'Đã in' : 'Chưa in'}
                          size="small"
                          color={selectedOrder.receipt_printed ? 'success' : 'default'}
                          sx={{ mt: 0.5 }}
                        />
              </Box>
                    </Stack>
            </CardContent>
          </Card>
      </Grid>

              {/* Order Summary */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Receipt color="primary" />
                      Tổng quan đơn hàng
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={3}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                          Tạm tính
                        </Typography>
                  <Typography variant="h6" fontWeight="bold">
                          {formatVND(selectedOrder.subtotal_cents || 0)}
                  </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                          Giảm giá
                  </Typography>
                        <Typography variant="h6" fontWeight="bold" color="error.main">
                          -{formatVND(selectedOrder.discount_cents || 0)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                          Thuế
                        </Typography>
                  <Typography variant="h6" fontWeight="bold">
                          {formatVND(selectedOrder.tax_cents || 0)}
                  </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                          Tổng cộng
                  </Typography>
                        <Typography variant="h6" fontWeight="bold" color="primary.main">
                          {formatVND(selectedOrder.total_cents || 0)}
                        </Typography>
                      </Grid>
                    </Grid>
            </CardContent>
          </Card>
              </Grid>

              {/* Order Items (if available) */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ShoppingCart color="primary" />
                        Sản phẩm ({selectedOrder.items.length})
                  </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Sản phẩm</TableCell>
                              <TableCell align="center">Số lượng</TableCell>
                              <TableCell align="right">Đơn giá</TableCell>
                              <TableCell align="right">Thành tiền</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedOrder.items.map((item: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <Typography variant="body2" fontWeight="medium">
                                    {item.product_name || 'N/A'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    SKU: {item.product_sku || 'N/A'}
                                  </Typography>
                                  {item.serial_numbers && (
                                    <Typography variant="caption" color="primary" display="block">
                                      SN: {String(item.serial_numbers)}
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell align="center">
                                  <Chip label={item.quantity || 0} size="small" />
                                </TableCell>
                                <TableCell align="right">
                                  {formatVND(item.unit_price_cents || 0)}
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" fontWeight="bold">
                                    {formatVND(item.total_price_cents || 0)}
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
              )}

              {/* Notes */}
              {selectedOrder.notes && (
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Ghi chú
                  </Typography>
                      <Divider sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                        {selectedOrder.notes}
                  </Typography>
            </CardContent>
          </Card>
                </Grid>
              )}

              {/* System Info */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: 'grey.50' }}>
        <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Thông tin hệ thống
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={4}>
                        <Typography variant="caption" color="text.secondary">
                          ID đơn hàng
                        </Typography>
                        <Typography variant="body2" fontFamily="monospace">
                          {selectedOrder.id}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <Typography variant="caption" color="text.secondary">
                          Người tạo
                        </Typography>
                        <Typography variant="body2">
                          {selectedOrder.user_id || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <Typography variant="caption" color="text.secondary">
                          Cửa hàng
                        </Typography>
                        <Typography variant="body2">
                          {selectedOrder.store_id || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <Typography variant="caption" color="text.secondary">
                          Ngày tạo
                        </Typography>
                        <Typography variant="body2">
                          {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString('vi-VN') : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <Typography variant="caption" color="text.secondary">
                          Cập nhật lần cuối
                        </Typography>
                        <Typography variant="body2">
                          {selectedOrder.updated_at ? new Date(selectedOrder.updated_at).toLocaleString('vi-VN') : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <Typography variant="caption" color="text.secondary">
                          Tenant ID
                        </Typography>
                        <Typography variant="body2">
                          {selectedOrder.tenant_id || 'default'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
            {/* GHTK Actions */}
            <Tooltip title="Gửi GHTK">
              <Button onClick={sendToGhtk} startIcon={<LocalShipping />} variant="outlined">Gửi GHTK</Button>
            </Tooltip>
            <Tooltip title="In tem GHTK">
              <Button onClick={printLabelGhtk} startIcon={<Print />} variant="outlined">In tem</Button>
            </Tooltip>
            <Tooltip title="Đồng bộ trạng thái">
              <Button onClick={syncGhtk} startIcon={<Refresh />} variant="outlined">Đồng bộ</Button>
            </Tooltip>
            <Tooltip title="Hủy đơn GHTK">
              <Button onClick={cancelGhtk} startIcon={<Cancel />} color="error" variant="outlined">Hủy GHTK</Button>
            </Tooltip>
            <Button
            onClick={() => handlePrintOrder(selectedOrder)}
            startIcon={<Print />}
              variant="outlined"
            >
            In hóa đơn
            </Button>
            <Button
              onClick={() => {
              setDetailOpen(false);
              handleEditOrder(selectedOrder);
            }}
            startIcon={<Edit />}
              variant="outlined"
            >
            Chỉnh sửa
            </Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setDetailOpen(false)} variant="contained">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            Chỉnh sửa đơn hàng #{selectedOrder?.order_number}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              {/* Status */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Trạng thái đơn hàng</InputLabel>
                <Select
                    value={editFormData.status || 'pending'}
                    label="Trạng thái đơn hàng"
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  >
                    <MenuItem value="pending">Chờ xử lý</MenuItem>
                    <MenuItem value="processing">Đang xử lý</MenuItem>
                    <MenuItem value="completed">Hoàn thành</MenuItem>
                    <MenuItem value="cancelled">Đã hủy</MenuItem>
                </Select>
              </FormControl>
              </Grid>

              {/* Payment Status */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Trạng thái thanh toán</InputLabel>
                <Select
                    value={editFormData.payment_status || 'pending'}
                    label="Trạng thái thanh toán"
                    onChange={(e) => setEditFormData({ ...editFormData, payment_status: e.target.value })}
                  >
                    <MenuItem value="pending">Chưa thanh toán</MenuItem>
                    <MenuItem value="paid">Đã thanh toán</MenuItem>
                    <MenuItem value="completed">Hoàn tất</MenuItem>
                    <MenuItem value="failed">Thất bại</MenuItem>
                    <MenuItem value="refunded">Đã hoàn tiền</MenuItem>
                </Select>
              </FormControl>
          </Grid>

              {/* Payment Method */}
              <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Phương thức thanh toán</InputLabel>
              <Select
                    value={editFormData.payment_method || 'cash'}
                label="Phương thức thanh toán"
                    onChange={(e) => setEditFormData({ ...editFormData, payment_method: e.target.value })}
              >
                <MenuItem value="cash">Tiền mặt</MenuItem>
                <MenuItem value="card">Thẻ</MenuItem>
                    <MenuItem value="bank_transfer">Chuyển khoản</MenuItem>
                <MenuItem value="momo">MoMo</MenuItem>
                    <MenuItem value="zalopay">ZaloPay</MenuItem>
                    <MenuItem value="vnpay">VNPay</MenuItem>
                    <MenuItem value="qr_code">QR Code</MenuItem>
              </Select>
            </FormControl>
              </Grid>

              {/* Customer Name */}
              <Grid item xs={12} sm={6}>
            <TextField
                  fullWidth
                  label="Tên khách hàng"
                  value={editFormData.customer_name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, customer_name: e.target.value })}
                />
              </Grid>

              {/* Customer Phone */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Số điện thoại"
                  value={editFormData.customer_phone || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, customer_phone: e.target.value })}
                />
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Ghi chú"
              multiline
              rows={3}
                  value={editFormData.notes || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                />
              </Grid>

              {/* Order Info - Read Only */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Thông tin đơn hàng
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Tổng tiền:
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {formatVND(selectedOrder?.total_cents || 0)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Ngày tạo:
                    </Typography>
                    <Typography variant="body1">
                      {selectedOrder?.created_at ? new Date(selectedOrder.created_at).toLocaleString('vi-VN') : 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setEditOpen(false)} variant="outlined">
            Hủy
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={updateOrderMutation.isPending}
            startIcon={updateOrderMutation.isPending ? <CircularProgress size={20} /> : null}
          >
            {updateOrderMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderManagement;