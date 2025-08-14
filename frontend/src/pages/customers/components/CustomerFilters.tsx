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
  useMediaQuery,
  Chip,
  Button,
  Collapse,
  IconButton
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { CustomerFilters } from './types';

interface CustomerFiltersProps {
  filters: CustomerFilters;
  onFiltersChange: (filters: CustomerFilters) => void;
  cities: string[];
  onClearFilters: () => void;
}

export const CustomerFiltersComponent: React.FC<CustomerFiltersProps> = ({
  filters,
  onFiltersChange,
  cities,
  onClearFilters
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

  const handleCustomerTypeChange = (event: any) => {
    onFiltersChange({
      ...filters,
      customer_type: event.target.value
    });
  };

  const handleStatusChange = (event: any) => {
    onFiltersChange({
      ...filters,
      status: event.target.value
    });
  };

  const handleCityChange = (event: any) => {
    onFiltersChange({
      ...filters,
      city: event.target.value
    });
  };

  const handleLoyaltyTierChange = (event: any) => {
    onFiltersChange({
      ...filters,
      loyalty_tier: event.target.value
    });
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    onFiltersChange({
      ...filters,
      date_range: {
        ...filters.date_range,
        [field]: value
      }
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.customer_type !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.city) count++;
    if (filters.loyalty_tier !== 'all') count++;
    if (filters.date_range.start || filters.date_range.end) count++;
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
          placeholder="Tìm kiếm khách hàng..."
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
          <InputLabel>Loại khách hàng</InputLabel>
          <Select
            value={filters.customer_type}
            onChange={handleCustomerTypeChange}
            label="Loại khách hàng"
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="individual">Cá nhân</MenuItem>
            <MenuItem value="business">Doanh nghiệp</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Trạng thái</InputLabel>
          <Select
            value={filters.status}
            onChange={handleStatusChange}
            label="Trạng thái"
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="active">Hoạt động</MenuItem>
            <MenuItem value="inactive">Không hoạt động</MenuItem>
            <MenuItem value="blocked">Bị chặn</MenuItem>
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
          <Stack
            direction={isMobile ? 'column' : 'row'}
            spacing={2}
            alignItems={isMobile ? 'stretch' : 'center'}
          >
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Thành phố</InputLabel>
              <Select
                value={filters.city}
                onChange={handleCityChange}
                label="Thành phố"
              >
                <MenuItem value="">Tất cả</MenuItem>
                {cities.map((city) => (
                  <MenuItem key={city} value={city}>
                    {city}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Hạng thành viên</InputLabel>
              <Select
                value={filters.loyalty_tier}
                onChange={handleLoyaltyTierChange}
                label="Hạng thành viên"
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="bronze">Đồng</MenuItem>
                <MenuItem value="silver">Bạc</MenuItem>
                <MenuItem value="gold">Vàng</MenuItem>
                <MenuItem value="platinum">Bạch kim</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Từ ngày"
              type="date"
              value={filters.date_range.start || ''}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ minWidth: 150 }}
            />

            <TextField
              label="Đến ngày"
              type="date"
              value={filters.date_range.end || ''}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ minWidth: 150 }}
            />
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
};
