import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Inventory,
  ShoppingCart,
  People,
  Assessment,
  Settings,
  Logout,
  Notifications,
  Search,
  LightMode,
  DarkMode,
  Store,
  PointOfSale,
  Business,
  LocalOffer,
  Warehouse,
  Security,
  AttachMoney,
  SupportAgent,
  QrCode,
  LocalShipping,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { settingsAPI } from '../services/api';
// Removed heavy per-item animations to reduce render overhead

// Sidebar width
const DRAWER_WIDTH = 280;

// Navigation items
const navigationItems = [
  { text: 'Dashboard', icon: Dashboard, path: '/dashboard' },
  { text: 'POS', icon: PointOfSale, path: '/pos' },
  { text: 'Sản phẩm', icon: Inventory, path: '/products' },
  { text: 'Serials', icon: QrCode, path: '/serials' },
  { text: 'Đơn hàng', icon: ShoppingCart, path: '/orders' },
  { text: 'Shipping', icon: LocalShipping, path: '/shipping' },
  { text: 'Khách hàng', icon: People, path: '/customers' },
  { text: 'Nhân viên', icon: People, path: '/employees' },
  { text: 'Nhà cung cấp', icon: Business, path: '/suppliers' },
  { text: 'Khuyến mãi', icon: LocalOffer, path: '/promotions' },
  { text: 'Kho hàng', icon: Warehouse, path: '/warehouses' },
  { text: 'Bảo hành', icon: Security, path: '/warranty' },
  { text: 'Công nợ', icon: AttachMoney, path: '/debts' },
  { text: 'Support Tickets', icon: SupportAgent, path: '/support' },
  { text: 'Báo cáo', icon: Assessment, path: '/reports' },
  { text: 'Cài đặt', icon: Settings, path: '/settings' },
];

interface MainLayoutProps {
  children: React.ReactNode;
  themeMode: 'light' | 'dark';
  onThemeToggle: () => void;
  fullWidth?: boolean; // optional: allow pages to opt-in wider layout (e.g., POS, big tables)
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  themeMode, 
  onThemeToggle,
  fullWidth = false,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Get store settings
  const { data: storeSettings, isLoading: storeLoading, error: storeError } = useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      try {
        console.log('Fetching store settings...');
        const response = await settingsAPI.getByCategory('store');
        console.log('Store settings response:', response.data);
        console.log('Store name from API:', response.data?.store_name);
        return response.data;
      } catch (error) {
        console.error('Failed to load store settings:', error);
        return { store_name: 'SmartPOS' }; // fallback
      }
    },
    staleTime: 0, // No cache - always fetch fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Extract store_name from nested response structure
  const storeName = storeSettings?.store_name || storeSettings?.data?.store_name || 'SmartPOS';
  
  // Debug logging
  console.log('Store settings:', storeSettings);
  console.log('Store settings.data:', storeSettings?.data);
  console.log('Store settings.data.store_name:', storeSettings?.data?.store_name);
  console.log('Store settings.store_name:', storeSettings?.store_name);
  console.log('Store name:', storeName);
  console.log('Store loading:', storeLoading);
  console.log('Store error:', storeError);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    navigate('/login');
    handleProfileMenuClose();
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Sidebar content
  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo Section */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Avatar
          sx={{
            bgcolor: 'primary.main',
            width: 48,
            height: 48,
            boxShadow: theme.shadows[4],
          }}
        >
          <Store />
        </Avatar>
        <Box>
          <Typography variant="h6" fontWeight="bold" color="primary">
            {storeName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Quản lý thông minh
          </Typography>
        </Box>
      </Box>

      {/* Navigation */}
      <List sx={{ flex: 1, px: 2, py: 2 }}>
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
              <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 2,
                    backgroundColor: isActive ? 'primary.main' : 'transparent',
                    color: isActive ? 'primary.contrastText' : 'text.primary',
                    '&:hover': {
                      backgroundColor: isActive 
                        ? 'primary.dark' 
                        : 'action.hover',
                    },
                    transition: 'background-color 0.15s ease-in-out',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? 'primary.contrastText' : 'text.secondary',
                      minWidth: 40,
                    }}
                  >
                    <item.icon />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
          );
        })}
      </List>

      {/* User Section */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 2,
            borderRadius: 2,
            backgroundColor: 'background.paper',
            border: 1,
            borderColor: 'divider',
          }}
        >
          <Avatar
            sx={{
              bgcolor: 'secondary.main',
              width: 40,
              height: 40,
            }}
          >
            {currentUser.username?.charAt(0).toUpperCase() || 'A'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight="bold" noWrap>
              {currentUser.full_name || currentUser.username || 'Admin'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {currentUser.role || 'Administrator'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Search Bar */}
          <Box sx={{ flexGrow: 1, maxWidth: 600, mx: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'action.hover',
                borderRadius: 2,
                px: 2,
                py: 1,
                maxWidth: 400,
              }}
            >
              <Search sx={{ color: 'text.secondary', mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Tìm kiếm sản phẩm, khách hàng...
              </Typography>
            </Box>
          </Box>

          {/* Right side actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Theme Toggle */}
            <Tooltip title={`Chuyển sang ${themeMode === 'light' ? 'dark' : 'light'} mode`}>
              <IconButton onClick={onThemeToggle} color="inherit">
                {themeMode === 'light' ? <DarkMode /> : <LightMode />}
              </IconButton>
            </Tooltip>

            {/* Notifications */}
            <Tooltip title="Thông báo">
              <IconButton color="inherit">
                <Badge badgeContent={3} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Profile Menu */}
            <Tooltip title="Tài khoản">
              <IconButton
                onClick={handleProfileMenuOpen}
                color="inherit"
                sx={{ ml: 1 }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: 'primary.main',
                  }}
                >
                  {currentUser.username?.charAt(0).toUpperCase() || 'A'}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Cài đặt tài khoản
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Đăng xuất
        </MenuItem>
      </Menu>

      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          backgroundColor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, md: 3 }, height: 'calc(100vh - 64px)', overflow: 'auto' }}>
          <Box
            sx={{
              mx: 'auto',
              width: '100%',
              maxWidth: fullWidth
                ? { xs: '100%', sm: '100%', md: '100%' }
                : { xs: '100%', sm: 720, md: 1040, lg: 1280, xl: 1400 },
              transition: 'max-width 0.2s ease',
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;