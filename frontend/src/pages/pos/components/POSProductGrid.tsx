import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  useTheme,
  useMediaQuery,
  Avatar,
  Skeleton,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Inventory as StockIcon,
  ShoppingCart as CartIcon,
  Star as StarIcon,
  LocalOffer as OfferIcon
} from '@mui/icons-material';
import { formatCurrency } from '../../../config/constants';
import { Product } from '../../hooks/useProducts';

interface POSProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onProductDetails: (product: Product) => void;
  loading: boolean;
  searchTerm: string;
}



export const POSProductGrid: React.FC<POSProductGridProps> = React.memo(({
  products,
  onAddToCart,
  onProductDetails,
  loading,
  searchTerm
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Debug log - only in development and limited
  if (process.env.NODE_ENV === 'development' && Math.random() < 0.01) {
    console.log('🎯 POSProductGrid received:', {
      productsLength: products?.length,
      loading,
      searchTerm: searchTerm ? `"${searchTerm}"` : 'none'
    });
  }

  const getStockStatus = (stock: number, minLevel: number = 10) => {
    if (stock <= 0) return { label: 'Hết hàng', color: 'error' as const };
    if (stock <= minLevel) return { label: 'Sắp hết', color: 'warning' as const };
    return { label: 'Còn hàng', color: 'success' as const };
  };

  const highlightSearchTerm = (text: string, term: string) => {
    if (!term) return text;

    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} style={{
          backgroundColor: theme.palette.warning.light,
          borderRadius: '4px',
          padding: '2px 4px'
        }}>
          {part}
        </mark>
      ) : part
    );
  };

  // Enhanced loading skeleton
  if (loading) {
    return (
      <Grid container spacing={2}>
        {Array.from({ length: 8 }).map((_, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Skeleton
                variant="rectangular"
                height={140}
                animation="wave"
                sx={{ borderRadius: '4px 4px 0 0' }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Skeleton variant="text" height={28} width="80%" sx={{ mb: 1 }} />
                <Skeleton variant="text" height={20} width="60%" sx={{ mb: 1 }} />
                <Skeleton variant="text" height={20} width="40%" sx={{ mb: 2 }} />
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <Skeleton variant="circular" width={20} height={20} />
                  <Skeleton variant="text" height={20} width="50%" />
                </Stack>
                <Skeleton variant="text" height={32} width="70%" sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" height={36} width="100%" />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  // Defensive check: ensure products is an array
  if (!Array.isArray(products)) {
    console.error('Products is not an array:', products);
    return (
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8,
          px: 4,
          textAlign: 'center',
          bgcolor: 'error.light',
          borderRadius: 2
        }}
      >
        <Typography variant="h6" color="error.main" gutterBottom>
          Lỗi dữ liệu sản phẩm
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Dữ liệu không đúng định dạng. Vui lòng kiểm tra API.
        </Typography>
      </Paper>
    );
  }

  // Show empty state when no products
  if (products.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8,
          px: 4,
          textAlign: 'center',
          bgcolor: 'grey.50',
          borderRadius: 2,
          border: '2px dashed',
          borderColor: 'grey.300'
        }}
      >
        <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.light', mb: 3 }}>
          <CartIcon sx={{ fontSize: 40 }} />
        </Avatar>
        <Typography variant="h5" color="text.primary" gutterBottom fontWeight="bold">
          {searchTerm ? 'Không tìm thấy sản phẩm' : 'Chưa có sản phẩm'}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {searchTerm
            ? `Không có sản phẩm nào phù hợp với từ khóa "${searchTerm}"`
            : 'Danh sách sản phẩm trống. Vui lòng kiểm tra kết nối API.'
          }
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {searchTerm
            ? 'Hãy thử tìm kiếm với từ khóa khác hoặc kiểm tra lại chính tả'
            : 'Kiểm tra kết nối đến Cloudflare D1 database'
          }
        </Typography>
      </Paper>
    );
  }

  return (
    <Grid container spacing={2}>
      {products.map((product) => {
        const stockStatus = getStockStatus(product.stock, product.min_stock);
        const isOutOfStock = product.stock <= 0;
        
        return (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                opacity: isOutOfStock ? 0.7 : 1,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[4]
                }
              }}
            >
              {/* Product Image */}
              <Box sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="140"
                  image={product.image_url || '/placeholder-product.jpg'}
                  alt={product.name}
                  sx={{ 
                    objectFit: 'cover',
                    cursor: 'pointer'
                  }}
                  onClick={() => onProductDetails(product)}
                />
                
                {/* Stock Status Badge */}
                <Chip
                  label={stockStatus.label}
                  color={stockStatus.color}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    fontWeight: 'bold'
                  }}
                />

                {/* Discount Badge */}
                {product.discount_eligible && (
                  <Chip
                    icon={<OfferIcon />}
                    label="Giảm giá"
                    color="secondary"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      fontWeight: 'bold'
                    }}
                  />
                )}
              </Box>

              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Product Info */}
                <Box sx={{ flexGrow: 1 }}>
                  <Typography 
                    variant="subtitle1" 
                    fontWeight="bold" 
                    gutterBottom
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { color: 'primary.main' }
                    }}
                    onClick={() => onProductDetails(product)}
                  >
                    {highlightSearchTerm(product.name, searchTerm)}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    SKU: {product.sku}
                  </Typography>
                  
                  {product.category_name && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {product.category_name}
                    </Typography>
                  )}

                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                    <StockIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {product.stock} có sẵn
                    </Typography>
                  </Stack>
                </Box>

                {/* Price and Actions */}
                <Box>
                  <Typography 
                    variant="h6" 
                    color="primary" 
                    fontWeight="bold" 
                    gutterBottom
                  >
                    {formatCurrency(product.price)}
                  </Typography>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => onAddToCart(product)}
                      disabled={isOutOfStock}
                      fullWidth
                      size={isMobile ? "small" : "medium"}
                    >
                      {isOutOfStock ? 'Hết hàng' : 'Thêm'}
                    </Button>
                    
                    <Tooltip title="Chi tiết sản phẩm">
                      <IconButton
                        onClick={() => onProductDetails(product)}
                        color="primary"
                        size="small"
                      >
                        <StarIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
});
