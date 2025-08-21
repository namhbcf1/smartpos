import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useLocation } from 'react-router-dom'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const location = useLocation()

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/dashboard') return 'Tổng quan'
    if (path === '/pos') return 'POS Bán hàng'
    if (path === '/products') return 'Quản lý sản phẩm'
    if (path === '/sales') return 'Lịch sử bán hàng'
    if (path === '/reports') return 'Báo cáo & Thống kê'
    if (path === '/customers') return 'Khách hàng'
    if (path === '/analytics') return 'Phân tích kinh doanh'
    if (path === '/settings') return 'Cài đặt hệ thống'
    return 'POS System'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Enhanced Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'lg:ml-[320px]' : 'lg:ml-0'}`}>
        {/* Enhanced Header */}
        <Header
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          title={getPageTitle()}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}


