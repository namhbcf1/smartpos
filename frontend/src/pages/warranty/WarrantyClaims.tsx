import React, { useState, useEffect } from 'react'
import {
  AlertTriangle,
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
  Phone,
  Mail,
  MessageSquare
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/badge'
import { posApi } from '../../services/api/posApi'

interface WarrantyClaim {
  id: string
  claimNumber: string
  customerName: string
  customerPhone: string
  customerEmail: string
  productName: string
  productSerial: string
  purchaseDate: string
  issueDescription: string
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedTo: string
  createdAt: string
  updatedAt: string
  resolution?: string
  attachments: string[]
  estimatedResolutionDate?: string
}

const WarrantyClaims: React.FC = () => {
  const [claims, setClaims] = useState<WarrantyClaim[]>([])
  const [_loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  // Load real warranty claims
  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const res = await posApi.getWarranties(1, 50)
        const list = (res as any)?.data?.data || (res as any)?.data || []
        const normalized: WarrantyClaim[] = list.map((w: any, i: number) => ({
          id: w.id || String(i + 1),
          claimNumber: w.claim_number || w.id || `WC-${i + 1}`,
          customerName: w.customer_name || '',
          customerPhone: w.customer_phone || '',
          customerEmail: w.customer_email || '',
          productName: w.product_name || '',
          productSerial: w.product_serial || '',
          purchaseDate: w.purchase_date || new Date().toISOString(),
          issueDescription: w.issue || w.issue_description || w.notes || '',
          status: (w.status || 'pending'),
          priority: (w.priority || 'medium'),
          assignedTo: w.assigned_to || 'N/A',
          createdAt: w.created_at || new Date().toISOString(),
          updatedAt: w.updated_at || new Date().toISOString(),
          resolution: w.resolution || undefined,
          attachments: Array.isArray(w.attachments) ? w.attachments : [],
          estimatedResolutionDate: w.estimated_resolution_date
        }))
        setClaims(normalized)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const getStatusInfo = (status: string) => {
    const statusConfig = {
      pending: { label: 'Chờ xử lý', color: 'yellow', icon: Clock },
      in_progress: { label: 'Đang xử lý', color: 'blue', icon: AlertCircle },
      resolved: { label: 'Đã giải quyết', color: 'green', icon: CheckCircle },
      rejected: { label: 'Từ chối', color: 'red', icon: XCircle }
    }
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
  }

  const getPriorityInfo = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Thấp', color: 'green' },
      medium: { label: 'Trung bình', color: 'yellow' },
      high: { label: 'Cao', color: 'orange' },
      urgent: { label: 'Khẩn cấp', color: 'red' }
    }
    return priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium
  }

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.productName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || claim.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  const totalStats = {
    totalClaims: claims.length,
    pendingClaims: claims.filter(c => c.status === 'pending').length,
    inProgressClaims: claims.filter(c => c.status === 'in_progress').length,
    resolvedClaims: claims.filter(c => c.status === 'resolved').length,
    urgentClaims: claims.filter(c => c.priority === 'urgent').length
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Khiếu nại bảo hành</h1>
          <p className="text-gray-600">Quản lý các khiếu nại và yêu cầu bảo hành từ khách hàng</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Xuất báo cáo
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Tạo khiếu nại mới
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng khiếu nại</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalClaims}</div>
            <p className="text-xs text-muted-foreground">
              Tất cả khiếu nại
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chờ xử lý</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.pendingClaims}</div>
            <p className="text-xs text-muted-foreground">
              Cần xử lý
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang xử lý</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.inProgressClaims}</div>
            <p className="text-xs text-muted-foreground">
              Đang thực hiện
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã giải quyết</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.resolvedClaims}</div>
            <p className="text-xs text-muted-foreground">
              Hoàn thành
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Khẩn cấp</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.urgentClaims}</div>
            <p className="text-xs text-muted-foreground">
              Cần ưu tiên
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
                  placeholder="Tìm theo số khiếu nại, khách hàng..."
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
                <option value="in_progress">Đang xử lý</option>
                <option value="resolved">Đã giải quyết</option>
                <option value="rejected">Từ chối</option>
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
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
                <option value="urgent">Khẩn cấp</option>
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

      {/* Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách khiếu nại ({filteredClaims.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Số khiếu nại</th>
                  <th className="text-left p-3">Khách hàng</th>
                  <th className="text-left p-3">Sản phẩm</th>
                  <th className="text-left p-3">Vấn đề</th>
                  <th className="text-left p-3">Trạng thái</th>
                  <th className="text-left p-3">Độ ưu tiên</th>
                  <th className="text-left p-3">Người phụ trách</th>
                  <th className="text-left p-3">Ngày tạo</th>
                  <th className="text-left p-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((claim) => {
                  const statusInfo = getStatusInfo(claim.status)
                  const priorityInfo = getPriorityInfo(claim.priority)
                  const StatusIcon = statusInfo.icon

                  return (
                    <tr key={claim.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium">{claim.claimNumber}</div>
                        <div className="text-sm text-gray-500">ID: {claim.id}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{claim.customerName}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {claim.customerPhone}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {claim.customerEmail}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{claim.productName}</div>
                        <div className="text-sm text-gray-500">S/N: {claim.productSerial}</div>
                        <div className="text-sm text-gray-500">Mua: {formatDate(claim.purchaseDate)}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm max-w-xs truncate" title={claim.issueDescription}>
                          {claim.issueDescription}
                        </div>
                        {claim.attachments.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {claim.attachments.length} tệp đính kèm
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={`text-${statusInfo.color}-600 border-${statusInfo.color}-200`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={`text-${priorityInfo.color}-600 border-${priorityInfo.color}-200`}>
                          {priorityInfo.label}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{claim.assignedTo}</div>
                        {claim.estimatedResolutionDate && (
                          <div className="text-xs text-gray-500">
                            Dự kiến: {formatDate(claim.estimatedResolutionDate)}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{formatDate(claim.createdAt)}</div>
                        <div className="text-xs text-gray-500">
                          Cập nhật: {formatDate(claim.updatedAt)}
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
                            <MessageSquare className="w-4 h-4" />
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

export default WarrantyClaims
