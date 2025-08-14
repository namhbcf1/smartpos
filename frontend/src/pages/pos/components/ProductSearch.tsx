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
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  QrCodeScanner as BarcodeIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import { POSFilters } from './types';

interface Category {
  id: number;
  name: string;
  product_count?: number;
}

interface ProductSearchProps {
  filters: POSFilters;
  onFiltersChange: (filters: POSFilters) => void;
  categories: Category[];
  onBarcodeScanner: () => void;
  onClearFilters: () => void;
  productCount: number;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  filters,
  onFiltersChange,
  categories,
  onBarcodeScanner,
  onClearFilters,
  productCount
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      search: event.target.value
    });
  };

  const handleCategoryChange = (event: any) => {
    onFiltersChange({
      ...filters,
      category_id: event.target.value || null
    });
  };

  const handleSortChange = (field: 'name' | 'price' | 'stock' | 'popularity') => {
    const newOrder = filters.sort_by === field && filters.sort_order === 'asc' ? 'desc' : 'asc';
    onFiltersChange({
      ...filters,
      sort_by: field,
      sort_order: newOrder
    });
  };

  const toggleInStockOnly = () => {
    onFiltersChange({
      ...filters,
      in_stock_only: !filters.in_stock_only
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.category_id) count++;
    if (filters.in_stock_only) count++;
    if (filters.price_range.min > 0 || filters.price_range.max < 999999999) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Box sx={{ mb: 3 }}>
      {/* Main Search Bar */}
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
            endAdornment: filters.search && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => onFiltersChange({ ...filters, search: '' })}
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{ flexGrow: 1 }}
          size="small"
        />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Danh mục</InputLabel>
          <Select
            value={filters.category_id || ''}
            onChange={handleCategoryChange}
            label="Danh mục"
          >
            <MenuItem value="">Tất cả</MenuItem>
            {Array.isArray(categories) && categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
                {category.product_count && ` (${category.product_count})`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Tooltip title="Quét mã vạch">
          <Button
            variant="outlined"
            startIcon={<BarcodeIcon />}
            onClick={onBarcodeScanner}
            size="small"
          >
            {isMobile ? '' : 'Quét mã'}
          </Button>
        </Tooltip>
      </Stack>

      {/* Filters and Sort */}
      <Stack
        direction={isMobile ? 'column' : 'row'}
        spacing={1}
        alignItems={isMobile ? 'stretch' : 'center'}
        justifyContent="space-between"
      >
        {/* Filter Chips */}
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip
            label="Còn hàng"
            variant={filters.in_stock_only ? "filled" : "outlined"}
            onClick={toggleInStockOnly}
            color={filters.in_stock_only ? "primary" : "default"}
            size="small"
          />

          {activeFiltersCount > 0 && (
            <Chip
              label={`${activeFiltersCount} bộ lọc`}
              onDelete={onClearFilters}
              color="secondary"
              size="small"
              deleteIcon={<ClearIcon />}
            />
          )}

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
            startIcon={<SortIcon />}
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
        </Stack>
      </Stack>
    </Box>
  );
};
