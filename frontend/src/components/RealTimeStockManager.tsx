import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import realtimeService, { InventoryEvent, RealtimeEvent } from '../services/realtime';

interface StockAlert {
  id: string;
  productId: number;
  productName: string;
  currentStock: number;
  minStockLevel: number;
  severity: 'low' | 'out' | 'critical';
  timestamp: number;
}

interface StockUpdate {
  id: string;
  productId: number;
  productName: string;
  oldStock: number;
  newStock: number;
  changeType: 'in' | 'out' | 'adjustment';
  timestamp: number;
}

interface RealTimeStockManagerProps {
  productId?: number;
  showAlerts?: boolean;
  showUpdates?: boolean;
  maxItems?: number;
}

const RealTimeStockManager: React.FC<RealTimeStockManagerProps> = ({
  productId,
  showAlerts = true,
  showUpdates = true,
  maxItems = 10
}) => {
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [stockUpdates, setStockUpdates] = useState<StockUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Connect to real-time service
    realtimeService.connect();

    // Subscribe to inventory updates
    realtimeService.subscribeToInventory();

    // If specific product, subscribe to it
    if (productId) {
      realtimeService.subscribeToProduct(productId);
    }

    // Handle connection status
    const handleConnected = () => {
      setIsConnected(true);
      console.log('📡 Real-time stock manager connected');
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      console.log('📡 Real-time stock manager disconnected');
    };

    // Handle stock updates
    const handleStockUpdate = (event: InventoryEvent) => {
      console.log('📦 Stock update received:', event);
      setLastUpdate(new Date());

      // Filter by product if specified
      if (productId && event.data.product_id !== productId) {
        return;
      }

      // Add to stock updates
      const update: StockUpdate = {
        id: `update_${Date.now()}_${Math.random()}`,
        productId: event.data.product_id,
        productName: event.data.product_name,
        oldStock: event.data.current_stock - 1, // Simulated old stock
        newStock: event.data.current_stock,
        changeType: event.data.current_stock > (event.data.current_stock - 1) ? 'in' : 'out',
        timestamp: event.timestamp
      };

      setStockUpdates(prev => [update, ...prev.slice(0, maxItems - 1)]);
    };

    // Handle stock alerts
    const handleStockAlert = (event: InventoryEvent) => {
      console.log('⚠️ Stock alert received:', event);
      setLastUpdate(new Date());

      // Filter by product if specified
      if (productId && event.data.product_id !== productId) {
        return;
      }

      let severity: 'low' | 'out' | 'critical' = 'low';
      if (event.type === 'stock_out') {
        severity = 'out';
      } else if (event.data.current_stock <= event.data.min_stock_level / 2) {
        severity = 'critical';
      }

      const alert: StockAlert = {
        id: `alert_${Date.now()}_${Math.random()}`,
        productId: event.data.product_id,
        productName: event.data.product_name,
        currentStock: event.data.current_stock,
        minStockLevel: event.data.min_stock_level,
        severity,
        timestamp: event.timestamp
      };

      setStockAlerts(prev => [alert, ...prev.slice(0, maxItems - 1)]);
    };

    // Subscribe to events
    realtimeService.subscribe('stock_updated', handleStockUpdate);
    realtimeService.subscribe('stock_low', handleStockAlert);
    realtimeService.subscribe('stock_out', handleStockAlert);
    realtimeService.on('connected', handleConnected);
    realtimeService.on('disconnected', handleDisconnected);

    // Cleanup
    return () => {
      realtimeService.unsubscribe('stock_updated', handleStockUpdate);
      realtimeService.unsubscribe('stock_low', handleStockAlert);
      realtimeService.unsubscribe('stock_out', handleStockAlert);
      realtimeService.off('connected', handleConnected);
      realtimeService.off('disconnected', handleDisconnected);
      
      if (productId) {
        realtimeService.unsubscribeFromProduct(productId);
      }
    };
  }, [productId, maxItems]);

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'out': return 'error';
      case 'low': return 'warning';
      default: return 'info';
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <WarningIcon color="error" />;
      case 'out': return <InventoryIcon color="error" />;
      case 'low': return <WarningIcon color="warning" />;
      default: return <NotificationsIcon />;
    }
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'in': return <TrendingUpIcon color="success" />;
      case 'out': return <TrendingDownIcon color="error" />;
      default: return <RefreshIcon />;
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN');
  };

  return (
    <Box>
      {/* Connection Status */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Chip
          icon={<InventoryIcon />}
          label={isConnected ? 'Kết nối real-time' : 'Mất kết nối'}
          color={isConnected ? 'success' : 'error'}
          variant="outlined"
          size="small"
        />
        {lastUpdate && (
          <Typography variant="caption" sx={{ ml: 2, color: 'text.secondary' }}>
            Cập nhật lần cuối: {lastUpdate.toLocaleTimeString('vi-VN')}
          </Typography>
        )}
      </Box>

      {/* Stock Alerts */}
      {showAlerts && stockAlerts.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Badge badgeContent={stockAlerts.length} color="error">
                <WarningIcon />
              </Badge>
              <Box component="span" sx={{ ml: 1 }}>Cảnh báo tồn kho</Box>
            </Typography>
            <List dense>
              {stockAlerts.map((alert, index) => (
                <React.Fragment key={alert.id}>
                  <ListItem>
                    <ListItemIcon>
                      {getAlertIcon(alert.severity)}
                    </ListItemIcon>
                    <ListItemText
                      primary={alert.productName}
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            Tồn kho: {alert.currentStock} / Tối thiểu: {alert.minStockLevel}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTime(alert.timestamp)}
                          </Typography>
                        </Box>
                      }
                    />
                    <Chip
                      label={alert.severity === 'out' ? 'Hết hàng' : alert.severity === 'critical' ? 'Nguy hiểm' : 'Thấp'}
                      color={getAlertColor(alert.severity) as any}
                      size="small"
                    />
                  </ListItem>
                  {index < stockAlerts.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Stock Updates */}
      {showUpdates && stockUpdates.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <InventoryIcon />
              <Box component="span" sx={{ ml: 1 }}>Cập nhật tồn kho</Box>
            </Typography>
            <List dense>
              {stockUpdates.map((update, index) => (
                <React.Fragment key={update.id}>
                  <ListItem>
                    <ListItemIcon>
                      {getChangeIcon(update.changeType)}
                    </ListItemIcon>
                    <ListItemText
                      primary={update.productName}
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            {update.oldStock} → {update.newStock}
                            {update.changeType === 'in' && ' (+' + (update.newStock - update.oldStock) + ')'}
                            {update.changeType === 'out' && ' (-' + (update.oldStock - update.newStock) + ')'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTime(update.timestamp)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < stockUpdates.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* No Data */}
      {stockAlerts.length === 0 && stockUpdates.length === 0 && (
        <Alert severity="info">
          Chưa có cập nhật tồn kho real-time nào. Hệ thống đang theo dõi...
        </Alert>
      )}
    </Box>
  );
};

export default RealTimeStockManager;
