import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FiPlus, FiSearch, FiFilter, FiEdit2, FiTrash2, FiEye, FiMail, FiPhone, FiMapPin,
  FiUser, FiHome, FiMoreVertical, FiDownload
} from 'react-icons/fi';
import { posApi } from '../../services/api/posApi';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  is_active: number;
  createdAt: string;
  updatedAt: string;
}

// Warranty removed from this page

// Warranty types removed from this page

// Warranty types removed from this page

interface SupplierStats {
  total_suppliers: number;
  active_suppliers: number;
  inactive_suppliers: number;
  top_suppliers: Supplier[];
}

// API response for suppliers
// Response types inferred by React Query

const Suppliers: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  
  // State management
  // Removed warranty tab; this page is suppliers-only
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'status'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [hasEmailFilter, setHasEmailFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Removed warranty-related state
  const [drawerSupplier, setDrawerSupplier] = useState<Supplier | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    status: 'active' as 'active' | 'inactive',
    tax_number: '',
    website: '',
    bank_account: '',
    bank_name: '',
    notes: '',
    categories: [] as string[],
    logo_base64: ''
  });
  const [formErrors, setFormErrors] = useState<{ [k: string]: string }>({});

  const isEmailValid = (v?: string) => !v || /^(?:[^\s@]+@[^\s@]+\.[^\s@]+)$/.test(v);
  const isPhoneValid = (v?: string) => !v || /^(?:\+?\d[\d\s.-]{6,})$/.test(v);

  const validateSupplierForm = (draft: typeof formData) => {
    const errors: { [k: string]: string } = {};
    if (!draft.name) errors.name = 'Vui lòng nhập tên công ty';
    if (!draft.phone) errors.phone = 'Vui lòng nhập số điện thoại';
    if (!isPhoneValid(draft.phone)) errors.phone = 'Số điện thoại không hợp lệ';
    if (!isEmailValid(draft.email)) errors.email = 'Email không hợp lệ';
    setFormErrors(errors);
    return errors;
  };

  // Fetch suppliers
  const { data: suppliersResponse, isLoading, error } = useQuery<any>({
    queryKey: ['suppliers', searchTerm, statusFilter, currentPage, itemsPerPage, sortBy, sortDir, cityFilter, categoryFilter],
    queryFn: async () => {
      const res = await posApi.getSuppliers(
        currentPage,
        itemsPerPage,
        searchTerm,
        statusFilter,
        cityFilter !== 'all' ? cityFilter : undefined,
        categoryFilter !== 'all' ? categoryFilter : undefined
      );
      if (res.success && Array.isArray(res.data)) {
        const sorted = [...res.data].sort((a: any, b: any) => {
          const dir = sortDir === 'asc' ? 1 : -1;
          if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '') * dir;
          if (sortBy === 'status') return ((a.is_active ?? 0) - (b.is_active ?? 0)) * dir;
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
        });
        return { ...res, data: sorted } as any;
      }
      return res as any;
    },
    // v5: keepPreviousData replacement is placeholderData(keepPreviousData)
  });

  // No warranty persistence on this page

  // Calculate stats
  const supplierStats: SupplierStats = useMemo(() => {
    if (!suppliersResponse?.data) {
      return {
        total_suppliers: 0,
        active_suppliers: 0,
        inactive_suppliers: 0,
        top_suppliers: []
      };
    }

    const suppliers = suppliersResponse.data as any[];
    const total = suppliers.length;
    const active = suppliers.filter(s => s.is_active === 1).length;
    const inactive = total - active;
    const top = suppliers.slice(0, 5);

    return {
      total_suppliers: total,
      active_suppliers: active,
      inactive_suppliers: inactive,
      top_suppliers: top
    };
  }, [suppliersResponse]);

  // No warranty stats on this page

  // Create supplier mutation
  const createSupplierMutation = useMutation({
    mutationFn: (data: any) => posApi.createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setShowAddModal(false);
      resetForm();
      toast.success('Thêm nhà cung cấp thành công');
    },
    onError: (e: any) => {
      toast.error(e?.message || 'Thêm nhà cung cấp thất bại');
    }
  });

  // Update supplier mutation
  const updateSupplierMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => posApi.updateSupplier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setEditingSupplier(null);
      resetForm();
      toast.success('Cập nhật nhà cung cấp thành công');
    },
    onError: (e: any) => {
      toast.error(e?.message || 'Cập nhật nhà cung cấp thất bại');
    }
  });

  // Delete supplier mutation
  const deleteSupplierMutation = useMutation({
    mutationFn: (id: string) => posApi.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Đã xóa nhà cung cấp');
    },
    onError: (e: any) => {
      toast.error(e?.message || 'Xóa nhà cung cấp thất bại');
    }
  });

  // Helper functions
  const resetForm = () => {
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      status: 'active',
      tax_number: '',
      website: '',
      bank_account: '',
      bank_name: '',
      notes: '',
      categories: [],
      logo_base64: ''
    });
    setFormErrors({});
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name || '',
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      status: supplier.is_active === 1 ? 'active' : 'inactive',
      tax_number: (supplier as any).tax_number || '',
      website: (supplier as any).website || '',
      bank_account: (supplier as any).bank_account || '',
      bank_name: (supplier as any).bank_name || '',
      notes: (supplier as any).notes || '',
      categories: (supplier as any).categories || [],
      logo_base64: ''
    });
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateSupplierForm(formData);
    if (Object.keys(errs).length > 0) {
      toast.error('Vui lòng kiểm tra lại thông tin');
      return;
    }
    
    if (editingSupplier) {
      updateSupplierMutation.mutate({
        id: editingSupplier.id,
        data: formData
      });
    } else {
      createSupplierMutation.mutate(formData as any);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nhà cung cấp này?')) {
      deleteSupplierMutation.mutate(id);
    }
  };

  const handleSelectAll = () => {
    if (selectedSuppliers.length === (suppliersResponse?.data?.length || 0)) {
      setSelectedSuppliers([]);
    } else {
      setSelectedSuppliers((suppliersResponse?.data as any[])?.map(s => s.id) || []);
    }
  };

  const handleSelectSupplier = (id: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // No warranty helpers on this page

  // CSV export helpers
  const exportToCSV = (rows: Record<string, any>[], filename: string) => {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(',')]
      .concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Apply advanced filters locally for display
  const filteredSuppliers = useMemo(() => {
    const list = ((suppliersResponse?.data as any[]) || []).slice();
    return list.filter((s: any) => {
      if (hasEmailFilter === 'yes' && !s.email) return false;
      if (hasEmailFilter === 'no' && s.email) return false;
      const created = new Date(s.createdAt).getTime();
      if (createdFrom && created < new Date(createdFrom).getTime()) return false;
      if (createdTo && created > new Date(createdTo).getTime()) return false;
      return true;
    });
  }, [suppliersResponse, hasEmailFilter, createdFrom, createdTo]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>Lỗi khi tải dữ liệu nhà cung cấp</span>
      </div>
    );
  }

  return (
    <div className="p-0">
      {/* Sticky Topbar */}
      <div className="sticky top-0 z-30 bg-base-100/80 backdrop-blur border-b border-base-200">
        <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-10">
                <span className="text-sm font-medium">NCC</span>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Quản lý Nhà cung cấp</h1>
              <p className="text-gray-500 text-sm">Theo dõi nhà cung cấp và thông tin liên hệ</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-outline">
                <FiMoreVertical className="w-4 h-4" />
                Thêm
              </div>
              <ul tabIndex={0} className="dropdown-content z-[40] menu p-2 shadow bg-base-100 rounded-box w-56">
                <li>
                  <a onClick={() => exportToCSV((suppliersResponse?.data as any[])?.map((s: any) => ({ id: s.id, name: s.name, email: s.email || '', phone: s.phone || '', address: s.address || '', is_active: s.is_active, createdAt: s.createdAt })), 'suppliers.csv')}>
                    <FiDownload className="w-4 h-4" /> Xuất CSV nhà cung cấp
                  </a>
                </li>
                
              </ul>
            </div>
            <button 
              className="btn btn-primary" onClick={() => { setEditingSupplier(null); resetForm(); setShowAddModal(true); }}
              disabled={!isAuthenticated || (user as any)?.role === 'cashier'}
            >
              <FiPlus className="w-4 h-4" />
              Thêm nhà cung cấp
            </button>
            
          </div>
        </div>

      </div>

      {/* Stats Cards */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-figure text-primary">
            <FiHome className="w-8 h-8" />
          </div>
          <div className="stat-title">Tổng nhà cung cấp</div>
          <div className="stat-value text-primary">{supplierStats.total_suppliers}</div>
          <div className="stat-desc">Tất cả nhà cung cấp</div>
        </div>

        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-figure text-success">
            <FiUser className="w-8 h-8" />
          </div>
          <div className="stat-title">Đang hoạt động</div>
          <div className="stat-value text-success">{supplierStats.active_suppliers}</div>
          <div className="stat-desc">Nhà cung cấp tích cực</div>
        </div>

        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-figure text-warning">
            <FiUser className="w-8 h-8" />
          </div>
          <div className="stat-title">Tạm dừng</div>
          <div className="stat-value text-warning">{supplierStats.inactive_suppliers}</div>
          <div className="stat-desc">Nhà cung cấp không hoạt động</div>
        </div>

        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-figure text-info">
            <FiMail className="w-8 h-8" />
          </div>
          <div className="stat-title">Có email</div>
          <div className="stat-value text-info">
            {(suppliersResponse?.data as any[])?.filter(s => s.email).length || 0}
          </div>
          <div className="stat-desc">Nhà cung cấp có email</div>
        </div>
      </div>

      {/* Suppliers content */}
        <div className="p-4 space-y-6">
          {/* Filters */}
          <div className="bg-base-100 shadow rounded-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="form-control flex-1">
              <div className="input-group">
                <span><FiSearch className="w-4 h-4" /></span>
                <input
                  type="text"
                  placeholder="Tìm kiếm nhà cung cấp..."
                  className="input input-bordered flex-1"
                  value={searchTerm}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSearchTerm(v);
                    // Debounce 300ms by delaying page reset
                    window.clearTimeout((window as any).__suppliers_search_timer);
                    (window as any).__suppliers_search_timer = window.setTimeout(() => {
                      setCurrentPage(1);
                    }, 300);
                  }}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                className="select select-bordered"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Tạm dừng</option>
              </select>
              
              <button
                className="btn btn-outline" onClick={() => setShowFilters(!showFilters)}
              >
                <FiFilter className="w-4 h-4" />
                Bộ lọc
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="btn-group">
              <button
                className={`btn ${viewMode === 'table' ? 'btn-active' : ''}`}
                onClick={() => setViewMode('table')}
              >
                Bảng
              </button>
              <button
                className={`btn ${viewMode === 'grid' ? 'btn-active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                Lưới
              </button>
            </div>
            <div className="flex items-center gap-2">
              <select className="select select-bordered select-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                <option value="createdAt">Mới nhất</option>
                <option value="name">Tên</option>
                <option value="status">Trạng thái</option>
              </select>
              <select className="select select-bordered select-sm" value={sortDir} onChange={(e) => setSortDir(e.target.value as any)}>
                <option value="desc">Giảm dần</option>
                <option value="asc">Tăng dần</option>
              </select>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Số lượng hiển thị</span>
                </label>
                <select
                  className="select select-bordered"
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Có email</span>
                </label>
                <select className="select select-bordered" value={hasEmailFilter} onChange={(e) => setHasEmailFilter(e.target.value as any)}>
                  <option value="all">Tất cả</option>
                  <option value="yes">Chỉ có email</option>
                  <option value="no">Không có email</option>
                </select>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Ngày tạo</span>
                </label>
                <div className="flex gap-2">
                  <input type="date" className="input input-bordered" value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} />
                  <input type="date" className="input input-bordered" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} />
                </div>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Khu vực (City)</span></label>
                <select className="select select-bordered" value={cityFilter} onChange={(e) => { setCityFilter(e.target.value); setCurrentPage(1); }}>
                  <option value="all">Tất cả</option>
                  {(Array.from(new Set((((suppliersResponse?.data as any[]) || []).map(s => s.city).filter(Boolean))) as unknown as any[]) ).map((c: any) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Category/Tag</span></label>
                <select className="select select-bordered" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}>
                  <option value="all">Tất cả</option>
                  {(Array.from(new Set((((suppliersResponse?.data as any[]) || []).flatMap((s: any) => {
                    if (Array.isArray(s.categories)) return s.categories;
                    try { const parsed = JSON.parse(s.categories || '[]'); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
                  })) as unknown as any[])).filter(Boolean) as any[]).map((cat: any) => (
                    <option key={String(cat)} value={String(cat)}>{String(cat)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Bulk Actions */}
        {selectedSuppliers.length > 0 && (
          <div className="bg-info/10 border border-info/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-info font-medium">
                Đã chọn {selectedSuppliers.length} nhà cung cấp
              </span>
              <div className="flex gap-2">
                <button className="btn btn-sm btn-outline" onClick={() => {
                  const selected = (suppliersResponse?.data as any[])?.filter((s: any) => selectedSuppliers.includes(s.id)) || [];
                  exportToCSV(selected, 'selected_suppliers.csv');
                }}>
                  Xuất CSV
                </button>
                {isAuthenticated && (user as any)?.role === 'admin' && (
                  <button className="btn btn-sm btn-error" onClick={() => {
                    if (window.confirm(`Xóa ${selectedSuppliers.length} nhà cung cấp?`)) {
                      selectedSuppliers.forEach(id => deleteSupplierMutation.mutate(id));
                      setSelectedSuppliers([]);
                    }
                  }}>Xóa đã chọn</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="bg-base-100 shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table table-zebra">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={selectedSuppliers.length === (suppliersResponse?.data?.length || 0) && (suppliersResponse?.data?.length || 0) > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Nhà cung cấp</th>
                  <th>Liên hệ</th>
                  <th>Thông tin</th>
                  
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((supplier: any) => (
                  <tr key={supplier.id}>
                    <td>
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={selectedSuppliers.includes(supplier.id)}
                        onChange={() => handleSelectSupplier(supplier.id)}
                      />
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className="bg-primary text-primary-content rounded-full w-10">
                            <span className="text-sm font-medium">
                              {(supplier.name || 'N').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">{supplier.name || 'Không có tên'}</div>
                          <div className="text-sm text-gray-500">ID: {supplier.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-1">
                        {supplier.contactPerson && (
                          <div className="flex items-center gap-2 text-sm">
                            <FiUser className="w-3 h-3" />
                            {supplier.contactPerson}
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <FiPhone className="w-3 h-3" />
                            {supplier.phone}
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <FiMail className="w-3 h-3" />
                            {supplier.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {supplier.address && (
                        <div className="flex items-center gap-2 text-sm">
                          <FiMapPin className="w-3 h-3" />
                          <span className="max-w-xs truncate">{supplier.address}</span>
                        </div>
                      )}
                    </td>
                    
                    <td>
                      <div className={`badge ${supplier.is_active === 1 ? 'badge-success' : 'badge-error'}`}>
                        {supplier.is_active === 1 ? 'Hoạt động' : 'Tạm dừng'}
                      </div>
                    </td>
                    <td>
                      <div className="text-sm">
                        {formatDate(supplier.createdAt)}
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {(!isAuthenticated || (user as any)?.role !== 'cashier') && (
                          <button
                            className="btn btn-ghost btn-sm" onClick={() => handleEdit(supplier)}
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          className="btn btn-ghost btn-sm" onClick={() => setDrawerSupplier(supplier)}
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        {isAuthenticated && (user as any)?.role === 'admin' && (
                          <button
                            className="btn btn-ghost btn-sm text-error" onClick={() => handleDelete(supplier.id)}
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSuppliers.map((supplier: any) => (
            <div key={supplier.id} className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <div className="flex items-center gap-3 mb-4">
                  <div className="avatar placeholder">
                    <div className="bg-primary text-primary-content rounded-full w-12">
                      <span className="text-lg font-medium">
                        {(supplier.name || 'N').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{supplier.name || 'Không có tên'}</h3>
                    <div className={`badge badge-sm ${supplier.is_active === 1 ? 'badge-success' : 'badge-error'}`}>
                      {supplier.is_active === 1 ? 'Hoạt động' : 'Tạm dừng'}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {supplier.contactPerson && (
                    <div className="flex items-center gap-2">
                      <FiUser className="w-4 h-4" />
                      {supplier.contactPerson}
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-2">
                      <FiPhone className="w-4 h-4" />
                      {supplier.phone}
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-2">
                      <FiMail className="w-4 h-4" />
                      <span className="truncate">{supplier.email}</span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-center gap-2">
                      <FiMapPin className="w-4 h-4" />
                      <span className="truncate">{supplier.address}</span>
                    </div>
                  )}
                  {/* Bảo hành đã tách sang trang riêng */}
                </div>

                <div className="card-actions justify-end mt-4">
                  <button
                    className="btn btn-ghost btn-sm" onClick={() => handleEdit(supplier)}
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm" onClick={() => setDrawerSupplier(supplier)}
                  >
                    <FiEye className="w-4 h-4" />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm text-error" onClick={() => handleDelete(supplier.id)}
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

        {/* Pagination */}
        {suppliersResponse?.pagination && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, suppliersResponse.pagination.total)} 
              trong tổng số {suppliersResponse.pagination.total} nhà cung cấp
            </div>
            <div className="join">
              <button
                className="join-item btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                «
              </button>
              <button className="join-item btn btn-active">
                {currentPage}
              </button>
              <button
                className="join-item btn"
                disabled={currentPage >= suppliersResponse.pagination.pages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>
      

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal modal-open">
          <div className="modal-box bg-white text-gray-900">
            <h3 className="font-bold text-lg mb-4 text-gray-900">
              {editingSupplier ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-gray-700">Tên công ty *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered bg-white  text-gray-900 border-gray-300"
                  value={formData.name}
                  onChange={(e) => { const next = { ...formData, name: e.target.value }; setFormData(next); validateSupplierForm(next); }}
                  required
                />
                {formErrors.name && <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Người liên hệ</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Số điện thoại</span>
                </label>
                <input
                  type="tel"
                  className="input input-bordered"
                  value={formData.phone}
                  onChange={(e) => { const next = { ...formData, phone: e.target.value }; setFormData(next); validateSupplierForm(next); }}
                  required
                />
                {formErrors.phone && <p className="mt-1 text-xs text-red-600">{formErrors.phone}</p>}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="email"
                  className="input input-bordered"
                  value={formData.email}
                  onChange={(e) => { const next = { ...formData, email: e.target.value }; setFormData(next); validateSupplierForm(next); }}
                />
                {formErrors.email && <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Địa chỉ</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Trạng thái</span>
                </label>
                <select
                  className="select select-bordered"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Tạm dừng</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text">Mã số thuế (MST)</span></label>
                  <input type="text" className="input input-bordered"
                    value={formData.tax_number}
                    onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })} />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Website</span></label>
                  <input type="url" className="input input-bordered"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Tài khoản ngân hàng</span></label>
                  <input type="text" className="input input-bordered"
                    value={formData.bank_account}
                    onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })} />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Ngân hàng</span></label>
                  <input type="text" className="input input-bordered"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} />
                </div>
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">Ghi chú</span></label>
                <textarea className="textarea textarea-bordered"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">Logo/Giấy phép (ảnh)</span></label>
                <input type="file" accept="image/*" className="file-input file-input-bordered" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setFormData({ ...formData, logo_base64: reader.result as string });
                    reader.readAsDataURL(file);
                  }} />
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost" onClick={() => {
                    setShowAddModal(false);
                    setEditingSupplier(null);
                    resetForm();
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createSupplierMutation.isPending || updateSupplierMutation.isPending}
                >
                  {(createSupplierMutation.isPending || updateSupplierMutation.isPending) && (
                    <span className="loading loading-spinner loading-sm"></span>
                  )}
                  {editingSupplier ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Supplier Drawer */}
      {drawerSupplier && (
        <div className="drawer drawer-end drawer-open z-40">
          <input id="supplier-drawer" type="checkbox" className="drawer-toggle" checked readOnly />
          <div className="drawer-side">
            <label htmlFor="supplier-drawer" className="drawer-overlay" onClick={() => setDrawerSupplier(null)}></label>
            <div className="menu p-4 w-11/12 sm:w-[480px] min-h-full bg-base-100 text-base-content">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="avatar placeholder">
                    <div className="bg-primary text-primary-content rounded-full w-12">
                      <span className="text-lg font-medium">{(drawerSupplier.name || 'N').charAt(0).toUpperCase()}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{drawerSupplier.name}</div>
                    <div className="text-xs text-gray-500">ID: {drawerSupplier.id}</div>
                  </div>
                </div>
                <button className="btn btn-ghost" onClick={() => setDrawerSupplier(null)}>Đóng</button>
              </div>

              <div className="divider">Thông tin</div>
              <div className="space-y-2 text-sm">
                {drawerSupplier.contactPerson && <div className="flex items-center gap-2"><FiUser className="w-4 h-4" /> {drawerSupplier.contactPerson}</div>}
                {drawerSupplier.phone && <div className="flex items-center gap-2"><FiPhone className="w-4 h-4" /> {drawerSupplier.phone}</div>}
                {drawerSupplier.email && <div className="flex items-center gap-2"><FiMail className="w-4 h-4" /> {drawerSupplier.email}</div>}
                {drawerSupplier.address && <div className="flex items-center gap-2"><FiMapPin className="w-4 h-4" /> <span className="truncate">{drawerSupplier.address}</span></div>}
              </div>

              {/* Bảo hành: đã tách sang trang riêng */}
                  </div>
                </div>
                            </div>
      )}

      {/* Create Policy Modal */}
      {/* Modal bảo hành đã được loại bỏ khỏi trang Suppliers */}

      {/* Create Claim Modal */}
      {/* Modal yêu cầu bảo hành đã được loại bỏ khỏi trang Suppliers */}
    </div>
  );
};

export default Suppliers;
