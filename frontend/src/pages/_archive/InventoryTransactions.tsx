import React, { useState, useMemo, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import api from '../../services/api/client';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  TrendingUp as StockInIcon,
  TrendingDown as StockOutIcon,
  SwapHoriz as TransferIcon,
  Assignment as CheckIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

// Types
interface AuditRow {
  id?: string;
  product_id: string;
  product_name?: string;
  location_id?: string;
  transaction_type: 'transfer_in' | 'transfer_out' | 'adjustment' | 'stock_in' | 'stock_out';
  quantity: number;
  previous_quantity?: number;
  new_quantity?: number;
  reason?: string;
  notes?: string;
  created_at: string;
}

const InventoryTransactions = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  // State for filters
  const [productId, setProductId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  // Build query params
  const queryParams = useMemo(() => {
    const p: Record<string, any> = {};
    if (productId.trim()) p.product_id = productId.trim();
    if (locationId.trim()) p.location_id = locationId.trim();
    if (dateFromFilter) p.from = dateFromFilter;
    if (dateToFilter) p.to = dateToFilter;
    p.limit = 1000; // fetch up to 1000, paginate client-side
    return p;
  }, [productId, locationId, dateFromFilter, dateToFilter]);

  // Fetch audit rows
  const refetch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([k, v]) => params.set(k, String(v)));
      const res = await api.get(`/inventory/audit?${params.toString()}`);
      if (res.data?.success) {
        setRows(res.data.data || []);
        setPage(1);
      } else {
        setRows([]);
      }
    } catch (e: any) {
      setError(e?.message || 'Load audit failed');
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { refetch(); }, []);

  // Transaction type icons and colors
  const getTransactionTypeChip = (type: string, quantity: number) => {
    switch (type) {
      case 'stock_in':
        return <Chip icon={<StockInIcon />} label={`Nhập kho (+${quantity})`} color="success" size="small" />;
      case 'stock_out':
        return <Chip icon={<StockOutIcon />} label={`Xuất kho (-${quantity})`} color="error" size="small" />;
      case 'transfer_in':
        return <Chip icon={<TransferIcon />} label={`Chuyển đến (+${quantity})`} color="info" size="small" />;
      case 'transfer_out':
        return <Chip icon={<TransferIcon />} label={`Chuyển đi (-${quantity})`} color="warning" size="small" />;
      case 'adjustment':
        return <Chip icon={<CheckIcon />} label={`Điều chỉnh (${quantity > 0 ? '+' : ''}${quantity})`} color="secondary" size="small" />;
      default:
        return <Chip label={type} size="small" />;
    }
  };

  // Clear filters
  const handleClearFilters = () => {
    setProductId('');
    setLocationId('');
    setDateFromFilter('');
    setDateToFilter('');
    refetch();
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <InventoryIcon />
        Lịch sử giao dịch kho
      </Typography>

      {/* Header Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" color="text.secondary">
          Theo dõi mọi thay đổi tồn kho
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<AddIcon />} component={RouterLink} to="/inventory/stock-in">Nhập kho</Button>
          <Button
            variant="outlined"
            startIcon={<TransferIcon />}
            component={RouterLink}
            to="/inventory/transfer"
          >
            Chuyển kho
          </Button>
          <Button
            variant="outlined"
            startIcon={<CheckIcon />}
            component={RouterLink}
            to="/inventory/check"
          >
            Kiểm kê
          </Button>
          <Button variant="outlined" component="a" href="/inventory/audit/export.csv" target="_blank">Xuất Audit CSV</Button>
          <Button variant="outlined" component="a" href="/inventory/export/stock.csv" target="_blank">Xuất Stock CSV</Button>
          <Button variant="outlined" component="a" href="/inventory/export/locations.csv" target="_blank">Xuất Locations CSV</Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            {/* Product ID */}
            <Grid item xs={12} md={3}>
              <TextField fullWidth label="Product ID" value={productId} onChange={(e)=>setProductId(e.target.value)} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }} />
            </Grid>
            {/* Location */}
            <Grid item xs={12} md={2}>
              <TextField fullWidth label="Location" value={locationId} onChange={(e)=>setLocationId(e.target.value)} />
            </Grid>

            {/* Date From */}
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="date"
                label="Từ ngày"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Date To */}
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="date"
                label="Đến ngày"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Làm mới">
                  <IconButton onClick={refetch}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Xóa bộ lọc">
                  <IconButton onClick={handleClearFilters}>
                    <FilterIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Audit Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Thời gian</TableCell>
              <TableCell>Loại</TableCell>
              <TableCell>Sản phẩm</TableCell>
              <TableCell>Vị trí</TableCell>
              <TableCell align="right">Số lượng</TableCell>
              <TableCell align="right">Từ</TableCell>
              <TableCell align="right">Thành</TableCell>
              <TableCell>Lý do</TableCell>
              <TableCell>Ghi chú</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: limit }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: '100%', height: 40, bgcolor: 'grey.200', borderRadius: 1 }} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length > 0 ? (
              rows.slice((page-1)*limit, (page-1)*limit + limit).map((r, idx) => (
                <TableRow key={`${r.created_at}-${idx}`} hover>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(r.created_at).toLocaleDateString('vi-VN')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(r.created_at).toLocaleTimeString('vi-VN')}
                    </Typography>
                  </TableCell>
                  <TableCell>{getTransactionTypeChip(r.transaction_type, r.quantity)}</TableCell>
                  <TableCell>{r.product_name || r.product_id}</TableCell>
                  <TableCell>{r.location_id || '-'}</TableCell>
                  <TableCell align="right">{r.quantity}</TableCell>
                  <TableCell align="right">{r.previous_quantity ?? '-'}</TableCell>
                  <TableCell align="right">{r.new_quantity ?? '-'}</TableCell>
                  <TableCell>{r.reason || '-'}</TableCell>
                  <TableCell>{r.notes || '-'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Alert severity="info" sx={{ border: 'none' }}>
                    <Typography>Không tìm thấy giao dịch kho nào.</Typography>
                  </Alert>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={rows.length}
          page={page - 1}
          onPageChange={(_, newPage) => setPage(newPage + 1)}
          rowsPerPage={limit}
          onRowsPerPageChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="Số dòng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} của ${count !== -1 ? count : `hơn ${to}`}`
          }
        />
      </TableContainer>
    </Container>
  );
};

export default InventoryTransactions;
