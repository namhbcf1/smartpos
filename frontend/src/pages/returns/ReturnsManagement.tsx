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
  Avatar,
} from '@mui/material';
import {
  Search,
  Add,
  Refresh,
  Visibility,
  Edit,
  Delete,
  AssignmentReturn,
  FilterList,
  MoreVert,
  CheckCircle,
  Error,
  Warning,
  Schedule,
  AttachMoney,
  Person,
  Inventory,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { returnsAPI, customersAPI, ordersAPI } from '../../services/api';

// Return Form Component
interface ReturnFormProps {
  open: boolean;
  onClose: () => void;
  returnItem?: any;
  customers: any[];
  orders: any[];
}

const ReturnForm: React.FC<ReturnFormProps> = ({ open, onClose, returnItem, customers, orders }) => {
  const [formData, setFormData] = useState({
    return_number: returnItem?.return_number || '',
    order_id: returnItem?.order_id || '',
    customer_id: returnItem?.customer_id || '',
    reason: returnItem?.reason || '',
    status: returnItem?.status || 'pending',
    return_type: returnItem?.return_type || 'refund',
    refund_amount: returnItem?.refund_amount || 0,
    notes: returnItem?.notes || '',
    return_date: returnItem?.return_date || '',
    processed_by: returnItem?.processed_by || '',
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => returnsAPI.createReturn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => returnsAPI.updateReturn(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      return_number: formData.return_number,
      order_id: formData.order_id,
      customer_id: formData.customer_id,
      reason: formData.reason,
      status: formData.status,
      return_type: formData.return_type,
      refund_amount: parseFloat(formData.refund_amount.toString()),
      notes: formData.notes,
      return_date: formData.return_date,
      processed_by: formData.processed_by,
    };

    if (returnItem) {
      updateMutation.mutate({ id: returnItem.id, data: submitData });
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

  const reasonOptions = [
    'Sản phẩm bị lỗi',
    'Không đúng mô tả',
    'Giao sai sản phẩm',
    'Sản phẩm bị hỏng trong quá trình vận chuyển',
    'Khách hàng không hài lòng',
    'Đổi size/màu sắc',
    'Khác',
  ];

  const statusOptions = [
    { value: 'pending', label: 'Chờ xử lý' },
    { value: 'approved', label: 'Đã duyệt' },
    { value: 'rejected', label: 'Từ chối' },
    { value: 'processing', label: 'Đang xử lý' },
    { value: 'completed', label: 'Hoàn thành' },
  ];

  const returnTypeOptions = [
    { value: 'refund', label: 'Hoàn tiền' },
    { value: 'exchange', label: 'Đổi hàng' },
    { value: 'store_credit', label: 'Tín dụng cửa hàng' },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {returnItem ? 'Chỉnh sửa đơn trả hàng' : 'Tạo đơn trả hàng mới'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Số đơn trả hàng"
                  value={formData.return_number}
                  onChange={handleChange('return_number')}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Đơn hàng</InputLabel>
                  <Select
                    value={formData.order_id}
                    onChange={handleChange('order_id')}
                    label="Đơn hàng"
                    required
                  >
                    {orders.map((order) => (
                      <MenuItem key={order.id} value={order.id}>
                        #{order.order_number} - {order.customer_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
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
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Lý do trả hàng</InputLabel>
                  <Select
                    value={formData.reason}
                    onChange={handleChange('reason')}
                    label="Lý do trả hàng"
                    required
                  >
                    {reasonOptions.map((reason) => (
                      <MenuItem key={reason} value={reason}>
                        {reason}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Loại trả hàng</InputLabel>
                  <Select
                    value={formData.return_type}
                    onChange={handleChange('return_type')}
                    label="Loại trả hàng"
                  >
                    {returnTypeOptions.map((type) => (
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
                  label="Số tiền hoàn"
                  type="number"
                  value={formData.refund_amount}
                  onChange={handleChange('refund_amount')}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">VNĐ</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Ngày trả hàng"
                  type="date"
                  value={formData.return_date}
                  onChange={handleChange('return_date')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Ghi chú"
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange('notes')}
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
            {returnItem ? 'Cập nhật' : 'Tạo đơn trả hàng'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Return Row Component
interface ReturnRowProps {
  returnItem: any;
  onEdit: (returnItem: any) => void;
  onDelete: (id: string) => void;
  onView: (returnItem: any) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const ReturnRow: React.FC<ReturnRowProps> = ({
  returnItem,
  onEdit,
  onDelete,
  onView,
  onApprove,
  onReject,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'processing': return 'info';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Schedule />;
      case 'approved': return <CheckCircle />;
      case 'rejected': return <Error />;
      case 'processing': return <Warning />;
      case 'completed': return <CheckCircle />;
      default: return null;
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <TableRow>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            <AssignmentReturn />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              #{returnItem.return_number}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {returnItem.order?.order_number || 'N/A'}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {returnItem.customer?.name || 'N/A'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {returnItem.customer?.email || 'N/A'}
          </Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Typography variant="body2">{returnItem.reason}</Typography>
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getStatusIcon(returnItem.status)}
          <Chip
            label={returnItem.status}
            size="small"
            color={getStatusColor(returnItem.status) as any}
          />
        </Box>
      </TableCell>
      <TableCell>
        <Chip
          label={returnItem.return_type}
          size="small"
          color="info"
          variant="outlined"
        />
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight="medium">
          {formatAmount(returnItem.refund_amount)}
        </Typography>
      </TableCell>
      <TableCell>
        {returnItem.return_date ? new Date(returnItem.return_date).toLocaleDateString('vi-VN') : 'N/A'}
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={() => onView(returnItem)}>
            <Visibility />
          </IconButton>
          {returnItem.status === 'pending' && (
            <>
              <IconButton size="small" onClick={() => onApprove(returnItem.id)}>
                <CheckCircle />
              </IconButton>
              <IconButton size="small" onClick={() => onReject(returnItem.id)}>
                <Error />
              </IconButton>
            </>
          )}
          <IconButton size="small" onClick={() => onEdit(returnItem)}>
            <Edit />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => onDelete(returnItem.id)}>
            <Delete />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
};

// Main Returns Management Component
const ReturnsManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch returns
  const { data: returnsData, isLoading, error, refetch } = useQuery({
    queryKey: ['returns', page, pageSize, searchTerm],
    queryFn: () => returnsAPI.getReturns(page, pageSize, searchTerm || undefined),
  });

  // Fetch customers and orders
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersAPI.getCustomers(1, 1000),
  });

  const { data: ordersData } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersAPI.getOrders(1, 1000),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => returnsAPI.deleteReturn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (id: string) => returnsAPI.approveReturn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: (id: string) => returnsAPI.rejectReturn(id, 'Từ chối bởi quản trị viên'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
    },
  });

  const returns = returnsData?.data?.returns || [];
  const customers = customersData?.data?.customers || [];
  const orders = ordersData?.data?.orders || [];
  const pagination = returnsData?.data?.pagination;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleEdit = (returnItem: any) => {
    setSelectedReturn(returnItem);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đơn trả hàng này?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = (returnItem: any) => {
    console.log('View return:', returnItem);
  };

  const handleApprove = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn duyệt đơn trả hàng này?')) {
      approveMutation.mutate(id);
    }
  };

  const handleReject = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn từ chối đơn trả hàng này?')) {
      rejectMutation.mutate(id);
    }
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Không thể tải dữ liệu đơn trả hàng. Vui lòng kiểm tra kết nối mạng.
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
          Quản lý trả hàng
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quản lý các đơn trả hàng và hoàn tiền
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AssignmentReturn color="primary" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {pagination?.total || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng đơn trả hàng
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
                <Schedule color="warning" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {returns.filter((r: any) => r.status === 'pending').length}
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
                <CheckCircle color="success" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {returns.filter((r: any) => r.status === 'completed').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Đã hoàn thành
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
                <AttachMoney color="info" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {returns.length > 0 
                      ? new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                          minimumFractionDigits: 0,
                        }).format(
                          returns.reduce((sum: number, r: any) => sum + (r.refund_amount || 0), 0)
                        )
                      : '0 VNĐ'
                    }
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng hoàn tiền
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
              placeholder="Tìm kiếm đơn trả hàng..."
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
                setSelectedReturn(null);
                setFormOpen(true);
              }}
            >
              Tạo đơn trả hàng
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

      {/* Returns Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Đơn trả hàng</TableCell>
                <TableCell>Khách hàng</TableCell>
                <TableCell>Lý do</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Loại</TableCell>
                <TableCell>Số tiền</TableCell>
                <TableCell>Ngày trả</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {returns.map((returnItem: any) => (
                <ReturnRow
                  key={returnItem.id}
                  returnItem={returnItem}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Empty State */}
      {returns.length === 0 && !isLoading && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: 'grey.100' }}>
              <AssignmentReturn sx={{ fontSize: 32, color: 'grey.400' }} />
            </Avatar>
            <Typography variant="h6" gutterBottom>
              Chưa có đơn trả hàng nào
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Bắt đầu bằng cách tạo đơn trả hàng đầu tiên
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setFormOpen(true)}
            >
              Tạo đơn trả hàng đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Return Form Dialog */}
      <ReturnForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        returnItem={selectedReturn}
        customers={customers}
        orders={orders}
      />
    </Box>
  );
};

export default ReturnsManagement;