import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  ShoppingCart,
  Package,
  BarChart3,
  Users,
  Settings,
  Menu,
  X,
  ChevronDown,
  Store,
  Receipt,
  Package2,
  TrendingUp,
  Zap,
  Star,
  Crown,
  Sparkles,
  Activity,
  Target,
  Award,
  Layers,
  Grid,
  PieChart,
  FileText,
  Calendar,
  Bell,
  Shield
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useLocation, useNavigate } from 'react-router-dom'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  badge?: string
  badgeColor?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'pink'
  gradient?: string
  children?: NavItem[]
  isNew?: boolean
  isPro?: boolean
}

const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Tổng quan',
    icon: <Grid className="w-5 h-5" />,
    href: '/dashboard',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'pos',
    label: 'POS Bán hàng',
    icon: <Zap className="w-5 h-5" />,
    href: '/pos',
    badge: 'Hot',
    badgeColor: 'red',
    gradient: 'from-green-500 to-emerald-500',
    isNew: true
  },
  {
    id: 'products',
    label: 'Quản lý sản phẩm',
    icon: <Package className="w-5 h-5" />,
    href: '/products',
    gradient: 'from-purple-500 to-pink-500',
    children: [
      {
        id: 'products-list',
        label: 'Danh sách sản phẩm',
        icon: <Layers className="w-4 h-4" />,
        href: '/products'
      },
      {
        id: 'products-categories',
        label: 'Danh mục',
        icon: <Grid className="w-4 h-4" />,
        href: '/products/categories'
      },
      {
        id: 'products-inventory',
        label: 'Tồn kho',
        icon: <Package2 className="w-4 h-4" />,
        href: '/inventory'
      }
    ]
  },
  {
    id: 'sales',
    label: 'Lịch sử bán hàng',
    icon: <Receipt className="w-5 h-5" />,
    href: '/sales',
    gradient: 'from-orange-500 to-red-500',
    children: [
      {
        id: 'sales-list',
        label: 'Danh sách đơn hàng',
        icon: <FileText className="w-4 h-4" />,
        href: '/sales'
      },
      {
        id: 'sales-analytics',
        label: 'Phân tích bán hàng',
        icon: <TrendingUp className="w-4 h-4" />,
        href: '/sales/analytics'
      }
    ]
  },
  {
    id: 'reports',
    label: 'Báo cáo & Thống kê',
    icon: <PieChart className="w-5 h-5" />,
    href: '/reports',
    gradient: 'from-indigo-500 to-purple-500',
    isPro: true
  },
  {
    id: 'customers',
    label: 'Khách hàng',
    icon: <Users className="w-5 h-5" />,
    href: '/customers',
    gradient: 'from-teal-500 to-cyan-500'
  },
  {
    id: 'analytics',
    label: 'Phân tích kinh doanh',
    icon: <Activity className="w-5 h-5" />,
    href: '/analytics',
    gradient: 'from-rose-500 to-pink-500',
    badge: 'Pro',
    badgeColor: 'purple',
    isPro: true
  },
  {
    id: 'settings',
    label: 'Cài đặt hệ thống',
    icon: <Settings className="w-5 h-5" />,
    href: '/settings',
    gradient: 'from-gray-500 to-slate-500'
  }
]

