import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Plus,
  Search,
  Eye,
  Printer,
  Undo as Refund,
  Calendar,
  CreditCard,
  Banknote,
  QrCode,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw,
  Phone,
  Mail,
  MapPin,
  MoreVertical
} from 'lucide-react';
import {
  Card,
  PageHeader,
  Grid,
  Section,
  EmptyState,
  LoadingSpinner,
  StatsCard
} from '../../components/ui/DesignSystem';
import { Button } from '../../components/ui/ButtonSimplified';
import { formatCurrency } from '../../lib/utils';
import { useSnackbar } from 'notistack';
import { usePaginatedQuery } from '../../hooks/useApiData';
import { useDebounce } from '../../hooks/useDebounce';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Types
interface Sale {
  id: string;
  order_number: string;
  customer_name?: string;
  customer_phone?: string;
  customer_id?: string;
  total_cents: number;
  subtotal_cents: number;
  tax_cents: number;
  discount_cents: number;
  status: 'completed' | 'pending' | 'cancelled' | 'refunded';
  created_at: string;
  updated_at: string;
  user_id?: string;
  notes?: string;
  payments?: Array<{
    payment_method_id: string;
    amount_cents: number;
  }>;
}

interface SalesFilters {
  search: string;
  date_range: {
    start?: string;
    end?: string;
  };
  payment_status: string;
  payment_method: string;
  status: string;
  amount_range: {
    min: number;
    max: number;
  };
  cashier_id?: string;
  store_id?: string;
}

interface SalesSummary {
  today: {
    sales_count: number;
    total_amount: number;
    average_sale: number;
  };
  yesterday: {
    sales_count: number;
    total_amount: number;
    average_sale: number;
  };
  this_week: {
    sales_count: number;
    total_amount: number;
    average_sale: number;
  };
  this_month: {
    sales_count: number;
    total_amount: number;
    average_sale: number;
  };
  growth_rates: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

interface Cashier {
  id: string;
  name: string;
  email: string;
}

interface Store {
  id: string;
  name: string;
  address: string;
}

const ModernSalesHistory: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // State Management
  const [filters, setFilters] = useState<SalesFilters>({
    search: '',
    date_range: {},
    payment_status: 'all',
    payment_method: 'all',
    status: 'all',
    amount_range: { min: 0, max: 999999999 }
  });

  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Refund form states
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState<string>('');
  const [refundMethod, setRefundMethod] = useState<'cash' | 'card' | 'store_credit'>('cash');

  const debouncedSearchTerm = useDebounce(filters.search, 500);

  // Default summary structure
  const defaultSummary: SalesSummary = {
    today: { sales_count: 0, total_amount: 0, average_sale: 0 },
    yesterday: { sales_count: 0, total_amount: 0, average_sale: 0 },
    this_week: { sales_count: 0, total_amount: 0, average_sale: 0 },
    this_month: { sales_count: 0, total_amount: 0, average_sale: 0 },
    growth_rates: { daily: 0, weekly: 0, monthly: 0 }
  };

