import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  X,
  Zap,
  Bell,
  Clock
} from "lucide-react"
import { cn } from "../../lib/utils"

const alertVariants = cva(
  "relative w-full rounded-xl border px-4 py-3 text-sm transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        destructive: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
        success: "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200",
        warning: "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
        info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
        premium: "border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-800 dark:border-purple-800 dark:from-purple-950 dark:to-pink-950 dark:text-purple-200",
      },
      size: {
        sm: "px-3 py-2 text-xs",
        default: "px-4 py-3 text-sm",
        lg: "px-6 py-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string
  description?: string
  icon?: React.ReactNode
  closable?: boolean
  onClose?: () => void
  autoClose?: boolean
  autoCloseDelay?: number
  action?: React.ReactNode
  showIcon?: boolean
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({
    className,
    variant = "default",
    size = "default",
    title,
    description,
    icon,
    closable = false,
    onClose,
    autoClose = false,
    autoCloseDelay = 5000,
    action,
    showIcon = true,
    children,
    ...props
  }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true)
    const [progress, setProgress] = React.useState(100)

    React.useEffect(() => {
      if (autoClose && autoCloseDelay > 0) {
        const interval = setInterval(() => {
          setProgress(prev => {
            const newProgress = prev - (100 / (autoCloseDelay / 100))
            if (newProgress <= 0) {
              handleClose()
              return 0
            }
            return newProgress
          })
        }, 100)

        return () => clearInterval(interval)
      }
    }, [autoClose, autoCloseDelay])

    const handleClose = () => {
      setIsVisible(false)
      setTimeout(() => onClose?.(), 300)
    }

    const getDefaultIcon = (variant: string) => {
      switch (variant) {
        case 'destructive':
          return <AlertCircle className="h-4 w-4" />
        case 'success':
          return <CheckCircle className="h-4 w-4" />
        case 'warning':
          return <AlertTriangle className="h-4 w-4" />
        case 'info':
          return <Info className="h-4 w-4" />
        case 'premium':
          return <Zap className="h-4 w-4" />
        default:
          return <Bell className="h-4 w-4" />
      }
    }

    if (!isVisible) return null

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(alertVariants({ variant, size }), className)}
        {...props}
      >
        {/* Auto-close progress bar */}
        {autoClose && (
          <div className="absolute top-0 left-0 h-1 bg-current opacity-20 rounded-t-xl transition-all duration-100 ease-linear"
               style={{ width: `${progress}%` }} />
        )}

        <div className="flex items-start space-x-3">
          {/* Icon */}
          {showIcon && (
            <div className="flex-shrink-0 mt-0.5">
              {icon || getDefaultIcon(variant || 'default')}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className="font-semibold mb-1 leading-tight">
                {title}
              </h4>
            )}

            {description && (
              <p className="text-sm opacity-90 leading-relaxed">
                {description}
              </p>
            )}

            {children && (
              <div className="mt-2">
                {children}
              </div>
            )}

            {action && (
              <div className="mt-3">
                {action}
              </div>
            )}
          </div>

          {/* Close button */}
          {closable && (
            <button
              onClick={handleClose}
              className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </motion.div>
    )
  }
)

Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
