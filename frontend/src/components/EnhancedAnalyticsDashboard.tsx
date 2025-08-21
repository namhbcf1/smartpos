/**
 * Enhanced Analytics Dashboard Component
 * Uses advanced analytics APIs and real-time updates
 * Rules.md compliant - displays real Cloudflare D1 data
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  Badge,
  Tabs,
  Tab
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';

import { advancedAnalyticsApi } from '../services/advancedAnalyticsApi';
import { enhancedRealtimeService } from '../services/enhancedRealtimeService';
import { errorHandlingService } from '../services/errorHandlingService';
import { AdvancedDashboardData } from '../types/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface EnhancedAnalyticsDashboardProps {
  refreshInterval?: number;
}

const EnhancedAnalyticsDashboard: React.FC<EnhancedAnalyticsDashboardProps> = ({
  refreshInterval = 60000 // 1 minute default
}) => {
  const [dashboardData, setDashboardData] = useState<AdvancedDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  /**
   * Load dashboard analytics data
   */
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await advancedAnalyticsApi.getDashboardAnalytics();
      setDashboardData(data);
      setLastUpdated(new Date());
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load analytics data';
      setError(errorMessage);
      
      // Handle error through error service
      if (err.isAxiosError) {
        errorHandlingService.handleApiError(err, {
          endpoint: '/analytics-advanced/dashboard',
          method: 'GET'
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Handle real-time analytics updates
   */
  const handleRealtimeUpdate = useCallback((data: any) => {
    console.log('📊 Received real-time analytics update:', data);
    
    // Refresh dashboard data when analytics change
    loadDashboardData();
  }, [loadDashboardData]);

  /**
   * Setup real-time connections and intervals
   */
  useEffect(() => {
    // Initial load
    loadDashboardData();

    // Setup real-time subscriptions
    const analyticsSubscription = enhancedRealtimeService.subscribe(
      'analytics:updated',
      handleRealtimeUpdate
    );

    const salesSubscription = enhancedRealtimeService.subscribe(
      'sale_completed',
      handleRealtimeUpdate
    );

    // Monitor connection status
    enhancedRealtimeService.on('connected', () => setRealtimeConnected(true));
    enhancedRealtimeService.on('disconnected', () => setRealtimeConnected(false));

    // Setup refresh interval
    const interval = setInterval(loadDashboardData, refreshInterval);

    // Connect to real-time service
    enhancedRealtimeService.connect();

    return () => {
      // Cleanup
      enhancedRealtimeService.unsubscribe(analyticsSubscription);
      enhancedRealtimeService.unsubscribe(salesSubscription);
      clearInterval(interval);
    };
  }, [loadDashboardData, handleRealtimeUpdate, refreshInterval]);

  /**
   * Handle tab change
   */
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  /**
   * Format percentage
   */
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading && !dashboardData) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
          Đang tải dữ liệu phân tích...
        </Typography>
      </Box>
    );
  }

  if (error && !dashboardData) {
    return (
      <Alert 
        severity="error" 
        action={
          <IconButton color="inherit" size="small" onClick={loadDashboardData}>
            <RefreshIcon />
          </IconButton>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header with real-time status */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          📊 Phân tích kinh doanh nâng cao
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title={realtimeConnected ? 'Kết nối thời gian thực' : 'Mất kết nối thời gian thực'}>
            <Badge color={realtimeConnected ? 'success' : 'error'} variant="dot">
              <NotificationsIcon />
            </Badge>
          </Tooltip>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">
              Cập nhật lần cuối: {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
          <IconButton onClick={loadDashboardData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {dashboardData && (
        <>
          {/* Overview Statistics */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MoneyIcon sx={{ mr: 2, color: 'success.main' }} />
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Doanh thu
                      </Typography>
                      <Typography variant="h5">
                        {formatCurrency(dashboardData.overview.total_revenue)}
                      </Typography>
                      <Typography variant="caption" color="success.main">
                        +{formatPercentage(dashboardData.overview.growth_rate)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AnalyticsIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Giao dịch
                      </Typography>
                      <Typography variant="h5">
                        {(dashboardData.overview.total_transactions || 0).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUpIcon sx={{ mr: 2, color: 'info.main' }} />
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Giá trị TB/đơn
                      </Typography>
                      <Typography variant="h5">
                        {formatCurrency(dashboardData.overview.average_order_value)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PeopleIcon sx={{ mr: 2, color: 'warning.main' }} />
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Khách hàng
                      </Typography>
                      <Typography variant="h5">
                        {(dashboardData.overview.customer_count || 0).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Detailed Analytics Tabs */}
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={handleTabChange} aria-label="analytics tabs">
                <Tab label="Bán hàng" />
                <Tab label="Khách hàng" />
                <Tab label="Kho hàng" />
                <Tab label="Tài chính" />
              </Tabs>
            </Box>

            <TabPanel value={activeTab} index={0}>
              {/* Sales Analytics */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    🏆 Sản phẩm bán chạy
                  </Typography>
                  {dashboardData.sales_analytics.top_performing_products.slice(0, 5).map((product, index) => (
                    <Box key={product.product_id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        {index + 1}. {product.product_name}
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        {formatCurrency(product.revenue)}
                      </Typography>
                    </Box>
                  ))}
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    💳 Phương thức thanh toán
                  </Typography>
                  {dashboardData.sales_analytics.payment_methods.map((method) => (
                    <Box key={method.method} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        {method.method}
                      </Typography>
                      <Typography variant="body2">
                        {formatPercentage(method.percentage)}
                      </Typography>
                    </Box>
                  ))}
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              {/* Customer Analytics */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    👥 Phân khúc khách hàng
                  </Typography>
                  {dashboardData.customer_analytics.customer_segments.map((segment) => (
                    <Box key={segment.segment} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        {segment.segment}
                      </Typography>
                      <Typography variant="body2">
                        {segment.count} ({formatPercentage(segment.percentage)})
                      </Typography>
                    </Box>
                  ))}
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    📈 Chỉ số khách hàng
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Khách hàng mới
                    </Typography>
                    <Typography variant="h6">
                      {dashboardData.customer_analytics.new_customers}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Tỷ lệ giữ chân
                    </Typography>
                    <Typography variant="h6">
                      {formatPercentage(dashboardData.customer_analytics.customer_retention_rate)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              {/* Inventory Analytics */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    🚀 Sản phẩm bán nhanh
                  </Typography>
                  {dashboardData.inventory_analytics.fast_moving_items.slice(0, 5).map((item, index) => (
                    <Box key={item.product_id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        {index + 1}. {item.product_name}
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        Vận tốc: {item.velocity.toFixed(1)}
                      </Typography>
                    </Box>
                  ))}
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    🐌 Sản phẩm bán chậm
                  </Typography>
                  {dashboardData.inventory_analytics.slow_moving_items.slice(0, 5).map((item, index) => (
                    <Box key={item.product_id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        {index + 1}. {item.product_name}
                      </Typography>
                      <Typography variant="body2" color="warning.main">
                        {item.days_since_last_sale} ngày
                      </Typography>
                    </Box>
                  ))}
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
              {/* Financial Analytics */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    💰 Chỉ số tài chính
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Lợi nhuận gộp
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(dashboardData.financial_metrics.gross_profit)}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Lợi nhuận ròng
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(dashboardData.financial_metrics.net_profit)}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    📊 Dòng tiền
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Dòng tiền vào
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(dashboardData.financial_metrics.cash_flow.inflow)}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Dòng tiền ra
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      {formatCurrency(dashboardData.financial_metrics.cash_flow.outflow)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </TabPanel>
          </Card>
        </>
      )}
    </Box>
  );
};

export default EnhancedAnalyticsDashboard;
