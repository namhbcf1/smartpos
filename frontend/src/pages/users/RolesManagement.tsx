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
  Avatar,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from '@mui/material';
import {
  Search,
  Add,
  Refresh,
  Visibility,
  Edit,
  Delete,
  Security,
  FilterList,
  MoreVert,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesAPI } from '../../services/api';

// Role Form Component
interface RoleFormProps {
  open: boolean;
  onClose: () => void;
  role?: any;
}

const RoleForm: React.FC<RoleFormProps> = ({ open, onClose, role }) => {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    description: role?.description || '',
    permissions: role?.permissions || [],
    is_active: role?.is_active !== undefined ? role.is_active : 1,
  });

  const availablePermissions = [
    'products.read',
    'products.create',
    'products.update',
    'products.delete',
    'orders.read',
    'orders.create',
    'orders.update',
    'orders.delete',
    'customers.read',
    'customers.create',
    'customers.update',
    'customers.delete',
    'inventory.read',
    'inventory.update',
    'reports.read',
    'settings.read',
    'settings.update',
    'users.read',
    'users.create',
    'users.update',
    'users.delete',
    'roles.read',
    'roles.create',
    'roles.update',
    'roles.delete',
  ];

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => rolesAPI.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => rolesAPI.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role) {
      updateMutation.mutate({ id: role.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (field: string) => (e: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handlePermissionChange = (permission: string) => (e: any) => {
    setFormData(prev => ({
      ...prev,
      permissions: e.target.checked
        ? [...prev.permissions, permission]
        : prev.permissions.filter((p: string) => p !== permission),
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {role ? 'Chỉnh sửa vai trò' : 'Tạo vai trò mới'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Tên vai trò"
              value={formData.name}
              onChange={handleChange('name')}
              required
            />
            <TextField
              fullWidth
              label="Mô tả"
              multiline
              rows={3}
              value={formData.description}
              onChange={handleChange('description')}
            />
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={formData.is_active}
                onChange={handleChange('is_active')}
                label="Trạng thái"
              >
                <MenuItem value={1}>Hoạt động</MenuItem>
                <MenuItem value={0}>Không hoạt động</MenuItem>
              </Select>
            </FormControl>
            <Box>
              <Typography variant="h6" gutterBottom>
                Quyền hạn
              </Typography>
              <FormGroup>
                <Grid container spacing={1}>
                  {availablePermissions.map((permission) => (
                    <Grid item xs={12} sm={6} md={4} key={permission}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.permissions.includes(permission)}
                            onChange={handlePermissionChange(permission)}
                          />
                        }
                        label={permission}
                      />
                    </Grid>
                  ))}
                </Grid>
              </FormGroup>
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
            {role ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Role Card Component
interface RoleCardProps {
  role: any;
  onEdit: (role: any) => void;
  onDelete: (id: string) => void;
  onView: (role: any) => void;
}

const RoleCard: React.FC<RoleCardProps> = ({ role, onEdit, onDelete, onView }) => {
  const getRoleIcon = (name: string) => {
    if (name.toLowerCase().includes('admin')) return <AdminPanelSettings />;
    return <Security />;
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {role.name}
            </Typography>
            {role.description && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {role.description}
              </Typography>
            )}
          </Box>
          <IconButton size="small">
            <MoreVert />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Chip
            label={role.is_active ? 'Hoạt động' : 'Không hoạt động'}
            size="small"
            color={role.is_active ? 'success' : 'default'}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getRoleIcon(role.name)}
            <Typography variant="caption" color="text.secondary">
              {role.permissions?.length || 0} quyền
            </Typography>
          </Box>
        </Box>

        {role.permissions && role.permissions.length > 0 && (
          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Quyền hạn:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {role.permissions.slice(0, 3).map((permission: string) => (
                <Chip
                  key={permission}
                  label={permission}
                  size="small"
                  variant="outlined"
                />
              ))}
              {role.permissions.length > 3 && (
                <Chip
                  label={`+${role.permissions.length - 3} khác`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        )}
      </CardContent>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={<Visibility />}
            onClick={() => onView(role)}
            sx={{ flex: 1 }}
          >
            Xem
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => onEdit(role)}
            sx={{ flex: 1 }}
          >
            Sửa
          </Button>
          <Button
            size="small"
            color="error"
            startIcon={<Delete />}
            onClick={() => onDelete(role.id)}
            sx={{ flex: 1 }}
          >
            Xóa
          </Button>
        </Box>
      </Box>
    </Card>
  );
};

// Main Roles Management Component
const RolesManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch roles
  const { data: rolesData, isLoading, error, refetch } = useQuery({
    queryKey: ['roles', page, pageSize, searchTerm],
    queryFn: () => rolesAPI.getRoles(page, pageSize),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => rolesAPI.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  const roles = rolesData?.data?.roles || [];
  const pagination = rolesData?.data?.pagination;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleEdit = (role: any) => {
    setSelectedRole(role);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa vai trò này?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = (role: any) => {
    console.log('View role:', role);
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Không thể tải dữ liệu vai trò. Vui lòng kiểm tra kết nối mạng.
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
          Quản lý vai trò
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quản lý vai trò và quyền hạn người dùng
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Security color="primary" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {pagination?.total || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng vai trò
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Security color="success" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {roles.filter((r: any) => r.is_active).length}
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
              placeholder="Tìm kiếm vai trò..."
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
                setSelectedRole(null);
                setFormOpen(true);
              }}
            >
              Tạo vai trò
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

      {/* Roles Grid */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {roles.map((role: any) => (
          <Box sx={{ flex: '1 1 50%', minWidth: '300px' }} key={role.id}>
            <RoleCard
              role={role}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
            />
          </Box>
        ))}
      </Box>

      {/* Empty State */}
      {roles.length === 0 && !isLoading && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: 'grey.100' }}>
              <Security sx={{ fontSize: 32, color: 'grey.400' }} />
            </Avatar>
            <Typography variant="h6" gutterBottom>
              Chưa có vai trò nào
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Bắt đầu bằng cách tạo vai trò đầu tiên của bạn
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setFormOpen(true)}
            >
              Tạo vai trò đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Role Form Dialog */}
      <RoleForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        role={selectedRole}
      />
    </Box>
  );
};

export default RolesManagement;