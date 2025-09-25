import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Package, Plus, Search, Filter, Download, Eye, Edit, Trash2, 
  CheckCircle, Clock, Truck, XCircle, AlertCircle, FileText,
  Phone, Mail, MapPin, CreditCard, Calendar, User, ShoppingCart,
  MoreVertical, Printer, Send, RefreshCw, TrendingUp, DollarSign
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
  shippingStatus: 'pending' | 'shipping' | 'delivered' | 'returned'
  orderStatus: 'new' | 'processing' | 'shipping' | 'completed' | 'cancelled'
  channel: 'pos' | 'website' | 'app' | 'shopee' | 'lazada' | 'facebook' | 'zalo'
  orderDate: string
  deliveryDate?: string
  notes: string
  createdBy: string
  updatedBy: string
  trackingNumber?: string
  shippingCompany?: string
}

const mockOrders: Order[] = [
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
    shippingStatus: 'shipping',
    orderStatus: 'shipping',
    channel: 'website',
    orderDate: '2024-01-22 14:30',
    deliveryDate: '2024-01-24',
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
    shippingStatus: 'pending',
    orderStatus: 'new',
    channel: 'pos',
    orderDate: '2024-01-22 16:45',
    notes: 'Khách hàng VIP, ưu tiên xử lý',
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
    shippingStatus: 'delivered',
    orderStatus: 'completed',
    channel: 'shopee',
    orderDate: '2024-01-20 10:15',
    deliveryDate: '2024-01-21',
    notes: 'Giao hàng thành công, khách hài lòng',
    createdBy: 'System',
    updatedBy: 'System',
    trackingNumber: 'SP987654321',
    shippingCompany: 'Shopee Express'
  }
]

