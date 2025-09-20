import React, { useState, useEffect } from 'react'
import {
  Users,
  UserPlus,
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
  Phone,
  Mail,
  MapPin,
  Building2,
  DollarSign,
  TrendingUp,
  BarChart3,
  Settings,
  Star
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/badge'

interface Employee {
  id: string
  employeeCode: string
  fullName: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  dateOfBirth: string
  gender: 'male' | 'female' | 'other'
  position: string
  department: string
  managerId?: string
  managerName?: string
  hireDate: string
  contractType: 'full_time' | 'part_time' | 'contract' | 'intern'
  status: 'active' | 'inactive' | 'on_leave' | 'terminated'
  salary: number
  hourlyRate?: number
  role: 'admin' | 'manager' | 'supervisor' | 'staff' | 'cashier'
  permissions: string[]
  avatar?: string
  emergencyContact: string
  emergencyPhone: string
  bankAccount?: string
  taxCode?: string
  socialInsurance?: string
  healthInsurance?: string
  performanceScore: number
  totalSales: number
  workedHours: number
  overtimeHours: number
  leaveBalance: number
  lastCheckIn?: string
  shiftSchedule: {
    monday: string
    tuesday: string
    wednesday: string
    thursday: string
    friday: string
    saturday: string
    sunday: string
  }
  notes?: string
  createdAt: string
  updatedAt: string
}

const EmployeeManagementNew: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [positionFilter, setPositionFilter] = useState('all')

  // Mock data
  useEffect(() => {
    const mockEmployees: Employee[] = [
      {
        id: '1',
        employeeCode: 'EMP001',
        fullName: 'Nguyễn Văn A',
        firstName: 'A',
        lastName: 'Nguyễn Văn',
        email: 'nguyenvana@company.com',
        phone: '0123456789',
        address: '123 Đường ABC, Phường XYZ',
        city: 'Hồ Chí Minh',
        dateOfBirth: '1990-05-15',
        gender: 'male',
        position: 'Quản lý bán hàng',
        department: 'Bán hàng',
        managerId: 'EMP000',
        managerName: 'Giám đốc',
        hireDate: '2020-01-15',
        contractType: 'full_time',
        status: 'active',
        salary: 15000000,
        role: 'manager',
        permissions: ['sales', 'inventory', 'reports'],
        emergencyContact: 'Nguyễn Thị B',
        emergencyPhone: '0987654321',
        bankAccount: '1234567890',
        taxCode: '123456789',
        socialInsurance: 'SI123456789',
        healthInsurance: 'HI123456789',
        performanceScore: 4.5,
        totalSales: 500000000,
        workedHours: 160,
        overtimeHours: 20,
        leaveBalance: 12,
        lastCheckIn: '2024-01-15T08:30:00Z',
        shiftSchedule: {
          monday: '08:00 - 17:00',
          tuesday: '08:00 - 17:00',
          wednesday: '08:00 - 17:00',
          thursday: '08:00 - 17:00',
          friday: '08:00 - 17:00',
          saturday: '08:00 - 12:00',
          sunday: 'Nghỉ'
        },
        notes: 'Nhân viên xuất sắc',
        createdAt: '2020-01-15T00:00:00Z',
        updatedAt: '2024-01-15T14:30:00Z'
      },
      {
        id: '2',
        employeeCode: 'EMP002',
        fullName: 'Trần Thị B',
        firstName: 'B',
        lastName: 'Trần Thị',
        email: 'tranthib@company.com',
        phone: '0987654321',
        address: '456 Đường DEF, Phường GHI',
        city: 'Hồ Chí Minh',
        dateOfBirth: '1995-08-20',
        gender: 'female',
        position: 'Thu ngân',
        department: 'Bán hàng',
        managerId: 'EMP001',
        managerName: 'Nguyễn Văn A',
        hireDate: '2021-03-20',
        contractType: 'full_time',
        status: 'active',
        salary: 8000000,
        hourlyRate: 50000,
        role: 'cashier',
        permissions: ['sales', 'pos'],
        emergencyContact: 'Trần Văn C',
        emergencyPhone: '0369258147',
        bankAccount: '0987654321',
        taxCode: '987654321',
        socialInsurance: 'SI987654321',
        healthInsurance: 'HI987654321',
        performanceScore: 4.2,
        totalSales: 200000000,
        workedHours: 160,
        overtimeHours: 10,
        leaveBalance: 8,
        lastCheckIn: '2024-01-15T08:00:00Z',
        shiftSchedule: {
          monday: '08:00 - 16:00',
          tuesday: '08:00 - 16:00',
          wednesday: '08:00 - 16:00',
          thursday: '08:00 - 16:00',
          friday: '08:00 - 16:00',
          saturday: '08:00 - 12:00',
          sunday: 'Nghỉ'
        },
        notes: 'Thu ngân giỏi',
        createdAt: '2021-03-20T00:00:00Z',
        updatedAt: '2024-01-15T12:15:00Z'
      },
      {
        id: '3',
        employeeCode: 'EMP003',
        fullName: 'Lê Văn C',
        firstName: 'C',
        lastName: 'Lê Văn',
        email: 'levanc@company.com',
        phone: '0369258147',
        address: '789 Đường JKL, Phường MNO',
        city: 'Bình Dương',
        dateOfBirth: '1988-12-10',
        gender: 'male',
        position: 'Nhân viên kho',
        department: 'Kho hàng',
        managerId: 'EMP001',
        managerName: 'Nguyễn Văn A',
        hireDate: '2022-06-10',
        contractType: 'full_time',
        status: 'active',
        salary: 7000000,
        hourlyRate: 40000,
        role: 'staff',
        permissions: ['inventory'],
        emergencyContact: 'Lê Thị D',
        emergencyPhone: '0123456789',
        bankAccount: '0369258147',
        taxCode: '456789123',
        socialInsurance: 'SI456789123',
        healthInsurance: 'HI456789123',
        performanceScore: 3.8,
        totalSales: 0,
        workedHours: 160,
        overtimeHours: 5,
        leaveBalance: 10,
        lastCheckIn: '2024-01-15T07:30:00Z',
        shiftSchedule: {
          monday: '07:00 - 15:00',
          tuesday: '07:00 - 15:00',
          wednesday: '07:00 - 15:00',
          thursday: '07:00 - 15:00',
          friday: '07:00 - 15:00',
          saturday: '07:00 - 11:00',
          sunday: 'Nghỉ'
        },
        notes: 'Nhân viên kho chăm chỉ',
        createdAt: '2022-06-10T00:00:00Z',
        updatedAt: '2024-01-15T10:45:00Z'
      }
    ]
    setEmployees(mockEmployees)
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
      on_leave: { label: 'Nghỉ phép', color: 'yellow', icon: Calendar },
      terminated: { label: 'Nghỉ việc', color: 'red', icon: AlertCircle }
    }
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.active
  }

  const getRoleInfo = (role: string) => {
    const roleConfig = {
      admin: { label: 'Quản trị', color: 'red', icon: Settings },
      manager: { label: 'Quản lý', color: 'blue', icon: Users },
      supervisor: { label: 'Giám sát', color: 'purple', icon: Users },
      staff: { label: 'Nhân viên', color: 'green', icon: Users },
      cashier: { label: 'Thu ngân', color: 'orange', icon: DollarSign }
    }
    return roleConfig[role as keyof typeof roleConfig] || roleConfig.staff
  }

  const getContractTypeInfo = (type: string) => {
    const typeConfig = {
      full_time: { label: 'Toàn thời gian', color: 'green' },
      part_time: { label: 'Bán thời gian', color: 'yellow' },
      contract: { label: 'Hợp đồng', color: 'blue' },
      intern: { label: 'Thực tập', color: 'purple' }
    }
    return typeConfig[type as keyof typeof typeConfig] || typeConfig.full_time
  }

  const getPerformanceLevel = (score: number) => {
    if (score >= 4.5) return { level: 'Xuất sắc', color: 'green' }
    if (score >= 4.0) return { level: 'Tốt', color: 'blue' }
    if (score >= 3.5) return { level: 'Khá', color: 'yellow' }
    if (score >= 3.0) return { level: 'Trung bình', color: 'orange' }
    return { level: 'Cần cải thiện', color: 'red' }
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

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.phone.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter
    const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter
    const matchesPosition = positionFilter === 'all' || employee.position === positionFilter
    
    return matchesSearch && matchesStatus && matchesDepartment && matchesPosition
  })

  const totalStats = {
    totalEmployees: employees.length,
    activeEmployees: employees.filter(e => e.status === 'active').length,
    onLeaveEmployees: employees.filter(e => e.status === 'on_leave').length,
    totalSalary: employees.reduce((sum, e) => sum + e.salary, 0),
    avgPerformance: employees.reduce((sum, e) => sum + e.performanceScore, 0) / employees.length,
    totalSales: employees.reduce((sum, e) => sum + e.totalSales, 0),
    totalHours: employees.reduce((sum, e) => sum + e.workedHours, 0)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý nhân viên</h1>
          <p className="text-gray-600">Quản lý thông tin và theo dõi hiệu suất nhân viên</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Xuất báo cáo
          </Button>
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Thêm nhân viên
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng nhân viên</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              {totalStats.activeEmployees} đang hoạt động
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng lương</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStats.totalSalary)}</div>
            <p className="text-xs text-muted-foreground">
              Tháng này
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hiệu suất TB</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.avgPerformance.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Điểm đánh giá
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStats.totalSales)}</div>
            <p className="text-xs text-muted-foreground">
              Nhân viên tạo ra
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
                  placeholder="Tìm theo tên, mã NV, email..."
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
                <option value="on_leave">Nghỉ phép</option>
                <option value="terminated">Nghỉ việc</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Phòng ban</label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Tất cả</option>
                <option value="Bán hàng">Bán hàng</option>
                <option value="Kho hàng">Kho hàng</option>
                <option value="Kế toán">Kế toán</option>
                <option value="Nhân sự">Nhân sự</option>
                <option value="IT">IT</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Vị trí</label>
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Tất cả</option>
                <option value="Quản lý bán hàng">Quản lý bán hàng</option>
                <option value="Thu ngân">Thu ngân</option>
                <option value="Nhân viên kho">Nhân viên kho</option>
                <option value="Kế toán">Kế toán</option>
                <option value="Nhân viên IT">Nhân viên IT</option>
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

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách nhân viên ({filteredEmployees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Nhân viên</th>
                  <th className="text-left p-3">Thông tin liên hệ</th>
                  <th className="text-left p-3">Vị trí</th>
                  <th className="text-left p-3">Lương</th>
                  <th className="text-left p-3">Hiệu suất</th>
                  <th className="text-left p-3">Trạng thái</th>
                  <th className="text-left p-3">Lần cuối</th>
                  <th className="text-left p-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => {
                  const statusInfo = getStatusInfo(employee.status)
                  const roleInfo = getRoleInfo(employee.role)
                  const contractInfo = getContractTypeInfo(employee.contractType)
                  const performanceInfo = getPerformanceLevel(employee.performanceScore)
                  const StatusIcon = statusInfo.icon
                  const RoleIcon = roleInfo.icon

                  return (
                    <tr key={employee.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full bg-${roleInfo.color}-100`}>
                            <RoleIcon className={`w-5 h-5 text-${roleInfo.color}-600`} />
                          </div>
                          <div>
                            <div className="font-medium">{employee.fullName}</div>
                            <div className="text-sm text-gray-500">{employee.employeeCode}</div>
                            <div className="text-xs text-gray-400">
                              {formatDate(employee.dateOfBirth)} • {employee.gender === 'male' ? 'Nam' : employee.gender === 'female' ? 'Nữ' : 'Khác'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-3 h-3" />
                          {employee.phone}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Mail className="w-3 h-3" />
                          {employee.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <MapPin className="w-3 h-3" />
                          {employee.city}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{employee.position}</div>
                        <div className="text-sm text-gray-500">{employee.department}</div>
                        <Badge variant="outline" className={`text-${contractInfo.color}-600 border-${contractInfo.color}-200 text-xs`}>
                          {contractInfo.label}
                        </Badge>
                        {employee.managerName && (
                          <div className="text-xs text-gray-400 mt-1">
                            QL: {employee.managerName}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{formatCurrency(employee.salary)}</div>
                        {employee.hourlyRate && (
                          <div className="text-sm text-gray-500">
                            Giờ: {formatCurrency(employee.hourlyRate)}
                          </div>
                        )}
                        <div className="text-xs text-gray-400">
                          Vào: {formatDate(employee.hireDate)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className={`text-lg font-bold text-${performanceInfo.color}-600`}>
                            {employee.performanceScore}
                          </div>
                          <div className="text-xs text-gray-500">
                            {performanceInfo.level}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          Doanh thu: {formatCurrency(employee.totalSales)}
                        </div>
                        <div className="text-xs text-gray-400">
                          Giờ làm: {employee.workedHours}h
                          {employee.overtimeHours > 0 && ` (+${employee.overtimeHours}h)`}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={`text-${statusInfo.color}-600 border-${statusInfo.color}-200`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          Phép còn: {employee.leaveBalance} ngày
                        </div>
                        {employee.lastCheckIn && (
                          <div className="text-xs text-gray-400">
                            Check-in: {getTimeAgo(employee.lastCheckIn)}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{formatDate(employee.updatedAt)}</div>
                        <div className="text-xs text-gray-500">{getTimeAgo(employee.updatedAt)}</div>
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

export default EmployeeManagementNew
