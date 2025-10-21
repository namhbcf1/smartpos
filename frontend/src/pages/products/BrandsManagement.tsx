import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Avatar,
} from '@mui/material';
import {
  Search,
  Add,
  Refresh,
  Visibility,
  Edit,
  Delete,
  Business,
  FilterList,
  MoreVert,
  Language,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { brandsAPI } from '../../services/api';

// Brand Form Component
interface BrandFormProps {
  open: boolean;
  onClose: () => void;
  brand?: any;
}

const BrandForm: React.FC<BrandFormProps> = ({ open, onClose, brand }) => {
  const [formData, setFormData] = useState({
    name: brand?.name || '',
    description: brand?.description || '',
    website: brand?.website || '',
    logo_url: brand?.logo_url || '',
    is_active: brand?.is_active !== undefined ? brand.is_active : 1,
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => brandsAPI.createBrand(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => brandsAPI.updateBrand(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (brand) {
      updateMutation.mutate({ id: brand.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (field: string) => (e: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {brand ? 'Chỉnh sửa thương hiệu' : 'Thêm thương hiệu mới'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Tên thương hiệu"
              value={formData.name}
              onChange={handleChange('name')}
              required
            />
            <TextField
              fullWidth
              label="Mô tả"
              multiline
              rows={3}
              value={formData.description}
              onChange={handleChange('description')}
            />
            <TextField
              fullWidth
              label="Website"
              value={formData.website}
              onChange={handleChange('website')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Language />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Logo URL"
              value={formData.logo_url}
              onChange={handleChange('logo_url')}
            />
            <TextField
              fullWidth
              select
              label="Trạng thái"
              value={formData.is_active}
              onChange={handleChange('is_active')}
            >
              <option value={1}>Hoạt động</option>
              <option value={0}>Không hoạt động</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Hủy</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {brand ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Brand Card Component
interface BrandCardProps {
  brand: any;
  onEdit: (brand: any) => void;
  onDelete: (id: string) => void;
  onView: (brand: any) => void;
}

const BrandCard: React.FC<BrandCardProps> = ({ brand, onEdit, onDelete, onView }) => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {brand.name}
            </Typography>
            {brand.description && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {brand.description}
              </Typography>
            )}
            {brand.website && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Language sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="primary">
                  {brand.website}
                </Typography>
              </Box>
            )}
          </Box>
          <IconButton size="small">
            <MoreVert />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Chip
            label={brand.is_active ? 'Hoạt động' : 'Không hoạt động'}
            size="small"
            color={brand.is_active ? 'success' : 'default'}
          />
          {brand.logo_url && (
            <Avatar
              src={brand.logo_url}
              sx={{ width: 32, height: 32 }}
            />
          )}
        </Box>
      </CardContent>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={<Visibility />}
            onClick={() => onView(brand)}
            sx={{ flex: 1 }}
          >
            Xem
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => onEdit(brand)}
            sx={{ flex: 1 }}
          >
            Sửa
          </Button>
          <Button
            size="small"
            color="error"
            startIcon={<Delete />}
            onClick={() => onDelete(brand.id)}
            sx={{ flex: 1 }}
          >
            Xóa
          </Button>
        </Box>
      </Box>
    </Card>
  );
};

// Main Brands Management Component
const BrandsManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch brands
  const { data: brandsData, isLoading, error, refetch } = useQuery({
    queryKey: ['brands', page, pageSize, searchTerm],
    queryFn: () => brandsAPI.getBrands(page, pageSize),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => brandsAPI.deleteBrand(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
  });

  const brands = brandsData?.data?.brands || [];
  const pagination = brandsData?.data?.pagination;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleEdit = (brand: any) => {
    setSelectedBrand(brand);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thương hiệu này?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = (brand: any) => {
    console.log('View brand:', brand);
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Không thể tải dữ liệu thương hiệu. Vui lòng kiểm tra kết nối mạng.
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
          Quản lý thương hiệu
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quản lý thương hiệu sản phẩm
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box sx={{ flex: '1 1 50%', minWidth: '300px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Business color="primary" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {pagination?.total || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng thương hiệu
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
                <Business color="success" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {brands.filter((b: any) => b.is_active).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Đang hoạt động
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Toolbar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Tìm kiếm thương hiệu..."
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
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setSelectedBrand(null);
                setFormOpen(true);
              }}
            >
              Thêm thương hiệu
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
            >
              Làm mới
            </Button>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
            >
              Bộ lọc
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Brands Grid */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {brands.map((brand: any) => (
          <Box sx={{ flex: '1 1 50%', minWidth: '300px' }} key={brand.id}>
            <BrandCard
              brand={brand}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
            />
          </Box>
        ))}
      </Box>

      {/* Empty State */}
      {brands.length === 0 && !isLoading && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: 'grey.100' }}>
              <Business sx={{ fontSize: 32, color: 'grey.400' }} />
            </Avatar>
            <Typography variant="h6" gutterBottom>
              Chưa có thương hiệu nào
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Bắt đầu bằng cách thêm thương hiệu đầu tiên của bạn
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setFormOpen(true)}
            >
              Thêm thương hiệu đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Brand Form Dialog */}
      <BrandForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        brand={selectedBrand}
      />
    </Box>
  );
};

export default BrandsManagement;