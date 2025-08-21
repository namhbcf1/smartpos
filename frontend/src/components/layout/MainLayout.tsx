import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
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
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <ThemeProvider defaultTheme="light" storageKey="pos-ui-theme">
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onToggle={() => setSidebarOpen(!sidebarOpen)} 
        />

        {/* Main Content */}
        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'ml-[320px]' : 'ml-0'}}`}>
          {/* Header */}
          <Header 
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
            title={title}
            breadcrumbs={breadcrumbs}
          />

          {/* Page Content */}
          <main className="flex-1 h-screen">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="container mx-auto p-6"
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
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
        "bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
          {change && (
            <div className={cn(
              "flex items-center mt-2 text-sm",
              change.type === 'increase' 
                ? "text-green-600 dark:text-green-400" 
                : "text-red-600 dark:text-red-400"
            )}>
              <span>
                {change.type === 'increase' ? '+' : '-'}{Math.abs(change.value)}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 text-gray-400 dark:text-gray-500">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  )
}
