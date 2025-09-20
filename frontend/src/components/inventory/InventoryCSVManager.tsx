import React, { useState, useRef } from 'react';
import { 
  Download, 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  X,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/api/client';
import { useAuth } from '../../hooks/useAuth';

interface ImportResult {
  success: boolean;
  message?: string;
  details?: {
    total_rows: number;
    processed: number;
    updated: number;
    errors: string[];
    skipped: number;
  };
}

interface InventoryCSVManagerProps {
  onImportComplete?: () => void;
}

export default function InventoryCSVManager({ onImportComplete }: InventoryCSVManagerProps) {
  const { hasPermission } = useAuth() as any;
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file export
  const handleExport = async (type: 'stock' | 'movements') => {
    if (!hasPermission?.('inventory.export')) {
      toast.error('Không có quyền xuất dữ liệu');
      return;
    }

    setIsExporting(true);
    try {
      const endpoint = type === 'stock' ? '/inventory/csv/export/stock' : '/inventory/csv/export/movements';
      const response = await apiClient.get(endpoint, { 
        responseType: 'blob',
        params: { format: 'csv' }
      });
      
      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const filename = type === 'stock' 
        ? `inventory_export_${new Date().toISOString().split('T')[0]}.csv`
        : `inventory_movements_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Đã xuất ${type === 'stock' ? 'dữ liệu kho' : 'lịch sử xuất nhập'} thành công`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Xuất dữ liệu thất bại');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle file import
  const handleFileUpload = async (file: File) => {
    if (!hasPermission?.('inventory.import')) {
      toast.error('Không có quyền nhập dữ liệu');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Chỉ hỗ trợ file CSV');
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/inventory/csv/import/stock', file.text(), {
        headers: {
          'Content-Type': 'text/csv',
        },
      });

      setImportResult(response.data);
      
      if (response.data.success) {
        toast.success(response.data.message || 'Nhập dữ liệu thành công');
        onImportComplete?.();
      } else {
        toast.error(response.data.error || 'Nhập dữ liệu thất bại');
      }
    } catch (error: any) {
      console.error('Import error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Nhập dữ liệu thất bại';
      toast.error(errorMessage);
      setImportResult({
        success: false,
        message: errorMessage
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Handle drag and drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.name.toLowerCase().endsWith('.csv'));
    
    if (csvFile) {
      await handleFileUpload(csvFile);
    } else {
      toast.error('Vui lòng chọn file CSV');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  // Handle file input change
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Generate sample CSV
  const downloadSample = () => {
    const sampleData = [
      ['ID/SKU', 'Stock Quantity', 'Min Stock (Optional)', 'Max Stock (Optional)'],
      ['12345', '100', '10', '500'],
      ['ABC-001', '50', '5', '200'],
      ['67890', '25', '', '']
    ];
    
    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inventory_import_sample.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Download className="w-5 h-5 mr-2" />
          Xuất dữ liệu
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleExport('stock')}
            disabled={isExporting || !hasPermission?.('inventory.export')}
            className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 mr-2" />
            )}
            Xuất dữ liệu kho
          </button>
          
          <button
            onClick={() => handleExport('movements')}
            disabled={isExporting || !hasPermission?.('inventory.export')}
            className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Xuất lịch sử xuất nhập
          </button>
        </div>
      </div>

      {/* Import Section */}
      {hasPermission?.('inventory.import') && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Nhập dữ liệu
            </h3>
            <button
              onClick={downloadSample}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Tải file mẫu
            </button>
          </div>
          
          {/* Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            <Upload className="w-8 h-8 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-2">
              Kéo thả file CSV vào đây hoặc click để chọn file
            </p>
            <p className="text-sm text-gray-500">
              Format: ID/SKU, Số lượng, Tồn tối thiểu (tùy chọn), Tồn tối đa (tùy chọn)
            </p>
          </div>

          {/* Import Status */}
          {isImporting && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600 mr-2" />
                <span className="text-blue-800">Đang xử lý file...</span>
              </div>
            </div>
          )}

          {/* Import Results */}
          {importResult && (
            <div className="mt-4">
              {importResult.success ? (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-green-800 font-medium">
                        Nhập dữ liệu thành công
                      </h4>
                      {importResult.details && (
                        <div className="mt-2 text-sm text-green-700">
                          <p>Tổng số dòng: {importResult.details.total_rows}</p>
                          <p>Đã xử lý: {importResult.details.processed}</p>
                          <p>Đã cập nhật: {importResult.details.updated}</p>
                          {importResult.details.skipped > 0 && (
                            <p>Bỏ qua: {importResult.details.skipped}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-red-800 font-medium">
                        Nhập dữ liệu thất bại
                      </h4>
                      <p className="mt-1 text-sm text-red-700">
                        {importResult.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Show errors if any */}
              {importResult.details?.errors && importResult.details.errors.length > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h5 className="text-yellow-800 font-medium mb-2">
                    Cảnh báo ({importResult.details.errors.length} lỗi):
                  </h5>
                  <div className="max-h-32 overflow-y-auto">
                    {importResult.details.errors.map((error, index) => (
                      <p key={index} className="text-sm text-yellow-700">
                        • {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Hướng dẫn sử dụng:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Xuất dữ liệu kho:</strong> Tải về tất cả thông tin sản phẩm và tồn kho</li>
          <li>• <strong>Xuất lịch sử:</strong> Tải về tất cả giao dịch xuất nhập kho</li>
          <li>• <strong>Nhập dữ liệu:</strong> Cập nhật số lượng tồn kho từ file CSV</li>
          <li>• <strong>Format nhập:</strong> ID hoặc SKU, Số lượng tồn, Tồn tối thiểu, Tồn tối đa</li>
          <li>• File nhập có thể có hoặc không có header row</li>
        </ul>
      </div>
    </div>
  );
}
