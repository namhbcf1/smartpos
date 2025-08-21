// Vietnamese Computer Hardware POS - New Sale Interface
// ComputerPOS Pro - Production DaisyUI Implementation

import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  FiSearch, 
  FiShoppingCart, 
  FiCreditCard, 
  FiUser, 
  FiPlus, 
  FiMinus, 
  FiTrash2, 
  FiShield,
  FiCheck,
  FiAlertTriangle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import apiClient from '../services/api';
import { formatVND, calculateTotalWithVAT, generateInvoiceNumber, PAYMENT_METHODS } from '../utils/currency';
import { checkPCCompatibility, ComponentSpecs, COMPONENT_CATEGORIES_VI } from '../utils/compatibility';

// Vietnamese POS Types
interface Product {
  id: string;
  name: string;
  name_vi?: string;
  sku: string;
  barcode?: string;
  unit_price: number; // VND cents
  cost_price: number; // VND cents
  stock_quantity: number;
  category_id?: string;
  category_name?: string;
  brand_id?: string;
  brand_name?: string;
  specifications?: Record<string, any>;
  compatibility_info?: Record<string, any>;
  warranty_months?: number;
  is_active: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number; // VND cents
  discount_amount: number; // VND cents
  line_total: number; // VND cents
  serial_numbers?: string[];
  warranty_months?: number;
  notes?: string;
}

interface Customer {
  id?: string;
  full_name: string;
  phone?: string;
  email?: string;
  address?: string;
  customer_type: 'individual' | 'business';
  tax_number?: string;
  loyalty_points: number;
  total_spent: number; // VND cents
}

