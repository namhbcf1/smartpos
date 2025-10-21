import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Avatar,
  Tooltip,
  LinearProgress,
  Switch,
  FormControlLabel,
  Skeleton,
  Paper,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Fab,
  Backdrop,
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Stack,
  Divider,
  Badge,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search,
  Add,
  Refresh,
  Visibility,
  Edit,
  Delete,
  Business,
  FilterList,
  Image,
  TrendingUp,
  Star,
  Favorite,
  FavoriteBorder,
  Share,
  Download,
  Analytics,
  Security,
  Compare,
  ViewList,
  GridView,
  ViewComfy,
  SearchOff,
  Clear,
  CheckCircle,
  Warning,
  Error,
  Phone,
  Email,
  LocationOn,
  AccountBalance,
  CreditCard,
  AttachMoney,
  TrendingDown,
  Speed,
  FlashOn,
  Dashboard,
  Inventory,
  Assessment,
  Timeline,
  Insights,
  Person,
  Group,
  Store,
  LocalShipping,
  Receipt,
  Assignment,
  Description,
  Payment,
  MonetizationOn,
  PointOfSale,
  QrCode,
  QrCodeScanner,
  Print,
  Archive,
  Restore,
  DeleteForever,
  EditNote,
  AddBusiness,
  BusinessCenter,
  Domain,
  CorporateFare,
  Apartment,
  HomeWork,
  Storefront,
  ShoppingCart,
  Inventory2,
  Category,
  Label,
  Tag,
  LocalOffer,
  Percent,
  Discount,
  Loyalty,
  CardGiftcard,
  Redeem,
  ConfirmationNumber,
  LocalActivity,
  Event,
  Schedule,
  CalendarToday,
  AccessTime,
  Timer,
  HourglassEmpty,
  HourglassFull,
  CheckCircleOutline,
  Cancel,
  Pending,
  Sync,
  SyncAlt,
  Autorenew,
  Cached,
  Update,
  GetApp,
  Publish,
  CloudUpload,
  CloudDownload,
  CloudSync,
  CloudDone,
  CloudOff,
  CloudQueue,
  Cloud,
  Wifi,
  WifiOff,
  SignalWifi4Bar,
  SignalWifiOff,
  SignalWifi0Bar,
  SignalWifi1Bar,
  SignalWifi2Bar,
  SignalWifi3Bar,
  SignalCellular4Bar,
  SignalCellularOff,
  SignalCellular0Bar,
  SignalCellular1Bar,
  SignalCellular2Bar,
  SignalCellular3Bar,
  BatteryFull,
  BatteryStd,
  BatteryUnknown,
  BatteryAlert,
  BatteryLow,
  BatteryChargingFull,
  BatteryCharging20,
  BatteryCharging30,
  BatteryCharging50,
  BatteryCharging60,
  BatteryCharging80,
  BatteryCharging90,
  Power,
  PowerOff,
  PowerSettingsNew,
  Settings,
  SettingsApplications,
  SettingsBackupRestore,
  SettingsBluetooth,
  SettingsBrightness,
  SettingsCell,
  SettingsEthernet,
  SettingsInputAntenna,
  SettingsInputComponent,
  SettingsInputComposite,
  SettingsInputHdmi,
  SettingsInputSvideo,
  SettingsOverscan,
  SettingsPhone,
  SettingsRemote,
  SettingsVoice,
  SettingsSystemDaydream,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersAPI } from '../../services/suppliersApi';

// Supplier Form Component
interface SupplierFormProps {
  open: boolean;
  onClose: () => void;
  supplier?: any;
}

