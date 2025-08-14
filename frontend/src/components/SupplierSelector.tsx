import React, { useState, useEffect, useMemo } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  Chip,
  Avatar,
  InputAdornment,
  IconButton,
  Paper,
  Rating,
  Tooltip,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Business as BusinessIcon,
  Add as AddIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Star as StarIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  LocalShipping as ShippingIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import { debounce } from 'lodash';
import SupplierQuickAdd from './SupplierQuickAdd';
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
  performance?: {
    total_orders: number;
    avg_delivery_days: number;
    on_time_delivery_rate: number;
    quality_rating: number;
    last_order_date: string;
  };
}

interface SupplierSelectorProps {
  value: Supplier | null;
  onChange: (supplier: Supplier | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  showQuickAdd?: boolean;
  showPerformance?: boolean;
}

const SupplierSelector: React.FC<SupplierSelectorProps> = ({
  value,
  onChange,
  label = 'Chọn nhà cung cấp',
  placeholder = 'Tìm kiếm nhà cung cấp...',
  disabled = false,
  error = false,
  helperText,
  showQuickAdd = true,
  showPerformance = true
}) => {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [recentSuppliers, setRecentSuppliers] = useState<Supplier[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce(async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        // Show recent suppliers when no search term
        setOptions(recentSuppliers);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get<{
          success: boolean;
          data: {
            data: Supplier[];
            pagination: any;
          }
        }>(`/suppliers?search=${encodeURIComponent(searchTerm)}&limit=20&is_active=true`);
        if (response.success && response.data?.data) {
          setOptions(response.data.data);
        } else {
          setOptions([]);
        }
      } catch (error) {
        console.error('Error searching suppliers:', error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [recentSuppliers]
  );

  useEffect(() => {
    debouncedSearch(inputValue);
    return () => {
      debouncedSearch.cancel();
    };
  }, [inputValue, debouncedSearch]);

  // Load recent suppliers on mount
  useEffect(() => {
    const loadRecentSuppliers = async () => {
      try {
        const response = await api.get<{
          success: boolean;
          data: {
            data: Supplier[];
            pagination: any;
          }
        }>('/suppliers?limit=5&sort_by=last_used&is_active=true');
        if (response.success && response.data?.data) {
          setRecentSuppliers(response.data.data);
          if (!inputValue) {
            setOptions(response.data.data);
          }
        } else {
          setRecentSuppliers([]);
          if (!inputValue) {
            setOptions([]);
          }
        }
      } catch (error) {
        console.error('Error loading recent suppliers:', error);
      }
    };

    loadRecentSuppliers();
  }, []);

  const handleSupplierCreated = (newSupplier: Supplier) => {
    setOptions(prev => [newSupplier, ...prev]);
    onChange(newSupplier);
    setQuickAddOpen(false);
  };

  const handleContactAction = (action: 'phone' | 'email', supplier: Supplier) => {
    if (action === 'phone' && supplier.phone) {
      window.open(`tel:${supplier.phone}`);
    } else if (action === 'email' && supplier.email) {
      window.open(`mailto:${supplier.email}`);
    }
    setAnchorEl(null);
  };

  const getPerformanceColor = (rating: number) => {
    if (rating >= 4.5) return 'success';
    if (rating >= 3.5) return 'warning';
    return 'error';
  };

  const formatDeliveryTime = (days: number) => {
    if (days < 1) return 'Trong ngày';
    if (days === 1) return '1 ngày';
    return `${Math.round(days)} ngày`;
  };

  return (
    <>
      <Autocomplete
        value={value}
        onChange={(_, newValue) => onChange(newValue)}
        inputValue={inputValue}
        onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
        options={options}
        loading={loading}
        disabled={disabled}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            error={error}
            helperText={helperText}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <BusinessIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {params.InputProps.endAdornment}
                  {showQuickAdd && (
                    <Tooltip title="Thêm nhà cung cấp mới">
                      <IconButton
                        size="small"
                        onClick={() => setQuickAddOpen(true)}
                        disabled={disabled}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              )
            }}
          />
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props} sx={{ display: 'block !important', p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                <BusinessIcon />
              </Avatar>
              
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="subtitle2" noWrap>
                    {option.name}
                  </Typography>
                  {option.rating && showPerformance && (
                    <Rating
                      value={option.rating}
                      readOnly
                      size="small"
                      precision={0.1}
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  {option.contact_person && (
                    <Typography variant="caption" color="text.secondary">
                      {option.contact_person}
                    </Typography>
                  )}
                  {option.phone && (
                    <Chip
                      icon={<PhoneIcon />}
                      label={option.phone}
                      size="small"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>

                {/* Specializations */}
                {option.specializations && option.specializations.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    {option.specializations.slice(0, 3).map((spec) => (
                      <Chip
                        key={spec}
                        label={spec}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ height: 18, fontSize: '0.65rem' }}
                      />
                    ))}
                    {option.specializations.length > 3 && (
                      <Chip
                        label={`+${option.specializations.length - 3}`}
                        size="small"
                        variant="outlined"
                        sx={{ height: 18, fontSize: '0.65rem' }}
                      />
                    )}
                  </Box>
                )}

                {/* Performance Metrics */}
                {option.performance && showPerformance && (
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <Tooltip title="Số đơn hàng">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <HistoryIcon sx={{ fontSize: 14 }} color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {option.performance.total_orders} đơn
                        </Typography>
                      </Box>
                    </Tooltip>
                    
                    <Tooltip title="Thời gian giao hàng trung bình">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ShippingIcon sx={{ fontSize: 14 }} color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {formatDeliveryTime(option.performance.avg_delivery_days)}
                        </Typography>
                      </Box>
                    </Tooltip>

                    <Tooltip title="Tỷ lệ giao đúng hạn">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ScheduleIcon sx={{ fontSize: 14 }} color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {Math.round(option.performance.on_time_delivery_rate)}%
                        </Typography>
                      </Box>
                    </Tooltip>
                  </Box>
                )}
              </Box>

              {/* Quick Actions */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAnchorEl(e.currentTarget);
                  }}
                >
                  <MoreIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Box>
        )}
        PaperComponent={(props) => (
          <Paper {...props} sx={{ mt: 1, boxShadow: 3 }}>
            {!inputValue && recentSuppliers.length > 0 && (
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <HistoryIcon sx={{ fontSize: 14 }} />
                  Nhà cung cấp gần đây
                </Typography>
              </Box>
            )}
            {props.children}
          </Paper>
        )}
        noOptionsText={
          inputValue ? 'Không tìm thấy nhà cung cấp nào' : 'Nhập tên để tìm kiếm'
        }
        loadingText="Đang tìm kiếm..."
      />

      {/* Quick Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {value?.phone && (
          <MenuItem onClick={() => handleContactAction('phone', value)}>
            <ListItemIcon>
              <PhoneIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Gọi điện" secondary={value.phone} />
          </MenuItem>
        )}
        {value?.email && (
          <MenuItem onClick={() => handleContactAction('email', value)}>
            <ListItemIcon>
              <EmailIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Gửi email" secondary={value.email} />
          </MenuItem>
        )}
        {value?.phone || value?.email ? <Divider /> : null}
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon>
            <TrendingUpIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Xem hiệu suất" />
        </MenuItem>
      </Menu>

      {/* Quick Add Dialog */}
      <SupplierQuickAdd
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSupplierCreated={handleSupplierCreated}
      />
    </>
  );
};

export default SupplierSelector;