const NewSale: React.FC = () => {
  const queryClient = useQueryClient();

  // Vietnamese POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer>({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    customer_type: 'individual',
    loyalty_points: 0,
    total_spent: 0
  });
  const [paymentMethod, setPaymentMethod] = useState<keyof typeof PAYMENT_METHODS>('cash');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [globalDiscount, setGlobalDiscount] = useState<number>(0); // VND cents
  const [notes, setNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [saleId, setSaleId] = useState<string | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCompatibilityCheck, setShowCompatibilityCheck] = useState(false);
  const [compatibilityResult, setCompatibilityResult] = useState<any>(null);

  // Fetch products for Vietnamese POS search
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', 'search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      try {
        const response = await apiClient.get('/api/v1/products', {
          params: {
            search: searchTerm,
            is_active: true,
            limit: 20
          }
        });
        return response.data?.data || [];
      } catch (error) {
        console.error('Product search error:', error);
        toast.error('Lỗi tìm kiếm sản phẩm');
        return [];
      }
    },
    enabled: searchTerm.length >= 2
  });

  // Calculate Vietnamese POS totals with VAT
  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.line_total, 0);
    const discountAmount = globalDiscount;
    const { vat, total } = calculateTotalWithVAT(subtotal - discountAmount);

    return {
      subtotal,
      discountAmount,
      taxAmount: vat,
      total
    };
  }, [cart, globalDiscount]);

  // Add product to Vietnamese POS cart
  const addToCart = () => {
    if (!selectedProduct || quantity <= 0) {
      toast.error('Vui lòng chọn sản phẩm và số lượng hợp lệ');
      return;
    }

    // Check stock availability
    if (quantity > selectedProduct.stock_quantity) {
      toast.error(`Không đủ hàng trong kho. Còn lại: ${selectedProduct.stock_quantity}`);
      return;
    }

    const existingItemIndex = cart.findIndex(item => item.product.id === selectedProduct.id);
    const lineTotal = selectedProduct.unit_price * quantity;

    if (existingItemIndex >= 0) {
      // Update existing item
      const newCart = [...cart];
      const newQuantity = newCart[existingItemIndex].quantity + quantity;

      if (newQuantity > selectedProduct.stock_quantity) {
        toast.error('Không đủ hàng tồn kho');
        return;
      }

      newCart[existingItemIndex].quantity = newQuantity;
      newCart[existingItemIndex].line_total = newQuantity * selectedProduct.unit_price;
      setCart(newCart);
    } else {
      // Add new item
      const newItem: CartItem = {
        product: selectedProduct,
        quantity,
        unit_price: selectedProduct.unit_price,
        discount_amount: 0,
        line_total: lineTotal,
        warranty_months: selectedProduct.warranty_months || 12
      };
      setCart([...cart, newItem]);
    }

    // Reset form
    setSelectedProduct(null);
    setQuantity(1);
    setSearchTerm('');
    toast.success(`Đã thêm ${selectedProduct.name_vi || selectedProduct.name} vào giỏ hàng`);
  };

  // Update cart item quantity
  const updateCartItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const newCart = cart.map(item => {
      if (item.product.id === productId) {
        if (newQuantity > item.product.stock_quantity) {
          toast.error('Không đủ hàng tồn kho');
          return item;
        }
        return {
          ...item,
          quantity: newQuantity,
          line_total: newQuantity * item.unit_price - item.discount_amount
        };
      }
      return item;
    });
    setCart(newCart);
  };

  // Remove from cart
  const removeFromCart = (productId: string) => {
    const removedItem = cart.find(item => item.product.id === productId);
    setCart(cart.filter(item => item.product.id !== productId));
    if (removedItem) {
      toast.success(`Đã xóa ${removedItem.product.name_vi || removedItem.product.name} khỏi giỏ hàng`);
    }
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setCustomer({
      full_name: '',
      phone: '',
      email: '',
      address: '',
      customer_type: 'individual',
      loyalty_points: 0,
      total_spent: 0
    });
    setGlobalDiscount(0);
    setNotes('');
    setSaleId(null);
    toast('Đã xóa tất cả sản phẩm khỏi giỏ hàng', { icon: 'ℹ️' });
  };

  // Check PC compatibility
  const checkCompatibility = () => {
    const components: ComponentSpecs[] = cart.map(item => ({
      id: item.product.id,
      name: item.product.name_vi || item.product.name,
      category: (item.product.category_name?.toUpperCase() as any) || 'ACCESSORIES',
      specifications: item.product.specifications || {},
      compatibility_info: item.product.compatibility_info || {}
    }));

    const result = checkPCCompatibility(components);
    setCompatibilityResult(result);
    setShowCompatibilityCheck(true);

    if (!result.isCompatible) {
      toast.error(`Phát hiện ${result.issues.filter(i => i.severity === 'error').length} vấn đề tương thích`);
    } else {
      toast.success('Tất cả linh kiện tương thích với nhau');
    }
  };

  // Payment handlers
  const handleStartPayment = () => {
    if (cart.length === 0) {
      toast.error('Giỏ hàng trống');
      return;
    }

    // Check if cart has computer components - suggest compatibility check
    const hasComputerComponents = cart.some(item =>
      ['CPU', 'GPU', 'RAM', 'MOTHERBOARD', 'PSU'].includes(
        item.product.category_name?.toUpperCase() || ''
      )
    );

    if (hasComputerComponents && !compatibilityResult) {
      toast('Khuyến nghị kiểm tra tương thích linh kiện trước khi thanh toán', { icon: 'ℹ️' });
    }

    setShowPaymentModal(true);
  };

  return (
    <div className="min-h-screen bg-base-200 p-4">
      {/* Header */}
      <div className="bg-base-100 rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">
            <FiShoppingCart className="inline mr-2" />
            Bán hàng mới
          </h1>
          <div className="flex gap-2">
            <button 
              className="btn btn-outline btn-sm"
              onClick={checkCompatibility}
              disabled={cart.length === 0}
            >
              <FiShield className="mr-1" />
              Kiểm tra tương thích
            </button>
            <button 
              className="btn btn-error btn-sm"
              onClick={clearCart}
              disabled={cart.length === 0}
            >
              <FiTrash2 className="mr-1" />
              Xóa tất cả
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Product Search & Cart */}
        <div className="lg:col-span-2 space-y-4">
          {/* Product Search */}
          <div className="bg-base-100 rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-3">Tìm kiếm sản phẩm</h2>
            <div className="form-control">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Tìm theo tên, SKU, barcode..."
                  className="input input-bordered flex-1"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="btn btn-square">
                  <FiSearch />
                </button>
              </div>
            </div>

            {/* Product Results */}
            {isLoadingProducts && (
              <div className="flex justify-center py-4">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            )}

            {products.length > 0 && (
              <div className="mt-4 max-h-60 overflow-y-auto">
                {products.map((product: Product) => (
                  <div
                    key={product.id}
                    className={`p-3 border rounded-lg mb-2 cursor-pointer transition-colors ${
                      selectedProduct?.id === product.id
                        ? 'border-primary bg-primary/10'
                        : 'border-base-300 hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium">
                          {product.name_vi || product.name}
                        </h3>
                        <p className="text-sm text-base-content/70">
                          SKU: {product.sku} | Tồn kho: {product.stock_quantity}
                        </p>
                        {product.category_name && (
                          <span className="badge badge-outline badge-sm">
                            {COMPONENT_CATEGORIES_VI[product.category_name.toUpperCase() as keyof typeof COMPONENT_CATEGORIES_VI] || product.category_name}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">
                          {formatVND(product.unit_price)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add to Cart */}
            {selectedProduct && (
              <div className="mt-4 p-4 bg-base-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Số lượng</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={selectedProduct.stock_quantity}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="input input-bordered w-20"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-base-content/70">Sản phẩm đã chọn:</p>
                    <p className="font-medium">{selectedProduct.name_vi || selectedProduct.name}</p>
                    <p className="text-primary font-bold">{formatVND(selectedProduct.unit_price * quantity)}</p>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={addToCart}
                    disabled={quantity <= 0 || quantity > selectedProduct.stock_quantity}
                  >
                    <FiPlus className="mr-1" />
                    Thêm vào giỏ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cart & Summary */}
        <div className="space-y-4">
          {/* Cart Items */}
          <div className="bg-base-100 rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-3">
              Giỏ hàng ({cart.length} sản phẩm)
            </h2>

            {cart.length === 0 ? (
              <div className="text-center py-8 text-base-content/50">
                <FiShoppingCart className="mx-auto text-4xl mb-2" />
                <p>Giỏ hàng trống</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.product.id} className="border border-base-300 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">
                          {item.product.name_vi || item.product.name}
                        </h4>
                        <p className="text-xs text-base-content/70">
                          {formatVND(item.unit_price)} x {item.quantity}
                        </p>
                      </div>
                      <button
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          className="btn btn-xs btn-outline"
                          onClick={() => updateCartItemQuantity(item.product.id, item.quantity - 1)}
                        >
                          <FiMinus />
                        </button>
                        <span className="px-2 text-sm font-medium">{item.quantity}</span>
                        <button
                          className="btn btn-xs btn-outline"
                          onClick={() => updateCartItemQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock_quantity}
                        >
                          <FiPlus />
                        </button>
                      </div>
                      <p className="font-bold text-primary">
                        {formatVND(item.line_total)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary */}
          {cart.length > 0 && (
            <div className="bg-base-100 rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-3">Tổng kết đơn hàng</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tạm tính:</span>
                  <span>{formatVND(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Giảm giá:</span>
                  <span>-{formatVND(totals.discountAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (10%):</span>
                  <span>{formatVND(totals.taxAmount)}</span>
                </div>
                <div className="divider my-2"></div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng cộng:</span>
                  <span className="text-primary">{formatVND(totals.total)}</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <button
                  className="btn btn-primary w-full"
                  onClick={handleStartPayment}
                  disabled={cart.length === 0 || isProcessing}
                >
                  {isProcessing ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <FiCreditCard className="mr-2" />
                  )}
                  Thanh toán
                </button>

                <button
                  className="btn btn-outline w-full"
                  onClick={() => setShowCustomerModal(true)}
                >
                  <FiUser className="mr-2" />
                  {customer.full_name ? customer.full_name : 'Thêm khách hàng'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Process Vietnamese payment */}
      {React.useMemo(() => {
        const processPayment = async (method: keyof typeof PAYMENT_METHODS) => {
          if (cart.length === 0) {
            toast.error('Giỏ hàng trống');
            return;
          }

          setIsProcessing(true);
          try {
            const saleData = {
              sale_number: generateInvoiceNumber(),
              customer_id: customer.id,
              cashier_id: 'current-user', // Will be set by backend
              status: 'completed',
              subtotal_amount: totals.subtotal,
              tax_amount: totals.taxAmount,
              discount_amount: totals.discountAmount,
              total_amount: totals.total,
              payment_method: method,
              payment_status: 'paid',
              notes: notes,
              items: cart
            };

            const response = await apiClient.post('/api/v1/sales', saleData);

            if (response.data.success) {
              const saleId = response.data.data.id;
              setSaleId(saleId);

              toast.success(`Thanh toán thành công! Mã hóa đơn: ${saleData.sale_number}`);

              // Print invoice option
              if (window.confirm('Bạn có muốn in hóa đơn không?')) {
                await printInvoice(saleId);
              }

              // Clear cart after successful payment
              clearCart();
              setShowPaymentModal(false);
            } else {
              throw new Error(response.data.message || 'Thanh toán thất bại');
            }
          } catch (error: any) {
            console.error('Payment error:', error);
            toast.error(error.response?.data?.message || 'Lỗi thanh toán');
          } finally {
            setIsProcessing(false);
          }
        };

        // Print Vietnamese invoice
        const printInvoice = async (saleId: string) => {
          try {
            const response = await apiClient.get(`/api/v1/sales/${saleId}/invoice`, {
              responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);

            // Open in new window for printing
            const printWindow = window.open(url, '_blank');
            if (printWindow) {
              printWindow.onload = () => {
                printWindow.print();
              };
            }

            // Also trigger download
            const link = document.createElement('a');
            link.href = url;
            link.download = `invoice-${saleId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Hóa đơn đã được tạo');
          } catch (error) {
            console.error('Invoice print error:', error);
            toast.error('Lỗi in hóa đơn');
          }
        };

        return { processPayment, printInvoice };
      }, [cart, customer, totals, notes])}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Chọn phương thức thanh toán</h3>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {Object.entries(PAYMENT_METHODS).map(([key, name]) => (
                <button
                  key={key}
                  className={`btn ${paymentMethod === key ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setPaymentMethod(key as keyof typeof PAYMENT_METHODS)}
                >
                  {name}
                </button>
              ))}
            </div>

            <div className="bg-base-200 p-4 rounded-lg mb-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Tổng thanh toán:</span>
                <span className="text-primary">{formatVND(totals.total)}</span>
              </div>
            </div>

            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setShowPaymentModal(false)}
              >
                Hủy
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const { processPayment } = React.useMemo(() => ({
                    processPayment: async (method: keyof typeof PAYMENT_METHODS) => {
                      if (cart.length === 0) {
                        toast.error('Giỏ hàng trống');
                        return;
                      }

                      setIsProcessing(true);
                      try {
                        const saleData = {
                          sale_number: generateInvoiceNumber(),
                          customer_id: customer.id,
                          cashier_id: 'current-user',
                          status: 'completed',
                          subtotal_amount: totals.subtotal,
                          tax_amount: totals.taxAmount,
                          discount_amount: totals.discountAmount,
                          total_amount: totals.total,
                          payment_method: method,
                          payment_status: 'paid',
                          notes: notes,
                          items: cart
                        };

                        const response = await apiClient.post('/api/v1/sales', saleData);

                        if (response.data.success) {
                          const saleId = response.data.data.id;
                          setSaleId(saleId);

                          toast.success(`Thanh toán thành công! Mã hóa đơn: ${saleData.sale_number}`);

                          if (window.confirm('Bạn có muốn in hóa đơn không?')) {
                            // Print invoice logic here
                          }

                          clearCart();
                          setShowPaymentModal(false);
                        } else {
                          throw new Error(response.data.message || 'Thanh toán thất bại');
                        }
                      } catch (error: any) {
                        console.error('Payment error:', error);
                        toast.error(error.response?.data?.message || 'Lỗi thanh toán');
                      } finally {
                        setIsProcessing(false);
                      }
                    }
                  }), [cart, customer, totals, notes]);

                  processPayment(paymentMethod);
                }}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  'Xác nhận thanh toán'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compatibility Check Modal */}
      {showCompatibilityCheck && compatibilityResult && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              <FiShield className="inline mr-2" />
              Kiểm tra tương thích linh kiện PC
            </h3>

            <div className="mb-4">
              <div className={`alert ${compatibilityResult.isCompatible ? 'alert-success' : 'alert-error'}`}>
                <div>
                  {compatibilityResult.isCompatible ? (
                    <FiCheck className="text-success" />
                  ) : (
                    <FiAlertTriangle className="text-error" />
                  )}
                  <span>
                    {compatibilityResult.isCompatible
                      ? 'Tất cả linh kiện tương thích với nhau'
                      : `Phát hiện ${compatibilityResult.issues.filter((i: any) => i.severity === 'error').length} vấn đề tương thích`
                    }
                  </span>
                </div>
              </div>
            </div>

            {compatibilityResult.issues.length > 0 && (
              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {compatibilityResult.issues.map((issue: any, index: number) => (
                  <div
                    key={index}
                    className={`alert ${
                      issue.severity === 'error' ? 'alert-error' :
                      issue.severity === 'warning' ? 'alert-warning' : 'alert-info'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{issue.message_vi || issue.message}</div>
                      {issue.suggestion_vi && (
                        <div className="text-sm mt-1">{issue.suggestion_vi}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-base-200 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Công suất yêu cầu:</span>
                  <span className="ml-2">{compatibilityResult.powerRequirement}W</span>
                </div>
                <div>
                  <span className="font-medium">Tổng giá trị:</span>
                  <span className="ml-2">{formatVND(compatibilityResult.estimatedPrice)}</span>
                </div>
              </div>
            </div>

            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setShowCompatibilityCheck(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewSale;
