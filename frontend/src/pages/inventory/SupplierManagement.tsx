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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
} from '@mui/material';
import {
  Search,
  Add,
  Refresh,
  Visibility,
  Edit,
  Delete,
  Business,
  Phone,
  Email,
  LocationOn,
  AttachMoney,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Cancel,
  Warning,
  LocalShipping,
  Assessment,
  Star,
  StarBorder,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersAPI } from '../../services/api';

// Supplier Interface
interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  tax_number: string;
  payment_terms: string;
  credit_limit_cents: number;
  is_active: boolean;
  rating?: number;
  total_orders?: number;
  total_amount?: number;
  last_order_date?: string;
  created_at?: string;
  updated_at?: string;
}

// Supplier Form Component
interface SupplierFormProps {
  open: boolean;
  onClose: () => void;
  supplier?: Supplier;
}

const SupplierForm: React.FC<SupplierFormProps> = ({ open, onClose, supplier }) => {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    contact_person: supplier?.contact_person || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    address: supplier?.address || '',
    tax_number: supplier?.tax_number || '',
    payment_terms: supplier?.payment_terms || '',
    credit_limit_cents: supplier?.credit_limit_cents || 0,
    is_active: supplier?.is_active !== undefined ? supplier.is_active : true,
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => suppliersAPI.createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => suppliersAPI.updateSupplier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (supplier) {
      updateMutation.mutate({ id: supplier.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {supplier ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Tên công ty"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Người liên hệ"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                required
              />
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Số điện thoại"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </Box>
            <Box sx={{ flex: '1 1 100%', minWidth: '100%' }}>
              <TextField
                fullWidth
                label="Địa chỉ"
                name="address"
                multiline
                rows={3}
                value={formData.address}
                onChange={handleChange}
                required
              />
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Mã số thuế"
                name="tax_number"
                value={formData.tax_number}
                onChange={handleChange}
              />
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <FormControl fullWidth>
                <InputLabel>Điều khoản thanh toán</InputLabel>
                <Select
                  name="payment_terms"
                  value={formData.payment_terms}
                  label="Điều khoản thanh toán"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="cash">Tiền mặt</MenuItem>
                  <MenuItem value="net_15">Net 15 ngày</MenuItem>
                  <MenuItem value="net_30">Net 30 ngày</MenuItem>
                  <MenuItem value="net_45">Net 45 ngày</MenuItem>
                  <MenuItem value="net_60">Net 60 ngày</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 100%', minWidth: '100%' }}>
              <TextField
                fullWidth
                label="Hạn mức tín dụng (VNĐ)"
                name="credit_limit_cents"
                type="number"
                value={formData.credit_limit_cents}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₫</InputAdornment>
                  ),
                }}
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
            {supplier ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Supplier Card Component
interface SupplierCardProps {
  supplier: Supplier;
  onView: (supplier: Supplier) => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (id: string) => void;
}

const SupplierCard: React.FC<SupplierCardProps> = ({ supplier, onView, onEdit, onDelete }) => {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(cents);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getPaymentTermsLabel = (terms: string) => {
    switch (terms) {
      case 'cash': return 'Tiền mặt';
      case 'net_15': return 'Net 15 ngày';
      case 'net_30': return 'Net 30 ngày';
      case 'net_45': return 'Net 45 ngày';
      case 'net_60': return 'Net 60 ngày';
      default: return terms;
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <Business />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {supplier.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {supplier.contact_person}
              </Typography>
              <Chip
                label={getPaymentTermsLabel(supplier.payment_terms)}
                size="small"
                color="primary"
              />
            </Box>
          </Box>
          <Chip
            label={supplier.is_active ? 'Hoạt động' : 'Tạm dừng'}
            size="small"
            color={supplier.is_active ? 'success' : 'default'}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <Email sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
            {supplier.email}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <Phone sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
            {supplier.phone}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <LocationOn sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
            {supplier.address.length > 50 
              ? `${supplier.address.substring(0, 50)}...` 
              : supplier.address}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Hạn mức tín dụng:
          </Typography>
          <Typography variant="body2" fontWeight="medium" color="primary">
            {formatCurrency(supplier.credit_limit_cents || 0)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Tổng đơn hàng:
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {supplier.total_orders || 0}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Tổng giá trị:
          </Typography>
          <Typography variant="body2" fontWeight="medium" color="success.main">
            {formatCurrency(supplier.total_amount || 0)}
          </Typography>
        </Box>
        {supplier.rating && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Đánh giá:
            </Typography>
            <Rating
              value={supplier.rating}
              readOnly
              size="small"
            />
          </Box>
        )}
      </CardContent>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={<Visibility />}
            onClick={() => onView(supplier)}
            sx={{ flex: 1 }}
          >
            Xem
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => onEdit(supplier)}
            sx={{ flex: 1 }}
          >
            Sửa
          </Button>
          <Button
            size="small"
            color="error"
            startIcon={<Delete />}
            onClick={() => onDelete(supplier.id)}
            sx={{ flex: 1 }}
          >
            Xóa
          </Button>
        </Box>
      </Box>
    </Card>
  );
};

// Purchase Orders Component
const PurchaseOrders: React.FC = () => {
  const purchaseOrders = [
    { id: 1, supplier: 'Công ty ABC', order_date: '2024-01-15', total: 5000000, status: 'pending' },
    { id: 2, supplier: 'Công ty XYZ', order_date: '2024-01-14', total: 3200000, status: 'completed' },
    { id: 3, supplier: 'Công ty DEF', order_date: '2024-01-13', total: 7500000, status: 'shipped' },
  ];

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(cents);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'completed': return 'success';
      case 'shipped': return 'info';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'completed': return 'Hoàn thành';
      case 'shipped': return 'Đã giao';
      default: return status;
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Đơn hàng nhập gần đây
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Mã đơn</TableCell>
                <TableCell>Nhà cung cấp</TableCell>
                <TableCell>Ngày đặt</TableCell>
                <TableCell align="right">Tổng tiền</TableCell>
                <TableCell align="center">Trạng thái</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchaseOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      #PO-{order.id.toString().padStart(4, '0')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {order.supplier}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(order.order_date).toLocaleDateString('vi-VN')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(order.total)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getStatusLabel(order.status)}
                      size="small"
                      color={getStatusColor(order.status) as any}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

// Supplier Performance Component
const SupplierPerformance: React.FC = () => {
  const performanceData = [
    { name: 'Công ty ABC', orders: 25, total_amount: 150000000, rating: 4.8, on_time_delivery: 95 },
    { name: 'Công ty XYZ', orders: 18, total_amount: 120000000, rating: 4.6, on_time_delivery: 88 },
    { name: 'Công ty DEF', orders: 32, total_amount: 200000000, rating: 4.9, on_time_delivery: 92 },
  ];

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(cents);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Hiệu suất nhà cung cấp
        </Typography>
        <List>
          {performanceData.map((supplier, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Business />
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={supplier.name}
                secondary={
                  <Box>
                    <Typography variant="body2">
                      Đơn hàng: {supplier.orders} | 
                      Tổng giá trị: {formatCurrency(supplier.total_amount)} | 
                      Giao hàng đúng hạn: {supplier.on_time_delivery}%
                    </Typography>
                  </Box>
                }
              />
              <Rating
                value={supplier.rating}
                readOnly
                size="small"
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

// Main Supplier Management Component
const SupplierManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // const queryClient = useQueryClient();

  // Fetch suppliers
  const { data: suppliersData, isLoading, error, refetch } = useQuery({
    queryKey: ['suppliers', page, pageSize, searchTerm, statusFilter],
    queryFn: () => suppliersAPI.getSuppliers(page, pageSize, searchTerm),
  });

  const suppliers = suppliersData?.data?.suppliers || [];
  const pagination = suppliersData?.data?.pagination;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nhà cung cấp này?')) {
      // Handle delete
      console.log('Delete supplier:', id);
    }
  };

  const handleView = (supplier: Supplier) => {
    // Handle view action
    console.log('View supplier:', supplier);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Không thể tải dữ liệu nhà cung cấp. Vui lòng kiểm tra kết nối mạng.
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
          Quản lý nhà cung cấp
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quản lý thông tin nhà cung cấp và đơn hàng nhập
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Business color="primary" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {pagination?.total || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng nhà cung cấp
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
                <CheckCircle color="success" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {suppliers.filter(s => s.is_active).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Đang hoạt động
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
                <LocalShipping color="warning" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {suppliers.filter((s: any) => s.total_orders && s.total_orders > 0).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Có đơn hàng
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
                <Star color="info" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {suppliers.filter((s: any) => s.rating && s.rating >= 4.5).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Đánh giá cao
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="supplier tabs">
          <Tab label="Danh sách nhà cung cấp" />
          <Tab label="Đơn hàng nhập" />
          <Tab label="Hiệu suất" />
        </Tabs>
      </Card>

      {/* Tab Content */}
      {activeTab === 0 && (
        <>
          {/* Toolbar */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  placeholder="Tìm kiếm nhà cung cấp..."
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
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Trạng thái</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="Trạng thái"
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    <MenuItem value="active">Hoạt động</MenuItem>
                    <MenuItem value="inactive">Tạm dừng</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => {
                    setSelectedSupplier(null);
                    setFormOpen(true);
                  }}
                >
                  Thêm nhà cung cấp
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={handleRefresh}
                >
                  Làm mới
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Suppliers Grid */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {suppliers.map((supplier: Supplier) => (
              <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
                <SupplierCard
                  supplier={supplier}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </Box>
            ))}
          </Box>

          {/* Empty State */}
          {suppliers.length === 0 && !isLoading && (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: 'grey.100' }}>
                  <Business sx={{ fontSize: 32, color: 'grey.400' }} />
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  Chưa có nhà cung cấp nào
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Bắt đầu bằng cách thêm nhà cung cấp đầu tiên
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setFormOpen(true)}
                >
                  Thêm nhà cung cấp đầu tiên
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {activeTab === 1 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: '1 1 100%', minWidth: '100%' }}>
            <PurchaseOrders />
          </Box>
        </Box>
      )}

      {activeTab === 2 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: '1 1 100%', minWidth: '100%' }}>
            <SupplierPerformance />
          </Box>
        </Box>
      )}

      {/* Supplier Form Dialog */}
      <SupplierForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        supplier={selectedSupplier || undefined}
      />
    </Box>
  );
};

export default SupplierManagement;