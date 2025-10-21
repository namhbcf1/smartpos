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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Search,
  Add,
  Refresh,
  Visibility,
  Edit,
  Delete,
  AttachMoney,
  FilterList,
  CheckCircle,
  Warning,
  SearchOff,
  Clear,
  GridView,
  ViewList,
  TrendingUp,
  Payment,
  Person,
  Business,
  Schedule,
  Assessment,
  Notes,
  Event,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debtsAPI } from '../../services/api';

// Debt Form Component
interface DebtFormProps {
  open: boolean;
  onClose: () => void;
  debt?: any;
}

const DebtForm: React.FC<DebtFormProps> = ({ open, onClose, debt }) => {
  const [formData, setFormData] = useState({
    customer_id: debt?.customer_id || '',
    supplier_id: debt?.supplier_id || '',
    debt_type: debt?.debt_type || 'customer',
    amount: debt?.amount || '',
    paid_amount: debt?.paid_amount || '',
    due_date: debt?.due_date || '',
    notes: debt?.notes || '',
    status: debt?.status || 'unpaid',
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => debtsAPI.createDebt(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => debtsAPI.updateDebt(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debt) {
      updateMutation.mutate({ id: debt.id, data: formData });
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
            {debt ? 'Chỉnh sửa thông tin nợ' : 'Tạo khoản nợ mới'}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {debt ? 'Cập nhật thông tin khoản nợ' : 'Điền thông tin chi tiết để tạo khoản nợ mới'}
          </Typography>
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 4 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
            {/* Loại nợ */}
            <Box>
              <FormControl 
                fullWidth 
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
              >
                <InputLabel>Loại nợ</InputLabel>
                <Select
                  value={formData.debt_type}
                  onChange={handleChange('debt_type')}
                  label="Loại nợ"
                >
                  <MenuItem value="customer">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person sx={{ color: 'primary.main' }} />
                      Nợ khách hàng
                    </Box>
                  </MenuItem>
                  <MenuItem value="supplier">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Business sx={{ color: 'secondary.main' }} />
                      Nợ nhà cung cấp
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Số tiền */}
            <Box>
              <TextField
                fullWidth
                label="Số tiền"
                type="number"
                value={formData.amount}
                onChange={handleChange('amount')}
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
                      <AttachMoney sx={{ color: 'success.main' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Đã trả */}
            <Box>
              <TextField
                fullWidth
                label="Đã trả"
                type="number"
                value={formData.paid_amount}
                onChange={handleChange('paid_amount')}
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
                      <Payment sx={{ color: 'info.main' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Ngày đến hạn */}
            <Box>
              <TextField
                fullWidth
                label="Ngày đến hạn"
                type="date"
                value={formData.due_date}
                onChange={handleChange('due_date')}
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
                      <Event sx={{ color: 'warning.main' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* ID Khách hàng/Nhà cung cấp */}
            <Box>
              <TextField
                fullWidth
                label="ID Khách hàng/Nhà cung cấp"
                value={formData.customer_id || formData.supplier_id}
                onChange={(e) => {
                  if (formData.debt_type === 'customer') {
                    handleChange('customer_id')(e);
                  } else {
                    handleChange('supplier_id')(e);
                  }
                }}
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
                      {formData.debt_type === 'customer' ? 
                        <Person sx={{ color: 'primary.main' }} /> : 
                        <Business sx={{ color: 'secondary.main' }} />
                      }
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
                  value={formData.status}
                  onChange={handleChange('status')}
                  label="Trạng thái"
                >
                  <MenuItem value="unpaid">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        backgroundColor: 'error.main' 
                      }} />
                      Chưa trả
                    </Box>
                  </MenuItem>
                  <MenuItem value="partial">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        backgroundColor: 'warning.main' 
                      }} />
                      Trả một phần
                    </Box>
                  </MenuItem>
                  <MenuItem value="paid">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        backgroundColor: 'success.main' 
                      }} />
                      Đã trả
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
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
                placeholder="Nhập ghi chú chi tiết về khoản nợ..."
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
                      <Notes sx={{ color: 'text.secondary' }} />
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
                {debt ? 'Đang cập nhật...' : 'Đang tạo...'}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {debt ? <Edit /> : <Add />}
                {debt ? 'Cập nhật nợ' : 'Tạo nợ mới'}
              </Box>
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Main Debt Management Component
const DebtManagement: React.FC = () => {
  // State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('table');
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    debt_type: '',
    sortBy: 'created_at',
    sortOrder: 'desc' as 'asc' | 'desc'
  });
  
  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDebts, setSelectedDebts] = useState<Set<string>>(new Set());
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [isLoading] = useState(false);

  const queryClient = useQueryClient();

  // Fetch debts with filtering
  const { data: debtsData, isLoading: debtsLoading, error, refetch } = useQuery({
    queryKey: ['debts', page, pageSize, searchTerm, filters],
    queryFn: async () => {
      console.log('Fetching debts with params:', { page, pageSize, searchTerm, filters });
      const response = await debtsAPI.getDebts(page, pageSize, searchTerm || undefined);
      console.log('Debts API response:', response.data);
      return response;
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting debt with ID:', id);
      const response = await debtsAPI.deleteDebt(id);
      console.log('Delete debt response:', response.data);
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      console.log('Debt deleted successfully:', id);
      alert('Nợ đã được xóa thành công!');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      alert('Lỗi khi xóa nợ: ' + (error.message || 'Không thể xóa nợ'));
    },
  });

  const debts = debtsData?.data?.debts?.results || [];

  // Basic analytics
  const analytics = useMemo(() => {
    if (!debts.length) return null;
    
    const totalDebts = debts.length;
    const totalAmount = debts.reduce((sum: number, debt: any) => sum + (debt.amount || 0), 0);
    const totalPaid = debts.reduce((sum: number, debt: any) => sum + (debt.paid_amount || 0), 0);
    const totalRemaining = totalAmount - totalPaid;
    const paidDebts = debts.filter((d: any) => d.status === 'paid').length;
    const unpaidDebts = debts.filter((d: any) => d.status === 'unpaid').length;
    
    return {
      totalDebts,
      totalAmount,
      totalPaid,
      totalRemaining,
      paidDebts,
      unpaidDebts,
      collectionRate: totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0
    };
  }, [debts]);

  // Filtered and sorted debts
  const filteredDebts = useMemo(() => {
    let filtered = [...debts];
    
    // Apply filters
    if (filters.status) {
      filtered = filtered.filter((d: any) => d.status === filters.status);
    }
    if (filters.debt_type) {
      filtered = filtered.filter((d: any) => d.debt_type === filters.debt_type);
    }
    
    // Sort debts
    filtered.sort((a: any, b: any) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'amount':
          aValue = a.amount || 0;
          bValue = b.amount || 0;
          break;
        case 'due_date':
          aValue = new Date(a.due_date || 0).getTime();
          bValue = new Date(b.due_date || 0).getTime();
          break;
        default:
          aValue = new Date(a.created_at || 0).getTime();
          bValue = new Date(b.created_at || 0).getTime();
      }
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [debts, filters]);

  // Event Handlers
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    console.log('Search term changed:', searchValue);
    setSearchTerm(searchValue);
    setPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    console.log('Refreshing debts...');
    refetch();
  }, [refetch]);

  const handleEdit = useCallback((debt: any) => {
    console.log('Edit debt:', debt);
    setSelectedDebt(debt);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    console.log('Delete debt:', id);
    if (window.confirm('Bạn có chắc chắn muốn xóa nợ này?')) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation]);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedDebtForView, setSelectedDebtForView] = useState<any>(null);

  const handleView = useCallback((debt: any) => {
    console.log('View debt:', debt);
    setSelectedDebtForView(debt);
    setViewModalOpen(true);
  }, []);

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
      debt_type: '',
      sortBy: 'created_at',
      sortOrder: 'desc' as 'asc' | 'desc'
    };
    setFilters(defaultFilters);
  }, []);

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Không thể tải dữ liệu nợ. Vui lòng kiểm tra kết nối mạng.
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
                    <AttachMoney sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                      Hệ thống quản lý nợ thông minh
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      Theo dõi và quản lý các khoản nợ khách hàng và nhà cung cấp
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Payment sx={{ fontSize: 20 }} />
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Theo dõi thanh toán
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp sx={{ fontSize: 20 }} />
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Báo cáo tài chính
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assessment sx={{ fontSize: 20 }} />
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Phân tích rủi ro
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<Assessment />}
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
                  Báo cáo tài chính
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setFormOpen(true)}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.3)'
                    }
                  }}
                >
                  Tạo nợ mới
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
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.3s ease',
            '&:hover': { transform: 'translateY(-4px)' }
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
                    {analytics?.totalDebts || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Tổng số nợ
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp sx={{ fontSize: 16 }} />
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Khách hàng & Nhà cung cấp
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <AttachMoney sx={{ fontSize: 28 }} />
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
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.3s ease',
            '&:hover': { transform: 'translateY(-4px)' }
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
                    {analytics?.totalAmount?.toLocaleString() || 0}₫
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Tổng giá trị nợ
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assessment sx={{ fontSize: 16 }} />
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Tất cả khoản nợ
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <Assessment sx={{ fontSize: 28 }} />
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
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.3s ease',
            '&:hover': { transform: 'translateY(-4px)' }
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
                    {analytics?.totalRemaining?.toLocaleString() || 0}₫
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Còn lại chưa trả
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Schedule sx={{ fontSize: 16 }} />
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Cần thu hồi
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <Schedule sx={{ fontSize: 28 }} />
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
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.3s ease',
            '&:hover': { transform: 'translateY(-4px)' }
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
                    {analytics?.collectionRate || 0}%
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Tỷ lệ thu hồi
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle sx={{ fontSize: 16 }} />
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Hiệu quả thu nợ
                    </Typography>
                  </Box>
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
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <CardContent>
          {/* Main Toolbar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            {/* Enhanced Search */}
            <TextField
              placeholder="Tìm kiếm theo khách hàng, nhà cung cấp, số tiền..."
              value={searchTerm}
              onChange={handleSearch}
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
                      sx={{ color: 'text.secondary' }}
                    >
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ 
                minWidth: 350, 
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'rgba(0,0,0,0.02)',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.04)'
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'white',
                    boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)'
                  }
                }
              }}
            />
            
            {/* Enhanced View Mode Toggle */}
            <Box sx={{ 
              display: 'flex', 
              border: 1, 
              borderColor: 'divider', 
              borderRadius: 2,
              overflow: 'hidden',
              backgroundColor: 'rgba(0,0,0,0.02)'
            }}>
              <IconButton
                onClick={() => setViewMode('table')}
                color={viewMode === 'table' ? 'primary' : 'default'}
                size="small"
                sx={{
                  borderRadius: 0,
                  backgroundColor: viewMode === 'table' ? 'primary.main' : 'transparent',
                  color: viewMode === 'table' ? 'white' : 'text.secondary',
                  '&:hover': {
                    backgroundColor: viewMode === 'table' ? 'primary.dark' : 'rgba(0,0,0,0.04)'
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
                  backgroundColor: viewMode === 'list' ? 'primary.main' : 'transparent',
                  color: viewMode === 'list' ? 'white' : 'text.secondary',
                  '&:hover': {
                    backgroundColor: viewMode === 'list' ? 'primary.dark' : 'rgba(0,0,0,0.04)'
                  }
                }}
              >
                <ViewList />
              </IconButton>
            </Box>

            {/* Enhanced Action Buttons */}
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setSelectedDebt(null);
                setFormOpen(true);
              }}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                }
              }}
            >
              Thêm nợ
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                px: 3,
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  transform: 'translateY(-1px)'
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
                fontWeight: 500,
                px: 3,
                borderColor: showFilters ? 'primary.main' : 'divider',
                color: showFilters ? 'primary.main' : 'text.secondary',
                backgroundColor: showFilters ? 'rgba(102, 126, 234, 0.08)' : 'transparent',
                '&:hover': {
                  backgroundColor: showFilters ? 'rgba(102, 126, 234, 0.12)' : 'rgba(0,0,0,0.04)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Bộ lọc
            </Button>
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
                      <MenuItem value="unpaid">Chưa trả</MenuItem>
                      <MenuItem value="partial">Trả một phần</MenuItem>
                      <MenuItem value="paid">Đã trả</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                <Box sx={{ flex: '1 1 20%', minWidth: '200px' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Loại nợ</InputLabel>
                    <Select
                      value={filters.debt_type}
                      onChange={(e) => handleFilterChange('debt_type', e.target.value)}
                      label="Loại nợ"
                    >
                      <MenuItem value="">Tất cả</MenuItem>
                      <MenuItem value="customer">Nợ khách hàng</MenuItem>
                      <MenuItem value="supplier">Nợ nhà cung cấp</MenuItem>
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
                      <MenuItem value="created_at">Ngày tạo</MenuItem>
                      <MenuItem value="amount">Số tiền</MenuItem>
                      <MenuItem value="due_date">Ngày đến hạn</MenuItem>
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
                      <MenuItem value="desc">Giảm dần</MenuItem>
                      <MenuItem value="asc">Tăng dần</MenuItem>
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

      {/* Debts Display */}
      {debtsLoading ? (
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
          {/* Debts Table */}
          {viewMode === 'table' ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Loại nợ</TableCell>
                    <TableCell>Số tiền</TableCell>
                    <TableCell>Đã trả</TableCell>
                    <TableCell>Còn lại</TableCell>
                    <TableCell>Ngày đến hạn</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDebts.map((debt: any) => (
                    <TableRow key={debt.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {debt.debt_type === 'customer' ? <Person /> : <Business />}
                          {debt.debt_type === 'customer' ? 'Khách hàng' : 'Nhà cung cấp'}
                        </Box>
                      </TableCell>
                      <TableCell>{debt.amount?.toLocaleString()}₫</TableCell>
                      <TableCell>{debt.paid_amount?.toLocaleString()}₫</TableCell>
                      <TableCell>{(debt.amount - debt.paid_amount)?.toLocaleString()}₫</TableCell>
                      <TableCell>{debt.due_date || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={debt.status === 'paid' ? 'Đã trả' : debt.status === 'partial' ? 'Trả một phần' : 'Chưa trả'}
                          color={debt.status === 'paid' ? 'success' : debt.status === 'partial' ? 'warning' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Xem chi tiết">
                            <IconButton size="small" onClick={() => handleView(debt)}>
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Chỉnh sửa">
                            <IconButton size="small" onClick={() => handleEdit(debt)}>
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa">
                            <IconButton size="small" color="error" onClick={() => handleDelete(debt.id)}>
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 3 }}>
              {filteredDebts.map((debt: any) => (
                <Card 
                  key={debt.id} 
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
                        bgcolor: debt.debt_type === 'customer' ? 'primary.light' : 'secondary.light',
                        width: 48,
                        height: 48
                      }}>
                        {debt.debt_type === 'customer' ? <Person /> : <Business />}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
                          {debt.debt_type === 'customer' ? 'Nợ khách hàng' : 'Nợ nhà cung cấp'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID: {debt.customer_id || debt.supplier_id || 'N/A'}
                        </Typography>
                      </Box>
                      <Chip
                        label={debt.status === 'paid' ? 'Đã trả' : debt.status === 'partial' ? 'Trả một phần' : 'Chưa trả'}
                        color={debt.status === 'paid' ? 'success' : debt.status === 'partial' ? 'warning' : 'error'}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                    
                    {/* Amount Info */}
                    <Box sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                      border: '1px solid rgba(0,0,0,0.05)',
                      mb: 3
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <AttachMoney sx={{ color: 'success.main', fontSize: 20 }} />
                        <Typography variant="body2" color="text.secondary" fontWeight="500">
                          Tổng số tiền
                        </Typography>
                      </Box>
                      <Typography variant="h4" fontWeight="bold" color="primary" sx={{ mb: 2 }}>
                        {debt.amount?.toLocaleString()}₫
                      </Typography>
                      
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            Đã trả
                          </Typography>
                          <Typography variant="h6" fontWeight="600" color="success.main">
                            {debt.paid_amount?.toLocaleString()}₫
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            Còn lại
                          </Typography>
                          <Typography variant="h6" fontWeight="600" color="error.main">
                            {(debt.amount - debt.paid_amount)?.toLocaleString()}₫
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    
                    {/* Due Date */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1, 
                      p: 2, 
                      borderRadius: 2,
                      backgroundColor: debt.due_date && new Date(debt.due_date) < new Date() ? 'rgba(244, 67, 54, 0.05)' : 'rgba(33, 150, 243, 0.05)',
                      border: `1px solid ${debt.due_date && new Date(debt.due_date) < new Date() ? 'rgba(244, 67, 54, 0.2)' : 'rgba(33, 150, 243, 0.2)'}`,
                      mb: 2
                    }}>
                      <Event sx={{ 
                        color: debt.due_date && new Date(debt.due_date) < new Date() ? 'error.main' : 'info.main',
                        fontSize: 20 
                      }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Ngày đến hạn
                        </Typography>
                        <Typography variant="body1" fontWeight="600">
                          {debt.due_date ? new Date(debt.due_date).toLocaleDateString('vi-VN') : 'Không có'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Notes */}
                    {debt.notes && (
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: 2,
                        backgroundColor: 'rgba(156, 39, 176, 0.05)',
                        border: '1px solid rgba(156, 39, 176, 0.2)'
                      }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Ghi chú
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {debt.notes}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                  
                  {/* Actions */}
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
                        onClick={() => handleView(debt)}
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
                        onClick={() => handleEdit(debt)}
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
                        onClick={() => handleDelete(debt.id)}
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
              ))}
            </Box>
          )}

          {/* Empty State */}
          {filteredDebts.length === 0 && !debtsLoading && (
            <Card sx={{ mt: 3 }}>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 3, bgcolor: 'grey.100' }}>
                  <SearchOff sx={{ fontSize: 40, color: 'grey.400' }} />
                </Avatar>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {searchTerm ? 'Không tìm thấy nợ' : 'Chưa có nợ nào'}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  {searchTerm 
                    ? `Không có nợ nào khớp với "${searchTerm}"`
                    : 'Bắt đầu bằng cách thêm nợ đầu tiên của bạn'
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
                  {searchTerm ? 'Thêm nợ mới' : 'Thêm nợ đầu tiên'}
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
          setSelectedDebt(null);
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

      {/* Debt Form Dialog */}
      <DebtForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        debt={selectedDebt}
      />

      {/* View Debt Modal */}
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
              Chi tiết khoản nợ
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Thông tin đầy đủ về khoản nợ
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 4 }}>
          {selectedDebtForView && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Debt Header */}
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
                    bgcolor: selectedDebtForView.debt_type === 'customer' ? 'primary.light' : 'secondary.light',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    {selectedDebtForView.debt_type === 'customer' ? <Person /> : <Business />}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                      {selectedDebtForView.debt_type === 'customer' ? 'Nợ khách hàng' : 'Nợ nhà cung cấp'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {selectedDebtForView.customer_id || selectedDebtForView.supplier_id || 'N/A'}
                    </Typography>
                  </Box>
                  <Chip
                    label={selectedDebtForView.status === 'paid' ? 'Đã trả' : 
                           selectedDebtForView.status === 'partial' ? 'Trả một phần' : 'Chưa trả'}
                    color={selectedDebtForView.status === 'paid' ? 'success' : 
                           selectedDebtForView.status === 'partial' ? 'warning' : 'error'}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Box>

              {/* Debt Details */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
                <Box sx={{
                  p: 3,
                  borderRadius: 2,
                  background: 'rgba(102, 126, 234, 0.05)',
                  border: '1px solid rgba(102, 126, 234, 0.2)'
                }}>
                  <Typography variant="subtitle2" fontWeight="bold" color="primary.main" sx={{ mb: 2 }}>
                    Thông tin tài chính
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Tổng số tiền:</Typography>
                      <Typography variant="h5" fontWeight="bold" color="primary">
                        {selectedDebtForView.amount?.toLocaleString()}₫
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Đã trả:</Typography>
                      <Typography variant="h6" fontWeight="600" color="success.main">
                        {selectedDebtForView.paid_amount?.toLocaleString()}₫
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Còn lại:</Typography>
                      <Typography variant="h6" fontWeight="600" color="error.main">
                        {(selectedDebtForView.amount - selectedDebtForView.paid_amount)?.toLocaleString()}₫
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
                      <Typography variant="body2" color="text.secondary">Ngày đến hạn:</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {selectedDebtForView.due_date ? 
                          new Date(selectedDebtForView.due_date).toLocaleDateString('vi-VN') : 
                          'Không có'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Ngày tạo:</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {new Date(selectedDebtForView.created_at).toLocaleString('vi-VN')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Cập nhật lần cuối:</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {new Date(selectedDebtForView.updated_at).toLocaleString('vi-VN')}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Notes */}
              {selectedDebtForView.notes && (
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
                    {selectedDebtForView.notes}
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

export default DebtManagement;