import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, UserCheck, Building2, Truck, Store, Plus, TrendingUp, DollarSign, Package, MapPin, Phone, Mail, Eye, Edit, Trash2, Search, Filter } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { useNavigate } from 'react-router-dom'

interface Partner {
  id: string
  name: string
  type: 'customer' | 'supplier' | 'distributor' | 'agent'
  code: string
  contactPerson: string
  phone: string
  email: string
  region: string
  status: 'active' | 'inactive'
  totalOrders: number
  totalRevenue: number
  lastOrderDate: string
}

// Mock data
const mockPartners: Partner[] = [
  {
    id: '1',
    name: 'Công ty TNHH ABC',
    type: 'customer',
    code: 'KH001',
    contactPerson: 'Nguyễn Văn A',
    phone: '0901234567',
    email: 'abc@company.com',
    region: 'Hà Nội',
    status: 'active',
    totalOrders: 156,
    totalRevenue: 2450000000,
    lastOrderDate: '2024-01-15'
  },
  {
    id: '2',
    name: 'Nhà phân phối XYZ',
    type: 'distributor',
    code: 'NPP001',
    contactPerson: 'Trần Thị B',
    phone: '0912345678',
    email: 'xyz@distributor.com',
    region: 'TP.HCM',
    status: 'active',
    totalOrders: 89,
    totalRevenue: 1680000000,
    lastOrderDate: '2024-01-14'
  },
  {
    id: '3',
    name: 'Đại lý DEF',
    type: 'agent',
    code: 'DL001',
    contactPerson: 'Lê Văn C',
    phone: '0923456789',
    email: 'def@agent.com',
    region: 'Đà Nẵng',
    status: 'active',
    totalOrders: 234,
    totalRevenue: 890000000,
    lastOrderDate: '2024-01-13'
  },
  {
    id: '4',
    name: 'Nhà cung cấp GHI',
    type: 'supplier',
    code: 'NCC001',
    contactPerson: 'Phạm Thị D',
    phone: '0934567890',
    email: 'ghi@supplier.com',
    region: 'Hải Phòng',
    status: 'inactive',
    totalOrders: 67,
    totalRevenue: 450000000,
    lastOrderDate: '2023-12-20'
  }
]

// Statistics calculation
const calculateStats = (partners: Partner[]) => {
  const active = partners.filter(p => p.status === 'active').length
  const customers = partners.filter(p => p.type === 'customer').length
  const suppliers = partners.filter(p => p.type === 'supplier').length
  const distributors = partners.filter(p => p.type === 'distributor').length
  const agents = partners.filter(p => p.type === 'agent').length
  const totalOrders = partners.reduce((sum, p) => sum + p.totalOrders, 0)
  const totalRevenue = partners.reduce((sum, p) => sum + p.totalRevenue, 0)

  return { active, customers, suppliers, distributors, agents, totalOrders, totalRevenue }
}

// Partner type configuration
const getPartnerTypeInfo = (type: string) => {
  const config = {
    customer: { label: 'Khách hàng', icon: UserCheck, color: 'blue', badge: 'Lẻ/Sỉ/DN' },
    supplier: { label: 'Nhà cung cấp', icon: Building2, color: 'green', badge: 'NCC' },
    distributor: { label: 'Nhà phân phối', icon: Truck, color: 'purple', badge: 'NPP' },
    agent: { label: 'Đại lý', icon: Store, color: 'orange', badge: 'ĐL' }
  }
  return config[type as keyof typeof config] || config.customer
}

