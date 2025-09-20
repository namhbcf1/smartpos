import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Header } from './Header'
import { ModernSidebar } from './ModernSidebar'
import { ThemeProvider } from '../theme/ThemeProvider'
import { cn } from '../../lib/utils'

interface MainLayoutProps {
  children: React.ReactNode
  title?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title,
  breadcrumbs
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Keyboard shortcut for sidebar toggle (Ctrl+B)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'b') {
        event.preventDefault()
        setSidebarOpen(prev => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev)
  }

  return (
    <ThemeProvider defaultTheme="light" storageKey="pos-ui-theme">
      {/* Modern gradient background */}
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Modern Sidebar */}
        <ModernSidebar
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
        />

        {/* Main Content - Responsive width based on sidebar */}
        <div className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300",
          sidebarOpen ? "lg:ml-80" : "ml-0"
        )}>
          {/* Header */}
          <Header
            title={title}
            breadcrumbs={breadcrumbs}
            onMenuToggle={toggleSidebar}
          />

          {/* Page Content */}
          <main className="flex-1 overflow-auto relative">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22%23f1f5f9%22%20fill-opacity%3D%220.4%22%3E%3Ccircle%20cx%3D%223%22%20cy%3D%223%22%20r%3D%220.5%22/%3E%3Ccircle%20cx%3D%2213%22%20cy%3D%2213%22%20r%3D%220.5%22/%3E%3C/g%3E%3C/svg%3E')] pointer-events-none" />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative z-10 p-4 sm:p-6 lg:p-8 min-h-full"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}

// Page wrapper component for consistent styling
export const PageWrapper: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => {
  return (
    <div className={cn("space-y-6", className)}>
      {children}
    </div>
  )
}

// Section component for organizing content
export const Section: React.FC<{
  children: React.ReactNode
  title?: string
  description?: string
  className?: string
  headerActions?: React.ReactNode
}> = ({ children, title, description, className, headerActions }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("space-y-4", className)}
    >
      {(title || description || headerActions) && (
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <h2 className="text-2xl font-bold text-gray-900">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-gray-600 mt-1">
                {description}
              </p>
            )}
          </div>
          {headerActions && (
            <div className="flex items-center space-x-3">
              {headerActions}
            </div>
          )}
        </div>
      )}
      {children}
    </motion.section>
  )
}

// Grid layout component
export const Grid: React.FC<{
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4 | 6 | 12
  gap?: 2 | 3 | 4 | 6 | 8
  className?: string
}> = ({ children, cols = 3, gap = 6, className }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    6: 'grid-cols-6',
    12: 'grid-cols-12'
  }

  const gridGap = {
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8'
  }

  return (
    <div className={cn(
      'grid',
      gridCols[cols],
      gridGap[gap],
      className
    )}>
      {children}
    </div>
  )
}

// Stats card component
export const StatsCard: React.FC<{
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
  }
  icon?: React.ReactNode
  className?: string
}> = ({ title, value, change, icon, className }) => {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        "bg-white rounded-xl p-6 shadow-lg border border-gray-200",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {value}
          </p>
          {change && (
            <div className={cn(
              "flex items-center mt-2 text-sm",
              change.type === 'increase' 
                ? "text-green-600"
                : "text-red-600"
            )}>
              <span>
                {change.type === 'increase' ? '+' : '-'}{Math.abs(change.value)}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  )
}
