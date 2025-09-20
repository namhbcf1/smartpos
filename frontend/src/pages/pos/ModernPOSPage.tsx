import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../lib/utils';
import apiClient from '../../services/api/client';
import { posApi } from '../../services/api/posApi';
import { useAuth } from '../../hooks/useAuth';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import {
  ShoppingCart,
  CreditCard,
  Printer,
  Receipt,
  DollarSign,
  Trash2,
  Plus,
  Minus,
  Search,
  Filter,
  User,
  Package,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import {
  Card,
  PageHeader,
  Grid,
  Section,
  EmptyState,
  LoadingSpinner
} from '../../components/ui/DesignSystem';
import { Button } from '../../components/ui/ButtonSimplified';
import EnhancedPaymentModal from '../../components/pos/EnhancedPaymentModal';
import EnhancedPOSDashboard from '../../components/pos/EnhancedPOSDashboard';
import EnhancedProductSearch from '../../components/pos/EnhancedProductSearch';
import ThemeProvider from '../../contexts/ThemeContext';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  sku: string;
  name: string;
  name_vi: string;
  unit_price: number;
  stock: number;
  category_id: string;
  brand_id: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  total: number;
}

interface Customer {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  address?: string;
  customer_type: 'individual' | 'business';
  loyalty_points?: number;
  total_spent?: number;
  is_active: boolean;
}

const ModernPOSPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth() as any;
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Debug cart state changes
  useEffect(() => {
    console.log('🛒 Cart state changed:', cart);
  }, [cart]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && cart.length > 0) {
        console.log('⌨️ Enter pressed - opening payment modal');
        setShowPayment(true);
      }
      if (e.key === 'Escape' && showPayment) {
        console.log('⌨️ Escape pressed - closing payment modal');
        setShowPayment(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [cart.length, showPayment]);

  // Load products
  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, []);

  // Search products when query changes
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchProducts(searchQuery);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else if (searchQuery.length === 0) {
      loadProducts();
    }
  }, [searchQuery]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading products...');
      
      // Use posApi instead of direct apiClient for better error handling
      const response = await posApi.getProducts(1, 100);
      console.log('📦 Products API response:', response);
      
      if (response.success && response.data) {
        const productsData = response.data.data || response.data || [];
        console.log('📦 Products data:', productsData);
        
        // Transform API data to match our interface
        const transformedProducts = productsData.map((product: any) => ({
          id: product.id || `temp-${Date.now()}`,
          sku: product.sku || '',
          name: product.name || '',
          name_vi: product.name || '',
          unit_price: product.price || 0,
          stock: product.stock || 0,
          category_id: product.categoryId || '',
          brand_id: product.brandId || ''
        }));
        
        console.log('🔄 Transformed products:', transformedProducts);
        setProducts(transformedProducts);
        
        if (transformedProducts.length > 0) {
          toast.success(`Đã tải ${transformedProducts.length} sản phẩm`);
        } else {
          toast.warning('Không có sản phẩm nào trong hệ thống');
          // Add some sample products for testing
          const sampleProducts = [
            {
              id: 'sample-1',
              sku: 'SP001',
              name: 'Laptop Dell XPS 13',
              name_vi: 'Laptop Dell XPS 13',
              unit_price: 25000000,
              stock: 10,
              category_id: 'laptop',
              brand_id: 'dell'
            },
            {
              id: 'sample-2',
              sku: 'SP002',
              name: 'iPhone 15 Pro',
              name_vi: 'iPhone 15 Pro',
              unit_price: 30000000,
              stock: 5,
              category_id: 'phone',
              brand_id: 'apple'
            },
            {
              id: 'sample-3',
              sku: 'SP003',
              name: 'Samsung Galaxy S24',
              name_vi: 'Samsung Galaxy S24',
              unit_price: 22000000,
              stock: 8,
              category_id: 'phone',
              brand_id: 'samsung'
            }
          ];
          console.log('🔄 Adding sample products for testing');
          setProducts(sampleProducts);
          toast.info('Đã thêm sản phẩm mẫu để test');
        }
      } else {
        console.error('❌ Products API failed:', response);
        toast.error('Không thể tải danh sách sản phẩm: ' + (response.error || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('❌ Error loading products:', error);
      toast.error('Lỗi kết nối: ' + (error.message || 'Không thể tải sản phẩm'));
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await posApi.getCustomers(1, 100);
      if (response.success && response.data) {
        const customersData = response.data.data || response.data || [];
        // Transform API data to match our interface if needed
        const transformedCustomers = customersData.map((customer: any) => ({
          id: customer.id || '',
          full_name: customer.name || customer.full_name || '',
          phone: customer.phone || '',
          email: customer.email || '',
          address: customer.address || '',
          customer_type: customer.customer_type || 'individual',
          loyalty_points: customer.loyalty_points || 0,
          total_spent: customer.total_spent || 0,
          is_active: customer.is_active !== false
        }));
        setCustomers(transformedCustomers);
        toast.success(`Đã tải ${transformedCustomers.length} khách hàng`);
      }
    } catch (error: any) {
      console.error('Error loading customers:', error);
      toast.error('Lỗi kết nối: ' + (error.message || 'Không thể tải khách hàng'));
    }
  };

  // Filter products
  const filteredProducts = (products || []).filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Search products with API
  const searchProducts = async (query: string) => {
    if (query.length < 2) return;
    
    try {
      setLoading(true);
      const response = await posApi.searchProducts(query, 20);
      if (response.success && response.data) {
        const searchResults = (response.data.data || response.data || []).map((product: any) => ({
          id: product.id || `temp-${Date.now()}`,
          sku: product.sku || '',
          name: product.name || '',
          name_vi: product.name || '',
          unit_price: product.price || 0,
          stock: product.stock || 0,
          category_id: product.categoryId || '',
          brand_id: product.brandId || ''
        }));
        setProducts(searchResults);
        toast.success(`Tìm thấy ${searchResults.length} sản phẩm`);
      }
    } catch (error: any) {
      console.error('Error searching products:', error);
      toast.error('Lỗi tìm kiếm: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Cart functions
  const addToCart = (product: Product, event?: React.MouseEvent) => {
    // Prevent event bubbling and default behavior
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    console.log('🛒 Adding product to cart:', product);
    console.log('🛒 Current cart:', cart);

    if (!product || !product.id) {
      console.error('❌ Invalid product:', product);
      toast.error('Lỗi: Thông tin sản phẩm không hợp lệ');
      return;
    }

    if (product.stock <= 0) {
      toast.error('Sản phẩm đã hết hàng');
      return;
    }

    const existingItem = cart.find(item => item.product.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.error('Không đủ hàng trong kho');
        return;
      }
      console.log('🛒 Updating existing item quantity');
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      console.log('🛒 Adding new item to cart');
      const newItem = {
        product,
        quantity: 1,
        total: product.unit_price
      };
      console.log('🛒 New item:', newItem);
      setCart([...cart, newItem]);
      toast.success(`✅ Đã thêm ${product.name} vào giỏ hàng`);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(cart.map(item => 
      item.product.id === productId 
        ? { ...item, quantity: newQuantity, total: item.product.unit_price * newQuantity }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
  };

  // Update stock after sale
  const updateStockAfterSale = async () => {
    try {
      for (const item of cart) {
        const newStock = item.product.stock - item.quantity;
        await posApi.updateProductStock(item.product.id, newStock);
      }
      toast.success('Đã cập nhật tồn kho');
    } catch (error: any) {
      console.error('Error updating stock:', error);
      toast.error('Lỗi cập nhật tồn kho: ' + (error.message || 'Unknown error'));
    }
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  // Process payment with Enhanced Payment Modal
  const handlePayment = async (paymentData: any) => {
    if (cart.length === 0) {
      toast.error('Giỏ hàng trống');
      return;
    }

    try {
      setIsProcessingPayment(true);

      const orderData = {
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.unit_price
        })),
        payments: [{
          method: paymentData.payment.method,
          amount: paymentData.payment.amountReceived,
          reference: paymentData.payment.referenceCode || `${paymentData.payment.method.toUpperCase()}-${Date.now()}`,
          change: paymentData.payment.change,
          notes: paymentData.payment.notes
        }],
        customer_id: paymentData.customer.id,
        customer_phone: paymentData.customer.phone,
        customer_name: paymentData.customer.name,
        subtotal: paymentData.totals.subtotal,
        tax: paymentData.totals.tax,
        total: paymentData.totals.total,
        discount: 0
      };

      console.log('📦 Processing order with data:', orderData);

      const response = await posApi.createOrder(orderData);
      if (response.success) {
        toast.success(`Thanh toán thành công bằng ${getPaymentMethodName(paymentData.payment.method)}!`);
        clearCart();
        setShowPayment(false);

        // Print receipt or show success message
        console.log('✅ Order created:', response.data);

        // Update stock quantities
        await updateStockAfterSale();

        // Reload products to reflect new stock
        await loadProducts();
      } else {
        toast.error('Lỗi khi tạo đơn hàng: ' + (response.error || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('❌ Error processing payment:', error);
      toast.error('Lỗi khi xử lý thanh toán: ' + (error.message || 'Unknown error'));
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Helper function to get payment method name
  const getPaymentMethodName = (method: string) => {
    const methods: Record<string, string> = {
      cash: 'tiền mặt',
      bank_transfer: 'chuyển khoản',
      credit_card: 'thẻ tín dụng',
      momo: 'MoMo',
      zalopay: 'ZaloPay'
    };
    return methods[method] || method;
  };

  // Convert cart items to payment items format
  const getPaymentItems = () => {
    return cart.map(item => ({
      id: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.unit_price,
      total: item.total
    }));
  };

  if (isMobile) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <PageHeader
              title="POS Mobile"
              subtitle="Bán hàng di động"
            />

            {/* Mobile POS Layout */}
            <div className="space-y-4">
              {/* Enhanced Mobile Search */}
              <div className="mb-4">
                <EnhancedProductSearch
                  products={convertProductsForSearch(products)}
                  onProductSelect={(product) => {
                    const originalProduct = products.find(p => p.id === product.id);
                    if (originalProduct) {
                      addToCart(originalProduct);
                    }
                  }}
                  onScanBarcode={() => {
                    toast.info('Tính năng quét mã vạch đang phát triển');
                  }}
                  recentProducts={getRecentProducts()}
                  popularProducts={getPopularProducts()}
                  loading={loading}
                  placeholder="Tìm sản phẩm..."
                  showFilters={false}
                />
              </div>

              {/* Mobile Dashboard Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Card className="p-4 text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{cart.length}</div>
                  <div className="text-sm text-blue-700">Sản phẩm trong giỏ</div>
                </Card>
                <Card className="p-4 text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(total)}</div>
                  <div className="text-sm text-green-700">Tổng tiền</div>
                </Card>
              </div>

              {/* Cart Summary - Collapsible on Mobile */}
              {cart.length > 0 && (
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Giỏ hàng ({cart.length})</h3>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={clearCart}>
                        <Trash2 className="w-4 h-4 mr-1" />
                        Xóa
                      </Button>
                      <Button
                        className="px-6" onClick={() => setShowPayment(true)}
                        disabled={loading}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Thanh toán
                      </Button>
                    </div>
                  </div>

                  {/* Compact Cart Items for Mobile */}
                  <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm truncate">{item.product.name}</h4>
                          <p className="text-xs text-gray-600">{formatCurrency(item.product.unit_price)} × {item.quantity}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-8 h-8 p-0" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-8 h-8 p-0" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="text-right ml-2">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(item.total)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Compact Totals */}
                  <div className="border-t pt-3 space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Tạm tính:</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Thuế:</span>
                      <span className="font-medium">{formatCurrency(tax)}</span>
                    </div>
                    <div className="flex justify-between items-center text-base font-bold border-t pt-2">
                      <span>Tổng:</span>
                      <span className="text-blue-600">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Products Grid - Optimized for Mobile */}
              <Section title="Sản phẩm">
                {loading ? (
                  <Card>
                    <LoadingSpinner className="py-8" />
                  </Card>
                ) : filteredProducts.length > 0 ? (
                  <Grid cols={2} gap="sm">
                    {filteredProducts.map((product) => (
                      <Card
                        key={product.id}
                        hover
                        className="cursor-pointer transform transition-all duration-200 hover:scale-102 active:scale-95 border-2 hover:border-blue-300 select-none" onClick={(e) => addToCart(product, e)}
                        style={{ userSelect: 'none' }}
                      >
                        <div className="text-center p-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mx-auto mb-3 flex items-center justify-center">
                            <Package className="w-6 h-6 text-white" />
                          </div>
                          <h4 className="font-medium text-gray-900 text-sm mb-1 leading-tight">{product.name}</h4>
                          <p className="text-xs text-gray-600 mb-2">SKU: {product.sku}</p>
                          <p className="font-bold text-blue-600 text-sm mb-2">{formatCurrency(product.unit_price)}</p>
                          <div className="text-xs">
                            <span className={`px-2 py-1 rounded-full ${product.stock > 10 ? 'bg-green-100 text-green-800' : product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                              Còn: {product.stock}
                            </span>
                          </div>
                          {/* Mobile touch feedback */}
                          <div className="mt-2 text-xs text-blue-600 font-medium opacity-75">
                            📱 Chạm để thêm
                          </div>
                        </div>
                      </Card>
                    ))}
                  </Grid>
                ) : (
                  <EmptyState
                    icon={<Package className="w-12 h-12" />}
                    title="Không tìm thấy sản phẩm"
                    description="Thử thay đổi từ khóa tìm kiếm"
                  />
                )}
              </Section>
            </div>
          </div>
        </div>

        {/* Enhanced Payment Modal for Mobile */}
        <EnhancedPaymentModal
          open={showPayment}
          onClose={() => setShowPayment(false)}
          onPayment={handlePayment}
          items={getPaymentItems()}
          subtotal={subtotal}
          tax={tax}
          total={total}
          customers={customers}
          isProcessing={isProcessingPayment}
        />
      </ThemeProvider>
    );
  }

  // Convert products to Enhanced Search format
  const convertProductsForSearch = (products: Product[]) => {
    return products.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.sku, // Use SKU as barcode for now
      price: product.unit_price,
      stock: product.stock,
      category: product.category_id || 'Uncategorized',
      brand: product.brand_id || 'Unknown',
      isPopular: product.stock > 5, // Mark products with good stock as popular
      salesCount: Math.floor(Math.random() * 100) // Mock sales count
    }));
  };

  // Get recent products (last few items from cart)
  const getRecentProducts = () => {
    const uniqueProducts = Array.from(new Set(cart.map(item => item.product.id)))
      .map(id => cart.find(item => item.product.id === id)?.product)
      .filter(Boolean) as Product[];

    return convertProductsForSearch(uniqueProducts.slice(-3));
  };

  // Get popular products (products with high stock)
  const getPopularProducts = () => {
    const popularProducts = products
      .filter(p => p.stock > 5)
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 3);

    return convertProductsForSearch(popularProducts);
  };

  // Desktop Layout with Material UI Theme
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PageHeader
            title="Hệ thống POS"
            subtitle="Bán hàng và quản lý đơn hàng"
            actions={
              <div className="flex items-center space-x-3">
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  <Clock className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </div>
            }
          />

          {/* Enhanced POS Dashboard */}
          <EnhancedPOSDashboard
            totalSales={total}
            totalOrders={cart.length}
            totalProducts={products.length}
            lowStockProducts={products.filter(p => p.stock < 5).length}
            recentTransactions={[]} // Mock for now
            topProducts={getPopularProducts()}
            onQuickAction={(action) => {
              console.log('Quick action:', action);
              if (action === 'new-sale') {
                // Focus on product search
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Products Section - 2/3 width */}
            <div className="lg:col-span-2">
              {/* Enhanced Product Search */}
              <div className="mb-6">
                <EnhancedProductSearch
                  products={convertProductsForSearch(products)}
                  onProductSelect={(product) => {
                    // Convert back to our Product format
                    const originalProduct = products.find(p => p.id === product.id);
                    if (originalProduct) {
                      addToCart(originalProduct);
                    }
                  }}
                  onScanBarcode={() => {
                    toast.info('Tính năng quét mã vạch đang phát triển');
                  }}
                  recentProducts={getRecentProducts()}
                  popularProducts={getPopularProducts()}
                  loading={loading}
                />
              </div>

              {/* Products Grid */}
              <Section title="Sản phẩm">
                {loading ? (
                  <Card>
                    <LoadingSpinner className="py-12" />
                  </Card>
                ) : filteredProducts.length > 0 ? (
                  <Grid cols={4} gap="md">
                    {filteredProducts.map((product) => (
                      <Card
                        key={product.id}
                        hover
                        className="cursor-pointer group transform transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95 border-2 hover:border-blue-300 select-none" onClick={(e) => addToCart(product, e)}
                        style={{ userSelect: 'none' }}
                      >
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Package className="w-8 h-8 text-white" />
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                            {product.name}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">SKU: {product.sku}</p>
                          <p className="text-lg font-bold text-blue-600 mb-2">
                            {formatCurrency(product.unit_price)}
                          </p>
                          <div className="flex items-center justify-center space-x-2 text-sm mb-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${product.stock > 10 ? 'bg-green-100 text-green-800' : product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                              Còn: {product.stock}
                            </span>
                          </div>
                          {/* Add to cart indicator */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium">
                              🛒 Nhấn để thêm vào giỏ hàng
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </Grid>
                ) : (
                  <EmptyState
                    icon={<Package className="w-16 h-16" />}
                    title="Không tìm thấy sản phẩm"
                    description="Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc"
                  />
                )}
              </Section>
            </div>

          {/* Cart Section - 1/3 width */}
          <div>
            <Card className="sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Giỏ hàng ({cart.length})
                </h3>
                {cart.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearCart}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Xóa tất cả
                  </Button>
                )}
              </div>

              {/* Customer Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Khách hàng
                </label>
                <select
                  value={selectedCustomer?.id || ''}
                  onChange={(e) => {
                    const customerId = e.target.value;
                    const customer = customers.find(c => c.id === customerId);
                    setSelectedCustomer(customer || null);
                    console.log('👤 Selected customer:', customer);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                >
                  <option value="">Chọn khách hàng (tùy chọn)</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.full_name} - {customer.phone}
                    </option>
                  ))}
                </select>
              </div>

              {cart.length === 0 ? (
                <EmptyState
                  icon={<ShoppingCart className="w-12 h-12" />}
                  title="Giỏ hàng trống"
                  description="Thêm sản phẩm để bắt đầu bán hàng"
                />
              ) : (
                <div className="space-y-4">
                  {/* Cart Items */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">{item.product.name}</h4>
                          <p className="text-xs text-gray-600">{formatCurrency(item.product.unit_price)}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(item.total)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tạm tính:</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Thuế (10%):</span>
                      <span className="font-medium">{formatCurrency(tax)}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                      <span>Tổng cộng:</span>
                      <span className="text-blue-600">{formatCurrency(total)}</span>
                    </div>
                  </div>

                  {/* Payment Button */}
                  <Button 
                    className="w-full mt-6"> 
                    size="lg"
                    onClick={() => {
                      console.log('💳 Payment button clicked');
                      setShowPayment(true);
                    }}
                    disabled={loading}
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    Thanh toán {formatCurrency(total)}
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Enhanced Payment Modal */}
      <EnhancedPaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        onPayment={handlePayment}
        items={getPaymentItems()}
        subtotal={subtotal}
        tax={tax}
        total={total}
        customers={customers}
        isProcessing={isProcessingPayment}
      />
    </div>
    </ThemeProvider>
  );
};

export default ModernPOSPage;
