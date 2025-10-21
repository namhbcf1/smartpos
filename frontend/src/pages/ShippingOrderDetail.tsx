import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Fab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Print as PrintIcon,
  Chat as ChatIcon,
  Note as NoteIcon,
  CheckCircle as CheckCircleIcon,
  Payment as PaymentIcon,
  LocalShipping as TruckIcon,
  Warehouse as WarehouseIcon,
  Print as PrintOrderIcon,
  Schedule as ClockIcon,
  Inventory as PackageIcon,
  Update as UpdateIcon,
  LocationOn as LocationIcon,
  Map as MapIcon,
  ArrowBack as ArrowBackIcon,
  Cancel as CancelIcon,
  Sync as SyncIcon,
  ContentCopy as CopyIcon,
  Send as SendIcon,
  Person as PersonIcon,
  RadioButtonChecked as DotIcon,
  CheckCircleOutline as CheckIcon,
  Cached as RefreshIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface OrderDetail {
  order_id: string;
  tracking_code: string;
  status: string;
  status_text: string;
  cod_amount: number;
  final_service_fee: number;
  insurance_fee?: number;
  total_value?: number;
  customer: {
    name: string;
    phone: string;
    address: string;
    avatar: string;
  };
  products: Array<{
    name: string;
    weight: number;
    quantity: number;
    product_code?: string;
    cost?: number;
    icon: string;
  }>;
  notes: string;
  tags: string[];
  order_info?: {
    created: string;
    modified: string;
    pick_date: string;
    deliver_date: string;
    storage_day: number;
    is_freeship: number;
    total_weight: number;
  };
  timeline: Array<{
    time: string;
    status: string;
    description: string;
    icon: string;
    color: string;
  }>;
  map: {
    center: {
      lat: number;
      lng: number;
    };
    location: string;
    areas: string[];
  };
  ghtk_url: string;
  can_print: boolean;
  can_chat: boolean;
  can_add_notes: boolean;
}

const ShippingOrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [editCustomerDialogOpen, setEditCustomerDialogOpen] = useState(false);
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    address: '',
    street: '',
    hamlet: '',
    ward: '',
    district: '',
    province: ''
  });

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      // Extract order ID from tracking code if needed
      const cleanOrderId = orderId?.replace(/^(ĐH\s*)/i, '').trim();

      const response = await api.get(`/shipping/ghtk/order-detail/${cleanOrderId}`);

      if (response.data.success) {
        const orderData = response.data.data;

        // Enhance data from raw_data if available
        // GHTK API may return data at top level or nested in .order
        const rawOrder = orderData.raw_data?.order || orderData.raw_data;

        if (rawOrder && typeof rawOrder === 'object') {

          // Add order info if missing
          if (!orderData.order_info && rawOrder) {
            orderData.order_info = {
              created: rawOrder.created,
              modified: rawOrder.modified,
              pick_date: rawOrder.pick_date,
              deliver_date: rawOrder.deliver_date,
              storage_day: rawOrder.storage_day || 0,
              is_freeship: rawOrder.is_freeship || 0,
              total_weight: rawOrder.weight || 0,
            };
          }

          // Update financial info from raw data
          orderData.cod_amount = rawOrder.value || orderData.cod_amount;
          orderData.final_service_fee = rawOrder.ship_money || orderData.final_service_fee;
          orderData.insurance_fee = rawOrder.insurance || orderData.insurance_fee;
          orderData.total_value = rawOrder.value || orderData.total_value;

          // Map products from raw data if UI list is empty
          if ((!orderData.products || orderData.products.length === 0) && Array.isArray(rawOrder.products)) {
            orderData.products = rawOrder.products.map((p: any) => ({
              name: p.full_name || p.name || 'Sản phẩm',
              weight: p.weight || 0,
              quantity: p.quantity || 1,
              product_code: p.product_code,
              cost: p.cost || 0,
              icon: 'circuit_board'
            }));
          }

          // Use message as notes if available
          orderData.notes = orderData.notes || rawOrder.message || '';

          // Fill customer info from raw data - create object if not exists
          if (rawOrder) {
            // Ensure customer object exists
            if (!orderData.customer) {
              orderData.customer = {
                name: '',
                phone: '',
                address: '',
                avatar: 'K'
              };
            }

            // Fill all customer data from raw order
            orderData.customer.name = rawOrder.customer_fullname || rawOrder.pick_name || orderData.customer.name || '';
            orderData.customer.phone = rawOrder.customer_tel || rawOrder.pick_tel || orderData.customer.phone || '';

            // Build full address from all available fields
            const addressParts = [];
            if (rawOrder.pick_address) addressParts.push(rawOrder.pick_address);
            if (rawOrder.pick_street) addressParts.push(rawOrder.pick_street);
            if (rawOrder.hamlet) addressParts.push(rawOrder.hamlet);
            if (rawOrder.pick_ward) addressParts.push(rawOrder.pick_ward);
            if (rawOrder.pick_district) addressParts.push(rawOrder.pick_district);
            if (rawOrder.pick_province) addressParts.push(rawOrder.pick_province);

            // Use full address or fallback to existing
            orderData.customer.address = rawOrder.address || addressParts.filter(Boolean).join(', ') || orderData.customer.address || '';

            // Set avatar from first character of name
            if (orderData.customer.name) {
              orderData.customer.avatar = orderData.customer.name.charAt(0).toUpperCase();
            }
          }
        }

        setOrderDetail(orderData);

        // Fetch tracking timeline separately if missing
        try {
          if ((!orderData.timeline || orderData.timeline.length === 0) && orderData.tracking_code) {
            const track = await api.get(`/shipping/ghtk/track/${encodeURIComponent(orderData.tracking_code)}`);
            const trackData = track.data?.data;
            if (trackData?.timeline && Array.isArray(trackData.timeline)) {
              setOrderDetail((prev) => prev ? ({
                ...prev,
                timeline: trackData.timeline.map((ev: any) => ({
                  time: ev.time || ev.modified || '',
                  status: ev.status_text || ev.status || '',
                  description: ev.note || ev.description || '',
                  icon: 'update',
                  color: 'blue'
                }))
              }) : prev);
            }
          }
        } catch {}
      } else {
        setError(response.data.error || 'Không thể tải thông tin đơn hàng');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Lỗi khi tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'đã đối soát':
        return 'success';
      case 'đã lấy hàng':
        return 'success';
      case 'đã giao':
        return 'success';
      case 'đang giao':
        return 'warning';
      case 'chờ giao':
        return 'info';
      default:
        return 'default';
    }
  };

  const getTimelineIcon = (icon: string) => {
    switch (icon) {
      case 'checkmark':
        return <CheckCircleIcon />;
      case 'payment':
        return <PaymentIcon />;
      case 'truck':
        return <TruckIcon />;
      case 'warehouse':
        return <WarehouseIcon />;
      case 'print':
        return <PrintOrderIcon />;
      case 'clock':
        return <ClockIcon />;
      case 'package':
        return <PackageIcon />;
      case 'update':
        return <UpdateIcon />;
      default:
        return <CheckCircleIcon />;
    }
  };

  const getTimelineColor = (color: string) => {
    switch (color) {
      case 'green':
        return '#4caf50';
      case 'blue':
        return '#2196f3';
      case 'orange':
        return '#ff9800';
      case 'red':
        return '#f44336';
      case 'gray':
        return '#9e9e9e';
      default:
        return '#2196f3';
    }
  };

  const handlePrint = async () => {
    if (!orderDetail?.tracking_code) return;

    try {
      // Try to get print label from GHTK API
      const response = await api.get(`/shipping/ghtk/label/${encodeURIComponent(orderDetail.tracking_code)}`, {
        responseType: 'blob'
      });

      if (response.data) {
        // Create blob URL and open in new tab for printing
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Lỗi khi in nhãn:', error);
      // Fallback: Open GHTK portal page
      if (orderDetail?.ghtk_url) {
        window.open(orderDetail.ghtk_url, '_blank');
      }
    }
  };

  const handleChat = () => {
    // Implement chat functionality
    console.log('Open chat for order:', orderDetail?.order_id);
  };

  const handleAddNote = () => {
    setNoteDialogOpen(true);
  };

  const handleSaveNote = () => {
    // Implement save note functionality
    console.log('Save note:', newNote);
    setNoteDialogOpen(false);
    setNewNote('');
  };

  const handleBack = () => {
    navigate('/shipping/orders');
  };

  const handleEditCustomer = () => {
    // Pre-fill with existing data if any
    setCustomerData({
      name: orderDetail?.customer?.name || '',
      phone: orderDetail?.customer?.phone || '',
      address: orderDetail?.customer?.address || '',
      street: (orderDetail as any)?.raw_data?.street || '',
      hamlet: (orderDetail as any)?.raw_data?.hamlet || '',
      ward: (orderDetail as any)?.raw_data?.ward || '',
      district: (orderDetail as any)?.raw_data?.district || '',
      province: (orderDetail as any)?.raw_data?.province || ''
    });
    setEditCustomerDialogOpen(true);
  };

  const handleSaveCustomer = async () => {
    if (!orderId) return;

    try {
      const response = await api.put(
        `/shipping/ghtk/order-detail/${orderId}/customer`,
        customerData
      );

      if (response.data.success) {
        alert('✅ Đã cập nhật thông tin khách hàng thành công!');
        setEditCustomerDialogOpen(false);
        // Refresh order data
        fetchOrderDetail();
      } else {
        alert(`❌ Lỗi: ${response.data.error || 'Không thể cập nhật thông tin'}`);
      }
    } catch (error: any) {
      console.error('Failed to update customer info:', error);
      alert(`❌ Lỗi: ${error.response?.data?.error || error.message || 'Không thể cập nhật thông tin'}`);
    }
  };

  // Sync with GHTK
  const handleSyncGHTK = async () => {
    if (!orderDetail?.tracking_code) return;

    try {
      setLoading(true);
      await fetchOrderDetail();
      alert('✅ Đã đồng bộ trạng thái mới nhất từ GHTK');
    } catch (error) {
      alert('❌ Lỗi khi đồng bộ với GHTK');
    } finally {
      setLoading(false);
    }
  };

  // Copy tracking code
  const handleCopyTrackingCode = () => {
    if (orderDetail?.tracking_code) {
      navigator.clipboard.writeText(orderDetail.tracking_code);
      alert('✅ Đã sao chép mã vận đơn: ' + orderDetail.tracking_code);
    }
  };

  // Cancel order
  const handleCancelOrder = async () => {
    if (!orderDetail?.tracking_code) return;

    const reason = prompt('Nhập lý do hủy đơn:');
    if (!reason) return;

    try {
      const response = await api.post(`/shipping/ghtk/cancel/${encodeURIComponent(orderDetail.tracking_code)}`, { reason });
      if (response.data.success) {
        alert('✅ Đã hủy đơn hàng thành công');
        fetchOrderDetail();
      } else {
        alert(`❌ Lỗi: ${response.data.error || 'Không thể hủy đơn'}`);
      }
    } catch (error: any) {
      alert(`❌ Lỗi: ${error.response?.data?.error || 'Không thể hủy đơn'}`);
    }
  };

  // Get progress step from status
  const getProgressStep = (status: string): number => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('đã giao') || statusLower.includes('hoàn thành')) return 4;
    if (statusLower.includes('đang giao')) return 3;
    if (statusLower.includes('đã lấy') || statusLower.includes('đang lấy')) return 2;
    if (statusLower.includes('đã tạo') || statusLower.includes('chờ')) return 1;
    return 0;
  };

  // Render Status Progress Bar
  const renderStatusProgress = () => {
    const currentStep = getProgressStep(orderDetail?.status_text || '');
    const steps = [
      { label: 'Đã tạo', icon: <CheckCircleIcon />, step: 1 },
      { label: 'Đang lấy hàng', icon: <WarehouseIcon />, step: 2 },
      { label: 'Đang giao', icon: <TruckIcon />, step: 3 },
      { label: 'Hoàn thành', icon: <CheckIcon />, step: 4 }
    ];

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>Trạng thái đơn hàng</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            {/* Progress Line */}
            <Box
              sx={{
                position: 'absolute',
                top: '20px',
                left: '10%',
                right: '10%',
                height: '4px',
                bgcolor: 'grey.300',
                zIndex: 0
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  bgcolor: 'success.main',
                  width: `${((currentStep - 1) / 3) * 100}%`,
                  transition: 'width 0.3s'
                }}
              />
            </Box>

            {/* Steps */}
            {steps.map((step) => (
              <Box
                key={step.step}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  zIndex: 1,
                  flex: 1
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: currentStep >= step.step ? 'success.main' : 'grey.300',
                    color: 'white',
                    mb: 1,
                    transition: 'all 0.3s'
                  }}
                >
                  {step.icon}
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: currentStep === step.step ? 'bold' : 'normal',
                    color: currentStep >= step.step ? 'success.main' : 'text.secondary',
                    textAlign: 'center'
                  }}
                >
                  {step.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Đang tải thông tin đơn hàng...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3} sx={{ maxWidth: 800, mx: 'auto' }}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CancelIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
                ⚠️ Không tìm thấy đơn hàng
              </Typography>
              <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                <strong>Lỗi:</strong> {error}
              </Alert>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Đơn hàng này có thể:
              </Typography>
              <Box sx={{ textAlign: 'left', mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • Chưa được tạo trên hệ thống GHTK
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • Đã bị xóa hoặc hủy
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • Mã đơn hàng không chính xác
                </Typography>
                <Typography variant="body2">
                  • Chưa đồng bộ từ GHTK về hệ thống
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={handleBack}
                  startIcon={<ArrowBackIcon />}
                  size="large"
                >
                  Quay lại danh sách
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/shipping/create')}
                  startIcon={<PackageIcon />}
                  size="large"
                >
                  Tạo đơn mới
                </Button>
                <Button
                  variant="outlined"
                  onClick={fetchOrderDetail}
                  startIcon={<RefreshIcon />}
                  size="large"
                >
                  Thử lại
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (!orderDetail) {
    return (
      <Box p={3} sx={{ maxWidth: 800, mx: 'auto' }}>
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Alert severity="warning" sx={{ mb: 3 }}>
                Không tìm thấy thông tin đơn hàng
              </Alert>
              <Button variant="contained" onClick={handleBack} startIcon={<ArrowBackIcon />}>
                Quay lại danh sách
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Chi tiết đơn hàng
        </Typography>
      </Box>

      {/* Order Header Card */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)', color: 'white' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                {orderDetail.tracking_code}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Đơn hàng: {orderDetail.order_id}
              </Typography>
              {(orderDetail as any).raw_data?.order?.partner_id && (
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                  Partner ID: {(orderDetail as any).raw_data.order.partner_id}
                </Typography>
              )}
              {(orderDetail as any).raw_data?.order?.label_id && orderDetail.tracking_code !== (orderDetail as any).raw_data.order.label_id && (
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                  Label ID: {(orderDetail as any).raw_data.order.label_id}
                </Typography>
              )}
              {(orderDetail as any).raw_data?.order?.status && (
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                  Status Code: {(orderDetail as any).raw_data.order.status}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip
                label={orderDetail.status_text}
                color={getStatusColor(orderDetail.status_text) as any}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
              <IconButton
                onClick={handleCopyTrackingCode}
                sx={{ color: 'white' }}
                size="small"
                title="Sao chép mã vận đơn"
              >
                <CopyIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Quick Actions */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={handleSyncGHTK}
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Đồng bộ GHTK
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              In vận đơn
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CancelIcon />}
              onClick={handleCancelOrder}
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Hủy đơn
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Status Progress Bar */}
      {renderStatusProgress()}

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Order Summary */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <PackageIcon sx={{ mr: 1 }} />
                Thông tin đơn hàng
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                {orderDetail.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    color="primary"
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>

              {/* Important GHTK Message/Instructions */}
              {(() => {
                const rawData = (orderDetail as any).raw_data?.order || (orderDetail as any).raw_data;
                const ghtkMessage = rawData?.message;
                if (ghtkMessage && ghtkMessage.trim()) {
                  return (
                    <Alert severity="info" icon={<NoteIcon />} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>
                        📋 Ghi chú giao hàng từ GHTK:
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {ghtkMessage}
                      </Typography>
                    </Alert>
                  );
                }
                return null;
              })()}

              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  💰 Thông tin tài chính
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Giá trị hàng hóa:
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {Number(orderDetail.total_value || 0).toLocaleString()} ₫
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Tiền thu hộ (COD):
                      </Typography>
                      <Typography variant="body1" fontWeight={600} color="success.main">
                        {orderDetail.cod_amount.toLocaleString()} ₫
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Phí vận chuyển:
                      </Typography>
                      <Typography variant="body1" fontWeight={600} color="error.main">
                        {orderDetail.final_service_fee.toLocaleString()} ₫
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Phí bảo hiểm:
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {orderDetail.insurance_fee?.toLocaleString() || '0'} ₫
                      </Typography>
                    </Box>
                    {(() => {
                      const rawData = (orderDetail as any).raw_data?.order || (orderDetail as any).raw_data;
                      const pickMoney = rawData?.pick_money;
                      if (pickMoney !== undefined && pickMoney !== null && pickMoney !== orderDetail.cod_amount) {
                        return (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Tiền phải thu (pick_money):
                            </Typography>
                            <Typography variant="body1" fontWeight={600} color="warning.main">
                              {pickMoney.toLocaleString()} ₫
                            </Typography>
                          </Box>
                        );
                      }
                      return null;
                    })()}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Giảm giá / Khuyến mãi:
                      </Typography>
                      <Typography variant="body1" fontWeight={600} color="success.main">
                        0 ₫
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Tổng thu từ khách:
                      </Typography>
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        {orderDetail.cod_amount.toLocaleString()} ₫
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Tổng chi phí vận chuyển:
                      </Typography>
                      <Typography variant="h6" color="error" fontWeight="bold">
                        {(orderDetail.final_service_fee + (orderDetail.insurance_fee || 0)).toLocaleString()} ₫
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Ghi chú
              </Typography>
              <Typography variant="body1">
                {orderDetail.notes}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" sx={{ mb: 2 }}>
                Danh sách sản phẩm
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell><strong>Tên sản phẩm</strong></TableCell>
                      <TableCell align="center"><strong>Mã SP</strong></TableCell>
                      <TableCell align="center"><strong>SL</strong></TableCell>
                      <TableCell align="center"><strong>Khối lượng</strong></TableCell>
                      <TableCell align="right"><strong>Đơn giá</strong></TableCell>
                      <TableCell align="right"><strong>Thành tiền</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orderDetail.products.map((product, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PackageIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                            {product.name}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          {product.product_code || '—'}
                        </TableCell>
                        <TableCell align="center">
                          {product.quantity}
                        </TableCell>
                        <TableCell align="center">
                          {product.weight}g
                        </TableCell>
                        <TableCell align="right">
                          {product.cost ? `${product.cost.toLocaleString()} ₫` : '—'}
                        </TableCell>
                        <TableCell align="right">
                          <strong>
                            {product.cost ? `${(product.cost * product.quantity).toLocaleString()} ₫` : '—'}
                          </strong>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={5} align="right">
                        <strong>Tổng giá trị hàng:</strong>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="h6" color="primary">
                          {orderDetail.total_value
                            ? `${Number(orderDetail.total_value).toLocaleString()} ₫`
                            : orderDetail.products.reduce((sum, p) => sum + (p.cost || 0) * p.quantity, 0).toLocaleString() + ' ₫'
                          }
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              
              {orderDetail.order_info && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    📝 Thông tin bổ sung & Logs
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Tổng khối lượng:
                      </Typography>
                      <Typography variant="body2">
                        {orderDetail.order_info.total_weight ? (orderDetail.order_info.total_weight / 1000).toFixed(1) + ' kg' : '—'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Ngày tạo đơn:
                      </Typography>
                      <Typography variant="body2">
                        {orderDetail.order_info.created ? new Date(orderDetail.order_info.created).toLocaleString('vi-VN') : '—'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Ngày lấy hàng:
                      </Typography>
                      <Typography variant="body2">
                        {orderDetail.order_info.pick_date ? new Date(orderDetail.order_info.pick_date).toLocaleDateString('vi-VN') : '—'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Ngày giao hàng:
                      </Typography>
                      <Typography variant="body2">
                        {orderDetail.order_info.deliver_date ? new Date(orderDetail.order_info.deliver_date).toLocaleDateString('vi-VN') : '—'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Ngày sửa gần nhất:
                      </Typography>
                      <Typography variant="body2">
                        {orderDetail.order_info.modified ? new Date(orderDetail.order_info.modified).toLocaleString('vi-VN') : '—'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Ngày lưu kho:
                      </Typography>
                      <Typography variant="body2">
                        {orderDetail.order_info.storage_day || 0} ngày
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Miễn phí ship:
                      </Typography>
                      <Chip
                        label={orderDetail.order_info.is_freeship ? 'Có' : 'Không'}
                        color={orderDetail.order_info.is_freeship ? 'success' : 'default'}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Người tạo:
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PersonIcon fontSize="small" />
                        <Typography variant="body2">
                          {(orderDetail as any).created_by || 'Hệ thống'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ mr: 1, bgcolor: 'primary.main' }}>
                  {orderDetail.customer.avatar}
                </Avatar>
                Thông tin khách hàng
              </Typography>

              <>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {orderDetail.customer.name || '—'}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  {orderDetail.customer.phone || '—'}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {orderDetail.customer.address || '—'}
                </Typography>

                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleEditCustomer}
                  sx={{ mb: 2 }}
                >
                  Cập nhật thông tin khách hàng
                </Button>
              </>

              {orderDetail.ghtk_url && (
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={() => window.open(orderDetail.ghtk_url, '_blank')}
                >
                  Xem đầy đủ trên GHTK Portal
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Address Details */}
          {(() => {
            const rawData = (orderDetail as any).raw_data?.order || (orderDetail as any).raw_data;
            if (!rawData || typeof rawData !== 'object') return null;

            return (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <LocationIcon sx={{ mr: 1 }} />
                    Địa chỉ chi tiết
                  </Typography>

                  {/* Địa chỉ lấy hàng */}
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'blue.50', borderRadius: 1, border: '1px solid rgba(33, 150, 243, 0.2)' }}>
                    <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                      <WarehouseIcon sx={{ mr: 1, fontSize: 20 }} />
                      Địa chỉ lấy hàng
                    </Typography>
                    <Grid container spacing={1}>
                      {rawData.pick_name && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">Người gửi:</Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {rawData.pick_name}
                          </Typography>
                        </Grid>
                      )}
                      {rawData.pick_tel && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">SĐT:</Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {rawData.pick_tel}
                          </Typography>
                        </Grid>
                      )}
                      {rawData.pick_address && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">Địa chỉ:</Typography>
                          <Typography variant="body1">
                            {[
                              rawData.pick_address,
                              rawData.pick_street,
                              rawData.pick_ward,
                              rawData.pick_district,
                              rawData.pick_province
                            ].filter(Boolean).join(', ')}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>

                  {/* Địa chỉ giao hàng */}
                  <Box sx={{ p: 2, bgcolor: 'success.50', borderRadius: 1, border: '1px solid rgba(76, 175, 80, 0.2)' }}>
                    <Typography variant="subtitle1" fontWeight="bold" color="success.main" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                      <TruckIcon sx={{ mr: 1, fontSize: 20 }} />
                      Địa chỉ giao hàng
                    </Typography>
                    <Grid container spacing={1}>
                      {rawData.customer_fullname && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">Người nhận:</Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {rawData.customer_fullname}
                          </Typography>
                        </Grid>
                      )}
                      {rawData.customer_tel && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">SĐT:</Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {rawData.customer_tel}
                          </Typography>
                        </Grid>
                      )}
                      {rawData.address && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">Địa chỉ đầy đủ:</Typography>
                          <Typography variant="body1">
                            {rawData.address}
                          </Typography>
                        </Grid>
                      )}
                      {(rawData.hamlet || rawData.province || rawData.district) && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">Khu vực:</Typography>
                          <Typography variant="body1">
                            {[
                              rawData.hamlet,
                              rawData.ward,
                              rawData.district,
                              rawData.province
                            ].filter(Boolean).join(', ')}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            );
          })()}

          {/* Map */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <MapIcon sx={{ mr: 1 }} />
                Vị trí giao hàng
              </Typography>

              {(() => {
                const rawData = (orderDetail as any).raw_data?.order || (orderDetail as any).raw_data;
                const fullAddress = rawData?.address || orderDetail.customer.address || orderDetail.map.location;

                return (
                  <>
                    <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <LocationIcon sx={{ color: 'primary.main', mt: 0.5 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" fontWeight={600} sx={{ mb: 1 }}>
                            {fullAddress || 'Chưa xác định'}
                          </Typography>
                          {orderDetail.map.areas && orderDetail.map.areas.length > 0 && (
                            <Typography variant="body2" color="text.secondary">
                              Khu vực: {orderDetail.map.areas.slice(0, 3).join(', ')}
                              {orderDetail.map.areas.length > 3 && '...'}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Paper>

                    {fullAddress && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          fullWidth
                          startIcon={<MapIcon />}
                          onClick={() => {
                            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
                            window.open(mapsUrl, '_blank');
                          }}
                        >
                          Mở bản đồ
                        </Button>
                        <Button
                          variant="outlined"
                          fullWidth
                          startIcon={<CopyIcon />}
                          onClick={() => {
                            navigator.clipboard.writeText(fullAddress);
                            alert('✅ Đã sao chép địa chỉ');
                          }}
                        >
                          Sao chép địa chỉ
                        </Button>
                      </Box>
                    )}

                    {orderDetail.map.center.lat && orderDetail.map.center.lng && (
                      <Box sx={{ mt: 2, height: 300, borderRadius: 1, overflow: 'hidden' }}>
                        <iframe
                          title="Google Maps"
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          style={{ border: 0 }}
                          src={`https://www.google.com/maps?q=${orderDetail.map.center.lat},${orderDetail.map.center.lng}&z=15&output=embed`}
                          allowFullScreen
                        />
                      </Box>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Timeline */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <ClockIcon sx={{ mr: 1 }} />
                Lịch sử vận chuyển
              </Typography>
              
              <List>
                {orderDetail.timeline.map((event, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: getTimelineColor(event.color),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white'
                        }}
                      >
                        {getTimelineIcon(event.icon)}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {event.time}
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {event.status}
                          </Typography>
                        </Box>
                      }
                      secondary={event.description}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Raw JSON (admin view) */}
      {orderDetail && (orderDetail as any).raw_data && (
        <Box sx={{ mt: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Dữ liệu gốc từ GHTK</Typography>
              <Paper sx={{ p: 2, maxHeight: 320, overflow: 'auto', bgcolor: '#0b1020', color: '#e2e8f0', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontSize: 12 }}>
                <pre style={{ margin: 0 }}>{JSON.stringify((orderDetail as any).raw_data, null, 2)}</pre>
              </Paper>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Action Buttons */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', gap: 2 }}>
        {orderDetail.can_add_notes && (
          <Fab color="primary" onClick={handleAddNote}>
            <NoteIcon />
          </Fab>
        )}
        {orderDetail.can_chat && (
          <Fab color="secondary" onClick={handleChat}>
            <ChatIcon />
          </Fab>
        )}
        {orderDetail.can_print && (
          <Fab color="default" onClick={handlePrint}>
            <PrintIcon />
          </Fab>
        )}
      </Box>

      {/* Note Dialog */}
      <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm ghi chú</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Ghi chú"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleSaveNote} variant="contained">Lưu</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={editCustomerDialogOpen} onClose={() => setEditCustomerDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Cập nhật thông tin khách hàng</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Tên khách hàng"
                  fullWidth
                  value={customerData.name}
                  onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Số điện thoại"
                  fullWidth
                  value={customerData.phone}
                  onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Địa chỉ đầy đủ"
                  fullWidth
                  value={customerData.address}
                  onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                  variant="outlined"
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Số nhà / Đường"
                  fullWidth
                  value={customerData.street}
                  onChange={(e) => setCustomerData({ ...customerData, street: e.target.value })}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Thôn / Xóm / Tổ"
                  fullWidth
                  value={customerData.hamlet}
                  onChange={(e) => setCustomerData({ ...customerData, hamlet: e.target.value })}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Phường / Xã"
                  fullWidth
                  value={customerData.ward}
                  onChange={(e) => setCustomerData({ ...customerData, ward: e.target.value })}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Quận / Huyện"
                  fullWidth
                  value={customerData.district}
                  onChange={(e) => setCustomerData({ ...customerData, district: e.target.value })}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Tỉnh / Thành phố"
                  fullWidth
                  value={customerData.province}
                  onChange={(e) => setCustomerData({ ...customerData, province: e.target.value })}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditCustomerDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleSaveCustomer} variant="contained" color="primary">
            Lưu thông tin
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShippingOrderDetail;
