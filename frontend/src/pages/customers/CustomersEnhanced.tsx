import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  UserCheck, Plus, Search, Filter, Edit, Trash2, Eye, Phone, Mail, MapPin, 
  Building2, User, CreditCard, FileText, Package, History, AlertCircle,
  CheckCircle, XCircle, MoreVertical, Download, Upload, Star, Tag,
  TrendingUp, DollarSign, Calendar, Clock, Shield, Award
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  address: string
  type: 'individual' | 'wholesale' | 'business'
  taxNumber?: string
  status: 'active' | 'inactive'
  loyaltyPoints: number
  totalSpent: number
  totalOrders: number
  lastOrderDate: string
  createdAt: string
  debt: number
  creditLimit: number
  notes: string
  tags: string[]
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
}

const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Nguyễn Văn A',
    phone: '0123456789',
    email: 'nguyenvana@email.com',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    type: 'individual',
    status: 'active',
    loyaltyPoints: 1500,
    totalSpent: 2500000,
    totalOrders: 15,
    lastOrderDate: '2024-01-20',
    createdAt: '2023-06-01',
    debt: 0,
    creditLimit: 10000000,
    notes: 'Khách hàng VIP, ưu tiên giao hàng',
    tags: ['VIP', 'Thường xuyên'],
    tier: 'gold'
  },
  {
    id: '2',
    name: 'Công ty TNHH XYZ',
    phone: '0987654321',
    email: 'contact@xyz.com',
    address: '456 Đường DEF, Quận 3, TP.HCM',
    type: 'business',
    taxNumber: '0123456789',
    status: 'active',
    loyaltyPoints: 5000,
    totalSpent: 15000000,
    totalOrders: 45,
    lastOrderDate: '2024-01-22',
    createdAt: '2023-03-15',
    debt: 2500000,
    creditLimit: 50000000,
    notes: 'Khách hàng doanh nghiệp lớn, thanh toán 30 ngày',
    tags: ['Doanh nghiệp', 'Thanh toán chậm'],
    tier: 'platinum'
  },
  {
    id: '3',
    name: 'Cửa hàng ABC',
    phone: '0369852147',
    email: 'store@abc.com',
    address: '789 Đường GHI, Quận 5, TP.HCM',
    type: 'wholesale',
    status: 'active',
    loyaltyPoints: 3000,
    totalSpent: 8000000,
    totalOrders: 25,
    lastOrderDate: '2024-01-18',
    createdAt: '2023-08-20',
    debt: 0,
    creditLimit: 20000000,
    notes: 'Cửa hàng bán lẻ, mua sỉ thường xuyên',
    tags: ['Bán sỉ', 'Thường xuyên'],
    tier: 'silver'
  }
]

const customerTypes = {
  individual: { label: 'Khách lẻ', icon: User, color: 'blue' },
  wholesale: { label: 'Khách sỉ', icon: Package, color: 'green' },
  business: { label: 'Doanh nghiệp', icon: Building2, color: 'purple' }
}

const customerTiers = {
  bronze: { label: 'Đồng', color: 'orange' },
  silver: { label: 'Bạc', color: 'gray' },
  gold: { label: 'Vàng', color: 'yellow' },
  platinum: { label: 'Bạch kim', color: 'blue' }
}

