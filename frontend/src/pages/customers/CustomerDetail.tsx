import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { posApi } from '../../services/api/posApi';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'react-hot-toast';
import { CustomerActivityTimeline } from '../../components/CustomerActivityTimeline';
import { 
  FiArrowLeft, FiEdit3, FiTrash2, FiPhone, FiMail, FiMapPin, 
  FiCalendar, FiUser, FiStar, FiDollarSign, FiShoppingBag, 
  FiTrendingUp, FiTrendingDown, FiActivity, FiHeart,
  FiClock, FiTag, FiTarget, FiGift, FiMessageSquare,
  FiBarChart3, FiPieChart, FiTrendingDown as FiTrending
} from 'react-icons/fi';

interface CustomerDetailProps {
  customerId?: string;
}

interface OrderHistory {
  id: string;
  date: string;
  total: number;
  items_count: number;
  status: 'completed' | 'pending' | 'cancelled';
}

interface LoyaltyTransaction {
  id: string;
  date: string;
  type: 'earned' | 'redeemed';
  points: number;
  description: string;
}

interface CustomerAnalytics {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  loyaltyPoints: number;
  lifetimeValue: number;
  lastOrderDate: string;
  favoriteProducts: string[];
  spendingTrend: 'up' | 'down' | 'stable';
  riskScore: 'low' | 'medium' | 'high';
}

