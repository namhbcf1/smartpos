import React, { useState } from 'react';
import { Button, Box, Container, Paper, Typography } from '@mui/material';
import EnhancedPaymentModal from './EnhancedPaymentModal';
import toast from 'react-hot-toast';

// Demo data
const sampleItems = [
  {
    id: '1',
    name: 'Laptop Dell Inspiron 15',
    quantity: 1,
    price: 15000000,
    total: 15000000
  },
  {
    id: '2',
    name: 'Mouse Logitech MX Master',
    quantity: 2,
    price: 2500000,
    total: 5000000
  },
  {
    id: '3',
    name: 'Keyboard Mechanical RGB',
    quantity: 1,
    price: 1800000,
    total: 1800000
  }
];

const sampleCustomers = [
  {
    id: '1',
    name: 'Nguyễn Văn A',
    phone: '0123456789',
    email: 'nguyenvana@example.com'
  },
  {
    id: '2',
    name: 'Trần Thị B',
    phone: '0987654321',
    email: 'tranthib@example.com'
  },
  {
    id: '3',
    name: 'Lê Văn C',
    phone: '0369852147',
    email: 'levanc@example.com'
  }
];

export default function PaymentModalDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = sampleItems.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.1; // 10% VAT
  const total = subtotal + tax;

  const handlePayment = async (paymentData: any) => {
    setIsProcessing(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('Payment Data:', paymentData);

      toast.success(`Thanh toán thành công ${paymentData.payment.method}!`);
      setIsModalOpen(false);

      // Reset form or redirect
    } catch (error) {
      toast.error('Thanh toán thất bại!');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
          Demo Modal Thanh Toán Mới
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Modal thanh toán được thiết kế lại với giao diện đẹp, dễ dùng và đầy đủ thông tin
        </Typography>

        {/* Sample Order Summary */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3, bgcolor: '#f8f9fa' }}>
          <Typography variant="h6" gutterBottom fontWeight="600">
            Đơn hàng mẫu:
          </Typography>

          {sampleItems.map((item) => (
            <Box key={item.id} sx={{
              display: 'flex',
              justifyContent: 'space-between',
              py: 1,
              borderBottom: '1px solid #e0e0e0'
            }}>
              <Typography variant="body2">
                {item.name} × {item.quantity}
              </Typography>
              <Typography variant="body2" fontWeight="500">
                {formatCurrency(item.total)}
              </Typography>
            </Box>
          ))}

          <Box sx={{ pt: 2, mt: 2, borderTop: '2px solid #e0e0e0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Tạm tính:</Typography>
              <Typography>{formatCurrency(subtotal)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Thuế (10%):</Typography>
              <Typography>{formatCurrency(tax)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" fontWeight="bold">Tổng cộng:</Typography>
              <Typography variant="h6" fontWeight="bold" color="primary">
                {formatCurrency(total)}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Features List */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom fontWeight="600">
            Tính năng cải tiến:
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <li>✨ Giao diện Material UI đẹp mắt với gradient và animation</li>
            <li>🎯 Chia nhóm thông tin rõ ràng (Khách hàng, Đơn hàng, Thanh toán)</li>
            <li>🔍 Tự động tìm kiếm khách hàng khi nhập số điện thoại</li>
            <li>💳 Hiển thị icon và mô tả cho từng phương thức thanh toán</li>
            <li>⚡ Nút chọn nhanh số tiền cho thanh toán tiền mặt</li>
            <li>💰 Hiển thị tiền thừa rõ ràng với màu sắc và icon</li>
            <li>📱 Responsive design cho mobile và desktop</li>
            <li>🎨 Auto focus và UX tối ưu cho việc nhập liệu</li>
            <li>⏳ Loading state và disable khi đang xử lý</li>
          </Box>
        </Box>

        <Button
          variant="contained"
          size="large"
          onClick={() => setIsModalOpen(true)}
          sx={{
            borderRadius: 2,
            px: 4,
            py: 1.5,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
            }
          }}
        >
          Mở Modal Thanh Toán
        </Button>

        <EnhancedPaymentModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onPayment={handlePayment}
          items={sampleItems}
          subtotal={subtotal}
          tax={tax}
          total={total}
          customers={sampleCustomers}
          isProcessing={isProcessing}
        />
      </Paper>
    </Container>
  );
}
