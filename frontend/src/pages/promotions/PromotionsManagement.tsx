import React, { useState, useCallback, lazy, Suspense } from 'react';
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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel,
  Avatar,
  CircularProgress,
  Backdrop,
  Tooltip,
  Fab
} from '@mui/material';
import {
  Search,
  Add,
  Refresh,
  Visibility,
  Edit,
  Delete,
  LocalOffer,
  FilterList,
  CalendarToday,
  Percent,
  CheckCircle,
  Warning,
  TrendingUp,
  Star
} from '@mui/icons-material';

// Remove lazy loading for now to fix build

// Dummy data for demonstration
const dummyPromotions = [
  {
    id: 'promo1', 
    name: 'Giảm giá mùa hè', 
    code: 'SUMMER20', 
    type: 'percentage', 
    value: 20,
    start_date: '2023-06-01T00:00:00Z', 
    end_date: '2023-08-31T23:59:59Z', 
    is_active: 1,
    min_order_value_cents: 5000000, 
    max_discount_cents: 2000000, 
    usage_limit: 100, 
    used_count: 30
  },
  {
    id: 'promo2', 
    name: 'Miễn phí vận chuyển', 
    code: 'FREESHIP', 
    type: 'free_shipping', 
    value: 0,
    start_date: '2023-07-15T00:00:00Z', 
    end_date: '2023-09-30T23:59:59Z', 
    is_active: 1,
    min_order_value_cents: 2000000, 
    max_discount_cents: 0, 
    usage_limit: 50, 
    used_count: 50
  }
];

// Main Promotions Management Component
const PromotionsManagement: React.FC = () => {
  // State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [selectedPromotion, setSelectedPromotion] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedPromotionForView, setSelectedPromotionForView] = useState<any>(null);
  
  const [isLoading] = useState(false);
  const [error] = useState(null);

  // Handlers
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleRefresh = () => {
    console.log('Refreshing promotions...');
  };

  const handleEdit = (promotion: any) => {
    setSelectedPromotion(promotion);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khuyến mãi này?')) {
      console.log('Deleting promotion:', id);
    }
  };

  const handleView = (promotion: any) => {
    setSelectedPromotionForView(promotion);
    setViewModalOpen(true);
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
      {/* Enhanced Header */}
      <Card sx={{
        mb: 4,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative'
      }}>
        <Box sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%'
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%'
        }} />
        <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
            <Avatar sx={{
              width: 80,
              height: 80,
              bgcolor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <LocalOffer sx={{ fontSize: 40 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                Hệ thống quản lý khuyến mãi thông minh
            </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                Quản lý và theo dõi các chương trình khuyến mãi, giảm giá và ưu đãi
            </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  label="Khuyến mãi"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)'
                  }}
                />
                <Chip
                  label="Giảm giá"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)'
                  }}
                />
                <Chip
                  label="Ưu đãi"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)'
                  }}
                />
          </Box>
        </Box>
      </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<TrendingUp />}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1
              }}
            >
              Báo cáo khuyến mãi
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setFormOpen(true)}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'white',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1
              }}
            >
              Tạo khuyến mãi mới
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Enhanced Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 30px rgba(102, 126, 234, 0.3)'
            }
          }}>
            <Box sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%'
            }} />
            <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{
                  width: 50,
                  height: 50,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <LocalOffer sx={{ fontSize: 24 }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {dummyPromotions.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Tổng khuyến mãi
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Tất cả chương trình khuyến mãi
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            borderRadius: 3,
            background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 30px rgba(76, 175, 80, 0.3)'
            }
          }}>
            <Box sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%'
            }} />
            <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{
                  width: 50,
                  height: 50,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <CheckCircle sx={{ fontSize: 24 }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {dummyPromotions.filter(p => p.is_active === 1).length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Đang hoạt động
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Khuyến mãi đang áp dụng
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            borderRadius: 3,
            background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 30px rgba(255, 152, 0, 0.3)'
            }
          }}>
            <Box sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%'
            }} />
            <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{
                  width: 50,
                  height: 50,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <Warning sx={{ fontSize: 24 }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {dummyPromotions.filter(p => p.is_active === 0).length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Hết hạn
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Khuyến mãi đã hết hạn
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            borderRadius: 3,
            background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 30px rgba(156, 39, 176, 0.3)'
            }
          }}>
            <Box sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%'
            }} />
            <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{
                  width: 50,
                  height: 50,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <Star sx={{ fontSize: 24 }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {dummyPromotions.reduce((sum, p) => sum + p.used_count, 0)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Lượt sử dụng
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Tổng lượt sử dụng
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Enhanced Toolbar */}
      <Card sx={{ 
        mb: 3, 
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
            {/* Search Field */}
            <TextField
              placeholder="Tìm kiếm theo tên, mã khuyến mãi..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                minWidth: 350,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'white',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }
                }
              }}
            />

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
            <Button
              variant="contained"
              startIcon={<Add />}
                onClick={() => setFormOpen(true)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                  }
              }}
            >
              Thêm khuyến mãi
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    backgroundColor: 'rgba(102, 126, 234, 0.05)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
                  }
                }}
            >
              Làm mới
            </Button>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderColor: 'success.main',
                  color: 'success.main',
                  '&:hover': {
                    borderColor: 'success.dark',
                    backgroundColor: 'rgba(76, 175, 80, 0.05)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)'
                  }
                }}
            >
              Bộ lọc
            </Button>
          </Box>
            </Box>
        </CardContent>
      </Card>

      {/* Promotions Table */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mã khuyến mãi</TableCell>
                <TableCell>Tên</TableCell>
                <TableCell>Loại</TableCell>
                <TableCell>Giá trị</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Ngày bắt đầu</TableCell>
                <TableCell>Ngày kết thúc</TableCell>
                <TableCell>Đã sử dụng</TableCell>
                <TableCell>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dummyPromotions.map((promotion) => (
                <TableRow key={promotion.id}>
                  <TableCell>
                    <Chip
                      label={promotion.code}
                      color="primary"
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="500">
                      {promotion.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={promotion.type === 'percentage' ? 'Phần trăm' : 
                             promotion.type === 'fixed_amount' ? 'Số tiền cố định' :
                             promotion.type === 'free_shipping' ? 'Miễn phí ship' : 'Mua X tặng Y'}
                      color={promotion.type === 'percentage' ? 'success' : 
                             promotion.type === 'fixed_amount' ? 'warning' : 'info'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="500">
                      {promotion.type === 'percentage' ? `${promotion.value}%` : 
                       promotion.type === 'fixed_amount' ? `${promotion.value.toLocaleString('vi-VN')} ₫` :
                       promotion.type === 'free_shipping' ? 'Miễn phí' : `${promotion.value} sản phẩm`}
                </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={promotion.is_active === 1 ? 'Hoạt động' : 'Không hoạt động'}
                      color={promotion.is_active === 1 ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(promotion.start_date).toLocaleDateString('vi-VN')}
                </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(promotion.end_date).toLocaleDateString('vi-VN')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="500">
                      {promotion.used_count}/{promotion.usage_limit}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Xem chi tiết">
                        <IconButton size="small" onClick={() => handleView(promotion)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Chỉnh sửa">
                        <IconButton size="small" onClick={() => handleEdit(promotion)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton size="small" color="error" onClick={() => handleDelete(promotion.id)}>
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
            </Card>

      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress color="inherit" />
          <Typography variant="h6">Đang xử lý...</Typography>
        </Box>
      </Backdrop>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => setFormOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
            transform: 'scale(1.1)'
          }
        }}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default PromotionsManagement;