import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  InputAdornment,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Inventory,
  Add,
  Edit,
  Delete,
  Search,
  Refresh,
  Warning,
  CheckCircle,
  Error,
  TrendingUp,
  TrendingDown,
  LocalShipping,
  Store,
  Category,
  Assessment,
  FilterList,
  Download,
  Upload,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsAPI, inventoryAPI, categoriesAPI } from '../../services/api';

// Inventory Card Component
interface InventoryCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  loading?: boolean;
}

const InventoryCard: React.FC<InventoryCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color,
  loading = false,
}) => {
  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <LinearProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Đang tải...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold">
              {value}
            </Typography>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {trend.isPositive ? (
                  <TrendingUp sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                ) : (
                  <TrendingDown sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
                )}
                <Typography
                  variant="body2"
                  color={trend.isPositive ? 'success.main' : 'error.main'}
                  fontWeight="medium"
                >
                  {Math.abs(trend.value)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Icon sx={{ fontSize: 40, color: `${color}.main` }} />
        </Box>
      </CardContent>
    </Card>
  );
};

// Low Stock Alert Component
const LowStockAlerts: React.FC = () => {
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products-low-stock'],
    queryFn: () => productsAPI.getProducts(1, 100),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Cảnh báo tồn kho thấp
          </Typography>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  const products = productsData?.data?.products || [];
  const lowStockProducts = products.filter((product: any) => 
    product.stock <= product.min_stock && product.stock > 0
  );
  const outOfStockProducts = products.filter((product: any) => product.stock === 0);

  const alerts = [
    ...lowStockProducts.slice(0, 3).map((product: any) => ({
      type: 'warning',
      icon: Warning,
      title: 'Tồn kho thấp',
      message: `${product.name} - Còn ${product.stock} sản phẩm`,
      productId: product.id,
    })),
    ...outOfStockProducts.slice(0, 2).map((product: any) => ({
      type: 'error',
      icon: Error,
      title: 'Hết hàng',
      message: `${product.name} - Đã hết hàng`,
      productId: product.id,
    })),
  ];

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning': return 'warning.main';
      case 'error': return 'error.main';
      default: return 'info.main';
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Cảnh báo tồn kho
        </Typography>
        {alerts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Tất cả sản phẩm đều có đủ tồn kho
            </Typography>
          </Box>
        ) : (
          <List>
            {alerts.map((alert, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <alert.icon sx={{ color: getAlertColor(alert.type) }} />
                </ListItemIcon>
                <ListItemText
                  primary={alert.title}
                  secondary={alert.message}
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

// Stock Movement Component
const StockMovements: React.FC = () => {
  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ['inventory-movements'],
    queryFn: () => inventoryAPI.getInventory(1, 10),
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Chuyển động tồn kho
          </Typography>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  const movements = inventoryData?.data?.movements || [];

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'in': return 'success';
      case 'out': return 'error';
      case 'adjustment': return 'warning';
      default: return 'default';
    }
  };

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'in': return 'Nhập kho';
      case 'out': return 'Xuất kho';
      case 'adjustment': return 'Điều chỉnh';
      default: return type;
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Chuyển động tồn kho gần đây
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Sản phẩm</TableCell>
                <TableCell>Loại</TableCell>
                <TableCell align="right">Số lượng</TableCell>
                <TableCell>Ngày</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movements.slice(0, 5).map((movement: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {movement.product_name || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getMovementTypeLabel(movement.transaction_type)}
                      size="small"
                      color={getMovementTypeColor(movement.transaction_type) as any}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium">
                      {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(movement.created_at)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

// Stock Adjustment Dialog Component
interface StockAdjustmentDialogProps {
  open: boolean;
  onClose: () => void;
  product?: any;
}

const StockAdjustmentDialog: React.FC<StockAdjustmentDialogProps> = ({
  open,
  onClose,
  product,
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    quantity: 0,
    type: 'adjustment',
    reason: '',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (product) {
      setFormData({
        quantity: product.stock || 0,
        type: 'adjustment',
        reason: '',
        notes: '',
      });
    } else {
      setFormData({
        quantity: 0,
        type: 'adjustment',
        reason: '',
        notes: '',
      });
    }
    setError(null);
  }, [product, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? Number(value) : value,
    }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateStockMutation = useMutation({
    mutationFn: ({ productId, quantity, type }: { productId: string; quantity: number; type: string }) =>
      inventoryAPI.updateStock(productId, quantity, type as 'add' | 'remove'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to update stock');
    },
  });

  const handleSubmit = () => {
    setError(null);
    if (product) {
      updateStockMutation.mutate({
        productId: product.id,
        quantity: formData.quantity,
        type: formData.type,
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Điều chỉnh tồn kho - {product?.name}
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              autoFocus
              margin="dense"
              name="quantity"
              label="Số lượng"
              type="number"
              fullWidth
              variant="outlined"
              value={formData.quantity}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth margin="dense">
              <InputLabel>Loại điều chỉnh</InputLabel>
              <Select
                name="type"
                value={formData.type}
                label="Loại điều chỉnh"
                onChange={handleSelectChange}
              >
                <MenuItem value="add">Thêm vào kho</MenuItem>
                <MenuItem value="remove">Xuất khỏi kho</MenuItem>
                <MenuItem value="adjustment">Điều chỉnh</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              margin="dense"
              name="reason"
              label="Lý do"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.reason}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              margin="dense"
              name="notes"
              label="Ghi chú"
              type="text"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={formData.notes}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={updateStockMutation.isPending}
        >
          Cập nhật
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Main Inventory Management Component
const InventoryManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [openAdjustmentDialog, setOpenAdjustmentDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Fetch products
  const { data: productsData, isLoading, error, refetch } = useQuery({
    queryKey: ['products-inventory', page, pageSize, searchQuery, categoryFilter],
    queryFn: () => productsAPI.getProducts(page, pageSize, searchQuery),
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getCategories(1, 100),
  });

  const products = productsData?.data?.products || [];
  const pagination = productsData?.data?.pagination;
  const categories = categoriesData?.data?.categories || [];

  // Filter products by stock status
  const filteredProducts = products.filter((product: any) => {
    if (stockFilter === 'low') return product.stock <= product.min_stock && product.stock > 0;
    if (stockFilter === 'out') return product.stock === 0;
    if (stockFilter === 'normal') return product.stock > product.min_stock;
    return true;
  });

  // Calculate inventory statistics
  const totalProducts = pagination?.total || 0;
  const totalStockValue = products.reduce((sum: number, product: any) => 
    sum + (product.stock * product.price), 0
  );
  const lowStockCount = products.filter((p: any) => p.stock <= p.min_stock && p.stock > 0).length;
  const outOfStockCount = products.filter((p: any) => p.stock === 0).length;

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(cents);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(1);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleAdjustStock = (product: any) => {
    setSelectedProduct(product);
    setOpenAdjustmentDialog(true);
  };

  const handleExport = () => {
    console.log('Exporting inventory data...');
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Quản lý tồn kho
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Theo dõi và quản lý tồn kho sản phẩm
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExport}
            >
              Xuất báo cáo
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
            >
              Làm mới
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Không thể tải dữ liệu tồn kho. Vui lòng kiểm tra kết nối mạng.
        </Alert>
      )}

      {/* Inventory Statistics Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
          <InventoryCard
            title="Tổng sản phẩm"
            value={totalProducts}
            icon={Inventory}
            trend={{
              value: 5.2,
              isPositive: true,
            }}
            color="primary"
            loading={isLoading}
          />
        </Box>
        <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
          <InventoryCard
            title="Giá trị tồn kho"
            value={formatCurrency(totalStockValue)}
            icon={Assessment}
            trend={{
              value: 8.1,
              isPositive: true,
            }}
            color="success"
            loading={isLoading}
          />
        </Box>
        <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
          <InventoryCard
            title="Tồn kho thấp"
            value={lowStockCount}
            icon={Warning}
            trend={{
              value: 2.3,
              isPositive: false,
            }}
            color="warning"
            loading={isLoading}
          />
        </Box>
        <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
          <InventoryCard
            title="Hết hàng"
            value={outOfStockCount}
            icon={Error}
            trend={{
              value: 1.5,
              isPositive: false,
            }}
            color="error"
            loading={isLoading}
          />
        </Box>
      </Box>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 250 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Danh mục</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Danh mục"
              >
                <MenuItem value="">Tất cả</MenuItem>
                {categories.map((category: any) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Trạng thái tồn kho</InputLabel>
              <Select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                label="Trạng thái tồn kho"
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="normal">Bình thường</MenuItem>
                <MenuItem value="low">Tồn kho thấp</MenuItem>
                <MenuItem value="out">Hết hàng</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Danh sách sản phẩm
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Sản phẩm</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell align="right">Tồn kho</TableCell>
                  <TableCell align="right">Tồn kho tối thiểu</TableCell>
                  <TableCell align="right">Giá</TableCell>
                  <TableCell align="center">Trạng thái</TableCell>
                  <TableCell align="center">Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.map((product: any) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          src={product.image_url}
                          sx={{ width: 32, height: 32 }}
                        >
                          <Inventory />
                        </Avatar>
                        <Typography variant="body2" fontWeight="medium">
                          {product.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {product.sku || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {product.stock}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {product.min_stock}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(product.price_cents || 0)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={
                          product.stock === 0
                            ? 'Hết hàng'
                            : product.stock <= product.min_stock
                            ? 'Tồn kho thấp'
                            : 'Bình thường'
                        }
                        size="small"
                        color={
                          product.stock === 0
                            ? 'error'
                            : product.stock <= product.min_stock
                            ? 'warning'
                            : 'success'
                        }
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Điều chỉnh tồn kho">
                        <IconButton
                          size="small"
                          onClick={() => handleAdjustStock(product)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Alerts and Movements */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: '1 1 100%', maxWidth: { lg: 'calc(50% - 8px)' } }}>
          <LowStockAlerts />
        </Box>
        <Box sx={{ flex: '1 1 100%', maxWidth: { lg: 'calc(50% - 8px)' } }}>
          <StockMovements />
        </Box>
      </Box>

      {/* Stock Adjustment Dialog */}
      <StockAdjustmentDialog
        open={openAdjustmentDialog}
        onClose={() => setOpenAdjustmentDialog(false)}
        product={selectedProduct}
      />
    </Box>
  );
};

export default InventoryManagement;