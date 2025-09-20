import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Tooltip,
  Stack,
  ButtonGroup
} from '@mui/material';
import { Print, Email, ArrowBack, Download, AddCircle, AssignmentReturn } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function SaleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState<any>(null);
  const [newClaimOpen, setNewClaimOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Simulate loading sale data
    setSale({
      id: id,
      receiptNumber: 'RCP-2024-001',
      customerName: 'Nguyễn Văn A',
      customerPhone: '0123456789',
      totalAmount: 2500000,
      paymentMethod: 'Tiền mặt',
      status: 'completed',
      date: '2024-01-15 14:30:00',
      items: [
        { name: 'Laptop Dell XPS 13', quantity: 1, price: 2000000, total: 2000000, serial: 'XPS13-ABC123', warrantyMonths: 24, purchasedAt: '2024-01-15' },
        { name: 'Chuột không dây', quantity: 2, price: 250000, total: 500000, serial: 'MOUSE-778899', warrantyMonths: 12, purchasedAt: '2024-01-15' }
      ]
    });
  }, [id]);

  const stats = useMemo(() => {
    if (!sale) return { items: 0, inWarranty: 0, expiring: 0, expired: 0 };
    const items = sale.items.length;
    // Mock statuses
    const now = new Date('2025-01-01');
    let inWarranty = 0, expiring = 0, expired = 0;
    sale.items.forEach((it: any) => {
      const start = new Date(it.purchasedAt);
      const end = new Date(start);
      end.setMonth(end.getMonth() + (it.warrantyMonths || 0));
      const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24));
      if (diffDays >= 60) inWarranty += 1; else if (diffDays > 0) expiring += 1; else expired += 1;
    });
    return { items, inWarranty, expiring, expired };
  }, [sale]);

  const relatedClaims = useMemo(() => (
    [
      { id: 'CL-1001', item: 'Laptop Dell XPS 13', status: 'resolved', updatedAt: '2024-03-02' },
      { id: 'CL-1002', item: 'Chuột không dây', status: 'in_progress', updatedAt: '2024-04-12' }
    ]
  ), []);

  const handleSubmitClaim: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); setNewClaimOpen(false); }, 1000);
  };

  const handleSubmitReturn: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); setReturnOpen(false); }, 1000);
  };

  if (!sale) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography>Đang tải...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate('/sales')}
          sx={{ mr: 2 }}
        >
          Quay lại
        </Button>
        <Typography variant="h4">Chi tiết đơn hàng #{sale.receiptNumber}</Typography>
        <ButtonGroup>
          <Button startIcon={<AddCircle />} variant="contained" onClick={() => setNewClaimOpen(true)}>Yêu cầu bảo hành</Button>
          <Button startIcon={<AssignmentReturn />} variant="outlined" onClick={() => setReturnOpen(true)}>Tạo trả hàng</Button>
          <Button startIcon={<Download />} variant="outlined">Xuất</Button>
          <Button startIcon={<Print />} variant="outlined">In</Button>
        </ButtonGroup>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
        <Card><CardContent>
          <Typography color="text.secondary">Số sản phẩm</Typography>
          <Typography variant="h5" sx={{ my: 1 }}>{stats.items}</Typography>
          <LinearProgress variant="determinate" value={100} />
        </CardContent></Card>
        <Card><CardContent>
          <Typography color="text.secondary">Trong bảo hành</Typography>
          <Typography variant="h5" sx={{ my: 1 }}>{stats.inWarranty}</Typography>
          <LinearProgress color="success" variant="determinate" value={stats.inWarranty / Math.max(stats.items || 1, 1) * 100} />
        </CardContent></Card>
        <Card><CardContent>
          <Typography color="text.secondary">Sắp hết hạn</Typography>
          <Typography variant="h5" sx={{ my: 1 }}>{stats.expiring}</Typography>
          <LinearProgress color="warning" variant="determinate" value={stats.expiring / Math.max(stats.items || 1, 1) * 100} />
        </CardContent></Card>
        <Card><CardContent>
          <Typography color="text.secondary">Hết hạn</Typography>
          <Typography variant="h5" sx={{ my: 1 }}>{stats.expired}</Typography>
          <LinearProgress color="error" variant="determinate" value={stats.expired / Math.max(stats.items || 1, 1) * 100} />
        </CardContent></Card>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Thông tin đơn hàng
              </Typography>
              
              <Box mb={3}>
                <Typography variant="body2" color="text.secondary">
                  Mã đơn hàng: {sale.receiptNumber}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ngày tạo: {sale.date}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Trạng thái: 
                  <Chip 
                    label={sale.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý'} 
                    color={sale.status === 'completed' ? 'success' : 'warning'}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>Sản phẩm</Typography>
              {sale.items.map((item: any, index: number) => {
                const statusChip = (
                  <>
                    <Chip size="small" color="primary" label={`Serial: ${item.serial}`} sx={{ mr: 1 }} />
                    <Chip size="small" color="success" label={`BH: ${item.warrantyMonths} tháng`} />
                  </>
                );
                return (
                  <Box key={index} display="flex" justifyContent="space-between" alignItems="center" py={1}>
                    <Box>
                      <Typography variant="body1">{item.name}</Typography>
                      <Typography variant="body2" color="text.secondary">Số lượng: {item.quantity} × {item.price.toLocaleString()}đ</Typography>
                      <Box sx={{ mt: 0.5 }}>{statusChip}</Box>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body1" fontWeight="bold">{item.total.toLocaleString()}đ</Typography>
                      <Tooltip title="Tạo yêu cầu bảo hành cho sản phẩm này">
                        <Button size="small" variant="outlined" onClick={() => setNewClaimOpen(true)}>Bảo hành</Button>
                      </Tooltip>
                    </Stack>
                  </Box>
                );
              })}
              
              <Divider sx={{ my: 2 }} />
              
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Tổng cộng:</Typography>
                <Typography variant="h6" color="primary">
                  {sale.totalAmount.toLocaleString()}đ
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Hoạt động gần đây</Typography>
              <Stack spacing={1}>
                <Typography variant="body2">2024-01-15 14:30 • Tạo đơn hàng</Typography>
                <Typography variant="body2">2024-01-16 10:00 • Cập nhật trạng thái: thanh toán</Typography>
                <Typography variant="body2">2024-01-20 09:15 • Giao hàng thành công</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Box>
        
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Khách hàng
              </Typography>
              <Typography variant="body1">{sale.customerName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {sale.customerPhone}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                Thanh toán
              </Typography>
              <Typography variant="body1">{sale.paymentMethod}</Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>Yêu cầu liên quan</Typography>
              <Stack spacing={1} sx={{ mb: 2 }}>
                {relatedClaims.map(c => (
                  <Stack key={c.id} direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label={c.id} />
                    <Typography variant="body2" sx={{ flex: 1 }}>{c.item}</Typography>
                    <Chip size="small" color={c.status === 'resolved' ? 'success' : 'info'} label={c.status} />
                  </Stack>
                ))}
              </Stack>

              <Box display="flex" flexDirection="column" gap={1}>
                <Button variant="contained" startIcon={<Print />} fullWidth>In hóa đơn</Button>
                <Button variant="outlined" startIcon={<Email />} fullWidth>Gửi email</Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* New Claim Dialog */}
      <Dialog open={newClaimOpen} onClose={() => setNewClaimOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tạo yêu cầu bảo hành</DialogTitle>
        <Box component="form" onSubmit={handleSubmitClaim}>
          <DialogContent dividers>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Sản phẩm</InputLabel>
                <Select label="Sản phẩm" defaultValue={sale.items[0]?.name} name="product">
                  {sale.items.map((it: any, idx: number) => (
                    <MenuItem key={idx} value={it.name}>{it.name} — {it.serial}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField fullWidth label="Tiêu đề" name="title" required />
              <TextField sx={{ gridColumn: '1 / -1' }} fullWidth label="Mô tả" name="description" multiline minRows={3} />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNewClaimOpen(false)}>Hủy</Button>
            <Button type="submit" variant="contained" disabled={submitting}>Gửi</Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Initiate Return Dialog */}
      <Dialog open={returnOpen} onClose={() => setReturnOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tạo phiếu trả hàng</DialogTitle>
        <Box component="form" onSubmit={handleSubmitReturn}>
          <DialogContent dividers>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <TextField fullWidth label="Đơn hàng gốc" value={sale.receiptNumber} disabled />
              <TextField fullWidth label="Số tiền trả" type="number" name="amount" required defaultValue={sale.totalAmount} />
              <TextField sx={{ gridColumn: '1 / -1' }} fullWidth label="Lý do" name="reason" multiline minRows={3} />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReturnOpen(false)}>Đóng</Button>
            <Button type="submit" variant="contained" disabled={submitting}>Tạo</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Container>
  );
}
