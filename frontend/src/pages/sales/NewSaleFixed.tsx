import { useState, useEffect, useCallback } from 'react';
import {
  Box,
   
  TextField,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Divider,
  Stack,
  InputAdornment,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
 } from '@mui/material';
 import { Grid } from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  ShoppingCart as CartIcon,
  Search as SearchIcon,
  QrCodeScanner as QrIcon
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

const NewSaleFixed = () => {
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [customerPayment, setCustomerPayment] = useState(0);

  // Fetch data
  const fetchProducts = useCallback(async () => {
    try {
      console.log('🔍 Fetching products with search term:', searchTerm);

      const response = await api.get('/products', {
        params: {
          search: searchTerm,
          limit: 100 // Increase limit to get more products
        }
      });

      console.log('📦 Raw API response:', response);
      console.log('📦 Response data:', response?.data);
      console.log('📦 Response success:', response?.data?.success);
      console.log('📦 Response data.data:', response?.data?.data);

      // Direct handling - response IS the data array
      console.log('🔄 Processing response directly...');
      let productsData = [];

      // The response itself might be the array
      if (Array.isArray(response)) {
        productsData = response;
        console.log('📊 Response IS the products array directly');
      } else if (response?.data && Array.isArray(response.data)) {
        productsData = response.data;
        console.log('📊 Data is direct array in response.data');
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        productsData = response.data.data;
        console.log('📊 Data is in nested data property');
      } else if (response?.data?.success && response.data.data) {
        productsData = response.data.data;
        console.log('📊 Data is in success/data structure');
      }

      console.log('✅ Products data to set:', productsData);
      console.log('✅ Products count:', productsData.length);
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (err) {
      console.error('❌ Error fetching products:', err);
      console.error('❌ Error details:', (err as any).response?.data);
      enqueueSnackbar('Không thể tải danh sách sản phẩm', { variant: 'error' });
      setProducts([]);
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

  // Load all products on initial mount
  useEffect(() => {
    fetchAllProducts();
  }, []);

  // Fetch all products without search filter
  const fetchAllProducts = useCallback(async () => {
    try {
      console.log('🔄 Loading all products (initial load)...');

      const response = await api.get('/products', {
        params: {
          limit: 1000 // Get all products
        }
      });

      console.log('📦 All products response:', response);
      console.log('📦 All products data:', response?.data);

      // Direct handling - response IS the data array
      console.log('🔄 Processing all products response directly...');
      let productsData = [];

      // The response itself might be the array
      if (Array.isArray(response)) {
        productsData = response;
        console.log('📊 All products response IS the products array directly');
      } else if (response?.data && Array.isArray(response.data)) {
        productsData = response.data;
        console.log('📊 All products data is direct array in response.data');
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        productsData = response.data.data;
        console.log('📊 All products data is in nested data property');
      } else if (response?.data?.success && response.data.data) {
        productsData = response.data.data;
        console.log('📊 All products data is in success/data structure');
      }

      console.log('✅ All products loaded:', productsData.length, 'products');
      console.log('✅ First few products:', productsData.slice(0, 3));
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (err) {
      console.error('❌ Error fetching all products:', err);
      console.error('❌ All products error details:', (err as any).response?.data);
      enqueueSnackbar('Không thể tải danh sách sản phẩm', { variant: 'error' });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  // QR Scanner and keyboard shortcuts
  const handleQRScan = () => {
    enqueueSnackbar('Chức năng quét QR đang được phát triển', { variant: 'info' });
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2 for product search focus
      if (e.key === 'F2') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Quét QR"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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
  const total = subtotal;

  // Checkout
  const handleCheckout = async () => {
    console.log('🛒 HandleCheckout called, cart:', cart);
    console.log('🛒 Cart length:', cart.length);

    if (cart.length === 0) {
      enqueueSnackbar('Giỏ hàng trống', { variant: 'warning' });
      return;
    }

    try {
      console.log('💳 Starting checkout process...');
      setCheckoutLoading(true);

      const saleData = {
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        customer_email: null,
        items: cart.map(item => ({
          product_id: item.product.id,
          product_name: item.product.name,
          product_sku: item.product.sku || null,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_amount: item.total_amount,
          discount_amount: 0,
          tax_amount: 0
        })),
        payment_method: selectedPaymentMethod || 'cash',
        notes: null
      };

      console.log('📤 Sending sales data:', saleData);
      const response = await api.post('/sales', saleData);
      console.log('📥 Sales response:', response);
      console.log('📥 Response data:', response.data);
      console.log('📥 Response type:', typeof response);
      console.log('📥 Response keys:', Object.keys(response));

      // Handle different response formats - axios might be unwrapping
      let responseData;
      let isSuccess = false;

      if (response && typeof response === 'object') {
        // Case 1: Direct data response (axios unwrapped)
        if (response.id && response.order_number) {
          responseData = response;
          isSuccess = true;
          console.log('✅ Direct response format detected');
        }
        // Case 2: Standard axios response with .data
        else if (response.data) {
          // Case 2a: Wrapped format {success: true, data: {...}}
          if (response.data.success === true) {
            responseData = response.data.data;
            isSuccess = true;
            console.log('✅ Wrapped response format detected');
          }
          // Case 2b: Direct data in response.data
          else if (response.data.id && response.data.order_number) {
            responseData = response.data;
            isSuccess = true;
            console.log('✅ Direct data in response.data detected');
          }
        }
      }

      console.log('📊 Final isSuccess:', isSuccess);
      console.log('📊 Final responseData:', responseData);

      if (isSuccess) {
        enqueueSnackbar(`Thanh toán thành công! Mã đơn: ${responseData?.order_number}`, { variant: 'success' });
        clearCart();
        setCustomerName('');
        setCustomerPhone('');
        setCheckoutDialog(false);

        // Stay in POS for continuous sales instead of navigating away
        console.log('✅ Order created successfully:', responseData);

        // Optional: Show receipt dialog or print receipt here
        // For now, just stay in POS for next sale
      } else {
        throw new Error('Thanh toán thất bại - không nhận được phản hồi hợp lệ');
      }
    } catch (err: any) {
      console.error('❌ Checkout error:', err);
      console.error('❌ Error response:', err.response);
      enqueueSnackbar(err.response?.data?.message || 'Lỗi thanh toán', { variant: 'error' });
    } finally {
      console.log('🏁 Checkout process finished');
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
    <Box sx={{ height: '100vh', bgcolor: '#f8f9fa', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Main Content - 65/35 Split */}
      <Box sx={{ flex: 1, display: 'flex', p: 1.5, gap: 1.5, minHeight: 0 }}>
        {/* Left Panel - Product Area (65%) */}
        <Box sx={{ flex: '1 1 65%', minHeight: 0 }}>
          <Paper sx={{
            height: '100%',
            borderRadius: 1,
            border: '1px solid #e9ecef',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Products Header */}
            <Box sx={{
              p: 1.5,
              bgcolor: '#f8f9fa',
              borderBottom: '1px solid #e9ecef',
              flexShrink: 0
            }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#333', fontSize: '14px' }}>
                  Danh mục sản phẩm
                </Typography>
                <Typography variant="body2" color="#6c757d" sx={{ fontSize: '12px' }}>
                  {products.length} sản phẩm
                </Typography>
              </Stack>

              {/* Search Input */}
              <TextField
                fullWidth
                size="small"
                placeholder="Quét QR, nhập tên sản phẩm, SKU hoặc Serial... (F2)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: '#6c757d' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        sx={{ color: '#6c757d' }}
                        onClick={handleQRScan}
                        title="Quét QR Code"
                      >
                        <QrIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fff',
                    borderRadius: 1,
                    fontSize: '12px',
                    '& fieldset': { border: '1px solid #dee2e6' },
                    '&:hover fieldset': { borderColor: '#28a745' },
                    '&.Mui-focused fieldset': { borderColor: '#28a745' }
                  }
                }}
              />
            </Box>

            {/* Products Grid */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {products.length === 0 ? (
                <Box sx={{
                  textAlign: 'center',
                  py: 6,
                  color: '#6c757d',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%'
                }}>
                  <Typography variant="h6" sx={{ mb: 1, color: '#999', fontSize: '14px' }}>
                    Không tìm thấy sản phẩm nào
                  </Typography>
                  <Typography variant="body2" color="#bbb" sx={{ fontSize: '12px' }}>
                    Vui lòng thêm sản phẩm hoặc kiểm tra lại từ khóa tìm kiếm
                  </Typography>
                </Box>
              ) : (
                 <Grid container spacing={1.5}>
                  {products.map((product) => (
                    <Grid xs={6} sm={4} md={3} lg={2.4} key={product.id}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          border: '1px solid #e9ecef',
                          borderRadius: 1,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: '#28a745',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 2px 8px rgba(40, 167, 69, 0.15)'
                          }
                        }}
                        onClick={() => addToCart(product)}
                      >
                        {/* Product Image Placeholder */}
                        <Box sx={{
                          height: 80,
                          bgcolor: '#f8f9fa',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderBottom: '1px solid #e9ecef'
                        }}>
                          <Box sx={{
                            width: 32,
                            height: 32,
                            bgcolor: '#28a745',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Typography sx={{
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '14px'
                            }}>
                              {product.name.charAt(0)}
                            </Typography>
                          </Box>
                        </Box>

                        <CardContent sx={{ p: 1.5 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                              mb: 0.5,
                              fontSize: '12px',
                              lineHeight: 1.3,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              minHeight: '30px',
                              color: '#333'
                            }}
                          >
                            {product.name}
                          </Typography>

                          <Typography
                            variant="h6"
                            sx={{
                              color: '#28a745',
                              fontWeight: 600,
                              fontSize: '12px',
                              mb: 0.5
                            }}
                          >
                            {product.price.toLocaleString('vi-VN')}đ
                          </Typography>

                          {product.stock_quantity !== undefined && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: '#6c757d',
                                fontSize: '10px',
                                display: 'block'
                              }}
                            >
                              Tồn: {product.stock_quantity}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Paper>
        </Box>

        {/* Right Panel - Cart/Checkout (35%) */}
        <Box sx={{ flex: '1 1 35%', minWidth: 320, minHeight: 0 }}>
          <Paper sx={{
            height: '100%',
            borderRadius: 1,
            border: '1px solid #e9ecef',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Cart Header */}
            <Box sx={{
              p: 1.5,
              bgcolor: '#f8f9fa',
              borderBottom: '1px solid #e9ecef',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#333', fontSize: '14px' }}>
                Hóa đơn 1
              </Typography>
              <Chip
                label={`${cart.length} mặt hàng`}
                size="small"
                sx={{
                  bgcolor: '#e3f2fd',
                  color: '#1976d2',
                  fontSize: '11px',
                  height: 20
                }}
              />
            </Box>

            {/* Customer Section */}
            <Box sx={{ p: 1.5, borderBottom: '1px solid #e9ecef', flexShrink: 0 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#333', fontSize: '12px' }}>
                Thông tin khách hàng
              </Typography>
              <Stack spacing={1}>
                <TextField
                  size="small"
                  placeholder="Tìm khách hàng (F4)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon fontSize="small" sx={{ color: '#6c757d' }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#fff',
                      borderRadius: 1,
                      fontSize: '12px',
                      '& input': { py: 1 }
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
                        <PersonIcon fontSize="small" sx={{ color: '#6c757d' }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#fff',
                      borderRadius: 1,
                      fontSize: '12px',
                      '& input': { py: 1 }
                    }
                  }}
                />
              </Stack>
            </Box>

            {/* Cart Items */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 1.5, minHeight: 0 }}>
              {cart.length === 0 ? (
                <Box sx={{
                  textAlign: 'center',
                  py: 4,
                  color: '#6c757d',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CartIcon sx={{ fontSize: 36, mb: 1, color: '#e0e0e0' }} />
                  <Typography variant="body2" sx={{ mb: 0.5, fontSize: '12px' }}>
                    Chưa có sản phẩm trong đơn hàng
                  </Typography>
                  <Typography variant="caption" color="#999" sx={{ fontSize: '11px' }}>
                    Vui lòng chọn sản phẩm để bán hàng
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1}>
                  {cart.map((item) => (
                    <Box
                      key={item.id}
                      sx={{
                        p: 1.5,
                        border: '1px solid #f0f0f0',
                        borderRadius: 1,
                        bgcolor: '#fafafa'
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="start" sx={{ mb: 1 }}>
                        <Box sx={{ flex: 1, mr: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                              fontSize: '11px',
                              color: '#333',
                              mb: 0.5,
                              lineHeight: 1.2
                            }}
                          >
                            {item.product.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: '#6c757d', fontSize: '10px' }}
                          >
                            {item.unit_price.toLocaleString('vi-VN')}đ
                          </Typography>
                        </Box>

                        <IconButton
                          size="small"
                          onClick={() => removeFromCart(item.id)}
                          sx={{
                            color: '#dc3545',
                            width: 18,
                            height: 18,
                            '&:hover': { bgcolor: 'rgba(220, 53, 69, 0.1)' }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>

                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            sx={{
                              bgcolor: '#fff',
                              border: '1px solid #e0e0e0',
                              width: 20,
                              height: 20,
                              '&:hover': { bgcolor: '#f5f5f5' }
                            }}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>

                          <Typography
                            sx={{
                              fontWeight: 500,
                              minWidth: 20,
                              textAlign: 'center',
                              fontSize: '11px',
                              color: '#333'
                            }}
                          >
                            {item.quantity}
                          </Typography>

                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            sx={{
                              bgcolor: '#fff',
                              border: '1px solid #e0e0e0',
                              width: 20,
                              height: 20,
                              '&:hover': { bgcolor: '#f5f5f5' }
                            }}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Stack>

                        <Typography
                          variant="body1"
                          sx={{
                            color: '#28a745',
                            fontWeight: 600,
                            fontSize: '12px'
                          }}
                        >
                          {item.total_amount.toLocaleString('vi-VN')}đ
                        </Typography>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>

            {/* Payment Summary */}
            <Box sx={{ borderTop: '1px solid #e9ecef', p: 1.5, bgcolor: '#f8f9fa', flexShrink: 0 }}>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="#6c757d" sx={{ fontSize: '11px' }}>
                    Tổng tiền hàng
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#333', fontSize: '11px' }}>
                    {cart.length}
                  </Typography>
                  <Typography variant="body2" fontWeight={500} sx={{ color: '#333', fontSize: '11px' }}>
                    {total.toLocaleString('vi-VN')}
                  </Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="#6c757d" sx={{ fontSize: '11px' }}>
                    Giảm giá
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#333', fontSize: '11px' }}>
                    0
                  </Typography>
                </Stack>

                <Divider sx={{ my: 0.5 }} />

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#333', fontSize: '12px' }}>
                    Khách cần trả
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#007bff', fontWeight: 700, fontSize: '14px' }}>
                    {total.toLocaleString('vi-VN')}
                  </Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#333', fontSize: '12px' }}>
                    Khách thanh toán
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#333', fontWeight: 700, fontSize: '14px' }}>
                    {customerPayment.toLocaleString('vi-VN')}
                  </Typography>
                </Stack>
              </Stack>

              {/* Payment Methods */}
              <Box sx={{ mt: 1 }}>
                <Stack direction="row" spacing={0.5} sx={{ mb: 1 }}>
                  <Button
                    variant={selectedPaymentMethod === 'cash' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setSelectedPaymentMethod('cash')}
                    sx={{
                      bgcolor: selectedPaymentMethod === 'cash' ? '#007bff' : 'transparent',
                      fontSize: '8px',
                      px: 1,
                      py: 0.3,
                      borderRadius: 0.5,
                      textTransform: 'none',
                      minWidth: 'auto',
                      color: selectedPaymentMethod === 'cash' ? 'white' : '#6c757d',
                      borderColor: '#e0e0e0'
                    }}
                  >
                    TIỀN MẶT
                  </Button>
                  <Button
                    variant={selectedPaymentMethod === 'transfer' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setSelectedPaymentMethod('transfer')}
                    sx={{
                      bgcolor: selectedPaymentMethod === 'transfer' ? '#007bff' : 'transparent',
                      fontSize: '8px',
                      px: 1,
                      py: 0.3,
                      borderRadius: 0.5,
                      color: selectedPaymentMethod === 'transfer' ? 'white' : '#6c757d',
                      borderColor: '#e0e0e0',
                      textTransform: 'none',
                      minWidth: 'auto'
                    }}
                  >
                    CHUYỂN KHOẢN
                  </Button>
                  <Button
                    variant={selectedPaymentMethod === 'card' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setSelectedPaymentMethod('card')}
                    sx={{
                      bgcolor: selectedPaymentMethod === 'card' ? '#007bff' : 'transparent',
                      fontSize: '8px',
                      px: 1,
                      py: 0.3,
                      borderRadius: 0.5,
                      color: selectedPaymentMethod === 'card' ? 'white' : '#6c757d',
                      borderColor: '#e0e0e0',
                      textTransform: 'none',
                      minWidth: 'auto'
                    }}
                  >
                    THẺ
                  </Button>
                  <Button
                    variant={selectedPaymentMethod === 'wallet' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setSelectedPaymentMethod('wallet')}
                    sx={{
                      bgcolor: selectedPaymentMethod === 'wallet' ? '#007bff' : 'transparent',
                      fontSize: '8px',
                      px: 1,
                      py: 0.3,
                      borderRadius: 0.5,
                      color: selectedPaymentMethod === 'wallet' ? 'white' : '#6c757d',
                      borderColor: '#e0e0e0',
                      textTransform: 'none',
                      minWidth: 'auto'
                    }}
                  >
                    VÍ
                  </Button>
                </Stack>

                {/* Quick Amount Buttons */}
                <Stack direction="row" spacing={0.5} sx={{ mb: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setCustomerPayment(total)}
                    sx={{
                      flex: 1,
                      fontSize: '8px',
                      py: 0.3,
                      color: '#6c757d',
                      borderColor: '#e0e0e0',
                      borderRadius: 0.5,
                      minWidth: 'auto',
                      '&:hover': { bgcolor: '#f8f9fa', borderColor: '#007bff' }
                    }}
                  >
                    {total.toLocaleString('vi-VN')}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setCustomerPayment(total + 10000)}
                    sx={{
                      flex: 1,
                      fontSize: '8px',
                      py: 0.3,
                      color: '#6c757d',
                      borderColor: '#e0e0e0',
                      borderRadius: 0.5,
                      minWidth: 'auto',
                      '&:hover': { bgcolor: '#f8f9fa', borderColor: '#007bff' }
                    }}
                  >
                    {(total + 10000).toLocaleString('vi-VN')}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setCustomerPayment(total + 100000)}
                    sx={{
                      flex: 1,
                      fontSize: '8px',
                      py: 0.3,
                      color: '#6c757d',
                      borderColor: '#e0e0e0',
                      borderRadius: 0.5,
                      minWidth: 'auto',
                      '&:hover': { bgcolor: '#f8f9fa', borderColor: '#007bff' }
                    }}
                  >
                    {(total + 100000).toLocaleString('vi-VN')}
                  </Button>
                </Stack>

                {/* Payment Button */}
                <Button
                  fullWidth
                  variant="contained"
                  size="medium"
                  onClick={() => setCheckoutDialog(true)}
                  disabled={cart.length === 0}
                  startIcon={<ReceiptIcon fontSize="small" />}
                  sx={{
                    bgcolor: '#007bff',
                    py: 1,
                    fontWeight: 600,
                    fontSize: '12px',
                    borderRadius: 1,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#0056b3' },
                    '&:disabled': {
                      bgcolor: '#e0e0e0',
                      color: '#9e9e9e'
                    }
                  }}
                >
                  THANH TOÁN
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>

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

export default NewSaleFixed;
