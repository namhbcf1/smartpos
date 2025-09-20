import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ShoppingCart, Plus, Search, Filter, Download, Eye, Edit, Trash2,
  Clock, AlertCircle, CheckCircle, XCircle, Truck, Package, Building2,
  DollarSign, Calendar, User, Phone, Mail, FileText, CreditCard,
  TrendingUp, TrendingDown, BarChart3, PieChart
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/badge'

interface PurchaseOrder {
  id: string
  orderNumber: string
  supplierId: string
  supplierName: string
  supplierPhone: string
  supplierEmail: string
  orderDate: string
  expectedDelivery: string
  actualDelivery?: string
  status: 'draft' | 'sent' | 'confirmed' | 'shipped' | 'received' | 'cancelled'
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  items: {
    id: string
    productName: string
    sku: string
    quantity: number
    unitPrice: number
    totalPrice: number
    receivedQuantity: number
  }[]
  notes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  paymentTerms: number
  shippingMethod: string
  trackingNumber?: string
}

const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: '1',
    orderNumber: 'PO-2024-001',
    supplierId: 'SUP-001',
    supplierName: 'Công ty TNHH ABC',
    supplierPhone: '0241234567',
    supplierEmail: 'contact@abc.com',
    orderDate: '2024-01-20',
    expectedDelivery: '2024-01-25',
    actualDelivery: '2024-01-24',
    status: 'received',
    totalAmount: 5000000,
    paidAmount: 2000000,
    remainingAmount: 3000000,
    items: [
      {
        id: '1',
        productName: 'iPhone 15 Pro Max 256GB',
        sku: 'IPH15PM256',
        quantity: 5,
        unitPrice: 2500000,
        totalPrice: 12500000,
        receivedQuantity: 5
      },
      {
        id: '2',
        productName: 'MacBook Air M2',
        sku: 'MBA-M2',
        quantity: 2,
        unitPrice: 2000000,
        totalPrice: 4000000,
        receivedQuantity: 2
      }
    ],
    notes: 'Giao hàng trong giờ hành chính',
    createdBy: 'Nguyễn Văn A',
    createdAt: '2024-01-20 10:30:00',
    updatedAt: '2024-01-24 14:15:00',
    paymentTerms: 30,
    shippingMethod: 'Giao hàng nhanh',
    trackingNumber: 'GHN123456789'
  },
  {
    id: '2',
    orderNumber: 'PO-2024-002',
    supplierId: 'SUP-002',
    supplierName: 'Nhà phân phối XYZ',
    supplierPhone: '0287654321',
    supplierEmail: 'sales@xyz.com',
    orderDate: '2024-01-22',
    expectedDelivery: '2024-01-28',
    status: 'shipped',
    totalAmount: 3200000,
    paidAmount: 0,
    remainingAmount: 3200000,
    items: [
      {
        id: '3',
        productName: 'Samsung Galaxy S24 Ultra',
        sku: 'SGS24U',
        quantity: 3,
        unitPrice: 1800000,
        totalPrice: 5400000,
        receivedQuantity: 0
      }
    ],
    createdBy: 'Trần Thị B',
    createdAt: '2024-01-22 09:15:00',
    updatedAt: '2024-01-23 16:20:00',
    paymentTerms: 15,
    shippingMethod: 'Chuyển phát nhanh',
    trackingNumber: 'VTP987654321'
  }
]

const statusConfig = {
  draft: { label: 'Nháp', color: 'gray', icon: FileText },
  sent: { label: 'Đã gửi', color: 'blue', icon: Clock },
  confirmed: { label: 'Đã xác nhận', color: 'yellow', icon: CheckCircle },
  shipped: { label: 'Đã giao', color: 'orange', icon: Truck },
  received: { label: 'Đã nhận', color: 'green', icon: CheckCircle },
  cancelled: { label: 'Đã hủy', color: 'red', icon: XCircle }
}

