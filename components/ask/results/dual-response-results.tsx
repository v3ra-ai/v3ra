"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BlindDualResponseCard } from "@/src/features/ai-versus/components/BlindDualResponseCard";
import { ScratchCardReveal } from "@/src/features/rewards/scratch-card/ScratchCardReveal";
import { useVoteHistory } from "@/hooks/useVoteHistory";
import { useVoteStore } from "@/store/vote-store";
import { useUserPoints } from "@/hooks/useUserPoints";
import { ErrorDisplay } from "@/components/error-display";
import { AILoadingSpinner } from "@/components/ai-loading-spinner";
import { toast } from "sonner";
import { logger } from "@/lib/utils/client-logger";
import { triggerPointsExplosion } from "@/components/effects/points-explosion";

interface DualResponseResultsProps {
  philosophyMode?: boolean;
}

export default function DualResponseResults({ philosophyMode = false }: DualResponseResultsProps) {
  const { voteHistory, isLoading, error, refetch } = useVoteHistory();
  const { lastVoteResult, setLastVoteResult } = useVoteStore();
  const { updatePoints, refreshPoints } = useUserPoints();
  
  // State for dual comparison
  const [selectedPair, setSelectedPair] = useState<[number, number] | null>(null);
  const [showScratchCard, setShowScratchCard] = useState(false);
  const [scratchReward, setScratchReward] = useState(0);
  const [hasVotedOnCurrent, setHasVotedOnCurrent] = useState(false);
  const [votedQueryIds, setVotedQueryIds] = useState<Set<string>>(() => {
    // Initialize from localStorage to persist across page refreshes
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('votedQueryIds');
      if (stored) {
        try {
          return new Set(JSON.parse(stored));
        } catch {
          return new Set();
        }
      }
    }
    return new Set();
  });
  const [currentQueryIndex, setCurrentQueryIndex] = useState(0);

  // Persist voted queries to localStorage and clean up old entries
  useEffect(() => {
    if (votedQueryIds.size > 0) {
      // Keep only IDs that exist in current voteHistory to prevent unlimited growth
      const currentHistoryIds = new Set(voteHistory.map(q => q.id));
      const relevantVotedIds = Array.from(votedQueryIds).filter(id => currentHistoryIds.has(id));
      
      localStorage.setItem('votedQueryIds', JSON.stringify(relevantVotedIds));
      
      // Update state if we cleaned up any IDs
      if (relevantVotedIds.length < votedQueryIds.size) {
        setVotedQueryIds(new Set(relevantVotedIds));
      }
    }
  }, [votedQueryIds, voteHistory]);

  // Get the most recent query - if lastVoteResult exists use it, otherwise find next unvoted query
  const mostRecentQuery = lastVoteResult || voteHistory.find((query, index) => {
    if (!votedQueryIds.has(query.id)) {
      setCurrentQueryIndex(index);
      return true;
    }
    return false;
  });

  // Initialize selected pair when data loads
  useEffect(() => {
    if (mostRecentQuery?.validatorResponses && mostRecentQuery.validatorResponses.length >= 2) {
      // Default to first two models
      setSelectedPair([0, 1]);
      setHasVotedOnCurrent(false);
    }
  }, [mostRecentQuery?.id]);

  const handleVote = async (winnerId: string, voteReason: string, timeToDecide: number) => {
    if (hasVotedOnCurrent || !mostRecentQuery || !selectedPair) return;
    
    try {
      // Determine winner and loser from the selected pair
      const winningValidatorId = winnerId;
      const responses = mostRecentQuery.validatorResponses;
      const leftIndex = selectedPair[0];
      const rightIndex = selectedPair[1];
      
      // The loser is the other model in the current pair
      const losingValidatorId = winnerId === responses[leftIndex].id 
        ? responses[rightIndex].id 
        : responses[leftIndex].id;
      
      if (!losingValidatorId) {
        logger.error('Could not determine losing validator');
        return;
      }
      
      // Debug log to see what IDs we're working with
      logger.info('Vote submission IDs', {
        winningValidatorId,
        losingValidatorId,
        voteReason,
        winnerId,
        leftId: responses[leftIndex].id,
        rightId: responses[rightIndex].id,
        availableResponses: mostRecentQuery.validatorResponses.map(r => ({
          id: r.id,
          profileName: r.profileName
        }))
      });

      // Submit vote to backend with CSRF protection
      const { fetchWithCSRF } = await import('@/lib/utils/csrf');
      const response = await fetchWithCSRF('/api/vote/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voteSessionId: mostRecentQuery.id,
          winningValidatorId,
          losingValidatorId,
          voteReason,
          voteStrength: 3, // Default strength
          timeToDecide: Math.round(timeToDecide / 1000), // Convert to seconds
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        logger.error('Vote submission failed', { status: response.status, errorData });
        logger.error('Vote submission details', {
          voteSessionId: mostRecentQuery.id,
          winningValidatorId,
          losingValidatorId,
          voteReason,
          timeToDecide: Math.round(timeToDecide / 1000)
        });
        throw new Error(errorData.error || `Failed to submit vote (${response.status})`);
      }

      const data = await response.json();
      
      // Use the actual reward from the server
      setScratchReward(data.scratchCardReward || 50);
      setShowScratchCard(true);
      setHasVotedOnCurrent(true);
      
      // Mark this query as voted
      setVotedQueryIds(prev => new Set(prev).add(mostRecentQuery.id));
      
      // Update user points with the new balance from server
      if (data.newUserPoints !== undefined) {
        updatePoints(data.newUserPoints);
        // Also refresh points to ensure sync across all components
        refreshPoints();
      }
      
      // Show voting feedback
      toast.success("Vote recorded! Scratch to reveal your reward.");
    } catch (error) {
      logger.error('Vote submission error', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to submit vote. Please try again.";
      toast.error(errorMessage);
    }
  };

  const handleScratchComplete = () => {
    setShowScratchCard(false);
    // Clear lastVoteResult so that the next blind-test query becomes the active comparison
    setLastVoteResult(null);
    // Reset voting state for the next query
    setHasVotedOnCurrent(false);
    // Points are already updated from the server response, don't add again
    
    // Particle effect at points display
    const pointsElement = document.querySelector('[data-points-display]');
    if (pointsElement) {
      const rect = pointsElement.getBoundingClientRect();
      triggerPointsExplosion(scratchReward, {
        clientX: rect.x + rect.width / 2,
        clientY: rect.y
      } as MouseEvent);
    }
  };



  if (error) {
    return <ErrorDisplay message={error.message} onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <AILoadingSpinner />
        </div>
      </div>
    );
  }

  if (!mostRecentQuery || !mostRecentQuery.validatorResponses || mostRecentQuery.validatorResponses.length < 2) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl text-center">
        <p className="text-white/60 text-lg">
        Ask your first question to start earning points! 🎯
        </p>
      </div>
    );
  }

  const responses = mostRecentQuery.validatorResponses;
  const leftIndex = selectedPair?.[0] ?? 0;
  const rightIndex = selectedPair?.[1] ?? 1;
  
  const leftModel = {
    id: responses[leftIndex].id,
    name: responses[leftIndex].profileName,
    provider: responses[leftIndex].provider,
  };
  
  const rightModel = {
    id: responses[rightIndex].id,
    name: responses[rightIndex].profileName,
    provider: responses[rightIndex].provider,
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-6xl">


        {/* Dual Response Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${leftIndex}-${rightIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <BlindDualResponseCard
              prompt={mostRecentQuery.queryText}
              leftModel={leftModel}
              rightModel={rightModel}
              leftResponse={responses[leftIndex].rationale}
              rightResponse={responses[rightIndex].rationale}
              onVote={(position: 'A' | 'B', voteReason: string, timeToDecide: number) => {
                // Translate position to actual model ID
                if (!selectedPair) return;
                const winnerId = position === 'A' 
                  ? responses[selectedPair[0]].id 
                  : responses[selectedPair[1]].id;
                handleVote(winnerId, voteReason, timeToDecide);
              }}
              voteSessionId={mostRecentQuery.id}
              isLoading={false}
            />
          </motion.div>
        </AnimatePresence>


      </div>

      {/* Scratch Card Reward */}
      <ScratchCardReveal
        reward={scratchReward}
        isOpen={showScratchCard}
        onComplete={handleScratchComplete}
      />
    </>
  );
}

// Helper function to show points animation
function showPointsAnimation(x: number, y: number, points: number) {
  const element = document.createElement('div');
  element.className = 'fixed z-50 pointer-events-none text-3xl font-bold text-yellow-400';
  element.textContent = `+${points}`;
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
  
  document.body.appendChild(element);
  
  // Animate upward and fade out
  element.animate([
    { transform: 'translateY(0)', opacity: 1 },
    { transform: 'translateY(-100px)', opacity: 0 }
  ], {
    duration: 1500,
    easing: 'ease-out'
  }).onfinish = () => element.remove();
}
