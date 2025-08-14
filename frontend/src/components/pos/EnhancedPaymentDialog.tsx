import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { SerialSelectionDialog } from './SerialSelectionDialog';
import api from '../../services/api';

interface CartItem {
  id: number;
  product: {
    id: number;
    name: string;
    sku: string;
    track_quantity?: boolean;
  };
  quantity: number;
  unit_price: number;
  total_price: number;
  selected_serials?: string[];
  auto_assign_serials?: boolean;
}

interface EnhancedPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (saleData: any) => void;
  cartItems: CartItem[];
  subtotal: number;
  discountAmount?: number;
  customerId?: number;
}

export const EnhancedPaymentDialog: React.FC<EnhancedPaymentDialogProps> = ({
  open,
  onClose,
  onSuccess,
  cartItems,
  subtotal,
  discountAmount = 0,
  customerId,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer' | 'mobile_payment'>('cash');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serialDialogOpen, setSerialDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<CartItem | null>(null);
  const [itemsWithSerials, setItemsWithSerials] = useState<Map<number, { serials: string[], autoAssign: boolean }>>(new Map());

  const taxAmount = (subtotal - discountAmount) * 0.1; // 10% tax
  const finalAmount = subtotal - discountAmount + taxAmount;

  const handleSerialSelection = (item: CartItem) => {
    setCurrentItem(item);
    setSerialDialogOpen(true);
  };

  const handleSerialConfirm = (selectedSerials: string[], autoAssign: boolean) => {
    if (currentItem) {
      setItemsWithSerials(prev => new Map(prev.set(currentItem.id, {
        serials: selectedSerials,
        autoAssign
      })));
    }
    setSerialDialogOpen(false);
    setCurrentItem(null);
  };

  const getItemSerialStatus = (item: CartItem) => {
    const serialData = itemsWithSerials.get(item.id);
    if (!serialData) return 'not_configured';
    if (serialData.autoAssign) return 'auto_assign';
    return 'manual_select';
  };

  const getItemSerialDisplay = (item: CartItem) => {
    const serialData = itemsWithSerials.get(item.id);
    if (!serialData) return 'Chưa cấu hình';
    if (serialData.autoAssign) return 'Tự động gán';
    return `${serialData.serials.length} serial đã chọn`;
  };

  const canProcessPayment = () => {
    // Check if all items that need serial numbers have been configured
    for (const item of cartItems) {
      if (item.product.track_quantity && !itemsWithSerials.has(item.id)) {
        return false;
      }
    }
    return true;
  };

  const handlePayment = async () => {
    if (!canProcessPayment()) {
      setError('Vui lòng cấu hình serial numbers cho tất cả sản phẩm');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      // Prepare payment data
      const paymentData = {
        items: cartItems.map(item => {
          const serialData = itemsWithSerials.get(item.id);
          return {
            product_id: item.product.id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            selected_serials: serialData?.serials || [],
            auto_assign_serials: serialData?.autoAssign || false,
          };
        }),
        customer_id: customerId,
        payment_method: paymentMethod,
        payment_amount: parseFloat(paymentAmount) || finalAmount,
        discount_amount: discountAmount,
        auto_create_warranty: true,
      };

      console.log('🔄 Processing payment with serial selection:', paymentData);

      const response = await api.post('/pos-payment/process', paymentData);

      console.log('✅ Payment processed successfully:', response);

      onSuccess(response);
      onClose();

    } catch (error) {
      console.error('❌ Payment processing failed:', error);
      setError('Lỗi xử lý thanh toán. Vui lòng thử lại.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    if (!processing) {
      onClose();
    }
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { minHeight: '600px' }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <PaymentIcon color="primary" />
            <Typography variant="h6">
              Thanh toán
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Serial Number Configuration */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Cấu hình Serial Numbers
            </Typography>
            <List>
              {cartItems.map((item) => (
                <ListItem key={item.id} divider>
                  <ListItemText
                    primary={item.product.name}
                    secondary={`${item.product.sku} - Số lượng: ${item.quantity}`}
                  />
                  <ListItemSecondaryAction>
                    {item.product.track_quantity ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={getItemSerialDisplay(item)}
                          color={getItemSerialStatus(item) === 'not_configured' ? 'error' : 'success'}
                          variant="outlined"
                          size="small"
                        />
                        <IconButton
                          onClick={() => handleSerialSelection(item)}
                          color="primary"
                        >
                          <SettingsIcon />
                        </IconButton>
                      </Box>
                    ) : (
                      <Chip
                        label="Không cần serial"
                        color="default"
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Payment Method */}
          <Box sx={{ mb: 3 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Phương thức thanh toán</FormLabel>
              <RadioGroup
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                row
              >
                <FormControlLabel value="cash" control={<Radio />} label="Tiền mặt" />
                <FormControlLabel value="card" control={<Radio />} label="Thẻ" />
                <FormControlLabel value="bank_transfer" control={<Radio />} label="Chuyển khoản" />
                <FormControlLabel value="mobile_payment" control={<Radio />} label="Ví điện tử" />
              </RadioGroup>
            </FormControl>
          </Box>

          {/* Payment Amount */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Số tiền thanh toán"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder={finalAmount.toLocaleString('vi-VN')}
              InputProps={{
                endAdornment: <Typography>₫</Typography>,
              }}
            />
          </Box>

          {/* Payment Summary */}
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Tóm tắt thanh toán
            </Typography>
            <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography>Tạm tính:</Typography>
              <Typography>{subtotal.toLocaleString('vi-VN')} ₫</Typography>
            </Box>
            {discountAmount > 0 && (
              <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography>Giảm giá:</Typography>
                <Typography color="error">-{discountAmount.toLocaleString('vi-VN')} ₫</Typography>
              </Box>
            )}
            <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography>Thuế (10%):</Typography>
              <Typography>{taxAmount.toLocaleString('vi-VN')} ₫</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box display="flex" justifyContent="space-between">
              <Typography variant="h6">Tổng cộng:</Typography>
              <Typography variant="h6" color="primary">
                {finalAmount.toLocaleString('vi-VN')} ₫
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={processing}>
            Hủy
          </Button>
          <Button
            onClick={handlePayment}
            variant="contained"
            disabled={processing || !canProcessPayment()}
            startIcon={processing ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            {processing ? 'Đang xử lý...' : 'Thanh toán'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Serial Selection Dialog */}
      <SerialSelectionDialog
        open={serialDialogOpen}
        onClose={() => setSerialDialogOpen(false)}
        onConfirm={handleSerialConfirm}
        product={currentItem?.product || null}
        quantity={currentItem?.quantity || 0}
      />
    </>
  );
};
