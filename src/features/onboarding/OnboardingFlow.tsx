'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface OnboardingStep {
  title: string
  description: string
  visual: React.ReactNode
}

const steps: OnboardingStep[] = [
  {
    title: "Compare AI Models",
    description: "We show you responses from two leading AI models side-by-side. Your job is simple - pick the better answer.",
    visual: (
      <div className="flex gap-4 justify-center">
        <div className="w-24 h-32 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-800 animate-pulse" />
        <div className="text-4xl font-bold text-zinc-600 self-center">VS</div>
        <div className="w-24 h-32 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-800 animate-pulse" />
      </div>
    )
  },
  {
    title: "Vote & Earn Rewards",
    description: "Every vote earns you V3RA points. Scratch to reveal your reward - you could win up to 100 points!",
    visual: (
      <motion.div
        animate={{ rotate: [0, -5, 5, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        className="w-48 h-28 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg"
      >
        <span className="text-white text-2xl font-bold">SCRATCH</span>
      </motion.div>
    )
  },
  {
    title: "Shape AI's Future",
    description: "Your votes help train and improve AI models. See your impact on the leaderboard and earn badges for milestones.",
    visual: (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-yellow-500" />
          <div className="w-32 h-2 rounded-full bg-zinc-700" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-zinc-500" />
          <div className="w-24 h-2 rounded-full bg-zinc-700" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-500" />
          <div className="w-20 h-2 rounded-full bg-zinc-700" />
        </div>
      </div>
    )
  }
]

interface OnboardingFlowProps {
  onComplete: () => void
  isOpen: boolean
}

export function OnboardingFlow({ onComplete, isOpen }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative max-w-md w-full mx-4"
          >
            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mb-8">
              {steps.map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    index === currentStep
                      ? "w-8 bg-cyan-500"
                      : index < currentStep
                      ? "bg-cyan-500/50"
                      : "bg-zinc-700"
                  )}
                />
              ))}
            </div>

            {/* Content Card */}
            <div className="relative overflow-hidden rounded-2xl bg-zinc-900/80 backdrop-blur-xl border border-zinc-800">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="p-8"
                >
                  {/* Visual */}
                  <div className="h-32 flex items-center justify-center mb-8">
                    {steps[currentStep].visual}
                  </div>

                  {/* Text Content */}
                  <h2 className="text-2xl font-bold text-zinc-100 text-center mb-4">
                    {steps[currentStep].title}
                  </h2>
                  <p className="text-zinc-400 text-center leading-relaxed">
                    {steps[currentStep].description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Actions */}
              <div className="flex items-center justify-between p-6 pt-0">
                <button
                  onClick={handleSkip}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
                >
                  Skip tutorial
                </button>

                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg font-medium transition-all hover:scale-105 active:scale-95"
                >
                  {currentStep === steps.length - 1 ? "Get Started" : "Next"}
                </button>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}