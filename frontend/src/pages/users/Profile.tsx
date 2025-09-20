import React from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import {
  Add,
  Close,
  CloudUpload,
  Download,
  Edit,
  Email,
  FilterList,
  MoreVert,
  Person,
  Phone,
  Print,
  Refresh,
  Search,
  Security,
  
} from '@mui/icons-material';

type Product = {
  id: string;
  name: string;
  serial: string;
  purchaseDate: string;
  warrantyMonths: number;
  warrantyStatus: 'active' | 'expired' | 'expiring_soon';
};

type Claim = {
  id: string;
  productId: string;
  title: string;
  status: 'open' | 'in_progress' | 'resolved' | 'rejected';
  createdAt: string;
  updatedAt: string;
};

const mockProducts: Product[] = [
  { id: 'p1', name: 'POS Terminal X1', serial: 'SNX1-000123', purchaseDate: '2024-02-15', warrantyMonths: 24, warrantyStatus: 'active' },
  { id: 'p2', name: 'Receipt Printer RP-80', serial: 'RP80-553312', purchaseDate: '2023-11-30', warrantyMonths: 18, warrantyStatus: 'expiring_soon' },
  { id: 'p3', name: 'Barcode Scanner BCS-200', serial: 'BCS200-991122', purchaseDate: '2022-09-10', warrantyMonths: 12, warrantyStatus: 'expired' }
];

const mockClaims: Claim[] = [
  { id: 'c1', productId: 'p1', title: 'Màn hình cảm ứng không phản hồi', status: 'in_progress', createdAt: '2025-08-01', updatedAt: '2025-08-12' },
  { id: 'c2', productId: 'p2', title: 'In hóa đơn bị mờ', status: 'open', createdAt: '2025-09-03', updatedAt: '2025-09-03' },
  { id: 'c3', productId: 'p3', title: 'Đọc mã vạch lỗi', status: 'resolved', createdAt: '2025-06-10', updatedAt: '2025-06-14' }
];

const statusColor = (status: Product['warrantyStatus']) => {
  switch (status) {
    case 'active':
      return 'success';
    case 'expired':
      return 'error';
    case 'expiring_soon':
      return 'warning';
    default:
      return 'default';
  }
};

const claimStatusColor = (status: Claim['status']) => {
  switch (status) {
    case 'open':
      return 'warning';
    case 'in_progress':
      return 'info';
    case 'resolved':
      return 'success';
    case 'rejected':
      return 'error';
    default:
      return 'default';
  }
};

