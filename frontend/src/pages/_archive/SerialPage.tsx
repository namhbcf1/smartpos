import React, { useState, useEffect, useCallback } from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import apiClient from '../../services/api/client';

interface Serial {
  id: string;
  serial_number: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  status: 'available' | 'sold' | 'reserved' | 'warranty' | 'returned' | 'defective';
  purchase_order_id?: string;
  sale_id?: string;
  customer_id?: string;
  customer_name?: string;
  warranty_start_date?: string;
  warranty_end_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  has_serial: boolean;
}

interface SerialHistory {
  id: string;
  serial_id: string;
  action: string;
  old_status?: string;
  new_status?: string;
  user_id: string;
  user_name?: string;
  notes?: string;
  created_at: string;
}

const SerialPage: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [serials, setSerials] = useState<Serial[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSerial, setSelectedSerial] = useState<Serial | null>(null);
  const [serialHistory, setSerialHistory] = useState<SerialHistory[]>([]);
  const [bulkSerials, setBulkSerials] = useState('');
  const [selectedProductForImport, setSelectedProductForImport] = useState('');
  const itemsPerPage = 50;

  const statusOptions = [
    { value: 'available', label: 'Có sẵn', color: 'bg-green-100 text-green-800' },
    { value: 'sold', label: 'Đã bán', color: 'bg-blue-100 text-blue-800' },
    { value: 'reserved', label: 'Đã đặt', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'warranty', label: 'Bảo hành', color: 'bg-orange-100 text-orange-800' },
    { value: 'returned', label: 'Trả lại', color: 'bg-purple-100 text-purple-800' },
    { value: 'defective', label: 'Lỗi', color: 'bg-red-100 text-red-800' }
  ];

  // Load initial data
  useEffect(() => {
    if (isOnline) {
      loadData();
    }
  }, [isOnline]);

  // Load serials when filters change
  useEffect(() => {
    if (isOnline) {
      loadSerials();
    }
  }, [isOnline, searchTerm, selectedStatus, selectedProduct, currentPage]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load serials and products in parallel
      const [serialsRes, productsRes] = await Promise.all([
        apiClient.get('/serials', {
          params: {
            page: currentPage,
            limit: itemsPerPage,
            search: searchTerm,
            status: selectedStatus,
            product_id: selectedProduct
          }
        }),
        apiClient.get('/products', {
          params: { has_serial: true, limit: 1000 }
        })
      ]);

      setSerials(serialsRes.data.data || []);
      setTotalPages(Math.ceil((serialsRes.data.total || 0) / itemsPerPage));
      setProducts(productsRes.data.data || []);
    } catch (err: any) {
      setError('Không thể tải dữ liệu serial. Vui lòng kiểm tra kết nối internet.');
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSerials = async () => {
    try {
      setError(null);
      const response = await apiClient.get('/serials', {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm,
          status: selectedStatus,
          product_id: selectedProduct
        }
      });

      setSerials(response.data.data || []);
      setTotalPages(Math.ceil((response.data.total || 0) / itemsPerPage));
    } catch (err: any) {
      setError('Lỗi tải danh sách serial');
      console.error('Failed to load serials:', err);
    }
  };

  const loadSerialHistory = async (serialId: string) => {
    try {
      const response = await apiClient.get(`/serials/${serialId}/history`);
      setSerialHistory(response.data.data || []);
    } catch (err) {
      console.error('Failed to load serial history:', err);
      setSerialHistory([]);
    }
  };

  const handleImportSerials = async () => {
    if (!isOnline) {
      setError('Cần kết nối internet để import serial');
      return;
    }

    if (!selectedProductForImport || !bulkSerials.trim()) {
      setError('Vui lòng chọn sản phẩm và nhập danh sách serial');
      return;
    }

    const serialNumbers = bulkSerials
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (serialNumbers.length === 0) {
      setError('Danh sách serial trống');
      return;
    }

    try {
      setError(null);
      const response = await apiClient.post('/serials/import', {
        product_id: selectedProductForImport,
        serial_numbers: serialNumbers
      });

      if (response.data.success) {
        setShowImportModal(false);
        setBulkSerials('');
        setSelectedProductForImport('');
        await loadSerials();
        alert(`Import thành công ${response.data.imported_count} serial numbers!`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Lỗi import serial');
      console.error('Failed to import serials:', err);
    }
  };

  const handleUpdateSerialStatus = async (serialId: string, newStatus: string, notes?: string) => {
    if (!isOnline) {
      setError('Cần kết nối internet để cập nhật serial');
      return;
    }

    try {
      setError(null);
      const response = await apiClient.put(`/serials/${serialId}/status`, {
        status: newStatus,
        notes: notes || ''
      });

      if (response.data.success) {
        await loadSerials();
        if (selectedSerial && selectedSerial.id === serialId) {
          await loadSerialHistory(serialId);
        }
        alert('Cập nhật trạng thái serial thành công!');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Lỗi cập nhật serial');
      console.error('Failed to update serial:', err);
    }
  };

  const handleDeleteSerial = async (serial: Serial) => {
    if (!isOnline) {
      setError('Cần kết nối internet để xóa serial');
      return;
    }

    if (serial.status !== 'available') {
      setError('Chỉ có thể xóa serial ở trạng thái "Có sẵn"');
      return;
    }

    if (!confirm(`Bạn có chắc muốn xóa serial "${serial.serial_number}"?`)) {
      return;
    }

    try {
      setError(null);
      const response = await apiClient.delete(`/serials/${serial.id}`);

      if (response.data.success) {
        await loadSerials();
        alert('Xóa serial thành công!');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Lỗi xóa serial');
      console.error('Failed to delete serial:', err);
    }
  };

  const openSerialDetail = async (serial: Serial) => {
    setSelectedSerial(serial);
    await loadSerialHistory(serial.id);
    setShowDetailModal(true);
  };

  const getStatusDisplay = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption || { value: status, label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const exportSerials = async () => {
    try {
      const response = await apiClient.get('/serials/export', {
        params: {
          search: searchTerm,
          status: selectedStatus,
          product_id: selectedProduct
        }
      });

      // Create and download CSV file
      const csvContent = response.data.csv;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `serials_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Lỗi export dữ liệu serial');
      console.error('Failed to export serials:', err);
    }
  };

  if (!isOnline) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🌐</div>
          <h1 className="text-2xl font-bold text-red-800 mb-2">Quản lý Serial yêu cầu kết nối internet</h1>
          <p className="text-red-600">Vui lòng kiểm tra kết nối mạng để tiếp tục.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Serial Numbers</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-sm text-green-600 font-medium">Online</span>
            </div>
            <button
              onClick={() => setShowImportModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Import Serial
            </button>
            <button
              onClick={exportSerials}
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
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Tìm theo serial number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả sản phẩm</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
            <button
              onClick={loadSerials}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
            >
              Làm mới
            </button>
          </div>
        </div>

        {/* Serials Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">Đang tải serial numbers...</div>
            </div>
          ) : serials.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">Không có serial nào</div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Serial Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sản phẩm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Khách hàng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bảo hành
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày tạo
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {serials.map((serial) => {
                      const statusDisplay = getStatusDisplay(serial.status);
                      return (
                        <tr key={serial.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-mono text-sm font-medium text-gray-900">
                              {serial.serial_number}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{serial.product_name}</div>
                            <div className="text-sm text-gray-500">{serial.product_sku}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusDisplay.color}`}>
                              {statusDisplay.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {serial.customer_name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {serial.warranty_end_date ? (
                              <div>
                                <div>Đến: {new Date(serial.warranty_end_date).toLocaleDateString('vi-VN')}</div>
                                <div className="text-xs text-gray-500">
                                  {new Date(serial.warranty_end_date) > new Date() ? 'Còn hiệu lực' : 'Hết hạn'}
                                </div>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(serial.created_at).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => openSerialDetail(serial)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Chi tiết
                              </button>
                              {serial.status === 'available' && (
                                <button
                                  onClick={() => handleDeleteSerial(serial)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Xóa
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Trang {currentPage} / {totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Trước
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Import Serial Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Import Serial Numbers</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Chọn sản phẩm *</label>
                <select
                  value={selectedProductForImport}
                  onChange={(e) => setSelectedProductForImport(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Chọn sản phẩm có serial</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Danh sách Serial Numbers *
                  <span className="text-gray-500 text-xs ml-2">(Mỗi serial một dòng)</span>
                </label>
                <textarea
                  value={bulkSerials}
                  onChange={(e) => setBulkSerials(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={10}
                  placeholder="SN001&#10;SN002&#10;SN003&#10;..."
                />
                <div className="text-sm text-gray-600 mt-1">
                  Số lượng serial: {bulkSerials.split('\n').filter(s => s.trim()).length}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Lưu ý:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Mỗi serial number phải trên một dòng riêng</li>
                  <li>• Serial numbers phải là duy nhất trong hệ thống</li>
                  <li>• Các serial trùng lặp sẽ bị bỏ qua</li>
                  <li>• Tất cả serial được import sẽ có trạng thái "Có sẵn"</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleImportSerials}
                  disabled={!selectedProductForImport || !bulkSerials.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Import Serial
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Serial Detail Modal */}
      {showDetailModal && selectedSerial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">
                Chi tiết Serial: {selectedSerial.serial_number}
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Serial Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Thông tin Serial</h4>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Serial Number:</span>
                    <span className="font-mono font-medium">{selectedSerial.serial_number}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Sản phẩm:</span>
                    <span className="font-medium">{selectedSerial.product_name}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">SKU:</span>
                    <span>{selectedSerial.product_sku}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Trạng thái:</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusDisplay(selectedSerial.status).color}`}>
                      {getStatusDisplay(selectedSerial.status).label}
                    </span>
                  </div>

                  {selectedSerial.customer_name && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Khách hàng:</span>
                      <span>{selectedSerial.customer_name}</span>
                    </div>
                  )}

                  {selectedSerial.warranty_start_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bảo hành từ:</span>
                      <span>{new Date(selectedSerial.warranty_start_date).toLocaleDateString('vi-VN')}</span>
                    </div>
                  )}

                  {selectedSerial.warranty_end_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bảo hành đến:</span>
                      <span>{new Date(selectedSerial.warranty_end_date).toLocaleDateString('vi-VN')}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày tạo:</span>
                    <span>{new Date(selectedSerial.created_at).toLocaleString('vi-VN')}</span>
                  </div>
                </div>

                {/* Status Update */}
                <div className="space-y-3">
                  <h5 className="font-medium text-gray-800">Cập nhật trạng thái</h5>
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map((status) => (
                      <button
                        key={status.value}
                        onClick={() => handleUpdateSerialStatus(selectedSerial.id, status.value)}
                        disabled={selectedSerial.status === status.value}
                        className={`px-3 py-2 text-xs rounded-lg border ${
                          selectedSerial.status === status.value
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Serial History */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Lịch sử thay đổi</h4>

                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  {serialHistory.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                      Chưa có lịch sử thay đổi
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {serialHistory.map((history) => (
                        <div key={history.id} className="bg-white rounded-lg p-3 border">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-sm">{history.action}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(history.created_at).toLocaleString('vi-VN')}
                            </span>
                          </div>

                          {history.old_status && history.new_status && (
                            <div className="text-sm text-gray-600 mb-1">
                              {getStatusDisplay(history.old_status).label} → {getStatusDisplay(history.new_status).label}
                            </div>
                          )}

                          {history.notes && (
                            <div className="text-sm text-gray-700">{history.notes}</div>
                          )}

                          <div className="text-xs text-gray-500 mt-1">
                            Bởi: {history.user_name || 'System'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SerialPage;
