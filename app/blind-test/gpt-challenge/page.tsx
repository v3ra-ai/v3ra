'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/client-logger'
import { BlindDualResponseCard } from '@/src/features/ai-versus/components/BlindDualResponseCard'
import { ScratchCardReveal } from '@/src/features/rewards/scratch-card/ScratchCardReveal'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Zap, Brain, Target, ChevronRight, Sparkles } from 'lucide-react'
import confetti from 'canvas-confetti'

interface Question {
  id: string
  question_text: string
  category: string
  difficulty: string
}

interface TestSession {
  sessionId: string
  totalQuestions: number
  questions: Question[]
}

interface TestResults {
  completed: boolean
  rewardPoints: number
  scratchCardAvailable: boolean
  summary: {
    totalQuestions: number
    gpt4oVotes: number
    gpt5Votes: number
  }
}

export default function GPTChallengePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const userId = user?.id
  const isLoaded = !loading
  const isSignedIn = !!user
  
  const [testState, setTestState] = useState<'intro' | 'testing' | 'results'>('intro')
  const [session, setSession] = useState<TestSession | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [currentResponses, setCurrentResponses] = useState<any>(null)
  const [isLoadingResponses, setIsLoadingResponses] = useState(false)
  const [results, setResults] = useState<TestResults | null>(null)
  const [showScratchCard, setShowScratchCard] = useState(false)
  const [userVotes, setUserVotes] = useState<{ [key: string]: string }>({})

  // Don't redirect immediately, let users see the page

  const startTest = async () => {
    // Check authentication before starting
    if (!isSignedIn) {
      toast.error('Please sign in to participate in the blind test')
      router.push('/login')
      return
    }
    
    try {
      const response = await fetch('/api/blind-test/gpt-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'start_session' })
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.error && errorData.error.includes('already completed')) {
          toast.error('You have already completed this test. Each user can only take it once.')
          // Optionally redirect to analytics
          setTimeout(() => {
            router.push('/blind-test/gpt-challenge/analytics')
          }, 2000)
          return
        }
        throw new Error(errorData.error || 'Failed to start test')
      }

      const data = await response.json()
      setSession(data)
      setTestState('testing')
      loadQuestion(data.sessionId, 1)
    } catch (error) {
      toast.error('Failed to start blind test')
      logger.error('Failed to start test', error)
    }
  }

  const loadQuestion = async (sessionId: string, questionNumber: number) => {
    setIsLoadingResponses(true)
    try {
      const response = await fetch('/api/blind-test/gpt-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'get_next_question',
          sessionId,
          questionNumber
        })
      })

      if (!response.ok) throw new Error('Failed to load question')

      const data = await response.json()
      setCurrentResponses(data)
      setCurrentQuestion(questionNumber)
    } catch (error) {
      toast.error('Failed to load question')
      logger.error('Failed to start test', error)
    } finally {
      setIsLoadingResponses(false)
    }
  }

  const handleVote = async (selectedPosition: string, voteReason: string, timeToDecide: number) => {
    if (!session || !currentResponses) return
    
    // Store the vote
    setUserVotes(prev => ({
      ...prev,
      [currentQuestion]: selectedPosition
    }))

    try {
      const response = await fetch('/api/blind-test/gpt-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'submit_vote',
          sessionId: session.sessionId,
          responseId: currentResponses.responseId,
          questionNumber: currentQuestion,
          selectedPosition,
          voteReason,
          timeToDecide
        })
      })

      if (!response.ok) throw new Error('Failed to submit vote')

      // Move to next question or complete
      if (currentQuestion < session.totalQuestions) {
        setTimeout(() => {
          loadQuestion(session.sessionId, currentQuestion + 1)
        }, 1000) // Reduced to 1 second for faster flow
      } else {
        setTimeout(() => {
          completeTest()
        }, 1500)
      }
    } catch (error) {
      toast.error('Failed to submit vote')
      logger.error('Failed to start test', error)
    }
  }

  const completeTest = async () => {
    if (!session) return

    try {
      const response = await fetch('/api/blind-test/gpt-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'complete_session',
          sessionId: session.sessionId
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error('Complete test error:', errorText)
        
        // Try to parse error details
        try {
          const errorData = JSON.parse(errorText)
          logger.error('Error details:', errorData.details)
          toast.error(`Failed to complete: ${errorData.details || 'Unknown error'}`)
        } catch {
          toast.error('Failed to complete test')
        }
        
        throw new Error('Failed to complete test')
      }

      const data = await response.json()
      setResults(data)
      setTestState('results')
      
      // Celebrate completion
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
    } catch (error) {
      toast.error('Failed to complete test')
      logger.error('Failed to start test', error)
    }
  }

  if (!isLoaded) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/10 to-black">
      <AnimatePresence mode="wait">
        {testState === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="container mx-auto px-4 py-16"
          >
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-12"
              >
                <div className="flex items-center justify-center gap-3 mb-6">
                  <Zap className="w-10 h-10 text-yellow-400" />
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    GPT-4o vs GPT-5
                  </h1>
                  <Zap className="w-10 h-10 text-yellow-400" />
                </div>
                <p className="text-xl text-gray-300 mb-4">
                  The Ultimate Blind Preference Test
                </p>
                <p className="text-gray-400">
                  5 quick questions to see which AI personality you prefer
                </p>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="bg-black/50 border-purple-500/30">
                    <CardHeader>
                      <Brain className="w-8 h-8 text-purple-400 mb-2" />
                      <CardTitle className="text-white">10 Questions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-400">
                        Carefully selected to test reasoning, creativity, and technical skills
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="bg-black/50 border-purple-500/30">
                    <CardHeader>
                      <Target className="w-8 h-8 text-green-400 mb-2" />
                      <CardTitle className="text-white">Blind Testing</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-400">
                        Responses are randomized - you won't know which model is which
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="bg-black/50 border-purple-500/30">
                    <CardHeader>
                      <Trophy className="w-8 h-8 text-yellow-400 mb-2" />
                      <CardTitle className="text-white">Win Rewards</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-400">
                        Complete the test to earn 100-500 bonus points with a scratch card!
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                {isSignedIn ? (
                  <>
                    <Button
                      size="lg"
                      onClick={startTest}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg"
                    >
                      Start Blind Test
                      <ChevronRight className="ml-2 w-5 h-5" />
                    </Button>
                    <p className="text-sm text-gray-500 mt-4">
                      Takes approximately 5-10 minutes to complete
                    </p>
                  </>
                ) : (
                  <div className="space-y-4">
                    <p className="text-yellow-400 mb-4">Sign in to participate and win rewards!</p>
                    <Button
                      size="lg"
                      onClick={() => router.push('/login')}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg"
                    >
                      Sign In to Start
                      <ChevronRight className="ml-2 w-5 h-5" />
                    </Button>
                    <p className="text-sm text-gray-500 mt-4">
                      Free account required to track your preferences
                    </p>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}

        {testState === 'testing' && session && (
          <motion.div
            key="testing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="container mx-auto px-4 py-8"
          >
            <div className="max-w-7xl mx-auto">
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">
                    Question {currentQuestion} of {session.totalQuestions}
                  </span>
                  <span className="text-sm text-gray-400">
                    {session.questions[currentQuestion - 1]?.category}
                  </span>
                </div>
                <Progress 
                  value={(currentQuestion / session.totalQuestions) * 100} 
                  className="h-2 bg-gray-800"
                />
              </div>

              {/* Question and Responses */}
              {currentResponses && !isLoadingResponses && (
                <BlindDualResponseCard
                  prompt={currentResponses.questionText}
                  leftModel={{
                    id: 'A',
                    name: 'Model A',
                    avatar: '/icons/chatgpt.png'
                  }}
                  rightModel={{
                    id: 'B',
                    name: 'Model B',
                    avatar: '/icons/chatgpt.png'
                  }}
                  leftResponse={currentResponses.responses.A}
                  rightResponse={currentResponses.responses.B}
                  onVote={handleVote}
                  voteSessionId={session.sessionId}
                  isLoading={isLoadingResponses}
                />
              )}

              {isLoadingResponses && (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <Sparkles className="w-12 h-12 text-purple-400 animate-pulse mx-auto mb-4" />
                    <p className="text-gray-400">Generating responses...</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {testState === 'results' && results && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="container mx-auto px-4 py-16"
          >
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-12"
              >
                <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
                <h2 className="text-4xl font-bold text-white mb-4">
                  Test Complete!
                </h2>
                <p className="text-xl text-gray-300">
                  You've earned {results.rewardPoints} points!
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-12"
              >
                <Card className="bg-black/50 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-white text-center">Your Preferences</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-400 mb-2">
                          {results.summary.gpt4oVotes}
                        </div>
                        <div className="text-gray-400">GPT-4o</div>
                        <div className="mt-2">
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500"
                              style={{ 
                                width: `${(results.summary.gpt4oVotes / results.summary.totalQuestions) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-400 mb-2">
                          {results.summary.gpt5Votes}
                        </div>
                        <div className="text-gray-400">GPT-5</div>
                        <div className="mt-2">
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500"
                              style={{ 
                                width: `${(results.summary.gpt5Votes / results.summary.totalQuestions) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {results.summary.gpt5Votes > results.summary.gpt4oVotes && (
                      <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                        <p className="text-center text-purple-300">
                          🎉 You preferred GPT-5 in this blind test!
                        </p>
                      </div>
                    )}
                    {results.summary.gpt4oVotes > results.summary.gpt5Votes && (
                      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="text-center text-blue-300">
                          🎯 You preferred GPT-4o in this blind test!
                        </p>
                      </div>
                    )}
                    {results.summary.gpt4oVotes === results.summary.gpt5Votes && (
                      <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <p className="text-center text-yellow-300">
                          ⚖️ You found both models equally impressive!
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center space-y-4"
              >
                {results.scratchCardAvailable && !showScratchCard && (
                  <Button
                    size="lg"
                    onClick={() => setShowScratchCard(true)}
                    className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white"
                  >
                    <Sparkles className="mr-2 w-5 h-5" />
                    Claim Your Scratch Card
                  </Button>
                )}

                <div className="flex gap-4 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/blind-test/gpt-challenge/analytics')}
                    className="border-purple-500/30 text-purple-400"
                  >
                    View Global Results
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="border-purple-500/30 text-purple-400"
                  >
                    Try Again
                  </Button>
                </div>
              </motion.div>

              {/* Scratch Card Modal */}
              <ScratchCardReveal
                reward={results.rewardPoints}
                onComplete={() => {
                  setShowScratchCard(false)
                  toast.success(`You won ${results.rewardPoints} points!`)
                }}
                isOpen={showScratchCard}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}