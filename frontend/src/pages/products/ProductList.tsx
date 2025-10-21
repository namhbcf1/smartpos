import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Avatar,
  Tooltip,
  LinearProgress,
  Switch,
  FormControlLabel,
  Skeleton,
  Paper,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Fab,
  Backdrop,
  CircularProgress,
  Pagination,
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Search,
  Add,
  Refresh,
  Visibility,
  Edit,
  Delete,
  Inventory,
  FilterList,
  Image,
  TrendingUp,
  ViewList,
  GridView,
  ViewComfy,
  SearchOff,
  Clear,
  CheckCircle,
  Warning,
  Error,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsAPI, categoriesAPI } from '../../services/api';

// Product Form Component
interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  product?: any;
  categories: any[];
  onProductCreated?: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ open, onClose, product, categories, onProductCreated }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    barcode: product?.barcode || '',
    description: product?.description || '',
    price_cents: product?.price_cents || 0,
    cost_price_cents: product?.cost_price_cents || 0,
    stock: product?.stock || 0,
    min_stock: product?.min_stock || 0,
    max_stock: product?.max_stock || 0,
    category_id: product?.category_id || '',
    is_active: product?.is_active !== undefined ? product.is_active : 1,
    is_serialized: product?.is_serialized !== undefined ? product.is_serialized : 0,
    warranty_months: product?.warranty_months || 12,
  });

  const queryClient = useQueryClient();

  // Update formData when product prop changes
  React.useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        description: product.description || '',
        price_cents: product.price_cents || 0,
        cost_price_cents: product.cost_price_cents || 0,
        stock: product.stock || 0,
        min_stock: product.min_stock || 0,
        max_stock: product.max_stock || 0,
        category_id: product.category_id || '',
        is_active: product.is_active !== undefined ? product.is_active : 1,
        is_serialized: product.is_serialized !== undefined ? product.is_serialized : 0,
        warranty_months: product.warranty_months || 12,
      });
    } else {
      // Reset form for new product
      setFormData({
        name: '',
        sku: '',
        barcode: '',
        description: '',
        price_cents: 0,
        cost_price_cents: 0,
        stock: 0,
        min_stock: 0,
        max_stock: 0,
        category_id: '',
        is_active: 1,
        is_serialized: 0,
        warranty_months: 12,
      });
    }
  }, [product, open]);

  const createMutation = useMutation({
    mutationFn: (data: any) => productsAPI.createProduct(data),
    onSuccess: async (res: any) => {
      try {
        // Try to get the full product (works even if API returns only { id })
        const created = res?.data?.data;
        const createdId = created?.id;
        const fullProduct = createdId
          ? (await productsAPI.getProduct(createdId)).data?.data || created
          : created;

        // Optimistically inject into all cached product lists immediately
        const cachedLists = queryClient.getQueriesData({ queryKey: ['products'] });
        cachedLists.forEach(([key, value]: any) => {
          if (!value?.data) return;
          const productsArr = value.data.products || [];
          const exists = productsArr.some((p: any) => p.id === fullProduct?.id);
          if (!exists && fullProduct) {
            const updated = { ...value };
            updated.data = {
              ...value.data,
              products: [fullProduct, ...productsArr],
              pagination: value.data.pagination || undefined,
            };
            queryClient.setQueryData(key as any, updated);
          }
        });
      } catch {
        // ignore optimistic update errors
      } finally {
        // Ensure background refetch happens to keep totals/pagination correct
        queryClient.invalidateQueries({ queryKey: ['products'], exact: false });
        onProductCreated?.();
        onClose();
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => productsAPI.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (product) {
      updateMutation.mutate({ id: product.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (field: string) => (e: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Tên sản phẩm"
                value={formData.name}
                onChange={handleChange('name')}
                required
              />
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="SKU"
                value={formData.sku}
                onChange={handleChange('sku')}
                required
              />
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Barcode"
                value={formData.barcode}
                onChange={handleChange('barcode')}
              />
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <FormControl fullWidth>
                <InputLabel>Danh mục</InputLabel>
                <Select
                  value={formData.category_id}
                  onChange={handleChange('category_id')}
                  label="Danh mục"
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Giá bán (VNĐ)"
                type="number"
                value={formData.price_cents}
                onChange={handleChange('price_cents')}
                required
              />
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Giá nhập (VNĐ)"
                type="number"
                value={formData.cost_price_cents}
                onChange={handleChange('cost_price_cents')}
              />
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Tồn kho"
                type="number"
                value={formData.stock}
                onChange={handleChange('stock')}
                required
              />
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Tồn tối thiểu"
                type="number"
                value={formData.min_stock}
                onChange={handleChange('min_stock')}
              />
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Tồn tối đa"
                type="number"
                value={formData.max_stock}
                onChange={handleChange('max_stock')}
              />
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Mô tả"
                multiline
                rows={3}
                value={formData.description}
                onChange={handleChange('description')}
              />
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <FormControl fullWidth>
                <InputLabel>Có serial/IMEI?</InputLabel>
                <Select
                  value={formData.is_serialized}
                  onChange={handleChange('is_serialized')}
                  label="Có serial/IMEI?"
                >
                  <MenuItem value={0}>Không</MenuItem>
                  <MenuItem value={1}>Có</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Thời hạn bảo hành (tháng)"
                type="number"
                value={formData.warranty_months}
                onChange={handleChange('warranty_months')}
                helperText={formData.is_serialized ? "Tự động tạo bảo hành khi hoàn tất đơn hàng" : "Chỉ áp dụng cho sản phẩm có serial"}
                disabled={!formData.is_serialized}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Hủy</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {product ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Product Card Component
interface ProductCardProps {
  product: any;
  onEdit: (product: any) => void;
  onDelete: (id: string) => void;
  onView: (product: any) => void;
  viewMode?: 'grid' | 'list' | 'compact';
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onEdit, 
  onDelete, 
  onView, 
  viewMode = 'grid'
}) => {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(cents);
  };

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) return { label: 'Hết hàng', color: 'error' as const, icon: Error };
    if (stock <= minStock) return { label: 'Sắp hết', color: 'warning' as const, icon: Warning };
    return { label: 'Còn hàng', color: 'success' as const, icon: CheckCircle };
  };

  const getProfitMargin = (price: number, cost: number) => {
    if (cost === 0) return 0;
    return ((price - cost) / cost) * 100;
  };

  const stockStatus = getStockStatus(product.stock, product.min_stock);
  const profitMargin = getProfitMargin(product.price_cents, product.cost_price_cents);
  const [isHovered, setIsHovered] = useState(false);

  if (viewMode === 'list') {
  return (
      <Card sx={{ mb: 2, transition: 'all 0.3s ease' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.light' }}>
                  <Image />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    SKU: {product.sku}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="h6" color="primary" fontWeight="bold">
                {formatCurrency(product.price_cents)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Lợi nhuận: {profitMargin.toFixed(1)}%
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <stockStatus.icon color={stockStatus.color} />
                <Typography variant="body2">
                  {product.stock} / {product.min_stock}
                </Typography>
              </Box>
              <Chip label={stockStatus.label} size="small" color={stockStatus.color} />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="body2" color="text.secondary">
                Lợi nhuận: {profitMargin.toFixed(1)}%
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Xem chi tiết">
                  <IconButton size="small" onClick={() => onView(product)}>
                    <Visibility />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Chỉnh sửa">
                  <IconButton size="small" onClick={() => onEdit(product)}>
                    <Edit />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Xóa">
                  <IconButton size="small" color="error" onClick={() => onDelete(product.id)}>
                    <Delete />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: isHovered ? 8 : 2,
          '&:hover': {
            boxShadow: 12,
          }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >

        <CardContent sx={{ flex: 1, pt: 3 }}>
          {/* Product Image Placeholder */}
          <Box sx={{ 
            height: 200, 
            bgcolor: 'grey.100', 
            borderRadius: 2, 
            mb: 2, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.light' }}>
              <Image sx={{ fontSize: 40 }} />
            </Avatar>
            {product.is_serialized && (
              <Chip
                label="Serial"
                size="small"
                color="info"
                sx={{ position: 'absolute', top: 8, left: 8 }}
              />
            )}
          </Box>

          {/* Product Info */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ 
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minHeight: '3em'
            }}>
              {product.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              SKU: {product.sku}
            </Typography>
            {product.barcode && (
              <Typography variant="caption" color="text.secondary">
                Barcode: {product.barcode}
              </Typography>
            )}
        </Box>

          {/* Price and Profit Info */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight="bold" color="primary">
            {formatCurrency(product.price_cents || 0)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Giá nhập: {formatCurrency(product.cost_price_cents || 0)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <TrendingUp sx={{ fontSize: 16, color: profitMargin > 20 ? 'success.main' : 'warning.main' }} />
              <Typography variant="caption" color={profitMargin > 20 ? 'success.main' : 'warning.main'}>
                Lợi nhuận: {profitMargin.toFixed(1)}%
          </Typography>
            </Box>
        </Box>

          {/* Stock Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              Tồn kho: {product.stock || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Min: {product.min_stock || 0} | Max: {product.max_stock || 0}
            </Typography>
          </Box>
          <Chip
            icon={<stockStatus.icon />}
            label={stockStatus.label}
            size="small"
            color={stockStatus.color as any}
          />
        </Box>


          {/* Description */}
        {product.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {product.description.length > 100 
              ? `${product.description.substring(0, 100)}...` 
              : product.description}
          </Typography>
        )}

      </CardContent>

        {/* Action Buttons */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Button
            size="small"
            startIcon={<Visibility />}
            onClick={() => onView(product)}
            sx={{ flex: 1 }}
          >
            Xem
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => onEdit(product)}
            sx={{ flex: 1 }}
          >
            Sửa
          </Button>
          <Button
            size="small"
            color="error"
            startIcon={<Delete />}
            onClick={() => onDelete(product.id)}
            sx={{ flex: 1 }}
          >
            Xóa
          </Button>
        </Box>
        </Box>
      </Card>
    );
  };

// Product List Component
const ProductList: React.FC = () => {
  // State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(1000);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    stockStatus: '',
    priceRange: [0, 1000000],
    sortBy: 'name',
    sortOrder: 'asc' as 'asc' | 'desc'
  });
  
  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [isLoading] = useState(false);

  // Handle product creation - go to last page
  const handleProductCreated = () => {
    if (productsData?.data?.pagination) {
      const totalPages = productsData.data.pagination.totalPages;
      if (totalPages > 1) {
        setPage(totalPages);
      }
    }
  };

  const queryClient = useQueryClient();

  // Fetch products with advanced filtering
  const { data: productsData, isLoading: productsLoading, error, refetch } = useQuery({
    queryKey: ['products', page, pageSize, searchTerm, filters],
    queryFn: async () => {
      console.log('Fetching products with params:', { page, pageSize, searchTerm, filters });
      const response = await productsAPI.getProducts(page, pageSize, searchTerm || undefined);
      console.log('Products API response:', response.data);
      return response;
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      console.log('Fetching categories...');
      const response = await categoriesAPI.getCategories(1, 100);
      console.log('Categories API response:', response.data);
      return response;
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting product with ID:', id);
      const response = await productsAPI.deleteProduct(id);
      console.log('Delete product response:', response.data);
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      console.log('Product deleted successfully:', id);
      alert('Sản phẩm đã được xóa thành công!');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      alert('Lỗi khi xóa sản phẩm: ' + (error.message || 'Không thể xóa sản phẩm'));
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      console.log('Bulk deleting products:', ids);
      const responses = await Promise.all(ids.map(id => productsAPI.deleteProduct(id)));
      console.log('Bulk delete responses:', responses);
      return responses;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSelectedProducts(new Set());
      setBulkActionOpen(false);
      console.log('Bulk delete completed for products:', ids);
      alert(`Đã xóa thành công ${ids.length} sản phẩm!`);
    },
    onError: (error) => {
      console.error('Bulk delete error:', error);
      alert('Lỗi khi xóa hàng loạt: ' + (error.message || 'Không thể xóa sản phẩm'));
    },
  });

  const products = productsData?.data?.products || [];
  const categories = categoriesData?.data?.categories || [];
  const paginationInfo = productsData?.data?.pagination;

  // Basic analytics
  const analytics = useMemo(() => {
    if (!products.length) return null;
    
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.is_active).length;
    const lowStockProducts = products.filter(p => p.stock <= p.min_stock).length;
    const outOfStockProducts = products.filter(p => p.stock === 0).length;
    const serializedProducts = products.filter(p => p.is_serialized).length;
    
    const totalValue = products.reduce((sum, p) => sum + (p.price_cents * p.stock), 0);
    const avgProfitMargin = products.reduce((sum, p) => {
      const margin = p.cost_price_cents > 0 ? ((p.price_cents - p.cost_price_cents) / p.cost_price_cents) * 100 : 0;
      return sum + margin;
    }, 0) / totalProducts;
    
    return {
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      serializedProducts,
      totalValue,
      avgProfitMargin,
      healthScore: Math.round((activeProducts / totalProducts) * 100)
    };
  }, [products]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    
    // Apply filters
    if (filters.category) {
      filtered = filtered.filter(p => p.category_id === filters.category);
    }
    
    if (filters.status) {
      filtered = filtered.filter(p => 
        filters.status === 'active' ? p.is_active : !p.is_active
      );
    }
    
    if (filters.stockStatus) {
      filtered = filtered.filter(p => {
        if (filters.stockStatus === 'out') return p.stock === 0;
        if (filters.stockStatus === 'low') return p.stock <= p.min_stock && p.stock > 0;
        if (filters.stockStatus === 'good') return p.stock > p.min_stock;
        return true;
      });
    }
    
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000000) {
      filtered = filtered.filter(p => 
        p.price_cents >= filters.priceRange[0] && p.price_cents <= filters.priceRange[1]
      );
    }
    
    // Sort products
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.price_cents;
          bValue = b.price_cents;
          break;
        case 'stock':
          aValue = a.stock;
          bValue = b.stock;
          break;
        case 'profit':
          aValue = a.cost_price_cents > 0 ? ((a.price_cents - a.cost_price_cents) / a.cost_price_cents) * 100 : 0;
          bValue = b.cost_price_cents > 0 ? ((b.price_cents - b.cost_price_cents) / b.cost_price_cents) * 100 : 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [products, filters]);

  // Event Handlers
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    console.log('Search term changed:', searchValue);
    setSearchTerm(searchValue);
    setPage(1);
    
    // Trigger search API call if search term is long enough
    if (searchValue.length >= 2) {
      console.log('Triggering search API for:', searchValue);
      // The useQuery will automatically refetch due to searchTerm dependency
    }
  }, []);

  const handleRefresh = useCallback(() => {
    console.log('Refreshing products...');
    refetch();
  }, [refetch]);

  const handleEdit = useCallback((product: any) => {
    console.log('Edit product:', product);
    setSelectedProduct(product);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    console.log('Delete product:', id);
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation]);

  const handleView = useCallback((product: any) => {
    console.log('View product:', product);
    const productInfo = {
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      price: product.price_cents,
      cost: product.cost_price_cents,
      stock: product.stock,
      minStock: product.min_stock,
      maxStock: product.max_stock,
      category: product.category_name,
      brand: product.brand_name,
      isActive: product.is_active,
      isSerialized: product.is_serialized,
      description: product.description
    };
    console.log('Product details for viewing:', productInfo);
    alert(`Xem sản phẩm:\n\nTên: ${product.name}\nSKU: ${product.sku}\nBarcode: ${product.barcode || 'N/A'}\nGiá: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price_cents)}\nGiá nhập: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.cost_price_cents)}\nTồn kho: ${product.stock}\nMin: ${product.min_stock} | Max: ${product.max_stock}\nDanh mục: ${product.category_name || 'N/A'}\nThương hiệu: ${product.brand_name || 'N/A'}\nTrạng thái: ${product.is_active ? 'Hoạt động' : 'Không hoạt động'}\nCó serial: ${product.is_serialized ? 'Có' : 'Không'}`);
  }, []);


  const handleBulkAction = useCallback((action: string) => {
    if (action === 'delete' && selectedProducts.size > 0) {
      if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedProducts.size} sản phẩm?`)) {
        bulkDeleteMutation.mutate(Array.from(selectedProducts));
      }
    }
  }, [selectedProducts, bulkDeleteMutation]);


  const handleFilterChange = useCallback((key: string, value: any) => {
    console.log('Filter changed:', key, value);
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      console.log('New filters applied:', newFilters);
      return newFilters;
    });
    setPage(1);
    console.log(`Filter ${key} set to ${value} - products will be filtered accordingly`);
  }, []);

  const clearFilters = useCallback(() => {
    console.log('Clearing all filters');
    const defaultFilters = {
      category: '',
      status: '',
      stockStatus: '',
      priceRange: [0, 1000000],
      sortBy: 'name',
      sortOrder: 'asc' as 'asc' | 'desc'
    };
    setFilters(defaultFilters);
    console.log('All filters cleared - showing all products with default sorting');
  }, []);

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Không thể tải dữ liệu sản phẩm. Vui lòng kiểm tra kết nối mạng.
        </Alert>
        <Button onClick={handleRefresh} startIcon={<Refresh />}>
          Thử lại
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Danh sách sản phẩm
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Quản lý danh mục sản phẩm
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Advanced Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {analytics?.totalProducts || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Tổng sản phẩm
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                  <Inventory />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {analytics?.activeProducts || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Đang hoạt động
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                  <CheckCircle />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {analytics?.lowStockProducts || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Sắp hết hàng
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                  <Warning />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {analytics?.outOfStockProducts || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Hết hàng
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                  <Error />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Advanced Toolbar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {/* Main Toolbar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            {/* Search */}
            <TextField
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300, flex: 1 }}
            />
            
            {/* View Mode Toggle */}
            <Box sx={{ display: 'flex', border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <IconButton
                onClick={() => {
                  console.log('Setting view mode to grid');
                  setViewMode('grid');
                  console.log('View mode changed to grid - products will display in grid layout');
                }}
                color={viewMode === 'grid' ? 'primary' : 'default'}
                size="small"
              >
                <GridView />
              </IconButton>
              <IconButton
                onClick={() => {
                  console.log('Setting view mode to list');
                  setViewMode('list');
                  console.log('View mode changed to list - products will display in list layout');
                }}
                color={viewMode === 'list' ? 'primary' : 'default'}
                size="small"
              >
                <ViewList />
              </IconButton>
              <IconButton
                onClick={() => {
                  console.log('Setting view mode to compact');
                  setViewMode('compact');
                  console.log('View mode changed to compact - products will display in compact layout');
                }}
                color={viewMode === 'compact' ? 'primary' : 'default'}
                size="small"
              >
                <ViewComfy />
              </IconButton>
            </Box>


            {/* Action Buttons */}
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                console.log('Add product clicked');
                setSelectedProduct(null);
                setFormOpen(true);
              }}
              sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
            >
              Thêm sản phẩm
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
            >
              Làm mới
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => {
                console.log('Toggle filters:', !showFilters);
                setShowFilters(!showFilters);
              }}
              color={showFilters ? 'primary' : 'inherit'}
            >
              Bộ lọc
            </Button>

            {/* Bulk Actions */}
            {selectedProducts.size > 0 && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={() => setBulkActionOpen(true)}
              >
                Xóa ({selectedProducts.size})
              </Button>
            )}
          </Box>

          {/* Advanced Filters */}
          <Collapse in={showFilters}>
            <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Danh mục</InputLabel>
                    <Select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      label="Danh mục"
                    >
                      <MenuItem value="">Tất cả</MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Trạng thái</InputLabel>
                    <Select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      label="Trạng thái"
                    >
                      <MenuItem value="">Tất cả</MenuItem>
                      <MenuItem value="active">Hoạt động</MenuItem>
                      <MenuItem value="inactive">Không hoạt động</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Tình trạng kho</InputLabel>
                    <Select
                      value={filters.stockStatus}
                      onChange={(e) => handleFilterChange('stockStatus', e.target.value)}
                      label="Tình trạng kho"
                    >
                      <MenuItem value="">Tất cả</MenuItem>
                      <MenuItem value="good">Còn hàng</MenuItem>
                      <MenuItem value="low">Sắp hết</MenuItem>
                      <MenuItem value="out">Hết hàng</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Sắp xếp</InputLabel>
                    <Select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      label="Sắp xếp"
                    >
                      <MenuItem value="name">Tên</MenuItem>
                      <MenuItem value="price">Giá</MenuItem>
                      <MenuItem value="stock">Tồn kho</MenuItem>
                      <MenuItem value="profit">Lợi nhuận</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Thứ tự</InputLabel>
                    <Select
                      value={filters.sortOrder}
                      onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                      label="Thứ tự"
                    >
                      <MenuItem value="asc">Tăng dần</MenuItem>
                      <MenuItem value="desc">Giảm dần</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={clearFilters}
                      startIcon={<Clear />}
                    >
                      Xóa bộ lọc
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* Products Display */}
      {productsLoading ? (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Box key={index} sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <Card>
                <CardContent>
                  <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
                  <Skeleton variant="text" height={32} sx={{ mb: 1 }} />
                  <Skeleton variant="text" height={24} sx={{ mb: 1 }} />
                  <Skeleton variant="text" height={20} />
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      ) : (
        <>
          {/* Products Grid/List */}
          {viewMode === 'list' ? (
            <Box>
              {filteredProducts.map((product: any) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                  viewMode="list"
                />
              ))}
      </Box>
          ) : (
            <Grid container spacing={2}>
              {filteredProducts.map((product: any) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                  <ProductCard
                    product={product}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                    viewMode={viewMode}
                  />
                </Grid>
              ))}
            </Grid>
          )}

      {/* Empty State */}
          {filteredProducts.length === 0 && !productsLoading && (
            <Card sx={{ mt: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 3, bgcolor: 'grey.100' }}>
                  <SearchOff sx={{ fontSize: 40, color: 'grey.400' }} />
            </Avatar>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {searchTerm ? 'Không tìm thấy sản phẩm' : 'Chưa có sản phẩm nào'}
            </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  {searchTerm 
                    ? `Không có sản phẩm nào khớp với "${searchTerm}"`
                    : 'Bắt đầu bằng cách thêm sản phẩm đầu tiên của bạn'
                  }
            </Typography>
                {searchTerm ? (
                  <Button
                    variant="outlined"
                    startIcon={<Clear />}
                    onClick={() => setSearchTerm('')}
                    sx={{ mr: 2 }}
                  >
                    Xóa tìm kiếm
                  </Button>
                ) : null}
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setFormOpen(true)}
            >
                  {searchTerm ? 'Thêm sản phẩm mới' : 'Thêm sản phẩm đầu tiên'}
            </Button>
          </CardContent>
        </Card>
          )}
        </>
      )}

      {/* Pagination Controls */}
      {!productsLoading && (paginationInfo?.totalPages || 1) > 1 && (
        <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Tổng: {paginationInfo?.total || products.length} sản phẩm · Trang {paginationInfo?.page || page}/{paginationInfo?.totalPages}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl size="small">
              <InputLabel>Hiển thị</InputLabel>
              <Select
                label="Hiển thị"
                value={pageSize}
                onChange={(e) => {
                  const newSize = Number(e.target.value);
                  setPage(1);
                  setPageSize(newSize);
                }}
                sx={{ minWidth: 100 }}
              >
                <MenuItem value={12}>12</MenuItem>
                <MenuItem value={24}>24</MenuItem>
                <MenuItem value={48}>48</MenuItem>
                <MenuItem value={96}>96</MenuItem>
              </Select>
            </FormControl>
            <Pagination
              color="primary"
              count={paginationInfo?.totalPages || 1}
              page={paginationInfo?.page || page}
              onChange={(_, value) => setPage(value)}
              showFirstButton
              showLastButton
            />
          </Box>
        </Box>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
        onClick={() => {
          console.log('Floating Action Button clicked - opening add product dialog');
          setSelectedProduct(null);
          setFormOpen(true);
        }}
      >
        <Add />
      </Fab>

      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress color="inherit" />
          <Typography variant="h6">Đang xử lý...</Typography>
        </Box>
      </Backdrop>

      {/* Product Form Dialog */}
      <ProductForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        product={selectedProduct}
        categories={categories}
        onProductCreated={handleProductCreated}
      />

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionOpen} onClose={() => setBulkActionOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thao tác hàng loạt</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Bạn đã chọn {selectedProducts.size} sản phẩm. Bạn muốn thực hiện thao tác gì?
          </Typography>
          <List>
            <ListItem component="div" onClick={() => handleBulkAction('delete')} sx={{ cursor: 'pointer' }}>
              <ListItemIcon>
                <Delete color="error" />
              </ListItemIcon>
              <ListItemText primary="Xóa sản phẩm" secondary="Xóa vĩnh viễn các sản phẩm đã chọn" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionOpen(false)}>Hủy</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default ProductList;