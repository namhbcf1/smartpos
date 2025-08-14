import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  TextField,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Business as ManagerIcon,
  PointOfSale as CashierIcon,
  TrendingUp as SalesIcon,
  Inventory as InventoryIcon,
  Group as AffiliateIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Security as SecurityIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import apiClient from '../services/api';

interface RoleTemplate {
  id: number;
  name: string;
  display_name: string;
  description: string;
  is_template: boolean;
  is_system: boolean;
  permission_count: number;
}

interface RoleTemplateManagerProps {
  open: boolean;
  onClose: () => void;
  onRoleTemplateCreated?: () => void;
}

const RoleTemplateManager: React.FC<RoleTemplateManagerProps> = ({
  open,
  onClose,
  onRoleTemplateCreated
}) => {
  const [loading, setLoading] = useState(false);
  const [roleTemplates, setRoleTemplates] = useState<RoleTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<RoleTemplate | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    is_template: true
  });
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (open) {
      loadRoleTemplates();
    }
  }, [open]);

  const loadRoleTemplates = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/permissions/roles/templates');
      setRoleTemplates(response.data);
    } catch (error) {
      console.error('Error loading role templates:', error);
      enqueueSnackbar('Lỗi khi tải danh sách vai trò', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (roleName: string) => {
    if (roleName.includes('admin')) return <AdminIcon />;
    if (roleName.includes('manager')) return <ManagerIcon />;
    if (roleName.includes('cashier')) return <CashierIcon />;
    if (roleName.includes('sales')) return <SalesIcon />;
    if (roleName.includes('inventory')) return <InventoryIcon />;
    if (roleName.includes('affiliate')) return <AffiliateIcon />;
    return <SecurityIcon />;
  };

  const getRoleColor = (roleName: string) => {
    if (roleName.includes('admin')) return 'error';
    if (roleName.includes('manager')) return 'warning';
    if (roleName.includes('cashier')) return 'primary';
    if (roleName.includes('sales')) return 'success';
    if (roleName.includes('inventory')) return 'info';
    if (roleName.includes('affiliate')) return 'secondary';
    return 'default';
  };

  const handleCreateTemplate = async () => {
    try {
      setLoading(true);
      
      if (!formData.name || !formData.display_name) {
        enqueueSnackbar('Vui lòng nhập tên và tên hiển thị', { variant: 'error' });
        return;
      }

      const response = await apiClient.post('/permissions/roles/templates', formData);
      
      if (response.success) {
        enqueueSnackbar('Tạo vai trò mẫu thành công', { variant: 'success' });
        setShowCreateForm(false);
        setFormData({ name: '', display_name: '', description: '', is_template: true });
        await loadRoleTemplates();
        onRoleTemplateCreated?.();
      }
    } catch (error) {
      console.error('Error creating role template:', error);
      enqueueSnackbar('Lỗi khi tạo vai trò mẫu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('Bạn có chắc muốn xóa vai trò mẫu này?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.delete(`/permissions/roles/templates/${templateId}`);
      
      if (response.success) {
        enqueueSnackbar('Xóa vai trò mẫu thành công', { variant: 'success' });
        await loadRoleTemplates();
        onRoleTemplateCreated?.();
      }
    } catch (error) {
      console.error('Error deleting role template:', error);
      enqueueSnackbar('Lỗi khi xóa vai trò mẫu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const systemTemplates = roleTemplates.filter(t => t.is_system);
  const customTemplates = roleTemplates.filter(t => !t.is_system);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <SecurityIcon color="primary" />
            <Typography variant="h6">
              Quản lý vai trò mẫu
            </Typography>
          </Box>
          <Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateForm(true)}
              sx={{ mr: 1 }}
            >
              Tạo vai trò mới
            </Button>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {showCreateForm && (
              <Card sx={{ mb: 3, border: '2px dashed', borderColor: 'primary.main' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Tạo vai trò mẫu mới
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Tên vai trò (tiếng Anh)"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., custom_manager"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Tên hiển thị"
                        value={formData.display_name}
                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                        placeholder="e.g., Quản lý tùy chỉnh"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Mô tả"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Mô tả vai trò và quyền hạn..."
                      />
                    </Grid>
                  </Grid>
                </CardContent>
                <CardActions>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleCreateTemplate}
                    disabled={loading}
                  >
                    Tạo vai trò
                  </Button>
                  <Button onClick={() => setShowCreateForm(false)}>
                    Hủy
                  </Button>
                </CardActions>
              </Card>
            )}

            {/* System Role Templates */}
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              🏛️ Vai trò hệ thống
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Các vai trò hệ thống được định nghĩa sẵn và không thể chỉnh sửa hoặc xóa.
            </Alert>
            <Grid container spacing={2}>
              {systemTemplates.map((template) => (
                <Grid item xs={12} sm={6} md={4} key={template.id}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        {getRoleIcon(template.name)}
                        <Typography variant="h6">
                          {template.display_name}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {template.description}
                      </Typography>
                      <Box display="flex" gap={1} mt={2}>
                        <Chip
                          label={`${template.permission_count} quyền`}
                          size="small"
                          color={getRoleColor(template.name) as any}
                        />
                        <Chip
                          label="Hệ thống"
                          size="small"
                          color="default"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Custom Role Templates */}
            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              🎨 Vai trò tùy chỉnh
            </Typography>
            {customTemplates.length === 0 ? (
              <Alert severity="info">
                Chưa có vai trò tùy chỉnh nào. Nhấn "Tạo vai trò mới" để tạo vai trò tùy chỉnh.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {customTemplates.map((template) => (
                  <Grid item xs={12} sm={6} md={4} key={template.id}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                          {getRoleIcon(template.name)}
                          <Typography variant="h6">
                            {template.display_name}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {template.description}
                        </Typography>
                        <Box display="flex" gap={1} mt={2}>
                          <Chip
                            label={`${template.permission_count} quyền`}
                            size="small"
                            color={getRoleColor(template.name) as any}
                          />
                          <Chip
                            label="Tùy chỉnh"
                            size="small"
                            color="primary"
                          />
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Tooltip title="Chỉnh sửa vai trò">
                          <IconButton
                            size="small"
                            onClick={() => setEditingTemplate(template)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa vai trò">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteTemplate(template.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoleTemplateManager;
