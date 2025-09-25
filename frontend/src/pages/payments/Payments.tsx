import React, { useState, useEffect } from 'react'
import {
  CreditCard,
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
  AlertCircle
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/badge'
import { posApi } from '../../services/api/posApi'

interface Payment {
  id: string
  transactionId: string
  orderId: string
  customerName: string
  customerPhone: string
  amount: number
  method: 'cash' | 'card' | 'bank_transfer' | 'e_wallet' | 'cod'
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  processedAt: string
  processedBy: string
  fee: number
  netAmount: number
  reference?: string
  notes?: string
}

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [dateRange, setDateRange] = useState('today')

  // Load real payments
  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const res = await posApi.getPaymentStatus('health-check')
        // Health check call just to warm up auth; actual list would come from /payments
      } catch {}
      try {
        // Try common endpoints: /payments/list or /orders with payments
        const resp: any = await (posApi as any).request?.('/payments')
        const list = resp?.data || resp?.data?.data || []
        const normalized: Payment[] = list.map((p: any) => ({
          id: p.id || p.transactionId,
          transactionId: p.transactionId || p.id,
          orderId: p.order_id || p.orderId || '',
          customerName: p.customer_name || p.customerName || '',
          customerPhone: p.customer_phone || p.customerPhone || '',
          amount: p.amount || 0,
          method: (p.method || 'cash').toLowerCase(),
          status: (p.status || 'completed').toLowerCase(),
          processedAt: p.created_at || p.processedAt || new Date().toISOString(),
          processedBy: p.processed_by || p.processedBy || 'System',
          fee: p.fee || 0,
          netAmount: p.net_amount || p.netAmount || p.amount || 0,
          reference: p.reference,
          notes: p.notes
        }))
        setPayments(normalized)
      } catch {
        setPayments([])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN')
  }

  const getStatusInfo = (status: string) => {
    const statusConfig = {
      pending: { label: 'Chờ xử lý', color: 'yellow', icon: Clock },
      completed: { label: 'Hoàn thành', color: 'green', icon: CheckCircle },
      failed: { label: 'Thất bại', color: 'red', icon: XCircle },
      refunded: { label: 'Đã hoàn', color: 'blue', icon: AlertCircle }
    }
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
  }

  const getMethodInfo = (method: string) => {
    const methodConfig = {
      cash: { label: 'Tiền mặt', color: 'green', icon: DollarSign },
      card: { label: 'Thẻ', color: 'blue', icon: CreditCard },
      bank_transfer: { label: 'Chuyển khoản', color: 'purple', icon: TrendingUp },
      e_wallet: { label: 'Ví điện tử', color: 'orange', icon: CreditCard },
      cod: { label: 'COD', color: 'gray', icon: DollarSign }
    }
    return methodConfig[method as keyof typeof methodConfig] || methodConfig.cash
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.orderId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    const matchesMethod = methodFilter === 'all' || payment.method === methodFilter
    return matchesSearch && matchesStatus && matchesMethod
  })

  const totalStats = {
    totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
    totalFee: payments.reduce((sum, p) => sum + p.fee, 0),
    netAmount: payments.reduce((sum, p) => sum + p.netAmount, 0),
    completedCount: payments.filter(p => p.status === 'completed').length,
    pendingCount: payments.filter(p => p.status === 'pending').length,
    failedCount: payments.filter(p => p.status === 'failed').length
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý thanh toán</h1>
          <p className="text-gray-600">Theo dõi và quản lý tất cả giao dịch thanh toán</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Xuất báo cáo
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Thêm thanh toán
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStats.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {totalStats.completedCount} giao dịch thành công
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phí giao dịch</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStats.totalFee)}</div>
            <p className="text-xs text-muted-foreground">
              Chi phí xử lý thanh toán
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Số dư thực</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStats.netAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Sau khi trừ phí
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giao dịch chờ</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Cần xử lý
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
                  placeholder="Tìm theo tên, mã giao dịch..."
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
                <option value="pending">Chờ xử lý</option>
                <option value="completed">Hoàn thành</option>
                <option value="failed">Thất bại</option>
                <option value="refunded">Đã hoàn</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Phương thức</label>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Tất cả</option>
                <option value="cash">Tiền mặt</option>
                <option value="card">Thẻ</option>
                <option value="bank_transfer">Chuyển khoản</option>
                <option value="e_wallet">Ví điện tử</option>
                <option value="cod">COD</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Khoảng thời gian</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="today">Hôm nay</option>
                <option value="week">Tuần này</option>
                <option value="month">Tháng này</option>
                <option value="quarter">Quý này</option>
                <option value="year">Năm nay</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách thanh toán ({filteredPayments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Mã giao dịch</th>
                  <th className="text-left p-3">Đơn hàng</th>
                  <th className="text-left p-3">Khách hàng</th>
                  <th className="text-left p-3">Số tiền</th>
                  <th className="text-left p-3">Phương thức</th>
                  <th className="text-left p-3">Trạng thái</th>
                  <th className="text-left p-3">Thời gian</th>
                  <th className="text-left p-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => {
                  const statusInfo = getStatusInfo(payment.status)
                  const methodInfo = getMethodInfo(payment.method)
                  const StatusIcon = statusInfo.icon
                  const MethodIcon = methodInfo.icon

                  return (
                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium">{payment.transactionId}</div>
                        {payment.reference && (
                          <div className="text-sm text-gray-500">{payment.reference}</div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{payment.orderId}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{payment.customerName}</div>
                        <div className="text-sm text-gray-500">{payment.customerPhone}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{formatCurrency(payment.amount)}</div>
                        {payment.fee > 0 && (
                          <div className="text-sm text-gray-500">
                            Phí: {formatCurrency(payment.fee)}
                          </div>
                        )}
                        <div className="text-sm font-medium text-green-600">
                          Thực nhận: {formatCurrency(payment.netAmount)}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={`text-${methodInfo.color}-600 border-${methodInfo.color}-200`}>
                          <MethodIcon className="w-3 h-3 mr-1" />
                          {methodInfo.label}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={`text-${statusInfo.color}-600 border-${statusInfo.color}-200`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{formatDate(payment.processedAt)}</div>
                        <div className="text-xs text-gray-500">Bởi: {payment.processedBy}</div>
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

export default Payments
