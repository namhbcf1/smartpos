import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Alert,
  LinearProgress,
  Tooltip,
  Badge,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  QrCode as SerialIcon,
  Search as SearchIcon,
  Download as ExportIcon,
  Upload as ImportIcon,
  Visibility as ViewIcon,
  History as HistoryIcon,
  Print as PrintIcon,
  Assignment as ClaimIcon,
  CheckCircle as ActiveIcon,
  Cancel as ExpiredIcon,
  Warning as WarningIcon,
  Build as RepairIcon,
  ShoppingCart as SaleIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import apiClient from '../../services/api/client';
import { useAuth } from '../../hooks/useAuth';

interface SerialNumber {
  id: number;
  serial_number: string;
  product_id: number;
  product_name?: string;
  product_sku?: string;
  status: 'in_stock' | 'sold' | 'returned' | 'defective' | 'warranty_claim' | 'disposed';
  customer_id?: number;
  customer_name?: string;
  sale_id?: number;
  warranty_start_date?: string;
  warranty_end_date?: string;
  location?: string;
  condition_notes?: string;
  received_date: string;
  sold_date?: string;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  has_serial: boolean;
  warranty_months: number;
}

interface SerialHistory {
  id: number;
  action: string;
  old_status?: string;
  new_status?: string;
  user_name?: string;
  notes?: string;
  created_at: string;
}

interface SerialStats {
  total_serials: number;
  in_stock: number;
  sold: number;
  warranty_active: number;
  warranty_claims: number;
  defective: number;
  returned: number;
}

const statusConfig = {
  in_stock: { label: 'Có sẵn', color: 'success' as const, icon: <ActiveIcon /> },
  sold: { label: 'Đã bán', color: 'primary' as const, icon: <SaleIcon /> },
  warranty_claim: { label: 'Bảo hành', color: 'warning' as const, icon: <RepairIcon /> },
  returned: { label: 'Trả lại', color: 'info' as const, icon: <HistoryIcon /> },
  defective: { label: 'Lỗi', color: 'error' as const, icon: <WarningIcon /> },
  disposed: { label: 'Đã hủy', color: 'default' as const, icon: <DeleteIcon /> }
};

