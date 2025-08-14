import React from 'react';
import {
  Box,
  Chip,
  Tooltip,
  Typography,
  Stack,
  IconButton,
  Badge
} from '@mui/material';
import {
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Refresh as RefreshIcon,
  Circle as CircleIcon
} from '@mui/icons-material';
import { useRealtimeConnection } from '../../hooks/useRealtime';

interface RealtimeStatusProps {
  showDetails?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const RealtimeStatus: React.FC<RealtimeStatusProps> = ({
  showDetails = false,
  size = 'medium'
}) => {
  const { isConnected, connectionInfo, connect, disconnect } = useRealtimeConnection();

  const getStatusColor = () => {
    return isConnected ? 'success' : 'error';
  };

  const getStatusText = () => {
    if (isConnected) {
      return 'Kết nối realtime';
    }
    return connectionInfo.attempts > 0 ? 'Đang kết nối lại...' : 'Mất kết nối';
  };

  const getStatusIcon = () => {
    return isConnected ? <WifiIcon /> : <WifiOffIcon />;
  };

  if (!showDetails) {
    return (
      <Tooltip title={getStatusText()}>
        <Chip
          icon={getStatusIcon()}
          label={isConnected ? 'Online' : 'Offline'}
          color={getStatusColor()}
          size={size === 'large' ? 'medium' : 'small'}
          variant={isConnected ? 'filled' : 'outlined'}
        />
      </Tooltip>
    );
  }

  return (
    <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Badge
            color={getStatusColor()}
            variant="dot"
            sx={{
              '& .MuiBadge-badge': {
                animation: isConnected ? 'pulse 2s infinite' : 'none',
              },
              '@keyframes pulse': {
                '0%': {
                  transform: 'scale(0.95)',
                  boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.7)',
                },
                '70%': {
                  transform: 'scale(1)',
                  boxShadow: '0 0 0 10px rgba(76, 175, 80, 0)',
                },
                '100%': {
                  transform: 'scale(0.95)',
                  boxShadow: '0 0 0 0 rgba(76, 175, 80, 0)',
                },
              },
            }}
          >
            {getStatusIcon()}
          </Badge>
          
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {getStatusText()}
            </Typography>
            {connectionInfo.attempts > 0 && !isConnected && (
              <Typography variant="caption" color="text.secondary">
                Lần thử: {connectionInfo.attempts}
              </Typography>
            )}
          </Box>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Tooltip title="Làm mới kết nối">
            <IconButton
              size="small"
              onClick={isConnected ? disconnect : connect}
              color={isConnected ? 'error' : 'primary'}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Connection Details */}
      {connectionInfo.id && (
        <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            ID: {connectionInfo.id}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

// Compact status indicator for header/toolbar
export const RealtimeIndicator: React.FC = () => {
  const { isConnected } = useRealtimeConnection();

  return (
    <Tooltip title={isConnected ? 'Realtime: Kết nối' : 'Realtime: Mất kết nối'}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <CircleIcon
          sx={{
            fontSize: 8,
            color: isConnected ? 'success.main' : 'error.main',
            animation: isConnected ? 'blink 2s infinite' : 'none',
            '@keyframes blink': {
              '0%, 50%': { opacity: 1 },
              '51%, 100%': { opacity: 0.3 },
            },
          }}
        />
      </Box>
    </Tooltip>
  );
};

export default RealtimeStatus;
