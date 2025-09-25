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
  Divider,
  Chip,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

interface PaymentItem {
  id: string;
  method: string;
  amount: number;
  reference?: string;
  notes?: string;
}

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (payments: PaymentItem[], change: number) => void;
  totalAmount: number;
  paymentMethods: PaymentMethod[];
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  onClose,
  onConfirm,
  totalAmount,
  paymentMethods
}) => {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [change, setChange] = useState(0);

  useEffect(() => {
    if (open) {
      setPayments([]);
      setTotalPaid(0);
      setChange(0);
    }
  }, [open]);

  useEffect(() => {
    const total = payments.reduce((sum, payment) => sum + payment.amount, 0);
    setTotalPaid(total);
    setChange(Math.max(0, total - totalAmount));
  }, [payments, totalAmount]);

  const addPayment = () => {
    const newPayment: PaymentItem = {
      id: Date.now().toString(),
      method: paymentMethods[0]?.code || 'CASH',
      amount: 0,
      reference: '',
      notes: ''
    };
    setPayments([...payments, newPayment]);
  };

  const updatePayment = (id: string, field: keyof PaymentItem, value: any) => {
    setPayments(payments.map(payment => 
      payment.id === id ? { ...payment, [field]: value } : payment
    ));
  };

  const removePayment = (id: string) => {
    setPayments(payments.filter(payment => payment.id !== id));
  };

  const handleConfirm = () => {
    if (totalPaid >= totalAmount) {
      onConfirm(payments, change);
      onClose();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ color: 'text.primary' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" sx={{ color: 'text.primary' }}>Thanh toán</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Payment Summary */}
          <Grid item xs={12} component="div">
            <Box p={2} bgcolor="grey.50" borderRadius={1}>
              <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
                Tổng tiền: {formatCurrency(totalAmount)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Đã thanh toán: {formatCurrency(totalPaid)}
              </Typography>
              <Typography 
                variant="h6" 
                color={change > 0 ? "success.main" : "error.main"}
              >
                {change > 0 ? `Tiền thừa: ${formatCurrency(change)}` : `Còn thiếu: ${formatCurrency(-change)}`}
              </Typography>
            </Box>
          </Grid>

          {/* Payment Methods */}
          <Grid item xs={12} component="div">
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" sx={{ color: 'text.primary' }}>Phương thức thanh toán</Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addPayment}
                size="small"
              >
                Thêm
              </Button>
            </Box>

            {payments.map((payment, index) => (
              <Box key={payment.id} mb={2} p={2} border={1} borderColor="grey.300" borderRadius={1}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={3} component="div">
                    <FormControl fullWidth size="small">
                      <InputLabel>Phương thức</InputLabel>
                      <Select
                        value={payment.method}
                        onChange={(e) => updatePayment(payment.id, 'method', e.target.value)}
                      >
                        {paymentMethods.map((method) => (
                          <MenuItem key={method.code} value={method.code}>
                            {method.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={3} component="div">
                    <TextField
                      fullWidth
                      size="small"
                      label="Số tiền"
                      type="number"
                      value={payment.amount}
                      onChange={(e) => updatePayment(payment.id, 'amount', parseFloat(e.target.value) || 0)}
                      InputProps={{
                        startAdornment: <Typography variant="body2" mr={1}>₫</Typography>
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={3} component="div">
                    <TextField
                      fullWidth
                      size="small"
                      label="Mã tham chiếu"
                      value={payment.reference}
                      onChange={(e) => updatePayment(payment.id, 'reference', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={2} component="div">
                    <IconButton
                      onClick={() => removePayment(payment.id)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>

                  <Grid item xs={12} component="div">
                    <TextField
                      fullWidth
                      size="small"
                      label="Ghi chú"
                      value={payment.notes}
                      onChange={(e) => updatePayment(payment.id, 'notes', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}

            {payments.length === 0 && (
              <Box textAlign="center" py={4} sx={{ color: 'text.secondary' }}>
                <ReceiptIcon fontSize="large" />
                <Typography variant="body2" mt={1} sx={{ color: 'text.secondary' }}>
                  Chưa có phương thức thanh toán nào
                </Typography>
              </Box>
            )}
          </Grid>
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
          disabled={totalPaid < totalAmount}
          startIcon={<ReceiptIcon />}
        >
          Xác nhận thanh toán
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentModal;
