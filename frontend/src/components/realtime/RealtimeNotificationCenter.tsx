import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Button,
  Stack,
  Divider,
  Avatar,
  Tooltip,
  Switch,
  FormControlLabel,
  Alert,
  Collapse,
  Paper,
  Tabs,
  Tab,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as ActiveNotificationsIcon,
  Clear as ClearIcon,
  Settings as SettingsIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  ShoppingCart as SalesIcon,
  Inventory as InventoryIcon,
  People as CustomersIcon,
  Security as SystemIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as TimeIcon,
  Refresh as RefreshIcon,
  VolumeOff as MuteIcon,
  VolumeUp as UnmuteIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon
} from '@mui/icons-material';
import { useDashboardRealtime } from '../../hooks/useRealtime';
import { formatDateTime, formatCurrency } from '../../utils/format';
import WebSocketManager from './WebSocketManager';
import { useSnackbar } from 'notistack';

interface NotificationItem {
  id: string;
  type: string;
  category: 'sales' | 'inventory' | 'customers' | 'system';
  title: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  data?: any;
  actions?: Array<{
    label: string;
    action: () => void;
    color?: 'primary' | 'secondary' | 'error' | 'warning';
  }>;
}

interface NotificationSettings {
  enabled: boolean;
  categories: {
    sales: boolean;
    inventory: boolean;
    customers: boolean;
    system: boolean;
  };
  sounds: boolean;
  autoMarkRead: boolean;
  maxItems: number;
}

