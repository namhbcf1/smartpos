import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  QrCode,
  Mic,
  Search,
  Plus,
  Minus,
  CreditCard,
  ArrowLeft,
  X,
  CheckCircle
} from 'lucide-react';
import { Button } from '../../components/ui/ButtonSimplified';
import { Card, CardContent } from '../../components/ui/Card';
import { formatCurrency } from '../../lib/utils';
import apiClient from '../../services/api/client';

interface Product {
  id: string;
  sku: string;
  name: string;
  name_vi: string;
  unit_price: number;
  stock: number;
  image_url?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  total: number;
}

export default function MobilePOSPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  // Load products
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/products');
      const productsData = response.data?.data || response.data || [];
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(product =>
    product.name_vi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add to cart
  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    const priceInVND = (product.unit_price || 0) / 100;

    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * priceInVND }
          : item
      ));
    } else {
      setCart([...cart, {
        product,
        quantity: 1,
        total: priceInVND
      }]);
    }
  };

  // Remove from cart
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  // Update quantity
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item =>
      item.product.id === productId
        ? { ...item, quantity: newQuantity, total: newQuantity * ((item.product.unit_price || 0) / 100) }
        : item
    ));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const vatAmount = subtotal * 0.1;
  const total = subtotal + vatAmount;

  // Handle checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setIsProcessing(true);
    try {
      const saleData = {
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.unit_price,
        })),
        payment_method: 'cash',
        payment_status: 'paid',
      };

      const response = await apiClient.post('/sales/enhanced', saleData);
      
      if (response.data.success) {
        setCart([]);
        setShowCart(false);
        setShowPayment(false);
        // Show success message
        alert('Thanh toán thành công!');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Lỗi thanh toán, vui lòng thử lại');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-bold text-gray-900">POS Mobile</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowCart(true)}
              className="relative">
            >
              <ShoppingCart className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 bg-white border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm sản phẩm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Đang tải sản phẩm...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => addToCart(product)}
                >
                  <CardContent className="p-3">
                    <div className="text-xs text-gray-500 mb-1">{product.sku}</div>
                    <h3 className="font-medium text-sm text-gray-900 mb-2 line-clamp-2">
                      {product.name_vi}
                    </h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-blue-600">
                        {formatCurrency(product.unit_price / 100)}
                      </span>
                      <span className="text-xs text-gray-500">
                        Kho: {product.stock}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowCart(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}
            >
              {/* Cart Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-bold">Giỏ hàng ({cart.length})</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCart(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">Giỏ hàng trống</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.product.name_vi}</h4>
                          <p className="text-xs text-gray-500">{formatCurrency(item.product.unit_price / 100)}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-8 h-8">
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-8 h-8">
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="p-4 border-t bg-white">
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span>Tạm tính:</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT (10%):</span>
                      <span>{formatCurrency(vatAmount)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Tổng cộng:</span>
                      <span className="text-blue-600">{formatCurrency(total)}</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => setShowPayment(true)}
                    className="w-full">
                    size="lg"
                    disabled={isProcessing}
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    {isProcessing ? 'Đang xử lý...' : 'Thanh toán'}
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowPayment(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">Chọn phương thức thanh toán</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start" onClick={handleCheckout}
                >
                  💰 Tiền mặt
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start" onClick={handleCheckout}
                >
                  💳 Thẻ ngân hàng
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start" onClick={handleCheckout}
                >
                  📱 Ví MoMo
                </Button>
              </div>
              <div className="flex space-x-3 mt-6">
                <Button
                  variant="ghost"
                  onClick={() => setShowPayment(false)}
                  className="flex-1">
                >
                  Hủy
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
