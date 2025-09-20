import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  Stack,
  Button,
  LinearProgress,
  Tooltip,
  IconButton,
  Badge,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider
} from '@mui/material';
import {
  Wifi as ConnectedIcon,
  WifiOff as DisconnectedIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
  Notifications as NotificationIcon,
  Cable as WebSocketIcon,
  Router as PollingIcon,
  Speed as LatencyIcon,
  Schedule as HeartbeatIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { realtimeService } from '../../services/realtime';
import { formatDateTime } from '../../utils/format';

// Safety wrapper to ensure realtimeService is always available
const getRealtimeService = () => {
  if (!realtimeService || typeof realtimeService.on !== 'function') {
    console.error('RealtimeService not available in WebSocketManager');
    return {
      on: () => {},
      off: () => {},
      isConnected: () => false,
      send: () => {},
      connect: () => Promise.resolve(),
      disconnect: () => {}
    };
  }
  return realtimeService;
};

interface WebSocketStats {
  connected: boolean;
  connectionType: 'websocket' | 'polling' | 'offline';
  lastPing?: number;
  latency?: number;
  messagesSent: number;
  messagesReceived: number;
  reconnectAttempts: number;
  uptime?: number;
  lastHeartbeat?: Date;
  errors: Array<{ timestamp: Date; message: string; type: string }>;
}

interface RealtimeMessage {
  id: string;
  type: string;
  timestamp: Date;
  data: any;
  level: 'info' | 'success' | 'warning' | 'error';
}

const WebSocketManager: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [showMessages, setShowMessages] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState<WebSocketStats>({
    connected: false,
    connectionType: 'offline',
    messagesSent: 0,
    messagesReceived: 0,
    reconnectAttempts: 0,
    errors: []
  });
  const [recentMessages, setRecentMessages] = useState<RealtimeMessage[]>([]);
  const [connectionLog, setConnectionLog] = useState<string[]>([]);

  const pingTimeRef = useRef<number>(0);
  const statsRef = useRef(stats);
  statsRef.current = stats;

  useEffect(() => {
    let messageCount = 0;
    let sentCount = 0;

    const handleConnected = () => {
      console.log('🟢 WebSocket connected');
      setStats(prev => ({
        ...prev,
        connected: true,
        connectionType: 'websocket',
        uptime: Date.now(),
        reconnectAttempts: 0
      }));
      
      addToLog('Kết nối WebSocket thành công');
      addMessage('connected', 'Kết nối thành công', {}, 'success');
    };

    const handleDisconnected = () => {
      console.log('🔴 WebSocket disconnected');
      setStats(prev => ({
        ...prev,
        connected: false,
        connectionType: 'offline',
        uptime: undefined
      }));
      
      addToLog('Mất kết nối WebSocket');
      addMessage('disconnected', 'Mất kết nối', {}, 'warning');
    };

    const handleError = (error: any) => {
      console.error('❌ WebSocket error:', error);
      const errorMsg = error?.message || 'Lỗi không xác định';
      
      setStats(prev => ({
        ...prev,
        errors: [
          { timestamp: new Date(), message: errorMsg, type: 'connection' },
          ...prev.errors.slice(0, 9)
        ]
      }));
      
      addToLog(`Lỗi: ${errorMsg}`);
      addMessage('error', `Lỗi kết nối: ${errorMsg}`, { error: errorMsg }, 'error');
    };

    const handleHeartbeat = (data: any) => {
      const now = Date.now();
      const latency = now - pingTimeRef.current;
      
      setStats(prev => ({
        ...prev,
        lastHeartbeat: new Date(),
        latency,
        lastPing: now
      }));
    };

    const handleMessage = (event: any) => {
      messageCount++;
      setStats(prev => ({
        ...prev,
        messagesReceived: messageCount,
        connectionType: prev.connected ? 'websocket' : 'polling'
      }));

      addMessage(event.type, getEventMessage(event), event.data, getEventLevel(event.type));
    };

    const handleSent = () => {
      sentCount++;
      setStats(prev => ({
        ...prev,
        messagesSent: sentCount
      }));
    };

    const service = getRealtimeService();

    // Register event listeners
    service.on('connected', handleConnected);
    service.on('disconnected', handleDisconnected);
    service.on('error', handleError);
    service.on('heartbeat', handleHeartbeat);
    service.on('event', handleMessage);
    service.on('message_sent', handleSent);

    // Initial connection check
    if (service.isConnected()) {
      handleConnected();
    }

    // Send ping every 30 seconds to measure latency
    const pingInterval = setInterval(() => {
      if (stats.connected) {
        pingTimeRef.current = Date.now();
        service.send({
          type: 'ping',
          data: {},
          timestamp: Date.now()
        });
      }
    }, 30000);

    return () => {
      service.off('connected', handleConnected);
      service.off('disconnected', handleDisconnected);
      service.off('error', handleError);
      service.off('heartbeat', handleHeartbeat);
      service.off('event', handleMessage);
      service.off('message_sent', handleSent);
      clearInterval(pingInterval);
    };
  }, []);

  const addMessage = (type: string, message: string, data: any, level: RealtimeMessage['level']) => {
    const newMessage: RealtimeMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: new Date(),
      data,
      level
    };

    setRecentMessages(prev => [newMessage, ...prev.slice(0, 19)]);
  };

  const addToLog = (message: string) => {
    const logEntry = `${formatDateTime(new Date(), 'HH:mm:ss')} - ${message}`;
    setConnectionLog(prev => [logEntry, ...prev.slice(0, 29)]);
  };

  const getEventMessage = (event: any): string => {
    switch (event.type) {
      case 'sale_created':
        return `Đơn hàng mới: ${event.data?.sale_number || 'N/A'}`;
      case 'stock_updated':
        return `Cập nhật tồn kho: ${event.data?.product_name || 'N/A'}`;
      case 'stock_low':
        return `Cảnh báo tồn kho thấp: ${event.data?.product_name || 'N/A'}`;
      case 'user_login':
        return `Đăng nhập: ${event.data?.username || 'N/A'}`;
      case 'user_logout':
        return `Đăng xuất: ${event.data?.username || 'N/A'}`;
      case 'system_alert':
        return `Cảnh báo hệ thống: ${event.data?.message || 'N/A'}`;
      case 'serial_number_updated':
        return `Cập nhật serial: ${event.data?.serial_number || 'N/A'}`;
      default:
        return `Sự kiện: ${event.type}`;
    }
  };

  const getEventLevel = (type: string): RealtimeMessage['level'] => {
    switch (type) {
      case 'error':
      case 'system_alert':
        return 'error';
      case 'stock_low':
      case 'disconnected':
        return 'warning';
      case 'connected':
      case 'sale_created':
      case 'user_login':
        return 'success';
      default:
        return 'info';
    }
  };

  const handleToggleEnabled = (enabled: boolean) => {
    setIsEnabled(enabled);
    const service = getRealtimeService();
    if (enabled) {
      service.connect();
      addToLog('Bắt đầu kết nối lại');
    } else {
      service.disconnect();
      addToLog('Ngắt kết nối thủ công');
    }
  };

  const handleReconnect = () => {
    addToLog('Thực hiện kết nối lại thủ công');
    const service = getRealtimeService();
    service.disconnect();
    setTimeout(() => {
      service.connect();
    }, 1000);
  };

  const getConnectionIcon = () => {
    if (!isEnabled) return <DisconnectedIcon color="disabled" />;
    return stats.connected ? <ConnectedIcon color="success" /> : <DisconnectedIcon color="error" />;
  };

  const getConnectionColor = () => {
    if (!isEnabled) return 'default';
    return stats.connected ? 'success' : 'error';
  };

  const getConnectionText = () => {
    if (!isEnabled) return 'Đã tắt';
    if (stats.connected) {
      return stats.connectionType === 'websocket' ? 'WebSocket' : 'Polling';
    }
    return 'Không kết nối';
  };

  const getMessageIcon = (level: string) => {
    switch (level) {
      case 'success': return <SuccessIcon color="success" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'error': return <ErrorIcon color="error" />;
      default: return <InfoIcon color="info" />;
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            {getConnectionIcon()}
            <Box>
              <Typography variant="h6">WebSocket Manager</Typography>
              <Typography variant="body2" color="text.secondary">
                Quản lý kết nối thời gian thực
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Tooltip title="Xem tin nhắn">
              <IconButton 
                size="small" 
                onClick={() => setShowMessages(!showMessages)}
                color={recentMessages.length > 0 ? 'primary' : 'default'}
              >
                <Badge badgeContent={recentMessages.length} color="error" max={99}>
                  {showMessages ? <VisibilityOff /> : <ViewIcon />}
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="Cài đặt">
              <IconButton size="small" onClick={() => setShowSettings(!showSettings)}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Kết nối lại">
              <IconButton size="small" onClick={handleReconnect} disabled={!isEnabled}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Connection Status */}
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Chip
              icon={getConnectionIcon()}
              label={getConnectionText()}
              color={getConnectionColor() as any}
              size="small"
            />
            {stats.connectionType === 'websocket' && (
              <Chip icon={<WebSocketIcon />} label="WebSocket" size="small" />
            )}
            {stats.connectionType === 'polling' && (
              <Chip icon={<PollingIcon />} label="Polling" color="warning" size="small" />
            )}
            {stats.latency && (
              <Chip
                icon={<LatencyIcon />}
                label={`${stats.latency}ms`}
                color={stats.latency < 100 ? 'success' : stats.latency < 500 ? 'warning' : 'error'}
                size="small"
              />
            )}
            {stats.lastHeartbeat && (
              <Chip
                icon={<HeartbeatIcon />}
                label={formatDateTime(stats.lastHeartbeat, 'HH:mm:ss')}
                size="small"
              />
            )}
          </Stack>
        </Box>

        {/* Connection Statistics */}
        <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Gửi</Typography>
            <Typography variant="h6">{stats.messagesSent}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Nhận</Typography>
            <Typography variant="h6">{stats.messagesReceived}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Thử lại</Typography>
            <Typography variant="h6">{stats.reconnectAttempts}</Typography>
          </Box>
          {stats.uptime && (
            <Box>
              <Typography variant="caption" color="text.secondary">Thời gian hoạt động</Typography>
              <Typography variant="h6">
                {Math.floor((Date.now() - stats.uptime) / 1000)}s
              </Typography>
            </Box>
          )}
        </Stack>

        {/* Settings Panel */}
        <Collapse in={showSettings}>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>Cài đặt kết nối</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={isEnabled}
                  onChange={(e) => handleToggleEnabled(e.target.checked)}
                />
              }
              label="Bật WebSocket"
            />
            
            {stats.errors.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Lỗi gần đây</Typography>
                {stats.errors.slice(0, 3).map((error, index) => (
                  <Alert key={index} severity="error" size="small" sx={{ mb: 1 }}>
                    {formatDateTime(error.timestamp, 'HH:mm:ss')} - {error.message}
                  </Alert>
                ))}
              </Box>
            )}
          </Box>
        </Collapse>

        {/* Messages Panel */}
        <Collapse in={showMessages}>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle2">Tin nhắn gần đây</Typography>
              <Button
                size="small"
                onClick={() => setRecentMessages([])}
                disabled={recentMessages.length === 0}
              >
                Xóa tất cả
              </Button>
            </Stack>
            
            {recentMessages.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                Chưa có tin nhắn nào
              </Typography>
            ) : (
              <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                {recentMessages.slice(0, 10).map((message, index) => (
                  <React.Fragment key={message.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {getMessageIcon(message.level)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {getEventMessage(message)}
                          </Typography>
                        }
                        secondary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              label={message.type}
                              size="small"
                              color={message.level}
                              sx={{ fontSize: '0.7rem', height: 18 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {formatDateTime(message.timestamp, 'HH:mm:ss')}
                            </Typography>
                          </Stack>
                        }
                      />
                    </ListItem>
                    {index < recentMessages.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
            
            {connectionLog.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                  Log kết nối (5 mục gần nhất)
                </Typography>
                <Box sx={{ bgcolor: 'grey.50', p: 1, borderRadius: 1, fontSize: '0.75rem' }}>
                  {connectionLog.slice(0, 5).map((log, index) => (
                    <Typography key={index} variant="caption" display="block" sx={{ fontFamily: 'monospace' }}>
                      {log}
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Collapse>

        {/* Connection Progress */}
        {!stats.connected && isEnabled && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Đang kết nối...
            </Typography>
            <LinearProgress />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default WebSocketManager;
