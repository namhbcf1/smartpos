import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'
import { Loader2, RotateCw, RefreshCw, Zap, Heart, Star } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  variant?: 'default' | 'dots' | 'pulse' | 'bounce' | 'wave' | 'orbit' | 'bars' | 'ring' | 'gradient' | 'icon'
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'pink' | 'indigo' | 'gray'
  className?: string
  text?: string
  icon?: React.ReactNode
  overlay?: boolean
  fullScreen?: boolean
}

const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
  '2xl': 'w-16 h-16'
}

const colorClasses = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  red: 'text-red-600',
  yellow: 'text-yellow-600',
  purple: 'text-purple-600',
  pink: 'text-pink-600',
  indigo: 'text-indigo-600',
  gray: 'text-gray-600'
}

const DefaultSpinner: React.FC<{ size: string; color: string; className?: string }> = ({ size, color, className }) => (
  <motion.div
    className={cn(
      'border-2 border-gray-200  rounded-full',
      size,
      className
    )}
    style={{
      borderTopColor: 'currentColor'
    }}
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
  />
)

const IconSpinner: React.FC<{ size: string; color: string; icon?: React.ReactNode; className?: string }> = ({
  size, color, icon, className
}) => (
  <motion.div
    className={cn(size, color, className)}
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
  >
    {icon || <Loader2 className="w-full h-full" />}
  </motion.div>
)

const GradientSpinner: React.FC<{ size: string; className?: string }> = ({ size, className }) => (
  <motion.div
    className={cn(
      'rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500',
      size,
      className
    )}
    style={{
      background: 'conic-gradient(from 0deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6)'
    }}
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
  />
)

