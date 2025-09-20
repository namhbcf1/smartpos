import React from 'react';
import { Container, Typography, Box, Grid, Paper } from '@mui/material';
import ShippingTracker from '../components/shipping/ShippingTracker';

export default function ShippingDemo() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        🚚 Demo Tích Hợp Tra Cứu Vận Đơn
      </Typography>

      <Typography variant="h6" gutterBottom align="center" color="textSecondary" sx={{ mb: 4 }}>
        Hỗ trợ 3 phương pháp: Iframe, Widget JS, và API
      </Typography>

      <Grid container spacing={4}>
        {/* Main Tracking Component */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <ShippingTracker />
          </Paper>
        </Grid>

        {/* Documentation */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              📖 Hướng Dẫn Sử Dụng
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              1. Iframe Embedding
            </Typography>
            <Typography variant="body2" paragraph>
              Nhúng trực tiếp iframe từ các nhà vận chuyển:
            </Typography>
            <Box component="pre" sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1, fontSize: '0.8rem', overflow: 'auto' }}>
{`<iframe
  src="/api/v1/shipping/embed/ghn/GHN123456"
  width="100%"
  height="400"
  frameborder="0">
</iframe>`}
            </Box>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              2. JavaScript Widget
            </Typography>
            <Typography variant="body2" paragraph>
              Sử dụng widget JS cho tính tương tác cao:
            </Typography>
            <Box component="pre" sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1, fontSize: '0.8rem', overflow: 'auto' }}>
{`<script src="/api/v1/shipping/widget.js"></script>
<div id="shipping-widget"></div>
<script>
  ShippingWidget.track({
    element: '#shipping-widget',
    trackingNumber: 'GHN123456',
    provider: 'ghn'
  });
</script>`}
            </Box>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              3. REST API
            </Typography>
            <Typography variant="body2" paragraph>
              Gọi API để lấy dữ liệu JSON:
            </Typography>
            <Box component="pre" sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1, fontSize: '0.8rem', overflow: 'auto' }}>
{`fetch('/api/v1/shipping/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    trackingNumber: 'GHN123456',
    provider: 'ghn'
  })
})
.then(res => res.json())
.then(data => console.log(data));`}
            </Box>
          </Paper>
        </Grid>

        {/* Supported Providers */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              🏢 Nhà Vận Chuyển Hỗ Trợ
            </Typography>

            <Box sx={{ mt: 2 }}>
              {[
                { id: 'ghn', name: 'Giao Hàng Nhanh', status: '✅ API + Iframe' },
                { id: 'ghtk', name: 'Giao Hàng Tiết Kiệm', status: '✅ API + Widget' },
                { id: 'vnpost', name: 'VNPost', status: '✅ Iframe + Mock Data' },
                { id: 'viettelpost', name: 'Viettel Post', status: '✅ API + Iframe' },
                { id: 'jnt', name: 'J&T Express', status: '✅ Widget + API' }
              ].map((provider) => (
                <Box key={provider.id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {provider.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {provider.status}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              📊 Tính Năng
            </Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              <Typography component="li" variant="body2">Real-time tracking data</Typography>
              <Typography component="li" variant="body2">Multiple integration methods</Typography>
              <Typography component="li" variant="body2">Responsive design</Typography>
              <Typography component="li" variant="body2">Auto-refresh capability</Typography>
              <Typography component="li" variant="body2">Error handling & fallbacks</Typography>
              <Typography component="li" variant="body2">Logging & analytics</Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Examples */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              🧪 Mã Vận Đơn Test
            </Typography>

            <Typography variant="body1" paragraph>
              Sử dụng các mã vận đơn sau để test hệ thống:
            </Typography>

            <Grid container spacing={2}>
              {[
                { provider: 'GHN', code: 'GHN123456789', description: 'Đơn hàng đang vận chuyển từ HN về HCM' },
                { provider: 'GHTK', code: 'GHTK987654321', description: 'Đơn hàng đã đến kho phân loại' },
                { provider: 'VNPost', code: 'VN2024001234', description: 'Đơn hàng chờ giao' },
                { provider: 'Viettel Post', code: 'VTP240117001', description: 'Đơn hàng đã giao thành công' },
                { provider: 'J&T', code: 'JT24011700123', description: 'Đơn hàng đang lấy từ người gửi' }
              ].map((example) => (
                <Grid item xs={12} sm={6} md={4} key={example.code}>
                  <Box sx={{ p: 2, border: '1px solid', borderColor: 'grey.300', borderRadius: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold" color="primary">
                      {example.provider}
                    </Typography>
                    <Typography variant="body2" fontFamily="monospace" sx={{ my: 1 }}>
                      {example.code}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {example.description}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
