import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  FormControlLabel,
  Checkbox,
  LinearProgress,
} from '@mui/material';
import {
  Numbers as SerialIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  QrCodeScanner as ScanIcon,
  Security as WarrantyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import SerialNumberInput from './SerialNumberInput';
import api from '../../services/api';

interface CartItem {
  product: {
    id: number;
    name: string;
    sku: string;
    category_name?: string;
  };
  quantity: number;
  unit_price: number;
  total_price: number;
  serial_numbers?: string[];
  auto_warranty?: boolean;
}

interface SerialNumberAssignmentProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (itemsWithSerials: CartItem[]) => void;
  cartItems: CartItem[];
}

interface AvailableSerial {
  id: number;
  serial_number: string;
  product_id: number;
  status: string;
  location?: string;
}

const SerialNumberAssignment: React.FC<SerialNumberAssignmentProps> = ({
  open,
  onClose,
  onConfirm,
  cartItems,
}) => {
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableSerials, setAvailableSerials] = useState<{ [productId: number]: AvailableSerial[] }>({});
  const [errors, setErrors] = useState<{ [productId: number]: string }>({});

  // Initialize items when dialog opens
  useEffect(() => {
    if (open) {
      const initialItems = cartItems.map(item => ({
        ...item,
        serial_numbers: item.serial_numbers || [],
        auto_warranty: item.auto_warranty !== false, // Default to true
      }));
      setItems(initialItems);
      loadAvailableSerials();
    }
  }, [open, cartItems]);

  const loadAvailableSerials = async () => {
    try {
      setLoading(true);
      const productIds = cartItems.map(item => item.product.id);
      
      const serialsData: { [productId: number]: AvailableSerial[] } = {};
      
      for (const productId of productIds) {
        try {
          const response = await api.get(`/serial-numbers?product_id=${productId}&status=in_stock&limit=50`);
          if (response.data.success) {
            serialsData[productId] = response.data.data;
          }
        } catch (error) {
          console.error(`Error loading serials for product ${productId}:`, error);
          serialsData[productId] = [];
        }
      }
      
      setAvailableSerials(serialsData);
    } catch (error) {
      console.error('Error loading available serials:', error);
      enqueueSnackbar('Không thể tải danh sách serial numbers', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const updateItemSerials = (productId: number, serialNumbers: string[]) => {
    setItems(prev => prev.map(item => 
      item.product.id === productId 
        ? { ...item, serial_numbers: serialNumbers }
        : item
    ));
    
    // Clear error for this product
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[productId];
      return newErrors;
    });
  };

  const updateItemWarranty = (productId: number, autoWarranty: boolean) => {
    setItems(prev => prev.map(item => 
      item.product.id === productId 
        ? { ...item, auto_warranty: autoWarranty }
        : item
    ));
  };

  const validateSerialAssignments = () => {
    const newErrors: { [productId: number]: string } = {};
    let isValid = true;

    items.forEach(item => {
      const requiredCount = item.quantity;
      const assignedCount = item.serial_numbers?.length || 0;
      
      if (assignedCount !== requiredCount) {
        newErrors[item.product.id] = `Cần ${requiredCount} serial numbers, hiện có ${assignedCount}`;
        isValid = false;
      }
      
      // Check for duplicates within the item
      const serials = item.serial_numbers || [];
      const uniqueSerials = new Set(serials);
      if (serials.length !== uniqueSerials.size) {
        newErrors[item.product.id] = 'Có serial numbers trùng lặp';
        isValid = false;
      }
    });

    // Check for duplicates across items
    const allSerials: string[] = [];
    items.forEach(item => {
      if (item.serial_numbers) {
        allSerials.push(...item.serial_numbers);
      }
    });
    
    const uniqueAllSerials = new Set(allSerials);
    if (allSerials.length !== uniqueAllSerials.size) {
      // Find which products have duplicate serials
      const serialCounts: { [serial: string]: number } = {};
      allSerials.forEach(serial => {
        serialCounts[serial] = (serialCounts[serial] || 0) + 1;
      });
      
      const duplicates = Object.keys(serialCounts).filter(serial => serialCounts[serial] > 1);
      if (duplicates.length > 0) {
        items.forEach(item => {
          if (item.serial_numbers?.some(serial => duplicates.includes(serial))) {
            newErrors[item.product.id] = `Serial numbers bị trùng: ${duplicates.join(', ')}`;
          }
        });
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleConfirm = () => {
    if (validateSerialAssignments()) {
      onConfirm(items);
      onClose();
    }
  };

  const handleClose = () => {
    setItems([]);
    setErrors({});
    onClose();
  };

  const getSerialSuggestions = (productId: number): string[] => {
    const available = availableSerials[productId] || [];
    return available.map(serial => serial.serial_number);
  };

  const getTotalAssigned = () => {
    return items.reduce((total, item) => total + (item.serial_numbers?.length || 0), 0);
  };

  const getTotalRequired = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getWarrantyCount = () => {
    return items.filter(item => item.auto_warranty).length;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SerialIcon color="primary" />
          Gán Serial Numbers cho đơn hàng
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Summary */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Tổng quan
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4} component="div">
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {getTotalAssigned()}/{getTotalRequired()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Serial Numbers đã gán
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4} component="div">
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {items.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sản phẩm cần gán
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4} component="div">
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {getWarrantyCount()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tự động tạo bảo hành
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Items */}
        <Typography variant="h6" gutterBottom>
          Gán Serial Numbers cho từng sản phẩm
        </Typography>

        {items.map((item, index) => (
          <Card key={item.product.id} sx={{ mb: 2 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6} component="div">
                  <Typography variant="subtitle1" fontWeight="medium">
                    {item.product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    SKU: {item.product.sku} | Số lượng: {item.quantity}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Danh mục: {item.product.category_name || 'N/A'}
                  </Typography>
                  
                  {/* Available serials info */}
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={`${(availableSerials[item.product.id] || []).length} serial có sẵn`}
                      size="small"
                      color={(availableSerials[item.product.id] || []).length >= item.quantity ? 'success' : 'warning'}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={6} component="div">
                  <SerialNumberInput
                    value={item.serial_numbers || []}
                    onChange={(serials) => updateItemSerials(item.product.id, serials)}
                    label={`Serial Numbers (cần ${item.quantity})`}
                    placeholder="Nhập hoặc quét serial number..."
                    maxSerials={item.quantity}
                    showBarcodeScanner={true}
                    error={!!errors[item.product.id]}
                    helperText={errors[item.product.id]}
                  />

                  {/* Warranty option */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={item.auto_warranty || false}
                        onChange={(e) => updateItemWarranty(item.product.id, e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <WarrantyIcon fontSize="small" />
                        Tự động tạo bảo hành
                      </Box>
                    }
                    sx={{ mt: 1 }}
                  />
                </Grid>
              </Grid>

              {/* Quick add suggestions */}
              {(availableSerials[item.product.id] || []).length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Serial numbers có sẵn (click để thêm):
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {(availableSerials[item.product.id] || []).slice(0, 10).map((serial) => (
                      <Chip
                        key={serial.id}
                        label={serial.serial_number}
                        size="small"
                        variant="outlined"
                        clickable
                        onClick={() => {
                          const currentSerials = item.serial_numbers || [];
                          if (!currentSerials.includes(serial.serial_number) && currentSerials.length < item.quantity) {
                            updateItemSerials(item.product.id, [...currentSerials, serial.serial_number]);
                          }
                        }}
                        disabled={(item.serial_numbers || []).includes(serial.serial_number) || (item.serial_numbers || []).length >= item.quantity}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Validation Summary */}
        {Object.keys(errors).length > 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Cần khắc phục các lỗi sau:
            </Typography>
            <List dense>
              {Object.entries(errors).map(([productId, error]) => {
                const item = items.find(i => i.product.id === parseInt(productId));
                return (
                  <ListItem key={productId}>
                    <ListItemText
                      primary={item?.product.name}
                      secondary={error}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Alert>
        )}

        {/* Success Summary */}
        {Object.keys(errors).length === 0 && getTotalAssigned() === getTotalRequired() && getTotalRequired() > 0 && (
          <Alert severity="success" sx={{ mt: 2 }} icon={<CheckIcon />}>
            <Typography variant="subtitle2">
              ✅ Đã gán đủ serial numbers cho tất cả sản phẩm
            </Typography>
            {getWarrantyCount() > 0 && (
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                🛡️ Sẽ tự động tạo bảo hành cho {getWarrantyCount()} sản phẩm
              </Typography>
            )}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={loading || Object.keys(errors).length > 0 || getTotalAssigned() !== getTotalRequired()}
          startIcon={<CheckIcon />}
        >
          Xác nhận gán Serial Numbers
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SerialNumberAssignment;