export default function SerialManager() {
  const { hasPermission } = useAuth() as any;
  const { enqueueSnackbar } = useSnackbar();

  const [serials, setSerials] = useState<SerialNumber[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<SerialStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSerial, setSelectedSerial] = useState<SerialNumber | null>(null);
  const [serialHistory, setSerialHistory] = useState<SerialHistory[]>([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  // Form data
  const [newSerial, setNewSerial] = useState({
    serial_number: '',
    product_id: '',
    location: '',
    condition_notes: ''
  });
  const [bulkSerials, setBulkSerials] = useState('');
  const [selectedProductForBulk, setSelectedProductForBulk] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    loadData();
  }, [currentPage, searchTerm, statusFilter, productFilter, dateFilter]);

  useEffect(() => {
    loadProducts();
    loadStats();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: itemsPerPage
      };

      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      if (productFilter) params.product_id = productFilter;
      if (dateFilter) params.date_from = dateFilter;

      const response = await apiClient.get('/serial-numbers', { params });
      
      if (response.success) {
        setSerials(response.data || []);
        setTotalPages(Math.ceil((response.pagination?.total || 0) / itemsPerPage));
      }
    } catch (error) {
      console.error('Error loading serials:', error);
      enqueueSnackbar('Lỗi khi tải danh sách serial', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await apiClient.get('/products', {
        params: { has_serial: true, limit: 1000 }
      });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiClient.get('/serial-numbers/stats');
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadSerialHistory = async (serialId: number) => {
    try {
      const response = await apiClient.get(`/serial-numbers/${serialId}/history`);
      setSerialHistory(response.data || []);
    } catch (error) {
      console.error('Error loading history:', error);
      setSerialHistory([]);
    }
  };

  const handleCreateSerial = async () => {
    if (!newSerial.serial_number || !newSerial.product_id) {
      enqueueSnackbar('Vui lòng điền đầy đủ thông tin', { variant: 'warning' });
      return;
    }

    try {
      const response = await apiClient.post('/serial-numbers', {
        serial_number: newSerial.serial_number,
        product_id: parseInt(newSerial.product_id),
        location: newSerial.location,
        condition_notes: newSerial.condition_notes
      });

      if (response.success) {
        enqueueSnackbar('Tạo serial thành công', { variant: 'success' });
        setShowAddModal(false);
        setNewSerial({ serial_number: '', product_id: '', location: '', condition_notes: '' });
        loadData();
        loadStats();
      }
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Lỗi khi tạo serial', { variant: 'error' });
    }
  };

  const handleBulkImport = async () => {
    if (!selectedProductForBulk || !bulkSerials.trim()) {
      enqueueSnackbar('Vui lòng chọn sản phẩm và nhập danh sách serial', { variant: 'warning' });
      return;
    }

    const serialNumbers = bulkSerials
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (serialNumbers.length === 0) {
      enqueueSnackbar('Danh sách serial trống', { variant: 'warning' });
      return;
    }

    try {
      const response = await apiClient.post('/serial-numbers/bulk', {
        product_id: parseInt(selectedProductForBulk),
        serial_numbers: serialNumbers
      });

      if (response.success) {
        enqueueSnackbar(response.message || 'Import thành công', { variant: 'success' });
        setShowImportModal(false);
        setBulkSerials('');
        setSelectedProductForBulk('');
        loadData();
        loadStats();
      }
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Lỗi khi import serial', { variant: 'error' });
    }
  };

  const handleUpdateStatus = async (serialId: number, newStatus: string) => {
    try {
      const response = await apiClient.put(`/serial-numbers/${serialId}`, {
        status: newStatus
      });

      if (response.success) {
        enqueueSnackbar('Cập nhật trạng thái thành công', { variant: 'success' });
        loadData();
        loadStats();
      }
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Lỗi khi cập nhật', { variant: 'error' });
    }
  };

  const handleDeleteSerial = async (serial: SerialNumber) => {
    if (serial.status !== 'in_stock') {
      enqueueSnackbar('Chỉ có thể xóa serial ở trạng thái "Có sẵn"', { variant: 'warning' });
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn xóa serial "${serial.serial_number}"?`)) {
      return;
    }

    try {
      const response = await apiClient.delete(`/serial-numbers/${serial.id}`);
      
      if (response.success) {
        enqueueSnackbar('Xóa serial thành công', { variant: 'success' });
        loadData();
        loadStats();
      }
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Lỗi khi xóa serial', { variant: 'error' });
    }
  };

  const handleExport = async () => {
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      if (productFilter) params.product_id = productFilter;

      const response = await apiClient.get('/serial-numbers/export', {
        params,
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `serials_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      enqueueSnackbar('Export thành công', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Lỗi khi export dữ liệu', { variant: 'error' });
    }
  };

  const openSerialDetail = async (serial: SerialNumber) => {
    setSelectedSerial(serial);
    await loadSerialHistory(serial.id);
    setShowDetailModal(true);
  };

  const getWarrantyStatus = (serial: SerialNumber) => {
    if (!serial.warranty_end_date) return null;
    
    const endDate = new Date(serial.warranty_end_date);
    const now = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) {
      return { status: 'expired', label: 'Hết hạn', color: 'error' };
    } else if (daysLeft < 30) {
      return { status: 'expiring', label: `${daysLeft} ngày`, color: 'warning' };
    } else {
      return { status: 'active', label: 'Còn hạn', color: 'success' };
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setProductFilter('');
    setDateFilter('');
    setCurrentPage(1);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SerialIcon />
        Quản lý Serial Numbers
      </Typography>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4">{stats.total_serials}</Typography>
                <Typography variant="body2">Tổng Serial</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4">{stats.in_stock}</Typography>
                <Typography variant="body2">Có sẵn</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ bgcolor: 'info.light', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4">{stats.sold}</Typography>
                <Typography variant="body2">Đã bán</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4">{stats.warranty_claims}</Typography>
                <Typography variant="body2">Bảo hành</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ bgcolor: 'error.light', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4">{stats.defective}</Typography>
                <Typography variant="body2">Lỗi</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ bgcolor: 'grey.600', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4">{stats.returned}</Typography>
                <Typography variant="body2">Trả lại</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Tìm serial"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={statusFilter}
                  label="Trạng thái"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <MenuItem key={key} value={key}>
                      {config.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Sản phẩm</InputLabel>
                <Select
                  value={productFilter}
                  label="Sản phẩm"
                  onChange={(e) => setProductFilter(e.target.value)}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id.toString()}>
                      {product.name} ({product.sku})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Từ ngày"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Box display="flex" gap={1}>
                <Button variant="outlined" size="small" onClick={resetFilters}>
                  Reset
                </Button>
                <Button variant="outlined" size="small" onClick={loadData}>
                  Tải lại
                </Button>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" gap={1}>
              {hasPermission?.('serials.create') && (
                <>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setShowAddModal(true)}
                  >
                    Thêm Serial
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ImportIcon />}
                    onClick={() => setShowImportModal(true)}
                  >
                    Import
                  </Button>
                </>
              )}
            </Box>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={handleExport}
            >
              Export CSV
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Serials Table */}
      <Card>
        <CardContent>
          {loading ? (
            <LinearProgress />
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Serial Number</TableCell>
                      <TableCell>Sản phẩm</TableCell>
                      <TableCell align="center">Trạng thái</TableCell>
                      <TableCell>Khách hàng</TableCell>
                      <TableCell>Bảo hành</TableCell>
                      <TableCell>Ngày nhận</TableCell>
                      <TableCell align="center">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {serials.map((serial) => {
                      const statusInfo = statusConfig[serial.status];
                      const warrantyStatus = getWarrantyStatus(serial);
                      
                      return (
                        <TableRow key={serial.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace" fontWeight={500}>
                              {serial.serial_number}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {serial.product_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                SKU: {serial.product_sku}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              icon={statusInfo.icon}
                              label={statusInfo.label}
                              color={statusInfo.color}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {serial.customer_name || '-'}
                          </TableCell>
                          <TableCell>
                            {warrantyStatus ? (
                              <Chip
                                label={warrantyStatus.label}
                                color={warrantyStatus.color}
                                size="small"
                              />
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(serial.received_date).toLocaleDateString('vi-VN')}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box display="flex" gap={0.5}>
                              <Tooltip title="Chi tiết">
                                <IconButton
                                  size="small"
                                  onClick={() => openSerialDetail(serial)}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              
                              {hasPermission?.('serials.update') && serial.status === 'in_stock' && (
                                <Tooltip title="Xóa">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteSerial(serial)}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" alignItems="center" mt={2}>
                  <Button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  >
                    Trước
                  </Button>
                  <Typography sx={{ mx: 2 }}>
                    Trang {currentPage} / {totalPages}
                  </Typography>
                  <Button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  >
                    Sau
                  </Button>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Serial Modal */}
      <Dialog open={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm Serial Number</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Serial Number"
                value={newSerial.serial_number}
                onChange={(e) => setNewSerial({ ...newSerial, serial_number: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={products}
                getOptionLabel={(option) => `${option.name} (${option.sku})`}
                value={products.find(p => p.id.toString() === newSerial.product_id) || null}
                onChange={(_, value) => setNewSerial({ ...newSerial, product_id: value?.id.toString() || '' })}
                renderInput={(params) => (
                  <TextField {...params} label="Sản phẩm" required />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Vị trí"
                value={newSerial.location}
                onChange={(e) => setNewSerial({ ...newSerial, location: e.target.value })}
                placeholder="Kho A, Kệ 1, ..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ghi chú tình trạng"
                value={newSerial.condition_notes}
                onChange={(e) => setNewSerial({ ...newSerial, condition_notes: e.target.value })}
                multiline
                rows={3}
                placeholder="Tình trạng sản phẩm..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddModal(false)}>Hủy</Button>
          <Button onClick={handleCreateSerial} variant="contained">
            Tạo Serial
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Import Modal */}
      <Dialog open={showImportModal} onClose={() => setShowImportModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Import Serial Numbers</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Autocomplete
                options={products}
                getOptionLabel={(option) => `${option.name} (${option.sku})`}
                value={products.find(p => p.id.toString() === selectedProductForBulk) || null}
                onChange={(_, value) => setSelectedProductForBulk(value?.id.toString() || '')}
                renderInput={(params) => (
                  <TextField {...params} label="Chọn sản phẩm" required />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Danh sách Serial Numbers"
                value={bulkSerials}
                onChange={(e) => setBulkSerials(e.target.value)}
                multiline
                rows={10}
                placeholder="SN001&#10;SN002&#10;SN003&#10;..."
                helperText="Mỗi serial number trên một dòng riêng"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Lưu ý:</strong>
                </Typography>
                <ul style={{ margin: '8px 0', paddingLeft: '16px' }}>
                  <li>Mỗi serial number phải trên một dòng riêng</li>
                  <li>Serial numbers phải là duy nhất trong hệ thống</li>
                  <li>Các serial trùng lặp sẽ bị bỏ qua</li>
                  <li>Tất cả serial được import sẽ có trạng thái "Có sẵn"</li>
                </ul>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowImportModal(false)}>Hủy</Button>
          <Button onClick={handleBulkImport} variant="contained">
            Import ({bulkSerials.split('\n').filter(s => s.trim()).length} serial)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Serial Detail Modal */}
      <Dialog open={showDetailModal} onClose={() => setShowDetailModal(false)} maxWidth="lg" fullWidth>
        {selectedSerial && (
          <>
            <DialogTitle>
              Chi tiết Serial: {selectedSerial.serial_number}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Thông tin cơ bản
                  </Typography>
                  <Card>
                    <CardContent>
                      <Box display="flex" flexDirection="column" gap={2}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography color="text.secondary">Serial Number:</Typography>
                          <Typography fontFamily="monospace" fontWeight={500}>
                            {selectedSerial.serial_number}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography color="text.secondary">Sản phẩm:</Typography>
                          <Typography>{selectedSerial.product_name}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography color="text.secondary">SKU:</Typography>
                          <Typography>{selectedSerial.product_sku}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography color="text.secondary">Trạng thái:</Typography>
                          <Chip
                            icon={statusConfig[selectedSerial.status].icon}
                            label={statusConfig[selectedSerial.status].label}
                            color={statusConfig[selectedSerial.status].color}
                            size="small"
                          />
                        </Box>
                        {selectedSerial.customer_name && (
                          <Box display="flex" justifyContent="space-between">
                            <Typography color="text.secondary">Khách hàng:</Typography>
                            <Typography>{selectedSerial.customer_name}</Typography>
                          </Box>
                        )}
                        {selectedSerial.location && (
                          <Box display="flex" justifyContent="space-between">
                            <Typography color="text.secondary">Vị trí:</Typography>
                            <Typography>{selectedSerial.location}</Typography>
                          </Box>
                        )}
                        <Box display="flex" justifyContent="space-between">
                          <Typography color="text.secondary">Ngày nhận:</Typography>
                          <Typography>
                            {new Date(selectedSerial.received_date).toLocaleDateString('vi-VN')}
                          </Typography>
                        </Box>
                        {selectedSerial.sold_date && (
                          <Box display="flex" justifyContent="space-between">
                            <Typography color="text.secondary">Ngày bán:</Typography>
                            <Typography>
                              {new Date(selectedSerial.sold_date).toLocaleDateString('vi-VN')}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Status Actions */}
                  {hasPermission?.('serials.update') && (
                    <Box mt={2}>
                      <Typography variant="h6" gutterBottom>
                        Cập nhật trạng thái
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {Object.entries(statusConfig).map(([key, config]) => (
                          <Button
                            key={key}
                            size="small"
                            variant={selectedSerial.status === key ? "contained" : "outlined"}
                            startIcon={config.icon}
                            disabled={selectedSerial.status === key}
                            onClick={() => handleUpdateStatus(selectedSerial.id, key)}
                          >
                            {config.label}
                          </Button>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Lịch sử thay đổi
                  </Typography>
                  <Card>
                    <CardContent>
                      <Box maxHeight={400} overflow="auto">
                        {serialHistory.length === 0 ? (
                          <Typography color="text.secondary" align="center">
                            Chưa có lịch sử thay đổi
                          </Typography>
                        ) : (
                          <Box display="flex" flexDirection="column" gap={2}>
                            {serialHistory.map((history) => (
                              <Card key={history.id} variant="outlined">
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                                    <Typography variant="body2" fontWeight={500}>
                                      {history.action}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {new Date(history.created_at).toLocaleString('vi-VN')}
                                    </Typography>
                                  </Box>
                                  {history.old_status && history.new_status && (
                                    <Typography variant="body2" color="text.secondary">
                                      {statusConfig[history.old_status]?.label} → {statusConfig[history.new_status]?.label}
                                    </Typography>
                                  )}
                                  {history.notes && (
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                      {history.notes}
                                    </Typography>
                                  )}
                                  <Typography variant="caption" color="text.secondary">
                                    Bởi: {history.user_name || 'Hệ thống'}
                                  </Typography>
                                </CardContent>
                              </Card>
                            ))}
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowDetailModal(false)}>Đóng</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
