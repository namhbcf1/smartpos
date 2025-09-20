import React, { useState, useEffect } from 'react'
import {
  Shield,
  UserCheck,
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
  Users,
  Settings,
  BarChart3,
  DollarSign,
  Package,
  ShoppingCart,
  FileText,
  Building2,
  MapPin,
  Monitor,
  MessageSquare,
  CreditCard,
  TrendingUp
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/badge'

interface Permission {
  id: string
  name: string
  description: string
  category: string
  icon: React.ReactNode
}

interface Role {
  id: string
  name: string
  description: string
  level: number
  permissions: string[]
  userCount: number
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')

  // Mock permissions data
  const mockPermissions: Permission[] = [
    // Dashboard & Reports
    { id: 'dashboard.view', name: 'Xem Dashboard', description: 'Xem trang tổng quan', category: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'reports.view', name: 'Xem báo cáo', description: 'Xem các báo cáo hệ thống', category: 'Reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'reports.export', name: 'Xuất báo cáo', description: 'Xuất báo cáo ra file', category: 'Reports', icon: <Download className="w-4 h-4" /> },
    
    // Sales & POS
    { id: 'pos.access', name: 'Truy cập POS', description: 'Sử dụng hệ thống POS', category: 'Sales', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'sales.view', name: 'Xem bán hàng', description: 'Xem lịch sử bán hàng', category: 'Sales', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'sales.create', name: 'Tạo đơn hàng', description: 'Tạo đơn hàng mới', category: 'Sales', icon: <Plus className="w-4 h-4" /> },
    { id: 'sales.edit', name: 'Sửa đơn hàng', description: 'Chỉnh sửa đơn hàng', category: 'Sales', icon: <Edit className="w-4 h-4" /> },
    { id: 'sales.delete', name: 'Xóa đơn hàng', description: 'Xóa đơn hàng', category: 'Sales', icon: <Trash2 className="w-4 h-4" /> },
    
    // Inventory
    { id: 'inventory.view', name: 'Xem kho hàng', description: 'Xem thông tin kho hàng', category: 'Inventory', icon: <Package className="w-4 h-4" /> },
    { id: 'inventory.edit', name: 'Sửa kho hàng', description: 'Chỉnh sửa kho hàng', category: 'Inventory', icon: <Edit className="w-4 h-4" /> },
    { id: 'inventory.stock_in', name: 'Nhập kho', description: 'Thực hiện nhập kho', category: 'Inventory', icon: <Package className="w-4 h-4" /> },
    { id: 'inventory.stock_out', name: 'Xuất kho', description: 'Thực hiện xuất kho', category: 'Inventory', icon: <Package className="w-4 h-4" /> },
    
    // Customers & Partners
    { id: 'customers.view', name: 'Xem khách hàng', description: 'Xem danh sách khách hàng', category: 'Customers', icon: <Users className="w-4 h-4" /> },
    { id: 'customers.edit', name: 'Sửa khách hàng', description: 'Chỉnh sửa thông tin khách hàng', category: 'Customers', icon: <Edit className="w-4 h-4" /> },
    { id: 'suppliers.view', name: 'Xem nhà cung cấp', description: 'Xem danh sách nhà cung cấp', category: 'Suppliers', icon: <Building2 className="w-4 h-4" /> },
    { id: 'suppliers.edit', name: 'Sửa nhà cung cấp', description: 'Chỉnh sửa thông tin nhà cung cấp', category: 'Suppliers', icon: <Edit className="w-4 h-4" /> },
    
    // Financial
    { id: 'payments.view', name: 'Xem thanh toán', description: 'Xem lịch sử thanh toán', category: 'Financial', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'payments.process', name: 'Xử lý thanh toán', description: 'Thực hiện thanh toán', category: 'Financial', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'invoices.view', name: 'Xem hóa đơn', description: 'Xem danh sách hóa đơn', category: 'Financial', icon: <FileText className="w-4 h-4" /> },
    { id: 'invoices.create', name: 'Tạo hóa đơn', description: 'Tạo hóa đơn mới', category: 'Financial', icon: <Plus className="w-4 h-4" /> },
    
    // Support
    { id: 'support.view', name: 'Xem hỗ trợ', description: 'Xem ticket hỗ trợ', category: 'Support', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'support.manage', name: 'Quản lý hỗ trợ', description: 'Xử lý ticket hỗ trợ', category: 'Support', icon: <Settings className="w-4 h-4" /> },
    
    // System Management
    { id: 'employees.view', name: 'Xem nhân viên', description: 'Xem danh sách nhân viên', category: 'System', icon: <Users className="w-4 h-4" /> },
    { id: 'employees.edit', name: 'Sửa nhân viên', description: 'Chỉnh sửa thông tin nhân viên', category: 'System', icon: <Edit className="w-4 h-4" /> },
    { id: 'roles.view', name: 'Xem phân quyền', description: 'Xem danh sách vai trò', category: 'System', icon: <Shield className="w-4 h-4" /> },
    { id: 'roles.edit', name: 'Sửa phân quyền', description: 'Chỉnh sửa vai trò và quyền', category: 'System', icon: <Edit className="w-4 h-4" /> },
    { id: 'devices.view', name: 'Xem thiết bị', description: 'Xem danh sách thiết bị', category: 'System', icon: <Monitor className="w-4 h-4" /> },
    { id: 'branches.view', name: 'Xem chi nhánh', description: 'Xem danh sách chi nhánh', category: 'System', icon: <MapPin className="w-4 h-4" /> },
    { id: 'branches.edit', name: 'Sửa chi nhánh', description: 'Chỉnh sửa thông tin chi nhánh', category: 'System', icon: <Edit className="w-4 h-4" /> },
    { id: 'settings.view', name: 'Xem cài đặt', description: 'Xem cài đặt hệ thống', category: 'System', icon: <Settings className="w-4 h-4" /> },
    { id: 'settings.edit', name: 'Sửa cài đặt', description: 'Chỉnh sửa cài đặt hệ thống', category: 'System', icon: <Edit className="w-4 h-4" /> }
  ]

  // Mock roles data
  useEffect(() => {
    const mockRoles: Role[] = [
      {
        id: '1',
        name: 'Super Admin',
        description: 'Quyền cao nhất, có thể truy cập tất cả tính năng',
        level: 1,
        permissions: mockPermissions.map(p => p.id),
        userCount: 1,
        isSystem: true,
        createdAt: '2020-01-01T00:00:00Z',
        updatedAt: '2024-01-15T14:30:00Z'
      },
      {
        id: '2',
        name: 'Manager',
        description: 'Quản lý có quyền xem và quản lý hầu hết các module',
        level: 2,
        permissions: [
          'dashboard.view', 'reports.view', 'reports.export',
          'pos.access', 'sales.view', 'sales.create', 'sales.edit',
          'inventory.view', 'inventory.edit', 'inventory.stock_in', 'inventory.stock_out',
          'customers.view', 'customers.edit', 'suppliers.view', 'suppliers.edit',
          'payments.view', 'payments.process', 'invoices.view', 'invoices.create',
          'support.view', 'support.manage',
          'employees.view', 'employees.edit', 'branches.view', 'branches.edit',
          'settings.view'
        ],
        userCount: 3,
        isSystem: false,
        createdAt: '2020-01-01T00:00:00Z',
        updatedAt: '2024-01-15T14:30:00Z'
      },
      {
        id: '3',
        name: 'Cashier',
        description: 'Thu ngân có quyền sử dụng POS và xem thông tin cơ bản',
        level: 3,
        permissions: [
          'dashboard.view',
          'pos.access', 'sales.view', 'sales.create',
          'inventory.view',
          'customers.view', 'customers.edit',
          'payments.view', 'payments.process',
          'support.view'
        ],
        userCount: 8,
        isSystem: false,
        createdAt: '2020-01-01T00:00:00Z',
        updatedAt: '2024-01-15T14:30:00Z'
      },
      {
        id: '4',
        name: 'Staff',
        description: 'Nhân viên có quyền hạn chế, chỉ xem thông tin cơ bản',
        level: 4,
        permissions: [
          'dashboard.view',
          'sales.view',
          'inventory.view',
          'customers.view',
          'support.view'
        ],
        userCount: 12,
        isSystem: false,
        createdAt: '2020-01-01T00:00:00Z',
        updatedAt: '2024-01-15T14:30:00Z'
      }
    ]
    setRoles(mockRoles)
    setPermissions(mockPermissions)
    setLoading(false)
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const getLevelInfo = (level: number) => {
    const levelConfig = {
      1: { label: 'Cao nhất', color: 'red', icon: Shield },
      2: { label: 'Cao', color: 'orange', icon: UserCheck },
      3: { label: 'Trung bình', color: 'blue', icon: Users },
      4: { label: 'Thấp', color: 'green', icon: Users }
    }
    return levelConfig[level as keyof typeof levelConfig] || levelConfig[4]
  }

  const getPermissionById = (permissionId: string) => {
    return permissions.find(p => p.id === permissionId)
  }

  const getPermissionsByCategory = (permissionIds: string[]) => {
    const categories: { [key: string]: Permission[] } = {}
    permissionIds.forEach(id => {
      const permission = getPermissionById(id)
      if (permission) {
        if (!categories[permission.category]) {
          categories[permission.category] = []
        }
        categories[permission.category].push(permission)
      }
    })
    return categories
  }

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLevel = levelFilter === 'all' || role.level.toString() === levelFilter
    
    return matchesSearch && matchesLevel
  })

  const totalStats = {
    totalRoles: roles.length,
    systemRoles: roles.filter(r => r.isSystem).length,
    customRoles: roles.filter(r => !r.isSystem).length,
    totalUsers: roles.reduce((sum, r) => sum + r.userCount, 0),
    avgPermissions: roles.reduce((sum, r) => sum + r.permissions.length, 0) / roles.length
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý phân quyền</h1>
          <p className="text-gray-600">Quản lý vai trò và quyền truy cập trong hệ thống</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Xuất báo cáo
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Tạo vai trò mới
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng vai trò</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalRoles}</div>
            <p className="text-xs text-muted-foreground">
              {totalStats.systemRoles} hệ thống, {totalStats.customRoles} tùy chỉnh
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Được phân quyền
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quyền TB</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(totalStats.avgPermissions)}</div>
            <p className="text-xs text-muted-foreground">
              Quyền mỗi vai trò
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng quyền</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{permissions.length}</div>
            <p className="text-xs text-muted-foreground">
              Quyền có sẵn
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Tìm kiếm</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm theo tên vai trò..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Cấp độ</label>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Tất cả</option>
                <option value="1">Cao nhất</option>
                <option value="2">Cao</option>
                <option value="3">Trung bình</option>
                <option value="4">Thấp</option>
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

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách vai trò ({filteredRoles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Vai trò</th>
                  <th className="text-left p-3">Cấp độ</th>
                  <th className="text-left p-3">Quyền hạn</th>
                  <th className="text-left p-3">Người dùng</th>
                  <th className="text-left p-3">Loại</th>
                  <th className="text-left p-3">Cập nhật</th>
                  <th className="text-left p-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((role) => {
                  const levelInfo = getLevelInfo(role.level)
                  const LevelIcon = levelInfo.icon
                  const permissionsByCategory = getPermissionsByCategory(role.permissions)

                  return (
                    <tr key={role.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-${levelInfo.color}-100`}>
                            <LevelIcon className={`w-5 h-5 text-${levelInfo.color}-600`} />
                          </div>
                          <div>
                            <div className="font-medium">{role.name}</div>
                            <div className="text-sm text-gray-500">{role.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={`text-${levelInfo.color}-600 border-${levelInfo.color}-200`}>
                          {levelInfo.label}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          Cấp {role.level}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm font-medium">{role.permissions.length} quyền</div>
                        <div className="text-xs text-gray-500">
                          {Object.keys(permissionsByCategory).length} danh mục
                        </div>
                        <div className="mt-2 space-y-1">
                          {Object.entries(permissionsByCategory).slice(0, 3).map(([category, perms]) => (
                            <div key={category} className="text-xs">
                              <span className="font-medium">{category}:</span> {perms.length} quyền
                            </div>
                          ))}
                          {Object.keys(permissionsByCategory).length > 3 && (
                            <div className="text-xs text-gray-400">
                              +{Object.keys(permissionsByCategory).length - 3} danh mục khác
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-center">
                          <div className="text-lg font-bold">{role.userCount}</div>
                          <div className="text-xs text-gray-500">người dùng</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={role.isSystem ? 'text-blue-600 border-blue-200' : 'text-green-600 border-green-200'}>
                          {role.isSystem ? 'Hệ thống' : 'Tùy chỉnh'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{formatDate(role.updatedAt)}</div>
                        <div className="text-xs text-gray-500">
                          Tạo: {formatDate(role.createdAt)}
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
                          {!role.isSystem && (
                            <Button size="sm" variant="outline">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
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

export default RoleManagement
