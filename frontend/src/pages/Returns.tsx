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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Alert,
  AlertTitle,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Undo as ReturnIcon,
  CheckCircle as ApprovedIcon,
  Schedule as PendingIcon,
  Cancel as RejectedIcon,
  Assignment as CompletedIcon
} from '@mui/icons-material';
import { usePaginatedQuery } from '../hooks/useApiData';
import { useSnackbar } from 'notistack';
import { formatCurrency } from '../config/constants';

// Types
interface Return {
  id: number;
  original_sale_id: number;
  return_amount: number;
  return_reason: string;
  return_status: 'pending' | 'approved' | 'rejected' | 'completed';
  reference_number?: string;
  notes?: string;
  customer_name?: string;
  customer_phone?: string;
  original_amount?: number;
  created_at: string;
}

const Returns = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [returnStatusFilter, setReturnStatusFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  // State for status update dialog
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    returnItem: Return | null;
    newStatus: string;
    notes: string;
  }>({
    open: false,
    returnItem: null,
    newStatus: '',
    notes: ''
  });

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {};

    if (searchTerm.trim()) {
      params.search = searchTerm.trim();
    }

    if (returnStatusFilter) {
      params.return_status = returnStatusFilter;
    }

    if (dateFromFilter) {
      params.date_from = dateFromFilter;
    }

    if (dateToFilter) {
      params.date_to = dateToFilter;
    }

    return params;
  }, [searchTerm, returnStatusFilter, dateFromFilter, dateToFilter]);

  // Fetch returns
  const {
    data: returns,
    pagination,
    isLoading,
    error,
    refetch,
    handlePageChange,
    handleLimitChange,
    page,
    limit
  } = usePaginatedQuery<Return>('/returns', queryParams);

  // IMPROVED ERROR HANDLING: Add retry functionality
  const handleRetry = () => {
    console.log('🔄 Returns: Retrying data fetch...');
    refetch();
  };

  // Return status icons and colors
  const getReturnStatusChip = (status: string) => {
    switch (status) {
      case 'pending':
        return <Chip icon={<PendingIcon />} label="Chờ duyệt" color="warning" size="small" />;
      case 'approved':
        return <Chip icon={<ApprovedIcon />} label="Đã duyệt" color="success" size="small" />;
      case 'rejected':
        return <Chip icon={<RejectedIcon />} label="Từ chối" color="error" size="small" />;
      case 'completed':
        return <Chip icon={<CompletedIcon />} label="Hoàn thành" color="info" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  // Handle view return details
  const handleViewReturn = (returnId: number) => {
    navigate(`/returns/${returnId}`);
  };

  // Handle update return status
  const handleUpdateStatus = (returnItem: Return) => {
    setStatusDialog({
      open: true,
      returnItem,
      newStatus: returnItem.return_status,
      notes: returnItem.notes || ''
    });
  };

  // Handle submit status update
  const handleSubmitStatusUpdate = async () => {
    if (!statusDialog.returnItem) return;

    try {
      const response = await fetch(`/api/v1/returns/${statusDialog.returnItem.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          return_status: statusDialog.newStatus,
          notes: statusDialog.notes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Lỗi khi cập nhật trạng thái');
      }

      enqueueSnackbar('Cập nhật trạng thái thành công', { variant: 'success' });
      setStatusDialog({ open: false, returnItem: null, newStatus: '', notes: '' });
      refetch();
    } catch (error) {
      console.error('Update status error:', error);
      enqueueSnackbar(error instanceof Error ? error.message : 'Lỗi khi cập nhật trạng thái', { variant: 'error' });
    }
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setReturnStatusFilter('');
    setDateFromFilter('');
    setDateToFilter('');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ReturnIcon />
        Trả hàng & Hoàn tiền
      </Typography>

      {/* Header Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" color="text.secondary">
          Quản lý trả hàng và hoàn tiền
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={RouterLink}
          to="/returns/new"
        >
          Tạo phiếu trả hàng
        </Button>
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
                placeholder="Lý do trả hàng, tên khách hàng..."
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

            {/* Return Status Filter */}
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={returnStatusFilter}
                  label="Trạng thái"
                  onChange={(e) => setReturnStatusFilter(e.target.value)}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="pending">Chờ duyệt</MenuItem>
                  <MenuItem value="approved">Đã duyệt</MenuItem>
                  <MenuItem value="rejected">Từ chối</MenuItem>
                  <MenuItem value="completed">Hoàn thành</MenuItem>
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

      {/* Error Alert with Retry */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleRetry}
              startIcon={<RefreshIcon />}
            >
              Thử lại
            </Button>
          }
        >
          <AlertTitle>Lỗi tải dữ liệu</AlertTitle>
          {error}
        </Alert>
      )}

      {/* Returns Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Đơn hàng gốc</TableCell>
              <TableCell>Khách hàng</TableCell>
              <TableCell align="right">Số tiền trả</TableCell>
              <TableCell>Lý do</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Ngày tạo</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: limit }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={8}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: '100%', height: 40, bgcolor: 'grey.200', borderRadius: 1 }} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : returns.length > 0 ? (
              returns.map((returnItem) => (
                <TableRow key={returnItem.id} hover>
                  <TableCell>#{returnItem.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      #{returnItem.original_sale_id}
                    </Typography>
                    {returnItem.original_amount && (
                      <Typography variant="caption" color="text.secondary">
                        Gốc: {formatCurrency(returnItem.original_amount)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {returnItem.customer_name || 'Khách vãng lai'}
                      </Typography>
                      {returnItem.customer_phone && (
                        <Typography variant="caption" color="text.secondary">
                          {returnItem.customer_phone}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600} color="error.main">
                      {formatCurrency(returnItem.return_amount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {returnItem.return_reason}
                    </Typography>
                    {returnItem.notes && (
                      <Typography variant="caption" color="text.secondary">
                        {returnItem.notes}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {getReturnStatusChip(returnItem.return_status)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(returnItem.created_at).toLocaleDateString('vi-VN')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(returnItem.created_at).toLocaleTimeString('vi-VN')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Xem chi tiết">
                        <IconButton
                          size="small"
                          onClick={() => handleViewReturn(returnItem.id)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      {returnItem.return_status !== 'completed' && (
                        <Tooltip title="Cập nhật trạng thái">
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateStatus(returnItem)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Alert severity="info" sx={{ border: 'none' }}>
                    <Typography>Không tìm thấy phiếu trả hàng nào.</Typography>
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

      {/* Status Update Dialog */}
      <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ open: false, returnItem: null, newStatus: '', notes: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>Cập nhật trạng thái trả hàng</DialogTitle>
        <DialogContent>
          {statusDialog.returnItem && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Phiếu trả hàng:</strong> #{statusDialog.returnItem.id}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Đơn hàng gốc:</strong> #{statusDialog.returnItem.original_sale_id}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Số tiền trả:</strong> {formatCurrency(statusDialog.returnItem.return_amount)}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <FormControl fullWidth margin="normal">
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={statusDialog.newStatus}
                  label="Trạng thái"
                  onChange={(e) => setStatusDialog(prev => ({ ...prev, newStatus: e.target.value }))}
                >
                  <MenuItem value="pending">Chờ duyệt</MenuItem>
                  <MenuItem value="approved">Đã duyệt</MenuItem>
                  <MenuItem value="rejected">Từ chối</MenuItem>
                  <MenuItem value="completed">Hoàn thành</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Ghi chú"
                value={statusDialog.notes}
                onChange={(e) => setStatusDialog(prev => ({ ...prev, notes: e.target.value }))}
                margin="normal"
                multiline
                rows={3}
                placeholder="Ghi chú về việc cập nhật trạng thái..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ open: false, returnItem: null, newStatus: '', notes: '' })}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitStatusUpdate}
            disabled={!statusDialog.newStatus}
          >
            Cập nhật
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Returns;