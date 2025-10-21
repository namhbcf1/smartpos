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
  Devices,
  FilterList,
  MoreVert,
  Computer,
  Print,
  Scanner,
  PhoneAndroid,
  Wifi,
  WifiOff,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { devicesAPI } from '../../services/api';

// Device Form Component
interface DeviceFormProps {
  open: boolean;
  onClose: () => void;
  device?: any;
}

const DeviceForm: React.FC<DeviceFormProps> = ({ open, onClose, device }) => {
  const [formData, setFormData] = useState({
    name: device?.name || '',
    type: device?.type || '',
    model: device?.model || '',
    serial_number: device?.serial_number || '',
    mac_address: device?.mac_address || '',
    ip_address: device?.ip_address || '',
    location: device?.location || '',
    status: device?.status || 'active',
    is_active: device?.is_active !== undefined ? device.is_active : 1,
    description: device?.description || '',
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => devicesAPI.createDevice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => devicesAPI.updateDevice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      name: formData.name,
      type: formData.type,
      model: formData.model,
      serial_number: formData.serial_number,
      mac_address: formData.mac_address,
      ip_address: formData.ip_address,
      location: formData.location,
      status: formData.status,
      is_active: formData.is_active,
      description: formData.description,
    };

    if (device) {
      updateMutation.mutate({ id: device.id, data: submitData });
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

  const deviceTypes = [
    { value: 'pos_terminal', label: 'Máy POS' },
    { value: 'printer', label: 'Máy in' },
    { value: 'scanner', label: 'Máy quét' },
    { value: 'cash_drawer', label: 'Ngăn kéo tiền' },
    { value: 'display', label: 'Màn hình' },
    { value: 'tablet', label: 'Máy tính bảng' },
    { value: 'mobile', label: 'Điện thoại' },
    { value: 'other', label: 'Khác' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Hoạt động' },
    { value: 'inactive', label: 'Không hoạt động' },
    { value: 'maintenance', label: 'Bảo trì' },
    { value: 'error', label: 'Lỗi' },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {device ? 'Chỉnh sửa thiết bị' : 'Thêm thiết bị mới'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tên thiết bị"
                  value={formData.name}
                  onChange={handleChange('name')}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Loại thiết bị</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={handleChange('type')}
                    label="Loại thiết bị"
                    required
                  >
                    {deviceTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Model"
                  value={formData.model}
                  onChange={handleChange('model')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Số serial"
                  value={formData.serial_number}
                  onChange={handleChange('serial_number')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="MAC Address"
                  value={formData.mac_address}
                  onChange={handleChange('mac_address')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="IP Address"
                  value={formData.ip_address}
                  onChange={handleChange('ip_address')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Vị trí"
                  value={formData.location}
                  onChange={handleChange('location')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Trạng thái</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={handleChange('status')}
                    label="Trạng thái"
                  >
                    {statusOptions.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Mô tả"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={handleChange('description')}
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
                  label="Kích hoạt thiết bị"
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
            {device ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Device Row Component
interface DeviceRowProps {
  device: any;
  onEdit: (device: any) => void;
  onDelete: (id: string) => void;
  onView: (device: any) => void;
  onTest: (id: string) => void;
}

const DeviceRow: React.FC<DeviceRowProps> = ({
  device,
  onEdit,
  onDelete,
  onView,
  onTest,
}) => {
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'pos_terminal': return <Computer />;
      case 'printer': return <Print />;
      case 'scanner': return <Scanner />;
      case 'tablet': return <PhoneAndroid />;
      case 'mobile': return <PhoneAndroid />;
      default: return <Devices />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'maintenance': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle />;
      case 'error': return <Error />;
      default: return null;
    }
  };

  return (
    <TableRow>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            {getDeviceIcon(device.type)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {device.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {device.model}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Chip
          label={device.type.replace('_', ' ').toUpperCase()}
          size="small"
          color="primary"
          variant="outlined"
        />
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getStatusIcon(device.status)}
          <Chip
            label={device.status}
            size="small"
            color={getStatusColor(device.status) as any}
          />
        </Box>
      </TableCell>
      <TableCell>{device.location || 'Chưa xác định'}</TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {device.ip_address ? <Wifi color="success" /> : <WifiOff color="error" />}
          <Typography variant="body2">
            {device.ip_address || 'Chưa kết nối'}
          </Typography>
        </Box>
      </TableCell>
      <TableCell>{device.last_seen ? new Date(device.last_seen).toLocaleDateString('vi-VN') : 'Chưa kết nối'}</TableCell>
      <TableCell>{new Date(device.created_at).toLocaleDateString('vi-VN')}</TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={() => onView(device)}>
            <Visibility />
          </IconButton>
          <IconButton size="small" onClick={() => onTest(device.id)}>
            <CheckCircle />
          </IconButton>
          <IconButton size="small" onClick={() => onEdit(device)}>
            <Edit />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => onDelete(device.id)}>
            <Delete />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
};

// Main Devices Management Component
const DevicesManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch devices
  const { data: devicesData, isLoading, error, refetch } = useQuery({
    queryKey: ['devices', page, pageSize, searchTerm],
    queryFn: () => devicesAPI.getDevices(page, pageSize, searchTerm || undefined),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => devicesAPI.deleteDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });

  const devices = devicesData?.data?.devices || [];
  const pagination = devicesData?.data?.pagination;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleEdit = (device: any) => {
    setSelectedDevice(device);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thiết bị này?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = (device: any) => {
    console.log('View device:', device);
  };

  const handleTest = (id: string) => {
    console.log('Test device:', id);
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Không thể tải dữ liệu thiết bị. Vui lòng kiểm tra kết nối mạng.
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
          Quản lý thiết bị
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quản lý các thiết bị POS và thiết bị ngoại vi
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Devices color="primary" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {pagination?.total || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng thiết bị
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircle color="success" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {devices.filter((d: any) => d.status === 'active').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Đang hoạt động
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Error color="error" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {devices.filter((d: any) => d.status === 'error').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Có lỗi
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Wifi color="info" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {devices.filter((d: any) => d.ip_address).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Đã kết nối
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Toolbar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Tìm kiếm thiết bị..."
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
                setSelectedDevice(null);
                setFormOpen(true);
              }}
            >
              Thêm thiết bị
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

      {/* Devices Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Thiết bị</TableCell>
                <TableCell>Loại</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Vị trí</TableCell>
                <TableCell>Kết nối</TableCell>
                <TableCell>Lần kết nối cuối</TableCell>
                <TableCell>Ngày tạo</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {devices.map((device: any) => (
                <DeviceRow
                  key={device.id}
                  device={device}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                  onTest={handleTest}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Empty State */}
      {devices.length === 0 && !isLoading && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: 'grey.100' }}>
              <Devices sx={{ fontSize: 32, color: 'grey.400' }} />
            </Avatar>
            <Typography variant="h6" gutterBottom>
              Chưa có thiết bị nào
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Bắt đầu bằng cách thêm thiết bị đầu tiên của bạn
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setFormOpen(true)}
            >
              Thêm thiết bị đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Device Form Dialog */}
      <DeviceForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        device={selectedDevice}
      />
    </Box>
  );
};

export default DevicesManagement;