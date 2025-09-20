import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api/client'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { formatCurrency } from '../../lib/utils'
import {
  Clock,
  Play,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  DollarSign,
  ShoppingCart,
  User,
  Package,
  Eye,
  Edit,
  MoreVertical,
  AlertCircle,
  CheckCircle,
  Pause,
  Archive,
  Download,
  FileText,
  Timer,
  TrendingUp,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'

interface HeldSale {
  id: string
  created_at: number
  total: number
  customer_name?: string
  customer_phone?: string
  items_count?: number
  payment_method?: string
  notes?: string
  held_by?: string
  held_reason?: string
}

interface HeldSaleDetail {
  id: string
  created_at: number
  total: number
  subtotal: number
  tax_amount: number
  customer: {
    name?: string
    phone?: string
    email?: string
  }
  items: Array<{
    id: string
    name: string
    sku: string
    quantity: number
    unit_price: number
    total_price: number
  }>
  payment_method: string
  notes?: string
  held_by: string
  held_reason: string
}

export default function HeldSales() {
  const [items, setItems] = useState<HeldSale[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSale, setSelectedSale] = useState<HeldSaleDetail | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadHeldSales()
  }, [])

  const loadHeldSales = async () => {
    setLoading(true)
    try {
      const res = await api.get('/sales', {
        params: { status: 'held', limit: 50, include_customer: true, include_items_count: true }
      })
      const responseData = res.data?.data || res.data || []
      setItems(Array.isArray(responseData) ? responseData : [])
    } catch (error) {
      console.error('Failed to load held sales:', error)
      toast.error('Không thể tải danh sách hóa đơn tạm giữ')
    } finally {
      setLoading(false)
    }
  }

  const loadSaleDetail = async (id: string) => {
    try {
      const res = await api.get(`/sales/${id}`)
      setSelectedSale(res.data)
      setShowDetail(true)
    } catch (error) {
      console.error('Failed to load sale detail:', error)
      toast.error('Không thể tải chi tiết hóa đơn')
    }
  }

  const resumeSale = async (id: string) => {
    setActionLoading(id)
    try {
      await api.post(`/sales/${id}/hold`, { action: 'resume' })
      toast.success('Đã tiếp tục hóa đơn')
      await loadHeldSales()
    } catch (error) {
      console.error('Failed to resume sale:', error)
      toast.error('Không thể tiếp tục hóa đơn')
    } finally {
      setActionLoading(null)
    }
  }

  const deleteSale = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa hóa đơn này?')) return

    setActionLoading(id)
    try {
      await api.delete(`/sales/${id}`)
      toast.success('Đã xóa hóa đơn')
      await loadHeldSales()
    } catch (error) {
      console.error('Failed to delete sale:', error)
      toast.error('Không thể xóa hóa đơn')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredItems = Array.isArray(items) ? items.filter(item =>
    item.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.customer_phone?.includes(searchQuery)
  ) : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 ">
      {/* Enhanced Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80  backdrop-blur-lg shadow-lg border-b border-gray-200/50 px-6 py-6 sticky top-0 z-40">
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Pause className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                Hóa đơn tạm giữ
              </h1>
              <p className="text-gray-600">
                Quản lý các hóa đơn đang tạm giữ
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={loadHeldSales} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Xuất danh sách
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="p-6">
        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6">
        >
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm theo mã hóa đơn, tên khách hàng hoặc số điện thoại..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300  rounded-xl bg-white  text-gray-900  placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  />
                </div>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Lọc
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        >
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Tổng hóa đơn</p>
                  <p className="text-3xl font-bold">{filteredItems.length}</p>
                </div>
                <Archive className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Tổng giá trị</p>
                  <p className="text-2xl font-bold">
                    {filteredItems.reduce((sum, item) => sum + item.total, 0).toLocaleString('vi-VN')} ₫
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Giá trị TB</p>
                  <p className="text-2xl font-bold">
                    {filteredItems.length > 0
                      ? (filteredItems.reduce((sum, item) => sum + item.total, 0) / filteredItems.length).toLocaleString('vi-VN')
                      : '0'
                    } ₫
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Hôm nay</p>
                  <p className="text-3xl font-bold">
                    {filteredItems.filter(item => {
                      const itemDate = new Date(item.created_at * 1000).toDateString()
                      const today = new Date().toDateString()
                      return itemDate === today
                    }).length}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Held Sales List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Danh sách hóa đơn tạm giữ</span>
                <span className="px-2 py-1 bg-blue-100  text-blue-700 text-sm rounded-full">
                  {filteredItems.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
                  <p className="text-gray-500 tải danh sách...</p>">
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <Archive className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuery ? 'Không tìm thấy hóa đơn' : 'Chưa có hóa đơn tạm giữ'}
                  </h3>
                  <p className="text-gray-500">
                    {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Các hóa đơn tạm giữ sẽ hiển thị ở đây'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {filteredItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="border-0 bg-gray-50 hover:shadow-lg transition-all duration-200">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-4 mb-3">
                                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-white" />
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                      #{item.id}
                                    </h3>
                                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                                      <div className="flex items-center space-x-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{new Date(item.created_at * 1000).toLocaleString('vi-VN')}</span>
                                      </div>
                                      {item.customer_name && (
                                        <div className="flex items-center space-x-1">
                                          <User className="w-4 h-4" />
                                          <span>{item.customer_name}</span>
                                        </div>
                                      )}
                                      {item.items_count && (
                                        <div className="flex items-center space-x-1">
                                          <Package className="w-4 h-4" />
                                          <span>{item.items_count} sản phẩm</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {item.notes && (
                                  <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-700">
                                      <strong>Ghi chú:</strong> {item.notes}
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center space-x-4">
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-green-600">
                                    {item.total?.toLocaleString('vi-VN')} ₫
                                  </div>
                                  {item.payment_method && (
                                    <div className="text-sm text-gray-500">
                                      {item.payment_method}
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col space-y-2">
                                  <Button
                                    size="sm"
                                    onClick={() => loadSaleDetail(item.id)}
                                    variant="outline"
                                    className="w-24">
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Xem
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => resumeSale(item.id)}
                                    disabled={actionLoading === item.id}
                                    className="w-24 bg-green-600 hover:bg-green-700 text-white">
                                  >
                                    {actionLoading === item.id ? (
                                      <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Play className="w-4 h-4 mr-1" />
                                        Tiếp tục
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => deleteSale(item.id)}
                                    disabled={actionLoading === item.id}
                                    variant="outline"
                                    className="w-24 text-red-600 hover:text-red-700 hover:bg-red-50">
                                  >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Xóa
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Sale Detail Modal */}
      <AnimatePresence>
        {showDetail && selectedSale && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 ">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Chi tiết hóa đơn #{selectedSale.id}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Tạm giữ lúc {new Date(selectedSale.created_at * 1000).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetail(false)}
                    className="text-gray-500 hover:text-gray-700 ">
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-auto max-h-[60vh]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Customer Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <User className="w-5 h-5" />
                        <span>Thông tin khách hàng</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-500">Tên:</span>
                          <span className="ml-2 font-medium">{selectedSale.customer?.name || 'Khách lẻ'}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Điện thoại:</span>
                          <span className="ml-2 font-medium">{selectedSale.customer?.phone || 'Không có'}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Email:</span>
                          <span className="ml-2 font-medium">{selectedSale.customer?.email || 'Không có'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <DollarSign className="w-5 h-5" />
                        <span>Tóm tắt thanh toán</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Tạm tính:</span>
                          <span className="font-medium">{selectedSale.subtotal?.toLocaleString('vi-VN')} ₫</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Thuế:</span>
                          <span className="font-medium">{selectedSale.tax_amount?.toLocaleString('vi-VN')} ₫</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-semibold">Tổng cộng:</span>
                          <span className="font-bold text-green-600">{selectedSale.total?.toLocaleString('vi-VN')} ₫</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Phương thức:</span>
                          <span className="font-medium">{selectedSale.payment_method}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Items List */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Package className="w-5 h-5" />
                      <span>Danh sách sản phẩm</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Array.isArray(selectedSale.items) && selectedSale.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{item.total_price?.toLocaleString('vi-VN')} ₫</div>
                            <div className="text-sm text-gray-500">
                              {item.unit_price?.toLocaleString('vi-VN')} ₫ × {item.quantity}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                {selectedSale.notes && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="w-5 h-5" />
                        <span>Ghi chú</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setShowDetail(false)}>
                    Đóng
                  </Button>
                  <Button
                    onClick={() => {
                      resumeSale(selectedSale.id)
                      setShowDetail(false)
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white">
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Tiếp tục hóa đơn
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


