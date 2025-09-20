import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box,
  Autocomplete,
  Chip,
  IconButton,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';

interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  cost_price: number;
  unit_of_measure: string;
}

interface PurchaseOrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  notes?: string;
}

interface PurchaseOrderModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: PurchaseOrderData) => void;
  suppliers: Supplier[];
  products: Product[];
  editData?: PurchaseOrderData;
}

interface PurchaseOrderData {
  supplier_id: string;
  order_date: string;
  expected_delivery_date: string;
  notes: string;
  items: PurchaseOrderItem[];
}

const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  open,
  onClose,
  onConfirm,
  suppliers,
  products,
  editData
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<PurchaseOrderData>({
    supplier_id: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    items: []
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newItem, setNewItem] = useState<Partial<PurchaseOrderItem>>({
    quantity: 0,
    unit_price: 0,
    notes: ''
  });

  useEffect(() => {
    if (open) {
      if (editData) {
        setFormData(editData);
      } else {
        setFormData({
          supplier_id: '',
          order_date: new Date().toISOString().split('T')[0],
          expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notes: '',
          items: []
        });
      }
      setActiveStep(0);
      setSelectedProduct(null);
      setNewItem({ quantity: 0, unit_price: 0, notes: '' });
    }
  }, [open, editData]);

  const addItem = () => {
    if (!selectedProduct || !newItem.quantity || newItem.quantity <= 0) {
      return;
    }

    const item: PurchaseOrderItem = {
      id: Date.now().toString(),
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      quantity: newItem.quantity!,
      unit_price: newItem.unit_price || selectedProduct.cost_price,
      total_amount: (newItem.quantity! * (newItem.unit_price || selectedProduct.cost_price)),
      notes: newItem.notes
    };

    setFormData({
      ...formData,
      items: [...formData.items, item]
    });

    setSelectedProduct(null);
    setNewItem({ quantity: 0, unit_price: 0, notes: '' });
  };

  const removeItem = (id: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.id !== id)
    });
  };

  const updateItem = (id: string, field: keyof PurchaseOrderItem, value: any) => {
    setFormData({
      ...formData,
      items: formData.items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unit_price') {
            updated.total_amount = updated.quantity * updated.unit_price;
          }
          return updated;
        }
        return item;
      })
    });
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleConfirm = () => {
    if (!formData.supplier_id || formData.items.length === 0) {
      return;
    }

    onConfirm(formData);
    onClose();
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + item.total_amount, 0);
  const taxAmount = totalAmount * 0.1; // 10% tax
  const finalAmount = totalAmount + taxAmount;

  const steps = [
    'Thông tin cơ bản',
    'Sản phẩm',
    'Xác nhận'
  ];

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Nhà cung cấp *</InputLabel>
                <Select
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                >
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Ngày đặt hàng"
                value={new Date(formData.order_date)}
                onChange={(date) => setFormData({ ...formData, order_date: date?.toISOString().split('T')[0] || '' })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Ngày giao hàng dự kiến"
                value={new Date(formData.expected_delivery_date)}
                onChange={(date) => setFormData({ ...formData, expected_delivery_date: date?.toISOString().split('T')[0] || '' })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ghi chú"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            {/* Add Item Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Thêm sản phẩm
              </Typography>
              <Box p={2} border={1} borderColor="grey.300" borderRadius={1}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <Autocomplete
                      options={products}
                      getOptionLabel={(option) => `${option.name} (${option.sku})`}
                      value={selectedProduct}
                      onChange={(_, newValue) => {
                        setSelectedProduct(newValue);
                        if (newValue) {
                          setNewItem({ ...newItem, unit_price: newValue.cost_price });
                        }
                      }}
                      renderInput={(params) => (
                        <TextField {...params} label="Sản phẩm" />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      label="Số lượng"
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      label="Đơn giá"
                      type="number"
                      value={newItem.unit_price}
                      onChange={(e) => setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) || 0 })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Ghi chú"
                      value={newItem.notes}
                      onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={1}>
                    <Button
                      variant="contained"
                      onClick={addItem}
                      disabled={!selectedProduct || !newItem.quantity}
                      startIcon={<AddIcon />}
                    >
                      Thêm
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            {/* Items List */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Danh sách sản phẩm ({formData.items.length})
              </Typography>
              {formData.items.length === 0 ? (
                <Alert severity="info">
                  Chưa có sản phẩm nào được thêm
                </Alert>
              ) : (
                <Box>
                  {formData.items.map((item, index) => (
                    <Box key={item.id} p={2} border={1} borderColor="grey.300" borderRadius={1} mb={1}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={4}>
                          <Typography variant="body2" fontWeight="bold">
                            {item.product_name}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <TextField
                            fullWidth
                            label="Số lượng"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <TextField
                            fullWidth
                            label="Đơn giá"
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <Typography variant="body2" fontWeight="bold">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND'
                            }).format(item.total_amount)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={1}>
                          <IconButton
                            onClick={() => removeItem(item.id)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                </Box>
              )}
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Tóm tắt đơn hàng
              </Typography>
              <Box p={2} border={1} borderColor="grey.300" borderRadius={1}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Nhà cung cấp
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {suppliers.find(s => s.id === formData.supplier_id)?.name || 'Chưa chọn'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Ngày giao hàng dự kiến
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {new Date(formData.expected_delivery_date).toLocaleDateString('vi-VN')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Số sản phẩm
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {formData.items.length} sản phẩm
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider />
                  </Grid>
                  <Grid item xs={12}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body1">Tổng tiền hàng:</Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(totalAmount)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body1">Thuế (10%):</Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(taxAmount)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider />
                  </Grid>
                  <Grid item xs={12}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="h6">Tổng cộng:</Typography>
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(finalAmount)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <ShoppingCartIcon />
              <Typography variant="h6">
                {editData ? 'Chỉnh sửa đơn nhập hàng' : 'Tạo đơn nhập hàng mới'}
              </Typography>
            </Box>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
            <Stepper activeStep={activeStep} orientation="horizontal">
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box sx={{ mt: 3 }}>
              {getStepContent(activeStep)}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Hủy
          </Button>
          {activeStep > 0 && (
            <Button onClick={handleBack} color="inherit">
              Quay lại
            </Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button
              onClick={handleNext}
              variant="contained"
              color="primary"
              disabled={activeStep === 0 && !formData.supplier_id}
            >
              Tiếp theo
            </Button>
          ) : (
            <Button
              onClick={handleConfirm}
              variant="contained"
              color="primary"
              disabled={!formData.supplier_id || formData.items.length === 0}
              startIcon={<CheckIcon />}
            >
              {editData ? 'Cập nhật' : 'Tạo đơn hàng'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default PurchaseOrderModal;
