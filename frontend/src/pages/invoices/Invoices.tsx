import React, { useState, useEffect } from 'react'
import {
  FileText,
  Download,
  Printer as Print,
  Send,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Plus,
  DollarSign,
  TrendingUp,
  BarChart3
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/badge'

interface Invoice {
  id: string
  invoiceNumber: string
  orderId: string
  customerId: string
  customerName: string
  customerPhone: string
  customerEmail: string
  issueDate: string
  dueDate: string
  totalAmount: number
  taxAmount: number
  discountAmount: number
  finalAmount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  paymentMethod?: string
  paymentDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState('all')

  // Mock data
  useEffect(() => {
    const mockInvoices: Invoice[] = [
      {
        id: '1',
        invoiceNumber: 'INV-2024-001',
        orderId: 'ORD001',
        customerId: 'CUST001',
        customerName: 'Nguyễn Văn A',
        customerPhone: '0123456789',
        customerEmail: 'nguyenvana@email.com',
        issueDate: '2024-01-15T00:00:00Z',
        dueDate: '2024-02-15T00:00:00Z',
        totalAmount: 2500000,
        taxAmount: 250000,
        discountAmount: 100000,
        finalAmount: 2650000,
        status: 'paid',
        paymentMethod: 'bank_transfer',
        paymentDate: '2024-01-20T10:30:00Z',
        notes: 'Hóa đơn đã thanh toán',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-20T10:30:00Z'
      },
      {
        id: '2',
        invoiceNumber: 'INV-2024-002',
        orderId: 'ORD002',
        customerId: 'CUST002',
        customerName: 'Trần Thị B',
        customerPhone: '0987654321',
        customerEmail: 'tranthib@email.com',
        issueDate: '2024-01-10T00:00:00Z',
        dueDate: '2024-02-10T00:00:00Z',
        totalAmount: 1800000,
        taxAmount: 180000,
        discountAmount: 0,
        finalAmount: 1980000,
        status: 'overdue',
        notes: 'Quá hạn thanh toán',
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-10T00:00:00Z'
      },
      {
        id: '3',
        invoiceNumber: 'INV-2024-003',
        orderId: 'ORD003',
        customerId: 'CUST003',
        customerName: 'Lê Văn C',
        customerPhone: '0369258147',
        customerEmail: 'levanc@email.com',
        issueDate: '2024-01-20T00:00:00Z',
        dueDate: '2024-02-20T00:00:00Z',
        totalAmount: 3200000,
        taxAmount: 320000,
        discountAmount: 200000,
        finalAmount: 3320000,
        status: 'sent',
        notes: 'Đã gửi cho khách hàng',
        createdAt: '2024-01-20T00:00:00Z',
        updatedAt: '2024-01-20T00:00:00Z'
      }
    ]
    setInvoices(mockInvoices)
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
      draft: { label: 'Nháp', color: 'gray', icon: FileText },
      sent: { label: 'Đã gửi', color: 'blue', icon: Send },
      paid: { label: 'Đã thanh toán', color: 'green', icon: CheckCircle },
      overdue: { label: 'Quá hạn', color: 'red', icon: AlertCircle },
      cancelled: { label: 'Hủy', color: 'gray', icon: XCircle }
    }
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
  }

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.orderId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    
    let matchesDateRange = true
    if (dateRange === 'today') {
      const today = new Date().toDateString()
      matchesDateRange = new Date(invoice.issueDate).toDateString() === today
    } else if (dateRange === 'week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      matchesDateRange = new Date(invoice.issueDate) >= weekAgo
    } else if (dateRange === 'month') {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      matchesDateRange = new Date(invoice.issueDate) >= monthAgo
    }
    
    return matchesSearch && matchesStatus && matchesDateRange
  })

  const totalStats = {
    totalAmount: invoices.reduce((sum, i) => sum + i.finalAmount, 0),
    paidAmount: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.finalAmount, 0),
    overdueAmount: invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.finalAmount, 0),
    draftCount: invoices.filter(i => i.status === 'draft').length,
    sentCount: invoices.filter(i => i.status === 'sent').length,
    paidCount: invoices.filter(i => i.status === 'paid').length,
    overdueCount: invoices.filter(i => i.status === 'overdue').length
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý hóa đơn</h1>
          <p className="text-gray-600">Tạo, quản lý và theo dõi hóa đơn bán hàng</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Xuất báo cáo
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Tạo hóa đơn
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng giá trị</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStats.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Tất cả hóa đơn
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã thu</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalStats.paidAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {totalStats.paidCount} hóa đơn đã thanh toán
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quá hạn</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalStats.overdueAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {totalStats.overdueCount} hóa đơn quá hạn
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chờ gửi</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalStats.sentCount}</div>
            <p className="text-xs text-muted-foreground">
              Hóa đơn đã gửi
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
                  placeholder="Tìm theo số HĐ, khách hàng..."
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
                <option value="draft">Nháp</option>
                <option value="sent">Đã gửi</option>
                <option value="paid">Đã thanh toán</option>
                <option value="overdue">Quá hạn</option>
                <option value="cancelled">Hủy</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Thời gian</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Tất cả</option>
                <option value="today">Hôm nay</option>
                <option value="week">Tuần này</option>
                <option value="month">Tháng này</option>
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

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách hóa đơn ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Số hóa đơn</th>
                  <th className="text-left p-3">Đơn hàng</th>
                  <th className="text-left p-3">Khách hàng</th>
                  <th className="text-left p-3">Ngày phát hành</th>
                  <th className="text-left p-3">Hạn thanh toán</th>
                  <th className="text-left p-3">Số tiền</th>
                  <th className="text-left p-3">Trạng thái</th>
                  <th className="text-left p-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => {
                  const statusInfo = getStatusInfo(invoice.status)
                  const StatusIcon = statusInfo.icon
                  const daysUntilDue = getDaysUntilDue(invoice.dueDate)

                  return (
                    <tr key={invoice.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium">{invoice.invoiceNumber}</div>
                        <div className="text-sm text-gray-500">{invoice.customerId}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{invoice.orderId}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{invoice.customerName}</div>
                        <div className="text-sm text-gray-500">{invoice.customerPhone}</div>
                        <div className="text-xs text-gray-400">{invoice.customerEmail}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{formatDate(invoice.issueDate)}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{formatDate(invoice.dueDate)}</div>
                        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                          <div className={`text-xs ${
                            daysUntilDue < 0 ? 'text-red-600' :
                            daysUntilDue <= 3 ? 'text-yellow-600' : 'text-gray-500'
                          }`}>
                            {daysUntilDue < 0 ? `Quá hạn ${Math.abs(daysUntilDue)} ngày` :
                             daysUntilDue === 0 ? 'Hôm nay' :
                             `Còn ${daysUntilDue} ngày`}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{formatCurrency(invoice.finalAmount)}</div>
                        <div className="text-sm text-gray-500">
                          Gốc: {formatCurrency(invoice.totalAmount)}
                        </div>
                        {invoice.discountAmount > 0 && (
                          <div className="text-sm text-green-600">
                            Giảm: {formatCurrency(invoice.discountAmount)}
                          </div>
                        )}
                        <div className="text-sm text-gray-500">
                          VAT: {formatCurrency(invoice.taxAmount)}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={`text-${statusInfo.color}-600 border-${statusInfo.color}-200`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                        {invoice.paymentMethod && (
                          <div className="text-xs text-gray-500 mt-1">
                            {invoice.paymentMethod}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Print className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Send className="w-4 h-4" />
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

export default Invoices
