import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Autocomplete,
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
  LinearProgress,
  Divider
} from '@mui/material';
import {
  TuneRounded as AdjustmentIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  History as HistoryIcon,
  Inventory2 as InventoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import apiClient from '../../services/api/client';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../config/constants';

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  cost_price: number;
  selling_price: number;
  min_stock?: number;
  max_stock?: number;
}

interface Location {
  id: string;
  name: string;
  code: string;
  type: string;
}

interface AdjustmentItem {
  id: string;
  product_id: string;
  product_name: string;
  current_stock: number;
  adjustment_type: 'increase' | 'decrease' | 'set';
  quantity: number;
  reason: string;
  notes?: string;
  cost_impact?: number;
}

interface StockMovement {
  id: string;
  product_name: string;
  transaction_type: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string;
  notes?: string;
  created_at: string;
  user_id?: string;
}

const adjustmentReasons = [
  { value: 'damaged', label: 'Hàng hỏng' },
  { value: 'expired', label: 'Hết hạn' },
  { value: 'lost', label: 'Mất hàng' },
  { value: 'found', label: 'Tìm thấy hàng' },
  { value: 'recount', label: 'Kiểm kê lại' },
  { value: 'correction', label: 'Điều chỉnh' },
  { value: 'other', label: 'Khác' }
];

