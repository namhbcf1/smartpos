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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Search,
  Add,
  Refresh,
  Visibility,
  Edit,
  Delete,
  Payment,
  FilterList,
  MoreVert,
  CreditCard,
  AccountBalance,
  Smartphone,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsAPI, customersAPI } from '../../services/api';

// Payment Form Component
interface PaymentFormProps {
  open: boolean;
  onClose: () => void;
  payment?: any;
  customers: any[];
}

const PaymentForm: React.FC<PaymentFormProps> = ({ open, onClose, payment, customers }) => {
  const [formData, setFormData] = useState({
    customer_id: payment?.customer_id || '',
    amount: payment?.amount || 0,
    payment_method: payment?.payment_method || 'cash',
    reference: payment?.reference || '',
    notes: payment?.notes || '',
    status: payment?.status || 'pending',
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => paymentsAPI.createPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => paymentsAPI.updatePayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payment) {
      updateMutation.mutate({ id: payment.id, data: formData });
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {payment ? 'Chỉnh sửa thanh toán' : 'Tạo thanh toán mới'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Khách hàng</InputLabel>
              <Select
                value={formData.customer_id}
                onChange={handleChange('customer_id')}
                label="Khách hàng"
                required
              >
                {customers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.name} - {customer.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Số tiền (VNĐ)"
              type="number"
              value={formData.amount}
              onChange={handleChange('amount')}
              required
            />
            <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Payment color="primary" />
                <Typography variant="h6" color="primary">
                  Thanh toán tiền mặt
                </Typography>
              </Box>
            </Box>
            <TextField
              fullWidth
              label="Mã tham chiếu"
              value={formData.reference}
              onChange={handleChange('reference')}
            />
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={formData.status}
                onChange={handleChange('status')}
                label="Trạng thái"
              >
                <MenuItem value="pending">Chờ xử lý</MenuItem>
                <MenuItem value="completed">Hoàn thành</MenuItem>
                <MenuItem value="failed">Thất bại</MenuItem>
                <MenuItem value="refunded">Đã hoàn tiền</MenuItem>
                <MenuItem value="cancelled">Đã hủy</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Ghi chú"
              multiline
              rows={3}
              value={formData.notes}
              onChange={handleChange('notes')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Hủy</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {payment ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Payment Row Component
interface PaymentRowProps {
  payment: any;
  onEdit: (payment: any) => void;
  onDelete: (id: string) => void;
  onView: (payment: any) => void;
  onRefund: (id: string) => void;
}

const PaymentRow: React.FC<PaymentRowProps> = ({
  payment,
  onEdit,
  onDelete,
  onView,
  onRefund,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'refunded': return 'info';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'completed': return 'Hoàn thành';
      case 'failed': return 'Thất bại';
      case 'refunded': return 'Đã hoàn tiền';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const getMethodIcon = (method: string) => {
    return <Payment />;
  };

  const getMethodLabel = (method: string) => {
    return 'Tiền mặt';
  };

  return (
    <TableRow>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getMethodIcon(payment.payment_method)}
          <Typography variant="body2">{getMethodLabel(payment.payment_method)}</Typography>
        </Box>
      </TableCell>
      <TableCell>{payment.customer_name}</TableCell>
      <TableCell>{formatCurrency(payment.amount)}</TableCell>
      <TableCell>
        <Chip
          label={getStatusLabel(payment.status)}
          size="small"
          color={getStatusColor(payment.status) as any}
        />
      </TableCell>
      <TableCell>{payment.reference || '-'}</TableCell>
      <TableCell>{new Date(payment.created_at).toLocaleDateString('vi-VN')}</TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={() => onView(payment)}>
            <Visibility />
          </IconButton>
          {payment.status === 'completed' && (
            <IconButton size="small" onClick={() => onRefund(payment.id)}>
              <Payment />
            </IconButton>
          )}
          <IconButton size="small" onClick={() => onEdit(payment)}>
            <Edit />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => onDelete(payment.id)}>
            <Delete />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
};

// Main Payments Management Component
const PaymentsManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch payments
  const { data: paymentsData, isLoading, error, refetch } = useQuery({
    queryKey: ['payments', page, pageSize, searchTerm],
    queryFn: () => paymentsAPI.getPayments(page, pageSize, searchTerm || undefined),
  });

  // Fetch customers
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersAPI.getCustomers(1, 100),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => paymentsAPI.deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });

  const payments = paymentsData?.data?.payments || [];
  const customers = customersData?.data?.customers || [];
  const pagination = paymentsData?.data?.pagination;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleEdit = (payment: any) => {
    setSelectedPayment(payment);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thanh toán này?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = (payment: any) => {
    console.log('View payment:', payment);
  };

  const handleRefund = (id: string) => {
    console.log('Refund payment:', id);
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Không thể tải dữ liệu thanh toán. Vui lòng kiểm tra kết nối mạng.
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
          Quản lý thanh toán
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quản lý các giao dịch thanh toán
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Payment color="primary" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {pagination?.total || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng thanh toán
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
                <Payment color="success" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {payments.filter((p: any) => p.status === 'completed').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hoàn thành
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
                <Payment color="warning" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {payments.filter((p: any) => p.status === 'pending').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Chờ xử lý
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
                <Payment color="error" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {payments.filter((p: any) => p.status === 'failed').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Thất bại
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
              placeholder="Tìm kiếm thanh toán..."
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
                setSelectedPayment(null);
                setFormOpen(true);
              }}
            >
              Tạo thanh toán
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

      {/* Payments Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Phương thức</TableCell>
                <TableCell>Khách hàng</TableCell>
                <TableCell>Số tiền</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Mã tham chiếu</TableCell>
                <TableCell>Ngày tạo</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment: any) => (
                <PaymentRow
                  key={payment.id}
                  payment={payment}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                  onRefund={handleRefund}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Empty State */}
      {payments.length === 0 && !isLoading && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: 'grey.100' }}>
              <Payment sx={{ fontSize: 32, color: 'grey.400' }} />
            </Avatar>
            <Typography variant="h6" gutterBottom>
              Chưa có thanh toán nào
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Bắt đầu bằng cách tạo thanh toán đầu tiên của bạn
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setFormOpen(true)}
            >
              Tạo thanh toán đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payment Form Dialog */}
      <PaymentForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        payment={selectedPayment}
        customers={customers}
      />
    </Box>
  );
};

export default PaymentsManagement;