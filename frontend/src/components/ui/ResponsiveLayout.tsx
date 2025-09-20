import React from 'react'
import { cn } from '../../lib/utils'
import { useMediaQuery } from '../../hooks/useMediaQuery'

export interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    default: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: number
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className,
  cols = { default: 1, sm: 2, md: 3, lg: 4, xl: 6 },
  gap = 4
}) => {
  const gapClasses = {
    1: 'gap-1',
    2: 'gap-2', 
    3: 'gap-3',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8'
  }

  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3', 
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    8: 'grid-cols-8',
    12: 'grid-cols-12'
  }

  const responsiveClasses = [
    colClasses[cols.default] || 'grid-cols-1',
    cols.sm && `sm:${colClasses[cols.sm]}`,
    cols.md && `md:${colClasses[cols.md]}`,
    cols.lg && `lg:${colClasses[cols.lg]}`,
    cols.xl && `xl:${colClasses[cols.xl]}`
  ].filter(Boolean).join(' ')

  return (
    <div className={cn('grid', responsiveClasses, gapClasses[gap as keyof typeof gapClasses], className)}>
      {children}
    </div>
  )
}

export interface ResponsiveStackProps {
  children: React.ReactNode
  className?: string
  direction?: {
    default: 'row' | 'column'
    sm?: 'row' | 'column'
    md?: 'row' | 'column'
    lg?: 'row' | 'column'
  }
  spacing?: number
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
}

export const ResponsiveStack: React.FC<ResponsiveStackProps> = ({
  children,
  className,
  direction = { default: 'column' },
  spacing = 4,
  align = 'start',
  justify = 'start'
}) => {
  const spacingClasses = {
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3', 
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8'
  }

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  }

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  }

  const directionClasses = {
    row: 'flex-row',
    column: 'flex-col'
  }

  const responsiveClasses = [
    directionClasses[direction.default],
    direction.sm && `sm:${directionClasses[direction.sm]}`,
    direction.md && `md:${directionClasses[direction.md]}`,
    direction.lg && `lg:${directionClasses[direction.lg]}`
  ].filter(Boolean).join(' ')

  return (
    <div className={cn(
      'flex',
      responsiveClasses,
      spacingClasses[spacing as keyof typeof spacingClasses],
      alignClasses[align],
      justifyClasses[justify],
      className
    )}>
      {children}
    </div>
  )
}

// Mobile-first responsive container
export interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: {
    default: number
    sm?: number
    md?: number
    lg?: number
  }
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  maxWidth = 'lg',
  padding = { default: 4, sm: 6, md: 8 }
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full'
  }

  const paddingClasses = {
    0: 'p-0',
    1: 'p-1',
    2: 'p-2',
    3: 'p-3',
    4: 'p-4',
    6: 'p-6',
    8: 'p-8',
    12: 'p-12'
  }

  const responsivePadding = [
    paddingClasses[padding.default as keyof typeof paddingClasses],
    padding.sm && `sm:${paddingClasses[padding.sm as keyof typeof paddingClasses]}`,
    padding.md && `md:${paddingClasses[padding.md as keyof typeof paddingClasses]}`,
    padding.lg && `lg:${paddingClasses[padding.lg as keyof typeof paddingClasses]}`
  ].filter(Boolean).join(' ')

  return (
    <div className={cn(
      'mx-auto w-full',
      maxWidthClasses[maxWidth],
      responsivePadding,
      className
    )}>
      {children}
    </div>
  )
}

// Responsive visibility utilities
export const MobileOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  if (isDesktop) return null
  return <>{children}</>
}

export const DesktopOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isMobile = useMediaQuery('(max-width: 767px)')
  if (isMobile) return null
  return <>{children}</>
}

export const TabletUp: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isTabletUp = useMediaQuery('(min-width: 640px)')
  if (!isTabletUp) return null
  return <>{children}</>
}

// Responsive breakpoint hook
export const useBreakpoint = () => {
  const isSm = useMediaQuery('(min-width: 640px)')
  const isMd = useMediaQuery('(min-width: 768px)')
  const isLg = useMediaQuery('(min-width: 1024px)')
  const isXl = useMediaQuery('(min-width: 1280px)')
  const is2Xl = useMediaQuery('(min-width: 1536px)')

  return {
    isMobile: !isSm,
    isSm: isSm && !isMd,
    isMd: isMd && !isLg,
    isLg: isLg && !isXl,
    isXl: isXl && !is2Xl,
    is2Xl,
    isTabletUp: isSm,
    isDesktopUp: isLg
  }
}
