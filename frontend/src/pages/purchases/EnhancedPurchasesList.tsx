import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatCurrency } from '../../lib/utils'
import { useAuth } from '../../hooks/useAuth'
import apiClient from '../../services/api/client'
import toast from 'react-hot-toast'
import { 
  Plus, 
  Search, 
  Filter, 
  RefreshCw,
  MoreVertical,
  Eye,
  Edit,
  CheckCircle,
  Truck,
  XCircle,
  Package,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  BarChart3
} from 'lucide-react'

interface PurchaseOrder {
  id: string
  order_number?: string
  supplier_name?: string
  order_date?: string
  expected_delivery_date?: string
  actual_delivery_date?: string
  status?: string
  total_amount?: number
  subtotal?: number
  tax_amount?: number
  supplier_phone?: string
  supplier_email?: string
  notes?: string
}

interface PurchaseStats {
  total_orders: number
  pending_orders: number
  approved_orders: number
  received_orders: number
  cancelled_orders: number
  total_value: number
  avg_order_value: number
}

export default function EnhancedPurchasesList() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth() as any
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<PurchaseOrder[]>([])
  const [stats, setStats] = useState<PurchaseStats | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    supplier_id: '',
    date_from: '',
    date_to: '',
    search: ''
  })

  useEffect(() => {
    loadData()
    loadStats()
  }, [])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (filters.search || filters.status || filters.date_from || filters.date_to) {
        loadData()
      }
    }, 300)
    
    return () => clearTimeout(debounceTimer)
  }, [filters])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.supplier_id) params.append('supplier_id', filters.supplier_id)
      if (filters.date_from) params.append('date_from', filters.date_from)
      if (filters.date_to) params.append('date_to', filters.date_to)
      
      const response = await apiClient.get(`/purchase-orders?${params.toString()}`)
      setItems(response.data?.data || [])
    } catch (error) {
      console.error('Failed to load purchase orders:', error)
      toast.error('Không thể tải danh sách đơn hàng')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await apiClient.get('/purchase-orders/stats')
      setStats(response.data?.data || null)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const getStatusBadge = (status?: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Chờ duyệt' },
      approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Đã duyệt' },
      received: { color: 'bg-green-100 text-green-800', icon: Package, label: 'Đã nhận' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Đã hủy' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const IconComponent = config.icon
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    )
  }

  const handleQuickAction = async (id: string, action: string) => {
    try {
      await apiClient.put(`/purchase-orders/${id}/${action}`)
      toast.success(`Đã ${action === 'approve' ? 'duyệt' : action === 'cancel' ? 'hủy' : 'cập nhật'} đơn hàng`)
      loadData()
      loadStats()
    } catch (error) {
      toast.error(`Không thể ${action === 'approve' ? 'duyệt' : 'cập nhật'} đơn hàng`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Đơn nhập hàng</h1>
              <p className="text-gray-600 mt-1">Quản lý đơn hàng từ nhà cung cấp</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              >
                <Filter className="w-4 h-4 mr-2" />
                Lọc
              </button>
              <button
                onClick={loadData}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Làm mới
              </button>
              {hasPermission?.('purchases.create') && (
                <button
                  onClick={() => navigate('/purchases/create')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo đơn hàng
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tổng đơn hàng</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_orders}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Chờ duyệt</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending_orders}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Đã nhận</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.received_orders}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tổng giá trị</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.total_value)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tìm kiếm
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm mã đơn, nhà cung cấp..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                >
                  <option value="">Tất cả</option>
                  <option value="pending">Chờ duyệt</option>
                  <option value="approved">Đã duyệt</option>
                  <option value="received">Đã nhận</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                />
              </div>
            </div>
          </div>
        )}

        {/* Purchase Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đơn hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nhà cung cấp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày đặt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giao hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex justify-center items-center">
                        <RefreshCw className="w-5 h-5 animate-spin text-gray-400 mr-2" />
                        <span className="text-gray-500">Đang tải...</span>
                      </div>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">Chưa có đơn hàng</p>
                        <p className="text-sm">Tạo đơn hàng đầu tiên để bắt đầu</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <Link 
                            to={`/purchases/${order.id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800">
                          >
                            {order.order_number || `#${order.id.slice(0, 8)}`}
                          </Link>
                          {order.notes && (
                            <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                              {order.notes}
                            </p>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {order.supplier_name || 'N/A'}
                          </p>
                          {order.supplier_phone && (
                            <p className="text-xs text-gray-500">{order.supplier_phone}</p>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.order_date ? 
                          new Date(order.order_date).toLocaleDateString('vi-VN') : 
                          '-'
                        }
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.expected_delivery_date ? 
                          new Date(order.expected_delivery_date).toLocaleDateString('vi-VN') : 
                          '-'
                        }
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {formatCurrency(order.total_amount || 0)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/purchases/${order.id}`}
                            className="text-blue-600 hover:text-blue-800"
                  title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          
                          {order.status === 'pending' && hasPermission?.('purchases.approve') && (
                            <button
                              onClick={() => handleQuickAction(order.id, 'approve')}
                              className="text-green-600 hover:text-green-800"
                  title="Duyệt đơn"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          
                          {order.status === 'approved' && hasPermission?.('purchases.receive') && (
                            <Link
                              to={`/purchases/${order.id}/receive`}
                              className="text-purple-600 hover:text-purple-800"
                  title="Nhận hàng"
                            >
                              <Truck className="w-4 h-4" />
                            </Link>
                          )}
                          
                          {(order.status === 'pending' || order.status === 'approved') && hasPermission?.('purchases.cancel') && (
                            <button
                              onClick={() => handleQuickAction(order.id, 'cancel')}
                              className="text-red-600 hover:text-red-800"
                  title="Hủy đơn"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
