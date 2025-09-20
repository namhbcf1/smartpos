import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiPlay,
  FiPause,
  FiRefreshCw,
  FiSettings,
  FiDownload,
  FiUpload,
  FiSearch,
  FiFilter,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiClock,
  FiActivity,
  FiDatabase,
  FiGlobe,
  FiShield,
  FiZap,
  FiTrendingUp,
  FiBarChart3,
  FiCode,
  FiTerminal,
  FiCopy,
  FiExternalLink,
  FiMonitor,
  FiServer,
  FiWifi,
  FiWifiOff
} from 'react-icons/fi';
import { posApi } from '../../services/api/posApi';
import { motion, AnimatePresence } from 'framer-motion';

// Interfaces
interface ApiEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  category: string;
  status: 'active' | 'inactive' | 'error' | 'maintenance';
  responseTime?: number;
  lastCalled?: string;
  successRate?: number;
  callCount?: number;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  response?: any;
  example?: any;
}

interface ApiStats {
  totalEndpoints: number;
  activeEndpoints: number;
  errorEndpoints: number;
  averageResponseTime: number;
  totalCalls: number;
  successRate: number;
  lastUpdated: string;
}

interface ApiTestResult {
  endpoint: string;
  method: string;
  status: 'success' | 'error' | 'timeout';
  responseTime: number;
  statusCode: number;
  response: any;
  error?: string;
  timestamp: string;
}

