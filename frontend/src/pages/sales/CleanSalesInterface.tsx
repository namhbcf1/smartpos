import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  TextField,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Stack,
  InputAdornment,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../../services/api';

interface Product {
  id: number;
  name: string;
  price: number;
  sku?: string;
  category?: string;
  stock_quantity?: number;
}

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  unit_price: number;
  total_amount: number;
}

interface Category {
  id: number;
  name: string;
}

const CleanSalesInterface = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [_categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkoutDialog, setCheckoutDialog] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Fetch data
  const fetchProducts = useCallback(async () => {
    try {
      const response = await api.get('/products', {
        params: {
          search: searchTerm,
          in_stock_only: true,
          limit: 50
        }
      });

      if (response?.data?.success) {
        setProducts(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      enqueueSnackbar('Không thể tải danh sách sản phẩm', { variant: 'error' });
    }
  }, [searchTerm, enqueueSnackbar]);

  const fetchCategories = useCallback(async () => {
    try {
      // const _token = sessionStorage.getItem('auth_token');
      const { default: apiClient } = await import('../../services/api/client');
      const res = await apiClient.get('/categories');
      setCategories(res?.data?.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Cart functions
  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);

    if (existingItem) {
      setCart(prev => prev.map(item =>
        item.product.id === product.id
          ? {
              ...item,
              quantity: item.quantity + 1,
              total_amount: (item.quantity + 1) * item.unit_price
            }
          : item
      ));
    } else {
      const newItem: CartItem = {
        id: `${product.id}-${Date.now()}`,
        product,
        quantity: 1,
        unit_price: product.price,
        total_amount: product.price
      };
      setCart(prev => [...prev, newItem]);
    }

    enqueueSnackbar(`Đã thêm ${product.name}`, { variant: 'success' });
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart(prev => prev.map(item =>
      item.id === itemId
        ? {
            ...item,
            quantity: newQuantity,
            total_amount: newQuantity * item.unit_price
          }
        : item
    ));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.total_amount, 0);
  const total = subtotal; // No tax for simplicity

  // Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      enqueueSnackbar('Giỏ hàng trống', { variant: 'warning' });
      return;
    }

    try {
      setCheckoutLoading(true);

      const saleData = {
        customer: customerName ? {
          name: customerName,
          phone: customerPhone
        } : null,
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_amount: item.total_amount
        })),
        subtotal,
        total_amount: total,
        paid_amount: total,
        change_amount: 0,
        payment_method: 'cash'
      };

      const response = await api.post('/sales', saleData);

      if (response.data.success) {
        enqueueSnackbar('Thanh toán thành công!', { variant: 'success' });
        clearCart();
        setCustomerName('');
        setCustomerPhone('');
        setCheckoutDialog(false);

        if (response.data.data?.id) {
          navigate(`/sales/${response.data.data.id}`);
        }
      }
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || 'Lỗi thanh toán', { variant: 'error' });
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{
      height: '100vh',
      bgcolor: '#f5f5f5',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
        <Container maxWidth="xl">
          <Typography variant="h5" fontWeight={400} color="#333">
            Bán hàng
          </Typography>
        </Container>
      </Paper>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 2, height: 'calc(100vh - 80px)' }}>
        <Grid container spacing={2} sx={{ height: '100%' }}>
          {/* Products Section */}
          <Grid xs={12} md={8}>
            <Paper sx={{ height: '100%', p: 2, borderRadius: 1 }}>
              {/* Search */}
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" sx={{ color: '#666' }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#fafafa',
                      '& fieldset': { border: '1px solid #e0e0e0' },
                      '&:hover fieldset': { borderColor: '#bdbdbd' },
                      '&.Mui-focused fieldset': { borderColor: '#1976d2' }
                    }
                  }}
                />
              </Box>

              {/* Products Grid */}
              <Box sx={{ height: 'calc(100% - 60px)', overflow: 'auto' }}>
                <Grid container spacing={1.5}>
                  {products.map((product) => (
                    <Grid xs={6} sm={4} md={3} key={product.id}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          border: '1px solid #e0e0e0',
                          borderRadius: 1,
                          '&:hover': {
                            borderColor: '#1976d2',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }
                        }}
                        onClick={() => addToCart(product)}
                      >
                        <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                              mb: 1,
                              fontSize: '13px',
                              lineHeight: 1.3,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              minHeight: '32px',
                              color: '#333'
                            }}
                          >
                            {product.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#1976d2',
                              fontWeight: 600,
                              fontSize: '14px'
                            }}
                          >
                            {product.price.toLocaleString('vi-VN')}đ
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {products.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4, color: '#666' }}>
                    <Typography>Không tìm thấy sản phẩm nào</Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Cart Section */}
          <Grid xs={12} md={4}>
            <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 1 }}>
              {/* Cart Header */}
              <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                <Typography variant="h6" fontWeight={500} fontSize="16px" color="#333">
                  Đơn hàng ({cart.length})
                </Typography>
              </Box>

              {/* Customer Info */}
              <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                <Stack spacing={1.5}>
                  <TextField
                    size="small"
                    placeholder="Số điện thoại khách hàng"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon fontSize="small" sx={{ color: '#666' }} />
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#fafafa',
                        '& fieldset': { border: '1px solid #e0e0e0' }
                      }
                    }}
                  />
                  <TextField
                    size="small"
                    placeholder="Tên khách hàng"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon fontSize="small" sx={{ color: '#666' }} />
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#fafafa',
                        '& fieldset': { border: '1px solid #e0e0e0' }
                      }
                    }}
                  />
                </Stack>
              </Box>

              {/* Cart Items */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                {cart.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4, color: '#666' }}>
                    <Typography variant="body2">Chưa có sản phẩm nào</Typography>
                  </Box>
                ) : (
                  <Stack spacing={1}>
                    {cart.map((item) => (
                      <Card key={item.id} variant="outlined" sx={{ border: '1px solid #e0e0e0' }}>
                        <CardContent sx={{ p: 1.5 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="start">
                            <Box sx={{ flex: 1, mr: 1 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 500,
                                  fontSize: '13px',
                                  color: '#333',
                                  mb: 0.5
                                }}
                              >
                                {item.product.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: '#666', fontSize: '12px' }}
                              >
                                {item.unit_price.toLocaleString('vi-VN')}đ
                              </Typography>
                            </Box>

                            <IconButton
                              size="small"
                              onClick={() => removeFromCart(item.id)}
                              sx={{ color: '#f44336' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>

                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <IconButton
                                size="small"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                sx={{ bgcolor: '#f5f5f5', width: 24, height: 24 }}
                              >
                                <RemoveIcon fontSize="small" />
                              </IconButton>

                              <Typography
                                sx={{
                                  fontWeight: 500,
                                  minWidth: 20,
                                  textAlign: 'center',
                                  fontSize: '14px'
                                }}
                              >
                                {item.quantity}
                              </Typography>

                              <IconButton
                                size="small"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                sx={{ bgcolor: '#f5f5f5', width: 24, height: 24 }}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Stack>

                            <Typography
                              variant="body2"
                              sx={{
                                color: '#1976d2',
                                fontWeight: 600,
                                fontSize: '14px'
                              }}
                            >
                              {item.total_amount.toLocaleString('vi-VN')}đ
                            </Typography>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Box>

              {/* Total and Checkout */}
              {cart.length > 0 && (
                <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
                  <Box sx={{ mb: 2, textAlign: 'right' }}>
                    <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 600 }}>
                      Tổng: {total.toLocaleString('vi-VN')}đ
                    </Typography>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => setCheckoutDialog(true)}
                    sx={{
                      bgcolor: '#1976d2',
                      py: 1.5,
                      fontWeight: 500,
                      '&:hover': { bgcolor: '#1565c0' }
                    }}
                  >
                    Thanh toán
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Checkout Dialog */}
      <Dialog open={checkoutDialog} onClose={() => setCheckoutDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Xác nhận thanh toán</DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Tổng tiền: {total.toLocaleString('vi-VN')}đ
          </Typography>
          {customerName && (
            <Typography>Khách hàng: {customerName}</Typography>
          )}
          {customerPhone && (
            <Typography>Số điện thoại: {customerPhone}</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckoutDialog(false)}>Hủy</Button>
          <Button
            onClick={handleCheckout}
            variant="contained"
            disabled={checkoutLoading}
          >
            {checkoutLoading ? <CircularProgress size={20} /> : 'Xác nhận'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CleanSalesInterface;