const SupplierForm: React.FC<SupplierFormProps> = ({ open, onClose, supplier }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    tax_number: '',
    payment_terms: '',
    credit_limit_cents: 0,
    is_active: 1,
  });

  // Reset form when supplier changes or dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: supplier?.name || '',
        contact_person: supplier?.contact_person || '',
        email: supplier?.email || '',
        phone: supplier?.phone || '',
        address: supplier?.address || '',
        tax_number: supplier?.tax_number || '',
        payment_terms: supplier?.payment_terms || '',
        credit_limit_cents: supplier?.credit_limit_cents || 0,
        is_active: supplier?.is_active !== undefined ? supplier.is_active : 1,
      });
    }
  }, [open, supplier]);

  // Display value in VND (converted from cents)
  const creditLimitVND = formData.credit_limit_cents / 100;

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => suppliersAPI.createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => suppliersAPI.updateSupplier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (supplier) {
      updateMutation.mutate({ id: supplier.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (field: string) => (e: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
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
            {supplier ? 'Chỉnh sửa thông tin nhà cung cấp' : 'Tạo nhà cung cấp mới'}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {supplier ? 'Cập nhật thông tin nhà cung cấp' : 'Điền thông tin chi tiết để tạo nhà cung cấp mới'}
          </Typography>
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 4 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
            {/* Tên nhà cung cấp */}
            <Box>
              <TextField
                fullWidth
                label="Tên nhà cung cấp"
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
                      <Business sx={{ color: 'primary.main' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Người liên hệ */}
            <Box>
              <TextField
                fullWidth
                label="Người liên hệ"
                value={formData.contact_person}
                onChange={handleChange('contact_person')}
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
                      <Person sx={{ color: 'success.main' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Email */}
            <Box>
              <TextField
                fullWidth
                label="Email"
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
                label="Số điện thoại"
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

            {/* Mã số thuế */}
            <Box>
              <TextField
                fullWidth
                label="Mã số thuế"
                value={formData.tax_number}
                onChange={handleChange('tax_number')}
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
                      <AccountBalance sx={{ color: 'secondary.main' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Điều khoản thanh toán */}
            <Box>
              <TextField
                fullWidth
                label="Điều khoản thanh toán"
                value={formData.payment_terms}
                onChange={handleChange('payment_terms')}
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
                      <Payment sx={{ color: 'success.main' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Hạn mức tín dụng */}
            <Box>
              <TextField
                fullWidth
                label="Hạn mức tín dụng (VNĐ)"
                type="number"
                value={creditLimitVND}
                onChange={(e) => {
                  const vndValue = parseFloat(e.target.value) || 0;
                  setFormData(prev => ({
                    ...prev,
                    credit_limit_cents: Math.round(vndValue * 100)
                  }));
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney sx={{ color: 'warning.main' }} />
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
                      Đang hoạt động
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

            {/* Địa chỉ */}
            <Box sx={{ gridColumn: '1 / -1' }}>
              <TextField
                fullWidth
                label="Địa chỉ"
                multiline
                rows={4}
                value={formData.address}
                onChange={handleChange('address')}
                placeholder="Nhập địa chỉ chi tiết của nhà cung cấp..."
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
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                      <LocationOn sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>
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
            Hủy
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createMutation.isPending || updateMutation.isPending}
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
              },
              '&:disabled': {
                background: 'rgba(0,0,0,0.12)',
                color: 'rgba(0,0,0,0.26)'
              }
            }}
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} color="inherit" />
                <Typography variant="body2">
                  {supplier ? 'Đang cập nhật...' : 'Đang tạo...'}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {supplier ? <Edit /> : <Add />}
                <Typography variant="body2">
                  {supplier ? 'Cập nhật nhà cung cấp' : 'Tạo nhà cung cấp mới'}
                </Typography>
              </Box>
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Supplier Card Component
interface SupplierCardProps {
  supplier: any;
  onEdit: (supplier: any) => void;
  onDelete: (id: string) => void;
  onView: (supplier: any) => void;
  viewMode?: 'grid' | 'list' | 'compact';
}

const SupplierCard: React.FC<SupplierCardProps> = ({ 
  supplier, 
  onEdit, 
  onDelete, 
  onView, 
  viewMode = 'grid'
}) => {
  const formatCurrency = (cents: number) => {
    if (!cents) return '0 ₫';
    // D1 stores in cents, convert to VND
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(cents / 100);
  };

  const getStatusColor = (isActive: number) => {
    return isActive ? 'success' : 'error';
  };

  const getStatusLabel = (isActive: number) => {
    return isActive ? 'Hoạt động' : 'Không hoạt động';
  };

  if (viewMode === 'list') {
    return (
      <Card sx={{ mb: 2, transition: 'all 0.3s ease' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.light' }}>
                  <Business />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {supplier.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {supplier.contact_person || 'Chưa có người liên hệ'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="body2" color="text.secondary">
                {supplier.phone || 'Chưa có số điện thoại'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {supplier.email || 'Chưa có email'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="body2" color="text.secondary">
                Hạn mức: {formatCurrency(supplier.credit_limit_cents || 0)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Chip
                label={getStatusLabel(supplier.is_active)}
                color={getStatusColor(supplier.is_active) as any}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Xem chi tiết">
                  <IconButton size="small" onClick={() => onView(supplier)}>
                    <Visibility />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Chỉnh sửa">
                  <IconButton size="small" onClick={() => onEdit(supplier)}>
                    <Edit />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Xóa">
                  <IconButton size="small" color="error" onClick={() => onDelete(supplier.id)}>
                    <Delete />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
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
            bgcolor: supplier.is_active ? 'success.main' : 'grey.400',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <Business sx={{ fontSize: 30 }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
              {supplier.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {supplier.contact_person || 'Chưa có người liên hệ'}
            </Typography>
          </Box>
          <Chip
            label={getStatusLabel(supplier.is_active)}
            color={getStatusColor(supplier.is_active) as any}
            size="small"
            sx={{
              fontWeight: 600,
              borderRadius: 2
            }}
          />
        </Box>

        {/* Contact Info */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Phone sx={{ fontSize: 16, color: 'warning.main' }} />
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              {supplier.phone || 'Chưa có số điện thoại'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Email sx={{ fontSize: 16, color: 'info.main' }} />
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              {supplier.email || 'Chưa có email'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
            <LocationOn sx={{ fontSize: 16, color: 'text.secondary', mt: 0.2 }} />
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              {supplier.address || 'Chưa có địa chỉ'}
            </Typography>
          </Box>
          {supplier.tax_number && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AccountBalance sx={{ fontSize: 16, color: 'secondary.main' }} />
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                MST: {supplier.tax_number}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Financial Info */}
        {supplier.credit_limit_cents > 0 && (
          <Box sx={{
            p: 2,
            borderRadius: 2,
            background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 152, 0, 0.1) 100%)',
            border: '1px solid rgba(255, 193, 7, 0.3)',
            mb: 3
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AttachMoney sx={{ fontSize: 16, color: 'warning.main' }} />
              <Typography variant="subtitle2" fontWeight="bold" color="warning.main">
                Hạn mức tín dụng
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight="bold" color="warning.dark">
              {formatCurrency(supplier.credit_limit_cents)}
            </Typography>
          </Box>
        )}

        {/* Payment Terms */}
        {supplier.payment_terms && (
          <Box sx={{
            p: 2,
            borderRadius: 2,
            background: 'rgba(76, 175, 80, 0.05)',
            border: '1px solid rgba(76, 175, 80, 0.2)',
            mb: 3
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Payment sx={{ fontSize: 16, color: 'success.main' }} />
              <Typography variant="subtitle2" fontWeight="bold" color="success.main">
                Điều khoản thanh toán
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {supplier.payment_terms}
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* Action Buttons */}
      <Box sx={{ p: 3, borderTop: '1px solid rgba(0,0,0,0.1)', background: 'rgba(0,0,0,0.02)' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="contained"
            startIcon={<Visibility />}
            onClick={() => onView(supplier)}
            sx={{
              flex: 1,
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
            onClick={() => onEdit(supplier)}
            sx={{
              flex: 1,
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
            color="error"
            variant="outlined"
            startIcon={<Delete />}
            onClick={() => onDelete(supplier.id)}
            sx={{
              flex: 1,
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

// Main Suppliers Management Component
const SuppliersManagement: React.FC = () => {
  // State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    sortBy: 'name',
    sortOrder: 'asc' as 'asc' | 'desc'
  });
  
  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSuppliers, setSelectedSuppliers] = useState<Set<string>>(new Set());
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [isLoading] = useState(false);

  const queryClient = useQueryClient();

  // Fetch suppliers with filtering
  const { data: suppliersData, isLoading: suppliersLoading, error, refetch } = useQuery({
    queryKey: ['suppliers', page, pageSize, searchTerm, filters],
    queryFn: async () => {
      console.log('Fetching suppliers with params:', { page, pageSize, searchTerm, filters });
      const response = await suppliersAPI.getSuppliers(page, pageSize, searchTerm || undefined);
      console.log('Suppliers API response:', response.data);
      return response;
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting supplier with ID:', id);
      const response = await suppliersAPI.deleteSupplier(id);
      console.log('Delete supplier response:', response.data);
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      console.log('Supplier deleted successfully:', id);
      alert('Nhà cung cấp đã được xóa thành công!');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      alert('Lỗi khi xóa nhà cung cấp: ' + (error.message || 'Không thể xóa nhà cung cấp'));
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      console.log('Bulk deleting suppliers:', ids);
      const responses = await Promise.all(ids.map(id => suppliersAPI.deleteSupplier(id)));
      console.log('Bulk delete responses:', responses);
      return responses;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setSelectedSuppliers(new Set());
      setBulkActionOpen(false);
      console.log('Bulk delete completed for suppliers:', ids);
      alert(`Đã xóa thành công ${ids.length} nhà cung cấp!`);
    },
    onError: (error) => {
      console.error('Bulk delete error:', error);
      alert('Lỗi khi xóa hàng loạt: ' + (error.message || 'Không thể xóa nhà cung cấp'));
    },
  });

  const suppliers = suppliersData?.data?.data?.suppliers || [];

  // Basic analytics
  const analytics = useMemo(() => {
    if (!suppliers.length) return null;
    
    const totalSuppliers = suppliers.length;
    const activeSuppliers = suppliers.filter(s => s.is_active).length;
    const inactiveSuppliers = suppliers.filter(s => !s.is_active).length;
    
    const totalCreditLimit = suppliers.reduce((sum, s) => sum + (s.credit_limit_cents || 0), 0);
    const avgCreditLimit = totalCreditLimit / totalSuppliers;
    
    return {
      totalSuppliers,
      activeSuppliers,
      inactiveSuppliers,
      totalCreditLimit,
      avgCreditLimit,
      healthScore: Math.round((activeSuppliers / totalSuppliers) * 100)
    };
  }, [suppliers]);

  // Filtered and sorted suppliers
  const filteredSuppliers = useMemo(() => {
    let filtered = [...suppliers];
    
    // Apply filters
    if (filters.status) {
      filtered = filtered.filter(s => 
        filters.status === 'active' ? s.is_active : !s.is_active
      );
    }
    
    // Sort suppliers
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'credit_limit':
          aValue = a.credit_limit_cents || 0;
          bValue = b.credit_limit_cents || 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
    } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [suppliers, filters]);

  // Event Handlers
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    console.log('Search term changed:', searchValue);
    setSearchTerm(searchValue);
    setPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    console.log('Refreshing suppliers...');
    refetch();
  }, [refetch]);

  const handleEdit = useCallback((supplier: any) => {
    console.log('Edit supplier:', supplier);
    setSelectedSupplier(supplier);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    console.log('Delete supplier:', id);
    if (window.confirm('Bạn có chắc chắn muốn xóa nhà cung cấp này?')) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation]);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedSupplierForView, setSelectedSupplierForView] = useState<any>(null);

  const handleView = useCallback((supplier: any) => {
    console.log('View supplier:', supplier);
    setSelectedSupplierForView(supplier);
    setViewModalOpen(true);
  }, []);

  const handleBulkAction = useCallback((action: string) => {
    if (action === 'delete' && selectedSuppliers.size > 0) {
      if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedSuppliers.size} nhà cung cấp?`)) {
        bulkDeleteMutation.mutate(Array.from(selectedSuppliers));
      }
    }
  }, [selectedSuppliers, bulkDeleteMutation]);

  const handleFilterChange = useCallback((key: string, value: any) => {
    console.log('Filter changed:', key, value);
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      console.log('New filters applied:', newFilters);
      return newFilters;
    });
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    console.log('Clearing all filters');
    const defaultFilters = {
      status: '',
      sortBy: 'name',
      sortOrder: 'asc' as 'asc' | 'desc'
    };
    setFilters(defaultFilters);
  }, []);

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Không thể tải dữ liệu nhà cung cấp. Vui lòng kiểm tra kết nối mạng.
        </Alert>
        <Button onClick={handleRefresh} startIcon={<Refresh />}>
          Thử lại
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Enhanced Header */}
      <Box sx={{ mb: 4 }}>
        <Card sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white',
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative'
        }}>
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            right: 0, 
            width: 200, 
            height: 200, 
            background: 'rgba(255,255,255,0.1)', 
            borderRadius: '50%', 
            transform: 'translate(50%, -50%)' 
          }} />
          <CardContent sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <Business sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                      Hệ thống quản lý nhà cung cấp thông minh
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      Quản lý và theo dõi các nhà cung cấp và thông tin liên hệ
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle sx={{ fontSize: 20 }} />
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Quản lý hợp đồng
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp sx={{ fontSize: 20 }} />
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Theo dõi hiệu suất
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning sx={{ fontSize: 20 }} />
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Cảnh báo hạn mức
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<TrendingUp />}
                  sx={{ 
                    textDecoration: 'none',
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.3)',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Báo cáo nhà cung cấp
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => {
                    setSelectedSupplier(null);
                    setFormOpen(true);
                  }}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.3)'
                    }
                  }}
                >
                  Tạo nhà cung cấp mới
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Enhanced Stats Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box sx={{ flex: '1 1 25%', minWidth: '250px' }}>
          <Card sx={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            color: 'white',
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative',
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
            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {analytics?.totalSuppliers || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Tổng nhà cung cấp
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    Tất cả đối tác kinh doanh
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <Business sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 25%', minWidth: '250px' }}>
          <Card sx={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
            color: 'white',
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 30px rgba(79, 172, 254, 0.3)'
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
            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {analytics?.activeSuppliers || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Đang hoạt động
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    Đối tác đang hợp tác
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <CheckCircle sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 25%', minWidth: '250px' }}>
          <Card sx={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
            color: 'white',
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 30px rgba(240, 147, 251, 0.3)'
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
            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {analytics?.inactiveSuppliers || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Không hoạt động
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    Cần kiểm tra hoặc tạm dừng
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <Warning sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 25%', minWidth: '250px' }}>
          <Card sx={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', 
            color: 'white',
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 30px rgba(250, 112, 154, 0.3)'
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
            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((analytics?.totalCreditLimit || 0) / 100)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Tổng hạn mức
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    Tín dụng tổng cộng
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <AccountBalance sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
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
          {/* Main Toolbar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            {/* Enhanced Search */}
            <TextField
              placeholder="Tìm kiếm theo tên, email, số điện thoại, địa chỉ..."
              value={searchTerm}
              onChange={handleSearch}
              sx={{
                minWidth: 350,
                flex: 1,
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
                    <Search sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton 
                      size="small" 
                      onClick={() => setSearchTerm('')}
                      sx={{ 
                        color: 'text.secondary',
                        '&:hover': { color: 'error.main' }
                      }}
                    >
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            {/* Enhanced View Mode Toggle */}
            <Box sx={{ 
              display: 'flex', 
              border: '1px solid rgba(0,0,0,0.1)', 
              borderRadius: 2,
              backgroundColor: 'rgba(255,255,255,0.8)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <IconButton
                onClick={() => setViewMode('grid')}
                color={viewMode === 'grid' ? 'primary' : 'default'}
                size="small"
                sx={{
                  borderRadius: '8px 0 0 8px',
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'white'
                  }
                }}
              >
                <GridView />
              </IconButton>
              <IconButton
                onClick={() => setViewMode('list')}
                color={viewMode === 'list' ? 'primary' : 'default'}
                size="small"
                sx={{
                  borderRadius: 0,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'white'
                  }
                }}
              >
                <ViewList />
              </IconButton>
              <IconButton
                onClick={() => setViewMode('compact')}
                color={viewMode === 'compact' ? 'primary' : 'default'}
                size="small"
                sx={{
                  borderRadius: '0 8px 8px 0',
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'white'
                  }
                }}
              >
                <ViewComfy />
              </IconButton>
            </Box>

            {/* Enhanced Action Buttons */}
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setSelectedSupplier(null);
                setFormOpen(true);
              }}
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
              Thêm nhà cung cấp
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
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
                  backgroundColor: 'rgba(102, 126, 234, 0.04)'
                }
              }}
            >
              Làm mới
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setShowFilters(!showFilters)}
              color={showFilters ? 'primary' : 'inherit'}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1,
                borderColor: showFilters ? 'primary.main' : 'rgba(0,0,0,0.2)',
                color: showFilters ? 'primary.main' : 'text.secondary',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'rgba(102, 126, 234, 0.04)'
                }
              }}
            >
              Bộ lọc
            </Button>

            {/* Enhanced Bulk Actions */}
            {selectedSuppliers.size > 0 && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={() => setBulkActionOpen(true)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderColor: 'error.main',
                  color: 'error.main',
                  '&:hover': {
                    borderColor: 'error.dark',
                    backgroundColor: 'rgba(244, 67, 54, 0.04)'
                  }
                }}
              >
                Xóa ({selectedSuppliers.size})
              </Button>
            )}
          </Box>

          {/* Filters */}
          <Collapse in={showFilters}>
            <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                  <InputLabel>Trạng thái</InputLabel>
                  <Select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    label="Trạng thái"
                  >
                      <MenuItem value="">Tất cả</MenuItem>
                    <MenuItem value="active">Hoạt động</MenuItem>
                    <MenuItem value="inactive">Không hoạt động</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Sắp xếp</InputLabel>
                    <Select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      label="Sắp xếp"
                    >
                      <MenuItem value="name">Tên</MenuItem>
                      <MenuItem value="credit_limit">Hạn mức</MenuItem>
                    </Select>
                  </FormControl>
              </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Thứ tự</InputLabel>
                    <Select
                      value={filters.sortOrder}
                      onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                      label="Thứ tự"
                    >
                      <MenuItem value="asc">Tăng dần</MenuItem>
                      <MenuItem value="desc">Giảm dần</MenuItem>
                    </Select>
                  </FormControl>
            </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={clearFilters}
                    startIcon={<Clear />}
                  >
                    Xóa bộ lọc
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* Suppliers Display */}
      {suppliersLoading ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Box key={index} sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <Card>
                <CardContent>
                  <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
                  <Skeleton variant="text" height={32} sx={{ mb: 1 }} />
                  <Skeleton variant="text" height={24} sx={{ mb: 1 }} />
                  <Skeleton variant="text" height={20} />
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      ) : (
        <>
          {/* Suppliers Grid/List */}
          {viewMode === 'list' ? (
            <Box>
              {filteredSuppliers.map((supplier: any) => (
                <SupplierCard
                  key={supplier.id}
                  supplier={supplier}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                  viewMode="list"
                />
              ))}
          </Box>
          ) : (
            <Grid container spacing={2}>
              {filteredSuppliers.map((supplier: any) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={supplier.id}>
                  <SupplierCard
                    supplier={supplier}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                    viewMode={viewMode}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          {/* Empty State */}
          {filteredSuppliers.length === 0 && !suppliersLoading && (
            <Card sx={{ mt: 3 }}>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 3, bgcolor: 'grey.100' }}>
                  <SearchOff sx={{ fontSize: 40, color: 'grey.400' }} />
                </Avatar>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {searchTerm ? 'Không tìm thấy nhà cung cấp' : 'Chưa có nhà cung cấp nào'}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  {searchTerm 
                    ? `Không có nhà cung cấp nào khớp với "${searchTerm}"`
                    : 'Bắt đầu bằng cách thêm nhà cung cấp đầu tiên của bạn'
                  }
                </Typography>
                {searchTerm ? (
          <Button
                    variant="outlined"
                    startIcon={<Clear />}
                    onClick={() => setSearchTerm('')}
                    sx={{ mr: 2 }}
                  >
                    Xóa tìm kiếm
          </Button>
                ) : null}
          <Button
            variant="contained"
                  startIcon={<Add />}
                  onClick={() => setFormOpen(true)}
          >
                  {searchTerm ? 'Thêm nhà cung cấp mới' : 'Thêm nhà cung cấp đầu tiên'}
          </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
        onClick={() => {
          setSelectedSupplier(null);
          setFormOpen(true);
        }}
      >
        <Add />
      </Fab>

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

      {/* Supplier Form Dialog */}
      <SupplierForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        supplier={selectedSupplier}
      />

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionOpen} onClose={() => setBulkActionOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thao tác hàng loạt</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Bạn đã chọn {selectedSuppliers.size} nhà cung cấp. Bạn muốn thực hiện thao tác gì?
          </Typography>
          <List>
            <ListItem component="div" onClick={() => handleBulkAction('delete')} sx={{ cursor: 'pointer' }}>
              <ListItemIcon>
                <Delete color="error" />
              </ListItemIcon>
              <ListItemText primary="Xóa nhà cung cấp" secondary="Xóa vĩnh viễn các nhà cung cấp đã chọn" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionOpen(false)}>Hủy</Button>
        </DialogActions>
      </Dialog>

      {/* View Supplier Modal */}
      <Dialog
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
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
              Chi tiết nhà cung cấp
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Thông tin đầy đủ về {selectedSupplierForView?.name}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 4 }}>
          {selectedSupplierForView && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Supplier Header */}
              <Box sx={{
                p: 3,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                border: '1px solid rgba(0,0,0,0.1)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{
                    width: 60,
                    height: 60,
                    bgcolor: selectedSupplierForView.is_active ? 'success.main' : 'grey.400',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    <Business sx={{ fontSize: 30 }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                      {selectedSupplierForView.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedSupplierForView.contact_person || 'Chưa có người liên hệ'}
                    </Typography>
                  </Box>
                  <Chip
                    label={selectedSupplierForView.is_active ? 'Hoạt động' : 'Không hoạt động'}
                    color={selectedSupplierForView.is_active ? 'success' : 'default'}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      borderRadius: 2
                    }}
                  />
                </Box>
              </Box>

              {/* Supplier Details */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
                <Box sx={{
                  p: 3,
                  borderRadius: 2,
                  background: 'rgba(102, 126, 234, 0.05)',
                  border: '1px solid rgba(102, 126, 234, 0.2)'
                }}>
                  <Typography variant="subtitle2" fontWeight="bold" color="primary.main" sx={{ mb: 2 }}>
                    Thông tin liên hệ
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Email:</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {selectedSupplierForView.email || 'Chưa có email'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Số điện thoại:</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {selectedSupplierForView.phone || 'Chưa có số điện thoại'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Địa chỉ:</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {selectedSupplierForView.address || 'Chưa có địa chỉ'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{
                  p: 3,
                  borderRadius: 2,
                  background: 'rgba(76, 175, 80, 0.05)',
                  border: '1px solid rgba(76, 175, 80, 0.2)'
                }}>
                  <Typography variant="subtitle2" fontWeight="bold" color="success.main" sx={{ mb: 2 }}>
                    Thông tin tài chính
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Mã số thuế:</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {selectedSupplierForView.tax_number || 'Chưa có MST'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Hạn mức tín dụng:</Typography>
                      <Typography variant="h6" fontWeight="bold" color="warning.main">
                        {selectedSupplierForView.credit_limit_cents ? 
                          new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedSupplierForView.credit_limit_cents / 100) : 
                          'Chưa có hạn mức'
                        }
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Điều khoản thanh toán:</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {selectedSupplierForView.payment_terms || 'Chưa có điều khoản'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{
          p: 3,
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
          borderTop: '1px solid rgba(0,0,0,0.1)'
        }}>
          <Button
            onClick={() => setViewModalOpen(false)}
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
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SuppliersManagement;