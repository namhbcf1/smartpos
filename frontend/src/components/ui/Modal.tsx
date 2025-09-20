import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X, Maximize2, Minimize2, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react"
import { cn } from "../../lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const modalVariants = cva(
  "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-2xl duration-200 rounded-xl",
  {
    variants: {
      size: {
        xs: "max-w-xs",
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
        "2xl": "max-w-6xl",
        full: "max-w-[95vw] max-h-[95vh]",
      },
      variant: {
        default: "border-gray-200  bg-white  text-gray-900 
        destructive: "border-red-200  bg-red-50  text-gray-900 
        success: "border-green-200  bg-green-50  text-gray-900 
        warning: "border-yellow-200  bg-yellow-50  text-gray-900 
        info: "border-blue-200  bg-blue-50  text-gray-900 
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
)

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof modalVariants> {
  showCloseButton?: boolean
  closable?: boolean
  fullscreenable?: boolean
  title?: string
  description?: string
  icon?: React.ReactNode
  loading?: boolean
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({
  className,
  children,
  size = 'md',
  variant = 'default',
  showCloseButton = true,
  closable = true,
  fullscreenable = false,
  title,
  description,
  icon,
  loading = false,
  ...props
}, ref) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const titleId = React.useId()
  const descriptionId = React.useId()

  const getVariantIcon = (variant: string) => {
    switch (variant) {
      case 'destructive':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />
      default:
        return null
    }
  }

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          modalVariants({
            size: isFullscreen ? 'full' : size,
            variant
          }),
          isFullscreen && "max-w-[100vw] max-h-[100vh] rounded-none",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
          "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        {...props}
      >
        {/* Header */}
        {(title || description || showCloseButton || fullscreenable) && (
          <div className="flex items-start justify-between border-b border-gray-200 pb-4">
            <div className="flex items-start space-x-3">
              {(icon || getVariantIcon(variant || 'default')) && (
                <div className="flex-shrink-0 mt-1">
                  {icon || getVariantIcon(variant || 'default')}
                </div>
              )}
              <div>
                {title && (
                  <h2 
                    className="text-lg font-semibold text-gray-900">
                    id={titleId}
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p 
                    className="text-sm text-gray-600 mt-1">
                    id={descriptionId}
                  >
                    {description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {fullscreenable && (
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="rounded-md p-1 hover:bg-gray-100 transition-colors">
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </button>
              )}

              {showCloseButton && closable && (
                <DialogPrimitive.Close 
                  className="rounded-md p-1 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  aria-label="Đóng hộp thoại"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Đóng</span>
                </DialogPrimitive.Close>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-sm text-gray-600 tải...</span>">
              </div>
            </div>
          )}
          {children}
        </div>

        {/* Close button for variants without header */}
        {!title && !description && showCloseButton && closable && (
          <DialogPrimitive.Close 
            className="absolute right-4 top-4 rounded-md p-1 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            aria-label="Đóng hộp thoại"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Đóng</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    animated?: boolean
  }
>(({ className, animated = true, ...props }, ref) => (
  <motion.div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    initial={animated ? { opacity: 0, y: -10 } : undefined}
    animate={animated ? { opacity: 1, y: 0 } : undefined}
    transition={animated ? { duration: 0.3, delay: 0.1 } : undefined}
    {...props}
  />
))
DialogHeader.displayName = "DialogHeader"

const DialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    animated?: boolean
    justify?: 'start' | 'center' | 'end' | 'between'
  }
>(({ className, animated = true, justify = 'end', ...props }, ref) => {
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
        "flex flex-col-reverse sm:flex-row sm:space-x-2 pt-4 border-t border-gray-200 
        justifyClasses[justify],
        className
      )}
      initial={animated ? { opacity: 0, y: 10 } : undefined}
      animate={animated ? { opacity: 1, y: 0 } : undefined}
      transition={animated ? { duration: 0.3, delay: 0.2 } : undefined}
      {...props}
    />
  )
})
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> & {
    animated?: boolean
  }
>(({ className, animated = true, ...props }, ref) => (
  <motion.div
    initial={animated ? { opacity: 0, x: -20 } : undefined}
    animate={animated ? { opacity: 1, x: 0 } : undefined}
    transition={animated ? { duration: 0.3, delay: 0.1 } : undefined}
  >
    <DialogPrimitive.Title
      ref={ref}
      className={cn(
        "text-xl font-bold leading-none tracking-tight text-gray-900 
        className
      )}
      {...props}
    />
  </motion.div>
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description> & {
    animated?: boolean
  }
>(({ className, animated = true, ...props }, ref) => (
  <motion.div
    initial={animated ? { opacity: 0, x: -20 } : undefined}
    animate={animated ? { opacity: 1, x: 0 } : undefined}
    transition={animated ? { duration: 0.3, delay: 0.2 } : undefined}
  >
    <DialogPrimitive.Description
      ref={ref}
      className={cn("text-sm text-gray-600  className)}
      {...props}
    />
  </motion.div>
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

// Enhanced Modal component with animations
interface ModalProps extends DialogContentProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  variant = 'default',
  className,
  ...props
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        size={size}
        variant={variant}
        title={title}
        description={description}
        className={className}
        {...props}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}

// Confirmation Modal
interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive' | 'warning'
  loading?: boolean
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Xác nhận",
  description = "Bạn có chắc chắn muốn thực hiện hành động này?",
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  variant = 'default',
  loading = false
}) => {
  const handleConfirm = () => {
    onConfirm()
    if (!loading) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        size="sm"
        variant={variant}
        title={title}
        description={description}
        closable={!loading}
      >
        <DialogFooter className="mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-900  bg-white  border border-gray-300  rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              "px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2",
              variant === 'destructive' && "bg-red-600 hover:bg-red-700",
              variant === 'warning' && "bg-yellow-600 hover:bg-yellow-700",
              variant === 'default' && "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{confirmText}</span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Alert Modal
interface AlertModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  variant?: 'success' | 'warning' | 'destructive' | 'info'
  buttonText?: string
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  variant = 'info',
  buttonText = "Đóng"
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        size="sm"
        variant={variant}
        title={title}
        description={description}
      >
        <DialogFooter className="mt-6">
          <button
            onClick={onClose}
            className={cn(
              "px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors",
              variant === 'success' && "bg-green-600 hover:bg-green-700",
              variant === 'warning' && "bg-yellow-600 hover:bg-yellow-700",
              variant === 'destructive' && "bg-red-600 hover:bg-red-700",
              variant === 'info' && "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {buttonText}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}

export default Modal
