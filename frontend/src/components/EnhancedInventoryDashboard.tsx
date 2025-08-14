/**
 * Enhanced Inventory Dashboard Component
 * Uses advanced inventory APIs and real-time updates
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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';

import { advancedInventoryApi, InventoryOverview } from '../services/advancedInventoryApi';
import { enhancedRealtimeService } from '../services/enhancedRealtimeService';
import { errorHandlingService } from '../services/errorHandlingService';

interface EnhancedInventoryDashboardProps {
  refreshInterval?: number;
}

const EnhancedInventoryDashboard: React.FC<EnhancedInventoryDashboardProps> = ({
  refreshInterval = 30000 // 30 seconds default
}) => {
  const [overview, setOverview] = useState<InventoryOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  /**
   * Load inventory overview data
   */
  const loadInventoryOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await advancedInventoryApi.getInventoryOverview();
      setOverview(data);
      setLastUpdated(new Date());
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load inventory data';
      setError(errorMessage);
      
      // Handle error through error service
      if (err.isAxiosError) {
        errorHandlingService.handleApiError(err, {
          endpoint: '/inventory-advanced/overview',
          method: 'GET'
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Handle real-time inventory updates
   */
  const handleRealtimeUpdate = useCallback((data: any) => {
    console.log('📦 Received real-time inventory update:', data);
    
    // Refresh overview data when inventory changes
    loadInventoryOverview();
  }, [loadInventoryOverview]);

  /**
   * Setup real-time connections and intervals
   */
  useEffect(() => {
    // Initial load
    loadInventoryOverview();

    // Setup real-time subscriptions
    const inventorySubscription = enhancedRealtimeService.subscribe(
      'inventory:updated',
      handleRealtimeUpdate
    );

    const stockSubscription = enhancedRealtimeService.subscribe(
      'stock_updated',
      handleRealtimeUpdate
    );

    // Monitor connection status
    const connectionStatusHandler = (status: any) => {
      setRealtimeConnected(status.connected);
    };

    enhancedRealtimeService.on('connected', () => setRealtimeConnected(true));
    enhancedRealtimeService.on('disconnected', () => setRealtimeConnected(false));

    // Setup refresh interval
    const interval = setInterval(loadInventoryOverview, refreshInterval);

    // Connect to real-time service
    enhancedRealtimeService.connect();

    return () => {
      // Cleanup
      enhancedRealtimeService.unsubscribe(inventorySubscription);
      enhancedRealtimeService.unsubscribe(stockSubscription);
      clearInterval(interval);
    };
  }, [loadInventoryOverview, handleRealtimeUpdate, refreshInterval]);

  /**
   * Get status color for stock levels
   */
  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'success';
      case 'low_stock': return 'warning';
      case 'out_of_stock': return 'error';
      case 'overstock': return 'info';
      default: return 'default';
    }
  };

  /**
   * Get alert severity
   */
  const getAlertSeverity = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'info';
    }
  };

  if (loading && !overview) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
          Đang tải dữ liệu kho hàng...
        </Typography>
      </Box>
    );
  }

  if (error && !overview) {
    return (
      <Alert 
        severity="error" 
        action={
          <IconButton color="inherit" size="small" onClick={loadInventoryOverview}>
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
          📦 Quản lý kho hàng nâng cao
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
          <IconButton onClick={loadInventoryOverview} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {overview && (
        <>
          {/* Statistics Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <InventoryIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Tổng sản phẩm
                      </Typography>
                      <Typography variant="h5">
                        {overview.stats.total_items.toLocaleString()}
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
                    <TrendingUpIcon sx={{ mr: 2, color: 'success.main' }} />
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Giá trị kho
                      </Typography>
                      <Typography variant="h5">
                        {overview.stats.total_value.toLocaleString()} ₫
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
                    <WarningIcon sx={{ mr: 2, color: 'warning.main' }} />
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Sắp hết hàng
                      </Typography>
                      <Typography variant="h5">
                        {overview.stats.low_stock_items}
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
                    <TrendingDownIcon sx={{ mr: 2, color: 'error.main' }} />
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Hết hàng
                      </Typography>
                      <Typography variant="h5">
                        {overview.stats.out_of_stock_items}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Alerts Section */}
          {overview.alerts.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🚨 Cảnh báo kho hàng
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {overview.alerts.slice(0, 5).map((alert) => (
                    <Alert 
                      key={alert.id} 
                      severity={getAlertSeverity(alert.severity)}
                      sx={{ '& .MuiAlert-message': { width: '100%' } }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle2">
                            {alert.product_name}
                          </Typography>
                          <Typography variant="body2">
                            {alert.message}
                          </Typography>
                        </Box>
                        <Chip 
                          label={alert.alert_type} 
                          size="small" 
                          color={getStockStatusColor(alert.alert_type) as any}
                        />
                      </Box>
                    </Alert>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Inventory Items Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📋 Danh sách sản phẩm
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Sản phẩm</TableCell>
                      <TableCell>SKU</TableCell>
                      <TableCell align="right">Tồn kho</TableCell>
                      <TableCell align="right">Có thể bán</TableCell>
                      <TableCell align="right">Giá trị</TableCell>
                      <TableCell>Trạng thái</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {overview.items.slice(0, 10).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Typography variant="subtitle2">
                            {item.product_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.category_name}
                          </Typography>
                        </TableCell>
                        <TableCell>{item.product_sku}</TableCell>
                        <TableCell align="right">{item.current_stock}</TableCell>
                        <TableCell align="right">{item.available_stock}</TableCell>
                        <TableCell align="right">
                          {item.total_value.toLocaleString()} ₫
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={item.stock_status} 
                            size="small" 
                            color={getStockStatusColor(item.stock_status) as any}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default EnhancedInventoryDashboard;
