import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle, Plus, Search, Filter, Download, Eye, Edit, Trash2, 
  AlertCircle, FileText, Phone, Mail, MapPin, CreditCard, Calendar, 
  User, ShoppingCart, MoreVertical, Printer, Send, RefreshCw, 
  TrendingUp, DollarSign, Package, Star, ThumbsUp, MessageSquare
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
  completedDate: string
  deliveryDate: string
  notes: string
  createdBy: string
  updatedBy: string
  trackingNumber: string
  shippingCompany: string
  customerRating?: number
  customerReview?: string
  returnRequest?: boolean
  warrantyStatus?: 'active' | 'expired' | 'used'
  warrantyExpiry?: string
}

const mockCompletedOrders: Order[] = [
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
    orderStatus: 'completed',
    channel: 'website',
    orderDate: '2024-01-22 14:30',
    completedDate: '2024-01-24 15:30',
    deliveryDate: '2024-01-24 15:30',
    notes: 'Khách yêu cầu giao hàng sau 19h',
    createdBy: 'Admin',
    updatedBy: 'Admin',
    trackingNumber: 'VN123456789',
    shippingCompany: 'Viettel Post',
    customerRating: 5,
    customerReview: 'Sản phẩm chất lượng tốt, giao hàng nhanh. Rất hài lòng!',
    warrantyStatus: 'active',
    warrantyExpiry: '2025-01-24'
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
    paymentStatus: 'paid',
    orderStatus: 'completed',
    channel: 'pos',
    orderDate: '2024-01-22 16:45',
    completedDate: '2024-01-23 17:00',
    deliveryDate: '2024-01-23 17:00',
    notes: 'Khách hàng VIP, ưu tiên giao hàng',
    createdBy: 'Staff01',
    updatedBy: 'Staff01',
    trackingNumber: 'SP987654321',
    shippingCompany: 'Shopee Express',
    customerRating: 4,
    customerReview: 'Sản phẩm tốt nhưng giao hàng hơi chậm',
    warrantyStatus: 'active',
    warrantyExpiry: '2025-01-23'
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
    orderStatus: 'completed',
    channel: 'shopee',
    orderDate: '2024-01-20 10:15',
    completedDate: '2024-01-21 15:30',
    deliveryDate: '2024-01-21 15:30',
    notes: 'Giao hàng thành công, khách hài lòng',
    createdBy: 'System',
    updatedBy: 'System',
    trackingNumber: 'GHI456789123',
    shippingCompany: 'Giao Hàng Nhanh',
    customerRating: 5,
    customerReview: 'Tuyệt vời! Sẽ mua lại lần sau',
    warrantyStatus: 'active',
    warrantyExpiry: '2025-01-21'
  }
]

const channelConfig = {
  pos: { label: 'POS', color: 'blue' },
  website: { label: 'Website', color: 'green' },
  app: { label: 'App', color: 'purple' },
  shopee: { label: 'Shopee', color: 'orange' },
  lazada: { label: 'Lazada', color: 'red' },
  facebook: { label: 'Facebook', color: 'blue' },
  zalo: { label: 'Zalo', color: 'green' }
}

const warrantyStatusConfig = {
  active: { label: 'Còn bảo hành', color: 'green' },
  expired: { label: 'Hết bảo hành', color: 'red' },
  used: { label: 'Đã sử dụng', color: 'yellow' }
}

