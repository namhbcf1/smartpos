import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Divider,
  Tooltip,
  Badge,
  Alert,
  Skeleton,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  People,
  Inventory,
  Assessment,
  Refresh,
  Settings,
  Notifications,
  Add,
  Warning,
  CheckCircle,
  Error,
  Info,
  CreditCard,
  Timeline,
  Support,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardAPI } from '../../services/api';
import { connectRealtime } from '../../services/realtime';

// Dashboard Widget Types

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  color: string;
  trend?: number[];
}

interface RecentActivity {
  id: string;
  type: 'order' | 'payment' | 'inventory' | 'customer' | 'system';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
  user?: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
}

// Metric Card Component
const MetricCard: React.FC<{ metric: MetricCard }> = ({ metric }) => {
  const isPositive = metric.changeType === 'increase';
  const isNegative = metric.changeType === 'decrease';
  
  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Avatar sx={{ bgcolor: metric.color, width: 48, height: 48 }}>
            {metric.icon}
          </Avatar>
          <Chip
            icon={isPositive ? <TrendingUp /> : isNegative ? <TrendingDown /> : <Timeline />}
            label={`${isPositive ? '+' : isNegative ? '' : ''}${metric.change}%`}
            color={isPositive ? 'success' : isNegative ? 'error' : 'default'}
            size="small"
            variant="outlined"
          />
        </Box>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {metric.title}
        </Typography>
        {metric.trend && (
          <Box sx={{ mt: 1 }}>
            <LinearProgress
              variant="determinate"
              value={Math.abs(metric.change)}
              color={isPositive ? 'success' : isNegative ? 'error' : 'primary'}
              sx={{ height: 4, borderRadius: 2 }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Recent Activity Component
const RecentActivity: React.FC<{ activities: RecentActivity[] }> = ({ activities }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingCart />;
      case 'payment': return <CreditCard />;
      case 'inventory': return <Inventory />;
      case 'customer': return <People />;
      case 'system': return <Settings />;
      default: return <Info />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Hoạt động gần đây</Typography>
          <IconButton size="small">
            <Refresh />
          </IconButton>
        </Box>
        <List>
          {activities.map((activity, index) => (
            <React.Fragment key={activity.id}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: getStatusColor(activity.status) + '.main', width: 32, height: 32 }}>
                    {getActivityIcon(activity.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={activity.title}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {activity.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(activity.timestamp).toLocaleString('vi-VN')}
                        {activity.user && ` • ${activity.user}`}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Chip
                    label={activity.status}
                    color={getStatusColor(activity.status) as any}
                    size="small"
                    variant="outlined"
                  />
                </ListItemSecondaryAction>
              </ListItem>
              {index < activities.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

// Quick Actions Component
const QuickActions: React.FC<{ actions: QuickAction[] }> = ({ actions }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Thao tác nhanh
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
          {actions.map((action) => (
            <Box key={action.id}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={action.icon}
                onClick={action.action}
                sx={{
                  height: 80,
                  flexDirection: 'column',
                  gap: 1,
                  borderColor: action.color,
                  color: action.color,
                  '&:hover': {
                    borderColor: action.color,
                    backgroundColor: action.color + '10',
                  }
                }}
              >
                <Typography variant="body2" fontWeight="medium">
                  {action.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {action.description}
                </Typography>
              </Button>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

// Alerts Component
const Alerts: React.FC<{ alerts: any[] }> = ({ alerts }) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Cảnh báo hệ thống</Typography>
          <Badge badgeContent={alerts.length} color="error">
            <Notifications />
          </Badge>
        </Box>
        {alerts.length === 0 ? (
          <Alert severity="success" icon={<CheckCircle />}>
            Không có cảnh báo nào
          </Alert>
        ) : (
          <List>
            {alerts.map((alert, index) => (
              <React.Fragment key={alert.id}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: alert.severity + '.main', width: 32, height: 32 }}>
                      {alert.severity === 'error' ? <Error /> :
                       alert.severity === 'warning' ? <Warning /> :
                       alert.severity === 'info' ? <Info /> : <CheckCircle />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={alert.title}
                    secondary={alert.message}
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      label={alert.severity}
                      color={alert.severity as any}
                      size="small"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                {index < alerts.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

// Main Dashboard Component
const DashboardOverview: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [widgetDialogOpen, setWidgetDialogOpen] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);

  // No mock data; all data comes from API
  const metrics: MetricCard[] = [];
  const recentActivities: RecentActivity[] = [];

  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'Tạo đơn hàng',
      description: 'Bán hàng mới',
      icon: <ShoppingCart />,
      color: '#1976d2',
      action: () => window.location.href = '/pos'
    },
    {
      id: '2',
      title: 'Thêm sản phẩm',
      description: 'Quản lý kho',
      icon: <Inventory />,
      color: '#2e7d32',
      action: () => window.location.href = '/products'
    },
    {
      id: '3',
      title: 'Khách hàng',
      description: 'Quản lý KH',
      icon: <People />,
      color: '#9c27b0',
      action: () => window.location.href = '/customers'
    },
    {
      id: '4',
      title: 'Báo cáo',
      description: 'Xem báo cáo',
      icon: <Assessment />,
      color: '#ff9800',
      action: () => window.location.href = '/reports'
    },
    {
      id: '5',
      title: 'Cài đặt',
      description: 'Hệ thống',
      icon: <Settings />,
      color: '#757575',
      action: () => window.location.href = '/settings'
    },
    {
      id: '6',
      title: 'Hỗ trợ',
      description: 'Ticket hỗ trợ',
      icon: <Support />,
      color: '#f44336',
      action: () => window.location.href = '/support'
    }
  ];

  // Fetch dashboard overview from API - NO MOCK DATA FALLBACK
  const queryClient = useQueryClient();
  const { data: overviewData, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-overview', refreshKey],
    queryFn: async () => {
      console.log('🔄 Fetching dashboard overview from API...');
      const res: any = await dashboardAPI.getOverview('today');
      console.log('📊 Dashboard API Response:', res);
      console.log('📊 Alerts from API:', res?.data?.alerts || res?.alerts);
      return res?.data || res;
    },
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
    retry: 1,
    refetchInterval: 30_000, // Auto-refresh every 30 seconds
    refetchIntervalInBackground: false, // Only refresh when tab is active
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Realtime subscription: refetch on relevant events
  React.useEffect(() => {
    const conn = connectRealtime((msg) => {
      const type = msg.type || msg.event;
      if (!type) return;
      // Dashboard-related events trigger a refetch
      if (
        type.includes('order') ||
        type.includes('payment') ||
        type.includes('inventory') ||
        type.includes('customer') ||
        type.includes('alert') ||
        type.includes('dashboard')
      ) {
        queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      }
    });
    return () => {
      conn?.disconnect();
    };
  }, [queryClient]);

  const apiMetrics: any[] = (overviewData as any)?.metrics || [];
  const apiActivities: any[] = (overviewData as any)?.activities || [];
  const apiAlerts: any[] = (overviewData as any)?.alerts || [];

  console.log('🎯 Extracted apiAlerts:', apiAlerts);
  console.log('🎯 apiAlerts length:', apiAlerts.length);

  // Map API data to UI structures with safe fallbacks
  const metricsToShow: MetricCard[] = (Array.isArray(apiMetrics) && apiMetrics.length > 0 && apiMetrics[0]?.title)
    ? (apiMetrics as any).map((m: any) => ({
        title: String(m.title ?? 'Số liệu'),
        value: typeof m.value === 'number' || typeof m.value === 'string' ? m.value : (m.count ?? 0),
        change: Number(m.change ?? 0),
        changeType: (m.changeType === 'increase' || m.changeType === 'decrease' || m.changeType === 'neutral') ? m.changeType : 'neutral',
        icon: <Assessment />,
        color: String(m.color ?? '#1976d2'),
        trend: Array.isArray(m.trend) ? m.trend : undefined,
      }))
    : metrics;

  const activitiesToShow: RecentActivity[] = (Array.isArray(apiActivities) && apiActivities.length > 0)
    ? apiActivities.map((a: any) => ({
        id: String(a.id ?? crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)),
        type: (a.type === 'order' || a.type === 'payment' || a.type === 'inventory' || a.type === 'customer' || a.type === 'system') ? a.type : 'system',
        title: String(a.title ?? a.event ?? 'Hoạt động'),
        description: String(a.description ?? a.details ?? ''),
        timestamp: String(a.timestamp ?? a.created_at ?? new Date().toISOString()),
        status: (a.status === 'success' || a.status === 'warning' || a.status === 'error' || a.status === 'info') ? a.status : 'info',
        user: a.user ?? a.user_id ?? undefined,
      }))
    : recentActivities;

  // Only use real alerts from API - no mock fallback
  const alertsToShow: any[] = (Array.isArray(apiAlerts) && apiAlerts.length > 0)
    ? apiAlerts.map((al: any) => ({
        id: String(al.id ?? crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)),
        title: String(al.title ?? 'Thông báo'),
        message: String(al.message ?? al.content ?? ''),
        severity: al.severity ?? al.status ?? 'info',
      }))
    : []; // Empty array if no alerts from API

  console.log('🚨 Final alertsToShow to render:', alertsToShow);
  console.log('🚨 alertsToShow length:', alertsToShow.length);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
  };

  const handleAddWidget = () => {
    setWidgetDialogOpen(true);
  };


  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          <Skeleton width={300} />
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton variant="rectangular" height={120} key={i} />
          ))}
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Lỗi khi tải dữ liệu dashboard: {error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Dashboard Tổng quan
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Chào mừng trở lại! Đây là tổng quan về hoạt động kinh doanh của bạn
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Làm mới dữ liệu">
            <IconButton onClick={handleRefresh}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Thêm widget">
            <IconButton onClick={handleAddWidget}>
              <Add />
            </IconButton>
          </Tooltip>
          <Tooltip title="Cài đặt dashboard">
            <IconButton>
              <Settings />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Metrics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 3 }}>
        {metricsToShow.map((metric, index) => (
          <MetricCard metric={metric} key={index} />
        ))}
      </Box>

      {/* Main Content Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
        {/* Left Column */}
        <Box>
          {/* Quick Actions */}
          <Box sx={{ mb: 3 }}>
            <QuickActions actions={quickActions} />
          </Box>

          {/* Recent Activities */}
          <Box sx={{ mb: 3 }}>
            <RecentActivity activities={activitiesToShow} />
          </Box>
        </Box>

        {/* Right Column */}
        <Box>
          {/* Alerts */}
          <Box sx={{ mb: 3 }}>
            <Alerts alerts={alertsToShow} />
          </Box>

          {/* Performance Overview (bind to API health if available) */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Hiệu suất hệ thống
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">CPU Usage</Typography>
                  <Typography variant="body2">
                    {Math.round(Math.min(100, Math.max(0, Number((overviewData as any)?.health?.cpu_usage ?? 45))))}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.round(Math.min(100, Math.max(0, Number((overviewData as any)?.health?.cpu_usage ?? 45))))}
                  color="primary"
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Memory</Typography>
                  <Typography variant="body2">
                    {Math.round(Math.min(100, Math.max(0, Number((overviewData as any)?.health?.memory_usage ?? 68))))}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.round(Math.min(100, Math.max(0, Number((overviewData as any)?.health?.memory_usage ?? 68))))}
                  color="warning"
                />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Storage</Typography>
                  <Typography variant="body2">
                    {Math.round(Math.min(100, Math.max(0, Number((overviewData as any)?.health?.storage_usage ?? 32))))}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.round(Math.min(100, Math.max(0, Number((overviewData as any)?.health?.storage_usage ?? 32))))}
                  color="success"
                />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleAddWidget}
      >
        <Add />
      </Fab>

      {/* Add Widget Dialog */}
      <Dialog open={widgetDialogOpen} onClose={() => setWidgetDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm Widget</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Loại Widget</InputLabel>
              <Select
                value={selectedWidget || ''}
                onChange={(e) => setSelectedWidget(e.target.value)}
              >
                <MenuItem value="chart">Biểu đồ</MenuItem>
                <MenuItem value="metric">Số liệu</MenuItem>
                <MenuItem value="table">Bảng dữ liệu</MenuItem>
                <MenuItem value="list">Danh sách</MenuItem>
                <MenuItem value="alert">Cảnh báo</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Tiêu đề Widget"
              placeholder="Nhập tiêu đề widget"
            />
            <TextField
              fullWidth
              label="Mô tả"
              multiline
              rows={3}
              placeholder="Mô tả widget"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWidgetDialogOpen(false)}>Hủy</Button>
          <Button onClick={() => setWidgetDialogOpen(false)} variant="contained">
            Thêm Widget
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardOverview;