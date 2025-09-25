import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
  Divider
} from '@mui/material';

interface Customer {
  id?: number;
  full_name: string;
  email?: string;
  phone?: string;
  address?: string;
  customer_type?: 'individual' | 'business';
  company_name?: string;
  tax_number?: string;
  is_vip?: boolean;
  vip_level?: string;
  notes?: string;
  marketing_consent?: boolean;
}

interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (data: Customer) => void;
  loading?: boolean;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  customer,
  onSubmit,
  loading = false
}) => {
  const [formData, setFormData] = useState<Customer>({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    customer_type: 'individual',
    company_name: '',
    tax_number: '',
    is_vip: false,
    vip_level: '',
    notes: '',
    marketing_consent: false
  });

  useEffect(() => {
    if (customer) {
      setFormData(customer);
    }
  }, [customer]);

  const handleChange = (field: keyof Customer) => (event: any) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12} component="div">
          <Typography variant="h6" gutterBottom>
            Thông tin cơ bản
          </Typography>
        </Grid>

        <Grid item xs={12} md={6} component="div">
          <TextField
            fullWidth
            label="Họ và tên *"
            value={formData.full_name}
            onChange={handleChange('full_name')}
            required
          />
        </Grid>

        <Grid item xs={12} md={6} component="div">
          <TextField
            fullWidth
            label="Số điện thoại"
            value={formData.phone}
            onChange={handleChange('phone')}
          />
        </Grid>

        <Grid item xs={12} md={6} component="div">
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
          />
        </Grid>

        <Grid item xs={12} md={6} component="div">
          <FormControl fullWidth>
            <InputLabel>Loại khách hàng</InputLabel>
            <Select
              value={formData.customer_type}
              onChange={handleChange('customer_type')}
              label="Loại khách hàng"
            >
              <MenuItem value="individual">Cá nhân</MenuItem>
              <MenuItem value="business">Doanh nghiệp</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} component="div">
          <TextField
            fullWidth
            label="Địa chỉ"
            multiline
            rows={2}
            value={formData.address}
            onChange={handleChange('address')}
          />
        </Grid>

        {/* Business Information */}
        {formData.customer_type === 'business' && (
          <>
            <Grid item xs={12} component="div">
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Thông tin doanh nghiệp
              </Typography>
            </Grid>

            <Grid item xs={12} md={6} component="div">
              <TextField
                fullWidth
                label="Tên công ty"
                value={formData.company_name}
                onChange={handleChange('company_name')}
              />
            </Grid>

            <Grid item xs={12} md={6} component="div">
              <TextField
                fullWidth
                label="Mã số thuế"
                value={formData.tax_number}
                onChange={handleChange('tax_number')}
              />
            </Grid>
          </>
        )}

        {/* VIP Information */}
        <Grid item xs={12} component="div">
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>
            Thông tin VIP
          </Typography>
        </Grid>

        <Grid item xs={12} md={6} component="div">
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_vip}
                onChange={handleChange('is_vip')}
              />
            }
            label="Khách hàng VIP"
          />
        </Grid>

        {formData.is_vip && (
          <Grid item xs={12} md={6} component="div">
            <FormControl fullWidth>
              <InputLabel>Cấp độ VIP</InputLabel>
              <Select
                value={formData.vip_level}
                onChange={handleChange('vip_level')}
                label="Cấp độ VIP"
              >
                <MenuItem value="bronze">Bronze</MenuItem>
                <MenuItem value="silver">Silver</MenuItem>
                <MenuItem value="gold">Gold</MenuItem>
                <MenuItem value="platinum">Platinum</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}

        {/* Additional Information */}
        <Grid item xs={12} component="div">
          <TextField
            fullWidth
            label="Ghi chú"
            multiline
            rows={3}
            value={formData.notes}
            onChange={handleChange('notes')}
          />
        </Grid>

        <Grid item xs={12} component="div">
          <FormControlLabel
            control={
              <Switch
                checked={formData.marketing_consent}
                onChange={handleChange('marketing_consent')}
              />
            }
            label="Đồng ý nhận thông tin marketing"
          />
        </Grid>

        {/* Submit Buttons */}
        <Grid item xs={12} component="div">
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !formData.full_name.trim()}
              sx={{ minWidth: 120 }}
            >
              {loading ? 'Đang lưu...' : customer ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};
