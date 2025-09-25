// Service Centers Management
// Manage warranty service centers, branches and contact information

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Plus,
  Search,
  Edit,
  Eye,
  MapPin,
  Phone,
  Clock,
  Users,
  Star,
  CheckCircle,
  XCircle,
  Navigation,
  Calendar,
  TrendingUp,
  Award
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/ButtonSimplified';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';
import { posApi } from '../../services/api/posApi';

interface ServiceCenter {
  id: string;
  name: string;
  type: 'main' | 'branch' | 'authorized' | 'partner';
  status: 'active' | 'inactive' | 'maintenance';
  address: string;
  city: string;
  district: string;
  phone: string;
  email: string;
  website?: string;
  manager_name: string;
  manager_phone: string;
  operating_hours: {
    weekdays: string;
    weekends: string;
    holidays: string;
  };
  services: string[];
  specialties: string[];
  capacity_per_day: number;
  current_workload: number;
  rating: number;
  total_reviews: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  established_date: string;
  last_inspection: string;
  certification: string[];
  warranty_brands: string[];
  stats: {
    total_repairs: number;
    completed_this_month: number;
    customer_satisfaction: number;
    average_repair_time: number;
  };
}

const ServiceCenters: React.FC = () => {
  const [centers, setCenters] = useState<ServiceCenter[]>([]);
  const [_loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCenter, setSelectedCenter] = useState<ServiceCenter | null>(null);
  const [showCenterModal, setShowCenterModal] = useState(false);
  const [_showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    loadServiceCenters();
  }, []);

  const loadServiceCenters = async () => {
    setLoading(true);
    try {
      const res: any = await (posApi as any).request?.('/warranty/service-centers');
      const list = res?.data || res?.data?.data || [];
      const normalized: ServiceCenter[] = list.map((c: any, i: number) => ({
        id: c.id || `SC_${i + 1}`,
        name: c.name || '',
        type: (c.type || 'main'),
        status: (c.status || 'active'),
        address: c.address || '',
        city: c.city || '',
        district: c.district || '',
        phone: c.phone || '',
        email: c.email || '',
        website: c.website || '',
        manager_name: c.manager_name || c.managerName || '',
        manager_phone: c.manager_phone || c.managerPhone || '',
        operating_hours: c.operating_hours || { weekdays: '8:00 - 18:00', weekends: '8:00 - 17:00', holidays: '9:00 - 16:00' },
        services: c.services || [],
        specialties: c.specialties || [],
        capacity_per_day: c.capacity_per_day || 0,
        current_workload: c.current_workload || 0,
        rating: c.rating || 0,
        total_reviews: c.total_reviews || 0,
        coordinates: c.coordinates,
        established_date: c.established_date || new Date().toISOString(),
        last_inspection: c.last_inspection || new Date().toISOString(),
        certification: c.certification || [],
        warranty_brands: c.warranty_brands || [],
        stats: c.stats || { total_repairs: 0, completed_this_month: 0, customer_satisfaction: 0, average_repair_time: 0 }
      }));
      setCenters(normalized);
    } catch (error) {
      console.error('Failed to load service centers:', error);
      toast.error('Không thể tải danh sách trung tâm bảo hành');
      setCenters([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'main': return 'bg-blue-100 text-blue-800';
      case 'branch': return 'bg-purple-100 text-purple-800';
      case 'authorized': return 'bg-indigo-100 text-indigo-800';
      case 'partner': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getWorkloadColor = (current: number, capacity: number) => {
    const percentage = (current / capacity) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-orange-600';
    return 'text-green-600';
  };

  const filteredCenters = centers.filter(center => {
    const matchesSearch = 
      center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      center.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      center.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      center.manager_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || center.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || center.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleViewCenter = (center: ServiceCenter) => {
    setSelectedCenter(center);
    setShowCenterModal(true);
    setActiveTab('info');
  };

  const handleCreateCenter = () => {
    setShowCreateModal(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded-xl">
            <Building2 className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Trung tâm bảo hành
            </h1>
            <p className="text-gray-600">
              Quản lý danh sách trung tâm bảo hành, chi nhánh và thông tin liên hệ
            </p>
          </div>
        </div>
        <Button onClick={handleCreateCenter} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Thêm trung tâm
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { 
            label: 'Tổng trung tâm', 
            value: centers.length, 
            color: 'bg-blue-500', 
            icon: Building2,
            detail: `${centers.filter(c => c.status === 'active').length} đang hoạt động`
          },
          { 
            label: 'Công suất/ngày', 
            value: centers.reduce((sum, c) => sum + c.capacity_per_day, 0), 
            color: 'bg-green-500', 
            icon: Users,
            detail: `${centers.reduce((sum, c) => sum + c.current_workload, 0)} đang xử lý`
          },
          { 
            label: 'Đánh giá TB', 
            value: (centers.reduce((sum, c) => sum + c.rating, 0) / centers.length).toFixed(1), 
            color: 'bg-yellow-500', 
            icon: Star,
            detail: `${centers.reduce((sum, c) => sum + c.total_reviews, 0)} đánh giá`
          },
          { 
            label: 'Hoàn thành T.này', 
            value: centers.reduce((sum, c) => sum + c.stats.completed_this_month, 0), 
            color: 'bg-purple-500', 
            icon: TrendingUp,
            detail: 'Tăng 12% so với tháng trước'
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
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                <p className="text-xs text-gray-500">{stat.detail}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm trung tâm, thành phố, quản lý..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Tất cả loại hình</option>
                <option value="main">Trung tâm chính</option>
                <option value="branch">Chi nhánh</option>
                <option value="authorized">Ủy quyền</option>
                <option value="partner">Đối tác</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Ngừng hoạt động</option>
                <option value="maintenance">Bảo trì</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Centers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCenters.map((center, index) => (
          <motion.div
            key={center.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => handleViewCenter(center)}>
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {center.name}
                    </h3>
                    <div className="flex gap-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(center.type)}`}>
                        {center.type === 'main' ? 'Trung tâm chính' :
                         center.type === 'branch' ? 'Chi nhánh' :
                         center.type === 'authorized' ? 'Ủy quyền' : 'Đối tác'}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(center.status)}`}>
                        {center.status === 'active' ? 'Hoạt động' :
                         center.status === 'inactive' ? 'Ngừng' : 'Bảo trì'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{center.address}, {center.city}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{center.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>Quản lý: {center.manager_name}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">{center.rating}</p>
                    <p className="text-xs text-gray-600">Đánh giá</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className={`text-lg font-bold ${getWorkloadColor(center.current_workload, center.capacity_per_day)}`}>
                      {Math.round((center.current_workload / center.capacity_per_day) * 100)}%
                    </p>
                    <p className="text-xs text-gray-600">Công suất</p>
                  </div>
                </div>

                {/* Workload Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Khối lượng công việc</span>
                    <span>{center.current_workload}/{center.capacity_per_day}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        center.current_workload / center.capacity_per_day >= 0.9 ? 'bg-red-500' :
                        center.current_workload / center.capacity_per_day >= 0.7 ? 'bg-orange-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((center.current_workload / center.capacity_per_day) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Specialties */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Chuyên môn:</p>
                  <div className="flex flex-wrap gap-1">
                    {center.specialties.slice(0, 3).map((specialty, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {specialty}
                      </span>
                    ))}
                    {center.specialties.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        +{center.specialties.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={(e) => {
                    e.stopPropagation();
                    handleViewCenter(center);
                  }}>
                    <Eye className="w-4 h-4 mr-1" />
                    Xem
                  </Button>
                  <Button size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
                    <Edit className="w-4 h-4 mr-1" />
                    Sửa
                  </Button>
                  <Button size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
                    <Navigation className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Service Center Detail Modal */}
      <AnimatePresence>
        {showCenterModal && selectedCenter && (
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
                    {selectedCenter.name}
                  </h2>
                  <div className="flex gap-2 mt-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(selectedCenter.type)}`}>
                      {selectedCenter.type === 'main' ? 'Trung tâm chính' :
                       selectedCenter.type === 'branch' ? 'Chi nhánh' :
                       selectedCenter.type === 'authorized' ? 'Ủy quyền' : 'Đối tác'}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedCenter.status)}`}>
                      {selectedCenter.status === 'active' ? 'Hoạt động' :
                       selectedCenter.status === 'inactive' ? 'Ngừng' : 'Bảo trì'}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" onClick={() => setShowCenterModal(false)}>
                  <XCircle className="w-6 h-6" />
                </Button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                {[
                  { id: 'info', label: 'Thông tin', icon: Building2 },
                  { id: 'services', label: 'Dịch vụ', icon: Award },
                  { id: 'stats', label: 'Thống kê', icon: TrendingUp },
                  { id: 'schedule', label: 'Lịch làm việc', icon: Calendar }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'  
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {activeTab === 'info' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Contact Information */}
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Thông tin liên hệ
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Địa chỉ:</span>
                            <span className="font-medium text-gray-900 text-right">
                              {selectedCenter.address}<br />
                              {selectedCenter.district}, {selectedCenter.city}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Điện thoại:</span>
                            <span className="font-medium text-gray-900">{selectedCenter.phone}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Email:</span>
                            <span className="font-medium text-gray-900">{selectedCenter.email}</span>
                          </div>
                          {selectedCenter.website && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Website:</span>
                              <a href={selectedCenter.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                                {selectedCenter.website}
                              </a>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Manager Information */}
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Quản lý trung tâm
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Họ tên:</span>
                            <span className="font-medium text-gray-900">{selectedCenter.manager_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Điện thoại:</span>
                            <span className="font-medium text-gray-900">{selectedCenter.manager_phone}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Ngày thành lập:</span>
                            <span className="font-medium text-gray-900">{formatDate(selectedCenter.established_date)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Kiểm tra cuối:</span>
                            <span className="font-medium text-gray-900">{formatDate(selectedCenter.last_inspection)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Capacity & Workload */}
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Công suất & Khối lượng
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Công suất/ngày:</span>
                            <span className="font-medium text-gray-900">{selectedCenter.capacity_per_day}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Đang xử lý:</span>
                            <span className={`font-medium ${getWorkloadColor(selectedCenter.current_workload, selectedCenter.capacity_per_day)}`}>
                              {selectedCenter.current_workload}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tỷ lệ sử dụng:</span>
                            <span className={`font-medium ${getWorkloadColor(selectedCenter.current_workload, selectedCenter.capacity_per_day)}`}>
                              {Math.round((selectedCenter.current_workload / selectedCenter.capacity_per_day) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className={`h-3 rounded-full ${
                                selectedCenter.current_workload / selectedCenter.capacity_per_day >= 0.9 ? 'bg-red-500' :
                                selectedCenter.current_workload / selectedCenter.capacity_per_day >= 0.7 ? 'bg-orange-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min((selectedCenter.current_workload / selectedCenter.capacity_per_day) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Rating & Reviews */}
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Star className="w-4 h-4" />
                          Đánh giá khách hàng
                        </h3>
                        <div className="text-center">
                          <div className="text-4xl font-bold text-gray-900 mb-2">
                            {selectedCenter.rating}
                          </div>
                          <div className="flex justify-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-5 h-5 ${
                                  star <= selectedCenter.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300' 
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-gray-600">
                            {selectedCenter.total_reviews} đánh giá
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeTab === 'services' && (
                  <div className="space-y-6">
                    {/* Services */}
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Dịch vụ cung cấp</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {selectedCenter.services.map((service, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-gray-900">{service}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Specialties */}
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Thương hiệu chuyên môn</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedCenter.specialties.map((specialty, index) => (
                            <span key={index} className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium">
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Warranty Brands */}
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Thương hiệu bảo hành</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedCenter.warranty_brands.map((brand, index) => (
                            <span key={index} className="px-3 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
                              {brand}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Certifications */}
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Chứng nhận</h3>
                        <div className="space-y-2">
                          {selectedCenter.certification.map((cert, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                              <Award className="w-4 h-4 text-amber-600" />
                              <span className="text-sm text-gray-900">{cert}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeTab === 'stats' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Performance Stats */}
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Hiệu suất hoạt động</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Tổng sửa chữa:</span>
                            <span className="text-2xl font-bold text-gray-900">
                              {selectedCenter.stats.total_repairs.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Hoàn thành tháng này:</span>
                            <span className="text-2xl font-bold text-green-600">
                              {selectedCenter.stats.completed_this_month}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Hài lòng khách hàng:</span>
                            <span className="text-2xl font-bold text-blue-600">
                              {selectedCenter.stats.customer_satisfaction}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Thời gian sửa TB:</span>
                            <span className="text-2xl font-bold text-purple-600">
                              {selectedCenter.stats.average_repair_time} ngày
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Monthly Progress */}
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Tiến độ tháng này</h3>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Mục tiêu tháng</span>
                              <span className="text-gray-900">
                                {selectedCenter.stats.completed_this_month}/800
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${(selectedCenter.stats.completed_this_month / 800) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Hài lòng khách hàng</span>
                              <span className="text-gray-900">
                                {selectedCenter.stats.customer_satisfaction}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${selectedCenter.stats.customer_satisfaction}%` }}
                              ></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Công suất sử dụng</span>
                              <span className="text-gray-900">
                                {Math.round((selectedCenter.current_workload / selectedCenter.capacity_per_day) * 100)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  selectedCenter.current_workload / selectedCenter.capacity_per_day >= 0.9 ? 'bg-red-500' :
                                  selectedCenter.current_workload / selectedCenter.capacity_per_day >= 0.7 ? 'bg-orange-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${(selectedCenter.current_workload / selectedCenter.capacity_per_day) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeTab === 'schedule' && (
                  <div className="space-y-6">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Giờ làm việc</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                            <h4 className="font-medium text-gray-900 mb-1">Ngày thường</h4>
                            <p className="text-sm text-gray-600">
                              {selectedCenter.operating_hours.weekdays}
                            </p>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <Clock className="w-6 h-6 text-green-600 mx-auto mb-2" />
                            <h4 className="font-medium text-gray-900 mb-1">Cuối tuần</h4>
                            <p className="text-sm text-gray-600">
                              {selectedCenter.operating_hours.weekends}
                            </p>
                          </div>
                          <div className="text-center p-4 bg-orange-50 rounded-lg">
                            <Clock className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                            <h4 className="font-medium text-gray-900 mb-1">Ngày lễ</h4>
                            <p className="text-sm text-gray-600">
                              {selectedCenter.operating_hours.holidays}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Map placeholder */}
                    {selectedCenter.coordinates && (
                      <Card>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-4">Vị trí</h3>
                          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-600">
                                Bản đồ: {selectedCenter.coordinates.lat}, {selectedCenter.coordinates.lng}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {selectedCenter.address}, {selectedCenter.city}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <Button variant="outline" onClick={() => setShowCenterModal(false)}>
                  Đóng
                </Button>
                <Button>
                  Chỉnh sửa
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ServiceCenters;
