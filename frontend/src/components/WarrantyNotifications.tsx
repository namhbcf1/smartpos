import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Pagination,
  Tooltip,
  Stack,
  Avatar,
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  PhoneAndroid as PushIcon,
  Inbox as InAppIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../services/api';

interface WarrantyNotification {
  id: number;
  warranty_registration_id: number;
  notification_type: string;
  notification_method: string;
  scheduled_date: string;
  sent_date?: string;
  subject?: string;
  message: string;
  status: string;
  delivery_status?: string;
  error_message?: string;
  created_at: string;
  warranty_number?: string;
  product_name?: string;
  customer_name?: string;
  customer_email?: string;
}

interface NotificationStats {
  total_notifications: number;
  pending_notifications: number;
  sent_notifications: number;
  failed_notifications: number;
  expiry_warnings: number;
  expired_notifications: number;
  overdue_notifications: number;
}

const WarrantyNotifications: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [notifications, setNotifications] = useState<WarrantyNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<WarrantyNotification | null>(null);

  // Load data
  useEffect(() => {
    loadNotifications();
    loadStats();
  }, [currentPage, statusFilter, typeFilter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { notification_type: typeFilter }),
      });

      const response = await api.get(`/warranty-notifications?${params}`);
      if (response.data.success) {
        setNotifications(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setError('Không thể tải danh sách thông báo');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/warranty-notifications/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error loading notification stats:', error);
    }
  };

  const handleSendNow = async (notificationId: number) => {
    try {
      const response = await api.post(`/warranty-notifications/send-now/${notificationId}`);
      if (response.data.success) {
        enqueueSnackbar('Thông báo đã được gửi thành công!', { variant: 'success' });
        loadNotifications();
        loadStats();
      } else {
        enqueueSnackbar(response.data.message || 'Không thể gửi thông báo', { variant: 'error' });
      }
    } catch (error: any) {
      console.error('Error sending notification:', error);
      enqueueSnackbar(error.response?.data?.message || 'Lỗi khi gửi thông báo', { variant: 'error' });
    }
  };

  const handleRefresh = () => {
    loadNotifications();
    loadStats();
  };

  const clearFilters = () => {
    setStatusFilter('');
    setTypeFilter('');
    setCurrentPage(1);
  };

  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'sent': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <SuccessIcon />;
      case 'pending': return <ScheduleIcon />;
      case 'failed': return <ErrorIcon />;
      case 'cancelled': return <WarningIcon />;
      default: return <NotificationIcon />;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'email': return <EmailIcon />;
      case 'sms': return <SmsIcon />;
      case 'push': return <PushIcon />;
      case 'in_app': return <InAppIcon />;
      default: return <NotificationIcon />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'expiry_warning': return 'Cảnh báo hết hạn';
      case 'expired': return 'Đã hết hạn';
      case 'claim_update': return 'Cập nhật khiếu nại';
      case 'registration_confirmation': return 'Xác nhận đăng ký';
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (loading && !notifications.length) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Thông báo bảo hành
        </Typography>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Đang tải dữ liệu thông báo...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationIcon color="primary" />
            Thông báo bảo hành
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Quản lý thông báo tự động cho bảo hành
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Làm mới
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
          >
            Tạo thông báo
          </Button>
        </Stack>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Tổng thông báo
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {stats.total_notifications}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'primary.light' }}>
                    <NotificationIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Chờ gửi
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {stats.pending_notifications}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'warning.light' }}>
                    <ScheduleIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Đã gửi
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {stats.sent_notifications}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'success.light' }}>
                    <SuccessIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Quá hạn
                    </Typography>
                    <Typography variant="h4" color="error.main">
                      {stats.overdue_notifications}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'error.light' }}>
                    <ErrorIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={statusFilter}
                label="Trạng thái"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="pending">Chờ gửi</MenuItem>
                <MenuItem value="sent">Đã gửi</MenuItem>
                <MenuItem value="failed">Thất bại</MenuItem>
                <MenuItem value="cancelled">Đã hủy</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Loại thông báo</InputLabel>
              <Select
                value={typeFilter}
                label="Loại thông báo"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="expiry_warning">Cảnh báo hết hạn</MenuItem>
                <MenuItem value="expired">Đã hết hạn</MenuItem>
                <MenuItem value="claim_update">Cập nhật khiếu nại</MenuItem>
                <MenuItem value="registration_confirmation">Xác nhận đăng ký</MenuItem>
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

      {/* Notifications Table */}
      {loading ? (
        <Paper sx={{ p: 2 }}>
          <LinearProgress />
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Đang tải dữ liệu thông báo...
            </Typography>
          </Box>
        </Paper>
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Thông báo</TableCell>
                  <TableCell>Bảo hành</TableCell>
                  <TableCell>Khách hàng</TableCell>
                  <TableCell>Phương thức</TableCell>
                  <TableCell>Lịch gửi</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notifications && notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <TableRow key={notification.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {getTypeLabel(notification.notification_type)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {notification.subject || 'Không có tiêu đề'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">
                            {notification.warranty_number || 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {notification.product_name || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">
                            {notification.customer_name || 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {notification.customer_email || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getMethodIcon(notification.notification_method)}
                          label={notification.notification_method.toUpperCase()}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(notification.scheduled_date)}
                        </Typography>
                        {notification.sent_date && (
                          <Typography variant="caption" color="text.secondary">
                            Đã gửi: {formatDate(notification.sent_date)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(notification.status)}
                          label={notification.status}
                          color={getStatusColor(notification.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="Xem chi tiết">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedNotification(notification);
                                setOpenViewDialog(true);
                              }}
                              color="primary"
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          {notification.status === 'pending' && (
                            <Tooltip title="Gửi ngay">
                              <IconButton
                                size="small"
                                onClick={() => handleSendNow(notification.id)}
                                color="success"
                              >
                                <SendIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Box sx={{ py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          Không có thông báo nào
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
                onChange={(_, page) => setCurrentPage(page)}
                color="primary"
              />
            </Box>
          )}
        </Paper>
      )}

      {/* Create Notification Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Tạo thông báo mới</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Tính năng tạo thông báo thủ công đang được phát triển...
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* View Notification Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Chi tiết thông báo</DialogTitle>
        <DialogContent>
          {selectedNotification && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Loại thông báo:</Typography>
                  <Typography variant="body1">{getTypeLabel(selectedNotification.notification_type)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Phương thức:</Typography>
                  <Typography variant="body1">{selectedNotification.notification_method}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Tiêu đề:</Typography>
                  <Typography variant="body1">{selectedNotification.subject || 'Không có tiêu đề'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Nội dung:</Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedNotification.message}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Lịch gửi:</Typography>
                  <Typography variant="body1">{formatDate(selectedNotification.scheduled_date)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Trạng thái:</Typography>
                  <Chip
                    icon={getStatusIcon(selectedNotification.status)}
                    label={selectedNotification.status}
                    color={getStatusColor(selectedNotification.status)}
                    size="small"
                  />
                </Grid>
                {selectedNotification.error_message && (
                  <Grid item xs={12}>
                    <Alert severity="error">
                      <Typography variant="subtitle2">Lỗi:</Typography>
                      <Typography variant="body2">{selectedNotification.error_message}</Typography>
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Đóng</Button>
          {selectedNotification?.status === 'pending' && (
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={() => {
                handleSendNow(selectedNotification.id);
                setOpenViewDialog(false);
              }}
            >
              Gửi ngay
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WarrantyNotifications;
