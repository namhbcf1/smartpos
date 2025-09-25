import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Alert,
  Autocomplete,
  Chip,
  Divider,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import {
  Security as WarrantyIcon,
  Search as SearchIcon,
  QrCodeScanner as ScanIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../../services/api';

interface SerialNumber {
  id: number;
  serial_number: string;
  product_id: number;
  status: string;
  product?: {
    id: number;
    name: string;
    sku: string;
    category_name?: string;
  };
  customer?: {
    id: number;
    full_name: string;
    phone?: string;
    email?: string;
  };
}

interface WarrantyRegistrationFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  serialNumberId?: number;
}

const WarrantyRegistrationForm: React.FC<WarrantyRegistrationFormProps> = ({
  open,
  onClose,
  onSuccess,
  serialNumberId,
}) => {
  const { enqueueSnackbar } = useSnackbar();

  // Form state
  const [formData, setFormData] = useState({
    serial_number_id: serialNumberId || 0,
    warranty_type: 'manufacturer' as 'manufacturer' | 'store' | 'extended' | 'premium',
    warranty_period_months: 12,
    terms_accepted: false,
    contact_phone: '',
    contact_email: '',
    contact_address: '',
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>([]);
  const [selectedSerial, setSelectedSerial] = useState<SerialNumber | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Load serial numbers for search
  useEffect(() => {
    if (searchTerm.length >= 3) {
      searchSerialNumbers();
    }
  }, [searchTerm]);

  // Load specific serial number if provided
  useEffect(() => {
    if (serialNumberId && open) {
      loadSerialNumber(serialNumberId);
    }
  }, [serialNumberId, open]);

  const searchSerialNumbers = async () => {
    try {
      setSearchLoading(true);
      const response = await api.get(`/serial-numbers?search=${searchTerm}&status=sold&limit=10`);
      if (response.data.success) {
        setSerialNumbers(response.data.data);
      }
    } catch (error) {
      console.error('Error searching serial numbers:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const loadSerialNumber = async (id: number) => {
    try {
      setLoading(true);
      const response = await api.get(`/serial-numbers/${id}`);
      if (response.data.success) {
        const serial = response.data.data;
        setSelectedSerial(serial);
        setFormData(prev => ({
          ...prev,
          serial_number_id: serial.id,
          contact_phone: serial.customer?.phone || '',
          contact_email: serial.customer?.email || '',
        }));
      }
    } catch (error) {
      console.error('Error loading serial number:', error);
      setError('Không thể tải thông tin serial number');
    } finally {
      setLoading(false);
    }
  };

  const handleSerialSelect = (serial: SerialNumber | null) => {
    setSelectedSerial(serial);
    if (serial) {
      setFormData(prev => ({
        ...prev,
        serial_number_id: serial.id,
        contact_phone: serial.customer?.phone || '',
        contact_email: serial.customer?.email || '',
      }));
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!selectedSerial) {
      setError('Vui lòng chọn serial number');
      return false;
    }
    if (!formData.terms_accepted) {
      setError('Vui lòng chấp nhận điều khoản bảo hành');
      return false;
    }
    if (formData.warranty_period_months < 1 || formData.warranty_period_months > 120) {
      setError('Thời hạn bảo hành phải từ 1 đến 120 tháng');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/warranty/registrations', formData);
      
      if (response.data.success) {
        enqueueSnackbar('Đăng ký bảo hành thành công!', { variant: 'success' });
        onSuccess();
        handleClose();
      } else {
        setError(response.data.message || 'Có lỗi xảy ra khi đăng ký bảo hành');
      }
    } catch (error: any) {
      console.error('Error registering warranty:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi đăng ký bảo hành');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      serial_number_id: 0,
      warranty_type: 'manufacturer',
      warranty_period_months: 12,
      terms_accepted: false,
      contact_phone: '',
      contact_email: '',
      contact_address: '',
    });
    setSelectedSerial(null);
    setSearchTerm('');
    setError(null);
    onClose();
  };

  const getWarrantyTypeLabel = (type: string) => {
    switch (type) {
      case 'manufacturer': return 'Bảo hành nhà sản xuất';
      case 'store': return 'Bảo hành cửa hàng';
      case 'extended': return 'Bảo hành mở rộng';
      case 'premium': return 'Bảo hành cao cấp';
      default: return type;
    }
  };

  const getWarrantyTypeDescription = (type: string) => {
    switch (type) {
      case 'manufacturer': return 'Bảo hành theo chính sách của nhà sản xuất';
      case 'store': return 'Bảo hành do cửa hàng cung cấp';
      case 'extended': return 'Bảo hành mở rộng thời gian';
      case 'premium': return 'Bảo hành cao cấp với dịch vụ ưu tiên';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarrantyIcon color="primary" />
          Đăng ký bảo hành mới
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Serial Number Selection */}
          <Grid item xs={12} component="div">
            <Typography variant="h6" gutterBottom>
              1. Chọn Serial Number
            </Typography>
            <Autocomplete
              options={serialNumbers}
              value={selectedSerial}
              onChange={(_, value) => handleSerialSelect(value)}
              inputValue={searchTerm}
              onInputChange={(_, value) => setSearchTerm(value)}
              getOptionLabel={(option) => `${option.serial_number} - ${option.product?.name || 'N/A'}`}
              loading={searchLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tìm kiếm Serial Number"
                  placeholder="Nhập serial number hoặc tên sản phẩm..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="subtitle2">
                      {option.serial_number}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {option.product?.name} - SKU: {option.product?.sku}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Khách hàng: {option.customer?.full_name || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              )}
              noOptionsText="Không tìm thấy serial number nào"
            />
          </Grid>

          {/* Selected Serial Info */}
          {selectedSerial && (
            <Grid item xs={12} component="div">
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckIcon color="success" />
                    Thông tin sản phẩm
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} component="div">
                      <Typography variant="body2" color="text.secondary">Serial Number:</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedSerial.serial_number}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} component="div">
                      <Typography variant="body2" color="text.secondary">Sản phẩm:</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedSerial.product?.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} component="div">
                      <Typography variant="body2" color="text.secondary">SKU:</Typography>
                      <Typography variant="body1">
                        {selectedSerial.product?.sku}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} component="div">
                      <Typography variant="body2" color="text.secondary">Khách hàng:</Typography>
                      <Typography variant="body1">
                        {selectedSerial.customer?.full_name || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          <Grid item xs={12} component="div">
            <Divider />
          </Grid>

          {/* Warranty Details */}
          <Grid item xs={12} component="div">
            <Typography variant="h6" gutterBottom>
              2. Thông tin bảo hành
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} component="div">
            <FormControl fullWidth>
              <InputLabel>Loại bảo hành</InputLabel>
              <Select
                value={formData.warranty_type}
                label="Loại bảo hành"
                onChange={(e) => handleInputChange('warranty_type', e.target.value)}
              >
                <MenuItem value="manufacturer">Nhà sản xuất</MenuItem>
                <MenuItem value="store">Cửa hàng</MenuItem>
                <MenuItem value="extended">Mở rộng</MenuItem>
                <MenuItem value="premium">Cao cấp</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {getWarrantyTypeDescription(formData.warranty_type)}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} component="div">
            <TextField
              fullWidth
              label="Thời hạn bảo hành (tháng)"
              type="number"
              value={formData.warranty_period_months}
              onChange={(e) => handleInputChange('warranty_period_months', parseInt(e.target.value) || 0)}
              inputProps={{ min: 1, max: 120 }}
              helperText="Từ 1 đến 120 tháng"
            />
          </Grid>

          <Grid item xs={12} component="div">
            <Divider />
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12} component="div">
            <Typography variant="h6" gutterBottom>
              3. Thông tin liên hệ
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} component="div">
            <TextField
              fullWidth
              label="Số điện thoại"
              value={formData.contact_phone}
              onChange={(e) => handleInputChange('contact_phone', e.target.value)}
              placeholder="Số điện thoại liên hệ"
            />
          </Grid>

          <Grid item xs={12} sm={6} component="div">
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => handleInputChange('contact_email', e.target.value)}
              placeholder="Email liên hệ"
            />
          </Grid>

          <Grid item xs={12} component="div">
            <TextField
              fullWidth
              label="Địa chỉ"
              multiline
              rows={3}
              value={formData.contact_address}
              onChange={(e) => handleInputChange('contact_address', e.target.value)}
              placeholder="Địa chỉ liên hệ"
            />
          </Grid>

          {/* Terms and Conditions */}
          <Grid item xs={12} component="div">
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.terms_accepted}
                  onChange={(e) => handleInputChange('terms_accepted', e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">
                  Tôi đồng ý với{' '}
                  <Typography component="span" color="primary" sx={{ cursor: 'pointer', textDecoration: 'underline' }}>
                    điều khoản và điều kiện bảo hành
                  </Typography>
                </Typography>
              }
            />
          </Grid>

          {/* Warranty Summary */}
          {selectedSerial && formData.terms_accepted && (
            <Grid item xs={12} component="div">
              <Alert severity="info" icon={<WarrantyIcon />}>
                <Typography variant="subtitle2" gutterBottom>
                  Tóm tắt bảo hành
                </Typography>
                <Typography variant="body2">
                  • Sản phẩm: {selectedSerial.product?.name}<br />
                  • Loại bảo hành: {getWarrantyTypeLabel(formData.warranty_type)}<br />
                  • Thời hạn: {formData.warranty_period_months} tháng<br />
                  • Bắt đầu: {new Date().toLocaleDateString('vi-VN')}<br />
                  • Kết thúc: {new Date(Date.now() + formData.warranty_period_months * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN')}
                </Typography>
              </Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !selectedSerial || !formData.terms_accepted}
          startIcon={<WarrantyIcon />}
        >
          {loading ? 'Đang xử lý...' : 'Đăng ký bảo hành'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WarrantyRegistrationForm;
