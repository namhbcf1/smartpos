// Vietnamese Computer Hardware POS User Management
// ComputerPOS Pro - Advanced User Management System

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users as UsersIcon,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Shield,
  User,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  Download,
  RefreshCw,
  Star,
  Award,
  TrendingUp,
  UserPlus,
  Crown
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/ButtonSimplified';
import { DataTable, Column } from '../../components/ui/DataTable';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

// Enhanced User Types
interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'admin' | 'manager' | 'cashier' | 'inventory' | 'sales_agent' | 'affiliate';
  store_id?: string;
  store_name?: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  address?: string;
  department?: string;
  position?: string;
  hire_date?: string;
  salary?: number;
  commission_rate?: number;
  permissions?: string[];
  login_attempts?: number;
  locked_until?: string;
  two_factor_enabled?: boolean;
  email_verified?: boolean;
  phone_verified?: boolean;
  performance_score?: number;
  total_sales?: number;
  worked_hours?: number;
  overtime_hours?: number;
  leave_balance?: number;
  emergency_contact?: string;
  notes?: string;
}

interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  admin_count: number;
  manager_count: number;
  cashier_count: number;
  inventory_count: number;
  sales_agent_count: number;
  affiliate_count: number;
  new_users_this_month: number;
  users_online_now: number;
  avg_performance: number;
  total_sales: number;
}