const WaveSpinner: React.FC<{ size: string; color: string; className?: string }> = ({ size, color, className }) => {
  const barCount = 5
  const barWidth = size.includes('w-3') ? 'w-0.5' : size.includes('w-4') ? 'w-1' : size.includes('w-6') ? 'w-1' : 'w-1.5'

  return (
    <div className={cn('flex items-end space-x-0.5', className)}>
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.div
          key={i}
          className={cn(
            'bg-current rounded-sm',
            barWidth,
            color
          )}
          style={{ height: '100%' }}
          animate={{
            scaleY: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

const OrbitSpinner: React.FC<{ size: string; color: string; className?: string }> = ({ size, color, className }) => {
  const dotSize = size.includes('w-3') ? 'w-1 h-1' : size.includes('w-4') ? 'w-1.5 h-1.5' : 'w-2 h-2'

  return (
    <div className={cn('relative', size, className)}>
      <motion.div
        className="absolute inset-0"
                  animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      >
        <div className={cn('absolute top-0 left-1/2 transform -translate-x-1/2 bg-current rounded-full', dotSize, color)} />
      </motion.div>
      <motion.div
        className="absolute inset-0"
                  animate={{ rotate: -360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <div className={cn('absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-current rounded-full', dotSize, color)} />
      </motion.div>
    </div>
  )
}

const BarsSpinner: React.FC<{ size: string; color: string; className?: string }> = ({ size, color, className }) => {
  const barCount = 3
  const barHeight = size.includes('w-3') ? 'h-3' : size.includes('w-4') ? 'h-4' : size.includes('w-6') ? 'h-6' : 'h-8'

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.div
          key={i}
          className={cn('w-1 bg-current rounded-full', barHeight, color)}
          animate={{
            scaleY: [1, 0.3, 1],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

const RingSpinner: React.FC<{ size: string; color: string; className?: string }> = ({ size, color, className }) => (
  <div className={cn('relative', size, className)}>
    <motion.div
      className={cn('absolute inset-0 border-2 border-transparent rounded-full', color)}
      style={{
        borderTopColor: 'currentColor',
        borderRightColor: 'currentColor',
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
    <motion.div
      className={cn('absolute inset-1 border-2 border-transparent rounded-full opacity-60', color)}
      style={{
        borderBottomColor: 'currentColor',
        borderLeftColor: 'currentColor',
      }}
      animate={{ rotate: -360 }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
    />
  </div>
)

const DotsSpinner: React.FC<{ size: string; color: string; className?: string }> = ({ size, color, className }) => {
  const dotSize = size.includes('w-3') ? 'w-1 h-1' : size.includes('w-4') ? 'w-1.5 h-1.5' : size.includes('w-6') ? 'w-2 h-2' : 'w-3 h-3'

  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn('bg-current rounded-full', dotSize, color)}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

const PulseSpinner: React.FC<{ size: string; color: string; className?: string }> = ({ size, color, className }) => (
  <motion.div
    className={cn(
      'bg-current rounded-full',
      size,
      color,
      className
    )}
    animate={{
      scale: [1, 1.3, 1],
      opacity: [0.6, 1, 0.6]
    }}
    transition={{
      duration: 1.2,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
)

const BounceSpinner: React.FC<{ size: string; color: string; className?: string }> = ({ size, color, className }) => {
  const ballSize = size.includes('w-3') ? 'w-1.5 h-1.5' : size.includes('w-4') ? 'w-2 h-2' : size.includes('w-6') ? 'w-3 h-3' : 'w-4 h-4'

  return (
    <div className={cn('flex space-x-1 items-end', className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn('bg-current rounded-full', ballSize, color)}
          animate={{
            y: [0, -12, 0]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  color = 'blue',
  className,
  text,
  icon,
  overlay = false,
  fullScreen = false
}) => {
  const sizeClass = sizeClasses[size]
  const colorClass = colorClasses[color]

  const renderSpinner = () => {
    const spinnerProps = { size: sizeClass, color: colorClass, className }

    switch (variant) {
      case 'dots':
        return <DotsSpinner {...spinnerProps} />
      case 'pulse':
        return <PulseSpinner {...spinnerProps} />
      case 'bounce':
        return <BounceSpinner {...spinnerProps} />
      case 'wave':
        return <WaveSpinner {...spinnerProps} />
      case 'orbit':
        return <OrbitSpinner {...spinnerProps} />
      case 'bars':
        return <BarsSpinner {...spinnerProps} />
      case 'ring':
        return <RingSpinner {...spinnerProps} />
      case 'gradient':
        return <GradientSpinner size={sizeClass} className={className} />
      case 'icon':
        return <IconSpinner {...spinnerProps} icon={icon} />
      default:
        return <DefaultSpinner {...spinnerProps} />
    }
  }

  const content = (
    <div className={cn(
      "flex flex-col items-center justify-center",
      text && "space-y-3"
    )}>
      <div className={colorClass}>
        {renderSpinner()}
      </div>
      <AnimatePresence>
        {text && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-gray-600 font-medium text-center max-w-xs"
          >
            {text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )

  if (fullScreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50"
      >
        {content}
      </motion.div>
    )
  }

  if (overlay) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg"
      >
        {content}
      </motion.div>
    )
  }

  return content
}

// Enhanced helper components
export const PageLoading: React.FC<{
  text?: string
  variant?: LoadingSpinnerProps['variant']
  color?: LoadingSpinnerProps['color']
}> = ({
  text = "Đang tải...",
  variant = 'default',
  color = 'blue'
}) => (
  <LoadingSpinner
    size="xl"
    variant={variant}
    color={color}
    text={text}
    fullScreen
  />
)

// Inline loading component
export const InlineLoading: React.FC<{
  text?: string
  size?: LoadingSpinnerProps['size']
  variant?: LoadingSpinnerProps['variant']
  color?: LoadingSpinnerProps['color']
}> = ({
  text = "Đang tải...",
  size = 'sm',
  variant = 'default',
  color = 'blue'
}) => (
  <div className="flex items-center space-x-3">
    <LoadingSpinner
      size={size}
      variant={variant}
      color={color}
    />
    <span className="text-sm text-gray-600 font-medium">
      {text}
    </span>
  </div>
)

// Button loading component
export const ButtonLoading: React.FC<{
  size?: 'xs' | 'sm' | 'md'
  color?: LoadingSpinnerProps['color']
}> = ({
  size = 'sm',
  color = 'blue'
}) => (
  <LoadingSpinner
    size={size}
    variant="default"
    color={color}
    className="mr-2"
  />
)

// Card loading component
export const CardLoading: React.FC<{
  text?: string
  variant?: LoadingSpinnerProps['variant']
}> = ({
  text = "Đang tải nội dung...",
  variant = 'pulse'
}) => (
  <div className="flex flex-col items-center justify-center py-12 space-y-4">
    <LoadingSpinner
      size="lg"
      variant={variant}
      color="blue"
    />
    <p className="text-sm text-gray-500">{text}</p>
  </div>
)

// Skeleton loading for lists
export const SkeletonLoading: React.FC<{
  lines?: number
  className?: string
}> = ({
  lines = 3,
  className
}) => (
  <div className={cn("space-y-3", className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <motion.div
        key={i}
        className="h-4 bg-gray-200 rounded animate-pulse"
        style={{ width: `${Math.random() * 40 + 60}%` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: i * 0.1 }}
      />
    ))}
  </div>
)

export default LoadingSpinner
