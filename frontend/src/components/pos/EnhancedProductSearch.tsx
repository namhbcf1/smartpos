import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  Autocomplete,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Grid,
  InputAdornment,
  IconButton,
  Fade,
  Zoom,
  useTheme,
  alpha,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  QrCodeScanner as ScannerIcon,
  FilterList as FilterIcon,
  Inventory as InventoryIcon,
  ShoppingCart as CartIcon,
  TrendingUp as TrendingIcon,
  Star as StarIcon
} from '@mui/icons-material';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  stock: number;
  category: string;
  brand: string;
  image?: string;
  isPopular?: boolean;
  rating?: number;
  salesCount?: number;
}

interface EnhancedProductSearchProps {
  products: Product[];
  onProductSelect: (product: Product) => void;
  onScanBarcode?: () => void;
  placeholder?: string;
  showFilters?: boolean;
  recentProducts?: Product[];
  popularProducts?: Product[];
  loading?: boolean;
}

export default function EnhancedProductSearch({
  products,
  onProductSelect,
  onScanBarcode,
  placeholder = "Tìm sản phẩm theo tên, SKU hoặc mã vạch...",
  showFilters = true,
  recentProducts = [],
  popularProducts = [],
  loading = false
}: EnhancedProductSearchProps) {
  const theme = useTheme();
  const [searchValue, setSearchValue] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  // Debounced search function
  const debounceSearch = useCallback(
    (searchTerm: string) => {
      const timer = setTimeout(() => {
        if (searchTerm.length > 0) {
          const filtered = products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.brand.toLowerCase().includes(searchTerm.toLowerCase())
          );
          setFilteredProducts(filtered);
        } else {
          setFilteredProducts([]);
        }
      }, 300);

      return () => clearTimeout(timer);
    },
    [products]
  );

  useEffect(() => {
    const cleanup = debounceSearch(searchValue);
    return cleanup;
  }, [searchValue, debounceSearch]);

  // Get categories for filtering
  const categories = Array.from(new Set(products.map(p => p.category)));

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Product option renderer
  const renderProductOption = (props: any, product: Product) => (
    <Box
      component="li"
      {...props}
      sx={{
        p: 2,
        borderBottom: '1px solid #f0f0f0',
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, 0.05)
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
        <Avatar
          sx={{
            bgcolor: product.stock > 0 ? 'success.main' : 'error.main',
            width: 48,
            height: 48
          }}
        >
          <InventoryIcon />
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="body1" fontWeight="600" sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {product.name}
            </Typography>
            {product.isPopular && (
              <Chip
                size="small"
                label="Phổ biến"
                color="warning"
                icon={<StarIcon />}
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            )}
          </Box>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            SKU: {product.sku} | {product.category}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" color="primary" fontWeight="bold">
              {formatCurrency(product.price)}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                size="small"
                label={`Còn: ${product.stock}`}
                color={product.stock > 10 ? 'success' : product.stock > 0 ? 'warning' : 'error'}
                variant="outlined"
              />
              {product.salesCount && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrendingIcon sx={{ fontSize: 14, color: 'success.main' }} />
                  <Typography variant="caption" color="success.main">
                    {product.salesCount}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  // Quick suggestions component
  const QuickSuggestions = () => (
    <Fade in={searchValue.length === 0 && isOpen}>
      <Box sx={{ p: 2 }}>
        {recentProducts.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight="600" color="text.secondary" gutterBottom>
              🕒 Sản phẩm gần đây
            </Typography>
            <Grid container spacing={1}>
              {recentProducts.slice(0, 3).map((product) => (
                <Grid item xs={12} key={product.id}>
                  <Card
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        borderColor: 'primary.main'
                      }
                    }}
                    onClick={() => onProductSelect(product)}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          <InventoryIcon fontSize="small" />
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight="500" noWrap>
                            {product.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatCurrency(product.price)}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {popularProducts.length > 0 && (
          <Box>
            <Typography variant="body2" fontWeight="600" color="text.secondary" gutterBottom>
              🔥 Sản phẩm phổ biến
            </Typography>
            <Grid container spacing={1}>
              {popularProducts.slice(0, 3).map((product) => (
                <Grid item xs={12} key={product.id}>
                  <Card
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.warning.main, 0.05),
                        borderColor: 'warning.main'
                      }
                    }}
                    onClick={() => onProductSelect(product)}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'warning.main' }}>
                          <StarIcon fontSize="small" />
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight="500" noWrap>
                            {product.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatCurrency(product.price)} • Bán {product.salesCount}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>
    </Fade>
  );

  return (
    <Box sx={{ position: 'relative' }}>
      <Autocomplete
        freeSolo
        open={isOpen}
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
        options={filteredProducts}
        getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
        loading={loading}
        filterOptions={(options) => options} // We handle filtering manually
        renderOption={renderProductOption}
        onInputChange={(_, value) => setSearchValue(value)}
        onChange={(_, value) => {
          if (value && typeof value !== 'string') {
            onProductSelect(value);
            setSearchValue('');
            setIsOpen(false);
          }
        }}
        ListboxProps={{
          style: { maxHeight: '400px' }
        }}
        PaperComponent={({ children, ...props }) => (
          <Box
            {...props}
            sx={{
              borderRadius: 2,
              border: '1px solid #e0e0e0',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              overflow: 'hidden'
            }}
          >
            {searchValue.length === 0 ? <QuickSuggestions /> : children}
          </Box>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={placeholder}
            variant="outlined"
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                bgcolor: 'white',
                '&:hover': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main'
                  }
                }
              }
            }}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {loading && <CircularProgress size={20} />}
                    {onScanBarcode && (
                      <IconButton
                        size="small"
                        onClick={onScanBarcode}
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.2)
                          }
                        }}
                      >
                        <ScannerIcon fontSize="small" color="primary" />
                      </IconButton>
                    )}
                    {showFilters && (
                      <IconButton
                        size="small"
                        sx={{
                          bgcolor: alpha(theme.palette.secondary.main, 0.1),
                          '&:hover': {
                            bgcolor: alpha(theme.palette.secondary.main, 0.2)
                          }
                        }}
                      >
                        <FilterIcon fontSize="small" color="secondary" />
                      </IconButton>
                    )}
                  </Box>
                </InputAdornment>
              )
            }}
          />
        )}
        noOptionsText={
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <InventoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Không tìm thấy sản phẩm nào
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Thử thay đổi từ khóa tìm kiếm
            </Typography>
          </Box>
        }
      />

      {/* Category filter chips */}
      {showFilters && categories.length > 0 && (
        <Zoom in={true} style={{ transitionDelay: '200ms' }}>
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label="Tất cả"
              variant={selectedCategory === '' ? 'filled' : 'outlined'}
              color="primary"
              size="small"
              onClick={() => setSelectedCategory('')}
              sx={{ cursor: 'pointer' }}
            />
            {categories.slice(0, 6).map((category) => (
              <Chip
                key={category}
                label={category}
                variant={selectedCategory === category ? 'filled' : 'outlined'}
                color="secondary"
                size="small"
                onClick={() => setSelectedCategory(category)}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Zoom>
      )}
    </Box>
  );
}
