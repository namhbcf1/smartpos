/**
 * Employee Management Page
 * Quản lý nhân viên và phân quyền cho ComputerPOS Pro
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Work as WorkIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  AdminPanelSettings as AdminIcon,
  ManageAccounts as ManagerIcon,
  PointOfSale as CashierIcon,
  Build as TechnicianIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/api';
import { formatCurrency } from '../utils/format';
import { useSnackbar } from 'notistack';

// Types
interface Employee {
  id: number;
  employee_code: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hire_date: string;
  salary: number;
  commission_rate: number;
  status: 'active' | 'inactive' | 'terminated';
  roles: Role[];
  created_at: string;
}

interface Role {
  id: number;
  name: string;
  display_name: string;
  permissions: Permission[];
}

interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`employee-tabpanel-${index}`}
      aria-labelledby={`employee-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const EmployeeManagement: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  // State
  const [tabValue, setTabValue] = useState(0);
  const [openEmployeeDialog, setOpenEmployeeDialog] = useState(false);
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [employeeForm, setEmployeeForm] = useState({
    employee_code: '',
    full_name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    salary: 0,
    commission_rate: 0,
    status: 'active' as const
  });

  // Fetch employees
  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await apiClient.get('/employees');
      return response.data.data || [];
    }
  });

  // Fetch roles
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await apiClient.get('/roles');
      return response.data.data || [];
    }
  });

  // Statistics
  const stats = {
    totalEmployees: employees.length,
    activeEmployees: employees.filter((emp: Employee) => emp.status === 'active').length,
    departments: [...new Set(employees.map((emp: Employee) => emp.department))].length,
    totalSalary: employees.reduce((sum: number, emp: Employee) => sum + emp.salary, 0)
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'admin': return <AdminIcon />;
      case 'manager': return <ManagerIcon />;
      case 'cashier': return <CashierIcon />;
      case 'technician': return <TechnicianIcon />;
      case 'inventory_staff': return <InventoryIcon />;
      default: return <PersonIcon />;
    }
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'admin': return 'error';
      case 'manager': return 'warning';
      case 'cashier': return 'primary';
      case 'technician': return 'info';
      case 'inventory_staff': return 'success';
      default: return 'default';
    }
  };

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setEmployeeForm({
      employee_code: '',
      full_name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      salary: 0,
      commission_rate: 0,
      status: 'active'
    });
    setOpenEmployeeDialog(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeForm({
      employee_code: employee.employee_code,
      full_name: employee.full_name,
      email: employee.email,
      phone: employee.phone,
      position: employee.position,
      department: employee.department,
      salary: employee.salary,
      commission_rate: employee.commission_rate,
      status: employee.status
    });
    setOpenEmployeeDialog(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Quản lý nhân viên
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddEmployee}
        >
          Thêm nhân viên
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PersonIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{stats.totalEmployees}</Typography>
                  <Typography color="textSecondary">Tổng nhân viên</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <WorkIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{stats.activeEmployees}</Typography>
                  <Typography color="textSecondary">Đang làm việc</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <BadgeIcon color="info" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{stats.departments}</Typography>
                  <Typography color="textSecondary">Phòng ban</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <SecurityIcon color="warning" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{formatCurrency(stats.totalSalary)}</Typography>
                  <Typography color="textSecondary">Tổng lương</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Danh sách nhân viên" />
          <Tab label="Vai trò & Quyền hạn" />
          <Tab label="Báo cáo" />
        </Tabs>

        {/* Employee List Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nhân viên</TableCell>
                  <TableCell>Mã NV</TableCell>
                  <TableCell>Chức vụ</TableCell>
                  <TableCell>Phòng ban</TableCell>
                  <TableCell>Vai trò</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Lương</TableCell>
                  <TableCell>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((employee: Employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2 }}>
                          {employee.full_name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {employee.full_name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {employee.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{employee.employee_code}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        {employee.roles?.map((role) => (
                          <Chip
                            key={role.id}
                            label={role.display_name}
                            size="small"
                            color={getRoleColor(role.name) as any}
                            icon={getRoleIcon(role.name)}
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={employee.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                        color={employee.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatCurrency(employee.salary)}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEditEmployee(employee)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Roles & Permissions Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Vai trò và quyền hạn
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Quản lý vai trò và phân quyền cho nhân viên trong hệ thống.
          </Typography>
          
          <Grid container spacing={3}>
            {roles.map((role: Role) => (
              <Grid item xs={12} md={6} lg={4} key={role.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      {getRoleIcon(role.name)}
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        {role.display_name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {role.permissions?.length || 0} quyền hạn
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setSelectedRole(role);
                        setOpenRoleDialog(true);
                      }}
                    >
                      Xem chi tiết
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Reports Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Báo cáo nhân sự
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Các báo cáo về nhân sự sẽ được triển khai trong phiên bản tiếp theo.
          </Typography>
        </TabPanel>
      </Paper>
    </Box>
  );
};
