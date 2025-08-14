import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Alert,
  Skeleton,
  Badge,
  Divider
} from '@mui/material';
import {
  Psychology as AIIcon,
  TrendingUp as TrendingUpIcon,
  History as HistoryIcon,
  Star as StarIcon,
  Add as AddIcon,
  Schedule as ScheduleIcon,
  LocalOffer as OfferIcon,
  Inventory as InventoryIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { formatCurrency } from '../config/constants';
import api from '../services/api';

interface ProductSuggestion {
  id: number;
  name: string;
  sku: string;
  category_name: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  suggestion_reason: string;
  confidence_score: number;
  historical_data: {
    avg_monthly_sales: number;
    last_purchase_date: string;
    seasonal_trend: 'high' | 'medium' | 'low';
    profit_margin: number;
  };
  supplier_info?: {
    name: string;
    rating: number;
    avg_delivery_days: number;
  };
}

interface SmartProductSuggestionsProps {
  supplierId?: number;
  categoryId?: number;
  onProductSelect?: (product: ProductSuggestion) => void;
  maxSuggestions?: number;
}

const SmartProductSuggestions: React.FC<SmartProductSuggestionsProps> = ({
  supplierId,
  categoryId,
  onProductSelect,
  maxSuggestions = 10
}) => {
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSuggestions();
  }, [supplierId, categoryId]);

  const loadSuggestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (supplierId) params.append('supplier_id', supplierId.toString());
      if (categoryId) params.append('category_id', categoryId.toString());
      params.append('limit', maxSuggestions.toString());

      const data = await api.get<{ data: ProductSuggestion[] }>(`/analytics/product-suggestions?${params}`);
      setSuggestions(data.data || []);
    } catch (error) {
      console.error('Error loading product suggestions:', error);
      // Mock data for demonstration
      setSuggestions([
        {
          id: 1,
          name: 'CPU Intel Core i7-13700K',
          sku: 'CPU-I7-13700K',
          category_name: 'CPU',
          price: 8990000,
          cost_price: 7500000,
          stock_quantity: 2,
          suggestion_reason: 'Sắp hết hàng, bán chạy trong tháng',
          confidence_score: 95,
          historical_data: {
            avg_monthly_sales: 12,
            last_purchase_date: '2024-01-10',
            seasonal_trend: 'high',
            profit_margin: 19.9
          },
          supplier_info: {
            name: 'Intel Vietnam',
            rating: 4.8,
            avg_delivery_days: 2
          }
        },
        {
          id: 2,
          name: 'RAM Corsair Vengeance 32GB DDR5',
          sku: 'RAM-CORS-32GB-DDR5',
          category_name: 'RAM',
          price: 4590000,
          cost_price: 3800000,
          stock_quantity: 5,
          suggestion_reason: 'Xu hướng tăng, giá tốt từ nhà cung cấp',
          confidence_score: 87,
          historical_data: {
            avg_monthly_sales: 8,
            last_purchase_date: '2024-01-05',
            seasonal_trend: 'medium',
            profit_margin: 20.8
          },
          supplier_info: {
            name: 'Corsair Official',
            rating: 4.6,
            avg_delivery_days: 3
          }
        },
        {
          id: 3,
          name: 'SSD Samsung 980 PRO 2TB',
          sku: 'SSD-SAM-980PRO-2TB',
          category_name: 'Storage',
          price: 5990000,
          cost_price: 4900000,
          stock_quantity: 8,
          suggestion_reason: 'Mùa cao điểm, nhu cầu tăng cao',
          confidence_score: 92,
          historical_data: {
            avg_monthly_sales: 15,
            last_purchase_date: '2024-01-08',
            seasonal_trend: 'high',
            profit_margin: 18.2
          },
          supplier_info: {
            name: 'Samsung Vietnam',
            rating: 4.9,
            avg_delivery_days: 1
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'high':
        return <TrendingUpIcon color="success" fontSize="small" />;
      case 'medium':
        return <TrendingUpIcon color="warning" fontSize="small" />;
      default:
        return <TrendingUpIcon color="action" fontSize="small" />;
    }
  };

  const formatDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 ngày trước';
    if (diffDays < 30) return `${diffDays} ngày trước`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
    return `${Math.floor(diffDays / 365)} năm trước`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AIIcon color="primary" />
            <Typography variant="h6">Gợi ý thông minh</Typography>
          </Box>
          {[...Array(3)].map((_, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Skeleton variant="rectangular" height={80} />
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AIIcon color="primary" />
            <Typography variant="h6">Gợi ý thông minh</Typography>
          </Box>
          <Alert severity="info">
            Không có gợi ý sản phẩm nào cho thời điểm này.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <AIIcon color="primary" />
          <Typography variant="h6">Gợi ý thông minh</Typography>
          <Chip 
            label="AI-Powered" 
            color="primary" 
            size="small" 
            icon={<AnalyticsIcon />}
          />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Dựa trên dữ liệu lịch sử, xu hướng thị trường và hiệu suất nhà cung cấp
        </Typography>

        <List disablePadding>
          {suggestions.map((suggestion, index) => (
            <React.Fragment key={suggestion.id}>
              <ListItem
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  mb: 1,
                  bgcolor: 'background.paper'
                }}
              >
                <ListItemAvatar>
                  <Badge
                    badgeContent={suggestion.confidence_score}
                    color={getConfidenceColor(suggestion.confidence_score)}
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.7rem',
                        height: 18,
                        minWidth: 18
                      }
                    }}
                  >
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <InventoryIcon />
                    </Avatar>
                  </Badge>
                </ListItemAvatar>

                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {suggestion.name}
                      </Typography>
                      <Chip 
                        label={suggestion.category_name} 
                        size="small" 
                        variant="outlined" 
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {suggestion.suggestion_reason}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <InventoryIcon sx={{ fontSize: 14 }} color="action" />
                          <Typography variant="caption">
                            Tồn: {suggestion.stock_quantity}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TrendingUpIcon sx={{ fontSize: 14 }} color="action" />
                          <Typography variant="caption">
                            TB: {suggestion.historical_data.avg_monthly_sales}/tháng
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ScheduleIcon sx={{ fontSize: 14 }} color="action" />
                          <Typography variant="caption">
                            Mua lần cuối: {formatDaysAgo(suggestion.historical_data.last_purchase_date)}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight={600} color="primary">
                          {formatCurrency(suggestion.price)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Lãi: {suggestion.historical_data.profit_margin.toFixed(1)}%
                        </Typography>
                        {getTrendIcon(suggestion.historical_data.seasonal_trend)}
                        
                        {suggestion.supplier_info && (
                          <Tooltip title={`${suggestion.supplier_info.name} - ${suggestion.supplier_info.rating}⭐`}>
                            <Chip
                              label={`${suggestion.supplier_info.avg_delivery_days}d`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                  }
                />

                <ListItemSecondaryAction>
                  <Tooltip title="Thêm vào phiếu nhập">
                    <IconButton
                      edge="end"
                      color="primary"
                      onClick={() => onProductSelect?.(suggestion)}
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
              
              {index < suggestions.length - 1 && <Divider sx={{ my: 1 }} />}
            </React.Fragment>
          ))}
        </List>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={loadSuggestions}
            startIcon={<AIIcon />}
          >
            Làm mới gợi ý
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SmartProductSuggestions;
