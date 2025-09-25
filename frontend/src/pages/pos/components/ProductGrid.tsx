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
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Inventory as StockIcon,
  ShoppingCart as CartIcon,
  Star as StarIcon,
  LocalOffer as OfferIcon
} from '@mui/icons-material';
import { formatCurrency } from '../../../config/constants';
import { Product } from './types';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onProductDetails: (product: Product) => void;
  loading: boolean;
  searchTerm: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onAddToCart,
  onProductDetails,
  loading,
  searchTerm
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
        <mark key={index} style={{ backgroundColor: theme.palette.warning.light }}>
          {part}
        </mark>
      ) : part
    );
  };

  if (loading) {
    return (
      <Grid container spacing={2}>
        {Array.from({ length: 8 }).map((_, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index} component="div">
            <Card sx={{ height: '100%' }}>
              <Box sx={{ height: 140, bgcolor: 'grey.200' }} />
              <CardContent>
                <Box sx={{ height: 60, bgcolor: 'grey.100', mb: 1 }} />
                <Box sx={{ height: 20, bgcolor: 'grey.100', mb: 1 }} />
                <Box sx={{ height: 36, bgcolor: 'grey.100' }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  // Defensive check: ensure products is an array
  if (!Array.isArray(products) || products.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8,
          textAlign: 'center'
        }}
      >
        <Avatar sx={{ width: 64, height: 64, bgcolor: 'grey.300', mb: 2 }}>
          <CartIcon sx={{ fontSize: 32 }} />
        </Avatar>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Không tìm thấy sản phẩm
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {searchTerm ? `Không có sản phẩm nào phù hợp với "${searchTerm}"` : 'Danh sách sản phẩm trống'}
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {Array.isArray(products) && products.map((product) => {
        const stockStatus = getStockStatus(product.stock, product.min_stock);
        const isOutOfStock = product.stock <= 0;
        
        return (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product.id} component="div">
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

                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <StockIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {product.stock} {product.unit}
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
};
