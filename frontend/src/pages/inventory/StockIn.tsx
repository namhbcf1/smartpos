import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  TextField,
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
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Alert,
  Chip,
  InputAdornment,
  CircularProgress,
  Autocomplete,
  Container,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add,
  Delete,
  Save,
  Receipt,
  LocalShipping,
  Search,
  Refresh,
  ShoppingCart,
  ListAlt,
  CalendarMonth,
  AttachMoney,
  Inventory as StockIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import api from '../../services/api';
import { formatCurrency } from '../../config/constants';

// Types
interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  category_name?: string;
}

interface Supplier {
  id: number;
  name: string;
  phone?: string;
  email?: string;
}

interface StockInItem {
  product_id: number;
  product_name: string;
  cost_price: number;
  quantity: number;
  total: number;
  expiry_date?: Date | null;
}

interface StockInFormData {
  supplier_id: number | null;
  reference_number: string;
  date: Date;
  notes: string;
  payment_status: 'paid' | 'unpaid' | 'partial';
  payment_amount: number;
  payment_method: string;
  items: StockInItem[];
}

// Initial form data
const initialFormData: StockInFormData = {
  supplier_id: null,
  reference_number: '',
  date: new Date(),
  notes: '',
  payment_status: 'paid',
  payment_amount: 0,
  payment_method: 'cash',
  items: [],
};

