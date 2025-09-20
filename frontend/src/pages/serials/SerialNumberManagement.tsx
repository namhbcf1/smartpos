// Vietnamese Computer Hardware POS Serial Number Management
// ComputerPOS Pro - Advanced Serial Number Management System

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hash,
  Plus,
  Search,
  Edit,
  Eye,
  Download,
  Upload,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  SortAsc,
  SortDesc,
  Copy,
  Calendar,
  User,
  Store,
  Shield,
  Printer
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/ButtonSimplified';
import { DataTable, Column } from '../../components/ui/DataTable';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';
import { comprehensiveAPI, productsAPI } from '../../services/business/comprehensiveApi';
import { API_V1_BASE_URL } from '../../services/api';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

// Enhanced Serial Number Types
interface SerialNumber {
  id: string;
  product_id: string;
  product_name: string;
  serial_number: string;
  batch_number?: string;
  supplier_id?: string;
  supplier_name?: string;
  purchase_date: string;
  purchase_price: number;
  sale_date?: string;
  sale_price?: number;
  customer_id?: string;
  customer_name?: string;
  warranty_start_date?: string;
  warranty_end_date?: string;
  status: 'available' | 'sold' | 'returned' | 'damaged' | 'stolen' | 'recalled';
  condition: 'new' | 'used' | 'refurbished' | 'damaged';
  location: string;
  notes?: string;
  qr_code?: string;
  barcode?: string;
  created_at: string;
  updated_at: string;
}

interface SerialStats {
  total_serials: number;
  available_serials: number;
  sold_serials: number;
  returned_serials: number;
  damaged_serials: number;
  stolen_serials: number;
  recalled_serials: number;
  total_value: number;
  sold_value: number;
  available_value: number;
}

