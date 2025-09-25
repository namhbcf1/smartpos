import React, { useState, useEffect } from 'react'
import {
  MessageSquare,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Tag,
  Flag
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/badge'

interface SupportTicket {
  id: string
  ticketNumber: string
  customerId: string
  customerName: string
  customerPhone: string
  customerEmail: string
  subject: string
  description: string
  category: 'technical' | 'billing' | 'general' | 'complaint' | 'feature_request'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'cancelled'
  assignedTo?: string
  assignedToName?: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  responseTime?: number // in hours
  satisfaction?: number // 1-5 rating
  tags: string[]
  attachments?: string[]
}

const SupportTickets: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [_loading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Mock data
  useEffect(() => {
    const mockTickets: SupportTicket[] = [
      {
        id: '1',
        ticketNumber: 'TK-2024-001',
        customerId: 'CUST001',
        customerName: 'Nguyễn Văn A',
        customerPhone: '0123456789',
        customerEmail: 'nguyenvana@email.com',
        subject: 'Không thể đăng nhập vào hệ thống',
        description: 'Tôi không thể đăng nhập vào hệ thống POS, hiển thị lỗi "Sai mật khẩu" mặc dù tôi đã nhập đúng.',
        category: 'technical',
        priority: 'high',
        status: 'in_progress',
        assignedTo: 'EMP001',
        assignedToName: 'Nhân viên hỗ trợ 1',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T14:20:00Z',
        responseTime: 2,
        tags: ['login', 'password', 'urgent'],
        attachments: ['screenshot1.png']
      },
      {
        id: '2',
        ticketNumber: 'TK-2024-002',
        customerId: 'CUST002',
        customerName: 'Trần Thị B',
        customerPhone: '0987654321',
        customerEmail: 'tranthib@email.com',
        subject: 'Yêu cầu hoàn tiền đơn hàng',
        description: 'Tôi muốn hoàn tiền cho đơn hàng ORD002 vì sản phẩm bị lỗi.',
        category: 'billing',
        priority: 'medium',
        status: 'open',
        createdAt: '2024-01-14T16:45:00Z',
        updatedAt: '2024-01-14T16:45:00Z',
        tags: ['refund', 'order'],
        attachments: []
      },
      {
        id: '3',
        ticketNumber: 'TK-2024-003',
        customerId: 'CUST003',
        customerName: 'Lê Văn C',
        customerPhone: '0369258147',
        customerEmail: 'levanc@email.com',
        subject: 'Đề xuất tính năng mới',
        description: 'Tôi muốn đề xuất thêm tính năng xuất báo cáo theo định dạng Excel.',
        category: 'feature_request',
        priority: 'low',
        status: 'resolved',
        assignedTo: 'EMP002',
        assignedToName: 'Nhân viên hỗ trợ 2',
        createdAt: '2024-01-10T09:15:00Z',
        updatedAt: '2024-01-12T11:30:00Z',
        resolvedAt: '2024-01-12T11:30:00Z',
        responseTime: 24,
        satisfaction: 5,
        tags: ['feature', 'excel', 'report'],
        attachments: []
      }
    ]
    setTickets(mockTickets)
    // setLoading(false)
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN')
  }

  const getStatusInfo = (status: string) => {
    const statusConfig = {
      open: { label: 'Mở', color: 'blue', icon: MessageSquare },
      in_progress: { label: 'Đang xử lý', color: 'yellow', icon: Clock },
      resolved: { label: 'Đã giải quyết', color: 'green', icon: CheckCircle },
      closed: { label: 'Đóng', color: 'gray', icon: XCircle },
      cancelled: { label: 'Hủy', color: 'red', icon: AlertCircle }
    }
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.open
  }

  const getPriorityInfo = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Thấp', color: 'green', icon: Flag },
      medium: { label: 'Trung bình', color: 'yellow', icon: Flag },
      high: { label: 'Cao', color: 'orange', icon: Flag },
      urgent: { label: 'Khẩn cấp', color: 'red', icon: Flag }
    }
    return priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.low
  }

  const getCategoryInfo = (category: string) => {
    const categoryConfig = {
      technical: { label: 'Kỹ thuật', color: 'blue' },
      billing: { label: 'Thanh toán', color: 'green' },
      general: { label: 'Chung', color: 'gray' },
      complaint: { label: 'Khiếu nại', color: 'red' },
      feature_request: { label: 'Đề xuất', color: 'purple' }
    }
    return categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.general
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Vừa xong'
    if (diffInHours < 24) return `${diffInHours} giờ trước`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} ngày trước`
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory
  })

  const totalStats = {
    totalTickets: tickets.length,
    openTickets: tickets.filter(t => t.status === 'open').length,
    inProgressTickets: tickets.filter(t => t.status === 'in_progress').length,
    resolvedTickets: tickets.filter(t => t.status === 'resolved').length,
    avgResponseTime: tickets.filter(t => t.responseTime).reduce((sum, t) => sum + (t.responseTime || 0), 0) / tickets.filter(t => t.responseTime).length,
    avgSatisfaction: tickets.filter(t => t.satisfaction).reduce((sum, t) => sum + (t.satisfaction || 0), 0) / tickets.filter(t => t.satisfaction).length
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hỗ trợ khách hàng</h1>
          <p className="text-gray-600">Quản lý và xử lý các yêu cầu hỗ trợ từ khách hàng</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Xuất báo cáo
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Tạo ticket mới
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng ticket</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalTickets}</div>
            <p className="text-xs text-muted-foreground">
              Tất cả ticket
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang mở</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalStats.openTickets}</div>
            <p className="text-xs text-muted-foreground">
              Cần xử lý
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang xử lý</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{totalStats.inProgressTickets}</div>
            <p className="text-xs text-muted-foreground">
              Đang được xử lý
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã giải quyết</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalStats.resolvedTickets}</div>
            <p className="text-xs text-muted-foreground">
              Hoàn thành
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium">Tìm kiếm</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm theo số ticket, khách hàng..."
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
                <option value="open">Mở</option>
                <option value="in_progress">Đang xử lý</option>
                <option value="resolved">Đã giải quyết</option>
                <option value="closed">Đóng</option>
                <option value="cancelled">Hủy</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Độ ưu tiên</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Tất cả</option>
                <option value="urgent">Khẩn cấp</option>
                <option value="high">Cao</option>
                <option value="medium">Trung bình</option>
                <option value="low">Thấp</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Danh mục</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Tất cả</option>
                <option value="technical">Kỹ thuật</option>
                <option value="billing">Thanh toán</option>
                <option value="general">Chung</option>
                <option value="complaint">Khiếu nại</option>
                <option value="feature_request">Đề xuất</option>
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

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách ticket ({filteredTickets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Số ticket</th>
                  <th className="text-left p-3">Khách hàng</th>
                  <th className="text-left p-3">Tiêu đề</th>
                  <th className="text-left p-3">Danh mục</th>
                  <th className="text-left p-3">Độ ưu tiên</th>
                  <th className="text-left p-3">Trạng thái</th>
                  <th className="text-left p-3">Người phụ trách</th>
                  <th className="text-left p-3">Thời gian</th>
                  <th className="text-left p-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => {
                  const statusInfo = getStatusInfo(ticket.status)
                  const priorityInfo = getPriorityInfo(ticket.priority)
                  const categoryInfo = getCategoryInfo(ticket.category)
                  const StatusIcon = statusInfo.icon
                  const PriorityIcon = priorityInfo.icon

                  return (
                    <tr key={ticket.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium">{ticket.ticketNumber}</div>
                        <div className="text-sm text-gray-500">{ticket.customerId}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{ticket.customerName}</div>
                        <div className="text-sm text-gray-500">{ticket.customerPhone}</div>
                        <div className="text-xs text-gray-400">{ticket.customerEmail}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{ticket.subject}</div>
                        <div className="text-sm text-gray-500 line-clamp-2">
                          {ticket.description}
                        </div>
                        {ticket.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {ticket.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                <Tag className="w-2 h-2 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                            {ticket.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{ticket.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={`text-${categoryInfo.color}-600 border-${categoryInfo.color}-200`}>
                          {categoryInfo.label}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={`text-${priorityInfo.color}-600 border-${priorityInfo.color}-200`}>
                          <PriorityIcon className="w-3 h-3 mr-1" />
                          {priorityInfo.label}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={`text-${statusInfo.color}-600 border-${statusInfo.color}-200`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                        {ticket.responseTime && (
                          <div className="text-xs text-gray-500 mt-1">
                            Phản hồi: {ticket.responseTime}h
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {ticket.assignedToName ? (
                          <div>
                            <div className="text-sm font-medium">{ticket.assignedToName}</div>
                            <div className="text-xs text-gray-500">{ticket.assignedTo}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Chưa phân công</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{formatDate(ticket.createdAt)}</div>
                        <div className="text-xs text-gray-500">{getTimeAgo(ticket.createdAt)}</div>
                        {ticket.resolvedAt && (
                          <div className="text-xs text-green-600">
                            Giải quyết: {formatDate(ticket.resolvedAt)}
                          </div>
                        )}
                        {ticket.satisfaction && (
                          <div className="text-xs text-yellow-600">
                            ⭐ {ticket.satisfaction}/5
                          </div>
                        )}
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

export default SupportTickets
