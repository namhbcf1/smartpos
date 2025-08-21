import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
  Divider,
  Stack,
  Button,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Badge,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  TrendingUp as TrendIcon,
  Warning as AlertIcon,
  CheckCircle as SuccessIcon,
  Schedule as ScheduleIcon,
  MonetizationOn as CostIcon,
  People as PeopleIcon,
  Build as RepairIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreIcon,
  CalendarToday as CalendarIcon,
  Speed as SpeedIcon,
  Assessment as ReportIcon,
  Notifications as NotificationIcon,
  Timeline as TimelineIcon,
  PieChart as ChartIcon,
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import api from '../services/api';

interface WarrantyStats {
  total_active_warranties: number;
  expiring_soon: number;
  expired_this_month: number;
  pending_claims: number;
  completed_claims_this_month: number;
  warranty_cost_this_month: number;
  average_claim_resolution_days: number;
  warranty_claim_rate: number;
}

interface WarrantyTrend {
  month: string;
  active: number;
  expired: number;
  claims: number;
  cost: number;
}

interface ClaimStatus {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

interface TopProduct {
  product_name: string;
  warranty_count: number;
  claim_rate: number;
  avg_cost: number;
}

interface RecentActivity {
  id: number;
  type: 'warranty_registered' | 'claim_submitted' | 'claim_resolved' | 'warranty_expired';
  title: string;
  description: string;
  timestamp: string;
  status: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

const WarrantyDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [stats, setStats] = useState<WarrantyStats | null>(null);
  const [trends, setTrends] = useState<WarrantyTrend[]>([]);
  const [claimStatuses, setClaimStatuses] = useState<ClaimStatus[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [refreshKey, setRefreshKey] = useState(0);

  // Mock data for development
  const mockTrends: WarrantyTrend[] = [
    { month: 'T1', active: 45, expired: 12, claims: 8, cost: 2500000 },
    { month: 'T2', active: 52, expired: 15, claims: 12, cost: 3200000 },
    { month: 'T3', active: 48, expired: 18, claims: 10, cost: 2800000 },
    { month: 'T4', active: 55, expired: 20, claims: 15, cost: 3800000 },
    { month: 'T5', active: 62, expired: 22, claims: 18, cost: 4200000 },
    { month: 'T6', active: 58, expired: 25, claims: 14, cost: 3500000 },
  ];

  const mockClaimStatuses: ClaimStatus[] = [
    { status: 'Chờ xử lý', count: 8, percentage: 32, color: '#FF9800' },
    { status: 'Đang xử lý', count: 12, percentage: 48, color: '#2196F3' },
    { status: 'Hoàn thành', count: 3, percentage: 12, color: '#4CAF50' },
    { status: 'Từ chối', count: 2, percentage: 8, color: '#f44336' },
  ];

  const mockTopProducts: TopProduct[] = [
    { product_name: 'Laptop Dell XPS 13', warranty_count: 15, claim_rate: 6.7, avg_cost: 850000 },
    { product_name: 'PC Gaming RTX 4070', warranty_count: 12, claim_rate: 8.3, avg_cost: 1200000 },
    { product_name: 'Monitor 4K 27"', warranty_count: 8, claim_rate: 12.5, avg_cost: 650000 },
    { product_name: 'SSD NVMe 1TB', warranty_count: 25, claim_rate: 4.0, avg_cost: 320000 },
  ];

  const mockRecentActivities: RecentActivity[] = [
    {
      id: 1,
      type: 'warranty_registered',
      title: 'Đăng ký bảo hành mới',
      description: 'Laptop Dell XPS 13 - Khách hàng: Nguyễn Văn A',
      timestamp: '2024-01-15T10:30:00Z',
      status: 'active',
      priority: 'low'
    },
    {
      id: 2,
      type: 'claim_submitted',
      title: 'Yêu cầu bảo hành',
      description: 'PC Gaming - Màn hình bị sọc - Khách hàng: Trần Thị B',
      timestamp: '2024-01-15T09:15:00Z',
      status: 'pending',
      priority: 'high'
    },
    {
      id: 3,
      type: 'claim_resolved',
      title: 'Hoàn thành bảo hành',
      description: 'SSD NVMe - Thay thế thành công - Khách hàng: Lê Văn C',
      timestamp: '2024-01-14T16:45:00Z',
      status: 'completed',
      priority: 'medium'
    },
    {
      id: 4,
      type: 'warranty_expired',
      title: 'Bảo hành hết hạn',
      description: 'Monitor 4K - Hết hạn ngày 14/01/2024',
      timestamp: '2024-01-14T00:00:00Z',
      status: 'expired',
      priority: 'low'
    },
  ];

  useEffect(() => {
    loadDashboardData();
  }, [refreshKey, timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load stats
      const statsResponse = await api.get('/warranty/dashboard');
      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      // For now, use mock data for trends and other analytics
      // TODO: Replace with real API calls when backend is ready
      setTrends(mockTrends);
      setClaimStatuses(mockClaimStatuses);
      setTopProducts(mockTopProducts);
      setRecentActivities(mockRecentActivities);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Không thể tải dữ liệu dashboard');
      
      // Fallback to mock data
      setTrends(mockTrends);
      setClaimStatuses(mockClaimStatuses);
      setTopProducts(mockTopProducts);
      setRecentActivities(mockRecentActivities);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'completed': return 'success';
      case 'expired': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return '#f44336';
      case 'high': return '#FF9800';
      case 'medium': return '#2196F3';
      case 'low': return '#4CAF50';
      default: return '#757575';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'warranty_registered': return <SuccessIcon color="success" />;
      case 'claim_submitted': return <AlertIcon color="warning" />;
      case 'claim_resolved': return <SuccessIcon color="success" />;
      case 'warranty_expired': return <ScheduleIcon color="error" />;
      default: return <NotificationIcon />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Dashboard Bảo hành
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Tổng quan hệ thống bảo hành và phân tích hiệu suất
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Làm mới
          </Button>
          <Button
            variant="contained"
            startIcon={<ReportIcon />}
          >
            Xuất báo cáo
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Key Metrics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      BH hiệu lực
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight="bold" color="primary.main">
                      {stats.total_active_warranties.toLocaleString('vi-VN')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      +{Math.floor(stats.total_active_warranties * 0.1)} so với tháng trước
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                    <TrendIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Sắp hết hạn
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight="bold" color="warning.main">
                      {stats.expiring_soon.toLocaleString('vi-VN')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Trong 30 ngày tới
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
                    <AlertIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Yêu cầu BH
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight="bold" color="info.main">
                      {stats.pending_claims.toLocaleString('vi-VN')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Đang chờ xử lý
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
                    <RepairIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Chi phí BH
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight="bold" color="success.main">
                      {formatCurrency(stats.warranty_cost_this_month)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Tháng này
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                    <CostIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Trend Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2">
                  Xu hướng bảo hành
                </Typography>
                <Stack direction="row" spacing={1}>
                  {(['7d', '30d', '90d', '1y'] as const).map((range) => (
                    <Chip
                      key={range}
                      label={range === '7d' ? '7 ngày' : range === '30d' ? '30 ngày' : range === '90d' ? '90 ngày' : '1 năm'}
                      variant={timeRange === range ? 'filled' : 'outlined'}
                      size="small"
                      onClick={() => setTimeRange(range)}
                      clickable
                    />
                  ))}
                </Stack>
              </Box>
              
              <Box sx={{ height: 300, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <RechartsTooltip 
                      formatter={(value: any, name: string) => [
                        name === 'cost' ? formatCurrency(value) : value,
                        name === 'active' ? 'BH hiệu lực' : 
                        name === 'expired' ? 'BH hết hạn' :
                        name === 'claims' ? 'Yêu cầu BH' : 'Chi phí'
                      ]
                    }
                    />
                    <Line yAxisId="left" type="monotone" dataKey="active" stroke="#4CAF50" strokeWidth={2} name="active" />
                    <Line yAxisId="left" type="monotone" dataKey="expired" stroke="#f44336" strokeWidth={2} name="expired" />
                    <Line yAxisId="left" type="monotone" dataKey="claims" stroke="#FF9800" strokeWidth={2} name="claims" />
                    <Line yAxisId="right" type="monotone" dataKey="cost" stroke="#2196F3" strokeWidth={2} name="cost" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Claim Status Pie Chart */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Trạng thái yêu cầu BH
              </Typography>
              
              <Box sx={{ height: 300, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={claimStatuses}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, percentage }) => `${status}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {claimStatuses.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>

              <Box sx={{ mt: 2 }}>
                {claimStatuses.map((status) => (
                  <Box key={status.status} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: status.color,
                        mr: 1
                      }}
                    />
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {status.status}
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {status.count}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Metrics & Recent Activities */}
      <Grid container spacing={3}>
        {/* Performance Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Chỉ số hiệu suất
              </Typography>
              
              <Stack spacing={3}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Tỷ lệ yêu cầu BH
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {stats?.warranty_claim_rate || 0}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min((stats?.warranty_claim_rate || 0), 100)} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Thời gian xử lý trung bình
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {stats?.average_claim_resolution_days || 0} ngày
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(((stats?.average_claim_resolution_days || 0) / 7) * 100, 100)} 
                    sx={{ height: 8, borderRadius: 4 }}
                    color="success"
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      BH sắp hết hạn
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {stats?.expiring_soon || 0} / {stats?.total_active_warranties || 0}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats?.total_active_warranties ? (stats.expiring_soon / stats.total_active_warranties) * 100 : 0} 
                    sx={{ height: 8, borderRadius: 4 }}
                    color="warning"
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Hoạt động gần đây
              </Typography>
              
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {recentActivities.map((activity) => (
                  <ListItem key={activity.id} sx={{ px: 0 }}>
                    <ListItemIcon>
                      {getActivityIcon(activity.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight="medium">
                            {activity.title}
                          </Typography>
                          {activity.priority && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: getPriorityColor(activity.priority)
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {activity.description}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            {formatDate(activity.timestamp)}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={activity.status}
                        size="small"
                        color={getStatusColor(activity.status) as any}
                        variant="outlined"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Products by Warranty */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            Sản phẩm có nhiều bảo hành nhất
          </Typography>
          
          <Box sx={{ overflowX: 'auto' }}>
            <Box sx={{ minWidth: 600 }}>
              {topProducts.map((product, index) => (
                <Box
                  key={product.product_name}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    py: 2,
                    borderBottom: index < topProducts.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider'
                  }}
                >
                  <Box sx={{ width: 40, textAlign: 'center' }}>
                    <Typography variant="h6" color="primary.main" fontWeight="bold">
                      #{index + 1}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ flex: 1, ml: 2 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {product.product_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {product.warranty_count} bảo hành
                    </Typography>
                  </Box>
                  
                  <Box sx={{ width: 120, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Tỷ lệ yêu cầu
                    </Typography>
                    <Typography variant="body1" fontWeight="medium" color="warning.main">
                      {product.claim_rate}%
                    </Typography>
                  </Box>
                  
                  <Box sx={{ width: 120, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Chi phí TB
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatCurrency(product.avg_cost)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default WarrantyDashboard;
