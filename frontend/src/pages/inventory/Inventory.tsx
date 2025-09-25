// Enhanced Inventory Management System
// ComputerPOS Pro - Production Implementation

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { posApi } from '../../services/api/posApi';
import { API_BASE_URL } from '../../services/api';
import apiClient from '../../services/api/client';
import { toast } from 'react-hot-toast';
import {
  FiPackage, FiUpload, FiDownload, FiPlus, FiSearch, FiRefreshCw, FiEdit3,
  FiFilter, FiGrid, FiList, FiEye, FiEyeOff, FiMoreVertical, FiChevronDown,
  FiTrendingUp, FiTrendingDown, FiAlertTriangle, FiCheckCircle,
  FiX, FiBarChart, FiSettings, FiTruck,
  FiDollarSign, FiPercent, FiTarget, FiZap, FiTool
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

// Helper functions
const formatVND = (amountInCents: number) => {
  const amountInVND = Math.round(amountInCents / 100);
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amountInVND);
};
const formatNumber = (num: number) => new Intl.NumberFormat('vi-VN').format(num);

// API Product from backend
interface ApiProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost_price: number;
  stock: number;
  active: number;
  category_name?: string;
}

// Enhanced Product Types (normalized for UI)
interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  category_id: string;
  category_name: string;
  brand?: string;
  cost_price: number;
  selling_price: number;
  stock: number;
  min_stock: number;
  max_stock: number;
  stock_status: 'low' | 'normal' | 'high';
  status: 'active' | 'inactive' | 'discontinued';
  weight?: number;
  dimensions?: string;
  warranty_months: number;
  tags?: string;
  images?: string[];
  attributes?: Record<string, any>;
  is_service: boolean;
  has_variants: boolean;
  variant_count: number;
  created_at: string;
  updated_at: string;
}

interface InventoryStats {
  total_products: number;
  total_value: number;
  low_stock_items: number;
  out_of_stock_items: number;
  categories_count: number;
  avg_stock_level: number;
  total_investment: number;
  potential_profit: number;
  turnover_rate: number;
}

