import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  InputAdornment,
  Alert,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Delete,
  Visibility,
  Warning,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import { getProducts, getLowStockProducts } from '@shared/services/api';
import { Product } from '@shared/types';

const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = showLowStockOnly 
        ? await getLowStockProducts()
        : await getProducts({ sort_by: 'name', sort_order: 'asc', limit: 100 });
      
      if (response.success && response.data) {
        const mappedProducts = response.data.map((product: any) => ({
          ...product,
          category_id: product.categoryId,
          stock_quantity: product.stockQuantity,
          created_at: product.createdAt,
          updated_at: product.updatedAt,
          min_stock_level: product.minStockLevel || 0
        }));
        setProducts(mappedProducts);
        setFilteredProducts(mappedProducts);
      } else {
        setError(response.error || 'Không thể tải danh sách sản phẩm');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Lỗi kết nối đến server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [showLowStockOnly]);

  // Filter products based on search
  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  // Get stock status color
  const getStockStatus = (product: Product) => {
    if (product.stock_quantity <= 0) {
      return { color: 'error', icon: <Error />, text: 'Hết hàng' };
    } else if (product.stock_quantity <= product.min_stock_level) {
      return { color: 'warning', icon: <Warning />, text: 'Sắp hết' };
    } else {
      return { color: 'success', icon: <CheckCircle />, text: 'Còn hàng' };
    }
  };

  const handleAddProduct = () => {
    // Navigate to product creation
    window.open('https://smartpos-web.pages.dev/products/create', '_blank');
  };

  const handleEditProduct = (productId: number) => {
    // Navigate to product edit
    window.open(`https://smartpos-web.pages.dev/products/${productId}/edit`, '_blank');
  };

  const handleViewProduct = (productId: number) => {
    // Navigate to product detail
    window.open(`https://smartpos-web.pages.dev/products/${productId}`, '_blank');
  };

  return (
    <Box sx={{ flexGrow: 1, p: 2 }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" component="h1">
              Quản Lý Kho Hàng
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddProduct}
            >
              Thêm Sản Phẩm
            </Button>
          </Box>
        </Grid>

        {/* Filters */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder="Tìm kiếm sản phẩm, SKU, danh mục..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant={showLowStockOnly ? "contained" : "outlined"}
                      onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                      startIcon={<Warning />}
                    >
                      {showLowStockOnly ? 'Tất cả sản phẩm' : 'Sắp hết hàng'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={fetchProducts}
                    >
                      Làm mới
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Error Alert */}
        {error && (
          <Grid item xs={12}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Grid>
        )}

        {/* Products Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <Typography>Đang tải danh sách sản phẩm...</Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Sản phẩm</TableCell>
                        <TableCell>SKU</TableCell>
                        <TableCell>Danh mục</TableCell>
                        <TableCell align="right">Tồn kho</TableCell>
                        <TableCell align="right">Giá bán</TableCell>
                        <TableCell>Trạng thái</TableCell>
                        <TableCell align="center">Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredProducts.map((product) => {
                        const stockStatus = getStockStatus(product);
                        return (
                          <TableRow key={product.id} hover>
                            <TableCell>
                              <Box>
                                <Typography variant="subtitle2" fontWeight="bold">
                                  {product.name}
                                </Typography>
                                {product.description && (
                                  <Typography variant="caption" color="text.secondary">
                                    {product.description}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontFamily="monospace">
                                {product.sku || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {product.category_name || 'Chưa phân loại'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="bold">
                                {product.stock_quantity}
                              </Typography>
                              {product.min_stock_level > 0 && (
                                <Typography variant="caption" color="text.secondary">
                                  Min: {product.min_stock_level}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="bold">
                                {product.price.toLocaleString('vi-VN')} ₫
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={stockStatus.icon}
                                label={stockStatus.text}
                                color={stockStatus.color as any}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleViewProduct(product.id)}
                                  title="Xem chi tiết"
                                >
                                  <Visibility />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="secondary"
                                  onClick={() => handleEditProduct(product.id)}
                                  title="Chỉnh sửa"
                                >
                                  <Edit />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {!loading && filteredProducts.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" color="text.secondary">
                    {searchTerm ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có sản phẩm nào'}
                  </Typography>
                  {!searchTerm && (
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={handleAddProduct}
                      sx={{ mt: 2 }}
                    >
                      Thêm sản phẩm đầu tiên
                    </Button>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Summary */}
        {!loading && filteredProducts.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tổng quan kho hàng
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Tổng sản phẩm: <strong>{filteredProducts.length}</strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Hết hàng: <strong>{filteredProducts.filter(p => p.stock_quantity <= 0).length}</strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Sắp hết: <strong>{filteredProducts.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_level).length}</strong>
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default InventoryPage;
