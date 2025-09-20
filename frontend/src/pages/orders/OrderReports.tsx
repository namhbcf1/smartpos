import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, Download, Filter, Calendar, TrendingUp, TrendingDown,
  DollarSign, Package, Users, ShoppingCart, Clock, CheckCircle,
  XCircle, AlertCircle, FileText, PieChart, LineChart, Activity
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/badge'

interface ReportData {
  summary: {
    totalOrders: number
    totalRevenue: number
    avgOrderValue: number
    totalCustomers: number
    conversionRate: number
    refundRate: number
  }
  ordersByStatus: {
    new: number
    processing: number
    shipping: number
    completed: number
    cancelled: number
  }
  ordersByChannel: {
    pos: number
    website: number
    app: number
    shopee: number
    lazada: number
    facebook: number
    zalo: number
  }
  revenueByChannel: {
    pos: number
    website: number
    app: number
    shopee: number
    lazada: number
    facebook: number
    zalo: number
  }
  dailyStats: {
    date: string
    orders: number
    revenue: number
    customers: number
  }[]
  topProducts: {
    name: string
    sku: string
    quantity: number
    revenue: number
  }[]
  topCustomers: {
    name: string
    phone: string
    orders: number
    totalSpent: number
  }[]
  paymentMethods: {
    cod: number
    bank_transfer: number
    cash: number
    online: number
  }
  timeAnalysis: {
    peakHours: number[]
    peakDays: string[]
    avgProcessingTime: number
    avgDeliveryTime: number
  }
}

