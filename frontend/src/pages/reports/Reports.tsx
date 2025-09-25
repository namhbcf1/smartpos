import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, TrendingUp, DollarSign, Package, Users, ShoppingCart, 
  Calendar, Download, Eye, FileText, Activity,
  ArrowUpRight, ArrowDownRight, RefreshCw, Trash2
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/badge'

interface ReportData {
  id: string
  title: string
  description: string
  type: 'sales' | 'inventory' | 'customer' | 'financial' | 'operational'
  category: string
  lastUpdated: string
  status: 'ready' | 'generating' | 'error'
  size: string
  format: 'pdf' | 'excel' | 'csv'
}

const mockReports: ReportData[] = [
  {
    id: '1',
    title: 'Báo cáo doanh thu hàng ngày',
    description: 'Tổng hợp doanh thu, số lượng đơn hàng và sản phẩm bán chạy trong ngày',
    type: 'sales',
    category: 'Doanh thu',
    lastUpdated: '2024-01-22 14:30',
    status: 'ready',
    size: '2.3 MB',
    format: 'pdf'
  },
  {
    id: '2',
    title: 'Báo cáo tồn kho chi tiết',
    description: 'Tình trạng tồn kho theo từng sản phẩm, cảnh báo hết hàng và đề xuất nhập kho',
    type: 'inventory',
    category: 'Kho hàng',
    lastUpdated: '2024-01-22 12:15',
    status: 'ready',
    size: '1.8 MB',
    format: 'excel'
  },
  {
    id: '3',
    title: 'Phân tích khách hàng VIP',
    description: 'Danh sách khách hàng VIP, lịch sử mua hàng và xu hướng tiêu dùng',
    type: 'customer',
    category: 'Khách hàng',
    lastUpdated: '2024-01-22 10:45',
    status: 'ready',
    size: '3.1 MB',
    format: 'pdf'
  },
  {
    id: '4',
    title: 'Báo cáo tài chính tháng',
    description: 'Báo cáo tài chính tổng hợp: doanh thu, chi phí, lợi nhuận và dòng tiền',
    type: 'financial',
    category: 'Tài chính',
    lastUpdated: '2024-01-21 18:20',
    status: 'ready',
    size: '4.2 MB',
    format: 'pdf'
  },
  {
    id: '5',
    title: 'Báo cáo hiệu suất nhân viên',
    description: 'Đánh giá hiệu suất bán hàng của từng nhân viên và xếp hạng',
    type: 'operational',
    category: 'Vận hành',
    lastUpdated: '2024-01-21 16:30',
    status: 'generating',
    size: '1.5 MB',
    format: 'excel'
  }
]

const reportTypes = {
  sales: { label: 'Báo cáo bán hàng', icon: ShoppingCart, color: 'green' },
  inventory: { label: 'Báo cáo kho hàng', icon: Package, color: 'blue' },
  customer: { label: 'Báo cáo khách hàng', icon: Users, color: 'purple' },
  financial: { label: 'Báo cáo tài chính', icon: DollarSign, color: 'yellow' },
  operational: { label: 'Báo cáo vận hành', icon: Activity, color: 'orange' }
}

const quickStats = [
  { label: 'Tổng doanh thu hôm nay', value: '15,250,000', change: '+12.5%', trend: 'up', icon: DollarSign },
  { label: 'Đơn hàng hôm nay', value: '127', change: '+8.2%', trend: 'up', icon: ShoppingCart },
  { label: 'Sản phẩm bán chạy', value: 'iPhone 15', change: '+25.3%', trend: 'up', icon: TrendingUp },
  { label: 'Khách hàng mới', value: '23', change: '-3.1%', trend: 'down', icon: Users }
]