export default function StockAdjustmentManager() {
  const { hasPermission } = useAuth() as any;
  const { enqueueSnackbar } = useSnackbar();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [adjustments, setAdjustments] = useState<AdjustmentItem[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('main');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // New adjustment form
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease' | 'set'>('increase');
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    loadProducts();
    loadLocations();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await apiClient.get('/products?limit=500');
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      enqueueSnackbar('Lỗi khi tải danh sách sản phẩm', { variant: 'error' });
    }
  };

  const loadLocations = async () => {
    try {
      const response = await apiClient.get('/locations');
      setLocations(response.data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
      enqueueSnackbar('Lỗi khi tải danh sách kho', { variant: 'error' });
    }
  };

  const loadRecentMovements = async () => {
    setLoadingHistory(true);
    try {
      const response = await apiClient.get('/inventory/audit?limit=50');
      setRecentMovements(response.data || []);
    } catch (error) {
      console.error('Error loading movements:', error);
      enqueueSnackbar('Lỗi khi tải lịch sử điều chỉnh', { variant: 'error' });
    } finally {
      setLoadingHistory(false);
    }
  };

  const addAdjustment = () => {
    if (!selectedProduct || !quantity || !reason) {
      enqueueSnackbar('Vui lòng điền đầy đủ thông tin', { variant: 'warning' });
      return;
    }

    const newAdjustment: AdjustmentItem = {
      id: Date.now().toString(),
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      current_stock: selectedProduct.stock,
      adjustment_type: adjustmentType,
      quantity: quantity,
      reason: reason,
      notes: notes,
      cost_impact: quantity * selectedProduct.cost_price * (adjustmentType === 'decrease' ? -1 : 1)
    };

    setAdjustments([...adjustments, newAdjustment]);
    
    // Reset form
    setSelectedProduct(null);
    setQuantity(0);
    setReason('');
    setNotes('');
    
    enqueueSnackbar('Đã thêm điều chỉnh', { variant: 'success' });
  };

  const removeAdjustment = (id: string) => {
    setAdjustments(adjustments.filter(adj => adj.id !== id));
    enqueueSnackbar('Đã xóa điều chỉnh', { variant: 'info' });
  };

  const submitAdjustments = async () => {
    if (!hasPermission?.('inventory.adjust')) {
      enqueueSnackbar('Không có quyền điều chỉnh kho', { variant: 'error' });
      return;
    }

    if (adjustments.length === 0) {
      enqueueSnackbar('Chưa có điều chỉnh nào', { variant: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      const adjustmentData = adjustments.map(adj => ({
        product_id: adj.product_id,
        location_id: selectedLocation,
        adjustment_type: adj.adjustment_type,
        quantity: adj.quantity,
        reason: adj.reason,
        notes: adj.notes,
        cost_impact: adj.cost_impact
      }));

      const response = await apiClient.post('/inventory/adjustments/bulk', {
        adjustments: adjustmentData,
        batch_notes: `Điều chỉnh hàng loạt - ${new Date().toLocaleString('vi-VN')}`,
        reference_document: `BULK_ADJ_${Date.now()}`
      });

      if (response.success) {
        enqueueSnackbar(
          `Điều chỉnh thành công ${response.data.successful_adjustments}/${response.data.total_processed} sản phẩm`, 
          { variant: 'success' }
        );
        setAdjustments([]);
        loadProducts(); // Refresh stock quantities
      } else {
        enqueueSnackbar('Có lỗi khi điều chỉnh kho', { variant: 'error' });
      }
    } catch (error) {
      console.error('Stock adjustment error:', error);
      enqueueSnackbar('Lỗi khi điều chỉnh kho', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateNewQuantity = (item: AdjustmentItem): number => {
    switch (item.adjustment_type) {
      case 'increase':
        return item.current_stock + item.quantity;
      case 'decrease':
        return Math.max(0, item.current_stock - item.quantity);
      case 'set':
        return item.quantity;
      default:
        return item.current_stock;
    }
  };

  const getAdjustmentTypeColor = (type: string) => {
    switch (type) {
      case 'increase': return 'success';
      case 'decrease': return 'error';
      case 'set': return 'warning';
      default: return 'default';
    }
  };

  const totalCostImpact = adjustments.reduce((sum, adj) => sum + (adj.cost_impact || 0), 0);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AdjustmentIcon />
        Điều chỉnh tồn kho
      </Typography>

      <Grid container spacing={3}>
        {/* Controls */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Kho</InputLabel>
                    <Select
                      value={selectedLocation}
                      label="Kho"
                      onChange={(e) => setSelectedLocation(e.target.value)}
                    >
                      <MenuItem value="main">Kho chính</MenuItem>
                      {locations.map((location) => (
                        <MenuItem key={location.id} value={location.id}>
                          {location.name} ({location.code})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="outlined"
                    startIcon={<HistoryIcon />}
                    onClick={() => {
                      setShowHistory(true);
                      loadRecentMovements();
                    }}
                    fullWidth
                  >
                    Xem lịch sử
                  </Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={submitAdjustments}
                    disabled={adjustments.length === 0 || isSubmitting}
                    fullWidth
                    color="primary"
                  >
                    {isSubmitting ? 'Đang xử lý...' : `Áp dụng (${adjustments.length})`}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Add New Adjustment */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Thêm điều chỉnh
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Autocomplete
                    options={products}
                    getOptionLabel={(option) => `${option.name} (${option.sku})`}
                    value={selectedProduct}
                    onChange={(_, newValue) => setSelectedProduct(newValue)}
                    renderInput={(params) => (
                      <TextField {...params} label="Chọn sản phẩm" />
                    )}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {option.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            SKU: {option.sku} | Tồn: {option.stock} | Giá: {formatCurrency(option.cost_price)}
                          </Typography>
                        </Box>
                      </li>
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <FormControl fullWidth>
                    <InputLabel>Loại điều chỉnh</InputLabel>
                    <Select
                      value={adjustmentType}
                      label="Loại điều chỉnh"
                      onChange={(e) => setAdjustmentType(e.target.value as any)}
                    >
                      <MenuItem value="increase">Tăng</MenuItem>
                      <MenuItem value="decrease">Giảm</MenuItem>
                      <MenuItem value="set">Đặt lại</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Số lượng"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    inputProps={{ min: 0, step: 1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Lý do</InputLabel>
                    <Select
                      value={reason}
                      label="Lý do"
                      onChange={(e) => setReason(e.target.value)}
                    >
                      {adjustmentReasons.map((r) => (
                        <MenuItem key={r.value} value={r.value}>
                          {r.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={1}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={addAdjustment}
                    disabled={!selectedProduct || !quantity || !reason}
                    sx={{ height: '56px' }}
                  >
                    Thêm
                  </Button>
                </Grid>
                {selectedProduct && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Ghi chú"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      multiline
                      rows={2}
                      placeholder="Ghi chú thêm về điều chỉnh..."
                    />
                  </Grid>
                )}
              </Grid>

              {selectedProduct && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Sản phẩm:</strong> {selectedProduct.name} ({selectedProduct.sku})
                  </Typography>
                  <Typography variant="body2">
                    <strong>Tồn hiện tại:</strong> {selectedProduct.stock}
                  </Typography>
                  {quantity > 0 && (
                    <Typography variant="body2" color="primary.main">
                      <strong>Tồn mới:</strong> {
                        adjustmentType === 'increase' 
                          ? selectedProduct.stock + quantity
                          : adjustmentType === 'decrease'
                          ? Math.max(0, selectedProduct.stock - quantity)
                          : quantity
                      }
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Adjustment List */}
        {adjustments.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Danh sách điều chỉnh ({adjustments.length} sản phẩm)
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Sản phẩm</TableCell>
                        <TableCell align="center">Tồn hiện tại</TableCell>
                        <TableCell align="center">Loại điều chỉnh</TableCell>
                        <TableCell align="center">Số lượng</TableCell>
                        <TableCell align="center">Tồn mới</TableCell>
                        <TableCell align="center">Lý do</TableCell>
                        <TableCell align="center">Ảnh hưởng chi phí</TableCell>
                        <TableCell align="center">Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {adjustments.map((adjustment) => (
                        <TableRow key={adjustment.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {adjustment.product_name}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">{adjustment.current_stock}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={
                                adjustment.adjustment_type === 'increase' ? 'Tăng' :
                                adjustment.adjustment_type === 'decrease' ? 'Giảm' : 'Đặt lại'
                              }
                              color={getAdjustmentTypeColor(adjustment.adjustment_type)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            {adjustment.adjustment_type === 'set' ? '' : adjustment.adjustment_type === 'increase' ? '+' : '-'}
                            {adjustment.quantity}
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body2"
                              fontWeight={500}
                              color={calculateNewQuantity(adjustment) !== adjustment.current_stock ? 'primary.main' : 'inherit'}
                            >
                              {calculateNewQuantity(adjustment)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {adjustmentReasons.find(r => r.value === adjustment.reason)?.label || adjustment.reason}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body2"
                              color={adjustment.cost_impact && adjustment.cost_impact > 0 ? 'success.main' : 'error.main'}
                            >
                              {formatCurrency(adjustment.cost_impact || 0)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeAdjustment(adjustment.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Divider sx={{ my: 2 }} />
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">
                    Tổng ảnh hưởng chi phí: 
                    <Box component="span" color={totalCostImpact > 0 ? 'success.main' : 'error.main'} ml={1}>
                      {formatCurrency(totalCostImpact)}
                    </Box>
                  </Typography>
                  
                  {totalCostImpact < 0 && (
                    <Alert severity="warning" sx={{ ml: 2 }}>
                      Điều chỉnh này sẽ giảm giá trị tồn kho
                    </Alert>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {isSubmitting && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress />
          <Typography variant="body2" align="center" sx={{ mt: 1 }}>
            Đang xử lý điều chỉnh tồn kho...
          </Typography>
        </Box>
      )}

      {/* History Dialog */}
      <Dialog open={showHistory} onClose={() => setShowHistory(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <HistoryIcon />
            Lịch sử điều chỉnh tồn kho
          </Box>
        </DialogTitle>
        <DialogContent>
          {loadingHistory ? (
            <LinearProgress />
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Thời gian</TableCell>
                    <TableCell>Sản phẩm</TableCell>
                    <TableCell align="center">Loại</TableCell>
                    <TableCell align="center">Thay đổi</TableCell>
                    <TableCell align="center">Tồn cũ</TableCell>
                    <TableCell align="center">Tồn mới</TableCell>
                    <TableCell>Lý do</TableCell>
                    <TableCell>Người thực hiện</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(movement.created_at).toLocaleString('vi-VN')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {movement.product_name}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={movement.transaction_type}
                          size="small"
                          color={movement.transaction_type === 'adjustment' ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body2"
                          color={movement.quantity > 0 ? 'success.main' : 'error.main'}
                        >
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">{movement.previous_quantity}</TableCell>
                      <TableCell align="center">{movement.new_quantity}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {adjustmentReasons.find(r => r.value === movement.reason)?.label || movement.reason}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {movement.user_id || 'Hệ thống'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHistory(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