  // Fetch sales with pagination and filters
  const {
    data: sales,
    isLoading: salesLoading,
    error: salesError,
    refetch: refetchSales,
    pagination
  } = usePaginatedQuery<Sale>('/sales', {
    page: page + 1,
    limit: rowsPerPage,
    search: debouncedSearchTerm,
    payment_status: filters.payment_status !== 'all' ? filters.payment_status : undefined,
    payment_method: filters.payment_method !== 'all' ? filters.payment_method : undefined,
    sale_status: filters.status !== 'all' ? filters.status : undefined,
    user_id: filters.cashier_id,
    store_id: filters.store_id,
    date_from: filters.date_range.start,
    date_to: filters.date_range.end,
    min_amount: filters.amount_range.min > 0 ? filters.amount_range.min : undefined,
    max_amount: filters.amount_range.max < 999999999 ? filters.amount_range.max : undefined,
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  // Initialize component
  useEffect(() => {
    fetchSummary();
    fetchCashiers();
    fetchStores();
  }, []);

  const fetchSummary = async () => {
    try {
      const summaryData = await api.get<SalesSummary>('/sales/summary');
      setSummary(summaryData as SalesSummary);
    } catch (err) {
      // Summary fetch error - silently fail
    }
  };

  const fetchCashiers = async () => {
    try {
      const cashiersData = await api.get<Cashier[]>('/users?role=cashier');
      setCashiers(cashiersData as Cashier[]);
    } catch (err) {
      // Cashiers fetch error - silently fail
    }
  };

  const fetchStores = async () => {
    try {
      const storesData = await api.get<Store[]>('/stores');
      setStores(storesData as Store[]);
    } catch (err) {
      // Stores fetch error - silently fail
    }
  };

  // Event Handlers
  const handleNewSale = () => {
    navigate('/pos');
  };

  const handleViewDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setShowDetailsModal(true);
  };

  const handlePrintReceipt = async (sale: Sale) => {
    try {
      setLoading(true);
      await api.post(`/sales/${sale.id}/print-receipt`);
      toast.success('Đã gửi lệnh in hóa đơn');
    } catch (err) {
      toast.error('Lỗi khi in hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = (sale: Sale) => {
    setSelectedSale(sale);
    setRefundAmount(sale.total_cents / 100);
    setRefundReason('');
    setRefundMethod('cash');
    setShowRefundModal(true);
  };

  const handleRefundSubmit = async () => {
    if (!selectedSale || !refundReason.trim()) {
      toast.error('Vui lòng nhập lý do hoàn tiền');
      return;
    }

    try {
      setLoading(true);
      const refundData = {
        sale_id: selectedSale.id,
        refund_amount: refundAmount,
        refund_method: refundMethod,
        reason: refundReason,
        notes: `Hoàn tiền đơn hàng #${selectedSale.order_number}`
      };

      await api.post(`/sales/${selectedSale.id}/refund`, refundData);
      toast.success('Hoàn tiền thành công');
      setShowRefundModal(false);
      refetchSales();
    } catch (err) {
      toast.error('Lỗi khi hoàn tiền');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!Array.isArray(sales) || sales.length === 0) {
      toast.error('Không có dữ liệu để xuất');
      return;
    }

    try {
      const header = 'order_number,customer_name,total_amount,status,payment_method,created_at\n';
      const rows = sales.map(sale => [
        sale?.order_number || '',
        sale?.customer_name || 'Khách lẻ',
        (sale?.total_cents || 0) / 100,
        sale?.status || '',
        sale?.payments?.[0]?.payment_method_id || '',
        sale?.created_at ? new Date(sale.created_at).toLocaleDateString('vi-VN') : ''
      ].join(','));

      const csv = header + rows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Đã xuất file CSV thành công');
    } catch (error) {
      toast.error('Lỗi khi xuất file CSV');
      console.error('Export error:', error);
    }
  };

  const handleRefresh = () => {
    refetchSales();
    fetchSummary();
    fetchCashiers();
    fetchStores();
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      date_range: {},
      payment_status: 'all',
      payment_method: 'all',
      status: 'all',
      amount_range: { min: 0, max: 999999999 }
    });
    setPage(0);
  };

  // Helper Functions
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> };
      case 'pending':
        return { label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-4 h-4" /> };
      case 'cancelled':
        return { label: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" /> };
      case 'refunded':
        return { label: 'Đã hoàn tiền', color: 'bg-blue-100 text-blue-800', icon: <RotateCcw className="w-4 h-4" /> };
      default:
        return { label: 'Không xác định', color: 'bg-gray-100 text-gray-800', icon: <XCircle className="w-4 h-4" /> };
    }
  };

