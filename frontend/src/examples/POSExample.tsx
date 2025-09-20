/**
 * POS Example - Demonstrating NetworkGuard usage
 * Shows how to integrate NetworkGuard with critical POS operations
 */

import React, { useState } from 'react';
import NetworkGuard, { ConnectionStatus, CriticalOperationStatus } from '../components/NetworkGuard';
import { ShoppingCart, CreditCard, Printer, User } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export const POSExample: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const processPayment = async () => {
    setIsProcessingPayment(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Thanh toán thành công!');
      setCart([]);
    } catch (error) {
      alert('Thanh toán thất bại!');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const printReceipt = async () => {
    // Simulate receipt printing
    alert('Đang in hóa đơn...');
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header with connection status */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">POS Demo - NetworkGuard</h1>
          <ConnectionStatus 
            size="md" 
            showText={true} 
            showDetails={false}
            showRetry={true}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Selection (doesn't require network guard) */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Sản phẩm
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: '1', name: 'Cà phê đen', price: 25000 },
              { id: '2', name: 'Bánh mì', price: 15000 },
              { id: '3', name: 'Nước cam', price: 20000 },
              { id: '4', name: 'Trà sữa', price: 35000 },
            ].map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              >
                <div className="font-medium">{product.name}</div>
                <div className="text-green-600 font-semibold">
                  {product.price.toLocaleString('vi-VN')}đ
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cart and Checkout (requires network guard) */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Giỏ hàng & Thanh toán
          </h2>

          {/* Cart items */}
          <div className="space-y-2 mb-4">
            {cart.length === 0 ? (
              <p className="text-gray-500">Chưa có sản phẩm nào</p>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-gray-500 ml-2">x{item.quantity}</span>
                  </div>
                  <span className="font-semibold">
                    {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Total */}
          {cart.length > 0 && (
            <div className="border-t pt-4 mb-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Tổng cộng:</span>
                <span className="text-green-600">{total.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          )}

          {/* Critical operation status */}
          <CriticalOperationStatus
            operation="thanh toán"
            className="mb-4"
          />

          {/* Payment button with NetworkGuard */}
          <NetworkGuard 
            requiredFor="payment"
            showOverlay={false}
            className="mb-4">
          >
            <button
              onClick={processPayment}
              disabled={cart.length === 0 || isProcessingPayment}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
            >
              <CreditCard className="w-5 h-5 mr-2" />
              {isProcessingPayment ? 'Đang xử lý...' : 'Thanh toán'}
            </button>
          </NetworkGuard>

          {/* Print receipt button with NetworkGuard */}
          <NetworkGuard 
            requiredFor="general"
            showOverlay={false}
          >
            <button
              onClick={printReceipt}
              disabled={cart.length === 0}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
            >
              <Printer className="w-4 h-4 mr-2" />
              In hóa đơn
            </button>
          </NetworkGuard>
        </div>
      </div>

      {/* Inventory Management (requires network guard with overlay) */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Quản lý kho hàng</h2>
        
        <NetworkGuard 
          requiredFor="inventory"
          showOverlay={true}
          className="min-h-[200px]">
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Cập nhật tồn kho</h3>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Mã sản phẩm"
                  className="w-full px-3 py-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="Số lượng"
                  className="w-full px-3 py-2 border rounded"
                />
                <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
                  Cập nhật
                </button>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Chuyển kho</h3>
              <div className="space-y-2">
                <select className="w-full px-3 py-2 border rounded">
                  <option>Từ kho</option>
                  <option>Kho chính</option>
                  <option>Kho phụ</option>
                </select>
                <select className="w-full px-3 py-2 border rounded">
                  <option>Đến kho</option>
                  <option>Kho chính</option>
                  <option>Kho phụ</option>
                </select>
                <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                  Chuyển
                </button>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Báo cáo tồn kho</h3>
              <div className="space-y-2">
                <button className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">
                  Xuất báo cáo
                </button>
                <button className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700">
                  Cảnh báo hết hàng
                </button>
              </div>
            </div>
          </div>
        </NetworkGuard>
      </div>

      {/* Staff Management (requires network guard) */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Quản lý nhân viên
        </h2>
        
        <NetworkGuard 
          requiredFor="general"
          customMessage="Cần kết nối mạng để quản lý thông tin nhân viên và phân ca làm việc."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">Ca làm việc hiện tại</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Ca sáng</span>
                  <span className="text-green-600 font-semibold">Đang mở</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Bắt đầu: 08:00</div>
                  <div>Nhân viên: Nguyễn Văn A</div>
                  <div>Số đơn: 23</div>
                </div>
                <button className="mt-3 w-full bg-red-600 text-white py-2 rounded hover:bg-red-700">
                  Đóng ca
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Phân công nhiệm vụ</h3>
              <div className="space-y-2">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="font-medium">Kiểm kho định kỳ</div>
                  <div className="text-sm text-gray-600">Giao cho: Trần Thị B</div>
                  <div className="text-sm text-gray-600">Hạn: 17:00 hôm nay</div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="font-medium">Cập nhật giá sản phẩm</div>
                  <div className="text-sm text-gray-600">Giao cho: Lê Văn C</div>
                  <div className="text-sm text-gray-600">Hạn: Ngày mai</div>
                </div>
                <button className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
                  Tạo nhiệm vụ mới
                </button>
              </div>
            </div>
          </div>
        </NetworkGuard>
      </div>
    </div>
  );
};

export default POSExample;
