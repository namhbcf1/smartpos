import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  InputAdornment,
  TextField,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Alert,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  SwapHoriz as TransferIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  ArrowBack as BackIcon,
  Store as StoreIcon
} from '@mui/icons-material';

import api from '../../services/api';
import { useSnackbar } from 'notistack';
import { formatCurrency } from '../../config/constants';
import { usePaginatedQuery } from '../../hooks/useApiData';

// Types
interface Product {
  id: number;
  name: string;
  sku: string;
  categoryName: string;
  price: number;
  stockQuantity: number;
}

interface Store {
  id: number;
  name: string;
  address: string;
}

const StockTransfer = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [fromStoreId, setFromStoreId] = useState<number>(1);
  const [toStoreId, setToStoreId] = useState<number>(2);
  const [notes, setNotes] = useState<string>('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Fetch products and stores
  const {
    data: products,
    isLoading: productsLoading
  } = usePaginatedQuery<Product>('/products', { limit: 100, is_active: true });

  // Load stores from Cloudflare D1 database
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const storesData = await api.get<Store[]>('/stores');
        setStores(storesData || []);
      } catch (error) {
        console.error('Error fetching stores:', error);
        enqueueSnackbar('Lỗi khi tải danh sách cửa hàng', { variant: 'error' });
      }
    };

    fetchStores();
  }, []);

  // Handle submit transfer
  const handleSubmit = async () => {
    if (!selectedProduct || quantity <= 0 || fromStoreId === toStoreId) {
      enqueueSnackbar('Vui lòng kiểm tra lại thông tin chuyển kho', { variant: 'warning' });
      return;
    }

    if (selectedProduct.stockQuantity < quantity) {
      enqueueSnackbar(`Không đủ tồn kho. Còn lại: ${selectedProduct.stockQuantity}`, { variant: 'error' });
      return;
    }

    setSubmitLoading(true);

    try {
      const result = await api.post('/inventory/stock-transfer', {
        product_id: selectedProduct.id,
        quantity: quantity,
        from_store_id: fromStoreId,
        to_store_id: toStoreId,
        notes: notes
      });
      enqueueSnackbar(`Chuyển kho thành công! ${quantity} ${selectedProduct.name} đã được chuyển từ ${stores.find(s => s.id === fromStoreId)?.name} đến ${stores.find(s => s.id === toStoreId)?.name}`, {
        variant: 'success',
        autoHideDuration: 5000
      });

      // Reset form
      setSelectedProduct(null);
      setQuantity(1);
      setNotes('');

      // Navigate back to inventory after a short delay
      setTimeout(() => {
        navigate('/inventory');
      }, 2000);

    } catch (error) {
      console.error('Stock transfer error:', error);
      enqueueSnackbar(error instanceof Error ? error.message : 'Lỗi khi chuyển kho', { variant: 'error' });
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TransferIcon />
        Chuyển kho
      </Typography>

      {/* Header Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" color="text.secondary">
          Chuyển sản phẩm giữa các chi nhánh
        </Typography>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate('/inventory')}
        >
          Quay lại
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Grid container spacing={3}>
            {/* Product Selection */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Chọn sản phẩm
              </Typography>
              <Autocomplete
                options={products || []}
                getOptionLabel={(option) => `${option.name} (${option.sku})`}
                value={selectedProduct}
                onChange={(_, newValue) => setSelectedProduct(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Chọn sản phẩm cần chuyển"
                    placeholder="Tìm kiếm sản phẩm..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {option.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        SKU: {option.sku} | Danh mục: {option.categoryName}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Tồn kho: {option.stockQuantity} | Giá: {formatCurrency(option.price)}
                      </Typography>
                    </Box>
                  </Box>
                )}
                loading={productsLoading}
                noOptionsText="Không tìm thấy sản phẩm"
              />
            </Grid>

            {selectedProduct && (
              <>
                {/* Product Info */}
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>Sản phẩm:</strong> {selectedProduct.name} ({selectedProduct.sku})
                    </Typography>
                    <Typography variant="body2">
                      <strong>Tồn kho hiện tại:</strong> {selectedProduct.stockQuantity}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Giá:</strong> {formatCurrency(selectedProduct.price)}
                    </Typography>
                  </Alert>
                </Grid>

                {/* Transfer Details */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Từ chi nhánh</InputLabel>
                    <Select
                      value={fromStoreId}
                      label="Từ chi nhánh"
                      onChange={(e) => setFromStoreId(e.target.value as number)}
                    >
                      {stores.map((store) => (
                        <MenuItem key={store.id} value={store.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <StoreIcon fontSize="small" />
                            <Box>
                              <Typography variant="body2">{store.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {store.address}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Đến chi nhánh</InputLabel>
                    <Select
                      value={toStoreId}
                      label="Đến chi nhánh"
                      onChange={(e) => setToStoreId(e.target.value as number)}
                    >
                      {stores.filter(store => store.id !== fromStoreId).map((store) => (
                        <MenuItem key={store.id} value={store.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <StoreIcon fontSize="small" />
                            <Box>
                              <Typography variant="body2">{store.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {store.address}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Số lượng chuyển"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    inputProps={{ min: 1, max: selectedProduct.stockQuantity }}
                    helperText={`Tối đa: ${selectedProduct.stockQuantity}`}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tổng giá trị"
                    value={formatCurrency(quantity * selectedProduct.price)}
                    InputProps={{
                      readOnly: true,
                    }}
                    variant="filled"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Ghi chú"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    multiline
                    rows={3}
                    placeholder="Lý do chuyển kho, ghi chú đặc biệt..."
                  />
                </Grid>

                {/* Transfer Summary */}
                <Grid item xs={12}>
                  <Alert severity="warning">
                    <Typography variant="body2" gutterBottom>
                      <strong>Xác nhận chuyển kho:</strong>
                    </Typography>
                    <Typography variant="body2">
                      • Chuyển {quantity} {selectedProduct.name} từ {stores.find(s => s.id === fromStoreId)?.name}
                      đến {stores.find(s => s.id === toStoreId)?.name}
                    </Typography>
                    <Typography variant="body2">
                      • Tổng giá trị: {formatCurrency(quantity * selectedProduct.price)}
                    </Typography>
                  </Alert>
                </Grid>

                {/* Submit Button */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<SaveIcon />}
                      onClick={handleSubmit}
                      disabled={submitLoading || quantity <= 0 || fromStoreId === toStoreId}
                      sx={{ minWidth: 200 }}
                    >
                      {submitLoading ? 'Đang xử lý...' : 'Xác nhận chuyển kho'}
                    </Button>
                  </Box>
                </Grid>
              </>
            )}
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default StockTransfer;