import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  Store,
  CreditCard,
  FileText,
  Truck,
  Shield,
  Calendar,
  TrendingUp,
  Gift,
  Bell,
  User,
  ChevronLeft,
  ChevronRight,
  Search,
  Zap,
  Heart,
  Star,
  Crown,
  Sparkles,
  Globe,
  Activity,
  Target,
  Layers
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface ModernSidebarProps {
  isOpen: boolean
  onToggle: () => void
}

interface MenuGroup {
  title: string
  icon: React.ReactNode
  gradient: string
  items: MenuItem[]
}

interface MenuItem {
  title: string
  path: string
  icon: React.ReactNode
  badge?: string
  color: string
  description?: string
}

const menuGroups: MenuGroup[] = [
  {
    title: "Tổng quan",
    icon: <Home className="w-5 h-5" />,
    gradient: "from-blue-500 to-cyan-500",
    items: [
      {
        title: "Dashboard",
        path: "/dashboard",
        icon: <Home className="w-5 h-5" />,
        color: "text-blue-500",
        description: "Tổng quan hệ thống"
      },
      {
        title: "Thống kê",
        path: "/analytics",
        icon: <BarChart3 className="w-5 h-5" />,
        color: "text-purple-500",
        description: "Phân tích kinh doanh"
      }
    ]
  },
  {
    title: "Bán hàng",
    icon: <ShoppingCart className="w-5 h-5" />,
    gradient: "from-green-500 to-emerald-500",
    items: [
      {
        title: "Bán hàng mới",
        path: "/sales/new",
        icon: <ShoppingCart className="w-5 h-5" />,
        badge: "HOT",
        color: "text-green-500",
        description: "Giao diện bán hàng"
      },
      {
        title: "Lịch sử bán hàng",
        path: "/sales",
        icon: <FileText className="w-5 h-5" />,
        color: "text-orange-500",
        description: "Xem lịch sử bán hàng"
      },
    ]
  },
  {
    title: "Đơn hàng",
    icon: <FileText className="w-5 h-5" />,
    gradient: "from-orange-500 to-red-500",
    items: [
      {
        title: "Tất cả đơn hàng",
        path: "/orders",
        icon: <FileText className="w-5 h-5" />,
        color: "text-orange-500",
        description: "Danh sách đơn hàng"
      },
      {
        title: "Đơn mới",
        path: "/orders/new",
        icon: <Star className="w-5 h-5" />,
        color: "text-blue-500",
        description: "Đơn hàng mới"
      },
      {
        title: "Đang giao",
        path: "/orders/shipping",
        icon: <Truck className="w-5 h-5" />,
        color: "text-yellow-500",
        description: "Đơn đang giao hàng"
      },
      {
        title: "Hoàn thành",
        path: "/orders/completed",
        icon: <Target className="w-5 h-5" />,
        color: "text-green-500",
        description: "Đơn hoàn thành"
      },
      {
        title: "Đã hủy",
        path: "/orders/cancelled",
        icon: <Layers className="w-5 h-5" />,
        color: "text-red-500",
        description: "Đơn bị hủy"
      }
    ]
  },
  {
    title: "Sản phẩm",
    icon: <Package className="w-5 h-5" />,
    gradient: "from-indigo-500 to-purple-500",
    items: [
      {
        title: "Danh sách SP",
        path: "/products",
        icon: <Package className="w-5 h-5" />,
        color: "text-indigo-500",
        description: "Quản lý sản phẩm"
      },
      {
        title: "Danh mục",
        path: "/products/categories",
        icon: <Target className="w-5 h-5" />,
        color: "text-purple-500",
        description: "Phân loại sản phẩm"
      },
      {
        title: "Serial Number",
        path: "/serials",
        icon: <Sparkles className="w-5 h-5" />,
        color: "text-pink-500",
        description: "Quản lý số seri"
      }
    ]
  },
  {
    title: "Kho hàng",
    icon: <Layers className="w-5 h-5" />,
    gradient: "from-teal-500 to-green-500",
    items: [
      {
        title: "Tồn kho",
        path: "/inventory",
        icon: <Layers className="w-5 h-5" />,
        color: "text-teal-500",
        description: "Quản lý tồn kho"
      },
      {
        title: "Nhập kho",
        path: "/inventory/stock-in",
        icon: <TrendingUp className="w-5 h-5" />,
        color: "text-green-500",
        description: "Nhập hàng vào kho"
      },
      {
        title: "Chuyển kho",
        path: "/inventory/transfer",
        icon: <Truck className="w-5 h-5" />,
        color: "text-blue-500",
        description: "Chuyển hàng giữa kho"
      },
      {
        title: "Kiểm kho",
        path: "/inventory/check",
        icon: <Search className="w-5 h-5" />,
        color: "text-orange-500",
        description: "Kiểm tra tồn kho"
      },
      {
        title: "Vị trí kho",
        path: "/inventory/locations",
        icon: <Target className="w-5 h-5" />,
        color: "text-purple-500",
        description: "Quản lý vị trí"
      }
    ]
  },
  {
    title: "Mua hàng",
    icon: <CreditCard className="w-5 h-5" />,
    gradient: "from-yellow-500 to-orange-500",
    items: [
      {
        title: "Đơn mua hàng",
        path: "/purchases",
        icon: <CreditCard className="w-5 h-5" />,
        color: "text-yellow-500",
        description: "Quản lý mua hàng"
      },
      {
        title: "Tạo đơn mua",
        path: "/purchases/new",
        icon: <Zap className="w-5 h-5" />,
        color: "text-orange-500",
        description: "Tạo đơn mua mới"
      },
      {
        title: "Nhận hàng",
        path: "/purchases/receive",
        icon: <Package className="w-5 h-5" />,
        color: "text-green-500",
        description: "Nhận hàng từ NCC"
      },
      {
        title: "Trả hàng",
        path: "/purchases/return",
        icon: <TrendingUp className="w-5 h-5" />,
        color: "text-red-500",
        description: "Trả hàng cho NCC"
      }
    ]
  },
  {
    title: "Khách hàng",
    icon: <Users className="w-5 h-5" />,
    gradient: "from-purple-500 to-pink-500",
    items: [
      {
        title: "Khách hàng",
        path: "/customers",
        icon: <Users className="w-5 h-5" />,
        color: "text-purple-500",
        description: "Quản lý khách hàng"
      },
      {
        title: "Nhà phân phối",
        path: "/distributors",
        icon: <Store className="w-5 h-5" />,
        color: "text-blue-500",
        description: "Quản lý nhà phân phối"
      },
      {
        title: "Đại lý",
        path: "/agents",
        icon: <Star className="w-5 h-5" />,
        color: "text-yellow-500",
        description: "Quản lý đại lý"
      },
      {
        title: "Đối tác",
        path: "/partners",
        icon: <Heart className="w-5 h-5" />,
        color: "text-pink-500",
        description: "Quản lý đối tác"
      },
      {
        title: "Nhà cung cấp",
        path: "/suppliers",
        icon: <Truck className="w-5 h-5" />,
        color: "text-gray-500",
        description: "Quản lý nhà cung cấp"
      }
    ]
  },
  {
    title: "Bảo hành",
    icon: <Shield className="w-5 h-5" />,
    gradient: "from-emerald-500 to-cyan-500",
    items: [
      {
        title: "Quản lý bảo hành",
        path: "/warranty",
        icon: <Shield className="w-5 h-5" />,
        color: "text-emerald-500",
        description: "Hệ thống bảo hành"
      },
      {
        title: "Trung tâm dịch vụ",
        path: "/warranty-service",
        icon: <Settings className="w-5 h-5" />,
        color: "text-blue-500",
        description: "Hub dịch vụ bảo hành"
      },
      {
        title: "Yêu cầu bảo hành",
        path: "/warranty/claims",
        icon: <FileText className="w-5 h-5" />,
        color: "text-orange-500",
        description: "Xử lý yêu cầu"
      },
      {
        title: "Tra cứu QR",
        path: "/warranty/qr-lookup",
        icon: <Search className="w-5 h-5" />,
        color: "text-purple-500",
        description: "Tra cứu bằng QR"
      }
    ]
  },
  {
    title: "Thanh toán",
    icon: <CreditCard className="w-5 h-5" />,
    gradient: "from-pink-500 to-rose-500",
    items: [
      {
        title: "Thanh toán",
        path: "/payments",
        icon: <CreditCard className="w-5 h-5" />,
        color: "text-pink-500",
        description: "Quản lý thanh toán"
      },
      {
        title: "Công nợ KH",
        path: "/debts/customers",
        icon: <Users className="w-5 h-5" />,
        color: "text-red-500",
        description: "Nợ của khách hàng"
      },
      {
        title: "Công nợ NCC",
        path: "/debts/suppliers",
        icon: <Truck className="w-5 h-5" />,
        color: "text-orange-500",
        description: "Nợ nhà cung cấp"
      }
    ]
  },
  {
    title: "Công việc",
    icon: <Calendar className="w-5 h-5" />,
    gradient: "from-violet-500 to-purple-500",
    items: [
      {
        title: "Danh sách công việc",
        path: "/tasks",
        icon: <Calendar className="w-5 h-5" />,
        color: "text-violet-500",
        description: "Quản lý công việc"
      },
      {
        title: "Công việc của tôi",
        path: "/tasks/my",
        icon: <User className="w-5 h-5" />,
        color: "text-purple-500",
        description: "Công việc cá nhân"
      },
      {
        title: "Kanban Board",
        path: "/tasks/kanban",
        icon: <Layers className="w-5 h-5" />,
        color: "text-blue-500",
        description: "Bảng kanban"
      }
    ]
  },
  {
    title: "Báo cáo",
    icon: <BarChart3 className="w-5 h-5" />,
    gradient: "from-cyan-500 to-blue-500",
    items: [
      {
        title: "Báo cáo cơ bản",
        path: "/reports",
        icon: <BarChart3 className="w-5 h-5" />,
        color: "text-cyan-500",
        description: "Báo cáo tổng hợp"
      },
      {
        title: "Phân tích kinh doanh",
        path: "/business-intelligence",
        icon: <TrendingUp className="w-5 h-5" />,
        color: "text-blue-500",
        description: "BI Dashboard"
      }
    ]
  },
  {
    title: "Hệ thống",
    icon: <Settings className="w-5 h-5" />,
    gradient: "from-gray-500 to-slate-500",
    items: [
      {
        title: "Cài đặt",
        path: "/settings",
        icon: <Settings className="w-5 h-5" />,
        color: "text-gray-500",
        description: "Cấu hình hệ thống"
      },
      {
        title: "Người dùng",
        path: "/users",
        icon: <User className="w-5 h-5" />,
        color: "text-slate-500",
        description: "Quản lý tài khoản"
      },
      {
        title: "Nhân viên",
        path: "/employees",
        icon: <Users className="w-5 h-5" />,
        color: "text-blue-500",
        description: "Quản lý nhân viên"
      },
      {
        title: "Vai trò",
        path: "/roles",
        icon: <Crown className="w-5 h-5" />,
        color: "text-purple-500",
        description: "Phân quyền hệ thống"
      },
      {
        title: "Chi nhánh",
        path: "/branches",
        icon: <Store className="w-5 h-5" />,
        color: "text-green-500",
        description: "Quản lý chi nhánh"
      },
      {
        title: "Thiết bị",
        path: "/devices",
        icon: <Zap className="w-5 h-5" />,
        color: "text-orange-500",
        description: "Quản lý thiết bị"
      }
    ]
  }
]

