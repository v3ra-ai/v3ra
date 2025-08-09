'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createLogger } from '@/lib/logger'
// canvas-confetti is browser-only; load it dynamically on the client

const logger = createLogger('scratch-card');


interface ScratchCardRevealProps {
  reward: number
  onComplete: () => void
  isOpen: boolean
}

export function ScratchCardReveal({ reward, onComplete, isOpen }: ScratchCardRevealProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScratched, setIsScratched] = useState(false)
  const [_scratchProgress, setScratchProgress] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)

  // Dynamically load canvas-confetti only on the client
  const confettiRef = useRef<((opts: Record<string, unknown>) => void) | null>(null)
  useEffect(() => {
    import('canvas-confetti')
      .then((mod) => {
        confettiRef.current = mod.default ?? mod
      })
      .catch(() => {/* ignore */})
  }, [])

  useEffect(() => {
    if (!canvasRef.current || !isOpen) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = 320
    canvas.height = 200

    // Create scratch surface
    ctx.fillStyle = '#27272a' // zinc-800
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add scratch texture
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#3f3f46') // zinc-700
    gradient.addColorStop(0.5, '#27272a') // zinc-800
    gradient.addColorStop(1, '#3f3f46') // zinc-700
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add "Scratch to reveal" text
    ctx.fillStyle = '#71717a' // zinc-500
    ctx.font = 'bold 18px system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('SCRATCH TO REVEAL', canvas.width / 2, canvas.height / 2)

    // Enable scratching
    ctx.globalCompositeOperation = 'destination-out'
  }, [isOpen])

  const handleScratch = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current || isScratched) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top

    ctx.beginPath()
    ctx.arc(x * (canvas.width / rect.width), y * (canvas.height / rect.height), 30, 0, Math.PI * 2)
    ctx.fill()

    // Calculate scratch progress
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    let transparent = 0

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 128) transparent++
    }

    const progress = (transparent / (pixels.length / 4)) * 100
    setScratchProgress(progress)

    // Auto-reveal at 60% scratched
    if (progress > 60 && !isScratched) {
      revealReward()
    }
  }

  const revealReward = (autoClose = true) => {
    setIsScratched(true)
    
    // Clear the canvas to reveal the reward
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
    
    // Fire confetti for big wins
    if (reward >= 100 && confettiRef.current) {
      confettiRef.current({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
    }

    // Only auto-close if scratched (not tapped)
    if (autoClose) {
      setTimeout(onComplete, 2000)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && isScratched) {
              try {
                onComplete();
              } catch (error) {
                logger.error('Error in scratch card onComplete:', error);
              }
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative"
          >
            {/* Card Container */}
            <div className="relative w-80 h-52 rounded-2xl overflow-hidden shadow-2xl">
              {/* Background - Reward Display */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-500 to-pink-600 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={isScratched ? { scale: 1 } : { scale: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                  className="text-center"
                >
                  <motion.div
                    animate={isScratched ? { y: [0, -10, 0] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <p className="text-white/80 text-sm font-medium mb-2">YOU WON</p>
                    <p className="text-white text-6xl font-bold mb-2">{reward}</p>
                    <p className="text-white/80 text-lg font-medium">V3RA POINTS</p>
                  </motion.div>
                </motion.div>
              </div>

              {/* Scratch Surface */}
              <canvas
                ref={canvasRef}
                className={`absolute inset-0 w-full h-full cursor-pointer ${
                  isScratched ? 'pointer-events-none' : ''
                }`}
                onMouseDown={() => setIsDrawing(true)}
                onMouseUp={() => setIsDrawing(false)}
                onMouseMove={(e) => isDrawing && handleScratch(e)}
                onMouseLeave={() => setIsDrawing(false)}
                onTouchStart={() => setIsDrawing(true)}
                onTouchEnd={() => setIsDrawing(false)}
                onTouchMove={handleScratch}
                style={{ touchAction: 'none' }}
              />

              {/* Auto-reveal button */}
              {!isScratched && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  onClick={() => {
                    try {
                      revealReward(false); // Don't auto-close when tapped
                    } catch (error) {
                      logger.error('Error revealing reward:', error);
                    }
                  }}
                  className="absolute bottom-4 right-4 text-xs text-white/50 hover:text-white/80 transition-colors"
                >
                  Tap to reveal
                </motion.button>
              )}
            </div>

            {/* Close button */}
            {isScratched && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={() => {
                  try {
                    onComplete();
                  } catch (error) {
                    logger.error('Error completing scratch card:', error);
                  }
                }}
                className="mt-4 w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-medium transition-all duration-200 shadow-lg"
              >
                Continue
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}