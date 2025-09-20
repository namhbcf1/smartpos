import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  XCircle, Plus, Search, Filter, Download, Eye, Edit, Trash2, 
  AlertCircle, FileText, Phone, Mail, MapPin, CreditCard, Calendar, 
  User, ShoppingCart, MoreVertical, Printer, Send, RefreshCw, 
  TrendingUp, DollarSign, Package, RotateCcw, Undo, Ban
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/badge'

interface Order {
  id: string
  orderNumber: string
  customer: {
    name: string
    phone: string
    email: string
    address: string
  }
  products: {
    name: string
    sku: string
    quantity: number
    price: number
    discount: number
    total: number
  }[]
  totalAmount: number
  discount: number
  tax: number
  shippingFee: number
  finalAmount: number
  paymentMethod: 'cod' | 'bank_transfer' | 'cash' | 'online'
  paymentStatus: 'paid' | 'unpaid' | 'partial'
  orderStatus: 'new' | 'processing' | 'shipping' | 'completed' | 'cancelled'
  channel: 'pos' | 'website' | 'app' | 'shopee' | 'lazada' | 'facebook' | 'zalo'
  orderDate: string
  cancelledDate: string
  cancellationReason: string
  cancellationType: 'customer' | 'system' | 'staff' | 'payment_failed' | 'out_of_stock'
  refundStatus: 'pending' | 'processing' | 'completed' | 'failed'
  refundAmount: number
  refundMethod: 'original' | 'bank_transfer' | 'cash' | 'store_credit'
  notes: string
  createdBy: string
  updatedBy: string
  trackingNumber?: string
  shippingCompany?: string
  returnRequest?: boolean
  returnReason?: string
  returnStatus?: 'pending' | 'approved' | 'rejected' | 'completed'
  returnTrackingNumber?: string
}

const mockCancelledOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-2024-001',
    customer: {
      name: 'Nguyễn Văn A',
      phone: '0123456789',
      email: 'nguyenvana@email.com',
      address: '123 Đường ABC, Quận 1, TP.HCM'
    },
    products: [
      { name: 'iPhone 15 Pro', sku: 'IP15P-128', quantity: 1, price: 25000000, discount: 0, total: 25000000 },
      { name: 'AirPods Pro', sku: 'APP-2', quantity: 1, price: 5000000, discount: 500000, total: 4500000 }
    ],
    totalAmount: 30000000,
    discount: 500000,
    tax: 2950000,
    shippingFee: 50000,
    finalAmount: 32450000,
    paymentMethod: 'bank_transfer',
    paymentStatus: 'paid',
    orderStatus: 'cancelled',
    channel: 'website',
    orderDate: '2024-01-22 14:30',
    cancelledDate: '2024-01-23 10:15',
    cancellationReason: 'Khách hàng thay đổi ý định, không muốn mua nữa',
    cancellationType: 'customer',
    refundStatus: 'completed',
    refundAmount: 32450000,
    refundMethod: 'original',
    notes: 'Khách yêu cầu giao hàng sau 19h',
    createdBy: 'Admin',
    updatedBy: 'Admin',
    trackingNumber: 'VN123456789',
    shippingCompany: 'Viettel Post'
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-002',
    customer: {
      name: 'Trần Thị B',
      phone: '0987654321',
      email: 'tranthib@email.com',
      address: '456 Đường DEF, Quận 3, TP.HCM'
    },
    products: [
      { name: 'MacBook Air M2', sku: 'MBA-M2-256', quantity: 1, price: 28000000, discount: 0, total: 28000000 },
      { name: 'Magic Mouse', sku: 'MM-2', quantity: 1, price: 2000000, discount: 0, total: 2000000 }
    ],
    totalAmount: 30000000,
    discount: 0,
    tax: 3000000,
    shippingFee: 0,
    finalAmount: 33000000,
    paymentMethod: 'cod',
    paymentStatus: 'unpaid',
    orderStatus: 'cancelled',
    channel: 'pos',
    orderDate: '2024-01-22 16:45',
    cancelledDate: '2024-01-23 09:30',
    cancellationReason: 'Hết hàng trong kho, không thể giao hàng',
    cancellationType: 'out_of_stock',
    refundStatus: 'pending',
    refundAmount: 0,
    refundMethod: 'original',
    notes: 'Khách hàng VIP, ưu tiên giao hàng',
    createdBy: 'Staff01',
    updatedBy: 'Staff01'
  },
  {
    id: '3',
    orderNumber: 'ORD-2024-003',
    customer: {
      name: 'Lê Văn C',
      phone: '0369852147',
      email: 'levanc@email.com',
      address: '789 Đường GHI, Quận 5, TP.HCM'
    },
    products: [
      { name: 'Samsung Galaxy S24', sku: 'SGS24-256', quantity: 1, price: 22000000, discount: 1000000, total: 21000000 },
      { name: 'Samsung Buds Pro', sku: 'SBP-2', quantity: 1, price: 3000000, discount: 0, total: 3000000 }
    ],
    totalAmount: 25000000,
    discount: 1000000,
    tax: 2400000,
    shippingFee: 30000,
    finalAmount: 26430000,
    paymentMethod: 'online',
    paymentStatus: 'paid',
    orderStatus: 'cancelled',
    channel: 'shopee',
    orderDate: '2024-01-20 10:15',
    cancelledDate: '2024-01-21 14:20',
    cancellationReason: 'Sản phẩm bị lỗi, khách hàng yêu cầu trả hàng',
    cancellationType: 'customer',
    refundStatus: 'processing',
    refundAmount: 26430000,
    refundMethod: 'bank_transfer',
    notes: 'Giao hàng thành công, khách hài lòng',
    createdBy: 'System',
    updatedBy: 'System',
    trackingNumber: 'GHI456789123',
    shippingCompany: 'Giao Hàng Nhanh',
    returnRequest: true,
    returnReason: 'Sản phẩm bị lỗi màn hình',
    returnStatus: 'approved',
    returnTrackingNumber: 'RTN789123456'
  }
]

