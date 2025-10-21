import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  Grid,
  TextField
} from '@mui/material';
import {
  Payment,
  CreditCard,
  AccountBalance,
  PhoneAndroid,
  QrCode
} from '@mui/icons-material';
import api from '../../services/api';

interface VNPayPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  orderData: {
    orderId: string;
    amount: number;
    orderDescription: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    customerAddress?: string;
  };
  onSuccess: (paymentUrl: string) => void;
  onError: (error: string) => void;
}

const VNPayPaymentDialog: React.FC<VNPayPaymentDialogProps> = ({
  open,
  onClose,
  orderData,
  onSuccess,
  onError
}) => {
  const [selectedBank, setSelectedBank] = useState('');
  const [customerName, setCustomerName] = useState(orderData.customerName || '');
  const [customerEmail, setCustomerEmail] = useState(orderData.customerEmail || '');
  const [customerPhone, setCustomerPhone] = useState(orderData.customerPhone || '');
  const [customerAddress, setCustomerAddress] = useState(orderData.customerAddress || '');
  const [loading, setLoading] = useState(false);
  const [availableBanks, setAvailableBanks] = useState<any[]>([]);

  // Load available banks when dialog opens
  React.useEffect(() => {
    if (open) {
      loadAvailableBanks();
    }
  }, [open]);

  const loadAvailableBanks = async () => {
    try {
      const response = await api.get('/payments/vnpay/banks');
      if (response.data.success) {
        setAvailableBanks(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading banks:', error);
    }
  };

  const handlePayment = async () => {
    try {
      setLoading(true);

      const response = await api.post('/payments/vnpay/create-payment-url', {
        orderId: orderData.orderId,
        amount: orderData.amount,
        orderDescription: orderData.orderDescription,
        bankCode: selectedBank || undefined,
        ipAddress: '127.0.0.1', // In production, get real IP
        customerName: customerName || 'Khách hàng',
        customerEmail: customerEmail || '',
        customerPhone: customerPhone || '',
        customerAddress: customerAddress || ''
      });

      if (response.data.success) {
        onSuccess(response.data.data.paymentUrl);
        onClose();
      } else {
        onError(response.data.error || 'Failed to create payment URL');
      }
    } catch (error: any) {
      console.error('VNPay payment error:', error);
      onError(error.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount);
  };

  const getBankIcon = (bankCode: string) => {
    switch (bankCode) {
      case 'VNPAYQR':
        return <QrCode />;
      case 'VNBANK':
      case 'INTCARD':
        return <CreditCard />;
      case 'MOMO':
      case 'ZALOPAY':
      case 'VIETTELPAY':
        return <PhoneAndroid />;
      default:
        return <AccountBalance />;
    }
  };

  const getBankCategory = (bankCode: string) => {
    if (['VNPAYQR', 'VNBANK', 'INTCARD'].includes(bankCode)) {
      return 'primary';
    }
    if (['MOMO', 'ZALOPAY', 'VIETTELPAY', 'AIRPAY', 'VNPAY'].includes(bankCode)) {
      return 'secondary';
    }
    return 'default';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Payment color="primary" />
        <Typography variant="h6">Thanh toán VNPay</Typography>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Order Summary */}
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Thông tin đơn hàng
            </Typography>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Mã đơn hàng:</Typography>
                <Typography variant="body2" fontWeight="bold">{orderData.orderId}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Mô tả:</Typography>
                <Typography variant="body2">{orderData.orderDescription}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Số tiền:</Typography>
                <Typography variant="body2" fontWeight="bold" color="primary">
                  {formatVND(orderData.amount)}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Customer Information */}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Thông tin khách hàng
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Họ và tên"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Số điện thoại"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Địa chỉ"
                  multiline
                  rows={2}
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Bank Selection */}
          <FormControl fullWidth>
            <InputLabel>Chọn phương thức thanh toán</InputLabel>
            <Select
              value={selectedBank}
              label="Chọn phương thức thanh toán"
              onChange={(e) => setSelectedBank(e.target.value)}
            >
              <MenuItem value="">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Payment />
                  <Typography>Chọn phương thức thanh toán</Typography>
                </Box>
              </MenuItem>
              {availableBanks.map((bank) => (
                <MenuItem key={bank.code} value={bank.code}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    {getBankIcon(bank.code)}
                    <Typography sx={{ flex: 1 }}>{bank.name}</Typography>
                    <Chip 
                      label={bank.code} 
                      size="small" 
                      color={getBankCategory(bank.code) as any}
                      variant="outlined"
                    />
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Information */}
          <Alert severity="info">
            <Typography variant="body2">
              • Bạn sẽ được chuyển hướng đến trang thanh toán VNPay
              <br />
              • Sau khi thanh toán thành công, bạn sẽ được chuyển về trang web
              <br />
              • Đơn hàng sẽ được cập nhật tự động sau khi thanh toán
            </Typography>
          </Alert>

          {/* Security Notice */}
          <Alert severity="success">
            <Typography variant="body2">
              🔒 Thanh toán được bảo mật bởi VNPay - Cổng thanh toán uy tín hàng đầu Việt Nam
            </Typography>
          </Alert>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={handlePayment}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Payment />}
        >
          {loading ? 'Đang xử lý...' : 'Thanh toán VNPay'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VNPayPaymentDialog;
