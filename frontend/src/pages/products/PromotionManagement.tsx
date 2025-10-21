import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  // Grid,
  Chip,
  // IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  // Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Search,
  Add,
  Refresh,
  Visibility,
  Edit,
  Delete,
  LocalOffer,
  Percent,
  AttachMoney,
  // CalendarToday,
  // TrendingUp,
  // TrendingDown,
  CheckCircle,
  // Cancel,
  // Warning,
  // Code,
  Campaign,
  // Analytics,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promotionsAPI } from '../../services/api';

// Promotion Interface based on D1 schema
interface Promotion {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_purchase: number;
  max_discount?: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  tenant_id?: string;
}

// Promotion Form Component
interface PromotionFormProps {
  open: boolean;
  onClose: () => void;
  promotion?: Promotion;
}

const PromotionForm: React.FC<PromotionFormProps> = ({ open, onClose, promotion }) => {
  const [formData, setFormData] = useState({
    code: promotion?.code || '',
    name: promotion?.name || '',
    description: promotion?.description || '',
    type: promotion?.type || 'percentage',
    value: promotion?.value || 0,
    min_purchase: promotion?.min_purchase || 0,
    max_discount: promotion?.max_discount || 0,
    start_date: promotion?.start_date || '',
    end_date: promotion?.end_date || '',
    is_active: promotion?.is_active !== undefined ? promotion.is_active : true,
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => promotionsAPI.createPromotion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => promotionsAPI.updatePromotion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (promotion) {
      updateMutation.mutate({ id: promotion.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // const formatCurrency = (cents: number) => {
  //   return new Intl.NumberFormat('vi-VN', {
  //     style: 'currency',
  //     currency: 'VND',
  //   }).format(cents);
  // };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {promotion ? 'Chỉnh sửa khuyến mãi' : 'Tạo khuyến mãi mới'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Mã khuyến mãi"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                placeholder="VD: SALE20, WELCOME10"
              />
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Tên khuyến mãi"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="VD: Giảm giá 20%"
              />
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Mô tả"
                name="description"
                multiline
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="Mô tả chi tiết về chương trình khuyến mãi"
              />
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <FormControl fullWidth>
                <InputLabel>Loại khuyến mãi</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  label="Loại khuyến mãi"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="percentage">Phần trăm (%)</MenuItem>
                  <MenuItem value="fixed">Số tiền cố định (VNĐ)</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <TextField
                fullWidth
                label={formData.type === 'percentage' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (VNĐ)'}
                name="value"
                type="number"
                value={formData.value}
                onChange={handleChange}
                required
                InputProps={{
                  endAdornment: formData.type === 'percentage' ? (
                    <InputAdornment position="end">%</InputAdornment>
                  ) : (
                    <InputAdornment position="end">₫</InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Đơn hàng tối thiểu (VNĐ)"
                name="min_purchase"
                type="number"
                value={formData.min_purchase}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₫</InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Giảm giá tối đa (VNĐ)"
                name="max_discount"
                type="number"
                value={formData.max_discount}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₫</InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Ngày bắt đầu"
                name="start_date"
                type="datetime-local"
                value={formData.start_date}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Ngày kết thúc"
                name="end_date"
                type="datetime-local"
                value={formData.end_date}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                }
                label="Trạng thái hoạt động"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Hủy</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {promotion ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Promotion Card Component
interface PromotionCardProps {
  promotion: Promotion;
  onView: (promotion: Promotion) => void;
  onEdit: (promotion: Promotion) => void;
  onDelete: (id: string) => void;
}

const PromotionCard: React.FC<PromotionCardProps> = ({ promotion, onView, onEdit, onDelete }) => {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(cents);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getTypeIcon = (type: string) => {
    return type === 'percentage' ? <Percent /> : <AttachMoney />;
  };

  const getTypeLabel = (type: string) => {
    return type === 'percentage' ? 'Phần trăm' : 'Số tiền';
  };

  const getStatusColor = (promotion: Promotion) => {
    if (!promotion.is_active) return 'default';
    
    const now = new Date();
    const startDate = promotion.start_date ? new Date(promotion.start_date) : null;
    const endDate = promotion.end_date ? new Date(promotion.end_date) : null;
    
    if (startDate && now < startDate) return 'warning';
    if (endDate && now > endDate) return 'error';
    return 'success';
  };

  const getStatusLabel = (promotion: Promotion) => {
    if (!promotion.is_active) return 'Tạm dừng';
    
    const now = new Date();
    const startDate = promotion.start_date ? new Date(promotion.start_date) : null;
    const endDate = promotion.end_date ? new Date(promotion.end_date) : null;
    
    if (startDate && now < startDate) return 'Chưa bắt đầu';
    if (endDate && now > endDate) return 'Đã hết hạn';
    return 'Đang hoạt động';
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <LocalOffer />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {promotion.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Mã: {promotion.code}
              </Typography>
              <Chip
                label={getTypeLabel(promotion.type)}
                size="small"
                color="primary"
                icon={getTypeIcon(promotion.type)}
              />
            </Box>
          </Box>
          <Chip
            label={getStatusLabel(promotion)}
            size="small"
            color={getStatusColor(promotion) as any}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Giá trị: {promotion.type === 'percentage' 
              ? `${promotion.value}%` 
              : formatCurrency(promotion.value)
            }
          </Typography>
          {promotion.min_purchase > 0 && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Đơn tối thiểu: {formatCurrency(promotion.min_purchase)}
            </Typography>
          )}
          {promotion.max_discount && promotion.max_discount > 0 && (
            <Typography variant="body2" color="text.secondary">
              Giảm tối đa: {formatCurrency(promotion.max_discount)}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Bắt đầu:
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {promotion.start_date ? formatDate(promotion.start_date) : 'Không giới hạn'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            Kết thúc:
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {promotion.end_date ? formatDate(promotion.end_date) : 'Không giới hạn'}
          </Typography>
        </Box>
      </CardContent>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={<Visibility />}
            onClick={() => onView(promotion)}
            sx={{ flex: 1 }}
          >
            Xem
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => onEdit(promotion)}
            sx={{ flex: 1 }}
          >
            Sửa
          </Button>
          <Button
            size="small"
            color="error"
            startIcon={<Delete />}
            onClick={() => onDelete(promotion.id)}
            sx={{ flex: 1 }}
          >
            Xóa
          </Button>
        </Box>
      </Box>
    </Card>
  );
};

// Promotion Usage Analytics Component
const PromotionAnalytics: React.FC = () => {
  // This would typically fetch from a promotions usage API
  const usageData = [
    { code: 'SALE20', usage_count: 45, total_discount: 2500000 },
    { code: 'WELCOME10', usage_count: 23, total_discount: 1200000 },
    { code: 'VIP15', usage_count: 12, total_discount: 1800000 },
  ];

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(cents);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Thống kê sử dụng khuyến mãi
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Mã khuyến mãi</TableCell>
                <TableCell align="center">Số lần sử dụng</TableCell>
                <TableCell align="right">Tổng giảm giá</TableCell>
                <TableCell align="center">Trạng thái</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usageData.map((promo, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {promo.code}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {promo.usage_count}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium" color="success.main">
                      {formatCurrency(promo.total_discount)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label="Hoạt động"
                      size="small"
                      color="success"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

// Active Promotions Component
const ActivePromotions: React.FC = () => {
  // This would typically fetch from promotions API
  const activePromotions = [
    { code: 'SALE20', name: 'Giảm giá 20%', type: 'percentage', value: 20, usage: 45 },
    { code: 'WELCOME10', name: 'Chào mừng 10%', type: 'percentage', value: 10, usage: 23 },
    { code: 'VIP15', name: 'VIP 15%', type: 'percentage', value: 15, usage: 12 },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Khuyến mãi đang hoạt động
        </Typography>
        <List>
          {activePromotions.map((promo, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <LocalOffer />
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={promo.name}
                secondary={
                  <Box>
                    <Typography variant="body2">
                      Mã: {promo.code} | Giảm: {promo.value}% | Sử dụng: {promo.usage} lần
                    </Typography>
                  </Box>
                }
              />
              <Chip
                label="Hoạt động"
                size="small"
                color="success"
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

// Main Promotion Management Component
const PromotionManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // const queryClient = useQueryClient();

  // Fetch promotions from D1 Cloudflare
  const { data: promotionsData, isLoading, error, refetch } = useQuery({
    queryKey: ['promotions', page, pageSize, searchTerm, statusFilter],
    queryFn: () => promotionsAPI.getPromotions(page, pageSize, searchTerm),
  });

  const promotions = promotionsData?.data?.promotions || [];
  const pagination = promotionsData?.data?.pagination;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleEdit = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khuyến mãi này?')) {
      // Handle delete
      console.log('Delete promotion:', id);
    }
  };

  const handleView = (promotion: Promotion) => {
    // Handle view action
    console.log('View promotion:', promotion);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Không thể tải dữ liệu khuyến mãi. Vui lòng kiểm tra kết nối mạng.
        </Alert>
        <Button onClick={handleRefresh} startIcon={<Refresh />}>
          Thử lại
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Quản lý khuyến mãi
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quản lý mã giảm giá và chương trình khuyến mãi
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LocalOffer color="primary" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {pagination?.total || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng khuyến mãi
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircle color="success" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {promotions.filter((p: any) => p.is_active).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Đang hoạt động
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Campaign color="warning" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {promotions.filter((p: any) => p.type === 'percentage').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Giảm phần trăm
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AttachMoney color="info" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {promotions.filter((p: any) => p.type === 'fixed').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Giảm số tiền
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="promotion tabs">
          <Tab label="Danh sách khuyến mãi" />
          <Tab label="Thống kê sử dụng" />
          <Tab label="Khuyến mãi hoạt động" />
        </Tabs>
      </Card>

      {/* Tab Content */}
      {activeTab === 0 && (
        <>
          {/* Toolbar */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  placeholder="Tìm kiếm khuyến mãi..."
                  value={searchTerm}
                  onChange={handleSearch}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ minWidth: 300 }}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Trạng thái</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="Trạng thái"
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    <MenuItem value="active">Hoạt động</MenuItem>
                    <MenuItem value="inactive">Tạm dừng</MenuItem>
                    <MenuItem value="expired">Hết hạn</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => {
                    setSelectedPromotion(null);
                    setFormOpen(true);
                  }}
                >
                  Tạo khuyến mãi
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={handleRefresh}
                >
                  Làm mới
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Promotions Grid */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {promotions.map((promotion: Promotion) => (
              <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
                <PromotionCard
                  promotion={promotion}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </Box>
            ))}
          </Box>

          {/* Empty State */}
          {promotions.length === 0 && !isLoading && (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: 'grey.100' }}>
                  <LocalOffer sx={{ fontSize: 32, color: 'grey.400' }} />
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  Chưa có khuyến mãi nào
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Bắt đầu bằng cách tạo khuyến mãi đầu tiên
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setFormOpen(true)}
                >
                  Tạo khuyến mãi đầu tiên
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {activeTab === 1 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
            <PromotionAnalytics />
          </Box>
        </Box>
      )}

      {activeTab === 2 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
            <ActivePromotions />
          </Box>
        </Box>
      )}

      {/* Promotion Form Dialog */}
      <PromotionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        promotion={selectedPromotion || undefined}
      />
    </Box>
  );
};

export default PromotionManagement;