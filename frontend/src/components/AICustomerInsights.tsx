import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Chip,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert
} from '@mui/material';
import {
  Psychology as AIIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  ShoppingCart as ShoppingIcon,
  Star as StarIcon,
  Insights as InsightsIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  MonetizationOn as MoneyIcon,
  Schedule as ScheduleIcon,
  Favorite as FavoriteIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface CustomerInsight {
  id: string;
  customer_id: number;
  customer_name: string;
  insight_type: 'high_value' | 'frequent_buyer' | 'at_risk' | 'new_opportunity' | 'seasonal_pattern';
  confidence_score: number;
  description: string;
  recommended_actions: string[];
  potential_value: number;
  last_purchase_date: string;
  total_spent: number;
  purchase_frequency: number;
  favorite_categories: string[];
  risk_factors?: string[];
  opportunities?: string[];
}

interface CustomerSegment {
  segment: string;
  count: number;
  percentage: number;
  avg_value: number;
  color: string;
}

interface PurchasePattern {
  month: string;
  revenue: number;
  customers: number;
  avg_order_value: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AICustomerInsights: React.FC = () => {
  const [insights, setInsights] = useState<CustomerInsight[]>([]);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [patterns, setPatterns] = useState<PurchasePattern[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<CustomerInsight | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Mock data generation for demo
  useEffect(() => {
    generateMockData();
  }, []);

  const generateMockData = () => {
    setLoading(true);
    
    // Mock customer insights
    const mockInsights: CustomerInsight[] = [
      {
        id: '1',
        customer_id: 101,
        customer_name: 'Nguyễn Văn A',
        insight_type: 'high_value',
        confidence_score: 0.92,
        description: 'Khách hàng VIP với giá trị mua hàng cao, thường mua linh kiện cao cấp',
        recommended_actions: ['Gửi catalog sản phẩm premium', 'Ưu đãi đặc biệt cho VIP', 'Tư vấn cá nhân hóa'],
        potential_value: 15000000,
        last_purchase_date: '2024-01-15',
        total_spent: 45000000,
        purchase_frequency: 2.5,
        favorite_categories: ['CPU', 'GPU', 'RAM']
      },
      {
        id: '2',
        customer_id: 102,
        customer_name: 'Trần Thị B',
        insight_type: 'at_risk',
        confidence_score: 0.78,
        description: 'Khách hàng có nguy cơ rời bỏ, không mua hàng trong 3 tháng qua',
        recommended_actions: ['Gửi ưu đãi đặc biệt', 'Liên hệ tư vấn', 'Survey lý do không mua'],
        potential_value: 5000000,
        last_purchase_date: '2023-10-20',
        total_spent: 12000000,
        purchase_frequency: 1.2,
        favorite_categories: ['Laptop', 'Phụ kiện'],
        risk_factors: ['Không mua hàng 3 tháng', 'Giảm tần suất mua', 'Không phản hồi email']
      },
      {
        id: '3',
        customer_id: 103,
        customer_name: 'Lê Văn C',
        insight_type: 'frequent_buyer',
        confidence_score: 0.85,
        description: 'Khách hàng mua hàng thường xuyên, có xu hướng mua theo mùa',
        recommended_actions: ['Thông báo sản phẩm mới', 'Chương trình loyalty', 'Ưu đãi bulk order'],
        potential_value: 8000000,
        last_purchase_date: '2024-01-10',
        total_spent: 28000000,
        purchase_frequency: 4.2,
        favorite_categories: ['Gaming', 'Cooling', 'Case']
      }
    ];

    // Mock customer segments
    const mockSegments: CustomerSegment[] = [
      { segment: 'VIP Customers', count: 45, percentage: 15, avg_value: 25000000, color: '#0088FE' },
      { segment: 'Regular Buyers', count: 120, percentage: 40, avg_value: 8000000, color: '#00C49F' },
      { segment: 'Occasional Buyers', count: 90, percentage: 30, avg_value: 3000000, color: '#FFBB28' },
      { segment: 'At Risk', count: 30, percentage: 10, avg_value: 1500000, color: '#FF8042' },
      { segment: 'New Customers', count: 15, percentage: 5, avg_value: 2000000, color: '#8884D8' }
    ];

    // Mock purchase patterns
    const mockPatterns: PurchasePattern[] = [
      { month: 'T1', revenue: 450000000, customers: 180, avg_order_value: 2500000 },
      { month: 'T2', revenue: 520000000, customers: 195, avg_order_value: 2670000 },
      { month: 'T3', revenue: 480000000, customers: 170, avg_order_value: 2820000 },
      { month: 'T4', revenue: 680000000, customers: 220, avg_order_value: 3090000 },
      { month: 'T5', revenue: 750000000, customers: 240, avg_order_value: 3125000 },
      { month: 'T6', revenue: 620000000, customers: 200, avg_order_value: 3100000 }
    ];

    setTimeout(() => {
      setInsights(mockInsights);
      setSegments(mockSegments);
      setPatterns(mockPatterns);
      setLoading(false);
    }, 1500);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'high_value': return <StarIcon sx={{ color: '#FFD700' }} />;
      case 'frequent_buyer': return <ShoppingIcon sx={{ color: '#00C49F' }} />;
      case 'at_risk': return <TrendingUpIcon sx={{ color: '#FF8042', transform: 'rotate(180deg)' }} />;
      case 'new_opportunity': return <InsightsIcon sx={{ color: '#8884D8' }} />;
      default: return <PersonIcon />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'high_value': return '#FFD700';
      case 'frequent_buyer': return '#00C49F';
      case 'at_risk': return '#FF8042';
      case 'new_opportunity': return '#8884D8';
      default: return '#666';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleInsightClick = (insight: CustomerInsight) => {
    setSelectedInsight(insight);
    setDialogOpen(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AIIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          AI Customer Insights
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={generateMockData}
          disabled={loading}
        >
          Làm mới dữ liệu
        </Button>
      </Box>

      {loading && (
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <AIIcon sx={{ mr: 1 }} />
            AI đang phân tích dữ liệu khách hàng...
          </Alert>
          <LinearProgress />
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Customer Segments */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Phân khúc khách hàng
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={segments}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ segment, percentage }) => `${segment}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {segments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value, name) => [`${value} khách hàng`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Purchase Patterns */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Xu hướng mua hàng
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={patterns}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => [formatCurrency(Number(value)), 'Doanh thu']} />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* AI Insights */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Insights từ AI
              </Typography>
              <Grid container spacing={2}>
                {insights.map((insight) => (
                  <Grid item xs={12} md={4} key={insight.id}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { boxShadow: 4 },
                        border: `2px solid ${getInsightColor(insight.insight_type)}20`
                      }}
                      onClick={() => handleInsightClick(insight)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ bgcolor: `${getInsightColor(insight.insight_type)}20`, mr: 2 }}>
                            {getInsightIcon(insight.insight_type)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {insight.customer_name}
                            </Typography>
                            <Chip 
                              label={`${Math.round(insight.confidence_score * 100)}% tin cậy`}
                              size="small"
                              color="primary"
                            />
                          </Box>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {insight.description}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Tiềm năng: {formatCurrency(insight.potential_value)}
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={insight.confidence_score * 100}
                            sx={{ width: 60, ml: 1 }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Insight Detail Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {selectedInsight && getInsightIcon(selectedInsight.insight_type)}
              <Typography variant="h6" sx={{ ml: 1 }}>
                Chi tiết Insight - {selectedInsight?.customer_name}
              </Typography>
            </Box>
            <IconButton onClick={() => setDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedInsight && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Thông tin khách hàng</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar><MoneyIcon /></Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary="Tổng chi tiêu"
                        secondary={formatCurrency(selectedInsight.total_spent)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar><ScheduleIcon /></Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary="Tần suất mua hàng"
                        secondary={`${selectedInsight.purchase_frequency} lần/tháng`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar><FavoriteIcon /></Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary="Danh mục yêu thích"
                        secondary={selectedInsight.favorite_categories.join(', ')}
                      />
                    </ListItem>
                  </List>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Khuyến nghị hành động</Typography>
                  <List dense>
                    {selectedInsight.recommended_actions.map((action, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={`${index + 1}. ${action}`} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
              
              {selectedInsight.risk_factors && (
                <Box sx={{ mt: 2 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle2" gutterBottom color="error">
                    Yếu tố rủi ro
                  </Typography>
                  <List dense>
                    {selectedInsight.risk_factors.map((risk, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={`• ${risk}`} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AICustomerInsights;
