// Vietnamese Computer Hardware Product Management
// ComputerPOS Pro - Production DaisyUI Implementation

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FiSearch, 
  FiPlus, 
  FiEdit3, 
  FiTrash2, 
  FiUpload,
  FiDownload,
  FiPackage,
  FiTag,
  FiBarChart3,
  FiFilter,
  FiRefreshCw
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import apiClient from '../services/api';
import { formatVND, validateHardwarePrice, PRICE_RANGES } from '../utils/currency';
import { COMPONENT_CATEGORIES_VI } from '../utils/compatibility';

// Vietnamese Product Types
interface Product {
  id: string;
  name: string;
  name_vi?: string;
  sku: string;
  barcode?: string;
  unit_price: number; // VND cents
  cost_price: number; // VND cents
  stock_quantity: number;
  reorder_point: number;
  category_id?: string;
  category_name?: string;
  brand_id?: string;
  brand_name?: string;
  specifications?: Record<string, any>;
  compatibility_info?: Record<string, any>;
  warranty_months?: number;
  description?: string;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

interface Category {
  id: string;
  name: string;
  name_vi: string;
  description?: string;
  parent_id?: string;
  is_active: boolean;
}

interface Brand {
  id: string;
  name: string;
  name_vi?: string;
  description?: string;
  website?: string;
  is_active: boolean;
}

const Products: React.FC = () => {
  const queryClient = useQueryClient();

  // Vietnamese Product Management State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form state for add/edit product
  const [productForm, setProductForm] = useState({
    name: '',
    name_vi: '',
    sku: '',
    barcode: '',
    unit_price: 0,
    cost_price: 0,
    stock_quantity: 0,
    reorder_point: 10,
    category_id: '',
    brand_id: '',
    warranty_months: 12,
    description: '',
    specifications: {},
    compatibility_info: {}
  });

  // Fetch products with Vietnamese filters
  const { data: products = [], isLoading: isLoadingProducts, refetch: refetchProducts } = useQuery({
    queryKey: ['products', searchTerm, selectedCategory, selectedBrand, stockFilter],
    queryFn: async () => {
      try {
        const params: any = {
          is_active: true,
          limit: 100
        };

        if (searchTerm) params.search = searchTerm;
        if (selectedCategory) params.category_id = selectedCategory;
        if (selectedBrand) params.brand_id = selectedBrand;
        
        if (stockFilter === 'low') {
          params.low_stock = true;
        } else if (stockFilter === 'out') {
          params.out_of_stock = true;
        }

        const response = await apiClient.get('/api/v1/products', { params });
        return response.data?.data || [];
      } catch (error) {
        console.error('Products fetch error:', error);
        toast.error('Lỗi tải danh sách sản phẩm');
        return [];
      }
    }
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api/v1/categories', {
          params: { is_active: true }
        });
        return response.data?.data || [];
      } catch (error) {
        console.error('Categories fetch error:', error);
        return [];
      }
    }
  });

  // Fetch brands
  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api/v1/brands', {
          params: { is_active: true }
        });
        return response.data?.data || [];
      } catch (error) {
        console.error('Brands fetch error:', error);
        return [];
      }
    }
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      const response = await apiClient.post('/api/v1/products', productData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Tạo sản phẩm thành công');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowAddModal(false);
      resetProductForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi tạo sản phẩm');
    }
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, ...productData }: any) => {
      const response = await apiClient.put(`/api/v1/products/${id}`, productData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Cập nhật sản phẩm thành công');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowEditModal(false);
      setSelectedProduct(null);
      resetProductForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi cập nhật sản phẩm');
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await apiClient.delete(`/api/v1/products/${productId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Xóa sản phẩm thành công');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi xóa sản phẩm');
    }
  });

  // Reset product form
  const resetProductForm = () => {
    setProductForm({
      name: '',
      name_vi: '',
      sku: '',
      barcode: '',
      unit_price: 0,
      cost_price: 0,
      stock_quantity: 0,
      reorder_point: 10,
      category_id: '',
      brand_id: '',
      warranty_months: 12,
      description: '',
      specifications: {},
      compatibility_info: {}
    });
  };

  // Handle add product
  const handleAddProduct = () => {
    setSelectedProduct(null);
    resetProductForm();
    setShowAddModal(true);
  };

  // Handle edit product
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name,
      name_vi: product.name_vi || '',
      sku: product.sku,
      barcode: product.barcode || '',
      unit_price: product.unit_price,
      cost_price: product.cost_price,
      stock_quantity: product.stock_quantity,
      reorder_point: product.reorder_point,
      category_id: product.category_id || '',
      brand_id: product.brand_id || '',
      warranty_months: product.warranty_months || 12,
      description: product.description || '',
      specifications: product.specifications || {},
      compatibility_info: product.compatibility_info || {}
    });
    setShowEditModal(true);
  };

  // Handle delete product
  const handleDeleteProduct = (product: Product) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${product.name_vi || product.name}"?`)) {
      deleteProductMutation.mutate(product.id);
    }
  };

  // Handle form submit
  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate price for hardware category
    const selectedCategoryName = categories.find(c => c.id === productForm.category_id)?.name || '';
    const priceValidation = validateHardwarePrice(productForm.unit_price, selectedCategoryName);
    
    if (!priceValidation.isValid) {
      toast.error(priceValidation.message || 'Giá sản phẩm không hợp lệ');
      return;
    }

    if (selectedProduct) {
      updateProductMutation.mutate({ id: selectedProduct.id, ...productForm });
    } else {
      createProductMutation.mutate(productForm);
    }
  };

  // Filter products based on stock status
  const filteredProducts = useMemo(() => {
    return products.filter((product: Product) => {
      if (stockFilter === 'low') {
        return product.stock_quantity <= product.reorder_point && product.stock_quantity > 0;
      } else if (stockFilter === 'out') {
        return product.stock_quantity === 0;
      }
      return true;
    });
  }, [products, stockFilter]);

  return (
    <div className="min-h-screen bg-base-200 p-4">
      {/* Header */}
      <div className="bg-base-100 rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">
            <FiPackage className="inline mr-2" />
            Quản lý sản phẩm
          </h1>
          <div className="flex gap-2">
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => setShowBulkImportModal(true)}
            >
              <FiUpload className="mr-1" />
              Import CSV
            </button>
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => {
                // Export products to CSV
                toast('Tính năng xuất CSV đang được phát triển', { icon: '🚧' });
              }}
            >
              <FiDownload className="mr-1" />
              Export CSV
            </button>
            <button 
              className="btn btn-primary btn-sm"
              onClick={handleAddProduct}
            >
              <FiPlus className="mr-1" />
              Thêm sản phẩm
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-base-100 rounded-lg shadow-sm p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="form-control">
            <div className="input-group">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                className="input input-bordered flex-1"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="btn btn-square">
                <FiSearch />
              </button>
            </div>
          </div>

          {/* Category Filter */}
          <div className="form-control">
            <select
              className="select select-bordered"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((category: Category) => (
                <option key={category.id} value={category.id}>
                  {category.name_vi || category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div className="form-control">
            <select
              className="select select-bordered"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
            >
              <option value="">Tất cả thương hiệu</option>
              {brands.map((brand: Brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name_vi || brand.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div className="form-control">
            <select
              className="select select-bordered"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as 'all' | 'low' | 'out')}
            >
              <option value="all">Tất cả sản phẩm</option>
              <option value="low">Sắp hết hàng</option>
              <option value="out">Hết hàng</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-base-100 rounded-lg shadow-sm">
        <div className="p-4 border-b border-base-300">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Danh sách sản phẩm ({filteredProducts.length})
            </h2>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => refetchProducts()}
              disabled={isLoadingProducts}
            >
              <FiRefreshCw className={`mr-1 ${isLoadingProducts ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>

        {isLoadingProducts ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-base-content/50">
            <FiPackage className="mx-auto text-4xl mb-2" />
            <p>Không tìm thấy sản phẩm nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>SKU</th>
                  <th>Danh mục</th>
                  <th>Thương hiệu</th>
                  <th>Giá bán</th>
                  <th>Tồn kho</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product: Product) => (
                  <tr key={product.id}>
                    <td>
                      <div>
                        <div className="font-medium">
                          {product.name_vi || product.name}
                        </div>
                        {product.description && (
                          <div className="text-sm text-base-content/70 truncate max-w-xs">
                            {product.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <code className="text-sm">{product.sku}</code>
                    </td>
                    <td>
                      {product.category_name && (
                        <span className="badge badge-outline">
                          {COMPONENT_CATEGORIES_VI[product.category_name.toUpperCase() as keyof typeof COMPONENT_CATEGORIES_VI] || product.category_name}
                        </span>
                      )}
                    </td>
                    <td>
                      {product.brand_name && (
                        <span className="text-sm">{product.brand_name}</span>
                      )}
                    </td>
                    <td>
                      <div className="font-medium text-primary">
                        {formatVND(product.unit_price)}
                      </div>
                      {product.cost_price > 0 && (
                        <div className="text-xs text-base-content/50">
                          Giá vốn: {formatVND(product.cost_price)}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${
                          product.stock_quantity === 0 ? 'text-error' :
                          product.stock_quantity <= product.reorder_point ? 'text-warning' :
                          'text-success'
                        }`}>
                          {product.stock_quantity}
                        </span>
                        {product.stock_quantity <= product.reorder_point && product.stock_quantity > 0 && (
                          <div className="badge badge-warning badge-xs">Sắp hết</div>
                        )}
                        {product.stock_quantity === 0 && (
                          <div className="badge badge-error badge-xs">Hết hàng</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={`badge ${product.is_active ? 'badge-success' : 'badge-error'}`}>
                        {product.is_active ? 'Hoạt động' : 'Ngừng bán'}
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => handleEditProduct(product)}
                        >
                          <FiEdit3 />
                        </button>
                        <button
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => handleDeleteProduct(product)}
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

      {/* Add/Edit Product Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h3 className="font-bold text-lg mb-4">
              {selectedProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </h3>

            <form onSubmit={handleSubmitProduct}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Information */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Tên sản phẩm *</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={productForm.name}
                    onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Tên tiếng Việt</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={productForm.name_vi}
                    onChange={(e) => setProductForm({...productForm, name_vi: e.target.value})}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">SKU *</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Barcode</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={productForm.barcode}
                    onChange={(e) => setProductForm({...productForm, barcode: e.target.value})}
                  />
                </div>

                {/* Category and Brand */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Danh mục</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={productForm.category_id}
                    onChange={(e) => setProductForm({...productForm, category_id: e.target.value})}
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map((category: Category) => (
                      <option key={category.id} value={category.id}>
                        {category.name_vi || category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Thương hiệu</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={productForm.brand_id}
                    onChange={(e) => setProductForm({...productForm, brand_id: e.target.value})}
                  >
                    <option value="">Chọn thương hiệu</option>
                    {brands.map((brand: Brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name_vi || brand.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pricing */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Giá bán (VND) *</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={productForm.unit_price / 100}
                    onChange={(e) => setProductForm({...productForm, unit_price: parseInt(e.target.value) * 100 || 0})}
                    min="0"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Giá vốn (VND)</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={productForm.cost_price / 100}
                    onChange={(e) => setProductForm({...productForm, cost_price: parseInt(e.target.value) * 100 || 0})}
                    min="0"
                  />
                </div>

                {/* Inventory */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Số lượng tồn kho *</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={productForm.stock_quantity}
                    onChange={(e) => setProductForm({...productForm, stock_quantity: parseInt(e.target.value) || 0})}
                    min="0"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Điểm đặt hàng lại</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={productForm.reorder_point}
                    onChange={(e) => setProductForm({...productForm, reorder_point: parseInt(e.target.value) || 0})}
                    min="0"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Bảo hành (tháng)</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={productForm.warranty_months}
                    onChange={(e) => setProductForm({...productForm, warranty_months: parseInt(e.target.value) || 12})}
                    min="0"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="form-control mt-4">
                <label className="label">
                  <span className="label-text">Mô tả sản phẩm</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  placeholder="Mô tả chi tiết về sản phẩm..."
                />
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedProduct(null);
                    resetProductForm();
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createProductMutation.isPending || updateProductMutation.isPending}
                >
                  {(createProductMutation.isPending || updateProductMutation.isPending) ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    selectedProduct ? 'Cập nhật' : 'Thêm mới'
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

export default Products;
