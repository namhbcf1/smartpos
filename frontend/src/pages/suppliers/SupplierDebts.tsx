import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Building2, DollarSign, AlertTriangle, CheckCircle, Clock, Search, Filter,
  Download, Plus, Eye, Edit, Trash2, Phone, Mail, Calendar, TrendingUp,
  TrendingDown, FileText, CreditCard, Truck, Package
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/badge'

interface SupplierDebt {
  id: string
  supplierId: string
  supplierName: string
  supplierType: 'manufacturer' | 'distributor' | 'wholesaler'
  phone: string
  email: string
  totalDebt: number
  overdueAmount: number
  lastPaymentDate: string
  lastPurchaseDate: string
  creditLimit: number
  paymentTerms: number // days
  status: 'active' | 'overdue' | 'blocked' | 'suspended'
  purchases: number
  avgPurchaseValue: number
  nextPaymentDue: string
}

const mockSupplierDebts: SupplierDebt[] = [
  {
    id: '1',
    supplierId: 'SUP-001',
    supplierName: 'Công ty TNHH ABC',
    supplierType: 'manufacturer',
    phone: '0241234567',
    email: 'contact@abc.com',
    totalDebt: 25000000,
    overdueAmount: 8000000,
    lastPaymentDate: '2024-01-10',
    lastPurchaseDate: '2024-01-18',
    creditLimit: 50000000,
    paymentTerms: 30,
    status: 'overdue',
    purchases: 15,
    avgPurchaseValue: 3500000,
    nextPaymentDue: '2024-01-25'
  },
  {
    id: '2',
    supplierId: 'SUP-002',
    supplierName: 'Nhà phân phối XYZ',
    supplierType: 'distributor',
    phone: '0287654321',
    email: 'sales@xyz.com',
    totalDebt: 12000000,
    overdueAmount: 0,
    lastPaymentDate: '2024-01-20',
    lastPurchaseDate: '2024-01-22',
    creditLimit: 20000000,
    paymentTerms: 15,
    status: 'active',
    purchases: 8,
    avgPurchaseValue: 2000000,
    nextPaymentDue: '2024-02-06'
  },
  {
    id: '3',
    supplierId: 'SUP-003',
    supplierName: 'Công ty Sản xuất DEF',
    supplierType: 'manufacturer',
    phone: '0256789012',
    email: 'info@def.com',
    totalDebt: 45000000,
    overdueAmount: 20000000,
    lastPaymentDate: '2024-01-05',
    lastPurchaseDate: '2024-01-15',
    creditLimit: 60000000,
    paymentTerms: 45,
    status: 'overdue',
    purchases: 22,
    avgPurchaseValue: 4000000,
    nextPaymentDue: '2024-01-30'
  }
]

const supplierTypeConfig = {
  manufacturer: { label: 'Nhà sản xuất', color: 'blue' },
  distributor: { label: 'Nhà phân phối', color: 'green' },
  wholesaler: { label: 'Bán sỉ', color: 'purple' }
}

const statusConfig = {
  active: { label: 'Hoạt động', color: 'green', icon: CheckCircle },
  overdue: { label: 'Quá hạn', color: 'red', icon: AlertTriangle },
  blocked: { label: 'Khóa', color: 'gray', icon: Clock },
  suspended: { label: 'Tạm dừng', color: 'orange', icon: Clock }
}

