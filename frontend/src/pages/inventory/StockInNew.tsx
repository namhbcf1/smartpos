import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TextField,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Alert,
  Tooltip,
  Tabs,
  Tab,
  Chip,
  Divider,
  Switch,
  FormControlLabel,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  ArrowBack as BackIcon,
  Numbers as NumbersIcon,
  SmartToy as SmartIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { formatCurrency } from '../../config/constants';
import ProductSelector from '../../components/ProductSelector';
import SerialNumberInput from '../../components/SerialNumberInput';
import SupplierSelector from '../../components/SupplierSelector';
import api from '../../services/api';
// REMOVED AI FEATURES: SmartProductSuggestions, InventoryForecasting, SupplierPerformance, InventoryDashboard

// Types
interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  category_name: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
}

interface Supplier {
  id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: boolean;
}

interface StockInItem {
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  cost_price: number;
  total_cost: number;
  notes?: string;
  serial_numbers?: string[];
  use_serial_numbers?: boolean;
}

interface StockInForm {
  supplier_id: number | null;
  reference_number: string;
  notes: string;
  items: StockInItem[];
}

const StockIn = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  // State
  const [formData, setFormData] = useState<StockInForm>({
    supplier_id: null,
    reference_number: '',
    notes: '',
    items: []
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemCostPrice, setItemCostPrice] = useState<number>(0);
  const [itemNotes, setItemNotes] = useState<string>('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [useSerialNumbers, setUseSerialNumbers] = useState<boolean>(false);
  const [serialNumbers, setSerialNumbers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showSupplierPerformance, setShowSupplierPerformance] = useState<boolean>(false);

  // Load suppliers on component mount
  useEffect(() => {
    const loadSuppliers = async () => {
      setSuppliersLoading(true);
      try {
        const result = await api.get<{
          success: boolean;
          data: {
            data: Supplier[];
            pagination: any;
          };
        }>('/suppliers?is_active=true&limit=100');
        if (result.success && result.data?.data) {
          setSuppliers(result.data.data);
        } else {
          setSuppliers([]);
        }
      } catch (error) {
        console.error('Error loading suppliers:', error);
        enqueueSnackbar('Lỗi khi tải danh sách nhà cung cấp', { variant: 'error' });
      } finally {
        setSuppliersLoading(false);
      }
    };

    loadSuppliers();
  }, [enqueueSnackbar]);

  // Note: ProductSelector component handles product fetching internally

  // Calculate totals
  const totalItems = formData.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalCost = formData.items.reduce((sum, item) => sum + item.total_cost, 0);

  // Handle add product to stock in
  const handleAddProduct = () => {
    if (!selectedProduct || itemCostPrice <= 0) {
      enqueueSnackbar('Vui lòng chọn sản phẩm và nhập đầy đủ thông tin', { variant: 'warning' });
      return;
    }

    // Validate quantity and serial numbers
    const finalQuantity = useSerialNumbers ? serialNumbers.length : itemQuantity;

    if (finalQuantity <= 0) {
      enqueueSnackbar(
        useSerialNumbers
          ? 'Vui lòng nhập ít nhất một serial number'
          : 'Vui lòng nhập số lượng hợp lệ',
        { variant: 'warning' }
      );
      return;
    }

    // Check if product already exists in items
    const existingItemIndex = formData.items.findIndex(item => item.product_id === selectedProduct.id);

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...formData.items];
      const existingItem = updatedItems[existingItemIndex];

      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: existingItem.quantity + finalQuantity,
        cost_price: itemCostPrice,
        total_cost: (existingItem.quantity + finalQuantity) * itemCostPrice,
        notes: itemNotes || existingItem.notes,
        serial_numbers: useSerialNumbers
          ? [...(existingItem.serial_numbers || []), ...serialNumbers]
          : existingItem.serial_numbers,
        use_serial_numbers: useSerialNumbers || existingItem.use_serial_numbers
      };
      setFormData(prev => ({ ...prev, items: updatedItems }));
    } else {
      // Add new item
      const newItem: StockInItem = {
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        product_sku: selectedProduct.sku,
        quantity: finalQuantity,
        cost_price: itemCostPrice,
        total_cost: finalQuantity * itemCostPrice,
        notes: itemNotes,
        serial_numbers: useSerialNumbers ? [...serialNumbers] : undefined,
        use_serial_numbers: useSerialNumbers
      };
      setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    }

    // Reset form
    setSelectedProduct(null);
    setItemQuantity(1);
    setItemCostPrice(0);
    setItemNotes('');
    setSerialNumbers([]);
    setUseSerialNumbers(false);
    setOpenProductDialog(false);

    enqueueSnackbar('Đã thêm sản phẩm vào phiếu nhập kho', { variant: 'success' });
  };

  // Handle remove item
  const handleRemoveItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: updatedItems }));
    enqueueSnackbar('Đã xóa sản phẩm khỏi phiếu nhập kho', { variant: 'info' });
  };

  // Handle submit stock in
  const handleSubmit = async () => {
    if (formData.items.length === 0) {
      enqueueSnackbar('Vui lòng thêm ít nhất một sản phẩm', { variant: 'warning' });
      return;
    }

    if (!formData.supplier_id) {
      enqueueSnackbar('Vui lòng chọn nhà cung cấp', { variant: 'warning' });
      return;
    }

    setSubmitLoading(true);

    try {
      // Submit each item separately (as per backend API design)
      for (const item of formData.items) {
        await api.post('/inventory/stock-in', {
          product_id: item.product_id,
          quantity: item.quantity,
          cost_price: item.cost_price,
          supplier_id: formData.supplier_id,
          reference_number: formData.reference_number,
          notes: `${formData.notes}${item.notes ? ` - ${item.notes}` : ''}`
        });
      }

      enqueueSnackbar(`Nhập kho thành công ${formData.items.length} sản phẩm`, { variant: 'success' });

      // Reset form
      setFormData({
        supplier_id: null,
        reference_number: '',
        notes: '',
        items: []
      });
      
      // Navigate to inventory transactions
      navigate('/inventory/transactions');
      
    } catch (error) {
      console.error('Stock in error:', error);
      enqueueSnackbar(error instanceof Error ? error.message : 'Lỗi khi nhập kho', { variant: 'error' });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Auto-fill cost price when product is selected
  useEffect(() => {
    if (selectedProduct) {
      setItemCostPrice(selectedProduct.cost_price || selectedProduct.price);
    }
  }, [selectedProduct]);

  // Update quantity when serial numbers change
  useEffect(() => {
    if (useSerialNumbers) {
      setItemQuantity(serialNumbers.length);
    }
  }, [serialNumbers, useSerialNumbers]);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <InventoryIcon />
        Nhập kho
      </Typography>

      {/* Header Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" color="text.secondary">
          Tạo phiếu nhập kho mới
        </Typography>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate('/inventory/transactions')}
        >
          Quay lại
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Removed AI Features - Smart Features Sidebar */}

        {/* Form Information */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Thông tin phiếu nhập
              </Typography>
              
              <Box sx={{ position: 'relative' }}>
                <SupplierSelector
                  value={selectedSupplier}
                  onChange={(supplier) => {
                    setSelectedSupplier(supplier);
                    setFormData(prev => ({ ...prev, supplier_id: supplier?.id || null }));
                  }}
                  label="Nhà cung cấp *"
                  placeholder="Tìm kiếm hoặc thêm nhà cung cấp..."
                  showQuickAdd={true}
                  showPerformance={true}
                />
                {selectedSupplier && (
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setShowSupplierPerformance(true)}
                      startIcon={<SmartIcon />}
                    >
                      Xem hiệu suất
                    </Button>
                  </Box>
                )}
              </Box>
              
              <TextField
                fullWidth
                label="Số tham chiếu"
                value={formData.reference_number}
                onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                margin="normal"
                placeholder="PO-2024-001"
              />
              
              <TextField
                fullWidth
                label="Ghi chú"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                margin="normal"
                multiline
                rows={3}
                placeholder="Ghi chú cho phiếu nhập kho"
              />

              {/* Summary */}
              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Tổng kết
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Số sản phẩm:</Typography>
                  <Typography variant="body2" fontWeight={600}>{formData.items.length}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Tổng số lượng:</Typography>
                  <Typography variant="body2" fontWeight={600}>{totalItems}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Tổng giá trị:</Typography>
                  <Typography variant="body2" fontWeight={600} color="primary.main">
                    {formatCurrency(totalCost)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Items List */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Danh sách sản phẩm nhập kho
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenProductDialog(true)}
                >
                  Thêm sản phẩm
                </Button>
              </Box>

              {formData.items.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Sản phẩm</TableCell>
                        <TableCell align="right">Số lượng</TableCell>
                        <TableCell align="right">Giá nhập</TableCell>
                        <TableCell align="right">Thành tiền</TableCell>
                        <TableCell align="center">Serial</TableCell>
                        <TableCell align="center">Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {item.product_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                SKU: {item.product_sku}
                              </Typography>
                              {item.notes && (
                                <Typography variant="caption" display="block" color="text.secondary">
                                  {item.notes}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600}>
                              {item.quantity}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {formatCurrency(item.cost_price)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600} color="primary.main">
                              {formatCurrency(item.total_cost)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {item.use_serial_numbers ? (
                              <Tooltip title={`${item.serial_numbers?.length || 0} serial numbers`}>
                                <Chip
                                  icon={<NumbersIcon />}
                                  label={item.serial_numbers?.length || 0}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              </Tooltip>
                            ) : (
                              <Chip
                                label="Số lượng"
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Xóa">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveItem(index)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  Chưa có sản phẩm nào. Hãy thêm sản phẩm để tạo phiếu nhập kho.
                </Alert>
              )}

              {/* Submit Button */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<SaveIcon />}
                  onClick={handleSubmit}
                  disabled={submitLoading || formData.items.length === 0}
                  sx={{ minWidth: 200 }}
                >
                  {submitLoading ? 'Đang xử lý...' : 'Lưu phiếu nhập kho'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Product Dialog */}
      <Dialog open={openProductDialog} onClose={() => setOpenProductDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartIcon color="primary" />
          Thêm sản phẩm thông minh
          <Chip
            label="Cải tiến"
            color="success"
            size="small"
            sx={{ ml: 1 }}
          />
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Product Selection */}
            <Grid item xs={12}>
              <ProductSelector
                value={selectedProduct}
                onChange={setSelectedProduct}
                label="Chọn sản phẩm"
                placeholder="Tìm kiếm theo tên, SKU hoặc quét mã vạch..."
                showBarcodeScanner={true}
              />
            </Grid>

            {selectedProduct && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography variant="h6" color="primary">
                      Thông tin nhập kho
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={useSerialNumbers}
                          onChange={(e) => setUseSerialNumbers(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <NumbersIcon fontSize="small" />
                          Sử dụng Serial Numbers
                        </Box>
                      }
                    />
                  </Box>
                </Grid>

                {/* Tabs for different input methods */}
                <Grid item xs={12}>
                  <Tabs
                    value={activeTab}
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    variant="fullWidth"
                  >
                    <Tab
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <InventoryIcon fontSize="small" />
                          Thông tin cơ bản
                        </Box>
                      }
                    />
                    {useSerialNumbers && (
                      <Tab
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <NumbersIcon fontSize="small" />
                            Serial Numbers
                          </Box>
                        }
                      />
                    )}
                  </Tabs>
                </Grid>

                {/* Tab Content */}
                {activeTab === 0 && (
                  <>
                    <Grid item xs={12} sm={useSerialNumbers ? 12 : 6}>
                      <TextField
                        fullWidth
                        type="number"
                        label={useSerialNumbers ? "Số lượng (tự động từ serial)" : "Số lượng nhập"}
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(parseInt(e.target.value) || 0)}
                        inputProps={{ min: 1 }}
                        disabled={useSerialNumbers}
                        helperText={useSerialNumbers ? "Số lượng sẽ được tính tự động từ số serial numbers" : ""}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Giá nhập"
                        value={itemCostPrice}
                        onChange={(e) => setItemCostPrice(parseFloat(e.target.value) || 0)}
                        inputProps={{ min: 0, step: 1000 }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">₫</InputAdornment>,
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Ghi chú cho sản phẩm"
                        value={itemNotes}
                        onChange={(e) => setItemNotes(e.target.value)}
                        placeholder="Ghi chú riêng cho sản phẩm này..."
                      />
                    </Grid>
                  </>
                )}

                {useSerialNumbers && activeTab === 1 && (
                  <Grid item xs={12}>
                    <SerialNumberInput
                      value={serialNumbers}
                      onChange={setSerialNumbers}
                      label="Serial Numbers"
                      placeholder="Nhập hoặc quét serial number..."
                      showBarcodeScanner={true}
                      maxSerials={1000}
                    />
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>Số lượng:</strong> {useSerialNumbers ? serialNumbers.length : itemQuantity} |
                      <strong> Thành tiền:</strong> {formatCurrency((useSerialNumbers ? serialNumbers.length : itemQuantity) * itemCostPrice)}
                    </Typography>
                  </Alert>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProductDialog(false)}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleAddProduct}
            disabled={
              !selectedProduct ||
              itemCostPrice <= 0 ||
              (useSerialNumbers ? serialNumbers.length === 0 : itemQuantity <= 0)
            }
            startIcon={<AddIcon />}
          >
            Thêm vào phiếu ({useSerialNumbers ? serialNumbers.length : itemQuantity} sản phẩm)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Removed AI Feature - Supplier Performance Dialog */}
    </Container>
  );
};

export default StockIn;
