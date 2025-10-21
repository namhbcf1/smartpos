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
  Warehouse,
  FilterList,
  CheckCircle,
  Warning,
  SearchOff,
  Clear,
  GridView,
  ViewList,
  ViewComfy,
  TrendingUp,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warehousesAPI } from '../../services/api';

// Warehouse Form Component
interface WarehouseFormProps {
  open: boolean;
  onClose: () => void;
  warehouse?: any;
}

const WarehouseForm: React.FC<WarehouseFormProps> = ({ open, onClose, warehouse }) => {
  const [formData, setFormData] = useState({
    code: warehouse?.code || '',
    name: warehouse?.name || '',
    address: warehouse?.address || '',
    manager_id: warehouse?.manager_id || '',
    is_active: warehouse?.is_active !== undefined ? warehouse.is_active : 1,
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => warehousesAPI.createWarehouse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => warehousesAPI.updateWarehouse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (warehouse) {
      updateMutation.mutate({ id: warehouse.id, data: formData });
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
            {warehouse ? 'Chỉnh sửa thông tin kho hàng' : 'Tạo kho hàng mới'}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {warehouse ? 'Cập nhật thông tin kho hàng' : 'Điền thông tin chi tiết để tạo kho hàng mới'}
          </Typography>
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 4 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
            {/* Mã kho hàng */}
            <Box>
              <TextField
                fullWidth
                label="Mã kho hàng"
                value={formData.code}
                onChange={handleChange('code')}
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
                      <Warehouse sx={{ color: 'primary.main' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Tên kho hàng */}
            <Box>
              <TextField
                fullWidth
                label="Tên kho hàng"
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
                      <CheckCircle sx={{ color: 'success.main' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* ID Quản lý */}
            <Box>
              <TextField
                fullWidth
                label="ID Quản lý"
                value={formData.manager_id}
                onChange={handleChange('manager_id')}
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
                      <TrendingUp sx={{ color: 'info.main' }} />
                    </InputAdornment>
                  ),
                }}
              />
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
                  value={formData.is_active}
                  onChange={handleChange('is_active')}
                  label="Trạng thái"
                >
                  <MenuItem value={1}>
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
                  <MenuItem value={0}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        backgroundColor: 'error.main' 
                      }} />
                      Không hoạt động
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
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
                placeholder="Nhập địa chỉ chi tiết của kho hàng..."
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
                      <Warning sx={{ color: 'text.secondary' }} />
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
                {warehouse ? 'Đang cập nhật...' : 'Đang tạo...'}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {warehouse ? <Edit /> : <Add />}
                {warehouse ? 'Cập nhật kho hàng' : 'Tạo kho hàng mới'}
              </Box>
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Warehouse Card Component
interface WarehouseCardProps {
  warehouse: any;
  onEdit: (warehouse: any) => void;
  onDelete: (id: string) => void;
  onView: (warehouse: any) => void;
  viewMode?: 'grid' | 'list' | 'compact';
}

const WarehouseCard: React.FC<WarehouseCardProps> = ({ 
  warehouse, 
  onEdit, 
  onDelete, 
  onView, 
  viewMode = 'grid'
}) => {
  const getStatusColor = (isActive: number) => {
    return isActive === 1 ? 'success' : 'error';
  };

  const getStatusLabel = (isActive: number) => {
    return isActive === 1 ? 'Hoạt động' : 'Không hoạt động';
  };

  if (viewMode === 'list') {
    return (
      <Card sx={{ mb: 2, transition: 'all 0.3s ease' }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.light' }}>
                  <Warehouse />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {warehouse.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Mã: {warehouse.code}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ flex: '1 1 25%', minWidth: '200px' }}>
              <Typography variant="body2" color="text.secondary">
                Địa chỉ: {warehouse.address || 'N/A'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Quản lý: {warehouse.manager_id || 'N/A'}
              </Typography>
            </Box>
            <Box sx={{ flex: '1 1 25%', minWidth: '200px' }}>
              <Chip
                label={getStatusLabel(warehouse.is_active)}
                color={getStatusColor(warehouse.is_active) as any}
                size="small"
              />
            </Box>
            <Box sx={{ flex: '1 1 25%', minWidth: '200px' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Xem chi tiết">
                  <IconButton size="small" onClick={() => onView(warehouse)}>
                    <Visibility />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Chỉnh sửa">
                  <IconButton size="small" onClick={() => onEdit(warehouse)}>
                    <Edit />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Xóa">
                  <IconButton size="small" color="error" onClick={() => onDelete(warehouse.id)}>
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
        {/* Warehouse Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar sx={{ 
            bgcolor: warehouse.is_active === 1 ? 'primary.light' : 'error.light',
            width: 48,
            height: 48
          }}>
            <Warehouse />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
              {warehouse.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Mã: {warehouse.code}
            </Typography>
          </Box>
          <Chip
            label={getStatusLabel(warehouse.is_active)}
            size="small"
            color={getStatusColor(warehouse.is_active) as any}
            sx={{ fontWeight: 600 }}
          />
        </Box>

        {/* Warehouse Info */}
        <Box sx={{ 
          p: 2, 
          borderRadius: 2, 
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
          border: '1px solid rgba(0,0,0,0.05)',
          mb: 3
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Warning sx={{ color: 'info.main', fontSize: 20 }} />
            <Typography variant="body2" color="text.secondary" fontWeight="500">
              Thông tin kho hàng
            </Typography>
          </Box>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Địa chỉ
              </Typography>
              <Typography variant="body2" fontWeight="600" sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {warehouse.address || 'Chưa có'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Quản lý
              </Typography>
              <Typography variant="body2" fontWeight="600">
                {warehouse.manager_id || 'Chưa có'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Status Info */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          p: 2, 
          borderRadius: 2,
          backgroundColor: warehouse.is_active === 1 ? 'rgba(76, 175, 80, 0.05)' : 'rgba(244, 67, 54, 0.05)',
          border: `1px solid ${warehouse.is_active === 1 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)'}`,
          mb: 2
        }}>
          <CheckCircle sx={{ 
            color: warehouse.is_active === 1 ? 'success.main' : 'error.main',
            fontSize: 20 
          }} />
          <Box>
            <Typography variant="body2" color="text.secondary">
              Trạng thái hoạt động
            </Typography>
            <Typography variant="body1" fontWeight="600" color={warehouse.is_active === 1 ? 'success.main' : 'error.main'}>
              {warehouse.is_active === 1 ? 'Đang hoạt động' : 'Không hoạt động'}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      {/* Enhanced Action Buttons */}
      <Box sx={{ 
        p: 2, 
        borderTop: '1px solid rgba(0,0,0,0.1)',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'
      }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<Visibility />}
            onClick={() => onView(warehouse)}
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
            variant="outlined"
            size="small"
            startIcon={<Edit />}
            onClick={() => onEdit(warehouse)}
            sx={{ 
              flex: 1,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                borderColor: 'primary.dark',
                backgroundColor: 'rgba(102, 126, 234, 0.04)'
              }
            }}
          >
            Sửa
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            startIcon={<Delete />}
            onClick={() => onDelete(warehouse.id)}
            sx={{ 
              flex: 1,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: 'error.main',
              color: 'error.main',
              '&:hover': {
                borderColor: 'error.dark',
                backgroundColor: 'rgba(244, 67, 54, 0.04)'
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

// Main Warehouse Management Component
const WarehouseManagement: React.FC = () => {
  // State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    sortBy: 'name',
    sortOrder: 'asc' as 'asc' | 'desc'
  });
  
  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [selectedWarehouses, setSelectedWarehouses] = useState<Set<string>>(new Set());
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [isLoading] = useState(false);

  const queryClient = useQueryClient();

  // Fetch warehouses with filtering
  const { data: warehousesData, isLoading: warehousesLoading, error, refetch } = useQuery({
    queryKey: ['warehouses', page, pageSize, searchTerm, filters],
    queryFn: async () => {
      console.log('Fetching warehouses with params:', { page, pageSize, searchTerm, filters });
      const response = await warehousesAPI.getWarehouses(page, pageSize, searchTerm || undefined);
      console.log('Warehouses API response:', response.data);
      return response;
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting warehouse with ID:', id);
      const response = await warehousesAPI.deleteWarehouse(id);
      console.log('Delete warehouse response:', response.data);
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      console.log('Warehouse deleted successfully:', id);
      alert('Kho hàng đã được xóa thành công!');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      alert('Lỗi khi xóa kho hàng: ' + (error.message || 'Không thể xóa kho hàng'));
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      console.log('Bulk deleting warehouses:', ids);
      const responses = await Promise.all(ids.map(id => warehousesAPI.deleteWarehouse(id)));
      console.log('Bulk delete responses:', responses);
      return responses;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setSelectedWarehouses(new Set());
      setBulkActionOpen(false);
      console.log('Bulk delete completed for warehouses:', ids);
      alert(`Đã xóa thành công ${ids.length} kho hàng!`);
    },
    onError: (error) => {
      console.error('Bulk delete error:', error);
      alert('Lỗi khi xóa hàng loạt: ' + (error.message || 'Không thể xóa kho hàng'));
    },
  });

  const warehouses = warehousesData?.data?.warehouses || [];

  // Basic analytics
  const analytics = useMemo(() => {
    if (!warehouses.length) return null;
    
    const totalWarehouses = warehouses.length;
    const activeWarehouses = warehouses.filter((w: any) => w.is_active === 1).length;
    const inactiveWarehouses = warehouses.filter((w: any) => w.is_active === 0).length;
    
    return {
      totalWarehouses,
      activeWarehouses,
      inactiveWarehouses,
      healthScore: Math.round((activeWarehouses / totalWarehouses) * 100)
    };
  }, [warehouses]);

  // Filtered and sorted warehouses
  const filteredWarehouses = useMemo(() => {
    let filtered = [...warehouses];
    
    // Apply filters
    if (filters.status) {
      const isActive = filters.status === 'active' ? 1 : 0;
      filtered = filtered.filter((w: any) => w.is_active === isActive);
    }
    
    // Sort warehouses
    filtered.sort((a: any, b: any) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'code':
          aValue = a.code.toLowerCase();
          bValue = b.code.toLowerCase();
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
  }, [warehouses, filters]);

  // Event Handlers
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    console.log('Search term changed:', searchValue);
    setSearchTerm(searchValue);
    setPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    console.log('Refreshing warehouses...');
    refetch();
  }, [refetch]);

  const handleEdit = useCallback((warehouse: any) => {
    console.log('Edit warehouse:', warehouse);
    setSelectedWarehouse(warehouse);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    console.log('Delete warehouse:', id);
    if (window.confirm('Bạn có chắc chắn muốn xóa kho hàng này?')) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation]);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedWarehouseForView, setSelectedWarehouseForView] = useState<any>(null);

  const handleView = useCallback((warehouse: any) => {
    console.log('View warehouse:', warehouse);
    setSelectedWarehouseForView(warehouse);
    setViewModalOpen(true);
  }, []);

  const handleBulkAction = useCallback((action: string) => {
    if (action === 'delete' && selectedWarehouses.size > 0) {
      if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedWarehouses.size} kho hàng?`)) {
        bulkDeleteMutation.mutate(Array.from(selectedWarehouses));
      }
    }
  }, [selectedWarehouses, bulkDeleteMutation]);

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
          Không thể tải dữ liệu kho hàng. Vui lòng kiểm tra kết nối mạng.
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
                    <Warehouse sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                      Hệ thống quản lý kho hàng thông minh
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      Quản lý và theo dõi các kho hàng và trung tâm phân phối
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle sx={{ fontSize: 20 }} />
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Quản lý tồn kho
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
                      Cảnh báo tồn kho
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
                  Báo cáo kho hàng
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => {
                    setSelectedWarehouse(null);
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
                  Tạo kho hàng mới
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
                    {analytics?.totalWarehouses || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Tổng kho hàng
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    Tất cả kho hàng và trung tâm
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <Warehouse sx={{ fontSize: 28 }} />
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
                    {analytics?.activeWarehouses || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Đang hoạt động
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    Kho hàng đang vận hành
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
                    {analytics?.inactiveWarehouses || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Không hoạt động
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    Cần kiểm tra hoặc bảo trì
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
                    {analytics?.healthScore || 0}%
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Tỷ lệ hoạt động
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    Hiệu suất tổng thể
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <TrendingUp sx={{ fontSize: 28 }} />
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
              placeholder="Tìm kiếm theo tên kho, mã kho, địa chỉ..."
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
                setSelectedWarehouse(null);
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
              Thêm kho hàng
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
            {selectedWarehouses.size > 0 && (
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
                Xóa ({selectedWarehouses.size})
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
                      <MenuItem value="inactive">Không hoạt động</MenuItem>
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
                      <MenuItem value="name">Tên</MenuItem>
                      <MenuItem value="code">Mã</MenuItem>
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

      {/* Warehouses Display */}
      {warehousesLoading ? (
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
          {/* Warehouses Grid/List */}
          {viewMode === 'list' ? (
            <Box>
              {filteredWarehouses.map((warehouse: any) => (
                <WarehouseCard
                  key={warehouse.id}
                  warehouse={warehouse}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                  viewMode="list"
                />
              ))}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {filteredWarehouses.map((warehouse: any) => (
                <Box key={warehouse.id} sx={{ flex: '1 1 25%', minWidth: '300px' }}>
                  <WarehouseCard
                    warehouse={warehouse}
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
          {filteredWarehouses.length === 0 && !warehousesLoading && (
            <Card sx={{ mt: 3 }}>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 3, bgcolor: 'grey.100' }}>
                  <SearchOff sx={{ fontSize: 40, color: 'grey.400' }} />
                </Avatar>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {searchTerm ? 'Không tìm thấy kho hàng' : 'Chưa có kho hàng nào'}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  {searchTerm 
                    ? `Không có kho hàng nào khớp với "${searchTerm}"`
                    : 'Bắt đầu bằng cách thêm kho hàng đầu tiên của bạn'
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
                  {searchTerm ? 'Thêm kho hàng mới' : 'Thêm kho hàng đầu tiên'}
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
          setSelectedWarehouse(null);
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

      {/* Warehouse Form Dialog */}
      <WarehouseForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        warehouse={selectedWarehouse}
      />

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionOpen} onClose={() => setBulkActionOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thao tác hàng loạt</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Bạn đã chọn {selectedWarehouses.size} kho hàng. Bạn muốn thực hiện thao tác gì?
          </Typography>
          <List>
            <ListItem component="div" onClick={() => handleBulkAction('delete')} sx={{ cursor: 'pointer' }}>
              <ListItemIcon>
                <Delete color="error" />
              </ListItemIcon>
              <ListItemText primary="Xóa kho hàng" secondary="Xóa vĩnh viễn các kho hàng đã chọn" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionOpen(false)}>Hủy</Button>
        </DialogActions>
      </Dialog>

      {/* View Warehouse Modal */}
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
              Chi tiết kho hàng
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Thông tin đầy đủ về kho hàng {selectedWarehouseForView?.name}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 4 }}>
          {selectedWarehouseForView && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Warehouse Header */}
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
                    bgcolor: selectedWarehouseForView.is_active === 1 ? 'primary.light' : 'error.light',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    <Warehouse sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                      {selectedWarehouseForView.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Mã: {selectedWarehouseForView.code}
                    </Typography>
                  </Box>
                  <Chip
                    label={selectedWarehouseForView.is_active === 1 ? 'Hoạt động' : 'Không hoạt động'}
                    color={selectedWarehouseForView.is_active === 1 ? 'success' : 'error'}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Box>

              {/* Warehouse Details */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
                <Box sx={{
                  p: 3,
                  borderRadius: 2,
                  background: 'rgba(102, 126, 234, 0.05)',
                  border: '1px solid rgba(102, 126, 234, 0.2)'
                }}>
                  <Typography variant="subtitle2" fontWeight="bold" color="primary.main" sx={{ mb: 2 }}>
                    Thông tin cơ bản
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Tên kho hàng:</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {selectedWarehouseForView.name}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Mã kho hàng:</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {selectedWarehouseForView.code}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Trạng thái:</Typography>
                      <Typography variant="body1" fontWeight="500" color={selectedWarehouseForView.is_active === 1 ? 'success.main' : 'error.main'}>
                        {selectedWarehouseForView.is_active === 1 ? 'Đang hoạt động' : 'Không hoạt động'}
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
                    Thông tin quản lý
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">ID Quản lý:</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {selectedWarehouseForView.manager_id || 'Chưa có'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Địa chỉ:</Typography>
                      <Typography variant="body1" fontWeight="500" sx={{
                        lineHeight: 1.5,
                        wordBreak: 'break-word'
                      }}>
                        {selectedWarehouseForView.address || 'Chưa có'}
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

export default WarehouseManagement;