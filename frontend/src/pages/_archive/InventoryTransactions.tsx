import React, { useState, useMemo } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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
import { usePaginatedQuery } from '../../hooks/useApiData';
import { useSnackbar } from 'notistack';
import { formatCurrency } from '../../config/constants';

// Types
interface InventoryTransaction {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  category_name: string;
  transaction_type: 'stock_in' | 'stock_out' | 'transfer_in' | 'transfer_out' | 'adjustment';
  quantity: number;
  cost_price?: number;
  reference_number?: string;
  supplier_name?: string;
  from_store_id?: number;
  to_store_id?: number;
  notes?: string;
  created_at: string;
}

const InventoryTransactions = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {};
    
    if (searchTerm.trim()) {
      params.search = searchTerm.trim();
    }
    
    if (transactionTypeFilter) {
      params.transaction_type = transactionTypeFilter;
    }
    
    if (dateFromFilter) {
      params.date_from = dateFromFilter;
    }
    
    if (dateToFilter) {
      params.date_to = dateToFilter;
    }
    
    return params;
  }, [searchTerm, transactionTypeFilter, dateFromFilter, dateToFilter]);

  // Fetch inventory transactions
  const {
    data: transactions,
    pagination,
    isLoading,
    error,
    refetch,
    handlePageChange,
    handleLimitChange,
    page,
    limit
  } = usePaginatedQuery<InventoryTransaction>('/inventory/transactions', queryParams);

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
    setSearchTerm('');
    setTransactionTypeFilter('');
    setDateFromFilter('');
    setDateToFilter('');
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
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            component={RouterLink}
            to="/inventory/stock-in"
          >
            Nhập kho
          </Button>
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
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            {/* Search */}
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Tìm kiếm"
                placeholder="Tên sản phẩm, SKU, số tham chiếu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Transaction Type Filter */}
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Loại giao dịch</InputLabel>
                <Select
                  value={transactionTypeFilter}
                  label="Loại giao dịch"
                  onChange={(e) => setTransactionTypeFilter(e.target.value)}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="stock_in">Nhập kho</MenuItem>
                  <MenuItem value="stock_out">Xuất kho</MenuItem>
                  <MenuItem value="transfer_in">Chuyển đến</MenuItem>
                  <MenuItem value="transfer_out">Chuyển đi</MenuItem>
                  <MenuItem value="adjustment">Điều chỉnh</MenuItem>
                </Select>
              </FormControl>
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

      {/* Transactions Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Sản phẩm</TableCell>
              <TableCell>Loại giao dịch</TableCell>
              <TableCell align="right">Số lượng</TableCell>
              <TableCell align="right">Giá trị</TableCell>
              <TableCell>Tham chiếu</TableCell>
              <TableCell>Ngày</TableCell>
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
            ) : transactions.length > 0 ? (
              transactions.map((transaction) => (
                <TableRow key={transaction.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {transaction.product_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        SKU: {transaction.product_sku}
                      </Typography>
                      {transaction.category_name && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          {transaction.category_name}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {getTransactionTypeChip(transaction.transaction_type, transaction.quantity)}
                  </TableCell>
                  <TableCell align="right">
                    <Typography 
                      variant="body2" 
                      fontWeight={600}
                      color={
                        ['stock_in', 'transfer_in'].includes(transaction.transaction_type) ? 'success.main' :
                        ['stock_out', 'transfer_out'].includes(transaction.transaction_type) ? 'error.main' :
                        'text.primary'
                      }
                    >
                      {['stock_in', 'transfer_in'].includes(transaction.transaction_type) ? '+' : 
                       ['stock_out', 'transfer_out'].includes(transaction.transaction_type) ? '-' : ''}
                      {transaction.quantity}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {transaction.cost_price ? (
                      <Typography variant="body2" color="primary.main">
                        {formatCurrency(transaction.cost_price * transaction.quantity)}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box>
                      {transaction.reference_number && (
                        <Typography variant="body2" fontWeight={500}>
                          {transaction.reference_number}
                        </Typography>
                      )}
                      {transaction.supplier_name && (
                        <Typography variant="caption" color="text.secondary">
                          {transaction.supplier_name}
                        </Typography>
                      )}
                      {transaction.notes && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          {transaction.notes}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(transaction.created_at).toLocaleDateString('vi-VN')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(transaction.created_at).toLocaleTimeString('vi-VN')}
                    </Typography>
                  </TableCell>
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
        {pagination && (
          <TablePagination
            component="div"
            count={pagination.total}
            page={page - 1}
            onPageChange={(_, newPage) => handlePageChange(newPage + 1)}
            rowsPerPage={limit}
            onRowsPerPageChange={(e) => handleLimitChange(parseInt(e.target.value))}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Số dòng mỗi trang:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} của ${count !== -1 ? count : `hơn ${to}`}`
            }
          />
        )}
      </TableContainer>
    </Container>
  );
};

export default InventoryTransactions;
