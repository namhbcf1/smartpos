// Vietnamese Computer Hardware POS User Management
// ComputerPOS Pro - Production DaisyUI Implementation

import React, { useState } from 'react';
import { 
  FiUsers, 
  FiPlus, 
  FiEdit3, 
  FiTrash2, 
  FiRefreshCw,
  FiShield,
  FiUser,
  FiUserCheck,
  FiUserX
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// Vietnamese POS User Types
interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'admin' | 'manager' | 'cashier' | 'inventory';
  store_id?: string;
  is_active: boolean;
  last_login_at?: number;
  created_at: number;
  updated_at: number;
}

const Users: React.FC = () => {
  // Vietnamese User Management State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'manager' | 'cashier' | 'inventory'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Sample users data - replace with real API data
  const sampleUsers: User[] = [
    {
      id: '1',
      username: 'admin',
      email: 'admin@computerpos.vn',
      full_name: 'Nguyễn Văn Admin',
      phone: '0901234567',
      role: 'admin',
      store_id: 'store1',
      is_active: true,
      last_login_at: Date.now() - 3600000, // 1 hour ago
      created_at: Date.now() - 86400000 * 30, // 30 days ago
      updated_at: Date.now() - 3600000
    },
    {
      id: '2',
      username: 'manager',
      email: 'manager@computerpos.vn',
      full_name: 'Trần Thị Manager',
      phone: '0912345678',
      role: 'manager',
      store_id: 'store1',
      is_active: true,
      last_login_at: Date.now() - 86400000, // 1 day ago
      created_at: Date.now() - 86400000 * 20,
      updated_at: Date.now() - 86400000
    },
    {
      id: '3',
      username: 'cashier1',
      email: 'cashier1@computerpos.vn',
      full_name: 'Lê Văn Cashier',
      phone: '0923456789',
      role: 'cashier',
      store_id: 'store1',
      is_active: true,
      last_login_at: Date.now() - 7200000, // 2 hours ago
      created_at: Date.now() - 86400000 * 15,
      updated_at: Date.now() - 7200000
    }
  ];

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Quản trị viên', color: 'badge-error', icon: <FiShield /> };
      case 'manager':
        return { label: 'Quản lý', color: 'badge-warning', icon: <FiUser /> };
      case 'cashier':
        return { label: 'Thu ngân', color: 'badge-info', icon: <FiUser /> };
      case 'inventory':
        return { label: 'Kho hàng', color: 'badge-success', icon: <FiUser /> };
      default:
        return { label: role, color: 'badge-ghost', icon: <FiUser /> };
    }
  };

  const formatLastLogin = (timestamp?: number) => {
    if (!timestamp) return 'Chưa đăng nhập';
    
    const now = Date.now();
    const diff = now - timestamp;
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

  return (
    <div className="min-h-screen bg-base-200 p-4">
      {/* Header */}
      <div className="bg-base-100 rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">
            <FiUsers className="inline mr-2" />
            Quản lý người dùng
          </h1>
          <div className="flex gap-2">
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => toast('Đã làm mới danh sách người dùng', { icon: '🔄' })}
            >
              <FiRefreshCw className="mr-1" />
              Làm mới
            </button>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => setShowAddModal(true)}
            >
              <FiPlus className="mr-1" />
              Thêm người dùng
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-base-100 rounded-lg shadow-sm p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="form-control">
            <div className="input-group">
              <input
                type="text"
                placeholder="Tìm kiếm người dùng..."
                className="input input-bordered flex-1"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="btn btn-square">
                <FiUsers />
              </button>
            </div>
          </div>

          {/* Role Filter */}
          <div className="form-control">
            <select
              className="select select-bordered"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Quản trị viên</option>
              <option value="manager">Quản lý</option>
              <option value="cashier">Thu ngân</option>
              <option value="inventory">Kho hàng</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="form-control">
            <select
              className="select select-bordered"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Ngừng hoạt động</option>
            </select>
          </div>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-base-100 rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-base-content/70">Tổng người dùng</p>
              <p className="text-2xl font-bold text-primary">{sampleUsers.length}</p>
            </div>
            <FiUsers className="text-3xl text-primary/50" />
          </div>
        </div>

        <div className="bg-base-100 rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-base-content/70">Đang hoạt động</p>
              <p className="text-2xl font-bold text-success">
                {sampleUsers.filter(u => u.is_active).length}
              </p>
            </div>
            <FiUserCheck className="text-3xl text-success/50" />
          </div>
        </div>

        <div className="bg-base-100 rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-base-content/70">Quản trị viên</p>
              <p className="text-2xl font-bold text-error">
                {sampleUsers.filter(u => u.role === 'admin').length}
              </p>
            </div>
            <FiShield className="text-3xl text-error/50" />
          </div>
        </div>

        <div className="bg-base-100 rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-base-content/70">Thu ngân</p>
              <p className="text-2xl font-bold text-info">
                {sampleUsers.filter(u => u.role === 'cashier').length}
              </p>
            </div>
            <FiUser className="text-3xl text-info/50" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-base-100 rounded-lg shadow-sm">
        <div className="p-4 border-b border-base-300">
          <h2 className="text-lg font-semibold">
            Danh sách người dùng ({sampleUsers.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Vai trò</th>
                <th>Cửa hàng</th>
                <th>Trạng thái</th>
                <th>Đăng nhập cuối</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {sampleUsers.map((user) => {
                const roleDisplay = getRoleDisplay(user.role);
                return (
                  <tr key={user.id}>
                    <td>
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-sm text-base-content/70">{user.email}</div>
                        <div className="text-xs text-base-content/50">@{user.username}</div>
                      </div>
                    </td>
                    <td>
                      <div className={`badge ${roleDisplay.color}`}>
                        {roleDisplay.icon}
                        <span className="ml-1">{roleDisplay.label}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm">Cửa hàng chính</span>
                    </td>
                    <td>
                      <div className={`badge ${user.is_active ? 'badge-success' : 'badge-error'}`}>
                        {user.is_active ? <FiUserCheck className="mr-1" /> : <FiUserX className="mr-1" />}
                        {user.is_active ? 'Hoạt động' : 'Ngừng hoạt động'}
                      </div>
                    </td>
                    <td>
                      <span className="text-sm">{formatLastLogin(user.last_login_at)}</span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button 
                          className="btn btn-ghost btn-xs"
                          onClick={() => toast('Chức năng chỉnh sửa đang phát triển')}
                        >
                          <FiEdit3 />
                        </button>
                        <button 
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => toast('Chức năng xóa đang phát triển')}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Thêm người dùng mới</h3>
            
            <div className="text-center py-8">
              <FiUsers className="mx-auto text-4xl text-base-content/50 mb-4" />
              <p className="text-base-content/70">
                Chức năng thêm người dùng đang được phát triển
              </p>
            </div>

            <div className="modal-action">
              <button 
                className="btn btn-ghost"
                onClick={() => setShowAddModal(false)}
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

export default Users;