export const Reports: React.FC = () => {
  const [reports] = useState<ReportData[]>(mockReports)
  const [selectedType, setSelectedType] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const filteredReports = reports.filter(report => {
    const matchesType = selectedType === 'all' || report.type === selectedType
    const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory
    return matchesType && matchesCategory
  })

  const categories = ['all', 'Doanh thu', 'Kho hàng', 'Khách hàng', 'Tài chính', 'Vận hành']

  const getStatusColor = (status: string) => {
    const colors = {
      ready: 'bg-green-100 text-green-800',
      generating: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || colors.ready
  }

  const getStatusText = (status: string) => {
    const texts = {
      ready: 'Sẵn sàng',
      generating: 'Đang tạo',
      error: 'Lỗi'
    }
    return texts[status as keyof typeof texts] || texts.ready
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
            Báo cáo & Thống kê
          </h1>
          <p className="text-gray-600 mt-2">
            Tạo và quản lý các báo cáo chi tiết về doanh thu, kho hàng, khách hàng và vận hành
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
          <Button>
            <FileText className="w-4 h-4 mr-2" />
            Tạo báo cáo mới
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => {
          const IconComponent = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change}
                    </span>
                  </div>
                  </div>
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
              </div>
              
      {/* Report Types Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Object.entries(reportTypes).map(([key, type]) => {
          const IconComponent = type.icon
          const count = reports.filter(r => r.type === key).length
          return (
            <Card 
              key={key} 
              className={`cursor-pointer transition-all hover:shadow-lg ${selectedType === key ? 'ring-2 ring-indigo-500' : ''}`}
              onClick={() => setSelectedType(selectedType === key ? 'all' : key)}
            >
              <CardContent className="p-4 text-center">
                <div className={`w-12 h-12 bg-${type.color}-100 rounded-lg flex items-center justify-center mx-auto mb-3`}>
                  <IconComponent className={`w-6 h-6 text-${type.color}-600`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{type.label}</h3>
                <p className="text-2xl font-bold text-gray-600">{count}</p>
                <p className="text-xs text-gray-500">báo cáo</p>
              </CardContent>
            </Card>
          )
        })}
              </div>
              
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Tất cả loại báo cáo</option>
                {Object.entries(reportTypes).map(([key, type]) => (
                  <option key={key} value={key}>{type.label}</option>
                ))}
              </select>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'Tất cả danh mục' : category}
                  </option>
                ))}
              </select>
                </div>
            <div className="flex gap-2">
              <Button 
                variant={viewMode === 'grid' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <FileText className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => {
            const typeInfo = reportTypes[report.type as keyof typeof reportTypes]
            const IconComponent = typeInfo.icon
            
            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-${typeInfo.color}-100 rounded-lg flex items-center justify-center`}>
                          <IconComponent className={`w-5 h-5 text-${typeInfo.color}-600`} />
                </div>
                        <div>
                          <CardTitle className="text-lg">{report.title}</CardTitle>
                          <CardDescription className="text-sm text-gray-500">
                            {report.category}
                          </CardDescription>
                </div>
              </div>
                      <Badge className={getStatusColor(report.status)}>
                        {getStatusText(report.status)}
                      </Badge>
            </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">
                      {report.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Cập nhật: {report.lastUpdated}</span>
                      <span>{report.size}</span>
                </div>
                
                    <div className="flex gap-2 pt-4">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="w-4 h-4 mr-1" />
                        Xem
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="w-4 h-4 mr-1" />
                        Tải
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Báo cáo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cập nhật
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kích thước
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReports.map((report) => {
                    const typeInfo = reportTypes[report.type as keyof typeof reportTypes]
                    const IconComponent = typeInfo.icon
                    
                    return (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-8 h-8 bg-${typeInfo.color}-100 rounded-lg flex items-center justify-center mr-3`}>
                              <IconComponent className={`w-4 h-4 text-${typeInfo.color}-600`} />
                            </div>
            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {report.title}
                </div>
                              <div className="text-sm text-gray-500">
                                {report.description}
                </div>
              </div>
            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline">{report.category}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStatusColor(report.status)}>
                            {getStatusText(report.status)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {report.lastUpdated}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {report.size}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4" />
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
      )}

      {filteredReports.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không tìm thấy báo cáo nào
            </h3>
            <p className="text-gray-600 mb-4">
              Thử thay đổi bộ lọc hoặc tạo báo cáo mới
            </p>
            <Button>
              <FileText className="w-4 h-4 mr-2" />
              Tạo báo cáo đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
