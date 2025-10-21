import React, { useState } from 'react';
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
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel,
  Avatar,
} from '@mui/material';
import {
  Search,
  Add,
  Refresh,
  Visibility,
  Edit,
  Delete,
  People,
  FilterList,
  MoreVert,
  Person,
  Work,
  Email,
  Phone,
  LocationOn,
  CalendarToday,
  AttachMoney,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesAPI, rolesAPI } from '../../services/api';

// Employee Form Component
interface EmployeeFormProps {
  open: boolean;
  onClose: () => void;
  employee?: any;
  roles: any[];
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ open, onClose, employee, roles }) => {
  const [formData, setFormData] = useState({
    employee_code: employee?.employee_code || '',
    full_name: employee?.full_name || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    position: employee?.position || '',
    department: employee?.department || '',
    store_id: employee?.store_id || '',
    hire_date: employee?.hire_date || '',
    salary: employee?.salary || 0,
    is_active: employee?.is_active !== undefined ? employee.is_active : 1,
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => employeesAPI.createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => employeesAPI.updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      employee_code: formData.employee_code,
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone,
      position: formData.position,
      department: formData.department,
      store_id: formData.store_id,
      hire_date: formData.hire_date,
      salary: parseFloat(formData.salary.toString()),
      is_active: formData.is_active,
    };

    if (employee) {
      updateMutation.mutate({ id: employee.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleChange = (field: string) => (e: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSwitchChange = (field: string) => (e: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.checked ? 1 : 0,
    }));
  };

  const departments = [
    'Sales', 'Marketing', 'Finance', 'HR', 'IT', 'Operations', 'Customer Service', 'Management'
  ];

  const positions = [
    'Manager', 'Supervisor', 'Sales Representative', 'Cashier', 'Accountant', 
    'Developer', 'Designer', 'Analyst', 'Coordinator', 'Assistant'
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {employee ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Mã nhân viên"
                  value={formData.employee_code}
                  onChange={handleChange('employee_code')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Họ và tên"
                  value={formData.full_name}
                  onChange={handleChange('full_name')}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Số điện thoại"
                  value={formData.phone}
                  onChange={handleChange('phone')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Phòng ban</InputLabel>
                  <Select
                    value={formData.department}
                    onChange={handleChange('department')}
                    label="Phòng ban"
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept} value={dept}>
                        {dept}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Vị trí</InputLabel>
                  <Select
                    value={formData.position}
                    onChange={handleChange('position')}
                    label="Vị trí"
                  >
                    {positions.map((pos) => (
                      <MenuItem key={pos} value={pos}>
                        {pos}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Chi nhánh (Store ID)"
                  value={formData.store_id}
                  onChange={handleChange('store_id')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Ngày tuyển dụng"
                  type="date"
                  value={formData.hire_date}
                  onChange={handleChange('hire_date')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Lương"
                  type="number"
                  value={formData.salary}
                  onChange={handleChange('salary')}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">VNĐ</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active === 1}
                      onChange={handleSwitchChange('is_active')}
                    />
                  }
                  label="Đang làm việc"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Hủy</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {employee ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// View Employee Dialog Component
interface ViewEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  employee: any;
}

const ViewEmployeeDialog: React.FC<ViewEmployeeDialogProps> = ({ open, onClose, employee }) => {
  if (!employee) return null;

  const formatDate = (date: string) => {
    return date ? new Date(date).toLocaleDateString('vi-VN') : 'N/A';
  };

  const formatSalary = (salary: number) => {
    if (!salary) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(salary);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
            <Person sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h6">{employee.full_name}</Typography>
            <Chip
              label={employee.is_active ? 'Đang làm việc' : 'Nghỉ việc'}
              size="small"
              color={employee.is_active ? 'success' : 'default'}
            />
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Person color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Mã nhân viên
                </Typography>
                <Typography variant="body1">
                  {employee.employee_code || 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Work color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Vị trí
                </Typography>
                <Typography variant="body1">
                  {employee.position || 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Email color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">
                  {employee.email || 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Phone color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Điện thoại
                </Typography>
                <Typography variant="body1">
                  {employee.phone || 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Work color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Phòng ban
                </Typography>
                <Typography variant="body1">
                  {employee.department || 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LocationOn color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Chi nhánh
                </Typography>
                <Typography variant="body1">
                  {employee.store_id || 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AttachMoney color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Lương
                </Typography>
                <Typography variant="body1">
                  {formatSalary(employee.salary)}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CalendarToday color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Ngày vào làm
                </Typography>
                <Typography variant="body1">
                  {formatDate(employee.hire_date)}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {employee.user_id && (
            <>
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                  Thông tin tài khoản
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Person color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Tên đăng nhập
                    </Typography>
                    <Typography variant="body1">
                      {employee.username || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Work color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Vai trò
                    </Typography>
                    <Typography variant="body1">
                      {employee.role || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
};

// Create Account Dialog Component
interface CreateAccountDialogProps {
  open: boolean;
  onClose: () => void;
  employee: any;
  roles: any[];
}

const CreateAccountDialog: React.FC<CreateAccountDialogProps> = ({ open, onClose, employee, roles }) => {
  const [formData, setFormData] = useState({
    username: employee?.email?.split('@')[0] || '',
    password: '',
    confirmPassword: '',
    role: 'role-staff',
  });

  const queryClient = useQueryClient();

  const createAccountMutation = useMutation({
    mutationFn: (data: any) => employeesAPI.createEmployeeAccount(employee?.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('Mật khẩu không khớp!');
      return;
    }

    if (formData.password.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    createAccountMutation.mutate({
      username: formData.username,
      password: formData.password,
      role: formData.role,
    });
  };

  const handleChange = (field: string) => (e: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Tạo tài khoản đăng nhập cho {employee?.full_name}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="Tên đăng nhập"
              value={formData.username}
              onChange={handleChange('username')}
              required
              helperText="Tên đăng nhập duy nhất để đăng nhập vào hệ thống"
            />
            <TextField
              fullWidth
              label="Mật khẩu"
              type="password"
              value={formData.password}
              onChange={handleChange('password')}
              required
              helperText="Tối thiểu 6 ký tự"
            />
            <TextField
              fullWidth
              label="Xác nhận mật khẩu"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              required
            />
            <FormControl fullWidth required>
              <InputLabel>Vai trò</InputLabel>
              <Select
                value={formData.role}
                onChange={handleChange('role')}
                label="Vai trò"
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name} - {role.description}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {createAccountMutation.isError && (
              <Alert severity="error">
                {(createAccountMutation.error as any)?.response?.data?.error || 'Có lỗi xảy ra khi tạo tài khoản'}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Hủy</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createAccountMutation.isPending}
          >
            Tạo tài khoản
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Employee Row Component
interface EmployeeRowProps {
  employee: any;
  onEdit: (employee: any) => void;
  onDelete: (id: string) => void;
  onView: (employee: any) => void;
  onCreateAccount: (employee: any) => void;
}

const EmployeeRow: React.FC<EmployeeRowProps> = ({
  employee,
  onEdit,
  onDelete,
  onView,
  onCreateAccount,
}) => {
  const getDepartmentColor = (department: string) => {
    const colors: { [key: string]: string } = {
      'Sales': 'success',
      'Marketing': 'info',
      'Finance': 'warning',
      'HR': 'error',
      'IT': 'primary',
      'Operations': 'secondary',
      'Customer Service': 'default',
      'Management': 'error',
    };
    return colors[department] || 'default';
  };

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(salary);
  };

  return (
    <TableRow>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            <Person />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {employee.full_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {employee.employee_code ? `Mã: ${employee.employee_code}` : 'Chưa có mã'}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2">{employee.email}</Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2">{employee.phone}</Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Chip
          label={employee.department}
          size="small"
          color={getDepartmentColor(employee.department) as any}
        />
      </TableCell>
      <TableCell>
        <Chip
          label={employee.position}
          size="small"
          color="info"
          variant="outlined"
        />
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight="medium">
          {formatSalary(employee.salary)}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={employee.is_active ? 'Đang làm việc' : 'Nghỉ việc'}
          size="small"
          color={employee.is_active ? 'success' : 'default'}
        />
      </TableCell>
      <TableCell>
        {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('vi-VN') : 'N/A'}
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={() => onView(employee)}>
            <Visibility />
          </IconButton>
          <IconButton size="small" onClick={() => onEdit(employee)}>
            <Edit />
          </IconButton>
          {!employee.user_id && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => onCreateAccount(employee)}
              sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}
            >
              Tạo TK
            </Button>
          )}
          {employee.user_id && (
            <Chip label="Có TK" size="small" color="success" variant="outlined" />
          )}
          <IconButton size="small" color="error" onClick={() => onDelete(employee.id)}>
            <Delete />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
};

// Main Employees Management Component
const EmployeesManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [accountEmployee, setAccountEmployee] = useState<any>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewEmployee, setViewEmployee] = useState<any>(null);

  const queryClient = useQueryClient();

  // Fetch employees
  const { data: employeesData, isLoading, error, refetch } = useQuery({
    queryKey: ['employees', page, pageSize, searchTerm],
    queryFn: () => employeesAPI.getEmployees(page, pageSize, searchTerm || undefined),
  });

  // Fetch roles
  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesAPI.getRoles(1, 100),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeesAPI.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const employees = employeesData?.data?.employees || [];
  const roles = rolesData?.data?.roles || [];
  const pagination = employeesData?.data?.pagination;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleEdit = (employee: any) => {
    setSelectedEmployee(employee);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = async (employee: any) => {
    // Fetch employee with user info if they have a user_id
    if (employee.user_id) {
      try {
        const response = await employeesAPI.getEmployeeWithUser(employee.id);
        setViewEmployee(response.data.data);
      } catch (error) {
        console.error('Error fetching employee details:', error);
        setViewEmployee(employee);
      }
    } else {
      setViewEmployee(employee);
    }
    setViewOpen(true);
  };

  const handleCreateAccount = (employee: any) => {
    setAccountEmployee(employee);
    setCreateAccountOpen(true);
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Không thể tải dữ liệu nhân viên. Vui lòng kiểm tra kết nối mạng.
        </Alert>
        <Button onClick={handleRefresh} startIcon={<Refresh />}>
          Thử lại
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Enhanced Header */}
      <Card sx={{
        mb: 4,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative'
      }}>
        <Box sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%'
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%'
        }} />
        <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
            <Avatar sx={{
              width: 80,
              height: 80,
              bgcolor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <People sx={{ fontSize: 40 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                Hệ thống quản lý nhân viên thông minh
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                Quản lý và theo dõi thông tin nhân viên, phân quyền và hiệu suất làm việc
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  label="Quản lý nhân sự"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)'
                  }}
                />
                <Chip
                  label="Phân quyền hệ thống"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)'
                  }}
                />
                <Chip
                  label="Theo dõi hiệu suất"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)'
                  }}
                />
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<Work />}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1
              }}
            >
              Báo cáo nhân sự
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setFormOpen(true)}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'white',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1
              }}
            >
              Thêm nhân viên mới
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
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
            <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{
                  width: 50,
                  height: 50,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <People sx={{ fontSize: 24 }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {pagination?.total || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Tổng nhân viên
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Tất cả nhân viên trong hệ thống
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            borderRadius: 3,
            background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 30px rgba(76, 175, 80, 0.3)'
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
            <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{
                  width: 50,
                  height: 50,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <Work sx={{ fontSize: 24 }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {employees.filter((e: any) => e.is_active).length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Đang làm việc
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Nhân viên đang hoạt động
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            borderRadius: 3,
            background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 30px rgba(255, 152, 0, 0.3)'
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
            <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{
                  width: 50,
                  height: 50,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <AttachMoney sx={{ fontSize: 24 }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {employees.length > 0 
                      ? new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                          minimumFractionDigits: 0,
                        }).format(
                          employees.reduce((sum: number, emp: any) => sum + (emp.salary || 0), 0)
                        )
                      : '0 VNĐ'
                    }
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Tổng lương
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Tổng chi phí lương hàng tháng
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            borderRadius: 3,
            background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 30px rgba(156, 39, 176, 0.3)'
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
            <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{
                  width: 50,
                  height: 50,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <CalendarToday sx={{ fontSize: 24 }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {employees.filter((e: any) => {
                      if (!e.hire_date) return false;
                      const hireDate = new Date(e.hire_date);
                      const sixMonthsAgo = new Date();
                      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                      return hireDate >= sixMonthsAgo;
                    }).length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Tuyển gần đây
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Nhân viên mới trong 6 tháng
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Enhanced Toolbar */}
      <Card sx={{ 
        mb: 3, 
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
            {/* Search Field */}
            <TextField
              placeholder="Tìm kiếm theo tên, email, số điện thoại, chức vụ..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                minWidth: 350,
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
            />

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  setSelectedEmployee(null);
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
                Thêm nhân viên
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
                    backgroundColor: 'rgba(102, 126, 234, 0.05)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
                  }
                }}
              >
                Làm mới
              </Button>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderColor: 'success.main',
                  color: 'success.main',
                  '&:hover': {
                    borderColor: 'success.dark',
                    backgroundColor: 'rgba(76, 175, 80, 0.05)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)'
                  }
                }}
              >
                Bộ lọc
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nhân viên</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Số điện thoại</TableCell>
                <TableCell>Phòng ban</TableCell>
                <TableCell>Vị trí</TableCell>
                <TableCell>Lương</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Ngày tuyển</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((employee: any) => (
                <EmployeeRow
                  key={employee.id}
                  employee={employee}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                  onCreateAccount={handleCreateAccount}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Empty State */}
      {employees.length === 0 && !isLoading && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: 'grey.100' }}>
              <People sx={{ fontSize: 32, color: 'grey.400' }} />
            </Avatar>
            <Typography variant="h6" gutterBottom>
              Chưa có nhân viên nào
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Bắt đầu bằng cách thêm nhân viên đầu tiên của bạn
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setFormOpen(true)}
            >
              Thêm nhân viên đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Employee Form Dialog */}
      <EmployeeForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedEmployee(null);
        }}
        employee={selectedEmployee}
        roles={roles}
      />

      {/* View Employee Dialog */}
      <ViewEmployeeDialog
        open={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setViewEmployee(null);
        }}
        employee={viewEmployee}
      />

      {/* Create Account Dialog */}
      <CreateAccountDialog
        open={createAccountOpen}
        onClose={() => {
          setCreateAccountOpen(false);
          setAccountEmployee(null);
        }}
        employee={accountEmployee}
        roles={roles}
      />
    </Box>
  );
};

export default EmployeesManagement;