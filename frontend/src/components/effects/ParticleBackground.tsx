import React, { useCallback } from 'react'
import Particles from '@tsparticles/react'
import { Engine } from '@tsparticles/engine'
import { loadStarsPreset } from '@tsparticles/preset-stars'
import { loadFireworksPreset } from '@tsparticles/preset-fireworks'

interface ParticleBackgroundProps {
  preset?: 'stars' | 'fireworks' | 'floating' | 'network'
  className?: string
  opacity?: number
}

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  preset = 'stars',
  className = '',
  opacity = 0.5
}) => {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadStarsPreset(engine)
    await loadFireworksPreset(engine)
  }, [])

  const getParticleConfig = () => {
    const baseConfig = {
      background: {
        color: {
          value: 'transparent',
        },
      },
      fpsLimit: 120,
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
          value: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'],
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
          value: preset === 'network' ? 80 : preset === 'floating' ? 50 : 100,
        },
        opacity: {
          value: opacity,
          animation: {
            enable: true,
            speed: 1,
            minimumValue: 0.1,
          },
        },
        shape: {
          type: preset === 'stars' ? 'star' : 'circle',
        },
        size: {
          value: { min: 1, max: preset === 'floating' ? 8 : 5 },
          animation: {
            enable: true,
            speed: 2,
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

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <Particles
        id={`particles-${preset}`}
        init={particlesInit}
        options={getParticleConfig()}
        className="w-full h-full"
      />
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
