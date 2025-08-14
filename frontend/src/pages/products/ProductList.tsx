import React, { useState, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  Link,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Typography,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Image as ImageIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Warning as AlertIcon
} from '@mui/icons-material';
import { usePaginatedQuery, useDeleteMutation } from '../../hooks/useApiData';
import { formatCurrency } from '../../utils/format';

// Kiểu dữ liệu sản phẩm
interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  categoryId: number;
  categoryName: string;
  price: number;
  costPrice: number;
  taxRate: number;
  stockQuantity: number;
  stockAlertThreshold: number;
  isActive: boolean;
  imageUrl: string | null;
}

const ProductList: React.FC = () => {
  // State để lưu các tham số filter
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState<boolean | ''>('');
  const [lowStockFilter, setLowStockFilter] = useState<boolean>(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  // Thiết lập debounce cho search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch danh sách danh mục để dùng cho filter
  const { data: categories = [] } = usePaginatedQuery<{ id: number; name: string }>('/categories', {
    limit: 100,
    is_active: true
  });

  // Tham số query
  const queryParams = useMemo(() => ({
    search: debouncedSearchTerm,
    category_id: categoryFilter || undefined,
    is_active: statusFilter === '' ? undefined : statusFilter,
    low_stock: lowStockFilter || undefined,
    sortBy: 'name',
    sortDirection: 'asc' as 'asc' | 'desc'
  }), [debouncedSearchTerm, categoryFilter, statusFilter, lowStockFilter]);

  // Fetch danh sách sản phẩm với phân trang
  const {
    data: products,
    pagination,
    isLoading,
    refetch,
    handlePageChange,
    handleLimitChange,
    page,
    limit
  } = usePaginatedQuery<Product>('/products', queryParams);

  // Mutation xóa sản phẩm
  const { deleteItem: deleteProduct, loading: deleteLoading, error: deleteError } = useDeleteMutation();

  // Xác nhận xóa sản phẩm
  const handleOpenDeleteDialog = (productId: number) => {
    setSelectedProductId(productId);
    setOpenDialog(true);
  };

  const handleDeleteProduct = async () => {
    if (selectedProductId) {
      const success = await deleteProduct(`/products/${selectedProductId}`);
      if (success) {
        refetch();
        setOpenDialog(false);
      }
    }
  };

  // Reset các filter
  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setCategoryFilter('');
    setStatusFilter('');
    setLowStockFilter(false);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Grid item>
            <Typography variant="h4" gutterBottom>
              Danh sách sản phẩm
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              component={RouterLink}
              to="/products/new"
            >
              Thêm sản phẩm
            </Button>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Tìm kiếm"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small" variant="outlined">
                <InputLabel id="category-filter-label">Danh mục</InputLabel>
                <Select
                  labelId="category-filter-label"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as number | '')}
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
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth size="small" variant="outlined">
                <InputLabel id="status-filter-label">Trạng thái</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as boolean | '')}
                  label="Trạng thái"
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value={true}>Hoạt động</MenuItem>
                  <MenuItem value={false}>Không hoạt động</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={1}>
              <FormControl fullWidth>
                <Tooltip title="Chỉ hiển thị hàng tồn kho thấp">
                  <Chip
                    icon={<AlertIcon />}
                    label="Tồn thấp"
                    clickable
                    color={lowStockFilter ? "warning" : "default"}
                    onClick={() => setLowStockFilter(!lowStockFilter)}
                  />
                </Tooltip>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Grid container spacing={1}>
                <Grid item>
                  <Tooltip title="Làm mới">
                    <IconButton onClick={() => refetch()}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                </Grid>
                <Grid item>
                  <Tooltip title="Xóa bộ lọc">
                    <IconButton onClick={handleResetFilters}>
                      <FilterIcon />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Paper>

        {/* Products Table */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Hình ảnh</TableCell>
                    <TableCell>Tên sản phẩm</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell>Danh mục</TableCell>
                    <TableCell>Giá bán</TableCell>
                    <TableCell>Tồn kho</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell align="center">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading ? (
                    Array.from(Array(limit)).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><Skeleton variant="rectangular" width={40} height={40} /></TableCell>
                        <TableCell><Skeleton variant="text" /></TableCell>
                        <TableCell><Skeleton variant="text" /></TableCell>
                        <TableCell><Skeleton variant="text" /></TableCell>
                        <TableCell><Skeleton variant="text" /></TableCell>
                        <TableCell><Skeleton variant="text" /></TableCell>
                        <TableCell><Skeleton variant="circular" width={80} height={24} /></TableCell>
                        <TableCell><Skeleton variant="rectangular" width={80} height={32} /></TableCell>
                      </TableRow>
                    ))
                  ) : products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body2" sx={{ py: 2 }}>
                          Không tìm thấy sản phẩm nào
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
                      <TableRow key={product.id} hover>
                        <TableCell>
                          {product.imageUrl ? (
                            <Box
                              component="img"
                              src={product.imageUrl}
                              alt={product.name}
                              sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 1 }}
                            />
                          ) : (
                            <ImageIcon color="disabled" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Link component={RouterLink} to={`/products/${product.id}`} underline="hover">
                            {product.name}
                          </Link>
                        </TableCell>
                        <TableCell>{product.sku}</TableCell>
                        <TableCell>{product.categoryName}</TableCell>
                        <TableCell>{formatCurrency(product.price)}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Typography variant="body2">{product.stockQuantity}</Typography>
                            {product.stockQuantity <= product.stockAlertThreshold && (
                              <Tooltip title="Tồn kho thấp">
                                <AlertIcon fontSize="small" color="warning" sx={{ ml: 1 }} />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {product.isActive ? (
                            <Chip
                              size="small"
                              icon={<ActiveIcon fontSize="small" />}
                              label="Hoạt động"
                              color="success"
                            />
                          ) : (
                            <Chip
                              size="small"
                              icon={<InactiveIcon fontSize="small" />}
                              label="Không hoạt động"
                              color="default"
                            />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Sửa">
                            <IconButton
                              component={RouterLink}
                              to={`/products/${product.id}/edit`}
                              size="small"
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleOpenDeleteDialog(product.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {pagination && (
              <TablePagination
                component="div"
                count={pagination.total}
                page={page - 1}
                rowsPerPage={limit}
                onPageChange={(_, newPage) => handlePageChange(newPage + 1)}
                onRowsPerPageChange={(e) => handleLimitChange(parseInt(e.target.value, 10))}
                labelRowsPerPage="Hiển thị:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count}`}
                rowsPerPageOptions={[10, 25, 50, 100]}
              />
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      >
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xóa sản phẩm này không? Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button
            onClick={handleDeleteProduct}
            color="error"
            variant="contained"
            disabled={deleteProduct.isPending}
          >
            {deleteProduct.isPending ? 'Đang xử lý...' : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProductList; 