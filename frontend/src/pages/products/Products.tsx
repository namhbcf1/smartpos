import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  TablePagination,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Fab,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { usePaginatedQuery } from '../../hooks/useApiData';
import api from '../../services/api';

// Import modular components
import { ProductsHeader } from './components/ProductsHeader';
import { ProductsFilters } from './components/ProductsFilters';
import { ProductsTable } from './components/ProductsTable';
import { 
  Product, 
  ProductFilters, 
  ProductStats 
} from './components/types';

const Products = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State Management
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    price_range: { min: 0, max: 999999999 },
    stock_status: 'all',
    status: 'all',
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  const [stats, setStats] = useState<ProductStats | null>(null);

  // Default stats structure to prevent undefined errors
  const defaultStats: ProductStats = {
    total_products: 0,
    active_products: 0,
    inactive_products: 0,
    low_stock_products: 0,
    out_of_stock_products: 0,
    featured_products: 0,
    total_value: 0,
    average_price: 0,
    top_categories: [],
    top_brands: [],
    top_suppliers: [],
    recent_products: [],
    best_sellers: []
  };
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Fetch products with pagination and filters
  const {
    data: products,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
    pagination
  } = usePaginatedQuery<Product>('/products', {
    page: page + 1,
    limit: rowsPerPage,
    search: filters.search,
    category_id: filters.category_id,
    supplier_id: filters.supplier_id,
    brand: filters.brand,
    is_active: filters.status !== 'all' ? filters.status === 'active' : undefined,
    is_featured: filters.is_featured,
    in_stock_only: filters.stock_status === 'in_stock',
    low_stock_only: filters.stock_status === 'low_stock',
    price_min: filters.price_range.min > 0 ? filters.price_range.min : undefined,
    price_max: filters.price_range.max < 999999999 ? filters.price_range.max : undefined,
    sort_by: filters.sort_by,
    sort_order: filters.sort_order,
    tags: filters.tags
  });

  // Initialize component
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const statsData = await api.get<ProductStats>('/products/stats');
      setStats(statsData);
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  };

  // Event Handlers
  const handleNewProduct = () => {
    navigate('/products/new');
  };

  const handleViewDetails = (product: Product) => {
    navigate(`/products/${product.id}`);
  };

  const handleEditProduct = (product: Product) => {
    navigate(`/products/${product.id}/edit`);
  };

  const handleDeleteProduct = (productId: number) => {
    const product = products?.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;

    try {
      setLoading(true);
      await api.delete(`/products/${selectedProduct.id}`);
      enqueueSnackbar('Sản phẩm đã được xóa thành công', { variant: 'success' });
      refetchProducts();
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
    } catch (err) {
      enqueueSnackbar('Lỗi khi xóa sản phẩm', { variant: 'error' });
      console.error('Delete product error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (productId: number, isActive: boolean) => {
    try {
      setLoading(true);
      await api.put(`/products/${productId}`, { is_active: isActive });
      enqueueSnackbar(`Sản phẩm đã được ${isActive ? 'kích hoạt' : 'tạm dừng'}`, { variant: 'success' });
      refetchProducts();
    } catch (err) {
      enqueueSnackbar('Lỗi khi cập nhật trạng thái sản phẩm', { variant: 'error' });
      console.error('Toggle status error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (productId: number, isFeatured: boolean) => {
    try {
      setLoading(true);
      await api.put(`/products/${productId}`, { is_featured: isFeatured });
      enqueueSnackbar(`Sản phẩm đã được ${isFeatured ? 'đặt nổi bật' : 'bỏ nổi bật'}`, { variant: 'success' });
      refetchProducts();
    } catch (err) {
      enqueueSnackbar('Lỗi khi cập nhật sản phẩm nổi bật', { variant: 'error' });
      console.error('Toggle featured error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    navigate('/products/import');
  };

  const handleExport = () => {
    enqueueSnackbar('Chức năng xuất báo cáo sẽ được triển khai sớm', { variant: 'info' });
  };

  const handleAnalytics = () => {
    navigate('/reports/products-analytics');
  };

  const handleRefresh = () => {
    refetchProducts();
    fetchStats();
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      price_range: { min: 0, max: 999999999 },
      stock_status: 'all',
      status: 'all',
      sort_by: 'created_at',
      sort_order: 'desc'
    });
    setPage(0);
  };

  // Pagination handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (error || productsError) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || productsError}
        </Alert>
        <Button onClick={handleRefresh} variant="contained">
          Thử lại
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }} data-testid="products-list">
      <ProductsHeader
        stats={stats || defaultStats}
        onNewProduct={handleNewProduct}
        onImport={handleImport}
        onExport={handleExport}
        onRefresh={handleRefresh}
        onAnalytics={handleAnalytics}
        loading={loading || productsLoading}
      />

      <Divider sx={{ my: 3 }} />

      <ProductsFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={handleClearFilters}
        productCount={products?.length || 0}
      />

      {productsLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!productsLoading && products && (
        <>
          <ProductsTable
            products={products}
            onViewDetails={handleViewDetails}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
            onToggleStatus={handleToggleStatus}
            onToggleFeatured={handleToggleFeatured}
            loading={loading}
          />

          <TablePagination
            component="div"
            count={pagination?.total || 0}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Số dòng mỗi trang:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} của ${count !== -1 ? count : `hơn ${to}`}`
            }
          />
        </>
      )}

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add product"
          onClick={handleNewProduct}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Xác nhận xóa sản phẩm</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Bạn có chắc chắn muốn xóa sản phẩm "{selectedProduct?.name}"?
          </Alert>
          <Box sx={{ mt: 2 }}>
            <strong>Lưu ý:</strong> Hành động này không thể hoàn tác. Sản phẩm sẽ được đánh dấu là đã xóa 
            nhưng dữ liệu liên quan (lịch sử bán hàng, tồn kho) sẽ được giữ lại.
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Hủy
          </Button>
          <Button 
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={loading}
          >
            Xóa sản phẩm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Products;
