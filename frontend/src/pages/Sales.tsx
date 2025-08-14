import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  TablePagination,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Grid,
  Typography,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  AccountBalanceWallet as AccountBalanceWalletIcon,
  CreditCard as CreditCardIcon,
  QrCode as QrCodeIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { usePaginatedQuery } from '../hooks/useApiData';
import { useDebounce } from '../hooks/useDebounce';
import api from '../services/api';

// Import modular components
import { SalesHeader } from './sales/components/SalesHeader';
import { SalesFiltersComponent } from './sales/components/SalesFilters';
import { SalesTable } from './sales/components/SalesTable';
import {
  Sale,
  SalesFilters,
  SalesSummary,
  Cashier,
  Store
} from './sales/components/types';

const SalesHistory = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // State Management
  const [filters, setFilters] = useState<SalesFilters>({
    search: '',
    date_range: {
      start: undefined,
      end: undefined
    },
    payment_status: 'all',
    payment_method: 'all',
    status: 'all',
    amount_range: { min: 0, max: 999999999 }
  });

  // Debounce search term to avoid too many API calls
  const debouncedSearchTerm = useDebounce(filters.search, 500);
  const [summary, setSummary] = useState<SalesSummary | null>(null);

  // Default summary structure to prevent undefined errors
  const defaultSummary: SalesSummary = {
    today: {
      sales_count: 0,
      total_amount: 0,
      average_sale: 0
    },
    yesterday: {
      sales_count: 0,
      total_amount: 0,
      average_sale: 0
    },
    this_week: {
      sales_count: 0,
      total_amount: 0,
      average_sale: 0
    },
    this_month: {
      sales_count: 0,
      total_amount: 0,
      average_sale: 0
    },
    growth_rates: {
      daily: 0,
      weekly: 0,
      monthly: 0
    }
  };
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error] = useState<string | null>(null);

  // Dialog states
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Refund form states
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState<string>('');
  const [refundMethod, setRefundMethod] = useState<'cash' | 'card' | 'store_credit'>('cash');

  // Fetch sales with pagination and filters
  const {
    data: sales,
    isLoading: salesLoading,
    error: salesError,
    refetch: refetchSales,
    pagination
  } = usePaginatedQuery<Sale>('/sales', {
    page: page + 1,
    limit: rowsPerPage,
    search: debouncedSearchTerm,
    payment_status: filters.payment_status !== 'all' ? filters.payment_status : undefined,
    payment_method: filters.payment_method !== 'all' ? filters.payment_method : undefined,
    sale_status: filters.status !== 'all' ? filters.status : undefined,
    user_id: filters.cashier_id,
    store_id: filters.store_id,
    date_from: filters.date_range.start,
    date_to: filters.date_range.end,
    min_amount: filters.amount_range.min > 0 ? filters.amount_range.min : undefined,
    max_amount: filters.amount_range.max < 999999999 ? filters.amount_range.max : undefined,
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  // Initialize component
  useEffect(() => {
    fetchSummary();
    fetchCashiers();
    fetchStores();
  }, []);

  const fetchSummary = async () => {
    try {
      const summaryData = await api.get<SalesSummary>('/sales/summary');
      setSummary(summaryData);
    } catch (err) {
      // Summary fetch error - silently fail to avoid blocking UI
    }
  };

  const fetchCashiers = async () => {
    try {
      const cashiersData = await api.get<Cashier[]>('/users?role=cashier');
      setCashiers(cashiersData || []);
    } catch (err) {
      // Cashiers fetch error - silently fail to avoid blocking UI
    }
  };

  const fetchStores = async () => {
    try {
      const storesData = await api.get<Store[]>('/stores');
      setStores(storesData || []);
    } catch (err) {
      // Stores fetch error - silently fail to avoid blocking UI
    }
  };

  // Event Handlers
  const handleNewSale = () => {
    navigate('/new-sale-simple');
  };

  const handleViewDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setDetailsDialogOpen(true);
  };

  const handlePrintReceipt = async (sale: Sale) => {
    try {
      setLoading(true);
      // Call print receipt API
      await api.post(`/sales/${sale.id}/print-receipt`);
      enqueueSnackbar('Đã gửi lệnh in hóa đơn', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Lỗi khi in hóa đơn', { variant: 'error' });
      // Print receipt error - logged via enqueueSnackbar
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = (sale: Sale) => {
    setSelectedSale(sale);
    setRefundAmount(sale.total_amount);
    setRefundReason('');
    setRefundMethod('cash');
    setRefundDialogOpen(true);
  };

  const handleRefundSubmit = async () => {
    if (!selectedSale || !refundReason.trim()) {
      enqueueSnackbar('Vui lòng nhập lý do hoàn tiền', { variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      const refundData = {
        sale_id: selectedSale.id,
        refund_amount: refundAmount,
        refund_method: refundMethod,
        reason: refundReason,
        notes: `Hoàn tiền đơn hàng #${selectedSale.receipt_number}`
      };

      await api.post(`/sales/${selectedSale.id}/refund`, refundData);
      enqueueSnackbar('Hoàn tiền thành công', { variant: 'success' });
      setRefundDialogOpen(false);
      refetchSales();
    } catch (err) {
      enqueueSnackbar('Lỗi khi hoàn tiền', { variant: 'error' });
      // Refund error - logged via enqueueSnackbar
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    enqueueSnackbar('Chức năng xuất báo cáo sẽ được triển khai sớm', { variant: 'info' });
  };

  const handleAnalytics = () => {
    navigate('/reports/sales-analytics');
  };

  const handleRefresh = () => {
    refetchSales();
    fetchSummary();
    fetchCashiers();
    fetchStores();
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      date_range: {
        start: undefined,
        end: undefined
      },
      payment_status: 'all',
      payment_method: 'all',
      status: 'all',
      cashier_id: undefined,
      store_id: undefined,
      amount_range: { min: 0, max: 999999999 }
    });
    setPage(0);
  };

  // Pagination handlers
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (error || salesError) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || salesError}
        </Alert>
        <Button onClick={handleRefresh} variant="contained">
          Thử lại
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }} data-testid="sales-list">
      <SalesHeader
        summary={summary || defaultSummary}
        onNewSale={handleNewSale}
        onExport={handleExport}
        onRefresh={handleRefresh}
        onAnalytics={handleAnalytics}
        loading={loading || salesLoading}
      />

      <Divider sx={{ my: 3 }} />

      <SalesFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        cashiers={cashiers}
        stores={stores}
        onClearFilters={handleClearFilters}
      />

      {salesLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!salesLoading && Array.isArray(sales) && (
        <>
          <SalesTable
            sales={sales}
            onViewDetails={handleViewDetails}
            onPrintReceipt={handlePrintReceipt}
            onRefund={handleRefund}
            loading={loading}
          />

          <TablePagination
            component="div"
            count={pagination?.total || 0}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Số dòng mỗi trang:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} của ${count !== -1 ? count : `hơn ${to}`}`
            }
          />
        </>
      )}

      {/* Sale Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Chi tiết đơn hàng #{selectedSale?.receipt_number}</DialogTitle>
        <DialogContent>
          {selectedSale && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={3}>
                {/* Order Information */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Thông tin đơn hàng
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Mã đơn hàng
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      #{selectedSale.receipt_number}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Ngày tạo
                    </Typography>
                    <Typography variant="body1">
                      {new Date(selectedSale.created_at).toLocaleString('vi-VN')}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Thu ngân
                    </Typography>
                    <Typography variant="body1">
                      {selectedSale.cashier_name || 'Chưa có thông tin'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Trạng thái
                    </Typography>
                    <Chip
                      label={
                        selectedSale.payment_status === 'paid' ? 'Đã thanh toán' :
                        selectedSale.payment_status === 'pending' ? 'Chờ thanh toán' :
                        selectedSale.payment_status === 'partial' ? 'Thanh toán một phần' :
                        selectedSale.payment_status === 'refunded' ? 'Đã hoàn tiền' :
                        'Đã hủy'
                      }
                      color={
                        selectedSale.payment_status === 'paid' ? 'success' :
                        selectedSale.payment_status === 'pending' ? 'warning' :
                        selectedSale.payment_status === 'partial' ? 'info' :
                        'error'
                      }
                      size="small"
                    />
                  </Box>
                </Grid>

                {/* Customer Information */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Thông tin khách hàng
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Tên khách hàng
                    </Typography>
                    <Typography variant="body1">
                      {selectedSale.customer_name || 'Khách lẻ'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Số điện thoại
                    </Typography>
                    <Typography variant="body1">
                      {selectedSale.customer_phone || 'Chưa có thông tin'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {selectedSale.customer_email || 'Chưa có thông tin'}
                    </Typography>
                  </Box>
                </Grid>

                {/* Payment Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Thông tin thanh toán
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Tạm tính
                        </Typography>
                        <Typography variant="h6">
                          {(selectedSale.subtotal || 0).toLocaleString('vi-VN')} ₫
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Giảm giá
                        </Typography>
                        <Typography variant="h6" color="error">
                          -{(selectedSale.discount_amount || 0).toLocaleString('vi-VN')} ₫
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Thuế
                        </Typography>
                        <Typography variant="h6">
                          {(selectedSale.tax_amount || 0).toLocaleString('vi-VN')} ₫
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.main', borderRadius: 1 }}>
                        <Typography variant="body2" color="white">
                          Tổng cộng
                        </Typography>
                        <Typography variant="h6" color="white" fontWeight="bold">
                          {(selectedSale.total_amount || 0).toLocaleString('vi-VN')} ₫
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Payment Method */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Phương thức thanh toán:
                    </Typography>
                    <Chip
                      icon={
                        selectedSale.payment_method === 'cash' ? <AccountBalanceWalletIcon /> :
                        selectedSale.payment_method === 'card' ? <CreditCardIcon /> :
                        <QrCodeIcon />
                      }
                      label={
                        selectedSale.payment_method === 'cash' ? 'Tiền mặt' :
                        selectedSale.payment_method === 'card' ? 'Thẻ' :
                        selectedSale.payment_method === 'bank_transfer' ? 'Chuyển khoản' :
                        selectedSale.payment_method === 'e_wallet' ? 'Ví điện tử' :
                        'QR Code'
                      }
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </Grid>

                {/* Notes */}
                {selectedSale.notes && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Ghi chú
                    </Typography>
                    <Typography variant="body1">
                      {selectedSale.notes}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>
            Đóng
          </Button>
          {selectedSale && (
            <Button 
              onClick={() => handlePrintReceipt(selectedSale)}
              variant="contained"
            >
              In hóa đơn
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog
        open={refundDialogOpen}
        onClose={() => setRefundDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Hoàn tiền đơn hàng #{selectedSale?.receipt_number}</DialogTitle>
        <DialogContent>
          {selectedSale && (
            <Box sx={{ pt: 2 }}>
              <Alert severity="warning" sx={{ mb: 3 }}>
                Hành động hoàn tiền không thể hoàn tác. Vui lòng kiểm tra kỹ thông tin trước khi xác nhận.
              </Alert>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Thông tin đơn hàng
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Mã đơn hàng: #{selectedSale.receipt_number}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tổng tiền: {selectedSale.total_amount.toLocaleString('vi-VN')} ₫
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Khách hàng: {selectedSale.customer_name || 'Khách lẻ'}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Số tiền hoàn"
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value))}
                    InputProps={{
                      endAdornment: <Typography variant="body2">₫</Typography>
                    }}
                    helperText={`Tối đa: ${selectedSale.total_amount.toLocaleString('vi-VN')} ₫`}
                    inputProps={{
                      min: 0,
                      max: selectedSale.total_amount
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Phương thức hoàn tiền</InputLabel>
                    <Select
                      value={refundMethod}
                      label="Phương thức hoàn tiền"
                      onChange={(e) => setRefundMethod(e.target.value as 'cash' | 'card' | 'store_credit')}
                    >
                      <MenuItem value="cash">Tiền mặt</MenuItem>
                      <MenuItem value="card">Hoàn về thẻ</MenuItem>
                      <MenuItem value="store_credit">Tín dụng cửa hàng</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Lý do hoàn tiền"
                    multiline
                    rows={3}
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Nhập lý do hoàn tiền..."
                    required
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundDialogOpen(false)}>
            Hủy
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleRefundSubmit}
            disabled={loading || !refundReason.trim() || refundAmount <= 0}
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận hoàn tiền'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SalesHistory;
