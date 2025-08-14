import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Tooltip,
  IconButton,
  Badge,
  Divider
} from '@mui/material';
import {
  QrCode as SerialIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as ExportIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Build as RepairIcon,
  LocalShipping as ShippingIcon,
  Store as StoreIcon,
  Person as CustomerIcon,
  Assignment as WarrantyIcon
} from '@mui/icons-material';
import api, { API_BASE_URL } from '../services/api';
import { useErrorHandler } from '../hooks/useErrorHandler';

interface SerialNumber {
  id: number;
  serial_number: string;
  product_id: number;
  supplier_id?: number;
  status: 'in_stock' | 'sold' | 'returned' | 'defective' | 'warranty_claim' | 'disposed';
  received_date: string;
  sold_date?: string;
  warranty_start_date?: string;
  warranty_end_date?: string;
  sale_id?: number;
  customer_id?: number;
  created_at: string;
  updated_at: string;
  product?: {
    id: number;
    name: string;
    sku: string;
    category_name?: string;
  };
  customer?: {
    id: number;
    full_name: string;
    phone?: string;
  };
  supplier?: {
    id: number;
    name: string;
  };
  // Additional fields from API response
  product_name?: string;
  product_sku?: string;
  customer_name?: string;
  supplier_name?: string;
}

interface SerialNumberStats {
  total_serials: number;
  in_stock: number;
  sold: number;
  warranty_active: number;
  warranty_claims: number;
  defective: number;
}

