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
  Receipt,
  FilterList,
  MoreVert,
  Download,
  Send,
  Payment,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesAPI, customersAPI } from '../../services/api';

// Invoice Form Component
interface InvoiceFormProps {
  open: boolean;
  onClose: () => void;
  invoice?: any;
  customers: any[];
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ open, onClose, invoice, customers }) => {
  const [formData, setFormData] = useState({
    customer_id: invoice?.customer_id || '',
    invoice_number: invoice?.invoice_number || '',
    total_amount: invoice?.total_amount || 0,
    due_date: invoice?.due_date || '',
    notes: invoice?.notes || '',
    status: invoice?.status || 'draft',
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => invoicesAPI.createInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => invoicesAPI.updateInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (invoice) {
      updateMutation.mutate({ id: invoice.id, data: formData });
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
        {invoice ? 'Chỉnh sửa hóa đơn' : 'Tạo hóa đơn mới'}
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
              label="Số hóa đơn"
              value={formData.invoice_number}
              onChange={handleChange('invoice_number')}
              required
            />
            <TextField
              fullWidth
              label="Tổng tiền (VNĐ)"
              type="number"
              value={formData.total_amount}
              onChange={handleChange('total_amount')}
              required
            />
            <TextField
              fullWidth
              label="Ngày đến hạn"
              type="date"
              value={formData.due_date}
              onChange={handleChange('due_date')}
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={formData.status}
                onChange={handleChange('status')}
                label="Trạng thái"
              >
                <MenuItem value="draft">Nháp</MenuItem>
                <MenuItem value="sent">Đã gửi</MenuItem>
                <MenuItem value="paid">Đã thanh toán</MenuItem>
                <MenuItem value="overdue">Quá hạn</MenuItem>
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
            {invoice ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Invoice Row Component
interface InvoiceRowProps {
  invoice: any;
  onEdit: (invoice: any) => void;
  onDelete: (id: string) => void;
  onView: (invoice: any) => void;
  onDownload: (id: string) => void;
  onSend: (id: string) => void;
  onPayment: (id: string) => void;
}

const InvoiceRow: React.FC<InvoiceRowProps> = ({
  invoice,
  onEdit,
  onDelete,
  onView,
  onDownload,
  onSend,
  onPayment,
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
      case 'sent': return 'primary';
      case 'paid': return 'success';
      case 'overdue': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Nháp';
      case 'sent': return 'Đã gửi';
      case 'paid': return 'Đã thanh toán';
      case 'overdue': return 'Quá hạn';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  return (
    <TableRow>
      <TableCell>{invoice.invoice_number}</TableCell>
      <TableCell>{invoice.customer_name}</TableCell>
      <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
      <TableCell>
        <Chip
          label={getStatusLabel(invoice.status)}
          size="small"
          color={getStatusColor(invoice.status) as any}
        />
      </TableCell>
      <TableCell>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('vi-VN') : '-'}</TableCell>
      <TableCell>{new Date(invoice.created_at).toLocaleDateString('vi-VN')}</TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={() => onView(invoice)}>
            <Visibility />
          </IconButton>
          <IconButton size="small" onClick={() => onDownload(invoice.id)}>
            <Download />
          </IconButton>
          <IconButton size="small" onClick={() => onSend(invoice.id)}>
            <Send />
          </IconButton>
          <IconButton size="small" onClick={() => onPayment(invoice.id)}>
            <Payment />
          </IconButton>
          <IconButton size="small" onClick={() => onEdit(invoice)}>
            <Edit />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => onDelete(invoice.id)}>
            <Delete />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
};

// Main Invoices Management Component
const InvoicesManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch invoices
  const { data: invoicesData, isLoading, error, refetch } = useQuery({
    queryKey: ['invoices', page, pageSize, searchTerm],
    queryFn: () => invoicesAPI.getInvoices(page, pageSize, searchTerm || undefined),
  });

  // Fetch customers
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersAPI.getCustomers(1, 100),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => invoicesAPI.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const invoices = invoicesData?.data?.invoices || [];
  const customers = customersData?.data?.customers || [];
  const pagination = invoicesData?.data?.pagination;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleEdit = (invoice: any) => {
    setSelectedInvoice(invoice);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa hóa đơn này?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = (invoice: any) => {
    console.log('View invoice:', invoice);
  };

  const handleDownload = (id: string) => {
    console.log('Download invoice:', id);
  };

  const handleSend = (id: string) => {
    console.log('Send invoice:', id);
  };

  const handlePayment = (id: string) => {
    console.log('Payment invoice:', id);
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Không thể tải dữ liệu hóa đơn. Vui lòng kiểm tra kết nối mạng.
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
          Quản lý hóa đơn
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quản lý hóa đơn và thanh toán
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Receipt color="primary" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {pagination?.total || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng hóa đơn
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
                <Receipt color="success" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {invoices.filter((i: any) => i.status === 'paid').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Đã thanh toán
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
                <Receipt color="warning" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {invoices.filter((i: any) => i.status === 'sent').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Đã gửi
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
                <Receipt color="error" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {invoices.filter((i: any) => i.status === 'overdue').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Quá hạn
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
              placeholder="Tìm kiếm hóa đơn..."
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
                setSelectedInvoice(null);
                setFormOpen(true);
              }}
            >
              Tạo hóa đơn
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

      {/* Invoices Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Số hóa đơn</TableCell>
                <TableCell>Khách hàng</TableCell>
                <TableCell>Tổng tiền</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Ngày đến hạn</TableCell>
                <TableCell>Ngày tạo</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((invoice: any) => (
                <InvoiceRow
                  key={invoice.id}
                  invoice={invoice}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                  onDownload={handleDownload}
                  onSend={handleSend}
                  onPayment={handlePayment}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Empty State */}
      {invoices.length === 0 && !isLoading && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: 'grey.100' }}>
              <Receipt sx={{ fontSize: 32, color: 'grey.400' }} />
            </Avatar>
            <Typography variant="h6" gutterBottom>
              Chưa có hóa đơn nào
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Bắt đầu bằng cách tạo hóa đơn đầu tiên của bạn
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setFormOpen(true)}
            >
              Tạo hóa đơn đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Invoice Form Dialog */}
      <InvoiceForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        invoice={selectedInvoice}
        customers={customers}
      />
    </Box>
  );
};

export default InvoicesManagement;