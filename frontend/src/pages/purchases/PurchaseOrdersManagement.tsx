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
  Grid,
  Divider,
} from '@mui/material';
import {
  Search,
  Add,
  Refresh,
  Visibility,
  Edit,
  Delete,
  LocalShipping,
  CheckCircle,
  Pending,
  Cancel,
  Receipt,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseOrdersAPI, productsAPI } from '../../services/api';
import { suppliersAPI } from '../../services/suppliersApi';

// Purchase Order Form Component
interface PurchaseOrderFormProps {
  open: boolean;
  onClose: () => void;
  purchaseOrder?: any;
  suppliers: any[];
  products: any[];
}

const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({ 
  open, 
  onClose, 
  purchaseOrder, 
  suppliers, 
  products 
}) => {
  const [formData, setFormData] = useState({
    supplier_id: purchaseOrder?.supplier_id || '',
    po_number: purchaseOrder?.po_number || '',
    expected_date: purchaseOrder?.expected_date || '',
    payment_terms: purchaseOrder?.payment_terms || 'NET30',
    discount_percent: purchaseOrder?.discount_percent || 0,
    tax_percent: purchaseOrder?.tax_percent || 10,
    shipping_cost: purchaseOrder?.shipping_cost || 0,
    notes: purchaseOrder?.notes || '',
    items: purchaseOrder?.items || []
  });

  const [newItem, setNewItem] = useState({
    product_id: '',
    quantity: 1,
    unit_price: 0,
    discount_percent: 0,
    notes: ''
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => purchaseOrdersAPI.createPurchaseOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => purchaseOrdersAPI.updatePurchaseOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseOrder) {
      updateMutation.mutate({ id: purchaseOrder.id, data: formData });
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

  const addItem = () => {
    if (newItem.product_id && newItem.quantity > 0) {
      const product = products.find(p => p.id === newItem.product_id);
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, {
          ...newItem,
          product_name: product?.name || '',
          product_sku: product?.sku || ''
        }]
      }));
      setNewItem({
        product_id: '',
        quantity: 1,
        unit_price: 0,
        discount_percent: 0,
        notes: ''
      });
    }
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_: any, i: number) => i !== index)
    }));
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.unit_price * (1 - item.discount_percent / 100)), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = subtotal * formData.discount_percent / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * formData.tax_percent / 100;
    return taxableAmount + taxAmount + formData.shipping_cost;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {purchaseOrder ? 'Chỉnh sửa đơn mua hàng' : 'Tạo đơn mua hàng mới'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={3}>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Nhà cung cấp</InputLabel>
                <Select
                  value={formData.supplier_id}
                  onChange={handleChange('supplier_id')}
                  label="Nhà cung cấp"
                  required
                >
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Số đơn mua hàng"
                value={formData.po_number}
                onChange={handleChange('po_number')}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Ngày giao hàng dự kiến"
                type="date"
                value={formData.expected_date}
                onChange={handleChange('expected_date')}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
                required
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Điều khoản thanh toán</InputLabel>
                <Select
                  value={formData.payment_terms}
                  onChange={handleChange('payment_terms')}
                  label="Điều khoản thanh toán"
                >
                  <MenuItem value="NET30">NET30</MenuItem>
                  <MenuItem value="NET15">NET15</MenuItem>
                  <MenuItem value="NET60">NET60</MenuItem>
                  <MenuItem value="COD">COD</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Giảm giá (%)"
                type="number"
                value={formData.discount_percent}
                onChange={handleChange('discount_percent')}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Thuế (%)"
                type="number"
                value={formData.tax_percent}
                onChange={handleChange('tax_percent')}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Phí vận chuyển"
                type="number"
                value={formData.shipping_cost}
                onChange={handleChange('shipping_cost')}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₫</InputAdornment>,
                }}
              />

              <TextField
                fullWidth
                label="Ghi chú"
                multiline
                rows={3}
                value={formData.notes}
                onChange={handleChange('notes')}
              />
            </Box>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Items Section */}
          <Typography variant="h6" gutterBottom>
            Sản phẩm
          </Typography>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Box sx={{ flex: '1 1 33%', minWidth: '200px' }}>
              <FormControl fullWidth>
                <InputLabel>Sản phẩm</InputLabel>
                <Select
                  value={newItem.product_id}
                  onChange={(e) => setNewItem(prev => ({ ...prev, product_id: e.target.value }))}
                  label="Sản phẩm"
                >
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name} - {product.sku}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ flex: '1 1 16%', minWidth: '100px' }}>
              <TextField
                fullWidth
                label="Số lượng"
                type="number"
                value={newItem.quantity}
                onChange={(e) => setNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
              />
            </Box>

            <Box sx={{ flex: '1 1 16%', minWidth: '100px' }}>
              <TextField
                fullWidth
                label="Đơn giá"
                type="number"
                value={newItem.unit_price}
                onChange={(e) => setNewItem(prev => ({ ...prev, unit_price: Number(e.target.value) }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₫</InputAdornment>,
                }}
              />
            </Box>

            <Box sx={{ flex: '1 1 16%', minWidth: '100px' }}>
              <TextField
                fullWidth
                label="Giảm giá (%)"
                type="number"
                value={newItem.discount_percent}
                onChange={(e) => setNewItem(prev => ({ ...prev, discount_percent: Number(e.target.value) }))}
              />
            </Box>

            <Box sx={{ flex: '1 1 16%', minWidth: '100px' }}>
              <Button
                variant="contained"
                onClick={addItem}
                disabled={!newItem.product_id || newItem.quantity <= 0}
                fullWidth
              >
                Thêm
              </Button>
            </Box>
          </Grid>

          {/* Items List */}
          {formData.items.length > 0 && (
            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Sản phẩm</TableCell>
                    <TableCell align="right">Số lượng</TableCell>
                    <TableCell align="right">Đơn giá</TableCell>
                    <TableCell align="right">Giảm giá (%)</TableCell>
                    <TableCell align="right">Thành tiền</TableCell>
                    <TableCell align="center">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.items.map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {item.product_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.product_sku}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(item.unit_price)}
                      </TableCell>
                      <TableCell align="right">{item.discount_percent}%</TableCell>
                      <TableCell align="right">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(item.quantity * item.unit_price * (1 - item.discount_percent / 100))}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => removeItem(index)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Summary */}
          <Card sx={{ bgcolor: 'grey.50' }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2">Tạm tính:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" align="right">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(calculateSubtotal())}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2">Giảm giá ({formData.discount_percent}%):</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" align="right">
                    -{new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(calculateSubtotal() * formData.discount_percent / 100)}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2">Thuế ({formData.tax_percent}%):</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" align="right">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format((calculateSubtotal() - calculateSubtotal() * formData.discount_percent / 100) * formData.tax_percent / 100)}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2">Phí vận chuyển:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" align="right">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(formData.shipping_cost)}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="h6" fontWeight="bold">Tổng cộng:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h6" fontWeight="bold" align="right">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(calculateTotal())}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Hủy</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createMutation.isPending || updateMutation.isPending || formData.items.length === 0}
          >
            {purchaseOrder ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Purchase Order Row Component
interface PurchaseOrderRowProps {
  purchaseOrder: any;
  onEdit: (purchaseOrder: any) => void;
  onDelete: (id: string) => void;
  onView: (purchaseOrder: any) => void;
  onUpdateStatus: (id: string, status: string) => void;
}

const PurchaseOrderRow: React.FC<PurchaseOrderRowProps> = ({
  purchaseOrder,
  onEdit,
  onDelete,
  onView,
  onUpdateStatus,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'sent': return 'info';
      case 'confirmed': return 'primary';
      case 'partial': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Nháp';
      case 'sent': return 'Đã gửi';
      case 'confirmed': return 'Đã xác nhận';
      case 'partial': return 'Nhận một phần';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Receipt />;
      case 'sent': return <LocalShipping />;
      case 'confirmed': return <CheckCircle />;
      case 'partial': return <Pending />;
      case 'completed': return <CheckCircle />;
      case 'cancelled': return <Cancel />;
      default: return <Receipt />;
    }
  };

  return (
    <TableRow>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
            {getStatusIcon(purchaseOrder.status)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="bold">
              {purchaseOrder.po_number}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {purchaseOrder.supplier_name}
            </Typography>
          </Box>
        </Box>
      </TableCell>

      <TableCell>
        <Typography variant="body2">
          {new Date(purchaseOrder.created_at).toLocaleDateString('vi-VN')}
        </Typography>
      </TableCell>

      <TableCell>
        <Typography variant="body2">
          {new Date(purchaseOrder.expected_date).toLocaleDateString('vi-VN')}
        </Typography>
      </TableCell>

      <TableCell>
        <Chip
          label={getStatusLabel(purchaseOrder.status)}
          color={getStatusColor(purchaseOrder.status)}
          size="small"
        />
      </TableCell>

      <TableCell align="right">
        <Typography variant="body2" fontWeight="bold">
          {formatCurrency(purchaseOrder.total_amount)}
        </Typography>
      </TableCell>

      <TableCell align="center">
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={() => onView(purchaseOrder)}>
            <Visibility />
          </IconButton>
          <IconButton size="small" onClick={() => onEdit(purchaseOrder)}>
            <Edit />
          </IconButton>
          <IconButton size="small" onClick={() => onDelete(purchaseOrder.id)}>
            <Delete />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
};

// Main Purchase Orders Management Component
const PurchaseOrdersManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const queryClient = useQueryClient();

  // Fetch purchase orders
  const { data: purchaseOrdersData, isLoading, error, refetch } = useQuery({
    queryKey: ['purchase-orders', page, pageSize, searchTerm, statusFilter],
    queryFn: () => purchaseOrdersAPI.getPurchaseOrders(page, pageSize, searchTerm, statusFilter),
  });

  // Fetch suppliers
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersAPI.getSuppliers(1, 100),
  });

  // Fetch products
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsAPI.getProducts(1, 100),
  });

  // Delete mutation
  // const deleteMutation = useMutation({
  //   mutationFn: (id: string) => purchaseOrdersAPI.updatePurchaseOrder(id, { status: 'cancelled' }),
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
  //   },
  // });

  // Update status mutation
  // const updateStatusMutation = useMutation({
  //   mutationFn: ({ id, status }: { id: string; status: string }) => 
  //     purchaseOrdersAPI.updateStatus(id, status),
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
  //   },
  // });

  const purchaseOrders = purchaseOrdersData?.data?.purchaseOrders || [];
  const suppliers = suppliersData?.data?.suppliers || [];
  const products = productsData?.data?.products || [];
  // const pagination = purchaseOrdersData?.data?.pagination;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleEdit = (purchaseOrder: any) => {
    setSelectedPurchaseOrder(purchaseOrder);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn hủy đơn mua hàng này?')) {
      // deleteMutation.mutate(id);
      console.log('Delete purchase order:', id);
    }
  };

  const handleView = (purchaseOrder: any) => {
    console.log('View purchase order:', purchaseOrder);
  };

  const handleUpdateStatus = (id: string, status: string) => {
    // updateStatusMutation.mutate({ id, status });
    console.log('Update status:', id, status);
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error">
          Có lỗi xảy ra khi tải dữ liệu: {(error as any).message}
        </Alert>
        <Button onClick={handleRefresh} sx={{ mt: 2 }}>
          Thử lại
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Quản lý đơn mua hàng
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setSelectedPurchaseOrder(null);
            setFormOpen(true);
          }}
        >
          Tạo đơn mua hàng
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Tìm kiếm theo số đơn, nhà cung cấp..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1 }}
            />

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Trạng thái"
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="draft">Nháp</MenuItem>
                <MenuItem value="sent">Đã gửi</MenuItem>
                <MenuItem value="confirmed">Đã xác nhận</MenuItem>
                <MenuItem value="partial">Nhận một phần</MenuItem>
                <MenuItem value="completed">Hoàn thành</MenuItem>
                <MenuItem value="cancelled">Đã hủy</MenuItem>
              </Select>
            </FormControl>

            <IconButton onClick={handleRefresh}>
              <Refresh />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      {/* Purchase Orders Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Đơn mua hàng</TableCell>
                <TableCell>Ngày tạo</TableCell>
                <TableCell>Ngày giao dự kiến</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="right">Tổng tiền</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : purchaseOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              ) : (
                purchaseOrders.map((purchaseOrder: any) => (
                  <PurchaseOrderRow
                    key={purchaseOrder.id}
                    purchaseOrder={purchaseOrder}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Purchase Order Form Dialog */}
      <PurchaseOrderForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        purchaseOrder={selectedPurchaseOrder}
        suppliers={suppliers}
        products={products}
      />
    </Box>
  );
};

export default PurchaseOrdersManagement;