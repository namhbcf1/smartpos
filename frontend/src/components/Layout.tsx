import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Menu,
  MenuItem,
  Button,
  useTheme,
  useMediaQuery,
  Avatar,
  Badge,
  Tooltip,
  alpha,
  InputBase,
  Paper,
  Fade,
  Slide,
  Zoom,
  Chip,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ShoppingCart as ShoppingCartIcon,
  Category as CategoryIcon,
  ReceiptLong as ReceiptIcon,
  Assessment as ReportIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  AccountCircle as AccountIcon,
  ExitToApp as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Storefront as StoreIcon,
  Inventory as InventoryIcon,
  MonetizationOn as RevenueIcon,
  AccountBalance as AccountsIcon,
  Notifications as NotificationIcon,
  Search as SearchIcon,

  BarChart as StatisticsIcon,
  Discount as DiscountIcon,
  PersonAdd as CustomerIcon,
  CreditCard as PaymentIcon,
  Restore as HistoryIcon,
  Receipt as InvoiceIcon,
  Store as StoresIcon,
  CalendarMonth as CalendarIcon,
  Business as BusinessIcon,
  Computer as ComputerIcon,
  Security as SecurityIcon,
  QrCode as QrCodeIcon,
} from '@mui/icons-material';

import { useAuth } from '../hooks/useAuth';
import { drawerWidth } from '../config/constants';
import { colors, gradients, shadows } from '../theme';
import { RealtimeIndicator } from './realtime/RealtimeStatus';
import { NotificationBadge as LiveNotificationBadge } from './realtime/LiveNotifications';
import { usePermissions, permissionService } from '../services/permissionService';

// 🎨 Modern Animations
const slideIn = keyframes`
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const fadeInUp = keyframes`
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

// 🎨 Modern Styled Components
const ModernAppBar = styled(AppBar)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.95)', // Light white background
  backdropFilter: 'blur(20px)',
  borderBottom: `1px solid ${colors.gray[200]}`,
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  color: colors.gray[800], // Dark text
  zIndex: theme.zIndex.drawer + 2, // Ensure AppBar is always on top
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}));

const ModernDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    background: 'rgba(248, 250, 252, 0.98)', // Light gray background
    backdropFilter: 'blur(20px)',
    borderRight: `1px solid ${colors.gray[200]}`,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
    // Fix z-index issue - use proper drawer z-index
    zIndex: theme.zIndex.drawer, // Use default drawer z-index
  },
}));

const GlassContainer = styled(Box)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.9)', // Light background
  backdropFilter: 'blur(20px)',
  borderRadius: 20,
  border: `1px solid ${colors.gray[200]}`,
  boxShadow: shadows.soft,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: shadows.medium,
  },
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  borderRadius: 12,
  background: 'rgba(248, 250, 252, 0.9)', // Light background
  backdropFilter: 'blur(10px)',
  border: `1px solid ${colors.gray[300]}`,
  '&:hover': {
    background: 'rgba(241, 245, 249, 1)',
    borderColor: colors.primary[400],
  },
  '&:focus-within': {
    background: 'rgba(255, 255, 255, 1)',
    borderColor: colors.primary[500],
    boxShadow: shadows.colored.primary,
  },
  marginLeft: theme.spacing(2),
  marginRight: theme.spacing(2),
  width: '100%',
  maxWidth: 400,
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: colors.gray[500], // Medium gray
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: colors.gray[800], // Dark text
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1.5, 1, 1.5, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    fontSize: '0.875rem',
    fontWeight: 500,
    '&::placeholder': {
      color: colors.gray[500], // Medium gray placeholder
    },
  },
}));

const NotificationBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', // warm gradient
    color: 'white',
    fontWeight: 600,
    fontSize: '0.75rem',
    animation: `${pulse} 2s infinite`,
  },
}));

const UserAvatar = styled(Avatar)(({ theme }) => ({
  width: 40,
  height: 40,
  background: gradients.primary,
  fontWeight: 600,
  fontSize: '1rem',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'scale(1.1)',
    boxShadow: shadows.colored.primary,
  },
}));

const ModernListItem = styled(ListItem)(({ theme }) => ({
  borderRadius: 12,
  margin: '4px 12px',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: colors.primary[50],
    transform: 'translateX(4px)',
  },
  '&.active': {
    backgroundColor: colors.primary[100],
    borderLeft: `4px solid ${colors.primary[500]}`,
    '& .MuiListItemIcon-root': {
      color: colors.primary[600],
    },
    '& .MuiListItemText-primary': {
      color: colors.primary[700],
      fontWeight: 600,
    },
  },
}));

const MainContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  background: `linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)`, // Light gradient
  minHeight: '100vh',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      radial-gradient(circle at 20% 80%, ${alpha(colors.primary[100], 0.3)} 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, ${alpha(colors.secondary[100], 0.3)} 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, ${alpha(colors.success[100], 0.2)} 0%, transparent 50%)
    `,
    pointerEvents: 'none',
  },
}));

const Layout = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { canAccessMenu } = usePermissions();
  
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [drawerCollapsed, setDrawerCollapsed] = useState(false); // New state for collapsed sidebar
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationEl, setNotificationEl] = useState<null | HTMLElement>(null);
  

  
  // Helper function to check if user has permission for a feature
  const hasPermission = (requiredRoles: string[], menuKey?: string) => {
    // If menuKey is provided, try the new permission system first
    if (menuKey) {
      const hasMenuPermission = canAccessMenu(menuKey);

      // If permissions are loaded and user doesn't have permission, deny access
      if (permissionService.getPermissionStatus().loaded && !hasMenuPermission) {
        return false;
      }

      // If permissions are not loaded yet, fallback to role-based checking
      if (!permissionService.getPermissionStatus().loaded) {
        console.log(`🔄 Permissions not loaded yet, using role-based fallback for: ${menuKey}`);
        if (!user?.role) return false;
        return requiredRoles.includes(user.role);
      }

      return hasMenuPermission;
    }

    // Fallback to role-based checking for backward compatibility
    if (!user?.role) return false;
    return requiredRoles.includes(user.role);
  };

  // 🎯 Restructured Navigation - 6 Main Groups with Role-based Access
  const navItems = [
    // 📊 DASHBOARD - All roles can access dashboard
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      exact: true,
      group: 'dashboard',
      groupLabel: '📊 DASHBOARD',
      menuKey: 'dashboard',
      roles: ['admin', 'manager', 'cashier', 'inventory', 'sales_agent', 'affiliate']  // All roles can access dashboard
    },

    // 🛒 BÁN HÀNG (POS, Orders, Returns) - Sales agents, affiliates, cashiers and above
    {
      text: 'Điểm bán hàng',
      icon: <ShoppingCartIcon />,
      path: '/sales/new',
      group: 'sales',
      groupLabel: '🛒 BÁN HÀNG',
      menuKey: 'sales.pos',
      roles: ['admin', 'manager', 'cashier', 'sales_agent', 'affiliate']
    },
    {
      text: 'Lịch sử bán hàng',
      icon: <ReceiptIcon />,
      path: '/sales',
      group: 'sales',
      menuKey: 'sales.history',
      roles: ['admin', 'manager', 'cashier', 'sales_agent', 'affiliate']
    },
    {
      text: 'Đơn hàng',
      icon: <InvoiceIcon />,
      path: '/orders',
      group: 'sales',
      menuKey: 'sales.orders',
      roles: ['admin', 'manager', 'cashier', 'sales_agent', 'affiliate']
    },
    {
      text: 'Trả hàng',
      icon: <HistoryIcon />,
      path: '/returns',
      group: 'sales',
      menuKey: 'sales.returns',
      roles: ['admin', 'manager', 'cashier', 'sales_agent', 'affiliate']
    },

    // 📦 KHO HÀNG (Products, Stock, Suppliers) - Different access levels
    {
      text: 'Sản phẩm',
      icon: <InventoryIcon />,
      path: '/products',
      group: 'inventory',
      groupLabel: '📦 KHO HÀNG',
      menuKey: 'inventory.products',
      roles: ['admin', 'manager', 'inventory', 'cashier', 'sales_agent', 'affiliate']  // All can view, but edit permissions differ
    },
    {
      text: 'Danh mục',
      icon: <CategoryIcon />,
      path: '/categories',
      group: 'inventory',
      menuKey: 'inventory.categories',
      roles: ['admin', 'manager', 'inventory', 'cashier']  // Sales agents and affiliates cannot access categories
    },
    {
      text: 'Nhập kho',
      icon: <InventoryIcon />,
      path: '/inventory/stock-in',
      group: 'inventory',
      menuKey: 'inventory.stock',
      roles: ['admin', 'manager', 'inventory']  // Only admin, manager, inventory
    },
    {
      text: 'Nhà cung cấp',
      icon: <BusinessIcon />,
      path: '/suppliers',
      group: 'inventory',
      menuKey: 'inventory.suppliers',
      roles: ['admin', 'manager']  // Only admin and manager
    },
    {
      text: 'Serial Numbers',
      icon: <QrCodeIcon />,
      path: '/serial-numbers',
      group: 'inventory',
      menuKey: 'inventory.serial',
      roles: ['admin', 'manager', 'inventory']  // Inventory staff and above
    },
    {
      text: 'PC Builder',
      icon: <ComputerIcon />,
      path: '/pc-builder',
      group: 'inventory',
      menuKey: 'inventory.pcbuilder',
      roles: ['admin', 'manager', 'cashier', 'inventory']  // Sales agents and affiliates cannot access PC Builder
    },
    {
      text: 'Bảo hành',
      icon: <SecurityIcon />,
      path: '/warranty',
      group: 'inventory',
      menuKey: 'inventory.warranty',
      roles: ['admin', 'manager', 'inventory', 'cashier', 'sales_agent', 'affiliate']  // Sales agents and affiliates can access warranty
    },

    // 👥 KHÁCH HÀNG (Database, History) - Sales agents, affiliates, cashiers and above
    {
      text: 'Khách hàng',
      icon: <CustomerIcon />,
      path: '/customers',
      group: 'customers',
      groupLabel: '👥 KHÁCH HÀNG',
      menuKey: 'customers',
      roles: ['admin', 'manager', 'cashier', 'sales_agent', 'affiliate']
    },

    // 📈 BÁO CÁO (Sales, Finance, Analytics) - Manager and above
    {
      text: 'Tổng quan',
      icon: <ReportIcon />,
      path: '/reports',
      group: 'reports',
      groupLabel: '📈 BÁO CÁO',
      menuKey: 'reports.overview',
      roles: ['admin', 'manager']
    },
    {
      text: 'Doanh thu',
      icon: <StatisticsIcon />,
      menuKey: 'reports.revenue',
      path: '/reports/revenue',
      group: 'reports',
      roles: ['admin', 'manager']
    },
    {
      text: 'Tài chính',
      icon: <RevenueIcon />,
      path: '/finance',
      group: 'reports',
      menuKey: 'reports.finance',
      roles: ['admin', 'manager']
    },
  ];

  // ⚙️ QUẢN TRỊ (Users, Settings) - Admin and Manager
  const adminItems = [
    {
      text: 'Nhân viên',
      icon: <PeopleIcon />,
      path: '/employees',
      group: 'admin',
      groupLabel: '⚙️ QUẢN TRỊ',
      menuKey: 'administration.employees',
      roles: ['admin', 'manager']
    },
    {
      text: 'Cài đặt',
      icon: <SettingsIcon />,
      path: '/settings',
      group: 'admin',
      menuKey: 'administration.settings',
      roles: ['admin']
    },
  ];

  // Get background color for menu groups - Updated for 6 main groups
  const getGroupBackgroundColor = (group: string) => {
    switch (group) {
      case 'dashboard':
        return alpha(theme.palette.primary.main, 0.08); // Tech Blue
      case 'sales':
        return alpha(theme.palette.success.main, 0.08); // Emerald Green
      case 'inventory':
        return alpha(theme.palette.info.main, 0.08); // Cyan Blue
      case 'customers':
        return alpha(theme.palette.secondary.main, 0.08); // Vietnamese Gold
      case 'reports':
        return alpha(theme.palette.warning.main, 0.08); // Amber Orange
      case 'admin':
        return alpha(theme.palette.error.main, 0.08); // Red for admin
      default:
        return 'transparent';
    }
  };

  // Handle menu open/close
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  // Handle notifications
  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationEl(null);
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/login');
    handleMenuClose();
  };

  // Handle navigation
  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  // Get the current page title
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path === '/') return 'Dashboard';
    if (path === '/sales/new') return 'Điểm bán hàng';
    if (path.startsWith('/sales/')) return 'Chi tiết bán hàng';
    if (path === '/sales') return 'Lịch sử bán hàng';
    if (path === '/products') return 'Quản lý sản phẩm';
    if (path.startsWith('/products/')) return 'Chi tiết sản phẩm';
    if (path === '/categories') return 'Danh mục';
    if (path.startsWith('/inventory/')) return 'Quản lý kho';
    if (path === '/customers') return 'Khách hàng';
    if (path === '/reports') return 'Báo cáo';
    if (path.startsWith('/reports/')) return 'Báo cáo & Thống kê';
    if (path === '/users') return 'Quản lý người dùng';
    if (path === '/employees') return 'Nhân viên & Hoa hồng';
    if (path === '/settings') return 'Cài đặt';
    if (path === '/finance') return 'Tài chính';
    if (path === '/accounts') return 'Công nợ';
    if (path === '/calendar') return 'Lịch & Lịch hẹn';
    if (path === '/stores') return 'Quản lý chi nhánh';
    if (path === '/warranty') return 'Quản lý bảo hành';

    return 'SmartPOS';
  };

  // Determine if a navigation item is active
  const isActive = (path: string, exact: boolean = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Modern App bar with Glass Morphism */}
      <ModernAppBar position="fixed">
        <Toolbar sx={{ minHeight: 70 }}>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            edge="start"
            onClick={() => {
              if (isMobile) {
                setDrawerOpen(!drawerOpen);
              } else {
                // On desktop, toggle between open and completely hidden
                if (drawerOpen) {
                  setDrawerOpen(false);
                  setDrawerCollapsed(true);
                } else {
                  setDrawerOpen(true);
                  setDrawerCollapsed(false);
                }
              }
            }}
            sx={{
              mr: 2,
              minWidth: 44, // Touch target ≥44px
              minHeight: 44, // Touch target ≥44px
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'rotate(180deg)',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
              }
            }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              mr: 3,
              background: gradients.primary,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 800,
              fontSize: '1.5rem',
            }}
          >
            SmartPOS
          </Typography>
          
          {/* Modern Search with Glass Effect */}
          <SearchContainer>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Tìm kiếm sản phẩm, đơn hàng..."
              inputProps={{ 'aria-label': 'search' }}
            />
          </SearchContainer>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Modern Quick Access POS Button */}
          <Button
            variant="contained"
            sx={{
              display: { xs: 'none', sm: 'flex' },
              mr: 2,
              background: gradients.success,
              borderRadius: '12px',
              padding: '10px 20px',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: shadows.colored.primary,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `${shadows.colored.primary}, 0 20px 25px -5px rgba(34, 197, 94, 0.3)`,
              },
            }}
            startIcon={<ShoppingCartIcon />}
            onClick={() => navigate('/sales/new')}
          >
            Bán hàng
          </Button>

          {/* Realtime Status Indicator */}
          <RealtimeIndicator />

          {/* Modern Notifications with Realtime */}
          <LiveNotificationBadge />

          <Tooltip title="Thông báo">
            <IconButton
              size="large"
              color="inherit"
              onClick={handleNotificationOpen}
              sx={{
                mr: 1,
                minWidth: 44, // Touch target ≥44px
                minHeight: 44, // Touch target ≥44px
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  transform: 'scale(1.1)',
                }
              }}
            >
              <NotificationBadge badgeContent={3} color="error">
                <NotificationIcon />
              </NotificationBadge>
            </IconButton>
          </Tooltip>
          <Menu
            id="notification-menu"
            anchorEl={notificationEl}
            keepMounted
            open={Boolean(notificationEl)}
            onClose={handleNotificationClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              sx: { width: 320, maxHeight: 400 }
            }}
          >
            <MenuItem>
              <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle2">Sản phẩm sắp hết hàng</Typography>
                <Typography variant="body2" color="text.secondary">
                  5 sản phẩm đang dưới ngưỡng tồn kho
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem>
              <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle2">Đơn hàng mới #1234</Typography>
                <Typography variant="body2" color="text.secondary">
                  Vừa nhận đơn hàng trực tuyến mới
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem>
              <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle2">Nhắc nhở</Typography>
                <Typography variant="body2" color="text.secondary">
                  Cần đồng bộ dữ liệu kho hàng
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => navigate('/notifications')}>
              <Typography color="primary" sx={{ width: '100%', textAlign: 'center' }}>
                Xem tất cả thông báo
              </Typography>
            </MenuItem>
          </Menu>
          
          {/* Modern User Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title={`${user?.fullName || 'User'}`}>
              <IconButton
                size="large"
                onClick={handleMenu}
                color="inherit"
                sx={{ 
                  ml: 1,
                  minWidth: 44, // Touch target ≥44px
                  minHeight: 44, // Touch target ≥44px
                }}
              >
                <UserAvatar>
                  {user?.username?.charAt(0).toUpperCase() || 'A'}
                </UserAvatar>
              </IconButton>
            </Tooltip>
            
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              keepMounted
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                elevation: 2,
                sx: { width: 220 }
              }}
            >
              <MenuItem sx={{ pointerEvents: 'none' }}>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="subtitle2">
                    {user?.fullName || user?.username}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
                  </Typography>
                </Box>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
                <ListItemIcon>
                  <AccountIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Hồ sơ cá nhân</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Cài đặt</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Đăng xuất</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </ModernAppBar>
      
      {/* Modern Navigation Drawer */}
      <ModernDrawer
        variant={isMobile ? "temporary" : "persistent"}
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          '& .MuiDrawer-paper': {
            // Additional mobile-specific styles
            ...(isMobile && {
              zIndex: (theme) => theme.zIndex.drawer, // Use default z-index on mobile
            }),
          },
        }}
      >
        <Toolbar />
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between', 
            height: '100%',
            overflowX: 'hidden'
          }}
        >
          <Box sx={{ overflowY: 'auto', py: 1 }}>
            {/* 🎯 Organized Navigation with Group Labels and Role-based Access */}
            <List component="nav" disablePadding>
              {(() => {
                let currentGroup = '';
                return navItems
                  .filter(item => !item.roles || hasPermission(item.roles, item.menuKey)) // Filter by permissions
                  .map((item) => {
                    const showGroupLabel = item.groupLabel && item.group !== currentGroup;
                    if (showGroupLabel) {
                      currentGroup = item.group;
                    }

                    return (
                      <Box key={item.text}>
                      {/* Group Label */}
                      {showGroupLabel && (
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            px: 2,
                            py: 1,
                            mt: 2,
                            mb: 1,
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            color: theme.palette.text.secondary,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                          }}
                        >
                          {item.groupLabel}
                        </Typography>
                      )}
                      
                      {/* Navigation Item */}
                      <ModernListItem
                        disablePadding
                        className={isActive(item.path, item.exact) ? 'active' : ''}
                        sx={{
                          backgroundColor: getGroupBackgroundColor(item.group),
                          borderRadius: '8px',
                          margin: '2px 8px',
                          '&:hover': {
                            backgroundColor: alpha(
                              theme.palette[
                                item.group === 'dashboard' ? 'primary' :
                                item.group === 'sales' ? 'success' :
                                item.group === 'inventory' ? 'info' :
                                item.group === 'customers' ? 'secondary' :
                                item.group === 'reports' ? 'warning' : 'primary'
                              ].main, 0.12
                            ),
                          }
                        }}
                      >
                        <ListItemButton
                          selected={isActive(item.path, item.exact)}
                          onClick={() => handleNavigation(item.path)}
                          data-testid={`nav-${item.text.toLowerCase().replace(/\s+/g, '-')}`}
                          sx={{
                            pl: 2,
                            borderRadius: '8px',
                            minHeight: 44, // Touch target ≥44px
                            '&.Mui-selected': {
                              backgroundColor: alpha(
                                theme.palette[
                                  item.group === 'dashboard' ? 'primary' :
                                  item.group === 'sales' ? 'success' :
                                  item.group === 'inventory' ? 'info' :
                                  item.group === 'customers' ? 'secondary' :
                                  item.group === 'reports' ? 'warning' : 'primary'
                                ].main, 0.15
                              ),
                            }
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              color: isActive(item.path, item.exact)
                                ? theme.palette[
                                    item.group === 'dashboard' ? 'primary' :
                                    item.group === 'sales' ? 'success' :
                                    item.group === 'inventory' ? 'info' :
                                    item.group === 'customers' ? 'secondary' :
                                    item.group === 'reports' ? 'warning' : 'primary'
                                  ].main
                                : theme.palette.text.secondary,
                              minWidth: 44, // Touch target ≥44px
                            }}
                          >
                            {item.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={item.text}
                            primaryTypographyProps={{
                              fontWeight: isActive(item.path, item.exact) ? 600 : 400,
                              fontSize: '0.875rem',
                              color: isActive(item.path, item.exact)
                                ? theme.palette[
                                    item.group === 'dashboard' ? 'primary' :
                                    item.group === 'sales' ? 'success' :
                                    item.group === 'inventory' ? 'info' :
                                    item.group === 'customers' ? 'secondary' :
                                    item.group === 'reports' ? 'warning' : 'primary'
                                  ].main
                                : theme.palette.text.primary
                            }}
                          />
                        </ListItemButton>
                      </ModernListItem>
                    </Box>
                  );
                });
              })()}
            </List>
            
            <Divider sx={{ my: 2 }} />
            
            {/* ⚙️ Admin Items with Group Label and Role-based Access */}
            {adminItems.filter(item => !item.roles || hasPermission(item.roles, item.menuKey)).length > 0 && (
              <List>
                {(() => {
                  let currentGroup = '';
                  return adminItems
                    .filter(item => !item.roles || hasPermission(item.roles, item.menuKey)) // Filter by permissions
                    .map((item) => {
                      const showGroupLabel = item.groupLabel && item.group !== currentGroup;
                      if (showGroupLabel) {
                        currentGroup = item.group;
                      }
                    
                    return (
                      <Box key={item.text}>
                        {/* Group Label */}
                        {showGroupLabel && (
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              px: 2,
                              py: 1,
                              mt: 2,
                              mb: 1,
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              color: theme.palette.text.secondary,
                              textTransform: 'uppercase',
                              letterSpacing: '0.1em',
                            }}
                          >
                            {item.groupLabel}
                          </Typography>
                        )}
                        
                        {/* Admin Item */}
                        <ModernListItem
                          disablePadding
                          sx={{
                            backgroundColor: getGroupBackgroundColor(item.group),
                            borderRadius: '8px',
                            margin: '2px 8px',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.error.main, 0.12),
                            }
                          }}
                        >
                          <ListItemButton
                            selected={isActive(item.path)}
                            onClick={() => handleNavigation(item.path)}
                            data-testid={`nav-${item.text.toLowerCase().replace(/\s+/g, '-')}`}
                            sx={{
                              pl: 2,
                              borderRadius: '8px',
                              minHeight: 44, // Touch target ≥44px
                              '&.Mui-selected': {
                                backgroundColor: alpha(theme.palette.error.main, 0.15),
                              }
                            }}
                          >
                            <ListItemIcon
                              sx={{
                                color: isActive(item.path)
                                  ? theme.palette.error.main
                                  : theme.palette.text.secondary,
                                minWidth: 44, // Touch target ≥44px
                              }}
                            >
                              {item.icon}
                            </ListItemIcon>
                            <ListItemText
                              primary={item.text}
                              primaryTypographyProps={{
                                fontWeight: isActive(item.path) ? 600 : 400,
                                fontSize: '0.875rem',
                                color: isActive(item.path)
                                  ? theme.palette.error.main
                                  : theme.palette.text.primary
                              }}
                            />
                          </ListItemButton>
                        </ModernListItem>
                      </Box>
                    );
                  });
                })()}
              </List>
            )}
          </Box>
          
          {/* Drawer Footer - Close Button on Mobile */}
          {isMobile && (
            <Box sx={{ p: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setDrawerOpen(false)}
                startIcon={theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                sx={{
                  minHeight: 44, // Touch target ≥44px
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Đóng menu
              </Button>
            </Box>
          )}
        </Box>
      </ModernDrawer>
      
      {/* Modern Main Content with Background */}
      <MainContent
        component="main"
        sx={{
          width: {
            xs: '100%',
            md: drawerOpen ? `calc(100% - ${drawerWidth}px)` : '100%'
          },
          marginLeft: {
            xs: 0,
            md: drawerOpen ? `${drawerWidth}px` : 0 // Fix: Add proper margin when drawer is open
          },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          // Ensure proper positioning without z-index conflicts
          position: 'relative',
        }}
      >
        <Toolbar />

        {/* Modern Page Title */}
        <Fade in timeout={800}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              mb: 4,
              fontWeight: 700,
              background: gradients.primary,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {getPageTitle()}
          </Typography>
        </Fade>

        {/* Modern Page Content with Animation */}
        <Fade in timeout={1000}>
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Outlet />
          </Box>
        </Fade>
      </MainContent>
    </Box>
  );
};

export default Layout; 