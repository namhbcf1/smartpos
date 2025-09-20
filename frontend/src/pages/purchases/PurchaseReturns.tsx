import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  RotateCcw, Plus, Search, Filter, Download, Eye, Edit, Trash2,
  Clock, AlertCircle, CheckCircle, XCircle, Truck, Building2,
  DollarSign, Calendar, User, Phone, Mail, FileText, CreditCard,
  TrendingUp, TrendingDown, BarChart3, PieChart, Package, AlertTriangle
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/badge'

interface ReturnOrder {
  id: string
  returnNumber: string
  purchaseOrderId: string
  purchaseOrderNumber: string
  receiptId: string
  receiptNumber: string
  supplierId: string
  supplierName: string
  supplierPhone: string
  supplierEmail: string
  returnDate: string
  returnReason: 'defective' | 'wrong_item' | 'overstock' | 'damaged' | 'expired' | 'other'
  returnType: 'refund' | 'exchange' | 'credit'
  status: 'pending' | 'approved' | 'shipped' | 'received' | 'completed' | 'rejected'
  totalAmount: number
  refundAmount: number
  items: {
    id: string
    productName: string
    sku: string
    quantity: number
    unitPrice: number
    totalPrice: number
    condition: 'defective' | 'damaged' | 'good' | 'expired'
    reason: string
    photos?: string[]
  }[]
  notes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  approvedBy?: string
  approvedAt?: string
  shippingMethod: string
  trackingNumber?: string
  expectedReturnDate?: string
  actualReturnDate?: string
}

const mockReturnOrders: ReturnOrder[] = [
  {
    id: '1',
    returnNumber: 'RT-2024-001',
    purchaseOrderId: 'PO-2024-001',
    purchaseOrderNumber: 'PO-2024-001',
    receiptId: 'RC-2024-001',
    receiptNumber: 'RC-2024-001',
    supplierId: 'SUP-001',
    supplierName: 'Công ty TNHH ABC',
    supplierPhone: '0241234567',
    supplierEmail: 'contact@abc.com',
    returnDate: '2024-01-26',
    returnReason: 'defective',
    returnType: 'refund',
    status: 'completed',
    totalAmount: 2500000,
    refundAmount: 2500000,
    items: [
      {
        id: '1',
        productName: 'iPhone 15 Pro Max 256GB',
        sku: 'IPH15PM256',
        quantity: 1,
        unitPrice: 2500000,
        totalPrice: 2500000,
        condition: 'defective',
        reason: 'Màn hình bị lỗi pixel',
        photos: ['defect1.jpg', 'defect2.jpg']
      }
    ],
    notes: 'Sản phẩm có lỗi từ nhà sản xuất',
    createdBy: 'Nguyễn Văn A',
    createdAt: '2024-01-26 09:30:00',
    updatedAt: '2024-01-28 14:15:00',
    approvedBy: 'Trần Thị B',
    approvedAt: '2024-01-26 10:15:00',
    shippingMethod: 'Giao hàng nhanh',
    trackingNumber: 'GHN987654321',
    expectedReturnDate: '2024-01-28',
    actualReturnDate: '2024-01-28'
  },
  {
    id: '2',
    returnNumber: 'RT-2024-002',
    purchaseOrderId: 'PO-2024-002',
    purchaseOrderNumber: 'PO-2024-002',
    receiptId: 'RC-2024-002',
    receiptNumber: 'RC-2024-002',
    supplierId: 'SUP-002',
    supplierName: 'Nhà phân phối XYZ',
    supplierPhone: '0287654321',
    supplierEmail: 'sales@xyz.com',
    returnDate: '2024-01-27',
    returnReason: 'wrong_item',
    returnType: 'exchange',
    status: 'shipped',
    totalAmount: 1800000,
    refundAmount: 0,
    items: [
      {
        id: '2',
        productName: 'Samsung Galaxy S24 Ultra',
        sku: 'SGS24U',
        quantity: 1,
        unitPrice: 1800000,
        totalPrice: 1800000,
        condition: 'good',
        reason: 'Giao sai màu sản phẩm'
      }
    ],
    notes: 'Khách hàng yêu cầu đổi màu khác',
    createdBy: 'Lê Văn C',
    createdAt: '2024-01-27 11:20:00',
    updatedAt: '2024-01-28 16:30:00',
    approvedBy: 'Nguyễn Thị D',
    approvedAt: '2024-01-27 14:00:00',
    shippingMethod: 'Chuyển phát nhanh',
    trackingNumber: 'VTP123456789',
    expectedReturnDate: '2024-01-30'
  }
]

const statusConfig = {
  pending: { label: 'Chờ duyệt', color: 'yellow', icon: Clock },
  approved: { label: 'Đã duyệt', color: 'blue', icon: CheckCircle },
  shipped: { label: 'Đã gửi', color: 'orange', icon: Truck },
  received: { label: 'Đã nhận', color: 'green', icon: Package },
  completed: { label: 'Hoàn thành', color: 'green', icon: CheckCircle },
  rejected: { label: 'Từ chối', color: 'red', icon: XCircle }
}

const reasonConfig = {
  defective: { label: 'Lỗi sản phẩm', color: 'red' },
  wrong_item: { label: 'Sai sản phẩm', color: 'orange' },
  overstock: { label: 'Tồn kho', color: 'blue' },
  damaged: { label: 'Hư hỏng', color: 'red' },
  expired: { label: 'Hết hạn', color: 'gray' },
  other: { label: 'Khác', color: 'gray' }
}

const typeConfig = {
  refund: { label: 'Hoàn tiền', color: 'green' },
  exchange: { label: 'Đổi hàng', color: 'blue' },
  credit: { label: 'Tín dụng', color: 'purple' }
}

export const PurchaseReturns: React.FC = () => {
  const [returns] = useState<ReturnOrder[]>(mockReturnOrders)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedSupplier, setSelectedSupplier] = useState('all')
  const [selectedReason, setSelectedReason] = useState('all')
  const [selectedType, setSelectedType] = useState('all')

  const filteredReturns = returns.filter(returnOrder => {
    const matchesSearch = returnOrder.returnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         returnOrder.purchaseOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         returnOrder.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         returnOrder.createdBy.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || returnOrder.status === selectedStatus
    const matchesSupplier = selectedSupplier === 'all' || returnOrder.supplierId === selectedSupplier
    const matchesReason = selectedReason === 'all' || returnOrder.returnReason === selectedReason
    const matchesType = selectedType === 'all' || returnOrder.returnType === selectedType
    return matchesSearch && matchesStatus && matchesSupplier && matchesReason && matchesType
  })

  const stats = {
    totalReturns: returns.length,
    totalAmount: returns.reduce((sum, r) => sum + r.totalAmount, 0),
    refundAmount: returns.reduce((sum, r) => sum + r.refundAmount, 0),
    pendingReturns: returns.filter(r => r.status === 'pending').length,
    completedReturns: returns.filter(r => r.status === 'completed').length,
    rejectedReturns: returns.filter(r => r.status === 'rejected').length,
    totalItems: returns.reduce((sum, r) => sum + r.items.length, 0)
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
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
  }

  const getReasonInfo = (reason: string) => {
    return reasonConfig[reason as keyof typeof reasonConfig] || reasonConfig.other
  }

  const getTypeInfo = (type: string) => {
    return typeConfig[type as keyof typeof typeConfig] || typeConfig.refund
  }

  const getDaysUntilReturn = (returnDate: string) => {
    const today = new Date()
    const returnD = new Date(returnDate)
    const diffTime = returnD.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <RotateCcw className="w-8 h-8 text-blue-600" />
            Trả hàng NCC
          </h1>
          <p className="text-gray-600 mt-2">
            Quản lý và theo dõi việc trả hàng cho nhà cung cấp
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Xuất Excel
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Tạo đơn trả
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalReturns}
              </p>
              <p className="text-xs text-gray-500">Tổng đơn trả</p>
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
                {formatCurrency(stats.refundAmount)}
              </p>
              <p className="text-xs text-gray-500">Hoàn tiền</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.pendingReturns}</p>
              <p className="text-xs text-gray-500">Chờ duyệt</p>
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
                  placeholder="Tìm kiếm theo số đơn trả, đơn mua, nhà cung cấp..."
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
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="shipped">Đã gửi</option>
                <option value="received">Đã nhận</option>
                <option value="completed">Hoàn thành</option>
                <option value="rejected">Từ chối</option>
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
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              >
                <option value="all">Tất cả lý do</option>
                <option value="defective">Lỗi sản phẩm</option>
                <option value="wrong_item">Sai sản phẩm</option>
                <option value="overstock">Tồn kho</option>
                <option value="damaged">Hư hỏng</option>
                <option value="expired">Hết hạn</option>
                <option value="other">Khác</option>
              </select>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              >
                <option value="all">Tất cả loại</option>
                <option value="refund">Hoàn tiền</option>
                <option value="exchange">Đổi hàng</option>
                <option value="credit">Tín dụng</option>
              </select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Bộ lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Returns Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đơn trả
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đơn mua
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nhà cung cấp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lý do
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày trả
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReturns.map((returnOrder) => {
                  const statusInfo = getStatusInfo(returnOrder.status)
                  const StatusIcon = statusInfo.icon
                  const reasonInfo = getReasonInfo(returnOrder.returnReason)
                  const typeInfo = getTypeInfo(returnOrder.returnType)
                  
                  return (
                    <tr key={returnOrder.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {returnOrder.returnNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(returnOrder.returnDate)}
                          </div>
                          <div className="text-xs text-gray-400">
                            Tạo bởi: {returnOrder.createdBy}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {returnOrder.purchaseOrderNumber}
                          </div>
                          <div className="text-xs text-gray-500">
                            {returnOrder.receiptNumber}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {returnOrder.supplierName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {returnOrder.supplierId}
                          </div>
                          <div className="text-xs text-gray-400">
                            {returnOrder.supplierPhone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={`bg-${reasonInfo.color}-100 text-${reasonInfo.color}-800`}>
                          {reasonInfo.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={`bg-${typeInfo.color}-100 text-${typeInfo.color}-800`}>
                          {typeInfo.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(returnOrder.totalAmount)}
                        </div>
                        {returnOrder.refundAmount > 0 && (
                          <div className="text-xs text-green-600">
                            Hoàn: {formatCurrency(returnOrder.refundAmount)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={`bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(returnOrder.returnDate)}
                        </div>
                        {returnOrder.expectedReturnDate && (
                          <div className="text-xs text-gray-500">
                            Dự kiến: {formatDate(returnOrder.expectedReturnDate)}
                          </div>
                        )}
                        {returnOrder.trackingNumber && (
                          <div className="text-xs text-blue-600">
                            {returnOrder.trackingNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          {returnOrder.status === 'pending' && (
                            <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700">
                              <CheckCircle className="w-4 h-4" />
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

      {filteredReturns.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <RotateCcw className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không tìm thấy đơn trả nào
            </h3>
            <p className="text-gray-600 mb-4">
              Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tạo đơn trả đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
export default PurchaseReturns
