import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api/client'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'
import {
  Calendar,
  DollarSign,
  CreditCard,
  Banknote,
  Zap,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Download,
  Printer,
  RefreshCw,
  CheckCircle,
  Clock,
  Users,
  ShoppingCart,
  Package,
  AlertCircle,
  Info,
  FileText,
  Calculator,
  Target,
  Award,
  Activity
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Summary {
  sales_count: number
  total: number
  cash: number
  card: number
  transfer: number
  avg_order_value?: number
  peak_hour?: string
  top_product?: string
  customer_count?: number
}

interface DailyReport {
  date: string
  summary: Summary
  hourly_sales: Array<{ hour: number; amount: number; count: number }>
  payment_breakdown: Array<{ method: string; amount: number; percentage: number }>
  top_products: Array<{ name: string; quantity: number; revenue: number }>
}

export default function EndOfDay() {
  const { hasPermission } = useAuth() as any
  const [sum, setSum] = useState<Summary | null>(null)
  const [report, setReport] = useState<DailyReport | null>(null)
  const [closing, setClosing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showDetailedReport, setShowDetailedReport] = useState(false)

  useEffect(() => {
    loadDailyData()
  }, [])

  const loadDailyData = async () => {
    setLoading(true)
    try {
      const [summaryRes, reportRes] = await Promise.all([
        api.get('/reports/sales', { params: { range: 'today' } }),
        api.get('/reports/daily', { params: { date: new Date().toISOString().split('T')[0] } })
      ])

      setSum(summaryRes.data.summary || null)
      setReport(reportRes.data || null)
    } catch (error) {
      console.error('Failed to load daily data:', error)
      toast.error('Không thể tải dữ liệu báo cáo')
    } finally {
      setLoading(false)
    }
  }

  const closeDay = async () => {
    setClosing(true)
    try {
      await api.post('/pos/end-of-day')
      toast.success('Đã chốt ngày thành công')
      await loadDailyData() // Reload data after closing
    } catch (error) {
      console.error('Failed to close day:', error)
      toast.error('Lỗi khi chốt ngày')
    } finally {
      setClosing(false)
    }
  }

  const exportReport = () => {
    // Implementation for exporting report
    toast.success('Đang xuất báo cáo...')
  }

  const printReport = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50   flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <RefreshCw className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-900">Đang tải báo cáo...</h2>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Enhanced Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 px-6 py-6 sticky top-0 z-40"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Chốt ca/ngày
              </h1>
              <p className="text-gray-600">
                Báo cáo tổng kết ngày {new Date().toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={loadDailyData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Làm mới
            </Button>
            <Button variant="outline" onClick={exportReport}>
              <Download className="w-4 h-4 mr-2" />
              Xuất Excel
            </Button>
            <Button variant="outline" onClick={printReport}>
              <Printer className="w-4 h-4 mr-2" />
              In báo cáo
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="p-6 space-y-6">
        {/* Main Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
        >
          {sum ? (
            <>
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Số hóa đơn</p>
                      <p className="text-3xl font-bold">{sum.sales_count}</p>
                    </div>
                    <ShoppingCart className="w-8 h-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Tổng doanh thu</p>
                      <p className="text-2xl font-bold">{sum.total?.toLocaleString('vi-VN')} ₫</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100 text-sm font-medium">Tiền mặt</p>
                      <p className="text-2xl font-bold">{sum.cash?.toLocaleString('vi-VN')} ₫</p>
                    </div>
                    <Banknote className="w-8 h-8 text-yellow-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Thẻ</p>
                      <p className="text-2xl font-bold">{sum.card?.toLocaleString('vi-VN')} ₫</p>
                    </div>
                    <CreditCard className="w-8 h-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-indigo-100 text-sm font-medium">Chuyển khoản</p>
                      <p className="text-2xl font-bold">{sum.transfer?.toLocaleString('vi-VN')} ₫</p>
                    </div>
                    <Zap className="w-8 h-8 text-indigo-200" />
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="col-span-5 text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Không có dữ liệu báo cáo</p>
            </div>
          )}
        </motion.div>

        {/* Detailed Analytics */}
        {sum && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          >
            {/* Performance Metrics */}
            <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span>Chỉ số hiệu suất</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 trị đơn hàng TB:</span>">
                  <span className="font-semibold">
                    {sum.sales_count > 0 ? (sum.total / sum.sales_count).toLocaleString('vi-VN') : '0'} ₫
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 cao điểm:</span>">
                  <span className="font-semibold">{sum.peak_hour || '14:00-15:00'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 hàng:</span>">
                  <span className="font-semibold">{sum.customer_count || sum.sales_count}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods Chart */}
            <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="w-5 h-5 text-purple-600" />
                  <span>Phương thức thanh toán</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { method: 'Tiền mặt', amount: sum.cash, color: 'bg-yellow-500' },
                    { method: 'Thẻ', amount: sum.card, color: 'bg-purple-500' },
                    { method: 'Chuyển khoản', amount: sum.transfer, color: 'bg-indigo-500' }
                  ].map((item) => {
                    const percentage = sum.total > 0 ? (item.amount / sum.total) * 100 : 0
                    return (
                      <div key={item.method} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                          <span className="font-medium">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`${item.color} h-2 rounded-full transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  <span>Thao tác nhanh</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start" onClick={() => setShowDetailedReport(!showDetailedReport)}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  {showDetailedReport ? 'Ẩn' : 'Xem'} báo cáo chi tiết
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Báo cáo theo giờ
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Thống kê khách hàng
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Close Day Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="shadow-xl border-0 bg-gradient-to-r from-red-50 to-orange-50 ">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 ngày</h3>">
                    <p className="text-gray-600">
                      Hoàn tất báo cáo và khóa dữ liệu ngày hôm nay
                    </p>
                  </div>
                </div>

                <Button
                  onClick={closeDay}
                  disabled={closing || !sum || !hasPermission?.('pos.end_of_day')}
                  className="h-14 px-8 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold text-lg shadow-lg">
                >
                  {closing ? (
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Đang chốt...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5" />
                      <span>Chốt ngày</span>
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}


