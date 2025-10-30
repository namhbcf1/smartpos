import React, { useState, useEffect } from 'react';
import Checkbox from '@mui/material/Checkbox';
// duplicate imports removed
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Chip,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Avatar,
  CircularProgress,
  Backdrop,
  Tooltip,
  Fab
} from '@mui/material';
// Removed Grid due to typing issues; using Box with CSS grid/flex instead
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Pagination from '@mui/material/Pagination';
import CustomerFilters, { type CustomerFilters as CustomerFiltersType } from '../../components/customers/CustomerFilters';
import CustomerDetailsDrawer from '../../components/customers/CustomerDetailsDrawer';
import api from '../../services/api';
import { Autocomplete } from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import {
  Search,
  Add,
  Refresh,
  Visibility,
  Edit,
  Delete,
  Person,
  FilterList,
  Email,
  Phone,
  LocationOn,
  AttachMoney,
  ShoppingCart,
  Star,
  Schedule,
  CalendarToday,
  Loyalty,
  TrendingUp,
  CheckCircle,
  Favorite,
  LocalShipping
} from '@mui/icons-material';
import { ViewModule, ViewList } from '@mui/icons-material';

// Lightweight i18n constants
const I18N = {
  vi: {
    addCustomer: 'Thêm khách hàng',
    addNewCustomer: 'Thêm khách hàng mới',
    editCustomer: 'Chỉnh sửa thông tin khách hàng',
    updateCustomer: 'Cập nhật khách hàng',
    cancel: 'Hủy',
    name: 'Tên khách hàng',
    email: 'Email',
    phone: 'Số điện thoại',
    address: 'Địa chỉ',
    customerType: 'Loại khách hàng',
    gender: 'Giới tính',
    dob: 'Ngày sinh',
    active: 'Đang hoạt động',
    searchPlaceholder: 'Tìm kiếm theo tên, email, số điện thoại...',
    exportCSV: 'Xuất CSV',
    importCSV: 'Nhập CSV',
    refresh: 'Làm mới',
    filters: 'Bộ lọc',
    selectedDelete: (n: number) => `Xóa đã chọn (${n})`,
    validationNameRequired: 'Vui lòng nhập tên khách hàng',
    validationEmailInvalid: 'Email không hợp lệ',
    validationPhoneInvalid: 'Số điện thoại không hợp lệ',
    duplicateFound: 'Khách hàng trùng (email hoặc số điện thoại) đã tồn tại',
  }
};
const T = I18N.vi;

// Customer Card Component
interface CustomerCardProps {
  customer: any;
  onEdit: (customer: any) => void;
  onDelete: (id: string) => void;
  onView: (customer: any) => void;
  onCreateGHTKOrder: (customer: any) => void;
  viewMode?: 'grid' | 'list' | 'compact';
}

const CustomerCard: React.FC<CustomerCardProps> = ({ 
  customer, 
  onEdit, 
  onDelete, 
  onView, 
  onCreateGHTKOrder,
  viewMode = 'grid'
}) => {
  const formatCurrency = (amount: number) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'vip': return 'error';
      case 'premium': return 'warning';
      case 'regular': return 'success';
      default: return 'default';
    }
  };

  const getCustomerTypeLabel = (type: string) => {
    switch (type) {
      case 'vip': return 'VIP';
      case 'premium': return 'Premium';
      case 'regular': return 'Thường';
      default: return 'Mới';
    }
  };

  if (viewMode === 'list') {
    return (
      <Card sx={{ mb: 2, transition: 'all 0.3s ease' }}>
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr 1fr 1fr' }, gap: 2, alignItems: 'center' }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.light' }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {customer.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {customer.email || 'Chưa có email'}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                {customer.phone || 'Chưa có số điện thoại'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {customer.address || 'Chưa có địa chỉ'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Đã mua: {customer.total_orders || 0} đơn
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Tổng tiền: {formatCurrency(customer.total_spent_cents || 0)}
              </Typography>
            </Box>
            <Box>
              <Chip
                label={getCustomerTypeLabel(customer.customer_type)}
                color={getCustomerTypeColor(customer.customer_type) as any}
                size="small"
              />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Xem chi tiết">
                  <IconButton size="small" onClick={() => onView(customer)}>
                    <Visibility />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Chỉnh sửa">
                  <IconButton size="small" onClick={() => onEdit(customer)}>
                    <Edit />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Tạo đơn GHTK">
                  <IconButton size="small" color="success" onClick={() => onCreateGHTKOrder(customer)}>
                    <LocalShipping />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Xóa">
                  <IconButton size="small" color="error" onClick={() => onDelete(customer.id)}>
                    <Delete />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
        }
      }}
    >
      <CardContent sx={{ flex: 1, p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar sx={{
            width: 60,
            height: 60,
            bgcolor: customer.customer_type === 'vip' ? 'error.main' : 
                     customer.customer_type === 'premium' ? 'warning.main' : 'success.main',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <Person sx={{ fontSize: 30 }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
              {customer.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {customer.email || 'Chưa có email'}
            </Typography>
          </Box>
          {/* RFM/LTV and birthday tags */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
            label={getCustomerTypeLabel(customer.customer_type)}
            color={getCustomerTypeColor(customer.customer_type) as any}
            size="small"
            sx={{
              fontWeight: 600,
              borderRadius: 2
            }}
            />
            {customer.total_spent_cents > 10000000 && (
              <Chip size="small" label="LTV cao" color="success" />
            )}
            {customer.total_orders >= 5 && (
              <Chip size="small" label="Tần suất cao" color="warning" />
            )}
            {customer.date_of_birth && new Date(customer.date_of_birth).getMonth() === new Date().getMonth() && (
              <Chip size="small" label="Sinh nhật tháng này" color="info" />
            )}
          </Box>
        </Box>

        {/* Contact Info */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Phone sx={{ fontSize: 16, color: 'warning.main' }} />
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              {customer.phone || 'Chưa có số điện thoại'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
            <LocationOn sx={{ fontSize: 16, color: 'text.secondary', mt: 0.2 }} />
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              {customer.address || 'Chưa có địa chỉ'}
            </Typography>
          </Box>
          {customer.date_of_birth && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CalendarToday sx={{ fontSize: 16, color: 'info.main' }} />
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                {new Date(customer.date_of_birth).toLocaleDateString('vi-VN')}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Purchase Info */}
        <Box sx={{
          p: 2,
          borderRadius: 2,
          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)',
          border: '1px solid rgba(76, 175, 80, 0.2)',
          mb: 3
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <ShoppingCart sx={{ fontSize: 16, color: 'success.main' }} />
            <Typography variant="subtitle2" fontWeight="bold" color="success.main">
              Thông tin mua hàng
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Đơn hàng:</Typography>
            <Typography variant="body2" fontWeight="bold">
              {customer.total_orders || 0} đơn
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Tổng tiền:</Typography>
            <Typography variant="h6" fontWeight="bold" color="success.main">
              {formatCurrency(customer.total_spent_cents || 0)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Điểm thưởng:</Typography>
            <Typography variant="body2" fontWeight="bold" color="warning.main">
              {customer.loyalty_points || 0} điểm
            </Typography>
          </Box>
        </Box>

        {/* Last Visit */}
        {customer.last_visit && (
          <Box sx={{
            p: 2,
            borderRadius: 2,
            background: 'rgba(33, 150, 243, 0.05)',
            border: '1px solid rgba(33, 150, 243, 0.2)',
            mb: 3
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Schedule sx={{ fontSize: 16, color: 'info.main' }} />
              <Typography variant="subtitle2" fontWeight="bold" color="info.main">
                Lần cuối mua hàng
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {new Date(customer.last_visit).toLocaleString('vi-VN')}
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* Action Buttons */}
      <Box sx={{ p: 3, borderTop: '1px solid rgba(0,0,0,0.1)', background: 'rgba(0,0,0,0.02)' }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
            size="small"
            variant="contained"
            startIcon={<Visibility />}
            onClick={() => onView(customer)}
              aria-label="view-customer"
            sx={{
              flex: 1,
              minWidth: '80px',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
              }
            }}
          >
            Xem
          </Button>
            <Button
            size="small"
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => onEdit(customer)}
              aria-label="edit-customer"
            sx={{
              flex: 1,
              minWidth: '80px',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                borderColor: 'primary.dark',
                backgroundColor: 'rgba(102, 126, 234, 0.05)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
              }
            }}
          >
            Sửa
          </Button>
            <Button
            size="small"
            variant="contained"
            startIcon={<LocalShipping />}
            onClick={() => onCreateGHTKOrder(customer)}
              aria-label="create-ghtk-order"
            sx={{
              flex: 1,
              minWidth: '80px',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #45a049 0%, #5cb85c 100%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)'
              }
            }}
          >
            GHTK
          </Button>
            <Button
            size="small"
            color="error"
            variant="outlined"
            startIcon={<Delete />}
            onClick={() => onDelete(customer.id)}
              aria-label="delete-customer"
            sx={{
              flex: 1,
              minWidth: '80px',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: 'error.main',
              color: 'error.main',
              '&:hover': {
                borderColor: 'error.dark',
                backgroundColor: 'rgba(244, 67, 54, 0.05)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(244, 67, 54, 0.2)'
              }
            }}
          >
            Xóa
          </Button>
        </Box>
      </Box>
    </Card>
  );
};

// Customer Form Component
interface CustomerFormProps {
  open: boolean;
  onClose: () => void;
  customer?: any;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ open, onClose, customer }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    provinceId: '',
    // districtId: '', // REMOVED - theo chuẩn GHTK mới
    districtName: '', // Thêm districtName - lấy từ ward.district_name
    wardId: '',
    street: '',
    date_of_birth: '',
    gender: '',
    customer_type: 'regular',
    loyalty_points: 0,
    is_active: 1
  });
  const [formError, setFormError] = useState<string>('');
  // 3-level geo state (bỏ districts)
  const [provinces, setProvinces] = useState<any[]>([]);
  // const [districts, setDistricts] = useState<any[]>([]); // REMOVED
  const [wards, setWards] = useState<any[]>([]);
  const [streets, setStreets] = useState<any[]>([]);
  const [loadingWards, setLoadingWards] = useState(false);
  const [loadingStreets, setLoadingStreets] = useState(false);

  // Prefill when editing
  useEffect(() => {
    if (open) {
      if (customer) {
        setFormData({
          name: customer.name || '',
          email: customer.email || '',
          phone: customer.phone || '',
          address: customer.address || '',
          provinceId: customer.province_id || '',
          // districtId: customer.district_id || '', // REMOVED
          districtName: customer.district_name || '', // Lấy từ DB
          wardId: customer.ward_id || '',
          street: customer.street || '',
          date_of_birth: customer.date_of_birth || '',
          gender: customer.gender || '',
          customer_type: customer.customer_type || 'regular',
          loyalty_points: customer.loyalty_points ?? 0,
          is_active: customer.is_active ?? 1,
        });
      } else {
        setFormData({
          name: '',
          email: '',
          phone: '',
          address: '',
          provinceId: '',
          // districtId: '', // REMOVED
          districtName: '',
          wardId: '',
          street: '',
          date_of_birth: '',
          gender: '',
          customer_type: 'regular',
          loyalty_points: 0,
          is_active: 1,
        });
      }
    }
  }, [open, customer]);

  // Load geo data
  useEffect(() => {
    if (!open) return;
    api.get('/shipping/geo/provinces').then(res => setProvinces(res.data.data || [])).catch(() => setProvinces([]));
  }, [open]);

  // REMOVED: Auto-parse address - logic cũ dùng 4 cấp
  // Giờ user chọn thủ công: Tỉnh/TP -> Phường/Xã (hiển thị district trong tên)

  // REMOVED: Load districts
  // Load wards trực tiếp từ provinceId
  useEffect(() => {
    if (!formData.provinceId) {
      setWards([]);
      setStreets([]);
      return;
    }
    setLoadingWards(true);
    api.get(`/shipping/geo/wards-by-province/${formData.provinceId}`)
      .then(res => setWards(res.data.data || []))
      .catch(() => setWards([]))
      .finally(() => setLoadingWards(false));
    setFormData(prev => ({ ...prev, wardId: '', districtName: '', street: '' }));
  }, [formData.provinceId]);

  useEffect(() => {
    if (!formData.wardId) { setStreets([]); return; }
    setLoadingStreets(true);
    api.get(`/shipping/geo/streets/${formData.wardId}`).then(res => {
      const list = res.data.data || [];
      setStreets(list.map((s: any) => typeof s === 'string' ? { name: s } : s));
    }).catch(() => setStreets([])).finally(() => setLoadingStreets(false));
  }, [formData.wardId]);

  const handleChange = (field: string) => (event: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    // Basic validation and duplicate detection
    if (!formData.name.trim()) {
      setFormError(T.validationNameRequired);
      return;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setFormError(T.validationEmailInvalid);
      return;
    }
    if (formData.phone && !/^\+?\d{7,15}$/.test(formData.phone.replace(/\s|-/g, ''))) {
      setFormError(T.validationPhoneInvalid);
      return;
    }
    const base = (import.meta as any).env?.VITE_API_BASE_URL || 'https://namhbcf-api.bangachieu2.workers.dev';
    const isEdit = Boolean(customer?.id);
    // Duplicate check (email/phone) when creating new
    if (!isEdit && (formData.email || formData.phone)) {
      try {
        const qs = new URLSearchParams();
        if (formData.email) qs.set('search', formData.email);
        if (!qs.get('search') && formData.phone) qs.set('search', formData.phone);
        const dupRes = await fetch(`${base}/api/customers?${qs.toString()}`, {
          headers: {
            'X-Tenant-ID': 'default',
            Authorization: localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : ''
          }
        });
        if (dupRes.ok) {
          const dupJson = await dupRes.json();
          const dupItems: any[] = dupJson?.customers || dupJson?.data || [];
          const hasDup = dupItems.some((c: any) => (formData.email && c.email === formData.email) || (formData.phone && c.phone === formData.phone));
          if (hasDup) {
            setFormError(T.duplicateFound);
            return;
          }
        }
      } catch {}
    }
    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      date_of_birth: formData.date_of_birth || null,
      gender: formData.gender || null,
      customer_type: formData.customer_type,
      loyalty_points: formData.loyalty_points,
      is_active: formData.is_active,
    };
    const url = isEdit ? `${base}/api/customers/${customer.id}` : `${base}/api/customers`;
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': 'default',
        Authorization: localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : ''
      },
      body: JSON.stringify(payload)
    });
    const ok = res.ok;
    if (ok) {
      setFormError('');
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'
        }
      }}
    >
      <DialogTitle sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center',
        py: 3,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%'
        }} />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
            {customer ? T.editCustomer : T.addNewCustomer}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {customer ? T.updateCustomer : T.addNewCustomer}
          </Typography>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 4 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
            {/* Tên khách hàng */}
            <Box>
              <TextField
                fullWidth
                label={T.name}
                value={formData.name}
                onChange={handleChange('name')}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: 'primary.main' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Email */}
            <Box>
              <TextField
                fullWidth
                label={T.email}
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: 'info.main' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Số điện thoại */}
            <Box>
              <TextField
                fullWidth
                label={T.phone}
                value={formData.phone}
                onChange={handleChange('phone')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone sx={{ color: 'warning.main' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Giới tính */}
            <Box>
              <FormControl fullWidth sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'white',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }
                }
              }}>
                <InputLabel>{T.gender}</InputLabel>
                <Select
                  value={formData.gender}
                  onChange={handleChange('gender')}
                  label={T.gender}
                >
                  <MenuItem value="male">Nam</MenuItem>
                  <MenuItem value="female">Nữ</MenuItem>
                  <MenuItem value="other">Khác</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Loại khách hàng */}
            <Box>
              <FormControl fullWidth sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'white',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }
                }
              }}>
                <InputLabel>{T.customerType}</InputLabel>
                <Select
                  value={formData.customer_type}
                  onChange={handleChange('customer_type')}
                  label={T.customerType}
                >
                  <MenuItem value="regular">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                      <Typography>Thường</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="premium">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                      <Typography>Premium</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="vip">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Favorite sx={{ fontSize: 16, color: 'error.main' }} />
                      <Typography>VIP</Typography>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Ngày sinh */}
            <Box>
              <TextField
                fullWidth
                label={T.dob}
                type="date"
                value={formData.date_of_birth}
                onChange={handleChange('date_of_birth')}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday sx={{ color: 'info.main' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Trạng thái */}
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active === 1}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked ? 1 : 0 }))}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: 'success.main',
                        '& + .MuiSwitch-track': {
                          backgroundColor: 'success.main',
                        },
                      },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle sx={{ color: formData.is_active === 1 ? 'success.main' : 'text.secondary' }} />
                    <Typography variant="body2" color={formData.is_active === 1 ? 'success.main' : 'text.secondary'}>
                      {T.active}
                    </Typography>
                  </Box>
                }
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: formData.is_active === 1 ? 'rgba(76, 175, 80, 0.05)' : 'rgba(0,0,0,0.05)',
                  border: `1px solid ${formData.is_active === 1 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(0,0,0,0.1)'}`,
                  width: '100%',
                  m: 0
                }}
              />
            </Box>

            {/* Địa chỉ nhận hàng - 3 cấp theo GHTK mới (bỏ Quận/Huyện) */}
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>📍 Địa chỉ nhận hàng</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Tỉnh/TP</InputLabel>
                  <Select label="Tỉnh/TP" value={formData.provinceId} onChange={(e) => setFormData(prev => ({ ...prev, provinceId: String(e.target.value) }))}>
                    {provinces.map((p: any) => (<MenuItem key={String(p.id)} value={String(p.id)}>{p.name}</MenuItem>))}
                  </Select>
                </FormControl>
                {/* REMOVED: Quận/Huyện dropdown - theo chuẩn GHTK mới */}
                <FormControl fullWidth>
                  <InputLabel>{loadingWards ? 'Đang tải...' : 'Phường/Xã'}</InputLabel>
                  <Select
                    label={loadingWards ? 'Đang tải...' : 'Phường/Xã'}
                    value={formData.wardId}
                    onChange={(e) => {
                      const selectedWard = wards.find((w: any) => String(w.id) === String(e.target.value));
                      setFormData(prev => ({
                        ...prev,
                        wardId: String(e.target.value),
                        districtName: selectedWard?.district_name || ''
                      }));
                    }}
                    disabled={!formData.provinceId || loadingWards}
                  >
                    {loadingWards ? (
                      <MenuItem disabled>Đang tải phường/xã...</MenuItem>
                    ) : wards.length === 0 ? (
                      <MenuItem disabled>{formData.provinceId ? 'Không có dữ liệu' : 'Chọn Tỉnh/TP trước'}</MenuItem>
                    ) : (
                      wards.map((w: any) => (
                        <MenuItem key={String(w.id)} value={String(w.id)}>
                          {w.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Box>
              {wards.length > 0 && !loadingWards && (
                <Typography variant="caption" sx={{ mb: 1, color: '#4caf50', fontSize: 12, display: 'block' }}>
                  ✅ {wards.length} phường/xã trong tỉnh
                </Typography>
              )}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2, mb: 2 }}>
                <Autocomplete options={streets} loading={loadingStreets} getOptionLabel={(o: any) => typeof o === 'string' ? o : (o?.name || '')} isOptionEqualToValue={(a: any, b: any) => (a?.name || a) === (b?.name || b)} value={streets.find((s: any) => (s?.name || s) === formData.street) || null} onChange={(_, v: any) => setFormData(prev => ({ ...prev, street: v?.name || v || '' }))} renderInput={(params) => <TextField {...params} label="Đường/Ấp/Khu" />} />
              </Box>
              <TextField fullWidth label="Số nhà, tên đường" value={formData.address} onChange={handleChange('address')} InputProps={{ startAdornment: (<InputAdornment position="start"><LocationOn sx={{ color: 'primary.main' }} /></InputAdornment>) }} />
            </Box>
          </Box>
          {formError && (
            <Alert severity="error" sx={{ mt: 2 }} aria-live="assertive">{formError}</Alert>
          )}
        </DialogContent>

        <DialogActions sx={{
          p: 3,
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
          borderTop: '1px solid rgba(0,0,0,0.1)',
          gap: 2
        }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1,
              borderColor: 'text.secondary',
              color: 'text.secondary',
              '&:hover': {
                borderColor: 'error.main',
                color: 'error.main',
                backgroundColor: 'rgba(244, 67, 54, 0.05)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(244, 67, 54, 0.2)'
              }
            }}
          >
            {T.cancel}
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {customer ? <Edit /> : <Add />}
              <Typography variant="body2">
                {customer ? T.updateCustomer : T.addNewCustomer}
              </Typography>
            </Box>
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Main Customers Management Component
const CustomersManagement: React.FC = () => {
  // State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState<'name' | 'total_spent_cents' | 'total_orders' | 'last_visit'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedCustomerForView, setSelectedCustomerForView] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'success' });
  const { user } = useAuth();
  const [filters, setFilters] = useState<CustomerFiltersType>({});
  // Virtualization state for list view
  const [listScrollTop, setListScrollTop] = useState<number>(0);
  const listItemHeight: number = 130;
  const listBuffer: number = 5;
  const handleListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setListScrollTop((e.target as HTMLDivElement).scrollTop);
  };

  // Debounce search term
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const {
    data: queryData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['customers-management', { page, pageSize, debouncedSearch, sortBy, sortDir, filters }],
    queryFn: async () => {
      const base = (import.meta as any).env?.VITE_API_BASE_URL || 'https://namhbcf-api.bangachieu2.workers.dev';
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (sortBy) params.set('sort', `${sortBy}:${sortDir}`);
      if (filters.type) params.set('type', String(filters.type));
      if (filters.status) params.set('status', String(filters.status));
      if (filters.pointsMin !== '' && filters.pointsMin != null) params.set('points_min', String(filters.pointsMin));
      if (filters.pointsMax !== '' && filters.pointsMax != null) params.set('points_max', String(filters.pointsMax));
      if (filters.dobMonth !== '' && filters.dobMonth != null) params.set('dob_month', String(filters.dobMonth));
      if (filters.hasContact) params.set('has_contact', String(filters.hasContact));

      // Prefer paginated endpoint if available; fall back to /all
      const url = `${base}/api/customers?${params.toString()}`;
      const res = await fetch(url, {
        headers: {
          'X-Tenant-ID': 'default',
          Authorization: localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : ''
        }
      });
      if (!res.ok) {
        // fallback
        const urlAll = `${base}/api/customers/all?limit=5000&page=1${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ''}`;
        const resAll = await fetch(urlAll, {
          headers: {
            'X-Tenant-ID': 'default',
            Authorization: localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : ''
          }
        });
        const jsonAll = await resAll.json();
        const listAll = (jsonAll?.customers || jsonAll?.data || []) as any[];
        setTotalItems(listAll.length);
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return { items: listAll.slice(start, end), total: listAll.length };
      }
      const json = await res.json();
      const items = (json?.customers || json?.data || json?.items || []) as any[];
      const total = (json?.total || json?.count || items.length) as number;
      setTotalItems(total);
      return { items, total } as { items: any[]; total: number };
    },
    staleTime: 30000
  });

  const customers: any[] = queryData?.items || [];

  // Handlers
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleEdit = (customer: any) => {
    setSelectedCustomer(customer);
    setFormOpen(true);
  };

  // After form closes, refresh list
  useEffect(() => {
    if (!formOpen) {
      refetch();
    }
  }, [formOpen, refetch]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) return;
    const base = (import.meta as any).env?.VITE_API_BASE_URL || 'https://namhbcf-api.bangachieu2.workers.dev';
    try {
      const res = await fetch(`${base}/api/customers/${id}`, {
        method: 'DELETE',
        headers: {
          'X-Tenant-ID': 'default',
          Authorization: localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : ''
        }
      });
      if (!res.ok) throw new Error('Delete failed');
      setSnackbar({ open: true, message: 'Đã xóa khách hàng', severity: 'success' });
      refetch();
    } catch (e) {
      setSnackbar({ open: true, message: 'Xóa khách hàng thất bại', severity: 'error' });
    }
  };

  const handleView = (customer: any) => {
    // Open the edit form with prefilled data to match the desired UX
    setSelectedCustomer(customer);
    setFormOpen(true);
    // Still allow details drawer via context menu or future actions
    setSelectedCustomerForView(customer);
  };

  const handleCreateGHTKOrder = (customer: any) => {
    // Navigate to GHTK order create page with customer data
    const customerData = {
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      // Include individual address components for better form population
      provinceId: customer.province_id,
      // districtId: customer.district_id, // REMOVED
      districtName: customer.district_name, // Lấy từ DB
      wardId: customer.ward_id,
      street: customer.street,
      hamlet: customer.hamlet || ''
    };

    // Store customer data in localStorage for GHTK form to use
    localStorage.setItem('ghtk_customer_data', JSON.stringify(customerData));

    // Navigate to GHTK order create page
    window.location.href = '/shipping/ghtk/create';
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const exportCSV = () => {
    const rows = customers.map((c: any) => ({ id: c.id, name: c.name, email: c.email, phone: c.phone, address: c.address, total_orders: c.total_orders || 0, total_spent_cents: c.total_spent_cents || 0 }));
    const header = Object.keys(rows[0] || { id: '', name: '', email: '', phone: '', address: '', total_orders: 0, total_spent_cents: 0 }).join(',');
    const body = rows.map(r => Object.values(r).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const csv = header + '\n' + body;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'customers.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const importCSV = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const [headerLine, ...dataLines] = lines;
    const headers = headerLine.split(',').map(h => h.replace(/^"|"$/g, ''));
    const base = (import.meta as any).env?.VITE_API_BASE_URL || 'https://namhbcf-api.bangachieu2.workers.dev';
    let okCount = 0; let failCount = 0;
    for (const line of dataLines) {
      const cols = line.split(',').map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));
      const rec: any = {};
      headers.forEach((h, i) => rec[h] = cols[i]);
      try {
        const res = await fetch(`${base}/api/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': 'default', Authorization: localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : '' },
          body: JSON.stringify({ name: rec.name, email: rec.email, phone: rec.phone, address: rec.address, customer_type: rec.customer_type || 'regular', is_active: 1 })
        });
        if (res.ok) okCount++; else failCount++;
      } catch { failCount++; }
    }
    setSnackbar({ open: true, message: `Import xong: ${okCount} OK, ${failCount} lỗi`, severity: failCount ? 'error' : 'success' });
    refetch();
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Xóa ${selectedIds.size} khách hàng đã chọn?`)) return;
    const base = (import.meta as any).env?.VITE_API_BASE_URL || 'https://namhbcf-api.bangachieu2.workers.dev';
    let ok = 0; let fail = 0;
    for (const id of Array.from(selectedIds)) {
      try {
        const res = await fetch(`${base}/api/customers/${id}`, { method: 'DELETE', headers: { 'X-Tenant-ID': 'default', Authorization: localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : '' } });
        if (res.ok) ok++; else fail++;
      } catch { fail++; }
    }
    setSelectedIds(new Set());
    setSnackbar({ open: true, message: `Đã xóa: ${ok}, lỗi: ${fail}`, severity: fail ? 'error' : 'success' });
    refetch();
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Không thể tải dữ liệu khách hàng. Vui lòng kiểm tra kết nối mạng.
        </Alert>
        <Button onClick={handleRefresh} startIcon={<Refresh />}>
          Thử lại
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Enhanced Header */}
      <Card sx={{
        mb: 4,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative'
      }}>
        <Box sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%'
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%'
        }} />
        <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
            <Avatar sx={{
              width: 80,
              height: 80,
              bgcolor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <Person sx={{ fontSize: 40 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                Hệ thống quản lý khách hàng thông minh
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                Quản lý thông tin khách hàng, lịch sử mua hàng và chương trình khuyến mãi
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  label="Quản lý khách hàng"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)'
                  }}
                />
                <Chip
                  label="Lịch sử mua hàng"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)'
                  }}
                />
                <Chip
                  label="Điểm thưởng"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)'
                  }}
                />
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<TrendingUp />}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1
              }}
            >
              Báo cáo khách hàng
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setFormOpen(true)}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'white',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1
              }}
            >
              Thêm khách hàng mới
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Enhanced Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <Box>
          <Card sx={{
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 30px rgba(102, 126, 234, 0.3)'
            }
          }}>
            <Box sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%'
            }} />
            <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{
                  width: 50,
                  height: 50,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <Person sx={{ fontSize: 24 }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {customers.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Tổng khách hàng
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Tất cả khách hàng trong hệ thống
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card sx={{
            borderRadius: 3,
            background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 30px rgba(76, 175, 80, 0.3)'
            }
          }}>
            <Box sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%'
            }} />
            <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{
                  width: 50,
                  height: 50,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <Star sx={{ fontSize: 24 }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {customers.filter((c: any) => c.customer_type === 'vip').length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Khách VIP
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Khách hàng VIP
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card sx={{
            borderRadius: 3,
            background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 30px rgba(255, 152, 0, 0.3)'
            }
          }}>
            <Box sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%'
            }} />
            <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{
                  width: 50,
                  height: 50,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <Loyalty sx={{ fontSize: 24 }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {customers.reduce((sum: number, c: any) => sum + (c.loyalty_points || 0), 0)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Điểm thưởng
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Tổng điểm thưởng
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card sx={{
            borderRadius: 3,
            background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 30px rgba(156, 39, 176, 0.3)'
            }
          }}>
            <Box sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%'
            }} />
            <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{
                  width: 50,
                  height: 50,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <AttachMoney sx={{ fontSize: 24 }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                      minimumFractionDigits: 0,
                    }).format(
                      customers.reduce((sum: number, c: any) => sum + (c.total_spent_cents || 0), 0)
                    )}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Tổng doanh thu
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Từ tất cả khách hàng
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Enhanced Toolbar */}
      <Card sx={{ 
        mb: 3, 
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
            {/* Search Field */}
            <TextField
              placeholder={T.searchPlaceholder}
              value={searchTerm}
              onChange={handleSearch}
              inputProps={{ 'aria-label': 'search-customers' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                minWidth: 350,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'white',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }
                }
              }}
            />

            {/* Sorting */}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Sắp xếp</InputLabel>
              <Select
                label="Sắp xếp"
                value={`${sortBy}:${sortDir}`}
                onChange={(e) => {
                  const [sb, sd] = String(e.target.value).split(':');
                  setSortBy(sb as any);
                  setSortDir((sd as 'asc' | 'desc') || 'asc');
                  setPage(1);
                }}
              >
                <MenuItem value="name:asc">Tên A → Z</MenuItem>
                <MenuItem value="name:desc">Tên Z → A</MenuItem>
                <MenuItem value="total_spent_cents:desc">Tổng chi tiêu ↓</MenuItem>
                <MenuItem value="total_spent_cents:asc">Tổng chi tiêu ↑</MenuItem>
                <MenuItem value="total_orders:desc">Số đơn ↓</MenuItem>
                <MenuItem value="total_orders:asc">Số đơn ↑</MenuItem>
                <MenuItem value="last_visit:desc">Lần mua gần nhất ↓</MenuItem>
                <MenuItem value="last_visit:asc">Lần mua gần nhất ↑</MenuItem>
              </Select>
            </FormControl>

            {/* View Mode Toggle */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Lưới">
                <IconButton
                  onClick={() => setViewMode('grid')}
                  sx={{
                    color: viewMode === 'grid' ? 'primary.main' : 'text.secondary',
                    backgroundColor: viewMode === 'grid' ? 'rgba(102, 126, 234, 0.1)' : 'transparent'
                  }}
                >
                  <ViewModule />
                </IconButton>
              </Tooltip>
              <Tooltip title="Danh sách">
                <IconButton
                  onClick={() => setViewMode('list')}
                  sx={{
                    color: viewMode === 'list' ? 'primary.main' : 'text.secondary',
                    backgroundColor: viewMode === 'list' ? 'rgba(102, 126, 234, 0.1)' : 'transparent'
                  }}
                >
                  <ViewList />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
              {selectedIds.size > 0 && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteSweepIcon />}
                  onClick={bulkDelete}
                  disabled={!(user?.role === 'admin' || user?.role === 'manager')}
                >
                  {T.selectedDelete(selectedIds.size)}
                </Button>
              )}
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setFormOpen(true)}
                aria-label="add-customer"
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                  }
                }}
              >
                {T.addCustomer}
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={exportCSV}
                aria-label="export-csv"
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                {T.exportCSV}
              </Button>
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadFileIcon />}
                aria-label="import-csv"
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                {T.importCSV}
                <input hidden type="file" accept=".csv" onChange={(e) => e.target.files && importCSV(e.target.files[0])} />
              </Button>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleRefresh}
                aria-label="refresh-list"
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    backgroundColor: 'rgba(102, 126, 234, 0.05)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
                  }
                }}
              >
                {T.refresh}
              </Button>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                aria-label="open-filters"
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderColor: 'success.main',
                  color: 'success.main',
                  '&:hover': {
                    borderColor: 'success.dark',
                    backgroundColor: 'rgba(76, 175, 80, 0.05)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)'
                  }
                }}
              >
                {T.filters}
              </Button>
            </Box>
          </Box>
          <Box sx={{ mt: 2 }}>
            <CustomerFilters
              value={filters}
              onChange={(next) => { setFilters(next); setPage(1); }}
              onReset={() => { setFilters({}); setPage(1); }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Customers Grid/List */}
      {isLoading ? (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
          gap: 3
        }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} sx={{ borderRadius: 3, p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 60, height: 60, borderRadius: '50%', bgcolor: 'action.hover' }} />
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ width: '60%', height: 16, bgcolor: 'action.hover', mb: 1, borderRadius: 1 }} />
                  <Box sx={{ width: '40%', height: 12, bgcolor: 'action.hover', borderRadius: 1 }} />
                </Box>
              </Box>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Box sx={{ flex: 1, height: 28, bgcolor: 'action.hover', borderRadius: 2 }} />
                <Box sx={{ flex: 1, height: 28, bgcolor: 'action.hover', borderRadius: 2 }} />
                <Box sx={{ flex: 1, height: 28, bgcolor: 'action.hover', borderRadius: 2 }} />
              </Box>
            </Card>
          ))}
        </Box>
      ) : viewMode === 'grid' ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {customers.map((customer: any) => (
            <Box key={customer.id}>
              <CustomerCard
                customer={customer}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                onCreateGHTKOrder={handleCreateGHTKOrder}
                viewMode="grid"
              />
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Checkbox checked={selectedIds.has(customer.id)} onChange={() => toggleSelect(customer.id)} inputProps={{ 'aria-label': 'select-customer' }} />
                <Typography variant="caption">Chọn</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <Box
          onScroll={handleListScroll}
          sx={{ maxHeight: '70vh', overflowY: 'auto', pr: 1 }}
          aria-label="customers-list-virtualized"
        >
          {(() => {
            const containerHeight = 70 * 16; // approx 70vh at 16px base
            const startIndex = Math.max(0, Math.floor(listScrollTop / listItemHeight) - listBuffer);
            const visibleCount = Math.ceil(containerHeight / listItemHeight) + listBuffer * 2;
            const endIndex = Math.min(customers.length, startIndex + visibleCount);
            const topSpacer = startIndex * listItemHeight;
            const bottomSpacer = Math.max(0, (customers.length - endIndex) * listItemHeight);
            const slice = customers.slice(startIndex, endIndex);
            return (
              <Box>
                <Box sx={{ height: topSpacer }} />
                {slice.map((customer: any) => (
                  <Box key={customer.id} sx={{ mb: 2 }}>
                    <CustomerCard
                      customer={customer}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onView={handleView}
                      onCreateGHTKOrder={handleCreateGHTKOrder}
                      viewMode="list"
                    />
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Checkbox checked={selectedIds.has(customer.id)} onChange={() => toggleSelect(customer.id)} inputProps={{ 'aria-label': 'select-customer' }} />
                      <Typography variant="caption">Chọn</Typography>
                    </Box>
                  </Box>
                ))}
                <Box sx={{ height: bottomSpacer }} />
                {customers.length === 0 && (
                  <Box sx={{ textAlign: 'center', color: 'text.secondary', py: 6 }}>
                    Không có khách hàng nào phù hợp.
                  </Box>
                )}
              </Box>
            );
          })()}
        </Box>
      )}

      {/* Pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <Pagination
          color="primary"
          page={page}
          count={Math.max(1, Math.ceil((totalItems || customers.length) / pageSize))}
          onChange={(_, p) => setPage(p)}
        />
      </Box>

      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress color="inherit" />
          <Typography variant="h6">Đang xử lý...</Typography>
        </Box>
      </Backdrop>

      {/* Customer Form Dialog */}
      <CustomerForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        customer={selectedCustomer}
      />

      {/* Details Drawer */}
      <CustomerDetailsDrawer
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        customer={selectedCustomerForView}
      />

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => setFormOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
            transform: 'scale(1.1)'
          }
        }}
      >
        <Add />
      </Fab>

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
    </Box>
  );
};

export default CustomersManagement;