const CustomerDetail: React.FC<CustomerDetailProps> = ({ customerId: propCustomerId }) => {
  const { customerId: paramCustomerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const customerId = propCustomerId || paramCustomerId;
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'analytics' | 'activity'>('overview');
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch customer details
  const { data: customer, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      if (!customerId) throw new Error('Customer ID is required');
      const response = await posApi.getCustomer(customerId);
      return response.data;
    },
    enabled: !!customerId
  });

  // Mock data for demonstration
  const mockOrderHistory: OrderHistory[] = [
    { id: '1', date: '2024-01-15', total: 350000, items_count: 3, status: 'completed' },
    { id: '2', date: '2024-01-10', total: 750000, items_count: 5, status: 'completed' },
    { id: '3', date: '2024-01-05', total: 125000, items_count: 1, status: 'completed' },
  ];

  const mockLoyaltyHistory: LoyaltyTransaction[] = [
    { id: '1', date: '2024-01-15', type: 'earned', points: 35, description: 'Mua hàng - Đơn #1001' },
    { id: '2', date: '2024-01-10', type: 'earned', points: 75, description: 'Mua hàng - Đơn #1002' },
    { id: '3', date: '2024-01-08', type: 'redeemed', points: -50, description: 'Đổi quà tặng' },
  ];

  const mockAnalytics: CustomerAnalytics = {
    totalOrders: 15,
    totalSpent: 2500000,
    averageOrderValue: 166667,
    loyaltyPoints: 250,
    lifetimeValue: 3000000,
    lastOrderDate: '2024-01-15',
    favoriteProducts: ['Sản phẩm A', 'Sản phẩm B', 'Sản phẩm C'],
    spendingTrend: 'up',
    riskScore: 'low'
  };

  const getCustomerTier = (totalSpent: number): { tier: string, label: string, color: string } => {
    if (totalSpent >= 10000000) return { tier: 'platinum', label: 'Bạch kim', color: 'text-purple-600' };
    if (totalSpent >= 5000000) return { tier: 'gold', label: 'Vàng', color: 'text-yellow-600' };
    if (totalSpent >= 1000000) return { tier: 'silver', label: 'Bạc', color: 'text-gray-600' };
    return { tier: 'bronze', label: 'Đồng', color: 'text-orange-600' };
  };

  const getRiskScoreColor = (score: string) => {
    switch (score) {
      case 'low': return 'text-success';
      case 'medium': return 'text-warning';
      case 'high': return 'text-error';
      default: return 'text-base-content';
    }
  };

  const getRiskScoreLabel = (score: string) => {
    switch (score) {
      case 'low': return 'Thấp';
      case 'medium': return 'Trung bình';
      case 'high': return 'Cao';
      default: return 'Không xác định';
    }
  };

  if (isLoadingCustomer) {
    return (
      <div className="min-h-screen bg-base-200 p-4">
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-base-200 p-4">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold mb-4">Không tìm thấy khách hàng</h2>
          <button 
            className="btn btn-primary" onClick={() => navigate('/customers')}
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const tierInfo = getCustomerTier(customer.total_spent || 0);

  return (
    <div className="min-h-screen bg-base-200 p-2 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="bg-base-100 rounded-lg shadow-sm p-4 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <button
            className="btn btn-ghost btn-sm" onClick={() => navigate('/customers')}
          >
            <FiArrowLeft className="mr-2" />
            Quay lại
          </button>
          
          <div className="flex gap-2">
            <button
              className="btn btn-outline btn-sm" onClick={() => setShowEditModal(true)}
            >
              <FiEdit3 className="mr-1" />
              Chỉnh sửa
            </button>
            <button className="btn btn-error btn-sm">
              <FiTrash2 className="mr-1" />
              Xóa
            </button>
          </div>
        </div>

        {/* Customer Overview */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="avatar placeholder">
            <div className="bg-primary text-primary-content rounded-full w-24 h-24">
              <span className="text-3xl font-bold">
                {(customer.full_name || 'K').charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold">{customer.full_name}</h1>
              <div className="flex gap-2 flex-wrap">
                <div className={`badge badge-lg ${tierInfo.color}`}>
                  <FiStar className="mr-1" />
                  {tierInfo.label}
                </div>
                <div className={`badge badge-lg ${customer.is_active ? 'badge-success' : 'badge-error'}`}>
                  {customer.is_active ? 'Hoạt động' : 'Ngừng hoạt động'}
                </div>
                <div className={`badge badge-lg ${customer.customer_type === 'business' ? 'badge-info' : 'badge-outline'}`}>
                  {customer.customer_type === 'business' ? 'Doanh nghiệp' : 'Cá nhân'}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              {customer.phone && (
                <div className="flex items-center">
                  <FiPhone className="mr-2 text-primary" />
                  {customer.phone}
                </div>
              )}
              {customer.email && (
                <div className="flex items-center">
                  <FiMail className="mr-2 text-primary" />
                  <span className="truncate">{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center">
                  <FiMapPin className="mr-2 text-primary" />
                  <span className="truncate">{customer.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="stat bg-primary/10 rounded-lg p-4">
            <div className="stat-figure text-primary">
              <FiShoppingBag className="text-2xl" />
            </div>
            <div className="stat-title text-xs">Tổng đơn hàng</div>
            <div className="stat-value text-primary text-lg">{mockAnalytics.totalOrders}</div>
          </div>
          
          <div className="stat bg-success/10 rounded-lg p-4">
            <div className="stat-figure text-success">
              <FiDollarSign className="text-2xl" />
            </div>
            <div className="stat-title text-xs">Tổng chi tiêu</div>
            <div className="stat-value text-success text-sm">{formatCurrency(customer.total_spent || 0)}</div>
          </div>
          
          <div className="stat bg-warning/10 rounded-lg p-4">
            <div className="stat-figure text-warning">
              <FiStar className="text-2xl" />
            </div>
            <div className="stat-title text-xs">Điểm thưởng</div>
            <div className="stat-value text-warning text-lg">{customer.loyalty_points || 0}</div>
          </div>
          
          <div className="stat bg-info/10 rounded-lg p-4">
            <div className="stat-figure text-info">
              <FiTarget className="text-2xl" />
            </div>
            <div className="stat-title text-xs">LTV</div>
            <div className="stat-value text-info text-sm">{formatCurrency(mockAnalytics.lifetimeValue)}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-base-100 rounded-lg shadow-sm mb-6">
        <div className="tabs tabs-bordered p-4">
          <button 
            className={`tab tab-bordered ${activeTab === 'overview' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <FiUser className="mr-2" />
            Tổng quan
          </button>
          <button 
            className={`tab tab-bordered ${activeTab === 'orders' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <FiShoppingBag className="mr-2" />
            Lịch sử đơn hàng
          </button>
          <button 
            className={`tab tab-bordered ${activeTab === 'analytics' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <FiBarChart3 className="mr-2" />
            Phân tích
          </button>
          <button 
            className={`tab tab-bordered ${activeTab === 'activity' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <FiActivity className="mr-2" />
            Hoạt động
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Information */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="card-title">Thông tin khách hàng</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="font-medium">Ngày tham gia:</span>
                      <span>{new Date(customer.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="font-medium">Lần mua cuối:</span>
                      <span>{mockAnalytics.lastOrderDate}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="font-medium">Giá trị đơn TB:</span>
                      <span>{formatCurrency(mockAnalytics.averageOrderValue)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="font-medium">Xu hướng chi tiêu:</span>
                      <span className={`flex items-center ${mockAnalytics.spendingTrend === 'up' ? 'text-success' : mockAnalytics.spendingTrend === 'down' ? 'text-error' : 'text-warning'}`}>
                        {mockAnalytics.spendingTrend === 'up' ? <FiTrendingUp className="mr-1" /> : 
                         mockAnalytics.spendingTrend === 'down' ? <FiTrendingDown className="mr-1" /> : 
                         <FiTrending className="mr-1" />}
                        {mockAnalytics.spendingTrend === 'up' ? 'Tăng' : 
                         mockAnalytics.spendingTrend === 'down' ? 'Giảm' : 'Ổn định'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="font-medium">Rủi ro rời bỏ:</span>
                      <span className={`badge ${getRiskScoreColor(mockAnalytics.riskScore)}`}>
                        {getRiskScoreLabel(mockAnalytics.riskScore)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="card-title">Đơn hàng gần đây</h3>
                  
                  <div className="space-y-3">
                    {mockOrderHistory.slice(0, 3).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-base-100 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder">
                            <div className="bg-primary text-primary-content rounded w-10 h-10">
                              <span className="text-xs">#{order.id}</span>
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">{formatCurrency(order.total)}</div>
                            <div className="text-sm text-base-content/70">{order.items_count} sản phẩm</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`badge badge-sm ${order.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                            {order.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý'}
                          </div>
                          <div className="text-xs text-base-content/70 mt-1">{order.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    className="btn btn-outline btn-sm mt-4" onClick={() => setActiveTab('orders')}
                  >
                    Xem tất cả
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Lịch sử đơn hàng ({mockOrderHistory.length})</h3>
              
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Ngày đặt</th>
                      <th>Số lượng</th>
                      <th>Tổng tiền</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockOrderHistory.map((order) => (
                      <tr key={order.id}>
                        <td>#{order.id}</td>
                        <td>{order.date}</td>
                        <td>{order.items_count} sản phẩm</td>
                        <td className="font-medium">{formatCurrency(order.total)}</td>
                        <td>
                          <div className={`badge ${order.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                            {order.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý'}
                          </div>
                        </td>
                        <td>
                          <button className="btn btn-ghost btn-xs">Chi tiết</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Insights */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="card-title">Thông tin chi tiết</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Customer Lifetime Value</span>
                      <span className="text-lg font-bold text-success">{formatCurrency(mockAnalytics.lifetimeValue)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Tần suất mua hàng</span>
                      <span>1.2 đơn/tháng</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Tỷ lệ quay lại</span>
                      <span className="text-success">85%</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Kênh mua hàng ưa thích</span>
                      <span>Cửa hàng</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Favorite Products */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="card-title">Sản phẩm yêu thích</h3>
                  
                  <div className="space-y-3">
                    {mockAnalytics.favoriteProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span>{product}</span>
                        <div className="badge badge-outline">#{index + 1}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Loyalty Points History */}
              <div className="card bg-base-200 lg:col-span-2">
                <div className="card-body">
                  <h3 className="card-title">Lịch sử điểm thưởng</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Ngày</th>
                          <th>Loại</th>
                          <th>Điểm</th>
                          <th>Mô tả</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockLoyaltyHistory.map((transaction) => (
                          <tr key={transaction.id}>
                            <td>{transaction.date}</td>
                            <td>
                              <div className={`badge badge-sm ${transaction.type === 'earned' ? 'badge-success' : 'badge-warning'}`}>
                                {transaction.type === 'earned' ? 'Tích' : 'Đổi'}
                              </div>
                            </td>
                            <td className={transaction.type === 'earned' ? 'text-success' : 'text-warning'}>
                              {transaction.type === 'earned' ? '+' : ''}{transaction.points}
                            </td>
                            <td>{transaction.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <CustomerActivityTimeline customerId={customerId || ''} />
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
