import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Stack,
  IconButton,
  Tooltip,
  Badge,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Refresh,
  Fullscreen,
  FullscreenExit,
  Notifications,
  Settings,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

interface DashboardHeaderProps {
  selectedTimeRange: string;
  setSelectedTimeRange: (value: string) => void;
  handleRefreshData: () => void;
  handleFullscreenToggle: () => void;
  setSettingsDialogOpen: (open: boolean) => void;
  fullscreen: boolean;
  alertsCount: number;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  selectedTimeRange,
  setSelectedTimeRange,
  handleRefreshData,
  handleFullscreenToggle,
  setSettingsDialogOpen,
  fullscreen,
  alertsCount,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  return (
    <Paper
      elevation={1}
      sx={{
        p: { xs: 2, sm: 3 },
        mb: 3,
        borderRadius: 2,
        bgcolor: 'white'
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
              fontWeight: 600,
              color: 'primary.main',
              mb: 1
            }}
          >
            Xin chào, {user?.fullName || user?.username}! 👋
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Thống kê tổng quan - {new Date().toLocaleDateString('vi-VN', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          {/* Time Range Selector */}
          <ToggleButtonGroup
            value={selectedTimeRange}
            exclusive
            onChange={(_, value) => value && setSelectedTimeRange(value)}
            size="small"
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            <ToggleButton value="today">Hôm nay</ToggleButton>
            <ToggleButton value="week">Tuần</ToggleButton>
            <ToggleButton value="month">Tháng</ToggleButton>
          </ToggleButtonGroup>

          {/* Modern Controls */}
          <Tooltip title="Làm mới dữ liệu">
            <IconButton
              onClick={handleRefreshData}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' }
              }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>

          <Tooltip title="Chế độ toàn màn hình">
            <IconButton
              onClick={handleFullscreenToggle}
              sx={{
                bgcolor: 'secondary.main',
                color: 'white',
                '&:hover': { bgcolor: 'secondary.dark' }
              }}
            >
              {fullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Thông báo">
            <IconButton
              sx={{
                bgcolor: 'warning.main',
                color: 'white',
                '&:hover': { bgcolor: 'warning.dark' }
              }}
            >
              <Badge badgeContent={alertsCount} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Cài đặt">
            <IconButton
              onClick={() => setSettingsDialogOpen(true)}
              sx={{
                bgcolor: 'info.main',
                color: 'white',
                '&:hover': { bgcolor: 'info.dark' }
              }}
            >
              <Settings />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default DashboardHeader;
