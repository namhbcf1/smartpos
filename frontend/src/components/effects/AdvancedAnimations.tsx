import React, { useRef, useEffect } from 'react'
import { motion, useAnimation, useInView, useScroll, useTransform } from 'framer-motion'
import { useIntersectionObserver } from 'react-intersection-observer'
import Tilt from 'react-parallax-tilt'

// Parallax scroll component
export const ParallaxSection: React.FC<{
  children: React.ReactNode
  offset?: number
  className?: string
}> = ({ children, offset = 50, className = '' }) => {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 1000], [0, offset])

  return (
    <motion.div style={{ y }} className={className}>
      {children}
    </motion.div>
  )
}

// Reveal animation on scroll
export const RevealOnScroll: React.FC<{
  children: React.ReactNode
  direction?: 'up' | 'down' | 'left' | 'right'
  delay?: number
  duration?: number
  className?: string
}> = ({ 
  children, 
  direction = 'up', 
  delay = 0, 
  duration = 0.6,
  className = '' 
}) => {
  const controls = useAnimation()
  const [ref, inView] = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true,
  })

  useEffect(() => {
    if (inView) {
      controls.start('visible')
    }
  }, [controls, inView])

  const variants = {
    hidden: {
      opacity: 0,
      x: direction === 'left' ? -50 : direction === 'right' ? 50 : 0,
      y: direction === 'up' ? 50 : direction === 'down' ? -50 : 0,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        delay,
        ease: [0.25, 0.25, 0.25, 0.75],
      },
    },
  }

  return (
    <motion.div
      ref={ref}
      animate={controls}
      initial="hidden"
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Stagger animation for lists
export const StaggerContainer: React.FC<{
  children: React.ReactNode
  staggerDelay?: number
  className?: string
}> = ({ children, staggerDelay = 0.1, className = '' }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  )
}

export const StaggerItem: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className = '' }) => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.25, 0.25, 0.75],
      },
    },
  }

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  )
}

// 3D Tilt effect wrapper
export const TiltCard: React.FC<{
  children: React.ReactNode
  tiltMaxAngleX?: number
  tiltMaxAngleY?: number
  perspective?: number
  scale?: number
  className?: string
}> = ({
  children,
  tiltMaxAngleX = 10,
  tiltMaxAngleY = 10,
  perspective = 1000,
  scale = 1.02,
  className = ''
}) => {
  return (
    <Tilt
      tiltMaxAngleX={tiltMaxAngleX}
      tiltMaxAngleY={tiltMaxAngleY}
      perspective={perspective}
      scale={scale}
      transitionSpeed={2500}
      gyroscope={true}
      className={className}
    >
      {children}
    </Tilt>
  )
}

// Morphing shape animation
export const MorphingShape: React.FC<{
  size?: number
  colors?: string[]
  className?: string
}> = ({ 
  size = 100, 
  colors = ['#3b82f6', '#8b5cf6', '#ec4899'],
  className = '' 
}) => {
  return (
    <motion.div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          borderRadius: [
            '50%',
            '25% 75% 75% 25%',
            '75% 25% 25% 75%',
            '50%',
          ],
          background: colors,
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  )
}

// Floating animation
export const FloatingElement: React.FC<{
  children: React.ReactNode
  intensity?: number
  speed?: number
  className?: string
}> = ({ children, intensity = 10, speed = 3, className = '' }) => {
  return (
    <motion.div
      animate={{
        y: [-intensity, intensity, -intensity],
        x: [-intensity/2, intensity/2, -intensity/2],
      }}
      transition={{
        duration: speed,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Pulse animation
export const PulseElement: React.FC<{
  children: React.ReactNode
  scale?: number
  duration?: number
  className?: string
}> = ({ children, scale = 1.05, duration = 2, className = '' }) => {
  return (
    <motion.div
      animate={{
        scale: [1, scale, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Typewriter effect
export const TypewriterText: React.FC<{
  text: string
  speed?: number
  className?: string
}> = ({ text, speed = 50, className = '' }) => {
  const [displayText, setDisplayText] = React.useState('')
  const [currentIndex, setCurrentIndex] = React.useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)

      return () => clearTimeout(timeout)
    }
  }, [currentIndex, text, speed])

  return (
    <span className={className}>
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="inline-block w-0.5 h-5 bg-current ml-1"
      />
    </span>
  )
}

// Magnetic hover effect
export const MagneticElement: React.FC<{
  children: React.ReactNode
  strength?: number
  className?: string
}> = ({ children, strength = 0.3, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const deltaX = (e.clientX - centerX) * strength
    const deltaY = (e.clientY - centerY) * strength

    setPosition({ x: deltaX, y: deltaY })
  }

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 })
  }

  return (
    <motion.div
      ref={ref}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </motion.div>
  )
}
