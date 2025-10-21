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
  Notifications,
  FilterList,
  Warning,
  Error,
  Info,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsAPI } from '../../services/api';

// Alert Form Component
interface AlertFormProps {
  open: boolean;
  onClose: () => void;
  alert?: any;
}

const AlertForm: React.FC<AlertFormProps> = ({ open, onClose, alert }) => {
  const [formData, setFormData] = useState({
    title: alert?.title || '',
    message: alert?.message || '',
    type: alert?.type || 'info',
    priority: alert?.priority || 'medium',
    category: alert?.category || 'system',
    is_active: alert?.is_active !== undefined ? alert.is_active : 1,
    auto_dismiss: alert?.auto_dismiss !== undefined ? alert.auto_dismiss : 0,
    dismiss_after: alert?.dismiss_after || 30,
    target_roles: alert?.target_roles || '',
    target_users: alert?.target_users || '',
    start_date: alert?.start_date || '',
    end_date: alert?.end_date || '',
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => alertsAPI.createAlert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => alertsAPI.updateAlert(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      title: formData.title,
      message: formData.message,
      type: formData.type,
      priority: formData.priority,
      category: formData.category,
      is_active: formData.is_active,
      auto_dismiss: formData.auto_dismiss,
      dismiss_after: parseInt(formData.dismiss_after.toString()),
      target_roles: formData.target_roles.split(',').map((r: string) => r.trim()).filter((r: string) => r),
      target_users: formData.target_users.split(',').map((u: string) => u.trim()).filter((u: string) => u),
      start_date: formData.start_date,
      end_date: formData.end_date,
    };

    if (alert) {
      updateMutation.mutate({ id: alert.id, data: submitData });
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

  const typeOptions = [
    { value: 'info', label: 'Thông tin' },
    { value: 'warning', label: 'Cảnh báo' },
    { value: 'error', label: 'Lỗi' },
    { value: 'success', label: 'Thành công' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Thấp' },
    { value: 'medium', label: 'Trung bình' },
    { value: 'high', label: 'Cao' },
    { value: 'urgent', label: 'Khẩn cấp' },
  ];

  const categoryOptions = [
    { value: 'system', label: 'Hệ thống' },
    { value: 'inventory', label: 'Kho hàng' },
    { value: 'sales', label: 'Bán hàng' },
    { value: 'customer', label: 'Khách hàng' },
    { value: 'payment', label: 'Thanh toán' },
    { value: 'security', label: 'Bảo mật' },
    { value: 'maintenance', label: 'Bảo trì' },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {alert ? 'Chỉnh sửa cảnh báo' : 'Tạo cảnh báo mới'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                <TextField
                  fullWidth
                  label="Tiêu đề"
                  value={formData.title}
                  onChange={handleChange('title')}
                  required
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Loại cảnh báo</InputLabel>
                    <Select
                      value={formData.type}
                      onChange={handleChange('type')}
                      label="Loại cảnh báo"
                      required
                    >
                      {typeOptions.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Độ ưu tiên</InputLabel>
                    <Select
                      value={formData.priority}
                      onChange={handleChange('priority')}
                      label="Độ ưu tiên"
                    >
                      {priorityOptions.map((priority) => (
                        <MenuItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Danh mục</InputLabel>
                    <Select
                      value={formData.category}
                      onChange={handleChange('category')}
                      label="Danh mục"
                    >
                      {categoryOptions.map((category) => (
                        <MenuItem key={category.value} value={category.value}>
                          {category.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    label="Thời gian hiển thị"
                    type="number"
                    value={formData.dismiss_after}
                    onChange={handleChange('dismiss_after')}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">giây</InputAdornment>,
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Ngày bắt đầu"
                    type="date"
                    value={formData.start_date}
                    onChange={handleChange('start_date')}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    fullWidth
                    label="Ngày kết thúc"
                    type="date"
                    value={formData.end_date}
                    onChange={handleChange('end_date')}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
                <TextField
                  fullWidth
                  label="Nội dung cảnh báo"
                  multiline
                  rows={4}
                  value={formData.message}
                  onChange={handleChange('message')}
                  required
                />
                <TextField
                  fullWidth
                  label="Vai trò nhận cảnh báo (phân cách bằng dấu phẩy)"
                  value={formData.target_roles}
                  onChange={handleChange('target_roles')}
                  placeholder="VD: admin, manager, cashier"
                />
                <TextField
                  fullWidth
                  label="Người dùng nhận cảnh báo (phân cách bằng dấu phẩy)"
                  value={formData.target_users}
                  onChange={handleChange('target_users')}
                  placeholder="VD: user1, user2, user3"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active === 1}
                      onChange={handleSwitchChange('is_active')}
                    />
                  }
                  label="Kích hoạt cảnh báo"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.auto_dismiss === 1}
                      onChange={handleSwitchChange('auto_dismiss')}
                    />
                  }
                  label="Tự động ẩn sau thời gian"
                />
              </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Hủy</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {alert ? 'Cập nhật' : 'Tạo cảnh báo'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Alert Row Component
interface AlertRowProps {
  alert: any;
  onEdit: (alert: any) => void;
  onDelete: (id: string) => void;
  onView: (alert: any) => void;
  onMarkAsRead: (id: string) => void;
}

const AlertRow: React.FC<AlertRowProps> = ({
  alert,
  onEdit,
  onDelete,
  onView,
  onMarkAsRead,
}) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'info';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'success': return 'success';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info />;
      case 'warning': return <Warning />;
      case 'error': return <Error />;
      case 'success': return <CheckCircle />;
      default: return <Notifications />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const isActive = () => {
    if (!alert.is_active) return false;
    const now = new Date();
    const start = alert.start_date ? new Date(alert.start_date) : null;
    const end = alert.end_date ? new Date(alert.end_date) : null;
    
    if (start && now < start) return false;
    if (end && now > end) return false;
    return true;
  };

  return (
    <TableRow>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: `${getTypeColor(alert.type)}.main` }}>
            {getTypeIcon(alert.type)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {alert.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {alert.category}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getTypeIcon(alert.type)}
          <Chip
            label={alert.type}
            size="small"
            color={getTypeColor(alert.type) as any}
          />
        </Box>
      </TableCell>
      <TableCell>
        <Chip
          label={alert.priority}
          size="small"
          color={getPriorityColor(alert.priority) as any}
        />
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isActive() ? <CheckCircle color="success" /> : <Schedule color="warning" />}
          <Chip
            label={isActive() ? 'Hoạt động' : 'Không hoạt động'}
            size="small"
            color={isActive() ? 'success' : 'default'}
          />
        </Box>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {alert.target_roles?.length || 0} vai trò
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {alert.dismiss_after}s
        </Typography>
      </TableCell>
      <TableCell>{new Date(alert.created_at).toLocaleDateString('vi-VN')}</TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={() => onView(alert)}>
            <Visibility />
          </IconButton>
          <IconButton size="small" onClick={() => onMarkAsRead(alert.id)}>
            <CheckCircle />
          </IconButton>
          <IconButton size="small" onClick={() => onEdit(alert)}>
            <Edit />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => onDelete(alert.id)}>
            <Delete />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
};

// Main Alerts Management Component
const AlertsManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch alerts
  const { data: alertsData, isLoading, error, refetch } = useQuery({
    queryKey: ['alerts', page, pageSize, searchTerm],
    queryFn: () => alertsAPI.getAlerts(page, pageSize, searchTerm || undefined),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => alertsAPI.deleteAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => alertsAPI.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => alertsAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const alerts = alertsData?.data?.alerts || [];
  const pagination = alertsData?.data?.pagination;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleEdit = (alert: any) => {
    setSelectedAlert(alert);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa cảnh báo này?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = (alert: any) => {
    console.log('View alert:', alert);
  };

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Không thể tải dữ liệu cảnh báo. Vui lòng kiểm tra kết nối mạng.
        </Alert>
        <Button onClick={handleRefresh} startIcon={<Refresh />}>
          Thử lại
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Quản lý cảnh báo
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quản lý các cảnh báo và thông báo hệ thống
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box sx={{ flex: '1 1 25%', minWidth: '240px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Notifications color="primary" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {pagination?.total || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng cảnh báo
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 25%', minWidth: '240px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Warning color="warning" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {alerts.filter((a: any) => a.type === 'warning').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cảnh báo
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 25%', minWidth: '240px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Error color="error" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {alerts.filter((a: any) => a.type === 'error').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Lỗi
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 25%', minWidth: '240px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircle color="success" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {alerts.filter((a: any) => a.is_active).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Đang hoạt động
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Toolbar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Tìm kiếm cảnh báo..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300 }}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setSelectedAlert(null);
                setFormOpen(true);
              }}
            >
              Tạo cảnh báo
            </Button>
            <Button
              variant="outlined"
              startIcon={<CheckCircle />}
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              Đánh dấu tất cả đã đọc
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
            >
              Làm mới
            </Button>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
            >
              Bộ lọc
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cảnh báo</TableCell>
                <TableCell>Loại</TableCell>
                <TableCell>Độ ưu tiên</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Đối tượng</TableCell>
                <TableCell>Thời gian</TableCell>
                <TableCell>Ngày tạo</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.map((alert: any) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Empty State */}
      {alerts.length === 0 && !isLoading && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: 'grey.100' }}>
              <Notifications sx={{ fontSize: 32, color: 'grey.400' }} />
            </Avatar>
            <Typography variant="h6" gutterBottom>
              Chưa có cảnh báo nào
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Bắt đầu bằng cách tạo cảnh báo đầu tiên
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setFormOpen(true)}
            >
              Tạo cảnh báo đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Alert Form Dialog */}
      <AlertForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        alert={selectedAlert}
      />
    </Box>
  );
};

export default AlertsManagement;