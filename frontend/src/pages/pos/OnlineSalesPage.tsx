import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import api from '../../services/api/client'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import {
  Globe,
  Wifi,
  WifiOff,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Eye,
  Check,
  X,
  Clock,
  Truck,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  Filter,
  Search,
  Download,
  Bell,
  MessageSquare,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  Smartphone,
  Monitor
} from 'lucide-react'
import toast from 'react-hot-toast'

interface OnlineOrder {
  id: string
  order_number: string
  customer: {
    name: string
    email: string
    phone: string
    address: string
  }
  items: Array<{
    id: string
    name: string
    sku: string
    quantity: number
    unit_price: number
    total_price: number
  }>
  total_amount: number
  payment_method: string
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  order_status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  created_at: number
  updated_at: number
  platform: 'website' | 'mobile_app' | 'facebook' | 'shopee' | 'lazada' | 'tiki'
  notes?: string
  tracking_number?: string
  estimated_delivery?: number
}

interface OnlineStats {
  total_orders: number
  total_revenue: number
  pending_orders: number
  processing_orders: number
  completed_orders: number
  avg_order_value: number
  conversion_rate: number
  platform_breakdown: Array<{
    platform: string
    orders: number
    revenue: number
  }>
  hourly_sales: Array<{
    hour: number
    orders: number
    revenue: number
  }>
}

interface OnlineSalesPageProps {
  // Real-time sales monitoring
}

const OnlineSalesPage: React.FC<OnlineSalesPageProps> = () => {
  const [orders, setOrders] = useState<OnlineOrder[]>([])
  const [stats, setStats] = useState<OnlineStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null)
  const [showOrderDetail, setShowOrderDetail] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<{from?: string; to?: string}>({})
  const isOnline = useOnlineStatus()

  const exportToCSV = (rows: Record<string, any>[], filename: string) => {
    if (!rows || rows.length === 0) return
    const headerSet = rows.reduce<Set<string>>((set, row) => {
      Object.keys(row).forEach((k) => set.add(k))
      return set
    }, new Set<string>())
    const headers = Array.from(headerSet)
    const csv = [headers.join(',')]
      .concat(rows.map(r => headers.map(h => JSON.stringify((r as any)[h] ?? '')).join(',')))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Polling only (reuse existing Worker/REST); no WS dependency
  useEffect(() => {
    if (!isOnline) return
    loadOnlineData()
    const interval = setInterval(loadOnlineData, 30000)
    return () => clearInterval(interval)
  }, [isOnline, statusFilter, platformFilter, paymentFilter, dateRange.from, dateRange.to])

  const loadOnlineData = async () => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        api.get('/online-orders', {
          params: {
            limit: 100,
            include_customer: true,
            include_items: true,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            platform: platformFilter !== 'all' ? platformFilter : undefined,
            payment_status: paymentFilter !== 'all' ? paymentFilter : undefined,
            from: dateRange.from || undefined,
            to: dateRange.to || undefined
          }
        }),
        api.get('/online-stats', {
          params: {
            range: 'today',
            include_platforms: true,
            include_hourly: true
          }
        })
      ])

      setOrders(ordersRes.data.data || [])
      setStats(statsRes.data || null)
    } catch (error) {
      console.error('Failed to load online data:', error)
      toast.error('Không thể tải dữ liệu bán hàng online')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setActionLoading(orderId)
    try {
      await api.patch(`/online-orders/${orderId}`, {
        order_status: newStatus
      })
      toast.success('Đã cập nhật trạng thái đơn hàng')
      await loadOnlineData()
    } catch (error) {
      console.error('Failed to update order status:', error)
      toast.error('Không thể cập nhật trạng thái đơn hàng')
    } finally {
      setActionLoading(null)
    }
  }

  const confirmOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, 'confirmed')
  }

  const processOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, 'processing')
  }

  const shipOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, 'shipped')
  }

  const cancelOrder = async (orderId: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return
    await updateOrderStatus(orderId, 'cancelled')
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.customer.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.order_status === statusFilter
    const matchesPlatform = platformFilter === 'all' || order.platform === platformFilter
    const matchesPayment = paymentFilter === 'all' || order.payment_status === paymentFilter
    const matchesDate = (() => {
      if (!dateRange.from && !dateRange.to) return true
      const created = new Date(order.created_at * 1000)
      if (dateRange.from && created < new Date(dateRange.from)) return false
      if (dateRange.to) {
        const toDate = new Date(dateRange.to)
        toDate.setHours(23,59,59,999)
        if (created > toDate) return false
      }
      return true
    })()

    return matchesSearch && matchesStatus && matchesPlatform && matchesPayment && matchesDate
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-purple-100 text-purple-800'
      case 'shipped': return 'bg-indigo-100 text-indigo-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'  
      default: return 'bg-gray-100 text-gray-800'  
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'website': return <Monitor className="w-4 h-4" />
      case 'mobile_app': return <Smartphone className="w-4 h-4" />
      case 'facebook': return <MessageSquare className="w-4 h-4" />
      default: return <Globe className="w-4 h-4" />
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'website': return 'bg-blue-100 text-blue-800'
      case 'mobile_app': return 'bg-green-100 text-green-800'
      case 'facebook': return 'bg-indigo-100 text-indigo-800'
      case 'shopee': return 'bg-orange-100 text-orange-800'
      case 'lazada': return 'bg-purple-100 text-purple-800'
      case 'tiki': return 'bg-cyan-100 text-cyan-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isOnline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100  flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 p-8 bg-white rounded-2xl shadow-2xl max-w-md mx-4"
        >
          <div className="mx-auto w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <WifiOff size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Yêu cầu kết nối internet</h1>
            <p className="text-gray-600">
              Tính năng bán hàng online cần kết nối internet để hoạt động
            </p>
          </div>
          <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Thử lại
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 ">
      {/* Enhanced Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 px-6 py-6 sticky top-0 z-40"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Globe className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Bán hàng Online
              </h1>
              <p className="text-gray-600 flex items-center space-x-2">
                <Wifi className="w-4 h-4 text-green-500" />
                <span>Theo dõi đơn hàng trực tuyến</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={loadOnlineData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
            <Button variant="outline" onClick={() => {
              const rows = filteredOrders.map(o => ({
                id: o.id,
                order_number: o.order_number,
                customer_name: o.customer.name,
                customer_email: o.customer.email,
                total_amount: o.total_amount,
                payment_method: o.payment_method,
                payment_status: o.payment_status,
                order_status: o.order_status,
                platform: o.platform,
                created_at: new Date(o.created_at * 1000).toISOString()
              }))
              exportToCSV(rows, `online_orders_${new Date().toISOString().slice(0,10)}.csv`)
            }}>
              <Download className="w-4 h-4 mr-2" />
              Xuất báo cáo
            </Button>
            <Button variant="outline" onClick={() => {
              if (!('Notification' in window)) {
                toast.error('Trình duyệt không hỗ trợ thông báo')
                return
              }
              if (Notification.permission === 'granted') {
                new Notification('Thông báo bán hàng online', { body: 'Bạn sẽ nhận được cập nhật đơn hàng theo thời gian thực.' })
              } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then((perm) => {
                  if (perm === 'granted') new Notification('Đã bật thông báo!')
                })
              }
            }}>
              <Bell className="w-4 h-4 mr-2" />
              Thông báo
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="p-6 space-y-6">
        {/* Real-time Statistics */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Tổng đơn hàng</p>
                    <p className="text-3xl font-bold">{stats.total_orders}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <TrendingUp className="w-4 h-4 text-blue-200" />
                      <span className="text-blue-200 text-sm">+12% hôm nay</span>
                    </div>
                  </div>
                  <ShoppingCart className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Doanh thu</p>
                    <p className="text-2xl font-bold">{stats.total_revenue?.toLocaleString('vi-VN')} ₫</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <TrendingUp className="w-4 h-4 text-green-200" />
                      <span className="text-green-200 text-sm">+8.5% hôm nay</span>
                    </div>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Đơn chờ xử lý</p>
                    <p className="text-3xl font-bold">{stats.pending_orders}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Clock className="w-4 h-4 text-purple-200" />
                      <span className="text-purple-200 text-sm">Cần xử lý</span>
                    </div>
                  </div>
                  <AlertCircle className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Giá trị TB</p>
                    <p className="text-2xl font-bold">{stats.avg_order_value?.toLocaleString('vi-VN')} ₫</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Target className="w-4 h-4 text-orange-200" />
                      <span className="text-orange-200 text-sm">Tỷ lệ chuyển đổi: {stats.conversion_rate}%</span>
                    </div>
                  </div>
                  <Award className="w-8 h-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Platform Performance */}
        {stats?.platform_breakdown && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="w-5 h-5 text-blue-600" />
                  <span>Hiệu suất theo nền tảng</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.platform_breakdown.map((platform) => (
                    <div key={platform.platform} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getPlatformIcon(platform.platform)}
                        <span className="font-medium capitalize">{platform.platform.replace('_', ' ')}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{platform.orders} đơn</div>
                        <div className="text-sm text-gray-500">{platform.revenue?.toLocaleString('vi-VN')} ₫</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <span>Doanh số theo giờ</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.hourly_sales?.slice(0, 6).map((hour) => (
                    <div key={hour.hour} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {hour.hour}:00 - {hour.hour + 1}:00
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{ width: `${(hour.orders / Math.max(...stats.hourly_sales.map(h => h.orders))) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-8">{hour.orders}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-lg">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm đơn hàng..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Chờ xử lý</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="processing">Đang xử lý</option>
                  <option value="shipped">Đã gửi hàng</option>
                  <option value="delivered">Đã giao</option>
                  <option value="cancelled">Đã hủy</option>
                </select>

                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tất cả nền tảng</option>
                  <option value="website">Website</option>
                  <option value="mobile_app">Mobile App</option>
                  <option value="facebook">Facebook</option>
                  <option value="shopee">Shopee</option>
                  <option value="lazada">Lazada</option>
                  <option value="tiki">Tiki</option>
                </select>

                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tất cả thanh toán</option>
                  <option value="paid">Đã thanh toán</option>
                  <option value="pending">Chưa thanh toán</option>
                  <option value="failed">Thất bại</option>
                  <option value="refunded">Hoàn tiền</option>
                </select>

                <Button variant="outline" className="w-full" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
                  <Filter className="w-4 h-4 mr-2" />
                  Lọc nâng cao
                </Button>
              </div>

              {showAdvancedFilters && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Từ ngày</label>
                    <input type="date" value={dateRange.from || ''} onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Đến ngày</label>
                    <input type="date" value={dateRange.to || ''} onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900" />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full" onClick={loadOnlineData}>
                      Áp dụng
                    </Button>
                  </div>
                  <div className="flex items-end">
                    <Button variant="ghost" className="w-full" onClick={() => { setDateRange({}); setPaymentFilter('all'); setStatusFilter('all'); setPlatformFilter('all'); setSearchQuery(''); }}>
                      Xóa bộ lọc
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Orders List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  <span>Đơn hàng online</span>
                  <span className="px-2 py-1 bg-blue-100  text-blue-700 text-sm rounded-full">
                    {filteredOrders.length}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Activity className="w-4 h-4" />
                  <span>Cập nhật 30s trước</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
                  <p className="text-gray-500">Đang tải đơn hàng...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuery || statusFilter !== 'all' || platformFilter !== 'all'
                      ? 'Không tìm thấy đơn hàng'
                      : 'Chưa có đơn hàng online'}
                  </h3>
                  <p className="text-gray-500">
                    {searchQuery || statusFilter !== 'all' || platformFilter !== 'all'
                      ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                      : 'Các đơn hàng từ website và ứng dụng sẽ hiển thị ở đây'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {filteredOrders.map((order, index) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="border-0 bg-gray-50 hover:shadow-lg transition-all duration-200">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-4 mb-3">
                                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                                    {getPlatformIcon(order.platform)}
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                      #{order.order_number}
                                    </h3>
                                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                                      <div className="flex items-center space-x-1">
                                        <Users className="w-4 h-4" />
                                        <span>{order.customer.name}</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{new Date(order.created_at * 1000).toLocaleString('vi-VN')}</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <Package className="w-4 h-4" />
                                        <span>{order.items.length} sản phẩm</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-3 mb-3">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                                    {order.order_status === 'pending' && 'Chờ xử lý'}
                                    {order.order_status === 'confirmed' && 'Đã xác nhận'}
                                    {order.order_status === 'processing' && 'Đang xử lý'}
                                    {order.order_status === 'shipped' && 'Đã gửi hàng'}
                                    {order.order_status === 'delivered' && 'Đã giao'}
                                    {order.order_status === 'cancelled' && 'Đã hủy'}
                                  </span>
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPlatformColor(order.platform)}`}>
                                    {order.platform.replace('_', ' ').toUpperCase()}
                                  </span>
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    order.payment_status === 'paid'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                  </span>
                                </div>

                                {order.notes && (
                                  <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-700">
                                      <strong>Ghi chú:</strong> {order.notes}
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center space-x-4">
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-green-600">
                                    {order.total_amount?.toLocaleString('vi-VN')} ₫
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {order.payment_method}
                                  </div>
                                  {order.tracking_number && (
                                    <div className="text-xs text-blue-600 mt-1">
                                      Mã vận đơn: {order.tracking_number}
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col space-y-2">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedOrder(order)
                                      setShowOrderDetail(true)
                                    }}
                                    variant="outline"
                                    className="w-24"
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Xem
                                  </Button>

                                  {order.order_status === 'pending' && (
                                    <Button
                                      size="sm"
                                      onClick={() => confirmOrder(order.id)}
                                      disabled={actionLoading === order.id}
                                      className="w-24 bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                      {actionLoading === order.id ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <>
                                          <Check className="w-4 h-4 mr-1" />
                                          Xác nhận
                                        </>
                                      )}
                                    </Button>
                                  )}

                                  {order.order_status === 'confirmed' && (
                                    <Button
                                      size="sm"
                                      onClick={() => processOrder(order.id)}
                                      disabled={actionLoading === order.id}
                                      className="w-24 bg-purple-600 hover:bg-purple-700 text-white"
                                    >
                                      {actionLoading === order.id ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <>
                                          <Package className="w-4 h-4 mr-1" />
                                          Xử lý
                                        </>
                                      )}
                                    </Button>
                                  )}

                                  {order.order_status === 'processing' && (
                                    <Button
                                      size="sm"
                                      onClick={() => shipOrder(order.id)}
                                      disabled={actionLoading === order.id}
                                      className="w-24 bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                      {actionLoading === order.id ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <>
                                          <Truck className="w-4 h-4 mr-1" />
                                          Gửi hàng
                                        </>
                                      )}
                                    </Button>
                                  )}

                                  {['pending', 'confirmed'].includes(order.order_status) && (
                                    <Button
                                      size="sm"
                                      onClick={() => cancelOrder(order.id)}
                                      disabled={actionLoading === order.id}
                                      variant="outline"
                                      className="w-24 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <X className="w-4 h-4 mr-1" />
                                      Hủy
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {showOrderDetail && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50 ">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Chi tiết đơn hàng #{selectedOrder.order_number}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Đặt hàng lúc {new Date(selectedOrder.created_at * 1000).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowOrderDetail(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-auto max-h-[60vh]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Customer Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="w-5 h-5" />
                        <span>Thông tin khách hàng</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{selectedOrder.customer.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{selectedOrder.customer.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{selectedOrder.customer.email}</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                          <span className="text-sm">{selectedOrder.customer.address}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Order Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <ShoppingCart className="w-5 h-5" />
                        <span>Thông tin đơn hàng</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Nền tảng:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlatformColor(selectedOrder.platform)}`}>
                            {selectedOrder.platform.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Trạng thái:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.order_status)}`}>
                            {selectedOrder.order_status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Thanh toán:</span>
                          <span className="font-medium">{selectedOrder.payment_method}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tổng tiền:</span>
                          <span className="font-bold text-green-600">{selectedOrder.total_amount?.toLocaleString('vi-VN')} ₫</span>
                        </div>
                        {selectedOrder.tracking_number && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Mã vận đơn:</span>
                            <span className="font-mono text-sm">{selectedOrder.tracking_number}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Items List */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Package className="w-5 h-5" />
                      <span>Danh sách sản phẩm</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedOrder.items?.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{item.total_price?.toLocaleString('vi-VN')} ₫</div>
                            <div className="text-sm text-gray-500">
                              {item.unit_price?.toLocaleString('vi-VN')} ₫ × {item.quantity}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                {selectedOrder.notes && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <MessageSquare className="w-5 h-5" />
                        <span>Ghi chú</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{selectedOrder.notes || 'Không có ghi chú'}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setShowOrderDetail(false)}>
                    Đóng
                  </Button>
                  {selectedOrder.order_status === 'pending' && (
                    <Button
                      onClick={() => {
                        confirmOrder(selectedOrder.id)
                        setShowOrderDetail(false)
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Xác nhận đơn hàng
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default OnlineSalesPage
