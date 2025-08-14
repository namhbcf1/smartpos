/**
 * VNPay Payment Component
 * Giao diện thanh toán VNPay cho ComputerPOS Pro
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency } from '../../utils/currency';
import api from '../../services/api';

interface VNPayPaymentProps {
  open: boolean;
  onClose: () => void;
  saleId: number;
  amount: number;
  orderInfo?: string;
  customerInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  onSuccess: (transactionId: string) => void;
  onError: (error: string) => void;
}

interface PaymentResponse {
  transactionId: string;
  paymentUrl: string;
  qrCode?: string;
}

export const VNPayPayment: React.FC<VNPayPaymentProps> = ({
  open,
  onClose,
  saleId,
  amount,
  orderInfo,
  customerInfo,
  onSuccess,
  onError
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(900); // 15 phút
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Tạo thanh toán VNPay
  const createPayment = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/payments/vnpay/create', {
        saleId,
        amount,
        orderInfo: orderInfo || `Thanh toán đơn hàng #${saleId}`,
        customerInfo
      });

      if (response.data.success) {
        setPaymentData(response.data.data);
        startStatusCheck(response.data.data.transactionId);
      } else {
        setError(response.data.message || 'Không thể tạo thanh toán');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra trạng thái thanh toán
  const checkPaymentStatus = async (transactionId: string) => {
    try {
      const response = await api.get(`/payments/status/${transactionId}`);
      
      if (response.data.success) {
        const status = response.data.data.status;
        
        if (status === 'completed') {
          onSuccess(transactionId);
          return true;
        } else if (status === 'failed' || status === 'cancelled') {
          onError('Thanh toán thất bại hoặc bị hủy');
          return true;
        }
      }
      
      return false;
    } catch (err) {
      console.error('Error checking payment status:', err);
      return false;
    }
  };

  // Bắt đầu kiểm tra trạng thái định kỳ
  const startStatusCheck = (transactionId: string) => {
    const interval = setInterval(async () => {
      setCheckingStatus(true);
      const completed = await checkPaymentStatus(transactionId);
      setCheckingStatus(false);
      
      if (completed) {
        clearInterval(interval);
      }
    }, 3000); // Kiểm tra mỗi 3 giây

    // Dọn dẹp sau 15 phút
    setTimeout(() => {
      clearInterval(interval);
    }, 900000);
  };

  // Đếm ngược thời gian
  useEffect(() => {
    if (!paymentData) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setError('Hết thời gian thanh toán');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentData]);

  // Tạo thanh toán khi mở dialog
  useEffect(() => {
    if (open && !paymentData) {
      createPayment();
    }
  }, [open]);

  // Reset khi đóng dialog
  useEffect(() => {
    if (!open) {
      setPaymentData(null);
      setError('');
      setTimeLeft(900);
      setCheckingStatus(false);
    }
  }, [open]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const openVNPayApp = () => {
    if (paymentData?.paymentUrl) {
      window.open(paymentData.paymentUrl, '_blank');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Thanh toán VNPay</Typography>
          {paymentData && (
            <Chip 
              label={`${formatTime(timeLeft)}`}
              color={timeLeft < 300 ? 'error' : 'primary'}
              variant="outlined"
            />
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box display="flex" flexDirection="column" alignItems="center" py={4}>
            <CircularProgress size={40} />
            <Typography variant="body2" sx={{ mt: 2 }}>
              Đang tạo thanh toán...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {paymentData && (
          <Box>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Thông tin thanh toán
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Số tiền:
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(amount)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Mã giao dịch:
                    </Typography>
                    <Typography variant="body2" fontFamily="monospace">
                      {paymentData.transactionId}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {paymentData.qrCode && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom align="center">
                    Quét mã QR để thanh toán
                  </Typography>
                  <Box display="flex" justifyContent="center" mb={2}>
                    <QRCodeSVG 
                      value={paymentData.paymentUrl}
                      size={200}
                      level="M"
                      includeMargin
                    />
                  </Box>
                  <Typography variant="body2" align="center" color="textSecondary">
                    Sử dụng app VNPay hoặc app ngân hàng để quét mã QR
                  </Typography>
                </CardContent>
              </Card>
            )}

            <Box display="flex" justifyContent="center" mb={2}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={openVNPayApp}
                sx={{ minWidth: 200 }}
              >
                Mở VNPay App
              </Button>
            </Box>

            {checkingStatus && (
              <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="textSecondary">
                  Đang kiểm tra trạng thái thanh toán...
                </Typography>
              </Box>
            )}

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                • Quét mã QR bằng app VNPay hoặc app ngân hàng<br/>
                • Hoặc nhấn "Mở VNPay App" để chuyển đến trang thanh toán<br/>
                • Hệ thống sẽ tự động cập nhật khi thanh toán thành công<br/>
                • Thời gian thanh toán: {formatTime(timeLeft)}
              </Typography>
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Đóng
        </Button>
        {paymentData && (
          <Button 
            onClick={() => checkPaymentStatus(paymentData.transactionId)}
            disabled={checkingStatus}
          >
            Kiểm tra lại
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
