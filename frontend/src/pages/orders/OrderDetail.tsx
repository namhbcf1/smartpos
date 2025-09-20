import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Package, User, Phone, Mail, MapPin, CreditCard, 
  Truck, Calendar, Clock, FileText, Printer, Send, Edit, 
  CheckCircle, XCircle, AlertCircle, Star, TrendingUp, 
  DollarSign, ShoppingCart, Building2, Globe, MessageSquare,
  History, Eye, Download, Share2, MoreVertical
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/badge'

interface OrderDetail {
  id: string
  orderNumber: string
  customer: {
    name: string
    phone: string
    email: string
    address: string
    customerType: 'individual' | 'business'
    taxNumber?: string
  }
  products: {
    id: string
    name: string
    sku: string
    quantity: number
    price: number
    discount: number
    total: number
    image?: string
    category: string
  }[]
  pricing: {
    subtotal: number
    discount: number
    tax: number
    shippingFee: number
    finalAmount: number
  }
  payment: {
    method: 'cod' | 'bank_transfer' | 'cash' | 'online'
    status: 'paid' | 'unpaid' | 'partial'
    paidAmount: number
    remainingAmount: number
    transactionId?: string
    paymentDate?: string
  }
  shipping: {
    status: 'pending' | 'shipping' | 'delivered' | 'returned'
    company: string
    trackingNumber: string
    estimatedDelivery: string
    actualDelivery?: string
    deliveryAddress: string
    deliveryNotes?: string
    driverName?: string
    driverPhone?: string
  }
  orderInfo: {
    status: 'new' | 'processing' | 'shipping' | 'completed' | 'cancelled'
    channel: 'pos' | 'website' | 'app' | 'shopee' | 'lazada' | 'facebook' | 'zalo'
    orderDate: string
    createdBy: string
    updatedBy: string
    notes: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
  }
  history: {
    id: string
    action: string
    description: string
    timestamp: string
    user: string
    status: 'success' | 'warning' | 'error' | 'info'
  }[]
  warranty: {
    status: 'active' | 'expired' | 'used'
    expiryDate: string
    terms: string
  }
  customerFeedback?: {
    rating: number
    review: string
    date: string
  }
}

const mockOrderDetail: OrderDetail = {
  id: '1',
  orderNumber: 'ORD-2024-001',
  customer: {
    name: 'Nguyễn Văn A',
    phone: '0123456789',
    email: 'nguyenvana@email.com',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    customerType: 'individual'
  },
  products: [
    {
      id: '1',
      name: 'iPhone 15 Pro 128GB',
      sku: 'IP15P-128',
      quantity: 1,
      price: 25000000,
      discount: 0,
      total: 25000000,
      category: 'Điện thoại'
    },
    {
      id: '2',
      name: 'AirPods Pro 2nd Gen',
      sku: 'APP-2',
      quantity: 1,
      price: 5000000,
      discount: 500000,
      total: 4500000
    }
  ],
  pricing: {
    subtotal: 30000000,
    discount: 500000,
    tax: 2950000,
    shippingFee: 50000,
    finalAmount: 32450000
  },
  payment: {
    method: 'bank_transfer',
    status: 'paid',
    paidAmount: 32450000,
    remainingAmount: 0,
    transactionId: 'TXN123456789',
    paymentDate: '2024-01-22 15:30'
  },
  shipping: {
    status: 'shipping',
    company: 'Viettel Post',
    trackingNumber: 'VN123456789',
    estimatedDelivery: '2024-01-24 18:00',
    deliveryAddress: '123 Đường ABC, Quận 1, TP.HCM',
    deliveryNotes: 'Khách yêu cầu giao hàng sau 19h',
    driverName: 'Nguyễn Văn B',
    driverPhone: '0987654321'
  },
  orderInfo: {
    status: 'shipping',
    channel: 'website',
    orderDate: '2024-01-22 14:30',
    createdBy: 'Admin',
    updatedBy: 'Admin',
    notes: 'Khách hàng VIP, ưu tiên xử lý',
    priority: 'high'
  },
  history: [
    {
      id: '1',
      action: 'Tạo đơn hàng',
      description: 'Đơn hàng được tạo từ website',
      timestamp: '2024-01-22 14:30',
      user: 'System',
      status: 'success'
    },
    {
      id: '2',
      action: 'Xác nhận thanh toán',
      description: 'Thanh toán đã được xác nhận',
      timestamp: '2024-01-22 15:30',
      user: 'Admin',
      status: 'success'
    },
    {
      id: '3',
      action: 'Chuẩn bị hàng',
      description: 'Hàng đã được chuẩn bị và đóng gói',
      timestamp: '2024-01-23 08:00',
      user: 'Staff01',
      status: 'success'
    },
    {
      id: '4',
      action: 'Giao cho đơn vị vận chuyển',
      description: 'Hàng đã được giao cho Viettel Post',
      timestamp: '2024-01-23 10:00',
      user: 'Staff01',
      status: 'success'
    }
  ],
  warranty: {
    status: 'active',
    expiryDate: '2025-01-24',
    terms: 'Bảo hành chính hãng 12 tháng'
  },
  customerFeedback: {
    rating: 5,
    review: 'Sản phẩm chất lượng tốt, giao hàng nhanh. Rất hài lòng!',
    date: '2024-01-24 16:00'
  }
}

