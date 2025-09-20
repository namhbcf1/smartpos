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
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  unit_of_measure: string;
}

interface Location {
  id: string;
  name: string;
  address: string;
  is_active: boolean;
}

interface StockMovementItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  notes?: string;
}

interface StockMovementModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: StockMovementData) => void;
  type: 'in' | 'out' | 'transfer' | 'adjustment';
  products: Product[];
  locations: Location[];
}

interface StockMovementData {
  type: string;
  location_id: string;
  to_location_id?: string;
  reference_number: string;
  date: string;
  notes: string;
  items: StockMovementItem[];
}

const StockMovementModal: React.FC<StockMovementModalProps> = ({
  open,
  onClose,
  onConfirm,
  type,
  products,
  locations
}) => {
  const [formData, setFormData] = useState<StockMovementData>({
    type: type,
    location_id: '',
    to_location_id: '',
    reference_number: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    items: []
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newItem, setNewItem] = useState<Partial<StockMovementItem>>({
    quantity: 0,
    unit_price: 0,
    notes: ''
  });

  useEffect(() => {
    if (open) {
      setFormData({
        type: type,
        location_id: '',
        to_location_id: '',
        reference_number: generateReferenceNumber(),
        date: new Date().toISOString().split('T')[0],
        notes: '',
        items: []
      });
      setSelectedProduct(null);
      setNewItem({ quantity: 0, unit_price: 0, notes: '' });
    }
  }, [open, type]);

  const generateReferenceNumber = () => {
    const prefix = type === 'in' ? 'SI' : type === 'out' ? 'SO' : type === 'transfer' ? 'ST' : 'SA';
    return `${prefix}-${Date.now()}`;
  };

  const addItem = () => {
    if (!selectedProduct || !newItem.quantity || newItem.quantity <= 0) {
      return;
    }

    const item: StockMovementItem = {
      id: Date.now().toString(),
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      quantity: newItem.quantity!,
      unit_price: newItem.unit_price || 0,
      total_amount: (newItem.quantity! * (newItem.unit_price || 0)),
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

  const updateItem = (id: string, field: keyof StockMovementItem, value: any) => {
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

  const handleConfirm = () => {
    if (!formData.location_id || formData.items.length === 0) {
      return;
    }

    if (type === 'transfer' && !formData.to_location_id) {
      return;
    }

    onConfirm(formData);
    onClose();
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'in': return 'Nhập kho';
      case 'out': return 'Xuất kho';
      case 'transfer': return 'Chuyển kho';
      case 'adjustment': return 'Điều chỉnh tồn kho';
      default: return 'Di chuyển kho';
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'in': return 'success';
      case 'out': return 'error';
      case 'transfer': return 'info';
      case 'adjustment': return 'warning';
      default: return 'default';
    }
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + item.total_amount, 0);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <InventoryIcon />
              <Typography variant="h6">{getTypeLabel()}</Typography>
              <Chip label={getTypeLabel()} color={getTypeColor()} size="small" />
            </Box>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={3}>
            {/* Header Information */}
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Số phiếu"
                    value={formData.reference_number}
                    onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Ngày"
                    value={new Date(formData.date)}
                    onChange={(date) => setFormData({ ...formData, date: date?.toISOString().split('T')[0] || '' })}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} sm={type === 'transfer' ? 6 : 12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Kho {type === 'transfer' ? 'nguồn' : ''}</InputLabel>
                    <Select
                      value={formData.location_id}
                      onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                    >
                      {locations.map((location) => (
                        <MenuItem key={location.id} value={location.id}>
                          {location.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {type === 'transfer' && (
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Kho đích</InputLabel>
                      <Select
                        value={formData.to_location_id}
                        onChange={(e) => setFormData({ ...formData, to_location_id: e.target.value })}
                      >
                        {locations.filter(loc => loc.id !== formData.location_id).map((location) => (
                          <MenuItem key={location.id} value={location.id}>
                            {location.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Ghi chú"
                    multiline
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    size="small"
                  />
                </Grid>
              </Grid>
            </Grid>

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
                      onChange={(_, newValue) => setSelectedProduct(newValue)}
                      renderInput={(params) => (
                        <TextField {...params} label="Sản phẩm" size="small" />
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
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      label="Đơn giá"
                      type="number"
                      value={newItem.unit_price}
                      onChange={(e) => setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) || 0 })}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Ghi chú"
                      value={newItem.notes}
                      onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={1}>
                    <Button
                      variant="contained"
                      onClick={addItem}
                      disabled={!selectedProduct || !newItem.quantity}
                      startIcon={<AddIcon />}
                      size="small"
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

            {/* Total Summary */}
            {formData.items.length > 0 && (
              <Grid item xs={12}>
                <Box p={2} bgcolor="grey.50" borderRadius={1}>
                  <Typography variant="h6" align="right">
                    Tổng tiền: {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(totalAmount)}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color="primary"
            disabled={!formData.location_id || formData.items.length === 0}
            startIcon={<InventoryIcon />}
          >
            Xác nhận {getTypeLabel()}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default StockMovementModal;
