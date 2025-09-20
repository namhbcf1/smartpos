import * as React from 'react';
import { useState } from 'react';
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
  Typography,
  Box,
  Grid
} from '@mui/material';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  total: number;
  onPayment: (paymentData: any) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  onClose,
  total,
  onPayment
}) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [receivedAmount, setReceivedAmount] = useState(total);

  const handlePayment = () => {
    onPayment({
      method: paymentMethod,
      amount: receivedAmount,
      total: total,
      change: Math.max(0, receivedAmount - total)
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Payment Processing</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6">
                Total: ${total.toFixed(2)}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  label="Payment Method"
                >
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="card">Card</MenuItem>
                  <MenuItem value="transfer">Bank Transfer</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Received Amount"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(Number(e.target.value))}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            {receivedAmount > total && (
              <Grid item xs={12}>
                <Typography variant="body1" color="success.main">
                  Change: ${(receivedAmount - total).toFixed(2)}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handlePayment}
          variant="contained"
          disabled={receivedAmount < total}
        >
          Process Payment
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentModal;