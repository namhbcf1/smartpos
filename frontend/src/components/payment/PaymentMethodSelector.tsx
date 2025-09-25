/**
 * Payment Method Selector Component
 * Lựa chọn phương thức thanh toán cho ComputerPOS Pro
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Chip,
  Divider
} from '@mui/material';
import {
  CreditCard,
  AccountBalance,
  QrCode,
  Smartphone,
  Payment,
  MonetizationOn
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/currency';

export type PaymentMethod = 'cash' | 'card' | 'vnpay' | 'momo' | 'zalopay' | 'bank_transfer';

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  available: boolean;
  fee?: number;
  processingTime?: string;
}

interface PaymentMethodSelectorProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  onSelectMethod: (method: PaymentMethod) => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  open,
  onClose,
  amount,
  onSelectMethod
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  const paymentMethods: PaymentMethodOption[] = [
    {
      id: 'cash',
      name: 'Tiền mặt',
      description: 'Thanh toán bằng tiền mặt',
      icon: <MonetizationOn />,
      color: '#4CAF50',
      available: true,
      processingTime: 'Ngay lập tức'
    },
    {
      id: 'card',
      name: 'Thẻ tín dụng/ghi nợ',
      description: 'Thanh toán bằng thẻ ngân hàng',
      icon: <CreditCard />,
      color: '#2196F3',
      available: true,
      fee: amount * 0.02, // 2% phí
      processingTime: '1-2 phút'
    },
    {
      id: 'vnpay',
      name: 'VNPay',
      description: 'Ví điện tử VNPay, QR Code',
      icon: <QrCode />,
      color: '#FF5722',
      available: true,
      fee: amount * 0.015, // 1.5% phí
      processingTime: 'Ngay lập tức'
    },
    {
      id: 'momo',
      name: 'MoMo',
      description: 'Ví điện tử MoMo',
      icon: <Smartphone />,
      color: '#E91E63',
      available: true,
      fee: amount * 0.02, // 2% phí
      processingTime: 'Ngay lập tức'
    },
    {
      id: 'zalopay',
      name: 'ZaloPay',
      description: 'Ví điện tử ZaloPay',
      icon: <Payment />,
      color: '#0068FF',
      available: true,
      fee: amount * 0.018, // 1.8% phí
      processingTime: 'Ngay lập tức'
    },
    {
      id: 'bank_transfer',
      name: 'Chuyển khoản ngân hàng',
      description: 'Chuyển khoản trực tiếp',
      icon: <AccountBalance />,
      color: '#795548',
      available: true,
      fee: 0,
      processingTime: '5-10 phút'
    }
  ];

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
  };

  const handleConfirm = () => {
    if (selectedMethod) {
      onSelectMethod(selectedMethod);
      onClose();
    }
  };

  const calculateTotal = (method: PaymentMethodOption) => {
    return amount + (method.fee || 0);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h6">Chọn phương thức thanh toán</Typography>
        <Typography variant="body2" color="textSecondary">
          Số tiền: {formatCurrency(amount)}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={2}>
          {paymentMethods.map((method) => (
            <Grid item xs={12} sm={6} key={method.id} component="div">
              <Card 
                variant={selectedMethod === method.id ? "outlined" : "elevation"}
                sx={{ 
                  border: selectedMethod === method.id ? 2 : 0,
                  borderColor: selectedMethod === method.id ? method.color : 'transparent',
                  opacity: method.available ? 1 : 0.5
                }}
              >
                <CardActionArea
                  onClick={() => method.available && handleSelectMethod(method.id)}
                  disabled={!method.available}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Box 
                        sx={{ 
                          color: method.color,
                          mr: 1,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {method.icon}
                      </Box>
                      <Typography variant="h6" component="div">
                        {method.name}
                      </Typography>
                      {!method.available && (
                        <Chip 
                          label="Không khả dụng" 
                          size="small" 
                          color="error" 
                          sx={{ ml: 'auto' }}
                        />
                      )}
                    </Box>

                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {method.description}
                    </Typography>

                    <Box mt={2}>
                      <Grid container spacing={1}>
                        <Grid item xs={6} component="div">
                          <Typography variant="caption" color="textSecondary">
                            Thời gian xử lý:
                          </Typography>
                          <Typography variant="body2">
                            {method.processingTime}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} component="div">
                          <Typography variant="caption" color="textSecondary">
                            Phí giao dịch:
                          </Typography>
                          <Typography variant="body2">
                            {method.fee ? formatCurrency(method.fee) : 'Miễn phí'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>

                    {method.fee && method.fee > 0 && (
                      <>
                        <Divider sx={{ my: 1 }} />
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" color="textSecondary">
                            Tổng thanh toán:
                          </Typography>
                          <Typography variant="h6" color="primary">
                            {formatCurrency(calculateTotal(method))}
                          </Typography>
                        </Box>
                      </>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>

        {selectedMethod && (
          <Box mt={3} p={2} bgcolor="background.paper" borderRadius={1} border={1} borderColor="divider">
            <Typography variant="h6" gutterBottom>
              Thông tin thanh toán
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} component="div">
                <Typography variant="body2" color="textSecondary">
                  Phương thức:
                </Typography>
                <Typography variant="body1">
                  {paymentMethods.find(m => m.id === selectedMethod)?.name}
                </Typography>
              </Grid>
              <Grid item xs={6} component="div">
                <Typography variant="body2" color="textSecondary">
                  Số tiền gốc:
                </Typography>
                <Typography variant="body1">
                  {formatCurrency(amount)}
                </Typography>
              </Grid>
              {paymentMethods.find(m => m.id === selectedMethod)?.fee && (
                <>
                  <Grid item xs={6} component="div">
                    <Typography variant="body2" color="textSecondary">
                      Phí giao dịch:
                    </Typography>
                    <Typography variant="body1">
                      {formatCurrency(paymentMethods.find(m => m.id === selectedMethod)?.fee || 0)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} component="div">
                    <Typography variant="body2" color="textSecondary">
                      Tổng cộng:
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(calculateTotal(paymentMethods.find(m => m.id === selectedMethod)!))}
                    </Typography>
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Hủy
        </Button>
        <Button 
          onClick={handleConfirm}
          variant="contained"
          disabled={!selectedMethod}
        >
          Xác nhận thanh toán
        </Button>
      </DialogActions>
    </Dialog>
  );
};
