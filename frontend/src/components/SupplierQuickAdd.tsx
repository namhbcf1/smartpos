import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Add as AddIcon,
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../services/api';

interface Supplier {
  id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_number: string | null;
  notes: string | null;
  is_active: boolean;
  specializations?: string[];
  rating?: number;
}

interface SupplierQuickAddProps {
  open: boolean;
  onClose: () => void;
  onSupplierCreated: (supplier: Supplier) => void;
  prefilledData?: Partial<Supplier>;
}

interface SupplierFormData {
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  tax_number: string;
  notes: string;
  specializations: string[];
  is_active: boolean;
}

const SPECIALIZATIONS = [
  'CPU - Bộ vi xử lý',
  'GPU - Card đồ họa',
  'RAM - Bộ nhớ',
  'Motherboard - Bo mạch chủ',
  'Storage - Ổ cứng',
  'PSU - Nguồn máy tính',
  'Cooling - Tản nhiệt',
  'Case - Vỏ máy tính',
  'Monitor - Màn hình',
  'Keyboard - Bàn phím',
  'Mouse - Chuột',
  'Audio - Thiết bị âm thanh',
  'Network - Thiết bị mạng',
  'Accessories - Phụ kiện'
];

const SupplierQuickAdd: React.FC<SupplierQuickAddProps> = ({
  open,
  onClose,
  onSupplierCreated,
  prefilledData
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SupplierFormData>({
    name: prefilledData?.name || '',
    contact_person: prefilledData?.contact_person || '',
    phone: prefilledData?.phone || '',
    email: prefilledData?.email || '',
    address: prefilledData?.address || '',
    tax_number: prefilledData?.tax_number || '',
    notes: prefilledData?.notes || '',
    specializations: prefilledData?.specializations || [],
    is_active: prefilledData?.is_active ?? true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof SupplierFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên nhà cung cấp là bắt buộc';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    // Vietnamese tax number validation (basic)
    if (formData.tax_number && !/^\d{10}(-\d{3})?$/.test(formData.tax_number)) {
      newErrors.tax_number = 'Mã số thuế không hợp lệ (10 hoặc 13 chữ số)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await api.post<{ success: boolean; data: Supplier; message?: string }>('/suppliers', {
        ...formData,
        specializations: formData.specializations.join(',') // Convert array to comma-separated string
      });

      if (result.success) {
        enqueueSnackbar('Tạo nhà cung cấp thành công!', { variant: 'success' });
        onSupplierCreated(result.data);
        handleClose();
      } else {
        enqueueSnackbar(result.message || 'Có lỗi xảy ra khi tạo nhà cung cấp', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error creating supplier:', error);
      enqueueSnackbar('Có lỗi xảy ra khi tạo nhà cung cấp', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      tax_number: '',
      notes: '',
      specializations: [],
      is_active: true
    });
    setErrors({});
    onClose();
  };

  const handleSpecializationChange = (specialization: string) => {
    const newSpecializations = formData.specializations.includes(specialization)
      ? formData.specializations.filter(s => s !== specialization)
      : [...formData.specializations, specialization];
    
    handleInputChange('specializations', newSpecializations);
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        pb: 1
      }}>
        <BusinessIcon color="primary" />
        <Typography variant="h6" component="span">
          Thêm nhà cung cấp mới
        </Typography>
        <Chip 
          label="Nhanh" 
          color="success" 
          size="small" 
          sx={{ ml: 1 }}
        />
        <Box sx={{ flexGrow: 1 }} />
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Tạo nhanh nhà cung cấp mới để sử dụng ngay trong phiếu nhập kho. 
            Bạn có thể chỉnh sửa thông tin chi tiết sau.
          </Typography>
        </Alert>

        <Grid container spacing={2}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Thông tin cơ bản
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Tên nhà cung cấp *"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Người liên hệ"
              value={formData.contact_person}
              onChange={(e) => handleInputChange('contact_person', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Số điện thoại"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              error={!!errors.phone}
              helperText={errors.phone}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Địa chỉ"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              multiline
              rows={2}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                    <LocationIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Mã số thuế"
              value={formData.tax_number}
              onChange={(e) => handleInputChange('tax_number', e.target.value)}
              error={!!errors.tax_number}
              helperText={errors.tax_number || 'Ví dụ: 0123456789 hoặc 0123456789-001'}
              placeholder="0123456789"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={formData.is_active}
                label="Trạng thái"
                onChange={(e) => handleInputChange('is_active', e.target.value)}
              >
                <MenuItem value={true}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckIcon color="success" fontSize="small" />
                    Hoạt động
                  </Box>
                </MenuItem>
                <MenuItem value={false}>Tạm ngừng</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Specializations */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 2 }}>
              Chuyên môn (sản phẩm chính)
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {SPECIALIZATIONS.map((spec) => (
                <Chip
                  key={spec}
                  label={spec}
                  onClick={() => handleSpecializationChange(spec)}
                  color={formData.specializations.includes(spec) ? 'primary' : 'default'}
                  variant={formData.specializations.includes(spec) ? 'filled' : 'outlined'}
                  size="small"
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Ghi chú"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              multiline
              rows={2}
              placeholder="Ghi chú về nhà cung cấp..."
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !formData.name.trim()}
          startIcon={loading ? undefined : <AddIcon />}
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Đang tạo...' : 'Tạo nhà cung cấp'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SupplierQuickAdd;
