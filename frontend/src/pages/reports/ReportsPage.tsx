import React, { useState, useEffect, useCallback } from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import apiClient from '../../services/api/client';

interface SalesReport {
  date: string;
  total_sales: number;
  total_transactions: number;
  avg_transaction_value: number;
  cash_sales: number;
  card_sales: number;
  transfer_sales: number;
}

interface InventoryReport {
  product_id: string;
  product_name: string;
  sku: string;
  category_name: string;
  current_stock: number;
  min_stock_level: number;
  stock_value: number;
  last_movement_date: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

interface FinancialReport {
  period: string;
  revenue: number;
  cost_of_goods: number;
  gross_profit: number;
  gross_margin: number;
  total_transactions: number;
  avg_transaction_value: number;
}

interface RMAReport {
  product_id: string;
  product_name: string;
  sku: string;
  total_sold: number;
  total_rma: number;
  rma_rate: number;
  warranty_claims: number;
  defective_returns: number;
}

const ReportsPage: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'financial' | 'rma'>('sales');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end_date: new Date().toISOString().split('T')[0] // today
  });

  // Report data
  const [salesReport, setSalesReport] = useState<SalesReport[]>([]);
  const [inventoryReport, setInventoryReport] = useState<InventoryReport[]>([]);
  const [financialReport, setFinancialReport] = useState<FinancialReport[]>([]);
  const [rmaReport, setRMAReport] = useState<RMAReport[]>([]);

  // Summary stats
  const [summaryStats, setSummaryStats] = useState({
    total_revenue: 0,
    total_transactions: 0,
    avg_transaction_value: 0,
    total_products: 0,
    low_stock_products: 0,
    out_of_stock_products: 0,
    total_rma_rate: 0
  });

  useEffect(() => {
    if (isOnline) {
      loadReportData();
    }
  }, [isOnline, activeTab, dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    setError(null);

    try {
      switch (activeTab) {
        case 'sales':
          await loadSalesReport();
          break;
        case 'inventory':
          await loadInventoryReport();
          break;
        case 'financial':
          await loadFinancialReport();
          break;
        case 'rma':
          await loadRMAReport();
          break;
      }
    } catch (err: any) {
      setError('Không thể tải dữ liệu báo cáo. Vui lòng kiểm tra kết nối internet.');
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSalesReport = async () => {
    const response = await apiClient.get('/reports/sales', {
      params: dateRange
    });
    setSalesReport(response.data.data || []);
    setSummaryStats(prev => ({
      ...prev,
      total_revenue: response.data.summary?.total_revenue || 0,
      total_transactions: response.data.summary?.total_transactions || 0,
      avg_transaction_value: response.data.summary?.avg_transaction_value || 0
    }));
  };

  const loadInventoryReport = async () => {
    const response = await apiClient.get('/reports/inventory');
    setInventoryReport(response.data.data || []);
    setSummaryStats(prev => ({
      ...prev,
      total_products: response.data.summary?.total_products || 0,
      low_stock_products: response.data.summary?.low_stock_products || 0,
      out_of_stock_products: response.data.summary?.out_of_stock_products || 0
    }));
  };

  const loadFinancialReport = async () => {
    const response = await apiClient.get('/reports/financial', {
      params: dateRange
    });
    setFinancialReport(response.data.data || []);
  };

  const loadRMAReport = async () => {
    const response = await apiClient.get('/reports/rma', {
      params: dateRange
    });
    setRMAReport(response.data.data || []);
    setSummaryStats(prev => ({
      ...prev,
      total_rma_rate: response.data.summary?.total_rma_rate || 0
    }));
  };

  const exportReport = async () => {
    try {
      const response = await apiClient.get(`/reports/${activeTab}/export`, {
        params: dateRange
      });

      // Create and download CSV file
      const csvContent = response.data.csv;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}_report_${dateRange.start_date}_${dateRange.end_date}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Lỗi export báo cáo');
      console.error('Failed to export report:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  if (!isOnline) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🌐</div>
          <h1 className="text-2xl font-bold text-red-800 mb-2">Báo cáo yêu cầu kết nối internet</h1>
          <p className="text-red-600">Vui lòng kiểm tra kết nối mạng để xem báo cáo real-time.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Báo cáo & Phân tích</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-sm text-green-600 font-medium">Real-time Data</span>
            </div>
            <button
              onClick={exportReport}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-400 mr-3">⚠️</div>
            <p className="text-red-800 flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 ml-4"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium mb-1">Từ ngày:</label>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Đến ngày:</label>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="pt-6">
              <button
                onClick={loadReportData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'sales', label: 'Bán hàng', icon: '💰' },
                { key: 'inventory', label: 'Tồn kho', icon: '📦' },
                { key: 'financial', label: 'Tài chính', icon: '📊' },
                { key: 'rma', label: 'RMA/Bảo hành', icon: '🔧' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-lg shadow-md">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">Đang tải dữ liệu báo cáo...</div>
            </div>
          ) : (
            <>
              {/* Sales Report */}
              {activeTab === 'sales' && (
                <div className="p-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-blue-800">Tổng doanh thu</h3>
                      <p className="text-2xl font-bold text-blue-900">{formatCurrency(summaryStats.total_revenue)}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-green-800">Tổng giao dịch</h3>
                      <p className="text-2xl font-bold text-green-900">{summaryStats.total_transactions.toLocaleString('vi-VN')}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-purple-800">Giá trị TB/giao dịch</h3>
                      <p className="text-2xl font-bold text-purple-900">{formatCurrency(summaryStats.avg_transaction_value)}</p>
                    </div>
                  </div>

                  {/* Sales Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Doanh thu</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Giao dịch</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">TB/Giao dịch</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tiền mặt</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thẻ</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Chuyển khoản</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {salesReport.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {new Date(row.date).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {formatCurrency(row.total_sales)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {row.total_transactions.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {formatCurrency(row.avg_transaction_value)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {formatCurrency(row.cash_sales)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {formatCurrency(row.card_sales)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {formatCurrency(row.transfer_sales)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Inventory Report */}
              {activeTab === 'inventory' && (
                <div className="p-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-blue-800">Tổng sản phẩm</h3>
                      <p className="text-2xl font-bold text-blue-900">{summaryStats.total_products.toLocaleString('vi-VN')}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-yellow-800">Sắp hết hàng</h3>
                      <p className="text-2xl font-bold text-yellow-900">{summaryStats.low_stock_products.toLocaleString('vi-VN')}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-red-800">Hết hàng</h3>
                      <p className="text-2xl font-bold text-red-900">{summaryStats.out_of_stock_products.toLocaleString('vi-VN')}</p>
                    </div>
                  </div>

                  {/* Inventory Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh mục</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tồn kho</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tối thiểu</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Giá trị tồn</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {inventoryReport.map((row) => (
                          <tr key={row.product_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {row.product_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row.sku}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row.category_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {row.current_stock.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {row.min_stock_level.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {formatCurrency(row.stock_value)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                row.status === 'in_stock' ? 'bg-green-100 text-green-800' :
                                row.status === 'low_stock' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {row.status === 'in_stock' ? 'Còn hàng' :
                                 row.status === 'low_stock' ? 'Sắp hết' : 'Hết hàng'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Financial Report */}
              {activeTab === 'financial' && (
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kỳ</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Doanh thu</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Giá vốn</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Lợi nhuận gộp</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tỷ suất LN</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Giao dịch</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {financialReport.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {row.period}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {formatCurrency(row.revenue)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {formatCurrency(row.cost_of_goods)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {formatCurrency(row.gross_profit)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              <span className={row.gross_margin > 0.2 ? 'text-green-600' : row.gross_margin > 0.1 ? 'text-yellow-600' : 'text-red-600'}>
                                {formatPercentage(row.gross_margin)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {row.total_transactions.toLocaleString('vi-VN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* RMA Report */}
              {activeTab === 'rma' && (
                <div className="p-6">
                  {/* Summary Card */}
                  <div className="bg-orange-50 rounded-lg p-4 mb-6">
                    <h3 className="text-sm font-medium text-orange-800">Tỷ lệ RMA trung bình</h3>
                    <p className="text-2xl font-bold text-orange-900">{formatPercentage(summaryStats.total_rma_rate)}</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Đã bán</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">RMA</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tỷ lệ RMA</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bảo hành</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Lỗi</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {rmaReport.map((row) => (
                          <tr key={row.product_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {row.product_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row.sku}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {row.total_sold.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {row.total_rma.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              <span className={`font-medium ${
                                row.rma_rate > 0.1 ? 'text-red-600' :
                                row.rma_rate > 0.05 ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {formatPercentage(row.rma_rate)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {row.warranty_claims.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {row.defective_returns.toLocaleString('vi-VN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
