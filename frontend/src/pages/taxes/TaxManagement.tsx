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
  AccountBalance,
  FilterList,
  MoreVert,
  Percent,
  CheckCircle,
  Error,
  Warning,
  Schedule,
  TrendingUp,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taxesAPI } from '../../services/api';

// Tax Form Component
interface TaxFormProps {
  open: boolean;
  onClose: () => void;
  tax?: any;
}

const TaxForm: React.FC<TaxFormProps> = ({ open, onClose, tax }) => {
  const [formData, setFormData] = useState({
    name: tax?.name || '',
    rate: tax?.rate || 0,
    type: tax?.type || 'percentage',
    description: tax?.description || '',
    is_active: tax?.is_active !== undefined ? tax.is_active : 1,
    applies_to: tax?.applies_to || 'all',
    effective_from: tax?.effective_from || '',
    effective_to: tax?.effective_to || '',
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => taxesAPI.createTax(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => taxesAPI.updateTax(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      name: formData.name,
      rate: parseFloat(formData.rate.toString()),
      type: formData.type,
      description: formData.description,
      is_active: formData.is_active,
      applies_to: formData.applies_to,
      effective_from: formData.effective_from,
      effective_to: formData.effective_to,
    };

    if (tax) {
      updateMutation.mutate({ id: tax.id, data: submitData });
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
    { value: 'percentage', label: 'Phần trăm (%)' },
    { value: 'fixed', label: 'Cố định (VNĐ)' },
  ];

  const appliesToOptions = [
    { value: 'all', label: 'Tất cả sản phẩm' },
    { value: 'categories', label: 'Theo danh mục' },
    { value: 'products', label: 'Theo sản phẩm' },
    { value: 'services', label: 'Dịch vụ' },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {tax ? 'Chỉnh sửa thuế' : 'Thêm thuế mới'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tên thuế"
                  value={formData.name}
                  onChange={handleChange('name')}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tỷ lệ thuế"
                  type="number"
                  value={formData.rate}
                  onChange={handleChange('rate')}
                  required
                  InputProps={{
                    endAdornment: <InputAdornment position="end">{formData.type === 'percentage' ? '%' : 'VNĐ'}</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Loại thuế</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={handleChange('type')}
                    label="Loại thuế"
                    required
                  >
                    {typeOptions.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Áp dụng cho</InputLabel>
                  <Select
                    value={formData.applies_to}
                    onChange={handleChange('applies_to')}
                    label="Áp dụng cho"
                  >
                    {appliesToOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Có hiệu lực từ"
                  type="date"
                  value={formData.effective_from}
                  onChange={handleChange('effective_from')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Có hiệu lực đến"
                  type="date"
                  value={formData.effective_to}
                  onChange={handleChange('effective_to')}
                  InputLabelProps={{ shrink: true }}
                />
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
                  label="Kích hoạt thuế"
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
            {tax ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Tax Row Component
interface TaxRowProps {
  tax: any;
  onEdit: (tax: any) => void;
  onDelete: (id: string) => void;
  onView: (tax: any) => void;
}

const TaxRow: React.FC<TaxRowProps> = ({
  tax,
  onEdit,
  onDelete,
  onView,
}) => {
  const getTypeIcon = (type: string) => {
    return type === 'percentage' ? <Percent /> : <AccountBalance />;
  };

  const getTypeColor = (type: string) => {
    return type === 'percentage' ? 'primary' : 'secondary';
  };

  const isActive = () => {
    if (!tax.is_active) return false;
    const now = new Date();
    const from = tax.effective_from ? new Date(tax.effective_from) : null;
    const to = tax.effective_to ? new Date(tax.effective_to) : null;
    
    if (from && now < from) return false;
    if (to && now > to) return false;
    return true;
  };

  return (
    <TableRow>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            {getTypeIcon(tax.type)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {tax.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {tax.description}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={`${tax.rate}${tax.type === 'percentage' ? '%' : ' VNĐ'}`}
            size="small"
            color={getTypeColor(tax.type) as any}
            icon={getTypeIcon(tax.type)}
          />
        </Box>
      </TableCell>
      <TableCell>
        <Chip
          label={tax.applies_to}
          size="small"
          color="info"
          variant="outlined"
        />
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isActive() ? <CheckCircle color="success" /> : <Error color="error" />}
          <Chip
            label={isActive() ? 'Hoạt động' : 'Không hoạt động'}
            size="small"
            color={isActive() ? 'success' : 'default'}
          />
        </Box>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {tax.effective_from ? new Date(tax.effective_from).toLocaleDateString('vi-VN') : 'Không giới hạn'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {tax.effective_to ? new Date(tax.effective_to).toLocaleDateString('vi-VN') : 'Không giới hạn'}
        </Typography>
      </TableCell>
      <TableCell>{new Date(tax.created_at).toLocaleDateString('vi-VN')}</TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={() => onView(tax)}>
            <Visibility />
          </IconButton>
          <IconButton size="small" onClick={() => onEdit(tax)}>
            <Edit />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => onDelete(tax.id)}>
            <Delete />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
};

// Main Tax Management Component
const TaxManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [selectedTax, setSelectedTax] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch taxes
  const { data: taxesData, isLoading, error, refetch } = useQuery({
    queryKey: ['taxes', page, pageSize, searchTerm],
    queryFn: () => taxesAPI.getTaxes(page, pageSize, searchTerm || undefined),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => taxesAPI.deleteTax(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
    },
  });

  const taxes = taxesData?.data?.taxes || [];
  const pagination = taxesData?.data?.pagination;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleEdit = (tax: any) => {
    setSelectedTax(tax);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thuế này?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = (tax: any) => {
    console.log('View tax:', tax);
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Không thể tải dữ liệu thuế. Vui lòng kiểm tra kết nối mạng.
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
          Quản lý thuế
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quản lý các loại thuế và phí áp dụng cho sản phẩm
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccountBalance color="primary" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {pagination?.total || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng thuế
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
                    {taxes.filter((t: any) => t.is_active).length}
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
                <Percent color="info" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {taxes.filter((t: any) => t.type === 'percentage').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Thuế phần trăm
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
                <TrendingUp color="warning" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {taxes.filter((t: any) => t.type === 'fixed').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Thuế cố định
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
              placeholder="Tìm kiếm thuế..."
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
                setSelectedTax(null);
                setFormOpen(true);
              }}
            >
              Thêm thuế
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

      {/* Taxes Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Thuế</TableCell>
                <TableCell>Tỷ lệ</TableCell>
                <TableCell>Áp dụng cho</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Có hiệu lực từ</TableCell>
                <TableCell>Có hiệu lực đến</TableCell>
                <TableCell>Ngày tạo</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {taxes.map((tax: any) => (
                <TaxRow
                  key={tax.id}
                  tax={tax}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Empty State */}
      {taxes.length === 0 && !isLoading && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: 'grey.100' }}>
              <AccountBalance sx={{ fontSize: 32, color: 'grey.400' }} />
            </Avatar>
            <Typography variant="h6" gutterBottom>
              Chưa có thuế nào
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Bắt đầu bằng cách thêm thuế đầu tiên của bạn
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setFormOpen(true)}
            >
              Thêm thuế đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tax Form Dialog */}
      <TaxForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        tax={selectedTax}
      />
    </Box>
  );
};

export default TaxManagement;