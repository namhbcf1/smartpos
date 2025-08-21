import * as React from "react"
import { cn } from "../../lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, AlertCircle, CheckCircle, Info, X } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

const cardVariants = cva(
  "rounded-xl border bg-card text-card-foreground shadow-lg transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
        elevated: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl hover:shadow-2xl",
        glass: "bg-white/10 dark:bg-black/10 backdrop-blur-md border-white/20 dark:border-white/10",
        gradient: "bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700",
        success: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700",
        warning: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700",
        error: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700",
        info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700",
      },
      size: {
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
      interactive: {
        true: "cursor-pointer hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      interactive: false,
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  loading?: boolean
  skeleton?: boolean
  closable?: boolean
  onClose?: () => void
  status?: 'success' | 'warning' | 'error' | 'info'
  statusMessage?: string
  hover?: boolean
  glass?: boolean
  gradient?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({
    className,
    variant,
    size,
    interactive,
    loading = false,
    skeleton = false,
    closable = false,
    onClose,
    status,
    statusMessage,
    hover = true,
    glass = false,
    gradient = false,
    children,
    ...props
  }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true)

    const handleClose = () => {
      setIsVisible(false)
      setTimeout(() => onClose?.(), 300)
    }

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />
        case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-600" />
        case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />
        case 'info': return <Info className="w-4 h-4 text-blue-600" />
        default: return null
      }
    }

    if (!isVisible) return null

    // Legacy support for old props
    const finalVariant = glass ? 'glass' : gradient ? 'gradient' : variant

    return (
      <motion.div
        ref={ref}
        className={cn(
          cardVariants({ variant: finalVariant, size, interactive, className }),
          hover && "hover:shadow-xl hover:-translate-y-1",
          "relative"
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        whileHover={interactive ? { y: -2 } : undefined}
        {...props}
      >
        {/* Loading Overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10"
            >
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Loading...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Close Button */}
        {closable && (
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-20"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        )}

        {/* Status Bar */}
        {status && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex items-center space-x-2 p-3 rounded-t-xl border-b",
              status === 'success' && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700",
              status === 'warning' && "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700",
              status === 'error' && "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700",
              status === 'info' && "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"
            )}
          >
            {getStatusIcon(status)}
            {statusMessage && (
              <span className={cn(
                "text-sm font-medium",
                status === 'success' && "text-green-700 dark:text-green-300",
                status === 'warning' && "text-yellow-700 dark:text-yellow-300",
                status === 'error' && "text-red-700 dark:text-red-300",
                status === 'info' && "text-blue-700 dark:text-blue-300"
              )}>
                {statusMessage}
              </span>
            )}
          </motion.div>
        )}

        {/* Skeleton Content */}
        {skeleton ? (
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2"></div>
          </div>
        ) : (
          children
        )}
      </motion.div>
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    animated?: boolean
  }
>(({ className, animated = true, ...props }, ref) => (
  <motion.div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    initial={animated ? { opacity: 0, y: -10 } : undefined}
    animate={animated ? { opacity: 1, y: 0 } : undefined}
    transition={animated ? { duration: 0.3, delay: 0.1 } : undefined}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    gradient?: boolean
    size?: 'sm' | 'default' | 'lg' | 'xl'
  }
>(({ className, gradient = true, size = 'default', ...props }, ref) => {
  const sizeClasses = {
    sm: "text-lg",
    default: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl"
  }

  return (
    <motion.h3
      ref={ref}
      className={cn(
        "font-semibold leading-none tracking-tight",
        sizeClasses[size],
        gradient
          ? "bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent"
          : "text-gray-900 dark:text-gray-100",
        className
      )}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      {...props}
    />
  )
})
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    animated?: boolean
  }
>(({ className, animated = true, ...props }, ref) => (
  <motion.p
    ref={ref}
    className={cn("text-sm text-muted-foreground dark:text-gray-400", className)}
    initial={animated ? { opacity: 0, x: -20 } : undefined}
    animate={animated ? { opacity: 1, x: 0 } : undefined}
    transition={animated ? { duration: 0.3, delay: 0.3 } : undefined}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    animated?: boolean
    padding?: 'none' | 'sm' | 'default' | 'lg'
  }
>(({ className, animated = true, padding = 'default', ...props }, ref) => {
  const paddingClasses = {
    none: "",
    sm: "p-4 pt-0",
    default: "p-6 pt-0",
    lg: "p-8 pt-0"
  }

  return (
    <motion.div
      ref={ref}
      className={cn(paddingClasses[padding], className)}
      initial={animated ? { opacity: 0, y: 20 } : undefined}
      animate={animated ? { opacity: 1, y: 0 } : undefined}
      transition={animated ? { duration: 0.3, delay: 0.4 } : undefined}
      {...props}
    />
  )
})
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    animated?: boolean
    justify?: 'start' | 'center' | 'end' | 'between'
  }
>(({ className, animated = true, justify = 'start', ...props }, ref) => {
  const justifyClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between"
  }

  return (
    <motion.div
      ref={ref}
      className={cn(
        "flex items-center p-6 pt-0",
        justifyClasses[justify],
        className
      )}
      initial={animated ? { opacity: 0, y: 20 } : undefined}
      animate={animated ? { opacity: 1, y: 0 } : undefined}
      transition={animated ? { duration: 0.3, delay: 0.5 } : undefined}
      {...props}
    />
  )
})
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
export default Card
