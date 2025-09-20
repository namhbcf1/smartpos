// QR Code Warranty Lookup System
// Generate, manage QR codes for products and allow customer warranty lookup

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode,
  Plus,
  Search,
  Download,
  Printer,
  Eye,
  Edit,
  Copy,
  ExternalLink,
  Package,
  Calendar,
  Shield,
  User,
  Phone,
  Mail,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Smartphone,
  FileText,
  Settings,
  Filter,
  Grid,
  List,
  Upload
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/ButtonSimplified';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';
import QRCodeCanvas from 'qrcode';

interface WarrantyQR {
  id: string;
  warranty_id: string;
  product_id: string;
  product_name: string;
  product_serial: string;
  customer_name: string;
  customer_phone: string;
  qr_code_data: string;
  qr_code_url: string;
  public_lookup_url: string;
  generated_date: string;
  printed_count: number;
  scan_count: number;
  last_scanned: string | null;
  status: 'active' | 'inactive' | 'expired';
  warranty_start_date: string;
  warranty_end_date: string;
  warranty_status: 'active' | 'expired' | 'void';
}

interface QRTemplate {
  id: string;
  name: string;
  size: string;
  format: 'sticker' | 'card' | 'label';
  dimensions: {
    width: number;
    height: number;
  };
  includes_logo: boolean;
  includes_text: boolean;
  preview_url: string;
}

