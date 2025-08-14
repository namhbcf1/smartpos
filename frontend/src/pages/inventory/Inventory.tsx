import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Tooltip,
  IconButton,
  Badge,
  LinearProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as ExportIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Warning as LowStockIcon,
  Error as OutOfStockIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Store as StoreIcon,
  Category as CategoryIcon,
  LocalShipping as SupplierIcon,
  Assignment as SerialIcon
} from '@mui/icons-material';
import api from '../../services/api';

interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  category_id: number;
  category_name: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  stock_alert_threshold: number;
  is_active: boolean;
  image_url?: string;
  created_at: string;
}

interface InventoryStats {
  total_products: number;
  total_value: number;
  low_stock_items: number;
  out_of_stock_items: number;
  categories_count: number;
  avg_stock_level: number;
}

const Inventory: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');

  useEffect(() => {
    loadProducts();
    loadStats();
  }, [page, rowsPerPage, searchTerm, categoryFilter, stockFilter]);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter !== 'all' && { category_id: categoryFilter }),
      });

      const response = await api.get<{
        success: boolean;
        data: {
          data: Product[];
          pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
          };
        };
      }>(`/products?${params}`);

      if (response.success) {
        let filteredProducts = response.data.data;

        // Apply stock filter
        if (stockFilter === 'low_stock') {
          filteredProducts = filteredProducts.filter(p =>
            p.stock_quantity <= p.stock_alert_threshold && p.stock_quantity > 0
          );
        } else if (stockFilter === 'out_of_stock') {
          filteredProducts = filteredProducts.filter(p => p.stock_quantity === 0);
        } else if (stockFilter === 'in_stock') {
          filteredProducts = filteredProducts.filter(p => p.stock_quantity > p.stock_alert_threshold);
        }

        setProducts(filteredProducts);
        setTotalCount(response.data.pagination.total);
      } else {
        setError('Không thể tải danh sách sản phẩm');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Lỗi khi tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Calculate stats from products data
      const response = await api.get<{
        success: boolean;
        data: { data: Product[] };
      }>('/products');

      if (response.success) {
        const allProducts = response.data.data;
        const totalProducts = allProducts.length;
        const totalValue = allProducts.reduce((sum, p) => sum + (p.stock_quantity * p.cost_price), 0);
        const lowStockItems = allProducts.filter(p =>
          p.stock_quantity <= p.stock_alert_threshold && p.stock_quantity > 0
        ).length;
        const outOfStockItems = allProducts.filter(p => p.stock_quantity === 0).length;
        const categories = new Set(allProducts.map(p => p.category_id)).size;
        const avgStockLevel = totalProducts > 0 ?
          allProducts.reduce((sum, p) => sum + p.stock_quantity, 0) / totalProducts : 0;

        setStats({
          total_products: totalProducts,
          total_value: totalValue,
          low_stock_items: lowStockItems,
          out_of_stock_items: outOfStockItems,
          categories_count: categories,
          avg_stock_level: Math.round(avgStockLevel)
        });
      }
    } catch (error) {
      console.error('Error loading inventory stats:', error);
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity === 0) {
      return { status: 'out_of_stock', label: 'Hết hàng', color: 'error' };
    } else if (product.stock_quantity <= product.stock_alert_threshold) {
      return { status: 'low_stock', label: 'Sắp hết', color: 'warning' };
    } else {
      return { status: 'in_stock', label: 'Còn hàng', color: 'success' };
    }
  };

  const getStockIcon = (status: string) => {
    switch (status) {
      case 'out_of_stock': return <OutOfStockIcon sx={{ color: '#f44336' }} />;
      case 'low_stock': return <LowStockIcon sx={{ color: '#FF9800' }} />;
      case 'in_stock': return <StoreIcon sx={{ color: '#4CAF50' }} />;
      default: return <InventoryIcon />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (loading && products.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Đang tải dữ liệu tồn kho...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }} data-testid="inventory-list">
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 56, height: 56 }}>
            <InventoryIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1">
              Quản lý Tồn kho
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Theo dõi và quản lý inventory sản phẩm
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              loadProducts();
              loadStats();
            }}
            disabled={loading}
          >
            Làm mới
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
          >
            Xuất Excel
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => window.location.href = '/inventory/stock-in'}
          >
            Nhập hàng
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#2196F3', mr: 2 }}>
                    <InventoryIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Tổng SP
                    </Typography>
                    <Typography variant="h6">
                      {stats.total_products.toLocaleString('vi-VN')}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#4CAF50', mr: 2 }}>
                    <TrendingUpIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Giá trị kho
                    </Typography>
                    <Typography variant="h6" fontSize="0.9rem">
                      {formatCurrency(stats.total_value)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#FF9800', mr: 2 }}>
                    <LowStockIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Sắp hết
                    </Typography>
                    <Typography variant="h6">
                      {stats.low_stock_items.toLocaleString('vi-VN')}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#f44336', mr: 2 }}>
                    <OutOfStockIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Hết hàng
                    </Typography>
                    <Typography variant="h6">
                      {stats.out_of_stock_items.toLocaleString('vi-VN')}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#9C27B0', mr: 2 }}>
                    <CategoryIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Danh mục
                    </Typography>
                    <Typography variant="h6">
                      {stats.categories_count.toLocaleString('vi-VN')}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#607D8B', mr: 2 }}>
                    <StoreIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      TB tồn kho
                    </Typography>
                    <Typography variant="h6">
                      {stats.avg_stock_level.toLocaleString('vi-VN')}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Bộ lọc tìm kiếm
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Tìm kiếm sản phẩm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, SKU, barcode..."
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Danh mục</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Danh mục"
              >
                <MenuItem value="all">Tất cả danh mục</MenuItem>
                <MenuItem value="1">Linh kiện máy tính</MenuItem>
                {/* Add more categories dynamically */}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Tình trạng kho</InputLabel>
              <Select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                label="Tình trạng kho"
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="in_stock">Còn hàng</MenuItem>
                <MenuItem value="low_stock">Sắp hết</MenuItem>
                <MenuItem value="out_of_stock">Hết hàng</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Products Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sản phẩm</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Danh mục</TableCell>
                <TableCell align="right">Giá bán</TableCell>
                <TableCell align="right">Giá vốn</TableCell>
                <TableCell align="center">Tồn kho</TableCell>
                <TableCell align="center">Trạng thái</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => {
                const stockStatus = getStockStatus(product);
                return (
                  <TableRow key={product.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 40, height: 40 }}>
                          <InventoryIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {product.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {product.barcode}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {product.sku}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={product.category_name}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(product.price)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(product.cost_price)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {product.stock_quantity.toLocaleString('vi-VN')}
                        </Typography>
                        {product.stock_quantity <= product.stock_alert_threshold && (
                          <Tooltip title={`Ngưỡng cảnh báo: ${product.stock_alert_threshold}`}>
                            <LowStockIcon color="warning" fontSize="small" />
                          </Tooltip>
                        )}
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min((product.stock_quantity / (product.stock_alert_threshold * 2)) * 100, 100)}
                        sx={{
                          mt: 1,
                          height: 4,
                          backgroundColor: '#f0f0f0',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: stockStatus.color === 'error' ? '#f44336' :
                                           stockStatus.color === 'warning' ? '#FF9800' : '#4CAF50'
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={getStockIcon(stockStatus.status)}
                        label={stockStatus.label}
                        color={stockStatus.color as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Xem chi tiết">
                          <IconButton size="small">
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Chỉnh sửa">
                          <IconButton size="small">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Serial numbers">
                          <IconButton size="small">
                            <SerialIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Số dòng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} của ${count !== -1 ? count : `hơn ${to}`}`
          }
        />
      </Paper>
    </Container>
  );
};

export default Inventory;