export const CompletedOrders: React.FC = () => {
  const [orders] = useState<Order[]>(mockCompletedOrders)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedChannel, setSelectedChannel] = useState('all')
  const [selectedRating, setSelectedRating] = useState('all')
  const [selectedWarrantyStatus, setSelectedWarrantyStatus] = useState('all')
  const [selectedDateRange, setSelectedDateRange] = useState('all')
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.phone.includes(searchTerm)
    const matchesChannel = selectedChannel === 'all' || order.channel === selectedChannel
    const matchesRating = selectedRating === 'all' || 
                         (selectedRating === '5' && order.customerRating === 5) ||
                         (selectedRating === '4' && order.customerRating === 4) ||
                         (selectedRating === '3' && order.customerRating === 3) ||
                         (selectedRating === '2' && order.customerRating === 2) ||
                         (selectedRating === '1' && order.customerRating === 1)
    const matchesWarrantyStatus = selectedWarrantyStatus === 'all' || order.warrantyStatus === selectedWarrantyStatus
    return matchesSearch && matchesChannel && matchesRating && matchesWarrantyStatus
  })

  const stats = {
    total: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + o.finalAmount, 0),
    avgRating: orders.reduce((sum, o) => sum + (o.customerRating || 0), 0) / orders.length,
    fiveStar: orders.filter(o => o.customerRating === 5).length,
    fourStar: orders.filter(o => o.customerRating === 4).length,
    threeStar: orders.filter(o => o.customerRating === 3).length,
    twoStar: orders.filter(o => o.customerRating === 2).length,
    oneStar: orders.filter(o => o.customerRating === 1).length,
    activeWarranty: orders.filter(o => o.warrantyStatus === 'active').length,
    returnRequests: orders.filter(o => o.returnRequest).length
  }

  const getChannelInfo = (channel: string) => {
    return channelConfig[channel as keyof typeof channelConfig] || channelConfig.pos
  }

  const getWarrantyStatusInfo = (status: string) => {
    return warrantyStatusConfig[status as keyof typeof warrantyStatusConfig] || warrantyStatusConfig.active
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

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
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
            <CheckCircle className="w-8 h-8 text-green-600" />
            Đơn hàng hoàn tất
          </h1>
          <p className="text-gray-600 mt-2">
            Quản lý các đơn hàng đã hoàn tất và theo dõi đánh giá khách hàng
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Xuất Excel
          </Button>
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Xuất PDF
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
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              <p className="text-xs text-gray-500">Tổng đơn hoàn tất</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">
                {(stats.totalRevenue / 1000000000).toFixed(1)}B
              </p>
              <p className="text-xs text-gray-500">Tổng doanh thu</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {stats.avgRating.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500">Đánh giá TB</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">{stats.fiveStar}</p>
              <p className="text-xs text-gray-500">5 sao</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.fourStar}</p>
              <p className="text-xs text-gray-500">4 sao</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.threeStar}</p>
              <p className="text-xs text-gray-500">3 sao</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.activeWarranty}</p>
              <p className="text-xs text-gray-500">Còn bảo hành</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.returnRequests}</p>
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
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Tất cả kênh</option>
                {Object.entries(channelConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Tất cả đánh giá</option>
                <option value="5">5 sao</option>
                <option value="4">4 sao</option>
                <option value="3">3 sao</option>
                <option value="2">2 sao</option>
                <option value="1">1 sao</option>
              </select>
              <select
                value={selectedWarrantyStatus}
                onChange={(e) => setSelectedWarrantyStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Tất cả bảo hành</option>
                {Object.entries(warrantyStatusConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Tất cả thời gian</option>
                <option value="today">Hôm nay</option>
                <option value="week">Tuần này</option>
                <option value="month">Tháng này</option>
                <option value="custom">Tùy chọn</option>
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
          const channelInfo = getChannelInfo(order.channel)
          const warrantyInfo = getWarrantyStatusInfo(order.warrantyStatus || 'active')
          
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
                          {getDaysAgo(order.completedDate)} ngày trước
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className={`bg-${channelInfo.color}-100 text-${channelInfo.color}-800`}>
                        {channelInfo.label}
                      </Badge>
                      <Badge className={`bg-${warrantyInfo.color}-100 text-${warrantyInfo.color}-800`}>
                        {warrantyInfo.label}
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
                      <div className="flex items-center justify-center gap-1 mb-1">
                        {getRatingStars(order.customerRating || 0)}
                      </div>
                      <p className="text-xs text-gray-500">Đánh giá</p>
                    </div>
                  </div>

                  {order.customerReview && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Đánh giá khách hàng</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">{order.customerReview}</p>
                    </div>
                  )}

                  {order.warrantyExpiry && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Bảo hành đến</span>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">
                        {new Date(order.warrantyExpiry).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="w-4 h-4 mr-1" />
                      Xem
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Printer className="w-4 h-4 mr-1" />
                      In
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                      <AlertCircle className="w-4 h-4" />
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
            <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không có đơn hàng hoàn tất nào
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
