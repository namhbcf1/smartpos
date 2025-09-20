import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Package, Plus, Search, Filter, Download, Eye, Edit, Trash2,
  Clock, AlertCircle, CheckCircle, XCircle, Truck, Building2,
  DollarSign, Calendar, User, Phone, Mail, FileText, CreditCard,
  TrendingUp, TrendingDown, BarChart3, PieChart, CheckSquare
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/badge'

interface Receipt {
  id: string
  receiptNumber: string
  purchaseOrderId: string
  purchaseOrderNumber: string
  supplierId: string
  supplierName: string
  supplierPhone: string
  supplierEmail: string
  receiptDate: string
  receivedBy: string
  status: 'pending' | 'partial' | 'completed' | 'disputed'
  totalItems: number
  receivedItems: number
  totalAmount: number
  items: {
    id: string
    productName: string
    sku: string
    orderedQuantity: number
    receivedQuantity: number
    unitPrice: number
    totalPrice: number
    condition: 'good' | 'damaged' | 'missing'
    notes?: string
  }[]
  notes?: string
  createdAt: string
  updatedAt: string
  warehouseLocation: string
  qualityCheck: boolean
  photos?: string[]
}

const mockReceipts: Receipt[] = [
  {
    id: '1',
    receiptNumber: 'RC-2024-001',
    purchaseOrderId: 'PO-2024-001',
    purchaseOrderNumber: 'PO-2024-001',
    supplierId: 'SUP-001',
    supplierName: 'Công ty TNHH ABC',
    supplierPhone: '0241234567',
    supplierEmail: 'contact@abc.com',
    receiptDate: '2024-01-24',
    receivedBy: 'Nguyễn Văn A',
    status: 'completed',
    totalItems: 7,
    receivedItems: 7,
    totalAmount: 16500000,
    items: [
      {
        id: '1',
        productName: 'iPhone 15 Pro Max 256GB',
        sku: 'IPH15PM256',
        orderedQuantity: 5,
        receivedQuantity: 5,
        unitPrice: 2500000,
        totalPrice: 12500000,
        condition: 'good'
      },
      {
        id: '2',
        productName: 'MacBook Air M2',
        sku: 'MBA-M2',
        orderedQuantity: 2,
        receivedQuantity: 2,
        unitPrice: 2000000,
        totalPrice: 4000000,
        condition: 'good'
      }
    ],
    notes: 'Hàng đầy đủ, chất lượng tốt',
    createdAt: '2024-01-24 14:15:00',
    updatedAt: '2024-01-24 14:15:00',
    warehouseLocation: 'Kho A - Tầng 1',
    qualityCheck: true,
    photos: ['photo1.jpg', 'photo2.jpg']
  },
  {
    id: '2',
    receiptNumber: 'RC-2024-002',
    purchaseOrderId: 'PO-2024-002',
    purchaseOrderNumber: 'PO-2024-002',
    supplierId: 'SUP-002',
    supplierName: 'Nhà phân phối XYZ',
    supplierPhone: '0287654321',
    supplierEmail: 'sales@xyz.com',
    receiptDate: '2024-01-25',
    receivedBy: 'Trần Thị B',
    status: 'partial',
    totalItems: 3,
    receivedItems: 2,
    totalAmount: 3600000,
    items: [
      {
        id: '3',
        productName: 'Samsung Galaxy S24 Ultra',
        sku: 'SGS24U',
        orderedQuantity: 3,
        receivedQuantity: 2,
        unitPrice: 1800000,
        totalPrice: 3600000,
        condition: 'good',
        notes: 'Thiếu 1 sản phẩm, sẽ giao bổ sung'
      }
    ],
    notes: 'Thiếu 1 sản phẩm, nhà cung cấp sẽ giao bổ sung',
    createdAt: '2024-01-25 10:30:00',
    updatedAt: '2024-01-25 10:30:00',
    warehouseLocation: 'Kho B - Tầng 2',
    qualityCheck: true
  }
]

const statusConfig = {
  pending: { label: 'Chờ nhận', color: 'yellow', icon: Clock },
  partial: { label: 'Nhận một phần', color: 'orange', icon: AlertCircle },
  completed: { label: 'Hoàn thành', color: 'green', icon: CheckCircle },
  disputed: { label: 'Có tranh chấp', color: 'red', icon: XCircle }
}

