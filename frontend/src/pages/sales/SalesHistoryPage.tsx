// Vietnamese Computer Hardware POS Sales History
// ComputerPOS Pro - Production Implementation

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { posApi, type Order } from '../../services/api/posApi';
import { formatCurrency } from '../../lib/utils';

interface OrderDetail extends Order {
  // Override Order properties with compatible types
  code: string;
  total: number;
  subtotal: number;
  items?: Array<{
    id: string;
    product_name: string;
    qty: number;
    price: number;
    total: number;
  }>;
  payments?: Array<{
    method: string;
    amount: number;
    created_at: string;
  }>;
}

const SalesHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Advanced filters
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Return management
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [returnData, setReturnData] = useState({
    items: [] as string[],
    reason: '',
    amount: 0,
    method: 'refund'
  });

  useEffect(() => {
    loadOrders();
  }, [currentPage, statusFilter, dateFrom, dateTo, paymentMethodFilter, minAmount, maxAmount, sortBy, sortOrder]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📡 Loading orders with params:', {
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter === 'all' ? undefined : statusFilter,
        from: dateFrom || undefined,
        to: dateTo || undefined
      });

      const response = await posApi.getOrders(
        currentPage,
        itemsPerPage,
        statusFilter === 'all' ? undefined : statusFilter,
        dateFrom || undefined,
        dateTo || undefined
      );

      console.log('📡 API Response:', response);

      if (response.success && response.data) {
        const ordersData = Array.isArray(response.data) ? response.data : [];

        // Transform API data to match our interface based on actual schema
        const transformedOrders = ordersData.map((order: any) => ({
          ...order,
          code: order.order_number || `#${order.id?.slice(0, 8)}`,
          total: order.total_cents ? order.total_cents / 100 : 0,
          subtotal: order.subtotal_cents ? order.subtotal_cents / 100 : 0,
          // Use denormalized customer data from orders table
          customer_name: order.customer_name || 'Khách lẻ',
          customer_phone: order.customer_phone || null,
          items: [] // Will be fetched separately if needed
        }));

        // Apply additional filters
        let filteredOrders = transformedOrders.filter(order => {
          if (customerFilter && !order.customer_name?.toLowerCase().includes(customerFilter.toLowerCase())) {
            return false;
          }
          
          if (minAmount && order.total < parseFloat(minAmount)) {
            return false;
          }
          
          if (maxAmount && order.total > parseFloat(maxAmount)) {
            return false;
          }
          
          return true;
        });

        // Apply sorting
        filteredOrders.sort((a, b) => {
          let aValue: any = a[sortBy as keyof Order];
          let bValue: any = b[sortBy as keyof Order];
          
          if (sortBy === 'created_at') {
            aValue = new Date(aValue).getTime();
            bValue = new Date(bValue).getTime();
          }
          
          if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });

        setOrders(filteredOrders);
        setTotalPages(Math.ceil(filteredOrders.length / itemsPerPage));
      } else {
        setError(response.error || 'Failed to load orders');
      }

    } catch (error) {
      console.error('Sales history loading failed:', error);
      setError('Failed to load sales history');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    console.log('🔍 Search triggered');
    setCurrentPage(1);
    loadOrders();
  };

  const handleResetFilters = () => {
    console.log('🔄 Reset filters triggered');
    setSearchQuery('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setPaymentMethodFilter('all');
    setCustomerFilter('');
    setMinAmount('');
    setMaxAmount('');
    setSortBy('created_at');
    setSortOrder('desc');
    setCurrentPage(1);
    loadOrders();
  };

  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    
    return (
      order.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_phone?.includes(searchQuery) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const orderStats = {
    total: filteredOrders.length,
    completed: filteredOrders.filter(o => o.status === 'completed').length,
    pending: filteredOrders.filter(o => o.status === 'pending').length,
    cancelled: filteredOrders.filter(o => o.status === 'cancelled').length,
    totalRevenue: filteredOrders.reduce((sum, o) => sum + o.total, 0),
    avgOrderValue: filteredOrders.length > 0 ? filteredOrders.reduce((sum, o) => sum + o.total, 0) / filteredOrders.length : 0
  };

  const exportToExcel = () => {
    console.log('📊 Export Excel triggered', { orderCount: filteredOrders.length });

    const csvContent = [
      ['Mã đơn', 'Khách hàng', 'SĐT', 'Thời gian', 'Tổng tiền', 'Trạng thái', 'Phương thức thanh toán'],
      ...filteredOrders.map(order => [
        order.code,
        order.customer_name || 'Khách lẻ',
        order.customer_phone || '-',
        new Date(order.created_at).toLocaleString('vi-VN'),
        order.total.toString(),
        order.status,
        'N/A' // Would need payment method from API
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lich-su-ban-hang-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handlePrintOrder = (order: OrderDetail) => {
    console.log('🖨️ Print order triggered', { orderId: order.id, orderCode: order.code });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      console.error('❌ Could not open print window - popup blocked?');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Hóa đơn ${order.code}</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .order-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .customer-info { margin-bottom: 20px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f2f2f2; }
            .total-section { text-align: right; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; font-style: italic; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>HÓA ĐƠN BÁN HÀNG</h1>
            <p>SmartPOS - Hệ thống bán hàng thông minh</p>
          </div>

          <div class="order-info">
            <div>
              <strong>Mã đơn:</strong> ${order.code}<br>
              <strong>Ngày tạo:</strong> ${new Date(order.created_at).toLocaleString('vi-VN')}
            </div>
            <div>
              <strong>Trạng thái:</strong> ${order.status === 'completed' ? 'Hoàn thành' :
                                           order.status === 'pending' ? 'Đang xử lý' :
                                           order.status === 'cancelled' ? 'Đã hủy' : order.status}
            </div>
          </div>

          <div class="customer-info">
            <h3>Thông tin khách hàng</h3>
            <strong>Tên:</strong> ${order.customer_name || 'Khách lẻ'}<br>
            ${order.customer_phone ? `<strong>SĐT:</strong> ${order.customer_phone}<br>` : ''}
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Sản phẩm</th>
                <th>Số lượng</th>
                <th>Đơn giá</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${order.items?.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.product_name}</td>
                  <td>${item.qty}</td>
                  <td>${formatCurrency(item.price)}</td>
                  <td>${formatCurrency(item.total)}</td>
                </tr>
              `).join('') || '<tr><td colspan="5">Không có thông tin chi tiết</td></tr>'}
            </tbody>
          </table>

          <div class="total-section">
            <p>Tạm tính: ${formatCurrency(order.subtotal)}</p>
            <p>Tổng cộng: <strong>${formatCurrency(order.total)}</strong></p>
          </div>

          <div class="footer">
            <p>Cảm ơn quý khách đã mua hàng!</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleReturn = async () => {
    if (!selectedOrder) return;

    try {
      // Mock API call for return
      console.log('Processing return for order:', selectedOrder.id, returnData);
      
      // Close modal and refresh data
      setShowReturnModal(false);
      setSelectedOrder(null);
      setReturnData({ items: [], reason: '', amount: 0, method: 'refund' });
      
      await loadOrders();
      
    } catch (error) {
      console.error('Return failed:', error);
      setError('Failed to process return');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { class: 'badge-success', text: '✅ Hoàn thành', icon: '✅' },
      pending: { class: 'badge-warning', text: '⏳ Đang xử lý', icon: '⏳' },
      cancelled: { class: 'badge-error', text: '❌ Đã hủy', icon: '❌' },
      processing: { class: 'badge-info', text: '🔄 Đang xử lý', icon: '🔄' },
      shipped: { class: 'badge-primary', text: '🚚 Đã giao', icon: '🚚' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { 
      class: 'badge-info', 
      text: status, 
      icon: '📋' 
    };

    return (
      <span className={`badge ${config.class}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 p-4">
        <div className="bg-base-100 rounded-lg shadow-sm p-8 text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4">Đang tải lịch sử bán hàng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base-200 p-4">
        <div className="bg-base-100 rounded-lg shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-4">Lỗi tải dữ liệu</h2>
          <p className="text-base-content/70 mb-6">{error}</p>
            <button
              className="btn btn-primary"
              onClick={loadOrders}
            >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-4">
      {/* Header */}
      <div className="bg-base-100 rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">
            📊 Lịch sử bán hàng
          </h1>
          <div className="flex gap-2">
            <button 
              className="btn btn-outline btn-sm"
              onClick={exportToExcel}
            >
              📈 Xuất Excel
            </button>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/sales/new')}
            >
              ➕ Tạo đơn hàng mới
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-base-100 rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/70">Tổng đơn</p>
              <p className="text-2xl font-bold">{orderStats.total}</p>
            </div>
            <div className="text-3xl">📋</div>
          </div>
        </div>

        <div className="bg-base-100 rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/70">Hoàn thành</p>
              <p className="text-2xl font-bold text-success">{orderStats.completed}</p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>

        <div className="bg-base-100 rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/70">Đang xử lý</p>
              <p className="text-2xl font-bold text-warning">{orderStats.pending}</p>
            </div>
            <div className="text-3xl">⏳</div>
          </div>
        </div>

        <div className="bg-base-100 rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/70">Đã hủy</p>
              <p className="text-2xl font-bold text-error">{orderStats.cancelled}</p>
            </div>
            <div className="text-3xl">❌</div>
          </div>
        </div>

        <div className="bg-base-100 rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/70">Doanh thu</p>
              <p className="text-2xl font-bold">{formatCurrency(orderStats.totalRevenue)}</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        <div className="bg-base-100 rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/70">TB/Đơn</p>
              <p className="text-2xl font-bold">{formatCurrency(orderStats.avgOrderValue)}</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-base-100 rounded-lg shadow-sm p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="form-control">
            <input
              type="text"
              placeholder="Tìm mã đơn, khách hàng..."
              className="input input-bordered"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="form-control">
            <select
              className="select select-bordered"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Đang xử lý</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
              <option value="processing">Đang xử lý</option>
              <option value="shipped">Đã giao</option>
            </select>
          </div>

          <div className="form-control">
            <input
              type="date"
              className="input input-bordered"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className="form-control">
            <input
              type="date"
              className="input input-bordered"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="form-control">
            <input
              type="text"
              placeholder="Tìm khách hàng..."
              className="input input-bordered"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
            />
          </div>

          <div className="form-control">
            <select
              className="select select-bordered"
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
            >
              <option value="all">Tất cả thanh toán</option>
              <option value="cash">Tiền mặt</option>
              <option value="card">Thẻ</option>
              <option value="transfer">Chuyển khoản</option>
            </select>
          </div>

          <div className="form-control">
            <input
              type="number"
              placeholder="Từ số tiền"
              className="input input-bordered"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
            />
          </div>

          <div className="form-control">
            <input
              type="number"
              placeholder="Đến số tiền"
              className="input input-bordered"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
            />
          </div>

          <div className="form-control">
            <select
              className="select select-bordered"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="created_at">Sắp xếp theo thời gian</option>
              <option value="total">Sắp xếp theo tổng tiền</option>
              <option value="code">Sắp xếp theo mã đơn</option>
            </select>
          </div>

          <div className="form-control">
            <select
              className="select select-bordered"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            >
              <option value="desc">Giảm dần</option>
              <option value="asc">Tăng dần</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button 
            className="btn btn-primary" onClick={handleSearch}
          >
            🔍 Tìm kiếm
          </button>

          <button 
            className="btn btn-outline" onClick={handleResetFilters}
          >
            🔄 Làm mới
          </button>

          <button 
            className="btn btn-outline" onClick={exportToExcel}
          >
            📊 Xuất Excel
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-base-100 rounded-lg shadow-sm p-4">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Thời gian</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <div className="font-bold">{order.code}</div>
                    <div className="text-sm opacity-50">#{order.id.slice(0, 8)}</div>
                  </td>
                  <td>
                    <div>
                      <div className="font-bold">{order.customer_name || 'Khách lẻ'}</div>
                      <div className="text-sm opacity-50">{order.customer_phone || '-'}</div>
                    </div>
                  </td>
                  <td>{new Date(order.created_at).toLocaleString('vi-VN')}</td>
                  <td>
                    <div className="font-bold">{formatCurrency(order.total)}</div>
                    <div className="text-sm opacity-50">
                      Subtotal: {formatCurrency(order.subtotal)}
                    </div>
                  </td>
                  <td>
                    {getStatusBadge(order.status)}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-sm btn-outline" onClick={() => navigate(`/orders/detail/${order.id}`)}
                      >
                        👁️ Xem
                      </button>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handlePrintOrder(order)}
                      >
                        🖨️ In
                      </button>
                      {order.status === 'completed' && (
                        <button 
                          className="btn btn-sm btn-error btn-outline" onClick={() => {
                            setSelectedOrder(order);
                            setShowReturnModal(true);
                          }}
                        >
                          💸 Hoàn trả
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-8">
              <p className="text-base-content/70">Không tìm thấy đơn hàng nào</p>
            </div>
          )}
        </div>

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-base-content/70">
              Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredOrders.length)} 
              trong tổng số {filteredOrders.length} đơn hàng
            </div>
            
            <div className="join">
              <button
                className="join-item btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                «
              </button>
              <button className="join-item btn">
                Trang {currentPage} / {totalPages}
              </button>
              <button
                className="join-item btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                »
              </button>
            </div>

            <div className="form-control">
              <select
                className="select select-bordered select-sm"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10/trang</option>
                <option value={20}>20/trang</option>
                <option value={50}>50/trang</option>
                <option value={100}>100/trang</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Return Modal */}
      {showReturnModal && selectedOrder && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">💸 Hoàn trả đơn hàng</h3>
            <p className="py-4">
              Đơn hàng: <strong>{selectedOrder.code}</strong><br/>
              Khách hàng: <strong>{selectedOrder.customer_name || 'Khách lẻ'}</strong><br/>
              Tổng tiền: <strong>{formatCurrency(selectedOrder.total)}</strong>
            </p>
            
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Phương thức hoàn trả</span>
              </label>
              <select
                className="select select-bordered"
                value={returnData.method}
                onChange={(e) => setReturnData({
                  ...returnData,
                  method: e.target.value
                })}
              >
                <option value="refund">Hoàn tiền</option>
                <option value="exchange">Đổi hàng</option>
                <option value="credit">Ghi nợ</option>
              </select>
            </div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Lý do hoàn trả</span>
              </label>
              <select
                className="select select-bordered"
                value={returnData.reason}
                onChange={(e) => setReturnData({
                  ...returnData,
                  reason: e.target.value
                })}
              >
                <option value="">Chọn lý do</option>
                <option value="customer_request">Khách hàng yêu cầu</option>
                <option value="product_defect">Sản phẩm lỗi</option>
                <option value="wrong_order">Đặt nhầm</option>
                <option value="delivery_issue">Vấn đề giao hàng</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Số tiền hoàn trả</span>
              </label>
              <input
                type="number"
                className="input input-bordered"
                value={returnData.amount}
                max={selectedOrder.total}
                onChange={(e) => setReturnData({
                  ...returnData,
                  amount: parseFloat(e.target.value) || 0
                })}
              />
            </div>

            <div className="modal-action">
              <button 
                className="btn btn-ghost" onClick={() => setShowReturnModal(false)}
              >
                Hủy
              </button>
              <button 
                className="btn btn-error" onClick={handleReturn}
                disabled={!returnData.reason || returnData.amount <= 0}
              >
                Xác nhận hoàn trả
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistoryPage;