const mockReportData: ReportData = {
  summary: {
    totalOrders: 1250,
    totalRevenue: 12500000000,
    avgOrderValue: 10000000,
    totalCustomers: 850,
    conversionRate: 12.5,
    refundRate: 3.2
  },
  ordersByStatus: {
    new: 45,
    processing: 78,
    shipping: 156,
    completed: 920,
    cancelled: 51
  },
  ordersByChannel: {
    pos: 320,
    website: 280,
    app: 150,
    shopee: 200,
    lazada: 120,
    facebook: 100,
    zalo: 80
  },
  revenueByChannel: {
    pos: 3500000000,
    website: 3200000000,
    app: 1800000000,
    shopee: 1500000000,
    lazada: 1200000000,
    facebook: 800000000,
    zalo: 500000000
  },
  dailyStats: [
    { date: '2024-01-15', orders: 45, revenue: 450000000, customers: 38 },
    { date: '2024-01-16', orders: 52, revenue: 520000000, customers: 42 },
    { date: '2024-01-17', orders: 38, revenue: 380000000, customers: 35 },
    { date: '2024-01-18', orders: 61, revenue: 610000000, customers: 48 },
    { date: '2024-01-19', orders: 48, revenue: 480000000, customers: 40 },
    { date: '2024-01-20', orders: 55, revenue: 550000000, customers: 45 },
    { date: '2024-01-21', orders: 42, revenue: 420000000, customers: 36 }
  ],
  topProducts: [
    { name: 'iPhone 15 Pro', sku: 'IP15P-128', quantity: 45, revenue: 1125000000 },
    { name: 'MacBook Air M2', sku: 'MBA-M2-256', quantity: 32, revenue: 896000000 },
    { name: 'Samsung Galaxy S24', sku: 'SGS24-256', quantity: 28, revenue: 616000000 },
    { name: 'AirPods Pro', sku: 'APP-2', quantity: 65, revenue: 292500000 },
    { name: 'iPad Air', sku: 'IPA-64', quantity: 22, revenue: 220000000 }
  ],
  topCustomers: [
    { name: 'Nguyễn Văn A', phone: '0123456789', orders: 15, totalSpent: 150000000 },
    { name: 'Trần Thị B', phone: '0987654321', orders: 12, totalSpent: 120000000 },
    { name: 'Lê Văn C', phone: '0369852147', orders: 10, totalSpent: 95000000 },
    { name: 'Phạm Thị D', phone: '0521478963', orders: 8, totalSpent: 80000000 },
    { name: 'Hoàng Văn E', phone: '0741852963', orders: 7, totalSpent: 75000000 }
  ],
  paymentMethods: {
    cod: 450,
    bank_transfer: 380,
    cash: 200,
    online: 220
  },
  timeAnalysis: {
    peakHours: [9, 10, 11, 14, 15, 16, 19, 20],
    peakDays: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5'],
    avgProcessingTime: 2.5,
    avgDeliveryTime: 24
  }
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

const statusConfig = {
  new: { label: 'Mới', color: 'blue' },
  processing: { label: 'Đang xử lý', color: 'yellow' },
  shipping: { label: 'Đang giao', color: 'orange' },
  completed: { label: 'Hoàn tất', color: 'green' },
  cancelled: { label: 'Hủy', color: 'red' }
}

export const OrderReports: React.FC = () => {
  const [reportData] = useState<ReportData>(mockReportData)
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [selectedChannel, setSelectedChannel] = useState('all')
  const [selectedReportType, setSelectedReportType] = useState('summary')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num)
  }

  const getChannelInfo = (channel: string) => {
    return channelConfig[channel as keyof typeof channelConfig] || channelConfig.pos
  }

  const getStatusInfo = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.new
  }

  const getPercentage = (value: number, total: number) => {
    return ((value / total) * 100).toFixed(1)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Báo cáo đơn hàng
          </h1>
          <p className="text-gray-600 mt-2">
            Phân tích và thống kê chi tiết về đơn hàng và doanh thu
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
            <BarChart3 className="w-4 h-4 mr-2" />
            Tạo báo cáo tùy chỉnh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex gap-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">7 ngày qua</option>
                <option value="30d">30 ngày qua</option>
                <option value="90d">90 ngày qua</option>
                <option value="1y">1 năm qua</option>
                <option value="custom">Tùy chọn</option>
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
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="summary">Tổng quan</option>
                <option value="detailed">Chi tiết</option>
                <option value="comparison">So sánh</option>
              </select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Áp dụng bộ lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(reportData.summary.totalOrders)}
              </p>
              <p className="text-xs text-gray-500">Tổng đơn hàng</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">+12.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">
                {(reportData.summary.totalRevenue / 1000000000).toFixed(1)}B
              </p>
              <p className="text-xs text-gray-500">Tổng doanh thu</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">+8.3%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {(reportData.summary.avgOrderValue / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-gray-500">Giá trị TB/đơn</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <TrendingDown className="w-3 h-3 text-red-600" />
                <span className="text-xs text-red-600">-2.1%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {formatNumber(reportData.summary.totalCustomers)}
              </p>
              <p className="text-xs text-gray-500">Tổng khách hàng</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">+15.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {reportData.summary.conversionRate}%
              </p>
              <p className="text-xs text-gray-500">Tỷ lệ chuyển đổi</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">+3.4%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {reportData.summary.refundRate}%
              </p>
              <p className="text-xs text-gray-500">Tỷ lệ hoàn trả</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <TrendingDown className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">-1.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Đơn hàng theo trạng thái
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(reportData.ordersByStatus).map(([status, count]) => {
                const statusInfo = getStatusInfo(status)
                const percentage = getPercentage(count, reportData.summary.totalOrders)
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full bg-${statusInfo.color}-500`}></div>
                      <span className="text-sm">{statusInfo.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{formatNumber(count)}</span>
                      <span className="text-xs text-gray-500">({percentage}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Orders by Channel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Đơn hàng theo kênh bán
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(reportData.ordersByChannel).map(([channel, count]) => {
                const channelInfo = getChannelInfo(channel)
                const percentage = getPercentage(count, reportData.summary.totalOrders)
                return (
                  <div key={channel} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full bg-${channelInfo.color}-500`}></div>
                      <span className="text-sm">{channelInfo.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{formatNumber(count)}</span>
                      <span className="text-xs text-gray-500">({percentage}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Channel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Doanh thu theo kênh bán
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(reportData.revenueByChannel).map(([channel, revenue]) => {
              const channelInfo = getChannelInfo(channel)
              const percentage = getPercentage(revenue, reportData.summary.totalRevenue)
              return (
                <div key={channel} className="text-center p-4 border rounded-lg">
                  <div className={`w-8 h-8 bg-${channelInfo.color}-100 rounded-full flex items-center justify-center mx-auto mb-2`}>
                    <div className={`w-4 h-4 bg-${channelInfo.color}-500 rounded-full`}></div>
                  </div>
                  <p className="text-sm font-medium">{channelInfo.label}</p>
                  <p className="text-lg font-bold text-gray-900">
                    {(revenue / 1000000000).toFixed(1)}B
                  </p>
                  <p className="text-xs text-gray-500">{percentage}%</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Products and Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Sản phẩm bán chạy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.topProducts.map((product, index) => (
                <div key={product.sku} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatNumber(product.quantity)}</p>
                    <p className="text-sm text-gray-500">{formatCurrency(product.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Khách hàng VIP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.topCustomers.map((customer, index) => (
                <div key={customer.phone} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-green-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-gray-500">{customer.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{customer.orders} đơn</p>
                    <p className="text-sm text-gray-500">{formatCurrency(customer.totalSpent)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Phương thức thanh toán
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(reportData.paymentMethods).map(([method, count]) => {
              const methodLabels = {
                cod: 'COD',
                bank_transfer: 'Chuyển khoản',
                cash: 'Tiền mặt',
                online: 'Online'
              }
              const methodColors = {
                cod: 'blue',
                bank_transfer: 'green',
                cash: 'yellow',
                online: 'purple'
              }
              const percentage = getPercentage(count, reportData.summary.totalOrders)
              return (
                <div key={method} className="text-center p-4 border rounded-lg">
                  <div className={`w-12 h-12 bg-${methodColors[method as keyof typeof methodColors]}-100 rounded-full flex items-center justify-center mx-auto mb-2`}>
                    <CreditCard className={`w-6 h-6 text-${methodColors[method as keyof typeof methodColors]}-600`} />
                  </div>
                  <p className="text-sm font-medium">{methodLabels[method as keyof typeof methodLabels]}</p>
                  <p className="text-2xl font-bold text-gray-900">{(amount / 1000000).toFixed(1)}M</p>
                  <p className="text-xs text-gray-500">{percentage}%</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Time Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Phân tích thời gian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium mb-3">Giờ cao điểm</h4>
              <div className="flex flex-wrap gap-2">
                {reportData.timeAnalysis.peakHours.map((hour) => (
                  <Badge key={hour} variant="outline">
                    {hour}:00
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Ngày trong tuần</h4>
              <div className="flex flex-wrap gap-2">
                {reportData.timeAnalysis.peakDays.map((day) => (
                  <Badge key={day} variant="outline">
                    {day}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Thời gian xử lý</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Xử lý trung bình</span>
                  <span className="text-sm font-medium">{reportData.timeAnalysis.avgProcessingTime}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Giao hàng trung bình</span>
                  <span className="text-sm font-medium">{reportData.timeAnalysis.avgDeliveryTime}h</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