const SerialNumberManagement: React.FC = () => {
  const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>([]);
  const [stats, setStats] = useState<SerialNumberStats | null>(null);
  const { error, isLoading, executeWithErrorHandling, clearError } = useErrorHandler();
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  
  // Dialog states
  const [selectedSerial, setSelectedSerial] = useState<SerialNumber | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  useEffect(() => {
    loadSerialNumbers();
    loadStats();
  }, [page, rowsPerPage, searchTerm, statusFilter, productFilter]);

  const loadSerialNumbers = async () => {
    const result = await executeWithErrorHandling(async () => {
      console.log('🔄 Loading serial numbers...');

      // Build query parameters
      const params = new URLSearchParams({
        page: (page + 1).toString(), // Convert 0-based to 1-based
        limit: rowsPerPage.toString(),
      });

      // Add filters if they exist
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (productFilter && productFilter !== 'all') {
        params.append('product_id', productFilter);
      }

      // Call real API using the configured API service
      const response = await api.get<{
        success: boolean;
        data: SerialNumber[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>(`/serial-numbers?${params.toString()}`);

      console.log('✅ Serial numbers loaded successfully:', response.data?.length || 0, 'items');
      return response;
    }, {
      fallbackMessage: 'Không thể tải danh sách serial numbers'
    });

    if (result) {
      setSerialNumbers(result.data || []);
      setTotalCount(result.pagination?.total || 0);
    } else {
      // Set empty data on error
      setSerialNumbers([]);
      setTotalCount(0);
    }
  };

  const loadStats = async () => {
    try {
      // Try to load real stats from new public endpoint (no auth required)
      try {
        const response = await api.get<SerialNumberStats>('/serial-numbers-stats');

        setStats(response);
        console.log('✅ Serial number stats loaded successfully from API');
        return;
      } catch (statsError) {
        console.warn('Stats endpoint failed, calculating from data:', statsError);
      }

      // Fallback: Calculate stats from current data
      const stats: SerialNumberStats = {
        total_serials: serialNumbers.length,
        in_stock: serialNumbers.filter(s => s.status === 'in_stock').length,
        sold: serialNumbers.filter(s => s.status === 'sold').length,
        warranty_active: serialNumbers.filter(s => s.status === 'warranty_claim').length,
        warranty_claims: serialNumbers.filter(s => s.status === 'warranty_claim').length,
        defective: serialNumbers.filter(s => s.status === 'defective').length,
      };

      setStats(stats);
      console.log('✅ Serial number stats calculated from data');

    } catch (error) {
      console.error('Error loading stats:', error);
      // Set default stats on error
      setStats({
        total_serials: 0,
        in_stock: 0,
        sold: 0,
        warranty_active: 0,
        warranty_claims: 0,
        defective: 0,
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_stock': return <StoreIcon sx={{ color: '#4CAF50' }} />;
      case 'sold': return <CheckIcon sx={{ color: '#2196F3' }} />;
      case 'returned': return <CancelIcon sx={{ color: '#FF9800' }} />;
      case 'defective': return <WarningIcon sx={{ color: '#f44336' }} />;
      case 'warranty_claim': return <RepairIcon sx={{ color: '#9C27B0' }} />;
      case 'disposed': return <CancelIcon sx={{ color: '#666' }} />;
      default: return <SerialIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'success';
      case 'sold': return 'primary';
      case 'returned': return 'warning';
      case 'defective': return 'error';
      case 'warranty_claim': return 'secondary';
      case 'disposed': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_stock': return 'Trong kho';
      case 'sold': return 'Đã bán';
      case 'returned': return 'Trả hàng';
      case 'defective': return 'Lỗi';
      case 'warranty_claim': return 'Bảo hành';
      case 'disposed': return 'Đã hủy';
      default: return status;
    }
  };

  const handleViewDetails = (serial: SerialNumber) => {
    setSelectedSerial(serial);
    setDetailDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const handleExportExcel = async () => {
    await executeWithErrorHandling(async () => {
      console.log('📊 Exporting serial numbers to Excel...');

      // Get all data for export (no pagination)
      const params = new URLSearchParams({
        page: '1',
        limit: '10000', // Get all data
        export: 'true'
      });

      // Add filters if they exist
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (productFilter && productFilter !== 'all') {
        params.append('product_id', productFilter);
      }

      const response = await fetch(`${API_BASE_URL}/serial-numbers?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `serial-numbers-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ Excel export completed successfully');
    }, {
      fallbackMessage: 'Không thể xuất file Excel'
    });
  };

  if (isLoading && serialNumbers.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Đang tải dữ liệu serial numbers...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 56, height: 56 }}>
            <SerialIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1">
              Quản lý Serial Numbers
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Theo dõi serial numbers từ nhập hàng đến bảo hành
            </Typography>
          </Box>
        </Box>
        
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadSerialNumbers}
            disabled={isLoading}
          >
            Làm mới
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportExcel}
            disabled={isLoading}
          >
            Xuất Excel
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
          >
            Thêm Serial
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={clearError}
        >
          {error.message}
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#2196F3', mr: 2 }}>
                    <SerialIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Tổng Serial
                    </Typography>
                    <Typography variant="h6">
                      {stats.total_serials.toLocaleString('vi-VN')}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#4CAF50', mr: 2 }}>
                    <StoreIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Trong kho
                    </Typography>
                    <Typography variant="h6">
                      {stats.in_stock.toLocaleString('vi-VN')}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#FF9800', mr: 2 }}>
                    <CheckIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Đã bán
                    </Typography>
                    <Typography variant="h6">
                      {stats.sold.toLocaleString('vi-VN')}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#9C27B0', mr: 2 }}>
                    <WarrantyIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Bảo hành
                    </Typography>
                    <Typography variant="h6">
                      {stats.warranty_active.toLocaleString('vi-VN')}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#f44336', mr: 2 }}>
                    <RepairIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Claim BH
                    </Typography>
                    <Typography variant="h6">
                      {stats.warranty_claims.toLocaleString('vi-VN')}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#FF5722', mr: 2 }}>
                    <WarningIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Lỗi
                    </Typography>
                    <Typography variant="h6">
                      {stats.defective.toLocaleString('vi-VN')}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Bộ lọc tìm kiếm
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Tìm kiếm serial number"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Trạng thái"
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="in_stock">Trong kho</MenuItem>
                <MenuItem value="sold">Đã bán</MenuItem>
                <MenuItem value="returned">Trả hàng</MenuItem>
                <MenuItem value="defective">Lỗi</MenuItem>
                <MenuItem value="warranty_claim">Bảo hành</MenuItem>
                <MenuItem value="disposed">Đã hủy</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Sản phẩm</InputLabel>
              <Select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                label="Sản phẩm"
              >
                <MenuItem value="all">Tất cả sản phẩm</MenuItem>
                {/* Add product options dynamically */}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Serial Numbers Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Serial Number</TableCell>
                <TableCell>Sản phẩm</TableCell>
                <TableCell>Nhà cung cấp</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Ngày nhập</TableCell>
                <TableCell>Ngày bán</TableCell>
                <TableCell>Khách hàng</TableCell>
                <TableCell>Bảo hành</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {serialNumbers.map((serial) => (
                <TableRow key={serial.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 32, height: 32 }}>
                        <SerialIcon fontSize="small" />
                      </Avatar>
                      <Typography variant="body2" fontWeight="medium">
                        {serial.serial_number}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {serial.product?.name || serial.product_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {serial.product?.sku || serial.product_sku}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <StoreIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 16 }} />
                      <Typography variant="body2">
                        {serial.supplier?.name || serial.supplier_name || '-'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(serial.status)}
                      label={getStatusLabel(serial.status)}
                      color={getStatusColor(serial.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {formatDate(serial.received_date)}
                  </TableCell>
                  <TableCell>
                    {serial.sold_date ? formatDate(serial.sold_date) : '-'}
                  </TableCell>
                  <TableCell>
                    {serial.customer?.full_name || serial.customer_name ? (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CustomerIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 16 }} />
                        <Box>
                          <Typography variant="body2">
                            {serial.customer?.full_name || serial.customer_name}
                          </Typography>
                          {serial.customer?.phone && (
                            <Typography variant="caption" color="text.secondary">
                              {serial.customer.phone}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {serial.warranty_end_date ? (
                      <Box>
                        <Typography variant="body2">
                          Đến: {formatDate(serial.warranty_end_date)}
                        </Typography>
                        <Chip
                          label={new Date(serial.warranty_end_date) > new Date() ? 'Còn hạn' : 'Hết hạn'}
                          color={new Date(serial.warranty_end_date) > new Date() ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                    ) : '-'}
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Xem chi tiết">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(serial)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Lịch sử">
                        <IconButton size="small">
                          <HistoryIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Số dòng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} của ${count !== -1 ? count : `hơn ${to}`}`
          }
        />
      </Paper>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Chi tiết Serial Number
        </DialogTitle>
        <DialogContent>
          {selectedSerial && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Thông tin cơ bản
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Serial Number:</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedSerial.serial_number}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Sản phẩm:</Typography>
                    <Typography variant="body1">
                      {selectedSerial.product?.name}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Trạng thái:</Typography>
                    <Chip
                      icon={getStatusIcon(selectedSerial.status)}
                      label={getStatusLabel(selectedSerial.status)}
                      color={getStatusColor(selectedSerial.status) as any}
                      size="small"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Thông tin bảo hành
                  </Typography>
                  {selectedSerial.warranty_start_date && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Bắt đầu:</Typography>
                      <Typography variant="body1">
                        {formatDate(selectedSerial.warranty_start_date)}
                      </Typography>
                    </Box>
                  )}
                  {selectedSerial.warranty_end_date && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Kết thúc:</Typography>
                      <Typography variant="body1">
                        {formatDate(selectedSerial.warranty_end_date)}
                      </Typography>
                    </Box>
                  )}
                  {selectedSerial.customer && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Khách hàng:</Typography>
                      <Typography variant="body1">
                        {selectedSerial.customer.full_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedSerial.customer.phone}
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SerialNumberManagement;