const orderStatusConfig = {
  new: { label: 'Mới', icon: Clock, color: 'blue' },
  processing: { label: 'Đang xử lý', icon: RefreshCw, color: 'yellow' },
  shipping: { label: 'Đang giao', icon: Truck, color: 'orange' },
  completed: { label: 'Hoàn tất', icon: CheckCircle, color: 'green' },
  cancelled: { label: 'Hủy', icon: XCircle, color: 'red' }
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

export const OrdersList: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [orders] = useState<Order[]>(mockOrders)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all')
  const [selectedChannel, setSelectedChannel] = useState('all')
  const [selectedDateRange, setSelectedDateRange] = useState('all')
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  // Sync filter from path/query
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const qsStatus = params.get('status')
    if (qsStatus && Object.keys(orderStatusConfig).includes(qsStatus)) {
      setSelectedStatus(qsStatus)
      return
    }
    // Path-based: /orders/shipping etc.
    const path = location.pathname
    const pathStatus = Object.keys(orderStatusConfig).find(s => path.endsWith(`/${s}`))
    if (pathStatus) setSelectedStatus(pathStatus)
  }, [location.pathname, location.search])

  const filteredOrders = useMemo(() => orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.phone.includes(searchTerm)
    const matchesStatus = selectedStatus === 'all' || order.orderStatus === selectedStatus
    const matchesPaymentStatus = selectedPaymentStatus === 'all' || order.paymentStatus === selectedPaymentStatus
    const matchesChannel = selectedChannel === 'all' || order.channel === selectedChannel
    return matchesSearch && matchesStatus && matchesPaymentStatus && matchesChannel
  }), [orders, searchTerm, selectedStatus, selectedPaymentStatus, selectedChannel])

  const stats = {
    total: orders.length,
    new: orders.filter(o => o.orderStatus === 'new').length,
    processing: orders.filter(o => o.orderStatus === 'processing').length,
    shipping: orders.filter(o => o.orderStatus === 'shipping').length,
    completed: orders.filter(o => o.orderStatus === 'completed').length,
    cancelled: orders.filter(o => o.orderStatus === 'cancelled').length,
    totalRevenue: orders.reduce((sum, o) => sum + o.finalAmount, 0),
    unpaidAmount: orders.filter(o => o.paymentStatus === 'unpaid').reduce((sum, o) => sum + o.finalAmount, 0)
  }

  const getStatusInfo = (status: string) => {
    return orderStatusConfig[status as keyof typeof orderStatusConfig] || orderStatusConfig.new
  }

  const getPaymentStatusInfo = (status: string) => {
    return paymentStatusConfig[status as keyof typeof paymentStatusConfig] || paymentStatusConfig.unpaid
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" />
            Danh sách đơn hàng
          </h1>
          <p className="text-gray-600 mt-2">
            Quản lý tất cả đơn hàng từ các kênh bán hàng khác nhau
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            const header = 'orderNumber,customer,phone,finalAmount,status\n'
            const rows = filteredOrders.map(o => `${o.orderNumber},${o.customer.name},${o.customer.phone},${o.finalAmount},${o.orderStatus}`).join('\n')
            const csv = header + rows
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `orders_${new Date().toISOString().slice(0,10)}.csv`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }}>
            <Download className="w-4 h-4 mr-2" />
            Xuất Excel
          </Button>
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Xuất PDF
          </Button>
          <Button onClick={() => navigate('/orders/new')}>
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
              <p className="text-xs text-gray-500">Tổng đơn hàng</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
              <p className="text-xs text-gray-500">Mới</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.processing}</p>
              <p className="text-xs text-gray-500">Đang xử lý</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.shipping}</p>
              <p className="text-xs text-gray-500">Đang giao</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-xs text-gray-500">Hoàn tất</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              <p className="text-xs text-gray-500">Hủy</p>
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
              <p className="text-2xl font-bold text-red-600">
                {(stats.unpaidAmount / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-gray-500">Chưa thanh toán</p>
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
                value={selectedStatus}
                onChange={(e) => {
                  const v = e.target.value
                  setSelectedStatus(v)
                  const base = '/orders'
                  if (v === 'all') navigate(base)
                  else navigate(`${base}/${v}`)
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả trạng thái</option>
                {Object.entries(orderStatusConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              <select
                value={selectedPaymentStatus}
                onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả thanh toán</option>
                {Object.entries(paymentStatusConfig).map(([key, config]) => (
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
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã đơn hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thanh toán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vận chuyển
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày đặt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const statusInfo = getStatusInfo(order.orderStatus)
                  const StatusIcon = statusInfo.icon
                  const paymentStatusInfo = getPaymentStatusInfo(order.paymentStatus)
                  const channelInfo = getChannelInfo(order.channel)
                  
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => handleSelectOrder(order.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.orderNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            <Badge className={`bg-${channelInfo.color}-100 text-${channelInfo.color}-800`}>
                              {channelInfo.label}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.customer.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.customer.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {order.products.slice(0, 2).map((product, index) => (
                            <div key={index} className="truncate">
                              {product.name} x{product.quantity}
                            </div>
                          ))}
                          {order.products.length > 2 && (
                            <div className="text-gray-500">
                              +{order.products.length - 2} sản phẩm khác
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(order.finalAmount)}
                        </div>
                        {order.discount > 0 && (
                          <div className="text-sm text-green-600">
                            -{formatCurrency(order.discount)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={`bg-${paymentStatusInfo.color}-100 text-${paymentStatusInfo.color}-800`}>
                          {paymentStatusInfo.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.shippingStatus === 'delivered' && 'Giao thành công'}
                          {order.shippingStatus === 'shipping' && 'Đang giao'}
                          {order.shippingStatus === 'pending' && 'Chờ giao'}
                          {order.shippingStatus === 'returned' && 'Hoàn trả'}
                        </div>
                        {order.trackingNumber && (
                          <div className="text-sm text-gray-500">
                            {order.trackingNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.orderDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={`bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/orders/detail/${order.id}`)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => window.print()}>
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => navigate(`/orders/${order.id}`)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => alert(`Hủy đơn ${order.orderNumber}`)}>
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không tìm thấy đơn hàng nào
            </h3>
            <p className="text-gray-600 mb-4">
              Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tạo đơn hàng đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