const conditionConfig = {
  good: { label: 'Tốt', color: 'green' },
  damaged: { label: 'Hỏng', color: 'red' },
  missing: { label: 'Thiếu', color: 'orange' }
}

export const PurchaseReceipts: React.FC = () => {
  const [receipts] = useState<Receipt[]>(mockReceipts)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedSupplier, setSelectedSupplier] = useState('all')
  const [selectedDateRange, setSelectedDateRange] = useState('all')

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = receipt.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receipt.purchaseOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receipt.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receipt.receivedBy.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || receipt.status === selectedStatus
    const matchesSupplier = selectedSupplier === 'all' || receipt.supplierId === selectedSupplier
    return matchesSearch && matchesStatus && matchesSupplier
  })

  const stats = {
    totalReceipts: receipts.length,
    totalAmount: receipts.reduce((sum, r) => sum + r.totalAmount, 0),
    completedReceipts: receipts.filter(r => r.status === 'completed').length,
    partialReceipts: receipts.filter(r => r.status === 'partial').length,
    pendingReceipts: receipts.filter(r => r.status === 'pending').length,
    totalItems: receipts.reduce((sum, r) => sum + r.totalItems, 0),
    receivedItems: receipts.reduce((sum, r) => sum + r.receivedItems, 0)
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

  const getConditionInfo = (condition: string) => {
    return conditionConfig[condition as keyof typeof conditionConfig] || conditionConfig.good
  }

  const getReceiptProgress = (receipt: Receipt) => {
    return Math.round((receipt.receivedItems / receipt.totalItems) * 100)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" />
            Nhận hàng
          </h1>
          <p className="text-gray-600 mt-2">
            Quản lý và theo dõi việc nhận hàng từ nhà cung cấp
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Xuất Excel
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Tạo phiếu nhận
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalReceipts}
              </p>
              <p className="text-xs text-gray-500">Tổng phiếu nhận</p>
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
              <p className="text-2xl font-bold text-green-600">{stats.completedReceipts}</p>
              <p className="text-xs text-gray-500">Hoàn thành</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.partialReceipts}</p>
              <p className="text-xs text-gray-500">Nhận một phần</p>
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
                  placeholder="Tìm kiếm theo số phiếu, đơn mua, nhà cung cấp..."
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
                <option value="pending">Chờ nhận</option>
                <option value="partial">Nhận một phần</option>
                <option value="completed">Hoàn thành</option>
                <option value="disputed">Có tranh chấp</option>
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

      {/* Receipts Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phiếu nhận
                  </th>
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
                    Tiến độ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày nhận
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReceipts.map((receipt) => {
                  const statusInfo = getStatusInfo(receipt.status)
                  const StatusIcon = statusInfo.icon
                  const progress = getReceiptProgress(receipt)
                  
                  return (
                    <tr key={receipt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {receipt.receiptNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(receipt.receiptDate)}
                          </div>
                          <div className="text-xs text-gray-400">
                            Nhận bởi: {receipt.receivedBy}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {receipt.purchaseOrderNumber}
                          </div>
                          <div className="text-xs text-gray-500">
                            {receipt.purchaseOrderId}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {receipt.supplierName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {receipt.supplierId}
                          </div>
                          <div className="text-xs text-gray-400">
                            {receipt.supplierPhone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {receipt.items.length} sản phẩm
                        </div>
                        <div className="text-xs text-gray-500">
                          {receipt.totalItems} đơn vị
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {receipt.receivedItems}/{receipt.totalItems}
                        </div>
                        <div className="text-xs text-gray-500">
                          {progress}% hoàn thành
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full"> 
                            style={{ width: `${progress}%` }}
                          ></div>
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
                          {formatDate(receipt.receiptDate)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {receipt.warehouseLocation}
                        </div>
                        {receipt.qualityCheck && (
                          <div className="text-xs text-green-600">
                            ✓ Kiểm tra chất lượng
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
                          <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700">
                            <CheckSquare className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-blue-600 hover:text-blue-700">
                            <FileText className="w-4 h-4" />
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

      {filteredReceipts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không tìm thấy phiếu nhận nào
            </h3>
            <p className="text-gray-600 mb-4">
              Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tạo phiếu nhận đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
export default PurchaseReceipts
