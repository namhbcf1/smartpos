import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  LinearProgress,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  MonetizationOn as MoneyIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  ShoppingCart as CartIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  Insights as InsightsIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';

interface KPIMetric {
  id: string;
  title: string;
  value: number;
  previousValue: number;
  unit: string;
  format: 'currency' | 'number' | 'percentage';
  trend: 'up' | 'down' | 'stable';
  change: number;
  icon: React.ReactNode;
  color: string;
  target?: number;
}

interface BusinessInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'success' | 'info';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionRequired: boolean;
  recommendations: string[];
  confidence: number;
}

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
  avgOrderValue: number;
  profit: number;
  profitMargin: number;
}

interface ProductPerformance {
  name: string;
  revenue: number;
  quantity: number;
  profit: number;
  margin: number;
  trend: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const BusinessIntelligenceDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(false);
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([]);
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Mock KPI data
      const mockKPIs: KPIMetric[] = [
        {
          id: 'revenue',
          title: 'Doanh thu',
          value: 2450000000,
          previousValue: 2100000000,
          unit: 'VND',
          format: 'currency',
          trend: 'up',
          change: 16.7,
          icon: <MoneyIcon />,
          color: '#4CAF50',
          target: 2500000000
        },
        {
          id: 'orders',
          title: 'Đơn hàng',
          value: 1247,
          previousValue: 1089,
          unit: 'đơn',
          format: 'number',
          trend: 'up',
          change: 14.5,
          icon: <CartIcon />,
          color: '#2196F3'
        },
        {
          id: 'customers',
          title: 'Khách hàng',
          value: 892,
          previousValue: 756,
          unit: 'người',
          format: 'number',
          trend: 'up',
          change: 18.0,
          icon: <PeopleIcon />,
          color: '#FF9800'
        },
        {
          id: 'profit_margin',
          title: 'Tỷ suất lợi nhuận',
          value: 23.5,
          previousValue: 21.2,
          unit: '%',
          format: 'percentage',
          trend: 'up',
          change: 2.3,
          icon: <TrendingUpIcon />,
          color: '#9C27B0'
        },
        {
          id: 'inventory_turnover',
          title: 'Vòng quay kho',
          value: 4.2,
          previousValue: 3.8,
          unit: 'lần',
          format: 'number',
          trend: 'up',
          change: 10.5,
          icon: <InventoryIcon />,
          color: '#00BCD4'
        },
        {
          id: 'avg_order_value',
          title: 'Giá trị đơn hàng TB',
          value: 1965000,
          previousValue: 1928000,
          unit: 'VND',
          format: 'currency',
          trend: 'up',
          change: 1.9,
          icon: <SpeedIcon />,
          color: '#795548'
        }
      ];

      // Mock insights
      const mockInsights: BusinessInsight[] = [
        {
          id: '1',
          type: 'opportunity',
          title: 'Cơ hội tăng doanh thu Gaming',
          description: 'Sản phẩm gaming đang có xu hướng tăng mạnh 45% so với tháng trước',
          impact: 'high',
          actionRequired: true,
          recommendations: [
            'Tăng stock sản phẩm gaming',
            'Chạy campaign marketing cho gaming',
            'Tạo bundle gaming combo'
          ],
          confidence: 0.87
        },
        {
          id: '2',
          type: 'warning',
          title: 'Hàng tồn kho cao - RAM DDR4',
          description: 'RAM DDR4 có tồn kho cao và bán chậm, có thể ảnh hưởng đến cash flow',
          impact: 'medium',
          actionRequired: true,
          recommendations: [
            'Giảm giá RAM DDR4',
            'Tạo combo với mainboard',
            'Ngừng nhập thêm DDR4'
          ],
          confidence: 0.92
        },
        {
          id: '3',
          type: 'success',
          title: 'Khách hàng VIP tăng trưởng',
          description: 'Số lượng khách hàng VIP tăng 25%, đóng góp 60% doanh thu',
          impact: 'high',
          actionRequired: false,
          recommendations: [
            'Duy trì chương trình VIP',
            'Mở rộng benefits cho VIP',
            'Tạo tier cao hơn'
          ],
          confidence: 0.95
        }
      ];

