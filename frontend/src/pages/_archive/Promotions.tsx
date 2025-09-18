import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tooltip,
  CircularProgress,
  Divider,
  Stack,
  useTheme,
  useMediaQuery,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  LocalOffer as PromotionsIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  GetApp as ExportIcon,
  Percent as PercentIcon,
  MonetizationOn as MoneyIcon,
  CardGiftcard as GiftIcon,
  LocalShipping as ShippingIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { formatCurrency } from '../config/constants';
import api from '../services/api';

// Types
interface Promotion {
  id: number;
  name: string;
  description: string | null;
  promotion_type: 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'free_shipping';
  discount_value: number;
  minimum_amount: number;
  maximum_discount: number;
  start_date: string;
  end_date: string;
  usage_limit: number;
  usage_count: number;
  is_active: number;
  applies_to: 'all' | 'categories' | 'products' | 'customers';
  conditions: any;
  created_at: string;
  updated_at: string;
}

interface PromotionFormData {
  name: string;
  description: string;
  promotion_type: string;
  discount_value: number;
  minimum_amount: number;
  maximum_discount: number;
  start_date: string;
  end_date: string;
  usage_limit: number;
  is_active: boolean;
  applies_to: string;
}

const Promotions = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<PromotionFormData>({
    name: '',
    description: '',
    promotion_type: 'percentage',
    discount_value: 0,
    minimum_amount: 0,
    maximum_discount: 0,
    start_date: '',
    end_date: '',
    usage_limit: 0,
    is_active: true,
    applies_to: 'all'
  });

  // Statistics state
  const [stats, setStats] = useState({
    totalPromotions: 0,
    activePromotions: 0,
    totalUsage: 0,
    totalSavings: 0
  });

  // Fetch promotions
  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);

      const response = await api.get<{
        data: Promotion[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }>(`/promotions?${params.toString()}`);

      if (response.success) {
        setPromotions(response.data.data || []);
        setTotal(response.data.pagination?.total || 0);

        // Calculate stats
        const allPromotions = response.data.data || [];
        const now = new Date();
        setStats({
          totalPromotions: allPromotions.length,
          activePromotions: allPromotions.filter(p =>
            p.is_active &&
            new Date(p.start_date) <= now &&
            new Date(p.end_date) >= now
          ).length,
          totalUsage: allPromotions.reduce((sum, p) => sum + p.usage_count, 0),
          totalSavings: 0 // This would need to be calculated from promotion_usage table
        });
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
      enqueueSnackbar('Lỗi khi tải danh sách khuyến mãi', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getPromotionTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage': return <PercentIcon />;
      case 'fixed_amount': return <MoneyIcon />;
      case 'buy_x_get_y': return <GiftIcon />;
      case 'free_shipping': return <ShippingIcon />;
      default: return <PromotionsIcon />;
    }
  };

  const getPromotionTypeText = (type: string) => {
    switch (type) {
      case 'percentage': return 'Giảm theo %';
      case 'fixed_amount': return 'Giảm cố định';
      case 'buy_x_get_y': return 'Mua X tặng Y';
      case 'free_shipping': return 'Miễn phí ship';
      default: return type;
    }
  };

  const getStatusColor = (promotion: Promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.start_date);
    const endDate = new Date(promotion.end_date);

    if (!promotion.is_active) return 'default';
    if (endDate < now) return 'error';
    if (startDate > now) return 'warning';
    return 'success';
  };

  const getStatusText = (promotion: Promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.start_date);
    const endDate = new Date(promotion.end_date);

    if (!promotion.is_active) return 'Tạm dừng';
    if (endDate < now) return 'Đã hết hạn';
    if (startDate > now) return 'Sắp diễn ra';
    return 'Đang hoạt động';
  };

  // Effects
  useEffect(() => {
    fetchPromotions();
  }, [page, rowsPerPage, searchTerm, statusFilter, typeFilter]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTypeFilter('');
    setPage(0);
  };

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: { xs: 1, sm: 2 },
        px: { xs: 1, sm: 2, md: 3 },
        minHeight: '100vh',
        bgcolor: 'grey.50'
      }}
    >
      {/* Header */}
      <Paper
        elevation={1}
        sx={{
          p: { xs: 2, sm: 3 },
          mb: 3,
          borderRadius: 2,
          bgcolor: 'white'
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                fontWeight: 600,
                color: 'primary.main',
                mb: 1
              }}
            >
              <PromotionsIcon sx={{ fontSize: 'inherit' }} />
              Khuyến mãi & Giảm giá
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Quản lý các chương trình khuyến mãi và giảm giá
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchPromotions}
              disabled={loading}
            >
              Làm mới
            </Button>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
            >
              Xuất dữ liệu
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  name: '',
                  description: '',
                  promotion_type: 'percentage',
                  discount_value: 0,
                  minimum_amount: 0,
                  maximum_discount: 0,
                  start_date: '',
                  end_date: '',
                  usage_limit: 0,
                  is_active: true,
                  applies_to: 'all'
                });
                setOpenFormDialog(true);
              }}
            >
              Tạo khuyến mãi
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Tổng khuyến mãi
                  </Typography>
                  <Typography variant="h5" component="div">
                    {stats.totalPromotions}
                  </Typography>
                </Box>
                <PromotionsIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Đang hoạt động
                  </Typography>
                  <Typography variant="h5" component="div">
                    {stats.activePromotions}
                  </Typography>
                </Box>
                <TrendingIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Lượt sử dụng
                  </Typography>
                  <Typography variant="h5" component="div">
                    {stats.totalUsage}
                  </Typography>
                </Box>
                <GiftIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Tiết kiệm
                  </Typography>
                  <Typography variant="h5" component="div">
                    {formatCurrency(stats.totalSavings)}
                  </Typography>
                </Box>
                <MoneyIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper
        elevation={1}
        sx={{
          p: { xs: 2, sm: 3 },
          mb: 3,
          borderRadius: 2
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Tìm kiếm theo tên khuyến mãi..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={statusFilter}
                label="Trạng thái"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="active">Đang hoạt động</MenuItem>
                <MenuItem value="inactive">Tạm dừng</MenuItem>
                <MenuItem value="expired">Đã hết hạn</MenuItem>
                <MenuItem value="upcoming">Sắp diễn ra</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Loại khuyến mãi</InputLabel>
              <Select
                value={typeFilter}
                label="Loại khuyến mãi"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="percentage">Giảm theo %</MenuItem>
                <MenuItem value="fixed_amount">Giảm cố định</MenuItem>
                <MenuItem value="buy_x_get_y">Mua X tặng Y</MenuItem>
                <MenuItem value="free_shipping">Miễn phí ship</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={clearFilters}
              >
                Xóa bộ lọc
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Promotions Table */}
      <Paper
        elevation={1}
        sx={{
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>Tên khuyến mãi</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Loại</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Giá trị</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Điều kiện</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Thời gian</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Sử dụng</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : promotions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      Không tìm thấy khuyến mãi nào
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                promotions.map((promotion) => (
                  <TableRow key={promotion.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {promotion.name}
                        </Typography>
                        {promotion.description && (
                          <Typography variant="caption" color="text.secondary">
                            {promotion.description}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getPromotionTypeIcon(promotion.promotion_type)}
                        <Typography variant="body2">
                          {getPromotionTypeText(promotion.promotion_type)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {promotion.promotion_type === 'percentage' ? (
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {promotion.discount_value}%
                        </Typography>
                      ) : promotion.promotion_type === 'fixed_amount' ? (
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(promotion.discount_value)}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Theo điều kiện
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        Tối thiểu: {formatCurrency(promotion.minimum_amount)}
                      </Typography>
                      {promotion.maximum_discount > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          Tối đa: {formatCurrency(promotion.maximum_discount)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="body2">
                            {new Date(promotion.start_date).toLocaleDateString('vi-VN')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            đến {new Date(promotion.end_date).toLocaleDateString('vi-VN')}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {promotion.usage_count}
                        {promotion.usage_limit > 0 && ` / ${promotion.usage_limit}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(promotion)}
                        size="small"
                        color={getStatusColor(promotion) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Xem chi tiết">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedPromotion(promotion);
                              setOpenDetailsDialog(true);
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Chỉnh sửa">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedPromotion(promotion);
                              setIsEditing(true);
                              setFormData({
                                name: promotion.name,
                                description: promotion.description || '',
                                promotion_type: promotion.promotion_type,
                                discount_value: promotion.discount_value,
                                minimum_amount: promotion.minimum_amount,
                                maximum_discount: promotion.maximum_discount,
                                start_date: promotion.start_date.split('T')[0],
                                end_date: promotion.end_date.split('T')[0],
                                usage_limit: promotion.usage_limit,
                                is_active: Boolean(promotion.is_active),
                                applies_to: promotion.applies_to
                              });
                              setOpenFormDialog(true);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Số hàng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} của ${count !== -1 ? count : `hơn ${to}`}`
          }
        />
      </Paper>
    </Container>
  );
};

export default Promotions;