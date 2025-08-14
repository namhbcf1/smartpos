import React, { useState, useEffect } from 'react';
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
  Divider,
  Fab,
  useTheme,
  useMediaQuery,
  Typography,
  Stack
} from '@mui/material';
import { Add as AddIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { usePaginatedQuery } from '../../hooks/useApiData';
import api from '../../services/api';

// Import modular components
import { CustomersHeader } from './components/CustomersHeader';
import { CustomersFilters } from './components/CustomersFilters';
import { CustomersTable } from './components/CustomersTable';
import { CustomerForm } from './components/CustomerForm';
import { 
  Customer, 
  CustomerFilters, 
  CustomerStats,
  CustomerCreateData 
} from './components/types';

const Customers = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State Management
  const [filters, setFilters] = useState<CustomerFilters>({
    search: '',
    customer_type: 'all',
    is_vip: 'all',
    city: '',
    is_active: 'all',
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

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
    is_vip: filters.is_vip !== 'all' ? (filters.is_vip === 'true') : undefined,
    city: filters.city,
    is_active: filters.is_active !== 'all' ? (filters.is_active === 'true') : undefined,
    sort_by: filters.sort_by,
    sort_order: filters.sort_order
  });

  // Initialize component
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const statsData = await api.get<CustomerStats>('/customers/stats');
      setStats(statsData);
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  };

  // Event Handlers
  const handleNewCustomer = () => {
    setSelectedCustomer(null);
    setCreateDialogOpen(true);
  };

  const handleViewDetails = (customer: Customer) => {
    navigate(`/customers/${customer.id}`);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditDialogOpen(true);
  };

  const handleCreateCustomer = async (data: CustomerCreateData) => {
    try {
      setLoading(true);
      await api.post('/customers', data);
      enqueueSnackbar('Khách hàng đã được tạo thành công', { variant: 'success' });
      refetchCustomers();
      fetchStats();
      setCreateDialogOpen(false);
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || 'Lỗi khi tạo khách hàng', { variant: 'error' });
      console.error('Create customer error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCustomer = async (data: Partial<CustomerCreateData>) => {
    if (!selectedCustomer) return;

    try {
      setLoading(true);
      await api.put(`/customers/${selectedCustomer.id}`, data);
      enqueueSnackbar('Khách hàng đã được cập nhật thành công', { variant: 'success' });
      refetchCustomers();
      fetchStats();
      setEditDialogOpen(false);
      setSelectedCustomer(null);
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || 'Lỗi khi cập nhật khách hàng', { variant: 'error' });
      console.error('Update customer error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVIP = async (customerId: number, isVip: boolean) => {
    try {
      setLoading(true);
      await api.put(`/customers/${customerId}`, { is_vip: !isVip });
      enqueueSnackbar(`Đã ${!isVip ? 'thêm vào' : 'xóa khỏi'} danh sách VIP`, { variant: 'success' });
      refetchCustomers();
      fetchStats();
    } catch (err: any) {
      enqueueSnackbar('Lỗi khi cập nhật trạng thái VIP', { variant: 'error' });
      console.error('Toggle VIP error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLoyaltyPoints = async (customerId: number, points: number, description: string) => {
    try {
      setLoading(true);
      await api.post(`/customers/${customerId}/loyalty-points`, {
        points,
        description,
        reference_type: 'manual'
      });
      enqueueSnackbar('Đã thêm điểm thưởng thành công', { variant: 'success' });
      refetchCustomers();
      fetchStats();
    } catch (err: any) {
      enqueueSnackbar('Lỗi khi thêm điểm thưởng', { variant: 'error' });
      console.error('Add loyalty points error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    enqueueSnackbar('Chức năng xuất báo cáo sẽ được triển khai sớm', { variant: 'info' });
  };

  const handleAnalytics = () => {
    navigate('/reports/customer-analytics');
  };

  const handleRefresh = () => {
    refetchCustomers();
    fetchStats();
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      customer_type: 'all',
      is_vip: 'all',
      city: '',
      is_active: 'all',
      sort_by: 'created_at',
      sort_order: 'desc'
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
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <CustomersHeader
        stats={stats}
        onNewCustomer={handleNewCustomer}
        onExport={handleExport}
        onRefresh={handleRefresh}
        onAnalytics={handleAnalytics}
        loading={loading || customersLoading}
      />

      <Divider sx={{ my: 3 }} />

      <CustomersFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={handleClearFilters}
        customersCount={customers?.length || 0}
      />

      {customersLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!customersLoading && customers && (
        <>
          <CustomersTable
            customers={customers}
            onViewDetails={handleViewDetails}
            onEditCustomer={handleEditCustomer}
            onToggleVIP={handleToggleVIP}
            onAddLoyaltyPoints={handleAddLoyaltyPoints}
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

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="new customer"
          onClick={handleNewCustomer}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000
          }}
        >
          <PersonAddIcon />
        </Fab>
      )}

      {/* Create Customer Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <PersonAddIcon />
            <Typography variant="h6">Thêm khách hàng mới</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <CustomerForm
            onSubmit={handleCreateCustomer}
            loading={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            Hủy
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <PersonAddIcon />
            <Typography variant="h6">Chỉnh sửa khách hàng</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <CustomerForm
            customer={selectedCustomer}
            onSubmit={handleUpdateCustomer}
            loading={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Hủy
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Customers;
