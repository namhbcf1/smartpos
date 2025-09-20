import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Badge,
  IconButton,
  Chip,
  Divider,
  Button,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Paper
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MarkEmailRead as MarkReadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  category: 'system' | 'inventory' | 'sales' | 'customer' | 'employee';
  action?: {
    label: string;
    url: string;
  };
  data?: any;
}

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  loading?: boolean;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  open,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onRefresh,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'system':
        return 'default';
      case 'inventory':
        return 'primary';
      case 'sales':
        return 'success';
      case 'customer':
        return 'info';
      case 'employee':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'system':
        return 'Hệ thống';
      case 'inventory':
        return 'Kho hàng';
      case 'sales':
        return 'Bán hàng';
      case 'customer':
        return 'Khách hàng';
      case 'employee':
        return 'Nhân viên';
      default:
        return category;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesCategory = filterCategory === 'all' || notification.category === filterCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    
    if (notification.action) {
      window.open(notification.action.url, '_blank');
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 400,
          maxWidth: '90vw'
        }
      }}
    >
      <Box sx={{ p: 2 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
            <Typography variant="h6">Thông báo</Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Tooltip title="Làm mới">
              <IconButton onClick={onRefresh} size="small" disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Cài đặt">
              <IconButton size="small">
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Search and Filter */}
        <Box mb={2}>
          <TextField
            fullWidth
            size="small"
            placeholder="Tìm kiếm thông báo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </Box>

        <Box display="flex" gap={1} mb={2}>
          <Button
            size="small"
            startIcon={<FilterIcon />}
            onClick={handleFilterClick}
          >
            Bộ lọc
          </Button>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<MarkReadIcon />}
              onClick={onMarkAllAsRead}
            >
              Đọc tất cả
            </Button>
          )}
        </Box>

        {/* Filter Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleFilterClose}
        >
          <MenuItem onClick={() => { setFilterType('all'); handleFilterClose(); }}>
            Tất cả loại
          </MenuItem>
          <MenuItem onClick={() => { setFilterType('info'); handleFilterClose(); }}>
            Thông tin
          </MenuItem>
          <MenuItem onClick={() => { setFilterType('warning'); handleFilterClose(); }}>
            Cảnh báo
          </MenuItem>
          <MenuItem onClick={() => { setFilterType('error'); handleFilterClose(); }}>
            Lỗi
          </MenuItem>
          <MenuItem onClick={() => { setFilterType('success'); handleFilterClose(); }}>
            Thành công
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { setFilterCategory('all'); handleFilterClose(); }}>
            Tất cả danh mục
          </MenuItem>
          <MenuItem onClick={() => { setFilterCategory('system'); handleFilterClose(); }}>
            Hệ thống
          </MenuItem>
          <MenuItem onClick={() => { setFilterCategory('inventory'); handleFilterClose(); }}>
            Kho hàng
          </MenuItem>
          <MenuItem onClick={() => { setFilterCategory('sales'); handleFilterClose(); }}>
            Bán hàng
          </MenuItem>
          <MenuItem onClick={() => { setFilterCategory('customer'); handleFilterClose(); }}>
            Khách hàng
          </MenuItem>
          <MenuItem onClick={() => { setFilterCategory('employee'); handleFilterClose(); }}>
            Nhân viên
          </MenuItem>
        </Menu>

        {/* Notifications List */}
        <Box sx={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : filteredNotifications.length === 0 ? (
            <Alert severity="info">
              {searchTerm || filterType !== 'all' || filterCategory !== 'all' 
                ? 'Không tìm thấy thông báo nào' 
                : 'Chưa có thông báo nào'
              }
            </Alert>
          ) : (
            <List>
              {filteredNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      cursor: 'pointer',
                      bgcolor: notification.read ? 'transparent' : 'action.hover',
                      '&:hover': {
                        bgcolor: 'action.selected'
                      }
                    }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <ListItemIcon>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography
                            variant="body2"
                            fontWeight={notification.read ? 'normal' : 'bold'}
                          >
                            {notification.title}
                          </Typography>
                          {!notification.read && (
                            <Box
                              width={8}
                              height={8}
                              borderRadius="50%"
                              bgcolor="primary.main"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" mb={1}>
                            {notification.message}
                          </Typography>
                          <Box display="flex" gap={1} alignItems="center">
                            <Chip
                              label={getCategoryLabel(notification.category)}
                              size="small"
                              color={getCategoryColor(notification.category)}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {formatDistanceToNow(new Date(notification.timestamp), {
                                addSuffix: true,
                                locale: vi
                              })}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    <Box display="flex" flexDirection="column" gap={1}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead(notification.id);
                        }}
                        disabled={notification.read}
                      >
                        <MarkReadIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(notification.id);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItem>
                  {index < filteredNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default NotificationCenter;