const ApiManagement: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'endpoints' | 'testing' | 'monitoring' | 'documentation'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'products' | 'orders' | 'inventory' | 'customers' | 'analytics' | 'payments'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'error' | 'maintenance'>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | 'GET' | 'POST' | 'PUT' | 'DELETE'>('all');
  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>([]);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [testingEndpoint, setTestingEndpoint] = useState<ApiEndpoint | null>(null);
  const [testResults, setTestResults] = useState<ApiTestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);

  const queryClient = useQueryClient();

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Mock API endpoints data
  const apiEndpoints: ApiEndpoint[] = useMemo(() => [
    // Products
    {
      id: '1',
      name: 'Search Products',
      method: 'GET',
      path: '/products/search',
      description: 'Tìm kiếm sản phẩm theo từ khóa',
      category: 'products',
      status: 'active',
      responseTime: 120,
      lastCalled: '2024-01-15T10:30:00Z',
      successRate: 99.2,
      callCount: 1250,
      parameters: [
        { name: 'q', type: 'string', required: true, description: 'Từ khóa tìm kiếm' },
        { name: 'limit', type: 'number', required: false, description: 'Số lượng kết quả tối đa' }
      ],
      example: { q: 'CPU Intel', limit: 10 }
    },
    {
      id: '2',
      name: 'Get Products',
      method: 'GET',
      path: '/products',
      description: 'Lấy danh sách sản phẩm',
      category: 'products',
      status: 'active',
      responseTime: 95,
      lastCalled: '2024-01-15T10:25:00Z',
      successRate: 98.8,
      callCount: 2100,
      parameters: [
        { name: 'page', type: 'number', required: false, description: 'Trang hiện tại' },
        { name: 'limit', type: 'number', required: false, description: 'Số lượng mỗi trang' }
      ],
      example: { page: 1, limit: 50 }
    },
    // Orders
    {
      id: '3',
      name: 'Get Orders',
      method: 'GET',
      path: '/orders',
      description: 'Lấy danh sách đơn hàng',
      category: 'orders',
      status: 'active',
      responseTime: 180,
      lastCalled: '2024-01-15T10:20:00Z',
      successRate: 97.5,
      callCount: 850,
      parameters: [
        { name: 'page', type: 'number', required: false, description: 'Trang hiện tại' },
        { name: 'status', type: 'string', required: false, description: 'Trạng thái đơn hàng' },
        { name: 'from', type: 'string', required: false, description: 'Từ ngày' },
        { name: 'to', type: 'string', required: false, description: 'Đến ngày' }
      ],
      example: { page: 1, status: 'completed', from: '2024-01-01', to: '2024-01-31' }
    },
    {
      id: '4',
      name: 'Create Order',
      method: 'POST',
      path: '/orders',
      description: 'Tạo đơn hàng mới',
      category: 'orders',
      status: 'active',
      responseTime: 250,
      lastCalled: '2024-01-15T10:15:00Z',
      successRate: 96.8,
      callCount: 320,
      parameters: [
        { name: 'customer_id', type: 'string', required: false, description: 'ID khách hàng' },
        { name: 'items', type: 'array', required: true, description: 'Danh sách sản phẩm' },
        { name: 'payments', type: 'array', required: true, description: 'Phương thức thanh toán' }
      ],
      example: {
        customer_id: '123',
        items: [{ product_id: '1', quantity: 2, unit_price: 1000000 }],
        payments: [{ method: 'cash', amount: 2000000 }]
      }
    },
    // Inventory
    {
      id: '5',
      name: 'Get Warehouse Locations',
      method: 'GET',
      path: '/inventory/locations',
      description: 'Lấy danh sách vị trí kho',
      category: 'inventory',
      status: 'active',
      responseTime: 110,
      lastCalled: '2024-01-15T10:10:00Z',
      successRate: 99.1,
      callCount: 450,
      parameters: [
        { name: 'page', type: 'number', required: false, description: 'Trang hiện tại' },
        { name: 'search', type: 'string', required: false, description: 'Tìm kiếm' },
        { name: 'warehouse_id', type: 'string', required: false, description: 'ID kho' }
      ],
      example: { page: 1, search: 'A1', warehouse_id: 'wh001' }
    },
    {
      id: '6',
      name: 'Create Location',
      method: 'POST',
      path: '/inventory/locations',
      description: 'Tạo vị trí kho mới',
      category: 'inventory',
      status: 'active',
      responseTime: 200,
      lastCalled: '2024-01-15T10:05:00Z',
      successRate: 98.5,
      callCount: 25,
      parameters: [
        { name: 'name', type: 'string', required: true, description: 'Tên vị trí' },
        { name: 'warehouse_id', type: 'string', required: true, description: 'ID kho' },
        { name: 'shelf', type: 'string', required: false, description: 'Kệ' },
        { name: 'bin', type: 'string', required: false, description: 'Ngăn' }
      ],
      example: { name: 'A1-01', warehouse_id: 'wh001', shelf: 'A1', bin: '01' }
    },
    // Analytics
    {
      id: '7',
      name: 'Get KPI',
      method: 'GET',
      path: '/analytics/kpi',
      description: 'Lấy dữ liệu KPI',
      category: 'analytics',
      status: 'active',
      responseTime: 300,
      lastCalled: '2024-01-15T10:00:00Z',
      successRate: 95.2,
      callCount: 180,
      parameters: [
        { name: 'from', type: 'string', required: false, description: 'Từ ngày' },
        { name: 'to', type: 'string', required: false, description: 'Đến ngày' }
      ],
      example: { from: '2024-01-01', to: '2024-01-31' }
    },
    {
      id: '8',
      name: 'Get Low Stock Products',
      method: 'GET',
      path: '/analytics/low-stock',
      description: 'Lấy sản phẩm tồn kho thấp',
      category: 'analytics',
      status: 'active',
      responseTime: 150,
      lastCalled: '2024-01-15T09:55:00Z',
      successRate: 98.0,
      callCount: 95,
      parameters: [
        { name: 'threshold', type: 'number', required: false, description: 'Ngưỡng tồn kho thấp' }
      ],
      example: { threshold: 10 }
    },
    // Customers
    {
      id: '9',
      name: 'Get Customers',
      method: 'GET',
      path: '/customers',
      description: 'Lấy danh sách khách hàng',
      category: 'customers',
      status: 'active',
      responseTime: 140,
      lastCalled: '2024-01-15T09:50:00Z',
      successRate: 97.8,
      callCount: 680,
      parameters: [
        { name: 'page', type: 'number', required: false, description: 'Trang hiện tại' },
        { name: 'search', type: 'string', required: false, description: 'Tìm kiếm' },
        { name: 'customerType', type: 'string', required: false, description: 'Loại khách hàng' }
      ],
      example: { page: 1, search: 'Nguyễn Văn A', customerType: 'individual' }
    },
    {
      id: '10',
      name: 'Create Customer',
      method: 'POST',
      path: '/customers',
      description: 'Tạo khách hàng mới',
      category: 'customers',
      status: 'active',
      responseTime: 220,
      lastCalled: '2024-01-15T09:45:00Z',
      successRate: 96.5,
      callCount: 45,
      parameters: [
        { name: 'full_name', type: 'string', required: true, description: 'Họ tên' },
        { name: 'phone', type: 'string', required: false, description: 'Số điện thoại' },
        { name: 'email', type: 'string', required: false, description: 'Email' },
        { name: 'customer_type', type: 'string', required: true, description: 'Loại khách hàng' }
      ],
      example: { full_name: 'Nguyễn Văn A', phone: '0123456789', customer_type: 'individual' }
    },
    // Payments
    {
      id: '11',
      name: 'Create VNPay Payment',
      method: 'POST',
      path: '/payments/vnpay/create',
      description: 'Tạo thanh toán VNPay',
      category: 'payments',
      status: 'active',
      responseTime: 500,
      lastCalled: '2024-01-15T09:40:00Z',
      successRate: 94.5,
      callCount: 120,
      parameters: [
        { name: 'saleId', type: 'string', required: true, description: 'ID bán hàng' },
        { name: 'amount', type: 'number', required: true, description: 'Số tiền' },
        { name: 'orderInfo', type: 'string', required: false, description: 'Thông tin đơn hàng' }
      ],
      example: { saleId: 'sale123', amount: 1000000, orderInfo: 'Thanh toán đơn hàng #123' }
    },
    {
      id: '12',
      name: 'Get Payment Status',
      method: 'GET',
      path: '/payments/status/{transactionId}',
      description: 'Kiểm tra trạng thái thanh toán',
      category: 'payments',
      status: 'active',
      responseTime: 180,
      lastCalled: '2024-01-15T09:35:00Z',
      successRate: 98.2,
      callCount: 200,
      parameters: [
        { name: 'transactionId', type: 'string', required: true, description: 'ID giao dịch' }
      ],
      example: { transactionId: 'txn123456' }
    }
  ], []);

  // Mock API stats
  const apiStats: ApiStats = useMemo(() => ({
    totalEndpoints: apiEndpoints.length,
    activeEndpoints: apiEndpoints.filter(e => e.status === 'active').length,
    errorEndpoints: apiEndpoints.filter(e => e.status === 'error').length,
    averageResponseTime: Math.round(apiEndpoints.reduce((sum, e) => sum + (e.responseTime || 0), 0) / apiEndpoints.length),
    totalCalls: apiEndpoints.reduce((sum, e) => sum + (e.callCount || 0), 0),
    successRate: Math.round(apiEndpoints.reduce((sum, e) => sum + (e.successRate || 0), 0) / apiEndpoints.length),
    lastUpdated: new Date().toISOString()
  }), [apiEndpoints]);

  // Real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;
    
    const interval = setInterval(() => {
      // Simulate real-time updates
      queryClient.invalidateQueries({ queryKey: ['api-stats'] });
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [realTimeEnabled, queryClient]);

  // Filtered endpoints
  const filteredEndpoints = useMemo(() => {
    let filtered = apiEndpoints;

    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase();
      filtered = filtered.filter(endpoint =>
        endpoint.name.toLowerCase().includes(search) ||
        endpoint.path.toLowerCase().includes(search) ||
        endpoint.description.toLowerCase().includes(search) ||
        endpoint.category.toLowerCase().includes(search)
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(endpoint => endpoint.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(endpoint => endpoint.status === statusFilter);
    }

    if (methodFilter !== 'all') {
      filtered = filtered.filter(endpoint => endpoint.method === methodFilter);
    }

    return filtered;
  }, [apiEndpoints, debouncedSearch, categoryFilter, statusFilter, methodFilter]);

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'maintenance': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-blue-600 bg-blue-100';
      case 'POST': return 'text-green-600 bg-green-100';
      case 'PUT': return 'text-yellow-600 bg-yellow-100';
      case 'DELETE': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <FiCheckCircle className="w-4 h-4" />;
      case 'inactive': return <FiPause className="w-4 h-4" />;
      case 'error': return <FiXCircle className="w-4 h-4" />;
      case 'maintenance': return <FiAlertTriangle className="w-4 h-4" />;
      default: return <FiClock className="w-4 h-4" />;
    }
  };

  const testEndpoint = async (endpoint: ApiEndpoint) => {
    setIsTesting(true);
    setTestingEndpoint(endpoint);

    try {
      const startTime = Date.now();
      let response: any;
      let statusCode = 200;
      let error: string | undefined;

      // Simulate API call based on endpoint
      switch (endpoint.path) {
        case '/products/search':
          response = await posApi.searchProducts('test', 10);
          break;
        case '/products':
          response = await posApi.getProducts(1, 10);
          break;
        case '/orders':
          if (endpoint.method === 'GET') {
            response = await posApi.getOrders(1, 10);
          } else {
            // Mock POST order
            response = { success: true, data: { id: 'test-order', order_code: 'ORD-001' } };
          }
          break;
        case '/inventory/locations':
          if (endpoint.method === 'GET') {
            response = await posApi.getWarehouseLocations(1, 10);
          } else {
            // Mock POST location
            response = { success: true, data: { id: 'test-location' } };
          }
          break;
        case '/analytics/kpi':
          response = await posApi.getKPI();
          break;
        case '/analytics/low-stock':
          response = await posApi.getLowStockProducts(10);
          break;
        case '/customers':
          if (endpoint.method === 'GET') {
            response = await posApi.getCustomers(1, 10);
          } else {
            // Mock POST customer
            response = { success: true, data: { id: 'test-customer' } };
          }
          break;
        default:
          response = { success: true, data: 'Mock response' };
      }

      const responseTime = Date.now() - startTime;
      const result: ApiTestResult = {
        endpoint: endpoint.path,
        method: endpoint.method,
        status: response.success ? 'success' : 'error',
        responseTime,
        statusCode: response.success ? 200 : 400,
        response: response.data || response,
        error: response.error,
        timestamp: new Date().toISOString()
      };

      setTestResults(prev => [result, ...prev.slice(0, 49)]); // Keep last 50 results
    } catch (err: any) {
      const result: ApiTestResult = {
        endpoint: endpoint.path,
        method: endpoint.method,
        status: 'error',
        responseTime: Date.now() - Date.now(),
        statusCode: 500,
        response: null,
        error: err.message || 'Network error',
        timestamp: new Date().toISOString()
      };
      setTestResults(prev => [result, ...prev.slice(0, 49)]);
    } finally {
      setIsTesting(false);
    }
  };

  const exportApiDocs = () => {
    const docs = {
      title: 'Smart POS API Documentation',
      version: '1.0.0',
      baseUrl: (import.meta as any).env?.VITE_API_BASE_URL || 'https://namhbcf-api.bangachieu2.workers.dev',
      endpoints: apiEndpoints.map(endpoint => ({
        name: endpoint.name,
        method: endpoint.method,
        path: endpoint.path,
        description: endpoint.description,
        parameters: endpoint.parameters,
        example: endpoint.example
      }))
    };

    const blob = new Blob([JSON.stringify(docs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'api-documentation.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">API Management Dashboard</h1>
              <p className="text-gray-600 mt-2">Quản lý và monitor tất cả API endpoints của Smart POS</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${realTimeEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-sm text-gray-600">
                  {realTimeEnabled ? 'Real-time ON' : 'Real-time OFF'}
                </span>
              </div>
              <button 
                onClick={() => setRealTimeEnabled(!realTimeEnabled)}
                className="btn btn-outline btn-sm">
              >
                {realTimeEnabled ? <FiWifiOff className="w-4 h-4" /> : <FiWifi className="w-4 h-4" />}
                {realTimeEnabled ? 'Disable' : 'Enable'} Real-time
              </button>
              <button 
                onClick={() => setShowSettingsModal(true)}
                className="btn btn-outline btn-sm">
              >
                <FiSettings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div 
            className="stat bg-base-100 shadow rounded-lg">
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="stat-figure text-primary">
              <FiServer className="w-8 h-8" />
            </div>
            <div className="stat-title">Total Endpoints</div>
            <div className="stat-value text-primary">{apiStats.totalEndpoints}</div>
            <div className="stat-desc">API endpoints available</div>
          </motion.div>

          <motion.div 
            className="stat bg-base-100 shadow rounded-lg">
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="stat-figure text-success">
              <FiCheckCircle className="w-8 h-8" />
            </div>
            <div className="stat-title">Active</div>
            <div className="stat-value text-success">{apiStats.activeEndpoints}</div>
            <div className="stat-desc">Endpoints running</div>
          </motion.div>

          <motion.div 
            className="stat bg-base-100 shadow rounded-lg">
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="stat-figure text-warning">
              <FiActivity className="w-8 h-8" />
            </div>
            <div className="stat-title">Avg Response</div>
            <div className="stat-value text-warning">{apiStats.averageResponseTime}ms</div>
            <div className="stat-desc">Response time</div>
          </motion.div>

          <motion.div 
            className="stat bg-base-100 shadow rounded-lg">
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="stat-figure text-info">
              <FiTrendingUp className="w-8 h-8" />
            </div>
            <div className="stat-title">Success Rate</div>
            <div className="stat-value text-info">{apiStats.successRate}%</div>
            <div className="stat-desc">API success rate</div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="bg-base-100 shadow rounded-lg mb-6">
          <div className="tabs tabs-boxed p-2">
            <button 
              className={`tab ${activeTab === 'overview' ? 'tab-active' : ''}`} 
              onClick={() => setActiveTab('overview')}
            >
              <FiBarChart3 className="w-4 h-4 mr-2" />Overview
            </button>
            <button 
              className={`tab ${activeTab === 'endpoints' ? 'tab-active' : ''}`} 
              onClick={() => setActiveTab('endpoints')}
            >
              <FiCode className="w-4 h-4 mr-2" />Endpoints
            </button>
            <button 
              className={`tab ${activeTab === 'testing' ? 'tab-active' : ''}`} 
              onClick={() => setActiveTab('testing')}
            >
              <FiPlay className="w-4 h-4 mr-2" />Testing
            </button>
            <button 
              className={`tab ${activeTab === 'monitoring' ? 'tab-active' : ''}`} 
              onClick={() => setActiveTab('monitoring')}
            >
              <FiMonitor className="w-4 h-4 mr-2" />Monitoring
            </button>
            <button 
              className={`tab ${activeTab === 'documentation' ? 'tab-active' : ''}`} 
              onClick={() => setActiveTab('documentation')}
            >
              <FiTerminal className="w-4 h-4 mr-2" />Documentation
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-base-100 shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="form-control">
                <div className="input-group">
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm API..." 
                    className="input input-bordered"> 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                  />
                  <button className="btn btn-square">
                    <FiSearch className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <select 
                className="select select-bordered"> 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value as any)}
              >
                <option value="all">Tất cả danh mục</option>
                <option value="products">Products</option>
                <option value="orders">Orders</option>
                <option value="inventory">Inventory</option>
                <option value="customers">Customers</option>
                <option value="analytics">Analytics</option>
                <option value="payments">Payments</option>
              </select>
              
              <select 
                className="select select-bordered"> 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="error">Error</option>
                <option value="maintenance">Maintenance</option>
              </select>
              
              <select 
                className="select select-bordered"> 
                value={methodFilter} 
                onChange={(e) => setMethodFilter(e.target.value as any)}
              >
                <option value="all">Tất cả methods</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={exportApiDocs}
                className="btn btn-ghost">
              >
                <FiDownload className="w-4 h-4 mr-2" />Export Docs
              </button>
              <button 
                onClick={() => setShowTestModal(true)}
                className="btn btn-primary">
              >
                <FiPlay className="w-4 h-4 mr-2" />Test All
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-base-100 shadow rounded-lg">
          <AnimatePresence mode="wait">
            {activeTab === 'endpoints' && (
              <motion.div
                key="endpoints"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="p-6">
              >
                <h3 className="text-lg font-semibold mb-4">API Endpoints ({filteredEndpoints.length})</h3>
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Method</th>
                        <th>Path</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Response Time</th>
                        <th>Success Rate</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEndpoints.map((endpoint) => (
                        <tr key={endpoint.id}>
                          <td>
                            <div className="font-medium">{endpoint.name}</div>
                            <div className="text-sm text-gray-500">{endpoint.description}</div>
                          </td>
                          <td>
                            <span className={`badge ${getMethodColor(endpoint.method)}`}>
                              {endpoint.method}
                            </span>
                          </td>
                          <td>
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                              {endpoint.path}
                            </code>
                          </td>
                          <td>
                            <span className="badge badge-outline">
                              {endpoint.category}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(endpoint.status)}
                              <span className={`badge ${getStatusColor(endpoint.status)}`}>
                                {endpoint.status}
                              </span>
                            </div>
                          </td>
                          <td>{endpoint.responseTime}ms</td>
                          <td>{endpoint.successRate}%</td>
                          <td>
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => testEndpoint(endpoint)}
                                className="btn btn-ghost btn-xs">
                                disabled={isTesting}
                              >
                                <FiPlay className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => copyToClipboard(endpoint.path)}
                                className="btn btn-ghost btn-xs">
                              >
                                <FiCopy className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => setTestingEndpoint(endpoint)}
                                className="btn btn-ghost btn-xs">
                              >
                                <FiEye className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'testing' && (
              <motion.div
                key="testing"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="p-6">
              >
                <h3 className="text-lg font-semibold mb-4">API Testing Playground</h3>
                {testingEndpoint ? (
                  <div className="space-y-4">
                    <div className="card bg-base-100 shadow">
                      <div className="card-body">
                        <h4 className="card-title">{testingEndpoint.name}</h4>
                        <div className="flex items-center space-x-4 mb-4">
                          <span className={`badge ${getMethodColor(testingEndpoint.method)}`}>
                            {testingEndpoint.method}
                          </span>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {testingEndpoint.path}
                          </code>
                        </div>
                        <p className="text-gray-600 mb-4">{testingEndpoint.description}</p>
                        
                        {testingEndpoint.parameters && testingEndpoint.parameters.length > 0 && (
                          <div className="mb-4">
                            <h5 className="font-semibold mb-2">Parameters:</h5>
                            <div className="space-y-2">
                              {testingEndpoint.parameters.map((param, index) => (
                                <div key={index} className="flex items-center space-x-4">
                                  <span className="font-mono text-sm">{param.name}</span>
                                  <span className="badge badge-outline">{param.type}</span>
                                  {param.required && <span className="badge badge-error">Required</span>}
                                  <span className="text-sm text-gray-600">{param.description}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="card-actions justify-end">
                          <button 
                            onClick={() => testEndpoint(testingEndpoint)}
                            className="btn btn-primary">
                            disabled={isTesting}
                          >
                            {isTesting ? (
                              <>
                                <span className="loading loading-spinner loading-sm"></span>
                                Testing...
                              </>
                            ) : (
                              <>
                                <FiPlay className="w-4 h-4" />
                                Test Endpoint
                              </>
                            )}
                          </button>
                          <button 
                            onClick={() => setTestingEndpoint(null)}
                            className="btn btn-ghost">
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiCode className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h4 className="text-lg font-semibold text-gray-600 mb-2">Select an endpoint to test</h4>
                    <p className="text-gray-500">Choose an endpoint from the list to start testing</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'monitoring' && (
              <motion.div
                key="monitoring"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="p-6">
              >
                <h3 className="text-lg font-semibold mb-4">Test Results ({testResults.length})</h3>
                {testResults.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                      <thead>
                        <tr>
                          <th>Endpoint</th>
                          <th>Method</th>
                          <th>Status</th>
                          <th>Response Time</th>
                          <th>Status Code</th>
                          <th>Timestamp</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testResults.map((result, index) => (
                          <tr key={index}>
                            <td>
                              <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                {result.endpoint}
                              </code>
                            </td>
                            <td>
                              <span className={`badge ${getMethodColor(result.method)}`}>
                                {result.method}
                              </span>
                            </td>
                            <td>
                              <div className="flex items-center space-x-2">
                                {result.status === 'success' ? (
                                  <FiCheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <FiXCircle className="w-4 h-4 text-red-500" />
                                )}
                                <span className={`badge ${
                                  result.status === 'success' ? 'badge-success' : 'badge-error'
                                }`}>
                                  {result.status}
                                </span>
                              </div>
                            </td>
                            <td>{result.responseTime}ms</td>
                            <td>
                              <span className={`badge ${
                                result.statusCode >= 200 && result.statusCode < 300 
                                  ? 'badge-success' 
                                  : 'badge-error'
                              }`}>
                                {result.statusCode}
                              </span>
                            </td>
                            <td>{new Date(result.timestamp).toLocaleString()}</td>
                            <td>
                              <button 
                                onClick={() => copyToClipboard(JSON.stringify(result.response, null, 2))}
                                className="btn btn-ghost btn-xs">
                              >
                                <FiCopy className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiActivity className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h4 className="text-lg font-semibold text-gray-600 mb-2">No test results yet</h4>
                    <p className="text-gray-500">Start testing endpoints to see results here</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'documentation' && (
              <motion.div
                key="documentation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="p-6">
              >
                <h3 className="text-lg font-semibold mb-4">API Documentation</h3>
                <div className="space-y-6">
                  {filteredEndpoints.map((endpoint) => (
                    <div key={endpoint.id} className="card bg-base-100 shadow">
                      <div className="card-body">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="card-title">{endpoint.name}</h4>
                          <div className="flex items-center space-x-2">
                            <span className={`badge ${getMethodColor(endpoint.method)}`}>
                              {endpoint.method}
                            </span>
                            <span className={`badge ${getStatusColor(endpoint.status)}`}>
                              {endpoint.status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <code className="text-lg bg-gray-100 px-3 py-2 rounded block">
                            {endpoint.method} {endpoint.path}
                          </code>
                        </div>
                        
                        <p className="text-gray-600 mb-4">{endpoint.description}</p>
                        
                        {endpoint.parameters && endpoint.parameters.length > 0 && (
                          <div className="mb-4">
                            <h5 className="font-semibold mb-2">Parameters:</h5>
                            <div className="overflow-x-auto">
                              <table className="table table-compact w-full">
                                <thead>
                                  <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Required</th>
                                    <th>Description</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {endpoint.parameters.map((param, index) => (
                                    <tr key={index}>
                                      <td>
                                        <code className="text-sm">{param.name}</code>
                                      </td>
                                      <td>
                                        <span className="badge badge-outline">{param.type}</span>
                                      </td>
                                      <td>
                                        {param.required ? (
                                          <span className="badge badge-error">Yes</span>
                                        ) : (
                                          <span className="badge badge-ghost">No</span>
                                        )}
                                      </td>
                                      <td>{param.description}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {endpoint.example && (
                          <div className="mb-4">
                            <h5 className="font-semibold mb-2">Example Request:</h5>
                            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                              <code>{JSON.stringify(endpoint.example, null, 2)}</code>
                            </pre>
                          </div>
                        )}

                        <div className="card-actions justify-end">
                          <button 
                            onClick={() => testEndpoint(endpoint)}
                            className="btn btn-primary btn-sm">
                            disabled={isTesting}
                          >
                            <FiPlay className="w-4 h-4 mr-2" />
                            Test
                          </button>
                          <button 
                            onClick={() => copyToClipboard(endpoint.path)}
                            className="btn btn-ghost btn-sm">
                          >
                            <FiCopy className="w-4 h-4 mr-2" />
                            Copy Path
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ApiManagement;
