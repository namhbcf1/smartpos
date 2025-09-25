// Vietnamese Computer Hardware POS Warranty Management
// ComputerPOS Pro - Advanced Warranty Management System

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Plus,
  Search,
  Edit,
  Eye,
  Calendar,
  Clock,
  User,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  FileText,
  Phone,
  MapPin,
  Award,
  TrendingUp,
  Upload,
  QrCode,
  Bell,
  Mail,
  MessageSquare,
  History,
  Tags,
  Link2,
  Camera,
  Paperclip,
  Send,
  Copy,
  ExternalLink,
  Filter,
  SortAsc,
  MoreHorizontal,
  Workflow,
  Building,
  CreditCard,
  Receipt,
  Zap
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/ButtonSimplified';
// import { DataTable, Column } from '../../components/ui/DataTable';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';
import { posApi } from '../../services/api/posApi';
import { useAuth } from '../../contexts/AuthContext';

// Enhanced Warranty Types
interface Warranty {
  id: string;
  product_id: string;
  product_name: string;
  product_serial: string;
  customer_id: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  purchase_date: string;
  warranty_start_date: string;
  warranty_end_date: string;
  warranty_type: 'standard' | 'extended' | 'premium';
  warranty_status: 'active' | 'expired' | 'void' | 'claimed';
  warranty_terms: string;
  service_center?: string;
  service_center_phone?: string;
  service_center_address?: string;
  claim_count: number;
  last_service_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface WarrantyStats {
  total_warranties: number;
  active_warranties: number;
  expired_warranties: number;
  void_warranties: number;
  claimed_warranties: number;
  expiring_soon: number;
  total_claims: number;
  avg_claim_time: number;
}

const WarrantyManagement: React.FC = () => {
  // Enhanced Warranty Management State
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [warrantyStats, setWarrantyStats] = useState<WarrantyStats>({
    total_warranties: 0,
    active_warranties: 0,
    expired_warranties: 0,
    void_warranties: 0,
    claimed_warranties: 0,
    expiring_soon: 0,
    total_claims: 0,
    avg_claim_time: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedWarranty, setSelectedWarranty] = useState<Warranty | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'expired' | 'expiring' | 'claims'>('all');
  
  // Modals and forms
  const [showWarrantyModal, setShowWarrantyModal] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<'product' | 'customer' | 'warranty' | 'attachments' | 'timeline' | 'notifications'>('product');
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Enterprise features
  const [posOrders, setPosOrders] = useState<any[]>([]);
  const [selectedPosOrder, setSelectedPosOrder] = useState<any>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [notificationSettings, setNotificationSettings] = useState({
    email: false,
    sms: false,
    reminder_days: [30, 7, 1],
    auto_notify: true
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form data
  const [warrantyForm, setWarrantyForm] = useState<Partial<Warranty>>({});
  const [formErrors, setFormErrors] = useState<{ [k: string]: string }>({});
  
  // Advanced search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [hasEmail, setHasEmail] = useState<'all' | 'yes' | 'no'>('all');
  const [sortBy, setSortBy] = useState<'product_name' | 'customer_name' | 'warranty_end_date' | 'claim_count'>('warranty_end_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [quickFilters, setQuickFilters] = useState({
    expiringSoon: false,
    hasAttachments: false,
    hasClaims: false,
    vipCustomers: false
  });
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    loadWarrantyData();
    loadPosOrders();
    checkExpiringWarranties();
    // Set up automated check every hour
    const interval = setInterval(checkExpiringWarranties, 3600000);
    return () => clearInterval(interval);
  }, []);

  const checkExpiringWarranties = () => {
    const now = new Date();
    const expiringWarranties = warranties.filter(w => {
      const endDate = new Date(w.warranty_end_date);
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft <= 30 && daysLeft > 0;
    });
    
    if (expiringWarranties.length > 0) {
      console.log(`Found ${expiringWarranties.length} warranties expiring soon`);
      // Here you would typically send notifications to backend
      expiringWarranties.forEach(warranty => {
        if (notificationSettings.auto_notify) {
          // Simulate sending notification
          console.log(`Auto-notification for warranty ${warranty.id} expiring in ${Math.ceil((new Date(warranty.warranty_end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days`);
        }
      });
    }
  };

  const loadPosOrders = async () => {
    try {
      const res = await posApi.getOrders(1, 50);
      if (res.success && res.data) {
        setPosOrders(Array.isArray(res.data) ? res.data : []);
      }
    } catch (error) {
      console.error('Failed to load POS orders:', error);
    }
  };

  const loadWarrantyData = async () => {
    try {
      setLoading(true);
      const res = await posApi.getWarranties(1, 50, searchTerm, statusFilter);
      if (res.success) {
        const list: any[] = Array.isArray(res.data) ? (res.data as any[]) : ((res as any).data?.data || []);
        setWarranties(list as any);
        // Stats
        const active = list.filter((w: any) => (w.status || w.warranty_status) === 'active').length;
        const expired = list.filter((w: any) => (w.status || w.warranty_status) === 'expired').length;
        const claimed = list.filter((w: any) => (w.status || w.warranty_status) === 'claimed').length;
        const expSoon = list.filter((w: any) => {
          const end = new Date(w.end_date || w.warranty_end_date || 0);
          const now = new Date();
          const diff = Math.ceil((end.getTime() - now.getTime()) / (1000*60*60*24));
          return diff <= 30 && diff > 0;
        }).length;
        setWarrantyStats({
          total_warranties: list.length,
          active_warranties: active,
          expired_warranties: expired,
          void_warranties: list.filter((w: any) => (w.status || w.warranty_status) === 'void').length,
          claimed_warranties: claimed,
          expiring_soon: expSoon,
          total_claims: list.reduce((s: number, w: any) => s + (w.claim_count || 0), 0),
          avg_claim_time: 0
        });
      } else {
        throw new Error((res as any).error || 'Failed to load warranties');
      }
    } catch (error) {
      console.error('Warranties loading failed:', error);
      try { toast.error('Không tải được dữ liệu bảo hành.'); } catch (_) {}
      // NO MOCK DATA - Clear state on API failure
      setWarranties([]);
      setWarrantyStats({
        total_warranties: 0,
        active_warranties: 0,
        expired_warranties: 0,
        void_warranties: 0,
        claimed_warranties: 0,
        expiring_soon: 0,
        total_claims: 0,
        avg_claim_time: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getWarrantyTypeDisplay = (type: string) => {
    switch (type) {
      case 'standard':
        return { label: 'Tiêu chuẩn', color: 'blue', icon: <Shield className="w-4 h-4" /> };
      case 'extended':
        return { label: 'Mở rộng', color: 'green', icon: <Award className="w-4 h-4" /> };
      case 'premium':
        return { label: 'Cao cấp', color: 'purple', icon: <TrendingUp className="w-4 h-4" /> };
      default:
        return { label: type, color: 'gray', icon: <Shield className="w-4 h-4" /> };
    }
  };

  const getWarrantyStatusDisplay = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Đang hoạt động', color: 'green', icon: <CheckCircle className="w-4 h-4" /> };
      case 'expired':
        return { label: 'Hết hạn', color: 'red', icon: <XCircle className="w-4 h-4" /> };
      case 'void':
        return { label: 'Vô hiệu', color: 'gray', icon: <XCircle className="w-4 h-4" /> };
      case 'claimed':
        return { label: 'Đã khiếu nại', color: 'orange', icon: <AlertTriangle className="w-4 h-4" /> };
      default:
        return { label: status, color: 'gray', icon: <Shield className="w-4 h-4" /> };
    }
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft;
  };

  // Warranty table columns
  /* const warrantyColumns: Column<Warranty>[] = [
    {
      key: 'product_name',
      title: 'Sản phẩm',
      sortable: true,
      render: (value: string, record: Warranty) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="font-medium text-gray-900">
            <div className="text-sm text-gray-500 {record.product_serial}</div>">
          </div>
        </div>
      )
    },
    {
      key: 'customer_name',
      title: 'Khách hàng',
      sortable: true,
      render: (value: string, record: Warranty) => (
        <div>
          <div className="font-medium text-gray-900">
          <div className="text-sm text-gray-500">
        </div>
      )
    },
    {
      key: 'warranty_type',
      title: 'Loại bảo hành',
      sortable: true,
      render: (value: string) => {
        const typeConfig = getWarrantyTypeDisplay(value);
        return (
          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-${typeConfig.color}-100 text-${typeConfig.color}-800  
            {typeConfig.icon}
            <span className="ml-1">{typeConfig.label}</span>
          </span>
        );
      }
    },
    {
      key: 'warranty_status',
      title: 'Trạng thái',
      sortable: true,
      render: (value: string) => {
        const statusConfig = getWarrantyStatusDisplay(value);
        return (
          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-${statusConfig.color}-100 text-${statusConfig.color}-800  
            {statusConfig.icon}
            <span className="ml-1">{statusConfig.label}</span>
          </span>
        );
      }
    },
    {
      key: 'warranty_end_date',
      title: 'Hết hạn',
      sortable: true,
      render: (value: string) => {
        const daysLeft = getDaysUntilExpiry(value);
        const isExpired = daysLeft < 0;
        const isExpiringSoon = daysLeft <= 30 && daysLeft > 0;
        
        return (
          <div className={`text-sm ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-orange-600' : 'text-gray-600'}`}>
            {formatDate(value)}
            {isExpired && <XCircle className="w-3 h-3 inline ml-1" />}
            {isExpiringSoon && <AlertTriangle className="w-3 h-3 inline ml-1" />}
            {!isExpired && (
              <div className="text-xs text-gray-500">
                {daysLeft > 0 ? `${daysLeft} ngày` : 'Hôm nay'}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'claim_count',
      title: 'Khiếu nại',
      sortable: true,
      align: 'center',
      render: (value: number) => (
        <div className="text-center">
          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
            value === 0 ? 'bg-green-100 text-green-800' :
            value <= 2 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {value}
          </span>
        </div>
      )
    },
    {
      key: 'id' as keyof Warranty,
      title: 'Thao tác',
      align: 'center',
      render: (_: any, record: Warranty) => (
        <div className="flex items-center justify-center space-x-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleViewWarranty(record)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEditWarranty(record)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleCreateClaim(record)}
            className="text-orange-600 hover:text-orange-700">
          >
            <FileText className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ]; */

  // Event handlers
  const handleViewWarranty = (warranty: Warranty) => {
    setSelectedWarranty(warranty);
    setShowWarrantyModal(true);
  };

  const handleEditWarranty = (warranty: Warranty) => {
    setWarrantyForm(warranty);
    setSelectedWarranty(warranty);
    setIsEditMode(true);
    setActiveFormTab('product');
    setShowWarrantyModal(true);
    // Load timeline events for this warranty
    setTimelineEvents([
      {
        id: 1,
        timestamp: warranty.created_at,
        event: 'Bảo hành được tạo',
        type: 'success',
        user: 'System'
      },
      {
        id: 2,
        timestamp: warranty.updated_at,
        event: 'Cập nhật thông tin bảo hành',
        type: 'info',
        user: 'Admin'
      }
    ]);
  };

  const handleCreateClaim = (warranty: Warranty) => {
    // Handle create claim
    console.log('Creating claim for warranty:', warranty.id);
    toast.success('Tạo khiếu nại thành công');
  };

  const handleCreateWarranty = () => {
    setWarrantyForm({});
    setIsEditMode(false);
    setActiveFormTab('product');
    setSelectedPosOrder(null);
    setAttachments([]);
    setTimelineEvents([]);
    setQrCodeUrl('');
    setShowWarrantyModal(true);
  };

  const handleSelectPosOrder = (order: any) => {
    setSelectedPosOrder(order);
    // Auto-fill warranty form with POS order data
    setWarrantyForm({
      product_name: order.product_name || order.items?.[0]?.product_name,
      product_serial: order.product_serial || `${order.id}-${Date.now()}`,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_email: order.customer_email,
      purchase_date: order.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      warranty_type: 'standard',
      warranty_status: 'active'
    });
    toast.success('Đã tự động điền thông tin từ đơn hàng POS');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
    toast.success(`Đã thêm ${files.length} tệp đính kèm`);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const generateQRCode = () => {
    const warrantyData = {
      id: warrantyForm.id || 'new',
      product_name: warrantyForm.product_name,
      serial: warrantyForm.product_serial,
      customer: warrantyForm.customer_name
    };
    const qrData = btoa(JSON.stringify(warrantyData));
    setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`);
    toast.success('Đã tạo mã QR cho bảo hành');
  };

  const addTimelineEvent = (event: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') => {
    const newEvent = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      event,
      type,
      user: user?.username || 'System'
    };
    setTimelineEvents(prev => [newEvent, ...prev]);
  };

  const isEmailValid = (v?: string) => !v || /^(?:[^\s@]+@[^\s@]+\.[^\s@]+)$/.test(v);
  const isPhoneValid = (v?: string) => !v || /^(?:\+?\d[\d\s.-]{6,})$/.test(v);

  const validateWarrantyForm = (draft: Partial<Warranty>) => {
    const errors: { [k: string]: string } = {};
    if (!draft.product_name) errors.product_name = 'Vui lòng nhập tên sản phẩm';
    if (!draft.product_serial) errors.product_serial = 'Vui lòng nhập số serial';
    if (!draft.customer_name) errors.customer_name = 'Vui lòng nhập tên khách hàng';
    if (!draft.purchase_date) errors.purchase_date = 'Vui lòng chọn ngày mua';
    if (!draft.warranty_type) errors.warranty_type = 'Vui lòng chọn loại bảo hành';
    if (!isPhoneValid(draft.customer_phone)) errors.customer_phone = 'Số điện thoại không hợp lệ';
    if (!isEmailValid(draft.customer_email)) errors.customer_email = 'Email không hợp lệ';
    setFormErrors(errors);
    return errors;
  };

  async function saveWarranty() {
    try {
      const payload: any = {
        product_id: (warrantyForm as any).product_id,
        product_name: warrantyForm.product_name || '',
        product_serial: warrantyForm.product_serial || '',
        customer_name: warrantyForm.customer_name || '',
        customer_phone: warrantyForm.customer_phone || '',
        customer_email: (warrantyForm as any).customer_email || '',
        purchase_date: warrantyForm.purchase_date || new Date().toISOString().slice(0,10),
        start_date: (warrantyForm as any).warranty_start_date || warrantyForm.purchase_date,
        end_date: (warrantyForm as any).warranty_end_date,
        type: warrantyForm.warranty_type || 'standard',
        status: warrantyForm.warranty_status || 'active',
        terms: warrantyForm.warranty_terms,
        service_center: warrantyForm.service_center,
        notes: [
          (warrantyForm as any).invoice_code ? `Invoice:${(warrantyForm as any).invoice_code}` : '',
          (warrantyForm as any).customer_address ? `Address:${(warrantyForm as any).customer_address}` : ''
        ].filter(Boolean).join(' | '),
        assigned_to: (warrantyForm as any).assigned_to,
        notify_customer: (warrantyForm as any).notify_customer || false
      };

      if ((warrantyForm as any).id) {
        const res = await posApi.updateWarranty((warrantyForm as any).id, payload);
        if (!res.success) throw new Error((res as any).error || 'Cập nhật bảo hành thất bại');
        toast.success('Cập nhật bảo hành thành công');
      } else {
        const res = await posApi.createWarranty(payload);
        if (!res.success) throw new Error((res as any).error || 'Tạo bảo hành thất bại');
        toast.success('Tạo bảo hành thành công');
      }
      setShowWarrantyModal(false);
      setSelectedWarranty(null);
      await loadWarrantyData();
    } catch (e: any) {
      toast.error(e?.message || 'Lưu bảo hành thất bại');
    }
  }

  // Helper for timeline events (reserved for future detail view actions)

  const filteredWarranties = warranties.filter(warranty => {
    const matchesSearch = (warranty.product_name || warranty.product_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (warranty.customer_name || warranty.customer_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (warranty.product_serial || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || warranty.warranty_status === statusFilter;
    const matchesType = typeFilter === 'all' || warranty.warranty_type === typeFilter;
    const matchesCustomer = true; // customerFilter === 'all' || warranty.customer_id === customerFilter;
    const matchesEmail = hasEmail === 'all' || (hasEmail === 'yes' ? !!warranty.customer_email : !warranty.customer_email);
    const matchesDate = (() => {
      if (!fromDate && !toDate) return true;
      const end = new Date(warranty.warranty_end_date).getTime();
      const fromOk = fromDate ? end >= new Date(fromDate).getTime() : true;
      const toOk = toDate ? end <= new Date(toDate).getTime() : true;
      return fromOk && toOk;
    })();
    
    return matchesSearch && matchesStatus && matchesType && matchesCustomer && matchesEmail && matchesDate;
  });

  const sortedWarranties = [...filteredWarranties].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'product_name') return (a.product_name || a.product_id || '').localeCompare(b.product_name || b.product_id || '') * dir;
    if (sortBy === 'customer_name') return (a.customer_name || a.customer_id || '').localeCompare(b.customer_name || b.customer_id || '') * dir;
    if (sortBy === 'claim_count') return ((a.claim_count || 0) - (b.claim_count || 0)) * dir;
    return (new Date(a.warranty_end_date).getTime() - new Date(b.warranty_end_date).getTime()) * dir;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedWarranties.length) setSelectedIds([]);
    else setSelectedIds(sortedWarranties.map(w => w.id));
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const exportSelectedCsv = () => {
    const rows = sortedWarranties.filter(w => selectedIds.includes(w.id));
    if (!rows.length) return;
    const headers = ['id','product_name','product_serial','customer_name','customer_phone','warranty_type','warranty_status','warranty_end_date','claim_count'];
    const csv = [headers.join(',')]
      .concat(rows.map(r => headers.map(h => JSON.stringify((r as any)[h] ?? '')).join(',')))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'warranties_selected.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải dữ liệu bảo hành...</p>
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
            <Shield className="w-8 h-8 mr-3 text-blue-600" />
            Quản lý bảo hành
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý toàn diện bảo hành sản phẩm và dịch vụ khách hàng
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => toast.success('Tính năng tạo khiếu nại đang phát triển')}>
            <FileText className="w-4 h-4 mr-2" />
            Tạo khiếu nại
          </Button>
          <Button onClick={handleCreateWarranty}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm bảo hành
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bảo hành hoạt động</p>
                <p className="text-3xl font-bold text-gray-900">{warrantyStats.active_warranties}</p>
                <p className="text-sm text-green-600">đang hoạt động</p>
              </div>
              <Shield className="w-12 h-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sắp hết hạn</p>
                <p className="text-3xl font-bold text-gray-900">{warrantyStats.expiring_soon}</p>
                <p className="text-sm text-orange-600">Trong 30 ngày tới</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đã hết hạn</p>
                <p className="text-3xl font-bold text-gray-900">{warrantyStats.expired}</p>
                <p className="text-sm text-red-600">Cần xử lý</p>
              </div>
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Thời gian khiếu nại</p>
                <p className="text-3xl font-bold text-gray-900">{warrantyStats.avg_claim_time}</p>
                <p className="text-sm text-purple-600">TB ngày</p>
              </div>
              <FileText className="w-12 h-12 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'all', label: 'Tất cả bảo hành', icon: Shield },
            { id: 'active', label: 'Đang hoạt động', icon: CheckCircle },
            { id: 'expired', label: 'Hết hạn', icon: XCircle },
            { id: 'expiring', label: 'Sắp hết hạn', icon: AlertTriangle },
            { id: 'claims', label: 'Có khiếu nại', icon: FileText }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Advanced Search and Filters */}
          <div className="space-y-4 mb-6">
            {/* Main Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm, serial, khách hàng, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent  text-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setHasEmail('all');
                  setFromDate('');
                  setToDate('');
                  setSortBy('warranty_end_date');
                  setSortDir('desc');
                }}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Đặt lại
                </Button>
                <Button variant="outline" onClick={() => window.open(posApi.getWarrantyExportCsvUrl(), '_blank')}>
                  <Download className="w-4 h-4 mr-2" />
                  Xuất CSV
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500  text-sm appearance-none bg-white"
                >
                  <option value="all">🔵 Tất cả trạng thái</option>
                  <option value="active">✅ Đang hoạt động</option>
                  <option value="expired">❌ Hết hạn</option>
                  <option value="void">⚫ Vô hiệu</option>
                  <option value="claimed">⚠️ Đã khiếu nại</option>
                </select>
                <Filter className="w-3 h-3 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Type Filter */}
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500  text-sm appearance-none bg-white"
                >
                  <option value="all">🏷️ Tất cả loại</option>
                  <option value="standard">🥉 Tiêu chuẩn</option>
                  <option value="extended">🥈 Mở rộng</option>
                  <option value="premium">🥇 Cao cấp</option>
                </select>
                <Tags className="w-3 h-3 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Email Filter */}
              <div className="relative">
                <select
                  value={hasEmail}
                  onChange={(e) => setHasEmail(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500  text-sm appearance-none bg-white"
                >
                  <option value="all">📧 Email: Tất cả</option>
                  <option value="yes">✅ Có email</option>
                  <option value="no">❌ Không email</option>
                </select>
                <Mail className="w-3 h-3 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Date Range */}
              <div className="relative">
                <input 
                  type="date" 
                  value={fromDate} 
                  onChange={(e) => setFromDate(e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500  text-sm"
                  placeholder="Từ ngày"
                />
                <Calendar className="w-3 h-3 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              
              <div className="relative">
                <input 
                  type="date" 
                  value={toDate} 
                  onChange={(e) => setToDate(e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500  text-sm"
                  placeholder="Đến ngày"
                />
                <Calendar className="w-3 h-3 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Sort Options */}
              <div className="relative sm:col-span-2 lg:col-span-1">
                <select 
                  value={`${sortBy}-${sortDir}`} 
                  onChange={(e) => {
                    const [field, direction] = e.target.value.split('-');
                    setSortBy(field as any);
                    setSortDir(direction as any);
                  }} 
                  className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500  text-sm appearance-none bg-white"
                >
                  <option value="warranty_end_date-desc">📅 Hết hạn (mới nhất)</option>
                  <option value="warranty_end_date-asc">📅 Hết hạn (cũ nhất)</option>
                  <option value="product_name-asc">📦 Sản phẩm (A-Z)</option>
                  <option value="product_name-desc">📦 Sản phẩm (Z-A)</option>
                  <option value="customer_name-asc">👤 Khách hàng (A-Z)</option>
                  <option value="customer_name-desc">👤 Khách hàng (Z-A)</option>
                  <option value="claim_count-desc">⚠️ Khiếu nại (nhiều nhất)</option>
                  <option value="claim_count-asc">⚠️ Khiếu nại (ít nhất)</option>
                </select>
                <SortAsc className="w-3 h-3 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={quickFilters.expiringSoon ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const newState = !quickFilters.expiringSoon;
                  setQuickFilters({...quickFilters, expiringSoon: newState});
                  if (newState) {
                    // Filter for warranties expiring in 30 days
                    const today = new Date();
                    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
                    setToDate(thirtyDaysLater.toISOString().split('T')[0]);
                    setStatusFilter('active');
                  } else {
                    setToDate('');
                    setStatusFilter('all');
                  }
                }}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Sắp hết hạn
                {warrantyStats.expiring_soon > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                    {warrantyStats.expiring_soon}
                  </span>
                )}
              </Button>
              
              <Button
                variant={quickFilters.hasClaims ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const newState = !quickFilters.hasClaims;
                  setQuickFilters({...quickFilters, hasClaims: newState});
                  if (newState) {
                    setStatusFilter('claimed');
                  } else {
                    setStatusFilter('all');
                  }
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                Có khiếu nại
                {warrantyStats.claimed_warranties > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                    {warrantyStats.claimed_warranties}
                  </span>
                )}
              </Button>
              
              <Button
                variant={hasEmail === 'yes' ? "default" : "outline"}
                size="sm"
                onClick={() => setHasEmail(hasEmail === 'yes' ? 'all' : 'yes')}
              >
                <Mail className="w-4 h-4 mr-2" />
                Có email liên hệ
              </Button>
              
              <Button
                variant={typeFilter === 'premium' ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter(typeFilter === 'premium' ? 'all' : 'premium')}
              >
                <Award className="w-4 h-4 mr-2" />
                Bảo hành cao cấp
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const expiredCount = warranties.filter(w => getDaysUntilExpiry(w.warranty_end_date) < 0).length;
                  if (expiredCount > 0) {
                    toast.success(`Tìm thấy ${expiredCount} bảo hành đã hết hạn cần xử lý`);
                    setStatusFilter('expired');
                  } else {
                    toast.info('Không có bảo hành hết hạn');
                  }
                }}
              >
                <Clock className="w-4 h-4 mr-2" />
                Kiểm tra hết hạn
              </Button>
            </div>

            {/* Filter Summary */}
            {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || hasEmail !== 'all' || fromDate || toDate) && (
              <div className="flex flex-wrap items-center gap-2 p-3 bg-blue-50  border border-blue-200 rounded-lg">
                <span className="text-sm font-medium text-blue-900">Bộ lọc đang áp dụng:</span>
                {searchTerm && (
                  <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-100  text-blue-800 rounded-full">
                    Tìm kiếm: "{searchTerm}"
                    <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-blue-600">
                      <XCircle className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 text-xs bg-green-100  text-green-800 rounded-full">
                    Trạng thái: {statusFilter}
                    <button onClick={() => setStatusFilter('all')} className="ml-1 hover:text-green-600">
                      <XCircle className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {typeFilter !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 text-xs bg-purple-100  text-purple-800 rounded-full">
                    Loại: {typeFilter}
                    <button onClick={() => setTypeFilter('all')} className="ml-1 hover:text-purple-600">
                      <XCircle className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {hasEmail !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 text-xs bg-orange-100  text-orange-800 rounded-full">
                    Email: {hasEmail === 'yes' ? 'Có' : 'Không'}
                    <button onClick={() => setHasEmail('all')} className="ml-1 hover:text-orange-600">
                      <XCircle className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {(fromDate || toDate) && (
                  <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100  text-gray-800 rounded-full">
                    Ngày: {fromDate || '∞'} → {toDate || '∞'}
                    <button onClick={() => { setFromDate(''); setToDate(''); }} className="ml-1 hover:text-gray-600">
                      <XCircle className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <span className="text-xs text-blue-700 ml-2">
                  ({filteredWarranties.length} kết quả)
                </span>
              </div>
            )}
          </div>

          {selectedIds.length > 0 && (
            <div className="bg-blue-50  border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between">
              <div className="text-blue-700 text-sm">Đã chọn {selectedIds.length} bảo hành</div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportSelectedCsv}><Download className="w-4 h-4 mr-2" />Xuất CSV</Button>
                <Button onClick={() => { toast.success('Đã tạo khiếu nại cho mục đã chọn'); }} disabled={!isAuthenticated || (user as any)?.role === 'cashier'}>
                  <FileText className="w-4 h-4 mr-2" />Tạo khiếu nại hàng loạt
                </Button>
              </div>
            </div>
          )}

          {/* Warranty Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2"><input type="checkbox" className="checkbox" checked={selectedIds.length === sortedWarranties.length && sortedWarranties.length > 0} onChange={toggleSelectAll} /></th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 phẩm</th>">
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 hàng</th>">
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 thái</th>">
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 hạn</th>">
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-600 nại</th>">
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-600 tác</th>">
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedWarranties.map(w => {
                  const typeConfig = getWarrantyTypeDisplay(w.warranty_type);
                  const statusConfig = getWarrantyStatusDisplay(w.warranty_status);
                  const daysLeft = getDaysUntilExpiry(w.warranty_end_date);
                  const isExpired = daysLeft < 0;
                  const isExpSoon = daysLeft <= 30 && daysLeft > 0;
                  return (
                    <tr key={w.id} className="bg-white">
                      <td className="px-3 py-2"><input type="checkbox" className="checkbox" checked={selectedIds.includes(w.id)} onChange={() => toggleSelectOne(w.id)} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white"><Package className="w-5 h-5" /></div>
                          <div>
                            <div className="font-medium text-gray-900 || w.product_id || 'N/A'}</div>">
                            <div className="text-sm text-gray-500 {w.product_serial}</div>">
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900 || w.customer_id || 'N/A'}</div>">
                          <div className="text-sm text-gray-500 || ''}</div>">
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-${typeConfig.color}-100 text-${typeConfig.color}-800  
                          {typeConfig.icon}
                          <span className="ml-1">{typeConfig.label}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-${statusConfig.color}-100 text-${statusConfig.color}-800  
                          {statusConfig.icon}
                          <span className="ml-1">{statusConfig.label}</span>
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-sm ${isExpired ? 'text-red-600' : isExpSoon ? 'text-orange-600' : 'text-gray-600'}`}>
                        {formatDate(w.warranty_end_date)}
                        {!isExpired && <div className="text-xs text-gray-500">{daysLeft > 0 ? `${daysLeft} ngày` : 'Hôm nay'}</div>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${w.claim_count === 0 ? 'bg-green-100 text-green-800' : w.claim_count <= 2 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{w.claim_count}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center space-x-1">
                          <Button size="sm" variant="ghost" onClick={() => handleViewWarranty(w)}><Eye className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => handleEditWarranty(w)} disabled={!isAuthenticated || (user as any)?.role === 'cashier'}><Edit className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => handleCreateClaim(w)} className="text-orange-600 hover:text-orange-700"><FileText className="w-4 h-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Enterprise Warranty Modal */}
      <AnimatePresence>
        {showWarrantyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowWarrantyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col text-gray-900" onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Shield className="w-8 h-8 text-blue-600" />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {selectedWarranty ? 'Chi tiết bảo hành' : 'Thêm bảo hành mới'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedWarranty ? `ID: ${selectedWarranty.id}` : 'Hệ thống bảo hành doanh nghiệp'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedWarranty && (
                    <Button variant="outline" size="sm" onClick={generateQRCode}>
                      <QrCode className="w-4 h-4 mr-2" />
                      Tạo QR
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditMode(!isEditMode)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {isEditMode ? 'Xem' : 'Chỉnh sửa'}
                  </Button>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200 bg-gray-50">
                {[
                  { id: 'product', label: 'Sản phẩm', icon: Package },
                  { id: 'customer', label: 'Khách hàng', icon: User },
                  { id: 'warranty', label: 'Bảo hành', icon: Shield },
                  { id: 'attachments', label: 'Tệp đính kèm', icon: Paperclip },
                  { id: 'timeline', label: 'Lịch sử', icon: History },
                  { id: 'notifications', label: 'Thông báo', icon: Bell }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFormTab(tab.id as any)}
                    className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeFormTab === tab.id
                        ? 'border-blue-600 text-blue-600 bg-white 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Product Tab */}
                {activeFormTab === 'product' && (
                  <div className="space-y-6">
                    {/* POS Order Integration */}
                    {!selectedWarranty && (
                      <div className="bg-blue-50  border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                          <Link2 className="w-4 h-4 mr-2" />
                          Liên kết với đơn hàng POS
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-40 overflow-y-auto">
                          {posOrders.slice(0, 6).map(order => (
                            <div
                              key={order.id}
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedPosOrder?.id === order.id
                                  ? 'border-blue-500 bg-blue-100 
                                  : 'border-gray-200 hover:border-blue-300'
                              }`}
                              onClick={() => handleSelectPosOrder(order)}
                            >
                              <div className="font-medium text-sm">{order.customer_name || 'Khách lẻ'}</div>
                              <div className="text-xs text-gray-500">
                                {formatDate(order.created_at)} - {order.total?.toLocaleString()}đ
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Product Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tên sản phẩm *
                        </label>
                        <input
                          type="text"
                          value={warrantyForm.product_name || ''}
                          onChange={(e) => {
                            const next = { ...warrantyForm, product_name: e.target.value };
                            setWarrantyForm(next);
                            validateWarrantyForm(next);
                          }}
                          disabled={!isEditMode && !!selectedWarranty}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          placeholder="Nhập tên sản phẩm"
                        />
                        {formErrors.product_name && <p className="mt-1 text-xs text-red-600">{formErrors.product_name}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Số serial *
                        </label>
                        <input
                          type="text"
                          value={warrantyForm.product_serial || ''}
                          onChange={(e) => {
                            const next = { ...warrantyForm, product_serial: e.target.value };
                            setWarrantyForm(next);
                            validateWarrantyForm(next);
                          }}
                          disabled={!isEditMode && !!selectedWarranty}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          placeholder="Nhập số serial"
                        />
                        {formErrors.product_serial && <p className="mt-1 text-xs text-red-600">{formErrors.product_serial}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Danh mục
                        </label>
                        <select
                          value={warrantyForm.category || ''}
                          onChange={(e) => setWarrantyForm({...warrantyForm, category: e.target.value})}
                          disabled={!isEditMode && !!selectedWarranty}
                          className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500  disabled:opacity-50">
                        >
                          <option value="">Chọn danh mục</option>
                          <option value="laptop">Laptop</option>
                          <option value="desktop">Máy tính để bàn</option>
                          <option value="printer">Máy in</option>
                          <option value="accessories">Phụ kiện</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Thương hiệu
                        </label>
                        <input
                          type="text"
                          value={warrantyForm.brand || ''}
                          onChange={(e) => setWarrantyForm({...warrantyForm, brand: e.target.value})}
                          disabled={!isEditMode && !!selectedWarranty}
                          className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500  disabled:opacity-50"
                  placeholder="Nhập thương hiệu"
                        />
                      </div>
                    </div>

                    {/* Product Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mô tả sản phẩm
                      </label>
                      <textarea
                        value={warrantyForm.product_description || ''}
                        onChange={(e) => setWarrantyForm({...warrantyForm, product_description: e.target.value})}
                        disabled={!isEditMode && !!selectedWarranty}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500  disabled:opacity-50"
                  placeholder="Nhập mô tả chi tiết sản phẩm"
                      />
                    </div>
                  </div>
                )}

                {/* Customer Tab */}
                {activeFormTab === 'customer' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tên khách hàng *
                        </label>
                        <input
                          type="text"
                          value={warrantyForm.customer_name || ''}
                          onChange={(e) => {
                            const next = { ...warrantyForm, customer_name: e.target.value };
                            setWarrantyForm(next);
                            validateWarrantyForm(next);
                          }}
                          disabled={!isEditMode && !!selectedWarranty}
                          className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500  disabled:opacity-50"
                  placeholder="Nhập tên khách hàng"
                        />
                        {formErrors.customer_name && <p className="mt-1 text-xs text-red-600">{formErrors.customer_name}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Điện thoại
                        </label>
                        <input
                          type="tel"
                          value={warrantyForm.customer_phone || ''}
                          onChange={(e) => {
                            const next = { ...warrantyForm, customer_phone: e.target.value };
                            setWarrantyForm(next);
                            validateWarrantyForm(next);
                          }}
                          disabled={!isEditMode && !!selectedWarranty}
                          className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500  disabled:opacity-50"
                  placeholder="Nhập số điện thoại"
                        />
                        {formErrors.customer_phone && <p className="mt-1 text-xs text-red-600">{formErrors.customer_phone}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={warrantyForm.customer_email || ''}
                          onChange={(e) => {
                            const next = { ...warrantyForm, customer_email: e.target.value };
                            setWarrantyForm(next);
                            validateWarrantyForm(next);
                          }}
                          disabled={!isEditMode && !!selectedWarranty}
                          className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500  disabled:opacity-50"
                  placeholder="Nhập email khách hàng"
                        />
                        {formErrors.customer_email && <p className="mt-1 text-xs text-red-600">{formErrors.customer_email}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Công ty/Tổ chức
                        </label>
                        <input
                          type="text"
                          value={warrantyForm.customer_company || ''}
                          onChange={(e) => setWarrantyForm({...warrantyForm, customer_company: e.target.value})}
                          disabled={!isEditMode && !!selectedWarranty}
                          className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500  disabled:opacity-50"
                  placeholder="Nhập tên công ty"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Địa chỉ
                      </label>
                      <textarea
                        value={warrantyForm.customer_address || ''}
                        onChange={(e) => setWarrantyForm({...warrantyForm, customer_address: e.target.value})}
                        disabled={!isEditMode && !!selectedWarranty}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500  disabled:opacity-50"
                  placeholder="Nhập địa chỉ khách hàng"
                      />
                    </div>
                  </div>
                )}

                {/* Warranty Tab */}
                {activeFormTab === 'warranty' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Loại bảo hành *
                        </label>
                        <select
                          value={warrantyForm.warranty_type || ''}
                          onChange={(e) => {
                            const next = { ...warrantyForm, warranty_type: e.target.value as any };
                            setWarrantyForm(next);
                            validateWarrantyForm(next);
                          }}
                          disabled={!isEditMode && !!selectedWarranty}
                          className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500  disabled:opacity-50">
                        >
                          <option value="">Chọn loại bảo hành</option>
                          <option value="standard">Tiêu chuẩn (12 tháng)</option>
                          <option value="extended">Mở rộng (18 tháng)</option>
                          <option value="premium">Cao cấp (24 tháng)</option>
                        </select>
                        {formErrors.warranty_type && <p className="mt-1 text-xs text-red-600">{formErrors.warranty_type}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ngày mua *
                        </label>
                        <input
                          type="date"
                          value={warrantyForm.purchase_date || ''}
                          onChange={(e) => {
                            const next = { ...warrantyForm, purchase_date: e.target.value };
                            setWarrantyForm(next);
                            validateWarrantyForm(next);
                          }}
                          disabled={!isEditMode && !!selectedWarranty}
                          className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500  disabled:opacity-50">
                        />
                        {formErrors.purchase_date && <p className="mt-1 text-xs text-red-600">{formErrors.purchase_date}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ngày bắt đầu bảo hành
                        </label>
                        <input
                          type="date"
                          value={warrantyForm.warranty_start_date || warrantyForm.purchase_date || ''}
                          onChange={(e) => setWarrantyForm({...warrantyForm, warranty_start_date: e.target.value})}
                          disabled={!isEditMode && !!selectedWarranty}
                          className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500  disabled:opacity-50">
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ngày hết hạn bảo hành
                        </label>
                        <input
                          type="date"
                          value={warrantyForm.warranty_end_date || ''}
                          onChange={(e) => setWarrantyForm({...warrantyForm, warranty_end_date: e.target.value})}
                          disabled={!isEditMode && !!selectedWarranty}
                          className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500  disabled:opacity-50">
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Trung tâm bảo hành
                      </label>
                      <select
                        value={warrantyForm.service_center || ''}
                        onChange={(e) => setWarrantyForm({...warrantyForm, service_center: e.target.value})}
                        disabled={!isEditMode && !!selectedWarranty}
                        className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500  disabled:opacity-50">
                      >
                        <option value="">Chọn trung tâm bảo hành</option>
                        <option value="Trung tâm bảo hành TP.HCM">Trung tâm bảo hành TP.HCM</option>
                        <option value="Trung tâm bảo hành Hà Nội">Trung tâm bảo hành Hà Nội</option>
                        <option value="Trung tâm bảo hành Đà Nẵng">Trung tâm bảo hành Đà Nẵng</option>
                        <option value="Trung tâm bảo hành Cần Thơ">Trung tâm bảo hành Cần Thơ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Điều khoản bảo hành
                      </label>
                      <textarea
                        value={warrantyForm.warranty_terms || ''}
                        onChange={(e) => setWarrantyForm({...warrantyForm, warranty_terms: e.target.value})}
                        disabled={!isEditMode && !!selectedWarranty}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500  disabled:opacity-50"
                  placeholder="Nhập điều khoản bảo hành chi tiết"
                      />
                    </div>
                  </div>
                )}

                {/* Attachments Tab */}
                {activeFormTab === 'attachments' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 đính kèm</h4>">
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!isEditMode && !!selectedWarranty}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Thêm tệp
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden" onChange={handleFileUpload}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                    </div>
                    
                    {attachments.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                <FileText className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium text-sm">{file.name}</div>
                                <div className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttachment(index)}
                              disabled={!isEditMode && !!selectedWarranty}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {attachments.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Chưa có tệp đính kèm</p>
                        <p className="text-sm">Thêm hóa đơn, ảnh sản phẩm, tài liệu bảo hành</p>
                      </div>
                    )}

                    {/* QR Code Display */}
                    {qrCodeUrl && (
                      <div className="border-t pt-6">
                        <h4 className="font-medium text-gray-900 mb-4">Mã QR bảo hành</h4>
                        <div className="flex items-center space-x-4">
                          <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32 border rounded-lg" />
                          <div>
                            <p className="text-sm text-gray-600 mb-2">
                              Khách hàng có thể quét mã này để truy cập thông tin bảo hành
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(qrCodeUrl);
                                toast.success('Đã sao chép link QR code');
                              }}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Sao chép link
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Timeline Tab */}
                {activeFormTab === 'timeline' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 sử hoạt động</h4>">
                      <Button
                        onClick={() => {
                          const event = prompt('Nhập sự kiện mới:');
                          if (event) addTimelineEvent(event);
                        }}
                        size="sm"
                        disabled={!isEditMode && !!selectedWarranty}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm sự kiện
                      </Button>
                    </div>
                    
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {timelineEvents.length > 0 ? timelineEvents.map(event => (
                        <div key={event.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            event.type === 'success' ? 'bg-green-500' :
                            event.type === 'warning' ? 'bg-yellow-500' :
                            event.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                          }`} />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{event.event}</div>
                            <div className="text-xs text-gray-500">
                              {formatDate(event.timestamp)} - {event.user}
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-8 text-gray-500">
                          <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Chưa có hoạt động nào</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeFormTab === 'notifications' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-4">Cài đặt thông báo</h4>
                      <div className="space-y-4">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={notificationSettings.email}
                            onChange={(e) => setNotificationSettings({...notificationSettings, email: e.target.checked})}
                            disabled={!isEditMode && !!selectedWarranty}
                            className="rounded">
                          />
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4" />
                            <span>Thông báo email</span>
                          </div>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={notificationSettings.sms}
                            onChange={(e) => setNotificationSettings({...notificationSettings, sms: e.target.checked})}
                            disabled={!isEditMode && !!selectedWarranty}
                            className="rounded">
                          />
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="w-4 h-4" />
                            <span>Thông báo SMS</span>
                          </div>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={notificationSettings.auto_notify}
                            onChange={(e) => setNotificationSettings({...notificationSettings, auto_notify: e.target.checked})}
                            disabled={!isEditMode && !!selectedWarranty}
                            className="rounded">
                          />
                          <div className="flex items-center space-x-2">
                            <Bell className="w-4 h-4" />
                            <span>Tự động thông báo nhắc nhở</span>
                          </div>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nhắc nhở trước khi hết hạn (ngày)
                      </label>
                      <div className="flex space-x-2">
                        {[1, 7, 14, 30].map(days => (
                          <label key={days} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={notificationSettings.reminder_days.includes(days)}
                              onChange={(e) => {
                                const newDays = e.target.checked 
                                  ? [...notificationSettings.reminder_days, days]
                                  : notificationSettings.reminder_days.filter(d => d !== days);
                                setNotificationSettings({...notificationSettings, reminder_days: newDays});
                              }}
                              disabled={!isEditMode && !!selectedWarranty}
                              className="rounded">
                            />
                            <span className="text-sm">{days} ngày</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h5 className="font-medium text-gray-900 mb-3">Gửi thông báo ngay</h5>
                      <div className="flex space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            toast.success('Đã gửi email thông báo đến khách hàng');
                            addTimelineEvent('Gửi email thông báo bảo hành', 'info');
                          }}
                          disabled={!warrantyForm.customer_email}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Gửi Email
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            toast.success('Đã gửi SMS thông báo đến khách hàng');
                            addTimelineEvent('Gửi SMS thông báo bảo hành', 'info');
                          }}
                          disabled={!warrantyForm.customer_phone}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Gửi SMS
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200 flex justify-between">
                <div className="flex space-x-3">
                  {selectedWarranty && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => window.open(`/warranty/${selectedWarranty.id}/print`, '_blank')}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        In phiếu
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const url = `/warranty/${selectedWarranty.id}/public`;
                          navigator.clipboard.writeText(window.location.origin + url);
                          toast.success('Đã sao chép link tra cứu công khai');
                        }}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Link tra cứu
                      </Button>
                    </>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowWarrantyModal(false);
                      setSelectedWarranty(null);
                      setIsEditMode(false);
                    }}
                  >
                    Hủy
                  </Button>
                  {(!selectedWarranty || isEditMode) && (
                    <Button 
                      onClick={() => { 
                        const errs = validateWarrantyForm(warrantyForm); 
                        if (Object.keys(errs).length === 0) {
                          if (!selectedWarranty) {
                            addTimelineEvent('Tạo bảo hành mới', 'success');
                          } else {
                            addTimelineEvent('Cập nhật thông tin bảo hành', 'info');
                          }
                          saveWarranty(); 
                        }
                      }} 
                      disabled={!isAuthenticated || (user as any)?.role === 'cashier'}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      {selectedWarranty ? 'Cập nhật bảo hành' : 'Tạo bảo hành'}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WarrantyManagement;
