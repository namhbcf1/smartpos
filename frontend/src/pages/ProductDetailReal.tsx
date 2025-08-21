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
  Paper,
  Container,
} from '@mui/material';
import {
  ArrowBack,
  Inventory,
  AttachMoney,
  Category,
  QrCode,
  ShoppingCart,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
} from '@mui/icons-material';

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

const ProductDetailReal = () => {
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
      
      // DIRECT API CALL - Get product from D1 Cloudflare
      console.log('📡 Calling SmartPOS API...');
      const response = await fetch('https://pos-backend-bangachieu2.bangachieu2.workers.dev/api/v1/products?limit=100');
      const data = await response.json();
      
      console.log('📦 D1 Database response:', data);
      
      if (data.success && data.data && data.data.data) {
        const products = data.data.data;
        const foundProduct = products.find((p: any) => p.id === parseInt(id || '0'));
        
        if (foundProduct) {
          console.log('✅ Found product from D1:', foundProduct);
          setProduct(foundProduct);
        } else {
          console.log('❌ Product not found in D1');
          setError('Không tìm thấy sản phẩm');
        }
      } else {
        console.log('❌ Invalid D1 response format');
        setError('Không thể tải dữ liệu từ D1 Database');
      }
    } catch (err) {
      console.error('❌ Error fetching from D1:', err);
      setError('Lỗi kết nối D1 Database');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStockStatus = (stock: number, minLevel: number) => {
    if (stock <= 0) return { label: 'Hết hàng', color: 'error' as const, icon: <ErrorIcon /> };
    if (stock <= minLevel) return { label: 'Sắp hết', color: 'warning' as const, icon: <Warning /> };
    return { label: 'Còn hàng', color: 'success' as const, icon: <CheckCircle /> };
  };

  const calculateProfit = (sellPrice: number, costPrice: number) => {
    const profit = sellPrice - costPrice;
    const margin = (profit / costPrice) * 100;
    return { profit, margin };
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px">
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Đang tải dữ liệu từ D1 Cloudflare...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate('/sales/new')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            Chi tiết sản phẩm
          </Typography>
        </Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchProduct}>
          Thử lại
        </Button>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">Không tìm thấy sản phẩm</Alert>
      </Container>
    );
  }

  const stockStatus = getStockStatus(product.stockQuantity, product.stockAlertThreshold);
  const { profit, margin } = calculateProfit(product.price, product.costPrice);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={4}>
        <IconButton onClick={() => navigate('/sales/new')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Chi tiết sản phẩm
        </Typography>
        <Chip 
          label="D1 CLOUDFLARE" 
          color="primary" 
          variant="filled"
          sx={{ fontWeight: 'bold' }}
        />
      </Box>

      {/* Success Alert */}
      <Alert severity="success" sx={{ mb: 3 }}>
        <Typography variant="body2">
          ✅ <strong>Dữ liệu thực tế 100%</strong> - Được lấy trực tiếp từ D1 Cloudflare Database
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* Product Image */}
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={3}
            sx={{ 
              p: 4, 
              textAlign: 'center', 
              background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)',
              border: '2px dashed #cbd5e1',
              borderRadius: 2
            }}
          >
            <Box sx={{ fontSize: '4rem', color: '#cbd5e1', mb: 2 }}>
              📦
            </Box>
            <Typography variant="body2" color="text.secondary">
              Hình ảnh sản phẩm
            </Typography>
          </Paper>
        </Grid>

        {/* Product Info */}
        <Grid item xs={12} md={8}>
          <Card elevation={3}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                {product.name}
              </Typography>

              <Box display="flex" gap={1} mb={3} flexWrap="wrap">
                <Chip
                  icon={stockStatus.icon}
                  label={stockStatus.label}
                  color={stockStatus.color}
                  variant="filled"
                />
                <Chip
                  label={product.isActive ? 'Hoạt động' : 'Không hoạt động'}
                  color={product.isActive ? 'success' : 'default'}
                  variant="outlined"
                />
                <Chip
                  label="REALTIME"
                  color="primary"
                  variant="filled"
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                {/* Basic Info */}
                <Grid item xs={12} sm={6}>
                  <Box sx={{ '& > div': { mb: 2 } }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" 
                         sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 1, borderLeft: '4px solid #0ea5e9' }}>
                      <Box display="flex" alignItems="center">
                        <QrCode sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" fontWeight="600" color="text.secondary">SKU:</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="500">{product.sku}</Typography>
                    </Box>

                    {product.barcode && (
                      <Box display="flex" alignItems="center" justifyContent="space-between" 
                           sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 1, borderLeft: '4px solid #0ea5e9' }}>
                        <Box display="flex" alignItems="center">
                          <QrCode sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" fontWeight="600" color="text.secondary">Barcode:</Typography>
                        </Box>
                        <Typography variant="body2" fontWeight="500">{product.barcode}</Typography>
                      </Box>
                    )}

                    <Box display="flex" alignItems="center" justifyContent="space-between" 
                         sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 1, borderLeft: '4px solid #0ea5e9' }}>
                      <Box display="flex" alignItems="center">
                        <Category sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" fontWeight="600" color="text.secondary">Danh mục:</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="500">{product.categoryName || 'Chưa phân loại'}</Typography>
                    </Box>
                  </Box>
                </Grid>

                {/* Price & Stock Info */}
                <Grid item xs={12} sm={6}>
                  <Box sx={{ '& > div': { mb: 2 } }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" 
                         sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 1, borderLeft: '4px solid #dc2626' }}>
                      <Box display="flex" alignItems="center">
                        <AttachMoney sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" fontWeight="600" color="text.secondary">Giá bán:</Typography>
                      </Box>
                      <Typography variant="h6" color="error.main" fontWeight="bold">
                        {formatCurrency(product.price)}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" justifyContent="space-between" 
                         sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 1, borderLeft: '4px solid #0ea5e9' }}>
                      <Typography variant="body2" fontWeight="600" color="text.secondary">Giá vốn:</Typography>
                      <Typography variant="body2" fontWeight="500">{formatCurrency(product.costPrice)}</Typography>
                    </Box>

                    <Box display="flex" alignItems="center" justifyContent="space-between" 
                         sx={{ p: 1.5, bgcolor: '#f0fdf4', borderRadius: 1, borderLeft: '4px solid #16a34a' }}>
                      <Typography variant="body2" fontWeight="600" color="success.main">Lợi nhuận:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        {formatCurrency(profit)} ({margin.toFixed(1)}%)
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" justifyContent="space-between" 
                         sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 1, borderLeft: '4px solid #0ea5e9' }}>
                      <Box display="flex" alignItems="center">
                        <Inventory sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" fontWeight="600" color="text.secondary">Tồn kho:</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="500">{product.stockQuantity} sản phẩm</Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Description */}
      <Card elevation={3} sx={{ mt: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            📝 Mô tả chi tiết
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ 
            bgcolor: '#f8fafc', 
            p: 3, 
            borderRadius: 2, 
            whiteSpace: 'pre-line',
            lineHeight: 1.6
          }}>
            <Typography variant="body2">
{`🔧 Thông số kỹ thuật:
• SKU: ${product.sku}
• Danh mục: ${product.categoryName || 'Linh kiện máy tính'}
• Barcode: ${product.barcode || 'Không có'}

💰 Thông tin giá:
• Giá bán: ${formatCurrency(product.price)}
• Giá vốn: ${formatCurrency(product.costPrice)}
• Lợi nhuận: ${formatCurrency(profit)} (${margin.toFixed(1)}%)
• Thuế VAT: ${(product.taxRate * 100)}%

📦 Tồn kho:
• Số lượng hiện có: ${product.stockQuantity} sản phẩm
• Mức cảnh báo: ${product.stockAlertThreshold} sản phẩm
• Trạng thái: ${stockStatus.label}

✅ Trạng thái: ${product.isActive ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}
📅 Ngày tạo: ${formatDate(product.created_at)}

Sản phẩm chất lượng cao, được quản lý bằng hệ thống SmartPOS với dữ liệu thực tế từ D1 Cloudflare Database.`}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box display="flex" gap={2} justifyContent="center" mt={4}>
        <Button
          variant="contained"
          size="large"
          startIcon={<ShoppingCart />}
          onClick={() => navigate('/sales/new')}
          sx={{ px: 4 }}
        >
          Quay lại POS
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={() => window.open('https://smartpos-api.bangachieu2.workers.dev/api/v1/products', '_blank')}
          sx={{ px: 4 }}
        >
          Xem API Raw
        </Button>
      </Box>
    </Container>
  );
};

export default ProductDetailReal;
