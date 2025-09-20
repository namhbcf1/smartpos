import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Grid3X3,
  List,
  Download,
  Upload,
  X,
  Save,
  AlertCircle,
  Loader2
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
// import apiClient from '../../services/api/client';
import { posApi } from '../../services/api/posApi';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost_price: number;
  stock: number;
  active: number;
  category_name?: string;
  category_id?: string;
  brand_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface FormErrors {
  name?: string;
  sku?: string;
  price?: string;
  cost_price?: string;
  stock?: string;
  category_name?: string;
  brand_name?: string;
}

interface LoadingStates {
  save: boolean;
  delete: boolean;
  create: boolean;
  refresh: boolean;
}

const ModernProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(24);
  const [totalItems, setTotalItems] = useState(0);
  const [isRefreshingKPI, setIsRefreshingKPI] = useState(false);
  
  // Categories (id/name) for selects
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [createForm, setCreateForm] = useState<Partial<Product>>({});
  
  // Form validation and loading states
  const [editErrors, setEditErrors] = useState<FormErrors>({});
  const [createErrors, setCreateErrors] = useState<FormErrors>({});
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    save: false,
    delete: false,
    create: false,
    refresh: false
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [inventorySummary, setInventorySummary] = useState<{
    total_products: number;
    out_of_stock: number;
    low_stock: number;
    total_value: number;
    total_cost: number;
    gross_profit: number;
  } | null>(null);

  // Form validation functions
  const validateForm = useCallback((form: Partial<Product>): FormErrors => {
    const errors: FormErrors = {};
    
    if (!form.name || form.name.trim().length === 0) {
      errors.name = 'Tên sản phẩm là bắt buộc';
    } else if (form.name.trim().length < 2) {
      errors.name = 'Tên sản phẩm phải có ít nhất 2 ký tự';
    } else if (form.name.trim().length > 100) {
      errors.name = 'Tên sản phẩm không được quá 100 ký tự';
    }
    
    if (!form.sku || form.sku.trim().length === 0) {
      errors.sku = 'SKU là bắt buộc';
    } else if (form.sku.trim().length < 2) {
      errors.sku = 'SKU phải có ít nhất 2 ký tự';
    } else if (form.sku.trim().length > 50) {
      errors.sku = 'SKU không được quá 50 ký tự';
    }
    
    if (form.price === undefined || form.price === null) {
      errors.price = 'Giá bán là bắt buộc';
    } else if (form.price < 0) {
      errors.price = 'Giá bán không được âm';
    } else if (form.price > 1000000000) {
      errors.price = 'Giá bán quá cao';
    }
    
    if (form.cost_price !== undefined && form.cost_price !== null) {
      if (form.cost_price < 0) {
        errors.cost_price = 'Giá nhập không được âm';
      } else if (form.cost_price > 1000000000) {
        errors.cost_price = 'Giá nhập quá cao';
      } else if (form.cost_price > (form.price || 0)) {
        errors.cost_price = 'Giá nhập không được cao hơn giá bán';
      }
    }
    
    if (form.stock !== undefined && form.stock !== null) {
      if (form.stock < 0) {
        errors.stock = 'Số lượng tồn kho không được âm';
      } else if (form.stock > 1000000) {
        errors.stock = 'Số lượng tồn kho quá lớn';
      }
    }
    
    if (form.category_name && form.category_name.trim().length > 50) {
      errors.category_name = 'Tên danh mục không được quá 50 ký tự';
    }
    
    if (form.brand_name && form.brand_name.trim().length > 50) {
      errors.brand_name = 'Tên thương hiệu không được quá 50 ký tự';
    }
    
    return errors;
  }, []);

  const validateField = useCallback((field: keyof FormErrors, value: any, form: Partial<Product>): string | undefined => {
    const tempForm = { ...form, [field]: value };
    const errors = validateForm(tempForm);
    return errors[field];
  }, [validateForm]);

  useEffect(() => {
    loadProducts(page, limit);
    loadInventorySummary();
    // Load categories for dropdowns
    (async () => {
      try {
        const res = await posApi.getCategories();
        if (res.success && res.data) {
          setCategories((res.data as any[]).map((c: any) => ({ id: String(c.id), name: c.name })));
        }
      } catch {}
    })();
  }, []);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!searchQuery || searchQuery.trim().length < 2) {
        loadProducts(page, limit);
        return;
      }
      try {
        setLoading(true);
        const res = await posApi.searchProducts(searchQuery.trim(), limit);
        if (res.success && res.data) {
          const transformed = (res.data || []).map((product: any) => ({
            id: product.id || `temp-${Date.now()}`,
            name: product.name || '',
            sku: product.sku || '',
            price: product.price || 0,
            cost_price: (product.cost_price ?? product.costPrice) || 0,
            stock: product.stock || 0,
            active: product.is_active ?? product.isActive ? 1 : 0,
            category_name: product.categoryName || '',
            brand_name: product.brandName || '',
            created_at: product.createdAt || '',
            updated_at: product.updatedAt || ''
          }));
          setProducts(transformed);
          setTotalItems(transformed.length);
        } else {
          setProducts([]);
          setTotalItems(0);
        }
      } catch (e: any) {
        setProducts([]);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery, page, limit]);

  const loadProducts = useCallback(async (pageParam: number = 1, limitParam: number = 24) => {
    try {
      setLoading(true);
      const response = await posApi.getProducts(pageParam, limitParam);
      if (response.success && response.data) {
        const productsData = response.data.data || [];
        // Transform API data to match our interface
        const transformedProducts = productsData.map((product: any) => ({
          id: product.id || `temp-${Date.now()}`,
          name: product.name || '',
          sku: product.sku || '',
          price: product.price || 0,
          cost_price: (product.cost_price ?? product.costPrice) || 0,
          stock: product.stock || 0,
          active: product.is_active ?? product.isActive ? 1 : 0,
          category_name: product.categoryName || '',
          brand_name: product.brandName || '',
          created_at: product.createdAt || '',
          updated_at: product.updatedAt || ''
        }));
        setProducts(transformedProducts);
        const p = (response as any).data?.pagination || (response as any).pagination || {};
        const total = p.total || p.totalItems || p.count || transformedProducts.length;
        setTotalItems(Number(total) || transformedProducts.length);
      } else {
        toast.error('Không thể tải danh sách sản phẩm');
        setProducts([]);
        setTotalItems(0);
      }
    } catch (error: any) {
      console.error('Error loading products:', error);
      let errorMessage = 'Lỗi khi tải danh sách sản phẩm';
      
      if (error.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        sessionStorage.removeItem('auth_token');
        setTimeout(() => window.location.href = '/login', 2000);
      } else if (error.response?.status === 403) {
        errorMessage = 'Không có quyền truy cập danh sách sản phẩm';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setProducts([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInventorySummary = async () => {
    try {
      setIsRefreshingKPI(true);
      const res = await posApi.getInventorySummary();
      if (res.success && res.data) {
        setInventorySummary(res.data);
      }
    } catch (err) {
      // silent fail; page vẫn hoạt động khi thiếu số liệu
    } finally {
      setIsRefreshingKPI(false);
    }
  };

  // Memoized filtered and sorted products for better performance
  const filteredProducts = useMemo(() => {
    return (products || []).filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category_name === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'stock':
          aValue = a.stock;
          bValue = b.stock;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [filteredProducts, sortBy, sortOrder]);

  const getStockStatus = useCallback((stock: number) => {
    if (stock === 0) return { label: 'Hết hàng', color: 'bg-red-100 text-red-800' };
    if (stock < 10) return { label: 'Sắp hết', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Còn hàng', color: 'bg-green-100 text-green-800' };
  }, []);

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setEditForm({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      cost_price: product.cost_price,
      stock: product.stock,
      active: product.active,
      category_name: product.category_name,
      category_id: product.category_id,
      brand_name: product.brand_name
    });
    setShowEditModal(true);
  };

  const handleSaveProduct = async () => {
    if (!selectedProduct) return;

    // Validate form
    const errors = validateForm(editForm);
    setEditErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      toast.error('Vui lòng sửa các lỗi trong form');
      return;
    }

    setLoadingStates(prev => ({ ...prev, save: true }));

    try {
      // Transform editForm data to match API expectations - using only fields that are safe to update
      const updateData: any = {};

      // Only include fields that have actually changed and are safe to update
      if (editForm.name && editForm.name !== selectedProduct.name) {
        updateData.name = editForm.name;
      }
      if (editForm.price !== undefined && Number(editForm.price) !== selectedProduct.price) {
        updateData.price = Number(editForm.price);
      }
      if (editForm.cost_price !== undefined && Number(editForm.cost_price) !== selectedProduct.cost_price) {
        updateData.cost_price = Number(editForm.cost_price);
      }
      if (editForm.stock !== undefined && Number(editForm.stock) !== selectedProduct.stock) {
        updateData.stock = Number(editForm.stock);
      }
      if (editForm.active !== undefined) {
        updateData.is_active = editForm.active === 1;
        updateData.status = editForm.active === 1 ? 'active' : 'inactive';
      }
      // Only include description if it exists
      if ((editForm as any).description) {
        updateData.description = (editForm as any).description;
      }
      if (editForm.category_id) {
        updateData.category_id = editForm.category_id;
      }

      // Call real API to update product
      const response = await posApi.updateProduct(selectedProduct.id, updateData);

      if (response.success) {
        // Update local state immediately for UI responsiveness
        setProducts(prevProducts =>
          prevProducts.map(p =>
            p.id === selectedProduct.id
              ? { ...p, ...editForm, price: Number(editForm.price), cost_price: Number(editForm.cost_price), stock: Number(editForm.stock) }
              : p
          )
        );

        toast.success('Cập nhật sản phẩm thành công!');
        setShowEditModal(false);
        setSelectedProduct(null);
        setEditForm({});
        setEditErrors({});

        // Reload products in background to sync with server
        loadProducts();
      } else {
        toast.error('Lỗi khi cập nhật sản phẩm: ' + (response.error || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('❌ Product update failed:', error);

      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        sessionStorage.removeItem('auth_token');
        setTimeout(() => window.location.href = '/login', 2000);
      } else if (error.response?.status === 500) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Internal server error';
        toast.error(`Lỗi server (500): ${errorMsg}`);
      } else if (error.response?.status === 422) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Validation error';
        toast.error(`Dữ liệu không hợp lệ: ${errorMsg}`);
      } else {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Unknown error';
        toast.error(`Lỗi cập nhật sản phẩm: ${errorMsg}`);
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, save: false }));
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setDeleteConfirmId(productId);
  };

  const confirmDeleteProduct = async (productId: string) => {

    setLoadingStates(prev => ({ ...prev, delete: true }));

    try {
      const response = await posApi.deleteProduct(productId);
      if (response.success) {
        // Remove product from local state immediately for UI responsiveness
        setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
        setTotalItems(prev => Math.max(0, prev - 1));

        toast.success('Xóa sản phẩm thành công!');

        // Reload products in background to sync with server
        loadProducts();
      } else {
        toast.error('Lỗi khi xóa sản phẩm: ' + (response.error || 'Unknown error'));
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        sessionStorage.removeItem('auth_token');
        setTimeout(() => window.location.href = '/login', 2000);
      } else if (error.response?.status === 403) {
        toast.error('Không có quyền thực hiện thao tác này');
      } else if (error.response?.status === 404) {
        // Product already deleted, remove from local state
        setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
        setTotalItems(prev => Math.max(0, prev - 1));
        toast.success('Sản phẩm đã được xóa trước đó');
      } else {
        toast.error('Lỗi khi xóa sản phẩm. Vui lòng thử lại sau.');
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, delete: false }));
      setDeleteConfirmId(null);
    }
  };

  const handleImportExcel = () => {
    toast.success('Chức năng import Excel sẽ được triển khai');
    // Implement Excel import functionality
  };

  const handleExportExcel = () => {
    toast.success('Đang xuất dữ liệu ra Excel...');
    // Implement Excel export functionality
  };

  const handleAddProduct = () => {
    setCreateForm({});
    setShowCreateModal(true);
  };

  const handleCreateProduct = async () => {
    // Validate form
    const errors = validateForm(createForm);
    setCreateErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      toast.error('Vui lòng sửa các lỗi trong form');
      return;
    }

    if (!createForm.category_id) {
      toast.error('Vui lòng chọn danh mục');
      return;
    }

    setLoadingStates(prev => ({ ...prev, create: true }));

    try {
      const response = await posApi.createProduct({
        name: createForm.name!,
        sku: createForm.sku!,
        price: Number(createForm.price) || 0,
        cost_price: Number(createForm.cost_price) || 0,
        category_id: String(createForm.category_id),
        brand: createForm.brand_name || '',
        stock: Number(createForm.stock) || 0,
        is_active: createForm.active !== 0,
        status: createForm.active === 1 ? 'active' : 'inactive'
      });

      if (response.success) {
        // Add new product to local state immediately for UI responsiveness
        const newProduct: Product = {
          id: response.data?.id || `temp-${Date.now()}`,
          name: createForm.name!,
          sku: createForm.sku!,
          price: Number(createForm.price) || 0,
          cost_price: Number(createForm.cost_price) || 0,
          stock: Number(createForm.stock) || 0,
          active: createForm.active || 1,
          category_id: String(createForm.category_id || ''),
          category_name: categories.find(c => c.id === createForm.category_id)?.name || '',
          brand_name: createForm.brand_name || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setProducts(prevProducts => [...prevProducts, newProduct]);
        setTotalItems(prev => prev + 1);

        toast.success('Tạo sản phẩm thành công!');
        setShowCreateModal(false);
        setCreateForm({});
        setCreateErrors({});

        // Reload products in background to sync with server
        loadProducts();
      } else {
        toast.error('Lỗi khi tạo sản phẩm: ' + (response.error || 'Unknown error'));
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        sessionStorage.removeItem('auth_token');
        setTimeout(() => window.location.href = '/login', 2000);
      } else if (error.response?.status === 422) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Validation error';
        toast.error(`Dữ liệu không hợp lệ: ${errorMsg}`);
      } else {
        toast.error('Lỗi khi tạo sản phẩm: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, create: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Quản lý sản phẩm"
          subtitle={`Tổng cộng ${totalItems || products.length} sản phẩm`}
          actions={
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={handleImportExcel}>
                <Upload className="w-4 h-4 mr-2" />
                Nhập Excel
              </Button>
              <Button variant="outline" onClick={handleExportExcel}>
                <Download className="w-4 h-4 mr-2" />
                Xuất Excel
              </Button>
              <Button onClick={handleAddProduct}>
                <Plus className="w-4 h-4 mr-2" />
                Thêm sản phẩm
              </Button>
            </div>
          }
        />

        {/* Filters and Search */}
        <Card className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm sản phẩm theo tên hoặc SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả danh mục</option>
                <option value="laptop">Laptop</option>
                <option value="desktop">Desktop</option>
                <option value="accessories">Phụ kiện</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name-asc">Tên A-Z</option>
                <option value="name-desc">Tên Z-A</option>
                <option value="price-asc">Giá thấp-cao</option>
                <option value="price-desc">Giá cao-thấp</option>
                <option value="stock-asc">Tồn kho ít-nhiều</option>
                <option value="stock-desc">Tồn kho nhiều-ít</option>
              </select>
            </div>
          </div>
        </Card>

        {/* KPI / Inventory Summary (theo production.env: ANALYTICS_ENABLED=true) */}
        {inventorySummary && (
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">Tổng quan tồn kho</p>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => loadInventorySummary()} disabled={isRefreshingKPI}>
                  {isRefreshingKPI ? 'Đang làm mới…' : 'Làm mới KPI'}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border border-gray-100 bg-white">
                <p className="text-sm text-gray-500">Tổng sản phẩm</p>
                <p className="text-2xl font-semibold text-gray-900">{inventorySummary.total_products}</p>
              </div>
              <div className="p-4 rounded-lg border border-gray-100 bg-white">
                <p className="text-sm text-gray-500">Hết hàng</p>
                <p className="text-2xl font-semibold text-red-600">{inventorySummary.out_of_stock}</p>
              </div>
              <div className="p-4 rounded-lg border border-gray-100 bg-white">
                <p className="text-sm text-gray-500">Sắp hết</p>
                <p className="text-2xl font-semibold text-yellow-600">{inventorySummary.low_stock}</p>
              </div>
              <div className="p-4 rounded-lg border border-gray-100 bg-white">
                <p className="text-sm text-gray-500">Giá trị tồn (ước tính)</p>
                <p className="text-2xl font-semibold text-blue-600">{formatCurrency(inventorySummary.total_value || 0)}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Products Display */}
        <Section title={`Kết quả (${totalItems || sortedProducts.length} sản phẩm)`}>
          {loading ? (
            <Card>
              <LoadingSpinner className="py-12" />
            </Card>
          ) : sortedProducts.length > 0 ? (
            viewMode === 'grid' ? (
              <Grid cols={4} gap="md">
                {sortedProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock);
                  return (
                    <Card key={product.id} hover className="group">
                      <div className="relative">
                        {/* Product Image Placeholder */}
                        <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-4 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Package className="w-16 h-16 text-white" />
                        </div>
                        
                        {/* Stock Status Badge */}
                        <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                          {stockStatus.label}
                        </div>
                        
                        {/* Product Info */}
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {product.name}
                            </h3>
                            <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                            {product.category_name && (
                              <p className="text-xs text-gray-500 mt-1">{product.category_name}</p>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-lg font-bold text-blue-600">
                                {formatCurrency(product.price)}
                              </p>
                              <p className="text-sm text-gray-600">
                                Tồn: {product.stock}
                              </p>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewProduct(product)}
                                title="Xem chi tiết"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditProduct(product)}
                                title="Chỉnh sửa"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteProduct(product.id)}
                                title="Xóa sản phẩm"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </Grid>
            ) : (
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Sản phẩm</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">SKU</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Danh mục</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900">Giá</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900">Tồn kho</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">Trạng thái</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedProducts.map((product) => {
                        const stockStatus = getStockStatus(product.stock);
                        return (
                          <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                  <Package className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">{product.name}</h4>
                                  {product.brand_name && (
                                    <p className="text-sm text-gray-600">{product.brand_name}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-sm text-gray-600">{product.sku}</td>
                            <td className="py-4 px-4 text-sm text-gray-600">{product.category_name || 'N/A'}</td>
                            <td className="py-4 px-4 text-right font-semibold text-gray-900">
                              {formatCurrency(product.price)}
                            </td>
                            <td className="py-4 px-4 text-right text-sm text-gray-600">{product.stock}</td>
                            <td className="py-4 px-4 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                                {stockStatus.label}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewProduct(product)}
                                  title="Xem chi tiết"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditProduct(product)}
                                  title="Chỉnh sửa"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteProduct(product.id)}
                                  title="Xóa sản phẩm"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )
          ) : (
            <EmptyState
              icon={<Package className="w-16 h-16" />}
              title="Không tìm thấy sản phẩm"
              description="Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc"
              action={
                <Button onClick={handleAddProduct}>
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm sản phẩm đầu tiên
                </Button>
              }
            />
          )}
        </Section>

        {/* Pagination Controls */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">Trang {page} / {Math.max(1, Math.ceil((totalItems || 0) / (limit || 1)))}</div>
          <div className="flex items-center space-x-2">
            <select
              value={limit}
              onChange={(e) => {
                const newLimit = Number(e.target.value);
                setLimit(newLimit);
                setPage(1);
                loadProducts(1, newLimit);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value={12}>12 / trang</option>
              <option value={24}>24 / trang</option>
              <option value={48}>48 / trang</option>
              <option value={96}>96 / trang</option>
            </select>
            <Button variant="outline" onClick={() => { if (page > 1) { const newPage = page - 1; setPage(newPage); loadProducts(newPage, limit); } }} disabled={page <= 1}>Trước</Button>
            <Button variant="outline" onClick={() => { const totalPages = Math.max(1, Math.ceil((totalItems || 0) / (limit || 1))); if (page < totalPages) { const newPage = page + 1; setPage(newPage); loadProducts(newPage, limit); } }} disabled={page >= Math.max(1, Math.ceil((totalItems || 0) / (limit || 1)))}>Sau</Button>
          </div>
        </div>
      </div>

      {/* View Product Modal */}
      {showViewModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Chi tiết sản phẩm</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Product Image */}
              <div className="w-full h-64 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Package className="w-24 h-24 text-white" />
              </div>
              
              {/* Product Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Tên sản phẩm</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedProduct.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">SKU</label>
                  <p className="text-lg text-gray-900">{selectedProduct.sku}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Giá bán</label>
                  <p className="text-lg font-semibold text-blue-600">{formatCurrency(selectedProduct.price)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Giá nhập</label>
                  <p className="text-lg text-gray-900">{formatCurrency(selectedProduct.cost_price)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tồn kho</label>
                  <p className="text-lg text-gray-900">{selectedProduct.stock}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockStatus(selectedProduct.stock).color}`}>
                    {getStockStatus(selectedProduct.stock).label}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Danh mục</label>
                  <p className="text-lg text-gray-900">{selectedProduct.category_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Thương hiệu</label>
                  <p className="text-lg text-gray-900">{selectedProduct.brand_name || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <Button variant="outline" onClick={() => setShowViewModal(false)}>
                Đóng
              </Button>
              <Button onClick={() => {
                setShowViewModal(false);
                handleEditProduct(selectedProduct);
              }}>
                <Edit className="w-4 h-4 mr-2" />
                Chỉnh sửa
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Chỉnh sửa sản phẩm</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Product Image */}
              <div className="w-full h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Package className="w-16 h-16 text-white" />
              </div>
              
              {/* Edit Form */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tên sản phẩm</label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEditForm({...editForm, name: value});
                      const error = validateField('name', value, editForm);
                      setEditErrors(prev => ({ ...prev, name: error }));
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                      editErrors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nhập tên sản phẩm"
                  />
                  {editErrors.name && (
                    <div className="flex items-center mt-1 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {editErrors.name}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                  <input
                    type="text"
                    value={editForm.sku || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEditForm({...editForm, sku: value});
                      const error = validateField('sku', value, editForm);
                      setEditErrors(prev => ({ ...prev, sku: error }));
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                      editErrors.sku ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nhập SKU"
                  />
                  {editErrors.sku && (
                    <div className="flex items-center mt-1 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {editErrors.sku}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giá bán</label>
                  <input
                    type="number"
                    value={editForm.price || ''}
                    min={0}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setEditForm({...editForm, price: value});
                      const error = validateField('price', value, editForm);
                      setEditErrors(prev => ({ ...prev, price: error }));
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                      editErrors.price ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nhập giá bán"
                  />
                  {editErrors.price && (
                    <div className="flex items-center mt-1 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {editErrors.price}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giá nhập</label>
                  <input
                    type="number"
                    value={editForm.cost_price || ''}
                    min={0}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setEditForm({...editForm, cost_price: value});
                      const error = validateField('cost_price', value, editForm);
                      setEditErrors(prev => ({ ...prev, cost_price: error }));
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                      editErrors.cost_price ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nhập giá nhập"
                  />
                  {editErrors.cost_price && (
                    <div className="flex items-center mt-1 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {editErrors.cost_price}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tồn kho</label>
                  <input
                    type="number"
                    value={editForm.stock || ''}
                    min={0}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setEditForm({...editForm, stock: value});
                      const error = validateField('stock', value, editForm);
                      setEditErrors(prev => ({ ...prev, stock: error }));
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                      editErrors.stock ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nhập số lượng tồn kho"
                  />
                  {editErrors.stock && (
                    <div className="flex items-center mt-1 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {editErrors.stock}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
                  <select
                    value={editForm.category_id || ''}
                    onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Thương hiệu</label>
                  <input
                    type="text"
                    value={editForm.brand_name || ''}
                    onChange={(e) => setEditForm({...editForm, brand_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                    placeholder="Nhập thương hiệu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                  <select
                    value={editForm.active || 1}
                    onChange={(e) => setEditForm({...editForm, active: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  >
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Ngừng hoạt động</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={loadingStates.save}>
                Hủy
              </Button>
              <Button onClick={handleSaveProduct} disabled={loadingStates.save || Object.keys(editErrors).length > 0}>
                {loadingStates.save ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {loadingStates.save ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Xác nhận xóa</h2>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="text-gray-400 hover:text-gray-600"
                disabled={loadingStates.delete}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-500 mr-3" />
                <div>
                  <p className="text-gray-900 font-medium">Bạn có chắc chắn muốn xóa sản phẩm này?</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Sản phẩm: <span className="font-medium">{products.find(p => p.id === deleteConfirmId)?.name}</span>
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Hành động này không thể hoàn tác. Sản phẩm sẽ bị xóa vĩnh viễn khỏi hệ thống.
              </p>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)} disabled={loadingStates.delete}>
                Hủy
              </Button>
              <Button 
                onClick={() => confirmDeleteProduct(deleteConfirmId)} 
                disabled={loadingStates.delete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {loadingStates.delete ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                {loadingStates.delete ? 'Đang xóa...' : 'Xóa sản phẩm'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto text-gray-900">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Tạo sản phẩm mới</h3>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tên sản phẩm *</label>
                  <input
                    type="text"
                    value={createForm.name || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCreateForm({...createForm, name: value});
                      const error = validateField('name', value, createForm);
                      setCreateErrors(prev => ({ ...prev, name: error }));
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                      createErrors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nhập tên sản phẩm"
                  />
                  {createErrors.name && (
                    <div className="flex items-center mt-1 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {createErrors.name}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SKU *</label>
                  <input
                    type="text"
                    value={createForm.sku || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCreateForm({...createForm, sku: value});
                      const error = validateField('sku', value, createForm);
                      setCreateErrors(prev => ({ ...prev, sku: error }));
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                      createErrors.sku ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nhập SKU"
                  />
                  {createErrors.sku && (
                    <div className="flex items-center mt-1 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {createErrors.sku}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giá bán *</label>
                  <input
                    type="number"
                    value={createForm.price || ''}
                    min={0}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setCreateForm({...createForm, price: value});
                      const error = validateField('price', value, createForm);
                      setCreateErrors(prev => ({ ...prev, price: error }));
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                      createErrors.price ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nhập giá bán"
                  />
                  {createErrors.price && (
                    <div className="flex items-center mt-1 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {createErrors.price}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giá nhập</label>
                  <input
                    type="number"
                    value={createForm.cost_price || ''}
                    min={0}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setCreateForm({...createForm, cost_price: value});
                      const error = validateField('cost_price', value, createForm);
                      setCreateErrors(prev => ({ ...prev, cost_price: error }));
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                      createErrors.cost_price ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nhập giá nhập"
                  />
                  {createErrors.cost_price && (
                    <div className="flex items-center mt-1 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {createErrors.cost_price}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tồn kho</label>
                  <input
                    type="number"
                    value={createForm.stock || ''}
                    min={0}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setCreateForm({...createForm, stock: value});
                      const error = validateField('stock', value, createForm);
                      setCreateErrors(prev => ({ ...prev, stock: error }));
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                      createErrors.stock ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nhập số lượng tồn kho"
                  />
                  {createErrors.stock && (
                    <div className="flex items-center mt-1 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {createErrors.stock}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
                  <select
                    value={createForm.category_id || ''}
                    onChange={(e) => setCreateForm({ ...createForm, category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Thương hiệu</label>
                  <input
                    type="text"
                    value={createForm.brand_name || ''}
                    onChange={(e) => setCreateForm({...createForm, brand_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                    placeholder="Nhập thương hiệu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                  <select
                    value={createForm.active || 1}
                    onChange={(e) => setCreateForm({...createForm, active: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  >
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Ngừng hoạt động</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={loadingStates.create}>
                Hủy
              </Button>
              <Button onClick={handleCreateProduct} disabled={loadingStates.create || Object.keys(createErrors).length > 0}>
                {loadingStates.create ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {loadingStates.create ? 'Đang tạo...' : 'Tạo sản phẩm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernProducts;
