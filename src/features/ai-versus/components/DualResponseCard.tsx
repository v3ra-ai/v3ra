'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AIModel {
  id: string
  name: string
  avatar?: string
}

interface DualResponseProps {
  prompt: string
  leftModel: AIModel
  rightModel: AIModel
  leftResponse: string
  rightResponse: string
  onVote: (winnerId: string) => void
  isLoading?: boolean
}

const springTransition = {
  type: "spring",
  stiffness: 260,
  damping: 20
}

export function DualResponseCard({
  prompt,
  leftModel,
  rightModel,
  leftResponse,
  rightResponse,
  onVote,
  isLoading = false
}: DualResponseProps) {
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)

  const handleCardSelect = (modelId: string) => {
    if (hasVoted) return
    
    setSelectedCard(modelId)
    setHasVoted(true)
    
    // Haptic-style visual feedback
    setTimeout(() => {
      onVote(modelId)
    }, 300)
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {/* Prompt Display */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-semibold text-zinc-100 mb-2">
          Your Question
        </h2>
        <p className="text-lg text-zinc-400 max-w-3xl mx-auto">
          {prompt}
        </p>
      </motion.div>

      {/* Dual Response Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Model Response */}
        <ResponseCard
          model={leftModel}
          response={leftResponse}
          isSelected={selectedCard === leftModel.id}
          isOtherSelected={selectedCard !== null && selectedCard !== leftModel.id}
          isLoading={isLoading}
          onSelect={() => handleCardSelect(leftModel.id)}
          position="left"
        />

        {/* VS Divider */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, ...springTransition }}
            className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center"
          >
            <span className="text-zinc-500 font-semibold text-sm">VS</span>
          </motion.div>
        </div>

        {/* Right Model Response */}
        <ResponseCard
          model={rightModel}
          response={rightResponse}
          isSelected={selectedCard === rightModel.id}
          isOtherSelected={selectedCard !== null && selectedCard !== rightModel.id}
          isLoading={isLoading}
          onSelect={() => handleCardSelect(rightModel.id)}
          position="right"
        />
      </div>

      {/* Vote Instruction */}
      <AnimatePresence>
        {!hasVoted && !isLoading && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center mt-8 text-zinc-500"
          >
            Click on the response you prefer
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

interface ResponseCardProps {
  model: AIModel
  response: string
  isSelected: boolean
  isOtherSelected: boolean
  isLoading: boolean
  onSelect: () => void
  position: 'left' | 'right'
}

function ResponseCard({
  model,
  response,
  isSelected,
  isOtherSelected,
  isLoading,
  onSelect,
  position
}: ResponseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: position === 'left' ? -50 : 50 }}
      animate={{ 
        opacity: isOtherSelected ? 0.5 : 1, 
        x: 0,
        scale: isSelected ? 1.02 : 1
      }}
      transition={springTransition}
      whileHover={!isSelected && !isOtherSelected ? { scale: 1.01 } : {}}
      onClick={onSelect}
      className={cn(
        "relative cursor-pointer",
        isOtherSelected && "pointer-events-none"
      )}
    >
      <div className={cn(
        "relative overflow-hidden rounded-2xl border transition-all duration-300",
        isSelected 
          ? "border-cyan-500 shadow-[0_0_32px_rgba(6,182,212,0.3)]" 
          : "border-zinc-800 hover:border-zinc-700",
        isOtherSelected && "opacity-50"
      )}>
        {/* Glass morphism background */}
        <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-xl" />
        
        {/* Content */}
        <div className="relative p-6">
          {/* Model Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
              <span className="text-sm font-semibold text-zinc-300">
                {model.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <h3 className="font-semibold text-zinc-100">{model.name}</h3>
          </div>

          {/* Response Content */}
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-4 bg-zinc-800 rounded animate-pulse" />
              <div className="h-4 bg-zinc-800 rounded animate-pulse w-5/6" />
              <div className="h-4 bg-zinc-800 rounded animate-pulse w-4/6" />
            </div>
          ) : (
            <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {response}
            </p>
          )}
        </div>

        {/* Selection Indicator */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={springTransition}
              className="absolute top-4 right-4 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}