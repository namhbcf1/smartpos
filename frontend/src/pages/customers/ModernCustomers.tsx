import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Mail,
  Phone,
  MapPin,
  Star,
  Crown,
  Award,
  TrendingUp,
  Download,
  Upload
} from 'lucide-react';
import { 
  Card, 
  PageHeader, 
  Grid, 
  Section, 
  EmptyState,
  LoadingSpinner 
} from '../../components/ui/DesignSystem';
import { Button } from '../../components/ui/ButtonSimplified';
import { formatCurrency } from '../../lib/utils';
import apiClient from '../../services/api/client';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  address?: string;
  customer_type: 'individual' | 'business';
  loyalty_points: number;
  total_spent: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_purchase_date?: string;
  purchase_count?: number;
  average_order_value?: number;
  customer_tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

const ModernCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Partial<Customer> | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/customers');
      if (response.data.success) {
        // Transform API data to match our interface
        const customersData = response.data.data || [];
        const transformedCustomers = customersData.map((customer: any) => ({
          id: customer.id || '',
          full_name: customer.name || customer.full_name || '',
          phone: customer.phone || '',
          email: customer.email || '',
          address: customer.address || '',
          customer_type: customer.customer_type || 'individual',
          loyalty_points: customer.loyalty_points || 0,
          total_spent: customer.total_spent || 0,
          is_active: customer.is_active !== false,
          created_at: customer.created_at || new Date().toISOString(),
          updated_at: customer.updated_at || new Date().toISOString(),
          last_purchase_date: customer.last_purchase_date,
          purchase_count: customer.purchase_count || 0,
          average_order_value: customer.average_order_value || 0,
          customer_tier: customer.customer_tier || 'bronze'
        }));
        setCustomers(transformedCustomers);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Lỗi khi tải danh sách khách hàng');
      // Set empty array on error to prevent filter issues
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const header = 'id,full_name,phone,email,address,customer_type,loyalty_points,total_spent,customer_tier\n';
    const rows = (sortedCustomers || []).map(c => [
      c.id,
      (c.full_name || '').replace(/,/g, ' '),
      c.phone || '',
      c.email || '',
      (c.address || '').replace(/,/g, ' '),
      c.customer_type,
      c.loyalty_points,
      c.total_spent,
      c.customer_tier || ''
    ].join(','));
    const csv = header + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenCreate = () => {
    setEditing(false);
    setSelectedCustomer({
      id: '', full_name: '', phone: '', email: '', address: '', customer_type: 'individual', loyalty_points: 0, total_spent: 0, is_active: true
    });
    setShowModal(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditing(true);
    setSelectedCustomer({ ...c });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selectedCustomer) return;
    try {
      const payload: any = {
        name: selectedCustomer.full_name,
        phone: selectedCustomer.phone,
        email: selectedCustomer.email,
        address: selectedCustomer.address,
        customer_type: selectedCustomer.customer_type || 'individual'
      };
      if (editing && selectedCustomer.id) {
        const res = await apiClient.put(`/customers/${selectedCustomer.id}`, payload);
        if (res.data?.success !== false) toast.success('Cập nhật khách hàng thành công');
      } else {
        const res = await apiClient.post('/customers', payload);
        if (res.data?.success !== false) toast.success('Tạo khách hàng thành công');
      }
      setShowModal(false);
      await loadCustomers();
    } catch (err) {
      console.error(err);
      toast.error('Lưu khách hàng thất bại');
    }
  };

  const handleImportCSV = async (file: File) => {
    try {
      setImporting(true);
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length <= 1) { toast.error('File trống'); setImporting(false); return; }
      const header = lines[0].split(',').map(h => h.trim().toLowerCase());
      const idx = (name: string) => header.indexOf(name);
      let success = 0; let failed = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        const body: any = {
          name: cols[idx('full_name')] || cols[idx('name')] || '',
          phone: cols[idx('phone')] || '',
          email: cols[idx('email')] || '',
          address: cols[idx('address')] || '',
          customer_type: (cols[idx('customer_type')] || 'individual').trim()
        };
        try {
          const res = await apiClient.post('/customers', body);
          if (res.data?.success === false) failed++; else success++;
        } catch {
          failed++;
        }
      }
      toast.success(`Nhập ${success} bản ghi, lỗi ${failed}`);
      await loadCustomers();
    } catch (e) {
      console.error(e);
      toast.error('Nhập CSV thất bại');
    } finally {
      setImporting(false);
    }
  };

  const filteredCustomers = (customers || []).filter(customer => {
    const matchesSearch = (customer.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (customer.phone || '').includes(searchQuery) ||
                         (customer.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || customer.customer_type === selectedType;
    const matchesTier = selectedTier === 'all' || customer.customer_tier === selectedTier;
    return matchesSearch && matchesType && matchesTier;
  });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'name':
        aValue = (a.full_name || '').toLowerCase();
        bValue = (b.full_name || '').toLowerCase();
        break;
      case 'total_spent':
        aValue = a.total_spent || 0;
        bValue = b.total_spent || 0;
        break;
      case 'loyalty_points':
        aValue = a.loyalty_points || 0;
        bValue = b.loyalty_points || 0;
        break;
      case 'created_at':
        aValue = new Date(a.created_at || '').getTime() || 0;
        bValue = new Date(b.created_at || '').getTime() || 0;
        break;
      default:
        aValue = (a.full_name || '').toLowerCase();
        bValue = (b.full_name || '').toLowerCase();
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getTierInfo = (tier?: string) => {
    switch (tier) {
      case 'platinum':
        return { label: 'Bạch kim', color: 'bg-purple-100 text-purple-800', icon: <Crown className="w-4 h-4" /> };
      case 'gold':
        return { label: 'Vàng', color: 'bg-yellow-100 text-yellow-800', icon: <Award className="w-4 h-4" /> };
      case 'silver':
        return { label: 'Bạc', color: 'bg-gray-100 text-gray-800', icon: <Star className="w-4 h-4" /> };
      case 'bronze':
        return { label: 'Đồng', color: 'bg-orange-100 text-orange-800', icon: <Star className="w-4 h-4" /> };
      default:
        return { label: 'Thường', color: 'bg-gray-100 text-gray-600', icon: <Users className="w-4 h-4" /> };
    }
  };

  const getTypeInfo = (type: string) => {
    return type === 'business' 
      ? { label: 'Doanh nghiệp', color: 'bg-blue-100 text-blue-800' }
      : { label: 'Cá nhân', color: 'bg-green-100 text-green-800' };
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) return;
    
    try {
      const response = await apiClient.delete(`/customers/${customerId}`);
      if (response.data.success) {
        toast.success('Xóa khách hàng thành công');
        loadCustomers();
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Lỗi khi xóa khách hàng');
    }
  };

  // Calculate stats
  const totalCustomers = (customers || []).length;
  const activeCustomers = (customers || []).filter(c => c.is_active).length;
  const totalRevenue = (customers || []).reduce((sum, c) => sum + c.total_spent, 0);
  const avgOrderValue = (customers || []).length > 0 ? totalRevenue / (customers || []).length : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Quản lý khách hàng"
          subtitle={`Tổng cộng ${totalCustomers} khách hàng`}
          actions={
            <div className="flex items-center space-x-3">
              <label className="inline-flex items-center px-3 py-2 border rounded-lg cursor-pointer bg-white">
                <Upload className="w-4 h-4 mr-2" />
                <span>{importing ? 'Đang nhập...' : 'Nhập CSV'}</span>
                <input type="file" accept=".csv" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImportCSV(f);
                }} />
              </label>
              <Button variant="outline" onClick={exportCSV}>
                <Download className="w-4 h-4 mr-2" />
                Xuất CSV
              </Button>
              <Button onClick={handleOpenCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Thêm khách hàng
              </Button>
            </div>
          }
        />

        {/* Stats Cards */}
        <Grid cols={4} gap="md" className="mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng khách hàng</p>
                <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Khách hàng hoạt động</p>
                <p className="text-2xl font-bold text-gray-900">{activeCustomers}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-100">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Giá trị đơn hàng TB</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(avgOrderValue)}</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-100">
                <Star className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </Grid>

        {/* Filters and Search */}
        <Card className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm khách hàng theo tên, SĐT hoặc email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="all">Tất cả loại</option>
                <option value="individual">Cá nhân</option>
                <option value="business">Doanh nghiệp</option>
              </select>
              
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="all">Tất cả cấp độ</option>
                <option value="platinum">Bạch kim</option>
                <option value="gold">Vàng</option>
                <option value="silver">Bạc</option>
                <option value="bronze">Đồng</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="name-asc">Tên A-Z</option>
                <option value="name-desc">Tên Z-A</option>
                <option value="total_spent-desc">Chi tiêu cao-thấp</option>
                <option value="total_spent-asc">Chi tiêu thấp-cao</option>
                <option value="loyalty_points-desc">Điểm tích lũy cao-thấp</option>
                <option value="created_at-desc">Mới nhất</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Customers Grid */}
        <Section title={`Kết quả tìm kiếm (${sortedCustomers.length} khách hàng)`}>
          {loading ? (
            <Card>
              <LoadingSpinner className="py-12" />
            </Card>
          ) : sortedCustomers.length > 0 ? (
            <Grid cols={3} gap="md">
              {sortedCustomers.map((customer) => {
                const tierInfo = getTierInfo(customer.customer_tier);
                const typeInfo = getTypeInfo(customer.customer_type);
                
                return (
                  <Card key={customer.id} hover className="group">
                    <div className="space-y-4">
                      {/* Customer Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-lg">
                              {customer.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {customer.full_name}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${tierInfo.color}`}>
                                {tierInfo.icon}
                                <span className="ml-1">{tierInfo.label}</span>
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                                {typeInfo.label}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Button variant="outline" size="sm" onClick={() => handleOpenEdit(customer)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleOpenEdit(customer)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteCustomer(customer.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2">
                        {customer.phone && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span>{customer.email}</span>
                          </div>
                        )}
                        {customer.address && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{customer.address}</span>
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {formatCurrency(customer.total_spent)}
                          </p>
                          <p className="text-xs text-gray-600">Tổng chi tiêu</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">
                            {customer.loyalty_points}
                          </p>
                          <p className="text-xs text-gray-600">Điểm tích lũy</p>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t">
                        <span>
                          {customer.purchase_count || 0} đơn hàng
                        </span>
                        <span>
                          {customer.last_purchase_date 
                            ? new Date(customer.last_purchase_date).toLocaleDateString('vi-VN')
                            : 'Chưa mua hàng'
                          }
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </Grid>
          ) : (
            <EmptyState
              icon={<Users className="w-16 h-16" />}
              title="Không tìm thấy khách hàng"
              description="Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc"
              action={
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm khách hàng đầu tiên
                </Button>
              }
            />
          )}
        </Section>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{editing ? 'Sửa khách hàng' : 'Thêm khách hàng'}</h3>
                <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <div className="space-y-3">
                <input className="w-full border rounded-lg px-3 py-2" placeholder="Họ tên" value={selectedCustomer?.full_name || ''} onChange={(e) => setSelectedCustomer({ ...(selectedCustomer as any), full_name: e.target.value })} />
                <input className="w-full border rounded-lg px-3 py-2" placeholder="SĐT" value={selectedCustomer?.phone || ''} onChange={(e) => setSelectedCustomer({ ...(selectedCustomer as any), phone: e.target.value })} />
                <input className="w-full border rounded-lg px-3 py-2" placeholder="Email" value={selectedCustomer?.email || ''} onChange={(e) => setSelectedCustomer({ ...(selectedCustomer as any), email: e.target.value })} />
                <input className="w-full border rounded-lg px-3 py-2" placeholder="Địa chỉ" value={selectedCustomer?.address || ''} onChange={(e) => setSelectedCustomer({ ...(selectedCustomer as any), address: e.target.value })} />
                <select className="w-full border rounded-lg px-3 py-2" value={selectedCustomer?.customer_type || 'individual'} onChange={(e) => setSelectedCustomer({ ...(selectedCustomer as any), customer_type: e.target.value as any })}>
                  <option value="individual">Cá nhân</option>
                  <option value="business">Doanh nghiệp</option>
                </select>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowModal(false)}>Hủy</Button>
                <Button onClick={handleSave}>Lưu</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernCustomers;
