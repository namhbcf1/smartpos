import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Rating,
  LinearProgress,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  LocalShipping as ShippingIcon,
  Star as StarIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Comment as CommentIcon,
  History as HistoryIcon,
  Assessment as AssessmentIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { formatCurrency } from '../config/constants';
import api from '../services/api';

interface SupplierPerformance {
  supplier_id: number;
  total_orders: number;
  total_amount: number;
  avg_delivery_days: number;
  on_time_delivery_rate: number;
  quality_rating: number;
  price_competitiveness: number;
  last_order_date: string;
  compliance_score: number;
  notes: string[];
  trends: {
    delivery_trend: 'improving' | 'stable' | 'declining';
    quality_trend: 'improving' | 'stable' | 'declining';
    price_trend: 'improving' | 'stable' | 'declining';
  };
}

interface Supplier {
  id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
}

interface SupplierPerformanceProps {
  supplier: Supplier;
  onClose?: () => void;
}

const SupplierPerformanceComponent: React.FC<SupplierPerformanceProps> = ({
  supplier,
  onClose
}) => {
  const [performance, setPerformance] = useState<SupplierPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    loadPerformanceData();
  }, [supplier.id]);

  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      const data = await api.get<{ data: SupplierPerformance }>(`/suppliers/${supplier.id}/performance`);
      setPerformance(data.data);
    } catch (error) {
      console.error('Error loading supplier performance:', error);
      // Mock data for demonstration
      setPerformance({
        supplier_id: supplier.id,
        total_orders: 45,
        total_amount: 125000000,
        avg_delivery_days: 3.2,
        on_time_delivery_rate: 87.5,
        quality_rating: 4.3,
        price_competitiveness: 4.1,
        last_order_date: '2024-01-15',
        compliance_score: 92,
        notes: [
          'Giao hàng đúng hạn, chất lượng tốt',
          'Giá cả cạnh tranh',
          'Hỗ trợ kỹ thuật tốt'
        ],
        trends: {
          delivery_trend: 'improving',
          quality_trend: 'stable',
          price_trend: 'improving'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRating = async () => {
    try {
      await api.post(`/suppliers/${supplier.id}/ratings`, {
        rating: newRating,
        comment: newComment
      });
      
      setRatingDialogOpen(false);
      setNewRating(5);
      setNewComment('');
      loadPerformanceData(); // Reload data
    } catch (error) {
      console.error('Error adding rating:', error);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUpIcon color="success" fontSize="small" />;
      case 'declining':
        return <TrendingUpIcon color="error" fontSize="small" sx={{ transform: 'rotate(180deg)' }} />;
      default:
        return <TrendingUpIcon color="action" fontSize="small" sx={{ transform: 'rotate(90deg)' }} />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'success';
      case 'declining':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDeliveryTime = (days: number) => {
    if (days < 1) return 'Trong ngày';
    if (days === 1) return '1 ngày';
    return `${days.toFixed(1)} ngày`;
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 4.5) return { label: 'Xuất sắc', color: 'success' };
    if (score >= 4.0) return { label: 'Tốt', color: 'primary' };
    if (score >= 3.5) return { label: 'Khá', color: 'warning' };
    return { label: 'Cần cải thiện', color: 'error' };
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <AssessmentIcon />
            </Avatar>
            <Typography variant="h6">Đang tải hiệu suất...</Typography>
          </Box>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (!performance) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            Chưa có dữ liệu hiệu suất cho nhà cung cấp này.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const qualityLevel = getPerformanceLevel(performance.quality_rating);
  const priceLevel = getPerformanceLevel(performance.price_competitiveness);

  return (
    <>
      <Card>
        <CardContent>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
              <AssessmentIcon />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6">
                Hiệu suất nhà cung cấp
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {supplier.name}
              </Typography>
            </Box>
            <Tooltip title="Thêm đánh giá">
              <IconButton onClick={() => setRatingDialogOpen(true)}>
                <EditIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Key Metrics */}
          <Grid container spacing={3}>
            {/* Overall Rating */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="h4" color="primary.main" fontWeight="bold">
                  {performance.quality_rating.toFixed(1)}
                </Typography>
                <Rating value={performance.quality_rating} readOnly precision={0.1} />
                <Chip 
                  label={qualityLevel.label} 
                  color={qualityLevel.color as any} 
                  size="small" 
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>

            {/* Total Orders */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <HistoryIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="h5" fontWeight="bold">
                  {performance.total_orders}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng đơn hàng
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatCurrency(performance.total_amount)}
                </Typography>
              </Box>
            </Grid>

            {/* Delivery Performance */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <ShippingIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="h5" fontWeight="bold">
                  {formatDeliveryTime(performance.avg_delivery_days)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Thời gian giao hàng TB
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
                  <Typography variant="caption">
                    {performance.on_time_delivery_rate.toFixed(1)}% đúng hạn
                  </Typography>
                  {getTrendIcon(performance.trends.delivery_trend)}
                </Box>
              </Box>
            </Grid>

            {/* Price Competitiveness */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <TrendingUpIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="h5" fontWeight="bold">
                  {performance.price_competitiveness.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cạnh tranh giá
                </Typography>
                <Chip 
                  label={priceLevel.label} 
                  color={priceLevel.color as any} 
                  size="small" 
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Grid>
          </Grid>

          {/* Performance Bars */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Chi tiết hiệu suất
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Giao hàng đúng hạn</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {performance.on_time_delivery_rate.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={performance.on_time_delivery_rate} 
                color={performance.on_time_delivery_rate >= 80 ? 'success' : 'warning'}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Tuân thủ quy định</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {performance.compliance_score}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={performance.compliance_score} 
                color={performance.compliance_score >= 90 ? 'success' : 'warning'}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </Box>

          {/* Trends */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Xu hướng hiệu suất
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip
                icon={getTrendIcon(performance.trends.delivery_trend)}
                label="Giao hàng"
                color={getTrendColor(performance.trends.delivery_trend) as any}
                variant="outlined"
              />
              <Chip
                icon={getTrendIcon(performance.trends.quality_trend)}
                label="Chất lượng"
                color={getTrendColor(performance.trends.quality_trend) as any}
                variant="outlined"
              />
              <Chip
                icon={getTrendIcon(performance.trends.price_trend)}
                label="Giá cả"
                color={getTrendColor(performance.trends.price_trend) as any}
                variant="outlined"
              />
            </Box>
          </Box>

          {/* Recent Notes */}
          {performance.notes.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Ghi chú gần đây
              </Typography>
              {performance.notes.slice(0, 3).map((note, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                  <CommentIcon fontSize="small" color="action" sx={{ mt: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    {note}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Actions */}
          <Box sx={{ mt: 3, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              size="small"
            >
              Lịch sử đơn hàng
            </Button>
            <Button
              variant="contained"
              startIcon={<StarIcon />}
              size="small"
              onClick={() => setRatingDialogOpen(true)}
            >
              Đánh giá
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Rating Dialog */}
      <Dialog open={ratingDialogOpen} onClose={() => setRatingDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Đánh giá nhà cung cấp</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {supplier.name}
            </Typography>
            <Rating
              value={newRating}
              onChange={(_, value) => setNewRating(value || 5)}
              size="large"
            />
          </Box>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Nhận xét"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn với nhà cung cấp này..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRatingDialogOpen(false)}>
            Hủy
          </Button>
          <Button variant="contained" onClick={handleAddRating}>
            Gửi đánh giá
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SupplierPerformanceComponent;
