// Vietnamese Customer Management
// ComputerPOS Pro - Production DaisyUI Implementation

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiSearch,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiUsers,
  FiPhone,
  FiMail,
  FiMapPin,
  FiStar,
  FiDollarSign,
  FiRefreshCw,
  FiUserCheck
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import apiClient from '../services/api';
import { formatVND } from '../utils/currency';

// Vietnamese Customer Types
interface Customer {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  address?: string;
  customer_type: 'individual' | 'business';
  tax_number?: string;
  loyalty_points: number;
  total_spent: number; // VND cents
  is_active: boolean;
  notes?: string;
  created_at: number;
  updated_at: number;
}

const Customers: React.FC = () => {
  const queryClient = useQueryClient();

  // Vietnamese Customer Management State
  const [searchTerm, setSearchTerm] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<'all' | 'individual' | 'business'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form state for add/edit customer
  const [customerForm, setCustomerForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    customer_type: 'individual' as 'individual' | 'business',
    tax_number: '',
    notes: ''
  });

  // Fetch customers with Vietnamese filters
  const { data: customers = [], isLoading: isLoadingCustomers, refetch: refetchCustomers } = useQuery({
    queryKey: ['customers', searchTerm, customerTypeFilter],
    queryFn: async () => {
      try {
        const params: any = {
          is_active: true,
          limit: 100
        };

        if (searchTerm) params.search = searchTerm;
        if (customerTypeFilter !== 'all') params.customer_type = customerTypeFilter;

        const response = await apiClient.get('/api/v1/customers', { params });
        return response.data?.data || [];
      } catch (error) {
        console.error('Customers fetch error:', error);
        toast.error('Lỗi tải danh sách khách hàng');
        return [];
      }
    }
  });

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: any) => {
      const response = await apiClient.post('/api/v1/customers', customerData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Tạo khách hàng thành công');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowAddModal(false);
      resetCustomerForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi tạo khách hàng');
    }
  });

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, ...customerData }: any) => {
      const response = await apiClient.put(`/api/v1/customers/${id}`, customerData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Cập nhật khách hàng thành công');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowEditModal(false);
      setSelectedCustomer(null);
      resetCustomerForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi cập nhật khách hàng');
    }
  });

  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const response = await apiClient.delete(`/api/v1/customers/${customerId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Xóa khách hàng thành công');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi xóa khách hàng');
    }
  });

  // Reset customer form
  const resetCustomerForm = () => {
    setCustomerForm({
      full_name: '',
      phone: '',
      email: '',
      address: '',
      customer_type: 'individual',
      tax_number: '',
      notes: ''
    });
  };

  // Handle add customer
  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    resetCustomerForm();
    setShowAddModal(true);
  };

  // Handle edit customer
  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerForm({
      full_name: customer.full_name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      customer_type: customer.customer_type,
      tax_number: customer.tax_number || '',
      notes: customer.notes || ''
    });
    setShowEditModal(true);
  };

  // Handle delete customer
  const handleDeleteCustomer = (customer: Customer) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa khách hàng "${customer.full_name}"?`)) {
      deleteCustomerMutation.mutate(customer.id);
    }
  };

  // Handle form submit
  const handleSubmitCustomer = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedCustomer) {
      updateCustomerMutation.mutate({ id: selectedCustomer.id, ...customerForm });
    } else {
      createCustomerMutation.mutate(customerForm);
    }
  };

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer: Customer) => {
      if (customerTypeFilter !== 'all' && customer.customer_type !== customerTypeFilter) {
        return false;
      }
      return true;
    });
  }, [customers, customerTypeFilter]);

  return (
    <div className="min-h-screen bg-base-200 p-4">
      {/* Header */}
      <div className="bg-base-100 rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">
            <FiUsers className="inline mr-2" />
            Quản lý khách hàng
          </h1>
          <div className="flex gap-2">
            <button
              className="btn btn-primary btn-sm"
              onClick={handleAddCustomer}
            >
              <FiPlus className="mr-1" />
              Thêm khách hàng
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
                placeholder="Tìm kiếm khách hàng..."
                className="input input-bordered flex-1"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="btn btn-square">
                <FiSearch />
              </button>
            </div>
          </div>

          {/* Customer Type Filter */}
          <div className="form-control">
            <select
              className="select select-bordered"
              value={customerTypeFilter}
              onChange={(e) => setCustomerTypeFilter(e.target.value as 'all' | 'individual' | 'business')}
            >
              <option value="all">Tất cả loại khách hàng</option>
              <option value="individual">Khách hàng cá nhân</option>
              <option value="business">Khách hàng doanh nghiệp</option>
            </select>
          </div>

          {/* Refresh Button */}
          <div className="form-control">
            <button
              className="btn btn-outline"
              onClick={() => refetchCustomers()}
              disabled={isLoadingCustomers}
            >
              <FiRefreshCw className={`mr-1 ${isLoadingCustomers ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* Customer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-base-100 rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-base-content/70">Tổng khách hàng</p>
              <p className="text-2xl font-bold text-primary">{customers.length}</p>
            </div>
            <FiUsers className="text-3xl text-primary/50" />
          </div>
        </div>

        <div className="bg-base-100 rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-base-content/70">Khách cá nhân</p>
              <p className="text-2xl font-bold text-info">
                {customers.filter((c: Customer) => c.customer_type === 'individual').length}
              </p>
            </div>
            <FiUserCheck className="text-3xl text-info/50" />
          </div>
        </div>

        <div className="bg-base-100 rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-base-content/70">Khách doanh nghiệp</p>
              <p className="text-2xl font-bold text-success">
                {customers.filter((c: Customer) => c.customer_type === 'business').length}
              </p>
            </div>
            <FiDollarSign className="text-3xl text-success/50" />
          </div>
        </div>

        <div className="bg-base-100 rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-base-content/70">Tổng điểm thưởng</p>
              <p className="text-2xl font-bold text-warning">
                {customers.reduce((sum: number, c: Customer) => sum + c.loyalty_points, 0).toLocaleString()}
              </p>
            </div>
            <FiStar className="text-3xl text-warning/50" />
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-base-100 rounded-lg shadow-sm">
        <div className="p-4 border-b border-base-300">
          <h2 className="text-lg font-semibold">
            Danh sách khách hàng ({filteredCustomers.length})
          </h2>
        </div>

        {isLoadingCustomers ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-8 text-base-content/50">
            <FiUsers className="mx-auto text-4xl mb-2" />
            <p>Không tìm thấy khách hàng nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Liên hệ</th>
                  <th>Loại</th>
                  <th>Điểm thưởng</th>
                  <th>Tổng chi tiêu</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer: Customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div>
                        <div className="font-medium">{customer.full_name}</div>
                        {customer.address && (
                          <div className="text-sm text-base-content/70 flex items-center">
                            <FiMapPin className="mr-1" />
                            {customer.address}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="space-y-1">
                        {customer.phone && (
                          <div className="text-sm flex items-center">
                            <FiPhone className="mr-1" />
                            {customer.phone}
                          </div>
                        )}
                        {customer.email && (
                          <div className="text-sm flex items-center">
                            <FiMail className="mr-1" />
                            {customer.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={`badge ${
                        customer.customer_type === 'business' ? 'badge-success' : 'badge-info'
                      }`}>
                        {customer.customer_type === 'business' ? 'Doanh nghiệp' : 'Cá nhân'}
                      </div>
                      {customer.tax_number && (
                        <div className="text-xs text-base-content/50 mt-1">
                          MST: {customer.tax_number}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center">
                        <FiStar className="text-warning mr-1" />
                        <span className="font-medium">{customer.loyalty_points.toLocaleString()}</span>
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-success">
                        {formatVND(customer.total_spent)}
                      </div>
                    </td>
                    <td>
                      <div className={`badge ${customer.is_active ? 'badge-success' : 'badge-error'}`}>
                        {customer.is_active ? 'Hoạt động' : 'Ngừng hoạt động'}
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => handleEditCustomer(customer)}
                        >
                          <FiEdit3 />
                        </button>
                        <button
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => handleDeleteCustomer(customer)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Customer Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              {selectedCustomer ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
            </h3>

            <form onSubmit={handleSubmitCustomer}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Họ và tên *</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={customerForm.full_name}
                    onChange={(e) => setCustomerForm({...customerForm, full_name: e.target.value})}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Loại khách hàng</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={customerForm.customer_type}
                    onChange={(e) => setCustomerForm({...customerForm, customer_type: e.target.value as 'individual' | 'business'})}
                  >
                    <option value="individual">Cá nhân</option>
                    <option value="business">Doanh nghiệp</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Số điện thoại</span>
                  </label>
                  <input
                    type="tel"
                    className="input input-bordered"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    className="input input-bordered"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
                  />
                </div>

                {customerForm.customer_type === 'business' && (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Mã số thuế</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={customerForm.tax_number}
                      onChange={(e) => setCustomerForm({...customerForm, tax_number: e.target.value})}
                    />
                  </div>
                )}
              </div>

              <div className="form-control mt-4">
                <label className="label">
                  <span className="label-text">Địa chỉ</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-20"
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({...customerForm, address: e.target.value})}
                  placeholder="Địa chỉ khách hàng..."
                />
              </div>

              <div className="form-control mt-4">
                <label className="label">
                  <span className="label-text">Ghi chú</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-20"
                  value={customerForm.notes}
                  onChange={(e) => setCustomerForm({...customerForm, notes: e.target.value})}
                  placeholder="Ghi chú về khách hàng..."
                />
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedCustomer(null);
                    resetCustomerForm();
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createCustomerMutation.isPending || updateCustomerMutation.isPending}
                >
                  {(createCustomerMutation.isPending || updateCustomerMutation.isPending) ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    selectedCustomer ? 'Cập nhật' : 'Thêm mới'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
