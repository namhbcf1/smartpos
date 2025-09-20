import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box,
  Autocomplete,
  Chip,
  IconButton,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  QrCode as QrCodeIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';

interface Product {
  id: string;
  name: string;
  sku: string;
  warranty_months: number;
}

interface Customer {
  id: string;
  full_name: string;
  phone: string;
  email: string;
}

interface SerialNumber {
  id: string;
  serial_number: string;
  product_id: string;
  product_name: string;
  customer_id?: string;
  customer_name?: string;
  status: 'active' | 'sold' | 'returned' | 'warranty';
  purchase_date: string;
  warranty_start_date: string;
  warranty_end_date: string;
  notes?: string;
}

interface SerialNumberModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: SerialNumberData) => void;
  products: Product[];
  customers: Customer[];
  editData?: SerialNumberData;
}

interface SerialNumberData {
  serial_number: string;
  product_id: string;
  customer_id?: string;
  purchase_date: string;
  notes?: string;
}

const SerialNumberModal: React.FC<SerialNumberModalProps> = ({
  open,
  onClose,
  onConfirm,
  products,
  customers,
  editData
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<SerialNumberData>({
    serial_number: '',
    product_id: '',
    customer_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SerialNumber[]>([]);

  useEffect(() => {
    if (open) {
      if (editData) {
        setFormData(editData);
        const product = products.find(p => p.id === editData.product_id);
        const customer = customers.find(c => c.id === editData.customer_id);
        setSelectedProduct(product || null);
        setSelectedCustomer(customer || null);
      } else {
        setFormData({
          serial_number: '',
          product_id: '',
          customer_id: '',
          purchase_date: new Date().toISOString().split('T')[0],
          notes: ''
        });
        setSelectedProduct(null);
        setSelectedCustomer(null);
      }
      setActiveTab(0);
      setSearchTerm('');
      setSearchResults([]);
    }
  }, [open, editData, products, customers]);

  const handleProductChange = (product: Product | null) => {
    setSelectedProduct(product);
    setFormData({
      ...formData,
      product_id: product?.id || ''
    });
  };

  const handleCustomerChange = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    setFormData({
      ...formData,
      customer_id: customer?.id || ''
    });
  };

  const generateSerialNumber = () => {
    if (!selectedProduct) return;
    
    const prefix = selectedProduct.sku.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    
    const serialNumber = `${prefix}-${timestamp}-${random}`;
    setFormData({
      ...formData,
      serial_number: serialNumber
    });
  };

  const searchSerialNumbers = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    // Mock search - replace with actual API call
    const mockResults: SerialNumber[] = [
      {
        id: '1',
        serial_number: searchTerm,
        product_id: '1',
        product_name: 'Laptop Dell XPS 13',
        customer_id: '1',
        customer_name: 'Nguyễn Văn A',
        status: 'sold',
        purchase_date: '2024-01-15',
        warranty_start_date: '2024-01-15',
        warranty_end_date: '2025-01-15',
        notes: 'Bảo hành chính hãng'
      }
    ];

    setSearchResults(mockResults);
  };

  const handleConfirm = () => {
    if (!formData.serial_number || !formData.product_id) {
      return;
    }

    onConfirm(formData);
    onClose();
  };

  const getWarrantyEndDate = () => {
    if (!selectedProduct || !formData.purchase_date) return '';
    
    const startDate = new Date(formData.purchase_date);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + selectedProduct.warranty_months);
    
    return endDate.toISOString().split('T')[0];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'sold': return 'primary';
      case 'returned': return 'warning';
      case 'warranty': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Hoạt động';
      case 'sold': return 'Đã bán';
      case 'returned': return 'Đã trả';
      case 'warranty': return 'Bảo hành';
      default: return 'Không xác định';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <QrCodeIcon />
              <Typography variant="h6">
                {editData ? 'Chỉnh sửa Serial Number' : 'Thêm Serial Number mới'}
              </Typography>
            </Box>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
              <Tab label="Thông tin cơ bản" />
              <Tab label="Tìm kiếm Serial" />
            </Tabs>
          </Box>

          {activeTab === 0 && (
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={products}
                  getOptionLabel={(option) => `${option.name} (${option.sku})`}
                  value={selectedProduct}
                  onChange={(_, newValue) => handleProductChange(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Sản phẩm *" />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={customers}
                  getOptionLabel={(option) => `${option.full_name} (${option.phone})`}
                  value={selectedCustomer}
                  onChange={(_, newValue) => handleCustomerChange(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Khách hàng" />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Serial Number *"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  InputProps={{
                    endAdornment: (
                      <IconButton onClick={generateSerialNumber} size="small">
                        <QrCodeIcon />
                      </IconButton>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Ngày mua"
                  value={new Date(formData.purchase_date)}
                  onChange={(date) => setFormData({ ...formData, purchase_date: date?.toISOString().split('T')[0] || '' })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Ngày bắt đầu bảo hành"
                  value={formData.purchase_date}
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Ngày kết thúc bảo hành"
                  value={getWarrantyEndDate()}
                  disabled
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Ghi chú"
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12}>
                <Box display="flex" gap={2} alignItems="center">
                  <TextField
                    fullWidth
                    label="Tìm kiếm Serial Number"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <IconButton onClick={searchSerialNumbers} size="small">
                          <SearchIcon />
                        </IconButton>
                      )
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={searchSerialNumbers}
                    startIcon={<SearchIcon />}
                  >
                    Tìm kiếm
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12}>
                {searchResults.length === 0 ? (
                  <Alert severity="info">
                    {searchTerm ? 'Không tìm thấy kết quả nào' : 'Nhập serial number để tìm kiếm'}
                  </Alert>
                ) : (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Serial Number</TableCell>
                          <TableCell>Sản phẩm</TableCell>
                          <TableCell>Khách hàng</TableCell>
                          <TableCell>Trạng thái</TableCell>
                          <TableCell>Ngày mua</TableCell>
                          <TableCell>Bảo hành đến</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {searchResults.map((serial) => (
                          <TableRow key={serial.id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                {serial.serial_number}
                              </Typography>
                            </TableCell>
                            <TableCell>{serial.product_name}</TableCell>
                            <TableCell>{serial.customer_name || 'N/A'}</TableCell>
                            <TableCell>
                              <Chip
                                label={getStatusLabel(serial.status)}
                                color={getStatusColor(serial.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {new Date(serial.purchase_date).toLocaleDateString('vi-VN')}
                            </TableCell>
                            <TableCell>
                              {new Date(serial.warranty_end_date).toLocaleDateString('vi-VN')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Hủy
          </Button>
          {activeTab === 0 && (
            <Button
              onClick={handleConfirm}
              variant="contained"
              color="primary"
              disabled={!formData.serial_number || !formData.product_id}
              startIcon={<AddIcon />}
            >
              {editData ? 'Cập nhật' : 'Thêm Serial'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default SerialNumberModal;
