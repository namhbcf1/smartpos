import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import apiClient from '../../services/api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import { LoadingSpinner, PageLoading } from '../../components/ui/LoadingSpinner';
import { Modal } from '../../components/ui/Modal';
import { Alert } from '../../components/ui/Alert';
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Receipt,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  Plus,
  Edit,
  Trash2,
  FileText,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  Star,
  Heart,
  Share2,
  Copy,
  ExternalLink,
  Settings,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  AlertTriangle,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Sale {
  id: string;
  sale_number: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  user_id: string;
  user_name?: string;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  payment_method: 'cash' | 'card' | 'transfer';
  cash_received?: number;
  change_amount?: number;
  status: 'completed' | 'refunded' | 'partially_refunded' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: SaleItem[];
}

interface SaleItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  serial_numbers?: string[];
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

const SalesPage: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [dateRange, setDateRange] = useState<{from: string, to: string}>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSales, setSelectedSales] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortBy, setSortBy] = useState<'created_at' | 'total_amount' | 'sale_number'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showSaleDetail, setShowSaleDetail] = useState(false);

  // Stats state
  const [stats, setStats] = useState({
    total_sales: 0,
    total_revenue: 0,
    avg_order_value: 0,
    total_customers: 0,
    today_sales: 0,
    today_revenue: 0,
    growth_rate: 0,
    top_payment_method: 'cash' as const
  });

  const itemsPerPage = 20;

  const paymentMethods = [
    { value: 'cash', label: 'Tiền mặt', icon: Banknote },
    { value: 'card', label: 'Thẻ', icon: CreditCard },
    { value: 'transfer', label: 'Chuyển khoản', icon: Smartphone }
  ];

  const statusOptions = [
    { value: 'completed', label: 'Hoàn thành', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
    { value: 'refunded', label: 'Đã hoàn tiền', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: RotateCcw },
    { value: 'partially_refunded', label: 'Hoàn tiền 1 phần', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
    { value: 'cancelled', label: 'Đã hủy', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200', icon: XCircle }
  ];

  // Load initial data
  useEffect(() => {
    if (isOnline) {
      loadData();
    }
  }, [isOnline]);

  // Load sales when filters change
  useEffect(() => {
    if (isOnline) {
      loadSales();
    }
  }, [isOnline, searchTerm, selectedCustomer, selectedPaymentMethod, selectedStatus, dateRange, currentPage, sortBy, sortOrder]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load sales, customers, and stats in parallel
      const [salesRes, customersRes, statsRes] = await Promise.all([
        apiClient.get('/sales', {
          params: {
            page: currentPage,
            limit: itemsPerPage,
            search: searchTerm,
            customer_id: selectedCustomer,
            payment_method: selectedPaymentMethod,
            status: selectedStatus,
            start_date: dateRange.from,
            end_date: dateRange.to,
            sort_by: sortBy,
            sort_order: sortOrder
          }
        }),
        apiClient.get('/customers'),
        apiClient.get('/sales/stats', {
          params: {
            start_date: dateRange.from,
            end_date: dateRange.to
          }
        })
      ]);
      setSales(salesRes.data.data || []);
      setTotalPages(Math.ceil((salesRes.data.total || 0) / itemsPerPage));
      setCustomers(customersRes.data.data || []);
      setStats(statsRes.data || stats);
    } catch (err: any) {
      setError('Không thể tải dữ liệu bán hàng. Vui lòng kiểm tra kết nối internet.');
      console.error('Failed to load data:', err);
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const loadSales = async () => {
    try {
      setError(null);
      const response = await apiClient.get('/sales', {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm,
          customer_id: selectedCustomer,
          payment_method: selectedPaymentMethod,
          status: selectedStatus,
          start_date: dateRange.from,
          end_date: dateRange.to,
          sort_by: sortBy,
          sort_order: sortOrder
        }
      });

      setSales(response.data.data || []);
      setTotalPages(Math.ceil((response.data.total || 0) / itemsPerPage));
    } catch (err: any) {
      setError('Lỗi tải danh sách bán hàng');
      console.error('Failed to load sales:', err);
      toast.error('Lỗi tải dữ liệu bán hàng');
    }
  };

  // Enhanced handlers
  const handleSaleSelect = useCallback((saleId: string, selected: boolean) => {
    setSelectedSales(prev =>
      selected
        ? [...prev, saleId]
        : prev.filter(id => id !== saleId)
    );
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    setSelectedSales(selected ? sales.map(s => s.id) : []);
  }, [sales]);

  const handleViewSale = useCallback((sale: Sale) => {
    setSelectedSale(sale);
    setShowSaleDetail(true);
  }, []);

  const handleExport = async () => {
    try {
      const response = await apiClient.get('/sales/export', {
        responseType: 'blob',
        params: {
          search: searchTerm,
          customer_id: selectedCustomer,
          payment_method: selectedPaymentMethod,
          status: selectedStatus,
          start_date: dateRange.from,
          end_date: dateRange.to
        }
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales-${dateRange.from}-${dateRange.to}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Đã xuất danh sách bán hàng');
    } catch (error) {
      toast.error('Lỗi khi xuất dữ liệu');
    }
  };

  const handlePrintReceipt = async (sale: Sale) => {
    try {
      const response = await apiClient.get(`/sales/${sale.id}/receipt`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const printWindow = window.open(url);
      printWindow?.print();
      toast.success('Đã gửi lệnh in hóa đơn');
    } catch (error) {
      toast.error('Lỗi khi in hóa đơn');
    }
  };

  const loadSaleDetail = async (saleId: string) => {
    try {
      const response = await apiClient.get(`/sales/${saleId}`);
      setSelectedSale(response.data.data);
    } catch (err) {
      console.error('Failed to load sale detail:', err);
      setError('Lỗi tải chi tiết đơn hàng');
    }
  };

  const openSaleDetail = async (sale: Sale) => {
    await loadSaleDetail(sale.id);
    setShowDetailModal(true);
  };

  const handleRefund = async () => {
    if (!isOnline || !selectedSale) {
      setError('Cần kết nối internet để xử lý hoàn tiền');
      return;
    }

    if (refundAmount <= 0 || refundAmount > selectedSale.total_amount) {
      setError('Số tiền hoàn không hợp lệ');
      return;
    }

    if (!refundReason.trim()) {
      setError('Vui lòng nhập lý do hoàn tiền');
      return;
    }

    try {
      setError(null);
      const response = await apiClient.post(`/sales/${selectedSale.id}/refund`, {
        amount: refundAmount,
        reason: refundReason,
        refund_type: refundAmount === selectedSale.total_amount ? 'full' : 'partial'
      });

      if (response.data.success) {
        setShowRefundModal(false);
        setShowDetailModal(false);
        setRefundAmount(0);
        setRefundReason('');
        await loadSales();
        alert('Hoàn tiền thành công!');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Lỗi xử lý hoàn tiền');
      console.error('Failed to process refund:', err);
    }
  };

  const printReceipt = async (saleId: string) => {
    try {
      const response = await apiClient.get(`/sales/${saleId}/receipt`);
      
      // Open print dialog with receipt content
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(response.data.html);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (err) {
      setError('Lỗi in hóa đơn');
      console.error('Failed to print receipt:', err);
    }
  };

  const exportSales = async () => {
    try {
      const response = await apiClient.get('/sales/export', {
        params: {
          search: searchTerm,
          customer_id: selectedCustomer,
          payment_method: selectedPaymentMethod,
          status: selectedStatus,
          ...dateRange
        }
      });

      // Create and download CSV file
      const csvContent = response.data.csv;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales_${dateRange.start_date}_${dateRange.end_date}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Lỗi export dữ liệu bán hàng');
      console.error('Failed to export sales:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getStatusDisplay = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption || { value: status, label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const getPaymentMethodLabel = (method: string) => {
    const paymentMethod = paymentMethods.find(pm => pm.value === method);
    return paymentMethod?.label || method;
  };

  if (!isOnline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">🌐</div>
          <h1 className="text-2xl font-bold text-red-800 mb-2">Lịch sử bán hàng yêu cầu kết nối internet</h1>
          <p className="text-red-600">Vui lòng kiểm tra kết nối mạng để tiếp tục.</p>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return <PageLoading text="Đang tải lịch sử bán hàng..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
      {/* Enhanced Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lịch sử bán hàng</h1>
                <p className="text-gray-600 dark:text-gray-400">Quản lý và theo dõi các giao dịch bán hàng</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-wrap items-center gap-3"
            >
              <Button
                variant="outline"
                onClick={handleExport}
                icon={<Download className="w-4 h-4" />}
              >
                Xuất Excel
              </Button>

              <Button
                variant="outline"
                onClick={() => loadData()}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Làm mới
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Tổng đơn hàng</p>
                  <p className="text-3xl font-bold">{stats.total_sales.toLocaleString()}</p>
                  <p className="text-blue-200 text-xs mt-1">
                    Hôm nay: {stats.today_sales}
                  </p>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Tổng doanh thu</p>
                  <p className="text-3xl font-bold">{stats.total_revenue.toLocaleString()} ₫</p>
                  <p className="text-green-200 text-xs mt-1">
                    Hôm nay: {stats.today_revenue.toLocaleString()} ₫
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Giá trị TB/đơn</p>
                  <p className="text-3xl font-bold">{stats.avg_order_value.toLocaleString()} ₫</p>
                  <div className="flex items-center mt-1">
                    {stats.growth_rate >= 0 ? (
                      <ArrowUpRight className="w-3 h-3 text-purple-200 mr-1" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-purple-200 mr-1" />
                    )}
                    <span className="text-purple-200 text-xs">
                      {Math.abs(stats.growth_rate)}%
                    </span>
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Khách hàng</p>
                  <p className="text-3xl font-bold">{stats.total_customers.toLocaleString()}</p>
                  <p className="text-orange-200 text-xs mt-1">
                    Phương thức phổ biến: {paymentMethods.find(pm => pm.value === stats.top_payment_method)?.label}
                  </p>
                </div>
                <Users className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Filters & Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex flex-1 flex-col sm:flex-row gap-4 items-start sm:items-center">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Input
                      placeholder="Tìm kiếm theo mã đơn, khách hàng..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      leftIcon={<Search className="w-4 h-4" />}
                      clearable
                      onClear={() => setSearchTerm('')}
                    />
                  </div>

                  {/* Quick Filters */}
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Tất cả trạng thái</option>
                      {statusOptions.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={selectedPaymentMethod}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Tất cả PT thanh toán</option>
                      {paymentMethods.map(method => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Date Range */}
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                      className="w-auto"
                    />
                    <span className="text-gray-500">-</span>
                    <Input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                      className="w-auto"
                    />
                  </div>

                  {/* Advanced Filters */}
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    icon={<Filter className="w-4 h-4" />}
                  >
                    Bộ lọc
                  </Button>
                </div>
              </div>

              {/* Advanced Filters Panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Customer Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Khách hàng
                        </label>
                        <select
                          value={selectedCustomer}
                          onChange={(e) => setSelectedCustomer(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Tất cả khách hàng</option>
                          {customers.map(customer => (
                            <option key={customer.id} value={customer.id}>
                              {customer.name} - {customer.phone}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Sort Options */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Sắp xếp theo
                        </label>
                        <div className="flex space-x-2">
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="created_at">Ngày tạo</option>
                            <option value="total_amount">Tổng tiền</option>
                            <option value="sale_number">Mã đơn</option>
                          </select>
                          <Button
                            variant="outline"
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="px-3"
                          >
                            {sortOrder === 'asc' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>

                      {/* View Mode */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Chế độ xem
                        </label>
                        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                          <Button
                            variant={viewMode === 'table' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('table')}
                            className="flex-1"
                          >
                            Bảng
                          </Button>
                          <Button
                            variant={viewMode === 'cards' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('cards')}
                            className="flex-1"
                          >
                            Thẻ
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bulk Actions */}
        <AnimatePresence>
          {selectedSales.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-800 dark:text-blue-200 font-medium">
                      Đã chọn {selectedSales.length} đơn hàng
                    </span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSales([])}
                      >
                        Bỏ chọn
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        icon={<Download className="w-4 h-4" />}
                      >
                        Xuất đã chọn
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sales Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {error && (
            <Alert
              variant="destructive"
              title="Lỗi"
              description={error}
              closable
              onClose={() => setError(null)}
            />
          )}

          {viewMode === 'table' ? (
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <DataTable
                data={sales}
                columns={[
                  {
                    key: 'sale_number',
                    title: 'Mã đơn hàng',
                    sortable: true,
                    render: (value) => (
                      <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
                        {value}
                      </span>
                    )
                  },
                  {
                    key: 'customer_name',
                    title: 'Khách hàng',
                    render: (value, sale) => (
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {value || 'Khách lẻ'}
                        </p>
                        {sale.customer_phone && (
                          <p className="text-sm text-gray-500">{sale.customer_phone}</p>
                        )}
                      </div>
                    )
                  },
                  {
                    key: 'total_amount',
                    title: 'Tổng tiền',
                    type: 'currency',
                    sortable: true,
                    align: 'right',
                    render: (value) => (
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {value.toLocaleString('vi-VN')} ₫
                      </span>
                    )
                  },
                  {
                    key: 'payment_method',
                    title: 'Thanh toán',
                    align: 'center',
                    render: (value) => {
                      const method = paymentMethods.find(pm => pm.value === value);
                      const Icon = method?.icon || Banknote;
                      return (
                        <div className="flex items-center justify-center space-x-2">
                          <Icon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{method?.label}</span>
                        </div>
                      );
                    }
                  },
                  {
                    key: 'status',
                    title: 'Trạng thái',
                    align: 'center',
                    render: (value) => {
                      const status = statusOptions.find(s => s.value === value);
                      const Icon = status?.icon || CheckCircle;
                      return (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status?.color}`}>
                          <Icon className="w-3 h-3 mr-1" />
                          {status?.label}
                        </span>
                      );
                    }
                  },
                  {
                    key: 'created_at',
                    title: 'Ngày tạo',
                    type: 'date',
                    sortable: true,
                    render: (value) => (
                      <div className="text-sm">
                        <p className="text-gray-900 dark:text-white">
                          {new Date(value).toLocaleDateString('vi-VN')}
                        </p>
                        <p className="text-gray-500">
                          {new Date(value).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )
                  }
                ]}
                searchable
                pagination
                selectable
                onView={(sale) => handleViewSale(sale)}
                loading={loading}
                error={error}
                title="Danh sách đơn hàng"
                description={`${sales.length} đơn hàng`}
                actions={
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {/* Print selected */}}
                      icon={<Receipt className="w-4 h-4" />}
                    >
                      In hóa đơn
                    </Button>
                  </div>
                }
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {sales.map((sale, index) => {
                  const status = statusOptions.find(s => s.value === sale.status);
                  const paymentMethod = paymentMethods.find(pm => pm.value === sale.payment_method);
                  const StatusIcon = status?.icon || CheckCircle;
                  const PaymentIcon = paymentMethod?.icon || Banknote;

                  return (
                    <motion.div
                      key={sale.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="group hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600">
                        <CardContent className="p-6">
                          {/* Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                                {sale.sale_number}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {new Date(sale.created_at).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status?.color}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status?.label}
                            </span>
                          </div>

                          {/* Customer Info */}
                          <div className="mb-4">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {sale.customer_name || 'Khách lẻ'}
                            </p>
                            {sale.customer_phone && (
                              <p className="text-sm text-gray-500">{sale.customer_phone}</p>
                            )}
                          </div>

                          {/* Amount */}
                          <div className="mb-4">
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {sale.total_amount.toLocaleString('vi-VN')} ₫
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <PaymentIcon className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-500">{paymentMethod?.label}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewSale(sale)}
                              className="flex-1"
                              icon={<Eye className="w-4 h-4" />}
                            >
                              Xem
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePrintReceipt(sale)}
                              icon={<Receipt className="w-4 h-4" />}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {/* More actions */}}
                              icon={<MoreVertical className="w-4 h-4" />}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SalesPage;