const WarrantyQRCode: React.FC = () => {
  const [qrCodes, setQrCodes] = useState<WarrantyQR[]>([]);
  const [templates, setTemplates] = useState<QRTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedQR, setSelectedQR] = useState<WarrantyQR | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [generatedQRCode, setGeneratedQRCode] = useState<string>('');
  const [lookupCode, setLookupCode] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadQRCodes();
    loadTemplates();
  }, []);

  const loadQRCodes = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration
      const mockQRCodes: WarrantyQR[] = [
        {
          id: 'QR_001',
          warranty_id: 'WAR_001',
          product_id: 'prod-001',
          product_name: 'Laptop Dell Inspiron 15',
          product_serial: 'DL123456789',
          customer_name: 'Nguyễn Văn An',
          customer_phone: '0901234567',
          qr_code_data: JSON.stringify({
            warranty_id: 'WAR_001',
            product_serial: 'DL123456789',
            lookup_url: 'https://namhbcf-uk.pages.dev/warranty-lookup'
          }),
          qr_code_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAIAAAD2HxkiAAAABmJLR0QA/wD/AP+gvaeTAAAF...',
          public_lookup_url: 'https://namhbcf-uk.pages.dev/warranty-lookup?code=WAR_001',
          generated_date: new Date(Date.now() - 86400000 * 5).toISOString(),
          printed_count: 3,
          scan_count: 12,
          last_scanned: new Date(Date.now() - 86400000 * 1).toISOString(),
          status: 'active',
          warranty_start_date: new Date(Date.now() - 86400000 * 30).toISOString(),
          warranty_end_date: new Date(Date.now() + 86400000 * 335).toISOString(),
          warranty_status: 'active'
        },
        {
          id: 'QR_002',
          warranty_id: 'WAR_002',
          product_id: 'prod-002',
          product_name: 'Máy tính HP Pavilion',
          product_serial: 'HP987654321',
          customer_name: 'Trần Thị Bình',
          customer_phone: '0912345678',
          qr_code_data: JSON.stringify({
            warranty_id: 'WAR_002',
            product_serial: 'HP987654321',
            lookup_url: 'https://namhbcf-uk.pages.dev/warranty-lookup'
          }),
          qr_code_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAIAAAD2HxkiAAAABmJLR0QA/wD/AP+gvaeTAAAF...',
          public_lookup_url: 'https://namhbcf-uk.pages.dev/warranty-lookup?code=WAR_002',
          generated_date: new Date(Date.now() - 86400000 * 3).toISOString(),
          printed_count: 1,
          scan_count: 5,
          last_scanned: new Date(Date.now() - 86400000 * 2).toISOString(),
          status: 'active',
          warranty_start_date: new Date(Date.now() - 86400000 * 60).toISOString(),
          warranty_end_date: new Date(Date.now() + 86400000 * 305).toISOString(),
          warranty_status: 'active'
        },
        {
          id: 'QR_003',
          warranty_id: 'WAR_003',
          product_id: 'prod-003',
          product_name: 'Máy in Canon PIXMA',
          product_serial: 'CN456789123',
          customer_name: 'Lê Văn Cường',
          customer_phone: '0923456789',
          qr_code_data: JSON.stringify({
            warranty_id: 'WAR_003',
            product_serial: 'CN456789123',
            lookup_url: 'https://namhbcf-uk.pages.dev/warranty-lookup'
          }),
          qr_code_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAIAAAD2HxkiAAAABmJLR0QA/wD/AP+gvaeTAAAF...',
          public_lookup_url: 'https://namhbcf-uk.pages.dev/warranty-lookup?code=WAR_003',
          generated_date: new Date(Date.now() - 86400000 * 10).toISOString(),
          printed_count: 2,
          scan_count: 0,
          last_scanned: null,
          status: 'active',
          warranty_start_date: new Date(Date.now() - 86400000 * 90).toISOString(),
          warranty_end_date: new Date(Date.now() - 86400000 * 5).toISOString(),
          warranty_status: 'expired'
        }
      ];

      setQrCodes(mockQRCodes);
    } catch (error) {
      console.error('Failed to load QR codes:', error);
      toast.error('Không thể tải danh sách QR code');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = () => {
    const mockTemplates: QRTemplate[] = [
      {
        id: 'template_sticker_small',
        name: 'Tem dán nhỏ',
        size: '25x25mm',
        format: 'sticker',
        dimensions: { width: 25, height: 25 },
        includes_logo: true,
        includes_text: false,
        preview_url: '/templates/sticker_small.png'
      },
      {
        id: 'template_sticker_medium',
        name: 'Tem dán vừa',
        size: '40x40mm',
        format: 'sticker',
        dimensions: { width: 40, height: 40 },
        includes_logo: true,
        includes_text: true,
        preview_url: '/templates/sticker_medium.png'
      },
      {
        id: 'template_card',
        name: 'Thẻ bảo hành',
        size: '85x54mm',
        format: 'card',
        dimensions: { width: 85, height: 54 },
        includes_logo: true,
        includes_text: true,
        preview_url: '/templates/warranty_card.png'
      },
      {
        id: 'template_label',
        name: 'Nhãn dán',
        size: '60x30mm',
        format: 'label',
        dimensions: { width: 60, height: 30 },
        includes_logo: true,
        includes_text: true,
        preview_url: '/templates/warranty_label.png'
      }
    ];
    setTemplates(mockTemplates);
  };

  const generateQRCode = async (data: string) => {
    try {
      const qrDataUrl = await QRCodeCanvas.toDataURL(data, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrDataUrl;
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      throw error;
    }
  };

  const handleGenerateQR = async (warrantyId: string) => {
    try {
      const qrData = JSON.stringify({
        warranty_id: warrantyId,
        lookup_url: `https://namhbcf-uk.pages.dev/warranty-lookup?code=${warrantyId}`
      });
      
      const qrCodeUrl = await generateQRCode(qrData);
      setGeneratedQRCode(qrCodeUrl);
      
      toast.success('QR code đã được tạo thành công');
    } catch (error) {
      toast.error('Không thể tạo QR code');
    }
  };

  const handleDownloadQR = (qrCode: WarrantyQR) => {
    const link = document.createElement('a');
    link.download = `warranty_qr_${qrCode.warranty_id}.png`;
    link.href = qrCode.qr_code_url;
    link.click();
    toast.success('QR code đã được tải xuống');
  };

  const handlePrintQR = (qrCode: WarrantyQR) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>In QR Code - ${qrCode.warranty_id}</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
              .qr-container { border: 1px solid #ccc; padding: 20px; margin: 20px auto; width: 300px; }
              .qr-code { margin: 20px 0; }
              .info { font-size: 14px; margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <h3>Mã QR Bảo Hành</h3>
              <div class="info">Sản phẩm: ${qrCode.product_name}</div>
              <div class="info">Serial: ${qrCode.product_serial}</div>
              <div class="qr-code">
                <img src="${qrCode.qr_code_url}" alt="QR Code" style="width: 200px; height: 200px;" />
              </div>
              <div class="info">Mã bảo hành: ${qrCode.warranty_id}</div>
              <div class="info">Quét để tra cứu thông tin bảo hành</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleCopyQRLink = (qrCode: WarrantyQR) => {
    navigator.clipboard.writeText(qrCode.public_lookup_url);
    toast.success('Đã sao chép link tra cứu');
  };

  const handleLookupWarranty = async () => {
    if (!lookupCode.trim()) {
      toast.error('Vui lòng nhập mã bảo hành hoặc serial');
      return;
    }

    setLoading(true);
    try {
      // Mock lookup - in real app, call API
      const foundQR = qrCodes.find(qr => 
        qr.warranty_id === lookupCode || 
        qr.product_serial === lookupCode ||
        qr.id === lookupCode
      );

      if (foundQR) {
        setLookupResult({
          warranty_id: foundQR.warranty_id,
          product_name: foundQR.product_name,
          product_serial: foundQR.product_serial,
          customer_name: foundQR.customer_name,
          warranty_start_date: foundQR.warranty_start_date,
          warranty_end_date: foundQR.warranty_end_date,
          warranty_status: foundQR.warranty_status,
          service_center: 'Trung tâm bảo hành TP.HCM',
          service_phone: '028 1234 5678'
        });
      } else {
        setLookupResult(null);
        toast.error('Không tìm thấy thông tin bảo hành');
      }
    } catch (error) {
      toast.error('Lỗi tra cứu bảo hành');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getWarrantyStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'expired': return 'text-red-600';
      case 'void': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const filteredQRCodes = qrCodes.filter(qr => {
    const matchesSearch = 
      qr.warranty_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qr.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qr.product_serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qr.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || qr.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-xl">
            <QrCode className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              QR Code tra cứu bảo hành
            </h1>
            <p className="text-gray-600">
              Tạo, quản lý QR code cho sản phẩm và cho phép khách hàng tra cứu bảo hành
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowLookupModal(true)}>
            <Search className="w-4 h-4 mr-2" />
            Tra cứu
          </Button>
          <Button onClick={() => setShowGenerateModal(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Tạo QR Code
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tổng QR Code', value: qrCodes.length, color: 'bg-purple-500', icon: QrCode },
          { label: 'Đang hoạt động', value: qrCodes.filter(qr => qr.status === 'active').length, color: 'bg-green-500', icon: CheckCircle },
          { label: 'Tổng lượt quét', value: qrCodes.reduce((sum, qr) => sum + qr.scan_count, 0), color: 'bg-blue-500', icon: Smartphone },
          { label: 'Đã in', value: qrCodes.reduce((sum, qr) => sum + qr.printed_count, 0), color: 'bg-orange-500', icon: Printer }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-2 ${stat.color} rounded-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters and View Controls */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            <div className="flex-1 flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm QR code, sản phẩm, khách hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Không hoạt động</option>
                <option value="expired">Hết hạn</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Codes Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQRCodes.map((qr, index) => (
            <motion.div
              key={qr.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  {/* QR Code Image */}
                  <div className="text-center mb-4">
                    <div className="inline-block p-4 bg-white rounded-lg border border-gray-200">
                      <div className="w-32 h-32 bg-gray-100 rounded flex items-center justify-center">
                        <QrCode className="w-16 h-16 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="text-center mb-4">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {qr.product_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Serial: {qr.product_serial}
                    </p>
                    <p className="text-sm text-gray-600">
                      Mã BH: {qr.warranty_id}
                    </p>
                  </div>

                  {/* Status and Stats */}
                  <div className="flex justify-between items-center mb-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(qr.status)}`}>
                      {qr.status === 'active' ? 'Hoạt động' : 
                       qr.status === 'inactive' ? 'Không hoạt động' : 'Hết hạn'}
                    </span>
                    <span className={`text-sm font-medium ${getWarrantyStatusColor(qr.warranty_status)}`}>
                      {qr.warranty_status === 'active' ? 'Còn BH' :
                       qr.warranty_status === 'expired' ? 'Hết BH' : 'Vô hiệu'}
                    </span>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-4 text-center">
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-lg font-bold text-gray-900">{qrCode.scans || 0}</p>
                      <p className="text-xs text-gray-600">Lượt quét</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-lg font-bold text-gray-900">{formatDate(qrCode.created_at)}</p>
                      <p className="text-xs text-gray-600">Ngày tạo</p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="border-t border-gray-200 pt-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{qr.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <Phone className="w-4 h-4" />
                      <span>{qr.customer_phone}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDownloadQR(qr)}>
                      <Download className="w-4 h-4 mr-1" />
                      Tải
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handlePrintQR(qr)}>
                      <Printer className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleCopyQRLink(qr)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSelectedQR(qr)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      QR Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sản phẩm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Khách hàng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thống kê
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredQRCodes.map((qr) => (
                    <tr key={qr.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                            <QrCode className="w-6 h-6 text-gray-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {qr.warranty_id}
                            </div>
                            <div className="text-sm text-gray-500">
                              {qr.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {qr.product_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {qr.product_serial}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {qr.customer_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {qr.customer_phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(qr.status)}`}>
                            {qr.status === 'active' ? 'Hoạt động' : 
                             qr.status === 'inactive' ? 'Không hoạt động' : 'Hết hạn'}
                          </span>
                          <div className={`text-xs ${getWarrantyStatusColor(qr.warranty_status)}`}>
                            {qr.warranty_status === 'active' ? 'Còn bảo hành' :
                             qr.warranty_status === 'expired' ? 'Hết bảo hành' : 'Vô hiệu'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="text-gray-900">
                            {qr.scan_count} lượt quét
                          </div>
                          <div className="text-gray-500">
                            {qr.printed_count} lần in
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(qr.generated_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleDownloadQR(qr)}>
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handlePrintQR(qr)}>
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleCopyQRLink(qr)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setSelectedQR(qr)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate QR Modal */}
      <AnimatePresence>
        {showGenerateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  Tạo QR Code bảo hành
                </h2>
                <Button variant="ghost" onClick={() => setShowGenerateModal(false)}>
                  <XCircle className="w-6 h-6" />
                </Button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Form */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Thông tin bảo hành
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mã bảo hành
                        </label>
                        <input
                          type="text"
                          placeholder="VD: WAR_001"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tên sản phẩm
                        </label>
                        <input
                          type="text"
                          placeholder="VD: Laptop Dell Inspiron 15"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Serial sản phẩm
                        </label>
                        <input
                          type="text"
                          placeholder="VD: DL123456789"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Template in
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ">
                          {templates.map(template => (
                            <option key={template.id} value={template.id}>
                              {template.name} ({template.size})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Xem trước QR Code
                    </h3>
                    <div className="border border-gray-200 rounded-lg p-6 text-center">
                      {generatedQRCode ? (
                        <img src={generatedQRCode} alt="Generated QR Code" className="mx-auto mb-4" />
                      ) : (
                        <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                          <QrCode className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                      <Button onClick={() => handleGenerateQR('WAR_NEW_001')}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Tạo QR Code
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <Button variant="outline" onClick={() => setShowGenerateModal(false)}>
                  Hủy
                </Button>
                <Button>
                  Lưu QR Code
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lookup Modal */}
      <AnimatePresence>
        {showLookupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  Tra cứu bảo hành
                </h2>
                <Button variant="ghost" onClick={() => setShowLookupModal(false)}>
                  <XCircle className="w-6 h-6" />
                </Button>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mã bảo hành hoặc Serial sản phẩm
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={lookupCode}
                        onChange={(e) => setLookupCode(e.target.value)}
                        placeholder="Nhập mã bảo hành hoặc serial..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent "
                      />
                      <Button onClick={handleLookupWarranty} disabled={loading}>
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                        Tra cứu
                      </Button>
                    </div>
                  </div>

                  {lookupResult && (
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Thông tin bảo hành
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Mã bảo hành:</span>
                                <span className="font-medium text-gray-900">{lookupResult.warranty_code || '-'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Sản phẩm:</span>
                                <span className="font-medium text-gray-900">{lookupResult.product_name || '-'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Serial:</span>
                                <span className="font-medium text-gray-900">{lookupResult.serial_number || '-'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Hãng:</span>
                                <span className="font-medium text-gray-900">{lookupResult.brand || '-'}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Bắt đầu BH:</span>
                                <span className="font-medium text-gray-900">{lookupResult.warranty_start || '-'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Kết thúc BH:</span>
                                <span className="font-medium text-gray-900">{lookupResult.warranty_end || '-'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Trạng thái:</span>
                                <span className={`font-medium ${getWarrantyStatusColor(lookupResult.warranty_status)}`}>
                                  {lookupResult.warranty_status === 'active' ? 'Còn bảo hành' :
                                   lookupResult.warranty_status === 'expired' ? 'Hết bảo hành' : 'Vô hiệu'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Trung tâm BH:</span>
                                <span className="font-medium text-gray-900">{lookupResult.service_center || '-'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2 text-blue-800">
                            <Phone className="w-4 h-4" />
                            <span className="font-medium">Liên hệ bảo hành: {lookupResult.service_phone}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <Button variant="outline" onClick={() => setShowLookupModal(false)}>
                  Đóng
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WarrantyQRCode;