export const PurchaseOrders: React.FC = () => {
  const [orders] = useState<PurchaseOrder[]>(mockPurchaseOrders)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedSupplier, setSelectedSupplier] = useState('all')
  const [selectedDateRange, setSelectedDateRange] = useState('all')

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus
    const matchesSupplier = selectedSupplier === 'all' || order.supplierId === selectedSupplier
    return matchesSearch && matchesStatus && matchesSupplier
  })

  const stats = {
    totalOrders: orders.length,
    totalAmount: orders.reduce((sum, o) => sum + o.totalAmount, 0),
    paidAmount: orders.reduce((sum, o) => sum + o.paidAmount, 0),
    remainingAmount: orders.reduce((sum, o) => sum + o.remainingAmount, 0),
    pendingOrders: orders.filter(o => ['draft', 'sent', 'confirmed', 'shipped'].includes(o.status)).length,
    receivedOrders: orders.filter(o => o.status === 'received').length
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const getStatusInfo = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
  }

  const getDaysUntilDelivery = (deliveryDate: string) => {
    const today = new Date()
    const delivery = new Date(deliveryDate)
    const diffTime = delivery.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-blue-600" />
            Đơn mua hàng
          </h1>
          <p className="text-gray-600 mt-2">
            Quản lý và theo dõi các đơn mua hàng từ nhà cung cấp
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Xuất Excel
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Tạo đơn mua
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalOrders}
              </p>
              <p className="text-xs text-gray-500">Tổng đơn mua</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.totalAmount)}
              </p>
              <p className="text-xs text-gray-500">Tổng giá trị</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.paidAmount)}
              </p>
              <p className="text-xs text-gray-500">Đã thanh toán</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(stats.remainingAmount)}
              </p>
              <p className="text-xs text-gray-500">Còn lại</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Tìm kiếm theo số đơn, nhà cung cấp, mã vận đơn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10">
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="draft">Nháp</option>
                <option value="sent">Đã gửi</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="shipped">Đã giao</option>
                <option value="received">Đã nhận</option>
                <option value="cancelled">Đã hủy</option>
              </select>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              >
                <option value="all">Tất cả nhà cung cấp</option>
                <option value="SUP-001">Công ty TNHH ABC</option>
                <option value="SUP-002">Nhà phân phối XYZ</option>
              </select>
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              >
                <option value="all">Tất cả thời gian</option>
                <option value="today">Hôm nay</option>
                <option value="week">Tuần này</option>
                <option value="month">Tháng này</option>
                <option value="quarter">Quý này</option>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đơn mua
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nhà cung cấp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giao hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thanh toán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const statusInfo = getStatusInfo(order.status)
                  const StatusIcon = statusInfo.icon
                  const daysUntilDelivery = getDaysUntilDelivery(order.expectedDelivery)
                  
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.orderNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(order.orderDate)}
                          </div>
                          <div className="text-xs text-gray-400">
                            Tạo bởi: {order.createdBy}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.supplierName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.supplierId}
                          </div>
                          <div className="text-xs text-gray-400">
                            {order.supplierPhone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.items.length} sản phẩm
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.items.reduce((sum, item) => sum + item.quantity, 0)} đơn vị
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(order.totalAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={`bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(order.expectedDelivery)}
                        </div>
                        {daysUntilDelivery <= 3 && daysUntilDelivery > 0 && (
                          <div className="text-xs text-orange-600">
                            Còn {daysUntilDelivery} ngày
                          </div>
                        )}
                        {order.trackingNumber && (
                          <div className="text-xs text-blue-600">
                            {order.trackingNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(order.paidAmount)} / {formatCurrency(order.totalAmount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Còn: {formatCurrency(order.remainingAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          {order.status === 'shipped' && (
                            <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700">
                              <Package className="w-4 h-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="text-blue-600 hover:text-blue-700">
                            <Truck className="w-4 h-4" />
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
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không tìm thấy đơn mua nào
            </h3>
            <p className="text-gray-600 mb-4">
              Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tạo đơn mua đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
export default PurchaseOrders