const cancellationTypeConfig = {
  customer: { label: 'Khách hàng hủy', color: 'blue' },
  system: { label: 'Hệ thống hủy', color: 'gray' },
  staff: { label: 'Nhân viên hủy', color: 'orange' },
  payment_failed: { label: 'Thanh toán thất bại', color: 'red' },
  out_of_stock: { label: 'Hết hàng', color: 'yellow' }
}

const refundStatusConfig = {
  pending: { label: 'Chờ hoàn tiền', color: 'yellow' },
  processing: { label: 'Đang xử lý', color: 'blue' },
  completed: { label: 'Đã hoàn tiền', color: 'green' },
  failed: { label: 'Hoàn tiền thất bại', color: 'red' }
}

const returnStatusConfig = {
  pending: { label: 'Chờ duyệt', color: 'yellow' },
  approved: { label: 'Đã duyệt', color: 'green' },
  rejected: { label: 'Từ chối', color: 'red' },
  completed: { label: 'Hoàn tất', color: 'blue' }
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

export const CancelledOrders: React.FC = () => {
  const [orders] = useState<Order[]>(mockCancelledOrders)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCancellationType, setSelectedCancellationType] = useState('all')
  const [selectedRefundStatus, setSelectedRefundStatus] = useState('all')
  const [selectedReturnStatus, setSelectedReturnStatus] = useState('all')
  const [selectedChannel, setSelectedChannel] = useState('all')
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.phone.includes(searchTerm)
    const matchesCancellationType = selectedCancellationType === 'all' || order.cancellationType === selectedCancellationType
    const matchesRefundStatus = selectedRefundStatus === 'all' || order.refundStatus === selectedRefundStatus
    const matchesReturnStatus = selectedReturnStatus === 'all' || order.returnStatus === selectedReturnStatus
    const matchesChannel = selectedChannel === 'all' || order.channel === selectedChannel
    return matchesSearch && matchesCancellationType && matchesRefundStatus && matchesReturnStatus && matchesChannel
  })

  const stats = {
    total: orders.length,
    customerCancelled: orders.filter(o => o.cancellationType === 'customer').length,
    systemCancelled: orders.filter(o => o.cancellationType === 'system').length,
    outOfStock: orders.filter(o => o.cancellationType === 'out_of_stock').length,
    paymentFailed: orders.filter(o => o.cancellationType === 'payment_failed').length,
    totalRefundAmount: orders.reduce((sum, o) => sum + o.refundAmount, 0),
    pendingRefunds: orders.filter(o => o.refundStatus === 'pending').length,
    completedRefunds: orders.filter(o => o.refundStatus === 'completed').length,
    returnRequests: orders.filter(o => o.returnRequest).length
  }

  const getCancellationTypeInfo = (type: string) => {
    return cancellationTypeConfig[type as keyof typeof cancellationTypeConfig] || cancellationTypeConfig.customer
  }

  const getRefundStatusInfo = (status: string) => {
    return refundStatusConfig[status as keyof typeof refundStatusConfig] || refundStatusConfig.pending
  }

  const getReturnStatusInfo = (status: string) => {
    return returnStatusConfig[status as keyof typeof returnStatusConfig] || returnStatusConfig.pending
  }

  const getChannelInfo = (channel: string) => {
    return channelConfig[channel as keyof typeof channelConfig] || channelConfig.pos
  }

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    )
  }

  const handleSelectAll = () => {
    setSelectedOrders(
      selectedOrders.length === filteredOrders.length 
        ? [] 
        : filteredOrders.map(o => o.id)
    )
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

  const getDaysAgo = (dateString: string) => {
    const now = new Date()
    const orderDate = new Date(dateString)
    const diffInDays = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24))
    return diffInDays
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <XCircle className="w-8 h-8 text-red-600" />
            Đơn hàng bị hủy / Hoàn trả
          </h1>
          <p className="text-gray-600 mt-2">
            Quản lý các đơn hàng bị hủy và yêu cầu hoàn trả từ khách hàng
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Xử lý hoàn tiền
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Xuất Excel
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Tạo đơn hàng mới
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Tổng đơn hủy</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.customerCancelled}</p>
              <p className="text-xs text-gray-500">Khách hủy</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.outOfStock}</p>
              <p className="text-xs text-gray-500">Hết hàng</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.paymentFailed}</p>
              <p className="text-xs text-gray-500">Thanh toán TB</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">
                {(stats.totalRefundAmount / 1000000000).toFixed(1)}B
              </p>
              <p className="text-xs text-gray-500">Tổng hoàn tiền</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingRefunds}</p>
              <p className="text-xs text-gray-500">Chờ hoàn tiền</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.completedRefunds}</p>
              <p className="text-xs text-gray-500">Đã hoàn tiền</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.returnRequests}</p>
              <p className="text-xs text-gray-500">Yêu cầu trả</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Tìm kiếm mã đơn, SĐT, tên khách hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCancellationType}
                onChange={(e) => setSelectedCancellationType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">Tất cả lý do hủy</option>
                {Object.entries(cancellationTypeConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              <select
                value={selectedRefundStatus}
                onChange={(e) => setSelectedRefundStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">Tất cả trạng thái hoàn tiền</option>
                {Object.entries(refundStatusConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              <select
                value={selectedReturnStatus}
                onChange={(e) => setSelectedReturnStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">Tất cả trạng thái trả hàng</option>
                {Object.entries(returnStatusConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">Tất cả kênh</option>
                {Object.entries(channelConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Bộ lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrders.map((order) => {
          const cancellationTypeInfo = getCancellationTypeInfo(order.cancellationType)
          const refundStatusInfo = getRefundStatusInfo(order.refundStatus)
          const channelInfo = getChannelInfo(order.channel)
          
          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => handleSelectOrder(order.id)}
                        className="rounded border-gray-300"
                      />
                      <div>
                        <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                        <CardDescription className="text-sm text-gray-500">
                          {getDaysAgo(order.cancelledDate)} ngày trước
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className={`bg-${cancellationTypeInfo.color}-100 text-${cancellationTypeInfo.color}-800`}>
                        {cancellationTypeInfo.label}
                      </Badge>
                      <Badge className={`bg-${channelInfo.color}-100 text-${channelInfo.color}-800`}>
                        {channelInfo.label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{order.customer.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{order.customer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{order.customer.address}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">Sản phẩm:</p>
                    {order.products.slice(0, 2).map((product, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        {product.name} x{product.quantity}
                      </div>
                    ))}
                    {order.products.length > 2 && (
                      <div className="text-sm text-gray-500">
                        +{order.products.length - 2} sản phẩm khác
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(order.finalAmount)}
                      </p>
                      <p className="text-xs text-gray-500">Tổng tiền</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(order.refundAmount)}
                      </p>
                      <p className="text-xs text-gray-500">Hoàn tiền</p>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">Lý do hủy</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">{order.cancellationReason}</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Trạng thái hoàn tiền</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <Badge className={`bg-${refundStatusInfo.color}-100 text-${refundStatusInfo.color}-800`}>
                        {refundStatusInfo.label}
                      </Badge>
                      <span className="text-sm text-blue-700">{order.refundMethod}</span>
                    </div>
                  </div>

                  {order.returnRequest && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">Yêu cầu trả hàng</span>
                      </div>
                      <p className="text-sm text-purple-700 mt-1">{order.returnReason}</p>
                      {order.returnTrackingNumber && (
                        <p className="text-sm text-purple-600 mt-1">
                          Mã trả hàng: {order.returnTrackingNumber}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="w-4 h-4 mr-1" />
                      Xem
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Hoàn tiền
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                      <Ban className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không có đơn hàng bị hủy nào
            </h3>
            <p className="text-gray-600 mb-4">
              Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tạo đơn hàng mới
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
