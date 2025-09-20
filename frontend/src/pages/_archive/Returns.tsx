import React, { useState, useMemo } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  IconButton,
  InputAdornment,
  LinearProgress,
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
  Divider,
  Drawer,
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel,
  Switch,
  Stack,
  ButtonGroup
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
  Assignment as CompletedIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { usePaginatedQuery } from '../../hooks/useApiData';
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
  warranty_status?: 'in_warranty' | 'expired' | 'not_registered';
}

const Returns = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [returnStatusFilter, setReturnStatusFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [warrantyFilter, setWarrantyFilter] = useState<'all' | 'in_warranty' | 'expired' | 'not_registered'>('all');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Selection & UI state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [detailDrawer, setDetailDrawer] = useState<{ open: boolean; item: Return | null }>({ open: false, item: null });
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

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

    if (customerFilter.trim()) {
      params.customer = customerFilter.trim();
    }

    if (warrantyFilter !== 'all') {
      params.warranty_status = warrantyFilter;
    }

    return params;
  }, [searchTerm, returnStatusFilter, dateFromFilter, dateToFilter, customerFilter, warrantyFilter]);

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

  // Stats
  const stats = useMemo(() => {
    const total = pagination?.total ?? 0;
    const list = Array.isArray(returns) ? returns : [];
    const pending = list.filter(r => r.return_status === 'pending').length;
    const approved = list.filter(r => r.return_status === 'approved').length;
    const completed = list.filter(r => r.return_status === 'completed').length;
    return { total, pending, approved, completed };
  }, [returns, pagination]);

  // Selection handlers
  const isSelected = (id: number) => selectedIds.includes(id);
  const toggleSelect = (id: number) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds((Array.isArray(returns) ? returns : []).map((r: Return) => r.id));
    else setSelectedIds([]);
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
  const openDetail = (returnItem: Return) => setDetailDrawer({ open: true, item: returnItem });
  const closeDetail = () => setDetailDrawer({ open: false, item: null });

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
      const response = await api.put(`/returns/${statusDialog.returnItem.id}/status`, {
        return_status: statusDialog.newStatus,
        notes: statusDialog.notes
      });

      if (response.data.success) {
        enqueueSnackbar('Cập nhật trạng thái thành công', { variant: 'success' });
        setStatusDialog({ open: false, returnItem: null, newStatus: '', notes: '' });
        refetch();
      } else {
        throw new Error(response.data.message || 'Lỗi khi cập nhật trạng thái');
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

      {/* Stats + Quick Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, flex: 1 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Tổng số</Typography>
              <Typography variant="h5">{stats.total}</Typography>
              <LinearProgress variant="determinate" value={100} sx={{ mt: 1 }} />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Chờ duyệt</Typography>
              <Typography variant="h5">{stats.pending}</Typography>
              <LinearProgress color="warning" variant="determinate" value={stats.pending / Math.max(stats.total || 1, 1) * 100} sx={{ mt: 1 }} />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Đã duyệt</Typography>
              <Typography variant="h5">{stats.approved}</Typography>
              <LinearProgress color="info" variant="determinate" value={stats.approved / Math.max(stats.total || 1, 1) * 100} sx={{ mt: 1 }} />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Hoàn thành</Typography>
              <Typography variant="h5">{stats.completed}</Typography>
              <LinearProgress color="success" variant="determinate" value={stats.completed / Math.max(stats.total || 1, 1) * 100} sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Box>
        <ButtonGroup>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => setExportDialogOpen(true)}>Xuất</Button>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>In</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setNewDialogOpen(true)}>Tạo phiếu</Button>
        </ButtonGroup>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.3fr 1fr 1fr 1fr 1fr' }, gap: 2, alignItems: 'center' }}>
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
            <TextField
              fullWidth
              type="date"
              label="Từ ngày"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              type="date"
              label="Đến ngày"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
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
              <FormControlLabel control={<Switch checked={showAdvanced} onChange={(e) => setShowAdvanced(e.target.checked)} />} label="Nâng cao" />
            </Box>
          </Box>
          {showAdvanced && (
            <Box sx={{ mt: 2 }}>
              <Tabs value={0} onChange={() => {}}>
                <Tab label="Bộ lọc nâng cao" />
              </Tabs>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Gợi ý: kết hợp nhiều bộ lọc để thu hẹp kết quả chính xác.
              </Typography>
            </Box>
          )}
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
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedIds.length > 0 && selectedIds.length < returns.length}
                  checked={returns.length > 0 && selectedIds.length === returns.length}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                />
              </TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Đơn hàng gốc</TableCell>
              <TableCell>Khách hàng</TableCell>
              <TableCell align="right">Số tiền trả</TableCell>
              <TableCell>Lý do</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Bảo hành</TableCell>
              <TableCell>Ngày tạo</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: limit }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={9}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: '100%', height: 40, bgcolor: 'grey.200', borderRadius: 1 }} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : returns.length > 0 ? (
              returns.map((returnItem) => (
                <TableRow key={returnItem.id} hover selected={selectedIds.includes(returnItem.id)}>
                  <TableCell padding="checkbox">
                    <Checkbox checked={selectedIds.includes(returnItem.id)} onChange={() => setSelectedIds(prev => prev.includes(returnItem.id) ? prev.filter(x => x !== returnItem.id) : [...prev, returnItem.id])} />
                  </TableCell>
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
                    {returnItem.warranty_status === 'in_warranty' && <Chip size="small" label="Trong BH" color="success" />}
                    {returnItem.warranty_status === 'expired' && <Chip size="small" label="Hết hạn" color="error" />}
                    {returnItem.warranty_status === 'not_registered' && <Chip size="small" label="Chưa đăng ký" color="warning" />}
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
                          onClick={() => setDetailDrawer({ open: true, item: returnItem })}
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
                <TableCell colSpan={9} align="center">
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
      {/* Detail Drawer */}
      <Drawer anchor="right" open={detailDrawer.open} onClose={() => setDetailDrawer({ open: false, item: null })} PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
          <Typography variant="h6">Chi tiết phiếu trả</Typography>
          <IconButton onClick={() => setDetailDrawer({ open: false, item: null })}><CloseIcon /></IconButton>
        </Box>
        <Divider />
        {detailDrawer.item ? (
          <Box sx={{ p: 2 }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Mã: #{detailDrawer.item.id}</Typography>
              <Typography variant="body2">Đơn gốc: #{detailDrawer.item.original_sale_id}</Typography>
              <Typography variant="body2">Khách: {detailDrawer.item.customer_name ?? 'Khách vãng lai'} {detailDrawer.item.customer_phone ? `(${detailDrawer.item.customer_phone})` : ''}</Typography>
              <Typography variant="body2">Số tiền: {formatCurrency(detailDrawer.item.return_amount)}</Typography>
              <Typography variant="body2">Trạng thái: {getReturnStatusChip(detailDrawer.item.return_status)}</Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2">Lý do</Typography>
              <Typography variant="body2" color="text.secondary">{detailDrawer.item.return_reason}</Typography>
              {!!detailDrawer.item.notes && <Typography variant="caption" color="text.secondary">Ghi chú: {detailDrawer.item.notes}</Typography>}
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2">Dòng thời gian</Typography>
              <Stack spacing={0.5}>
                <Typography variant="caption">{new Date(detailDrawer.item.created_at).toLocaleString('vi-VN')} • Tạo phiếu</Typography>
                <Typography variant="caption">{new Date(detailDrawer.item.created_at).toLocaleString('vi-VN')} • Cập nhật trạng thái</Typography>
              </Stack>
            </Stack>
          </Box>
        ) : null}
      </Drawer>
      {/* Detail Drawer */}
      <Drawer anchor="right" open={detailDrawer.open} onClose={() => setDetailDrawer({ open: false, item: null })} PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
          <Typography variant="h6">Chi tiết phiếu trả</Typography>
          <IconButton onClick={() => setDetailDrawer({ open: false, item: null })}><CloseIcon /></IconButton>
        </Box>
        <Divider />
        {detailDrawer.item ? (
          <Box sx={{ p: 2 }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Mã: #{detailDrawer.item.id}</Typography>
              <Typography variant="body2">Đơn gốc: #{detailDrawer.item.original_sale_id}</Typography>
              <Typography variant="body2">Khách: {detailDrawer.item.customer_name ?? 'Khách vãng lai'} {detailDrawer.item.customer_phone ? `(${detailDrawer.item.customer_phone})` : ''}</Typography>
              <Typography variant="body2">Số tiền: {formatCurrency(detailDrawer.item.return_amount)}</Typography>
              <Typography variant="body2">Trạng thái: {getReturnStatusChip(detailDrawer.item.return_status)}</Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2">Lý do</Typography>
              <Typography variant="body2" color="text.secondary">{detailDrawer.item.return_reason}</Typography>
              {!!detailDrawer.item.notes && <Typography variant="caption" color="text.secondary">Ghi chú: {detailDrawer.item.notes}</Typography>}
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2">Dòng thời gian</Typography>
              <Stack spacing={0.5}>
                <Typography variant="caption">{new Date(detailDrawer.item.created_at).toLocaleString('vi-VN')} • Tạo phiếu</Typography>
                <Typography variant="caption">{new Date(detailDrawer.item.created_at).toLocaleString('vi-VN')} • Cập nhật trạng thái</Typography>
              </Stack>
            </Stack>
          </Box>
        ) : null}
      </Drawer>
    </Container>
  );
};

export default Returns;
