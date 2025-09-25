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
  Collapse
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  Store as StoreIcon
} from '@mui/icons-material';
import { SalesFilters, Cashier, Store } from './types';

interface SalesFiltersProps {
  filters: SalesFilters;
  onFiltersChange: (filters: SalesFilters) => void;
  cashiers: Cashier[];
  stores: Store[];
  onClearFilters: () => void;
}

export const SalesFiltersComponent: React.FC<SalesFiltersProps> = ({
  filters,
  onFiltersChange,
  cashiers,
  stores,
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

  const handlePaymentStatusChange = (event: any) => {
    onFiltersChange({
      ...filters,
      payment_status: event.target.value
    });
  };

  const handlePaymentMethodChange = (event: any) => {
    onFiltersChange({
      ...filters,
      payment_method: event.target.value
    });
  };

  const handleStatusChange = (event: any) => {
    onFiltersChange({
      ...filters,
      status: event.target.value
    });
  };

  const handleCashierChange = (event: any) => {
    onFiltersChange({
      ...filters,
      cashier_id: event.target.value || undefined
    });
  };

  const handleStoreChange = (event: any) => {
    onFiltersChange({
      ...filters,
      store_id: event.target.value || undefined
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

  const handleAmountRangeChange = (field: 'min' | 'max', value: string) => {
    onFiltersChange({
      ...filters,
      amount_range: {
        ...filters.amount_range,
        [field]: parseFloat(value) || 0
      }
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.payment_status !== 'all') count++;
    if (filters.payment_method !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.cashier_id) count++;
    if (filters.store_id) count++;
    if (filters.date_range.start || filters.date_range.end) count++;
    if (filters.amount_range.min > 0 || filters.amount_range.max < 999999999) count++;
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
          placeholder="Tìm kiếm theo mã đơn, khách hàng, thu ngân..."
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
          <InputLabel>Trạng thái thanh toán</InputLabel>
          <Select
            value={filters.payment_status}
            onChange={handlePaymentStatusChange}
            label="Trạng thái thanh toán"
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="paid">Đã thanh toán</MenuItem>
            <MenuItem value="pending">Chờ thanh toán</MenuItem>
            <MenuItem value="partial">Thanh toán một phần</MenuItem>
            <MenuItem value="refunded">Đã hoàn tiền</MenuItem>
            <MenuItem value="cancelled">Đã hủy</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Phương thức</InputLabel>
          <Select
            value={filters.payment_method}
            onChange={handlePaymentMethodChange}
            label="Phương thức"
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="cash">Tiền mặt</MenuItem>
            <MenuItem value="card">Thẻ</MenuItem>
            <MenuItem value="bank_transfer">Chuyển khoản</MenuItem>
            <MenuItem value="e_wallet">Ví điện tử</MenuItem>
            <MenuItem value="multiple">Nhiều phương thức</MenuItem>
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
            {/* Date Range */}
            <Grid xs={12} sm={6} md={3}>
              <TextField
                label="Từ ngày"
                type="date"
                value={filters.date_range.start || ''}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                fullWidth
              />
            </Grid>

            <Grid xs={12} sm={6} md={3}>
              <TextField
                label="Đến ngày"
                type="date"
                value={filters.date_range.end || ''}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                fullWidth
              />
            </Grid>

            {/* Amount Range */}
            <Grid xs={12} sm={6} md={3}>
              <TextField
                label="Số tiền từ"
                type="number"
                value={filters.amount_range.min || ''}
                onChange={(e) => handleAmountRangeChange('min', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><MoneyIcon /></InputAdornment>
                }}
                size="small"
                fullWidth
              />
            </Grid>

            <Grid xs={12} sm={6} md={3}>
              <TextField
                label="Số tiền đến"
                type="number"
                value={filters.amount_range.max === 999999999 ? '' : filters.amount_range.max}
                onChange={(e) => handleAmountRangeChange('max', e.target.value || '999999999')}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><MoneyIcon /></InputAdornment>
                }}
                size="small"
                fullWidth
              />
            </Grid>

            {/* Status */}
            <Grid xs={12} sm={6} md={3}>
              <FormControl size="small" fullWidth>
                <InputLabel>Trạng thái đơn hàng</InputLabel>
                <Select
                  value={filters.status}
                  onChange={handleStatusChange}
                  label="Trạng thái đơn hàng"
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="draft">Nháp</MenuItem>
                  <MenuItem value="completed">Hoàn thành</MenuItem>
                  <MenuItem value="cancelled">Đã hủy</MenuItem>
                  <MenuItem value="refunded">Đã hoàn tiền</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Cashier */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl size="small" fullWidth>
                <InputLabel>Thu ngân</InputLabel>
                <Select
                  value={filters.cashier_id || ''}
                  onChange={handleCashierChange}
                  label="Thu ngân"
                  startAdornment={<PersonIcon sx={{ mr: 1 }} />}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {Array.isArray(cashiers) ? cashiers.map((cashier) => (
                    <MenuItem key={cashier.id} value={cashier.id}>
                      {cashier.name}
                    </MenuItem>
                  )) : null}
                </Select>
              </FormControl>
            </Grid>

            {/* Store */}
            <Grid xs={12} sm={6} md={3}>
              <FormControl size="small" fullWidth>
                <InputLabel>Cửa hàng</InputLabel>
                <Select
                  value={filters.store_id || ''}
                  onChange={handleStoreChange}
                  label="Cửa hàng"
                  startAdornment={<StoreIcon sx={{ mr: 1 }} />}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {Array.isArray(stores) ? stores.map((store) => (
                    <MenuItem key={store.id} value={store.id}>
                      {store.name}
                    </MenuItem>
                  )) : null}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </Collapse>
    </Box>
  );
};
