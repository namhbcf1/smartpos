import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, XCircle, AlertTriangle, Info, X, RefreshCw } from 'lucide-react'
import { cn } from '../../lib/utils'

export type ErrorSeverity = 'error' | 'warning' | 'info' | 'critical'

export interface ErrorDisplayProps {
  title?: string
  message: string
  severity?: ErrorSeverity
  dismissible?: boolean
  onDismiss?: () => void
  onRetry?: () => void
  retryText?: string
  className?: string
  showIcon?: boolean
  compact?: boolean
  animated?: boolean
}

const severityConfig = {
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-500',
    titleColor: 'text-red-900'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-500',
    titleColor: 'text-yellow-900'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-900'
  },
  critical: {
    icon: XCircle,
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    textColor: 'text-red-900',
    iconColor: 'text-red-600',
    titleColor: 'text-red-950'
  }
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title,
  message,
  severity = 'error',
  dismissible = false,
  onDismiss,
  onRetry,
  retryText = 'Thử lại',
  className,
  showIcon = true,
  compact = false,
  animated = true
}) => {
  const config = severityConfig[severity]
  const Icon = config.icon

  const variants = animated ? {
    initial: { opacity: 0, y: -10, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.95 }
  } : {}

  return (
    <motion.div
      className={cn(
        'rounded-lg border p-4',
        config.bgColor,
        config.borderColor,
        compact && 'p-3',
        className
      )}
      variants={variants}
      initial={animated ? 'initial' : undefined}
      animate={animated ? 'animate' : undefined}
      exit={animated ? 'exit' : undefined}
      transition={{ duration: 0.3 }}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-start">
        {showIcon && (
          <div className="flex-shrink-0">
            <Icon className={cn('w-5 h-5', config.iconColor)} aria-hidden="true" />
          </div>
        )}

        <div className={cn('flex-1', showIcon && 'ml-3')}>
          {title && (
            <h3 className={cn(
              'font-medium text-sm mb-1',
              config.titleColor,
              compact && 'text-xs mb-0'
            )}>
              {title}
            </h3>
          )}
          
          <p className={cn(
            'text-sm leading-5',
            config.textColor,
            compact && 'text-xs'
          )}>
            {message}
          </p>

          {onRetry && (
            <div className="mt-3">
              <button
                onClick={onRetry}
                className={cn(
                  'inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
                  severity === 'error' && 'text-red-700 bg-red-100 hover:bg-red-200 focus:ring-red-500',
                  severity === 'warning' && 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:ring-yellow-500',
                  severity === 'info' && 'text-blue-700 bg-blue-100 hover:bg-blue-200 focus:ring-blue-500',
                  severity === 'critical' && 'text-red-800 bg-red-200 hover:bg-red-300 focus:ring-red-600'
                )}
                type="button"
                aria-label={`${retryText} - ${message}`}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                {retryText}
              </button>
            </div>
          )}
        </div>

        {dismissible && onDismiss && (
          <div className="flex-shrink-0 ml-4">
            <button
              className={cn(
                'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
                config.textColor,
                'hover:bg-black/5',
                severity === 'error' && 'focus:ring-red-500',
                severity === 'warning' && 'focus:ring-yellow-500',
                severity === 'info' && 'focus:ring-blue-500',
                severity === 'critical' && 'focus:ring-red-600'
              )}
              onClick={onDismiss}
              type="button"
              aria-label="Đóng thông báo lỗi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Toast-style error notification
export interface ErrorToastProps extends Omit<ErrorDisplayProps, 'className'> {
  isVisible: boolean
  onClose?: () => void
  duration?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

export const ErrorToast: React.FC<ErrorToastProps> = ({
  isVisible,
  onClose,
  duration = 5000,
  position = 'top-right',
  ...errorProps
}) => {
  React.useEffect(() => {
    if (isVisible && duration > 0 && onClose) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            'fixed z-50 max-w-sm w-full shadow-lg',
            positionClasses[position]
          )}
          initial={{ opacity: 0, scale: 0.8, y: position.startsWith('top') ? -20 : 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: position.startsWith('top') ? -20 : 20 }}
          transition={{ duration: 0.3 }}
        >
          <ErrorDisplay
            {...errorProps}
            dismissible={!!onClose}
            onDismiss={onClose}
            animated={false}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Inline error for forms
export interface InlineErrorProps {
  message?: string
  visible?: boolean
  animated?: boolean
  className?: string
}

export const InlineError: React.FC<InlineErrorProps> = ({
  message,
  visible = !!message,
  animated = true,
  className
}) => {
  if (!visible || !message) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={cn('flex items-center mt-1', className)}
          initial={animated ? { opacity: 0, height: 0, y: -5 } : undefined}
          animate={animated ? { opacity: 1, height: 'auto', y: 0 } : undefined}
          exit={animated ? { opacity: 0, height: 0, y: -5 } : undefined}
          transition={{ duration: 0.2 }}
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
          <span className="text-sm text-red-600">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Error boundary fallback
export interface ErrorBoundaryFallbackProps {
  error: Error
  resetError?: () => void
  title?: string
}

export const ErrorBoundaryFallback: React.FC<ErrorBoundaryFallbackProps> = ({
  error,
  resetError,
  title = 'Đã xảy ra lỗi'
}) => {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <ErrorDisplay
          severity="critical"
          title={title}
          message={error.message || 'Một lỗi không mong muốn đã xảy ra. Vui lòng thử lại.'}
          onRetry={resetError}
          retryText="Tải lại trang"
          showIcon={true}
        />
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 p-3 bg-gray-50 rounded-lg border">
            <summary className="font-medium cursor-pointer text-sm text-gray-700">
              Chi tiết lỗi (Development)
            </summary>
            <pre className="mt-2 text-xs text-gray-600 overflow-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

export default ErrorDisplay
