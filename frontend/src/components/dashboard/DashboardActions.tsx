import React from 'react';
import {
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Box,
  Fab,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add,
  ShoppingCart,
  Inventory,
  People,
  Receipt,
  Settings,
  Refresh,
  Fullscreen,
  FullscreenExit,
  DarkMode,
  LightMode,
} from '@mui/icons-material';

interface DashboardActionsProps {
  speedDialOpen: boolean;
  setSpeedDialOpen: (open: boolean) => void;
  darkMode: boolean;
  setDarkMode: (mode: boolean) => void;
  fullscreen: boolean;
  setFullscreen: (fullscreen: boolean) => void;
  autoRefresh: boolean;
  setAutoRefresh: (refresh: boolean) => void;
  onRefreshData: () => void;
  onNewSale: () => void;
  onAddProduct: () => void;
  onAddCustomer: () => void;
  onViewReports: () => void;
  onOpenSettings: () => void;
}

const DashboardActions: React.FC<DashboardActionsProps> = ({
  speedDialOpen,
  setSpeedDialOpen,
  darkMode,
  setDarkMode,
  fullscreen,
  setFullscreen,
  autoRefresh,
  setAutoRefresh,
  onRefreshData,
  onNewSale,
  onAddProduct,
  onAddCustomer,
  onViewReports,
  onOpenSettings,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const speedDialActions = [
    {
      icon: <ShoppingCart />,
      name: 'Bán hàng mới',
      onClick: onNewSale,
    },
    {
      icon: <Inventory />,
      name: 'Thêm sản phẩm',
      onClick: onAddProduct,
    },
    {
      icon: <People />,
      name: 'Thêm khách hàng',
      onClick: onAddCustomer,
    },
    {
      icon: <Receipt />,
      name: 'Báo cáo',
      onClick: onViewReports,
    },
    {
      icon: <Settings />,
      name: 'Cài đặt',
      onClick: onOpenSettings,
    },
  ];

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  return (
    <>
      {/* Speed Dial for Quick Actions */}
      <SpeedDial
        ariaLabel="Dashboard Actions"
        sx={{ 
          position: 'fixed', 
          bottom: 16, 
          right: 16,
          zIndex: 1000,
        }}
        icon={<SpeedDialIcon />}
        open={speedDialOpen}
        onClose={() => setSpeedDialOpen(false)}
        onOpen={() => setSpeedDialOpen(true)}
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={() => {
              action.onClick();
              setSpeedDialOpen(false);
            }}
          />
        ))}
      </SpeedDial>

      {/* Control Panel */}
      <Box
        sx={{
          position: 'fixed',
          top: isMobile ? 'auto' : 100,
          bottom: isMobile ? 100 : 'auto',
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          zIndex: 999,
        }}
      >
        {/* Refresh Button */}
        <Tooltip title="Làm mới dữ liệu" placement="left">
          <Fab
            size="small"
            color="primary"
            onClick={onRefreshData}
            sx={{
              animation: autoRefresh ? 'spin 2s linear infinite' : 'none',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          >
            <Refresh />
          </Fab>
        </Tooltip>

        {/* Dark Mode Toggle */}
        <Tooltip title={darkMode ? 'Chế độ sáng' : 'Chế độ tối'} placement="left">
          <Fab
            size="small"
            color="secondary"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? <LightMode /> : <DarkMode />}
          </Fab>
        </Tooltip>

        {/* Fullscreen Toggle */}
        {!isMobile && (
          <Tooltip title={fullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'} placement="left">
            <Fab
              size="small"
              color="info"
              onClick={handleFullscreenToggle}
            >
              {fullscreen ? <FullscreenExit /> : <Fullscreen />}
            </Fab>
          </Tooltip>
        )}

        {/* Auto Refresh Toggle */}
        <Tooltip title={autoRefresh ? 'Tắt tự động làm mới' : 'Bật tự động làm mới'} placement="left">
          <Fab
            size="small"
            color={autoRefresh ? 'success' : 'default'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            sx={{
              opacity: autoRefresh ? 1 : 0.6,
            }}
          >
            <Refresh />
          </Fab>
        </Tooltip>
      </Box>
    </>
  );
};

export default React.memo(DashboardActions);
