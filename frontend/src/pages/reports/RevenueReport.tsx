import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  MonetizationOn as MoneyIcon,
  ShoppingCart as OrdersIcon,
  People as CustomersIcon,
  Assessment as AnalyticsIcon,
  Insights as InsightsIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Psychology as AIIcon,
  Warning as WarningIcon,
  Lightbulb as OpportunityIcon,
  Timeline as TrendIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import api from '../../services/api';

interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
  avgOrderValue: number;
  profit: number;
  profitMargin: number;
  growth: number;
  dayOfWeek: string;
}

interface RevenueInsight {
  type: 'trend' | 'pattern' | 'opportunity' | 'warning';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
  potentialValue?: number;
}

interface RevenueReportData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    avgDailyRevenue: number;
    totalProfit: number;
    avgProfitMargin: number;
    avgOrderValue: number;
    avgGrowth: number;
    period: string;
    store: string;
    daysAnalyzed: number;
  };
  dailyData: RevenueData[];
  insights: RevenueInsight[];
  metadata: {
    generatedAt: string;
    currency: string;
    aiAnalysis: boolean;
    confidenceLevel: string;
  };
}

const RevenueReport: React.FC = () => {
  const [reportData, setReportData] = useState<RevenueReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [store, setStore] = useState('all');

  useEffect(() => {
    loadRevenueReport();
  }, []);

  const loadRevenueReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // api.get returns the nested data directly
      const data = await api.get<RevenueReportData>(
        `/reports/revenue?dateFrom=${dateFrom}&dateTo=${dateTo}&store=${store}`
      );
      setReportData(data);
    } catch (error: any) {
      console.error('Error loading revenue report:', error);
      const message = error?.response?.data?.message || error?.message || 'Lỗi khi tải báo cáo doanh thu';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '0 ₫';
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const safeToFixed = (value: number | undefined, digits: number = 1): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0';
    }
    return value.toFixed(digits);
  };

  const safeNumber = (value: number | undefined): number => {
    if (value === undefined || value === null || isNaN(value)) {
      return 0;
    }
    return value;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendIcon sx={{ color: '#4CAF50' }} />;
      case 'pattern': return <AnalyticsIcon sx={{ color: '#2196F3' }} />;
      case 'opportunity': return <OpportunityIcon sx={{ color: '#FF9800' }} />;
      case 'warning': return <WarningIcon sx={{ color: '#f44336' }} />;
      default: return <InsightsIcon />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'trend': return '#E8F5E8';
      case 'pattern': return '#E3F2FD';
      case 'opportunity': return '#FFF3E0';
      case 'warning': return '#FFEBEE';
      default: return '#F5F5F5';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            AI đang phân tích dữ liệu doanh thu...
          </Typography>
          <LinearProgress sx={{ width: '300px', mt: 2 }} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadRevenueReport} startIcon={<RefreshIcon />}>
          Thử lại
        </Button>
      </Container>
    );
  }

  if (!reportData) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="info">
          Không có dữ liệu báo cáo
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 56, height: 56 }}>
            <MoneyIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1">
              Báo cáo Doanh thu Thông minh
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Phân tích AI • {reportData?.summary?.period || 'Đang tải...'} • {safeNumber(reportData?.summary?.daysAnalyzed)} ngày
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Làm mới dữ liệu">
            <IconButton onClick={loadRevenueReport}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button variant="outlined" startIcon={<DownloadIcon />}>
            Xuất báo cáo
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Bộ lọc báo cáo
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Từ ngày"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Đến ngày"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Cửa hàng</InputLabel>
              <Select
                value={store}
                onChange={(e) => setStore(e.target.value)}
                label="Cửa hàng"
              >
                <MenuItem value="all">Tất cả cửa hàng</MenuItem>
                <MenuItem value="main">Cửa hàng chính</MenuItem>
                <MenuItem value="branch">Chi nhánh</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={loadRevenueReport}
              sx={{ height: '56px' }}
            >
              Cập nhật báo cáo
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#4CAF50', mr: 2 }}>
                  <MoneyIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Tổng doanh thu
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(reportData?.summary?.totalRevenue)}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={`${safeNumber(reportData?.summary?.avgGrowth) > 0 ? '+' : ''}${safeToFixed(reportData?.summary?.avgGrowth, 1)}%`}
                color={safeNumber(reportData?.summary?.avgGrowth) > 0 ? 'success' : 'error'}
                size="small"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#2196F3', mr: 2 }}>
                  <OrdersIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Tổng đơn hàng
                  </Typography>
                  <Typography variant="h6">
                    {safeNumber(reportData?.summary?.totalOrders).toLocaleString('vi-VN')}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                TB: {Math.floor(safeNumber(reportData?.summary?.totalOrders) / safeNumber(reportData?.summary?.daysAnalyzed))} đơn/ngày
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#FF9800', mr: 2 }}>
                  <CustomersIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Khách hàng
                  </Typography>
                  <Typography variant="h6">
                    {safeNumber(reportData?.summary?.totalCustomers).toLocaleString('vi-VN')}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                AOV: {formatCurrency(reportData?.summary?.avgOrderValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#9C27B0', mr: 2 }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Lợi nhuận
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(reportData?.summary?.totalProfit)}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Margin: {safeToFixed(reportData?.summary?.avgProfitMargin, 1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts and Insights */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Xu hướng doanh thu theo ngày
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={reportData?.dailyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? formatCurrency(Number(value)) : value,
                      name === 'revenue' ? 'Doanh thu' : name === 'orders' ? 'Đơn hàng' : 'Lợi nhuận'
                    ]}
                  />
                  <Area type="monotone" dataKey="revenue" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="profit" stackId="2" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                AI Insights
              </Typography>
              <List dense>
                {(reportData?.insights || []).map((insight, index) => (
                  <React.Fragment key={index}>
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
                            <Typography variant="caption" color="primary">
                              💡 {insight.recommendation}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < (reportData?.insights?.length || 0) - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* AI Analysis Badge */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Chip
          icon={<AIIcon />}
          label={`Phân tích bởi AI • Độ tin cậy: ${reportData?.metadata?.confidenceLevel || 'high'} • Cập nhật: ${new Date(reportData?.metadata?.generatedAt || Date.now()).toLocaleString('vi-VN')}`}
          variant="outlined"
          color="primary"
        />
      </Box>
    </Container>
  );
};

export default RevenueReport;
