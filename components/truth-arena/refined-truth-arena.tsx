"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Target } from "lucide-react";
import { RefinedTruthCard } from "./refined-truth-card";
import { TokenCounter } from "./token-counter";
import { useTokenStore } from "@/store/token-store";
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
  const { tokens, earnToken, earnedThisSession, initializeTokens } = useTokenStore();
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
      // Initialize tokens from store
      initializeTokens();

      // Try to start refinement session, but don't block on failure
      try {
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
        } else {
          console.log("Failed to create session, continuing without it");
        }
      } catch (error) {
        console.log("Session API error, continuing without session:", error);
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
    console.log("[RefinedTruthArena] handleCardSelect called with:", responseId);
    console.log("[RefinedTruthArena] Current state:", { selectedCard, currentQuestion: currentQuestion?.id, sessionId });
    
    if (selectedCard || !currentQuestion) {
      console.log("[RefinedTruthArena] Early return - conditions not met", {
        selectedCard: !!selectedCard,
        hasCurrentQuestion: !!currentQuestion,
        hasSessionId: !!sessionId
      });
      return;
    }
    
    setSelectedCard(responseId);
    console.log("[RefinedTruthArena] Selected card set to:", responseId);
    
    // Find the selected response
    const selectedResponse = currentQuestion.responses.find(r => r.id === responseId);
    if (!selectedResponse) {
      console.log("[RefinedTruthArena] Selected response not found");
      return;
    }

    // Show results immediately with mock data if API fails
    const showResultsAndAdvance = (agreementPercent: number = Math.floor(Math.random() * 40) + 50) => {
      console.log("[RefinedTruthArena] Showing results and advancing");
      
      // Reveal data after selection
      setRevealData({
        modelName: selectedResponse.modelName || "Unknown",
        provider: selectedResponse.provider || "Unknown",
        agreementPercent
      });
      setShowResults(true);

      // Earn token
      handleEarnToken();
      
      // Auto advance after showing results
      console.log("[RefinedTruthArena] Setting timeout to advance...");
      setTimeout(() => {
        console.log("[RefinedTruthArena] Timeout fired, calling advanceToNext");
        advanceToNext();
      }, 2000);
    };

    // Try to record to API, but don't block on failure
    if (sessionId) {
      try {
        console.log("[RefinedTruthArena] Sending refinement to API...");
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
          console.log("[RefinedTruthArena] API response OK, agreement:", agreementPercent);
          showResultsAndAdvance(agreementPercent);
        } else {
          console.log("[RefinedTruthArena] API response not OK:", response.status);
          showResultsAndAdvance();
        }
      } catch (error) {
        console.error("[RefinedTruthArena] Error recording refinement:", error);
        showResultsAndAdvance();
      }
    } else {
      console.log("[RefinedTruthArena] No session ID, using mock data");
      showResultsAndAdvance();
    }
  };

  const handleEarnToken = () => {
    setIsEarning(true);
    earnToken(); // Use token store method
    
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
    console.log("[RefinedTruthArena] advanceToNext called");
    console.log("[RefinedTruthArena] Current questionsRefined:", questionsRefined);
    console.log("[RefinedTruthArena] Queue length:", questionQueue.length);
    
    // Clear current state
    setSelectedCard(null);
    setFocusedCard(null);
    setShowResults(false);
    setRevealData(null);
    
    // Move to next question
    setQuestionsRefined(prev => {
      const nextIndex = prev + 1;
      console.log("[RefinedTruthArena] Next index will be:", nextIndex);
      
      // Load next question from queue
      if (nextIndex < questionQueue.length) {
        console.log("[RefinedTruthArena] Setting next question:", questionQueue[nextIndex].id);
        setCurrentQuestion(questionQueue[nextIndex]);
      } else {
        console.log("[RefinedTruthArena] No more questions, showing completion");
        // Show completion screen
        setCurrentQuestion(null);
      }
      
      return nextIndex;
    });
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
          <h2 className="text-3xl md:text-4xl font-semibold text-zinc-100 mb-4 font-display tracking-tight">Refinery Complete!</h2>
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
    <div className={`min-h-screen bg-gradient-to-b from-black to-zinc-900 p-4 safe-top safe-bottom ${className}`}>
      {/* Header */}
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/ask" className="text-zinc-400 hover:text-zinc-200 transition-colors p-2 -ml-2">
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
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center mb-12"
          >
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 leading-tight px-4">
              {currentQuestion.question}
            </h1>
          </motion.div>
        </AnimatePresence>

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