const NavItemComponent: React.FC<{
  item: NavItem
  isCollapsed: boolean
  level?: number
}> = ({ item, isCollapsed, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const hasChildren = item.children && item.children.length > 0
  const location = useLocation()
  const navigate = useNavigate()
  const isActive = location.pathname === item.href ||
    (hasChildren && item.children?.some(child => location.pathname === child.href))

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded)
    } else {
      console.log('🔗 Navigating to:', item.href)
      navigate(item.href)
    }
  }

  const getBadgeColors = (color: string = 'blue') => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="w-full">
      <motion.div
        className={cn(
          "relative flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group cursor-pointer",
          "hover:shadow-lg hover:shadow-blue-500/25",
          level > 0 && "ml-6 pl-4",
          isActive
            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
            : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 dark:hover:from-gray-800 dark:hover:to-blue-900/20"
        )}
        whileHover={{
          x: level === 0 ? 4 : 2,
          scale: 1.02
        }}
        whileTap={{ scale: 0.98 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={handleClick}
      >
        {/* Gradient background for active state */}
        {isActive && (
          <motion.div
            layoutId="activeBackground"
            className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl"
            initial={false}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}

        {/* Hover glow effect */}
        <AnimatePresence>
          {isHovered && !isActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-xl"
            />
          )}
        </AnimatePresence>

        <div className="relative flex items-center space-x-3 flex-1 z-10">
          <div className={cn(
            "flex-shrink-0 transition-all duration-300",
            isActive
              ? "text-white"
              : "text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
          )}>
            {item.icon}
          </div>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex items-center space-x-2 flex-1"
              >
                <span className={cn(
                  "truncate font-medium transition-colors",
                  isActive ? "text-white" : ""
                )}>
                  {item.label}
                </span>

                {/* Badges */}
                <div className="flex items-center space-x-1">
                  {item.badge && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        "px-2 py-0.5 text-xs font-bold rounded-full",
                        getBadgeColors(item.badgeColor)
                      )}
                    >
                      {item.badge}
                    </motion.span>
                  )}

                  {item.isNew && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="px-1.5 py-0.5 text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full"
                    >
                      NEW
                    </motion.span>
                  )}

                  {item.isPro && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center space-x-1 px-1.5 py-0.5 text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full"
                    >
                      <Crown className="w-2.5 h-2.5" />
                      <span>PRO</span>
                    </motion.span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {hasChildren && !isCollapsed && (
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "cursor-pointer transition-colors z-10 p-1 rounded-md hover:bg-white/20",
              isActive
                ? "text-white"
                : "text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            )}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {hasChildren && isExpanded && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1 space-y-1"
          >
            {item.children?.map((child) => (
              <NavItemComponent
                key={child.id}
                item={child}
                isCollapsed={isCollapsed}
                level={level + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Enhanced Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : -320,
          width: isCollapsed ? 80 : 320
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "fixed left-0 top-0 z-50 h-full",
          "bg-gradient-to-b from-white via-gray-50 to-gray-100",
          "dark:from-gray-900 dark:via-gray-900 dark:to-gray-800",
          "border-r border-gray-200/50 dark:border-gray-700/50",
          "shadow-2xl shadow-gray-900/10 dark:shadow-black/20",
          "backdrop-blur-xl",
          "lg:relative lg:translate-x-0"
        )}
      >
        {/* Enhanced Header */}
        <div className="relative p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-600/5 dark:from-blue-500/10 dark:to-purple-600/10" />

          <div className="relative flex items-center justify-between">
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center space-x-4"
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                      <Store className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-2 h-2 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                      POS System
                    </h1>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Professional</span>
                      <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full">
                        PRO
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Control Buttons */}
            <div className="flex items-center space-x-2">
              <motion.button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex items-center justify-center w-10 h-10 rounded-xl bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </motion.button>

              <motion.button
                onClick={onToggle}
                className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Enhanced Navigation */}
        <nav className="flex-1 p-6 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ staggerChildren: 0.1 }}
            className="space-y-2"
          >
            {navigationItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <NavItemComponent
                  item={item}
                  isCollapsed={isCollapsed}
                />
              </motion.div>
            ))}
          </motion.div>
        </nav>

        {/* Enhanced Footer */}
        <div className="relative p-6 border-t border-gray-200/50 dark:border-gray-700/50">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-50/50 to-blue-50/50 dark:from-gray-800/50 dark:to-blue-900/20" />

          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="relative space-y-3"
              >
                {/* Status Indicator */}
                <div className="flex items-center justify-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">
                    Hệ thống hoạt động tốt
                  </span>
                </div>

                {/* Copyright */}
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    © 2024 POS System Pro
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Version 1.0.0
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </>
  )
}
