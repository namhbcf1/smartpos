import React, { useState, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Typography,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  FormControlLabel,
  Switch,
  Alert,
  Fade,
  Slide,
  Zoom,
  alpha
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Category as CategoryIcon,
  Inventory as ProductsIcon
} from '@mui/icons-material';
import { usePaginatedQuery, useDeleteMutation, useCreateMutation, useUpdateMutation } from '../../hooks/useApiData';
import ModernCard from '../components/ModernCard';
import ModernButton from '../components/ModernButton';
import { colors, gradients, shadows } from '../theme';
import toast from 'react-hot-toast';

// 🎨 Modern Animations
const slideInUp = keyframes`
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const scaleIn = keyframes`
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
`;

// 🎨 Modern Styled Components
const ModernContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  maxWidth: 'xl',
  minHeight: '100vh',
  backgroundColor: theme.palette.grey[50],
}));

const HeaderSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  animation: `${slideInUp} 0.6s ease-out`,
}));

const StatsCard = styled(ModernCard)(({ theme }) => ({
  height: '100%',
  background: 'rgba(30, 41, 59, 0.95)',
  backdropFilter: 'blur(20px)',
  border: `1px solid ${colors.gray[700]}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

  '&:hover': {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: shadows.large,
  },

  '&.primary': {
    borderColor: colors.primary[400],
    background: `linear-gradient(135deg,
      rgba(30, 41, 59, 0.95) 0%,
      rgba(14, 165, 233, 0.1) 100%
    )`,
  },

  '&.success': {
    borderColor: colors.success[400],
    background: `linear-gradient(135deg,
      rgba(30, 41, 59, 0.95) 0%,
      rgba(34, 197, 94, 0.1) 100%
    )`,
  },
}));

const ActionBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
  background: 'rgba(30, 41, 59, 0.95)',
  backdropFilter: 'blur(20px)',
  borderRadius: 16,
  border: `1px solid ${colors.gray[700]}`,
  animation: `${slideInUp} 0.8s ease-out`,
}));

const ModernTable = styled(TableContainer)(({ theme }) => ({
  borderRadius: 20,
  background: 'rgba(30, 41, 59, 0.95)',
  backdropFilter: 'blur(20px)',
  border: `1px solid ${colors.gray[700]}`,
  boxShadow: shadows.soft,
  overflow: 'hidden',
  animation: `${slideInUp} 1s ease-out`,
}));

const SearchField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: 'rgba(51, 65, 85, 0.8)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',

    '&:hover': {
      backgroundColor: 'rgba(51, 65, 85, 0.9)',
    },

    '&.Mui-focused': {
      backgroundColor: 'rgba(51, 65, 85, 0.95)',
      transform: 'translateY(-2px)',
      boxShadow: shadows.colored.primary,
    },
  },
}));

// Types
interface Category {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  product_count?: number;
  created_at: string;
  updated_at: string;
}

