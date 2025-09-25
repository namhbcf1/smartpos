import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Bell,
  User,
  Menu,
  Wifi,
  WifiOff,
  Settings,
  LogOut,
  ChevronDown,
  Crown,
  Star,
  Shield,
  Zap,
  Activity,
  Calendar,
  MessageSquare,
  HelpCircle,
  Sparkles,
  Globe,
  Clock,
  ShoppingCart,
  AlertTriangle,
  FileText
} from 'lucide-react'
import { ThemeToggle } from '../theme/ThemeProvider'
import NotificationCenter from '../NotificationCenter'
// Realtime notification center temporarily disabled for stability
// import RealtimeNotificationCenter from '../realtime/RealtimeNotificationCenter'
import { cn } from '../../lib/utils'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  title?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
  onMenuToggle: () => void
}

export const Header: React.FC<HeaderProps> = ({
  title = "Dashboard",
  breadcrumbs = [],
  onMenuToggle
}) => {
  const isOnline = useOnlineStatus()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = React.useState(false)
  const [showNotifications, setShowNotifications] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  // Refs for click outside detection
  const userMenuRef = React.useRef<HTMLDivElement>(null)
  const notificationsRef = React.useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Close dropdowns on escape key
  React.useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false)
        setShowNotifications(false)
      }
    }

    document.addEventListener('keydown', handleEscapeKey)
    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [])

  // Real notifications from API
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Load notifications from real API
  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);
      // NO MOCK DATA - Only real API calls
      // If API endpoint doesn't exist, just clear notifications
      setNotifications([]);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Menu actions
  const handleProfileClick = () => {
    navigate('/users/profile');
    setShowUserMenu(false);
  };

  const handleSettingsClick = () => {
    navigate('/settings');
    setShowUserMenu(false);
  };

  const handleHelpClick = () => {
    window.open('/help', '_blank');
    setShowUserMenu(false);
  };

  const handleLogoutClick = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
    setShowUserMenu(false);
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/30 bg-white/80 backdrop-blur-2xl shadow-xl shadow-slate-900/5">
      <div className="flex items-center justify-between h-20 px-6 lg:px-8">
        {/* Enhanced Left Section */}
        <div className="flex items-center space-x-6">
          {/* Modern Menu Toggle Button */}
          <motion.button
            onClick={onMenuToggle}
            className="relative p-3 rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white transition-all duration-300 shadow-lg hover:shadow-xl group border border-slate-600/50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Toggle Menu (Ctrl+B)"
          >
            <Menu className="w-5 h-5" />
            {/* Pulse indicator */}
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop"
              }}
            />
            {/* Tooltip on hover */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
              Menu (Ctrl+B)
            </div>
          </motion.button>

          {/* Enhanced Title & Breadcrumbs */}
          <div className="flex flex-col">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-700 to-slate-800   bg-clip-text text-transparent"
            >
              {title}
            </motion.h1>
            {breadcrumbs.length > 0 && (
              <nav className="flex items-center space-x-2 text-sm text-slate-500">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <span className="text-slate-300">›</span>}
                    <motion.span
                      className={cn(
                        "transition-all duration-200",
                        index === breadcrumbs.length - 1
                          ? "text-slate-900  font-semibold"
                          : "hover:text-blue-600  cursor-pointer"
                      )}
                      whileHover={{ scale: 1.05 }}
                    >
                      {crumb.label}
                    </motion.span>
                  </React.Fragment>
                ))}
              </nav>
            )}
          </div>
        </div>

        {/* Enhanced Center Section - Search */}
        <div className="flex flex-1 max-w-2xl mx-8">
          <motion.div
            className="relative w-full"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              data-testid="header-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm sản phẩm, đơn hàng, khách hàng..."
              className="w-full pl-12 pr-12 py-4 text-sm bg-white/70  border border-slate-200/50  rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-lg shadow-lg hover:shadow-xl focus:shadow-2xl placeholder-slate-400 hover:bg-white/90"
            />
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-7 h-7 bg-slate-200  rounded-full flex items-center justify-center hover:bg-slate-300 transition-all duration-200 shadow-md" onClick={() => setSearchQuery('')}
              >
                <span className="text-sm font-bold text-slate-600">×</span>
              </motion.button>
            )}
          </motion.div>
        </div>

        {/* Enhanced Right Section */}
        <div className="flex items-center space-x-3">
          {/* Enhanced Connection Status */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={cn(
              "hidden lg:flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold shadow-lg backdrop-blur-lg border",
              isOnline
                ? "bg-emerald-50/80 text-emerald-700 border-emerald-200/50"
                : "bg-red-50/80 text-red-700 border-red-200/50"
            )}
          >
            <motion.div
              animate={{ rotate: isOnline ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              {isOnline ? (
                <Wifi className="w-3 h-3" />
              ) : (
                <WifiOff className="w-3 h-3" />
              )}
            </motion.div>
            <span className="hidden sm:inline">
              {isOnline ? 'Online' : 'Offline'}
            </span>
            {isOnline && (
              <motion.div
                className="w-1.5 h-1.5 bg-emerald-400 rounded-full"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.div>

          {/* Enhanced Notifications */}
          <div className="relative" ref={notificationsRef}>
            <motion.button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-3 rounded-xl bg-white/60  hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-lg border border-slate-200/30"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {notifications.length > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <span className="text-xs font-bold text-white">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                </motion.div>
              )}
            </motion.button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-80 bg-white/95  rounded-2xl shadow-2xl border border-slate-200/50 z-50 backdrop-blur-xl"
                >
                  <div className="p-4 border-b border-slate-200/50">
                    <h3 className="text-lg font-bold text-slate-900">Thông báo</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification, index) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 border-b border-slate-100  last:border-b-0 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start space-x-3">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                              notification.type === 'order' ? 'bg-blue-100' :
                              notification.type === 'warning' ? 'bg-yellow-100' :
                              'bg-green-100'
                            )}>
                              {notification.type === 'order' ? <ShoppingCart className="w-4 h-4 text-blue-600" /> :
                               notification.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-yellow-600" /> :
                               <FileText className="w-4 h-4 text-green-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {notification.title}
                              </p>
                              <p className="text-xs text-slate-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-slate-500 mt-2">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">Không có thông báo mới</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Realtime Notification Center (WS/SSE) - Temporarily disabled for stability */}
          {/* <SafeRealtimeNotificationCenter /> */}

          {/* Enhanced User Menu */}
          <div className="relative" ref={userMenuRef}>
            <motion.button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-3 rounded-xl bg-white/60  hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-lg border border-slate-200/30"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <Crown className="w-2 h-2 text-white" />
                </div>
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-bold text-slate-900">
                  Admin User
                </p>
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-slate-500">
                    admin@pos.com
                  </p>
                  <motion.span
                    className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full shadow-lg"
                    animate={{ opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    PRO
                  </motion.span>
                </div>
              </div>
              <motion.div
                animate={{ rotate: showUserMenu ? 180 : 0 }}
                transition={{ duration: 0.3, type: "spring" }}
              >
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </motion.div>
            </motion.button>

            {/* Enhanced User Dropdown */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-72 bg-white/95  rounded-2xl shadow-2xl border border-gray-200/50 z-50 backdrop-blur-xl"
                >
                  {/* User Info Header */}
                  <div className="p-6 border-b border-gray-200/50">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                          <Crown className="w-2 h-2 text-white" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          Admin User
                        </h3>
                        <p className="text-sm text-gray-500">
                          admin@pos.com
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full">
                            PRO
                          </span>
                          <span className="px-2 py-0.5 text-xs font-bold bg-green-100 text-green-800  rounded-full">
                            Online
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-3">
                    <motion.button
                      onClick={handleProfileClick}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-700  hover:bg-gray-100 rounded-xl transition-all duration-200 group"
                      whileHover={{ x: 4 }}
                    >
                      <div className="w-8 h-8 bg-blue-100  rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium">Hồ sơ cá nhân</span>
                    </motion.button>

                    <motion.button
                      onClick={handleSettingsClick}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-700  hover:bg-gray-100 rounded-xl transition-all duration-200 group"
                      whileHover={{ x: 4 }}
                    >
                      <div className="w-8 h-8 bg-purple-100  rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                        <Settings className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="font-medium">Cài đặt</span>
                    </motion.button>

                    <motion.button
                      onClick={handleHelpClick}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-700  hover:bg-gray-100 rounded-xl transition-all duration-200 group"
                      whileHover={{ x: 4 }}
                    >
                      <div className="w-8 h-8 bg-green-100  rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <HelpCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="font-medium">Trợ giúp</span>
                    </motion.button>

                    <hr className="my-3 border-gray-200/50" />

                    <motion.button
                      onClick={handleLogoutClick}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-red-600  hover:bg-red-50 rounded-xl transition-all duration-200 group"
                      whileHover={{ x: 4 }}
                    >
                      <div className="w-8 h-8 bg-red-100  rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                        <LogOut className="w-4 h-4 text-red-600" />
                      </div>
                      <span className="font-medium">Đăng xuất</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}
