import React, { useState, useEffect } from 'react'
import {
  Monitor,
  Smartphone,
  Printer,
  Camera,
  Wifi,
  HardDrive,
  Cpu,
  MemoryStick,
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
  MapPin,
  User,
  Settings,
  BarChart3
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/badge'

interface Device {
  id: string
  deviceId: string
  name: string
  type: 'pos' | 'printer' | 'scanner' | 'camera' | 'router' | 'server' | 'mobile'
  brand: string
  model: string
  serialNumber: string
  macAddress?: string
  ipAddress?: string
  location: string
  branchId: string
  branchName: string
  assignedTo?: string
  assignedToName?: string
  status: 'active' | 'inactive' | 'maintenance' | 'error' | 'offline'
  lastSeen: string
  firmwareVersion?: string
  softwareVersion?: string
  warrantyExpiry?: string
  purchaseDate: string
  purchasePrice: number
  notes?: string
  createdAt: string
  updatedAt: string
}

const DeviceManagement: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Device | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [branchFilter, setBranchFilter] = useState('all')

  // Mock data
  useEffect(() => {
    const mockDevices: Device[] = [
      {
        id: '1',
        deviceId: 'DEV001',
        name: 'POS Terminal 1',
        type: 'pos',
        brand: 'Ingenico',
        model: 'iCT250',
        serialNumber: 'SN123456789',
        macAddress: '00:1B:44:11:3A:B7',
        ipAddress: '192.168.1.100',
        location: 'Quầy thu ngân 1',
        branchId: 'BR001',
        branchName: 'Chi nhánh trung tâm',
        assignedTo: 'EMP001',
        assignedToName: 'Nguyễn Văn A',
        status: 'active',
        lastSeen: '2024-01-15T14:30:00Z',
        firmwareVersion: 'v2.1.3',
        softwareVersion: 'v1.5.2',
        warrantyExpiry: '2025-06-15',
        purchaseDate: '2023-06-15',
        purchasePrice: 15000000,
        notes: 'Thiết bị chính',
        createdAt: '2023-06-15T00:00:00Z',
        updatedAt: '2024-01-15T14:30:00Z'
      },
      {
        id: '2',
        deviceId: 'DEV002',
        name: 'Thermal Printer',
        type: 'printer',
        brand: 'Epson',
        model: 'TM-T20III',
        serialNumber: 'SN987654321',
        macAddress: '00:1B:44:11:3A:B8',
        ipAddress: '192.168.1.101',
        location: 'Quầy thu ngân 1',
        branchId: 'BR001',
        branchName: 'Chi nhánh trung tâm',
        assignedTo: 'EMP001',
        assignedToName: 'Nguyễn Văn A',
        status: 'active',
        lastSeen: '2024-01-15T14:25:00Z',
        firmwareVersion: 'v1.2.1',
        warrantyExpiry: '2024-12-20',
        purchaseDate: '2022-12-20',
        purchasePrice: 2500000,
        notes: 'Máy in hóa đơn',
        createdAt: '2022-12-20T00:00:00Z',
        updatedAt: '2024-01-15T14:25:00Z'
      },
      {
        id: '3',
        deviceId: 'DEV003',
        name: 'Barcode Scanner',
        type: 'scanner',
        brand: 'Zebra',
        model: 'DS2208',
        serialNumber: 'SN456789123',
        macAddress: '00:1B:44:11:3A:B9',
        ipAddress: '192.168.1.102',
        location: 'Kho hàng',
        branchId: 'BR001',
        branchName: 'Chi nhánh trung tâm',
        assignedTo: 'EMP002',
        assignedToName: 'Trần Thị B',
        status: 'maintenance',
        lastSeen: '2024-01-14T16:45:00Z',
        firmwareVersion: 'v3.0.5',
        warrantyExpiry: '2025-03-10',
        purchaseDate: '2023-03-10',
        purchasePrice: 3500000,
        notes: 'Đang bảo trì',
        createdAt: '2023-03-10T00:00:00Z',
        updatedAt: '2024-01-14T16:45:00Z'
      }
    ]
    setDevices(mockDevices)
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
      error: { label: 'Lỗi', color: 'red', icon: AlertCircle },
      offline: { label: 'Offline', color: 'red', icon: XCircle }
    }
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.active
  }

  const getTypeInfo = (type: string) => {
    const typeConfig = {
      pos: { label: 'POS', color: 'blue', icon: Monitor },
      printer: { label: 'Máy in', color: 'purple', icon: Printer },
      scanner: { label: 'Scanner', color: 'green', icon: Camera },
      camera: { label: 'Camera', color: 'orange', icon: Camera },
      router: { label: 'Router', color: 'cyan', icon: Wifi },
      server: { label: 'Server', color: 'red', icon: HardDrive },
      mobile: { label: 'Mobile', color: 'pink', icon: Smartphone }
    }
    return typeConfig[type as keyof typeof typeConfig] || typeConfig.pos
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Vừa xong'
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} giờ trước`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} ngày trước`
  }

  const getWarrantyStatus = (expiryDate?: string) => {
    if (!expiryDate) return { status: 'unknown', label: 'Không xác định', color: 'gray' }
    
    const now = new Date()
    const expiry = new Date(expiryDate)
    const diffInDays = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays < 0) return { status: 'expired', label: 'Hết hạn', color: 'red' }
    if (diffInDays <= 30) return { status: 'expiring', label: 'Sắp hết hạn', color: 'yellow' }
    return { status: 'valid', label: 'Còn hiệu lực', color: 'green' }
  }

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.deviceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.model.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || device.status === statusFilter
    const matchesType = typeFilter === 'all' || device.type === typeFilter
    const matchesBranch = branchFilter === 'all' || device.branchId === branchFilter
    
    return matchesSearch && matchesStatus && matchesType && matchesBranch
  })

  const totalStats = {
    totalDevices: devices.length,
    activeDevices: devices.filter(d => d.status === 'active').length,
    offlineDevices: devices.filter(d => d.status === 'offline').length,
    maintenanceDevices: devices.filter(d => d.status === 'maintenance').length,
    errorDevices: devices.filter(d => d.status === 'error').length,
    totalValue: devices.reduce((sum, d) => sum + d.purchasePrice, 0),
    warrantyExpiring: devices.filter(d => {
      if (!d.warrantyExpiry) return false
      const expiry = new Date(d.warrantyExpiry)
      const now = new Date()
      const diffInDays = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return diffInDays <= 30 && diffInDays >= 0
    }).length
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý thiết bị</h1>
          <p className="text-gray-600">Theo dõi và quản lý tất cả thiết bị trong hệ thống</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => {
            const header = 'deviceId,name,type,brand,model,serial,status,branch\n'
            const rows = filteredDevices.map(d => `${d.deviceId},${d.name},${d.type},${d.brand},${d.model},${d.serialNumber},${d.status},${d.branchName}`).join('\n')
            const csv = header + rows
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `devices_${new Date().toISOString().slice(0,10)}.csv`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }}>
            <Download className="w-4 h-4 mr-2" />
            Xuất báo cáo
          </Button>
          <Button onClick={() => alert('Thêm thiết bị mới')}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm thiết bị
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng thiết bị</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalDevices}</div>
            <p className="text-xs text-muted-foreground">
              Tất cả thiết bị
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoạt động</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalStats.activeDevices}</div>
            <p className="text-xs text-muted-foreground">
              Đang hoạt động
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalStats.offlineDevices}</div>
            <p className="text-xs text-muted-foreground">
              Không kết nối
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bảo trì</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{totalStats.maintenanceDevices}</div>
            <p className="text-xs text-muted-foreground">
              Đang bảo trì
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
                  placeholder="Tìm theo tên, mã, serial..."
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
                <option value="error">Lỗi</option>
                <option value="offline">Offline</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Loại thiết bị</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Tất cả</option>
                <option value="pos">POS</option>
                <option value="printer">Máy in</option>
                <option value="scanner">Scanner</option>
                <option value="camera">Camera</option>
                <option value="router">Router</option>
                <option value="server">Server</option>
                <option value="mobile">Mobile</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Chi nhánh</label>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Tất cả</option>
                <option value="BR001">Chi nhánh trung tâm</option>
                <option value="BR002">Chi nhánh 2</option>
                <option value="BR003">Chi nhánh 3</option>
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

      {/* Devices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách thiết bị ({filteredDevices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Thiết bị</th>
                  <th className="text-left p-3">Thông tin kỹ thuật</th>
                  <th className="text-left p-3">Vị trí</th>
                  <th className="text-left p-3">Người phụ trách</th>
                  <th className="text-left p-3">Trạng thái</th>
                  <th className="text-left p-3">Bảo hành</th>
                  <th className="text-left p-3">Lần cuối</th>
                  <th className="text-left p-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device) => {
                  const statusInfo = getStatusInfo(device.status)
                  const typeInfo = getTypeInfo(device.type)
                  const warrantyStatus = getWarrantyStatus(device.warrantyExpiry)
                  const StatusIcon = statusInfo.icon
                  const TypeIcon = typeInfo.icon

                  return (
                    <tr key={device.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-${typeInfo.color}-100`}>
                            <TypeIcon className={`w-5 h-5 text-${typeInfo.color}-600`} />
                          </div>
                          <div>
                            <div className="font-medium">{device.name}</div>
                            <div className="text-sm text-gray-500">{device.deviceId}</div>
                            <div className="text-xs text-gray-400">{device.brand} {device.model}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <div>Serial: {device.serialNumber}</div>
                          {device.macAddress && (
                            <div>MAC: {device.macAddress}</div>
                          )}
                          {device.ipAddress && (
                            <div>IP: {device.ipAddress}</div>
                          )}
                          {device.firmwareVersion && (
                            <div>Firmware: {device.firmwareVersion}</div>
                          )}
                          {device.softwareVersion && (
                            <div>Software: {device.softwareVersion}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-3 h-3" />
                          {device.location}
                        </div>
                        <div className="text-xs text-gray-500">{device.branchName}</div>
                      </td>
                      <td className="p-3">
                        {device.assignedToName ? (
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3" />
                            <div>
                              <div className="text-sm font-medium">{device.assignedToName}</div>
                              <div className="text-xs text-gray-500">{device.assignedTo}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Chưa phân công</span>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={`text-${statusInfo.color}-600 border-${statusInfo.color}-200`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {device.warrantyExpiry ? (
                          <div>
                            <Badge variant="outline" className={`text-${warrantyStatus.color}-600 border-${warrantyStatus.color}-200`}>
                              {warrantyStatus.label}
                            </Badge>
                            <div className="text-xs text-gray-500 mt-1">
                              Hết hạn: {formatDate(device.warrantyExpiry)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Không có</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{formatDate(device.lastSeen)}</div>
                        <div className="text-xs text-gray-500">{getTimeAgo(device.lastSeen)}</div>
                        <div className="text-xs text-gray-400">
                          Mua: {formatDate(device.purchaseDate)}
                        </div>
                        <div className="text-xs text-gray-400">
                          Giá: {formatCurrency(device.purchasePrice)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setSelected(device)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setSelected(device)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Settings className="w-4 h-4" />
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
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Chi tiết thiết bị</h3>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Tên:</span> {selected.name}</div>
              <div><span className="font-medium">Mã:</span> {selected.deviceId}</div>
              <div><span className="font-medium">Loại:</span> {selected.type}</div>
              <div><span className="font-medium">Serial:</span> {selected.serialNumber}</div>
              <div><span className="font-medium">Chi nhánh:</span> {selected.branchName}</div>
              <div><span className="font-medium">Trạng thái:</span> {getStatusInfo(selected.status).label}</div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelected(null)}>Đóng</Button>
              <Button onClick={() => alert('Lưu cập nhật (tương lai sẽ gọi API)')}>Lưu</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Simple details modal
// Note: Using inline modal to avoid extra imports
// Render after table

export default DeviceManagement
