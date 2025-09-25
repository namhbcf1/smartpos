import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Building2, Plus, Search, Filter, Edit, Trash2, Eye, Phone, Mail, MapPin, 
  FileText, Package, History, AlertCircle, CheckCircle, XCircle, MoreVertical,
  Download, Upload, DollarSign, Calendar, Clock, Shield, Award, TrendingUp,
  CreditCard, FileCheck, Truck, Users, Globe, Star
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/badge'

interface Supplier {
  id: string
  name: string
  companyName: string
  taxNumber: string
  contactPerson: string
  phone: string
  email: string
  address: string
  website?: string
  status: 'active' | 'inactive'
  category: string
  totalOrders: number
  totalValue: number
  lastOrderDate: string
  createdAt: string
  contractExpiry: string
  paymentTerms: string
  discountRate: number
  creditLimit: number
  currentDebt: number
  notes: string
  tags: string[]
  rating: number
  products: string[]
}

const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'Công ty TNHH ABC Electronics',
    companyName: 'ABC Electronics Co., Ltd',
    taxNumber: '0123456789',
    contactPerson: 'Nguyễn Văn A',
    phone: '0123456789',
    email: 'contact@abc-electronics.com',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    website: 'www.abc-electronics.com',
    status: 'active',
    category: 'Điện tử',
    totalOrders: 45,
    totalValue: 2500000000,
    lastOrderDate: '2024-01-20',
    createdAt: '2023-06-01',
    contractExpiry: '2024-12-31',
    paymentTerms: '30 ngày',
    discountRate: 15,
    creditLimit: 100000000,
    currentDebt: 25000000,
    notes: 'Nhà cung cấp chính cho sản phẩm điện tử, giao hàng nhanh',
    tags: ['Điện tử', 'Chính thức', 'Giao hàng nhanh'],
    rating: 4.5,
    products: ['Laptop', 'Điện thoại', 'Phụ kiện']
  },
  {
    id: '2',
    name: 'Công ty TNHH XYZ Furniture',
    companyName: 'XYZ Furniture Co., Ltd',
    taxNumber: '0987654321',
    contactPerson: 'Trần Thị B',
    phone: '0987654321',
    email: 'sales@xyz-furniture.com',
    address: '456 Đường DEF, Quận 3, TP.HCM',
    website: 'www.xyz-furniture.com',
    status: 'active',
    category: 'Nội thất',
    totalOrders: 25,
    totalValue: 1800000000,
    lastOrderDate: '2024-01-18',
    createdAt: '2023-08-15',
    contractExpiry: '2024-08-15',
    paymentTerms: '15 ngày',
    discountRate: 10,
    creditLimit: 50000000,
    currentDebt: 0,
    notes: 'Chuyên cung cấp nội thất văn phòng, chất lượng tốt',
    tags: ['Nội thất', 'Văn phòng', 'Chất lượng'],
    rating: 4.2,
    products: ['Bàn ghế', 'Tủ', 'Kệ']
  },
  {
    id: '3',
    name: 'Công ty TNHH DEF Office Supplies',
    companyName: 'DEF Office Supplies Co., Ltd',
    taxNumber: '0369852147',
    contactPerson: 'Lê Văn C',
    phone: '0369852147',
    email: 'info@def-office.com',
    address: '789 Đường GHI, Quận 5, TP.HCM',
    status: 'inactive',
    category: 'Văn phòng phẩm',
    totalOrders: 15,
    totalValue: 500000000,
    lastOrderDate: '2023-12-15',
    createdAt: '2023-10-01',
    contractExpiry: '2023-12-31',
    paymentTerms: '7 ngày',
    discountRate: 5,
    creditLimit: 20000000,
    currentDebt: 5000000,
    notes: 'Tạm dừng hợp tác do vấn đề chất lượng',
    tags: ['Văn phòng phẩm', 'Tạm dừng'],
    rating: 3.0,
    products: ['Giấy', 'Bút', 'Máy in']
  }
]

const supplierCategories = {
  'Điện tử': { color: 'blue' },
  'Nội thất': { color: 'green' },
  'Văn phòng phẩm': { color: 'purple' },
  'Thực phẩm': { color: 'orange' },
  'Thời trang': { color: 'pink' },
  'Khác': { color: 'gray' }
}

