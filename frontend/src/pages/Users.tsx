import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  Stack,
  useTheme,
  useMediaQuery,
  Button,
  Grid,
  Card,
  CardContent,
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton
} from '@mui/material';
import {
  Group as UsersIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  AdminPanelSettings as AdminIcon,
  Person as UserIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { usePaginatedQuery } from '../hooks/useApiData';
import { formatDate } from '../config/constants';
import api from '../services/api';

// Types
interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  last_login: string | null;
  created_at: string;
}

const Users = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    role: 'user' as User['role'],
    status: 'active' as User['status']
  });
  const [loading, setLoading] = useState(false);

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

  // Fetch users data
  const {
    data: users,
    pagination,
    isLoading,
    error,
    refetch,
    handlePageChange,
    handleLimitChange,
    page: currentPage,
    limit: currentLimit
  } = usePaginatedQuery<User>('/users/list', queryParams);

  // Statistics
  const stats = useMemo(() => {
    if (!users || users.length === 0) {
      return {
        totalUsers: 0,
        activeUsers: 0,
        adminUsers: 0,
        recentLogins: 0
      };
    }

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return {
      totalUsers: pagination?.total || 0,
      activeUsers: users.filter(user => user.status === 'active').length,
      adminUsers: users.filter(user => user.role === 'admin').length,
      recentLogins: users.filter(user =>
        user.last_login && new Date(user.last_login) > last24h
      ).length
    };
  }, [users, pagination]);

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: { xs: 1, sm: 2 },
        px: { xs: 1, sm: 2, md: 3 },
        minHeight: '100vh',
        bgcolor: 'grey.50'
      }}
    >
      {/* Header */}
      <Paper
        elevation={2}
        sx={{
          p: { xs: 2, sm: 3 },
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
        >
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                fontWeight: 600,
                mb: 1
              }}
            >
              <UsersIcon sx={{ fontSize: 'inherit' }} />
              Quản lý người dùng
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, opacity: 0.9 }}
            >
              Quản lý tài khoản và phân quyền người dùng hệ thống
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refetch}
              disabled={isLoading}
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Làm mới
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {}}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
              }}
            >
              Thêm người dùng
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Tổng người dùng
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalUsers}
                  </Typography>
                </Box>
                <UsersIcon color="primary" sx={{ fontSize: 40 }} />
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
                    {stats.activeUsers}
                  </Typography>
                </Box>
                <ActiveIcon color="success" sx={{ fontSize: 40 }} />
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
                    Quản trị viên
                  </Typography>
                  <Typography variant="h4">
                    {stats.adminUsers}
                  </Typography>
                </Box>
                <AdminIcon color="error" sx={{ fontSize: 40 }} />
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
                    Đăng nhập 24h
                  </Typography>
                  <Typography variant="h4">
                    {stats.recentLogins}
                  </Typography>
                </Box>
                <UserIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        <Typography>Đang phát triển bảng danh sách người dùng và form quản lý...</Typography>
      </Paper>
    </Container>
  );
};

export default Users;