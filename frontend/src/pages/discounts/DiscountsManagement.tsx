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
  LocalOffer,
  FilterList,
  Percent,
  AttachMoney,
  CheckCircle,
  Error,
  Warning,
  Schedule,
  TrendingUp,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { discountsAPI } from '../../services/api';

// Discount Form Component
interface DiscountFormProps {
  open: boolean;
  onClose: () => void;
  discount?: any;
}

const DiscountForm: React.FC<DiscountFormProps> = ({ open, onClose, discount }) => {
  const [formData, setFormData] = useState({
    code: discount?.code || '',
    name: discount?.name || '',
    description: discount?.description || '',
    type: discount?.type || 'percentage',
    value: discount?.value || 0,
    min_purchase_amount: discount?.min_purchase_amount || 0,
    max_discount_amount: discount?.max_discount_amount || 0,
    usage_limit: discount?.usage_limit || 0,
    usage_count: discount?.usage_count || 0,
    start_date: discount?.start_date || '',
    end_date: discount?.end_date || '',
    is_active: discount?.is_active !== undefined ? discount.is_active : 1,
    applicable_products: discount?.applicable_products || '',
    applicable_categories: discount?.applicable_categories || '',
    customer_restrictions: discount?.customer_restrictions || '',
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => discountsAPI.createDiscount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => discountsAPI.updateDiscount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      code: formData.code,
      name: formData.name,
      description: formData.description,
      type: formData.type,
      value: parseFloat(formData.value.toString()),
      min_purchase_amount: parseFloat(formData.min_purchase_amount.toString()),
      max_discount_amount: parseFloat(formData.max_discount_amount.toString()),
      usage_limit: parseInt(formData.usage_limit.toString()),
      usage_count: parseInt(formData.usage_count.toString()),
      start_date: formData.start_date,
      end_date: formData.end_date,
      is_active: formData.is_active,
      applicable_products: formData.applicable_products.split(',').map((p: string) => p.trim()).filter((p: string) => p),
      applicable_categories: formData.applicable_categories.split(',').map((c: string) => c.trim()).filter((c: string) => c),
      customer_restrictions: formData.customer_restrictions,
    };

    if (discount) {
      updateMutation.mutate({ id: discount.id, data: submitData });
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
    { value: 'fixed', label: 'Số tiền cố định (VNĐ)' },
    { value: 'free_shipping', label: 'Miễn phí vận chuyển' },
    { value: 'buy_x_get_y', label: 'Mua X tặng Y' },
  ];

  const customerRestrictionOptions = [
    { value: 'all', label: 'Tất cả khách hàng' },
    { value: 'new_customers', label: 'Khách hàng mới' },
    { value: 'loyal_customers', label: 'Khách hàng thân thiết' },
    { value: 'specific_customers', label: 'Khách hàng cụ thể' },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {discount ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Mã giảm giá"
                  value={formData.code}
                  onChange={handleChange('code')}
                  required
                />
                <TextField
                  fullWidth
                  label="Tên mã giảm giá"
                  value={formData.name}
                  onChange={handleChange('name')}
                  required
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Loại giảm giá</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={handleChange('type')}
                    label="Loại giảm giá"
                    required
                  >
                    {typeOptions.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Giá trị giảm"
                  type="number"
                  value={formData.value}
                  onChange={handleChange('value')}
                  required
                  InputProps={{
                    endAdornment: <InputAdornment position="end">
                      {formData.type === 'percentage' ? '%' : 'VNĐ'}
                    </InputAdornment>,
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Đơn hàng tối thiểu"
                  type="number"
                  value={formData.min_purchase_amount}
                  onChange={handleChange('min_purchase_amount')}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">VNĐ</InputAdornment>,
                  }}
                />
                <TextField
                  fullWidth
                  label="Giảm tối đa"
                  type="number"
                  value={formData.max_discount_amount}
                  onChange={handleChange('max_discount_amount')}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">VNĐ</InputAdornment>,
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Giới hạn sử dụng"
                  type="number"
                  value={formData.usage_limit}
                  onChange={handleChange('usage_limit')}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">lần</InputAdornment>,
                  }}
                />
                <TextField
                  fullWidth
                  label="Đã sử dụng"
                  type="number"
                  value={formData.usage_count}
                  onChange={handleChange('usage_count')}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">lần</InputAdornment>,
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
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Hạn chế khách hàng</InputLabel>
                  <Select
                    value={formData.customer_restrictions}
                    onChange={handleChange('customer_restrictions')}
                    label="Hạn chế khách hàng"
                  >
                    {customerRestrictionOptions.map((restriction) => (
                      <MenuItem key={restriction.value} value={restriction.value}>
                        {restriction.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Sản phẩm áp dụng (phân cách bằng dấu phẩy)"
                  value={formData.applicable_products}
                  onChange={handleChange('applicable_products')}
                  placeholder="VD: product1, product2, product3"
                />
              </Box>
              <TextField
                fullWidth
                label="Danh mục áp dụng (phân cách bằng dấu phẩy)"
                value={formData.applicable_categories}
                onChange={handleChange('applicable_categories')}
                placeholder="VD: category1, category2, category3"
              />
              <TextField
                fullWidth
                label="Mô tả"
                multiline
                rows={3}
                value={formData.description}
                onChange={handleChange('description')}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active === 1}
                    onChange={handleSwitchChange('is_active')}
                  />
                }
                label="Kích hoạt mã giảm giá"
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
            {discount ? 'Cập nhật' : 'Tạo mã giảm giá'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Discount Row Component
interface DiscountRowProps {
  discount: any;
  onEdit: (discount: any) => void;
  onDelete: (id: string) => void;
  onView: (discount: any) => void;
  onValidate: (code: string) => void;
}

const DiscountRow: React.FC<DiscountRowProps> = ({
  discount,
  onEdit,
  onDelete,
  onView,
  onValidate,
}) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'percentage': return 'primary';
      case 'fixed': return 'info';
      case 'free_shipping': return 'success';
      case 'buy_x_get_y': return 'warning';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage': return <Percent />;
      case 'fixed': return <AttachMoney />;
      case 'free_shipping': return <CheckCircle />;
      case 'buy_x_get_y': return <TrendingUp />;
      default: return <LocalOffer />;
    }
  };

  const isActive = () => {
    if (!discount.is_active) return false;
    const now = new Date();
    const start = discount.start_date ? new Date(discount.start_date) : null;
    const end = discount.end_date ? new Date(discount.end_date) : null;
    
    if (start && now < start) return false;
    if (end && now > end) return false;
    return true;
  };

  const isExpired = () => {
    if (!discount.end_date) return false;
    return new Date(discount.end_date) < new Date();
  };

  const isUsageLimitReached = () => {
    if (!discount.usage_limit) return false;
    return discount.usage_count >= discount.usage_limit;
  };

  const formatValue = (value: number, type: string) => {
    if (type === 'percentage') {
      return `${value}%`;
    } else if (type === 'fixed') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(value);
    } else {
      return value.toString();
    }
  };

  return (
    <TableRow>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            {getTypeIcon(discount.type)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {discount.code}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {discount.name}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getTypeIcon(discount.type)}
          <Chip
            label={discount.type}
            size="small"
            color={getTypeColor(discount.type) as any}
          />
        </Box>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight="medium">
          {formatValue(discount.value, discount.type)}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {discount.usage_count} / {discount.usage_limit || '∞'}
        </Typography>
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isExpired() ? <Error color="error" /> : isUsageLimitReached() ? <Warning color="warning" /> : isActive() ? <CheckCircle color="success" /> : <Schedule color="warning" />}
          <Chip
            label={
              isExpired() ? 'Hết hạn' :
              isUsageLimitReached() ? 'Hết lượt' :
              isActive() ? 'Hoạt động' : 'Chưa kích hoạt'
            }
            size="small"
            color={
              isExpired() ? 'error' :
              isUsageLimitReached() ? 'warning' :
              isActive() ? 'success' : 'default'
            }
          />
        </Box>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {discount.start_date ? new Date(discount.start_date).toLocaleDateString('vi-VN') : 'N/A'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {discount.end_date ? new Date(discount.end_date).toLocaleDateString('vi-VN') : 'N/A'}
        </Typography>
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={() => onView(discount)}>
            <Visibility />
          </IconButton>
          <IconButton size="small" onClick={() => onValidate(discount.code)}>
            <CheckCircle />
          </IconButton>
          <IconButton size="small" onClick={() => onEdit(discount)}>
            <Edit />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => onDelete(discount.id)}>
            <Delete />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
};

// Main Discounts Management Component
const DiscountsManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [selectedDiscount, setSelectedDiscount] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch discounts
  const { data: discountsData, isLoading, error, refetch } = useQuery({
    queryKey: ['discounts', page, pageSize, searchTerm],
    queryFn: () => discountsAPI.getDiscounts(page, pageSize, searchTerm || undefined),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => discountsAPI.deleteDiscount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
    },
  });

  // Validate mutation
  const validateMutation = useMutation({
    mutationFn: (code: string) => discountsAPI.validateDiscount(code),
    onSuccess: (data, variables) => {
      alert(`Mã giảm giá ${variables} ${data.data?.success ? 'hợp lệ' : 'không hợp lệ'}`);
    },
  });

  const discounts = discountsData?.data?.discounts || [];
  const pagination = discountsData?.data?.pagination;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleEdit = (discount: any) => {
    setSelectedDiscount(discount);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = (discount: any) => {
    console.log('View discount:', discount);
  };

  const handleValidate = (code: string) => {
    validateMutation.mutate(code);
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Không thể tải dữ liệu mã giảm giá. Vui lòng kiểm tra kết nối mạng.
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
          Quản lý mã giảm giá
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quản lý các mã giảm giá và khuyến mãi
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box sx={{ flex: '1 1 25%', minWidth: '240px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LocalOffer color="primary" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {pagination?.total || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng mã giảm giá
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
                    {discounts.filter((d: any) => d.is_active).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Đang hoạt động
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
                <Percent color="info" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {discounts.filter((d: any) => d.type === 'percentage').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Giảm phần trăm
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
                <AttachMoney color="warning" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {discounts.filter((d: any) => d.type === 'fixed').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Giảm cố định
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
              placeholder="Tìm kiếm mã giảm giá..."
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
                setSelectedDiscount(null);
                setFormOpen(true);
              }}
            >
              Tạo mã giảm giá
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

      {/* Discounts Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mã giảm giá</TableCell>
                <TableCell>Loại</TableCell>
                <TableCell>Giá trị</TableCell>
                <TableCell>Sử dụng</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Bắt đầu</TableCell>
                <TableCell>Kết thúc</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {discounts.map((discount: any) => (
                <DiscountRow
                  key={discount.id}
                  discount={discount}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                  onValidate={handleValidate}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Empty State */}
      {discounts.length === 0 && !isLoading && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: 'grey.100' }}>
              <LocalOffer sx={{ fontSize: 32, color: 'grey.400' }} />
            </Avatar>
            <Typography variant="h6" gutterBottom>
              Chưa có mã giảm giá nào
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Bắt đầu bằng cách tạo mã giảm giá đầu tiên
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setFormOpen(true)}
            >
              Tạo mã giảm giá đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Discount Form Dialog */}
      <DiscountForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        discount={selectedDiscount}
      />
    </Box>
  );
};

export default DiscountsManagement;