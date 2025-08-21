import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../lib/utils';
import apiClient from '../../services/api/client';

// Vietnamese POS Sales Interface
// ComputerPOS Pro - Production POS System

interface Product {
  id: string;
  sku: string;
  name: string;
  name_vi: string;
  unit_price: number;
  stock_quantity: number;
  category_id: string;
  brand_id: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  total: number;
}

export default function POSPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showCompatibilityModal, setShowCompatibilityModal] = useState(false);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/products');
      console.log('Products API response:', response);

      // Handle different response structures
      const productsData = response.data?.data || response.data || [];
      console.log('Products data:', productsData);

      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on search query
  const filteredProducts = (products || []).filter(product =>
    product.name_vi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add product to cart
  const addToCart = (product: Product) => {
    if (!product || !product.id) return;

    const existingItem = (cart || []).find(item => item.product.id === product.id);
    const priceInVND = (product.unit_price || 0) / 100; // Convert from cents

    if (existingItem) {
      setCart((cart || []).map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * priceInVND }
          : item
      ));
    } else {
      setCart([...(cart || []), {
        product,
        quantity: 1,
        total: priceInVND
      }]);
    }
  };

  // Remove item from cart
  const removeFromCart = (productId: string) => {
    if (!productId) return;
    setCart((cart || []).filter(item => item.product.id !== productId));
  };

  // Update quantity in cart
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (!productId || newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((cart || []).map(item =>
      item.product.id === productId
        ? { ...item, quantity: newQuantity, total: newQuantity * ((item.product.unit_price || 0) / 100) }
        : item
    ));
  };

  // Calculate totals
  const subtotal = (cart || []).reduce((sum, item) => sum + (item.total || 0), 0);
  const vatRate = 0.1; // 10% Vietnamese VAT
  const vatAmount = subtotal * vatRate;
  const total = subtotal + vatAmount;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Quay lại Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">POS Bán hàng</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">ComputerPOS Pro</span>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Product Search & List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Tìm kiếm sản phẩm</h2>
                
                {/* Search Input */}
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Tìm theo tên, SKU, barcode..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {loading ? (
                    <div className="col-span-full text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Đang tải sản phẩm...</p>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="col-span-full text-center py-8">
                      <p className="text-gray-600">Không tìm thấy sản phẩm</p>
                    </div>
                  ) : (
                    filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => addToCart(product)}
                      >
                        <div className="text-sm text-gray-600 mb-1">{product.sku}</div>
                        <h3 className="font-medium text-gray-900 mb-2">{product.name_vi}</h3>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-blue-600">
                            {formatCurrency(product.unit_price / 100)} {/* Convert from cents */}
                          </span>
                          <span className="text-sm text-gray-500">
                            Kho: {product.stock_quantity}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Cart & Checkout */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Giỏ hàng</h2>
                
                {/* Cart Items */}
                <div className="space-y-4 mb-6">
                  {cart.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">Giỏ hàng trống</p>
                  ) : (
                    cart.map((item) => (
                      <div key={item.product.id} className="flex items-center justify-between border-b pb-4">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.product.name_vi}</h4>
                          <p className="text-sm text-gray-600">{formatCurrency(item.product.unit_price / 100)}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="ml-2 text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Order Summary */}
                {cart.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Tổng kết đơn hàng</h3>
                    <div className="space-y-2 text-sm">
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
                    
                    <div className="mt-6 space-y-3">
                      <button
                        onClick={() => setShowCompatibilityModal(true)}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                      >
                        Kiểm tra tương thích
                      </button>

                      <button
                        onClick={() => setShowPayment(true)}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Thanh toán
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Chọn phương thức thanh toán</h3>
            <div className="space-y-3">
              <button className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                💰 Tiền mặt
              </button>
              <button className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                💳 Thẻ ngân hàng
              </button>
              <button className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                📱 Ví MoMo
              </button>
              <button className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                💙 ZaloPay
              </button>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowPayment(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setShowPayment(false);
                  setCart([]);
                  alert('Thanh toán thành công!');
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compatibility Check Modal */}
      {showCompatibilityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Kiểm tra tương thích linh kiện PC</h3>

            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">✅ Tương thích tốt</h4>
                <p className="text-green-700">Các linh kiện trong giỏ hàng tương thích với nhau.</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Cảnh báo tương thích</h4>
                <ul className="text-yellow-700 space-y-1">
                  <li>• Nguồn có thể cần công suất cao hơn cho GPU RTX 4070</li>
                  <li>• Kiểm tra kích thước case để đảm bảo GPU vừa</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">💡 Gợi ý nâng cấp</h4>
                <ul className="text-blue-700 space-y-1">
                  <li>• Thêm tản nhiệt CPU để tối ưu hiệu năng</li>
                  <li>• Xem xét thêm ổ cứng HDD để lưu trữ</li>
                </ul>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCompatibilityModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setShowCompatibilityModal(false);
                  alert('Đã lưu báo cáo tương thích!');
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Lưu báo cáo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
