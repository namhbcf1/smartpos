import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, Search, Filter, Download, Edit, Trash2, Eye, Truck, MapPin, Phone, Mail, Building2,
  TrendingUp, DollarSign, Package, History, AlertCircle, CheckCircle, XCircle, MoreVertical,
  Upload, Star, Tag, Calendar, Clock, Shield, Award, CreditCard, FileText, Users, Globe
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/badge'

interface Distributor {
  id: string
  name: string
  code: string
  region: string
  contactPerson: string
  phone: string
  email: string
  address: string
  status: 'active' | 'inactive'
  totalOrders: number
  totalRevenue: number
  discountRate: number
  createdAt: string
  // Thêm các trường mới theo yêu cầu
  level: 'level1' | 'level2' // Cấp 1/cấp 2
  territory: string // Khu vực phụ trách
  creditLimit: number // Hạn mức tín dụng
  currentDebt: number // Công nợ hiện tại
  paymentTerms: string // Điều khoản thanh toán
  contractExpiry: string // Ngày hết hạn hợp đồng
  notes: string // Ghi chú
  tags: string[] // Nhãn
  rating: number // Đánh giá
  products: string[] // Sản phẩm phân phối
  agents: number // Số đại lý trực thuộc
  monthlyTarget: number // Mục tiêu tháng
  monthlyActual: number // Thực tế tháng
}

const mockDistributors: Distributor[] = [
  {
    id: '1',
    name: 'NPP Miền Bắc',
    code: 'NPP-MB-001',
    region: 'Miền Bắc',
    contactPerson: 'Nguyễn Văn A',
    phone: '0123456789',
    email: 'npp.mb@example.com',
    address: 'Hà Nội, Việt Nam',
    status: 'active',
    totalOrders: 150,
    totalRevenue: 2500000000,
    discountRate: 15,
    createdAt: '2024-01-15',
    level: 'level1',
    territory: 'Hà Nội, Hải Phòng, Quảng Ninh',
    creditLimit: 500000000,
    currentDebt: 50000000,
    paymentTerms: '30 ngày',
    contractExpiry: '2024-12-31',
    notes: 'NPP cấp 1, phân phối chính cho khu vực miền Bắc',
    tags: ['Cấp 1', 'Miền Bắc', 'Chính thức'],
    rating: 4.5,
    products: ['Điện tử', 'Nội thất', 'Văn phòng phẩm'],
    agents: 25,
    monthlyTarget: 2000000000,
    monthlyActual: 1800000000
  },
  {
    id: '2',
    name: 'NPP Miền Trung',
    code: 'NPP-MT-002',
    region: 'Miền Trung',
    contactPerson: 'Trần Thị B',
    phone: '0987654321',
    email: 'npp.mt@example.com',
    address: 'Đà Nẵng, Việt Nam',
    status: 'active',
    totalOrders: 120,
    totalRevenue: 1800000000,
    discountRate: 12,
    createdAt: '2024-02-20',
    level: 'level1',
    territory: 'Đà Nẵng, Huế, Quảng Nam',
    creditLimit: 300000000,
    currentDebt: 0,
    paymentTerms: '15 ngày',
    contractExpiry: '2024-11-30',
    notes: 'NPP cấp 1, phát triển mạnh khu vực miền Trung',
    tags: ['Cấp 1', 'Miền Trung', 'Phát triển'],
    rating: 4.2,
    products: ['Điện tử', 'Nội thất'],
    agents: 18,
    monthlyTarget: 1500000000,
    monthlyActual: 1600000000
  },
  {
    id: '3',
    name: 'NPP Cấp 2 Hà Nội',
    code: 'NPP-HN-003',
    region: 'Miền Bắc',
    contactPerson: 'Lê Văn C',
    phone: '0369852147',
    email: 'npp.hn@example.com',
    address: 'Quận Cầu Giấy, Hà Nội',
    status: 'active',
    totalOrders: 80,
    totalRevenue: 800000000,
    discountRate: 8,
    createdAt: '2024-03-01',
    level: 'level2',
    territory: 'Quận Cầu Giấy, Quận Đống Đa',
    creditLimit: 100000000,
    currentDebt: 10000000,
    paymentTerms: '7 ngày',
    contractExpiry: '2024-10-15',
    notes: 'NPP cấp 2, chuyên phân phối sản phẩm điện tử',
    tags: ['Cấp 2', 'Hà Nội', 'Điện tử'],
    rating: 3.8,
    products: ['Điện tử'],
    agents: 8,
    monthlyTarget: 600000000,
    monthlyActual: 550000000
  }
]

