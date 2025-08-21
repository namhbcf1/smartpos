import * as React from "react"
import { cn } from "../../lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, AlertCircle, CheckCircle, Search, X, Loader2 } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

const inputVariants = cva(
  "flex w-full rounded-lg border border-input bg-background text-sm ring-offset-background transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400",
        filled: "border-transparent bg-gray-100 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500",
        outlined: "border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400",
        error: "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400",
        success: "border-green-500 dark:border-green-400 focus:border-green-500 dark:focus:border-green-400",
      },
      size: {
        sm: "h-9 px-3 py-2 text-xs",
        md: "h-11 px-4 py-3 text-sm",
        lg: "h-13 px-5 py-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  clearable?: boolean
  loading?: boolean
  floating?: boolean
  searchable?: boolean
  onClear?: () => void
  containerClassName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    containerClassName,
    type,
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    variant = 'default',
    size = 'md',
    clearable = false,
    loading = false,
    floating = false,
    searchable = false,
    onClear,
    value,
    onChange,
    onFocus,
    onBlur,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [isFocused, setIsFocused] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(Boolean(value || props.defaultValue))

    const isPassword = type === 'password'
    const inputType = isPassword && showPassword ? 'text' : type
    const finalVariant = error ? 'error' : variant

    React.useEffect(() => {
      setHasValue(Boolean(value))
    }, [value])

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      onBlur?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(Boolean(e.target.value))
      onChange?.(e)
    }

    const handleClear = () => {
      setHasValue(false)
      onClear?.()
      if (onChange) {
        const event = {
          target: { value: '' }
        } as React.ChangeEvent<HTMLInputElement>
        onChange(event)
      }
    }

    return (
      <div className={cn("w-full", containerClassName)}>
        <div className="relative">
          {/* Floating Label */}
          {label && floating && (
            <motion.label
              className={cn(
                "absolute left-3 text-gray-500 dark:text-gray-400 pointer-events-none transition-all duration-200",
                (isFocused || hasValue)
                  ? "top-2 text-xs text-blue-600 dark:text-blue-400"
                  : "top-1/2 transform -translate-y-1/2 text-sm"
              )}
              animate={{
                y: (isFocused || hasValue) ? -8 : 0,
                scale: (isFocused || hasValue) ? 0.85 : 1,
              }}
              transition={{ duration: 0.2 }}
            >
              {label}
            </motion.label>
          )}

          {/* Static Label */}
          {label && !floating && (
            <motion.label
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {label}
            </motion.label>
          )}

          {/* Input Container */}
          <div className="relative">
            {/* Left Icon */}
            {leftIcon && (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 z-10">
                {leftIcon}
              </div>
            )}

            {/* Search Icon for searchable inputs */}
            {searchable && !leftIcon && (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 z-10">
                <Search className="w-4 h-4" />
              </div>
            )}

            {/* Main Input */}
            <motion.input
              type={inputType}
              className={cn(
                inputVariants({ variant: finalVariant, size }),
                leftIcon && "pl-10",
                searchable && !leftIcon && "pl-10",
                (rightIcon || isPassword || clearable || loading) && "pr-12",
                floating && label && "pt-6 pb-2",
                className
              )}
              ref={ref}
              value={value}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              whileFocus={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
              {...props}
            />

            {/* Right Side Icons */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              {/* Loading Spinner */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                >
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                </motion.div>
              )}

              {/* Clear Button */}
              {clearable && hasValue && !loading && (
                <motion.button
                  type="button"
                  onClick={handleClear}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}

              {/* Password Toggle */}
              {isPassword && !loading && (
                <motion.button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <AnimatePresence mode="wait">
                    {showPassword ? (
                      <motion.div
                        key="hide"
                        initial={{ opacity: 0, rotate: -90 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        exit={{ opacity: 0, rotate: 90 }}
                        transition={{ duration: 0.2 }}
                      >
                        <EyeOff className="w-4 h-4" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="show"
                        initial={{ opacity: 0, rotate: -90 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        exit={{ opacity: 0, rotate: 90 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Eye className="w-4 h-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              )}

              {/* Custom Right Icon */}
              {rightIcon && !isPassword && !clearable && !loading && (
                <div className="text-gray-400 dark:text-gray-500">
                  {rightIcon}
                </div>
              )}
            </div>
          </div>

          {/* Focus Ring Animation */}
          <AnimatePresence>
            {isFocused && (
              <motion.div
                className="absolute inset-0 rounded-lg border-2 border-blue-500 pointer-events-none"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Error/Helper Text */}
        <AnimatePresence>
          {(error || helperText) && (
            <motion.div
              initial={{ opacity: 0, y: -5, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -5, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2 flex items-center space-x-1"
            >
              {error && <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />}
              {!error && helperText && <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />}
              <p className={cn(
                "text-xs",
                error ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"
              )}>
                {error || helperText}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

Input.displayName = "Input"

export { Input }
export default Input
