import React from 'react'
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
import { cn } from '../../lib/utils'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'

interface HeaderProps {
  onMenuToggle: () => void
  title?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
}

export const Header: React.FC<HeaderProps> = ({
  onMenuToggle,
  title = "Dashboard",
  breadcrumbs = []
}) => {
  const isOnline = useOnlineStatus()
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

  // Mock notifications
  const notifications = [
    { id: 1, title: 'Đơn hàng mới', message: 'Có 3 đơn hàng mới cần xử lý', time: '2 phút trước', type: 'order' },
    { id: 2, title: 'Sản phẩm sắp hết', message: 'iPhone 15 Pro chỉ còn 2 chiếc', time: '15 phút trước', type: 'warning' },
    { id: 3, title: 'Báo cáo tuần', message: 'Báo cáo doanh thu tuần đã sẵn sàng', time: '1 giờ trước', type: 'report' }
  ]

  return (
    <header className="sticky top-0 z-30 w-full border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-white/90 via-gray-50/90 to-white/90 dark:from-gray-900/90 dark:via-gray-800/90 dark:to-gray-900/90 backdrop-blur-xl shadow-lg shadow-gray-900/5">
      <div className="flex items-center justify-between h-18 px-4 lg:px-8">
        {/* Enhanced Left Section */}
        <div className="flex items-center space-x-6">

          {/* Enhanced Title & Breadcrumbs */}
          <div className="flex flex-col">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent"
            >
              {title}
            </motion.h1>
            {breadcrumbs.length > 0 && (
              <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <span>/</span>}
                    <span className={cn(
                      index === breadcrumbs.length - 1 
                        ? "text-gray-900 dark:text-white font-medium" 
                        : "hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
                    )}>
                      {crumb.label}
                    </span>
                  </React.Fragment>
                ))}
              </nav>
            )}
          </div>
        </div>

        {/* Enhanced Center Section - Search */}
        <div className="flex flex-1 max-w-lg mx-8">
          <motion.div
            className="relative w-full"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              data-testid="header-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm sản phẩm, đơn hàng, khách hàng..."
              className="w-full pl-12 pr-4 py-3 text-sm bg-white/70 dark:bg-gray-800/70 border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm shadow-lg hover:shadow-xl placeholder-gray-400 dark:placeholder-gray-500"
            />
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                onClick={() => setSearchQuery('')}
              >
                <span className="text-xs">×</span>
              </motion.button>
            )}
          </motion.div>
        </div>

        {/* Enhanced Right Section */}
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              "hidden lg:flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold shadow-lg backdrop-blur-sm",
              isOnline
                ? "bg-green-100/80 text-green-800 dark:bg-green-900/50 dark:text-green-200 border border-green-200 dark:border-green-800"
                : "bg-red-100/80 text-red-800 dark:bg-red-900/50 dark:text-red-200 border border-red-200 dark:border-red-800"
            )}
          >
            {isOnline ? (
              <Wifi className="w-3 h-3" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            <span className="hidden sm:inline">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </motion.div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Enhanced Notifications */}
          <div className="relative" ref={notificationsRef}>
            <motion.button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              <motion.span
                className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center text-xs font-bold text-white"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                {notifications.length}
              </motion.span>
            </motion.button>

            {/* Enhanced Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-96 bg-white/95 dark:bg-gray-800/95 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-600/50 z-50 backdrop-blur-xl"
                >
                  <div className="p-6 border-b border-gray-200/50 dark:border-gray-600/50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Thông báo
                      </h3>
                      <span className="px-3 py-1 text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                        {notifications.length} mới
                      </span>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start space-x-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            notification.type === 'order' && "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
                            notification.type === 'warning' && "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400",
                            notification.type === 'report' && "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                          )}>
                            {notification.type === 'order' && <ShoppingCart className="w-5 h-5" />}
                            {notification.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                            {notification.type === 'report' && <FileText className="w-5 h-5" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-gray-200/50 dark:border-gray-600/50">
                    <button className="w-full text-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                      Xem tất cả thông báo
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Enhanced User Menu */}
          <div className="relative" ref={userMenuRef}>
            <motion.button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-3 rounded-xl bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-sm"
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
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  Admin User
                </p>
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    admin@pos.com
                  </p>
                  <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full">
                    PRO
                  </span>
                </div>
              </div>
              <motion.div
                animate={{ rotate: showUserMenu ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </motion.div>
            </motion.button>

            {/* Enhanced User Dropdown */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-72 bg-white/95 dark:bg-gray-800/95 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-600/50 z-50 backdrop-blur-xl"
                >
                  {/* User Info Header */}
                  <div className="p-6 border-b border-gray-200/50 dark:border-gray-600/50">
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
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          Admin User
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          admin@pos.com
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full">
                            PRO
                          </span>
                          <span className="px-2 py-0.5 text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                            Online
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-3">
                    <motion.button
                      className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 group"
                      whileHover={{ x: 4 }}
                    >
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                        <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="font-medium">Hồ sơ cá nhân</span>
                    </motion.button>

                    <motion.button
                      className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 group"
                      whileHover={{ x: 4 }}
                    >
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                        <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="font-medium">Cài đặt</span>
                    </motion.button>

                    <motion.button
                      className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 group"
                      whileHover={{ x: 4 }}
                    >
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
                        <HelpCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="font-medium">Trợ giúp</span>
                    </motion.button>

                    <hr className="my-3 border-gray-200/50 dark:border-gray-600/50" />

                    <motion.button
                      className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 group"
                      whileHover={{ x: 4 }}
                    >
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-800 transition-colors">
                        <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
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
