import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  Save,
  Cancel,
  Inventory,
  AttachMoney,
  Category,
  QrCode,
} from '@mui/icons-material';
import api from '../../services/api';

interface Product {
  id: number;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  category_id: number;
  categoryName?: string;
  price: number;
  cost_price: number;
  taxRate: number;
  stock: number;
  min_stock: number;
  is_active: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: number;
  name: string;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({});
  const isNewProduct = id === 'new';

  useEffect(() => {
    if (isNewProduct) {
      // Nếu là tạo sản phẩm mới, chỉ cần load categories và set edit mode
      setEditMode(true);
      setLoading(false);
      setFormData({
        name: '',
        description: '',
        sku: '',
        barcode: '',
        category_id: undefined, // Sẽ được set sau khi load categories
        price: 0,
        cost_price: 0,
        taxRate: 0,
        stock: 0,
        min_stock: 10,
        is_active: true,
        imageUrl: ''
      });
    } else {
      fetchProduct();
    }
    fetchCategories();
  }, [id, isNewProduct]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching product with ID:', id);

      // DIRECT API CALL - Get product from products list API (working API)
      console.log('📡 Calling products API directly...');
              const response = await api.get('/products?limit=100');
      const data = response.data;

      console.log('📦 Products API response:', data);

      if (data.success && data.data && data.data.data) {
        const products = data.data.data;
        const foundProduct = products.find((p: any) => p.id === parseInt(id || '0'));

        if (foundProduct) {
          console.log('✅ Found product from API:', foundProduct);

          // Map API response to frontend interface with detailed description
          const mappedProduct: Product = {
            id: foundProduct.id,
            name: foundProduct.name,
            description: foundProduct.description || `Chi tiết sản phẩm ${foundProduct.name}.

🔧 **Thông số kỹ thuật:**
- SKU: ${foundProduct.sku}
- Danh mục: ${foundProduct.categoryName || 'Linh kiện máy tính'}
- Thương hiệu: ${foundProduct.brand || 'Chính hãng'}

💰 **Thông tin giá:**
- Giá bán: ${foundProduct.price?.toLocaleString('vi-VN')} ₫
- Giá vốn: ${foundProduct.costPrice?.toLocaleString('vi-VN')} ₫
- Thuế VAT: ${(foundProduct.taxRate * 100) || 0}%

📦 **Tồn kho:**
- Số lượng hiện có: ${foundProduct.stockQuantity} sản phẩm
- Mức cảnh báo: ${foundProduct.stockAlertThreshold} sản phẩm

✅ **Trạng thái:** ${foundProduct.isActive ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}

Sản phẩm chất lượng cao, được nhập khẩu chính hãng với đầy đủ giấy tờ bảo hành.`,
            sku: foundProduct.sku,
            barcode: foundProduct.barcode || '',
            category_id: foundProduct.category_id ?? foundProduct.categoryId,
            categoryName: foundProduct.categoryName || 'Chưa phân loại',
            price: foundProduct.price,
            cost_price: foundProduct.cost_price ?? foundProduct.costPrice,
            taxRate: foundProduct.taxRate,
            stock: foundProduct.stock ?? foundProduct.stockQuantity,
            min_stock: foundProduct.min_stock ?? foundProduct.minStockLevel ?? foundProduct.stockAlertThreshold,
            is_active: foundProduct.is_active ?? foundProduct.isActive,
            imageUrl: foundProduct.imageUrl || '',
            unit: 'cái', // Default unit
            created_at: foundProduct.created_at,
            updated_at: foundProduct.updated_at || foundProduct.created_at
          };

          console.log('🎯 Setting product data:', mappedProduct);
          setProduct(mappedProduct);
          setFormData(mappedProduct);

          // Cache products for future use
          localStorage.setItem('smartpos_products', JSON.stringify(products));
          console.log('💾 Cached products to localStorage');

        } else {
          console.log('❌ Product not found in API response');
          setError('Không tìm thấy sản phẩm');
        }
      } else {
        console.log('❌ Invalid API response format');
        setError('Không thể tải danh sách sản phẩm');
      }
    } catch (err) {
      console.error('❌ Error fetching product:', err);
      setError('Không thể tải thông tin sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get<{
        data: Category[];
        pagination: any;
      }>('/categories/simple?limit=100');

      // API trả về dữ liệu trong response.data.data
      const categories = response.data || [];
      if (Array.isArray(categories)) {
        setCategories(categories);

        // Nếu là tạo sản phẩm mới và có categories, chọn category đầu tiên
        if (isNewProduct && categories.length > 0) {
          setFormData(prev => ({
            ...prev,
            categoryId: categories[0].id
          }));
        }
      } else {
        console.warn('Categories data is not an array:', categories);
        setCategories([]);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    }
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
    setFormData(product || {});
  };

