import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  useTheme,
  Typography,
  TextField,
  Stack,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  IconButton,
  Grid,
  Divider,
  Badge,
  InputAdornment,
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Search as SearchIcon,
  Payment as PaymentIcon,
  ShoppingBag as BagIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../../services/api';

// Import types
import {
  Product,
  POSState,
  PaymentMethod
} from '../pos/components/types';

// Animations

const ModernSalesInterface = () => {
  const _theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [posState, setPosState] = useState<POSState>({
    products: [],
    categories: [],
    cart: [],
    customer: null,
    filters: {
      category: '',
      search: '',
      sortBy: 'name',
      priceRange: [0, 1000000],
    },
    isLoading: false,
    showCheckout: false,
  });

  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [receivedAmount, setReceivedAmount] = useState<number>(0);

  // Load data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setPosState((prev: POSState) => ({ ...prev, isLoading: true }));

    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        api.get('/products'),
        api.get('/products/categories')
      ]);

      console.log('Products Response:', productsResponse);
      console.log('Categories Response:', categoriesResponse);

      // Handle different response structures
      let products = [];
      let categories = [];

      // Try different response formats
      if (productsResponse?.data?.data && Array.isArray(productsResponse.data.data)) {
        products = productsResponse.data.data;
      } else if (productsResponse?.data && Array.isArray(productsResponse.data)) {
        products = productsResponse.data;
      } else if (Array.isArray(productsResponse)) {
        products = productsResponse;
      }

      if (categoriesResponse?.data?.data && Array.isArray(categoriesResponse.data.data)) {
        categories = categoriesResponse.data.data;
      } else if (categoriesResponse?.data && Array.isArray(categoriesResponse.data)) {
        categories = categoriesResponse.data;
      } else if (Array.isArray(categoriesResponse)) {
        categories = categoriesResponse;
      }

      console.log('Processed products:', products);
      console.log('Processed categories:', categories);
      console.log('Products count:', products.length);
      console.log('Categories count:', categories.length);

      setPosState((prev: POSState) => ({
        ...prev,
        products: Array.isArray(products) ? products : [],
        categories: Array.isArray(categories) ? categories : [],
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error loading data:', error);
      enqueueSnackbar('Lỗi tải dữ liệu', { variant: 'error' });
      setPosState((prev: POSState) => ({
        ...prev,
        isLoading: false,
        products: [],
        categories: []
      }));
    }
  };

  // Filter products with safe guards
  const filteredProducts = (posState.products || []).filter((product: Product) => {
    if (!product) return false;

    const matchesCategory = !posState.filters.category ||
      (product.category_name && product.category_name === posState.filters.category);

    const matchesSearch = !posState.filters.search ||
      (product.name && product.name.toLowerCase().includes(posState.filters.search.toLowerCase())) ||
      (product.sku && product.sku.toLowerCase().includes(posState.filters.search.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  // Cart functions
  const addToCart = (product: Product) => {
    setPosState((prev: POSState) => {
      const existingItem = prev.cart.find((item: any) => item.product.id === product.id);

      if (existingItem) {
        return {
          ...prev,
          cart: prev.cart.map((item: any) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }

      return {
        ...prev,
        cart: [...prev.cart, { product, quantity: 1, subtotal: product.price }],
      };
    });

    enqueueSnackbar(`Đã thêm ${product.name} vào giỏ hàng`, { variant: 'success' });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setPosState((prev: POSState) => ({
      ...prev,
      cart: prev.cart.map((item: any) =>
        item.product.id === productId
          ? { ...item, quantity, subtotal: item.product.price * quantity }
          : item
      ),
    }));
  };

  const removeFromCart = (productId: string) => {
    setPosState((prev: POSState) => ({
      ...prev,
      cart: prev.cart.filter((item: any) => item.product.id !== productId),
    }));
  };

  const getTotalAmount = () => {
    return posState.cart.reduce((total: number, item: any) => total + item.subtotal, 0);
  };

  const getTotalItems = () => {
    return posState.cart.reduce((total: number, item: any) => total + item.quantity, 0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const handleCheckout = () => {
    if (posState.cart.length === 0) {
      enqueueSnackbar('Giỏ hàng trống', { variant: 'warning' });
      return;
    }
    setPaymentDialog(true);
  };

  const processPayment = async () => {
    try {
      const saleData = {
        items: posState.cart.map((item: any) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          subtotal: item.subtotal,
        })),
        total_amount: getTotalAmount(),
        payment_method: paymentMethod,
        received_amount: receivedAmount,
        customer_id: posState.customer?.id,
      };

      await api.post('/sales', saleData);

      enqueueSnackbar('Đơn hàng đã được tạo thành công!', { variant: 'success' });

      // Reset state
      setPosState((prev: POSState) => ({
        ...prev,
        cart: [],
        customer: null,
      }));

      setPaymentDialog(false);
      setReceivedAmount(0);

    } catch (error) {
      console.error('Error processing payment:', error);
      enqueueSnackbar('Lỗi xử lý thanh toán', { variant: 'error' });
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 219, 226, 0.3) 0%, transparent 50%)
          `,
          // animation: `${gradientShift} 15s ease infinite`,
        },
      }}
    >
      <Container maxWidth="xl" sx={{ py: 2, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Card
          sx={{
            mb: 2,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ py: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    width: 48,
                    height: 48,
                  }}
                >
                  <BagIcon sx={{ fontSize: 24, color: 'white' }} />
                </Avatar>
                <Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: 'white',
                      mb: 0.5,
                    }}
                  >
                    Bán Hàng POS
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Giao diện bán hàng hiện đại
                  </Typography>
                </Box>
              </Stack>

              <Badge
                badgeContent={getTotalItems()}
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  },
                }}
              >
                <IconButton
                  onClick={handleCheckout}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  <CartIcon sx={{ color: 'white' }} />
                </IconButton>
              </Badge>
            </Stack>
          </CardContent>
        </Card>

        {/* Main Layout: 2 Columns */}
        <Grid container spacing={2}>
          {/* Left Column: Products */}
          <Grid item xs={12} md={8}>
            <Card
              sx={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 2,
                height: 'calc(100vh - 160px)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Search and Filters */}
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    placeholder="Tìm kiếm sản phẩm..."
                    value={posState.filters.search}
                    onChange={(e) =>
                      setPosState((prev: POSState) => ({
                        ...prev,
                        filters: { ...prev.filters, search: e.target.value },
                      }))
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                        </InputAdornment>
                      ),
                      sx: {
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.5)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.7)',
                        },
                      },
                    }}
                  />

                  <FormControl sx={{ minWidth: 180 }}>
                    <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Danh mục</InputLabel>
                    <Select
                      value={posState.filters.category}
                      onChange={(e) =>
                        setPosState((prev: POSState) => ({
                          ...prev,
                          filters: { ...prev.filters, category: e.target.value },
                        }))
                      }
                      label="Danh mục"
                      sx={{
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.5)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.7)',
                        },
                        '& .MuiSvgIcon-root': {
                          color: 'rgba(255, 255, 255, 0.7)',
                        },
                      }}
                    >
                      <MenuItem value="">Tất cả</MenuItem>
                      {(posState.categories || []).map((category: any) => (
                        <MenuItem key={category.id || category.name} value={category.name}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>

                {/* Products Grid */}
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  {posState.isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                      <CircularProgress sx={{ color: 'white' }} />
                    </Box>
                  ) : filteredProducts.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8, color: 'rgba(255, 255, 255, 0.7)' }}>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Không có sản phẩm nào
                      </Typography>
                      <Typography variant="body2">
                        Total products: {posState.products.length}<br/>
                        Filtered products: {filteredProducts.length}<br/>
                        Search: "{posState.filters.search}"<br/>
                        Category: "{posState.filters.category}"
                      </Typography>
                    </Box>
                  ) : (
                    <Grid container spacing={1.5}>
                      {filteredProducts.map((product: Product, index: number) => (
                        <Grid item xs={6} sm={4} md={3} key={product.id || `product-${index}`}>
                          <Card
                            sx={{
                              background: 'rgba(255, 255, 255, 0.1)',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              borderRadius: 2,
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-5px)',
                                background: 'rgba(255, 255, 255, 0.2)',
                                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                              },
                            }}
                            onClick={() => addToCart(product)}
                          >
                            <CardContent sx={{ p: 2, textAlign: 'center' }}>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  color: 'white',
                                  fontWeight: 600,
                                  mb: 1,
                                  fontSize: '0.9rem',
                                  lineHeight: 1.2,
                                  height: '2.4em',
                                  overflow: 'hidden',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                }}
                              >
                                {product.name || 'Unnamed Product'}
                              </Typography>

                              <Chip
                                label={formatPrice(product.price || 0)}
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(76, 175, 80, 0.2)',
                                  color: '#4caf50',
                                  fontWeight: 'bold',
                                  fontSize: '0.75rem',
                                  mb: 1,
                                }}
                              />

                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'rgba(255, 255, 255, 0.6)',
                                  display: 'block',
                                  fontSize: '0.7rem',
                                }}
                              >
                                SKU: {product.sku || 'N/A'}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column: Cart */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 2,
                height: 'calc(100vh - 160px)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <CartIcon sx={{ color: 'white' }} />
                  <Typography
                    variant="h6"
                    sx={{ color: 'white', fontWeight: 600, flex: 1 }}
                  >
                    Giỏ hàng ({getTotalItems()})
                  </Typography>
                </Stack>

                <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', mb: 2 }} />

                {/* Cart Items */}
                <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
                  {posState.cart.length === 0 ? (
                    <Box
                      sx={{
                        textAlign: 'center',
                        py: 4,
                        color: 'rgba(255, 255, 255, 0.6)',
                      }}
                    >
                      <CartIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                      <Typography variant="body2">
                        Giỏ hàng đang trống
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={1}>
                      {posState.cart.map((item: any) => (
                        <Card
                          key={item.product.id}
                          sx={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 1.5,
                          }}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="start">
                              <Box sx={{ flex: 1, mr: 1 }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'white',
                                    fontWeight: 500,
                                    fontSize: '0.85rem',
                                    lineHeight: 1.2,
                                    mb: 0.5,
                                  }}
                                >
                                  {item.product.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
                                >
                                  {formatPrice(item.product.price)} × {item.quantity}
                                </Typography>
                              </Box>

                              <IconButton
                                size="small"
                                onClick={() => removeFromCart(item.product.id)}
                                sx={{
                                  color: 'rgba(255, 255, 255, 0.6)',
                                  '&:hover': {
                                    color: '#f44336',
                                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                                  },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Stack>

                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <IconButton
                                  size="small"
                                  onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                                  sx={{
                                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    width: 24,
                                    height: 24,
                                  }}
                                >
                                  <RemoveIcon fontSize="small" />
                                </IconButton>

                                <Typography
                                  sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    minWidth: 30,
                                    textAlign: 'center',
                                    fontSize: '0.9rem',
                                  }}
                                >
                                  {item.quantity}
                                </Typography>

                                <IconButton
                                  size="small"
                                  onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                                  sx={{
                                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    width: 24,
                                    height: 24,
                                  }}
                                >
                                  <AddIcon fontSize="small" />
                                </IconButton>
                              </Stack>

                              <Typography
                                variant="body2"
                                sx={{
                                  color: '#4caf50',
                                  fontWeight: 700,
                                  fontSize: '0.9rem',
                                }}
                              >
                                {formatPrice(item.subtotal)}
                              </Typography>
                            </Stack>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Box>

                {/* Total and Checkout */}
                {posState.cart.length > 0 && (
                  <>
                    <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', mb: 2 }} />

                    <Card
                      sx={{
                        background: 'rgba(76, 175, 80, 0.2)',
                        border: '1px solid rgba(76, 175, 80, 0.3)',
                        borderRadius: 2,
                        mb: 2,
                      }}
                    >
                      <CardContent sx={{ p: 2, textAlign: 'center' }}>
                        <Typography
                          variant="body2"
                          sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 0.5 }}
                        >
                          Tổng cộng
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{
                            color: '#4caf50',
                            fontWeight: 700,
                          }}
                        >
                          {formatPrice(getTotalAmount())}
                        </Typography>
                      </CardContent>
                    </Card>

                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={handleCheckout}
                      sx={{
                        bgcolor: 'rgba(76, 175, 80, 0.9)',
                        color: 'white',
                        fontWeight: 600,
                        py: 1.5,
                        borderRadius: 2,
                        '&:hover': {
                          bgcolor: 'rgba(76, 175, 80, 1)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(76, 175, 80, 0.4)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                      startIcon={<PaymentIcon />}
                    >
                      Thanh Toán
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Payment Dialog */}
        <Dialog
          open={paymentDialog}
          onClose={() => setPaymentDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            },
          }}
        >
          <DialogTitle sx={{ color: 'white', textAlign: 'center' }}>
            <PaymentIcon sx={{ mr: 1 }} />
            Thanh Toán
          </DialogTitle>

          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                  Tổng tiền: {formatPrice(getTotalAmount())}
                </Typography>
              </Box>

              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Phương thức thanh toán
                </InputLabel>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  label="Phương thức thanh toán"
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                  }}
                >
                  <MenuItem value="cash">Tiền mặt</MenuItem>
                  <MenuItem value="card">Thẻ</MenuItem>
                  <MenuItem value="transfer">Chuyển khoản</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Số tiền nhận"
                type="number"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(Number(e.target.value))}
                InputProps={{
                  sx: {
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                  },
                }}
                InputLabelProps={{
                  sx: { color: 'rgba(255, 255, 255, 0.7)' },
                }}
              />

              {receivedAmount > 0 && receivedAmount >= getTotalAmount() && (
                <Alert
                  severity="info"
                  sx={{
                    bgcolor: 'rgba(33, 150, 243, 0.1)',
                    color: 'white',
                    '& .MuiAlert-icon': { color: '#2196f3' },
                  }}
                >
                  Tiền thừa: {formatPrice(receivedAmount - getTotalAmount())}
                </Alert>
              )}
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => setPaymentDialog(false)}
              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              Hủy
            </Button>
            <Button
              onClick={processPayment}
              variant="contained"
              disabled={receivedAmount < getTotalAmount()}
              sx={{
                bgcolor: 'rgba(76, 175, 80, 0.9)',
                '&:hover': { bgcolor: 'rgba(76, 175, 80, 1)' },
              }}
            >
              Xác Nhận Thanh Toán
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default ModernSalesInterface;
