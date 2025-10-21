import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  Divider
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Payment,
  Receipt,
  Home
} from '@mui/icons-material';

const VNPayReturnPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  useEffect(() => {
    const processPaymentResult = () => {
      const status = searchParams.get('status');
      const orderId = searchParams.get('orderId');
      const amount = searchParams.get('amount');
      const transactionNo = searchParams.get('transactionNo');
      const responseCode = searchParams.get('responseCode');
      const message = searchParams.get('message');

      const result = {
        status,
        orderId,
        amount: amount ? parseFloat(amount) : 0,
        transactionNo,
        responseCode,
        message: message ? decodeURIComponent(message) : null,
        timestamp: new Date().toISOString()
      };

      setPaymentResult(result);
      setLoading(false);
    };

    processPaymentResult();
  }, [searchParams]);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount);
  };

  const getStatusInfo = () => {
    if (!paymentResult) return null;

    switch (paymentResult.status) {
      case 'success':
        return {
          icon: <CheckCircle sx={{ fontSize: 64, color: 'success.main' }} />,
          title: 'Thanh toán thành công!',
          color: 'success' as const,
          description: 'Đơn hàng của bạn đã được thanh toán thành công.'
        };
      case 'failed':
        return {
          icon: <Error sx={{ fontSize: 64, color: 'error.main' }} />,
          title: 'Thanh toán thất bại',
          color: 'error' as const,
          description: paymentResult.message || 'Giao dịch không thành công.'
        };
      case 'error':
        return {
          icon: <Error sx={{ fontSize: 64, color: 'warning.main' }} />,
          title: 'Lỗi xử lý',
          color: 'warning' as const,
          description: paymentResult.message || 'Đã xảy ra lỗi trong quá trình xử lý.'
        };
      default:
        return {
          icon: <Payment sx={{ fontSize: 64, color: 'info.main' }} />,
          title: 'Đang xử lý...',
          color: 'info' as const,
          description: 'Vui lòng chờ trong giây lát.'
        };
    }
  };

  const getResponseCodeDescription = (code: string) => {
    const descriptions: Record<string, string> = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ',
      '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking',
      '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Đã hết hạn chờ thanh toán',
      '12': 'Thẻ/Tài khoản bị khóa',
      '13': 'Nhập sai mật khẩu xác thực giao dịch (OTP)',
      '24': 'Khách hàng hủy giao dịch',
      '51': 'Tài khoản không đủ số dư',
      '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày',
      '75': 'Ngân hàng thanh toán đang bảo trì',
      '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định',
      '99': 'Các lỗi khác'
    };
    return descriptions[code] || 'Mã lỗi không xác định';
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh' 
      }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={60} />
          <Typography variant="h6">Đang xử lý kết quả thanh toán...</Typography>
        </Stack>
      </Box>
    );
  }

  if (!paymentResult) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
        <Alert severity="error">
          <Typography variant="h6">Không thể xử lý kết quả thanh toán</Typography>
          <Typography variant="body2">
            Vui lòng liên hệ với chúng tôi để được hỗ trợ.
          </Typography>
        </Alert>
      </Box>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Card>
        <CardContent sx={{ textAlign: 'center', p: 4 }}>
          {/* Status Icon */}
          <Box sx={{ mb: 3 }}>
            {statusInfo?.icon}
          </Box>

          {/* Status Title */}
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {statusInfo?.title}
          </Typography>

          {/* Status Description */}
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {statusInfo?.description}
          </Typography>

          {/* Payment Details */}
          <Card variant="outlined" sx={{ mb: 3, textAlign: 'left' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Receipt />
                Chi tiết giao dịch
              </Typography>
              
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Mã đơn hàng:</Typography>
                  <Typography variant="body2" fontWeight="bold">{paymentResult.orderId}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Số tiền:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    {formatVND(paymentResult.amount)}
                  </Typography>
                </Box>

                {paymentResult.transactionNo && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Mã giao dịch:</Typography>
                    <Typography variant="body2" fontWeight="bold">{paymentResult.transactionNo}</Typography>
                  </Box>
                )}

                {paymentResult.responseCode && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Mã phản hồi:</Typography>
                    <Chip 
                      label={paymentResult.responseCode} 
                      size="small" 
                      color={paymentResult.responseCode === '00' ? 'success' : 'error'}
                    />
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Thời gian:</Typography>
                  <Typography variant="body2">
                    {new Date(paymentResult.timestamp).toLocaleString('vi-VN')}
                  </Typography>
                </Box>
              </Stack>

              {paymentResult.responseCode && paymentResult.responseCode !== '00' && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>Mô tả lỗi:</strong> {getResponseCodeDescription(paymentResult.responseCode)}
                    </Typography>
                  </Alert>
                </>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="outlined"
              startIcon={<Home />}
              onClick={() => navigate('/')}
            >
              Về trang chủ
            </Button>
            
            <Button
              variant="contained"
              startIcon={<Receipt />}
              onClick={() => navigate('/orders')}
            >
              Xem đơn hàng
            </Button>
          </Stack>

          {/* Additional Info */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua hotline hoặc email.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default VNPayReturnPage;
