import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  useMediaQuery,
  Typography,
  TextField,
  Stack,
  Divider,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import api from '../../services/api';

// Import modular components
import { POSHeader } from '../pos/components/POSHeader';
import { ProductSearch } from '../pos/components/ProductSearch';
import { POSProductGrid } from '../pos/components/POSProductGrid';
import { ShoppingCart } from '../pos/components/ShoppingCart';

// Import types
import {
  Product,
  CartItem,
  Customer,
  POSFilters,
  POSState,
  SalesSummary,
  PaymentMethod
} from './pos/components/types';

const NewSaleFixed = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  // State Management
  const [posState, setPosState] = useState<POSState>({
    cart: [],
    payments: [],
    discount: { type: 'none', value: 0, amount: 0 },
    tax: { rate: 10, amount: 0 },
    subtotal: 0,
    total: 0,
    paid_amount: 0,
    change_amount: 0,
    customer: undefined as Customer | undefined,
    receipt_number: '',
    notes: '',
    status: 'draft'
  });

  // Filters for products
  const [filters, setFilters] = useState<POSFilters>({
    search: '',
    category_id: null as number | null,
    in_stock_only: true,
    price_range: { min: 0, max: 1000000 },
    sort_by: 'name',
    sort_order: 'asc'
  });

  // Fetch products with filters - inline implementation with FIXED ERROR HANDLING
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setProductsLoading(true);

      const cleanParams = {
        search: filters.search,
        category_id: filters.category_id,
        in_stock_only: filters.in_stock_only,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order,
        limit: 50
      };
      const filteredParams = Object.entries(cleanParams).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      const response = await api.get('/products', {
        params: filteredParams,
        withCredentials: true,
      });

      if (response.data.success) {
        let productsData: Product[] = [];

        if (response.data.data && typeof response.data.data === 'object') {
          if (Array.isArray(response.data.data)) {
            productsData = response.data.data;
          } else if (response.data.data.data && Array.isArray(response.data.data.data)) {
            productsData = response.data.data.data;
          }
        }
        
        const finalProducts = Array.isArray(productsData) ? productsData : [];
        setProducts(finalProducts);
        setProductsError(null);
      } else {
        throw new Error(response.data.message || 'Failed to fetch products');
      }
    } catch (err) {
      setProductsError('Không thể tải danh sách sản phẩm');
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [filters.search, filters.category_id, filters.in_stock_only, filters.sort_by, filters.sort_order]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (products.length > 0 && productsError) {
      setProductsError(null);
    }
  }, [products.length, productsError]);

  // Other state
  const [categories, setCategories] = useState([]);
  const [, setCategoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
  // Payment state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const response = await api.get('/categories');
      if (response.data.success) {
        setCategories(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // Fetch sales summary
  const fetchSalesSummary = useCallback(async () => {
    try {
      const response = await api.get('/sales/summary');
      if (response && response.data && response.data.success) {
        setSalesSummary(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching sales summary:', err);
    }
  }, []);

  // Fetch payment methods
  const fetchPaymentMethods = useCallback(async () => {
    try {
      const response = await api.get('/payment-methods');
      if (response && response.data && response.data.success) {
        setPaymentMethods(response.data.data || []);
        if (response.data.data && response.data.data.length > 0) {
          setSelectedPaymentMethod(response.data.data[0].id);
        }
      }
    } catch (err) {
      const defaultMethods: PaymentMethod[] = [
        { id: 'cash', name: 'Tiền mặt', type: 'cash', icon: '💵', is_active: true },
        { id: 'card', name: 'Thẻ tín dụng', type: 'card', icon: '💳', is_active: true },
        { id: 'bank', name: 'Chuyển khoản', type: 'bank_transfer', icon: '🏦', is_active: true }
      ];
      setPaymentMethods(defaultMethods);
      setSelectedPaymentMethod('cash');
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchSalesSummary();
    fetchPaymentMethods();
  }, [fetchCategories, fetchSalesSummary, fetchPaymentMethods]);

  // Calculate totals
  const calculateTotals = useCallback(() => {
    const subtotal = posState.cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const discountAmount = posState.discount.type === 'percentage' 
      ? (subtotal * posState.discount.value / 100)
      : posState.discount.value;
    const taxAmount = (subtotal - discountAmount) * posState.tax.rate / 100;
    const total = subtotal - discountAmount + taxAmount;
    
    return { subtotal, discountAmount, taxAmount, total };
  }, [posState.cart, posState.discount, posState.tax.rate]);

  // Update totals when cart changes
  useEffect(() => {
    const { subtotal, discountAmount, taxAmount, total } = calculateTotals();
    setPosState(prev => ({
      ...prev,
      subtotal,
      discount: { ...prev.discount, amount: discountAmount },
      tax: { ...prev.tax, amount: taxAmount },
      total,
      change_amount: Math.max(0, prev.paid_amount - total)
    }));
  }, [calculateTotals]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setError(null);
    fetchProducts();
    fetchCategories();
    fetchSalesSummary();
  }, [fetchProducts, fetchCategories, fetchSalesSummary]);


  // Show loading state
  if (productsLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Show error state with retry option
  if (error || productsError) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || productsError}
        </Alert>
        <Button onClick={handleRefresh} variant="contained">
          Thử lại
        </Button>
      </Container>
    );
  }

  // Main POS interface
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <POSHeader
            customer={posState.customer}
            cartItemsCount={posState.cart.reduce((sum, item) => sum + item.quantity, 0)}
            cartTotal={posState.total}
            salesSummary={salesSummary || undefined}
            onCustomerSelect={() => {}}
            onBarcodeScanner={() => enqueueSnackbar('Chức năng quét mã vạch đang được phát triển', { variant: 'info' })}
            onSettings={() => navigate('/settings')}
            onSalesHistory={() => navigate('/sales')}
            onDashboard={() => navigate('/dashboard')}
            onRefresh={handleRefresh}
            cashierName="Admin"
            storeName="ComputerPOS Pro"
          />
        </Box>

        {/* Product Search */}
        <Box>
          <ProductSearch
            filters={filters}
            onFiltersChange={setFilters}
            categories={categories}
            onBarcodeScanner={() => {
              enqueueSnackbar('Chức năng quét mã vạch đang được phát triển', { variant: 'info' });
            }}
            onClearFilters={() => {
              setFilters({
                search: '',
                category_id: null,
                in_stock_only: true,
                price_range: { min: 0, max: 1000000 },
                sort_by: 'name',
                sort_order: 'asc'
              });
            }}
            productCount={products.length}
          />
        </Box>

        {/* Main Content Area */}
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
          {/* Products Grid */}
          <Box sx={{ flex: 2 }}>
            <POSProductGrid
              products={products}
              loading={productsLoading}
              searchTerm={filters.search}
              onProductDetails={(product) => {
                navigate(`/products/${product.id}`);
              }}
              onAddToCart={(product) => {
                const existingItem = posState.cart.find(item => item.product.id === product.id);
                const unitPrice = product.price || 0;
                
                if (existingItem) {
                  setPosState(prev => ({
                    ...prev,
                    cart: prev.cart.map(item =>
                      item.product.id === product.id
                        ? { 
                            ...item, 
                            quantity: item.quantity + 1,
                            total_amount: (item.quantity + 1) * item.unit_price
                          }
                        : item
                    )
                  }));
                } else {
                  const newItem: CartItem = {
                    id: `item-${Date.now()}-${product.id}`,
                    product_id: product.id,
                    product,
                    name: product.name,
                    sku: product.sku,
                    price: unitPrice,
                    quantity: 1,
                    unit_price: unitPrice,
                    discount_amount: 0,
                    discount_percentage: 0,
                    tax_amount: 0,
                    total_amount: unitPrice
                  };
                  setPosState(prev => ({
                    ...prev,
                    cart: [...prev.cart, newItem]
                  }));
                }
                enqueueSnackbar(`Đã thêm ${product.name} vào giỏ hàng`, { variant: 'success' });
              }}
            />
          </Box>

          {/* Shopping Cart */}
          <Box sx={{ flex: 1, minWidth: { xs: '100%', lg: '400px' } }}>
            <ShoppingCart
              items={posState.cart}
              customer={posState.customer}
              subtotal={posState.subtotal}
              discountAmount={posState.discount.amount}
              taxAmount={posState.tax.amount}
              total={posState.total}
              onUpdateQuantity={(itemId: string, quantity: number) => {
                setPosState(prev => ({
                  ...prev,
                  cart: prev.cart.map(item =>
                    item.id === itemId
                      ? { ...item, quantity, total_amount: item.unit_price * quantity }
                      : item
                  )
                }));
              }}
              onRemoveItem={(itemId: string) => {
                setPosState(prev => ({
                  ...prev,
                  cart: prev.cart.filter(item => item.id !== itemId)
                }));
              }}
              onClearCart={() => {
                setPosState(prev => ({
                  ...prev,
                  cart: []
                }));
              }}
              onApplyDiscount={() => {
                enqueueSnackbar('Chức năng áp dụng giảm giá đang được phát triển', { variant: 'info' });
              }}
              onEditItem={(item) => {
                enqueueSnackbar(`Chỉnh sửa ${item.name}`, { variant: 'info' });
              }}
              onCheckout={() => setShowPaymentDialog(true)}
              loading={loading}
            />
          </Box>
        </Stack>
      </Stack>

      {/* Payment Dialog */}
      <Dialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Thanh toán</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* Customer Information */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Thông tin khách hàng</Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Số điện thoại"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="Tên khách hàng"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    size="small"
                    fullWidth
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Tóm tắt đơn hàng</Typography>
                <Stack spacing={1}>
                  {posState.cart.map((item) => (
                    <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>{item.name} x{item.quantity}</Typography>
                      <Typography>{(item.unit_price * item.quantity).toLocaleString('vi-VN')}đ</Typography>
                    </Box>
                  ))}
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Tạm tính:</Typography>
                    <Typography>{posState.subtotal.toLocaleString('vi-VN')}đ</Typography>
                  </Box>
                  {posState.discount.amount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'success.main' }}>
                      <Typography>Giảm giá:</Typography>
                      <Typography>-{posState.discount.amount.toLocaleString('vi-VN')}đ</Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Thuế ({posState.tax.rate}%):</Typography>
                    <Typography>{posState.tax.amount.toLocaleString('vi-VN')}đ</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <Typography variant="h6">Tổng cộng:</Typography>
                    <Typography variant="h6">{posState.total.toLocaleString('vi-VN')}đ</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Phương thức thanh toán</Typography>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Chọn phương thức</InputLabel>
                  <Select
                    value={selectedPaymentMethod}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    label="Chọn phương thức"
                  >
                    {paymentMethods.map((method) => (
                      <MenuItem key={method.id} value={method.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{method.icon}</span>
                          <span>{method.name}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <TextField
                  label="Số tiền nhận"
                  value={paymentAmount}
                  onChange={(e) => {
                    setPaymentAmount(e.target.value);
                    const amount = parseFloat(e.target.value) || 0;
                    setPosState(prev => ({
                      ...prev,
                      paid_amount: amount,
                      change_amount: Math.max(0, amount - prev.total)
                    }));
                  }}
                  type="number"
                  size="small"
                  fullWidth
                  sx={{ mb: 2 }}
                  slotProps={{
                    input: {
                      endAdornment: 'đ'
                    }
                  }}
                />
                
                {selectedPaymentMethod !== 'cash' && (
                  <TextField
                    label="Mã tham chiếu"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    size="small"
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                )}
                
                {posState.change_amount > 0 && (
                  <Alert severity="info">
                    Tiền thối: {posState.change_amount.toLocaleString('vi-VN')}đ
      </Alert>
                )}
              </CardContent>
            </Card>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPaymentDialog(false)}>
            Hủy
      </Button>
          <Button 
            variant="contained" 
            onClick={async () => {
              try {
                setLoading(true);
                
                const saleData = {
                  customer: customerName ? {
                    name: customerName,
                    phone: customerPhone
                  } : null,
                  items: posState.cart.map(item => ({
                    product_id: item.product.id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    total_amount: item.total_amount
                  })),
                  subtotal: posState.subtotal,
                  discount_amount: posState.discount.amount,
                  tax_amount: posState.tax.amount,
                  total_amount: posState.total,
                  paid_amount: posState.paid_amount,
                  change_amount: posState.change_amount,
                  payment_method: selectedPaymentMethod,
                  payment_reference: paymentReference,
                  notes: posState.notes
                };
                
                const response = await api.post('/sales', saleData);
                
                if (response.data.success) {
                  enqueueSnackbar('Bán hàng thành công!', { variant: 'success' });
                  
                  // Reset POS state
                  setPosState({
                    cart: [],
                    payments: [],
                    discount: { type: 'none', value: 0, amount: 0 },
                    tax: { rate: 10, amount: 0 },
                    subtotal: 0,
                    total: 0,
                    paid_amount: 0,
                    change_amount: 0,
                    customer: undefined as Customer | undefined,
                    receipt_number: '',
                    notes: '',
                    status: 'draft'
                  });
                  
                  // Reset payment form
                  setCustomerName('');
                  setCustomerPhone('');
                  setPaymentAmount('');
                  setPaymentReference('');
                  
                  setShowPaymentDialog(false);
                  
                  // Refresh data
                  fetchSalesSummary();
                  
                  // Navigate to receipt or sales list
                  if (response.data.data?.id) {
                    navigate(`/sales/${response.data.data.id}`);
                  }
                } else {
                  enqueueSnackbar(response.data.message || 'Lỗi khi tạo đơn hàng', { variant: 'error' });
                }
              } catch (err: any) {
                enqueueSnackbar(err.response?.data?.message || 'Lỗi khi thanh toán', { variant: 'error' });
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading || posState.cart.length === 0 || !selectedPaymentMethod || posState.paid_amount < posState.total}
          >
            {loading ? <CircularProgress size={24} /> : 'Thanh toán'}
      </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default NewSaleFixed;
