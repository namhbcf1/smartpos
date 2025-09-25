// Warranty Processing History
// Detailed log of every customer visit, processing steps and results

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  Search,
  Eye,
  Package,
  Wrench,
  CheckCircle,
  XCircle,
  FileText,
  Camera,
  Download,
  MessageSquare,
  DollarSign,
  Timer,
  Star,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/ButtonSimplified';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

interface WarrantyHistoryEntry {
  id: string;
  warranty_id: string;
  visit_number: number;
  customer_name: string;
  customer_phone: string;
  product_name: string;
  product_serial: string;
  service_center_id: string;
  service_center_name: string;
  technician_name: string;
  technician_id: string;
  
  // Visit details
  visit_date: string;
  arrival_time: string;
  completion_time?: string;
  duration_minutes?: number;
  
  // Issue and resolution
  reported_issue: string;
  diagnosis: string;
  work_performed: string[];
  parts_used: string[];
  parts_cost: number;
  labor_cost: number;
  total_cost: number;
  
  // Status and outcome
  status: 'in_progress' | 'completed' | 'waiting_parts' | 'escalated' | 'rejected';
  resolution_type: 'repaired' | 'replaced' | 'refund' | 'no_fault' | 'out_of_warranty';
  customer_satisfaction: number; // 1-5 stars
  customer_feedback?: string;
  
  // Documentation
  photos_before: string[];
  photos_after: string[];
  test_results: string[];
  warranty_claim_approved: boolean;
  notes: string;
  internal_notes: string;
  
  // Follow-up
  follow_up_required: boolean;
  follow_up_date?: string;
  return_policy_explained: boolean;
  
  created_at: string;
  updated_at: string;
}

interface ProcessingStats {
  total_visits: number;
  avg_resolution_time: number;
  customer_satisfaction: number;
  warranty_claim_rate: number;
  cost_savings: number;
  repeat_visit_rate: number;
}

