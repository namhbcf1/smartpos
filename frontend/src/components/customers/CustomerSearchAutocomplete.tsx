import React, { useState, useEffect, useRef } from 'react';
import {
  Autocomplete,
  TextField,
  InputAdornment,
  CircularProgress,
  Box,
  Avatar,
  Typography,
  Chip
} from '@mui/material';
import { Search, Person, Phone, Email } from '@mui/icons-material';
import api from '../../services/api';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  customer_type?: string;
  total_spent_cents?: number;
  total_orders?: number;
}

interface CustomerSearchAutocompleteProps {
  onSelect?: (customer: Customer | null) => void;
  onSearch?: (term: string) => void;
  placeholder?: string;
  fullWidth?: boolean;
}

const CustomerSearchAutocomplete: React.FC<CustomerSearchAutocompleteProps> = ({
  onSelect,
  onSearch,
  placeholder = 'Tìm kiếm theo tên, email, số điện thoại...',
  fullWidth = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (searchTerm.length < 2) {
      setOptions([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const base = (import.meta as any).env?.VITE_API_BASE_URL || 'https://namhbcf-api.bangachieu2.workers.dev';
        const response = await fetch(`${base}/api/customers?search=${encodeURIComponent(searchTerm)}&limit=10`, {
          headers: {
            'X-Tenant-ID': 'default',
            Authorization: localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : ''
          }
        });

        if (response.ok) {
          const data = await response.json();
          setOptions(data.customers || data.data || []);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchTerm]);

  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCustomerTypeColor = (type: string = 'regular') => {
    switch (type) {
      case 'vip': return 'error';
      case 'premium': return 'warning';
      case 'regular': return 'success';
      default: return 'default';
    }
  };

  const getCustomerTypeLabel = (type: string = 'regular') => {
    switch (type) {
      case 'vip': return 'VIP';
      case 'premium': return 'Premium';
      case 'regular': return 'Thường';
      default: return 'Mới';
    }
  };

  return (
    <Autocomplete
      fullWidth={fullWidth}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={options}
      loading={loading}
      filterOptions={(x) => x} // Disable built-in filtering
      getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      inputValue={searchTerm}
      onInputChange={(_, value, reason) => {
        if (reason === 'input') {
          setSearchTerm(value);
          onSearch?.(value);
        }
      }}
      onChange={(_, value) => {
        onSelect?.(value);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'primary.main' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
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
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props} sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            {/* Avatar */}
            <Avatar
              sx={{
                bgcolor: option.customer_type === 'vip' ? 'error.main' :
                         option.customer_type === 'premium' ? 'warning.main' : 'success.main',
                width: 48,
                height: 48
              }}
            >
              <Person />
            </Avatar>

            {/* Customer Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="subtitle1" fontWeight="bold" noWrap>
                  {option.name}
                </Typography>
                <Chip
                  label={getCustomerTypeLabel(option.customer_type)}
                  color={getCustomerTypeColor(option.customer_type) as any}
                  size="small"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {option.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Phone sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {option.phone}
                    </Typography>
                  </Box>
                )}
                {option.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Email sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {option.email}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Stats */}
              <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                <Typography variant="caption" color="success.main" fontWeight="600">
                  {option.total_orders || 0} đơn
                </Typography>
                <Typography variant="caption" color="primary.main" fontWeight="600">
                  {formatCurrency(option.total_spent_cents || 0)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
      noOptionsText={
        searchTerm.length < 2 ?
          "Nhập ít nhất 2 ký tự để tìm kiếm..." :
          "Không tìm thấy khách hàng nào"
      }
      loadingText="Đang tìm kiếm..."
    />
  );
};

export default CustomerSearchAutocomplete;
