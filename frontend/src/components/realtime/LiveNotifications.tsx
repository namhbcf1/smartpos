import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Badge,
  Chip,
  Collapse,
  Divider,
  Button,
  Stack,
  Alert
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Clear as ClearIcon,
  ShoppingCart as SalesIcon,
  Inventory as InventoryIcon,
  People as CustomersIcon,
  Settings as SystemIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useSystemEvents, useInventoryEvents, useSalesEvents, useCustomerEvents } from '../../hooks/useRealtime';
import { formatCurrency, formatDateTime } from '../../utils/format';

interface LiveNotificationsProps {
  maxItems?: number;
  autoHide?: boolean;
  hideAfter?: number; // seconds
}

export const LiveNotifications: React.FC<LiveNotificationsProps> = ({
  maxItems = 10,
  autoHide = false,
  hideAfter = 5
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Subscribe to all event types
  const { systemAlerts, clearAlerts: clearSystemAlerts } = useSystemEvents();
  const { inventoryAlerts, clearAlerts: clearInventoryAlerts } = useInventoryEvents();
  const { salesEvents } = useSalesEvents();
  const { customerEvents } = useCustomerEvents();

  // Combine all notifications
  useEffect(() => {
    const allNotifications = [
      ...systemAlerts.map(alert => ({
        ...alert,
        type: 'system',
        icon: getSystemIcon(alert.level),
        color: getSystemColor(alert.level)
      })),
      ...inventoryAlerts.map(alert => ({
        ...alert,
        type: 'inventory',
        icon: <WarningIcon />,
        color: 'warning',
        message: `Sản phẩm "${alert.product_name}" sắp hết hàng (${alert.current_stock}/${alert.min_stock_level})`
      })),
      ...salesEvents.slice(-5).map(event => ({
        id: `sale-${event.timestamp}`,
        type: 'sales',
        icon: <SalesIcon />,
        color: 'success',
        message: `Đơn hàng mới: ${event.data.sale_number} - ${formatCurrency(event.data.total_amount)}`,
        timestamp: event.timestamp
      })),
      ...customerEvents.slice(-3).map(event => ({
        id: `customer-${event.timestamp}`,
        type: 'customers',
        icon: <CustomersIcon />,
        color: 'info',
        message: event.type === 'customer_created' 
          ? `Khách hàng mới: ${event.data.name}`
          : `Cập nhật khách hàng: ${event.data.name}`,
        timestamp: event.timestamp
      }))
    ];

    // Sort by timestamp (newest first) and limit
    const sortedNotifications = allNotifications
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, maxItems);

    setNotifications(sortedNotifications);
  }, [systemAlerts, inventoryAlerts, salesEvents, customerEvents, maxItems]);

  // Auto-hide notifications
  useEffect(() => {
    if (autoHide && notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications([]);
      }, hideAfter * 1000);

      return () => clearTimeout(timer);
    }
  }, [notifications, autoHide, hideAfter]);

  const getSystemIcon = (level: string) => {
    switch (level) {
      case 'success': return <SuccessIcon />;
      case 'warning': return <WarningIcon />;
      case 'error': return <ErrorIcon />;
      default: return <InfoIcon />;
    }
  };

  const getSystemColor = (level: string): any => {
    switch (level) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'info';
    }
  };

  const handleClearAll = () => {
    setNotifications([]);
    clearSystemAlerts();
    clearInventoryAlerts();
  };

  const handleRemoveNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.length;

  return (
    <Card sx={{ minWidth: 300, maxWidth: 400 }}>
      <CardContent sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <Badge badgeContent={unreadCount} color="error" max={99}>
              <NotificationsIcon />
            </Badge>
            <Typography variant="h6">
              Thông báo trực tiếp
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1}>
            {notifications.length > 0 && (
              <IconButton size="small" onClick={handleClearAll}>
                <ClearIcon />
              </IconButton>
            )}
            <IconButton
              size="small"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Stack>
        </Stack>

        <Collapse in={isExpanded}>
          <Box sx={{ mt: 2 }}>
            {notifications.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Không có thông báo mới
                </Typography>
              </Box>
            ) : (
              <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                {notifications.map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    <ListItem
                      sx={{
                        px: 0,
                        py: 1,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          borderRadius: 1
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Box sx={{ color: `${notification.color}.main` }}>
                          {notification.icon}
                        </Box>
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {notification.message}
                          </Typography>
                        }
                        secondary={
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                            <Chip
                              label={notification.type}
                              size="small"
                              color={notification.color}
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                            {notification.timestamp && (
                              <Typography variant="caption" color="text.secondary">
                                {formatDateTime(new Date(notification.timestamp), 'HH:mm:ss')}
                              </Typography>
                            )}
                          </Stack>
                        }
                      />

                      <IconButton
                        size="small"
                        onClick={() => handleRemoveNotification(notification.id)}
                        sx={{ ml: 1 }}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </ListItem>
                    
                    {index < notifications.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}

            {notifications.length > 0 && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  size="small"
                  onClick={handleClearAll}
                  startIcon={<ClearIcon />}
                >
                  Xóa tất cả
                </Button>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

// Compact notification badge for header
export const NotificationBadge: React.FC = () => {
  const { systemAlerts } = useSystemEvents();
  const { inventoryAlerts } = useInventoryEvents();
  const [showNotifications, setShowNotifications] = useState(false);

  const totalCount = systemAlerts.length + inventoryAlerts.length;

  return (
    <Box sx={{ position: 'relative' }}>
      <IconButton
        color="inherit"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <Badge badgeContent={totalCount} color="error" max={99}>
          <NotificationsIcon />
        </Badge>
      </IconButton>

      {showNotifications && (
        <Box
          sx={{
            position: 'absolute',
            top: '100%',
            right: 0,
            zIndex: 1300,
            mt: 1
          }}
        >
          <LiveNotifications maxItems={5} />
        </Box>
      )}
    </Box>
  );
};

export default LiveNotifications;
