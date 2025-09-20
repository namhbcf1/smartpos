import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Skeleton,
  Avatar,
  LinearProgress,
  Pagination,
  CircularProgress,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  People as PeopleIcon,
  AttachMoney as CommissionIcon,
  Work as WorkIcon,
  AdminPanelSettings as AdminIcon,
  PointOfSale as CashierIcon,
  TrendingUp as SalesIcon,
  Group as AffiliateIcon,
  Security as SecurityIcon,
  GetApp as ExportIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '../config/constants';
import PermissionManagementModal from '../components/PermissionManagementModal';
import RoleTemplateManager from '../components/RoleTemplateManager';
import { EmployeeForm } from '../components/EmployeeForm';
import { EmployeeFilters } from '../components/EmployeeFilters';
import {
  Employee,
  EmployeeFilters as IEmployeeFilters,
  employeeApi,
  formatEmployeeRole,
  formatEmployeeStatus
} from '../../services/employeeApi';
import {
  formatSalaryForDisplay,
  formatCommissionForDisplay
} from '../utils/employeeValidation';

// Helper functions
const getRoleColor = (role: Employee['role']): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (role) {
    case 'admin': return 'error';
    case 'cashier': return 'primary';
    case 'sales_agent': return 'info';
    case 'affiliate': return 'success';
    default: return 'default';
  }
};

const getRoleIcon = (role: Employee['role']) => {
  switch (role) {
    case 'admin': return <AdminIcon />;
    case 'cashier': return <CashierIcon />;
    case 'sales_agent': return <SalesIcon />;
    case 'affiliate': return <AffiliateIcon />;
    default: return <WorkIcon />;
  }
};



