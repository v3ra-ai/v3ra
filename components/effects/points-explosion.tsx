'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

interface PointsExplosionProps {
  points: number
  x: number
  y: number
  onComplete?: () => void
}

export function PointsExplosion({ points, x, y, onComplete }: PointsExplosionProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onComplete?.()
    }, 2000)

    return () => clearTimeout(timer)
  }, [onComplete])

  const particles = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    angle: (i * 30) * Math.PI / 180,
    distance: 60 + Math.random() * 40,
    size: 4 + Math.random() * 4,
    duration: 0.6 + Math.random() * 0.4,
  }))

  return (
    <AnimatePresence>
      {isVisible && (
        <div
          className="fixed pointer-events-none z-[100]"
          style={{ left: x, top: y }}
        >
          {/* Main points text */}
          <motion.div
            initial={{ scale: 0, y: 0 }}
            animate={{ 
              scale: [0, 1.5, 1],
              y: -80,
            }}
            exit={{ opacity: 0, y: -120 }}
            transition={{ 
              scale: { duration: 0.4, ease: "easeOut" },
              y: { duration: 1.5, ease: "easeOut" },
              opacity: { duration: 0.3, delay: 1.2 }
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
          >
            <div className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-transparent bg-clip-text">
              +{points}
            </div>
          </motion.div>

          {/* Particle explosion */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
              animate={{
                x: Math.cos(particle.angle) * particle.distance,
                y: Math.sin(particle.angle) * particle.distance,
                scale: [0, 1, 0],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: particle.duration,
                ease: "easeOut",
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                width: particle.size,
                height: particle.size,
              }}
            >
              <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-400 to-orange-500" />
            </motion.div>
          ))}

          {/* Glow effect */}
          <motion.div
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-yellow-400/30 blur-xl"
          />
        </div>
      )}
    </AnimatePresence>
  )
}

// Global helper to trigger points explosion anywhere
export function triggerPointsExplosion(points: number, event?: MouseEvent) {
  const x = event?.clientX ?? window.innerWidth / 2
  const y = event?.clientY ?? window.innerHeight / 2

  const container = document.createElement('div')
  document.body.appendChild(container)

  const root = createRoot(container)
  root.render(
    <PointsExplosion 
      points={points} 
      x={x} 
      y={y} 
      onComplete={() => {
        root.unmount()
        document.body.removeChild(container)
      }}
    />
  )
}


