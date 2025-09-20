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
  Divider,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  InventoryRounded as CountIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  History as HistoryIcon,
  Scanner as ScanIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import apiClient from '../../services/api/client';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../config/constants';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  stock: number;
  cost_price: number;
  min_stock?: number;
  max_stock?: number;
}

interface CountItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  current_quantity: number;
  counted_quantity: number;
  difference: number;
  notes?: string;
  variance_percentage: number;
}

interface CycleCountSession {
  id: string;
  status: 'started' | 'review' | 'applied';
  notes?: string;
  created_at: string;
  items: CountItem[];
}

const steps = ['Tạo phiên kiểm kê', 'Nhập số liệu kiểm đếm', 'Xem xét kết quả', 'Áp dụng điều chỉnh'];

export default function CycleCountManager() {
  const { hasPermission } = useAuth() as any;
  const { enqueueSnackbar } = useSnackbar();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [currentSession, setCurrentSession] = useState<CycleCountSession | null>(null);
  const [countItems, setCountItems] = useState<CountItem[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('main');
  
  // Form states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [countedQuantity, setCountedQuantity] = useState<number>(0);
  const [countNotes, setCountNotes] = useState<string>('');
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [scanMode, setScanMode] = useState<boolean>(false);
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  
  // Review states
  const [autoApproveSmallDifferences, setAutoApproveSmallDifferences] = useState<boolean>(true);
  const [varianceThreshold, setVarianceThreshold] = useState<number>(5); // 5%

  useEffect(() => {
    loadProducts();
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

  const startCycleCount = async () => {
    if (!hasPermission?.('inventory.adjust')) {
      enqueueSnackbar('Không có quyền thực hiện kiểm kê', { variant: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/inventory/cycle-counts/start', {
        notes: sessionNotes || `Kiểm kê kho ${new Date().toLocaleString('vi-VN')}`
      });

      if (response.success) {
        setCurrentSession({
          id: response.data.session_id,
          status: 'started',
          notes: sessionNotes,
          created_at: new Date().toISOString(),
          items: []
        });
        setActiveStep(1);
        enqueueSnackbar('Đã bắt đầu phiên kiểm kê', { variant: 'success' });
      }
    } catch (error) {
      console.error('Error starting cycle count:', error);
      enqueueSnackbar('Lỗi khi bắt đầu kiểm kê', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addCountItem = () => {
    if (!selectedProduct || countedQuantity < 0) {
      enqueueSnackbar('Vui lòng chọn sản phẩm và nhập số lượng hợp lệ', { variant: 'warning' });
      return;
    }

    // Check if product already exists
    if (countItems.find(item => item.product_id === selectedProduct.id)) {
      enqueueSnackbar('Sản phẩm đã được thêm vào danh sách', { variant: 'warning' });
      return;
    }

    const difference = countedQuantity - selectedProduct.stock;
    const variancePercentage = selectedProduct.stock > 0 
      ? Math.abs(difference / selectedProduct.stock) * 100 
      : (countedQuantity > 0 ? 100 : 0);

    const newItem: CountItem = {
      id: Date.now().toString(),
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      product_sku: selectedProduct.sku,
      current_quantity: selectedProduct.stock,
      counted_quantity: countedQuantity,
      difference: difference,
      notes: countNotes,
      variance_percentage: variancePercentage
    };

    setCountItems([...countItems, newItem]);
    
    // Reset form
    setSelectedProduct(null);
    setCountedQuantity(0);
    setCountNotes('');
    setBarcodeInput('');
    
    enqueueSnackbar('Đã thêm sản phẩm vào danh sách kiểm đếm', { variant: 'success' });
  };

  const removeCountItem = (id: string) => {
    setCountItems(countItems.filter(item => item.id !== id));
    enqueueSnackbar('Đã xóa sản phẩm khỏi danh sách', { variant: 'info' });
  };

  const updateCountedQuantity = (id: string, newQuantity: number) => {
    setCountItems(countItems.map(item => {
      if (item.id === id) {
        const difference = newQuantity - item.current_quantity;
        const variancePercentage = item.current_quantity > 0 
          ? Math.abs(difference / item.current_quantity) * 100 
          : (newQuantity > 0 ? 100 : 0);
        
        return {
          ...item,
          counted_quantity: newQuantity,
          difference: difference,
          variance_percentage: variancePercentage
        };
      }
      return item;
    }));
  };

  const handleBarcodeInput = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode || p.sku === barcode);
    if (product) {
      setSelectedProduct(product);
      setBarcodeInput('');
      enqueueSnackbar(`Đã chọn sản phẩm: ${product.name}`, { variant: 'success' });
    } else {
      enqueueSnackbar('Không tìm thấy sản phẩm với mã này', { variant: 'warning' });
    }
  };

  const submitCounts = async (apply: boolean = false) => {
    if (!currentSession || countItems.length === 0) {
      enqueueSnackbar('Chưa có dữ liệu kiểm đếm', { variant: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = countItems.map(item => ({
        product_id: item.product_id,
        variant_id: null,
        location_id: selectedLocation,
        counted_quantity: item.counted_quantity,
        notes: item.notes
      }));

      const response = await apiClient.post('/inventory/cycle-counts/submit', {
        session_id: currentSession.id,
        items: submitData,
        apply: apply
      });

      if (response.success) {
        setCurrentSession({
          ...currentSession,
          status: apply ? 'applied' : 'review',
          items: countItems
        });
        
        if (apply) {
          enqueueSnackbar('Đã áp dụng kết quả kiểm kê vào hệ thống', { variant: 'success' });
          setActiveStep(3);
          loadProducts(); // Refresh stock quantities
        } else {
          enqueueSnackbar('Đã lưu kết quả kiểm kê để xem xét', { variant: 'success' });
          setActiveStep(2);
        }
      }
    } catch (error) {
      console.error('Error submitting counts:', error);
      enqueueSnackbar('Lỗi khi lưu kết quả kiểm kê', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSession = () => {
    setCurrentSession(null);
    setCountItems([]);
    setActiveStep(0);
    setSelectedProduct(null);
    setCountedQuantity(0);
    setCountNotes('');
    setSessionNotes('');
    setBarcodeInput('');
  };

  const getVarianceColor = (percentage: number) => {
    if (percentage === 0) return 'success';
    if (percentage <= varianceThreshold) return 'warning';
    return 'error';
  };

  const getVarianceIcon = (percentage: number) => {
    if (percentage === 0) return <CheckIcon />;
    if (percentage <= varianceThreshold) return <WarningIcon />;
    return <WarningIcon color="error" />;
  };

  const significantDifferences = countItems.filter(item => item.variance_percentage > varianceThreshold);
  const totalValueDifference = countItems.reduce((sum, item) => 
    sum + (item.difference * (products.find(p => p.id === item.product_id)?.cost_price || 0)), 0
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CountIcon />
        Kiểm kê định kỳ
      </Typography>

      {/* Progress Stepper */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep}>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Step 1: Start Session */}
      {activeStep === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tạo phiên kiểm kê mới
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Kho</InputLabel>
                      <Select
                        value={selectedLocation}
                        label="Kho"
                        onChange={(e) => setSelectedLocation(e.target.value)}
                      >
                        <MenuItem value="main">Kho chính</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Ghi chú phiên kiểm kê"
                      value={sessionNotes}
                      onChange={(e) => setSessionNotes(e.target.value)}
                      multiline
                      rows={3}
                      placeholder="Mục đích kiểm kê, phạm vi, người thực hiện..."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      startIcon={<StartIcon />}
                      onClick={startCycleCount}
                      disabled={isSubmitting}
                      size="large"
                    >
                      {isSubmitting ? 'Đang tạo...' : 'Bắt đầu kiểm kê'}
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Step 2: Input Counts */}
      {activeStep === 1 && currentSession && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Nhập dữ liệu kiểm đếm
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={scanMode}
                        onChange={(e) => setScanMode(e.target.checked)}
                      />
                    }
                    label="Chế độ quét mã"
                  />
                </Box>

                <Grid container spacing={2}>
                  {scanMode ? (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Quét mã vạch hoặc nhập SKU"
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && barcodeInput) {
                            handleBarcodeInput(barcodeInput);
                          }
                        }}
                        InputProps={{
                          startAdornment: <ScanIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                  ) : (
                    <Grid item xs={12} sm={6}>
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
                                SKU: {option.sku} | Tồn hệ thống: {option.stock}
                              </Typography>
                            </Box>
                          </li>
                        )}
                      />
                    </Grid>
                  )}
                  
                  <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Số lượng đếm được"
                      value={countedQuantity}
                      onChange={(e) => setCountedQuantity(parseFloat(e.target.value) || 0)}
                      inputProps={{ min: 0, step: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Ghi chú"
                      value={countNotes}
                      onChange={(e) => setCountNotes(e.target.value)}
                      placeholder="Lý do chênh lệch..."
                    />
                  </Grid>
                  <Grid item xs={12} sm={1}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={addCountItem}
                      disabled={!selectedProduct || countedQuantity < 0}
                      sx={{ height: '56px' }}
                    >
                      Thêm
                    </Button>
                  </Grid>
                </Grid>

                {selectedProduct && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2">
                      <strong>Tồn hệ thống:</strong> {selectedProduct.stock} | 
                      <strong> Chênh lệch:</strong> {countedQuantity - selectedProduct.stock} |
                      <strong> % Chênh lệch:</strong> {
                        selectedProduct.stock > 0 
                          ? ((countedQuantity - selectedProduct.stock) / selectedProduct.stock * 100).toFixed(2)
                          : (countedQuantity > 0 ? '100' : '0')
                      }%
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Count Items List */}
          {countItems.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Danh sách kiểm đếm ({countItems.length} sản phẩm)
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Sản phẩm</TableCell>
                          <TableCell align="center">SKU</TableCell>
                          <TableCell align="center">Tồn hệ thống</TableCell>
                          <TableCell align="center">Số đếm được</TableCell>
                          <TableCell align="center">Chênh lệch</TableCell>
                          <TableCell align="center">% Chênh lệch</TableCell>
                          <TableCell align="center">Trạng thái</TableCell>
                          <TableCell>Ghi chú</TableCell>
                          <TableCell align="center">Thao tác</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {countItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {item.product_name}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">{item.product_sku}</TableCell>
                            <TableCell align="center">{item.current_quantity}</TableCell>
                            <TableCell align="center">
                              <TextField
                                type="number"
                                value={item.counted_quantity}
                                onChange={(e) => updateCountedQuantity(item.id, parseFloat(e.target.value) || 0)}
                                size="small"
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Typography
                                variant="body2"
                                color={item.difference > 0 ? 'success.main' : item.difference < 0 ? 'error.main' : 'inherit'}
                              >
                                {item.difference > 0 ? '+' : ''}{item.difference}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" color={getVarianceColor(item.variance_percentage)}>
                                {item.variance_percentage.toFixed(1)}%
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                icon={getVarianceIcon(item.variance_percentage)}
                                label={
                                  item.variance_percentage === 0 ? 'Chính xác' :
                                  item.variance_percentage <= varianceThreshold ? 'Chấp nhận' : 'Cần xem xét'
                                }
                                color={getVarianceColor(item.variance_percentage)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" title={item.notes}>
                                {item.notes || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => removeCountItem(item.id)}
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
                      Tổng ảnh hưởng giá trị: 
                      <Box component="span" color={totalValueDifference > 0 ? 'success.main' : 'error.main'} ml={1}>
                        {formatCurrency(totalValueDifference)}
                      </Box>
                    </Typography>
                    
                    <Box>
                      <Button
                        variant="outlined"
                        onClick={() => submitCounts(false)}
                        disabled={countItems.length === 0 || isSubmitting}
                        sx={{ mr: 2 }}
                      >
                        Lưu để xem xét
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<CheckIcon />}
                        onClick={() => submitCounts(true)}
                        disabled={countItems.length === 0 || isSubmitting}
                      >
                        Áp dụng ngay
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Step 3: Review Results */}
      {activeStep === 2 && currentSession && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Xem xét kết quả kiểm kê
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Alert severity="info">
                      <Typography variant="body2">
                        <strong>Tổng sản phẩm:</strong> {countItems.length}<br/>
                        <strong>Sản phẩm có chênh lệch:</strong> {countItems.filter(i => i.difference !== 0).length}<br/>
                        <strong>Chênh lệch đáng kể (&gt;{varianceThreshold}%):</strong> {significantDifferences.length}
                      </Typography>
                    </Alert>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Alert severity={totalValueDifference >= 0 ? 'success' : 'warning'}>
                      <Typography variant="body2">
                        <strong>Tổng ảnh hưởng giá trị:</strong><br/>
                        {formatCurrency(totalValueDifference)}
                      </Typography>
                    </Alert>
                  </Grid>
                </Grid>

                {significantDifferences.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color="error" gutterBottom>
                      Các chênh lệch cần xem xét:
                    </Typography>
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Sản phẩm</TableCell>
                            <TableCell align="center">Tồn hệ thống</TableCell>
                            <TableCell align="center">Số đếm được</TableCell>
                            <TableCell align="center">Chênh lệch</TableCell>
                            <TableCell align="center">% Chênh lệch</TableCell>
                            <TableCell>Ghi chú</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {significantDifferences.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.product_name}</TableCell>
                              <TableCell align="center">{item.current_quantity}</TableCell>
                              <TableCell align="center">{item.counted_quantity}</TableCell>
                              <TableCell align="center">
                                <Typography color={item.difference > 0 ? 'success.main' : 'error.main'}>
                                  {item.difference > 0 ? '+' : ''}{item.difference}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Typography color="error">
                                  {item.variance_percentage.toFixed(1)}%
                                </Typography>
                              </TableCell>
                              <TableCell>{item.notes || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                <Box display="flex" justifyContent="center" gap={2}>
                  <Button
                    variant="outlined"
                    onClick={() => setActiveStep(1)}
                  >
                    Quay lại chỉnh sửa
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<CheckIcon />}
                    onClick={() => submitCounts(true)}
                    disabled={isSubmitting}
                    color="primary"
                  >
                    Áp dụng kết quả kiểm kê
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Step 4: Completed */}
      {activeStep === 3 && currentSession && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Kiểm kê hoàn tất
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Kết quả kiểm kê đã được áp dụng vào hệ thống. Tồn kho đã được cập nhật.
                </Typography>
                
                <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
                  <Typography variant="body2">
                    <strong>Phiên kiểm kê:</strong> {currentSession.id}<br/>
                    <strong>Số sản phẩm:</strong> {countItems.length}<br/>
                    <strong>Điều chỉnh:</strong> {countItems.filter(i => i.difference !== 0).length} sản phẩm<br/>
                    <strong>Giá trị:</strong> {formatCurrency(totalValueDifference)}
                  </Typography>
                </Alert>

                <Button
                  variant="contained"
                  startIcon={<StartIcon />}
                  onClick={resetSession}
                  size="large"
                >
                  Bắt đầu kiểm kê mới
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {isSubmitting && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress />
          <Typography variant="body2" align="center" sx={{ mt: 1 }}>
            Đang xử lý...
          </Typography>
        </Box>
      )}
    </Box>
  );
}
