import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Clock, Plus, Search, Filter, Download, Eye, Edit, Trash2,
  CheckCircle, AlertCircle, FileText, Phone, Mail, MapPin,
  CreditCard, Calendar, User, ShoppingCart, MoreVertical,
  Printer, Send, RefreshCw, TrendingUp, DollarSign, Zap, XCircle
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
  notes: string
  createdBy: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimatedProcessingTime: number // minutes
}

const mockNewOrders: Order[] = [
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
    orderStatus: 'new',
    channel: 'website',
    orderDate: '2024-01-22 14:30',
    notes: 'Khách yêu cầu giao hàng sau 19h',
    createdBy: 'Admin',
    priority: 'high',
    estimatedProcessingTime: 30
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
    orderStatus: 'new',
    channel: 'pos',
    orderDate: '2024-01-22 16:45',
    notes: 'Khách hàng VIP, ưu tiên xử lý',
    createdBy: 'Staff01',
    priority: 'urgent',
    estimatedProcessingTime: 15
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
    orderStatus: 'new',
    channel: 'shopee',
    orderDate: '2024-01-22 18:20',
    notes: 'Đơn hàng từ Shopee, cần xác nhận kho',
    createdBy: 'System',
    priority: 'medium',
    estimatedProcessingTime: 45
  }
]

const priorityConfig = {
  low: { label: 'Thấp', color: 'gray' },
  medium: { label: 'Trung bình', color: 'blue' },
  high: { label: 'Cao', color: 'orange' },
  urgent: { label: 'Khẩn cấp', color: 'red' }
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

export const NewOrders: React.FC = () => {
  const [orders] = useState<Order[]>(mockNewOrders)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [selectedChannel, setSelectedChannel] = useState('all')
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all')
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.phone.includes(searchTerm)
    const matchesPriority = selectedPriority === 'all' || order.priority === selectedPriority
    const matchesChannel = selectedChannel === 'all' || order.channel === selectedChannel
    const matchesPaymentStatus = selectedPaymentStatus === 'all' || order.paymentStatus === selectedPaymentStatus
    return matchesSearch && matchesPriority && matchesChannel && matchesPaymentStatus
  })

  const stats = {
    total: orders.length,
    urgent: orders.filter(o => o.priority === 'urgent').length,
    high: orders.filter(o => o.priority === 'high').length,
    medium: orders.filter(o => o.priority === 'medium').length,
    low: orders.filter(o => o.priority === 'low').length,
    totalValue: orders.reduce((sum, o) => sum + o.finalAmount, 0),
    unpaidValue: orders.filter(o => o.paymentStatus === 'unpaid').reduce((sum, o) => sum + o.finalAmount, 0),
    avgProcessingTime: orders.reduce((sum, o) => sum + o.estimatedProcessingTime, 0) / orders.length
  }

  const getPriorityInfo = (priority: string) => {
    return priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.low
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

  const handleProcessSelected = () => {
    if (selectedOrders.length > 0) {
      // Process selected orders
      console.log('Processing orders:', selectedOrders)
    }
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

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const orderDate = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} phút trước`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} giờ trước`
    } else {
      return `${Math.floor(diffInMinutes / 1440)} ngày trước`
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-600" />
            Đơn hàng mới (chờ xử lý)
          </h1>
          <p className="text-gray-600 mt-2">
            Quản lý các đơn hàng mới cần được xử lý và xác nhận
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={selectedOrders.length === 0} onClick={handleProcessSelected}>
            <Zap className="w-4 h-4 mr-2" />
            Xử lý hàng loạt ({selectedOrders.length})
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
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              <p className="text-xs text-gray-500">Tổng đơn mới</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
              <p className="text-xs text-gray-500">Khẩn cấp</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.high}</p>
              <p className="text-xs text-gray-500">Ưu tiên cao</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.medium}</p>
              <p className="text-xs text-gray-500">Trung bình</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{stats.low}</p>
              <p className="text-xs text-gray-500">Thấp</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">
                {(stats.totalValue / 1000000000).toFixed(1)}B
              </p>
              <p className="text-xs text-gray-500">Tổng giá trị</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {(stats.unpaidValue / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-gray-500">Chưa thanh toán</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {Math.round(stats.avgProcessingTime)}m
              </p>
              <p className="text-xs text-gray-500">Thời gian TB</p>
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
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả độ ưu tiên</option>
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả kênh</option>
                {Object.entries(channelConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              <select
                value={selectedPaymentStatus}
                onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả thanh toán</option>
                <option value="paid">Đã thanh toán</option>
                <option value="unpaid">Chưa thanh toán</option>
                <option value="partial">Thanh toán một phần</option>
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
          const priorityInfo = getPriorityInfo(order.priority)
          const channelInfo = getChannelInfo(order.channel)
          
          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className={`hover:shadow-lg transition-shadow ${
                order.priority === 'urgent' ? 'border-red-200 bg-red-50' : 
                order.priority === 'high' ? 'border-orange-200 bg-orange-50' : ''
              }`}>
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
                          {getTimeAgo(order.orderDate)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className={`bg-${priorityInfo.color}-100 text-${priorityInfo.color}-800`}>
                        {priorityInfo.label}
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
                      <p className="text-2xl font-bold text-green-600">
                        {order.estimatedProcessingTime}m
                      </p>
                      <p className="text-xs text-gray-500">Thời gian xử lý</p>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">Ghi chú</span>
                      </div>
                      <p className="text-sm text-yellow-700 mt-1">{order.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="w-4 h-4 mr-1" />
                      Xem
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Xử lý
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                      <XCircle className="w-4 h-4" />
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
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không có đơn hàng mới nào
            </h3>
            <p className="text-gray-600 mb-4">
              Tất cả đơn hàng đã được xử lý hoặc thử thay đổi bộ lọc
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