export const SuppliersEnhanced: React.FC = () => {
  const [suppliers] = useState<Supplier[]>(mockSuppliers)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.phone.includes(searchTerm) ||
                         supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || supplier.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || supplier.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const stats = {
    total: suppliers.length,
    active: suppliers.filter(s => s.status === 'active').length,
    inactive: suppliers.filter(s => s.status === 'inactive').length,
    totalOrders: suppliers.reduce((sum, s) => sum + s.totalOrders, 0),
    totalValue: suppliers.reduce((sum, s) => sum + s.totalValue, 0),
    totalDebt: suppliers.reduce((sum, s) => sum + s.currentDebt, 0),
    expiringContracts: suppliers.filter(s => {
      const expiryDate = new Date(s.contractExpiry)
      const today = new Date()
      const diffTime = expiryDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays <= 30 && diffDays > 0
    }).length
  }

  const getCategoryColor = (category: string) => {
    return supplierCategories[category as keyof typeof supplierCategories]?.color || 'gray'
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  const handleViewSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    // Navigate to supplier detail page
  }

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setShowEditModal(true)
  }

  const handleDeleteSupplier = (supplier: Supplier) => {
    if (confirm(`Bạn có chắc chắn muốn xóa nhà cung cấp ${supplier.name}?`)) {
      // Delete logic
      console.log('Delete supplier:', supplier.id)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-green-600" />
            Quản lý nhà cung cấp
          </h1>
          <p className="text-gray-600 mt-2">
            Quản lý nguồn hàng và hợp đồng nhập. Theo dõi lịch sử giao dịch, thanh toán và chiết khấu
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
            Thêm nhà cung cấp
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
              <p className="text-xs text-gray-500">Tổng NCC</p>
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
              <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
              <p className="text-xs text-gray-500">Tạm dừng</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.totalOrders}</p>
              <p className="text-xs text-gray-500">Tổng đơn hàng</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">
                {(stats.totalValue / 1000000000).toFixed(1)}B
              </p>
              <p className="text-xs text-gray-500">Tổng giá trị</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {(stats.totalDebt / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-gray-500">Tổng công nợ</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.expiringContracts}</p>
              <p className="text-xs text-gray-500">Hợp đồng sắp hết hạn</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">4.2</p>
              <p className="text-xs text-gray-500">Đánh giá TB</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowAddModal(true)}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Thêm nhà cung cấp</h3>
                <p className="text-sm text-gray-500">Tạo nhà cung cấp mới</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 lý hợp đồng</h3>">
                <p className="text-sm text-gray-500">Theo dõi hợp đồng cung cấp</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 hàng nhập</h3>">
                <p className="text-sm text-gray-500">Liên kết với module Kho</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Quản lý thanh toán</h3>
                <p className="text-sm text-gray-500">Theo dõi công nợ phải trả</p>
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
                  placeholder="Tìm kiếm nhà cung cấp, công ty, người liên hệ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10">
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
              >
                <option value="all">Tất cả danh mục</option>
                {Object.keys(supplierCategories).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
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

      {/* Suppliers List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSuppliers.map((supplier) => {
          const categoryColor = getCategoryColor(supplier.category)
          const isContractExpiring = () => {
            const expiryDate = new Date(supplier.contractExpiry)
            const today = new Date()
            const diffTime = expiryDate.getTime() - today.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            return diffDays <= 30 && diffDays > 0
          }
          
          return (
            <motion.div
              key={supplier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-${categoryColor}-100 rounded-lg flex items-center justify-center`}>
                        <Building2 className={`w-5 h-5 text-${categoryColor}-600`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{supplier.name}</CardTitle>
                        <CardDescription className="text-sm text-gray-500">
                          {supplier.category}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                        {supplier.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                      </Badge>
                      {isContractExpiring() && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Sắp hết hạn
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{supplier.contactPerson}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{supplier.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{supplier.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{supplier.address}</span>
                    </div>
                    {supplier.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{supplier.website}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{supplier.totalOrders}</p>
                      <p className="text-xs text-gray-500">Đơn hàng</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{supplier.discountRate}%</p>
                      <p className="text-xs text-gray-500">Chiết khấu</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {getRatingStars(supplier.rating)}
                    </div>
                    <span className="text-sm text-gray-500">{supplier.rating}/5</span>
                  </div>

                  {supplier.currentDebt > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-800">Công nợ phải trả</span>
                      </div>
                      <p className="text-lg font-bold text-red-600 mt-1">
                        {(supplier.currentDebt / 1000000).toFixed(1)}M VNĐ
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {supplier.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleViewSupplier(supplier)}>
                      <Eye className="w-4 h-4 mr-1" />
                      Xem
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEditSupplier(supplier)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Sửa
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteSupplier(supplier)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {filteredSuppliers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không tìm thấy nhà cung cấp nào
            </h3>
            <p className="text-gray-600 mb-4">
              Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm nhà cung cấp đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
