'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Lightbulb, Target, Sparkles, Zap, Layers, Trophy, Eye, EyeOff } from 'lucide-react'
import confetti from 'canvas-confetti'
import { createLogger } from '@/lib/logger'

const logger = createLogger('blind-dual-response');

interface AIModel {
  id: string
  name: string
  avatar?: string
}

interface BlindDualResponseProps {
  prompt: string
  leftModel: AIModel
  rightModel: AIModel
  leftResponse: string
  rightResponse: string
  onVote: (winnerId: string, voteReason: string, timeToDecide: number) => void
  voteSessionId: string
  isLoading?: boolean
}

const springTransition = {
  type: "spring" as const,
  stiffness: 260,
  damping: 20
}

// Define underdog models for special celebrations
const UNDERDOG_MODELS = ['llama', 'mistral', 'qwen', 'deepseek', 'mixtral']
const PREMIUM_MODELS = ['gpt-4', 'claude', 'gemini']

export function BlindDualResponseCard({
  prompt,
  leftModel,
  rightModel,
  leftResponse,
  rightResponse,
  onVote,
  voteSessionId,
  isLoading = false
}: BlindDualResponseProps) {
  const [selectedCard, setSelectedCard] = useState<'A' | 'B' | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [showReasonModal, setShowReasonModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [decisionStartTime, setDecisionStartTime] = useState<number | null>(null)
  const [modelsRevealed, setModelsRevealed] = useState(false)
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)

  // Randomly assign models to A/B positions
  const [modelAssignment] = useState(() => {
    const randomize = Math.random() > 0.5
    return {
      A: randomize ? leftModel : rightModel,
      B: randomize ? rightModel : leftModel,
      responseA: randomize ? leftResponse : rightResponse,
      responseB: randomize ? rightResponse : leftResponse
    }
  })

  const handleCardSelect = (position: 'A' | 'B') => {
    // Prevent selection if already voted, loading, submitting, or modal is open
    if (hasVoted || isLoading || isSubmitting || showReasonModal) return
    
    // Prevent changing selection once a card is selected
    if (selectedCard !== null) return
    
    // Start timing the decision if not already started
    if (!decisionStartTime) {
      setDecisionStartTime(Date.now())
    }
    
    setSelectedCard(position)
    setShowReasonModal(true)
  }

  const handleReasonSelect = async (reasonId: string) => {
    if (selectedCard === null) return
    
    setIsSubmitting(true)
    setShowReasonModal(false)

    try {
      const timeToDecide = decisionStartTime ? Date.now() - decisionStartTime : 0
      const selectedModel = modelAssignment[selectedCard]
      setSelectedModelId(selectedModel.id)
      
      // Call the parent's onVote function
      await onVote(selectedModel.id, reasonId, timeToDecide)
      
      setHasVoted(true)
      
      // Trigger reveal animation after a short delay
      setTimeout(() => {
        revealModels()
      }, 500)
      
    } catch (error) {
      logger.error('Error submitting vote:', error)
      const errorMessage = error instanceof Error ? error.message : "Failed to submit vote. Please try again.";
      toast.error(errorMessage)
      setSelectedCard(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const revealModels = () => {
    setModelsRevealed(true)
    
    // Check if underdog beat premium model
    const winner = modelAssignment[selectedCard!]
    const loser = modelAssignment[selectedCard === 'A' ? 'B' : 'A']
    
    const winnerIsUnderdog = UNDERDOG_MODELS.some(model => 
      winner.name.toLowerCase().includes(model)
    )
    const loserIsPremium = PREMIUM_MODELS.some(model => 
      loser.name.toLowerCase().includes(model)
    )
    
    if (winnerIsUnderdog && loserIsPremium) {
      // Trigger celebration for David vs Goliath moment
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#ec4899', '#f59e0b']
      })
      
      toast("🎉 David beats Goliath!", {
        description: `${winner.name} defeated ${loser.name} in blind testing!`,
        duration: 5000,
      })
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {/* Header with blind testing indicator */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <EyeOff className="w-5 h-5 text-purple-400" />
          <span className="text-sm text-purple-400 font-medium">Blind Testing Mode</span>
        </div>
        <p className="text-2xl text-gray-100 font-semibold max-w-3xl mx-auto px-4 drop-shadow-sm">
          "{prompt}"
        </p>
      </motion.div>

      {/* Dual Response Cards */}
      <div className="grid md:grid-cols-2 gap-6 relative">
        {/* Response A */}
        <BlindResponseCard
          label="A"
          response={modelAssignment.responseA}
          model={modelsRevealed ? modelAssignment.A : null}
          isSelected={selectedCard === 'A'}
          isOtherSelected={selectedCard !== null && selectedCard !== 'A'}
          isLoading={isLoading}
          onSelect={() => handleCardSelect('A')}
          position="left"
          isWinner={hasVoted && selectedCard === 'A'}
        />

        {/* VS Divider */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:block">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, ...springTransition }}
            className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 backdrop-blur shadow-2xl shadow-purple-600/50 rounded-full flex items-center justify-center"
          >
            <span className="text-white font-black text-lg">VS</span>
          </motion.div>
        </div>

        {/* Response B */}
        <BlindResponseCard
          label="B"
          response={modelAssignment.responseB}
          model={modelsRevealed ? modelAssignment.B : null}
          isSelected={selectedCard === 'B'}
          isOtherSelected={selectedCard !== null && selectedCard !== 'B'}
          isLoading={isLoading}
          onSelect={() => handleCardSelect('B')}
          position="right"
          isWinner={hasVoted && selectedCard === 'B'}
        />
      </div>

      {/* Vote Instruction */}
      <AnimatePresence mode="wait">
        {!hasVoted && !isLoading && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center mt-8 text-white text-sm font-medium"
          >
            Choose the better response without knowing which AI wrote it
          </motion.p>
        )}
        {hasVoted && modelsRevealed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-8"
          >
            <p className="text-white text-lg font-medium">
              You chose <span className="font-bold text-purple-400">
                {modelAssignment[selectedCard!].name}
              </span>!
            </p>
            <p className="text-white text-sm mt-2">
              Revealing models in blind testing helps discover true preferences
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vote Reason Modal */}
      <Dialog 
        open={showReasonModal} 
        onOpenChange={(open) => {
          // Only allow closing if not submitting
          if (!isSubmitting) {
            setShowReasonModal(open)
            // If closing, reset selection to allow changing mind
            if (!open && !hasVoted) {
              setSelectedCard(null)
            }
          }
        }}
      >
        <DialogContent className="bg-black/90 backdrop-blur border-white/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              Why did Response {selectedCard} stand out?
            </DialogTitle>
            <DialogDescription className="sr-only">
              Select a reason why this response stood out to you
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-3 mt-6">
            {[
              { id: 'conciseness', label: 'Clearer explanation', icon: Lightbulb },
              { id: 'accuracy', label: 'More accurate', icon: Target },
              { id: 'creativity', label: 'More creative', icon: Sparkles },
              { id: 'technical', label: 'Better technical answer', icon: Zap },
              { id: 'overall', label: 'Just better overall', icon: Trophy }
            ].map(reason => {
              const Icon = reason.icon;
              return (
                <Button
                  key={reason.id}
                  variant="outline"
                  className="h-24 flex-col gap-2 border-white/20 
                           hover:border-purple-500 hover:bg-purple-500/10
                           transition-all duration-200"
                  onClick={() => handleReasonSelect(reason.id)}
                  disabled={isSubmitting}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-sm">{reason.label}</span>
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface BlindResponseCardProps {
  label: 'A' | 'B'
  response: string
  model: AIModel | null
  isSelected: boolean
  isOtherSelected: boolean
  isLoading: boolean
  onSelect: () => void
  position: 'left' | 'right'
  isWinner: boolean
}

function BlindResponseCard({
  label,
  response,
  model,
  isSelected,
  isOtherSelected,
  isLoading,
  onSelect,
  position,
  isWinner
}: BlindResponseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: position === 'left' ? -50 : 50 }}
      animate={{ 
        opacity: isOtherSelected && !model ? 0.5 : 1, 
        x: 0,
        scale: isSelected ? 1.02 : 1
      }}
      transition={springTransition}
      whileHover={!isSelected && !isOtherSelected && !model ? { scale: 1.01 } : {}}
      onClick={!model && !isSelected && !isOtherSelected ? onSelect : undefined}
      className={cn(
        "relative",
        !model && !isSelected && !isOtherSelected ? "cursor-pointer" : "cursor-default",
        (isSelected || isOtherSelected) && !model && "pointer-events-none"
      )}
    >
      <div className={cn(
        "relative overflow-hidden rounded-2xl border transition-all duration-300",
        isWinner 
          ? "border-green-500 shadow-[0_0_32px_rgba(34,197,94,0.3)]" 
          : isSelected 
            ? "border-purple-500 shadow-[0_0_32px_rgba(168,85,247,0.3)]" 
            : "border-white/10 hover:border-white/20",
        isOtherSelected && !model && "opacity-50"
      )}>
        {/* Glass morphism background */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
        
        {/* Content */}
        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center"
                animate={model ? { rotateY: 180 } : { rotateY: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="text-lg font-bold text-white">
                  {model ? model.name.slice(0, 2).toUpperCase() : label}
                </span>
              </motion.div>
              <AnimatePresence mode="wait">
                {!model ? (
                  <motion.h3
                    key="blind"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-semibold text-white"
                  >
                    Response {label}
                  </motion.h3>
                ) : (
                  <motion.h3
                    key="revealed"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="font-semibold text-white"
                  >
                    {model.name}
                  </motion.h3>
                )}
              </AnimatePresence>
            </div>
            
            {/* Winner badge */}
            <AnimatePresence>
              {isWinner && model && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={springTransition}
                  className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full"
                >
                  <Trophy className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">Winner</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Response Content */}
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-4 bg-white/10 rounded animate-pulse" />
              <div className="h-4 bg-white/10 rounded animate-pulse w-5/6" />
              <div className="h-4 bg-white/10 rounded animate-pulse w-4/6" />
            </div>
          ) : (
            <div className="max-h-[40vh] md:max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent pr-2">
              <p className="text-white leading-relaxed whitespace-pre-wrap">
                {response}
              </p>
            </div>
          )}
        </div>

        {/* Selection Indicator */}
        <AnimatePresence>
          {isSelected && !model && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={springTransition}
              className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
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