const WarrantyHistory: React.FC = () => {
  const [historyEntries, setHistoryEntries] = useState<WarrantyHistoryEntry[]>([]);
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [_loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [technicianFilter, setTechnicianFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [selectedEntry, setSelectedEntry] = useState<WarrantyHistoryEntry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

  useEffect(() => {
    loadHistoryEntries();
    loadStats();
  }, []);

  const loadHistoryEntries = async () => {
    // setLoading(true);
    try {
      // Mock data for demonstration
      const mockEntries: WarrantyHistoryEntry[] = [
        {
          id: 'HIST_001',
          warranty_id: 'WAR_001',
          visit_number: 1,
          customer_name: 'Nguyễn Văn An',
          customer_phone: '0901234567',
          product_name: 'Laptop Dell Inspiron 15',
          product_serial: 'DL123456789',
          service_center_id: 'SC_001',
          service_center_name: 'Trung tâm bảo hành TP.HCM',
          technician_name: 'Trần Văn Bình',
          technician_id: 'TECH_001',
          
          visit_date: new Date(Date.now() - 86400000 * 2).toISOString(),
          arrival_time: '09:30',
          completion_time: '11:45',
          duration_minutes: 135,
          
          reported_issue: 'Màn hình bị nhấp nháy, đôi khi không hiển thị. Xảy ra sau khi cập nhật driver.',
          diagnosis: 'Cáp màn hình bị lỏng, driver GPU không tương thích',
          work_performed: [
            'Kiểm tra phần cứng màn hình',
            'Thay cáp màn hình',
            'Cập nhật driver GPU',
            'Test toàn bộ chức năng'
          ],
          parts_used: ['Cáp màn hình LVDS 40pin'],
          parts_cost: 150000,
          labor_cost: 100000,
          total_cost: 250000,
          
          status: 'completed',
          resolution_type: 'repaired',
          customer_satisfaction: 5,
          customer_feedback: 'Dịch vụ tuyệt vời, kỹ thuật viên rất chuyên nghiệp',
          
          photos_before: ['/images/before_1.jpg', '/images/before_2.jpg'],
          photos_after: ['/images/after_1.jpg'],
          test_results: ['Màn hình hoạt động bình thường', 'Độ phân giải đạt chuẩn'],
          warranty_claim_approved: true,
          notes: 'Khách hàng hài lòng với dịch vụ',
          internal_notes: 'Cần kiểm tra batch cáp màn hình này',
          
          follow_up_required: true,
          follow_up_date: new Date(Date.now() + 86400000 * 7).toISOString(),
          return_policy_explained: true,
          
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
        },
        {
          id: 'HIST_002',
          warranty_id: 'WAR_002',
          visit_number: 1,
          customer_name: 'Trần Thị Bình',
          customer_phone: '0912345678',
          product_name: 'Máy tính HP Pavilion',
          product_serial: 'HP987654321',
          service_center_id: 'SC_001',
          service_center_name: 'Trung tâm bảo hành TP.HCM',
          technician_name: 'Lê Minh Tuấn',
          technician_id: 'TECH_002',
          
          visit_date: new Date(Date.now() - 86400000 * 1).toISOString(),
          arrival_time: '14:15',
          completion_time: '16:30',
          duration_minutes: 135,
          
          reported_issue: 'Máy tự khởi động lại liên tục, không thể sử dụng bình thường.',
          diagnosis: 'PSU không ổn định, RAM bị lỗi',
          work_performed: [
            'Test nguồn điện',
            'Kiểm tra RAM từng thanh',
            'Thay PSU',
            'Cài đặt lại hệ điều hành'
          ],
          parts_used: ['PSU 500W', 'RAM 8GB DDR4'],
          parts_cost: 1200000,
          labor_cost: 200000,
          total_cost: 1400000,
          
          status: 'completed',
          resolution_type: 'repaired',
          customer_satisfaction: 4,
          customer_feedback: 'Sửa nhanh, giá hợp lý',
          
          photos_before: ['/images/hp_before.jpg'],
          photos_after: ['/images/hp_after.jpg'],
          test_results: ['Hệ thống ổn định sau 2 giờ test', 'Stress test CPU/RAM pass'],
          warranty_claim_approved: true,
          notes: 'Khách hàng đồng ý với chi phí sửa chữa',
          internal_notes: 'PSU này đã có vấn đề từ đầu',
          
          follow_up_required: false,
          return_policy_explained: true,
          
          created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
          updated_at: new Date(Date.now() - 86400000 * 1).toISOString()
        },
        {
          id: 'HIST_003',
          warranty_id: 'WAR_003',
          visit_number: 2,
          customer_name: 'Lê Văn Cường',
          customer_phone: '0923456789',
          product_name: 'Máy in Canon PIXMA',
          product_serial: 'CN456789123',
          service_center_id: 'SC_002',
          service_center_name: 'Chi nhánh Đà Nẵng',
          technician_name: 'Phạm Minh Đức',
          technician_id: 'TECH_003',
          
          visit_date: new Date(Date.now() - 86400000 * 5).toISOString(),
          arrival_time: '10:00',
          completion_time: '10:30',
          duration_minutes: 30,
          
          reported_issue: 'Máy in vẫn bị kẹt giấy sau lần sửa trước',
          diagnosis: 'Roller cũ chưa được thay, bộ phận nhập giấy bị mòn',
          work_performed: [
            'Thay roller nhập giấy',
            'Vệ sinh toàn bộ cơ cấu',
            'Hiệu chỉnh cảm biến giấy',
            'Test in 50 trang'
          ],
          parts_used: ['Roller kit', 'Pad tách giấy'],
          parts_cost: 200000,
          labor_cost: 0, // Free under warranty
          total_cost: 200000,
          
          status: 'completed',
          resolution_type: 'repaired',
          customer_satisfaction: 3,
          customer_feedback: 'Lần này ok, nhưng lần trước sửa không kỹ',
          
          photos_before: [],
          photos_after: [],
          test_results: ['In 50 trang không kẹt', 'Chất lượng in tốt'],
          warranty_claim_approved: true,
          notes: 'Khách hàng không hài lòng về lần sửa trước',
          internal_notes: 'Cần training lại kỹ thuật viên về máy in',
          
          follow_up_required: true,
          follow_up_date: new Date(Date.now() + 86400000 * 14).toISOString(),
          return_policy_explained: true,
          
          created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
          updated_at: new Date(Date.now() - 86400000 * 5).toISOString()
        }
      ];

      setHistoryEntries(mockEntries);
    } catch (error) {
      console.error('Failed to load history entries:', error);
      toast.error('Không thể tải lịch sử xử lý');
    } finally {
      // setLoading(false);
    }
  };

  const loadStats = () => {
    const mockStats: ProcessingStats = {
      total_visits: 1284,
      avg_resolution_time: 142, // minutes
      customer_satisfaction: 4.3,
      warranty_claim_rate: 89.5,
      cost_savings: 15600000, // VND
      repeat_visit_rate: 12.4
    };
    setStats(mockStats);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'waiting_parts': return 'bg-yellow-100 text-yellow-800';
      case 'escalated': return 'bg-orange-100 text-orange-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResolutionColor = (type: string) => {
    switch (type) {
      case 'repaired': return 'bg-green-100 text-green-800';
      case 'replaced': return 'bg-blue-100 text-blue-800';
      case 'refund': return 'bg-purple-100 text-purple-800';
      case 'no_fault': return 'bg-gray-100 text-gray-800';
      case 'out_of_warranty': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const filteredEntries = historyEntries.filter(entry => {
    const matchesSearch = 
      entry.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.warranty_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.product_serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.technician_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    const matchesTechnician = technicianFilter === 'all' || entry.technician_name === technicianFilter;
    
    return matchesSearch && matchesStatus && matchesTechnician;
  });

  const handleViewDetail = (entry: WarrantyHistoryEntry) => {
    setSelectedEntry(entry);
    setShowDetailModal(true);
    setActiveTab('overview');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-xl">
            <ClipboardList className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Lịch sử xử lý bảo hành
            </h1>
            <p className="text-gray-600">
              Log chi tiết từng lần khách hàng mang sản phẩm tới, quá trình xử lý và kết quả
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Xuất báo cáo
          </Button>
          <Button variant="outline" onClick={() => setViewMode(viewMode === 'list' ? 'timeline' : 'list')}>
            {viewMode === 'list' ? <BarChart3 className="w-4 h-4 mr-2" /> : <ClipboardList className="w-4 h-4 mr-2" />}
            {viewMode === 'list' ? 'Timeline' : 'Danh sách'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {[
            { 
              label: 'Tổng lượt xử lý', 
              value: stats.total_visits.toLocaleString(), 
              color: 'bg-blue-500', 
              icon: ClipboardList,
              change: '+12.3%'
            },
            { 
              label: 'Thời gian TB', 
              value: `${Math.floor(stats.avg_resolution_time / 60)}h ${stats.avg_resolution_time % 60}m`, 
              color: 'bg-green-500', 
              icon: Timer,
              change: '-8.5%'
            },
            { 
              label: 'Hài lòng TB', 
              value: `${stats.customer_satisfaction}/5`, 
              color: 'bg-yellow-500', 
              icon: Star,
              change: '+0.2'
            },
            { 
              label: 'Tỷ lệ claim', 
              value: `${stats.warranty_claim_rate}%`, 
              color: 'bg-purple-500', 
              icon: CheckCircle,
              change: '-2.1%'
            },
            { 
              label: 'Tiết kiệm', 
              value: `${Math.round(stats.cost_savings / 1000000)}M`, 
              color: 'bg-emerald-500', 
              icon: DollarSign,
              change: '+15.7%'
            },
            { 
              label: 'Tái khám', 
              value: `${stats.repeat_visit_rate}%`, 
              color: 'bg-orange-500', 
              icon: RefreshCw,
              change: '-3.2%'
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 ${stat.color} rounded-lg`}>
                      <stat.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className={`text-xs font-medium ${
                      stat.change.startsWith('+') ? 'text-green-600' : 
                      stat.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-xs text-gray-600">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm lịch sử, khách hàng, sản phẩm, kỹ thuật viên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="completed">Hoàn thành</option>
                <option value="in_progress">Đang xử lý</option>
                <option value="waiting_parts">Chờ linh kiện</option>
                <option value="escalated">Báo cáo cấp trên</option>
                <option value="rejected">Từ chối</option>
              </select>
              <select
                value={technicianFilter}
                onChange={(e) => setTechnicianFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Tất cả kỹ thuật viên</option>
                <option value="Trần Văn Bình">Trần Văn Bình</option>
                <option value="Lê Minh Tuấn">Lê Minh Tuấn</option>
                <option value="Phạm Minh Đức">Phạm Minh Đức</option>
              </select>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Tất cả thời gian</option>
                <option value="today">Hôm nay</option>
                <option value="week">Tuần này</option>
                <option value="month">Tháng này</option>
                <option value="quarter">Quý này</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lần thăm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng & Sản phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vấn đề & Giải pháp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kỹ thuật viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kết quả
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đánh giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chi phí
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Lần {entry.visit_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          {entry.warranty_id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {entry.customer_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {entry.product_name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {entry.product_serial}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm text-gray-900 font-medium mb-1">
                          Vấn đề:
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          {entry.reported_issue}
                        </div>
                        <div className="text-sm text-gray-900 font-medium mb-1 mt-2">
                          Chẩn đoán:
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          {entry.diagnosis}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {entry.technician_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {entry.service_center_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          {formatDate(entry.visit_date)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {entry.arrival_time} - {entry.completion_time || 'Đang xử lý'}
                        </div>
                        {entry.duration_minutes && (
                          <div className="text-xs text-gray-400">
                            {Math.floor(entry.duration_minutes / 60)}h {entry.duration_minutes % 60}m
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(entry.status)}`}>
                          {entry.status === 'completed' ? 'Hoàn thành' :
                           entry.status === 'in_progress' ? 'Đang xử lý' :
                           entry.status === 'waiting_parts' ? 'Chờ linh kiện' :
                           entry.status === 'escalated' ? 'Báo cáo' : 'Từ chối'}
                        </span>
                        <div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getResolutionColor(entry.resolution_type)}`}>
                            {entry.resolution_type === 'repaired' ? 'Sửa chữa' :
                             entry.resolution_type === 'replaced' ? 'Thay thế' :
                             entry.resolution_type === 'refund' ? 'Hoàn tiền' :
                             entry.resolution_type === 'no_fault' ? 'Không lỗi' : 'Hết BH'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {renderStars(entry.customer_satisfaction)}
                        <span className="text-sm text-gray-600">
                          ({entry.customer_satisfaction})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {entry.total_cost.toLocaleString()}đ
                        </div>
                        <div className="text-xs text-gray-500">
                          Linh kiện: {entry.parts_cost.toLocaleString()}đ
                        </div>
                        <div className="text-xs text-gray-500">
                          Công: {entry.labor_cost.toLocaleString()}đ
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleViewDetail(entry)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Download className="w-4 h-4" />
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

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedEntry && (
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
              className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Lịch sử xử lý #{selectedEntry.id}
                  </h2>
                  <p className="text-gray-600">
                    {selectedEntry.customer_name} - {selectedEntry.product_name}
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setShowDetailModal(false)}>
                  <XCircle className="w-6 h-6" />
                </Button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                {[
                  { id: 'overview', label: 'Tổng quan', icon: Eye },
                  { id: 'process', label: 'Quy trình', icon: Wrench },
                  { id: 'documentation', label: 'Tài liệu', icon: FileText },
                  { id: 'feedback', label: 'Phản hồi', icon: MessageSquare }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={'flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ' + 
                      (activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700')
                    }
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Thông tin cơ bản</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Lần thăm:</span>
                            <span className="font-medium text-gray-900">{selectedEntry.visit_number}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Ngày thăm:</span>
                            <span className="font-medium text-gray-900">{formatDate(selectedEntry.visit_date)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Thời gian:</span>
                            <span className="font-medium text-gray-900">
                              {selectedEntry.arrival_time} - {selectedEntry.completion_time || 'Đang xử lý'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Thời lượng:</span>
                            <span className="font-medium text-gray-900">
                              {selectedEntry.duration_minutes ? `${Math.floor(selectedEntry.duration_minutes / 60)}h ${selectedEntry.duration_minutes % 60}m` : 'Đang xử lý'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Kỹ thuật viên:</span>
                            <span className="font-medium text-gray-900">{selectedEntry.technician_name}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Issue & Resolution */}
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Vấn đề & Giải pháp</h3>
                        <div className="space-y-3">
                          <div>
                            <span className="text-gray-600 text-sm">Vấn đề báo cáo:</span>
                            <p className="text-gray-900">
                              {selectedEntry.reported_issue || 'Không có mô tả'}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600 text-sm">Chẩn đoán:</span>
                            <p className="text-gray-900">
                              {selectedEntry.diagnosis || 'Không có chẩn đoán'}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600 text-sm">Trạng thái:</span>
                            <div className="flex gap-2 mt-1">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedEntry.status)}`}>
                                {selectedEntry.status === 'completed' ? 'Hoàn thành' :
                                 selectedEntry.status === 'in_progress' ? 'Đang xử lý' :
                                 selectedEntry.status === 'waiting_parts' ? 'Chờ linh kiện' :
                                 selectedEntry.status === 'escalated' ? 'Báo cáo' : 'Từ chối'}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getResolutionColor(selectedEntry.resolution_type)}`}>
                                {selectedEntry.resolution_type === 'repaired' ? 'Sửa chữa' :
                                 selectedEntry.resolution_type === 'replaced' ? 'Thay thế' :
                                 selectedEntry.resolution_type === 'refund' ? 'Hoàn tiền' :
                                 selectedEntry.resolution_type === 'no_fault' ? 'Không lỗi' : 'Hết BH'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Cost Breakdown */}
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Chi phí</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Linh kiện:</span>
                            <span className="font-medium text-gray-900">{selectedEntry.parts_cost ? `${Math.round(selectedEntry.parts_cost / 100).toLocaleString('vi-VN')} VND` : '0 VND'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Công:</span>
                            <span className="font-medium text-gray-900">{selectedEntry.labor_cost ? `${Math.round(selectedEntry.labor_cost / 100).toLocaleString('vi-VN')} VND` : '0 VND'}</span>
                          </div>
                          <div className="flex justify-between font-semibold border-t border-gray-200 pt-2">
                            <span className="text-gray-900">Tổng cộng:</span>
                            <span className="text-gray-900">{selectedEntry.total_cost ? `${Math.round(selectedEntry.total_cost / 100).toLocaleString('vi-VN')} VND` : '0 VND'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Còn bảo hành:</span>
                            <span className={selectedEntry.warranty_claim_approved ? 'text-green-600' : 'text-red-600'}>
                              {selectedEntry.warranty_claim_approved ? 'Được duyệt' : 'Không duyệt'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Customer Satisfaction */}
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Đánh giá khách hàng</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            {renderStars(selectedEntry.customer_satisfaction)}
                            <span className="text-lg font-medium text-gray-900">
                              {selectedEntry.customer_satisfaction}/5
                            </span>
                          </div>
                          {selectedEntry.customer_feedback && (
                            <div>
                              <span className="text-gray-600 text-sm">Phản hồi:</span>
                              <p className="text-gray-900 italic">"{selectedEntry.customer_feedback}"</p>
                            </div>
                          )}
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Follow-up:</span>
                            <span className={selectedEntry.follow_up_required ? 'text-orange-600' : 'text-green-600'}>
                              {selectedEntry.follow_up_required ? 'Cần thiết' : 'Không cần'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeTab === 'process' && (
                  <div className="space-y-6">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Công việc đã thực hiện</h3>
                        <div className="space-y-2">
                          {selectedEntry.work_performed.map((work, index) => (
                            <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="text-gray-900">
                                {work}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Linh kiện sử dụng</h3>
                        <div className="space-y-2">
                          {selectedEntry.parts_used.map((part, index) => (
                            <div key={index} className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                              <Package className="w-5 h-5 text-blue-600" />
                              <span className="text-gray-900">
                                {part}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Kết quả kiểm tra</h3>
                        <div className="space-y-2">
                          {selectedEntry.test_results.map((result, index) => (
                            <div key={index} className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="text-gray-900">
                                {result}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeTab === 'documentation' && (
                  <div className="space-y-6">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Hình ảnh trước khi sửa</h3>
                        {selectedEntry.photos_before?.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {selectedEntry.photos_before?.map((_photo, index) => (
                              <div key={index} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                                <Camera className="w-8 h-8 text-gray-400" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500">Không có hình ảnh</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Hình ảnh sau khi sửa</h3>
                        {selectedEntry.photos_after?.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {selectedEntry.photos_after?.map((_photo, index) => (
                              <div key={index} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                                <Camera className="w-8 h-8 text-gray-400" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500">Không có hình ảnh</p>
                        )}
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-4">Ghi chú công khai</h3>
                          <p className="text-gray-700">
                            {selectedEntry.notes || 'Không có ghi chú công khai'}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-4">Ghi chú nội bộ</h3>
                          <p className="text-gray-700">
                            {selectedEntry.internal_notes}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {activeTab === 'feedback' && (
                  <div className="space-y-6">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Đánh giá chi tiết</h3>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <span className="text-gray-600">Tổng thể:</span>
                            <div className="flex items-center gap-2">
                              {renderStars(selectedEntry.customer_satisfaction)}
                              <span className="text-lg font-medium text-gray-900">
                                {selectedEntry.customer_satisfaction}/5
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-gray-600 text-sm">Phản hồi chi tiết:</span>
                            <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                              <p className="text-gray-900 italic">
                                "{selectedEntry.customer_feedback || 'Không có phản hồi'}"
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Cần thiết:</span>
                              <span className={selectedEntry.follow_up_required ? 'text-orange-600' : 'text-green-600'}>
                                {selectedEntry.follow_up_required ? 'Có' : 'Không'}
                              </span>
                            </div>
                            {selectedEntry.follow_up_date && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Ngày follow-up:</span>
                                <span className="text-gray-900">{formatDate(selectedEntry.follow_up_date)}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-600">Giải thích chính sách:</span>
                              <span className={selectedEntry.return_policy_explained ? 'text-green-600' : 'text-red-600'}>
                                {selectedEntry.return_policy_explained ? 'Có' : 'Không'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                  Đóng
                </Button>
                <Button>
                  Xuất báo cáo
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WarrantyHistory;