export const CustomersEnhanced: React.FC = () => {
  const [customers] = useState<Customer[]>(mockCustomers)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedTier, setSelectedTier] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || customer.type === selectedType
    const matchesTier = selectedTier === 'all' || customer.tier === selectedTier
    const matchesStatus = selectedStatus === 'all' || customer.status === selectedStatus
    return matchesSearch && matchesType && matchesTier && matchesStatus
  })

  const stats = {
    total: customers.length,
    individual: customers.filter(c => c.type === 'individual').length,
    wholesale: customers.filter(c => c.type === 'wholesale').length,
    business: customers.filter(c => c.type === 'business').length,
    active: customers.filter(c => c.status === 'active').length,
    totalSpent: customers.reduce((sum, c) => sum + c.totalSpent, 0),
    totalDebt: customers.reduce((sum, c) => sum + c.debt, 0),
    totalOrders: customers.reduce((sum, c) => sum + c.totalOrders, 0)
  }

  const getTypeInfo = (type: string) => {
    return customerTypes[type as keyof typeof customerTypes] || customerTypes.individual
  }

  const getTierInfo = (tier: string) => {
    return customerTiers[tier as keyof typeof customerTiers] || customerTiers.bronze
  }

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    // Navigate to customer detail page
  }

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowEditModal(true)
  }

  const handleDeleteCustomer = (customer: Customer) => {
    if (confirm(`Bạn có chắc chắn muốn xóa khách hàng ${customer.name}?`)) {
      // Delete logic
      console.log('Delete customer:', customer.id)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-blue-600" />
            Quản lý khách hàng
          </h1>
          <p className="text-gray-600 mt-2">
            Quản lý khách lẻ, khách sỉ và khách doanh nghiệp. Theo dõi lịch sử mua hàng, công nợ và bảo hành
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Xuất Excel
          </Button>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Nhập Excel
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm khách hàng
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
              <p className="text-xs text-gray-500">Tổng khách hàng</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.individual}</p>
              <p className="text-xs text-gray-500">Khách lẻ</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.wholesale}</p>
              <p className="text-xs text-gray-500">Khách sỉ</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.business}</p>
              <p className="text-xs text-gray-500">Doanh nghiệp</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              <p className="text-xs text-gray-500">Đang hoạt động</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">
                {(stats.totalSpent / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-gray-500">Tổng chi tiêu</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {(stats.totalDebt / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-gray-500">Tổng công nợ</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.totalOrders}</p>
              <p className="text-xs text-gray-500">Tổng đơn hàng</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowAddModal(true)}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 khách hàng</h3>">
                <p className="text-sm text-gray-500">Tạo khách hàng mới</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <History className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 sử mua hàng</h3>">
                <p className="text-sm text-gray-500">Xem lịch sử giao dịch</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 lý công nợ</h3>">
                <p className="text-sm text-gray-500">Theo dõi công nợ khách hàng</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 cứu bảo hành</h3>">
                <p className="text-sm text-gray-500">Công cụ tra cứu cho khách</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Tìm kiếm khách hàng, SĐT, email..."
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
                <option value="all">Tất cả loại</option>
                {Object.entries(customerTypes).map(([key, type]) => (
                  <option key={key} value={key}>{type.label}</option>
                ))}
              </select>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              >
                <option value="all">Tất cả hạng</option>
                {Object.entries(customerTiers).map(([key, tier]) => (
                  <option key={key} value={key}>{tier.label}</option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Tạm dừng</option>
              </select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Bộ lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => {
          const typeInfo = getTypeInfo(customer.type)
          const tierInfo = getTierInfo(customer.tier)
          const TypeIcon = typeInfo.icon
          
          return (
            <motion.div
              key={customer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-${typeInfo.color}-100 rounded-lg flex items-center justify-center`}>
                        <TypeIcon className={`w-5 h-5 text-${typeInfo.color}-600`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{customer.name}</CardTitle>
                        <CardDescription className="text-sm text-gray-500">
                          {typeInfo.label}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                        {customer.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                      </Badge>
                      <Badge className={`bg-${tierInfo.color}-100 text-${tierInfo.color}-800`}>
                        {tierInfo.label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{customer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{customer.address}</span>
                    </div>
                    {customer.taxNumber && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span>MST: {customer.taxNumber}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{customer.totalOrders}</p>
                      <p className="text-xs text-gray-500">Đơn hàng</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {(customer.totalSpent / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-xs text-gray-500">Chi tiêu</p>
                    </div>
                  </div>

                  {customer.debt > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-800">Công nợ</span>
                      </div>
                      <p className="text-lg font-bold text-red-600 mt-1">
                        {(customer.debt / 1000000).toFixed(1)}M VNĐ
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {customer.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleViewCustomer(customer)}>
                      <Eye className="w-4 h-4 mr-1" />
                      Xem
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEditCustomer(customer)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Sửa
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteCustomer(customer)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {filteredCustomers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không tìm thấy khách hàng nào
            </h3>
            <p className="text-gray-600 mb-4">
              Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm khách hàng đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
