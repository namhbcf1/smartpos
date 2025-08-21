import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Sparkles } from "lucide-react"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl hover:shadow-blue-500/25",
        destructive: "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl hover:shadow-red-500/25",
        outline: "border-2 border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300",
        secondary: "bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-900 dark:text-gray-100 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-700",
        ghost: "hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 text-gray-600 dark:text-gray-400",
        link: "text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline hover:text-blue-700 dark:hover:text-blue-300",
        gradient: "bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white hover:from-purple-600 hover:via-pink-600 hover:to-red-600 shadow-lg hover:shadow-xl hover:shadow-purple-500/25",
        glass: "bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20 dark:border-white/10 text-white hover:bg-white/20 dark:hover:bg-black/20 shadow-lg",
        success: "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl hover:shadow-green-500/25",
        warning: "bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 shadow-lg hover:shadow-xl hover:shadow-orange-500/25",
        premium: "bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-black hover:from-amber-500 hover:via-yellow-600 hover:to-amber-700 shadow-lg hover:shadow-xl hover:shadow-amber-500/25",
        neon: "bg-gradient-to-r from-cyan-400 to-blue-500 text-white hover:from-cyan-500 hover:to-blue-600 shadow-lg hover:shadow-xl hover:shadow-cyan-500/25 animate-pulse",
      },
      size: {
        xs: "h-8 px-3 text-xs rounded-md",
        sm: "h-9 px-4 text-xs rounded-md",
        default: "h-11 px-6 py-2",
        lg: "h-12 px-8 text-base rounded-lg",
        xl: "h-14 px-10 text-lg rounded-xl",
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9",
        "icon-lg": "h-12 w-12",
      },
      animation: {
        none: "",
        bounce: "hover:animate-bounce",
        pulse: "hover:animate-pulse",
        wiggle: "hover:animate-wiggle",
        glow: "hover:animate-glow",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  icon?: React.ReactNode
  rightIcon?: React.ReactNode
  tooltip?: string
  ripple?: boolean
  fullWidth?: boolean
  loadingText?: string
  badge?: string | number
  badgeVariant?: 'default' | 'destructive' | 'success' | 'warning'
}

// Ripple effect hook
const useRipple = () => {
  const [ripples, setRipples] = React.useState<Array<{ id: number; x: number; y: number }>>([])

  const addRipple = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget
    const rect = button.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const id = Date.now()

    setRipples(prev => [...prev, { id, x, y }])

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== id))
    }, 600)
  }, [])

  return { ripples, addRipple }
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    animation,
    asChild = false,
    loading = false,
    icon,
    rightIcon,
    tooltip,
    ripple = false,
    fullWidth = false,
    loadingText,
    badge,
    badgeVariant = 'default',
    children,
    onClick,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : motion.button
    const { ripples, addRipple } = useRipple()

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple && !loading && !props.disabled) {
        addRipple(event)
      }
      onClick?.(event)
    }

    const getBadgeColor = (variant: string) => {
      switch (variant) {
        case 'destructive': return 'bg-red-500'
        case 'success': return 'bg-green-500'
        case 'warning': return 'bg-yellow-500'
        default: return 'bg-blue-500'
      }
    }

    const buttonContent = (
      <Comp
        className={cn(
          buttonVariants({ variant, size, animation, className }),
          fullWidth && "w-full",
          "relative"
        )}
        ref={ref}
        disabled={loading || props.disabled}
        onClick={handleClick}
        whileHover={{ scale: asChild ? 1 : 1.02 }}
        whileTap={{ scale: asChild ? 1 : 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        {...props}
      >
        {/* Ripple Effect */}
        {ripple && (
          <div className="absolute inset-0 overflow-hidden rounded-lg">
            <AnimatePresence>
              {ripples.map(ripple => (
                <motion.div
                  key={ripple.id}
                  className="absolute bg-white/30 rounded-full pointer-events-none"
                  style={{
                    left: ripple.x - 10,
                    top: ripple.y - 10,
                    width: 20,
                    height: 20,
                  }}
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 4, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Loading State */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center"
            >
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {loadingText || "Loading..."}
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center"
            >
              {icon && <span className="mr-2">{icon}</span>}
              {children}
              {rightIcon && <span className="ml-2">{rightIcon}</span>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Badge */}
        {badge && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              "absolute -top-2 -right-2 min-w-[20px] h-5 px-1 text-xs font-bold text-white rounded-full flex items-center justify-center",
              getBadgeColor(badgeVariant)
            )}
          >
            {badge}
          </motion.span>
        )}

        {/* Premium Sparkle Effect */}
        {variant === 'premium' && (
          <div className="absolute inset-0 overflow-hidden rounded-lg">
            <Sparkles className="absolute top-1 right-1 w-3 h-3 text-white/50 animate-pulse" />
            <Sparkles className="absolute bottom-1 left-1 w-2 h-2 text-white/30 animate-pulse delay-300" />
          </div>
        )}
      </Comp>
    )

    if (tooltip) {
      return (
        <div className="relative group">
          {buttonContent}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            {tooltip}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
          </div>
        </div>
      )
    }

    return buttonContent
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
export default Button