const Inventory: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Enhanced State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'high'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'discontinued'>('all');
  const [priceRange, setPriceRange] = useState<{min: number, max: number}>({min: 0, max: 10000000});
  const [priceBand, setPriceBand] = useState<string>('');
  const [minStock, setMinStock] = useState<string>('');
  const [maxStock, setMaxStock] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'value' | 'created_at'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showStockMovementModal, setShowStockMovementModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [movementDelta, setMovementDelta] = useState<number>(0);
  const [movementReason, setMovementReason] = useState<string>('manual_adjustment');
  const [movementNotes, setMovementNotes] = useState<string>('');

  // Bulk edit Min/Max modal state
  const [showBulkMinMax, setShowBulkMinMax] = useState(false);
  const [bulkMin, setBulkMin] = useState('');
  const [bulkMax, setBulkMax] = useState('');

  // Fetch products with real API
  const { data: productsResponse, isLoading: isLoadingProducts, refetch: refetchProducts } = useQuery({
    queryKey: ['inventory-products', searchTerm, selectedCategory, stockFilter, statusFilter, currentPage, itemsPerPage],
    queryFn: async () => {
      try {
        const response = await posApi.getProducts(currentPage, itemsPerPage);
        return response;
      } catch (error) {
        console.error('Products fetch error:', error);
        toast.error('Lỗi tải danh sách sản phẩm');
        throw error;
      }
    }
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await posApi.getCategories();
        return (response && response.data) || [];
      } catch (error) {
        console.error('Categories fetch error:', error);
        return [];
      }
    }
  });

  // Normalize products for UI
  const normalizedProducts: Product[] = useMemo(() => {
    const list: ApiProduct[] = (productsResponse?.data as any)?.data || [];
    const mapped: Product[] = list.map((p) => ({
      id: p.id,
      name: p.name,
      description: '',
      sku: p.sku,
      barcode: '',
      category_id: '',
      category_name: p.category_name || 'Khác',
      brand: '',
      cost_price: p.cost_price ?? p.cost,
      selling_price: p.price,
      stock: p.stock,
      min_stock: 5,
      max_stock: 100,
      stock_status: p.stock === 0 ? 'low' : (p.stock <= 5 ? 'low' : (p.stock >= 100 ? 'high' : 'normal')),
      status: p.active > 0 ? 'active' : 'inactive',
      weight: undefined,
      dimensions: undefined,
      warranty_months: 0,
      tags: '',
      images: [],
      attributes: {},
      is_service: false,
      has_variants: false,
      variant_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Apply local filters (search/category/status/stock/price)
    let filtered = mapped.filter((product) => {
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        if (!(`${product.name}`.toLowerCase().includes(s) || `${product.sku}`.toLowerCase().includes(s))) return false;
      }
      if (selectedCategory && product.category_id !== selectedCategory) return false;
      if (selectedBrand && (product.brand || '').toLowerCase() !== selectedBrand.toLowerCase()) return false;
      if (statusFilter !== 'all' && product.status !== statusFilter) return false;
      if (stockFilter === 'low' && !(product.stock <= product.min_stock && product.stock > 0)) return false;
      if (stockFilter === 'out' && product.stock !== 0) return false;
      if (stockFilter === 'high' && !(product.stock >= product.max_stock)) return false;
      if (product.selling_price < priceRange.min || product.selling_price > priceRange.max) return false;
      if (priceBand) {
        const bands = {
          'lt-100k': [0, 100000],
          '100-500k': [100000, 500000],
          '500k-1m': [500000, 1000000],
          '1m-5m': [1000000, 5000000],
          'gt-5m': [5000000, Infinity]
        } as Record<string, [number, number]>;
        const band = bands[priceBand];
        if (band) {
          const val = product.selling_price;
          if (val < band[0] || val > band[1]) return false;
        }
      }
      if (minStock && product.stock < parseInt(minStock)) return false;
      if (maxStock && product.stock > parseInt(maxStock)) return false;
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'stock':
          aValue = a.stock;
          bValue = b.stock;
          break;
        case 'value':
          aValue = a.stock * a.cost_price;
          bValue = b.stock * b.cost_price;
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [productsResponse, searchTerm, selectedCategory, statusFilter, stockFilter, priceRange, sortBy, sortOrder, priceBand, minStock, maxStock]);

  // Calculate inventory stats (backend first, local fallback)
  const [backendStats, setBackendStats] = useState<InventoryStats | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const res = await posApi.getInventorySummary();
        if (res.success && res.data) {
          setBackendStats({
            total_products: res.data.total_products || 0,
            total_value: res.data.total_value || 0,
            low_stock_items: res.data.low_stock || 0,
            out_of_stock_items: res.data.out_of_stock || 0,
            categories_count: res.data.categories_count || 0,
            avg_stock_level: res.data.avg_stock_level || 0,
            total_investment: res.data.total_cost || 0,
            potential_profit: res.data.gross_profit || 0,
            turnover_rate: 0
          });
        }
      } catch (e) {
        // silent fallback
      }
    })();
  }, []);

  const inventoryStats = useMemo((): InventoryStats => {
    if (backendStats) return backendStats;
    if (!normalizedProducts || normalizedProducts.length === 0) {
      return {
        total_products: 0,
        total_value: 0,
        low_stock_items: 0,
        out_of_stock_items: 0,
        categories_count: 0,
        avg_stock_level: 0,
        total_investment: 0,
        potential_profit: 0,
        turnover_rate: 0
      };
    }
    const products = normalizedProducts;
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + (p.stock * p.cost_price), 0);
    const totalInvestment = products.reduce((sum, p) => sum + (p.stock * p.cost_price), 0);
    const potentialProfit = products.reduce((sum, p) => sum + (p.stock * (p.selling_price - p.cost_price)), 0);
    const lowStockItems = products.filter(p => p.stock <= p.min_stock && p.stock > 0).length;
    const outOfStockItems = products.filter(p => p.stock === 0).length;
    const categories = new Set(products.map(p => p.category_id || p.category_name)).size;
    const avgStockLevel = totalProducts > 0 ? products.reduce((sum, p) => sum + p.stock, 0) / totalProducts : 0;
    return {
      total_products: totalProducts,
      total_value: totalValue,
      low_stock_items: lowStockItems,
      out_of_stock_items: outOfStockItems,
      categories_count: categories,
      avg_stock_level: Math.round(avgStockLevel),
      total_investment: totalInvestment,
      potential_profit: potentialProfit,
      turnover_rate: totalInvestment > 0 ? (potentialProfit / totalInvestment) * 100 : 0
    };
  }, [backendStats, normalizedProducts]);

  // Enhanced filtering and sorting (already applied in normalizedProducts)
  const filteredAndSortedProducts = normalizedProducts;

  // Pagination
  const totalPages = Math.ceil((((productsResponse?.data as any)?.pagination?.total || 0)) / itemsPerPage);

  // Inventory logs for selected product
  const { data: inventoryLogsResponse, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['inventory-logs', selectedProduct?.id],
    queryFn: async () => {
      const res = await posApi.getInventoryLogs(selectedProduct?.id || '', 1, 20);
      return res;
    },
    enabled: !!selectedProduct && showStockMovementModal,
  });

  const handleAdjustInventory = useCallback(async () => {
    if (!selectedProduct) return;
    if (!movementDelta || movementDelta === 0) {
      toast.error('Vui lòng nhập số lượng thay đổi khác 0');
      return;
    }
    try {
      const res = await posApi.adjustInventory(selectedProduct.id, movementDelta, movementReason, movementNotes);
      if (res.success) {
        toast.success('Cập nhật tồn kho thành công');
        setMovementDelta(0);
        setMovementNotes('');
        setShowStockMovementModal(false);
        setSelectedProduct(null);
        queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
        refetchProducts();
      } else {
        toast.error(res.error || 'Không thể cập nhật tồn kho');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Lỗi cập nhật tồn kho');
    }
  }, [selectedProduct, movementDelta, movementReason, movementNotes, queryClient, refetchProducts]);

  // Bulk actions
  const handleSelectAll = useCallback(() => {
    if (selectedProducts.length === filteredAndSortedProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredAndSortedProducts.map((p: Product) => p.id));
    }
  }, [selectedProducts.length, filteredAndSortedProducts]);

  const handleSelectProduct = useCallback((productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  }, []);

  const handleBulkStatusChange = useCallback(async (status: string) => {
    if (selectedProducts.length === 0) return;
    const action = status === 'active' ? 'kích hoạt' : 'vô hiệu hóa';
    if (!window.confirm(`Bạn có chắc chắn muốn ${action} ${selectedProducts.length} sản phẩm đã chọn?`)) return;
    try {
      const res = await apiClient.request({
        method: 'PATCH',
        url: `/products/bulk-status`,
        data: { ids: selectedProducts, status }
      });
      if (res.data?.success) {
        toast.success(`Đã ${action} ${res.data.data?.updated_count || selectedProducts.length} sản phẩm`);
        setSelectedProducts([]);
        queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      } else {
        toast.error(res.data?.message || 'Không thể cập nhật hàng loạt');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi cập nhật hàng loạt');
    }
  }, [selectedProducts, queryClient]);

  const handleBulkMinMax = useCallback(async () => {
    if (selectedProducts.length === 0) return;
    try {
      const res = await apiClient.request({
        method: 'PATCH',
        url: `/products/bulk-minmax`,
        data: { ids: selectedProducts, min: bulkMin ? parseInt(bulkMin) : undefined, max: bulkMax ? parseInt(bulkMax) : undefined }
      });
      if (res.data?.success) {
        toast.success(`Đã cập nhật min/max cho ${res.data.data?.updated_count || selectedProducts.length} sản phẩm`);
        setShowBulkMinMax(false);
        setBulkMin('');
        setBulkMax('');
        setSelectedProducts([]);
        queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      } else {
        toast.error(res.data?.message || 'Không thể cập nhật min/max');
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Lỗi cập nhật min/max');
    }
  }, [selectedProducts, bulkMin, bulkMax, queryClient]);

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) {
      return { status: 'out_of_stock', label: 'Hết hàng', color: 'error', icon: FiX };
    } else if (product.stock <= product.min_stock) {
      return { status: 'low_stock', label: 'Sắp hết', color: 'warning', icon: FiAlertTriangle };
    } else if (product.stock >= product.max_stock) {
      return { status: 'high_stock', label: 'Dư thừa', color: 'info', icon: FiTrendingUp };
    } else {
      return { status: 'normal', label: 'Bình thường', color: 'success', icon: FiCheckCircle };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'discontinued': return 'error';
      default: return 'neutral';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Hoạt động';
      case 'inactive': return 'Tạm dừng';
      case 'discontinued': return 'Ngừng sản xuất';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-base-200 p-4">
      {/* Enhanced Header */}
      <div className="bg-base-100 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center">
              <FiPackage className="mr-3" />
              Quản lý Tồn kho
            </h1>
            <p className="text-base-content/70 mt-1">
              Theo dõi và quản lý inventory sản phẩm chuyên nghiệp
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              className="btn btn-secondary btn-sm" onClick={() => navigate('/inventory/operations')}
            >
              <FiTool className="mr-1" />
              Quản lý kho
            </button>
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-outline btn-sm">
                <FiMoreVertical className="mr-1" />
                Thêm
                <FiChevronDown className="ml-1" />
              </div>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                <li><a><FiUpload className="mr-2" />Import Excel</a></li>
                <li>
                  <a onClick={() => {
                    const params = new URLSearchParams();
                    if (searchTerm) params.append('search', searchTerm);
                    if (selectedCategory) params.append('category_id', selectedCategory);
                    if (selectedBrand) params.append('brand', selectedBrand);
                    if (statusFilter !== 'all') params.append('status', statusFilter);
                    if (stockFilter !== 'all') params.append('stock', stockFilter);
                    if (priceBand) params.append('price_band', priceBand);
                    if (minStock) params.append('min_stock', minStock);
                    if (maxStock) params.append('max_stock', maxStock);
                    params.append('sort_by', sortBy);
                    params.append('sort_order', sortOrder);
                    window.open(`${API_BASE_URL}/inventory/export/stock.csv?${params.toString()}`, '_blank');
                  }}>
                    <FiDownload className="mr-2" />Export CSV
                  </a>
                </li>
                <li>
                  <a onClick={() => window.open(`${API_BASE_URL}/inventory/export/locations.csv`, '_blank')}>
                    <FiDownload className="mr-2" />Export Locations CSV
                  </a>
                </li>
                <li>
                  <a onClick={() => window.open(`${API_BASE_URL}/inventory/audit/export.csv`, '_blank')}>
                    <FiDownload className="mr-2" />Export Audit CSV
                  </a>
                </li>
                <li><a><FiBarChart className="mr-2" />Báo cáo</a></li>
                <li><a><FiSettings className="mr-2" />Cài đặt</a></li>
              </ul>
            </div>
            <button 
              className="btn btn-primary btn-sm" onClick={() => setShowStockMovementModal(true)}
            >
              <FiPlus className="mr-1" />
              Nhập/Xuất kho
            </button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">
          <div className="stat bg-primary/10 rounded-lg p-4">
            <div className="stat-figure text-primary">
              <FiPackage className="text-2xl" />
            </div>
            <div className="stat-title">Tổng SP</div>
            <div className="stat-value text-primary">{formatNumber(inventoryStats.total_products)}</div>
          </div>
          
          <div className="stat bg-success/10 rounded-lg p-4">
            <div className="stat-figure text-success">
              <FiDollarSign className="text-2xl" />
            </div>
            <div className="stat-title">Giá trị kho</div>
            <div className="stat-value text-success text-sm">{formatVND(inventoryStats.total_value)}</div>
          </div>
          
          <div className="stat bg-warning/10 rounded-lg p-4">
            <div className="stat-figure text-warning">
              <FiAlertTriangle className="text-2xl" />
            </div>
            <div className="stat-title">Sắp hết</div>
            <div className="stat-value text-warning">{formatNumber(inventoryStats.low_stock_items)}</div>
          </div>
          
          <div className="stat bg-error/10 rounded-lg p-4">
            <div className="stat-figure text-error">
              <FiX className="text-2xl" />
            </div>
            <div className="stat-title">Hết hàng</div>
            <div className="stat-value text-error">{formatNumber(inventoryStats.out_of_stock_items)}</div>
          </div>
          
          <div className="stat bg-info/10 rounded-lg p-4">
            <div className="stat-figure text-info">
              <FiTarget className="text-2xl" />
            </div>
            <div className="stat-title">Danh mục</div>
            <div className="stat-value text-info">{formatNumber(inventoryStats.categories_count)}</div>
          </div>
          
          <div className="stat bg-secondary/10 rounded-lg p-4">
            <div className="stat-figure text-secondary">
              <FiPercent className="text-2xl" />
            </div>
            <div className="stat-title">Lợi nhuận</div>
            <div className="stat-value text-secondary text-sm">{formatVND(inventoryStats.potential_profit)}</div>
          </div>
          {/* Expiring/Overstock badges - quick surface from analytics (optional future wire) */}
          <div className="stat bg-accent/10 rounded-lg p-4">
            <div className="stat-figure text-accent">
              <FiZap className="text-2xl" />
            </div>
            <div className="stat-title">Cảnh báo</div>
            <div className="stat-value text-accent text-sm">Overstock/Expiry</div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-base-100 rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <FiFilter className="mr-2" />
            Bộ lọc & Tìm kiếm
          </h3>
          <div className="flex gap-2">
            <button
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setViewMode('table')}
            >
              <FiList className="mr-1" />
              Bảng
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setViewMode('grid')}
            >
              <FiGrid className="mr-1" />
              Lưới
            </button>
            <button
              className="btn btn-sm btn-outline" onClick={() => setShowFilters(!showFilters)}
            >
              <FiFilter className="mr-1" />
              {showFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="form-control mb-4">
          <div className="input-group">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm theo tên, SKU, barcode..."
              className="input input-bordered flex-1"
                  value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn btn-square">
              <FiSearch />
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            {/* Category Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Danh mục</span>
              </label>
              <select
                className="select select-bordered"
                  value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Thương hiệu</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                  placeholder="VD: Apple, Samsung..."
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
              />
            </div>

            {/* Stock Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Tình trạng kho</span>
              </label>
              <select
                className="select select-bordered"
                  value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
              >
                <option value="all">Tất cả</option>
                <option value="low">Sắp hết hàng</option>
                <option value="out">Hết hàng</option>
                <option value="high">Dư thừa</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Trạng thái</span>
              </label>
              <select
                className="select select-bordered"
                  value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="all">Tất cả</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Tạm dừng</option>
                <option value="discontinued">Ngừng sản xuất</option>
              </select>
            </div>

            {/* Sort */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Sắp xếp</span>
              </label>
              <div className="flex gap-1">
                <select
                  className="select select-bordered flex-1"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="name">Tên</option>
                  <option value="stock">Tồn kho</option>
                  <option value="value">Giá trị</option>
                  <option value="created_at">Ngày tạo</option>
                </select>
                <button
                  className="btn btn-outline btn-square" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? <FiTrendingUp /> : <FiTrendingDown />}
                </button>
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Khoảng giá</span>
              </label>
              <div className="flex gap-1">
                <input
                  type="number"
                  className="input input-bordered flex-1"
                  placeholder="Từ"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({...priceRange, min: parseInt(e.target.value) || 0})}
                />
                <input
                  type="number"
                  className="input input-bordered flex-1"
                  placeholder="Đến"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({...priceRange, max: parseInt(e.target.value) || 10000000})}
                />
              </div>
            </div>

            {/* Price Bands */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Dải giá</span>
              </label>
              <select
                className="select select-bordered"
                  value={priceBand}
                onChange={(e) => setPriceBand(e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="lt-100k">Dưới 100k</option>
                <option value="100-500k">100k - 500k</option>
                <option value="500k-1m">500k - 1 triệu</option>
                <option value="1m-5m">1 - 5 triệu</option>
                <option value="gt-5m">Trên 5 triệu</option>
              </select>
            </div>

            {/* Min/Max Stock */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Tồn kho tối thiểu</span>
              </label>
              <input
                type="number"
                className="input input-bordered"
                  placeholder="VD: 5"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Tồn kho tối đa</span>
              </label>
              <input
                type="number"
                className="input input-bordered"
                  placeholder="VD: 100"
                value={maxStock}
                onChange={(e) => setMaxStock(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Products Table */}
      <div className="bg-base-100 rounded-lg shadow-sm">
        <div className="p-4 border-b border-base-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold">
                Danh sách sản phẩm ({filteredAndSortedProducts.length})
              </h2>
              {selectedProducts.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-primary">
                    Đã chọn {selectedProducts.length} sản phẩm
                  </span>
                  <div className="dropdown dropdown-end">
                    <div tabIndex={0} role="button" className="btn btn-sm btn-outline">
                      Thao tác hàng loạt
                      <FiChevronDown className="ml-1" />
                    </div>
                    <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-48">
                      <li><a onClick={() => handleBulkStatusChange('active')}><FiCheckCircle className="mr-2" />Kích hoạt</a></li>
                      <li><a onClick={() => handleBulkStatusChange('inactive')}><FiEyeOff className="mr-2" />Vô hiệu hóa</a></li>
                      <li><a onClick={() => setShowBulkMinMax(true)}><FiSettings className="mr-2" />Sửa Min/Max</a></li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select
                className="select select-bordered select-sm"
                  value={itemsPerPage}
                onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
              >
                <option value={10}>10/trang</option>
                <option value={20}>20/trang</option>
                <option value={50}>50/trang</option>
                <option value={100}>100/trang</option>
              </select>
              <button
                className="btn btn-ghost btn-sm" onClick={() => refetchProducts()}
                disabled={isLoadingProducts}
              >
                <FiRefreshCw className={`mr-1 ${isLoadingProducts ? 'animate-spin' : ''}`} />
                Làm mới
              </button>
            </div>
          </div>
        </div>

        {isLoadingProducts ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-8 text-base-content/50">
            <FiPackage className="mx-auto text-4xl mb-2" />
            <p>Không tìm thấy sản phẩm nào</p>
            <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc thêm sản phẩm mới</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                  checked={selectedProducts.length === filteredAndSortedProducts.length && filteredAndSortedProducts.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Sản phẩm</th>
                  <th>SKU</th>
                  <th>Danh mục</th>
                  <th>Giá bán</th>
                  <th>Giá vốn</th>
                  <th>Tồn kho</th>
                  <th>Giá trị</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedProducts.map((product: Product) => {
                  const stockStatus = getStockStatus(product);
                  const StatusIcon = stockStatus.icon;
                  const productValue = product.stock * product.cost_price;
                  
                  return (
                    <tr key={product.id} className={selectedProducts.includes(product.id) ? 'bg-primary/10' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                  checked={selectedProducts.includes(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                        />
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder">
                            <div className="bg-primary text-primary-content rounded w-12 h-12">
                              <span className="text-lg font-bold">
                                {product.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            {product.description && (
                              <div className="text-sm text-base-content/70 truncate max-w-xs">
                                {product.description}
                              </div>
                            )}
                            {product.barcode && (
                              <div className="text-xs text-base-content/50">
                                Barcode: {product.barcode}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <code className="text-sm bg-base-200 px-2 py-1 rounded">{product.sku}</code>
                      </td>
                      <td>
                        <span className="badge badge-outline">{product.category_name}</span>
                      </td>
                      <td>
                        <div className="font-medium text-primary">
                          {formatVND(product.selling_price)}
                        </div>
                      </td>
                      <td>
                        <div className="text-sm">
                          {formatVND(product.cost_price)}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${
                            stockStatus.status === 'out_of_stock' ? 'text-error' :
                            stockStatus.status === 'low_stock' ? 'text-warning' :
                            stockStatus.status === 'high_stock' ? 'text-info' :
                            'text-success'
                          }`}>
                            {formatNumber(product.stock)}
                          </span>
                          <StatusIcon className={`text-sm ${
                            stockStatus.status === 'out_of_stock' ? 'text-error' :
                            stockStatus.status === 'low_stock' ? 'text-warning' :
                            stockStatus.status === 'high_stock' ? 'text-info' :
                            'text-success'
                          }`} />
                        </div>
                        <div className="text-xs text-base-content/50">
                          Min: {formatNumber(product.min_stock)} | Max: {formatNumber(product.max_stock)}
                        </div>
                      </td>
                      <td>
                        <div className="font-medium text-secondary">
                          {formatVND(productValue)}
                        </div>
                        <div className="text-xs text-base-content/50">
                          Lãi: {formatVND(product.stock * (product.selling_price - product.cost_price))}
                        </div>
                      </td>
                      <td>
                        <div className={`badge badge-${getStatusColor(product.status)}`}>
                          {getStatusLabel(product.status)}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            className="btn btn-ghost btn-xs"
                  title="Xem chi tiết"
                          >
                            <FiEye />
                          </button>
                          <button
                            className="btn btn-ghost btn-xs"
                  title="Chỉnh sửa"
                          >
                            <FiEdit3 />
                          </button>
                          <button
                            className="btn btn-ghost btn-xs"
                  title="Nhập/Xuất kho"
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowStockMovementModal(true);
                            }}
                          >
                            <FiTruck />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAndSortedProducts.map((product: Product) => {
                const stockStatus = getStockStatus(product);
                const StatusIcon = stockStatus.icon;
                const productValue = product.stock * product.cost_price;
                
                return (
                  <div key={product.id} className={`card bg-base-100 shadow-sm border ${selectedProducts.includes(product.id) ? 'border-primary' : 'border-base-300'}`}>
                    <div className="card-body p-4">
                      <div className="flex items-start justify-between mb-2">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                  checked={selectedProducts.includes(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                        />
                        <div className={`badge badge-${getStatusColor(product.status)} badge-sm`}>
                          {getStatusLabel(product.status)}
                        </div>
                      </div>
                      
                      <div className="avatar placeholder mb-3">
                        <div className="bg-primary text-primary-content rounded w-16 h-16">
                          <span className="text-2xl font-bold">
                            {product.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <h3 className="card-title text-sm font-medium line-clamp-2">
                            {product.name}
                      </h3>
                      
                      <div className="text-xs text-base-content/70 mb-2">
                        <code>{product.sku}</code>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-2">
                        <span className="badge badge-outline badge-xs">{product.category_name}</span>
                        <span className={`badge badge-${stockStatus.color} badge-xs`}>
                          <StatusIcon className="mr-1" />
                          {stockStatus.label}
                        </span>
                      </div>
                      
                      <div className="space-y-1 mb-3">
                        <div className="flex justify-between text-sm">
                          <span>Giá bán:</span>
                          <span className="font-medium text-primary">{formatVND(product.selling_price)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Giá vốn:</span>
                          <span>{formatVND(product.cost_price)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Tồn kho:</span>
                          <span className={`font-medium ${
                            stockStatus.status === 'out_of_stock' ? 'text-error' :
                            stockStatus.status === 'low_stock' ? 'text-warning' :
                            stockStatus.status === 'high_stock' ? 'text-info' :
                            'text-success'
                          }`}>
                            {formatNumber(product.stock)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Giá trị:</span>
                          <span className="font-medium text-secondary">{formatVND(productValue)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-base-content/50">
                          Lãi: {formatVND(product.stock * (product.selling_price - product.cost_price))}
                        </div>
                        <div className="flex gap-1">
                          <button
                            className="btn btn-ghost btn-xs"
                  title="Xem chi tiết"
                          >
                            <FiEye />
                          </button>
                          <button
                            className="btn btn-ghost btn-xs"
                  title="Nhập/Xuất kho"
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowStockMovementModal(true);
                            }}
                          >
                            <FiTruck />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-base-300">
            <div className="text-sm text-base-content/70">
              Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, ((productsResponse?.data as any)?.pagination?.total || 0))} 
              trong tổng số {((productsResponse?.data as any)?.pagination?.total || 0)} sản phẩm
            </div>
            <div className="join">
              <button
                className="join-item btn btn-sm" onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                «
              </button>
              <button
                className="join-item btn btn-sm" onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ‹
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    className={`join-item btn btn-sm ${currentPage === pageNum ? 'btn-active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                className="join-item btn btn-sm" onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                ›
              </button>
              <button
                className="join-item btn btn-sm" onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stock Movement Modal */}
      {showStockMovementModal && selectedProduct && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-3xl">
            <h3 className="font-bold text-lg mb-3">Nhập/Xuất kho - {selectedProduct.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="form-control mb-3">
                  <label className="label"><span className="label-text">Số lượng thay đổi (+ nhập, - xuất)</span></label>
                  <input
                    type="number"
                    className="input input-bordered"
                  value={movementDelta}
                    onChange={(e) => setMovementDelta(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="form-control mb-3">
                  <label className="label"><span className="label-text">Lý do</span></label>
                  <select
                    className="select select-bordered"
                  value={movementReason}
                    onChange={(e) => setMovementReason(e.target.value)}
                  >
                    <option value="manual_adjustment">Điều chỉnh thủ công</option>
                    <option value="purchase_in">Nhập mua hàng</option>
                    <option value="sale_out">Xuất bán hàng</option>
                    <option value="return_in">Nhập hàng trả</option>
                    <option value="damage_out">Hàng hỏng</option>
                    <option value="transfer">Chuyển kho</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Ghi chú</span></label>
                  <textarea
                    className="textarea textarea-bordered"
                  placeholder="Ghi chú (tùy chọn)"
                    value={movementNotes}
                    onChange={(e) => setMovementNotes(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Lịch sử tồn kho</h4>
                  {isLoadingLogs ? <span className="loading loading-spinner loading-sm"></span> : null}
                </div>
                <div className="max-h-64 overflow-auto border border-base-300 rounded">
                  {inventoryLogsResponse?.success && (inventoryLogsResponse as any).data?.data?.length > 0 ? (
                    <ul className="menu">
                      {(inventoryLogsResponse as any).data.data.map((log: any) => (
                        <li key={log.id} className="px-3 py-2">
                          <div className="flex items-center justify-between text-sm">
                            <div>
                              <div className="font-medium">{log.delta > 0 ? `+${log.delta}` : `${log.delta}`} ({log.reason})</div>
                              <div className="text-xs text-base-content/60">{new Date(log.created_at).toLocaleString()}</div>
                            </div>
                            <div className={`badge ${log.delta > 0 ? 'badge-success' : 'badge-error'}`}>{log.delta > 0 ? 'Nhập' : 'Xuất'}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-3 text-sm text-base-content/60">Chưa có lịch sử</div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => { setShowStockMovementModal(false); setSelectedProduct(null); }}>Đóng</button>
              <button className="btn btn-primary" onClick={handleAdjustInventory}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Min/Max Modal */}
      {showBulkMinMax && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-3">Sửa Min/Max tồn kho ({selectedProducts.length} SP)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label"><span className="label-text">Min stock</span></label>
                <input type="number" className="input input-bordered w-full" value={bulkMin} onChange={(e) => setBulkMin(e.target.value)} />
              </div>
              <div>
                <label className="label"><span className="label-text">Max stock</span></label>
                <input type="number" className="input input-bordered w-full" value={bulkMax} onChange={(e) => setBulkMax(e.target.value)} />
              </div>
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => setShowBulkMinMax(false)}>Đóng</button>
              <button className="btn btn-primary" onClick={handleBulkMinMax}>Cập nhật</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;