  const handleSave = async () => {
    try {
      // Validation cơ bản
      if (!formData.name || !formData.sku) {
        setError('Vui lòng điền đầy đủ tên sản phẩm và mã SKU');
        return;
      }

      if (!formData.category_id || formData.category_id <= 0) {
        setError('Vui lòng chọn danh mục sản phẩm');
        return;
      }

      // Map camelCase to snake_case for API
      const apiData = {
        name: formData.name,
        description: formData.description,
        sku: formData.sku,
        barcode: formData.barcode,
        category_id: formData.category_id,
        price: formData.price,
        cost_price: formData.cost_price,
        tax_rate: formData.taxRate,
        stock: formData.stock,
        min_stock: formData.min_stock,
        is_active: formData.is_active,
        image_url: formData.imageUrl
      };

      if (isNewProduct) {
        // Tạo sản phẩm mới
        const newProduct = await api.post<Product>('/products', apiData);
        // Set product data immediately to avoid race condition
        setProduct(newProduct);
        setFormData(newProduct);
        navigate(`/products/${newProduct.id}`);
      } else {
        // Cập nhật sản phẩm hiện tại
        const updatedProduct = await api.put<Product>(`/products/${id}`, apiData);
        setProduct(updatedProduct);
        setEditMode(false);
      }
    } catch (err: any) {
      // Hiển thị lỗi chi tiết từ server
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(isNewProduct ? 'Không thể tạo sản phẩm mới' : 'Không thể cập nhật sản phẩm');
      }
      console.error('Error saving product:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/products/${id}`);
      navigate('/products');
    } catch (err) {
      setError('Không thể xóa sản phẩm');
      console.error('Error deleting product:', err);
    }
  };

  const handleInputChange = (field: keyof Product, value: any) => {
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Generate SKU from product name
  const generateSKU = (name: string): string => {
    if (!name) return '';

    // Convert to uppercase, remove special chars, take first 3 words
    const cleanName = name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .split(' ')
      .slice(0, 3)
      .join('-');

    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-4);
    return `${cleanName}-${timestamp}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Don't return early on error for new products, show error inline instead

  if (!product && !isNewProduct) {
    return (
      <Box p={3}>
        <Alert severity="warning">Không tìm thấy sản phẩm</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/products')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1">
          {isNewProduct ? 'Thêm sản phẩm mới' : 'Chi tiết sản phẩm'}
        </Typography>
        <Box ml="auto">
          {!editMode && !isNewProduct ? (
            <>
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={handleEdit}
                sx={{ mr: 1 }}
              >
                Chỉnh sửa
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Xóa
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                sx={{ mr: 1 }}
              >
                Lưu
              </Button>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={handleCancel}
              >
                Hủy
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Product Details */}
      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Thông tin cơ bản
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Tên sản phẩm"
                    value={editMode ? formData.name || '' : product?.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!editMode}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" gap={1} alignItems="end">
                    <TextField
                      fullWidth
                      label="Mã SKU"
                      value={editMode ? formData.sku || '' : product?.sku || ''}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      disabled={!editMode}
                      margin="normal"
                    />
                    {editMode && isNewProduct && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          const generatedSKU = generateSKU(formData.name || '');
                          handleInputChange('sku', generatedSKU);
                        }}
                        disabled={!formData.name}
                        sx={{ mb: 1, minWidth: 'auto', px: 2 }}
                      >
                        Tự động
                      </Button>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Mô tả"
                    value={editMode ? formData.description || '' : product?.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    disabled={!editMode}
                    multiline
                    rows={3}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Mã vạch"
                    value={editMode ? formData.barcode || '' : product?.barcode || ''}
                    onChange={(e) => handleInputChange('barcode', e.target.value)}
                    disabled={!editMode}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth margin="normal" disabled={!editMode} required>
                    <InputLabel>Danh mục *</InputLabel>
                    <Select
                      value={editMode ? formData.category_id || '' : product?.category_id || ''}
                      onChange={(e) => handleInputChange('category_id', e.target.value)}
                      label="Danh mục *"
                    >
                      {Array.isArray(categories) && categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Pricing and Inventory */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Giá cả & Tồn kho
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Giá bán"
                    type="number"
                    value={editMode ? formData.price || '' : product?.price || ''}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                    disabled={!editMode}
                    margin="normal"
                    InputProps={{
                      startAdornment: <AttachMoney />,
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Giá nhập"
                    type="number"
                    value={editMode ? formData.cost_price || '' : product?.cost_price || ''}
                    onChange={(e) => handleInputChange('cost_price', parseFloat(e.target.value))}
                    disabled={!editMode}
                    margin="normal"
                    InputProps={{
                      startAdornment: <AttachMoney />,
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Thuế suất (%)"
                    type="number"
                    value={editMode ? (formData.taxRate || 0) * 100 : (product?.taxRate || 0) * 100}
                    onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value) / 100)}
                    disabled={!editMode}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Số lượng tồn kho"
                    type="number"
                    value={editMode ? (formData.stock ?? '') : (product?.stock ?? '')}
                    onChange={(e) => handleInputChange('stock', parseInt(e.target.value))}
                    disabled={!editMode}
                    margin="normal"
                    InputProps={{
                      startAdornment: <Inventory />,
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Ngưỡng cảnh báo tồn kho"
                    type="number"
                    value={editMode ? (formData.min_stock ?? '') : (product?.min_stock ?? '')}
                    onChange={(e) => handleInputChange('min_stock', parseInt(e.target.value))}
                    disabled={!editMode}
                    margin="normal"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Trạng thái
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box display="flex" flexDirection="column" gap={2}>
                {!isNewProduct && (
                  <>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography>Trạng thái:</Typography>
                      <Chip
                        label={product?.is_active ? 'Hoạt động' : 'Không hoạt động'}
                        color={product?.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography>Tồn kho:</Typography>
                      <Chip
                        label={(product?.stock || 0) > 0 ? 'Còn hàng' : 'Hết hàng'}
                        color={(product?.stock || 0) > 0 ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography>Ngày tạo:</Typography>
                      <Typography variant="body2">
                        {product?.createdAt ? formatDate(product.createdAt) : '-'}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography>Cập nhật lần cuối:</Typography>
                      <Typography variant="body2">
                        {product?.updatedAt ? formatDate(product.updatedAt) : '-'}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa sản phẩm "{product?.name}"? Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductDetail; 
