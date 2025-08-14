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
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  useTheme,
  useMediaQuery,
  Skeleton,
  InputAdornment,
  Avatar,
  LinearProgress,
  Pagination,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  People as PeopleIcon,
  AttachMoney as CommissionIcon,
  Work as WorkIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  AdminPanelSettings as AdminIcon,
  PointOfSale as CashierIcon,
  TrendingUp as SalesIcon,
  Group as AffiliateIcon,
  VpnKey as PasswordIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { usePaginatedQuery } from '../hooks/useApiData';
import { formatCurrency } from '../config/constants';
import api from '../services/api';
import axios from 'axios';
import PermissionManagementModal from '../components/PermissionManagementModal';
import RoleTemplateManager from '../components/RoleTemplateManager';

// Types
interface Employee {
  id: number;
  full_name: string;
  phone: string | null;
  email: string | null;
  role: 'admin' | 'cashier' | 'sales_agent' | 'affiliate';
  commission_rate: number;
  base_salary: number;
  hire_date: string;
  status: 'active' | 'inactive';
  notes: string | null;
  created_at: string;
}

// Helper functions
const getRoleLabel = (role: Employee['role']) => {
  switch (role) {
    case 'admin': return 'Quản trị viên';
    case 'cashier': return 'Thu ngân';
    case 'sales_agent': return 'Nhân viên kinh doanh';
    case 'affiliate': return 'Cộng tác viên';
    default: return role;
  }
};

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [openDialog, setOpenDialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [selectedEmployeeForPassword, setSelectedEmployeeForPassword] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [openPermissionDialog, setOpenPermissionDialog] = useState(false);
  const [selectedEmployeeForPermissions, setSelectedEmployeeForPermissions] = useState<Employee | null>(null);
  const [openRoleTemplateManager, setOpenRoleTemplateManager] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    role: 'cashier' as Employee['role'],
    commission_rate: 0,
    base_salary: 0,
    status: 'active' as Employee['status'],
    notes: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false
  });
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {};

    if (searchTerm.trim()) {
      params.search = searchTerm.trim();
    }

    if (roleFilter) {
      params.role = roleFilter;
    }

    if (statusFilter) {
      params.status = statusFilter;
    }

    return params;
  }, [searchTerm, roleFilter, statusFilter]);

  // Fetch employees data
  const {
    data: employees,
    pagination,
    isLoading,
    error,
    refetch,
    handlePageChange,
    handleLimitChange,
    page: currentPage,
    limit: currentLimit
  } = usePaginatedQuery<Employee>('/employees/simple', queryParams);

  // Role options
  const roleOptions = [
    { value: 'admin', label: '👑 Quản trị viên', color: 'error' as const },
    { value: 'cashier', label: '💰 Thu ngân', color: 'primary' as const },
    { value: 'sales_agent', label: '🤝 Nhân viên kinh doanh', color: 'success' as const },
    { value: 'affiliate', label: '🌟 Cộng tác viên', color: 'warning' as const }
  ];

  const getRoleInfo = (role: string) => {
    return roleOptions.find(option => option.value === role) || roleOptions[1];
  };

  // Statistics
  const stats = useMemo(() => {
    if (!employees || employees.length === 0) {
      return {
        totalEmployees: 0,
        activeEmployees: 0,
        totalSalary: 0,
        avgCommission: 0
      };
    }

    return {
      totalEmployees: pagination?.total || 0,
      activeEmployees: employees.filter(emp => emp.status === 'active').length,
      totalSalary: employees.reduce((sum, emp) => sum + (emp.base_salary || 0), 0),
      avgCommission: employees.length > 0 
        ? employees.reduce((sum, emp) => sum + (emp.commission_rate || 0), 0) / employees.length 
        : 0
    };
  }, [employees, pagination]);

  // Handle form
  const handleOpenDialog = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        full_name: employee.full_name,
        phone: employee.phone || '',
        email: employee.email || '',
        role: employee.role,
        commission_rate: employee.commission_rate || 0,
        base_salary: employee.base_salary || 0,
        status: employee.status,
        notes: employee.notes || ''
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        full_name: '',
        phone: '',
        email: '',
        role: 'cashier',
        commission_rate: 0,
        base_salary: 0,
        status: 'active',
        notes: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingEmployee(null);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (!formData.full_name.trim()) {
        enqueueSnackbar('Vui lòng nhập tên nhân viên', { variant: 'error' });
        return;
      }

      const payload = {
        ...formData,
        commission_rate: Number(formData.commission_rate),
        base_salary: Number(formData.base_salary)
      };

      if (editingEmployee) {
        // Update
        const response = await api.put(`/employees/${editingEmployee.id}`, payload);
        if (response.success) {
          enqueueSnackbar('Cập nhật nhân viên thành công', { variant: 'success' });
          refetch();
          handleCloseDialog();
        }
      } else {
        // Create
        const response = await api.post('/employees', payload);
        if (response.success) {
          enqueueSnackbar('Tạo nhân viên thành công', { variant: 'success' });
          refetch();
          handleCloseDialog();
        }
      }
    } catch (error) {
      console.error('Submit employee error:', error);
      enqueueSnackbar('Lỗi khi lưu thông tin nhân viên', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (employee: Employee) => {
    if (!confirm(`Bạn có chắc muốn xóa nhân viên "${employee.full_name}"?`)) {
      return;
    }

    try {
      const response = await api.delete(`/employees/${employee.id}`);
      if (response.success) {
        enqueueSnackbar('Xóa nhân viên thành công', { variant: 'success' });
        refetch();
      }
    } catch (error) {
      console.error('Delete employee error:', error);
      enqueueSnackbar('Lỗi khi xóa nhân viên', { variant: 'error' });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setStatusFilter('active');
  };

  // Password management functions
  const handleOpenPasswordDialog = (employee: Employee) => {
    console.log('🔍 Opening password dialog for employee:', employee);
    setSelectedEmployeeForPassword(employee);

    // For now, let's use a simpler approach - just set defaults and open dialog
    setPasswordForm({
      username: employee.full_name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '') || `user${employee.id}`,
      password: '123456', // Default password
      confirmPassword: '',
      showPassword: false,
      showConfirmPassword: false
    });

    setOpenPasswordDialog(true);

    // Load existing user data in background
    loadExistingUserData(employee);
  };

  const loadExistingUserData = async (employee: Employee) => {
    try {
      console.log(`🌐 Loading existing user data for employee ID: ${employee.id}`);

      const response = await axios.get(
        `https://smartpos-api.bangachieu2.workers.dev/api/v1/users/employee/${employee.id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          withCredentials: true,
        }
      );

      console.log('📡 API Response:', response);

      if (response.data.success) {
        const existingUser = response.data.data;
        console.log('✅ Found existing user:', existingUser);

        // Update form with existing user data
        setPasswordForm(prev => ({
          ...prev,
          username: existingUser.username,
          password: '••••••••' // Show masked password for existing user
        }));
      } else {
        console.log('❌ API returned error:', response.data.message);
      }
    } catch (error) {
      console.log('❌ API call failed:', error);
      console.log('No existing user found, will use defaults');
    }
  };

  const handleClosePasswordDialog = () => {
    setOpenPasswordDialog(false);
    setSelectedEmployeeForPassword(null);
    setPasswordForm({
      username: '',
      password: '',
      confirmPassword: '',
      showPassword: false,
      showConfirmPassword: false
    });
  };

  const handlePasswordFormChange = (field: string, value: any) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validatePasswordForm = () => {
    if (!passwordForm.username.trim()) {
      enqueueSnackbar('Vui lòng nhập tên đăng nhập', { variant: 'error' });
      return false;
    }
    if (passwordForm.username.length < 3) {
      enqueueSnackbar('Tên đăng nhập phải có ít nhất 3 ký tự', { variant: 'error' });
      return false;
    }
    if (!/^[a-z0-9]+$/.test(passwordForm.username)) {
      enqueueSnackbar('Tên đăng nhập chỉ được chứa chữ cái thường và số', { variant: 'error' });
      return false;
    }
    if (!passwordForm.password) {
      enqueueSnackbar('Vui lòng nhập mật khẩu', { variant: 'error' });
      return false;
    }
    if (passwordForm.password.length < 4) {
      enqueueSnackbar('Mật khẩu phải có ít nhất 4 ký tự', { variant: 'error' });
      return false;
    }
    if (passwordForm.password !== passwordForm.confirmPassword) {
      enqueueSnackbar('Mật khẩu xác nhận không khớp', { variant: 'error' });
      return false;
    }
    return true;
  };

  const handleCreateUserAccount = async () => {
    if (!validatePasswordForm() || !selectedEmployeeForPassword) return;

    try {
      setPasswordLoading(true);

      // Map employee role to user role
      const mapRole = (employeeRole: string) => {
        switch (employeeRole) {
          case 'admin': return 'admin';
          case 'sales_agent': return 'sales_agent';
          case 'cashier': return 'cashier';
          case 'affiliate': return 'affiliate';
          case 'inventory': return 'inventory';
          default: return 'cashier';
        }
      };

      const payload = {
        username: passwordForm.username.trim(),
        password: passwordForm.password,
        email: selectedEmployeeForPassword.email || `${passwordForm.username}@smartpos.com`,
        full_name: selectedEmployeeForPassword.full_name,
        role: mapRole(selectedEmployeeForPassword.role),
        store_id: 1,
        employee_id: selectedEmployeeForPassword.id
      };

      console.log('🔐 Creating/Updating user account with payload:', payload);

      // Use direct axios call to get full response
      const response = await axios.post(
        'https://smartpos-api.bangachieu2.workers.dev/api/v1/auth/register',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          withCredentials: true,
          timeout: 15000, // 15 seconds timeout
        }
      );

      console.log('✅ API response:', response.data);

      if (response.data && response.data.success) {
        const message = response.data.message || `Cập nhật tài khoản thành công cho ${selectedEmployeeForPassword.full_name}`;
        enqueueSnackbar(message, { variant: 'success' });

        // Close modal after successful update
        handleClosePasswordDialog();

        // Optional: Refresh employee list to show updated data
        // refetch();
      } else {
        const errorMsg = response.data?.message || 'Lỗi khi cập nhật tài khoản';
        console.error('❌ API returned error:', errorMsg);
        enqueueSnackbar(errorMsg, { variant: 'error' });
      }
    } catch (error: any) {
      console.error('💥 Create user account error:', error);

      let errorMessage = 'Lỗi khi cập nhật mật khẩu';

      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.message || `Lỗi ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Không thể kết nối đến server. Vui lòng thử lại.';
      } else {
        // Something else happened
        errorMessage = error.message || 'Lỗi không xác định';
      }

      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCreateAllUserAccounts = async () => {
    if (!employees || employees.length === 0) {
      enqueueSnackbar('Không có nhân viên nào để tạo tài khoản', { variant: 'warning' });
      return;
    }

    const confirmMessage = `Bạn có chắc muốn tạo tài khoản đăng nhập cho tất cả ${employees.length} nhân viên?\n\nMật khẩu mặc định sẽ là "123456"`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setPasswordLoading(true);

      // Call API to create users from employees
      const response = await api.post('/auth/create-users-from-employees');

      if (response.success) {
        const { data } = response.data;
        enqueueSnackbar(
          `Tạo thành công ${data.users_created} tài khoản, ${data.users_existing} tài khoản đã tồn tại`,
          { variant: 'success' }
        );

        // Show login info
        if (data.login_info && data.login_info.length > 0) {
          console.log('=== THÔNG TIN ĐĂNG NHẬP ===');
          data.login_info.forEach((user: any) => {
            console.log(`${user.username}/123456 - ${user.employee_name} (${user.role})`);
          });

          enqueueSnackbar(
            `Kiểm tra console để xem thông tin đăng nhập của ${data.login_info.length} tài khoản mới`,
            { variant: 'info' }
          );
        }
      } else {
        enqueueSnackbar(response.message || 'Lỗi khi tạo tài khoản', { variant: 'error' });
      }
    } catch (error: any) {
      console.error('Create all user accounts error:', error);
      enqueueSnackbar(error.response?.data?.message || 'Lỗi khi tạo tài khoản cho nhân viên', { variant: 'error' });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Permission management handlers
  const handleOpenPermissionDialog = (employee: Employee) => {
    setSelectedEmployeeForPermissions(employee);
    setOpenPermissionDialog(true);
  };

  const handleClosePermissionDialog = () => {
    setOpenPermissionDialog(false);
    setSelectedEmployeeForPermissions(null);
  };

  const handlePermissionsUpdated = () => {
    // Refresh employee data if needed
    refetch();
  };

  if (isLoading && !employees) {
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

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon />
            Nhân viên & Hoa hồng
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quản lý nhân viên bán hàng và hệ thống hoa hồng
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refetch}
            disabled={isLoading}
          >
            Làm mới
          </Button>
          <Button
            variant="outlined"
            startIcon={<PasswordIcon />}
            onClick={handleCreateAllUserAccounts}
            disabled={isLoading || passwordLoading}
            color="secondary"
          >
            Tạo tài khoản cho tất cả
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
            onClick={() => handleOpenDialog()}
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
                    {stats.totalEmployees}
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
                    {stats.activeEmployees}
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
                    {formatCurrency(stats.totalSalary)}
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
                    {stats.avgCommission.toFixed(1)}%
                  </Typography>
                </Box>
                <CommissionIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              placeholder="Tìm kiếm nhân viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
              <InputLabel>Vai trò</InputLabel>
              <Select
                value={roleFilter}
                label="Vai trò"
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="admin">Quản trị viên</MenuItem>
                <MenuItem value="cashier">Thu ngân</MenuItem>
                <MenuItem value="sales_agent">Nhân viên kinh doanh</MenuItem>
                <MenuItem value="affiliate">Cộng tác viên</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={statusFilter}
                label="Trạng thái"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="active">Đang hoạt động</MenuItem>
                <MenuItem value="inactive">Ngừng hoạt động</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={clearFilters}
              size="small"
            >
              Xóa bộ lọc
            </Button>
          </Grid>
        </Grid>
      </Paper>

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
      ) : error ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error" variant="h6" gutterBottom>
            ⚠️ Có lỗi xảy ra
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {error}
          </Typography>
          <Button
            variant="outlined"
            onClick={refetch}
            startIcon={<RefreshIcon />}
          >
            Thử lại
          </Button>
        </Paper>
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nhân viên</TableCell>
                  <TableCell>Vai trò</TableCell>
                  <TableCell align="right">Lương cơ bản</TableCell>
                  <TableCell align="center">Hoa hồng</TableCell>
                  <TableCell align="center">Trạng thái</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees && employees.length > 0 ? (
                  employees.map((employee) => (
                    <TableRow key={employee.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: getRoleColor(employee.role) }}>
                            {employee.full_name.charAt(0)}
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
                          label={getRoleLabel(employee.role)}
                          color={getRoleColor(employee.role)}
                          size="small"
                          icon={getRoleIcon(employee.role)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {(employee.base_salary || 0).toLocaleString('vi-VN')} ₫
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight="medium" color="primary">
                          {(employee.commission_rate || 0)}%
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={employee.status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}
                          color={employee.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="Chỉnh sửa thông tin">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(employee)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Quản lý tài khoản đăng nhập">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenPasswordDialog(employee)}
                              color="secondary"
                            >
                              <PasswordIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Quản lý quyền hạn">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenPermissionDialog(employee)}
                              color="info"
                            >
                              <SecurityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa nhân viên">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(employee)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Box sx={{ py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          Không có nhân viên nào
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Pagination
                count={pagination.totalPages}
                page={currentPage}
                onChange={(_, page) => handlePageChange(page)}
                color="primary"
              />
            </Box>
          )}
        </Paper>
      )}

      {/* Employee Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingEmployee ? 'Sửa thông tin nhân viên' : 'Thêm nhân viên mới'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Họ và tên"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Số điện thoại"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Vai trò</InputLabel>
                <Select
                  value={formData.role}
                  label="Vai trò"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Employee['role'] })}
                >
                  <MenuItem value="admin">Quản trị viên</MenuItem>
                  <MenuItem value="cashier">Thu ngân</MenuItem>
                  <MenuItem value="sales_agent">Nhân viên kinh doanh</MenuItem>
                  <MenuItem value="affiliate">Cộng tác viên</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Lương cơ bản (₫)"
                type="number"
                value={formData.base_salary}
                onChange={(e) => setFormData({ ...formData, base_salary: parseInt(e.target.value) || 0 })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">₫</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tỷ lệ hoa hồng (%)"
                type="number"
                value={formData.commission_rate}
                onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ghi chú"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {editingEmployee ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Dialog */}
      <Dialog
        open={openPasswordDialog}
        onClose={handleClosePasswordDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PasswordIcon />
            Quản lý tài khoản đăng nhập
          </Box>
          {selectedEmployeeForPassword && (
            <Typography variant="body2" color="text.secondary">
              Chỉnh sửa tài khoản đăng nhập cho: {selectedEmployeeForPassword.full_name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tên đăng nhập"
                value={passwordForm.username}
                onChange={(e) => handlePasswordFormChange('username', e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                helperText="Tên đăng nhập phải có ít nhất 3 ký tự, chỉ chứa chữ cái và số"
                inputProps={{
                  pattern: '[a-zA-Z0-9]+',
                  minLength: 3
                }}
                placeholder="Nhập tên đăng nhập mới"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mật khẩu"
                type={passwordForm.showPassword ? 'text' : 'password'}
                value={passwordForm.password}
                onChange={(e) => handlePasswordFormChange('password', e.target.value)}
                helperText="Mật khẩu phải có ít nhất 4 ký tự"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => handlePasswordFormChange('showPassword', !passwordForm.showPassword)}
                        edge="end"
                      >
                        {passwordForm.showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                inputProps={{ minLength: 6 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Xác nhận mật khẩu"
                type={passwordForm.showConfirmPassword ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => handlePasswordFormChange('confirmPassword', e.target.value)}
                error={Boolean(passwordForm.confirmPassword && passwordForm.password !== passwordForm.confirmPassword)}
                helperText={
                  passwordForm.confirmPassword && passwordForm.password !== passwordForm.confirmPassword
                    ? 'Mật khẩu xác nhận không khớp'
                    : 'Nhập lại mật khẩu để xác nhận'
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => handlePasswordFormChange('showConfirmPassword', !passwordForm.showConfirmPassword)}
                        edge="end"
                      >
                        {passwordForm.showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            {selectedEmployeeForPassword && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Thông tin tài khoản sẽ tạo:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Họ tên: {selectedEmployeeForPassword.full_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Email: {selectedEmployeeForPassword.email || `${passwordForm.username}@smartpos.com`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Vai trò: {getRoleLabel(selectedEmployeeForPassword.role)}
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasswordDialog}>Hủy</Button>
          <Button
            onClick={handleCreateUserAccount}
            variant="contained"
            disabled={passwordLoading || !passwordForm.username || !passwordForm.password || passwordForm.password !== passwordForm.confirmPassword}
            startIcon={passwordLoading ? <CircularProgress size={20} /> : <PasswordIcon />}
          >
            {passwordLoading ? 'Đang cập nhật...' : 'Cập nhật tài khoản'}
          </Button>
        </DialogActions>
      </Dialog>

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