      // Mock sales data
      const mockSalesData: SalesData[] = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 50000000) + 30000000,
        orders: Math.floor(Math.random() * 30) + 20,
        customers: Math.floor(Math.random() * 25) + 15,
        avgOrderValue: Math.floor(Math.random() * 1000000) + 1500000,
        profit: Math.floor(Math.random() * 15000000) + 8000000,
        profitMargin: Math.random() * 10 + 15
      }));

      // Mock product performance
      const mockProductPerformance: ProductPerformance[] = [
        { name: 'RTX 4090', revenue: 450000000, quantity: 45, profit: 90000000, margin: 20, trend: 15 },
        { name: 'Intel i9-13900K', revenue: 380000000, quantity: 95, profit: 76000000, margin: 20, trend: 8 },
        { name: 'DDR5 32GB', revenue: 320000000, quantity: 160, profit: 64000000, margin: 20, trend: 12 },
        { name: 'Samsung 980 Pro', revenue: 280000000, quantity: 140, profit: 56000000, margin: 20, trend: -5 },
        { name: 'ASUS ROG Strix', revenue: 250000000, quantity: 25, profit: 50000000, margin: 20, trend: 22 }
      ];

      setKpiMetrics(mockKPIs);
      setInsights(mockInsights);
      setSalesData(mockSalesData);
      setProductPerformance(mockProductPerformance);
      setLoading(false);
    }, 1500);
  };

  const formatValue = (value: number, format: string, unit: string) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return `${value.toLocaleString('vi-VN')} ${unit}`;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUpIcon sx={{ color: '#4CAF50' }} />;
      case 'warning': return <WarningIcon sx={{ color: '#FF9800' }} />;
      case 'success': return <CheckIcon sx={{ color: '#4CAF50' }} />;
      default: return <InsightsIcon sx={{ color: '#2196F3' }} />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity': return '#E8F5E8';
      case 'warning': return '#FFF3E0';
      case 'success': return '#E8F5E8';
      default: return '#E3F2FD';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AnalyticsIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Business Intelligence Dashboard
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        
        <FormControl sx={{ mr: 2, minWidth: 120 }}>
          <InputLabel>Thời gian</InputLabel>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            label="Thời gian"
          >
            <MenuItem value="7d">7 ngày</MenuItem>
            <MenuItem value="30d">30 ngày</MenuItem>
            <MenuItem value="90d">90 ngày</MenuItem>
            <MenuItem value="1y">1 năm</MenuItem>
          </Select>
        </FormControl>
        
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadDashboardData}
          disabled={loading}
          sx={{ mr: 1 }}
        >
          Làm mới
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
        >
          Xuất báo cáo
        </Button>
      </Box>

      {loading && (
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <AnalyticsIcon sx={{ mr: 1 }} />
            Đang phân tích dữ liệu business intelligence...
          </Alert>
          <LinearProgress />
        </Box>
      )}

      {/* KPI Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {kpiMetrics.map((metric) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={metric.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar sx={{ bgcolor: metric.color, width: 40, height: 40, mr: 2 }}>
                    {metric.icon}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {metric.title}
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {formatValue(metric.value, metric.format, metric.unit)}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Chip
                    icon={metric.trend === 'up' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                    label={`${metric.change > 0 ? '+' : ''}${metric.change.toFixed(1)}%`}
                    color={metric.trend === 'up' ? 'success' : 'error'}
                    size="small"
                  />
                  
                  {metric.target && (
                    <Typography variant="caption" color="text.secondary">
                      Mục tiêu: {Math.round((metric.value / metric.target) * 100)}%
                    </Typography>
                  )}
                </Box>
                
                {metric.target && (
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((metric.value / metric.target) * 100, 100)}
                    sx={{ mt: 1, height: 4, borderRadius: 2 }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Sales Trend Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Xu hướng doanh thu & lợi nhuận
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <RechartsTooltip 
                    formatter={(value, name) => [
                      name === 'revenue' || name === 'profit' 
                        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value))
                        : value,
                      name === 'revenue' ? 'Doanh thu' : name === 'profit' ? 'Lợi nhuận' : 'Đơn hàng'
                    ]}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  <Area yAxisId="left" type="monotone" dataKey="profit" stackId="2" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                  <Bar yAxisId="right" dataKey="orders" fill="#ffc658" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Business Insights */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                AI Business Insights
              </Typography>
              <List dense>
                {insights.map((insight) => (
                  <React.Fragment key={insight.id}>
                    <ListItem sx={{ bgcolor: getInsightColor(insight.type), borderRadius: 1, mb: 1 }}>
                      <ListItemIcon>
                        {getInsightIcon(insight.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2">
                              {insight.title}
                            </Typography>
                            <Chip 
                              label={`${Math.round(insight.confidence * 100)}%`}
                              size="small"
                              color="primary"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              {insight.description}
                            </Typography>
                            {insight.actionRequired && (
                              <Chip 
                                label="Cần hành động"
                                size="small"
                                color="warning"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Products Performance */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top sản phẩm hiệu suất cao
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip 
                    formatter={(value, name) => [
                      name === 'revenue' || name === 'profit' 
                        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value))
                        : value,
                      name === 'revenue' ? 'Doanh thu' : name === 'profit' ? 'Lợi nhuận' : 'Số lượng'
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#8884d8" />
                  <Bar dataKey="profit" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BusinessIntelligenceDashboard;
