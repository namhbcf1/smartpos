import React from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Button,
  Chip,
  Collapse,
  IconButton,
  Grid,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AttachMoney as MoneyIcon,
  Category as CategoryIcon,
  Business as SupplierIcon
} from '@mui/icons-material';
import { ProductFilters } from './types';

interface Category {
  id: number;
  name: string;
  product_count?: number;
}

interface Supplier {
  id: number;
  name: string;
  product_count?: number;
}

interface ProductsFiltersProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  onClearFilters: () => void;
  productCount: number;
  categories?: Category[];
  suppliers?: Supplier[];
  brands?: string[];
}

export const ProductsFilters: React.FC<ProductsFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  productCount,
  categories = [],
  suppliers = [],
  brands = []
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [expanded, setExpanded] = React.useState(false);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      search: event.target.value
    });
  };

  const handleCategoryChange = (event: any) => {
    onFiltersChange({
      ...filters,
      category_id: event.target.value || undefined
    });
  };

  const handleSupplierChange = (event: any) => {
    onFiltersChange({
      ...filters,
      supplier_id: event.target.value || undefined
    });
  };

  const handleBrandChange = (event: any) => {
    onFiltersChange({
      ...filters,
      brand: event.target.value || undefined
    });
  };

  const handleStatusChange = (event: any) => {
    onFiltersChange({
      ...filters,
      status: event.target.value
    });
  };

  const handleStockStatusChange = (event: any) => {
    onFiltersChange({
      ...filters,
      stock_status: event.target.value
    });
  };

  const handlePriceRangeChange = (field: 'min' | 'max', value: string) => {
    onFiltersChange({
      ...filters,
      price_range: {
        ...filters.price_range,
        [field]: parseFloat(value) || 0
      }
    });
  };

  const handleSortChange = (field: 'name' | 'price' | 'stock' | 'created_at' | 'updated_at' | 'total_sold') => {
    const newOrder = filters.sort_by === field && filters.sort_order === 'asc' ? 'desc' : 'asc';
    onFiltersChange({
      ...filters,
      sort_by: field,
      sort_order: newOrder
    });
  };

  const toggleFeatured = () => {
    onFiltersChange({
      ...filters,
      is_featured: filters.is_featured ? undefined : true
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.category_id) count++;
    if (filters.supplier_id) count++;
    if (filters.brand) count++;
    if (filters.status !== 'all') count++;
    if (filters.stock_status !== 'all') count++;
    if (filters.is_featured) count++;
    if (filters.price_range.min > 0 || filters.price_range.max < 999999999) count++;
    if (filters.tags && filters.tags.length > 0) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Box sx={{ mb: 3 }}>
      {/* Primary filters - always visible */}
      <Stack
        direction={isMobile ? 'column' : 'row'}
        spacing={2}
        alignItems={isMobile ? 'stretch' : 'center'}
        sx={{ mb: 2 }}
      >
        <TextField
          placeholder="Tìm kiếm sản phẩm, SKU, mã vạch..."
          value={filters.search}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ 
            flexGrow: 1,
            minWidth: isMobile ? 'auto' : 300
          }}
          size="small"
        />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Trạng thái</InputLabel>
          <Select
            value={filters.status}
            onChange={handleStatusChange}
            label="Trạng thái"
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="active">Hoạt động</MenuItem>
            <MenuItem value="inactive">Tạm dừng</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Tồn kho</InputLabel>
          <Select
            value={filters.stock_status}
            onChange={handleStockStatusChange}
            label="Tồn kho"
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="in_stock">Còn hàng</MenuItem>
            <MenuItem value="low_stock">Sắp hết</MenuItem>
            <MenuItem value="out_of_stock">Hết hàng</MenuItem>
          </Select>
        </FormControl>

        {/* Advanced filters toggle */}
        <Button
          startIcon={<FilterIcon />}
          endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          onClick={() => setExpanded(!expanded)}
          variant="outlined"
          size="small"
        >
          Bộ lọc {activeFiltersCount > 0 && (
            <Chip 
              label={activeFiltersCount} 
              size="small" 
              color="primary" 
              sx={{ ml: 1 }} 
            />
          )}
        </Button>

        {activeFiltersCount > 0 && (
          <Button
            startIcon={<ClearIcon />}
            onClick={onClearFilters}
            variant="text"
            size="small"
            color="error"
          >
            Xóa bộ lọc
          </Button>
        )}
      </Stack>

      {/* Advanced filters - collapsible */}
      <Collapse in={expanded}>
        <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, border: 1, borderColor: 'divider' }}>
          <Grid container spacing={2}>
            {/* Category Filter */}
            <Grid item xs={12} sm={6} md={3} component="div">
              <FormControl size="small" fullWidth>
                <InputLabel>Danh mục</InputLabel>
                <Select
                  value={filters.category_id || ''}
                  onChange={handleCategoryChange}
                  label="Danh mục"
                  startAdornment={<CategoryIcon sx={{ mr: 1 }} />}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                      {category.product_count && ` (${category.product_count})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Supplier Filter */}
            <Grid item xs={12} sm={6} md={3} component="div">
              <FormControl size="small" fullWidth>
                <InputLabel>Nhà cung cấp</InputLabel>
                <Select
                  value={filters.supplier_id || ''}
                  onChange={handleSupplierChange}
                  label="Nhà cung cấp"
                  startAdornment={<SupplierIcon sx={{ mr: 1 }} />}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                      {supplier.product_count && ` (${supplier.product_count})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Brand Filter */}
            <Grid item xs={12} sm={6} md={3} component="div">
              <FormControl size="small" fullWidth>
                <InputLabel>Thương hiệu</InputLabel>
                <Select
                  value={filters.brand || ''}
                  onChange={handleBrandChange}
                  label="Thương hiệu"
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {brands.map((brand) => (
                    <MenuItem key={brand} value={brand}>
                      {brand}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Price Range */}
            <Grid item xs={12} sm={6} md={3} component="div">
              <TextField
                label="Giá từ"
                type="number"
                value={filters.price_range.min || ''}
                onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><MoneyIcon /></InputAdornment>
                }}
                size="small"
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3} component="div">
              <TextField
                label="Giá đến"
                type="number"
                value={filters.price_range.max === 999999999 ? '' : filters.price_range.max}
                onChange={(e) => handlePriceRangeChange('max', e.target.value || '999999999')}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><MoneyIcon /></InputAdornment>
                }}
                size="small"
                fullWidth
              />
            </Grid>
          </Grid>
        </Box>
      </Collapse>

      {/* Sort and Filter Chips */}
      <Stack
        direction={isMobile ? 'column' : 'row'}
        spacing={1}
        alignItems={isMobile ? 'stretch' : 'center'}
        justifyContent="space-between"
        sx={{ mt: 2 }}
      >
        {/* Filter Chips */}
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip
            label="Nổi bật"
            variant={filters.is_featured ? "filled" : "outlined"}
            onClick={toggleFeatured}
            color={filters.is_featured ? "warning" : "default"}
            size="small"
          />

          <Chip
            label={`${productCount} sản phẩm`}
            variant="outlined"
            size="small"
            color="info"
          />
        </Stack>

        {/* Sort Options */}
        <Stack direction="row" spacing={1}>
          <Button
            variant={filters.sort_by === 'name' ? 'contained' : 'outlined'}
            onClick={() => handleSortChange('name')}
            size="small"
          >
            Tên {filters.sort_by === 'name' && (filters.sort_order === 'asc' ? '↑' : '↓')}
          </Button>

          <Button
            variant={filters.sort_by === 'price' ? 'contained' : 'outlined'}
            onClick={() => handleSortChange('price')}
            size="small"
          >
            Giá {filters.sort_by === 'price' && (filters.sort_order === 'asc' ? '↑' : '↓')}
          </Button>

          <Button
            variant={filters.sort_by === 'stock' ? 'contained' : 'outlined'}
            onClick={() => handleSortChange('stock')}
            size="small"
          >
            Tồn {filters.sort_by === 'stock' && (filters.sort_order === 'asc' ? '↑' : '↓')}
          </Button>

          <Button
            variant={filters.sort_by === 'total_sold' ? 'contained' : 'outlined'}
            onClick={() => handleSortChange('total_sold')}
            size="small"
          >
            Bán chạy {filters.sort_by === 'total_sold' && (filters.sort_order === 'asc' ? '↑' : '↓')}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};
