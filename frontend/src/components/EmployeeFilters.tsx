import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Grid,
  Paper,
  Typography,
  Collapse,
  IconButton,
  InputAdornment,
  Slider,
  Autocomplete
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AttachMoney as MoneyIcon,
  Percent as PercentIcon
} from '@mui/icons-material';
import { EmployeeFilters as IEmployeeFilters } from '../services/employeeApi';
import { formatSalaryForDisplay, formatCommissionForDisplay } from '../utils/employeeValidation';

interface EmployeeFiltersProps {
  filters: IEmployeeFilters;
  onFiltersChange: (filters: IEmployeeFilters) => void;
  onClearFilters: () => void;
  totalCount?: number;
  filteredCount?: number;
}

const ROLE_OPTIONS = [
  { value: '', label: 'Tất cả vai trò' },
  { value: 'admin', label: 'Quản trị viên' },
  { value: 'cashier', label: 'Thu ngân' },
  { value: 'sales_agent', label: 'Nhân viên kinh doanh' },
  { value: 'affiliate', label: 'Cộng tác viên' }
];

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Không hoạt động' }
];

const SALARY_RANGES = [
  { value: '', label: 'Tất cả mức lương', min: 0, max: Infinity },
  { value: 'under_5m', label: 'Dưới 5 triệu', min: 0, max: 5000000 },
  { value: '5m_10m', label: '5 - 10 triệu', min: 5000000, max: 10000000 },
  { value: '10m_20m', label: '10 - 20 triệu', min: 10000000, max: 20000000 },
  { value: 'over_20m', label: 'Trên 20 triệu', min: 20000000, max: Infinity }
];

const COMMISSION_RANGES = [
  { value: '', label: 'Tất cả tỷ lệ hoa hồng', min: 0, max: 100 },
  { value: 'no_commission', label: 'Không hoa hồng', min: 0, max: 0 },
  { value: 'low', label: 'Thấp (0-5%)', min: 0, max: 5 },
  { value: 'medium', label: 'Trung bình (5-15%)', min: 5, max: 15 },
  { value: 'high', label: 'Cao (15%+)', min: 15, max: 100 }
];

export const EmployeeFilters: React.FC<EmployeeFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  totalCount = 0,
  filteredCount = 0
}) => {
  const [expanded, setExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<IEmployeeFilters>(filters);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Sync local filters with props
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      onFiltersChange(localFilters);
    }, 300);

    setSearchTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [localFilters.search]);

  // Immediate filter updates for non-search fields
  useEffect(() => {
    const { search, ...otherFilters } = localFilters;
    const { search: currentSearch, ...currentOtherFilters } = filters;
    
    if (JSON.stringify(otherFilters) !== JSON.stringify(currentOtherFilters)) {
      onFiltersChange(localFilters);
    }
  }, [localFilters.role, localFilters.status]);

  const handleFilterChange = (key: keyof IEmployeeFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value || undefined,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handleClearFilters = () => {
    setLocalFilters({});
    onClearFilters();
  };

  const getActiveFiltersCount = () => {
    return Object.values(localFilters).filter(value => 
      value !== undefined && value !== '' && value !== null
    ).length;
  };

  const hasActiveFilters = getActiveFiltersCount() > 0;

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      {/* Search and basic filters */}
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            placeholder="Tìm kiếm nhân viên..."
            value={localFilters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: localFilters.search && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => handleFilterChange('search', '')}
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Grid>

        <Grid item xs={12} sm={3} md={2}>
          <FormControl fullWidth>
            <InputLabel>Vai trò</InputLabel>
            <Select
              value={localFilters.role || ''}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              label="Vai trò"
            >
              {ROLE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={3} md={2}>
          <FormControl fullWidth>
            <InputLabel>Trạng thái</InputLabel>
            <Select
              value={localFilters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              label="Trạng thái"
            >
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setExpanded(!expanded)}
            fullWidth
          >
            Bộ lọc {hasActiveFilters && `(${getActiveFiltersCount()})`}
          </Button>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
            fullWidth
          >
            Xóa bộ lọc
          </Button>
        </Grid>
      </Grid>

      {/* Advanced filters */}
      <Collapse in={expanded}>
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" gutterBottom>
            Bộ lọc nâng cao
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Mức lương</InputLabel>
                <Select
                  value={localFilters.salaryRange || ''}
                  onChange={(e) => handleFilterChange('salaryRange', e.target.value)}
                  label="Mức lương"
                >
                  {SALARY_RANGES.map((range) => (
                    <MenuItem key={range.value} value={range.value}>
                      {range.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Tỷ lệ hoa hồng</InputLabel>
                <Select
                  value={localFilters.commissionRange || ''}
                  onChange={(e) => handleFilterChange('commissionRange', e.target.value)}
                  label="Tỷ lệ hoa hồng"
                >
                  {COMMISSION_RANGES.map((range) => (
                    <MenuItem key={range.value} value={range.value}>
                      {range.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Ngày tuyển dụng từ"
                type="date"
                value={localFilters.hireDateFrom || ''}
                onChange={(e) => handleFilterChange('hireDateFrom', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Ngày tuyển dụng đến"
                type="date"
                value={localFilters.hireDateTo || ''}
                onChange={(e) => handleFilterChange('hireDateTo', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </Box>
      </Collapse>

      {/* Filter summary */}
      {hasActiveFilters && (
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Bộ lọc đang áp dụng:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {localFilters.search && (
              <Chip
                label={`Tìm kiếm: "${localFilters.search}"`}
                onDelete={() => handleFilterChange('search', '')}
                size="small"
              />
            )}
            {localFilters.role && (
              <Chip
                label={`Vai trò: ${ROLE_OPTIONS.find(r => r.value === localFilters.role)?.label}`}
                onDelete={() => handleFilterChange('role', '')}
                size="small"
              />
            )}
            {localFilters.status && (
              <Chip
                label={`Trạng thái: ${STATUS_OPTIONS.find(s => s.value === localFilters.status)?.label}`}
                onDelete={() => handleFilterChange('status', '')}
                size="small"
              />
            )}
          </Box>
        </Box>
      )}

      {/* Results summary */}
      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary">
          {hasActiveFilters ? (
            <>Hiển thị {filteredCount} / {totalCount} nhân viên</>
          ) : (
            <>Tổng cộng {totalCount} nhân viên</>
          )}
        </Typography>
      </Box>
    </Paper>
  );
};
