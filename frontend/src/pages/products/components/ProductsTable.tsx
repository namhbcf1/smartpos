import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Box,
  Typography,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Stack,
  Button,
  Avatar,
  CardMedia
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Inventory as StockIcon,
  Star as FeaturedIcon,
  Warning as WarningIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  ShoppingCart as CartIcon
} from '@mui/icons-material';
import { formatCurrency } from '../../../config/constants';
import { Product } from './types';
import { usePermissions } from '../../../hooks/usePermissions';

interface ProductsTableProps {
  products: Product[];
  onViewDetails: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: number) => void;
  onToggleStatus: (productId: number, isActive: boolean) => void;
  onToggleFeatured: (productId: number, isFeatured: boolean) => void;
  loading: boolean;
}

export const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
  onViewDetails,
  onEditProduct,
  onDeleteProduct,
  onToggleStatus,
  onToggleFeatured,
  loading
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const { canEditProducts, canDeleteProducts, isProductsReadOnly } = usePermissions();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, product: Product) => {
    setAnchorEl(event.currentTarget);
    setSelectedProduct(product);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProduct(null);
  };

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity <= 0) {
      return { label: 'Hết hàng', color: 'error' as const, icon: <WarningIcon /> };
    }
    if (product.stock_quantity <= product.min_stock_level) {
      return { label: 'Sắp hết', color: 'warning' as const, icon: <WarningIcon /> };
    }
    return { label: 'Còn hàng', color: 'success' as const, icon: <StockIcon /> };
  };

  const getProfitMargin = (product: Product) => {
    if (!product.cost_price || product.cost_price === 0) return 0;
    return ((product.price - product.cost_price) / product.cost_price) * 100;
  };

  if (isMobile) {
    // Mobile card layout
    return (
      <Box>
        {products.map((product) => {
          const stockStatus = getStockStatus(product);
          const profitMargin = getProfitMargin(product);
          
          return (
            <Card key={product.id} sx={{ mb: 2 }}>
              <Stack direction="row" spacing={2}>
                {/* Product Image */}
                <CardMedia
                  component="img"
                  sx={{ width: 80, height: 80, objectFit: 'cover' }}
                  image={product.image_url || '/placeholder-product.jpg'}
                  alt={product.name}
                />
                
                <CardContent sx={{ flex: 1, py: 1 }}>
                  <Stack spacing={1}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {product.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          SKU: {product.sku}
                        </Typography>
                      </Box>
                      
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, product)}
                        size="small"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>

                    {/* Category & Brand */}
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {product.category_name && (
                        <Chip label={product.category_name} size="small" variant="outlined" />
                      )}
                      {product.brand && (
                        <Chip label={product.brand} size="small" variant="outlined" />
                      )}
                    </Stack>

                    {/* Price & Stock */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Giá bán
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="primary">
                          {formatCurrency(product.price)}
                        </Typography>
                        {profitMargin > 0 && (
                          <Typography variant="caption" color="success.main">
                            Lãi: {profitMargin.toFixed(1)}%
                          </Typography>
                        )}
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Tồn kho
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {product.stock_quantity} {product.unit}
                        </Typography>
                        <Chip
                          icon={stockStatus.icon}
                          label={stockStatus.label}
                          color={stockStatus.color}
                          size="small"
                        />
                      </Box>
                    </Box>

                    {/* Status & Features */}
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        icon={product.is_active ? <ActiveIcon /> : <InactiveIcon />}
                        label={product.is_active ? 'Hoạt động' : 'Tạm dừng'}
                        color={product.is_active ? 'success' : 'default'}
                        size="small"
                      />
                      
                      {product.is_featured && (
                        <Chip
                          icon={<FeaturedIcon />}
                          label="Nổi bật"
                          color="warning"
                          size="small"
                        />
                      )}
                    </Stack>

                    {/* Actions */}
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => onViewDetails(product)}
                        fullWidth
                      >
                        Xem chi tiết
                      </Button>
                      {canEditProducts && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => onEditProduct(product)}
                          fullWidth
                        >
                          Chỉnh sửa
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Stack>
            </Card>
          );
        })}
      </Box>
    );
  }

  // Desktop table layout
  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Sản phẩm</TableCell>
              <TableCell>Danh mục</TableCell>
              <TableCell align="right">Giá bán</TableCell>
              <TableCell align="right">Giá vốn</TableCell>
              <TableCell align="center">Tồn kho</TableCell>
              <TableCell align="center">Trạng thái</TableCell>
              <TableCell align="center">Bán được</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => {
              const stockStatus = getStockStatus(product);
              const profitMargin = getProfitMargin(product);
              
              return (
                <TableRow key={product.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar
                        src={product.image_url}
                        alt={product.name}
                        sx={{ width: 40, height: 40 }}
                        variant="rounded"
                      >
                        <CartIcon />
                      </Avatar>
                      
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {product.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          SKU: {product.sku}
                        </Typography>
                        {product.brand && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {product.brand}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {product.category_name || 'Chưa phân loại'}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {formatCurrency(product.price)}
                    </Typography>
                    {profitMargin > 0 && (
                      <Typography variant="caption" color="success.main">
                        +{profitMargin.toFixed(1)}%
                      </Typography>
                    )}
                  </TableCell>
                  
                  <TableCell align="right">
                    <Typography variant="body2">
                      {product.cost_price ? formatCurrency(product.cost_price) : 'N/A'}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {product.stock_quantity} {product.unit}
                      </Typography>
                      <Chip
                        icon={stockStatus.icon}
                        label={stockStatus.label}
                        color={stockStatus.color}
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Stack spacing={0.5} alignItems="center">
                      <Chip
                        icon={product.is_active ? <ActiveIcon /> : <InactiveIcon />}
                        label={product.is_active ? 'Hoạt động' : 'Tạm dừng'}
                        color={product.is_active ? 'success' : 'default'}
                        size="small"
                      />
                      
                      {product.is_featured && (
                        <Chip
                          icon={<FeaturedIcon />}
                          label="Nổi bật"
                          color="warning"
                          size="small"
                        />
                      )}
                    </Stack>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="medium">
                      {product.total_sold || 0}
                    </Typography>
                    {product.revenue_generated && (
                      <Typography variant="caption" color="text.secondary">
                        {formatCurrency(product.revenue_generated)}
                      </Typography>
                    )}
                  </TableCell>
                  
                  <TableCell align="center">
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, product)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedProduct) onViewDetails(selectedProduct);
          handleMenuClose();
        }}>
          <ViewIcon sx={{ mr: 1 }} />
          Xem chi tiết
        </MenuItem>

        {canEditProducts && (
          <MenuItem onClick={() => {
            if (selectedProduct) onEditProduct(selectedProduct);
            handleMenuClose();
          }}>
            <EditIcon sx={{ mr: 1 }} />
            Chỉnh sửa
          </MenuItem>
        )}

        {canEditProducts && (
          <MenuItem onClick={() => {
            if (selectedProduct) onToggleStatus(selectedProduct.id, !selectedProduct.is_active);
            handleMenuClose();
          }}>
            {selectedProduct?.is_active ? <InactiveIcon sx={{ mr: 1 }} /> : <ActiveIcon sx={{ mr: 1 }} />}
            {selectedProduct?.is_active ? 'Tạm dừng' : 'Kích hoạt'}
          </MenuItem>
        )}

        {canEditProducts && (
          <MenuItem onClick={() => {
            if (selectedProduct) onToggleFeatured(selectedProduct.id, !selectedProduct.is_featured);
            handleMenuClose();
          }}>
            <FeaturedIcon sx={{ mr: 1 }} />
            {selectedProduct?.is_featured ? 'Bỏ nổi bật' : 'Đặt nổi bật'}
          </MenuItem>
        )}

        {canDeleteProducts && (
          <MenuItem
            onClick={() => {
              if (selectedProduct) onDeleteProduct(selectedProduct.id);
              handleMenuClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon sx={{ mr: 1 }} />
            Xóa sản phẩm
          </MenuItem>
        )}
      </Menu>
    </>
  );
};
