import React from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Grid,
  Chip,
  Stack,
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  DateRange,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

interface SalesFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  paymentMethodFilter: string;
  setPaymentMethodFilter: (method: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  setDateRange: (range: { start: Date | null; end: Date | null }) => void;
  onClearFilters: () => void;
  loading?: boolean;
}

const PAYMENT_METHODS = [
  { value: '', label: 'Tất cả' },
  { value: 'cash', label: 'Tiền mặt' },
  { value: 'card', label: 'Thẻ' },
  { value: 'bank_transfer', label: 'Chuyển khoản' },
  { value: 'mobile_payment', label: 'Ví điện tử' },
];

const SALE_STATUSES = [
  { value: '', label: 'Tất cả' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'refunded', label: 'Đã hoàn tiền' },
  { value: 'partially_refunded', label: 'Hoàn tiền một phần' },
  { value: 'cancelled', label: 'Đã hủy' },
];

const SalesFilters: React.FC<SalesFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  paymentMethodFilter,
  setPaymentMethodFilter,
  statusFilter,
  setStatusFilter,
  dateRange,
  setDateRange,
  onClearFilters,
  loading = false,
}) => {
  const hasActiveFilters = searchTerm || paymentMethodFilter || statusFilter || dateRange.start || dateRange.end;

  return (
    <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
      <Grid container spacing={3} alignItems="center">
        {/* Search */}
        <Grid item xs={12} md={4} component="div">
          <TextField
            fullWidth
            size="small"
            placeholder="Tìm kiếm theo mã đơn, khách hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Payment Method Filter */}
        <Grid item xs={12} md={2} component="div">
          <FormControl fullWidth size="small">
            <InputLabel>Phương thức</InputLabel>
            <Select
              value={paymentMethodFilter}
              label="Phương thức"
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              disabled={loading}
            >
              {PAYMENT_METHODS.map((method) => (
                <MenuItem key={method.value} value={method.value}>
                  {method.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Status Filter */}
        <Grid item xs={12} md={2} component="div">
          <FormControl fullWidth size="small">
            <InputLabel>Trạng thái</InputLabel>
            <Select
              value={statusFilter}
              label="Trạng thái"
              onChange={(e) => setStatusFilter(e.target.value)}
              disabled={loading}
            >
              {SALE_STATUSES.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Date Range */}
        <Grid item xs={12} md={2} component="div">
          <DatePicker
            label="Từ ngày"
            value={dateRange.start}
            onChange={(date) => setDateRange({ ...dateRange, start: date })}
            disabled={loading}
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: true,
              },
            }}
          />
        </Grid>

        <Grid item xs={12} md={2} component="div">
          <DatePicker
            label="Đến ngày"
            value={dateRange.end}
            onChange={(date) => setDateRange({ ...dateRange, end: date })}
            disabled={loading}
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: true,
              },
            }}
          />
        </Grid>
      </Grid>

      {/* Active Filters & Clear Button */}
      {hasActiveFilters && (
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Stack direction="row" spacing={1} sx={{ flexGrow: 1, flexWrap: 'wrap' }}>
            {searchTerm && (
              <Chip
                label={`Tìm kiếm: "${searchTerm}"`}
                size="small"
                onDelete={() => setSearchTerm('')}
                color="primary"
                variant="outlined"
              />
            )}
            {paymentMethodFilter && (
              <Chip
                label={`Phương thức: ${PAYMENT_METHODS.find(m => m.value === paymentMethodFilter)?.label}`}
                size="small"
                onDelete={() => setPaymentMethodFilter('')}
                color="secondary"
                variant="outlined"
              />
            )}
            {statusFilter && (
              <Chip
                label={`Trạng thái: ${SALE_STATUSES.find(s => s.value === statusFilter)?.label}`}
                size="small"
                onDelete={() => setStatusFilter('')}
                color="info"
                variant="outlined"
              />
            )}
            {(dateRange.start || dateRange.end) && (
              <Chip
                label="Có lọc theo ngày"
                size="small"
                onDelete={() => setDateRange({ start: null, end: null })}
                color="warning"
                variant="outlined"
                icon={<DateRange />}
              />
            )}
          </Stack>
          
          <Button
            size="small"
            startIcon={<Clear />}
            onClick={onClearFilters}
            disabled={loading}
            variant="outlined"
            color="error"
          >
            Xóa bộ lọc
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default React.memo(SalesFilters);
