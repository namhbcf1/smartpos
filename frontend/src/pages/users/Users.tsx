import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  Edit,
  Trash2,
  Eye,
  Shield,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/ButtonSimplified';
import { DataTable, Column } from '../../components/ui/DataTable';
import { formatDate } from '../../lib/utils';

// Types
interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  role: 'admin' | 'manager' | 'employee' | 'customer';
  status: 'active' | 'inactive' | 'pending';
  avatar?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  permissions?: string[];
}

interface UserForm {
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  role: 'admin' | 'manager' | 'employee' | 'customer';
  status: 'active' | 'inactive' | 'pending';
  password?: string;
}

interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  pending_users: number;
  admin_users: number;
  manager_users: number;
  employee_users: number;
  customer_users: number;
}

const Users: React.FC = () => {
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // UI state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState<UserForm>({
    username: '',
    email: '',
    full_name: '',
    phone: '',
    address: '',
    role: 'employee',
    status: 'active'
  });

  // Load data
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const { default: apiClient } = await import('../../services/api/client');
      const response = await apiClient.get('/users');
      if (response?.data?.success) {
        setUsers(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Không thể tải dữ liệu người dùng');
    } finally {
      setLoading(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate stats
  const userStats: UserStats = {
    total_users: users.length,
    active_users: users.filter(u => u.status === 'active').length,
    inactive_users: users.filter(u => u.status === 'inactive').length,
    pending_users: users.filter(u => u.status === 'pending').length,
    admin_users: users.filter(u => u.role === 'admin').length,
    manager_users: users.filter(u => u.role === 'manager').length,
    employee_users: users.filter(u => u.role === 'employee').length,
    customer_users: users.filter(u => u.role === 'customer').length
  };

  // Table columns
  const userColumns: Column<User>[] = [
    {
      key: 'username',
      title: 'Tên đăng nhập',
      sortable: true,
      render: (value: string, record: User) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            {record.avatar ? (
              <img src={record.avatar} alt={record.full_name} className="w-10 h-10 rounded-full" />
            ) : (
              <UsersIcon className="w-5 h-5 text-blue-600" />
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{record.full_name}</div>
          </div>
        </div>
      )
    },
    {
      key: 'email',
      title: 'Email',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{value}</span>
        </div>
      )
    },
    {
      key: 'phone',
      title: 'Số điện thoại',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <Phone className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{value || 'Chưa cập nhật'}</span>
        </div>
      )
    },
    {
      key: 'role',
      title: 'Vai trò',
      sortable: true,
      render: (value: string) => {
        const roleConfig = {
          admin: { color: 'red', text: 'Quản trị viên', icon: Shield },
          manager: { color: 'blue', text: 'Quản lý', icon: UsersIcon },
          employee: { color: 'green', text: 'Nhân viên', icon: UsersIcon },
          customer: { color: 'gray', text: 'Khách hàng', icon: UsersIcon }
        };
        const config = roleConfig[value as keyof typeof roleConfig];
        const IconComponent = config?.icon || UsersIcon;
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            <IconComponent className="w-3 h-3 mr-1" />
            {config?.text || value}
          </span>
        );
      }
    },
    {
      key: 'status',
      title: 'Trạng thái',
      sortable: true,
      render: (value: string) => {
        const statusConfig = {
          active: { color: 'green', text: 'Hoạt động', icon: CheckCircle },
          inactive: { color: 'red', text: 'Không hoạt động', icon: XCircle },
          pending: { color: 'yellow', text: 'Chờ duyệt', icon: AlertCircle }
        };
        const config = statusConfig[value as keyof typeof statusConfig];
        const IconComponent = config?.icon || AlertCircle;
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            <IconComponent className="w-3 h-3 mr-1" />
            {config?.text || value}
        </span>
        );
      }
    },
    {
      key: 'created_at',
      title: 'Ngày tạo',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{formatDate(value)}</span>
        </div>
      )
    },
    {
      key: 'last_login',
      title: 'Lần cuối đăng nhập',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{value ? formatDate(value) : 'Chưa đăng nhập'}</span>
        </div>
      )
    },
    {
      key: 'id' as keyof User,
      title: 'Thao tác',
      align: 'center',
      render: (_value: any, record: User) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedUser(record);
              setShowUserModal(true);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedUser(record);
              setUserForm({
                username: record.username,
                email: record.email,
                full_name: record.full_name,
                phone: record.phone || '',
                address: record.address || '',
                role: record.role,
                status: record.status
              });
              setShowUserModal(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDeleteUser(record.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  const handleDeleteUser = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      try {
        const { default: apiClient } = await import('../../services/api/client');
        const res = await apiClient.delete('/users/' + id);
        if (res?.data?.success) {
        setUsers(users.filter(u => u.id !== id));
        }
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 p-4">
        <div className="bg-base-100 rounded-lg shadow-sm p-8 text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4">Đang tải dữ liệu người dùng...</p>
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
          <Button onClick={loadUserData}>
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-7xl mx-auto">
      {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý người dùng</h1>
          <p className="text-gray-600">Quản lý và theo dõi tất cả người dùng trong hệ thống</p>
      </div>

      {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-sm font-medium text-gray-600">Tổng người dùng</p>
                <p className="text-3xl font-bold text-gray-900">
                    {userStats.total_users}
                  </p>
                  <p className="text-sm text-blue-600">
                    Tất cả người dùng
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
                  <p className="text-sm font-medium text-gray-600">Đang hoạt động</p>
                <p className="text-3xl font-bold text-gray-900">
                    {userStats.active_users}
                  </p>
                  <p className="text-sm text-green-600">
                    {userStats.active_users} người dùng
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
                  <p className="text-sm font-medium text-gray-600">Không hoạt động</p>
                <p className="text-3xl font-bold text-gray-900">
                    {userStats.inactive_users}
                  </p>
                  <p className="text-sm text-red-600">
                    Cần kiểm tra
                </p>
              </div>
                <XCircle className="w-12 h-12 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-sm font-medium text-gray-600">Chờ duyệt</p>
                <p className="text-3xl font-bold text-gray-900">
                    {userStats.pending_users}
                </p>
                  <p className="text-sm text-orange-600">
                    Cần xử lý
                </p>
              </div>
                <AlertCircle className="w-12 h-12 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Main Content */}
        <Card>
          <CardContent className="p-6">
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="admin">Quản trị viên</option>
                <option value="manager">Quản lý</option>
                  <option value="employee">Nhân viên</option>
                  <option value="customer">Khách hàng</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                  <option value="pending">Chờ duyệt</option>
              </select>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Xuất Excel
              </Button>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Thêm người dùng
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
              className="border-0"
          />
          </CardContent>
        </Card>
      </div>

      {/* User Detail Modal */}
      <AnimatePresence>
        {showUserModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowUserModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Chi tiết người dùng
                  </h2>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
              </div>
              
              <div className="p-6">
                {selectedUser ? (
                  // User Details View
                    <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                          <div className="space-y-4">
                            <div>
                        <h4 className="text-xl font-bold text-gray-900">
                          {selectedUser.full_name}
                        </h4>
                              <p className="text-gray-600 mt-2">{selectedUser.email}</p>
                    </div>
                    
                            <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Tên đăng nhập
                          </label>
                                <p className="text-gray-900">{selectedUser.username}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Vai trò
                          </label>
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                  {selectedUser.role}
                                </span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Trạng thái
                          </label>
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                  {selectedUser.status}
                                </span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Số điện thoại
                          </label>
                                <p className="text-gray-900">{selectedUser.phone || 'Chưa cập nhật'}</p>
                              </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                                Địa chỉ
                          </label>
                              <p className="text-gray-900">{selectedUser.address || 'Chưa cập nhật'}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="lg:col-span-1">
                          <div className="space-y-4">
                            <div>
                              <h5 className="font-medium text-gray-800 mb-3">Thông tin bổ sung</h5>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Ngày tạo:</span>
                                  <span>{formatDate(selectedUser.created_at)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Cập nhật cuối:</span>
                                  <span>{formatDate(selectedUser.updated_at)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Lần cuối đăng nhập:</span>
                                  <span>{selectedUser.last_login ? formatDate(selectedUser.last_login) : 'Chưa đăng nhập'}</span>
                                </div>
                              </div>
                        </div>

                        <div>
                              <h5 className="font-medium text-gray-800 mb-3">Thao tác</h5>
                              <div className="space-y-2">
                                <Button className="w-full" variant="outline">
                                  <Edit className="w-4 h-4 mr-2" />
                                  Chỉnh sửa
                                </Button>
                                <Button className="w-full" variant="outline">
                                  <Shield className="w-4 h-4 mr-2" />
                                  Phân quyền
                                </Button>
                                <Button className="w-full" variant="outline">
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Reset mật khẩu
                                </Button>
                              </div>
                            </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // User Form
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tên đăng nhập *
                      </label>
                      <input
                        type="text"
                            value={userForm.username}
                        onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập tên đăng nhập"
                      />
                    </div>
                        
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                            value={userForm.email}
                        onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập email"
                      />
                    </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Họ và tên *
                          </label>
                          <input
                            type="text"
                            value={userForm.full_name}
                            onChange={(e) => setUserForm({...userForm, full_name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Nhập họ và tên"
                          />
                        </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                            Số điện thoại
                      </label>
                      <input
                        type="tel"
                        value={userForm.phone || ''}
                        onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập số điện thoại"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                            Vai trò
                      </label>
                      <select
                            value={userForm.role}
                        onChange={(e) => setUserForm({...userForm, role: e.target.value as any})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="admin">Quản trị viên</option>
                        <option value="manager">Quản lý</option>
                            <option value="employee">Nhân viên</option>
                            <option value="customer">Khách hàng</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                            Trạng thái
                      </label>
                      <select
                            value={userForm.status}
                            onChange={(e) => setUserForm({...userForm, status: e.target.value as any})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="active">Hoạt động</option>
                            <option value="inactive">Không hoạt động</option>
                            <option value="pending">Chờ duyệt</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Địa chỉ
                      </label>
                      <textarea
                        value={userForm.address || ''}
                        onChange={(e) => setUserForm({...userForm, address: e.target.value})}
                        rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập địa chỉ"
                      />
                    </div>

                        {!selectedUser && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Mật khẩu *
                            </label>
                            <input
                              type="password"
                              value={userForm.password || ''}
                              onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="Nhập mật khẩu"
                            />
                          </div>
                )}
              </div>
              
                      <div className="flex justify-end space-x-3">
                        <Button variant="outline" onClick={() => setShowUserModal(false)}>
                  Hủy
                </Button>
                {selectedUser && (
                          <Button onClick={async () => {
                            try {
                              const { default: apiClient } = await import('../../services/api/client');
                              const userId = (selectedUser as any)?.id || '0';
                              const res = await apiClient.put('/users/' + userId, userForm);
                              if (res?.data?.success) {
                                loadUserData();
                    setShowUserModal(false);
                    setSelectedUser(null);
                              }
                            } catch (error) {
                              console.error('Error updating user:', error);
                            }
                  }}>
                    Cập nhật
                  </Button>
                )}
                        {!selectedUser && (
                          <Button onClick={async () => {
                            try {
                              const { default: apiClient } = await import('../../services/api/client');
                              const res = await apiClient.post('/users', userForm);
                              if (res?.data?.success) {
                                loadUserData();
                                setShowUserModal(false);
                                setUserForm({
                                  username: '',
                                  email: '',
                                  full_name: '',
                                  phone: '',
                                  address: '',
                                  role: 'employee',
                                  status: 'active'
                                });
                              }
                            } catch (error) {
                              console.error('Error creating user:', error);
                            }
                          }}>
                            Tạo người dùng
                          </Button>
                        )}
                      </div>
                    </div>
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

export default Users;
