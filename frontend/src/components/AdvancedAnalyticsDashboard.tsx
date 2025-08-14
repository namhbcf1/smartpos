/**
 * ADVANCED ANALYTICS DASHBOARD
 * 
 * Enhanced business intelligence dashboard with comprehensive analytics,
 * profit analysis, sales forecasting, and custom reporting capabilities.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  GetApp as ExportIcon,
  Refresh as RefreshIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as ShowChartIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import api from '../services/api';

// Interfaces
interface BusinessMetrics {
  totalRevenue: number;
  totalProfit: number;
  averageOrderValue: number;
  customerAcquisitionCost: number;
  customerLifetimeValue: number;
  inventoryTurnover: number;
  grossMargin: number;
  netMargin: number;
  salesGrowthRate: number;
  customerRetentionRate: number;
}

interface SalesTrend {
  period: string;
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  uniqueCustomers: number;
  growthRate: number;
  seasonalityIndex: number;
  forecastedSales?: number;
}

interface ProfitAnalysis {
  productId: number;
  productName: string;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
  unitsSold: number;
  averageSellingPrice: number;
  averageCostPrice: number;
  profitPerUnit: number;
  period: string;
}

interface CustomerSegments {
  [key: string]: {
    count: number;
    totalValue: number;
    averageValue: number;
  };
}

interface ProductPerformance {
  productId: number;
  productName: string;
  categoryName: string;
  totalSales: number;
  revenue: number;
  profitMargin: number;
  inventoryTurnover: number;
  daysInStock: number;
  performanceScore: number;
  recommendation: 'promote' | 'maintain' | 'review' | 'discontinue';
}

const AdvancedAnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics | null>(null);
  const [salesTrends, setSalesTrends] = useState<SalesTrend[]>([]);
  const [profitAnalysis, setProfitAnalysis] = useState<ProfitAnalysis[]>([]);
  const [customerSegments, setCustomerSegments] = useState<CustomerSegments>({});
  const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([]);

  // Dialog states
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/api/v1/business-intelligence/dashboard');
      const data = response.data.data;

      setBusinessMetrics(data.businessMetrics);
      setSalesTrends(data.salesTrends);
      setCustomerSegments(data.customerSegments);
      setProductPerformance(data.topProducts);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProfitAnalysis = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/business-intelligence/profit-analysis');
      setProfitAnalysis(response.data.data);
    } catch (err) {
      setError('Failed to load profit analysis');
      console.error('Profit analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'promote': return 'success';
      case 'maintain': return 'info';
      case 'review': return 'warning';
      case 'discontinue': return 'error';
      default: return 'default';
    }
  };

  // Key Metrics Cards Component
  const KeyMetricsCards = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(businessMetrics?.totalRevenue || 0)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Revenue</Typography>
              </Box>
              <MoneyIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(businessMetrics?.totalProfit || 0)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Profit</Typography>
              </Box>
              <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {formatPercentage(businessMetrics?.grossMargin || 0)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Gross Margin</Typography>
              </Box>
              <AssessmentIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {formatPercentage(businessMetrics?.customerRetentionRate || 0)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Customer Retention</Typography>
              </Box>
              <PeopleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Sales Trends Chart Component
  const SalesTrendsChart = () => (
    <Card sx={{ height: 450 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <ShowChartIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Sales Trends & Forecasting</Typography>
        </Box>
        <Box sx={{ height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesTrends}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff7300" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ff7300" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <RechartsTooltip formatter={(value, name) => [formatCurrency(Number(value)), name]} />
              <Area
                type="monotone"
                dataKey="totalRevenue"
                stroke="#8884d8"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Revenue"
              />
              <Area
                type="monotone"
                dataKey="forecastedSales"
                stroke="#ff7300"
                fillOpacity={1}
                fill="url(#colorForecast)"
                strokeDasharray="5 5"
                name="Forecast"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );

  // Customer Segments Chart Component
  const CustomerSegmentsChart = () => {
    const segmentData = Object.entries(customerSegments).map(([segment, data]) => ({
      name: segment.charAt(0).toUpperCase() + segment.slice(1),
      value: data.count,
      totalValue: data.totalValue
    }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    return (
      <Card sx={{ height: 450 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <PieChartIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Customer Segmentation</Typography>
          </Box>
          <Box sx={{ height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {segmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" color="primary.main">
          Advanced Analytics Dashboard
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={() => setExportDialogOpen(true)}
            sx={{ mr: 2 }}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={loadDashboardData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box display="flex" justifyContent="center" my={2}>
          <CircularProgress />
        </Box>
      )}

      <KeyMetricsCards />

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <SalesTrendsChart />
        </Grid>
        <Grid item xs={12} md={4}>
          <CustomerSegmentsChart />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdvancedAnalyticsDashboard;
