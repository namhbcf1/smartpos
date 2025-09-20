import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Stack,
  LinearProgress,
  Chip,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Alert,
  Collapse
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShoppingCart as SalesIcon,
  Inventory as InventoryIcon,
  People as CustomersIcon,
  AttachMoney as RevenueIcon,
  Notifications as NotificationIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Timeline as ActivityIcon,
  Speed as PerformanceIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useDashboardRealtime } from '../../hooks/useRealtime';
import { formatCurrency, formatDateTime } from '../../utils/format';
import LiveNotifications from '../realtime/LiveNotifications';
import RealtimeStatus from '../realtime/RealtimeStatus';

interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  totalCustomers: number;
  lowStockItems: number;
  revenue: number;
  growth: {
    sales: number;
    orders: number;
    customers: number;
    revenue: number;
  };
}

interface RealtimeActivity {
  id: string;
  type: 'sale' | 'customer' | 'inventory' | 'system';
  message: string;
  timestamp: Date;
  data?: any;
}

const RealtimeDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    todayOrders: 0,
    totalCustomers: 0,
    lowStockItems: 0,
    revenue: 0,
    growth: {
      sales: 0,
      orders: 0,
      customers: 0,
      revenue: 0
    }
  });
  const [activities, setActivities] = useState<RealtimeActivity[]>([]);
  const [showActivities, setShowActivities] = useState(false);

  const { connection, sales, inventory, customers, system } = useDashboardRealtime();

  // Update stats from real-time data
  useEffect(() => {
    setStats(prev => ({
      ...prev,
      todaySales: sales.salesStats.todayTotal,
      todayOrders: sales.salesStats.todayCount,
      lowStockItems: inventory.lowStockCount,
      totalCustomers: prev.totalCustomers + customers.customerStats.newCustomersToday
    }));
  }, [sales.salesStats, inventory.lowStockCount, customers.customerStats]);

  // Track activities from events
  useEffect(() => {
    if (sales.lastSalesEvent) {
      const event = sales.lastSalesEvent;
      addActivity({
        type: 'sale',
        message: `Đơn hàng mới: ${event.data?.sale_number} - ${formatCurrency(event.data?.total_amount || 0)}`,
        data: event.data
      });
    }
  }, [sales.lastSalesEvent]);

  useEffect(() => {
    if (inventory.lastInventoryEvent) {
      const event = inventory.lastInventoryEvent;
      let message = `Cập nhật tồn kho: ${event.data?.product_name}`;
      
      if (event.type === 'stock_low') {
        message = `⚠️ Cảnh báo tồn kho thấp: ${event.data?.product_name}`;
      } else if (event.type === 'stock_out') {
        message = `🔴 Hết hàng: ${event.data?.product_name}`;
      }

      addActivity({
        type: 'inventory',
        message,
        data: event.data
      });
    }
  }, [inventory.lastInventoryEvent]);

  useEffect(() => {
    if (customers.lastCustomerEvent) {
      const event = customers.lastCustomerEvent;
      addActivity({
        type: 'customer',
        message: event.type === 'customer_created' 
          ? `👤 Khách hàng mới: ${event.data?.name}`
          : `📝 Cập nhật khách hàng: ${event.data?.name}`,
        data: event.data
      });
    }
  }, [customers.lastCustomerEvent]);

  useEffect(() => {
    if (system.lastSystemEvent) {
      const event = system.lastSystemEvent;
      if (event.type === 'system_alert') {
        addActivity({
          type: 'system',
          message: `🔧 ${event.data?.message || 'Thông báo hệ thống'}`,
          data: event.data
        });
      }
    }
  }, [system.lastSystemEvent]);

  const addActivity = (activity: Omit<RealtimeActivity, 'id' | 'timestamp'>) => {
    const newActivity: RealtimeActivity = {
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    setActivities(prev => [newActivity, ...prev.slice(0, 19)]); // Keep last 20 activities
  };

  const getStatIcon = (type: string) => {
    switch (type) {
      case 'sales': return <SalesIcon sx={{ color: '#4CAF50' }} />;
      case 'orders': return <SalesIcon sx={{ color: '#2196F3' }} />;
      case 'customers': return <CustomersIcon sx={{ color: '#FF9800' }} />;
      case 'revenue': return <RevenueIcon sx={{ color: '#9C27B0' }} />;
      case 'inventory': return <InventoryIcon sx={{ color: '#f44336' }} />;
      default: return <InfoIcon />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sale': return <SalesIcon color="success" />;
      case 'customer': return <CustomersIcon color="primary" />;
      case 'inventory': return <InventoryIcon color="warning" />;
      case 'system': return <ErrorIcon color="error" />;
      default: return <InfoIcon color="info" />;
    }
  };

  const getTrendIcon = (growth: number) => {
    return growth >= 0 ? 
      <TrendingUpIcon sx={{ color: '#4CAF50' }} /> : 
      <TrendingDownIcon sx={{ color: '#f44336' }} />;
  };

  const getTrendColor = (growth: number) => {
    return growth >= 0 ? 'success' : 'error';
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Connection Status */}
        <Grid item xs={12}>
          <RealtimeStatus />
        </Grid>

        {/* Real-time Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card sx={{ position: 'relative', overflow: 'visible' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Doanh thu hôm nay
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                      {formatCurrency(stats.todaySales)}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                      {getTrendIcon(stats.growth.sales)}
                      <Typography 
                        variant="body2" 
                        color={getTrendColor(stats.growth.sales) + '.main'}
                        sx={{ fontWeight: 500 }}
                      >
                        {Math.abs(stats.growth.sales).toFixed(1)}%
                      </Typography>
                    </Stack>
                  </Box>
                  <Avatar sx={{ bgcolor: 'success.light', width: 56, height: 56 }}>
                    {getStatIcon('sales')}
                  </Avatar>
                </Stack>
                <LinearProgress 
                  variant="determinate" 
                  value={75} 
                  sx={{ mt: 2, borderRadius: 2 }} 
                  color="success"
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Đơn hàng hôm nay
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2196F3' }}>
                      {stats.todayOrders}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                      {getTrendIcon(stats.growth.orders)}
                      <Typography 
                        variant="body2" 
                        color={getTrendColor(stats.growth.orders) + '.main'}
                        sx={{ fontWeight: 500 }}
                      >
                        {Math.abs(stats.growth.orders).toFixed(1)}%
                      </Typography>
                    </Stack>
                  </Box>
                  <Avatar sx={{ bgcolor: 'primary.light', width: 56, height: 56 }}>
                    {getStatIcon('orders')}
                  </Avatar>
                </Stack>
                <LinearProgress 
                  variant="determinate" 
                  value={60} 
                  sx={{ mt: 2, borderRadius: 2 }} 
                  color="primary"
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Tổng khách hàng
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
                      {stats.totalCustomers}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                      <Chip 
                        label={`+${customers.customerStats.newCustomersToday} hôm nay`}
                        size="small"
                        color="warning"
                      />
                    </Stack>
                  </Box>
                  <Avatar sx={{ bgcolor: 'warning.light', width: 56, height: 56 }}>
                    {getStatIcon('customers')}
                  </Avatar>
                </Stack>
                <LinearProgress 
                  variant="determinate" 
                  value={85} 
                  sx={{ mt: 2, borderRadius: 2 }} 
                  color="warning"
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Cảnh báo tồn kho
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f44336' }}>
                      {stats.lowStockItems}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                      <Chip 
                        label={stats.lowStockItems > 0 ? "Cần nhập hàng" : "Tốt"}
                        size="small"
                        color={stats.lowStockItems > 0 ? "error" : "success"}
                      />
                    </Stack>
                  </Box>
                  <Avatar sx={{ bgcolor: 'error.light', width: 56, height: 56 }}>
                    {getStatIcon('inventory')}
                  </Avatar>
                </Stack>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.lowStockItems > 0 ? 30 : 100} 
                  sx={{ mt: 2, borderRadius: 2 }} 
                  color={stats.lowStockItems > 0 ? "error" : "success"}
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Live Notifications */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <LiveNotifications maxItems={8} />
          </motion.div>
        </Grid>

        {/* Real-time Activities */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <ActivityIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        Hoạt động thời gian thực
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {activities.length} hoạt động gần đây
                      </Typography>
                    </Box>
                  </Stack>
                  
                  <Stack direction="row" spacing={1}>
                    <IconButton size="small" onClick={() => setActivities([])}>
                      <RefreshIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => setShowActivities(!showActivities)}
                    >
                      {showActivities ? <CollapseIcon /> : <ExpandIcon />}
                    </IconButton>
                  </Stack>
                </Stack>

                <Collapse in={showActivities}>
                  {activities.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Chưa có hoạt động nào được ghi nhận
                    </Alert>
                  ) : (
                    <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                      {activities.slice(0, 10).map((activity, index) => (
                        <React.Fragment key={activity.id}>
                          <ListItem sx={{ px: 0 }}>
                            <ListItemIcon>
                              {getActivityIcon(activity.type)}
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {activity.message}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary">
                                  {formatDateTime(activity.timestamp, 'HH:mm:ss')}
                                </Typography>
                              }
                            />
                          </ListItem>
                          {index < activities.length - 1 && index < 9 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </Collapse>

                {!showActivities && activities.length > 0 && (
                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Button 
                      size="small" 
                      onClick={() => setShowActivities(true)}
                      startIcon={<ActivityIcon />}
                    >
                      Xem {activities.length} hoạt động
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* System Performance */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>
                    <PerformanceIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      Hiệu suất hệ thống
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Trạng thái kết nối và hiệu suất
                    </Typography>
                  </Box>
                </Stack>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Kết nối
                      </Typography>
                      <Chip
                        label={connection.isConnected ? 'Đã kết nối' : 'Mất kết nối'}
                        color={connection.isConnected ? 'success' : 'error'}
                        size="small"
                      />
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Tin nhắn gửi
                      </Typography>
                      <Typography variant="h6">
                        {sales.salesEvents.length + inventory.inventoryEvents.length}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Cảnh báo
                      </Typography>
                      <Typography variant="h6" color="warning.main">
                        {system.systemAlerts.length}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Hoạt động
                      </Typography>
                      <Typography variant="h6" color="info.main">
                        {activities.length}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RealtimeDashboard;
