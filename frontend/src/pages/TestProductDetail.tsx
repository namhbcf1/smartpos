import React from 'react';
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
} from '@mui/material';
import {
  ArrowBack,
  Inventory,
  AttachMoney,
  Category,
  QrCode,
  ShoppingCart,
} from '@mui/icons-material';

// Temporary formatCurrency function
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

const TestProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Mock product data based on ID
  const product = {
    id: parseInt(id || '0'),
    name: `Test Product ${id}`,
    sku: `TEST-SKU-${id}`,
    barcode: `${id}000000000`,
    categoryId: 1,
    categoryName: 'Linh kiện máy tính',
    price: 1000000 + (parseInt(id || '0') * 100000),
    costPrice: 800000 + (parseInt(id || '0') * 80000),
    taxRate: 0.1,
    stockQuantity: 10 + parseInt(id || '0'),
    stockAlertThreshold: 5,
    isActive: true,
    imageUrl: null,
    brand: 'Test Brand',
    description: `This is a test product with ID ${id}. This page demonstrates that the routing and component loading works correctly.`,
    created_at: new Date().toISOString(),
  };

  const getStockStatus = (stock: number, minLevel: number) => {
    if (stock <= 0) return { label: 'Hết hàng', color: 'error' as const };
    if (stock <= minLevel) return { label: 'Sắp hết', color: 'warning' as const };
    return { label: 'Còn hàng', color: 'success' as const };
  };

  const stockStatus = getStockStatus(product.stockQuantity, product.stockAlertThreshold);

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/sales/new')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1">
          Chi tiết sản phẩm (Test)
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Product Image */}
        <Grid item xs={12} md={4}>
          <Card>
            <Box
              sx={{
                height: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f5f5',
                color: '#666'
              }}
            >
              <Typography variant="h6">
                No Image Available
              </Typography>
            </Box>
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
                <Chip
                  label="TEST MODE"
                  color="warning"
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
                  <Box display="flex" alignItems="center" mb={1}>
                    <QrCode sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Barcode: {product.barcode}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Category sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Danh mục: {product.categoryName}
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

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Mô tả
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {product.description}
              </Typography>

              <Typography variant="body2" color="warning.main" paragraph>
                🧪 <strong>TEST MODE:</strong> Đây là trang test để kiểm tra routing và component loading. 
                Dữ liệu được tạo mock dựa trên ID sản phẩm.
              </Typography>

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

export default TestProductDetail;
