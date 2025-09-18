import React, { useState, useEffect } from 'react';
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
  LinearProgress,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Store as StoresIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Dashboard as DashboardIcon,
  Visibility as ViewIcon,
  Settings as SettingsIcon,
  Star as StarIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useQuery } from '../hooks/useApiData';

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

  // Real D1 API integration
  const { data: storesData, loading: apiLoading, error: apiError } = useQuery('/stores/simple');

  // Load real data from Cloudflare D1
  useEffect(() => {
    const fetchStoresData = async () => {
      try {
        setLoading(true);

        // Fetch stores from real D1 database
        const response = await fetch('/api/v1/stores/simple');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setStores(result.data.data || []);
          }
        } else {
          // Fallback to useApiData hook
          if (storesData && storesData.data) {
            setStores(storesData.data);
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
    if (storesData && storesData.data) {
      setStores(storesData.data);
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
        const response = await fetch('/api/v1/stores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Refresh stores list
            const storesResponse = await fetch('/api/v1/stores/simple');
            if (storesResponse.ok) {
              const storesResult = await storesResponse.json();
              if (storesResult.success) {
                setStores(storesResult.data.data || []);
              }
            }
            setSnackbar({ open: true, message: 'Tạo cửa hàng thành công!', severity: 'success' });
          }
        } else {
          setSnackbar({ open: true, message: 'Lỗi khi tạo cửa hàng', severity: 'error' });
        }
      } else if (dialogMode === 'edit' && selectedStore) {
        // Update store via real API
        const response = await fetch(`/api/v1/stores/${selectedStore.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Update local state
            setStores(stores.map(store =>
              store.id === selectedStore.id ? { ...store, ...formData } : store
            ));
            setSnackbar({ open: true, message: 'Cập nhật cửa hàng thành công!', severity: 'success' });
          }
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

      const response = await fetch(`/api/v1/stores/${storeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Update local state
          setStores(stores.filter(store => store.id !== storeId));
          setSnackbar({ open: true, message: 'Xóa cửa hàng thành công!', severity: 'success' });
        }
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
      </Paper>

      {/* Statistics Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stores.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Tổng cửa hàng
                  </Typography>
                </Box>
                <BusinessIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stores.filter(s => s.is_active).length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Đang hoạt động
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(stores.reduce((sum, store) => sum + (store.analytics?.sales.total_revenue || 0), 0))}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Tổng doanh thu
                  </Typography>
                </Box>
                <MoneyIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stores.reduce((sum, store) => sum + (store.analytics?.customers.total_customers || 0), 0)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Tổng khách hàng
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Stores Grid */}
      <Grid container spacing={3}>
        {stores.map((store) => (
          <Grid item xs={12} md={6} lg={4} key={store.id}>
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
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="h6" fontWeight="bold" color="primary.main">
                            {store.analytics.sales.total_sales}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Đơn hàng
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="h6" fontWeight="bold" color="success.main">
                            {formatCurrency(store.analytics.sales.total_revenue)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Doanh thu
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="h6" fontWeight="bold" color="info.main">
                            {store.analytics.inventory.total_products}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Sản phẩm
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="h6" fontWeight="bold" color="warning.main">
                            {store.analytics.customers.total_customers}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Khách hàng
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </CardContent>

              {/* Store Actions */}
              <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
                <Stack direction="row" spacing={1}>
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
          </Grid>
        ))}
      </Grid>

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

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
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
              </Grid>
              <Grid item xs={12} sm={6}>
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
              </Grid>
            </Grid>

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
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.50' }}>
                      <Typography variant="h4" color="primary.main" fontWeight="bold">
                        {selectedStore.analytics.sales.total_sales}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tổng đơn hàng
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.50' }}>
                      <Typography variant="h4" color="success.main" fontWeight="bold">
                        {formatCurrency(selectedStore.analytics.sales.total_revenue)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tổng doanh thu
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.50' }}>
                      <Typography variant="h4" color="info.main" fontWeight="bold">
                        {formatCurrency(selectedStore.analytics.sales.avg_order_value)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Giá trị TB/đơn
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
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
    </Container>
  );
};

export default Stores;