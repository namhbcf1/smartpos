import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-2xl border border-blue-500/20",
        destructive: "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-2xl border border-red-500/20",
        outline: "border-2 border-slate-300 bg-white/80 backdrop-blur-sm hover:bg-slate-50 hover:border-slate-400 text-slate-700 shadow-md hover:shadow-lg",
        secondary: "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-900 hover:from-slate-200 hover:to-slate-300 border border-slate-200 shadow-md hover:shadow-lg",
        ghost: "hover:bg-slate-100 text-slate-600 hover:text-slate-800",
        gradient: "bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white hover:from-purple-600 hover:via-pink-600 hover:to-red-600 shadow-lg hover:shadow-2xl border border-purple-400/20",
        success: "bg-gradient-to-r from-emerald-600 to-green-700 text-white hover:from-emerald-700 hover:to-green-800 shadow-lg hover:shadow-2xl border border-emerald-500/20",
        warning: "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 shadow-lg hover:shadow-2xl border border-amber-400/20",
        premium: "bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-white hover:from-yellow-500 hover:via-amber-600 hover:to-orange-600 shadow-xl hover:shadow-2xl border border-yellow-400/30",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        default: "h-11 px-6 py-2",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
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
  fullWidth?: boolean
  loadingText?: string
  // Loosen variant and size typing to avoid consumer TS friction
  variant?: any
  size?: any
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    asChild = false,
    loading = false,
    icon,
    rightIcon,
    fullWidth = false,
    loadingText,
    children,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : motion.button

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          fullWidth && "w-full"
        )}
        ref={ref}
        disabled={loading || props.disabled}
        whileHover={{ scale: asChild ? 1 : 1.03, y: -1 }}
        whileTap={{ scale: asChild ? 1 : 0.97 }}
        transition={{ type: "spring", stiffness: 500, damping: 20 }}
        {...props}
      >
        {/* Shimmer effect for premium buttons */}
        {variant === 'premium' && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-1000 transform translate-x-[-100%] hover:translate-x-[100%]" />
        )}

        {loading ? (
          <div className="flex items-center relative z-10">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText || "Loading..."}
          </div>
        ) : (
          <div className="flex items-center relative z-10">
            {icon && <span className="mr-2 transition-transform group-hover:scale-110">{icon}</span>}
            {children}
            {rightIcon && <span className="ml-2 transition-transform group-hover:scale-110">{rightIcon}</span>}
          </div>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
export default Button
