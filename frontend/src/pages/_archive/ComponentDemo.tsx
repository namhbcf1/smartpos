import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Divider,
  Button,
  Alert
} from '@mui/material';
import {
  Science as DemoIcon,
  QrCodeScanner,
  Inventory,
  Numbers
} from '@mui/icons-material';
import BarcodeScanner from '../../components/BarcodeScanner';
import ProductSelector from '../../components/ProductSelector';
import SerialNumberInput from '../../components/SerialNumberInput';

interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  category_name: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
}

const ComponentDemo = () => {
  // BarcodeScanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedCode, setScannedCode] = useState<string>('');

  // ProductSelector state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // SerialNumberInput state
  const [serialNumbers, setSerialNumbers] = useState<string[]>([]);

  const handleBarcodeScanned = (barcode: string) => {
    setScannedCode(barcode);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DemoIcon color="primary" />
        Demo Components - Tính năng mới cho Stock-In
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Đây là trang demo để test các component mới được tạo cho tính năng Stock-In thông minh.
        Các component này đã được tích hợp vào trang Stock-In chính.
      </Alert>

      <Grid container spacing={3}>
        {/* Barcode Scanner Demo */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <QrCodeScanner color="primary" />
                Barcode Scanner
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Quét mã vạch bằng camera để tự động nhận diện sản phẩm.
              </Typography>

              <Button
                variant="contained"
                onClick={() => setScannerOpen(true)}
                startIcon={<QrCodeScanner />}
                fullWidth
                sx={{ mb: 2 }}
              >
                Mở Camera Quét
              </Button>

              {scannedCode && (
                <Alert severity="success">
                  <Typography variant="body2">
                    <strong>Mã đã quét:</strong> {scannedCode}
                  </Typography>
                </Alert>
              )}

              <Typography variant="caption" color="text.secondary">
                Hỗ trợ các định dạng: Code128, EAN13, QR Code, v.v.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Product Selector Demo */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Inventory color="primary" />
                Product Selector
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Tìm kiếm và chọn sản phẩm thông minh với autocomplete và barcode scanner.
              </Typography>

              <ProductSelector
                value={selectedProduct}
                onChange={setSelectedProduct}
                label="Chọn sản phẩm"
                placeholder="Tìm kiếm hoặc quét mã vạch..."
                showBarcodeScanner={true}
              />

              {selectedProduct && (
                <Box sx={{ mt: 2 }}>
                  <Alert severity="success">
                    <Typography variant="body2">
                      <strong>Đã chọn:</strong> {selectedProduct.name}
                    </Typography>
                    <Typography variant="caption" display="block">
                      SKU: {selectedProduct.sku} | Tồn: {selectedProduct.stock_quantity}
                    </Typography>
                  </Alert>
                </Box>
              )}

              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Tìm kiếm theo tên, SKU, barcode. Hiển thị thông tin chi tiết sản phẩm.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Serial Number Input Demo */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Numbers color="primary" />
                Serial Number Input
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Nhập serial numbers thay vì số lượng. Hỗ trợ quét barcode và nhập hàng loạt.
              </Typography>

              <SerialNumberInput
                value={serialNumbers}
                onChange={setSerialNumbers}
                label="Serial Numbers"
                placeholder="Nhập hoặc quét serial..."
                showBarcodeScanner={true}
                maxSerials={50}
              />

              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Số lượng tự động = số serial numbers. Hỗ trợ validation trùng lặp.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Integration Info */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tích hợp vào Stock-In
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    ✅ Tính năng đã cải tiến:
                  </Typography>
                  <ul>
                    <li>Chọn sản phẩm thông minh với autocomplete</li>
                    <li>Quét mã vạch để tự động chọn sản phẩm</li>
                    <li>Nhập số lượng bằng serial numbers</li>
                    <li>Giao diện tabs cho các phương thức nhập khác nhau</li>
                    <li>Validation và error handling tốt hơn</li>
                    <li>Hiển thị thông tin chi tiết sản phẩm</li>
                  </ul>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    🚀 Cải tiến UX/UI:
                  </Typography>
                  <ul>
                    <li>Dialog lớn hơn với layout tốt hơn</li>
                    <li>Switch để bật/tắt chế độ serial numbers</li>
                    <li>Hiển thị số lượng serial trong bảng</li>
                    <li>Animations và transitions mượt mà</li>
                    <li>Responsive design cho mobile</li>
                    <li>Accessibility support</li>
                  </ul>
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Cách sử dụng:</strong> Truy cập trang Stock-In để trải nghiệm các tính năng mới. 
                  Tất cả components đã được tích hợp và sẵn sàng sử dụng.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Barcode Scanner Component */}
      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleBarcodeScanned}
        title="Demo Barcode Scanner"
      />
    </Container>
  );
};

export default ComponentDemo;
