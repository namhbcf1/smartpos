import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  Badge
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  ShoppingCart as CartIcon,
  LocalShipping as ShippingIcon,
  AttachMoney as MoneyIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { comprehensiveAPI } from '../services/business/comprehensiveApi';

interface InventoryMetrics {
  total_products: number;
  total_value: number;
  low_stock_items: number;
  out_of_stock_items: number;
  pending_orders: number;
  completed_orders_today: number;
  inventory_turnover: number;
  avg_stock_days: number;
}

interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  current_stock: number;
  min_stock: number;
  category: string;
  status: 'low' | 'critical' | 'out';
  last_updated: string;
  price: number;
}

interface RecentActivity {
  id: number;
  type: 'stock_in' | 'stock_out' | 'adjustment' | 'transfer';
  product_name: string;
  quantity: number;
  timestamp: string;
  user_name: string;
  notes?: string;
}

interface InventoryDashboardProps {
  showDetailedView?: boolean;
  compact?: boolean;
}

const InventoryDashboard: React.FC<InventoryDashboardProps> = ({
  showDetailedView = true,
  compact = false
}) => {
  const [metrics, setMetrics] = useState<InventoryMetrics>({
    total_products: 0,
    total_value: 0,
    low_stock_items: 0,
    out_of_stock_items: 0,
    pending_orders: 0,
    completed_orders_today: 0,
    inventory_turnover: 0,
    avg_stock_days: 0
  });
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [metricsResponse, lowStockResponse, activityResponse] = await Promise.all([
        comprehensiveAPI.get('/inventory/metrics'),
        comprehensiveAPI.get('/inventory/low-stock'),
        comprehensiveAPI.get('/inventory/recent-activity')
      ]);

      setMetrics(metricsResponse.data || metrics);
      setLowStockProducts(lowStockResponse.data || []);
      setRecentActivity(activityResponse.data || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // NO MOCK DATA - Clear state on API failure
      setMetrics({
        total_products: 0,
        total_value: 0,
        low_stock_items: 0,
        out_of_stock_items: 0,
        pending_orders: 0,
        completed_orders_today: 0,
        inventory_turnover: 0,
        avg_stock_days: 0
      });
      setLowStockProducts([]);
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'error';
      case 'low':
        return 'warning';
      case 'out':
        return 'error';
      default:
        return 'default';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'stock_in':
        return <TrendingUpIcon color="success" />;
      case 'stock_out':
        return <TrendingDownIcon color="error" />;
      case 'adjustment':
        return <SpeedIcon color="warning" />;
      case 'transfer':
        return <ShippingIcon color="info" />;
      default:
        return <InventoryIcon />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (compact) {
    return (
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <InventoryIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{metrics.total_products}</Typography>
              <Typography variant="body2" color="text.secondary">
                Total Products
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MoneyIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{formatCurrency(metrics.total_value)}</Typography>
              <Typography variant="body2" color="text.secondary">
                Total Value
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <WarningIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{metrics.low_stock_items}</Typography>
              <Typography variant="body2" color="text.secondary">
                Low Stock Items
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CartIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{metrics.pending_orders}</Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Orders
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
          <InventoryIcon sx={{ mr: 1 }} />
          Inventory Dashboard
        </Typography>
        <Tooltip title="Refresh Data">
          <IconButton onClick={loadDashboardData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <InventoryIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="primary">
                {metrics.total_products.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Products
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MoneyIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="success.main">
                {formatCurrency(metrics.total_value)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Inventory Value
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Badge badgeContent={metrics.out_of_stock_items} color="error">
                <WarningIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
              </Badge>
              <Typography variant="h4" color="warning.main">
                {metrics.low_stock_items}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Low Stock Alerts
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <SpeedIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="info.main">
                {metrics.inventory_turnover.toFixed(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Inventory Turnover
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Orders Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Today's Activity
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="body1">
                  {metrics.completed_orders_today} orders completed
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TimelineIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="body1">
                  {metrics.pending_orders} orders pending
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Stock Performance
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Average Stock Days
                </Typography>
                <Typography variant="h5">
                  {metrics.avg_stock_days} days
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min((60 - metrics.avg_stock_days) / 60 * 100, 100)}
                color={metrics.avg_stock_days <= 30 ? 'success' : metrics.avg_stock_days <= 45 ? 'warning' : 'error'}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {showDetailedView && (
        <Grid container spacing={3}>
          {/* Low Stock Alerts */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <WarningIcon sx={{ mr: 1, color: 'warning.main' }} />
                  Low Stock Alerts
                  <Badge badgeContent={lowStockProducts.length} color="error" sx={{ ml: 1 }}>
                    <span />
                  </Badge>
                </Typography>
                {lowStockProducts.length === 0 ? (
                  <Alert severity="success">
                    All products are adequately stocked!
                  </Alert>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell align="right">Stock</TableCell>
                          <TableCell align="center">Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {lowStockProducts.slice(0, 5).map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {product.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  SKU: {product.sku}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">
                                {product.current_stock} / {product.min_stock}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={product.status.toUpperCase()}
                                color={getStatusColor(product.status)}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Activity
                </Typography>
                {recentActivity.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No recent activity
                  </Typography>
                ) : (
                  <List dense>
                    {recentActivity.slice(0, 5).map((activity, index) => (
                      <React.Fragment key={activity.id}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'background.paper' }}>
                              {getActivityIcon(activity.type)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="body2">
                                <strong>{activity.product_name}</strong>{' '}
                                {activity.type === 'stock_in' ? 'received' : 
                                 activity.type === 'stock_out' ? 'sold' : 
                                 activity.type === 'adjustment' ? 'adjusted' : 'transferred'}{' '}
                                ({activity.quantity} units)
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  by {activity.user_name} • {' '}
                                  {new Date(activity.timestamp).toLocaleString()}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < recentActivity.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {loading && (
        <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 9999 }}>
          <LinearProgress />
        </Box>
      )}
    </Box>
  );
};

export default InventoryDashboard;