const RealtimeNotificationCenter: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    categories: {
      sales: true,
      inventory: true,
      customers: true,
      system: true
    },
    sounds: true,
    autoMarkRead: false,
    maxItems: 50
  });
  const [showSettings, setShowSettings] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showWebSocketManager, setShowWebSocketManager] = useState(false);

  const { enqueueSnackbar } = useSnackbar();
  const { connection, sales, inventory, customers, system } = useDashboardRealtime();

  // Handle real-time events and convert to notifications
  useEffect(() => {
    // Sales events
    if (sales.lastSalesEvent) {
      const event = sales.lastSalesEvent;
      if (settings.enabled && settings.categories.sales) {
        addNotification({
          type: event.type,
          category: 'sales',
          title: 'Đơn hàng mới',
          message: `${event.data?.sale_number}: ${formatCurrency(event.data?.total_amount || 0)}`,
          level: 'success',
          data: event.data,
          actions: [
            {
              label: 'Xem chi tiết',
              action: () => console.log('View sale details:', event.data),
              color: 'primary'
            }
          ]
        });
        
        if (settings.sounds) {
          playNotificationSound('success');
        }
      }
    }
  }, [sales.lastSalesEvent]);

  // Inventory events
  useEffect(() => {
    if (inventory.lastInventoryEvent) {
      const event = inventory.lastInventoryEvent;
      if (settings.enabled && settings.categories.inventory) {
        let level: NotificationItem['level'] = 'info';
        let title = 'Cập nhật tồn kho';
        let message = event.data?.product_name || 'Sản phẩm không xác định';

        if (event.type === 'stock_low') {
          level = 'warning';
          title = 'Cảnh báo tồn kho thấp';
          message = `${event.data?.product_name}: ${event.data?.current_stock}/${event.data?.min_stock}`;
        } else if (event.type === 'stock_out') {
          level = 'error';
          title = 'Hết hàng';
          message = `${event.data?.product_name}: Đã hết hàng`;
        }

        addNotification({
          type: event.type,
          category: 'inventory',
          title,
          message,
          level,
          data: event.data,
          actions: [
            {
              label: 'Xem sản phẩm',
              action: () => console.log('View product:', event.data),
              color: 'primary'
            },
            {
              label: 'Nhập hàng',
              action: () => console.log('Stock in:', event.data),
              color: 'secondary'
            }
          ]
        });

        if (settings.sounds && level === 'warning') {
          playNotificationSound('warning');
        } else if (settings.sounds && level === 'error') {
          playNotificationSound('error');
        }
      }
    }
  }, [inventory.lastInventoryEvent]);

  // Customer events
  useEffect(() => {
    if (customers.lastCustomerEvent) {
      const event = customers.lastCustomerEvent;
      if (settings.enabled && settings.categories.customers) {
        addNotification({
          type: event.type,
          category: 'customers',
          title: event.type === 'customer_created' ? 'Khách hàng mới' : 'Cập nhật khách hàng',
          message: event.data?.name || 'Khách hàng không xác định',
          level: 'info',
          data: event.data,
          actions: [
            {
              label: 'Xem hồ sơ',
              action: () => console.log('View customer:', event.data),
              color: 'primary'
            }
          ]
        });
      }
    }
  }, [customers.lastCustomerEvent]);

  // System events
  useEffect(() => {
    if (system.lastSystemEvent) {
      const event = system.lastSystemEvent;
      if (settings.enabled && settings.categories.system) {
        let level: NotificationItem['level'] = 'info';
        let title = 'Thông báo hệ thống';
        let message = event.data?.message || 'Sự kiện hệ thống';

        if (event.type === 'system_alert') {
          level = (event.data?.level as NotificationItem['level']) || 'warning';
          title = 'Cảnh báo hệ thống';
        } else if (event.type === 'user_login') {
          level = 'success';
          title = 'Đăng nhập';
          message = `${event.data?.username} đã đăng nhập`;
        } else if (event.type === 'user_logout') {
          level = 'info';
          title = 'Đăng xuất';
          message = `${event.data?.username} đã đăng xuất`;
        }

        addNotification({
          type: event.type,
          category: 'system',
          title,
          message,
          level,
          data: event.data
        });

        if (settings.sounds && level === 'error') {
          playNotificationSound('error');
        }
      }
    }
  }, [system.lastSystemEvent]);

  const addNotification = useCallback((notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: NotificationItem = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: settings.autoMarkRead
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      return updated.slice(0, settings.maxItems);
    });

    // Show snackbar for important notifications
    if (notification.level === 'error' || notification.level === 'warning') {
      enqueueSnackbar(notification.message, { 
        variant: notification.level,
        autoHideDuration: 5000
      });
    }
  }, [settings.autoMarkRead, settings.maxItems, enqueueSnackbar]);

  const playNotificationSound = (type: 'success' | 'warning' | 'error') => {
    // Create audio context and play sound
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies for different notification types
      const frequencies = {
        success: [800, 1000],
        warning: [600, 400],
        error: [400, 300, 200]
      };

      const freq = frequencies[type];
      oscillator.frequency.setValueAtTime(freq[0], audioContext.currentTime);
      
      if (freq.length > 1) {
        freq.forEach((f, index) => {
          oscillator.frequency.setValueAtTime(f, audioContext.currentTime + (index * 0.1));
        });
      }

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const handleClearAll = () => {
    setNotifications([]);
    handleMenuClose();
  };

  const handleMarkRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const handleRemoveNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const getNotificationIcon = (category: string) => {
    switch (category) {
      case 'sales': return <SalesIcon />;
      case 'inventory': return <InventoryIcon />;
      case 'customers': return <CustomersIcon />;
      case 'system': return <SystemIcon />;
      default: return <InfoIcon />;
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success': return <SuccessIcon color="success" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'error': return <ErrorIcon color="error" />;
      default: return <InfoIcon color="info" />;
    }
  };

  const getLevelColor = (level: string): any => {
    switch (level) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'info';
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesSearch = searchTerm === '' || 
      notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || notif.category === filterCategory;
    
    const matchesTab = currentTab === 0 || 
      (currentTab === 1 && !notif.read) ||
      (currentTab === 2 && notif.read);
    
    return matchesSearch && matchesCategory && matchesTab;
  });

  const unreadCount = notifications.filter(notif => !notif.read).length;

  return (
    <Box>
      {/* Notification Badge Button */}
      <IconButton
        color="inherit"
        onClick={handleMenuOpen}
        sx={{ position: 'relative' }}
      >
        <Badge badgeContent={unreadCount} color="error" max={99}>
          {unreadCount > 0 ? <ActiveNotificationsIcon /> : <NotificationsIcon />}
        </Badge>
      </IconButton>

      {/* Notification Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { 
            width: 420, 
            maxHeight: 600,
            '& .MuiMenuItem-root': {
              whiteSpace: 'normal',
              minHeight: 'auto'
            }
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              Thông báo ({unreadCount})
            </Typography>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Quản lý WebSocket">
                <IconButton 
                  size="small" 
                  onClick={() => setShowWebSocketManager(!showWebSocketManager)}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Cài đặt">
                <IconButton size="small" onClick={() => setShowSettings(!showSettings)}>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={settings.sounds ? 'Tắt âm thanh' : 'Bật âm thanh'}>
                <IconButton 
                  size="small" 
                  onClick={() => setSettings(prev => ({ ...prev, sounds: !prev.sounds }))}
                >
                  {settings.sounds ? <UnmuteIcon /> : <MuteIcon />}
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          {/* Connection Status */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
            <Chip
              size="small"
              icon={connection.isConnected ? <SuccessIcon /> : <ErrorIcon />}
              label={connection.isConnected ? 'Đã kết nối' : 'Mất kết nối'}
              color={connection.isConnected ? 'success' : 'error'}
              variant="outlined"
            />
          </Stack>
        </Box>

        {/* WebSocket Manager Panel */}
        <Collapse in={showWebSocketManager}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <WebSocketManager />
          </Box>
        </Collapse>

        {/* Settings Panel */}
        <Collapse in={showSettings}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>Cài đặt thông báo</Typography>
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enabled}
                    onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                  />
                }
                label="Bật thông báo"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoMarkRead}
                    onChange={(e) => setSettings(prev => ({ ...prev, autoMarkRead: e.target.checked }))}
                  />
                }
                label="Tự động đánh dấu đã đọc"
              />
              
              <Typography variant="caption" color="text.secondary">Danh mục:</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {Object.entries(settings.categories).map(([category, enabled]) => (
                  <FormControlLabel
                    key={category}
                    control={
                      <Switch
                        size="small"
                        checked={enabled}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          categories: { ...prev.categories, [category]: e.target.checked }
                        }))}
                      />
                    }
                    label={category}
                    sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.75rem' } }}
                  />
                ))}
              </Stack>
            </Stack>
          </Box>
        </Collapse>

        {/* Search and Filter */}
        <Box sx={{ p: 2 }}>
          <Stack spacing={2}>
            <TextField
              size="small"
              placeholder="Tìm kiếm thông báo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant={filterCategory === 'all' ? 'contained' : 'outlined'}
                onClick={() => setFilterCategory('all')}
              >
                Tất cả
              </Button>
              {['sales', 'inventory', 'customers', 'system'].map(category => (
                <Button
                  key={category}
                  size="small"
                  variant={filterCategory === category ? 'contained' : 'outlined'}
                  onClick={() => setFilterCategory(category)}
                  sx={{ minWidth: 'auto', px: 1 }}
                >
                  {getNotificationIcon(category)}
                </Button>
              ))}
            </Stack>
          </Stack>
        </Box>

        {/* Tabs */}
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`Tất cả (${notifications.length})`} />
          <Tab label={`Chưa đọc (${unreadCount})`} />
          <Tab label={`Đã đọc (${notifications.length - unreadCount})`} />
        </Tabs>

        {/* Actions */}
        {notifications.length > 0 && (
          <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" spacing={1}>
              <Button size="small" onClick={handleMarkAllRead}>
                Đánh dấu tất cả đã đọc
              </Button>
              <Button size="small" onClick={handleClearAll} color="error">
                Xóa tất cả
              </Button>
            </Stack>
          </Box>
        )}

        {/* Notifications List */}
        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
          {filteredNotifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {notifications.length === 0 ? 'Chưa có thông báo nào' : 'Không có thông báo phù hợp'}
              </Typography>
            </Box>
          ) : (
            <List dense>
              {filteredNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      bgcolor: notification.read ? 'transparent' : 'action.hover',
                      '&:hover': { bgcolor: 'action.selected' },
                      cursor: 'pointer'
                    }}
                    onClick={() => handleMarkRead(notification.id)}
                  >
                    <ListItemIcon>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {getNotificationIcon(notification.category)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: notification.read ? 400 : 600 }}
                          >
                            {notification.title}
                          </Typography>
                          {getLevelIcon(notification.level)}
                        </Stack>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {notification.message}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              label={notification.category}
                              size="small"
                              color={getLevelColor(notification.level)}
                              variant="outlined"
                              sx={{ fontSize: '0.65rem', height: 16 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {formatDateTime(notification.timestamp, 'HH:mm')}
                            </Typography>
                          </Stack>
                          {notification.actions && (
                            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                              {notification.actions.map((action, actionIndex) => (
                                <Button
                                  key={actionIndex}
                                  size="small"
                                  variant="outlined"
                                  color={action.color || 'primary'}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    action.action();
                                  }}
                                  sx={{ fontSize: '0.7rem', py: 0.5, px: 1 }}
                                >
                                  {action.label}
                                </Button>
                              ))}
                            </Stack>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveNotification(notification.id);
                        }}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < filteredNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Menu>
    </Box>
  );
};

export default RealtimeNotificationCenter;