const SerialNumberManagement: React.FC = () => {
  // Enhanced Serial Number Management State
  const [serials, setSerials] = useState<SerialNumber[]>([]);
  const [serialStats, setSerialStats] = useState<SerialStats>({
    total_serials: 0,
    available_serials: 0,
    sold_serials: 0,
    returned_serials: 0,
    damaged_serials: 0,
    stolen_serials: 0,
    recalled_serials: 0,
    total_value: 0,
    sold_value: 0,
    available_value: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedSerial, setSelectedSerial] = useState<SerialNumber | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'available' | 'sold' | 'returned' | 'damaged' | 'stolen' | 'recalled'>('all');
  const [products, setProducts] = useState<Array<{ id: string; name: string; sku?: string }>>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    productId: '',
    purchaseDateFrom: '',
    purchaseDateTo: '',
    saleDateFrom: '',
    saleDateTo: ''
  });
  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);
  
  // Modals and forms
  const [showSerialModal, setShowSerialModal] = useState(false);
  
  // Form data
  const [serialForm, setSerialForm] = useState<Partial<SerialNumber>>({});
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSerials, setTotalSerials] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSerialData();
  }, []);

  // Auto reload when filters/search/page change
  useEffect(() => {
    loadSerialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, currentPage, searchTerm, advancedFilters]);

  // Load products for dropdown
  useEffect(() => {
    (async () => {
      try {
        const res = await productsAPI.getProducts({ limit: 100 });
        if (res.success) {
          const list = (res.data?.data || res.data || []).map((p: any) => ({ id: String(p.id), name: p.name, sku: p.sku }));
          setProducts(list);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const loadSerialData = async () => {
    try {
      setLoading(true);

      // ONLY REAL API - NO MOCK DATA ALLOWED
      const params: any = {
        page: currentPage,
        limit: 20,
        search: searchTerm,
        status: statusFilter === 'all' ? undefined : statusFilter,
        ...advancedFilters
      };
      
      // Clean undefined values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === '') {
          delete params[key];
        }
      });

      const response = await comprehensiveAPI.inventory.getSerialNumbers(params);

      if (response.success && response.data) {
        const serialData = response.data.serial_numbers || response.data.data || [];
        // Ensure serialData is an array
        const safeSerialData = Array.isArray(serialData) ? serialData : [];
        setSerials(safeSerialData);
        setTotalSerials(response.data.pagination?.total || response.pagination?.total || safeSerialData.length || 0);
        setTotalPages(response.data.pagination?.pages || response.pagination?.pages || 1);

        const stats: SerialStats = {
          total_serials: response.data.pagination?.total || response.pagination?.total || safeSerialData.length || 0,
          available_serials: safeSerialData.filter((s: any) => s.status === 'available' || s.status === 'active').length,
          sold_serials: safeSerialData.filter((s: any) => s.status === 'sold').length,
          returned_serials: safeSerialData.filter((s: any) => s.status === 'returned').length,
          damaged_serials: safeSerialData.filter((s: any) => s.status === 'damaged').length,
          stolen_serials: safeSerialData.filter((s: any) => s.status === 'stolen').length,
          recalled_serials: safeSerialData.filter((s: any) => s.status === 'recalled').length,
          total_value: safeSerialData.reduce((sum: number, s: any) => sum + (s.purchase_price || 0), 0),
          sold_value: safeSerialData.filter((s: any) => s.status === 'sold').reduce((sum: number, s: any) => sum + (s.sale_price || 0), 0),
          available_value: safeSerialData.filter((s: any) => (s.status === 'available' || s.status === 'active')).reduce((sum: number, s: any) => sum + (s.purchase_price || 0), 0)
        };
        setSerialStats(stats);
      } else {
        setSerials([]);
        setSerialStats({
          total_serials: 0,
          available_serials: 0,
          sold_serials: 0,
          returned_serials: 0,
          damaged_serials: 0,
          stolen_serials: 0,
          recalled_serials: 0,
          total_value: 0,
          sold_value: 0,
          available_value: 0
        });
        setTotalSerials(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Serial numbers loading failed:', error);
      setSerials([]);
      setSerialStats({
        total_serials: 0,
        available_serials: 0,
        sold_serials: 0,
        returned_serials: 0,
        damaged_serials: 0,
        stolen_serials: 0,
        recalled_serials: 0,
        total_value: 0,
        sold_value: 0,
        available_value: 0
      });
      setTotalSerials(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'available':
        return { label: 'Có sẵn', color: 'green', icon: <CheckCircle className="w-4 h-4" /> };
      case 'sold':
        return { label: 'Đã bán', color: 'blue', icon: <Package className="w-4 h-4" /> };
      case 'returned':
        return { label: 'Trả lại', color: 'orange', icon: <RefreshCw className="w-4 h-4" /> };
      case 'damaged':
        return { label: 'Hỏng', color: 'red', icon: <XCircle className="w-4 h-4" /> };
      case 'stolen':
        return { label: 'Mất cắp', color: 'red', icon: <AlertTriangle className="w-4 h-4" /> };
      case 'recalled':
        return { label: 'Thu hồi', color: 'purple', icon: <Shield className="w-4 h-4" /> };
      default:
        return { label: status, color: 'gray', icon: <Hash className="w-4 h-4" /> };
    }
  };

  const getConditionDisplay = (condition: string) => {
    switch (condition) {
      case 'new':
        return { label: 'Mới', color: 'green' };
      case 'used':
        return { label: 'Đã sử dụng', color: 'yellow' };
      case 'refurbished':
        return { label: 'Tân trang', color: 'blue' };
      case 'damaged':
        return { label: 'Hỏng', color: 'red' };
      default:
        return { label: condition, color: 'gray' };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép vào clipboard');
  };

  // Serial table columns
  const serialColumns: Column<SerialNumber>[] = [
    {
      key: 'select',
      title: '',
      render: (_, record) => (
        <input
          type="checkbox"
          checked={selectedSerials.includes(record.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedSerials([...selectedSerials, record.id]);
            } else {
              setSelectedSerials(selectedSerials.filter(id => id !== record.id));
            }
          }}
          className="rounded border-gray-300"
        />
      )
    },
    {
      key: 'product_name',
      title: 'Sản phẩm',
      sortable: true,
      render: (value: string, record: SerialNumber) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">
              S/N: {record.serial_number}
            </div>
            {record.batch_number && (
              <div className="text-xs text-gray-400">Batch: {record.batch_number}</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'serial_number',
      title: 'Số Serial',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <span className="font-mono text-sm text-gray-900">{value}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => copyToClipboard(value)}
            className="p-1 h-6 w-6"
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Trạng thái',
      sortable: true,
      render: (value: string) => {
        const statusConfig = getStatusDisplay(value);
        return (
          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-${statusConfig.color}-100 text-${statusConfig.color}-800`}>
            {statusConfig.icon}
            <span className="ml-1">{statusConfig.label}</span>
          </span>
        );
      }
    },
    {
      key: 'condition',
      title: 'Tình trạng',
      sortable: true,
      render: (value: string) => {
        const conditionConfig = getConditionDisplay(value);
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            {conditionConfig.label}
          </span>
        );
      }
    },
    {
      key: 'supplier_name',
      title: 'Nhà cung cấp',
      sortable: true,
      render: (value: string) => (
        <div className="text-sm text-gray-900">
          {value || 'Chưa cập nhật'}
        </div>
      )
    },
    {
      key: 'purchase_price',
      title: 'Giá mua',
      sortable: true,
      align: 'right',
      render: (value: number) => (
        <div className="text-sm font-medium text-gray-900">
          {formatCurrency(value)}
        </div>
      )
    },
    {
      key: 'sale_price',
      title: 'Giá bán',
      sortable: true,
      align: 'right',
      render: (value: number) => (
        <div className="text-sm">
          {value ? (
            <span className="font-medium text-green-600">
              {formatCurrency(value)}
            </span>
          ) : (
            <span className="text-gray-400">Chưa bán</span>
          )}
        </div>
      )
    },
    {
      key: 'location',
      title: 'Vị trí',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center text-sm text-gray-600">
          <Store className="w-4 h-4 mr-1" />
          {value}
        </div>
      )
    },
    {
      key: 'id' as keyof SerialNumber,
      title: 'Thao tác',
      align: 'center',
      render: (_: any, record: SerialNumber) => (
        <div className="flex items-center justify-center space-x-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleViewSerial(record)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEditSerial(record)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handlePrintLabel(record)}
            className="text-blue-600 hover:text-blue-700"
          >
            <Printer className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeleteId(record.id)}
            className="text-red-600 hover:text-red-700"
          >
            <XCircle className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  // Event handlers
  const handleViewSerial = (serial: SerialNumber) => {
    setSelectedSerial(serial);
    setShowSerialModal(true);
  };

  const handleEditSerial = (serial: SerialNumber) => {
    setSerialForm(serial);
    setShowSerialModal(true);
  };

  const handleCreateSerial = () => {
    setSerialForm({});
    setShowSerialModal(true);
  };

  const handleBulkImport = () => {
    toast.success('Tính năng nhập hàng loạt đang phát triển');
  };

  const generateQRCode = async (text: string): Promise<string> => {
    try {
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, text, { width: 100, margin: 1 });
      return canvas.toDataURL();
    } catch (error) {
      console.error('QR Code generation failed:', error);
      return '';
    }
  };

  const handlePrintLabel = async (serial: SerialNumber) => {
    try {
      const doc = new jsPDF();
      const qrData = await generateQRCode(serial.serial_number);
      
      // Label dimensions (80mm x 50mm)
      const labelWidth = 80;
      const labelHeight = 50;
      
      // Add QR code
      if (qrData) {
        doc.addImage(qrData, 'PNG', 5, 5, 20, 20);
      }
      
      // Add serial number
      doc.setFontSize(12);
      doc.text('Serial: ' + serial.serial_number, 30, 15);
      
      // Add product info
      const product = products.find(p => p.id === serial.product_id);
      if (product) {
        doc.setFontSize(10);
        doc.text('Product: ' + product.name, 30, 25);
        if (product.sku) {
          doc.text('SKU: ' + product.sku, 30, 35);
        }
      }
      
      // Add status
      doc.setFontSize(8);
      doc.text('Status: ' + serial.status, 30, 45);
      
      doc.save('serial-label-' + serial.serial_number + '.pdf');
      toast.success('Nhãn đã được tạo thành công');
    } catch (error) {
      console.error('Label generation failed:', error);
      toast.error('Lỗi tạo nhãn');
    }
  };

  const handleBatchPrintLabels = async () => {
    if (selectedSerials.length === 0) {
      toast.error('Vui lòng chọn ít nhất một serial để in');
      return;
    }

    try {
      const doc = new jsPDF();
      const labelsPerPage = 4;
      let currentPage = 0;
      let labelIndex = 0;

      for (const serialId of selectedSerials) {
        const serial = serials.find(s => s.id === serialId);
        if (!serial) continue;

        const qrData = await generateQRCode(serial.serial_number);
        
        // Calculate position
        const row = Math.floor(labelIndex / 2);
        const col = labelIndex % 2;
        const x = col * 100 + 10;
        const y = row * 60 + 10;

        // Add QR code
        if (qrData) {
          doc.addImage(qrData, 'PNG', x, y, 15, 15);
        }
        
        // Add text
        doc.setFontSize(10);
        doc.text('Serial: ' + serial.serial_number, x + 20, y + 10);
        
        const product = products.find(p => p.id === serial.product_id);
        if (product) {
          doc.setFontSize(8);
          doc.text('Product: ' + product.name, x + 20, y + 18);
          if (product.sku) {
            doc.text('SKU: ' + product.sku, x + 20, y + 26);
          }
        }
        
        doc.setFontSize(7);
        doc.text('Status: ' + serial.status, x + 20, y + 34);

        labelIndex++;
        
        // Add new page if needed
        if (labelIndex % labelsPerPage === 0 && labelIndex < selectedSerials.length) {
          doc.addPage();
          labelIndex = 0;
        }
      }

      doc.save('batch-serial-labels-' + selectedSerials.length + '.pdf');
      toast.success('Đã tạo ' + selectedSerials.length + ' nhãn thành công');
      setSelectedSerials([]);
    } catch (error) {
      console.error('Batch label generation failed:', error);
      toast.error('Lỗi tạo nhãn hàng loạt');
    }
  };

  const filteredSerials = serials.filter(serial => {
    const matchesSearch = serial.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         serial.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (serial.batch_number && serial.batch_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (serial.supplier_name && serial.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || serial.status === statusFilter;
    const matchesCondition = conditionFilter === 'all' || serial.condition === conditionFilter;
    const matchesSupplier = true; // supplierFilter === 'all' || serial.supplier_id === supplierFilter;
    
    return matchesSearch && matchesStatus && matchesCondition && matchesSupplier;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải dữ liệu số serial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Hash className="w-8 h-8 mr-3 text-blue-600" />
            Quản lý số serial
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý toàn diện số serial sản phẩm và theo dõi trạng thái
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleBulkImport}>
            <Upload className="w-4 h-4 mr-2" />
            Nhập hàng loạt
          </Button>
          <Button variant="outline" onClick={() => {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (advancedFilters.productId) params.append('product_id', advancedFilters.productId);
            if (advancedFilters.purchaseDateFrom) params.append('purchase_date_from', advancedFilters.purchaseDateFrom);
            if (advancedFilters.purchaseDateTo) params.append('purchase_date_to', advancedFilters.purchaseDateTo);
            if (advancedFilters.saleDateFrom) params.append('sale_date_from', advancedFilters.saleDateFrom);
            if (advancedFilters.saleDateTo) params.append('sale_date_to', advancedFilters.saleDateTo);
            
            const url = API_V1_BASE_URL + '/serial-numbers/export?format=csv&' + params.toString();
            window.open(url, '_blank');
          }}>
            <Download className="w-4 h-4 mr-2" />
            Xuất CSV
          </Button>
          <Button onClick={handleCreateSerial}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm số serial
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng số serial</p>
                <p className="text-3xl font-bold text-gray-900">{serialStats.total || 0}</p>
                <p className="text-sm text-blue-600">{formatCurrency(serialStats.total_value)}</p>
              </div>
              <Hash className="w-12 h-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Còn sẵn</p>
                <p className="text-3xl font-bold text-gray-900">{serialStats.available || 0}</p>
                <p className="text-sm text-green-600">
                  {formatCurrency(serialStats.available_value)}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đã bán</p>
                <p className="text-3xl font-bold text-gray-900">{serialStats.sold || 0}</p>
                <p className="text-sm text-blue-600">{formatCurrency(serialStats.sold_value)}</p>
              </div>
              <Package className="w-12 h-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Có vấn đề</p>
                <p className="text-3xl font-bold text-gray-900">
                  {serialStats.returned_serials + serialStats.damaged_serials + serialStats.stolen_serials + serialStats.recalled_serials}
                </p>
                <p className="text-sm text-red-600">
                  Cần xử lý
                </p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {[
            { id: 'all', label: 'Tất cả', icon: Hash },
            { id: 'available', label: 'Có sẵn', icon: CheckCircle },
            { id: 'sold', label: 'Đã bán', icon: Package },
            { id: 'returned', label: 'Trả lại', icon: RefreshCw },
            { id: 'damaged', label: 'Hỏng', icon: XCircle },
            { id: 'stolen', label: 'Mất cắp', icon: AlertTriangle },
            { id: 'recalled', label: 'Thu hồi', icon: Shield }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={'flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ' + (
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm số serial..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent "
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <span>Bộ lọc nâng cao</span>
              </Button>
              
              {selectedSerials.length > 0 && (
                <Button
                  onClick={handleBatchPrintLabels}
                  className="bg-green-600 hover:bg-green-700 text-white">
                  <Printer className="w-4 h-4 mr-2" />
                  In {selectedSerials.length} nhãn
                </Button>
              )}
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                <option value="all">Tất cả trạng thái</option>
                <option value="available">Có sẵn</option>
                <option value="sold">Đã bán</option>
                <option value="returned">Trả lại</option>
                <option value="damaged">Hỏng</option>
                <option value="stolen">Mất cắp</option>
                <option value="recalled">Thu hồi</option>
              </select>
              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                <option value="all">Tất cả tình trạng</option>
                <option value="new">Mới</option>
                <option value="used">Đã sử dụng</option>
                <option value="refurbished">Tân trang</option>
                <option value="damaged">Hỏng</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                <option value="created_at">Ngày tạo</option>
                <option value="serial_number">Số serial</option>
                <option value="product_name">Tên sản phẩm</option>
                <option value="purchase_price">Giá mua</option>
                <option value="status">Trạng thái</option>
              </select>
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold mb-4">Bộ lọc nâng cao</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sản phẩm</label>
                  <select
                    value={advancedFilters.productId}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, productId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">Tất cả sản phẩm</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} {p.sku ? '(' + p.sku + ')' : ''}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày mua từ</label>
                  <input
                    type="date"
                    value={advancedFilters.purchaseDateFrom}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, purchaseDateFrom: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày mua đến</label>
                  <input
                    type="date"
                    value={advancedFilters.purchaseDateTo}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, purchaseDateTo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bán từ</label>
                  <input
                    type="date"
                    value={advancedFilters.saleDateFrom}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, saleDateFrom: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bán đến</label>
                  <input
                    type="date"
                    value={advancedFilters.saleDateTo}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, saleDateTo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                
              <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => setAdvancedFilters({
                      productId: '',
                      purchaseDateFrom: '',
                      purchaseDateTo: '',
                      saleDateFrom: '',
                      saleDateTo: ''
                    })}
                    className="w-full">Xóa bộ lọc</Button>
                </div>
              </div>
            </div>
          )}

          {/* Serial Table */}
          <DataTable
            data={filteredSerials}
            columns={serialColumns}
            searchable={false}
            pagination
            pageSize={20}
            className="border-0"/>
        </div>
      </div>

      {/* Serial Modal */}
      <AnimatePresence>
        {showSerialModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowSerialModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900">
                  {selectedSerial ? 'Chi tiết số serial' : 'Thêm số serial mới'}
                </h3>
              </div>
              
              <div className="p-6">
                {selectedSerial ? (
                  // Serial Details View
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                      <div className="text-center">
                        <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-4xl mx-auto mb-4">
                          <Hash className="w-16 h-16" />
                        </div>
                        <h4 className="text-xl font-bold text-gray-900">
                          {selectedSerial.product_name}
                        </h4>
                        <p className="text-gray-600 font-mono">
                          S/N: {selectedSerial.serial_number}
                        </p>
                        {selectedSerial.batch_number && (
                          <p className="text-sm text-gray-500">
                            Batch: {selectedSerial.batch_number}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="lg:col-span-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Trạng thái
                          </label>
                          <div className="flex items-center">
                            {(() => {
                              const statusConfig = getStatusDisplay(selectedSerial.status);
                              return (
                                <span className={"inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-" + statusConfig.color + "-100 text-" + statusConfig.color + "-800"}>
                                  {statusConfig.icon}
                                  <span className="ml-1">{statusConfig.label}</span>
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tình trạng
                          </label>
                          <div className="flex items-center">
                            {(() => {
                              const conditionConfig = getConditionDisplay(selectedSerial.condition);
                              return (
                                <span className={"inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-" + conditionConfig.color + "-100 text-" + conditionConfig.color + "-800"}>
                                  {conditionConfig.label}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nhà cung cấp
                          </label>
                          <p className="flex items-center text-gray-900">
                            <User className="w-4 h-4 mr-2 text-gray-400" />
                            {selectedSerial.supplier_name || 'Chưa cập nhật'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Vị trí
                          </label>
                          <p className="flex items-center text-gray-900">
                            <Store className="w-4 h-4 mr-2 text-gray-400" />
                            {selectedSerial.location}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Giá mua
                          </label>
                          <p className="text-gray-900 font-medium">
                            {formatCurrency(selectedSerial.purchase_price)}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Giá bán
                          </label>
                          <p className="text-gray-900 font-medium">
                            {selectedSerial.sale_price ? formatCurrency(selectedSerial.sale_price) : 'Chưa bán'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ngày mua
                          </label>
                          <p className="flex items-center text-gray-900">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            {formatDate(selectedSerial.purchase_date)}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ngày bán
                          </label>
                          <p className="flex items-center text-gray-900">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            {selectedSerial.sale_date ? formatDate(selectedSerial.sale_date) : 'Chưa bán'}
                          </p>
                        </div>
                        {selectedSerial.customer_name && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Khách hàng
                            </label>
                            <p className="text-gray-900">
                              {selectedSerial.customer_name}
                            </p>
                          </div>
                        )}
                        {selectedSerial.warranty_end_date && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Bảo hành đến
                            </label>
                            <p className="flex items-center text-gray-900">
                              <Shield className="w-4 h-4 mr-2 text-gray-400" />
                              {formatDate(selectedSerial.warranty_end_date)}
                            </p>
                          </div>
                        )}
                      </div>
                      {selectedSerial.notes && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ghi chú
                          </label>
                          <p className="text-gray-900  bg-gray-50 p-3 rounded-lg">
                            {selectedSerial.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Serial Form
                  <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sản phẩm *
                      </label>
                      <select
                        value={(serialForm as any).product_id || ''}
                        onChange={(e) => setSerialForm({ ...serialForm, product_id: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                        <option value="">Chọn sản phẩm</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} {p.sku ? '(' + p.sku + ')' : ''}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tên sản phẩm *
                      </label>
                      <input
                        type="text"
                        value={serialForm.product_name || ''}
                        onChange={(e) => setSerialForm({...serialForm, product_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 "
                        placeholder="Nhập tên sản phẩm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số serial *
                      </label>
                      <input
                        type="text"
                        value={serialForm.serial_number || ''}
                        onChange={(e) => setSerialForm({...serialForm, serial_number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500  font-mono"
                        placeholder="Nhập số serial"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số batch
                      </label>
                      <input
                        type="text"
                        value={serialForm.batch_number || ''}
                        onChange={(e) => setSerialForm({...serialForm, batch_number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 "
                        placeholder="Nhập số batch"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nhà cung cấp
                      </label>
                      <input
                        type="text"
                        value={serialForm.supplier_name || ''}
                        onChange={(e) => setSerialForm({...serialForm, supplier_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 "
                        placeholder="Nhập tên nhà cung cấp"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giá mua *
                      </label>
                      <input
                        type="number"
                        value={serialForm.purchase_price || ''}
                        onChange={(e) => setSerialForm({...serialForm, purchase_price: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 "
                        placeholder="Nhập giá mua"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ngày mua *
                      </label>
                      <input
                        type="date"
                        value={serialForm.purchase_date || ''}
                        onChange={(e) => setSerialForm({...serialForm, purchase_date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 "
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Trạng thái *
                      </label>
                      <select
                        value={serialForm.status || ''}
                        onChange={(e) => setSerialForm({...serialForm, status: e.target.value as any})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                        <option value="">Chọn trạng thái</option>
                        <option value="available">Có sẵn</option>
                        <option value="sold">Đã bán</option>
                        <option value="returned">Trả lại</option>
                        <option value="damaged">Hỏng</option>
                        <option value="stolen">Mất cắp</option>
                        <option value="recalled">Thu hồi</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tình trạng *
                      </label>
                      <select
                        value={serialForm.condition || ''}
                        onChange={(e) => setSerialForm({...serialForm, condition: e.target.value as any})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                        <option value="">Chọn tình trạng</option>
                        <option value="new">Mới</option>
                        <option value="used">Đã sử dụng</option>
                        <option value="refurbished">Tân trang</option>
                        <option value="damaged">Hỏng</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vị trí *
                      </label>
                      <input
                        type="text"
                        value={serialForm.location || ''}
                        onChange={(e) => setSerialForm({...serialForm, location: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 "
                        placeholder="Nhập vị trí lưu trữ"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ghi chú
                      </label>
                      <textarea
                        value={serialForm.notes || ''}
                        onChange={(e) => setSerialForm({...serialForm, notes: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 "
                        placeholder="Nhập ghi chú"
                      />
                    </div>
                  </form>
                )}
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSerialModal(false);
                    setSelectedSerial(null);
                  }}
                >
                  Hủy
                </Button>
                {!selectedSerial && (
                  <Button onClick={async () => {
                    try {
                      // Validate required
                      if (!(serialForm as any).product_id || !serialForm.serial_number) {
                        toast.error('Vui lòng nhập Product ID và Số serial');
                        return;
                      }
                      const payload: any = {
                        product_id: (serialForm as any).product_id,
                        serial_number: serialForm.serial_number,
                        purchase_date: serialForm.purchase_date,
                        customer_id: (serialForm as any).customer_id,
                        notes: serialForm.notes
                      };
                      const res = await comprehensiveAPI.inventory.createSerialNumber(payload);
                      if (res.success) {
                        toast.success('Tạo số serial thành công');
                        setShowSerialModal(false);
                        setSerialForm({});
                        await loadSerialData();
                      } else {
                        toast.error(res.error || 'Tạo số serial thất bại');
                      }
                    } catch (e: any) {
                      toast.error(e?.response?.data?.message || e.message || 'Lỗi tạo số serial');
                    }
                  }}>
                    Tạo số serial
                  </Button>
                )}
                {selectedSerial && (
                  <Button onClick={async () => {
                    try {
                      if (!selectedSerial?.id) {
                        toast.error('Thiếu ID số serial');
                        return;
                      }
                      const update: any = {};
                      if ((serialForm as any).product_id) update.product_id = (serialForm as any).product_id;
                      if (serialForm.serial_number) update.serial_number = serialForm.serial_number;
                      if ((serialForm as any).status) update.status = (serialForm as any).status;
                      if (serialForm.purchase_date) update.purchase_date = serialForm.purchase_date as any;
                      if ((serialForm as any).warranty_start_date) update.warranty_start_date = (serialForm as any).warranty_start_date;
                      if ((serialForm as any).warranty_end_date) update.warranty_end_date = (serialForm as any).warranty_end_date;
                      if (serialForm.notes !== undefined) update.notes = serialForm.notes;

                      const res = await comprehensiveAPI.inventory.updateSerialNumber(selectedSerial.id, update);
                      if (res.success) {
                        toast.success('Cập nhật số serial thành công');
                        setShowSerialModal(false);
                        setSelectedSerial(null);
                        await loadSerialData();
                      } else {
                        toast.error(res.error || 'Cập nhật số serial thất bại');
                      }
                    } catch (e: any) {
                      toast.error(e?.response?.data?.message || e.message || 'Lỗi cập nhật số serial');
                    }
                  }}>
                    Cập nhật
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Xác nhận xóa số serial</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-700">Bạn có chắc chắn muốn xóa số serial này? Hành động không thể hoàn tác.</p>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setDeleteId(null)}>Hủy</Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={async () => {
                  try {
                    const res = await comprehensiveAPI.inventory.deleteSerialNumber(deleteId);
                    if (res.success) {
                      toast.success('Xóa số serial thành công');
                      setDeleteId(null);
                      await loadSerialData();
                    } else {
                      toast.error(res.error || 'Xóa số serial thất bại');
                    }
                  } catch (e: any) {
                    toast.error(e?.response?.data?.message || e.message || 'Lỗi xóa số serial');
                  }
                }}>Xóa</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SerialNumberManagement;
