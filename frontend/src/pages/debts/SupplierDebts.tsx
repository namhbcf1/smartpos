import React, { useState, useEffect } from 'react'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Filter,
  Search,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
  Phone,
  Mail
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/badge'

interface SupplierDebt {
  id: string
  supplierId: string
  supplierName: string
  supplierPhone: string
  supplierEmail: string
  totalDebt: number
  currentDebt: number
  paidAmount: number
  lastPaymentDate: string
  lastOrderDate: string
  totalOrders: number
  creditLimit: number
  status: 'active' | 'overdue' | 'blocked'
  notes?: string
  createdAt: string
  updatedAt: string
}

const SupplierDebts: React.FC = () => {
  const [debts, setDebts] = useState<SupplierDebt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [debtRange, setDebtRange] = useState('all')

  // Mock data
  useEffect(() => {
    const mockDebts: SupplierDebt[] = [
      {
        id: '1',
        supplierId: 'SUPP001',
        supplierName: 'Công ty TNHH ABC',
        supplierPhone: '0123456789',
        supplierEmail: 'contact@abc.com',
        totalDebt: 15000000,
        currentDebt: 8000000,
        paidAmount: 7000000,
        lastPaymentDate: '2024-01-10T10:30:00Z',
        lastOrderDate: '2024-01-15T14:20:00Z',
        totalOrders: 25,
        creditLimit: 20000000,
        status: 'active',
        notes: 'Nhà cung cấp chính',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T14:20:00Z'
      },
      {
        id: '2',
        supplierId: 'SUPP002',
        supplierName: 'Công ty XYZ',
        supplierPhone: '0987654321',
        supplierEmail: 'info@xyz.com',
        totalDebt: 8000000,
        currentDebt: 8000000,
        paidAmount: 0,
        lastPaymentDate: '2024-01-05T09:15:00Z',
        lastOrderDate: '2024-01-12T16:45:00Z',
        totalOrders: 12,
        creditLimit: 10000000,
        status: 'overdue',
        notes: 'Quá hạn thanh toán',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-12T16:45:00Z'
      },
      {
        id: '3',
        supplierId: 'SUPP003',
        supplierName: 'Nhà phân phối DEF',
        supplierPhone: '0369258147',
        supplierEmail: 'sales@def.com',
        totalDebt: 5000000,
        currentDebt: 0,
        paidAmount: 5000000,
        lastPaymentDate: '2024-01-14T11:30:00Z',
        lastOrderDate: '2024-01-14T11:30:00Z',
        totalOrders: 8,
        creditLimit: 8000000,
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-14T11:30:00Z'
      }
    ]
    setDebts(mockDebts)
    setLoading(false)
  }, [])

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
    const statusConfig = {
      active: { label: 'Hoạt động', color: 'green', icon: CheckCircle },
      overdue: { label: 'Quá hạn', color: 'red', icon: AlertCircle },
      blocked: { label: 'Khóa', color: 'gray', icon: XCircle }
    }
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.active
  }

  const getDebtPercentage = (currentDebt: number, creditLimit: number) => {
    return Math.round((currentDebt / creditLimit) * 100)
  }

  const filteredDebts = debts.filter(debt => {
    const matchesSearch = debt.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         debt.supplierPhone.includes(searchTerm) ||
                         debt.supplierId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || debt.status === statusFilter
    
    let matchesDebtRange = true
    if (debtRange === 'low') matchesDebtRange = debt.currentDebt < 5000000
    else if (debtRange === 'medium') matchesDebtRange = debt.currentDebt >= 5000000 && debt.currentDebt < 15000000
    else if (debtRange === 'high') matchesDebtRange = debt.currentDebt >= 15000000
    
    return matchesSearch && matchesStatus && matchesDebtRange
  })

  const totalStats = {
    totalDebt: debts.reduce((sum, d) => sum + d.currentDebt, 0),
    totalPaid: debts.reduce((sum, d) => sum + d.paidAmount, 0),
    overdueCount: debts.filter(d => d.status === 'overdue').length,
    activeCount: debts.filter(d => d.status === 'active').length,
    blockedCount: debts.filter(d => d.status === 'blocked').length
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Công nợ nhà cung cấp</h1>
          <p className="text-gray-600">Theo dõi và quản lý công nợ với nhà cung cấp</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Xuất báo cáo
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Thêm công nợ
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng công nợ</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalStats.totalDebt)}</div>
            <p className="text-xs text-muted-foreground">
              Chưa thanh toán
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã trả</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalStats.totalPaid)}</div>
            <p className="text-xs text-muted-foreground">
              Đã thanh toán
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quá hạn</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalStats.overdueCount}</div>
            <p className="text-xs text-muted-foreground">
              Nhà cung cấp quá hạn
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoạt động</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalStats.activeCount}</div>
            <p className="text-xs text-muted-foreground">
              Nhà cung cấp hoạt động
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Tìm kiếm</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm theo tên NCC, SĐT, mã..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Tất cả</option>
                <option value="active">Hoạt động</option>
                <option value="overdue">Quá hạn</option>
                <option value="blocked">Khóa</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Mức công nợ</label>
              <select
                value={debtRange}
                onChange={(e) => setDebtRange(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Tất cả</option>
                <option value="low">Dưới 5M</option>
                <option value="medium">5M - 15M</option>
                <option value="high">Trên 15M</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <Filter className="w-4 h-4 mr-2" />
                Lọc nâng cao
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách công nợ ({filteredDebts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Nhà cung cấp</th>
                  <th className="text-left p-3">Thông tin liên hệ</th>
                  <th className="text-left p-3">Công nợ hiện tại</th>
                  <th className="text-left p-3">Hạn mức tín dụng</th>
                  <th className="text-left p-3">Tỷ lệ sử dụng</th>
                  <th className="text-left p-3">Trạng thái</th>
                  <th className="text-left p-3">Lần cuối</th>
                  <th className="text-left p-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredDebts.map((debt) => {
                  const statusInfo = getStatusInfo(debt.status)
                  const StatusIcon = statusInfo.icon
                  const debtPercentage = getDebtPercentage(debt.currentDebt, debt.creditLimit)

                  return (
                    <tr key={debt.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium">{debt.supplierName}</div>
                        <div className="text-sm text-gray-500">{debt.supplierId}</div>
                        <div className="text-xs text-gray-400">{debt.totalOrders} đơn hàng</div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-3 h-3" />
                          {debt.supplierPhone}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Mail className="w-3 h-3" />
                          {debt.supplierEmail}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-red-600">{formatCurrency(debt.currentDebt)}</div>
                        <div className="text-sm text-gray-500">
                          Tổng: {formatCurrency(debt.totalDebt)}
                        </div>
                        <div className="text-sm text-green-600">
                          Đã trả: {formatCurrency(debt.paidAmount)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{formatCurrency(debt.creditLimit)}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                debtPercentage >= 90 ? 'bg-red-500' :
                                debtPercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(debtPercentage, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{debtPercentage}%</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={`text-${statusInfo.color}-600 border-${statusInfo.color}-200`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          Thanh toán: {formatDate(debt.lastPaymentDate)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Đơn hàng: {formatDate(debt.lastOrderDate)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <MoreHorizontal className="w-4 h-4" />
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
    </div>
  )
}

export default SupplierDebts