const StockIn = () => {
  // State
  const [formData, setFormData] = useState<StockInFormData>(initialFormData);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productQuantity, setProductQuantity] = useState<number>(1);
  const [productCost, setProductCost] = useState<number>(0);
  const [productExpiryDate, setProductExpiryDate] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch products and suppliers
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch products
        const productsResponse = await api.get<{data: Product[]}>('/products');
        setProducts(productsResponse?.data || []);

        // Fetch suppliers
        const suppliersResponse = await api.get<{
          success: boolean;
          data: {
            data: Supplier[];
            pagination: any;
          };
        }>('/suppliers?is_active=true&limit=100');
        if (suppliersResponse?.success && suppliersResponse?.data?.data) {
          setSuppliers(suppliersResponse.data.data);
        } else {
          setSuppliers([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Generate reference number on load
  useEffect(() => {
    // Generate a reference number in format "SI-YYYYMMDD-XXXX"
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    setFormData(prev => ({
      ...prev,
      reference_number: `SI-${year}${month}${day}-${random}`
    }));
  }, []);
  
  // Calculate total
  const calculateTotal = (): number => {
    return formData.items.reduce((total, item) => total + item.total, 0);
  };
  
  // Update form field
  const handleFormChange = (field: keyof StockInFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (field === 'payment_status' && value === 'paid') {
      setFormData(prev => ({
        ...prev,
        payment_amount: calculateTotal()
      }));
    }
  };
  
  // Handle product dialog open
  const handleOpenProductDialog = () => {
    setOpenProductDialog(true);
    setSelectedProduct(null);
    setProductQuantity(1);
    setProductCost(0);
    setProductExpiryDate(null);
  };
  
  // Handle product dialog close
  const handleCloseProductDialog = () => {
    setOpenProductDialog(false);
  };
  
  // Handle product selection
  const handleProductSelect = (product: Product | null) => {
    setSelectedProduct(product);
    if (product) {
      setProductCost(product.price);
    }
  };
  
  // Add product to items
  const handleAddProduct = () => {
    if (!selectedProduct || productQuantity <= 0 || productCost <= 0) {
      return;
    }
    
    const newItem: StockInItem = {
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      cost_price: productCost,
      quantity: productQuantity,
      total: productCost * productQuantity,
      expiry_date: productExpiryDate
    };
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
      payment_amount: prev.payment_status === 'paid' ? 
        prev.items.reduce((sum, item) => sum + item.total, 0) + newItem.total : 
        prev.payment_amount
    }));
    
    handleCloseProductDialog();
  };
  
  // Remove item from list
  const handleRemoveItem = (index: number) => {
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems,
      payment_amount: prev.payment_status === 'paid' ? 
        updatedItems.reduce((sum, item) => sum + item.total, 0) : 
        prev.payment_amount
    }));
  };
  
  // Submit form
  const handleSubmit = async () => {
    // Validate form
    if (!formData.supplier_id) {
      setError('Vui lòng chọn nhà cung cấp');
      return;
    }
    
    if (formData.items.length === 0) {
      setError('Vui lòng thêm ít nhất một sản phẩm');
      return;
    }
    
    setSubmitLoading(true);
    setError(null);
    
    try {
      // Submit to API
      await api.post('/inventory/stock-in', formData);
      
      // Show success message
      setSuccess('Đã nhập kho thành công!');
      
      // Reset form
      setFormData({
        ...initialFormData,
        date: new Date(),
        reference_number: formData.reference_number
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error creating stock in:', error);
      setError('Không thể tạo phiếu nhập kho. Vui lòng thử lại sau.');
    } finally {
      setSubmitLoading(false);
    }
  };
  
  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: { xs: 1, sm: 2 },
        px: { xs: 1, sm: 2, md: 3 },
        minHeight: '100vh',
        bgcolor: 'grey.50'
      }}
    >
      {/* Header */}
      <Paper
        elevation={1}
        sx={{
          p: { xs: 2, sm: 3 },
          mb: 3,
          borderRadius: 2,
          bgcolor: 'white'
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                fontWeight: 600,
                color: 'primary.main',
                mb: 1
              }}
            >
              <StockIcon sx={{ fontSize: 'inherit' }} />
              Tạo phiếu nhập kho
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Quản lý và tạo phiếu nhập kho mới
            </Typography>
          </Box>
        </Stack>
      </Paper>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Form */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Thông tin phiếu nhập
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Mã phiếu nhập"
                    value={formData.reference_number}
                    onChange={(e) => handleFormChange('reference_number', e.target.value)}
                    fullWidth
                    margin="dense"
                    disabled
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Autocomplete
                    options={suppliers}
                    getOptionLabel={(option) => option.name}
                    value={suppliers.find(s => s.id === formData.supplier_id) || null}
                    onChange={(_, newValue) => {
                      handleFormChange('supplier_id', newValue ? newValue.id : null);
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Nhà cung cấp" fullWidth margin="dense" />
                    )}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Ngày nhập kho"
                      value={formData.date}
                      onChange={(newValue) => {
                        handleFormChange('date', newValue);
                      }}
                      slotProps={{
                        textField: { 
                          fullWidth: true,
                          margin: 'dense'
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Ghi chú"
                    value={formData.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    fullWidth
                    margin="dense"
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </Paper>
            
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Thông tin thanh toán
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth margin="dense">
                    <InputLabel>Trạng thái thanh toán</InputLabel>
                    <Select
                      value={formData.payment_status}
                      onChange={(e) => handleFormChange('payment_status', e.target.value)}
                      label="Trạng thái thanh toán"
                    >
                      <MenuItem value="paid">Đã thanh toán</MenuItem>
                      <MenuItem value="unpaid">Chưa thanh toán</MenuItem>
                      <MenuItem value="partial">Thanh toán một phần</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {formData.payment_status !== 'unpaid' && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        label="Số tiền thanh toán"
                        value={formData.payment_amount}
                        onChange={(e) => handleFormChange('payment_amount', parseFloat(e.target.value) || 0)}
                        fullWidth
                        margin="dense"
                        type="number"
                        InputProps={{
                          startAdornment: <InputAdornment position="start">₫</InputAdornment>,
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <FormControl fullWidth margin="dense">
                        <InputLabel>Phương thức thanh toán</InputLabel>
                        <Select
                          value={formData.payment_method}
                          onChange={(e) => handleFormChange('payment_method', e.target.value)}
                          label="Phương thức thanh toán"
                        >
                          <MenuItem value="cash">Tiền mặt</MenuItem>
                          <MenuItem value="bank_transfer">Chuyển khoản</MenuItem>
                          <MenuItem value="credit">Ghi nợ</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </>
                )}
              </Grid>
            </Paper>
          </Grid>
          
          {/* Items */}
          <Grid item xs={12} md={8}>
            {/* Error/Success messages */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}
            
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Danh sách sản phẩm
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleOpenProductDialog}
                >
                  Thêm sản phẩm
                </Button>
              </Box>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tên sản phẩm</TableCell>
                      <TableCell align="right">Giá nhập</TableCell>
                      <TableCell align="right">Số lượng</TableCell>
                      <TableCell align="right">Thành tiền</TableCell>
                      <TableCell align="center">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                          <Typography color="text.secondary">
                            Chưa có sản phẩm nào. Vui lòng thêm sản phẩm.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      formData.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell align="right">{formatCurrency(item.cost_price)}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{formatCurrency(item.total)}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
            
            {/* Summary */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              <Card sx={{ width: '100%', maxWidth: 400 }}>
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Tổng số sản phẩm: {formData.items.length}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Tổng số lượng: {formData.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1">Tổng giá trị:</Typography>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {formatCurrency(calculateTotal())}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1">Đã thanh toán:</Typography>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      color={formData.payment_status === 'paid' ? 'success.main' : 'text.primary'}
                    >
                      {formatCurrency(formData.payment_amount)}
                    </Typography>
                  </Box>
                  {formData.payment_status !== 'paid' && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="subtitle1">Còn lại:</Typography>
                      <Typography variant="subtitle1" fontWeight="bold" color="error.main">
                        {formatCurrency(calculateTotal() - formData.payment_amount)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Card>
            </Box>
            
            {/* Submit button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<Save />}
                onClick={handleSubmit}
                disabled={submitLoading || formData.items.length === 0}
                sx={{ minWidth: 200 }}
              >
                {submitLoading ? <CircularProgress size={24} /> : 'Lưu phiếu nhập kho'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      )}
      
      {/* Product dialog */}
      <Dialog open={openProductDialog} onClose={handleCloseProductDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm sản phẩm</DialogTitle>
        <DialogContent>
          <TextField
            label="Tìm kiếm sản phẩm"
            fullWidth
            margin="dense"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          
          <Box sx={{ my: 2 }}>
            <Autocomplete
              options={filteredProducts}
              getOptionLabel={(option) => `${option.name} (${option.sku})`}
              value={selectedProduct}
              onChange={(_, newValue) => handleProductSelect(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Chọn sản phẩm" fullWidth margin="dense" />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option.id}>
                  <Box>
                    {option.name}
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                      SKU: {option.sku} | Tồn kho: {option.stock_quantity}
                    </Typography>
                  </Box>
                </Box>
              )}
            />
          </Box>
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Giá nhập"
                fullWidth
                type="number"
                value={productCost}
                onChange={(e) => setProductCost(parseFloat(e.target.value) || 0)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₫</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Số lượng"
                fullWidth
                type="number"
                value={productQuantity}
                onChange={(e) => setProductQuantity(parseInt(e.target.value) || 0)}
              />
            </Grid>
            
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Ngày hết hạn (nếu có)"
                  value={productExpiryDate}
                  onChange={(newValue) => {
                    setProductExpiryDate(newValue);
                  }}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            
            {selectedProduct && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="subtitle1">Thành tiền:</Typography>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {formatCurrency(productCost * productQuantity)}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProductDialog}>Hủy</Button>
          <Button
            onClick={handleAddProduct}
            variant="contained"
            disabled={!selectedProduct || productQuantity <= 0 || productCost <= 0}
          >
            Thêm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StockIn; 