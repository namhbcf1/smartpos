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
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { StockCheckFilters } from './types';

interface StockCheckFiltersProps {
  filters: StockCheckFilters;
  onFiltersChange: (filters: StockCheckFilters) => void;
  categories: string[];
}

export const StockCheckFiltersComponent: React.FC<StockCheckFiltersProps> = ({
  filters,
  onFiltersChange,
  categories
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
      category: event.target.value
    });
  };

  const handleStatusChange = (event: any) => {
    onFiltersChange({
      ...filters,
      status: event.target.value
    });
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Stack
        direction={isMobile ? 'column' : 'row'}
        spacing={2}
        alignItems={isMobile ? 'stretch' : 'center'}
      >
        <TextField
          placeholder="Tìm kiếm sản phẩm..."
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
          <InputLabel>Danh mục</InputLabel>
          <Select
            value={filters.category}
            onChange={handleCategoryChange}
            label="Danh mục"
          >
            <MenuItem value="">Tất cả</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Trạng thái</InputLabel>
          <Select
            value={filters.status}
            onChange={handleStatusChange}
            label="Trạng thái"
            startAdornment={<FilterIcon sx={{ mr: 1 }} />}
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="accurate">Chính xác</MenuItem>
            <MenuItem value="discrepancy">Sai lệch</MenuItem>
            <MenuItem value="unchecked">Chưa kiểm</MenuItem>
          </Select>
        </FormControl>
      </Stack>
    </Box>
  );
};
