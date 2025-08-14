import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  TablePagination,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { usePaginatedQuery } from '../hooks/useApiData';
import api from '../services/api';

// Import modular components
import { CustomerHeader } from './customers/components/CustomerHeader';
import { CustomerFiltersComponent } from './customers/components/CustomerFilters';
import { CustomerTable } from './customers/components/CustomerTable';
import {
  Customer,
  CustomerFormData,
  CustomerFilters,
  CustomerStats
} from './customers/components/types';

const CustomersNew = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // State Management
  const [filters, setFilters] = useState<CustomerFilters>({
    search: '',
    customer_type: 'all',
    status: 'all',
    city: '',
    loyalty_tier: 'all',
    date_range: {}
  });
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    customer_type: 'individual'
  });

  // Fetch customers with pagination and filters
  const {
    data: customers,
    loading: customersLoading,
    error: customersError,
    refetch: refetchCustomers,
    totalCount
  } = usePaginatedQuery<Customer>('/customers', {
    page: page + 1,
    limit: rowsPerPage,
    search: filters.search,
    customer_type: filters.customer_type !== 'all' ? filters.customer_type : undefined,
    status: filters.status !== 'all' ? filters.status : undefined,
    city: filters.city || undefined,
    loyalty_tier: filters.loyalty_tier !== 'all' ? filters.loyalty_tier : undefined,
    date_from: filters.date_range.start,
    date_to: filters.date_range.end
  });

  // Initialize component
  useEffect(() => {
    fetchStats();
    fetchCities();
  }, []);

  const fetchStats = async () => {
    try {
      const statsData = await api.get<CustomerStats>('/customers/stats');
      setStats(statsData);
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  };

  const fetchCities = async () => {
    try {
      const citiesData = await api.get<string[]>('/customers/cities');
      setCities(citiesData || []);
    } catch (err) {
      console.error('Cities fetch error:', err);
    }
  };

  // Event Handlers
  const handleAddCustomer = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      customer_type: 'individual'
    });
    setAddDialogOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      customer_type: customer.customer_type,
      company_name: customer.company_name,
      notes: customer.notes
    });
    setEditDialogOpen(true);
  };

  const handleDeleteCustomer = async (customerId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/customers/${customerId}`);
      enqueueSnackbar('Đã xóa khách hàng', { variant: 'success' });
      refetchCustomers();
      fetchStats();
    } catch (err) {
      enqueueSnackbar('Lỗi khi xóa khách hàng', { variant: 'error' });
      console.error('Delete customer error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (customer: Customer) => {
    navigate(`/customers/${customer.id}`);
  };

  const handleSaveCustomer = async () => {
    try {
      setLoading(true);
      
      if (selectedCustomer) {
        // Update existing customer
        await api.put(`/customers/${selectedCustomer.id}`, formData);
        enqueueSnackbar('Đã cập nhật thông tin khách hàng', { variant: 'success' });
        setEditDialogOpen(false);
      } else {
        // Create new customer
        await api.post('/customers', formData);
        enqueueSnackbar('Đã thêm khách hàng mới', { variant: 'success' });
        setAddDialogOpen(false);
      }
      
      refetchCustomers();
      fetchStats();
      setSelectedCustomer(null);
    } catch (err) {
      enqueueSnackbar('Lỗi khi lưu thông tin khách hàng', { variant: 'error' });
      console.error('Save customer error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    enqueueSnackbar('Chức năng nhập Excel sẽ được triển khai sớm', { variant: 'info' });
  };

  const handleExport = () => {
    enqueueSnackbar('Chức năng xuất dữ liệu sẽ được triển khai sớm', { variant: 'info' });
  };

  const handleRefresh = () => {
    refetchCustomers();
    fetchStats();
    fetchCities();
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      customer_type: 'all',
      status: 'all',
      city: '',
      loyalty_tier: 'all',
      date_range: {}
    });
    setPage(0);
  };

  // Pagination handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Form handlers
  const handleFormChange = (field: keyof CustomerFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (error || customersError) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || customersError}
        </Alert>
        <Button onClick={handleRefresh} variant="contained">
          Thử lại
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }} data-testid="customers-list">
      <CustomerHeader
        stats={stats}
        onAddCustomer={handleAddCustomer}
        onImport={handleImport}
        onExport={handleExport}
        onRefresh={handleRefresh}
        loading={loading || customersLoading}
      />

      <Divider sx={{ my: 3 }} />

      <CustomerFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        cities={cities}
        onClearFilters={handleClearFilters}
      />

      {customersLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!customersLoading && customers && (
        <>
          <CustomerTable
            customers={customers}
            onEdit={handleEditCustomer}
            onDelete={handleDeleteCustomer}
            onViewDetails={handleViewDetails}
            loading={loading}
          />

          <TablePagination
            component="div"
            count={totalCount || 0}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Số dòng mỗi trang:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} của ${count !== -1 ? count : `hơn ${to}`}`
            }
          />
        </>
      )}

      {/* Add Customer Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Thêm khách hàng mới</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Tên khách hàng *"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Loại khách hàng *</InputLabel>
                <Select
                  value={formData.customer_type}
                  onChange={(e) => handleFormChange('customer_type', e.target.value)}
                  label="Loại khách hàng *"
                >
                  <MenuItem value="individual">Cá nhân</MenuItem>
                  <MenuItem value="business">Doanh nghiệp</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Số điện thoại *"
                value={formData.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                fullWidth
              />
            </Grid>
            {formData.customer_type === 'business' && (
              <Grid item xs={12}>
                <TextField
                  label="Tên công ty"
                  value={formData.company_name || ''}
                  onChange={(e) => handleFormChange('company_name', e.target.value)}
                  fullWidth
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                label="Địa chỉ"
                value={formData.address || ''}
                onChange={(e) => handleFormChange('address', e.target.value)}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Ghi chú"
                value={formData.notes || ''}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>
            Hủy
          </Button>
          <Button 
            onClick={handleSaveCustomer}
            variant="contained"
            disabled={loading || !formData.name || !formData.phone}
          >
            Thêm khách hàng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Chỉnh sửa thông tin khách hàng</DialogTitle>
        <DialogContent>
          {/* Similar form as Add Dialog */}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Form fields similar to Add Dialog */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Tên khách hàng *"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                fullWidth
                required
              />
            </Grid>
            {/* Add other form fields as needed */}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Hủy
          </Button>
          <Button 
            onClick={handleSaveCustomer}
            variant="contained"
            disabled={loading || !formData.name || !formData.phone}
          >
            Cập nhật
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CustomersNew;
