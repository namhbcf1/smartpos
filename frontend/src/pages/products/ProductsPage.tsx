import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../lib/utils';
import apiClient from '../../services/api/client';

// Vietnamese Products Management Page
// ComputerPOS Pro - Production System

interface Product {
  id: string;
  sku: string;
  name: string;
  name_vi: string;
  unit_price: number;
  cost_price: number;
  stock_quantity: number;
  category_id: string;
  brand_id: string;
  specifications?: string;
  warranty_months?: number;
  is_active: number;
  created_at: number;
  updated_at: number;
}

interface Category {
  id: string;
  name: string;
  name_vi: string;
}

interface Brand {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    name_vi: '',
    unit_price: '',
    cost_price: '',
    stock_quantity: '',
    category_id: '',
    brand_id: '',
    specifications: '',
    warranty_months: '12'
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadBrands();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/products');
      const productsData = response.data?.data || response.data || [];
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await apiClient.get('/categories');
      const categoriesData = response.data?.data || response.data || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    }
  };

  const loadBrands = async () => {
    try {
      const response = await apiClient.get('/brands');
      const brandsData = response.data?.data || response.data || [];
      setBrands(Array.isArray(brandsData) ? brandsData : []);
    } catch (error) {
      console.error('Failed to load brands:', error);
      setBrands([]);
    }
  };

  // Filter products
  const filteredProducts = (products || []).filter(product => {
    const matchesSearch = !searchQuery || 
      product.name_vi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const productData = {
        ...formData,
        unit_price: parseInt(formData.unit_price) * 100, // Convert to cents
        cost_price: parseInt(formData.cost_price) * 100,
        stock_quantity: parseInt(formData.stock_quantity),
        warranty_months: parseInt(formData.warranty_months)
      };

      if (editingProduct) {
        await apiClient.put(`/products/${editingProduct.id}`, productData);
      } else {
        await apiClient.post('/products', productData);
      }

      await loadProducts();
      resetForm();
      setShowAddModal(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Lỗi khi lưu sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku || '',
      name: product.name || '',
      name_vi: product.name_vi || '',
      unit_price: ((product.unit_price || 0) / 100).toString(),
      cost_price: ((product.cost_price || 0) / 100).toString(),
      stock_quantity: (product.stock_quantity || 0).toString(),
      category_id: product.category_id || '',
      brand_id: product.brand_id || '',
      specifications: product.specifications || '',
      warranty_months: (product.warranty_months || 12).toString()
    });
    setShowAddModal(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    
    try {
      setLoading(true);
      await apiClient.delete(`/products/${productId}`);
      await loadProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Lỗi khi xóa sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      name_vi: '',
      unit_price: '',
      cost_price: '',
      stock_quantity: '',
      category_id: '',
      brand_id: '',
      specifications: '',
      warranty_months: '12'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Quay lại Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý Sản phẩm</h1>
            </div>
            <button
              onClick={() => {
                resetForm();
                setEditingProduct(null);
                setShowAddModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Thêm sản phẩm
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm sản phẩm
              </label>
              <input
                type="text"
                placeholder="Tìm theo tên, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Danh mục
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name_vi || category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={loadProducts}
                disabled={loading}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                {loading ? 'Đang tải...' : 'Làm mới'}
              </button>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá bán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tồn kho
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Đang tải sản phẩm...</p>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-600">
                      Không tìm thấy sản phẩm
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.name_vi || product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.name !== product.name_vi ? product.name : ''}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency((product.unit_price || 0) / 100)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          (product.stock_quantity || 0) > 10 
                            ? 'bg-green-100 text-green-800' 
                            : (product.stock_quantity || 0) > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.stock_quantity || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.is_active ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên tiếng Anh *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên tiếng Việt *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name_vi}
                    onChange={(e) => setFormData({...formData, name_vi: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá bán (VND) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá vốn (VND) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số lượng tồn kho *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bảo hành (tháng)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.warranty_months}
                    onChange={(e) => setFormData({...formData, warranty_months: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Danh mục
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name_vi || category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thương hiệu
                  </label>
                  <select
                    value={formData.brand_id}
                    onChange={(e) => setFormData({...formData, brand_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn thương hiệu</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thông số kỹ thuật (JSON)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.specifications}
                    onChange={(e) => setFormData({...formData, specifications: e.target.value})}
                    placeholder='{"cpu": "Intel i5", "ram": "8GB", "storage": "256GB SSD"}'
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Đang lưu...' : (editingProduct ? 'Cập nhật' : 'Thêm mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
