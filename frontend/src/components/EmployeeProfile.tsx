/**
 * Employee Profile Component
 * Hiển thị thông tin chi tiết và quản lý nhân viên
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Typography,
  Grid,
  Chip,
  Button,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  LinearProgress,
  Alert,
  Paper
} from '@mui/material';
import {
  Person as PersonIcon,
  Work as WorkIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingIcon,
  Security as SecurityIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoIcon,
  Assessment as AssessmentIcon,
  History as HistoryIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';
import { useSnackbar } from 'notistack';

interface EmployeeProfileProps {
  employee: any;
  onUpdate: (employee: any) => void;
  onClose: () => void;
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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const EmployeeProfile: React.FC<EmployeeProfileProps> = ({
  employee,
  onUpdate,
  onClose
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: employee.full_name || '',
    email: employee.email || '',
    phone: employee.phone || '',
    position: employee.position || '',
    department: employee.department || '',
    salary: employee.salary || 0,
    commission_rate: employee.commission_rate || 0,
    status: employee.status || 'active',
    notes: employee.notes || ''
  });

  // Update employee mutation
  const updateEmployee = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.put(`/employees/${employee.id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      enqueueSnackbar('Cập nhật nhân viên thành công!', { variant: 'success' });
      onUpdate(data.data);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(`Lỗi: ${error.message || 'Không thể cập nhật nhân viên'}`, { variant: 'error' });
    }
  });

  const handleSave = () => {
    updateEmployee.mutate(editForm);
  };

  const handleCancel = () => {
    setEditForm({
      full_name: employee.full_name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      position: employee.position || '',
      department: employee.department || '',
      salary: employee.salary || 0,
      commission_rate: employee.commission_rate || 0,
      status: employee.status || 'active',
      notes: employee.notes || ''
    });
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'terminated': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Hoạt động';
      case 'inactive': return 'Không hoạt động';
      case 'terminated': return 'Đã nghỉ việc';
      default: return status;
    }
  };

  const getPerformanceScore = () => {
    // Tính điểm hiệu suất dựa trên commission và thời gian làm việc
    const baseScore = 70;
    const commissionBonus = (employee.commission_rate || 0) * 100;
    const timeBonus = 10; // Bonus cho nhân viên lâu năm
    return Math.min(100, baseScore + commissionBonus + timeBonus);
  };

  const performanceScore = getPerformanceScore();

  return (
    <Dialog open={true} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              sx={{ width: 60, height: 60, fontSize: 24 }}
              src={employee.avatar}
            >
              {employee.full_name?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h5" component="h2">
                {employee.full_name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {employee.position} • {employee.department}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            {!isEditing ? (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setIsEditing(true)}
              >
                Chỉnh sửa
              </Button>
            ) : (
              <>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={updateEmployee.isPending}
                >
                  Lưu
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                >
                  Hủy
                </Button>
              </>
            )}
            <Button variant="outlined" onClick={onClose}>
              Đóng
            </Button>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Thông tin cơ bản" />
            <Tab label="Hiệu suất & KPI" />
            <Tab label="Lịch sử công việc" />
            <Tab label="Quyền hạn" />
            <Tab label="Tài liệu" />
          </Tabs>
        </Box>

        {/* Basic Information Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Employee Photo & Status */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <Avatar
                      sx={{ width: 120, height: 120, fontSize: 48, mb: 2 }}
                      src={employee.avatar}
                    >
                      {employee.full_name?.charAt(0)}
                    </Avatar>
                    <IconButton
                      sx={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        bgcolor: 'background.paper'
                      }}
                      size="small"
                    >
                      <PhotoIcon />
                    </IconButton>
                  </Box>
                  
                  <Chip
                    label={getStatusText(employee.status)}
                    color={getStatusColor(employee.status) as any}
                    sx={{ mb: 2 }}
                  />
                  
                  <Typography variant="h6" gutterBottom>
                    {employee.position}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {employee.department}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Employee Details */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardHeader title="Thông tin chi tiết" />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Họ và tên"
                        value={isEditing ? editForm.full_name : employee.full_name}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        value={isEditing ? editForm.email : employee.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Số điện thoại"
                        value={isEditing ? editForm.phone : employee.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Chức vụ"
                        value={isEditing ? editForm.position : employee.position}
                        onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <WorkIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phòng ban"
                        value={isEditing ? editForm.department : employee.department}
                        onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Ngày vào làm"
                        value={formatDate(employee.hire_date)}
                        disabled
                        InputProps={{
                          startAdornment: <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Lương cơ bản"
                        value={isEditing ? editForm.salary : formatCurrency(employee.salary)}
                        onChange={(e) => setEditForm({ ...editForm, salary: parseFloat(e.target.value) || 0 })}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <MoneyIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Tỷ lệ hoa hồng (%)"
                        value={isEditing ? editForm.commission_rate : `${(employee.commission_rate || 0) * 100}%`}
                        onChange={(e) => setEditForm({ ...editForm, commission_rate: parseFloat(e.target.value) / 100 || 0 })}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <TrendingIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Ghi chú"
                        value={isEditing ? editForm.notes : employee.notes}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        disabled={!isEditing}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Performance & KPI Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {/* Performance Score */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Điểm hiệu suất" />
                <CardContent>
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h2" color="primary">
                      {performanceScore}
                    </Typography>
                    <Typography variant="h6" color="textSecondary">
                      / 100 điểm
                    </Typography>
                  </Box>
                  
                  <LinearProgress
                    variant="determinate"
                    value={performanceScore}
                    sx={{ height: 10, borderRadius: 5, mb: 2 }}
                  />
                  
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="body2">Cần cải thiện</Typography>
                    <Typography variant="body2">Xuất sắc</Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <StarIcon color="warning" />
                    <Typography variant="body2">
                      {performanceScore >= 90 ? 'Nhân viên xuất sắc' : 
                       performanceScore >= 80 ? 'Nhân viên tốt' :
                       performanceScore >= 70 ? 'Nhân viên khá' : 'Cần cải thiện'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* KPI Metrics */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Chỉ số KPI" />
                <CardContent>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <TrendingIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Doanh số tháng này"
                        secondary={formatCurrency(employee.monthly_sales || 0)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <MoneyIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Hoa hồng tháng này"
                        secondary={formatCurrency((employee.monthly_sales || 0) * (employee.commission_rate || 0))}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="info" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Đơn hàng hoàn thành"
                        secondary={`${employee.completed_orders || 0} đơn`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ScheduleIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Thời gian làm việc"
                        secondary={`${employee.work_hours || 0} giờ/tháng`}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Performance Chart */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Biểu đồ hiệu suất 6 tháng gần đây" />
                <CardContent>
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body1" color="textSecondary">
                      Biểu đồ hiệu suất sẽ được hiển thị ở đây
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Work History Tab */}
        <TabPanel value={tabValue} index={2}>
          <Card>
            <CardHeader title="Lịch sử công việc" />
            <CardContent>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Hoàn thành đơn hàng #12345"
                    secondary="Hôm nay, 14:30"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Xử lý thanh toán cho khách hàng"
                    secondary="Hôm nay, 11:15"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <WarningIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Đơn hàng bị hủy #12340"
                    secondary="Hôm qua, 16:45"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Tư vấn sản phẩm cho khách hàng"
                    secondary="Hôm qua, 10:20"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Permissions Tab */}
        <TabPanel value={tabValue} index={3}>
          <Card>
            <CardHeader 
              title="Quyền hạn hiện tại"
              action={
                <Button
                  variant="contained"
                  startIcon={<SecurityIcon />}
                  onClick={() => {/* Open permissions dialog */}}
                >
                  Quản lý quyền hạn
                </Button>
              }
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <SecurityIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6">Quản trị hệ thống</Typography>
                    <Typography variant="body2" color="textSecondary">
                      6 quyền hạn
                    </Typography>
                    <Chip label="Đầy đủ" color="success" size="small" sx={{ mt: 1 }} />
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <WorkIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6">Quản lý sản phẩm</Typography>
                    <Typography variant="body2" color="textSecondary">
                      4 quyền hạn
                    </Typography>
                    <Chip label="Một phần" color="warning" size="small" sx={{ mt: 1 }} />
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <AssessmentIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6">Báo cáo</Typography>
                    <Typography variant="body2" color="textSecondary">
                      3 quyền hạn
                    </Typography>
                    <Chip label="Hạn chế" color="info" size="small" sx={{ mt: 1 }} />
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Documents Tab */}
        <TabPanel value={tabValue} index={4}>
          <Card>
            <CardHeader title="Tài liệu và hợp đồng" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6">Hợp đồng lao động</Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Ký ngày: {formatDate(employee.hire_date)}
                    </Typography>
                    <Button variant="outlined" size="small">
                      Xem tài liệu
                    </Button>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6">Sơ yếu lý lịch</Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Cập nhật: {formatDate(employee.updated_at)}
                    </Typography>
                    <Button variant="outlined" size="small">
                      Xem tài liệu
                    </Button>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6">Chứng chỉ</Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Số lượng: {employee.certificates?.length || 0}
                    </Typography>
                    <Button variant="outlined" size="small">
                      Quản lý
                    </Button>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>
      </DialogContent>
    </Dialog>
  );
};