export const ModernSidebar: React.FC<ModernSidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [activeGroup, setActiveGroup] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")

  // Find active group based on current path
  useEffect(() => {
    const currentPath = location.pathname
    for (const group of menuGroups) {
      for (const item of group.items) {
        if (currentPath === item.path || (item.path !== "/" && currentPath.startsWith(item.path))) {
          setActiveGroup(group.title)
          break
        }
      }
    }
  }, [location.pathname])

  const handleItemClick = (path: string) => {
    navigate(path)
  }

  const toggleGroup = (groupTitle: string) => {
    setActiveGroup(activeGroup === groupTitle ? "" : groupTitle)
  }

  const filteredGroups = searchQuery
    ? menuGroups.map(group => ({
        ...group,
        items: group.items.filter(item =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(group => group.items.length > 0)
    : menuGroups

  return (
    <>
      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 lg:hidden" onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -320 }}
        animate={{ x: isOpen ? 0 : -320 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          mass: 0.8
        }}
        className="fixed left-0 top-0 bottom-0 w-80 bg-gradient-to-br from-white via-gray-50 to-white z-50 flex flex-col shadow-2xl border-r border-gray-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <motion.div
            className="flex items-center space-x-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Smart POS</h1>
              <p className="text-xs text-gray-500">Advanced System</p>
            </div>
          </motion.div>

          <motion.button
            onClick={onToggle}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Search */}
        <div className="p-4">
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </motion.div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          <AnimatePresence mode="wait">
            {filteredGroups.map((group, groupIndex) => (
              <motion.div
                key={group.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (groupIndex + 3) }}
                className="space-y-1"
              >
                {/* Group Header */}
                <motion.button
                  onClick={() => toggleGroup(group.title)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 group",
                    activeGroup === group.title
                      ? "bg-gradient-to-r " + group.gradient + " text-white shadow-lg"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                      activeGroup === group.title
                        ? "bg-white/20"
                        : "bg-gray-200 group-hover:bg-gray-300"
                    )}>
                      {group.icon}
                    </div>
                    <span className="font-semibold">{group.title}</span>
                  </div>
                  <motion.div
                    animate={{ rotate: activeGroup === group.title ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.div>
                </motion.button>

                {/* Group Items */}
                <AnimatePresence>
                  {activeGroup === group.title && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="ml-4 space-y-1 overflow-hidden"
                    >
                      {group.items.map((item, itemIndex) => {
                        const is_active = location.pathname === item.path ||
                          (item.path !== "/" && location.pathname.startsWith(item.path))

                        return (
                          <motion.button
                            key={item.path}
                            onClick={() => handleItemClick(item.path)}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * itemIndex }}
                            className={cn(
                              "w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 group relative overflow-hidden",
                              is_active
                                ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 border border-blue-200"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            )}
                            whileHover={{ scale: 1.02, x: 4 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {/* Active indicator */}
                            {is_active && (
                              <motion.div
                                layoutId="activeIndicator"
                                className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-500 rounded-r"
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              />
                            )}

                            <div className="flex items-center space-x-3">
                              <div className={cn(
                                "w-6 h-6 rounded-lg flex items-center justify-center transition-colors",
                                is_active ? item.color : "text-gray-500"
                              )}>
                                {item.icon}
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-sm">{item.title}</p>
                                {item.description && (
                                  <p className="text-xs opacity-70">{item.description}</p>
                                )}
                              </div>
                            </div>

                            {item.badge && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full shadow-lg"
                              >
                                {item.badge}
                              </motion.span>
                            )}
                          </motion.button>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <motion.div
            className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">System Administrator</p>
            </div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </motion.div>
        </div>
      </motion.aside>
    </>
  )
}