const Categories: React.FC = () => {
  // Toast notifications

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'true' | 'false'>('');
  const [sortBy, setSortBy] = useState<'name' | 'product_count' | 'created_at'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [openDialog, setOpenDialog] = useState(false);
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Query parameters
  const queryParams = useMemo(() => ({
    search: debouncedSearchTerm,
    is_active: statusFilter === '' ? undefined : statusFilter,
    sortBy,
    sortDirection
  }), [debouncedSearchTerm, statusFilter, sortBy, sortDirection]);

  // Fetch categories
  const {
    data: categories,
    pagination,
    isLoading,
    refetch,
    handlePageChange,
    handleLimitChange,
    page,
    limit
  } = usePaginatedQuery<Category>('/categories', queryParams);

  // Fetch all categories for stats calculation (without pagination and filters)
  const {
    data: allCategories,
    isLoading: isLoadingStats
  } = usePaginatedQuery<Category>('/categories', {
    limit: 1000, // Get all categories for stats
    page: 1,
    sortBy: 'name',
    sortDirection: 'asc'
    // No filters for stats - get all categories
  });

  // Mutations
  const deleteCategory = useDeleteMutation();
  const createCategory = useCreateMutation();
  const updateCategory = useUpdateMutation();

  // Handlers
  const handleOpenDeleteDialog = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    setOpenDialog(true);
  };

  const handleDeleteCategory = async () => {
    if (selectedCategoryId) {
      const success = await deleteCategory.deleteItem(`/categories/${selectedCategoryId}`);
      if (success) {
        refetch();
        setOpenDialog(false);
        toast.success('Xóa danh mục thành công');
      } else {
                  toast.error('Không thể xóa danh mục');
      }
    }
  };

  const handleOpenCreateDialog = () => {
    setEditingCategory(null);
    resetForm();
    setOpenFormDialog(true);
  };

  const handleOpenEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      is_active: category.is_active
    });
    setOpenFormDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_active: true
    });
    setEditingCategory(null);
  };

  const handleSubmitForm = async () => {
    if (!formData.name.trim()) {
              toast.error('Tên danh mục không được để trống');
      return;
    }

    const submitData = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      is_active: formData.is_active
    };

    let response = null;
    if (editingCategory) {
      response = await updateCategory.update(`/categories/${editingCategory.id}`, submitData);
      if (response) {
        toast.success('Cập nhật danh mục thành công');
      } else {
                  toast.error('Không thể cập nhật danh mục');
      }
    } else {
      response = await createCategory.create('/categories', submitData);
      if (response) {
        toast.success('Tạo danh mục thành công');
      } else {
                  toast.error('Không thể tạo danh mục');
      }
    }

    if (response) {
      refetch();
      setOpenFormDialog(false);
      resetForm();
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setStatusFilter('');
  };

  const handleRefresh = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setStatusFilter('');
    refetch();
  };

  const toggleSort = (field: 'name' | 'product_count' | 'created_at') => {
    if (sortBy === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const exportCSV = () => {
    const rows = categories || [];
    if (!rows.length) {
      toast.error('Không có dữ liệu để xuất');
      return;
    }
    const headers = ['id','name','description','is_active','product_count','created_at'];
    const csv = [
      headers.join(','),
      ...rows.map((r: any) => [r.id, r.name, r.description ?? '', r.is_active, r.product_count ?? 0, r.created_at].map(v => JSON.stringify(v ?? '')).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'categories.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ModernContainer maxWidth="xl">
      <Box sx={{ py: { xs: 1, sm: 2 } }}>
        {/* Modern Header Section */}
        <HeaderSection>
          <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
            <Grid item>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  background: gradients.primary,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <CategoryIcon sx={{ fontSize: '2.5rem', color: colors.primary[500] }} />
                Quản lý danh mục
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                Tổ chức và quản lý danh mục sản phẩm một cách hiệu quả
              </Typography>
            </Grid>
            <Grid item>
              <ModernButton
                variant="contained"
                color="primary"
                size="large"
                startIcon={<AddIcon />}
                onClick={handleOpenCreateDialog}
                sx={{
                  background: gradients.primary,
                  borderRadius: '16px',
                  padding: '12px 24px',
                }}
              >
                Thêm danh mục
              </ModernButton>
            </Grid>
          </Grid>
        </HeaderSection>

        {/* Modern Stats Cards */}
        <Fade in timeout={800}>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard className="primary" icon={<CategoryIcon />}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: colors.primary[600] }}>
                    {isLoadingStats ? (
                      <Skeleton width={60} height={40} />
                    ) : (
                      allCategories?.length || 0
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Tổng danh mục
                  </Typography>
                </CardContent>
              </StatsCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard className="success" icon={<ActiveIcon />}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: colors.success[600] }}>
                    {isLoadingStats ? (
                      <Skeleton width={60} height={40} />
                    ) : (
                      allCategories?.filter(cat => cat.is_active).length || 0
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Đang hoạt động
                  </Typography>
                </CardContent>
              </StatsCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard icon={<InactiveIcon />}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: colors.error[600] }}>
                    {isLoadingStats ? (
                      <Skeleton width={60} height={40} />
                    ) : (
                      allCategories?.filter(cat => !cat.is_active).length || 0
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Không hoạt động
                  </Typography>
                </CardContent>
              </StatsCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard icon={<ProductsIcon />}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: colors.secondary[600] }}>
                    {isLoadingStats ? (
                      <Skeleton width={60} height={40} />
                    ) : (
                      allCategories?.reduce((total, cat) => total + (cat.product_count || 0), 0) || 0
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Sản phẩm
                  </Typography>
                </CardContent>
              </StatsCard>
            </Grid>
          </Grid>
        </Fade>

        {/* Modern Action Bar */}
        <ActionBar>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
            <SearchField
              label="Tìm kiếm danh mục"
              variant="outlined"
              size="medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: colors.gray[500] }} />
                  </InputAdornment>
                  ),
                }}
              />

            <FormControl size="medium" sx={{ minWidth: 200 }}>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as '' | 'true' | 'false')}
                label="Trạng thái"
                sx={{
                  borderRadius: 3,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="true">Hoạt động</MenuItem>
                <MenuItem value="false">Không hoạt động</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Làm mới">
              <ModernButton
                variant="outlined"
                size="medium"
                onClick={handleRefresh}
                sx={{ minWidth: 'auto', px: 2 }}
              >
                <RefreshIcon />
              </ModernButton>
            </Tooltip>
            <Tooltip title="Xóa bộ lọc">
              <ModernButton
                variant="outlined"
                size="medium"
                onClick={handleResetFilters}
                sx={{ minWidth: 'auto', px: 2 }}
              >
                <FilterIcon />
              </ModernButton>
            </Tooltip>
            <Tooltip title="Xuất CSV">
              <ModernButton
                variant="outlined"
                size="medium"
                onClick={exportCSV}
                sx={{ minWidth: 'auto', px: 2 }}
              >
                CSV
              </ModernButton>
            </Tooltip>
          </Box>
        </ActionBar>

        {/* Modern Categories Table */}
        <ModernTable>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell onClick={() => toggleSort('name')} sx={{ cursor: 'pointer' }}>
                  Tên danh mục {sortBy === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                </TableCell>
                <TableCell>Mô tả</TableCell>
                <TableCell align="center" onClick={() => toggleSort('product_count')} sx={{ cursor: 'pointer' }}>
                  Số sản phẩm {sortBy === 'product_count' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                </TableCell>
                <TableCell align="center">Trạng thái</TableCell>
                <TableCell align="center" onClick={() => toggleSort('created_at')} sx={{ cursor: 'pointer' }}>
                  Ngày tạo {sortBy === 'created_at' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                </TableCell>
                <TableCell align="center">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading ? (
                    Array.from(Array(limit)).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><Skeleton variant="text" /></TableCell>
                        <TableCell><Skeleton variant="text" /></TableCell>
                        <TableCell><Skeleton variant="text" /></TableCell>
                        <TableCell><Skeleton variant="circular" width={80} height={24} /></TableCell>
                        <TableCell><Skeleton variant="text" /></TableCell>
                        <TableCell><Skeleton variant="rectangular" width={80} height={32} /></TableCell>
                      </TableRow>
                    ))
                  ) : categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Alert severity="info" sx={{ m: 2 }}>
                          {searchTerm || statusFilter !== ''
                            ? 'Không tìm thấy danh mục nào phù hợp với bộ lọc'
                            : 'Chưa có danh mục nào. Hãy tạo danh mục đầu tiên!'
                          }
                        </Alert>
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category) => (
                      <TableRow key={category.id} hover>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            {category.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {category.description || 'Không có mô tả'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            icon={<ProductsIcon fontSize="small" />}
                            label={category.product_count || 0}
                            size="small"
                            sx={{
                              backgroundColor: colors.primary[100],
                              color: colors.primary[800],
                              fontWeight: 600,
                              borderRadius: '20px',
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            icon={category.is_active ? <ActiveIcon fontSize="small" /> : <InactiveIcon fontSize="small" />}
                            label={category.is_active ? "Hoạt động" : "Không hoạt động"}
                            className={category.is_active ? 'active' : 'inactive'}
                            sx={{
                              backgroundColor: category.is_active
                                ? colors.success[100]
                                : colors.error[100],
                              color: category.is_active
                                ? colors.success[800]
                                : colors.error[800],
                              border: `1px solid ${category.is_active
                                ? colors.success[300]
                                : colors.error[300]}`,
                              fontWeight: 600,
                              borderRadius: '20px',
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&:hover': {
                                transform: 'scale(1.05)',
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {new Date(category.created_at).toLocaleDateString('vi-VN')}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Tooltip title="Sửa">
                              <ModernButton
                                variant="outlined"
                                size="small"
                                onClick={() => handleOpenEditDialog(category)}
                                sx={{
                                  minWidth: 'auto',
                                  px: 1.5,
                                  borderColor: colors.primary[300],
                                  color: colors.primary[600],
                                  '&:hover': {
                                    borderColor: colors.primary[500],
                                    backgroundColor: colors.primary[50],
                                  }
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </ModernButton>
                            </Tooltip>
                            <Tooltip title="Xóa">
                              <ModernButton
                                variant="outlined"
                                size="small"
                                onClick={() => handleOpenDeleteDialog(category.id)}
                                disabled={Boolean(category.product_count && category.product_count > 0)}
                                sx={{
                                  minWidth: 'auto',
                                  px: 1.5,
                                  borderColor: colors.error[300],
                                  color: colors.error[600],
                                  '&:hover': {
                                    borderColor: colors.error[500],
                                    backgroundColor: colors.error[50],
                                  },
                                  '&.Mui-disabled': {
                                    borderColor: colors.gray[200],
                                    color: colors.gray[400],
                                  }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </ModernButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

            {/* Modern Pagination */}
            {pagination && (
              <Box sx={{
                p: 2,
                borderTop: `1px solid ${colors.gray[200]}`,
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
              }}>
                <TablePagination
                  component="div"
                  count={pagination.total}
                  page={page - 1}
                  rowsPerPage={limit}
                  onPageChange={(_, newPage) => handlePageChange(newPage + 1)}
                  onRowsPerPageChange={(e) => handleLimitChange(parseInt(e.target.value, 10))}
                  labelRowsPerPage="Hiển thị:"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count}`}
                  rowsPerPageOptions={[10, 25, 50, 100]}
                  sx={{
                    '& .MuiTablePagination-toolbar': {
                      paddingLeft: 0,
                      paddingRight: 0,
                    },
                    '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                      fontWeight: 500,
                      color: colors.gray[600],
                    },
                    '& .MuiIconButton-root': {
                      borderRadius: '8px',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        backgroundColor: colors.primary[50],
                        transform: 'scale(1.1)',
                      },
                    },
                  }}
                />
              </Box>
            )}
        </ModernTable>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      >
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xóa danh mục này không? Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <ModernButton
            variant="outlined"
            onClick={() => setOpenDialog(false)}
          >
            Hủy
          </ModernButton>
          <ModernButton
            variant="contained"
            color="error"
            onClick={handleDeleteCategory}
            loading={deleteCategory.loading}
          >
            Xóa
          </ModernButton>
        </DialogActions>
      </Dialog>

      {/* Create/Edit Category Dialog */}
      <Dialog
        open={openFormDialog}
        onClose={() => setOpenFormDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Tên danh mục *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                error={!formData.name.trim()}
                helperText={!formData.name.trim() ? 'Tên danh mục không được để trống' : ''}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Mô tả"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={3}
                placeholder="Nhập mô tả cho danh mục..."
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                }
                label="Kích hoạt danh mục"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <ModernButton
            variant="outlined"
            onClick={() => setOpenFormDialog(false)}
          >
            Hủy
          </ModernButton>
          <ModernButton
            onClick={handleSubmitForm}
            variant="contained"
            color="primary"
            loading={createCategory.loading || updateCategory.loading}
            disabled={!formData.name.trim()}
          >
            {editingCategory ? 'Cập nhật' : 'Tạo mới'}
          </ModernButton>
        </DialogActions>
      </Dialog>
    </ModernContainer>
  );
};

export default Categories;