export default function Profile() {
  const [tabIndex, setTabIndex] = React.useState(0);
  const [searchText, setSearchText] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | Product['warrantyStatus']>('all');
  const [claimStatusFilter, setClaimStatusFilter] = React.useState<'all' | Claim['status']>('all');
  const [editProfileOpen, setEditProfileOpen] = React.useState(false);
  const [registerProductOpen, setRegisterProductOpen] = React.useState(false);
  const [exportOpen, setExportOpen] = React.useState(false);
  const [claimDetailOpen, setClaimDetailOpen] = React.useState<Claim | null>(null);
  const [newClaimSubmitting, setNewClaimSubmitting] = React.useState(false);

  const [notifyEmail, setNotifyEmail] = React.useState(true);
  const [notifySms, setNotifySms] = React.useState(false);
  const [twoFactor, setTwoFactor] = React.useState(true);
  const [language, setLanguage] = React.useState('vi');

  const products = React.useMemo(() => mockProducts, []);
  const claims = React.useMemo(() => mockClaims, []);

  const filteredProducts = React.useMemo(() => {
    return products.filter(p => {
      const matchesSearch = [p.name, p.serial].some(v => v.toLowerCase().includes(searchText.toLowerCase()));
      const matchesStatus = statusFilter === 'all' ? true : p.warrantyStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [products, searchText, statusFilter]);

  const filteredClaims = React.useMemo(() => {
    return claims.filter(c => {
      const matchesStatus = claimStatusFilter === 'all' ? true : c.status === claimStatusFilter;
      const product = products.find(p => p.id === c.productId);
      const matchesText = [c.title, product?.name ?? '', product?.serial ?? '']
        .join(' ')
        .toLowerCase()
        .includes(searchText.toLowerCase());
      return matchesStatus && matchesText;
    });
  }, [claims, claimStatusFilter, products, searchText]);

  const stats = React.useMemo(() => {
    const total = products.length;
    const active = products.filter(p => p.warrantyStatus === 'active').length;
    const expiring = products.filter(p => p.warrantyStatus === 'expiring_soon').length;
    const openClaims = claims.filter(c => c.status === 'open' || c.status === 'in_progress').length;
    return { total, active, expiring, openClaims };
  }, [products, claims]);

  const handleSubmitNewClaim: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    setNewClaimSubmitting(true);
    setTimeout(() => {
      setNewClaimSubmitting(false);
      setTabIndex(2); // go to Claims
    }, 1200);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ width: 72, height: 72 }}>
                <Person fontSize="large" />
              </Avatar>
          <Box>
            <Typography variant="h5">Administrator</Typography>
            <Typography color="text.secondary">admin@computerpos.vn</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip size="small" color="primary" label="Quản trị viên" />
              <Chip size="small" color="success" label="Hoạt động" />
            </Stack>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" startIcon={<Add />} onClick={() => setTabIndex(3)}>Yêu cầu bảo hành</Button>
          <Button variant="outlined" startIcon={<CloudUpload />} onClick={() => setRegisterProductOpen(true)}>Đăng ký sản phẩm</Button>
          <Button variant="text" startIcon={<Edit />} onClick={() => setEditProfileOpen(true)}>Chỉnh sửa</Button>
        </Stack>
      </Stack>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
        gap: 2,
        mb: 3
      }}>
        <Card>
          <CardContent>
            <Typography color="text.secondary">Tổng sản phẩm</Typography>
            <Typography variant="h5" sx={{ my: 1 }}>{stats.total}</Typography>
            <LinearProgress variant="determinate" value={100} />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary">Đang bảo hành</Typography>
            <Typography variant="h5" sx={{ my: 1 }}>{stats.active}</Typography>
            <LinearProgress color="success" variant="determinate" value={stats.active / Math.max(stats.total, 1) * 100} />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary">Sắp hết hạn</Typography>
            <Typography variant="h5" sx={{ my: 1 }}>{stats.expiring}</Typography>
            <LinearProgress color="warning" variant="determinate" value={stats.expiring / Math.max(stats.total, 1) * 100} />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary">Yêu cầu mở</Typography>
            <Typography variant="h5" sx={{ my: 1 }}>{stats.openClaims}</Typography>
            <LinearProgress color="info" variant="determinate" value={stats.openClaims / Math.max(stats.openClaims || 1, 1) * 100} />
            </CardContent>
          </Card>
      </Box>
        
          <Card>
            <CardContent>
          <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} variant="scrollable" scrollButtons="auto">
            <Tab label="Tổng quan" />
            <Tab label="Sản phẩm" />
            <Tab label="Yêu cầu" />
            <Tab label="Tạo yêu cầu" />
            <Tab label="Cài đặt" />
          </Tabs>
          <Divider sx={{ my: 2 }} />

          {tabIndex === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>Hoạt động gần đây</Typography>
              <Stack spacing={1}>
                {claims.slice(0, 4).map(c => {
                  const p = products.find(pp => pp.id === c.productId);
                  return (
                    <Stack key={c.id} direction="row" alignItems="center" spacing={2} sx={{ p: 1.5, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}>
                      <Chip size="small" color={claimStatusColor(c.status) as any} label={c.status.replace('_', ' ')} />
                      <Typography variant="body2" sx={{ flex: 1 }}>{c.title} — {p?.name}</Typography>
                      <Typography variant="caption" color="text.secondary">Cập nhật: {c.updatedAt}</Typography>
                      <IconButton onClick={() => setClaimDetailOpen(c)}><MoreVert /></IconButton>
                    </Stack>
                  );
                })}
              </Stack>

              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>Sắp hết hạn bảo hành</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                {products.filter(p => p.warrantyStatus !== 'active').map(p => (
                  <Card key={p.id} variant="outlined">
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="subtitle1">{p.name}</Typography>
                          <Typography variant="body2" color="text.secondary">Serial: {p.serial}</Typography>
                        </Box>
                        <Chip color={statusColor(p.warrantyStatus) as any} label={p.warrantyStatus === 'expired' ? 'Hết hạn' : 'Sắp hết hạn'} />
                      </Stack>
                    </CardContent>
                    <CardActions>
                      <Button size="small" onClick={() => setTabIndex(1)}>Xem chi tiết</Button>
                      <Button size="small" onClick={() => setTabIndex(3)}>Tạo yêu cầu</Button>
                    </CardActions>
                  </Card>
                ))}
              </Box>
            </Box>
          )}

          {tabIndex === 1 && (
            <Box>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }} sx={{ mb: 2 }}>
                <OutlinedInput
                  fullWidth
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Tìm theo tên, serial..."
                  startAdornment={<InputAdornment position="start"><Search /></InputAdornment>}
                />
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Trạng thái bảo hành</InputLabel>
                  <Select
                    label="Trạng thái bảo hành"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                  >
                    <MenuItem value="all">Tất cả</MenuItem>
                    <MenuItem value="active">Đang bảo hành</MenuItem>
                    <MenuItem value="expiring_soon">Sắp hết hạn</MenuItem>
                    <MenuItem value="expired">Hết hạn</MenuItem>
                  </Select>
                </FormControl>
                <Tooltip title="Làm mới">
                  <IconButton><Refresh /></IconButton>
                </Tooltip>
                <Tooltip title="Bộ lọc nâng cao">
                  <IconButton><FilterList /></IconButton>
                </Tooltip>
                <Box sx={{ flex: 1 }} />
                <Button startIcon={<Download />} variant="outlined" onClick={() => setExportOpen(true)}>Xuất</Button>
                <Button startIcon={<Print />} variant="outlined">In</Button>
              </Stack>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Sản phẩm</TableCell>
                      <TableCell>Serial</TableCell>
                      <TableCell>Ngày mua</TableCell>
                      <TableCell>Trạng thái</TableCell>
                      <TableCell align="right">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredProducts.map(p => (
                      <TableRow key={p.id} hover>
                        <TableCell>{p.name}</TableCell>
                        <TableCell>{p.serial}</TableCell>
                        <TableCell>{p.purchaseDate}</TableCell>
                        <TableCell>
                          <Chip size="small" color={statusColor(p.warrantyStatus) as any} label={p.warrantyStatus === 'active' ? 'Đang BH' : p.warrantyStatus === 'expired' ? 'Hết hạn' : 'Sắp hết hạn'} />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button size="small" onClick={() => setTabIndex(0)}>Xem</Button>
                            <Button size="small" variant="outlined" onClick={() => setTabIndex(3)}>Yêu cầu</Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredProducts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="text.secondary">Không có dữ liệu phù hợp.</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {tabIndex === 2 && (
            <Box>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }} sx={{ mb: 2 }}>
                <OutlinedInput
                  fullWidth
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Tìm yêu cầu theo tiêu đề, sản phẩm..."
                  startAdornment={<InputAdornment position="start"><Search /></InputAdornment>}
                />
                <FormControl sx={{ minWidth: 220 }}>
                  <InputLabel>Trạng thái yêu cầu</InputLabel>
                  <Select
                    label="Trạng thái yêu cầu"
                    value={claimStatusFilter}
                    onChange={(e) => setClaimStatusFilter(e.target.value as any)}
                  >
                    <MenuItem value="all">Tất cả</MenuItem>
                    <MenuItem value="open">Mới</MenuItem>
                    <MenuItem value="in_progress">Đang xử lý</MenuItem>
                    <MenuItem value="resolved">Hoàn tất</MenuItem>
                    <MenuItem value="rejected">Từ chối</MenuItem>
                  </Select>
                </FormControl>
                <Box sx={{ flex: 1 }} />
                <Button startIcon={<Add />} variant="contained" onClick={() => setTabIndex(3)}>Tạo yêu cầu</Button>
              </Stack>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tiêu đề</TableCell>
                      <TableCell>Sản phẩm</TableCell>
                      <TableCell>Tạo lúc</TableCell>
                      <TableCell>Cập nhật</TableCell>
                      <TableCell>Trạng thái</TableCell>
                      <TableCell align="right">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredClaims.map(c => {
                      const p = products.find(pp => pp.id === c.productId);
                      return (
                        <TableRow key={c.id} hover>
                          <TableCell>{c.title}</TableCell>
                          <TableCell>{p?.name}</TableCell>
                          <TableCell>{c.createdAt}</TableCell>
                          <TableCell>{c.updatedAt}</TableCell>
                          <TableCell>
                            <Chip size="small" color={claimStatusColor(c.status) as any} label={c.status.replace('_', ' ')} />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button size="small" onClick={() => setClaimDetailOpen(c)}>Chi tiết</Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredClaims.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography color="text.secondary">Không có yêu cầu phù hợp.</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {tabIndex === 3 && (
            <Box component="form" onSubmit={handleSubmitNewClaim}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Sản phẩm</InputLabel>
                  <Select label="Sản phẩm" required defaultValue={products[0]?.id} name="productId">
                    {products.map(p => (
                      <MenuItem key={p.id} value={p.id}>{p.name} — {p.serial}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField fullWidth required label="Tiêu đề" name="title" placeholder="Mô tả ngắn gọn sự cố" />
                <TextField sx={{ gridColumn: '1 / -1' }} fullWidth multiline minRows={4} label="Chi tiết sự cố" name="description" placeholder="Cung cấp thông tin chi tiết..." />
                <TextField fullWidth type="date" label="Ngày phát sinh" InputLabelProps={{ shrink: true }} name="date" />
                <Button component="label" variant="outlined" startIcon={<CloudUpload />} sx={{ height: '56px' }}>
                  Tải tệp đính kèm
                  <input hidden type="file" multiple name="attachments" />
                </Button>
                <Stack sx={{ gridColumn: '1 / -1' }} direction="row" spacing={1}>
                  <Button type="submit" variant="contained" disabled={newClaimSubmitting}>Gửi yêu cầu</Button>
                  <Button type="button" variant="text" onClick={() => setTabIndex(2)}>Hủy</Button>
                </Stack>
              </Box>
              {newClaimSubmitting && <LinearProgress sx={{ mt: 2 }} />}
              </Box>
          )}

          {tabIndex === 4 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Thông báo</Typography>
                  <FormControlLabel control={<Switch checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} />} label={
                    <Stack direction="row" spacing={1} alignItems="center"><Email fontSize="small" /><span>Email</span></Stack>
                  } />
                  <FormControlLabel control={<Switch checked={notifySms} onChange={(e) => setNotifySms(e.target.checked)} />} label={
                    <Stack direction="row" spacing={1} alignItems="center"><Phone fontSize="small" /><span>SMS</span></Stack>
                  } />
                </CardContent>
              </Card>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Bảo mật</Typography>
                  <FormControlLabel control={<Switch checked={twoFactor} onChange={(e) => setTwoFactor(e.target.checked)} />} label={
                    <Stack direction="row" spacing={1} alignItems="center"><Security fontSize="small" /><span>Xác thực 2 lớp</span></Stack>
                  } />
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary">Mật khẩu gần cập nhật: 30 ngày trước</Typography>
                  <Button sx={{ mt: 1 }} variant="outlined">Đổi mật khẩu</Button>
                </CardContent>
              </Card>
              <Card sx={{ gridColumn: '1 / -1' }} variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Tùy chọn</Typography>
                  <FormControl sx={{ minWidth: 240 }}>
                    <InputLabel>Ngôn ngữ</InputLabel>
                    <Select label="Ngôn ngữ" value={language} onChange={(e) => setLanguage(e.target.value)}>
                      <MenuItem value="vi">Tiếng Việt</MenuItem>
                      <MenuItem value="en">English</MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
              </Box>
          )}
            </CardContent>
          </Card>

      {/* Dialogs */}
      <Dialog open={editProfileOpen} onClose={() => setEditProfileOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          Chỉnh sửa hồ sơ
          <IconButton onClick={() => setEditProfileOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 2 }}>
            <Stack alignItems="center" spacing={1}>
              <Avatar sx={{ width: 96, height: 96 }}>
                <Person />
              </Avatar>
              <Button component="label" startIcon={<CloudUpload />}>Tải ảnh
                <input hidden type="file" accept="image/*" />
              </Button>
            </Stack>
            <Box>
              <TextField fullWidth label="Họ và tên" defaultValue="Administrator" sx={{ mb: 2 }} />
              <TextField fullWidth label="Email" defaultValue="admin@computerpos.vn" />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditProfileOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={() => setEditProfileOpen(false)}>Lưu</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={registerProductOpen} onClose={() => setRegisterProductOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          Đăng ký sản phẩm
          <IconButton onClick={() => setRegisterProductOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <TextField sx={{ gridColumn: '1 / -1' }} fullWidth label="Tên sản phẩm" placeholder="VD: POS Terminal X1" />
            <TextField fullWidth label="Serial" placeholder="SN..." />
            <TextField fullWidth type="date" label="Ngày mua" InputLabelProps={{ shrink: true }} />
            <TextField fullWidth type="number" label="Số tháng bảo hành" placeholder="12" />
            <Button component="label" fullWidth variant="outlined" startIcon={<CloudUpload />} sx={{ height: 56 }}>Đính kèm hóa đơn
              <input hidden type="file" />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegisterProductOpen(false)}>Đóng</Button>
          <Button variant="contained" onClick={() => setRegisterProductOpen(false)}>Lưu</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={exportOpen} onClose={() => setExportOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>
          Xuất dữ liệu
          <IconButton onClick={() => setExportOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Button startIcon={<Download />} variant="outlined">Xuất CSV sản phẩm</Button>
            <Button startIcon={<Download />} variant="outlined">Xuất CSV yêu cầu</Button>
            <Button startIcon={<Print />} variant="outlined">In tổng quan</Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!claimDetailOpen} onClose={() => setClaimDetailOpen(null)} fullWidth maxWidth="sm">
        <DialogTitle>
          Chi tiết yêu cầu
          <IconButton onClick={() => setClaimDetailOpen(null)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {claimDetailOpen ? (
            <Box>
              <Typography variant="h6" gutterBottom>{claimDetailOpen.title}</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Trạng thái: <Chip size="small" color={claimStatusColor(claimDetailOpen.status) as any} label={claimDetailOpen.status.replace('_', ' ')} sx={{ ml: 1 }} />
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>Lịch sử</Typography>
              <Stack spacing={1}>
                <Typography variant="body2">{claimDetailOpen.createdAt}: Tạo yêu cầu</Typography>
                <Typography variant="body2">{claimDetailOpen.updatedAt}: Cập nhật trạng thái</Typography>
              </Stack>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClaimDetailOpen(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
