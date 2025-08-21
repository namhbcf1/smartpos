import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Alert,
  CircularProgress,
  CardMedia,
} from '@mui/material';
import {
  ArrowBack,
  Inventory,
  AttachMoney,
  Category,
  QrCode,
  ShoppingCart,
} from '@mui/icons-material';
// import { formatCurrency } from '../config/constants';

// Temporary formatCurrency function
const formatCurrency = (amount: number | null | undefined) => {
  if (amount == null || isNaN(amount)) {
    return '0 ₫';
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  categoryId: number;
  categoryName?: string;
  price: number;
  costPrice: number;
  taxRate: number;
  stockQuantity: number;
  stockAlertThreshold: number;
  isActive: boolean;
  imageUrl?: string;
  brand?: string;
  description?: string;
  created_at: string;
}

const SimpleProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching product with ID:', id);
      
      // Fetch from products list API
      const response = await fetch('https://smartpos-api.bangachieu2.workers.dev/api/v1/products?limit=100');
      const data = await response.json();
      
      console.log('📦 Products API response:', data);
      
      if (data.success && data.data && data.data.data) {
        const products = data.data.data;
        const foundProduct = products.find((p: any) => p.id === parseInt(id || '0'));
        
        if (foundProduct) {
          console.log('✅ Found product:', foundProduct);
          setProduct(foundProduct);
        } else {
          setError('Không tìm thấy sản phẩm');
        }
      } else {
        setError('Không thể tải danh sách sản phẩm');
      }
    } catch (err) {
      setError('Không thể tải thông tin sản phẩm');
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (stock: number, minLevel: number) => {
    if (stock <= 0) return { label: 'Hết hàng', color: 'error' as const };
    if (stock <= minLevel) return { label: 'Sắp hết', color: 'warning' as const };
    return { label: 'Còn hàng', color: 'success' as const };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate('/sales/new')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            Chi tiết sản phẩm
          </Typography>
        </Box>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!product) {
    return (
      <Box p={3}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate('/sales/new')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            Chi tiết sản phẩm
          </Typography>
        </Box>
        <Alert severity="info">Không tìm thấy sản phẩm</Alert>
      </Box>
    );
  }

  const stockStatus = getStockStatus(product.stockQuantity, product.stockAlertThreshold);

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/sales/new')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1">
          Chi tiết sản phẩm
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Product Image */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardMedia
              component="img"
              height="300"
              image={product.imageUrl || '/placeholder-product.jpg'}
              alt={product.name}
              sx={{ objectFit: 'cover' }}
            />
          </Card>
        </Grid>

        {/* Product Info */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                {product.name}
              </Typography>

              <Box display="flex" gap={1} mb={2}>
                <Chip
                  label={stockStatus.label}
                  color={stockStatus.color}
                  size="small"
                />
                <Chip
                  label={product.isActive ? 'Hoạt động' : 'Không hoạt động'}
                  color={product.isActive ? 'success' : 'default'}
                  size="small"
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <QrCode sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      SKU: {product.sku}
                    </Typography>
                  </Box>
                  {product.barcode && (
                    <Box display="flex" alignItems="center" mb={1}>
                      <QrCode sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Barcode: {product.barcode}
                      </Typography>
                    </Box>
                  )}
                  <Box display="flex" alignItems="center" mb={1}>
                    <Category sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Danh mục: {product.categoryName || 'Chưa phân loại'}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <AttachMoney sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Giá bán: 
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ ml: 1 }}>
                      {formatCurrency(product.price)}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    <AttachMoney sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Giá vốn: {formatCurrency(product.costPrice)}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Inventory sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Tồn kho: {product.stockQuantity} sản phẩm
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {product.description && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Mô tả
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {product.description}
                  </Typography>
                </>
              )}

              <Divider sx={{ my: 2 }} />

              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  startIcon={<ShoppingCart />}
                  onClick={() => navigate('/sales/new')}
                >
                  Thêm vào giỏ hàng
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/products')}
                >
                  Quản lý sản phẩm
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SimpleProductDetail;
