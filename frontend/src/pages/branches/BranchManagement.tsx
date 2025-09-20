import React, { useState, useEffect } from 'react'
import {
  MapPin,
  Building2,
  Users,
  Phone,
  Mail,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  DollarSign,
  TrendingUp,
  Settings
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/badge'

interface Branch {
  id: string
  branchCode: string
  name: string
  type: 'headquarters' | 'branch' | 'warehouse' | 'outlet'
  address: string
  city: string
  district: string
  ward: string
  postalCode: string
  phone: string
  email: string
  managerId: string
  managerName: string
  managerPhone: string
  managerEmail: string
  status: 'active' | 'inactive' | 'maintenance' | 'closed'
  openingDate: string
  closingDate?: string
  businessHours: {
    monday: string
    tuesday: string
    wednesday: string
    thursday: string
    friday: string
    saturday: string
    sunday: string
  }
  facilities: string[]
  employeeCount: number
  totalSales: number
  monthlyTarget: number
  lastUpdated: string
  notes?: string
  createdAt: string
  updatedAt: string
}

const BranchManagement: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')

  // Mock data
  useEffect(() => {
    const mockBranches: Branch[] = [
      {
        id: '1',
        branchCode: 'BR001',
        name: 'Chi nhánh trung tâm',
        type: 'headquarters',
        address: '123 Đường ABC, Phường XYZ',
        city: 'Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        postalCode: '700000',
        phone: '028-1234-5678',
        email: 'hq@company.com',
        managerId: 'EMP001',
        managerName: 'Nguyễn Văn A',
        managerPhone: '0123456789',
        managerEmail: 'manager1@company.com',
        status: 'active',
        openingDate: '2020-01-15',
        businessHours: {
          monday: '08:00 - 22:00',
          tuesday: '08:00 - 22:00',
          wednesday: '08:00 - 22:00',
          thursday: '08:00 - 22:00',
          friday: '08:00 - 22:00',
          saturday: '08:00 - 22:00',
          sunday: '08:00 - 20:00'
        },
        facilities: ['POS', 'Kho hàng', 'Phòng họp', 'Cafeteria'],
        employeeCount: 25,
        totalSales: 1500000000,
        monthlyTarget: 2000000000,
        lastUpdated: '2024-01-15T14:30:00Z',
        notes: 'Trụ sở chính',
        createdAt: '2020-01-15T00:00:00Z',
        updatedAt: '2024-01-15T14:30:00Z'
      },
      {
        id: '2',
        branchCode: 'BR002',
        name: 'Chi nhánh Quận 7',
        type: 'branch',
        address: '456 Đường DEF, Phường GHI',
        city: 'Hồ Chí Minh',
        district: 'Quận 7',
        ward: 'Phường Tân Phú',
        postalCode: '700000',
        phone: '028-2345-6789',
        email: 'q7@company.com',
        managerId: 'EMP002',
        managerName: 'Trần Thị B',
        managerPhone: '0987654321',
        managerEmail: 'manager2@company.com',
        status: 'active',
        openingDate: '2021-03-20',
        businessHours: {
          monday: '09:00 - 21:00',
          tuesday: '09:00 - 21:00',
          wednesday: '09:00 - 21:00',
          thursday: '09:00 - 21:00',
          friday: '09:00 - 21:00',
          saturday: '09:00 - 21:00',
          sunday: '09:00 - 19:00'
        },
        facilities: ['POS', 'Kho hàng'],
        employeeCount: 15,
        totalSales: 800000000,
        monthlyTarget: 1000000000,
        lastUpdated: '2024-01-15T12:15:00Z',
        notes: 'Chi nhánh mới',
        createdAt: '2021-03-20T00:00:00Z',
        updatedAt: '2024-01-15T12:15:00Z'
      },
      {
        id: '3',
        branchCode: 'BR003',
        name: 'Kho hàng Bình Dương',
        type: 'warehouse',
        address: '789 Đường JKL, Phường MNO',
        city: 'Bình Dương',
        district: 'Thành phố Thủ Dầu Một',
        ward: 'Phường Phú Hòa',
        postalCode: '820000',
        phone: '0274-3456-7890',
        email: 'warehouse@company.com',
        managerId: 'EMP003',
        managerName: 'Lê Văn C',
        managerPhone: '0369258147',
        managerEmail: 'manager3@company.com',
        status: 'active',
        openingDate: '2022-06-10',
        businessHours: {
          monday: '07:00 - 17:00',
          tuesday: '07:00 - 17:00',
          wednesday: '07:00 - 17:00',
          thursday: '07:00 - 17:00',
          friday: '07:00 - 17:00',
          saturday: '07:00 - 12:00',
          sunday: 'Nghỉ'
        },
        facilities: ['Kho hàng', 'Văn phòng', 'Bãi xe'],
        employeeCount: 8,
        totalSales: 0,
        monthlyTarget: 0,
        lastUpdated: '2024-01-15T10:45:00Z',
        notes: 'Kho hàng chính',
        createdAt: '2022-06-10T00:00:00Z',
        updatedAt: '2024-01-15T10:45:00Z'
      }
    ]
    setBranches(mockBranches)
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
      inactive: { label: 'Không hoạt động', color: 'gray', icon: XCircle },
      maintenance: { label: 'Bảo trì', color: 'yellow', icon: Settings },
      closed: { label: 'Đóng cửa', color: 'red', icon: AlertCircle }
    }
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.active
  }

  const getTypeInfo = (type: string) => {
    const typeConfig = {
      headquarters: { label: 'Trụ sở chính', color: 'blue', icon: Building2 },
      branch: { label: 'Chi nhánh', color: 'green', icon: MapPin },
      warehouse: { label: 'Kho hàng', color: 'orange', icon: Building2 },
      outlet: { label: 'Cửa hàng', color: 'purple', icon: MapPin }
    }
    return typeConfig[type as keyof typeof typeConfig] || typeConfig.branch
  }

  const getPerformanceRate = (sales: number, target: number) => {
    if (target === 0) return 0
    return Math.round((sales / target) * 100)
  }

  const getPerformanceColor = (rate: number) => {
    if (rate >= 100) return 'green'
    if (rate >= 80) return 'yellow'
    return 'red'
  }

  const filteredBranches = branches.filter(branch => {
    const matchesSearch = branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         branch.branchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         branch.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         branch.city.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || branch.status === statusFilter
    const matchesType = typeFilter === 'all' || branch.type === typeFilter
    const matchesCity = cityFilter === 'all' || branch.city === cityFilter
    
    return matchesSearch && matchesStatus && matchesType && matchesCity
  })

  const totalStats = {
    totalBranches: branches.length,
    activeBranches: branches.filter(b => b.status === 'active').length,
    totalEmployees: branches.reduce((sum, b) => sum + b.employeeCount, 0),
    totalSales: branches.reduce((sum, b) => sum + b.totalSales, 0),
    totalTarget: branches.reduce((sum, b) => sum + b.monthlyTarget, 0),
    avgPerformance: branches.filter(b => b.monthlyTarget > 0).reduce((sum, b) => sum + getPerformanceRate(b.totalSales, b.monthlyTarget), 0) / branches.filter(b => b.monthlyTarget > 0).length
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý chi nhánh</h1>
          <p className="text-gray-600">Quản lý và theo dõi tất cả chi nhánh trong hệ thống</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Xuất báo cáo
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Thêm chi nhánh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng chi nhánh</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalBranches}</div>
            <p className="text-xs text-muted-foreground">
              {totalStats.activeBranches} đang hoạt động
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng nhân viên</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Nhân viên toàn hệ thống
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStats.totalSales)}</div>
            <p className="text-xs text-muted-foreground">
              Tất cả chi nhánh
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hiệu suất TB</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(totalStats.avgPerformance)}%</div>
            <p className="text-xs text-muted-foreground">
              So với mục tiêu
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
                  placeholder="Tìm theo tên, mã, địa chỉ..."
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
                <option value="inactive">Không hoạt động</option>
                <option value="maintenance">Bảo trì</option>
                <option value="closed">Đóng cửa</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Loại</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Tất cả</option>
                <option value="headquarters">Trụ sở chính</option>
                <option value="branch">Chi nhánh</option>
                <option value="warehouse">Kho hàng</option>
                <option value="outlet">Cửa hàng</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Thành phố</label>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Tất cả</option>
                <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                <option value="Bình Dương">Bình Dương</option>
                <option value="Đồng Nai">Đồng Nai</option>
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

      {/* Branches Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách chi nhánh ({filteredBranches.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Chi nhánh</th>
                  <th className="text-left p-3">Địa chỉ</th>
                  <th className="text-left p-3">Quản lý</th>
                  <th className="text-left p-3">Nhân viên</th>
                  <th className="text-left p-3">Doanh thu</th>
                  <th className="text-left p-3">Hiệu suất</th>
                  <th className="text-left p-3">Trạng thái</th>
                  <th className="text-left p-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredBranches.map((branch) => {
                  const statusInfo = getStatusInfo(branch.status)
                  const typeInfo = getTypeInfo(branch.type)
                  const performanceRate = getPerformanceRate(branch.totalSales, branch.monthlyTarget)
                  const performanceColor = getPerformanceColor(performanceRate)
                  const StatusIcon = statusInfo.icon
                  const TypeIcon = typeInfo.icon

                  return (
                    <tr key={branch.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-${typeInfo.color}-100`}>
                            <TypeIcon className={`w-5 h-5 text-${typeInfo.color}-600`} />
                          </div>
                          <div>
                            <div className="font-medium">{branch.name}</div>
                            <div className="text-sm text-gray-500">{branch.branchCode}</div>
                            <Badge variant="outline" className={`text-${typeInfo.color}-600 border-${typeInfo.color}-200 text-xs`}>
                              {typeInfo.label}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="w-3 h-3 mt-0.5" />
                          <div>
                            <div>{branch.address}</div>
                            <div className="text-gray-500">{branch.ward}, {branch.district}</div>
                            <div className="text-gray-500">{branch.city}</div>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <Phone className="w-3 h-3" />
                              {branch.phone}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <Mail className="w-3 h-3" />
                              {branch.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Users className="w-3 h-3" />
                          <div>
                            <div className="text-sm font-medium">{branch.managerName}</div>
                            <div className="text-xs text-gray-500">{branch.managerId}</div>
                            <div className="text-xs text-gray-400">{branch.managerPhone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-center">
                          <div className="text-lg font-bold">{branch.employeeCount}</div>
                          <div className="text-xs text-gray-500">nhân viên</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <div className="font-medium">{formatCurrency(branch.totalSales)}</div>
                          {branch.monthlyTarget > 0 && (
                            <div className="text-xs text-gray-500">
                              Mục tiêu: {formatCurrency(branch.monthlyTarget)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        {branch.monthlyTarget > 0 ? (
                          <div className="text-center">
                            <div className={`text-lg font-bold text-${performanceColor}-600`}>
                              {performanceRate}%
                            </div>
                            <div className="w-16 bg-gray-200 rounded-full h-2 mx-auto mt-1">
                              <div 
                                className={`h-2 rounded-full bg-${performanceColor}-500`}
                                style={{ width: `${Math.min(performanceRate, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Không áp dụng</span>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={`text-${statusInfo.color}-600 border-${statusInfo.color}-200`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          Mở: {formatDate(branch.openingDate)}
                        </div>
                        {branch.facilities.length > 0 && (
                          <div className="text-xs text-gray-400 mt-1">
                            {branch.facilities.slice(0, 2).join(', ')}
                            {branch.facilities.length > 2 && ` +${branch.facilities.length - 2}`}
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
                            <BarChart3 className="w-4 h-4" />
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

export default BranchManagement
