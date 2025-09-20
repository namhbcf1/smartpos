import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Box,
  Typography,
  Paper,
  Container,
  Stack,
  useTheme,
  useMediaQuery,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  IconButton,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Tooltip,
  Badge,
  
  Divider,
  Alert,
  Snackbar,
  Drawer,
  
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Store as StoresIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  
  AttachMoney as MoneyIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Dashboard as DashboardIcon,
  Visibility as ViewIcon,
  
  Warning as WarningIcon,
  Security as WarrantyIcon,
  Assignment as ClaimIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useQuery } from '../../hooks/useApiData';

// Real D1 Data - No Mock Data

interface Store {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  is_active: boolean;
  analytics?: {
    sales: { total_sales: number; total_revenue: number; avg_order_value: number };
    inventory: { total_products: number; low_stock_items: number };
    customers: { total_customers: number };
  };
}

const Stores = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management - 100% Real D1 Data
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    is_active: true
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Warranty management state
  const [warrantyDrawer, setWarrantyDrawer] = useState<{ open: boolean; store: Store | null }>({ open: false, store: null });
  const [newClaimOpen, setNewClaimOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [warrantyFilters, setWarrantyFilters] = useState<{ status: string; serial: string; from: string; to: string }>({ status: '', serial: '', from: '', to: '' });

  // Real D1 API integration
  const { data: storesData, error: apiError } = useQuery('/stores/simple');

  // Load real data from Cloudflare D1
  useEffect(() => {
    const fetchStoresData = async () => {
      try {
        setLoading(true);

        // Fetch stores from real D1 database
        const response = await api.get('/stores/simple');
        if (response.data.success && response.data.data) {
          setStores(response.data.data.data || []);
        } else {
          // Fallback to useApiData hook
          if (storesData && (storesData as any).data) {
            setStores((storesData as any).data);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching stores:', err);
        setError('Không thể tải dữ liệu cửa hàng');
        setLoading(false);
      }
    };

    fetchStoresData();
  }, [storesData]);

  // Update stores when API data changes
  useEffect(() => {
    if (storesData && (storesData as any).data) {
      setStores((storesData as any).data);
      setLoading(false);
    }
    if (apiError) {
      setError('Không thể tải dữ liệu cửa hàng');
      setLoading(false);
    }
  }, [storesData, apiError]);

  // Handle form submission - Real D1 API calls
  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (dialogMode === 'create') {
        // Create new store via real API
        const response = await api.post('/stores', formData);

        if (response.data.success) {
          // Refresh stores list
          const storesResponse = await api.get('/stores/simple');
          if (storesResponse.data.success) {
            setStores(storesResponse.data.data.data || []);
          }
          setSnackbar({ open: true, message: 'Tạo cửa hàng thành công!', severity: 'success' });
        } else {
          setSnackbar({ open: true, message: 'Lỗi khi tạo cửa hàng', severity: 'error' });
        }
      } else if (dialogMode === 'edit' && selectedStore) {
        // Update store via real API
        const response = await api.put(`/stores/${selectedStore.id}`, formData);

        if (response.data.success) {
          // Update local state
          setStores(stores.map(store =>
            store.id === selectedStore.id ? { ...store, ...formData } : store
          ));
          setSnackbar({ open: true, message: 'Cập nhật cửa hàng thành công!', severity: 'success' });
        } else {
          setSnackbar({ open: true, message: 'Lỗi khi cập nhật cửa hàng', severity: 'error' });
        }
      }

      setLoading(false);
      handleCloseDialog();
    } catch (error) {
      console.error('Error submitting form:', error);
      setSnackbar({ open: true, message: 'Lỗi kết nối', severity: 'error' });
      setLoading(false);
    }
  };

  // Handle dialog operations
  const handleOpenDialog = (mode: 'create' | 'edit' | 'view', store?: Store) => {
    setDialogMode(mode);
    setSelectedStore(store || null);
    if (store) {
      setFormData({
        name: store.name,
        address: store.address,
        phone: store.phone,
        email: store.email,
        is_active: store.is_active
      });
    } else {
      setFormData({ name: '', address: '', phone: '', email: '', is_active: true });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedStore(null);
  };

  // Handle delete - Real D1 API call
  const handleDelete = async (storeId: number) => {
    try {
      setLoading(true);

              const response = await api.delete(`/stores/${storeId}`);

      if (response.data.success) {
        // Update local state
        setStores(stores.filter(store => store.id !== storeId));
        setSnackbar({ open: true, message: 'Xóa cửa hàng thành công!', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Lỗi khi xóa cửa hàng', severity: 'error' });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error deleting store:', error);
      setSnackbar({ open: true, message: 'Lỗi kết nối', severity: 'error' });
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
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
          bgcolor: 'white',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
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
                mb: 1
              }}
            >
              <StoresIcon sx={{ fontSize: 'inherit' }} />
              Quản lý cửa hàng
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '0.875rem', sm: '1rem' },
                opacity: 0.9
              }}
            >
              Hệ thống quản lý cửa hàng thông minh với analytics và báo cáo chi tiết
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => setExportOpen(true)}
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.6)' }}
            >
              Xuất
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.6)' }}
            >
              In
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('create')}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.3)',
                }
              }}
            >
              Thêm cửa hàng
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Statistics Overview */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
        <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold">{stores.length}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Tổng cửa hàng</Typography>
              </Box>
              <BusinessIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Stack>
          </CardContent>
        </Card>
        <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold">{stores.filter(s => s.is_active).length}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Đang hoạt động</Typography>
              </Box>
              <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Stack>
          </CardContent>
        </Card>
        <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold">{formatCurrency(stores.reduce((sum, store) => sum + (store.analytics?.sales.total_revenue || 0), 0))}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Tổng doanh thu</Typography>
              </Box>
              <MoneyIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Stack>
          </CardContent>
        </Card>
        <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold">{stores.reduce((sum, store) => sum + (store.analytics?.customers.total_customers || 0), 0)}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Tổng khách hàng</Typography>
              </Box>
              <PeopleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* Stores Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 3 }}>
        {stores.map((store) => (
          <Box key={store.id}>
            <Card
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8],
                },
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              {/* Store Header */}
              <Box
                sx={{
                  background: store.is_active
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%)',
                  color: 'white',
                  p: 2
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="bold" noWrap>
                      {store.name}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                      <Chip
                        label={store.is_active ? 'Hoạt động' : 'Tạm dừng'}
                        size="small"
                        sx={{
                          bgcolor: store.is_active ? 'rgba(76, 175, 80, 0.8)' : 'rgba(244, 67, 54, 0.8)',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                      {store.analytics && store.analytics.inventory.low_stock_items > 0 && (
                        <Tooltip title={`${store.analytics.inventory.low_stock_items} sản phẩm sắp hết hàng`}>
                          <Badge badgeContent={store.analytics.inventory.low_stock_items} color="error">
                            <WarningIcon sx={{ fontSize: 20 }} />
                          </Badge>
                        </Tooltip>
                      )}
                    </Stack>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <StoresIcon />
                  </Avatar>
                </Stack>
              </Box>

              {/* Store Content */}
              <CardContent sx={{ p: 2 }}>
                {/* Contact Info */}
                <Stack spacing={1.5} sx={{ mb: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <LocationIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {store.address}
                    </Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {store.phone}
                    </Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {store.email}
                    </Typography>
                  </Stack>
                </Stack>

                <Divider sx={{ my: 2 }} />

                {/* Analytics */}
                {store.analytics && (
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5, color: 'primary.main' }}>
                      📊 Thống kê (30 ngày)
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="h6" fontWeight="bold" color="primary.main">
                          {store.analytics.sales.total_sales}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Đơn hàng
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="h6" fontWeight="bold" color="success.main">
                          {formatCurrency(store.analytics.sales.total_revenue)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Doanh thu
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="h6" fontWeight="bold" color="info.main">
                          {store.analytics.inventory.total_products}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Sản phẩm
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="h6" fontWeight="bold" color="warning.main">
                          {store.analytics.customers.total_customers}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Khách hàng
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              </CardContent>

              {/* Store Actions */}
              <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Bảo hành & yêu cầu">
                    <IconButton
                      size="small"
                      onClick={() => setWarrantyDrawer({ open: true, store })}
                      sx={{ color: 'secondary.main' }}
                    >
                      <WarrantyIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Xem chi tiết">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog('view', store)}
                      sx={{ color: 'primary.main' }}
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Chỉnh sửa">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog('edit', store)}
                      sx={{ color: 'warning.main' }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Xóa">
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(store.id)}
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DashboardIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  Dashboard
                </Button>
              </CardActions>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
          onClick={() => handleOpenDialog('create')}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Store Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <StoresIcon />
          {dialogMode === 'create' && 'Thêm cửa hàng mới'}
          {dialogMode === 'edit' && 'Chỉnh sửa cửa hàng'}
          {dialogMode === 'view' && 'Thông tin cửa hàng'}
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Tên cửa hàng"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={dialogMode === 'view'}
              variant="outlined"
              InputProps={{
                startAdornment: <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />

            <TextField
              fullWidth
              label="Địa chỉ"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              disabled={dialogMode === 'view'}
              variant="outlined"
              multiline
              rows={2}
              InputProps={{
                startAdornment: <LocationIcon sx={{ mr: 1, color: 'text.secondary', alignSelf: 'flex-start', mt: 1 }} />
              }}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                label="Số điện thoại"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={dialogMode === 'view'}
                variant="outlined"
                InputProps={{
                  startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={dialogMode === 'view'}
                variant="outlined"
                InputProps={{
                  startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  disabled={dialogMode === 'view'}
                />
              }
              label="Cửa hàng đang hoạt động"
            />

            {dialogMode === 'view' && selectedStore?.analytics && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                  📊 Thống kê chi tiết
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.50' }}>
                    <Typography variant="h4" color="primary.main" fontWeight="bold">
                      {selectedStore.analytics.sales.total_sales}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tổng đơn hàng
                    </Typography>
                  </Paper>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.50' }}>
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      {formatCurrency(selectedStore.analytics.sales.total_revenue)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tổng doanh thu
                    </Typography>
                  </Paper>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.50' }}>
                    <Typography variant="h4" color="info.main" fontWeight="bold">
                      {formatCurrency(selectedStore.analytics.sales.avg_order_value)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Giá trị TB/đơn
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseDialog} variant="outlined">
            {dialogMode === 'view' ? 'Đóng' : 'Hủy'}
          </Button>
          {dialogMode !== 'view' && (
            <Button
              onClick={handleSubmit}
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              {dialogMode === 'create' ? 'Tạo cửa hàng' : 'Cập nhật'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Warranty Drawer */}
      <Drawer anchor="right" open={warrantyDrawer.open} onClose={() => setWarrantyDrawer({ open: false, store: null })} PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
          <Typography variant="h6">Bảo hành - {warrantyDrawer.store?.name}</Typography>
          <IconButton onClick={() => setWarrantyDrawer({ open: false, store: null })}><CloseIcon /></IconButton>
        </Box>
        <Divider />
        <Box sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="success.main">24</Typography>
                <Typography variant="caption" color="text.secondary">Đang BH</Typography>
              </Paper>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="warning.main">7</Typography>
                <Typography variant="caption" color="text.secondary">Sắp hết hạn</Typography>
              </Paper>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="error.main">5</Typography>
                <Typography variant="caption" color="text.secondary">Hết hạn</Typography>
              </Paper>
            </Box>

            <Divider />
            <Typography variant="subtitle2">Bộ lọc</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select value={warrantyFilters.status} label="Trạng thái" onChange={(e) => setWarrantyFilters({ ...warrantyFilters, status: e.target.value })}>
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="in_warranty">Trong BH</MenuItem>
                  <MenuItem value="expiring">Sắp hết hạn</MenuItem>
                  <MenuItem value="expired">Hết hạn</MenuItem>
                </Select>
              </FormControl>
              <TextField fullWidth label="Serial" value={warrantyFilters.serial} onChange={(e) => setWarrantyFilters({ ...warrantyFilters, serial: e.target.value })} />
              <TextField fullWidth type="date" label="Từ ngày" InputLabelProps={{ shrink: true }} value={warrantyFilters.from} onChange={(e) => setWarrantyFilters({ ...warrantyFilters, from: e.target.value })} />
              <TextField fullWidth type="date" label="Đến ngày" InputLabelProps={{ shrink: true }} value={warrantyFilters.to} onChange={(e) => setWarrantyFilters({ ...warrantyFilters, to: e.target.value })} />
            </Box>

            <Divider />
            <Typography variant="subtitle2">Yêu cầu gần đây</Typography>
            <Stack spacing={1}>
              {[1,2,3,4].map(i => (
                <Stack key={i} direction="row" spacing={1} alignItems="center">
                  <Chip size="small" label={`CL-${1000 + i}`} />
                  <Typography variant="body2" sx={{ flex: 1 }}>Thiết bị #{i} lỗi khởi động</Typography>
                  <Chip size="small" color={i % 2 === 0 ? 'success' : 'info'} label={i % 2 === 0 ? 'resolved' : 'in_progress'} />
                </Stack>
              ))}
            </Stack>

            <Button variant="contained" startIcon={<ClaimIcon />} onClick={() => setNewClaimOpen(true)}>Tạo yêu cầu</Button>
          </Stack>
        </Box>
      </Drawer>

      {/* New Warranty Claim */}
      <Dialog open={newClaimOpen} onClose={() => setNewClaimOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tạo yêu cầu bảo hành</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField fullWidth label="Sản phẩm/Thiết bị" placeholder="Nhập tên hoặc serial" />
            <TextField fullWidth label="Tiêu đề" />
            <TextField fullWidth label="Mô tả" multiline minRows={3} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewClaimOpen(false)}>Đóng</Button>
          <Button variant="contained" onClick={() => setNewClaimOpen(false)}>Gửi</Button>
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportOpen} onClose={() => setExportOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Xuất dữ liệu</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5}>
            <Button startIcon={<DownloadIcon />} variant="outlined">Xuất CSV bảo hành</Button>
            <Button startIcon={<DownloadIcon />} variant="outlined">Xuất CSV yêu cầu</Button>
            <Button startIcon={<PrintIcon />} variant="outlined" onClick={() => window.print()}>In tổng quan</Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Stores;