  const getPaymentMethodInfo = (method: string) => {
    switch (method) {
      case 'cash':
        return { label: 'Tiền mặt', icon: <Banknote className="w-4 h-4" />, color: 'text-green-600' };
      case 'card':
        return { label: 'Thẻ', icon: <CreditCard className="w-4 h-4" />, color: 'text-blue-600' };
      case 'bank_transfer':
        return { label: 'Chuyển khoản', icon: <CreditCard className="w-4 h-4" />, color: 'text-purple-600' };
      case 'e_wallet':
        return { label: 'Ví điện tử', icon: <QrCode className="w-4 h-4" />, color: 'text-orange-600' };
      default:
        return { label: 'QR Code', icon: <QrCode className="w-4 h-4" />, color: 'text-gray-600' };
    }
  };

  if (salesError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EmptyState
            icon={<XCircle className="w-16 h-16" />}
            title="Lỗi tải dữ liệu"
            description={salesError}
            action={
              <Button onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Thử lại
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Lịch sử bán hàng"
          subtitle={`Tổng cộng ${pagination?.total || 0} đơn hàng`}
          actions={
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={exportCSV}>
                <Download className="w-4 h-4 mr-2" />
                Xuất CSV
              </Button>
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Làm mới
              </Button>
              <Button onClick={handleNewSale}>
                <Plus className="w-4 h-4 mr-2" />
                Bán hàng mới
              </Button>
            </div>
          }
        />

        {/* Stats Cards */}
        <Grid cols={4} gap="md" className="mb-8">
          <StatsCard
            title="Hôm nay"
            value={formatCurrency((summary || defaultSummary).today.total_amount)}
            change={{
              value: (summary || defaultSummary).growth_rates.daily,
              type: (summary || defaultSummary).growth_rates.daily > 0 ? 'increase' :
                    (summary || defaultSummary).growth_rates.daily < 0 ? 'decrease' : 'neutral'
            }}
            icon={<DollarSign className="w-6 h-6" />}
            loading={!summary}
          />
          <StatsCard
            title="Số đơn hôm nay"
            value={(summary || defaultSummary).today.sales_count}
            icon={<ShoppingBag className="w-6 h-6" />}
            loading={!summary}
          />
          <StatsCard
            title="Tuần này"
            value={formatCurrency((summary || defaultSummary).this_week.total_amount)}
            change={{
              value: (summary || defaultSummary).growth_rates.weekly,
              type: (summary || defaultSummary).growth_rates.weekly > 0 ? 'increase' :
                    (summary || defaultSummary).growth_rates.weekly < 0 ? 'decrease' : 'neutral'
            }}
            icon={<TrendingUp className="w-6 h-6" />}
            loading={!summary}
          />
          <StatsCard
            title="Giá trị TB/đơn"
            value={formatCurrency((summary || defaultSummary).today.average_sale)}
            icon={<Activity className="w-6 h-6" />}
            loading={!summary}
          />
        </Grid>

        {/* Filters */}
        <Card className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm đơn hàng theo mã, khách hàng..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="all">Tất cả trạng thái</option>
                <option value="completed">Đã thanh toán</option>
                <option value="pending">Chờ thanh toán</option>
                <option value="cancelled">Đã hủy</option>
                <option value="refunded">Đã hoàn tiền</option>
              </select>

              <select
                value={filters.payment_method}
                onChange={(e) => setFilters(prev => ({ ...prev, payment_method: e.target.value }))}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="all">Tất cả PTTT</option>
                <option value="cash">Tiền mặt</option>
                <option value="card">Thẻ</option>
                <option value="bank_transfer">Chuyển khoản</option>
                <option value="e_wallet">Ví điện tử</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="w-4 h-4 mr-2" />
                Bộ lọc
              </Button>
              <Button variant="outline" onClick={handleClearFilters}>
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        </Card>

        {/* Sales Grid */}
        <Section title={`Đơn hàng (${Array.isArray(sales) ? sales.length : 0})`}>
          {salesLoading ? (
            <Card>
              <LoadingSpinner className="py-12" />
            </Card>
          ) : Array.isArray(sales) && sales.length > 0 ? (
            <Grid cols={3} gap="md">
              {sales.map((sale, index) => {
                // Add safety checks for sale object
                if (!sale || !sale.id) {
                  console.warn(`Invalid sale at index ${index}:`, sale);
                  return null;
                }

                try {

                const statusInfo = getStatusInfo(sale.status);
                const paymentInfo = getPaymentMethodInfo(sale.payments?.[0]?.payment_method_id || 'cash');

                return (
                  <Card key={sale.id} hover className="group relative">
                    <div className="space-y-4">
                      {/* Sale Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-lg">
                              {sale.order_number && sale.order_number.length >= 3 ? sale.order_number.slice(-3) : sale.order_number || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              #{sale.order_number || 'N/A'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {sale.customer_name || 'Khách lẻ'}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color} flex items-center space-x-1`}>
                                {statusInfo.icon}
                                <span>{statusInfo.label}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions Dropdown */}
                        <div className="relative group/actions">
                          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover/actions:opacity-100 group-hover/actions:visible transition-all z-10">
                            <div className="py-1">
                              <button
                                onClick={() => handleViewDetails(sale)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Xem chi tiết
                              </button>
                              <button
                                onClick={() => handlePrintReceipt(sale)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                              >
                                <Printer className="w-4 h-4 mr-2" />
                                In hóa đơn
                              </button>
                              {sale.status === 'completed' && (
                                <button
                                  onClick={() => handleRefund(sale)}
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                                >
                                  <Refund className="w-4 h-4 mr-2" />
                                  Hoàn tiền
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-center py-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency((sale.total_cents || 0) / 100)}
                        </p>
                        {(sale.discount_cents || 0) > 0 && (
                          <p className="text-sm text-green-600">
                            Giảm giá: {formatCurrency((sale.discount_cents || 0) / 100)}
                          </p>
                        )}
                      </div>

                      {/* Payment Info */}
                      <div className="flex items-center justify-between text-sm">
                        <div className={`flex items-center space-x-1 ${paymentInfo.color}`}>
                          {paymentInfo.icon}
                          <span>{paymentInfo.label}</span>
                        </div>
                        <span className="text-gray-500">
                          {sale.created_at ? new Date(sale.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                        </span>
                      </div>

                      {/* Customer Contact */}
                      {sale.customer_phone && (
                        <div className="flex items-center text-sm text-gray-600 pt-2 border-t">
                          <Phone className="w-4 h-4 mr-1" />
                          <span>{sale.customer_phone}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                );
                } catch (error) {
                  console.error(`Error rendering sale at index ${index}:`, error, sale);
                  return (
                    <Card key={sale.id || index} className="p-4">
                      <div className="text-center text-red-600">
                        <p className="text-sm">Lỗi hiển thị đơn hàng #{sale.order_number || 'N/A'}</p>
                      </div>
                    </Card>
                  );
                }
              })}
            </Grid>
          ) : (
            <EmptyState
              icon={<ShoppingBag className="w-16 h-16" />}
              title="Chưa có đơn hàng nào"
              description="Tạo đơn hàng đầu tiên hoặc thay đổi bộ lọc để xem kết quả"
              action={
                <Button onClick={handleNewSale}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo đơn hàng đầu tiên
                </Button>
              }
            />
          )}
        </Section>

        {/* Pagination */}
        {pagination && pagination.total > rowsPerPage && (
          <Card className="mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị {page * rowsPerPage + 1} - {Math.min((page + 1) * rowsPerPage, pagination.total)} của {pagination.total} kết quả
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={(page + 1) * rowsPerPage >= pagination.total}
                >
                  Sau
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Sale Details Modal */}
        {showDetailsModal && selectedSale && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDetailsModal(false)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Chi tiết đơn hàng #{selectedSale.order_number}</h3>
                <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowDetailsModal(false)}>✕</button>
              </div>
              <div className="p-6">
                <Grid cols={2} gap="lg">
                  {/* Order Information */}
                  <Card>
                    <h4 className="font-semibold text-gray-900 mb-4">Thông tin đơn hàng</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600">Mã đơn hàng:</span>
                        <p className="font-medium">#{selectedSale.order_number}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Ngày tạo:</span>
                        <p>{new Date(selectedSale.created_at).toLocaleString('vi-VN')}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Trạng thái:</span>
                        <div className="mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusInfo(selectedSale.status).color} flex items-center space-x-1 inline-flex`}>
                            {getStatusInfo(selectedSale.status).icon}
                            <span>{getStatusInfo(selectedSale.status).label}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Customer Information */}
                  <Card>
                    <h4 className="font-semibold text-gray-900 mb-4">Thông tin khách hàng</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600">Tên khách hàng:</span>
                        <p className="font-medium">{selectedSale.customer_name || 'Khách lẻ'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Số điện thoại:</span>
                        <p>{selectedSale.customer_phone || 'Chưa có thông tin'}</p>
                      </div>
                    </div>
                  </Card>

                  {/* Payment Summary */}
                  <Card padding="lg" className="col-span-2">
                    <h4 className="font-semibold text-gray-900 mb-4">Thông tin thanh toán</h4>
                    <Grid cols={4} gap="md">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Tạm tính</p>
                        <p className="text-lg font-semibold">{formatCurrency((selectedSale.subtotal_cents || 0) / 100)}</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <p className="text-sm text-gray-600">Giảm giá</p>
                        <p className="text-lg font-semibold text-red-600">-{formatCurrency((selectedSale.discount_cents || 0) / 100)}</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-gray-600">Thuế</p>
                        <p className="text-lg font-semibold">{formatCurrency((selectedSale.tax_cents || 0) / 100)}</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Tổng cộng</p>
                        <p className="text-xl font-bold text-blue-600">{formatCurrency(selectedSale.total_cents / 100)}</p>
                      </div>
                    </Grid>
                  </Card>
                </Grid>

                <div className="mt-6 flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                    Đóng
                  </Button>
                  <Button onClick={() => handlePrintReceipt(selectedSale)}>
                    <Printer className="w-4 h-4 mr-2" />
                    In hóa đơn
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Refund Modal */}
        {showRefundModal && selectedSale && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowRefundModal(false)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
              <div className="border-b px-6 py-4">
                <h3 className="text-xl font-bold text-gray-900">Hoàn tiền đơn hàng #{selectedSale.order_number}</h3>
              </div>
              <div className="p-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Lưu ý</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>Hành động hoàn tiền không thể hoàn tác. Vui lòng kiểm tra kỹ thông tin trước khi xác nhận.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền hoàn</label>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      max={selectedSale.total_cents / 100}
                      min={0}
                    />
                    <p className="text-sm text-gray-500 mt-1">Tối đa: {formatCurrency(selectedSale.total_cents / 100)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phương thức hoàn tiền</label>
                    <select
                      value={refundMethod}
                      onChange={(e) => setRefundMethod(e.target.value as 'cash' | 'card' | 'store_credit')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="cash">Tiền mặt</option>
                      <option value="card">Hoàn về thẻ</option>
                      <option value="store_credit">Tín dụng cửa hàng</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lý do hoàn tiền</label>
                    <textarea
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nhập lý do hoàn tiền..."
                      required
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setShowRefundModal(false)}>
                    Hủy
                  </Button>
                  <Button
                    onClick={handleRefundSubmit}
                    disabled={loading || !refundReason.trim() || refundAmount <= 0}
                  >
                    {loading ? 'Đang xử lý...' : 'Xác nhận hoàn tiền'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernSalesHistory;