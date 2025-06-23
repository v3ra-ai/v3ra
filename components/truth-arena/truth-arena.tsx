"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Target, Users } from "lucide-react";
import { TruthCard } from "./truth-card";
import { ProgressBar } from "./progress-bar";
import { ArenaOnboarding } from "./arena-onboarding";
import { supabase } from "@/lib/supabase-client";

interface AIResponse {
  id: string;
  modelName: string;
  answer: "YES" | "NO";
  rationale: string;
  provider: string;
}

interface ArenaQuestion {
  id: string;
  question: string;
  responses: AIResponse[];
  userVotes?: number; // How many users have refined this
}

interface TruthArenaProps {
  className?: string;
}

export function TruthArena({ className = "" }: TruthArenaProps) {
  const [currentQuestion, setCurrentQuestion] = useState<ArenaQuestion | null>(null);
  const [questionQueue, setQuestionQueue] = useState<ArenaQuestion[]>([]);
  const [questionsRefined, setQuestionsRefined] = useState(0);
  const [streak] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [agreementPercent, setAgreementPercent] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Initialize session and load questions
  useEffect(() => {
    // Check if user has seen onboarding before
    const hasSeenOnboarding = localStorage.getItem("truth-arena-onboarding-seen");
    if (hasSeenOnboarding) {
      setShowOnboarding(false);
    }
    
    initializeArena();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOnboardingComplete = () => {
    localStorage.setItem("truth-arena-onboarding-seen", "true");
    setShowOnboarding(false);
  };

  const initializeArena = async () => {
    try {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      setUserEmail(session?.user?.email || null);
      
      // Start refinement session
      const response = await fetch("/api/truth-arena/refine", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: session?.user?.email,
          userWallet: null, // TODO: Get from wallet if connected
          streakCount: streak
        })
      });
      
      if (response.ok) {
        const { sessionId: newSessionId } = await response.json();
        setSessionId(newSessionId);
      }

      // Load questions
      await loadQuestions();
      
    } catch (error) {
      console.error("Error initializing arena:", error);
      setIsLoading(false);
    }
  };

  const loadQuestions = async () => {
    try {
      const response = await fetch("/api/truth-arena/questions?limit=20");
      if (response.ok) {
        const { questions } = await response.json();
        setQuestionQueue(questions);
        if (questions.length > 0) {
          setCurrentQuestion(questions[0]);
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
          responseTimeMs: Date.now(), // Could track actual response time
          userEmail
        })
      });

      if (response.ok) {
        const { agreementPercent: agreement } = await response.json();
        setAgreementPercent(agreement);
        setShowResults(true);
        
        // Auto advance after showing results
        setTimeout(() => {
          advanceToNext();
        }, 2500);
      }
    } catch (error) {
      console.error("Error recording refinement:", error);
      // Still advance on error
      setTimeout(() => {
        advanceToNext();
      }, 1000);
    }
  };

  const advanceToNext = () => {
    setQuestionsRefined(prev => prev + 1);
    setSelectedCard(null);
    setShowResults(false);
    
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
          <p className="text-cyan-400 text-lg">Loading Truth Arena...</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-black to-zinc-900">
        <div className="text-center max-w-md">
          <Target className="h-16 w-16 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-zinc-100 mb-2">Arena Complete!</h2>
          <p className="text-zinc-400 mb-6">You refined {questionsRefined} truths today.</p>
          <motion.button
            className="bg-gradient-to-r from-cyan-500 to-pink-500 text-black px-8 py-3 rounded-full font-bold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
          >
            Refine More Truth
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b from-black to-zinc-900 p-4 ${className}`}>
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-orange-400">
              <Flame className="h-5 w-5" />
              <span className="font-bold">{streak}</span>
              <span className="text-zinc-400 text-sm">day streak</span>
            </div>
            <div className="flex items-center gap-2 text-cyan-400">
              <Users className="h-5 w-5" />
              <span className="text-zinc-400 text-sm">{currentQuestion.userVotes} refined this</span>
            </div>
          </div>
          <div className="text-zinc-400 text-sm">
            Refining truth... {questionsRefined + 1}/{questionQueue.length}
          </div>
        </div>

        <ProgressBar current={questionsRefined + 1} total={questionQueue.length} />

        {/* Question */}
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 leading-tight">
            {currentQuestion.question}
          </h1>
        </motion.div>

        {/* Response Cards */}
        <div className="flex flex-col items-center space-y-4 max-w-2xl mx-auto">
          <AnimatePresence>
            {currentQuestion.responses.map((response, index) => (
              <TruthCard
                key={response.id}
                response={response}
                index={index}
                total={currentQuestion.responses.length}
                isSelected={selectedCard === response.id}
                isOtherSelected={selectedCard !== null && selectedCard !== response.id}
                onSelect={() => handleCardSelect(response.id)}
                showResults={showResults}
                agreementPercent={selectedCard === response.id ? agreementPercent : 0}
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
            Tap the response that feels most true to you
          </motion.div>
        )}
      </div>

      {/* Onboarding */}
      {showOnboarding && (
        <ArenaOnboarding onComplete={handleOnboardingComplete} />
      )}
    </div>
  );
}