export const SupplierDebts: React.FC = () => {
  const [debts] = useState<SupplierDebt[]>(mockSupplierDebts)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedDebtRange, setSelectedDebtRange] = useState('all')

  const filteredDebts = debts.filter(debt => {
    const matchesSearch = debt.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         debt.supplierId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         debt.phone.includes(searchTerm) ||
                         debt.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || debt.supplierType === selectedType
    const matchesStatus = selectedStatus === 'all' || debt.status === selectedStatus
    const matchesDebtRange = selectedDebtRange === 'all' || 
                           (selectedDebtRange === 'overdue' && debt.overdueAmount > 0) ||
                           (selectedDebtRange === 'high' && debt.totalDebt > 20000000)
    return matchesSearch && matchesType && matchesStatus && matchesDebtRange
  })

  const stats = {
    totalDebt: debts.reduce((sum, d) => sum + d.totalDebt, 0),
    overdueDebt: debts.reduce((sum, d) => sum + d.overdueAmount, 0),
    totalSuppliers: debts.length,
    overdueSuppliers: debts.filter(d => d.overdueAmount > 0).length,
    activeSuppliers: debts.filter(d => d.status === 'active').length,
    blockedSuppliers: debts.filter(d => d.status === 'blocked').length
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

  const getTypeInfo = (type: string) => {
    return supplierTypeConfig[type as keyof typeof supplierTypeConfig] || supplierTypeConfig.manufacturer
  }

  const getStatusInfo = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.active
  }

  const getDebtPercentage = (debt: SupplierDebt) => {
    return Math.round((debt.totalDebt / debt.creditLimit) * 100)
  }

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            Công nợ nhà cung cấp
          </h1>
          <p className="text-gray-600 mt-2">
            Quản lý và theo dõi công nợ với các nhà cung cấp
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Xuất Excel
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Thêm công nợ
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalDebt)}
              </p>
              <p className="text-xs text-gray-500">Tổng công nợ</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.overdueDebt)}
              </p>
              <p className="text-xs text-gray-500">Công nợ quá hạn</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.totalSuppliers}</p>
              <p className="text-xs text-gray-500">Tổng nhà cung cấp</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.overdueSuppliers}</p>
              <p className="text-xs text-gray-500">NCC quá hạn</p>
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
                  placeholder="Tìm kiếm theo tên, mã nhà cung cấp, SĐT, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10">
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              >
                <option value="all">Tất cả loại NCC</option>
                <option value="manufacturer">Nhà sản xuất</option>
                <option value="distributor">Nhà phân phối</option>
                <option value="wholesaler">Bán sỉ</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="overdue">Quá hạn</option>
                <option value="blocked">Khóa</option>
                <option value="suspended">Tạm dừng</option>
              </select>
              <select
                value={selectedDebtRange}
                onChange={(e) => setSelectedDebtRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              >
                <option value="all">Tất cả mức nợ</option>
                <option value="overdue">Có nợ quá hạn</option>
                <option value="high">Nợ cao (&gt;20M)</option>
              </select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Bộ lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debts Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nhà cung cấp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng nợ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nợ quá hạn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hạn mức
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thanh toán cuối
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDebts.map((debt) => {
                  const typeInfo = getTypeInfo(debt.supplierType)
                  const statusInfo = getStatusInfo(debt.status)
                  const StatusIcon = statusInfo.icon
                  const debtPercentage = getDebtPercentage(debt)
                  const daysUntilDue = getDaysUntilDue(debt.nextPaymentDue)
                  
                  return (
                    <tr key={debt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {debt.supplierName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {debt.supplierId}
                          </div>
                          <div className="text-xs text-gray-400">
                            {debt.phone} • {debt.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={`bg-${typeInfo.color}-100 text-${typeInfo.color}-800`}>
                          {typeInfo.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(debt.totalDebt)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {debt.purchases} đơn mua
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${debt.overdueAmount > 0 ? 'text-red-600' : 'text-gray-900 
                          {formatCurrency(debt.overdueAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(debt.creditLimit)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {debtPercentage}% sử dụng
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
                          {formatDate(debt.lastPaymentDate)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Đến hạn: {formatDate(debt.nextPaymentDue)}
                        </div>
                        {daysUntilDue <= 7 && daysUntilDue > 0 && (
                          <div className="text-xs text-orange-600">
                            Còn {daysUntilDue} ngày
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
                            <CreditCard className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-blue-600 hover:text-blue-700">
                            <Phone className="w-4 h-4" />
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

      {filteredDebts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không tìm thấy nhà cung cấp nào
            </h3>
            <p className="text-gray-600 mb-4">
              Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Thêm nhà cung cấp đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
export default SupplierDebts
