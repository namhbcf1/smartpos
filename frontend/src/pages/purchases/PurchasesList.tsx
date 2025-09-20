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
  DollarSign
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

export default function PurchasesList() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth() as any
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<PurchaseOrder[]>([])
  const [stats, setStats] = useState<PurchaseStats | null>(null)
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

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Đơn nhập hàng</h1>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/purchases/new')}>+ Tạo PO</button>
      </div>

      <div className="bg-base-100 rounded-lg shadow p-4">
        {loading ? (
          <div className="py-10 text-center opacity-70">Đang tải...</div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center opacity-70">Chưa có đơn nhập hàng</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Nhà cung cấp</th>
                  <th>Ngày đặt</th>
                  <th>Giao dự kiến</th>
                  <th>Trạng thái</th>
                  <th className="text-right">Tổng</th>
                </tr>
              </thead>
              <tbody>
                {items.map((po) => (
                  <tr key={po.id} className="hover">
                    <td>
                      <Link to={`/purchases/${po.id}`} className="link">
                        #{po.id}
                      </Link>
                    </td>
                    <td>{po.supplier_name || '-'}</td>
                    <td>{po.order_date || '-'}</td>
                    <td>{po.expected_delivery_date || '-'}</td>
                    <td>
                      <span className="badge badge-outline">
                        {po.status || 'draft'}
                      </span>
                    </td>
                    <td className="text-right">{(po.total_amount || 0).toLocaleString('vi-VN')} ₫</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}




