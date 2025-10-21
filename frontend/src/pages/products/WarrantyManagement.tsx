import React, { useState, useMemo, useCallback } from 'react';
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
  Skeleton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Fab,
  Backdrop,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  Add,
  Refresh,
  Visibility,
  Edit,
  Delete,
  Security,
  FilterList,
  Star,
  CheckCircle,
  Warning,
  SearchOff,
  Clear,
  GridView,
  ViewList,
  ViewComfy,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warrantiesAPI } from '../../services/api';

// Warranty Form Component
interface WarrantyFormProps {
  open: boolean;
  onClose: () => void;
  warranty?: any;
}

const WarrantyForm: React.FC<WarrantyFormProps> = ({ open, onClose, warranty }) => {
  const [formData, setFormData] = useState({
    warranty_code: warranty?.warranty_code || '',
    product_id: warranty?.product_id || '',
    customer_id: warranty?.customer_id || '',
    order_id: warranty?.order_id || '',
    warranty_type: warranty?.warranty_type || 'standard',
    start_date: warranty?.start_date || '',
    end_date: warranty?.end_date || '',
    status: warranty?.status || 'active',
    notes: warranty?.notes || '',
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => warrantiesAPI.createWarranty(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warranties'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => warrantiesAPI.updateWarranty(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warranties'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (warranty) {
      updateMutation.mutate({ id: warranty.id, data: formData });
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
            {warranty ? 'Chỉnh sửa thông tin bảo hành' : 'Tạo bảo hành mới'}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {warranty ? 'Cập nhật thông tin bảo hành' : 'Điền thông tin chi tiết để tạo bảo hành mới'}
          </Typography>
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 4 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
            {/* Mã bảo hành */}
            <Box>
              <TextField
                fullWidth
                label="Mã bảo hành"
                value={formData.warranty_code}
                onChange={handleChange('warranty_code')}
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
                      <Security sx={{ color: 'primary.main' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* ID Sản phẩm */}
            <Box>
              <TextField
                fullWidth
                label="ID Sản phẩm"
                value={formData.product_id}
                onChange={handleChange('product_id')}
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
                      <Star sx={{ color: 'secondary.main' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* ID Khách hàng */}
            <Box>
              <TextField
                fullWidth
                label="ID Khách hàng"
                value={formData.customer_id}
                onChange={handleChange('customer_id')}
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
                      <CheckCircle sx={{ color: 'success.main' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* ID Đơn hàng */}
            <Box>
              <TextField
                fullWidth
                label="ID Đơn hàng"
                value={formData.order_id}
                onChange={handleChange('order_id')}
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
                      <Warning sx={{ color: 'warning.main' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Loại bảo hành */}
            <Box>
              <FormControl 
                fullWidth
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
              >
                <InputLabel>Loại bảo hành</InputLabel>
                <Select
                  value={formData.warranty_type}
                  onChange={handleChange('warranty_type')}
                  label="Loại bảo hành"
                >
                  <MenuItem value="standard">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        backgroundColor: 'info.main' 
                      }} />
                      Tiêu chuẩn
                    </Box>
                  </MenuItem>
                  <MenuItem value="extended">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        backgroundColor: 'warning.main' 
                      }} />
                      Mở rộng
                    </Box>
                  </MenuItem>
                  <MenuItem value="premium">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        backgroundColor: 'success.main' 
                      }} />
                      Cao cấp
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Trạng thái */}
            <Box>
              <FormControl 
                fullWidth
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
              >
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={formData.status}
                  onChange={handleChange('status')}
                  label="Trạng thái"
                >
                  <MenuItem value="active">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        backgroundColor: 'success.main' 
                      }} />
                      Hoạt động
                    </Box>
                  </MenuItem>
                  <MenuItem value="expired">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        backgroundColor: 'error.main' 
                      }} />
                      Hết hạn
                    </Box>
                  </MenuItem>
                  <MenuItem value="cancelled">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        backgroundColor: 'warning.main' 
                      }} />
                      Hủy bỏ
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Ngày bắt đầu */}
            <Box>
              <TextField
                fullWidth
                label="Ngày bắt đầu"
                type="date"
                value={formData.start_date}
                onChange={handleChange('start_date')}
                InputLabelProps={{ shrink: true }}
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
                      <CheckCircle sx={{ color: 'info.main' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Ngày kết thúc */}
            <Box>
              <TextField
                fullWidth
                label="Ngày kết thúc"
                type="date"
                value={formData.end_date}
                onChange={handleChange('end_date')}
                InputLabelProps={{ shrink: true }}
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
                      <Warning sx={{ color: 'error.main' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Ghi chú */}
            <Box sx={{ gridColumn: '1 / -1' }}>
              <TextField
                fullWidth
                label="Ghi chú"
                multiline
                rows={4}
                value={formData.notes}
                onChange={handleChange('notes')}
                placeholder="Nhập ghi chú chi tiết về bảo hành..."
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
                      <Security sx={{ color: 'text.secondary' }} />
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
              borderColor: 'rgba(0,0,0,0.2)',
              color: 'text.secondary',
              '&:hover': {
                borderColor: 'error.main',
                color: 'error.main',
                backgroundColor: 'rgba(244, 67, 54, 0.04)'
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
                {warranty ? 'Đang cập nhật...' : 'Đang tạo...'}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {warranty ? <Edit /> : <Add />}
                {warranty ? 'Cập nhật bảo hành' : 'Tạo bảo hành mới'}
              </Box>
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Warranty Card Component
interface WarrantyCardProps {
  warranty: any;
  onEdit: (warranty: any) => void;
  onDelete: (id: string) => void;
  onView: (warranty: any) => void;
  viewMode?: 'grid' | 'list' | 'compact';
}

const WarrantyCard: React.FC<WarrantyCardProps> = ({ 
  warranty, 
  onEdit, 
  onDelete, 
  onView, 
  viewMode = 'grid'
}) => {
  const getStatusColor = (status: string, endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    
    if (status === 'cancelled') return 'error';
    if (status === 'expired' || now > end) return 'error';
    if (status === 'active') return 'success';
    return 'warning';
  };

  const getStatusLabel = (status: string, endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    
    if (status === 'cancelled') return 'Hủy bỏ';
    if (status === 'expired' || now > end) return 'Hết hạn';
    if (status === 'active') return 'Hoạt động';
    return 'Không xác định';
  };

  const getWarrantyTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'standard': 'Tiêu chuẩn',
      'extended': 'Mở rộng',
      'premium': 'Cao cấp'
    };
    return types[type] || type;
  };

  const getDaysRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (viewMode === 'list') {
    return (
      <Card sx={{ mb: 2, transition: 'all 0.3s ease' }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.light' }}>
                  <Security />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {warranty.warranty_code}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getWarrantyTypeLabel(warranty.warranty_type)}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ flex: '1 1 25%', minWidth: '200px' }}>
              <Typography variant="body2" color="text.secondary">
                Sản phẩm: {warranty.product_id}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Khách hàng: {warranty.customer_id || 'N/A'}
              </Typography>
            </Box>
            <Box sx={{ flex: '1 1 25%', minWidth: '200px' }}>
              <Typography variant="body2" color="text.secondary">
                {warranty.start_date} - {warranty.end_date}
              </Typography>
            </Box>
            <Box sx={{ flex: '1 1 25%', minWidth: '200px' }}>
              <Chip
                label={getStatusLabel(warranty.status, warranty.end_date)}
                color={getStatusColor(warranty.status, warranty.end_date) as any}
                size="small"
              />
            </Box>
            <Box sx={{ flex: '1 1 25%', minWidth: '200px' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Xem chi tiết">
                  <IconButton size="small" onClick={() => onView(warranty)}>
                    <Visibility />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Chỉnh sửa">
                  <IconButton size="small" onClick={() => onEdit(warranty)}>
                    <Edit />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Xóa">
                  <IconButton size="small" color="error" onClick={() => onDelete(warranty.id)}>
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
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 8,
        }
      }}
    >
      <CardContent sx={{ flex: 1, pt: 3 }}>
        {/* Warranty Image Placeholder */}
        <Box sx={{ 
          height: 200, 
          bgcolor: 'grey.100', 
          borderRadius: 2, 
          mb: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.light' }}>
            <Security sx={{ fontSize: 40 }} />
          </Avatar>
          <Chip
            label={getStatusLabel(warranty.status, warranty.end_date)}
            size="small"
            color={getStatusColor(warranty.status, warranty.end_date) as any}
            sx={{ position: 'absolute', top: 8, right: 8 }}
          />
        </Box>

        {/* Warranty Info */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minHeight: '3em'
          }}>
            {warranty.warranty_code}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {getWarrantyTypeLabel(warranty.warranty_type)}
          </Typography>
        </Box>

        {/* Product Info */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Sản phẩm: {warranty.product_id}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Khách hàng: {warranty.customer_id || 'N/A'}
          </Typography>
        </Box>

        {/* Date Range */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {warranty.start_date} - {warranty.end_date}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Còn lại: {getDaysRemaining(warranty.end_date)} ngày
          </Typography>
        </Box>

        {/* Notes */}
        {warranty.notes && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {warranty.notes}
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* Action Buttons */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Button
            size="small"
            startIcon={<Visibility />}
            onClick={() => onView(warranty)}
            sx={{ flex: 1 }}
          >
            Xem
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => onEdit(warranty)}
            sx={{ flex: 1 }}
          >
            Sửa
          </Button>
          <Button
            size="small"
            color="error"
            startIcon={<Delete />}
            onClick={() => onDelete(warranty.id)}
            sx={{ flex: 1 }}
          >
            Xóa
          </Button>
        </Box>
      </Box>
    </Card>
  );
};

// Main Warranty Management Component
const WarrantyManagement: React.FC = () => {
  // State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [selectedWarranty, setSelectedWarranty] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    sortBy: 'warranty_code',
    sortOrder: 'asc' as 'asc' | 'desc'
  });
  
  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [selectedWarranties, setSelectedWarranties] = useState<Set<string>>(new Set());
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [isLoading] = useState(false);

  const queryClient = useQueryClient();

  // Fetch warranties with filtering
  const { data: warrantiesData, isLoading: warrantiesLoading, error, refetch } = useQuery({
    queryKey: ['warranties', page, pageSize, searchTerm, filters],
    queryFn: async () => {
      console.log('Fetching warranties with params:', { page, pageSize, searchTerm, filters });
      const response = await warrantiesAPI.getWarranties(page, pageSize, searchTerm || undefined);
      console.log('Warranties API response:', response.data);
      return response;
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting warranty with ID:', id);
      const response = await warrantiesAPI.deleteWarranty(id);
      console.log('Delete warranty response:', response.data);
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['warranties'] });
      console.log('Warranty deleted successfully:', id);
      alert('Bảo hành đã được xóa thành công!');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      alert('Lỗi khi xóa bảo hành: ' + (error.message || 'Không thể xóa bảo hành'));
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      console.log('Bulk deleting warranties:', ids);
      const responses = await Promise.all(ids.map(id => warrantiesAPI.deleteWarranty(id)));
      console.log('Bulk delete responses:', responses);
      return responses;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['warranties'] });
      setSelectedWarranties(new Set());
      setBulkActionOpen(false);
      console.log('Bulk delete completed for warranties:', ids);
      alert(`Đã xóa thành công ${ids.length} bảo hành!`);
    },
    onError: (error) => {
      console.error('Bulk delete error:', error);
      alert('Lỗi khi xóa hàng loạt: ' + (error.message || 'Không thể xóa bảo hành'));
    },
  });

  const warranties = warrantiesData?.data?.data?.warranties || [];

  // Basic analytics
  const analytics = useMemo(() => {
    if (!warranties.length) return null;
    
    const totalWarranties = warranties.length;
    const activeWarranties = warranties.filter((w: any) => w.status === 'active').length;
    const expiredWarranties = warranties.filter((w: any) => w.status === 'expired').length;
    const cancelledWarranties = warranties.filter((w: any) => w.status === 'cancelled').length;
    
    const standardWarranties = warranties.filter((w: any) => w.warranty_type === 'standard').length;
    const extendedWarranties = warranties.filter((w: any) => w.warranty_type === 'extended').length;
    const premiumWarranties = warranties.filter((w: any) => w.warranty_type === 'premium').length;
    
    return {
      totalWarranties,
      activeWarranties,
      expiredWarranties,
      cancelledWarranties,
      standardWarranties,
      extendedWarranties,
      premiumWarranties,
      healthScore: Math.round((activeWarranties / totalWarranties) * 100)
    };
  }, [warranties]);

  // Filtered and sorted warranties
  const filteredWarranties = useMemo(() => {
    let filtered = [...warranties];
    
    // Apply filters
    if (filters.status) {
      filtered = filtered.filter((w: any) => w.status === filters.status);
    }
    
    if (filters.type) {
      filtered = filtered.filter((w: any) => w.warranty_type === filters.type);
    }
    
    // Sort warranties
    filtered.sort((a: any, b: any) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'warranty_code':
          aValue = a.warranty_code.toLowerCase();
          bValue = b.warranty_code.toLowerCase();
          break;
        case 'start_date':
          aValue = new Date(a.start_date).getTime();
          bValue = new Date(b.start_date).getTime();
          break;
        case 'end_date':
          aValue = new Date(a.end_date).getTime();
          bValue = new Date(b.end_date).getTime();
          break;
        default:
          aValue = a.warranty_code.toLowerCase();
          bValue = b.warranty_code.toLowerCase();
      }
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [warranties, filters]);

  // Event Handlers
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    console.log('Search term changed:', searchValue);
    setSearchTerm(searchValue);
    setPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    console.log('Refreshing warranties...');
    refetch();
  }, [refetch]);

  const handleEdit = useCallback((warranty: any) => {
    console.log('Edit warranty:', warranty);
    setSelectedWarranty(warranty);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    console.log('Delete warranty:', id);
    if (window.confirm('Bạn có chắc chắn muốn xóa bảo hành này?')) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation]);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedWarrantyForView, setSelectedWarrantyForView] = useState<any>(null);

  const handleView = useCallback((warranty: any) => {
    console.log('View warranty:', warranty);
    setSelectedWarrantyForView(warranty);
    setViewModalOpen(true);
  }, []);

  const handleBulkAction = useCallback((action: string) => {
    if (action === 'delete' && selectedWarranties.size > 0) {
      if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedWarranties.size} bảo hành?`)) {
        bulkDeleteMutation.mutate(Array.from(selectedWarranties));
      }
    }
  }, [selectedWarranties, bulkDeleteMutation]);

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
      type: '',
      sortBy: 'warranty_code',
      sortOrder: 'asc' as 'asc' | 'desc'
    };
    setFilters(defaultFilters);
  }, []);

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Không thể tải dữ liệu bảo hành. Vui lòng kiểm tra kết nối mạng.
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
                    <Security sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                      Hệ thống quản lý bảo hành thông minh
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      Quản lý và theo dõi các chương trình bảo hành sản phẩm
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle sx={{ fontSize: 20 }} />
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Bảo hành chính hãng
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Star sx={{ fontSize: 20 }} />
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Dịch vụ cao cấp
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning sx={{ fontSize: 20 }} />
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Cảnh báo hết hạn
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<Security />}
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
                  Báo cáo bảo hành
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => {
                    setSelectedWarranty(null);
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
                  Tạo bảo hành mới
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
                    {analytics?.totalWarranties || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Tổng bảo hành
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    Tất cả chương trình bảo hành
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <Security sx={{ fontSize: 28 }} />
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
                    {analytics?.activeWarranties || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Đang hoạt động
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    Bảo hành còn hiệu lực
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
                    {analytics?.expiredWarranties || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Hết hạn
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    Cần gia hạn hoặc thay thế
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
                    {analytics?.premiumWarranties || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Cao cấp
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    Dịch vụ bảo hành cao cấp
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <Star sx={{ fontSize: 28 }} />
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
              placeholder="Tìm kiếm theo mã bảo hành, sản phẩm, khách hàng..."
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
                setSelectedWarranty(null);
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
              Thêm bảo hành
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
            {selectedWarranties.size > 0 && (
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
                Xóa ({selectedWarranties.size})
              </Button>
            )}
          </Box>

          {/* Filters */}
          <Collapse in={showFilters}>
            <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 20%', minWidth: '200px' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Trạng thái</InputLabel>
                    <Select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      label="Trạng thái"
                    >
                      <MenuItem value="">Tất cả</MenuItem>
                      <MenuItem value="active">Hoạt động</MenuItem>
                      <MenuItem value="expired">Hết hạn</MenuItem>
                      <MenuItem value="cancelled">Hủy bỏ</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                <Box sx={{ flex: '1 1 20%', minWidth: '200px' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Loại</InputLabel>
                    <Select
                      value={filters.type}
                      onChange={(e) => handleFilterChange('type', e.target.value)}
                      label="Loại"
                    >
                      <MenuItem value="">Tất cả</MenuItem>
                      <MenuItem value="standard">Tiêu chuẩn</MenuItem>
                      <MenuItem value="extended">Mở rộng</MenuItem>
                      <MenuItem value="premium">Cao cấp</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                <Box sx={{ flex: '1 1 20%', minWidth: '200px' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Sắp xếp</InputLabel>
                    <Select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      label="Sắp xếp"
                    >
                      <MenuItem value="warranty_code">Mã bảo hành</MenuItem>
                      <MenuItem value="start_date">Ngày bắt đầu</MenuItem>
                      <MenuItem value="end_date">Ngày kết thúc</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                <Box sx={{ flex: '1 1 20%', minWidth: '200px' }}>
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
                </Box>
                
                <Box sx={{ flex: '1 1 20%', minWidth: '200px' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={clearFilters}
                    startIcon={<Clear />}
                  >
                    Xóa bộ lọc
                  </Button>
                </Box>
              </Box>
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* Warranties Display */}
      {warrantiesLoading ? (
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
          {/* Warranties Grid/List */}
          {viewMode === 'list' ? (
            <Box>
              {filteredWarranties.map((warranty: any) => (
                <WarrantyCard
                  key={warranty.id}
                  warranty={warranty}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                  viewMode="list"
                />
              ))}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {filteredWarranties.map((warranty: any) => (
                <Box key={warranty.id} sx={{ flex: '1 1 25%', minWidth: '300px' }}>
                  <WarrantyCard
                    warranty={warranty}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                    viewMode={viewMode}
                  />
                </Box>
              ))}
            </Box>
          )}

          {/* Empty State */}
          {filteredWarranties.length === 0 && !warrantiesLoading && (
            <Card sx={{ mt: 3 }}>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 3, bgcolor: 'grey.100' }}>
                  <SearchOff sx={{ fontSize: 40, color: 'grey.400' }} />
                </Avatar>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {searchTerm ? 'Không tìm thấy bảo hành' : 'Chưa có bảo hành nào'}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  {searchTerm 
                    ? `Không có bảo hành nào khớp với "${searchTerm}"`
                    : 'Bắt đầu bằng cách thêm bảo hành đầu tiên của bạn'
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
                  {searchTerm ? 'Thêm bảo hành mới' : 'Thêm bảo hành đầu tiên'}
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
          setSelectedWarranty(null);
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

      {/* Warranty Form Dialog */}
      <WarrantyForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        warranty={selectedWarranty}
      />

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionOpen} onClose={() => setBulkActionOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thao tác hàng loạt</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Bạn đã chọn {selectedWarranties.size} bảo hành. Bạn muốn thực hiện thao tác gì?
          </Typography>
          <List>
            <ListItem component="div" onClick={() => handleBulkAction('delete')} sx={{ cursor: 'pointer' }}>
              <ListItemIcon>
                <Delete color="error" />
              </ListItemIcon>
              <ListItemText primary="Xóa bảo hành" secondary="Xóa vĩnh viễn các bảo hành đã chọn" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionOpen(false)}>Hủy</Button>
        </DialogActions>
      </Dialog>

      {/* View Warranty Modal */}
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
              Chi tiết bảo hành
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Thông tin đầy đủ về bảo hành #{selectedWarrantyForView?.warranty_code}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 4 }}>
          {selectedWarrantyForView && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Warranty Header */}
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
                    bgcolor: 'primary.light',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    <Security sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                      {selectedWarrantyForView.warranty_code}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedWarrantyForView.warranty_type === 'standard' ? 'Bảo hành tiêu chuẩn' :
                       selectedWarrantyForView.warranty_type === 'extended' ? 'Bảo hành mở rộng' :
                       selectedWarrantyForView.warranty_type === 'premium' ? 'Bảo hành cao cấp' : 'Bảo hành'}
                    </Typography>
                  </Box>
                  <Chip
                    label={selectedWarrantyForView.status === 'active' ? 'Hoạt động' :
                           selectedWarrantyForView.status === 'expired' ? 'Hết hạn' : 'Hủy bỏ'}
                    color={selectedWarrantyForView.status === 'active' ? 'success' :
                           selectedWarrantyForView.status === 'expired' ? 'error' : 'warning'}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Box>

              {/* Warranty Details */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
                <Box sx={{
                  p: 3,
                  borderRadius: 2,
                  background: 'rgba(102, 126, 234, 0.05)',
                  border: '1px solid rgba(102, 126, 234, 0.2)'
                }}>
                  <Typography variant="subtitle2" fontWeight="bold" color="primary.main" sx={{ mb: 2 }}>
                    Thông tin sản phẩm
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">ID Sản phẩm:</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {selectedWarrantyForView.product_id}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">ID Khách hàng:</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {selectedWarrantyForView.customer_id || 'N/A'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">ID Đơn hàng:</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {selectedWarrantyForView.order_id || 'N/A'}
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
                    Thông tin thời gian
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Ngày bắt đầu:</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {new Date(selectedWarrantyForView.start_date).toLocaleDateString('vi-VN')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Ngày kết thúc:</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {new Date(selectedWarrantyForView.end_date).toLocaleDateString('vi-VN')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Thời gian còn lại:</Typography>
                      <Typography variant="body1" fontWeight="500" color={
                        new Date(selectedWarrantyForView.end_date) < new Date() ? 'error.main' : 'success.main'
                      }>
                        {(() => {
                          const now = new Date();
                          const end = new Date(selectedWarrantyForView.end_date);
                          const diffTime = end.getTime() - now.getTime();
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          return diffDays > 0 ? `${diffDays} ngày` : 'Đã hết hạn';
                        })()}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Notes */}
              {selectedWarrantyForView.notes && (
                <Box sx={{
                  p: 3,
                  borderRadius: 2,
                  background: 'rgba(255, 193, 7, 0.05)',
                  border: '1px solid rgba(255, 193, 7, 0.2)'
                }}>
                  <Typography variant="subtitle2" fontWeight="bold" color="warning.main" sx={{ mb: 2 }}>
                    Ghi chú
                  </Typography>
                  <Typography variant="body1" sx={{
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {selectedWarrantyForView.notes}
                  </Typography>
                </Box>
              )}
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

export default WarrantyManagement;