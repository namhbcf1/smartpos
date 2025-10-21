import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  InputAdornment,
  Grid,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar
} from '@mui/material';
import Switch from '@mui/material/Switch';
import MuiAlert from '@mui/material/Alert';
import {
  LocalShipping,
  Refresh,
  Search,
  Print,
  Download,
  CheckCircle,
  Schedule,
  Error as ErrorIcon,
  Add,
  MoreVert,
  Visibility,
  Cancel,
  CalendarToday,
  FilterList,
  PendingActions,
  LocalShippingOutlined,
  AssignmentTurnedIn,
  Block,
  OpenInNew,
  CloudSync
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface ShippingOrder {
  id: string;
  order_id?: string;
  carrier: string;
  carrier_order_code: string;
  status: string;
  fee_amount?: number;
  service?: string;
  created_at: string;
  updated_at: string;
  payload?: any;
  response?: any;
  // GHTK specific fields
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  cod_amount?: number;
  products?: Array<{
    name: string;
    weight: number;
    quantity: number;
  }>;
  ghtk_url?: string;
  can_sync?: boolean;
  can_print_label?: boolean;
  can_cancel?: boolean;
}

const ShippingOrders: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [selectedOrder, setSelectedOrder] = useState<ShippingOrder | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [labelPageSize, setLabelPageSize] = useState<'A5' | 'A6'>('A6');
  const [labelOrientation, setLabelOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'success' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [orderCodes, setOrderCodes] = useState('');
  const [syncResult, setSyncResult] = useState<{ synced: number; total: number; errors: string[] } | null>(null);
  const [onlyRealOrders, setOnlyRealOrders] = useState(true);

  useEffect(() => {
    // Read filters from URL on mount
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const status = params.get('status');
    const from = params.get('from');
    const to = params.get('to');
    const svc = params.get('service');
    if (q) setSearchTerm(q);
    if (status) {
      const idx = ['all','pending','in_transit','delivered','cancelled'].indexOf(status);
      if (idx >= 0) setTabValue(idx);
    }
    if (from) setDateFrom(from);
    if (to) setDateTo(to);
    if (svc) setServiceFilter(svc);

    // Tự động đồng bộ từ GHTK khi vào trang
    const autoSync = async () => {
      try {
        await syncRealDataMutation.mutateAsync();
        console.log('✅ Auto-sync from GHTK completed');
      } catch (error) {
        console.warn('⚠️ Auto-sync failed:', error);
      }
    };
    autoSync();
  }, []);

  useEffect(() => {
    // Push filters to URL when changed
    const params = new URLSearchParams(window.location.search);
    if (searchTerm) params.set('q', searchTerm); else params.delete('q');
    params.set('status', ['all','pending','in_transit','delivered','cancelled'][tabValue]);
    if (dateFrom) params.set('from', dateFrom); else params.delete('from');
    if (dateTo) params.set('to', dateTo); else params.delete('to');
    if (serviceFilter && serviceFilter !== 'all') params.set('service', serviceFilter); else params.delete('service');
    const next = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', next);
  }, [searchTerm, tabValue, dateFrom, dateTo, serviceFilter]);

  const { data, refetch, isLoading, error } = useQuery({
    queryKey: ['shipping-orders', page, rowsPerPage, onlyRealOrders],
    queryFn: async () => {
      // Lấy đồng thời dữ liệu thật từ GHTK và dữ liệu local, sau đó hợp nhất
      const [ghtkResp, localResp] = await Promise.all([
        api.get('/shipping/ghtk/real-orders').catch((e) => e),
        api.get(`/shipping/orders?page=${page + 1}&limit=${rowsPerPage}`).catch((e) => e),
      ]);

      const ghtkOk = (ghtkResp as any)?.data?.success && Array.isArray((ghtkResp as any)?.data?.data);
      const localOk = (localResp as any)?.data?.success && Array.isArray((localResp as any)?.data?.data);

      const ghtkList: any[] = ghtkOk ? (ghtkResp as any).data.data : [];
      const localList: any[] = localOk ? (localResp as any).data.data : [];

      // Hợp nhất và loại trùng theo carrier_order_code -> order_id -> id
      const map = new Map<string, any>();
      const put = (o: any, preferExisting = false) => {
        const key = o?.carrier_order_code || o?.order_id || o?.id;
        if (!key) return;
        if (!map.has(key)) {
          map.set(key, o);
        } else if (!preferExisting) {
          // Ưu tiên dữ liệu GHTK (đầy đủ, realtime)
          map.set(key, { ...map.get(key), ...o });
        }
      };

      // Nếu chỉ hiển thị đơn thực tế từ GHTK, bỏ qua các đơn chỉ có ở local
      if (ghtkOk && onlyRealOrders) {
        ghtkList.forEach((o) => put(o));
      } else {
        // Ưu tiên GHTK trước, sau đó bổ sung local
        const realSet = new Set(ghtkList.map((o: any) => o?.carrier_order_code || o?.order_id || o?.id));
        ghtkList.forEach((o) => put(o));
        // Nếu có realSet, chỉ thêm local nếu cũng tồn tại trong realSet (lọc bỏ đơn ảo)
        localList.forEach((o) => {
          const key = o?.carrier_order_code || o?.order_id || o?.id;
          if (!ghtkOk) return put(o, true);
          if (realSet.has(key)) put(o, true);
        });
      }

      let merged = Array.from(map.values());
      // Sắp xếp theo created_at/updated_at giảm dần
      merged.sort((a: any, b: any) => {
        const ta = new Date(a?.created_at || a?.updated_at || 0).getTime();
        const tb = new Date(b?.created_at || b?.updated_at || 0).getTime();
        return tb - ta;
      });

      return {
        success: true,
        data: merged,
        pagination: (localResp as any)?.data?.pagination || { page: page + 1, limit: rowsPerPage, total: merged.length, totalPages: 1 },
        ghtk_integration: {
          real_data: ghtkOk,
          orders_url: 'https://khachhang.giaohangtietkiem.vn/web/van-hanh/don-hang',
        },
      };
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
  });

  // Sync order status mutation
  const syncOrderMutation = useMutation({
    mutationFn: async (order: ShippingOrder) => {
      const response = await api.post(`/shipping/sync/${order.carrier}/${order.carrier_order_code}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-orders'] });
    },
  });

  // Print label mutation (GHTK)
  const printLabelMutation = useMutation({
    mutationFn: async (order: ShippingOrder) => {
      const response = await api.get(`/shipping/ghtk/label/${encodeURIComponent(order.carrier_order_code)}`);
      return response.data;
    },
    onError: () => setSnackbar({ open: true, message: 'Không thể in nhãn. Vui lòng thử lại.', severity: 'error' })
  });

  // Cancel order mutation (GHTK)
  const cancelOrderMutation = useMutation({
    mutationFn: async ({ order, reason }: { order: ShippingOrder; reason?: string }) => {
      const body = { reason: reason && reason.trim() ? reason.trim() : 'Shop yêu cầu hủy đơn' };
      const response = await api.post(`/shipping/ghtk/cancel/${encodeURIComponent(order.carrier_order_code)}`, body);
      return response.data;
    },
    onSuccess: (res: any) => {
      const msg = res?.message || 'Đã gửi yêu cầu hủy đơn';
      queryClient.invalidateQueries({ queryKey: ['shipping-orders'] });
      setCancelDialogOpen(false);
      setSelectedOrder(null);
      setCancelReason('');
      setSnackbar({ open: true, message: msg, severity: 'success' });
    },
    onError: (err: any) => {
      const apiMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Hủy đơn thất bại.';
      setSnackbar({ open: true, message: apiMsg, severity: 'error' });
    }
  });

  // Sync real data from GHTK mutation
  const syncRealDataMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/shipping/ghtk/sync-real');
      return response.data;
    },
    onSuccess: (result) => {
      console.log('✅ Real data sync completed:', result);
      queryClient.invalidateQueries({ queryKey: ['shipping-orders'] });
    },
  });

  // Verify & purge local orders not in GHTK
  const verifyPurgeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/shipping/ghtk/verify-purge');
      return response.data;
    },
    onSuccess: (res) => {
      setSnackbar({ open: true, message: `Đã kiểm tra ${res.checked}, xoá ${res.purged} đơn không tồn tại`, severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['shipping-orders'] });
    },
    onError: () => setSnackbar({ open: true, message: 'Kiểm tra/xoá thất bại. Vui lòng thử lại.', severity: 'error' })
  });

  // Create sample order mutation
  const createSampleMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/shipping/ghtk/create-sample');
      return response.data;
    },
    onSuccess: (result) => {
      console.log('✅ Sample order created:', result);
      queryClient.invalidateQueries({ queryKey: ['shipping-orders'] });
    },
  });

  // Sync orders by codes mutation
  const syncByCodesMutation = useMutation({
    mutationFn: async (codes: string[]) => {
      const response = await api.post('/shipping/ghtk/sync-by-codes', { order_codes: codes });
      return response.data;
    },
    onSuccess: (result) => {
      console.log('✅ Orders synced by codes:', result);
      setSyncResult({
        synced: result.synced || 0,
        total: result.total || 0,
        errors: result.errors || []
      });
      queryClient.invalidateQueries({ queryKey: ['shipping-orders'] });
      setSnackbar({
        open: true,
        message: `Đã đồng bộ ${result.synced}/${result.total} đơn hàng từ GHTK`,
        severity: result.synced > 0 ? 'success' : 'error'
      });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Đồng bộ thất bại. Vui lòng thử lại.', severity: 'error' });
    }
  });

  const orders = (data?.data || []) as ShippingOrder[];
  const totalCount = data?.pagination?.total || orders.length;

  // Tab filters
  const statusTabs = [
    { label: 'Tất cả', value: 'all', icon: <LocalShipping /> },
    { label: 'Chờ lấy hàng', value: 'pending', icon: <PendingActions /> },
    { label: 'Đang giao', value: 'in_transit', icon: <LocalShippingOutlined /> },
    { label: 'Đã giao', value: 'delivered', icon: <AssignmentTurnedIn /> },
    { label: 'Đã hủy', value: 'cancelled', icon: <Block /> },
  ];

  const currentTabStatus = statusTabs[tabValue].value;

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.carrier_order_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer_phone || order.payload?.order?.tel || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer_name || order.payload?.order?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer_address || order.payload?.order?.address || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab = currentTabStatus === 'all' ||
      (currentTabStatus === 'in_transit' && ['in_transit', 'shipped', 'picking', 'đang giao', 'đang lấy hàng'].includes(order.status?.toLowerCase() || '')) ||
      (currentTabStatus === 'pending' && ['pending', 'chờ lấy hàng', 'chờ giao'].includes(order.status?.toLowerCase() || '')) ||
      (currentTabStatus === 'delivered' && ['delivered', 'completed', 'đã giao', 'đã đối soát'].includes(order.status?.toLowerCase() || '')) ||
      (currentTabStatus === 'cancelled' && ['cancelled', 'failed', 'đã hủy'].includes(order.status?.toLowerCase() || '')) ||
      order.status?.toLowerCase() === currentTabStatus;

    const matchesService = serviceFilter === 'all' || order.service === serviceFilter;

    // Date filter
    let matchesDate = true;
    if (dateFrom) {
      const orderDate = new Date(order.created_at);
      const fromDate = new Date(dateFrom);
      matchesDate = matchesDate && orderDate >= fromDate;
    }
    if (dateTo) {
      const orderDate = new Date(order.created_at);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && orderDate <= toDate;
    }

    return matchesSearch && matchesTab && matchesService && matchesDate;
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return 'success';
      case 'in_transit':
      case 'shipped':
      case 'picking':
        return 'info';
      case 'pending':
      case 'processing':
        return 'warning';
      case 'cancelled':
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'Chờ lấy hàng',
      'picking': 'Đang lấy hàng',
      'in_transit': 'Đang giao',
      'shipped': 'Đang giao',
      'delivered': 'Đã giao',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy',
      'failed': 'Thất bại',
    };
    return statusMap[status?.toLowerCase()] || status;
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSync = (order: ShippingOrder) => {
    syncOrderMutation.mutate(order);
  };

  const toggleRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllPage = (checked: boolean, pageSlice: ShippingOrder[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      pageSlice.forEach(o => { if (checked) next.add(o.id); else next.delete(o.id); });
      return next;
    });
  };

  const bulkPrint = () => {
    const base = (import.meta as any).env?.VITE_API_BASE_URL || '';
    const pageSlice = filteredOrders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    pageSlice.filter(o => selectedIds.has(o.id)).forEach(o => {
      const url = `${base}/api/shipping/ghtk/label/${encodeURIComponent(o.carrier_order_code)}?original=${labelOrientation}&page_size=${labelPageSize}`;
      window.open(url, '_blank');
    });
  };

  const bulkCancel = () => {
    const targets = filteredOrders.filter(o => selectedIds.has(o.id));
    if (targets.length === 0) return;
    if (!confirm(`Hủy ${targets.length} đơn hàng đã chọn?`)) return;
    targets.forEach(o => cancelOrderMutation.mutate({ order: o, reason: cancelReason || undefined }));
    setSelectedIds(new Set());
  };

  const handlePrintLabel = async (order: ShippingOrder) => {
    try {
      // Open backend proxy that streams PDF directly (per GHTK docs)
      const base = (import.meta as any).env?.VITE_API_BASE_URL || '';
      const url = `${base}/api/shipping/ghtk/label/${encodeURIComponent(order.carrier_order_code)}?original=${labelOrientation}&page_size=${labelPageSize}`;
      window.open(url, '_blank');
    } catch (e) {
      // Fallback to existing JSON call if needed
      const res = await printLabelMutation.mutateAsync(order).catch(() => null);
      setSnackbar({ open: true, message: res?.error || 'Không thể in nhãn. Vui lòng thử lại.', severity: 'error' });
    }
  };

  const handleCancelOrder = (order: ShippingOrder) => {
    setSelectedOrder(order);
    setCancelDialogOpen(true);
  };

  const confirmCancelOrder = () => {
    if (selectedOrder) {
      cancelOrderMutation.mutate({ order: selectedOrder, reason: cancelReason });
    }
  };

  const handleExportExcel = () => {
    const csv = [
      ['Mã đơn hàng', 'Mã vận đơn', 'Nhà vận chuyển', 'Trạng thái', 'Người nhận', 'SĐT', 'Phí vận chuyển', 'Ngày tạo'],
      ...filteredOrders.map(order => [
        order.order_id || '',
        order.carrier_order_code || '',
        order.carrier?.toUpperCase() || '',
        getStatusLabel(order.status) || '',
        order.payload?.order?.name || '',
        order.payload?.order?.tel || '',
        order.fee_amount || '',
        formatDate(order.created_at),
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `don-hang-van-chuyen-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleSyncByCodesOpen = () => {
    setSyncDialogOpen(true);
    setOrderCodes('');
    setSyncResult(null);
  };

  const handleSyncByCodesSubmit = () => {
    // Parse order codes from textarea (support comma-separated or line-separated)
    const codes = orderCodes
      .split(/[\n,]+/)
      .map(code => code.trim())
      .filter(code => code.length > 0);

    if (codes.length === 0) {
      setSnackbar({ open: true, message: 'Vui lòng nhập mã đơn hàng', severity: 'error' });
      return;
    }

    syncByCodesMutation.mutate(codes);
  };

  // Calculate counts for each tab
  const tabCounts = {
    all: orders.length,
    pending: orders.filter(o => ['pending', 'chờ lấy hàng', 'chờ giao'].includes(o.status?.toLowerCase() || '')).length,
    in_transit: orders.filter(o => ['in_transit', 'shipped', 'picking', 'đang giao', 'đang lấy hàng'].includes(o.status?.toLowerCase() || '')).length,
    delivered: orders.filter(o => ['delivered', 'completed', 'đã giao', 'đã đối soát'].includes(o.status?.toLowerCase() || '')).length,
    cancelled: orders.filter(o => ['cancelled', 'failed', 'đã hủy'].includes(o.status?.toLowerCase() || '')).length,
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header - GHTK Style */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
              Quản lý đơn hàng
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Theo dõi và quản lý tất cả đơn hàng vận chuyển GHTK
              </Typography>
              {data?.ghtk_integration?.real_data && (
                <Chip
                  label="Dữ liệu thật từ GHTK"
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              )}
            </Stack>
            {data?.ghtk_integration?.orders_url && (
              <Button
                variant="text"
                size="small"
                sx={{ mt: 0.5, p: 0, textTransform: 'none', fontSize: '0.75rem' }}
                onClick={() => window.open(data.ghtk_integration.orders_url, '_blank')}
              >
                Xem trên GHTK Portal →
              </Button>
            )}
          </Box>
          <Stack direction="row" spacing={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Khổ giấy</InputLabel>
              <Select label="Khổ giấy" value={labelPageSize} onChange={(e) => setLabelPageSize(e.target.value as any)}>
                <MenuItem value="A6">A6</MenuItem>
                <MenuItem value="A5">A5</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Hướng in</InputLabel>
              <Select label="Hướng in" value={labelOrientation} onChange={(e) => setLabelOrientation(e.target.value as any)}>
                <MenuItem value="portrait">Dọc (portrait)</MenuItem>
                <MenuItem value="landscape">Ngang (landscape)</MenuItem>
              </Select>
            </FormControl>
            <Stack direction="row" alignItems="center" sx={{ px: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>Chỉ đơn thực tế</Typography>
              <Switch checked={onlyRealOrders} onChange={(e) => setOnlyRealOrders(e.target.checked)} />
            </Stack>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => refetch()}
              size="medium"
            >
              Làm mới
            </Button>
            <Button
              variant="outlined"
              startIcon={<Block />}
              onClick={() => verifyPurgeMutation.mutate()}
              disabled={verifyPurgeMutation.isPending}
              color="warning"
              size="medium"
              sx={{
                borderColor: '#ff9800',
                color: '#ff9800',
                '&:hover': { borderColor: '#fb8c00', bgcolor: '#fff3e0' }
              }}
            >
              {verifyPurgeMutation.isPending ? 'Đang kiểm tra...' : 'Xoá đơn không tồn tại'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => syncRealDataMutation.mutate()}
              disabled={syncRealDataMutation.isPending}
              color="success"
              size="medium"
              sx={{
                borderColor: '#4caf50',
                color: '#4caf50',
                '&:hover': {
                  borderColor: '#45a049',
                  bgcolor: '#f1f8e9'
                }
              }}
            >
              {syncRealDataMutation.isPending ? 'Đang sync...' : 'Sync từ GHTK'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<CloudSync />}
              onClick={handleSyncByCodesOpen}
              color="primary"
              size="medium"
              sx={{
                borderColor: '#1976d2',
                color: '#1976d2',
                '&:hover': {
                  borderColor: '#1565c0',
                  bgcolor: '#e3f2fd'
                }
              }}
            >
              Đồng bộ từ mã đơn
            </Button>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => createSampleMutation.mutate()}
              disabled={createSampleMutation.isPending}
              color="info"
              size="medium"
              sx={{
                borderColor: '#2196f3',
                color: '#2196f3',
                '&:hover': {
                  borderColor: '#1976d2',
                  bgcolor: '#e3f2fd'
                }
              }}
            >
              {createSampleMutation.isPending ? 'Đang tạo...' : 'Tạo đơn mẫu'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExportExcel}
              size="medium"
            >
              Xuất Excel
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/shipping/ghtk/create')}
              size="medium"
            >
              Tạo đơn mới
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Main Card - GHTK Style */}
      <Card elevation={1}>
        {/* Tabs - GHTK Style */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#fafafa' }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => {
              setTabValue(newValue);
              setPage(0);
            }}
            sx={{
              px: 2,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.9rem',
                minHeight: 60,
              }
            }}
          >
            {statusTabs.map((tab, index) => (
              <Tab
                key={tab.value}
                icon={tab.icon}
                iconPosition="start"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {tab.label}
                    <Badge
                      badgeContent={tabCounts[tab.value as keyof typeof tabCounts]}
                      color={index === 0 ? 'default' : index === 1 ? 'warning' : index === 2 ? 'info' : index === 3 ? 'success' : 'error'}
                      sx={{ ml: 1 }}
                    />
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {/* Search & Filters - GHTK Style */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Tìm theo mã đơn, SĐT, người nhận..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Từ ngày"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Đến ngày"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Dịch vụ</InputLabel>
                <Select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  label="Dịch vụ"
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="road">Đường bộ</MenuItem>
                  <MenuItem value="fly">Đường bay</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                sx={{ height: '40px' }}
              >
                Bộ lọc
              </Button>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2 }} />

          {/* Loading State */}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Error State */}
          {error && (
            <Alert severity="error" icon={<ErrorIcon />}>
              Không thể tải danh sách đơn hàng. Vui lòng thử lại.
            </Alert>
          )}

          {/* Table - GHTK Style */}
          {!isLoading && !error && (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#fafafa' }}>
                      <TableCell padding="checkbox">
                        <input
                          type="checkbox"
                          aria-label="select-all-page"
                          onChange={(e) => toggleAllPage(e.currentTarget.checked, filteredOrders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage))}
                          checked={filteredOrders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).every(o => selectedIds.has(o.id)) && filteredOrders.length > 0}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Mã đơn hàng</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Mã vận đơn</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Người nhận</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>SĐT</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Địa chỉ</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Trạng thái</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Phí ship</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Ngày tạo</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredOrders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((order) => (
                      <TableRow
                        key={order.id}
                        hover
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: '#f5f5f5',
                          }
                        }}
                      >
                        <TableCell padding="checkbox">
                          <input type="checkbox" checked={selectedIds.has(order.id)} onChange={() => toggleRow(order.id)} aria-label="select-row" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500} color="primary">
                            {order.order_id || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace" fontSize="0.85rem">
                            {order.carrier_order_code}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontSize="0.85rem">
                            {order.customer_name || order.payload?.order?.name || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontSize="0.85rem">
                            {order.customer_phone || order.payload?.order?.tel || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>
                          <Tooltip title={order.customer_address || order.payload?.order?.address || '-'}>
                            <Typography variant="body2" fontSize="0.85rem" noWrap>
                              {order.customer_address || order.payload?.order?.address || '-'}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(order.status)}
                            color={getStatusColor(order.status) as any}
                            size="small"
                            sx={{ fontSize: '0.75rem', height: 24 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500} fontSize="0.85rem">
                            {formatCurrency(order.fee_amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontSize="0.85rem">
                            {new Date(order.created_at).toLocaleDateString('vi-VN')}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="Chi tiết">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => navigate(`/shipping/orders/${order.order_id || order.carrier_order_code}`)}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {order.ghkt_url || (order as any).ghtk_url ? (
                              <Tooltip title="Mở trên GHTK">
                                <IconButton size="small" color="secondary" onClick={() => window.open(((order as any).ghtk_url || order.ghkt_url), '_blank')}>
                                  <OpenInNew fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : null}
                            <Tooltip title="In vận đơn">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => handlePrintLabel(order)}
                                disabled={printLabelMutation.isPending}
                              >
                                <Print fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Đồng bộ">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleSync(order)}
                                disabled={syncOrderMutation.isPending || (order.can_sync !== undefined && !order.can_sync)}
                              >
                                <Refresh fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Hủy đơn">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleCancelOrder(order)}
                                disabled={(order.can_cancel !== undefined && !order.can_cancel) || ['cancelled', 'delivered', 'failed', 'đã hủy', 'đã giao', 'đã đối soát'].includes(order.status?.toLowerCase() || '')}
                              >
                                <Cancel fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredOrders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} align="center">
                          <Box sx={{ py: 6 }}>
                            <LocalShipping sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="body1" color="text.secondary" gutterBottom>
                              Không tìm thấy đơn hàng nào
                            </Typography>
                            {searchTerm && (
                              <Typography variant="body2" color="text.secondary">
                                Thử tìm kiếm với từ khóa khác
                              </Typography>
                            )}
                            {!searchTerm && (
                              <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => navigate('/shipping/ghtk/create')}
                                sx={{ mt: 2 }}
                              >
                                Tạo đơn đầu tiên
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination - GHTK Style */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" size="small" disabled={selectedIds.size === 0} onClick={bulkPrint} startIcon={<Print />}>In đã chọn</Button>
                  <Button variant="outlined" color="error" size="small" disabled={selectedIds.size === 0} onClick={bulkCancel} startIcon={<Cancel />}>Hủy đã chọn</Button>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Hiển thị {page * rowsPerPage + 1} - {Math.min((page + 1) * rowsPerPage, filteredOrders.length)} trong tổng số {filteredOrders.length} đơn hàng
                </Typography>
                <TablePagination
                  component="div"
                  count={filteredOrders.length}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  rowsPerPageOptions={[10, 20, 50, 100]}
                  labelRowsPerPage="Số dòng:"
                  labelDisplayedRows={({ from, to, count }) => ``}
                />
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cancel Order Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Hủy đơn hàng</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Bạn có chắc chắn muốn hủy đơn hàng <strong>{selectedOrder?.carrier_order_code}</strong>?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Lý do hủy (tùy chọn)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Nhập lý do hủy đơn..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>
            Đóng
          </Button>
          <Button
            onClick={confirmCancelOrder}
            variant="contained"
            color="error"
            disabled={cancelOrderMutation.isPending}
            startIcon={cancelOrderMutation.isPending ? <CircularProgress size={16} /> : <Cancel />}
          >
            Xác nhận hủy
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sync By Codes Dialog */}
      <Dialog open={syncDialogOpen} onClose={() => setSyncDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CloudSync color="primary" />
            <Typography variant="h6">Đồng bộ đơn hàng từ GHTK Portal</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Hướng dẫn:</strong>
              </Typography>
              <Typography variant="body2" component="div">
                1. Truy cập <a href="https://khachhang.giaohangtietkiem.vn/web/van-hanh/don-hang" target="_blank" rel="noopener noreferrer">GHTK Portal</a><br />
                2. Copy các mã đơn hàng cần đồng bộ<br />
                3. Dán vào ô bên dưới (mỗi mã một dòng hoặc cách nhau bằng dấu phẩy)<br />
                4. Nhấn "Đồng bộ" để bắt đầu
              </Typography>
            </Alert>
            <TextField
              fullWidth
              multiline
              rows={8}
              label="Mã đơn hàng GHTK"
              value={orderCodes}
              onChange={(e) => setOrderCodes(e.target.value)}
              placeholder="Ví dụ:&#10;S123456789&#10;S987654321&#10;&#10;Hoặc: S123456789, S987654321"
              disabled={syncByCodesMutation.isPending}
              helperText={`Đã nhập: ${orderCodes.split(/[\n,]+/).filter(c => c.trim()).length} mã đơn`}
            />
          </Box>

          {/* Sync Result */}
          {syncResult && (
            <Box sx={{ mt: 2 }}>
              <Alert severity={syncResult.synced > 0 ? 'success' : 'warning'} sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight={600}>
                  Đã đồng bộ: {syncResult.synced}/{syncResult.total} đơn hàng
                </Typography>
              </Alert>
              {syncResult.errors.length > 0 && (
                <Box>
                  <Typography variant="body2" color="error" fontWeight={600} gutterBottom>
                    Lỗi ({syncResult.errors.length}):
                  </Typography>
                  <Box
                    sx={{
                      maxHeight: 200,
                      overflowY: 'auto',
                      bgcolor: '#fff3e0',
                      p: 1,
                      borderRadius: 1,
                      border: '1px solid #ff9800'
                    }}
                  >
                    {syncResult.errors.map((error, index) => (
                      <Typography key={index} variant="caption" display="block" color="error" sx={{ fontFamily: 'monospace' }}>
                        • {error}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* Loading State */}
          {syncByCodesMutation.isPending && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
              <CircularProgress size={24} />
              <Typography variant="body2">Đang đồng bộ đơn hàng từ GHTK...</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSyncDialogOpen(false)} disabled={syncByCodesMutation.isPending}>
            Đóng
          </Button>
          <Button
            onClick={handleSyncByCodesSubmit}
            variant="contained"
            color="primary"
            disabled={syncByCodesMutation.isPending || !orderCodes.trim()}
            startIcon={syncByCodesMutation.isPending ? <CircularProgress size={16} /> : <CloudSync />}
          >
            {syncByCodesMutation.isPending ? 'Đang đồng bộ...' : 'Đồng bộ'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert elevation={6} variant="filled" severity={snackbar.severity}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
};

export default ShippingOrders;
