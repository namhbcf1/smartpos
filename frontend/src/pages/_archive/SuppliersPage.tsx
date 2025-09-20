import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  InputAdornment,
  TextField,
  Typography,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { formatCurrency } from '../../config/constants';
import { usePaginatedQuery } from '../../../hooks/useApiData';
import api from '../../services/api';

// Types
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
  created_at: string;
  updated_at: string;
}

interface SupplierFormData {
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  tax_number: string;
  notes: string;
  is_active: boolean;
}

const SuppliersPage: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    tax_number: '',
    notes: '',
    is_active: true
  });

  // Build query parameters
  const queryParams = {
    search: searchTerm || undefined,
    is_active: statusFilter === 'all' ? undefined : statusFilter === 'active'
  };

  // Fetch suppliers data
  const {
    data: suppliers,
    pagination,
    isLoading,
    error,
    refetch,
    page,
    limit,
    handlePageChange,
    handleLimitChange
  } = usePaginatedQuery<Supplier>('/suppliers', queryParams);

  // Handle search
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    handlePageChange(1); // Reset to first page when searching
  };

  // Handle status filter
  const handleStatusFilter = (status: 'all' | 'active' | 'inactive') => {
    setStatusFilter(status);
    handlePageChange(1); // Reset to first page when filtering
  };

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    handlePageChange(newPage + 1); // Convert 0-based to 1-based
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleLimitChange(parseInt(event.target.value, 10));
  };

  // Handle form
  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        contact_person: supplier.contact_person || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        tax_number: supplier.tax_number || '',
        notes: supplier.notes || '',
        is_active: supplier.is_active
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        tax_number: '',
        notes: '',
        is_active: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSupplier(null);
  };

  const handleFormChange = (field: keyof SupplierFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      const url = editingSupplier
        ? `/suppliers/${editingSupplier.id}`
        : '/suppliers';
      
      const method = editingSupplier ? 'PUT' : 'POST';
      
      const result = editingSupplier
        ? await api.put(url.replace('/suppliers', '/suppliers'), formData)
        : await api.post(url.replace('/suppliers', '/suppliers'), formData);

      if (result.success) {
        enqueueSnackbar(
          editingSupplier ? 'Cập nhật nhà cung cấp thành công' : 'Tạo nhà cung cấp thành công',
          { variant: 'success' }
        );
        handleCloseDialog();
        refetch();
      } else {
        enqueueSnackbar(result.message || 'Có lỗi xảy ra', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error saving supplier:', error);
      enqueueSnackbar('Có lỗi xảy ra khi lưu nhà cung cấp', { variant: 'error' });
    }
  };

  const handleDelete = async (supplier: Supplier) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa nhà cung cấp "${supplier.name}"?`)) {
      return;
    }

    try {
      const result = await api.delete(`/suppliers/${supplier.id}`);

      if (result.success) {
        enqueueSnackbar('Xóa nhà cung cấp thành công', { variant: 'success' });
        refetch();
      } else {
        enqueueSnackbar(result.message || 'Có lỗi xảy ra', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
      enqueueSnackbar('Có lỗi xảy ra khi xóa nhà cung cấp', { variant: 'error' });
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 3
        }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}>
              <BusinessIcon sx={{ fontSize: 'inherit' }} />
              Quản lý nhà cung cấp
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Quản lý thông tin nhà cung cấp và đối tác
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refetch}
              size={isMobile ? "small" : "medium"}
            >
              Làm mới
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              size={isMobile ? "small" : "medium"}
            >
              Thêm nhà cung cấp
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  placeholder="Tìm kiếm nhà cung cấp..."
                  value={searchTerm}
                  onChange={handleSearch}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Trạng thái</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Trạng thái"
                    onChange={(e) => handleStatusFilter(e.target.value as any)}
                  >
                    <MenuItem value="all">Tất cả</MenuItem>
                    <MenuItem value="active">Đang hoạt động</MenuItem>
                    <MenuItem value="inactive">Ngừng hoạt động</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Content */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Suppliers Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nhà cung cấp</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Liên hệ</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Thông tin</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Không có nhà cung cấp nào
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier) => (
                  <TableRow key={supplier.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {supplier.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {supplier.id}
                          {supplier.tax_number && ` | MST: ${supplier.tax_number}`}
                        </Typography>
                        {/* Mobile view - show additional info */}
                        <Box sx={{ display: { xs: 'block', sm: 'none' }, mt: 0.5 }}>
                          {supplier.contact_person && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Liên hệ: {supplier.contact_person}
                            </Typography>
                          )}
                          {supplier.phone && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              SĐT: {supplier.phone}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      <Box>
                        {supplier.contact_person && (
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <BusinessIcon sx={{ fontSize: 16 }} />
                            {supplier.contact_person}
                          </Typography>
                        )}
                        {supplier.phone && (
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <PhoneIcon sx={{ fontSize: 16 }} />
                            {supplier.phone}
                          </Typography>
                        )}
                        {supplier.email && (
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <EmailIcon sx={{ fontSize: 16 }} />
                            {supplier.email}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      {supplier.address && (
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationIcon sx={{ fontSize: 16 }} />
                          {supplier.address}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={supplier.is_active ? 'Hoạt động' : 'Ngừng hoạt động'}
                        color={supplier.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="Chỉnh sửa">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(supplier)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(supplier)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {pagination && (
          <TablePagination
            component="div"
            count={pagination.total}
            page={page - 1} // Convert 1-based to 0-based for MUI
            onPageChange={handleChangePage}
            rowsPerPage={limit}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Số dòng mỗi trang:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} của ${count !== -1 ? count : `hơn ${to}`}`
            }
          />
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          {editingSupplier ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tên nhà cung cấp *"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Người liên hệ"
                value={formData.contact_person}
                onChange={(e) => handleFormChange('contact_person', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Số điện thoại"
                value={formData.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Địa chỉ"
                value={formData.address}
                onChange={(e) => handleFormChange('address', e.target.value)}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mã số thuế"
                value={formData.tax_number}
                onChange={(e) => handleFormChange('tax_number', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={formData.is_active}
                  label="Trạng thái"
                  onChange={(e) => handleFormChange('is_active', e.target.value)}
                >
                  <MenuItem value="active">Hoạt động</MenuItem>
                  <MenuItem value="inactive">Ngừng hoạt động</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ghi chú"
                value={formData.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Hủy
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.name.trim()}
          >
            {editingSupplier ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SuppliersPage;