export const Partners: React.FC = () => {
  const navigate = useNavigate()
  const [partners] = useState<Partner[]>(mockPartners)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const stats = calculateStats(partners)

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || partner.type === typeFilter
    const matchesStatus = statusFilter === 'all' || partner.status === statusFilter

    return matchesSearch && matchesType && matchesStatus
  })

  const handleAddPartner = (type: string) => {
    const routes = {
      customer: '/customers',
      supplier: '/suppliers',
      distributor: '/distributors',
      agent: '/agents'
    }
    navigate(routes[type as keyof typeof routes] || '/customers')
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-teal-600" />
            Quản lý đối tác
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý khách hàng, nhà cung cấp, nhà phân phối và đại lý
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button onClick={() => handleAddPartner('customer')}>
            <UserCheck className="w-4 h-4 mr-2" />
            Thêm khách hàng
          </Button>
          <Button variant="outline" onClick={() => handleAddPartner('supplier')}>
            <Building2 className="w-4 h-4 mr-2" />
            Thêm NCC
          </Button>
          <Button variant="outline" onClick={() => handleAddPartner('distributor')}>
            <Truck className="w-4 h-4 mr-2" />
            Thêm NPP
          </Button>
          <Button variant="outline" onClick={() => handleAddPartner('agent')}>
            <Store className="w-4 h-4 mr-2" />
            Thêm đại lý
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{partners.length}</p>
              <p className="text-xs text-gray-500">Tổng đối tác</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              <p className="text-xs text-gray-500">Đang hoạt động</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.customers}</p>
              <p className="text-xs text-gray-500">Khách hàng</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.suppliers}</p>
              <p className="text-xs text-gray-500">Nhà cung cấp</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.distributors}</p>
              <p className="text-xs text-gray-500">NPP</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.agents}</p>
              <p className="text-xs text-gray-500">Đại lý</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">{stats.totalOrders}</p>
              <p className="text-xs text-gray-500">Tổng đơn hàng</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {(stats.totalRevenue / 1000000000).toFixed(1)}B
              </p>
              <p className="text-xs text-gray-500">Tổng doanh thu</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/customers')}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-blue-100">
                <UserCheck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Khách hàng</h3>
                <p className="text-sm text-gray-500">Quản lý khách lẻ, sỉ, doanh nghiệp</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/suppliers')}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-green-100">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Nhà cung cấp</h3>
                <p className="text-sm text-gray-500">Quản lý nguồn hàng, hợp đồng</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/distributors')}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-purple-100">
                <Truck className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Nhà phân phối</h3>
                <p className="text-sm text-gray-500">Nhà phân phối cấp 1, cấp 2</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/agents')}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-orange-100">
                <Store className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Đại lý</h3>
                <p className="text-sm text-gray-500">Chi nhánh, shop, reseller</p>
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
                  placeholder="Tìm kiếm tên, mã, người liên hệ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả loại</option>
                <option value="customer">Khách hàng</option>
                <option value="supplier">Nhà cung cấp</option>
                <option value="distributor">NPP</option>
                <option value="agent">Đại lý</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Partners List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPartners.map((partner) => {
          const typeInfo = getPartnerTypeInfo(partner.type)
          const IconComponent = typeInfo.icon

          return (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group"
            >
              <Card className="hover:shadow-lg transition-shadow h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-${typeInfo.color}-100`}>
                        <IconComponent className={`w-5 h-5 text-${typeInfo.color}-600`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{partner.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {partner.code}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge variant={partner.status === 'active' ? 'default' : 'secondary'}>
                        {partner.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {typeInfo.badge}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{partner.region}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{partner.contactPerson}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{partner.phone}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{partner.email}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{partner.totalOrders}</p>
                      <p className="text-xs text-gray-500">Đơn hàng</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {(partner.totalRevenue / 1000000).toFixed(0)}M
                      </p>
                      <p className="text-xs text-gray-500">Doanh thu</p>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      Xem
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      Sửa
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {filteredPartners.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không tìm thấy đối tác nào
            </h3>
            <p className="text-gray-600 mb-4">
              Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => handleAddPartner('customer')}>
                <UserCheck className="w-4 h-4 mr-2" />
                Thêm khách hàng
              </Button>
              <Button variant="outline" onClick={() => handleAddPartner('supplier')}>
                <Building2 className="w-4 h-4 mr-2" />
                Thêm NCC
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Partners