const orderStatusConfig = {
  new: { label: 'Mới', color: 'blue', icon: Clock },
  processing: { label: 'Đang xử lý', color: 'yellow', icon: Package },
  shipping: { label: 'Đang giao', color: 'orange', icon: Truck },
  completed: { label: 'Hoàn tất', color: 'green', icon: CheckCircle },
  cancelled: { label: 'Hủy', color: 'red', icon: XCircle }
}

const paymentStatusConfig = {
  paid: { label: 'Đã thanh toán', color: 'green' },
  unpaid: { label: 'Chưa thanh toán', color: 'red' },
  partial: { label: 'Thanh toán một phần', color: 'yellow' }
}

const channelConfig = {
  pos: { label: 'POS', color: 'blue' },
  website: { label: 'Website', color: 'green' },
  app: { label: 'App', color: 'purple' },
  shopee: { label: 'Shopee', color: 'orange' },
  lazada: { label: 'Lazada', color: 'red' },
  facebook: { label: 'Facebook', color: 'blue' },
  zalo: { label: 'Zalo', color: 'green' }
}

export const OrderDetail: React.FC = () => {
  const [order] = useState<OrderDetail>(mockOrderDetail)
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'shipping' | 'history'>('overview')

  const getStatusInfo = (status: string) => {
    return orderStatusConfig[status as keyof typeof orderStatusConfig] || orderStatusConfig.new
  }

  const getPaymentStatusInfo = (status: string) => {
    return paymentStatusConfig[status as keyof typeof paymentStatusConfig] || paymentStatusConfig.unpaid
  }

  const getChannelInfo = (channel: string) => {
    return channelConfig[channel as keyof typeof channelConfig] || channelConfig.pos
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  const getHistoryStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-blue-600 bg-blue-100'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600" />
              {order.orderNumber}
            </h1>
            <p className="text-gray-600 mt-2">
              Chi tiết đơn hàng và thông tin giao dịch
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Chia sẻ
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Xuất PDF
          </Button>
          <Button variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            In hóa đơn
          </Button>
          <Button>
            <Edit className="w-4 h-4 mr-2" />
            Chỉnh sửa
          </Button>
        </div>
      </div>

      {/* Order Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {(() => {
                const statusInfo = getStatusInfo(order.orderInfo.status)
                const StatusIcon = statusInfo.icon
                return (
                  <Badge className={`bg-${statusInfo.color}-100 text-${statusInfo.color}-800 text-lg px-4 py-2`}>
                    <StatusIcon className="w-5 h-5 mr-2" />
                    {statusInfo.label}
                  </Badge>
                )
              })()}
              <div>
                <p className="text-sm text-gray-500">Đặt hàng lúc</p>
                <p className="font-medium">{formatDate(order.orderInfo.orderDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Kênh bán</p>
                {(() => {
                  const channelInfo = getChannelInfo(order.orderInfo.channel)
                  return (
                    <Badge className={`bg-${channelInfo.color}-100 text-${channelInfo.color}-800`}>
                      {channelInfo.label}
                    </Badge>
                  )
                })()}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(order.pricing.finalAmount)}
              </p>
              <p className="text-sm text-gray-500">Tổng thanh toán</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Tổng quan', icon: Eye },
          { id: 'products', label: 'Sản phẩm', icon: ShoppingCart },
          { id: 'shipping', label: 'Vận chuyển', icon: Truck },
          { id: 'history', label: 'Lịch sử', icon: History }
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Thông tin khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{order.customer.name}</p>
                  <p className="text-sm text-gray-500">
                    {order.customer.customerType === 'individual' ? 'Khách lẻ' : 'Doanh nghiệp'}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{order.customer.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{order.customer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{order.customer.address}</span>
                </div>
                {order.customer.taxNumber && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span>MST: {order.customer.taxNumber}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Thông tin thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Phương thức thanh toán</span>
                <Badge variant="outline">
                  {order.payment.method === 'cod' ? 'COD' : 
                   order.payment.method === 'bank_transfer' ? 'Chuyển khoản' :
                   order.payment.method === 'cash' ? 'Tiền mặt' : 'Online'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Trạng thái thanh toán</span>
                {(() => {
                  const paymentStatusInfo = getPaymentStatusInfo(order.payment.status)
                  return (
                    <Badge className={`bg-${paymentStatusInfo.color}-100 text-${paymentStatusInfo.color}-800`}>
                      {paymentStatusInfo.label}
                    </Badge>
                  )
                })()}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Số tiền đã thanh toán</span>
                <span className="font-medium">{formatCurrency(order.payment.paidAmount)}</span>
              </div>
              {order.payment.remainingAmount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Số tiền còn lại</span>
                  <span className="font-medium text-red-600">{formatCurrency(order.payment.remainingAmount)}</span>
                </div>
              )}
              {order.payment.transactionId && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Mã giao dịch</span>
                  <span className="font-mono text-sm">{order.payment.transactionId}</span>
                </div>
              )}
              {order.payment.paymentDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Ngày thanh toán</span>
                  <span className="text-sm">{formatDate(order.payment.paymentDate)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Chi tiết giá
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Tạm tính</span>
                <span>{formatCurrency(order.pricing.subtotal)}</span>
              </div>
              {order.pricing.discount > 0 && (
                <div className="flex items-center justify-between text-green-600">
                  <span className="text-sm">Giảm giá</span>
                  <span>-{formatCurrency(order.pricing.discount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Thuế VAT</span>
                <span>{formatCurrency(order.pricing.tax)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Phí vận chuyển</span>
                <span>{formatCurrency(order.pricing.shippingFee)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex items-center justify-between font-bold text-lg">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(order.pricing.finalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warranty Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Thông tin bảo hành
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Trạng thái bảo hành</span>
                <Badge className={`bg-${order.warranty.status === 'active' ? 'green' : 'red'}-100 text-${order.warranty.status === 'active' ? 'green' : 'red'}-800`}>
                  {order.warranty.status === 'active' ? 'Còn bảo hành' : 'Hết bảo hành'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Hết hạn bảo hành</span>
                <span className="text-sm">{formatDate(order.warranty.expiryDate)}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Điều khoản bảo hành</span>
                <p className="text-sm mt-1">{order.warranty.terms}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'products' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Sản phẩm trong đơn hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.products.map((product) => (
                <div key={product.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                    <p className="text-sm text-gray-500">Danh mục: {product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(product.price)}</p>
                    <p className="text-sm text-gray-500">x{product.quantity}</p>
                    {product.discount > 0 && (
                      <p className="text-sm text-green-600">-{formatCurrency(product.discount)}</p>
                    )}
                  </div>
                  <div className="text-right font-medium">
                    {formatCurrency(product.total)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'shipping' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Thông tin vận chuyển
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Đơn vị vận chuyển</p>
                <p className="font-medium">{order.shipping.company}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Mã vận đơn</p>
                <p className="font-mono">{order.shipping.trackingNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Trạng thái giao hàng</p>
                <Badge className={`bg-${order.shipping.status === 'delivered' ? 'green' : order.shipping.status === 'shipping' ? 'orange' : 'yellow'}-100 text-${order.shipping.status === 'delivered' ? 'green' : order.shipping.status === 'shipping' ? 'orange' : 'yellow'}-800`}>
                  {order.shipping.status === 'delivered' ? 'Đã giao hàng' :
                   order.shipping.status === 'shipping' ? 'Đang giao hàng' :
                   order.shipping.status === 'returned' ? 'Hoàn trả' : 'Chờ giao hàng'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Dự kiến giao hàng</p>
                <p className="text-sm">{formatDate(order.shipping.estimatedDelivery)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Địa chỉ giao hàng</p>
              <p className="text-sm">{order.shipping.deliveryAddress}</p>
            </div>
            {order.shipping.deliveryNotes && (
              <div>
                <p className="text-sm text-gray-500">Ghi chú giao hàng</p>
                <p className="text-sm">{order.shipping.deliveryNotes}</p>
              </div>
            )}
            {order.shipping.driverName && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Tài xế</p>
                  <p className="text-sm">{order.shipping.driverName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Số điện thoại tài xế</p>
                  <p className="text-sm">{order.shipping.driverPhone}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Lịch sử xử lý đơn hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.history.map((item, index) => (
                <div key={item.id} className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getHistoryStatusColor(item.status)}`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{item.action}</h4>
                      <span className="text-sm text-gray-500">{formatDate(item.timestamp)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    <p className="text-xs text-gray-500 mt-1">Bởi: {item.user}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Feedback */}
      {order.customerFeedback && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Đánh giá khách hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="flex items-center gap-1">
                {getRatingStars(order.customerFeedback.rating)}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">{order.customerFeedback.review}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Đánh giá lúc: {formatDate(order.customerFeedback.date)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
