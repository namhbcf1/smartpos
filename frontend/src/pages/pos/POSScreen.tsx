import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Alert,
  Stack,
  CircularProgress,
  Snackbar,
  Zoom,
} from '@mui/material';
import {
  Search,
  Add,
  Remove,
  Delete,
  ShoppingCart,
  QrCode,
  Refresh,
  Settings,
  Person,
  Payment,
  CreditCard,
  AccountBalance,
  PhoneAndroid,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api, { serialNumbersAPI } from '../../services/api';
import VNPayPaymentDialog from '../../components/payment/VNPayPaymentDialog';

// Types theo D1_COLUMNS.md
interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  price_cents: number;
  stock: number;
  category_id?: string;
  category_name?: string;
  brand_name?: string;
  image_url?: string;
  is_active: number;
}

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  date_of_birth?: string;
  gender?: string;
  customer_type?: string;
  loyalty_points: number;
  total_spent_cents: number;
}

interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price_cents: number;
  total_price_cents: number;
  discount_percent: number;
  serial_numbers?: string[]; // Array of selected serial numbers
}

const POSScreen: React.FC = () => {
  const navigate = useNavigate();
  
  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Keep for future highlighting of serial-matched products (no-op for now)
  const [serialMatchProductIds, setSerialMatchProductIds] = useState<string[]>([]);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [newCustomerDialogOpen, setNewCustomerDialogOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [serialDialogOpen, setSerialDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [availableSerials, setAvailableSerials] = useState<any[]>([]);
  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);
  const [loadingSerials, setLoadingSerials] = useState(false);
  const [vnpayDialogOpen, setVnpayDialogOpen] = useState(false);

  // New customer form state
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    date_of_birth: '',
    gender: '',
    customer_type: 'regular'
  });

  // Load products from API
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const q = (searchQuery || '').trim();

      // 1) Try searching by serial number first for precise item lookup
      if (q) {
        try {
          const serialRes = await serialNumbersAPI.searchSerials(q);
          const serialPayload: any = serialRes?.data || {};
          const serialList: any[] =
            (serialPayload.data && (serialPayload.data.serialNumbers || serialPayload.data.serials || serialPayload.data.items)) ||
            serialPayload.serialNumbers ||
            serialPayload.items ||
            (Array.isArray(serialPayload.data) ? serialPayload.data : []);

          const productIds = Array.from(
            new Set(
              (serialList || [])
                .map((s: any) => s?.product_id || s?.productId || s?.product?.id)
                .filter(Boolean)
            )
          ) as string[];

          if (productIds.length > 0) {
            const productResponses = await Promise.all(
              productIds.map((id) => api.get(`/products/${id}`))
            );

            const foundProducts: Product[] = productResponses
              .map((r: any) => {
                const body = r?.data || {};
                return (
                  body.data || body.product || body
                );
              })
              .filter((p: any) => p && p.id);

            if (foundProducts.length > 0) {
              setProducts(foundProducts as Product[]);
              setSerialMatchProductIds(productIds);
              return;
            }
          }
        } catch (e) {
          // Ignore serial search errors and fall back to normal product search
        }
      }

      // 2) Fallback to normal product search
      const response = await api.get('/products', {
        params: {
          search: q,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          limit: 50
        }
      });
      
      if (response.data.success) {
        setProducts(response.data.products || []);
        setSerialMatchProductIds([]);
      } else {
        setError('Không thể tải danh sách sản phẩm');
      }
    } catch (err) {
      console.error('Load products error:', err);
      setError('Lỗi kết nối API');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter]);

  // Filter products locally for instant search
  const filteredProducts = useMemo(() => {
    // If we matched by serial, show the fetched products as-is regardless of the search text
    if (serialMatchProductIds.length > 0) {
      return products;
    }

    let filtered = products;

    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => 
        product.category_id === categoryFilter
      );
    }

    return filtered;
  }, [products, searchQuery, categoryFilter, serialMatchProductIds.length]);

  // Load customers from API
  const loadCustomers = useCallback(async () => {
    try {
      const response = await api.get('/customers', {
        params: { limit: 100 }
      });
      
      if (response.data.success) {
        setCustomers(response.data.customers || []);
      }
    } catch (err) {
      console.error('Load customers error:', err);
    }
  }, []);

  // Filter customers based on search term
  const filteredCustomers = useMemo(() => {
    if (!customerSearchTerm) return customers;
    
    const searchLower = customerSearchTerm.toLowerCase();
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(searchLower) ||
      (customer.phone && customer.phone.includes(searchLower)) ||
      (customer.email && customer.email.toLowerCase().includes(searchLower))
    );
  }, [customers, customerSearchTerm]);

  // Create new customer
  const handleCreateCustomer = useCallback(async () => {
    if (!newCustomer.name || !newCustomer.phone) return;
    
    setCreatingCustomer(true);
    try {
      const response = await api.post('/customers', {
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email || null,
        address: newCustomer.address || null,
        date_of_birth: newCustomer.date_of_birth || null,
        gender: newCustomer.gender || null,
        customer_type: newCustomer.customer_type || 'regular',
        loyalty_points: 0,
        total_spent_cents: 0,
        visit_count: 0,
        is_active: 1
      });

      if (response.data.success) {
        const createdCustomer = response.data.data;
        setCustomers(prev => [...prev, createdCustomer]);
        setSelectedCustomer(createdCustomer);
        setNewCustomerDialogOpen(false);
        setCustomerDialogOpen(false);
        
        // Reset form
        setNewCustomer({
          name: '',
          phone: '',
          email: '',
          address: '',
          date_of_birth: '',
          gender: '',
          customer_type: 'regular'
        });
        
        setSnackbarMessage('Khách hàng đã được tạo thành công!');
        setSnackbarOpen(true);
      } else {
        setError(response.data.error || 'Không thể tạo khách hàng');
      }
    } catch (error: any) {
      console.error('Create customer error:', error);
      setError(error.response?.data?.error || 'Không thể tạo khách hàng');
    } finally {
      setCreatingCustomer(false);
    }
  }, [newCustomer]);

  // Load cart from API
  const loadCart = useCallback(async () => {
    try {
      const response = await api.get('/pos/cart');
      
      if (response.data.success) {
        setCart(response.data.data.items || []);
      }
    } catch (err) {
      console.error('Load cart error:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadProducts();
    loadCustomers();
    loadCart();
  }, [loadProducts, loadCustomers, loadCart]);

  // Add to cart
  const addToCart = async (product: Product) => {
    // Open serial selection dialog
    setSelectedProduct(product);
    setLoadingSerials(true);
    setSerialDialogOpen(true);

    try {
      // Fetch available serials for this product (include both 'in_stock' and 'available')
      const byProductRes = await serialNumbersAPI.getByProduct(product.id);
      const serialsData = (byProductRes as any)?.data?.data;
      setAvailableSerials(Array.isArray(serialsData) ? serialsData : []);
    } catch (err) {
      console.error('Error fetching serials:', err);
      setError('Không thể tải danh sách serial');
      setAvailableSerials([]);
    } finally {
      setLoadingSerials(false);
    }
  };

  const confirmAddToCart = async () => {
    if (!selectedProduct) return;

    try {
      const response = await api.post('/pos/cart/items', {
        product_id: selectedProduct.id,
        quantity: selectedSerials.length || 1,
        unit_price: selectedProduct.price_cents,
        discount_percent: 0,
        serial_numbers: selectedSerials.length > 0 ? selectedSerials : undefined
      });

      if (response.data.success) {
        // Add to local cart immediately for better UX
        const newItem: CartItem = {
          id: response.data.data.id,
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          sku: selectedProduct.sku,
          quantity: selectedSerials.length || 1,
          unit_price_cents: selectedProduct.price_cents,
          total_price_cents: selectedProduct.price_cents * (selectedSerials.length || 1),
          discount_percent: 0,
          serial_numbers: selectedSerials.length > 0 ? selectedSerials : undefined
        };
        setCart(prev => [...prev, newItem]);

        // Show success notification
        setSnackbarMessage(`Đã thêm "${selectedProduct.name}" vào giỏ hàng!`);
        setSnackbarOpen(true);

        // Close dialog and reset
        setSerialDialogOpen(false);
        setSelectedProduct(null);
        setSelectedSerials([]);
        setAvailableSerials([]);
      } else {
        setError('Không thể thêm sản phẩm vào giỏ hàng');
      }
    } catch (err) {
      console.error('Add to cart error:', err);
      setError('Lỗi khi thêm sản phẩm');
    }
  };

  // Update cart item quantity
  const updateCartItem = async (itemId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await api.delete(`/pos/cart/items/${itemId}`);
        setCart(prev => prev.filter(item => item.id !== itemId));
      } else {
        await api.put(`/pos/cart/items/${itemId}`, { quantity });
        setCart(prev => prev.map(item => 
          item.id === itemId 
            ? { ...item, quantity, total_price_cents: item.unit_price_cents * quantity }
            : item
        ));
      }
    } catch (err) {
      console.error('Update cart error:', err);
    }
  };

  // Remove from cart
  const removeFromCart = async (itemId: string) => {
    try {
      await api.delete(`/pos/cart/items/${itemId}`);
      setCart(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      console.error('Remove from cart error:', err);
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      await api.delete('/pos/cart');
      setCart([]);
    } catch (err) {
      console.error('Clear cart error:', err);
    }
  };

  // Handle VNPay payment
  const handleVNPayPayment = () => {
    if (cart.length === 0) {
      setError('Giỏ hàng trống');
      return;
    }

    const orderId = `POS_${Date.now()}`;
    const orderDescription = `Thanh toán đơn hàng POS - ${cart.length} sản phẩm`;
    
    setVnpayDialogOpen(true);
  };

  // Handle VNPay success
  const handleVNPaySuccess = (paymentUrl: string) => {
    // Redirect to VNPay payment page
    window.open(paymentUrl, '_blank');
    
    // Show success message
    setSnackbarMessage('Đang chuyển hướng đến VNPay...');
    setSnackbarOpen(true);
  };

  // Handle VNPay error
  const handleVNPayError = (error: string) => {
    setError(error);
  };

  // Process checkout
  const processCheckout = async (paymentData: any) => {
    try {
      setLoading(true);
      
      // Frontend guard: require serials for serialized products
      // Fetch serialized flags for products in cart (simple check via current data if present)
      const missingSerialFor: string[] = [];
      for (const item of cart) {
        // If user already selected serials array on item, trust it; otherwise, we can proceed and let server enforce
        if (Array.isArray(item.serial_numbers)) {
          const qty = Number(item.quantity || 0);
          if (item.serial_numbers.length !== qty) {
            missingSerialFor.push(item.product_name);
          }
        }
      }
      if (missingSerialFor.length > 0) {
        setError(`Thiếu serial cho sản phẩm: ${missingSerialFor.join(', ')}`);
        setLoading(false);
        return;
      }

      const response = await api.post('/pos/checkout', {
        customer_info: selectedCustomer ? {
          customer_id: selectedCustomer.id,
          name: selectedCustomer.name,
          phone: selectedCustomer.phone,
          email: selectedCustomer.email
        } : {
          name: 'Khách lẻ',
          phone: '',
          email: ''
        },
        payment_method: paymentData.method,
        total_amount: getCartTotal(),
        cart_items: cart.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          sku: item.sku,
          quantity: item.quantity,
          unit_price_cents: item.unit_price_cents,
          total_price_cents: item.total_price_cents,
          discount_percent: item.discount_percent,
          serial_numbers: item.serial_numbers
        })),
        discount_percent: 0,
        discount_amount: 0,
        tax_percent: 10
      });

      if (response.data.success) {
        // Success - clear cart and show success message
        setCart([]);
        setSelectedCustomer(null);
        setPaymentDialogOpen(false);
        
        // Show success message and redirect to orders
        alert('Thanh toán thành công! Đang chuyển đến trang đơn hàng...');
        
        // Redirect to orders page after 2 seconds
        setTimeout(() => {
          navigate('/orders');
        }, 2000);
      } else {
        setError('Thanh toán thất bại');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Lỗi thanh toán');
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const getCartSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.total_price_cents, 0);
  };

  const getCartTax = () => {
    return Math.round(getCartSubtotal() * 0.1);
  };

  const getCartTotal = () => {
    return getCartSubtotal() + getCartTax();
  };


  // Format currency
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount);
  };


  return (
    <Box sx={{ 
      height: 'calc(100vh - 64px)', 
      display: 'flex', 
      bgcolor: '#f5f5f5', 
      gap: 1,
      overflow: 'hidden' // Ngăn scroll toàn trang
    }}>
        {/* Left Panel - Products (Fixed 50%) */}
        <Box sx={{ 
          width: '50%', 
          height: '100%', 
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0 // Không cho phép co lại
        }}>
          <Paper sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            p: 2,
            overflow: 'hidden' // Ngăn scroll trong panel
          }}>
            <Box sx={{ mb: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h5" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShoppingCart /> Smart POS
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button 
                    variant="outlined" 
                    startIcon={<QrCode />} 
                    size="small"
                    onClick={() => {
                      // TODO: Implement QR code scanning
                      alert('Chức năng quét mã sẽ được triển khai sớm!');
                    }}
                  >
                    Quét mã
                  </Button>
              <Button
                    variant="outlined" 
                    startIcon={<Refresh />} 
                    size="small" 
                    onClick={() => {
                      loadProducts();
                      loadCustomers();
                      loadCart();
                    }}
                  >
                    Làm mới
              </Button>
              <Button
                    variant="outlined" 
                    startIcon={<Settings />} 
                    size="small"
                    onClick={() => {
                      // TODO: Implement settings dialog
                      alert('Chức năng cài đặt sẽ được triển khai sớm!');
                    }}
                  >
                    Cài đặt
              </Button>
                </Stack>
              </Stack>

              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <TextField
                  placeholder="Tìm kiếm sản phẩm..."
                  size="small"
                  sx={{ flex: 1 }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Danh mục</InputLabel>
                  <Select
                    value={categoryFilter}
                    label="Danh mục"
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <MenuItem value="all">Tất cả</MenuItem>
                    <MenuItem value="phone">Điện thoại</MenuItem>
                    <MenuItem value="laptop">Laptop</MenuItem>
                    <MenuItem value="accessory">Phụ kiện</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                <Tab label="Sản phẩm" />
                <Tab label="Khách hàng" />
              </Tabs>
        </Box>

            {/* Products Tab */}
            {activeTab === 0 && (
              <Box sx={{ 
                flex: 1, 
                overflow: 'auto',
                maxHeight: 'calc(100vh - 200px)' // Giới hạn chiều cao
              }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : error ? (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                ) : (
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
                    {filteredProducts.map(product => (
                      <Card key={product.id}>
                        <CardMedia
                          component="img"
                          height="120"
                          image={product.image_url || `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjVmNWY1Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+Cg==`}
                          alt={product.name}
                          sx={{ objectFit: 'contain', p: 1, bgcolor: '#f5f5f5' }}
                        />
                        <CardContent sx={{ p: 1.5 }}>
                          <Typography variant="body2" fontWeight="bold" noWrap>
                            {product.name}
              </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {product.sku}
                          </Typography>
                          <Typography variant="body2" color="success.main" fontWeight="bold">
                            {formatVND(product.price_cents)}
                  </Typography>
                          <Chip
                            label={`Còn ${product.stock}`}
                            size="small"
                            color={product.stock > 10 ? 'success' : product.stock > 5 ? 'warning' : 'error'}
                            sx={{ mt: 0.5 }}
                          />
                        </CardContent>
                        <CardActions sx={{ p: 1 }}>
                          <Button
                            fullWidth
                            variant="contained"
                            size="small"
                            startIcon={<Add />}
                            onClick={() => addToCart(product)}
                            disabled={false}
                          >
                            Thêm
                          </Button>
                        </CardActions>
                      </Card>
              ))}
              </Box>
                )}
            </Box>
            )}

            {/* Customers Tab */}
            {activeTab === 1 && (
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <List>
                  {customers.map(customer => (
                    <ListItem
                      key={customer.id}
                  sx={{
                    cursor: 'pointer',
                        '&:hover': { bgcolor: 'grey.100' }
                      }}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setCustomerDialogOpen(false);
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar>{customer.name.charAt(0)}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={customer.name}
                        secondary={`${customer.phone || ''} • ${customer.loyalty_points} điểm`}
                      />
                    </ListItem>
                  ))}
                </List>
            </Box>
            )}
          </Paper>
          </Box>

        {/* Middle Panel - Cart (Fixed 25%) */}
        <Box sx={{ 
          width: '25%', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          flexShrink: 0 // Không cho phép co lại
        }}>
          <Paper sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            p: 2,
            overflow: 'hidden' // Ngăn scroll trong panel
          }}>
            <Box sx={{ mb: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShoppingCart /> Giỏ hàng
              </Typography>
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={clearCart} disabled={cart.length === 0}>
                    Xóa
                  </Button>
                  <Button size="small">
                    Lịch sử
                  </Button>
                </Stack>
              </Stack>

              {selectedCustomer && (
                <Chip
                  label={`${selectedCustomer.name} (${selectedCustomer.loyalty_points} điểm)`}
                  onDelete={() => setSelectedCustomer(null)}
                  color="primary"
                  sx={{ mb: 2 }}
                />
              )}

              {!selectedCustomer && (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Person />}
                  onClick={() => setCustomerDialogOpen(true)}
                  sx={{ mb: 2 }}
                >
                  Chọn khách hàng
                </Button>
              )}
                      </Box>

            {/* Cart Items */}
            <Box sx={{ 
              flex: 1, 
              overflow: 'auto', 
              mb: 2,
              maxHeight: 'calc(100vh - 300px)' // Giới hạn chiều cao
            }}>
              {cart.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <ShoppingCart sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                  <Typography color="text.secondary">Giỏ hàng trống</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Sản phẩm</TableCell>
                        <TableCell align="center">SL</TableCell>
                        <TableCell align="right">Giá</TableCell>
                        <TableCell align="right">Tổng</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cart.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {item.product_name}
                      </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.sku}
                        </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" alignItems="center" spacing={1}>
                <IconButton
                          size="small"
                                onClick={() => updateCartItem(item.id, item.quantity - 1)}
                >
                  <Remove />
                </IconButton>
                              <Typography variant="body2">{item.quantity}</Typography>
                        <IconButton
                          size="small"
                                onClick={() => updateCartItem(item.id, item.quantity + 1)}
                        >
                  <Add />
                        </IconButton>
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            {formatVND(item.unit_price_cents)}
                          </TableCell>
                          <TableCell align="right">
                            {formatVND(item.total_price_cents)}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => removeFromCart(item.id)}
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
                      </Box>

          </Paper>
        </Box>

        {/* Right Panel - Payment (Fixed 25%) */}
        <Box sx={{ 
          width: '25%', 
          height: '100%', 
              display: 'flex',
          flexDirection: 'column',
          flexShrink: 0 // Không cho phép co lại
        }}>
          <Paper sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            p: 2,
            overflow: 'hidden' // Ngăn scroll trong panel
          }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Payment /> Thanh toán
              </Typography>
      </Box>

            {/* Customer Info */}
            <Box sx={{ mb: 2 }}>
              {!selectedCustomer ? (
                <Button
                  variant="outlined"
                  startIcon={<Person />}
                  onClick={() => setCustomerDialogOpen(true)}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  Chọn khách hàng
                </Button>
              ) : (
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                    {selectedCustomer.name}
                </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedCustomer.phone}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {selectedCustomer.loyalty_points} điểm
                </Typography>
              </Box>
              )}
            </Box>

            {/* Payment Summary */}
            {cart.length > 0 && (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Tóm tắt đơn hàng
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Tạm tính:</Typography>
                      <Typography variant="body2">{formatVND(getCartSubtotal())}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Thuế (10%):</Typography>
                      <Typography variant="body2">{formatVND(getCartTax())}</Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6" fontWeight="bold">Tổng cộng:</Typography>
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        {formatVND(getCartTotal())}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* Payment Methods */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Phương thức thanh toán
                  </Typography>
                  <Stack spacing={1}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Payment />}
                      onClick={() => processCheckout({ method: 'cash' })}
                      disabled={loading || cart.length === 0}
                    >
                      Tiền mặt
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<CreditCard />}
                      onClick={() => processCheckout({ method: 'card' })}
                      disabled={loading || cart.length === 0}
                    >
                      Thẻ
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<AccountBalance />}
                      onClick={() => processCheckout({ method: 'bank_transfer' })}
                      disabled={loading || cart.length === 0}
                    >
                      Chuyển khoản
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<PhoneAndroid />}
                      onClick={() => processCheckout({ method: 'e_wallet' })}
                      disabled={loading || cart.length === 0}
                    >
                      Ví điện tử
                    </Button>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<Payment />}
                      onClick={handleVNPayPayment}
                      disabled={loading || cart.length === 0}
                      sx={{ 
                        background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #FE6B8B 60%, #FF8E53 100%)',
                        }
                      }}
                    >
                      VNPay
                    </Button>
                  </Stack>
              </Box>

                {/* Quick Actions */}
                <Box sx={{ mt: 'auto' }}>
              <Button
                variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<Payment />}
                    onClick={() => setPaymentDialogOpen(true)}
                    disabled={cart.length === 0}
                    sx={{ mb: 1 }}
                  >
                    {loading ? <CircularProgress size={20} /> : 'Thanh toán nhanh'}
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={clearCart}
                    disabled={cart.length === 0}
                  >
                    Xóa giỏ hàng
              </Button>
            </Box>
          </Box>
        )}

            {/* Empty State */}
            {cart.length === 0 && (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                <ShoppingCart sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography color="text.secondary" variant="body2">
                  Chưa có sản phẩm nào trong giỏ hàng
                </Typography>
                <Typography color="text.secondary" variant="caption">
                  Thêm sản phẩm để bắt đầu thanh toán
                </Typography>
              </Box>
            )}
          </Paper>
      </Box>

      {/* Enhanced Customer Selection Dialog */}
      <Dialog open={customerDialogOpen} onClose={() => setCustomerDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person />
            <Typography variant="h6">Chọn khách hàng</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setNewCustomerDialogOpen(true)}
            size="small"
          >
            Thêm mới
          </Button>
        </DialogTitle>
        <DialogContent>
          {/* Search Bar */}
          <TextField
            fullWidth
            placeholder="Tìm kiếm khách hàng theo tên, số điện thoại..."
            value={customerSearchTerm}
            onChange={(e) => setCustomerSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {/* Customer List */}
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredCustomers.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Person sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {customerSearchTerm ? 'Không tìm thấy khách hàng' : 'Chưa có khách hàng nào'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {customerSearchTerm 
                    ? `Không có khách hàng nào khớp với "${customerSearchTerm}"`
                    : 'Bắt đầu bằng cách thêm khách hàng đầu tiên'
                  }
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setNewCustomerDialogOpen(true)}
                >
                  {customerSearchTerm ? 'Tạo khách hàng mới' : 'Thêm khách hàng đầu tiên'}
                </Button>
              </Box>
            ) : (
              <List>
                {filteredCustomers.map(customer => (
                  <ListItem
                    key={customer.id}
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setCustomerDialogOpen(false);
                    }}
        sx={{
                      cursor: 'pointer',
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {customer.name.charAt(0).toUpperCase()}
                </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {customer.name}
                  </Typography>
                          {customer.loyalty_points > 0 && (
                            <Chip
                              label={`${customer.loyalty_points} điểm`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {customer.phone || 'Chưa có số điện thoại'}
                          </Typography>
                          {customer.email && (
                  <Typography variant="caption" color="text.secondary">
                              {customer.email}
                  </Typography>
                          )}
                </Box>
                      }
                    />
                  </ListItem>
          ))}
              </List>
            )}
        </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomerDialogOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* New Customer Dialog */}
      <Dialog open={newCustomerDialogOpen} onClose={() => setNewCustomerDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Add />
          <Typography variant="h6">Thêm khách hàng mới</Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Tên khách hàng *"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            <TextField
              fullWidth
              label="Số điện thoại *"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={newCustomer.email}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Địa chỉ"
              multiline
              rows={2}
              value={newCustomer.address}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Ngày sinh"
              type="date"
              value={newCustomer.date_of_birth}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, date_of_birth: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth>
              <InputLabel>Giới tính</InputLabel>
              <Select
                value={newCustomer.gender}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, gender: e.target.value }))}
                label="Giới tính"
              >
                <MenuItem value="">Không xác định</MenuItem>
                <MenuItem value="male">Nam</MenuItem>
                <MenuItem value="female">Nữ</MenuItem>
                <MenuItem value="other">Khác</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Loại khách hàng</InputLabel>
              <Select
                value={newCustomer.customer_type}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, customer_type: e.target.value }))}
                label="Loại khách hàng"
              >
                <MenuItem value="regular">Khách hàng thường</MenuItem>
                <MenuItem value="vip">VIP</MenuItem>
                <MenuItem value="wholesale">Bán buôn</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewCustomerDialogOpen(false)}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleCreateCustomer}
            disabled={!newCustomer.name || !newCustomer.phone || creatingCustomer}
          >
            {creatingCustomer ? <CircularProgress size={20} /> : 'Tạo khách hàng'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thanh toán</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Phương thức thanh toán</InputLabel>
              <Select defaultValue="cash">
                <MenuItem value="cash">Tiền mặt</MenuItem>
                <MenuItem value="card">Thẻ</MenuItem>
                <MenuItem value="bank_transfer">Chuyển khoản</MenuItem>
                <MenuItem value="e_wallet">Ví điện tử</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Số tham chiếu (tùy chọn)"
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>Hủy</Button>
          <Button 
            variant="contained" 
            onClick={() => processCheckout({ method: 'cash' })}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Xác nhận thanh toán'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Notification */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        TransitionComponent={Zoom}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: '100%' }}
          icon={<ShoppingCart />}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Serial Selection Dialog */}
      <Dialog
        open={serialDialogOpen}
        onClose={() => {
          setSerialDialogOpen(false);
          setSelectedProduct(null);
          setSelectedSerials([]);
          setAvailableSerials([]);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Chọn số serial - {selectedProduct?.name}
        </DialogTitle>
        <DialogContent>
          {loadingSerials ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : availableSerials.length === 0 ? (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Không có serial nào khả dụng cho sản phẩm này. Bạn có thể bỏ qua và hệ thống sẽ tự động chọn serial khi thanh toán.
            </Alert>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Có {availableSerials.length} serial khả dụng. Chọn serial cụ thể hoặc bỏ qua để hệ thống tự động chọn.
              </Typography>
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {availableSerials.map((serial) => (
                  <ListItem
                    key={serial.id}
                    button
                    selected={selectedSerials.includes(serial.serial_number)}
                    onClick={() => {
                      if (selectedSerials.includes(serial.serial_number)) {
                        setSelectedSerials(prev => prev.filter(s => s !== serial.serial_number));
                      } else {
                        setSelectedSerials(prev => [...prev, serial.serial_number]);
                      }
                    }}
                    sx={{
                      border: '1px solid',
                      borderColor: selectedSerials.includes(serial.serial_number) ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: selectedSerials.includes(serial.serial_number) ? 'primary.main' : 'grey.400' }}>
                        <QrCode />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={serial.serial_number}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.secondary">
                            Nhập: {serial.manufacturing_date ? new Date(serial.manufacturing_date).toLocaleDateString('vi-VN') : 'N/A'}
                          </Typography>
                          {serial.location && (
                            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                              • Vị trí: {serial.location}
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setSerialDialogOpen(false);
              setSelectedProduct(null);
              setSelectedSerials([]);
              setAvailableSerials([]);
            }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={confirmAddToCart}
            disabled={availableSerials.length > 0 && selectedSerials.length === 0}
          >
            {selectedSerials.length > 0
              ? `Thêm (${selectedSerials.length} serial)`
              : availableSerials.length === 0
                ? 'Thêm (tự động chọn)'
                : 'Bỏ qua (tự động chọn)'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* VNPay Payment Dialog */}
      <VNPayPaymentDialog
        open={vnpayDialogOpen}
        onClose={() => setVnpayDialogOpen(false)}
        orderData={{
          orderId: `POS_${Date.now()}`,
          amount: getCartTotal(),
          orderDescription: `Thanh toán đơn hàng POS - ${cart.length} sản phẩm`
        }}
        onSuccess={handleVNPaySuccess}
        onError={handleVNPayError}
      />
    </Box>
  );
};

export default POSScreen;