const Users: React.FC = () => {
  // Enhanced User Management State
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    total_users: 0,
    active_users: 0,
    inactive_users: 0,
    admin_count: 0,
    manager_count: 0,
    cashier_count: 0,
    inventory_count: 0,
    sales_agent_count: 0,
    affiliate_count: 0,
    new_users_this_month: 0,
    users_online_now: 0,
    avg_performance: 0,
    total_sales: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive' | 'admins' | 'performance'>('all');
  
  // Modals and forms
  const [showUserModal, setShowUserModal] = useState(false);
  
  // Form data
  const [userForm, setUserForm] = useState<Partial<User>>({});
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch users from API
      const response = await fetch(`${apiUrl}/api/v1/users?page=${currentPage}&limit=20&search=${searchQuery}&role=${filterRole}&is_active=${filterActive}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': 'default'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load users');
      }

      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users);
        setTotalUsers(data.data.pagination.total);
        setTotalPages(data.data.pagination.pages);
      } else {
        throw new Error(data.error || 'Failed to load users');
      }
    } catch (error) {
      console.error('Users loading failed:', error);
      // NO MOCK DATA - Clear state on API failure
      setUsers([]);
      setUserStats({
        total_users: 0,
        active_users: 0,
        inactive_users: 0,
        admin_count: 0,
        manager_count: 0,
        cashier_count: 0,
        inventory_count: 0,
        sales_agent_count: 0,
        affiliate_count: 0,
        new_users_this_month: 0,
        users_online_now: 0,
        avg_performance: 0,
        total_sales: 0
      });
      setTotalUsers(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Quản trị viên', color: 'red', icon: <Crown className="w-4 h-4" /> };
      case 'manager':
        return { label: 'Quản lý', color: 'orange', icon: <Shield className="w-4 h-4" /> };
      case 'cashier':
        return { label: 'Thu ngân', color: 'blue', icon: <User className="w-4 h-4" /> };
      case 'inventory':
        return { label: 'Kho hàng', color: 'green', icon: <User className="w-4 h-4" /> };
      case 'sales_agent':
        return { label: 'Kinh doanh', color: 'purple', icon: <TrendingUp className="w-4 h-4" /> };
      case 'affiliate':
        return { label: 'Cộng tác viên', color: 'yellow', icon: <UserPlus className="w-4 h-4" /> };
      default:
        return { label: role, color: 'gray', icon: <User className="w-4 h-4" /> };
    }
  };

  const formatLastLogin = (timestamp?: string) => {
    if (!timestamp) return 'Chưa đăng nhập';
    
    const now = new Date();
    const loginTime = new Date(timestamp);
    const diff = now.getTime() - loginTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} ngày trước`;
    } else if (hours > 0) {
      return `${hours} giờ trước`;
    } else {
      return 'Vừa xong';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // User table columns
  const userColumns: Column<User>[] = [
    {
      key: 'full_name',
      title: 'Người dùng',
      sortable: true,
      render: (value: string, record: User) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {value.charAt(0)}
          </div>
          <div>
            <div className="font-medium text-gray-900">{record.fullName}</div>
            <div className="text-sm text-gray-500">{record.email}</div>
            <div className="text-xs text-gray-400">@{record.username}</div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      title: 'Vai trò',
      sortable: true,
      render: (value: string) => {
        const roleConfig = getRoleDisplay(value);
        return (
          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-${roleConfig.color}-100 text-${roleConfig.color}-800  
            {roleConfig.icon}
            <span className="ml-1">{roleConfig.label}</span>
          </span>
        );
      }
    },
    {
      key: 'department',
      title: 'Phòng ban',
      sortable: true,
      render: (value: string) => (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800  rounded-full">
          {value || 'Chưa phân loại'}
        </span>
      )
    },
    {
      key: 'is_active',
      title: 'Trạng thái',
      sortable: true,
      render: (value: boolean) => (
        <span
          className={value ? 'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800' : 'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800'}
        >
          {value ? <UserCheck className="w-3 h-3 mr-1" /> : <UserX className="w-3 h-3 mr-1" />}
          {value ? 'Hoạt động' : 'Ngừng hoạt động'}
        </span>
      )
    },
    {
      key: 'performance_score',
      title: 'Hiệu suất',
      sortable: true,
      align: 'center',
      render: (value: number) => (
        <div className="flex items-center justify-center">
          <div className="w-12 h-12 relative">
            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-300">
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={value >= 90 ? 'text-green-500' : value >= 70 ? 'text-yellow-500' : 'text-red-500'}
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={value + ', 100'}
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold">{value}%</span>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'last_login_at',
      title: 'Đăng nhập cuối',
      sortable: true,
      render: (value: string) => (
        <div className="text-sm text-gray-600">
          {formatLastLogin(value)}
        </div>
      )
    },
    {
      key: 'id' as keyof User,
      title: 'Thao tác',
      align: 'center',
      render: (_: any, record: User) => (
        <div className="flex items-center justify-center space-x-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleViewUser(record)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEditUser(record)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDeleteUser(record.id)}
            className="text-red-600 hover:text-red-700">
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  // Event handlers
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setUserForm(user);
    setShowUserModal(true);
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      try {
        // API call to delete user
        setUsers(users.filter(u => u.id !== id));
        toast.success('Xóa người dùng thành công');
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Lỗi khi xóa người dùng');
      }
    }
  };

  const handleCreateUser = () => {
    setUserForm({});
    setShowUserModal(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.is_active) ||
                         (statusFilter === 'inactive' && !user.is_active);
    const matchesDepartment = departmentFilter === 'all' || user.department === departmentFilter;
    const matchesStore = true; // storeFilter === 'all' || user.store_id === storeFilter;
    
    return matchesSearch && matchesRole && matchesStatus && matchesDepartment && matchesStore;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 tải dữ liệu người dùng...</p>">
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
            <UsersIcon className="w-8 h-8 mr-3 text-blue-600" />
            Quản lý người dùng
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý toàn diện người dùng, phân quyền và hiệu suất làm việc
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={handleCreateUser}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm người dùng
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 người dùng</p>">
                <p className="text-3xl font-bold text-gray-900">
                <p className="text-sm text-green-600">
                  +{userStats.new_users_this_month} tháng này
                </p>
              </div>
              <UsersIcon className="w-12 h-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 hoạt động</p>">
                <p className="text-3xl font-bold text-gray-900">
                <p className="text-sm text-blue-600">
                  {userStats.users_online_now} đang online
                </p>
              </div>
              <UserCheck className="w-12 h-12 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 suất TB</p>">
                <p className="text-3xl font-bold text-gray-900">
                <p className="text-sm text-yellow-600">
                  Tháng này
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 doanh số</p>">
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(userStats.total_sales)}
                </p>
                <p className="text-sm text-purple-600">
                  Tháng này
                </p>
              </div>
              <Award className="w-12 h-12 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'all', label: 'Tất cả người dùng', icon: UsersIcon },
            { id: 'active', label: 'Đang hoạt động', icon: UserCheck },
            { id: 'inactive', label: 'Ngừng hoạt động', icon: UserX },
            { id: 'admins', label: 'Quản trị viên', icon: Crown },
            { id: 'performance', label: 'Hiệu suất', icon: TrendingUp }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={activeTab === tab.id
                ? 'flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors border-blue-600 text-blue-600 bg-blue-50'
                : 'flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm người dùng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ">
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
              >
                <option value="all">Tất cả vai trò</option>
                <option value="admin">Quản trị viên</option>
                <option value="manager">Quản lý</option>
                <option value="cashier">Thu ngân</option>
                <option value="inventory">Kho hàng</option>
                <option value="sales_agent">Kinh doanh</option>
                <option value="affiliate">Cộng tác viên</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Ngừng hoạt động</option>
              </select>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
              >
                <option value="all">Tất cả phòng ban</option>
                <option value="IT">IT</option>
                <option value="Bán hàng">Bán hàng</option>
                <option value="Kho">Kho</option>
                <option value="Marketing">Marketing</option>
              </select>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Xuất Excel
              </Button>
            </div>
          </div>

          {/* User Table */}
          <DataTable
            data={filteredUsers}
            columns={userColumns}
            searchable={false}
            pagination
            pageSize={20}
            className="border-0">
          />
        </div>
      </div>

      {/* User Modal */}
      <AnimatePresence>
        {showUserModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowUserModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto text-gray-900" onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900">
                  {selectedUser ? 'Chi tiết người dùng' : 'Thêm người dùng mới'}
                </h3>
              </div>
              
              <div className="p-6">
                {selectedUser ? (
                  // User Details View
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                      <div className="text-center">
                        <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-4xl mx-auto mb-4">
                          {selectedUser.full_name.charAt(0)}
                        </div>
                        <h4 className="text-xl font-bold text-gray-900">
                          {selectedUser.full_name}
                        </h4>
                        <p className="text-gray-600">
                        <p className="text-sm text-gray-500">@{selectedUser.username}</p>
                      </div>
                    </div>
                    
                    <div className="lg:col-span-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <p className="flex items-center text-gray-900">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            {selectedUser.email}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Điện thoại
                          </label>
                          <p className="flex items-center text-gray-900">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {selectedUser.phone || 'Chưa cập nhật'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phòng ban
                          </label>
                          <p className="flex items-center text-gray-900">
                            <UsersIcon className="w-4 h-4 mr-2 text-gray-400" />
                            {selectedUser.department || 'Chưa phân loại'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ngày vào làm
                          </label>
                          <p className="flex items-center text-gray-900">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            {selectedUser.hire_date ? formatDate(selectedUser.hire_date) : 'Chưa cập nhật'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Lương cơ bản
                          </label>
                          <p className="flex items-center text-gray-900">
                            <Award className="w-4 h-4 mr-2 text-gray-400" />
                            {selectedUser.salary ? formatCurrency(selectedUser.salary) : 'Chưa cập nhật'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hiệu suất
                          </label>
                          <p className="flex items-center text-gray-900">
                            <Star className="w-4 h-4 mr-2 text-gray-400" />
                            {selectedUser.performance_score || 0}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // User Form
                  <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Họ và tên *
                      </label>
                      <input
                        type="text"
                        value={userForm.full_name || ''}
                        onChange={(e) => setUserForm({...userForm, full_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                        placeholder="Nhập họ và tên"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tên đăng nhập *
                      </label>
                      <input
                        type="text"
                        value={userForm.username || ''}
                        onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                        placeholder="Nhập tên đăng nhập"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={userForm.email || ''}
                        onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                        placeholder="Nhập email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Điện thoại
                      </label>
                      <input
                        type="tel"
                        value={userForm.phone || ''}
                        onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                        placeholder="Nhập số điện thoại"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vai trò *
                      </label>
                      <select
                        value={userForm.role || ''}
                        onChange={(e) => setUserForm({...userForm, role: e.target.value as any})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                      >
                        <option value="">Chọn vai trò</option>
                        <option value="admin">Quản trị viên</option>
                        <option value="manager">Quản lý</option>
                        <option value="cashier">Thu ngân</option>
                        <option value="inventory">Kho hàng</option>
                        <option value="sales_agent">Kinh doanh</option>
                        <option value="affiliate">Cộng tác viên</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phòng ban
                      </label>
                      <select
                        value={userForm.department || ''}
                        onChange={(e) => setUserForm({...userForm, department: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                      >
                        <option value="">Chọn phòng ban</option>
                        <option value="IT">IT</option>
                        <option value="Bán hàng">Bán hàng</option>
                        <option value="Kho">Kho</option>
                        <option value="Marketing">Marketing</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lương cơ bản
                      </label>
                      <input
                        type="number"
                        value={userForm.salary || ''}
                        onChange={(e) => setUserForm({...userForm, salary: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                        placeholder="Nhập lương cơ bản"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tỷ lệ hoa hồng (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={userForm.commission_rate || ''}
                        onChange={(e) => setUserForm({...userForm, commission_rate: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                        placeholder="0.00"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Địa chỉ
                      </label>
                      <textarea
                        value={userForm.address || ''}
                        onChange={(e) => setUserForm({...userForm, address: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ">
                        placeholder="Nhập địa chỉ"
                      />
                    </div>
                  </form>
                )}
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedUser(null);
                  }}
                >
                  Hủy
                </Button>
                {!selectedUser && (
                  <Button onClick={() => {
                    // Handle save user
                    console.log('Saving user:', userForm);
                    setShowUserModal(false);
                    toast.success('Tạo người dùng thành công');
                  }}>
                    Tạo người dùng
                  </Button>
                )}
                {selectedUser && (
                  <Button onClick={() => {
                    // Handle update user
                    console.log('Updating user:', userForm);
                    setShowUserModal(false);
                    setSelectedUser(null);
                    toast.success('Cập nhật người dùng thành công');
                  }}>
                    Cập nhật
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Users;
