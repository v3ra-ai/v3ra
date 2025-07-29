'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { DualResponseCard } from '@/src/features/ai-versus/components/DualResponseCard'
import { ScratchCardReveal } from '@/src/features/rewards/scratch-card/ScratchCardReveal'
import { OnboardingFlow } from '@/src/features/onboarding/OnboardingFlow'
import { useAuth } from '@/contexts/auth-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkles, Zap, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MODEL_PRESETS, REASONING_MODEL_PRIORITY } from '@/lib/model-presets'

interface AIBattle {
  prompt: string
  leftModel: { id: string; name: string }
  rightModel: { id: string; name: string }
  leftResponse: string
  rightResponse: string
}

export default function AIVersusPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [battle, setBattle] = useState<AIBattle | null>(null)
  const [showScratchCard, setShowScratchCard] = useState(false)
  const [scratchReward, setScratchReward] = useState(0)
  const [hasVoted, setHasVoted] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('aiVersusOnboardingComplete')
    }
    return false
  })

  const handleOnboardingComplete = () => {
    localStorage.setItem('aiVersusOnboardingComplete', 'true')
    setShowOnboarding(false)
  }

  // Randomly select two different models for the battle
  const selectBattleModels = () => {
    const availableModels = REASONING_MODEL_PRIORITY.slice(0, 6) // Top 6 models
    const shuffled = [...availableModels].sort(() => 0.5 - Math.random())
    return [shuffled[0], shuffled[1]]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isLoading) return

    setIsLoading(true)
    setHasVoted(false)
    
    try {
      const [model1, model2] = selectBattleModels()
      
      // Get CSRF token
      const csrfResponse = await fetch('/api/csrf')
      const { csrfToken } = await csrfResponse.json()
      
      // Query both models
      const response = await fetch('/api/ai-versus', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          models: [model1.id, model2.id]
        })
      })

      if (!response.ok) throw new Error('Failed to get AI responses')
      
      const data = await response.json()
      
      setBattle({
        prompt: prompt.trim(),
        leftModel: data.models[0],
        rightModel: data.models[1],
        leftResponse: data.responses[0],
        rightResponse: data.responses[1]
      })
      
    } catch (error) {
      console.error('Battle error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVote = async (winnerId: string) => {
    if (hasVoted || !battle) return
    
    setHasVoted(true)
    
    // Calculate reward (10-100 points based on randomness)
    const baseReward = 10
    const bonusMultiplier = Math.random() < 0.1 ? 10 : Math.random() < 0.3 ? 5 : 1
    const reward = baseReward * bonusMultiplier
    setScratchReward(reward)
    
    // Save vote to database
    try {
      await fetch('/api/ai-versus/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: battle.prompt,
          winnerId,
          loserId: winnerId === battle.leftModel.id ? battle.rightModel.id : battle.leftModel.id,
          userId: user?.id
        })
      })
    } catch (error) {
      console.error('Vote error:', error)
    }
    
    // Show scratch card after a delay
    setTimeout(() => setShowScratchCard(true), 500)
  }

  const handleScratchComplete = () => {
    setShowScratchCard(false)
    // Could redirect to leaderboard or show vote history
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Ambient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 px-4 py-8 text-center"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-4">
          AI Versus Arena
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Ask a question and watch two AI models compete. Vote for the best response to earn rewards!
        </p>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pb-16">
        {!battle ? (
          // Query Input
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    What would you like to ask?
                  </label>
                  <div className="relative">
                    <Input
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Ask anything... philosophy, science, creativity, or everyday questions"
                      className="pr-12 bg-zinc-800/50 border-zinc-700 focus:border-cyan-500 text-zinc-100 placeholder-zinc-500"
                      disabled={isLoading}
                    />
                    <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  </div>
                </div>
                
                <Button
                  type="submit"
                  disabled={!prompt.trim() || isLoading}
                  className={cn(
                    "w-full h-12 font-semibold",
                    "bg-gradient-to-r from-cyan-500 to-purple-500",
                    "hover:from-cyan-400 hover:to-purple-400",
                    "disabled:from-zinc-700 disabled:to-zinc-700"
                  )}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Zap className="w-5 h-5" />
                      </motion.div>
                      Summoning AI Champions...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      Start AI Battle
                    </span>
                  )}
                </Button>
              </form>

              {/* Example Prompts */}
              <div className="mt-6 pt-6 border-t border-zinc-800">
                <p className="text-xs text-zinc-500 mb-3">Try these battle-worthy questions:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "What's the meaning of consciousness?",
                    "How to build a successful startup?",
                    "Explain quantum computing simply",
                    "Best way to learn a new language?"
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => setPrompt(example)}
                      className="text-xs px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-300 transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          // Battle Display
          <>
            <DualResponseCard
              prompt={battle.prompt}
              leftModel={battle.leftModel}
              rightModel={battle.rightModel}
              leftResponse={battle.leftResponse}
              rightResponse={battle.rightResponse}
              onVote={handleVote}
              isLoading={isLoading}
            />
            
            {/* New Battle Button */}
            <AnimatePresence>
              {hasVoted && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="text-center mt-8"
                >
                  <Button
                    onClick={() => {
                      setBattle(null)
                      setPrompt('')
                      setHasVoted(false)
                    }}
                    variant="outline"
                    className="border-zinc-700 hover:border-zinc-600"
                  >
                    Start New Battle
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Scratch Card Modal */}
      <ScratchCardReveal
        reward={scratchReward}
        onComplete={handleScratchComplete}
        isOpen={showScratchCard}
      />

      {/* Onboarding Flow */}
      <OnboardingFlow
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
      />
    </div>
  )
}