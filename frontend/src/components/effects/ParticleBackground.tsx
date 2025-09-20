import React, { useCallback, useMemo } from 'react'
// import Particles from '@tsparticles/react'
// import { Engine } from '@tsparticles/engine'
// import { loadStarsPreset } from '@tsparticles/preset-stars'
// import { loadFireworksPreset } from '@tsparticles/preset-fireworks'

interface ParticleBackgroundProps {
  preset?: 'stars' | 'fireworks' | 'floating' | 'network'
  className?: string
  opacity?: number
}

// Hook to detect mobile devices and reduced motion preference
const useDeviceCapabilities = () => {
  return useMemo(() => {
    const isMobile = window.innerWidth < 768
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4
    
    return {
      isMobile,
      prefersReducedMotion,
      isLowEndDevice,
      shouldOptimize: isMobile || prefersReducedMotion || isLowEndDevice
    }
  }, [])
}

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  preset = 'stars',
  className = '',
  opacity = 0.5
}) => {
  const { isMobile, shouldOptimize, prefersReducedMotion } = useDeviceCapabilities()
  
  // const particlesInit = useCallback(async (engine: Engine) => {
  //   await loadStarsPreset(engine)
  //   await loadFireworksPreset(engine)
  // }, [])

  const getParticleConfig = () => {
    // Disable particles entirely if user prefers reduced motion
    if (prefersReducedMotion) {
      return null
    }
    const baseConfig = {
      background: {
        color: {
          value: 'transparent',
        },
      },
      fpsLimit: shouldOptimize ? 30 : (isMobile ? 60 : 120),
      interactivity: {
        events: {
          onClick: {
            enable: true,
            mode: 'push',
          },
          onHover: {
            enable: true,
            mode: 'repulse',
          },
          resize: true,
        },
        modes: {
          push: {
            quantity: 4,
          },
          repulse: {
            distance: 200,
            duration: 0.4,
          },
        },
      },
      particles: {
        color: {
          value: shouldOptimize 
            ? ['#3b82f6'] // Single color for performance
            : ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'],
        },
        links: {
          color: '#3b82f6',
          distance: 150,
          enable: preset === 'network',
          opacity: 0.3,
          width: 1,
        },
        collisions: {
          enable: true,
        },
        move: {
          direction: 'none' as const,
          enable: true,
          outModes: {
            default: 'bounce' as const,
          },
          random: false,
          speed: preset === 'floating' ? 1 : 2,
          straight: false,
        },
        number: {
          density: {
            enable: true,
            area: 800,
          },
          value: shouldOptimize 
            ? (preset === 'network' ? 30 : preset === 'floating' ? 20 : 40)
            : (preset === 'network' ? 80 : preset === 'floating' ? 50 : 100),
        },
        opacity: {
          value: shouldOptimize ? Math.min(opacity * 0.6, 0.3) : opacity,
          animation: {
            enable: !shouldOptimize,
            speed: shouldOptimize ? 0.5 : 1,
            minimumValue: 0.1,
          },
        },
        shape: {
          type: preset === 'stars' ? 'star' : 'circle',
        },
        size: {
          value: { 
            min: shouldOptimize ? 1 : 1, 
            max: shouldOptimize ? 3 : (preset === 'floating' ? 8 : 5) 
          },
          animation: {
            enable: !shouldOptimize,
            speed: shouldOptimize ? 1 : 2,
            minimumValue: 0.1,
          },
        },
      },
      detectRetina: true,
    }

    if (preset === 'fireworks') {
      return {
        preset: 'fireworks',
        options: {
          ...baseConfig,
          particles: {
            ...baseConfig.particles,
            number: {
              value: 0,
            },
          },
          emitters: {
            direction: 'top',
            life: {
              count: 0,
              duration: 0.1,
              delay: 0.1,
            },
            rate: {
              delay: 0.15,
              quantity: 1,
            },
            size: {
              width: 100,
              height: 0,
            },
            position: {
              y: 100,
              x: 50,
            },
          },
        },
      }
    }

    return baseConfig
  }

  const particleConfig = getParticleConfig()
  
  // Don't render particles if disabled for accessibility
  if (!particleConfig) {
    return null
  }

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Particles temporarily disabled - will enable after fixing dependencies */}
      {/* <Particles
        id={`particles-${preset}`}
        init={particlesInit}
        options={particleConfig}
        className="w-full h-full">
      /> */}
    </div>
  )
}

// Floating orbs component
export const FloatingOrbs: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`absolute w-32 h-32 rounded-full opacity-20 animate-float-${i % 3}`}
          style={{
            background: `linear-gradient(45deg, 
              ${['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'][i % 5]}, 
              ${['#1d4ed8', '#7c3aed', '#db2777', '#059669', '#d97706'][i % 5]})`,
            left: `${Math.random() * 80}%`,
            top: `${Math.random() * 80}%`,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${8 + Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  )
}

// Animated gradient background
export const AnimatedGradient: React.FC<{
  colors?: string[]
  className?: string
}> = ({
  colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981'],
  className = ''
}) => {
  return (
    <div
      className={`absolute inset-0 opacity-30 ${className}`}
      style={{
        background: `linear-gradient(-45deg, ${colors.join(', ')})`,
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite',
      }}
    />
  )
}

export default ParticleBackground
