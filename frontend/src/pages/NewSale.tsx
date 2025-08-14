import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  InputAdornment,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Fab,
  Container,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ShoppingCart as CartIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Clear as ClearIcon,
  Save as SaveIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/api';
import { formatCurrency } from '../utils/format';
import { PaymentMethodSelector, PaymentMethod } from '../components/payment/PaymentMethodSelector';
import { VNPayPayment } from '../components/payment/VNPayPayment';
import { useSnackbar } from 'notistack';
import SerialNumberAssignment from '../components/SerialNumberAssignment';
import { enhancedSalesService } from '../services/enhancedSalesService';

// Types
interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  price: number;
  stock_quantity: number;
  category_name: string;
  image_url: string | null;
}

interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
  serial_numbers?: string[];
  auto_warranty?: boolean;
}

interface Customer {
  id?: number;
  name: string;
  phone: string;
  email: string;
}

const NewSale: React.FC = () => {
  const queryClient = useQueryClient();

  // Hooks
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer>({ name: '', phone: '', email: '' });
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [openPaymentMethodSelector, setOpenPaymentMethodSelector] = useState(false);
  const [openVNPayPayment, setOpenVNPayPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [saleId, setSaleId] = useState<number | null>(null);
  const [openCustomerDialog, setOpenCustomerDialog] = useState(false);
  const [openSerialAssignment, setOpenSerialAssignment] = useState(false);
  const [tempCustomer, setTempCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    loyaltyPoints: 0,
    customerGroup: 'regular'
  });

  // Fetch products for search
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', 'search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      const response = await apiClient.get('/products', {
        params: {
          search: searchTerm,
          is_active: true,
          limit: 20
        }
      });
      return (response.data as any)?.data || [];
    },
    enabled: searchTerm.length >= 2
  });

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
    const discountAmount = (subtotal * discount) / 100;
    const taxRate = 0.1; // 10% VAT
    const taxAmount = (subtotal - discountAmount) * taxRate;
    const total = subtotal - discountAmount + taxAmount;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total
    };
  }, [cart, discount]);

  // Add product to cart
  const addToCart = () => {
    if (!selectedProduct) return;

    const existingItemIndex = cart.findIndex(item => item.product.id === selectedProduct.id);

    if (existingItemIndex >= 0) {
      // Update existing item
      const newCart = [...cart];
      const newQuantity = newCart[existingItemIndex].quantity + quantity;

      if (newQuantity > selectedProduct.stock_quantity) {
        enqueueSnackbar('Không đủ hàng tồn kho', { variant: 'warning' });
        return;
      }

      newCart[existingItemIndex].quantity = newQuantity;
      newCart[existingItemIndex].total_price = newQuantity * selectedProduct.price;
      setCart(newCart);
    } else {
      // Add new item
      if (quantity > selectedProduct.stock_quantity) {
        enqueueSnackbar('Không đủ hàng tồn kho', { variant: 'warning' });
        return;
      }

      const newItem: CartItem = {
        product: selectedProduct,
        quantity,
        unit_price: selectedProduct.price,
        total_price: quantity * selectedProduct.price
      };
      setCart([...cart, newItem]);
    }

    // Reset form
    setSelectedProduct(null);
    setQuantity(1);
    setSearchTerm('');
  };

  // Update cart item quantity
  const updateCartItemQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const newCart = cart.map(item => {
      if (item.product.id === productId) {
        if (newQuantity > item.product.stock_quantity) {
          enqueueSnackbar('Không đủ hàng tồn kho', { variant: 'warning' });
          return item;
        }
        return {
          ...item,
          quantity: newQuantity,
          total_price: newQuantity * item.unit_price
        };
      }
      return item;
    });
    setCart(newCart);
  };

  // Remove from cart
  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setCustomer({ name: '', phone: '', email: '' });
    setDiscount(0);
    setNotes('');
    setSaleId(null);
  };

  // Payment handlers
  const handleStartPayment = () => {
    if (cart.length === 0) {
      enqueueSnackbar('Giỏ hàng trống', { variant: 'warning' });
      return;
    }

    // Check if any items need serial number assignment
    const needsSerialAssignment = cart.some(item =>
      item.product.category_name?.toLowerCase().includes('linh kiện') ||
      item.product.category_name?.toLowerCase().includes('laptop') ||
      item.product.category_name?.toLowerCase().includes('pc')
    );

    if (needsSerialAssignment) {
      setOpenSerialAssignment(true);
    } else {
      setOpenPaymentMethodSelector(true);
    }
  };

  // Serial number assignment handlers
  const handleSerialAssignmentConfirm = (itemsWithSerials: CartItem[]) => {
    setCart(itemsWithSerials);
    setOpenSerialAssignment(false);
    setOpenPaymentMethodSelector(true);
  };

  const handleSelectPaymentMethod = async (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);

    if (method === 'cash' || method === 'card') {
      // Xử lý thanh toán trực tiếp
      await processCashPayment(method);
    } else if (method === 'vnpay') {
      // Tạo sale trước, sau đó mở VNPay
      await createSaleForPayment();
      setOpenVNPayPayment(true);
    } else {
      // Các phương thức khác (MoMo, ZaloPay)
      enqueueSnackbar('Phương thức thanh toán đang được phát triển', { variant: 'info' });
    }
  };

  const createSaleForPayment = async () => {
    setIsProcessing(true);
    try {
      const saleData = {
        customer_id: customer.id || null,
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price
        })),
        payment_method: selectedPaymentMethod,
        discount_percentage: discount,
        notes: notes,
        payment_status: 'pending'
      };

      const response = await apiClient.post('/sales', saleData);
      if (response.data.success) {
        setSaleId(response.data.data.id);
        return response.data.data.id;
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Lỗi tạo đơn hàng', { variant: 'error' });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const processCashPayment = async (method: PaymentMethod) => {
    setIsProcessing(true);
    try {
      // Check if any items have serial numbers assigned
      const hasSerialNumbers = cart.some(item => item.serial_numbers && item.serial_numbers.length > 0);

      if (hasSerialNumbers) {
        // Use enhanced sales service for sales with serial numbers
        const saleData = {
          customer: customer,
          items: cart,
          payment_method: method,
          discount_amount: totals.discountAmount,
          tax_amount: totals.taxAmount,
          total_amount: totals.total,
          notes: notes,
        };

        const result = await enhancedSalesService.createSaleWithSerials(saleData);

        let successMessage = 'Thanh toán thành công!';
        if (result.assigned_serials.length > 0) {
          successMessage += ` Đã gán ${result.assigned_serials.length} serial numbers.`;
        }
        if (result.created_warranties.length > 0) {
          successMessage += ` Đã tạo ${result.created_warranties.length} bảo hành.`;
        }
        if (result.errors.length > 0) {
          enqueueSnackbar(`Có một số lỗi: ${result.errors.join(', ')}`, { variant: 'warning' });
        }

        enqueueSnackbar(successMessage, { variant: 'success' });
      } else {
        // Use regular sales API for simple sales
        const saleData = {
          customer_name: customer.name || null,
          customer_phone: customer.phone || null,
          customer_email: customer.email || null,
          payment_method: method,
          discount_amount: totals.discountAmount,
          tax_amount: totals.taxAmount,
          total_amount: totals.total,
          notes: notes,
          items: cart.map(item => ({
            product_id: item.product.id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
          }))
        };

        const response = await apiClient.post('/sales', saleData);
        if (response.data.success) {
          enqueueSnackbar('Thanh toán thành công!', { variant: 'success' });
        } else {
          throw new Error(response.data.message);
        }
      }

      clearCart();
      setOpenPaymentMethodSelector(false);
    } catch (error: any) {
      console.error('Payment error:', error);
      enqueueSnackbar(error.message || 'Lỗi thanh toán', { variant: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVNPaySuccess = (transactionId: string) => {
    enqueueSnackbar('Thanh toán VNPay thành công!', { variant: 'success' });
    setOpenVNPayPayment(false);
    clearCart();
    // Có thể in hóa đơn ở đây
  };

  const handleVNPayError = (error: string) => {
    enqueueSnackbar(`Lỗi thanh toán VNPay: ${error}`, { variant: 'error' });
    setOpenVNPayPayment(false);
  };

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
              <CartIcon sx={{ fontSize: 'inherit' }} />
              Điểm bán hàng (POS)
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Tạo đơn hàng và thanh toán nhanh chóng
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Main Content */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: '2fr 1fr'
          },
          gap: 3,
          alignItems: 'start',
          width: '100%'
        }}
      >
        {/* Left Panel - Product Search & Cart */}
        <Box sx={{ minWidth: 0 }}>
            {/* Product Search */}
            <Card sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tìm kiếm sản phẩm
                </Typography>

            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={products}
                    getOptionLabel={(option) => `${option.name} (${option.sku})`}
                    value={selectedProduct}
                    onChange={(_, newValue) => setSelectedProduct(newValue)}
                    inputValue={searchTerm}
                    onInputChange={(_, newInputValue) => setSearchTerm(newInputValue)}
                    loading={isLoadingProducts}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Tìm sản phẩm theo tên hoặc SKU"
                        variant="outlined"
                        fullWidth
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Avatar
                          src={option.image_url || undefined}
                          sx={{ mr: 2, width: 40, height: 40 }}
                        >
                          {option.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body1">{option.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            SKU: {option.sku} | Giá: {formatCurrency(option.price)} | Tồn: {option.stock_quantity}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    label="Số lượng"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    fullWidth
                    inputProps={{ min: 1 }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    startIcon={<AddIcon />}
                    onClick={addToCart}
                    disabled={!selectedProduct}
                  >
                    Thêm vào giỏ
                  </Button>
                </Grid>
              </Grid>

                {selectedProduct && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <strong>{selectedProduct.name}</strong><br />
                    Giá: {formatCurrency(selectedProduct.price)} |
                    Tồn kho: {selectedProduct.stock_quantity} |
                    Danh mục: {selectedProduct.category_name}
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Shopping Cart */}
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Giỏ hàng ({cart.length} sản phẩm)
                </Typography>
                {cart.length > 0 && (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<ClearIcon />}
                    onClick={clearCart}
                  >
                    Xóa tất cả
                  </Button>
                )}
              </Box>

              {cart.length === 0 ? (
                <Alert severity="info">
                  Giỏ hàng trống. Hãy tìm kiếm và thêm sản phẩm vào giỏ hàng.
                </Alert>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Sản phẩm</TableCell>
                        <TableCell align="center">Số lượng</TableCell>
                        <TableCell align="right">Đơn giá</TableCell>
                        <TableCell align="right">Thành tiền</TableCell>
                        <TableCell align="center">Serial Numbers</TableCell>
                        <TableCell align="center">Bảo hành</TableCell>
                        <TableCell align="center">Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cart.map((item) => (
                        <TableRow key={item.product.id}>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Avatar
                                src={item.product.image_url || undefined}
                                sx={{ mr: 2, width: 32, height: 32 }}
                              >
                                {item.product.name.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {item.product.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  SKU: {item.product.sku}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Box display="flex" alignItems="center" justifyContent="center">
                              <IconButton
                                size="small"
                                onClick={() => updateCartItemQuantity(item.product.id, item.quantity - 1)}
                              >
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                              <Typography sx={{ mx: 1, minWidth: 30, textAlign: 'center' }}>
                                {item.quantity}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => updateCartItemQuantity(item.product.id, item.quantity + 1)}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.unit_price)}
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight="medium">
                              {formatCurrency(item.total_price)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {item.serial_numbers && item.serial_numbers.length > 0 ? (
                              <Box>
                                <Chip
                                  label={`${item.serial_numbers.length} serial`}
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                />
                                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                  {item.serial_numbers.slice(0, 2).join(', ')}
                                  {item.serial_numbers.length > 2 && '...'}
                                </Typography>
                              </Box>
                            ) : (
                              <Chip label="Chưa gán" size="small" color="default" variant="outlined" />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {item.auto_warranty ? (
                              <Chip
                                label="Tự động"
                                size="small"
                                color="primary"
                                variant="outlined"
                                icon={<SecurityIcon />}
                              />
                            ) : (
                              <Chip label="Không" size="small" color="default" variant="outlined" />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeFromCart(item.product.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                )}
              </CardContent>
            </Card>
        </Box>

        {/* Right Panel - Customer Info & Payment */}
        <Box sx={{ minWidth: 0 }}>
            {/* Customer Information */}
            <Card sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent>
            <Typography variant="h6" gutterBottom>
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Thông tin khách hàng
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Tên khách hàng"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Số điện thoại"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Email"
                    type="email"
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent>
            <Typography variant="h6" gutterBottom>
                Tổng kết đơn hàng
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Giảm giá (%)"
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                    fullWidth
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Ghi chú"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography>Tạm tính:</Typography>
                  <Typography>{formatCurrency(totals.subtotal)}</Typography>
                </Box>

                {discount > 0 && (
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography color="error">Giảm giá ({discount}%):</Typography>
                    <Typography color="error">-{formatCurrency(totals.discountAmount)}</Typography>
                  </Box>
                )}

                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography>Thuế VAT (10%):</Typography>
                  <Typography>{formatCurrency(totals.taxAmount)}</Typography>
                </Box>

                <Divider sx={{ my: 1 }} />

                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="h6" fontWeight="bold">
                    Tổng cộng:
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    {formatCurrency(totals.total)}
                  </Typography>
                </Box>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Phương thức thanh toán</InputLabel>
                  <Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    label="Phương thức thanh toán"
                  >
                    <MenuItem value="cash">Tiền mặt</MenuItem>
                    <MenuItem value="card">Thẻ tín dụng</MenuItem>
                    <MenuItem value="transfer">Chuyển khoản</MenuItem>
                    <MenuItem value="qr">QR Code</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  startIcon={<PaymentIcon />}
                  onClick={handleStartPayment}
                  disabled={cart.length === 0 || isProcessing}
                >
                  {isProcessing ? 'Đang xử lý...' : 'Thanh toán'}
                </Button>
                </Box>
              </CardContent>
            </Card>
        </Box>
      </Box>

      {/* Payment Method Selector */}
      <PaymentMethodSelector
        open={openPaymentMethodSelector}
        onClose={() => setOpenPaymentMethodSelector(false)}
        amount={totals.total}
        onSelectMethod={handleSelectPaymentMethod}
      />

      {/* VNPay Payment Dialog */}
      {saleId && (
        <VNPayPayment
          open={openVNPayPayment}
          onClose={() => setOpenVNPayPayment(false)}
          saleId={saleId}
          amount={totals.total}
          orderInfo={`Đơn hàng #${saleId}`}
          customerInfo={{
            name: customer.name,
            phone: customer.phone,
            email: customer.email
          }}
          onSuccess={handleVNPaySuccess}
          onError={handleVNPayError}
        />
      )}

      {/* Serial Number Assignment Dialog */}
      <SerialNumberAssignment
        open={openSerialAssignment}
        onClose={() => setOpenSerialAssignment(false)}
        onConfirm={handleSerialAssignmentConfirm}
        cartItems={cart}
      />

      {/* Payment Confirmation Dialog */}
      <PaymentDialog
        open={openPaymentDialog}
        onClose={() => setOpenPaymentDialog(false)}
        cart={cart}
        customer={customer}
        paymentMethod={paymentMethod}
        discount={discount}
        notes={notes}
        totals={totals}
        onSuccess={() => {
          clearCart();
          setOpenPaymentDialog(false);
          enqueueSnackbar('Đơn hàng đã được tạo thành công!', { variant: 'success' });
        }}
        setIsProcessing={setIsProcessing}
      />
    </Container>
  );
};

// Payment Dialog Component
interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  customer: Customer;
  paymentMethod: string;
  discount: number;
  notes: string;
  totals: {
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
  };
  onSuccess: () => void;
  setIsProcessing: (processing: boolean) => void;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onClose,
  cart,
  customer,
  paymentMethod,
  discount,
  notes,
  totals,
  onSuccess,
  setIsProcessing
}) => {
  const queryClient = useQueryClient();

  // Simple notification
  const [notification, setNotification] = useState<string | null>(null);
  const enqueueSnackbar = (message: string, options: { variant: 'success' | 'error' }) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  // Create sale mutation
  const createSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      const response = await apiClient.post('/sales', saleData);
      return (response.data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      onSuccess();
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn hàng',
        { variant: 'error' }
      );
    },
    onSettled: () => {
      setIsProcessing(false);
    }
  });

  const handleConfirmPayment = () => {
    setIsProcessing(true);

    const saleData = {
      customer_name: customer.name || null,
      customer_phone: customer.phone || null,
      customer_email: customer.email || null,
      payment_method: paymentMethod,
      discount_amount: totals.discountAmount,
      tax_amount: totals.taxAmount,
      total_amount: totals.total,
      notes: notes || null,
      items: cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }))
    };

    createSaleMutation.mutate(saleData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <ReceiptIcon sx={{ mr: 1 }} />
          Xác nhận thanh toán
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Thông tin khách hàng
            </Typography>
            <Typography>Tên: {customer.name || 'Khách lẻ'}</Typography>
            <Typography>SĐT: {customer.phone || 'Không có'}</Typography>
            <Typography>Email: {customer.email || 'Không có'}</Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Thông tin thanh toán
            </Typography>
            <Typography>Phương thức: {paymentMethod === 'cash' ? 'Tiền mặt' :
              paymentMethod === 'card' ? 'Thẻ tín dụng' :
              paymentMethod === 'transfer' ? 'Chuyển khoản' : 'QR Code'}</Typography>
            <Typography>Tổng tiền: {formatCurrency(totals.total)}</Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Chi tiết đơn hàng
            </Typography>
            <List dense>
              {cart.map((item) => (
                <ListItem key={item.product.id}>
                  <ListItemAvatar>
                    <Avatar src={item.product.image_url || undefined}>
                      {item.product.name.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={item.product.name}
                    secondary={`${item.quantity} x ${formatCurrency(item.unit_price)} = ${formatCurrency(item.total_price)}`}
                  />
                </ListItem>
              ))}
            </List>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={createSaleMutation.isPending}>
          Hủy
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleConfirmPayment}
          disabled={createSaleMutation.isPending}
          startIcon={createSaleMutation.isPending ? <CircularProgress size={20} /> : <PaymentIcon />}
        >
          {createSaleMutation.isPending ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewSale;