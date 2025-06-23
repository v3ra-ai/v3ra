"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Target } from "lucide-react";
import { RefinedTruthCard } from "./refined-truth-card";
import { TokenCounter } from "./token-counter";
// import { supabase } from "@/lib/supabase-client"; // Not currently used
import Link from "next/link";

interface CleanResponse {
  id: string;
  answer: "YES" | "NO";
  text: string;
  // Hidden until after selection
  modelName?: string;
  provider?: string;
}

interface RefineQuestion {
  id: string;
  question: string;
  responses: CleanResponse[];
}

interface RefinedTruthArenaProps {
  className?: string;
}

export function RefinedTruthArena({ className = "" }: RefinedTruthArenaProps) {
  const [currentQuestion, setCurrentQuestion] = useState<RefineQuestion | null>(null);
  const [questionQueue, setQuestionQueue] = useState<RefineQuestion[]>([]);
  const [questionsRefined, setQuestionsRefined] = useState(0);
  const [tokens, setTokens] = useState(50); // Starting tokens
  const [earnedThisSession, setEarnedThisSession] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [focusedCard, setFocusedCard] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [revealData, setRevealData] = useState<{modelName: string; provider: string; agreementPercent: number} | null>(null);
  const [isEarning, setIsEarning] = useState(false);

  // Initialize session and load questions
  useEffect(() => {
    initializeRefinery();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const initializeRefinery = async () => {
    try {
      // Load user tokens (in real app, this would come from backend)
      const savedTokens = localStorage.getItem("user-tokens");
      if (savedTokens) {
        setTokens(parseInt(savedTokens));
      }

      // Start refinement session
      const response = await fetch("/api/truth-arena/refine", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: null, // TODO: Get from auth
          userWallet: null,
          streakCount: 0
        })
      });
      
      if (response.ok) {
        const { sessionId: newSessionId } = await response.json();
        setSessionId(newSessionId);
      }

      // Load questions (stripped down for refinery)
      await loadQuestionsForRefinery();
      
    } catch (error) {
      console.error("Error initializing refinery:", error);
      setIsLoading(false);
    }
  };

  const loadQuestionsForRefinery = async () => {
    try {
      const response = await fetch("/api/truth-arena/questions?limit=20");
      if (response.ok) {
        const { questions } = await response.json();
        
        // Strip down questions to just essentials for refinery
        const refinedQuestions = questions.map((q: {id: string; question: string; responses: {id: string; answer: string; rationale: string; modelName: string; provider: string}[]}) => ({
          id: q.id,
          question: q.question,
          responses: q.responses.map((r: {id: string; answer: string; rationale: string; modelName: string; provider: string}) => ({
            id: r.id,
            answer: r.answer,
            text: r.rationale, // Use rationale as the response text
            // Keep metadata hidden until after selection
            modelName: r.modelName,
            provider: r.provider
          }))
        }));

        setQuestionQueue(refinedQuestions);
        if (refinedQuestions.length > 0) {
          setCurrentQuestion(refinedQuestions[0]);
        }
      }
    } catch (error) {
      console.error("Error loading questions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardSelect = async (responseId: string) => {
    if (selectedCard || !currentQuestion || !sessionId) return;
    
    setSelectedCard(responseId);
    
    // Find the selected response
    const selectedResponse = currentQuestion.responses.find(r => r.id === responseId);
    if (!selectedResponse) return;

    try {
      // Record the refinement
      const response = await fetch("/api/truth-arena/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          voteSessionId: currentQuestion.id,
          questionText: currentQuestion.question,
          selectedResponseId: responseId,
          selectedModelName: selectedResponse.modelName,
          selectedProvider: selectedResponse.provider,
          selectedAnswer: selectedResponse.answer,
          responseTimeMs: Date.now()
        })
      });

      if (response.ok) {
        const { agreementPercent } = await response.json();
        
        // Reveal data after selection
        setRevealData({
          modelName: selectedResponse.modelName || "Unknown",
          provider: selectedResponse.provider || "Unknown",
          agreementPercent
        });
        setShowResults(true);

        // Earn token
        earnToken();
        
        // Auto advance after showing results
        setTimeout(() => {
          advanceToNext();
        }, 3000);
      }
    } catch (error) {
      console.error("Error recording refinement:", error);
      // Still advance on error
      setTimeout(() => {
        advanceToNext();
      }, 1000);
    }
  };

  const earnToken = () => {
    setIsEarning(true);
    setTokens(prev => {
      const newTokens = prev + 1;
      localStorage.setItem("user-tokens", newTokens.toString());
      return newTokens;
    });
    setEarnedThisSession(prev => prev + 1);
    
    // Stop earning animation after a moment
    setTimeout(() => setIsEarning(false), 1000);
  };

  const handleCardFocus = (responseId: string) => {
    if (selectedCard) return; // Can't focus when already selected
    setFocusedCard(responseId);
  };

  const handleCardBlur = () => {
    setFocusedCard(null);
  };

  const advanceToNext = () => {
    setQuestionsRefined(prev => prev + 1);
    setSelectedCard(null);
    setFocusedCard(null);
    setShowResults(false);
    setRevealData(null);
    
    // Load next question from queue
    const nextIndex = questionsRefined + 1;
    if (nextIndex < questionQueue.length) {
      setCurrentQuestion(questionQueue[nextIndex]);
    } else {
      // Show completion screen
      setCurrentQuestion(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-black to-zinc-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-cyan-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-cyan-400 text-lg">Loading Refinery...</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-black to-zinc-900 p-4">
        <div className="text-center max-w-md">
          <Target className="h-16 w-16 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-zinc-100 mb-2">Refinery Complete!</h2>
          <p className="text-zinc-400 mb-2">You refined {questionsRefined} truths and earned {earnedThisSession} tokens.</p>
          <p className="text-cyan-400 font-bold mb-6">Total Tokens: {tokens}</p>
          
          <div className="flex gap-3">
            <Link href="/ask" className="flex-1">
              <motion.button
                className="w-full bg-gradient-to-r from-cyan-500 to-pink-500 text-black px-6 py-3 rounded-full font-bold"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Ask Questions (-10 tokens)
              </motion.button>
            </Link>
            <motion.button
              className="flex-1 bg-zinc-800 text-zinc-200 px-6 py-3 rounded-full font-bold border border-zinc-700 hover:border-zinc-600"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.reload()}
            >
              Refine More
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b from-black to-zinc-900 p-4 ${className}`}>
      {/* Header */}
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/ask" className="text-zinc-400 hover:text-zinc-200 transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          
          <TokenCounter 
            tokens={tokens}
            earnedThisSession={earnedThisSession}
            isEarning={isEarning}
          />
          
          <div className="text-zinc-400 text-sm">
            {questionsRefined + 1}/{questionQueue.length}
          </div>
        </div>

        {/* Question */}
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 leading-tight px-4">
            {currentQuestion.question}
          </h1>
        </motion.div>

        {/* Response Cards */}
        <div className={`space-y-6 max-w-2xl mx-auto transition-all duration-300 ${focusedCard ? 'relative z-10' : ''}`}>
          <AnimatePresence>
            {currentQuestion.responses.map((response, index) => (
              <RefinedTruthCard
                key={response.id}
                response={response}
                index={index}
                isSelected={selectedCard === response.id}
                isOtherSelected={selectedCard !== null && selectedCard !== response.id}
                isFocused={focusedCard === response.id}
                onFocus={() => handleCardFocus(response.id)}
                onBlur={handleCardBlur}
                onSelect={() => handleCardSelect(response.id)}
                showResults={showResults}
                revealData={selectedCard === response.id ? revealData || undefined : undefined}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Instructions */}
        {!selectedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-8 text-zinc-500 text-sm"
          >
            {focusedCard ? (
              <>
                Swipe left or right to select
                <div className="text-emerald-400 text-xs mt-1">+1 token for your choice</div>
              </>
            ) : (
              <>
                Press and hold to read full reasoning
                <div className="text-cyan-400 text-xs mt-1">Then swipe to select</div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}