export const Distributors: React.FC = () => {
  const [distributors] = useState<Distributor[]>(mockDistributors)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  const filteredDistributors = distributors.filter(distributor => {
    const matchesSearch = distributor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         distributor.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         distributor.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRegion = selectedRegion === 'all' || distributor.region === selectedRegion
    const matchesLevel = selectedLevel === 'all' || distributor.level === selectedLevel
    const matchesStatus = selectedStatus === 'all' || distributor.status === selectedStatus
    return matchesSearch && matchesRegion && matchesLevel && matchesStatus
  })

  const regions = ['all', 'Miền Bắc', 'Miền Trung', 'Miền Nam']
  const levels = {
    level1: { label: 'Cấp 1', color: 'blue' },
    level2: { label: 'Cấp 2', color: 'green' }
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Truck className="w-8 h-8 text-purple-600" />
            NPP (Nhà phân phối)
          </h1>
          <p className="text-gray-600 mt-2">
            Quản lý các nhà phân phối cấp 1/cấp 2, theo dõi đơn hàng và doanh số theo khu vực
          </p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Thêm NPP
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">NPP</p>
                <p className="text-2xl font-bold text-gray-900">{totalDistributors}</p>
              </div>
              <Truck className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hoạt động</p>
                <p className="text-2xl font-bold text-green-600">{distributors.filter(d => d.status === 'active').length}</p>
              </div>
              <Building2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đơn hàng</p>
                <p className="text-2xl font-bold text-blue-600">{distributors.reduce((sum, d) => sum + d.totalOrders, 0)}</p>
              </div>
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Doanh thu</p>
                <p className="text-2xl font-bold text-orange-600">
                  {(distributors.reduce((sum, d) => sum + d.totalRevenue, 0) / 1000000000).toFixed(1)}B
                </p>
              </div>
              <Phone className="w-8 h-8 text-orange-600" />
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
                  placeholder="Tìm kiếm NPP, mã, người liên hệ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {regions.map(region => (
                  <option key={region} value={region}>
                    {region === 'all' ? 'Tất cả khu vực' : region}
                  </option>
                ))}
              </select>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Tất cả cấp độ</option>
                {Object.entries(levels).map(([key, level]) => (
                  <option key={key} value={key}>{level.label}</option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Tạm dừng</option>
              </select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Bộ lọc
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Xuất Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distributors List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredDistributors.map((distributor) => (
          <motion.div
            key={distributor.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{distributor.name}</CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                      {distributor.code}
                    </CardDescription>
                  </div>
                  <Badge variant={distributor.status === 'active' ? 'default' : 'secondary'}>
                    {distributor.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{distributor.region}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span>{distributor.contactPerson}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{distributor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{distributor.email}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{distributor.totalOrders}</p>
                    <p className="text-xs text-gray-500">Đơn hàng</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{distributor.discountRate}%</p>
                    <p className="text-xs text-gray-500">Chiết khấu</p>
                  </div>
                </div>

                {/* Thông tin bổ sung */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Cấp độ:</span>
                    <Badge className={`bg-${levels[distributor.level].color}-100 text-${levels[distributor.level].color}-800`}>
                      {levels[distributor.level].label}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Đại lý:</span>
                    <span className="font-medium">{distributor.agents} đại lý</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Mục tiêu tháng:</span>
                    <span className="font-medium">{(distributor.monthlyActual / 1000000000).toFixed(1)}B/{(distributor.monthlyTarget / 1000000000).toFixed(1)}B</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Đánh giá:</span>
                    <div className="flex items-center gap-1">
                      {getRatingStars(distributor.rating)}
                      <span className="ml-1 text-xs">{distributor.rating}/5</span>
                    </div>
                  </div>
                </div>

                {/* Công nợ */}
                {distributor.currentDebt > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">Công nợ</span>
                    </div>
                    <p className="text-lg font-bold text-red-600 mt-1">
                      {(distributor.currentDebt / 1000000).toFixed(1)}M VNĐ
                    </p>
                  </div>
                )}

                {/* Sản phẩm phân phối */}
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-2">Sản phẩm phân phối:</p>
                  <div className="flex flex-wrap gap-1">
                    {distributor.products.map((product, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {product}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 pt-2">
                  {distributor.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="w-4 h-4 mr-1" />
                    Xem
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="w-4 h-4 mr-1" />
                    Sửa
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredDistributors.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không tìm thấy NPP nào
            </h3>
            <p className="text-gray-600 mb-4">
              Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Thêm NPP đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
