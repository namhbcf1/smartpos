import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  Skeleton,
  useTheme,
  Container,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import { Refresh } from '@mui/icons-material';

import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, formatDate } from '../config/constants';

// Import components
import DashboardHeader from '../components/dashboard/DashboardHeader';
import StatsCards from '../components/dashboard/StatsCards';
import AIInsights from '../components/dashboard/AIInsights';
import { LiveStats } from '../components/realtime/LiveStats';
import { LiveNotifications } from '../components/realtime/LiveNotifications';
import { RealtimeStatus } from '../components/realtime/RealtimeStatus';

interface DashboardStats {
  todaySales: number;
  weekSales: number;
  todayOrders: number;
  weekOrders: number;
  lowStockCount: number;
  productCount: number;
  categoryCount: number;
  pendingOrders: number;
  customerCount: number;
  trendPercent: number;
}

const Dashboard = () => {
  console.log('🎯 Dashboard component rendering (NO MOCK DATA VERSION)...');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  // State Management - ONLY REAL DATA
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [aiInsights, setAiInsights] = useState<string[]>([]);

  // AI-Powered Insights Generator
  const generateAIInsights = useCallback((data: DashboardStats) => {
    const insights: string[] = [];
    
    if (data.trendPercent > 20) {
      insights.push(`🚀 Doanh thu tăng ${data.trendPercent.toFixed(1)}% - xu hướng tích cực!`);
    } else if (data.trendPercent < -10) {
      insights.push(`⚠️ Doanh thu giảm ${Math.abs(data.trendPercent).toFixed(1)}% - cần xem xét chiến lược`);
    }
    
    if (data.lowStockCount > 5) {
      insights.push(`📦 ${data.lowStockCount} sản phẩm sắp hết hàng - cần nhập kho`);
    }
    
    const avgOrderValue = data.todaySales / Math.max(data.todayOrders, 1);
    if (avgOrderValue > 500000) {
      insights.push(`💰 Giá trị đơn hàng trung bình cao: ${formatCurrency(avgOrderValue)}`);
    }
    
    insights.push(`🎯 Hiệu suất hôm nay: ${data.todayOrders} đơn hàng, ${formatCurrency(data.todaySales)} doanh thu`);
    
    return insights;
  }, []);

  // 🔥 ONLY REAL API DATA - NO FALLBACK MOCK DATA
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('🔄 Fetching REAL dashboard data from D1 database...');
        setLoading(true);

        // Fetch REAL dashboard statistics from API
        const statsData = await api.get<any>('/dashboard/stats');
        console.log('📊 REAL D1 API stats data:', statsData);

        if (!statsData) {
          throw new Error('No data received from API');
        }

        // Transform API data to match expected format
        const processedStats: DashboardStats = {
          todaySales: statsData.todayRevenue || 0,
          weekSales: statsData.weekRevenue || 0,
          todayOrders: statsData.todaySales || 0,
          weekOrders: statsData.weekSales || 0,
          lowStockCount: statsData.lowStockProducts || 0,
          productCount: statsData.totalProducts || 0,
          categoryCount: statsData.totalCategories || 0,
          customerCount: statsData.totalCustomers || 0,
          pendingOrders: statsData.pendingOrders || 0,
          trendPercent: statsData.trendPercent || 0,
        };

        console.log('📊 Processed REAL stats:', processedStats);
        setStats(processedStats);

        // Generate AI insights from REAL data
        const insights = generateAIInsights(processedStats);
        setAiInsights(insights);

        console.log('✅ Dashboard data fetch completed successfully with REAL D1 data!');
        setError(null);
        setRetryCount(0);
        setLoading(false);

      } catch (err) {
        console.error('❌ Dashboard API error:', err);
        setError(`Không thể kết nối tới cơ sở dữ liệu D1. Lần thử: ${retryCount + 1}`);
        setRetryCount(prev => prev + 1);

        // Retry with exponential backoff
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        setTimeout(() => {
          if (retryCount < 5) {
            console.log(`🔄 Retrying dashboard data fetch in ${retryDelay}ms...`);
            fetchDashboardData();
          } else {
            console.log('❌ Max retries reached. Stopping auto-retry.');
            setLoading(false);
          }
        }, retryDelay);

        // 🔥 NO FALLBACK DATA - Keep waiting for real D1 data
        setStats(null);
        setAiInsights(['Đang kết nối tới cơ sở dữ liệu D1...']);
      }
    };
    
    fetchDashboardData();
  }, []); // Only run once on mount

  const handleRefreshData = useCallback(() => {
    setRetryCount(0);
    setError(null);
    setLoading(true);
    // Trigger re-fetch by updating a dependency
    window.location.reload();
  }, []);

  // Loading State
  if (loading) {
    console.log('⏳ Rendering loading state...');
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Đang tải dữ liệu từ cơ sở dữ liệu D1 Cloudflare...
          </Typography>
        </Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
          <Grid item xs={12}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  // Error State - NO MOCK DATA
  if (error || !stats) {
    console.log('❌ Rendering error state:', error);
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2, mb: 3 }}>
          {error || 'Không thể tải dữ liệu từ cơ sở dữ liệu D1'}
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                🔗 Đang kết nối tới Cloudflare D1 Database
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Hệ thống chỉ hiển thị dữ liệu thật từ D1, không có mock data.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={handleRefreshData}
                sx={{ mt: 2 }}
              >
                Thử lại kết nối
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    );
  }

  // Main Dashboard with REAL DATA ONLY
  console.log('✅ Rendering main dashboard with REAL D1 stats:', stats);

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 1, sm: 2 }, px: { xs: 1, sm: 2, md: 3 } }}>
      {/* Dashboard Header */}
      <DashboardHeader
        selectedTimeRange="today"
        setSelectedTimeRange={() => {}}
        handleRefreshData={handleRefreshData}
        handleFullscreenToggle={() => {}}
        setSettingsDialogOpen={() => {}}
        fullscreen={false}
        alertsCount={stats.lowStockCount}
      />

      <Grid container spacing={3} data-testid="dashboard-stats">
        {/* Stats Cards with REAL DATA */}
        <Grid item xs={12}>
          <StatsCards
            stats={stats}
            formatCurrency={formatCurrency}
            formatPercentage={(value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`}
            getTrendColor={(value: number) => 
              value > 0 ? theme.palette.success.main : 
              value < 0 ? theme.palette.error.main : 
              theme.palette.text.secondary
            }
          />
        </Grid>

        {/* AI Insights from REAL DATA */}
        <AIInsights aiInsights={aiInsights} />

        {/* Realtime Components */}
        <Grid item xs={12} md={6}>
          <RealtimeStatus showDetails={true} />
        </Grid>

        <Grid item xs={12} md={6}>
          <div data-testid="notifications">
            <LiveNotifications maxItems={5} />
          </div>
        </Grid>

        <Grid item xs={12}>
          <LiveStats refreshInterval={30000} />
        </Grid>

        {/* Data Source Info */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
            <Typography variant="h6" gutterBottom>
              ✅ 100% Dữ liệu thật từ Cloudflare D1
            </Typography>
            <Typography variant="body2">
              Tất cả dữ liệu hiển thị đều được lấy trực tiếp từ cơ sở dữ liệu D1 Cloudflare. 
              Không có mock data hay dữ liệu giả mạo nào.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption">
                Backend: smartpos-api.bangachieu2.workers.dev | 
                Frontend: smartpos-web.pages.dev | 
                Database: Cloudflare D1
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
