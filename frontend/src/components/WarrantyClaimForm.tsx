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
  Typography,
  Box,
  Alert,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  Autocomplete,
} from '@mui/material';
import {
  Assignment as ClaimIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Build as RepairIcon,
  SwapHoriz as ReplaceIcon,
  MonetizationOn as RefundIcon,
  Search as DiagnosticIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../services/api';

interface WarrantyRegistration {
  id: number;
  warranty_number: string;
  serial_number_id: number;
  product_id: number;
  customer_id: number;
  warranty_type: string;
  warranty_period_months: number;
  warranty_start_date: string;
  warranty_end_date: string;
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
  serial_number?: {
    serial_number: string;
  };
}

interface Employee {
  id: number;
  full_name: string;
  username: string;
  role: string;
}

interface WarrantyClaimFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  warrantyRegistration?: WarrantyRegistration;
}

const WarrantyClaimForm: React.FC<WarrantyClaimFormProps> = ({
  open,
  onClose,
  onSuccess,
  warrantyRegistration,
}) => {
  const { enqueueSnackbar } = useSnackbar();

  // Form state
  const [formData, setFormData] = useState({
    warranty_registration_id: warrantyRegistration?.id || 0,
    claim_type: 'repair' as 'repair' | 'replacement' | 'refund' | 'diagnostic',
    issue_description: '',
    estimated_cost: 0,
    technician_id: 0,
    service_provider: '',
    external_reference: '',
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warranties, setWarranties] = useState<WarrantyRegistration[]>([]);
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyRegistration | null>(warrantyRegistration || null);
  const [technicians, setTechnicians] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Load data
  useEffect(() => {
    if (open) {
      loadTechnicians();
      if (!warrantyRegistration) {
        searchWarranties();
      }
    }
  }, [open, warrantyRegistration]);

  useEffect(() => {
    if (searchTerm.length >= 3 && !warrantyRegistration) {
      searchWarranties();
    }
  }, [searchTerm, warrantyRegistration]);

  useEffect(() => {
    if (selectedWarranty) {
      setFormData(prev => ({
        ...prev,
        warranty_registration_id: selectedWarranty.id,
      }));
    }
  }, [selectedWarranty]);

  const loadTechnicians = async () => {
    try {
      const response = await api.get('/employees?role=technician');
      if (response.data.success) {
        setTechnicians(response.data.data);
      }
    } catch (error) {
      console.error('Error loading technicians:', error);
    }
  };

  const searchWarranties = async () => {
    try {
      const params = new URLSearchParams({
        status: 'active',
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
      });
      
      const response = await api.get(`/warranty/registrations?${params}`);
      if (response.data.success) {
        setWarranties(response.data.data);
      }
    } catch (error) {
      console.error('Error searching warranties:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!selectedWarranty) {
      setError('Vui lòng chọn bảo hành');
      return false;
    }
    if (!formData.issue_description.trim() || formData.issue_description.length < 10) {
      setError('Mô tả vấn đề phải có ít nhất 10 ký tự');
      return false;
    }
    if (formData.estimated_cost < 0) {
      setError('Chi phí ước tính không được âm');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/warranty/claims', formData);
      
      if (response.data.success) {
        enqueueSnackbar('Tạo khiếu nại bảo hành thành công!', { variant: 'success' });
        onSuccess();
        handleClose();
      } else {
        setError(response.data.message || 'Có lỗi xảy ra khi tạo khiếu nại');
      }
    } catch (error: any) {
      console.error('Error creating warranty claim:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi tạo khiếu nại');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      warranty_registration_id: 0,
      claim_type: 'repair',
      issue_description: '',
      estimated_cost: 0,
      technician_id: 0,
      service_provider: '',
      external_reference: '',
    });
    setSelectedWarranty(warrantyRegistration || null);
    setSearchTerm('');
    setError(null);
    onClose();
  };

  const getClaimTypeIcon = (type: string) => {
    switch (type) {
      case 'repair': return <RepairIcon />;
      case 'replacement': return <ReplaceIcon />;
      case 'refund': return <RefundIcon />;
      case 'diagnostic': return <DiagnosticIcon />;
      default: return <ClaimIcon />;
    }
  };

  const getClaimTypeLabel = (type: string) => {
    switch (type) {
      case 'repair': return 'Sửa chữa';
      case 'replacement': return 'Thay thế';
      case 'refund': return 'Hoàn tiền';
      case 'diagnostic': return 'Chẩn đoán';
      default: return type;
    }
  };

  const getClaimTypeDescription = (type: string) => {
    switch (type) {
      case 'repair': return 'Sửa chữa sản phẩm lỗi';
      case 'replacement': return 'Thay thế sản phẩm mới';
      case 'refund': return 'Hoàn lại tiền cho khách hàng';
      case 'diagnostic': return 'Chẩn đoán và kiểm tra sản phẩm';
      default: return '';
    }
  };

  const isWarrantyExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ClaimIcon color="warning" />
          Tạo khiếu nại bảo hành
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
          {/* Warranty Selection */}
          {!warrantyRegistration && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                1. Chọn bảo hành
              </Typography>
              <Autocomplete
                options={warranties}
                value={selectedWarranty}
                onChange={(_, value) => setSelectedWarranty(value)}
                inputValue={searchTerm}
                onInputChange={(_, value) => setSearchTerm(value)}
                getOptionLabel={(option) => `${option.warranty_number} - ${option.product?.name || 'N/A'}`}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tìm kiếm bảo hành"
                    placeholder="Nhập mã bảo hành hoặc tên sản phẩm..."
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="subtitle2">
                        {option.warranty_number}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.product?.name} - {option.serial_number?.serial_number}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Chip
                          label={option.status}
                          size="small"
                          color={option.status === 'active' ? 'success' : 'default'}
                        />
                        {isWarrantyExpired(option.warranty_end_date) && (
                          <Chip label="Hết hạn" size="small" color="error" />
                        )}
                      </Box>
                    </Box>
                  </Box>
                )}
                noOptionsText="Không tìm thấy bảo hành nào"
              />
            </Grid>
          )}

          {/* Selected Warranty Info */}
          {selectedWarranty && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InfoIcon color="info" />
                    Thông tin bảo hành
                  </Typography>
                  
                  {isWarrantyExpired(selectedWarranty.warranty_end_date) && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <strong>Cảnh báo:</strong> Bảo hành này đã hết hạn vào {formatDate(selectedWarranty.warranty_end_date)}
                      </Typography>
                    </Alert>
                  )}

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Mã bảo hành:</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedWarranty.warranty_number}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Sản phẩm:</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedWarranty.product?.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Serial Number:</Typography>
                      <Typography variant="body1">
                        {selectedWarranty.serial_number?.serial_number}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Khách hàng:</Typography>
                      <Typography variant="body1">
                        {selectedWarranty.customer?.full_name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Thời hạn bảo hành:</Typography>
                      <Typography variant="body1">
                        {formatDate(selectedWarranty.warranty_start_date)} - {formatDate(selectedWarranty.warranty_end_date)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Trạng thái:</Typography>
                      <Chip
                        label={selectedWarranty.status}
                        size="small"
                        color={selectedWarranty.status === 'active' ? 'success' : 'default'}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Claim Details */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              2. Thông tin khiếu nại
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Loại khiếu nại</InputLabel>
              <Select
                value={formData.claim_type}
                label="Loại khiếu nại"
                onChange={(e) => handleInputChange('claim_type', e.target.value)}
              >
                <MenuItem value="repair">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RepairIcon />
                    Sửa chữa
                  </Box>
                </MenuItem>
                <MenuItem value="replacement">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReplaceIcon />
                    Thay thế
                  </Box>
                </MenuItem>
                <MenuItem value="refund">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RefundIcon />
                    Hoàn tiền
                  </Box>
                </MenuItem>
                <MenuItem value="diagnostic">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DiagnosticIcon />
                    Chẩn đoán
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {getClaimTypeDescription(formData.claim_type)}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Chi phí ước tính"
              type="number"
              value={formData.estimated_cost}
              onChange={(e) => handleInputChange('estimated_cost', parseFloat(e.target.value) || 0)}
              inputProps={{ min: 0, step: 1000 }}
              helperText={formData.estimated_cost > 0 ? formatCurrency(formData.estimated_cost) : 'Nhập 0 nếu chưa ước tính'}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Mô tả vấn đề"
              multiline
              rows={4}
              value={formData.issue_description}
              onChange={(e) => handleInputChange('issue_description', e.target.value)}
              placeholder="Mô tả chi tiết vấn đề gặp phải với sản phẩm..."
              helperText={`${formData.issue_description.length}/2000 ký tự (tối thiểu 10 ký tự)`}
              inputProps={{ maxLength: 2000 }}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Kỹ thuật viên phụ trách</InputLabel>
              <Select
                value={formData.technician_id}
                label="Kỹ thuật viên phụ trách"
                onChange={(e) => handleInputChange('technician_id', e.target.value)}
              >
                <MenuItem value={0}>Chưa chỉ định</MenuItem>
                {technicians.map((tech) => (
                  <MenuItem key={tech.id} value={tech.id}>
                    {tech.full_name} ({tech.username})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nhà cung cấp dịch vụ"
              value={formData.service_provider}
              onChange={(e) => handleInputChange('service_provider', e.target.value)}
              placeholder="Tên nhà cung cấp dịch vụ sửa chữa (nếu có)"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Mã tham chiếu ngoài"
              value={formData.external_reference}
              onChange={(e) => handleInputChange('external_reference', e.target.value)}
              placeholder="Mã tham chiếu từ hệ thống bên ngoài (nếu có)"
            />
          </Grid>

          {/* Claim Summary */}
          {selectedWarranty && formData.issue_description.length >= 10 && (
            <Grid item xs={12}>
              <Alert severity="info" icon={getClaimTypeIcon(formData.claim_type)}>
                <Typography variant="subtitle2" gutterBottom>
                  Tóm tắt khiếu nại
                </Typography>
                <Typography variant="body2">
                  • Loại: {getClaimTypeLabel(formData.claim_type)}<br />
                  • Sản phẩm: {selectedWarranty.product?.name}<br />
                  • Chi phí ước tính: {formatCurrency(formData.estimated_cost)}<br />
                  • Ngày tạo: {new Date().toLocaleDateString('vi-VN')}
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
          disabled={loading || !selectedWarranty || formData.issue_description.length < 10}
          startIcon={<ClaimIcon />}
          color="warning"
        >
          {loading ? 'Đang xử lý...' : 'Tạo khiếu nại'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WarrantyClaimForm;