const EmployeeCommission = () => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  // State
  const [filters, setFilters] = useState<IEmployeeFilters>({
    status: 'active',
    page: 1,
    limit: 10
  });
  const [openEmployeeForm, setOpenEmployeeForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [openPermissionDialog, setOpenPermissionDialog] = useState(false);
  const [selectedEmployeeForPermissions, setSelectedEmployeeForPermissions] = useState<Employee | null>(null);
  const [openRoleTemplateManager, setOpenRoleTemplateManager] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);

  // Fetch employees data with new API
  const {
    data: employeesData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['employees', filters],
    queryFn: () => employeeApi.getEmployees(filters),
    placeholderData: (previousData) => previousData
  });

  // Fetch employee statistics
  const {
    data: stats,
    isLoading: statsLoading
  } = useQuery({
    queryKey: ['employee-stats'],
    queryFn: () => employeeApi.getEmployeeStats(),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const employees = employeesData?.data || [];
  const pagination = employeesData?.pagination;

  // Delete employee mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => employeeApi.deleteEmployee(id),
    onSuccess: () => {
      enqueueSnackbar('Xóa nhân viên thành công!', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee-stats'] });
    },
    onError: (error: Error) => {
      enqueueSnackbar(`Lỗi xóa nhân viên: ${error.message}`, { variant: 'error' });
    }
  });

  // Bulk status update mutation
  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: number[], status: Employee['status'] }) =>
      employeeApi.bulkUpdateStatus(ids, status),
    onSuccess: () => {
      enqueueSnackbar('Cập nhật trạng thái thành công!', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee-stats'] });
      setSelectedEmployees([]);
    },
    onError: (error: Error) => {
      enqueueSnackbar(`Lỗi cập nhật trạng thái: ${error.message}`, { variant: 'error' });
    }
  });

  // Event handlers
  const handleFiltersChange = (newFilters: IEmployeeFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: filters.limit || 10
    });
  };

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setOpenEmployeeForm(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setOpenEmployeeForm(true);
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa nhân viên "${employee.full_name}"?`)) {
      deleteMutation.mutate(employee.id);
    }
  };

  const handleManagePermissions = (employee: Employee) => {
    setSelectedEmployeeForPermissions(employee);
    setOpenPermissionDialog(true);
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };



  const handleBulkStatusUpdate = (status: Employee['status']) => {
    if (selectedEmployees.length === 0) {
      enqueueSnackbar('Vui lòng chọn ít nhất một nhân viên', { variant: 'warning' });
      return;
    }

    const action = status === 'active' ? 'kích hoạt' : 'vô hiệu hóa';
    if (window.confirm(`Bạn có chắc chắn muốn ${action} ${selectedEmployees.length} nhân viên đã chọn?`)) {
      bulkStatusMutation.mutate({ ids: selectedEmployees, status });
    }
  };

  const handleSelectEmployee = (employeeId: number) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAllEmployees = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map(emp => emp.id));
    }
  };


  // Loading states
  const isAnyLoading = isLoading || deleteMutation.isPending || bulkStatusMutation.isPending;







  const handleClosePermissionDialog = () => {
    setOpenPermissionDialog(false);
    setSelectedEmployeeForPermissions(null);
  };

  const handlePermissionsUpdated = () => {
    // Refresh employee data if needed
    refetch();
  };

  // Loading state
  if (isLoading && !employees.length) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={300} height={40} />
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Lỗi tải dữ liệu nhân viên: {error.message}
        </Alert>
        <Button variant="contained" onClick={() => refetch()}>
          Thử lại
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon />
            Quản lý nhân viên
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quản lý nhân viên, vai trò và hệ thống hoa hồng
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
            disabled={isAnyLoading}
          >
            Làm mới
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            disabled={isAnyLoading}
            color="info"
          >
            Xuất Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<SecurityIcon />}
            onClick={() => setOpenRoleTemplateManager(true)}
            color="info"
          >
            Quản lý vai trò
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddEmployee}
            disabled={isAnyLoading}
          >
            Thêm nhân viên
          </Button>
        </Stack>
      </Box>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Tổng nhân viên
                  </Typography>
                  <Typography variant="h4">
                    {statsLoading ? <CircularProgress size={24} /> : (stats?.totalEmployees || 0)}
                  </Typography>
                </Box>
                <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Đang hoạt động
                  </Typography>
                  <Typography variant="h4">
                    {statsLoading ? <CircularProgress size={24} /> : (stats?.activeEmployees || 0)}
                  </Typography>
                </Box>
                <WorkIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Tổng lương cơ bản
                  </Typography>
                  <Typography variant="h4">
                    {statsLoading ? <CircularProgress size={24} /> : formatCurrency(stats?.totalBaseSalary || 0)}
                  </Typography>
                </Box>
                <CommissionIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Hoa hồng TB
                  </Typography>
                  <Typography variant="h4">
                    {statsLoading ? <CircularProgress size={24} /> : `${(stats?.averageCommission || 0).toFixed(1)}%`}
                  </Typography>
                </Box>
                <CommissionIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <EmployeeFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        totalCount={pagination?.total || 0}
        filteredCount={employees.length}
      />

      {/* Bulk Actions */}
      {selectedEmployees.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.50' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body1">
              Đã chọn {selectedEmployees.length} nhân viên
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleBulkStatusUpdate('active')}
                disabled={bulkStatusMutation.isPending}
              >
                Kích hoạt
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleBulkStatusUpdate('inactive')}
                disabled={bulkStatusMutation.isPending}
              >
                Vô hiệu hóa
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setSelectedEmployees([])}
              >
                Bỏ chọn
              </Button>
            </Stack>
          </Box>
        </Paper>
      )}

      {/* Employee Table */}
      {isLoading ? (
        <Paper sx={{ p: 2 }}>
          <LinearProgress />
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Đang tải dữ liệu nhân viên...
            </Typography>
          </Box>
        </Paper>
      ) : employees.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Không có nhân viên nào
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {filters.search || filters.role || filters.status !== 'active'
              ? 'Không tìm thấy nhân viên phù hợp với bộ lọc'
              : 'Chưa có nhân viên nào trong hệ thống'
            }
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddEmployee}
          >
            Thêm nhân viên đầu tiên
          </Button>
        </Paper>
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.length === employees.length && employees.length > 0}
                      onChange={handleSelectAllEmployees}
                    />
                  </TableCell>
                  <TableCell>Nhân viên</TableCell>
                  <TableCell>Vai trò</TableCell>
                  <TableCell align="right">Lương cơ bản</TableCell>
                  <TableCell align="center">Hoa hồng</TableCell>
                  <TableCell align="center">Trạng thái</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow
                    key={employee.id}
                    hover
                    selected={selectedEmployees.includes(employee.id)}
                  >
                    <TableCell padding="checkbox">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(employee.id)}
                        onChange={() => handleSelectEmployee(employee.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: getRoleColor(employee.role) }}>
                          {getRoleIcon(employee.role)}
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle2" fontWeight="medium">
                              {employee.full_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {employee.email}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {employee.phone}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={formatEmployeeRole(employee.role)}
                          color={getRoleColor(employee.role)}
                          size="small"
                          icon={getRoleIcon(employee.role)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatSalaryForDisplay(employee.base_salary)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight="medium" color="primary">
                          {formatCommissionForDisplay(employee.commission_rate)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={formatEmployeeStatus(employee.status)}
                          color={employee.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="Chỉnh sửa thông tin">
                            <IconButton
                              size="small"
                              onClick={() => handleEditEmployee(employee)}
                              color="primary"
                              disabled={isAnyLoading}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Quản lý quyền hạn">
                            <IconButton
                              size="small"
                              onClick={() => handleManagePermissions(employee)}
                              color="info"
                              disabled={isAnyLoading}
                            >
                              <SecurityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa nhân viên">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteEmployee(employee)}
                              color="error"
                              disabled={isAnyLoading}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary">
                Hiển thị {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} của {pagination.total} nhân viên
              </Typography>
              <Pagination
                count={pagination.pages}
                page={pagination.page}
                onChange={(_, page) => handlePageChange(page)}
                color="primary"
              />
            </Box>
          )}
        </Paper>
      )}

      {/* Employee Form */}
      <EmployeeForm
        open={openEmployeeForm}
        onClose={() => setOpenEmployeeForm(false)}
        employee={selectedEmployee}
        onSuccess={() => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ['employee-stats'] });
        }}
      />





      {/* Permission Management Modal */}
      <PermissionManagementModal
        open={openPermissionDialog}
        onClose={handleClosePermissionDialog}
        employee={selectedEmployeeForPermissions}
        onPermissionsUpdated={handlePermissionsUpdated}
      />

      {/* Role Template Manager */}
      <RoleTemplateManager
        open={openRoleTemplateManager}
        onClose={() => setOpenRoleTemplateManager(false)}
        onRoleTemplateCreated={() => {
          // Refresh data if needed
          refetch();
        }}
      />
    </Box>
  );
};

export default EmployeeCommission;
